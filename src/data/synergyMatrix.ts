import type { HQOption } from './headquartersData';
import type { PrincipalBackgroundOption, PrincipalBackgroundId } from './principalBackgroundsData';

export type SynergyType = 'perfect_synergy' | 'mitigation' | 'hardcore' | 'balanced';

export interface SynergyAnalysis {
  type: SynergyType;
  typeBadge: string;
  typeColor: string; // Tailwind color class string
  paddockLabel: string;
  tagline: string;
  summaryQuote: string;
  techRating: number; // 0 - 100
  marketingRating: number; // 0 - 100
  moraleRating: number; // 0 - 100
  initialCashFormatted: string;
  prosText: string;
  risksText: string;
  fiveYearRoadmapAdvice: string;
}

interface CustomPairOverride {
  type: SynergyType;
  paddockLabel: string;
  tagline: string;
  summaryQuote: string;
  prosText: string;
  risksText: string;
  fiveYearRoadmapAdvice: string;
}

const ICONIC_SYNERGY_MAP: Record<string, CustomPairOverride> = {
  // 1. Engenheiro Chefe + Silverstone
  'silverstone_chief_engineer': {
    type: 'perfect_synergy',
    paddockLabel: 'A Nova Williams de Engenharia Pura',
    tagline: 'O Match Perfeito do Vale do Automobilismo',
    summaryQuote: 'Seu perfil de Engenheiro brilhará com a engenharia britânica. Os dados de túnel e CFD batem com a pista de primeira e os melhores projetistas querem trabalhar com você.',
    prosText: 'Acesso imediato ao melhor corpo técnico do mundo com -35% de erro de correlação e +10% de eficiência no túnel.',
    risksText: 'Os salários britânicos (+25%) e a falta de apelo comercial correm risco de estourar o Teto de Custos ($135M).',
    fiveYearRoadmapAdvice: 'Foque em micro-upgrades e contrate um piloto consistente e barato nos Anos 1-2. No Ano 3+, com instalações Nível 3, dispute o Top 4.'
  },
  // 2. Executivo de Elite + Maranello
  'maranello_elite_executive': {
    type: 'mitigation',
    paddockLabel: 'Uma Nova Força Corporativa com Alma Italiana',
    tagline: 'Mitigação Perfeita: Negócios Frios Encontram a Paixão Latina',
    summaryQuote: 'O Executivo resolve o caixa com +15% de patrocínio e 10% mais rendimento no Cost Cap, enquanto o fervor dos Tifosi de Maranello anula o desânimo corporativo da fábrica.',
    prosText: 'Equipe rica, sustentável e com moral compensado pela torcida (+15% merchandising extra).',
    risksText: 'A imprensa italiana não perdoa atrasos de P&D (-10% eficiência). Se não beliscar pódios logo, a pressão da mídia explode.',
    fiveYearRoadmapAdvice: 'Use o caixa do Cost Cap para comprar as melhores máquinas e contrate um Diretor Técnico carismático no Ano 3 para liderar a pista.'
  },
  // 3. Magnata / Investidor + Charlotte
  'charlotte_financial_magnate': {
    type: 'perfect_synergy',
    paddockLabel: 'O Brinquedo Bilionário da Flórida & Carolina',
    tagline: 'Hiper-Capitalização Norte-Americana',
    summaryQuote: 'Você une +$25M do Magnata com +$8M de Charlotte, totalizando mais de $33M em aportes extras imediatos para erguer um colosso corporativo do zero.',
    prosText: 'Liquidez instantânea para upar túnel de vento, simulador e fábrica para Nível 3 logo no primeiro ano.',
    risksText: 'O conselho exige Top 6 no Ano 1 com uma faca no pescoço, e engenheiros europeus resistem fortemente a mudar de continente (-14%).',
    fiveYearRoadmapAdvice: 'Gaste cada centavo livre em infraestrutura fabril imediata no Ano 1; não desperdice caixa em salários astronômicos de pilotos novatos.'
  },
  // 4. Mecânico Lendário + Sakura
  'sakura_legendary_mechanic': {
    type: 'perfect_synergy',
    paddockLabel: 'A Garagem de Guerra com Blindagem Robótica',
    tagline: 'Confiabilidade Absoluta & Pit Stops Robóticos',
    summaryQuote: 'O carro é um tanque indestrutível que nunca sofre apagões elétricos e troca pneus em tempos recordes. Você pontuará constantemente onde rivais abandonam.',
    prosText: '+15 Confiabilidade, pit stops ultravelozes e MGU-K de 350kW com eficiência cirúrgica sem quebras.',
    risksText: 'Déficit aerodinâmico severo nas retas (-10% eficiência aero) e lentidão logística pela distância do Japão.',
    fiveYearRoadmapAdvice: 'Vença no Ano 1-2 pela pura sobrevivência mecânica. No Ano 3+, contrate um Diretor de Aero europeu de elite para desenhar asas vencedoras.'
  },
  // 5. Estrategista de Dados + Hinwil
  'hinwil_data_strategist': {
    type: 'perfect_synergy',
    paddockLabel: 'O Laboratório Alpino da Estratégia Perfeita',
    tagline: 'Mestria de Telemetria & Refrigeração Térmica',
    summaryQuote: 'Precisão alpina encontra o mago dos dados. O carro acha o setup ideal no primeiro treino livre e preserva a bateria (ERS) melhor que qualquer outro carro do grid.',
    prosText: 'Setup ideal 50% mais veloz, -10% degradação de bateria ERS e gestão exemplar de pneus no domingo.',
    risksText: 'Upgrades de túnel de vento falham com frequência (+15% erro de correlação) e as taxas alfandegárias suíças pesam no frete.',
    fiveYearRoadmapAdvice: 'Vença corridas no domingo pela estratégia de 1 parada e condições mistas. Invista forte no Simulador Nível 3 para cobrir a correlação.'
  },
  // 6. Magnata + Grove
  'grove_financial_magnate': {
    type: 'mitigation',
    paddockLabel: 'O Reerguimento Financeiro da Garagem Histórica',
    tagline: 'Mitigação: Caixa Farto Encontra Obras Baratas',
    summaryQuote: 'Você injeta $25M em uma fábrica clássica britânica com -15% de custo em obras. Seu dinheiro rende o dobro em reformas de instalações.',
    prosText: 'Instalações erguidas no Nível 3 com velocidade e economia recorde no Vale do Automobilismo.',
    risksText: 'Engenheiros de topo (85+) exigem salários inflacionados em Grove e a diretoria do Magnata cobra metas imediatas implacáveis.',
    fiveYearRoadmapAdvice: 'Reforme a fábrica inteira no Ano 1 aproveitando o desconto de obras, operando com engenheiros médios eficientes até ter carro para atrair estrelas.'
  },
  // 7. Mecânico Lendário + Charlotte
  'charlotte_legendary_mechanic': {
    type: 'hardcore',
    paddockLabel: 'O Garagista Solitário no Epicentro Comercial',
    tagline: 'Modo Hardcore: O Puro Suco do Underdog',
    summaryQuote: 'Você tem um carro à prova de balas e pit stops rápidos, mas aerodinamicamente fraco e sediado fora da Europa, onde poucos engenheiros de elite querem pisar.',
    prosText: 'Confiabilidade extrema e aporte comercial de Charlotte para segurar as pontas.',
    risksText: 'Carro pesado e com muito arrasto; fábrica isolada dos centros de desenvolvimento aerodinâmico da FIA.',
    fiveYearRoadmapAdvice: 'Prepare-se para sofrer no pelotão de trás nas primeiras 2 temporadas; foque em pontuar em GPs caóticos com chuva e quebras de rivais.'
  },
  // 8. Ex-Piloto + Indianápolis
  'indianapolis_ex_driver': {
    type: 'hardcore',
    paddockLabel: 'O Espetáculo Americano com Motor Trovejante',
    tagline: 'Modo Hardcore: Pura Potência Sem Chassi',
    summaryQuote: 'Seu motor a combustão empurra como um foguete e os patrocinadores globais adoram o seu carisma, mas o chassi é o mais atrasado e lento do grid.',
    prosText: 'Projeção midiática colossal, excelente moral dos pilotos e motor com +15% de potência bruta.',
    risksText: 'P&D lento (-10%) aliado à inexperiência americana em chassi de F1 (-15% aero). O carro é rápido de reta e instável de curva.',
    fiveYearRoadmapAdvice: 'Contrate imediatamente um projetista aerodinâmico renomado para redesenhar assoalho e asas antes da virada do regulamento no Ano 2.'
  },
  // 9. Executivo de Elite + Charlotte
  'charlotte_elite_executive': {
    type: 'perfect_synergy',
    paddockLabel: 'A Máquina Comercial de Wall Street & NASCAR',
    tagline: 'O Monstro do Teto de Custos & Patrocínio',
    summaryQuote: 'Orçamento monumental: +$8M de sede, +15% de patrocínio e 10% mais rendimento no Cost Cap. Financeiramente invencível, mas a fábrica trabalhará sob pressão fria.',
    prosText: 'A maior receita do grid com capacidade financeira ilimitada para compras no teto de gastos.',
    risksText: 'Moral baixo (-15%) e lentidão na evolução técnica de pista (-10% eficiência de P&D).',
    fiveYearRoadmapAdvice: 'Acumule caixa nos Anos 1 e 2. No Ano 3, pague salários astronômicos para seduzir engenheiros de elite e reverter o moral.'
  },
  // 10. Ex-Piloto + Indaiatuba
  'indaiatuba_ex_driver': {
    type: 'perfect_synergy',
    paddockLabel: 'O Clã da Paixão & Sensibilidade de Pista',
    tagline: 'Carisma Puro & Mestria de Dinâmica Veicular',
    summaryQuote: 'A união do prestígio de um ex-piloto com o calor do torcedor brasileiro. Moral máximo (+28% acumulado), torcida fanática e pilotos com sensibilidade mecânica aguçada para afinar o carro.',
    prosText: 'Moral no topo absoluto, excelente sinergia de cockpit e +10% no feedback técnico dos pilotos para lapidar tração e suspensão.',
    risksText: 'Frete aéreo intercontinental caríssimo (+25%) e ciclos de P&D mais longos demandando planejamento antecipado.',
    fiveYearRoadmapAdvice: 'Aproveite o carisma para atrair patrocinadores fortes e pilotos sensíveis que tirem 100% da dinâmica de curvas lentas.'
  },
  // 10b. Engenheiro Chefe + Indaiatuba
  'indaiatuba_chief_engineer': {
    type: 'mitigation',
    paddockLabel: 'A Engenharia Cirúrgica com Sensibilidade Brasileira',
    tagline: 'Mitigação Perfeita: Feedback dos Pilotos Cobre o Ponto Fraco',
    summaryQuote: 'O Engenheiro Chefe normalmente tem dificuldade com o feedback dos pilotos (-15 sinergia), mas a cultura mecânica de Indaiatuba (+10% feedback técnico) mitiga esse defeito, criando um carro com dados de fábrica impecáveis e suspensão perfeita.',
    prosText: 'Correlação de fábrica de -35%, +10% de dinâmica veicular e comunicação direta piloto-engenheiro para achar o acerto de suspensão velozmente.',
    risksText: 'Frete intercontinental (+25%) e resistência de engenheiros europeus a se mudarem para a América do Sul (-18%).',
    fiveYearRoadmapAdvice: 'Foque em desenvolver o chassi e a suspensão localmente; seu carro terá a melhor tração mecânica do grid em circuitos travados.'
  },
  // 11. Estrategista de Dados + Faenza
  'faenza_data_strategist': {
    type: 'mitigation',
    paddockLabel: 'A Incubadora Científica de Jovens Talentos',
    tagline: 'Mitigação: Dados Precisos Compensam Baixo Orçamento',
    summaryQuote: 'Com orçamento inicial apertado (-$5M), o Estrategista extrai o máximo da telemetria e dos pneus sem precisar fabricar upgrades bilionários toda semana.',
    prosText: 'Lapidação técnica acelerada de pilotos novatos com acerto de carro refinado desde a sexta-feira.',
    risksText: 'Orçamento inicial restrito e erros de correlação em peças novas no túnel de vento.',
    fiveYearRoadmapAdvice: 'Opere como equipe formadora nos primeiros anos: desenvolva pilotos jovens, venda-os caro para montadoras e financie seu próprio CFD.'
  },
  // 12. Engenheiro Chefe + Stuttgart/Munique
  'stuttgart_munich_chief_engineer': {
    type: 'perfect_synergy',
    paddockLabel: 'O Bastião da Engenharia Germânica',
    tagline: 'Rigor Técnico & Tolerâncias Microscópicas',
    summaryQuote: 'Precisão máxima entre a fábrica e a pista com uma confiabilidade à prova de falhas mecânicas. Uma máquina de precisão clínica.',
    prosText: '-35% erro de correlação, +10% confiabilidade e eficiência exemplar em simulações térmicas e estruturais.',
    risksText: 'Pouca flexibilidade para mudar o conceito do carro no meio do campeonato e relação fria com os pilotos.',
    fiveYearRoadmapAdvice: 'Acerte a filosofia do carro logo no início do ano (não mude no meio). O carro será veloz, estável e pontuará sem quebras.'
  }
};

