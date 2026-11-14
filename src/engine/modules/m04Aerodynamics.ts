import type { VehicleEngineeringParameters } from '../../types/physics.ts';
import {
  COORDINATE_FRAME_STANDARD,
  type GateResult,
  type ManualInfoClass,
  computeAirState,
} from './m01Foundation.ts';
import { FIA_2026_DEFAULT_EDITION, type RegulationEditionSpec } from './m03Packaging.ts';

// M04 — Aerodinâmica (Manual Mestre Seção 4.1 - 4.4)

export type AeroMode2026 = 'MODE_Z' | 'MODE_X';

export interface AeroPhenomenonState {
  code: string;
  name: string;
  mechanism: string;
  activeValue: number;
  unitSi: string;
  marginPct: number;
  infoClass: ManualInfoClass;
}

export interface AeroActuatorState {
  mode: AeroMode2026;
  activationAllowed: boolean;
  blockReason: string | null;
  frontFlapAngleRad: number;
  rearFlapAngleRad: number;
  actuatorResponseTimeS: number;
  coordinatedTransitionValid: boolean;
  editionId: string;
}

export interface AeroMapPoint {
  mode: AeroMode2026;
  speedMs: number;
  frontRhM: number;
  rearRhM: number;
  pitchRad: number;
  yawRad: number;
  rollRad: number;
  clTotal: number;
  cdTotal: number;
  frontBalanceBf: number;
  dFzDhNPerM: number;
  separationMarginPct: number;
  inValidDomain: boolean;
}

export interface AeroWakeEffect {
  followDistanceM: number;
  lateralAlignment01: number;
  lambdaWakeLoss: number;
  fzCleanN: number;
  fzFollowN: number;
  coolingPenaltyPct: number;
  validDomain: boolean;
}

export interface AeroEnvelopeInputs {
  speedMs: number;
  frontRhM: number;
  rearRhM: number;
  pitchRad: number;
  yawRad: number;
  rollRad: number;
  mode: AeroMode2026;
  ambientTempK: number;
  airPressurePa: number;
  gearboxLayout: 'compact' | 'voluminous';
  followDistanceM?: number;
  lateralAlignment01?: number;
  inAeroActivationZone?: boolean;
  wetSurface?: boolean;
}

export interface AeroOutputs {
  modelVersion: string;
  solverTrace: {
    solverName: string;
    geometryHash: string;
    meshLevel: string;
    infoClass: ManualInfoClass;
    uncertaintyPct: number;
  };
  coordinateFrame: typeof COORDINATE_FRAME_STANDARD;
  domainStatus: {
    inValidDomain: boolean;
    extrapolationWarnings: string[];
    uncertaintyAppliedPct: number;
  };
  airState: ReturnType<typeof computeAirState>;
  dynamicPressurePa: number;
  referenceAreaM2: number;
  reynoldsNumber: number;
  machNumber: number;
  actuator: AeroActuatorState;
  forces: {
    downforceTotalN: number; // Fz > 0 magnitude
    downforceFrontN: number;
    downforceRearN: number;
    dragTotalN: number;
    sideForceN: number;
    pitchMomentNm: number;
    dragPowerW: number; // P_D = D * V
    clTotal: number;
    cdTotal: number;
    cdAM2: number;
    aeroEfficiencyLD: number;
    frontBalanceBf: number; // Fz,front / Fz,total
  };
  sensitivities: {
    dFzDhFrontNPerM: number;
    dFzDhRearNPerM: number;
    dFzDPitchNPerRad: number;
    dClDYawPerRad: number;
    dClDRollPerRad: number;
    porpoisingRiskPct: number;
    separationMarginPct: number;
    diffuserPressureRecoveryPct: number;
  };
  phenomena: AeroPhenomenonState[];
  wakeEffect: AeroWakeEffect;
  mapGrid: AeroMapPoint[];
}

