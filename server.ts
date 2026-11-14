import 'dotenv/config';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { and, desc, eq } from 'drizzle-orm';
import express from 'express';
import { CASING_ALLOYS, COMPOSITE_MATERIALS } from './src/data/physicsDatabase.ts';
import { db } from './src/db/index.ts';
import {
  calibrationCampaigns,
  careerSnapshots,
  raceSimulationRuns,
  regulationEditions,
  simulationCampaigns,
  trackCharacteristics,
  vehicleArchitectures,
} from './src/db/schema.ts';
import { ensureDatabaseSeeded } from './src/db/seed.ts';
import {
  exportCalculixInputDeck,
  exportOpenFoamDeck,
  type ExternalSolverStatus,
} from './src/engine/adapters/externalCfdFeaAdapter.ts';
import {
  BASE_EQUATIONS_CATALOG,
  COORDINATE_FRAME_STANDARD,
  FLUID_CATALOG,
  SCIENTIFIC_SOURCES,
  SI_VARIABLE_REGISTRY,
  evaluateEquationSafely,
  evaluateGate01,
} from './src/engine/modules/m01Foundation.ts';
import {
  SUBSYSTEM_RELATIONS_M02,
  TRACK_CHARACTERISTICS_CATALOG,
  VEHICLE_PHILOSOPHIES_M02,
  type VehiclePhilosophyCode,
  evaluateGate02,
  evaluatePhilosophyForTrack,
} from './src/engine/modules/m02Philosophy.ts';
import {
  FIA_2026_DEFAULT_EDITION,
  buildPackagingArchitecture,
  evaluateGate03,
} from './src/engine/modules/m03Packaging.ts';
import { evaluateAerodynamics, evaluateGate04 } from './src/engine/modules/m04Aerodynamics.ts';
import { evaluateGate05, evaluateVehicleDynamics } from './src/engine/modules/m05VehicleDynamics.ts';
import {
  TIRE_COMPOUND_CATALOG,
  type TireCompoundCode,
  evaluateGate06,
  evaluateTirePhysics,
} from './src/engine/modules/m06Tires.ts';
import { evaluateGate07, evaluateStructures } from './src/engine/modules/m07Structures.ts';
import { evaluateGate08, evaluatePowerUnit } from './src/engine/modules/m08PowerUnit.ts';
import { evaluateGate09, evaluateTransmission } from './src/engine/modules/m09Transmission.ts';
import { evaluateGate10, runMultidisciplinarySimulation } from './src/engine/modules/m10Multidisciplinary.ts';
import { evaluateGate11, runRaceSimulation } from './src/engine/modules/m11RaceSimulation.ts';
import { evaluateGate12, runCalibrationPipeline } from './src/engine/modules/m12Calibration.ts';
import { DEFAULT_VEHICLE_PARAMS, solveVehiclePhysics } from './src/engine/physicsEngine.ts';
import { evaluateAllGates } from './src/engine/traceability/traceabilityRegistry.ts';
import { type AuthRequest, requireAuth } from './src/middleware/auth.ts';
import type { VehicleEngineeringParameters } from './src/types/physics.ts';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkBinaryInstalled(cmd: string): Promise<boolean> {
  try {
    await execFileAsync('which', [cmd], { timeout: 1500 });
    return true;
  } catch {
    return false;
  }
}

async function checkPythonScientific(): Promise<boolean> {
  try {
    await execFileAsync('python3', ['-c', 'import numpy, scipy'], { timeout: 2500 });
    return true;
  } catch {
    return false;
  }
}

function mergeVehicleParams(patch?: Partial<VehicleEngineeringParameters>): VehicleEngineeringParameters {
  return {
    ...DEFAULT_VEHICLE_PARAMS,
    ...(patch || {}),
  };
}

