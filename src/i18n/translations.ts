export type Language = 'pt' | 'en';

export interface Translations {
  // Brand & Nav
  title: string;
  subtitle: string;
  command: string;
  engineering: string;
  facilities: string;
  personnel: string;
  costCap: string;
  grandPrix: string;
  advanceWeek: string;
  week: string;
  cash: string;
  round: string;
  mainMenu: string;
  
  // Start Screen
  continueGame: string;
  newGame: string;
  loadGame: string;
  settings: string;
  newGameTitle: string;
  newGameDesc: string;
  principalName: string;
  principalBackground: string;
  backgroundEngineer: string;
  backgroundEngineerDesc: string;
  backgroundDriver: string;
  backgroundDriverDesc: string;
  backgroundFinancial: string;
  backgroundFinancialDesc: string;
  selectTeam: string;
  startGameBtn: string;
  cancel: string;
  saveSlot: string;
  noSavesYet: string;
  saveLoaded: string;
  deleteSlot: string;
  
  // Settings
  gameSettings: string;
  languageSelect: string;
  soundEffects: string;
  soundDesc: string;
  simSpeedDefault: string;
  correlationRealism: string;
  correlationRealismDesc: string;
  saveSettings: string;
  
  // Dashboard
  directiveTitle: string;
  directiveDesc: string;
  standings: string;
  carIndex: string;
  atrTunnel: string;
  realCash: string;
  nextGp: string;
  enterWeekend: string;
  constructorsChampionship: string;
  pitWallDirectives: string;
  activeAero: string;
  hybridPu: string;
  chassisReg: string;

  // Engineering
  cadPipeline: string;
  vehicleDynamics: string;
  cadSubtitle: string;
  startCadBtn: string;
  windTunnelTitle: string;
  windTunnelDesc: string;
  runTunnelBtn: string;
  correlationError: string;
  porpoisingRisk: string;
  downforce: string;
  drag: string;
  estCapex: string;
  leadTime: string;

  // Personnel
  personnelTitle: string;
  personnelDesc: string;
  raceRoster: string;
  academyF2: string;
  staffTitle: string;
  transferMarket: string;
  mentalityMorale: string;
  signContract: string;
  seatFP1: string;

  // Cost Cap
  costCapTitle: string;
  costCapDesc: string;
  expenditure: string;
  headroom: string;
  sponsorsTitle: string;
  annualPayout: string;
  raceBonus: string;
  satisfaction: string;

