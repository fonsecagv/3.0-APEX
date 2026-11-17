import type { Driver, PrincipalBackgroundId, StaffMember } from '../types/f1';

export type AttributeTrend = 'up' | 'stable' | 'down';

export interface DriverAgeCurveInfo {
  phase: 'young_prodigy' | 'prime' | 'veteran';
  labelPt: string;
  progressionBonusPct: number; // +15% (18-23), +5% (24-29), -15% physical (-0% mental) (30+)
  baseAgeScore: number;
  factor: number;
}

export function computeDriverAgeCurve(age: number): DriverAgeCurveInfo {
  if (age <= 23) {
    return {
      phase: 'young_prodigy',
      labelPt: 'Ascensão Rápida (18–23 anos · +15% XP)',
      progressionBonusPct: 15,
      baseAgeScore: 22,
      factor: 1.15,
    };
  }
  if (age <= 29) {
    return {
      phase: 'prime',
      labelPt: 'Auge Técnico (24–29 anos · +5% XP)',
      progressionBonusPct: 5,
      baseAgeScore: 15,
      factor: 1.05,
    };
  }
  return {
    phase: 'veteran',
    labelPt: 'Veterano (30+ · Físico estagna, Mental sobe)',
    progressionBonusPct: -10,
    baseAgeScore: 10,
    factor: 0.9,
  };
}

export function computeSimulatorXpMultiplier(simFacilityLevel: number): number {
  const clamped = Math.max(1, Math.min(5, Math.round(simFacilityLevel)));
  const table: Record<number, number> = {
    1: 1.0,
    2: 1.35,
    3: 1.75,
    4: 2.15,
    5: 2.5,
  };
  return table[clamped] ?? 1.0;
}

export function computeMoraleMultiplier(mentality: number): number {
  const m = Math.max(0, Math.min(100, mentality));
  if (m >= 85) return 1.25;
  if (m >= 70) return 1.05;
  if (m >= 50) return 0.85;
  return 0.6;
}

export function getDriverRpgLevel(driver: Driver): number {
  if (typeof driver.rpgLevel === 'number' && driver.rpgLevel >= 1) {
    return Math.min(10, Math.max(1, Math.round(driver.rpgLevel)));
  }
  const ovr =
    driver.ovr ??
    Math.round(
      (driver.attributes.pace +
        driver.attributes.cornering +
        driver.attributes.consistency +
        driver.attributes.braking) /
        4
    );
  return Math.max(1, Math.min(10, Math.round((ovr - 58) / 3.8) + 1));
}

export function getDriverXpProgress(driver: Driver): number {
  if (typeof driver.xp === 'number') {
    return Math.max(0, Math.min(99, Math.round(driver.xp)));
  }
  // Deterministic initial progress from driver attributes so existing cards feel grounded
  const ovr =
    driver.ovr ??
    Math.round((driver.attributes.pace + driver.attributes.cornering + driver.attributes.consistency) / 3);
  return Math.max(10, Math.min(90, ((ovr * 13 + driver.age * 7) % 80) + 10));
}

/**
 * Fórmula oficial de XP do Piloto:
 * XP = (Curva de Idade + Tempo de Pista + Instalação de Simulador) × Multiplicador de Moral
 * Inclui bônus de +20% da Central da Equipe Nível 2+ para jovens talentos (<= 23 anos).
 */
export function computeDriverXpGain(params: {
  driver: Driver;
  trackTimePoints: number; // GPs, treinos livres (TL1) e voltas simuladas
  simFacilityLevel: number;
  teamCentralLevel: number;
}): {
  xpGain: number;
  simMultiplier: number;
  moraleMultiplier: number;
  ageCurve: DriverAgeCurveInfo;
  youthAcademyBonusApplied: boolean;
} {
  const ageCurve = computeDriverAgeCurve(params.driver.age);
  const simMultiplier = computeSimulatorXpMultiplier(params.simFacilityLevel);
  const moraleMultiplier = computeMoraleMultiplier(params.driver.mentality);

  const simComponent = 10 * simMultiplier;
  const ageComponent = ageCurve.baseAgeScore * ageCurve.factor;
  const rawBase = ageComponent + Math.max(0, params.trackTimePoints) + simComponent;

  const youthAcademyBonusApplied = params.driver.age <= 23 && params.teamCentralLevel >= 2;
  const youthMult = youthAcademyBonusApplied ? 1.2 : 1.0;

  // Potencial limita ganho quando o piloto já se aproxima do teto
  const avgCore =
    (params.driver.attributes.pace +
      params.driver.attributes.cornering +
      params.driver.attributes.consistency) /
    3;
  const ceilingGap = Math.max(0.25, Math.min(1.15, (params.driver.potential - avgCore + 6) / 14));

  const xpGain = Math.max(2, Math.round(rawBase * moraleMultiplier * youthMult * ceilingGap * 0.45));
  return {
    xpGain,
    simMultiplier,
    moraleMultiplier,
    ageCurve,
    youthAcademyBonusApplied,
  };
}

