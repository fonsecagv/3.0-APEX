import type { Driver, Team } from '../types/f1';

export type LiveryPattern2026 =
  | 'ferrari_clean'
  | 'audi_titan'
  | 'redbull_matte'
  | 'mercedes_silver_black'
  | 'mclaren_papaya'
  | 'aston_racing_green'
  | 'alpine_bwt'
  | 'williams_royal'
  | 'vcarb_white_bull'
  | 'haas_white_red'
  | 'cadillac_stealth'
  | 'custom';

export interface DriverShowroomProfile {
  name: string;
  shortCode: string;
  number: number;
  helmetPrimaryHex: string;
  helmetSecondaryHex: string;
  helmetVisorHex: string;
  /** FIA T-Cam official color: Car 1 = Carbon Black (#111318), Car 2 = Neon Yellow (#EAB308) */
  tCamHex: '#111318' | '#EAB308';
}

export interface Livery2026Spec {
  teamId: string;
  teamName: string;
  shortName: string;
  carModelName: string;
  patternStyle: LiveryPattern2026;
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  rearWingAccentHex: string;
  rimAccentHex: string;
  helmetPrimaryHex: string;
  helmetSecondaryHex: string;
  finishType: 'gloss' | 'matte' | 'satin_carbon';
  engineBadge: string;
  driversSummary: string;
  visualNotes: string;
  primaryNumbers: [number, number];
  drivers: [DriverShowroomProfile, DriverShowroomProfile];
}

