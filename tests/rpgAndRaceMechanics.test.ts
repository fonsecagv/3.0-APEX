import { describe, it, expect } from 'vitest';
import { INITIAL_DRIVERS, INITIAL_STAFF, INITIAL_TEAMS } from '../src/data/f1Data';
import {
  computeDriverXpGain,
  applyDriverXpAndEvolution,
  getStaffMaxLevelForCentral,
  computeStaffXpGain,
  applyStaffXpAndEvolution,
  getFacilityRpgSummary,
  getStaffFacilityLimitFeedback,
} from '../src/engine/rpgProgressionEngine';
import {
  stepRaceSimulationTick,
  computeLapErrorRiskPct,
  evaluateRacePitWallRadio,
  isWetWeather,
} from '../src/engine/raceGridAndEvents';
import { resolveActiveChiefForCadType } from '../src/engine/engineeringFeedbackEngine';
import type { Driver, LiveCarState, StaffMember } from '../src/types/f1';

const makeTestCar = (overrides: Partial<LiveCarState>): LiveCarState => ({
  driverId: 'driver_bortoleto',
  driverName: 'Gabriel Bortoleto',
  shortCode: 'BOR',
  driverNumber: 5,
  teamId: 'apex',
  teamColor: '#E10600',
  isPlayer: true,
  position: 5,
  lap: 10,
  distanceOnLap: 0.4,
  totalDistance: 9.4,
  currentLapTime: 35,
  lastLapTime: 84,
  bestLapTime: 83.2,
  gapToLeaderSec: 4.5,
  gapToAheadSec: 1.2,
  tireCompound: 'soft',
  tireAgeLaps: 8,
  tireWearPercent: 28,
  tireGrainingBlistering: 0,
  tireTempC: 94,
  socPercent: 75,
  batteryTempC: 54,
  engineMode: 'balanced',
  aeroMode: 'mode_z',
  paceMode: 'balanced',
  fuelMixMode: 'standard',
  fuelRemainingKg: 60,
  fuelInitialKg: 100,
  fuelBurnKgPerLap: 1.7,
  fuelSavingPenaltySec: 0,
  eFuelRating: 82,
  inPitLane: false,
  pitStopsDone: 0,
  pitDurationSec: 0,
  hasDerating: false,
  damagePercent: 0,
  status: 'running',
  iceTempC: 101,
  ...overrides,
});

describe('RPG Progression Engine (Pilotos, Staff Técnico & Instalações)', () => {
  it('calcula XP de piloto conforme curva de idade, simulador, moral e bônus jovens Central Nv.2+', () => {
    const youngDriver: Driver = {
      ...INITIAL_DRIVERS[0],
      id: 'test_young',
      name: 'Jovem Talento',
      age: 20,
      mentality: 90,
      potential: 94,
      rpgLevel: 2,
      xp: 40,
      attributes: { ...INITIAL_DRIVERS[0].attributes, pace: 78, cornering: 77, consistency: 76, braking: 77 },
    };

    const xpLowSim = computeDriverXpGain({
      driver: youngDriver,
      trackTimePoints: 18,
      simFacilityLevel: 1,
      teamCentralLevel: 1,
    });
    const xpHighSim = computeDriverXpGain({
      driver: youngDriver,
      trackTimePoints: 18,
      simFacilityLevel: 5,
      teamCentralLevel: 3,
    });

    expect(xpLowSim.youthAcademyBonusApplied).toBe(false);
    expect(xpHighSim.youthAcademyBonusApplied).toBe(true);
    expect(xpHighSim.simMultiplier).toBe(2.5);
    expect(xpHighSim.xpGain).toBeGreaterThan(xpLowSim.xpGain);
  });

  it('evolui atributos mentais de veterano 30+ enquanto físico estagna ou decai aos 35+', () => {
    const veteran: Driver = {
      ...INITIAL_DRIVERS[0],
      id: 'test_vet',
      name: 'Veterano F1',
      age: 37,
      mentality: 78,
      potential: 92,
      rpgLevel: 5,
      xp: 85,
      attributes: {
        ...INITIAL_DRIVERS[0].attributes,
        pace: 85,
        reactionTime: 84,
        feedback: 86,
        consistency: 87,
        tireManagement: 85,
        composure: 88,
      },
    };

    const res = applyDriverXpAndEvolution(veteran, 30, { simFacilityLevel: 3 });
    expect(res.leveledUp).toBe(true);
    expect(res.updatedDriver.rpgLevel).toBe(6);
    expect(res.updatedDriver.attributes.feedback).toBe(87);
    expect(res.updatedDriver.attributes.consistency).toBe(88);
    expect(res.updatedDriver.attributes.pace).toBe(84);
    expect(res.updatedDriver.attributes.reactionTime).toBe(83);
  });

  it('bloqueia evolução de Staff pelo teto da Central da Equipe (fac_team_hq) e mantém fac_scouting restrita ao mercado', () => {
    expect(getStaffMaxLevelForCentral(1).maxStaffLevel).toBe(2);
    expect(getStaffMaxLevelForCentral(2).maxStaffLevel).toBe(3);
    expect(getStaffMaxLevelForCentral(3).maxStaffLevel).toBe(4);
    expect(getStaffMaxLevelForCentral(4).maxStaffLevel).toBe(5);
    expect(getStaffMaxLevelForCentral(5).maxStaffLevel).toBe(5);

    const baseMember: StaffMember = {
      ...INITIAL_STAFF[0],
      rpgLevel: 2,
      xp: 90,
      rating: 75,
    };

    const xpInfo = computeStaffXpGain({
      staffMember: baseMember,
      teamCentralLevel: 1,
      constructorPosition: 2,
      bankBalance: 15_000_000,
      costCapSpent: 60_000_000,
      costCapLimit: 135_000_000,
      principalBackground: 'chief_engineer',
    });
    expect(xpInfo.xpGain).toBeGreaterThan(0);

    // Central Nv.1 limita staff ao Nv.2
    const capped = applyStaffXpAndEvolution(baseMember, 40, 1);
    expect(capped.leveledUp).toBe(false);
    expect(capped.cappedByFacility).toBe(true);
    expect(capped.updatedMember.rpgLevel).toBe(2);

    const limitFeedback = getStaffFacilityLimitFeedback(capped.updatedMember, 1);
    expect(limitFeedback.isLimited).toBe(true);
    expect(limitFeedback.quote).toContain('Central da Equipe Nível 1');

    // Central Nv.3 libera subida para Nv.3
    const promoted = applyStaffXpAndEvolution(baseMember, 40, 3);
    expect(promoted.leveledUp).toBe(true);
    expect(promoted.updatedMember.rpgLevel).toBe(3);

    // fac_scouting não impulsiona evolução de staff atual
    const scoutSummary = getFacilityRpgSummary('fac_scouting', 4);
    expect(scoutSummary).toContain('não evolui o staff atual');
    const hqSummary = getFacilityRpgSummary('fac_team_hq', 2);
    expect(hqSummary).toContain('Teto do Staff: Nível 3/5');
  });
});

