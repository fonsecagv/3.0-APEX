import type { Driver, LiveCarState, OnboardingResult, Team } from '../types/f1';
import { getDriverTechnicalAttributes } from '../utils/profileSheets';

export type TrackFlagStatus = 'green' | 'yellow' | 'vsc' | 'sc' | 'red';

export interface RaceControlEvent {
  id: string;
  lap: number;
  flag: TrackFlagStatus | 'blue' | 'black' | 'penalty';
  title: string;
  message: string;
}

export interface GridResolutionResult {
  gridDrivers: Driver[];
  normalizedTeams: Team[];
  normalizedDrivers: Driver[];
}

const PLACEHOLDER_DRIVER_IDS = new Set(['driver_player_1', 'driver_player_2']);

/**
 * Garante que TODAS as equipes do grid (12 equipes) possuam exatamente 2 pilotos titulares únicos,
 * resultando em exatamente 24 carros no grid (nunca 28, sem placeholders duplicados).
 */
export function resolveRaceGridDrivers(
  allTeams: Team[],
  drivers: Driver[]
): GridResolutionResult {
  const driverMap = new Map<string, Driver>(drivers.map(d => [d.id, { ...d }]));
  const usedDriverIds = new Set<string>();

  const teamTargetPairs: Array<{ team: Team; slots: [string, string] }> = [];

  // Passo 1: reservar os titulares válidos declarados por cada equipe (prioridade para a equipe do jogador)
  const orderedTeams = [...allTeams].sort((a, b) => (a.isPlayer === b.isPlayer ? 0 : a.isPlayer ? -1 : 1));
  const reservedPerTeam = new Map<string, [string | null, string | null]>();

  for (const team of orderedTeams) {
    const d0 = team.drivers?.[0];
    const d1 = team.drivers?.[1];

    const pickValid = (id?: string): string | null => {
      if (!id) return null;
      const drv = driverMap.get(id);
      if (!drv) return null;
      if (usedDriverIds.has(id)) return null;
      // Evita reutilizar placeholders de outro time caso não pertençam explicitamente ao time do jogador
      if (!team.isPlayer && PLACEHOLDER_DRIVER_IDS.has(id)) return null;
      usedDriverIds.add(id);
      return id;
    };

    const s0 = pickValid(d0);
    const s1 = pickValid(d1);
    reservedPerTeam.set(team.id, [s0, s1]);
  }

  // Candidatos disponíveis para preencher eventuais vagas abertas em equipes rivais
  // (exclui placeholders, reservas afiliados e quem já é titular em alguma das 12 equipes)
  const replacementPool = drivers.filter(
    d =>
      !usedDriverIds.has(d.id) &&
      !PLACEHOLDER_DRIVER_IDS.has(d.id) &&
      !d.isAffiliate &&
      (d.series === 'F1' || d.isFreeAgent || d.series === 'F2')
  );
  const secondaryPool = drivers.filter(
    d => !usedDriverIds.has(d.id) && !PLACEHOLDER_DRIVER_IDS.has(d.id)
  );

  const popReplacement = (): string | null => {
    const idxPrimary = replacementPool.findIndex(d => !usedDriverIds.has(d.id));
    if (idxPrimary >= 0) {
      const picked = replacementPool[idxPrimary];
      usedDriverIds.add(picked.id);
      return picked.id;
    }
    const idxSec = secondaryPool.findIndex(d => !usedDriverIds.has(d.id));
    if (idxSec >= 0) {
      const picked = secondaryPool[idxSec];
      usedDriverIds.add(picked.id);
      return picked.id;
    }
    return null;
  };

  // Passo 2: consolidar pares de 2 pilotos para cada equipe preservando a ordem original de allTeams
  for (const team of allTeams) {
    const pair = reservedPerTeam.get(team.id) || [null, null];
    const first = pair[0] || popReplacement() || team.drivers[0];
    const second = pair[1] || popReplacement() || team.drivers[1];
    teamTargetPairs.push({ team, slots: [first, second] });
  }

  const normalizedTeams: Team[] = teamTargetPairs.map(({ team, slots }) => ({
    ...team,
    drivers: slots
  }));

  const teamByStarterId = new Map<string, string>();
  const gridDrivers: Driver[] = [];
  for (const t of normalizedTeams) {
    for (const drvId of t.drivers) {
      teamByStarterId.set(drvId, t.id);
      const d = driverMap.get(drvId);
      if (d) {
        gridDrivers.push({
          ...d,
          teamId: t.id,
          isAffiliate: false,
          isFreeAgent: false
        });
      }
    }
  }

  const normalizedDrivers: Driver[] = drivers.map(d => {
    const starterTeamId = teamByStarterId.get(d.id);
    if (starterTeamId) {
      return {
        ...d,
        teamId: starterTeamId,
        isAffiliate: false,
        isFreeAgent: false
      };
    }
    if (PLACEHOLDER_DRIVER_IDS.has(d.id)) {
      return {
        ...d,
        teamId: 'free_agent',
        isAffiliate: true,
        isFreeAgent: true
      };
    }
    return d;
  });

  return {
    gridDrivers,
    normalizedTeams,
    normalizedDrivers
  };
}

/**
 * Sincroniza equipes e pilotos imediatamente após o Onboarding (Fase 5),
 * garantindo que os pilotos escolhidos pelo jogador assumam o time do save
 * e os placeholders antigos (Colapinto/Lawson) sejam removidos.
 */
export function syncTeamsAndDriversAfterOnboarding(
  allTeams: Team[],
  drivers: Driver[],
  data: Pick<OnboardingResult, 'careerPath' | 'teamId' | 'driver1Id' | 'driver2Id' | 'reserveDriverId' | 'affiliateId' | 'location'>,
  driverMoraleSynergy: number
): { teams: Team[]; drivers: Driver[] } {
  const playerTeamId = data.careerPath === 'custom_team' ? 'apex' : data.teamId;
  const reserveId = data.reserveDriverId || data.affiliateId;
  const isIndaiatuba = Boolean(data.location?.includes('Indaiatuba'));
  const moraleBoost = isIndaiatuba ? 4 : 0;

  const updatedTeams = allTeams.map(team => {
    if (team.id === playerTeamId) {
      return {
        ...team,
        isPlayer: true,
        drivers: [data.driver1Id, data.driver2Id] as [string, string],
        affiliateDriverId: reserveId
      };
    }
    // Se um piloto rival foi contratado pelo jogador, limpa temporariamente o slot para ser reposto
    const cleanedDrivers = team.drivers.map(id =>
      id === data.driver1Id || id === data.driver2Id || id === reserveId ? '' : id
    ) as [string, string];
    return {
      ...team,
      isPlayer: false,
      drivers: cleanedDrivers
    };
  });

  const updatedDrivers = drivers.map(d => {
    if (d.id === data.driver1Id || d.id === data.driver2Id) {
      return {
        ...d,
        teamId: playerTeamId,
        isAffiliate: false,
        isFreeAgent: false,
        mentality: Math.min(100, Math.max(20, 94 + moraleBoost + driverMoraleSynergy))
      };
    }
    if (reserveId && d.id === reserveId) {
      return {
        ...d,
        teamId: playerTeamId,
        isAffiliate: true,
        isFreeAgent: false,
        mentality: Math.min(100, Math.max(20, 96 + moraleBoost + driverMoraleSynergy))
      };
    }
    if (d.teamId === playerTeamId || PLACEHOLDER_DRIVER_IDS.has(d.id)) {
      return {
        ...d,
        teamId: 'free_agent',
        isAffiliate: PLACEHOLDER_DRIVER_IDS.has(d.id),
        isFreeAgent: true
      };
    }
    return d;
  });

  const resolved = resolveRaceGridDrivers(updatedTeams, updatedDrivers);
  return {
    teams: resolved.normalizedTeams,
    drivers: resolved.normalizedDrivers
  };
}

/**
 * Substitui um piloto titular em uma equipe (ex.: demissão de Esteban Ocon e promoção antecipada de Rafael Câmara na Haas),
 * garantindo unicidade de 24 titulares no grid via resolveRaceGridDrivers.
 */
