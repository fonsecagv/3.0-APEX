import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import {
  Circuit,
  ComponentSpec,
  Driver,
  Facility,
  Sponsor,
  StaffMember,
  Team,
  TeamFinancials,
  CarSetup,
  SetupWindow,
  LiveCarState,
  TireCompound,
  EngineMode,
  AeroMode,
  PaceMode,
  FuelMixMode,
  FuelPartnerId,
  CircuitId,
  OnboardingResult,
  CustomerEngineSupplier,
  PrincipalBackgroundId,
  PerformanceHistoryPoint,
  AduoEvaluationResult,
  BaseDeFasPoint,
  PuClientContract,
  SeasonEventCard,
  MidSeasonDilemma
} from '../types/f1';
import {
  computeRdFacilityCapacity,
  generateWeeklyEventCard,
  suggestNextSeasonChassisName,
  type RdFacilityCapacity
} from '../engine/chassisLaunchAndSeasonLoop';
import { evaluatePracticeSetup } from '../engine/setupFeedbackEngine';
import {
  SimulationReport,
  VehicleEngineeringParameters,
  VehiclePhysicsOutputs
} from '../types/physics';
import { DEFAULT_VEHICLE_PARAMS, solveVehiclePhysics } from '../engine/physicsEngine';
import { evaluatePitAndGarageOperations, runMultiPhysicsSimulation } from '../engine/simulationEngine';
import {
  PU_MATERIAL_RESEARCH_PROJECTS,
  getSupplierDnaSpec,
} from '../data/puMaterials2026';
import {
  resolveRaceGridDrivers,
  syncTeamsAndDriversAfterOnboarding,
  applyTeamDriverReplacement,
  computeDriverRaceProfile,
  sortRaceClassification,
  stepRaceSimulationTick,
  type TrackFlagStatus,
  type RaceControlEvent,
  type RaceFlagState
} from '../engine/raceGridAndEvents';
import { PRINCIPAL_BACKGROUNDS } from '../data/principalBackgroundsData';
import { PU_CLIENT_PROPOSALS } from '../data/puClientsData';
import {
  CIRCUITS,
  COMMON_FACILITIES_INITIAL,
  INITIAL_COMPONENTS,
  INITIAL_DRIVERS,
  INITIAL_FACILITIES,
  INITIAL_SPONSORS,
  INITIAL_STAFF,
  INITIAL_TEAMS,
  WORKS_PU_FACTORY_INITIAL,
  getInitialFacilities
} from '../data/f1Data';
import {
  loadCircuitPackage,
  loadSeasonCircuits,
  evaluateTrackPhysics,
  type ProcessedCircuitPackage,
  type TrackPhysicsEvaluation
} from '../circuits';
import { generateNewDrivers } from '../data/marketData';
import { Language, Translations, TRANSLATIONS } from '../i18n/translations';

export type { TrackFlagStatus, RaceControlEvent };
export type GameTab = 'overview' | 'engineering' | 'facilities' | 'team' | 'financials' | 'race_weekend' | 'pu_clients';
export type WeekendSession = 'setup_fp' | 'qualifying' | 'race' | 'post_race';

export interface SaveSlotInfo {
  id: string;
  name: string;
  timestamp: string;
  teamName: string;
  teamColor: string;
  seasonYear: number;
  week: number;
  bankBalance: number;
}

export interface NewGameConfig {
  principalName: string;
  background: PrincipalBackgroundId;
  selectedTeamId: string;
}

interface GameContextType {
  // Start Screen & Language
  showStartScreen: boolean;
  setShowStartScreen: (show: boolean) => void;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  completeOnboarding: (data: OnboardingResult) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  realisticCorrelation: boolean;
  setRealisticCorrelation: (real: boolean) => void;
  playRadioSound: () => void;
  
  // Save / Load
  saveGame: (slotId?: string) => void;
  loadGame: (slotId: string) => boolean;
  loadRecentSave: () => boolean;
  exportCareerStatePayload: () => {
    slotId: string;
    teamName: string;
    seasonYear: number;
    week: number;
    statePayload: Record<string, unknown>;
  };
  importCareerStatePayload: (statePayload: Record<string, unknown>) => boolean;
  hasRecentSave: boolean;
  saveSlots: SaveSlotInfo[];
  deleteSaveSlot: (slotId: string) => void;
  startNewGame: (config: NewGameConfig) => void;
  resetGameState: () => void;
  resetToastMessage: string | null;
  setResetToastMessage: (msg: string | null) => void;
  onboardingSessionKey: number;

  activeTab: GameTab;
  setActiveTab: (tab: GameTab) => void;
  dashboardViewMode: 'command' | 'grands_prix';
  setDashboardViewMode: (mode: 'command' | 'grands_prix') => void;
  openGrandsPrixMode: () => void;
  currentWeek: number;
  seasonYear: number;
  currentCircuitIndex: number;
  currentCircuit: Circuit;
  currentCircuitPackage: ProcessedCircuitPackage;
  currentTrackPhysics: TrackPhysicsEvaluation;
  circuits: Circuit[];
  
  // Entities
  playerTeam: Team;
  allTeams: Team[];
  drivers: Driver[];
  staff: StaffMember[];
  facilities: Facility[];
  components: ComponentSpec[];
  sponsors: Sponsor[];
  financials: TeamFinancials;
  setFinancials: React.Dispatch<React.SetStateAction<TeamFinancials>>;
  principalProfile: { name: string; background: PrincipalBackgroundId };
  
  // DNA Modifiers State (Engine Formulas & Active Perks)
  modificadorErroCorrelacao: number;
  modificadorSinergiaPiloto: number;
  modificadorTempoPeD: number;
  modificadorConfiabilidade: number;
  modificadorConfiancaDiretoria: number;
  modificadorMoralFabrica: number;
  modificadorCaixaInicial: number;
  modificadorDownforce: number;
  modificadorTempoManufatura: number;
  modificadorSetupRapido: boolean;

  // Time Budget & Marketing System
  semanasParaTeste: number;
  setSemanasParaTeste: React.Dispatch<React.SetStateAction<number>>;
  baseDeFas: number;
  setBaseDeFas: React.Dispatch<React.SetStateAction<number>>;
  receitaMarketing: number;
  setReceitaMarketing: React.Dispatch<React.SetStateAction<number>>;
  receitaMerchandising: number;
  setReceitaMerchandising: React.Dispatch<React.SetStateAction<number>>;
  baseDeFasHistory: BaseDeFasPoint[];
  setBaseDeFasHistory: React.Dispatch<React.SetStateAction<BaseDeFasPoint[]>>;
  organizarEventoMarketing: (driverId: string) => { success: boolean; message: string };

  // ADUO System (Additional Development and Upgrade Opportunities)
  aduoWindowActive: boolean;
  aduoWeeksRemaining: number;
  aduoHomologationQuotas: number;
  aduoChassisDelayWeeks: number;
  aduoLastGapPercent: number;
  aduoBenchmarkPwr: number;
  aduoPlayerPwr: number;
  aduoHistory: AduoEvaluationResult[];
  avaliarADUO: (forcedRound?: number) => AduoEvaluationResult;
  aplicarModificacaoADUO: (melhoriaPwr?: number, custoTempoSemanas?: number) => boolean;
  fecharJanelaADUO: () => void;

  // FIA Homologation & Engine Freeze
  motorHomologado: boolean;
  setMotorHomologado: React.Dispatch<React.SetStateAction<boolean>>;
  semanasRestantesPreTemporada: number;
  setSemanasRestantesPreTemporada: React.Dispatch<React.SetStateAction<number>>;
  motorHomologadoFIA: boolean;
  setMotorHomologadoFIA: React.Dispatch<React.SetStateAction<boolean>>;
  homologarMotorFIA: () => void;
  homologarFIA: () => void;
  dataHomologacaoFIA: number;

  // Setups & Engineering (SI Physics Integrated)
  vehicleParams: VehicleEngineeringParameters;
  updateVehicleParams: (patch: Partial<VehicleEngineeringParameters>) => void;
  vehiclePhysics: VehiclePhysicsOutputs;
  lastSimulationReport: SimulationReport | null;
  runEngineeringSimulation: (compType: ComponentSpec['type'], atrHours: number) => SimulationReport;
  carSetup: CarSetup;
  setupWindow: SetupWindow;
  updateCarSetup: (partial: Partial<CarSetup>) => void;
  startComponentDevelopment: (
    newComp: ComponentSpec,
    options?: {
      atrHoursCost?: number;
      chiefId?: string;
      chiefName?: string;
      adviceFollowed?: boolean;
    }
  ) => boolean;
  respondToChiefAdvice: (
    decision: 'follow' | 'ignore',
    payload: {
      chiefId: string;
      chiefName: string;
      adviceKey: string;
      recommendedPatch?: Partial<VehicleEngineeringParameters> | null;
    }
  ) => void;
  respondToDriverFeedback: (
    decision: 'listen' | 'ignore',
    driverId: string,
    contextTag: string,
    patches?: {
      vehiclePatch?: Partial<VehicleEngineeringParameters>;
      setupPatch?: Partial<CarSetup>;
    }
  ) => void;
  runWindTunnelTest: (compType: ComponentSpec['type'], atrHours: number) => {
    expectedDownforce: number;
    expectedDrag: number;
    baseCorrelationError: number;
    modificadorErroCorrelacao: number;
    correlationError: number;
    porpoisingRisk: number;
    simulationReport: SimulationReport;
  };
  upgradeFacility: (facilityId: string) => boolean;
  maintainFacility: (facilityId: string) => boolean;

  // M08 Materials R&D Tree (3-Layer Manufacturer DNA & Research Unlocks)
  unlockedPuMaterials: string[];
  activePuMaterialResearch: { projectId: string; weeksRemaining: number; totalWeeks: number } | null;
  startPuMaterialResearch: (projectId: string) => { success: boolean; message: string };
  
  // Driver & Staff Management
  signDriver: (driverId: string, salary: number, years: number) => boolean;
  dismissDriverAndPromote: (outDriverId: string, inDriverId: string, newSalary?: number) => boolean;
  promoteAffiliateToFP1: (driverId: string) => void;
  selectedAffiliateInFP1: boolean;
  
  // Race Weekend State
  weekendSession: WeekendSession;
  setWeekendSession: (session: WeekendSession) => void;
  fpRunsDone: number;
  runPracticeLap: () => { feedback: string; confidenceGain: number };
  simulateFreePractice1And2: () => { feedback: string; confidenceGain: number };
  qualifyingResults: { driverId: string; lapTimeSec: number; position: number }[];
  runQualifyingShootout: () => void;
  
  // Live Race Simulation
  isRaceLive: boolean;
  isRacePaused: boolean;
  raceSpeed: number; // 1, 2, 5, 10
  currentLap: number;
  totalLaps: number;
  liveCars: LiveCarState[];
  trackWeather: 'sunny' | 'overcast' | 'light_rain' | 'heavy_rain';
  trackGripPercent: number;
  safetyCarStatus: 'none' | 'vsc' | 'full_sc';
  trackFlagStatus: TrackFlagStatus;
  raceControlFeed: RaceControlEvent[];
  pitLaneStartDriverIds: string[];
  togglePitLaneStart: (driverId: string) => void;
  resumeFromRedFlag: () => void;
  skipToChequeredFlag: () => void;
  
  startRace: () => void;
  pauseResumeRace: () => void;
  setRaceSpeedMultiplier: (mult: number) => void;
  updateDriverTactics: (driverId: string, tactics: {
    paceMode?: PaceMode;
    engineMode?: EngineMode;
    aeroMode?: AeroMode;
    fuelMixMode?: FuelMixMode;
  }) => void;
  orderPitStop: (driverId: string, newCompound: TireCompound) => void;
  finishRaceWeekend: () => void;
  
  // Advance Calendar
  advanceWeek: () => void;
  notifications: { id: string; title: string; message: string; date: string; type: 'info' | 'warning' | 'penalty' }[];
  clearNotification: (id: string) => void;
  addNotification: (title: string, message: string, type?: 'info' | 'warning' | 'penalty') => void;
  
  // 3-Year Progression Engine & Non-Linear Evolution
  atrNextYearAllocationRatio: number; // 0 to 1 (default 0.40)
  setAtrNextYearAllocationRatio: (ratio: number) => void;
  consecutiveNoPointsRaces: number;
  performanceHistory: PerformanceHistoryPoint[];
  phoenixDiscountH1: boolean;

  // Regulatory Drift
  pendingRegulationChange: {
    title: string;
    description: string;
    impact: string;
    targetSeason: number;
    options: { label: string; cost: number; performanceRetained: number }[];
  } | null;
  resolveRegulatoryChoice: (optionIndex: number) => void;
  pendingHaasCamaraEvent: {
    round: number;
    gpName: string;
  } | null;
  resolveHaasCamaraEvent: (promoteCamara: boolean) => void;
  generateNewDrivers: () => Driver[];

  // Works Team Clients (Fornecimento de Motores para Clientes)
  puClients: PuClientContract[];
  signPuClient: (proposalId: string) => boolean;
  terminatePuClient: (contractId: string) => void;
  maxPuClientsCapacity: number;

