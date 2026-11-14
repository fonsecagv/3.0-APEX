import type { VehicleEngineeringParameters, VehiclePhysicsOutputs } from '../types/physics.ts';
import type { ProcessedCircuitPackage } from './types.ts';

export interface SegmentPhysicsEvaluation {
  segmentIndex: number;
  segmentName: string;
  lengthM: number;
  aeroModeUsed: 'MODE_X' | 'MODE_Z';
  entrySpeedKmh: number;
  apexOrPeakSpeedKmh: number;
  exitSpeedKmh: number;
  lateralG: number;
  brakingG: number;
  downforceN: number;
  dragN: number;
  tireThermalLoadDeltaK: number;
  tireWearFactor: number;
  ersDeployKj: number;
  ersHarvestKj: number;
  coolingAirflowFactor: number;
  suspensionBumpRmsMm: number;
  stabilityRisk01: number;
  segmentTimeSec: number;
}

export interface TrackPhysicsEvaluation {
  circuitCode: string;
  seasonYear: number;
  airDensityKgM3: number;
  totalPredictedLapTimeSec: number;
  modeXFractionPct: number;
  peakStraightSpeedKmh: number;
  minApexSpeedKmh: number;
  maxLateralG: number;
  totalErsDeployKjPerLap: number;
  totalErsHarvestKjPerLap: number;
  netErsBalanceKjPerLap: number;
  coolingDemandIndex01: number;
  suspensionKerbStress01: number;
  tireStressIndex01: number;
  stabilityIndex01: number;
  segments: SegmentPhysicsEvaluation[];
}

const G_ACCEL = 9.80665;

export function computeAltitudeAirDensityKgM3(altitudeM: number, ambientTempK: number): number {
  // Barometric troposphere ISA approximation adjusted for ambient temperature
  const p0 = 101325;
  const pressurePa = p0 * Math.pow(Math.max(0.5, 1 - 2.25577e-5 * altitudeM), 5.25588);
  const R_air = 287.058;
  return Number((pressurePa / (R_air * Math.max(250, ambientTempK))).toFixed(4));
}

