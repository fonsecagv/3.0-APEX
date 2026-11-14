import { describe, expect, it } from 'vitest';
import {
  DIM_FORCE,
  DIM_LENGTH,
  DIM_MASS,
  evaluateControlledEquation,
  verifyEquationDimensions,
} from '../src/engine/math/controlledParser.ts';
import {
  computeAirState,
  evaluateEquationSafely,
  evaluateGate01,
} from '../src/engine/modules/m01Foundation.ts';
import {
  VEHICLE_PHILOSOPHIES_M02,
  evaluateGate02,
  evaluatePhilosophyForTrack,
} from '../src/engine/modules/m02Philosophy.ts';
import {
  FIA_2026_DEFAULT_EDITION,
  buildPackagingArchitecture,
  evaluateGate03,
} from '../src/engine/modules/m03Packaging.ts';
import { DEFAULT_VEHICLE_PARAMS } from '../src/engine/physicsEngine.ts';

describe('M01 — Fundação Física e Parser Dimensional Controlado', () => {
  it('rejeita expressões arbitrárias / injeção de código no parser AST', () => {
    expect(() => evaluateControlledEquation('process.exit(1)', { a: 1 })).toThrow();
    expect(() => evaluateControlledEquation('function(){return 1}()', {})).toThrow();
    expect(() => evaluateControlledEquation('window.location', {})).toThrow();
  });

  it('verifica dimensões SI 5D [M,L,T,I,Θ] e rejeita inconsistência dimensional', () => {
    const ok = verifyEquationDimensions('m * a', { m: DIM_MASS, a: [0, 1, -2, 0, 0] }, DIM_FORCE);
    expect(ok.passed).toBe(true);

    const bad = verifyEquationDimensions('m + L', { m: DIM_MASS, L: DIM_LENGTH }, DIM_FORCE);
    expect(bad.passed).toBe(false);
    expect(bad.error).toContain('Dimensional mismatch');
  });

  it('calcula equações registradas com domínio físico e ar termodinâmico', () => {
    const air = computeAirState(101325, 298.15);
    expect(air.densityKgM3).toBeCloseTo(1.1839, 3);
    expect(air.dynamicViscosityPaS).toBeCloseTo(1.849e-5, 6);

    const qRes = evaluateEquationSafely('EQ_DYN_PRESSURE', { rho: air.densityKgM3, V: 70 });
    expect(qRes.unitSi).toBe('Pa');
    expect(qRes.dimensionalVerified).toBe(true);
    expect(qRes.value).toBeCloseTo(0.5 * air.densityKgM3 * 4900, 1);

    // Domain boundary rejection
    expect(() => evaluateEquationSafely('EQ_DYN_PRESSURE', { rho: air.densityKgM3, V: 250 })).toThrow();
    expect(evaluateGate01().passed).toBe(true);
  });
});

describe('M02 — Filosofia do Veículo e Trade-offs', () => {
  it('todas as 6 filosofias somam pesos normalizados próximos de 1.0 e possuem alvos mensuráveis', () => {
    const keys = Object.keys(VEHICLE_PHILOSOPHIES_M02) as Array<keyof typeof VEHICLE_PHILOSOPHIES_M02>;
    expect(keys.length).toBe(6);
    for (const k of keys) {
      const sum = VEHICLE_PHILOSOPHIES_M02[k].weights.reduce((a, w) => a + w.weight, 0);
      expect(sum).toBeCloseTo(1.0, 2);
    }
  });

  it('bloqueia Gate 02 se trade-offs não forem reconhecidos e aprova quando confirmados', () => {
    const baseMetrics = {
      aeroEfficiencyLd: 3.9,
      clTotal: 3.4,
      cdTotal: 0.85,
      platformStability01: 0.86,
      mechanicalGrip01: 0.82,
      thermalMarginK: 11,
    };
    const pending = evaluatePhilosophyForTrack('low_drag', 'monza', baseMetrics, 0, false);
    expect(evaluateGate02(pending).passed).toBe(false);

    const confirmed = evaluatePhilosophyForTrack('low_drag', 'monza', baseMetrics, 0, true);
    expect(evaluateGate02(confirmed).passed).toBe(true);
    expect(confirmed.trackCompatibilityPct).toBeGreaterThan(75);
  });
});

describe('M03 — Packaging, CG 3D, Inércia de Steiner e Colisão AABB', () => {
  it('fecha soma de massas, calcula CG composto exato e momento de inércia Iz por Steiner', () => {
    const pkg = buildPackagingArchitecture(DEFAULT_VEHICLE_PARAMS, FIA_2026_DEFAULT_EDITION);
    const sumMass = pkg.packages.reduce((a, p) => a + p.massKg, 0);
    expect(sumMass).toBeCloseTo(pkg.totalMassKg, 1);
    expect(pkg.totalMassKg).toBeGreaterThanOrEqual(FIA_2026_DEFAULT_EDITION.minMassKg);
    expect(pkg.collisionCount).toBe(0);

    // Independently check Steiner sum
    const izExpected = pkg.packages.reduce(
      (a, p) => a + p.massKg * ((p.xCgM - pkg.cgM.x) ** 2 + (p.yCgM - pkg.cgM.y) ** 2) + p.iZzSelfKgM2,
      0
    );
    expect(pkg.yawInertiaIzKgM2).toBeCloseTo(izExpected, 0);
    expect(evaluateGate03(pkg).passed).toBe(true);
  });

  it('detecta colisão física AABB e violação de envelope quando entre-eixos é comprimido ilegalmente', () => {
    const crushed = { ...DEFAULT_VEHICLE_PARAMS, wheelbaseMm: 2100 };
    const pkg = buildPackagingArchitecture(crushed, FIA_2026_DEFAULT_EDITION);
    expect(pkg.envelopeCompliant).toBe(false);
    expect(pkg.collisionCount).toBeGreaterThan(0);
    expect(evaluateGate03(pkg).passed).toBe(false);
  });
});
