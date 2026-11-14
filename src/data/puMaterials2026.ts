import type { CustomerEngineSupplier } from '../types/f1';

export type IceMetallurgyId = 'fia_iron_ams6487' | 'ferrari_steel_head' | 'al_si_low_friction';
export type BatteryArchitectureId = 'lightweight_lithium' | 'dense_pack' | 'ultra_solid_state';
export type BatterySubChemistryId = 'nca' | 'si_c';

export interface BomLineItem {
  component: string;
  material: string;
  supplier: string;
  unitCostUsd: number;
  quantity: number;
  notes: string;
}

export interface IceMetallurgySpec {
  id: IceMetallurgyId;
  shortLabel: string;
  fullName: string;
  pistonAlloyCode: 'AMS 6487' | 'X38CrMoV5-3' | '15CDV6' | '42CrMo4';
  blockMaterial: string;
  headMaterial: string;
  legacyIceMaterial: 'aluminum' | 'titanium';
  massDeltaKg: number;
  thermalCeilingDeltaC: number;
  peakIcePowerMultiplier: number;
  frictionReductionPct: number;
  radiatorReliefPct: number;
  costUsd: number;
  tradeOffSummary: string;
  tooltip: string;
  researchProjectId?: string;
  bomItems: BomLineItem[];
  classification: 'Regulamento FIA' | 'Dado técnico' | 'Parâmetro de jogo';
}

export interface BatteryArchitectureSpec {
  id: BatteryArchitectureId;
  shortLabel: string;
  fullName: string;
  massKg: number;
  capacityMj: number;
  thermalMassFactor: number;
  casingMaterial: string;
  electrolyte: string;
  costDeltaUsd: number;
  tradeOffSummary: string;
  tooltip: string;
  researchProjectId?: string;
  supportsSubChemistry: boolean;
  bomItems: BomLineItem[];
}

export interface BatterySubChemistrySpec {
  id: BatterySubChemistryId;
  label: string;
  electrodeFormula: string;
  thermalDegradationFactor: number;
  peakDeployMultiplier: number;
  summary: string;
}

export interface PuMaterialResearchProject {
  id: string;
  title: string;
  targetMaterialId: IceMetallurgyId | BatteryArchitectureId;
  targetType: 'ice' | 'battery';
  costUsd: number;
  durationWeeks: number;
  minFacilityLevel: number;
  description: string;
  engineeringEffect: string;
}

export interface ManufacturerPuDnaSpec {
  supplier: CustomerEngineSupplier | 'In-House';
  puDesignation: string;
  aduoTierLabel: string;
  philosophyTitle: string;
  summary: string;
  advantage: string;
  disadvantage: string;
  defaultIceMetallurgy: IceMetallurgyId;
  defaultBatteryTech: BatteryArchitectureId;
  defaultBatterySubChem: BatterySubChemistryId;
  starterUnlockedMaterials: string[];
}

