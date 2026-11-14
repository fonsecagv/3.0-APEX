import type { GateResult, ManualInfoClass } from './m01Foundation.ts';

// M06 — Pneus (Manual Mestre Seção 6.1 - 6.3)

export type TireCompoundCode = 'soft' | 'medium' | 'hard' | 'inter' | 'wet';

export interface TireCompoundSpec {
  code: TireCompoundCode;
  name: string;
  nominalLoadN: number;
  loadSensitivityExpN: number; // n < 1 in Fy,max = k * Fz^n
  magicB: number;
  magicC: number;
  magicD: number; // base peak mu at nominal load & optimal temp
  magicE: number;
  relaxationLengthM: number;
  thermalCapTreadJK: number;
  thermalCapCarcassJK: number;
  optimalTempK: number;
  nominalColdPressureAbsPa: number;
  wearBaseRatePerMJ: number;
  treadDepthNewMm: number;
  infoClass: ManualInfoClass;
  version: string;
}

export const TIRE_COMPOUND_CATALOG: Record<TireCompoundCode, TireCompoundSpec> = {
  soft: {
    code: 'soft',
    name: 'Pirelli C5 Soft (Macio)',
    nominalLoadN: 5200,
    loadSensitivityExpN: 0.87,
    magicB: 12.8,
    magicC: 1.52,
    magicD: 1.78,
    magicE: 0.35,
    relaxationLengthM: 0.32,
    thermalCapTreadJK: 6200,
    thermalCapCarcassJK: 9800,
    optimalTempK: 373.15, // 100°C
    nominalColdPressureAbsPa: 256325, // ~22.5 psi gauge + 101325 Pa atm
    wearBaseRatePerMJ: 0.0085,
    treadDepthNewMm: 3.2,
    infoClass: 'Parâmetro de jogo',
    version: '1.0.0',
  },
  medium: {
    code: 'medium',
    name: 'Pirelli C3 Medium (Médio)',
    nominalLoadN: 5200,
    loadSensitivityExpN: 0.89,
    magicB: 11.9,
    magicC: 1.50,
    magicD: 1.66,
    magicE: 0.32,
    relaxationLengthM: 0.35,
    thermalCapTreadJK: 6600,
    thermalCapCarcassJK: 10200,
    optimalTempK: 378.15, // 105°C
    nominalColdPressureAbsPa: 256325,
    wearBaseRatePerMJ: 0.0054,
    treadDepthNewMm: 3.2,
    infoClass: 'Parâmetro de jogo',
    version: '1.0.0',
  },
  hard: {
    code: 'hard',
    name: 'Pirelli C1 Hard (Duro)',
    nominalLoadN: 5200,
    loadSensitivityExpN: 0.90,
    magicB: 11.2,
    magicC: 1.48,
    magicD: 1.56,
    magicE: 0.30,
    relaxationLengthM: 0.38,
    thermalCapTreadJK: 7000,
    thermalCapCarcassJK: 10600,
    optimalTempK: 383.15, // 110°C
    nominalColdPressureAbsPa: 256325,
    wearBaseRatePerMJ: 0.0036,
    treadDepthNewMm: 3.2,
    infoClass: 'Parâmetro de jogo',
    version: '1.0.0',
  },
  inter: {
    code: 'inter',
    name: 'Pirelli Cinturato Intermediate',
    nominalLoadN: 5000,
    loadSensitivityExpN: 0.88,
    magicB: 10.4,
    magicC: 1.45,
    magicD: 1.44,
    magicE: 0.25,
    relaxationLengthM: 0.40,
    thermalCapTreadJK: 6400,
    thermalCapCarcassJK: 9800,
    optimalTempK: 353.15, // 80°C
    nominalColdPressureAbsPa: 249325,
    wearBaseRatePerMJ: 0.0062,
    treadDepthNewMm: 5.5,
    infoClass: 'Parâmetro de jogo',
    version: '1.0.0',
  },
  wet: {
    code: 'wet',
    name: 'Pirelli Cinturato Full Wet',
    nominalLoadN: 5000,
    loadSensitivityExpN: 0.89,
    magicB: 9.6,
    magicC: 1.42,
    magicD: 1.32,
    magicE: 0.22,
    relaxationLengthM: 0.43,
    thermalCapTreadJK: 6500,
    thermalCapCarcassJK: 9900,
    optimalTempK: 338.15, // 65°C
    nominalColdPressureAbsPa: 242325,
    wearBaseRatePerMJ: 0.0058,
    treadDepthNewMm: 7.2,
    infoClass: 'Parâmetro de jogo',
    version: '1.0.0',
  },
};

