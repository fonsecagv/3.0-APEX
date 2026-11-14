import type { GateResult } from './m01Foundation.ts';
import { getSeasonTrackCharacteristics } from '../../circuits/CircuitLoader.ts';

// M02 — Filosofia do Veículo (Manual Mestre Seção 2.1 - 2.3)

export type VehiclePhilosophyCode =
  | 'low_drag'
  | 'high_downforce'
  | 'stable_platform'
  | 'aero_efficiency'
  | 'mechanical_grip'
  | 'balanced_adaptive';

export type RelationClassification =
  | 'direct'
  | 'indirect'
  | 'conditional'
  | 'conflicting'
  | 'synergistic';

export interface PhilosophyWeightTarget {
  metric:
    | 'aero_efficiency_ld'
    | 'peak_downforce_cl'
    | 'drag_reduction_cd'
    | 'platform_stability'
    | 'mechanical_tire_grip'
    | 'thermal_robustness';
  label: string;
  weight: number;
  targetMin: number;
  targetMax: number;
  unitSi: string;
  justification: string;
  relationType: RelationClassification;
}

export interface VehiclePhilosophySpec {
  code: VehiclePhilosophyCode;
  name: string;
  priority: string;
  typicalTradeoffs: string[];
  version: string;
  weights: PhilosophyWeightTarget[];
}

export interface TrackCharacteristicsSi {
  circuitCode: string;
  name: string;
  country: string;
  laps: number;
  lapDistanceM: number;
  altitudeM: number;
  ambientTempK: number;
  windSpeedMs: number;
  highSpeedShare: number; // fraction 0..1 (>220 km/h)
  mediumSpeedShare: number; // fraction 0..1 (130..220 km/h)
  lowSpeedShare: number; // fraction 0..1 (<130 km/h)
  minCornerRadiusM: number;
  brakingSeverity: number; // 0..1
  tractionDemand: number; // 0..1
  surfaceRoughnessUm: number;
  bumpinessIndex: number; // 0..1
  kerbSeverity: number; // 0..1
}

export interface SubsystemRelationEntry {
  sourceParam: string;
  targetMetric: string;
  classification: RelationClassification;
  physicalMechanism: string;
}

export interface PhilosophyDecisionReport {
  philosophy: VehiclePhilosophySpec;
  track: TrackCharacteristicsSi;
  objectiveScoreJ: number; // J = sum(w_i * f_i(x)) - constraintPenalties
  constraintPenalty: number;
  trackCompatibilityPct: number;
  targetRanges: {
    targetClRange: [number, number];
    targetCdRange: [number, number];
    targetLdRange: [number, number];
    targetFrontBalanceRange: [number, number];
    targetSpringRateRangeNPerM: [number, number];
  };
  tradeoffsToConfirm: string[];
  subsystemRelations: SubsystemRelationEntry[];
  tradeoffsAcknowledged: boolean;
}

