import { CASING_ALLOYS } from '../../data/physicsDatabase.ts';
import {
  BATTERY_ARCHITECTURES_2026,
  BATTERY_SUB_CHEMISTRIES,
  ICE_METALLURGY_2026,
  resolveBatteryArchitectureId,
  resolveIceMetallurgyId,
} from '../../data/puMaterials2026.ts';
import type { VehicleEngineeringParameters } from '../../types/physics.ts';
import { FLUID_CATALOG, type GateResult, type ManualInfoClass, computeAirState } from './m01Foundation.ts';
import { FIA_2026_DEFAULT_EDITION, type RegulationEditionSpec } from './m03Packaging.ts';

// M08 — Unidade de Potência (Manual Mestre Seção 8.1 - 8.3)

export interface PowerUnitOperatingInput {
  rpm: number; // crankshaft RPM (e.g. 6000..13500)
  throttleRatio: number; // 0..1
  vehicleSpeedMs: number;
  ambientTempK: number;
  airPressurePa: number;
  initialSoc01: number; // 0..1
  cycleDurationS: number; // evaluation window duration (s)
  regenPowerCommandW: number; // >= 0 harvested during braking in cycle
  deployCommandRatio: number; // 0..1 of MGU-K max
  cumulativeRaceCycles: number; // for cycle/thermal reliability tracking
  coolingAirPenalty01?: number; // e.g. dirty air reduction 0..0.3
}

export interface TurboMapPoint {
  correctedMassFlowKgS: number;
  pressureRatio: number;
  compressorEff: number;
  turbineEff: number;
  turboSpeedRadS: number;
  inSurgeMargin: boolean;
  inChokeMargin: boolean;
}

export interface PowerUnitOutputs {
  modelVersion: string;
  editionId: string;
  infoClass: ManualInfoClass;
  domainStatus: {
    inValidDomain: boolean;
    warnings: string[];
  };
  shaftAndIce: {
    rpm: number;
    crankOmegaRadS: number;
    iceTorqueNm: number;
    icePowerW: number;
    iceThermalEfficiency: number;
    fuelMassFlowKgS: number;
    fuelLowerHeatingValueJKg: number;
    fuelThermalPowerW: number;
    compressionRatioUsed: number;
  };
  turbocharger: {
    turboDiameterM: number;
    rotorInertiaKgM2: number;
    spoolTimeConstantS: number;
    spoolLagMs: number;
    operatingPoint: TurboMapPoint;
  };
  ersAndBattery: {
    mgukRequestedW: number;
    mgukActualShaftW: number;
    mgukTorqueNm: number;
    batteryCapacityJ: number;
    openCircuitVoltageV: number;
    internalResistanceOhm: number;
    busCurrentA: number;
    jouleLossW: number; // P_loss = I^2 * R
    inverterLossW: number;
    initialSoc01: number;
    finalSoc01: number;
    batteryAgeingHealth01: number;
    clippingRiskLevel: 'low' | 'moderate' | 'high';
    antiClippingActive: boolean;
  };
  energyBalance: {
    energyInitialJ: number;
    energyRecoveredJ: number;
    energySuppliedJ: number;
    energyLostJ: number;
    energyFinalJ: number;
    balanceResidualJ: number; // must be ~0 (E_init + E_rec - E_sup - E_loss - E_final)
    balanceClosed: boolean;
  };
  thermalAndLubrication: {
    airMassFlowKgS: number;
    ductPressureDropPa: number;
    coolantFlowKgS: number;
    heatIceW: number;
    heatElectricalW: number;
    heatTotalGeneratedW: number;
    heatRejectedW: number;
    iceTempK: number;
    batteryTempK: number;
    oilTempK: number;
    oilPressurePa: number;
    oilViscosityPaS: number;
    thermalMarginK: number;
    derateApplied: boolean;
  };
  reliability: {
    cycleDamageRatio: number;
    thermalDamageRatio: number;
    vibrationLoadFactor: number;
    estimatedPuLifeRaces: number;
    reliabilityScore01: number;
  };
  totalShaftOutput: {
    crankshaftTotalPowerW: number;
    crankshaftTotalTorqueNm: number; // verified T = P / omega on same crankshaft reference
  };
}