export const TIRE_VALID_DOMAIN = {
  verticalLoadN: { min: 500, max: 14000 },
  slipAngleRad: { min: -0.35, max: 0.35 },
  slipRatio: { min: -0.45, max: 0.45 },
  tempK: { min: 278, max: 445 },
  speedMs: { min: 0, max: 110 },
};

export interface TireOperatingInput {
  compoundCode: TireCompoundCode;
  verticalLoadN: number;
  slipAngleRad: number; // alpha
  wheelAngularVelRadS: number; // omega
  wheelVxMs: number;
  effectiveRadiusM: number; // R_e ~ 0.36 m
  camberRad: number;
  tempInnerK: number;
  tempCenterK: number;
  tempOuterK: number;
  tempCarcassK: number;
  ambientTempK: number;
  atmosphericPressurePa: number;
  coldGasMolesN: number;
  internalGasVolumeM3: number;
  surfaceGripFactor: number; // e.g. 0.90..1.05
  waterFilmMm: number; // 0 for dry
  surfaceMacroTextureMm: number; // ~0.5..1.5
  dtS: number;
  prevFyTransientN?: number;
  currentWearRatio: number; // 0 (new) .. 1 (worn out)
}

export interface TireSimulationOutputs {
  modelVersion: string;
  domainStatus: {
    inValidDomain: boolean;
    extrapolationWarnings: string[];
  };
  kinematics: {
    slipAngleRad: number;
    slipRatioKappa: number;
    corneringStiffnessCalphaNPerRad: number;
  };
  forcesAndMoments: {
    fxPureN: number;
    fyPureN: number;
    fxCombinedN: number;
    fyCombinedN: number;
    fyTransientN: number;
    mzAligningNm: number;
    fxPeakN: number;
    fyPeakN: number;
    loadSensitivityExpN: number;
    frictionEllipseUtilization: number;
  };
  thermalNodes: {
    tempInnerK: number;
    tempCenterK: number;
    tempOuterK: number;
    tempTreadAvgK: number;
    tempCarcassK: number;
    qInFrictionW: number;
    qInHysteresisW: number;
    qOutConvectionW: number;
    hysteresisLossJPerRev: number;
  };
  pressureIdealGas: {
    gasTempK: number;
    pressureAbsPa: number;
    pressureGaugePa: number;
    pressureGaugePsi: number;
    estimatedPatchAreaM2: number; // A ~ Fz/p didactic note
  };
  degradationStates: {
    abrasiveWearDelta: number;
    wearRatioTotal: number;
    thermalDegradation01: number;
    grainingIndex01: number;
    blisteringIndex01: number;
    aquaplaningRisk01: number;
    effectiveGripMultiplier: number;
  };
}

