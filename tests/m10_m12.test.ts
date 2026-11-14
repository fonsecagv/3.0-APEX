import { describe, expect, it } from 'vitest';
import { FIA_2026_DEFAULT_EDITION } from '../src/engine/modules/m03Packaging.ts';
import { evaluateGate10, runMultidisciplinarySimulation } from '../src/engine/modules/m10Multidisciplinary.ts';
import { evaluateGate11, runRaceSimulation } from '../src/engine/modules/m11RaceSimulation.ts';
import { evaluateGate12, runCalibrationPipeline } from '../src/engine/modules/m12Calibration.ts';
import { DEFAULT_VEHICLE_PARAMS } from '../src/engine/physicsEngine.ts';

describe('M10 — Simulação Multidisciplinar, Acoplamento Forte/Fraco, DOE e Pareto', () => {
  it('converge em acoplamento forte com auditoria de conservação e fronteira de Pareto não-dominada', () => {
    const mdo = runMultidisciplinarySimulation(
      DEFAULT_VEHICLE_PARAMS,
      {
        fidelityLevel: 'L2',
        couplingMode: 'strong',
        convergenceTolM: 5e-5,
        maxIterations: 25,
        ambientTempK: 298.15,
        airPressurePa: 101325,
        tireCompound: 'medium',
        referenceTrackLapDistM: 5793,
        highSpeedShare: 0.62,
        lowSpeedShare: 0.16,
      },
      FIA_2026_DEFAULT_EDITION
    );
    expect(mdo.solverMetadata.converged).toBe(true);
    expect(mdo.conservationAudit.allConserved).toBe(true);
    expect(mdo.sensitivityStudy.length).toBeGreaterThanOrEqual(4);
    expect(mdo.paretoFrontier.filter((c) => c.isNonDominated).length).toBeGreaterThanOrEqual(2);
    expect(evaluateGate10(mdo).passed).toBe(true);
  });

  it('reporta honestamente não-convergência no modo fraco (sem mascarar)', () => {
    const weak = runMultidisciplinarySimulation(
      DEFAULT_VEHICLE_PARAMS,
      {
        fidelityLevel: 'L0',
        couplingMode: 'weak',
        convergenceTolM: 1e-6,
        maxIterations: 1,
        ambientTempK: 298.15,
        airPressurePa: 101325,
        tireCompound: 'medium',
        referenceTrackLapDistM: 5793,
        highSpeedShare: 0.62,
        lowSpeedShare: 0.16,
      },
      FIA_2026_DEFAULT_EDITION
    );
    expect(weak.solverMetadata.converged).toBe(false);
    expect(weak.solverMetadata.failureReason).toBeTruthy();
  });
});

describe('M11 — Simulação de Corrida Segmentada, Massa Variável m(t), Ar Sujo e E[T]', () => {
  it('executa 6 circuitos com conservação de combustível/ERS e soma de probabilidades igual a 1', () => {
    for (const circuitCode of ['monza', 'silverstone', 'spa', 'suzuka', 'interlagos', 'monaco']) {
      const race = runRaceSimulation(
        DEFAULT_VEHICLE_PARAMS,
        {
          circuitCode,
          fidelityMode: circuitCode === 'monza' ? 'advanced' : 'dynamic',
          weather: circuitCode === 'spa' ? 'changing_light_rain' : 'dry_clear',
          initialFuelKg: 76,
          stints: [
            { compound: 'medium', lapsCount: 20 },
            { compound: 'hard', lapsCount: 24 },
          ],
          trafficFollowGapS: 1.0,
          pitStopDurationS: 22.0,
        },
        FIA_2026_DEFAULT_EDITION
      );
      expect(race.massAndFuelBalance.fuelConserved).toBe(true);
      expect(race.massAndFuelBalance.finalVehicleMassKg).toBeLessThan(race.massAndFuelBalance.initialVehicleMassKg);
      expect(race.energySummary.energyConserved).toBe(true);
      const probSum = race.strategyScenarios.reduce((a, s) => a + s.probability, 0);
      expect(probSum).toBeCloseTo(1.0, 4);
      expect(evaluateGate11(race).passed).toBe(true);
    }
  });
});

describe('M12 — Calibração LM/NM, Identificabilidade J^T·J, Monte Carlo UQ e Governança', () => {
  it('diagnostica colinearidade CL·A não-fixado, garante rank 3 ao fixar A, divide cronologicamente e gera UQ P05<P50<P95', () => {
    const lm = runCalibrationPipeline(
      DEFAULT_VEHICLE_PARAMS,
      {
        method: 'levenberg_marquardt',
        seed: 202601,
        monteCarloSamples: 150,
        regularizationLambda: 0.05,
        requestedLifecycleStage: 'Approved',
      },
      FIA_2026_DEFAULT_EDITION
    );
    expect(lm.verificationPreCheck.allVerified).toBe(true);
    expect(lm.identifiability.collinearDiagnosticPair.collinearityDetected).toBe(true);
    expect(lm.identifiability.identifiable).toBe(true);
    expect(lm.identifiability.identifiabilityRank).toBe(3);
    expect(lm.datasetSplit.zeroLeakageVerified).toBe(true);
    expect(lm.metrics.validationPassed).toBe(true);
    expect(lm.uncertaintyQuantification.uqP05).toBeLessThan(lm.uncertaintyQuantification.uqP50);
    expect(lm.uncertaintyQuantification.uqP50).toBeLessThan(lm.uncertaintyQuantification.uqP95);
    expect(lm.lifecycleGovernance.approvedForProduction).toBe(true);
    expect(evaluateGate12(lm).passed).toBe(true);

    // Nelder-Mead alternative optimizer + strict rejection on tight unreachable threshold
    const nmRejected = runCalibrationPipeline(
      DEFAULT_VEHICLE_PARAMS,
      {
        method: 'nelder_mead',
        seed: 202601,
        monteCarloSamples: 120,
        regularizationLambda: 0.05,
        targetRmseThresholdN: 10.0, // impossibly tight vs sensor noise
        requestedLifecycleStage: 'Approved',
      },
      FIA_2026_DEFAULT_EDITION
    );
    expect(nmRejected.lifecycleGovernance.currentStage).toBe('Rejected');
    expect(nmRejected.lifecycleGovernance.approvedForProduction).toBe(false);
    expect(evaluateGate12(nmRejected).passed).toBe(false);
  });
});
