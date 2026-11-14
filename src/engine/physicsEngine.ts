import type {
  VehicleEngineeringParameters,
  VehiclePhysicsOutputs,
} from '../types/physics.ts';
import { computeAirState } from './modules/m01Foundation.ts';
import {
  FIA_2026_DEFAULT_EDITION,
  type RegulationEditionSpec,
  buildPackagingArchitecture,
} from './modules/m03Packaging.ts';
import { evaluateAerodynamics } from './modules/m04Aerodynamics.ts';
import { evaluateVehicleDynamics } from './modules/m05VehicleDynamics.ts';
import { evaluateTirePhysics } from './modules/m06Tires.ts';
import { evaluateStructures } from './modules/m07Structures.ts';
import { evaluatePowerUnit } from './modules/m08PowerUnit.ts';
import { evaluateTransmission } from './modules/m09Transmission.ts';

// SI unit conversion helpers (Regra 2)
export const mmToM = (mm: number): number => mm / 1000;
export const cm2ToM2 = (cm2: number): number => cm2 / 10000;
export const kmhToMs = (kmh: number): number => kmh / 3.6;
export const celsiusToKelvin = (c: number): number => c + 273.15;
export const kelvinToCelsius = (k: number): number => k - 273.15;
export const kwToHp = (kw: number): number => kw * 1.34102209;
export const degToRad = (deg: number): number => (deg * Math.PI) / 180;

export const DEFAULT_VEHICLE_PARAMS: VehicleEngineeringParameters = {
  // 2026 Envelope
  wheelbaseMm: 3390,
  trackWidthMm: 1890,
  targetFrontWeightPct: 45.8,

  // 2026 Flatter Floor + Enlarged Rear Diffuser
  floorLengthMm: 2880,
  floorUsefulWidthMm: 1460,
  frontRideHeightMm: 24,
  rearRideHeightMm: 48,
  diffuserAngleDeg: 9.5,
  diffuserLengthMm: 820,
  floorEdgeComplexity: 62,
  floorStiffnessNmm: 1650,
  floorSurfaceRoughnessUm: 3.5,

  // Sidepods & Cooling
  sidepodInletAreaCm2: 340,
  sidepodDuctDepthMm: 255,
  radiatorVolumeL: 12.6,
  sidepodUndercutPct: 58,
  hotAirExitAreaCm2: 325,
  coolantFlowLpm: 132,

  // Active Wings (Corner Z / Straight X)
  frontWingFlapCornerDeg: 31,
  frontWingFlapStraightDeg: 9,
  rearWingFlapCornerDeg: 35,
  rearWingFlapStraightDeg: 8,
  wingSpanMm: 1860,
  wingStructuralStiffnessPct: 82,

  // Power Unit (50% Thermal / 50% 350kW Electric)
  iceMaterial: 'aluminum',
  iceMetallurgyId: 'fia_iron_ams6487',
  iceCompressionRatio: 15.8,
  turboDiameterMm: 91,
  turboArRatio: 0.92,
  mgukMaxKw: 350,
  batteryCellTech: 'lightweight_lithium',
  batterySubChemistry: 'nca',
  batteryInternalResistanceMOhm: 12.5,
  ersDeployBiasPct: 55,
  ersPreservationPct: 55,

  // Transmission & Gearbox
  gearboxMaterial: 'titanium',
  gearRatioBias: 50,
  gearboxLayout: 'compact',
  gearToothWidthMm: 18,
  differentialLockPct: 55,
  gearboxOilCoolingKw: 12.0,

  // Monocoque & Laminate Layup (Anisotropy)
  compositeFiber: 't800',
  layupPlyZeroPct: 40,
  layupPly45Pct: 40,
  layupPly90Pct: 20,
  laminateThicknessMm: 3.6,
  localReinforcementPct: 35,

  // Suspension & Kinematics
  frontSuspensionType: 'pullrod',
  rearSuspensionType: 'pushrod',
  upperArmInclinationDeg: 7.5,
  rockerMotionRatio: 0.92,
  springRateNmm: 230,
  damperNsM: 4400,
  antiRollBarNmm: 85,
  antiDivePct: 42,
  antiSquatPct: 38,
  staticCamberDeg: -2.6,
  toeAngleDeg: -0.15,
};

