export interface RealTeamDriverInfo {
  name: string;
  number: number;
  rating: number;
  contractUntil: number;
  focus: string;
  role: 'Titular 1' | 'Titular 2' | 'Piloto Reserva';
  nationality: string;
}

export interface RealTeamStaffInfo {
  role: string;
  name: string;
  focus: string;
}

export interface RealTeamTelemetryMetric {
  label: string;
  value: number; // 0 - 100
  tierText: string;
  status: 'good' | 'warning' | 'critical';
}

export interface RealTeamDossier {
  teamId: string;
  officialFullName: string;
  shortName: string;
  carModel: string;
  color: string;
  secondaryColor: string;
  location: string;
  country: string;
  flagEmoji: string;
  constructorTitles: number;
  driverTitles: number;
  reputationStars: number;
  reputationLabel: string;
  boardExpectation: string;
  boardStatus: string;
  boardWarning: string;
  historicalIntro: string;
  fixedDnaTags: Array<{
    icon: string;
    label: string;
    description: string;
    type: 'positive' | 'negative' | 'neutral';
  }>;
  drivers: RealTeamDriverInfo[];
  technicalStaff: RealTeamStaffInfo[];
  powerUnitSupplier: string;
  powerUnitType: 'Fábrica Própria (Works)' | 'Motor Cliente';
  puMetrics: RealTeamTelemetryMetric[];
  chassisMetrics: RealTeamTelemetryMetric[];
  tacticalAdvantage: string;
  tacticalVulnerability: string;
  contractSignText: string;
}

