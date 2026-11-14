import { CharacterId, NarrativeMessage } from './NarrativeAssistantDispatch';
import { CustomerEngineSupplier } from './OnboardingFlow';
import { HQOption } from '../../data/headquartersData';
import { PrincipalBackgroundOption } from '../../data/principalBackgroundsData';
import {
  CareerPath,
  CarPhilosophy,
  FuelPartnerId,
  EngineOrigin
} from '../../types/f1';

export type FactoryId = 'porsche' | 'cosworth' | 'renault' | 'bmw' | 'toyota';


// FASE 1: LEGADO & IDENTIDADE
export function getPhase1Narrative(
  careerPath: CareerPath,
  selectedHq?: HQOption,
  selectedBg?: PrincipalBackgroundOption,
  teamName: string = ''
): { primary: NarrativeMessage; secondary: NarrativeMessage[] } {
  if (careerPath === 'real_team') {
    return {
      primary: {
        characterId: 'helena_vance',
        prefix: '[DIRETRIZ CORPORATIVA · CONSELHO ADMINISTRATIVO]',
        quote:
          'Assumir uma das 11 gigantes históricas do grid é o caminho da glória imediata, mas sem margem para amadores. Você herda infraestrutura de ponta e um DNA vitorioso, porém o Conselho Administrativo não terá piedade: se os resultados em pista despencarem ou a moral da fábrica ruir, sua demissão será assinada antes da pausa de verão.',
        technicalDetails: [
          'Estatuto de Governança FIA: Risco de Demissão Ativo por performance',
          'Instalações e túnel de vento pré-existentes de nível intermediário/alto',
          'Pilotos titulares e contratos de patrocínio vigentes herdados'
        ],
        alert: {
          type: 'warning',
          text: 'Atenção, Chefe: Como Team Principal contratado, você responde diretamente ao Conselho da montadora.'
        }
      },
      secondary: [
        {
          characterId: 'fia_terminal',
          prefix: '[TERMINAL FIA · REGISTRO DE CONTRATO]',
          quote:
            'Protocolo de Transição FIA Art. 2.1: A credencial oficial de Team Principal está vinculada às metas anuais do Construtor. Metas de pontuação serão revisadas a cada quatro Grandes Prêmios.',
          technicalDetails: [
            'Avaliação de Confiança do Conselho: 0 a 100%',
            'Demitido caso a confiança atinja 0% em avaliações consecutivas'
          ]
        }
      ]
    };
  }

  // Caminho B: Criar do zero
  let hqComment =
    'Defina a sede tecnológica da sua fábrica. Cada polo do motorsport oferece vantagens cruciais e ônus logísticos que impactam o teto de gastos.';
  if (selectedHq) {
    hqComment = `${selectedHq.name}: ${selectedHq.bonus} No entanto, ${selectedHq.onus}.`;
  }

  let bgComment =
    'O seu histórico profissional definirá a cultura e o DNA inicial da fábrica desde o primeiro dia.';
  if (selectedBg) {
    bgComment = `Perfil ${selectedBg.name}: ${selectedBg.bonus} Em contrapartida, ${selectedBg.onus}.`;
  }

  return {
    primary: {
      characterId: 'hr_director',
      prefix: '[MOTOR E NARRADOR · INÍCIO DE CARREIRA]',
      quote:
        'Excelente escolha, Chefe! Construir algo do zero é o maior desafio que alguém pode assumir na Fórmula 1®. Sem herança, sem troféus herdados na sala, apenas o seu capital inicial, a sua visão e a pressão implacável do paddock. Como Dono da 12ª Construtora, você não pode ser demitido, mas cada centavo sai do seu risco pessoal.',
      technicalDetails: [
        'Estatuto de Construtor: 100% de autonomia executiva e propriedade da equipe',
        'Fábrica e Túnel de Vento iniciam no Nível 1 (Galpão Inicial)',
        'Teto Orçamentário Integral de $135.0M disponível para o ano'
      ],
      alert: {
        type: 'success',
        text: 'A FIA aprovou a inscrição da 12ª vaga no grid. Agora precisamos homologar sua identidade oficial.'
      }
    },
    secondary: [
      {
        characterId: 'helena_vance',
        prefix: '[ANÁLISE DE SEDE & POLO INDUSTRIAL]',
        quote: hqComment,
        technicalDetails: [
          `Sede Selecionada: ${selectedHq ? selectedHq.name : 'Pendente'}`,
          `Modificadores ativos no simulador de custos e P&D`
        ]
      },
      {
        characterId: 'klaus_muller',
        prefix: '[IMPACTO TÉCNICO DO BACKGROUND]',
        quote: bgComment,
        technicalDetails: [
          `DNA Técnico: ${selectedBg ? selectedBg.name : 'Pendente'}`,
          `Variação aplicada ao Erro de Correlação e Dinâmica da Garagem`
        ]
      }
    ]
  };
}