describe('Race Mechanics (Chuva Lock, Blistering >50C, Thermal Derating >=115C, Risco de Erro & Rádio)', () => {
  it('trava modo de ritmo em balanced quando pista está molhada (light_rain / heavy_rain)', () => {
    expect(isWetWeather('light_rain')).toBe(true);
    expect(isWetWeather('heavy_rain')).toBe(true);
    expect(isWetWeather('sunny')).toBe(false);

    const car = makeTestCar({
      paceMode: 'attack',
      tireCompound: 'inter',
    });

    const tick = stepRaceSimulationTick({
      cars: [car],
      drivers: INITIAL_DRIVERS,
      allTeams: INITIAL_TEAMS,
      raceSpeed: 1,
      totalLaps: 57,
      baseLapTimeSec: 85,
      trackWeather: 'heavy_rain',
      aeroDemand: 'medium',
      airDensityKgM3: 1.225,
      tireStressIndex01: 0.5,
      coolingDemandIndex01: 0.4,
      netErsBalanceKjPerLap: 0,
      playerCarRating: 82,
      playerTotalMassKg: 772,
      playerPorpoisingRiskPct: 10,
      playerThermalMarginC: 6,
      playerBatteryCellTempC: 50,
      playerFatigueLifeRaces: 5,
      playerTireWearRateMultiplier: 1.0,
      playerAvgReliability: 90,
      flagState: { flag: 'green', expiresAtLap: 0 },
      circuitId: 'silverstone',
      trackTempC: 23,
      rng: () => 0.99,
    });

    expect(tick.cars[0].paceMode).toBe('balanced');
  });

  it('acelera desgaste (blistering) em pneus Macios quando temperatura da pista > 50C', () => {
    const baseInput = {
      drivers: INITIAL_DRIVERS,
      allTeams: INITIAL_TEAMS,
      raceSpeed: 1,
      totalLaps: 57,
      baseLapTimeSec: 85,
      trackWeather: 'sunny' as const,
      aeroDemand: 'medium' as const,
      airDensityKgM3: 1.2,
      tireStressIndex01: 0.5,
      coolingDemandIndex01: 0.6,
      netErsBalanceKjPerLap: 0,
      playerCarRating: 82,
      playerTotalMassKg: 772,
      playerPorpoisingRiskPct: 10,
      playerThermalMarginC: 6,
      playerBatteryCellTempC: 50,
      playerFatigueLifeRaces: 5,
      playerTireWearRateMultiplier: 1.0,
      playerAvgReliability: 90,
      flagState: { flag: 'green' as const, expiresAtLap: 0 },
      circuitId: 'bahrain',
      rng: () => 0.99,
    };

    let coolCars = [makeTestCar({ tireCompound: 'soft', tireWearPercent: 20 })];
    let hotCars = [makeTestCar({ tireCompound: 'soft', tireWearPercent: 20 })];
    for (let i = 0; i < 15; i += 1) {
      coolCars = stepRaceSimulationTick({
        ...baseInput,
        raceSpeed: 5,
        cars: coolCars,
        trackTempC: 36,
      }).cars;
      hotCars = stepRaceSimulationTick({
        ...baseInput,
        raceSpeed: 5,
        cars: hotCars,
        trackTempC: 55,
      }).cars;
    }

    expect(hotCars[0].tireWearPercent).toBeGreaterThan(coolCars[0].tireWearPercent);
  });

  it('aciona Derating Térmico (hasDerating = true) quando ICE >= 115C', () => {
    const hotCar = makeTestCar({
      paceMode: 'attack',
      fuelMixMode: 'rich',
      iceTempC: 122,
      socPercent: 80,
    });

    const tick = stepRaceSimulationTick({
      cars: [hotCar],
      drivers: INITIAL_DRIVERS,
      allTeams: INITIAL_TEAMS,
      raceSpeed: 1,
      totalLaps: 57,
      baseLapTimeSec: 85,
      trackWeather: 'sunny',
      aeroDemand: 'medium',
      airDensityKgM3: 1.18,
      tireStressIndex01: 0.5,
      coolingDemandIndex01: 0.9,
      netErsBalanceKjPerLap: 0,
      playerCarRating: 82,
      playerTotalMassKg: 772,
      playerPorpoisingRiskPct: 10,
      playerThermalMarginC: -5,
      playerBatteryCellTempC: 60,
      playerFatigueLifeRaces: 5,
      playerTireWearRateMultiplier: 1.0,
      playerAvgReliability: 88,
      flagState: { flag: 'green', expiresAtLap: 0 },
      circuitId: 'bahrain',
      trackTempC: 54,
      rng: () => 0.99,
    });

    expect(tick.cars[0].iceTempC).toBeGreaterThanOrEqual(115);
    expect(tick.cars[0].hasDerating).toBe(true);
  });

  it('calcula barra de risco de erro (Calmo vs Sob Pressão vs Errático) e gera alertas de rádio do Pit Wall', () => {
    const monzaCalm = computeLapErrorRiskPct({
      driver: INITIAL_DRIVERS[0],
      circuitId: 'monza',
      weather: 'sunny',
      tireWearPercent: 15,
      paceMode: 'conserve',
    });
    const monacoWetAttack = computeLapErrorRiskPct({
      driver: INITIAL_DRIVERS[0],
      circuitId: 'monaco',
      weather: 'heavy_rain',
      tireWearPercent: 80,
      paceMode: 'attack',
    });

    expect(monzaCalm.errorStateLabel).toBe('calmo');
    expect(monacoWetAttack.errorRiskPct).toBeGreaterThan(monzaCalm.errorRiskPct);
    expect(monacoWetAttack.errorStateLabel).toBe('erratico');

    const alerts = evaluateRacePitWallRadio({
      playerCars: [
        makeTestCar({
          iceTempC: 117,
          hasDerating: true,
          tireCompound: 'soft',
          tireWearPercent: 72,
          errorRiskPct: 75,
        }),
      ],
      weather: 'sunny',
      trackTempC: 54,
      chiefEngineerName: 'Marcus Vance',
    });

    expect(alerts.some(m => m.id.startsWith('rad_heat_'))).toBe(true);
    expect(alerts.some(m => m.id.startsWith('rad_blister_'))).toBe(true);
    expect(alerts.some(m => m.id.startsWith('rad_tire_'))).toBe(true);
    expect(alerts.some(m => m.id.startsWith('rad_risk_'))).toBe(true);
  });

  it('resolve aliases head_mechanics (Rob Smedley) e head_management (Victor Hernandez) no feedback CAD e sinergia RPG', () => {
    const robSmedley: StaffMember = {
      ...INITIAL_STAFF[0],
      id: 'mech_f1_smedley',
      name: 'Rob Smedley',
      role: 'head_mechanics',
      rating: 88,
      currentTeam: 'APEX Grand Prix Team',
    };
    const victorHernandez: StaffMember = {
      ...INITIAL_STAFF[0],
      id: 'mgmt_fic_hernandez',
      name: 'Victor Hernandez',
      role: 'head_management',
      rating: 85,
      currentTeam: 'APEX Grand Prix Team',
    };

    const resolvedMech = resolveActiveChiefForCadType(
      'suspension',
      [robSmedley, victorHernandez],
      'APEX Grand Prix Team',
      'Rob Smedley'
    );
    expect(resolvedMech.member?.name).toBe('Rob Smedley');

    const xpWithSynergy = computeStaffXpGain({
      staffMember: victorHernandez,
      teamCentralLevel: 3,
      constructorPosition: 6,
      bankBalance: 20_000_000,
      costCapSpent: 45_000_000,
      costCapLimit: 135_000_000,
      principalBackground: 'ex_driver',
    });
    expect(xpWithSynergy.synergyBonus).toBe(16);
  });
});
