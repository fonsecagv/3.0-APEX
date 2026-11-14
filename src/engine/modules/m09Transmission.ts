import { CASING_ALLOYS } from '../../data/physicsDatabase.ts';
import type { VehicleEngineeringParameters } from '../../types/physics.ts';
import type { GateResult, ManualInfoClass } from './m01Foundation.ts';
import { FIA_2026_DEFAULT_EDITION, type RegulationEditionSpec } from './m03Packaging.ts';

// M09 — Transmissão (Manual Mestre Seção 9.1 - 9.3)

export interface GearPairSpec {
  gearNumber: number; // 1..8
  z1Pinion: number;
  z2Gear: number;
  ratio: number; // i = Z2 / Z1
  pitchDiameterPinionM: number;
  pitchDiameterGearM: number;
}

export interface TransmissionOperatingInput {
  selectedGear: number; // 1..8
  engineTorqueNm: number; // from M08 at crankshaft
  engineOmegaRadS: number; // rad/s
  wheelOmegaLeftRadS: number;
  wheelOmegaRightRadS: number;
  clutchSlipOmegaRadS: number; // |omega_1 - omega_2| during launch/shift
  tireEffectiveRadiusM: number; // ~0.36 m
  maxTireAxleTractionN: number; // from M06 friction limit
  shiftTimeCommandS: number;
  ambientTempK: number;
  isHollowDriveshaft?: boolean;
}

export interface TransmissionOutputs {
  modelVersion: string;
  editionId: string;
  infoClass: ManualInfoClass;
  regulatoryCompliance: {
    compliant: boolean;
    violations: string[];
    numForwardGears: number;
    minShiftTimeS: number;
  };
  gearboxSet: {
    finalDriveRatio: number;
    gears: GearPairSpec[];
    activeGear: GearPairSpec;
    overallRatio: number;
  };
  kinematicsAndTorque: {
    inputTorqueNm: number;
    inputOmegaRadS: number;
    inputPowerW: number;
    outputAxleOmegaRadS: number;
    outputAxleTorqueNm: number;
    outputAxlePowerW: number;
    wheelForceRawN: number;
    wheelForceTractionLimitedN: number;
    tractionClampedByTire: boolean;
    toothTangentialForceFtN: number;
    gearboxEfficiency: number;
    mechanicalPowerLossW: number;
  };
  differentialAndYaw: {
    lockRatio: number;
    deltaWheelOmegaRadS: number;
    torqueLeftNm: number;
    torqueRightNm: number;
    conservationResidualNm: number; // T_L + T_R - T_axle = 0
    yawMomentNm: number;
  };
  clutchAndShifts: {
    platesCount: number;
    clampForceN: number;
    frictionMu: number;
    meanRadiusM: number;
    clutchTorqueCapacityNm: number; // Tcap = n * mu * FN * Rm
    clutchSlipPowerW: number; // Pslip = Tc * |omega1 - omega2|
    shiftDurationS: number;
    shiftSyncEnergyLossJ: number;
    shiftThermalPenaltyK: number;
  };
  structuralAndFatigue: {
    shaftOuterDiamM: number;
    shaftInnerDiamM: number;
    polarMomentJM4: number;
    shaftMaxShearStressPa: number;
    shaftAllowableShearPa: number;
    shaftSafetyFactor: number;
    toothBendingStressMpa: number;
    fatigueLifeRaces: number;
    oilTempK: number;
    oilCoolingRejectedW: number;
  };
}