export const VEHICLE_PHILOSOPHIES_M02: Record<VehiclePhilosophyCode, VehiclePhilosophySpec> = {
  low_drag: {
    code: 'low_drag',
    name: 'Low Drag',
    priority: 'Reduzir resistência aerodinâmica em reta (D = ½ρV²CDA) e potência dissipada P_D = D·V.',
    typicalTradeoffs: [
      'Pode limitar carga aerodinâmica absoluta em curvas de média/alta velocidade se não houver compensação de assoalho.',
      'Menor pressão vertical nos pneus exige acerto mecânico mais cuidadoso para evitar deslizamento longitudinal em tração.',
    ],
    version: '1.0.0',
    weights: [
      { metric: 'drag_reduction_cd', label: 'Minimização de Cd', weight: 0.38, targetMin: 0.68, targetMax: 0.82, unitSi: '-', justification: 'Reduz potência de arrasto proporcional a V³ em retas longas.', relationType: 'conflicting' },
      { metric: 'aero_efficiency_ld', label: 'Eficiência L/D', weight: 0.25, targetMin: 3.7, targetMax: 4.4, unitSi: '-', justification: 'Manter downforce residual sem penalizar velocidade final.', relationType: 'synergistic' },
      { metric: 'peak_downforce_cl', label: 'Downforce Modo Z', weight: 0.12, targetMin: 2.8, targetMax: 3.4, unitSi: '-', justification: 'Carga mínima para estabilidade de frenagem.', relationType: 'conflicting' },
      { metric: 'platform_stability', label: 'Estabilidade da Plataforma', weight: 0.10, targetMin: 0.70, targetMax: 0.95, unitSi: '-', justification: 'Baixa sensibilidade em yaw em velocidade máxima.', relationType: 'direct' },
      { metric: 'mechanical_tire_grip', label: 'Aderência Mecânica', weight: 0.08, targetMin: 0.65, targetMax: 0.90, unitSi: '-', justification: 'Compensar menor carga aero em curvas lentas.', relationType: 'indirect' },
      { metric: 'thermal_robustness', label: 'Folga Térmica', weight: 0.07, targetMin: 4.0, targetMax: 16.0, unitSi: 'K', justification: 'Dutos estreitos elevam risco térmico em vácuo.', relationType: 'conflicting' },
    ],
  },
  high_downforce: {
    code: 'high_downforce',
    name: 'High Downforce',
    priority: 'Maximizar carga aerodinâmica vertical em curva (Fz = ½ρV²CLA).',
    typicalTradeoffs: [
      'Aumenta arrasto induzido (CDi ∝ CL²) e exige maior rigidez de suspensão/estrutura.',
      'Eleva sensibilidade à altura (∂Fz/∂h) e exigência térmica sobre pneus e freios.',
    ],
    version: '1.0.0',
    weights: [
      { metric: 'peak_downforce_cl', label: 'Carga Vertical Máxima (CL)', weight: 0.40, targetMin: 3.6, targetMax: 4.4, unitSi: '-', justification: 'Maximiza Fz nos pneus em curvas de média/alta.', relationType: 'conflicting' },
      { metric: 'platform_stability', label: 'Estabilidade sob Carga', weight: 0.20, targetMin: 0.75, targetMax: 0.95, unitSi: '-', justification: 'Evita estol de difusor e porpoising.', relationType: 'conditional' },
      { metric: 'aero_efficiency_ld', label: 'Eficiência L/D', weight: 0.15, targetMin: 3.2, targetMax: 3.9, unitSi: '-', justification: 'Conter penalidade de arrasto fora das zonas Modo X.', relationType: 'conflicting' },
      { metric: 'mechanical_tire_grip', label: 'Contato Pneu-Pista', weight: 0.10, targetMin: 0.70, targetMax: 0.92, unitSi: '-', justification: 'Suportar cargas verticais elevadas sem saturação térmica.', relationType: 'indirect' },
      { metric: 'thermal_robustness', label: 'Margem Térmica PU/Pneus', weight: 0.10, targetMin: 3.0, targetMax: 14.0, unitSi: 'K', justification: 'Maior energia dissipada em curvas rápidas.', relationType: 'conditional' },
      { metric: 'drag_reduction_cd', label: 'Controle de Arrasto', weight: 0.05, targetMin: 0.85, targetMax: 1.05, unitSi: '-', justification: 'Aceita Cd maior em Modo Z compensado parcialmente pelo Modo X.', relationType: 'conflicting' },
    ],
  },
  stable_platform: {
    code: 'stable_platform',
    name: 'Stable Platform',
    priority: 'Preservar plataforma previsível com baixa sensibilidade ∂Fz/∂h, pitch e yaw.',
    typicalTradeoffs: [
      'Pode exigir controle rigoroso de pitch/roll e menor agressividade de altura e difusor.',
      'Sacrifica pico teórico de downforce em condição estática ideal para ganhar consistência real.',
    ],
    version: '1.0.0',
    weights: [
      { metric: 'platform_stability', label: 'Controle de Plataforma / Yaw', weight: 0.38, targetMin: 0.82, targetMax: 0.98, unitSi: '-', justification: 'Minimiza migração de centro de pressão e porpoising.', relationType: 'direct' },
      { metric: 'mechanical_tire_grip', label: 'Consistência Pneu-Pista', weight: 0.20, targetMin: 0.75, targetMax: 0.95, unitSi: '-', justification: 'Reduz variações bruscas de carga Fz sobre zebras.', relationType: 'synergistic' },
      { metric: 'peak_downforce_cl', label: 'Downforce Útil Aderido', weight: 0.16, targetMin: 3.1, targetMax: 3.7, unitSi: '-', justification: 'Carga utilizável em toda a faixa de atitude.', relationType: 'conditional' },
      { metric: 'aero_efficiency_ld', label: 'Eficiência L/D', weight: 0.12, targetMin: 3.5, targetMax: 4.1, unitSi: '-', justification: 'Equilíbrio estável em transição Modo Z ↔ Modo X.', relationType: 'direct' },
      { metric: 'thermal_robustness', label: 'Estabilidade Térmica', weight: 0.08, targetMin: 5.0, targetMax: 18.0, unitSi: 'K', justification: 'Evita derating inesperado durante o stint.', relationType: 'direct' },
      { metric: 'drag_reduction_cd', label: 'Arrasto Controlado', weight: 0.06, targetMin: 0.76, targetMax: 0.92, unitSi: '-', justification: 'Previsibilidade longitudinal.', relationType: 'indirect' },
    ],
  },
  aero_efficiency: {
    code: 'aero_efficiency',
    name: 'Aero Efficiency',
    priority: 'Equilibrar carga e arrasto (CL/CD) em todo o envelope de velocidades e modos.',
    typicalTradeoffs: [
      'Eficiência L/D alta não substitui carga absoluta em circuitos de baixa velocidade nem estabilidade operacional.',
      'Ponto ótimo varia significativamente com vento lateral e rugosidade da pista.',
    ],
    version: '1.0.0',
    weights: [
      { metric: 'aero_efficiency_ld', label: 'Razão CL/CD', weight: 0.36, targetMin: 3.8, targetMax: 4.5, unitSi: '-', justification: 'Maximizar downforce por unidade de arrasto.', relationType: 'synergistic' },
      { metric: 'drag_reduction_cd', label: 'Eficiência em Modo X', weight: 0.22, targetMin: 0.72, targetMax: 0.86, unitSi: '-', justification: 'Reduz arrasto de refrigeração e induzido.', relationType: 'conflicting' },
      { metric: 'peak_downforce_cl', label: 'Carga em Curva', weight: 0.18, targetMin: 3.2, targetMax: 3.8, unitSi: '-', justification: 'Sustentar velocidade de contorno em curvas médias.', relationType: 'conflicting' },
      { metric: 'platform_stability', label: 'Estabilidade da Plataforma', weight: 0.12, targetMin: 0.74, targetMax: 0.92, unitSi: '-', justification: 'Evitar que ganho de L/D gere separação abrupta.', relationType: 'conditional' },
      { metric: 'thermal_robustness', label: 'Eficiência Térmica (Dutos)', weight: 0.07, targetMin: 4.0, targetMax: 15.0, unitSi: 'K', justification: 'Minimizar arrasto de arrefecimento sem déficit térmico.', relationType: 'conflicting' },
      { metric: 'mechanical_tire_grip', label: 'Aderência Mecânica', weight: 0.05, targetMin: 0.68, targetMax: 0.88, unitSi: '-', justification: 'Suporte em curvas lentas.', relationType: 'indirect' },
    ],
  },
  mechanical_grip: {
    code: 'mechanical_grip',
    name: 'Mechanical Grip',
    priority: 'Priorizar contato pneu-pista, tração e absorção de irregularidades e zebras.',
    typicalTradeoffs: [
      'Suspensão mais complacente aumenta amplitude de curso vertical, podendo reduzir estabilidade aerodinâmica em alta velocidade.',
      'Componentes cinemáticos/reforços podem elevar massa ou exigir maior abertura térmica em baixa velocidade.',
    ],
    version: '1.0.0',
    weights: [
      { metric: 'mechanical_tire_grip', label: 'Contato Pneu-Pista & Tração', weight: 0.38, targetMin: 0.80, targetMax: 0.96, unitSi: '-', justification: 'Maximizar F_y e F_x em curvas lentas e sobre zebras.', relationType: 'direct' },
      { metric: 'platform_stability', label: 'Conformidade e Amortecimento', weight: 0.20, targetMin: 0.74, targetMax: 0.92, unitSi: '-', justification: 'Controlar rolagem e transferência lateral de carga.', relationType: 'conditional' },
      { metric: 'peak_downforce_cl', label: 'Downforce de Apoio', weight: 0.16, targetMin: 3.1, targetMax: 3.8, unitSi: '-', justification: 'Apoiar média velocidade sem depender de altura extrema.', relationType: 'indirect' },
      { metric: 'thermal_robustness', label: 'Janela Térmica Pneu/PU', weight: 0.14, targetMin: 5.0, targetMax: 16.0, unitSi: 'K', justification: 'Circuitos lentos têm menor convecção nos radiadores.', relationType: 'conditional' },
      { metric: 'aero_efficiency_ld', label: 'Eficiência L/D', weight: 0.07, targetMin: 3.3, targetMax: 3.9, unitSi: '-', justification: 'Eficiência secundária para retas curtas.', relationType: 'indirect' },
      { metric: 'drag_reduction_cd', label: 'Controle de Arrasto', weight: 0.05, targetMin: 0.80, targetMax: 0.98, unitSi: '-', justification: 'Baixa prioridade relativa em pistas travadas.', relationType: 'conflicting' },
    ],
  },
  balanced_adaptive: {
    code: 'balanced_adaptive',
    name: 'Balanced / Adaptive',
    priority: 'Robustez equilibrada entre domínios ao longo de todo o calendário.',
    typicalTradeoffs: [
      'Não necessariamente lidera nenhuma métrica isolada em circuitos extremos.',
      'Exige maior janela de calibração de setup entre pistas de perfis opostos.',
    ],
    version: '1.0.0',
    weights: [
      { metric: 'aero_efficiency_ld', label: 'Eficiência L/D', weight: 0.20, targetMin: 3.5, targetMax: 4.2, unitSi: '-', justification: 'Versatilidade entre retas e curvas.', relationType: 'synergistic' },
      { metric: 'peak_downforce_cl', label: 'Downforce Global', weight: 0.18, targetMin: 3.2, targetMax: 3.9, unitSi: '-', justification: 'Competitividade em pistas mistas.', relationType: 'direct' },
      { metric: 'platform_stability', label: 'Estabilidade da Plataforma', weight: 0.18, targetMin: 0.75, targetMax: 0.92, unitSi: '-', justification: 'Previsibilidade em variações de vento e piso.', relationType: 'direct' },
      { metric: 'mechanical_tire_grip', label: 'Aderência Mecânica', weight: 0.18, targetMin: 0.74, targetMax: 0.92, unitSi: '-', justification: 'Proteção de desgaste e tração em saídas de curva.', relationType: 'synergistic' },
      { metric: 'thermal_robustness', label: 'Margem Térmica', weight: 0.14, targetMin: 5.0, targetMax: 16.0, unitSi: 'K', justification: 'Resiliência em corridas quentes e tráfego.', relationType: 'direct' },
      { metric: 'drag_reduction_cd', label: 'Arrasto Base', weight: 0.12, targetMin: 0.74, targetMax: 0.88, unitSi: '-', justification: 'Competitividade em zonas de Modo X.', relationType: 'indirect' },
    ],
  },
};

