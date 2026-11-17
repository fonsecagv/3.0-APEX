import type { ComponentSpec, Driver, Facility, SeasonEventCard, Team } from '../types/f1';
import type { VehicleEngineeringParameters, VehiclePhysicsOutputs } from '../types/physics';

export interface ChassisNameValidationResult {
  valid: boolean;
  normalized: string;
  error?: string;
}

const BLOCKED_CHASSIS_TOKENS = [
  // Nomes de equipes rivais (proibidos por regulamento FIA / propriedade intelectual)
  'ferrari',
  'mercedes',
  'redbull',
  'mclaren',
  'aston',
  'astonmartin',
  'alpine',
  'williams',
  'haas',
  'audi',
  'sauber',
  'cadillac',
  'racingbulls',
  'vcarb',
  'alphatauri',
  'tororosso',
  // Palavras impróprias / ofensivas comuns
  'porra',
  'caralho',
  'merda',
  'puta',
  'foda',
  'bosta',
  'cacete',
  'cuzinho',
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'dick',
  'cunt',
  'nazi',
  'hitler',
];

/**
 * Valida a nomenclatura oficial de chassi segundo o Artigo de Nomeação FIA 2026:
 * - Entre 3 e 10 caracteres
 * - Sem espaços em branco
 * - Sem nomes de construtores rivais ou termos impróprios
 */
export function validateChassisName(raw: string): ChassisNameValidationResult {
  const trimmed = (raw || '').trim();
  if (!trimmed) {
    return {
      valid: false,
      normalized: '',
      error: 'Digite a designação oficial do chassi (3 a 10 caracteres).',
    };
  }
  if (/\s/.test(trimmed)) {
    return {
      valid: false,
      normalized: trimmed.toUpperCase(),
      error: 'O nome do chassi não pode conter espaços. Use hífen se desejar (ex: APX-01).',
    };
  }
  if (trimmed.length < 3 || trimmed.length > 10) {
    return {
      valid: false,
      normalized: trimmed.toUpperCase(),
      error: `O nome do chassi deve ter entre 3 e 10 caracteres (atual: ${trimmed.length}).`,
    };
  }
  if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) {
    return {
      valid: false,
      normalized: trimmed.toUpperCase(),
      error: 'Use apenas letras, números, hífen (-) ou sublinhado (_).',
    };
  }

  const collapsed = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
  const matchedBlocked = BLOCKED_CHASSIS_TOKENS.find((token) => collapsed.includes(token));
  if (matchedBlocked) {
    return {
      valid: false,
      normalized: trimmed.toUpperCase(),
      error: `Designação "${trimmed.toUpperCase()}" rejeitada pela FIA (termo reservado a rival ou impróprio).`,
    };
  }

  return {
    valid: true,
    normalized: trimmed.toUpperCase(),
  };
}

/**
 * Gera 4 sugestões válidas de nomenclatura baseadas na sigla/nome da equipe.
 */
export function getDefaultChassisSuggestions(teamShort: string, teamName: string): string[] {
  const cleanShort = (teamShort || 'APX')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4) || 'APX';
  const cleanInitial = (teamName || 'APEX')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 1) || 'A';
  const baseWord = (teamName || 'APEX')
    .split(/\s+/)[0]
    ?.toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 5) || 'APEX';

  const candidates = [
    `${cleanShort}-01`,
    `${baseWord}-01`,
    `${cleanInitial}26`,
    'FENIX-01',
  ];

  const uniqueValid: string[] = [];
  for (const c of candidates) {
    const check = validateChassisName(c);
    if (check.valid && !uniqueValid.includes(check.normalized)) {
      uniqueValid.push(check.normalized);
    }
  }
  if (!uniqueValid.includes('APX-01') && uniqueValid.length < 4) {
    uniqueValid.push('APX-01');
  }
  return uniqueValid.slice(0, 4);
}