export const ICE_METALLURGY_2026: Record<IceMetallurgyId, IceMetallurgySpec> = {
  fia_iron_ams6487: {
    id: 'fia_iron_ams6487',
    shortLabel: 'Liga de Ferro Padrão FIA',
    fullName: 'Bloco Al-Si + Pistões Liga de Ferro AMS 6487 (Art. C15.7.1)',
    pistonAlloyCode: 'AMS 6487',
    blockMaterial: 'Liga de Alumínio Homologada FIA',
    headMaterial: 'Liga de Alumínio Aeroespacial',
    legacyIceMaterial: 'aluminum',
    massDeltaKg: 0,
    thermalCeilingDeltaC: 0,
    peakIcePowerMultiplier: 1.0,
    frictionReductionPct: 0,
    radiatorReliefPct: 0,
    costUsd: 9500000,
    tradeOffSummary: 'Liga de Ferro (FIA 2026). Exige aquecimento cuidadoso no box, mas é muito resistente ao calor.',
    tooltip:
      'Bloco de Liga de Alumínio com Pistões de Aço AMS 6487 (FIA Art. C15.7.1 — titânio e Al-Si são proibidos nos pistões em 2026). O aço dilata menos que o alumínio, exigindo aquecimento preciso a 80–90°C para evitar travamento.',
    bomItems: [
      {
        component: 'Pistão V6 (x6)',
        material: 'Liga de Ferro AMS 6487 (Art. C15.7.1)',
        supplier: 'Usinagem Interna',
        unitCostUsd: 12500,
        quantity: 6,
        notes: 'Aço homologado FIA para pressões elevadas de câmara',
      },
      {
        component: 'Bloco do Motor V6 1.6L',
        material: 'Liga de Alumínio Fundida sob Pressão',
        supplier: 'Fundição de Precisão',
        unitCostUsd: 48000,
        quantity: 1,
        notes: 'Elemento semi-estrutural conectado ao monocoque',
      },
      {
        component: 'Cabeçote DOHC 4V',
        material: 'Liga de Alumínio CNC',
        supplier: 'Usinagem Interna',
        unitCostUsd: 34000,
        quantity: 1,
        notes: 'Condutividade térmica elevada (~130 W/m·K)',
      },
    ],
    classification: 'Regulamento FIA',
  },
  ferrari_steel_head: {
    id: 'ferrari_steel_head',
    shortLabel: 'Aço Especial / Cabeçote de Aço',
    fullName: 'Cabeçote de Aço Especial (Cobre/Cerâmica) + Pistões X38CrMoV5-3',
    pistonAlloyCode: 'X38CrMoV5-3',
    blockMaterial: 'Liga de Alumínio Reforçada',
    headMaterial: 'Aço Especial + Cobre e Revestimento Cerâmico',
    legacyIceMaterial: 'titanium',
    massDeltaKg: 8,
    thermalCeilingDeltaC: 15,
    peakIcePowerMultiplier: 0.982, // ~10-12 cv sacrifice to unlock high-temp aero packaging
    frictionReductionPct: 0.4,
    radiatorReliefPct: 16,
    costUsd: 14000000,
    tradeOffSummary: 'Cabeçote de aço especial. Aguenta calor extremo e permite laterais mais estreitas, mas pesa +8 kg.',
    tooltip:
      'Filosofia Ferrari 067/6: cabeçote de liga de aço especial com cobre/cerâmica e pistões X38CrMoV5-3. Opera acima de 110°C (+15°C margem) permitindo sidepods e radiadores menores, ao custo de +8 kg e leve sacrifício no pico puro do ICE.',
    researchProjectId: 'res_ferrari_steel_head',
    bomItems: [
      {
        component: 'Pistão V6 Alta Pressão (x6)',
        material: 'Liga de Ferro X38CrMoV5-3 (Art. C15.7.1)',
        supplier: 'Forjaria Especializada',
        unitCostUsd: 16200,
        quantity: 6,
        notes: 'Suporta picos térmicos e pressões de combustão >110°C',
      },
      {
        component: 'Cabeçote Alta Temperatura',
        material: 'Aço Especial + Cobre & Cerâmica',
        supplier: 'Metalurgia Avançada',
        unitCostUsd: 68000,
        quantity: 1,
        notes: '+8 kg no conjunto; libera redução de volume dos radiadores',
      },
      {
        component: 'Bloco do Motor V6 1.6L',
        material: 'Liga de Alumínio Estrutural',
        supplier: 'Fundição de Precisão',
        unitCostUsd: 52000,
        quantity: 1,
        notes: 'Tolerâncias calibradas para gradiente térmico elevado',
      },
    ],
    classification: 'Dado técnico',
  },
  al_si_low_friction: {
    id: 'al_si_low_friction',
    shortLabel: 'Liga Al-Si Otimizada',
    fullName: 'Bloco Al-Si Baixo Atrito + Pistões Aço 15CDV6',
    pistonAlloyCode: '15CDV6',
    blockMaterial: 'Liga Al-Si Otimizada de Baixo Atrito',
    headMaterial: 'Liga Al-Si de Alta Condutividade',
    legacyIceMaterial: 'aluminum',
    massDeltaKg: -4,
    thermalCeilingDeltaC: -4,
    peakIcePowerMultiplier: 1.016,
    frictionReductionPct: 2.2,
    radiatorReliefPct: -6,
    costUsd: 12200000,
    tradeOffSummary: 'Bloco leve de baixo atrito (-4 kg). Ganho direto de potência na reta, mas exige refrigeração forte.',
    tooltip:
      'Filosofia Red Bull Ford / Mercedes: bloco e cabeçote em liga Al-Si usinada de baixo atrito combinados a pistões homologados em aço 15CDV6/42CrMo4 (Art. C15.7.1). Reduz perdas por atrito e massa (−4 kg), mas tem menor limite térmico (−4°C).',
    researchProjectId: 'res_al_si_low_friction',
    bomItems: [
      {
        component: 'Pistão V6 Baixo Atrito (x6)',
        material: 'Liga de Ferro 15CDV6 / 42CrMo4 (Art. C15.7.1)',
        supplier: 'Usinagem de Precisão',
        unitCostUsd: 14800,
        quantity: 6,
        notes: 'Saia otimizada com revestimento DLC para mínimo atrito',
      },
      {
        component: 'Bloco Al-Si Leve',
        material: 'Liga Al-Si Tratada Termicamente',
        supplier: 'Usinagem Interna',
        unitCostUsd: 62000,
        quantity: 1,
        notes: '−4 kg em relação ao bloco padrão; exige fluxo constante de óleo',
      },
      {
        component: 'Cabeçote Condutividade Alta',
        material: 'Liga Al-Si Aeroespacial',
        supplier: 'Usinagem Interna',
        unitCostUsd: 41000,
        quantity: 1,
        notes: 'Dissipação rápida para evitar detonação em alta rotação',
      },
    ],
    classification: 'Dado técnico',
  },
};

