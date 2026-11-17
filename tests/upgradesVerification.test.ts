import { describe, expect, it } from 'vitest';
import { INITIAL_TEAMS, INITIAL_DRIVERS } from '../src/data/f1Data';
import { LIVERY_2026_CATALOG } from '../src/data/f12026Liveries';
import { REAL_TEAMS_DOSSIERS } from '../src/data/realTeamsDossier';
import { applyTeamDriverReplacement, resolveRaceGridDrivers } from '../src/engine/raceGridAndEvents';
import { FIA_2026_DEFAULT_EDITION } from '../src/engine/modules/m03Packaging';
import {
  computeGearboxStaffSynergy,
  evaluateGate09,
  evaluateTransmission,
} from '../src/engine/modules/m09Transmission';
import { DEFAULT_VEHICLE_PARAMS, solveVehiclePhysics } from '../src/engine/physicsEngine';
import { runMultidisciplinarySimulation } from '../src/engine/modules/m10Multidisciplinary';
import {
  computeMonocoqueChassisCostUsd,
  evaluatePhase7ScopeAlignment,
} from '../src/engine/phase7BoardFeedback';
import { computeSilhouetteGeometry } from '../src/components/onboarding/CarSilhouette2026';
import {
  computeCarRadarProfile,
  computeRdFacilityCapacity,
  computeRivalRadarProfile,
  generateWeeklyEventCard,
  getDefaultChassisSuggestions,
  suggestNextSeasonChassisName,
  validateChassisName,
} from '../src/engine/chassisLaunchAndSeasonLoop';
import { INITIAL_FACILITIES, CIRCUITS } from '../src/data/f1Data';
import { evaluatePowerUnit } from '../src/engine/modules/m08PowerUnit';
import { computeNormalizedOfficialPuCard } from '../src/utils/puBenchHelpers';
import { evaluatePracticeSetup } from '../src/engine/setupFeedbackEngine';

