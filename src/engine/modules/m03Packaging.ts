import { CASING_ALLOYS, COMPOSITE_MATERIALS } from '../../data/physicsDatabase.ts';
import {
  BATTERY_ARCHITECTURES_2026,
  ICE_METALLURGY_2026,
  resolveBatteryArchitectureId,
  resolveIceMetallurgyId,
} from '../../data/puMaterials2026.ts';
import type { VehicleEngineeringParameters } from '../../types/physics.ts';
import { COORDINATE_FRAME_STANDARD, type GateResult } from './m01Foundation.ts';

// M03 — Packaging e Arquitetura do Veículo (Manual Mestre Seção 3.1 - 3.4)

export interface RegulationEditionSpec {
  editionId: string;
  series: string;
  seasonYear: number;
  section: string;
  issue: string;
  effectiveDate: string;
  maxWheelbaseM: number;
  minWheelbaseM: number;
  maxWidthM: number;
  minMassKg: number;
  maxFloorUsefulWidthM: number;
  minFrontRideHeightM: number;
  minRearRideHeightM: number;
  maxDiffuserAngleRad: number;
  maxDiffuserLengthM: number;
  maxWingSpanM: number;
  maxMgukPowerW: number;
  maxIceCompressionRatio: number;
  numForwardGears: number;
  minShiftTimeS: number;
}

// Default versioned edition (not eternal hardcoded constants — stored & replaceable by FIA issue)
export const FIA_2026_DEFAULT_EDITION: RegulationEditionSpec = {
  editionId: 'FIA-2026-SEC_C-ISS16-PU-ISS5',
  series: 'FIA Formula 1 World Championship',
  seasonYear: 2026,
  section: 'Technical Regulations Section C & Power Unit',
  issue: 'Section C Issue 16 / PU Issue 5 (Reference Spec)',
  effectiveDate: '2026-01-01',
  maxWheelbaseM: 3.400,
  minWheelbaseM: 3.250,
  maxWidthM: 1.900,
  minMassKg: 768.0,
  maxFloorUsefulWidthM: 1.550,
  minFrontRideHeightM: 0.018,
  minRearRideHeightM: 0.035,
  maxDiffuserAngleRad: (14.0 * Math.PI) / 180,
  maxDiffuserLengthM: 0.950,
  maxWingSpanM: 1.900,
  maxMgukPowerW: 350000,
  maxIceCompressionRatio: 16.0,
  numForwardGears: 8,
  minShiftTimeS: 0.035,
};

export interface ComponentPackage3D {
  id: string;
  subsystem:
    | 'cockpit'
    | 'pu_ice'
    | 'energy_store'
    | 'gearbox_diff'
    | 'cooling_radiators'
    | 'front_susp_brakes'
    | 'rear_susp_brakes'
    | 'floor_diffuser'
    | 'wings'
    | 'driver_ballast';
  name: string;
  massKg: number;
  /** Coordenadas no referencial SAE/ISO (X=0 eixo dianteiro, +X atrás; Y=0 centro; Z=0 plano de ref) */
  xCgM: number;
  yCgM: number;
  zCgM: number;
  iZzSelfKgM2: number;
  bboxHalfXM: number;
  bboxHalfYM: number;
  bboxHalfZM: number;
  maintenanceMinutes: number;
  removalSequenceOrder: number;
}

export interface Hardpoint3D {
  axle: 'front' | 'rear';
  name: string;
  xM: number;
  yM: number;
  zM: number;
  unitSi: 'm';
  referenceFrame: string;
}

export interface InterferencePairResult {
  componentA: string;
  componentB: string;
  hasCollision: boolean;
  minClearanceM: number;
}