/**
 * Computes comprehensive synergy and metadata between any HQ and DNA profile
 */
export function evaluateSynergy(hq: HQOption, bg: PrincipalBackgroundOption): SynergyAnalysis {
  const pairKey = `${hq.id}_${bg.id}`;
  const override = ICONIC_SYNERGY_MAP[pairKey];

  // Base Ratings calculation (0-100 scale)
  // Tech: influenced by engineer quality, correlation, tunnel, reliability
  let tech = 50;
  if (bg.id === 'chief_engineer') tech += 25;
  if (bg.id === 'legendary_mechanic') tech += 10;
  if (bg.id === 'data_strategist') tech += 8;
  if (bg.id === 'elite_executive') tech -= 5;
  if (hq.id === 'silverstone') tech += 18;
  if (hq.id === 'stuttgart_munich') tech += 14;
  if (hq.id === 'hinwil') tech += 12;
  if (hq.id === 'sakura') tech += 15;
  if (hq.id === 'indianapolis') tech -= 8;
  if (hq.modifiers.engineerQualityBonus) tech += Math.round(hq.modifiers.engineerQualityBonus / 2);
  tech = Math.max(25, Math.min(98, tech));

  // Marketing: influenced by sponsors, location, background prestige
  let marketing = 40;
  if (bg.id === 'ex_driver') marketing += 28;
  if (bg.id === 'elite_executive') marketing += 22;
  if (bg.id === 'financial_magnate') marketing += 15;
  if (bg.id === 'chief_engineer') marketing -= 10;
  if (hq.id === 'charlotte' || hq.id === 'indianapolis') marketing += 18;
  if (hq.id === 'maranello') marketing += 20;
  if (hq.id === 'indaiatuba') marketing += 15;
  if (hq.modifiers.marketingBonus) marketing += hq.modifiers.marketingBonus;
  marketing = Math.max(20, Math.min(99, marketing));

  // Morale: influenced by passion, factory morale, team synergy
  let morale = 50;
  if (bg.id === 'ex_driver') morale += 15;
  if (bg.id === 'chief_engineer') morale -= 10;
  if (bg.id === 'elite_executive') morale -= 15;
  if (bg.id === 'financial_magnate') morale -= 10;
  if (hq.id === 'maranello') morale += 18;
  if (hq.id === 'indaiatuba') morale += 22;
  if (hq.modifiers.initialMoraleBonus) morale += hq.modifiers.initialMoraleBonus;
  morale = Math.max(20, Math.min(99, morale));

  // Projected Starting Cash computation (assuming baseline $135M or base franchise)
  const baseBudget = 135000000;
  const bgBonus = bg.modifiers.cashBonus || 0;
  const hqBonus = (hq.modifiers.cashBonus || 0) - (hq.modifiers.startingBudgetPenalty || 0);
  const totalCash = baseBudget + bgBonus + hqBonus;
  const totalCashFormatted = `$ ${(totalCash / 1000000).toFixed(0)}M`;

  if (override) {
    return {
      type: override.type,
      typeBadge: getSynergyBadge(override.type),
      typeColor: getSynergyColor(override.type),
      paddockLabel: override.paddockLabel,
      tagline: override.tagline,
      summaryQuote: override.summaryQuote,
      techRating: tech,
      marketingRating: marketing,
      moraleRating: morale,
      initialCashFormatted: totalCashFormatted,
      prosText: override.prosText,
      risksText: override.risksText,
      fiveYearRoadmapAdvice: override.fiveYearRoadmapAdvice
    };
  }

  // Dynamic Algorithmic Evaluation for combinations not explicitly in the iconic map
  let dynamicType: SynergyType = 'balanced';
  let dynamicLabel = `Projeto ${hq.name.split(',')[0]} & ${bg.name}`;
  let dynamicQuote = `A combinação equilibra os atributos de ${hq.name} com as diretrizes de ${bg.name}.`;
  let pros = `Combinação com bônus de ${bg.bonusShort} e vantagens operacionais de ${hq.bonusShort}.`;
  let risks = `Atenção para o ônus de ${bg.onusShort} somado às barreiras de ${hq.onusShort}.`;

  // Detect Mitigation (e.g. Executive covering financial onus, Engineer covering tech penalty)
  if (
    (bg.id === 'elite_executive' && (hq.modifiers.logisticsCostMultiplier ?? 1) > 1.1) ||
    (bg.id === 'chief_engineer' && (hq.modifiers.aeroEfficiencyPenalty ?? 0) < 0) ||
    (bg.id === 'legendary_mechanic' && (hq.modifiers.conceptFlexibilityPenalty ?? 0) > 0) ||
    (bg.id === 'ex_driver' && (hq.modifiers.initialMoraleBonus ?? 0) <= 0)
  ) {
    dynamicType = 'mitigation';
    dynamicLabel = `Escuderia Híbrida: Mitigação Estratégica em ${hq.name.split(',')[0]}`;
    dynamicQuote = `Seu perfil de ${bg.name} mitiga diretamente as maiores fragilidades operacionais do polo de ${hq.name}.`;
  } else if (
    (bg.id === 'legendary_mechanic' && (hq.modifiers.europeanStaffAppeal ?? 0) < -10) ||
    (bg.id === 'financial_magnate' && (hq.modifiers.startingBudgetPenalty ?? 0) > 0)
  ) {
    dynamicType = 'hardcore';
    dynamicLabel = `Desafio Extremo: Sobrevivência em ${hq.name.split(',')[0]}`;
    dynamicQuote = `Combinação de alta fricção: as desvantagens de ambas as escolhas se acumulam, exigindo precisão cirúrgica de gestão.`;
  } else if (
    (bg.id === 'chief_engineer' && (hq.modifiers.europeanStaffAppeal ?? 0) > 10) ||
    (bg.id === 'ex_driver' && (hq.modifiers.marketingBonus ?? 0) > 10) ||
    (bg.id === 'elite_executive' && (hq.modifiers.merchandisingRevenueBonus ?? 0) > 0.1)
  ) {
    dynamicType = 'perfect_synergy';
    dynamicLabel = `Força Consolidada de ${hq.name.split(',')[0]}`;
    dynamicQuote = `Sinergia de alta performance: seus pontos fortes se multiplicam diretamente com o ecossistema local.`;
  }

  return {
    type: dynamicType,
    typeBadge: getSynergyBadge(dynamicType),
    typeColor: getSynergyColor(dynamicType),
    paddockLabel: dynamicLabel,
    tagline: `Alinhamento Estratégico: ${hq.name.split(',')[0]} + ${bg.name}`,
    summaryQuote: dynamicQuote,
    techRating: tech,
    marketingRating: marketing,
    moraleRating: morale,
    initialCashFormatted: totalCashFormatted,
    prosText: pros,
    risksText: risks,
    fiveYearRoadmapAdvice: bg.longTermRoadmap?.years1to2 || 'Equilibre investimentos no Ano 1 entre fábrica e pista para viabilizar sua jornada de 5 a 7 temporadas.'
  };
}

function getSynergyBadge(type: SynergyType): string {
  switch (type) {
    case 'perfect_synergy':
      return '⚡ SINERGIA PERFEITA (O MATCH PERFEITO)';
    case 'mitigation':
      return '🛡️ MITIGAÇÃO INTELIGENTE (COBRINDO PONTOS FRACOS)';
    case 'hardcore':
      return '💀 MODO HARDCORE (CONFLITO EXTREMO)';
    case 'balanced':
    default:
      return '⚖️ EQUILÍBRIO ESTRATÉGICO';
  }
}

function getSynergyColor(type: SynergyType): string {
  switch (type) {
    case 'perfect_synergy':
      return 'emerald';
    case 'mitigation':
      return 'cyan';
    case 'hardcore':
      return 'red';
    case 'balanced':
    default:
      return 'amber';
  }
}
