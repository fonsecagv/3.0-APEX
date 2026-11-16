export type PrincipalBackgroundId =
  | 'chief_engineer'
  | 'ex_driver'
  | 'legendary_mechanic'
  | 'financial_magnate'
  | 'data_strategist'
  | 'elite_executive'
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
  focus: string;
  bonus: string;
  onus: string;
  bonusShort: string;
  onusShort: string;
  description: string;
  badge: string;
  vibe: string;
  longTermRoadmap?: {
    years1to2: string;
    years3to4: string;
    years5plus: string;
    idealCombo: string;
  };
  modifiers: {
    correlationErrorMod?: number; // e.g. -0.35, +0.15
    windTunnelEfficiencyBonus?: number; // e.g. +0.10 (+10% Eficiência de Túnel de Vento)
    pilotSynergyDelta?: number; // e.g. -15
    sponsorRevenueMultiplier?: number; // e.g. 1.15 (+15% Receita de Patrocínio)
    teamMoraleDelta?: number; // e.g. +10, -15
    rdTimeMultiplier?: number; // e.g. 1.10 (+10% Tempo de P&D)
    rdEfficiencyMultiplier?: number; // e.g. 0.90 (-10% Eficiência P&D)
    teamReputationDelta?: number; // e.g. +20
    reliabilityDelta?: number; // e.g. +15
    pitStopSpeedDeltaSec?: number; // e.g. -0.2s
    aeroEfficiencyPenalty?: number; // e.g. -0.10 (-10% Eficiência de Aerodinâmica)
    boardConfidenceDelta?: number; // e.g. -15
    cashBonus?: number; // e.g. 25000000 (+$25M Caixa Inicial)
    demandingBoard?: boolean; // Diretoria Exigente (Exige Top 6 no 1º Ano)
    factoryMoraleDelta?: number; // e.g. -10, -15
    setupConfidenceSpeedMultiplier?: number; // e.g. 2.0 (Setup Ideal 50% mais rápido)
    tireWearMultiplier?: number; // e.g. 0.90 (+10% Gestão de Pneus)
    costCapEfficiencyBonus?: number; // e.g. 0.10 (+10% Eficiência no Teto de Custos)
    initialTeamMoralePenalty?: number; // e.g. -15 (-15% Moral Inicial da Equipe)
    fastSetup?: boolean;
    floorDownforceBonus?: number;
    manufacturingTimeMultiplier?: number;
  };
}

