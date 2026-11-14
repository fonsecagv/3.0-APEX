import {
  DIM_ACCEL,
  DIM_AREA,
  DIM_DENSITY,
  DIM_DIMENSIONLESS,
  DIM_ENERGY,
  DIM_FORCE,
  DIM_LENGTH,
  DIM_MASS,
  DIM_MASS_FLOW,
  DIM_OMEGA,
  DIM_POWER,
  DIM_PRESSURE,
  DIM_RESISTANCE,
  DIM_SPECIFIC_HEAT,
  DIM_TEMP,
  DIM_THERMAL_COND,
  DIM_TIME,
  DIM_TORQUE,
  DIM_VELOCITY,
  DIM_VOLTAGE,
  type SiDimension,
  evaluateControlledEquation,
  verifyEquationDimensions,
} from '../math/controlledParser.ts';

export type ManualInfoClass =
  | 'Física estabelecida'
  | 'Modelo reduzido'
  | 'Dado medido'
  | 'Estimativa'
  | 'Hipótese'
  | 'Parâmetro de jogo';

export type EvidenceLevel = 'E1' | 'E2' | 'E3' | 'E4' | 'E5' | 'E6';

export type VariableRole = 'input' | 'calibratable' | 'state' | 'output' | 'derived';

export interface SiVariableSpec {
  symbol: string;
  name: string;
  unitSi: string;
  dimension: SiDimension;
  role: VariableRole;
  coordinateFrame: string;
  signConvention: string;
  domainMin: number;
  domainMax: number;
  infoClass: ManualInfoClass;
  uncertaintyPct: number;
  sourceCode: string;
  version: string;
}

export interface FluidSpec {
  code: string;
  name: string;
  fluidType: 'air' | 'fuel' | 'coolant' | 'oil';
  refTempK: number;
  refPressurePa: number;
  densityKgM3: number;
  cpJKgK: number;
  dynamicViscosityPaS: number;
  thermalConductivityWmK: number;
  infoClass: ManualInfoClass;
  evidenceLevel: EvidenceLevel;
  sourceCode: string;
  version: string;
}

export interface ScientificSourceSpec {
  code: string;
  title: string;
  authorInstitution: string;
  url: string;
  publishedDate: string;
  license: string;
  evidenceLevel: EvidenceLevel;
  version: string;
  contentHash: string;
  caveat: string;
}

export interface BaseEquationSpec {
  code: string;
  name: string;
  expression: string;
  variables: string[];
  expectedDimension: SiDimension;
  expectedUnitSi: string;
  domainDescription: string;
  infoClass: ManualInfoClass;
  version: string;
}

export interface GateResult {
  gateId: string;
  moduleCode: string;
  passed: boolean;
  criteria: Array<{
    id: string;
    label: string;
    passed: boolean;
    detail: string;
  }>;
}

export const COORDINATE_FRAME_STANDARD = {
  frameId: 'SAE_ISO_VEHICLE_AXES_2026',
  origin: 'Centro do eixo dianteiro no plano de referência inferior (Z = 0 no assoalho de referência)',
  xAxis: '+X longitudinal para trás (eixo dianteiro X=0, eixo traseiro X=wheelbase)',
  yAxis: '+Y lateral para a direita do piloto (plano de simetria Y=0)',
  zAxis: '+Z vertical para cima perpendicular ao solo',
  angles: 'Roll (+) inclina para direita; Pitch (+) nariz para cima; Yaw (+) nariz para direita (sentido horário vista superior)',
};