  // Race Weekend
  freePractice: string;
  qualifying: string;
  liveRace: string;
  postRace: string;
  frontWing: string;
  rearWing: string;
  stiffness: string;
  tirePressure: string;
  practiceStint: string;
  proceedToQuali: string;
  commenceRace: string;
  driverPaceMode: string;
  ersDeploy: string;
  activeAeroMode: string;
  pitStrategy: string;
  boxNow: string;
  concludeDebrief: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  pt: {
    title: 'APEX 2026',
    subtitle: 'SIMULADOR DE ENGENHARIA & GESTÃO DA FÓRMULA 1',
    command: 'Comando',
    engineering: 'Engenharia',
    facilities: 'Instalações',
    personnel: 'Pessoal',
    costCap: 'Teto Gastos',
    grandPrix: 'Grande Prêmio',
    advanceWeek: 'Avançar Semana',
    week: 'SEM',
    cash: 'CAIXA',
    round: 'ETAPA',
    mainMenu: 'Menu Principal',

    continueGame: 'Continuar Jogo Recente',
    newGame: 'Nova Carreira / Temporada',
    loadGame: 'Carregar Jogo Salvo',
    settings: 'Configurações do Jogo',
    newGameTitle: 'CONSTITUIÇÃO DA EQUIPE & CHEFE',
    newGameDesc: 'Configure o seu perfil de Team Principal e escolha a equipe para iniciar a era do Regulamento Híbrido 2026.',
    principalName: 'Nome do Team Principal',
    principalBackground: 'Origem & Filosofia do Chefe (DNA)',
    backgroundEngineer: 'Ex-Engenheiro Chefe',
    backgroundEngineerDesc: '-35% no Erro de Correlação entre Túnel/Pista e +15% de velocidade no CAD.',
    backgroundDriver: 'Ex-Piloto Profissional',
    backgroundDriverDesc: '+10 de Moral basal para pilotos e janelas de acerto mais intuitivas nos treinos.',
    backgroundFinancial: 'Magnata / Investidor',
    backgroundFinancialDesc: '+$15.000.000 de Caixa Inicial e maior poder de atração de patrocinadores.',
    selectTeam: 'Escolha a Equipe do Grid',
    startGameBtn: 'Assinar Superlicença & Iniciar',
    cancel: 'Voltar',
    saveSlot: 'Slot de Salvamento',
    noSavesYet: 'Nenhum jogo salvo encontrado neste slot.',
    saveLoaded: 'Jogo carregado com sucesso!',
    deleteSlot: 'Excluir',

    gameSettings: 'CONFIGURAÇÕES GERAIS',
    languageSelect: 'Idioma da Interface',
    soundEffects: 'Efeitos Sonoros & Rádio da Equipe',
    soundDesc: 'Bipes de telemetria, corte de motor e áudio ambiente dos boxes.',
    simSpeedDefault: 'Velocidade de Simulação da Corrida',
    correlationRealism: 'Nível de Rigor da Física & Correlação',
    correlationRealismDesc: 'Ativa discrepância honesta entre túnel de vento, CFD e pista.',
    saveSettings: 'Salvar Configurações',

    directiveTitle: 'DIRETIVA TÉCNICA FIA FORMULA 1',
    directiveDesc: 'Operando sob Regulamento Híbrido 2026: 50% Térmica V6 Turbo / 50% Elétrica ERS de 350kW, sem MGU-H, 100% combustível sustentável e Asas Ativas (Modo X / Modo Z).',
    standings: 'CAMPEONATO',
    carIndex: 'ÍNDICE DO CARRO',
    atrTunnel: 'TÚNEL ATR',
    realCash: 'CAIXA REAL',
    nextGp: 'PRÓXIMO GRANDE PRÊMIO',
    enterWeekend: 'Acessar Operações do GP',
    constructorsChampionship: 'MUNDIAL DE CONSTRUTORES',
    pitWallDirectives: 'DIRETIVAS DO PIT WALL',
    activeAero: 'AERODINÂMICA ATIVA',
    hybridPu: 'PU HÍBRIDA 350kW',
    chassisReg: 'REGULAMENTO DE CHASSI',

    cadPipeline: 'PIPELINE CAD & MOTOR DE CORRELAÇÃO',
    vehicleDynamics: 'Engenharia & Dinâmica Veicular',
    cadSubtitle: 'Dependência sequencial CAD: PU ➔ Câmbio ➔ Chassi ➔ Suspensão ➔ Assoalho ➔ Asas Ativas.',
    startCadBtn: 'Iniciar Fabricação CAD',
    windTunnelTitle: 'CORRELAÇÃO CFD & TÚNEL DE VENTO',
    windTunnelDesc: 'Aloque horas de ATR para testar a camada limite de ar. A incerteza honesta de correlação varia com o nível de infraestrutura.',
    runTunnelBtn: 'Executar Sessão no Túnel',
    correlationError: 'ERRO DE CORRELAÇÃO',
    porpoisingRisk: 'RISCO DE PORPOISING',
    downforce: 'DOWNFORCE',
    drag: 'ARRASTO',
    estCapex: 'CAPEX EST.',
    leadTime: 'PRAZO',

    personnelTitle: 'CAPITAL HUMANO & MENTALIDADE (PPL)',
    personnelDesc: 'Pilotos e corpo técnico possuem Moral (0-100) baseada em 3 pilares: Situação Pessoal, Resultados em Pista e Confiança no Chefe.',
    raceRoster: 'Dupla Titular',
    academyF2: 'Academia (F2/F3)',
    staffTitle: 'Corpo Técnico',
    transferMarket: 'Mercado & Propostas',
    mentalityMorale: 'MORAL / MENTALIDADE',
    signContract: 'Pagar Multa & Contratar',
    seatFP1: 'Escalar no Treino Livre 1 (FP1)',

    costCapTitle: 'AUDITORIA DO TETO FIA ($135.0M) & OPERAÇÕES',
    costCapDesc: 'Separação jurídica rígida entre o Caixa Real e o Teto de Gastos regulatório da FIA. Infrações geram penalidades desportivas.',
    expenditure: 'GASTOS COMPUTADOS',
    headroom: 'MARGEM DISPONÍVEL',
    sponsorsTitle: 'PATROCINADORES & PARCERIAS',
    annualPayout: 'Cota Anual',
    raceBonus: 'Bônus por GP',
    satisfaction: 'Satisfação',

    freePractice: '1. Treinos Livres (Setup)',
    qualifying: '2. Classificação Knockout',
    liveRace: '3. Corrida ao Vivo (Pit Wall)',
    postRace: 'Classificação Final & Pódio',
    frontWing: 'ÂNGULO DA ASA DIANTEIRA',
    rearWing: 'ÂNGULO DA ASA TRASEIRA',
    stiffness: 'RIGIDEZ DE SUSPENSÃO',
    tirePressure: 'PRESSÃO DOS PNEUS',
    practiceStint: 'Enviar Carro para Stint de Treino',
    proceedToQuali: 'Ir para a Classificação',
    commenceRace: 'Iniciar Grande Prêmio (Largada)',
    driverPaceMode: 'RITMO DO PILOTO',
    ersDeploy: 'GERENCIAMENTO ERS 350kW',
    activeAeroMode: 'AERODINÂMICA ATIVA (2026)',
    pitStrategy: 'ESTRATÉGIA DE PIT STOP',
    boxNow: 'Chamar para Box Agora',
    concludeDebrief: 'Encerrar Debriefing & Coletar Premiação'
  },
  en: {
    title: 'APEX 2026',
    subtitle: 'FORMULA 1® ULTIMATE ENGINEERING & MANAGEMENT SIMULATOR',
    command: 'Command',
    engineering: 'Engineering',
    facilities: 'Facilities',
    personnel: 'Personnel',
    costCap: 'Cost Cap',
    grandPrix: 'Grand Prix',
    advanceWeek: 'Advance Week',
    week: 'WK',
    cash: 'CASH',
    round: 'ROUND',
    mainMenu: 'Main Menu',

    continueGame: 'Continue Recent Save',
    newGame: 'New Career / Season',
    loadGame: 'Load Saved Game',
    settings: 'Game Settings',
    newGameTitle: 'TEAM & PRINCIPAL CONSTITUTION',
    newGameDesc: 'Configure your Team Principal profile and select your starting team for the 2026 Hybrid Era.',
    principalName: 'Team Principal Name',
    principalBackground: 'Principal Background & Philosophy (DNA)',
    backgroundEngineer: 'Former Chief Engineer',
    backgroundEngineerDesc: '-35% Tunnel-to-Track Correlation Error and +15% CAD speed.',
    backgroundDriver: 'Former Professional Driver',
    backgroundDriverDesc: '+10 baseline pilot morale and more intuitive setup window feedback.',
    backgroundFinancial: 'Investor / Tycoon',
    backgroundFinancialDesc: '+$15,000,000 starting cash and enhanced sponsor attraction.',
    selectTeam: 'Select Grid Team',
    startGameBtn: 'Sign Superlicense & Launch',
    cancel: 'Back',
    saveSlot: 'Save Slot',
    noSavesYet: 'No saved game found in this slot.',
    saveLoaded: 'Game loaded successfully!',
    deleteSlot: 'Delete',

    gameSettings: 'GENERAL SETTINGS',
    languageSelect: 'Interface Language',
    soundEffects: 'Sound Effects & Team Radio Beeps',
    soundDesc: 'Telemetry beeps, pit lane audio cues, and engine acoustics.',
    simSpeedDefault: 'Default Race Simulation Speed',
    correlationRealism: 'Aero Correlation Realism Level',
    correlationRealismDesc: 'Enforces honest discrepancy between Wind Tunnel, CFD, and track reality.',
    saveSettings: 'Save Settings',

    directiveTitle: 'FIA FORMULA 1 TECHNICAL DIRECTIVE',
    directiveDesc: 'Operating under 2026 Hybrid Specifications: 50% Thermal V6 Turbo / 50% Electric 350kW ERS, elimination of MGU-H, 100% sustainable e-fuel, and Active Aerodynamics (Mode X / Mode Z).',
    standings: 'STANDINGS',
    carIndex: 'CAR INDEX',
    atrTunnel: 'ATR TUNNEL',
    realCash: 'REAL CASH',
    nextGp: 'NEXT GRAND PRIX',
    enterWeekend: 'Enter Race Weekend Operations',
    constructorsChampionship: 'CONSTRUCTORS CHAMPIONSHIP',
    pitWallDirectives: 'PIT WALL DIRECTIVES',
    activeAero: 'ACTIVE AERODYNAMICS',
    hybridPu: '350kW HYBRID PU',
    chassisReg: 'CHASSIS REGULATION',

    cadPipeline: 'CAD PIPELINE & CORRELATION ENGINE',
    vehicleDynamics: 'Engineering & Vehicle Dynamics',
    cadSubtitle: 'Sequential CAD assembly dependency: PU ➔ Gearbox ➔ Chassis ➔ Suspension ➔ Floor ➔ Active Wings.',
    startCadBtn: 'Start CAD Manufacturing',
    windTunnelTitle: 'WIND TUNNEL & CFD CORRELATION',
    windTunnelDesc: 'Allocate ATR hours to test boundary layer airflow. Honest correlation gap varies with factory level.',
    runTunnelBtn: 'Execute Wind Tunnel Session',
    correlationError: 'CORRELATION ERROR',
    porpoisingRisk: 'PORPOISING RISK',
    downforce: 'DOWNFORCE',
    drag: 'DRAG COEFFICIENT',
    estCapex: 'EST. CAPEX',
    leadTime: 'LEAD TIME',

    personnelTitle: 'HUMAN CAPITAL & MENTALITY (PPL)',
    personnelDesc: 'Drivers and staff have Morale (0-100) based on 3 pillars: Personal Status, On-Track Results, and Trust in Principal.',
    raceRoster: 'Race Pairing',
    academyF2: 'Academy (F2/F3)',
    staffTitle: 'Technical Staff',
    transferMarket: 'Transfer Market',
    mentalityMorale: 'MENTALITY MORALE',
    signContract: 'Pay Buyout & Sign',
    seatFP1: 'Seat in Practice 1 (FP1)',

    costCapTitle: 'FIA COST CAP AUDIT ($135.0M) & OPERATIONS',
    costCapDesc: 'Strict legal separation between Real Cash and the $135.0M FIA Financial Regulations Cost Cap. Breaches trigger sporting penalties.',
    expenditure: 'EXPENDITURE COMMITTED',
    headroom: 'HEADROOM REMAINING',
    sponsorsTitle: 'SPONSORS & PARTNERSHIPS',
    annualPayout: 'Annual Retainer',
    raceBonus: 'GP Bonus',
    satisfaction: 'Satisfaction',

    freePractice: '1. Free Practice (Setup)',
    qualifying: '2. Qualifying Shootout',
    liveRace: '3. Grand Prix (Live Pit Wall)',
    postRace: 'Final Classification & Podium',
    frontWing: 'FRONT WING FLAP ANGLE',
    rearWing: 'REAR WING DOWNFORCE ANGLE',
    stiffness: 'SUSPENSION SPRING STIFFNESS',
    tirePressure: 'TIRE PRESSURE',
    practiceStint: 'Send Out for Practice Stint',
    proceedToQuali: 'Proceed to Qualifying',
    commenceRace: 'Commence Grand Prix (Lights Out)',
    driverPaceMode: 'DRIVER PACE MODE',
    ersDeploy: '350kW ERS DEPLOYMENT',
    activeAeroMode: 'ACTIVE AERO (2026)',
    pitStrategy: 'PIT STRATEGY CALL',
    boxNow: 'Box Box Now',
    concludeDebrief: 'Conclude Debrief & Collect Prize Funds'
  }
};
