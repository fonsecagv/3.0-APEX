import type { CarSetup, Circuit, SetupWindow } from '../types/f1';
import type { VehiclePhysicsOutputs } from '../types/physics';

export type SetupParameterStatus = 'optimal' | 'close' | 'misaligned';

export interface SetupParameterEvaluation {
  key: 'frontWing' | 'rearWing' | 'suspension' | 'tirePressure';
  label: string;
  currentValueLabel: string;
  status: SetupParameterStatus;
  statusLabel: 'ÓTIMO' | 'QUASE IDEAL' | 'DESALINHADO';
  directionHint: string;
  deltaFromIdeal: number;
}

export interface PracticeSetupEvaluation {
  overallScore0to100: number;
  overallLabel: 'ÓTIMO' | 'BOM' | 'PRECISA AJUSTE' | 'DESALINHADO';
  predictedQualiDeltaSec: number;
  driverFeedbackAvg: number;
  driverFeedbackTierLabel: string;
  driverCorridorPrecisionDeg: number;
  convergenceMultiplier: number;
  idealRearWing: number;
  idealTirePsi: number;
  recommendedConfidenceGain: number;
  parameters: Record<'frontWing' | 'rearWing' | 'suspension' | 'tirePressure', SetupParameterEvaluation>;
  pitRadioSummary: string;
  leadDriverName: string;
  driverRadioQuote: string;
  recommendedSetupPatch: Partial<CarSetup> | null;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function computeDriverFeedbackPrecision(driverFeedbackAvg: number): {
  corridorDeg: number;
  convergenceMultiplier: number;
  tierLabel: string;
} {
  const fb = clamp(Math.round(driverFeedbackAvg), 40, 99);
  if (fb >= 90) {
    return {
      corridorDeg: 1.0,
      convergenceMultiplier: 1.35,
      tierLabel: 'ELITE (CIRÚRGICO)',
    };
  }
  if (fb >= 80) {
    return {
      corridorDeg: 1.5,
      convergenceMultiplier: 1.18,
      tierLabel: 'PRECISO',
    };
  }
  if (fb >= 70) {
    return {
      corridorDeg: 2.5,
      convergenceMultiplier: 1.0,
      tierLabel: 'INTERMEDIÁRIO',
    };
  }
  return {
    corridorDeg: 4.0,
    convergenceMultiplier: 0.82,
    tierLabel: 'VAGO (NOVATO)',
  };
}

export function evaluatePracticeSetup(params: {
  carSetup: CarSetup;
  setupWindow: SetupWindow;
  circuit: Circuit;
  vehiclePhysics: VehiclePhysicsOutputs;
  driverFeedbackAvg: number;
  fpRunsDone: number;
  modificadorSetupRapido?: boolean;
  stabilityIndex01?: number;
  coolingDemandIndex01?: number;
  airDensityKgM3?: number;
  modeXFractionPct?: number;
  leadDriverName?: string;
}): PracticeSetupEvaluation {
  const {
    carSetup,
    setupWindow,
    circuit,
    vehiclePhysics,
    driverFeedbackAvg,
    fpRunsDone,
    modificadorSetupRapido = false,
    stabilityIndex01 = 0.8,
    coolingDemandIndex01 = 0.5,
    airDensityKgM3 = 1.225,
    modeXFractionPct = 55,
    leadDriverName = 'Piloto #1',
  } = params;

  const precision = computeDriverFeedbackPrecision(driverFeedbackAvg);

  const idealFront = setupWindow.idealFrontWing;
  const idealRear =
    setupWindow.idealRearWing ?? clamp(Math.round(idealFront + 4), 15, 50);
  const idealStiff = setupWindow.idealStiffness;
  const idealPsi = setupWindow.idealPressure ?? 22.5;

  const frontDelta = carSetup.frontWingAngle - idealFront;
  const rearDelta = carSetup.rearWingAngle - idealRear;
  const stiffDelta = carSetup.suspensionStiffness - idealStiff;
  const psiDelta = Number((carSetup.tirePressurePsi - idealPsi).toFixed(1));

  const frontAbs = Math.abs(frontDelta);
  const rearAbs = Math.abs(rearDelta);
  const stiffAbs = Math.abs(stiffDelta);
  const psiAbs = Math.abs(psiDelta);

  const hasTelemetry = fpRunsDone >= 1;
  const isSharpFeedback = driverFeedbackAvg >= 78 || fpRunsDone >= 2;

  const classifyAngle = (
    key: 'frontWing' | 'rearWing',
    label: string,
    currentVal: number,
    delta: number,
    abs: number,
    unitSuffix: string,
  ): SetupParameterEvaluation => {
    const status: SetupParameterStatus =
      abs <= 1.5 ? 'optimal' : abs <= 4.5 ? 'close' : 'misaligned';
    const statusLabel =
      status === 'optimal' ? 'ÓTIMO' : status === 'close' ? 'QUASE IDEAL' : 'DESALINHADO';

    let directionHint = 'Faça 1 stint no TL para o piloto ler o equilíbrio aero.';
    if (hasTelemetry) {
      if (status === 'optimal') {
        directionHint = 'Dentro da janela aerodinâmica ideal.';
      } else if (isSharpFeedback) {
        const action = delta > 0 ? 'Reduzir' : 'Aumentar';
        directionHint = `${action} ~${Math.max(1, Math.round(abs))}° (${delta > 0 ? 'excesso de carga' : 'falta apoio'}).`;
      } else {
        directionHint =
          delta > 0
            ? 'Piloto sente frente/traseira carregada — tente reduzir o ângulo.'
            : 'Piloto reclama de falta de aderência — tente aumentar o ângulo.';
      }
    }

    return {
      key,
      label,
      currentValueLabel: `${currentVal}${unitSuffix}`,
      status,
      statusLabel,
      directionHint,
      deltaFromIdeal: delta,
    };
  };

  const frontEval = classifyAngle(
    'frontWing',
    'Asa Dianteira',
    carSetup.frontWingAngle,
    frontDelta,
    frontAbs,
    '°',
  );

  const rearEval = classifyAngle(
    'rearWing',
    'Asa Traseira',
    carSetup.rearWingAngle,
    rearDelta,
    rearAbs,
    '°',
  );

  const stiffStatus: SetupParameterStatus =
    stiffAbs <= 1 ? 'optimal' : stiffAbs <= 2 ? 'close' : 'misaligned';
  const stiffEval: SetupParameterEvaluation = {
    key: 'suspension',
    label: 'Rigidez da Suspensão',
    currentValueLabel: `${carSetup.suspensionStiffness} / 10`,
    status: stiffStatus,
    statusLabel:
      stiffStatus === 'optimal'
        ? 'ÓTIMO'
        : stiffStatus === 'close'
        ? 'QUASE IDEAL'
        : 'DESALINHADO',
    directionHint: !hasTelemetry
      ? 'Envie o carro à pista para avaliar estabilidade nas zebras.'
      : stiffStatus === 'optimal'
      ? 'Plataforma estável sem perda de tração nas zebras.'
      : isSharpFeedback
      ? stiffDelta > 0
        ? `Amaciar ~${Math.round(stiffAbs)} pt(s) — carro quicando nas zebras.`
        : `Endurecer ~${Math.round(stiffAbs)} pt(s) — chassi rolando nas curvas.`
      : stiffDelta > 0
      ? 'Carro rígido demais sobre as zebras — experimente amaciar.'
      : 'Carro rolando demais na troca de direção — experimente endurecer.',
    deltaFromIdeal: stiffDelta,
  };

  const psiStatus: SetupParameterStatus =
    psiAbs <= 0.4 ? 'optimal' : psiAbs <= 1.0 ? 'close' : 'misaligned';
  const psiEval: SetupParameterEvaluation = {
    key: 'tirePressure',
    label: 'Pressão dos Pneus',
    currentValueLabel: `${carSetup.tirePressurePsi.toFixed(1)} PSI`,
    status: psiStatus,
    statusLabel:
      psiStatus === 'optimal'
        ? 'ÓTIMO'
        : psiStatus === 'close'
        ? 'QUASE IDEAL'
        : 'DESALINHADO',
    directionHint: !hasTelemetry
      ? 'Aguardando leitura térmica da banda de rodagem no TL.'
      : psiStatus === 'optimal'
      ? 'Área de contato e aquecimento dentro da janela Pirelli.'
      : isSharpFeedback
      ? psiDelta > 0
        ? `Reduzir ~${psiAbs.toFixed(1)} PSI (centro superaquecendo).`
        : `Aumentar ~${psiAbs.toFixed(1)} PSI (pneu demorando a aquecer).`
      : psiDelta > 0
      ? 'Pressão alta reduzindo área de contato — tente baixar.'
      : 'Carcaça muito baixa — tente subir a pressão.',
    deltaFromIdeal: psiDelta,
  };

  // Normalized 0..100 setup alignment score across all 4 parameters
  const frontPenalty = clamp(frontAbs * 3.1, 0, 32);
  const rearPenalty = clamp(rearAbs * 2.8, 0, 28);
  const stiffPenalty = clamp(stiffAbs * 7.0, 0, 24);
  const psiPenalty = clamp(psiAbs * 10.5, 0, 16);
  const overallScore0to100 = Math.round(
    clamp(100 - (frontPenalty + rearPenalty + stiffPenalty + psiPenalty), 15, 100),
  );

  const overallLabel: PracticeSetupEvaluation['overallLabel'] =
    overallScore0to100 >= 86
      ? 'ÓTIMO'
      : overallScore0to100 >= 70
      ? 'BOM'
      : overallScore0to100 >= 50
      ? 'PRECISA AJUSTE'
      : 'DESALINHADO';

  // Estimated Quali lap delta relative to neutral 65-pt baseline (negative = faster)
  const predictedQualiDeltaSec = Number(
    (((68 - overallScore0to100) / 100) * 1.15).toFixed(2),
  );

  // Confidence gain per practice stint (scaled by setup quality, driver feedback, and strategist modifier)
  const baseStintGain =
    14 +
    (overallScore0to100 / 100) * 15 -
    Math.min(10, (frontAbs * 0.55 + rearAbs * 0.45 + stiffAbs * 1.1 + psiAbs * 1.4));
  const rawGain = Math.max(8, baseStintGain) * precision.convergenceMultiplier;
  const recommendedConfidenceGain = Math.round(
    clamp(rawGain * (modificadorSetupRapido ? 1.75 : 1.0), 8, 52),
  );

  // Build crisp Pit Radio transcript combining physics + worst setup mismatch
  let pitRadioSummary = `Telemetria limpa em ${circuit.name} (Modo Z ${vehiclePhysics.cornerMode.aeroBalanceFrontPct}% diant., L/D ${vehiclePhysics.cornerMode.aeroEfficiencyLD} · ρ=${airDensityKgM3} kg/m³ · Modo X ${modeXFractionPct}%). Feedback do piloto (${Math.round(driverFeedbackAvg)}/99) ajustou a janela para ${precision.corridorDeg.toFixed(1)}°.`;
  let driverRadioQuote = `Rádio (${leadDriverName}): "O carro está equilibrado nas curvas de ${circuit.name}. Podemos focar em refinar pressão dos pneus para a classificação."`;
  let recommendedSetupPatch: Partial<CarSetup> | null = null;

  const worst = [frontEval, rearEval, stiffEval, psiEval].sort((a, b) => {
    const rank = (s: SetupParameterStatus) => (s === 'misaligned' ? 2 : s === 'close' ? 1 : 0);
    return rank(b.status) - rank(a.status);
  })[0];

  if (worst && worst.status !== 'optimal') {
    if (worst.key === 'frontWing') {
      const step = Math.round(clamp(idealFront, 10, 45));
      recommendedSetupPatch = { frontWingAngle: step };
    } else if (worst.key === 'rearWing') {
      const step = Math.round(clamp(idealRear, 15, 50));
      recommendedSetupPatch = { rearWingAngle: step };
    } else if (worst.key === 'suspension') {
      const step = Math.round(clamp(idealStiff, 1, 10));
      recommendedSetupPatch = { suspensionStiffness: step };
    } else if (worst.key === 'tirePressure') {
      const step = Number(clamp(idealPsi, 20.0, 25.0).toFixed(1));
      recommendedSetupPatch = { tirePressurePsi: step };
    }
  }

  if (vehiclePhysics.porpoisingRiskPct > 55 || stabilityIndex01 < 0.65) {
    pitRadioSummary = `ALERTA DE PORPOISING (${vehiclePhysics.porpoisingRiskPct}%): O assoalho está quicando nas retas de ${circuit.name}. Endureça a suspensão ou ajuste a carga aerodinâmica. ${frontEval.status !== 'optimal' ? `Asa diant.: ${frontEval.directionHint}` : ''}`;
    driverRadioQuote = `Rádio (${leadDriverName}): "O assoalho está batendo forte no fim da reta de ${circuit.name}! Endureçam a suspensão ou reduzam a carga dianteira!"`;
  } else if (vehiclePhysics.thermalMarginC < 4 || coolingDemandIndex01 > 0.78) {
    pitRadioSummary = `ALERTA TÉRMICO DE PISTA: Margem térmica de apenas ${vehiclePhysics.thermalMarginC}°C sob demanda de refrigeração ${(coolingDemandIndex01 * 100).toFixed(0)}%. Fique atento à pressão dos pneus (${psiEval.statusLabel}).`;
    driverRadioQuote = `Rádio (${leadDriverName}): "Os freios e pneus estão superaquecendo no setor final! Precisamos ajustar a pressão para estabilizar a borracha."`;
  } else if (worst && worst.status !== 'optimal') {
    pitRadioSummary = `Rádio dos Boxes (Feedback ${Math.round(driverFeedbackAvg)}/99): ${worst.label} está ${worst.statusLabel.toLowerCase()} — ${worst.directionHint} Balanço atual em ${overallScore0to100}/100.`;
    if (worst.key === 'frontWing' || worst.key === 'rearWing') {
      driverRadioQuote = `Rádio (${leadDriverName}): "Sinto ${worst.deltaFromIdeal > 0 ? 'o carro pesado e lento de reta' : 'falta de aderência na entrada/saída de curva'}. ${worst.directionHint}"`;
    } else if (worst.key === 'suspension') {
      driverRadioQuote = `Rádio (${leadDriverName}): "${worst.deltaFromIdeal > 0 ? 'O carro está duro demais nas zebras e destracionando!' : 'A frente está mergulhando demais nas freadas e rolando no S.'} ${worst.directionHint}"`;
    } else {
      driverRadioQuote = `Rádio (${leadDriverName}): "${worst.deltaFromIdeal > 0 ? 'O centro do pneu está fritando após 3 voltas.' : 'O pneu não entra na janela térmica de aderência!'} ${worst.directionHint}"`;
    }
  }

  return {
    overallScore0to100,
    overallLabel,
    predictedQualiDeltaSec,
    driverFeedbackAvg: Math.round(driverFeedbackAvg),
    driverFeedbackTierLabel: precision.tierLabel,
    driverCorridorPrecisionDeg: precision.corridorDeg,
    convergenceMultiplier: precision.convergenceMultiplier,
    idealRearWing: idealRear,
    idealTirePsi: idealPsi,
    recommendedConfidenceGain,
    parameters: {
      frontWing: frontEval,
      rearWing: rearEval,
      suspension: stiffEval,
      tirePressure: psiEval,
    },
    pitRadioSummary,
    leadDriverName,
    driverRadioQuote,
    recommendedSetupPatch,
  };
}