describe('Verificação das 4 Melhorias — Grid 2026, Haas/Câmara, Câmbio Staff + Marchas e Silhueta 2026', () => {
  it('1) Valida Grid F1 2026 atualizado (Cadillac Pérez #11 + Bottas #77 e Haas inicial Ocon + Bearman com Câmara no dossiê)', () => {
    const cadillacLivery = LIVERY_2026_CATALOG.find((c) => c.teamId === 'cadillac');
    expect(cadillacLivery).toBeDefined();
    expect(cadillacLivery?.drivers.map((d) => `${d.shortCode}#${d.number}`)).toEqual(['PER#11', 'BOT#77']);

    const resolved = resolveRaceGridDrivers(INITIAL_TEAMS, INITIAL_DRIVERS);
    expect(resolved.gridDrivers).toHaveLength(24);
    const byTeam = new Map(resolved.normalizedTeams.map((t) => [t.id, t]));
    expect(byTeam.get('cadillac')?.drivers).toEqual(['driver_perez', 'driver_bottas']);
    expect(byTeam.get('haas')?.drivers).toEqual(['driver_ocon', 'driver_bearman']);
    expect(byTeam.get('audi')?.drivers).toEqual(['driver_hulkenberg', 'driver_bortoleto']);
    expect(byTeam.get('alpine')?.drivers).toEqual(['driver_gasly', 'driver_colapinto']);
    expect(byTeam.get('rb')?.drivers).toEqual(['driver_lawson', 'driver_lindblad']);

    const haasDossier = REAL_TEAMS_DOSSIERS.haas;
    const camaraDossier = haasDossier.drivers.find((d) => d.name.includes('Rafael Câmara'));
    expect(camaraDossier).toBeDefined();
    expect(camaraDossier?.contractUntil).toBe(2027);
  });

  it('2) Executa substituição dinâmica Haas (Ocon dispensado -> Rafael Câmara promovido) preservando 24 titulares únicos', () => {
    const result = applyTeamDriverReplacement(
      INITIAL_TEAMS,
      INITIAL_DRIVERS,
      'haas',
      'driver_ocon',
      'f2_camara'
    );

    expect(result.replaced).toBe(true);
    expect(result.gridDrivers).toHaveLength(24);

    const haasTeam = result.teams.find((t) => t.id === 'haas');
    expect(haasTeam?.drivers).toEqual(['f2_camara', 'driver_bearman']);

    const oconAfter = result.drivers.find((d) => d.id === 'driver_ocon');
    expect(oconAfter?.teamId).toBe('free_agent');
    expect(oconAfter?.isFreeAgent).toBe(true);

    const camaraAfter = result.drivers.find((d) => d.id === 'f2_camara');
    expect(camaraAfter?.teamId).toBe('haas');
    expect(camaraAfter?.series).toBe('F1');
    expect(camaraAfter?.isAffiliate).toBe(false);
    expect(camaraAfter?.isFreeAgent).toBe(false);
  });

  it('3) Aplica bônus duplo Chefe de PU + Chefe Mecânico e relações customizadas 1ª-8ª respeitando Gate 09 e limites FIA', () => {
    const synergyHigh = computeGearboxStaffSynergy(
      { name: 'Enrico Gualtieri', rating: 92, specialty: 'Eficiência Térmica & Híbrido' },
      { name: 'Lee Stevenson', rating: 90, specialty: 'Pit Crew & Transmissão' }
    );
    expect(synergyHigh.efficiencyBonus).toBeGreaterThan(0);
    expect(synergyHigh.fatigueBonusRaces).toBe(2);
    expect(synergyHigh.shiftReductionS).toBeGreaterThan(0);

    const customRatios = [2.9, 2.25, 1.82, 1.48, 1.24, 1.08, 0.96, 0.85];
    const operatingInput = {
      selectedGear: 6,
      engineTorqueNm: 620,
      engineOmegaRadS: 1180,
      wheelOmegaLeftRadS: 168,
      wheelOmegaRightRadS: 164,
      clutchSlipOmegaRadS: 6,
      tireEffectiveRadiusM: 0.36,
      maxTireAxleTractionN: 17500,
      shiftTimeCommandS: 0.045,
      ambientTempK: 298.15,
      isHollowDriveshaft: true,
    };

    const baseline = evaluateTransmission(
      { ...DEFAULT_VEHICLE_PARAMS, customGearRatios: customRatios },
      operatingInput,
      FIA_2026_DEFAULT_EDITION
    );

    const tuned = evaluateTransmission(
      {
        ...DEFAULT_VEHICLE_PARAMS,
        customGearRatios: customRatios,
        gearboxStaffTuning: {
          efficiencyBonus: synergyHigh.efficiencyBonus,
          fatigueBonusRaces: synergyHigh.fatigueBonusRaces,
          shiftReductionS: synergyHigh.shiftReductionS,
        },
      },
      operatingInput,
      FIA_2026_DEFAULT_EDITION
    );

    expect(tuned.gearboxSet.gears).toHaveLength(8);
    expect(tuned.gearboxSet.gears[0].ratio).toBeGreaterThan(tuned.gearboxSet.gears[7].ratio);
    expect(tuned.kinematicsAndTorque.gearboxEfficiency).toBeGreaterThanOrEqual(
      baseline.kinematicsAndTorque.gearboxEfficiency
    );
    expect(tuned.kinematicsAndTorque.gearboxEfficiency).toBeLessThanOrEqual(0.985);
    expect(tuned.clutchAndShifts.shiftDurationS).toBeGreaterThanOrEqual(
      FIA_2026_DEFAULT_EDITION.minShiftTimeS
    );
    expect(tuned.structuralAndFatigue.fatigueLifeRaces).toBeGreaterThanOrEqual(
      baseline.structuralAndFatigue.fatigueLifeRaces
    );
    expect(Math.abs(tuned.differentialAndYaw.conservationResidualNm)).toBeLessThan(1e-2);
    expect(evaluateGate09(tuned).passed).toBe(true);
  });

  it('4) Silhueta 2026 reflete altura/rake, ângulo de difusor e transição Modo Z -> Modo X', () => {
    const baseZ = computeSilhouetteGeometry(
      {
        frontRideHeightMm: 24,
        rearRideHeightMm: 46,
        diffuserAngleDeg: 10.5,
        frontWingFlapCornerDeg: 28,
        frontWingFlapStraightDeg: 8,
        rearWingFlapCornerDeg: 34,
        rearWingFlapStraightDeg: 10,
      },
      'mode_z'
    );

    const highRakeX = computeSilhouetteGeometry(
      {
        frontRideHeightMm: 22,
        rearRideHeightMm: 62,
        diffuserAngleDeg: 14,
        frontWingFlapCornerDeg: 28,
        frontWingFlapStraightDeg: 8,
        rearWingFlapCornerDeg: 34,
        rearWingFlapStraightDeg: 10,
      },
      'mode_x'
    );

    expect(highRakeX.rakeMm).toBeGreaterThan(baseZ.rakeMm);
    expect(highRakeX.rakeDeg).toBeGreaterThan(baseZ.rakeDeg);
    expect(highRakeX.rearClearancePx).toBeGreaterThan(baseZ.rearClearancePx);
    expect(highRakeX.diffuserExitY).toBeLessThan(baseZ.diffuserExitY);
    expect(highRakeX.frontFlapAngleDeg).toBeLessThan(baseZ.frontFlapAngleDeg);
    expect(highRakeX.rearFlapAngleDeg).toBeLessThan(baseZ.rearFlapAngleDeg);
  });

  it('5) Parecer da Diretoria (Telas 2/4, 3/4 e 4/4) & custo CFRP respondem ao escopo da Fase 4 e aos sliders', () => {
    const costT800 = computeMonocoqueChassisCostUsd({
      compositeFiber: 't800',
      laminateThicknessMm: 3.4,
      localReinforcementPct: 28,
    });
    const costM40J = computeMonocoqueChassisCostUsd({
      compositeFiber: 'm40j',
      laminateThicknessMm: 3.4,
      localReinforcementPct: 28,
    });
    expect(costM40J).toBeGreaterThan(costT800);

    const runMdo = (patch: Partial<typeof DEFAULT_VEHICLE_PARAMS>) => {
      const params = { ...DEFAULT_VEHICLE_PARAMS, ...patch };
      const mdo = runMultidisciplinarySimulation(
        params,
        {
          fidelityLevel: 'L2',
          couplingMode: 'strong',
          convergenceTolM: 5e-5,
          maxIterations: 25,
          ambientTempK: 298.15,
          airPressurePa: 101325,
          tireCompound: 'medium',
          referenceTrackLapDistM: 5412,
          highSpeedShare: 0.45,
          lowSpeedShare: 0.25,
        },
        FIA_2026_DEFAULT_EDITION
      );
      return { params, mdo };
    };

    const { params: lowWingParams, mdo: lowWingMdo } = runMdo({
      frontWingFlapCornerDeg: 20,
      rearWingFlapCornerDeg: 24,
      diffuserAngleDeg: 7.5,
      springRateNmm: 185,
      damperNsM: 3200,
    });

    const boardPack = {
      headAero: { name: 'Marcus Vance', rating: 90 },
      headPU: { name: 'Gabriel Santos', rating: 88 },
      sportingDirector: { name: 'Frank Bennett', rating: 85 },
      chiefMechanic: { name: 'Marco Bellini', rating: 87 },
    };

    const fbPackaging = evaluatePhase7ScopeAlignment('packaging', {
      philosophyCode: 'high_downforce',
      sidepodConcept: 'downwash',
      params: lowWingParams,
      packaging: lowWingMdo.subsystems.packaging,
      aeroCorner: lowWingMdo.subsystems.aeroCorner,
      aeroStraight: lowWingMdo.subsystems.aeroStraight,
      dynamics: lowWingMdo.subsystems.dynamics,
      tireCorner: lowWingMdo.subsystems.tireCorner,
      structures: lowWingMdo.subsystems.structures,
      powerUnit: lowWingMdo.subsystems.powerUnit,
      ...boardPack,
    });
    expect(fbPackaging.speakers.map((s) => s.speakerName)).toEqual(['Marcus Vance', 'Gabriel Santos']);

    // Em High Downforce com asas muito baixas, Chefe de Aero deve ficar em tom 'angry' (vermelho)
    const fbMonocoqueAngry = evaluatePhase7ScopeAlignment('monocoque', {
      philosophyCode: 'high_downforce',
      sidepodConcept: 'downwash',
      params: lowWingParams,
      packaging: lowWingMdo.subsystems.packaging,
      aeroCorner: lowWingMdo.subsystems.aeroCorner,
      aeroStraight: lowWingMdo.subsystems.aeroStraight,
      dynamics: lowWingMdo.subsystems.dynamics,
      tireCorner: lowWingMdo.subsystems.tireCorner,
      structures: lowWingMdo.subsystems.structures,
      powerUnit: lowWingMdo.subsystems.powerUnit,
      ...boardPack,
    });
    expect(fbMonocoqueAngry.aeroSeverity).toBe('angry');
    expect(fbMonocoqueAngry.status).not.toBe('aligned');
    expect(fbMonocoqueAngry.speakers[0].tone).toBe('angry');

    // Na Tela 4/4 com mola mole (185 N/mm) sob High Downforce, deve acusar plataforma instável
    const fbDynamicsSoft = evaluatePhase7ScopeAlignment('dynamics', {
      philosophyCode: 'high_downforce',
      sidepodConcept: 'downwash',
      params: lowWingParams,
      packaging: lowWingMdo.subsystems.packaging,
      aeroCorner: lowWingMdo.subsystems.aeroCorner,
      aeroStraight: lowWingMdo.subsystems.aeroStraight,
      dynamics: lowWingMdo.subsystems.dynamics,
      tireCorner: lowWingMdo.subsystems.tireCorner,
      structures: lowWingMdo.subsystems.structures,
      powerUnit: lowWingMdo.subsystems.powerUnit,
      ...boardPack,
    });
    expect(fbDynamicsSoft.status).not.toBe('aligned');
    expect(fbDynamicsSoft.speakers.map((s) => s.speakerName)).toEqual(['Marcus Vance', 'Marco Bellini']);
  });

  it('6) Valida nomeação FIA do chassi, bloqueio de rivais/termos impróprios e evolução anual automática', () => {
    expect(validateChassisName('apx-01')).toEqual({ valid: true, normalized: 'APX-01' });
    expect(validateChassisName('AP').valid).toBe(false);
    expect(validateChassisName('APX 01').valid).toBe(false);
    expect(validateChassisName('FERRARI26').valid).toBe(false);
    expect(validateChassisName('MCLAREN-1').valid).toBe(false);
    expect(validateChassisName('MERDA-01').valid).toBe(false);

    const suggestions = getDefaultChassisSuggestions('APX', 'Apex Racing');
    expect(suggestions.length).toBeGreaterThanOrEqual(3);
    suggestions.forEach((s) => expect(validateChassisName(s).valid).toBe(true));

    expect(suggestNextSeasonChassisName('APX-01')).toBe('APX-02');
    expect(suggestNextSeasonChassisName('SF-26')).toBe('SF-27');
    expect(suggestNextSeasonChassisName('FENIX')).toBe('FENIX-02');
  });

  it('7) Valida slots de P&D por nível de fábrica/túnel, radar 6 eixos e cartas semanais do paddock', () => {
    const capBase = computeRdFacilityCapacity(
      INITIAL_FACILITIES.map((f) => ({ ...f, level: 1 }))
    );
    expect(capBase.manufacturingMaxSlots).toBe(2);
    expect(capBase.aeroMaxSlots).toBe(1);
    expect(capBase.aeroEfficiencyBonusPct).toBe(0);

    const capUpgraded = computeRdFacilityCapacity(
      INITIAL_FACILITIES.map((f) =>
        f.id === 'fac_manufacturing'
          ? { ...f, level: 3 }
          : f.id === 'fac_wind_tunnel'
          ? { ...f, level: 2 }
          : f
      )
    );
    expect(capUpgraded.manufacturingMaxSlots).toBe(4);
    expect(capUpgraded.aeroMaxSlots).toBe(2);
    expect(capUpgraded.aeroEfficiencyBonusPct).toBe(5);

    const vehiclePhys = solveVehiclePhysics(DEFAULT_VEHICLE_PARAMS);
    const playerRadar = computeCarRadarProfile(DEFAULT_VEHICLE_PARAMS, vehiclePhys, []);
    expect(playerRadar).toHaveLength(6);
    playerRadar.forEach((ax) => {
      expect(ax.value).toBeGreaterThanOrEqual(30);
      expect(ax.value).toBeLessThanOrEqual(99);
    });

    const rivalRadar = computeRivalRadarProfile(INITIAL_TEAMS[0]);
    expect(rivalRadar).toHaveLength(6);

    const card = generateWeeklyEventCard({
      week: 4,
      chassisName: 'APX-01',
      teamName: 'APEX GP',
      leadDriver: INITIAL_DRIVERS[0],
      headOfAeroName: 'Marcus Vance',
      chiefMechanicName: 'Marco Bellini',
    });
    expect(card.options.length).toBe(2);
    expect(card.title).toContain('APX-01');
  });

  it('8) Calibra maturidade Ano 1 (Fábrica Comprada > Do Zero/Audi/Cadillac, porém abaixo de Ferrari/RBR) e aplica ônus reais', () => {
    const puOut = evaluatePowerUnit(
      DEFAULT_VEHICLE_PARAMS,
      {
        rpm: 11600,
        throttleRatio: 1.0,
        vehicleSpeedMs: 75,
        ambientTempK: 298.15,
        airPressurePa: 101325,
        initialSoc01: 0.72,
        cycleDurationS: 5.0,
        regenPowerCommandW: 110000,
        deployCommandRatio: 0.75,
        cumulativeRaceCycles: 120,
      },
      FIA_2026_DEFAULT_EDITION
    );

    const boughtHybridCard = computeNormalizedOfficialPuCard({
      vehicleParams: DEFAULT_VEHICLE_PARAMS,
      puOutputs: puOut,
      displayedPowerHp: 1068,
      relFinalCalculado: 66,
      iceWeightKg: 142,
      batteryWeightKg: 38,
      fuelPartner: 'shell',
      activeThirdPartyErsName: 'Mercedes',
      requiresLargerSidepods: true,
      engineOrigin: 'bought_factory',
      isYear1Project: true,
    });

    const phoenixCard = computeNormalizedOfficialPuCard({
      vehicleParams: DEFAULT_VEHICLE_PARAMS,
      puOutputs: puOut,
      displayedPowerHp: 1030,
      relFinalCalculado: 74,
      iceWeightKg: 142,
      batteryWeightKg: 35,
      fuelPartner: 'petronas',
      engineOrigin: 'phoenix',
      isYear1Project: true,
    });

    expect(boughtHybridCard.powerScore).toBeGreaterThanOrEqual(79);
    expect(boughtHybridCard.powerScore).toBeLessThanOrEqual(84);
    expect(boughtHybridCard.powerScore).toBeGreaterThanOrEqual(phoenixCard.powerScore);
    expect(boughtHybridCard.riskAnalysis.rawUncappedPowerScore).toBeGreaterThan(boughtHybridCard.powerScore);
    expect(boughtHybridCard.riskAnalysis.developmentCeilingPct).toBe(92);
    expect(boughtHybridCard.riskAnalysis.coolingAeroPenaltyPct).toBe(3.0);
    expect(boughtHybridCard.riskAnalysis.extraMaintenanceCostAnnualM).toBe(4.5);
    expect(boughtHybridCard.riskAnalysis.estimatedSeasonDnfs24Races).toContain('6 a 8 quebras / falhas mecânicas');
    expect(phoenixCard.powerScore).toBeLessThanOrEqual(80);
    expect(phoenixCard.riskAnalysis.developmentCeilingPct).toBe(100);
  });

  it('9) Avalia setup completo em 4 parâmetros e usa driver.attributes.feedback na precisão e convergência', () => {
    const vehiclePhys = solveVehiclePhysics(DEFAULT_VEHICLE_PARAMS);
    const circuit = CIRCUITS[0];
    const targetWindow = {
      idealFrontWing: 28,
      idealRearWing: 34,
      idealStiffness: 6,
      idealPressure: 22.5,
      confidence: 30,
    };

    const alignedSetup = {
      frontWingAngle: 28,
      rearWingAngle: 34,
      suspensionStiffness: 6,
      camberAngle: -2.2,
      tirePressurePsi: 22.5,
      gearRatioBias: 50,
    };

    const misalignedSetup = {
      frontWingAngle: 39,
      rearWingAngle: 20,
      suspensionStiffness: 2,
      camberAngle: -2.2,
      tirePressurePsi: 24.4,
      gearRatioBias: 50,
    };

    const eliteDriverAligned = evaluatePracticeSetup({
      carSetup: alignedSetup,
      setupWindow: targetWindow,
      circuit,
      vehiclePhysics: vehiclePhys,
      driverFeedbackAvg: 93,
      fpRunsDone: 1,
    });

    const rookieDriverAligned = evaluatePracticeSetup({
      carSetup: alignedSetup,
      setupWindow: targetWindow,
      circuit,
      vehiclePhysics: vehiclePhys,
      driverFeedbackAvg: 63,
      fpRunsDone: 1,
    });

    const eliteDriverMisaligned = evaluatePracticeSetup({
      carSetup: misalignedSetup,
      setupWindow: targetWindow,
      circuit,
      vehiclePhysics: vehiclePhys,
      driverFeedbackAvg: 91,
      fpRunsDone: 1,
    });

    expect(eliteDriverAligned.overallLabel).toBe('ÓTIMO');
    expect(eliteDriverAligned.driverCorridorPrecisionDeg).toBe(1.0);
    expect(rookieDriverAligned.driverCorridorPrecisionDeg).toBe(4.0);
    expect(eliteDriverAligned.recommendedConfidenceGain).toBeGreaterThan(
      rookieDriverAligned.recommendedConfidenceGain
    );

    expect(eliteDriverMisaligned.overallLabel).toBe('DESALINHADO');
    expect(eliteDriverMisaligned.parameters.frontWing.status).toBe('misaligned');
    expect(eliteDriverMisaligned.parameters.rearWing.status).toBe('misaligned');
    expect(eliteDriverMisaligned.parameters.suspension.status).toBe('misaligned');
    expect(eliteDriverMisaligned.parameters.tirePressure.status).toBe('misaligned');
    expect(eliteDriverMisaligned.parameters.frontWing.directionHint).toContain('Reduzir');
    expect(eliteDriverMisaligned.parameters.rearWing.directionHint).toContain('Aumentar');
  });
});