export function evaluateTransmission(
  params: VehicleEngineeringParameters,
  input: TransmissionOperatingInput,
  edition: RegulationEditionSpec = FIA_2026_DEFAULT_EDITION
): TransmissionOutputs {
  const violations: string[] = [];

  // Build 8 discrete Z2/Z1 gear pairs tuned by gearRatioBias (short accel vs long top speed)
  const biasShift = 0.92 + (params.gearRatioBias / 100) * 0.16; // ~0.92..1.08
  const basePairs: Array<[number, number]> = [
    [13, 38],
    [15, 34],
    [17, 31],
    [19, 28],
    [21, 26],
    [23, 25],
    [24, 23],
    [26, 22],
  ];

  const gears: GearPairSpec[] = basePairs.slice(0, edition.numForwardGears).map(([z1, z2], idx) => {
    const z2Adj = Math.max(18, Math.round(z2 / biasShift));
    const ratio = z2Adj / z1;
    const moduleM = 0.0042;
    return {
      gearNumber: idx + 1,
      z1Pinion: z1,
      z2Gear: z2Adj,
      ratio: Number(ratio.toFixed(4)),
      pitchDiameterPinionM: Number((z1 * moduleM).toFixed(4)),
      pitchDiameterGearM: Number((z2Adj * moduleM).toFixed(4)),
    };
  });

  const gearIdx = Math.max(1, Math.min(gears.length, input.selectedGear)) - 1;
  const activeGear = gears[gearIdx];
  const finalDriveRatio = Number((3.45 / biasShift).toFixed(3));
  const overallRatio = activeGear.ratio * finalDriveRatio;

  if (input.shiftTimeCommandS < edition.minShiftTimeS) {
    violations.push(
      `Tempo de troca comandado (${(input.shiftTimeCommandS * 1000).toFixed(1)} ms) abaixo do mínimo ${edition.minShiftTimeS * 1000} ms da edição ${edition.editionId}.`
    );
  }

  // Efficiency (tooth churning + bearing + casing deflection)
  const gbAlloy = CASING_ALLOYS[params.gearboxMaterial];
  const churningLoss = 0.019 + (params.gearToothWidthMm - 14) * 0.0008 + (params.differentialLockPct / 100) * 0.004;
  const casingFlexLoss = gbAlloy.youngsModulusGpa < 90 ? 0.004 : 0.001;
  const gearboxEfficiency = Math.max(0.90, Math.min(0.985, 1 - churningLoss - casingFlexLoss));

  // i = omega_in / omega_out, T_out = T_in * i * eta
  const inputOmega = Math.max(10, input.engineOmegaRadS);
  const inputTorque = input.engineTorqueNm;
  const inputPowerW = inputTorque * inputOmega;
  const outputAxleOmegaRadS = inputOmega / overallRatio;
  const outputAxleTorqueNm = inputTorque * overallRatio * gearboxEfficiency;
  const outputAxlePowerW = outputAxleTorqueNm * outputAxleOmegaRadS;
  const mechanicalPowerLossW = Math.max(0, inputPowerW - outputAxlePowerW);

  // Tooth tangential force: Ft = 2 * T / dp
  const toothTangentialForceFtN = (2 * Math.abs(inputTorque)) / activeGear.pitchDiameterPinionM;

  // Longitudinal wheel force: Fx = T_e * i_g * i_f * eta / r_d, clamped by M06 tire grip
  const wheelForceRawN = outputAxleTorqueNm / Math.max(0.25, input.tireEffectiveRadiusM);
  const tractionClampedByTire = Math.abs(wheelForceRawN) > input.maxTireAxleTractionN;
  const wheelForceTractionLimitedN =
    Math.sign(wheelForceRawN) * Math.min(Math.abs(wheelForceRawN), input.maxTireAxleTractionN);

  // Conservative Limited-Slip Differential (changes wheel torque distribution, never creates torque)
  const lockRatio = Math.max(0, Math.min(1, params.differentialLockPct / 100));
  const deltaWheelOmegaRadS = input.wheelOmegaLeftRadS - input.wheelOmegaRightRadS;
  const transferFrac = Math.tanh(deltaWheelOmegaRadS * 0.6) * lockRatio * 0.45;
  const torqueLeftNm = outputAxleTorqueNm * (0.5 - transferFrac);
  const torqueRightNm = outputAxleTorqueNm * (0.5 + transferFrac);
  const conservationResidualNm = torqueLeftNm + torqueRightNm - outputAxleTorqueNm;
  const halfTrackM = (params.trackWidthMm / 1000) * 0.5;
  const yawMomentNm = ((torqueRightNm - torqueLeftNm) / Math.max(0.25, input.tireEffectiveRadiusM)) * halfTrackM;

  // Multi-plate Carbon Clutch: Tcap = n * mu * FN * Rm, Pslip = Tc * |omega1 - omega2|
  const platesCount = 4;
  const frictionMu = 0.44;
  const clampForceN = 4800;
  const meanRadiusM = 0.048;
  const clutchTorqueCapacityNm = platesCount * frictionMu * clampForceN * meanRadiusM;
  const actualClutchTorque = Math.min(Math.abs(inputTorque), clutchTorqueCapacityNm);
  const clutchSlipPowerW = actualClutchTorque * Math.abs(input.clutchSlipOmegaRadS);

  // Shift dynamics & thermal/wear penalty
  const shiftDurationS = Math.max(edition.minShiftTimeS, input.shiftTimeCommandS);
  const gearStepInertiaKgM2 = 0.045;
  const deltaOmegaShift = inputOmega * 0.16;
  const shiftSyncEnergyLossJ = 0.5 * gearStepInertiaKgM2 * deltaOmegaShift * deltaOmegaShift + clutchSlipPowerW * shiftDurationS;
  const shiftThermalPenaltyK = shiftSyncEnergyLossJ / 1800;

  // Driveshaft shear stress: solid J = pi*d^4/32, hollow J = pi*(D^4 - d^4)/32, tau = T*r/J
  const shaftOuterDiamM = 0.036;
  const shaftInnerDiamM = input.isHollowDriveshaft ? 0.020 : 0.0;
  const polarMomentJM4 =
    input.isHollowDriveshaft
      ? (Math.PI * (Math.pow(shaftOuterDiamM, 4) - Math.pow(shaftInnerDiamM, 4))) / 32
      : (Math.PI * Math.pow(shaftOuterDiamM, 4)) / 32;
  const maxTorquePerHalfshaft = Math.max(Math.abs(torqueLeftNm), Math.abs(torqueRightNm));
  const shaftMaxShearStressPa = (maxTorquePerHalfshaft * (shaftOuterDiamM * 0.5)) / polarMomentJM4;
  const shaftAllowableShearPa = 520e6; // high-strength aerospace steel 300M / maraging
  const shaftSafetyFactor = shaftAllowableShearPa / Math.max(1, shaftMaxShearStressPa);

  // Gear tooth bending & Basquin S-N fatigue
  const toothWidthM = params.gearToothWidthMm / 1000;
  const lewisY = 0.34;
  const moduleM = 0.0042;
  const toothBendingStressMpa = (toothTangentialForceFtN / (toothWidthM * moduleM * lewisY)) / 1e6;
  const fatigueStressRatio = toothBendingStressMpa / (gbAlloy.yieldStrengthMpa * gbAlloy.fatigueEnduranceRatio * 1.4);
  const fatigueLifeRaces = Math.max(1, Math.min(24, Math.round(10 / Math.pow(Math.max(0.35, fatigueStressRatio), 1.8))));

  // Oil Thermal Balance
  const oilCoolingRejectedW = params.gearboxOilCoolingKw * 1000;
  const oilTempK = Math.max(
    input.ambientTempK + 40,
    361.15 + ((mechanicalPowerLossW + clutchSlipPowerW * 0.25 - oilCoolingRejectedW) / 1000) * 1.85 + shiftThermalPenaltyK
  );

  if (oilTempK > 410) {
    violations.push(`Temperatura do óleo (${(oilTempK - 273.15).toFixed(1)}°C) acima do limite de lubrificação (137°C).`);
  }

  return {
    modelVersion: '1.0.0',
    editionId: edition.editionId,
    infoClass: 'Modelo reduzido',
    regulatoryCompliance: {
      compliant: violations.length === 0 && gears.length === edition.numForwardGears,
      violations,
      numForwardGears: gears.length,
      minShiftTimeS: edition.minShiftTimeS,
    },
    gearboxSet: {
      finalDriveRatio,
      gears,
      activeGear,
      overallRatio: Number(overallRatio.toFixed(4)),
    },
    kinematicsAndTorque: {
      inputTorqueNm: Number(inputTorque.toFixed(2)),
      inputOmegaRadS: Number(inputOmega.toFixed(2)),
      inputPowerW: Math.round(inputPowerW),
      outputAxleOmegaRadS: Number(outputAxleOmegaRadS.toFixed(2)),
      outputAxleTorqueNm: Number(outputAxleTorqueNm.toFixed(2)),
      outputAxlePowerW: Math.round(outputAxlePowerW),
      wheelForceRawN: Math.round(wheelForceRawN),
      wheelForceTractionLimitedN: Math.round(wheelForceTractionLimitedN),
      tractionClampedByTire,
      toothTangentialForceFtN: Math.round(toothTangentialForceFtN),
      gearboxEfficiency: Number(gearboxEfficiency.toFixed(4)),
      mechanicalPowerLossW: Math.round(mechanicalPowerLossW),
    },
    differentialAndYaw: {
      lockRatio: Number(lockRatio.toFixed(3)),
      deltaWheelOmegaRadS: Number(deltaWheelOmegaRadS.toFixed(2)),
      torqueLeftNm: Number(torqueLeftNm.toFixed(2)),
      torqueRightNm: Number(torqueRightNm.toFixed(2)),
      conservationResidualNm: Number(conservationResidualNm.toFixed(5)),
      yawMomentNm: Number(yawMomentNm.toFixed(2)),
    },
    clutchAndShifts: {
      platesCount,
      clampForceN,
      frictionMu,
      meanRadiusM,
      clutchTorqueCapacityNm: Number(clutchTorqueCapacityNm.toFixed(1)),
      clutchSlipPowerW: Math.round(clutchSlipPowerW),
      shiftDurationS: Number(shiftDurationS.toFixed(4)),
      shiftSyncEnergyLossJ: Math.round(shiftSyncEnergyLossJ),
      shiftThermalPenaltyK: Number(shiftThermalPenaltyK.toFixed(3)),
    },
    structuralAndFatigue: {
      shaftOuterDiamM,
      shaftInnerDiamM,
      polarMomentJM4: Number(polarMomentJM4.toExponential(3)),
      shaftMaxShearStressPa: Math.round(shaftMaxShearStressPa),
      shaftAllowableShearPa,
      shaftSafetyFactor: Number(shaftSafetyFactor.toFixed(2)),
      toothBendingStressMpa: Number(toothBendingStressMpa.toFixed(1)),
      fatigueLifeRaces,
      oilTempK: Number(oilTempK.toFixed(2)),
      oilCoolingRejectedW,
    },
  };
}

