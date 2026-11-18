export interface ModelAssetEntry {
  id: string;
  name: string;
  teamId: string;
  format: 'glb' | 'gltf' | 'procedural';
  filePath: string;
  author: string;
  license: string;
  targetPolyBudget: number;
  dracoCompressed: boolean;
  notes: string;
}

export const F1_2026_MODEL_REGISTRY: Record<string, ModelAssetEntry> = {
  ferrari: {
    id: 'f1_2026_ferrari',
    name: 'Ferrari SF-26',
    teamId: 'ferrari',
    format: 'glb',
    filePath: '/models/cars/ferrari.glb',
    author: 'APEX CAD Team / Formula 2026 Spec',
    license: 'Editorial / Game Simulation Fair Use',
    targetPolyBudget: 65000,
    dracoCompressed: true,
    notes: 'Livery vermelha clássica, pontões downwash limpos, asa traseira ativa.',
  },
  mclaren: {
    id: 'f1_2026_mclaren',
    name: 'McLaren MCL40',
    teamId: 'mclaren',
    format: 'glb',
    filePath: '/models/cars/mclaren.glb',
    author: 'APEX CAD Team / Formula 2026 Spec',
    license: 'Editorial / Game Simulation Fair Use',
    targetPolyBudget: 65000,
    dracoCompressed: true,
    notes: 'Livery Papaya e Anthracite, suspensão pullrod dianteira.',
  },
  mercedes: {
    id: 'f1_2026_mercedes',
    name: 'Mercedes-AMG W17',
    teamId: 'mercedes',
    format: 'glb',
    filePath: '/models/cars/mercedes.glb',
    author: 'APEX CAD Team / Formula 2026 Spec',
    license: 'Editorial / Game Simulation Fair Use',
    targetPolyBudget: 65000,
    dracoCompressed: true,
    notes: 'Prata com Petronas Teal, entrada de ar aerodinâmica refinada.',
  },
  redbull: {
    id: 'f1_2026_redbull',
    name: 'Red Bull RB22',
    teamId: 'redbull',
    format: 'glb',
    filePath: '/models/cars/redbull.glb',
    author: 'APEX CAD Team / Formula 2026 Spec',
    license: 'Editorial / Game Simulation Fair Use',
    targetPolyBudget: 68000,
    dracoCompressed: true,
    notes: 'Acabamento Matte Navy, pontões undercut agressivos.',
  },
  williams: {
    id: 'f1_2026_williams',
    name: 'Williams FW48',
    teamId: 'williams',
    format: 'glb',
    filePath: '/models/cars/williams.glb',
    author: 'APEX CAD Team / Formula 2026 Spec',
    license: 'Editorial / Game Simulation Fair Use',
    targetPolyBudget: 60000,
    dracoCompressed: true,
    notes: 'Azul clássico com detalhes Komatsu e Atlassian.',
  },
  aston_martin: {
    id: 'f1_2026_aston_martin',
    name: 'Aston Martin AMR26',
    teamId: 'aston_martin',
    format: 'glb',
    filePath: '/models/cars/aston_martin.glb',
    author: 'APEX CAD Team / Formula 2026 Spec',
    license: 'Editorial / Game Simulation Fair Use',
    targetPolyBudget: 64000,
    dracoCompressed: true,
    notes: 'British Racing Green, canais profundos nos pontões.',
  },
  alpine: {
    id: 'f1_2026_alpine',
    name: 'Alpine A526',
    teamId: 'alpine',
    format: 'glb',
    filePath: '/models/cars/alpine.glb',
    author: 'APEX CAD Team / Formula 2026 Spec',
    license: 'Editorial / Game Simulation Fair Use',
    targetPolyBudget: 60000,
    dracoCompressed: true,
    notes: 'BWT Pink e Azul carbono fosco.',
  },
  haas: {
    id: 'f1_2026_haas',
    name: 'Haas VF-26',
    teamId: 'haas',
    format: 'glb',
    filePath: '/models/cars/haas.glb',
    author: 'APEX CAD Team / Formula 2026 Spec',
    license: 'Editorial / Game Simulation Fair Use',
    targetPolyBudget: 58000,
    dracoCompressed: true,
    notes: 'Branco, preto e vermelho Toyota Gazoo Racing.',
  },
  vcarb: {
    id: 'f1_2026_vcarb',
    name: 'Racing Bulls VCARB 03',
    teamId: 'vcarb',
    format: 'glb',
    filePath: '/models/cars/vcarb.glb',
    author: 'APEX CAD Team / Formula 2026 Spec',
    license: 'Editorial / Game Simulation Fair Use',
    targetPolyBudget: 62000,
    dracoCompressed: true,
    notes: 'Branco perolizado e azul metálico.',
  },
  audi: {
    id: 'f1_2026_audi',
    name: 'Audi R26',
    teamId: 'audi',
    format: 'glb',
    filePath: '/models/cars/audi.glb',
    author: 'APEX CAD Team / Formula 2026 Spec',
    license: 'Editorial / Game Simulation Fair Use',
    targetPolyBudget: 65000,
    dracoCompressed: true,
    notes: 'Titanium cinza, vermelho fluorescente e quatro argolas.',
  },
  cadillac: {
    id: 'f1_2026_cadillac',
    name: 'Cadillac C26',
    teamId: 'cadillac',
    format: 'glb',
    filePath: '/models/cars/cadillac.glb',
    author: 'APEX CAD Team / Formula 2026 Spec',
    license: 'Editorial / Game Simulation Fair Use',
    targetPolyBudget: 64000,
    dracoCompressed: true,
    notes: 'Monocromático preto e branco com detalhes cromados.',
  },
  custom_base: {
    id: 'f1_2026_custom_base',
    name: 'FIA 2026 Standard Chassis',
    teamId: 'player_car',
    format: 'glb',
    filePath: '/models/cars/f1-2026-base.glb',
    author: 'APEX Universal Chassis Spec',
    license: 'Open Simulation License',
    targetPolyBudget: 60000,
    dracoCompressed: true,
    notes: 'Chassi base para equipes personalizadas do jogador com slots de pintura.',
  },
};

/**
 * Validates whether a given 3D asset meets APEX performance and sizing thresholds.
 */
export function validateAssetRequirements(dimensionsM: { length: number; width: number; height: number }): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (dimensionsM.length < 4.5 || dimensionsM.length > 5.8) {
    errors.push(`Comprimento fora das regras FIA 2026: ${dimensionsM.length}m (esperado 5.0m a 5.5m).`);
  }
  if (dimensionsM.width < 1.7 || dimensionsM.width > 2.2) {
    errors.push(`Largura fora das regras FIA 2026: ${dimensionsM.width}m (esperado ~2.0m).`);
  }
  if (dimensionsM.height < 0.7 || dimensionsM.height > 1.3) {
    errors.push(`Altura fora das regras FIA 2026: ${dimensionsM.height}m (esperado ~0.95m).`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
