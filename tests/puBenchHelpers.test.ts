import { describe, expect, it } from 'vitest';
import { DEFAULT_VEHICLE_PARAMS } from '../src/engine/physicsEngine';
import { FIA_2026_DEFAULT_EDITION } from '../src/engine/modules/m03Packaging';
import { evaluatePowerUnit } from '../src/engine/modules/m08PowerUnit';
import {
  computeNormalizedOfficialPuCard,
  computePuStarRatings,
  evaluateBoardroomPuVerdict,
  simulateEndurance1000Laps,
} from '../src/utils/puBenchHelpers';

describe('Phase 5 PU Workbench & Official Card Helpers', () => {
  it('completes 1000-lap endurance test cleanly under conservative settings', () => {
    const conservativeParams = {
      ...DEFAULT_VEHICLE_PARAMS,
      iceCompressionRatio: 14.6,
      turboDiameterMm: 88,
      batteryInternalResistanceMOhm: 10.5,
      radiatorVolumeL: 14.0,
    };

    const report = simulateEndurance1000Laps(conservativeParams);
    expect(report.points).toHaveLength(10);
    expect(report.points[0].lap).toBe(1);
    expect(report.points[report.points.length - 1].lap).toBe(1000);
    expect(report.passed).toBe(true);
    expect(report.overheatLap).toBeNull();
    expect(report.peakPowerCv).toBeGreaterThan(850);
  });

  it('detects overheating and recommends lowering compression under extreme thermal stress', () => {
    const extremeParams = {
      ...DEFAULT_VEHICLE_PARAMS,
      iceCompressionRatio: 16.0,
      turboDiameterMm: 103,
      batteryInternalResistanceMOhm: 21.0,
      radiatorVolumeL: 10.0,
      ersDeployBiasPct: 85,
    };

    const report = simulateEndurance1000Laps(extremeParams, { thirdPartyErsPenaltyPct: 6 });
    expect(report.passed).toBe(false);
    expect(report.overheatLap).not.toBeNull();
    expect(report.recommendation.toLowerCase()).toContain('reduza');
  });

  it('computes 1-5 star ratings bounded and responsive to reliability and fuel partner', () => {
    const puOut = evaluatePowerUnit(
      DEFAULT_VEHICLE_PARAMS,
      {
        rpm: 11600,
        throttleRatio: 1.0,
        vehicleSpeedMs: 75,
        ambientTempK: 298.15,
        airPressurePa: 101325,
        initialSoc01: 0.72,
        cycleDurationS: 5.0,
        regenPowerCommandW: 110000,
        deployCommandRatio: 0.65,
        cumulativeRaceCycles: 120,
      },
      FIA_2026_DEFAULT_EDITION
    );

    const lowRelStars = computePuStarRatings(DEFAULT_VEHICLE_PARAMS, puOut, 55, 'petronas');
    const highRelStars = computePuStarRatings(DEFAULT_VEHICLE_PARAMS, puOut, 88, 'shell');

    expect(lowRelStars.reliabilityStars).toBeLessThanOrEqual(2);
    expect(highRelStars.reliabilityStars).toBeGreaterThanOrEqual(4);
    expect(highRelStars.fuelEfficiencyStars).toBeGreaterThanOrEqual(lowRelStars.fuelEfficiencyStars);
  });

  it('produces normalized 0-100 card bars and dynamic pros/cons/chassis compatibility', () => {
    const puOut = evaluatePowerUnit(
      DEFAULT_VEHICLE_PARAMS,
      {
        rpm: 11600,
        throttleRatio: 1.0,
        vehicleSpeedMs: 75,
        ambientTempK: 298.15,
        airPressurePa: 101325,
        initialSoc01: 0.72,
        cycleDurationS: 5.0,
        regenPowerCommandW: 110000,
        deployCommandRatio: 0.65,
        cumulativeRaceCycles: 120,
      },
      FIA_2026_DEFAULT_EDITION
    );

    const card = computeNormalizedOfficialPuCard({
      vehicleParams: DEFAULT_VEHICLE_PARAMS,
      puOutputs: puOut,
      displayedPowerHp: 1015,
      relFinalCalculado: 84,
      iceWeightKg: 142,
      batteryWeightKg: 35,
      fuelPartner: 'shell',
      requiresLargerSidepods: false,
      dnaLabel: 'Engenheiro Chefe · Eficiência',
    });

    expect(card.powerScore).toBeGreaterThanOrEqual(60);
    expect(card.powerScore).toBeLessThanOrEqual(99);
    expect(card.reliabilityScore).toBe(84);
    expect(card.totalWeightKg).toBe(177);
    expect(card.pros.length).toBeGreaterThan(0);
    expect(card.cons.length).toBeGreaterThan(0);
    expect(card.chassisCompatibility).toContain('177 kg');
  });

  it('evaluates boardroom leadership alignment percentages and quotes', () => {
    const puOut = evaluatePowerUnit(
      DEFAULT_VEHICLE_PARAMS,
      {
        rpm: 11600,
        throttleRatio: 1.0,
        vehicleSpeedMs: 75,
        ambientTempK: 298.15,
        airPressurePa: 101325,
        initialSoc01: 0.72,
        cycleDurationS: 5.0,
        regenPowerCommandW: 110000,
        deployCommandRatio: 0.65,
        cumulativeRaceCycles: 120,
      },
      FIA_2026_DEFAULT_EDITION
    );

    const verdict = evaluateBoardroomPuVerdict({
      vehicleParams: DEFAULT_VEHICLE_PARAMS,
      puOutputs: puOut,
      relFinalPct: 82,
      headPuName: 'Gabriel Santos',
      headAeroName: 'Marcus Vance',
      requiresLargerSidepods: true,
    });

    expect(verdict.puAlignmentPct).toBeGreaterThanOrEqual(30);
    expect(verdict.puAlignmentPct).toBeLessThanOrEqual(100);
    expect(verdict.aeroAlignmentPct).toBeGreaterThanOrEqual(30);
    expect(verdict.aeroAlignmentPct).toBeLessThanOrEqual(100);
    expect(verdict.aeroChiefQuote).toContain('sidepods');
  });
});