// FASE 2: ABERTURA NARRATIVA & REUNIÃO COM A FIA
export function getPhase2Narrative(teamName: string = 'Sua Equipe'): {
  primary: NarrativeMessage;
  secondary: NarrativeMessage[];
} {
  return {
    primary: {
      characterId: 'helena_vance',
      prefix: '[REUNIÃO FORMAL DA FIA · GENEBRA]',
      quote:
        `Bem-vindo a Genebra, Chefe. A FIA oficializou as regras do jogo para a Temporada 2026. A nova era híbrida exige equilíbrio cirúrgico: 50% de potência térmica com combustíveis 100% sustentáveis e 50% de potência elétrica fornecida pelo novo MGU-K de 350 kW, além de aerodinâmica ativa em linha reta. O Conselho da ${teamName} exige metas realistas: respeitar religiosamente o teto de $135M e pontuar com consistência.`,
      technicalDetails: [
        'Power Unit 2026: 50% ICE Sustentável (~550 cv) + 50% Elétrico MGU-K (470 cv / 350 kW)',
        'Aerodinâmica Ativa: Flaps dianteiros e traseiros móveis (Modo X / Linha Reta)',
        'Teto de Gastos FIA: $135.0M para P&D, Manufatura e Salários de Pilotos'
      ],
      alert: {
        type: 'info',
        text: 'O cronômetro da FIA iniciou: temos exatamente 8 semanas de pré-temporada até os testes oficiais no Bahrein.'
      }
    },
    secondary: [
      {
        characterId: 'klaus_muller',
        prefix: '[PARECER DE ENGENHARIA 2026]',
        quote:
          'Chefe, a remoção do MGU-H simplificou os motores, mas a demanda elétrica de 350 kW dobrou o estresse térmico nas baterias. Qualquer erro de arrefecimento nos sidepods vai cozinhar o ERS na quarta volta. Não podemos brincar com as dimensões do motor.',
        technicalDetails: [
          'Fim do MGU-H: Menor complexidade de turbo, maior dependência do MGU-K',
          'Demanda de arrefecimento ampliada em +18% para o pacote elétrico'
        ]
      }
    ]
  };
}