export const BATTERY_ARCHITECTURES_2026: Record<BatteryArchitectureId, BatteryArchitectureSpec> = {
  lightweight_lithium: {
    id: 'lightweight_lithium',
    shortLabel: 'Lítio Leve (35 kg)',
    fullName: 'Células Íon-Lítio Leves · Carcaça Fibra de Carbono',
    massKg: 35,
    capacityMj: 4.0,
    thermalMassFactor: 1.15,
    casingMaterial: 'Compósito CFRP (Fibra de Carbono)',
    electrolyte: 'Eletrólito Líquido Padrão FIA',
    costDeltaUsd: 0,
    tradeOffSummary: 'Mais ágil nas curvas (carro mais leve), mas esquenta rápido e perde potência.',
    tooltip:
      'Regulamento 2026 exige célula de íons de lítio de alta densidade em carcaça de fibra de carbono. A versão leve reduz 6 kg para posicionamento de lastro, mas possui menor inércia térmica em descargas contínuas de 350 kW.',
    supportsSubChemistry: false,
    bomItems: [
      {
        component: 'Módulo de Células ES',
        material: 'Íon-Lítio Alta Densidade (4.0 MJ)',
        supplier: 'Fornecedor Homologado',
        unitCostUsd: 185000,
        quantity: 1,
        notes: 'Arquitetura 800V com menor massa térmica',
      },
      {
        component: 'Carcaça Estrutural ES',
        material: 'Compósito Fibra de Carbono (CFRP)',
        supplier: 'Autoclave Interna',
        unitCostUsd: 42000,
        quantity: 1,
        notes: 'Proteção anti-impacto FIA integrada ao assoalho',
      },
    ],
  },
  dense_pack: {
    id: 'dense_pack',
    shortLabel: 'Pack Alta Densidade (41 kg)',
    fullName: 'Pack Alta Densidade (4.4 MJ) · Carcaça CFRP',
    massKg: 41,
    capacityMj: 4.4,
    thermalMassFactor: 0.88,
    casingMaterial: 'Compósito CFRP + Dissipadores Dielétricos',
    electrolyte: 'Eletrólito Líquido Estabilizado (800V)',
    costDeltaUsd: 1200000,
    tradeOffSummary: 'Mais pesado nas curvas, mas mantém a potência elétrica por mais tempo.',
    tooltip:
      'Maior volume de células de íons de lítio (4.4 MJ) com gestão térmica aprimorada e menor queda de tensão em retas longas. Permite selecionar a química entre Cátodo NCA ou Ânodo Silício-Carbono.',
    supportsSubChemistry: true,
    bomItems: [
      {
        component: 'Módulo de Células Alta Densidade',
        material: 'Íon-Lítio NCA / Silício-Carbono (4.4 MJ)',
        supplier: 'Divisão Híbrida Especializada',
        unitCostUsd: 265000,
        quantity: 1,
        notes: 'Menor queda de tensão sob pico contínuo de 350 kW',
      },
      {
        component: 'Carcaça Estrutural CFRP',
        material: 'Fibra de Carbono + Canais Dielétricos',
        supplier: 'Autoclave Interna',
        unitCostUsd: 54000,
        quantity: 1,
        notes: 'Estabilidade térmica reforçada em alta voltagem',
      },
    ],
  },
  ultra_solid_state: {
    id: 'ultra_solid_state',
    shortLabel: 'Ultra Densidade Si-C (37 kg)',
    fullName: 'Pack Ultra Densidade Semi-Sólido (NCA + Ânodo Silício-Carbono)',
    massKg: 37,
    capacityMj: 4.8,
    thermalMassFactor: 0.82,
    casingMaterial: 'Compósito CFRP Ultraleve + Isolamento Cerâmico',
    electrolyte: 'Eletrólito Polimérico / Cerâmico (Semi-Solid State)',
    costDeltaUsd: 2600000,
    tradeOffSummary: 'Leve nas curvas e entrega potência elétrica máxima com menos aquecimento (Requer P&D).',
    tooltip:
      'Combina cátodo NCA com ânodo de Silício-Carbono e eletrólito semi-sólido cerâmico/polimérico em carcaça de fibra de carbono (4.8 MJ, 37 kg). Máxima densidade energética e estabilidade térmica em 800V.',
    researchProjectId: 'res_ultra_si_c_nca',
    supportsSubChemistry: true,
    bomItems: [
      {
        component: 'Células Semi-Sólidas 800V',
        material: 'Cátodo NCA + Ânodo Silício-Carbono + Eletrólito Cerâmico',
        supplier: 'Laboratório P&D Avançado',
        unitCostUsd: 420000,
        quantity: 1,
        notes: 'Recarga rápida em frenagem e mínima elevação de R_int',
      },
      {
        component: 'Carcaça Monobloco CFRP',
        material: 'Fibra de Carbono Alto Módulo + Barreira Térmica',
        supplier: 'Autoclave Interna',
        unitCostUsd: 68000,
        quantity: 1,
        notes: '−4 kg frente ao Pack Alta Densidade convencional',
      },
    ],
  },
};

