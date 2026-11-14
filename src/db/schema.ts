import { relations } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// ============================================================================
// CORE AUTH & PERSISTENT SAVE WORKSPACE
// ============================================================================
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const careerSnapshots = pgTable('career_snapshots', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  slotId: text('slot_id').notNull(),
  teamName: text('team_name').notNull(),
  seasonYear: integer('season_year').notNull(),
  week: integer('week').notNull(),
  statePayload: jsonb('state_payload').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// GOVERNANCE: FIA REGULATIONS, MODEL VERSIONS & REQUIREMENT TRACEABILITY
// ============================================================================
export const regulationEditions = pgTable('regulation_editions', {
  id: serial('id').primaryKey(),
  series: text('series').notNull(), // e.g. 'FIA Formula 1'
  seasonYear: integer('season_year').notNull(),
  section: text('section').notNull(), // e.g. 'Section C & Power Unit'
  issue: text('issue').notNull(), // e.g. 'Issue 16 / PU Issue 5'
  effectiveDate: text('effective_date').notNull(),
  title: text('title').notNull(),
  sourceUrl: text('source_url').notNull(),
  documentHash: text('document_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const regulationLimits = pgTable('regulation_limits', {
  id: serial('id').primaryKey(),
  editionId: integer('edition_id')
    .references(() => regulationEditions.id, { onDelete: 'cascade' })
    .notNull(),
  moduleCode: text('module_code').notNull(), // M03, M04, M07, M08, M09
  parameterCode: text('parameter_code').notNull(),
  parameterName: text('parameter_name').notNull(),
  minValue: doublePrecision('min_value'),
  maxValue: doublePrecision('max_value'),
  unitSi: text('unit_si').notNull(),
  articleRef: text('article_ref').notNull(),
  notes: text('notes').notNull(),
});

export const modelVersions = pgTable('model_versions', {
  id: serial('id').primaryKey(),
  moduleCode: text('module_code').notNull(), // M01..M12
  modelName: text('model_name').notNull(),
  major: integer('major').notNull().default(1),
  minor: integer('minor').notNull().default(0),
  patch: integer('patch').notNull().default(0),
  semver: text('semver').notNull(),
  lifecycleStatus: text('lifecycle_status').notNull().default('Draft'), // Draft | Verified | Calibrated | Validated | Approved | Deprecated | Rejected
  parentVersionId: integer('parent_version_id'),
  approvedBy: text('approved_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const requirementTraceability = pgTable('requirement_traceability', {
  id: serial('id').primaryKey(),
  reqCode: text('req_code').notNull().unique(),
  moduleCode: text('module_code').notNull(),
  manualSection: text('manual_section').notNull(),
  description: text('description').notNull(),
  phenomenonRef: text('phenomenon_ref').notNull(),
  equationRef: text('equation_ref').notNull(),
  variablesList: text('variables_list').notNull(),
  unitSi: text('unit_si').notNull(),
  computationalModel: text('computational_model').notNull(),
  softwareComponent: text('software_component').notNull(),
  dbTables: text('db_tables').notNull(),
  requiredTests: text('required_tests').notNull(),
  status: text('status').notNull().default('NOT_STARTED'), // NOT_STARTED | SPECIFIED | IN_DEVELOPMENT | IMPLEMENTED | TESTED | VALIDATED | APPROVED | BLOCKED
  evidenceRef: text('evidence_ref').notNull(),
  implementedVersion: text('implemented_version').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// M01 — FUNDAÇÃO FÍSICA E BANCO CIENTÍFICO
// ============================================================================
export const disciplines = pgTable('disciplines', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  consumers: text('consumers').notNull(),
});

export const units = pgTable('units', {
  id: serial('id').primaryKey(),
  symbol: text('symbol').notNull().unique(),
  name: text('name').notNull(),
  quantity: text('quantity').notNull(),
  isSiBase: boolean('is_si_base').notNull().default(true),
  siDimensions: text('si_dimensions').notNull(), // e.g. M^1 L^1 T^-2
});

export const sources = pgTable('sources', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  title: text('title').notNull(),
  authorInstitution: text('author_institution').notNull(),
  url: text('url').notNull(),
  publishedDate: text('published_date').notNull(),
  license: text('license').notNull(),
  evidenceLevel: text('evidence_level').notNull(), // E1..E6
  version: text('version').notNull(),
  contentHash: text('content_hash').notNull(),
});

export const phenomena = pgTable('phenomena', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  disciplineId: integer('discipline_id')
    .references(() => disciplines.id)
    .notNull(),
  name: text('name').notNull(),
  whereItActs: text('where_it_acts').notNull(),
  equationsText: text('equations_text').notNull(),
  limitations: text('limitations').notNull(),
  infoClass: text('info_class').notNull(),
  sourceId: integer('source_id')
    .references(() => sources.id)
    .notNull(),
  version: text('version').notNull(),
});

export const variables = pgTable('variables', {
  id: serial('id').primaryKey(),
  symbol: text('symbol').notNull().unique(),
  name: text('name').notNull(),
  unitId: integer('unit_id')
    .references(() => units.id)
    .notNull(),
  role: text('role').notNull(), // input | calibratable | state | output | derived
  coordinateFrame: text('coordinate_frame').notNull(),
  signConvention: text('sign_convention').notNull(),
  domainMin: doublePrecision('domain_min').notNull(),
  domainMax: doublePrecision('domain_max').notNull(),
  infoClass: text('info_class').notNull(),
  uncertaintyPct: doublePrecision('uncertainty_pct').notNull(),
  sourceId: integer('source_id')
    .references(() => sources.id)
    .notNull(),
  version: text('version').notNull(),
});

export const equations = pgTable('equations', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  expression: text('expression').notNull(),
  phenomenonId: integer('phenomenon_id')
    .references(() => phenomena.id)
    .notNull(),
  domainDescription: text('domain_description').notNull(),
  dimensionalCheckPassed: boolean('dimensional_check_passed').notNull().default(false),
  version: text('version').notNull(),
});

export const materials = pgTable('materials', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(), // composite | alloy
  densityKgM3: doublePrecision('density_kg_m3').notNull(),
  modulusGpa: doublePrecision('modulus_gpa').notNull(),
  yieldStrengthMpa: doublePrecision('yield_strength_mpa').notNull(),
  tensileStrengthMpa: doublePrecision('tensile_strength_mpa').notNull(),
  thermalConductivityWmK: doublePrecision('thermal_conductivity_w_mk').notNull(),
  fractureToughness: doublePrecision('fracture_toughness').notNull(),
  fatigueEnduranceRatio: doublePrecision('fatigue_endurance_ratio').notNull(),
  costPerKgUsd: doublePrecision('cost_per_kg_usd').notNull(),
  infoClass: text('info_class').notNull(),
  sourceId: integer('source_id')
    .references(() => sources.id)
    .notNull(),
  version: text('version').notNull(),
});

