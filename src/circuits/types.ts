import type { TrackCharacteristicsSi } from '../engine/modules/m02Philosophy.ts';
import type { AeroMode2026 } from '../engine/modules/m04Aerodynamics.ts';
import type { CircuitSegmentSpec } from '../engine/modules/m11RaceSimulation.ts';

export type DataConfidenceLevel =
  | 'referencia_inicial'
  | 'validado'
  | 'estimado'
  | 'simulado';

export type CircuitCertificationStatus =
  | 'initial_geometry_reference'
  | 'fia_certified'
  | 'community_historical';

export interface ProvenanceRecord {
  geometrySource: string;
  geometryRepoUrl: string;
  geojsonId: string;
  metadataSources: string[];
  confidence: DataConfidenceLevel;
  certificationStatus: CircuitCertificationStatus;
  notes: string;
}

export type TrackSurfaceType =
  | 'permanent_race_asphalt'
  | 'high_grip_resurfaced'
  | 'street_low_grip_asphalt'
  | 'abrasive_granite_asphalt';

export type RunoffType = 'gravel' | 'asphalt_tarmac' | 'concrete_wall' | 'grass_hybrid';

export interface TrackGeometryPoint {
  index: number;
  lon: number;
  lat: number;
  xM: number;
  yM: number;
  svgX: number;
  svgY: number;
  distanceFromStartM: number;
  normalizedProgress: number; // 0..1
  elevationM: number;
  slopeRad: number;
  widthM: number;
  bankingDeg: number;
  signedCurvatureInvM: number; // + left, - right
  curvatureRadiusM: number;
  surfaceGripFactor: number;
  hasKerbLeft: boolean;
  hasKerbRight: boolean;
  runoffLeftM: number;
  runoffRightM: number;
  sector: 1 | 2 | 3;
  aeroModeZone: AeroMode2026;
}

export interface DetectedCorner {
  cornerNumber: number;
  name: string;
  startDistM: number;
  apexDistM: number;
  endDistM: number;
  apexProgress: number;
  svgX: number;
  svgY: number;
  direction: 'left' | 'right' | 'chicane';
  minRadiusM: number;
  maxCurvatureInvM: number;
  speedBand: 'slow' | 'medium' | 'fast';
  targetSpeedKmh: number;
  isChicane: boolean;
  kerbSeverity: number; // 0..1
  runoffType: RunoffType;
}

export interface StraightZone {
  straightIndex: number;
  name: string;
  startDistM: number;
  endDistM: number;
  lengthM: number;
  startProgress: number;
  endProgress: number;
  isModeXActive: boolean;
  estimatedPeakSpeedKmh: number;
}

export interface PitBoxMarker {
  boxIndex: number;
  svgX: number;
  svgY: number;
  label: string;
}

export interface PitLaneGeometry {
  entryProgress: number;
  exitProgress: number;
  lengthM: number;
  pitLossSec: number;
  speedLimitKmh: number;
  svgPath: string;
  pitBoxes: PitBoxMarker[];
}

export interface CircuitSectorSummary {
  sector: 1 | 2 | 3;
  startProgress: number;
  endProgress: number;
  lengthM: number;
  svgPath: string;
  avgCurvatureInvM: number;
  elevationDeltaM: number;
}

export interface CircuitValidationReport {
  circuitCode: string;
  seasonYear: number;
  valid: boolean;
  certificationStatus: CircuitCertificationStatus;
  pointCount: number;
  isClosedLoop: boolean;
  calculatedLengthM: number;
  officialLengthM: number;
  lengthDeltaM: number;
  lengthDeltaPct: number;
  officialRaceDistanceKm: number;
  calculatedRaceDistanceKm: number;
  detectedCornerCount: number;
  officialCornerCount: number;
  hasFiniteGeometry: boolean;
  warnings: string[];
  errors: string[];
}

export interface SeasonCircuitMetadata {
  circuitCode: string;
  geojsonId: string;
  seasonYear: number;
  round: number; // 0 for historical/reserve off-calendar
  inCalendar: boolean;
  isSprint: boolean;
  gpDateIso: string;
  name: string;
  officialGpTitle: string;
  country: string;
  city: string;
  laps: number;
  officialLengthM: number;
  officialCorners: number;
  officialRaceDistanceKm: number;
  baseLapTimeSec: number;
  pitLaneLossSec: number;
  pitSpeedLimitKmh: number;
  overtakeDifficulty: 1 | 2 | 3 | 4 | 5;
  aeroDemand: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  tireWearSeverity: 1 | 2 | 3 | 4 | 5;
  surfaceType: TrackSurfaceType;
  surfaceRoughnessUm: number;
  baseGripFactor: number;
  ambientTempK: number;
  windSpeedMs: number;
  elevationMinM: number;
  elevationMaxM: number;
  maxBankingDeg: number;
  trackWidthMinM: number;
  trackWidthMaxM: number;
  dominantRunoff: RunoffType;
  description: string;
  provenance: ProvenanceRecord;
  cornerNameOverrides?: Record<number, string>;
  versionTag: string;
}

export interface ProcessedCircuitPackage {
  metadata: SeasonCircuitMetadata;
  points: TrackGeometryPoint[];
  svgViewBox: string;
  svgCenterlinePath: string;
  svgStartFinishLine: { x1: number; y1: number; x2: number; y2: number };
  sectors: [CircuitSectorSummary, CircuitSectorSummary, CircuitSectorSummary];
  modeXSvgPaths: string[];
  corners: DetectedCorner[];
  straights: StraightZone[];
  pitLane: PitLaneGeometry;
  trackCharacteristics: TrackCharacteristicsSi;
  segments: CircuitSegmentSpec[];
  validation: CircuitValidationReport;
}