export const BATTERY_SUB_CHEMISTRIES: Record<BatterySubChemistryId, BatterySubChemistrySpec> = {
  nca: {
    id: 'nca',
    label: 'Cátodo NCA (Níquel-Cobalto-Alumínio)',
    electrodeFormula: 'LiNiCoAlO₂',
    thermalDegradationFactor: 0.85,
    peakDeployMultiplier: 0.985,
    summary: 'Mais resistência ao calor e menor desgaste ao longo do fim de semana; pico instantâneo levemente menor.',
  },
  si_c: {
    id: 'si_c',
    label: 'Ânodo Silício-Carbono (Si-C)',
    electrodeFormula: 'Si-C Composite Anode',
    thermalDegradationFactor: 1.12,
    peakDeployMultiplier: 1.025,
    summary: 'Recarga e arrancada mais rápidas (+pico de potência), mas esquenta mais em sequências longas.',
  },
};

export const PU_MATERIAL_RESEARCH_PROJECTS: PuMaterialResearchProject[] = [
  {
    id: 'res_ferrari_steel_head',
    title: 'Cabeçote de Aço Especial (Alta Temp >110°C)',
    targetMaterialId: 'ferrari_steel_head',
    targetType: 'ice',
    costUsd: 5000000,
    durationWeeks: 8,
    minFacilityLevel: 2,
    description:
      'Pesquisa metalúrgica de cabeçote em aço especial com cobre/cerâmica e pistões X38CrMoV5-3 para elevar o teto térmico em +15°C.',
    engineeringEffect: 'Desbloqueia [Aço Especial / Cabeçote de Aço], permitindo radiadores menores e ganho aerodinâmico.',
  },
  {
    id: 'res_al_si_low_friction',
    title: 'Bloco Al-Si Baixo Atrito & Pistões 15CDV6',
    targetMaterialId: 'al_si_low_friction',
    targetType: 'ice',
    costUsd: 7000000,
    durationWeeks: 12,
    minFacilityLevel: 2,
    description:
      'Otimização de bloco Al-Si de baixa massa (−4 kg) pareado a pistões em liga ferrosa 15CDV6/42CrMo4 com redução de atrito interno.',
    engineeringEffect: 'Desbloqueia [Liga Al-Si Otimizada] para ganho direto de eficiência mecânica no ICE.',
  },
  {
    id: 'res_ultra_si_c_nca',
    title: 'Desenvolvimento Cátodo NCA & Ânodo Silício-Carbono',
    targetMaterialId: 'ultra_solid_state',
    targetType: 'battery',
    costUsd: 5000000,
    durationWeeks: 16,
    minFacilityLevel: 3,
    description:
      'Eletrólito cerâmico/polimérico semi-sólido com eletrodos NCA + Si-C em carcaça estrutural CFRP para 800V.',
    engineeringEffect: 'Desbloqueia [Ultra Densidade Si-C (37 kg)] com 4.8 MJ úteis e menor aquecimento Joule.',
  },
];

