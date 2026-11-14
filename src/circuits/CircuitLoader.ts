import type { TrackCharacteristicsSi } from '../engine/modules/m02Philosophy.ts';
import type { CircuitSegmentSpec } from '../engine/modules/m11RaceSimulation.ts';
import type { Circuit } from '../types/f1.ts';
import { REAL_CIRCUITS_GEOJSON } from './data/realCircuitsGeoJson.ts';
import { defaultCircuitRepository, type CircuitRepository } from './CircuitRepository.ts';
import { processRealCircuitGeometry } from './GeometryProcessor.ts';
import { validateProcessedCircuit } from './CircuitValidator.ts';
import type { ProcessedCircuitPackage, SeasonCircuitMetadata } from './types.ts';

const packageCache = new Map<string, ProcessedCircuitPackage>();

export function loadCircuitPackage(
  circuitCode: string,
  seasonYear: number = 2026,
  repository: CircuitRepository = defaultCircuitRepository
): ProcessedCircuitPackage {
  const cacheKey = `${seasonYear}::${circuitCode}`;
  if (repository === defaultCircuitRepository && packageCache.has(cacheKey)) {
    return packageCache.get(cacheKey)!;
  }

  const metadata = repository.getCircuit(circuitCode, seasonYear);
  if (!metadata) {
    throw new Error(`Circuito não encontrado no repositório: ${circuitCode} (${seasonYear}).`);
  }

  const rawGeo = REAL_CIRCUITS_GEOJSON[metadata.geojsonId];
  if (!rawGeo) {
    throw new Error(`Geometria GeoJSON ausente para id=${metadata.geojsonId} (${circuitCode}).`);
  }

  const processed = processRealCircuitGeometry(rawGeo, metadata);
  const validated = validateProcessedCircuit(processed);
  const pkg: ProcessedCircuitPackage = {
    ...processed,
    validation: validated,
  };

  if (repository === defaultCircuitRepository) {
    packageCache.set(cacheKey, pkg);
  }
  return pkg;
}

export function loadSeasonPackages(
  seasonYear: number = 2026,
  repository: CircuitRepository = defaultCircuitRepository
): ProcessedCircuitPackage[] {
  const calendar: SeasonCircuitMetadata[] = repository.getSeasonCalendar(seasonYear);
  return calendar.map(meta => loadCircuitPackage(meta.circuitCode, meta.seasonYear, repository));
}

export function loadPilotAlbertPark2026(): ProcessedCircuitPackage {
  return loadCircuitPackage('albert_park', 2026);
}

export function loadSeasonCircuits(seasonYear: number = 2026): Circuit[] {
  return loadSeasonPackages(seasonYear).map(pkg => ({
    id: pkg.metadata.circuitCode,
    round: pkg.metadata.round,
    name: pkg.metadata.name,
    officialGpTitle: pkg.metadata.officialGpTitle,
    country: pkg.metadata.country,
    city: pkg.metadata.city,
    gpDateIso: pkg.metadata.gpDateIso,
    isSprint: pkg.metadata.isSprint,
    laps: pkg.metadata.laps,
    lapDistanceKm: Number((pkg.metadata.officialLengthM / 1000).toFixed(3)),
    raceDistanceKm: pkg.metadata.officialRaceDistanceKm,
    corners: pkg.metadata.officialCorners,
    baseLapTimeSec: pkg.metadata.baseLapTimeSec,
    aeroDemand: pkg.metadata.aeroDemand,
    tireWearSeverity: pkg.metadata.tireWearSeverity,
    pitLaneLossSec: pkg.metadata.pitLaneLossSec,
    overtakeDifficulty: pkg.metadata.overtakeDifficulty,
    description: pkg.metadata.description,
    svgPath: pkg.svgCenterlinePath,
    geojsonId: pkg.metadata.geojsonId,
    altitudeM: pkg.trackCharacteristics.altitudeM,
    calculatedLengthM: pkg.validation.calculatedLengthM,
    certificationStatus: pkg.metadata.provenance.certificationStatus,
    confidence: pkg.metadata.provenance.confidence,
    provenanceSource: pkg.metadata.provenance.geometrySource,
  }));
}

export function loadAllAvailableCircuitPackages(
  seasonYear: number = 2026,
  repository: CircuitRepository = defaultCircuitRepository
): ProcessedCircuitPackage[] {
  const allMeta: SeasonCircuitMetadata[] = repository.getAllCircuitsForSeason(seasonYear);
  return allMeta.map(meta => loadCircuitPackage(meta.circuitCode, meta.seasonYear, repository));
}

export function loadCircuitHistoricalPackages(
  circuitCode: string,
  repository: CircuitRepository = defaultCircuitRepository
): ProcessedCircuitPackage[] {
  const versions = repository.getCircuitVersions(circuitCode);
  return versions.map(meta => loadCircuitPackage(meta.circuitCode, meta.seasonYear, repository));
}

export interface RawGeoJsonMetaSummary {
  geojsonId: string;
  opened: number;
  firstgp: number;
  geojsonLengthM: number;
  altitudeM: number;
  pointCount: number;
  startLon: number;
  startLat: number;
}

export function getRawGeoJsonFeatureMeta(geojsonId: string): RawGeoJsonMetaSummary | null {
  const raw = REAL_CIRCUITS_GEOJSON[geojsonId];
  if (!raw) return null;
  const firstCoord = raw.coordinates[0] ?? [0, 0];
  return {
    geojsonId: raw.geojsonId,
    opened: raw.opened,
    firstgp: raw.firstgp,
    geojsonLengthM: raw.geojsonLengthM,
    altitudeM: raw.altitudeM,
    pointCount: raw.coordinates.length,
    startLon: Number(firstCoord[0].toFixed(5)),
    startLat: Number(firstCoord[1].toFixed(5)),
  };
}

export function getSeasonTrackCharacteristics(seasonYear: number = 2026): TrackCharacteristicsSi[] {
  return loadSeasonPackages(seasonYear).map(pkg => pkg.trackCharacteristics);
}

export function getSeasonSegmentsCatalog(seasonYear: number = 2026): Record<string, CircuitSegmentSpec[]> {
  const catalog: Record<string, CircuitSegmentSpec[]> = {};
  for (const pkg of loadSeasonPackages(seasonYear)) {
    catalog[pkg.metadata.circuitCode] = pkg.segments;
  }
  return catalog;
}