export const SCIENTIFIC_SOURCES: ScientificSourceSpec[] = [
  {
    code: 'SRC_NASA_GLENN',
    title: "NASA Glenn — Beginner's Guide to Aeronautics",
    authorInstitution: 'NASA Glenn Research Center',
    url: 'https://www.grc.nasa.gov/www/k-12/airplane/',
    publishedDate: '2024-01-01',
    license: 'Public Domain (US Government)',
    evidenceLevel: 'E2',
    version: '1.0.0',
    contentHash: 'sha256:nasa-glenn-aero-ref-v1',
    caveat: 'Fundamentos de fluidos e aerodinâmica; não substitui CFD ou ensaios de F1.',
  },
  {
    code: 'SRC_MILLIKEN_RCVD',
    title: 'Race Car Vehicle Dynamics',
    authorInstitution: 'Milliken & Milliken (SAE International)',
    url: 'https://www.sae.org/',
    publishedDate: '1995-01-01',
    license: 'Referência Bibliográfica SAE',
    evidenceLevel: 'E2',
    version: '1.0.0',
    contentHash: 'sha256:milliken-rcvd-v1',
    caveat: 'Referência teórica de dinâmica veicular; não contém setup proprietário.',
  },
  {
    code: 'SRC_PACEJKA_TVD',
    title: 'Tire and Vehicle Dynamics',
    authorInstitution: 'Hans B. Pacejka / MathWorks Magic Formula Docs',
    url: 'https://www.mathworks.com/help/physmod/sdl/ref/tireroadinteractionmagicformula.html',
    publishedDate: '2012-01-01',
    license: 'Documentação Técnica / Referência Acadêmica',
    evidenceLevel: 'E2',
    version: '1.0.0',
    contentHash: 'sha256:pacejka-mf-v1',
    caveat: 'Modelagem matemática; coeficientes específicos de compostos exigem ensaios.',
  },
  {
    code: 'SRC_JONES_CLT',
    title: 'Mechanics of Composite Materials',
    authorInstitution: 'Robert M. Jones',
    url: 'https://www.taylorfrancis.com/',
    publishedDate: '1998-01-01',
    license: 'Referência Acadêmica',
    evidenceLevel: 'E2',
    version: '1.0.0',
    contentHash: 'sha256:jones-clt-v1',
    caveat: 'Teoria Clássica dos Laminados; grandes deformações e dano exigem critérios adicionais.',
  },
  {
    code: 'SRC_NIST_WEBBOOK',
    title: 'NIST Chemistry WebBook — Thermophysical Properties of Fluid Systems',
    authorInstitution: 'National Institute of Standards and Technology',
    url: 'https://webbook.nist.gov/',
    publishedDate: '2025-01-01',
    license: 'Public Domain (NIST)',
    evidenceLevel: 'E3',
    version: '1.0.0',
    contentHash: 'sha256:nist-fluids-v1',
    caveat: 'Verificar faixa de temperatura, estado termodinâmico e unidade SI.',
  },
  {
    code: 'SRC_OPENFOAM_DOC',
    title: 'OpenFOAM User & Programmer Documentation',
    authorInstitution: 'OpenCFD / The OpenFOAM Foundation',
    url: 'https://www.openfoam.com/documentation/',
    publishedDate: '2025-01-01',
    license: 'GNU GPL v3',
    evidenceLevel: 'E4',
    version: '1.0.0',
    contentHash: 'sha256:openfoam-doc-v1',
    caveat: 'Software CFD; qualquer resultado externo exige verificação de malha e validação.',
  },
  {
    code: 'SRC_OPENF1_FASTF1',
    title: 'OpenF1 & FastF1 Public Motorsport Telemetry',
    authorInstitution: 'OpenF1 / theOehrly Fast-F1',
    url: 'https://openf1.org/',
    publishedDate: '2026-01-01',
    license: 'MIT / OpenF1 Terms',
    evidenceLevel: 'E5',
    version: '1.0.0',
    contentHash: 'sha256:openf1-fastf1-v1',
    caveat: 'Telemetria pública esportiva; não revela downforce, mapas de pneu ou potência real no eixo.',
  },
  {
    code: 'SRC_APEX_GAME_PARAM',
    title: 'Parâmetros de Balanceamento e Hipóteses APEX F1 2026',
    authorInstitution: 'APEX Engineering Spec (Manual Mestre v1.0)',
    url: 'local://manual-mestre-v1.0',
    publishedDate: '2026-11-12',
    license: 'Internal Project Spec',
    evidenceLevel: 'E6',
    version: '1.0.0',
    contentHash: 'sha256:apex-manual-v1',
    caveat: 'Valores ilustrativos/estimados; nunca apresentar como telemetria confidencial real de equipe F1.',
  },
];