export function computeDriverAttributeTrends(
  driver: Driver,
  simFacilityLevel: number = 1
): Partial<Record<keyof Driver['attributes'], AttributeTrend>> {
  if (driver.attributeTrends && Object.keys(driver.attributeTrends).length > 0) {
    return driver.attributeTrends;
  }

  const highMorale = driver.mentality >= 72;
  const lowMorale = driver.mentality < 52;
  const goodSim = simFacilityLevel >= 2;
  const underPotential = driver.attributes.pace < driver.potential;

  if (driver.age <= 23) {
    return {
      pace: underPotential && !lowMorale ? 'up' : 'stable',
      cornering: underPotential && !lowMorale ? 'up' : 'stable',
      braking: !lowMorale ? 'up' : 'stable',
      reactionTime: !lowMorale ? 'up' : 'stable',
      consistency: !lowMorale ? 'up' : 'stable',
      tireManagement: goodSim || highMorale ? 'up' : 'stable',
      wetWeather: goodSim ? 'up' : 'stable',
      overtaking: !lowMorale ? 'up' : 'stable',
      defending: !lowMorale ? 'up' : 'stable',
      composure: highMorale ? 'up' : 'stable',
      feedback: 'up',
    };
  }

  if (driver.age <= 29) {
    return {
      pace: underPotential && highMorale ? 'up' : lowMorale ? 'down' : 'stable',
      cornering: underPotential && highMorale ? 'up' : 'stable',
      braking: highMorale ? 'up' : 'stable',
      reactionTime: 'stable',
      consistency: !lowMorale ? 'up' : 'stable',
      tireManagement: !lowMorale ? 'up' : 'stable',
      wetWeather: highMorale ? 'up' : 'stable',
      overtaking: highMorale ? 'up' : 'stable',
      defending: !lowMorale ? 'up' : 'stable',
      composure: 'up',
      feedback: 'up',
    };
  }

  // Veterano (30+): velocidade/reação estagnam ou caem; mental e feedback continuam subindo
  const ageDecay = driver.age >= 35 || lowMorale;
  return {
    pace: ageDecay ? 'down' : 'stable',
    cornering: lowMorale ? 'down' : 'stable',
    braking: 'stable',
    reactionTime: ageDecay ? 'down' : 'stable',
    consistency: !lowMorale ? 'up' : 'stable',
    tireManagement: 'up',
    wetWeather: highMorale ? 'up' : 'stable',
    overtaking: 'stable',
    defending: 'up',
    composure: 'up',
    feedback: 'up',
  };
}