export function applyTeamDriverReplacement(
  allTeams: Team[],
  drivers: Driver[],
  teamId: string,
  outDriverId: string,
  inDriverId: string,
  opts?: { newSalary?: number; newContractYears?: number; newMentality?: number }
): { teams: Team[]; drivers: Driver[]; gridDrivers: Driver[]; replaced: boolean } {
  const targetTeam = allTeams.find(t => t.id === teamId);
  const incoming = drivers.find(d => d.id === inDriverId);
  if (!targetTeam || !incoming) {
    return { teams: allTeams, drivers, gridDrivers: drivers.filter(d => !d.isAffiliate && !d.isFreeAgent), replaced: false };
  }

  const slotIdx = targetTeam.drivers.indexOf(outDriverId);
  const nextSlots: [string, string] =
    slotIdx === 0
      ? [inDriverId, targetTeam.drivers[1]]
      : slotIdx === 1
      ? [targetTeam.drivers[0], inDriverId]
      : [inDriverId, targetTeam.drivers[1]];

  const updatedTeams = allTeams.map(t => {
    if (t.id === teamId) {
      return { ...t, drivers: nextSlots };
    }
    if (t.drivers.includes(inDriverId)) {
      return {
        ...t,
        drivers: t.drivers.map(id => (id === inDriverId ? '' : id)) as [string, string]
      };
    }
    return t;
  });

  const updatedDrivers = drivers.map(d => {
    if (d.id === inDriverId) {
      return {
        ...d,
        teamId,
        series: 'F1' as const,
        isAffiliate: false,
        isFreeAgent: false,
        salary: opts?.newSalary ?? Math.max(d.salary, 950000),
        contractYearsRemaining: opts?.newContractYears ?? 2,
        mentality: opts?.newMentality ?? 92
      };
    }
    if (d.id === outDriverId) {
      return {
        ...d,
        teamId: 'free_agent',
        isAffiliate: false,
        isFreeAgent: true
      };
    }
    return d;
  });

  const resolved = resolveRaceGridDrivers(updatedTeams, updatedDrivers);
  return {
    teams: resolved.normalizedTeams,
    drivers: resolved.normalizedDrivers,
    gridDrivers: resolved.gridDrivers,
    replaced: true
  };
}

export interface DriverRacePhysicsModifiers {
  paceMultiplier: number;
  qualifyingBonusSec: number;
  tireWearMultiplier: number;
  lapJitterAmplitudeSec: number;
  startLaunchGainLapUnits: number;
  incidentRiskMultiplier: number;
  penaltyRiskMultiplier: number;
  overtakePower: number;
  defensePower: number;
  dirtyAirPenaltyMultiplier: number;
}

/**
 * Converte todos os 12 atributos em PT-BR do piloto em modificadores físicos reais
 * para Qualificação, Largada, Ritmo de Corrida, Desgaste, Chuva, Disputa e Risco de Acidente.
 */
export function computeDriverRaceProfile(
  driver: Driver | undefined,
  opts: {
    weather: 'sunny' | 'overcast' | 'light_rain' | 'heavy_rain';
    aeroDemand: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
    gapToAheadSec: number;
    tireWearPercent: number;
  }
): DriverRacePhysicsModifiers {
  if (!driver) {
    return {
      paceMultiplier: 1.0,
      qualifyingBonusSec: 0,
      tireWearMultiplier: 1.0,
      lapJitterAmplitudeSec: 0.35,
      startLaunchGainLapUnits: 0,
      incidentRiskMultiplier: 1.0,
      penaltyRiskMultiplier: 1.0,
      overtakePower: 78,
      defensePower: 78,
      dirtyAirPenaltyMultiplier: 1.0
    };
  }

  const attrs = getDriverTechnicalAttributes(driver);
  const byKey = Object.fromEntries(attrs.map(a => [a.key, a.value])) as Record<string, number>;

  const ritmo = byKey.pace ?? 80;
  const curvas = byKey.cornering ?? 80;
  const frenagem = byKey.braking ?? 80;
  const reacoes = byKey.reactionTime ?? 80;
  const consistencia = byKey.consistency ?? 80;
  const precisao = byKey.accuracy ?? 80;
  const controle = byKey.control ?? 80;
  const suavidade = byKey.smoothness ?? 80;
  const habCorrida = byKey.racecraft ?? 80;
  const ultrapassagem = byKey.overtaking ?? 80;
  const defesa = byKey.defending ?? 80;
  const adaptabilidade = byKey.adaptability ?? 80;

  const isWet = opts.weather === 'light_rain' || opts.weather === 'heavy_rain';
  const cornerWeight =
    opts.aeroDemand === 'very_high' || opts.aeroDemand === 'high' ? 0.35 : 0.22;

  // Ritmo, Curvas e Frenagem governam velocidade pura
  const baseSpeedSkill =
    ritmo * (0.62 - cornerWeight * 0.4) +
    curvas * cornerWeight +
    frenagem * 0.18 +
    (isWet ? adaptabilidade * 0.22 : adaptabilidade * 0.04);

  // Referência 82 -> 1.000; faixa realista +/- ~1.8%
  let paceMultiplier = 1.0 + (baseSpeedSkill - 82) * 0.00075;

  // Ar sujo (tráfego < 1.2s): Habilidade de Corrida reduz perda aerodinâmica no vácuo/curva
  const dirtyAirPenaltyMultiplier = Math.max(0.55, Math.min(1.25, 1.0 - (habCorrida - 80) * 0.015));
  if (opts.gapToAheadSec > 0 && opts.gapToAheadSec < 1.2) {
    paceMultiplier *= 1 - 0.006 * dirtyAirPenaltyMultiplier;
  }

  // Chuva penaliza quem tem Adaptabilidade baixa
  if (isWet) {
    paceMultiplier *= 1 + (adaptabilidade - 80) * 0.0012;
  }

  // Suavidade protege a borracha e evita superaquecimento superficial
  const tireWearMultiplier = Math.max(0.76, Math.min(1.22, 1.0 - (suavidade - 82) * 0.009));

  // Consistência reduz oscilação volta a volta
  const lapJitterAmplitudeSec = Math.max(0.12, Math.min(0.65, 0.36 - (consistencia - 80) * 0.009));

  // Reações governam o salto na largada
  const startLaunchGainLapUnits = ((reacoes - 82) / 100) * 0.014;

  // Controle + Precisão + Adaptabilidade protegem contra acidentes/erros
  // Confiança zero (ou <= 20) eleva o risco de direção imprudente / acidente na pista
  const driverTrust = Math.max(0, Math.min(100, driver.trust ?? 75));
  const trustRiskMultiplier =
    driverTrust <= 0 ? 2.4 : driverTrust <= 20 ? 1.6 : driverTrust >= 85 ? 0.9 : 1.0;

  const controlComposite = controle * 0.45 + precisao * 0.35 + (isWet ? adaptabilidade : consistencia) * 0.20;
  const wearStress = opts.tireWearPercent > 75 ? 1.45 : 1.0;
  const incidentRiskMultiplier = Math.max(
    0.45,
    Math.min(4.5, (1.0 - (controlComposite - 80) * 0.022) * wearStress * trustRiskMultiplier)
  );
  const penaltyRiskMultiplier = Math.max(0.4, Math.min(1.9, 1.0 - ((precisao * 0.6 + consistencia * 0.4) - 80) * 0.025));

  const qualifyingBonusSec =
    ((ritmo - 80) * 0.028) +
    ((curvas - 80) * 0.018) +
    ((frenagem - 80) * 0.012) +
    ((precisao - 80) * 0.010) +
    ((reacoes - 80) * 0.006) +
    (isWet ? (adaptabilidade - 80) * 0.022 : 0);

  return {
    paceMultiplier,
    qualifyingBonusSec,
    tireWearMultiplier,
    lapJitterAmplitudeSec,
    startLaunchGainLapUnits,
    incidentRiskMultiplier,
    penaltyRiskMultiplier,
    overtakePower: ultrapassagem * 0.55 + frenagem * 0.25 + habCorrida * 0.20,
    defensePower: defesa * 0.55 + controle * 0.25 + consistencia * 0.20,
    dirtyAirPenaltyMultiplier
  };
}

/**
 * Classificação oficial FIA considerando:
 * 1) Carros ativos na corrida na frente de abandonos (DNF) e desclassificados (DSQ)
 * 2) Penalidades de tempo acumuladas (+5s, +10s) descontadas da distância efetiva
 */