// FASE 3: O "DIA 00" - ORIGEM DO MOTOR & FÁBRICA
export function getPhase3Narrative(
  engineChoice: EngineOrigin | null,
  customerSupplier: CustomerEngineSupplier = 'Mercedes',
  factoryId: FactoryId = 'cosworth'
): { primary: NarrativeMessage; secondary: NarrativeMessage[] } {
  if (engineChoice === 'customer') {
    const supplierQuotes: Record<CustomerEngineSupplier, string> = {
      Mercedes:
        'O motor Mercedes-AMG M17 é a referência máxima em eficiência híbrida e software de recuperação de energia. É uma escolha ultra-segura, com 90% de confiabilidade, embora o pacote de arrefecimento exija sidepods um pouco mais volumosos.',
      Ferrari:
        'A Ferrari 067/3 Superfast possui um turbo menor com largadas e acelerações em baixa velocidade demolidoras. Excelente para tração em circuitos urbanos, mas com ligeiro déficit de potência em alta rotação.',
      'Red Bull-Ford':
        'O DM-01 da Red Bull Ford é o benchmark da FIA em potência pura de combustão interna (ICE). Monstruoso em retas, mas a falta de quilometragem da parceria pode trazer sustos de juventude.',
      Honda:
        'O bloco Honda HRC é uma obra-prima de empacotamento compacto, liberando ar limpo para o assoalho, mas exige um chassi ultra-rígido para suportar suas vibrações características.',
      Audi:
        'O motor Audi Revolution foi projetado com um turbo de grande volume pensando no longo prazo. Tem enorme potencial elétrico, mas sofre com inércia nas saídas de curva.'
    };

    return {
      primary: {
        characterId: 'klaus_muller',
        prefix: '[PARECER DE POWERTRAIN · EQUIPE CLIENTE]',
        quote:
          'Chefe, ser cliente é o caminho seguro e veloz para o primeiro ano. Pagamos entre $14M e $15M, temos zero semanas perdidas de integração e podemos focar 100% dos recursos no chassi e na aerodinâmica. Mas lembre-se: o hardware vem selado pela FIA — se o motor tiver vibração ou falta de tração, não poderemos mexer em um único parafuso.',
        technicalDetails: [
          'Zero atraso de integração: 8 semanas completas preservadas para o chassi',
          'Hardware selado pela FIA: Proibida qualquer modificação interna',
          `Fornecedor Homologado: ${customerSupplier}`
        ],
        alert: {
          type: 'success',
          text: 'Ao confirmar, o gabarito tridimensional é liberado imediatamente para o CAD do chassi na Fase 4.'
        }
      },
      secondary: [
        {
          characterId: 'helena_vance',
          prefix: '[ANÁLISE CORPORATIVA · FORNECEDOR]',
          quote: supplierQuotes[customerSupplier],
          technicalDetails: [
            `Custo anual: $14M-$15M debitados do Teto de Gastos`,
            'Suporte de telemetria e engenheiros de campo do fornecedor inclusos'
          ]
        }
      ]
    };
  }

  if (engineChoice === 'bought_factory') {
    const factoryQuotes: Record<FactoryId, string> = {
      cosworth:
        'Cosworth (Northampton, UK): Bloco V6 ultra-leve de 139kg e empacotamento traseiro compacto para a aero. Porém, os pistões em liga de ferro AMS 6487 ainda sofrem com fadiga térmica sem calibração de óleo e NÃO possuem ERS próprio — precisaremos de semanas na bancada e selecionar um fornecedor externo de ERS!',
      porsche:
        'Porsche (Weissach, Alemanha): Hardware elétrico de padrão Le Mans e baterias de altíssima densidade. Mas o projeto foi abandonado e o software está cru — se não retrabalharmos os mapas térmicos, o motor vai ferver em 10 voltas.',
      renault:
        'Renault (Viry-Châtillon, França): Bloco térmico linear e suave que não agride os pneus traseiros. Em contrapartida, o conjunto elétrico é pesado e consome preciosas semanas de adaptação.',
      bmw:
        'BMW (Munique, Alemanha): Potência bruta implacável, feito para dominar as retas de Spa e Monza. O problema são as vibrações harmônicas de alta frequência, capazes de quebrar a carcaça do câmbio se não for reforçada.',
      toyota:
        'Toyota (Colônia, Alemanha): Confiabilidade à prova de balas — o motor nunca quebra e cruza a bandeirada em qualquer tempestade. A desvantagem é o peso elevado e a falta de cavalaria de pico.'
    };

    return {
      primary: {
        characterId: 'helena_vance',
        prefix: '[MOTOR E NARRADOR · COMPRA DE FÁBRICA]',
        quote:
          'Notícia histórica, Chefe! Ao adquirir a titularidade de uma fábrica existente, a FIA nos concede o cobiçado status de MONTADORA (Works Team)! A imprensa global está eufórica com o renascimento da marca. Ganhamos +15 de Reputação instantânea, +5M de fãs e contratos de patrocínio maiores. Mas o tempo de integração vai consumir preciosas semanas da nossa pré-temporada!',
        technicalDetails: [
          'Status Oficial: MONTADORA (Works Team) Homologada pela FIA',
          'Bônus Imediatos: +15 Reputação, +5M Base de Fãs, +$2.0M/ano Marketing',
          'Desafio: Tempo de integração consome o cronômetro da pré-temporada'
        ],
        alert: {
          type: 'warning',
          text: 'Você precisará entrar na Bancada de Montagem para sanar os vícios mecânicos herdados da fábrica.'
        }
      },
      secondary: [
        {
          characterId: 'klaus_muller',
          prefix: '[RAIO-X DO ESPÓLIO MECÂNICO]',
          quote: factoryQuotes[factoryId] || factoryQuotes.cosworth,
          technicalDetails: [
            `Fábrica Alvo: ${factoryId.toUpperCase()}`,
            'Acesso liberado à Bancada de Usinagem e Testes de Dinamômetro'
          ]
        }
      ]
    };
  }

  // Projeto Fênix
  return {
    primary: {
      characterId: 'klaus_muller',
      prefix: '[PARECER DE ENGENHARIA · PROJETO FÊNIX]',
      quote:
        'Você tem coragem ou loucura no sangue, Chefe! Projetar um motor V6 Turbo Híbrido 2026 do zero absoluto sem base prévia leva no mínimo 18 semanas. Nós vamos perder os testes oficiais do Bahrein e as quatro primeiras corridas da temporada! O motor vai quebrar e a diretoria vai roer as unhas, mas teremos 100% de liberdade geométrica.',
      technicalDetails: [
        'Tempo de Desenvolvimento: 18 semanas de manufatura intensiva',
        'Consequência: Perda dos testes do Bahrein e estreia atrasada na Rodada 5',
        'Vantagem Estrutural: Integração dimensional perfeita com o chassi'
      ],
      alert: {
        type: 'danger',
        text: 'Atenção extrema: Projeto de altíssimo risco orçamentário e técnico.'
      }
    },
    secondary: [
      {
        characterId: 'helena_vance',
        prefix: '[IMPACTO NO CONSELHO]',
        quote:
          'Os jornais esportivos vão nos chamar de sonhadores ou suicidas. O Conselho só tolerará o atraso inicial se o motor entregar potência recorde quando finalmente for para a pista.',
        technicalDetails: [
          'Custo Base do Projeto Fênix: $50.0M',
          'Homologação com sliders de arquitetura totalmente desbloqueados'
        ]
      }
    ]
  };
}

