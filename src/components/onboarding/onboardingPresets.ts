import type { VehiclePhilosophyCode } from '../../engine/modules/m02Philosophy';
import type { CarPhilosophy } from '../../types/f1';
import type { VehicleEngineeringParameters } from '../../types/physics';

/**
 * Normalizes legacy CarPhilosophy aliases ('balanced', 'tire_preservation')
 * to canonical M02 VehiclePhilosophyCode keys.
 */
export function normalizeToM02Philosophy(philosophy: CarPhilosophy | undefined): VehiclePhilosophyCode {
  if (!philosophy || philosophy === 'balanced') return 'balanced_adaptive';
  if (philosophy === 'tire_preservation') return 'mechanical_grip';
  return philosophy;
}

/**
 * Generates physically grounded VehicleEngineeringParameters baselines
 * derived from the 6 M02 vehicle philosophies (Section 2.1 - 2.3).
 */
export function getPhilosophyBaselinePatch(code: VehiclePhilosophyCode): Partial<VehicleEngineeringParameters> {
  switch (code) {
    case 'low_drag':
      return {
        frontWingFlapCornerDeg: 26,
        rearWingFlapCornerDeg: 29,
        frontWingFlapStraightDeg: 6,
        rearWingFlapStraightDeg: 5,
        diffuserAngleDeg: 8.6,
        frontRideHeightMm: 25,
        rearRideHeightMm: 46,
        sidepodUndercutPct: 68,
        springRateNmm: 225,
        antiRollBarNmm: 82,
        gearRatioBias: 68,
      };
    case 'high_downforce':
      return {
        frontWingFlapCornerDeg: 36,
        rearWingFlapCornerDeg: 40,
        frontWingFlapStraightDeg: 10,
        rearWingFlapStraightDeg: 9,
        diffuserAngleDeg: 10.8,
        frontRideHeightMm: 22,
        rearRideHeightMm: 50,
        floorEdgeComplexity: 78,
        springRateNmm: 270,
        antiRollBarNmm: 98,
        gearRatioBias: 36,
      };
    case 'stable_platform':
      return {
        frontWingFlapCornerDeg: 30,
        rearWingFlapCornerDeg: 34,
        frontWingFlapStraightDeg: 8,
        rearWingFlapStraightDeg: 7,
        diffuserAngleDeg: 9.2,
        frontRideHeightMm: 26,
        rearRideHeightMm: 49,
        floorStiffnessNmm: 2050,
        wingStructuralStiffnessPct: 92,
        springRateNmm: 250,
        damperNsM: 5000,
        antiDivePct: 52,
        antiSquatPct: 48,
      };
    case 'aero_efficiency':
      return {
        frontWingFlapCornerDeg: 31,
        rearWingFlapCornerDeg: 34,
        frontWingFlapStraightDeg: 7,
        rearWingFlapStraightDeg: 6,
        diffuserAngleDeg: 9.8,
        frontRideHeightMm: 23,
        rearRideHeightMm: 47,
        sidepodUndercutPct: 72,
        sidepodInletAreaCm2: 325,
        hotAirExitAreaCm2: 315,
        springRateNmm: 235,
        gearRatioBias: 56,
      };
    case 'mechanical_grip':
      return {
        frontWingFlapCornerDeg: 33,
        rearWingFlapCornerDeg: 36,
        frontWingFlapStraightDeg: 9,
        rearWingFlapStraightDeg: 8,
        diffuserAngleDeg: 9.3,
        frontRideHeightMm: 27,
        rearRideHeightMm: 52,
        springRateNmm: 192,
        damperNsM: 3900,
        antiRollBarNmm: 68,
        staticCamberDeg: -2.4,
        differentialLockPct: 48,
        gearRatioBias: 40,
      };
    case 'balanced_adaptive':
    default:
      return {
        frontWingFlapCornerDeg: 31,
        rearWingFlapCornerDeg: 35,
        frontWingFlapStraightDeg: 9,
        rearWingFlapStraightDeg: 8,
        diffuserAngleDeg: 9.5,
        frontRideHeightMm: 24,
        rearRideHeightMm: 48,
        springRateNmm: 230,
        damperNsM: 4400,
        antiRollBarNmm: 85,
        gearRatioBias: 50,
      };
  }
}
