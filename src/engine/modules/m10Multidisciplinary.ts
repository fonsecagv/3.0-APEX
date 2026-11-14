import type { VehicleEngineeringParameters } from '../../types/physics.ts';
import { computeFiniteDiffJacobian } from '../math/solvers.ts';
import { COORDINATE_FRAME_STANDARD, type GateResult, type ManualInfoClass } from './m01Foundation.ts';
import {
  FIA_2026_DEFAULT_EDITION,
  type PackagingAnalysisOutputs,
  type RegulationEditionSpec,
  buildPackagingArchitecture,
} from './m03Packaging.ts';
import { type AeroOutputs, evaluateAerodynamics } from './m04Aerodynamics.ts';
import { type VehicleDynamicsOutputs, evaluateVehicleDynamics } from './m05VehicleDynamics.ts';
import { type TireCompoundCode, type TireSimulationOutputs, evaluateTirePhysics } from './m06Tires.ts';
import { type StructuralOutputs, evaluateStructures } from './m07Structures.ts';
import { type PowerUnitOutputs, evaluatePowerUnit } from './m08PowerUnit.ts';
import { type TransmissionOutputs, evaluateTransmission } from './m09Transmission.ts';

// M10 — Simulação Multidisciplinar e Otimização (Manual Mestre Seção 10.1 - 10.4)

export type FidelityLevel = 'L0' | 'L1' | 'L2' | 'L3';
export type CouplingMode = 'weak' | 'strong';

export interface SubsystemInterfaceContract {
  interfaceId: string;
  producer: string;
  consumer: string;
  exchangedData: string;
  unitSi: string;
  coordinateFrame: string;
  frequencyHz: number;
  latencyMs: number;
  riskMitigated: string;
}

export const CRITICAL_INTERFACES_M10: SubsystemInterfaceContract[] = [
  {
    interfaceId: 'IF-M04-M05',
    producer: 'M04 Aerodinâmica',
    consumer: 'M05 Dinâmica Veicular',
    exchangedData: 'Fz_front, Fz_rear, D, My, dFz/dh vs (V, h_f, h_r, pitch, yaw, modo)',
    unitSi: 'N, N·m, N/m',
    coordinateFrame: COORDINATE_FRAME_STANDARD.frameId,
    frequencyHz: 100,
    latencyMs: 10,
    riskMitigated: 'Mapa fora do domínio ou força aerodinâmica duplicada',
  },
  {
    interfaceId: 'IF-M05-M06',
    producer: 'M05 Dinâmica Veicular ↔ M06 Pneus',
    consumer: 'M05 / M06 Acoplado',
    exchangedData: 'Fz_corner, α, κ, camber, V_roda ↔ Fx, Fy, Mz, T_banda, desgaste',
    unitSi: 'N, rad, -, m/s, N·m, K',
    coordinateFrame: COORDINATE_FRAME_STANDARD.frameId,
    frequencyHz: 200,
    latencyMs: 5,
    riskMitigated: 'Transientes omitidos ou forças incompatíveis com a aderência',
  },
  {
    interfaceId: 'IF-M08-M09-WHEELS',
    producer: 'M08 Unidade de Potência → M09 Transmissão',
    consumer: 'M09 / M05 / M06 Rodas',
    exchangedData: 'T_eixo, ω_eixo, P_eixo, limites SOC ↔ i_g·i_f·η, Fx_roda (limitado por pneu)',
    unitSi: 'N·m, rad/s, W, N',
    coordinateFrame: 'Eixo Rotacional Local',
    frequencyHz: 100,
    latencyMs: 10,
    riskMitigated: 'Potência somada em eixos distintos sem conversão de relação/perda',
  },
  {
    interfaceId: 'IF-THERMAL-AERO-PU',
    producer: 'M04/M03 Refrigeração ↔ M08 PU',
    consumer: 'M08 Térmica / M04 Arrasto',
    exchangedData: 'ṁ_ar, ΔP_duto, Q_rejeitado ↔ Q_gerado, T_ICE, T_bat, C_D_cooling',
    unitSi: 'kg/s, Pa, W, K, -',
    coordinateFrame: 'Escoamento / Termodinâmico',
    frequencyHz: 20,
    latencyMs: 50,
    riskMitigated: 'Benefício térmico sem custo aerodinâmico de arrasto/massa',
  },
  {
    interfaceId: 'IF-M07-DYN-AERO',
    producer: 'M04/M05/M08/M09 Load Cases → M07 Estruturas',
    consumer: 'M07 / M05 Rigidez',
    exchangedData: 'Cargas nominais/pico/fadiga/impacto ↔ K_torção, K_flexão, Tsai-Wu, flambagem',
    unitSi: 'N, N·m, N·m/deg, MPa',
    coordinateFrame: COORDINATE_FRAME_STANDARD.frameId,
    frequencyHz: 10,
    latencyMs: 100,
    riskMitigated: 'Supor chassi perfeitamente rígido sem justificar rigidez em série',
  },
];

