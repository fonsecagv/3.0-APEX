export type DataClassification = 'Medido' | 'Simulado' | 'Estimado' | 'Inferido' | 'Hipotético';

export type PhysicsDiscipline =
  | 'Aerodinâmica'
  | 'Dinâmica dos Fluidos'
  | 'Termodinâmica'
  | 'Estruturas'
  | 'Dinâmica Veicular'
  | 'Pneus';

export interface PhysicsPhenomenon {
  id: string;
  name: string;
  discipline: PhysicsDiscipline;
  whereItActs: string;
  equations: string;
  inputs: string[];
  outputs: string[];
  units: string;
  limitations: string;
  associatedComponents: Array<'pu' | 'gearbox' | 'chassis' | 'suspension' | 'floor' | 'wings' | 'tires' | 'cooling'>;
  dependencies: string[];
  source: string;
  license: string;
  confidence: 'Alta' | 'Média' | 'Calibrável';
  version: string;
  consequence: string;
}

export interface CompositeMaterialSpec {
  id: 't800' | 't1000' | 'm40j';
  name: string;
  fiberModulusGpa: number;
  tensileStrengthMpa: number;
  densityKgM3: number;
  thermalConductivityWmK: number;
  fractureToughness: number; // relative 0-1
  costPerKgUsd: number;
  classification: DataClassification;
}

export interface MetalAlloySpec {
  id: 'aluminum' | 'titanium' | 'carbon';
  name: string;
  youngsModulusGpa: number;
  yieldStrengthMpa: number;
  densityKgM3: number;
  thermalConductivityWmK: number;
  fatigueEnduranceRatio: number;
  impactBrittleness: number; // 0 (ductile) - 1 (brittle)
  classification: DataClassification;
}

export interface VehicleEngineeringParameters {
  // 1. Packaging & 2026 Regulatory Chassis Envelope
  wheelbaseMm: number; // max 3400 mm (2026)
  trackWidthMm: number; // max 1900 mm (2026)
  targetFrontWeightPct: number; // ~45-47%

  // 2. Floor & Diffuser (2026 Flatter Floor + Enlarged Rear Diffuser)
  floorLengthMm: number; // 2600 - 3100 mm
  floorUsefulWidthMm: number; // 1300 - 1550 mm
  frontRideHeightMm: number; // 18 - 40 mm
  rearRideHeightMm: number; // 35 - 75 mm
  diffuserAngleDeg: number; // 6 - 15 deg
  diffuserLengthMm: number; // 650 - 950 mm
  floorEdgeComplexity: number; // 0 - 100
  floorStiffnessNmm: number; // 800 - 2500 N/mm
  floorSurfaceRoughnessUm: number; // 1.0 - 15.0 µm

  // 3. Sidepods & Cooling System
  sidepodInletAreaCm2: number; // 240 - 480 cm²
  sidepodDuctDepthMm: number; // 180 - 380 mm
  radiatorVolumeL: number; // 8 - 18 L
  sidepodUndercutPct: number; // 10 - 90 %
  hotAirExitAreaCm2: number; // 200 - 450 cm²
  coolantFlowLpm: number; // 90 - 170 L/min

  // 4. Active Wings (2026 Corner Mode Z & Straight Mode X)
  frontWingFlapCornerDeg: number; // 18 - 42 deg
  frontWingFlapStraightDeg: number; // 4 - 16 deg
  rearWingFlapCornerDeg: number; // 22 - 48 deg
  rearWingFlapStraightDeg: number; // 3 - 15 deg
  wingSpanMm: number; // 1800 - 1900 mm
  wingStructuralStiffnessPct: number; // 40 - 100 %

  // 5. Power Unit (6 Subsystems - 50/50 2026)
  iceMaterial: 'aluminum' | 'titanium';
  iceMetallurgyId?: 'fia_iron_ams6487' | 'ferrari_steel_head' | 'al_si_low_friction';
  iceCompressionRatio: number; // 14.0 - 16.0 (2026 limit 16.0)
  turboDiameterMm: number; // 78 - 104 mm (small spool vs peak power)
  turboArRatio?: number; // 0.72 - 1.18 (turbine housing A/R trim, default 0.92)
  mgukMaxKw: number; // 280 - 350 kW (2026 limit 350 kW)
  batteryCellTech: 'dense_pack' | 'lightweight_lithium' | 'ultra_solid_state';
  batterySubChemistry?: 'nca' | 'si_c';
  batteryInternalResistanceMOhm: number; // 8 - 22 mOhm
  ersDeployBiasPct: number; // 10 - 90 % (harvest vs aggressive deploy)
  ersPreservationPct?: number; // 0 - 100 % (anti-clipping & SOC floor reserve, default 55)