// FASE 4: BANCADA DE MONTAGEM & DINAMÔMETRO
export function getPhase4Narrative(
  pistonMaterial: string,
  fuelMix: string,
  ersSupplier: string,
  dynoTested: boolean,
  dynoPassed: boolean,
  weeksLeft: number
): { primary: NarrativeMessage; secondary: NarrativeMessage[] } {
  if (dynoTested) {
    if (dynoPassed) {
      return {
        primary: {
          characterId: 'klaus_muller',
          prefix: '[RELATÓRIO DE ENGENHARIA · RESULTADO DO DINAMÔMETRO]',
          quote:
            'O motor rugiu a 12.000 RPM sem hesitar! A tela piscou em verde: o casamento do bloco com o ERS de 350 kW suportou as cargas térmicas sem detonar os pistões. A FIA emitiu o selo de homologação técnica. O hardware está trancado e o gabarito físico traseiro está oficialmente liberado para desenharmos o chassi no CAD!',
          technicalDetails: [
            'Teste Dinamômetro: APROVADO a 12.000 RPM (Pressão de câmara estável)',
            'Selo de Homologação FIA 2026 emitido e registrado',
            'Gabarito dimensional traseiro transferido para o laboratório de chassi'
          ],
          alert: {
            type: 'success',
            text: 'Unidade de Potência 100% homologada! Próximo passo: Montar a equipe de pilotos e engenheiros.'
          }
        },
        secondary: [
          {
            characterId: 'helena_vance',
            prefix: '[BALANÇO FINANCEIRO DA HOMOLOGAÇÃO]',
            quote:
              'Excelente notícia para o Conselho! Gastamos o necessário para garantir confiabilidade sem explodir o teto de gastos. A imprensa já noticia que nosso motor é uma realidade funcional.',
            technicalDetails: [
              `Semanas restantes no cronômetro da FIA: ${weeksLeft} sem.`,
              'Orçamento restante preservado para a contratação de pilotos e manufatura'
            ]
          }
        ]
      };
    } else {
      return {
        primary: {
          characterId: 'klaus_muller',
          prefix: '[ALERTA CRÍTICO DE BANCADA · FALHA DE DINAMÔMETRO]',
          quote:
            'Desliguem tudo! Desliguem agora! A bancada atingiu 11.200 RPM e a pressão de óleo despencou. Se mandarmos esse motor para o Bahrein como está, as bielas vão perfurar a lateral do bloco na terceira curva. Precisamos reforçar os pistões ou revisar o mapa de injeção imediatamente!',
          technicalDetails: [
            'Falha por sobreaquecimento ou fadiga de material dos pistões',
            'Risco de abandono nas primeiras corridas: 95%'
          ],
          alert: {
            type: 'danger',
            text: 'Ajuste os parâmetros da bancada antes de homologar perante a FIA.'
          }
        },
        secondary: []
      };
    }
  }

  // Ainda ajustando na bancada
  let componentComment =
    'O ar cheira a óleo sintético e metal usinado. Analise cada componente na bancada:';
  if (pistonMaterial === 'titanium') {
    componentComment +=
      ' Os pistões de aço especial (X38CrMoV5-3) com cabeçote reforçado suportam pressões extremas e +15°C no teto térmico (+8% REL), mas consumiram 2 semanas de usinagem.';
  } else {
    componentComment +=
      ' Os pistões de aço padrão FIA (AMS 6487) sobre bloco Al-Si mantêm a massa enxuta, mas operam próximos ao limite térmico sob potência máxima.';
  }

  if (ersSupplier === 'mercedes') {
    componentComment +=
      ' Comprar o ERS da Mercedes por $8.0M garante 350kW estáveis e 90% de confiabilidade, embora adicione 12kg ao pacote.';
  }

  return {
    primary: {
      characterId: 'klaus_muller',
      prefix: '[MOTOR E NARRADOR · BANCADA DE MONTAGEM INDUSTRIAL]',
      quote: componentComment,
      technicalDetails: [
        `Pistões (Art. C15.7.1): ${pistonMaterial === 'titanium' ? 'Aço Especial X38CrMoV5-3 (+8% REL, +2 sem)' : 'Liga de Ferro Padrão FIA (AMS 6487)'}`,
        `Mapeamento: ${fuelMix === 'rich' ? 'Mistura Rica (+5 PWR, +1 sem)' : 'Original Estequiométrico'}`,
        `ERS: ${ersSupplier === 'mercedes' ? 'Mercedes Spec 350kW (+$8M, +12kg)' : 'Padrão da Fábrica'}`
      ],
      alert: {
        type: 'info',
        text: 'Acione o teste de dinamômetro a 12.000 RPM para verificar a confiabilidade antes da homologação.'
      }
    },
    secondary: [
      {
        characterId: 'helena_vance',
        prefix: '[CONTROLE DE CRONOGRAMA]',
        quote:
          'Chefe, o relógio não para. Cada modificação mecânica consome semanas de manufatura. Se ultrapassarmos o prazo de 8 semanas, perderemos os testes oficiais de pré-temporada no Bahrein!',
        technicalDetails: [
          `Semanas restantes no cronômetro da FIA: ${weeksLeft} sem.`,
          'Decisões cirúrgicas são necessárias para não comprometer o calendário'
        ]
      }
    ]
  };
}

