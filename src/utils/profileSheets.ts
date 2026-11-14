import { Driver, StaffAttributes, StaffMember } from '../types/f1';
import { F1_DRIVERS_REAL } from '../data/marketData';

const clampAttr = (val: number, min = 35, max = 99): number =>
  Math.max(min, Math.min(max, Math.round(val)));

const hashId = (id: string): number => {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h * 31 + id.charCodeAt(i)) % 997;
  }
  return h;
};

export interface AttributeBarItem {
  key: string;
  label: string;
  value: number;
  category?: string;
}

export interface AttributeVisualTone {
  textClass: string;
  barClass: string;
  badgeClass: string;
  tierLabel: 'ELITE (>90)' | 'ALERTA (<60)' | 'PADRÃO';
}

export const getAttributeVisualTone = (value: number): AttributeVisualTone => {
  if (value > 90) {
    return {
      textClass: 'text-[#39FF14] drop-shadow-[0_0_6px_rgba(57,255,20,0.45)]',
      barClass: 'bg-[#39FF14] shadow-[0_0_8px_rgba(57,255,20,0.65)]',
      badgeClass: 'border-[#39FF14]/50 bg-[#39FF14]/10 text-[#39FF14]',
      tierLabel: 'ELITE (>90)'
    };
  }
  if (value < 60) {
    return {
      textClass: 'text-red-400',
      barClass: 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]',
      badgeClass: 'border-red-500/50 bg-red-950/60 text-red-400',
      tierLabel: 'ALERTA (<60)'
    };
  }
  if (value >= 80) {
    return {
      textClass: 'text-cyan-300',
      barClass: 'bg-cyan-400',
      badgeClass: 'border-cyan-500/30 bg-cyan-950/30 text-cyan-300',
      tierLabel: 'PADRÃO'
    };
  }
  if (value >= 70) {
    return {
      textClass: 'text-zinc-100',
      barClass: 'bg-zinc-300',
      badgeClass: 'border-white/15 bg-white/5 text-zinc-200',
      tierLabel: 'PADRÃO'
    };
  }
  return {
    textClass: 'text-amber-300',
    barClass: 'bg-amber-400',
    badgeClass: 'border-amber-500/30 bg-amber-950/30 text-amber-300',
    tierLabel: 'PADRÃO'
  };
};

export const getDriverTeamName = (d: Driver): string => {
  if (d.isFreeAgent || d.teamId === 'free_agent' || !d.teamId) {
    return 'Agente Livre';
  }
  const f1Teams: Record<string, string> = {
    redbull: 'Red Bull',
    ferrari: 'Ferrari',
    mclaren: 'McLaren',
    mercedes: 'Mercedes',
    astonmartin: 'Aston Martin',
    williams: 'Williams',
    alpine: 'Alpine',
    audi: 'Audi',
    haas: 'Haas',
    rb: 'Racing Bulls'
  };
  if (f1Teams[d.teamId]) return f1Teams[d.teamId];
  if (d.teamId.startsWith('f2_')) return `F2 (${d.teamId.replace('f2_', '').toUpperCase()})`;
  if (d.teamId.startsWith('f3_')) return `F3 (${d.teamId.replace('f3_', '').toUpperCase()})`;
  return d.teamId;
};

export interface DriverMarketAnalysis {
  marketabilityTier: 'Alto' | 'Médio' | 'Baixo';
  effectiveMarketability: number;
  isSoleRepresentative: boolean;
  isTraditionalCountry: boolean;
  marketingBonusCashM: number;
  bonusText: string;
}

export const getDriverMarketAnalysis = (d: Driver): DriverMarketAnalysis => {
  const nat = (d.nationality || '').trim();
  const natLower = nat.toLowerCase();

  const isTraditionalCountry = [
    'brasil',
    'brazil',
    'reino unido',
    'united kingdom',
    'itália',
    'italia',
    'italy',
    'alemanha',
    'germany'
  ].includes(natLower);

  const strongF1Markets = [
    'brasil', 'brazil',
    'japão', 'japan',
    'canadá', 'canada',
    'holanda', 'netherlands',
    'espanha', 'spain',
    'eua', 'usa', 'united states',
    'méxico', 'mexico',
    'austrália', 'australia',
    'alemanha', 'germany',
    'itália', 'italia', 'italy',
    'reino unido', 'united kingdom'
  ];

  const f1RepsCount = F1_DRIVERS_REAL.filter(
    drv => (drv.nationality || '').trim().toLowerCase() === natLower
  ).length;

  const isStrongMarket = strongF1Markets.includes(natLower);
  const isSoleRepresentative = isStrongMarket && f1RepsCount <= 1;

  let calcMarketability = d.marketability || 70;
  if (isTraditionalCountry) {
    calcMarketability = Math.max(82, calcMarketability + 8);
  }
  if (isSoleRepresentative) {
    calcMarketability += 15;
  }
  calcMarketability = Math.min(99, calcMarketability);

  let marketabilityTier: 'Alto' | 'Médio' | 'Baixo' = 'Médio';
  if (calcMarketability >= 82) {
    marketabilityTier = 'Alto';
  } else if (calcMarketability < 65) {
    marketabilityTier = 'Baixo';
  }

  let marketingBonusCashM = 1.0;
  if (isSoleRepresentative && isTraditionalCountry) {
    marketingBonusCashM = 3.5;
  } else if (isSoleRepresentative) {
    marketingBonusCashM = 2.5;
  } else if (isTraditionalCountry || calcMarketability >= 85) {
    marketingBonusCashM = 2.0;
  } else if (calcMarketability >= 70) {
    marketingBonusCashM = 1.2;
  } else {
    marketingBonusCashM = 0.5;
  }

  const bonusText = `+$${marketingBonusCashM.toFixed(1)}M/ano (Atrai patrocinadores: ${nat})`;

  return {
    marketabilityTier,
    effectiveMarketability: calcMarketability,
    isSoleRepresentative,
    isTraditionalCountry,
    marketingBonusCashM,
    bonusText
  };
};

