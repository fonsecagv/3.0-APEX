import { describe, expect, it } from 'vitest';
import { getSupplierDnaSpec, ICE_METALLURGY_2026 } from '../src/data/puMaterials2026.ts';
import { buildPackagingArchitecture, FIA_2026_DEFAULT_EDITION } from '../src/engine/modules/m03Packaging.ts';
import { evaluateGate08, evaluatePowerUnit } from '../src/engine/modules/m08PowerUnit.ts';
import { evaluateGate09, evaluateTransmission } from '../src/engine/modules/m09Transmission.ts';
import { DEFAULT_VEHICLE_PARAMS } from '../src/engine/physicsEngine.ts';

describe('M08 — Unidade de Potência Híbrida 2026 & Balanço Exato de Energia', () => {
  it('fecha balanço de energia com resíduo ~ 0 inclusive próximo de SOC cheio e aplica perdas I²R reais', () => {
    const puNominal = evaluatePowerUnit(
      DEFAULT_VEHICLE_PARAMS,
      {
        rpm: 11800,
        throttleRatio: 1.0,
        vehicleSpeedMs: 72,
        ambientTempK: 298.15,
        airPressurePa: 101325,
        initialSoc01: 0.72,
        cycleDurationS: 5.0,
        regenPowerCommandW: 110000,
        deployCommandRatio: 0.92,
        cumulativeRaceCycles: 100,
      },
      FIA_2026_DEFAULT_EDITION
    );
    expect(puNominal.energyBalance.balanceClosed).toBe(true);
    expect(Math.abs(puNominal.energyBalance.balanceResidualJ)).toBeLessThan(1e-2);
    expect(puNominal.ersAndBattery.jouleLossW).toBeGreaterThan(0);
    expect(evaluateGate08(puNominal).passed).toBe(true);

    // High initial SOC + aggressive braking regen must not create energy out of thin air
    const puFullRegen = evaluatePowerUnit(
      DEFAULT_VEHICLE_PARAMS,
      {
        rpm: 9500,
        throttleRatio: 0.35,
        vehicleSpeedMs: 55,
        ambientTempK: 298.15,
        airPressurePa: 101325,
        initialSoc01: 0.95,
        cycleDurationS: 6.0,
        regenPowerCommandW: 250000,
        deployCommandRatio: 0.1,
        cumulativeRaceCycles: 100,
      },
      FIA_2026_DEFAULT_EDITION
    );
    expect(puFullRegen.energyBalance.balanceClosed).toBe(true);
    expect(Math.abs(puFullRegen.energyBalance.balanceResidualJ)).toBeLessThan(1e-2);
    expect(puFullRegen.ersAndBattery.finalSoc01).toBeLessThanOrEqual(1.0);
  });

  it('aplica derating térmico quando dutos dos sidepods são estrangulados sob calor extremo', () => {
    const chokedParams = {
      ...DEFAULT_VEHICLE_PARAMS,
      sidepodInletAreaCm2: 140,
      hotAirExitAreaCm2: 110,
      radiatorVolumeL: 7.5,
    };
    const puHot = evaluatePowerUnit(
      chokedParams,
      {
        rpm: 12200,
        throttleRatio: 1.0,
        vehicleSpeedMs: 42,
        ambientTempK: 315.15, // 42°C ambient
        airPressurePa: 101325,
        initialSoc01: 0.72,
        cycleDurationS: 5.0,
        regenPowerCommandW: 40000,
        deployCommandRatio: 1.0,
        cumulativeRaceCycles: 300,
        coolingAirPenalty01: 0.25,
      },
      FIA_2026_DEFAULT_EDITION
    );
    expect(puHot.thermalAndLubrication.thermalMarginK).toBeLessThan(0);
    expect(puHot.thermalAndLubrication.derateApplied).toBe(true);
  });

  it('acopla relação A/R do turbo e preservação ERS mantendo balanço de energia fechado', () => {
    const tightTurboAggressiveErs = evaluatePowerUnit(
      {
        ...DEFAULT_VEHICLE_PARAMS,
        turboDiameterMm: 82,
        turboArRatio: 0.74,
        ersDeployBiasPct: 86,
        ersPreservationPct: 10,
      },
      {
        rpm: 11600,
        throttleRatio: 1.0,
        vehicleSpeedMs: 75,
        ambientTempK: 298.15,
        airPressurePa: 101325,
        initialSoc01: 0.25,
        cycleDurationS: 5.0,
        regenPowerCommandW: 60000,
        deployCommandRatio: 1.0,
        cumulativeRaceCycles: 120,
      },
      FIA_2026_DEFAULT_EDITION
    );

    const openTurboConservativeErs = evaluatePowerUnit(
      {
        ...DEFAULT_VEHICLE_PARAMS,
        turboDiameterMm: 82,
        turboArRatio: 1.14,
        ersDeployBiasPct: 40,
        ersPreservationPct: 85,
      },
      {
        rpm: 11600,
        throttleRatio: 1.0,
        vehicleSpeedMs: 75,
        ambientTempK: 298.15,
        airPressurePa: 101325,
        initialSoc01: 0.72,
        cycleDurationS: 5.0,
        regenPowerCommandW: 110000,
        deployCommandRatio: 0.5,
        cumulativeRaceCycles: 120,
      },
      FIA_2026_DEFAULT_EDITION
    );

    expect(tightTurboAggressiveErs.turbocharger.spoolLagMs).toBeLessThan(
      openTurboConservativeErs.turbocharger.spoolLagMs
    );
    expect(tightTurboAggressiveErs.ersAndBattery.clippingRiskLevel).toBe('high');
    expect(tightTurboAggressiveErs.ersAndBattery.antiClippingActive).toBe(false);
    expect(openTurboConservativeErs.ersAndBattery.antiClippingActive).toBe(true);
    expect(tightTurboAggressiveErs.energyBalance.balanceClosed).toBe(true);
    expect(openTurboConservativeErs.energyBalance.balanceClosed).toBe(true);
  });

  it('acopla ligas ferrosas FIA 2026 (Art. C15.7.1) no M03 (massa) e M08 (teto térmico e potência)', () => {
    const op = {
      rpm: 11800,
      throttleRatio: 1.0,
      vehicleSpeedMs: 70,
      ambientTempK: 303.15,
      airPressurePa: 101325,
      initialSoc01: 0.72,
      cycleDurationS: 5.0,
      regenPowerCommandW: 80000,
      deployCommandRatio: 0.9,
      cumulativeRaceCycles: 200,
    };

    const pkgFia = buildPackagingArchitecture({ ...DEFAULT_VEHICLE_PARAMS, iceMetallurgyId: 'fia_iron_ams6487' });
    const pkgFerrari = buildPackagingArchitecture({ ...DEFAULT_VEHICLE_PARAMS, iceMetallurgyId: 'ferrari_steel_head', iceMaterial: 'titanium' });
    const pkgAlSi = buildPackagingArchitecture({ ...DEFAULT_VEHICLE_PARAMS, iceMetallurgyId: 'al_si_low_friction' });

    const iceMassFia = pkgFia.packages.find((c) => c.id === 'pkg_pu_ice')!.massKg;
    const iceMassFerrari = pkgFerrari.packages.find((c) => c.id === 'pkg_pu_ice')!.massKg;
    const iceMassAlSi = pkgAlSi.packages.find((c) => c.id === 'pkg_pu_ice')!.massKg;

    expect(iceMassFerrari - iceMassFia).toBeCloseTo(8, 2);
    // FIA Art. 5.4 sets 130 kg minimum core + 35 kg ancillaries = 165 kg floor
    expect(iceMassAlSi).toBeGreaterThanOrEqual(165);
    expect(iceMassAlSi).toBeLessThan(iceMassFia);

    const puFia = evaluatePowerUnit({ ...DEFAULT_VEHICLE_PARAMS, iceMetallurgyId: 'fia_iron_ams6487' }, op);
    const puFerrari = evaluatePowerUnit({ ...DEFAULT_VEHICLE_PARAMS, iceMetallurgyId: 'ferrari_steel_head', iceMaterial: 'titanium' }, op);
    const puAlSi = evaluatePowerUnit({ ...DEFAULT_VEHICLE_PARAMS, iceMetallurgyId: 'al_si_low_friction' }, op);

    expect(puFerrari.thermalAndLubrication.thermalMarginK).toBeGreaterThan(puFia.thermalAndLubrication.thermalMarginK);
    expect(puAlSi.thermalAndLubrication.thermalMarginK).toBeLessThan(puFia.thermalAndLubrication.thermalMarginK);
    expect(puAlSi.shaftAndIce.icePowerW).toBeGreaterThan(puFia.shaftAndIce.icePowerW);
    expect(puFerrari.shaftAndIce.icePowerW).toBeLessThan(puFia.shaftAndIce.icePowerW);
    expect(ICE_METALLURGY_2026.fia_iron_ams6487.pistonAlloyCode).toBe('AMS 6487');
    expect(ICE_METALLURGY_2026.ferrari_steel_head.pistonAlloyCode).toBe('X38CrMoV5-3');
    expect(ICE_METALLURGY_2026.al_si_low_friction.pistonAlloyCode).toBe('15CDV6');
  });

  it('modela química da bateria 2026 (Lítio Leve, Pack Alta Densidade, Ultra Si-C + NCA vs Si-C) mantendo conservação', () => {
    const op = {
      rpm: 11600,
      throttleRatio: 1.0,
      vehicleSpeedMs: 76,
      ambientTempK: 300.15,
      airPressurePa: 101325,
      initialSoc01: 0.78,
      cycleDurationS: 4.5,
      regenPowerCommandW: 65000,
      deployCommandRatio: 0.95,
      cumulativeRaceCycles: 450,
    };

    const pkgLight = buildPackagingArchitecture({ ...DEFAULT_VEHICLE_PARAMS, batteryCellTech: 'lightweight_lithium' });
    const pkgUltra = buildPackagingArchitecture({ ...DEFAULT_VEHICLE_PARAMS, batteryCellTech: 'ultra_solid_state', batterySubChemistry: 'si_c' });
    expect(pkgLight.packages.find((c) => c.id === 'pkg_energy_store')!.massKg).toBe(43); // 35 + 8
    expect(pkgUltra.packages.find((c) => c.id === 'pkg_energy_store')!.massKg).toBe(45); // 37 + 8

    const puNca = evaluatePowerUnit({ ...DEFAULT_VEHICLE_PARAMS, batteryCellTech: 'ultra_solid_state', batterySubChemistry: 'nca' }, op);
    const puSiC = evaluatePowerUnit({ ...DEFAULT_VEHICLE_PARAMS, batteryCellTech: 'ultra_solid_state', batterySubChemistry: 'si_c' }, op);

    expect(puNca.ersAndBattery.batteryCapacityJ).toBeCloseTo(4.8e6, 0);
    expect(puSiC.ersAndBattery.batteryCapacityJ).toBeCloseTo(4.8e6, 0);
    expect(puSiC.ersAndBattery.mgukActualShaftW).toBeGreaterThan(puNca.ersAndBattery.mgukActualShaftW);
    expect(puNca.ersAndBattery.batteryAgeingHealth01).toBeGreaterThan(puSiC.ersAndBattery.batteryAgeingHealth01);
    expect(puNca.thermalAndLubrication.batteryTempK).toBeLessThan(puSiC.thermalAndLubrication.batteryTempK);
    expect(puNca.energyBalance.balanceClosed).toBe(true);
    expect(puSiC.energyBalance.balanceClosed).toBe(true);
  });

  it('mapeia DNA técnico oficial das 5 montadoras 2026 e In-House', () => {
    const ferrari = getSupplierDnaSpec('Ferrari');
    const mercedes = getSupplierDnaSpec('Mercedes');
    const rbFord = getSupplierDnaSpec('Red Bull-Ford');
    const honda = getSupplierDnaSpec('Honda');
    const audi = getSupplierDnaSpec('Audi');
    const inHouse = getSupplierDnaSpec('In-House');

    expect(ferrari.defaultIceMetallurgy).toBe('ferrari_steel_head');
    expect(ferrari.starterUnlockedMaterials).toContain('ferrari_steel_head');
    expect(mercedes.defaultIceMetallurgy).toBe('al_si_low_friction');
    expect(mercedes.defaultBatterySubChem).toBe('nca');
    expect(rbFord.defaultIceMetallurgy).toBe('al_si_low_friction');
    expect(rbFord.defaultBatterySubChem).toBe('si_c');
    expect(honda.defaultIceMetallurgy).toBe('fia_iron_ams6487');
    expect(audi.defaultIceMetallurgy).toBe('fia_iron_ams6487');
    expect(inHouse.starterUnlockedMaterials).not.toContain('ferrari_steel_head');
    expect(inHouse.starterUnlockedMaterials).not.toContain('ultra_solid_state');
  });
});

