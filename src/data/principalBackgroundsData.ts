export type PrincipalBackgroundId =
  | 'chief_engineer'
  | 'ex_driver'
  | 'legendary_mechanic'
  | 'financial_magnate'
  | 'data_strategist'
  | 'fia_man'
  // Legacy aliases for backward compatibility
  | 'pro_driver'
  | 'born_strategist'
  | 'marketing_shark'
  | 'data_analyst'
  | 'enthusiast_heir'
  | 'f1_driver'
  | 'fia_engineer'
  | 'engineer'
  | 'driver'
  | 'financial';

export interface PrincipalBackgroundOption {
  id: PrincipalBackgroundId;
  name: string;
  bonus: string;
  onus: string;
  bonusShort: string;
  onusShort: string;
  description: string;
  badge: string;
  modifiers: {
    correlationErrorMod?: number; // e.g. -0.35, +0.15
    pilotSynergyDelta?: number; // e.g. -15
    rdTimeMultiplier?: number; // e.g. 1.10
    teamReputationDelta?: number; // e.g. +20
    reliabilityDelta?: number; // e.g. +15
    pitStopSpeedDeltaSec?: number; // e.g. -0.4s
    boardConfidenceDelta?: number; // e.g. -15
    cashBonus?: number; // e.g. 25000000
    factoryMoraleDelta?: number; // e.g. -10
    setupConfidenceSpeedMultiplier?: number; // e.g. 2.0
    fastSetup?: boolean;
    floorDownforceBonus?: number; // e.g. +5
    manufacturingTimeMultiplier?: number; // e.g. 1.20
    // Optional legacy fields
    aeroDesignTimeMultiplier?: number;
    manufacturingWeeksDelta?: number;
    blocksOverall90Plus?: boolean;
    driverContractDiscount?: number;
  };
}

export const PRINCIPAL_BACKGROUNDS: PrincipalBackgroundOption[] = [
  {
    id: 'chief_engineer',
    name: 'O Engenheiro Chefe',
    bonus: '-35% Erro de Correlação',
    onus: '-15 Sinergia com Pilotos',
    bonusShort: '-35% Erro Correlação',
    onusShort: '-15 Sinergia Pilotos',
    badge: 'P&D & TÚNEL DE VENTO',
    description: 'Veterano de túneis de vento e mecânica dos fluidos. Reduz drasticamente a discrepância entre simulações CFD e a pista, mas sua postura fria e analítica atrita com as emoções dos pilotos.',
    modifiers: {
      correlationErrorMod: -0.35,
      pilotSynergyDelta: -15
    }
  },
  {
    id: 'ex_driver',
    name: 'O Ex-Piloto de F1',
    bonus: '+Reputação no Paddock e Moral',
    onus: '+10% Tempo de P&D',
    bonusShort: '+Reputação & Moral',
    onusShort: '+10% Tempo P&D',
    badge: 'PRESTÍGIO DA SUPERLICENÇA',
    description: 'Venceu na elite da categoria. Compreende a mente dos pilotos e eleva a moral e a reputação da equipe no paddock, mas sua falta de paciência com cadernos de engenharia prolonga os ciclos de P&D.',
    modifiers: {
      teamReputationDelta: 20,
      pilotSynergyDelta: 10,
      rdTimeMultiplier: 1.10
    }
  },
  {
    id: 'legendary_mechanic',
    name: 'O Mecânico Lendário',
    bonus: '+15 Confiabilidade e Pit Stops Rápidos',
    onus: '-15 Confiança da Diretoria',
    bonusShort: '+15 Confiabilidade & Pits Rápidos',
    onusShort: '-15 Confiança Diretoria',
    badge: 'OFICINA & SOBREVIVÊNCIA',
    description: 'Conhece cada parafuso de titânio e sistema de alta tensão do trem de força. Quebras mecânicas despencam e os pit stops são ágeis, mas executivos do conselho desconfiam da sua falta de perfil executivo corporativo.',
    modifiers: {
      reliabilityDelta: 15,
      pitStopSpeedDeltaSec: -0.4,
      boardConfidenceDelta: -15
    }
  },
  {
    id: 'financial_magnate',
    name: 'O Magnata / Investidor',
    bonus: '+$25M Caixa Inicial',
    onus: '-10 Moral da Fábrica',
    bonusShort: '+$25M Caixa Inicial',
    onusShort: '-10 Moral Fábrica',
    badge: 'CAPITAL & LIQUIDEZ',
    description: 'Injeta aporte financeiro robusto de $25 milhões em caixa proveniente de fundos de investimento, mas a obsessão por cortes de despesa e metas contábeis desmotiva os operários do chão de fábrica.',
    modifiers: {
      cashBonus: 25000000,
      factoryMoraleDelta: -10
    }
  },
  {
    id: 'data_strategist',
    name: 'O Estrategista de Dados',
    bonus: 'Setup Ideal 50% mais rápido',
    onus: '+15% Erro de Correlação',
    bonusShort: 'Setup Ideal 50% Mais Rápido',
    onusShort: '+15% Erro Correlação',
    badge: 'TELEMETRIA & MODELOS',
    description: 'Decifra telemetria em tempo real e calcula janelas ideais de asa, cambagem e pressão de pneus na metade do tempo, mas negligencia testes de túnel de vento, aumentando o erro de correlação.',
    modifiers: {
      setupConfidenceSpeedMultiplier: 2.0,
      fastSetup: true,
      correlationErrorMod: 0.15
    }
  },
  {
    id: 'fia_man',
    name: 'O Homem da FIA',
    bonus: '+5 Downforce em brechas de Regra',
    onus: '+20% Tempo de Manufatura',
    bonusShort: '+5 DFm Brechas de Regra',
    onusShort: '+20% Tempo Manufatura',
    badge: 'LEGISLAÇÃO & BRECHAS',
    description: 'Ajudou a escrever o regulamento 2026 nos escritórios da FIA. Sabe exatamente onde as regras possuem brechas legais para extrair mais downforce no assoalho (+5 DFm), mas suas geometrias complexas exigem manufatura lenta.',
    modifiers: {
      floorDownforceBonus: 5,
      manufacturingTimeMultiplier: 1.20
    }
  }
];
