import { describe, it, expect } from 'vitest';
import { INITIAL_TEAMS, INITIAL_DRIVERS } from '../src/data/f1Data';
import {
  resolveRaceGridDrivers,
  syncTeamsAndDriversAfterOnboarding,
  computeDriverRaceProfile,
  sortRaceClassification,
  stepRaceSimulationTick
} from '../src/engine/raceGridAndEvents';
import type { Driver, LiveCarState } from '../src/types/f1';

describe('Grid de 24 Pilotos, Roster Real do Save e Regras FIA', () => {
  it('resolve exatamente 24 pilotos únicos em 12 equipes sem duplicatas nem placeholders', () => {
    const resolved = resolveRaceGridDrivers(INITIAL_TEAMS, INITIAL_DRIVERS);

    expect(resolved.normalizedTeams).toHaveLength(12);
    expect(resolved.gridDrivers).toHaveLength(24);

    const uniqueIds = new Set(resolved.gridDrivers.map(d => d.id));
    expect(uniqueIds.size).toBe(24);

    for (const team of resolved.normalizedTeams) {
      expect(team.drivers).toHaveLength(2);
      expect(team.drivers[0]).not.toBe(team.drivers[1]);
    }
  });

  it('remove Colapinto/Lawson placeholders após Onboarding quando jogador escolhe Bortoleto e Bearman', () => {
    const synced = syncTeamsAndDriversAfterOnboarding(
      INITIAL_TEAMS,
      INITIAL_DRIVERS,
      {
        careerPath: 'custom_team',
        teamId: 'apex',
        driver1Id: 'driver_bortoleto',
        driver2Id: 'driver_bearman',
        reserveDriverId: 'driver_minich',
        affiliateId: 'driver_minich',
        location: 'Silverstone, Reino Unido'
      },
      0
    );

    const resolved = resolveRaceGridDrivers(synced.teams, synced.drivers);
    expect(resolved.gridDrivers).toHaveLength(24);

    const apex = resolved.normalizedTeams.find(t => t.id === 'apex');
    expect(apex?.drivers).toEqual(['driver_bortoleto', 'driver_bearman']);

    const gridIds = new Set(resolved.gridDrivers.map(d => d.id));
    expect(gridIds.has('driver_bortoleto')).toBe(true);
    expect(gridIds.has('driver_bearman')).toBe(true);
    expect(gridIds.has('driver_player_1')).toBe(false);
    expect(gridIds.has('driver_player_2')).toBe(false);
  });

  it('acopla os 12 atributos em PT-BR no ritmo, chuva, desgaste, largada, disputa e risco', () => {
    const baseDriver = INITIAL_DRIVERS.find(d => d.id === 'driver_verstappen')!;
    const rookieDriver: Driver = {
      ...baseDriver,
      id: 'driver_test_rookie',
      attributes: {
        ...baseDriver.attributes,
        pace: 70,
        cornering: 68,
        braking: 70,
        reactionTime: 65,
        consistency: 62,
        smoothness: 60,
        overtaking: 65,
        defending: 62,
        wetWeather: 60,
        composure: 60,
        accuracy: 60,
        control: 58,
        racecraft: 62,
        adaptability: 58
      }
    };

    const eliteDry = computeDriverRaceProfile(baseDriver, {
      weather: 'sunny',
      aeroDemand: 'high',
      gapToAheadSec: 0.8,
      tireWearPercent: 25
    });
    const rookieDry = computeDriverRaceProfile(rookieDriver, {
      weather: 'sunny',
      aeroDemand: 'high',
      gapToAheadSec: 0.8,
      tireWearPercent: 25
    });

    expect(eliteDry.paceMultiplier).toBeGreaterThan(rookieDry.paceMultiplier);
    expect(eliteDry.qualifyingBonusSec).toBeGreaterThan(rookieDry.qualifyingBonusSec);
    expect(eliteDry.startLaunchGainLapUnits).toBeGreaterThan(rookieDry.startLaunchGainLapUnits);
    expect(eliteDry.tireWearMultiplier).toBeLessThan(rookieDry.tireWearMultiplier);
    expect(eliteDry.lapJitterAmplitudeSec).toBeLessThan(rookieDry.lapJitterAmplitudeSec);
    expect(eliteDry.incidentRiskMultiplier).toBeLessThan(rookieDry.incidentRiskMultiplier);
    expect(eliteDry.overtakePower).toBeGreaterThan(rookieDry.overtakePower);
  });

  it('classifica abandonos (DNF) e DSQ atrás de carros ativos e aplica penalizações de tempo (+5s/+10s)', () => {
    const makeCar = (overrides: Partial<LiveCarState>): LiveCarState => ({
      driverId: 'd1',
      driverName: 'Piloto 1',
      shortCode: 'P01',
      driverNumber: 1,
      teamId: 'redbull',
      teamColor: '#1E41FF',
      isPlayer: false,
      position: 1,
      lap: 10,
      distanceOnLap: 0.5,
      totalDistance: 9.5,
      currentLapTime: 40,
      lastLapTime: 85,
      bestLapTime: 84,
      gapToLeaderSec: 0,
      gapToAheadSec: 0,
      tireCompound: 'medium',
      tireAgeLaps: 10,
      tireWearPercent: 25,
      tireGrainingBlistering: 0,
      tireTempC: 98,
      socPercent: 80,
      batteryTempC: 48,
      engineMode: 'balanced',
      aeroMode: 'mode_z',
      paceMode: 'balanced',
      fuelMixMode: 'standard',
      fuelRemainingKg: 60,
      fuelInitialKg: 100,
      fuelBurnKgPerLap: 1.7,
      fuelSavingPenaltySec: 0,
      eFuelRating: 90,
      inPitLane: false,
      pitStopsDone: 0,
      pitDurationSec: 0,
      hasDerating: false,
      damagePercent: 0,
      status: 'running',
      ...overrides
    });

    // Carro A cruzou 0.02 volta na frente (~1.7s com volta de 85s), mas tem +5s de punição
    const carA = makeCar({ driverId: 'a', shortCode: 'AAA', totalDistance: 9.52, penaltySec: 5 });
    const carB = makeCar({ driverId: 'b', shortCode: 'BBB', totalDistance: 9.5, penaltySec: 0 });
    const carDNF = makeCar({ driverId: 'dnf', shortCode: 'DNF', totalDistance: 9.9, status: 'retired', retireReason: 'Acidente' });
    const carDSQ = makeCar({ driverId: 'dsq', shortCode: 'DSQ', totalDistance: 9.95, status: 'retired', isDisqualified: true });

    const classified = sortRaceClassification([carDNF, carA, carDSQ, carB], 85);
    expect(classified.map(c => c.driverId)).toEqual(['b', 'a', 'dnf', 'dsq']);
    expect(classified[0].position).toBe(1);
    expect(classified[2].status).toBe('retired');
    expect(classified[3].isDisqualified).toBe(true);
  });

  it('suporta largada dos boxes, acionamento de bandeiras/VSC/SC em acidente e punições da FIA no tick', () => {
    const resolved = resolveRaceGridDrivers(INITIAL_TEAMS, INITIAL_DRIVERS);
    const cars: LiveCarState[] = resolved.gridDrivers.slice(0, 4).map((drv, idx) => ({
      driverId: drv.id,
      driverName: drv.name,
      shortCode: drv.shortCode,
      driverNumber: drv.number,
      teamId: drv.teamId,
      teamColor: '#fff',
      isPlayer: idx === 0,
      position: idx + 1,
      lap: 5,
      distanceOnLap: 0.4 - idx * 0.002,
      totalDistance: 4.4 - idx * 0.002,
      currentLapTime: 30,
      lastLapTime: 85,
      bestLapTime: 84,
      gapToLeaderSec: idx * 0.2,
      gapToAheadSec: idx === 0 ? 0 : 0.2,
      tireCompound: 'soft',
      tireAgeLaps: 5,
      tireWearPercent: 18,
      tireGrainingBlistering: 0,
      tireTempC: 98,
      socPercent: 85,
      batteryTempC: 48,
      engineMode: 'balanced',
      aeroMode: 'mode_z',
      paceMode: idx === 0 ? 'attack' : 'balanced',
      fuelMixMode: 'standard',
      fuelRemainingKg: 70,
      fuelInitialKg: 100,
      fuelBurnKgPerLap: 1.7,
      fuelSavingPenaltySec: 0,
      eFuelRating: 90,
      inPitLane: idx === 3,
      pitStopsDone: 0,
      pitDurationSec: 0,
      hasDerating: false,
      damagePercent: 0,
      status: 'running',
      startedFromPitLane: idx === 3,
      pitLaneStartTicks: idx === 3 ? 2 : 0
    }));

    // RNG baixo força eventos (track limits / colisão / bandeira) sem aleatoriedade instável
    const tickRes = stepRaceSimulationTick({
      cars,
      drivers: resolved.gridDrivers,
      allTeams: resolved.normalizedTeams,
      raceSpeed: 2,
      totalLaps: 50,
      baseLapTimeSec: 85,
      trackWeather: 'heavy_rain',
      aeroDemand: 'high',
      airDensityKgM3: 1.225,
      tireStressIndex01: 0.6,
      coolingDemandIndex01: 0.5,
      netErsBalanceKjPerLap: 100,
      playerCarRating: 85,
      playerTotalMassKg: 772,
      playerPorpoisingRiskPct: 20,
      playerThermalMarginC: 8,
      playerBatteryCellTempC: 48,
      playerFatigueLifeRaces: 5,
      playerTireWearRateMultiplier: 1.0,
      playerAvgReliability: 90,
      flagState: { flag: 'green', expiresAtLap: 0 },
      rng: () => 0.0001
    });

    const pitStarter = tickRes.cars.find(c => c.startedFromPitLane);
    expect(pitStarter?.pitLaneStartTicks).toBe(1);
    expect(tickRes.nextFlagState.flag).not.toBe('green');
    expect(tickRes.events.length).toBeGreaterThan(0);
  });

  it('mantém percentual realista de acidentes em corrida completa de 57 voltas com 24 carros (seco vs chuva)', () => {
    const resolved = resolveRaceGridDrivers(INITIAL_TEAMS, INITIAL_DRIVERS);

    const makeSeededRng = (seedInit: number) => {
      let s = seedInit >>> 0;
      return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
      };
    };

    const simulateFullGp = (weather: 'sunny' | 'heavy_rain', seed: number) => {
      const rng = makeSeededRng(seed);
      let cars: LiveCarState[] = resolved.gridDrivers.map((drv, idx) => ({
        driverId: drv.id,
        driverName: drv.name,
        shortCode: drv.shortCode,
        driverNumber: drv.number,
        teamId: drv.teamId,
        teamColor: '#fff',
        isPlayer: idx < 2,
        position: idx + 1,
        lap: 1,
        distanceOnLap: 0.02 - idx * 0.0005,
        totalDistance: 0.02 - idx * 0.0005,
        currentLapTime: 0,
        lastLapTime: 85,
        bestLapTime: 85,
        gapToLeaderSec: idx * 0.25,
        gapToAheadSec: idx === 0 ? 0 : 0.25,
        tireCompound: 'medium',
        tireAgeLaps: 0,
        tireWearPercent: 0,
        tireGrainingBlistering: 0,
        tireTempC: 96,
        socPercent: 85,
        batteryTempC: 48,
        engineMode: 'balanced',
        aeroMode: 'mode_z',
        paceMode: 'balanced',
        fuelMixMode: 'standard',
        fuelRemainingKg: 100,
        fuelInitialKg: 100,
        fuelBurnKgPerLap: 1.65,
        fuelSavingPenaltySec: 0,
        eFuelRating: 92,
        inPitLane: false,
        pitStopsDone: 0,
        pitDurationSec: 0,
        hasDerating: false,
        damagePercent: 0,
        status: 'running',
      }));

      let flagState = { flag: 'green' as const, expiresAtLap: 0 } as {
        flag: 'green' | 'yellow' | 'vsc' | 'sc' | 'red';
        expiresAtLap: number;
      };

      for (let step = 0; step < 2600; step++) {
        const res = stepRaceSimulationTick({
          cars,
          drivers: resolved.gridDrivers,
          allTeams: resolved.normalizedTeams,
          raceSpeed: 4,
          totalLaps: 57,
          baseLapTimeSec: 85,
          trackWeather: weather,
          aeroDemand: 'high',
          airDensityKgM3: 1.225,
          tireStressIndex01: 0.55,
          coolingDemandIndex01: 0.45,
          netErsBalanceKjPerLap: 120,
          playerCarRating: 86,
          playerTotalMassKg: 772,
          playerPorpoisingRiskPct: 18,
          playerThermalMarginC: 10,
          playerBatteryCellTempC: 46,
          playerFatigueLifeRaces: 6,
          playerTireWearRateMultiplier: 1.0,
          playerAvgReliability: 92,
          flagState,
          rng
        });
        cars = res.cars;
        flagState = res.nextFlagState.flag === 'red' ? { flag: 'green', expiresAtLap: 0 } : res.nextFlagState;
        if (res.finished) break;
      }

      const finishers = cars.filter(c => c.status === 'running' && !c.isDisqualified).length;
      const crashDnfs = cars.filter(
        c =>
          c.status === 'retired' &&
          (c.retireReason?.includes('Colisão') ||
            c.retireReason?.includes('Aquaplanagem') ||
            c.retireReason?.includes('Danos'))
      ).length;
      return { finishers, crashDnfs };
    };

    const dryRuns = [101, 202, 303, 404, 505, 606, 707, 808, 909, 1010].map(s =>
      simulateFullGp('sunny', s)
    );
    const avgDryFinishers = dryRuns.reduce((acc, r) => acc + r.finishers, 0) / dryRuns.length;
    const avgDryCrashDnfs = dryRuns.reduce((acc, r) => acc + r.crashDnfs, 0) / dryRuns.length;

    const wetRuns = [101, 202, 303, 404, 505].map(s => simulateFullGp('heavy_rain', s));
    const avgWetCrashDnfs = wetRuns.reduce((acc, r) => acc + r.crashDnfs, 0) / wetRuns.length;

    // Em GP seco de 24 carros: média realista de ~0.5–4.0 abandonos por acidente e >= 17 carros chegando ao fim
    expect(avgDryCrashDnfs).toBeGreaterThanOrEqual(0.3);
    expect(avgDryCrashDnfs).toBeLessThanOrEqual(4.5);
    expect(avgDryFinishers).toBeGreaterThanOrEqual(17);

    // Chuva forte com pneus slick eleva drasticamente a taxa de acidentes em relação ao seco
    expect(avgWetCrashDnfs).toBeGreaterThan(avgDryCrashDnfs);
  });

  it('gera evento de fumaça no escapamento quando PU de baixa confiabilidade (66%) falha em corrida', () => {
    const resolved = resolveRaceGridDrivers(INITIAL_TEAMS, INITIAL_DRIVERS);
    let smokeEventSeen = false;
    let cars: LiveCarState[] = resolved.gridDrivers.slice(0, 2).map((drv, idx) => ({
      driverId: drv.id,
      driverName: drv.name,
      shortCode: drv.shortCode,
      driverNumber: drv.number,
      teamId: drv.teamId,
      teamColor: '#fff',
      isPlayer: idx === 0,
      position: idx + 1,
      lap: 34,
      distanceOnLap: 0.995,
      totalDistance: 34.995,
      currentLapTime: 0,
      lastLapTime: 85,
      bestLapTime: 85,
      gapToLeaderSec: idx * 0.4,
      gapToAheadSec: idx === 0 ? 0 : 0.4,
      tireCompound: 'medium',
      tireAgeLaps: 12,
      tireWearPercent: 30,
      tireGrainingBlistering: 0,
      tireTempC: 96,
      socPercent: 75,
      batteryTempC: 54,
      engineMode: 'balanced',
      aeroMode: 'mode_z',
      paceMode: 'balanced',
      fuelMixMode: 'standard',
      fuelRemainingKg: 60,
      fuelInitialKg: 100,
      fuelBurnKgPerLap: 1.65,
      fuelSavingPenaltySec: 0,
      eFuelRating: 91,
      inPitLane: false,
      pitStopsDone: 1,
      pitDurationSec: 0,
      hasDerating: false,
      damagePercent: 0,
      status: 'running',
    }));

    // Deterministic RNG returning very low values after green checks to trigger mechanical failure check on lap 35
    let callIdx = 0;
    const smokeRng = () => {
      callIdx += 1;
      // Avoid incidentRollProb (which checks rng() < ~0.002) -> wait: mechanical check happens at lap completion,
      // returning 0.003 triggers totalMechRisk (~0.0105 at 66% rel) while avoiding dry crash roll (~0.002)
      return callIdx % 2 === 0 ? 0.0035 : 0.5;
    };

    for (let step = 0; step < 30; step++) {
      const res = stepRaceSimulationTick({
        cars,
        drivers: resolved.gridDrivers,
        allTeams: resolved.normalizedTeams,
        raceSpeed: 4,
        totalLaps: 57,
        baseLapTimeSec: 85,
        trackWeather: 'sunny',
        aeroDemand: 'medium',
        airDensityKgM3: 1.225,
        tireStressIndex01: 0.5,
        coolingDemandIndex01: 0.55,
        netErsBalanceKjPerLap: 100,
        playerCarRating: 88,
        playerTotalMassKg: 772,
        playerPorpoisingRiskPct: 15,
        playerThermalMarginC: 2,
        playerBatteryCellTempC: 55,
        playerFatigueLifeRaces: 5,
        playerTireWearRateMultiplier: 1.0,
        playerAvgReliability: 66,
        flagState: { flag: 'green', expiresAtLap: 0 },
        rng: smokeRng,
      });
      if (res.events.some(e => e.title.includes('FUMAÇA NO ESCAPAMENTO'))) {
        smokeEventSeen = true;
        break;
      }
      cars = res.cars.map(c => ({ ...c, distanceOnLap: 0.995 }));
    }

    expect(smokeEventSeen).toBe(true);
  });
});