export function applyDriverXpAndEvolution(
  driver: Driver,
  xpGain: number,
  opts?: { simFacilityLevel?: number; applyMilestoneAttributes?: boolean }
): { updatedDriver: Driver; leveledUp: boolean } {
  const simLevel = opts?.simFacilityLevel ?? 1;
  const currentLevel = getDriverRpgLevel(driver);
  const currentXp = getDriverXpProgress(driver);
  const totalXp = currentXp + Math.max(0, xpGain);
  const levelsEarned = currentLevel >= 10 ? 0 : Math.floor(totalXp / 100);
  const nextLevel = Math.min(10, currentLevel + levelsEarned);
  const nextXp = nextLevel >= 10 ? 100 : totalXp % 100;

  const shouldMutateAttributes = levelsEarned > 0 || Boolean(opts?.applyMilestoneAttributes);
  const nextAttrs = { ...driver.attributes };
  const trends = computeDriverAttributeTrends(driver, simLevel);

  if (shouldMutateAttributes) {
    const cap = Math.min(99, Math.max(driver.potential, 75));
    if (driver.age <= 23) {
      if (driver.mentality >= 50) {
        nextAttrs.pace = Math.min(cap, nextAttrs.pace + 1);
        nextAttrs.cornering = Math.min(cap, nextAttrs.cornering + 1);
        nextAttrs.braking = Math.min(cap, nextAttrs.braking + 1);
        nextAttrs.consistency = Math.min(cap, nextAttrs.consistency + 1);
        nextAttrs.feedback = Math.min(99, nextAttrs.feedback + 1);
        trends.pace = 'up';
        trends.cornering = 'up';
        trends.braking = 'up';
        trends.consistency = 'up';
        trends.feedback = 'up';
      }
    } else if (driver.age <= 29) {
      if (driver.mentality >= 55) {
        nextAttrs.consistency = Math.min(cap, nextAttrs.consistency + 1);
        nextAttrs.tireManagement = Math.min(cap, nextAttrs.tireManagement + 1);
        nextAttrs.feedback = Math.min(99, nextAttrs.feedback + 1);
        if (nextAttrs.pace < cap && driver.mentality >= 80) {
          nextAttrs.pace = Math.min(cap, nextAttrs.pace + 1);
          trends.pace = 'up';
        }
        trends.consistency = 'up';
        trends.tireManagement = 'up';
        trends.feedback = 'up';
      }
    } else {
      // Veterano (30+): atributos mentais continuam evoluindo, físicos estagnam ou caem levemente
      nextAttrs.feedback = Math.min(99, nextAttrs.feedback + 1);
      nextAttrs.consistency = Math.min(99, nextAttrs.consistency + 1);
      nextAttrs.tireManagement = Math.min(99, nextAttrs.tireManagement + 1);
      nextAttrs.composure = Math.min(99, nextAttrs.composure + 1);
      trends.feedback = 'up';
      trends.consistency = 'up';
      trends.tireManagement = 'up';
      trends.composure = 'up';

      if (driver.age >= 35 || driver.mentality < 55) {
        nextAttrs.pace = Math.max(60, nextAttrs.pace - 1);
        nextAttrs.reactionTime = Math.max(60, nextAttrs.reactionTime - 1);
        trends.pace = 'down';
        trends.reactionTime = 'down';
      } else {
        trends.pace = 'stable';
        trends.reactionTime = 'stable';
      }
    }
  }

  const nextOvr = Math.round(
    (nextAttrs.pace + nextAttrs.cornering + nextAttrs.consistency + nextAttrs.braking) / 4
  );

  return {
    leveledUp: levelsEarned > 0,
    updatedDriver: {
      ...driver,
      rpgLevel: nextLevel,
      xp: nextXp,
      lastXpDelta: xpGain,
      ovr: nextOvr,
      attributes: nextAttrs,
      attributeTrends: trends,
    },
  };
}

// =========================================================================
// TECHNICAL STAFF RPG PROGRESSION
// XP = (Instalação Central + Sucesso da Equipe + Orçamento + Sinergia Liderança) / Tempo
// OBS: fac_scouting NÃO influencia evolução do staff atual (apenas prospecção de mercado).
// =========================================================================

export const STAFF_LEVEL_TIERS: Record<number, { label: string; minRating: number }> = {
  1: { label: 'Básico', minRating: 60 },
  2: { label: 'Intermediário', minRating: 69 },
  3: { label: 'Avançado', minRating: 77 },
  4: { label: 'Alta Performance', minRating: 85 },
  5: { label: 'Elite', minRating: 92 },
};

export function getStaffMaxLevelForCentral(teamCentralLevel: number): {
  maxStaffLevel: number;
  xpSeasonBonusPct: number;
  youthDriverXpBonusPct: number;
} {
  const lvl = Math.max(1, Math.min(5, Math.round(teamCentralLevel)));
  switch (lvl) {
    case 1:
      return { maxStaffLevel: 2, xpSeasonBonusPct: 0, youthDriverXpBonusPct: 0 };
    case 2:
      return { maxStaffLevel: 3, xpSeasonBonusPct: 15, youthDriverXpBonusPct: 20 };
    case 3:
      return { maxStaffLevel: 4, xpSeasonBonusPct: 30, youthDriverXpBonusPct: 20 };
    case 4:
      return { maxStaffLevel: 5, xpSeasonBonusPct: 45, youthDriverXpBonusPct: 20 };
    default:
      return { maxStaffLevel: 5, xpSeasonBonusPct: 60, youthDriverXpBonusPct: 20 };
  }
}

export function getStaffRpgLevel(member: StaffMember): number {
  if (typeof member.rpgLevel === 'number' && member.rpgLevel >= 1) {
    return Math.min(5, Math.max(1, Math.round(member.rpgLevel)));
  }
  if (member.rating >= 92) return 5;
  if (member.rating >= 85) return 4;
  if (member.rating >= 77) return 3;
  if (member.rating >= 69) return 2;
  return 1;
}