export const fluids = pgTable('fluids', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  fluidType: text('fluid_type').notNull(), // air | fuel | coolant | oil
  refTempK: doublePrecision('ref_temp_k').notNull(),
  refPressurePa: doublePrecision('ref_pressure_pa').notNull(),
  densityKgM3: doublePrecision('density_kg_m3').notNull(),
  cpJKgK: doublePrecision('cp_j_kg_k').notNull(),
  dynamicViscosityPaS: doublePrecision('dynamic_viscosity_pa_s').notNull(),
  thermalConductivityWmK: doublePrecision('thermal_conductivity_w_mk').notNull(),
  sourceId: integer('source_id')
    .references(() => sources.id)
    .notNull(),
  version: text('version').notNull(),
});

export const componentsCatalog = pgTable('components_catalog', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  moduleOwner: text('module_owner').notNull(),
});

export const componentPhenomena = pgTable('component_phenomena', {
  id: serial('id').primaryKey(),
  componentId: integer('component_id')
    .references(() => componentsCatalog.id, { onDelete: 'cascade' })
    .notNull(),
  phenomenonId: integer('phenomenon_id')
    .references(() => phenomena.id, { onDelete: 'cascade' })
    .notNull(),
  effectSign: text('effect_sign').notNull(), // positive | negative | conditional
  validityCondition: text('validity_condition').notNull(),
  mediator: text('mediator').notNull(),
  evidenceLevel: text('evidence_level').notNull(),
});

// ============================================================================
// M02 — FILOSOFIA DO VEÍCULO
// ============================================================================
export const vehiclePhilosophies = pgTable('vehicle_philosophies', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  prioritySummary: text('priority_summary').notNull(),
  tradeoffSummary: text('tradeoff_summary').notNull(),
  versionId: integer('version_id').references(() => modelVersions.id),
});