export const MANUFACTURER_PU_DNA_2026: Record<CustomerEngineSupplier | 'In-House', ManufacturerPuDnaSpec> = {
  'Red Bull-Ford': {
    supplier: 'Red Bull-Ford',
    puDesignation: 'DM-01 Powertrains',
    aduoTierLabel: 'Benchmark FIA (ICE)',
    philosophyTitle: 'Potência Bruta do ICE',
    summary: 'Motor a combustão de referência do grid 2026 (~400 kW), com bloco Al-Si de baixo atrito e pistões 42CrMo4.',
    advantage: 'Maior potência máxima do ICE e resposta agressiva de combustão.',
    disadvantage: 'Gerenciamento complexo de energia do ERS e maior risco de clipping sob carga máxima.',
    defaultIceMetallurgy: 'al_si_low_friction',
    defaultBatteryTech: 'lightweight_lithium',
    defaultBatterySubChem: 'si_c',
    starterUnlockedMaterials: ['fia_iron_ams6487', 'al_si_low_friction', 'lightweight_lithium', 'dense_pack'],
  },
  Mercedes: {
    supplier: 'Mercedes',
    puDesignation: 'M17 E-Performance',
    aduoTierLabel: '2%–4% atrás no ICE · Líder Conjunto PU',
    philosophyTitle: 'Eficiência Híbrida & Conjunto PU',
    summary: 'Unidade de potência mais completa no conjunto ICE + ERS, com foco em gestão de energia NCA e eficiência térmica.',
    advantage: 'Superior eficiência energética global e curva estável do Energy Store em 350 kW.',
    disadvantage: 'Integração exigente entre chassi e unidade elétrica; ICE puro ligeiramente abaixo do benchmark.',
    defaultIceMetallurgy: 'al_si_low_friction',
    defaultBatteryTech: 'dense_pack',
    defaultBatterySubChem: 'nca',
    starterUnlockedMaterials: ['fia_iron_ams6487', 'al_si_low_friction', 'lightweight_lithium', 'dense_pack'],
  },
  Ferrari: {
    supplier: 'Ferrari',
    puDesignation: '067/6 Superfast',
    aduoTierLabel: '>4% atrás no ICE · Foco Aerodinâmico',
    philosophyTitle: 'Ousadia Térmica & Cabeçote de Aço',
    summary: 'Cabeçote de aço especial operando acima de 110°C para encolher radiadores e liberar downforce na traseira.',
    advantage: 'Permite sidepods menores e vantagem aerodinâmica expressiva em pistas de alta carga.',
    disadvantage: '+8 kg de massa no bloco e leve sacrifício de ~10–12 cv no ICE puro.',
    defaultIceMetallurgy: 'ferrari_steel_head',
    defaultBatteryTech: 'dense_pack',
    defaultBatterySubChem: 'nca',
    starterUnlockedMaterials: ['fia_iron_ams6487', 'ferrari_steel_head', 'lightweight_lithium', 'dense_pack'],
  },
  Honda: {
    supplier: 'Honda',
    puDesignation: 'RA626H HRC',
    aduoTierLabel: '>4% atrás no ICE · Arquitetura Compacta',
    philosophyTitle: 'Equilíbrio & Packaging Ultra-Compacto',
    summary: 'Retorno de fábrica com divisão rigorosa 50/50 e empacotamento compacto para beneficiar o centro de gravidade.',
    advantage: 'Menor massa e packaging enxuto com excelente integração ao assoalho traseiro.',
    disadvantage: 'Sem destaque extremo isolado e sensibilidade a vibrações em alta rotação.',
    defaultIceMetallurgy: 'fia_iron_ams6487',
    defaultBatteryTech: 'lightweight_lithium',
    defaultBatterySubChem: 'nca',
    starterUnlockedMaterials: ['fia_iron_ams6487', 'lightweight_lithium', 'dense_pack'],
  },
  Audi: {
    supplier: 'Audi',
    puDesignation: 'Revolution F1 2026',
    aduoTierLabel: '>4% atrás no ICE · Projeto Integrado do Zero',
    philosophyTitle: 'Liberdade Total Chassi-Motor',
    summary: 'Primeira PU da Audi desenvolvida em Neuburg em simbiose direta com o chassi sem legado antigo.',
    advantage: 'Integração limpa de dutos e pontos de fixação sem restrições históricas.',
    disadvantage: 'Curva inicial de maturação e confiabilidade em desenvolvimento.',
    defaultIceMetallurgy: 'fia_iron_ams6487',
    defaultBatteryTech: 'lightweight_lithium',
    defaultBatterySubChem: 'nca',
    starterUnlockedMaterials: ['fia_iron_ams6487', 'lightweight_lithium', 'dense_pack'],
  },
  'In-House': {
    supplier: 'In-House',
    puDesignation: 'Protocolo Fênix 2026',
    aduoTierLabel: 'Projeto Independente (Base FIA)',
    philosophyTitle: 'Engenharia Própria sob Restrição FIA',
    summary: 'Inicia com a especificação padrão FIA (pistões AMS 6487 + Lítio Leve) e libera ligas especiais via P&D.',
    advantage: 'Liberdade total de calibração e evolução na árvore de pesquisa.',
    disadvantage: 'Ligas exóticas (Cabeçote de Aço / Si-C Semi-Sólido) exigem tempo e investimento em P&D.',
    defaultIceMetallurgy: 'fia_iron_ams6487',
    defaultBatteryTech: 'lightweight_lithium',
    defaultBatterySubChem: 'nca',
    starterUnlockedMaterials: ['fia_iron_ams6487', 'lightweight_lithium', 'dense_pack'],
  },
};