export function evaluatePowerUnit(
  params: VehicleEngineeringParameters,
  input: PowerUnitOperatingInput,
  edition: RegulationEditionSpec = FIA_2026_DEFAULT_EDITION
): PowerUnitOutputs {
  const warnings: string[] = [];
  const dt = Math.max(0.1, input.cycleDurationS);
  const rpm = Math.max(4000, Math.min(15000, input.rpm));
  const crankOmegaRadS = (rpm * 2 * Math.PI) / 60;
  const throttle = Math.max(0, Math.min(1, input.throttleRatio));

  if (params.mgukMaxKw * 1000 > edition.maxMgukPowerW) {
    warnings.push(`MGU-K configurada (${params.mgukMaxKw} kW) excede teto da edição ${edition.editionId} (${edition.maxMgukPowerW / 1000} kW).`);
  }
  if (params.iceCompressionRatio > edition.maxIceCompressionRatio) {
    warnings.push(`Taxa de compressão ${params.iceCompressionRatio}:1 excede limite ${edition.maxIceCompressionRatio}:1.`);
  }

  // 1. Air & eFuel properties from M01
  const air = computeAirState(input.airPressurePa, input.ambientTempK);
  const fuelSpec = FLUID_CATALOG.find((f) => f.fluidType === 'fuel') || FLUID_CATALOG[3];
  const oilSpec = FLUID_CATALOG.find((f) => f.fluidType === 'oil') || FLUID_CATALOG[2];
  const coolantSpec = FLUID_CATALOG.find((f) => f.fluidType === 'coolant') || FLUID_CATALOG[1];

  // 2. Turbocharger compressor/turbine corrected maps & spool dynamics
  const turboDiameterM = params.turboDiameterMm / 1000;
  const turboNorm = Math.max(0, Math.min(1, (params.turboDiameterMm - 78) / 26));
  const turboArRatio = Math.max(0.72, Math.min(1.18, params.turboArRatio ?? 0.92));
  const arOffset = turboArRatio - 0.92; // negative = tighter housing (faster spool), positive = higher top-end flow
  // Rotor inertia scales roughly with D^4 * width
  const rotorInertiaKgM2 = 1.4e-4 * Math.pow(turboDiameterM / 0.09, 4);
  const correctedMassFlowKgS = 0.14 + 0.36 * (rpm / 13000) * throttle * (0.92 + 0.16 * turboNorm + arOffset * 0.12);
  const pressureRatio = Math.min(4.6, 1.15 + 2.85 * Math.pow(rpm / 12000, 1.15) * throttle * (0.94 + 0.12 * turboNorm - arOffset * 0.08));
  const compressorEff = Math.max(0.62, Math.min(0.81, 0.79 - Math.pow(pressureRatio - 3.3, 2) * 0.055));
  const turbineEff = Math.max(0.68, Math.min(0.85, 0.82 - Math.abs(turboNorm - 0.5) * 0.05 - Math.abs(arOffset) * 0.04));
  const turboSpeedRadS = (95000 + turboNorm * 18000 - arOffset * 8000) * (0.4 + 0.6 * throttle) * ((2 * Math.PI) / 60);
  const spoolTimeConstantS = (rotorInertiaKgM2 * turboSpeedRadS) / Math.max(1500, correctedMassFlowKgS * 120000);
  const spoolLagMs = Math.round(Math.max(12, 14 + turboNorm * 38 + spoolTimeConstantS * 45 + arOffset * 32));
  const inSurgeMargin = pressureRatio < 1.3 + correctedMassFlowKgS * 8.2;
  const inChokeMargin = correctedMassFlowKgS < 0.52 * (0.85 + 0.35 * turboNorm + Math.max(0, arOffset) * 0.25);

  // 3. ICE V6 1.6L + Fuel Flow + Compression Efficiency (same crankshaft reference)
  const iceSpec = ICE_METALLURGY_2026[resolveIceMetallurgyId(params.iceMetallurgyId, params.iceMaterial)];
  const compRatio = Math.min(edition.maxIceCompressionRatio, Math.max(13.0, params.iceCompressionRatio));
  const gammaOtto = 1.33;
  const idealOttoEff = 1 - 1 / Math.pow(compRatio, gammaOtto - 1);
  const iceAlloy = CASING_ALLOYS[iceSpec.legacyIceMaterial];
  // Mechanical & combustion real efficiency ratio coupled with friction & Ferrari steel-head peak trade-off
  const combustionQuality =
    0.845 +
    (pressureRatio > 2.5 ? 0.018 : 0) +
    iceSpec.frictionReductionPct * 0.004;
  const rpmEffFactor = 1 - Math.pow((rpm - 11200) / 6500, 2) * 0.06;
  const iceThermalEfficiency = Math.max(0.36, Math.min(0.535, idealOttoEff * combustionQuality * rpmEffFactor));

  const fuelLowerHeatingValueJKg = 43.2e6; // advanced sustainable eFuel
  const maxFuelFlowKgS = 0.0205; // ~74 kg/h 2026 energy flow cap ~ 3000 MJ/h
  const fuelMassFlowKgS = maxFuelFlowKgS * throttle * Math.min(1.0, 0.35 + 0.65 * (rpm / 12000));
  const fuelThermalPowerW = fuelMassFlowKgS * fuelLowerHeatingValueJKg;
  const rawIcePowerW = fuelThermalPowerW * iceThermalEfficiency * iceSpec.peakIcePowerMultiplier;

  // 4. Energy Store (Battery) + MGU-K (strict energy conservation!)
  const batterySpec = BATTERY_ARCHITECTURES_2026[resolveBatteryArchitectureId(params.batteryCellTech)];
  const subChemSpec = BATTERY_SUB_CHEMISTRIES[params.batterySubChemistry ?? 'nca'];
  const batteryCapacityJ = batterySpec.capacityMj * 1e6; // 4.0 MJ / 4.4 MJ / 4.8 MJ
  const initSoc = Math.max(0.05, Math.min(0.95, input.initialSoc01));
  const energyInitialJ = initSoc * batteryCapacityJ;

  // OCV vs SOC curve around 800V nominal
  const openCircuitVoltageV = 735 + 110 * initSoc;
  const rBaseOhm = Math.max(0.004, params.batteryInternalResistanceMOhm / 1000);
  const batteryAgeingHealth01 = Math.max(
    0.84,
    1 - input.cumulativeRaceCycles * 0.00018 * (batterySpec.supportsSubChemistry ? subChemSpec.thermalDegradationFactor : 1.0)
  );

  // Compute thermal loop first order to know operating temps (then apply thermal derating)
  const preservation01 = Math.max(0, Math.min(1, (params.ersPreservationPct ?? 55) / 100));
  const antiClippingActive = preservation01 >= 0.35;
  const deployHeadroomScale = 1 - preservation01 * 0.18;
  const subChemDeployFactor = batterySpec.supportsSubChemistry ? subChemSpec.peakDeployMultiplier : 1.0;
  const deployBias = Math.max(
    0.05,
    Math.min(1, input.deployCommandRatio * (0.65 + (params.ersDeployBiasPct / 100) * 0.45) * deployHeadroomScale * subChemDeployFactor)
  );
  const mgukLimitW = Math.min(edition.maxMgukPowerW, params.mgukMaxKw * 1000);
  const mgukRequestedW = mgukLimitW * deployBias * throttle;

  // Harvest vs Deploy over window dt
  const effRegenRawW = Math.max(0, Math.min(mgukLimitW, input.regenPowerCommandW));
  const inverterEff = 0.965;
  const motorEff = 0.955;

  // Estimate battery temperature & internal resistance dependence on T
  const estBusDeployW = mgukRequestedW / (inverterEff * motorEff);
  const estCurrentDeployA = estBusDeployW / Math.max(500, openCircuitVoltageV);
  const estJouleDeployW = estCurrentDeployA * estCurrentDeployA * rBaseOhm;

  // Sidepod & Cooling Network (coupled with M03/M04 parameters)
  const inletAreaM2 = params.sidepodInletAreaCm2 / 10000;
  const exitAreaM2 = params.hotAirExitAreaCm2 / 10000;
  const ductDepthM = params.sidepodDuctDepthMm / 1000;
  const exitToInlet = exitAreaM2 / Math.max(0.005, inletAreaM2);
  const chokingFactor = Math.min(1.0, 0.45 + 0.55 * exitToInlet);
  const dh = Math.sqrt((4 * inletAreaM2) / Math.PI);
  const kLoss = 1.45 + (ductDepthM / Math.max(0.08, dh)) * 0.25 + (params.sidepodUndercutPct / 100) * 0.55;
  const ductAirSpeedMs = Math.max(10, input.vehicleSpeedMs) * (0.64 * chokingFactor / Math.sqrt(kLoss / 1.8));
  const wakePenalty = 1 - Math.max(0, Math.min(0.45, input.coolingAirPenalty01 ?? 0));
  const airMassFlowKgS = air.densityKgM3 * inletAreaM2 * ductAirSpeedMs * wakePenalty;
  const ductPressureDropPa = kLoss * 0.5 * air.densityKgM3 * ductAirSpeedMs * ductAirSpeedMs;

  const coolantFlowKgS = (params.coolantFlowLpm / 60000) * coolantSpec.densityKgM3;
  const coolantFactor = Math.min(1.14, 0.74 + (params.coolantFlowLpm / 140) * 0.32);
  const maldistribution = 1 - Math.max(0, (params.sidepodUndercutPct - 65) * 0.0025);
  const radEff = Math.min(0.90, (0.60 + (params.radiatorVolumeL / 18) * 0.24) * maldistribution);
  const deltaTCoolantAir = Math.max(25, 386.15 - input.ambientTempK); // 113°C coolant ceiling vs ambient
  const heatRejectedW = airMassFlowKgS * air.cpJKgK * radEff * coolantFactor * deltaTCoolantAir;

  // ~22% of non-shaft fuel energy enters coolant + oil circuits (remainder ~78% exits via exhaust enthalpy)
  const heatIceW = (fuelThermalPowerW - rawIcePowerW) * 0.22;
  const inverterLossW = mgukRequestedW * (1 - inverterEff * motorEff);
  const heatElectricalW = estJouleDeployW + inverterLossW;
  const heatTotalGeneratedW = heatIceW + heatElectricalW;
  const thermalDeficitW = heatTotalGeneratedW - heatRejectedW;

  const iceTempK = Math.max(
    input.ambientTempK + 45,
    376.15 +
      (thermalDeficitW / 1000) * 0.65 +
      (compRatio - 15) * 2.5 +
      (iceSpec.id === 'ferrari_steel_head' ? 6.5 : iceSpec.id === 'al_si_low_friction' ? 3.5 : 2.0)
  );
  const battThermalMassFactor =
    batterySpec.thermalMassFactor * (batterySpec.supportsSubChemistry ? subChemSpec.thermalDegradationFactor : 1.0);
  const batteryTempK = Math.max(
    input.ambientTempK + 10,
    315.15 + (estJouleDeployW / 1000) * 1.4 * battThermalMassFactor + Math.max(0, thermalDeficitW / 1000) * 0.28
  );

  // Oil lubrication state affected by ICE temperature & thermal conductivity
  const oilTempK = Math.max(input.ambientTempK + 55, iceTempK + 8.5 - (iceAlloy.thermalConductivityWmK / 130) * 3.0);
  const oilViscosityPaS = oilSpec.dynamicViscosityPaS * Math.exp(-0.018 * (oilTempK - oilSpec.refTempK));
  const oilPressurePa = Math.max(220000, 520000 * (rpm / 11000) * Math.min(1.2, oilViscosityPaS / oilSpec.dynamicViscosityPaS));

  const iceCeilingK = 389.15 + iceSpec.thermalCeilingDeltaC;
  const thermalMarginK = iceCeilingK - iceTempK;
  const iceDerate = iceTempK > iceCeilingK - 1.0 ? Math.max(0.82, 1 - (iceTempK - (iceCeilingK - 1.0)) * 0.018) : 1.0;
  const battDerate = batteryTempK > 335.15 ? Math.max(0.78, 1 - (batteryTempK - 335.15) * 0.022) : 1.0;
  const derateApplied = iceDerate < 0.999 || battDerate < 0.999;

  const icePowerW = rawIcePowerW * iceDerate;
  const iceTorqueNm = icePowerW / crankOmegaRadS;

  // Enforce exact SOC energy budget (BMS clamps both over-discharge AND over-charge — excess braking goes to disc brakes!)
  const internalResistanceOhm = rBaseOhm * (1 + (1 - batteryAgeingHealth01) * 0.8 + Math.max(0, 300 - batteryTempK) * 0.008);
  const mgukTargetAfterThermalW = mgukRequestedW * battDerate;

  const maxHarvestHeadroomW = Math.max(0, (batteryCapacityJ * 0.98 - energyInitialJ) / dt + mgukTargetAfterThermalW * 0.5);
  const effRegenInputW = Math.min(effRegenRawW, maxHarvestHeadroomW);
  const busPowerRegenW = effRegenInputW * inverterEff * motorEff;

  const actualDeployPowerLimitFromSocW = Math.max(0, (energyInitialJ + busPowerRegenW * dt - 0.03 * batteryCapacityJ) / dt);
  const mgukActualShaftW = Math.min(mgukTargetAfterThermalW, actualDeployPowerLimitFromSocW * inverterEff * motorEff);
  const mgukTorqueNm = mgukActualShaftW / crankOmegaRadS;

  const actualBusSupplyW = mgukActualShaftW / (inverterEff * motorEff);
  const busCurrentA = (actualBusSupplyW - busPowerRegenW) / Math.max(400, openCircuitVoltageV);
  const jouleLossW = busCurrentA * busCurrentA * internalResistanceOhm;
  const actualInverterLossW = mgukActualShaftW * (1 / (inverterEff * motorEff) - 1) + effRegenInputW * (1 - inverterEff * motorEff);

  // Strict Energy Conservation Accounting over dt (accounting for Joule & inverter losses cleanly within BMS envelope)
  const netDeltaJ = (effRegenInputW - mgukActualShaftW - jouleLossW - actualInverterLossW) * dt;
  const clampedDeltaJ = Math.max(-energyInitialJ, Math.min(batteryCapacityJ - energyInitialJ, netDeltaJ));
  const excessHarvestW = netDeltaJ > clampedDeltaJ ? (netDeltaJ - clampedDeltaJ) / dt : 0;
  const finalRegenInputW = Math.max(0, effRegenInputW - excessHarvestW);
  const finalInverterLossW = mgukActualShaftW * (1 / (inverterEff * motorEff) - 1) + finalRegenInputW * (1 - inverterEff * motorEff);

  const energyRecoveredJ = finalRegenInputW * dt;
  const energySuppliedJ = mgukActualShaftW * dt;
  const energyLostJ = (jouleLossW + finalInverterLossW) * dt;
  const energyFinalUnclampedJ = energyInitialJ + energyRecoveredJ - energySuppliedJ - energyLostJ;
  const energyFinalJ = Math.max(0, Math.min(batteryCapacityJ, energyFinalUnclampedJ));
  const balanceResidualJ = energyInitialJ + energyRecoveredJ - energySuppliedJ - energyLostJ - energyFinalJ;
  const balanceClosed = Math.abs(balanceResidualJ) < 1e-2;
  const finalSoc01 = energyFinalJ / batteryCapacityJ;
  const clippingPressureScore = (params.ersDeployBiasPct / 100) * 0.65 + (1 - preservation01) * 0.55 - (finalSoc01 > 0.3 ? 0.15 : 0);
  const clippingRiskLevel: 'low' | 'moderate' | 'high' =
    clippingPressureScore >= 0.78 || (params.ersDeployBiasPct >= 75 && preservation01 <= 0.25)
      ? 'high'
      : clippingPressureScore >= 0.52
      ? 'moderate'
      : 'low';

  if (batteryTempK > 343.15) warnings.push(`Temperatura da bateria ${(batteryTempK - 273.15).toFixed(1)}°C acima do envelope seguro (70°C).`);
  if (iceTempK > 391.15) warnings.push(`Temperatura ICE ${(iceTempK - 273.15).toFixed(1)}°C acima do teto térmico (118°C).`);
  if (oilPressurePa < 280000) warnings.push(`Pressão de óleo baixa (${(oilPressurePa / 1e5).toFixed(2)} bar).`);

  // Reliability tied to cycle history, thermal stress, and vibration
  const thermalDamageRatio = Math.max(0, (iceTempK - 383.15) * 0.015 + (batteryTempK - 333.15) * 0.02);
  const cycleDamageRatio =
    (input.cumulativeRaceCycles / 2500) *
    (1 + Math.max(0, compRatio - 15.5) * 0.25) *
    (iceSpec.id === 'ferrari_steel_head' ? 0.80 : iceSpec.id === 'fia_iron_ams6487' ? 0.96 : 1.05);
  const vibrationLoadFactor = 1.0 + (rpm / 13500) * 0.15 + (iceSpec.id === 'al_si_low_friction' ? 0.06 : 0);
  const totalDamage = (cycleDamageRatio + thermalDamageRatio) * vibrationLoadFactor;
  const estimatedPuLifeRaces = Math.max(1, Math.min(12, Math.round(7 / Math.max(0.45, totalDamage))));
  const reliabilityScore01 = Math.max(0.25, Math.min(0.99, 0.96 - totalDamage * 0.18));

  const crankshaftTotalPowerW = icePowerW + mgukActualShaftW;
  const crankshaftTotalTorqueNm = crankshaftTotalPowerW / crankOmegaRadS;

  return {
    modelVersion: '1.0.0',
    editionId: edition.editionId,
    infoClass: 'Modelo reduzido',
    domainStatus: {
      inValidDomain: warnings.length === 0 && inSurgeMargin && inChokeMargin,
      warnings,
    },
    shaftAndIce: {
      rpm,
      crankOmegaRadS: Number(crankOmegaRadS.toFixed(2)),
      iceTorqueNm: Number(iceTorqueNm.toFixed(2)),
      icePowerW: Math.round(icePowerW),
      iceThermalEfficiency: Number(iceThermalEfficiency.toFixed(4)),
      fuelMassFlowKgS: Number(fuelMassFlowKgS.toFixed(5)),
      fuelLowerHeatingValueJKg,
      fuelThermalPowerW: Math.round(fuelThermalPowerW),
      compressionRatioUsed: compRatio,
    },
    turbocharger: {
      turboDiameterM: Number(turboDiameterM.toFixed(4)),
      rotorInertiaKgM2: Number(rotorInertiaKgM2.toExponential(3)),
      spoolTimeConstantS: Number(spoolTimeConstantS.toFixed(3)),
      spoolLagMs,
      operatingPoint: {
        correctedMassFlowKgS: Number(correctedMassFlowKgS.toFixed(4)),
        pressureRatio: Number(pressureRatio.toFixed(3)),
        compressorEff: Number(compressorEff.toFixed(3)),
        turbineEff: Number(turbineEff.toFixed(3)),
        turboSpeedRadS: Math.round(turboSpeedRadS),
        inSurgeMargin,
        inChokeMargin,
      },
    },
    ersAndBattery: {
      mgukRequestedW: Math.round(mgukRequestedW),
      mgukActualShaftW: Math.round(mgukActualShaftW),
      mgukTorqueNm: Number(mgukTorqueNm.toFixed(2)),
      batteryCapacityJ,
      openCircuitVoltageV: Number(openCircuitVoltageV.toFixed(1)),
      internalResistanceOhm: Number(internalResistanceOhm.toFixed(4)),
      busCurrentA: Number(busCurrentA.toFixed(1)),
      jouleLossW: Math.round(jouleLossW),
      inverterLossW: Math.round(actualInverterLossW),
      initialSoc01: Number(initSoc.toFixed(4)),
      finalSoc01: Number(finalSoc01.toFixed(4)),
      batteryAgeingHealth01: Number(batteryAgeingHealth01.toFixed(4)),
      clippingRiskLevel,
      antiClippingActive,
    },
    energyBalance: {
      energyInitialJ: Math.round(energyInitialJ),
      energyRecoveredJ: Math.round(energyRecoveredJ),
      energySuppliedJ: Math.round(energySuppliedJ),
      energyLostJ: Math.round(energyLostJ),
      energyFinalJ: Math.round(energyFinalJ),
      balanceResidualJ: Number(balanceResidualJ.toFixed(4)),
      balanceClosed,
    },
    thermalAndLubrication: {
      airMassFlowKgS: Number(airMassFlowKgS.toFixed(3)),
      ductPressureDropPa: Math.round(ductPressureDropPa),
      coolantFlowKgS: Number(coolantFlowKgS.toFixed(3)),
      heatIceW: Math.round(heatIceW),
      heatElectricalW: Math.round(heatElectricalW),
      heatTotalGeneratedW: Math.round(heatTotalGeneratedW),
      heatRejectedW: Math.round(heatRejectedW),
      iceTempK: Number(iceTempK.toFixed(2)),
      batteryTempK: Number(batteryTempK.toFixed(2)),
      oilTempK: Number(oilTempK.toFixed(2)),
      oilPressurePa: Math.round(oilPressurePa),
      oilViscosityPaS: Number(oilViscosityPaS.toFixed(5)),
      thermalMarginK: Number(thermalMarginK.toFixed(2)),
      derateApplied,
    },
    reliability: {
      cycleDamageRatio: Number(cycleDamageRatio.toFixed(4)),
      thermalDamageRatio: Number(thermalDamageRatio.toFixed(4)),
      vibrationLoadFactor: Number(vibrationLoadFactor.toFixed(3)),
      estimatedPuLifeRaces,
      reliabilityScore01: Number(reliabilityScore01.toFixed(3)),
    },
    totalShaftOutput: {
      crankshaftTotalPowerW: Math.round(crankshaftTotalPowerW),
      crankshaftTotalTorqueNm: Number(crankshaftTotalTorqueNm.toFixed(2)),
    },
  };
}

