import type { VehicleEngineeringParameters } from './physics';

export type CircuitId =
  | 'albert_park'
  | 'shanghai'
  | 'suzuka'
  | 'bahrain'
  | 'jeddah'
  | 'miami'
  | 'montreal'
  | 'monaco'
  | 'barcelona'
  | 'red_bull_ring'
  | 'silverstone'
  | 'spa'
  | 'hungaroring'
  | 'zandvoort'
  | 'monza'
  | 'madring'
  | 'baku'
  | 'singapore'
  | 'austin'
  | 'mexico'
  | 'interlagos'
  | 'las_vegas'
  | 'lusail'
  | 'yas_marina'
  | (string & {});

export type TireCompound = 'soft' | 'medium' | 'hard' | 'inter' | 'wet';
export type EngineMode = 'balanced' | 'harvest' | 'deploy' | 'overtake';
export type AeroMode = 'balanced' | 'mode_x' | 'mode_z'; // 2026 active aero
export type PaceMode = 'conserve' | 'balanced' | 'push' | 'attack';
export type FuelMixMode = 'rich' | 'standard' | 'lean'; // Modo Rico, Padrão, Pobre
export type FuelPartnerId = 'petronas' | 'shell' | 'aramco';
export type CareerPath = 'real_team' | 'custom_team';
export type UserRole = 'principal' | 'owner';
export type EngineOrigin = 'customer' | 'bought_factory' | 'phoenix';
export type CustomerEngineSupplier = 'Mercedes' | 'Ferrari' | 'Red Bull-Ford' | 'Honda' | 'Audi';
export type CarPhilosophy =
  | 'low_drag'
  | 'high_downforce'
  | 'stable_platform'
  | 'aero_efficiency'
  | 'mechanical_grip'
  | 'balanced_adaptive'
  | 'balanced'
  | 'tire_preservation';

export interface BoardDirective {
  targetPosition: number;
  maxCostCapSpend: number;
  minReliability: number;
  description: string;
  boardConfidence: number; // 0 to 100
}

export interface AduoEvaluationResult {
  round: number;
  playerPwr: number;
  benchmarkPwr: number;
  gapPercent: number;
  quotasGranted: number;
  costCapBonus: number;
  windowWeeks: number;
  status: 'active' | 'parity' | 'expired';
}

export interface PreSeasonTestResult {
  carReadyOnTime: boolean;
  delayWeeks: number;
  testLapTimeSec: number;
  lapsCompleted: number;
  porpoisingDetected: boolean;
  thermalOverheatWarning: boolean;
  rank: number;
  feedback: string;
}

export interface Circuit {
  id: CircuitId;
  round?: number;
  name: string;
  officialGpTitle?: string;
  country: string;
  city: string;
  gpDateIso?: string;
  isSprint?: boolean;
  laps: number;
  lapDistanceKm: number;
  raceDistanceKm?: number;
  corners?: number;
  baseLapTimeSec: number;
  aeroDemand: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  tireWearSeverity: number; // 1 to 5
  pitLaneLossSec: number;
  overtakeDifficulty: number; // 1 to 5
  description: string;
  svgPath: string; // Smooth SVG track outline generated from GeoJSON
  geojsonId?: string;
  altitudeM?: number;
  calculatedLengthM?: number;
  certificationStatus?: string;
  confidence?: string;
  provenanceSource?: string;
}

export interface ComponentSpec {
  id: string;
  name: string;
  type: 'pu' | 'gearbox' | 'chassis' | 'suspension' | 'floor' | 'wings';
  level: number;
  maxLevel?: number; // Nível Máximo (padrão 10)
  performance: number; // 0 - 100
  reliability: number; // 0 - 100
  weightKg: number;
  dragCoefficient: number; // lower is better
  downforce: number; // higher is better
  coolingEfficiency?: number;
  porpoisingRisk?: number; // for floor
  thermalCompatibility?: number; // for PU
  cost: number;
  costCapImpact: number;
  designWeeks: number;
  inDevelopment?: boolean;
  developmentWeeksLeft?: number;
}

export interface CarSetup {
  frontWingAngle: number; // 0 - 50
  rearWingAngle: number; // 0 - 50
  suspensionStiffness: number; // 1 - 10
  camberAngle: number; // -3.5 to -1.0
  tirePressurePsi: number; // 20.0 - 25.0
  gearRatioBias: number; // 0 (accel) to 100 (top speed)
}

export interface SetupWindow {
  idealFrontWing: number;
  idealRearWing: number;
  idealStiffness: number;
  idealPressure: number;
  confidence: number; // 0 - 100% dialed in during FP1/2/3
}

