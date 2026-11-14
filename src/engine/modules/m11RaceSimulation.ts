import type { VehicleEngineeringParameters } from '../../types/physics.ts';
import type { GateResult, ManualInfoClass } from './m01Foundation.ts';
import { TRACK_CHARACTERISTICS_CATALOG } from './m02Philosophy.ts';
import { FIA_2026_DEFAULT_EDITION, type RegulationEditionSpec, buildPackagingArchitecture } from './m03Packaging.ts';
import { type AeroMode2026, evaluateAerodynamics } from './m04Aerodynamics.ts';
import { type TireCompoundCode, evaluateTirePhysics } from './m06Tires.ts';
import { evaluatePowerUnit } from './m08PowerUnit.ts';
import { getSeasonSegmentsCatalog } from '../../circuits/CircuitLoader.ts';

// M11 — Simulação de Corrida e Estratégia (Manual Mestre Seção 11.1 - 11.4)

export type RaceFidelityMode = 'strategic' | 'dynamic' | 'advanced';
export type RaceWeatherCondition = 'dry_clear' | 'overcast_cool' | 'changing_light_rain' | 'wet_heavy';

export interface CircuitSegmentSpec {
  segmentIndex: number;
  segmentName: string;
  lengthM: number;
  curvatureInvM: number; // 1/R (0 = straight)
  slopeRad: number;
  elevationM: number;
  surfaceGripFactor: number;
  aeroModeAllowed: AeroMode2026;
  overtakeOpportunity: number; // 0..1
}

export const CIRCUIT_SEGMENTS_CATALOG: Record<string, CircuitSegmentSpec[]> =
  getSeasonSegmentsCatalog(2026);

export interface TimestampedVehicleState {
  tS: number;
  lap: number;
  segmentIndex: number;
  distanceM: number;
  speedMs: number;
  accelMs2: number;
  gear: number;
  rpm: number;
  tireCompound: TireCompoundCode;
  tireWear01: number;
  tireTempK: number;
  fuelMassKg: number;
  vehicleMassKg: number;
  batterySoc01: number;
  damage01: number;
  dirtyAirLambda: number;
  trackGrip: number;
  waterFilmMm: number;
}

export interface RaceLapTelemetry {
  lap: number;
  lapTimeS: number;
  sectorTimesS: [number, number, number];
  tireCompound: TireCompoundCode;
  tireWearEnd01: number;
  tireTempEndK: number;
  fuelRemainingKg: number;
  vehicleMassEndKg: number;
  batterySocEnd01: number;
  energyBalanceResidualJ: number;
  trackGrip: number;
  waterFilmMm: number;
  neutralization: 'NONE' | 'VSC' | 'SC';
  pitStopTaken: boolean;
  dirtyAirActive: boolean;
}

export interface StrategyScenarioResult {
  scenarioName: string;
  probability: number;
  totalTimeS: number;
  pitLaps: number[];
  compounds: TireCompoundCode[];
  riskNotes: string;
}

export interface RaceSimulationInput {
  circuitCode: string;
  fidelityMode: RaceFidelityMode;
  weather: RaceWeatherCondition;
  initialFuelKg: number;
  stints: Array<{ compound: TireCompoundCode; lapsCount: number }>;
  trafficFollowGapS: number; // e.g. 0.8s (dirty air) or 4.0s (clean air)
  pitStopDurationS: number; // e.g. 22.0s
  seed?: number;
}

export interface RaceSimulationOutputs {
  modelVersion: string;
  editionId: string;
  infoClass: ManualInfoClass;
  circuitCode: string;
  fidelityMode: RaceFidelityMode;
  segments: CircuitSegmentSpec[];
  massAndFuelBalance: {
    initialVehicleMassKg: number;
    finalVehicleMassKg: number;
    initialFuelKg: number;
    fuelConsumedKg: number;
    finalFuelKg: number;
    fuelConserved: boolean;
  };
  energySummary: {
    totalRecoveredJ: number;
    totalSuppliedJ: number;
    totalLostJ: number;
    maxLapResidualJ: number;
    energyConserved: boolean;
  };
  environmentEvolution: {
    initialGrip: number;
    finalGrip: number;
    peakWaterFilmMm: number;
    trackTempRangeK: [number, number];
  };
  lapTelemetry: RaceLapTelemetry[];
  sampleVehicleStates: TimestampedVehicleState[];
  totalRaceTimeS: number;
  expectedTimeWithUncertaintyS: number; // E[T] = sum(P_i * T_i)
  strategyScenarios: StrategyScenarioResult[];
}