export const getDriverTechnicalAttributes = (d: Driver): AttributeBarItem[] => {
  const a = d.attributes;
  const accuracy = a.accuracy ?? clampAttr(a.braking * 0.45 + a.cornering * 0.35 + a.consistency * 0.20);
  const control = a.control ?? a.composure;
  const racecraft = a.racecraft ?? clampAttr(a.overtaking * 0.40 + a.defending * 0.35 + a.tireManagement * 0.25);
  const adaptability = a.adaptability ?? clampAttr(a.wetWeather * 0.55 + a.tireManagement * 0.45);

  return [
    { key: 'pace', label: 'Ritmo', value: a.pace, category: 'Velocidade Pura' },
    { key: 'cornering', label: 'Curvas', value: a.cornering, category: 'Velocidade Pura' },
    { key: 'braking', label: 'Frenagem', value: a.braking, category: 'Velocidade Pura' },
    { key: 'reactionTime', label: 'Reações', value: a.reactionTime, category: 'Reflexo & Precisão' },
    { key: 'consistency', label: 'Consistência', value: a.consistency, category: 'Regularidade' },
    { key: 'accuracy', label: 'Precisão', value: accuracy, category: 'Reflexo & Precisão' },
    { key: 'control', label: 'Controle', value: control, category: 'Regularidade' },
    { key: 'smoothness', label: 'Suavidade', value: a.smoothness, category: 'Regularidade' },
    { key: 'racecraft', label: 'Habilidade de Corrida', value: racecraft, category: 'Combate em Pista' },
    { key: 'overtaking', label: 'Ultrapassagem', value: a.overtaking, category: 'Combate em Pista' },
    { key: 'defending', label: 'Defesa', value: a.defending, category: 'Combate em Pista' },
    { key: 'adaptability', label: 'Adaptabilidade', value: adaptability, category: 'Condições Mistas' }
  ];
};

export interface DriverPotentialInfo {
  tier: 'Elite' | 'Alto' | 'Médio';
  isElite: boolean;
  numericPotential: number;
  summary: string;
}

export const getDriverPotentialProfile = (d: Driver): DriverPotentialInfo => {
  const pot = d.potential ?? (d.ovr || d.attributes.pace);
  if (pot >= 90) {
    return {
      tier: 'Elite',
      isElite: true,
      numericPotential: pot,
      summary: 'Teto geracional (Potencial de Campeão Mundial com alta taxa de evolução).'
    };
  }
  if (pot >= 80) {
    return {
      tier: 'Alto',
      isElite: false,
      numericPotential: pot,
      summary: 'Forte margem de evolução técnica em ritmo de corrida e classificação.'
    };
  }
  return {
    tier: 'Médio',
    isElite: false,
    numericPotential: pot,
    summary: 'Desenvolvimento estabilizado com foco em regularidade e execução tática.'
  };
};

export interface StaffFullProfile {
  roleLabel: string;
  age: number;
  designDna: string;
  designDnaSummary: string;
  staffPhilosophyTag: string;
  preferredCarPhilosophy: CarPhilosophy;
  philosophyImpactSummary: string;
  pillarAttributes: AttributeBarItem[];
  attributes: AttributeBarItem[];
  rawAttributes: StaffAttributes;
}

export const getStaffRolePtBr = (role: StaffMember['role']): string => {
  switch (role) {
    case 'head_aero':
      return 'Chefe de Aerodinâmica';
    case 'head_pu':
      return 'Chefe de Unidade de Potência';
    case 'sporting_director':
      return 'Chefe de Gerenciamento';
    case 'chief_mechanic':
      return 'Chefe de Mecânicos';
    case 'race_engineer':
      return 'Engenheiro de Corrida (Rádio)';
    case 'tech_director':
      return 'Diretor Técnico';
    case 'chief_engineer':
      return 'Engenheiro Chefe';
    default:
      return 'Corpo Técnico';
  }
};

