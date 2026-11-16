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
  techHubTitle: string;
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
    staffAcademyBonus?: number;
    startingBudgetPenalty?: number;
    facilityCostDiscount?: number;
    topTierStaffDifficulty?: boolean;
    marketingBonus?: number;
    merchandisingRevenueBonus?: number;
    simulatorEfficiencyBonus?: number;
    pitStopSpeedBonusPct?: number;
    f1ExperiencePenalty?: boolean;
    icePerformanceBonus?: number;
    aeroEfficiencyPenalty?: number;
    vehicleDynamicsBonus?: number;
    driverFeedbackBonus?: number;
    batteryDegradationDiscount?: number;
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
    techHubTitle: 'O Hub Tecnológico Britânico da F1',
    bonus: '+ Acesso a Engenheiros de Elite (+20% Interesse Europeu) & Desbloqueio Ágil de Pesquisa P&D.',
    onus: '- Altíssimo Custo Salarial (+25% folha de pagamento).',
    bonusShort: 'Engenheiros de Elite & P&D Ágil',
    onusShort: 'Salários Elevados (+25% folha)',
    description: 'O Vale do Automobilismo britânico abriga a maior densidade de aerodinamicistas e projetistas da F1. Atrai talentos europeus com facilidade e acelera a árvore de desenvolvimento, mas a concorrência inflaciona os salários.',
    modifiers: {
      engineerQualityBonus: 20,
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
    techHubTitle: 'O Templo da Paixão & Motor Valley',
    bonus: '+10% Moral e Paixão (+8% Apelo Europeu) & +15% Receita de Merchandising/Turismo (Tifosi).',
    onus: '- Imprensa Italiana Implacável (Exige pódio no 1º Ano sob risco de corte de 20% em patrocinadores).',
    bonusShort: 'Moral Tifosi & +15% Merchandising',
    onusShort: 'Imprensa Implacável (Cobrança por Pódio)',
    description: 'A aura lendária da Motor Valley italiana eleva a dedicação da fábrica a níveis recordes e monetiza qualquer souvenir com a torcida, porém a imprensa esportiva local pune severamente qualquer tropeço da equipe.',
    modifiers: {
      initialMoraleBonus: 10,
      merchandisingRevenueBonus: 0.15,
      pressPressurePenalty: 25,
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
    techHubTitle: 'Engenharia de Precisão & Rigor Germânico',
    bonus: '+ Engenharia de Precisão (+10% Confiabilidade / menos falhas DNF) & Apelo DACH (+10%).',
    onus: '- Rigidez de Projeto (Alterar filosofia no meio da temporada consome +20% horas de túnel de vento).',
    bonusShort: '+10% Confiabilidade & Menos DNFs',
    onusShort: 'Rigidez de Conceito (+20% Horas Túnel)',
    description: 'Padrão germânico de tolerâncias microscópicas. Reduz a probabilidade de panes mecânicas na pista e atrai fornecedores de ponta do eixo DACH, mas alterar o conceito do chassi requer processos rígidos e lentos.',
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
    techHubTitle: 'Laboratório de Baterias & Precisão Alpina',
    bonus: '+ Precisão Térmica e Refrigeração (Bateria ERS degrada 10% menos ao longo da corrida).',
    onus: '- Logística & Aduana Pesada (+15% custo de frete aduaneiro fora da União Europeia).',
    bonusShort: 'Precisão Térmica & -10% Degradação ERS',
    onusShort: 'Aduana & Frete (+15% Logística)',
    description: 'Túnel de vento de referência mundial e câmaras térmicas alpinas oferecem o melhor gerenciamento para os 350kW do sistema elétrico 2026, porém as barreiras alfandegárias suíças oneram o frete contínuo.',
    modifiers: {
      coolingEfficiencyBonus: 15,
      batteryDegradationDiscount: 0.10,
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
    techHubTitle: 'Império do Dinheiro & Simulação Norte-Americana',
    bonus: '+15% Eficiência de Simulador de Corrida & Aporte Comercial Livre (+$8M em Caixa).',
    onus: '- Baixo Apelo para Staff Europeu (-14%) & Frete Transatlântico.',
    bonusShort: '+$8M Caixa & +15% Dados de Simulador',
    onusShort: 'Baixo Apelo Europeu (-14%) & Frete',
    description: 'O epicentro do automobilismo norte-americano reúne infraestrutura de simulação de alta fidelidade e capital comercial abundante, embora o fuso e a distância afastem aerodinamicistas estabelecidos no Reino Unido.',
    modifiers: {
      cashBonus: 8000000,
      simulatorEfficiencyBonus: 0.15,
      correlationErrorPenalty: 4,
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
    techHubTitle: 'O Vale do Silício Japonês & Robótica de Precisão',
    bonus: '+ Eletrônica Perfeita (+15% eficiência do MGU-K) & Mecânicos Robóticos (Pit Stops 10% mais rápidos).',
    onus: '- Fuso Horário, Frete Asiático (+18%) & Menor Apelo para Engenheiros Europeus (-12%).',
    bonusShort: 'Eletrônica MGU-K (+15%) & Pit Stops Rápidos',
    onusShort: 'Fuso Horário & Frete Ásia (+18%)',
    description: 'Vanguarda absoluta em semicondutores, inversores de potência e automação mecatrônica. Garante paradas de box ultravelozes e um trem de força elétrico sem perdas, mitigando a barreira logística transcontinental.',
    modifiers: {
      ersBonus: 15,
      pitStopSpeedBonusPct: 10,
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
    techHubTitle: 'Polo Industrial F1 · Brasil',
    bonus: '+18% Moral e Torcida (Merchandising) · +10% Dinâmica Veicular (Suspensão e Tração) · +10% Feedback Técnico dos Pilotos.',
    onus: '- Frete Intercontinental (+25% Logística) · Baixo Apelo Europeu (-18%).',
    bonusShort: '+18% Moral & Merch · +10% Dinâmica · +10% Feedback Pilotos',
    onusShort: 'Frete +25% Logística · Apelo Europeu -18%',
    description: 'Polo tecnológico próximo a Viracopos com herança automobilística ímpar. Pilotos com sensibilidade mecânica aguçada ajudam os engenheiros a extrair o máximo da suspensão, compensando a distância dos fornecedores europeus.',
    modifiers: {
      initialMoraleBonus: 18,
      merchandisingRevenueBonus: 0.18,
      vehicleDynamicsBonus: 10,
      driverFeedbackBonus: 10,
      logisticsCostMultiplier: 1.25,
      europeanStaffAppeal: -18,
      logisticsAnnualCostM: 8.4
    }
  },
  {
    id: 'faenza',
    name: 'Faenza, Itália',
    country: 'Itália',
    flagEmoji: '🇮🇹',
    techHubTitle: 'Academia de Talentos & Formação de Pilotos',
    bonus: '+20% XP Academia de Pilotos Jovens & +10% XP para Engenheiros Juniores (Fábrica de Talentos).',
    onus: '- Menor Orçamento Inicial (-$5M) & Estrutura Operacional Enxuta.',
    bonusShort: '+20% XP Pilotos & +10% XP Engenheiros',
    onusShort: 'Orçamento Inicial Reduzido (- $5M)',
    description: 'Berço italiano consagrado na lapidação de pilotos novatos e corpo técnico em ascensão. Modelo ideal para montar uma incubadora de campeões com custos controlados antes de negociá-los no mercado.',
    modifiers: {
      driverAcademyBonus: 20,
      staffAcademyBonus: 10,
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
    techHubTitle: 'A Alma de Garagem & Eficiência em Infraestrutura',
    bonus: '+15% Desconto em Upgrades de Infraestrutura (Capex Obras) & Acesso Britânico (+12%).',
    onus: '- Resistência de Nomes Elite (Engenheiros Nota 85+ exigem +25% de salário).',
    bonusShort: 'Capex Baixo (-15% Custo em Obras)',
    onusShort: 'Engenheiros Elite Exigem +25% Salário',
    description: 'Herança histórica em Oxfordshire com galpões já amortizados que permitem erguer instalações a preços muito mais baixos, embora as maiores mentes do paddock exijam garantias orçamentárias pesadas para ingressar.',
    modifiers: {
      facilityCostDiscount: 0.15,
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
    techHubTitle: 'Centro Mundial de Motores & Potência Bruta',
    bonus: '+15% Desempenho de Motor ICE (Potência Bruta de Combustão) & +15% Projeção Comercial Global.',
    onus: '- Inexperiência em Chassi F1 (-15% Eficiência Aerodinâmica) & Frete Transatlântico (+22%).',
    bonusShort: '+15% Potência ICE & +15% Marketing Global',
    onusShort: '-15% Aero Chassi F1 & Frete (+22%)',
    description: 'Capital mundial da velocidade e da combustão interna pura. Extrai o máximo rendimento térmico do motor e atrai atenção massiva de mídia internacional, mas obriga a contratação de especialistas de ponta para sanar o chassi.',
    modifiers: {
      icePerformanceBonus: 15,
      marketingBonus: 15,
      aeroEfficiencyPenalty: -0.15,
      f1ExperiencePenalty: true,
      europeanStaffAppeal: -16,
      logisticsCostMultiplier: 1.22,
      logisticsAnnualCostM: 7.8
    }
  }
];