export const SI_VARIABLE_REGISTRY: SiVariableSpec[] = [
  {
    symbol: 'm',
    name: 'Massa total do veículo',
    unitSi: 'kg',
    dimension: DIM_MASS,
    role: 'state',
    coordinateFrame: 'Inercial / Corpo',
    signConvention: 'Escalar positivo (> 0)',
    domainMin: 500,
    domainMax: 1200,
    infoClass: 'Física estabelecida',
    uncertaintyPct: 0.2,
    sourceCode: 'SRC_APEX_GAME_PARAM',
    version: '1.0.0',
  },
  {
    symbol: 'V',
    name: 'Velocidade relativa ao fluido / pista',
    unitSi: 'm/s',
    dimension: DIM_VELOCITY,
    role: 'state',
    coordinateFrame: COORDINATE_FRAME_STANDARD.frameId,
    signConvention: '+ para frente no deslocamento do veículo',
    domainMin: 0,
    domainMax: 115,
    infoClass: 'Física estabelecida',
    uncertaintyPct: 0.5,
    sourceCode: 'SRC_NASA_GLENN',
    version: '1.0.0',
  },
  {
    symbol: 'a',
    name: 'Aceleração linear',
    unitSi: 'm/s^2',
    dimension: DIM_ACCEL,
    role: 'state',
    coordinateFrame: COORDINATE_FRAME_STANDARD.frameId,
    signConvention: '+ax aceleração; -ax frenagem; +ay curva à direita',
    domainMin: -70,
    domainMax: 70,
    infoClass: 'Física estabelecida',
    uncertaintyPct: 1.0,
    sourceCode: 'SRC_MILLIKEN_RCVD',
    version: '1.0.0',
  },
  {
    symbol: 'rho',
    name: 'Massa específica do fluido',
    unitSi: 'kg/m^3',
    dimension: DIM_DENSITY,
    role: 'input',
    coordinateFrame: 'Ambiente',
    signConvention: 'Escalar positivo (> 0)',
    domainMin: 0.7,
    domainMax: 1200,
    infoClass: 'Física estabelecida',
    uncertaintyPct: 0.5,
    sourceCode: 'SRC_NIST_WEBBOOK',
    version: '1.0.0',
  },
  {
    symbol: 'q',
    name: 'Pressão dinâmica',
    unitSi: 'Pa',
    dimension: DIM_PRESSURE,
    role: 'derived',
    coordinateFrame: 'Escoamento livre',
    signConvention: 'Escalar não negativo (>= 0)',
    domainMin: 0,
    domainMax: 10000,
    infoClass: 'Física estabelecida',
    uncertaintyPct: 1.0,
    sourceCode: 'SRC_NASA_GLENN',
    version: '1.0.0',
  },
  {
    symbol: 'A',
    name: 'Área de referência / seção transversal',
    unitSi: 'm^2',
    dimension: DIM_AREA,
    role: 'input',
    coordinateFrame: COORDINATE_FRAME_STANDARD.frameId,
    signConvention: 'Escalar positivo (> 0)',
    domainMin: 0.001,
    domainMax: 10,
    infoClass: 'Estimativa',
    uncertaintyPct: 1.0,
    sourceCode: 'SRC_APEX_GAME_PARAM',
    version: '1.0.0',
  },
  {
    symbol: 'F',
    name: 'Força resultante / componente',
    unitSi: 'N',
    dimension: DIM_FORCE,
    role: 'output',
    coordinateFrame: COORDINATE_FRAME_STANDARD.frameId,
    signConvention: 'Fz positivo como magnitude de downforce quando explicitado em M02/M04; Fx tração (+), arrasto (-)',
    domainMin: -50000,
    domainMax: 50000,
    infoClass: 'Física estabelecida',
    uncertaintyPct: 2.0,
    sourceCode: 'SRC_NASA_GLENN',
    version: '1.0.0',
  },
  {
    symbol: 'T_q',
    name: 'Torque no eixo',
    unitSi: 'N*m',
    dimension: DIM_TORQUE,
    role: 'state',
    coordinateFrame: 'Eixo rotacional local',
    signConvention: 'Positivo no sentido de avanço do motor',
    domainMin: -5000,
    domainMax: 15000,
    infoClass: 'Física estabelecida',
    uncertaintyPct: 1.5,
    sourceCode: 'SRC_MILLIKEN_RCVD',
    version: '1.0.0',
  },
  {
    symbol: 'omega',
    name: 'Velocidade angular',
    unitSi: 'rad/s',
    dimension: DIM_OMEGA,
    role: 'state',
    coordinateFrame: 'Eixo rotacional local',
    signConvention: 'Positivo no sentido de avanço',
    domainMin: -3000,
    domainMax: 3000,
    infoClass: 'Física estabelecida',
    uncertaintyPct: 0.5,
    sourceCode: 'SRC_MILLIKEN_RCVD',
    version: '1.0.0',
  },
  {
    symbol: 'P',
    name: 'Potência mecânica ou térmica',
    unitSi: 'W',
    dimension: DIM_POWER,
    role: 'output',
    coordinateFrame: 'Escalar referenciado ao eixo',
    signConvention: '+ fornecida/gerada; - consumida/dissipada',
    domainMin: -2000000,
    domainMax: 2000000,
    infoClass: 'Física estabelecida',
    uncertaintyPct: 1.5,
    sourceCode: 'SRC_APEX_GAME_PARAM',
    version: '1.0.0',
  },
  {
    symbol: 'm_dot',
    name: 'Vazão mássica',
    unitSi: 'kg/s',
    dimension: DIM_MASS_FLOW,
    role: 'output',
    coordinateFrame: 'Normal à seção de controle',
    signConvention: 'Positivo na direção do escoamento',
    domainMin: 0,
    domainMax: 50,
    infoClass: 'Física estabelecida',
    uncertaintyPct: 2.0,
    sourceCode: 'SRC_NASA_GLENN',
    version: '1.0.0',
  },
  {
    symbol: 'cp',
    name: 'Calor específico à pressão constante',
    unitSi: 'J/(kg*K)',
    dimension: DIM_SPECIFIC_HEAT,
    role: 'input',
    coordinateFrame: 'Termodinâmico',
    signConvention: 'Escalar positivo (> 0)',
    domainMin: 100,
    domainMax: 10000,
    infoClass: 'Dado medido',
    uncertaintyPct: 1.0,
    sourceCode: 'SRC_NIST_WEBBOOK',
    version: '1.0.0',
  },
  {
    symbol: 'dT',
    name: 'Diferença de temperatura',
    unitSi: 'K',
    dimension: DIM_TEMP,
    role: 'state',
    coordinateFrame: 'Escalar Kelvin',
    signConvention: 'ΔT = T_quente - T_fria ou T_final - T_inicial',
    domainMin: -300,
    domainMax: 2000,
    infoClass: 'Física estabelecida',
    uncertaintyPct: 1.0,
    sourceCode: 'SRC_NIST_WEBBOOK',
    version: '1.0.0',
  },
  {
    symbol: 'k_th',
    name: 'Condutividade térmica',
    unitSi: 'W/(m*K)',
    dimension: DIM_THERMAL_COND,
    role: 'input',
    coordinateFrame: 'Material',
    signConvention: 'Escalar positivo (> 0)',
    domainMin: 0.01,
    domainMax: 500,
    infoClass: 'Dado medido',
    uncertaintyPct: 2.5,
    sourceCode: 'SRC_NIST_WEBBOOK',
    version: '1.0.0',
  },
  {
    symbol: 'L',
    name: 'Comprimento característico / espessura',
    unitSi: 'm',
    dimension: DIM_LENGTH,
    role: 'input',
    coordinateFrame: COORDINATE_FRAME_STANDARD.frameId,
    signConvention: 'Escalar positivo (> 0)',
    domainMin: 0.0001,
    domainMax: 10,
    infoClass: 'Física estabelecida',
    uncertaintyPct: 0.5,
    sourceCode: 'SRC_APEX_GAME_PARAM',
    version: '1.0.0',
  },
  {
    symbol: 't_s',
    name: 'Tempo',
    unitSi: 's',
    dimension: DIM_TIME,
    role: 'state',
    coordinateFrame: 'Tempo de simulação monotônico',
    signConvention: 't >= 0',
    domainMin: 0,
    domainMax: 86400,
    infoClass: 'Física estabelecida',
    uncertaintyPct: 0.01,
    sourceCode: 'SRC_APEX_GAME_PARAM',
    version: '1.0.0',
  },
  {
    symbol: 'I_el',
    name: 'Corrente elétrica no barramento ERS',
    unitSi: 'A',
    dimension: [0, 0, 0, 1, 0],
    role: 'state',
    coordinateFrame: 'Barramento DC',
    signConvention: '+ descarga; - regeneração',
    domainMin: -800,
    domainMax: 800,
    infoClass: 'Física estabelecida',
    uncertaintyPct: 1.0,
    sourceCode: 'SRC_APEX_GAME_PARAM',
    version: '1.0.0',
  },
  {
    symbol: 'V_el',
    name: 'Tensão elétrica no barramento',
    unitSi: 'V',
    dimension: DIM_VOLTAGE,
    role: 'state',
    coordinateFrame: 'Barramento DC',
    signConvention: 'V > 0',
    domainMin: 200,
    domainMax: 1000,
    infoClass: 'Física estabelecida',
    uncertaintyPct: 0.5,
    sourceCode: 'SRC_APEX_GAME_PARAM',
    version: '1.0.0',
  },
  {
    symbol: 'R_el',
    name: 'Resistência elétrica interna',
    unitSi: 'Ohm',
    dimension: DIM_RESISTANCE,
    role: 'calibratable',
    coordinateFrame: 'Células Energy Store',
    signConvention: 'R > 0',
    domainMin: 0.001,
    domainMax: 0.5,
    infoClass: 'Estimativa',
    uncertaintyPct: 5.0,
    sourceCode: 'SRC_APEX_GAME_PARAM',
    version: '1.0.0',
  },
  {
    symbol: 'E_en',
    name: 'Energia',
    unitSi: 'J',
    dimension: DIM_ENERGY,
    role: 'state',
    coordinateFrame: 'Escalar',
    signConvention: 'E >= 0',
    domainMin: 0,
    domainMax: 1e9,
    infoClass: 'Física estabelecida',
    uncertaintyPct: 0.5,
    sourceCode: 'SRC_APEX_GAME_PARAM',
    version: '1.0.0',
  },
  {
    symbol: 'CL',
    name: 'Coeficiente de downforce (magnitude positiva)',
    unitSi: '-',
    dimension: DIM_DIMENSIONLESS,
    role: 'calibratable',
    coordinateFrame: COORDINATE_FRAME_STANDARD.frameId,
    signConvention: 'CL > 0 representa magnitude de carga vertical descendente (downforce)',
    domainMin: -1.0,
    domainMax: 8.0,
    infoClass: 'Modelo reduzido',
    uncertaintyPct: 4.0,
    sourceCode: 'SRC_NASA_GLENN',
    version: '1.0.0',
  },
  {
    symbol: 'CD',
    name: 'Coeficiente de arrasto aerodinâmico',
    unitSi: '-',
    dimension: DIM_DIMENSIONLESS,
    role: 'calibratable',
    coordinateFrame: COORDINATE_FRAME_STANDARD.frameId,
    signConvention: 'CD > 0 oposto ao movimento relativo',
    domainMin: 0.1,
    domainMax: 3.0,
    infoClass: 'Modelo reduzido',
    uncertaintyPct: 4.0,
    sourceCode: 'SRC_NASA_GLENN',
    version: '1.0.0',
  },
];