const deriveStaffDesignDna = (s: StaffMember): { tag: string; summary: string } => {
  if (s.designDna) {
    return { tag: s.designDna, summary: s.specialty };
  }
  const spec = `${s.specialty} ${s.teamOrigin}`.toLowerCase();

  if (s.role === 'head_aero') {
    if (spec.includes('assoalho') || spec.includes('efeito solo') || spec.includes('venturi') || spec.includes('difusor')) {
      return {
        tag: 'Especialista em Assoalho',
        summary: 'Maximiza o ganho de carga via canais Venturi e vedação de vórtices sob o chassi.'
      };
    }
    if (spec.includes('arrasto') || spec.includes('sidepod') || spec.includes('transônico') || spec.includes('estreitos')) {
      return {
        tag: 'Baixo Arrasto',
        summary: 'Prioriza eficiência aerodinâmica (L/D) e empacotamento esguio de carenagem.'
      };
    }
    if (spec.includes('asas') || spec.includes('endplates') || spec.includes('modo x') || spec.includes('pressão')) {
      return {
        tag: 'Asas Ativas & Carga Frontal',
        summary: 'Foco em transição limpa de Modo X/Z e equilíbrio de downforce no eixo dianteiro.'
      };
    }
    return {
      tag: 'Correlação CFD & Túnel',
      summary: 'Reduz a discrepância entre malhas computacionais e telemetria real de pista.'
    };
  }

  if (s.role === 'head_pu') {
    if (spec.includes('térmica') || spec.includes('radiador') || spec.includes('dissipação') || spec.includes('combustão')) {
      return {
        tag: 'Gerenciamento Térmico',
        summary: 'Controla temperaturas de óleo, câmara e inversores para evitar derating em corrida.'
      };
    }
    if (spec.includes('bateria') || spec.includes('ers') || spec.includes('e-fuel') || spec.includes('elétrica') || spec.includes('inversor')) {
      return {
        tag: 'Eficiência Híbrida 350kW',
        summary: 'Otimiza regeneração MGU-K, densidade energética e entrega linear sem clipping.'
      };
    }
    return {
      tag: 'Arquitetura ICE & Turbo',
      summary: 'Especialista em resposta de turbocompressor, torque mecânico e durabilidade de bloco.'
    };
  }

  if (s.role === 'sporting_director') {
    if (spec.includes('pit') || spec.includes('parada') || spec.includes('box') || spec.includes('roda')) {
      return {
        tag: 'Operações de Pit & Box',
        summary: 'Minimiza tempo estacionário nos boxes e risco de erros operacionais sob pressão.'
      };
    }
    if (spec.includes('fia') || spec.includes('compliance') || spec.includes('boletins') || spec.includes('vistoria') || spec.includes('parque')) {
      return {
        tag: 'Regulamento & Estratégia FIA',
        summary: 'Domina brechas regulamentares, parque fechado e gestão tática de bandeiras.'
      };
    }
    return {
      tag: 'Gestão Tática de Paddock',
      summary: 'Coordena estratégia em tempo real, leitura de Safety Car e moral de garagem.'
    };
  }

  if (s.role === 'race_engineer') {
    if (spec.includes('rádio') || spec.includes('emocional') || spec.includes('calma')) {
      return {
        tag: 'Comunicação & Frieza',
        summary: 'Filtra ruído no rádio e mantém o piloto na janela psicológica ideal em disputas.'
      };
    }
    if (spec.includes('telemetria') || spec.includes('pneus') || spec.includes('graining') || spec.includes('degradação')) {
      return {
        tag: 'Telemetria & Pneus',
        summary: 'Traduz comportamento de slip e temperatura de borracha em ajustes rápidos de setup.'
      };
    }
    return {
      tag: 'Setup & Estratégia de Box',
      summary: 'Calibra balanço aerodinâmico e mapa ERS entre treinos livres e corrida.'
    };
  }

  return {
    tag: 'Precisão de Garagem & Montagem',
    summary: 'Acelera trocas de componentes críticos, inspeções estruturais e coreografia de pit crew.'
  };
};