export function getStaffXpProgress(member: StaffMember): number {
  if (typeof member.xp === 'number') {
    return Math.max(0, Math.min(100, Math.round(member.xp)));
  }
  return Math.max(12, Math.min(82, ((member.rating * 7) % 68) + 12));
}

export function computeStaffXpGain(params: {
  staffMember: StaffMember;
  teamCentralLevel: number;
  constructorPosition: number;
  bankBalance: number;
  costCapSpent: number;
  costCapLimit: number;
  principalBackground: PrincipalBackgroundId;
  seasonsElapsed?: number;
}): {
  xpGain: number;
  centralCapInfo: ReturnType<typeof getStaffMaxLevelForCentral>;
  synergyBonus: number;
} {
  const centralCapInfo = getStaffMaxLevelForCentral(params.teamCentralLevel);
  const centralFactor = 14 * (1 + centralCapInfo.xpSeasonBonusPct / 100);

  const pos = Math.max(1, params.constructorPosition);
  const teamSuccess = pos <= 3 ? 28 : pos <= 6 ? 18 : pos <= 9 ? 11 : 5;

  const isHealthyBudget = params.bankBalance >= 8_000_000 && params.costCapSpent <= params.costCapLimit;
  const isCriticalBudget = params.bankBalance < 0 || params.costCapSpent > params.costCapLimit;
  const budgetScore = isHealthyBudget ? 14 : isCriticalBudget ? 2 : 8;

  let synergyBonus = 6;
  if (
    (params.principalBackground === 'chief_engineer' || params.principalBackground === 'engineer') &&
    (params.staffMember.role === 'head_aero' || params.staffMember.role === 'head_pu')
  ) {
    synergyBonus += 12;
  } else if (
    (params.principalBackground === 'born_strategist' || params.principalBackground === 'data_strategist' || params.principalBackground === 'ex_driver') &&
    (params.staffMember.role === 'sporting_director' || params.staffMember.role === 'chief_mechanic')
  ) {
    synergyBonus += 10;
  }

  const trustFactor = (params.staffMember.trust ?? 75) >= 70 ? 1.1 : (params.staffMember.trust ?? 75) < 40 ? 0.65 : 0.95;
  const timeDenom = Math.max(1, Math.min(4, 1 + (params.seasonsElapsed ?? 0) * 0.15));

  const xpGain = Math.max(3, Math.round(((centralFactor + teamSuccess + budgetScore + synergyBonus) * trustFactor) / (timeDenom * 3.2)));
  return {
    xpGain,
    centralCapInfo,
    synergyBonus,
  };
}

export function applyStaffXpAndEvolution(
  member: StaffMember,
  xpGain: number,
  teamCentralLevel: number
): {
  updatedMember: StaffMember;
  leveledUp: boolean;
  cappedByFacility: boolean;
} {
  const currentLevel = getStaffRpgLevel(member);
  const { maxStaffLevel } = getStaffMaxLevelForCentral(teamCentralLevel);
  const currentXp = getStaffXpProgress(member);

  if (currentLevel >= maxStaffLevel) {
    return {
      leveledUp: false,
      cappedByFacility: currentLevel < 5,
      updatedMember: {
        ...member,
        rpgLevel: currentLevel,
        xp: 100,
        lastXpDelta: 0,
      },
    };
  }

  const totalXp = currentXp + Math.max(0, xpGain);
  const rawLevelsUp = Math.floor(totalXp / 100);
  const nextLevel = Math.min(maxStaffLevel, currentLevel + rawLevelsUp);
  const gainedLevels = nextLevel - currentLevel;
  const hitCap = nextLevel >= maxStaffLevel && rawLevelsUp > 0 && nextLevel < 5;
  const nextXp = nextLevel >= maxStaffLevel ? (nextLevel === 5 ? 100 : Math.min(100, totalXp % 100 || 100)) : totalXp % 100;

  const nextRating =
    gainedLevels > 0
      ? Math.min(99, member.rating + gainedLevels * 4)
      : Math.min(99, member.rating + (totalXp >= 65 && currentXp < 65 ? 1 : 0));

  const nextAttributes = member.attributes
    ? {
        ...member.attributes,
        tecnica: Math.min(99, member.attributes.tecnica + (gainedLevels > 0 ? 3 : 0)),
        criatividade: Math.min(99, member.attributes.criatividade + (gainedLevels > 0 ? 2 : 0)),
        rigorValidacao: Math.min(99, member.attributes.rigorValidacao + (gainedLevels > 0 ? 3 : 0)),
        lideranca: Math.min(99, member.attributes.lideranca + (gainedLevels > 0 ? 2 : 0)),
        comunicacao: Math.min(99, member.attributes.comunicacao + (gainedLevels > 0 ? 2 : 0)),
      }
    : undefined;

  return {
    leveledUp: gainedLevels > 0,
    cappedByFacility: hitCap || currentLevel >= maxStaffLevel,
    updatedMember: {
      ...member,
      rpgLevel: nextLevel,
      xp: nextXp,
      lastXpDelta: xpGain,
      rating: nextRating,
      ...(nextAttributes ? { attributes: nextAttributes } : {}),
    },
  };
}