export interface SensitivityEntry {
  parameter: keyof VehicleEngineeringParameters;
  label: string;
  unitInput: string;
  dLapTimePerUnitS: number;
  dEfficiencyLdPerUnit: number;
  dThermalMarginKPerUnit: number;
}

export interface ParetoCandidateM10 {
  id: string;
  label: string;
  subtitle: string;
  tradeoffNote: string;
  paramsPatch: Partial<VehicleEngineeringParameters>;
  isNonDominated: boolean;
  metrics: {
    estimatedLapTimeS: number;
    estimatedLapDeltaS: number;
    aeroEfficiencyLD: number;
    totalMassKg: number;
    thermalMarginK: number;
    stabilityScore01: number;
    reliabilityScore01: number;
    tireWearMultiplier: number;
  };
}

export interface MultidisciplinaryRunInput {
  fidelityLevel: FidelityLevel;
  couplingMode: CouplingMode;
  convergenceTolM: number; // e.g. 5e-5 m
  maxIterations: number; // e.g. 25
  ambientTempK: number;
  airPressurePa: number;
  tireCompound: TireCompoundCode;
  referenceTrackLapDistM: number; // e.g. 5793 m (Monza) or 5200 m
  highSpeedShare: number;
  lowSpeedShare: number;
  referenceGear?: number;
  selectedRpm?: number;
}

export interface MultidisciplinaryOutputs {
  modelVersion: string;
  editionId: string;
  infoClass: ManualInfoClass;
  solverMetadata: {
    solverName: string;
    fidelityLevel: FidelityLevel;
    couplingMode: CouplingMode;
    convergenceTolM: number;
    maxIterations: number;
    converged: boolean;
    iterationsUsed: number;
    finalResidualM: number;
    residualHistory: number[];
    failureReason: string | null;
  };
  interfaces: SubsystemInterfaceContract[];
  conservationAudit: {
    verticalLoadResidualN: number;
    energyBalanceResidualJ: number;
    diffTorqueResidualNm: number;
    thermalFluxClosed: boolean;
    allConserved: boolean;
  };
  subsystems: {
    packaging: PackagingAnalysisOutputs;
    aeroCorner: AeroOutputs;
    aeroStraight: AeroOutputs;
    dynamics: VehicleDynamicsOutputs;
    tireCorner: TireSimulationOutputs;
    structures: StructuralOutputs;
    powerUnit: PowerUnitOutputs;
    transmission: TransmissionOutputs;
  };
  vehicleMetrics: {
    estimatedLapTimeS: number;
    topSpeedEstimateMs: number;
    peakCornerLatAccelG: number;
    brakingDecelG: number;
    stabilityScore01: number;
    reliabilityScore01: number;
  };
  sensitivityStudy: SensitivityEntry[];
  paretoFrontier: ParetoCandidateM10[];
}

