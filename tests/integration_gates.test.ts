import { describe, expect, it } from 'vitest';
import { computeMdoParetoSolutions } from '../src/engine/optimizationEngine.ts';
import { DEFAULT_VEHICLE_PARAMS, solveVehiclePhysics } from '../src/engine/physicsEngine.ts';
import { validateFia2026Compliance } from '../src/engine/regulatoryEngine.ts';
import { runMultiPhysicsSimulation } from '../src/engine/simulationEngine.ts';
import { evaluateAllGates } from '../src/engine/traceability/traceabilityRegistry.ts';

describe('Integração Completa do Sistema, Paridade com Motor Legado & Gates 01–12', () => {
  it('aprova todos os 12 Gates simultaneamente em menos de 1500 ms e marca rastreabilidade como APPROVED', () => {
    const t0 = performance.now();
    const audit = evaluateAllGates(DEFAULT_VEHICLE_PARAMS);
    const elapsedMs = performance.now() - t0;

    expect(audit.passedGatesCount).toBe(12);
    expect(audit.allGatesPassed).toBe(true);
    expect(audit.traceability.length).toBe(12);
    expect(audit.traceability.every((r) => r.status === 'APPROVED')).toBe(true);
    expect(elapsedMs).toBeLessThan(1500);
  });

  it('mantém paridade integral nos facades legados (physicsEngine, simulationEngine, regulatoryEngine, optimizationEngine)', () => {
    const phys = solveVehiclePhysics(DEFAULT_VEHICLE_PARAMS);
    expect(phys.cornerMode.cdTotal).toBe(phys.summary.dragCoefficient);
    expect(phys.cornerMode.downforceTotalN).toBeGreaterThan(10000);
    expect(phys.totalWheelPowerKw).toBeGreaterThan(600);

    const reg = validateFia2026Compliance(DEFAULT_VEHICLE_PARAMS, phys);
    expect(reg.compliant).toBe(true);

    const sim = runMultiPhysicsSimulation({
      componentType: 'floor',
      params: DEFAULT_VEHICLE_PARAMS,
      atrHoursUsed: 40,
      windTunnelLevel: 3,
      cfdLevel: 3,
      dnaCorrelationModifier: 0,
      staff: [],
    });
    expect(sim.approved).toBe(true);
    expect(sim.checklistScore).toBe(12);

    const pareto = computeMdoParetoSolutions(DEFAULT_VEHICLE_PARAMS);
    expect(pareto.length).toBe(5);
  });
});