export function sortRaceClassification(
  cars: LiveCarState[],
  baseLapTimeSec: number
): LiveCarState[] {
  const safeBaseLap = Math.max(55, baseLapTimeSec || 85);
  const sorted = [...cars].sort((a, b) => {
    const rankGroup = (c: LiveCarState) => {
      if (c.isDisqualified) return 2;
      if (c.status === 'retired') return 1;
      return 0;
    };
    const ga = rankGroup(a);
    const gb = rankGroup(b);
    if (ga !== gb) return ga - gb;

    const effA = a.totalDistance - (a.penaltySec || 0) / safeBaseLap;
    const effB = b.totalDistance - (b.penaltySec || 0) / safeBaseLap;
    return effB - effA;
  });

  const leaderEff =
    sorted[0] && sorted[0].status !== 'retired' && !sorted[0].isDisqualified
      ? sorted[0].totalDistance - (sorted[0].penaltySec || 0) / safeBaseLap
      : sorted[0]?.totalDistance || 1;

  return sorted.map((c, idx) => {
    const effC = c.totalDistance - (c.penaltySec || 0) / safeBaseLap;
    const prev = sorted[idx - 1];
    const effPrev = prev ? prev.totalDistance - (prev.penaltySec || 0) / safeBaseLap : effC;
    return {
      ...c,
      position: idx + 1,
      effectiveRaceTimeSec: Math.round((c.totalDistance * safeBaseLap + (c.penaltySec || 0)) * 1000) / 1000,
      gapToLeaderSec:
        idx === 0 || c.status === 'retired' || c.isDisqualified
          ? 0
          : Math.max(0, Math.round((leaderEff - effC) * safeBaseLap * 1000) / 1000),
      gapToAheadSec:
        idx === 0 || c.status === 'retired' || c.isDisqualified
          ? 0
          : Math.max(0, Math.round((effPrev - effC) * safeBaseLap * 1000) / 1000)
    };
  });
}

export interface RaceFlagState {
  flag: TrackFlagStatus;
  expiresAtLap: number;
}

export interface RaceTickInput {
  cars: LiveCarState[];
  drivers: Driver[];
  allTeams: Team[];
  raceSpeed: number;
  totalLaps: number;
  baseLapTimeSec: number;
  trackWeather: 'sunny' | 'overcast' | 'light_rain' | 'heavy_rain';
  aeroDemand: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  airDensityKgM3: number;
  tireStressIndex01: number;
  coolingDemandIndex01: number;
  netErsBalanceKjPerLap: number;
  playerCarRating: number;
  playerTotalMassKg: number;
  playerPorpoisingRiskPct: number;
  playerThermalMarginC: number;
  playerBatteryCellTempC: number;
  playerFatigueLifeRaces: number;
  playerTireWearRateMultiplier: number;
  playerAvgReliability: number;
  flagState: RaceFlagState;
  circuitId?: string;
  trackTempC?: number;
  rng?: () => number;
}

export function isWetWeather(weather: RaceTickInput['trackWeather']): boolean {
  return weather === 'light_rain' || weather === 'heavy_rain';
}

export function getCircuitDangerPct(circuitId?: string): number {
  switch (circuitId) {
    case 'monaco':
    case 'baku':
    case 'jeddah':
    case 'singapore':
    case 'las_vegas':
      return 5.0;
    case 'suzuka':
    case 'interlagos':
    case 'albert_park':
    case 'spa':
    case 'zandvoort':
    case 'miami':
      return 3.5;
    case 'monza':
    case 'bahrain':
    case 'red_bull_ring':
    case 'yas_marina':
      return 1.0;
    default:
      return 2.5;
  }
}

export interface LapErrorRiskEvaluation {
  rawFormulaErrorPct: number;
  errorRiskPct: number; // 0-100 gauge para UI
  errorStateLabel: 'calmo' | 'pressao' | 'erratico';
}

/**
 * Fórmula oficial de risco de erro de pilotagem:
 * Chance de Erro = Perigo da Pista (Monaco 5% .. Monza 1%)
 *                + Clima (Chuva +10%)
 *                + Desgaste (+5% se vida do pneu < 30%)
 *                - ((Consistência + Frenagem) / 40)
 */
export function computeLapErrorRiskPct(params: {
  driver?: Driver;
  circuitId?: string;
  weather: RaceTickInput['trackWeather'];
  tireWearPercent: number;
  paceMode: LiveCarState['paceMode'];
  porpoisingRiskPct?: number;
  isPlayer?: boolean;
}): LapErrorRiskEvaluation {
  const trackDangerPct = getCircuitDangerPct(params.circuitId);
  const weatherPenaltyPct =
    params.weather === 'heavy_rain' ? 10.0 : params.weather === 'light_rain' ? 6.5 : 0;
  const tireLifePct = Math.max(0, 100 - params.tireWearPercent);
  const wearPenaltyPct = tireLifePct < 30 ? 5.0 : tireLifePct < 45 ? 1.8 : 0;

  const consistency = params.driver?.attributes.consistency ?? 78;
  const braking = params.driver?.attributes.braking ?? 78;
  const wetSkill = params.driver?.attributes.wetWeather ?? 76;
  const composure = params.driver?.attributes.composure ?? 78;

  const driverMitigationPct = (consistency + braking) / 40;
  const wetSkillMod = isWetWeather(params.weather) ? (80 - wetSkill) * 0.08 : 0;
  const composureMod = (80 - composure) * 0.03;
  const modeFactor =
    params.paceMode === 'attack' ? 1.35 : params.paceMode === 'push' ? 1.15 : params.paceMode === 'conserve' ? 0.72 : 1.0;
  const porpoisingExtra = params.isPlayer && (params.porpoisingRiskPct ?? 0) > 58 ? 1.8 : 0;

  const baseFormula =
    trackDangerPct + weatherPenaltyPct + wearPenaltyPct - driverMitigationPct + wetSkillMod + composureMod + porpoisingExtra;
  const rawFormulaErrorPct = Math.max(0.15, Number((baseFormula * modeFactor).toFixed(2)));

  // Mapeia escala física (0.15% .. ~22%) para barra tática de 0–100%
  const errorRiskPct = Math.max(5, Math.min(99, Math.round(rawFormulaErrorPct * 5.2)));
  const errorStateLabel: 'calmo' | 'pressao' | 'erratico' =
    errorRiskPct <= 30 ? 'calmo' : errorRiskPct <= 60 ? 'pressao' : 'erratico';

  return {
    rawFormulaErrorPct,
    errorRiskPct,
    errorStateLabel,
  };
}

