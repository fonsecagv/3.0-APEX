// src/types/staff.ts

/**
 * Atributos determinísticos dos membros de corpo técnico (Staff).
 */
export interface StaffAttributes {
  tecnica: number;
  criatividade: number;
  rigorValidacao: number;
  lideranca: number;
  comunicacao: number;
  gestaoPrazo: number;
  adaptacao: number;
  visaoEstrategica?: number;
  resiliencia?: number;
}

/**
 * Tipo de cargo dentro da equipa de engenharia/gestão.
 */
export type StaffRole =
  | 'aeroChief'
  | 'puChief'
  | 'chassisChief'
  | 'reliabilityChief'
  | 'managementChief'
  | 'pitStopChief';

/**
 * Especializações possíveis – definem bônus/ônus específicos.
 */
export enum Specialization {
  // ==========================
  // DNA DE AERODINÂMICA (Mapeado para as 6 Filosofias)
  // ==========================
  LOW_DRAG = 'LOW_DRAG',                     // Foco em retas
  HIGH_DOWNFORCE = 'HIGH_DOWNFORCE',         // Foco em curvas lentas
  AERO_EFFICIENCY = 'AERO_EFFICIENCY',       // Equilíbrio L/D
  MECHANICAL_GRIP = 'MECHANICAL_GRIP',       // Foco em suspensão/tração
  STABLE_PLATFORM = 'STABLE_PLATFORM',       // Foco em estabilidade e previsibilidade
  BALANCED = 'BALANCED',                     // Foco em versatilidade
  
  // Aliases / Suporte retrocompatível
  INNOVATOR = 'INNOVATOR',
  CONSERVATIVE = 'CONSERVATIVE',
  CFD_CORRELATION = 'CFD_CORRELATION',

  // ==========================
  // DNA DE PU & COMPONENTES
  // ==========================
  ICE = 'ICE', 
  ERS = 'ERS',
  RELIABILITY = 'RELIABILITY',
  TRANSMISSION_MECHANICS = 'TRANSMISSION_MECHANICS',
  CHASSIS_SUSPENSION = 'CHASSIS_SUSPENSION',
  BRAKE_SYSTEMS = 'BRAKE_SYSTEMS',           // Engenheiro de Sistemas de Freio & Arrefecimento
  BRAKE_BY_WIRE = 'BRAKE_BY_WIRE',           // Especialista em Brake-by-Wire
  
  // ==========================
  // DNA DE GERENCIAMENTO
  // ==========================
  MOTIVATOR = 'MOTIVATOR',
  POLITICIAN = 'POLITICIAN',
  CRISIS_MANAGER = 'CRISIS_MANAGER',
  PUBLIC_RELATIONS = 'PUBLIC_RELATIONS',
  FINANCIAL = 'FINANCIAL',
  RACE_STRATEGY = 'RACE_STRATEGY',
  
  // ==========================
  // DNA DE MECÂNICA
  // ==========================
  PIT_STOP_MASTER = 'PIT_STOP_MASTER',
  MOUNTING_ENGINEER = 'MOUNTING_ENGINEER',
  DIAGNOSTICS = 'DIAGNOSTICS',
  BRAKE_THERMAL = 'BRAKE_THERMAL',           // Gestão Térmica de Freios & Mantas
}

/**
 * Descrição de efeitos de cada especialização. Usado para cálculo de sinergia
 * e para exibir nas UI de contratação.
 */
export interface SpecializationEffect {
  attribute: keyof DevelopmentModifiers;
  value: number;
  description: string;
}

/**
 * Modificadores de desenvolvimento que podem ser influenciados pelos chefes.
 */
export interface DevelopmentModifiers {
  aeroSpeedMultiplier?: number;
  aeroCostMultiplier?: number;
  aeroDownforceBonus?: number;
  aeroDragPenalty?: number;
  aeroCorrelationPenalty?: number;

  powerIncrease?: number;
  powerReliabilityPenalty?: number;
  ersEfficiencyBonus?: number;
  icsEfficiencyPenalty?: number;
  irsEfficiencyPenalty?: number;