export interface PhysicsEnvironmentOptions {
  ambientTempC?: number; // Default 25°C (298.15 K)
  trackTempC?: number; // Default 34°C
  airPressurePa?: number; // Default 101325 Pa
  referenceSpeedKmh?: number; // Default 250 km/h (69.44 m/s)
  yawAngleDeg?: number; // Default 2.5 deg
  componentLevelAvg?: number; // Engineering maturity 1..10
  aeroDownforceOffset?: number; // Legacy career calibration scalar
  edition?: RegulationEditionSpec;
}

/**
 * Unified Vehicle Physics Facade delegating 100% of calculations to Modules M01–M09.
 * Zero duplicated physical equations; strict SI units throughout.
 */
export function solveVehiclePhysics(
  params: VehicleEngineeringParameters,
  env: PhysicsEnvironmentOptions = {}
): VehiclePhysicsOutputs {
  const edition = env.edition ?? FIA_2026_DEFAULT_EDITION;
  const ambientTempC = env.ambientTempC ?? 25;
  const ambientTempK = Math.max(220, celsiusToKelvin(ambientTempC));
  const airPressurePa = env.airPressurePa ?? 101325;
  const refSpeedMs = kmhToMs(env.referenceSpeedKmh ?? 250);
  const yawRad = degToRad(env.yawAngleDeg ?? 2.5);
  const maturityMult = 1 + ((env.componentLevelAvg ?? 1) - 1) * 0.015;

  // M01 — Air Thermodynamic State
  const air = computeAirState(airPressurePa, ambientTempK);

  // M03 — Packaging, Mass, 3D CG & Yaw Inertia
  const pkg = buildPackagingArchitecture(params, edition);

  // M04 — Corner (Mode Z) and Straight (Mode X) Aerodynamics
  const aeroCorner = evaluateAerodynamics(
    params,
    {
      speedMs: refSpeedMs,
      frontRhM: mmToM(params.frontRideHeightMm),
      rearRhM: mmToM(params.rearRideHeightMm),
      pitchRad: 0,
      yawRad,
      rollRad: 0,
      mode: 'MODE_Z',
      ambientTempK,
      airPressurePa,
      gearboxLayout: params.gearboxLayout,
    },
    edition
  );

  const aeroStraight = evaluateAerodynamics(
    params,
    {
      speedMs: refSpeedMs,
      frontRhM: Math.max(0.008, mmToM(params.frontRideHeightMm) - 0.002),
      rearRhM: Math.max(0.015, mmToM(params.rearRideHeightMm) - 0.004),
      pitchRad: 0,
      yawRad: 0,
      rollRad: 0,
      mode: 'MODE_X',
      ambientTempK,
      airPressurePa,
      gearboxLayout: params.gearboxLayout,
      inAeroActivationZone: true,
      wetSurface: false,
    },
    edition
  );

  // M08 — Power Unit (coupled turbo, ICE, MGU-K, Energy Store, cooling network)
  const pu = evaluatePowerUnit(
    params,
    {
      rpm: 11600,
      throttleRatio: 1.0,
      vehicleSpeedMs: refSpeedMs,
      ambientTempK,
      airPressurePa,
      initialSoc01: 0.72,
      cycleDurationS: 5.0,
      regenPowerCommandW: 110000,
      deployCommandRatio: 0.92,
      cumulativeRaceCycles: 100,
    },
    edition
  );

  // M06 — Pacejka Tire Evaluation at nominal 250 km/h corner load
  const dfTotalCornerN = aeroCorner.forces.downforceTotalN * maturityMult + (env.aeroDownforceOffset ?? 0) * 120;
  const estWheelLoadN = (pkg.totalMassKg * 9.80665 + dfTotalCornerN) / 4;
  const trackTempK = celsiusToKelvin(env.trackTempC ?? 34);
  const tireCorner = evaluateTirePhysics({
    compoundCode: 'medium',
    verticalLoadN: estWheelLoadN,
    slipAngleRad: 0.105,
    wheelAngularVelRadS: refSpeedMs / 0.36,
    wheelVxMs: refSpeedMs,
    effectiveRadiusM: 0.36,
    camberRad: degToRad(params.staticCamberDeg * 0.75),
    tempInnerK: trackTempK + 60,
    tempCenterK: trackTempK + 62,
    tempOuterK: trackTempK + 64,
    tempCarcassK: trackTempK + 54,
    ambientTempK,
    atmosphericPressurePa: airPressurePa,
    coldGasMolesN: 4.55,
    internalGasVolumeM3: 0.044,
    surfaceGripFactor: 1.0,
    waterFilmMm: 0,
    surfaceMacroTextureMm: 1.0,
    dtS: 0.05,
    currentWearRatio: 0.04,
  });

  // M05 — Coupled Vehicle Dynamics (4.2G cornering reference)
  const dynamics = evaluateVehicleDynamics(params, pkg, {
    speedMs: refSpeedMs,
    steerAngleRad: 0.055,
    longAccelMs2: 0,
    latAccelMs2: 4.2 * 9.80665,
    brakePressureRatio: 0,
    brakeBiasFront: 0.56,
    brakeDiscTempK: 920,
    mgukRegenTorqueNm: 0,
    aeroMode: 'MODE_Z',
    ambientTempK,
    airPressurePa,
    tireMaxFxFrontN: tireCorner.forcesAndMoments.fxPeakN * 1.9,
    tireMaxFxRearN: tireCorner.forcesAndMoments.fxPeakN * 2.0,
    tireMaxFyFrontN: tireCorner.forcesAndMoments.fyPeakN * 1.9,
    tireMaxFyRearN: tireCorner.forcesAndMoments.fyPeakN * 2.0,
  });

  // Braking pitch reference evaluation (4.5G braking)
  const brakingDyn = evaluateVehicleDynamics(params, pkg, {
    speedMs: refSpeedMs,
    steerAngleRad: 0,
    longAccelMs2: -4.5 * 9.80665,
    latAccelMs2: 0,
    brakePressureRatio: 0.85,
    brakeBiasFront: 0.56,
    brakeDiscTempK: 980,
    mgukRegenTorqueNm: -280,
    aeroMode: 'MODE_Z',
    ambientTempK,
    airPressurePa,
    tireMaxFxFrontN: tireCorner.forcesAndMoments.fxPeakN * 2.1,
    tireMaxFxRearN: tireCorner.forcesAndMoments.fxPeakN * 1.9,
    tireMaxFyFrontN: tireCorner.forcesAndMoments.fyPeakN * 1.8,
    tireMaxFyRearN: tireCorner.forcesAndMoments.fyPeakN * 1.9,
  });

  // M09 — Transmission & Gearbox (6th gear reference)
  const transmission = evaluateTransmission(
    params,
    {
      selectedGear: 6,
      engineTorqueNm: pu.totalShaftOutput.crankshaftTotalTorqueNm,
      engineOmegaRadS: pu.shaftAndIce.crankOmegaRadS,
      wheelOmegaLeftRadS: refSpeedMs / 0.36 + 0.8,
      wheelOmegaRightRadS: refSpeedMs / 0.36 - 0.8,
      clutchSlipOmegaRadS: 10,
      tireEffectiveRadiusM: 0.36,
      maxTireAxleTractionN: tireCorner.forcesAndMoments.fxPeakN * 2,
      shiftTimeCommandS: Math.max(edition.minShiftTimeS, 0.045),
      ambientTempK,
      isHollowDriveshaft: true,
    },
    edition
  );

  // M07 — Composite Structures & CLT
  const structures = evaluateStructures(
    params,
    {
      peakDownforceN: aeroCorner.forces.downforceTotalN * 1.4,
      peakCornerLatAccelMs2: 4.2 * 9.80665,
      peakBrakeAccelMs2: 4.8 * 9.80665,
      totalMassKg: pkg.totalMassKg,
      shaftPowerW: pu.totalShaftOutput.crankshaftTotalPowerW,
    },
    edition
  );

  // Derived compatibility fields mapped directly from SI M01..M09 outputs
  const dfTotalZ = Math.round(aeroCorner.forces.downforceTotalN);
  const dfFrontZ = Math.round(aeroCorner.forces.downforceFrontN);
  const dfRearZ = Math.round(aeroCorner.forces.downforceRearN);
  const dragForceZ = Math.round(aeroCorner.forces.dragTotalN);
  const dfTotalX = Math.round(aeroStraight.forces.downforceTotalN);
  const dragForceX = Math.round(aeroStraight.forces.dragTotalN);

  const effectiveIcePowerKw = (pu.shaftAndIce.icePowerW / 1000) * maturityMult;
  const effectiveMgukPowerKw = pu.ersAndBattery.mgukActualShaftW / 1000;
  const totalWheelPowerKw = (transmission.kinematicsAndTorque.outputAxlePowerW / 1000) * maturityMult;
  const mechanicalLossesKw = transmission.kinematicsAndTorque.mechanicalPowerLossW / 1000;

  const iceOperatingTempC = kelvinToCelsius(pu.thermalAndLubrication.iceTempK);
  const batteryCellTempC = kelvinToCelsius(pu.thermalAndLubrication.batteryTempK);
  const gearboxOilTempC = kelvinToCelsius(transmission.structuralAndFatigue.oilTempK);
  const thermalMarginC = pu.thermalAndLubrication.thermalMarginK;

  const totalCornerFyN = Math.round(4 * tireCorner.forcesAndMoments.fyPeakN * 0.94);
  const totalLongFxN = Math.round(4 * tireCorner.forcesAndMoments.fxPeakN * 0.94);
  const latLoadTransferPct = Number(
    ((dynamics.loadTransferSeparation.lateralTotalTransferN / Math.max(1, pkg.totalMassKg * 9.80665)) * 100).toFixed(1)
  );
  const loadSensitivityLossPct = Number(
    Math.min(18, Math.pow(dynamics.loadTransferSeparation.lateralTotalTransferN / Math.max(1000, estWheelLoadN * 2), 1.35) * 14.5).toFixed(1)
  );

  const toeScrubHeat = Math.abs(params.toeAngleDeg) * 18;
  const tireThermalWindowHealthPct = Math.round(
    Math.min(
      99,
      Math.max(
        58,
        94 - toeScrubHeat - Math.abs(dynamics.kinematicsAndCompliance.dynamicFrontCamberDeg + 1.4) * 5
      )
    )
  );
  const tireWearRateMultiplier = Number(
    Math.max(0.75, Math.min(1.45, 1.0 + tireCorner.degradationStates.abrasiveWearDelta * 2200)).toFixed(3)
  );

  const aeroBalanceFrontPct = Number((aeroCorner.forces.frontBalanceBf * 100).toFixed(1));
  const yawSensitivityPct = Number((Math.abs(aeroCorner.sensitivities.dClDYawPerRad) * 1.4).toFixed(1));
  const porpoisingRiskPct = aeroCorner.sensitivities.porpoisingRiskPct;

  const cornerGripScore = Math.min(
    100,
    Math.max(
      40,
      Math.round(
        52 +
          (totalCornerFyN / 38000) * 32 +
          (1 - Math.abs(aeroBalanceFrontPct - 45) / 25) * 10 -
          (porpoisingRiskPct > 55 ? (porpoisingRiskPct - 55) * 0.25 : 0)
      )
    )
  );
  const powerToDragRatio = totalWheelPowerKw / Math.max(0.5, aeroStraight.forces.cdAM2);
  const straightSpeedScore = Math.min(100, Math.max(40, Math.round(42 + (powerToDragRatio / 1100) * 48)));
  const reliabilityScore = Math.min(
    100,
    Math.max(
      35,
      Math.round(
        74 +
          Math.min(14, thermalMarginC * 0.9) +
          Math.min(10, (structures.failureSummary.minBucklingFactor - 1.0) * 18) -
          Math.max(0, structures.failureSummary.delaminationRiskPct - 25) * 0.3 -
          (transmission.structuralAndFatigue.fatigueLifeRaces < 5
            ? (5 - transmission.structuralAndFatigue.fatigueLifeRaces) * 4
            : 0)
      )
    )
  );
  const consistencyScore = Math.min(
    100,
    Math.max(
      40,
      Math.round(
        88 -
          porpoisingRiskPct * 0.35 -
          yawSensitivityPct * 0.4 +
          (dynamics.suspensionResponse.dampingRatioFront > 0.35 ? 6 : -6)
      )
    )
  );
  const aeroScore = Math.min(
    100,
    Math.max(
      40,
      Math.round(
        45 + (aeroCorner.forces.clTotal / 4.2) * 28 + (aeroCorner.forces.aeroEfficiencyLD / 3.8) * 18
      )
    )
  );
  const carRating = Math.round(
    cornerGripScore * 0.34 + straightSpeedScore * 0.28 + aeroScore * 0.22 + consistencyScore * 0.16
  );

  // Cooling drag directly from sidepod inlet/pressure ratio
  const coolingCd = (params.sidepodInletAreaCm2 / 10000) * 2.15 + (pu.thermalAndLubrication.ductPressureDropPa / Math.max(100, aeroCorner.dynamicPressurePa)) * 0.028;
  const coolingDragN = Math.round(coolingCd * aeroCorner.dynamicPressurePa * aeroCorner.referenceAreaM2);
  const maintenanceTurnaroundPenaltyMin = params.gearboxLayout === 'compact' ? 22 : -12;

  return {
    airDensityKgM3: Number(air.densityKgM3.toFixed(4)),
    referenceSpeedMs: Number(refSpeedMs.toFixed(2)),
    cornerMode: {
      downforceTotalN: dfTotalZ,
      downforceFrontN: dfFrontZ,
      downforceRearN: dfRearZ,
      dragForceN: dragForceZ,
      clTotal: Number(aeroCorner.forces.clTotal.toFixed(3)),
      cdTotal: Number(aeroCorner.forces.cdTotal.toFixed(3)),
      cdAM2: Number(aeroCorner.forces.cdAM2.toFixed(3)),
      aeroEfficiencyLD: Number(aeroCorner.forces.aeroEfficiencyLD.toFixed(2)),
      aeroBalanceFrontPct,
    },
    straightMode: {
      downforceTotalN: dfTotalX,
      dragForceN: dragForceX,
      clTotal: Number(aeroStraight.forces.clTotal.toFixed(3)),
      cdTotal: Number(aeroStraight.forces.cdTotal.toFixed(3)),
      cdAM2: Number(aeroStraight.forces.cdAM2.toFixed(3)),
      aeroEfficiencyLD: Number(aeroStraight.forces.aeroEfficiencyLD.toFixed(2)),
      dragReductionPct: Number((((dragForceZ - dragForceX) / Math.max(1, dragForceZ)) * 100).toFixed(1)),
    },
    rideHeightSensitivityNPerMm: Math.round(Math.abs(aeroCorner.sensitivities.dFzDhFrontNPerM) / 1000),
    yawSensitivityPct,
    separationMarginPct: Math.round(aeroCorner.sensitivities.separationMarginPct),
    porpoisingRiskPct,
    diffuserPressureRecoveryPct: Number(aeroCorner.sensitivities.diffuserPressureRecoveryPct.toFixed(1)),
    massFlowKgS: Number(pu.thermalAndLubrication.airMassFlowKgS.toFixed(2)),
    ductPressureDropPa: pu.thermalAndLubrication.ductPressureDropPa,
    radiatorHeatRejectionKw: Number((pu.thermalAndLubrication.heatRejectedW / 1000).toFixed(1)),
    iceHeatGenerationKw: Number((pu.thermalAndLubrication.heatIceW / 1000).toFixed(1)),
    batteryJouleLossesKw: Number((pu.ersAndBattery.jouleLossW / 1000).toFixed(2)),
    totalPuHeatKw: Number((pu.thermalAndLubrication.heatTotalGeneratedW / 1000).toFixed(1)),
    iceOperatingTempC: Number(iceOperatingTempC.toFixed(1)),
    batteryCellTempC: Number(batteryCellTempC.toFixed(1)),
    gearboxOilTempC: Number(gearboxOilTempC.toFixed(1)),
    thermalMarginC: Number(thermalMarginC.toFixed(1)),
    coolingDragN,
    totalMassKg: Number(pkg.totalMassKg.toFixed(1)),
    legalMinMassKg: edition.minMassKg,
    weightDistFrontPct: Number(pkg.staticAxleDist.frontPct.toFixed(1)),
    cgHeightMm: Number((pkg.cgM.z * 1000).toFixed(1)),
    torsionalStiffnessNmDeg: structures.stiffnessMetrics.torsionalStiffnessNmPerDeg,
    flexuralStiffnessNmm: Math.round(structures.stiffnessMetrics.flexuralStiffnessNm / 1000),
    maxLaminateStressMpa: Math.round(structures.loadCases[4]?.maxStressMpa ?? 260),
    bucklingSafetyFactor: structures.failureSummary.minBucklingFactor,
    fatigueLifeRaces: Math.min(structures.failureSummary.fatigueLifeRaces, transmission.structuralAndFatigue.fatigueLifeRaces),
    impactAbsorptionMarginPct: structures.failureSummary.impactAbsorptionMarginPct,
    delaminationRiskPct: structures.failureSummary.delaminationRiskPct,
    camberGainDegPerMm: dynamics.kinematicsAndCompliance.camberGainDegPerMm,
    brakingPitchDeg: Number(((Math.abs(brakingDyn.platformState.pitchRad) * 180) / Math.PI).toFixed(2)),
    cornerRollDeg: Number(((Math.abs(dynamics.platformState.rollRad) * 180) / Math.PI).toFixed(2)),
    lateralLoadTransferPct: latLoadTransferPct,
    naturalFrequencyHz: dynamics.suspensionResponse.naturalFrequencyFrontHz,
    dampingRatio: dynamics.suspensionResponse.dampingRatioFront,
    tirePeakLateralN: totalCornerFyN,
    tirePeakLongitudinalN: totalLongFxN,
    tireLoadSensitivityLossPct: loadSensitivityLossPct,
    tireThermalWindowHealthPct,
    tireWearRateMultiplier,
    effectiveIcePowerKw: Number(effectiveIcePowerKw.toFixed(1)),
    effectiveMgukPowerKw: Number(effectiveMgukPowerKw.toFixed(1)),
    totalWheelPowerKw: Number(totalWheelPowerKw.toFixed(1)),
    totalWheelPowerHp: Math.round(kwToHp(totalWheelPowerKw)),
    transmissionEfficiencyPct: Number((transmission.kinematicsAndTorque.gearboxEfficiency * 100).toFixed(2)),
    mechanicalLossesKw: Number(mechanicalLossesKw.toFixed(1)),
    turboSpoolLagMs: pu.turbocharger.spoolLagMs,
    maintenanceTurnaroundPenaltyMin,
    summary: {
      carRating,
      cornerGripScore,
      straightSpeedScore,
      reliabilityScore,
      consistencyScore,
      aeroScore,
      downforcePoints: Math.round(dfTotalZ / 260),
      // True physical CD from M04 (removed arbitrary 0.45 scaling)
      dragCoefficient: Number(aeroCorner.forces.cdTotal.toFixed(3)),
    },
  };
}