// FASE 5: MERCADO DE PILOTOS & STAFF
export function getPhase5Narrative(
  driver1Name?: string,
  driver2Name?: string,
  reserveDriverName?: string,
  aeroStaffName?: string,
  sportingStaffName?: string,
  totalCommitted?: string
): { primary: NarrativeMessage; secondary: NarrativeMessage[] } {
  const driverPairing = driver1Name && driver2Name
    ? `${driver1Name} e ${driver2Name}`
    : 'a dupla titular';

  return {
    primary: {
      characterId: 'helena_vance',
      prefix: '[MERCADO DE PILOTOS & DIRETORIA TÉCNICA]',
      quote:
        `Com o motor homologado, a imprensa e os patrocinadores exigem respostas sobre a formação da equipe. Nossa escolha para o cockpit com ${driverPairing} define o equilíbrio entre velocidade pura, maturidade de acerto e valor comercial. Pilotos de ponta atraem marcas globais, mas seus salários e multas rescisórias contam integralmente contra o Teto de Gastos de $135M!`,
      technicalDetails: [
        `Piloto Titular 1: ${driver1Name || 'Pendente'}`,
        `Piloto Titular 2: ${driver2Name || 'Pendente'}`,
        `Piloto Reserva/Academia: ${reserveDriverName || 'Pendente'}`,
        `Comprometimento Orçamentário com Pilotos: ${totalCommitted || '$0.0M'}`
      ],
      alert: {
        type: 'info',
        text: 'O feedback técnico dos pilotos afeta a velocidade com que corrigimos o acerto nos Treinos Livres.'
      }
    },
    secondary: [
      {
        characterId: 'klaus_muller',
        prefix: '[ESTRUTURAÇÃO DO DEPARTAMENTO TÉCNICO]',
        quote:
          `Eu comando os motores, Chefe, mas precisamos fechar a chefia de Aerodinâmica e o Diretor Esportivo no Pit Wall. ${
            aeroStaffName ? `Com ${aeroStaffName} na aero` : 'O Chefe de Aero'
          } e ${
            sportingStaffName ? `${sportingStaffName} nas operações de pista` : 'o Diretor de Corrida'
          }, teremos uma cadeia de comando completa para desenhar o chassi e treinar as paradas de 2 segundos.`,
        technicalDetails: [
          `Chefe de Aerodinâmica: ${aeroStaffName || 'Pendente'}`,
          `Diretor de Pista / Pit Wall: ${sportingStaffName || 'Pendente'}`
        ]
      }
    ]
  };
}