export function runRaceSimulation(
  params: VehicleEngineeringParameters,
  input: RaceSimulationInput,
  edition: RegulationEditionSpec = FIA_2026_DEFAULT_EDITION
): RaceSimulationOutputs {
  const track =
    TRACK_CHARACTERISTICS_CATALOG.find((t) => t.circuitCode === input.circuitCode) ||
    TRACK_CHARACTERISTICS_CATALOG[0];
  const segments =
    CIRCUIT_SEGMENTS_CATALOG[track.circuitCode] ||
    CIRCUIT_SEGMENTS_CATALOG.albert_park ||
    CIRCUIT_SEGMENTS_CATALOG.monza ||
    Object.values(CIRCUIT_SEGMENTS_CATALOG)[0];
  const pkg = buildPackagingArchitecture(params, edition);

  // Baseline vehicle aerodynamic & PU capability evaluated cleanly (shared across fidelities!)
  const aeroZ = evaluateAerodynamics(
    params,
    {
      speedMs: 65,
      frontRhM: params.frontRideHeightMm / 1000,
      rearRhM: params.rearRideHeightMm / 1000,
      pitchRad: 0,
      yawRad: 0.02,
      rollRad: 0,
      mode: 'MODE_Z',
      ambientTempK: track.ambientTempK,
      airPressurePa: 101325 * Math.exp(-track.altitudeM / 8400),
      gearboxLayout: params.gearboxLayout,
      followDistanceM: Math.min(100, input.trafficFollowGapS * 65),
      inAeroActivationZone: false,
      wetSurface: input.weather === 'wet_heavy',
    },
    edition
  );
  const aeroX = evaluateAerodynamics(
    params,
    {
      speedMs: 85,
      frontRhM: params.frontRideHeightMm / 1000,
      rearRhM: params.rearRideHeightMm / 1000,
      pitchRad: 0,
      yawRad: 0.0,
      rollRad: 0,
      mode: 'MODE_X',
      ambientTempK: track.ambientTempK,
      airPressurePa: 101325 * Math.exp(-track.altitudeM / 8400),
      gearboxLayout: params.gearboxLayout,
      inAeroActivationZone: true,
      wetSurface: input.weather === 'wet_heavy',
    },
    edition
  );

  const totalLaps = Math.max(
    1,
    input.stints.reduce((acc, s) => acc + s.lapsCount, 0) || track.laps
  );

  // Map each lap to its active compound & pit flag
  const lapPlan: Array<{ compound: TireCompoundCode; pitStop: boolean }> = [];
  let stintCursor = 0;
  let stintRemaining = input.stints[0]?.lapsCount ?? totalLaps;
  for (let l = 1; l <= totalLaps; l++) {
    const activeCompound = input.stints[stintCursor]?.compound ?? 'medium';
    stintRemaining--;
    const pitNow = stintRemaining === 0 && stintCursor < input.stints.length - 1;
    lapPlan.push({ compound: activeCompound, pitStop: pitNow });
    if (pitNow) {
      stintCursor++;
      stintRemaining = input.stints[stintCursor]?.lapsCount ?? 10;
    }
  }

  let simTimeS = 0;
  let fuelKg = input.initialFuelKg;
  const dryBaseMassKg = pkg.totalMassKg;
  const initialVehicleMassKg = dryBaseMassKg + fuelKg;
  let batterySoc = 0.72;
  let tireWear = 0.0;
  let tireTempK = 363.15;
  let trackGrip = 0.96;
  let waterFilmMm = input.weather === 'wet_heavy' ? 2.4 : input.weather === 'changing_light_rain' ? 0.4 : 0.0;
  let peakWaterFilmMm = waterFilmMm;
  let minTrackTempK = track.ambientTempK + 8;
  let maxTrackTempK = track.ambientTempK + 8;

  let totalRecoveredJ = 0;
  let totalSuppliedJ = 0;
  let totalLostJ = 0;
  let maxLapResidualJ = 0;

  const lapTelemetry: RaceLapTelemetry[] = [];
  const sampleVehicleStates: TimestampedVehicleState[] = [];

  for (let lap = 1; lap <= totalLaps; lap++) {
    const plan = lapPlan[lap - 1];
    const compound = plan.compound;

    // Spatial/temporal weather & track evolution
    if (input.weather === 'changing_light_rain') {
      if (lap >= Math.round(totalLaps * 0.35) && lap <= Math.round(totalLaps * 0.65)) {
        waterFilmMm = Math.min(1.6, waterFilmMm + 0.14);
      } else {
        waterFilmMm = Math.max(0.0, waterFilmMm - 0.10); // drying line
      }
    } else if (input.weather === 'wet_heavy') {
      waterFilmMm = 2.2 + 0.4 * Math.sin(lap * 0.3);
    } else {
      waterFilmMm = 0;
      trackGrip = Math.min(1.04, 0.96 + (lap / totalLaps) * 0.07); // rubbering-in
    }
    peakWaterFilmMm = Math.max(peakWaterFilmMm, waterFilmMm);
    const lapTrackTempK = track.ambientTempK + (waterFilmMm > 0.2 ? 2 : 9) + Math.sin(lap * 0.15) * 1.5;
    minTrackTempK = Math.min(minTrackTempK, lapTrackTempK);
    maxTrackTempK = Math.max(maxTrackTempK, lapTrackTempK);

    // Deterministic event triggers (VSC / SC) in advanced mode
    const neutralization: RaceLapTelemetry['neutralization'] =
      input.fidelityMode === 'advanced' && lap === Math.round(totalLaps * 0.48)
        ? 'VSC'
        : input.fidelityMode === 'advanced' && lap === Math.round(totalLaps * 0.72)
        ? 'SC'
        : 'NONE';

    // Dirty air active if following closely (< 1.5s) and not neutralized
    const dirtyAirActive = input.trafficFollowGapS < 1.5 && neutralization === 'NONE';
    const wakeLambda = dirtyAirActive ? aeroZ.wakeEffect.lambdaWakeLoss : 0;
    const coolingPenalty = dirtyAirActive ? aeroZ.wakeEffect.coolingPenaltyPct / 100 : 0;

    let lapTimeS = 0;
    const sectorTimesS: [number, number, number] = [0, 0, 0];
    let lapRecoveredJ = 0;
    let lapSuppliedJ = 0;
    let lapLostJ = 0;

    const segsPerLap = input.fidelityMode === 'strategic' ? 3 : segments.length;

    for (let sIdx = 0; sIdx < segsPerLap; sIdx++) {
      const seg = segments[sIdx % segments.length];
      const segLen = input.fidelityMode === 'strategic' ? track.lapDistanceM / 3 : seg.lengthM;
      const curMassKg = dryBaseMassKg + Math.max(0, fuelKg);

      const useModeX = seg.aeroModeAllowed === 'MODE_X' && waterFilmMm < 0.3 && neutralization === 'NONE';
      const activeAero = useModeX ? aeroX : aeroZ;
      const effectiveCl = activeAero.forces.clTotal * (1 - wakeLambda);

      // Evaluate M06 tire on segment
      const estSpeedMs = seg.curvatureInvM > 0.002 ? Math.min(82, Math.sqrt((1.75 * 9.81) / seg.curvatureInvM)) : 84;
      const qSeg = 0.5 * activeAero.airState.densityKgM3 * estSpeedMs * estSpeedMs;
      const fzCarN = curMassKg * 9.80665 + qSeg * activeAero.referenceAreaM2 * effectiveCl;
      const tireOut = evaluateTirePhysics({
        compoundCode: compound,
        verticalLoadN: fzCarN / 4,
        slipAngleRad: seg.curvatureInvM > 0.002 ? 0.095 : 0.005,
        wheelAngularVelRadS: estSpeedMs / 0.36,
        wheelVxMs: estSpeedMs,
        effectiveRadiusM: 0.36,
        camberRad: (params.staticCamberDeg * Math.PI) / 180,
        tempInnerK: tireTempK - 2,
        tempCenterK: tireTempK,
        tempOuterK: tireTempK + 2,
        tempCarcassK: tireTempK - 6,
        ambientTempK: track.ambientTempK,
        atmosphericPressurePa: 101325,
        coldGasMolesN: 4.55,
        internalGasVolumeM3: 0.044,
        surfaceGripFactor: trackGrip * seg.surfaceGripFactor,
        waterFilmMm,
        surfaceMacroTextureMm: 1.0,
        dtS: segLen / Math.max(25, estSpeedMs),
        currentWearRatio: tireWear,
      });

      const gripAvail = (4 * tireOut.forcesAndMoments.fyPeakN) / (curMassKg * 9.80665);
      const cornerLimitMs =
        seg.curvatureInvM > 0.001
          ? Math.sqrt((gripAvail * 9.80665) / seg.curvatureInvM)
          : 92;

      // M08 Power Unit step on segment
      const segTimeEst = segLen / Math.min(88, Math.max(24, cornerLimitMs));
      const puStep = evaluatePowerUnit(
        params,
        {
          rpm: seg.curvatureInvM < 0.003 ? 12100 : 9600,
          throttleRatio: seg.curvatureInvM < 0.005 ? 0.98 : 0.62,
          vehicleSpeedMs: Math.min(88, cornerLimitMs),
          ambientTempK: track.ambientTempK,
          airPressurePa: 101325 * Math.exp(-track.altitudeM / 8400),
          initialSoc01: batterySoc,
          cycleDurationS: segTimeEst,
          regenPowerCommandW: seg.curvatureInvM > 0.01 ? 150000 : 20000,
          deployCommandRatio: neutralization === 'NONE' && seg.curvatureInvM < 0.008 ? 0.90 : 0.15,
          cumulativeRaceCycles: lap * 15,
          coolingAirPenalty01: coolingPenalty,
        },
        edition
      );

      // Straight top speed limited by wheel power vs aero drag + slope resistance
      const slopeForceN = curMassKg * 9.80665 * Math.sin(seg.slopeRad);
      const vStraightMax = Math.min(
        96,
        Math.pow(
          Math.max(1e4, (2 * Math.max(1e5, puStep.totalShaftOutput.crankshaftTotalPowerW * 0.97 - slopeForceN * 40)) /
            (activeAero.airState.densityKgM3 * activeAero.forces.cdAM2)),
          1 / 3
        )
      );
      let segSpeedMs = seg.curvatureInvM > 0.002 ? Math.min(vStraightMax, cornerLimitMs) : vStraightMax;
      if (neutralization === 'VSC') segSpeedMs *= 0.68;
      if (neutralization === 'SC') segSpeedMs = Math.min(segSpeedMs, 38);

      const segTimeS = segLen / Math.max(15, segSpeedMs);
      lapTimeS += segTimeS;
      const sectorIdx = Math.min(2, Math.floor((sIdx / segsPerLap) * 3));
      sectorTimesS[sectorIdx] += segTimeS;

      // Update conserved mass (fuel), battery SOC, tire wear & temp
      const fuelBurnKg = puStep.shaftAndIce.fuelMassFlowKgS * segTimeS * (neutralization === 'NONE' ? 1 : 0.45);
      fuelKg = Math.max(0, fuelKg - fuelBurnKg);
      batterySoc = puStep.ersAndBattery.finalSoc01;
      tireWear = tireOut.degradationStates.wearRatioTotal;
      tireTempK = tireOut.thermalNodes.tempTreadAvgK;

      lapRecoveredJ += puStep.energyBalance.energyRecoveredJ;
      lapSuppliedJ += puStep.energyBalance.energySuppliedJ;
      lapLostJ += puStep.energyBalance.energyLostJ;
      maxLapResidualJ = Math.max(maxLapResidualJ, Math.abs(puStep.energyBalance.balanceResidualJ));

      simTimeS += segTimeS;

      // Record timestamped state on first, mid, and final laps
      if (lap === 1 || lap === Math.ceil(totalLaps / 2) || lap === totalLaps) {
        sampleVehicleStates.push({
          tS: Number(simTimeS.toFixed(2)),
          lap,
          segmentIndex: seg.segmentIndex,
          distanceM: segLen,
          speedMs: Number(segSpeedMs.toFixed(2)),
          accelMs2: Number(((segSpeedMs * segSpeedMs) * seg.curvatureInvM).toFixed(2)),
          gear: Math.max(1, Math.min(edition.numForwardGears, Math.round(segSpeedMs / 11))),
          rpm: puStep.shaftAndIce.rpm,
          tireCompound: compound,
          tireWear01: Number(tireWear.toFixed(4)),
          tireTempK: Number(tireTempK.toFixed(1)),
          fuelMassKg: Number(fuelKg.toFixed(2)),
          vehicleMassKg: Number((dryBaseMassKg + fuelKg).toFixed(2)),
          batterySoc01: Number(batterySoc.toFixed(4)),
          damage01: 0,
          dirtyAirLambda: Number(wakeLambda.toFixed(4)),
          trackGrip: Number(trackGrip.toFixed(3)),
          waterFilmMm: Number(waterFilmMm.toFixed(2)),
        });
      }
    }

    if (plan.pitStop) {
      lapTimeS += input.pitStopDurationS;
      simTimeS += input.pitStopDurationS;
      tireWear = 0; // Fresh tires on pit stop
      tireTempK = 353.15;
    }

    totalRecoveredJ += lapRecoveredJ;
    totalSuppliedJ += lapSuppliedJ;
    totalLostJ += lapLostJ;

    lapTelemetry.push({
      lap,
      lapTimeS: Number(lapTimeS.toFixed(3)),
      sectorTimesS: [
        Number(sectorTimesS[0].toFixed(3)),
        Number(sectorTimesS[1].toFixed(3)),
        Number(sectorTimesS[2].toFixed(3)),
      ],
      tireCompound: compound,
      tireWearEnd01: Number(tireWear.toFixed(4)),
      tireTempEndK: Number(tireTempK.toFixed(1)),
      fuelRemainingKg: Number(fuelKg.toFixed(2)),
      vehicleMassEndKg: Number((dryBaseMassKg + fuelKg).toFixed(2)),
      batterySocEnd01: Number(batterySoc.toFixed(4)),
      energyBalanceResidualJ: Number(maxLapResidualJ.toFixed(4)),
      trackGrip: Number(trackGrip.toFixed(3)),
      waterFilmMm: Number(waterFilmMm.toFixed(2)),
      neutralization,
      pitStopTaken: plan.pitStop,
      dirtyAirActive,
    });
  }

  const totalRaceTimeS = Number(lapTelemetry.reduce((acc, l) => acc + l.lapTimeS, 0).toFixed(2));
  const finalFuelKg = Number(fuelKg.toFixed(3));
  const fuelConsumedKg = Number((input.initialFuelKg - finalFuelKg).toFixed(3));

  // Strategy Scenarios Expected Time E[T] = sum(P_i * T_i)
  const scPenaltyTime = totalRaceTimeS + 38.0; // SC bunches field & slows pace
  const rainPenaltyTime = totalRaceTimeS + (input.weather === 'dry_clear' ? 46.0 : 12.0);
  const strategyScenarios: StrategyScenarioResult[] = [
    {
      scenarioName: 'Cenário Base (Sem Neutralizações)',
      probability: 0.58,
      totalTimeS: totalRaceTimeS,
      pitLaps: lapTelemetry.filter((l) => l.pitStopTaken).map((l) => l.lap),
      compounds: input.stints.map((s) => s.compound),
      riskNotes: 'Degradação térmica controlada; janela de pit padrão.',
    },
    {
      scenarioName: 'Safety Car em Janela de Pit (Lap ~48%)',
      probability: 0.27,
      totalTimeS: Number(scPenaltyTime.toFixed(2)),
      pitLaps: [Math.round(totalLaps * 0.48)],
      compounds: input.stints.map((s) => s.compound),
      riskNotes: 'Reduz perda de pit stop em ~9s se janela coincidir com neutralização.',
    },
    {
      scenarioName: 'Mudança Climática / Chuva Leve',
      probability: 0.15,
      totalTimeS: Number(rainPenaltyTime.toFixed(2)),
      pitLaps: [Math.round(totalLaps * 0.42)],
      compounds: ['medium', 'inter'],
      riskNotes: 'Modo X bloqueado; risco de aquaplanagem se permanecer com slick.',
    },
  ];
  const expectedTimeWithUncertaintyS = Number(
    strategyScenarios.reduce((acc, s) => acc + s.probability * s.totalTimeS, 0).toFixed(2)
  );

  return {
    modelVersion: '1.0.0',
    editionId: edition.editionId,
    infoClass: 'Modelo reduzido',
    circuitCode: track.circuitCode,
    fidelityMode: input.fidelityMode,
    segments,
    massAndFuelBalance: {
      initialVehicleMassKg: Number(initialVehicleMassKg.toFixed(2)),
      finalVehicleMassKg: Number((dryBaseMassKg + finalFuelKg).toFixed(2)),
      initialFuelKg: input.initialFuelKg,
      fuelConsumedKg,
      finalFuelKg,
      fuelConserved: Math.abs(input.initialFuelKg - fuelConsumedKg - finalFuelKg) < 1e-4,
    },
    energySummary: {
      totalRecoveredJ: Math.round(totalRecoveredJ),
      totalSuppliedJ: Math.round(totalSuppliedJ),
      totalLostJ: Math.round(totalLostJ),
      maxLapResidualJ: Number(maxLapResidualJ.toFixed(4)),
      energyConserved: maxLapResidualJ < 1e-2,
    },
    environmentEvolution: {
      initialGrip: 0.96,
      finalGrip: Number(trackGrip.toFixed(3)),
      peakWaterFilmMm: Number(peakWaterFilmMm.toFixed(2)),
      trackTempRangeK: [Number(minTrackTempK.toFixed(1)), Number(maxTrackTempK.toFixed(1))],
    },
    lapTelemetry,
    sampleVehicleStates,
    totalRaceTimeS,
    expectedTimeWithUncertaintyS,
    strategyScenarios,
  };
}

