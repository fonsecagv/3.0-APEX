import type {
  AduoEvaluationResult,
  BaseDeFasPoint,
  CarSetup,
  CarUpgradeMilestone,
  ComponentSpec,
  Driver,
  Facility,
  MidSeasonDilemma,
  PerformanceHistoryPoint,
  PrincipalBackgroundId,
  SeasonEventCard,
  SetupWindow,
  Sponsor,
  StaffMember,
  Team,
  TeamFinancials,
  TrackFeedbackEntry,
} from '../types/f1';
import type { SimulationReport, VehicleEngineeringParameters } from '../types/physics';

export const CAREER_RECENT_SAVE_KEY = 'f1_apex_recent_save';
export const CAREER_SAVE_SLOTS_KEY = 'f1_apex_save_slots';
export const CAREER_ACTIVE_SCREEN_KEY = 'f1_apex_active_screen';

export interface CareerNotificationItem {
  id: string;
  title: string;
  message: string;
  date: string;
  type: 'info' | 'warning' | 'penalty';
}

export interface PersistedCareerState {
  careerInitialized?: boolean;
  currentWeek: number;
  seasonYear: number;
  currentCircuitIndex: number;
  activeTab?: 'overview' | 'engineering' | 'facilities' | 'team' | 'financials' | 'race_weekend' | 'pu_clients';
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
  activePuMaterialResearch?: {
    projectId: string;
    weeksRemaining: number;
    totalWeeks: number;
  } | null;
  haasCamaraEventResolved?: boolean;
  pendingSeasonEventCard?: SeasonEventCard | null;
  pendingMidSeasonDilemma?: MidSeasonDilemma | null;
  trackFeedbackLog?: TrackFeedbackEntry[];
  upgradeTimeline?: CarUpgradeMilestone[];
  puDevPoints?: number;
  // DNA modifiers
  modificadorErroCorrelacao?: number;
  modificadorSinergiaPiloto?: number;
  modificadorTempoPeD?: number;
  modificadorConfiabilidade?: number;
  modificadorConfiancaDiretoria?: number;
  modificadorMoralFabrica?: number;
  modificadorCaixaInicial?: number;
  modificadorDownforce?: number;
  modificadorTempoManufatura?: number;
  modificadorSetupRapido?: boolean;
  // Marketing & Pre-Season
  semanasParaTeste?: number;
  baseDeFas?: number;
  receitaMarketing?: number;
  receitaMerchandising?: number;
  baseDeFasHistory?: BaseDeFasPoint[];
  // Progression, Homologation & ADUO
  atrNextYearAllocationRatio?: number;
  consecutiveNoPointsRaces?: number;
  usedPhoenixYear1?: boolean;
  phoenixDiscountH1?: boolean;
  seasonFinishHistory?: { season: number; position: number }[];
  performanceHistory?: PerformanceHistoryPoint[];
  aduoWindowActive?: boolean;
  aduoWeeksRemaining?: number;
  aduoHomologationQuotas?: number;
  aduoChassisDelayWeeks?: number;
  aduoLastGapPercent?: number;
  aduoBenchmarkPwr?: number;
  aduoPlayerPwr?: number;
  aduoHistory?: AduoEvaluationResult[];
  motorHomologado?: boolean;
  semanasRestantesPreTemporada?: number;
  // Setup & Weekend
  carSetup?: CarSetup;
  setupWindow?: SetupWindow;
  fpRunsDone?: number;
  selectedAffiliateInFP1?: boolean;
  qualifyingResults?: { driverId: string; lapTimeSec: number; position: number }[];
  notifications?: CareerNotificationItem[];
}

export interface PersistedCareerSave {
  id: string;
  name: string;
  timestamp: string;
  teamName: string;
  teamColor: string;
  seasonYear: number;
  week: number;
  bankBalance: number;
  state: PersistedCareerState;
}

export function isValidPersistedCareerSave(raw: unknown): raw is PersistedCareerSave {
  if (!raw || typeof raw !== 'object') return false;
  const candidate = raw as Partial<PersistedCareerSave>;
  if (!candidate.state || typeof candidate.state !== 'object') return false;
  const st = candidate.state as Partial<PersistedCareerState>;
  return Array.isArray(st.allTeams) && st.allTeams.length > 0 && Array.isArray(st.drivers) && st.drivers.length > 0;
}

export function readRecentCareerSave(): PersistedCareerSave | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CAREER_RECENT_SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isValidPersistedCareerSave(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function readSavedSlotsList(): PersistedCareerSave[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CAREER_SAVE_SLOTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as PersistedCareerSave[]) : [];
  } catch {
    return [];
  }
}

export function setActiveScreenPreference(screen: 'start' | 'career'): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(CAREER_ACTIVE_SCREEN_KEY, screen);
  } catch {
    // ignore storage restriction
  }
}

export function shouldStartOnStartScreenOnBoot(bootSave: PersistedCareerSave | null): boolean {
  if (!bootSave?.state) return true;
  if (typeof sessionStorage === 'undefined') return true;
  try {
    const pref = sessionStorage.getItem(CAREER_ACTIVE_SCREEN_KEY);
    // If user reloaded the page while inside active career ('career'), resume straight into cockpit
    if (pref === 'career') return false;
    // If user explicitly navigated to Start Screen ('start'), keep StartScreen open with Continue button
    if (pref === 'start') return true;
    // Fresh tab with an existing saved career: show StartScreen with "Continuar Carreira (Nome da Equipe)"
    return true;
  } catch {
    return true;
  }
}

export function buildCareerSavePayload(
  slotId: string | undefined,
  state: PersistedCareerState,
  language: 'pt' | 'en' = 'pt'
): PersistedCareerSave {
  const playerT = state.allTeams.find(t => t.isPlayer) || state.allTeams[0];
  const yr = state.seasonYear || 2026;
  const wk = state.currentWeek || 1;
  return {
    id: slotId || `slot_${Date.now()}`,
    name: `Carreira ${playerT?.shortName || 'F1'} - S${yr} Wk${wk}`,
    timestamp: new Date().toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US'),
    teamName: playerT?.name || 'Escuderia F1',
    teamColor: playerT?.color || '#E10600',
    seasonYear: yr,
    week: wk,
    bankBalance: state.financials?.bankBalance ?? 0,
    state: {
      ...state,
      careerInitialized: true,
    },
  };
}

export function writeCareerSaveToStorage(
  payload: PersistedCareerSave,
  existingSlots: PersistedCareerSave[]
): PersistedCareerSave[] {
  if (typeof localStorage === 'undefined') return existingSlots;
  try {
    localStorage.setItem(CAREER_RECENT_SAVE_KEY, JSON.stringify(payload));
    const updatedSlots = [...existingSlots];
    const idx = updatedSlots.findIndex(s => s.id === payload.id);
    if (idx >= 0) {
      updatedSlots[idx] = payload;
    } else {
      updatedSlots.unshift(payload);
    }
    const trimmed = updatedSlots.slice(0, 5);
    localStorage.setItem(CAREER_SAVE_SLOTS_KEY, JSON.stringify(trimmed));
    localStorage.setItem(`f1_apex_slot_${payload.id}`, JSON.stringify(payload));
    return trimmed;
  } catch {
    return existingSlots;
  }
}