const deriveStaffPhilosophy = (
  s: StaffMember
): { tag: string; preferred: CarPhilosophy; impactSummary: string } => {
  if (s.staffPhilosophyTag && s.preferredCarPhilosophy) {
    const tagUpper = s.staffPhilosophyTag.toUpperCase();
    const impact =
      tagUpper === 'INOVADOR'
        ? 'Gasta +12% em projetos agressivos de P&D, mas desbloqueia +5% de downforce em novos pacotes.'
        : tagUpper === 'CONSERVADOR'
        ? 'Reduz custos de desenvolvimento e produz um carro mais previsível e confiável.'
        : 'Alinhado diretamente com a arquitetura alvo da equipe para reduzir retrabalho em CFD.';
    return { tag: tagUpper, preferred: s.preferredCarPhilosophy, impactSummary: impact };
  }

  const spec = `${s.specialty} ${s.teamOrigin} ${s.name}`.toLowerCase();

  if (s.role === 'head_aero') {
    if (spec.includes('arrasto') || spec.includes('sidepod') || spec.includes('transônico') || spec.includes('estreitos')) {
      return {
        tag: 'LOW DRAG',
        preferred: 'low_drag',
        impactSummary: 'Foca em baixa resistência ao avanço e alta velocidade de reta; perde eficiência se forçado a operar pacotes pesados.'
      };
    }
    if (spec.includes('assoalho') || spec.includes('venturi') || spec.includes('difusor') || spec.includes('asas flexíveis')) {
      return {
        tag: 'HIGH DOWNFORCE',
        preferred: 'high_downforce',
        impactSummary: 'Busca carga aerodinâmica máxima em curvas (INOVADOR); gasta mais recursos, mas desbloqueia +5% de downforce.'
      };
    }
    if (spec.includes('suspensão') || spec.includes('antiafundamento') || spec.includes('mecânica') || spec.includes('compostas')) {
      return {
        tag: 'MECHANICAL GRIP',
        preferred: 'mechanical_grip',
        impactSummary: 'Prioriza plataforma mecânica estável e aderência em curvas lentas; entra em conflito severo com conceitos Low Drag extremos.'
      };
    }
    if (spec.includes('acústica') || spec.includes('simplificada') || spec.includes('gabarito') || spec.includes('básica')) {
      return {
        tag: 'CONSERVADOR',
        preferred: 'stable_platform',
        impactSummary: 'Gasta menos orçamento e gera um carro previsível e fácil de acertar, com menor teto de pico aerodinâmico.'
      };
    }
    return {
      tag: 'AERO EFFICIENCY',
      preferred: 'aero_efficiency',
      impactSummary: 'Equilibra relação L/D (Downforce/Arrasto) com boa versatilidade entre circuitos de alta e baixa velocidade.'
    };
  }

  if (s.role === 'head_pu') {
    if (spec.includes('térmica') || spec.includes('radiador') || spec.includes('durabilidade') || spec.includes('óleo')) {
      return {
        tag: 'CONSERVADOR',
        preferred: 'stable_platform',
        impactSummary: 'Prioriza margem térmica e confiabilidade mecânica de 8 corridas por motor, evitando quebras por superaquecimento.'
      };
    }
    if (spec.includes('turbo') || spec.includes('alto giro') || spec.includes('inversores') || spec.includes('combustão')) {
      return {
        tag: 'INOVADOR',
        preferred: 'high_downforce',
        impactSummary: 'Extrai potência máxima e compactação agressiva do pacote traseiro (+5% potencial), exigindo refrigeração bem planejada.'
      };
    }
    return {
      tag: 'EFICIÊNCIA HÍBRIDA',
      preferred: 'aero_efficiency',
      impactSummary: 'Otimiza sinergia ICE + ERS 350kW com menor necessidade de aberturas de radiador.'
    };
  }

  if (s.role === 'sporting_director') {
    if (spec.includes('pit-stop') || spec.includes('ágil') || spec.includes('crise')) {
      return {
        tag: 'INOVADOR',
        preferred: 'balanced_adaptive',
        impactSummary: 'Aposta em operações arrojadas de pit lane e leitura agressiva de Safety Car e undercuts.'
      };
    }
    return {
      tag: 'CONSERVADOR',
      preferred: 'stable_platform',
      impactSummary: 'Protege o moral da equipe sob pressão, reduz falhas de box e garante execução limpa de regulamento.'
    };
  }

  return {
    tag: 'EQUILIBRADO',
    preferred: 'balanced_adaptive',
    impactSummary: 'Mantém estabilidade operacional e consistência na transição entre fábrica e pista.'
  };
};