// FASE 6: FILOSOFIA DE PROJETO & COMBUSTÍVEL SUSTENTÁVEL
export function getPhase6Narrative(
  philosophy: CarPhilosophy = 'aero_efficiency',
  fuelPartner: FuelPartnerId = 'shell'
): { primary: NarrativeMessage; secondary: NarrativeMessage[] } {
  const philosophyQuotes: Record<CarPhilosophy, string> = {
    low_drag:
      'Baixo Arrasto (Low Drag — M02): Prioriza reduzir D = ½ρV²CDA e P_D = D·V em retas longas. Sacrifica carga absoluta em curvas lentas e exige dutos térmicos enxutos.',
    high_downforce:
      'Alta Carga (High Downforce — M02): Maximiza Fz = ½ρV²CLA para ataque agressivo em curvas de média/alta velocidade. Eleva arrasto induzido (CDi ∝ CL²), rigidez estrutural e exigência térmica.',
    stable_platform:
      'Plataforma Estável (Stable Platform — M02): Minimiza ∂Fz/∂h, migração de centro de pressão e sensibilidade a pitch/yaw na transição Modo Z ↔ Modo X, prevenindo estol e porpoising.',
    aero_efficiency:
      'Eficiência Aerodinâmica (Aero Efficiency — M02): Maximiza a razão CL/CD em todo o envelope de velocidades e modos ativos 2026, equilibrando downforce útil sem desperdiçar arrasto.',
    mechanical_grip:
      'Aderência Mecânica (Mechanical Grip — M02): Prioriza contato pneu-pista, tração de saída de curva, absorção de zebras/ondulações e janela térmica sustentável nos stints longos.',
    balanced_adaptive:
      'Equilibrado / Adaptativo (Balanced Adaptive — M02): Robustez multidisciplinar entre arrasto, carga, plataforma e margem térmica ao longo de todos os perfis de pista do calendário.',
    balanced:
      'Equilibrado / Adaptativo (Balanced Adaptive — M02): Robustez multidisciplinar entre arrasto, carga, plataforma e margem térmica ao longo de todos os perfis de pista do calendário.',
    tire_preservation:
      'Aderência Mecânica (Mechanical Grip — M02): Controle mecânico suave para preservar os pneus e maximizar tração em stints longos.'
  };

  const fuelQuotes: Record<FuelPartnerId, string> = {
    shell:
      'Shell V-Power 100% Renewable: Formulação com hidrocarbonetos sustentáveis de altíssima octanagem (+3 PWR Térmico), fornecendo a força necessária para compensar acelerações.',
    petronas:
      'Petronas Synsium E-Fuel: Densidade energética refinada (+5 Eficiência de Combustível), permitindo que o carro largue com menos quilos de combustível no tanque.',
    aramco:
      'Aramco Advanced SynFuel: Equilíbrio tecnológico perfeito entre potência térmica e queima limpa (+2 PWR, +2 Eficiência).'
  };

  return {
    primary: {
      characterId: 'david_sanchez',
      prefix: '[BRIEFING DE AERODINÂMICA & CFD]',
      quote: philosophyQuotes[philosophy],
      technicalDetails: [
        `Filosofia Aerodinâmica Selecionada: ${philosophy.toUpperCase()}`,
        'Diretriz que guiará as simulações no túnel de vento e CAD do assoalho'
      ],
      alert: {
        type: 'success',
        text: 'A filosofia de projeto foi integrada aos modelos paramétricos da fábrica.'
      }
    },
    secondary: [
      {
        characterId: 'helena_vance',
        prefix: '[PARCERIA DE E-FUEL SUSTENTÁVEL 2026]',
        quote: fuelQuotes[fuelPartner],
        technicalDetails: [
          `Fornecedor Oficial: ${fuelPartner.toUpperCase()} SynFuel`,
          'Combustível 100% homologado segundo os padrões de descarbonização da FIA'
        ]
      }
    ]
  };
}

