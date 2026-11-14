import type { VehicleEngineeringParameters } from '../../types/physics.ts';
import { COORDINATE_FRAME_STANDARD, type GateResult } from './m01Foundation.ts';
import type { PackagingAnalysisOutputs } from './m03Packaging.ts';
import { type AeroMode2026, evaluateAerodynamics } from './m04Aerodynamics.ts';

// M05 — Dinâmica Veicular (Manual Mestre Seção 5.1 - 5.4)

export interface DynamicsInputState {
  speedMs: number;
  steerAngleRad: number;
  longAccelMs2: number; // + acceleration, - braking
  latAccelMs2: number; // + right turn
  brakePressureRatio: number; // 0..1
  brakeBiasFront: number; // e.g. 0.56
  brakeDiscTempK: number;
  mgukRegenTorqueNm: number; // negative torque at rear axle during braking
  aeroMode: AeroMode2026;
  ambientTempK: number;
  airPressurePa: number;
  tireMaxFxFrontN: number;
  tireMaxFxRearN: number;
  tireMaxFyFrontN: number;
  tireMaxFyRearN: number;
}

export interface KinematicSweepPoint {
  wheelTravelM: number; // + compression (bump), - droop
  camberDeg: number;
  toeDeg: number;
  rollCenterHeightM: number;
}

export interface VehicleDynamicsOutputs {
  modelVersion: string;
  coordinateFrame: typeof COORDINATE_FRAME_STANDARD;
  masses: {
    totalMassKg: number;
    sprungMassKg: number;
    unsprungFrontKg: number;
    unsprungRearKg: number;
  };
  platformState: {
    dynFrontRhM: number;
    dynRearRhM: number;
    pitchRad: number;
    rollRad: number;
    yawRateRadS: number;
    vxDotMs2: number;
    vyDotMs2: number;
    yawAccelRadS2: number;
    aeroCouplingIterations: number;
    aeroCouplingConverged: boolean;
    aeroCouplingResidualM: number;
  };
  wheelLoadsN: {
    frontLeft: number;
    frontRight: number;
    rearLeft: number;
    rearRight: number;
    totalStaticAndAeroN: number;
    closureErrorN: number;
  };
  loadTransferSeparation: {
    longitudinalTotalTransferN: number;
    longitudinalElasticFrontDeltaN: number; // reduced by anti-dive
    lateralTotalTransferN: number;
    lateralGeometricFrontN: number;
    lateralGeometricRearN: number;
    lateralElasticFrontN: number;
    lateralElasticRearN: number;
    nonDuplicationVerified: boolean;
  };
  suspensionResponse: {
    frontWheelRateNPerM: number;
    rearWheelRateNPerM: number;
    naturalFrequencyFrontHz: number;
    naturalFrequencyRearHz: number;
    dampingRatioFront: number;
    dampingRatioRear: number;
    rollStiffnessTotalNmPerRad: number;
    frontRollStiffnessShare: number;
    transientSettlingTimeS: number;
    transientStable: boolean;
    damperTempCorrectionFactor: number;
  };
  kinematicsAndCompliance: {
    frontRollCenterM: number;
    rearRollCenterM: number;
    rollCenterMigrationM: number;
    camberGainDegPerMm: number;
    dynamicFrontCamberDeg: number;
    dynamicRearCamberDeg: number;
    complianceToeDeflectionDeg: number;
    casterTrailM: number;
    selfAligningTorqueEstNm: number;
    sweepCurve: KinematicSweepPoint[];
  };
  braking: {
    requestedBrakeForceN: number;
    mgukRegenForceN: number;
    hydraulicFrontForceN: number;
    hydraulicRearForceN: number;
    actualLongForceN: number;
    fadeFactor: number;
    tireGripLimited: boolean;
  };
}