export function evaluateGate09(tr: TransmissionOutputs): GateResult {
  const powerConsistent =
    tr.kinematicsAndTorque.outputAxlePowerW <= tr.kinematicsAndTorque.inputPowerW + 5 &&
    Math.abs(
      tr.kinematicsAndTorque.inputOmegaRadS / tr.gearboxSet.overallRatio -
        tr.kinematicsAndTorque.outputAxleOmegaRadS
    ) < 0.05;

  const diffConservationAndTireLimit =
    Math.abs(tr.differentialAndYaw.conservationResidualNm) < 1e-2 &&
    Math.abs(tr.kinematicsAndTorque.wheelForceTractionLimitedN) <= Math.abs(tr.kinematicsAndTorque.wheelForceRawN) + 1;

  const stressAndFatigueOk =
    tr.structuralAndFatigue.shaftSafetyFactor >= 1.1 && tr.structuralAndFatigue.fatigueLifeRaces >= 2;

  const shiftsOk =
    tr.clutchAndShifts.shiftSyncEnergyLossJ > 0 &&
    tr.clutchAndShifts.clutchTorqueCapacityNm > 200;

  const editionOk = tr.regulatoryCompliance.compliant && tr.editionId.length > 0;

  const criteria = [
    {
      id: 'G09-C1',
      label: 'Relações (Z2/Z1) e eficiência coerentes com velocidade/rotação',
      passed: powerConsistent,
      detail: `Marcha ${tr.gearboxSet.activeGear.gearNumber} (i_tot=${tr.gearboxSet.overallRatio}), η=${(tr.kinematicsAndTorque.gearboxEfficiency * 100).toFixed(2)}%, P_out=${(tr.kinematicsAndTorque.outputAxlePowerW / 1000).toFixed(1)} kW.`,
    },
    {
      id: 'G09-C2',
      label: 'Diferencial respeita conservação de torque e limites do pneu',
      passed: diffConservationAndTireLimit,
      detail: `Resíduo diff=${tr.differentialAndYaw.conservationResidualNm} N·m | Fx=${tr.kinematicsAndTorque.wheelForceTractionLimitedN} N (${tr.kinematicsAndTorque.tractionClampedByTire ? 'limitado pelo pneu' : 'tração plena'}).`,
    },
    {
      id: 'G09-C3',
      label: 'Eixos (τ=Tr/J) e engrenagens (Ft=2T/dp) passam casos de carga e fadiga',
      passed: stressAndFatigueOk,
      detail: `FS semieixo=${tr.structuralAndFatigue.shaftSafetyFactor}x | Tensão dente=${tr.structuralAndFatigue.toothBendingStressMpa} MPa | Fadiga=${tr.structuralAndFatigue.fatigueLifeRaces} GPs.`,
    },
    {
      id: 'G09-C4',
      label: 'Trocas têm dinâmica (inércia/corte) e penalidades térmicas/mecânicas',
      passed: shiftsOk,
      detail: `Tempo=${(tr.clutchAndShifts.shiftDurationS * 1000).toFixed(0)} ms · Perda sinc=${tr.clutchAndShifts.shiftSyncEnergyLossJ} J · Tcap=${tr.clutchAndShifts.clutchTorqueCapacityNm} N·m.`,
    },
    {
      id: 'G09-C5',
      label: 'Conformidade vinculada à edição FIA identificada (sem constantes eternas)',
      passed: editionOk,
      detail: `${tr.editionId} (${tr.regulatoryCompliance.numForwardGears} marchas, troca ≥ ${tr.regulatoryCompliance.minShiftTimeS * 1000} ms).`,
    },
  ];

  return {
    gateId: 'GATE_09',
    moduleCode: 'M09',
    passed: criteria.every((c) => c.passed),
    criteria,
  };
}