export function evaluateTrackPhysics(
  pkg: ProcessedCircuitPackage,
  params: VehicleEngineeringParameters,
  physics: VehiclePhysicsOutputs
): TrackPhysicsEvaluation {
  const { metadata, segments, trackCharacteristics } = pkg;
  const airDensity = computeAltitudeAirDensityKgM3(
    trackCharacteristics.altitudeM,
    metadata.ambientTempK
  );

  const clZ = Math.max(1.8, physics.cornerMode.clTotal);
  const cdZ = Math.max(0.55, physics.cornerMode.cdTotal);
  const clX = Math.max(0.85, physics.straightMode.clTotal);
  const cdX = Math.max(0.40, physics.straightMode.cdTotal);
  const frontalAreaM2 = 1.48;

  const massKg = Math.max(750, physics.totalMassKg);
  const wheelPowerW = Math.max(500000, physics.totalWheelPowerKw * 1000);
  const baseMechMu = 1.45 + ((physics.summary.cornerGripScore - 70) / 100) * 0.28;

  const evaluatedSegments: SegmentPhysicsEvaluation[] = [];
  let totalTimeSec = 0;
  let totalDeployKj = 0;
  let totalHarvestKj = 0;
  let modeXLength = 0;
  let peakStraightSpeedKmh = 0;
  let minApexSpeedKmh = 400;
  let maxLateralG = 0;
  let prevExitSpeedMs = 68;

  for (const seg of segments) {
    const isModeX = seg.aeroModeAllowed === 'MODE_X';
    if (isModeX) modeXLength += seg.lengthM;

    const cl = isModeX ? clX : clZ;
    const cd = isModeX ? cdX : cdZ;

    // Cornering limit speed via iterative aerodynamic downforce + mechanical grip equilibrium
    const curvature = Math.max(0, seg.curvatureInvM);
    let cornerLimitMs = 105;
    if (curvature > 0.0012) {
      const muEffective = baseMechMu * seg.surfaceGripFactor;
      let vGuess = 55;
      for (let iter = 0; iter < 5; iter++) {
        const q = 0.5 * airDensity * vGuess * vGuess;
        const downforce = q * cl * frontalAreaM2;
        const normalLoad = Math.max(massKg * 0.6, massKg * G_ACCEL + downforce - massKg * G_ACCEL * Math.sin(seg.slopeRad));
        const maxLatForce = muEffective * normalLoad;
        vGuess = Math.sqrt(Math.max(250, maxLatForce / (massKg * curvature)));
      }
      cornerLimitMs = Math.min(102, Math.max(17, vGuess));
    }

    // Power-limited top speed on segment: P = (0.5 * rho * Cd * A * v^2 + m * g * sin(theta) + Crr * m * g) * v
    const dragDenom = Math.max(0.25, 0.5 * airDensity * cd * frontalAreaM2);
    const gradeForce = massKg * G_ACCEL * Math.sin(seg.slopeRad);
    const rollingRes = 0.014 * massKg * G_ACCEL;
    const effectivePowerW = wheelPowerW * (isModeX ? 1.0 : 0.88);
    let vPowerMax = Math.cbrt(effectivePowerW / dragDenom);
    if (gradeForce + rollingRes > 0) {
      vPowerMax = Math.max(60, vPowerMax - (gradeForce + rollingRes) / 380);
    }

    const entrySpeedMs = prevExitSpeedMs;
    const targetSpeedMs = isModeX
      ? Math.min(vPowerMax, entrySpeedMs + Math.sqrt(2 * 6.5 * seg.lengthM) * 0.48)
      : Math.min(vPowerMax, cornerLimitMs);

    const avgSpeedMs = Math.max(18, (entrySpeedMs + targetSpeedMs) * 0.52);
    const segTime = seg.lengthM / avgSpeedMs;

    const qAvg = 0.5 * airDensity * avgSpeedMs * avgSpeedMs;
    const downforceN = qAvg * cl * frontalAreaM2;
    const dragN = qAvg * cd * frontalAreaM2;
    const lateralG = (avgSpeedMs * avgSpeedMs * curvature) / G_ACCEL;
    const brakingG =
      entrySpeedMs > targetSpeedMs
        ? Math.min(5.6, (entrySpeedMs * entrySpeedMs - targetSpeedMs * targetSpeedMs) / (2 * Math.max(25, seg.lengthM) * G_ACCEL))
        : 0;

    // 2026 ERS: Deploy along Mode X / high-throttle straights, harvest in braking zones
    const deployFraction = (params.ersDeployBiasPct ?? 60) / 100;
    const ersDeployKj = isModeX
      ? Number(((segTime * (params.mgukMaxKw ?? 350) * 0.58 * deployFraction)).toFixed(1))
      : Number(((segTime * (params.mgukMaxKw ?? 350) * 0.14)).toFixed(1));
    const ersHarvestKj =
      brakingG > 0.85
        ? Number((brakingG * 165 * (0.7 + 0.3 * (1 - deployFraction))).toFixed(1))
        : Number((curvature > 0.015 ? 45 : 15).toFixed(1));

    const coolingAirflowFactor = Number(
      ((airDensity / 1.225) * (avgSpeedMs / 65) * (0.75 + (params.sidepodInletAreaCm2 / 400) * 0.35)).toFixed(2)
    );
    const suspensionBumpRmsMm = Number(
      ((trackCharacteristics.bumpinessIndex * 6.5 + trackCharacteristics.kerbSeverity * curvature * 80) *
        (240 / Math.max(120, params.springRateNmm))).toFixed(2)
    );
    const stabilityRisk01 = Number(
      Math.min(
        1,
        Math.max(
          0,
          (physics.porpoisingRiskPct / 100) * (isModeX ? 0.85 : 0.35) +
            (metadata.windSpeedMs / 15) * 0.25 +
            Math.abs(seg.slopeRad) * 2.2
        )
      ).toFixed(3)
    );

    const tireThermalLoadDeltaK = Number(
      ((lateralG * 2.1 + brakingG * 1.4) * (metadata.tireWearSeverity / 3.5)).toFixed(2)
    );
    const tireWearFactor = Number(
      (0.75 + lateralG * 0.14 + brakingG * 0.08 + (1 - seg.surfaceGripFactor) * 0.9).toFixed(3)
    );

    const entryKmh = Math.round(entrySpeedMs * 3.6);
    const apexOrPeakKmh = Math.round(targetSpeedMs * 3.6);
    const exitKmh = Math.round(
      (isModeX ? targetSpeedMs : Math.min(vPowerMax, targetSpeedMs * 1.08)) * 3.6
    );

    if (isModeX && apexOrPeakKmh > peakStraightSpeedKmh) peakStraightSpeedKmh = apexOrPeakKmh;
    if (!isModeX && apexOrPeakKmh < minApexSpeedKmh) minApexSpeedKmh = apexOrPeakKmh;
    if (lateralG > maxLateralG) maxLateralG = lateralG;

    totalTimeSec += segTime;
    totalDeployKj += ersDeployKj;
    totalHarvestKj += ersHarvestKj;
    prevExitSpeedMs = exitKmh / 3.6;

    evaluatedSegments.push({
      segmentIndex: seg.segmentIndex,
      segmentName: seg.segmentName,
      lengthM: seg.lengthM,
      aeroModeUsed: seg.aeroModeAllowed,
      entrySpeedKmh: entryKmh,
      apexOrPeakSpeedKmh: apexOrPeakKmh,
      exitSpeedKmh: exitKmh,
      lateralG: Number(lateralG.toFixed(2)),
      brakingG: Number(brakingG.toFixed(2)),
      downforceN: Math.round(downforceN),
      dragN: Math.round(dragN),
      tireThermalLoadDeltaK,
      tireWearFactor,
      ersDeployKj,
      ersHarvestKj,
      coolingAirflowFactor,
      suspensionBumpRmsMm,
      stabilityRisk01,
      segmentTimeSec: Number(segTime.toFixed(3)),
    });
  }

  // Anchor theoretical segment sum smoothly around realistic GP race-lap scale
  const calibratedLapSec = Number((metadata.baseLapTimeSec * 0.55 + totalTimeSec * 0.45).toFixed(3));
  const avgCoolingFactor =
    evaluatedSegments.reduce((s, e) => s + e.coolingAirflowFactor, 0) /
    Math.max(1, evaluatedSegments.length);
  const coolingDemandIndex01 = Number(
    Math.min(1, Math.max(0.15, (metadata.ambientTempK - 275) / 38 + (1.0 - avgCoolingFactor) * 0.45)).toFixed(3)
  );
  const suspensionKerbStress01 = Number(
    Math.min(1, trackCharacteristics.kerbSeverity * 0.65 + trackCharacteristics.bumpinessIndex * 0.35).toFixed(3)
  );
  const tireStressIndex01 = Number(
    Math.min(1, (metadata.tireWearSeverity / 5) * 0.7 + (maxLateralG / 5.5) * 0.3).toFixed(3)
  );
  const stabilityIndex01 = Number(
    Math.max(
      0,
      1 -
        evaluatedSegments.reduce((s, e) => s + e.stabilityRisk01, 0) /
          Math.max(1, evaluatedSegments.length)
    ).toFixed(3)
  );

  return {
    circuitCode: metadata.circuitCode,
    seasonYear: metadata.seasonYear,
    airDensityKgM3: airDensity,
    totalPredictedLapTimeSec: calibratedLapSec,
    modeXFractionPct: Math.round((modeXLength / Math.max(1, metadata.officialLengthM)) * 100),
    peakStraightSpeedKmh: Math.max(295, peakStraightSpeedKmh),
    minApexSpeedKmh: minApexSpeedKmh === 400 ? 75 : minApexSpeedKmh,
    maxLateralG: Number(maxLateralG.toFixed(2)),
    totalErsDeployKjPerLap: Math.round(totalDeployKj),
    totalErsHarvestKjPerLap: Math.round(totalHarvestKj),
    netErsBalanceKjPerLap: Math.round(totalHarvestKj - totalDeployKj),
    coolingDemandIndex01,
    suspensionKerbStress01,
    tireStressIndex01,
    stabilityIndex01,
    segments: evaluatedSegments,
  };
}