export interface RaceRadioMessage {
  id: string;
  senderName: string;
  senderRole: 'PILOTO' | 'ENGENHEIRO-CHEFE' | 'BOX / ESTRATÉGIA';
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

export function evaluateRacePitWallRadio(params: {
  playerCars: LiveCarState[];
  weather: RaceTickInput['trackWeather'];
  trackTempC: number;
  chiefEngineerName?: string;
}): RaceRadioMessage[] {
  const messages: RaceRadioMessage[] = [];
  const chiefName = params.chiefEngineerName || 'Marcus Vance';
  const wet = isWetWeather(params.weather);

  for (const car of params.playerCars) {
    if (car.status === 'retired' || car.isDisqualified) continue;
    const tireLife = Math.max(0, 100 - car.tireWearPercent);
    const iceTemp = car.iceTempC ?? 102;
    const riskPct = car.errorRiskPct ?? 20;

    if (iceTemp >= 115 || car.hasDerating) {
      messages.push({
        id: `rad_heat_${car.driverId}`,
        senderName: car.driverName,
        senderRole: 'PILOTO',
        severity: 'critical',
        message: 'Perdi potência, o motor está fritando! Está cortando entrega na saída das curvas.',
      });
      messages.push({
        id: `rad_chief_heat_${car.driverId}`,
        senderName: chiefName,
        senderRole: 'ENGENHEIRO-CHEFE',
        severity: 'critical',
        message: `Temperatura crítica de ${iceTemp.toFixed(1)}°C no carro #${car.driverNumber}! Ative Modo Economia ou Mistura Pobre agora para evitar quebra.`,
      });
    }

    if (tireLife < 40) {
      messages.push({
        id: `rad_tire_${car.driverId}`,
        senderName: car.driverName,
        senderRole: 'PILOTO',
        severity: tireLife < 25 ? 'critical' : 'warning',
        message: `Os pneus traseiros acabaram (${tireLife.toFixed(0)}% de vida restante), estou deslizando muito! Preciso parar nos boxes.`,
      });
    }

    if (wet && (car.tireCompound === 'soft' || car.tireCompound === 'medium' || car.tireCompound === 'hard')) {
      messages.push({
        id: `rad_wet_${car.driverId}`,
        senderName: car.driverName,
        senderRole: 'PILOTO',
        severity: 'critical',
        message: 'Pista encharcada com pneus slick! Zero aderência na frenagem — chamem para Intermediário ou Chuva!',
      });
    } else if (params.trackTempC > 50 && car.tireCompound === 'soft') {
      messages.push({
        id: `rad_blister_${car.driverId}`,
        senderName: chiefName,
        senderRole: 'ENGENHEIRO-CHEFE',
        severity: 'warning',
        message: `Asfalto a ${params.trackTempC.toFixed(0)}°C está causando bolhas (blistering) no pneu Macio de #${car.shortCode}. Considere antecipar pit para Duro.`,
      });
    }

    // Alerta de Estol Aerodinâmico e Porpoising (Interface IF-M04-M05)
    if (car.isPlayer && (car.porpoisingRiskPct ?? 0) > 48) {
      messages.push({
        id: `rad_porp_${car.driverId}`,
        senderName: car.driverName,
        senderRole: 'PILOTO',
        severity: (car.porpoisingRiskPct ?? 0) > 65 ? 'critical' : 'warning',
        message: 'Cuidado, Chefe! O carro está arrastando no asfalto e perdendo downforce! O assoalho bate forte nas zebras e no fim da reta.',
      });
    }

    if (riskPct >= 61) {
      messages.push({
        id: `rad_risk_${car.driverId}`,
        senderName: 'Engenheiro de Corrida',
        senderRole: 'BOX / ESTRATÉGIA',
        severity: 'warning',
        message: `${car.shortCode} está rodando no limite errático (${riskPct}% risco de erro). Reduza para Normal se quiser evitar rodada ou travada.`,
      });
    }
  }

  return messages;
}

export interface RaceTickOutput {
  cars: LiveCarState[];
  nextFlagState: RaceFlagState;
  nextSafetyCarStatus: 'none' | 'vsc' | 'full_sc';
  events: Array<Omit<RaceControlEvent, 'id'>>;
  leaderLap: number;
  finished: boolean;
  triggeredRedFlag: boolean;
}

function getCompoundWeatherPaceAndRisk(
  compound: LiveCarState['tireCompound'],
  weather: RaceTickInput['trackWeather']
): { paceFactor: number; wearMult: number; crashRiskMult: number } {
  const isSlick = compound === 'soft' || compound === 'medium' || compound === 'hard';
  if (weather === 'sunny' || weather === 'overcast') {
    if (compound === 'inter') return { paceFactor: 0.92, wearMult: 2.1, crashRiskMult: 1.25 };
    if (compound === 'wet') return { paceFactor: 0.86, wearMult: 2.6, crashRiskMult: 1.4 };
    if (compound === 'soft') return { paceFactor: 1.015, wearMult: 1.15, crashRiskMult: 1.0 };
    if (compound === 'hard') return { paceFactor: 0.988, wearMult: 0.82, crashRiskMult: 0.95 };
    return { paceFactor: 1.0, wearMult: 1.0, crashRiskMult: 1.0 };
  }
  if (weather === 'light_rain') {
    if (isSlick) return { paceFactor: 0.89, wearMult: 0.95, crashRiskMult: 2.6 };
    if (compound === 'inter') return { paceFactor: 1.005, wearMult: 1.05, crashRiskMult: 1.05 };
    return { paceFactor: 0.96, wearMult: 1.35, crashRiskMult: 0.95 };
  }
  // heavy_rain
  if (isSlick) return { paceFactor: 0.78, wearMult: 0.9, crashRiskMult: 4.8 };
  if (compound === 'inter') return { paceFactor: 0.93, wearMult: 1.25, crashRiskMult: 1.85 };
  return { paceFactor: 1.0, wearMult: 1.0, crashRiskMult: 1.15 };
}

/**
 * Executa 1 tick completo da simulação de corrida para TODOS os 24 carros:
 * - Impacto real dos 12 atributos em PT-BR dos pilotos
 * - Largada dos boxes (pitLaneStartTicks)
 * - Bandeiras Verde / Amarela / Azul / VSC / Safety Car / Vermelha / Preta (DSQ)
 * - Penalizações da FIA (+5s, +10s, Drive-Through, DSQ)
 * - Duelos roda-a-roda (Ultrapassagem vs Defesa), acidentes e abandonos mecânicos (Jogador e IA)
 */
export function stepRaceSimulationTick(input: RaceTickInput): RaceTickOutput {
  const rng = input.rng ?? Math.random;
  const driverById = new Map<string, Driver>(input.drivers.map(d => [d.id, d]));
  const teamById = new Map<string, Team>(input.allTeams.map(t => [t.id, t]));
  const events: Array<Omit<RaceControlEvent, 'id'>> = [];

  let nextFlag: TrackFlagStatus = input.flagState.flag;
  let expiresAtLap = input.flagState.expiresAtLap;
  let triggeredRedFlag = false;

  if (nextFlag === 'red') {
    return {
      cars: input.cars,
      nextFlagState: input.flagState,
      nextSafetyCarStatus: 'none',
      events: [],
      leaderLap: input.cars[0]?.lap || 1,
      finished: false,
      triggeredRedFlag: false
    };
  }

  const activeLeader = input.cars.find(c => c.status === 'running' && !c.isDisqualified) || input.cars[0];
  const currentLeaderLap = activeLeader?.lap || 1;
  const leaderDistance = activeLeader?.totalDistance || 0;

  // Expira bandeira amarela/VSC/SC quando atingir a volta programada
  if (nextFlag !== 'green' && currentLeaderLap >= expiresAtLap) {
    const endedLabel =
      nextFlag === 'sc'
        ? 'SAFETY CAR RECOLHE AOS BOXES'
        : nextFlag === 'vsc'
        ? 'VIRTUAL SAFETY CAR ENCERRADO'
        : 'PISTA LIBERADA EM BANDEIRA VERDE';
    events.push({
      lap: currentLeaderLap,
      flag: 'green',
      title: 'BANDEIRA VERDE',
      message: `${endedLabel} — Disputas e ultrapassagens retomadas na volta ${currentLeaderLap}.`
    });
    nextFlag = 'green';
    expiresAtLap = 0;
  }

  const orderedByPos = [...input.cars].sort((a, b) => a.position - b.position);
  const aheadCarByDriver = new Map<string, LiveCarState>();
  for (let i = 1; i < orderedByPos.length; i++) {
    aheadCarByDriver.set(orderedByPos[i].driverId, orderedByPos[i - 1]);
  }

  const baseSpeed = 0.007 * input.raceSpeed;
  const lapStep = Math.max(0.001, baseSpeed);

  const escalateRaceControl = (
    lap: number,
    severity: 'yellow' | 'vsc' | 'sc' | 'red',
    reasonText: string
  ) => {
    const rank: Record<TrackFlagStatus, number> = { green: 0, yellow: 1, vsc: 2, sc: 3, red: 4 };
    if (rank[severity] <= rank[nextFlag]) return;

    nextFlag = severity;
    if (severity === 'yellow') {
      expiresAtLap = Math.min(input.totalLaps, lap + 1);
      events.push({
        lap,
        flag: 'yellow',
        title: 'BANDEIRA AMARELA NO SETOR',
        message: `${reasonText} Ultrapassagens temporariamente suspensas.`
      });
    } else if (severity === 'vsc') {
      expiresAtLap = Math.min(input.totalLaps, lap + 2);
      events.push({
        lap,
        flag: 'vsc',
        title: 'VIRTUAL SAFETY CAR (VSC)',
        message: `${reasonText} Todos os pilotos devem respeitar o delta de -35% de velocidade.`
      });
    } else if (severity === 'sc') {
      expiresAtLap = Math.min(input.totalLaps, lap + 3);
      events.push({
        lap,
        flag: 'sc',
        title: 'SAFETY CAR NA PISTA',
        message: `${reasonText} Pelotão reagrupado atrás do Safety Car oficial da FIA.`
      });
    } else if (severity === 'red') {
      expiresAtLap = lap;
      triggeredRedFlag = true;
      events.push({
        lap,
        flag: 'red',
        title: 'BANDEIRA VERMELHA — CORRIDA INTERROMPIDA',
        message: `${reasonText} Carros retornam ao pit lane para inspeção e reparos.`
      });
    }
  };

  const steppedCars: LiveCarState[] = input.cars.map((car, indexInList) => {
    if (car.status !== 'running' || car.isDisqualified) return car;

    // Largada dos Boxes: aguarda o pelotão cruzar a curva 1 antes de liberar saída
    if (car.startedFromPitLane && (car.pitLaneStartTicks ?? 0) > 0) {
      const remTicks = (car.pitLaneStartTicks ?? 0) - 1;
      return {
        ...car,
        inPitLane: remTicks > 0,
        pitLaneStartTicks: remTicks,
        lastIncidentText: remTicks > 0 ? 'Largada dos boxes · Aguardando luz verde na saída do pit' : undefined
      };
    }

    const driver = driverById.get(car.driverId);
    const team = teamById.get(car.teamId);
    const wetTrack = isWetWeather(input.trackWeather);
    // Trava climática: na chuva, modos extremos (Ataque/Economia) são bloqueados para Normal
    const effectivePaceMode: LiveCarState['paceMode'] =
      wetTrack && (car.paceMode === 'attack' || car.paceMode === 'conserve' || car.paceMode === 'push')
        ? 'balanced'
        : car.paceMode;

    const drvProfile = computeDriverRaceProfile(driver, {
      weather: input.trackWeather,
      aeroDemand: input.aeroDemand,
      gapToAheadSec: car.gapToAheadSec,
      tireWearPercent: car.tireWearPercent
    });
    const weatherComp = getCompoundWeatherPaceAndRisk(car.tireCompound, input.trackWeather);

    let speedMod = 1.0 * drvProfile.paceMultiplier * weatherComp.paceFactor;

    if (effectivePaceMode === 'attack') speedMod *= 1.036;
    else if (effectivePaceMode === 'push') speedMod *= 1.018;
    else if (effectivePaceMode === 'conserve') speedMod *= 0.972;

    if (car.engineMode === 'overtake') speedMod *= 1.055;
    else if (car.engineMode === 'deploy') speedMod *= 1.028;
    else if (car.engineMode === 'harvest') speedMod *= 0.955;

    if (car.aeroMode === 'mode_x') {
      const modeXGain = car.isPlayer
        ? 1.015 + (input.playerPorpoisingRiskPct > 55 ? -0.008 : 0.012)
        : 1.022;
      speedMod *= modeXGain;
    } else if (car.aeroMode === 'mode_z') {
      speedMod *= car.isPlayer ? 1.014 : 1.012;
    }

    const ratingFactor = car.isPlayer
      ? 0.985 + (input.playerCarRating - 75) * 0.0014 - Math.max(0, input.playerTotalMassKg - 772) * 0.0004
      : 0.985 + ((team?.carRating || 80) - 75) * 0.0013;
    speedMod *= Math.max(0.94, Math.min(1.06, ratingFactor));

    // Dano aerodinâmico/estrutural reduz ritmo
    if (car.damagePercent > 0) {
      speedMod *= Math.max(0.74, 1.0 - car.damagePercent * 0.0022);
    }

    // Penalidade por desgaste crítico de pneus
    if (car.tireWearPercent > 75) speedMod *= 0.91;
    else if (car.tireWearPercent > 52) speedMod *= 0.96;

    // Efeito altitude / densidade do ar no Modo X
    const altitudeScale = input.airDensityKgM3 / 1.225;
    if (car.isPlayer && car.aeroMode === 'mode_x') {
      speedMod *= 1 + (1 - altitudeScale) * 0.012;
    }

    // Consumo de E-Fuel + Modo de Pilotagem + Mistura + Leveza do Tanque (~0.03s por kg queimado)
    // Calibração de Consumo por Circuito (Fórmula FIA 2026):
    // Pistas com alta contagem de voltas curtas (ex: Mônaco com 78 voltas) demandam queima nominal menor por volta (~1.15-1.25 kg/volta).
    // Circuitos longos (ex: Spa, 44 voltas) queimam ~2.15 kg/volta. Essa normalização impede pane seca prematura sob pilotagem padrão.
    const nominalTrackLapBurn = input.totalLaps > 0
      ? ((car.fuelInitialKg || 100) / input.totalLaps) * 0.94
      : (car.fuelBurnKgPerLap || 1.6);
    const effectiveLapBurnRate = car.fuelBurnKgPerLap > 0
      ? Math.min(car.fuelBurnKgPerLap, nominalTrackLapBurn * 1.18)
      : nominalTrackLapBurn;

    const flagFuelMult = nextFlag === 'sc' ? 0.42 : nextFlag === 'vsc' ? 0.52 : 1.0;
    const mixBurnMultiplier = car.fuelMixMode === 'rich' ? 2.0 : car.fuelMixMode === 'lean' ? 0.7 : 1.0;
    const paceFuelMultiplier =
      effectivePaceMode === 'attack' ? 1.2 : effectivePaceMode === 'conserve' ? 0.8 : 1.0;
    const fuelBurnedThisTick =
      baseSpeed * speedMod * effectiveLapBurnRate * mixBurnMultiplier * paceFuelMultiplier * flagFuelMult;
    const newFuelRemaining = Math.max(0, car.fuelRemainingKg - fuelBurnedThisTick);

    if (newFuelRemaining <= 0) {
      events.push({
        lap: car.lap,
        flag: 'yellow',
        title: `PANE SECA — #${car.driverNumber} ${car.shortCode}`,
        message: `${car.driverName} ficou sem e-Fuel na volta ${car.lap} e abandonou na área de escape.`
      });
      escalateRaceControl(car.lap, 'yellow', `Carro #${car.driverNumber} (${car.shortCode}) parado por Pane Seca.`);
      return {
        ...car,
        fuelRemainingKg: 0,
        status: 'retired' as const,
        retireReason: 'Pane Seca (Combustível Esgotado)',
        lastIncidentText: 'DNF · Pane Seca'
      };
    }

    // Cada kg queimado alivia ~0.03s por volta (ex.: 100kg cheio vs 5kg no fim = ~2.85s mais leve)
    const weightPenaltySec = newFuelRemaining * 0.03;
    const activeFuelSavingPenaltySec = car.fuelMixMode === 'lean' ? 0.0 : car.fuelSavingPenaltySec;
    speedMod *= 1.0 - (newFuelRemaining / 100) * 0.022;
    if (activeFuelSavingPenaltySec > 0) speedMod *= 1.0 - activeFuelSavingPenaltySec * 0.035;
    if (car.fuelMixMode === 'rich') speedMod *= 1.035;
    else if (car.fuelMixMode === 'lean') speedMod *= 0.965;

    // Bandeira Azul para retardatários
    const isLappedCar = leaderDistance - car.totalDistance >= 0.85;
    const fasterBehind = input.cars.some(
      other =>
        other.driverId !== car.driverId &&
        other.status === 'running' &&
        !other.isDisqualified &&
        other.totalDistance < car.totalDistance &&
        car.totalDistance - other.totalDistance < 0.028 &&
        leaderDistance - other.totalDistance < 0.55
    );
    const hasBlueFlag = Boolean(isLappedCar && fasterBehind && nextFlag === 'green');
    if (hasBlueFlag) {
      speedMod *= 0.88; // Cede passagem com segurança
    }

    // Duelo roda-a-roda (Ultrapassagem vs Defesa) sob Bandeira Verde
    let newDamage = car.damagePercent;
    let newPenaltySec = car.penaltySec || 0;
    let newPenaltiesCount = car.penaltiesCount || 0;
    let lastIncidentText = car.lastIncidentText;

    const carAhead = aheadCarByDriver.get(car.driverId);
    if (
      nextFlag === 'green' &&
      !car.inPitLane &&
      carAhead &&
      carAhead.status === 'running' &&
      !carAhead.inPitLane &&
      car.gapToAheadSec > 0 &&
      car.gapToAheadSec < 0.45 &&
      indexInList > 0
    ) {
      const defDriver = driverById.get(carAhead.driverId);
      const defProfile = computeDriverRaceProfile(defDriver, {
        weather: input.trackWeather,
        aeroDemand: input.aeroDemand,
        gapToAheadSec: carAhead.gapToAheadSec,
        tireWearPercent: carAhead.tireWearPercent
      });
      const paceAdv = (drvProfile.overtakePower - defProfile.defensePower) * 0.015;
      const pushBonus = car.paceMode === 'attack' || car.engineMode === 'overtake' ? 0.14 : 0;
      const passChance = Math.max(0.08, Math.min(0.85, 0.35 + paceAdv + pushBonus));

      if (rng() > passChance) {
        // Defensor fechou a porta -> atacante perde leve embalo atrás
        speedMod *= 0.986;
      } else if (rng() < 0.018 * lapStep * drvProfile.incidentRiskMultiplier * (car.paceMode === 'attack' ? 1.5 : 1.0)) {
        // Toque roda-a-roda durante disputa intensa (~1.8% base por volta de disputa lado a lado)
        const hitDmg = Math.round(8 + rng() * 16);
        newDamage = Math.min(100, newDamage + hitDmg);
        lastIncidentText = `Toque em disputa (+${hitDmg}% dano)`;
        if (rng() < 0.45) {
          newPenaltySec += 5;
          newPenaltiesCount += 1;
          events.push({
            lap: car.lap,
            flag: 'penalty',
            title: `PENALIDADE FIA: +5s (#${car.driverNumber} ${car.shortCode})`,
            message: `${car.driverName} recebeu +5s por causar colisão durante tentativa de ultrapassagem.`
          });
        }
      }
    }

    // Limites de pista & infrações sob ataque / VSC / Bandeira Azul
    if (!car.inPitLane) {
      if ((nextFlag === 'vsc' || nextFlag === 'yellow') && car.paceMode === 'attack' && rng() < 0.12 * lapStep) {
        newPenaltySec += 10;
        newPenaltiesCount += 1;
        lastIncidentText = 'Infração sob VSC/Amarela (+10s)';
        events.push({
          lap: car.lap,
          flag: 'penalty',
          title: `PENALIDADE FIA: +10s (#${car.driverNumber} ${car.shortCode})`,
          message: `${car.driverName} excedeu o delta sob ${nextFlag === 'vsc' ? 'VSC' : 'Bandeira Amarela'}.`
        });
      } else if (
        nextFlag === 'green' &&
        car.paceMode === 'attack' &&
        rng() < 0.015 * lapStep * drvProfile.penaltyRiskMultiplier
      ) {
        newPenaltySec += 5;
        newPenaltiesCount += 1;
        lastIncidentText = 'Track Limits (+5s FIA)';
        events.push({
          lap: car.lap,
          flag: 'penalty',
          title: `LIMITE DE PISTA: +5s (#${car.driverNumber} ${car.shortCode})`,
          message: `Comissários aplicaram +5s a ${car.driverName} por exceder limites da pista repetidamente.`
        });
      }
    }

    // Bandeira Preta (DSQ) por excesso grave de infrações acumuladas (>= 4 penalizações)
    if (newPenaltiesCount >= 4) {
      events.push({
        lap: car.lap,
        flag: 'black',
        title: `BANDEIRA PRETA (DSQ) — #${car.driverNumber} ${car.shortCode}`,
        message: `${car.driverName} foi DESCLASSIFICADO pela FIA após ${newPenaltiesCount} infrações graves em corrida.`
      });
      return {
        ...car,
        penaltySec: newPenaltySec,
        penaltiesCount: newPenaltiesCount,
        isDisqualified: true,
        status: 'retired' as const,
        retireReason: 'Bandeira Preta (DSQ FIA)',
        lastIncidentText: 'DSQ · Bandeira Preta'
      };
    }

    // Controle de velocidade sob Flags (SC / VSC / Amarela) & Pit Lane
    if (nextFlag === 'sc') {
      if (car.position === 1) {
        speedMod = Math.min(speedMod, 0.54);
      } else {
        speedMod = car.gapToAheadSec > 0.75 ? Math.min(speedMod, 0.78) : Math.min(speedMod, 0.54);
      }
    } else if (nextFlag === 'vsc') {
      speedMod = Math.min(speedMod, 0.66);
    } else if (nextFlag === 'yellow') {
      speedMod = Math.min(speedMod, 0.84);
    }

    if (car.inPitLane) {
      speedMod *= 0.28;
    }

    // Avaliação de Risco de Erro por Atributos, Clima, Pista e Desgaste
    const errorEval = computeLapErrorRiskPct({
      driver,
      circuitId: input.circuitId,
      weather: input.trackWeather,
      tireWearPercent: car.tireWearPercent,
      paceMode: effectivePaceMode,
      porpoisingRiskPct: input.playerPorpoisingRiskPct,
      isPlayer: car.isPlayer,
    });
    let lastErrorType = car.lastErrorType;

    // Probabilidade real de erros e incidentes (Rodada Simples, Travada de Roda, Batida Leve, Batida Grave/DNF)
    if (!car.inPitLane && nextFlag === 'green') {
      const driverTrustVal = driver?.trust ?? 75;
      const trustRiskMult = driverTrustVal <= 0 ? 2.2 : driverTrustVal <= 20 ? 1.5 : 1.0;
      const wetWrongTireMult = weatherComp.crashRiskMult;

      // Escala por lapStep para manter média realista em GP de 57 voltas (~1.5–2.5 DNFs secos; alto na chuva c/ slick)
      const baseErrorProbPerLap = Math.min(0.18, errorEval.rawFormulaErrorPct * 0.0042) * wetWrongTireMult * trustRiskMult;
      const incidentRollProb = baseErrorProbPerLap * lapStep;

      if (rng() < incidentRollProb) {
        const severityRoll = rng();
        // 1) Rodada Simples (0..0.32): perde 2 a 5 posições (~0.08–0.13 volta), gera flatspot e aciona Bandeira Amarela
        if (severityRoll < 0.32 && newDamage < 70) {
          const lossLap = 0.075 + rng() * 0.055;
          const flatspotWear = Math.min(100, car.tireWearPercent + 7);
          lastErrorType = 'spin';
          lastIncidentText = `Rodada simples (-${(lossLap * input.baseLapTimeSec).toFixed(1)}s · -2 a -5 pos.)`;
          escalateRaceControl(
            car.lap,
            'yellow',
            `#${car.driverNumber} ${car.shortCode} rodou na pista, perdeu posições e retornou com desgaste nos pneus.`
          );
          return {
            ...car,
            paceMode: effectivePaceMode,
            distanceOnLap: Math.max(0, car.distanceOnLap - lossLap),
            totalDistance: Math.max(0, car.totalDistance - lossLap),
            tireWearPercent: Math.round(flatspotWear * 10) / 10,
            damagePercent: newDamage,
            penaltySec: newPenaltySec,
            penaltiesCount: newPenaltiesCount,
            hasBlueFlag,
            errorRiskPct: errorEval.errorRiskPct,
            errorStateLabel: errorEval.errorStateLabel,
            lastErrorType,
            lastIncidentText
          };
        }
        // 2) Travada de Roda (0.32..0.68): perda menor de tempo (~2-3s) e desgaste no pneu dianteiro
        if (severityRoll < 0.68 && newDamage < 80) {
          const lossLap = 0.025 + rng() * 0.018;
          const flatspotWear = Math.min(100, car.tireWearPercent + 4.5);
          lastErrorType = 'lockup';
          lastIncidentText = `Travada de roda (-${(lossLap * input.baseLapTimeSec).toFixed(1)}s · Flatspot)`;
          return {
            ...car,
            paceMode: effectivePaceMode,
            distanceOnLap: Math.max(0, car.distanceOnLap - lossLap),
            totalDistance: Math.max(0, car.totalDistance - lossLap),
            tireWearPercent: Math.round(flatspotWear * 10) / 10,
            penaltySec: newPenaltySec,
            penaltiesCount: newPenaltiesCount,
            hasBlueFlag,
            errorRiskPct: errorEval.errorRiskPct,
            errorStateLabel: errorEval.errorStateLabel,
            lastErrorType,
            lastIncidentText
          };
        }
        // 3) Batida Leve (0.68..0.85, menor se slick em chuva pesada): dano na asa dianteira / aero, pede reparo no pit
        if (severityRoll < 0.85 && wetWrongTireMult < 3.0 && newDamage < 72) {
          const addedDmg = Math.round(12 + rng() * 12);
          newDamage = Math.min(89, newDamage + addedDmg);
          lastErrorType = 'contact';
          lastIncidentText = `Batida leve · Asa dianteira avariada (+${addedDmg}% dano · Pit recomendado)`;
          events.push({
            lap: car.lap,
            flag: 'yellow',
            title: `BATIDA LEVE — #${car.driverNumber} ${car.shortCode}`,
            message: `${car.driverName} tocou no muro/zebra na volta ${car.lap} e sofreu avaria aerodinâmica (+${addedDmg}% dano).`
          });
          escalateRaceControl(car.lap, 'yellow', `Detritos leves de #${car.driverNumber} (${car.shortCode}) na pista.`);
          return {
            ...car,
            paceMode: effectivePaceMode,
            distanceOnLap: Math.max(0, car.distanceOnLap - 0.03),
            totalDistance: Math.max(0, car.totalDistance - 0.03),
            damagePercent: newDamage,
            penaltySec: newPenaltySec,
            penaltiesCount: newPenaltiesCount,
            hasBlueFlag,
            errorRiskPct: errorEval.errorRiskPct,
            errorStateLabel: errorEval.errorStateLabel,
            lastErrorType,
            lastIncidentText
          };
        }

        // 4) Batida Grave / DNF com acionamento de VSC, Safety Car ou Bandeira Vermelha
        const flagRoll = rng();
        const chosenFlag: 'vsc' | 'sc' | 'red' =
          flagRoll < 0.14 || input.trackWeather === 'heavy_rain'
            ? 'red'
            : flagRoll < 0.56
            ? 'sc'
            : 'vsc';
        const reason =
          weatherComp.crashRiskMult >= 2.5
            ? 'Acidente por Aquaplanagem (Pneu Inadequado)'
            : driverTrustVal <= 15
            ? 'Erro de pilotagem sob tensão (Crise de Confiança com o box)'
            : 'Batida Grave contra a barreira (Colisão)';
        lastErrorType = 'dnf';
        events.push({
          lap: car.lap,
          flag: chosenFlag,
          title: `BATIDA GRAVE & DNF — #${car.driverNumber} ${car.shortCode}`,
          message: `${car.driverName} abandonou após forte impacto na volta ${car.lap}: ${reason}.`
        });
        escalateRaceControl(car.lap, chosenFlag, `Acidente grave com #${car.driverNumber} (${car.shortCode}) na volta ${car.lap}.`);
        return {
          ...car,
          paceMode: effectivePaceMode,
          damagePercent: 100,
          penaltySec: newPenaltySec,
          penaltiesCount: newPenaltiesCount,
          status: 'retired' as const,
          retireReason: reason,
          errorRiskPct: errorEval.errorRiskPct,
          errorStateLabel: errorEval.errorStateLabel,
          lastErrorType,
          lastIncidentText: `DNF · ${reason}`
        };
      }
    }

    // Dano acumulado >= 90% obriga abandono estrutural
    if (newDamage >= 90) {
      events.push({
        lap: car.lap,
        flag: 'vsc',
        title: `ABANDONO POR DANOS — #${car.driverNumber} ${car.shortCode}`,
        message: `${car.driverName} abandonou com ${newDamage}% de danos estruturais no chassi/assoalho.`
      });
      escalateRaceControl(car.lap, 'vsc', `Detritos de #${car.driverNumber} (${car.shortCode}) na pista.`);
      return {
        ...car,
        damagePercent: newDamage,
        status: 'retired' as const,
        retireReason: 'Danos Estruturais Irreparáveis',
        lastIncidentText: 'DNF · Danos Críticos'
      };
    }

    // Atualização de distância e volta
    let newDist = car.distanceOnLap + baseSpeed * speedMod;
    let newLap = car.lap;
    let inPit = car.inPitLane;
    let pitDurationLeft = car.pitDurationSec;

    if (inPit) {
      pitDurationLeft = Math.max(0, Math.round((pitDurationLeft - 0.8 * input.raceSpeed) * 10) / 10);
      if (pitDurationLeft <= 0 && newDist > 0.35) {
        inPit = false;
      }
    }

    let calculatedLapTime = car.lastLapTime;
    if (newDist >= 1.0) {
      newDist = newDist - 1.0;
      newLap = car.lap + 1;

      // Checagem de falha mecânica ao completar volta (Jogador e IA)
      if (car.isPlayer) {
        const thermalOverloadRisk =
          input.playerThermalMarginC < 0 ? Math.min(0.018, Math.abs(input.playerThermalMarginC) * 0.0015) : 0;
        const fatigueRisk = input.playerFatigueLifeRaces < 3 ? 0.006 : 0;
        const baseRelRisk = Math.max(0, (92 - input.playerAvgReliability) * 0.00025);
        const lowRelPuRisk =
          input.playerAvgReliability < 75 ? (75 - input.playerAvgReliability) * 0.00045 : 0;
        const totalMechRisk = thermalOverloadRisk + fatigueRisk + baseRelRisk + lowRelPuRisk;
        if (totalMechRisk > 0 && rng() < totalMechRisk) {
          const isPuFailure =
            thermalOverloadRisk + lowRelPuRisk >= fatigueRisk || input.playerAvgReliability < 74;
          const reason = isPuFailure
            ? thermalOverloadRisk > 0
              ? `Superaquecimento PU/ERS (${input.playerBatteryCellTempC}°C · Fumaça no escapamento)`
              : `Falha na Unidade de Potência (Fumaça saindo do escapamento · ${Math.round(input.playerAvgReliability)}% Conf.)`
            : 'Falha hidráulica / fadiga na caixa de câmbio';
          events.push({
            lap: newLap,
            flag: 'yellow',
            title: isPuFailure
              ? `FUMAÇA NO ESCAPAMENTO — #${car.driverNumber} ${car.shortCode}`
              : `ABANDONO MECÂNICO — #${car.driverNumber} ${car.shortCode}`,
            message: isPuFailure
              ? `Fumaça espessa saindo do escapamento de ${car.driverName} na volta ${newLap}! ${reason}.`
              : `${car.driverName} sofreu falha na volta ${newLap}: ${reason}.`
          });
          escalateRaceControl(
            newLap,
            'yellow',
            isPuFailure
              ? `Carro #${car.driverNumber} (${car.shortCode}) com fumaça saindo do escapamento na volta ${newLap}!`
              : `Carro #${car.driverNumber} lento/parado com falha mecânica.`
          );
          return {
            ...car,
            lap: newLap,
            status: 'retired' as const,
            retireReason: reason,
            lastIncidentText: isPuFailure ? 'DNF · Fumaça no Escapamento (PU)' : `DNF · ${reason}`
          };
        }
      } else {
        // Falha mecânica realista de IA (~0.18% por volta por carro, menor para equipes top)
        const aiRelFactor = Math.max(0.4, 1.35 - ((team?.carRating || 80) - 70) * 0.025);
        if (rng() < 0.0018 * aiRelFactor) {
          const aiReason = rng() < 0.55 ? 'Falha na Unidade de Potência (MGU-K/ICE)' : 'Quebra de Câmbio / Transmissão';
          events.push({
            lap: newLap,
            flag: 'vsc',
            title: `ABANDONO MECÂNICO (IA) — #${car.driverNumber} ${car.shortCode}`,
            message: `${car.driverName} (${team?.shortName || car.teamId}) abandonou na volta ${newLap}: ${aiReason}.`
          });
          escalateRaceControl(newLap, rng() < 0.5 ? 'vsc' : 'yellow', `Carro #${car.driverNumber} parado na lateral com fumaça.`);
          return {
            ...car,
            lap: newLap,
            status: 'retired' as const,
            retireReason: aiReason,
            lastIncidentText: `DNF · ${aiReason}`
          };
        }
      }

      const mixLapDelta = car.fuelMixMode === 'rich' ? -0.3 : car.fuelMixMode === 'lean' ? 0.25 : 0;
      const physicsLapOffset = car.isPlayer
        ? (80 - input.playerCarRating) * 0.06 + (input.playerTotalMassKg - 772) * 0.03
        : 0;
      const driverLapOffset = (1.0 - drvProfile.paceMultiplier) * input.baseLapTimeSec * 0.5;
      const jitter = (rng() - 0.5) * 2 * drvProfile.lapJitterAmplitudeSec;
      calculatedLapTime =
        Math.round(
          (input.baseLapTimeSec +
            weightPenaltySec +
            activeFuelSavingPenaltySec +
            mixLapDelta +
            physicsLapOffset +
            driverLapOffset +
            jitter) *
            1000
        ) / 1000;
    }

    // Bateria ERS + Temperatura da pista (>50°C gera bolhas em Softs e estresse térmico de PU > 115°C = Derating Térmico)
    const trackErsHarvestBias = Math.max(-0.35, Math.min(0.35, input.netErsBalanceKjPerLap / 4000));
    let newSoc = car.socPercent;
    if (car.engineMode === 'overtake') newSoc = Math.max(0, newSoc - 1.8 * input.raceSpeed);
    else if (car.engineMode === 'deploy') newSoc = Math.max(0, newSoc - (0.9 - trackErsHarvestBias * 0.35) * input.raceSpeed);
    else if (car.engineMode === 'harvest') newSoc = Math.min(100, newSoc + (1.4 + trackErsHarvestBias * 0.4) * input.raceSpeed);
    else newSoc = Math.max(10, Math.min(95, newSoc + trackErsHarvestBias * 0.25 + (rng() * 0.4 - 0.2)));

    const effectiveTrackTempC =
      input.trackTempC ??
      (input.trackWeather === 'heavy_rain'
        ? 23
        : input.trackWeather === 'light_rain'
        ? 26
        : input.trackWeather === 'overcast'
        ? 34
        : 44 + input.coolingDemandIndex01 * 10);

    const targetBatteryTemp = car.isPlayer
      ? Math.min(98, input.playerBatteryCellTempC + (100 - newSoc) * 0.12 + input.coolingDemandIndex01 * 4.5)
      : Math.min(95, 45 + (100 - newSoc) * 0.4);

    // Temperatura ICE/PU (°C): Ataque + Mistura Rica + Calor > 50°C pode romper 115°C
    const modeHeatOffset =
      effectivePaceMode === 'attack' ? 8.5 : effectivePaceMode === 'conserve' ? -5.0 : 0;
    const mixHeatOffset = car.fuelMixMode === 'rich' ? 6.0 : car.fuelMixMode === 'lean' ? -4.5 : 0;
    const coolingPenaltyC = car.isPlayer ? Math.max(-4, -input.playerThermalMarginC * 0.85) : 0;
    const rawIceTempC =
      94 +
      Math.max(0, effectiveTrackTempC - 35) * 0.52 +
      input.coolingDemandIndex01 * 7.5 +
      modeHeatOffset +
      mixHeatOffset +
      coolingPenaltyC;
    const prevIceTemp = car.iceTempC ?? 99;
    const nextIceTempC = Math.round((prevIceTemp * 0.7 + rawIceTempC * 0.3) * 10) / 10;

    const thermalDerating =
      nextIceTempC >= 115 ||
      (car.isPlayer && input.playerThermalMarginC < -4 && car.batteryTempC > 64);
    const hasDerating = newSoc <= 5 || thermalDerating;
    if (thermalDerating) {
      speedMod *= 0.94; // Derating térmico reduz potência entregue
    }

    // Fórmula de Desgaste de Pneus:
    // Base × Modo (Ataque 3x, Normal 1x, Economia 0.6x) × Temp. da Pista × Fator Carro/Suspensão ÷ Gestão de Pneus do Piloto
    const flagWearMult = nextFlag === 'sc' ? 0.3 : nextFlag === 'vsc' ? 0.45 : 1.0;
    const baseCompoundWearPerLap =
      car.tireCompound === 'soft'
        ? 4.4
        : car.tireCompound === 'medium'
        ? 2.7
        : car.tireCompound === 'hard'
        ? 1.85
        : 2.5;
    const paceWearMultiplier =
      effectivePaceMode === 'attack'
        ? 3.0
        : effectivePaceMode === 'push'
        ? 1.85
        : effectivePaceMode === 'conserve'
        ? 0.6
        : 1.0;
    const trackTempFactor =
      effectiveTrackTempC > 50
        ? car.tireCompound === 'soft'
          ? 1.48 // Calor extremo derrete/gera bolhas nos Macios
          : 1.24
        : effectiveTrackTempC < 26
        ? 0.88
        : 1.0 + Math.max(0, effectiveTrackTempC - 35) * 0.012;
    const playerTireMult = car.isPlayer
      ? input.playerTireWearRateMultiplier * (0.85 + input.tireStressIndex01 * 0.35)
      : 0.92 + input.tireStressIndex01 * 0.22;
    const porpoisingTireMult = car.isPlayer && input.playerPorpoisingRiskPct > 55 ? 1.08 : 1.0;
    const tireMgmtSkill = driver?.attributes.tireManagement ?? 78;
    const driverTireDivisor = Math.max(0.78, Math.min(1.25, 0.72 + (tireMgmtSkill / 100) * 0.45));

    const tireWearDelta =
      ((baseCompoundWearPerLap * paceWearMultiplier * trackTempFactor * playerTireMult * porpoisingTireMult) /
        driverTireDivisor) *
      weatherComp.wearMult *
      flagWearMult *
      lapStep;
    const newWear = Math.min(100, car.tireWearPercent + tireWearDelta);
    const nextTireTempC = Math.round(
      ((effectiveTrackTempC + 52) * (effectivePaceMode === 'attack' ? 1.09 : effectivePaceMode === 'conserve' ? 0.93 : 1.0)) * 10
    ) / 10;

    return {
      ...car,
      paceMode: effectivePaceMode,
      lap: newLap,
      distanceOnLap: newDist,
      totalDistance: newLap - 1 + newDist,
      currentLapTime: Math.round(newDist * input.baseLapTimeSec * 10) / 10,
      lastLapTime: newLap > car.lap ? calculatedLapTime : car.lastLapTime,
      bestLapTime: newLap > car.lap ? Math.min(car.bestLapTime, calculatedLapTime) : car.bestLapTime,
      fuelRemainingKg: Math.round(newFuelRemaining * 100) / 100,
      socPercent: Math.round(newSoc),
      hasDerating,
      tireWearPercent: Math.round(newWear * 10) / 10,
      tireTempC: nextTireTempC,
      inPitLane: inPit,
      pitDurationSec: pitDurationLeft,
      damagePercent: newDamage,
      penaltySec: newPenaltySec,
      penaltiesCount: newPenaltiesCount,
      hasBlueFlag,
      lastIncidentText,
      batteryTempC: Math.round(targetBatteryTemp * 10) / 10,
      iceTempC: nextIceTempC,
      errorRiskPct: errorEval.errorRiskPct,
      errorStateLabel: errorEval.errorStateLabel,
      lastErrorType
    };
  });

  const sortedCars = sortRaceClassification(steppedCars, input.baseLapTimeSec);
  const runningLeader = sortedCars.find(c => c.status === 'running' && !c.isDisqualified) || sortedCars[0];
  const finalLeaderLap = runningLeader?.lap || 1;
  const finished = Boolean(runningLeader && finalLeaderLap >= input.totalLaps);
  const nextSafetyCarStatus: 'none' | 'vsc' | 'full_sc' =
    nextFlag === 'sc' ? 'full_sc' : nextFlag === 'vsc' ? 'vsc' : 'none';

  return {
    cars: sortedCars,
    nextFlagState: { flag: nextFlag, expiresAtLap },
    nextSafetyCarStatus,
    events,
    leaderLap: finalLeaderLap,
    finished,
    triggeredRedFlag
  };
}