export const philosophyWeights = pgTable('philosophy_weights', {
  id: serial('id').primaryKey(),
  philosophyId: integer('philosophy_id')
    .references(() => vehiclePhilosophies.id, { onDelete: 'cascade' })
    .notNull(),
  objectiveMetric: text('objective_metric').notNull(),
  weightValue: doublePrecision('weight_value').notNull(),
  targetMin: doublePrecision('target_min').notNull(),
  targetMax: doublePrecision('target_max').notNull(),
  unitSi: text('unit_si').notNull(),
  justification: text('justification').notNull(),
  relationType: text('relation_type').notNull(), // direct | indirect | conditional | conflicting | synergistic
});

export const trackCharacteristics = pgTable('track_characteristics', {
  id: serial('id').primaryKey(),
  circuitCode: text('circuit_code').notNull().unique(),
  name: text('name').notNull(),
  country: text('country').notNull(),
  laps: integer('laps').notNull(),
  lapDistanceM: doublePrecision('lap_distance_m').notNull(),
  altitudeM: doublePrecision('altitude_m').notNull(),
  ambientTempK: doublePrecision('ambient_temp_k').notNull(),
  windSpeedMs: doublePrecision('wind_speed_ms').notNull(),
  highSpeedShare: doublePrecision('high_speed_share').notNull(),
  mediumSpeedShare: doublePrecision('medium_speed_share').notNull(),
  lowSpeedShare: doublePrecision('low_speed_share').notNull(),
  brakingSeverity: doublePrecision('braking_severity').notNull(),
  tractionDemand: doublePrecision('traction_demand').notNull(),
  surfaceRoughnessUm: doublePrecision('surface_roughness_um').notNull(),
  bumpinessIndex: doublePrecision('bumpiness_index').notNull(),
  kerbSeverity: doublePrecision('kerb_severity').notNull(),
});

