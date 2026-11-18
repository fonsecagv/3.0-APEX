import { Driver, StaffAttributes, StaffMember } from '../types/f1';
import { Specialization } from '../types/staff';
import { F1_DRIVERS_REAL } from '../data/marketData';
import {
  PRINCIPAL_BACKGROUNDS,
  type PrincipalBackgroundId,
  type PrincipalBackgroundOption
} from '../data/principalBackgroundsData';

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
    case 'head_management':
      return 'Chefe de Gerenciamento';
    case 'chief_mechanic':
    case 'head_mechanics':
      return 'Chefe Mecânico';
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

export const formatSpecializationLabel = (dna: Specialization | string): string => {
  switch (dna) {
    case Specialization.LOW_DRAG:
    case 'LOWDRAG':
      return 'Baixo Arrasto (Low Drag)';
    case Specialization.HIGH_DOWNFORCE:
    case 'HIGHDOWNFORCE':
      return 'Alta Carga (High Downforce)';
    case Specialization.AERO_EFFICIENCY:
    case 'AEROEFFICIENCY':
      return 'Eficiência Aerodinâmica (L/D)';
    case Specialization.MECHANICAL_GRIP:
    case 'MECHANICALGRIP':
      return 'Grip Mecânico & Tração';
    case Specialization.STABLE_PLATFORM:
    case 'STABLEPLATFORM':
      return 'Plataforma Estável';
    case Specialization.BALANCED:
      return 'Equilibrado / Adaptativo';
    case Specialization.CFD_CORRELATION:
    case 'CFDCORRELATION':
      return 'Correlação CFD & Túnel';
    case Specialization.INNOVATOR:
      return 'Inovação & Efeito Solo';
    case Specialization.CONSERVATIVE:
      return 'Conservador & Confiabilidade';
    case Specialization.ICE:
      return 'Arquitetura ICE & Turbo';
    case Specialization.ERS:
      return 'Eficiência Híbrida 350kW';
    case Specialization.RELIABILITY:
      return 'Confiabilidade Mecânica';
    case Specialization.TRANSMISSION_MECHANICS:
    case 'TRANSMISSIONMECHANICS':
      return 'Câmbio & Transmissão';
    case Specialization.CHASSIS_SUSPENSION:
      return 'Chassi & Suspensão';
    case Specialization.BRAKE_SYSTEMS:
      return 'Sistemas de Freio & Dutos';
    case Specialization.BRAKE_BY_WIRE:
      return 'Brake-by-Wire & ERS';
    case Specialization.BRAKE_THERMAL:
      return 'Gestão Térmica de Freios';
    case Specialization.MOTIVATOR:
      return 'Liderança & Motivação';
    case Specialization.POLITICIAN:
      return 'Relações FIA & Paddock';
    case Specialization.CRISIS_MANAGER:
    case 'CRISISMANAGER':
      return 'Gestão de Crise & Pressão';
    case Specialization.PUBLIC_RELATIONS:
    case 'PUBLICRELATIONS':
      return 'Comunicação & Imprensa';
    case Specialization.FINANCIAL:
      return 'Gestão de Teto Orçamentário';
    case Specialization.RACE_STRATEGY:
      return 'Estratégia de Corrida';
    case Specialization.PIT_STOP_MASTER:
      return 'Operações de Pit Stop';
    case Specialization.MOUNTING_ENGINEER:
      return 'Montagem & Dinâmica';
    case Specialization.DIAGNOSTICS:
      return 'Diagnóstico Rápido';
    default: {
      const s = String(dna).replace(/_/g, ' ');
      return s.length > 3 ? s : `Especialista (${s})`;
    }
  }
};

export const getSpecializationSummary = (dna: Specialization | string, s: StaffMember): string => {
  switch (dna) {
    case Specialization.LOW_DRAG:
    case 'LOWDRAG':
      return 'Foca em baixa resistência ao avanço e velocidade final máxima de reta; perde eficiência se forçado a operar pacotes pesados.';
    case Specialization.HIGH_DOWNFORCE:
    case 'HIGHDOWNFORCE':
      return 'Maximiza a pressão aerodinâmica em curvas de média e baixa velocidade; gasta mais recursos, mas desbloqueia +5% de downforce.';
    case Specialization.AERO_EFFICIENCY:
    case 'AEROEFFICIENCY':
      return 'Equilibra relação L/D (Downforce/Arrasto) com versatilidade comprovada entre circuitos de alta e baixa velocidade.';
    case Specialization.MECHANICAL_GRIP:
    case 'MECHANICALGRIP':
      return 'Prioriza absorção de zebras, tração mecânica e estabilidade do eixo dianteiro em curvas lentas.';
    case Specialization.STABLE_PLATFORM:
    case 'STABLEPLATFORM':
      return 'Garante fluxo aerodinâmico constante e previsível sobre o difusor mesmo sob variações de altura de rodagem.';
    case Specialization.BALANCED:
      return 'Arquitetura equilibrada e neutra com excelente margem para atualizações contínuas ao longo da temporada.';
    case Specialization.CFD_CORRELATION:
    case 'CFDCORRELATION':
      return 'Reduz discrepâncias entre modelos de fluidos computacionais (CFD) e telemetria de pista, acelerando pacotes.';
    case Specialization.INNOVATOR:
      return 'Gasta +12% em projetos agressivos de P&D, mas desbloqueia +5% de downforce em novos pacotes aerodinâmicos.';
    case Specialization.CONSERVATIVE:
      return 'Reduz custos de desenvolvimento e produz um carro mais previsível e confiável na pista.';
    case Specialization.ICE:
      return 'Extrai potência máxima e empacotamento agressivo do motor a combustão e turbocompressor (+5% potencial).';
    case Specialization.ERS:
      return 'Otimiza regeneração MGU-K de 350kW e entrega linear de energia sem clipping nas retas.';
    case Specialization.RELIABILITY:
      return 'Prioriza margem térmica e confiabilidade mecânica de 8 corridas por motor, evitando quebras por superaquecimento.';
    case Specialization.TRANSMISSION_MECHANICS:
    case 'TRANSMISSIONMECHANICS':
      return 'Otimiza trocas de marcha instantâneas e resistência estrutural do conjunto de câmbio e diferencial traseiro.';
    case Specialization.CHASSIS_SUSPENSION:
      return 'Integração perfeita entre rigidez torcional do monocoque e cinemática da geometria de suspensão.';
    case Specialization.BRAKE_SYSTEMS:
      return 'Calibra dutos de refrigeração e discos de carbono para operar na janela térmica ideal de 400°C–600°C.';
    case Specialization.BRAKE_BY_WIRE:
      return 'Otimiza a transição eletrônica entre frenagem regenerativa MGU-K de 350kW e circuito hidráulico traseiro.';
    case Specialization.BRAKE_THERMAL:
      return 'Controle cirúrgico de dissipação de calor nos freios e mantas térmicas, prevenindo flat-spots e travamentos.';
    case Specialization.MOTIVATOR:
      return 'Inspira o time sob pressão extrema e eleva o moral e velocidade de resposta da garagem.';
    case Specialization.POLITICIAN:
      return 'Domina articulação no paddock, brechas de regulamento esportivo e reuniões com a FIA.';
    case Specialization.CRISIS_MANAGER:
    case 'CRISISMANAGER':
      return 'Tomada de decisão cirúrgica durante Safety Cars, bandeiras vermelhas e incidentes na pista.';
    case Specialization.PUBLIC_RELATIONS:
    case 'PUBLICRELATIONS':
      return 'Blindagem institucional da equipe, atração de patrocínios e gestão de crises com a mídia.';
    case Specialization.FINANCIAL:
      return 'Gestão financeira de staff e operações de pista. Mantém o teto salarial rígido sem perder eficiência.';
    case Specialization.RACE_STRATEGY:
      return 'Otimização probabilística de janelas de parada, overcuts e reação tática a rivais em tempo real.';
    case Specialization.PIT_STOP_MASTER:
      return 'Coordenação de pistolas e posicionamento, minimizando tempo estacionário nos boxes.';
    case Specialization.MOUNTING_ENGINEER:
      return 'Montagem precisa e alinhamento milimétrico de suspensão e componentes aerodinâmicos.';
    case Specialization.DIAGNOSTICS:
      return 'Identificação ultrarrápida de anomalias elétricas, hidráulicas e de telemetria na garagem.';
    default:
      return s.specialty || 'Mantém estabilidade operacional e consistência na transição entre fábrica e pista.';
  }
};