export const PRINCIPAL_BACKGROUNDS: PrincipalBackgroundOption[] = [
  {
    id: 'chief_engineer',
    name: 'O Engenheiro Chefe',
    focus: 'Desenvolvimento Técnico',
    bonus: '-35% Erro de Correlação | +10% Eficiência de Túnel de Vento',
    onus: '-15 Sinergia com Pilotos (Demoram mais para dar feedback)',
    bonusShort: '-35% Erro Correlação · +10% Túnel de Vento',
    onusShort: '-15 Sinergia com Pilotos',
    badge: 'P&D & TÚNEL DE VENTO',
    vibe: 'O "Newey" da equipe. Carro rápido no papel, mas o acerto fino de pista é demorado.',
    description: 'Veterano de túneis de vento e mecânica dos fluidos. Os dados de fábrica batem com precisão milimétrica com a pista, mas sua postura fria e analítica atrita com as emoções e o feedback dos pilotos.',
    longTermRoadmap: {
      years1to2: 'A Base: Atualizações baratas e certeiras com micro-upgrades constantes. Contrate um piloto barato e consistente.',
      years3to4: 'A Ascensão: Com Túnel de Vento e CFD Nível 3, o bônus de correlação brilha com saltos diretos para o Top 4.',
      years5plus: 'O Título: Carro dominante no papel, contratação de piloto de elite e briga direta por vitórias.',
      idealCombo: 'Sede em Silverstone (Hub de Engenheiros de Elite) + Motor Próprio (Zero).'
    },
    modifiers: {
      correlationErrorMod: -0.35,
      windTunnelEfficiencyBonus: 0.10,
      pilotSynergyDelta: -15
    }
  },
  {
    id: 'ex_driver',
    name: 'O Ex-Piloto de F1',
    focus: 'Paddock e Relações',
    bonus: '+15% Receita de Patrocínio | +10% Moral da Equipe e Pilotos',
    onus: '-10% Tempo de P&D (Projetos demoram mais)',
    bonusShort: '+15% Patrocínio · +10% Moral',
    onusShort: '+10% Tempo de P&D',
    badge: 'PRESTÍGIO DA SUPERLICENÇA',
    vibe: 'Ótimo para atrair dinheiro e manter o clima leve, mas a fábrica não é a mais rápida.',
    description: 'Venceu na elite da categoria. Sua fama atrai marcas globais e patrocínios milionários mantendo o moral do time elevado, mas a ausência de formação em engenharia torna os ciclos de P&D mais lentos.',
    longTermRoadmap: {
      years1to2: 'O Show: Foco em sobrevivência financeira e moral elevado fechando contratos de patrocínio de peso.',
      years3to4: 'A Contratação: Usar o caixa robusto para contratar um Diretor Técnico gênio e seduzir pilotos de ponta.',
      years5plus: 'O Título: Potência comercial e esportiva consolidada, com os melhores talentos comprados pelo carisma.',
      idealCombo: 'Sede em Charlotte (Bônus de Caixa + Marketing) + Motor Cliente Forte (Mercedes).'
    },
    modifiers: {
      sponsorRevenueMultiplier: 1.15,
      teamMoraleDelta: 10,
      pilotSynergyDelta: 10,
      teamReputationDelta: 20,
      rdTimeMultiplier: 1.10,
      rdEfficiencyMultiplier: 0.90
    }
  },
  {
    id: 'legendary_mechanic',
    name: 'O Mecânico Lendário',
    focus: 'Confiabilidade e Operação',
    bonus: '+15 Confiabilidade (Carro não quebra) | -0.2s no Pit Stop',
    onus: '-10% Eficiência de Aerodinâmica (Foco na mecânica, não no ar)',
    bonusShort: '+15 Confiabilidade · -0.2s Pit Stop',
    onusShort: '-10% Eficiência de Aerodinâmica',
    badge: 'OFICINA & GARAGEM DE GUERRA',
    vibe: 'O carro é um tanque de guerra à prova de falhas, mas sofre arrasto nas retas.',
    description: 'Conhece cada parafuso de titânio e treinou a equipe de boxes na marra para paradas relâmpago. O carro é extremamente durável, mas o foco puramente mecânico compromete o refinamento aerodinâmico.',
    longTermRoadmap: {
      years1to2: 'Os Pontos Valiosos: Vencer pela consistência enquanto rivais quebram ou batem, pontuando regularmente.',
      years3to4: 'A Engenharia Mecânica: Investir pesado em Dinâmica Veicular e Suspensão, compensando aero com tração pura.',
      years5plus: 'O Título: Contratar um Chefe de Aero excepcional para unir aerodinâmica à confiabilidade blindada.',
      idealCombo: 'Sede em Sakura (Eletrônica perfeita + Pit stops robóticos) + Motor Honda.'
    },
    modifiers: {
      reliabilityDelta: 15,
      pitStopSpeedDeltaSec: -0.2,
      aeroEfficiencyPenalty: -0.10
    }
  },
  {
    id: 'financial_magnate',
    name: 'O Magnata / Investidor',
    focus: 'Dinheiro Imediato e Alta Pressão',
    bonus: '+$25M Caixa Inicial Livre',
    onus: 'Diretoria Exigente (Exige Top 6 no 1º Ano, senão corta 20% do orçamento)',
    bonusShort: '+$25M Caixa Inicial Livre',
    onusShort: 'Diretoria Exigente (Meta Top 6 Ano 1)',
    badge: 'CAPITAL & ALTA PRESSÃO',
    vibe: 'O "Modo Hardcore de Dinheiro". Você começa rico, mas tem uma arma apontada para a cabeça.',
    description: 'Aporte massivo imediato de $25 milhões livres em caixa para alavancar infraestrutura básica no primeiro ano. Em contrapartida, o conselho de acionistas exige resultados imediatos de ponta sob ameaça de cortes severos.',
    longTermRoadmap: {
      years1to2: 'O Tudo ou Nada: Gastar 100% do aporte na Fábrica e CFD Nível 3 para entregar o Top 6 exigido pelo Conselho.',
      years3to4: 'A Consolidação: Com infraestrutura fabril forte, o ritmo de evolução do carro se torna implacável.',
      years5plus: 'O Título: Império construído, instalações de elite e domínio com orçamento total sob controle.',
      idealCombo: 'Sede em Stuttgart/Munique (Confiabilidade e rigor germânico) + Motor Próprio.'
    },
    modifiers: {
      cashBonus: 25000000,
      demandingBoard: true,
      boardConfidenceDelta: -10,
      factoryMoraleDelta: -10
    }
  },
  {
    id: 'data_strategist',
    name: 'O Estrategista de Dados',
    focus: 'Pista e Setup',
    bonus: 'Setup Ideal 50% mais rápido (TL1) | +10% Gestão de Pneus',
    onus: '+15% Erro de Correlação (Peças novas falham na pista)',
    bonusShort: 'Setup Ideal 50% Mais Rápido · +10% Pneus',
    onusShort: '+15% Erro de Correlação',
    badge: 'TELEMETRIA & SETUP DE PISTA',
    vibe: 'Domina treinos e estratégias de domingo, mas trazer upgrades eficientes do túnel de vento é um pesadelo.',
    description: 'Mestre da telemetria e das simulações estocásticas. Encontra a janela de acerto ideal logo na sexta-feira e poupa pneus de forma cirúrgica, mas depende de modelos teóricos que atritam com os testes de túnel de vento.',
    longTermRoadmap: {
      years1to2: 'O Milagre das Estratégias: Vencer pela estratégia de 1 pit stop e acerto perfeito mesmo com carro mediano.',
      years3to4: 'O Simulador: Investir massivamente no Simulador de Corrida e CFD para conter os erros de correlação.',
      years5plus: 'O Título: Pit wall imbatível em dias de chuva e corridas caóticas apoiado por um carro refinado.',
      idealCombo: 'Sede em Hinwil (Suíça - Precisão térmica e dados) + Motor Ferrari.'
    },
    modifiers: {
      setupConfidenceSpeedMultiplier: 2.0,
      fastSetup: true,
      tireWearMultiplier: 0.90,
      correlationErrorMod: 0.15
    }
  },
  {
    id: 'elite_executive',
    name: 'O Executivo de Elite',
    focus: 'Sustentabilidade Financeira',
    bonus: '+15% Receita de Patrocinadores | +10% Eficiência no Teto de Custos',
    onus: '-15% Moral Inicial da Equipe | -10% Eficiência de P&D',
    bonusShort: '+15% Patrocínio · +10% Eficiência Cost Cap',
    onusShort: '-15% Moral Inicial · -10% Eficiência P&D',
    badge: 'GESTÃO CORPORATIVA & COST CAP',
    vibe: 'A equipe nunca vai falir e terá ótimos patrocinadores, mas os engenheiros trabalham de mau humor e o carro evolui devagar.',
    description: 'Ex-consultor de topo e CEO experiente. Domina a engenharia financeira e a alocação de recursos, extraindo 10% mais de cada dólar do Cost Cap e fechando patrocínios vultosos, embora a cultura de planilhas desmotive a fábrica.',
    longTermRoadmap: {
      years1to2: 'O Investimento de Longo Prazo: Sobreviver acumulando caixa e expandindo infraestrutura parcelada com desconto.',
      years3to4: 'O Salto: Fábrica Nível 4 e contratação de Diretor Técnico carismático para sanar o moral, distribuindo bônus.',
      years5plus: 'O Título: O maior orçamento efetivo do grid com instalações impecáveis tornando o domínio inevitável.',
      idealCombo: 'Sede em Maranello (Paixão e moral neutralizam o ônus corporativo) + Motor Próprio.'
    },
    modifiers: {
      sponsorRevenueMultiplier: 1.15,
      costCapEfficiencyBonus: 0.10,
      initialTeamMoralePenalty: -15,
      factoryMoraleDelta: -15,
      teamMoraleDelta: -15,
      rdEfficiencyMultiplier: 0.90,
      rdTimeMultiplier: 1.10
    }
  }
];