  transmissionSpeedMultiplier?: number;
  transmissionReliabilityPenalty?: number;
  suspensionSpeedMultiplier?: number;
  suspensionReliabilityPenalty?: number;

  moraleBonus?: number;
  moralePenaltyForRigidOrders?: number;

  pitStopTimePenalty?: number;
  pitRepairTimePenalty?: number;

  breakChanceReduction?: number;
  performancePenaltyForReliabilityFocus?: number;
  salary?: number;
}

/**
 * Representa um membro de staff com efeitos e especializações.
 */
export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  specialization: Specialization;
  ovr: number;
  salary: number; // USD M/ano
  effects: SpecializationEffect[];
  avatarUrl?: string;
  isHired?: boolean;
  specialty?: string;
  specialtyPrimary?: string;
  specialtySecondary?: string;
}

export const specializationEffectsMap: Record<Specialization, SpecializationEffect[]> = {
  // Aero
  [Specialization.LOW_DRAG]: [
    { attribute: 'aeroDragPenalty', value: -10, description: '-10% Arrasto nas retas' },
    { attribute: 'aeroCorrelationPenalty', value: 5, description: '+5% Erro de correlação em curvas' },
  ],
  [Specialization.HIGH_DOWNFORCE]: [
    { attribute: 'aeroDownforceBonus', value: 8, description: '+8% Carga aerodinâmica máxima' },
    { attribute: 'aeroDragPenalty', value: 10, description: '+10% Arrasto extra em alta velocidade' },
  ],
  [Specialization.AERO_EFFICIENCY]: [
    { attribute: 'aeroDownforceBonus', value: 5, description: '+5% Eficiência L/D (Downforce/Arrasto)' },
    { attribute: 'aeroDragPenalty', value: -4, description: '-4% Arrasto em retas' },
  ],
  [Specialization.MECHANICAL_GRIP]: [
    { attribute: 'suspensionSpeedMultiplier', value: 10, description: '+10% Veloc. desenvolvimento de suspensão' },
    { attribute: 'aeroDownforceBonus', value: 3, description: '+3% Aderência mecânica' },
  ],
  [Specialization.STABLE_PLATFORM]: [
    { attribute: 'aeroCorrelationPenalty', value: -15, description: '-15% Erro de Correlação (carro estável)' },
    { attribute: 'aeroDownforceBonus', value: 2, description: '+2% Carga previsível' },
  ],
  [Specialization.BALANCED]: [
    { attribute: 'aeroDownforceBonus', value: 4, description: '+4% Versatilidade de chassi' },
    { attribute: 'aeroDragPenalty', value: -3, description: '-3% Arrasto geral' },
  ],
  [Specialization.INNOVATOR]: [
    { attribute: 'aeroDownforceBonus', value: 5, description: '+5% Downforce nos upgrades' },
    { attribute: 'aeroCostMultiplier', value: 15, description: '+15% Custo de túnel de vento' },
  ],
  [Specialization.CONSERVATIVE]: [
    { attribute: 'aeroCorrelationPenalty', value: -15, description: '-15% Erro de Correlação' },
    { attribute: 'aeroDownforceBonus', value: 2, description: '+2% Downforce máximo por peça' },
  ],
  [Specialization.CFD_CORRELATION]: [
    { attribute: 'aeroCorrelationPenalty', value: -20, description: '-20% Erro de correlação CFD/Túnel' },
    { attribute: 'aeroCostMultiplier', value: 8, description: '+8% Custo de simulação' },
  ],

  // PU / Motor
  [Specialization.ICE]: [
    { attribute: 'powerIncrease', value: 3, description: '+3% Potência' },
    { attribute: 'powerReliabilityPenalty', value: -5, description: '-5% Confiabilidade' },
    { attribute: 'irsEfficiencyPenalty', value: 0, description: '' },
  ],
  [Specialization.ERS]: [
    { attribute: 'ersEfficiencyBonus', value: 10, description: '+10% Eficiência de deploy 350kW' },
    { attribute: 'icsEfficiencyPenalty', value: -1, description: '-1% Eficiência do motor ICE' },
  ],
  [Specialization.CHASSIS_SUSPENSION]: [
    { attribute: 'transmissionSpeedMultiplier', value: 15, description: '+15% Veloc. desenvolvimento de transmissão' },
    { attribute: 'suspensionSpeedMultiplier', value: 15, description: '+15% Veloc. desenvolvimento de suspensão' },
  ],
  [Specialization.RELIABILITY]: [
    { attribute: 'breakChanceReduction', value: 20, description: '-20% Chance de quebra de motor' },
    { attribute: 'performancePenaltyForReliabilityFocus', value: -3, description: '-3% Performance das peças novas' },
  ],
  [Specialization.TRANSMISSION_MECHANICS]: [
    { attribute: 'transmissionSpeedMultiplier', value: 10, description: '+10% Veloc. desenvolvimento de transmissão' },
    { attribute: 'transmissionReliabilityPenalty', value: -5, description: '-5% Confiabilidade da transmissão' },
  ],
  [Specialization.BRAKE_SYSTEMS]: [
    { attribute: 'aeroDragPenalty', value: -4, description: '-4% Arrasto por otimização dos ductos de freio' },
    { attribute: 'breakChanceReduction', value: 15, description: '-15% Risco de superaquecimento dos freios' },
  ],
  [Specialization.BRAKE_BY_WIRE]: [
    { attribute: 'ersEfficiencyBonus', value: 5, description: '+5% Recuperação cinética de frenagem MGU-K' },
    { attribute: 'breakChanceReduction', value: 12, description: '-15% Risco de travamento de rodas (Lockup)' },
  ],

  // Management
  [Specialization.MOTIVATOR]: [
    { attribute: 'moraleBonus', value: 15, description: '+15 Moral da Equipe' },
    { attribute: 'moralePenaltyForRigidOrders', value: 0, description: '' },
  ],
  [Specialization.POLITICIAN]: [
    { attribute: 'moralePenaltyForRigidOrders', value: -10, description: '-10 Moral dos Pilotos' },
    { attribute: 'breakChanceReduction', value: 0, description: '' },
  ],
  [Specialization.CRISIS_MANAGER]: [
    { attribute: 'pitRepairTimePenalty', value: -30, description: '-30% Tempo de conserto na fábrica' },
    { attribute: 'salary', value: 2, description: '+2M salário extra (custo)' },
  ],
  [Specialization.FINANCIAL]: [
    { attribute: 'salary', value: 1, description: '+1M salário extra (custo)' },
  ],
  [Specialization.PUBLIC_RELATIONS]: [
    { attribute: 'moraleBonus', value: 5, description: '+5 Moral por boa imprensa' },
  ],
  [Specialization.RACE_STRATEGY]: [
    { attribute: 'pitRepairTimePenalty', value: -20, description: '-20% Tempo de decisão em Safety Car' },
    { attribute: 'moraleBonus', value: 10, description: '+10 Moral por chamadas táticas acertadas' },
  ],

  // Pit / Mechanical
  [Specialization.PIT_STOP_MASTER]: [
    { attribute: 'pitStopTimePenalty', value: -0.3, description: '-0.3s no tempo de pit stop' },
    { attribute: 'pitRepairTimePenalty', value: 20, description: '+20% tempo de conserto se o carro bater' },
  ],
  [Specialization.MOUNTING_ENGINEER]: [
    { attribute: 'breakChanceReduction', value: 10, description: '+10% Confiabilidade geral' },
    { attribute: 'pitStopTimePenalty', value: 0.2, description: '+0.2s tempo de pit stop' },
  ],
  [Specialization.DIAGNOSTICS]: [
    { attribute: 'pitRepairTimePenalty', value: -25, description: '-25% Tempo de diagnóstico e conserto' },
    { attribute: 'breakChanceReduction', value: 5, description: '+5% Detecção precoce de falhas' },
  ],
  [Specialization.BRAKE_THERMAL]: [
    { attribute: 'pitStopTimePenalty', value: -0.1, description: 'Janela térmica ideal nas relargadas' },
    { attribute: 'breakChanceReduction', value: 12, description: '-20% Degradação de pneus por flat spots' },
  ],
};

export default StaffMember;