export const getStaffFullProfile = (s: StaffMember): StaffFullProfile => {
  const h = hashId(s.id);
  const roleLabel = getStaffRolePtBr(s.role);
  const dna = deriveStaffDesignDna(s);
  const phil = deriveStaffPhilosophy(s);

  const defaultAge = s.isFictional
    ? 31 + (h % 19)
    : s.rating >= 94
    ? 52 + (h % 14)
    : 42 + (h % 15);
  const age = s.age ?? defaultAge;

  const base = s.rating;
  const ment = s.mentality ?? base;

  // Deterministic specialty offsets so elite staff shine (>90) and budget staff show clear trade-offs (<60)
  const roleBias =
    s.role === 'head_aero'
      ? { tec: 3, cri: 4, rig: 1, lid: -2, com: -4, prz: -5, adp: -2 }
      : s.role === 'head_pu'
      ? { tec: 4, cri: 0, rig: 4, lid: -1, com: -3, prz: -4, adp: -3 }
      : s.role === 'sporting_director'
      ? { tec: -2, cri: -1, rig: 2, lid: 4, com: 5, prz: 3, adp: 2 }
      : s.role === 'race_engineer'
      ? { tec: 2, cri: -1, rig: 3, lid: 1, com: 6, prz: 2, adp: 4 }
      : { tec: 2, cri: -4, rig: 3, lid: 3, com: 2, prz: 4, adp: 1 };

  const jitter = (shift: number) => ((h >> shift) % 7) - 3; // -3 to +3
  const lowRatingPenalty = base <= 68 ? -6 : base <= 74 ? -3 : 0;

  const raw: StaffAttributes = s.attributes ?? {
    tecnica: clampAttr(base + roleBias.tec + jitter(0)),
    criatividade: clampAttr(base + roleBias.cri + jitter(1) + (lowRatingPenalty < 0 ? lowRatingPenalty + 1 : 0)),
    rigorValidacao: clampAttr((base * 0.7 + ment * 0.3) + roleBias.rig + jitter(2)),
    lideranca: clampAttr((base * 0.55 + ment * 0.45) + roleBias.lid + jitter(3) + lowRatingPenalty),
    comunicacao: clampAttr((base * 0.5 + ment * 0.5) + roleBias.com + jitter(4) + lowRatingPenalty),
    gestaoPrazo: clampAttr(base + roleBias.prz + jitter(5) + lowRatingPenalty),
    adaptacao: clampAttr((base * 0.65 + ment * 0.35) + roleBias.adp + jitter(2) + (base <= 66 ? -5 : 0))
  };

  const attributes: AttributeBarItem[] = [
    { key: 'tecnica', label: 'Técnica', value: raw.tecnica },
    { key: 'criatividade', label: 'Criatividade', value: raw.criatividade },
    { key: 'rigorValidacao', label: 'Rigor/Validação', value: raw.rigorValidacao },
    { key: 'lideranca', label: 'Liderança', value: raw.lideranca },
    { key: 'comunicacao', label: 'Comunicação', value: raw.comunicacao },
    { key: 'gestaoPrazo', label: 'Gestão de Prazo', value: raw.gestaoPrazo },
    { key: 'adaptacao', label: 'Adaptação', value: raw.adaptacao }
  ];

  // Role-specific 3-pillar spotlight attributes requested for Phase 3 & Phase 6
  let pillarAttributes: AttributeBarItem[];
  if (s.role === 'head_aero') {
    pillarAttributes = [
      { key: 'cfd_concept', label: 'Criação de Conceito (CFD)', value: clampAttr(raw.criatividade * 0.6 + raw.tecnica * 0.4) },
      { key: 'wind_tunnel', label: 'Eficiência de Túnel de Vento', value: clampAttr(raw.rigorValidacao * 0.65 + raw.tecnica * 0.35) },
      { key: 'leadership', label: 'Liderança', value: raw.lideranca }
    ];
  } else if (s.role === 'head_pu') {
    pillarAttributes = [
      { key: 'mech_integration', label: 'Integração Mecânica', value: clampAttr(raw.tecnica * 0.65 + raw.adaptacao * 0.35) },
      { key: 'thermal_mgmt', label: 'Gestão Térmica', value: clampAttr(raw.tecnica * 0.5 + raw.rigorValidacao * 0.5) },
      { key: 'reliability', label: 'Confiabilidade', value: clampAttr(raw.rigorValidacao * 0.6 + raw.gestaoPrazo * 0.4) }
    ];
  } else if (s.role === 'sporting_director') {
    pillarAttributes = [
      { key: 'stress_morale', label: 'Gestão de Stress (Moral)', value: clampAttr(raw.lideranca * 0.55 + raw.comunicacao * 0.45) },
      { key: 'logistics', label: 'Logística', value: clampAttr(raw.gestaoPrazo * 0.65 + raw.adaptacao * 0.35) },
      { key: 'pit_training', label: 'Pit Stop Training', value: clampAttr(raw.rigorValidacao * 0.5 + raw.lideranca * 0.5) }
    ];
  } else if (s.role === 'race_engineer') {
    pillarAttributes = [
      { key: 'radio_comm', label: 'Comunicação via Rádio', value: clampAttr(raw.comunicacao * 0.7 + raw.lideranca * 0.3) },
      { key: 'setup_cal', label: 'Calibração de Setup', value: clampAttr(raw.tecnica * 0.55 + raw.rigorValidacao * 0.45) },
      { key: 'telemetry_crisis', label: 'Telemetria & Crise', value: clampAttr(raw.adaptacao * 0.55 + raw.rigorValidacao * 0.45) }
    ];
  } else {
    pillarAttributes = [
      { key: 'garage_prec', label: 'Precisão de Garagem', value: raw.rigorValidacao },
      { key: 'assembly_speed', label: 'Agilidade de Montagem', value: raw.gestaoPrazo },
      { key: 'crew_leadership', label: 'Liderança de Box', value: raw.lideranca }
    ];
  }

  return {
    roleLabel,
    age,
    designDna: dna.tag,
    designDnaSummary: dna.summary,
    staffPhilosophyTag: phil.tag,
    preferredCarPhilosophy: phil.preferred,
    philosophyImpactSummary: phil.impactSummary,
    pillarAttributes,
    attributes,
    rawAttributes: raw
  };
};