  // 6. Transmission & Gearbox
  gearboxMaterial: 'aluminum' | 'titanium' | 'carbon';
  gearRatioBias: number; // 0 (short accel) - 100 (long top speed)
  gearboxLayout: 'compact' | 'voluminous';
  gearToothWidthMm: number; // 14 - 22 mm
  differentialLockPct: number; // 25 - 85 %
  gearboxOilCoolingKw: number; // 6 - 18 kW
  customGearRatios?: number[]; // optional 8-element array of Z2/Z1 target ratios
  gearboxStaffTuning?: {
    efficiencyBonus: number;
    fatigueBonusRaces: number;
    shiftReductionS: number;
  };

  // 7. Monocoque & Laminate Layup (Anisotropy)
  compositeFiber: 't800' | 't1000' | 'm40j';
  layupPlyZeroPct: number; // 0° axial % (sum ~100%)
  layupPly45Pct: number; // ±45° torsional %
  layupPly90Pct: number; // 90° hoop/transverse %
  laminateThicknessMm: number; // 2.4 - 5.2 mm
  localReinforcementPct: number; // 10 - 60 %

  // 8. Suspension & Kinematics
  frontSuspensionType: 'pushrod' | 'pullrod';
  rearSuspensionType: 'pushrod' | 'pullrod';
  upperArmInclinationDeg: number; // 2 - 14 deg
  rockerMotionRatio: number; // 0.65 - 1.15
  springRateNmm: number; // 140 - 340 N/mm
  damperNsM: number; // 2500 - 6500 N·s/m
  antiRollBarNmm: number; // 40 - 140 N/mm
  antiDivePct: number; // 15 - 65 %
  antiSquatPct: number; // 15 - 65 %
  staticCamberDeg: number; // -3.5 to -1.2 deg
  toeAngleDeg: number; // -0.35 to +0.20 deg
}

export interface ClassifiedMetric {
  value: number;
  unit: string;
  classification: DataClassification;
  uncertaintyPct?: number;
}

export interface VehiclePhysicsOutputs {
  // Reference conditions (SI)
  airDensityKgM3: number;
  referenceSpeedMs: number; // e.g. 69.44 m/s (250 km/h)

  // Aerodynamics - Corner Mode (Mode Z)
  cornerMode: {
    downforceTotalN: number;
    downforceFrontN: number;
    downforceRearN: number;
    dragForceN: number;
    clTotal: number;
    cdTotal: number;
    cdAM2: number;
    aeroEfficiencyLD: number;
    aeroBalanceFrontPct: number;
  };

  // Aerodynamics - Straight Mode (Mode X)
  straightMode: {
    downforceTotalN: number;
    dragForceN: number;
    clTotal: number;
    cdTotal: number;
    cdAM2: number;
    aeroEfficiencyLD: number;
    dragReductionPct: number;
  };

  // Aero Stability & Floor Flow
  rideHeightSensitivityNPerMm: number;
  yawSensitivityPct: number;
  separationMarginPct: number;
  porpoisingRiskPct: number;
  diffuserPressureRecoveryPct: number;

  // Fluid & Thermal
  massFlowKgS: number;
  ductPressureDropPa: number;
  radiatorHeatRejectionKw: number;
  iceHeatGenerationKw: number;
  batteryJouleLossesKw: number; // P = I^2 * R
  totalPuHeatKw: number;
  iceOperatingTempC: number;
  batteryCellTempC: number;
  gearboxOilTempC: number;
  thermalMarginC: number;
  coolingDragN: number;

  // Structures & Packaging (Anisotropic FEA)
  totalMassKg: number;
  legalMinMassKg: number;
  weightDistFrontPct: number;
  cgHeightMm: number;
  torsionalStiffnessNmDeg: number;
  flexuralStiffnessNmm: number;
  maxLaminateStressMpa: number;
  bucklingSafetyFactor: number;
  fatigueLifeRaces: number;
  impactAbsorptionMarginPct: number;
  delaminationRiskPct: number;

  // Dynamics & Tires (Pacejka reduced)
  camberGainDegPerMm: number;
  brakingPitchDeg: number;
  cornerRollDeg: number;
  lateralLoadTransferPct: number;
  naturalFrequencyHz: number;
  dampingRatio: number;
  tirePeakLateralN: number;
  tirePeakLongitudinalN: number;
  tireLoadSensitivityLossPct: number;
  tireThermalWindowHealthPct: number;
  tireWearRateMultiplier: number;

  // Powertrain & Transmission
  effectiveIcePowerKw: number;
  effectiveMgukPowerKw: number;
  peakCombinedPowerKw: number;
  peakCombinedPowerHp: number;
  totalWheelPowerKw: number;
  totalWheelPowerHp: number;
  transmissionEfficiencyPct: number;
  mechanicalLossesKw: number;
  turboSpoolLagMs: number;
  maintenanceTurnaroundPenaltyMin: number; // Decoupled from tire pit stop!