export async function createApp() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  // =========================================================================
  // STATELESS HEALTH & EXTERNAL SOLVER CAPABILITY INSPECTION (HONEST)
  // =========================================================================
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'apex-f1-2026-engineering-kernel',
      editionId: FIA_2026_DEFAULT_EDITION.editionId,
      nodeVersion: process.version,
    });
  });

  app.get('/api/adapters/host-status', async (_req, res) => {
    const [openfoamAvailable, calculixAvailable, pythonSciAvailable] = await Promise.all([
      checkBinaryInstalled('simpleFoam'),
      checkBinaryInstalled('ccx'),
      checkPythonScientific(),
    ]);

    const adapters: ExternalSolverStatus[] = [
      {
        toolName: 'OpenFOAM (simpleFoam RANS CFD)',
        status: openfoamAvailable ? 'AVAILABLE' : 'NOT_INSTALLED_ON_HOST',
        checkedCommand: 'which simpleFoam',
        canExportInputDeck: true,
        honestDisclaimer: openfoamAvailable
          ? 'Binário simpleFoam detectado no host; decks exportáveis para execução RANS externa.'
          : 'OpenFOAM não está instalado neste host de runtime. Apenas exportação do caso/dicionários Reais (blockMesh/controlDict) está habilitada; nenhum resultado CFD externo fictício é fabricado.',
      },
      {
        toolName: 'CalculiX (ccx FEA)',
        status: calculixAvailable ? 'AVAILABLE' : 'NOT_INSTALLED_ON_HOST',
        checkedCommand: 'which ccx',
        canExportInputDeck: true,
        honestDisclaimer: calculixAvailable
          ? 'Binário ccx detectado no host; decks .inp exportáveis para execução FEA externa.'
          : 'CalculiX (ccx) não está instalado neste host de runtime. Apenas geração e download do deck .inp (*SHELL SECTION, *MATERIAL) estão ativos; o solver interno utiliza CLT reduzida (M07).',
      },
    ];

    res.json({
      adapters,
      pythonNumpyScipyAvailable: pythonSciAvailable,
      checkedAtIso: new Date().toISOString(),
    });
  });

  // =========================================================================
  // M01–M12 SCIENTIFIC ENGINEERING ENDPOINTS (SI-VALIDATED, REAL COMPUTATION)
  // =========================================================================
  app.get('/api/m01/catalog', (_req, res) => {
    res.json({
      coordinateFrame: COORDINATE_FRAME_STANDARD,
      sources: SCIENTIFIC_SOURCES,
      variables: SI_VARIABLE_REGISTRY,
      fluids: FLUID_CATALOG,
      equations: BASE_EQUATIONS_CATALOG,
      compositeMaterials: Object.values(COMPOSITE_MATERIALS),
      casingAlloys: Object.values(CASING_ALLOYS),
      gate: evaluateGate01(),
    });
  });

  app.post('/api/m01/evaluate-equation', (req, res) => {
    try {
      const { equationCode, scope } = req.body as {
        equationCode: string;
        scope: Record<string, number>;
      };
      const result = evaluateEquationSafely(equationCode, scope || {});
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.post('/api/m02/evaluate', (req, res) => {
    try {
      const {
        philosophyCode = 'aero_efficiency',
        circuitCode = 'monza',
        tradeoffsAcknowledged = true,
        params: rawParams,
      } = req.body as {
        philosophyCode?: VehiclePhilosophyCode;
        circuitCode?: string;
        tradeoffsAcknowledged?: boolean;
        params?: Partial<VehicleEngineeringParameters>;
      };
      const params = mergeVehicleParams(rawParams);
      const phys = solveVehiclePhysics(params);
      const report = evaluatePhilosophyForTrack(
        philosophyCode,
        circuitCode,
        {
          aeroEfficiencyLd: phys.cornerMode.aeroEfficiencyLD,
          clTotal: phys.cornerMode.clTotal,
          cdTotal: phys.cornerMode.cdTotal,
          platformStability01: Math.max(0.1, Math.min(0.99, phys.summary.consistencyScore / 100)),
          mechanicalGrip01: Math.max(0.1, Math.min(0.99, phys.summary.cornerGripScore / 100)),
          thermalMarginK: phys.thermalMarginC,
        },
        0,
        Boolean(tradeoffsAcknowledged)
      );
      res.json({
        report,
        gate: evaluateGate02(report),
        philosophies: Object.values(VEHICLE_PHILOSOPHIES_M02),
        tracks: TRACK_CHARACTERISTICS_CATALOG,
        subsystemRelations: SUBSYSTEM_RELATIONS_M02,
      });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.post('/api/m03/packaging', (req, res) => {
    try {
      const params = mergeVehicleParams(req.body?.params);
      const packaging = buildPackagingArchitecture(params, FIA_2026_DEFAULT_EDITION);
      res.json({ packaging, gate: evaluateGate03(packaging) });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.post('/api/m04/aero', (req, res) => {
    try {
      const params = mergeVehicleParams(req.body?.params);
      const mode = req.body?.mode === 'MODE_X' ? 'MODE_X' : 'MODE_Z';
      const speedMs = Number(req.body?.speedMs ?? (mode === 'MODE_X' ? 86 : 69.44));
      const aero = evaluateAerodynamics(
        params,
        {
          speedMs,
          frontRhM: params.frontRideHeightMm / 1000,
          rearRhM: params.rearRideHeightMm / 1000,
          pitchRad: Number(req.body?.pitchRad ?? 0),
          yawRad: Number(req.body?.yawRad ?? 0.03),
          rollRad: Number(req.body?.rollRad ?? 0),
          mode,
          ambientTempK: Number(req.body?.ambientTempK ?? 298.15),
          airPressurePa: Number(req.body?.airPressurePa ?? 101325),
          gearboxLayout: params.gearboxLayout,
          followDistanceM: req.body?.followDistanceM ? Number(req.body.followDistanceM) : undefined,
          inAeroActivationZone: req.body?.inAeroActivationZone ?? mode === 'MODE_X',
          wetSurface: Boolean(req.body?.wetSurface),
        },
        FIA_2026_DEFAULT_EDITION
      );
      const openFoamDeck = exportOpenFoamDeck(params, speedMs);
      res.json({ aero, gate: evaluateGate04(aero), openFoamDeck });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.post('/api/m05/dynamics', (req, res) => {
    try {
      const params = mergeVehicleParams(req.body?.params);
      const pkg = buildPackagingArchitecture(params, FIA_2026_DEFAULT_EDITION);
      const dyn = evaluateVehicleDynamics(params, pkg, {
        speedMs: Number(req.body?.speedMs ?? 69.44),
        steerAngleRad: Number(req.body?.steerAngleRad ?? 0.055),
        longAccelMs2: Number(req.body?.longAccelMs2 ?? 0),
        latAccelMs2: Number(req.body?.latAccelMs2 ?? 3.8 * 9.80665),
        brakePressureRatio: Number(req.body?.brakePressureRatio ?? 0),
        brakeBiasFront: Number(req.body?.brakeBiasFront ?? 0.56),
        brakeDiscTempK: Number(req.body?.brakeDiscTempK ?? 920),
        mgukRegenTorqueNm: Number(req.body?.mgukRegenTorqueNm ?? 0),
        aeroMode: 'MODE_Z',
        ambientTempK: 298.15,
        airPressurePa: 101325,
        tireMaxFxFrontN: 10000,
        tireMaxFxRearN: 11200,
        tireMaxFyFrontN: 13500,
        tireMaxFyRearN: 15200,
      });
      res.json({ dynamics: dyn, gate: evaluateGate05(dyn) });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.post('/api/m06/tire', (req, res) => {
    try {
      const compoundCode: TireCompoundCode = req.body?.compoundCode || 'medium';
      const tire = evaluateTirePhysics({
        compoundCode,
        verticalLoadN: Number(req.body?.verticalLoadN ?? 5200),
        slipAngleRad: Number(req.body?.slipAngleRad ?? 0.11),
        wheelAngularVelRadS: Number(req.body?.wheelAngularVelRadS ?? 195),
        wheelVxMs: Number(req.body?.wheelVxMs ?? 69.44),
        effectiveRadiusM: 0.36,
        camberRad: Number(req.body?.camberRad ?? -0.04),
        tempInnerK: Number(req.body?.tempInnerK ?? 372),
        tempCenterK: Number(req.body?.tempCenterK ?? 375),
        tempOuterK: Number(req.body?.tempOuterK ?? 378),
        tempCarcassK: Number(req.body?.tempCarcassK ?? 369),
        ambientTempK: Number(req.body?.ambientTempK ?? 298.15),
        atmosphericPressurePa: 101325,
        coldGasMolesN: 4.55,
        internalGasVolumeM3: 0.044,
        surfaceGripFactor: Number(req.body?.surfaceGripFactor ?? 1.0),
        waterFilmMm: Number(req.body?.waterFilmMm ?? 0),
        surfaceMacroTextureMm: 1.0,
        dtS: 0.05,
        currentWearRatio: Number(req.body?.currentWearRatio ?? 0.05),
      });
      res.json({
        tire,
        gate: evaluateGate06(tire),
        catalog: Object.values(TIRE_COMPOUND_CATALOG),
      });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.post('/api/m07/structures', (req, res) => {
    try {
      const params = mergeVehicleParams(req.body?.params);
      const pkg = buildPackagingArchitecture(params, FIA_2026_DEFAULT_EDITION);
      const structures = evaluateStructures(
        params,
        {
          peakDownforceN: Number(req.body?.peakDownforceN ?? 19500),
          peakCornerLatAccelMs2: Number(req.body?.peakCornerLatAccelMs2 ?? 4.2 * 9.80665),
          peakBrakeAccelMs2: Number(req.body?.peakBrakeAccelMs2 ?? 4.8 * 9.80665),
          totalMassKg: pkg.totalMassKg,
          shaftPowerW: Number(req.body?.shaftPowerW ?? 760000),
        },
        FIA_2026_DEFAULT_EDITION
      );
      const calculixDeck = exportCalculixInputDeck(params, structures.allowables.tensileStrengthMpa);
      res.json({ structures, gate: evaluateGate07(structures), calculixDeck });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.post('/api/m08/power-unit', (req, res) => {
    try {
      const params = mergeVehicleParams(req.body?.params);
      const powerUnit = evaluatePowerUnit(
        params,
        {
          rpm: Number(req.body?.rpm ?? 11600),
          throttleRatio: Number(req.body?.throttleRatio ?? 1.0),
          vehicleSpeedMs: Number(req.body?.vehicleSpeedMs ?? 69.44),
          ambientTempK: Number(req.body?.ambientTempK ?? 298.15),
          airPressurePa: Number(req.body?.airPressurePa ?? 101325),
          initialSoc01: Number(req.body?.initialSoc01 ?? 0.72),
          cycleDurationS: Number(req.body?.cycleDurationS ?? 5.0),
          regenPowerCommandW: Number(req.body?.regenPowerCommandW ?? 110000),
          deployCommandRatio: Number(req.body?.deployCommandRatio ?? 0.92),
          cumulativeRaceCycles: Number(req.body?.cumulativeRaceCycles ?? 100),
        },
        FIA_2026_DEFAULT_EDITION
      );
      res.json({ powerUnit, gate: evaluateGate08(powerUnit) });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.post('/api/m09/transmission', (req, res) => {
    try {
      const params = mergeVehicleParams(req.body?.params);
      const transmission = evaluateTransmission(
        params,
        {
          selectedGear: Number(req.body?.selectedGear ?? 6),
          engineTorqueNm: Number(req.body?.engineTorqueNm ?? 610),
          engineOmegaRadS: Number(req.body?.engineOmegaRadS ?? 1215),
          wheelOmegaLeftRadS: Number(req.body?.wheelOmegaLeftRadS ?? 193),
          wheelOmegaRightRadS: Number(req.body?.wheelOmegaRightRadS ?? 191),
          clutchSlipOmegaRadS: 10,
          tireEffectiveRadiusM: 0.36,
          maxTireAxleTractionN: 16500,
          shiftTimeCommandS: Math.max(FIA_2026_DEFAULT_EDITION.minShiftTimeS, Number(req.body?.shiftTimeCommandS ?? 0.045)),
          ambientTempK: Number(req.body?.ambientTempK ?? 298.15),
          isHollowDriveshaft: true,
        },
        FIA_2026_DEFAULT_EDITION
      );
      res.json({ transmission, gate: evaluateGate09(transmission) });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.post('/api/m10/run', (req, res) => {
    try {
      const params = mergeVehicleParams(req.body?.params);
      const config = {
        fidelityLevel: req.body?.fidelityLevel || 'L2',
        couplingMode: req.body?.couplingMode || 'strong',
        convergenceTolM: Number(req.body?.convergenceTolM ?? 5e-5),
        maxIterations: Number(req.body?.maxIterations ?? 25),
        ambientTempK: Number(req.body?.ambientTempK ?? 298.15),
        airPressurePa: Number(req.body?.airPressurePa ?? 101325),
        tireCompound: (req.body?.tireCompound || 'medium') as TireCompoundCode,
        referenceTrackLapDistM: Number(req.body?.referenceTrackLapDistM ?? 5793),
        highSpeedShare: Number(req.body?.highSpeedShare ?? 0.62),
        lowSpeedShare: Number(req.body?.lowSpeedShare ?? 0.16),
      } as const;
      const mdo = runMultidisciplinarySimulation(params, config, FIA_2026_DEFAULT_EDITION);
      res.json({ mdo, gate: evaluateGate10(mdo) });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.post('/api/m11/simulate', (req, res) => {
    try {
      const params = mergeVehicleParams(req.body?.params);
      const race = runRaceSimulation(
        params,
        {
          circuitCode: req.body?.circuitCode || 'monza',
          fidelityMode: req.body?.fidelityMode || 'dynamic',
          weather: req.body?.weather || 'dry_clear',
          initialFuelKg: Number(req.body?.initialFuelKg ?? 78),
          stints: Array.isArray(req.body?.stints) && req.body.stints.length > 0
            ? req.body.stints
            : [
                { compound: 'medium', lapsCount: 22 },
                { compound: 'hard', lapsCount: 31 },
              ],
          trafficFollowGapS: Number(req.body?.trafficFollowGapS ?? 1.1),
          pitStopDurationS: Number(req.body?.pitStopDurationS ?? 22.0),
          seed: Number(req.body?.seed ?? 2026),
        },
        FIA_2026_DEFAULT_EDITION
      );
      res.json({ race, gate: evaluateGate11(race) });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.post('/api/m12/calibrate', (req, res) => {
    try {
      const params = mergeVehicleParams(req.body?.params);
      const calibration = runCalibrationPipeline(
        params,
        {
          method: req.body?.method === 'nelder_mead' ? 'nelder_mead' : 'levenberg_marquardt',
          seed: Number(req.body?.seed ?? 202601),
          monteCarloSamples: Number(req.body?.monteCarloSamples ?? 200),
          regularizationLambda: Number(req.body?.regularizationLambda ?? 0.05),
          targetRmseThresholdN: Number(req.body?.targetRmseThresholdN ?? 580),
          requestedLifecycleStage: req.body?.requestedLifecycleStage || 'Approved',
        },
        FIA_2026_DEFAULT_EDITION
      );
      res.json({ calibration, gate: evaluateGate12(calibration) });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.post('/api/traceability/audit', (req, res) => {
    try {
      const params = mergeVehicleParams(req.body?.params);
      const report = evaluateAllGates(params, req.body?.options || {});
      res.json(report);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  // =========================================================================
  // AUTHENTICATED CLOUD SQL PERSISTENCE ENDPOINTS (Firebase Bearer Token)
  // =========================================================================
  app.post('/api/db/seed', requireAuth, async (_req: AuthRequest, res) => {
    try {
      const seedResult = await ensureDatabaseSeeded();
      res.json(seedResult);
    } catch (error) {
      console.error('Database seed error:', error);
      res.status(500).json({ error: 'Falha ao popular catálogos científicos no PostgreSQL.' });
    }
  });

  app.get('/api/career/snapshots', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUserId!;
      const rows = await db
        .select()
        .from(careerSnapshots)
        .where(eq(careerSnapshots.userId, userId))
        .orderBy(desc(careerSnapshots.updatedAt));
      res.json({ snapshots: rows });
    } catch (error) {
      console.error('Failed loading career snapshots:', error);
      res.status(500).json({ error: 'Erro ao carregar snapshots na nuvem.' });
    }
  });

  app.post('/api/career/snapshots', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUserId!;
      const { slotId, teamName, seasonYear, week, statePayload } = req.body as {
        slotId: string;
        teamName: string;
        seasonYear: number;
        week: number;
        statePayload: Record<string, unknown>;
      };
      if (!slotId || !teamName || !statePayload) {
        return res.status(400).json({ error: 'slotId, teamName e statePayload são obrigatórios.' });
      }
      const existing = await db
        .select()
        .from(careerSnapshots)
        .where(and(eq(careerSnapshots.userId, userId), eq(careerSnapshots.slotId, slotId)))
        .limit(1);

      if (existing.length > 0) {
        const [updated] = await db
          .update(careerSnapshots)
          .set({
            teamName,
            seasonYear,
            week,
            statePayload,
            updatedAt: new Date(),
          })
          .where(eq(careerSnapshots.id, existing[0].id))
          .returning();
        return res.json({ snapshot: updated });
      }

      const [created] = await db
        .insert(careerSnapshots)
        .values({
          userId,
          slotId,
          teamName,
          seasonYear,
          week,
          statePayload,
        })
        .returning();
      res.json({ snapshot: created });
    } catch (error) {
      console.error('Failed saving career snapshot:', error);
      res.status(500).json({ error: 'Erro ao salvar snapshot na nuvem.' });
    }
  });

  app.post('/api/m10/persist', requireAuth, async (req: AuthRequest, res) => {
    try {
      await ensureDatabaseSeeded();
      const userId = req.dbUserId!;
      const params = mergeVehicleParams(req.body?.params);
      const mdo = runMultidisciplinarySimulation(
        params,
        {
          fidelityLevel: req.body?.fidelityLevel || 'L2',
          couplingMode: req.body?.couplingMode || 'strong',
          convergenceTolM: Number(req.body?.convergenceTolM ?? 5e-5),
          maxIterations: Number(req.body?.maxIterations ?? 25),
          ambientTempK: 298.15,
          airPressurePa: 101325,
          tireCompound: 'medium',
          referenceTrackLapDistM: 5793,
          highSpeedShare: 0.62,
          lowSpeedShare: 0.16,
        },
        FIA_2026_DEFAULT_EDITION
      );

      const [editionRow] = await db.select().from(regulationEditions).limit(1);
      const [archRow] = await db
        .insert(vehicleArchitectures)
        .values({
          userId,
          name: req.body?.architectureName || `APEX-26-${Date.now()}`,
          editionId: editionRow.id,
          wheelbaseM: mdo.subsystems.packaging.wheelbaseM,
          frontTrackM: mdo.subsystems.packaging.frontTrackM,
          rearTrackM: mdo.subsystems.packaging.rearTrackM,
          overallLengthM: mdo.subsystems.packaging.overallLengthM,
          overallWidthM: mdo.subsystems.packaging.overallWidthM,
          overallHeightM: mdo.subsystems.packaging.overallHeightM,
          originDescription: mdo.subsystems.packaging.coordinateFrame.origin,
          xConvention: mdo.subsystems.packaging.coordinateFrame.xAxis,
          yConvention: mdo.subsystems.packaging.coordinateFrame.yAxis,
          zConvention: mdo.subsystems.packaging.coordinateFrame.zAxis,
        })
        .returning();

      const gate = evaluateGate10(mdo);
      const [campaignRow] = await db
        .insert(simulationCampaigns)
        .values({
          userId,
          architectureId: archRow.id,
          fidelityLevel: mdo.solverMetadata.fidelityLevel,
          couplingMode: mdo.solverMetadata.couplingMode,
          convergenceTol: mdo.solverMetadata.convergenceTolM,
          maxIterations: mdo.solverMetadata.maxIterations,
          converged: mdo.solverMetadata.converged,
          iterationsUsed: mdo.solverMetadata.iterationsUsed,
          finalResidual: mdo.solverMetadata.finalResidualM,
          lapTimeEstS: mdo.vehicleMetrics.estimatedLapTimeS,
          paretoSolutionsJson: mdo.paretoFrontier,
          sensitivityJson: mdo.sensitivityStudy,
          gateStatusJson: gate,
        })
        .returning();

      res.json({ campaign: campaignRow, architectureId: archRow.id, gate });
    } catch (error) {
      console.error('Persist M10 error:', error);
      res.status(500).json({ error: 'Falha ao persistir campanha M10 no Cloud SQL.' });
    }
  });

  app.post('/api/m11/persist', requireAuth, async (req: AuthRequest, res) => {
    try {
      await ensureDatabaseSeeded();
      const userId = req.dbUserId!;
      const params = mergeVehicleParams(req.body?.params);
      const circuitCode = req.body?.circuitCode || 'monza';
      const race = runRaceSimulation(
        params,
        {
          circuitCode,
          fidelityMode: req.body?.fidelityMode || 'dynamic',
          weather: req.body?.weather || 'dry_clear',
          initialFuelKg: Number(req.body?.initialFuelKg ?? 78),
          stints: req.body?.stints || [
            { compound: 'medium', lapsCount: 22 },
            { compound: 'hard', lapsCount: 31 },
          ],
          trafficFollowGapS: Number(req.body?.trafficFollowGapS ?? 1.1),
          pitStopDurationS: Number(req.body?.pitStopDurationS ?? 22),
        },
        FIA_2026_DEFAULT_EDITION
      );

      const [trackRow] = await db
        .select()
        .from(trackCharacteristics)
        .where(eq(trackCharacteristics.circuitCode, race.circuitCode))
        .limit(1);

      const [runRow] = await db
        .insert(raceSimulationRuns)
        .values({
          userId,
          trackId: trackRow.id,
          fidelityMode: race.fidelityMode,
          weatherCondition: req.body?.weather || 'dry_clear',
          totalLaps: race.lapTelemetry.length,
          initialMassKg: race.massAndFuelBalance.initialVehicleMassKg,
          finalMassKg: race.massAndFuelBalance.finalVehicleMassKg,
          fuelConsumedKg: race.massAndFuelBalance.fuelConsumedKg,
          energyBalanceResidualJ: race.energySummary.maxLapResidualJ,
          expectedTimeS: race.expectedTimeWithUncertaintyS,
          strategySummaryJson: race.strategyScenarios,
          lapTelemetryJson: race.lapTelemetry,
        })
        .returning();

      res.json({ run: runRow, gate: evaluateGate11(race) });
    } catch (error) {
      console.error('Persist M11 error:', error);
      res.status(500).json({ error: 'Falha ao persistir simulação de corrida M11.' });
    }
  });

  app.post('/api/m12/persist', requireAuth, async (req: AuthRequest, res) => {
    try {
      await ensureDatabaseSeeded();
      const userId = req.dbUserId!;
      const params = mergeVehicleParams(req.body?.params);
      const cal = runCalibrationPipeline(
        params,
        {
          method: req.body?.method === 'nelder_mead' ? 'nelder_mead' : 'levenberg_marquardt',
          seed: Number(req.body?.seed ?? 202601),
          monteCarloSamples: Number(req.body?.monteCarloSamples ?? 200),
          regularizationLambda: Number(req.body?.regularizationLambda ?? 0.05),
          requestedLifecycleStage: req.body?.requestedLifecycleStage || 'Approved',
        },
        FIA_2026_DEFAULT_EDITION
      );

      const [row] = await db
        .insert(calibrationCampaigns)
        .values({
          userId,
          moduleCode: 'M04',
          method: cal.method,
          identifiabilityRank: cal.identifiability.identifiabilityRank,
          conditionNumber: cal.identifiability.conditionNumber,
          rmse: cal.metrics.valRmse,
          mae: cal.metrics.valMae,
          uqP05: cal.uncertaintyQuantification.uqP05,
          uqP50: cal.uncertaintyQuantification.uqP50,
          uqP95: cal.uncertaintyQuantification.uqP95,
          monteCarloSamples: cal.uncertaintyQuantification.monteCarloSamples,
          validationPassed: cal.metrics.validationPassed,
          approvalStatus: cal.lifecycleGovernance.currentStage,
        })
        .returning();

      res.json({ campaign: row, gate: evaluateGate12(cal) });
    } catch (error) {
      console.error('Persist M12 error:', error);
      res.status(500).json({ error: 'Falha ao persistir campanha de calibração M12.' });
    }
  });

  // =========================================================================
  // VITE DEV MIDDLEWARE OR PRODUCTION STATIC BUNDLE
  // =========================================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await import('vite');
    const viteServer = await vite.createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(viteServer.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('{*path}', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build dist/index.html not found.');
      }
    });
  }

  return app;
}

const isEntrypoint = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isEntrypoint) {
  const port = Number(process.env.PORT || 3000);
  createApp()
    .then((app) => {
      app.listen(port, '0.0.0.0', () => {
        console.log(`APEX F1 2026 Engineering Server listening on port ${port}`);
      });
    })
    .catch((err) => {
      console.error('Failed to start server:', err);
      process.exit(1);
    });
}