export function getStaffFacilityLimitFeedback(
  member: StaffMember,
  teamCentralLevel: number
): {
  isLimited: boolean;
  currentLevel: number;
  maxAllowedLevel: number;
  recommendedCentralLevel: number;
  quote: string;
} {
  const currentLevel = getStaffRpgLevel(member);
  const { maxStaffLevel } = getStaffMaxLevelForCentral(teamCentralLevel);
  const isLimited = currentLevel >= maxStaffLevel && currentLevel < 5;
  const recommendedCentralLevel = Math.min(5, Math.max(teamCentralLevel + 1, currentLevel >= 3 ? 4 : 3));

  const roleDomainQuote: Record<StaffMember['role'], string> = {
    head_aero: 'desbloquear novas técnicas de CFD e redução de erro no Túnel de Vento',
    head_pu: 'homologar mapas térmicos avançados e metalurgia de pistões sem derating',
    sporting_director: 'integrar modelos preditivos de estratégia em tempo real e pit wall',
    chief_mechanic: 'reduzir erros de pistola pneumática e atingir pit stops sub-2.1s',
    tech_director: 'coordenar simulações multifísicas sem gargalos de equipe',
    chief_engineer: 'elevar a rigidez metodológica entre projeto e pista',
    race_engineer: 'refinar a janela de telemetria corrida a corrida',
  };

  if (isLimited) {
    return {
      isLimited: true,
      currentLevel,
      maxAllowedLevel: maxStaffLevel,
      recommendedCentralLevel,
      quote: `"A Central da Equipe Nível ${teamCentralLevel} está limitando o meu potencial (teto atual: Nível ${maxStaffLevel}). Se construirmos o Nível ${recommendedCentralLevel}, poderei ${roleDomainQuote[member.role]}."`,
    };
  }

  return {
    isLimited: false,
    currentLevel,
    maxAllowedLevel: maxStaffLevel,
    recommendedCentralLevel: Math.min(5, teamCentralLevel + 1),
    quote:
      currentLevel >= 5
        ? '"Nossa estrutura executiva atingiu o padrão Elite (Nível 5). Todo o potencial técnico está liberado."'
        : `"Operando dentro do limite da Central da Equipe Nível ${teamCentralLevel} (teto Nv.${maxStaffLevel}). Os resultados em pista e o orçamento estão convertendo em XP constante."`,
  };
}

export function getFacilityRpgSummary(facilityId: string, level: number): string | null {
  if (facilityId === 'fac_team_hq') {
    const info = getStaffMaxLevelForCentral(level);
    const nextCap = Math.min(5, info.maxStaffLevel + 1);
    return `Teto do Staff: Nível ${info.maxStaffLevel}/5 · Bônus XP Staff: +${info.xpSeasonBonusPct}%/temp · Bônus Jovens (≤23a): +${info.youthDriverXpBonusPct}% XP.${
      level < 5 ? ` Próximo nível libera Staff até Nv.${nextCap} e mais evolução técnica.` : ' Nível máximo de estrutura atingido.'
    }`;
  }
  if (facilityId === 'fac_simulator') {
    const mult = computeSimulatorXpMultiplier(level);
    return `Multiplicador de XP do Simulador: ${mult.toFixed(2)}x (Escala 1.0x Nv.1 → 2.5x Nv.5) para Titulares e Reserva em desenvolvimento.`;
  }
  if (facilityId === 'fac_scouting') {
    return `Uso exclusivo para descobrir novos talentos F2/F3 e candidatos no mercado (não evolui o staff atual).`;
  }
  return null;
}