export const philosophyTrackFits = pgTable('philosophy_track_fits', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  philosophyId: integer('philosophy_id')
    .references(() => vehiclePhilosophies.id)
    .notNull(),
  trackId: integer('track_id')
    .references(() => trackCharacteristics.id)
    .notNull(),
  objectiveScoreJ: doublePrecision('objective_score_j').notNull(),
  constraintPenalty: doublePrecision('constraint_penalty').notNull(),
  tradeoffsAcknowledged: boolean('tradeoffs_acknowledged').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// M03 — PACKAGING E ARQUITETURA DO VEÍCULO
// ============================================================================
export const vehicleArchitectures = pgTable('vehicle_architectures', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  editionId: integer('edition_id')
    .references(() => regulationEditions.id)
    .notNull(),
  wheelbaseM: doublePrecision('wheelbase_m').notNull(),
  frontTrackM: doublePrecision('front_track_m').notNull(),
  rearTrackM: doublePrecision('rear_track_m').notNull(),
  overallLengthM: doublePrecision('overall_length_m').notNull(),
  overallWidthM: doublePrecision('overall_width_m').notNull(),
  overallHeightM: doublePrecision('overall_height_m').notNull(),
  originDescription: text('origin_description').notNull(),
  xConvention: text('x_convention').notNull(),
  yConvention: text('y_convention').notNull(),
  zConvention: text('z_convention').notNull(),
  versionId: integer('version_id').references(() => modelVersions.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const componentPackages = pgTable('component_packages', {
  id: serial('id').primaryKey(),
  architectureId: integer('architecture_id')
    .references(() => vehicleArchitectures.id, { onDelete: 'cascade' })
    .notNull(),
  subsystem: text('subsystem').notNull(),
  componentName: text('component_name').notNull(),
  massKg: doublePrecision('mass_kg').notNull(),
  xCgM: doublePrecision('x_cg_m').notNull(),
  yCgM: doublePrecision('y_cg_m').notNull(),
  zCgM: doublePrecision('z_cg_m').notNull(),
  iZzSelfKgM2: doublePrecision('i_zz_self_kg_m2').notNull(),
  bboxHalfXM: doublePrecision('bbox_half_x_m').notNull(),
  bboxHalfYM: doublePrecision('bbox_half_y_m').notNull(),
  bboxHalfZM: doublePrecision('bbox_half_z_m').notNull(),
  maintenanceMinutes: integer('maintenance_minutes').notNull(),
  removalSequenceOrder: integer('removal_sequence_order').notNull(),
});

export const hardpoints = pgTable('hardpoints', {
  id: serial('id').primaryKey(),
  architectureId: integer('architecture_id')
    .references(() => vehicleArchitectures.id, { onDelete: 'cascade' })
    .notNull(),
  axle: text('axle').notNull(), // front | rear
  pointName: text('point_name').notNull(),
  xM: doublePrecision('x_m').notNull(),
  yM: doublePrecision('y_m').notNull(),
  zM: doublePrecision('z_m').notNull(),
  referenceFrame: text('reference_frame').notNull(),
});

export const interferenceChecks = pgTable('interference_checks', {
  id: serial('id').primaryKey(),
  architectureId: integer('architecture_id')
    .references(() => vehicleArchitectures.id, { onDelete: 'cascade' })
    .notNull(),
  componentAId: integer('component_a_id')
    .references(() => componentPackages.id, { onDelete: 'cascade' })
    .notNull(),
  componentBId: integer('component_b_id')
    .references(() => componentPackages.id, { onDelete: 'cascade' })
    .notNull(),
  hasCollision: boolean('has_collision').notNull(),
  minClearanceM: doublePrecision('min_clearance_m').notNull(),
  checkedAt: timestamp('checked_at').defaultNow().notNull(),
});

// ============================================================================
// M04 — AERODINÂMICA
// ============================================================================
export const aeroConfigurations = pgTable('aero_configurations', {
  id: serial('id').primaryKey(),
  architectureId: integer('architecture_id')
    .references(() => vehicleArchitectures.id, { onDelete: 'cascade' })
    .notNull(),
  floorLengthM: doublePrecision('floor_length_m').notNull(),
  floorWidthM: doublePrecision('floor_width_m').notNull(),
  staticFrontRhM: doublePrecision('static_front_rh_m').notNull(),
  staticRearRhM: doublePrecision('static_rear_rh_m').notNull(),
  diffuserAngleRad: doublePrecision('diffuser_angle_rad').notNull(),
  diffuserLengthM: doublePrecision('diffuser_length_m').notNull(),
  wingSpanM: doublePrecision('wing_span_m').notNull(),
  frontFlapCornerRad: doublePrecision('front_flap_corner_rad').notNull(),
  frontFlapStraightRad: doublePrecision('front_flap_straight_rad').notNull(),
  rearFlapCornerRad: doublePrecision('rear_flap_corner_rad').notNull(),
  rearFlapStraightRad: doublePrecision('rear_flap_straight_rad').notNull(),
  sidepodInletAreaM2: doublePrecision('sidepod_inlet_area_m2').notNull(),
  sidepodExitAreaM2: doublePrecision('sidepod_exit_area_m2').notNull(),
  versionId: integer('version_id').references(() => modelVersions.id),
});

export const aeroMaps = pgTable('aero_maps', {
  id: serial('id').primaryKey(),
  aeroConfigId: integer('aero_config_id')
    .references(() => aeroConfigurations.id, { onDelete: 'cascade' })
    .notNull(),
  mode: text('mode').notNull(), // MODE_Z | MODE_X
  speedMs: doublePrecision('speed_ms').notNull(),
  frontRhM: doublePrecision('front_rh_m').notNull(),
  rearRhM: doublePrecision('rear_rh_m').notNull(),
  pitchRad: doublePrecision('pitch_rad').notNull(),
  yawRad: doublePrecision('yaw_rad').notNull(),
  rollRad: doublePrecision('roll_rad').notNull(),
  clTotal: doublePrecision('cl_total').notNull(),
  cdTotal: doublePrecision('cd_total').notNull(),
  frontBalanceBf: doublePrecision('front_balance_bf').notNull(),
  dFzDhNPerM: doublePrecision('dfz_dh_n_per_m').notNull(),
  separationMargin: doublePrecision('separation_margin').notNull(),
  inValidDomain: boolean('in_valid_domain').notNull().default(true),
});

// ============================================================================
// M05 — DINÂMICA VEICULAR
// ============================================================================
export const dynamicsConfigurations = pgTable('dynamics_configurations', {
  id: serial('id').primaryKey(),
  architectureId: integer('architecture_id')
    .references(() => vehicleArchitectures.id, { onDelete: 'cascade' })
    .notNull(),
  sprungMassKg: doublePrecision('sprung_mass_kg').notNull(),
  unsprungFrontKg: doublePrecision('unsprung_front_kg').notNull(),
  unsprungRearKg: doublePrecision('unsprung_rear_kg').notNull(),
  frontSpringNPerM: doublePrecision('front_spring_n_per_m').notNull(),
  rearSpringNPerM: doublePrecision('rear_spring_n_per_m').notNull(),
  frontDamperNsPerM: doublePrecision('front_damper_ns_per_m').notNull(),
  rearDamperNsPerM: doublePrecision('rear_damper_ns_per_m').notNull(),
  frontArbNmPerRad: doublePrecision('front_arb_nm_per_rad').notNull(),
  rearArbNmPerRad: doublePrecision('rear_arb_nm_per_rad').notNull(),
  frontRollCenterHeightM: doublePrecision('front_roll_center_height_m').notNull(),
  rearRollCenterHeightM: doublePrecision('rear_roll_center_height_m').notNull(),
  antiDiveRatio: doublePrecision('anti_dive_ratio').notNull(),
  antiSquatRatio: doublePrecision('anti_squat_ratio').notNull(),
  brakeBiasFront: doublePrecision('brake_bias_front').notNull(),
  versionId: integer('version_id').references(() => modelVersions.id),
});

export const vehicleDynamicsRuns = pgTable('vehicle_dynamics_runs', {
  id: serial('id').primaryKey(),
  dynamicsConfigId: integer('dynamics_config_id')
    .references(() => dynamicsConfigurations.id, { onDelete: 'cascade' })
    .notNull(),
  speedMs: doublePrecision('speed_ms').notNull(),
  steerAngleRad: doublePrecision('steer_angle_rad').notNull(),
  longAccelMs2: doublePrecision('long_accel_ms2').notNull(),
  latAccelMs2: doublePrecision('lat_accel_ms2').notNull(),
  dynFrontRhM: doublePrecision('dyn_front_rh_m').notNull(),
  dynRearRhM: doublePrecision('dyn_rear_rh_m').notNull(),
  pitchRad: doublePrecision('pitch_rad').notNull(),
  rollRad: doublePrecision('roll_rad').notNull(),
  yawRateRadS: doublePrecision('yaw_rate_rad_s').notNull(),
  elasticTransferFrontN: doublePrecision('elastic_transfer_front_n').notNull(),
  geometricTransferFrontN: doublePrecision('geometric_transfer_front_n').notNull(),
  converged: boolean('converged').notNull(),
  iterations: integer('iterations').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// M06 — PNEUS
// ============================================================================
export const tireCompounds = pgTable('tire_compounds', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  compoundType: text('compound_type').notNull(), // soft | medium | hard | inter | wet
  nominalLoadN: doublePrecision('nominal_load_n').notNull(),
  loadSensitivityExpN: doublePrecision('load_sensitivity_exp_n').notNull(),
  magicB: doublePrecision('magic_b').notNull(),
  magicC: doublePrecision('magic_c').notNull(),
  magicD: doublePrecision('magic_d').notNull(),
  magicE: doublePrecision('magic_e').notNull(),
  relaxationLengthM: doublePrecision('relaxation_length_m').notNull(),
  thermalCapJK: doublePrecision('thermal_cap_j_k').notNull(),
  optimalTempK: doublePrecision('optimal_temp_k').notNull(),
  nominalPressurePa: doublePrecision('nominal_pressure_pa').notNull(),
  infoClass: text('info_class').notNull(),
  versionId: integer('version_id').references(() => modelVersions.id),
});

export const tireSimulationResults = pgTable('tire_simulation_results', {
  id: serial('id').primaryKey(),
  compoundId: integer('compound_id')
    .references(() => tireCompounds.id, { onDelete: 'cascade' })
    .notNull(),
  verticalLoadN: doublePrecision('vertical_load_n').notNull(),
  slipAngleRad: doublePrecision('slip_angle_rad').notNull(),
  slipRatio: doublePrecision('slip_ratio').notNull(),
  camberRad: doublePrecision('camber_rad').notNull(),
  tempTreadK: doublePrecision('temp_tread_k').notNull(),
  tempCarcassK: doublePrecision('temp_carcass_k').notNull(),
  pressureAbsPa: doublePrecision('pressure_abs_pa').notNull(),
  fxN: doublePrecision('fx_n').notNull(),
  fyN: doublePrecision('fy_n').notNull(),
  mzNm: doublePrecision('mz_nm').notNull(),
  wearRatio: doublePrecision('wear_ratio').notNull(),
  thermalDegRatio: doublePrecision('thermal_deg_ratio').notNull(),
  grainingIndex: doublePrecision('graining_index').notNull(),
  blisteringIndex: doublePrecision('blistering_index').notNull(),
  hydroplaneRatio: doublePrecision('hydroplane_ratio').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// M07 — ESTRUTURAS
// ============================================================================
export const laminateStacks = pgTable('laminate_stacks', {
  id: serial('id').primaryKey(),
  architectureId: integer('architecture_id')
    .references(() => vehicleArchitectures.id, { onDelete: 'cascade' })
    .notNull(),
  materialId: integer('material_id')
    .references(() => materials.id)
    .notNull(),
  ply0Fraction: doublePrecision('ply_0_fraction').notNull(),
  ply45Fraction: doublePrecision('ply_45_fraction').notNull(),
  ply90Fraction: doublePrecision('ply_90_fraction').notNull(),
  totalThicknessM: doublePrecision('total_thickness_m').notNull(),
  localReinforcementRatio: doublePrecision('local_reinforcement_ratio').notNull(),
  a11: doublePrecision('a11').notNull(),
  a22: doublePrecision('a22').notNull(),
  a66: doublePrecision('a66').notNull(),
  d11: doublePrecision('d11').notNull(),
  d22: doublePrecision('d22').notNull(),
  d66: doublePrecision('d66').notNull(),
  torsionalStiffnessNmRad: doublePrecision('torsional_stiffness_nm_rad').notNull(),
  flexuralStiffnessNm: doublePrecision('flexural_stiffness_nm').notNull(),
  versionId: integer('version_id').references(() => modelVersions.id),
});

export const structuralLoadCases = pgTable('structural_load_cases', {
  id: serial('id').primaryKey(),
  stackId: integer('stack_id')
    .references(() => laminateStacks.id, { onDelete: 'cascade' })
    .notNull(),
  caseName: text('case_name').notNull(),
  caseType: text('case_type').notNull(), // usage | peak | fatigue | impact | combined
  axialLoadN: doublePrecision('axial_load_n').notNull(),
  shearLoadN: doublePrecision('shear_load_n').notNull(),
  bendingMomentNm: doublePrecision('bending_moment_nm').notNull(),
  torsionMomentNm: doublePrecision('torsion_moment_nm').notNull(),
  tsaiWuIndex: doublePrecision('tsai_wu_index').notNull(),
  bucklingFactor: doublePrecision('buckling_factor').notNull(),
  fatigueCyclesLife: doublePrecision('fatigue_cycles_life').notNull(),
  impactMarginRatio: doublePrecision('impact_margin_ratio').notNull(),
  passed: boolean('passed').notNull(),
});

// ============================================================================
// M08 — UNIDADE DE POTÊNCIA
// ============================================================================
export const powerUnitConfigs = pgTable('power_unit_configs', {
  id: serial('id').primaryKey(),
  architectureId: integer('architecture_id')
    .references(() => vehicleArchitectures.id, { onDelete: 'cascade' })
    .notNull(),
  iceMaterialId: integer('ice_material_id')
    .references(() => materials.id)
    .notNull(),
  compressionRatio: doublePrecision('compression_ratio').notNull(),
  turboDiameterM: doublePrecision('turbo_diameter_m').notNull(),
  turboInertiaKgM2: doublePrecision('turbo_inertia_kg_m2').notNull(),
  mgukMaxW: doublePrecision('mguk_max_w').notNull(),
  batteryCapacityJ: doublePrecision('battery_capacity_j').notNull(),
  batteryNominalV: doublePrecision('battery_nominal_v').notNull(),
  batteryBaseResistanceOhm: doublePrecision('battery_base_resistance_ohm').notNull(),
  ersDeployRatio: doublePrecision('ers_deploy_ratio').notNull(),
  versionId: integer('version_id').references(() => modelVersions.id),
});

export const powerUnitSimulations = pgTable('power_unit_simulations', {
  id: serial('id').primaryKey(),
  puConfigId: integer('pu_config_id')
    .references(() => powerUnitConfigs.id, { onDelete: 'cascade' })
    .notNull(),
  rpm: doublePrecision('rpm').notNull(),
  throttleRatio: doublePrecision('throttle_ratio').notNull(),
  boostPressureRatio: doublePrecision('boost_pressure_ratio').notNull(),
  icePowerW: doublePrecision('ice_power_w').notNull(),
  mgukPowerW: doublePrecision('mguk_power_w').notNull(),
  busCurrentA: doublePrecision('bus_current_a').notNull(),
  jouleLossW: doublePrecision('joule_loss_w').notNull(),
  heatGeneratedW: doublePrecision('heat_generated_w').notNull(),
  heatRejectedW: doublePrecision('heat_rejected_w').notNull(),
  iceTempK: doublePrecision('ice_temp_k').notNull(),
  batteryTempK: doublePrecision('battery_temp_k').notNull(),
  socRatio: doublePrecision('soc_ratio').notNull(),
  energyInitialJ: doublePrecision('energy_initial_j').notNull(),
  energyRecoveredJ: doublePrecision('energy_recovered_j').notNull(),
  energySuppliedJ: doublePrecision('energy_supplied_j').notNull(),
  energyLostJ: doublePrecision('energy_lost_j').notNull(),
  energyFinalJ: doublePrecision('energy_final_j').notNull(),
  balanceResidualJ: doublePrecision('balance_residual_j').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// M09 — TRANSMISSÃO
// ============================================================================
export const transmissionConfigs = pgTable('transmission_configs', {
  id: serial('id').primaryKey(),
  architectureId: integer('architecture_id')
    .references(() => vehicleArchitectures.id, { onDelete: 'cascade' })
    .notNull(),
  gearboxMaterialId: integer('gearbox_material_id')
    .references(() => materials.id)
    .notNull(),
  numGears: integer('num_gears').notNull().default(8),
  finalDriveRatio: doublePrecision('final_drive_ratio').notNull(),
  gearRatiosJson: jsonb('gear_ratios_json').notNull(), // explicit Z1/Z2 ratios
  toothWidthM: doublePrecision('tooth_width_m').notNull(),
  shaftOuterDiamM: doublePrecision('shaft_outer_diam_m').notNull(),
  shaftInnerDiamM: doublePrecision('shaft_inner_diam_m').notNull(),
  clutchPlates: integer('clutch_plates').notNull(),
  clutchFrictionMu: doublePrecision('clutch_friction_mu').notNull(),
  clutchClampForceN: doublePrecision('clutch_clamp_force_n').notNull(),
  clutchMeanRadiusM: doublePrecision('clutch_mean_radius_m').notNull(),
  diffLockRatio: doublePrecision('diff_lock_ratio').notNull(),
  oilCoolingCapacityW: doublePrecision('oil_cooling_capacity_w').notNull(),
  versionId: integer('version_id').references(() => modelVersions.id),
});

export const transmissionSimulations = pgTable('transmission_simulations', {
  id: serial('id').primaryKey(),
  transConfigId: integer('trans_config_id')
    .references(() => transmissionConfigs.id, { onDelete: 'cascade' })
    .notNull(),
  selectedGear: integer('selected_gear').notNull(),
  inputTorqueNm: doublePrecision('input_torque_nm').notNull(),
  inputOmegaRadS: doublePrecision('input_omega_rad_s').notNull(),
  wheelForceFxN: doublePrecision('wheel_force_fx_n').notNull(),
  shaftShearStressPa: doublePrecision('shaft_shear_stress_pa').notNull(),
  clutchSlipPowerW: doublePrecision('clutch_slip_power_w').notNull(),
  efficiencyRatio: doublePrecision('efficiency_ratio').notNull(),
  oilTempK: doublePrecision('oil_temp_k').notNull(),
  fatigueLifeRaces: integer('fatigue_life_races').notNull(),
  passed: boolean('passed').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// M10 — SIMULAÇÃO MULTIDISCIPLINAR
// ============================================================================
export const simulationCampaigns = pgTable('simulation_campaigns', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  architectureId: integer('architecture_id')
    .references(() => vehicleArchitectures.id)
    .notNull(),
  fidelityLevel: text('fidelity_level').notNull(), // L0 | L1 | L2 | L3
  couplingMode: text('coupling_mode').notNull(), // weak | strong
  convergenceTol: doublePrecision('convergence_tol').notNull(),
  maxIterations: integer('max_iterations').notNull(),
  converged: boolean('converged').notNull(),
  iterationsUsed: integer('iterations_used').notNull(),
  finalResidual: doublePrecision('final_residual').notNull(),
  lapTimeEstS: doublePrecision('lap_time_est_s').notNull(),
  paretoSolutionsJson: jsonb('pareto_solutions_json').notNull(),
  sensitivityJson: jsonb('sensitivity_json').notNull(),
  gateStatusJson: jsonb('gate_status_json').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// M11 — SIMULAÇÃO DE CORRIDA
// ============================================================================
export const circuitSegments = pgTable('circuit_segments', {
  id: serial('id').primaryKey(),
  trackId: integer('track_id')
    .references(() => trackCharacteristics.id, { onDelete: 'cascade' })
    .notNull(),
  segmentIndex: integer('segment_index').notNull(),
  segmentName: text('segment_name').notNull(),
  lengthM: doublePrecision('length_m').notNull(),
  curvatureInvM: doublePrecision('curvature_inv_m').notNull(), // 1/R (0 = straight)
  slopeRad: doublePrecision('slope_rad').notNull(),
  elevationM: doublePrecision('elevation_m').notNull(),
  surfaceGripFactor: doublePrecision('surface_grip_factor').notNull(),
  aeroModeAllowed: text('aero_mode_allowed').notNull(), // MODE_X | MODE_Z
  overtakeOpportunity: doublePrecision('overtake_opportunity').notNull(),
});

export const raceSimulationRuns = pgTable('race_simulation_runs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  trackId: integer('track_id')
    .references(() => trackCharacteristics.id)
    .notNull(),
  fidelityMode: text('fidelity_mode').notNull(), // strategic | dynamic | advanced
  weatherCondition: text('weather_condition').notNull(),
  totalLaps: integer('total_laps').notNull(),
  initialMassKg: doublePrecision('initial_mass_kg').notNull(),
  finalMassKg: doublePrecision('final_mass_kg').notNull(),
  fuelConsumedKg: doublePrecision('fuel_consumed_kg').notNull(),
  energyBalanceResidualJ: doublePrecision('energy_balance_residual_j').notNull(),
  expectedTimeS: doublePrecision('expected_time_s').notNull(),
  strategySummaryJson: jsonb('strategy_summary_json').notNull(),
  lapTelemetryJson: jsonb('lap_telemetry_json').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// M12 — CALIBRAÇÃO, VERIFICAÇÃO, VALIDAÇÃO E UQ
// ============================================================================
export const calibrationCampaigns = pgTable('calibration_campaigns', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  moduleCode: text('module_code').notNull(),
  method: text('method').notNull(), // manual | least_squares | levenberg_marquardt | nelder_mead | genetic | bayesian
  targetVersionId: integer('target_version_id').references(() => modelVersions.id),
  identifiabilityRank: integer('identifiability_rank').notNull(),
  conditionNumber: doublePrecision('condition_number').notNull(),
  rmse: doublePrecision('rmse').notNull(),
  mae: doublePrecision('mae').notNull(),
  uqP05: doublePrecision('uq_p05').notNull(),
  uqP50: doublePrecision('uq_p50').notNull(),
  uqP95: doublePrecision('uq_p95').notNull(),
  monteCarloSamples: integer('monte_carlo_samples').notNull(),
  validationPassed: boolean('validation_passed').notNull(),
  approvalStatus: text('approval_status').notNull(), // Draft | Verified | Calibrated | Validated | Approved | Deprecated | Rejected
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// DRIZZLE RELATIONS
// ============================================================================
export const usersRelations = relations(users, ({ many }) => ({
  careerSnapshots: many(careerSnapshots),
  architectures: many(vehicleArchitectures),
  simulationCampaigns: many(simulationCampaigns),
  raceSimulationRuns: many(raceSimulationRuns),
  calibrationCampaigns: many(calibrationCampaigns),
}));

export const careerSnapshotsRelations = relations(careerSnapshots, ({ one }) => ({
  user: one(users, {
    fields: [careerSnapshots.userId],
    references: [users.id],
  }),
}));

export const regulationEditionsRelations = relations(regulationEditions, ({ many }) => ({
  limits: many(regulationLimits),
}));

export const regulationLimitsRelations = relations(regulationLimits, ({ one }) => ({
  edition: one(regulationEditions, {
    fields: [regulationLimits.editionId],
    references: [regulationEditions.id],
  }),
}));

export const vehicleArchitecturesRelations = relations(vehicleArchitectures, ({ one, many }) => ({
  user: one(users, {
    fields: [vehicleArchitectures.userId],
    references: [users.id],
  }),
  edition: one(regulationEditions, {
    fields: [vehicleArchitectures.editionId],
    references: [regulationEditions.id],
  }),
  packages: many(componentPackages),
  hardpoints: many(hardpoints),
}));