const deriveStaffDesignDna = (s: StaffMember): { tag: string; summary: string } => {
  if (s.name === 'Adrian Newey' || s.id === 'staff_newey') {
    return {
      tag: 'Especialista em Assoalho',
      summary: 'Maximiza o ganho de carga via canais Venturi e vedação de vórtices sob o chassi.'
    };
  }
  if (s.id === 'staff_sport_fic_2' || (s.name === 'Colin Stewart' && (s.role === 'head_management' || (s.role as any) === 'sporting_director'))) {
    return {
      tag: 'Gestão de Staff & Orçamento',
      summary: 'Mantém o teto salarial rígido nas contratações e garante eficiência operacional dentro do Cost Cap.'
    };
  }
  if (s.designDna) {
    return {
      tag: formatSpecializationLabel(s.designDna),
      summary: getSpecializationSummary(s.designDna, s)
    };
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
        tag: 'Baixo Arrasto (Low Drag)',
        summary: 'Prioriza eficiência aerodinâmica (L/D) e empacotamento esguio de carenagem.'
      };
    }
    if (spec.includes('asas') || spec.includes('endplates') || spec.includes('modo x') || spec.includes('pressão')) {
      return {
        tag: 'Alta Carga (High Downforce)',
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

  if (s.role === 'sporting_director' || (s.role as any) === 'head_management') {
    if (spec.includes('financeira') || spec.includes('salarial') || spec.includes('orçamento') || spec.includes('custo')) {
      return {
        tag: 'Gestão de Staff & Orçamento',
        summary: 'Mantém o teto salarial rígido nas contratações e garante eficiência operacional dentro do Cost Cap.'
      };
    }
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
  // Colin Stewart test constraint
  if (s.id === 'staff_sport_fic_2' || s.name === 'Colin Stewart') {
    return {
      tag: 'CONSERVADOR',
      preferred: 'stable_platform',
      impactSummary: 'Gestão financeira de staff e operações de pista. Mantém o teto salarial rígido sem perder eficiência.'
    };
  }

  // Head of Aero: Mapeamento direto para as 6 filosofias
  if (s.role === 'head_aero') {
    if (s.designDna === Specialization.LOW_DRAG) {
      return {
        tag: 'LOW DRAG',
        preferred: 'low_drag',
        impactSummary: 'Foca em baixa resistência ao avanço e alta velocidade de reta; perde eficiência se forçado a operar pacotes pesados.'
      };
    }
    if (s.designDna === Specialization.HIGH_DOWNFORCE) {
      return {
        tag: 'HIGH DOWNFORCE',
        preferred: 'high_downforce',
        impactSummary: 'Busca carga aerodinâmica máxima em curvas (INOVADOR); gasta mais recursos, mas desbloqueia +5% de downforce.'
      };
    }
    if (s.designDna === Specialization.AERO_EFFICIENCY || s.designDna === Specialization.CFD_CORRELATION) {
      return {
        tag: 'AERO EFFICIENCY',
        preferred: 'aero_efficiency',
        impactSummary: 'Equilibra relação L/D (Downforce/Arrasto) com boa versatilidade entre circuitos de alta e baixa velocidade.'
      };
    }
    if (s.designDna === Specialization.MECHANICAL_GRIP) {
      return {
        tag: 'MECHANICAL GRIP',
        preferred: 'mechanical_grip',
        impactSummary: 'Prioriza plataforma mecânica estável e aderência em curvas lentas; entra em conflito severo com conceitos Low Drag extremos.'
      };
    }
    if (s.designDna === Specialization.STABLE_PLATFORM) {
      return {
        tag: 'PLATAFORMA ESTÁVEL',
        preferred: 'stable_platform',
        impactSummary: 'Garante fluxo aerodinâmico constante e previsível sobre o difusor mesmo sob variações de altura de rodagem.'
      };
    }
    if (s.designDna === Specialization.BALANCED) {
      return {
        tag: 'EQUILIBRADO',
        preferred: 'balanced_adaptive',
        impactSummary: 'Conceito neutro e adaptável que facilita introduzir atualizações aerodinâmicas sem desequilibrar o carro.'
      };
    }
    if (s.staffPhilosophyTag) {
      const tagUpper = s.staffPhilosophyTag.toUpperCase();
      const pref =
        s.preferredCarPhilosophy ||
        (tagUpper === 'INOVADOR' ? 'high_downforce' : 'aero_efficiency');
      return {
        tag: tagUpper,
        preferred: pref,
        impactSummary: tagUpper === 'INOVADOR'
          ? 'Gasta +12% em projetos agressivos de P&D, mas desbloqueia +5% de downforce em novos pacotes.'
          : 'Alinhado diretamente com a arquitetura alvo da equipe para reduzir retrabalho em CFD.'
      };
    }
  }

  // Head of Power Unit
  if (s.role === 'head_pu') {
    if (s.designDna === Specialization.ICE) {
      return {
        tag: s.staffPhilosophyTag?.toUpperCase() || 'INOVADOR',
        preferred: 'high_downforce',
        impactSummary: 'Extrai potência máxima e compactação agressiva do pacote traseiro (+5% potencial), exigindo refrigeração bem planejada.'
      };
    }
    if (s.designDna === Specialization.ERS || s.designDna === Specialization.BRAKE_BY_WIRE) {
      return {
        tag: s.staffPhilosophyTag?.toUpperCase() || 'EFICIÊNCIA HÍBRIDA',
        preferred: 'aero_efficiency',
        impactSummary: 'Otimiza sinergia ICE + ERS 350kW com menor necessidade de aberturas de radiador.'
      };
    }
    if (s.designDna === Specialization.RELIABILITY || s.designDna === Specialization.BRAKE_SYSTEMS) {
      return {
        tag: s.staffPhilosophyTag?.toUpperCase() || 'CONSERVADOR',
        preferred: 'stable_platform',
        impactSummary: 'Prioriza margem térmica e confiabilidade mecânica de 8 corridas por motor, evitando quebras por superaquecimento.'
      };
    }
  }

  // Head Management
  if (s.role === 'sporting_director' || (s.role as any) === 'head_management') {
    const tagUpper = (s.staffPhilosophyTag || 'ESPECIALISTA').toUpperCase();
    if (tagUpper === 'CONSERVADOR' || s.designDna === Specialization.FINANCIAL) {
      return {
        tag: 'CONSERVADOR',
        preferred: 'stable_platform',
        impactSummary: 'Gestão financeira de staff e operações de pista. Mantém o teto salarial rígido sem perder eficiência.'
      };
    }
    if (tagUpper === 'INOVADOR' || s.designDna === Specialization.MOTIVATOR) {
      return {
        tag: 'INOVADOR',
        preferred: 'balanced_adaptive',
        impactSummary: 'Liderança inspiradora e dinâmica de paddock, acelerando a evolução do time e resposta sob pressão.'
      };
    }
    return {
      tag: 'ESPECIALISTA',
      preferred: 'balanced_adaptive',
      impactSummary: getSpecializationSummary(s.designDna || Specialization.POLITICIAN, s)
    };
  }

  // Head Mechanics
  if (s.role === 'chief_mechanic' || (s.role as any) === 'head_mechanics') {
    const tagUpper = (s.staffPhilosophyTag || 'ESPECIALISTA').toUpperCase();
    if (s.designDna === Specialization.PIT_STOP_MASTER) {
      return {
        tag: tagUpper,
        preferred: 'high_downforce',
        impactSummary: 'Minimiza tempo estacionário nos pit-stops e treina procedimentos rápidos para troca de bico e pneus.'
      };
    }
    if (s.designDna === Specialization.BRAKE_THERMAL) {
      return {
        tag: tagUpper,
        preferred: 'stable_platform',
        impactSummary: 'Controle cirúrgico da janela térmica de freios (400°C–600°C), prevenindo travamento e desgaste de pneus.'
      };
    }
    return {
      tag: tagUpper,
      preferred: 'stable_platform',
      impactSummary: getSpecializationSummary(s.designDna || Specialization.MOUNTING_ENGINEER, s)
    };
  }

  if (s.staffPhilosophyTag) {
    const tagUpper = s.staffPhilosophyTag.toUpperCase();
    const pref =
      s.preferredCarPhilosophy ||
      (tagUpper === 'CONSERVADOR'
        ? 'stable_platform'
        : tagUpper === 'INOVADOR'
        ? 'high_downforce'
        : 'aero_efficiency');
    const impact =
      (s.role === 'sporting_director' || (s.role as any) === 'head_management') && tagUpper === 'CONSERVADOR'
        ? 'Gestão financeira de staff e operações de pista. Mantém o teto salarial rígido sem perder eficiência.'
        : tagUpper === 'INOVADOR'
        ? 'Gasta +12% em projetos agressivos de P&D, mas desbloqueia +5% de downforce em novos pacotes.'
        : tagUpper === 'CONSERVADOR'
        ? 'Reduz custos de desenvolvimento e produz um carro mais previsível e confiável.'
        : getSpecializationSummary(s.designDna || Specialization.BALANCED, s);
    return { tag: tagUpper, preferred: pref, impactSummary: impact };
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
    if (
      (s as any).designDna === 'HighDownforce' ||
      spec.includes('alta carga') ||
      spec.includes('high downforce') ||
      spec.includes('assoalho') ||
      spec.includes('venturi') ||
      spec.includes('difusor') ||
      spec.includes('asas flexíveis')
    ) {
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

  if (s.role === 'sporting_director' || (s.role as any) === 'head_management') {
    if (spec.includes('pit-stop') || spec.includes('ágil') || spec.includes('crise')) {
      return {
        tag: 'INOVADOR',
        preferred: 'balanced_adaptive',
        impactSummary: 'Aposta em operações arrojadas de paddock e leitura agressiva de Safety Car e undercuts.'
      };
    }
    if (spec.includes('financeira') || spec.includes('salarial') || spec.includes('orçamento') || spec.includes('custo')) {
      return {
        tag: 'CONSERVADOR',
        preferred: 'stable_platform',
        impactSummary: 'Gestão financeira de staff e operações de pista. Mantém o teto salarial rígido sem perder eficiência.'
      };
    }
    return {
      tag: 'CONSERVADOR',
      preferred: 'stable_platform',
      impactSummary: 'Protege o moral da equipe sob pressão, mantém disciplina financeira de equipe e garante execução limpa de regulamento.'
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
  } else if (staff.rating >= 90) {
    // 90-91: elite tier — blocked by isEliteLockedOut check below anyway for custom teams
    baseInterest = isRealTeam && realTeamReputation >= 78 ? 80 : 28;
  } else if (staff.rating >= 83) {
    // 83-89: high-tier F1 names — interested but demanding salary premium
    baseInterest = isRealTeam ? 72 : 44;
  } else if (staff.rating >= 75) {
    // 75-82: mid-tier (F2/F3 chiefs, strong fictionals) — clearly negotiable
    baseInterest = 58;
  } else if (staff.rating >= 65) {
    // 65-74: promising mid-low (F3, free agents) — interested
    baseInterest = 76;
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
  efficiencyDeltaPct: number; // e.g., -15, -10, 0, +8
  warnings: string[];
  bonuses: string[];
  lockedSidepodConcepts: Array<'zeropod' | 'downwash' | 'conventional'>;
  packagingConstraintReason: string | null;
}

export type CanonicalPrincipalId =
  | 'chief_engineer'
  | 'ex_driver'
  | 'legendary_mechanic'
  | 'financial_magnate'
  | 'data_strategist'
  | 'elite_executive';

export const resolveCanonicalPrincipalId = (
  bgId?: PrincipalBackgroundId | string | null
): CanonicalPrincipalId => {
  switch (bgId) {
    case 'ex_driver':
    case 'pro_driver':
    case 'f1_driver':
    case 'driver':
      return 'ex_driver';
    case 'legendary_mechanic':
      return 'legendary_mechanic';
    case 'financial_magnate':
    case 'financial':
    case 'marketing_shark':
    case 'enthusiast_heir':
      return 'financial_magnate';
    case 'data_strategist':
    case 'born_strategist':
    case 'data_analyst':
      return 'data_strategist';
    case 'elite_executive':
      return 'elite_executive';
    case 'chief_engineer':
    case 'engineer':
    case 'fia_man':
    case 'fia_engineer':
    default:
      return 'chief_engineer';
  }
};

export const getPrincipalBackgroundOption = (
  bg?: PrincipalBackgroundOption | PrincipalBackgroundId | string | null
): PrincipalBackgroundOption => {
  if (bg && typeof bg === 'object' && 'id' in bg) {
    return bg;
  }
  const canonical = resolveCanonicalPrincipalId(typeof bg === 'string' ? bg : null);
  return PRINCIPAL_BACKGROUNDS.find(b => b.id === canonical) || PRINCIPAL_BACKGROUNDS[0];
};

export interface LeadershipStaffInteraction {
  id: string;
  type: 'synergy' | 'conflict' | 'neutral';
  targetRole: 'head_aero' | 'head_pu' | 'sporting_director' | 'all';
  title: string;
  detail: string;
}

export interface CombinedLeadershipDnaReport {
  canonicalPrincipalId: CanonicalPrincipalId;
  principalOption: PrincipalBackgroundOption;
  synergyPct: number;
  synergyStatus: 'high' | 'balanced' | 'tension';
  synergyTone: 'emerald' | 'amber' | 'red';
  combinedHeadline: string;
  narrativeSummary: string;
  principalCard: {
    leadershipTag: string;
    summary: string;
    bonusLine: string;
    onusLine: string;
  };
  vectorAxes: {
    performanceBias: number; // -100 (Confiabilidade) to +100 (Performance Extrema)
    innovationBias: number; // -100 (Conservador) to +100 (Inovador)
    dataPrecisionBias: number; // -100 (Empírico/Pista) to +100 (Dados/Correlação)
  };
  puPowerDeltaPct: number; // e.g., -5 when Elite Executive clashes with Innovator PU Chief
  puRiskMitigated: boolean; // true when Chief Engineer (-35% corr error) stabilizes Innovator PU Chief
  rdEfficiencyOffsetPct: number; // Principal + Leadership vector R&D delta
  boardroomRdPenaltyPct: number; // Negative penalty applied when synergyPct < 50% (stacked in Phase 4)
  interactions: LeadershipStaffInteraction[];
  roleNotes: {
    headAero: string | null;
    headPu: string | null;
    sportingDirector: string | null;
  };
}

export const evaluateCombinedLeadershipDna = (params: {
  principalBackground?: PrincipalBackgroundOption | PrincipalBackgroundId | string | null;
  headAero?: StaffMember | null;
  headPu?: StaffMember | null;
  sportingDirector?: StaffMember | null;
}): CombinedLeadershipDnaReport => {
  const principalOption = getPrincipalBackgroundOption(params.principalBackground);
  const canonicalId = resolveCanonicalPrincipalId(principalOption.id);
  const { headAero, headPu, sportingDirector } = params;

  const aeroProfile = headAero ? getStaffFullProfile(headAero) : null;
  const puProfile = headPu ? getStaffFullProfile(headPu) : null;
  const sportProfile = sportingDirector ? getStaffFullProfile(sportingDirector) : null;

  // 1. Vector Contributions (Player + 3 Chiefs)
  let performanceBias = 0;
  let innovationBias = 0;
  let dataPrecisionBias = 0;

  let principalCard = {
    leadershipTag: 'DADOS & PERFORMANCE',
    summary: 'Sua liderança foca em dados de túnel de vento, CFD e extração máxima de performance.',
    bonusLine: principalOption.bonusShort,
    onusLine: principalOption.onusShort
  };

  if (canonicalId === 'chief_engineer') {
    performanceBias += 30;
    innovationBias += 20;
    dataPrecisionBias += 45;
  } else if (canonicalId === 'legendary_mechanic') {
    performanceBias -= 25;
    innovationBias -= 25;
    dataPrecisionBias += 10;
    principalCard = {
      leadershipTag: 'CONFIABILIDADE & GARAGEM',
      summary: 'Sua liderança blinda a mecânica e o pit stop, priorizando chegar ao fim sem quebras.',
      bonusLine: principalOption.bonusShort,
      onusLine: principalOption.onusShort
    };
  } else if (canonicalId === 'elite_executive') {
    performanceBias -= 10;
    innovationBias -= 35;
    dataPrecisionBias += 15;
    principalCard = {
      leadershipTag: 'RIGOR DE COST CAP & CAIXA',
      summary: 'Sua liderança impõe disciplina financeira e eficiência corporativa sobre cada dólar do Teto de Custos.',
      bonusLine: principalOption.bonusShort,
      onusLine: principalOption.onusShort
    };
  } else if (canonicalId === 'financial_magnate') {
    performanceBias += 25;
    innovationBias += 30;
    dataPrecisionBias -= 5;
    principalCard = {
      leadershipTag: 'CAPITAL & META TOP 6',
      summary: 'Sua liderança injeta $25M extras em caixa e exige resultados esportivos agressivos já no Ano 1.',
      bonusLine: principalOption.bonusShort,
      onusLine: principalOption.onusShort
    };
  } else if (canonicalId === 'ex_driver') {
    performanceBias += 10;
    innovationBias += 5;
    dataPrecisionBias -= 20;
    principalCard = {
      leadershipTag: 'MORAL, PISTA & PADDOCK',
      summary: 'Sua liderança une vestiário, patrocinadores e feedback direto dos pilotos para acelerar a pista.',
      bonusLine: principalOption.bonusShort,
      onusLine: principalOption.onusShort
    };
  } else if (canonicalId === 'data_strategist') {
    performanceBias += 15;
    innovationBias += 10;
    dataPrecisionBias -= 10;
    principalCard = {
      leadershipTag: 'TELEMETRIA, SETUP & PNEUS',
      summary: 'Sua liderança maximiza treinos livres, degradação de pneus e estratégia de domingo.',
      bonusLine: principalOption.bonusShort,
      onusLine: principalOption.onusShort
    };
  }

  // Aero Chief vector contribution
  if (aeroProfile) {
    if (aeroProfile.preferredCarPhilosophy === 'high_downforce' || aeroProfile.preferredCarPhilosophy === 'low_drag') {
      performanceBias += 28;
      innovationBias += 24;
    } else if (aeroProfile.preferredCarPhilosophy === 'aero_efficiency') {
      performanceBias += 16;
      dataPrecisionBias += 18;
    } else if (aeroProfile.preferredCarPhilosophy === 'stable_platform') {
      performanceBias -= 22;
      innovationBias -= 24;
    } else if (aeroProfile.preferredCarPhilosophy === 'mechanical_grip') {
      performanceBias -= 8;
      innovationBias -= 10;
    }
    if (aeroProfile.staffPhilosophyTag === 'INOVADOR') innovationBias += 15;
    if (aeroProfile.staffPhilosophyTag === 'CONSERVADOR') innovationBias -= 15;
  }

  // PU Chief vector contribution
  if (puProfile) {
    if (puProfile.staffPhilosophyTag === 'INOVADOR') {
      performanceBias += 24;
      innovationBias += 28;
    } else if (puProfile.staffPhilosophyTag === 'CONSERVADOR') {
      performanceBias -= 24;
      innovationBias -= 24;
    } else {
      performanceBias += 8;
      dataPrecisionBias += 10;
    }
  }

  // Sporting Director vector contribution
  if (sportProfile) {
    if (sportProfile.staffPhilosophyTag === 'INOVADOR') {
      performanceBias += 10;
      innovationBias += 14;
    } else {
      performanceBias -= 16;
      innovationBias -= 18;
    }
  }

  // 2. Principal <-> Staff Interactions
  const interactions: LeadershipStaffInteraction[] = [];
  const roleNotes: CombinedLeadershipDnaReport['roleNotes'] = {
    headAero: null,
    headPu: null,
    sportingDirector: null
  };
  let synergyPct = 70;
  let puPowerDeltaPct = 0;
  let puRiskMitigated = false;
  let rdEfficiencyOffsetPct = 0;

  const isAeroAggressive =
    Boolean(aeroProfile) &&
    (aeroProfile!.staffPhilosophyTag === 'INOVADOR' ||
      aeroProfile!.preferredCarPhilosophy === 'high_downforce' ||
      aeroProfile!.preferredCarPhilosophy === 'low_drag');
  const isAeroConservative =
    Boolean(aeroProfile) &&
    (aeroProfile!.staffPhilosophyTag === 'CONSERVADOR' ||
      aeroProfile!.preferredCarPhilosophy === 'stable_platform');
  const isPuInnovator = puProfile?.staffPhilosophyTag === 'INOVADOR';
  const isPuConservative = puProfile?.staffPhilosophyTag === 'CONSERVADOR';
  const isSportConservative = sportProfile?.staffPhilosophyTag === 'CONSERVADOR';

  if (canonicalId === 'chief_engineer') {
    if (headPu && isPuInnovator) {
      synergyPct += 12;
      puRiskMitigated = true;
      const detail = `Seu bônus de -35% Erro de Correlação valida a termodinâmica do Chefe de PU Inovador (${headPu.name}), anulando o risco de quebra prematura do motor.`;
      interactions.push({
        id: 'ce_pu_innovator',
        type: 'synergy',
        targetRole: 'head_pu',
        title: 'Mitigação de Risco Térmico (Você × PU)',
        detail
      });
      roleNotes.headPu = 'Risco experimental estabilizado pelo seu -35% Erro de Correlação.';
    } else if (headPu && isPuConservative) {
      if (headAero && isAeroConservative) {
        synergyPct -= 12;
        interactions.push({
          id: 'ce_pu_cons_clash',
          type: 'conflict',
          targetRole: 'head_pu',
          title: 'Subaproveitamento de Performance (Você × PU Conservador)',
          detail: `Seu perfil busca vanguarda técnica, mas ${headPu.name} limita ganhos agressivos de potência em favor de margem térmica conservadora.`
        });
        roleNotes.headPu = 'Conservador demais para o potencial de túnel de vento da sua liderança.';
      } else {
        synergyPct += 4;
        roleNotes.headPu = 'Motor confiável de base; sua precisão técnica extrai eficiência extra sem quebras.';
      }
    }

    if (headAero && isAeroAggressive) {
      synergyPct += 10;
      rdEfficiencyOffsetPct += 4;
      const detail = `Sua visão de Engenheiro Chefe (+10% Eficiência de Túnel de Vento) potencializa o desenvolvimento agressivo de ${headAero.name}.`;
      interactions.push({
        id: 'ce_aero_aggr',
        type: 'synergy',
        targetRole: 'head_aero',
        title: 'Dupla de Túnel & CFD (Você × Aero)',
        detail
      });
      roleNotes.headAero = 'Sinergia direta com seu +10% Eficiência de Túnel de Vento.';
    } else if (headAero && isAeroConservative) {
      const severeConservativeLock = Boolean(headPu && isPuConservative);
      synergyPct -= severeConservativeLock ? 16 : 6;
      const detail = severeConservativeLock
        ? `Choque de Filosofia: Você busca inovação aerodinâmica de ponta (-35% Erro Correlação), mas ${headAero.name} e ${headPu?.name} travam a diretoria em soluções conservadoras.`
        : `Seu perfil técnico busca teto aerodinâmico alto, mas ${headAero.name} adota abordagem conservadora de menor risco.`;
      interactions.push({
        id: 'ce_aero_cons',
        type: severeConservativeLock ? 'conflict' : 'neutral',
        targetRole: 'head_aero',
        title: severeConservativeLock ? 'Conflito: Inovação vs. Conservadorismo (Você × Aero)' : 'Diferença de Ousadia (Você × Aero)',
        detail
      });
      roleNotes.headAero = severeConservativeLock
        ? 'Conflito direto: postura conservadora desperdiça seu bônus de Túnel de Vento.'
        : 'Mais cauteloso que o seu perfil técnico; menos picos de carga.';
    }
  } else if (canonicalId === 'elite_executive') {
    rdEfficiencyOffsetPct -= 10;
    if (headPu && isPuInnovator) {
      synergyPct -= 18;
      puPowerDeltaPct = -5;
      const detail = `Conflito: Seu perfil financeiro (+10% Eficiência no Teto de Custos) corta o orçamento experimental do Chefe de PU Inovador (${headPu.name}), reduzindo a potência dele em -5%.`;
      interactions.push({
        id: 'exec_pu_conflict',
        type: 'conflict',
        targetRole: 'head_pu',
        title: 'Conflito Orçamentário (Você × PU Inovador)',
        detail
      });
      roleNotes.headPu = 'Conflito: seu controle de gastos reduz a potência do PU Inovador em -5%.';
    } else if (headPu && isPuConservative) {
      synergyPct += 8;
      roleNotes.headPu = 'Alinhado: motor conservador evita gastos extras de bancada e retrabalho.';
    }

    if (headAero && isAeroAggressive) {
      synergyPct -= 12;
      const detail = `Atrito Corporativo: ${headAero.name} demanda pacotes caros de CFD/manufatura enquanto sua gestão enxuga custos (-10% Eficiência P&D e -15% Moral).`;
      interactions.push({
        id: 'exec_aero_conflict',
        type: 'conflict',
        targetRole: 'head_aero',
        title: 'Tensão de Orçamento P&D (Você × Aero)',
        detail
      });
      roleNotes.headAero = 'Atrito com seu corte de custos (-10% Eficiência P&D).';
    }

    if (sportingDirector && isSportConservative) {
      synergyPct += 8;
      const detail = `${sportingDirector.name} (${sportProfile?.staffPhilosophyTag}) atua alinhado à sua política de Cost Cap para evitar penalidades e desperdícios.`;
      interactions.push({
        id: 'exec_sport_sync',
        type: 'synergy',
        targetRole: 'sporting_director',
        title: 'Alinhamento de Compliance (Você × Gestão)',
        detail
      });
      roleNotes.sportingDirector = 'Reforça seu rigor financeiro e cumprimento do Teto de Custos.';
    }
  } else if (canonicalId === 'legendary_mechanic') {
    if (headPu && isPuConservative) {
      synergyPct += 12;
      const detail = `Fortaleza Mecânica: Seu +15 Confiabilidade somado ao perfil conservador de ${headPu.name} cria um conjunto virtualmente à prova de abandonos.`;
      interactions.push({
        id: 'mech_pu_cons',
        type: 'synergy',
        targetRole: 'head_pu',
        title: 'Blindagem de Confiabilidade (Você × PU)',
        detail
      });
      roleNotes.headPu = 'Sinergia máxima de durabilidade (+15 Confiabilidade).';
    } else if (headPu && isPuInnovator) {
      synergyPct -= 4;
      roleNotes.headPu = 'Seu +15 Confiabilidade amortece parte do risco de um motor Inovador.';
    }

    if (headAero && isAeroAggressive) {
      synergyPct -= 12;
      const detail = `Atrito Mecânica vs. Aero: Seu foco de oficina (-10% Eficiência Aero) limita a liberdade de embalagens extremas desejadas por ${headAero.name}.`;
      interactions.push({
        id: 'mech_aero_conflict',
        type: 'conflict',
        targetRole: 'head_aero',
        title: 'Tensão Mecânica vs. Aero (Você × Aero)',
        detail
      });
      roleNotes.headAero = 'Seu -10% Eficiência Aero freia conceitos aerodinâmicos extremos.';
    } else if (headAero) {
      synergyPct += 6;
      roleNotes.headAero = 'Abordagem compatível com construção robusta de chassi.';
    }
  } else if (canonicalId === 'financial_magnate') {
    if ((headAero && isAeroAggressive) || (headPu && isPuInnovator)) {
      synergyPct += 10;
      const detail = `Seu aporte de +$25M em Caixa Livre financia projetos ambiciosos de engenharia para buscar o Top 6 exigido pelo Conselho já no Ano 1.`;
      interactions.push({
        id: 'mag_aggr_sync',
        type: 'synergy',
        targetRole: 'all',
        title: 'Capital para Performance (Você × Engenharia)',
        detail
      });
      if (headAero && isAeroAggressive) roleNotes.headAero = 'Caixa livre +$25M financia pacotes agressivos de aero.';
      if (headPu && isPuInnovator) roleNotes.headPu = 'Capital disponível suporta desenvolvimento de potência.';
    }
    if (isSportConservative && isPuConservative) {
      synergyPct -= 10;
      const detail = `Pressão de Curto Prazo: O Conselho exige Top 6 no 1º Ano, mas a diretoria técnica prioriza cautela de longo prazo.`;
      interactions.push({
        id: 'mag_cons_conflict',
        type: 'conflict',
        targetRole: 'sporting_director',
        title: 'Cobrança do Conselho vs. Cautela',
        detail
      });
    }
  } else if (canonicalId === 'ex_driver') {
    if (sportingDirector) {
      synergyPct += 10;
      const detail = `Seu prestígio de paddock (+10% Moral · +10 Sinergia Pilotos) alinha-se a ${sportingDirector.name} para manter box e pilotos em sintonia máxima.`;
      interactions.push({
        id: 'drv_sport_sync',
        type: 'synergy',
        targetRole: 'sporting_director',
        title: 'Coesão de Paddock & Garagem (Você × Gestão)',
        detail
      });
      roleNotes.sportingDirector = 'Moral +10% acelera sintonia com pilotos e pit wall.';
    }
    if (headAero && isAeroAggressive && headPu && isPuInnovator) {
      synergyPct -= 8;
      const detail = `Ritmo de Fábrica: Sem formação técnica na liderança (+10% Tempo P&D), ${headAero.name} e ${headPu.name} levam mais tempo para maturar atualizações complexas.`;
      interactions.push({
        id: 'drv_tech_lag',
        type: 'conflict',
        targetRole: 'all',
        title: 'Ciclo de P&D Mais Lento (+10% Tempo P&D)',
        detail
      });
    }
  } else if (canonicalId === 'data_strategist') {
    if (headAero && (isAeroConservative || headAero.rating >= 85)) {
      synergyPct += 8;
      const detail = `O rigor de validação de ${headAero.name} ajuda a compensar o seu +15% Erro de Correlação, unindo setup rápido na pista (+50% TL1) à fábrica.`;
      interactions.push({
        id: 'strat_aero_sync',
        type: 'synergy',
        targetRole: 'head_aero',
        title: 'Pista + Validação Fabril (Você × Aero)',
        detail
      });
      roleNotes.headAero = 'Rigor de fábrica ajuda a conter +15% Erro de Correlação.';
    } else if (headAero && isAeroAggressive) {
      synergyPct -= 10;
      const detail = `Risco de Correlação Amplificado: Seu +15% Erro de Correlação somado a pacotes agressivos de ${headAero.name} pode gerar surpresas no salto do túnel para a pista.`;
      interactions.push({
        id: 'strat_aero_corr',
        type: 'conflict',
        targetRole: 'head_aero',
        title: 'Alerta de Correlação (Você × Aero)',
        detail
      });
      roleNotes.headAero = 'Exige investimento em CFD para conter +15% Erro de Correlação.';
    }
  }

  // Natural alignment / tension between Sporting Director and Technical Chiefs
  if (sportingDirector && isSportConservative && (isAeroAggressive || isPuInnovator)) {
    synergyPct -= 2; // healthy creative tension
    if (!roleNotes.sportingDirector) {
      roleNotes.sportingDirector = 'Atuará como freio de segurança e compliance sobre a engenharia agressiva.';
    }
  } else if (sportingDirector && !roleNotes.sportingDirector) {
    roleNotes.sportingDirector = 'Execução esportiva alinhada ao ritmo da diretoria.';
  }

  // Clamp synergyPct; scale smoothly when not all 3 chiefs are hired yet
  const hiredCount = [headAero, headPu, sportingDirector].filter(Boolean).length;
  if (hiredCount < 3) {
    synergyPct = Math.min(75, Math.max(30, 40 + hiredCount * 12 + (synergyPct - 70)));
  } else {
    synergyPct = Math.min(96, Math.max(28, Math.round(synergyPct)));
  }

  const hasConflict = interactions.some(i => i.type === 'conflict');
  const synergyStatus: CombinedLeadershipDnaReport['synergyStatus'] =
    synergyPct >= 75 && !hasConflict
      ? 'high'
      : hasConflict || synergyPct < 60
      ? 'tension'
      : 'balanced';

  const synergyTone: CombinedLeadershipDnaReport['synergyTone'] =
    synergyPct < 50
      ? 'red'
      : synergyPct >= 75 && !hasConflict
      ? 'emerald'
      : 'amber';

  const boardroomRdPenaltyPct =
    hiredCount === 3 && synergyPct < 50
      ? -10
      : hiredCount === 3 && synergyPct < 60 && hasConflict
      ? -5
      : 0;

  let combinedHeadline = '⚖️ DIRETORIA EQUILIBRADA';
  if (synergyPct < 50 && hiredCount === 3) {
    combinedHeadline = '🚨 CONFLITO GRAVE DE DIRETORIA';
  } else if (performanceBias >= 45 && innovationBias >= 35) {
    combinedHeadline = '⚡ PERFORMANCE EXTREMA';
  } else if (performanceBias <= -20 && innovationBias <= -20) {
    combinedHeadline = '🛡️ FORTALEZA DE CONFIABILIDADE';
  } else if (canonicalId === 'elite_executive' && hasConflict) {
    combinedHeadline = '💼 RIGOR FINANCEIRO EM TENSÃO';
  } else if (dataPrecisionBias >= 40) {
    combinedHeadline = '📐 PRECISÃO DE DADOS & EFICIÊNCIA';
  } else if (hasConflict) {
    combinedHeadline = '⚠️ DIRETORIA HÍBRIDA EM ATRITO';
  }

  // Build transparent human-readable narrative mentioning Player + actual 3 Chiefs
  const aeroName = headAero?.name || 'Chefe de Aero (em aberto)';
  const puName = headPu?.name || 'Chefe de PU (em aberto)';
  const sportName = sportingDirector?.name || 'Chefe de Gerenciamento (em aberto)';

  let narrativeSummary = '';
  if (hiredCount < 3) {
    narrativeSummary = `Sua liderança (${principalOption.name}) já define a base da diretoria. Contrate os ${3 - hiredCount} pilar(es) restante(s) para consolidar o vetor técnico completo antes da Fase 4.`;
  } else if (synergyPct < 50) {
    narrativeSummary = `⚠️ Conflito de Diretoria: A divisão interna reduz os bônus da liderança e deixa o desenvolvimento de P&D mais lento (${boardroomRdPenaltyPct}% eficiência). Se o conceito do carro na Fase 4 ainda divergir da filosofia dos profissionais, a ineficiência será acumulada.`;
  } else if (canonicalId === 'elite_executive' && isPuInnovator) {
    narrativeSummary = `Sua gestão corporativa (${principalOption.name}) impõe cortes de orçamento que limitam o ímpeto Inovador de ${puName} (-5% potência PU). ${sportName} reforçará a disciplina de custos enquanto ${aeroName} busca eficiência dentro do teto.`;
  } else if (performanceBias >= 40) {
    const conservBrake = isSportConservative
      ? `${sportName} (Gestão Conservadora) tentará manter a equipe na linha e proteger a confiabilidade.`
      : `${sportName} apoiará decisões ousadas na operação de pista.`;
    narrativeSummary = `Sua liderança técnica (Você + ${aeroName} + ${puName}) criou uma diretoria focada em extrair o máximo de downforce e potência. ${conservBrake}`;
  } else if (performanceBias <= -15) {
    narrativeSummary = `Você (${principalOption.name}) e a diretoria priorizam consistência mecânica e pontuação segura em todas as corridas; o teto de velocidade pura dependerá da evolução de pacotes ao longo do ano.`;
  } else {
    narrativeSummary = `Você (${principalOption.name}) coordena ${aeroName}, ${puName} e ${sportName} em uma diretoria equilibrada entre ritmo de pista, confiabilidade e controle do Cost Cap.`;
  }

  return {
    canonicalPrincipalId: canonicalId,
    principalOption,
    synergyPct,
    synergyStatus,
    synergyTone,
    combinedHeadline,
    narrativeSummary,
    principalCard,
    vectorAxes: {
      performanceBias,
      innovationBias,
      dataPrecisionBias
    },
    puPowerDeltaPct,
    puRiskMitigated,
    rdEfficiencyOffsetPct,
    boardroomRdPenaltyPct,
    interactions,
    roleNotes
  };
};

export interface PhilosophyLeadershipFit {
  tier: 'recommended' | 'risk' | 'conflict' | 'neutral';
  badgeLabel: string;
  reason: string;
  efficiencyDeltaPct: number;
}

export const evaluatePhilosophyFitWithLeadership = (params: {
  philosophyCode: VehiclePhilosophyCode;
  principalBackground?: PrincipalBackgroundOption | PrincipalBackgroundId | string | null;
  headAero?: StaffMember | null;
  headPu?: StaffMember | null;
  sportingDirector?: StaffMember | null;
}): PhilosophyLeadershipFit => {
  const { philosophyCode, principalBackground, headAero, headPu, sportingDirector } = params;
  const canonicalId = principalBackground ? resolveCanonicalPrincipalId(typeof principalBackground === 'string' ? principalBackground : principalBackground.id) : null;
  const aeroProfile = headAero ? getStaffFullProfile(headAero) : null;
  const puProfile = headPu ? getStaffFullProfile(headPu) : null;
  const sportProfile = sportingDirector ? getStaffFullProfile(sportingDirector) : null;

  const aeroPref = aeroProfile?.preferredCarPhilosophy || null;
  const isAeroSevereConflict =
    Boolean(aeroPref) &&
    ((philosophyCode === 'low_drag' && (aeroPref === 'mechanical_grip' || aeroPref === 'high_downforce')) ||
      (philosophyCode === 'high_downforce' && aeroPref === 'low_drag') ||
      (philosophyCode === 'mechanical_grip' && aeroPref === 'low_drag'));

  if (isAeroSevereConflict && headAero) {
    return {
      tier: 'conflict',
      badgeLabel: 'CONFLITO SEVERO',
      reason: `Seu Chefe de Aero (${headAero.name}) vai rejeitar esta filosofia (-15% eficiência e perda de moral).`,
      efficiencyDeltaPct: -15
    };
  }

  // Aggressive Player + Aggressive Aero vs overly conservative concept
  const isPlayerPerformanceDriven =
    canonicalId === 'chief_engineer' || canonicalId === 'financial_magnate' || canonicalId === 'data_strategist';
  const isAeroAggressive = aeroPref === 'high_downforce' || aeroPref === 'low_drag' || aeroProfile?.staffPhilosophyTag === 'INOVADOR';

  if (philosophyCode === 'stable_platform' && isPlayerPerformanceDriven && isAeroAggressive && headAero) {
    const sportNote = sportingDirector && sportProfile?.staffPhilosophyTag === 'CONSERVADOR'
      ? `${sportingDirector.name} aprovaria, mas `
      : '';
    return {
      tier: 'risk',
      badgeLabel: 'CONSERVADOR DEMAIS',
      reason: `${sportNote}você e ${headAero.name} consideram conservador demais para a meta de performance (-8% potencial).`,
      efficiencyDeltaPct: -8
    };
  }

  // Elite Executive clashes with costly high_downforce / aggressive PU
  if (canonicalId === 'elite_executive' && philosophyCode === 'high_downforce') {
    const isDirectAero = aeroPref === 'high_downforce';
    return {
      tier: 'risk',
      badgeLabel: isDirectAero ? 'RISCO DE CUSTO' : 'ATRITO ORÇAMENTÁRIO',
      reason: isDirectAero
        ? `${headAero?.name} recomenda Alto Downforce, mas seu perfil Executivo aperta o orçamento de P&D (-5% líquido).`
        : `Pacotes de Alto Downforce consomem muito orçamento e atritam com seu perfil Executivo (-10% Eficiência P&D).`,
      efficiencyDeltaPct: isDirectAero ? -2 : -10
    };
  }

  // Legendary Mechanic favors mechanical_grip / stable_platform; cautions extreme aero
  if (canonicalId === 'legendary_mechanic') {
    if (philosophyCode === 'mechanical_grip' || philosophyCode === 'stable_platform') {
      return {
        tier: 'recommended',
        badgeLabel: 'ALINHADO À GARAGEM',
        reason: `Combina com seu perfil Mecânico Lendário (+15 Confiabilidade)${aeroPref === philosophyCode && headAero ? ` e com ${headAero.name}` : ''}.`,
        efficiencyDeltaPct: aeroPref === philosophyCode ? 10 : 5
      };
    }
    if ((philosophyCode === 'low_drag' || philosophyCode === 'aero_efficiency') && aeroPref !== philosophyCode) {
      return {
        tier: 'risk',
        badgeLabel: 'ATENÇÃO AERO',
        reason: `Seu foco mecânico (-10% Eficiência Aero) reduz a margem de ganho em conceitos puramente aerodinâmicos.`,
        efficiencyDeltaPct: -5
      };
    }
  }

  // Direct Aero Synergy + Player Alignment
  if (aeroPref === philosophyCode && headAero) {
    const puBoost = philosophyCode === 'high_downforce' && puProfile?.staffPhilosophyTag === 'INOVADOR' ? 2 : 0;
    const visionNote =
      canonicalId === 'chief_engineer'
        ? ' e pela sua visão técnica (-35% Erro Correlação)'
        : canonicalId === 'financial_magnate'
        ? ' e apoiado pelo seu aporte de +$25M'
        : '';
    return {
      tier: 'recommended',
      badgeLabel: 'RECOMENDADO',
      reason: `Recomendado por ${headAero.name}${visionNote} (+${8 + puBoost}% Eficiência P&D).`,
      efficiencyDeltaPct: 8 + puBoost
    };
  }

  // Aero Efficiency supported by Chief Engineer
  if (philosophyCode === 'aero_efficiency' && canonicalId === 'chief_engineer') {
    return {
      tier: 'recommended',
      badgeLabel: 'VISÃO DE DADOS',
      reason: `Sua liderança de Engenheiro Chefe (+10% Túnel de Vento) extrai excelente eficiência L/D deste conceito (+4%).`,
      efficiencyDeltaPct: 4
    };
  }

  // Elite Executive or Sporting Conservative favors Aero Efficiency / Balanced
  if (canonicalId === 'elite_executive' && (philosophyCode === 'aero_efficiency' || philosophyCode === 'stable_platform')) {
    return {
      tier: 'recommended',
      badgeLabel: 'EFICIÊNCIA DE CUSTO',
      reason: `Mantém o desenvolvimento dentro do Cost Cap sem atritos orçamentários com sua gestão.`,
      efficiencyDeltaPct: 3
    };
  }

  if (aeroProfile?.staffPhilosophyTag === 'INOVADOR' && (philosophyCode === 'high_downforce' || philosophyCode === 'low_drag')) {
    return {
      tier: 'recommended',
      badgeLabel: 'SINERGIA INOVADORA',
      reason: `DNA Inovador de ${headAero?.name} desbloqueia +5% de potencial neste pacote.`,
      efficiencyDeltaPct: 5
    };
  }

  return {
    tier: 'neutral',
    badgeLabel: 'COMPATÍVEL',
    reason: `Compatível com a diretoria técnica sem conflitos graves de desenvolvimento.`,
    efficiencyDeltaPct: 0
  };
};

const PHILOSOPHY_PT_LABELS: Record<VehiclePhilosophyCode, string> = {
  low_drag: 'Baixo Arrasto (Low Drag)',
  high_downforce: 'Alto Downforce (High Downforce)',
  stable_platform: 'Plataforma Estável',
  aero_efficiency: 'Eficiência Aerodinâmica',
  mechanical_grip: 'Aderência Mecânica',
  balanced_adaptive: 'Equilibrado / Adaptativo',
};

export const evaluateStaffPhilosophyConflict = (params: {
  philosophyCode: VehiclePhilosophyCode;
  principalBackground?: PrincipalBackgroundOption | PrincipalBackgroundId | string | null;
  headAero?: StaffMember | null;
  headPu?: StaffMember | null;
  sportingDirector?: StaffMember | null;
  engineOrigin: 'customer' | 'bought_factory' | 'phoenix';
  customerSupplier: string;
  thirdPartyErsSupplier?: string | null;
  includePowerUnitConstraints?: boolean;
}): PhilosophyConflictReport => {
  const {
    philosophyCode,
    principalBackground,
    headAero,
    headPu,
    sportingDirector,
    engineOrigin,
    customerSupplier,
    thirdPartyErsSupplier,
    includePowerUnitConstraints = true,
  } = params;
  const warnings: string[] = [];
  const bonuses: string[] = [];
  let efficiencyDeltaPct = 0;

  const selectedLabel = PHILOSOPHY_PT_LABELS[philosophyCode];

  if (headAero) {
    const aeroProfile = getStaffFullProfile(headAero);
    const pref = aeroProfile.preferredCarPhilosophy;
    const prefLabel =
      PHILOSOPHY_PT_LABELS[(pref === 'balanced' ? 'balanced_adaptive' : pref === 'tire_preservation' ? 'mechanical_grip' : pref) as VehiclePhilosophyCode] ||
      aeroProfile.staffPhilosophyTag;

    const isSevereConflict =
      (philosophyCode === 'low_drag' && (pref === 'mechanical_grip' || pref === 'high_downforce')) ||
      (philosophyCode === 'high_downforce' && pref === 'low_drag') ||
      (philosophyCode === 'mechanical_grip' && pref === 'low_drag');

    if (isSevereConflict) {
      efficiencyDeltaPct -= 15;
      warnings.push(
        `CONFLITO DE DNA: O seu Chefe de Aerodinâmica (${headAero.name} · ${aeroProfile.staffPhilosophyTag}) foca em ${prefLabel}. Ao escolher ${selectedLabel}, o desenvolvimento do carro será -15% mais lento e ele perderá Moral.`
      );
    } else if (pref === philosophyCode) {
      efficiencyDeltaPct += 8;
      bonuses.push(
        `SINERGIA DETECTADA: A filosofia "${selectedLabel}" combina perfeitamente com o seu Chefe de Aero (${headAero.name} · ${aeroProfile.staffPhilosophyTag}), gerando +8% de eficiência de projeto.`
      );
    } else if (aeroProfile.staffPhilosophyTag === 'INOVADOR') {
      efficiencyDeltaPct += 5;
      bonuses.push(
        `DNA Inovador (${headAero.name}): Desbloqueia +5% de downforce potencial em pacotes agressivos (+custo de P&D).`
      );
    } else if (aeroProfile.staffPhilosophyTag === 'CONSERVADOR') {
      bonuses.push(
        `DNA Conservador (${headAero.name}): Reduz risco de erro de correlação e garante plataforma previsível.`
      );
    }
  }

  if (headPu) {
    const puProfile = getStaffFullProfile(headPu);
    if (philosophyCode === 'low_drag' && puProfile.staffPhilosophyTag === 'CONSERVADOR') {
      bonuses.push(
        `Chefe de PU (${headPu.name}): Aprova o conceito Baixo Arrasto desde que a abertura térmica mínima dos radiadores seja respeitada na Fase 5.`
      );
    } else if (philosophyCode === 'high_downforce' && puProfile.staffPhilosophyTag === 'INOVADOR') {
      efficiencyDeltaPct += 2;
      bonuses.push(
        `SINERGIA DE POWERTRAIN (${headPu.name} · INOVADOR): O foco agressivo em potência bruta compensará a perda de velocidade final das asas carregadas (+2% eficiência).`
      );
    } else if (puProfile.staffPhilosophyTag === 'INOVADOR') {
      bonuses.push(
        `Chefe de PU (${headPu.name} · INOVADOR): Recomenda priorizar entrega elétrica/ICE agressiva na Fase 5 para ampliar a janela de ataque deste chassi.`
      );
    } else if (puProfile.staffPhilosophyTag === 'CONSERVADOR') {
      bonuses.push(
        `Chefe de PU (${headPu.name} · CONSERVADOR): Buscará na Fase 5 um motor com folga térmica para proteger a confiabilidade do conceito ${selectedLabel}.`
      );
    }
  }

  if (sportingDirector) {
    const sportProfile = getStaffFullProfile(sportingDirector);
    if (sportProfile.staffPhilosophyTag === 'CONSERVADOR') {
      bonuses.push(
        `Chefe de Gerenciamento (${sportingDirector.name} · CONSERVADOR): Garante rigor regulamentar FIA e execução limpa dentro do Teto de Custos.`
      );
    } else if (sportProfile.staffPhilosophyTag === 'INOVADOR') {
      bonuses.push(
        `Chefe de Gerenciamento (${sportingDirector.name} · INOVADOR): Apoia soluções arrojadas de cronograma e estratégia agressiva de evolução durante a temporada.`
      );
    }
  }

  // Principal Background (Player) interactions with Leadership & Philosophy
  if (principalBackground) {
    const leadership = evaluateCombinedLeadershipDna({
      principalBackground,
      headAero,
      headPu,
      sportingDirector
    });
    const fit = evaluatePhilosophyFitWithLeadership({
      philosophyCode,
      principalBackground,
      headAero,
      headPu,
      sportingDirector
    });

    if (fit.tier === 'risk') {
      if (fit.efficiencyDeltaPct < 0) {
        efficiencyDeltaPct += fit.efficiencyDeltaPct;
      }
      warnings.push(`VISÃO DA DIRETORIA (${leadership.principalOption.name}): ${fit.reason}`);
    } else if (fit.tier === 'recommended' && leadership.canonicalPrincipalId === 'chief_engineer' && philosophyCode === 'aero_efficiency' && headAero && getStaffFullProfile(headAero).preferredCarPhilosophy !== 'aero_efficiency') {
      efficiencyDeltaPct += 4;
      bonuses.push(`LIDERANÇA TÉCNICA (${leadership.principalOption.name}): ${fit.reason}`);
    } else if (leadership.canonicalPrincipalId === 'elite_executive' && fit.tier === 'recommended') {
      efficiencyDeltaPct += 3;
      bonuses.push(`EFICIÊNCIA DE COST CAP (${leadership.principalOption.name}): ${fit.reason}`);
    }

    if (leadership.boardroomRdPenaltyPct < 0) {
      efficiencyDeltaPct += leadership.boardroomRdPenaltyPct;
      warnings.push(
        `CONFLITO DE DIRETORIA (${leadership.synergyPct}% Sinergia): A divisão interna reduz o ritmo de desenvolvimento em ${leadership.boardroomRdPenaltyPct}%${fit.tier === 'conflict' ? ' e acumula com o conflito do conceito escolhido!' : '.'}`
      );
    }

    leadership.interactions.forEach(inter => {
      if (inter.type === 'conflict') {
        warnings.push(`${inter.title}: ${inter.detail}`);
      } else if (inter.type === 'synergy') {
        bonuses.push(`${inter.title}: ${inter.detail}`);
      }
    });
  }

  const lockedSidepodConcepts: Array<'zeropod' | 'downwash' | 'conventional'> = [];
  let packagingConstraintReason: string | null = null;

  if (includePowerUnitConstraints) {
    if (engineOrigin === 'customer' && customerSupplier === 'Mercedes') {
      lockedSidepodConcepts.push('zeropod');
      packagingConstraintReason =
        'Empacotamento Travado pela PU Mercedes Cliente: O volume de radiadores exigido pelo pacote M17 bloqueia conceitos de chassi estreito/Zero-Pod na Fase 7.';
      if (philosophyCode === 'low_drag' || philosophyCode === 'aero_efficiency') {
        warnings.push(
          'Restrição de Packaging (Motor Mercedes): O motor cliente exige sidepods médios/amplos, limitando o conceito estreito extremo (Zero-Pod bloqueado).'
        );
      }
    } else if (thirdPartyErsSupplier === 'Ferrari') {
      lockedSidepodConcepts.push('zeropod');
      packagingConstraintReason =
        'Empacotamento Travado pelo ERS Ferrari: Dissipação térmica exige admissão mínima de 395 cm² (Zero-Pod bloqueado).';
    }
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

export interface PuPhilosophyFit {
  fitLabel: 'ALTA SINERGIA' | 'EQUILIBRADO' | 'ATENÇÃO PACKAGING';
  fitTone: 'emerald' | 'cyan' | 'amber';
  reason: string;
}

export const evaluatePuFitWithPhilosophy = (params: {
  philosophyCode: VehiclePhilosophyCode;
  supplierOrFactoryId: string;
  isFactory?: boolean;
}): PuPhilosophyFit => {
  const { philosophyCode, supplierOrFactoryId, isFactory = false } = params;

  if (!isFactory) {
    switch (philosophyCode) {
      case 'high_downforce':
        if (supplierOrFactoryId === 'Honda') {
          return {
            fitLabel: 'ALTA SINERGIA',
            fitTone: 'emerald',
            reason: 'Bloco ultra-compacto libera traseira (Coke Bottle) para maximizar o difusor em curvas.'
          };
        }
        if (supplierOrFactoryId === 'Red Bull-Ford') {
          return {
            fitLabel: 'ALTA SINERGIA',
            fitTone: 'emerald',
            reason: 'ICE de referência compensa o arrasto extra das asas de alta carga nas retas.'
          };
        }
        if (supplierOrFactoryId === 'Mercedes' || supplierOrFactoryId === 'Audi') {
          return {
            fitLabel: 'ATENÇÃO PACKAGING',
            fitTone: 'amber',
            reason: 'Exige radiadores/bloco largos, reduzindo a margem de assoalho estreito do High Downforce.'
          };
        }
        return {
          fitLabel: 'EQUILIBRADO',
          fitTone: 'cyan',
          reason: 'Boa resposta de saída de curva, mas requer atenção extra ao arrefecimento do ERS.'
        };
      case 'low_drag':
        if (supplierOrFactoryId === 'Red Bull-Ford') {
          return {
            fitLabel: 'ALTA SINERGIA',
            fitTone: 'emerald',
            reason: 'Máxima potência de combustão para explorar retas longas com mínimo arrasto.'
          };
        }
        if (supplierOrFactoryId === 'Mercedes') {
          return {
            fitLabel: 'EQUILIBRADO',
            fitTone: 'cyan',
            reason: 'Eficiência híbrida evita clipping em retas, porém exige sidepods médios (Zero-Pod bloqueado).'
          };
        }
        if (supplierOrFactoryId === 'Honda') {
          return {
            fitLabel: 'ALTA SINERGIA',
            fitTone: 'emerald',
            reason: 'Empacotamento estreito permite reduzir a área frontal e a resistência ao avanço.'
          };
        }
        return {
          fitLabel: 'ATENÇÃO PACKAGING',
          fitTone: 'amber',
          reason:
            supplierOrFactoryId === 'Audi'
              ? 'Turbo grande com inércia alta e bloco volumoso penalizam saída de curva e área frontal.'
              : 'ERS aquece sob carga sustentada e pede aberturas maiores na carenagem.'
        };
      case 'aero_efficiency':
        if (supplierOrFactoryId === 'Mercedes' || supplierOrFactoryId === 'Honda') {
          return {
            fitLabel: 'ALTA SINERGIA',
            fitTone: 'emerald',
            reason:
              supplierOrFactoryId === 'Mercedes'
                ? 'Gestão ERS 95/100 mantém o carro veloz em todo o envelope Modo X ↔ Modo Z.'
                : 'Arquitetura compacta preserva o fluxo limpo no assoalho e difusor.'
          };
        }
        return {
          fitLabel: 'EQUILIBRADO',
          fitTone: 'cyan',
          reason: 'Relação potência/refrigeração compatível com metas gerais de L/D.'
        };
      case 'mechanical_grip':
        if (supplierOrFactoryId === 'Ferrari' || supplierOrFactoryId === 'Honda') {
          return {
            fitLabel: 'ALTA SINERGIA',
            fitTone: 'emerald',
            reason:
              supplierOrFactoryId === 'Ferrari'
                ? 'Turbo ágil com spool rápido entrega tração imediata na saída de curvas lentas.'
                : 'Leveza no eixo traseiro favorece trocas de direção e preservação de pneus.'
          };
        }
        return {
          fitLabel: 'EQUILIBRADO',
          fitTone: 'cyan',
          reason: 'Entrega progressiva compatível com acerto de tração mecânica.'
        };
      case 'stable_platform':
        if (supplierOrFactoryId === 'Mercedes') {
          return {
            fitLabel: 'ALTA SINERGIA',
            fitTone: 'emerald',
            reason: 'Confiabilidade 90% e entrega elétrica linear evitam picos bruscos no eixo traseiro.'
          };
        }
        if (supplierOrFactoryId === 'Honda' || supplierOrFactoryId === 'Audi') {
          return {
            fitLabel: 'ATENÇÃO PACKAGING',
            fitTone: 'amber',
            reason: 'Vibrações ou baixa confiabilidade inicial exigem reforço extra de plataforma.'
          };
        }
        return {
          fitLabel: 'EQUILIBRADO',
          fitTone: 'cyan',
          reason: 'Comportamento previsível com calibração padrão de suspensão.'
        };
      default:
        return {
          fitLabel: supplierOrFactoryId === 'Mercedes' || supplierOrFactoryId === 'Red Bull-Ford' ? 'ALTA SINERGIA' : 'EQUILIBRADO',
          fitTone: supplierOrFactoryId === 'Mercedes' || supplierOrFactoryId === 'Red Bull-Ford' ? 'emerald' : 'cyan',
          reason: 'Versátil para o pacote adaptativo em múltiplos perfis de pista.'
        };
    }
  }

  // Factory acquisition fit
  switch (philosophyCode) {
    case 'high_downforce':
      if (supplierOrFactoryId === 'cosworth') {
        return {
          fitLabel: 'ALTA SINERGIA',
          fitTone: 'emerald',
          reason: 'Bloco V6 enxuto (139 kg) libera espaço vital para os túneis de Venturi.'
        };
      }
      if (supplierOrFactoryId === 'bmw') {
        return {
          fitLabel: 'ALTA SINERGIA',
          fitTone: 'emerald',
          reason: 'Cavalaria alta compensa o arrasto induzido de asas carregadas nas retas.'
        };
      }
      if (supplierOrFactoryId === 'toyota') {
        return {
          fitLabel: 'ATENÇÃO PACKAGING',
          fitTone: 'amber',
          reason: 'Peso adicional na traseira exige redistribuição de lastro e asa dianteira.'
        };
      }
      return {
        fitLabel: 'EQUILIBRADO',
        fitTone: 'cyan',
        reason: 'Boa base industrial, requer ajuste fino térmico na bancada.'
      };
    case 'low_drag':
      if (supplierOrFactoryId === 'bmw' || supplierOrFactoryId === 'cosworth') {
        return {
          fitLabel: 'ALTA SINERGIA',
          fitTone: 'emerald',
          reason:
            supplierOrFactoryId === 'bmw'
              ? 'Potência pura de ponta multiplica a vantagem aerodinâmica de baixo arrasto.'
              : 'Bloco compacto ajuda a manter sidepods estreitos de baixa resistência.'
        };
      }
      if (supplierOrFactoryId === 'porsche') {
        return {
          fitLabel: 'ATENÇÃO PACKAGING',
          fitTone: 'amber',
          reason: 'Software térmico cru exige abertura maior de refrigeração até calibração em bancada.'
        };
      }
      return {
        fitLabel: 'EQUILIBRADO',
        fitTone: 'cyan',
        reason: 'Adequado para velocidade final após ajustes de mapeamento.'
      };
    case 'mechanical_grip':
      if (supplierOrFactoryId === 'renault' || supplierOrFactoryId === 'cosworth') {
        return {
          fitLabel: 'ALTA SINERGIA',
          fitTone: 'emerald',
          reason:
            supplierOrFactoryId === 'renault'
              ? 'Entrega de torque linear protege os pneus traseiros em saídas de curva.'
              : 'Massa reduzida alivia a carga lateral sobre o eixo traseiro.'
        };
      }
      return {
        fitLabel: 'EQUILIBRADO',
        fitTone: 'cyan',
        reason: 'Compatível após suavização da curva de torque na bancada.'
      };
    case 'stable_platform':
      if (supplierOrFactoryId === 'toyota' || supplierOrFactoryId === 'renault') {
        return {
          fitLabel: 'ALTA SINERGIA',
          fitTone: 'emerald',
          reason: 'Confiabilidade e estabilidade mecânica alinham-se ao foco de consistência.'
        };
      }
      if (supplierOrFactoryId === 'bmw') {
        return {
          fitLabel: 'ATENÇÃO PACKAGING',
          fitTone: 'amber',
          reason: 'Vibrações harmônicas elevadas exigem reforço de câmbio e suspensão.'
        };
      }
      return {
        fitLabel: 'EQUILIBRADO',
        fitTone: 'cyan',
        reason: 'Exige calibração cuidadosa de dinamômetro.'
      };
    default:
      return {
        fitLabel: supplierOrFactoryId === 'cosworth' || supplierOrFactoryId === 'toyota' ? 'ALTA SINERGIA' : 'EQUILIBRADO',
        fitTone: supplierOrFactoryId === 'cosworth' || supplierOrFactoryId === 'toyota' ? 'emerald' : 'cyan',
        reason: 'Equilíbrio sólido entre potencial evolutivo e integração ao chassi.'
      };
  }
};

export interface PuPhilosophyRecommendation {
  philosophyName: string;
  puChiefAdvice: string;
  aeroChiefAdvice: string;
}

export const getPuRecommendationForCarPhilosophy = (params: {
  philosophyCode: VehiclePhilosophyCode;
  headPu?: StaffMember | null;
  headAero?: StaffMember | null;
  engineOrigin: 'customer' | 'bought_factory' | 'phoenix';
  customerSupplier: string;
  selectedFactoryName?: string;
  selectedFactoryWeeks?: number;
}): PuPhilosophyRecommendation => {
  const {
    philosophyCode,
    headPu,
    headAero,
    engineOrigin,
    customerSupplier,
    selectedFactoryName = 'Cosworth',
    selectedFactoryWeeks = 1
  } = params;

  const philosophyName = PHILOSOPHY_PT_LABELS[philosophyCode];
  const puTag = headPu ? getStaffFullProfile(headPu).staffPhilosophyTag : 'EQUILIBRADO';

  if (engineOrigin === 'phoenix') {
    return {
      philosophyName,
      puChiefAdvice: `“Como aprovamos ${philosophyName} na Fase 4, o Protocolo Fênix nos dá liberdade total para desenhar o bloco e os radiadores sob medida para este conceito (${puTag}). O preço é consumir $50M do teto e 8 semanas críticas do cronograma.”`,
      aeroChiefAdvice: `“Se a Fênix entregar um bloco compacto dentro do prazo, consigo esculpir o assoalho e o Coke Bottle exatamente no gabarito ideal de ${philosophyName}.”`
    };
  }

  if (engineOrigin === 'bought_factory') {
    const fit = evaluatePuFitWithPhilosophy({
      philosophyCode,
      supplierOrFactoryId: selectedFactoryName.toLowerCase().includes('cosworth')
        ? 'cosworth'
        : selectedFactoryName.toLowerCase().includes('porsche')
        ? 'porsche'
        : selectedFactoryName.toLowerCase().includes('renault')
        ? 'renault'
        : selectedFactoryName.toLowerCase().includes('bmw')
        ? 'bmw'
        : 'toyota',
      isFactory: true
    });
    return {
      philosophyName,
      puChiefAdvice: `“Para o conceito ${philosophyName} aprovado na Fase 4, a fábrica ${selectedFactoryName} está classificada como ${fit.fitLabel}: ${fit.reason} Consome ${selectedFactoryWeeks} semana(s) de integração.”`,
      aeroChiefAdvice: `“Adquirindo a ${selectedFactoryName}, teremos controle evolutivo de empacotamento traseiro para refinar o arrefecimento conforme as exigências de ${philosophyName}.”`
    };
  }

  // Customer path
  const fit = evaluatePuFitWithPhilosophy({
    philosophyCode,
    supplierOrFactoryId: customerSupplier,
    isFactory: false
  });

  let puAdvice = `“Para o carro ${philosophyName} aprovado na Fase 4, o motor cliente ${customerSupplier} tem avaliação ${fit.fitLabel}: ${fit.reason}”`;
  if (philosophyCode === 'high_downforce' && puTag === 'INOVADOR') {
    puAdvice = `“Para compensar o arrasto do nosso conceito ${philosophyName} sem estourar a refrigeração, recomendo Honda (bloco compacto) ou Red Bull-Ford (potência ICE). Com ${customerSupplier}: ${fit.reason}”`;
  } else if (philosophyCode === 'low_drag') {
    puAdvice = `“Como o foco da Fase 4 é ${philosophyName}, precisamos de velocidade de ponta e radiadores enxutos. Com ${customerSupplier}: ${fit.reason}”`;
  }

  const aeroAdvice =
    customerSupplier === 'Mercedes'
      ? `“Aviso de Packaging para ${philosophyName}: o pacote Mercedes M17 exige radiadores volumosos e BLOQUEIA o conceito Zero-Pod na Fase 7 — precisaremos usar sidepods Downwash ou Convencionais.”`
      : customerSupplier === 'Honda'
      ? `“Com o bloco Honda compacto, ganho margem aerodinâmica preciosa na traseira para alimentar o difusor dentro da nossa filosofia ${philosophyName}.”`
      : `“O pacote ${customerSupplier} entra no nosso plano de ${philosophyName}; na Fase 7 ajustarei os dutos de arrefecimento e a cintura traseira ao gabarito escolhido.”`;

  return {
    philosophyName,
    puChiefAdvice: puAdvice,
    aeroChiefAdvice: aeroAdvice
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

export interface CascadingRdImpactReport {
  boardSynergyPct: number;
  boardTone: 'emerald' | 'amber' | 'red';
  boardStateLabel: string;
  boardSpeedMultiplier: number; // e.g., 1.10, 1.0, 0.85, 0.70
  philosophyMultiplier: number; // e.g., 1.0, 0.85, 0.60
  combinedSpeedMultiplier: number; // boardSpeedMultiplier * philosophyMultiplier
  rdTimeMultiplier: number; // 1 / combinedSpeedMultiplier (applied to GameContext modificadorTempoPeD)
  efficiencyDisplayPct: number; // e.g., 110, 100, 85, 42
  baseChassisWeeks: number; // 8
  projectedChassisWeeks: number; // Math.round(8 / combinedSpeedMultiplier)
  basePartWeeks: number; // 4
  projectedPartWeeks: number; // Math.round(4 / combinedSpeedMultiplier)
  isSevereCascade: boolean;
  silentSabotageAeroPct: number; // -5 when conflict is severe
  moralePenalty: number;
  headlineAlert: string | null;
  narrativeEventTitle: string | null;
  narrativeEventText: string | null;
  mediaRumourText: string | null;
  reasons: string[];
}

export const evaluateCascadingRdImpact = (params: {
  philosophyCode: VehiclePhilosophyCode;
  principalBackground?: PrincipalBackgroundOption | PrincipalBackgroundId | string | null;
  headAero?: StaffMember | null;
  headPu?: StaffMember | null;
  sportingDirector?: StaffMember | null;
}): CascadingRdImpactReport => {
  const { philosophyCode, principalBackground, headAero, headPu, sportingDirector } = params;

  const leadership = evaluateCombinedLeadershipDna({
    principalBackground,
    headAero,
    headPu,
    sportingDirector
  });

  const fit = evaluatePhilosophyFitWithLeadership({
    philosophyCode,
    principalBackground,
    headAero,
    headPu,
    sportingDirector
  });

  let boardSpeedMultiplier = 1.0;
  let boardStateLabel = 'Guerra Fria (Sem bônus · Cuidado na Fase 4)';
  if (leadership.synergyTone === 'emerald') {
    boardSpeedMultiplier = 1.1;
    boardStateLabel = 'Performance Extrema (+10% Velocidade P&D)';
  } else if (leadership.synergyTone === 'red') {
    boardSpeedMultiplier = 0.7;
    boardStateLabel = 'Guerra Civil Corporativa (-30% Velocidade P&D · Risco de demissão)';
  } else if (leadership.synergyPct < 60) {
    boardSpeedMultiplier = 0.85;
    boardStateLabel = 'Tensão de Diretoria (-15% Velocidade P&D)';
  }

  let philosophyMultiplier = 1.0;
  if (fit.tier === 'conflict') {
    philosophyMultiplier = 0.6;
  } else if (fit.tier === 'risk') {
    philosophyMultiplier = 0.85;
  }

  const combinedSpeedMultiplier = Number((boardSpeedMultiplier * philosophyMultiplier).toFixed(3));
  const rdTimeMultiplier = Number((1 / combinedSpeedMultiplier).toFixed(2));
  const efficiencyDisplayPct = Math.round(combinedSpeedMultiplier * 100);

  const baseChassisWeeks = 8;
  const projectedChassisWeeks = Math.max(6, Math.round(baseChassisWeeks / combinedSpeedMultiplier));
  const basePartWeeks = 4;
  const projectedPartWeeks = Math.max(3, Math.round(basePartWeeks / combinedSpeedMultiplier));

  const isSevereCascade = fit.tier === 'conflict' || leadership.synergyTone === 'red';
  const silentSabotageAeroPct = fit.tier === 'conflict' ? -5 : 0;
  const moralePenalty = (leadership.synergyTone === 'red' ? -15 : 0) + (fit.tier === 'conflict' ? -20 : 0);

  const reasons: string[] = [];
  if (fit.tier === 'conflict') {
    reasons.push(`Conflito direto com a filosofia do Chefe de Aero (-40% eficiência · 0.60x)`);
  } else if (fit.tier === 'risk') {
    reasons.push(`Atrito parcial com a liderança (-15% eficiência · 0.85x): ${fit.badgeLabel}`);
  } else if (fit.tier === 'recommended') {
    reasons.push(`Alinhamento direto com seu Chefe de Aero e visão técnica (1.00x)`);
  }

  if (leadership.synergyTone === 'red') {
    reasons.push(`Sinergia crítica na diretoria (${leadership.synergyPct}% · -30% velocidade · 0.70x)`);
  } else if (boardSpeedMultiplier < 1.0) {
    reasons.push(`Sinergia baixa da equipe (${leadership.synergyPct}% · -15% velocidade · 0.85x)`);
  } else if (leadership.synergyTone === 'emerald') {
    reasons.push(`Diretoria em alta sinergia (${leadership.synergyPct}% · +10% velocidade P&D · 1.10x)`);
  } else {
    reasons.push(`Sinergia moderada (${leadership.synergyPct}% · 1.00x neutro)`);
  }

  let headlineAlert: string | null = null;
  let narrativeEventTitle: string | null = null;
  let narrativeEventText: string | null = null;
  let mediaRumourText: string | null = null;

  if (fit.tier === 'conflict' && headAero) {
    headlineAlert = `🚨 ALERTA DE CONFLITO · ${projectedChassisWeeks} SEMANAS (NORMAL: ${baseChassisWeeks})`;
    narrativeEventTitle = `REUNIÃO DE EMERGÊNCIA: ${headAero.name.toUpperCase()} CONTESTA PROJETO`;
    narrativeEventText = `Chefe de Aero (${headAero.name}) marcou reunião de emergência contra o conceito ${PHILOSOPHY_PT_LABELS[philosophyCode]}. O moral de aerodinâmica despencou e há risco de sabotagem silenciosa (-5% de eficiência na pista nas asas/assoalho iniciais).`;
    mediaRumourText = `IMPRENSA: Guerra civil na diretoria técnica! Rumores apontam choque aberto entre o Team Principal e ${headAero.name}.`;
  } else if (leadership.synergyTone === 'red') {
    headlineAlert = `🚨 GUERRA CIVIL NA DIRETORIA · ${projectedChassisWeeks} SEMANAS (NORMAL: ${baseChassisWeeks})`;
    narrativeEventTitle = `CRISE INTERNA NA DIRETORIA TÉCNICA`;
    narrativeEventText = `Com sinergia em ${leadership.synergyPct}%, os chefes de área trabalham em direções opostas. Os pacotes de P&D levam +43% mais tempo e há risco de pedidos de demissão se o desempenho inicial falhar.`;
    mediaRumourText = `IMPRENSA: Bastidores indicam divisão grave na cúpula técnica antes mesmo da estreia da temporada 2026.`;
  } else if (fit.tier === 'risk') {
    headlineAlert = `⚠️ ATRITO DE PROJETO · ${projectedChassisWeeks} SEMANAS (NORMAL: ${baseChassisWeeks})`;
  }

  return {
    boardSynergyPct: leadership.synergyPct,
    boardTone: leadership.synergyTone,
    boardStateLabel,
    boardSpeedMultiplier,
    philosophyMultiplier,
    combinedSpeedMultiplier,
    rdTimeMultiplier,
    efficiencyDisplayPct,
    baseChassisWeeks,
    projectedChassisWeeks,
    basePartWeeks,
    projectedPartWeeks,
    isSevereCascade,
    silentSabotageAeroPct,
    moralePenalty,
    headlineAlert,
    narrativeEventTitle,
    narrativeEventText,
    mediaRumourText,
    reasons
  };
};

export const PHILOSOPHY_SPECTRUM_POSITION: Record<VehiclePhilosophyCode, number> = {
  low_drag: 10,
  aero_efficiency: 35,
  balanced_adaptive: 50,
  stable_platform: 58,
  mechanical_grip: 72,
  high_downforce: 92
};

export const getEngineersTargetShadow = (params: {
  principalBackground?: PrincipalBackgroundOption | PrincipalBackgroundId | string | null;
  headAero?: StaffMember | null;
}): {
  targetPosition: number; // 0 (Low Drag) .. 100 (High Downforce)
  targetLabel: string;
} => {
  const { principalBackground, headAero } = params;
  const canonicalId = principalBackground
    ? resolveCanonicalPrincipalId(typeof principalBackground === 'string' ? principalBackground : principalBackground.id)
    : 'chief_engineer';

  const aeroPref = headAero ? getStaffFullProfile(headAero).preferredCarPhilosophy : 'aero_efficiency';
  const mappedCode: VehiclePhilosophyCode =
    aeroPref === 'balanced'
      ? 'balanced_adaptive'
      : aeroPref === 'tire_preservation'
      ? 'mechanical_grip'
      : (aeroPref as VehiclePhilosophyCode);

  const aeroPos = PHILOSOPHY_SPECTRUM_POSITION[mappedCode] ?? 50;
  let principalPull = 50;
  if (canonicalId === 'chief_engineer') principalPull = aeroPos; // Chief Engineer amplifies aero technical target
  else if (canonicalId === 'legendary_mechanic') principalPull = 68; // Mechanical / stable bias
  else if (canonicalId === 'elite_executive') principalPull = 44; // Cost-efficient aero balance
  else if (canonicalId === 'financial_magnate') principalPull = aeroPos >= 50 ? 80 : 25;

  const targetPosition = headAero
    ? Math.round(aeroPos * 0.78 + principalPull * 0.22)
    : principalPull;

  const targetLabel = headAero
    ? `${headAero.name} (${PHILOSOPHY_PT_LABELS[mappedCode]})`
    : 'Linha Base da Diretoria';

  return { targetPosition, targetLabel };
};