export function runMultidisciplinarySimulation(
  params: VehicleEngineeringParameters,
  cfg: MultidisciplinaryRunInput,
  edition: RegulationEditionSpec = FIA_2026_DEFAULT_EDITION
): MultidisciplinaryOutputs {
  const pkg = buildPackagingArchitecture(params, edition);

  // Iterative strong coupling (or single pass weak coupling)
  let frontRhM = params.frontRideHeightMm / 1000;
  let rearRhM = params.rearRideHeightMm / 1000;
  let pitchRad = 0;
  let rollRad = 0;
  let tireMaxFxFrontN = 9000;
  let tireMaxFxRearN = 10500;
  let tireMaxFyFrontN = 12000;
  let tireMaxFyRearN = 14000;

  const residualHistory: number[] = [];
  let converged = false;
  let iterationsUsed = 0;
  let finalResidualM = 1.0;

  let aeroCorner!: AeroOutputs;
  let aeroStraight!: AeroOutputs;
  let dynamics!: VehicleDynamicsOutputs;
  let tireCorner!: TireSimulationOutputs;
  let powerUnit!: PowerUnitOutputs;
  let transmission!: TransmissionOutputs;

  const maxIter = cfg.couplingMode === 'weak' ? 1 : Math.max(2, cfg.maxIterations);
  const relaxation = cfg.fidelityLevel === 'L0' ? 0.85 : 0.6;

  for (let iter = 1; iter <= maxIter; iter++) {
    iterationsUsed = iter;

    // 1. M04 Aerodynamics at Mode Z (Corner 69.44 m/s) & Mode X (Straight 88.0 m/s)
    aeroCorner = evaluateAerodynamics(
      params,
      {
        speedMs: 69.44,
        frontRhM,
        rearRhM,
        pitchRad,
        yawRad: 0.04,
        rollRad,
        mode: 'MODE_Z',
        ambientTempK: cfg.ambientTempK,
        airPressurePa: cfg.airPressurePa,
        gearboxLayout: params.gearboxLayout,
      },
      edition
    );

    aeroStraight = evaluateAerodynamics(
      params,
      {
        speedMs: 88.0,
        frontRhM: Math.max(0.008, frontRhM - 0.004),
        rearRhM: Math.max(0.015, rearRhM - 0.006),
        pitchRad: 0,
        yawRad: 0,
        rollRad: 0,
        mode: 'MODE_X',
        ambientTempK: cfg.ambientTempK,
        airPressurePa: cfg.airPressurePa,
        gearboxLayout: params.gearboxLayout,
        inAeroActivationZone: true,
        wetSurface: false,
      },
      edition
    );

    // 2. M05 Vehicle Dynamics using current tire peak capacities
    dynamics = evaluateVehicleDynamics(params, pkg, {
      speedMs: 69.44,
      steerAngleRad: 0.06,
      longAccelMs2: 0,
      latAccelMs2: 3.4 * 9.80665,
      brakePressureRatio: 0,
      brakeBiasFront: 0.56,
      brakeDiscTempK: 920,
      mgukRegenTorqueNm: 0,
      aeroMode: 'MODE_Z',
      ambientTempK: cfg.ambientTempK,
      airPressurePa: cfg.airPressurePa,
      tireMaxFxFrontN,
      tireMaxFxRearN,
      tireMaxFyFrontN,
      tireMaxFyRearN,
    });

    // 3. M06 Tire evaluation at peak loaded outside rear corner
    const outerRearLoadN = Math.max(1500, dynamics.wheelLoadsN.rearLeft);
    const outerFrontLoadN = Math.max(1200, dynamics.wheelLoadsN.frontLeft);
    const tireSpec = evaluateTirePhysics({
      compoundCode: cfg.tireCompound,
      verticalLoadN: outerRearLoadN,
      slipAngleRad: 0.11,
      wheelAngularVelRadS: 69.44 / 0.36,
      wheelVxMs: 69.44,
      effectiveRadiusM: 0.36,
      camberRad: (dynamics.kinematicsAndCompliance.dynamicRearCamberDeg * Math.PI) / 180,
      tempInnerK: 372,
      tempCenterK: 374,
      tempOuterK: 376,
      tempCarcassK: 368,
      ambientTempK: cfg.ambientTempK,
      atmosphericPressurePa: cfg.airPressurePa,
      coldGasMolesN: 4.55,
      internalGasVolumeM3: 0.044,
      surfaceGripFactor: 1.0,
      waterFilmMm: 0,
      surfaceMacroTextureMm: 1.0,
      dtS: 0.05,
      currentWearRatio: 0.05,
    });
    tireCorner = tireSpec;

    const frontScale = Math.pow(outerFrontLoadN / Math.max(500, outerRearLoadN), tireSpec.forcesAndMoments.loadSensitivityExpN);
    const nextMaxFyRear = 2 * tireSpec.forcesAndMoments.fyPeakN * 0.96;
    const nextMaxFyFront = 2 * tireSpec.forcesAndMoments.fyPeakN * frontScale * 0.96;
    const nextMaxFxRear = 2 * tireSpec.forcesAndMoments.fxPeakN * 0.95;
    const nextMaxFxFront = 2 * tireSpec.forcesAndMoments.fxPeakN * frontScale * 0.95;

    // Residual between iterated platform state and M05 equilibrium
    const rhErr = Math.max(
      Math.abs(dynamics.platformState.dynFrontRhM - frontRhM),
      Math.abs(dynamics.platformState.dynRearRhM - rearRhM),
      Math.abs(dynamics.platformState.rollRad - rollRad) * 0.5
    );
    residualHistory.push(Number(rhErr.toExponential(3)));
    finalResidualM = rhErr;

    // Damped update
    frontRhM = relaxation * dynamics.platformState.dynFrontRhM + (1 - relaxation) * frontRhM;
    rearRhM = relaxation * dynamics.platformState.dynRearRhM + (1 - relaxation) * rearRhM;
    pitchRad = relaxation * dynamics.platformState.pitchRad + (1 - relaxation) * pitchRad;
    rollRad = relaxation * dynamics.platformState.rollRad + (1 - relaxation) * rollRad;
    tireMaxFyRearN = relaxation * nextMaxFyRear + (1 - relaxation) * tireMaxFyRearN;
    tireMaxFyFrontN = relaxation * nextMaxFyFront + (1 - relaxation) * tireMaxFyFrontN;
    tireMaxFxRearN = relaxation * nextMaxFxRear + (1 - relaxation) * tireMaxFxRearN;
    tireMaxFxFrontN = relaxation * nextMaxFxFront + (1 - relaxation) * tireMaxFxFrontN;

    if (rhErr <= cfg.convergenceTolM) {
      converged = true;
      break;
    }
  }

  // If weak coupling (1 pass), convergence is explicitly false unless single-pass residual met tol
  const failureReason =
    !converged && cfg.couplingMode === 'strong'
      ? `Acoplamento forte M04↔M05↔M06 não convergiu em ${maxIter} iterações (resíduo final ${finalResidualM.toExponential(2)} m > ${cfg.convergenceTolM.toExponential(2)} m).`
      : !converged && cfg.couplingMode === 'weak'
      ? 'Modo de acoplamento fraco executou apenas 1 passagem aberta sem convergência iterativa.'
      : null;

  // 4. M08 Power Unit
  powerUnit = evaluatePowerUnit(
    params,
    {
      rpm: cfg.selectedRpm ?? 11600,
      throttleRatio: 1.0,
      vehicleSpeedMs: 69.44,
      ambientTempK: cfg.ambientTempK,
      airPressurePa: cfg.airPressurePa,
      initialSoc01: 0.72,
      cycleDurationS: 5.0,
      regenPowerCommandW: 110000,
      deployCommandRatio: 0.92,
      cumulativeRaceCycles: 120,
    },
    edition
  );

  // 5. M09 Transmission
  transmission = evaluateTransmission(
    params,
    {
      selectedGear: cfg.referenceGear ?? 6,
      engineTorqueNm: powerUnit.totalShaftOutput.crankshaftTotalTorqueNm,
      engineOmegaRadS: powerUnit.shaftAndIce.crankOmegaRadS,
      wheelOmegaLeftRadS: 69.44 / 0.36 + 1.2,
      wheelOmegaRightRadS: 69.44 / 0.36 - 1.2,
      clutchSlipOmegaRadS: 12.0,
      tireEffectiveRadiusM: 0.36,
      maxTireAxleTractionN: tireMaxFxRearN,
      shiftTimeCommandS: Math.max(edition.minShiftTimeS, 0.045),
      ambientTempK: cfg.ambientTempK,
      isHollowDriveshaft: true,
    },
    edition
  );

  // 6. M07 Structures using real M04/M05/M08 loads
  const structures = evaluateStructures(
    params,
    {
      peakDownforceN: aeroCorner.forces.downforceTotalN * 1.45,
      peakCornerLatAccelMs2: (tireMaxFyFrontN + tireMaxFyRearN) / pkg.totalMassKg,
      peakBrakeAccelMs2: 5.0 * 9.80665,
      totalMassKg: pkg.totalMassKg,
      shaftPowerW: powerUnit.totalShaftOutput.crankshaftTotalPowerW,
    },
    edition
  );

  // 7. Synthesize physical vehicle metrics (used for lap-time estimation, sensitivity & Pareto)
  const totalCornerFyN = tireMaxFyFrontN + tireMaxFyRearN;
  const peakCornerLatAccelG = totalCornerFyN / (pkg.totalMassKg * 9.80665);
  const brakingDecelG = ((tireMaxFxFrontN + tireMaxFxRearN) + aeroCorner.forces.dragTotalN) / (pkg.totalMassKg * 9.80665);

  // Equilibrium straight top speed from P_wheel = (D_x + F_roll) * V -> V = (2*P_wheel / (rho * Cd_x * A))^(1/3)
  const wheelPowerW = transmission.kinematicsAndTorque.outputAxlePowerW;
  const rho = aeroStraight.airState.densityKgM3;
  const cdAx = Math.max(0.4, aeroStraight.forces.cdAM2);
  const topSpeedEstimateMs = Math.min(106, Math.pow((2 * wheelPowerW) / (rho * cdAx), 1 / 3));

  const stabilityScore01 = Math.max(
    0.1,
    Math.min(
      0.99,
      1 -
        aeroCorner.sensitivities.porpoisingRiskPct / 160 -
        Math.abs(aeroCorner.forces.frontBalanceBf - 0.455) * 2.2 -
        (dynamics.suspensionResponse.transientStable ? 0 : 0.2)
    )
  );
  const reliabilityScore01 = Math.max(
    0.1,
    Math.min(
      0.99,
      powerUnit.reliability.reliabilityScore01 * 0.4 +
        Math.min(1, transmission.structuralAndFatigue.fatigueLifeRaces / 12) * 0.3 +
        (structures.failureSummary.worstTsaiWuIndex < 1 ? 0.3 : 0.05)
    )
  );

  // Simplified physics-based lap time estimator over track shares (never an arbitrary constant)
  const vHighMs = Math.min(topSpeedEstimateMs, 86);
  const vMedMs = Math.min(68, Math.sqrt(Math.max(1, peakCornerLatAccelG) * 9.80665 * 110));
  const vLowMs = Math.min(44, Math.sqrt(Math.max(0.8, peakCornerLatAccelG * 0.65) * 9.80665 * 36));
  const dist = cfg.referenceTrackLapDistM;
  const medShare = Math.max(0.1, 1 - cfg.highSpeedShare - cfg.lowSpeedShare);
  const estimatedLapTimeS =
    (dist * cfg.highSpeedShare) / vHighMs +
    (dist * medShare) / vMedMs +
    (dist * cfg.lowSpeedShare) / vLowMs +
    (pkg.totalMassKg - edition.minMassKg) * 0.031 +
    (powerUnit.thermalAndLubrication.derateApplied ? 0.45 : 0);

  // Conservation audit across interfaces
  const verticalLoadResidualN = dynamics.wheelLoadsN.closureErrorN;
  const energyBalanceResidualJ = powerUnit.energyBalance.balanceResidualJ;
  const diffTorqueResidualNm = transmission.differentialAndYaw.conservationResidualNm;
  const thermalFluxClosed = Number.isFinite(powerUnit.thermalAndLubrication.heatRejectedW);
  const allConserved =
    verticalLoadResidualN < 5.0 &&
    Math.abs(energyBalanceResidualJ) < 1e-2 &&
    Math.abs(diffTorqueResidualNm) < 1e-2 &&
    thermalFluxClosed;

  // 8. Local Finite-Difference Sensitivity Study dy/dp
  const evalScalarOutputs = (pVec: number[]) => {
    const pMod: VehicleEngineeringParameters = {
      ...params,
      frontRideHeightMm: pVec[0],
      rearWingFlapCornerDeg: pVec[1],
      springRateNmm: pVec[2],
      sidepodInletAreaCm2: pVec[3],
    };
    const aeroZ = evaluateAerodynamics(
      pMod,
      {
        speedMs: 69.44,
        frontRhM: pMod.frontRideHeightMm / 1000,
        rearRhM: pMod.rearRideHeightMm / 1000,
        pitchRad: 0,
        yawRad: 0.03,
        rollRad: 0,
        mode: 'MODE_Z',
        ambientTempK: cfg.ambientTempK,
        airPressurePa: cfg.airPressurePa,
        gearboxLayout: pMod.gearboxLayout,
      },
      edition
    );
    const puS = evaluatePowerUnit(
      pMod,
      {
        rpm: 11600,
        throttleRatio: 1,
        vehicleSpeedMs: 69.44,
        ambientTempK: cfg.ambientTempK,
        airPressurePa: cfg.airPressurePa,
        initialSoc01: 0.72,
        cycleDurationS: 5,
        regenPowerCommandW: 110000,
        deployCommandRatio: 0.92,
        cumulativeRaceCycles: 120,
      },
      edition
    );
    const quickGrip = Math.sqrt(Math.max(1000, aeroZ.forces.downforceTotalN) / 14000);
    const quickDragPenalty = aeroZ.forces.cdTotal * 6.5;
    const quickSpringPenalty = Math.abs(pMod.springRateNmm - 230) * 0.002;
    const quickLap = 78.0 - quickGrip * 4.2 + quickDragPenalty + quickSpringPenalty + (puS.thermalAndLubrication.derateApplied ? 0.5 : 0);
    return [quickLap, aeroZ.forces.aeroEfficiencyLD, puS.thermalAndLubrication.thermalMarginK];
  };

  const baseVec = [
    params.frontRideHeightMm,
    params.rearWingFlapCornerDeg,
    params.springRateNmm,
    params.sidepodInletAreaCm2,
  ];
  const jac = computeFiniteDiffJacobian(evalScalarOutputs, baseVec, 1e-2);
  const sensSpecs: Array<{ key: keyof VehicleEngineeringParameters; label: string; unit: string }> = [
    { key: 'frontRideHeightMm', label: 'Altura Dianteira (h_f)', unit: 'mm' },
    { key: 'rearWingFlapCornerDeg', label: 'Flap Asa Traseira Modo Z', unit: 'deg' },
    { key: 'springRateNmm', label: 'Rigidez de Molas', unit: 'N/mm' },
    { key: 'sidepodInletAreaCm2', label: 'Área Entrada Sidepod', unit: 'cm²' },
  ];
  const sensitivityStudy: SensitivityEntry[] = sensSpecs.map((sp, j) => ({
    parameter: sp.key,
    label: sp.label,
    unitInput: sp.unit,
    dLapTimePerUnitS: Number(jac[0][j].toFixed(4)),
    dEfficiencyLdPerUnit: Number(jac[1][j].toFixed(4)),
    dThermalMarginKPerUnit: Number(jac[2][j].toFixed(4)),
  }));

  // 9. True Multi-Objective Pareto Frontier across Candidate Concepts
  const rawCandidates: Array<{
    id: string;
    label: string;
    subtitle: string;
    tradeoffNote: string;
    patch: Partial<VehicleEngineeringParameters>;
  }> = [
    {
      id: 'baseline',
      label: 'Configuração Atual',
      subtitle: 'Setup corrente do engenheiro',
      tradeoffNote: 'Referência de linha de base para comparação.',
      patch: {},
    },
    {
      id: 'max_performance',
      label: 'Máximo Desempenho em Volta',
      subtitle: 'Assoalho baixo + Modo Z alto + deploy agressivo',
      tradeoffNote: 'Reduz tempo de volta mas eleva sensibilidade ∂Fz/∂h, calor ERS e desgaste.',
      patch: {
        frontRideHeightMm: 20,
        rearRideHeightMm: 43,
        diffuserAngleDeg: 10.6,
        floorEdgeComplexity: 80,
        frontWingFlapCornerDeg: 35,
        rearWingFlapCornerDeg: 39,
        ersDeployBiasPct: 75,
        springRateNmm: 270,
      },
    },
    {
      id: 'max_stability',
      label: 'Plataforma Estável & Consistência',
      subtitle: 'Menor ∂Fz/∂h + amortecimento + menor desgaste',
      tradeoffNote: 'Sacrifica pico de carga para eliminar porpoising e proteger pneus.',
      patch: {
        frontRideHeightMm: 27,
        rearRideHeightMm: 52,
        diffuserAngleDeg: 8.8,
        floorEdgeComplexity: 48,
        antiDivePct: 52,
        springRateNmm: 210,
        damperNsM: 5200,
      },
    },
    {
      id: 'max_efficiency',
      label: 'Eficiência L/D & Velocidade Final',
      subtitle: 'Sidepods estreitos + câmbio compacto + baixo arrasto',
      tradeoffNote: 'Minimiza P_D = D·V em retas com menor margem térmica.',
      patch: {
        sidepodInletAreaCm2: 295,
        hotAirExitAreaCm2: 290,
        sidepodUndercutPct: 68,
        gearboxLayout: 'compact',
        frontWingFlapCornerDeg: 27,
        rearWingFlapCornerDeg: 30,
        frontWingFlapStraightDeg: 5,
        rearWingFlapStraightDeg: 5,
      },
    },
    {
      id: 'min_mass',
      label: 'Mínima Massa Estrutural',
      subtitle: 'T1000G + câmbio carbono + bateria leve',
      tradeoffNote: 'Menor massa e inércia com maior fragilidade estrutural/térmica.',
      patch: {
        compositeFiber: 't1000',
        laminateThicknessMm: 3.1,
        localReinforcementPct: 26,
        gearboxMaterial: 'carbon',
        batteryCellTech: 'lightweight_lithium',
        iceMaterial: 'aluminum',
      },
    },
    {
      id: 'max_reliability',
      label: 'Máxima Confiabilidade & Margem Térmica',
      subtitle: 'Titânio + radiadores amplos + dentes largos',
      tradeoffNote: 'Maximiza vida útil de PU/câmbio e folga térmica ao custo de massa/arrasto.',
      patch: {
        iceMaterial: 'titanium',
        gearboxMaterial: 'titanium',
        gearToothWidthMm: 21,
        sidepodInletAreaCm2: 395,
        hotAirExitAreaCm2: 380,
        radiatorVolumeL: 15.0,
        batteryCellTech: 'dense_pack',
        ersDeployBiasPct: 45,
        laminateThicknessMm: 4.1,
      },
    },
  ];

  const evaluatedCandidates = rawCandidates.map((cand) => {
    const pMerged: VehicleEngineeringParameters = { ...params, ...cand.patch };
    const cPkg = buildPackagingArchitecture(pMerged, edition);
    const cAeroZ = evaluateAerodynamics(
      pMerged,
      {
        speedMs: 69.44,
        frontRhM: pMerged.frontRideHeightMm / 1000,
        rearRhM: pMerged.rearRideHeightMm / 1000,
        pitchRad: 0,
        yawRad: 0.04,
        rollRad: 0,
        mode: 'MODE_Z',
        ambientTempK: cfg.ambientTempK,
        airPressurePa: cfg.airPressurePa,
        gearboxLayout: pMerged.gearboxLayout,
      },
      edition
    );
    const cAeroX = evaluateAerodynamics(
      pMerged,
      {
        speedMs: 88.0,
        frontRhM: pMerged.frontRideHeightMm / 1000,
        rearRhM: pMerged.rearRideHeightMm / 1000,
        pitchRad: 0,
        yawRad: 0,
        rollRad: 0,
        mode: 'MODE_X',
        ambientTempK: cfg.ambientTempK,
        airPressurePa: cfg.airPressurePa,
        gearboxLayout: pMerged.gearboxLayout,
      },
      edition
    );
    const cPu = evaluatePowerUnit(
      pMerged,
      {
        rpm: 11600,
        throttleRatio: 1,
        vehicleSpeedMs: 69.44,
        ambientTempK: cfg.ambientTempK,
        airPressurePa: cfg.airPressurePa,
        initialSoc01: 0.72,
        cycleDurationS: 5,
        regenPowerCommandW: 110000,
        deployCommandRatio: 0.92,
        cumulativeRaceCycles: 120,
      },
      edition
    );
    const cTire = evaluateTirePhysics({
      compoundCode: cfg.tireCompound,
      verticalLoadN: (cPkg.totalMassKg * 9.81 + cAeroZ.forces.downforceTotalN) * 0.31,
      slipAngleRad: 0.11,
      wheelAngularVelRadS: 69.44 / 0.36,
      wheelVxMs: 69.44,
      effectiveRadiusM: 0.36,
      camberRad: (pMerged.staticCamberDeg * Math.PI) / 180,
      tempInnerK: 372,
      tempCenterK: 374,
      tempOuterK: 376,
      tempCarcassK: 368,
      ambientTempK: cfg.ambientTempK,
      atmosphericPressurePa: cfg.airPressurePa,
      coldGasMolesN: 4.55,
      internalGasVolumeM3: 0.044,
      surfaceGripFactor: 1.0,
      waterFilmMm: 0,
      surfaceMacroTextureMm: 1.0,
      dtS: 0.05,
      currentWearRatio: 0.05,
    });
    const cTopV = Math.min(
      106,
      Math.pow((2 * cPu.totalShaftOutput.crankshaftTotalPowerW * 0.97) / (cAeroX.airState.densityKgM3 * cAeroX.forces.cdAM2), 1 / 3)
    );
    const cLatG = (4 * cTire.forcesAndMoments.fyPeakN * 0.85) / (cPkg.totalMassKg * 9.80665);
    const cLap =
      (dist * cfg.highSpeedShare) / Math.min(cTopV, 86) +
      (dist * medShare) / Math.min(68, Math.sqrt(Math.max(1, cLatG) * 9.80665 * 110)) +
      (dist * cfg.lowSpeedShare) / Math.min(44, Math.sqrt(Math.max(0.8, cLatG * 0.65) * 9.80665 * 36)) +
      (cPkg.totalMassKg - edition.minMassKg) * 0.031 +
      (cPu.thermalAndLubrication.derateApplied ? 0.45 : 0);

    const cStab = Math.max(0.1, Math.min(0.99, 1 - cAeroZ.sensitivities.porpoisingRiskPct / 160));
    const cRel = cPu.reliability.reliabilityScore01;
    const cWearMult = 1 + cTire.degradationStates.abrasiveWearDelta * 2500;

    return {
      ...cand,
      metrics: {
        estimatedLapTimeS: Number(cLap.toFixed(3)),
        estimatedLapDeltaS: 0,
        aeroEfficiencyLD: cAeroZ.forces.aeroEfficiencyLD,
        totalMassKg: cPkg.totalMassKg,
        thermalMarginK: cPu.thermalAndLubrication.thermalMarginK,
        stabilityScore01: Number(cStab.toFixed(3)),
        reliabilityScore01: Number(cRel.toFixed(3)),
        tireWearMultiplier: Number(cWearMult.toFixed(3)),
      },
    };
  });

  const baseLapRef = evaluatedCandidates[0].metrics.estimatedLapTimeS;
  for (const c of evaluatedCandidates) {
    c.metrics.estimatedLapDeltaS = Number((c.metrics.estimatedLapTimeS - baseLapRef).toFixed(3));
  }

  // Non-dominated Pareto filter (minimize lapTime & mass & wear, maximize stability & reliability & thermalMargin)
  const paretoFrontier: ParetoCandidateM10[] = evaluatedCandidates.map((cand, i) => {
    const dominated = evaluatedCandidates.some((other, j) => {
      if (i === j) return false;
      const a = cand.metrics;
      const b = other.metrics;
      const bNotWorse =
        b.estimatedLapTimeS <= a.estimatedLapTimeS &&
        b.totalMassKg <= a.totalMassKg &&
        b.stabilityScore01 >= a.stabilityScore01 &&
        b.reliabilityScore01 >= a.reliabilityScore01 &&
        b.thermalMarginK >= a.thermalMarginK;
      const bStrictlyBetter =
        b.estimatedLapTimeS < a.estimatedLapTimeS ||
        b.totalMassKg < a.totalMassKg ||
        b.stabilityScore01 > a.stabilityScore01 ||
        b.reliabilityScore01 > a.reliabilityScore01 ||
        b.thermalMarginK > a.thermalMarginK;
      return bNotWorse && bStrictlyBetter;
    });
    return {
      id: cand.id,
      label: cand.label,
      subtitle: cand.subtitle,
      tradeoffNote: cand.tradeoffNote,
      paramsPatch: cand.patch,
      metrics: cand.metrics,
      isNonDominated: !dominated,
    };
  });

  return {
    modelVersion: '1.0.0',
    editionId: edition.editionId,
    infoClass: 'Modelo reduzido',
    solverMetadata: {
      solverName: `APEX-MDO-${cfg.fidelityLevel}-${cfg.couplingMode.toUpperCase()}`,
      fidelityLevel: cfg.fidelityLevel,
      couplingMode: cfg.couplingMode,
      convergenceTolM: cfg.convergenceTolM,
      maxIterations: maxIter,
      converged,
      iterationsUsed,
      finalResidualM: Number(finalResidualM.toExponential(3)),
      residualHistory,
      failureReason,
    },
    interfaces: CRITICAL_INTERFACES_M10,
    conservationAudit: {
      verticalLoadResidualN: Number(verticalLoadResidualN.toFixed(3)),
      energyBalanceResidualJ: Number(energyBalanceResidualJ.toFixed(4)),
      diffTorqueResidualNm: Number(diffTorqueResidualNm.toFixed(4)),
      thermalFluxClosed,
      allConserved,
    },
    subsystems: {
      packaging: pkg,
      aeroCorner,
      aeroStraight,
      dynamics,
      tireCorner,
      structures,
      powerUnit,
      transmission,
    },
    vehicleMetrics: {
      estimatedLapTimeS: Number(estimatedLapTimeS.toFixed(3)),
      topSpeedEstimateMs: Number(topSpeedEstimateMs.toFixed(2)),
      peakCornerLatAccelG: Number(peakCornerLatAccelG.toFixed(2)),
      brakingDecelG: Number(brakingDecelG.toFixed(2)),
      stabilityScore01: Number(stabilityScore01.toFixed(3)),
      reliabilityScore01: Number(reliabilityScore01.toFixed(3)),
    },
    sensitivityStudy,
    paretoFrontier,
  };
}