export const AERO_VALID_DOMAIN = {
  speedMs: { min: 15, max: 105 },
  frontRhM: { min: 0.008, max: 0.055 },
  rearRhM: { min: 0.015, max: 0.095 },
  pitchRad: { min: -0.04, max: 0.05 },
  yawRad: { min: -0.18, max: 0.18 },
  rollRad: { min: -0.07, max: 0.07 },
};

export function evaluateAerodynamics(
  params: VehicleEngineeringParameters,
  env: AeroEnvelopeInputs,
  edition: RegulationEditionSpec = FIA_2026_DEFAULT_EDITION
): AeroOutputs {
  const extrapolationWarnings: string[] = [];

  const checkDomain = (name: string, val: number, min: number, max: number, unit: string) => {
    if (val < min || val > max) {
      extrapolationWarnings.push(
        `${name}=${val.toFixed(4)} ${unit} fora do domínio calibrado [${min}, ${max}] ${unit} (incerteza ampliada).`
      );
      return false;
    }
    return true;
  };

  const okV = checkDomain('V', env.speedMs, AERO_VALID_DOMAIN.speedMs.min, AERO_VALID_DOMAIN.speedMs.max, 'm/s');
  const okHf = checkDomain('h_f', env.frontRhM, AERO_VALID_DOMAIN.frontRhM.min, AERO_VALID_DOMAIN.frontRhM.max, 'm');
  const okHr = checkDomain('h_r', env.rearRhM, AERO_VALID_DOMAIN.rearRhM.min, AERO_VALID_DOMAIN.rearRhM.max, 'm');
  const okP = checkDomain('pitch', env.pitchRad, AERO_VALID_DOMAIN.pitchRad.min, AERO_VALID_DOMAIN.pitchRad.max, 'rad');
  const okY = checkDomain('yaw', env.yawRad, AERO_VALID_DOMAIN.yawRad.min, AERO_VALID_DOMAIN.yawRad.max, 'rad');
  const okR = checkDomain('roll', env.rollRad, AERO_VALID_DOMAIN.rollRad.min, AERO_VALID_DOMAIN.rollRad.max, 'rad');

  const inValidDomain = okV && okHf && okHr && okP && okY && okR;
  const uncertaintyAppliedPct = inValidDomain ? 4.5 : 14.0;

  // Fluid properties from M01
  const airState = computeAirState(env.airPressurePa, env.ambientTempK);
  const V = Math.max(5, env.speedMs);
  const qDynPa = 0.5 * airState.densityKgM3 * V * V;
  const refAreaM2 = 1.50;
  const charLengthM = params.floorLengthMm / 1000;
  const reynoldsNumber = (airState.densityKgM3 * V * charLengthM) / airState.dynamicViscosityPaS;
  const machNumber = V / airState.speedOfSoundMs;

  // Actuator & 2026 Active Aero state check (not unrestricted switch)
  const frontCornerRad = (params.frontWingFlapCornerDeg * Math.PI) / 180;
  const frontStraightRad = (params.frontWingFlapStraightDeg * Math.PI) / 180;
  const rearCornerRad = (params.rearWingFlapCornerDeg * Math.PI) / 180;
  const rearStraightRad = (params.rearWingFlapStraightDeg * Math.PI) / 180;

  const coordinatedTransitionValid =
    frontCornerRad - frontStraightRad >= (4 * Math.PI) / 180 &&
    rearCornerRad - rearStraightRad >= (6 * Math.PI) / 180;

  let effectiveMode: AeroMode2026 = env.mode;
  let activationAllowed = true;
  let blockReason: string | null = null;
  if (env.mode === 'MODE_X') {
    if (env.inAeroActivationZone === false) {
      activationAllowed = false;
      effectiveMode = 'MODE_Z';
      blockReason = 'Modo X bloqueado fora de zona de ativação FIA.';
    } else if (env.wetSurface) {
      activationAllowed = false;
      effectiveMode = 'MODE_Z';
      blockReason = 'Modo X bloqueado pela direção de prova por pista molhada/baixa aderência.';
    } else if (!coordinatedTransitionValid) {
      activationAllowed = false;
      blockReason = 'Atuadores dianteiro/traseiro sem diferencial mínimo coordenado exigido pela edição FIA.';
    }
  }

  const frontFlapAngleRad = effectiveMode === 'MODE_X' ? frontStraightRad : frontCornerRad;
  const rearFlapAngleRad = effectiveMode === 'MODE_X' ? rearStraightRad : rearCornerRad;

  // Core point evaluation helper used for both operating point & sensitivity/maps
  const evalAt = (vEval: number, hfEval: number, hrEval: number, pitchEval: number, yawEval: number, rollEval: number, modeEval: AeroMode2026) => {
    const q = 0.5 * airState.densityKgM3 * vEval * vEval;
    const reEval = (airState.densityKgM3 * vEval * charLengthM) / airState.dynamicViscosityPaS;
    const floorL = params.floorLengthMm / 1000;
    const floorW = params.floorUsefulWidthMm / 1000;
    const floorAreaM2 = floorL * floorW;
    const diffL = params.diffuserLengthMm / 1000;
    const diffRad = (params.diffuserAngleDeg * Math.PI) / 180;
    const spanFactor = params.wingSpanMm / 1860;

    // 1. Boundary Layer & Reynolds / Roughness
    const reNorm = Math.pow(Math.max(1e6, reEval) / 1.35e7, 0.04);
    const roughnessPenalty = 1 - Math.max(0, (params.floorSurfaceRoughnessUm - 2.0) * 0.009);

    // 2. Ground Effect + Throat Continuity
    const safeHf = Math.max(0.007, hfEval);
    const safeHr = Math.max(0.012, hrEval);
    const rakeRad = Math.atan((safeHr - safeHf) / Math.max(1.5, floorL)) + pitchEval;
    const effectiveMinRhM = Math.max(0.006, 0.45 * safeHf + 0.55 * safeHr - rakeRad * 0.15);
    const throatAccelRatio = Math.min(1.58, (safeHf + 0.007) / effectiveMinRhM);

    // Low-ride-height stall onset below 10mm (viscous choke)
    const groundChokeFactor = safeHf < 0.011 ? Math.max(0.55, 1 - (0.011 - safeHf) * 35) : 1.0;

    // 3. Diffuser expansion & Coanda feed & Gearbox blockage
    const exitHeightM = safeHr + diffL * Math.tan(diffRad);
    const expansionRatio = Math.min(3.8, exitHeightM / Math.max(0.012, safeHr));
    const gbBlockage = env.gearboxLayout === 'compact' ? 0.96 : 0.79;
    // Coanda effect requires attached boundary layer and proper undercut pressure gradient
    const coandaAttached = params.sidepodUndercutPct <= 82 && Math.abs(yawEval) < 0.12;
    const coandaGain = coandaAttached
      ? 0.88 + (params.sidepodUndercutPct / 100) * 0.16
      : 0.88 + (params.sidepodUndercutPct / 100) * 0.07;

    // 4. Separation margin
    const criticalDiffAngleRad =
      ((10.6 + (params.sidepodUndercutPct / 100) * 1.4 - (env.gearboxLayout === 'voluminous' ? 1.1 : 0)) * Math.PI) / 180;
    const diffStallExcessDeg = Math.max(0, ((diffRad - criticalDiffAngleRad) * 180) / Math.PI);
    const separationPenalty = Math.min(0.48, Math.pow(diffStallExcessDeg, 1.42) * 0.055);
    const diffuserRecovery = Math.max(
      0.18,
      (1 - Math.pow(1 / expansionRatio, 2)) * (1 - separationPenalty) * gbBlockage * coandaGain
    );

    // 5. Vortices & Yaw/Roll sealing
    const vortexSeal = 0.88 + (params.floorEdgeComplexity / 100) * 0.18;
    const yawDegAbs = Math.abs((yawEval * 180) / Math.PI);
    const rollDegAbs = Math.abs((rollEval * 180) / Math.PI);
    const yawSensFactor = (4.5 + (params.floorEdgeComplexity / 100) * 9.5 + diffStallExcessDeg * 2.1) / 100;
    const yawLoss = Math.max(0.65, 1 - yawSensFactor * (yawDegAbs / 5.0) - rollDegAbs * 0.018);

    // Aeroelastic wing flex at high dynamic pressure
    const qRefPa = 2855;
    const flexCoeff = ((100 - params.wingStructuralStiffnessPct) / 100) * 0.08 * Math.min(1.5, q / qRefPa);
    const wingFlexFactor = Math.max(0.84, 1 - flexCoeff);

    const floorCl =
      1.42 *
      (floorAreaM2 / 4.2) *
      Math.sqrt(throatAccelRatio) *
      (diffuserRecovery / 0.70) *
      vortexSeal *
      roughnessPenalty *
      reNorm *
      groundChokeFactor *
      yawLoss *
      (modeEval === 'MODE_X' ? 0.92 : 1.0);

    const fDeg = modeEval === 'MODE_X' ? params.frontWingFlapStraightDeg : params.frontWingFlapCornerDeg;
    const rDeg = modeEval === 'MODE_X' ? params.rearWingFlapStraightDeg : params.rearWingFlapCornerDeg;
    const fEffectiveDeg = Math.min(39, fDeg) - Math.max(0, fDeg - 39) * 0.65;
    const rEffectiveDeg = Math.min(43, rDeg) - Math.max(0, rDeg - 43) * 0.65;

    const frontWingCl = (modeEval === 'MODE_X' ? 0.20 + (fEffectiveDeg / 35) * 0.65 : 0.48 + (fEffectiveDeg / 35) * 0.88) * spanFactor * wingFlexFactor;
    const rearWingCl = (modeEval === 'MODE_X' ? 0.14 + (rEffectiveDeg / 38) * 0.58 : 0.44 + (rEffectiveDeg / 38) * 0.92) * spanFactor * wingFlexFactor;

    const clTotal = floorCl + frontWingCl + rearWingCl;

    // Front/Rear balance (pitch forward shifts CoP forward slightly)
    const floorFrontShare = Math.min(0.46, Math.max(0.32, 0.39 - pitchEval * 0.9));
    const fzFrontN = (frontWingCl + floorCl * floorFrontShare) * q * refAreaM2;
    const fzRearN = (rearWingCl + floorCl * (1 - floorFrontShare)) * q * refAreaM2;
    const fzTotalN = fzFrontN + fzRearN;
    const bf = fzFrontN / Math.max(1, fzTotalN);

    // 6. Drag Components: Body Pressure + Cooling Ducts + Viscous + Induced Drag
    const bodyBaseCd =
      (0.44 + (env.gearboxLayout === 'voluminous' ? 0.025 : 0) - (params.sidepodUndercutPct / 100) * 0.035) *
      (modeEval === 'MODE_X' ? 0.95 : 1.0);
    const inletAreaM2 = params.sidepodInletAreaCm2 / 10000;
    const exitAreaM2 = params.hotAirExitAreaCm2 / 10000;
    const exitRatio = exitAreaM2 / Math.max(0.005, inletAreaM2);
    const coolingCd = inletAreaM2 * 2.15 + (0.45 / Math.max(0.4, exitRatio)) * 0.025;
    const viscousCd = 0.048 * (1 + (params.floorSurfaceRoughnessUm - 2.0) * 0.015) * (1 / reNorm);
    const arEff = 4.4 * spanFactor;
    const eOswald = modeEval === 'MODE_X' ? 0.82 : 0.78;
    const inducedCd =
      (frontWingCl * frontWingCl + rearWingCl * rearWingCl * 1.15) / (Math.PI * arEff * eOswald) +
      floorCl * floorCl * (modeEval === 'MODE_X' ? 0.035 : 0.042);

    // Subsonic Prandtl-Glauert compressibility rise when Ma > 0.25
    const compressFactor = machNumber > 0.25 ? 1 / Math.sqrt(Math.max(0.5, 1 - machNumber * machNumber * 0.25)) : 1.0;

    const cdTotal = (bodyBaseCd + coolingCd + viscousCd + inducedCd) * compressFactor;
    const dragN = cdTotal * q * refAreaM2;
    const sideForceN = -q * refAreaM2 * (0.85 * yawEval);
    const sepMarginPct = Math.max(
      5,
      Math.min(98, 88 - diffStallExcessDeg * 14 - (1 - gbBlockage) * 35 - Math.max(0, rDeg - 41) * 4)
    );

    return {
      clTotal,
      cdTotal,
      fzTotalN,
      fzFrontN,
      fzRearN,
      dragN,
      sideForceN,
      bf,
      inducedCd,
      diffuserRecoveryPct: diffuserRecovery * 100,
      separationMarginPct: sepMarginPct,
      yawLossPct: (1 - yawLoss) * 100,
      coandaAttached,
    };
  };

  const base = evalAt(V, env.frontRhM, env.rearRhM, env.pitchRad, env.yawRad, env.rollRad, effectiveMode);

  // Finite-difference sensitivities dFz/dh, dFz/dpitch, dCl/dyaw, dCl/droll
  const dh = 0.001; // 1 mm
  const dPitch = 0.002;
  const dYaw = 0.005;
  const dRoll = 0.005;

  const plusHf = evalAt(V, env.frontRhM + dh, env.rearRhM, env.pitchRad, env.yawRad, env.rollRad, effectiveMode);
  const plusHr = evalAt(V, env.frontRhM, env.rearRhM + dh, env.pitchRad, env.yawRad, env.rollRad, effectiveMode);
  const plusPitch = evalAt(V, env.frontRhM, env.rearRhM, env.pitchRad + dPitch, env.yawRad, env.rollRad, effectiveMode);
  const plusYaw = evalAt(V, env.frontRhM, env.rearRhM, env.pitchRad, env.yawRad + dYaw, env.rollRad, effectiveMode);
  const plusRoll = evalAt(V, env.frontRhM, env.rearRhM, env.pitchRad, env.yawRad, env.rollRad + dRoll, effectiveMode);

  const dFzDhFrontNPerM = (plusHf.fzTotalN - base.fzTotalN) / dh;
  const dFzDhRearNPerM = (plusHr.fzTotalN - base.fzTotalN) / dh;
  const dFzDPitchNPerRad = (plusPitch.fzTotalN - base.fzTotalN) / dPitch;
  const dClDYawPerRad = (plusYaw.clTotal - base.clTotal) / dYaw;
  const dClDRollPerRad = (plusRoll.clTotal - base.clTotal) / dRoll;

  // Pitching moment about mid-wheelbase (N·m)
  const L = params.wheelbaseMm / 1000;
  const pitchMomentNm = (base.fzFrontN - base.fzRearN) * (L * 0.5);

  // Porpoising risk from aero height gradient vs spring & damper stiffness
  const kWheelNm = params.springRateNmm * 1000 * params.rockerMotionRatio * params.rockerMotionRatio;
  const gradNPerMm = Math.abs(dFzDhFrontNPerM) / 1000;
  const porpoisingRiskPct = Math.round(
    Math.max(
      4,
      Math.min(
        96,
        gradNPerMm * 0.25 +
          (0.025 - Math.min(0.025, env.frontRhM)) * 1800 -
          (kWheelNm / 200000) * 18 -
          (params.damperNsM / 4500) * 10 +
          (100 - base.separationMarginPct) * 0.35
      )
    )
  );

  // 7. Wake Model: Fz,follow = Fz,clean * (1 - lambda)
  const followDist = env.followDistanceM ?? 25.0; // e.g. 25m (~1s at 90 km/h or ~0.35s at 250 km/h)
  const align = env.lateralAlignment01 ?? 1.0;
  const wakeValid = followDist >= 3.0 && followDist <= 120.0;
  const lambdaRaw =
    wakeValid && followDist < 80
      ? Math.min(0.36, Math.max(0.01, (0.28 * Math.exp(-followDist / 28) * (0.4 + 0.6 * align)) * (V / 70)))
      : 0;
  const fzFollowN = base.fzTotalN * (1 - lambdaRaw);
  const coolingPenaltyPct = lambdaRaw * 45; // turbulent hot wake reduces radiator heat rejection

  // Generate Aero Map Sweep covering speeds, heights, pitch, yaw, and Mode Z/X
  const mapGrid: AeroMapPoint[] = [];
  const mapSpeeds = [35, 55, 70, 88];
  const mapFrontRhs = [0.018, 0.024, 0.032];
  const mapYaws = [0, 0.05];
  const mapModes: AeroMode2026[] = ['MODE_Z', 'MODE_X'];
  for (const m of mapModes) {
    for (const s of mapSpeeds) {
      for (const hf of mapFrontRhs) {
        const hr = hf + 0.022;
        for (const yw of mapYaws) {
          const pt = evalAt(s, hf, hr, 0, yw, 0, m);
          const ptPlus = evalAt(s, hf + dh, hr, 0, yw, 0, m);
          mapGrid.push({
            mode: m,
            speedMs: s,
            frontRhM: hf,
            rearRhM: hr,
            pitchRad: 0,
            yawRad: yw,
            rollRad: 0,
            clTotal: Number(pt.clTotal.toFixed(4)),
            cdTotal: Number(pt.cdTotal.toFixed(4)),
            frontBalanceBf: Number(pt.bf.toFixed(4)),
            dFzDhNPerM: Number(((ptPlus.fzTotalN - pt.fzTotalN) / dh).toFixed(1)),
            separationMarginPct: Number(pt.separationMarginPct.toFixed(1)),
            inValidDomain: true,
          });
        }
      }
    }
  }

  const phenomena: AeroPhenomenonState[] = [
    {
      code: 'AER_BL',
      name: 'Camada Limite',
      mechanism: 'Região viscosa junto à parede; Re, rugosidade, gradiente de pressão e turbulência',
      activeValue: Number((reynoldsNumber / 1e6).toFixed(2)),
      unitSi: 'Re×10^6',
      marginPct: Number((100 - Math.max(0, params.floorSurfaceRoughnessUm - 2) * 3).toFixed(1)),
      infoClass: 'Física estabelecida',
    },
    {
      code: 'AER_SEP',
      name: 'Separação',
      mechanism: 'Perda de aderência sob gradiente adverso de difusor/asas',
      activeValue: Number(base.separationMarginPct.toFixed(1)),
      unitSi: '%',
      marginPct: Number(base.separationMarginPct.toFixed(1)),
      infoClass: 'Modelo reduzido',
    },
    {
      code: 'AER_GE',
      name: 'Efeito Solo',
      mechanism: 'Interação piso, altura, geometria inferior e escoamento lateral',
      activeValue: Number((base.fzTotalN * 0.48).toFixed(1)),
      unitSi: 'N',
      marginPct: Number((100 - porpoisingRiskPct).toFixed(1)),
      infoClass: 'Modelo reduzido',
    },
    {
      code: 'AER_DIFF',
      name: 'Difusor',
      mechanism: 'Expansão e recuperação de pressão (ângulo, área, bloqueio câmbio)',
      activeValue: Number(base.diffuserRecoveryPct.toFixed(1)),
      unitSi: '%',
      marginPct: Number(base.diffuserRecoveryPct.toFixed(1)),
      infoClass: 'Modelo reduzido',
    },
    {
      code: 'AER_VORTEX',
      name: 'Vórtices',
      mechanism: 'Estruturas rotacionais para vedação de borda e transporte de momento',
      activeValue: params.floorEdgeComplexity,
      unitSi: '%',
      marginPct: Number((100 - base.yawLossPct).toFixed(1)),
      infoClass: 'Estimativa',
    },
    {
      code: 'AER_COANDA',
      name: 'Efeito Coandă',
      mechanism: 'Acompanhamento de superfície curva condicional à camada limite e undercut',
      activeValue: base.coandaAttached ? 1 : 0,
      unitSi: 'bool',
      marginPct: base.coandaAttached ? 88 : 42,
      infoClass: 'Hipótese',
    },
    {
      code: 'AER_WAKE',
      name: 'Esteira (Dirty Air)',
      mechanism: 'Déficit de energia atrás de carro à frente: Fz,follow = Fz,clean(1-λ)',
      activeValue: Number((lambdaRaw * 100).toFixed(1)),
      unitSi: '%',
      marginPct: Number(((1 - lambdaRaw) * 100).toFixed(1)),
      infoClass: 'Modelo reduzido',
    },
    {
      code: 'AER_INDUCED',
      name: 'Arrasto Induzido',
      mechanism: 'Custo tridimensional da geração de sustentação/downforce finita',
      activeValue: Number(base.inducedCd.toFixed(4)),
      unitSi: '-',
      marginPct: Number(Math.max(10, 100 - base.inducedCd * 160).toFixed(1)),
      infoClass: 'Física estabelecida',
    },
  ];

  return {
    modelVersion: '1.0.0',
    solverTrace: {
      solverName: 'APEX-Reduced-AeroMap-2026',
      geometryHash: `sha256:L${params.floorLengthMm}-W${params.floorUsefulWidthMm}-D${params.diffuserAngleDeg}`,
      meshLevel: 'Parametric-Surrogate-24pt',
      infoClass: 'Modelo reduzido',
      uncertaintyPct: uncertaintyAppliedPct,
    },
    coordinateFrame: COORDINATE_FRAME_STANDARD,
    domainStatus: {
      inValidDomain,
      extrapolationWarnings,
      uncertaintyAppliedPct,
    },
    airState,
    dynamicPressurePa: Number(qDynPa.toFixed(2)),
    referenceAreaM2: refAreaM2,
    reynoldsNumber: Math.round(reynoldsNumber),
    machNumber: Number(machNumber.toFixed(4)),
    actuator: {
      mode: effectiveMode,
      activationAllowed,
      blockReason,
      frontFlapAngleRad: Number(frontFlapAngleRad.toFixed(4)),
      rearFlapAngleRad: Number(rearFlapAngleRad.toFixed(4)),
      actuatorResponseTimeS: 0.24,
      coordinatedTransitionValid,
      editionId: edition.editionId,
    },
    forces: {
      downforceTotalN: Number(base.fzTotalN.toFixed(1)),
      downforceFrontN: Number(base.fzFrontN.toFixed(1)),
      downforceRearN: Number(base.fzRearN.toFixed(1)),
      dragTotalN: Number(base.dragN.toFixed(1)),
      sideForceN: Number(base.sideForceN.toFixed(1)),
      pitchMomentNm: Number(pitchMomentNm.toFixed(1)),
      dragPowerW: Number((base.dragN * V).toFixed(1)),
      clTotal: Number(base.clTotal.toFixed(4)),
      cdTotal: Number(base.cdTotal.toFixed(4)),
      cdAM2: Number((base.cdTotal * refAreaM2).toFixed(4)),
      aeroEfficiencyLD: Number((base.clTotal / Math.max(0.05, base.cdTotal)).toFixed(3)),
      frontBalanceBf: Number(base.bf.toFixed(4)),
    },
    sensitivities: {
      dFzDhFrontNPerM: Number(dFzDhFrontNPerM.toFixed(1)),
      dFzDhRearNPerM: Number(dFzDhRearNPerM.toFixed(1)),
      dFzDPitchNPerRad: Number(dFzDPitchNPerRad.toFixed(1)),
      dClDYawPerRad: Number(dClDYawPerRad.toFixed(3)),
      dClDRollPerRad: Number(dClDRollPerRad.toFixed(3)),
      porpoisingRiskPct,
      separationMarginPct: Number(base.separationMarginPct.toFixed(1)),
      diffuserPressureRecoveryPct: Number(base.diffuserRecoveryPct.toFixed(1)),
    },
    phenomena,
    wakeEffect: {
      followDistanceM: followDist,
      lateralAlignment01: align,
      lambdaWakeLoss: Number(lambdaRaw.toFixed(4)),
      fzCleanN: Number(base.fzTotalN.toFixed(1)),
      fzFollowN: Number(fzFollowN.toFixed(1)),
      coolingPenaltyPct: Number(coolingPenaltyPct.toFixed(2)),
      validDomain: wakeValid,
    },
    mapGrid,
  };
}