export function evaluateTirePhysics(input: TireOperatingInput): TireSimulationOutputs {
  const spec = TIRE_COMPOUND_CATALOG[input.compoundCode];
  const extrapolationWarnings: string[] = [];

  if (input.verticalLoadN < TIRE_VALID_DOMAIN.verticalLoadN.min || input.verticalLoadN > TIRE_VALID_DOMAIN.verticalLoadN.max) {
    extrapolationWarnings.push(`Fz=${input.verticalLoadN} N fora do domínio [${TIRE_VALID_DOMAIN.verticalLoadN.min}, ${TIRE_VALID_DOMAIN.verticalLoadN.max}] N.`);
  }
  if (Math.abs(input.slipAngleRad) > TIRE_VALID_DOMAIN.slipAngleRad.max) {
    extrapolationWarnings.push(`Slip angle α=${input.slipAngleRad.toFixed(3)} rad fora do domínio calibrado.`);
  }

  const fzSafe = Math.max(200, Math.min(18000, input.verticalLoadN));
  const avgTreadK = (input.tempInnerK + input.tempCenterK + input.tempOuterK) / 3;
  if (avgTreadK < TIRE_VALID_DOMAIN.tempK.min || avgTreadK > TIRE_VALID_DOMAIN.tempK.max) {
    extrapolationWarnings.push(`Temperatura média ${avgTreadK.toFixed(1)} K fora do domínio calibrado.`);
  }

  // Exact Slip Ratio definition (Manual Sec 6.1): kappa = (Re*omega - Vx)/max(|Vx|, |Re*omega|, eps)
  const vWheelRim = input.effectiveRadiusM * input.wheelAngularVelRadS;
  const slipRatioKappa =
    (vWheelRim - input.wheelVxMs) / Math.max(Math.abs(input.wheelVxMs), Math.abs(vWheelRim), 0.5);

  if (Math.abs(slipRatioKappa) > TIRE_VALID_DOMAIN.slipRatio.max) {
    extrapolationWarnings.push(`Slip ratio κ=${slipRatioKappa.toFixed(3)} fora do domínio calibrado.`);
  }

  // Pressure by Ideal Gas Law in Kelvin (Rule 6.2: distinguish absolute vs gauge)
  const gasTempK = Math.max(250, 0.7 * input.tempCarcassK + 0.3 * input.ambientTempK);
  const R_gas = 8.314462618;
  const pressureAbsPa = (input.coldGasMolesN * R_gas * gasTempK) / Math.max(0.01, input.internalGasVolumeM3);
  const pressureGaugePa = pressureAbsPa - input.atmosphericPressurePa;
  const pressureGaugePsi = pressureGaugePa / 6894.757;
  const estimatedPatchAreaM2 = fzSafe / Math.max(100000, pressureAbsPa); // Didactic approximation A ~ Fz/p

  // Separated degradation states (Manual Sec 6.2)
  // 1. Abrasive wear
  const slipPowerW =
    Math.abs(input.wheelVxMs * slipRatioKappa) * fzSafe * 0.45 +
    Math.abs(input.wheelVxMs * Math.sin(input.slipAngleRad)) * fzSafe * 0.55;
  const dt = Math.max(0.005, input.dtS);
  const abrasiveWearDelta = (slipPowerW * dt * 1e-6) * spec.wearBaseRatePerMJ;
  const wearRatioTotal = Math.min(1.0, input.currentWearRatio + abrasiveWearDelta);

  // 2. Thermal degradation (temporary/permanent rubber softening over optimal temp)
  const tempDiffOptK = avgTreadK - spec.optimalTempK;
  const thermalWindowFactor = Math.max(0.65, 1 - (tempDiffOptK / 38) ** 2 * 0.28);
  const thermalDegradation01 = Math.max(0, Math.min(1, (avgTreadK - (spec.optimalTempK + 18)) / 35));

  // 3. Graining (cold tread under high lateral sliding)
  const coldExcessK = Math.max(0, spec.optimalTempK - 18 - avgTreadK);
  const grainingIndex01 = Math.max(0, Math.min(1, (coldExcessK / 25) * Math.min(1, Math.abs(input.slipAngleRad) / 0.08)));

  // 4. Blistering (excess carcass heat)
  const carcassOverheatK = Math.max(0, input.tempCarcassK - (spec.optimalTempK + 12));
  const blisteringIndex01 = Math.max(0, Math.min(1, carcassOverheatK / 28));

  // 5. Aquaplaning (depends on V, water depth, pressure, tread depth & drainage, macrotexture)
  const remainingTreadMm = Math.max(0.4, spec.treadDepthNewMm * (1 - wearRatioTotal * 0.75));
  const pKpa = pressureGaugePa / 1000;
  const criticalAquaplaneSpeedMs = 6.34 * Math.sqrt(Math.max(80, pKpa)) * (remainingTreadMm / 3.0) * (0.7 + 0.3 * input.surfaceMacroTextureMm);
  const aquaplaningRisk01 =
    input.waterFilmMm <= 0.1
      ? 0
      : Math.max(0, Math.min(0.95, ((input.wheelVxMs * (input.waterFilmMm / 2.5)) / Math.max(15, criticalAquaplaneSpeedMs)) * 0.85));

  const effectiveGripMultiplier =
    input.surfaceGripFactor *
    thermalWindowFactor *
    (1 - wearRatioTotal * 0.26) *
    (1 - grainingIndex01 * 0.18) *
    (1 - blisteringIndex01 * 0.22) *
    (1 - aquaplaningRisk01 * 0.75);

  // Load sensitivity: Fy,max = k * Fz^n with n < 1
  const nExp = spec.loadSensitivityExpN;
  const loadRatio = fzSafe / spec.nominalLoadN;
  const fyPeakN = spec.magicD * spec.nominalLoadN * Math.pow(loadRatio, nExp) * effectiveGripMultiplier;
  const fxPeakN = fyPeakN * 0.96;

  // Camber thrust & optimal contact penalty
  const camberDeg = (input.camberRad * 180) / Math.PI;
  const camberThrustN = fzSafe * Math.sin(input.camberRad) * 0.42;

  // Magic Formula reduced: Y = D * sin(C * atan(Bx - E * (Bx - atan(Bx))))
  const evalMagic = (x: number, D: number, B: number, C: number, E: number) =>
    D * Math.sin(C * Math.atan(B * x - E * (B * x - Math.atan(B * x))));

  // Pressure stiffness effect on B
  const pressureStiffFactor = 1 + (pressureGaugePsi - 22.5) * 0.015;
  const B_eff = spec.magicB * pressureStiffFactor;
  // Sign convention: Fy ≈ -C_alpha * alpha for small alpha
  const fyPureN = -evalMagic(input.slipAngleRad, fyPeakN, B_eff, spec.magicC, spec.magicE) + camberThrustN;
  const fxPureN = evalMagic(slipRatioKappa, fxPeakN, B_eff * 1.15, spec.magicC * 1.04, spec.magicE);
  const corneringStiffnessCalphaNPerRad = fyPeakN * B_eff * spec.magicC;

  // Friction Ellipse for combined longitudinal & lateral forces
  const ux = fxPureN / Math.max(1, fxPeakN);
  const uy = fyPureN / Math.max(1, fyPeakN);
  const normCombined = Math.sqrt(ux * ux + uy * uy);
  const ellipseScale = normCombined > 1 ? 1 / normCombined : 1.0;
  const fxCombinedN = fxPureN * ellipseScale;
  const fyCombinedN = fyPureN * ellipseScale;

  // Relaxation length transient step: dFy/ds = (Fy,ss - Fy)/sigma -> F_new = F_ss + (F_prev - F_ss)*exp(-ds/sigma)
  const ds = Math.abs(input.wheelVxMs) * dt;
  const fyTransientN =
    input.prevFyTransientN !== undefined
      ? fyCombinedN + (input.prevFyTransientN - fyCombinedN) * Math.exp(-ds / spec.relaxationLengthM)
      : fyCombinedN;

  // Pneumatic trail & Aligning Torque Mz
  const pneumaticTrailM = 0.036 * Math.max(0.2, 1 - Math.abs(input.slipAngleRad) / 0.18);
  const mzAligningNm = -fyCombinedN * pneumaticTrailM;

  // Multi-node thermal ODE: Cth * dT/dt = Qin - Qout
  const hysteresisLossJPerRev = 0.014 * fzSafe * (2 * Math.PI * input.effectiveRadiusM) * (1 + Math.abs(input.camberRad) * 1.5);
  const wheelRevPerS = Math.abs(input.wheelVxMs) / (2 * Math.PI * input.effectiveRadiusM);
  const qInHysteresisW = hysteresisLossJPerRev * wheelRevPerS;
  const qInFrictionW = Math.abs(fxCombinedN * vWheelRim * slipRatioKappa) + Math.abs(fyCombinedN * input.wheelVxMs * Math.sin(input.slipAngleRad));

  // Distribute heating unevenly across Inner / Center / Outer nodes based on camber & cornering
  const camberBias = Math.max(-0.25, Math.min(0.25, -input.camberRad * 3.5));
  const wInner = 0.34 + camberBias * 0.45;
  const wCenter = 0.34;
  const wOuter = 0.32 - camberBias * 0.45;

  const hConv = 24 + Math.abs(input.wheelVxMs) * 1.45;
  const nodeAreaM2 = 0.11;
  const qOutInner = hConv * nodeAreaM2 * (input.tempInnerK - input.ambientTempK);
  const qOutCenter = hConv * nodeAreaM2 * (input.tempCenterK - input.ambientTempK);
  const qOutOuter = hConv * nodeAreaM2 * (input.tempOuterK - input.ambientTempK);
  const qOutConvectionW = qOutInner + qOutCenter + qOutOuter;

  const nodeCap = spec.thermalCapTreadJK / 3;
  const nextInnerK = input.tempInnerK + ((qInFrictionW * wInner + qInHysteresisW * 0.25 - qOutInner) / nodeCap) * dt;
  const nextCenterK = input.tempCenterK + ((qInFrictionW * wCenter + qInHysteresisW * 0.30 - qOutCenter) / nodeCap) * dt;
  const nextOuterK = input.tempOuterK + ((qInFrictionW * wOuter + qInHysteresisW * 0.25 - qOutOuter) / nodeCap) * dt;

  const kTreadCarcassWPerK = 42.0;
  const qTreadToCarcass = kTreadCarcassWPerK * (avgTreadK - input.tempCarcassK);
  const qCarcassToAir = 14.0 * (input.tempCarcassK - input.ambientTempK);
  const nextCarcassK = input.tempCarcassK + ((qTreadToCarcass + qInHysteresisW * 0.20 - qCarcassToAir) / spec.thermalCapCarcassJK) * dt;

  return {
    modelVersion: spec.version,
    domainStatus: {
      inValidDomain: extrapolationWarnings.length === 0,
      extrapolationWarnings,
    },
    kinematics: {
      slipAngleRad: Number(input.slipAngleRad.toFixed(4)),
      slipRatioKappa: Number(slipRatioKappa.toFixed(4)),
      corneringStiffnessCalphaNPerRad: Math.round(corneringStiffnessCalphaNPerRad),
    },
    forcesAndMoments: {
      fxPureN: Number(fxPureN.toFixed(1)),
      fyPureN: Number(fyPureN.toFixed(1)),
      fxCombinedN: Number(fxCombinedN.toFixed(1)),
      fyCombinedN: Number(fyCombinedN.toFixed(1)),
      fyTransientN: Number(fyTransientN.toFixed(1)),
      mzAligningNm: Number(mzAligningNm.toFixed(2)),
      fxPeakN: Number(fxPeakN.toFixed(1)),
      fyPeakN: Number(fyPeakN.toFixed(1)),
      loadSensitivityExpN: nExp,
      frictionEllipseUtilization: Number(Math.min(1.0, normCombined).toFixed(3)),
    },
    thermalNodes: {
      tempInnerK: Number(nextInnerK.toFixed(2)),
      tempCenterK: Number(nextCenterK.toFixed(2)),
      tempOuterK: Number(nextOuterK.toFixed(2)),
      tempTreadAvgK: Number(((nextInnerK + nextCenterK + nextOuterK) / 3).toFixed(2)),
      tempCarcassK: Number(nextCarcassK.toFixed(2)),
      qInFrictionW: Number(qInFrictionW.toFixed(1)),
      qInHysteresisW: Number(qInHysteresisW.toFixed(1)),
      qOutConvectionW: Number(qOutConvectionW.toFixed(1)),
      hysteresisLossJPerRev: Number(hysteresisLossJPerRev.toFixed(1)),
    },
    pressureIdealGas: {
      gasTempK: Number(gasTempK.toFixed(2)),
      pressureAbsPa: Math.round(pressureAbsPa),
      pressureGaugePa: Math.round(pressureGaugePa),
      pressureGaugePsi: Number(pressureGaugePsi.toFixed(2)),
      estimatedPatchAreaM2: Number(estimatedPatchAreaM2.toFixed(5)),
    },
    degradationStates: {
      abrasiveWearDelta: Number(abrasiveWearDelta.toFixed(6)),
      wearRatioTotal: Number(wearRatioTotal.toFixed(5)),
      thermalDegradation01: Number(thermalDegradation01.toFixed(3)),
      grainingIndex01: Number(grainingIndex01.toFixed(3)),
      blisteringIndex01: Number(blisteringIndex01.toFixed(3)),
      aquaplaningRisk01: Number(aquaplaningRisk01.toFixed(3)),
      effectiveGripMultiplier: Number(effectiveGripMultiplier.toFixed(4)),
    },
  };
}