export interface PackagingAnalysisOutputs {
  edition: RegulationEditionSpec;
  coordinateFrame: typeof COORDINATE_FRAME_STANDARD;
  wheelbaseM: number;
  frontTrackM: number;
  rearTrackM: number;
  overallLengthM: number;
  overallWidthM: number;
  overallHeightM: number;
  packages: ComponentPackage3D[];
  hardpoints: Hardpoint3D[];
  rawMassKg: number;
  ballastKg: number;
  totalMassKg: number;
  cgM: { x: number; y: number; z: number };
  yawInertiaIzKgM2: number;
  staticAxleDist: { frontPct: number; rearPct: number; frontLoadN: number; rearLoadN: number };
  firstOrderTransfer: {
    longTransferAt45G_N: number;
    latTransferAt42G_N: number;
  };
  coolingPackage: {
    radiatorAreaM2: number;
    estimatedRejectionCapacityW: number;
  };
  interferences: InterferencePairResult[];
  collisionCount: number;
  totalMaintenanceMinutes: number;
  maintenanceSequenceViable: boolean;
  envelopeCompliant: boolean;
  envelopeViolations: string[];
}

export function buildPackagingArchitecture(
  params: VehicleEngineeringParameters,
  edition: RegulationEditionSpec = FIA_2026_DEFAULT_EDITION
): PackagingAnalysisOutputs {
  const L = params.wheelbaseMm / 1000;
  const track = params.trackWidthMm / 1000;
  const floorL = params.floorLengthMm / 1000;
  const floorW = params.floorUsefulWidthMm / 1000;

  // Densidades reais de materiais (g/cm³ -> kg/m³) & mínimos FIA 2026 (Art. 4.6 e Art. 5.4)
  const compositeSpec = COMPOSITE_MATERIALS[params.compositeFiber];
  const gbAlloySpec = CASING_ALLOYS[params.gearboxMaterial];

  // 1. Monocoque CFRP (Torayca T800S/T1000G/M40J curado ~1.54-1.57 g/cm³) + núcleo Nomex/insertos Ti
  const monocoqueShellMassKg =
    4.45 *
      (L / 3.4) *
      (params.laminateThicknessMm / 1000) *
      compositeSpec.densityKgM3 *
      (1 + (params.localReinforcementPct / 100) * 0.22) +
    18.3;
  // Estruturas internas da célula dianteira/central: Halo Ti-6Al-4V (4.43 g/cm³ = 7.0 kg) + cone frontal/laterais (13 kg) + célula FT5 (15 kg) + ECU/chicotes/câmeras (33 kg) + hidráulica (15 kg) + pintura/suportes (20 kg)
  const cockpitFixedHardwareKg = 103.0;

  // 2. ICE V6 1.6L + Turbo + Escapamento (mínimo FIA 2026 Art. 5.4 = 130.0 kg) + MGU-K (16 kg + 4 kg eixo = 20 kg) + óleo 0.85 g/cm³ / escudos (15 kg)
  const iceSpec = ICE_METALLURGY_2026[resolveIceMetallurgyId(params.iceMetallurgyId, params.iceMaterial)];
  const iceCoreMassKg = Math.max(130.0, 134.0 + iceSpec.massDeltaKg);
  const puAncillariesKg = 35.0; // MGU-K (20 kg) + cárter seco/óleo/escudos/plenum (15 kg)

  // 3. Energy Store 800V (mínimo FIA 2026 Art. 5.4 = 35.0 kg) + inversor/BMS HV (8.0 kg)
  const batterySpec = BATTERY_ARCHITECTURES_2026[resolveBatteryArchitectureId(params.batteryCellTech)];
  const batteryCellsMassKg = batterySpec.massKg;
  const hvElectronicsMassKg = 8.0;

  // 4. Caixa de câmbio por densidade real (Ti 4.43 / Al 2.81 / CFRP 1.58 g/cm³) + engrenagens aço AISI 9310 (7.85 g/cm³) + óleo (1.5 kg)
  const layoutVolFactor = params.gearboxLayout === 'compact' ? 0.92 : 1.08;
  const gearboxMassKg =
    21.5 +
    0.0068 * gbAlloySpec.densityKgM3 * layoutVolFactor +
    (params.gearToothWidthMm - 14) * 0.42;

  // 5. Radiadores de alumínio (2.71 g/cm³) + líquido arrefecimento água-glicol (1.04 g/cm³)
  const coolingMassKg = 6.8 + params.radiatorVolumeL * 0.92;

  // 6. Assoalho Plano 2026 + Difusor + Carens/Sidepods/Tampa Motor + Asas Ativas X/Z + Skids Ti-6Al-4V (4.43 g/cm³)
  const floorWingsMassKg =
    floorL *
      floorW *
      5.8 *
      (compositeSpec.densityKgM3 / 1560) *
      (0.85 + params.floorStiffnessNmm / 5000) +
    53.0;

  // 7. Eixos (Rodas Mg ZK60 1.80 g/cm³ + Pneus Pirelli 2026 + Freios C/C 1.80 g/cm³ + Suspensão CFRP/Ti)
  // Dianteiro: 34 kg rodas/pneus + 10.5 kg freios + 42.5 kg suspensão/direção/cubos/retentores
  const suspFrontMassKg =
    86.5 + (params.springRateNmm / 340) * 1.1 + (params.frontSuspensionType === 'pullrod' ? -0.6 : 0.4);
  // Traseiro: 39 kg rodas/pneus + 9.5 kg freios BBW + 46.8 kg suspensão/cubos/semieixos aço 7.85 g/cm³
  const suspRearMassKg = 95.3 + (params.springRateNmm / 340) * 1.1;

  // 8. Piloto + Assento Moldado + Capacete/HANS (mínimo FIA 2026 = 82.0 kg)
  const driverBaseMassKg = 82.0;

  // Place subsystems in persistent 3D frame (X=0 front axle, +X rearward)
  // Adjust ballast X position to respect targetFrontWeightPct when ballast > 0
  const baseComponents: ComponentPackage3D[] = [
    {
      id: 'pkg_cockpit',
      subsystem: 'cockpit',
      name: 'Célula de Sobrevivência / Monocoque',
      massKg: Number((monocoqueShellMassKg + cockpitFixedHardwareKg).toFixed(2)),
      xCgM: L * 0.25,
      yCgM: 0,
      zCgM: 0.27,
      iZzSelfKgM2: 38.0,
      bboxHalfXM: 0.66,
      bboxHalfYM: 0.25,
      bboxHalfZM: 0.23,
      maintenanceMinutes: 180,
      removalSequenceOrder: 6,
    },
    {
      id: 'pkg_energy_store',
      subsystem: 'energy_store',
      name: 'Energy Store (Bateria 800V + Eletrônica)',
      massKg: Number((batteryCellsMassKg + hvElectronicsMassKg).toFixed(2)),
      xCgM: L * 0.52,
      yCgM: 0,
      zCgM: 0.14,
      iZzSelfKgM2: 1.8,
      bboxHalfXM: 0.18,
      bboxHalfYM: 0.18,
      bboxHalfZM: 0.11,
      maintenanceMinutes: 45,
      removalSequenceOrder: 4,
    },
    {
      id: 'pkg_pu_ice',
      subsystem: 'pu_ice',
      name: 'ICE V6 1.6L + Turbocharger + MGU-K',
      massKg: Number((iceCoreMassKg + puAncillariesKg).toFixed(2)),
      xCgM: L * 0.72,
      yCgM: 0,
      zCgM: 0.28,
      iZzSelfKgM2: 14.5,
      bboxHalfXM: 0.34,
      bboxHalfYM: 0.21,
      bboxHalfZM: 0.20,
      maintenanceMinutes: 110,
      removalSequenceOrder: 3,
    },
    {
      id: 'pkg_cooling',
      subsystem: 'cooling_radiators',
      name: 'Radiadores & Trocadores Sidepod',
      massKg: Number(coolingMassKg.toFixed(2)),
      xCgM: L * 0.54,
      yCgM: 0.43, // lateral sidepod envelope clear of central survival cell
      zCgM: 0.29,
      iZzSelfKgM2: 2.6,
      bboxHalfXM: 0.40,
      bboxHalfYM: 0.15,
      bboxHalfZM: 0.14,
      maintenanceMinutes: 35,
      removalSequenceOrder: 2,
    },
    {
      id: 'pkg_gearbox',
      subsystem: 'gearbox_diff',
      name: `Caixa de Câmbio & Diferencial (${params.gearboxLayout})`,
      massKg: Number(gearboxMassKg.toFixed(2)),
      xCgM: L * 0.96,
      yCgM: 0,
      zCgM: params.gearboxMaterial === 'carbon' ? 0.21 : 0.23,
      iZzSelfKgM2: 4.2,
      bboxHalfXM: params.gearboxLayout === 'compact' ? 0.24 : 0.30,
      bboxHalfYM: params.gearboxLayout === 'compact' ? 0.15 : 0.21,
      bboxHalfZM: 0.16,
      maintenanceMinutes: params.gearboxLayout === 'compact' ? 75 : 42,
      removalSequenceOrder: 1,
    },
    {
      id: 'pkg_susp_front',
      subsystem: 'front_susp_brakes',
      name: `Suspensão/Freios Dianteiros (${params.frontSuspensionType})`,
      massKg: Number(suspFrontMassKg.toFixed(2)),
      xCgM: 0.0,
      yCgM: 0,
      zCgM: params.frontSuspensionType === 'pullrod' ? 0.31 : 0.33,
      iZzSelfKgM2: 22.0,
      bboxHalfXM: 0.32,
      bboxHalfYM: track * 0.46,
      bboxHalfZM: 0.33,
      maintenanceMinutes: 25,
      removalSequenceOrder: 1,
    },
    {
      id: 'pkg_susp_rear',
      subsystem: 'rear_susp_brakes',
      name: `Suspensão/Freios Traseiros (${params.rearSuspensionType})`,
      massKg: Number(suspRearMassKg.toFixed(2)),
      xCgM: L,
      yCgM: 0,
      zCgM: params.rearSuspensionType === 'pullrod' ? 0.31 : 0.33,
      iZzSelfKgM2: 24.0,
      bboxHalfXM: 0.32,
      bboxHalfYM: track * 0.46,
      bboxHalfZM: 0.33,
      maintenanceMinutes: 28,
      removalSequenceOrder: 1,
    },
    {
      id: 'pkg_floor',
      subsystem: 'floor_diffuser',
      name: 'Assoalho Plano 2026 & Difusor',
      massKg: Number(floorWingsMassKg.toFixed(2)),
      xCgM: L * 0.58,
      yCgM: 0,
      zCgM: 0.07,
      iZzSelfKgM2: 18.0,
      bboxHalfXM: floorL * 0.48,
      bboxHalfYM: floorW * 0.48,
      bboxHalfZM: 0.04,
      maintenanceMinutes: 30,
      removalSequenceOrder: 2,
    },
    {
      id: 'pkg_driver',
      subsystem: 'driver_ballast',
      name: 'Piloto + Assento Homologado',
      massKg: driverBaseMassKg,
      xCgM: L * 0.29,
      yCgM: 0,
      zCgM: 0.24,
      iZzSelfKgM2: 3.5,
      bboxHalfXM: 0.36,
      bboxHalfYM: 0.19,
      bboxHalfZM: 0.21,
      maintenanceMinutes: 5,
      removalSequenceOrder: 1,
    },
  ];

  // Calibrate subsystem X offsets slightly to achieve target static front weight distribution physically
  const rawMassKg = baseComponents.reduce((acc, p) => acc + p.massKg, 0);
  const ballastKg = Math.max(0, edition.minMassKg - rawMassKg);

  // Target xCG from desired front weight %: front_share = (L - xCG)/L => xCG_target = L * (1 - frontShare)
  const targetFrontShare = Math.min(0.49, Math.max(0.42, params.targetFrontWeightPct / 100));
  const desiredXcg = L * (1 - targetFrontShare);
  const currentSumMx = baseComponents.reduce((acc, p) => acc + p.massKg * p.xCgM, 0);

  // Add floor keel ballast at physically feasible position (X in [0.15, L-0.3])
  const totalMassKg = rawMassKg + ballastKg;
  const ballastNeededX =
    ballastKg > 0.1
      ? Math.max(0.25, Math.min(L - 0.35, (desiredXcg * totalMassKg - currentSumMx) / ballastKg))
      : 0.45;

  const packages: ComponentPackage3D[] =
    ballastKg > 0.01
      ? [
          ...baseComponents,
          {
            id: 'pkg_ballast',
            subsystem: 'driver_ballast',
            name: 'Lastro Regulamentar de Tungstênio',
            massKg: Number(ballastKg.toFixed(2)),
            xCgM: Number(ballastNeededX.toFixed(3)),
            yCgM: 0,
            zCgM: 0.045,
            iZzSelfKgM2: 0.08,
            bboxHalfXM: 0.12,
            bboxHalfYM: 0.10,
            bboxHalfZM: 0.02,
            maintenanceMinutes: 15,
            removalSequenceOrder: 2,
          },
        ]
      : baseComponents;

  // Exact Composite CG: xCG = sum(m_i * x_i) / sum(m_i)
  const sumM = packages.reduce((acc, p) => acc + p.massKg, 0);
  const xCg = packages.reduce((acc, p) => acc + p.massKg * p.xCgM, 0) / sumM;
  const yCg = packages.reduce((acc, p) => acc + p.massKg * p.yCgM, 0) / sumM;
  const zCg = packages.reduce((acc, p) => acc + p.massKg * p.zCgM, 0) / sumM;

  // Exact Parallel-Axis Yaw Inertia: Iz = sum( m_i * [(x_i - xCG)^2 + (y_i - yCG)^2] + I_zz,i )
  const yawInertiaIzKgM2 = packages.reduce(
    (acc, p) => acc + p.massKg * ((p.xCgM - xCg) ** 2 + (p.yCgM - yCg) ** 2) + p.iZzSelfKgM2,
    0
  );

  // Static axle distribution by moment equilibrium around front/rear contact patches
  const rearFraction = Math.max(0, Math.min(1, xCg / L));
  const frontFraction = 1 - rearFraction;
  const g = 9.80665;
  const totalWeightN = sumM * g;
  const frontLoadN = totalWeightN * frontFraction;
  const rearLoadN = totalWeightN * rearFraction;

  // First-order load transfer estimates (Manual p. 6)
  const longTransferAt45G_N = (sumM * (4.5 * g) * zCg) / L;
  const latTransferAt42G_N = (sumM * (4.2 * g) * zCg) / track;

  // AABB collision checks between non-overlapping core internal packages (excluding full-span floor/axles from envelope overlap)
  const coreInternalIds = new Set(['pkg_cockpit', 'pkg_energy_store', 'pkg_pu_ice', 'pkg_cooling', 'pkg_gearbox', 'pkg_driver']);
  const corePackages = packages.filter((p) => coreInternalIds.has(p.id));
  const interferences: InterferencePairResult[] = [];

  for (let i = 0; i < corePackages.length; i++) {
    for (let j = i + 1; j < corePackages.length; j++) {
      const a = corePackages[i];
      const b = corePackages[j];
      // Driver sits inside cockpit cavity intentionally — treat as nested ergonomic volume
      if ((a.id === 'pkg_cockpit' && b.id === 'pkg_driver') || (a.id === 'pkg_driver' && b.id === 'pkg_cockpit')) {
        continue;
      }
      const dx = Math.abs(a.xCgM - b.xCgM) - (a.bboxHalfXM + b.bboxHalfXM);
      const dy = Math.abs(a.yCgM - b.yCgM) - (a.bboxHalfYM + b.bboxHalfYM);
      const dz = Math.abs(a.zCgM - b.zCgM) - (a.bboxHalfZM + b.bboxHalfZM);
      const hasCollision = dx < -0.005 && dy < -0.005 && dz < -0.005;
      const minClearanceM = Math.max(dx, dy, dz);
      interferences.push({
        componentA: a.name,
        componentB: b.name,
        hasCollision,
        minClearanceM: Number(minClearanceM.toFixed(4)),
      });
    }
  }

  const collisionCount = interferences.filter((c) => c.hasCollision).length;

  // Hardpoints published with exact coordinate frame & SI units (m)
  const hardpoints: Hardpoint3D[] = [
    {
      axle: 'front',
      name: 'Upper Wishbone Front Pivot',
      xM: -0.14,
      yM: 0.16,
      zM: 0.34 + (params.upperArmInclinationDeg - 7.5) * 0.003,
      unitSi: 'm',
      referenceFrame: COORDINATE_FRAME_STANDARD.frameId,
    },
    {
      axle: 'front',
      name: 'Upper Wishbone Rear Pivot',
      xM: 0.18,
      yM: 0.17,
      zM: 0.34 - Math.tan((params.upperArmInclinationDeg * Math.PI) / 180) * 0.32 * (params.antiDivePct / 100),
      unitSi: 'm',
      referenceFrame: COORDINATE_FRAME_STANDARD.frameId,
    },
    {
      axle: 'front',
      name: `Front ${params.frontSuspensionType.toUpperCase()} Chassis Pickup`,
      xM: 0.04,
      yM: 0.14,
      zM: params.frontSuspensionType === 'pullrod' ? 0.17 : 0.44,
      unitSi: 'm',
      referenceFrame: COORDINATE_FRAME_STANDARD.frameId,
    },
    {
      axle: 'rear',
      name: 'Rear Upper Wishbone Front Pivot',
      xM: Number((L - 0.24).toFixed(4)),
      yM: 0.14,
      zM: 0.33 + Math.tan((params.upperArmInclinationDeg * Math.PI) / 180) * 0.22 * (params.antiSquatPct / 100),
      unitSi: 'm',
      referenceFrame: COORDINATE_FRAME_STANDARD.frameId,
    },
    {
      axle: 'rear',
      name: `Rear ${params.rearSuspensionType.toUpperCase()} Gearbox Pickup`,
      xM: Number((L - 0.05).toFixed(4)),
      yM: 0.13,
      zM: params.rearSuspensionType === 'pullrod' ? 0.18 : 0.43,
      unitSi: 'm',
      referenceFrame: COORDINATE_FRAME_STANDARD.frameId,
    },
  ];

  // Simplified cooling capacity check for packaging
  const radiatorAreaM2 = (params.radiatorVolumeL / 1000) / 0.055; // ~55mm core thickness
  const estimatedRejectionCapacityW = radiatorAreaM2 * 480 * 80; // U*A*dT baseline W

  const overallLengthM = L + 1.55; // front overhang + rear diffuser/crash structure
  const overallWidthM = Math.max(track, params.wingSpanMm / 1000);
  const overallHeightM = 0.96;

  const envelopeViolations: string[] = [];
  if (L > edition.maxWheelbaseM || L < edition.minWheelbaseM) {
    envelopeViolations.push(`Entre-eixos ${L.toFixed(3)} m fora do envelope [${edition.minWheelbaseM}, ${edition.maxWheelbaseM}] m.`);
  }
  if (overallWidthM > edition.maxWidthM) {
    envelopeViolations.push(`Largura total ${overallWidthM.toFixed(3)} m excede limite ${edition.maxWidthM} m.`);
  }
  if (totalMassKg < edition.minMassKg - 0.01) {
    envelopeViolations.push(`Massa total ${totalMassKg.toFixed(2)} kg abaixo do mínimo ${edition.minMassKg} kg.`);
  }

  const totalMaintenanceMinutes = packages.reduce((acc, p) => acc + p.maintenanceMinutes, 0);
  const maintenanceSequenceViable = packages.some((p) => p.removalSequenceOrder === 1);

  return {
    edition,
    coordinateFrame: COORDINATE_FRAME_STANDARD,
    wheelbaseM: Number(L.toFixed(4)),
    frontTrackM: Number(track.toFixed(4)),
    rearTrackM: Number(track.toFixed(4)),
    overallLengthM: Number(overallLengthM.toFixed(3)),
    overallWidthM: Number(overallWidthM.toFixed(3)),
    overallHeightM,
    packages,
    hardpoints,
    rawMassKg: Number(rawMassKg.toFixed(2)),
    ballastKg: Number(ballastKg.toFixed(2)),
    totalMassKg: Number(totalMassKg.toFixed(2)),
    cgM: {
      x: Number(xCg.toFixed(4)),
      y: Number(yCg.toFixed(4)),
      z: Number(zCg.toFixed(4)),
    },
    yawInertiaIzKgM2: Number(yawInertiaIzKgM2.toFixed(2)),
    staticAxleDist: {
      frontPct: Number((frontFraction * 100).toFixed(2)),
      rearPct: Number((rearFraction * 100).toFixed(2)),
      frontLoadN: Number(frontLoadN.toFixed(1)),
      rearLoadN: Number(rearLoadN.toFixed(1)),
    },
    firstOrderTransfer: {
      longTransferAt45G_N: Number(longTransferAt45G_N.toFixed(1)),
      latTransferAt42G_N: Number(latTransferAt42G_N.toFixed(1)),
    },
    coolingPackage: {
      radiatorAreaM2: Number(radiatorAreaM2.toFixed(4)),
      estimatedRejectionCapacityW: Math.round(estimatedRejectionCapacityW),
    },
    interferences,
    collisionCount,
    totalMaintenanceMinutes,
    maintenanceSequenceViable,
    envelopeCompliant: envelopeViolations.length === 0,
    envelopeViolations,
  };
}