  // R&D Facility Capacity & Season Loop (Decision Cards + Mid-Season Dilemma)
  rdFacilityCapacity: RdFacilityCapacity;
  pendingSeasonEventCard: SeasonEventCard | null;
  resolveSeasonEventCard: (optionIndex: number) => void;
  pendingMidSeasonDilemma: MidSeasonDilemma | null;
  resolveMidSeasonDilemma: (strategy: 'current_car' | 'balanced' | 'next_year') => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showStartScreen, setShowStartScreen] = useState<boolean>(() => {
    // Check if there is an active game already in memory
    return true;
  });
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('f1_apex_lang') as Language) || 'pt';
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [realisticCorrelation, setRealisticCorrelation] = useState<boolean>(true);
  const [hasRecentSave, setHasRecentSave] = useState<boolean>(false);
  const [saveSlots, setSaveSlots] = useState<SaveSlotInfo[]>([]);
  const [resetToastMessage, setResetToastMessage] = useState<string | null>(null);
  const [onboardingSessionKey, setOnboardingSessionKey] = useState<number>(1);

  const [activeTab, setActiveTab] = useState<GameTab>('overview');
  const [dashboardViewMode, setDashboardViewMode] = useState<'command' | 'grands_prix'>('command');
  const openGrandsPrixMode = () => {
    setDashboardViewMode('grands_prix');
    setActiveTab('overview');
  };
  const [currentWeek, setCurrentWeek] = useState(1);
  const [seasonYear, setSeasonYear] = useState(2026);
  const [currentCircuitIndex, setCurrentCircuitIndex] = useState(0);

  const [allTeams, setAllTeams] = useState<Team[]>(INITIAL_TEAMS);
  const [drivers, setDrivers] = useState<Driver[]>(INITIAL_DRIVERS);
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF);
  const [facilities, setFacilities] = useState<Facility[]>(INITIAL_FACILITIES);
  const [components, setComponents] = useState<ComponentSpec[]>(INITIAL_COMPONENTS);
  const [sponsors, setSponsors] = useState<Sponsor[]>(INITIAL_SPONSORS);
  
  const [financials, setFinancials] = useState<TeamFinancials>({
    bankBalance: 135000000,
    costCapLimit: 135000000,
    costCapSpent: 38000000,
    atrWindTunnelHoursAvailable: 360,
    atrCfdMegaAllocations: 300,
    atrPeriodWeeksLeft: 8
  });

  const [principalProfile, setPrincipalProfile] = useState<{
    name: string;
    background: PrincipalBackgroundId;
  }>({
    name: 'Guilherme',
    background: 'chief_engineer'
  });

  // DNA Initial Modifiers (GameState)
  const [modificadorErroCorrelacao, setModificadorErroCorrelacao] = useState<number>(-0.35);
  const [modificadorSinergiaPiloto, setModificadorSinergiaPiloto] = useState<number>(-15);
  const [modificadorTempoPeD, setModificadorTempoPeD] = useState<number>(1.0);
  const [modificadorConfiabilidade, setModificadorConfiabilidade] = useState<number>(0);
  const [modificadorConfiancaDiretoria, setModificadorConfiancaDiretoria] = useState<number>(0);
  const [modificadorMoralFabrica, setModificadorMoralFabrica] = useState<number>(0);
  const [modificadorCaixaInicial, setModificadorCaixaInicial] = useState<number>(0);
  const [modificadorDownforce, setModificadorDownforce] = useState<number>(0);
  const [modificadorTempoManufatura, setModificadorTempoManufatura] = useState<number>(1.0);
  const [modificadorSetupRapido, setModificadorSetupRapido] = useState<boolean>(false);

  // Time Budget & Marketing System (GameState)
  const [semanasParaTeste, setSemanasParaTeste] = useState<number>(8);
  const [baseDeFas, setBaseDeFas] = useState<number>(5000000);
  const [receitaMarketing, setReceitaMarketing] = useState<number>(2000000);
  const [receitaMerchandising, setReceitaMerchandising] = useState<number>(500000);
  const [baseDeFasHistory, setBaseDeFasHistory] = useState<BaseDeFasPoint[]>([
    {
      round: 0,
      raceName: 'Pré-Temporada',
      fans: 5000000,
      changePercent: 0
    }
  ]);

  // 3-Year Progression & Non-Linear Evolution State
  const [atrNextYearAllocationRatio, setAtrNextYearAllocationRatio] = useState<number>(0.40);
  const [consecutiveNoPointsRaces, setConsecutiveNoPointsRaces] = useState<number>(0);
  const [usedPhoenixYear1, setUsedPhoenixYear1] = useState<boolean>(false);
  const [phoenixDiscountH1, setPhoenixDiscountH1] = useState<boolean>(false);
  const [seasonFinishHistory, setSeasonFinishHistory] = useState<{ season: number; position: number }[]>([]);
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceHistoryPoint[]>([
    {
      round: 0,
      season: 2026,
      circuitName: 'Pré-Temporada',
      playerRating: 81,
      rivalRatings: {
        ferrari: 92,
        redbull: 90,
        mercedes: 88
      }
    }
  ]);

  // ADUO System State (Additional Development and Upgrade Opportunities)
  const [aduoWindowActive, setAduoWindowActive] = useState<boolean>(false);
  const [aduoWeeksRemaining, setAduoWeeksRemaining] = useState<number>(0);
  const [aduoHomologationQuotas, setAduoHomologationQuotas] = useState<number>(0);
  const [aduoChassisDelayWeeks, setAduoChassisDelayWeeks] = useState<number>(0);
  const [aduoLastGapPercent, setAduoLastGapPercent] = useState<number>(0);
  const [aduoBenchmarkPwr, setAduoBenchmarkPwr] = useState<number>(90);
  const [aduoPlayerPwr, setAduoPlayerPwr] = useState<number>(82);
  const [aduoHistory, setAduoHistory] = useState<AduoEvaluationResult[]>([]);

  // Homologação Obrigatória da FIA (Congelamento de Hardware)
  const [motorHomologado, setMotorHomologado] = useState<boolean>(false);
  const [semanasRestantesPreTemporada, setSemanasRestantesPreTemporada] = useState<number>(8);
  const motorHomologadoFIA = motorHomologado;
  const setMotorHomologadoFIA = setMotorHomologado;

  // SI Multi-Physics Vehicle Parameters & Simulation State
  const [vehicleParams, setVehicleParams] = useState<VehicleEngineeringParameters>(DEFAULT_VEHICLE_PARAMS);
  const [lastSimulationReport, setLastSimulationReport] = useState<SimulationReport | null>(null);
  const [unlockedPuMaterials, setUnlockedPuMaterials] = useState<string[]>([
    'fia_iron_ams6487',
    'lightweight_lithium',
    'dense_pack',
  ]);
  const [activePuMaterialResearch, setActivePuMaterialResearch] = useState<{
    projectId: string;
    weeksRemaining: number;
    totalWeeks: number;
  } | null>(null);

  const updateVehicleParams = (patch: Partial<VehicleEngineeringParameters>) => {
    setVehicleParams(prev => ({ ...prev, ...patch }));
  };

  const vehiclePhysics = useMemo(() => {
    const levelAvg = components.reduce((acc, c) => acc + c.level, 0) / Math.max(1, components.length);
    return solveVehiclePhysics(vehicleParams, {
      componentLevelAvg: levelAvg,
      aeroDownforceOffset: modificadorDownforce
    });
  }, [vehicleParams, components, modificadorDownforce]);

  // Works Team Clients (Fornecimento de Motores para Clientes)
  const [puClients, setPuClients] = useState<PuClientContract[]>(() => {
    try {
      const s = localStorage.getItem('apex_f1_pu_clients');
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('apex_f1_pu_clients', JSON.stringify(puClients));
    } catch {}
  }, [puClients]);

  const maxPuClientsCapacity = 2;

  // Helper to calculate & apply DNA Archetype Modifiers
  const applyDnaModifiers = (bgId: PrincipalBackgroundId) => {
    let erroCorrelacao = 0;
    let sinergiaPiloto = 0;
    let tempoPeD = 1.0;
    let confiabilidade = 0;
    let confiancaDiretoria = 0;
    let moralFabrica = 0;
    let caixaInicial = 0;
    let downforce = 0;
    let tempoManufatura = 1.0;
    let setupRapido = false;
    let reputacaoBonus = 0;

    switch (bgId) {
      case 'chief_engineer':
      case 'engineer':
        erroCorrelacao = -0.35;
        sinergiaPiloto = -15;
        break;
      case 'ex_driver':
      case 'pro_driver':
      case 'f1_driver':
      case 'driver':
        tempoPeD = 1.10;
        reputacaoBonus = 20;
        sinergiaPiloto = 10;
        break;
      case 'legendary_mechanic':
        confiabilidade = 15;
        confiancaDiretoria = -15;
        break;
      case 'financial_magnate':
      case 'financial':
      case 'marketing_shark':
      case 'enthusiast_heir':
        caixaInicial = 25000000;
        moralFabrica = -10;
        break;
      case 'data_strategist':
      case 'born_strategist':
      case 'data_analyst':
        setupRapido = true;
        erroCorrelacao = 0.15;
        break;
      case 'elite_executive':
        tempoPeD = 1.10;
        moralFabrica = -15;
        break;
      case 'fia_man':
      case 'fia_engineer':
        downforce = 5;
        tempoManufatura = 1.20;
        break;
      default:
        break;
    }

    setModificadorErroCorrelacao(erroCorrelacao);
    setModificadorSinergiaPiloto(sinergiaPiloto);
    setModificadorTempoPeD(tempoPeD);
    setModificadorConfiabilidade(confiabilidade);
    setModificadorConfiancaDiretoria(confiancaDiretoria);
    setModificadorMoralFabrica(moralFabrica);
    setModificadorCaixaInicial(caixaInicial);
    setModificadorDownforce(downforce);
    setModificadorTempoManufatura(tempoManufatura);
    setModificadorSetupRapido(setupRapido);

    return {
      erroCorrelacao,
      sinergiaPiloto,
      tempoPeD,
      confiabilidade,
      confiancaDiretoria,
      moralFabrica,
      caixaInicial,
      downforce,
      tempoManufatura,
      setupRapido,
      reputacaoBonus
    };
  };

  const t = TRANSLATIONS[language];

  // Web Audio Synthetic F1 Pit Radio Tone
  const playRadioSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.08);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch {
      // Audio not permitted without user gesture or unsupported
    }
  };

  // Sync language with localStorage
  useEffect(() => {
    localStorage.setItem('f1_apex_lang', language);
  }, [language]);

  // Auto-dismiss reset notification toast
  useEffect(() => {
    if (resetToastMessage) {
      const timer = setTimeout(() => {
        setResetToastMessage(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [resetToastMessage]);

  // Load existing saves list from localStorage
  useEffect(() => {
    try {
      const recent = localStorage.getItem('f1_apex_recent_save');
      setHasRecentSave(!!recent);

      const slotsRaw = localStorage.getItem('f1_apex_save_slots');
      if (slotsRaw) {
        setSaveSlots(JSON.parse(slotsRaw));
      }
    } catch {
      // ignore
    }
  }, []);

  // Save Game Function
  const saveGame = (slotId?: string) => {
    try {
      const playerT = allTeams.find(t => t.isPlayer) || allTeams[0];
      const payload = {
        id: slotId || `slot_${Date.now()}`,
        name: `Carreira ${playerT.shortName} - S${seasonYear} Wk${currentWeek}`,
        timestamp: new Date().toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US'),
        teamName: playerT.name,
        teamColor: playerT.color,
        seasonYear,
        week: currentWeek,
        bankBalance: financials.bankBalance,
        state: {
          currentWeek,
          seasonYear,
          currentCircuitIndex,
          allTeams,
          drivers,
          staff,
          facilities,
          components,
          sponsors,
          financials,
          principalProfile,
          vehicleParams,
          lastSimulationReport,
          unlockedPuMaterials,
          activePuMaterialResearch,
          haasCamaraEventResolved,
          pendingSeasonEventCard,
          pendingMidSeasonDilemma
        }
      };

      // Always save to recent
      localStorage.setItem('f1_apex_recent_save', JSON.stringify(payload));
      setHasRecentSave(true);

      // Save to slot
      const existingSlots = [...saveSlots];
      const idx = existingSlots.findIndex(s => s.id === payload.id);
      if (idx >= 0) {
        existingSlots[idx] = payload;
      } else {
        existingSlots.unshift(payload);
      }

      localStorage.setItem('f1_apex_save_slots', JSON.stringify(existingSlots.slice(0, 5)));
      setSaveSlots(existingSlots.slice(0, 5));
      localStorage.setItem(`f1_apex_slot_${payload.id}`, JSON.stringify(payload));

      playRadioSound();
    } catch (e) {
      console.error('Error saving game:', e);
    }
  };

  // Load Game Function
  const loadGameData = (saved: {
    state: {
      currentWeek: number;
      seasonYear: number;
      currentCircuitIndex: number;
      allTeams: Team[];
      drivers: Driver[];
      staff: StaffMember[];
      facilities: Facility[];
      components: ComponentSpec[];
      sponsors: Sponsor[];
      financials: TeamFinancials;
      principalProfile?: { name: string; background: PrincipalBackgroundId };
      vehicleParams?: VehicleEngineeringParameters;
      lastSimulationReport?: SimulationReport | null;
      unlockedPuMaterials?: string[];
      activePuMaterialResearch?: { projectId: string; weeksRemaining: number; totalWeeks: number } | null;
      haasCamaraEventResolved?: boolean;
      pendingSeasonEventCard?: SeasonEventCard | null;
      pendingMidSeasonDilemma?: MidSeasonDilemma | null;
    };
  }) => {
    if (!saved?.state) return false;
    const s = saved.state;
    setCurrentWeek(s.currentWeek || 1);
    setSeasonYear(s.seasonYear || 2026);
    setCurrentCircuitIndex(s.currentCircuitIndex || 0);
    if (s.allTeams && s.drivers) {
      const resolvedGrid = resolveRaceGridDrivers(s.allTeams, s.drivers);
      setAllTeams(resolvedGrid.normalizedTeams);
      setDrivers(resolvedGrid.normalizedDrivers.map(d => ({ ...d, trust: d.trust ?? 75 })));
    } else {
      if (s.allTeams) setAllTeams(s.allTeams);
      if (s.drivers) setDrivers(s.drivers.map(d => ({ ...d, trust: d.trust ?? 75 })));
    }
    if (s.staff) {
      const existingIds = new Set(s.staff.map(st => st.id));
      const missingStaff = INITIAL_STAFF.filter(st => st.role === 'chief_mechanic' && !existingIds.has(st.id));
      setStaff([...s.staff, ...missingStaff].map(st => ({ ...st, trust: st.trust ?? 75 })));
    }
    if (s.facilities) {
      const playerSavedTeam = s.allTeams?.find(t => t.isPlayer);
      const isSavedWorks = Boolean(
        playerSavedTeam?.isManufacturer ||
          playerSavedTeam?.engineOrigin === 'bought_factory' ||
          playerSavedTeam?.engineOrigin === 'phoenix'
      );
      const byId = new Map<string, Facility>(s.facilities.map(f => [f.id, f]));
      const merged: Facility[] = COMMON_FACILITIES_INITIAL.map(baseFac => {
        const existing = byId.get(baseFac.id);
        return existing ? { ...baseFac, ...existing } : { ...baseFac };
      });
      if (isSavedWorks) {
        const existingWorks = byId.get(WORKS_PU_FACTORY_INITIAL.id);
        merged.push(existingWorks ? { ...WORKS_PU_FACTORY_INITIAL, ...existingWorks } : { ...WORKS_PU_FACTORY_INITIAL });
      }
      setFacilities(merged);
    }
    if (s.components) setComponents(s.components);
    if (s.sponsors) setSponsors(s.sponsors);
    if (s.financials) setFinancials(s.financials);
    if (s.principalProfile) setPrincipalProfile(s.principalProfile);
    setVehicleParams(s.vehicleParams || DEFAULT_VEHICLE_PARAMS);
    setLastSimulationReport(s.lastSimulationReport ?? null);
    if (Array.isArray(s.unlockedPuMaterials) && s.unlockedPuMaterials.length > 0) {
      setUnlockedPuMaterials(s.unlockedPuMaterials);
    }
    setActivePuMaterialResearch(s.activePuMaterialResearch ?? null);
    setHaasCamaraEventResolved(Boolean(s.haasCamaraEventResolved));
    setPendingSeasonEventCard(s.pendingSeasonEventCard ?? null);
    setPendingMidSeasonDilemma(s.pendingMidSeasonDilemma ?? null);

    setShowStartScreen(false);
    setActiveTab('overview');
    playRadioSound();
    return true;
  };

  const loadRecentSave = () => {
    try {
      const raw = localStorage.getItem('f1_apex_recent_save');
      if (!raw) return false;
      return loadGameData(JSON.parse(raw));
    } catch {
      return false;
    }
  };

  const loadGame = (slotId: string) => {
    try {
      const raw = localStorage.getItem(`f1_apex_slot_${slotId}`);
      if (!raw) return false;
      return loadGameData(JSON.parse(raw));
    } catch {
      return false;
    }
  };

  const exportCareerStatePayload = () => {
    const playerT = allTeams.find(t => t.isPlayer) || allTeams[0];
    return {
      slotId: `cloud_${playerT.id}_${seasonYear}`,
      teamName: playerT.name,
      seasonYear,
      week: currentWeek,
      statePayload: {
        state: {
          currentWeek,
          seasonYear,
          currentCircuitIndex,
          allTeams,
          drivers,
          staff,
          facilities,
          components,
          sponsors,
          financials,
          principalProfile,
          vehicleParams,
          lastSimulationReport
        }
      }
    };
  };

  const importCareerStatePayload = (statePayload: Record<string, unknown>) => {
    try {
      const normalized = 'state' in statePayload ? statePayload : { state: statePayload };
      return loadGameData(normalized as Parameters<typeof loadGameData>[0]);
    } catch {
      return false;
    }
  };

  const deleteSaveSlot = (slotId: string) => {
    const updated = saveSlots.filter(s => s.id !== slotId);
    setSaveSlots(updated);
    localStorage.setItem('f1_apex_save_slots', JSON.stringify(updated));
    localStorage.removeItem(`f1_apex_slot_${slotId}`);
  };

  // Start New Game Configuration
  const startNewGame = (config: NewGameConfig) => {
    setPrincipalProfile({
      name: config.principalName,
      background: config.background
    });

    const mods = applyDnaModifiers(config.background);

    // Update player team selection
    setAllTeams(prev =>
      prev.map(t => {
        const isPlayer = t.id === config.selectedTeamId;
        return {
          ...t,
          isPlayer,
          reputation: isPlayer ? (t.reputation || 70) + mods.reputacaoBonus : t.reputation
        };
      })
    );

    // Initial Budget / Caixa: $135.000.000 + modificadorCaixaInicial
    const initialBank = 135000000 + mods.caixaInicial;

    setFinancials({
      bankBalance: initialBank,
      costCapLimit: 135000000,
      costCapSpent: 38000000,
      atrWindTunnelHoursAvailable: 360,
      atrCfdMegaAllocations: 300,
      atrPeriodWeeksLeft: 8
    });

    setComponents(prev =>
      prev.map(c => {
        let df = c.downforce;
        if (c.type === 'floor' || c.type === 'wings') {
          df += mods.downforce;
        }
        return {
          ...c,
          downforce: Math.round(df * 10) / 10,
          reliability: Math.min(100, Math.max(10, c.reliability + mods.confiabilidade))
        };
      })
    );

    if (mods.sinergiaPiloto) {
      setDrivers(prev =>
        prev.map(d => ({
          ...d,
          mentality: Math.max(20, Math.min(100, d.mentality + mods.sinergiaPiloto)),
          trust: Math.max(20, Math.min(100, (d.trust ?? 75) + Math.round(mods.sinergiaPiloto * 0.4))),
        }))
      );
    } else {
      setDrivers(prev => prev.map(d => ({ ...d, trust: d.trust ?? 75 })));
    }

    if (mods.moralFabrica) {
      setStaff(prev => prev.map(s => ({
        ...s,
        mentality: Math.max(20, Math.min(100, s.mentality + mods.moralFabrica)),
        morale: Math.max(20, Math.min(100, (s.morale ?? s.mentality) + mods.moralFabrica)),
        trust: s.trust ?? 75,
      })));
    } else {
      setStaff(prev => prev.map(s => ({ ...s, trust: s.trust ?? 75 })));
    }

    setCurrentWeek(1);
    setSeasonYear(2026);
    setCurrentCircuitIndex(0);
    setShowStartScreen(false);
    setActiveTab('overview');
    playRadioSound();

    // Auto-save the fresh new game
    setTimeout(() => {
      saveGame('slot_autosave');
    }, 500);
  };

  // Reset Total do Jogo para Nova Carreira (Reinicia na Fase 1: Escolha do Legado)
  const resetGameState = () => {
    // 1. Apagar o perfil do chefe e background
    setPrincipalProfile({
      name: 'Guilherme',
      background: 'chief_engineer'
    });

    // 2. Apagar nome da equipe, cores, logo, sede e restaurar grid original
    setAllTeams(JSON.parse(JSON.stringify(INITIAL_TEAMS)));

    // 3. Zerar as finanças (Caixa inicial e Teto de Gastos regulamentar)
    setFinancials({
      bankBalance: 135000000,
      costCapLimit: 135000000,
      costCapSpent: 38000000,
      atrWindTunnelHoursAvailable: 360,
      atrCfdMegaAllocations: 300,
      atrPeriodWeeksLeft: 8
    });

    // 4. Limpar escolha de motor, fábrica, componentes, pilotos e staff
    setDrivers(JSON.parse(JSON.stringify(INITIAL_DRIVERS)));
    setStaff(JSON.parse(JSON.stringify(INITIAL_STAFF)));
    setFacilities(JSON.parse(JSON.stringify(INITIAL_FACILITIES)));
    setComponents(JSON.parse(JSON.stringify(INITIAL_COMPONENTS)));
    setSponsors(JSON.parse(JSON.stringify(INITIAL_SPONSORS)));

    // 5. Apagar o cronômetro da pré-temporada (voltar para +8 semanas) e marketing
    setSemanasParaTeste(8);
    setBaseDeFas(5000000);
    setReceitaMarketing(2000000);
    setReceitaMerchandising(500000);
    setBaseDeFasHistory([
      {
        round: 0,
        raceName: 'Pré-Temporada',
        fans: 5000000,
        changePercent: 0
      }
    ]);

    // Resetar Modificadores de DNA
    setModificadorErroCorrelacao(-0.35);
    setModificadorSinergiaPiloto(-15);
    setModificadorTempoPeD(1.0);
    setModificadorConfiabilidade(0);
    setModificadorConfiancaDiretoria(0);
    setModificadorMoralFabrica(0);
    setModificadorCaixaInicial(0);
    setModificadorDownforce(0);
    setModificadorTempoManufatura(1.0);
    setModificadorSetupRapido(false);

    // Resetar Progressão de 3 Anos & Histórico
    setAtrNextYearAllocationRatio(0.40);
    setConsecutiveNoPointsRaces(0);
    setUsedPhoenixYear1(false);
    setPhoenixDiscountH1(false);
    setSeasonFinishHistory([]);
    setPerformanceHistory([
      {
        round: 0,
        season: 2026,
        circuitName: 'Pré-Temporada',
        playerRating: 81,
        rivalRatings: { ferrari: 92, redbull: 90, mercedes: 88 }
      }
    ]);

    // Resetar Calendário e Abas
    setCurrentWeek(1);
    setSeasonYear(2026);
    setCurrentCircuitIndex(0);
    setActiveTab('overview');

    // Resetar Sistema ADUO & Homologação FIA
    setAduoWindowActive(false);
    setAduoWeeksRemaining(0);
    setAduoHomologationQuotas(0);
    setAduoChassisDelayWeeks(0);
    setAduoLastGapPercent(0);
    setAduoBenchmarkPwr(90);
    setAduoPlayerPwr(82);
    setAduoHistory([]);
    setMotorHomologado(false);
    setSemanasRestantesPreTemporada(8);
    setPuClients([]);
    setVehicleParams(DEFAULT_VEHICLE_PARAMS);
    setLastSimulationReport(null);
    setPendingHaasCamaraEvent(null);
    setHaasCamaraEventResolved(false);
    setPendingSeasonEventCard(null);
    setPendingMidSeasonDilemma(null);

    // 6. Limpar o localStorage/sessionStorage para garantir que nenhum dado antigo fique salvo
    const currentLang = localStorage.getItem('f1_apex_lang') || language;
    try {
      localStorage.clear();
      sessionStorage.clear();
      if (currentLang) {
        localStorage.setItem('f1_apex_lang', currentLang);
      }
    } catch (_) {}

    // Desabilitar continuidades anteriores
    setHasRecentSave(false);
    setSaveSlots([]);

    // 7. Feedback visual do reset
    setResetToastMessage('Novo Estado Inicializado. Bem-vindo à Fórmula 1.');

    // 8. Reiniciar automaticamente a Fase 1: Escolha do Legado
    setOnboardingSessionKey(prev => prev + 1);
    setShowStartScreen(false);
    setShowOnboarding(true);
    playRadioSound();
  };

  // Complete Onboarding (from 7-Stage Official FIA / Legacy Script)
  const completeOnboarding = (data: OnboardingResult) => {
    setPrincipalProfile({
      name: data.principalName,
      background: data.principalBackground
    });

    const mods = applyDnaModifiers(data.principalBackground);
    if (data.rdTimePenaltyMultiplier && data.rdTimePenaltyMultiplier !== 1) {
      setModificadorTempoPeD(prev => Number((prev * data.rdTimePenaltyMultiplier!).toFixed(2)));
    }

    // Calculate final eFuel rating & partner power bonus
    let baseEFuel = 80;
    if (data.engineSupplier === 'Mercedes') baseEFuel = 95;
    else if (data.engineSupplier === 'Ferrari') baseEFuel = 80;
    else if (data.engineSupplier === 'Red Bull-Ford') baseEFuel = 85;
    else if (data.engineSupplier === 'Honda') baseEFuel = 80;
    else if (data.engineSupplier === 'Audi') baseEFuel = 75;
    else baseEFuel = 80;

    let partnerEFuelBonus = 0;
    let partnerPowerBonus = 0;
    if (data.fuelPartner === 'petronas') {
      partnerEFuelBonus = 5;
    } else if (data.fuelPartner === 'shell') {
      partnerPowerBonus = 3;
    } else if (data.fuelPartner === 'aramco') {
      partnerEFuelBonus = 2;
      partnerPowerBonus = 2;
    }

    let injectionDelta = 0;
    if (data.puInjectionMapping !== undefined) {
      injectionDelta = Math.round(5 * (50 - data.puInjectionMapping) / 50);
    }
    const calculatedEFuel = Math.min(100, Math.max(50, baseEFuel + partnerEFuelBonus + injectionDelta));

    // Marketing & Base de Fãs
    let finalFans = data.baseDeFas ?? 5000000;
    let finalMarketing = data.receitaMarketing ?? 2000000;
    let finalMerchandising = data.receitaMerchandising ?? 500000;
    const isManufacturer = data.engineOrigin === 'bought_factory' || data.engineOrigin === 'phoenix';
    const manufacturerRepBonus = isManufacturer ? 15 : 0;

    if (data.baseDeFas === undefined && isManufacturer) {
      finalFans += 5000000;
    }
    if (data.hasPatrioticBonus && data.baseDeFas === undefined) {
      finalFans *= 2;
      finalMarketing = Math.round(finalMarketing * 1.5);
    }

    setBaseDeFas(finalFans);
    setReceitaMarketing(finalMarketing);
    setReceitaMerchandising(finalMerchandising);
    setBaseDeFasHistory([
      {
        round: 0,
        raceName: 'Pré-Temporada',
        fans: finalFans,
        changePercent: 0
      }
    ]);
    if (data.semanasParaTeste !== undefined) {
      setSemanasParaTeste(data.semanasParaTeste);
    }

    // Update teams & drivers cleanly (strict 24 grid starters, no Colapinto/Lawson leftovers)
    const effectiveChiefMechIdPre = data.chiefMechanicId || 'staff_mech_fic_1';
    const baseUpdatedTeams = allTeams.map(team => {
      if (data.careerPath === 'custom_team') {
        if (team.id === 'apex') {
          return {
            ...team,
            name: data.teamName,
            shortName: data.teamShort,
            carModelName: data.chassisName || team.carModelName || 'APX-01',
            engineCustomName: data.customEngineName || data.engineSupplier || 'In-House',
            mechanicalDnfCount: 0,
            puDevelopmentCeilingPct:
              data.puDevelopmentCeilingPct ??
              (data.engineOrigin === 'bought_factory'
                ? data.thirdPartyErsSupplier
                  ? 92
                  : 94
                : 100),
            puCoolingAeroPenaltyPct:
              data.puCoolingAeroPenaltyPct ?? (data.thirdPartyErsSupplier ? 3.0 : 0),
            thirdPartyErsSupplier: data.thirdPartyErsSupplier ?? null,
            homologatedPeakPowerHp: data.homologatedPeakPowerHp,
            color: data.teamColor,
            location: data.location || team.location,
            isPlayer: true,
            role: 'owner' as const,
            isManufacturer,
            engineOrigin: data.engineOrigin,
            engineSupplier: (data.engineSupplier || 'In-House') as any,
            fuelPartner: data.fuelPartner || 'petronas',
            filosofiaAtual: data.philosophy,
            eFuelRating: calculatedEFuel,
            drivers: [data.driver1Id, data.driver2Id] as [string, string],
            affiliateDriverId: data.reserveDriverId || data.affiliateId,
            baseDeFas: finalFans,
            receitaMarketing: finalMarketing,
            receitaMerchandising: finalMerchandising,
            baseDeFasHistory: [{
              round: 0,
              raceName: 'Pré-Temporada',
              fans: finalFans,
              changePercent: 0
            }],
            headOfAero: data.headAeroId ? staff.find(s => s.id === data.headAeroId)?.name || team.headOfAero : team.headOfAero,
            headOfPowerUnit: data.headPUId ? staff.find(s => s.id === data.headPUId)?.name || team.headOfPowerUnit : team.headOfPowerUnit,
            sportingDirector: data.sportingDirectorId ? staff.find(s => s.id === data.sportingDirectorId)?.name || team.sportingDirector : team.sportingDirector,
            chiefMechanic: staff.find(s => s.id === effectiveChiefMechIdPre)?.name || team.chiefMechanic || 'Lee Stevenson',
            reputation: (team.reputation || 70) + mods.reputacaoBonus + manufacturerRepBonus
          };
        }
        return { ...team, isPlayer: false };
      } else {
        // Real Team Path
        if (team.id === data.teamId) {
          return {
            ...team,
            carModelName: data.chassisName || team.carModelName || 'R26',
            engineCustomName: data.customEngineName || team.engineSupplier,
            homologatedPeakPowerHp: data.homologatedPeakPowerHp,
            mechanicalDnfCount: 0,
            isPlayer: true,
            role: 'principal' as const,
            fuelPartner: data.fuelPartner || 'petronas',
            filosofiaAtual: data.philosophy,
            eFuelRating: calculatedEFuel,
            drivers: [data.driver1Id, data.driver2Id] as [string, string],
            affiliateDriverId: data.reserveDriverId || data.affiliateId,
            baseDeFas: finalFans,
            receitaMarketing: finalMarketing,
            receitaMerchandising: finalMerchandising,
            baseDeFasHistory: [{
              round: 0,
              raceName: 'Pré-Temporada',
              fans: finalFans,
              changePercent: 0
            }],
            headOfAero: data.headAeroId ? staff.find(s => s.id === data.headAeroId)?.name || team.headOfAero : team.headOfAero,
            headOfPowerUnit: data.headPUId ? staff.find(s => s.id === data.headPUId)?.name || team.headOfPowerUnit : team.headOfPowerUnit,
            sportingDirector: data.sportingDirectorId ? staff.find(s => s.id === data.sportingDirectorId)?.name || team.sportingDirector : team.sportingDirector,
            chiefMechanic: staff.find(s => s.id === effectiveChiefMechIdPre)?.name || team.chiefMechanic || 'Lee Stevenson',
            reputation: (team.reputation || 75) + mods.reputacaoBonus + manufacturerRepBonus
          };
        }
        return { ...team, isPlayer: false };
      }
    });

    const syncedRoster = syncTeamsAndDriversAfterOnboarding(
      baseUpdatedTeams,
      drivers,
      data,
      mods.sinergiaPiloto
    );
    setAllTeams(syncedRoster.teams);
    setDrivers(syncedRoster.drivers.map(d => ({ ...d, trust: d.trust ?? 75 })));
    setStaff(prev => prev.map(s => ({ ...s, trust: s.trust ?? 75 })));

    // Apply Background Caixa Inicial & Project Ambition (Phase 3) & Engine/HQ trade-offs
    const baseProjectBudget =
      data.careerPath === 'custom_team' && data.initialProjectBudgetUsd
        ? data.initialProjectBudgetUsd
        : 135000000;
    let startingBank = baseProjectBudget + mods.caixaInicial;
    let startingCostCapSpent = 38000000;

    // HQ Modifiers
    if (data.location?.includes('Charlotte')) {
      startingBank += 8000000; // Charlotte cash & sponsor bonus
    } else if (data.location?.includes('Faenza')) {
      startingBank = Math.max(10000000, startingBank - 5000000); // Faenza reduced starting budget
    }

    if (data.engineOrigin === 'bought_factory') {
      startingBank -= 24000000;
      startingCostCapSpent += 18000000;
    } else if (data.engineOrigin === 'phoenix') {
      startingBank -= 32000000;
      startingCostCapSpent += 25000000;
    }

    const thirdPartyErsCostToDeduct = data.thirdPartyErsCost ?? (data.thirdPartyErsMercedes ? 8000000 : 0);
    if (thirdPartyErsCostToDeduct > 0 && !(data.prototypeCostPaid && data.prototypeCostPaid >= thirdPartyErsCostToDeduct)) {
      startingBank -= thirdPartyErsCostToDeduct;
      startingCostCapSpent += thirdPartyErsCostToDeduct;
    }

    const emergencySupplier: CustomerEngineSupplier | undefined = data.emergencySupplier || (data.emergencyMercedesDeal ? 'Mercedes' : undefined);

    if (data.emergencyMercedesDeal || emergencySupplier) {
      startingBank -= (data.emergencyMercedesCost || 20000000);
      startingCostCapSpent += 15000000;
      setModificadorErroCorrelacao(prev => prev + (data.customCorrelationErrorMod !== undefined ? data.customCorrelationErrorMod : 0.15));
    }

    // Deduz custos de P&D de motor (Protótipo e Produção da frota de 8 motores) e Câmbio
    if (data.prototypeCostPaid) {
      startingBank -= data.prototypeCostPaid;
      startingCostCapSpent += data.prototypeCostPaid;
    }
    if (data.productionCostPaid) {
      startingBank -= data.productionCostPaid;
      startingCostCapSpent += data.productionCostPaid;
    }
    if (data.gearboxCostPaid) {
      startingBank -= data.gearboxCostPaid;
      startingCostCapSpent += data.gearboxCostPaid;
    }

    const isPreseasonMissed = Boolean(
      data.preseasonMissed || (!data.abandonedToZero && (data.semanasParaTeste ?? 8) < 0)
    );
    if (isPreseasonMissed) {
      startingBank -= 1500000; // Multa logística e frete aéreo emergencial por atraso de cronograma
    }

    setFinancials({
      bankBalance: startingBank,
      costCapLimit: 135000000,
      costCapSpent: startingCostCapSpent,
      atrWindTunnelHoursAvailable: data.careerPath === 'custom_team' ? 420 : 360,
      atrCfdMegaAllocations: data.careerPath === 'custom_team' ? 340 : 300,
      atrPeriodWeeksLeft: 8
    });

    // Initialize SI Vehicle Engineering Parameters from Onboarding decisions (prefer full M01-M12 draft if provided)
    const fallbackVehicleParams: VehicleEngineeringParameters = {
      ...DEFAULT_VEHICLE_PARAMS,
      gearboxMaterial: data.gearboxConfig?.material || DEFAULT_VEHICLE_PARAMS.gearboxMaterial,
      gearRatioBias: data.gearboxConfig?.ratio ?? DEFAULT_VEHICLE_PARAMS.gearRatioBias,
      gearboxLayout: data.gearboxConfig?.layout || DEFAULT_VEHICLE_PARAMS.gearboxLayout,
      frontSuspensionType: data.chassisConfig?.suspensionFront || DEFAULT_VEHICLE_PARAMS.frontSuspensionType,
      rearSuspensionType: data.chassisConfig?.suspensionRear || DEFAULT_VEHICLE_PARAMS.rearSuspensionType,
      sidepodInletAreaCm2:
        data.chassisConfig?.sidepodConcept === 'zeropod'
          ? 275
          : data.chassisConfig?.sidepodConcept === 'conventional'
          ? 395
          : 335,
      hotAirExitAreaCm2:
        data.chassisConfig?.sidepodConcept === 'zeropod'
          ? 265
          : data.chassisConfig?.sidepodConcept === 'conventional'
          ? 380
          : 325,
      sidepodUndercutPct:
        data.chassisConfig?.sidepodConcept === 'zeropod'
          ? 78
          : data.chassisConfig?.sidepodConcept === 'downwash'
          ? 68
          : 44,
      radiatorVolumeL:
        data.chassisConfig?.sidepodConcept === 'zeropod'
          ? 10.6
          : data.chassisConfig?.sidepodConcept === 'conventional'
          ? 14.5
          : 12.6,
      frontWingFlapCornerDeg:
        data.philosophy === 'high_downforce' ? 35 : data.philosophy === 'low_drag' ? 27 : 31,
      rearWingFlapCornerDeg:
        data.philosophy === 'high_downforce' ? 39 : data.philosophy === 'low_drag' ? 30 : 35,
      diffuserAngleDeg:
        data.philosophy === 'high_downforce' ? 10.6 : data.philosophy === 'low_drag' ? 8.8 : 9.6,
      springRateNmm: data.philosophy === 'tire_preservation' || data.philosophy === 'mechanical_grip' ? 205 : data.philosophy === 'high_downforce' ? 265 : 230,
      ersDeployBiasPct: data.engineModifications?.reprogramErs ? 68 : 52,
      iceMaterial: data.engineModifications?.reinforcePistons ? 'titanium' : DEFAULT_VEHICLE_PARAMS.iceMaterial,
      iceCompressionRatio: data.engineModifications?.redesignChamber ? 15.95 : 15.65
    };
    const dnaSpec = getSupplierDnaSpec(data.engineSupplier);
    setUnlockedPuMaterials(dnaSpec.starterUnlockedMaterials);
    setActivePuMaterialResearch(null);

    const initialVehicleParams: VehicleEngineeringParameters = data.vehicleParams
      ? {
          ...DEFAULT_VEHICLE_PARAMS,
          iceMetallurgyId: dnaSpec.defaultIceMetallurgy,
          batterySubChemistry: dnaSpec.defaultBatterySubChem,
          ...data.vehicleParams,
        }
      : {
          ...fallbackVehicleParams,
          iceMetallurgyId: dnaSpec.defaultIceMetallurgy,
          batterySubChemistry: dnaSpec.defaultBatterySubChem,
        };
    setVehicleParams(initialVehicleParams);
    setLastSimulationReport(null);
    const solvedInitialPhysics = solveVehiclePhysics(initialVehicleParams, {
      componentLevelAvg: 1,
      aeroDownforceOffset: mods.downforce
    });

    // Apply Car Philosophy, Background bonuses and Emergency Engine penalties to initial components
    setComponents(prev =>
      prev.map(c => {
        let dfDelta = 0;
        let dragMod = 1.0;
        let weightDelta = 0;
        let relDelta = 0;

        if (data.philosophy === 'high_downforce' && (c.type === 'wings' || c.type === 'floor')) {
          dfDelta = 8;
          dragMod = 1.04;
        } else if (data.philosophy === 'low_drag' && (c.type === 'wings' || c.type === 'chassis')) {
          dragMod = 0.94;
        } else if ((data.philosophy === 'tire_preservation' || data.philosophy === 'mechanical_grip') && c.type === 'suspension') {
          dfDelta = 3;
        } else if (data.philosophy === 'aero_efficiency' && (c.type === 'wings' || c.type === 'floor')) {
          dfDelta = 4;
          dragMod = 0.97;
        } else if (data.philosophy === 'stable_platform' && (c.type === 'suspension' || c.type === 'floor')) {
          dfDelta = 3;
        }

        if (c.type === 'floor' || c.type === 'wings') {
          dfDelta += mods.downforce;
          if (data.silentSabotageAeroPct && data.silentSabotageAeroPct < 0) {
            dfDelta += Math.round(c.downforce * (data.silentSabotageAeroPct / 100));
          }
          const puCoolingPenalty =
            data.puCoolingAeroPenaltyPct ?? (data.thirdPartyErsSupplier ? 3.0 : 0);
          if (puCoolingPenalty > 0) {
            dfDelta -= Math.round(c.downforce * (puCoolingPenalty / 100) * 10) / 10;
            dragMod *= 1 + puCoolingPenalty * 0.008;
          }
        }

        // Penalidades específicas por fornecedor cliente de emergência:
        if (emergencySupplier === 'Mercedes') {
          // Mercedes: -3 de eficiência de arrasto (DRG) por sidepods abertos (+5% arrasto)
          if (c.type === 'chassis' || c.type === 'wings') {
            dragMod *= 1.05;
          }
        } else if (emergencySupplier === 'Ferrari') {
          // Ferrari: -5 de Downforce (DFm) no assoalho
          if (c.type === 'floor') {
            dfDelta -= 5;
          }
        } else if (emergencySupplier === 'Honda') {
          // Honda: 20% de risco de quebra do câmbio na corrida 1 (-15 confiabilidade no câmbio)
          if (c.type === 'gearbox') {
            relDelta -= 15;
          }
        } else if (emergencySupplier === 'Audi') {
          // Audi: Perde -5 de Peso (WGT) -> +5kg por reforço estrutural no chassi
          if (c.type === 'chassis') {
            weightDelta += 5;
          }
        }

        const rawPuPerf = Math.round((solvedInitialPhysics.totalWheelPowerKw / 760) * 86) + partnerPowerBonus;
        let physicsPerfSync =
          c.type === 'pu'
            ? rawPuPerf
            : c.type === 'floor' || c.type === 'wings'
            ? solvedInitialPhysics.summary.aeroScore
            : c.performance;

        let blendedPerf = Math.min(99, Math.max(60, Math.round((c.performance + physicsPerfSync) / 2)));
        if (c.type === 'pu' && data.careerPath === 'custom_team') {
          if (data.engineOrigin === 'bought_factory') {
            const targetMaturity = data.puMaturityScore ?? Math.min(84, Math.max(78, blendedPerf));
            blendedPerf = Math.min(84, Math.max(78, targetMaturity));
          } else if (data.engineOrigin === 'phoenix') {
            const targetMaturity = data.puMaturityScore ?? Math.min(80, Math.max(74, blendedPerf));
            blendedPerf = Math.min(80, Math.max(74, targetMaturity));
          }
        }

        return {
          ...c,
          performance: blendedPerf,
          reliability: Math.min(100, Math.max(10, c.reliability + mods.confiabilidade + relDelta)),
          downforce: Math.round((c.downforce + dfDelta) * 10) / 10,
          dragCoefficient: Math.round(c.dragCoefficient * dragMod * 1000) / 1000,
          weightKg: c.weightKg + weightDelta
        };
      })
    );

    // Drivers & Teams já sincronizados acima via syncTeamsAndDriversAfterOnboarding (mantendo 24 titulares únicos)

    // GDD v9.0.0 Sec. 9-10: Initialize 15 common facilities (+16th Works PU Factory if manufacturer)
    // Apply Phase 3 Board Project Bet (Bold = Level 2 Aero/Factory; Grounded = Level 1 with wear)
    const baseFacilities = getInitialFacilities(isManufacturer);
    const initializedFacilities = baseFacilities.map(f => {
      if (data.careerPath === 'custom_team' && data.projectAmbition === 'bold') {
        const isAeroOrFactory = ['fac_wind_tunnel', 'fac_cfd', 'fac_design_office', 'fac_manufacturing'].includes(f.id);
        if (isAeroOrFactory) {
          return {
            ...f,
            level: 2,
            capacidade: Math.min(100, (f.capacidade ?? 45) + 14),
            qualidade: Math.min(100, (f.qualidade ?? 46) + 14),
            produtividade: Math.min(100, (f.produtividade ?? 44) + 12),
            tecnologia: Math.min(100, (f.tecnologia ?? 44) + 14),
            upgradeCost: Math.round(f.upgradeCost * 1.35),
            annualUpkeep: Math.round(f.annualUpkeep * 1.25)
          };
        }
      } else if (data.careerPath === 'custom_team' && data.projectAmbition === 'grounded') {
        return {
          ...f,
          conservacaoPct: Math.max(66, (f.conservacaoPct ?? 95) - 24),
          manutencaoNecessaria: f.category === 'desenvolvimento'
        };
      }
      return f;
    });
    setFacilities(initializedFacilities);

    // Update Staff with hired Technical Pillars (Phase 3) + Race Radio Engineers (Phase 6)
    const effectiveChiefMechId = data.chiefMechanicId || 'staff_mech_fic_1';
    const hiredStaffIds = new Set(
      [
        data.headAeroId,
        data.headPUId,
        data.sportingDirectorId,
        effectiveChiefMechId,
        data.raceEngineer1Id,
        data.raceEngineer2Id
      ].filter(Boolean)
    );
    setStaff(prev =>
      prev.map(s => {
        const isHired = hiredStaffIds.has(s.id);
        const baseMentality = isHired ? 92 : s.mentality;
        const factoryMod = mods.moralFabrica || 0;
        const isTechnicalBoard =
          s.id === data.headAeroId || s.id === data.headPUId || s.id === data.sportingDirectorId;
        const boardCascadeMod = isTechnicalBoard ? (data.boardroomConflictMoralePenalty || 0) : 0;
        const preseasonFatiguePenalty = isPreseasonMissed ? -8 : 0;
        return {
          ...s,
          currentTeam: isHired ? (data.careerPath === 'custom_team' ? 'APEX Grand Prix Team' : data.teamName) : s.currentTeam,
          mentality: Math.max(20, Math.min(100, baseMentality + factoryMod + boardCascadeMod + preseasonFatiguePenalty)),
          morale: Math.max(15, Math.min(100, (s.morale ?? baseMentality) + factoryMod + boardCascadeMod + preseasonFatiguePenalty))
        };
      })
    );

    const startingWeek = data.abandonedToZero
      ? 5
      : ((data.testResult?.delayWeeks || 0) > 0 ? 1 + data.testResult!.delayWeeks : 1);
    const startingCircuitIndex = data.abandonedToZero ? 4 : (startingWeek > 1 ? Math.min(startingWeek - 1, 3) : 0);
    setCurrentWeek(startingWeek);
    setSeasonYear(2026);
    setCurrentCircuitIndex(startingCircuitIndex);
    setSetupWindow(prev => ({
      ...prev,
      confidence: isPreseasonMissed || data.abandonedToZero ? 0 : 45
    }));
    setFpRunsDone(0);

    const delayMsg = data.abandonedToZero
      ? ' ATENÇÃO: Protocolo Fênix Total ativado! Devido ao descarte da PU anterior e construção do novo motor in-house do zero (18 semanas de atraso), a equipe perdeu a pré-temporada e as primeiras 4 corridas (DNS), estreando oficialmente na Semana 5 no GP de Miami!'
      : ((data.testResult?.delayWeeks || 0) > 0
          ? ` ATENÇÃO: Devido ao atraso no desenvolvimento do motor (+${data.testResult?.delayWeeks} semanas), a equipe entra na temporada a partir da Semana ${startingWeek}.`
          : '');

    const emergencyNotifs = [];
    if (emergencySupplier) {
      const emergencyDetails: Record<CustomerEngineSupplier, string> = {
        Mercedes: 'Motor Mercedes de emergência: Pacote pesado (-3 DRG de eficiência aerodinâmica por refrigeração ampliada). Custo: $20M (+2 semanas de atraso, +15% erro de túnel de vento).',
        Ferrari: 'Motor Ferrari de emergência: Dissipação crítica (-5 DFm de downforce no assoalho por traseira redesenhada). Custo: $20M (+2 semanas de atraso, +15% erro de túnel de vento).',
        Honda: 'Motor Honda de emergência: Alerta de vibrações severas (20% de risco de quebra mecânica do câmbio na corrida 1). Custo: $20M (+2 semanas de atraso, +15% erro de túnel de vento).',
        'Red Bull-Ford': 'Motor Red Bull-Ford de emergência: ERS instável (clipping severo com perda de 0,3s por volta nas primeiras 3 corridas). Custo: $20M (+2 semanas de atraso, +15% erro de túnel de vento).',
        Audi: 'Motor Audi de emergência: Bloco largo e inexperiente (-5 WGT por reforço estrutural de +5kg no chassi). Custo: $20M (+2 semanas de atraso, +15% erro de túnel de vento).'
      };

      emergencyNotifs.push({
        id: `notif_emergency_${Date.now()}`,
        title: `ACORDO EMERGENCIAL: FORNECEDOR ${emergencySupplier.toUpperCase()}`,
        message: emergencyDetails[emergencySupplier] || `Acordo de emergência homologado com ${emergencySupplier}.`,
        date: `Semana ${startingWeek}`,
        type: 'warning' as const
      });
    }

    const cascadingNotifs = [];
    if (data.cascadingNarrativeEvent) {
      cascadingNotifs.push({
        id: `notif_cascade_event_${Date.now()}`,
        title: data.cascadingNarrativeEvent.title,
        message: data.cascadingNarrativeEvent.message,
        date: `Semana ${startingWeek}`,
        type: 'warning' as const
      });
      if (data.cascadingNarrativeEvent.mediaHeadline) {
        cascadingNotifs.push({
          id: `notif_cascade_media_${Date.now() + 1}`,
          title: 'RADAR DA IMPRENSA · CRISE INTERNA',
          message: data.cascadingNarrativeEvent.mediaHeadline,
          date: `Semana ${startingWeek}`,
          type: 'penalty' as const
        });
      }
    }

    const preseasonNotifs = [];
    if (isPreseasonMissed) {
      const overrunWeeks = data.preseasonOverrunWeeks ?? Math.abs(data.semanasParaTeste ?? 1);
      preseasonNotifs.push({
        id: `notif_preseason_missed_${Date.now()}`,
        title: 'CRONOGRAMA ESTOURADO: ESTREIA SEM PRÉ-TEMPORADA',
        message: `⚠️ Devido ao atraso na homologação (${overrunWeeks} semana(s) além do prazo), a equipe não possui dados de telemetria de pré-temporada. O acerto do carro no GP1 começará do zero (0% no TL1). Impactos aplicados: -$1.5M de frete aéreo emergencial e -8% de moral por exaustão dos engenheiros.`,
        date: `Semana ${startingWeek}`,
        type: 'penalty' as const
      });
    }

    setNotifications([
      ...preseasonNotifs,
      ...emergencyNotifs,
      ...cascadingNotifs,
      {
        id: `notif_ratified_${Date.now()}`,
        title: 'FIA 2026 WORLD CHAMPIONSHIP HOMOLOGATION',
        message: `${data.teamName} devidamente homologada sob comando de ${data.principalName} (${data.userRole === 'owner' ? 'Dono Construtor' : 'Team Principal'}). Sede: ${data.location || 'Silverstone, Reino Unido'}. Unidade de Potência: ${data.engineSupplier} (${data.engineOrigin.toUpperCase()}). Filosofia do carro: ${data.philosophy.toUpperCase()}.${delayMsg}`,
        date: `Semana ${startingWeek}`,
        type: 'info'
      }
    ]);

    setShowOnboarding(false);
    setShowStartScreen(false);
    setActiveTab('overview');
    playRadioSound();

    setTimeout(() => {
      saveGame('slot_autosave');
    }, 600);
  };

  const [carSetup, setCarSetup] = useState<CarSetup>({
    frontWingAngle: 28,
    rearWingAngle: 32,
    suspensionStiffness: 6,
    camberAngle: -2.8,
    tirePressurePsi: 22.5,
    gearRatioBias: 50
  });

  const [setupWindow, setSetupWindow] = useState<SetupWindow>({
    idealFrontWing: 26,
    idealRearWing: 30,
    idealStiffness: 6,
    idealPressure: 22.8,
    confidence: 45
  });

  const [selectedAffiliateInFP1, setSelectedAffiliateInFP1] = useState(false);
  const [weekendSession, setWeekendSession] = useState<WeekendSession>('setup_fp');
  const [fpRunsDone, setFpRunsDone] = useState(0);
  const [qualifyingResults, setQualifyingResults] = useState<{ driverId: string; lapTimeSec: number; position: number }[]>([]);

  // Live Race Simulation State
  const [isRaceLive, setIsRaceLive] = useState(false);
  const [isRacePaused, setIsRacePaused] = useState(false);
  const [raceSpeed, setRaceSpeed] = useState(1);
  const [currentLap, setCurrentLap] = useState(1);
  const [trackWeather, setTrackWeather] = useState<'sunny' | 'overcast' | 'light_rain' | 'heavy_rain'>('sunny');
  const [trackGripPercent, setTrackGripPercent] = useState(98);
  const [safetyCarStatus, setSafetyCarStatus] = useState<'none' | 'vsc' | 'full_sc'>('none');
  const [trackFlagStatus, setTrackFlagStatus] = useState<TrackFlagStatus>('green');
  const [raceControlFeed, setRaceControlFeed] = useState<RaceControlEvent[]>([]);
  const [pitLaneStartDriverIds, setPitLaneStartDriverIds] = useState<string[]>([]);
  const [liveCars, setLiveCars] = useState<LiveCarState[]>([]);

  const liveCarsRef = useRef<LiveCarState[]>([]);
  useEffect(() => {
    liveCarsRef.current = liveCars;
  }, [liveCars]);
  const raceFlagRef = useRef<RaceFlagState>({ flag: 'green', expiresAtLap: 0 });
  const resolvedAdviceKeysRef = useRef<Set<string>>(new Set());

  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; date: string; type: 'info' | 'warning' | 'penalty' }[]>([
    {
      id: 'notif_welcome',
      title: '2026 HYBRID REGULATIONS RATIFIED',
      message: 'Active aerodynamics (Mode X/Z) and 350kW ERS operational. Cost Cap verified at $135M. Welcome to the pit wall, Team Principal.',
      date: 'Week 1',
      type: 'info'
    }
  ]);

  const [pendingRegulationChange, setPendingRegulationChange] = useState<{
    title: string;
    description: string;
    impact: string;
    targetSeason: number;
    options: { label: string; cost: number; performanceRetained: number }[];
  } | null>(null);
  const [haasCamaraEventResolved, setHaasCamaraEventResolved] = useState<boolean>(false);
  const [pendingHaasCamaraEvent, setPendingHaasCamaraEvent] = useState<{
    round: number;
    gpName: string;
  } | null>(null);
  const [pendingSeasonEventCard, setPendingSeasonEventCard] = useState<SeasonEventCard | null>(null);
  const [pendingMidSeasonDilemma, setPendingMidSeasonDilemma] = useState<MidSeasonDilemma | null>(null);

  const rdFacilityCapacity = useMemo(() => computeRdFacilityCapacity(facilities), [facilities]);

  const seasonCircuits = useMemo(() => {
    const loaded = loadSeasonCircuits(seasonYear);
    return loaded.length > 0 ? loaded : CIRCUITS;
  }, [seasonYear]);
  const currentCircuit = seasonCircuits[currentCircuitIndex % seasonCircuits.length];
  const currentCircuitPackage = useMemo(
    () => loadCircuitPackage(currentCircuit.id, seasonYear),
    [currentCircuit.id, seasonYear]
  );
  const currentTrackPhysics = useMemo(
    () => evaluateTrackPhysics(currentCircuitPackage, vehicleParams, vehiclePhysics),
    [currentCircuitPackage, vehicleParams, vehiclePhysics]
  );
  const playerTeam = allTeams.find(t => t.isPlayer) || allTeams[0];

  // Helper to add notification
  const addNotification = (title: string, message: string, type: 'info' | 'warning' | 'penalty' = 'info') => {
    setNotifications(prev => [
      { id: `notif_${Date.now()}_${Math.random()}`, title, message, date: `Week ${currentWeek}`, type },
      ...prev.slice(0, 15)
    ]);
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Car Setup updater
  const updateCarSetup = (partial: Partial<CarSetup>) => {
    setCarSetup(prev => ({ ...prev, ...partial }));
  };

  // Trigger Driver Zero-Trust Crisis: Press Leak + Sponsor & Reputation Damage
  const triggerDriverZeroTrustCrisis = (driverName: string) => {
    addNotification(
      'CRISE NA IMPRENSA: VAZAMENTO DE PILOTO',
      `${driverName} vazou para a imprensa: "O carro é inguiável, o chefe não me escuta." (-5 Reputação · -10 Satisfação dos Patrocinadores · Risco elevado de acidente em pista).`,
      'penalty'
    );
    setAllTeams(prev =>
      prev.map(t =>
        t.isPlayer
          ? { ...t, reputation: Math.max(5, (t.reputation ?? 65) - 5) }
          : t
      )
    );
    setSponsors(prev =>
      prev.map(sp =>
        sp.active
          ? { ...sp, satisfaction: Math.max(5, sp.satisfaction - 10) }
          : sp
      )
    );
  };

  // Escuta Ativa: Chefe de Setor na Mesa de Projetos CAD
  const respondToChiefAdvice = (
    decision: 'follow' | 'ignore',
    payload: {
      chiefId: string;
      chiefName: string;
      adviceKey: string;
      recommendedPatch?: Partial<VehicleEngineeringParameters> | null;
    }
  ) => {
    const dedupKey = `chief_${currentWeek}_${payload.chiefId}_${payload.adviceKey}_${decision}`;
    const alreadyScored = resolvedAdviceKeysRef.current.has(dedupKey);
    resolvedAdviceKeysRef.current.add(dedupKey);

    if (decision === 'follow') {
      if (payload.recommendedPatch) {
        updateVehicleParams(payload.recommendedPatch);
      }
      if (!alreadyScored) {
        setStaff(prev =>
          prev.map(s =>
            s.id === payload.chiefId
              ? {
                  ...s,
                  trust: Math.min(100, (s.trust ?? 75) + 10),
                  mentality: Math.min(100, s.mentality + 5),
                  morale: Math.min(100, (s.morale ?? s.mentality) + 5),
                }
              : s
          )
        );
        setDrivers(prev =>
          prev.map(d =>
            playerTeam.drivers.includes(d.id)
              ? { ...d, trust: Math.min(100, (d.trust ?? 75) + 2) }
              : d
          )
        );
      }
      addNotification(
        `ESCUTA ATIVA: ${payload.chiefName.toUpperCase()}`,
        `Conselho técnico aplicado ao CAD! ${payload.chiefName} ganhou +10 Confiança e +5 Moral (bônus de +5% velocidade P&D desbloqueado neste setor).`,
        'info'
      );
      playRadioSound();
    } else {
      let droppedBelow40 = false;
      if (!alreadyScored) {
        setStaff(prev =>
          prev.map(s => {
            if (s.id !== payload.chiefId) return s;
            const prevTrust = s.trust ?? 75;
            const nextTrust = Math.max(0, prevTrust - 15);
            if (prevTrust >= 40 && nextTrust < 40) droppedBelow40 = true;
            return {
              ...s,
              trust: nextTrust,
              mentality: Math.max(15, s.mentality - 5),
              morale: Math.max(15, (s.morale ?? s.mentality) - 5),
            };
          })
        );
      }
      addNotification(
        `DECISÃO IMPOSITIVA: ${payload.chiefName.toUpperCase()} IGNORADO`,
        droppedBelow40
          ? `${payload.chiefName} perdeu -15 Confiança e entrou em estado DESENGAJADO (<40). Próximos projetos neste setor ficarão +10% mais lentos!`
          : `Você manteve sua escolha contra o parecer de ${payload.chiefName} (-15 Confiança, -5 Moral do setor).`,
        'warning'
      );
      playRadioSound();
    }
  };

  // Escuta Ativa: Piloto (Simulador ou Rádio do Treino Livre)
  const respondToDriverFeedback = (
    decision: 'listen' | 'ignore',
    driverId: string,
    contextTag: string,
    patches?: {
      vehiclePatch?: Partial<VehicleEngineeringParameters>;
      setupPatch?: Partial<CarSetup>;
    }
  ) => {
    const targetDriver = drivers.find(d => d.id === driverId) || drivers.find(d => playerTeam.drivers.includes(d.id));
    if (!targetDriver) return;

    const dedupKey = `driver_${currentWeek}_${targetDriver.id}_${contextTag}_${decision}`;
    const alreadyScored = resolvedAdviceKeysRef.current.has(dedupKey);
    resolvedAdviceKeysRef.current.add(dedupKey);

    if (decision === 'listen') {
      if (patches?.vehiclePatch) updateVehicleParams(patches.vehiclePatch);
      if (patches?.setupPatch) updateCarSetup(patches.setupPatch);
      if (!alreadyScored) {
        setDrivers(prev =>
          prev.map(d =>
            d.id === targetDriver.id
              ? {
                  ...d,
                  trust: Math.min(100, (d.trust ?? 75) + 8),
                  mentality: Math.min(100, d.mentality + 4),
                }
              : d
          )
        );
      }
      addNotification(
        `FEEDBACK DE ${targetDriver.name.toUpperCase()} APLICADO`,
        `Ajuste recomendado aplicado! ${targetDriver.name} ganhou +8 Confiança e +4 Moral para o próximo stint.`,
        'info'
      );
      playRadioSound();
    } else {
      if (!alreadyScored) {
        const prevTrust = targetDriver.trust ?? 75;
        const nextTrust = Math.max(0, prevTrust - 12);
        setDrivers(prev =>
          prev.map(d =>
            d.id === targetDriver.id
              ? {
                  ...d,
                  trust: nextTrust,
                  mentality: Math.max(15, d.mentality - 6),
                }
              : d
          )
        );
        if (nextTrust === 0 && prevTrust > 0) {
          triggerDriverZeroTrustCrisis(targetDriver.name);
        } else {
          addNotification(
            `FEEDBACK IGNORADO (${targetDriver.shortCode})`,
            `${targetDriver.name} ficou frustrado com a recusa do box (-12 Confiança, -6 Moral).`,
            'warning'
          );
        }
      }
      playRadioSound();
    }
  };

  // Start Component Development in CAD
  const startComponentDevelopment = (
    newComp: ComponentSpec,
    options?: {
      atrHoursCost?: number;
      chiefId?: string;
      chiefName?: string;
      adviceFollowed?: boolean;
    }
  ): boolean => {
    // 1. LIMITE FÍSICO (NÍVEL MÁXIMO 10):
    const existingComp = components.find(c => c.type === newComp.type);
    if (existingComp && existingComp.level >= (existingComp.maxLevel || 10)) {
      addNotification(
        'LIMITE FÍSICO ATINGIDO (NÍVEL 10)',
        `O componente ${existingComp.name} já atingiu o teto físico regulamentar (Nível 10). Rendimento zero até alteração de regulamento técnico da FIA!`,
        'warning'
      );
      return false;
    }

    // 1B. SLOTS DE P&D BASEADOS NO NÍVEL DA FÁBRICA E TÚNEL DE VENTO:
    const activeDevComponents = components.filter(c => c.inDevelopment && c.type !== newComp.type);
    if (activeDevComponents.length >= rdFacilityCapacity.manufacturingMaxSlots) {
      addNotification(
        'SLOTS DA FÁBRICA LOTADOS',
        `Fábrica Nível ${rdFacilityCapacity.manufacturingLevel} permite até ${rdFacilityCapacity.manufacturingMaxSlots} projetos simultâneos em P&D. Conclua um projeto ou evolua a Fábrica de Manufatura.`,
        'warning'
      );
      return false;
    }

    const isAeroComp = newComp.type === 'floor' || newComp.type === 'wings';
    if (isAeroComp) {
      const activeAeroDevs = activeDevComponents.filter(c => c.type === 'floor' || c.type === 'wings').length;
      if (activeAeroDevs >= rdFacilityCapacity.aeroMaxSlots) {
        addNotification(
          'TÚNEL DE VENTO OCUPADO',
          `Túnel de Vento Nível ${rdFacilityCapacity.windTunnelLevel} comporta até ${rdFacilityCapacity.aeroMaxSlots} pacote(s) aerodinâmico(s) paralelo(s). Evolua o Túnel de Vento para liberar novos slots.`,
          'warning'
        );
        return false;
      }
    }

    // 1C. HORAS DE TÚNEL DE VENTO (ATR) DA FABRICAÇÃO CAD:
    const atrCost = Math.max(0, options?.atrHoursCost ?? newComp.atrHoursCost ?? 0);
    if (atrCost > 0 && financials.atrWindTunnelHoursAvailable < atrCost) {
      addNotification(
        'HORAS ATR INSUFICIENTES',
        `Esta peça exige ${atrCost}h de Túnel de Vento (disponível: ${financials.atrWindTunnelHoursAvailable}h). Reduza escopo ou aguarde o próximo período ATR.`,
        'warning'
      );
      return false;
    }

    // 4. BÔNUS DA FÊNIX ANO 2: 50% de desconto em PU no H1
    let effectiveCost = newComp.cost;
    let effectiveCostCap = newComp.costCapImpact;
    if (phoenixDiscountH1 && newComp.type === 'pu') {
      effectiveCost = Math.round(effectiveCost * 0.5);
      effectiveCostCap = Math.round(effectiveCostCap * 0.5);
    }

    if (financials.bankBalance < effectiveCost) {
      addNotification('INSUFFICIENT REAL CASH', 'You cannot afford this CAD project.', 'warning');
      return false;
    }
    if (financials.costCapSpent + effectiveCostCap > financials.costCapLimit) {
      addNotification('FIA COST CAP WARNING', 'Developing this component will breach the Cost Cap! Incurring FIA review.', 'penalty');
    }

    // Bônus de Eficiência Aero pelo nível do Túnel de Vento (+5% por nível acima do 1)
    let adjustedDownforce = newComp.downforce;
    if (isAeroComp && existingComp && rdFacilityCapacity.aeroEfficiencyBonusPct > 0) {
      const baseGain = Math.max(0, newComp.downforce - existingComp.downforce);
      const boostedGain = baseGain * (1 + rdFacilityCapacity.aeroEfficiencyBonusPct / 100);
      adjustedDownforce = Math.round((existingComp.downforce + boostedGain) * 10) / 10;
    }

    // Teto arquitetônico de PU comprada no Ano 1 (92%–94%): ganhos de potência saturam cedo até ADUO/Ano 2
    let adjustedPuPerformance = newComp.performance;
    let puCeilingNote = '';
    const puCeilingPct = playerTeam.puDevelopmentCeilingPct ?? 100;
    if (newComp.type === 'pu' && existingComp && puCeilingPct < 100) {
      const maxYear1Ceiling = Math.round((puCeilingPct / 100) * 92);
      const rawDelta = Math.max(0, newComp.performance - existingComp.performance);
      const cappedDelta = existingComp.performance >= 82 ? Math.min(1, rawDelta) : Math.min(2, rawDelta);
      adjustedPuPerformance = Math.min(maxYear1Ceiling, existingComp.performance + cappedDelta);
      puCeilingNote = ` · Teto Arquitetura Ano 1 (${puCeilingPct}%): ganho limitado a ${adjustedPuPerformance} PWR`;
    }

    // Fórmula: TempoFinal = TempoBase * modificadorTempoManufatura * modificadorTempoPeD * puClientMultiplier * chiefSpeedFactor
    const activeClientsCount = puClients.filter(c => c.status === 'active').length;
    let puClientMultiplier = 1.0;
    if (newComp.type === 'pu') {
      if (activeClientsCount === 1) puClientMultiplier = 1.5;
      else if (activeClientsCount >= 2) puClientMultiplier = 2.0; // Vender para 2 equipes dobra o tempo de upgrade!
    }

    const activeChief = options?.chiefId ? staff.find(s => s.id === options.chiefId) : undefined;
    const chiefTrust = activeChief?.trust ?? 75;
    const chiefSpeedFactor =
      chiefTrust < 40 ? 1.10 : options?.adviceFollowed === true ? 0.95 : 1.0;

    const tempoBase = newComp.designWeeks;
    const rawWeeks = tempoBase * modificadorTempoManufatura * modificadorTempoPeD * puClientMultiplier * chiefSpeedFactor;
    const devWeeks =
      options?.adviceFollowed === true && chiefTrust >= 40 && tempoBase >= 4
        ? Math.max(1, Math.min(Math.round(tempoBase * modificadorTempoManufatura * modificadorTempoPeD * puClientMultiplier) - 1, Math.round(rawWeeks)))
        : Math.max(1, Math.round(rawWeeks));

    setFinancials(prev => ({
      ...prev,
      bankBalance: prev.bankBalance - effectiveCost,
      costCapSpent: prev.costCapSpent + effectiveCostCap,
      atrWindTunnelHoursAvailable: Math.max(0, prev.atrWindTunnelHoursAvailable - atrCost),
    }));

    if (options?.chiefId && options.adviceFollowed !== undefined) {
      setStaff(prev =>
        prev.map(s => {
          if (s.id !== options.chiefId) return s;
          const prevTrust = s.trust ?? 75;
          const prevMorale = s.morale ?? s.mentality;
          if (options.adviceFollowed) {
            return {
              ...s,
              trust: Math.min(100, prevTrust + 5),
              mentality: Math.min(100, s.mentality + 4),
              morale: Math.min(100, prevMorale + 4),
            };
          }
          return {
            ...s,
            trust: Math.max(0, prevTrust - 15),
            mentality: Math.max(15, s.mentality - 5),
            morale: Math.max(15, prevMorale - 5),
          };
        })
      );
    }

    setComponents(prev => [
      ...prev.filter(c => c.type !== newComp.type),
      {
        ...newComp,
        performance: adjustedPuPerformance,
        downforce: adjustedDownforce,
        cost: effectiveCost,
        costCapImpact: effectiveCostCap,
        designWeeks: devWeeks,
        inDevelopment: true,
        developmentWeeksLeft: devWeeks,
        atrHoursCost: atrCost,
        chiefAdviceFollowed: options?.adviceFollowed,
        chiefId: options?.chiefId,
      }
    ]);

    const bonusMsg =
      isAeroComp && rdFacilityCapacity.aeroEfficiencyBonusPct > 0
        ? ` · Bônus Túnel Lv.${rdFacilityCapacity.windTunnelLevel}: +${rdFacilityCapacity.aeroEfficiencyBonusPct}% ganho aero`
        : '';
    const chiefMsg =
      chiefTrust < 40
        ? ` · Chefe desengajado (+10% prazo P&D)`
        : options?.adviceFollowed === true
        ? ` · Conselho seguido (+5% velocidade P&D)`
        : options?.adviceFollowed === false && options?.chiefName
        ? ` · Conselho de ${options.chiefName} ignorado (-15 Confiança)`
        : '';

    addNotification(
      'PROJETO CAD INICIADO',
      `${newComp.name} entrando no pipeline (${activeDevComponents.length + 1}/${rdFacilityCapacity.manufacturingMaxSlots} slots). Custo: $${(effectiveCost / 1000000).toFixed(1)}M${atrCost > 0 ? ` · ${atrCost}h ATR` : ''}. Tempo final: ${devWeeks} sem.${bonusMsg}${puCeilingNote}${chiefMsg}`,
      options?.adviceFollowed === false ? 'warning' : 'info'
    );
    return true;
  };

  const startPuMaterialResearch = (projectId: string): { success: boolean; message: string } => {
    const project = PU_MATERIAL_RESEARCH_PROJECTS.find((p) => p.id === projectId);
    if (!project) return { success: false, message: 'Projeto de pesquisa não encontrado.' };

    if (unlockedPuMaterials.includes(project.targetMaterialId)) {
      return { success: false, message: 'Este material já está desbloqueado na sua fábrica.' };
    }

    if (activePuMaterialResearch) {
      return { success: false, message: 'Já existe uma pesquisa metalúrgica/química ativa em andamento.' };
    }

    const isCustomerOnly = !playerTeam.isManufacturer && playerTeam.engineOrigin === 'customer';
    if (isCustomerOnly) {
      return {
        success: false,
        message: 'Equipes clientes recebem hardware homologado pelo fornecedor e não podem pesquisar novas ligas de PU.',
      };
    }

    const rdLevel = facilities.find((f) => f.id === 'fac_cfd' || f.id === 'fac_wind_tunnel')?.level || 1;
    if (rdLevel < project.minFacilityLevel) {
      return {
        success: false,
        message: `Requer instalações de P&D Nível ${project.minFacilityLevel} ou superior (atual: Nível ${rdLevel}).`,
      };
    }

    if (financials.bankBalance < project.costUsd) {
      return {
        success: false,
        message: `Saldo insuficiente: requer $${(project.costUsd / 1e6).toFixed(1)}M em caixa.`,
      };
    }

    const scaledWeeks = Math.max(2, Math.round(project.durationWeeks * modificadorTempoPeD));

    setFinancials((prev) => ({
      ...prev,
      bankBalance: prev.bankBalance - project.costUsd,
      costCapSpent: prev.costCapSpent + project.costUsd,
    }));

    setActivePuMaterialResearch({
      projectId: project.id,
      weeksRemaining: scaledWeeks,
      totalWeeks: scaledWeeks,
    });

    addNotification(
      'PESQUISA DE MATERIAL M08 INICIADA',
      `${project.title} em desenvolvimento (${scaledWeeks} sem · $${(project.costUsd / 1e6).toFixed(1)}M).`,
      'info'
    );

    return {
      success: true,
      message: `Pesquisa iniciada (${scaledWeeks} semanas).`,
    };
  };

  // Multi-Physics Engineering Simulation (CFD + FEA + Thermal + Regulatory + 7 Specialists)
  const runEngineeringSimulation = (compType: ComponentSpec['type'], atrHours: number): SimulationReport => {
    const wtFacility = facilities.find(f => f.id === 'fac_wind_tunnel')?.level || 1;
    const cfdFacility = facilities.find(f => f.id === 'fac_cfd')?.level || 1;
    const simFacility = facilities.find(f => f.id === 'fac_simulator')?.level || 2;
    const levelAvg = components.reduce((acc, c) => acc + c.level, 0) / Math.max(1, components.length);
    const leadDriver = drivers.find(d => d.id === playerTeam.drivers?.[0]) || drivers.find(d => d.teamId === playerTeam.id && !d.isAffiliate);

    const report = runMultiPhysicsSimulation({
      componentType: compType,
      params: vehicleParams,
      atrHoursUsed: atrHours,
      windTunnelLevel: wtFacility,
      cfdLevel: cfdFacility,
      simulatorLevel: simFacility,
      dnaCorrelationModifier: modificadorErroCorrelacao,
      staff,
      teamName: playerTeam.name,
      componentLevelAvg: levelAvg,
      ambientTempC: 25,
      leadDriver,
      components,
    });

    setLastSimulationReport(report);

    // Deduct ATR hours
    setFinancials(prev => ({
      ...prev,
      atrWindTunnelHoursAvailable: Math.max(0, prev.atrWindTunnelHoursAvailable - atrHours)
    }));

    addNotification(
      report.approved ? 'SIMULAÇÃO MULTIFÍSICA APROVADA' : 'SIMULAÇÃO MULTIFÍSICA COM ALERTAS',
      `Simulado ${compType.toUpperCase()} (${atrHours}h ATR). Erro Correlação: ±${report.finalCorrelationErrorPct}% | L/D: ${report.physics.cornerMode.aeroEfficiencyLD} | Margem Térmica: ${report.thermal.thermalMarginC}°C | Checklist: ${report.checklistScore}/12.`,
      report.approved ? 'info' : 'warning'
    );

    return report;
  };

  // Run Wind Tunnel Testing & Calculate Correlation Error (Backward-compatible wrapper around runEngineeringSimulation)
  const runWindTunnelTest = (compType: ComponentSpec['type'], atrHours: number) => {
    const report = runEngineeringSimulation(compType, atrHours);
    return {
      expectedDownforce: report.physics.summary.downforcePoints,
      expectedDrag: report.physics.summary.dragCoefficient,
      baseCorrelationError: report.baseCorrelationErrorPct,
      modificadorErroCorrelacao,
      correlationError: report.finalCorrelationErrorPct,
      porpoisingRisk: report.physics.porpoisingRiskPct,
      simulationReport: report
    };
  };

  // =========================================================================
  // SISTEMA DE JANELAS ADUO (Additional Development and Upgrade Opportunities)
  // =========================================================================
  const avaliarADUO = (forcedRound?: number): AduoEvaluationResult => {
    const roundNumber = forcedRound ?? (currentCircuitIndex + 1);

    // 1. Obter Potência (PWR) do motor do jogador
    const puComponent = components.find(c => c.type === 'pu');
    const currentPwr = puComponent ? puComponent.performance : 82;
    setAduoPlayerPwr(currentPwr);

    // 2. Obter Benchmark (maior PWR da IA no grid - Red Bull-Ford como benchmark = 90)
    const benchmarkPwr = 90;
    setAduoBenchmarkPwr(benchmarkPwr);

    // 3. Diferença Percentual: ((benchmark - player) / benchmark) * 100
    const gap = Math.max(0, benchmarkPwr - currentPwr);
    const gapPercent = Number(((gap / benchmarkPwr) * 100).toFixed(1));
    setAduoLastGapPercent(gapPercent);

    let quotasGranted = 0;
    let costCapBonus = 0;
    const windowWeeks = 4; // Janela regulamentar aberta por 4 semanas

    // 2. LÓGICA DE AVALIAÇÃO:
    // Se a diferença for >= 4%: 2 Cotas + $4.65M no Teto de Gastos
    // Se a diferença for >= 2% e < 4%: 1 Cota + $3.0M no Teto de Gastos
    // Se < 2%: 0 Cotas (paridade regulamentar)
    if (gapPercent >= 4.0) {
      quotasGranted = 2;
      costCapBonus = 4650000;
    } else if (gapPercent >= 2.0) {
      quotasGranted = 1;
      costCapBonus = 3000000;
    }

    const evaluationResult: AduoEvaluationResult = {
      round: roundNumber,
      playerPwr: currentPwr,
      benchmarkPwr,
      gapPercent,
      quotasGranted,
      costCapBonus,
      windowWeeks: quotasGranted > 0 ? windowWeeks : 0,
      status: quotasGranted > 0 ? 'active' : 'parity'
    };

    setAduoHistory(prev => [...prev, evaluationResult]);

    if (quotasGranted > 0) {
      setAduoWindowActive(true);
      setAduoHomologationQuotas(prev => prev + quotasGranted);
      setAduoWeeksRemaining(windowWeeks);

      // Adiciona bônus no Teto de Gastos
      setFinancials(prev => ({
        ...prev,
        costCapLimit: prev.costCapLimit + costCapBonus
      }));

      // 3. ABERTURA DA JANELA (Notificação no Inbox):
      addNotification(
        'RESULTADO ADUO: JANELA DE HOMOLOGAÇÃO ABERTA',
        `RESULTADO ADUO: Seu motor está ${gapPercent}% atrás do benchmark. Janela aberta por ${windowWeeks} semanas. Cotas concedidas: ${quotasGranted}. Bônus no Teto de Gastos: +$${(costCapBonus / 1000000).toFixed(2)}M.`,
        'info'
      );
    } else {
      addNotification(
        'RESULTADO ADUO: PARIDADE REGULAMENTAR',
        `RESULTADO ADUO: Seu motor está a apenas ${gapPercent}% do benchmark (< 2%). A FIA constatou paridade competitiva e nenhuma cota extra foi concedida nesta janela.`,
        'info'
      );
    }

    playRadioSound();
    return evaluationResult;
  };

  // 4 & 5. Consumo da Cota & Impacto de Atraso no Chassi
  const aplicarModificacaoADUO = (melhoriaPwr: number = 3, custoTempoSemanas: number = 3): boolean => {
    if (!aduoWindowActive || aduoHomologationQuotas <= 0) {
      addNotification('ADUO BLOQUEADO', 'Nenhuma cota de homologação ADUO disponível no momento.', 'warning');
      return false;
    }

    // 4. CONSUMO DA COTA: Cada modificação consome 1 cota
    setAduoHomologationQuotas(prev => {
      const remaining = prev - 1;
      if (remaining <= 0) {
        setAduoWindowActive(false);
      }
      return remaining;
    });

    // 5. IMPACTO NO JOGO: Adiciona +3 semanas de atraso / congelamento no chassi
    setAduoChassisDelayWeeks(prev => prev + custoTempoSemanas);

    // Atrasa projetos de chassi em andamento
    setComponents(prev =>
      prev.map(c => {
        if (c.type === 'chassis' && c.inDevelopment && c.developmentWeeksLeft) {
          return {
            ...c,
            developmentWeeksLeft: c.developmentWeeksLeft + custoTempoSemanas
          };
        }
        if (c.type === 'pu') {
          const newPerf = Math.min(100, c.performance + melhoriaPwr);
          setAduoPlayerPwr(newPerf);
          const newGap = Math.max(0, 90 - newPerf);
          setAduoLastGapPercent(Number(((newGap / 90) * 100).toFixed(1)));
          return {
            ...c,
            performance: newPerf
          };
        }
        return c;
      })
    );

    addNotification(
      'UPGRADE ADUO HOMOLOGADO PELA FIA',
      `Modificação de motor concluída na Bancada (+${melhoriaPwr} PWR). 1 Cota consumida. ATENÇÃO: O projeto de chassi sofreu +${custoTempoSemanas} semanas de atraso devido ao rearranjo estrutural do monocoque.`,
      'info'
    );

    playRadioSound();
    return true;
  };

  const fecharJanelaADUO = () => {
    setAduoWindowActive(false);
    setAduoHomologationQuotas(0);
    setAduoWeeksRemaining(0);
  };

  // 2. O CONGELAMENTO FORÇADO (O Gatilho FIA)
  const dataHomologacaoFIA = 8; // 8 semanas após o início da carreira (fim da pré-temporada)
  const homologarMotorFIA = () => {
    setMotorHomologado(true);
    setSemanasRestantesPreTemporada(0);
    setSemanasParaTeste(0);
    addNotification(
      'FIA: HOMOLOGAÇÃO DE UNIDADE DE POTÊNCIA RATIFICADA',
      'A FIA selou o projeto. O tempo da pré-temporada acabou. O hardware desta PU está congelado até o fim da temporada. Modificações permitidas apenas via Software ou Janelas ADUO.',
      'warning'
    );
    playRadioSound();
  };

  const homologarFIA = () => homologarMotorFIA();

  // Works Team Clients (Fornecimento de Motores para Clientes)
  const signPuClient = (proposalId: string): boolean => {
    const isWorksTeam = playerTeam?.isManufacturer || playerTeam?.engineOrigin === 'bought_factory' || playerTeam?.engineOrigin === 'phoenix';
    if (!isWorksTeam) {
      addNotification(
        'STATUS DE MONTADORA OBRIGATÓRIO',
        'Apenas equipes de fábrica que possuem divisão própria de motores têm homologação da FIA para fornecer motores a clientes.',
        'warning'
      );
      return false;
    }

    const proposal = PU_CLIENT_PROPOSALS.find(p => p.id === proposalId);
    if (!proposal) return false;

    if (puClients.some(c => c.proposalId === proposalId && c.status === 'active')) {
      addNotification('CONTRATO JÁ ATIVO', `A equipe ${proposal.teamName} já possui um contrato ativo com nossa montadora.`, 'info');
      return false;
    }

    const activeCount = puClients.filter(c => c.status === 'active').length;
    if (activeCount >= maxPuClientsCapacity) {
      addNotification('CAPACIDADE ESGOTADA', 'Capacidade da fábrica esgotada. Expanda as instalações.', 'warning');
      return false;
    }

    const newContract: PuClientContract = {
      id: `pu_client_${proposal.id}_${Date.now()}`,
      proposalId: proposal.id,
      teamId: proposal.teamId,
      teamName: proposal.teamName,
      shortName: proposal.shortName,
      country: proposal.country,
      color: proposal.color,
      annualPayment: proposal.annualPayment,
      durationSeasons: proposal.durationSeasons,
      seasonsRemaining: proposal.durationSeasons,
      signedInYear: seasonYear,
      engineFailureCount: 0,
      consecutiveSlowestRaces: 0,
      status: 'active'
    };

    // Bônus no Caixa (NÃO entra no Teto de Gastos)
    setFinancials(prev => ({
      ...prev,
      bankBalance: prev.bankBalance + proposal.annualPayment
    }));

    setPuClients(prev => [...prev.filter(c => c.proposalId !== proposalId), newContract]);

    addNotification(
      'CONTRATO DE PU HOMOLOGADO PELA FIA',
      `Contrato oficial celebrado com ${proposal.teamName}! +$${(proposal.annualPayment / 1e6).toFixed(1)}M creditados no Caixa (isento do Teto de Gastos). Duração: ${proposal.durationSeasons} temporada(s).`,
      'info'
    );
    playRadioSound();
    return true;
  };

  const terminatePuClient = (contractId: string) => {
    const contract = puClients.find(c => c.id === contractId);
    if (!contract) return;
    setPuClients(prev => prev.map(c => c.id === contractId ? { ...c, status: 'terminated' } : c));
    addNotification(
      'CONTRATO DE FORNECIMENTO ENCERRADO',
      `Parceria de fornecimento com a ${contract.teamName} encerrada. Slot de manufatura liberado na fábrica.`,
      'info'
    );
    playRadioSound();
  };

  // Facility Upgrades
  const upgradeFacility = (facilityId: string): boolean => {
    const fac = facilities.find(f => f.id === facilityId);
    if (!fac || fac.level >= 5 || fac.isUpgrading) return false;

    if (financials.bankBalance < fac.upgradeCost) {
      addNotification('CAPEX BUDGET EXCEEDED', `Not enough funds to upgrade ${fac.name}.`, 'warning');
      return false;
    }

    setFinancials(prev => ({
      ...prev,
      bankBalance: prev.bankBalance - fac.upgradeCost,
      costCapSpent: prev.costCapSpent + (fac.upgradeCost * 0.35) // portion counts to CAPEX cost cap
    }));

    setFacilities(prev =>
      prev.map(f =>
        f.id === facilityId ? { ...f, isUpgrading: true, weeksRemaining: 6 } : f
      )
    );

    addNotification('FACILITY UPGRADE CONTRACT SIGNED', `${fac.name} construction underway (6 weeks).`, 'info');
    return true;
  };

  const maintainFacility = (facilityId: string): boolean => {
    const fac = facilities.find(f => f.id === facilityId);
    if (!fac) return false;
    const maintenanceCost = Math.round(fac.annualUpkeep * 0.25);
    if (financials.bankBalance < maintenanceCost) {
      addNotification('ORÇAMENTO INSUFICIENTE', `Caixa insuficiente para manutenção de ${fac.name}.`, 'warning');
      return false;
    }
    setFinancials(prev => ({
      ...prev,
      bankBalance: prev.bankBalance - maintenanceCost
    }));
    setFacilities(prev =>
      prev.map(f =>
        f.id === facilityId
          ? { ...f, conservacaoPct: 100, manutencaoNecessaria: false }
          : f
      )
    );
    addNotification('MANUTENÇÃO PREVENTIVA CONCLUÍDA', `${fac.name} restaurada para 100% de conservação.`, 'info');
    return true;
  };

  // Driver signing
  const signDriver = (driverId: string, salary: number, years: number): boolean => {
    const targetDriver = drivers.find(d => d.id === driverId);
    if (!targetDriver) return false;

    const driverOverall = Math.round((targetDriver.attributes.pace + targetDriver.attributes.cornering + targetDriver.attributes.consistency) / 3);

    // 5. PROGRESSÃO DA REPUTAÇÃO (Pilotos de Elite 85+ OVR exigem Reputação 70+)
    const currentRep = playerTeam.reputation || 55;
    if (driverOverall >= 85 && currentRep < 70) {
      addNotification(
        'PILOTO DE ELITE INACESSÍVEL',
        `${targetDriver.name} (OVR ${driverOverall}) exige negociar com uma equipe de reputação consolidada no paddock (Mínimo: 70 pts | Atual: ${currentRep} pts). Avance no campeonato de construtores para atraí-lo!`,
        'warning'
      );
      return false;
    }

    // Background modifier: O Herdeiro Entusiasta (Bloqueia contratação de OVR 90+)
    if (principalProfile.background === 'enthusiast_heir' && (driverOverall >= 90 || targetDriver.attributes.pace >= 90)) {
      addNotification(
        'PROPOSTA RECUSADA',
        `${targetDriver.name} (OVR ${driverOverall}) recusa negociar com a escuderia sob comando do Herdeiro Entusiasta. Pilotos de elite (OVR 90+) exigem um comando técnico credenciado no automobilismo.`,
        'warning'
      );
      return false;
    }

    // Background modifier: Ex-Piloto de F1 (-20% na multa rescisória e +15 de moral inicial)
    const discount = (principalProfile.background === 'ex_driver' || principalProfile.background === 'f1_driver') ? 0.20 : 0;
    const finalBuyout = Math.round(targetDriver.buyoutClause * (1 - discount));

    if (financials.bankBalance < finalBuyout) {
      addNotification('BUYOUT CLAUSE BREACH', `Cannot afford buyout penalty of $${(finalBuyout / 1000000).toFixed(1)}M.`, 'warning');
      return false;
    }

    const signingMentality = (principalProfile.background === 'ex_driver' || principalProfile.background === 'f1_driver') ? 98 : 92;

    setFinancials(prev => ({
      ...prev,
      bankBalance: prev.bankBalance - finalBuyout
    }));

    const replacedDriverId = playerTeam.drivers[1];
    const nextPlayerDrivers: [string, string] = [playerTeam.drivers[0], driverId];

    const updatedTeamsPre = allTeams.map(t => {
      if (t.id === playerTeam.id) {
        return { ...t, drivers: nextPlayerDrivers };
      }
      if (t.drivers.includes(driverId)) {
        return {
          ...t,
          drivers: t.drivers.map(id => (id === driverId ? '' : id)) as [string, string]
        };
      }
      return t;
    });

    const updatedDriversPre = drivers.map(d => {
      if (d.id === driverId) {
        return {
          ...d,
          teamId: playerTeam.id,
          isAffiliate: false,
          isFreeAgent: false,
          salary,
          contractYearsRemaining: years,
          mentality: signingMentality
        };
      }
      if (d.id === replacedDriverId) {
        return {
          ...d,
          teamId: 'free_agent',
          isFreeAgent: true
        };
      }
      return d;
    });

    const resolvedRoster = resolveRaceGridDrivers(updatedTeamsPre, updatedDriversPre);
    setAllTeams(resolvedRoster.normalizedTeams);
    setDrivers(resolvedRoster.normalizedDrivers);

    // 2. IMPACTO DA CONTRATAÇÃO (O Efeito Estrela & Piloto Único)
    let fanBonus = 0;
    let mktBonus = 0;
    let merchBonus = 0;

    if ((targetDriver.marketability || 0) > 90) {
      fanBonus += 10000000;
      mktBonus += 5000000;
      merchBonus += 2000000;
    }

    const targetNat = (targetDriver.nationality || '').trim().toLowerCase();
    const otherSameNatDrivers = drivers.filter(d =>
      d.id !== targetDriver.id &&
      (d.nationality || '').trim().toLowerCase() === targetNat &&
      (d.series === 'F1' || d.teamId !== 'free_agents')
    );
    if (otherSameNatDrivers.length === 0) {
      mktBonus += 3000000;
    }

    if (fanBonus > 0 || mktBonus > 0 || merchBonus > 0) {
      setBaseDeFas(prev => prev + fanBonus);
      setReceitaMarketing(prev => prev + mktBonus);
      setReceitaMerchandising(prev => prev + merchBonus);
      addNotification(
        'EFEITO ESTRELA NO DEPARTAMENTO COMERCIAL',
        `A contratação de ${targetDriver.name} causou grande impacto! ` +
        (fanBonus > 0 ? `+${(fanBonus / 1000000).toFixed(0)}M Fãs, ` : '') +
        (mktBonus > 0 ? `+$${(mktBonus / 1000000).toFixed(1)}M/ano Marketing, ` : '') +
        (merchBonus > 0 ? `+$${(merchBonus / 1000000).toFixed(1)}M/ano Merchandising.` : ''),
        'info'
      );
    }

    const bonusMsg = discount > 0 ? ' (Bônus Ex-Piloto F1: -20% na multa rescisória aplicada!)' : '';
    addNotification('DRIVER CONTRACT SEALED', `${targetDriver.name} has officially signed with APEX Grand Prix.${bonusMsg}`, 'info');
    return true;
  };

  // Dispensar piloto titular e promover substituto (ex.: F2/Reserva ou Haas Ocon -> Rafael Câmara)
  const dismissDriverAndPromote = (
    outDriverId: string,
    inDriverId: string,
    newSalary?: number
  ): boolean => {
    const outgoing = drivers.find(d => d.id === outDriverId);
    const incoming = drivers.find(d => d.id === inDriverId);
    if (!outgoing || !incoming) return false;
    if (!playerTeam.drivers.includes(outDriverId)) return false;

    const result = applyTeamDriverReplacement(
      allTeams,
      drivers,
      playerTeam.id,
      outDriverId,
      inDriverId,
      { newSalary: newSalary ?? Math.max(incoming.salary, 950000), newContractYears: 2, newMentality: 92 }
    );
    if (!result.replaced) return false;

    setAllTeams(result.teams);
    setDrivers(result.drivers);
    addNotification(
      'TROCA DE COCKPIT CONFIRMADA',
      `${outgoing.name} foi dispensado do assento titular da ${playerTeam.name}. ${incoming.name} assume imediatamente o carro na F1!`,
      'info'
    );
    return true;
  };

  const resolveHaasCamaraEvent = (promoteCamara: boolean) => {
    if (!pendingHaasCamaraEvent) return;
    setHaasCamaraEventResolved(true);
    setPendingHaasCamaraEvent(null);

    if (!promoteCamara) {
      addNotification(
        'OCON MANTIDO NA HAAS ATÉ O FIM DO ANO',
        'A diretoria optou por manter Esteban Ocon no cockpit para evitar desgaste imediato, adiando a estreia oficial de Rafael Câmara para 2027.',
        'info'
      );
      return;
    }

    const result = applyTeamDriverReplacement(
      allTeams,
      drivers,
      'haas',
      'driver_ocon',
      'f2_camara',
      { newSalary: 950000, newContractYears: 2, newMentality: 95 }
    );
    if (result.replaced) {
      setAllTeams(result.teams);
      setDrivers(result.drivers);
      addNotification(
        'ESTREIA ANTECIPADA: RAFAEL CÂMARA NA HAAS!',
        'Após ruptura definitiva entre Esteban Ocon e Ayao Komatsu, Rafael Câmara (originalmente contratado para 2027) estreia imediatamente no GP de São Paulo!',
        'info'
      );
    }
  };

  // 6. AÇÕES DE MARKETING (Organizar Evento de Marketing)
  const organizarEventoMarketing = (driverId: string): { success: boolean; message: string } => {
    const drv = drivers.find(d => d.id === driverId);
    if (!drv) {
      return { success: false, message: 'Piloto não encontrado.' };
    }
    if (financials.bankBalance < 500000) {
      addNotification(
        'SALDO INSUFICIENTE',
        'A equipe precisa de pelo menos $0.5M em caixa para custos operacionais e logística do evento de marketing.',
        'warning'
      );
      return { success: false, message: 'Saldo insuficiente em caixa (Necessário $0.5M).' };
    }

    const currentFatigue = drv.fatigue || 0;
    if (currentFatigue >= 90) {
      addNotification(
        'PILOTO EM EXAUSTÃO',
        `${drv.name} está em estado crítico de fadiga (${currentFatigue}%) e não pode participar de turnês comerciais sem repouso.`,
        'warning'
      );
      return { success: false, message: `${drv.name} está exausto demais para participar (${currentFatigue}% fadiga).` };
    }

    // Custos: 1 dia de descanso (+20 de fadiga) e $0.5M do caixa
    // Retorno: +$2.0M imediatos no caixa e +5% na base de fãs
    const fanIncrease = Math.round(baseDeFas * 0.05);
    const newFans = baseDeFas + fanIncrease;
    const netCash = 2000000 - 500000; // Lucro líquido de +$1.5M

    setFinancials(prev => ({
      ...prev,
      bankBalance: prev.bankBalance + netCash
    }));

    setDrivers(prev =>
      prev.map(d =>
        d.id === driverId
          ? { ...d, fatigue: Math.min(100, (d.fatigue || 0) + 20) }
          : d
      )
    );

    setBaseDeFas(newFans);

    const fanPoint: BaseDeFasPoint = {
      round: currentCircuitIndex + 1,
      raceName: `Evento Marketing (${drv.shortCode || drv.name.split(' ')[0]})`,
      fans: newFans,
      changePercent: 5.0
    };
    setBaseDeFasHistory(prev => [...prev, fanPoint]);

    addNotification(
      'EVENTO DE MARKETING CONCLUÍDO!',
      `Ativação comercial com ${drv.name} realizada com sucesso! Retorno bruto: +$2.0M (-$0.5M custos). Base de fãs cresceu +5% (+${fanIncrease.toLocaleString()} fãs). ${drv.name} acumulou +20 de fadiga.`,
      'info'
    );

    return {
      success: true,
      message: `Evento concluído! +$1.5M líquidos no caixa, +5% de fãs e +20 fadiga para ${drv.name}.`
    };
  };

  // Promote affiliate to FP1
  const promoteAffiliateToFP1 = (driverId: string) => {
    setSelectedAffiliateInFP1(true);
    setDrivers(prev =>
      prev.map(d =>
        d.id === driverId
          ? {
              ...d,
              attributes: {
                ...d.attributes,
                pace: Math.min(99, d.attributes.pace + 1),
                feedback: Math.min(99, d.attributes.feedback + 2)
              },
              mentality: Math.min(100, d.mentality + 6)
            }
          : d
      )
    );
    addNotification('ACADEMY PROMOTION', 'Affiliate driver allocated to FP1 practice seat. Accelerated XP granted!', 'info');
  };

  // Free Practice Run
  const runPracticeLap = () => {
    if (fpRunsDone >= 3) {
      return { feedback: 'Todos os 3 stints de Treino Livre já foram concluídos.', confidenceGain: 0 };
    }

    const activeDrivers = drivers.filter(d => playerTeam.drivers?.includes(d.id));
    const driverFeedbackAvg =
      activeDrivers.length > 0
        ? activeDrivers.reduce((acc, d) => acc + (d.attributes?.feedback ?? 75), 0) / activeDrivers.length
        : 75;

    const isStrategistFastSetup = Boolean(
      modificadorSetupRapido ||
        principalProfile.background === 'data_strategist' ||
        principalProfile.background === 'data_analyst' ||
        principalProfile.background === 'born_strategist'
    );

    const nextRunNumber = fpRunsDone + 1;
    const evalRes = evaluatePracticeSetup({
      carSetup,
      setupWindow,
      circuit: currentCircuit,
      vehiclePhysics,
      driverFeedbackAvg,
      fpRunsDone: nextRunNumber,
      modificadorSetupRapido: isStrategistFastSetup,
      stabilityIndex01: currentTrackPhysics.stabilityIndex01,
      coolingDemandIndex01: currentTrackPhysics.coolingDemandIndex01,
      airDensityKgM3: currentTrackPhysics.airDensityKgM3,
      modeXFractionPct: currentTrackPhysics.modeXFractionPct,
      leadDriverName: activeDrivers[0]?.name || 'Piloto #1',
    });

    const gain = evalRes.recommendedConfidenceGain;

    setSetupWindow(prev => ({
      ...prev,
      confidence: Math.min(100, prev.confidence + gain)
    }));
    setFpRunsDone(nextRunNumber);

    return { feedback: evalRes.driverRadioQuote || evalRes.pitRadioSummary, confidenceGain: gain };
  };

  // Simular Treinos Livres (TL1 e TL2) em sequência sem estado obsoleto
  const simulateFreePractice1And2 = () => {
    if (fpRunsDone >= 2) {
      return { feedback: 'Treinos Livres TL1 e TL2 já foram concluídos.', confidenceGain: 0 };
    }

    const activeDrivers = drivers.filter(d => playerTeam.drivers?.includes(d.id));
    const driverFeedbackAvg =
      activeDrivers.length > 0
        ? activeDrivers.reduce((acc, d) => acc + (d.attributes?.feedback ?? 75), 0) / activeDrivers.length
        : 75;

    const isStrategistFastSetup = Boolean(
      modificadorSetupRapido ||
        principalProfile.background === 'data_strategist' ||
        principalProfile.background === 'data_analyst' ||
        principalProfile.background === 'born_strategist'
    );

    let totalGain = 0;
    let simConfidence = setupWindow.confidence;
    let lastFeedback = '';

    for (let runNum = fpRunsDone + 1; runNum <= 2; runNum++) {
      const evalRes = evaluatePracticeSetup({
        carSetup,
        setupWindow: { ...setupWindow, confidence: simConfidence },
        circuit: currentCircuit,
        vehiclePhysics,
        driverFeedbackAvg,
        fpRunsDone: runNum,
        modificadorSetupRapido: isStrategistFastSetup,
        stabilityIndex01: currentTrackPhysics.stabilityIndex01,
        coolingDemandIndex01: currentTrackPhysics.coolingDemandIndex01,
        airDensityKgM3: currentTrackPhysics.airDensityKgM3,
        modeXFractionPct: currentTrackPhysics.modeXFractionPct,
        leadDriverName: activeDrivers[0]?.name || 'Piloto #1',
      });
      totalGain += evalRes.recommendedConfidenceGain;
      simConfidence = Math.min(100, simConfidence + evalRes.recommendedConfidenceGain);
      lastFeedback = evalRes.driverRadioQuote || evalRes.pitRadioSummary;
    }

    setSetupWindow(prev => ({
      ...prev,
      confidence: Math.min(100, prev.confidence + totalGain)
    }));
    setFpRunsDone(2);

    return { feedback: lastFeedback, confidenceGain: totalGain };
  };

  // Qualifying Knockout (24 carros / 12 equipes + todos os atributos dos pilotos)
  const runQualifyingShootout = () => {
    const { gridDrivers } = resolveRaceGridDrivers(allTeams, drivers);
    const results = gridDrivers.map(d => {
      const team = allTeams.find(t => t.id === d.teamId);
      const isPlayerCar = d.teamId === playerTeam.id || Boolean(team?.isPlayer);
      const carPace = isPlayerCar
        ? Math.round(team ? (team.carRating * 0.45 + vehiclePhysics.summary.carRating * 0.55) : vehiclePhysics.summary.carRating)
        : (team ? team.carRating : 80);

      const drvProfile = computeDriverRaceProfile(d, {
        weather: trackWeather,
        aeroDemand: currentCircuit.aeroDemand,
        gapToAheadSec: 99,
        tireWearPercent: 0
      });

      let setupBonus = 0;
      let physicsTrackBonus = 0;
      if (isPlayerCar) {
        setupBonus = (setupWindow.confidence / 100) * 0.9;
        const speedWeight = Math.max(0.25, Math.min(0.75, currentTrackPhysics.modeXFractionPct / 100));
        const aeroBlend =
          vehiclePhysics.summary.straightSpeedScore * speedWeight +
          vehiclePhysics.summary.cornerGripScore * (1 - speedWeight);
        const trackDeltaBonus = (currentCircuit.baseLapTimeSec - currentTrackPhysics.totalPredictedLapTimeSec) * 0.12;
        physicsTrackBonus = ((aeroBlend - 78) * 0.025) - ((vehiclePhysics.totalMassKg - 772) * 0.03) + trackDeltaBonus;
      }

      const baseJitter = drvProfile.lapJitterAmplitudeSec * 0.85;
      const jitterAmplitude = isPlayerCar && vehiclePhysics.porpoisingRiskPct > 55 ? baseJitter + 0.25 : baseJitter;
      const randomJitter = Math.random() * jitterAmplitude - jitterAmplitude / 2;
      const lapTime = Math.max(
        currentCircuit.baseLapTimeSec * 0.93,
        currentCircuit.baseLapTimeSec -
          ((carPace - 75) / 30) * 1.9 -
          drvProfile.qualifyingBonusSec -
          setupBonus -
          physicsTrackBonus +
          randomJitter
      );

      return {
        driverId: d.id,
        lapTimeSec: Math.round(lapTime * 1000) / 1000,
        position: 1
      };
    });

    results.sort((a, b) => a.lapTimeSec - b.lapTimeSec);
    results.forEach((r, idx) => {
      r.position = idx + 1;
    });

    setQualifyingResults(results);
    setWeekendSession('qualifying');
    addNotification(
      'QUALIFYING COMPLETE',
      `Pole Position: ${gridDrivers.find(d => d.id === results[0]?.driverId)?.name || 'N/A'} (${results[0]?.lapTimeSec.toFixed(3)}s) · Grid oficial de ${results.length} carros.`,
      'info'
    );
  };

  const togglePitLaneStart = (driverId: string) => {
    setPitLaneStartDriverIds(prev =>
      prev.includes(driverId) ? prev.filter(id => id !== driverId) : [...prev, driverId]
    );
  };

  // Start Live Race Simulation (24 pilotos reais do save + reação de largada + largada dos boxes)
  const startRace = () => {
    const { gridDrivers } = resolveRaceGridDrivers(allTeams, drivers);
    const qualifiedOrder = qualifyingResults.length > 0
      ? qualifyingResults.map(q => gridDrivers.find(d => d.id === q.driverId)!).filter(Boolean)
      : [...gridDrivers].sort((a, b) => b.attributes.pace - a.attributes.pace);

    // Garante todos os 24 pilotos mesmo se houver mudança parcial
    const orderedIds = new Set(qualifiedOrder.map(d => d.id));
    const fullGridDrivers = [
      ...qualifiedOrder,
      ...gridDrivers.filter(d => !orderedIds.has(d.id))
    ];

    const gridStarters = fullGridDrivers.filter(d => !pitLaneStartDriverIds.includes(d.id));
    const pitStarters = fullGridDrivers.filter(d => pitLaneStartDriverIds.includes(d.id));
    const finalOrder = [...gridStarters, ...pitStarters];

    // Clima inicial plausível baseado no circuito
    const rainRoll = Math.random();
    const initialWeather: 'sunny' | 'overcast' | 'light_rain' | 'heavy_rain' =
      rainRoll < 0.08 ? 'heavy_rain' : rainRoll < 0.22 ? 'light_rain' : rainRoll < 0.45 ? 'overcast' : 'sunny';
    setTrackWeather(initialWeather);
    setTrackGripPercent(initialWeather === 'heavy_rain' ? 74 : initialWeather === 'light_rain' ? 84 : 98);

    const initialLiveCars: LiveCarState[] = finalOrder.map((driver, index) => {
      const team = allTeams.find(t => t.id === driver.teamId);
      const isPlayerCar = driver.teamId === playerTeam.id || Boolean(team?.isPlayer);
      const isPitStart = pitLaneStartDriverIds.includes(driver.id);

      let effectiveEFuel = 80;
      if (team?.eFuelRating) {
        effectiveEFuel = team.eFuelRating;
      } else if (team?.engineSupplier === 'Mercedes') {
        effectiveEFuel = 95;
      } else if (team?.engineSupplier === 'Ferrari') {
        effectiveEFuel = 80;
      } else if (team?.engineSupplier === 'Red Bull-Ford' || team?.engineSupplier === 'RedBull-Ford') {
        effectiveEFuel = 87;
      } else if (team?.engineSupplier === 'Honda') {
        effectiveEFuel = 82;
      } else if (team?.engineSupplier === 'Audi') {
        effectiveEFuel = 75;
      }

      const partnerFuelWeightCutKg =
        team?.fuelPartner === 'petronas' ? 15 : team?.fuelPartner === 'aramco' ? 5 : 0;
      const baseFuelKg = effectiveEFuel >= 85 ? 85 : 100;
      const initialFuelKg = Math.max(82, baseFuelKg === 85 ? 85 : baseFuelKg - partnerFuelWeightCutKg);
      const fuelSavingPenalty =
        effectiveEFuel >= 85 || team?.fuelPartner === 'petronas'
          ? 0.0
          : effectiveEFuel >= 70
          ? 0.1
          : 0.3;
      const partnerBurnFactor =
        team?.fuelPartner === 'petronas' ? 0.94 : team?.fuelPartner === 'aramco' ? 0.97 : 1.0;
      const burnRatePerLap = Math.round(((initialFuelKg / currentCircuit.laps) * partnerBurnFactor) * 100) / 100;

      const drvProfile = computeDriverRaceProfile(driver, {
        weather: initialWeather,
        aeroDemand: currentCircuit.aeroDemand,
        gapToAheadSec: 1.0,
        tireWearPercent: 0
      });

      const baseGridOffset = isPitStart
        ? -0.02
        : Math.max(0.001, (gridStarters.length - 1 - index) * 0.0055 + Math.max(-0.004, drvProfile.startLaunchGainLapUnits));

      const defaultCompound: TireCompound =
        initialWeather === 'heavy_rain'
          ? 'wet'
          : initialWeather === 'light_rain'
          ? 'inter'
          : index % 2 === 0
          ? 'soft'
          : 'medium';

      return {
        driverId: driver.id,
        driverName: driver.name,
        shortCode: driver.shortCode,
        driverNumber: driver.number,
        teamId: driver.teamId,
        teamColor: team ? team.color : '#888',
        isPlayer: isPlayerCar,
        position: index + 1,
        lap: 1,
        distanceOnLap: isPitStart ? 0 : baseGridOffset,
        totalDistance: baseGridOffset,
        currentLapTime: 0,
        lastLapTime: currentCircuit.baseLapTimeSec,
        bestLapTime: currentCircuit.baseLapTimeSec + Math.random() * 2,
        gapToLeaderSec: index * 0.45,
        gapToAheadSec: index === 0 ? 0 : 0.45,
        tireCompound: defaultCompound,
        tireAgeLaps: 0,
        tireWearPercent: 0,
        tireGrainingBlistering: 0,
        tireTempC: initialWeather === 'heavy_rain' ? 72 : 98,
        socPercent: 95,
        batteryTempC: 48,
        engineMode: 'balanced',
        aeroMode: 'mode_z',
        paceMode: 'balanced',
        fuelMixMode: 'standard',
        fuelRemainingKg: initialFuelKg,
        fuelInitialKg: initialFuelKg,
        fuelBurnKgPerLap: burnRatePerLap,
        fuelSavingPenaltySec: fuelSavingPenalty,
        eFuelRating: effectiveEFuel,
        inPitLane: isPitStart,
        pitStopsDone: 0,
        pitDurationSec: 0,
        hasDerating: false,
        damagePercent: 0,
        status: 'running',
        penaltySec: 0,
        penaltiesCount: 0,
        startedFromPitLane: isPitStart,
        pitLaneStartTicks: isPitStart ? 8 : 0,
        hasBlueFlag: false,
        isDisqualified: false,
        lastIncidentText: isPitStart ? 'Largada autorizada dos boxes (Pit Lane)' : undefined
      };
    });

    const sortedInit = sortRaceClassification(initialLiveCars, currentCircuit.baseLapTimeSec);
    raceFlagRef.current = { flag: 'green', expiresAtLap: 0 };
    liveCarsRef.current = sortedInit;
    setLiveCars(sortedInit);
    setTrackFlagStatus('green');
    setSafetyCarStatus('none');
    setRaceControlFeed([
      {
        id: `rc_start_${Date.now()}`,
        lap: 1,
        flag: 'green',
        title: 'LARGADA AUTORIZADA (24 CARROS)',
        message: `${currentCircuit.name} iniciado em condição ${initialWeather.toUpperCase()}.${pitStarters.length > 0 ? ` ${pitStarters.map(p => p.shortCode).join(', ')} largam dos boxes.` : ''}`
      }
    ]);
    setCurrentLap(1);
    setIsRaceLive(true);
    setIsRacePaused(false);
    setWeekendSession('race');
    addNotification('LIGHTS OUT AND AWAY WE GO!', `${currentCircuit.name} Grand Prix iniciado com ${sortedInit.length} carros no grid!`, 'info');
  };

  const pauseResumeRace = () => {
    setIsRacePaused(prev => !prev);
  };

  const resumeFromRedFlag = () => {
    raceFlagRef.current = { flag: 'green', expiresAtLap: 0 };
    setTrackFlagStatus('green');
    setSafetyCarStatus('none');
    const repairedCars = liveCarsRef.current.map(c =>
      c.status === 'running' && !c.isDisqualified
        ? {
            ...c,
            inPitLane: false,
            damagePercent: Math.max(0, c.damagePercent - 25),
            lastIncidentText: 'Relargada autorizada após Bandeira Vermelha'
          }
        : c
    );
    liveCarsRef.current = repairedCars;
    setLiveCars(repairedCars);
    setRaceControlFeed(prev => [
      {
        id: `rc_red_resume_${Date.now()}`,
        lap: currentLap,
        flag: 'green',
        title: 'RELARGADA APÓS BANDEIRA VERMELHA',
        message: 'Pista limpa e carros liberados dos boxes em Bandeira Verde.'
      },
      ...prev.slice(0, 29)
    ]);
    setIsRacePaused(false);
  };

  const skipToChequeredFlag = () => {
    if (!isRaceLive) return;
    let simCars = [...liveCarsRef.current];
    let simFlag: RaceFlagState =
      raceFlagRef.current.flag === 'red' ? { flag: 'green', expiresAtLap: 0 } : raceFlagRef.current;
    let guard = 0;
    const collectedEvents: RaceControlEvent[] = [];
    const avgReliability =
      components.reduce((acc, c) => acc + c.reliability, 0) / Math.max(1, components.length);

    while (guard < 5000) {
      guard += 1;
      const res = stepRaceSimulationTick({
        cars: simCars,
        drivers,
        allTeams,
        raceSpeed: 5,
        totalLaps: currentCircuit.laps,
        baseLapTimeSec: currentCircuit.baseLapTimeSec,
        trackWeather,
        aeroDemand: currentCircuit.aeroDemand,
        airDensityKgM3: currentTrackPhysics.airDensityKgM3,
        tireStressIndex01: currentTrackPhysics.tireStressIndex01,
        coolingDemandIndex01: currentTrackPhysics.coolingDemandIndex01,
        netErsBalanceKjPerLap: currentTrackPhysics.netErsBalanceKjPerLap,
        playerCarRating: vehiclePhysics.summary.carRating,
        playerTotalMassKg: vehiclePhysics.totalMassKg,
        playerPorpoisingRiskPct: vehiclePhysics.porpoisingRiskPct,
        playerThermalMarginC: vehiclePhysics.thermalMarginC,
        playerBatteryCellTempC: vehiclePhysics.batteryCellTempC,
        playerFatigueLifeRaces: vehiclePhysics.fatigueLifeRaces,
        playerTireWearRateMultiplier: vehiclePhysics.tireWearRateMultiplier,
        playerAvgReliability: avgReliability,
        flagState: simFlag
      });
      simCars = res.cars;
      simFlag = res.nextFlagState.flag === 'red' ? { flag: 'green', expiresAtLap: 0 } : res.nextFlagState;
      res.events.forEach((ev, idx) => {
        collectedEvents.unshift({ ...ev, id: `rc_fast_${guard}_${idx}_${Date.now()}` });
      });
      if (res.finished) break;
    }

    raceFlagRef.current = { flag: 'green', expiresAtLap: 0 };
    liveCarsRef.current = simCars;
    setLiveCars(simCars);
    setTrackFlagStatus('green');
    setSafetyCarStatus('none');
    setCurrentLap(currentCircuit.laps);
    if (collectedEvents.length > 0) {
      setRaceControlFeed(prev => [...collectedEvents.slice(0, 15), ...prev].slice(0, 30));
    }
    setIsRaceLive(false);
    setIsRacePaused(false);
    setWeekendSession('post_race');
    const winner = simCars[0];
    addNotification(
      'BANDEIRADA FINAL!',
      `${winner?.driverName || 'Vencedor'} venceu o GP de ${currentCircuit.name}!`,
      'info'
    );
  };

  const setRaceSpeedMultiplier = (mult: number) => {
    setRaceSpeed(mult);
  };

  const updateDriverTactics = (driverId: string, tactics: {
    paceMode?: PaceMode;
    engineMode?: EngineMode;
    aeroMode?: AeroMode;
    fuelMixMode?: FuelMixMode;
  }) => {
    setLiveCars(prev =>
      prev.map(c => {
        if (c.driverId !== driverId || c.status === 'retired' || c.isDisqualified) return c;
        return {
          ...c,
          ...(tactics.paceMode ? { paceMode: tactics.paceMode } : {}),
          ...(tactics.engineMode ? { engineMode: tactics.engineMode } : {}),
          ...(tactics.aeroMode ? { aeroMode: tactics.aeroMode } : {}),
          ...(tactics.fuelMixMode ? { fuelMixMode: tactics.fuelMixMode } : {})
        };
      })
    );
  };

  const orderPitStop = (driverId: string, newCompound: TireCompound) => {
    const activeChiefMech =
      staff.find(s => s.role === 'chief_mechanic' && (s.currentTeam === playerTeam.name || s.currentTeam === 'APEX Grand Prix Team')) ||
      staff.find(s => s.role === 'chief_mechanic' && s.id === 'staff_chief_mechanic') ||
      staff.find(s => s.role === 'chief_mechanic');

    const pitOps = evaluatePitAndGarageOperations({
      chiefMechanicRating: activeChiefMech?.rating ?? 76,
      principalBackground: principalProfile.background,
      isSakuraHq: Boolean(playerTeam.location?.includes('Sakura')),
    });

    const basePitTime = Math.max(1.8, currentCircuit.pitLaneLossSec + pitOps.totalPitDeltaSec);
    let servedPenaltySec = 0;
    let errorOccurred = false;
    const errorProb = pitOps.pitErrorProbPct / 100;

    setLiveCars(prev =>
      prev.map(c => {
        if (c.driverId !== driverId || c.status === 'retired' || c.isDisqualified) return c;
        servedPenaltySec = c.penaltySec || 0;
        errorOccurred = Math.random() < errorProb;
        const randomDelay = errorOccurred ? pitOps.pitErrorDelaySec : 0;
        return {
          ...c,
          inPitLane: true,
          tireCompound: newCompound,
          tireAgeLaps: 0,
          tireWearPercent: 0,
          tireGrainingBlistering: 0,
          penaltySec: 0,
          pitStopsDone: c.pitStopsDone + 1,
          pitDurationSec: Math.round((basePitTime + servedPenaltySec + randomDelay) * 10) / 10,
          lastIncidentText: servedPenaltySec > 0
            ? `Penalidade de +${servedPenaltySec}s cumprida no box`
            : errorOccurred
            ? `Atraso de +${pitOps.pitErrorDelaySec}s na pistola pneumática`
            : c.lastIncidentText
        };
      })
    );
    const deltaText =
      pitOps.totalPitDeltaSec < 0
        ? ` (Garagem ${activeChiefMech?.name || 'Box'}: ${pitOps.totalPitDeltaSec.toFixed(2)}s)`
        : pitOps.totalPitDeltaSec > 0
        ? ` (Garagem ${activeChiefMech?.name || 'Box'}: +${pitOps.totalPitDeltaSec.toFixed(2)}s)`
        : '';
    const penMsg = servedPenaltySec > 0 ? ` +${servedPenaltySec}s de punição cumpridos antes da troca.` : '';
    addNotification('PIT STOP CHAMADO', `Box, Box! Pneus ${newCompound.toUpperCase()} novos instalados.${deltaText}${penMsg}`, 'info');
  };

  // Real-time race tick simulation (24 cars, full driver attributes, FIA flags, SC/VSC, penalties, accidents)
  useEffect(() => {
    if (!isRaceLive || isRacePaused) return;

    const avgReliability =
      components.reduce((acc, c) => acc + c.reliability, 0) / Math.max(1, components.length);

    const interval = setInterval(() => {
      // Evolução climática realista durante a corrida
      if (Math.random() < 0.004 * raceSpeed) {
        setTrackWeather(prev => {
          const order: Array<'sunny' | 'overcast' | 'light_rain' | 'heavy_rain'> = ['sunny', 'overcast', 'light_rain', 'heavy_rain'];
          const idx = order.indexOf(prev);
          const nextIdx = Math.max(0, Math.min(order.length - 1, idx + (Math.random() < 0.5 ? 1 : -1)));
          const nextW = order[nextIdx];
          if (nextW !== prev) {
            setTrackGripPercent(nextW === 'heavy_rain' ? 74 : nextW === 'light_rain' ? 84 : nextW === 'overcast' ? 94 : 98);
            setRaceControlFeed(feed => [
              {
                id: `rc_wx_${Date.now()}`,
                lap: currentLap,
                flag: nextW === 'heavy_rain' ? 'yellow' : 'green',
                title: 'ATUALIZAÇÃO METEOROLÓGICA',
                message: `Condição da pista alterada para ${nextW.toUpperCase()}. Atenção à escolha de pneus!`
              },
              ...feed.slice(0, 29)
            ]);
          }
          return nextW;
        });
      }

      const result = stepRaceSimulationTick({
        cars: liveCarsRef.current,
        drivers,
        allTeams,
        raceSpeed,
        totalLaps: currentCircuit.laps,
        baseLapTimeSec: currentCircuit.baseLapTimeSec,
        trackWeather,
        aeroDemand: currentCircuit.aeroDemand,
        airDensityKgM3: currentTrackPhysics.airDensityKgM3,
        tireStressIndex01: currentTrackPhysics.tireStressIndex01,
        coolingDemandIndex01: currentTrackPhysics.coolingDemandIndex01,
        netErsBalanceKjPerLap: currentTrackPhysics.netErsBalanceKjPerLap,
        playerCarRating: vehiclePhysics.summary.carRating,
        playerTotalMassKg: vehiclePhysics.totalMassKg,
        playerPorpoisingRiskPct: vehiclePhysics.porpoisingRiskPct,
        playerThermalMarginC: vehiclePhysics.thermalMarginC,
        playerBatteryCellTempC: vehiclePhysics.batteryCellTempC,
        playerFatigueLifeRaces: vehiclePhysics.fatigueLifeRaces,
        playerTireWearRateMultiplier: vehiclePhysics.tireWearRateMultiplier,
        playerAvgReliability: avgReliability,
        flagState: raceFlagRef.current
      });

      liveCarsRef.current = result.cars;
      raceFlagRef.current = result.nextFlagState;
      setLiveCars(result.cars);
      setTrackFlagStatus(result.nextFlagState.flag);
      setSafetyCarStatus(result.nextSafetyCarStatus);
      setCurrentLap(result.leaderLap);

      if (result.events.length > 0) {
        const stamped = result.events.map((ev, idx) => ({
          ...ev,
          id: `rc_${Date.now()}_${idx}`
        }));
        setRaceControlFeed(prev => [...stamped.reverse(), ...prev].slice(0, 30));
        result.events.forEach(ev => {
          if (ev.flag === 'red' || ev.flag === 'sc' || ev.flag === 'black' || ev.flag === 'penalty') {
            addNotification(ev.title, ev.message, ev.flag === 'black' || ev.flag === 'red' ? 'penalty' : 'warning');
          }
        });
      }

      if (result.triggeredRedFlag) {
        setIsRacePaused(true);
      }

      if (result.finished) {
        const winner = result.cars[0];
        setIsRaceLive(false);
        setWeekendSession('post_race');
        addNotification(
          'CHEQUERED FLAG!',
          `${winner?.driverName || 'Vencedor'} venceu o ${currentCircuit.name} Grand Prix!`,
          'info'
        );
      }
    }, 400);

    return () => clearInterval(interval);
  }, [
    isRaceLive,
    isRacePaused,
    raceSpeed,
    currentCircuit,
    vehiclePhysics,
    currentTrackPhysics,
    drivers,
    allTeams,
    components,
    trackWeather,
    currentLap
  ]);

  // Helper: Identifica se o GP atual é uma "Corrida em Casa" para a nacionalidade do piloto
  const isHomeRaceForDriver = (circuitCountry?: string, driverNationality?: string): boolean => {
    if (!circuitCountry || !driverNationality) return false;
    const c = circuitCountry.toLowerCase().trim();
    const d = driverNationality.toLowerCase().trim();
    if (c === d) return true;
    if ((c.includes('brazil') || c.includes('brasil')) && (d.includes('brazil') || d.includes('brasil'))) return true;
    if ((c.includes('united kingdom') || c.includes('great britain') || c.includes('uk')) && (d.includes('reino unido') || d.includes('british') || d.includes('brit') || d.includes('united kingdom'))) return true;
    if ((c.includes('italy') || c.includes('italia') || c.includes('itália')) && (d.includes('italy') || d.includes('italia') || d.includes('itália') || d.includes('italian'))) return true;
    if ((c.includes('germany') || c.includes('alemanha')) && (d.includes('germany') || d.includes('alemanha') || d.includes('german'))) return true;
    if ((c.includes('spain') || c.includes('espanha')) && (d.includes('spain') || d.includes('espanha') || d.includes('spanish'))) return true;
    if ((c.includes('netherlands') || c.includes('holanda')) && (d.includes('netherlands') || d.includes('holanda') || d.includes('dutch'))) return true;
    if ((c.includes('japan') || c.includes('japão')) && (d.includes('japan') || d.includes('japão') || d.includes('japanese'))) return true;
    if ((c.includes('australia') || c.includes('austrália')) && (d.includes('australia') || d.includes('austrália') || d.includes('australian'))) return true;
    if ((c.includes('monaco') || c.includes('mônaco')) && (d.includes('monaco') || d.includes('mônaco') || d.includes('monegasque'))) return true;
    if ((c.includes('france') || c.includes('frança')) && (d.includes('france') || d.includes('frança') || d.includes('french'))) return true;
    if ((c.includes('united states') || c.includes('usa') || c.includes('estados unidos')) && (d.includes('united states') || d.includes('usa') || d.includes('american') || d.includes('estados unidos'))) return true;
    if ((c.includes('mexico') || c.includes('méxico')) && (d.includes('mexico') || d.includes('méxico') || d.includes('mexican'))) return true;
    if ((c.includes('canada') || c.includes('canadá')) && (d.includes('canada') || d.includes('canadá') || d.includes('canadian'))) return true;
    return false;
  };

  // Finish Race Weekend and calculate points & payouts (DNF e DSQ não pontuam)
  const finishRaceWeekend = () => {
    const pointsTable = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
    
    // Distribute points to teams (exclusively for classified running cars)
    setAllTeams(prevTeams =>
      prevTeams.map(t => {
        const teamCars = liveCars.filter(c => c.teamId === t.id && c.status !== 'retired' && !c.isDisqualified);
        let pts = 0;
        teamCars.forEach(c => {
          if (c.position <= 10) {
            pts += pointsTable[c.position - 1] || 0;
          }
        });
        return { ...t, points: t.points + pts };
      })
    );

    // Operational cost per GP: $850k freight & logistics
    const playerFinishes = liveCars
      .filter(c => c.isPlayer && c.status !== 'retired' && !c.isDisqualified)
      .map(c => c.position);
    const bestPlayerFinish = playerFinishes.length > 0 ? Math.min(...playerFinishes) : 24;

    let sponsorBonusTotal = 0;
    sponsors.forEach(s => {
      if (bestPlayerFinish <= s.targetPosition) {
        sponsorBonusTotal += s.raceBonus;
      }
    });

    const netGpCash = sponsorBonusTotal - 850000;

    setFinancials(prev => ({
      ...prev,
      bankBalance: prev.bankBalance + netGpCash,
      costCapSpent: prev.costCapSpent + 850000
    }));

    const activeChassisName = playerTeam.carModelName || 'APX-01';

    addNotification(
      'RACE WEEKEND DEBRIEF',
      `Best finish: P${bestPlayerFinish}. Net balance change: ${netGpCash >= 0 ? '+' : ''}$${(netGpCash / 1000).toFixed(0)}k.`,
      bestPlayerFinish <= 10 ? 'info' : 'warning'
    );

    // 3. NARRATIVA DE MÍDIA DO CHASSI & BASE DE FÃS (Por Corrida)
    const playerCars = liveCars.filter(c => c.isPlayer);
    const hasBroken = playerCars.some(c => c.status === 'retired');
    const mechDnfsThisRace = playerCars.filter(
      c => c.status === 'retired' && (!c.retireReason || /motor|ers|câmbio|freio|hidráulic|térmic|superaquec|mechanical|power|gearbox/i.test(c.retireReason))
    ).length;
    const finishedLast = playerCars.some(c => c.position >= 20);

    if (bestPlayerFinish === 1) {
      addNotification(
        `IMPRENSA MUNDIAL: VITÓRIA DO ${activeChassisName}`,
        `A primeira vitória histórica do ${activeChassisName}! A engenharia da ${playerTeam.name} conquistou o topo do pódio no ${currentCircuit.name}.`,
        'info'
      );
    }

    if (mechDnfsThisRace > 0) {
      const prevMechDnfs = playerTeam.mechanicalDnfCount || 0;
      const totalMechDnfs = prevMechDnfs + mechDnfsThisRace;
      setAllTeams(prev =>
        prev.map(t =>
          t.isPlayer
            ? {
                ...t,
                mechanicalDnfCount: totalMechDnfs,
                reputation: totalMechDnfs >= 2 ? Math.max(10, (t.reputation || 60) - 2) : t.reputation
              }
            : t
        )
      );
      if (totalMechDnfs >= 2) {
        addNotification(
          `CRISE NA IMPRENSA: "O CAIXÃO ${activeChassisName}"`,
          `Após ${totalMechDnfs} abandonos por falha mecânica na temporada, os jornais europeus apelidaram o monoposto de "O caixão ${activeChassisName}". A confiabilidade virou prioridade máxima na fábrica.`,
          'penalty'
        );
      }
    }

    let fanGrowthPct = 0;
    if (bestPlayerFinish === 1) {
      fanGrowthPct = 0.05; // Vitória: +5%
    } else if (bestPlayerFinish <= 3) {
      fanGrowthPct = 0.03; // Pódio: +3%
    } else if (bestPlayerFinish <= 5) {
      fanGrowthPct = 0.01; // Top 5: +1%
    } else if (hasBroken || finishedLast) {
      fanGrowthPct = -0.005; // Quebra de motor/carro ou último lugar: -0.5% (fãs frustrados)
    }

    const currentFans = baseDeFas || 5000000;
    const fanDelta = Math.round(currentFans * fanGrowthPct);
    const newFans = Math.max(100000, currentFans + fanDelta);
    setBaseDeFas(newFans);

    const fanPoint: BaseDeFasPoint = {
      round: currentCircuitIndex + 1,
      raceName: currentCircuit.city || currentCircuit.name,
      fans: newFans,
      changePercent: Number((fanGrowthPct * 100).toFixed(1))
    };
    setBaseDeFasHistory(prev => [...prev, fanPoint]);

    // 5. BÔNUS DE CORRIDA EM CASA (3x Merchandising no fim de semana)
    const activePlayerDrivers = drivers.filter(d => playerTeam.drivers?.includes(d.id));
    const homeDriver = activePlayerDrivers.find(d => isHomeRaceForDriver(currentCircuit.country, d.nationality));

    if (homeDriver) {
      const baseWeekendMerch = Math.round((receitaMerchandising || 500000) / 24);
      const bonusWeekendMerch = baseWeekendMerch * 2; // O total é 3x (base + 2x bônus adicional)
      setFinancials(prev => ({
        ...prev,
        bankBalance: prev.bankBalance + bonusWeekendMerch
      }));
      addNotification(
        'BÔNUS DE CORRIDA EM CASA: 3X MERCHANDISING!',
        `GP no país de ${homeDriver.name} (${currentCircuit.country})! A torcida local esgotou estoques de produtos oficiais da equipe, gerando bônus de 3x em merchandising (+$${(bonusWeekendMerch / 1000).toFixed(0)}k creditados no caixa).`,
        'info'
      );
    }

    // 9. A MORAL DA FÁBRICA (O Efeito Dominó):
    // Se o jogador tiver 3 corridas consecutivas sem pontos (> P10), moral da fábrica cai para < 40%.
    // Consequência: P&D demora +20% e maior taxa de erros dos pilotos.
    let newConsecutiveNoPoints = consecutiveNoPointsRaces;
    if (bestPlayerFinish > 10) {
      newConsecutiveNoPoints += 1;
    } else {
      newConsecutiveNoPoints = 0;
      if (modificadorMoralFabrica < 0) {
        setModificadorMoralFabrica(0);
        setStaff(prev => prev.map(s => ({ ...s, morale: 75 })));
      }
    }
    setConsecutiveNoPointsRaces(newConsecutiveNoPoints);

    if (newConsecutiveNoPoints >= 3) {
      setModificadorMoralFabrica(-25);
      setModificadorTempoPeD(prev => Math.max(prev, 1.20));
      setStaff(prev => prev.map(s => ({ ...s, morale: 35 })));
      addNotification(
        'CRISE NA FÁBRICA: MORAL ABAIXO DE 40%',
        '3 corridas consecutivas sem pontuar! A moral do corpo técnico desabou para 35%. Projetos de P&D levarão +20% de tempo e os pilotos correm sob pressão psicológica extrema com maior risco de rodadas.',
        'penalty'
      );
    }

    // 10. HISTÓRICO DE PERFORMANCE: Record snapshot
    const ferrariTeam = allTeams.find(t => t.id === 'ferrari');
    const rbTeam = allTeams.find(t => t.id === 'redbull');
    const mercTeam = allTeams.find(t => t.id === 'mercedes');

    const avgDf = components.reduce((acc, c) => acc + c.downforce, 0) / (components.length || 1);
    const avgRel = components.reduce((acc, c) => acc + c.reliability, 0) / (components.length || 1);
    const calculatedPlayerRating = Math.round(50 + avgDf * 0.35 + avgRel * 0.15);

    const historyPoint: PerformanceHistoryPoint = {
      round: currentCircuitIndex + 1,
      season: seasonYear,
      circuitName: currentCircuit.city,
      playerRating: calculatedPlayerRating,
      rivalRatings: {
        ferrari: ferrariTeam?.carRating || 92,
        redbull: rbTeam?.carRating || 90,
        mercedes: mercTeam?.carRating || 88
      }
    };
    setPerformanceHistory(prev => [...prev, historyPoint]);

    // 1. DEFINIÇÃO DAS JANELAS ADUO (Calendário):
    // Gatilhos de avaliação na temporada: após o GP 5, GP 11 e GP 18
    const currentRound = currentCircuitIndex + 1;
    if (currentRound === 5 || currentRound === 11 || currentRound === 18) {
      avaliarADUO(currentRound);
    }

    // 11. EVENTOS DE CLIENTES DE PU (A Crise & Rompimento)
    const activePuClients = puClients.filter(c => c.status === 'active');
    if (activePuClients.length > 0) {
      const puComp = components.find(c => c.type === 'pu');
      const puReliability = puComp?.reliability ?? 85;
      const puPower = puComp?.performance ?? 80;

      activePuClients.forEach(client => {
        // Quebra no cliente
        // Quanto menor a confiabilidade do motor, maior a chance de falha no cliente
        const failureChance = Math.max(0.03, (100 - puReliability) * 0.005);
        if (Math.random() < failureChance) {
          setAllTeams(prev => prev.map(t => t.isPlayer ? {
            ...t,
            reputation: Math.max(10, (t.reputation || 55) - 2)
          } : t));
          setStaff(prev => prev.map(s => ({
            ...s,
            morale: Math.max(10, (s.morale ?? 75) - 5)
          })));
          setPuClients(prev => prev.map(c => c.id === client.id ? { ...c, engineFailureCount: c.engineFailureCount + 1 } : c));
          addNotification(
            'CRISE DE FORNECIMENTO: MOTOR QUEBROU NO CLIENTE',
            `O motor fornecido para a ${client.teamName} fundiu durante o GP! A imprensa especializada atacou duramente nossa montadora. Efeito: Moral -5 | Reputação -2.`,
            'penalty'
          );
        }

        // Medição de velocidade: se o motor do jogador for o mais fraco do grid (< 76)
        if (puPower < 76) {
          const newSlowCount = client.consecutiveSlowestRaces + 1;
          if (newSlowCount >= 3) {
            // Rompimento unilateral!
            setPuClients(prev => prev.map(c => c.id === client.id ? { ...c, status: 'terminated', consecutiveSlowestRaces: newSlowCount } : c));
            addNotification(
              'RUPTURA UNILATERAL DE CONTRATO (FIA)',
              `A equipe ${client.teamName} rescindiu o contrato com justa causa após 3 corridas seguidas com o motor mais lento do grid. Fornecimento cancelado e slot liberado.`,
              'penalty'
            );
          } else {
            setPuClients(prev => prev.map(c => c.id === client.id ? { ...c, consecutiveSlowestRaces: newSlowCount } : c));
            addNotification(
              'ADVERTÊNCIA DO CLIENTE DE PU',
              `A ${client.teamName} notificou a FIA: nosso motor foi o mais lento em pista (${newSlowCount}/3 corridas consecutivas). Se atingir 3 corridas seguidas, o contrato será rescindido!`,
              'warning'
            );
          }
        } else {
          if (client.consecutiveSlowestRaces > 0) {
            setPuClients(prev => prev.map(c => c.id === client.id ? { ...c, consecutiveSlowestRaces: 0 } : c));
          }
        }
      });
    }

    // Check Season Rollover (Temporada completa de 24 GPs)
    const TOTAL_ROUNDS = seasonCircuits.length;
    const isSeasonEnd = currentCircuitIndex + 1 >= TOTAL_ROUNDS;
    if (isSeasonEnd) {
      // Se o jogador fechar o ano sem usar a cota ADUO, ela é perdida (não acumula para o ano seguinte).
      setAduoWindowActive(false);
      setAduoHomologationQuotas(0);
      setAduoWeeksRemaining(0);
      setAduoChassisDelayWeeks(0);

      const nextSeasonYear = seasonYear + 1;
      setSeasonYear(nextSeasonYear);

      // Determine final position in Constructors
      const sortedByPoints = [...allTeams].sort((a, b) => b.points - a.points);
      const finalPosition = sortedByPoints.findIndex(t => t.isPlayer) + 1;
      const prevSeasonPos = seasonFinishHistory[seasonFinishHistory.length - 1]?.position || 10;
      setSeasonFinishHistory(prev => [...prev, { season: seasonYear, position: finalPosition }]);

      // 8. ATR COMPENSATÓRIO (A Esperança / Escala ATR FIA):
      // 1º ganha 70% (700h / 280 MAUh), último ganha 115% (1.150h / 460 MAUh)
      const totalTeamsCount = allTeams.length || 11;
      const atrScale = 0.70 + ((finalPosition - 1) / (totalTeamsCount - 1)) * 0.45;
      const newWtHours = Math.round(1000 * atrScale);
      const newCfdMau = Math.round(400 * atrScale);

      // 2. A JANELA DE PESQUISA (O Segredo do Ano 2):
      // Se < 40%, o carro do Ano 2 nasce com -5 de correlação e peças no nível 1.
      if (atrNextYearAllocationRatio < 0.40) {
        setModificadorErroCorrelacao(prev => prev + 0.05); // -5 correlação penalidade
        setComponents(prev => prev.map(c => ({ ...c, level: 1 })));
        addNotification(
          'FALHA NA JANELA DE PESQUISA (ANO SEGUINTE)',
          'Alocação inferior a 40% de ATR no ano anterior! O novo carro nasceu com penalidade de correlação (-5) e todas as peças recomeçaram no Nível 1 devido à falta de pesquisa aero antecipada.',
          'penalty'
        );
      }

      // 3 & 4. BÔNUS DE SOBREVIVÊNCIA (Ano 2 da Fênix):
      const isPhoenix = usedPhoenixYear1 || playerTeam.engineOrigin === 'phoenix';
      let nextCostCap = 135000000;
      if (isPhoenix && seasonYear === 2026) {
        nextCostCap = 140000000; // Teto sobe para $140M
        setPhoenixDiscountH1(true); // 50% PU upgrade cost in H1
        // Confiabilidade do Motor +15
        setComponents(prev => prev.map(c => c.type === 'pu' ? { ...c, reliability: Math.min(100, c.reliability + 15) } : c));
        // Patrocínios aumentam +20%
        setSponsors(prev => prev.map(s => ({
          ...s,
          annualPayout: Math.round(s.annualPayout * 1.20),
          raceBonus: Math.round(s.raceBonus * 1.20)
        })));
        addNotification(
          'BÔNUS DE SOBREVIVÊNCIA: ANO 2 DA FÊNIX',
          'O motor Fênix amadureceu durante o inverno. A integração perfeita agora está dando frutos. Confiabilidade +15, upgrades de PU com 50% de desconto no 1º semestre e Teto de Gastos expandido para $140M!',
          'info'
        );
      }

      // 5. PROGRESSÃO DA REPUTAÇÃO:
      // Se terminar Ano 1 em 10º e Ano 2 em 5º (ou avançar no campeonato):
      const jumpedPositions = prevSeasonPos - finalPosition;
      if (finalPosition <= 5 || jumpedPositions >= 3) {
        setAllTeams(prev => prev.map(t => t.isPlayer ? { ...t, reputation: Math.max(t.reputation || 55, 75) } : t));
        addNotification(
          'REPUTAÇÃO NO PADDOCK ELEVADA (75+ PTS)',
          `Salto histórico no campeonato de construtores (P${finalPosition})! Sua reputação subiu para 75+. Pilotos de elite (85+ OVR) agora aceitam assinar com sua equipe para a temporada ${nextSeasonYear}!`,
          'info'
        );
      }

      // 12. CLIENTES DE PU: RECEITA ANUAL E O ESPIÃO
      let totalClientPayout = 0;
      const activeClientIds: string[] = [];
      setPuClients(prev =>
        prev.map(c => {
          if (c.status === 'active') {
            activeClientIds.push(c.teamId);
            if (c.seasonsRemaining > 1) {
              totalClientPayout += c.annualPayment;
              return { ...c, seasonsRemaining: c.seasonsRemaining - 1 };
            } else {
              return { ...c, status: 'terminated', seasonsRemaining: 0 };
            }
          }
          return c;
        })
      );

      if (totalClientPayout > 0) {
        addNotification(
          'PAGAMENTO ANUAL DE CLIENTES DE PU',
          `Recebimento de +$${(totalClientPayout / 1e6).toFixed(1)}M de contratos de fornecimento de motores para a temporada ${nextSeasonYear}.`,
          'info'
        );
      }

      if (activeClientIds.length > 0) {
        addNotification(
          'ESPIONAGEM INDUSTRIAL (CLIENTES DE PU)',
          'Cuidado: As equipes clientes aprenderam com nossa arquitetura de motor e telemetria na temporada passada e evoluirão 10% mais rápido este ano!',
          'warning'
        );
      }

      // Update Financials with prize money & reset cost cap
      setFinancials(prev => ({
        ...prev,
        costCapLimit: nextCostCap,
        costCapSpent: 0,
        bankBalance: prev.bankBalance + (finalPosition <= 3 ? 35000000 : finalPosition <= 6 ? 25000000 : 15000000) + totalClientPayout,
        atrWindTunnelHoursAvailable: newWtHours,
        atrCfdMegaAllocations: newCfdMau,
        atrPeriodWeeksLeft: 8
      }));

      // Top AI teams nearing physical limit locks (Diminishing returns) & Rollover do Nome do Chassi do Jogador:
      const nextPlayerChassis = suggestNextSeasonChassisName(playerTeam.carModelName || 'APX-01');
      setAllTeams(prev => prev.map(t => {
        let newRating = t.carRating;
        if (!t.isPlayer) {
          const isClient = activeClientIds.includes(t.id);
          const spyBonus = isClient ? 1 : 0; // O Espião: 10% mais rápida na evolução
          if (t.carRating >= 92) {
            newRating = Math.min(95, t.carRating + 1 + spyBonus);
          } else {
            newRating = Math.min(94, t.carRating + (t.dnaFocusNextYearRatio >= 0.6 ? 3 : 2) + spyBonus);
          }
          return {
            ...t,
            points: 0,
            carRating: newRating
          };
        }
        return {
          ...t,
          points: 0,
          carRating: newRating,
          carModelName: nextPlayerChassis,
          mechanicalDnfCount: 0
        };
      }));

      // 9. GERADOR DE NOVOS PILOTOS (Youth Intake de F3 na virada do Ano):
      const youthDrivers = generateNewDrivers(drivers.length);
      setDrivers(prev => [...prev, ...youthDrivers]);
      addNotification(
        'YOUTH INTAKE: NOVOS TALENTOS DA F3',
        'Novos talentos da F3 foram revelados. Envie seus olheiros para analisar.',
        'info'
      );

      addNotification(
        `FIM DA TEMPORADA ${seasonYear} · PROJETO ${nextPlayerChassis}`,
        `Campeonato de Construtores concluído em P${finalPosition}! Escala ATR FIA para ${nextSeasonYear}: ${(atrScale * 100).toFixed(0)}% (${newWtHours}h Túnel / ${newCfdMau} MAUh CFD). Novo chassi homologado: ${nextPlayerChassis}!`,
        'info'
      );

      setPendingMidSeasonDilemma(null);
      setCurrentCircuitIndex(0);
      setCurrentWeek(1);
    } else {
      const nextIdx = currentCircuitIndex + 1;
      const nextCircuit = seasonCircuits[nextIdx % seasonCircuits.length];
      if (nextIdx === 11 && !pendingMidSeasonDilemma) {
        const curChassis = playerTeam.carModelName || 'APX-01';
        const nxtChassis = suggestNextSeasonChassisName(curChassis);
        setPendingMidSeasonDilemma({
          round: nextIdx + 1,
          currentChassisName: curChassis,
          nextChassisName: nxtChassis,
          title: `DILEMA DE MEIO DE TEMPORADA · ${curChassis} vs ${nxtChassis}`,
          description: `Chefe, chegamos à metade do campeonato de ${seasonYear}. Vamos continuar investindo recursos de Túnel de Vento/CFD no ${curChassis} ou redirecionar esforços para o projeto ${nxtChassis} de ${seasonYear + 1}?`
        });
      }
      if (nextCircuit?.id === 'interlagos' && !haasCamaraEventResolved) {
        const haasTeam = allTeams.find(t => t.id === 'haas');
        const camara = drivers.find(d => d.id === 'f2_camara');
        const camaraAlreadyInF1 = allTeams.some(t => t.drivers.includes('f2_camara'));
        if (haasTeam && haasTeam.drivers.includes('driver_ocon') && camara && !camaraAlreadyInF1) {
          if (haasTeam.isPlayer) {
            setPendingHaasCamaraEvent({
              round: nextIdx + 1,
              gpName: nextCircuit.name || 'Grande Prêmio de São Paulo (Interlagos)'
            });
          } else {
            const swapped = applyTeamDriverReplacement(
              allTeams,
              drivers,
              'haas',
              'driver_ocon',
              'f2_camara',
              { newSalary: 950000, newContractYears: 2, newMentality: 95 }
            );
            if (swapped.replaced) {
              setAllTeams(swapped.teams);
              setDrivers(swapped.drivers);
              setHaasCamaraEventResolved(true);
              addNotification(
                'MERCADO F1 · ESTREIA ANTECIPADA NA HAAS',
                `Ruptura nos boxes antes do ${nextCircuit.name}! Após atrito interno com Ayao Komatsu, a Haas demitiu Esteban Ocon e antecipou a estreia do brasileiro Rafael Câmara para correr já em Interlagos.`,
                'warning'
              );
            }
          }
        }
      }
      setCurrentCircuitIndex(prev => prev + 1);
    }

    setWeekendSession('setup_fp');
    setFpRunsDone(0);
    setQualifyingResults([]);
    setPitLaneStartDriverIds([]);
    setTrackFlagStatus('green');
    setSafetyCarStatus('none');
    setRaceControlFeed([]);
    raceFlagRef.current = { flag: 'green', expiresAtLap: 0 };
    setIsRaceLive(false);
    setActiveTab('overview');
  };

  // Advance Calendar Week
  const advanceWeek = () => {
    setCurrentWeek(prev => prev + 1);

    // FIA Homologação Automática após dataHomologacaoFIA (8 semanas)
    if ((currentWeek + 1) >= dataHomologacaoFIA && !motorHomologadoFIA) {
      homologarFIA();
    }

    // ADUO: Decrementa tempo de atraso/congelamento no chassi
    if (aduoChassisDelayWeeks > 0) {
      setAduoChassisDelayWeeks(prev => Math.max(0, prev - 1));
    }

    // ADUO: Decrementa tempo de janela ativa
    if (aduoWindowActive) {
      setAduoWeeksRemaining(prev => {
        const next = prev - 1;
        if (next <= 0) {
          setAduoWindowActive(false);
          setAduoHomologationQuotas(0);
          addNotification(
            'JANELA ADUO ENCERRADA PELA FIA',
            'O prazo regulamentar da janela ADUO expirou. Cotas não utilizadas foram revogadas e a Bancada de Montagem de motor foi recongelada.',
            'warning'
          );
          return 0;
        }
        return next;
      });
    }

    // M08 Material R&D tree progression
    if (activePuMaterialResearch) {
      const nextLeft = activePuMaterialResearch.weeksRemaining - 1;
      const proj = PU_MATERIAL_RESEARCH_PROJECTS.find((p) => p.id === activePuMaterialResearch.projectId);
      if (nextLeft <= 0) {
        if (proj) {
          setUnlockedPuMaterials((prev) =>
            prev.includes(proj.targetMaterialId) ? prev : [...prev, proj.targetMaterialId]
          );
          addNotification(
            'PESQUISA DE MATERIAL CONCLUÍDA',
            `${proj.title} finalizada! ${proj.engineeringEffect}`,
            'info'
          );
        }
        setActivePuMaterialResearch(null);
      } else {
        setActivePuMaterialResearch((prev) => (prev ? { ...prev, weeksRemaining: nextLeft } : null));
      }
    }

    // Advance Component developments
    setComponents(prev =>
      prev.map(c => {
        if (!c.inDevelopment || !c.developmentWeeksLeft) return c;
        // Congelamento de chassi durante atraso ADUO (+3 semanas)
        if (aduoChassisDelayWeeks > 0 && c.type === 'chassis') {
          return c; // desenvolvimento congelado
        }
        const left = c.developmentWeeksLeft - 1;
        if (left <= 0) {
          // 6. UPGRADES NEGATIVOS (O Fracasso do Túnel de Vento):
          // No P&D, se erroCorrelacao for alto (> 20%), 30% de chance de "Upgrade Reverso": -2 DFm, +3 Drag.
          const wtFacility = facilities.find(f => f.id === 'fac_wind_tunnel')?.level || 1;
          const cfdFacility = facilities.find(f => f.id === 'fac_cfd')?.level || 1;
          const baseError = Math.max(3, 22 - (wtFacility * 2.8 + cfdFacility * 2.2));
          const effectiveCorrelationError = baseError + (baseError * modificadorErroCorrelacao);

          const isHighError = effectiveCorrelationError > 20 || modificadorErroCorrelacao > 0.10;
          const isReverseUpgrade = isHighError && Math.random() < 0.30;

          if (isReverseUpgrade) {
            addNotification(
              'FALHA DE CORRELAÇÃO: UPGRADE REVERSO',
              `Falha de correlação: A nova peça ${c.name} gerou mais arrasto do que o previsto (-2 Downforce, +3 Arrasto). A equipe vai precisar voltar à peça antiga (perdendo tempo e dinheiro).`,
              'penalty'
            );
            return {
              ...c,
              inDevelopment: false,
              developmentWeeksLeft: 0,
              downforce: Math.max(0, c.downforce - 2),
              dragCoefficient: Math.round((c.dragCoefficient + 0.003) * 1000) / 1000
            };
          } else {
            addNotification('COMPONENT MANUFACTURED', `${c.name} has finished production and is installed on the car! (Nível ${Math.min(c.maxLevel || 10, c.level + 1)})`, 'info');
            return {
              ...c,
              inDevelopment: false,
              developmentWeeksLeft: 0,
              level: Math.min(c.maxLevel || 10, c.level + 1)
            };
          }
        }
        return { ...c, developmentWeeksLeft: left };
      })
    );

    // Advance Facilities (upgrade completion + weekly conservation decay)
    setFacilities(prev =>
      prev.map(f => {
        const nextConservation = Math.max(35, Math.round(((f.conservacaoPct ?? 98) - 0.45) * 10) / 10);
        const needsMaint = nextConservation < 72;
        if (!f.isUpgrading || !f.weeksRemaining) {
          return { ...f, conservacaoPct: nextConservation, manutencaoNecessaria: needsMaint };
        }
        const left = f.weeksRemaining - 1;
        if (left <= 0) {
          const nextLevel = f.level + 1;
          addNotification('FACILITY COMPLETED', `${f.name} upgraded to Level ${nextLevel}!`, 'info');
          return {
            ...f,
            isUpgrading: false,
            weeksRemaining: 0,
            level: nextLevel,
            capacidade: Math.min(99, (f.capacidade ?? 45) + 12),
            qualidade: Math.min(99, (f.qualidade ?? 46) + 12),
            produtividade: Math.min(99, (f.produtividade ?? 45) + 12),
            tecnologia: Math.min(99, (f.tecnologia ?? 44) + 12),
            conservacaoPct: 100,
            manutencaoNecessaria: false
          };
        }
        return { ...f, weeksRemaining: left, conservacaoPct: nextConservation, manutencaoNecessaria: needsMaint };
      })
    );

    // Random Regulatory Drift trigger every ~14 weeks
    if (currentWeek % 14 === 0 && !pendingRegulationChange) {
      setPendingRegulationChange({
        title: 'FIA 2027 TECHNICAL REGULATION DIRECTIVE',
        description: 'The FIA World Motor Sport Council proposes an active aero revision and thermal PU balance update to curb ground-effect bouncing.',
        impact: 'Affects Floor downforce efficiency and Mode X top speed drag.',
        targetSeason: seasonYear + 1,
        options: [
          { label: 'Adapt Current Architecture (Low Cost, -8% efficiency)', cost: 4500000, performanceRetained: 92 },
          { label: 'Ground-Up Redesign / Protocol Phoenix ($18M, 100% retained)', cost: 18000000, performanceRetained: 100 }
        ]
      });
      addNotification('REGULATORY DRIFT DETECTED', 'FIA technical working group proposal pending team principal decision.', 'warning');
    }

    // 4. Repasse Comercial Mensal (a cada 4 semanas, bankBalance direto, sem teto de gastos)
    if ((currentWeek + 1) % 4 === 0) {
      const monthlyCommercialIncome = Math.round(((receitaMarketing || 2000000) + (receitaMerchandising || 500000)) / 12);
      setFinancials(prev => ({
        ...prev,
        bankBalance: prev.bankBalance + monthlyCommercialIncome
        // NOTE: costCapSpent não é alterado! Isento de Cost Cap.
      }));
      addNotification(
        'DEPARTAMENTO COMERCIAL: REPASSE MENSAL',
        `Repasse mensal de marketing e merchandising no valor de $${(monthlyCommercialIncome / 1000000).toFixed(2)}M creditado diretamente no caixa (Isento do Teto de Gastos FIA).`,
        'info'
      );
    }

    // Recuperação de fadiga dos pilotos ao longo das semanas (-5 por semana de descanso)
    setDrivers(prev =>
      prev.map(d => ({
        ...d,
        fatigue: Math.max(0, (d.fatigue || 0) - 5)
      }))
    );

    // Geração de Carta de Decisão Semanal no Paddock (quando não há carta pendente)
    const nextWeekNumber = currentWeek + 1;
    const puCompForRisk = components.find(c => c.type === 'pu');
    const isHybridizedBoughtFactory =
      playerTeam.engineOrigin === 'bought_factory' &&
      (Boolean(playerTeam.thirdPartyErsSupplier) || (puCompForRisk?.reliability ?? 85) < 75);

    if (!pendingSeasonEventCard && isHybridizedBoughtFactory && (nextWeekNumber === 6 || nextWeekNumber === 12)) {
      const crisisCard: SeasonEventCard =
        nextWeekNumber === 6 && playerTeam.thirdPartyErsSupplier
          ? {
              id: `pu_hybrid_crisis_w${nextWeekNumber}`,
              category: 'crise_garagem',
              title: `CRISE DE PROPRIEDADE · INTEGRAÇÃO ERS ${playerTeam.thirdPartyErsSupplier.toUpperCase()}`,
              sender: `${playerTeam.headOfPowerUnit || 'Chefe de PU'} & Departamento Jurídico FIA`,
              description: `A adaptação do ERS ${playerTeam.thirdPartyErsSupplier} sobre o bloco comprado gerou picos de vibração no eixo do MGU-K após 500 km e exigiu revisão de royalties de telemetria.`,
              weekCreated: nextWeekNumber,
              options: [
                {
                  label: 'Pagar Reforço de Carcaça & Auditoria (-$3.5M)',
                  effectSummary: '-$3.5M Caixa · -$2.0M Cost Cap · +4% Confiabilidade PU',
                  cashDeltaUsd: -3500000,
                  costCapDeltaUsd: 2000000,
                  reliabilityDelta: 4
                },
                {
                  label: 'Operar no Limite Atual da Bancada ($0)',
                  effectSummary: 'Sem custo imediato · -4% Confiabilidade PU · -3 Moral',
                  reliabilityDelta: -4,
                  moraleDelta: -3
                }
              ]
            }
          : {
              id: `pu_block_fatigue_w${nextWeekNumber}`,
              category: 'crise_garagem',
              title: 'FADIGA TÉRMICA DO BLOCO COMPRADO (ANO 1)',
              sender: `${playerTeam.headOfPowerUnit || 'Chefe de PU'} · Bancada de Motores`,
              description: `A inspeção metalúrgica após o primeiro terço da temporada apontou microfissuras por fadiga de torque no bloco Ano 1 (${playerTeam.engineCustomName || 'PU'}).`,
              weekCreated: nextWeekNumber,
              options: [
                {
                  label: 'Substituir Lote de Pistões & Camisas (-$2.8M)',
                  effectSummary: '-$2.8M Caixa · -$1.5M Cost Cap · +5% Confiabilidade',
                  cashDeltaUsd: -2800000,
                  costCapDeltaUsd: 1500000,
                  reliabilityDelta: 5
                },
                {
                  label: 'Reduzir Regime Térmico em Corrida ($0)',
                  effectSummary: 'Economiza caixa · -3% Confiabilidade · -4 Moral da Garagem',
                  reliabilityDelta: -3,
                  moraleDelta: -4
                }
              ]
            };

      setPendingSeasonEventCard(crisisCard);
      addNotification(
        `ALERTA DE ENGENHARIA · SEMANA ${nextWeekNumber}`,
        `${crisisCard.title}: ${crisisCard.description}`,
        'warning'
      );
    } else if (!pendingSeasonEventCard && nextWeekNumber % 2 === 0) {
      const leadDriver = drivers.find(d => d.id === playerTeam.drivers?.[0]);
      const card = generateWeeklyEventCard({
        week: nextWeekNumber,
        chassisName: playerTeam.carModelName || 'APX-01',
        teamName: playerTeam.name,
        leadDriver,
        headOfAeroName: playerTeam.headOfAero,
        chiefMechanicName: playerTeam.chiefMechanic,
        seedOffset: currentCircuitIndex
      });
      setPendingSeasonEventCard(card);
      addNotification(
        `DECISÃO DE PADDOCK · SEMANA ${nextWeekNumber}`,
        `${card.title}: ${card.description}`,
        'info'
      );
    }
  };

  const resolveSeasonEventCard = (optionIndex: number) => {
    if (!pendingSeasonEventCard) return;
    const option = pendingSeasonEventCard.options[optionIndex];
    if (!option) return;

    if (option.cashDeltaUsd || option.costCapDeltaUsd || option.atrHoursDelta) {
      setFinancials(prev => ({
        ...prev,
        bankBalance: prev.bankBalance + (option.cashDeltaUsd || 0),
        costCapSpent: prev.costCapSpent + (option.costCapDeltaUsd || 0),
        atrWindTunnelHoursAvailable: Math.max(0, prev.atrWindTunnelHoursAvailable + (option.atrHoursDelta || 0))
      }));
    }

    if (option.moraleDelta) {
      setStaff(prev =>
        prev.map(s => ({
          ...s,
          morale: Math.max(15, Math.min(100, (s.morale ?? 75) + option.moraleDelta!))
        }))
      );
    }

    if (option.reputationDelta) {
      setAllTeams(prev =>
        prev.map(t =>
          t.isPlayer
            ? { ...t, reputation: Math.max(10, Math.min(100, (t.reputation || 65) + option.reputationDelta!)) }
            : t
        )
      );
    }

    if (option.fanDeltaPct) {
      setBaseDeFas(prev => Math.max(100000, Math.round(prev * (1 + option.fanDeltaPct! / 100))));
    }

    if (option.reliabilityDelta || option.downforceDelta) {
      setComponents(prev =>
        prev.map((c, idx) => {
          if (idx === 0 && option.downforceDelta) {
            return { ...c, downforce: Math.max(10, Math.round((c.downforce + option.downforceDelta) * 10) / 10) };
          }
          if (option.reliabilityDelta) {
            return { ...c, reliability: Math.max(20, Math.min(100, c.reliability + option.reliabilityDelta)) };
          }
          return c;
        })
      );
    }

    addNotification(
      `DECISÃO EXECUTADA: ${pendingSeasonEventCard.title}`,
      `${option.label} — ${option.effectSummary}`,
      'info'
    );
    playRadioSound();
    setPendingSeasonEventCard(null);
  };

  const resolveMidSeasonDilemma = (strategy: 'current_car' | 'balanced' | 'next_year') => {
    if (!pendingMidSeasonDilemma) return;
    const ratio = strategy === 'current_car' ? 0.25 : strategy === 'balanced' ? 0.50 : 0.75;
    setAtrNextYearAllocationRatio(ratio);

    if (strategy === 'current_car') {
      setFinancials(prev => ({ ...prev, atrWindTunnelHoursAvailable: prev.atrWindTunnelHoursAvailable + 35 }));
      addNotification(
        `FOCO TOTAL EM ${pendingMidSeasonDilemma.currentChassisName}`,
        `ATR para o próximo ano ajustado para 25% (+35h ATR imediatas liberadas para evoluir o ${pendingMidSeasonDilemma.currentChassisName} ainda nesta temporada).`,
        'warning'
      );
    } else if (strategy === 'balanced') {
      addNotification(
        `ESTRATÉGIA EQUILIBRADA (${pendingMidSeasonDilemma.currentChassisName} / ${pendingMidSeasonDilemma.nextChassisName})`,
        `Alocação ATR fixada em 50%/50%, cumprindo o mínimo seguro da FIA e mantendo evolução constante do carro atual.`,
        'info'
      );
    } else {
      setModificadorErroCorrelacao(prev => Number((prev - 0.04).toFixed(2)));
      addNotification(
        `PROJETO ${pendingMidSeasonDilemma.nextChassisName} PRIORIZADO`,
        `75% do Túnel de Vento e CFD redirecionados para ${pendingMidSeasonDilemma.nextChassisName}! Correlação futura aprimorada (-4% erro) garantindo base competitiva na abertura do próximo ano.`,
        'info'
      );
    }

    playRadioSound();
    setPendingMidSeasonDilemma(null);
  };

  const resolveRegulatoryChoice = (optionIndex: number) => {
    if (!pendingRegulationChange) return;
    const choice = pendingRegulationChange.options[optionIndex];
    setFinancials(prev => ({
      ...prev,
      bankBalance: prev.bankBalance - choice.cost,
      costCapSpent: prev.costCapSpent + choice.cost
    }));

    // 7. CRISE DE CONCEITO DA IA (Efeito Mercedes 2022):
    // Quando o Regulatory Drift ocorre, rivais têm chance de errar o conceito, perdendo 1.5s (-6 carRating).
    setAllTeams(prev =>
      prev.map(t => {
        if (!t.isPlayer && t.carRating >= 85) {
          if (Math.random() < 0.30) {
            addNotification(
              'CRISE DE CONCEITO NA IMPRENSA',
              `Imprensa: ${t.name} admite erro no conceito do carro de ${seasonYear + 1} e pode demitir seu diretor técnico! (-1.5s no ritmo de volta).`,
              'warning'
            );
            return {
              ...t,
              conceptCrisis: true,
              carRating: Math.max(70, t.carRating - 6)
            };
          }
        }
        return t;
      })
    );

    addNotification('REGULATION DIRECTIVE ADOPTED', `Allocated $${(choice.cost / 1000000).toFixed(1)}M to adapt car architecture.`, 'info');
    setPendingRegulationChange(null);
  };

  const triggerGenerateNewDrivers = (): Driver[] => {
    const newDrivers = generateNewDrivers(drivers.length);
    setDrivers(prev => [...prev, ...newDrivers]);
    addNotification(
      'YOUTH INTAKE: NOVOS TALENTOS DA F3',
      'Novos talentos da F3 foram revelados. Envie seus olheiros para analisar.',
      'info'
    );
    return newDrivers;
  };

  return (
    <GameContext.Provider
      value={{
        showStartScreen,
        setShowStartScreen,
        showOnboarding,
        setShowOnboarding,
        completeOnboarding,
        language,
        setLanguage,
        t,
        soundEnabled,
        setSoundEnabled,
        realisticCorrelation,
        setRealisticCorrelation,
        playRadioSound,
        saveGame,
        loadGame,
        loadRecentSave,
        exportCareerStatePayload,
        importCareerStatePayload,
        hasRecentSave,
        saveSlots,
        deleteSaveSlot,
        startNewGame,
        resetGameState,
        resetToastMessage,
        setResetToastMessage,
        onboardingSessionKey,
        activeTab,
        setActiveTab,
        dashboardViewMode,
        setDashboardViewMode,
        openGrandsPrixMode,
        currentWeek,
        seasonYear,
        currentCircuitIndex,
        currentCircuit,
        currentCircuitPackage,
        currentTrackPhysics,
        circuits: seasonCircuits,
        playerTeam,
        allTeams,
        drivers,
        staff,
        facilities,
        components,
        sponsors,
        financials,
        setFinancials,
        principalProfile,
        modificadorErroCorrelacao,
        modificadorSinergiaPiloto,
        modificadorTempoPeD,
        modificadorConfiabilidade,
        modificadorConfiancaDiretoria,
        modificadorMoralFabrica,
        modificadorCaixaInicial,
        modificadorDownforce,
        modificadorTempoManufatura,
        modificadorSetupRapido,
        semanasParaTeste,
        setSemanasParaTeste,
        baseDeFas,
        setBaseDeFas,
        receitaMarketing,
        setReceitaMarketing,
        receitaMerchandising,
        setReceitaMerchandising,
        baseDeFasHistory,
        setBaseDeFasHistory,
        organizarEventoMarketing,
        aduoWindowActive,
        aduoWeeksRemaining,
        aduoHomologationQuotas,
        aduoChassisDelayWeeks,
        aduoLastGapPercent,
        aduoBenchmarkPwr,
        aduoPlayerPwr,
        aduoHistory,
        avaliarADUO,
        aplicarModificacaoADUO,
        fecharJanelaADUO,
        motorHomologado,
        setMotorHomologado,
        semanasRestantesPreTemporada,
        setSemanasRestantesPreTemporada,
        motorHomologadoFIA,
        setMotorHomologadoFIA,
        homologarMotorFIA,
        homologarFIA,
        dataHomologacaoFIA,
        vehicleParams,
        updateVehicleParams,
        vehiclePhysics,
        lastSimulationReport,
        runEngineeringSimulation,
        carSetup,
        setupWindow,
        updateCarSetup,
        startComponentDevelopment,
        respondToChiefAdvice,
        respondToDriverFeedback,
        runWindTunnelTest,
        upgradeFacility,
        maintainFacility,
        unlockedPuMaterials,
        activePuMaterialResearch,
        startPuMaterialResearch,
        signDriver,
        dismissDriverAndPromote,
        promoteAffiliateToFP1,
        selectedAffiliateInFP1,
        weekendSession,
        setWeekendSession,
        fpRunsDone,
        runPracticeLap,
        simulateFreePractice1And2,
        qualifyingResults,
        runQualifyingShootout,
        isRaceLive,
        isRacePaused,
        raceSpeed,
        currentLap,
        totalLaps: currentCircuit.laps,
        liveCars,
        trackWeather,
        trackGripPercent,
        safetyCarStatus,
        trackFlagStatus,
        raceControlFeed,
        pitLaneStartDriverIds,
        togglePitLaneStart,
        resumeFromRedFlag,
        skipToChequeredFlag,
        startRace,
        pauseResumeRace,
        setRaceSpeedMultiplier,
        updateDriverTactics,
        orderPitStop,
        finishRaceWeekend,
        advanceWeek,
        notifications,
        clearNotification,
        addNotification,
        atrNextYearAllocationRatio,
        setAtrNextYearAllocationRatio,
        consecutiveNoPointsRaces,
        performanceHistory,
        phoenixDiscountH1,
        pendingRegulationChange,
        resolveRegulatoryChoice,
        pendingHaasCamaraEvent,
        resolveHaasCamaraEvent,
        generateNewDrivers: triggerGenerateNewDrivers,
        puClients,
        signPuClient,
        terminatePuClient,
        maxPuClientsCapacity,
        rdFacilityCapacity,
        pendingSeasonEventCard,
        resolveSeasonEventCard,
        pendingMidSeasonDilemma,
        resolveMidSeasonDilemma
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
};