// ============================================================================
// FASE 3: APOSTA DO CONSELHO, INTERESSE DE STAFF, CONFLITO DE FILOSOFIA & FASE 6
// ============================================================================
import type { CarPhilosophy, ProjectAmbitionId } from '../types/f1';
import type { HQOption } from '../data/headquartersData';
import type { VehiclePhilosophyCode } from '../engine/modules/m02Philosophy';

export interface ProjectAmbitionSpec {
  id: ProjectAmbitionId;
  title: string;
  subtitle: string;
  budgetUsd: number;
  budgetLabel: string;
  facilityLevelLabel: string;
  aeroFacilityLevel: number;
  factoryFacilityLevel: number;
  initialWearPct: number; // conservation pct (e.g., 98 normal, 74 higher wear)
  boardTargetPosition: number;
  boardExpectationText: string;
  pressureLevel: 'high' | 'medium' | 'low';
  pressureLabel: string;
  consequenceText: string;
  staffInterestBonusPct: number;
}

export const PROJECT_AMBITION_OPTIONS: Record<ProjectAmbitionId, ProjectAmbitionSpec> = {
  bold: {
    id: 'bold',
    title: 'Opção A — Projeto Arrojado (Start Estrondoso)',
    subtitle: 'Aposta Midiática e Infraestrutura Avançada',
    budgetUsd: 140000000,
    budgetLabel: '$140M',
    facilityLevelLabel: 'Nível 2 (Aero e Fábrica)',
    aeroFacilityLevel: 2,
    factoryFacilityLevel: 2,
    initialWearPct: 98,
    boardTargetPosition: 6,
    boardExpectationText: 'Terminar em 6º no Mundial de Construtores',
    pressureLevel: 'high',
    pressureLabel: 'Altíssima',
    consequenceText: 'Se terminar em 10º, o moral da equipe despenca e patrocinadores cancelam bônus.',
    staffInterestBonusPct: 16
  },
  balanced: {
    id: 'balanced',
    title: 'Opção B — Projeto Equilibrado (Moderado)',
    subtitle: 'Crescimento Estruturado no Meio do Pelotão',
    budgetUsd: 110000000,
    budgetLabel: '$110M',
    facilityLevelLabel: 'Nível 1 (Padrão)',
    aeroFacilityLevel: 1,
    factoryFacilityLevel: 1,
    initialWearPct: 95,
    boardTargetPosition: 8,
    boardExpectationText: 'Terminar entre os 8 primeiros (Top 8)',
    pressureLevel: 'medium',
    pressureLabel: 'Média',
    consequenceText: 'Margem saudável para errar e aprender sem crise imediata com o Conselho.',
    staffInterestBonusPct: 5
  },
  grounded: {
    id: 'grounded',
    title: 'Opção C — Projeto Pé no Chão (Conservador)',
    subtitle: 'Sobrevivência Enxuta e Foco no Longo Prazo',
    budgetUsd: 80000000,
    budgetLabel: '$80M',
    facilityLevelLabel: 'Nível 1 (com desgaste maior)',
    aeroFacilityLevel: 1,
    factoryFacilityLevel: 1,
    initialWearPct: 74,
    boardTargetPosition: 9,
    boardExpectationText: 'Bater a equipe rival mais fraca (P9 ou P10)',
    pressureLevel: 'low',
    pressureLabel: 'Baixa',
    consequenceText: 'Quase impossível ser demitido no Ano 1, mas faltará caixa para grandes contratações.',
    staffInterestBonusPct: -8
  }
};

export interface StaffInterestEvaluation {
  interestPct: number;
  status: 'interested' | 'negotiable' | 'blocked';
  statusLabel: string;
  reason: string;
  requiredSalaryUsd: number;
}