export const LIVERY_2026_CATALOG: Livery2026Spec[] = [
  {
    teamId: 'ferrari',
    teamName: 'Scuderia Ferrari HP',
    shortName: 'FER',
    carModelName: 'SF-26',
    patternStyle: 'ferrari_clean',
    primaryHex: '#DC0000',
    secondaryHex: '#F5F5F5',
    accentHex: '#FFE500',
    rearWingAccentHex: '#DC0000',
    rimAccentHex: '#DC0000',
    helmetPrimaryHex: '#DC0000',
    helmetSecondaryHex: '#F5F5F5',
    finishType: 'gloss',
    engineBadge: 'Ferrari 067 V6 Turbo-Hybrid',
    driversSummary: 'Charles Leclerc (#16) & Lewis Hamilton (#44)',
    visualNotes: 'Vermelho clássico de Maranello em combinação limpa com carenagem superior branca e filete amarelo.',
    primaryNumbers: [16, 44],
    drivers: [
      {
        name: 'Charles Leclerc',
        shortCode: 'LEC',
        number: 16,
        helmetPrimaryHex: '#DC0000',
        helmetSecondaryHex: '#F8FAFC',
        helmetVisorHex: '#991B1B',
        tCamHex: '#111318',
      },
      {
        name: 'Lewis Hamilton',
        shortCode: 'HAM',
        number: 44,
        helmetPrimaryHex: '#FFE500',
        helmetSecondaryHex: '#7C3AED',
        helmetVisorHex: '#D97706',
        tCamHex: '#EAB308',
      },
    ],
  },
  {
    teamId: 'audi',
    teamName: 'Audi Revolut F1 Team',
    shortName: 'AUD',
    carModelName: 'Revolut R26',
    patternStyle: 'audi_titan',
    primaryHex: '#8E95A0',
    secondaryHex: '#13151A',
    accentHex: '#FF1A2D',
    rearWingAccentHex: '#FF1A2D',
    rimAccentHex: '#FF1A2D',
    helmetPrimaryHex: '#14161B',
    helmetSecondaryHex: '#FF1A2D',
    finishType: 'matte',
    engineBadge: 'Audi F1 Hybrid V6 (Neuburg)',
    driversSummary: 'Nico Hülkenberg (#27) & Gabriel Bortoleto (#5)',
    visualNotes: 'Titânio acetinado na dianteira em corte diagonal para carbono escuro e vermelho neon.',
    primaryNumbers: [27, 5],
    drivers: [
      {
        name: 'Nico Hülkenberg',
        shortCode: 'HUL',
        number: 27,
        helmetPrimaryHex: '#94A3B8',
        helmetSecondaryHex: '#FF1A2D',
        helmetVisorHex: '#1E293B',
        tCamHex: '#111318',
      },
      {
        name: 'Gabriel Bortoleto',
        shortCode: 'BOR',
        number: 5,
        helmetPrimaryHex: '#FACC15',
        helmetSecondaryHex: '#16A34A',
        helmetVisorHex: '#0EA5E9',
        tCamHex: '#EAB308',
      },
    ],
  },
  {
    teamId: 'redbull',
    teamName: 'Oracle Red Bull Racing',
    shortName: 'RBR',
    carModelName: 'RB22',
    patternStyle: 'redbull_matte',
    primaryHex: '#0B1936',
    secondaryHex: '#E01A38',
    accentHex: '#FACC15',
    rearWingAccentHex: '#0B1936',
    rimAccentHex: '#E01A38',
    helmetPrimaryHex: '#0B1936',
    helmetSecondaryHex: '#FACC15',
    finishType: 'matte',
    engineBadge: 'Red Bull-Ford DM01',
    driversSummary: 'Max Verstappen (#3) & Isack Hadjar (#6)',
    visualNotes: 'Azul-marinho fosco de Milton Keynes com bico amarelo, sol no capô e grafismo vermelho.',
    primaryNumbers: [3, 6],
    drivers: [
      {
        name: 'Max Verstappen',
        shortCode: 'VER',
        number: 3,
        helmetPrimaryHex: '#F8FAFC',
        helmetSecondaryHex: '#F97316',
        helmetVisorHex: '#1D4ED8',
        tCamHex: '#111318',
      },
      {
        name: 'Isack Hadjar',
        shortCode: 'HAD',
        number: 6,
        helmetPrimaryHex: '#0B1936',
        helmetSecondaryHex: '#E01A38',
        helmetVisorHex: '#FACC15',
        tCamHex: '#EAB308',
      },
    ],
  },
  {
    teamId: 'mercedes',
    teamName: 'Mercedes-AMG PETRONAS F1 Team',
    shortName: 'MER',
    carModelName: 'W17',
    patternStyle: 'mercedes_silver_black',
    primaryHex: '#11141A',
    secondaryHex: '#C8CDD6',
    accentHex: '#00D2BE',
    rearWingAccentHex: '#11141A',
    rimAccentHex: '#00D2BE',
    helmetPrimaryHex: '#C8CDD6',
    helmetSecondaryHex: '#00D2BE',
    finishType: 'satin_carbon',
    engineBadge: 'Mercedes-AMG M17 E-Power',
    driversSummary: 'George Russell (#63) & Andrea Kimi Antonelli (#12)',
    visualNotes: 'Carbono preto predominante com prata na frente do bico e frisos verdes Petronas.',
    primaryNumbers: [63, 12],
    drivers: [
      {
        name: 'George Russell',
        shortCode: 'RUS',
        number: 63,
        helmetPrimaryHex: '#00D2BE',
        helmetSecondaryHex: '#11141A',
        helmetVisorHex: '#0284C7',
        tCamHex: '#111318',
      },
      {
        name: 'Andrea Kimi Antonelli',
        shortCode: 'ANT',
        number: 12,
        helmetPrimaryHex: '#2563EB',
        helmetSecondaryHex: '#E2E8F0',
        helmetVisorHex: '#16A34A',
        tCamHex: '#EAB308',
      },
    ],
  },
  {
    teamId: 'mclaren',
    teamName: 'McLaren Formula 1 Team',
    shortName: 'MCL',
    carModelName: 'MCL40',
    patternStyle: 'mclaren_papaya',
    primaryHex: '#FF7A00',
    secondaryHex: '#16181E',
    accentHex: '#38BDF8',
    rearWingAccentHex: '#16181E',
    rimAccentHex: '#FF7A00',
    helmetPrimaryHex: '#D9FF00',
    helmetSecondaryHex: '#FF7A00',
    finishType: 'gloss',
    engineBadge: 'Mercedes-AMG M17 Cliente',
    driversSummary: 'Lando Norris (#4) & Oscar Piastri (#81)',
    visualNotes: 'Laranja papaya característico em contraste direto com fibra de carbono exposta.',
    primaryNumbers: [4, 81],
    drivers: [
      {
        name: 'Lando Norris',
        shortCode: 'NOR',
        number: 4,
        helmetPrimaryHex: '#D9FF00',
        helmetSecondaryHex: '#14161B',
        helmetVisorHex: '#0EA5E9',
        tCamHex: '#111318',
      },
      {
        name: 'Oscar Piastri',
        shortCode: 'PIA',
        number: 81,
        helmetPrimaryHex: '#FF7A00',
        helmetSecondaryHex: '#1D4ED8',
        helmetVisorHex: '#0F172A',
        tCamHex: '#EAB308',
      },
    ],
  },
  {
    teamId: 'astonmartin',
    teamName: 'Aston Martin Aramco F1 Team',
    shortName: 'AMR',
    carModelName: 'AMR26',
    patternStyle: 'aston_racing_green',
    primaryHex: '#00594F',
    secondaryHex: '#14181A',
    accentHex: '#38BDF8',
    rearWingAccentHex: '#38BDF8',
    rimAccentHex: '#CEDC00',
    helmetPrimaryHex: '#00594F',
    helmetSecondaryHex: '#CEDC00',
    finishType: 'gloss',
    engineBadge: 'Honda HRC RA626H',
    driversSummary: 'Fernando Alonso (#14) & Lance Stroll (#18)',
    visualNotes: 'Verde britânico tradicional, contrastes em preto e detalhe azul claro no aerofólio traseiro.',
    primaryNumbers: [14, 18],
    drivers: [
      {
        name: 'Fernando Alonso',
        shortCode: 'ALO',
        number: 14,
        helmetPrimaryHex: '#0284C7',
        helmetSecondaryHex: '#FACC15',
        helmetVisorHex: '#DC2626',
        tCamHex: '#111318',
      },
      {
        name: 'Lance Stroll',
        shortCode: 'STR',
        number: 18,
        helmetPrimaryHex: '#00594F',
        helmetSecondaryHex: '#CEDC00',
        helmetVisorHex: '#1E293B',
        tCamHex: '#EAB308',
      },
    ],
  },
  {
    teamId: 'alpine',
    teamName: 'BWT Alpine F1 Team',
    shortName: 'ALP',
    carModelName: 'A526',
    patternStyle: 'alpine_bwt',
    primaryHex: '#007BFF',
    secondaryHex: '#F458B0',
    accentHex: '#171920',
    rearWingAccentHex: '#F458B0',
    rimAccentHex: '#F458B0',
    helmetPrimaryHex: '#007BFF',
    helmetSecondaryHex: '#F458B0',
    finishType: 'gloss',
    engineBadge: 'Mercedes-AMG M17 Cliente',
    driversSummary: 'Pierre Gasly (#10) & Franco Colapinto (#43)',
    visualNotes: 'Azul Alpine e rosa BWT com transição para motor Mercedes em 2026.',
    primaryNumbers: [10, 43],
    drivers: [
      {
        name: 'Pierre Gasly',
        shortCode: 'GAS',
        number: 10,
        helmetPrimaryHex: '#1E3A8A',
        helmetSecondaryHex: '#F458B0',
        helmetVisorHex: '#EF4444',
        tCamHex: '#111318',
      },
      {
        name: 'Franco Colapinto',
        shortCode: 'COL',
        number: 43,
        helmetPrimaryHex: '#38BDF8',
        helmetSecondaryHex: '#F8FAFC',
        helmetVisorHex: '#FACC15',
        tCamHex: '#EAB308',
      },
    ],
  },
  {
    teamId: 'williams',
    teamName: 'Williams Racing',
    shortName: 'WIL',
    carModelName: 'FW48',
    patternStyle: 'williams_royal',
    primaryHex: '#0047AB',
    secondaryHex: '#D4D8DF',
    accentHex: '#38BDF8',
    rearWingAccentHex: '#0047AB',
    rimAccentHex: '#38BDF8',
    helmetPrimaryHex: '#0047AB',
    helmetSecondaryHex: '#D4D8DF',
    finishType: 'gloss',
    engineBadge: 'Mercedes-AMG M17 Cliente',
    driversSummary: 'Carlos Sainz (#55) & Alexander Albon (#23)',
    visualNotes: 'Azul royal como base com prata e azul claro em pontos estratégicos da carenagem.',
    primaryNumbers: [55, 23],
    drivers: [
      {
        name: 'Carlos Sainz',
        shortCode: 'SAI',
        number: 55,
        helmetPrimaryHex: '#DC2626',
        helmetSecondaryHex: '#FACC15',
        helmetVisorHex: '#1E3A8A',
        tCamHex: '#111318',
      },
      {
        name: 'Alexander Albon',
        shortCode: 'ALB',
        number: 23,
        helmetPrimaryHex: '#1E3A8A',
        helmetSecondaryHex: '#F8FAFC',
        helmetVisorHex: '#EF4444',
        tCamHex: '#EAB308',
      },
    ],
  },
  {
    teamId: 'rb',
    teamName: 'Visa Cash App Racing Bulls',
    shortName: 'VCARB',
    carModelName: 'VCARB03',
    patternStyle: 'vcarb_white_bull',
    primaryHex: '#F1F3F6',
    secondaryHex: '#E10600',
    accentHex: '#FACC15',
    rearWingAccentHex: '#161A24',
    rimAccentHex: '#E10600',
    helmetPrimaryHex: '#F1F3F6',
    helmetSecondaryHex: '#E10600',
    finishType: 'gloss',
    engineBadge: 'Red Bull-Ford Cliente',
    driversSummary: 'Liam Lawson (#30) & Arvid Lindblad (#41)',
    visualNotes: 'Carenagem branca perolada com detalhes em vermelho e amarelo.',
    primaryNumbers: [30, 41],
    drivers: [
      {
        name: 'Liam Lawson',
        shortCode: 'LAW',
        number: 30,
        helmetPrimaryHex: '#F472B6',
        helmetSecondaryHex: '#18181B',
        helmetVisorHex: '#38BDF8',
        tCamHex: '#111318',
      },
      {
        name: 'Arvid Lindblad',
        shortCode: 'LIN',
        number: 41,
        helmetPrimaryHex: '#1E3A8A',
        helmetSecondaryHex: '#EF4444',
        helmetVisorHex: '#F8FAFC',
        tCamHex: '#EAB308',
      },
    ],
  },
  {
    teamId: 'haas',
    teamName: 'MoneyGram Haas F1 Team',
    shortName: 'HAA',
    carModelName: 'VF-26',
    patternStyle: 'haas_white_red',
    primaryHex: '#F2F4F7',
    secondaryHex: '#DA291C',
    accentHex: '#17181E',
    rearWingAccentHex: '#DA291C',
    rimAccentHex: '#DA291C',
    helmetPrimaryHex: '#F2F4F7',
    helmetSecondaryHex: '#DA291C',
    finishType: 'gloss',
    engineBadge: 'Ferrari 067 Cliente',
    driversSummary: 'Esteban Ocon (#31) & Oliver Bearman (#87)',
    visualNotes: 'Pintura predominantemente branca com presença marcante do vermelho Haas.',
    primaryNumbers: [31, 87],
    drivers: [
      {
        name: 'Esteban Ocon',
        shortCode: 'OCO',
        number: 31,
        helmetPrimaryHex: '#18181B',
        helmetSecondaryHex: '#DA291C',
        helmetVisorHex: '#DC2626',
        tCamHex: '#111318',
      },
      {
        name: 'Oliver Bearman',
        shortCode: 'BEA',
        number: 87,
        helmetPrimaryHex: '#1E3A8A',
        helmetSecondaryHex: '#DA291C',
        helmetVisorHex: '#F8FAFC',
        tCamHex: '#EAB308',
      },
    ],
  },
  {
    teamId: 'cadillac',
    teamName: 'Cadillac Formula 1 Team',
    shortName: 'CAD',
    carModelName: 'MAC-26',
    patternStyle: 'cadillac_stealth',
    primaryHex: '#16171D',
    secondaryHex: '#C59B38',
    accentHex: '#D1D5DB',
    rearWingAccentHex: '#16171D',
    rimAccentHex: '#C59B38',
    helmetPrimaryHex: '#16171D',
    helmetSecondaryHex: '#C59B38',
    finishType: 'satin_carbon',
    engineBadge: 'Ferrari 067 Cliente (GM)',
    driversSummary: 'Sergio Pérez (#11) & Colton Herta (#26)',
    visualNotes: 'Fibra escura stealth com detalhes em dourado Cadillac e prata.',
    primaryNumbers: [11, 26],
    drivers: [
      {
        name: 'Sergio Pérez',
        shortCode: 'PER',
        number: 11,
        helmetPrimaryHex: '#16A34A',
        helmetSecondaryHex: '#FACC15',
        helmetVisorHex: '#14161B',
        tCamHex: '#111318',
      },
      {
        name: 'Colton Herta',
        shortCode: 'HER',
        number: 26,
        helmetPrimaryHex: '#C59B38',
        helmetSecondaryHex: '#0F172A',
        helmetVisorHex: '#38BDF8',
        tCamHex: '#EAB308',
      },
    ],
  },
];