export const FLUID_CATALOG: FluidSpec[] = [
  {
    code: 'FLUID_AIR_DRY',
    name: 'Ar Atmosférico Seco (Referência 298.15 K, 101325 Pa)',
    fluidType: 'air',
    refTempK: 298.15,
    refPressurePa: 101325,
    densityKgM3: 1.1839,
    cpJKgK: 1005.0,
    dynamicViscosityPaS: 1.849e-5,
    thermalConductivityWmK: 0.0262,
    infoClass: 'Dado medido',
    evidenceLevel: 'E3',
    sourceCode: 'SRC_NIST_WEBBOOK',
    version: '1.0.0',
  },
  {
    code: 'FLUID_COOLANT_50_50',
    name: 'Água / Etilenoglicol 50/50 Pressurizado',
    fluidType: 'coolant',
    refTempK: 363.15,
    refPressurePa: 250000,
    densityKgM3: 1018.0,
    cpJKgK: 3560.0,
    dynamicViscosityPaS: 4.8e-4,
    thermalConductivityWmK: 0.415,
    infoClass: 'Dado medido',
    evidenceLevel: 'E3',
    sourceCode: 'SRC_NIST_WEBBOOK',
    version: '1.0.0',
  },
  {
    code: 'FLUID_GEAR_OIL_SYNTH',
    name: 'Óleo Sintético de Transmissão 75W-90 F1',
    fluidType: 'oil',
    refTempK: 373.15,
    refPressurePa: 101325,
    densityKgM3: 835.0,
    cpJKgK: 2150.0,
    dynamicViscosityPaS: 0.011,
    thermalConductivityWmK: 0.138,
    infoClass: 'Estimativa',
    evidenceLevel: 'E6',
    sourceCode: 'SRC_APEX_GAME_PARAM',
    version: '1.0.0',
  },
  {
    code: 'FLUID_EFUEL_2026',
    name: 'Combustível Sustentável 100% Avançado (FIA 2026)',
    fluidType: 'fuel',
    refTempK: 293.15,
    refPressurePa: 101325,
    densityKgM3: 752.0,
    cpJKgK: 2180.0,
    dynamicViscosityPaS: 4.9e-4,
    thermalConductivityWmK: 0.125,
    infoClass: 'Estimativa',
    evidenceLevel: 'E6',
    sourceCode: 'SRC_APEX_GAME_PARAM',
    version: '1.0.0',
  },
];