describe('M09 — Transmissão Discreta 8 Marchas, LSD Conservativo e Semieixos', () => {
  it('conserva torque no diferencial TL + TR = Taxle, limita força ao atrito do pneu e valida edição FIA', () => {
    const tr = evaluateTransmission(
      DEFAULT_VEHICLE_PARAMS,
      {
        selectedGear: 4,
        engineTorqueNm: 640,
        engineOmegaRadS: 1200,
        wheelOmegaLeftRadS: 138,
        wheelOmegaRightRadS: 134,
        clutchSlipOmegaRadS: 8,
        tireEffectiveRadiusM: 0.36,
        maxTireAxleTractionN: 16500,
        shiftTimeCommandS: 0.045,
        ambientTempK: 298.15,
        isHollowDriveshaft: true,
      },
      FIA_2026_DEFAULT_EDITION
    );
    expect(tr.gearboxSet.gears.length).toBe(8);
    expect(tr.differentialAndYaw.conservationResidualNm).toBeLessThan(1e-2);
    expect(tr.kinematicsAndTorque.wheelForceTractionLimitedN).toBeLessThanOrEqual(16500);
    expect(tr.structuralAndFatigue.shaftSafetyFactor).toBeGreaterThan(1.0);
    expect(evaluateGate09(tr).passed).toBe(true);

    // Violating minimum FIA shift time must fail regulatory check & Gate 09
    const illegalShift = evaluateTransmission(
      DEFAULT_VEHICLE_PARAMS,
      {
        selectedGear: 4,
        engineTorqueNm: 640,
        engineOmegaRadS: 1200,
        wheelOmegaLeftRadS: 138,
        wheelOmegaRightRadS: 134,
        clutchSlipOmegaRadS: 8,
        tireEffectiveRadiusM: 0.36,
        maxTireAxleTractionN: 16500,
        shiftTimeCommandS: 0.015, // below 0.035s minimum
        ambientTempK: 298.15,
        isHollowDriveshaft: true,
      },
      FIA_2026_DEFAULT_EDITION
    );
    expect(illegalShift.regulatoryCompliance.compliant).toBe(false);
    expect(evaluateGate09(illegalShift).passed).toBe(false);
  });
});
