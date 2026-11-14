export interface HQOption {
  id: string;
  name: string;
  country: string;
  flagEmoji: string;
  bonus: string;
  onus: string;
  bonusShort: string;
  onusShort: string;
  description: string;
  modifiers: {
    salaryMultiplier?: number;
    engineerQualityBonus?: number;
    initialMoraleBonus?: number;
    pressPressurePenalty?: number;
    reliabilityBonus?: number;
    conceptFlexibilityPenalty?: number;
    coolingEfficiencyBonus?: number;
    logisticsCostMultiplier?: number;
    cashBonus?: number;
    correlationErrorPenalty?: number;
    ersBonus?: number;
    integrationDelayWeeks?: number;
    driverAcademyBonus?: number;
    startingBudgetPenalty?: number;
    facilityCostDiscount?: number;
    topTierStaffDifficulty?: boolean;
    marketingBonus?: number;
    f1ExperiencePenalty?: boolean;
    europeanStaffAppeal?: number; // -20 to +20 interest modifier for European F1 engineers
    logisticsAnnualCostM?: number; // Annual freight/logistics cost impact in $M
  };
}

export const HEADQUARTERS_OPTIONS: HQOption[] = [
  {
    id: 'silverstone',
    name: 'Silverstone, Reino Unido',
    country: 'Reino Unido',
    flagEmoji: '🇬🇧',
    bonus: '+ Acesso a Engenheiros de Elite (+20% Interesse Europeu).',
    onus: '- Altíssimo Custo Salarial (+25% folha).',
    bonusShort: 'Engenheiros de Elite',
    onusShort: 'Salários Elevados (+25%)',
    description: 'O Vale do Automobilismo britânico abriga a maior densidade de aerodinamicistas e projetistas da F1. Atrai talentos europeus com facilidade, mas a competição inflaciona os salários.',
    modifiers: {
      engineerQualityBonus: 15,
      salaryMultiplier: 1.25,
      europeanStaffAppeal: 20,
      logisticsCostMultiplier: 0.95,
      logisticsAnnualCostM: 4.5
    }
  },
  {
    id: 'maranello',
    name: 'Maranello, Itália',
    country: 'Itália',
    flagEmoji: '🇮🇹',
    bonus: '+ Moral e Paixão (Tifosi) + Bom Apelo Europeu (+8%).',
    onus: '- Pressão Extrema da Imprensa.',
    bonusShort: 'Moral & Paixão dos Tifosi',
    onusShort: 'Pressão da Mídia Italiana',
    description: 'A aura lendária da Motor Valley italiana eleva a dedicação e o moral da equipe a níveis incomparáveis, porém qualquer erro é impiedosamente cobrado pela imprensa.',
    modifiers: {
      initialMoraleBonus: 12,
      pressPressurePenalty: 20,
      europeanStaffAppeal: 8,
      logisticsCostMultiplier: 1.0,
      logisticsAnnualCostM: 5.0
    }
  },
  {
    id: 'stuttgart_munich',
    name: 'Stuttgart/Munique, Alemanha',
    country: 'Alemanha',
    flagEmoji: '🇩🇪',
    bonus: '+ Eficiência Mecânica (+10% Confiabilidade) & Apelo DACH (+10%).',
    onus: '- Rigidez de Projeto (difícil mudar conceito).',
    bonusShort: 'Eficiência & Confiabilidade (+10%)',
    onusShort: 'Rigidez de Mudança de Conceito',
    description: 'Padrão germânico de precisão industrial e tolerâncias microscópicas. Atrai engenheiros de powertrain da Europa Central, mas alterar a filosofia aerodinâmica leva mais tempo.',
    modifiers: {
      reliabilityBonus: 10,
      conceptFlexibilityPenalty: 1,
      europeanStaffAppeal: 10,
      logisticsCostMultiplier: 1.02,
      logisticsAnnualCostM: 5.2
    }
  },
  {
    id: 'hinwil',
    name: 'Hinwil, Suíça',
    country: 'Suíça',
    flagEmoji: '🇨🇭',
    bonus: '+ Precisão Térmica e Refrigeração (+8% Apelo Europeu).',
    onus: '- Logística & Aduana Pesada (+15% custo de frete).',
    bonusShort: 'Precisão Térmica & Cooling',
    onusShort: 'Logística & Aduana Pesada',
    description: 'Instalações de túnel de vento e dinamômetro de precisão alpina oferecem gerenciamento térmico exemplar para o ERS de 350kW, mas os custos aduaneiros fora da UE são altos.',
    modifiers: {
      coolingEfficiencyBonus: 12,
      logisticsCostMultiplier: 1.15,
      europeanStaffAppeal: 8,
      logisticsAnnualCostM: 6.4
    }
  },
  {
    id: 'charlotte',
    name: 'Charlotte, EUA',
    country: 'Estados Unidos',
    flagEmoji: '🇺🇸',
    bonus: '+ Bônus de Caixa (+$8M) e Patrocinadores.',
    onus: '- Baixo Apelo para Staff Europeu (-14%) & Frete Transatlântico.',
    bonusShort: 'Caixa & Patrocínio (+ $8M)',
    onusShort: 'Atrito Staff Europeu & Correlação',
    description: 'O epicentro do automobilismo norte-americano atrai investimentos robustos, mas o fuso e a distância do Reino Unido reduzem o interesse de engenheiros europeus de F1.',
    modifiers: {
      cashBonus: 8000000,
      correlationErrorPenalty: 5,
      europeanStaffAppeal: -14,
      logisticsCostMultiplier: 1.20,
      logisticsAnnualCostM: 7.5
    }
  },
  {
    id: 'sakura',
    name: 'Sakura, Japão',
    country: 'Japão',
    flagEmoji: '🇯🇵',
    bonus: '+ Eletrônica e ERS Perfeitos.',
    onus: '- Fuso Horário, Frete Asiático (+18%) & Menor Apelo Europeu (-12%).',
    bonusShort: 'Eletrônica & ERS Impecáveis',
    onusShort: 'Atraso Fuso & Atrito Europeu',
    description: 'Supremacia mundial em semicondutores e sistemas de gerenciamento de bateria (BMS), compensada pela dificuldade de relocar engenheiros europeus para o Japão.',
    modifiers: {
      ersBonus: 15,
      integrationDelayWeeks: 1,
      europeanStaffAppeal: -12,
      logisticsCostMultiplier: 1.18,
      logisticsAnnualCostM: 7.2
    }
  },
  {
    id: 'indaiatuba',
    name: 'Indaiatuba, Brasil',
    country: 'Brasil',
    flagEmoji: '🇧🇷',
    bonus: '+ Moral Máxima e Torcida (+18 Moral).',
    onus: '- Frete Intercontinental (+25% Logística) & Baixo Apelo Europeu (-18%).',
    bonusShort: 'Moral Máxima & Fanatismo',
    onusShort: 'Frete +25% & Atrito Staff Europeu',
    description: 'Polo tecnológico automotivo ao lado de Viracopos. A paixão brasileira gera moral recorde na garagem, mas exige logística aérea pesada e salário extra para convencer staff europeu.',
    modifiers: {
      initialMoraleBonus: 18,
      logisticsCostMultiplier: 1.25,
      integrationDelayWeeks: 2,
      europeanStaffAppeal: -18,
      logisticsAnnualCostM: 8.4
    }
  },
  {
    id: 'faenza',
    name: 'Faenza, Itália',
    country: 'Itália',
    flagEmoji: '🇮🇹',
    bonus: '+ Foco em Pilotos Jovens (+20% XP Academia).',
    onus: '- Menor Orçamento Inicial (-$5M) · Apelo Europeu Neutro (+4%).',
    bonusShort: 'Academia & Jovens Talentos (+20% XP)',
    onusShort: 'Orçamento Inicial Reduzido (- $5M)',
    description: 'Tradição incomparável em garimpar e lapidar jovens prodígios das categorias de base (F2/F3), operando com estrutura enxuta na Emília-Romanha.',
    modifiers: {
      driverAcademyBonus: 20,
      startingBudgetPenalty: 5000000,
      europeanStaffAppeal: 4,
      logisticsCostMultiplier: 1.02,
      logisticsAnnualCostM: 5.1
    }
  },
  {
    id: 'grove',
    name: 'Grove, Reino Unido',
    country: 'Reino Unido',
    flagEmoji: '🇬🇧',
    bonus: '+ Custo de Instalação Baixo (-20% Obras) & Acesso Britânico (+12%).',
    onus: '- Resistência de Nomes Elite (Top Tiers exigem mais).',
    bonusShort: 'Capex Baixo (-20% Custo Obras)',
    onusShort: 'Resistência de Nomes Elite',
    description: 'Instalações históricas já amortizadas no Vale do Automobilismo reduzem gastos de CAPEX e facilitam contratação de engenheiros britânicos médios, embora estrelas exijam projeto maior.',
    modifiers: {
      facilityCostDiscount: 0.20,
      topTierStaffDifficulty: true,
      europeanStaffAppeal: 12,
      logisticsCostMultiplier: 0.96,
      logisticsAnnualCostM: 4.6
    }
  },
  {
    id: 'indianapolis',
    name: 'Indianápolis, EUA',
    country: 'Estados Unidos',
    flagEmoji: '🇺🇸',
    bonus: '+ Marketing Global (+15%).',
    onus: '- Inexperiência F1, Frete (+22%) & Baixo Apelo Europeu (-16%).',
    bonusShort: 'Projeção Global & Mídia (+15%)',
    onusShort: 'Inexperiência F1 & Staff Europeu -16%',
    description: 'A Capital Mundial da Velocidade projeta a marca com força brutal nos EUA, mas sofre para convencer aerodinamicistas europeus experientes no regulamento FIA.',
    modifiers: {
      marketingBonus: 15,
      f1ExperiencePenalty: true,
      europeanStaffAppeal: -16,
      logisticsCostMultiplier: 1.22,
      logisticsAnnualCostM: 7.8
    }
  }
];