export function evaluateVehicleDynamics(
  params: VehicleEngineeringParameters,
  pkg: PackagingAnalysisOutputs,
  input: DynamicsInputState
): VehicleDynamicsOutputs {
  const g = 9.80665;
  const L = pkg.wheelbaseM;
  const t = pkg.frontTrackM;
  const totalMassKg = pkg.totalMassKg;

  // Separate Sprung vs Unsprung Masses (Rule 5.2)
  const unsprungFrontKg = 36.0;
  const unsprungRearKg = 40.0;
  const sprungMassKg = Math.max(400, totalMassKg - unsprungFrontKg - unsprungRearKg);

  // Wheel rates with rocker motion ratio & nonlinear progressive bump-rubber stiffness
  const mr = params.rockerMotionRatio;
  const frontSpringBaseNPerM = params.springRateNmm * 1000;
  const rearSpringBaseNPerM = frontSpringBaseNPerM * 0.94;
  const frontWheelRateNPerM = frontSpringBaseNPerM * mr * mr;
  const rearWheelRateNPerM = rearSpringBaseNPerM * mr * mr;

  // Damper temperature-viscosity correction (oil at ~333 K nominal)
  const damperTempK = Math.max(280, Math.min(390, input.ambientTempK + 35));
  const damperTempCorrectionFactor = Math.max(0.75, Math.min(1.25, 1.0 - (damperTempK - 333) * 0.004));
  const frontDamperWheelNsM = params.damperNsM * mr * mr * damperTempCorrectionFactor;
  const rearDamperWheelNsM = params.damperNsM * 1.05 * mr * mr * damperTempCorrectionFactor;

  const frontSprungCornerKg = (sprungMassKg * (pkg.staticAxleDist.frontPct / 100)) / 2;
  const rearSprungCornerKg = (sprungMassKg * (pkg.staticAxleDist.rearPct / 100)) / 2;

  const naturalFrequencyFrontHz = (1 / (2 * Math.PI)) * Math.sqrt(frontWheelRateNPerM / frontSprungCornerKg);
  const naturalFrequencyRearHz = (1 / (2 * Math.PI)) * Math.sqrt(rearWheelRateNPerM / rearSprungCornerKg);
  const dampingRatioFront = frontDamperWheelNsM / (2 * Math.sqrt(frontWheelRateNPerM * frontSprungCornerKg));
  const dampingRatioRear = rearDamperWheelNsM / (2 * Math.sqrt(rearWheelRateNPerM * rearSprungCornerKg));

  // Roll stiffness: 0.5 * K_wheel * t^2 + K_arb
  const frontArbNmPerRad = params.antiRollBarNmm * 1000 * 0.42 * t * t;
  const rearArbNmPerRad = frontArbNmPerRad * 0.72;
  const frontRollStiff = 0.5 * frontWheelRateNPerM * t * t + frontArbNmPerRad;
  const rearRollStiff = 0.5 * rearWheelRateNPerM * t * t + rearArbNmPerRad;
  const rollStiffnessTotalNmPerRad = frontRollStiff + rearRollStiff;
  const frontRollStiffnessShare = frontRollStiff / rollStiffnessTotalNmPerRad;

  // Coupled M04 <-> M05 iteration for ride heights, pitch & roll under aero loads!
  const staticFrontRhM = params.frontRideHeightMm / 1000;
  const staticRearRhM = params.rearRideHeightMm / 1000;
  let dynFrontRhM = staticFrontRhM;
  let dynRearRhM = staticRearRhM;
  let pitchRad = 0;
  let rollRad = 0;
  let aeroOut = evaluateAerodynamics(params, {
    speedMs: input.speedMs,
    frontRhM: dynFrontRhM,
    rearRhM: dynRearRhM,
    pitchRad,
    yawRad: input.steerAngleRad * 0.15,
    rollRad,
    mode: input.aeroMode,
    ambientTempK: input.ambientTempK,
    airPressurePa: input.airPressurePa,
    gearboxLayout: params.gearboxLayout,
  });

  const antiDive = params.antiDivePct / 100;
  const antiSquat = params.antiSquatPct / 100;
  const longTransferTotalN = (totalMassKg * input.longAccelMs2 * pkg.cgM.z) / L; // +ax loads rear, unloads front

  // Roll center heights & migration
  const baseFrontRcM = params.frontSuspensionType === 'pullrod' ? 0.042 : 0.056;
  const baseRearRcM = params.rearSuspensionType === 'pullrod' ? 0.058 : 0.072;
  const latTransferTotalN = (totalMassKg * input.latAccelMs2 * pkg.cgM.z) / t;
  const latForceTotalN = totalMassKg * input.latAccelMs2;
  const frontLatForceN = latForceTotalN * (pkg.staticAxleDist.frontPct / 100);
  const rearLatForceN = latForceTotalN * (pkg.staticAxleDist.rearPct / 100);

  let aeroCouplingResidualM = 1;
  let aeroCouplingIter = 0;
  let aeroCouplingConverged = false;

  for (let iter = 1; iter <= 15; iter++) {
    aeroCouplingIter = iter;
    aeroOut = evaluateAerodynamics(params, {
      speedMs: input.speedMs,
      frontRhM: dynFrontRhM,
      rearRhM: dynRearRhM,
      pitchRad,
      yawRad: input.steerAngleRad * 0.15,
      rollRad,
      mode: input.aeroMode,
      ambientTempK: input.ambientTempK,
      airPressurePa: input.airPressurePa,
      gearboxLayout: params.gearboxLayout,
    });

    // Axle elastic heave deflections from aero downforce + longitudinal transfer relieved by anti-geometry
    const longElasticResisted = input.longAccelMs2 < 0 ? 1 - antiDive : 1 - antiSquat;
    const frontVerticalElasticN = aeroOut.forces.downforceFrontN - longTransferTotalN * longElasticResisted;
    const rearVerticalElasticN = aeroOut.forces.downforceRearN + longTransferTotalN * longElasticResisted;

    // Include progressive bump stop stiffness if compression > 12mm
    const frontCompressEst = frontVerticalElasticN / (2 * frontWheelRateNPerM);
    const effFrontK = frontCompressEst > 0.012 ? frontWheelRateNPerM * 1.35 : frontWheelRateNPerM;
    const rearCompressEst = rearVerticalElasticN / (2 * rearWheelRateNPerM);
    const effRearK = rearCompressEst > 0.014 ? rearWheelRateNPerM * 1.35 : rearWheelRateNPerM;

    const nextFrontRh = Math.max(0.007, staticFrontRhM - frontVerticalElasticN / (2 * effFrontK));
    const nextRearRh = Math.max(0.012, staticRearRhM - rearVerticalElasticN / (2 * effRearK));

    // Sprung mass roll moment about roll axis: M_roll = m_s * ay * (z_CG_s - z_RC_avg)
    const zRcAvg =
      baseFrontRcM * (pkg.staticAxleDist.frontPct / 100) +
      baseRearRcM * (pkg.staticAxleDist.rearPct / 100);
    const rollMomentNm = sprungMassKg * input.latAccelMs2 * Math.max(0.05, pkg.cgM.z - zRcAvg);
    const nextRollRad = rollMomentNm / rollStiffnessTotalNmPerRad;
    const nextPitchRad = Math.atan((nextRearRh - nextFrontRh) - (staticRearRhM - staticFrontRhM) / 1) * (1 / L);

    const err = Math.max(Math.abs(nextFrontRh - dynFrontRhM), Math.abs(nextRearRh - dynRearRhM));
    // Under-relaxed fixed-point update
    dynFrontRhM = 0.65 * nextFrontRh + 0.35 * dynFrontRhM;
    dynRearRhM = 0.65 * nextRearRh + 0.35 * dynRearRhM;
    rollRad = 0.65 * nextRollRad + 0.35 * rollRad;
    pitchRad = (dynRearRhM - dynFrontRhM - (staticRearRhM - staticFrontRhM)) / L;
    aeroCouplingResidualM = err;
    if (err < 1e-5) {
      aeroCouplingConverged = true;
      break;
    }
  }

  // Exact separation of geometric vs elastic lateral load transfer (Rule 5.2: no duplication)
  const frontRcMigrated = Math.max(0.01, baseFrontRcM - (staticFrontRhM - dynFrontRhM) * 0.45);
  const rearRcMigrated = Math.max(0.015, baseRearRcM - (staticRearRhM - dynRearRhM) * 0.40);
  const rollCenterMigrationM = Math.abs(frontRcMigrated - baseFrontRcM);

  const latGeometricFrontN = (frontLatForceN * frontRcMigrated) / t;
  const latGeometricRearN = (rearLatForceN * rearRcMigrated) / t;
  const remainingElasticLatMomentNm = Math.max(0, totalMassKg * input.latAccelMs2 * pkg.cgM.z - (latGeometricFrontN + latGeometricRearN) * t);
  const latElasticFrontN = (remainingElasticLatMomentNm * frontRollStiffnessShare) / t;
  const latElasticRearN = (remainingElasticLatMomentNm * (1 - frontRollStiffnessShare)) / t;

  const frontTotalLatTransferN = latGeometricFrontN + latElasticFrontN;
  const rearTotalLatTransferN = latGeometricRearN + latElasticRearN;

  // Axle base loads (static + aero + total longitudinal transfer)
  const fzFrontAxleN = pkg.staticAxleDist.frontLoadN + aeroOut.forces.downforceFrontN - longTransferTotalN;
  const fzRearAxleN = pkg.staticAxleDist.rearLoadN + aeroOut.forces.downforceRearN + longTransferTotalN;

  // Individual corner loads (+ay loads left/outside in right turn)
  const frontLeft = Math.max(0, fzFrontAxleN * 0.5 + frontTotalLatTransferN);
  const frontRight = Math.max(0, fzFrontAxleN * 0.5 - frontTotalLatTransferN);
  const rearLeft = Math.max(0, fzRearAxleN * 0.5 + rearTotalLatTransferN);
  const rearRight = Math.max(0, fzRearAxleN * 0.5 - rearTotalLatTransferN);
  const totalStaticAndAeroN = totalMassKg * g + aeroOut.forces.downforceTotalN;
  const closureErrorN = Math.abs(frontLeft + frontRight + rearLeft + rearRight - totalStaticAndAeroN);

  // Planar 3DOF Equations: m(vx_dot - r*vy) = Sum(Fx), m(vy_dot + r*vx) = Sum(Fy), Iz*r_dot = Sum(Mz)
  const vx = Math.max(1, input.speedMs);
  const vy = vx * Math.tan(input.steerAngleRad * 0.12);
  const yawRateRadS = Math.abs(input.latAccelMs2) > 0.01 ? input.latAccelMs2 / vx : (vx * Math.sin(input.steerAngleRad)) / L;

  // Braking & MGU-K regen blending limited by combined tire grip
  const maxBrakeHydraulicN = input.brakePressureRatio * 34000;
  const fadeFactor = input.brakeDiscTempK > 1120 ? Math.max(0.72, 1 - (input.brakeDiscTempK - 1120) * 0.0012) : 1.0;
  const effHydN = maxBrakeHydraulicN * fadeFactor;
  const hydraulicFrontForceN = Math.min(input.tireMaxFxFrontN, effHydN * input.brakeBiasFront);
  const mgukRegenForceN = Math.abs(input.mgukRegenTorqueNm) / 0.36; // tire radius ~0.36 m
  const hydraulicRearRaw = effHydN * (1 - input.brakeBiasFront);
  const rearBrakingTotal = Math.min(input.tireMaxFxRearN, hydraulicRearRaw + mgukRegenForceN);
  const hydraulicRearForceN = Math.max(0, rearBrakingTotal - mgukRegenForceN);
  const requestedBrakeForceN = effHydN + mgukRegenForceN;
  const actualBrakeForceN = hydraulicFrontForceN + rearBrakingTotal;
  const tireGripLimited = requestedBrakeForceN > actualBrakeForceN + 1;

  const netFxN =
    input.brakePressureRatio > 0.01
      ? -(actualBrakeForceN + aeroOut.forces.dragTotalN)
      : totalMassKg * input.longAccelMs2;
  const netFyN = Math.sign(input.latAccelMs2 || 1) * Math.min(input.tireMaxFyFrontN + input.tireMaxFyRearN, Math.abs(latForceTotalN));
  const vxDotMs2 = netFxN / totalMassKg + yawRateRadS * vy;
  const vyDotMs2 = netFyN / totalMassKg - yawRateRadS * vx;
  const yawMomentNm = (input.tireMaxFyFrontN * (L - pkg.cgM.x) - input.tireMaxFyRearN * pkg.cgM.x) * 0.15 * Math.sin(input.steerAngleRad);
  const yawAccelRadS2 = yawMomentNm / pkg.yawInertiaIzKgM2;

  // Kinematics & Compliance
  const camberGainDegPerMm = 0.018 + (params.upperArmInclinationDeg / 14) * 0.042;
  const frontTravelMm = (staticFrontRhM - dynFrontRhM) * 1000;
  const rearTravelMm = (staticRearRhM - dynRearRhM) * 1000;
  const rollDeg = (rollRad * 180) / Math.PI;
  const dynamicFrontCamberDeg = params.staticCamberDeg - camberGainDegPerMm * frontTravelMm + Math.abs(rollDeg) * 0.72;
  const dynamicRearCamberDeg = params.staticCamberDeg * 0.75 - camberGainDegPerMm * 0.85 * rearTravelMm + Math.abs(rollDeg) * 0.65;
  const complianceToeDeflectionDeg = (Math.abs(netFyN) / 30000) * 0.14 * (1 - params.localReinforcementPct / 200);
  const casterTrailM = 0.026 + (params.upperArmInclinationDeg - 7.5) * 0.0012;
  const selfAligningTorqueEstNm = netFyN * 0.45 * casterTrailM;

  const sweepCurve: KinematicSweepPoint[] = [];
  for (let travelMm = -20; travelMm <= 30; travelMm += 5) {
    const travelM = travelMm / 1000;
    sweepCurve.push({
      wheelTravelM: travelM,
      camberDeg: Number((params.staticCamberDeg - camberGainDegPerMm * travelMm).toFixed(3)),
      toeDeg: Number((params.toeAngleDeg + travelMm * 0.004).toFixed(4)),
      rollCenterHeightM: Number(Math.max(0.01, baseFrontRcM - travelM * 0.45).toFixed(4)),
    });
  }

  // Transient damping stability check: 2% settling time t_s ~ 4 / (zeta * wn)
  const wn = 2 * Math.PI * Math.min(naturalFrequencyFrontHz, naturalFrequencyRearHz);
  const minZeta = Math.min(dampingRatioFront, dampingRatioRear);
  const transientSettlingTimeS = 4 / Math.max(0.5, minZeta * wn);
  const transientStable = minZeta >= 0.20 && transientSettlingTimeS < 1.2 && aeroCouplingConverged;

  return {
    modelVersion: '1.0.0',
    coordinateFrame: COORDINATE_FRAME_STANDARD,
    masses: {
      totalMassKg: pkg.totalMassKg,
      sprungMassKg: Number(sprungMassKg.toFixed(2)),
      unsprungFrontKg,
      unsprungRearKg,
    },
    platformState: {
      dynFrontRhM: Number(dynFrontRhM.toFixed(4)),
      dynRearRhM: Number(dynRearRhM.toFixed(4)),
      pitchRad: Number(pitchRad.toFixed(5)),
      rollRad: Number(rollRad.toFixed(5)),
      yawRateRadS: Number(yawRateRadS.toFixed(4)),
      vxDotMs2: Number(vxDotMs2.toFixed(3)),
      vyDotMs2: Number(vyDotMs2.toFixed(3)),
      yawAccelRadS2: Number(yawAccelRadS2.toFixed(3)),
      aeroCouplingIterations: aeroCouplingIter,
      aeroCouplingConverged,
      aeroCouplingResidualM: Number(aeroCouplingResidualM.toExponential(2)),
    },
    wheelLoadsN: {
      frontLeft: Number(frontLeft.toFixed(1)),
      frontRight: Number(frontRight.toFixed(1)),
      rearLeft: Number(rearLeft.toFixed(1)),
      rearRight: Number(rearRight.toFixed(1)),
      totalStaticAndAeroN: Number(totalStaticAndAeroN.toFixed(1)),
      closureErrorN: Number(closureErrorN.toFixed(2)),
    },
    loadTransferSeparation: {
      longitudinalTotalTransferN: Number(longTransferTotalN.toFixed(1)),
      longitudinalElasticFrontDeltaN: Number((longTransferTotalN * (1 - antiDive)).toFixed(1)),
      lateralTotalTransferN: Number(latTransferTotalN.toFixed(1)),
      lateralGeometricFrontN: Number(latGeometricFrontN.toFixed(1)),
      lateralGeometricRearN: Number(latGeometricRearN.toFixed(1)),
      lateralElasticFrontN: Number(latElasticFrontN.toFixed(1)),
      lateralElasticRearN: Number(latElasticRearN.toFixed(1)),
      nonDuplicationVerified: Math.abs(frontTotalLatTransferN + rearTotalLatTransferN - latTransferTotalN) < 5.0,
    },
    suspensionResponse: {
      frontWheelRateNPerM: Math.round(frontWheelRateNPerM),
      rearWheelRateNPerM: Math.round(rearWheelRateNPerM),
      naturalFrequencyFrontHz: Number(naturalFrequencyFrontHz.toFixed(2)),
      naturalFrequencyRearHz: Number(naturalFrequencyRearHz.toFixed(2)),
      dampingRatioFront: Number(dampingRatioFront.toFixed(3)),
      dampingRatioRear: Number(dampingRatioRear.toFixed(3)),
      rollStiffnessTotalNmPerRad: Math.round(rollStiffnessTotalNmPerRad),
      frontRollStiffnessShare: Number(frontRollStiffnessShare.toFixed(3)),
      transientSettlingTimeS: Number(transientSettlingTimeS.toFixed(3)),
      transientStable,
      damperTempCorrectionFactor: Number(damperTempCorrectionFactor.toFixed(3)),
    },
    kinematicsAndCompliance: {
      frontRollCenterM: Number(frontRcMigrated.toFixed(4)),
      rearRollCenterM: Number(rearRcMigrated.toFixed(4)),
      rollCenterMigrationM: Number(rollCenterMigrationM.toFixed(4)),
      camberGainDegPerMm: Number(camberGainDegPerMm.toFixed(4)),
      dynamicFrontCamberDeg: Number(dynamicFrontCamberDeg.toFixed(2)),
      dynamicRearCamberDeg: Number(dynamicRearCamberDeg.toFixed(2)),
      complianceToeDeflectionDeg: Number(complianceToeDeflectionDeg.toFixed(3)),
      casterTrailM: Number(casterTrailM.toFixed(4)),
      selfAligningTorqueEstNm: Number(selfAligningTorqueEstNm.toFixed(1)),
      sweepCurve,
    },
    braking: {
      requestedBrakeForceN: Number(requestedBrakeForceN.toFixed(1)),
      mgukRegenForceN: Number(mgukRegenForceN.toFixed(1)),
      hydraulicFrontForceN: Number(hydraulicFrontForceN.toFixed(1)),
      hydraulicRearForceN: Number(hydraulicRearForceN.toFixed(1)),
      actualLongForceN: Number(actualBrakeForceN.toFixed(1)),
      fadeFactor: Number(fadeFactor.toFixed(3)),
      tireGripLimited,
    },
  };
}