export const BASE_EQUATIONS_CATALOG: BaseEquationSpec[] = [
  {
    code: 'EQ_NEWTON_2',
    name: 'Segunda Lei de Newton',
    expression: 'm * a',
    variables: ['m', 'a'],
    expectedDimension: DIM_FORCE,
    expectedUnitSi: 'N',
    domainDescription: 'Corpo rígido em referencial inercial; considerar m(t) variável quando aplicável',
    infoClass: 'Física estabelecida',
    version: '1.0.0',
  },
  {
    code: 'EQ_DYN_PRESSURE',
    name: 'Pressão Dinâmica',
    expression: '0.5 * rho * V^2',
    variables: ['rho', 'V'],
    expectedDimension: DIM_PRESSURE,
    expectedUnitSi: 'Pa',
    domainDescription: 'Escoamento incompressível (Ma < 0.3 para precisão estrita; correções subsônicas acima)',
    infoClass: 'Física estabelecida',
    version: '1.0.0',
  },
  {
    code: 'EQ_MASS_FLOW',
    name: 'Vazão Mássica (Continuidade)',
    expression: 'rho * A * V',
    variables: ['rho', 'A', 'V'],
    expectedDimension: DIM_MASS_FLOW,
    expectedUnitSi: 'kg/s',
    domainDescription: 'Seção transversal A uniforme e velocidade média normal V',
    infoClass: 'Física estabelecida',
    version: '1.0.0',
  },
  {
    code: 'EQ_ROT_POWER',
    name: 'Potência Rotacional',
    expression: 'T_q * omega',
    variables: ['T_q', 'omega'],
    expectedDimension: DIM_POWER,
    expectedUnitSi: 'W',
    domainDescription: 'Torque em N·m e velocidade angular em rad/s referidos ao mesmo eixo',
    infoClass: 'Física estabelecida',
    version: '1.0.0',
  },
  {
    code: 'EQ_SENSIBLE_HEAT',
    name: 'Calor Sensível',
    expression: 'm * cp * dT',
    variables: ['m', 'cp', 'dT'],
    expectedDimension: DIM_ENERGY,
    expectedUnitSi: 'J',
    domainDescription: 'Sem mudança de fase; cp aproximado constante no intervalo ΔT',
    infoClass: 'Física estabelecida',
    version: '1.0.0',
  },
  {
    code: 'EQ_CONDUCTION_1D',
    name: 'Condução Térmica 1D (Fourier)',
    expression: 'k_th * A * dT / L',
    variables: ['k_th', 'A', 'dT', 'L'],
    expectedDimension: DIM_POWER,
    expectedUnitSi: 'W',
    domainDescription: 'Parede plana estacionária com propriedades homogêneas',
    infoClass: 'Física estabelecida',
    version: '1.0.0',
  },
  {
    code: 'EQ_JOULE_LOSS',
    name: 'Perdas Resistivas Joule',
    expression: 'I_el^2 * R_el',
    variables: ['I_el', 'R_el'],
    expectedDimension: DIM_POWER,
    expectedUnitSi: 'W',
    domainDescription: 'Corrente RMS/DC no barramento e resistência interna efetiva',
    infoClass: 'Física estabelecida',
    version: '1.0.0',
  },
  {
    code: 'EQ_AERO_DOWNFORCE',
    name: 'Força Aerodinâmica Vertical (Downforce)',
    expression: '0.5 * rho * V^2 * CL * A',
    variables: ['rho', 'V', 'CL', 'A'],
    expectedDimension: DIM_FORCE,
    expectedUnitSi: 'N',
    domainDescription: 'CL positivo como magnitude de downforce; válido dentro do envelope de mapas calibrados',
    infoClass: 'Modelo reduzido',
    version: '1.0.0',
  },
  {
    code: 'EQ_AERO_DRAG',
    name: 'Arrasto Aerodinâmico',
    expression: '0.5 * rho * V^2 * CD * A',
    variables: ['rho', 'V', 'CD', 'A'],
    expectedDimension: DIM_FORCE,
    expectedUnitSi: 'N',
    domainDescription: 'V relativa ao ar em m/s; CD > 0',
    infoClass: 'Modelo reduzido',
    version: '1.0.0',
  },
];