/**
 * Evolui automaticamente a nomenclatura do chassi na virada de temporada:
 * APX-01 -> APX-02 | SF-26 -> SF-27 | A26 -> A27 | MCL40 -> MCL41
 */
export function suggestNextSeasonChassisName(currentName: string): string {
  const clean = (currentName || 'APX-01').trim().toUpperCase();
  const match = clean.match(/^(.*?)(\d+)$/);
  if (!match) {
    const appended = `${clean.slice(0, 7)}-02`;
    return appended.slice(0, 10);
  }
  const prefix = match[1];
  const numStr = match[2];
  const nextNum = parseInt(numStr, 10) + 1;
  const padded = String(nextNum).padStart(numStr.length, '0');
  const candidate = `${prefix}${padded}`;
  if (candidate.length <= 10) return candidate;
  return `${prefix.slice(0, 10 - padded.length)}${padded}`;
}

export interface RdFacilityCapacity {
  manufacturingLevel: number;
  manufacturingMaxSlots: number;
  windTunnelLevel: number;
  cfdLevel: number;
  aeroMaxSlots: number;
  aeroEfficiencyBonusPct: number;
  cfdCorrelationBonusPct: number;
}

/**
 * Calcula capacidade de slots simultâneos de P&D e bônus de eficiência a partir do nível das instalações:
 * - Fábrica (fac_manufacturing): Nível 1 = 2 slots, Nível 2 = 3 slots, Nível 3 = 4 slots...
 * - Túnel de Vento (fac_wind_tunnel): Nível 1 = 1 slot aero (+0% ganho), Nível 2 = 2 slots (+5%), Nível 3 = 3 slots (+10%)...
 */
export function computeRdFacilityCapacity(facilities: Facility[]): RdFacilityCapacity {
  const mfg = facilities.find((f) => f.id === 'fac_manufacturing')?.level ?? 1;
  const wt = facilities.find((f) => f.id === 'fac_wind_tunnel')?.level ?? 1;
  const cfd = facilities.find((f) => f.id === 'fac_cfd')?.level ?? 1;

  const manufacturingLevel = Math.max(1, mfg);
  const windTunnelLevel = Math.max(1, wt);
  const cfdLevel = Math.max(1, cfd);

  return {
    manufacturingLevel,
    manufacturingMaxSlots: 1 + manufacturingLevel,
    windTunnelLevel,
    cfdLevel,
    aeroMaxSlots: windTunnelLevel,
    aeroEfficiencyBonusPct: (windTunnelLevel - 1) * 5,
    cfdCorrelationBonusPct: (cfdLevel - 1) * 3,
  };
}

export interface CarRadarAxis {
  key: 'downforce' | 'lowDrag' | 'traction' | 'tireCare' | 'powerUnit' | 'reliability';
  label: string;
  value: number; // 0..100
}

const clampRadar = (v: number): number => Math.round(Math.max(30, Math.min(99, v)));