// FASE 7: LABORATÓRIO DE P&D DE DESIGN DO CHASSI & CÂMBIO CAD
export function getPhase7Narrative(
  subStep: 'gearbox' | 'monocoque' | 'aero',
  gearboxMaterial: string,
  gearboxLayout: string,
  totalWeeksUsed: number,
  sidepods: string = 'downwash',
  floor: string = 'stable'
): { primary: NarrativeMessage; secondary: NarrativeMessage[] } {
  if (subStep === 'gearbox') {
    return {
      primary: {
        characterId: 'klaus_muller',
        prefix: '[FASE 7.1 · CAD DO CÂMBIO & SUSPENSÃO TRASEIRA]',
        quote:
          'Chefe, a primeira peça usinada em volta do motor é o Câmbio. Ele dita os pontos de ancoragem da suspensão traseira e o espaço livre para os túneis de Venturi do difusor. Uma carcaça de fibra de carbono reduz 8kg e abaixa drasticamente o centro de gravidade (+2 TRC), mas exige precisão cirúrgica.',
        technicalDetails: [
          `Material da Carcaça: ${gearboxMaterial === 'carbon' ? 'Fibra de Carbono (-8kg, +2 TRC)' : 'Titânio / Alumínio'}`,
          `Layout Traseiro: ${gearboxLayout === 'compact' ? 'Compacto Estreito (Libera difusor)' : 'Volumoso Largo'}`
        ],
        alert: {
          type: 'info',
          text: 'O câmbio se acopla diretamente ao gabarito homologado da PU na Fase 4.'
        }
      },
      secondary: [
        {
          characterId: 'gunter_schmidt',
          prefix: '[AVISO DE PIT WALL & GARAGEM]',
          quote:
            gearboxLayout === 'compact'
              ? 'Chefe, o câmbio compacto é um sonho para os aerodinâmicos, mas meus mecânicos vão suar frio nas trocas de pneus: o espaço para os macacos e as pistolas ficou tão apertado que nossas paradas vão demorar +0.4s!'
              : 'Com a carcaça mais larga, meus mecânicos trabalham folgados nas paradas de 2.1s, mas David Sanchez vai chiar com o ar bloqueado no difusor!',
          technicalDetails: [
            `Impacto nas paradas de box: ${gearboxLayout === 'compact' ? '+0.4s no tempo de pit stop' : '-0.2s nas trocas'}`,
            'Espaço mecânico vs Eficiência aerodinâmica'
          ]
        }
      ]
    };
  }

  if (subStep === 'monocoque') {
    const calendarAlert = totalWeeksUsed > 8
      ? {
          type: 'danger' as const,
          text: `Atenção: Já acumulamos ${totalWeeksUsed} semanas de pré-temporada. O prazo da FIA de 8 semanas foi superado: perderemos os testes oficiais no Bahrein e iremos direto para a estreia oficial na China!`
        }
      : {
          type: 'info' as const,
          text: `Cronômetro FIA: ${8 - totalWeeksUsed} semanas restantes antes do embarque para o Bahrein.`
        };

    return {
      primary: {
        characterId: 'david_sanchez',
        prefix: '[FASE 7.2 · MONOCOQUE & CINEMÁTICA DE SUSPENSÃO]',
        quote:
          'Projetar o monocoque com Alta Rigidez Estrutural compensa a carcaça de carbono e elimina torções sob forças G laterais. A suspensão Push-rod na dianteira dá previsibilidade de pilotagem aos nossos pilotos, enquanto a Pull-rod na traseira abaixa o centro de massa e libera fluxo de ar superior.',
        technicalDetails: [
          'Monocoque: Estrutura em favo de mel de Nomex e fibra de carbono homologada',
          'Cinemática: Push-Rod dianteiro (anti-dive) + Pull-Rod traseiro (anti-squat)'
        ],
        alert: calendarAlert
      },
      secondary: [
        {
          characterId: 'helena_vance',
          prefix: '[CONTROLE DE PRAZOS & CONSELHO]',
          quote:
            totalWeeksUsed > 8
              ? 'Chefe, a imprensa já está nos chamando de "a equipe fantasma de 2026" por pularmos o Bahrein. Mas o Conselho aceitará o atraso se chegarmos à China com um carro estruturalmente blindado.'
              : 'O cronograma está no limite, mas ainda temos margem para colocar o carro na pista nos testes do Bahrein!',
          technicalDetails: [
            `Semanas Totais Acumuladas: ${totalWeeksUsed} semanas`,
            'Impacto direto no programa de testes de pré-temporada'
          ]
        }
      ]
    };
  }

  // Aero e Assoalho
  return {
    primary: {
      characterId: 'david_sanchez',
      prefix: '[FASE 7.3 · AERODINÂMICA ATIVA & EFEITO SOLO]',
      quote:
        'A geometria dos sidepods Downwash direciona o fluxo de ar de alta pressão diretamente para o topo do difusor traseiro. Ao combinarmos isso com Túneis de Venturi Estáveis, garantimos carga aerodinâmica constante em curvas de média velocidade sem o pesadelo do porpoising!',
      technicalDetails: [
        `Sidepods: ${sidepods === 'downwash' ? 'Downwash Escavado (+6 DF, +2% Confiabilidade)' : 'Convencional Largo'}`,
        `Conceito de Assoalho: ${floor === 'stable' ? 'Túneis Estáveis (Sem porpoising, +5 PLT)' : 'Túneis Agressivos de Baixa Altura'}`,
        'Asas Ativas 2026: Modos Cornering (Downforce) e Straight (Arrasto Zero)'
      ],
      alert: {
        type: 'success',
        text: 'Carro 100% finalizado e apto para homologação física perante a comissária técnica da FIA.'
      }
    },
    secondary: [
      {
        characterId: 'klaus_muller',
        prefix: '[AVISO DE ARREFECIMENTO DO ERS]',
        quote:
          'Os sidepods downwash protegem a aerodinâmica, mas lembrem-se: o pacote do ERS gera calor intenso. Monitoraremos as temperaturas do radiador nas primeiras voltas de treino!',
        technicalDetails: [
          'Margem térmica do radiador: Operação segura até 115°C',
          'Canalização interna blindada com proteção de ouro térmico'
        ]
      }
    ]
  };
}