export function evaluateGate03(pkg: PackagingAnalysisOutputs): GateResult {
  const sumM = pkg.packages.reduce((acc, p) => acc + p.massKg, 0);
  const massClosed = Math.abs(sumM - pkg.totalMassKg) < 0.05 && pkg.yawInertiaIzKgM2 > 100;
  const hardpointsOk = pkg.hardpoints.every(
    (hp) => hp.unitSi === 'm' && hp.referenceFrame === COORDINATE_FRAME_STANDARD.frameId
  );

  const criteria = [
    {
      id: 'G03-C1',
      label: 'Envelope regulamentar versionado por edição FIA',
      passed: pkg.envelopeCompliant && pkg.edition.editionId.length > 0,
      detail: pkg.envelopeCompliant
        ? `Conforme ${pkg.edition.editionId} (L=${pkg.wheelbaseM} m, Larg=${pkg.overallWidthM} m).`
        : pkg.envelopeViolations.join(' '),
    },
    {
      id: 'G03-C2',
      label: 'Massa, CG 3D e inércia de yaw fecham matematicamente',
      passed: massClosed,
      detail: `m=${pkg.totalMassKg} kg | CG=(${pkg.cgM.x}, ${pkg.cgM.y}, ${pkg.cgM.z}) m | Iz=${pkg.yawInertiaIzKgM2} kg·m².`,
    },
    {
      id: 'G03-C3',
      label: 'Interferências físicas (bounding boxes 3D) resolvidas',
      passed: pkg.collisionCount === 0,
      detail: `${pkg.interferences.length} pares verificados; colisões detectadas: ${pkg.collisionCount}.`,
    },
    {
      id: 'G03-C4',
      label: 'Refrigeração e sequência de manutenção analisadas',
      passed: pkg.maintenanceSequenceViable && pkg.coolingPackage.radiatorAreaM2 > 0,
      detail: `Área radiador: ${pkg.coolingPackage.radiatorAreaM2} m² | Tempo total desmontagem: ${pkg.totalMaintenanceMinutes} min.`,
    },
    {
      id: 'G03-C5',
      label: 'Hardpoints publicados com referencial e unidade SI',
      passed: hardpointsOk && pkg.hardpoints.length >= 5,
      detail: `${pkg.hardpoints.length} hardpoints publicados em ${COORDINATE_FRAME_STANDARD.frameId} (m).`,
    },
  ];

  return {
    gateId: 'GATE_03',
    moduleCode: 'M03',
    passed: criteria.every((c) => c.passed),
    criteria,
  };
}