export interface Driver {
  id: string;
  name: string;
  shortCode: string;
  number: number;
  nationality: string;
  teamId: string;
  isAffiliate?: boolean; // F2/F3 academy
  series?: 'F1' | 'F2' | 'F3';
  isFreeAgent?: boolean;
  requiredReputation?: number;
  ovr?: number;
  salary: number; // annual
  contractYearsRemaining: number;
  buyoutClause: number;
  marketability: number; // 0 - 100
  mentality: number; // 0 - 100
  potential: number; // 0 - 100
  age: number;
  avatarColor: string;
  fatigue?: number; // 0 - 100 fadiga acumulada por eventos de marketing/testes
  // 14 Core Attributes
  attributes: {
    pace: number;
    cornering: number;
    braking: number;
    consistency: number;
    smoothness: number;
    overtaking: number;
    defending: number;
    wetWeather: number;
    tireManagement: number;
    reactionTime: number;
    composure: number;
    feedback: number;
    stamina: number;
    accuracy?: number;
    control?: number;
    racecraft?: number;
    adaptability?: number;
  };
}

export type ProjectAmbitionId = 'bold' | 'balanced' | 'grounded';

export interface StaffAttributes {
  tecnica: number;
  criatividade: number;
  rigorValidacao: number;
  lideranca: number;
  comunicacao: number;
  gestaoPrazo: number;
  adaptacao: number;
}

export interface StaffMember {
  id: string;
  name: string;
  role: 'head_aero' | 'head_pu' | 'sporting_director' | 'chief_mechanic' | 'tech_director' | 'chief_engineer' | 'race_engineer';
  rating: number; // 0 - 100
  age?: number;
  mentality: number;
  morale?: number;
  salary: number;
  buyoutClause?: number;
  currentTeam?: string;
  specialty: string;
  designDna?: string;
  staffPhilosophyTag?: string;
  preferredCarPhilosophy?: CarPhilosophy;
  attributes?: StaffAttributes;
  description?: string;
  teamOrigin: string; // DNA heritage
  isFictional?: boolean;
}

export interface Facility {
  id: string;
  name: string;
  category?: 'desenvolvimento' | 'pessoal' | 'operacoes' | 'pu_works';
  level: number; // 1 (Básico) to 5 (Elite)
  upgradeCost: number;
  annualUpkeep: number;
  description: string;
  effect: string;
  capacidade?: number; // 0 - 100
  qualidade?: number; // 0 - 100
  produtividade?: number; // 0 - 100
  tecnologia?: number; // 0 - 100
  conservacaoPct?: number; // 0 - 100
  manutencaoNecessaria?: boolean;
  capacidadeExpansao?: number; // max tier (5)
  isWorksExclusive?: boolean;
  isUpgrading?: boolean;
  weeksRemaining?: number;
}

export interface TeamFinancials {
  bankBalance: number; // Real Cash
  costCapLimit: number; // $135M standard
  costCapSpent: number;
  atrWindTunnelHoursAvailable: number; // ATR allocation
  atrCfdMegaAllocations: number;
  atrPeriodWeeksLeft: number;
}

export interface Sponsor {
  id: string;
  name: string;
  type: 'title' | 'secondary' | 'flash';
  annualPayout: number;
  raceBonus: number;
  targetObjective: string;
  targetPosition: number;
  active: boolean;
  satisfaction: number; // 0 - 100
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  carModelName?: string;
  color: string;
  secondaryColor: string;
  isPlayer: boolean;
  dnaFocusNextYearRatio: number; // 0.4 for top teams, 0.8 for backmarkers
  carRating: number; // Composite
  points: number;
  position: number;
  reputation?: number;
  drivers: [string, string]; // Driver IDs
  affiliateDriverId?: string;
  teamPrincipal?: string;
  headOfAero?: string;
  headOfPowerUnit?: string;
  sportingDirector?: string;
  chiefMechanic?: string;
  engineSupplier: 'Ferrari' | 'Mercedes' | 'RedBull-Ford' | 'Red Bull-Ford' | 'Honda' | 'Audi' | 'Alpine' | 'In-House';
  location: string;
  engineLocation: string;
  role?: UserRole;
  isManufacturer?: boolean;
  engineOrigin?: EngineOrigin;
  fuelPartner?: FuelPartnerId;
  eFuelRating?: number;
  baseDeFas?: number;
  receitaMarketing?: number;
  receitaMerchandising?: number;
  baseDeFasHistory?: BaseDeFasPoint[];
  filosofiaAtual?: CarPhilosophy;
  conceptCrisis?: boolean;
}

export interface BaseDeFasPoint {
  round: number;
  raceName: string;
  fans: number;
  changePercent: number;
}

export interface PerformanceHistoryPoint {
  round: number;
  season: number;
  circuitName: string;
  playerRating: number;
  rivalRatings: {
    ferrari: number;
    redbull: number;
    mercedes: number;
  };
}