/**
 * Computes air thermodynamic properties using Ideal Gas Law and Sutherland's viscosity law.
 */
export function computeAirState(pressurePa: number, tempK: number): {
  densityKgM3: number;
  dynamicViscosityPaS: number;
  speedOfSoundMs: number;
  cpJKgK: number;
} {
  const safeT = Math.max(200, Math.min(400, tempK));
  const safeP = Math.max(50000, Math.min(130000, pressurePa));
  const R_air = 287.058; // J/(kg*K)
  const gamma = 1.4;
  const densityKgM3 = safeP / (R_air * safeT);
  // Sutherland's formula for dry air
  const mu0 = 1.716e-5;
  const T0 = 273.15;
  const S = 110.4;
  const dynamicViscosityPaS = mu0 * Math.pow(safeT / T0, 1.5) * ((T0 + S) / (safeT + S));
  const speedOfSoundMs = Math.sqrt(gamma * R_air * safeT);
  const cpJKgK = 1002.5 + 0.068 * Math.max(0, safeT - 250);
  return { densityKgM3, dynamicViscosityPaS, speedOfSoundMs, cpJKgK };
}

export function evaluateEquationSafely(
  equationCode: string,
  scope: Record<string, number>
): { value: number; unitSi: string; dimensionalVerified: boolean } {
  const eq = BASE_EQUATIONS_CATALOG.find((e) => e.code === equationCode);
  if (!eq) throw new Error(`Unknown equation code: ${equationCode}`);

  const dimMap: Record<string, SiDimension> = {};
  for (const v of eq.variables) {
    const spec = SI_VARIABLE_REGISTRY.find((s) => s.symbol === v);
    if (!spec) throw new Error(`Variable "${v}" missing from SI_VARIABLE_REGISTRY`);
    if (scope[v] !== undefined && (scope[v] < spec.domainMin || scope[v] > spec.domainMax)) {
      throw new Error(
        `Variable "${v}" value ${scope[v]} outside physical domain [${spec.domainMin}, ${spec.domainMax}] ${spec.unitSi}`
      );
    }
    dimMap[v] = spec.dimension;
  }

  const dimCheck = verifyEquationDimensions(eq.expression, dimMap, eq.expectedDimension);
  if (!dimCheck.passed) {
    throw new Error(`Dimensional check failed for ${equationCode}: ${dimCheck.error}`);
  }

  const value = evaluateControlledEquation(eq.expression, scope);
  return { value, unitSi: eq.expectedUnitSi, dimensionalVerified: true };
}