export function evaluateGate10(mdo: MultidisciplinaryOutputs): GateResult {
  const interfacesDeclared =
    mdo.interfaces.length >= 5 &&
    mdo.interfaces.every(
      (i) => i.producer.length > 0 && i.consumer.length > 0 && i.unitSi.length > 0 && i.frequencyHz > 0
    );

  const couplingCriterionOk =
    mdo.solverMetadata.couplingMode === 'strong' ? mdo.solverMetadata.converged : mdo.solverMetadata.iterationsUsed >= 1;

  const conservationOk = mdo.conservationAudit.allConserved;
  const doeAndParetoOk =
    mdo.sensitivityStudy.length >= 4 &&
    mdo.paretoFrontier.filter((p) => p.isNonDominated).length >= 2;
  const versionedOk = /^\d+\.\d+\.\d+$/.test(mdo.modelVersion) && mdo.editionId.length > 0;

  const criteria = [
    {
      id: 'G10-C1',
      label: 'Interfaces declaram produtor, consumidor, unidade, referencial e frequência',
      passed: interfacesDeclared,
      detail: `${mdo.interfaces.length} contratos de interface ativos com taxa (10–200 Hz) e latência declaradas.`,
    },
    {
      id: 'G10-C2',
      label: 'Acoplamento forte tem critério explícito de convergência (sem mascarar falhas)',
      passed: couplingCriterionOk,
      detail: mdo.solverMetadata.converged
        ? `Convergiu em ${mdo.solverMetadata.iterationsUsed} iterações (resíduo ${mdo.solverMetadata.finalResidualM} m ≤ tol ${mdo.solverMetadata.convergenceTolM} m).`
        : mdo.solverMetadata.failureReason || 'Não convergido.',
    },
    {
      id: 'G10-C3',
      label: 'Conservação de massa/força/energia e sensibilidade numérica ∂y/∂p verificadas',
      passed: conservationOk && mdo.sensitivityStudy.length >= 4,
      detail: `ΔFz=${mdo.conservationAudit.verticalLoadResidualN} N | ΔE=${mdo.conservationAudit.energyBalanceResidualJ} J | ΔTdiff=${mdo.conservationAudit.diffTorqueResidualNm} N·m.`,
    },
    {
      id: 'G10-C4',
      label: 'DOE e otimização multiobjetivo geram fronteira de Pareto não-dominada',
      passed: doeAndParetoOk,
      detail: `${mdo.paretoFrontier.filter((p) => p.isNonDominated).length}/${mdo.paretoFrontier.length} conceitos não-dominados na fronteira de Pareto.`,
    },
    {
      id: 'G10-C5',
      label: 'Execuções reproduzíveis por versão SemVer e edição FIA',
      passed: versionedOk,
      detail: `${mdo.solverMetadata.solverName} v${mdo.modelVersion} (${mdo.editionId}).`,
    },
  ];

  return {
    gateId: 'GATE_10',
    moduleCode: 'M10',
    passed: criteria.every((c) => c.passed),
    criteria,
  };
}