export const TRACK_CHARACTERISTICS_CATALOG: TrackCharacteristicsSi[] =
  getSeasonTrackCharacteristics(2026);

export const SUBSYSTEM_RELATIONS_M02: SubsystemRelationEntry[] = [
  {
    sourceParam: 'Capacidade de refrigeração (área radiador / duto)',
    targetMetric: 'Arrasto aerodinâmico e massa',
    classification: 'conflicting',
    physicalMechanism: 'Maior rejeição térmica requer maior vazão mássica ṁ e trocadores maiores, elevando massa e arrasto de pressão.',
  },
  {
    sourceParam: 'Redução de altura de rodagem (h_f, h_r)',
    targetMetric: 'Sensibilidade ∂Fz/∂h e porpoising',
    classification: 'conflicting',
    physicalMechanism: 'Aceleração Venturi aumenta CL, porém eleva gradiente ∂Fz/∂h e risco de estol/contato de prancha em pistas onduladas.',
  },
  {
    sourceParam: 'Rigidez elevada de molas (K_spring)',
    targetMetric: 'Estabilidade aero vs. aderência sobre zebras',
    classification: 'conditional',
    physicalMechanism: 'Beneficia plataforma aero em curvas planas, mas degrada contato mecânico pneu-pista em pisos ondulados e zebras.',
  },
  {
    sourceParam: 'Undercut dos sidepods',
    targetMetric: 'Recuperação de pressão do difusor (Coandă)',
    classification: 'synergistic',
    physicalMechanism: 'Direciona escoamento energizado para a rampa superior do difusor, retardando separação sem aumentar área frontal.',
  },
  {
    sourceParam: 'Câmbio compacto',
    targetMetric: 'Desempenho aero vs. tempo de manutenção',
    classification: 'conflicting',
    physicalMechanism: 'Reduz bloqueio do difusor (AER-010), mas dificulta acesso e eleva o tempo de remoção/inspeção na garagem.',
  },
];