export interface LiveCarState {
  driverId: string;
  driverName: string;
  shortCode: string;
  driverNumber: number;
  teamId: string;
  teamColor: string;
  isPlayer: boolean;
  position: number;
  lap: number;
  distanceOnLap: number; // 0 - 1
  totalDistance: number;
  currentLapTime: number;
  lastLapTime: number;
  bestLapTime: number;
  gapToLeaderSec: number;
  gapToAheadSec: number;
  tireCompound: TireCompound;
  tireAgeLaps: number;
  tireWearPercent: number; // 0 (new) to 100 (punctured/dead)
  tireGrainingBlistering: number; // 0 - 100
  tireTempC: number;
  socPercent: number; // ERS State of Charge 0 - 100%
  batteryTempC: number;
  engineMode: EngineMode;
  aeroMode: AeroMode;
  paceMode: PaceMode;
  fuelMixMode: FuelMixMode; // 'rich' | 'standard' | 'lean'
  fuelRemainingKg: number; // Current fuel load in kg
  fuelInitialKg: number; // Starting load in kg (85kg if eFuel > 85, else 100kg)
  fuelBurnKgPerLap: number; // Burn rate kg/lap
  fuelSavingPenaltySec: number; // Penalty in seconds (0.0, 0.1, or 0.3)
  eFuelRating: number; // Efficiency rating of PU
  inPitLane: boolean;
  pitStopsDone: number;
  pitDurationSec: number;
  hasDerating: boolean; // Power cut when ERS empty
  damagePercent: number;
  status: 'running' | 'pitted' | 'retired';
  retireReason?: string;
  penaltySec?: number;
  penaltiesCount?: number;
  startedFromPitLane?: boolean;
  pitLaneStartTicks?: number;
  hasBlueFlag?: boolean;
  isDisqualified?: boolean;
  lastIncidentText?: string;
  effectiveRaceTimeSec?: number;
}

export interface RaceTelemetrySnapshot {
  timestampSec: number;
  speedKmh: number;
  gear: number;
  rpm: number;
  throttlePercent: number;
  brakePercent: number;
  drsActive: boolean;
  ersKwDeploy: number;
}

export type PrincipalBackgroundId =
  | 'chief_engineer'
  | 'ex_driver'
  | 'legendary_mechanic'
  | 'financial_magnate'
  | 'data_strategist'
  | 'elite_executive'
  | 'fia_man'
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

export interface OnboardingResult {
  careerPath: CareerPath;
  userRole: UserRole;
  teamId: string;
  teamName: string;
  teamShort: string;
  teamColor: string;
  principalName: string;
  principalBackground: PrincipalBackgroundId;
  engineOrigin: EngineOrigin;
  engineSupplier: string;
  location?: string;
  hqBonus?: string;
  hqOnus?: string;
  philosophy: CarPhilosophy;
  fuelPartner?: FuelPartnerId;
  puInjectionMapping?: number;
  driver1Id: string;
  driver2Id: string;
  affiliateId: string;
  reserveDriverId?: string;
  headAeroId?: string;
  headPUId?: string;
  sportingDirectorId?: string;
  chiefMechanicId?: string;
  raceEngineer1Id?: string;
  raceEngineer2Id?: string;
  projectAmbition?: ProjectAmbitionId;
  boardTargetPosition?: number;
  boardPressureLevel?: 'high' | 'medium' | 'low';
  initialProjectBudgetUsd?: number;
  staffPhilosophyPenaltyPct?: number;
  hqLogisticsCostFactor?: number;
  hqEuropeanStaffAppeal?: number;
  semanasParaTeste?: number;
  baseDeFas?: number;
  receitaMarketing?: number;
  receitaMerchandising?: number;
  hasPatrioticBonus?: boolean;
  engineModifications?: {
    reprogramErs: boolean;
    reinforcePistons: boolean;
    redesignChamber: boolean;
  };
  dynamoFailed?: boolean;
  thirdPartyErsMercedes?: boolean;
  thirdPartyErsSupplier?: CustomerEngineSupplier | null;
  thirdPartyErsCost?: number;
  emergencyMercedesDeal?: boolean;
  emergencySupplier?: CustomerEngineSupplier;
  emergencyPenaltyDescription?: string;
  emergencyMercedesCost?: number;
  abandonedToZero?: boolean;
  customCorrelationErrorMod?: number;
  prototypeCostPaid?: number;
  productionCostPaid?: number;
  gearboxCostPaid?: number;
  gearboxConfig?: {
    material: 'aluminum' | 'carbon' | 'titanium';
    ratio: number;
    layout: 'compact' | 'voluminous';
    cost: number;
    productionWeeks: number;
  };
  chassisConfig?: {
    sidepodConcept: 'conventional' | 'downwash' | 'zeropod';
    suspensionFront: 'pushrod' | 'pullrod';
    suspensionRear: 'pushrod' | 'pullrod';
  };
  vehicleParams?: VehicleEngineeringParameters;
  testResult: {
    lapTime: number;
    rank: number;
    porpoising: boolean;
    reliability: number;
    delayWeeks: number;
  } | null;
}

export interface PuClientContract {
  id: string;
  proposalId: string;
  teamId: string;
  teamName: string;
  shortName: string;
  country: string;
  color: string;
  annualPayment: number;
  durationSeasons: number;
  seasonsRemaining: number;
  signedInYear: number;
  engineFailureCount: number;
  consecutiveSlowestRaces: number;
  status: 'active' | 'terminated';
}