export function evaluateGate05(dyn: VehicleDynamicsOutputs): GateResult {
  const staticClosed = dyn.wheelLoadsN.closureErrorN < 5.0;
  const transientOk = dyn.suspensionResponse.transientStable;
  const kinCoverOk = dyn.kinematicsAndCompliance.sweepCurve.length >= 9;
  const noDuplicationOk =
    dyn.loadTransferSeparation.nonDuplicationVerified && dyn.platformState.aeroCouplingConverged;
  const frameConsistent = dyn.coordinateFrame.frameId === COORDINATE_FRAME_STANDARD.frameId;

  const criteria = [
    {
      id: 'G05-C1',
      label: 'Modelo estático fecha forças verticais e momentos',
      passed: staticClosed,
      detail: `Soma das 4 rodas fecha com ΣFz estático+aero (resíduo ${dyn.wheelLoadsN.closureErrorN} N).`,
    },
    {
      id: 'G05-C2',
      label: 'Resposta transitória estável e amortecida',
      passed: transientOk,
      detail: `f_n=${dyn.suspensionResponse.naturalFrequencyFrontHz} Hz, ζ=${dyn.suspensionResponse.dampingRatioFront}, estabilização ${dyn.suspensionResponse.transientSettlingTimeS} s.`,
    },
    {
      id: 'G05-C3',
      label: 'Cinemática e compliance cobrem o curso útil da suspensão',
      passed: kinCoverOk,
      detail: `Curva cinemática cobrindo [-20, +30] mm (${dyn.kinematicsAndCompliance.sweepCurve.length} pontos) + deflexão compliance.`,
    },
    {
      id: 'G05-C4',
      label: 'Integração aero/pneu iterada sem duplicar forças ou transferências',
      passed: noDuplicationOk,
      detail: `Acoplamento M04↔M05 convergiu em ${dyn.platformState.aeroCouplingIterations} iterações; transferência geométrica/elástica separada.`,
    },
    {
      id: 'G05-C5',
      label: 'Convenções e referenciais consistentes com M01/M03',
      passed: frameConsistent,
      detail: `Referencial ${dyn.coordinateFrame.frameId} ativo; massas suspensa/não suspensa separadas.`,
    },
  ];

  return {
    gateId: 'GATE_05',
    moduleCode: 'M05',
    passed: criteria.every((c) => c.passed),
    criteria,
  };
}