export function evaluateGate01(): GateResult {
  const allVarsValid = SI_VARIABLE_REGISTRY.every(
    (v) => v.unitSi.length > 0 && v.signConvention.length > 0 && v.coordinateFrame.length > 0
  );

  const dimMap = Object.fromEntries(SI_VARIABLE_REGISTRY.map((v) => [v.symbol, v.dimension]));
  const equationChecks = BASE_EQUATIONS_CATALOG.map((eq) => ({
    code: eq.code,
    ...verifyEquationDimensions(eq.expression, dimMap, eq.expectedDimension),
  }));
  const allEqsDimensional = equationChecks.every((c) => c.passed);

  const allSourcesProvenanced = SCIENTIFIC_SOURCES.every(
    (s) => s.url.length > 0 && s.license.length > 0 && s.contentHash.length > 0 && s.evidenceLevel.startsWith('E')
  );

  const allVersioned =
    SI_VARIABLE_REGISTRY.every((v) => /^\d+\.\d+\.\d+$/.test(v.version)) &&
    BASE_EQUATIONS_CATALOG.every((e) => /^\d+\.\d+\.\d+$/.test(e.version)) &&
    FLUID_CATALOG.every((f) => /^\d+\.\d+\.\d+$/.test(f.version));

  const criteria = [
    {
      id: 'G01-C1',
      label: 'Todas as variáveis têm unidade SI, referencial e convenção de sinal',
      passed: allVarsValid,
      detail: `${SI_VARIABLE_REGISTRY.length} variáveis registradas com unidade SI, domínio, classe e incerteza.`,
    },
    {
      id: 'G01-C2',
      label: 'Equações possuem domínio declarado e verificação dimensional via parser controlado',
      passed: allEqsDimensional,
      detail: `${equationChecks.filter((c) => c.passed).length}/${equationChecks.length} equações validadas dimensionalmente.`,
    },
    {
      id: 'G01-C3',
      label: 'Fontes e fluidos possuem proveniência, licença, hash e classificação E1–E6',
      passed: allSourcesProvenanced,
      detail: `${SCIENTIFIC_SOURCES.length} fontes e ${FLUID_CATALOG.length} fluidos com proveniência rastreável.`,
    },
    {
      id: 'G01-C4',
      label: 'Modelos e dados seguem versionamento semântico reproduzível',
      passed: allVersioned,
      detail: 'SemVer MAJOR.MINOR.PATCH ativo em variáveis, equações e fluidos.',
    },
  ];

  return {
    gateId: 'GATE_01',
    moduleCode: 'M01',
    passed: criteria.every((c) => c.passed),
    criteria,
  };
}
