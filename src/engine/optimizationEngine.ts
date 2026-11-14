import type { MdoParetoSolution, VehicleEngineeringParameters } from '../types/physics.ts';
import { runMultidisciplinarySimulation } from './modules/m10Multidisciplinary.ts';
import { type PhysicsEnvironmentOptions, celsiusToKelvin } from './physicsEngine.ts';

/**
 * Multidisciplinary Design Optimization (MDO) Pareto Frontier Generator (M10).
 * Delegates directly to M10 runMultidisciplinarySimulation so all Pareto evaluations
 * share identical strong-coupled SI physics and non-dominated filtering.
 */
export function computeMdoParetoSolutions(
  baseParams: VehicleEngineeringParameters,
  env: PhysicsEnvironmentOptions = {}
): MdoParetoSolution[] {
  const m10 = runMultidisciplinarySimulation(
    baseParams,
    {
      fidelityLevel: 'L1',
      couplingMode: 'strong',
      convergenceTolM: 5e-5,
      maxIterations: 20,
      ambientTempK: celsiusToKelvin(env.ambientTempC ?? 25),
      airPressurePa: env.airPressurePa ?? 101325,
      tireCompound: 'medium',
      referenceTrackLapDistM: 5793,
      highSpeedShare: 0.62,
      lowSpeedShare: 0.16,
    },
    env.edition
  );

  const mappedIds: MdoParetoSolution['id'][] = [
    'max_performance',
    'max_stability',
    'max_efficiency',
    'min_mass',
    'max_reliability',
  ];

  return m10.paretoFrontier
    .filter((c): c is typeof c & { id: MdoParetoSolution['id'] } =>
      mappedIds.includes(c.id as MdoParetoSolution['id'])
    )
    .map((c) => ({
      id: c.id,
      label: c.label,
      subtitle: c.subtitle,
      tradeoffNote: c.tradeoffNote,
      paramsPatch: c.paramsPatch,
      metrics: {
        estimatedLapDeltaSec: c.metrics.estimatedLapDeltaS,
        aeroEfficiencyLD: c.metrics.aeroEfficiencyLD,
        totalMassKg: c.metrics.totalMassKg,
        thermalMarginC: c.metrics.thermalMarginK,
        stabilityScore: Math.round(c.metrics.stabilityScore01 * 100),
        reliabilityScore: Math.round(c.metrics.reliabilityScore01 * 100),
      },
    }));
}