function deriveDriverCode(name: string): string {
  const parts = name.trim().split(/\s+/);
  const surname = parts[parts.length - 1] || name;
  return surname.slice(0, 3).toUpperCase();
}

export function resolveTeamLivery2026(
  team?: Partial<Team> | null,
  fallbackDriversLabel?: string,
  teamDrivers?: Driver[]
): Livery2026Spec {
  const id = team?.id || 'apex';
  const preset = LIVERY_2026_CATALOG.find((item) => item.teamId === id);

  const primary = team?.color || preset?.primaryHex || '#E10600';
  const secondary = team?.secondaryColor || preset?.secondaryHex || '#F5F5F5';

  const resolvedDrivers: [DriverShowroomProfile, DriverShowroomProfile] | undefined =
    teamDrivers && teamDrivers.length >= 2
      ? [
          {
            name: teamDrivers[0].name,
            shortCode: deriveDriverCode(teamDrivers[0].name),
            number: teamDrivers[0].number,
            helmetPrimaryHex: secondary,
            helmetSecondaryHex: primary,
            helmetVisorHex: '#0F172A',
            tCamHex: '#111318',
          },
          {
            name: teamDrivers[1].name,
            shortCode: deriveDriverCode(teamDrivers[1].name),
            number: teamDrivers[1].number,
            helmetPrimaryHex: primary,
            helmetSecondaryHex: '#FACC15',
            helmetVisorHex: '#0284C7',
            tCamHex: '#EAB308',
          },
        ]
      : undefined;

  const computedDriversSummary =
    resolvedDrivers
      ? `${resolvedDrivers[0].name} (#${resolvedDrivers[0].number}) & ${resolvedDrivers[1].name} (#${resolvedDrivers[1].number})`
      : fallbackDriversLabel;

  if (preset && !team?.isPlayer) {
    return preset;
  }

  if (preset && team?.isPlayer) {
    return {
      ...preset,
      teamName: team.name || preset.teamName,
      shortName: team.shortName || preset.shortName,
      carModelName: team.carModelName || preset.carModelName,
      primaryHex: primary,
      secondaryHex: secondary,
      engineBadge: team.engineSupplier ? `PU ${team.engineSupplier}` : preset.engineBadge,
      driversSummary: computedDriversSummary || preset.driversSummary,
      primaryNumbers: resolvedDrivers
        ? [resolvedDrivers[0].number, resolvedDrivers[1].number]
        : preset.primaryNumbers,
      drivers: resolvedDrivers || preset.drivers,
    };
  }

  const customDrivers: [DriverShowroomProfile, DriverShowroomProfile] = resolvedDrivers || [
    {
      name: 'Piloto Titular 1',
      shortCode: 'P01',
      number: 1,
      helmetPrimaryHex: secondary,
      helmetSecondaryHex: primary,
      helmetVisorHex: '#0F172A',
      tCamHex: '#111318',
    },
    {
      name: 'Piloto Titular 2',
      shortCode: 'P02',
      number: 2,
      helmetPrimaryHex: primary,
      helmetSecondaryHex: '#38BDF8',
      helmetVisorHex: '#1E293B',
      tCamHex: '#EAB308',
    },
  ];

  return {
    teamId: id,
    teamName: team?.name || 'APEX Grand Prix Team',
    shortName: team?.shortName || 'APX',
    carModelName: team?.carModelName || 'APEX-26',
    patternStyle: 'custom',
    primaryHex: primary,
    secondaryHex: secondary,
    accentHex: '#38BDF8',
    rearWingAccentHex: primary,
    rimAccentHex: primary,
    helmetPrimaryHex: customDrivers[0].helmetPrimaryHex,
    helmetSecondaryHex: customDrivers[0].helmetSecondaryHex,
    finishType: 'gloss',
    engineBadge: team?.engineSupplier ? `PU ${team.engineSupplier}` : 'PU Híbrida 2026 50/50',
    driversSummary: computedDriversSummary || 'Dupla Titular da Equipe',
    visualNotes: 'Pintura personalizada da escuderia com pacote aerodinâmico ativo FIA 2026.',
    primaryNumbers: [customDrivers[0].number, customDrivers[1].number],
    drivers: customDrivers,
  };
}