// FASE 8: PRÉ-TEMPORADA NO BAHREIN OU ESTREIA EM XANGAI
export function getPhase8Narrative(
  preSeasonRan: boolean,
  debutLocation: string = 'Bahrein',
  driverName: string = 'Valtteri Bottas',
  practiceFocus: string = 'setup'
): { primary: NarrativeMessage; secondary: NarrativeMessage[] } {
  if (preSeasonRan) {
    return {
      primary: {
        characterId: 'driver_radio',
        prefix: '[RÁDIO COCKPIT · TELEMETRIA DE PISTA AO VIVO]',
        quote:
          `Box, box! Chefe, o carro é muito estável na reta e a frenagem é consistente, mas a frente está "morta" na entrada das curvas 1 e 13. Temos subviragem acentuada nas saídas de média. Se vocês me derem dois cliques a mais na asa dianteira e ajustarem a pressão dos pneus, vamos encontrar três décimos facilmente!`,
        technicalDetails: [
          `Piloto no Cockpit: ${driverName}`,
          'Diagnóstico: Subesterço na entrada de curva com elevação na temperatura do pneu dianteiro esquerdo',
          'Feedback Técnico: Recomenda +2 cliques na asa dianteira para ganhar mordida'
        ],
        alert: {
          type: 'info',
          text: 'Dados de telemetria reais colhidos na pista: Confiança de setup saltou de 30% para 65%!'
        }
      },
      secondary: [
        {
          characterId: 'david_sanchez',
          prefix: '[TELEMETRIA DE CFD & DOWNFORCE]',
          quote:
            'A telemetria confirma o relato do piloto: os túneis de efeito solo estão estáveis, sem quique, mas a carga dianteira está aquém do ideal. No FP2 vamos testar uma asa dianteira mais agressiva para casar com a traseira.',
          technicalDetails: [
            'Risco de Porpoising: 0% (Assoalho perfeitamente correlacionado)',
            'Velocidade máxima na reta principal: 328 km/h com aero ativa acionada'
          ]
        },
        {
          characterId: 'helena_vance',
          prefix: '[PROPOSTAS DE PATROCÍNIO MASTER & SECUNDÁRIO]',
          quote:
            'Chefe, os dados do teste impressionaram o paddock! Temos três propostas de Patrocínio Master na mesa e cotas de patrocinadores secundários prontas para assinatura antes do Grande Prêmio.',
          technicalDetails: [
            'Propostas Comerciais Disponíveis para assinatura imediata',
            'Receita garantida para abastecer o departamento de P&D'
          ]
        }
      ]
    };
  }

  // Estreia direta sem testes
  return {
    primary: {
      characterId: 'gunter_schmidt',
      prefix: '[PIT WALL · ESTREIA OFICIAL EM GRANDE PRÊMIO]',
      quote:
        `Atenção garagem: os motores rugem e os caminhões estão posicionados nos boxes de ${debutLocation}. Como consumimos semanas extras na fábrica para entregar um motor e câmbio confiáveis, o carro nunca deu uma volta real em pista. As sessões de Treinos Livres (FP1, FP2 e FP3) serão cruciais para acertarmos o equilíbrio mecânico antes da classificação de sábado!`,
      technicalDetails: [
        `Circuito de Estreia: ${debutLocation}`,
        'Objetivo de Treinos Livres: Validar refrigeração, telemetria de freios e calibragem',
        'Pistolas pneumáticas calibradas a 35 bar para os treinos de pit-stop'
      ],
      alert: {
        type: 'warning',
        text: 'Primeira quilometragem real do chassi 2026. Priorize o acerto mecânico no FP1.'
      }
    },
    secondary: [
      {
        characterId: 'driver_radio',
        prefix: '[COCKPIT READY]',
        quote:
          'Capacete colocado e cintos travados, Chefe. O motor soa forte na marcha lenta. Vamos para a pista sentir o que essa máquina é capaz de fazer.',
        technicalDetails: [
          `Piloto: ${driverName}`,
          'Pneus Médios novos aquecidos a 100°C prontos para a volta de instalação'
        ]
      }
    ]
  };
}