export const calculateStaffInterest = (params: {
  staff: StaffMember;
  projectAmbition: ProjectAmbitionId;
  hqOption?: HQOption;
  isRealTeam?: boolean;
  realTeamReputation?: number;
  salaryOfferMultiplier?: number;
}): StaffInterestEvaluation => {
  const {
    staff,
    projectAmbition,
    hqOption,
    isRealTeam = false,
    realTeamReputation = 75,
    salaryOfferMultiplier = 1.0
  } = params;

  const ambitionSpec = PROJECT_AMBITION_OPTIONS[projectAmbition];
  const facilityLevel = isRealTeam ? 3 : ambitionSpec.aeroFacilityLevel;
  const hqAppeal = hqOption?.modifiers.europeanStaffAppeal ?? 0;
  const topTierDifficultyPenalty = hqOption?.modifiers.topTierStaffDifficulty ? -8 : 0;

  let baseInterest = 85;
  if (staff.rating >= 92) {
    baseInterest = isRealTeam && realTeamReputation >= 85 ? 78 : 16;
  } else if (staff.rating >= 87) {
    baseInterest = isRealTeam && realTeamReputation >= 78 ? 80 : 32;
  } else if (staff.rating >= 80) {
    baseInterest = 52;
  } else if (staff.rating >= 72) {
    baseInterest = 74;
  } else {
    baseInterest = 88;
  }

  // Facility & Project Budget modifier
  const projectBonus = isRealTeam ? 12 : ambitionSpec.staffInterestBonusPct;
  // European staff care more about HQ location when OVR >= 70
  const locationFactor = staff.isFictional ? Math.round(hqAppeal * 0.45) : hqAppeal;
  // Salary boost (e.g. 1.3x -> +12%)
  const salaryBonus = Math.round((salaryOfferMultiplier - 1.0) * 40);

  const rawInterest = baseInterest + projectBonus + locationFactor + topTierDifficultyPenalty + salaryBonus;
  const interestPct = Math.max(5, Math.min(99, Math.round(rawInterest)));

  // Elite OVR >= 90 strictly refuses Level 1/2 custom teams unless extraordinary real top team
  const isEliteLockedOut = !isRealTeam && staff.rating >= 90 && facilityLevel < 3;

  if (isEliteLockedOut || interestPct < 35) {
    const reqSalaryM = ((staff.salary * 1.35) / 1000000).toFixed(1);
    return {
      interestPct: Math.min(interestPct, isEliteLockedOut ? Math.min(34, interestPct) : 34),
      status: 'blocked',
      statusLabel: 'Sem Interesse',
      reason:
        staff.rating >= 90
          ? `Requer equipe de Nível 3+ ou projeto consolidado de ponta (Atual: Nível ${facilityLevel}).`
          : hqAppeal < 0
          ? `Relutante em se mudar para ${hqOption?.name || 'sede fora da Europa'} com o orçamento atual.`
          : `Exige orçamento de Aero maior e salário mínimo de $${reqSalaryM}M para abrir conversa.`,
      requiredSalaryUsd: Math.round(staff.salary * 1.35)
    };
  }

  if (interestPct < 65) {
    const premiumSalary = Math.round(staff.salary * 1.25);
    return {
      interestPct,
      status: 'negotiable',
      statusLabel: 'Negociável (+25% Salário)',
      reason:
        hqAppeal < 0
          ? `Interesse moderado: pede prêmio salarial para realocação fora do eixo europeu (${hqOption?.country}).`
          : `Quer ver comprometimento financeiro (+25% de salário: $${(premiumSalary / 1000000).toFixed(1)}M/ano) para assinar.`,
      requiredSalaryUsd: premiumSalary
    };
  }

  return {
    interestPct,
    status: 'interested',
    statusLabel: 'Interessado',
    reason:
      hqAppeal >= 10
        ? `Atraído pelo polo técnico em ${hqOption?.name || 'Europa'} e pelo projeto esportivo.`
        : `Alinhado com a proposta da equipe e pronto para assinar contrato imediato.`,
    requiredSalaryUsd: staff.salary
  };
};

export interface PhilosophyConflictReport {
  hasConflict: boolean;
  efficiencyDeltaPct: number; // e.g., -15, -10, 0, +6
  warnings: string[];
  bonuses: string[];
  lockedSidepodConcepts: Array<'zeropod' | 'downwash' | 'conventional'>;
  packagingConstraintReason: string | null;
}