export function resolveIceMetallurgyId(
  iceMetallurgyId?: IceMetallurgyId,
  legacyIceMaterial?: 'aluminum' | 'titanium'
): IceMetallurgyId {
  if (iceMetallurgyId && ICE_METALLURGY_2026[iceMetallurgyId]) return iceMetallurgyId;
  return legacyIceMaterial === 'titanium' ? 'ferrari_steel_head' : 'fia_iron_ams6487';
}

export function resolveBatteryArchitectureId(
  batteryCellTech?: BatteryArchitectureId
): BatteryArchitectureId {
  if (batteryCellTech && BATTERY_ARCHITECTURES_2026[batteryCellTech]) return batteryCellTech;
  return 'lightweight_lithium';
}

export function getSupplierDnaSpec(
  supplier?: string | null
): ManufacturerPuDnaSpec {
  if (!supplier) return MANUFACTURER_PU_DNA_2026['In-House'];
  const normalized = supplier === 'RedBull-Ford' ? 'Red Bull-Ford' : supplier;
  if (normalized in MANUFACTURER_PU_DNA_2026) {
    return MANUFACTURER_PU_DNA_2026[normalized as CustomerEngineSupplier | 'In-House'];
  }
  return MANUFACTURER_PU_DNA_2026['In-House'];
}