export function evaluatePhilosophyForTrack(
  philosophyCode: VehiclePhilosophyCode,
  circuitCode: string,
  normalizedMetrics: {
    aeroEfficiencyLd: number; // e.g. 3.0..4.5
    clTotal: number; // e.g. 2.5..4.5
    cdTotal: number; // e.g. 0.65..1.15
    platformStability01: number; // 0..1
    mechanicalGrip01: number; // 0..1
    thermalMarginK: number; // -10..25
  },
  regulatoryViolationsCount: number,
  tradeoffsAcknowledged: boolean
): PhilosophyDecisionReport {
  const philosophy = VEHICLE_PHILOSOPHIES_M02[philosophyCode];
  const track =
    TRACK_CHARACTERISTICS_CATALOG.find((t) => t.circuitCode === circuitCode) ||
    TRACK_CHARACTERISTICS_CATALOG[0];

  // Track alters relative utility of objectives (never physical laws)
  const trackDemandMultipliers: Record<PhilosophyWeightTarget['metric'], number> = {
    drag_reduction_cd: 0.7 + track.highSpeedShare * 0.8,
    peak_downforce_cl: 0.7 + track.mediumSpeedShare * 0.7 + (1 - track.highSpeedShare) * 0.3,
    aero_efficiency_ld: 0.8 + (track.highSpeedShare + track.mediumSpeedShare) * 0.35,
    platform_stability: 0.75 + (track.windSpeedMs / 10) * 0.4 + track.bumpinessIndex * 0.45,
    mechanical_tire_grip: 0.7 + track.lowSpeedShare * 0.65 + track.kerbSeverity * 0.25,
    thermal_robustness: 0.7 + Math.max(0, (track.ambientTempK - 290) / 20) * 0.6 + (track.altitudeM / 1000) * 0.3,
  };

  // Normalize each physical metric into [0, 1]
  const fNorm: Record<PhilosophyWeightTarget['metric'], number> = {
    aero_efficiency_ld: Math.max(0, Math.min(1, (normalizedMetrics.aeroEfficiencyLd - 2.5) / 2.2)),
    peak_downforce_cl: Math.max(0, Math.min(1, (normalizedMetrics.clTotal - 2.2) / 2.3)),
    drag_reduction_cd: Math.max(0, Math.min(1, 1 - (normalizedMetrics.cdTotal - 0.62) / 0.55)),
    platform_stability: Math.max(0, Math.min(1, normalizedMetrics.platformStability01)),
    mechanical_tire_grip: Math.max(0, Math.min(1, normalizedMetrics.mechanicalGrip01)),
    thermal_robustness: Math.max(0, Math.min(1, (normalizedMetrics.thermalMarginK + 5) / 25)),
  };

  let weightedSum = 0;
  let weightTotal = 0;
  for (const w of philosophy.weights) {
    const effW = w.weight * trackDemandMultipliers[w.metric];
    weightedSum += effW * fNorm[w.metric];
    weightTotal += effW;
  }

  const rawJ = weightTotal > 0 ? weightedSum / weightTotal : 0;
  const constraintPenalty = regulatoryViolationsCount * 0.25 + (normalizedMetrics.thermalMarginK < 0 ? 0.15 : 0);
  const objectiveScoreJ = Number(Math.max(0, rawJ - constraintPenalty).toFixed(4));

  // Track compatibility score based on alignment of philosophy priorities with track spectrum
  let trackCompatibilityPct = 72;
  if (philosophyCode === 'low_drag') {
    trackCompatibilityPct = Math.round(52 + track.highSpeedShare * 72 - track.lowSpeedShare * 25);
  } else if (philosophyCode === 'high_downforce') {
    trackCompatibilityPct = Math.round(55 + (track.mediumSpeedShare + track.lowSpeedShare) * 52 - track.highSpeedShare * 22);
  } else if (philosophyCode === 'stable_platform') {
    trackCompatibilityPct = Math.round(68 + track.bumpinessIndex * 22 + (track.windSpeedMs / 8) * 15);
  } else if (philosophyCode === 'aero_efficiency') {
    trackCompatibilityPct = Math.round(64 + (track.highSpeedShare + track.mediumSpeedShare) * 38);
  } else if (philosophyCode === 'mechanical_grip') {
    trackCompatibilityPct = Math.round(54 + track.lowSpeedShare * 62 + track.kerbSeverity * 18);
  } else {
    trackCompatibilityPct = 82;
  }
  trackCompatibilityPct = Math.max(35, Math.min(98, trackCompatibilityPct));

  const wCl = philosophy.weights.find((w) => w.metric === 'peak_downforce_cl')!;
  const wCd = philosophy.weights.find((w) => w.metric === 'drag_reduction_cd')!;
  const wLd = philosophy.weights.find((w) => w.metric === 'aero_efficiency_ld')!;

  return {
    philosophy,
    track,
    objectiveScoreJ,
    constraintPenalty: Number(constraintPenalty.toFixed(3)),
    trackCompatibilityPct,
    targetRanges: {
      targetClRange: [wCl.targetMin, wCl.targetMax],
      targetCdRange: [wCd.targetMin, wCd.targetMax],
      targetLdRange: [wLd.targetMin, wLd.targetMax],
      targetFrontBalanceRange:
        philosophyCode === 'mechanical_grip' ? [0.435, 0.465] : [0.44, 0.475],
      targetSpringRateRangeNPerM:
        philosophyCode === 'mechanical_grip'
          ? [160000, 215000]
          : philosophyCode === 'high_downforce'
          ? [235000, 310000]
          : [195000, 260000],
    },
    tradeoffsToConfirm: philosophy.typicalTradeoffs,
    subsystemRelations: SUBSYSTEM_RELATIONS_M02,
    tradeoffsAcknowledged,
  };
}