export const evaluateStaffPhilosophyConflict = (params: {
  philosophyCode: VehiclePhilosophyCode;
  headAero?: StaffMember | null;
  headPu?: StaffMember | null;
  engineOrigin: 'customer' | 'bought_factory' | 'phoenix';
  customerSupplier: string;
  thirdPartyErsSupplier?: string | null;
}): PhilosophyConflictReport => {
  const { philosophyCode, headAero, headPu, engineOrigin, customerSupplier, thirdPartyErsSupplier } = params;
  const warnings: string[] = [];
  const bonuses: string[] = [];
  let efficiencyDeltaPct = 0;

  if (headAero) {
    const aeroProfile = getStaffFullProfile(headAero);
    const pref = aeroProfile.preferredCarPhilosophy;

    const isSevereConflict =
      (philosophyCode === 'low_drag' && (pref === 'mechanical_grip' || pref === 'high_downforce')) ||
      (philosophyCode === 'high_downforce' && pref === 'low_drag') ||
      (philosophyCode === 'mechanical_grip' && pref === 'low_drag');

    if (isSevereConflict) {
      efficiencyDeltaPct -= 15;
      warnings.push(
        `⚠️ Conflito de Filosofia: O seu Chefe de Aero (${headAero.name} · ${aeroProfile.staffPhilosophyTag}) terá -15% de eficiência ao projetar este carro.`
      );
    } else if (pref === philosophyCode) {
      efficiencyDeltaPct += 8;
      bonuses.push(
        `✓ Sinergia Total de Aero: ${headAero.name} (${aeroProfile.staffPhilosophyTag}) domina esta arquitetura (+8% eficiência de projeto).`
      );
    } else if (aeroProfile.staffPhilosophyTag === 'INOVADOR') {
      efficiencyDeltaPct += 5;
      bonuses.push(
        `⚡ DNA Inovador (${headAero.name}): Desbloqueia +5% de downforce potencial em pacotes agressivos (+custo de P&D).`
      );
    } else if (aeroProfile.staffPhilosophyTag === 'CONSERVADOR') {
      bonuses.push(
        `🛡️ DNA Conservador (${headAero.name}): Reduz risco de erro de correlação e garante plataforma previsível.`
      );
    }
  }

  if (headPu) {
    const puProfile = getStaffFullProfile(headPu);
    if (philosophyCode === 'low_drag' && puProfile.staffPhilosophyTag === 'CONSERVADOR') {
      bonuses.push(
        `✓ Chefe de PU (${headPu.name}): Aprova o conceito desde que a abertura térmica mínima dos radiadores seja respeitada.`
      );
    } else if (philosophyCode === 'high_downforce' && puProfile.staffPhilosophyTag === 'INOVADOR') {
      efficiencyDeltaPct += 2;
      bonuses.push(
        `✓ Chefe de PU (${headPu.name}): Aceita empacotamento traseiro mais apertado para alimentar o difusor (+2% eficiência).`
      );
    }
  }

  const lockedSidepodConcepts: Array<'zeropod' | 'downwash' | 'conventional'> = [];
  let packagingConstraintReason: string | null = null;

  if (engineOrigin === 'customer' && customerSupplier === 'Mercedes') {
    lockedSidepodConcepts.push('zeropod');
    packagingConstraintReason =
      'Empacotamento Travado pela PU Mercedes Cliente: O volume de radiadores exigido pelo pacote M17 bloqueia conceitos de chassi estreito/Zero-Pod na Fase 7.';
    if (philosophyCode === 'low_drag' || philosophyCode === 'aero_efficiency') {
      warnings.push(
        '🔒 Restrição de Packaging (Motor Mercedes): O motor cliente exige sidepods médios/amplos, limitando o conceito estreito extremo (Zero-Pod bloqueado).'
      );
    }
  } else if (thirdPartyErsSupplier === 'Ferrari') {
    lockedSidepodConcepts.push('zeropod');
    packagingConstraintReason =
      'Empacotamento Travado pelo ERS Ferrari: Dissipação térmica exige admissão mínima de 395 cm² (Zero-Pod bloqueado).';
  }

  return {
    hasConflict: warnings.length > 0,
    efficiencyDeltaPct,
    warnings,
    bonuses,
    lockedSidepodConcepts,
    packagingConstraintReason
  };
};

export interface DriverPhilosophyRecommendation {
  title: string;
  summary: string;
  priorityAttrs: string[];
}

export const getRecommendedDriverTraitsForPhilosophy = (
  philosophyCode: VehiclePhilosophyCode
): DriverPhilosophyRecommendation => {
  switch (philosophyCode) {
    case 'low_drag':
      return {
        title: 'Perfil Recomendado para Carro Low Drag (Arisco em Curvas)',
        summary:
          'Seu carro terá menos carga aerodinâmica nas freadas e curvas rápidas. Priorize pilotos com alto Controle, Frenagem e Precisão para evitar erros.',
        priorityAttrs: ['Controle', 'Frenagem', 'Precisão', 'Reações']
      };
    case 'high_downforce':
      return {
        title: 'Perfil Recomendado para Alta Carga (High Downforce)',
        summary:
          'O carro gruda nas curvas, mas sofre com velocidade final em retas. Busque pilotos agressivos em Ultrapassagem e fortes em Curvas.',
        priorityAttrs: ['Curvas', 'Ultrapassagem', 'Ritmo']
      };
    case 'mechanical_grip':
      return {
        title: 'Perfil Recomendado para Aderência Mecânica',
        summary:
          'Foco em tração e preservação de borracha. Pilotos com alta Suavidade e Habilidade de Corrida multiplicam a vida útil dos pneus.',
        priorityAttrs: ['Suavidade', 'Habilidade de Corrida', 'Consistência']
      };
    case 'stable_platform':
      return {
        title: 'Perfil Recomendado para Plataforma Estável',
        summary:
          'Carro previsível e dócil em ondulações. Ideal para jovens talentos em evolução ou pilotos consistentes que maximizam pontos.',
        priorityAttrs: ['Consistência', 'Feedback Técnico', 'Adaptabilidade']
      };
    case 'aero_efficiency':
      return {
        title: 'Perfil Recomendado para Eficiência Aero (L/D)',
        summary:
          'Exige sensibilidade no ajuste fino de Asas Ativas X/Z. Pilotos com alto Ritmo e Feedback Técnico aceleram o acerto nos treinos.',
        priorityAttrs: ['Ritmo', 'Feedback Técnico', 'Curvas']
      };
    default:
      return {
        title: 'Perfil Recomendado para Conceito Adaptativo',
        summary:
          'Carro versátil para qualquer traçado do calendário. Priorize equilíbrio entre Ritmo, Habilidade de Corrida e Adaptabilidade.',
        priorityAttrs: ['Ritmo', 'Habilidade de Corrida', 'Adaptabilidade']
      };
  }
};