export function evaluateGate06(tire: TireSimulationOutputs): GateResult {
  const ellipseRespected =
    Math.hypot(
      tire.forcesAndMoments.fxCombinedN / Math.max(1, tire.forcesAndMoments.fxPeakN),
      tire.forcesAndMoments.fyCombinedN / Math.max(1, tire.forcesAndMoments.fyPeakN)
    ) <= 1.005;

  const tempPressWearSeparated =
    tire.pressureIdealGas.pressureAbsPa > tire.pressureIdealGas.pressureGaugePa &&
    tire.pressureIdealGas.gasTempK > 240 &&
    Number.isFinite(tire.degradationStates.wearRatioTotal) &&
    Number.isFinite(tire.degradationStates.grainingIndex01) &&
    Number.isFinite(tire.degradationStates.blisteringIndex01);

  const transientsAndHystOk =
    tire.thermalNodes.hysteresisLossJPerRev >= 0 && Number.isFinite(tire.forcesAndMoments.fyTransientN);

  const domainTracked =
    typeof tire.domainStatus.inValidDomain === 'boolean' && /^\d+\.\d+\.\d+$/.test(tire.modelVersion);

  const criteria = [
    {
      id: 'G06-C1',
      label: 'Forças combinadas (elipse de atrito) e momentos (Mz) validados',
      passed: ellipseRespected && Number.isFinite(tire.forcesAndMoments.mzAligningNm),
      detail: `Fx=${tire.forcesAndMoments.fxCombinedN} N, Fy=${tire.forcesAndMoments.fyCombinedN} N (elipse ${(tire.forcesAndMoments.frictionEllipseUtilization * 100).toFixed(0)}%), Mz=${tire.forcesAndMoments.mzAligningNm} N·m.`,
    },
    {
      id: 'G06-C2',
      label: 'Temperatura (nós), pressão (Kelvin abs/manométrica) e desgaste/graining/blistering separados',
      passed: tempPressWearSeparated,
      detail: `T_banda=${tire.thermalNodes.tempTreadAvgK} K | P_abs=${tire.pressureIdealGas.pressureAbsPa} Pa (${tire.pressureIdealGas.pressureGaugePsi} psi man.) | Wear ${(tire.degradationStates.wearRatioTotal * 100).toFixed(2)}%.`,
    },
    {
      id: 'G06-C3',
      label: 'Transientes (relaxation length) e histerese tratados',
      passed: transientsAndHystOk,
      detail: `Fy_trans=${tire.forcesAndMoments.fyTransientN} N · Histerese=${tire.thermalNodes.hysteresisLossJPerRev} J/rev.`,
    },
    {
      id: 'G06-C4',
      label: 'Domínio de carga, slip, temperatura e superfície registrado',
      passed: domainTracked,
      detail: tire.domainStatus.inValidDomain
        ? `Dentro do domínio calibrado (v${tire.modelVersion}).`
        : `Extrapolação sinalizada: ${tire.domainStatus.extrapolationWarnings.join(' ')}`,
    },
  ];

  return {
    gateId: 'GATE_06',
    moduleCode: 'M06',
    passed: criteria.every((c) => c.passed),
    criteria,
  };
}