export function computeCarRadarProfile(
  vehicleParams: VehicleEngineeringParameters,
  vehiclePhysics: VehiclePhysicsOutputs,
  components: ComponentSpec[]
): CarRadarAxis[] {
  const avgRel =
    components.reduce((acc, c) => acc + c.reliability, 0) / Math.max(1, components.length);
  const dfComp = components.find((c) => c.type === 'floor')?.downforce ?? 82;
  const wingsComp = components.find((c) => c.type === 'wings')?.downforce ?? 82;
  const puComp = components.find((c) => c.type === 'pu')?.performance ?? 82;

  const downforceScore = clampRadar(
    (vehiclePhysics.cornerMode.downforceTotalN - 8500) / 70 + (dfComp + wingsComp - 160) * 0.25
  );
  const lowDragScore = clampRadar(
    95 - (vehiclePhysics.straightMode.dragForceN - 2200) / 38 + vehiclePhysics.straightMode.dragReductionPct * 0.35
  );
  const tractionScore = clampRadar(
    68 +
      (vehicleParams.antiSquatPct - 45) * 0.22 +
      (vehicleParams.differentialLockPct - 50) * 0.14 +
      (vehiclePhysics.totalWheelPowerHp - 940) * 0.08
  );
  const tireCareScore = clampRadar(
    vehiclePhysics.tireThermalWindowHealthPct * 0.58 + (1.28 - vehiclePhysics.tireWearRateMultiplier) * 95
  );
  const puScore = clampRadar(
    (vehiclePhysics.totalWheelPowerHp - 920) * 0.45 + (puComp - 70) * 0.65
  );
  const relScore = clampRadar(
    avgRel * 0.68 + Math.max(0, vehiclePhysics.thermalMarginC) * 1.9 + 12
  );

  return [
    { key: 'downforce', label: 'Downforce', value: downforceScore },
    { key: 'lowDrag', label: 'Baixo Arrasto', value: lowDragScore },
    { key: 'traction', label: 'Tração', value: tractionScore },
    { key: 'tireCare', label: 'Gestão Pneus', value: tireCareScore },
    { key: 'powerUnit', label: 'Potência PU', value: puScore },
    { key: 'reliability', label: 'Confiabilidade', value: relScore },
  ];
}

export function computeRivalRadarProfile(team: Team): CarRadarAxis[] {
  const base = Math.max(60, Math.min(96, team.carRating || 80));
  const phil = team.filosofiaAtual || 'balanced';
  const dfMod = phil === 'high_downforce' ? 7 : phil === 'low_drag' ? -5 : 1;
  const dragMod = phil === 'low_drag' ? 8 : phil === 'high_downforce' ? -5 : 1;
  const tracMod = phil === 'mechanical_grip' ? 6 : phil === 'stable_platform' ? 3 : 0;
  const tireMod = phil === 'stable_platform' || phil === 'mechanical_grip' ? 5 : -1;

  let puMod = 0;
  if (team.engineSupplier === 'Mercedes') puMod = 4;
  else if (team.engineSupplier === 'Ferrari') puMod = 3;
  else if (team.engineSupplier === 'RedBull-Ford' || team.engineSupplier === 'Red Bull-Ford') puMod = 5;
  else if (team.engineSupplier === 'Honda') puMod = -1;
  else if (team.engineSupplier === 'Audi') puMod = -2;

  return [
    { key: 'downforce', label: 'Downforce', value: clampRadar(base + dfMod) },
    { key: 'lowDrag', label: 'Baixo Arrasto', value: clampRadar(base + dragMod) },
    { key: 'traction', label: 'Tração', value: clampRadar(base + tracMod) },
    { key: 'tireCare', label: 'Gestão Pneus', value: clampRadar(base + tireMod) },
    { key: 'powerUnit', label: 'Potência PU', value: clampRadar(base + puMod) },
    { key: 'reliability', label: 'Confiabilidade', value: clampRadar(base - (team.conceptCrisis ? 8 : 1)) },
  ];
}