export function evaluateGate08(pu: PowerUnitOutputs): GateResult {
  const mapsOk =
    pu.turbocharger.operatingPoint.compressorEff > 0.5 &&
    pu.turbocharger.operatingPoint.inSurgeMargin &&
    pu.turbocharger.operatingPoint.inChokeMargin;

  const shaftPowerIdentityErr = Math.abs(
    pu.totalShaftOutput.crankshaftTotalTorqueNm * pu.shaftAndIce.crankOmegaRadS -
      pu.totalShaftOutput.crankshaftTotalPowerW
  );
  const balanceOk = pu.energyBalance.balanceClosed && shaftPowerIdentityErr < 50;

  const limitsOk =
    pu.ersAndBattery.openCircuitVoltageV <= 1000 &&
    pu.thermalAndLubrication.iceTempK <= 395 &&
    pu.thermalAndLubrication.batteryTempK <= 348 &&
    pu.thermalAndLubrication.oilPressurePa >= 200000;

  const noFreeEnergyOk = pu.ersAndBattery.jouleLossW >= 0 && pu.energyBalance.energyLostJ >= 0;
  const relTiedOk = Number.isFinite(pu.reliability.cycleDamageRatio) && pu.reliability.estimatedPuLifeRaces >= 1;

  const criteria = [
    {
      id: 'G08-C1',
      label: 'Mapas cobrem envelope (compressor, turbina, MGU-K, bateria) com limites explícitos',
      passed: mapsOk,
      detail: `Compressor PR=${pu.turbocharger.operatingPoint.pressureRatio}, ηc=${(pu.turbocharger.operatingPoint.compressorEff * 100).toFixed(1)}%, Surge/Choke OK.`,
    },
    {
      id: 'G08-C2',
      label: 'Balanços de potência (P=T·ω no mesmo eixo) e energia (E_init+E_rec-E_sup-E_loss=E_final) fecham',
      passed: balanceOk,
      detail: `P_eixo=${(pu.totalShaftOutput.crankshaftTotalPowerW / 1000).toFixed(1)} kW | Resíduo energético=${pu.energyBalance.balanceResidualJ} J.`,
    },
    {
      id: 'G08-C3',
      label: 'Temperaturas, correntes, tensões e pressões respeitam limites',
      passed: limitsOk,
      detail: `T_ICE=${(pu.thermalAndLubrication.iceTempK - 273.15).toFixed(1)}°C, T_Bat=${(pu.thermalAndLubrication.batteryTempK - 273.15).toFixed(1)}°C, V=${pu.ersAndBattery.openCircuitVoltageV}V, P_óleo=${(pu.thermalAndLubrication.oilPressurePa / 1e5).toFixed(1)} bar.`,
    },
    {
      id: 'G08-C4',
      label: 'Gestão não cria energia nem ignora perdas resistivas/conversão',
      passed: noFreeEnergyOk,
      detail: `Perdas Joule I²R=${pu.ersAndBattery.jouleLossW} W + Inversor=${pu.ersAndBattery.inverterLossW} W contabilizadas.`,
    },
    {
      id: 'G08-C5',
      label: 'Confiabilidade ligada ao histórico de carga, ciclos e temperatura',
      passed: relTiedOk,
      detail: `Dano ciclo=${pu.reliability.cycleDamageRatio} · Vida estimada=${pu.reliability.estimatedPuLifeRaces} GPs.`,
    },
  ];

  return {
    gateId: 'GATE_08',
    moduleCode: 'M08',
    passed: criteria.every((c) => c.passed),
    criteria,
  };
}