export function evaluateGate02(report: PhilosophyDecisionReport): GateResult {
  const allJustified = report.philosophy.weights.every(
    (w) => w.justification.length > 5 && w.unitSi.length > 0 && w.weight > 0
  );
  const weightsSumApproxOne =
    Math.abs(report.philosophy.weights.reduce((acc, w) => acc + w.weight, 0) - 1.0) < 0.02;

  const criteria = [
    {
      id: 'G02-C1',
      label: 'Prioridades possuem justificativa física, métrica, peso e versão',
      passed: allJustified && weightsSumApproxOne && /^\d+\.\d+\.\d+$/.test(report.philosophy.version),
      detail: `Filosofia ${report.philosophy.name} v${report.philosophy.version} com ${report.philosophy.weights.length} pesos normalizados.`,
    },
    {
      id: 'G02-C2',
      label: 'Restrições regulamentares separadas das preferências competitivas',
      passed: Number.isFinite(report.constraintPenalty),
      detail: `Função J=${report.objectiveScoreJ} separa métricas de preferência de penalidade regulamentar (${report.constraintPenalty}).`,
    },
    {
      id: 'G02-C3',
      label: 'Filosofia gera alvos e intervalos mensuráveis (não geometria automaticamente aprovada)',
      passed:
        report.targetRanges.targetClRange[0] < report.targetRanges.targetClRange[1] &&
        report.targetRanges.targetLdRange[0] < report.targetRanges.targetLdRange[1],
      detail: `Alvos: CL [${report.targetRanges.targetClRange.join('–')}], L/D [${report.targetRanges.targetLdRange.join('–')}].`,
    },
    {
      id: 'G02-C4',
      label: 'Trade-offs exibidos e reconhecidos antes da confirmação',
      passed: report.tradeoffsToConfirm.length >= 2 && report.tradeoffsAcknowledged,
      detail: report.tradeoffsAcknowledged
        ? `${report.tradeoffsToConfirm.length} trade-offs analisados e confirmados.`
        : 'Aguardando confirmação explícita dos trade-offs pelo usuário.',
    },
  ];

  return {
    gateId: 'GATE_02',
    moduleCode: 'M02',
    passed: criteria.every((c) => c.passed),
    criteria,
  };
}
