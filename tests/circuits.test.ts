import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  CircuitRepository,
  evaluateTrackPhysics,
  getRawGeoJsonFeatureMeta,
  loadAllAvailableCircuitPackages,
  loadCircuitHistoricalPackages,
  loadCircuitPackage,
  loadPilotAlbertPark2026,
  loadSeasonPackages,
} from '../src/circuits/index.ts';
import { getInitialFacilities, INITIAL_FACILITIES, INITIAL_STAFF } from '../src/data/f1Data.ts';
import { FIA_2026_DEFAULT_EDITION } from '../src/engine/modules/m03Packaging.ts';
import { evaluateGate11, runRaceSimulation } from '../src/engine/modules/m11RaceSimulation.ts';
import { DEFAULT_VEHICLE_PARAMS, solveVehiclePhysics } from '../src/engine/physicsEngine.ts';

describe('Circuitos Reais F1 2026 & Piloto Albert Park', () => {
  it('valida o circuito piloto Albert Park 2026 (5278 m, 14 curvas, 58 voltas, 306.124 km, GeoJSON au-1953)', () => {
    const pkg = loadPilotAlbertPark2026();

    expect(pkg.metadata.circuitCode).toBe('albert_park');
    expect(pkg.metadata.geojsonId).toBe('au-1953');
    expect(pkg.metadata.round).toBe(1);
    expect(pkg.metadata.officialLengthM).toBe(5278);
    expect(pkg.metadata.officialCorners).toBe(14);
    expect(pkg.metadata.laps).toBe(58);
    expect(pkg.metadata.officialRaceDistanceKm).toBeCloseTo(306.124, 3);

    expect(pkg.points.length).toBeGreaterThanOrEqual(140);
    expect(pkg.validation.valid).toBe(true);
    expect(pkg.validation.hasFiniteGeometry).toBe(true);
    expect(pkg.validation.calculatedLengthM).toBeGreaterThan(5150);
    expect(pkg.validation.calculatedLengthM).toBeLessThan(5400);
    expect(Math.abs(pkg.validation.lengthDeltaPct)).toBeLessThan(2.0);

    // Honest provenance: never fake FIA telemetry certification
    expect(pkg.metadata.provenance.confidence).toBe('referencia_inicial');
    expect(pkg.metadata.provenance.certificationStatus).toBe('initial_geometry_reference');
    expect(pkg.validation.certificationStatus).toBe('initial_geometry_reference');
  });

  it('carrega todos os 24 circuitos do calendário oficial 2026 (incluindo Round 16 Madring) sem NaNs e com conservação de extensão', () => {
    const seasonPackages = loadSeasonPackages(2026);
    expect(seasonPackages).toHaveLength(24);

    const madring = seasonPackages.find((p) => p.metadata.circuitCode === 'madring');
    expect(madring).toBeDefined();
    expect(madring!.metadata.round).toBe(16);
    expect(madring!.metadata.geojsonId).toBe('es-2026');

    for (const pkg of seasonPackages) {
      expect(pkg.points.length).toBeGreaterThanOrEqual(40);
      expect(pkg.svgCenterlinePath.length).toBeGreaterThan(20);
      expect(pkg.corners.length).toBeGreaterThan(0);
      expect(pkg.pitLane.pitBoxes).toHaveLength(12);
      expect(pkg.validation.hasFiniteGeometry).toBe(true);

      const segmentTotalM = pkg.segments.reduce((acc, s) => acc + s.lengthM, 0);
      expect(Math.abs(segmentTotalM - pkg.metadata.officialLengthM)).toBeLessThanOrEqual(2.5);

      for (const pt of pkg.points) {
        expect(Number.isFinite(pt.xM)).toBe(true);
        expect(Number.isFinite(pt.yM)).toBe(true);
        expect(Number.isFinite(pt.svgX)).toBe(true);
        expect(Number.isFinite(pt.svgY)).toBe(true);
        expect(Number.isFinite(pt.elevationM)).toBe(true);
      }
    }
  });

  it('preserva snapshots históricos da temporada 2025 (Imola & Albert Park 2025) de forma imutável ao atualizar 2026', () => {
    const repo = new CircuitRepository();
    const imola2025 = repo.getCircuit('imola', 2025);
    const albert2025Before = repo.getCircuit('albert_park', 2025);
    const albert2026 = repo.getCircuit('albert_park', 2026);

    expect(imola2025).toBeDefined();
    expect(imola2025!.officialLengthM).toBe(4909);
    expect(albert2025Before).toBeDefined();
    expect(albert2025Before!.versionTag).toBe('2025.1-historical');
    expect(albert2026).toBeDefined();

    // Update 2026 metadata version in repository and assert 2025 stays untouched
    repo.upsertSeasonVersion({
      ...albert2026!,
      officialLengthM: 5285,
      versionTag: '2026.2-updated',
    });

    const albert2026After = repo.getCircuit('albert_park', 2026);
    const albert2025After = repo.getCircuit('albert_park', 2025);
    expect(albert2026After!.officialLengthM).toBe(5285);
    expect(albert2025After!.officialLengthM).toBe(5278);
    expect(albert2025After!.versionTag).toBe('2025.1-historical');
  });

  it('acopla TrackPhysics por geometria real (altitude do México vs Albert Park, Modo X de Monza vs Mônaco) e integra M11 + Gate 11', () => {
    const physics = solveVehiclePhysics(DEFAULT_VEHICLE_PARAMS);
    const albertPkg = loadCircuitPackage('albert_park', 2026);
    const mexicoPkg = loadCircuitPackage('mexico', 2026);
    const monzaPkg = loadCircuitPackage('monza', 2026);
    const monacoPkg = loadCircuitPackage('monaco', 2026);
    const madringPkg = loadCircuitPackage('madring', 2026);

    const evalAlbert = evaluateTrackPhysics(albertPkg, DEFAULT_VEHICLE_PARAMS, physics);
    const evalMexico = evaluateTrackPhysics(mexicoPkg, DEFAULT_VEHICLE_PARAMS, physics);
    const evalMonza = evaluateTrackPhysics(monzaPkg, DEFAULT_VEHICLE_PARAMS, physics);
    const evalMonaco = evaluateTrackPhysics(monacoPkg, DEFAULT_VEHICLE_PARAMS, physics);

    expect(evalMexico.airDensityKgM3).toBeLessThan(evalAlbert.airDensityKgM3);
    expect(evalMonza.modeXFractionPct).toBeGreaterThan(evalMonaco.modeXFractionPct);
    expect(Number.isFinite(evalAlbert.totalPredictedLapTimeSec)).toBe(true);
    expect(evalAlbert.totalPredictedLapTimeSec).toBeGreaterThan(55);

    for (const pkg of [albertPkg, madringPkg]) {
      const race = runRaceSimulation(
        DEFAULT_VEHICLE_PARAMS,
        {
          circuitCode: pkg.metadata.circuitCode,
          fidelityMode: 'dynamic',
          weather: 'dry_clear',
          initialFuelKg: 76,
          stints: [
            { compound: 'medium', lapsCount: 24 },
            { compound: 'hard', lapsCount: 30 },
          ],
          trafficFollowGapS: 1.1,
          pitStopDurationS: pkg.metadata.pitLaneLossSec,
        },
        FIA_2026_DEFAULT_EDITION
      );
      expect(race.massAndFuelBalance.fuelConserved).toBe(true);
      expect(race.energySummary.energyConserved).toBe(true);
      expect(evaluateGate11(race).passed).toBe(true);
    }
  });

  it('cumpre regras estruturais do GDD v9.0.0: 15+1 instalações Nível 1, 4 Chefes diretos e domínio src/circuits puro sem React', () => {
    expect(INITIAL_FACILITIES).toHaveLength(15);
    expect(INITIAL_FACILITIES.every((f) => f.level === 1)).toBe(true);
    expect(INITIAL_FACILITIES.filter((f) => f.category === 'desenvolvimento')).toHaveLength(6);
    expect(INITIAL_FACILITIES.filter((f) => f.category === 'pessoal')).toHaveLength(3);
    expect(INITIAL_FACILITIES.filter((f) => f.category === 'operacoes')).toHaveLength(6);

    const worksFacilities = getInitialFacilities(true);
    expect(worksFacilities).toHaveLength(16);
    expect(worksFacilities.some((f) => f.id === 'fac_pu_factory' && f.isWorksExclusive)).toBe(true);

    const requiredChiefRoles = ['head_aero', 'head_pu', 'sporting_director', 'chief_mechanic'] as const;
    for (const role of requiredChiefRoles) {
      expect(INITIAL_STAFF.some((s) => s.role === role)).toBe(true);
    }

    // Domain separation: zero 'react' imports inside src/circuits
    const circuitsDir = path.resolve(process.cwd(), 'src/circuits');
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) files.push(full);
      }
    };
    walk(circuitsDir);
    expect(files.length).toBeGreaterThanOrEqual(7);
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/from\s+['"]react['"]/);
      expect(content).not.toMatch(/require\(['"]react['"]\)/);
    }
  });

  it('expõe o catálogo completo de 31 circuitos (24 calendário + 7 reserva/históricos), versões históricas e metadados GeoJSON brutos', () => {
    const all31 = loadAllAvailableCircuitPackages(2026);
    expect(all31).toHaveLength(31);
    expect(all31.filter((p) => p.metadata.inCalendar && p.metadata.seasonYear === 2026)).toHaveLength(24);
    expect(all31.filter((p) => !p.metadata.inCalendar || p.metadata.seasonYear !== 2026)).toHaveLength(7);

    const albertVersions = loadCircuitHistoricalPackages('albert_park');
    expect(albertVersions.map((p) => p.metadata.seasonYear)).toEqual([2026, 2025]);

    const rawAu = getRawGeoJsonFeatureMeta('au-1953');
    expect(rawAu).not.toBeNull();
    expect(rawAu!.opened).toBe(1953);
    expect(rawAu!.firstgp).toBe(1996);
    expect(rawAu!.geojsonLengthM).toBe(5278);
    expect(rawAu!.pointCount).toBeGreaterThanOrEqual(140);
  });
});