export const REAL_TEAMS_DOSSIERS: Record<string, RealTeamDossier> = {
  ferrari: {
    teamId: 'ferrari',
    officialFullName: 'Scuderia Ferrari HP',
    shortName: 'FER',
    carModel: 'SF-26',
    color: '#DC0000',
    secondaryColor: '#FFFFFF',
    location: 'Maranello, Itália',
    country: 'Itália',
    flagEmoji: '🇮🇹',
    constructorTitles: 16,
    driverTitles: 15,
    reputationStars: 5,
    reputationLabel: 'Elite Mundial (5 Estrelas)',
    boardExpectation: 'Vencer o Campeonato Mundial de Construtores (Top 2 Obrigatório)',
    boardStatus: 'Confiança Moderada (O último Team Principal foi demitido por não ganhar o título)',
    boardWarning: 'Aviso: O conselho da presidência exige Top 2 no Mundial de Construtores. Se falhar, seu cargo estará em risco imediato.',
    historicalIntro: 'A equipe mais antiga e vitoriosa da história da Fórmula 1. Uma lenda italiana que carrega o peso e o fervor da Tifosi global. A pressão interna e da mídia é implacável, mas a paixão da fábrica é o verdadeiro combustível da escuderia.',
    fixedDnaTags: [
      {
        icon: '🇮🇹',
        label: 'Paixão e Tradição Tifosi',
        description: '+Moral e apelo em vitórias em Monza, mas queda severa de moral em derrotas consecutivas.',
        type: 'positive'
      },
      {
        icon: '🔥',
        label: 'Pressão Implacável da Imprensa',
        description: 'Qualquer resultado abaixo do pódio gera manchetes negativas e crises nos jornais de Milão e Roma.',
        type: 'negative'
      },
      {
        icon: '⚙️',
        label: 'Motor Próprio com Alma Mecânica',
        description: 'Unidade de Potência 067/3 desenvolvida em Maranello com arrancadas brutais e cabeçote térmico de alta resistência.',
        type: 'neutral'
      }
    ],
    drivers: [
      {
        name: 'Charles Leclerc',
        number: 16,
        rating: 94,
        contractUntil: 2028,
        focus: 'Classificação pura e curvas de alta velocidade',
        role: 'Titular 1',
        nationality: 'Mônaco'
      },
      {
        name: 'Lewis Hamilton',
        number: 44,
        rating: 95,
        contractUntil: 2027,
        focus: 'Gestão de corrida, preservação de pneus e pista molhada',
        role: 'Titular 2',
        nationality: 'Reino Unido'
      },
      {
        name: 'Antonio Giovinazzi',
        number: 99,
        rating: 79,
        contractUntil: 2026,
        focus: 'Feedback técnico e desenvolvimento de simulador em Maranello',
        role: 'Piloto Reserva',
        nationality: 'Itália'
      },
      {
        name: 'Dino Beganovic',
        number: 7,
        rating: 76,
        contractUntil: 2026,
        focus: 'Piloto da Ferrari Driver Academy em ascensão na F2',
        role: 'Piloto Reserva',
        nationality: 'Suécia'
      }
    ],
    technicalStaff: [
      {
        role: 'Diretor Técnico',
        name: 'Loïc Serra',
        focus: 'Aerodinâmica, suspensão dinâmica e cinemática'
      },
      {
        role: 'Chefe de Unidade de Potência',
        name: 'Enrico Gualtieri',
        focus: 'Câmara de combustão ICE, injeção direta e durabilidade do turbo'
      },
      {
        role: 'Diretor Esportivo & Operações',
        name: 'Diego Ioverno',
        focus: 'Procedimentos de pit stop, logística de garagem e regulamento esportivo'
      }
    ],
    powerUnitSupplier: 'Ferrari 067/3 Superfast 2026',
    powerUnitType: 'Fábrica Própria (Works)',
    puMetrics: [
      {
        label: 'Potência Máxima (ICE)',
        value: 92,
        tierText: 'Muito Alto (ICE Forte · Turbo Responsivo)',
        status: 'good'
      },
      {
        label: 'Confiabilidade Mecânica',
        value: 68,
        tierText: 'Médio (Risco de quebra no fim da temporada)',
        status: 'warning'
      },
      {
        label: 'Eficiência Térmica & ERS',
        value: 82,
        tierText: 'Alto (Cabeçote de aço · Refrigeração Otimizada)',
        status: 'good'
      }
    ],
    chassisMetrics: [
      {
        label: 'Aerodinâmica (Downforce Total)',
        value: 88,
        tierText: 'Alto (Excelente aderência em curvas lentas e médias)',
        status: 'good'
      },
      {
        label: 'Eficiência Aero (Baixo Arrasto)',
        value: 62,
        tierText: 'Médio (Sofre nas retas longas contra carros low-drag)',
        status: 'warning'
      },
      {
        label: 'Dinâmica Veicular (Suspensão)',
        value: 70,
        tierText: 'Médio (Sensível a zebras altas e transições rápidas)',
        status: 'warning'
      },
      {
        label: 'Gestão de Pneus na Corrida',
        value: 84,
        tierText: 'Alto (Trata os pneus muito bem em stints longos)',
        status: 'good'
      }
    ],
    tacticalAdvantage: 'Dupla de pilotos mais laureada do grid e downforce natural poderoso em pistas técnicas.',
    tacticalVulnerability: 'Risco de confiabilidade do motor no terço final do ano e déficit de velocidade de reta em Monza e Spa.',
    contractSignText: 'ASSUMIR O COMANDO DA SCUDERIA FERRARI'
  },

  mclaren: {
    teamId: 'mclaren',
    officialFullName: 'McLaren Formula 1 Team',
    shortName: 'MCL',
    carModel: 'MCL40',
    color: '#FF7A00',
    secondaryColor: '#16181E',
    location: 'Woking, Reino Unido',
    country: 'Reino Unido',
    flagEmoji: '🇬🇧',
    constructorTitles: 8,
    driverTitles: 12,
    reputationStars: 5,
    reputationLabel: 'Top Tier Campeã (5 Estrelas)',
    boardExpectation: 'Defender o Título Mundial de Construtores',
    boardStatus: 'Alta Confiança (A equipe vive sua fase mais técnica desde a era Hakkinen)',
    boardWarning: 'Aviso: A diretoria de Woking exige disputa direta por vitórias e títulos em todas as rodadas.',
    historicalIntro: 'A lendária equipe de Bruce McLaren com tradição inigualável de inovação e aerodinâmica de ponta. O McLaren Technology Centre (MTC) é uma das instalações mais avançadas do mundo, operando com metodologia cirúrgica.',
    fixedDnaTags: [
      {
        icon: '🌪️',
        label: 'Aerodinâmica Referência',
        description: 'Eficiência de downforce e estabilidade de assoalho superiores em curvas de média e alta.',
        type: 'positive'
      },
      {
        icon: '🤝',
        label: 'Papaya Rules (Rivalidade Interna)',
        description: 'Dois pilotos jovens de elite que exigem gerenciamento psicológico estrito para evitar toques.',
        type: 'negative'
      },
      {
        icon: '⚡',
        label: 'Motor Cliente de Elite',
        description: 'Unidade Mercedes HPP garantindo confiabilidade de fábrica, embora sem controle da arquitetura.',
        type: 'neutral'
      }
    ],
    drivers: [
      {
        name: 'Lando Norris',
        number: 4,
        rating: 93,
        contractUntil: 2027,
        focus: 'Ritmo de corrida devastador e ritmo de classificação',
        role: 'Titular 1',
        nationality: 'Reino Unido'
      },
      {
        name: 'Oscar Piastri',
        number: 81,
        rating: 90,
        contractUntil: 2026,
        focus: 'Calma sob pressão extrema e largadas limpas',
        role: 'Titular 2',
        nationality: 'Austrália'
      },
      {
        name: 'Patricio O’Ward',
        number: 29,
        rating: 80,
        contractUntil: 2026,
        focus: 'Agressividade de freada e suporte nos TL1',
        role: 'Piloto Reserva',
        nationality: 'México'
      },
      {
        name: 'Leonardo Fornaroli',
        number: 1,
        rating: 76,
        contractUntil: 2026,
        focus: 'Campeão da F3 em desenvolvimento contínuo',
        role: 'Piloto Reserva',
        nationality: 'Itália'
      }
    ],
    technicalStaff: [
      {
        role: 'Diretor Técnico de Aerodinâmica',
        name: 'Peter Prodromou',
        focus: 'Vórtices de assoalho, bordas ativas e deflexão de asa'
      },
      {
        role: 'Diretor Técnico de Engenharia',
        name: 'Neil Houldey',
        focus: 'Integração de chassi, peso mínimo e rigidez torcional'
      },
      {
        role: 'Diretor de Performance',
        name: 'Andrea Stella / Randeep Singh',
        focus: 'Modelagem preditiva de corrida e estratégia de paradas'
      }
    ],
    powerUnitSupplier: 'Mercedes-AMG F1 M17 E-Performance',
    powerUnitType: 'Motor Cliente',
    puMetrics: [
      {
        label: 'Potência Máxima (ICE)',
        value: 86,
        tierText: 'Alto (Entrega consistente em todas as faixas)',
        status: 'good'
      },
      {
        label: 'Confiabilidade Mecânica',
        value: 92,
        tierText: 'Muito Alto (Zero falhas graves na temporada)',
        status: 'good'
      },
      {
        label: 'Eficiência Térmica & ERS',
        value: 94,
        tierText: 'Excelente (Desdobramento contínuo de 350kW)',
        status: 'good'
      }
    ],
    chassisMetrics: [
      {
        label: 'Aerodinâmica (Downforce Total)',
        value: 94,
        tierText: 'Excelente (O chassi mais equilibrado do grid)',
        status: 'good'
      },
      {
        label: 'Eficiência Aero (Baixo Arrasto)',
        value: 86,
        tierText: 'Alto (Asas flexíveis e assoalho ultraeficiente)',
        status: 'good'
      },
      {
        label: 'Dinâmica Veicular (Suspensão)',
        value: 88,
        tierText: 'Muito Alto (Devora zebras com estabilidade)',
        status: 'good'
      },
      {
        label: 'Gestão de Pneus na Corrida',
        value: 90,
        tierText: 'Excelente (Janela operacional ampla em qualquer clima)',
        status: 'good'
      }
    ],
    tacticalAdvantage: 'Carro mais completo e versátil do grid com motor confiável e instalações de túnel de vento novas no MTC.',
    tacticalVulnerability: 'Potencial desgaste de moral se a disputa entre Norris e Piastri não for gerida com mão de ferro.',
    contractSignText: 'ASSUMIR O COMANDO DA MCLAREN F1'
  },

  redbull: {
    teamId: 'redbull',
    officialFullName: 'Oracle Red Bull Racing',
    shortName: 'RBR',
    carModel: 'RB22',
    color: '#0B1936',
    secondaryColor: '#E01A38',
    location: 'Milton Keynes, Reino Unido',
    country: 'Reino Unido',
    flagEmoji: '🇬🇧',
    constructorTitles: 6,
    driverTitles: 7,
    reputationStars: 5,
    reputationLabel: 'Superpotência (5 Estrelas)',
    boardExpectation: 'Recuperar o Título Mundial de Construtores',
    boardStatus: 'Pressão Alta (O conselho em Fuschl exige supremacia indiscutível)',
    boardWarning: 'Aviso: Helmut Marko e a diretoria exigem vitórias imediatas; paciência com erros é nula.',
    historicalIntro: 'A gigante de Milton Keynes que redefiniu o automobilismo moderno com ousadia, pit stops supersônicos e a máquina implacável liderada por Max Verstappen. O maior desafio para 2026 é o novo motor Red Bull Ford Powertrains feito em casa.',
    fixedDnaTags: [
      {
        icon: '👑',
        label: 'Fator Max Verstappen',
        description: 'O piloto mais dominante do automobilismo garante +0.3s por volta sobre qualquer acerto.',
        type: 'positive'
      },
      {
        icon: '⚠️',
        label: 'Transição RBPT-Ford 2026',
        description: 'Primeiro motor próprio da história da equipe; riscos de juventude na bateria e turbo.',
        type: 'negative'
      },
      {
        icon: '⚡',
        label: 'Pit Stops Supersônicos',
        description: 'Equipe de mecânicos mais rápida da história com médias de troca abaixo de 2.0s.',
        type: 'positive'
      }
    ],
    drivers: [
      {
        name: 'Max Verstappen',
        number: 1,
        rating: 97,
        contractUntil: 2028,
        focus: 'Domínio absoluto, agressividade cirúrgica e telemetria',
        role: 'Titular 1',
        nationality: 'Holanda'
      },
      {
        name: 'Isack Hadjar',
        number: 6,
        rating: 81,
        contractUntil: 2026,
        focus: 'Agressividade pura, largadas fortes e arrojo técnico',
        role: 'Titular 2',
        nationality: 'França'
      },
      {
        name: 'Yuki Tsunoda',
        number: 22,
        rating: 83,
        contractUntil: 2026,
        focus: 'Velocidade explosiva e suporte de desenvolvimento',
        role: 'Piloto Reserva',
        nationality: 'Japão'
      },
      {
        name: 'Ayumu Iwasa',
        number: 40,
        rating: 77,
        contractUntil: 2026,
        focus: 'Simulador avançado de Milton Keynes e ritmo consistente',
        role: 'Piloto Reserva',
        nationality: 'Japão'
      }
    ],
    technicalStaff: [
      {
        role: 'Diretor Técnico',
        name: 'Pierre Waché',
        focus: 'Plataforma mecânica, centro de gravidade e suspensão pull-rod'
      },
      {
        role: 'Chefe de Aerodinâmica',
        name: 'Enrico Balbo',
        focus: 'Efeito solo radical, difusores e controle de vórtices'
      },
      {
        role: 'Diretor de Powertrains',
        name: 'Ben Hodgkinson',
        focus: 'Integração RBPT-Ford, combustão e mapeamento híbrido MGU-K'
      }
    ],
    powerUnitSupplier: 'Red Bull Ford Powertrains 2026',
    powerUnitType: 'Fábrica Própria (Works)',
    puMetrics: [
      {
        label: 'Potência Máxima (ICE)',
        value: 88,
        tierText: 'Alto (Parceria Ford gerando boa potência em retas)',
        status: 'good'
      },
      {
        label: 'Confiabilidade Mecânica',
        value: 65,
        tierText: 'Médio-Baixo (Novo motor próprio em desenvolvimento)',
        status: 'warning'
      },
      {
        label: 'Eficiência Térmica & ERS',
        value: 78,
        tierText: 'Médio-Alto (Curva de calibração de software híbrido)',
        status: 'warning'
      }
    ],
    chassisMetrics: [
      {
        label: 'Aerodinâmica (Downforce Total)',
        value: 92,
        tierText: 'Excelente (Conceito refinado de assoalho)',
        status: 'good'
      },
      {
        label: 'Eficiência Aero (Baixo Arrasto)',
        value: 91,
        tierText: 'Excelente (Foguete de velocidade final em modo X)',
        status: 'good'
      },
      {
        label: 'Dinâmica Veicular (Suspensão)',
        value: 86,
        tierText: 'Muito Alto (Frente hiper-reativa perfeita para Verstappen)',
        status: 'good'
      },
      {
        label: 'Gestão de Pneus na Corrida',
        value: 85,
        tierText: 'Alto (Excelente equilíbrio com pouca degradação)',
        status: 'good'
      }
    ],
    tacticalAdvantage: 'Verstappen extrai pontos impossíveis e a equipe opera o pit wall e os pit stops com precisão militar.',
    tacticalVulnerability: 'Incerteza da durabilidade do novíssimo motor RBPT-Ford e segundo carro com gap para o líder.',
    contractSignText: 'ASSUMIR O COMANDO DA RED BULL RACING'
  },

  mercedes: {
    teamId: 'mercedes',
    officialFullName: 'Mercedes-AMG PETRONAS F1 Team',
    shortName: 'MER',
    carModel: 'W17',
    color: '#11141A',
    secondaryColor: '#00D2BE',
    location: 'Brackley, Reino Unido',
    country: 'Reino Unido',
    flagEmoji: '🇬🇧',
    constructorTitles: 8,
    driverTitles: 9,
    reputationStars: 5,
    reputationLabel: 'Colosso Industrial (5 Estrelas)',
    boardExpectation: 'Retornar ao Top 2 e brigar pelo Campeonato Mundial',
    boardStatus: 'Alta Exigência (Stuttgart e Toto Wolff cobram o fim do jejum de títulos)',
    boardWarning: 'Aviso: A diretoria executiva de Stuttgart exige disciplina germânica e retorno imediato ao topo.',
    historicalIntro: 'A força dominadora da era híbrida anterior com 8 títulos consecutivos de construtores. Com sede fabril em Brackley e o centro de motores em Brixworth, a Mercedes detém a maior infraestrutura de engenharia do esporte.',
    fixedDnaTags: [
      {
        icon: '🔋',
        label: 'Supremacia Híbrida Brixworth',
        description: 'A unidade de potência M17 possui a maior eficiência de recuperação de energia (ERS) do grid.',
        type: 'positive'
      },
      {
        icon: '🌟',
        label: 'A Nova Era Antonelli',
        description: 'O jovem prodígio italiano Kimi Antonelli traz velocidade assombrosa, mas riscos de acidentes novatos.',
        type: 'neutral'
      },
      {
        icon: '📐',
        label: 'Janela Operacional Estreita',
        description: 'Historicamente sensível a variações térmicas de pista; o acerto precisa ser cirúrgico.',
        type: 'negative'
      }
    ],
    drivers: [
      {
        name: 'George Russell',
        number: 63,
        rating: 91,
        contractUntil: 2027,
        focus: 'Consistência de ferro, ritmo de classificação e liderança técnica',
        role: 'Titular 1',
        nationality: 'Reino Unido'
      },
      {
        name: 'Kimi Antonelli',
        number: 12,
        rating: 82,
        contractUntil: 2026,
        focus: 'Talento puro em curvas rápidas e ultrapassagens arrojadas',
        role: 'Titular 2',
        nationality: 'Itália'
      },
      {
        name: 'Frederik Vesti',
        number: 42,
        rating: 77,
        contractUntil: 2026,
        focus: 'Simulador avançado e desenvolvimento de software',
        role: 'Piloto Reserva',
        nationality: 'Dinamarca'
      },
      {
        name: 'Doriane Pin',
        number: 28,
        rating: 75,
        contractUntil: 2026,
        focus: 'Mercedes Junior Team, precisão de telemetria e testes',
        role: 'Piloto Reserva',
        nationality: 'França'
      }
    ],
    technicalStaff: [
      {
        role: 'Diretor Técnico',
        name: 'James Allison',
        focus: 'Conceito estrutural, aerodinâmica e integridade mecânica'
      },
      {
        role: 'Diretor de Powertrain (HPP)',
        name: 'Hywel Thomas',
        focus: 'Química de e-Fuel com Petronas e inversor elétrico de 350kW'
      },
      {
        role: 'Diretor de Engenharia de Pista',
        name: 'Andrew Shovlin',
        focus: 'Telemetria em tempo real, simulação de pneus e estratégias'
      }
    ],
    powerUnitSupplier: 'Mercedes-AMG F1 M17 E-Performance',
    powerUnitType: 'Fábrica Própria (Works)',
    puMetrics: [
      {
        label: 'Potência Máxima (ICE)',
        value: 89,
        tierText: 'Muito Alto (Entrega linear de torque com e-Fuel Petronas)',
        status: 'good'
      },
      {
        label: 'Confiabilidade Mecânica',
        value: 95,
        tierText: 'Exemplar (Praticamente à prova de quebras)',
        status: 'good'
      },
      {
        label: 'Eficiência Térmica & ERS',
        value: 96,
        tierText: 'Referência Mundial (Gestão de bateria perfeita)',
        status: 'good'
      }
    ],
    chassisMetrics: [
      {
        label: 'Aerodinâmica (Downforce Total)',
        value: 86,
        tierText: 'Muito Alto (Grande carga aerodinâmica)',
        status: 'good'
      },
      {
        label: 'Eficiência Aero (Baixo Arrasto)',
        value: 84,
        tierText: 'Alto (Equilíbrio aerodinâmico sólido em retas)',
        status: 'good'
      },
      {
        label: 'Dinâmica Veicular (Suspensão)',
        value: 83,
        tierText: 'Alto (Suspensão rígida estável em frenagens)',
        status: 'good'
      },
      {
        label: 'Gestão de Pneus na Corrida',
        value: 82,
        tierText: 'Alto (Bom desgaste, sensível a asfalto muito quente)',
        status: 'good'
      }
    ],
    tacticalAdvantage: 'Melhor trem de força do grid com eletrônica imbatível e George Russell pronto para liderar.',
    tacticalVulnerability: 'Necessidade de guiar e proteger Antonelli no ano de estreia enquanto caça a McLaren.',
    contractSignText: 'ASSUMIR O COMANDO DA MERCEDES-AMG'
  },

  astonmartin: {
    teamId: 'astonmartin',
    officialFullName: 'Aston Martin Aramco F1 Team',
    shortName: 'AMR',
    carModel: 'AMR26',
    color: '#00594F',
    secondaryColor: '#38BDF8',
    location: 'Silverstone, Reino Unido',
    country: 'Reino Unido',
    flagEmoji: '🇬🇧',
    constructorTitles: 0,
    driverTitles: 2,
    reputationStars: 4,
    reputationLabel: 'Potência Emergente (4 Estrelas)',
    boardExpectation: 'Conquistar Vitórias e garantir o Top 4 no Mundial',
    boardStatus: 'Alta Pressão de Investimento (Lawrence Stroll investiu bilhões no novo campus)',
    boardWarning: 'Aviso: Lawrence Stroll exige retorno imediato do investimento bilionário no novo túnel de vento.',
    historicalIntro: 'Com o novíssimo campus tecnológico em Silverstone, motor de fábrica exclusivo da Honda HRC e a contratação lendária de Adrian Newey, a Aston Martin possui todos os ingredientes para ser campeã mundial.',
    fixedDnaTags: [
      {
        icon: '🧠',
        label: 'O Toque de Adrian Newey',
        description: 'Desenvolvimento aerodinâmico revolucionário para o regulamento 2026.',
        type: 'positive'
      },
      {
        icon: '🇯🇵',
        label: 'Parceria Exclusiva Honda HRC',
        description: 'Status de equipe de fábrica oficial da Honda após o domínio com a Red Bull.',
        type: 'positive'
      },
      {
        icon: '👔',
        label: 'Vínculo Familiar Stroll',
        description: 'Vaga de Lance Stroll intocável, o que limita opções táticas de mercado.',
        type: 'negative'
      }
    ],
    drivers: [
      {
        name: 'Fernando Alonso',
        number: 14,
        rating: 92,
        contractUntil: 2026,
        focus: 'Leitura tática impecável, defesas lendárias e determinação implacável',
        role: 'Titular 1',
        nationality: 'Espanha'
      },
      {
        name: 'Lance Stroll',
        number: 18,
        rating: 79,
        contractUntil: 2027,
        focus: 'Largadas agressivas e ritmo em chuva torrencial',
        role: 'Titular 2',
        nationality: 'Canadá'
      },
      {
        name: 'Jak Crawford',
        number: 7,
        rating: 76,
        contractUntil: 2026,
        focus: 'Jovem talento americano em ascensão na F2',
        role: 'Piloto Reserva',
        nationality: 'Estados Unidos'
      },
      {
        name: 'Stoffel Vandoorne',
        number: 2,
        rating: 79,
        contractUntil: 2026,
        focus: 'Experiência em simulador e calibração de sistemas híbridos',
        role: 'Piloto Reserva',
        nationality: 'Bélgica'
      }
    ],
    technicalStaff: [
      {
        role: 'Managing Technical Partner',
        name: 'Adrian Newey',
        focus: 'Conceito aerodinâmico global, dinâmica de fluidos e efeito solo'
      },
      {
        role: 'Diretor Técnico',
        name: 'Dan Fallows',
        focus: 'Túnel de vento próprio, validação de CFD e fluxo de ar'
      },
      {
        role: 'Group CEO',
        name: 'Andy Cowell',
        focus: 'Coordenação com Honda HRC e governança fabril'
      }
    ],
    powerUnitSupplier: 'Honda HRC Works 2026',
    powerUnitType: 'Fábrica Própria (Works)',
    puMetrics: [
      {
        label: 'Potência Máxima (ICE)',
        value: 87,
        tierText: 'Muito Alto (Tradição e potência comprovada da Honda)',
        status: 'good'
      },
      {
        label: 'Confiabilidade Mecânica',
        value: 88,
        tierText: 'Alto (Confiabilidade japonesa robusta)',
        status: 'good'
      },
      {
        label: 'Eficiência Térmica & ERS',
        value: 91,
        tierText: 'Excelente (BMS e MGU-K calibrados pela HRC)',
        status: 'good'
      }
    ],
    chassisMetrics: [
      {
        label: 'Aerodinâmica (Downforce Total)',
        value: 89,
        tierText: 'Muito Alto (Influência aerodinâmica do novo túnel de vento)',
        status: 'good'
      },
      {
        label: 'Eficiência Aero (Baixo Arrasto)',
        value: 82,
        tierText: 'Alto (Bom desempenho de reta com asas ativas)',
        status: 'good'
      },
      {
        label: 'Dinâmica Veicular (Suspensão)',
        value: 81,
        tierText: 'Alto (Boa tração em saídas de curva lenta)',
        status: 'good'
      },
      {
        label: 'Gestão de Pneus na Corrida',
        value: 80,
        tierText: 'Médio-Alto (Alonso compensa qualquer desgaste)',
        status: 'good'
      }
    ],
    tacticalAdvantage: 'Adrian Newey desenhando o carro e Honda fornecendo motores exclusivos com campus de última geração.',
    tacticalVulnerability: 'Pressão extrema de Lawrence Stroll e disparidade de pontuação entre os dois carros.',
    contractSignText: 'ASSUMIR O COMANDO DA ASTON MARTIN'
  },

  williams: {
    teamId: 'williams',
    officialFullName: 'Williams Racing',
    shortName: 'WIL',
    carModel: 'FW48',
    color: '#0047AB',
    secondaryColor: '#D4D8DF',
    location: 'Grove, Reino Unido',
    country: 'Reino Unido',
    flagEmoji: '🇬🇧',
    constructorTitles: 9,
    driverTitles: 7,
    reputationStars: 3,
    reputationLabel: 'Glória Histórica em Reconstrução (3 Estrelas)',
    boardExpectation: 'Liderar o pelotão intermediário e lutar por Top 5',
    boardStatus: 'Paciência Estratégica (Dorilton Capital apoia plano plurianual de James Vowles)',
    boardWarning: 'Aviso: A diretoria exige progresso contínuo e consolidação financeira sob o Cost Cap.',
    historicalIntro: 'Uma das quatro escuderias mais lendárias da Fórmula 1. Fundada por Sir Frank Williams, a equipe passou por anos sombrios, mas agora renasce sob gestão moderna, trazendo Carlos Sainz para liderar o retorno ao topo.',
    fixedDnaTags: [
      {
        icon: '🏆',
        label: 'Espírito Resiliente de Garagem',
        description: 'Cultura histórica de superação que eleva o moral em corridas de resistência e chuva.',
        type: 'positive'
      },
      {
        icon: '🇪🇸',
        label: 'Liderança Técnica de Sainz',
        description: 'Carlos Sainz atua como verdadeiro engenheiro dentro do cockpit, acelerando o desenvolvimento.',
        type: 'positive'
      },
      {
        icon: '🏗️',
        label: 'Infraestrutura em Modernização',
        description: 'Sistemas ERP e simuladores ainda em processo de atualização para os padrões das montadoras.',
        type: 'negative'
      }
    ],
    drivers: [
      {
        name: 'Carlos Sainz',
        number: 55,
        rating: 90,
        contractUntil: 2027,
        focus: 'Feedback cirúrgico aos engenheiros, acerto de corrida e inteligência tática',
        role: 'Titular 1',
        nationality: 'Espanha'
      },
      {
        name: 'Alexander Albon',
        number: 23,
        rating: 85,
        contractUntil: 2027,
        focus: 'Velocidade em voltas lançadas e defesas obstinadas em retas',
        role: 'Titular 2',
        nationality: 'Tailândia'
      },
      {
        name: 'Luke Browning',
        number: 14,
        rating: 77,
        contractUntil: 2026,
        focus: 'Williams Racing Driver Academy e ritmo veloz na F2',
        role: 'Piloto Reserva',
        nationality: 'Reino Unido'
      },
      {
        name: 'Victor Martins',
        number: 1,
        rating: 77,
        contractUntil: 2026,
        focus: 'Campeão da F3 com forte experiência em monomarcas',
        role: 'Piloto Reserva',
        nationality: 'França'
      }
    ],
    technicalStaff: [
      {
        role: 'Diretor Técnico',
        name: 'Pat Fry',
        focus: 'Metodologias industriais, redução de peso e robustez de suspensão'
      },
      {
        role: 'Team Principal & Estratégia',
        name: 'James Vowles',
        focus: 'Cultura corporativa, governança e planos de longo prazo'
      },
      {
        role: 'Diretor Esportivo',
        name: 'Sven Smeets',
        focus: 'Operação de pista e academia de pilotos'
      }
    ],
    powerUnitSupplier: 'Mercedes-AMG F1 M17 E-Performance Cliente',
    powerUnitType: 'Motor Cliente',
    puMetrics: [
      {
        label: 'Potência Máxima (ICE)',
        value: 85,
        tierText: 'Alto (Fornecimento padrão de fábrica Mercedes)',
        status: 'good'
      },
      {
        label: 'Confiabilidade Mecânica',
        value: 91,
        tierText: 'Muito Alto (Zero quebras de powertrain)',
        status: 'good'
      },
      {
        label: 'Eficiência Térmica & ERS',
        value: 89,
        tierText: 'Alto (Pacote híbrido eficiente e seguro)',
        status: 'good'
      }
    ],
    chassisMetrics: [
      {
        label: 'Aerodinâmica (Downforce Total)',
        value: 74,
        tierText: 'Médio (Déficit em curvas de baixa velocidade)',
        status: 'warning'
      },
      {
        label: 'Eficiência Aero (Baixo Arrasto)',
        value: 88,
        tierText: 'Excelente (Foguete de reta em Monza, Baku e Spa)',
        status: 'good'
      },
      {
        label: 'Dinâmica Veicular (Suspensão)',
        value: 76,
        tierText: 'Médio (Comportamento instável em curvas combinadas)',
        status: 'warning'
      },
      {
        label: 'Gestão de Pneus na Corrida',
        value: 77,
        tierText: 'Médio (Tendência a superaquecer pneus traseiros)',
        status: 'warning'
      }
    ],
    tacticalAdvantage: 'Dupla de pilotos muito forte (Sainz + Albon) com velocidade final assombrosa e motor blindado.',
    tacticalVulnerability: 'Falta de downforce em circuitos travados e instalações fabris ainda em modernização.',
    contractSignText: 'ASSUMIR O COMANDO DA WILLIAMS RACING'
  },

  alpine: {
    teamId: 'alpine',
    officialFullName: 'BWT Alpine F1 Team',
    shortName: 'ALP',
    carModel: 'A526',
    color: '#007BFF',
    secondaryColor: '#F458B0',
    location: 'Enstone, Reino Unido',
    country: 'França',
    flagEmoji: '🇫🇷',
    constructorTitles: 2,
    driverTitles: 2,
    reputationStars: 3,
    reputationLabel: 'Equipe Intermediária em Transição (3 Estrelas)',
    boardExpectation: 'Alcançar o Top 6 e pontuar com regularidade',
    boardStatus: 'Instável (Histórico de trocas constantes de chefia sob supervisão de Flavio Briatore)',
    boardWarning: 'Aviso: Flavio Briatore e o conselho da Renault toleram poucos erros e exigem pódios oportunistas.',
    historicalIntro: 'A lendária base de Enstone (campeã com Benetton e Renault nos anos 90 e 2000). A equipe passa por uma guinada histórica ao abandonar os motores Renault de Viry-Châtillon para adotar motores Mercedes cliente.',
    fixedDnaTags: [
      {
        icon: '🔄',
        label: 'Revolução de Motores Mercedes',
        description: 'Ganho imediato de confiabilidade e potência após anos de déficit técnico.',
        type: 'positive'
      },
      {
        icon: '🌪️',
        label: 'Instabilidade de Gestão',
        description: 'Pressão constante de acionistas e mudanças de organograma geram atrito na fábrica.',
        type: 'negative'
      },
      {
        icon: '🇦🇷',
        label: 'Fator Franco Colapinto',
        description: 'A torcida sul-americana injeta um fluxo massivo de audiência e patrocinadores na equipe.',
        type: 'positive'
      }
    ],
    drivers: [
      {
        name: 'Pierre Gasly',
        number: 10,
        rating: 85,
        contractUntil: 2026,
        focus: 'Determinação sob pressão e ritmo de corrida sólido',
        role: 'Titular 1',
        nationality: 'França'
      },
      {
        name: 'Franco Colapinto',
        number: 43,
        rating: 81,
        contractUntil: 2026,
        focus: 'Ultrapassagens destemidas e forte tração comercial',
        role: 'Titular 2',
        nationality: 'Argentina'
      },
      {
        name: 'Paul Aron',
        number: 17,
        rating: 78,
        contractUntil: 2026,
        focus: 'Velocidade consistente e trabalho de simulador',
        role: 'Piloto Reserva',
        nationality: 'Estônia'
      },
      {
        name: 'Kush Maini',
        number: 9,
        rating: 75,
        contractUntil: 2026,
        focus: 'Alpine Academy com experiência ampla na F2',
        role: 'Piloto Reserva',
        nationality: 'Índia'
      }
    ],
    technicalStaff: [
      {
        role: 'Diretor Técnico Executivo',
        name: 'David Sanchez',
        focus: 'Aerodinâmica de assoalho e integração de chassi'
      },
      {
        role: 'Supervisor Executivo',
        name: 'Flavio Briatore',
        focus: 'Negociações de paddock, alianças comerciais e pressão interna'
      },
      {
        role: 'Team Principal Operacional',
        name: 'Oliver Oakes',
        focus: 'Gestão da garagem e motivação dos mecânicos'
      }
    ],
    powerUnitSupplier: 'Mercedes-AMG F1 M17 E-Performance Cliente',
    powerUnitType: 'Motor Cliente',
    puMetrics: [
      {
        label: 'Potência Máxima (ICE)',
        value: 85,
        tierText: 'Alto (Pacote competitivo fornecido por Brixworth)',
        status: 'good'
      },
      {
        label: 'Confiabilidade Mecânica',
        value: 90,
        tierText: 'Muito Alto (Elimina o calvário de quebras do motor antigo)',
        status: 'good'
      },
      {
        label: 'Eficiência Térmica & ERS',
        value: 88,
        tierText: 'Alto (Pacote elétrico de referência)',
        status: 'good'
      }
    ],
    chassisMetrics: [
      {
        label: 'Aerodinâmica (Downforce Total)',
        value: 75,
        tierText: 'Médio (Em processo de reconstrução aerodinâmica)',
        status: 'warning'
      },
      {
        label: 'Eficiência Aero (Baixo Arrasto)',
        value: 76,
        tierText: 'Médio (Arrasto aceitável em retas)',
        status: 'warning'
      },
      {
        label: 'Dinâmica Veicular (Suspensão)',
        value: 74,
        tierText: 'Médio (Dificuldade de manter a altura de rodagem constante)',
        status: 'warning'
      },
      {
        label: 'Gestão de Pneus na Corrida',
        value: 75,
        tierText: 'Médio (Sofre em pistas com alta degradação térmica)',
        status: 'warning'
      }
    ],
    tacticalAdvantage: 'Motor Mercedes confiável e onda colossal de patrocínios impulsionada por Colapinto e Gasly.',
    tacticalVulnerability: 'Cultura interna fragilizada por trocas de comando e chassi que precisa de desenvolvimento acelerado.',
    contractSignText: 'ASSUMIR O COMANDO DA BWT ALPINE'
  },

  audi: {
    teamId: 'audi',
    officialFullName: 'Audi Revolut F1 Team',
    shortName: 'AUD',
    carModel: 'Revolut R26',
    color: '#8E95A0',
    secondaryColor: '#FF1A2D',
    location: 'Hinwil, Suíça',
    country: 'Alemanha',
    flagEmoji: '🇩🇪',
    constructorTitles: 0,
    driverTitles: 0,
    reputationStars: 3,
    reputationLabel: 'Nova Montadora Oficial (3 Estrelas)',
    boardExpectation: 'Construir as bases para disputar o Top 5 até o 2º ano',
    boardStatus: 'Metódica (Ingolstadt possui orçamento robusto, mas cobra métricas germânicas)',
    boardWarning: 'Aviso: A diretoria da Audi exige profissionalismo absoluto e tolerância zero com desperdício.',
    historicalIntro: 'A aguardada estreia da Audi como fabricante plena na Fórmula 1, assumindo a estrutura da lendária Sauber em Hinwil e operando com a nova unidade de potência desenvolvida no centro de Neuburg, Alemanha.',
    fixedDnaTags: [
      {
        icon: '🇩🇪',
        label: 'Padrão Industrial Audi',
        description: 'Orçamento substancial e precisão de engenharia alemã com túnel de vento alpino de classe mundial.',
        type: 'positive'
      },
      {
        icon: '🇧🇷',
        label: 'Lapidação de Gabriel Bortoleto',
        description: 'O campeão de F3 e prodígio brasileiro é o investimento de futuro para a montadora.',
        type: 'positive'
      },
      {
        icon: '⏳',
        label: 'Motor Inédito Neuburg',
        description: 'Primeira experiência da Audi no regulamento 2026; a integração exige paciência.',
        type: 'negative'
      }
    ],
    drivers: [
      {
        name: 'Nico Hülkenberg',
        number: 27,
        rating: 84,
        contractUntil: 2026,
        focus: 'Experiência colossal, ritmo de classificação exemplar e segurança',
        role: 'Titular 1',
        nationality: 'Alemanha'
      },
      {
        name: 'Gabriel Bortoleto',
        number: 5,
        rating: 81,
        contractUntil: 2027,
        focus: 'Ultrapassagens calculadas, agressividade e leitura de telemetria',
        role: 'Titular 2',
        nationality: 'Brasil'
      }
    ],
    technicalStaff: [
      {
        role: 'Chief Operating & Chief Technical Officer',
        name: 'Mattia Binotto',
        focus: 'Coordenação total entre Hinwil (chassi) e Neuburg (motor)'
      },
      {
        role: 'Diretor Técnico',
        name: 'James Key',
        focus: 'Conceito mecânico do chassi e eficiência de fluxo de ar'
      },
      {
        role: 'Team Principal de Pista',
        name: 'Jonathan Wheatley',
        focus: 'Operação de garagem, autoridade desportiva e pit stops de elite'
      }
    ],
    powerUnitSupplier: 'Audi F1 Neuburg Power Unit',
    powerUnitType: 'Fábrica Própria (Works)',
    puMetrics: [
      {
        label: 'Potência Máxima (ICE)',
        value: 80,
        tierText: 'Médio (Novo motor germânico em fase de otimização)',
        status: 'warning'
      },
      {
        label: 'Confiabilidade Mecânica',
        value: 74,
        tierText: 'Médio (Testes de durabilidade em curso)',
        status: 'warning'
      },
      {
        label: 'Eficiência Térmica & ERS',
        value: 82,
        tierText: 'Alto (Tradição e vanguarda em motores híbridos de Le Mans)',
        status: 'good'
      }
    ],
    chassisMetrics: [
      {
        label: 'Aerodinâmica (Downforce Total)',
        value: 76,
        tierText: 'Médio (Túnel de Hinwil gerando boa correlação inicial)',
        status: 'warning'
      },
      {
        label: 'Eficiência Aero (Baixo Arrasto)',
        value: 78,
        tierText: 'Médio-Alto (Linhas limpas inspiradas nos LMP1)',
        status: 'good'
      },
      {
        label: 'Dinâmica Veicular (Suspensão)',
        value: 77,
        tierText: 'Médio (Estabilidade decente sobre asfalto irregular)',
        status: 'warning'
      },
      {
        label: 'Gestão de Pneus na Corrida',
        value: 78,
        tierText: 'Médio (Hülkenberg extrai o máximo da borracha Pirelli)',
        status: 'good'
      }
    ],
    tacticalAdvantage: 'Apoio corporativo maciço da Audi com dupla perfeita mesclando a experiência de Hülkenberg e o talento puro de Bortoleto.',
    tacticalVulnerability: 'Fase de nascimento do motor próprio em Neuburg demandando tempo de calibração.',
    contractSignText: 'ASSUMIR O COMANDO DA AUDI F1 TEAM'
  },

  haas: {
    teamId: 'haas',
    officialFullName: 'MoneyGram Haas F1 Team',
    shortName: 'HAA',
    carModel: 'VF-26',
    color: '#F2F4F7',
    secondaryColor: '#DA291C',
    location: 'Kannapolis, EUA & Banbury, UK',
    country: 'Estados Unidos',
    flagEmoji: '🇺🇸',
    constructorTitles: 0,
    driverTitles: 0,
    reputationStars: 2,
    reputationLabel: 'Equipe de Sobrevivência (2 Estrelas)',
    boardExpectation: 'Fugir do fundo do grid e pontuar com frequência no Top 10',
    boardStatus: 'Econômica (Gene Haas exige operação rigorosamente dentro do orçamento)',
    boardWarning: 'Aviso: Gene Haas não aceita quebras financeiras e cobra pontos rápidos.',
    historicalIntro: 'A equipe norte-americana de Gene Haas opera no modelo mais enxuto da Fórmula 1, utilizando forte parceria técnica com a Ferrari e a Dallara para maximizar cada dólar gasto.',
    fixedDnaTags: [
      {
        icon: '💵',
        label: 'Operação Ultra-Enxuta',
        description: 'Modelo terceirizado que permite focar 100% dos recursos nas corridas.',
        type: 'positive'
      },
      {
        icon: '🥊',
        label: 'Esteban Ocon na Liderança',
        description: 'Vencedor de GP trazendo competitividade feroz para a pista.',
        type: 'neutral'
      },
      {
        icon: '📉',
        label: 'Ritmo Lento de Upgrades',
        description: 'Menos recursos fabris próprios para produzir grandes pacotes no meio do ano.',
        type: 'negative'
      }
    ],
    drivers: [
      {
        name: 'Esteban Ocon',
        number: 31,
        rating: 84,
        contractUntil: 2026,
        focus: 'Defesas agressivas de posição e consistência em corridas caóticas',
        role: 'Titular 1',
        nationality: 'França'
      },
      {
        name: 'Oliver Bearman',
        number: 87,
        rating: 80,
        contractUntil: 2027,
        focus: 'Velocidade bruta e arrojo em ultrapassagens',
        role: 'Titular 2',
        nationality: 'Reino Unido'
      },
      {
        name: 'Ryo Hirakawa',
        number: 15,
        rating: 76,
        contractUntil: 2026,
        focus: 'Piloto Toyota Gazoo Racing, simulador e testes técnicos',
        role: 'Piloto Reserva',
        nationality: 'Japão'
      },
      {
        name: 'Jack Doohan',
        number: 7,
        rating: 78,
        contractUntil: 2026,
        focus: 'Piloto de testes experiente com ritmo veloz de volta lançada',
        role: 'Piloto Reserva',
        nationality: 'Austrália'
      },
      {
        name: 'Rafael Câmara',
        number: 5,
        rating: 77,
        contractUntil: 2027,
        focus: 'Campeão F3 / Destaque F2 pré-contratado para 2027 (estreia antecipável em São Paulo)',
        role: 'Piloto Reserva',
        nationality: 'Brasil'
      }
    ],
    technicalStaff: [
      {
        role: 'Team Principal',
        name: 'Ayao Komatsu',
        focus: 'Comunicação direta, foco em engenharia prática e moral da garagem'
      },
      {
        role: 'Diretor Técnico',
        name: 'Andrea De Zordo',
        focus: 'Integração de componentes Ferrari e aerodinâmica Dallara'
      }
    ],
    powerUnitSupplier: 'Ferrari 067/3 Superfast 2026 Cliente',
    powerUnitType: 'Motor Cliente',
    puMetrics: [
      {
        label: 'Potência Máxima (ICE)',
        value: 90,
        tierText: 'Muito Alto (Mesmo motor forte da Ferrari oficial)',
        status: 'good'
      },
      {
        label: 'Confiabilidade Mecânica',
        value: 70,
        tierText: 'Médio (Depende da gestão de refrigeração da Haas)',
        status: 'warning'
      },
      {
        label: 'Eficiência Térmica & ERS',
        value: 80,
        tierText: 'Alto (Pacote híbrido robusto)',
        status: 'good'
      }
    ],
    chassisMetrics: [
      {
        label: 'Aerodinâmica (Downforce Total)',
        value: 72,
        tierText: 'Médio-Baixo (Carro sofre em curvas sustentadas longas)',
        status: 'warning'
      },
      {
        label: 'Eficiência Aero (Baixo Arrasto)',
        value: 84,
        tierText: 'Alto (Excelente em freadas e retas curtas)',
        status: 'good'
      },
      {
        label: 'Dinâmica Veicular (Suspensão)',
        value: 75,
        tierText: 'Médio (Peças Ferrari garantem boa absorção)',
        status: 'warning'
      },
      {
        label: 'Gestão de Pneus na Corrida',
        value: 71,
        tierText: 'Médio-Baixo (Tende a cozinhar os pneus se andar no tráfego)',
        status: 'critical'
      }
    ],
    tacticalAdvantage: 'Motor Ferrari potente com baixo custo fixo e pilotos com fome de mostrar serviço.',
    tacticalVulnerability: 'Dificuldade crônica em trazer melhorias no decorrer do ano e superaquecimento de pneus.',
    contractSignText: 'ASSUMIR O COMANDO DA MONEYGRAM HAAS'
  },

  rb: {
    teamId: 'rb',
    officialFullName: 'Visa Cash App Racing Bulls',
    shortName: 'VCARB',
    carModel: 'VCARB03',
    color: '#F1F3F6',
    secondaryColor: '#1634CB',
    location: 'Faenza, Itália & Milton Keynes, UK',
    country: 'Itália',
    flagEmoji: '🇮🇹',
    constructorTitles: 0,
    driverTitles: 0,
    reputationStars: 3,
    reputationLabel: 'Escola de Jovens Talentos (3 Estrelas)',
    boardExpectation: 'Formar pilotos para a Red Bull principal e pontuar no pelotão intermediário',
    boardStatus: 'Supervisionada (Helmut Marko acompanha cada telemetria com olhar de falcão)',
    boardWarning: 'Aviso: Pilotos e Team Principal são avaliados sob critérios estritos de formação desportiva.',
    historicalIntro: 'A lendária equipe de Faenza (antiga Minardi e Toro Rosso) que revelou Sebastian Vettel e Max Verstappen. Opera com sinergia técnica ampliada com a Red Bull Technology.',
    fixedDnaTags: [
      {
        icon: '🎓',
        label: 'Academia Red Bull Junior',
        description: 'Acesso prioritário às jovens estrelas mais promissoras do automobilismo mundial.',
        type: 'positive'
      },
      {
        icon: '🔧',
        label: 'Sinergia com Milton Keynes',
        description: 'Compartilhamento de suspensão e peças permitidas com o time principal da Red Bull.',
        type: 'positive'
      },
      {
        icon: '🚪',
        label: 'Rotatividade Constante',
        description: 'Pilotos que se destacam são promovidos rapidamente para a Red Bull, exigindo reconstrução.',
        type: 'negative'
      }
    ],
    drivers: [
      {
        name: 'Liam Lawson',
        number: 30,
        rating: 83,
        contractUntil: 2026,
        focus: 'Combate corpo a corpo, consistência de pontuação e reflexos afiados',
        role: 'Titular 1',
        nationality: 'Nova Zelândia'
      },
      {
        name: 'Arvid Lindblad',
        number: 41,
        rating: 78,
        contractUntil: 2027,
        focus: 'Prodígio Red Bull Junior de 18 anos com velocidade assombrosa',
        role: 'Titular 2',
        nationality: 'Reino Unido'
      },
      {
        name: 'Yuki Tsunoda',
        number: 22,
        rating: 83,
        contractUntil: 2026,
        focus: 'Piloto de referência e suporte de telemetria rápida',
        role: 'Piloto Reserva',
        nationality: 'Japão'
      },
      {
        name: 'Ayumu Iwasa',
        number: 40,
        rating: 77,
        contractUntil: 2026,
        focus: 'Simulador e ritmo constante em treinos livres',
        role: 'Piloto Reserva',
        nationality: 'Japão'
      }
    ],
    technicalStaff: [
      {
        role: 'Team Principal',
        name: 'Laurent Mekies',
        focus: 'Disciplina de garagem, governança FIA e moral do time'
      },
      {
        role: 'Diretor Técnico',
        name: 'Jody Egginton',
        focus: 'Integração de suspensão e dinâmica de corrida'
      }
    ],
    powerUnitSupplier: 'Red Bull Ford Powertrains Cliente',
    powerUnitType: 'Motor Cliente',
    puMetrics: [
      {
        label: 'Potência Máxima (ICE)',
        value: 86,
        tierText: 'Alto (Novo motor compartilhado com a equipe matriz)',
        status: 'good'
      },
      {
        label: 'Confiabilidade Mecânica',
        value: 67,
        tierText: 'Médio (Risco de adaptação de novo powertrain)',
        status: 'warning'
      },
      {
        label: 'Eficiência Térmica & ERS',
        value: 76,
        tierText: 'Médio-Alto (Mapeamentos sendo refinados)',
        status: 'warning'
      }
    ],
    chassisMetrics: [
      {
        label: 'Aerodinâmica (Downforce Total)',
        value: 78,
        tierText: 'Médio (Bom desempenho em curvas de baixa)',
        status: 'good'
      },
      {
        label: 'Eficiência Aero (Baixo Arrasto)',
        value: 80,
        tierText: 'Médio-Alto (Boa velocidade de reta)',
        status: 'good'
      },
      {
        label: 'Dinâmica Veicular (Suspensão)',
        value: 82,
        tierText: 'Alto (Geometria herdada de Milton Keynes)',
        status: 'good'
      },
      {
        label: 'Gestão de Pneus na Corrida',
        value: 76,
        tierText: 'Médio (Boa velocidade em classificação)',
        status: 'warning'
      }
    ],
    tacticalAdvantage: 'Suspensão de primeira linha com sinergia Red Bull e espírito jovem e combativo na pista.',
    tacticalVulnerability: 'Dependência das decisões da chefia austríaca sobre quem senta no cockpit.',
    contractSignText: 'ASSUMIR O COMANDO DA RACING BULLS'
  },
  cadillac: {
    teamId: 'cadillac',
    officialFullName: 'Cadillac Formula 1 Team',
    shortName: 'CAD',
    carModel: 'MAC-26',
    color: '#16171D',
    secondaryColor: '#C59B38',
    location: 'Fishers, Indiana, EUA',
    country: 'Estados Unidos',
    flagEmoji: '🇺🇸',
    constructorTitles: 0,
    driverTitles: 0,
    reputationStars: 3,
    reputationLabel: 'Nova Potência Corporativa (3 Estrelas)',
    boardExpectation: 'Marcar pontos consistentes e consolidar a presença no meio do pelotão na temporada de estreia',
    boardStatus: 'Apoio Total da GM (Orçamento sólido e suporte executivo de Detroit)',
    boardWarning: 'Aviso: A diretoria da General Motors e a cúpula técnica exigem profissionalismo imediato e evolução corrida a corrida.',
    historicalIntro: 'A consagração do sonho americano no grid da Fórmula 1. Respaldada pelo poderio industrial da General Motors e a herança do automobilismo americano, a Cadillac estreia como a 11ª escuderia do grid. Utilizando motores Ferrari clientes nesta fase inaugural antes de sua unidade própria em 2028, a equipe traz pilotos arrojados e engenheiros laureados para desafiar os tradicionais construtores europeus.',
    fixedDnaTags: [
      {
        icon: '🇺🇸',
        label: 'Mercado e Patrocínio Norte-Americano',
        description: '+18% Receita comercial e facilidade em fechar cotas de patrocínio com multinacionais de tecnologia e finanças.',
        type: 'positive'
      },
      {
        icon: '🔋',
        label: 'Transição GM Powertrain 2028',
        description: 'Parceria cliente de curto prazo com a Ferrari enquanto o departamento de motores de Detroit prepara o motor oficial.',
        type: 'neutral'
      },
      {
        icon: '⏱️',
        label: 'Desafio Operacional de Estreia',
        description: 'Mecânicos e equipe de garagem ainda em processo de entrosamento em paradas de box nos primeiros GPs.',
        type: 'negative'
      }
    ],
    drivers: [
      {
        name: 'Sergio Pérez',
        number: 11,
        rating: 83,
        contractUntil: 2027,
        focus: 'Gestão de pneus de mestre, defesa feroz de posição e ritmo de corrida veterano',
        role: 'Titular 1',
        nationality: 'México'
      },
      {
        name: 'Valtteri Bottas',
        number: 77,
        rating: 83,
        contractUntil: 2027,
        focus: 'Velocidade limpa em classificação, precisão mecânica e liderança experiente',
        role: 'Titular 2',
        nationality: 'Finlândia'
      },
      {
        name: 'Zhou Guanyu',
        number: 24,
        rating: 78,
        contractUntil: 2026,
        focus: 'Precisão em simulador, trabalho de setup e suporte de telemetria',
        role: 'Piloto Reserva',
        nationality: 'China'
      },
      {
        name: 'Colton Herta',
        number: 26,
        rating: 80,
        contractUntil: 2027,
        focus: 'Estrela americana da F2 (Hitech TGR), velocidade bruta e agressividade',
        role: 'Piloto Reserva',
        nationality: 'Estados Unidos'
      }
    ],
    technicalStaff: [
      {
        role: 'Team Principal',
        name: 'Graeme Lowdon',
        focus: 'Operações de pista, governança regulatória e estabilidade de gestão'
      },
      {
        role: 'Diretor Técnico',
        name: 'Nick Chester',
        focus: 'Conceito estrutural do chassi, homologação de crash-test e dinâmica CFD'
      },
      {
        role: 'Diretor de Operações',
        name: 'Rob White',
        focus: 'Estruturação da fábrica de Fishers e Silverstone e logística transatlântica'
      }
    ],
    powerUnitSupplier: 'Ferrari Powertrains Cliente',
    powerUnitType: 'Motor Cliente',
    puMetrics: [
      {
        label: 'Potência Máxima (ICE)',
        value: 88,
        tierText: 'Muito Alto (Mesmo bloco vitorioso da Ferrari de fábrica)',
        status: 'good'
      },
      {
        label: 'Confiabilidade Mecânica',
        value: 78,
        tierText: 'Médio-Alto (Pacote robusto fornecido de Maranello)',
        status: 'good'
      },
      {
        label: 'Eficiência Térmica & ERS',
        value: 80,
        tierText: 'Alto (Excelente recuperação de 350kW da MGU-K)',
        status: 'good'
      }
    ],
    chassisMetrics: [
      {
        label: 'Aerodinâmica (Downforce Total)',
        value: 75,
        tierText: 'Médio (Primeira iteração de túnel de vento em escala real)',
        status: 'warning'
      },
      {
        label: 'Eficiência Aero (Baixo Arrasto)',
        value: 78,
        tierText: 'Médio-Alto (Carro desenhado para alta velocidade em retas)',
        status: 'good'
      },
      {
        label: 'Dinâmica Veicular (Suspensão)',
        value: 76,
        tierText: 'Médio (Pacote padrão com margem para desenvolvimento)',
        status: 'warning'
      },
      {
        label: 'Gestão de Pneus na Corrida',
        value: 80,
        tierText: 'Alto (Otimizado para o estilo suave de condução de Pérez)',
        status: 'good'
      }
    ],
    tacticalAdvantage: 'Força financeira corporativa colossal e uma dupla de pilotos que equilibra a liderança madura de Pérez com a energia jovem de Herta.',
    tacticalVulnerability: 'Falta de banco de dados histórico de telemetria em circuitos do calendário na primeira temporada.',
    contractSignText: 'ASSUMIR O COMANDO DA CADILLAC F1'
  }
};
