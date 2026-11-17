import { describe, expect, it } from 'vitest';
import { INITIAL_DRIVERS, INITIAL_STAFF } from '../src/data/f1Data.ts';
import { computeCarRadarProfile } from '../src/engine/chassisLaunchAndSeasonLoop.ts';
import {
  computeDriverPerceivedRadarProfile,
  evaluateChiefCadFeedback,
  generateDriverSimulatorReport,
} from '../src/engine/engineeringFeedbackEngine.ts';
import { DEFAULT_VEHICLE_PARAMS, solveVehiclePhysics } from '../src/engine/physicsEngine.ts';
import { computeDriverRaceProfile } from '../src/engine/raceGridAndEvents.ts';
import { validateFia2026Compliance } from '../src/engine/regulatoryEngine.ts';

describe('Feedback da Equipe Técnica, Pilotos & Confiança/Escuta Ativa', () => {
  it('evaluateChiefCadFeedback alerta 3.2 mm no chassi, elogia 3.6 mm (+5% P&D) e aplica penalidade de desengajamento se trust < 40', () => {
    const thinParams = { ...DEFAULT_VEHICLE_PARAMS, laminateThicknessMm: 3.2 };
    const thinPhys = solveVehiclePhysics(thinParams);
    const thinReg = validateFia2026Compliance(thinParams, thinPhys);

    const thinFeedback = evaluateChiefCadFeedback({
      selectedType: 'chassis',
      vehicleParams: thinParams,
      vehiclePhysics: thinPhys,
      philosophy: 'balanced',
      regulatory: thinReg,
      staff: INITIAL_STAFF,
      teamName: 'APEX Grand Prix Team',
    });

    expect(thinFeedback.status).toBe('warning');
    expect(thinFeedback.recommendedPatch?.laminateThicknessMm).toBe(3.6);
    expect(thinFeedback.atrHoursCost).toBe(12);

    const idealParams = { ...DEFAULT_VEHICLE_PARAMS, laminateThicknessMm: 3.6 };
    const idealPhys = solveVehiclePhysics(idealParams);
    const idealReg = validateFia2026Compliance(idealParams, idealPhys);

    const alignedFeedback = evaluateChiefCadFeedback({
      selectedType: 'chassis',
      vehicleParams: idealParams,
      vehiclePhysics: idealPhys,
      philosophy: 'balanced',
      regulatory: idealReg,
      staff: INITIAL_STAFF,
      teamName: 'APEX Grand Prix Team',
    });

    expect(alignedFeedback.status).toBe('aligned');
    expect(alignedFeedback.rdSpeedModifierPct).toBe(5);
    expect(alignedFeedback.isDisengaged).toBe(false);

    // Asa dianteira 28° em filosofia High Downforce deve recomendar 32°
    const lowWingParams = { ...DEFAULT_VEHICLE_PARAMS, frontWingFlapCornerDeg: 28 };
    const lowWingPhys = solveVehiclePhysics(lowWingParams);
    const lowWingReg = validateFia2026Compliance(lowWingParams, lowWingPhys);

    const wingMismatch = evaluateChiefCadFeedback({
      selectedType: 'wings',
      vehicleParams: lowWingParams,
      vehiclePhysics: lowWingPhys,
      philosophy: 'high_downforce',
      regulatory: lowWingReg,
      staff: INITIAL_STAFF,
      teamName: 'APEX Grand Prix Team',
    });

    expect(wingMismatch.status).toBe('warning');
    expect(wingMismatch.recommendedPatch?.frontWingFlapCornerDeg).toBe(32);

    // Confiança do chefe < 40 gera desengajamento (-10% velocidade P&D)
    const disengagedStaff = INITIAL_STAFF.map((s) =>
      s.role === 'head_aero' ? { ...s, trust: 32 } : s
    );
    const disengagedFeedback = evaluateChiefCadFeedback({
      selectedType: 'chassis',
      vehicleParams: idealParams,
      vehiclePhysics: idealPhys,
      philosophy: 'balanced',
      regulatory: idealReg,
      staff: disengagedStaff,
      teamName: 'APEX Grand Prix Team',
    });

    expect(disengagedFeedback.isDisengaged).toBe(true);
    expect(disengagedFeedback.rdSpeedModifierPct).toBe(-10);
  });

  it('computeDriverPerceivedRadarProfile e generateDriverSimulatorReport divergem do túnel sob erro de correlação e porpoising alto', () => {
    const porpoisingParams = {
      ...DEFAULT_VEHICLE_PARAMS,
      frontRideHeightMm: 10,
      rearRideHeightMm: 32,
      springRateNmm: 120,
      damperNsM: 2500,
      diffuserAngleDeg: 13.8,
      floorEdgeComplexity: 92,
    };
    const phys = solveVehiclePhysics(porpoisingParams);
    expect(phys.porpoisingRiskPct).toBeGreaterThan(50);

    const tunnelAxes = computeCarRadarProfile(porpoisingParams, phys, []);
    const pilotAxes = computeDriverPerceivedRadarProfile({
      vehicleParams: porpoisingParams,
      vehiclePhysics: phys,
      components: [],
      correlationErrorPct: 14.5,
      driverFeedbackRating: 88,
    });

    const tunnelDownforce = tunnelAxes.find((a) => a.key === 'downforce')!.value;
    const pilotDownforce = pilotAxes.find((a) => a.key === 'downforce')!.value;
    expect(tunnelDownforce - pilotDownforce).toBeGreaterThan(4);

    const leadDriver = { ...INITIAL_DRIVERS[0], trust: 78 };
    const pilotReport = generateDriverSimulatorReport({
      vehicleParams: porpoisingParams,
      vehiclePhysics: phys,
      components: [],
      leadDriver,
      correlationErrorPct: 14.5,
    });

    expect(pilotReport.handlingVerdict).toBe('critico');
    expect(pilotReport.recommendedParamsPatch).toBeDefined();
    expect(pilotReport.recommendedParamsPatch?.frontRideHeightMm).toBeGreaterThan(
      porpoisingParams.frontRideHeightMm
    );
  });

  it('computeDriverRaceProfile multiplica risco de incidente >= 2.0x quando trust === 0 vs trust === 80', () => {
    const baseDriver = INITIAL_DRIVERS[0];
    const highTrustProfile = computeDriverRaceProfile(
      { ...baseDriver, trust: 80 },
      { weather: 'sunny', aeroDemand: 'medium', gapToAheadSec: 1.8, tireWearPercent: 25 }
    );
    const zeroTrustProfile = computeDriverRaceProfile(
      { ...baseDriver, trust: 0 },
      { weather: 'sunny', aeroDemand: 'medium', gapToAheadSec: 1.8, tireWearPercent: 25 }
    );

    expect(
      zeroTrustProfile.incidentRiskMultiplier / highTrustProfile.incidentRiskMultiplier
    ).toBeGreaterThanOrEqual(2.0);
  });
});
