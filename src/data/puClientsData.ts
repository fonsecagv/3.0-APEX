export interface PuClientProposal {
  id: string;
  teamId: string;
  teamName: string;
  shortName: string;
  country: string;
  color: string;
  annualPayment: number;
  durationSeasons: number;
  minReputation: number;
  description: string;
  technicalDemands: string;
  pros: string;
  cons: string;
}

export const PU_CLIENT_PROPOSALS: PuClientProposal[] = [
  {
    id: 'client_haas',
    teamId: 'haas',
    teamName: 'MoneyGram Haas F1 Team',
    shortName: 'HAAS',
    country: 'Estados Unidos',
    color: '#E6002B',
    annualPayment: 15000000,
    durationSeasons: 2,
    minReputation: 50,
    description: 'Equipe norte-americana de Kannapolis. Busca estabilidade financeira e fornecimento de motores com excelente suporte técnico de pista.',
    technicalDemands: 'Paridade estrita de telemetria e fornecimento contínuo de 8 motores por ano para os dois pilotos.',
    pros: 'Pagamento garantido de $15.0M/ano direto no Caixa e relação cooperativa.',
    cons: 'Ocupa 1 slot fabril. Caso o motor quebre, a repercussão com patrocinadores americanos é imediata.'
  },
  {
    id: 'client_williams',
    teamId: 'williams',
    teamName: 'Williams Racing',
    shortName: 'WIL',
    country: 'Reino Unido',
    color: '#00A0DE',
    annualPayment: 16500000,
    durationSeasons: 2,
    minReputation: 60,
    description: 'Tradicional escuderia britânica de Grove em fase de modernização. Prioriza alta potência de reta e confiabilidade mecânica comprovada.',
    technicalDemands: 'Acesso imediato a todos os mapas de qualificação do ICE e modos de deploy do MGU-K de 350kW.',
    pros: 'Receita elevada de $16.5M/ano e grande prestígio histórico no grid.',
    cons: 'A equipe técnica de Grove é muito perspicaz e aprenderá rapidamente nossos segredos aerodinâmicos e térmicos.'
  },
  {
    id: 'client_cadillac',
    teamId: 'cadillac',
    teamName: 'Cadillac F1 Team (TWG Andretti)',
    shortName: 'CAD',
    country: 'Estados Unidos',
    color: '#D4AF37',
    annualPayment: 18000000,
    durationSeasons: 1,
    minReputation: 45,
    description: 'Nova equipe aprovada pela FIA com apoio direto da General Motors. Necessita de uma Unidade de Potência cliente como transição de 1 ano antes de lançar seu motor proprietário.',
    technicalDemands: 'Suporte de engenharia intensivo em Indianápolis e fornecimento imediato de frotas de pré-temporada.',
    pros: 'Maior aporte financeiro do mercado: $18.0M/ano à vista sem compromisso de longo prazo.',
    cons: 'Contrato de apenas 1 temporada e alto escrutínio da mídia global e da FIA.'
  },
  {
    id: 'client_alpine',
    teamId: 'alpine',
    teamName: 'BWT Alpine F1 Team',
    shortName: 'ALP',
    country: 'França',
    color: '#0090FF',
    annualPayment: 15000000,
    durationSeasons: 2,
    minReputation: 68,
    description: 'Estrutura tradicional de Enstone que descontinuou seu programa de motores e agora atua estritamente como equipe cliente em busca de vitórias.',
    technicalDemands: 'Cláusula rigorosa de desempenho: se o motor for o mais lento por 3 corridas consecutivas, contrato rescindido.',
    pros: 'Forte presença de mercado e dados valiosos de telemetria em alta rotação.',
    cons: 'Risco de crise elevado e cobrança implacável da diretoria francesa.'
  }
];