  // Normalized summary scores for UI compatibility (derived strictly from SI physics above)
  summary: {
    carRating: number;
    cornerGripScore: number; // 0-100
    straightSpeedScore: number; // 0-100
    reliabilityScore: number; // 0-100
    consistencyScore: number; // 0-100
    aeroScore: number; // 0-100
    downforcePoints: number;
    dragCoefficient: number;
  };
}

export interface RegulatoryCheckResult {
  compliant: boolean;
  violations: Array<{
    article: string;
    parameter: string;
    measuredValue: string;
    limitValue: string;
    severity: 'critical' | 'warning';
  }>;
  warnings: string[];
}

export interface CfdReportData {
  pressureMap: {
    frontWingSuctionKpa: number;
    floorThroatSuctionKpa: number;
    diffuserExitKpa: number;
    sidepodStagnationKpa: number;
  };
  flowVelocityPeakMs: number;
  downforceSplitPct: { frontWing: number; floor: number; rearWing: number };
  totalDragN: number;
  separationZones: string[];
  vorticityIndex: number;
  rideHeightSensitivityNPerMm: number;
  yawSensitivityPct: number;
  classification: DataClassification;
}

export interface FeaReportData {
  maxVonMisesStressMpa: number;
  allowableYieldMpa: number;
  maxDeflectionMm: number;
  torsionalStiffnessNmDeg: number;
  bucklingSafetyFactor: number;
  firstNaturalModeHz: number;
  estimatedFatigueLifeRaces: number;
  delaminationRiskPct: number;
  classification: DataClassification;
}

export interface ThermalReportData {
  iceTempC: number;
  batteryTempC: number;
  gearboxOilTempC: number;
  brakePeakTempC: number;
  heatGeneratedKw: number;
  coolingCapacityKw: number;
  thermalMarginC: number;
  criticalRegions: string[];
  classification: DataClassification;
}

export interface EngineerDiagnostic {
  specialistRole:
    | 'Diretor Técnico'
    | 'Chefe de Aerodinâmica'
    | 'Chefe de Dinâmica'
    | 'Chefe de Estruturas'
    | 'Chefe de PU'
    | 'Engenheiro Térmico'
    | 'Engenheiro de Materiais'
    | 'Chefe Mecânico';
  specialistName: string;
  competenceRating: number;
  diagnostic: string;
  physicalHypothesis: string;
  availableEvidence: string;
  recommendedSolution: string;
  estimatedCostUsd: number;
  riskLevel: 'Baixo' | 'Moderado' | 'Alto' | 'Crítico';
  uncertaintyPct: number;
  dependencies: string[];
}

export interface EngineeringChecklistItem {
  id: number;
  criterion: string;
  passed: boolean;
  detail: string;
}

export interface SimulatorPilotReport {
  driverId: string;
  driverName: string;
  driverNumber: number;
  feedbackRating: number;
  trustRating: number;
  handlingVerdict: 'estavel' | 'nervoso' | 'rigido' | 'critico';
  quote: string;
  suggestedAdjustment: string;
  recommendedActionType?: 'vehicle' | 'setup';
  recommendedParamsPatch?: Partial<VehicleEngineeringParameters>;
  driverPerceivedAxes: Array<{
    key: 'downforce' | 'lowDrag' | 'traction' | 'tireCare' | 'powerUnit' | 'reliability';
    label: string;
    value: number;
  }>;
}

export interface SimulationReport {
  timestamp: string;
  componentType: 'pu' | 'gearbox' | 'chassis' | 'suspension' | 'floor' | 'wings';
  approved: boolean;
  atrHoursUsed: number;
  baseCorrelationErrorPct: number;
  finalCorrelationErrorPct: number;
  dnaModifierPct: number;
  physics: VehiclePhysicsOutputs;
  regulatory: RegulatoryCheckResult;
  cfd: CfdReportData;
  fea: FeaReportData;
  thermal: ThermalReportData;
  diagnostics: EngineerDiagnostic[];
  checklist: EngineeringChecklistItem[];
  checklistScore: number;
  consequenceChain: string[];
  pilotReport?: SimulatorPilotReport;
}

export interface MdoParetoSolution {
  id: 'max_performance' | 'max_stability' | 'max_efficiency' | 'min_mass' | 'max_reliability';
  label: string;
  subtitle: string;
  tradeoffNote: string;
  paramsPatch: Partial<VehicleEngineeringParameters>;
  metrics: {
    estimatedLapDeltaSec: number;
    aeroEfficiencyLD: number;
    totalMassKg: number;
    thermalMarginC: number;
    stabilityScore: number;
    reliabilityScore: number;
  };
}