export function generateWeeklyEventCard(params: {
  week: number;
  chassisName: string;
  teamName: string;
  leadDriver?: Driver;
  headOfAeroName?: string;
  chiefMechanicName?: string;
  seedOffset?: number;
}): SeasonEventCard {
  const {
    week,
    chassisName,
    teamName,
    leadDriver,
    headOfAeroName = 'Chefe de Aerodinâmica',
    chiefMechanicName = 'Chefe Mecânico',
    seedOffset = 0,
  } = params;

  const slot = (week + seedOffset) % 4;
  const driverName = leadDriver?.name || 'Piloto Titular #1';

  if (slot === 0) {
    return {
      id: `ev_eng_${week}`,
      category: 'engenharia',
      title: `SOLICITAÇÃO DO TÚNEL DE VENTO · ${chassisName}`,
      sender: headOfAeroName,
      description: `${headOfAeroName} identificou um ganho de vórtice nas bordas do assoalho do ${chassisName}, mas a usinagem rápida de moldes de fibra exige verba extraordinária ainda nesta semana.`,
      weekCreated: week,
      options: [
        {
          label: 'Aprovar Pacote Rápido (-$1.2M Caixa / +15h ATR)',
          effectSummary: 'Ganha +1.5 DFm no assoalho e +15h ATR, consome $1.2M do caixa/teto.',
          cashDeltaUsd: -1200000,
          costCapDeltaUsd: 1200000,
          downforceDelta: 1.5,
          atrHoursDelta: 15,
        },
        {
          label: 'Adiar para o Próximo Ciclo Regular',
          effectSummary: 'Preserva o caixa ($0) sem impacto imediato de performance.',
          moraleDelta: -2,
        },
      ],
    };
  }

  if (slot === 1) {
    return {
      id: `ev_sponsor_${week}`,
      category: 'patrocinador',
      title: `ATIVAÇÃO COMERCIAL EXTRA · ${teamName.toUpperCase()}`,
      sender: 'Diretoria Comercial & Patrocinadores',
      description: `Um parceiro global quer gravar um filme promocional com o ${chassisName} e ${driverName} antes da viagem para o próximo circuito.`,
      weekCreated: week,
      options: [
        {
          label: 'Aceitar Filmagem (+$1.8M Caixa / +4% Base de Fãs)',
          effectSummary: 'Receita direta isenta do teto (+$1.8M), mas eleva cansaço/rotina da garagem (-3 Moral).',
          cashDeltaUsd: 1800000,
          fanDeltaPct: 4,
          moraleDelta: -3,
          reputationDelta: 1,
        },
        {
          label: 'Priorizar Foco Técnico na Fábrica',
          effectSummary: 'Engenheiros permanecem no simulador (+3 Moral), sem receita extra.',
          moraleDelta: 3,
        },
      ],
    };
  }

  if (slot === 2) {
    return {
      id: `ev_garage_${week}`,
      category: 'crise_garagem',
      title: `AUDITORIA DE MONTAGEM NA GARAGEM · ${chassisName}`,
      sender: chiefMechanicName,
      description: `${chiefMechanicName} detectou microfissuras por fadiga térmica nos dutos de freio traseiros durante a inspeção pré-GP do ${chassisName}.`,
      weekCreated: week,
      options: [
        {
          label: 'Substituir Lote Completo (-$650k / +3% Confiabilidade)',
          effectSummary: 'Elimina risco de abandono mecânico (+3% Confiabilidade) por -$650k.',
          cashDeltaUsd: -650000,
          costCapDeltaUsd: 650000,
          reliabilityDelta: 3,
          moraleDelta: 2,
        },
        {
          label: 'Reparo Conservador em Resina ($0 / -2% Confiabilidade)',
          effectSummary: 'Economiza orçamento, mas reduz margem de segurança mecânica (-2% Confiabilidade).',
          reliabilityDelta: -2,
        },
      ],
    };
  }

  return {
    id: `ev_driver_${week}`,
    category: 'piloto',
    title: `REUNIÃO DE FEEDBACK COM ${driverName.toUpperCase()}`,
    sender: driverName,
    description: `${driverName} pediu ajustes na sensibilidade do diferencial e na resposta de freio do ${chassisName} no simulador para ganhar confiança nas freadas tardias.`,
    weekCreated: week,
    options: [
      {
        label: 'Liberar Sessão Exclusiva de Simulador (-$300k / +4 Moral)',
        effectSummary: 'Melhora sinergia na garagem (+4 Moral, +1 Reputação) por -$300k.',
        cashDeltaUsd: -300000,
        costCapDeltaUsd: 300000,
        moraleDelta: 4,
        reputationDelta: 1,
      },
      {
        label: 'Manter Cronograma Padrão de Pista',
        effectSummary: 'Sem custo financeiro; piloto segue programa normal (-2 Moral).',
        moraleDelta: -2,
      },
    ],
  };
}