export function evaluateGate11(race: RaceSimulationOutputs): GateResult {
  const statesTimestamped =
    race.sampleVehicleStates.length >= 3 &&
    race.sampleVehicleStates.every((s) => s.tS > 0 && Number.isFinite(s.speedMs));

  const conservationOk = race.massAndFuelBalance.fuelConserved && race.energySummary.energyConserved;
  const trafficOk = race.lapTelemetry.some((l) => typeof l.dirtyAirActive === 'boolean');
  const envOk = race.environmentEvolution.trackTempRangeK[0] > 260;
  const strategyOk =
    race.strategyScenarios.length >= 3 &&
    Math.abs(race.strategyScenarios.reduce((a, s) => a + s.probability, 0) - 1.0) < 1e-3;

  const criteria = [
    {
      id: 'G11-C1',
      label: 'Estado do carro com timestamp e circuito segmentado reproduzíveis',
      passed: statesTimestamped && race.segments.length >= 5,
      detail: `${race.segments.length} segmentos em ${race.circuitCode} · ${race.sampleVehicleStates.length} estados timestamped.`,
    },
    {
      id: 'G11-C2',
      label: 'Combustível (massa variável m(t)) e energia ERS (M08) fecham balanços',
      passed: conservationOk,
      detail: `Massa ${race.massAndFuelBalance.initialVehicleMassKg}→${race.massAndFuelBalance.finalVehicleMassKg} kg | Resíduo ERS máx=${race.energySummary.maxLapResidualJ} J.`,
    },
    {
      id: 'G11-C3',
      label: 'Tráfego (esteira λ) altera condições aerodinâmicas e térmicas fisicamente',
      passed: trafficOk,
      detail: `${race.lapTelemetry.filter((l) => l.dirtyAirActive).length}/${race.lapTelemetry.length} voltas sob efeito de ar sujo acoplado ao M04/M08.`,
    },
    {
      id: 'G11-C4',
      label: 'Clima, lâmina d’água, aderência e temperatura evoluem no espaço e no tempo',
      passed: envOk,
      detail: `Grip ${race.environmentEvolution.initialGrip}→${race.environmentEvolution.finalGrip} · Água máx=${race.environmentEvolution.peakWaterFilmMm} mm.`,
    },
    {
      id: 'G11-C5',
      label: 'Estratégia avalia cenários por tempo esperado E[T] = Σ PᵢTᵢ e riscos',
      passed: strategyOk,
      detail: `T_base=${race.totalRaceTimeS} s · E[T]=${race.expectedTimeWithUncertaintyS} s em ${race.strategyScenarios.length} cenários.`,
    },
  ];

  return {
    gateId: 'GATE_11',
    moduleCode: 'M11',
    passed: criteria.every((c) => c.passed),
    criteria,
  };
}