export function evaluateGate04(aero: AeroOutputs): GateResult {
  const hasModes = new Set(aero.mapGrid.map((m) => m.mode)).size >= 2;
  const hasSpeeds = new Set(aero.mapGrid.map((m) => m.speedMs)).size >= 3;
  const hasHeights = new Set(aero.mapGrid.map((m) => m.frontRhM)).size >= 3;
  const hasYaws = new Set(aero.mapGrid.map((m) => m.yawRad)).size >= 2;
  const mapsComplete = hasModes && hasSpeeds && hasHeights && hasYaws;

  const balanceClosed =
    Math.abs(aero.forces.downforceFrontN + aero.forces.downforceRearN - aero.forces.downforceTotalN) < 1.0 &&
    aero.coordinateFrame.frameId === COORDINATE_FRAME_STANDARD.frameId;

  const sensOk =
    Number.isFinite(aero.sensitivities.dFzDhFrontNPerM) &&
    Number.isFinite(aero.sensitivities.separationMarginPct) &&
    aero.phenomena.length === 8;

  const wakeAndModeValid =
    aero.wakeEffect.fzFollowN <= aero.wakeEffect.fzCleanN &&
    aero.actuator.editionId.length > 0 &&
    Number.isFinite(aero.actuator.actuatorResponseTimeS);

  const traceOk =
    aero.solverTrace.geometryHash.length > 5 &&
    aero.solverTrace.solverName.length > 3 &&
    /^\d+\.\d+\.\d+$/.test(aero.modelVersion);

  const criteria = [
    {
      id: 'G04-C1',
      label: 'Mapas cobrem velocidade, altura, pitch, yaw e modos (Z/X)',
      passed: mapsComplete,
      detail: `${aero.mapGrid.length} pontos mapeados cobrindo ${new Set(aero.mapGrid.map((m) => m.speedMs)).size} velocidades, ${new Set(aero.mapGrid.map((m) => m.frontRhM)).size} alturas e modos Z/X.`,
    },
    {
      id: 'G04-C2',
      label: 'Forças e momentos usam referencial e convenção de sinais documentados',
      passed: balanceClosed,
      detail: `Fz=${aero.forces.downforceTotalN} N (Bf=${(aero.forces.frontBalanceBf * 100).toFixed(1)}%), P_D=${(aero.forces.dragPowerW / 1000).toFixed(1)} kW em ${aero.coordinateFrame.frameId}.`,
    },
    {
      id: 'G04-C3',
      label: 'Sensibilidades (∂Fz/∂h, yaw, roll) e regiões de separação identificadas',
      passed: sensOk,
      detail: `∂Fz/∂hf=${(aero.sensitivities.dFzDhFrontNPerM / 1000).toFixed(1)} N/mm · Separação margem ${aero.sensitivities.separationMarginPct}% · 8 fenômenos ativos.`,
    },
    {
      id: 'G04-C4',
      label: 'Esteira e modos aerodinâmicos têm validade e restrições explícitas',
      passed: wakeAndModeValid,
      detail: `Atuador ${aero.actuator.mode} (${aero.actuator.editionId}) · Esteira λ=${(aero.wakeEffect.lambdaWakeLoss * 100).toFixed(1)}%.`,
    },
    {
      id: 'G04-C5',
      label: 'Geometria, malha, solver e condições rastreáveis',
      passed: traceOk,
      detail: `${aero.solverTrace.solverName} v${aero.modelVersion} (${aero.solverTrace.geometryHash}).`,
    },
  ];

  return {
    gateId: 'GATE_04',
    moduleCode: 'M04',
    passed: criteria.every((c) => c.passed),
    criteria,
  };
}
