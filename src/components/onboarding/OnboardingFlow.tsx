import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { F1Logo, F1TabBucket } from '../brand/F1Logo';
import { F1HelpTooltip } from '../common/F1HelpTooltip';
import { HEADQUARTERS_OPTIONS, HQOption } from '../../data/headquartersData';
import { PRINCIPAL_BACKGROUNDS, PrincipalBackgroundOption } from '../../data/principalBackgroundsData';
import { evaluateSynergy, type SynergyAnalysis } from '../../data/synergyMatrix';
import { REAL_TEAMS_DOSSIERS, type RealTeamDossier } from '../../data/realTeamsDossier';
import {
  CareerPath,
  UserRole,
  EngineOrigin,
  CarPhilosophy,
  FuelPartnerId,
  Team,
  Driver,
  StaffMember,
  OnboardingResult,
  PrincipalBackgroundId,
  ProjectAmbitionId
} from '../../types/f1';
import type { VehicleEngineeringParameters } from '../../types/physics';
import { DEFAULT_VEHICLE_PARAMS, solveVehiclePhysics } from '../../engine/physicsEngine';
import { evaluatePitAndGarageOperations } from '../../engine/simulationEngine';
import { FIA_2026_DEFAULT_EDITION, buildPackagingArchitecture } from '../../engine/modules/m03Packaging';
import { evaluatePowerUnit } from '../../engine/modules/m08PowerUnit';
import { runRaceSimulation } from '../../engine/modules/m11RaceSimulation';
import type { VehiclePhilosophyCode } from '../../engine/modules/m02Philosophy';
import { normalizeToM02Philosophy, getPhilosophyBaselinePatch } from './onboardingPresets';
import { OnboardingM08PowerUnitWorkbench } from './OnboardingM08PowerUnitWorkbench';
import {
  ICE_METALLURGY_2026,
  getSupplierDnaSpec,
  resolveIceMetallurgyId,
} from '../../data/puMaterials2026';
import { OnboardingM02PhilosophySelector } from './OnboardingM02PhilosophySelector';
import { OnboardingCarConceptionLab, type ConceptionSubStep } from './OnboardingCarConceptionLab';
import { CarLaunchModal } from './CarLaunchModal';
import { getDefaultChassisSuggestions } from '../../engine/chassisLaunchAndSeasonLoop';
import { Step3OrganizationAndStaff } from './Step3OrganizationAndStaff';
import {
  DriverMarketCard,
  DriverProfileModal,
  StaffMarketCard,
  StaffProfileModal,
  type DriverInterestState
} from './Step5MarketCards';
import {
  PROJECT_AMBITION_OPTIONS,
  calculateStaffInterest,
  evaluateCascadingRdImpact,
  evaluateCombinedLeadershipDna,
  evaluatePuFitWithPhilosophy,
  evaluateStaffPhilosophyConflict,
  getDriverMarketAnalysis,
  getDriverTeamName,
  getPuRecommendationForCarPhilosophy,
  getRecommendedDriverTraitsForPhilosophy,
  getStaffFullProfile,
  type DriverMarketAnalysis
} from '../../utils/profileSheets';
import {
  computeNormalizedOfficialPuCard,
  evaluateBoardroomPuVerdict,
} from '../../utils/puBenchHelpers';
import {
  Shield,
  Award,
  Crown,
  Briefcase,
  Cpu,
  Flame,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Zap,
  Wind,
  Layers,
  Flag,
  Calendar,
  Building2,
  DollarSign,
  Activity,
  UserCheck,
  FileText,
  Sliders,
  Gauge,
  Wrench,
  AlertOctagon,
  RotateCcw,
  X,
  Lock,
  Unlock,
  Search,
  Check,
  Users,
  UserPlus,
  Filter,
  ShieldAlert,
  LogOut,
  Trophy,
  Megaphone,
  Sparkles,
  Compass,
  Target
} from 'lucide-react';
import {
  F1_DRIVERS_REAL,
  F2_DRIVERS_REAL,
  F3_DRIVERS_REAL,
  FREE_AGENT_DRIVERS,
  ALL_MARKET_DRIVERS,
  AERO_STAFF_MEMBERS,
  PU_STAFF_MEMBERS,
  SPORTING_STAFF_MEMBERS,
  CHIEF_MECHANIC_STAFF_MEMBERS,
  RACE_ENGINEER_MEMBERS,
  ALL_STAFF_MEMBERS
} from '../../data/marketData';

export type CustomerEngineSupplier = 'Mercedes' | 'Ferrari' | 'Red Bull-Ford' | 'Honda' | 'Audi';

export interface CustomerEngineData {
  id: CustomerEngineSupplier;
  fullName: string;
  power: number;
  reliability: number;
  weight: number;
  fuelEfficiency: number;
  ersManagement: number;
  pros: string;
  cons: string;
  badge: string;
  costText: string;
}

export const CUSTOMER_ENGINES: Record<CustomerEngineSupplier, CustomerEngineData> = {
  Mercedes: {
    id: 'Mercedes',
    fullName: 'Mercedes-AMG F1 M17 E-Performance 2026',
    power: 85,
    reliability: 90,
    weight: 80,
    fuelEfficiency: 95,
    ersManagement: 95,
    pros: 'Gestão de energia de referência e eficiência híbrida superior.',
    cons: 'Reatividade mais baixa em baixa velocidade e largadas menos performáticas.',
    badge: 'GESTÃO & EFICIÊNCIA HÍBRIDA',
    costText: '$15M / temporada'
  },
  Ferrari: {
    id: 'Ferrari',
    fullName: 'Ferrari 067/3 Superfast 2026',
    power: 88,
    reliability: 85,
    weight: 75,
    fuelEfficiency: 80,
    ersManagement: 78,
    pros: 'Reatividade e largadas excepcionais (turbo pequeno).',
    cons: 'Déficit de potência em alta velocidade e gestão de energia limitada.',
    badge: 'REATIVIDADE & LARGADAS',
    costText: '$15M / temporada'
  },
  'Red Bull-Ford': {
    id: 'Red Bull-Ford',
    fullName: 'Red Bull Ford Powertrains DM-01 2026',
    power: 90,
    reliability: 75,
    weight: 85,
    fuelEfficiency: 85,
    ersManagement: 82,
    pros: 'Melhor motor a combustão (ICE) do grid (Benchmark FIA).',
    cons: 'Ligeiro déficit de potência e falta de experiência.',
    badge: 'BENCHMARK ICE (FIA)',
    costText: '$15M / temporada'
  },
  Honda: {
    id: 'Honda',
    fullName: 'Honda HRC RA626H 2026',
    power: 75,
    reliability: 65,
    weight: 90,
    fuelEfficiency: 80,
    ersManagement: 78,
    pros: 'Arquitetura coerente e empacotamento ultra-compacto.',
    cons: 'Problemas de vibração e integração complexa com o chassi.',
    badge: 'EMPACOTAMENTO ULTRA-COMPACTO',
    costText: '$14M / temporada'
  },
  Audi: {
    id: 'Audi',
    fullName: 'Audi Revolution F1 Power Unit 2026',
    power: 75,
    reliability: 60,
    weight: 80,
    fuelEfficiency: 75,
    ersManagement: 70,
    pros: 'Potencial de potência com turbo volumoso e conceito de longo prazo.',
    cons: 'Largadas ruins, alta inércia do turbo e dependência elétrica.',
    badge: 'POTENCIAL TURBO VOLUMOSO',
    costText: '$15M / temporada'
  }
};

export interface EmergencyEngineData {
  supplier: CustomerEngineSupplier;
  name: string;
  tag: string;
  pwr: number;
  rel: number;
  penaltySummary: string;
  penaltyDetail: string;
  penaltyStat: string;
  accentColor: string;
}

export const EMERGENCY_ENGINE_OPTIONS: Record<CustomerEngineSupplier, EmergencyEngineData> = {
  Mercedes: {
    supplier: 'Mercedes',
    name: 'Mercedes-AMG M17 Spec-E',
    tag: 'PACOTE PESADO',
    pwr: 85,
    rel: 92,
    penaltySummary: '-3 Arrasto (DRG)',
    penaltyDetail: 'Pacote pesado. Você perde -3 de eficiência de arrasto (DRG), pois precisará abrir mais os sidepods para refrigerar.',
    penaltyStat: '-3 DRG (Sidepods)',
    accentColor: '#00D2BE'
  },
  Ferrari: {
    supplier: 'Ferrari',
    name: 'Ferrari 067/3 Superfast',
    tag: 'MOTOR MUITO QUENTE',
    pwr: 88,
    rel: 85,
    penaltySummary: '-5 Downforce (DFm)',
    penaltyDetail: 'Motor muito quente. Você perde -5 de Downforce (DFm) no assoalho, pois a traseira precisa ser redesenhada para dissipar calor.',
    penaltyStat: '-5 DFm (Assoalho)',
    accentColor: '#E8002D'
  },
  Honda: {
    supplier: 'Honda',
    name: 'Honda HRC RA626H',
    tag: 'VIBRAÇÃO EXCESSIVA',
    pwr: 75,
    rel: 65,
    penaltySummary: '20% Quebra Câmbio (R1)',
    penaltyDetail: 'Motor vibra muito. Modificador de risco: 20% de chance de quebra do câmbio na primeira corrida se não for reforçado.',
    penaltyStat: '20% Risco Câmbio (R1)',
    accentColor: '#F59E0B'
  },
  'Red Bull-Ford': {
    supplier: 'Red Bull-Ford',
    name: 'Red Bull Ford DM-01',
    tag: 'ERS INSTÁVEL',
    pwr: 90,
    rel: 75,
    penaltySummary: '+0,3s/v Clipping (3 GPs)',
    penaltyDetail: 'ERS instável. A bateria entra em clipping severo, perdendo 0,3s por volta nas primeiras 3 corridas.',
    penaltyStat: '+0,3s/v Clipping (3 GPs)',
    accentColor: '#3B82F6'
  },
  Audi: {
    supplier: 'Audi',
    name: 'Audi Revolution F1',
    tag: 'BLOCO LARGO & VOLUMOSO',
    pwr: 75,
    rel: 60,
    penaltySummary: '-5 Peso (WGT)',
    penaltyDetail: 'Motor largo e inexperiente. Perde -5 de Peso (WGT), precisando de reforços estruturais no chassi.',
    penaltyStat: '-5 WGT (Chassi)',
    accentColor: '#EF4444'
  }
};

export interface ThirdPartyErsOption {
  supplier: CustomerEngineSupplier;
  fullName: string;
  costUsd: number;
  costText: string;
  delayWeeks: number;
  weightKg: number;
  weightDeltaKg: number;
  coolingLabel: string;
  coolingScore: number;
  reliabilityScore: number;
  pwrDelta: number;
  deratingRiskDeltaPct: number;
  dynoFailureMultiplier: number;
  locksBatteryHardware: boolean;
  requiresLargerSidepods: boolean;
  harmonyPenaltyPct: number;
  hardwareNote: string;
  softwareDeployLabel: string;
  softwareControlNote: string;
  aeroDemandLevel: string;
  aeroImpactText: string;
  tradeoffTitle: string;
  tradeoffSummary: string;
  accentColor: string;
}

export const THIRD_PARTY_ERS_OPTIONS: Record<CustomerEngineSupplier, ThirdPartyErsOption> = {
  Mercedes: {
    supplier: 'Mercedes',
    fullName: 'Mercedes-AMG HPP ERS 2026',
    costUsd: 8_000_000,
    costText: '+$8.0M',
    delayWeeks: 1,
    weightKg: 26,
    weightDeltaKg: 0,
    coolingLabel: 'Alta Eficiência Térmica (92/100)',
    coolingScore: 92,
    reliabilityScore: 92,
    pwrDelta: 0,
    deratingRiskDeltaPct: 0,
    dynoFailureMultiplier: 1,
    locksBatteryHardware: true,
    requiresLargerSidepods: false,
    harmonyPenaltyPct: 0,
    hardwareNote: 'Pack selado Brixworth: trava os sliders 9 e 10 (Química e Arquitetura da Bateria).',
    softwareDeployLabel: 'Alta Eficiência Térmica (92/100)',
    softwareControlNote: 'Firmware focado em durabilidade e Anti-Clipping 100% (sliders 7 e 8 liberados; trava apenas no hardware da bateria).',
    aeroDemandLevel: 'Demanda Térmica: Baixa',
    aeroImpactText: 'Nenhum impacto nos Sidepods. O sistema de refrigeração da Mercedes não exige alargamento da carenagem.',
    tradeoffTitle: 'Pack Selado Brixworth · Foco em Durabilidade',
    tradeoffSummary: 'Hardware da bateria selado (trava sliders 9 e 10). Software liberado com Anti-Clipping 100% e sem impacto nos Sidepods.',
    accentColor: '#00D2BE'
  },
  Ferrari: {
    supplier: 'Ferrari',
    fullName: 'Ferrari 067/3 Hybrid ERS',
    costUsd: 7_000_000,
    costText: '+$7.0M',
    delayWeeks: 2,
    weightKg: 24,
    weightDeltaKg: -2,
    coolingLabel: 'Demanda Térmica Alta · Sidepods Maiores (52/100)',
    coolingScore: 52,
    reliabilityScore: 84,
    pwrDelta: 0,
    deratingRiskDeltaPct: 8,
    dynoFailureMultiplier: 1,
    locksBatteryHardware: false,
    requiresLargerSidepods: true,
    harmonyPenaltyPct: 0,
    hardwareNote: 'Células de alta descarga (-2 kg vs. base), operando com menor margem térmica interna.',
    softwareDeployLabel: 'Deploy Agressivo (52/100)',
    softwareControlNote: 'Sliders 7 a 10 livres. Calibração agressiva eleva risco de corte térmico (+8% derating) sem arrefecimento extra.',
    aeroDemandLevel: 'Demanda Térmica: Alta',
    aeroImpactText: 'O sistema de bateria gera muito calor e exigirá refrigeração extra (Sidepods maiores no P&D, com penalidade de arrasto).',
    tradeoffTitle: 'Células Leves (-2kg) · Exige Sidepods Maiores',
    tradeoffSummary: 'Ganha 2 kg no conjunto elétrico, mas exige aumentar a admissão dos Sidepods no P&D (penalidade de arrasto).',
    accentColor: '#E8002D'
  },
  Honda: {
    supplier: 'Honda',
    fullName: 'Honda HRC Compact ERS',
    costUsd: 7_500_000,
    costText: '+$7.5M',
    delayWeeks: 1,
    weightKg: 21,
    weightDeltaKg: -5,
    coolingLabel: 'Compacta / Alta Vibração (76/100)',
    coolingScore: 76,
    reliabilityScore: 72,
    pwrDelta: 0,
    deratingRiskDeltaPct: 5,
    dynoFailureMultiplier: 1,
    locksBatteryHardware: false,
    requiresLargerSidepods: false,
    harmonyPenaltyPct: 10,
    hardwareNote: 'Pack ultraleve (-5 kg vs. base), porém com vibração mecânica de alta frequência.',
    softwareDeployLabel: 'Recuperação Compacta (76/100)',
    softwareControlNote: 'Sliders 7 a 10 livres. Exige acerto fino de recuperação para conter cortes de energia (+5% derating).',
    aeroDemandLevel: 'Demanda Térmica: Moderada',
    aeroImpactText: 'Conjunto compacto que dispensa Sidepods maiores, mas pede dutos limpos para dissipar calor sob vibração.',
    tradeoffTitle: 'Ultra-Leve (-5kg) · Vibração no Acoplamento',
    tradeoffSummary: 'Reduz o peso em -5 kg, porém a vibração do conjunto penaliza o acoplamento e o desempenho final do motor.',
    accentColor: '#F59E0B'
  },
  'Red Bull-Ford': {
    supplier: 'Red Bull-Ford',
    fullName: 'Red Bull Ford DM-01 High-Output ERS',
    costUsd: 8_500_000,
    costText: '+$8.5M',
    delayWeeks: 1,
    weightKg: 27,
    weightDeltaKg: 1,
    coolingLabel: 'Moderada / Alta Descarga (68/100)',
    coolingScore: 68,
    reliabilityScore: 74,
    pwrDelta: 5,
    deratingRiskDeltaPct: 25,
    dynoFailureMultiplier: 1,
    locksBatteryHardware: false,
    requiresLargerSidepods: false,
    harmonyPenaltyPct: 0,
    hardwareNote: 'Inversor e células de alto pico (+1 kg vs. base; +5 PWR direto na entrega elétrica).',
    softwareDeployLabel: 'Descarga Máxima · +5 PWR (68/100)',
    softwareControlNote: 'Sliders 7 a 10 livres. Prioriza potência máxima nas retas, mas eleva risco de Derating (+25%).',
    aeroDemandLevel: 'Demanda Térmica: Elevada',
    aeroImpactText: 'Não obriga Sidepods largos, mas picos de descarga no MGU-K exigem atenção às saídas de ar quente.',
    tradeoffTitle: '+5 PWR Elétrico · Risco de Derating Elevado',
    tradeoffSummary: 'Entrega ganho direto de +5 PWR combinado, porém eleva o risco de Derating (corte térmico de potência).',
    accentColor: '#3B82F6'
  },
  Audi: {
    supplier: 'Audi',
    fullName: 'Audi Revolution Solid-State ERS',
    costUsd: 6_000_000,
    costText: '+$6.0M',
    delayWeeks: 3,
    weightKg: 29,
    weightDeltaKg: 3,
    coolingLabel: 'Pesada / Protótipo Experimental (60/100)',
    coolingScore: 60,
    reliabilityScore: 60,
    pwrDelta: 0,
    deratingRiskDeltaPct: 12,
    dynoFailureMultiplier: 2,
    locksBatteryHardware: false,
    requiresLargerSidepods: false,
    harmonyPenaltyPct: 0,
    hardwareNote: 'Protótipo Solid-State experimental (+3 kg; chance de falha no dinamômetro 2× maior).',
    softwareDeployLabel: 'Firmware Experimental (60/100)',
    softwareControlNote: 'Sliders 7 a 10 livres. Mapeamento preliminar de estreante com risco elevado de corte térmico (+12% derating).',
    aeroDemandLevel: 'Demanda Térmica: Alta (Protótipo)',
    aeroImpactText: 'Arquitetura larga e pesada exige adaptações no empacotamento traseiro e dutos de arrefecimento maiores.',
    tradeoffTitle: 'Menor Custo ($6M) · 2× Risco no Dinamômetro',
    tradeoffSummary: 'Mais barato ($6.0M), porém exige +3 semanas de integração no chassi e dobra a chance de falha no dinamômetro.',
    accentColor: '#EF4444'
  }
};

export interface TechnicalDossierData {
  ice: {
    architecture: string;
    blockWeightKg: number;
    pistonMaterial: string;
    thermalPowerHp: number;
    torqueNm: number;
    thermalEfficiency: number;
    operatingTempC: number;
    turboLagMs: number;
  };
  ers: {
    batteryWeightKg: number;
    cellType: string;
    mgukPowerKw: number;
    recoveryCapacity: number;
    clippingRisk: number;
    coolingDemand: number;
  };
  integration: {
    thermalSync: number;
    dissipationText: string;
    lagCompensationText: string;
  };
  chassisAlert: string;
}

export const PU_DOSSIER_DATA: Record<CustomerEngineSupplier, TechnicalDossierData> = {
  Mercedes: {
    ice: {
      architecture: 'V6 90°',
      blockWeightKg: 145,
      pistonMaterial: 'Aço 15CDV6 (Art. C15.7.1)',
      thermalPowerHp: 540,
      torqueNm: 480,
      thermalEfficiency: 90,
      operatingTempC: 105,
      turboLagMs: 35
    },
    ers: {
      batteryWeightKg: 41,
      cellType: 'Cátodo NCA Alta Densidade',
      mgukPowerKw: 350,
      recoveryCapacity: 95,
      clippingRisk: 0,
      coolingDemand: 95
    },
    integration: {
      thermalSync: 95,
      dissipationText: 'O sistema de refrigeração dissipa com folga o calor combinado do ICE e do conjunto elétrico NCA.',
      lagCompensationText: 'O torque instantâneo do ERS preenche o lag de 35 ms de forma linear nas saídas de curva.'
    },
    chassisAlert: 'Atenção: Este motor exige muito fluxo de ar. Você precisará desenhar sidepods maiores.'
  },
  Ferrari: {
    ice: {
      architecture: 'V6 90°',
      blockWeightKg: 148,
      pistonMaterial: 'Aço X38CrMoV5-3 + Cabeçote Aço',
      thermalPowerHp: 530,
      torqueNm: 485,
      thermalEfficiency: 86,
      operatingTempC: 114,
      turboLagMs: 20
    },
    ers: {
      batteryWeightKg: 41,
      cellType: 'Células NCA 4.4 MJ',
      mgukPowerKw: 350,
      recoveryCapacity: 82,
      clippingRisk: 15,
      coolingDemand: 68
    },
    integration: {
      thermalSync: 85,
      dissipationText: 'Cabeçote de aço opera >110°C permitindo radiadores e sidepods menores para ganho aerodinâmico.',
      lagCompensationText: 'Turbo pequeno de rápida resposta reduz o tempo de enchimento para 20ms com assistência elétrica agressiva.'
    },
    chassisAlert: 'Filosofia Ferrari: cabeçote de aço (+8 kg) permite sidepods compactos e menor arrasto de refrigeração.'
  },
  'Red Bull-Ford': {
    ice: {
      architecture: 'V6 90°',
      blockWeightKg: 142,
      pistonMaterial: 'Aço 42CrMo4 (Bloco Al-Si)',
      thermalPowerHp: 560,
      torqueNm: 510,
      thermalEfficiency: 80,
      operatingTempC: 100,
      turboLagMs: 50
    },
    ers: {
      batteryWeightKg: 35,
      cellType: 'Íon-Lítio + Ânodo Si-C',
      mgukPowerKw: 350,
      recoveryCapacity: 75,
      clippingRisk: 25,
      coolingDemand: 75
    },
    integration: {
      thermalSync: 75,
      dissipationText: 'Operação equilibrada a 100°C, mas o empacotamento integrado exige isolamento térmico reforçado.',
      lagCompensationText: 'O lag de 50ms exige que o MGU-K compense entregando torque imediato nas saídas de curva lenta.'
    },
    chassisAlert: 'Benchmark ICE (DM-01): exige refrigeração agressiva no bloco Al-Si e controle rigoroso contra clipping do ERS.'
  },
  Honda: {
    ice: {
      architecture: 'V6 90°',
      blockWeightKg: 135,
      pistonMaterial: 'Aço AMS 6487 (Art. C15.7.1)',
      thermalPowerHp: 525,
      torqueNm: 465,
      thermalEfficiency: 85,
      operatingTempC: 108,
      turboLagMs: 15
    },
    ers: {
      batteryWeightKg: 35,
      cellType: 'Lítio Leve Compacto',
      mgukPowerKw: 350,
      recoveryCapacity: 85,
      clippingRisk: 10,
      coolingDemand: 85
    },
    integration: {
      thermalSync: 80,
      dissipationText: 'Excelente dissipação compacta, porém com sensibilidade a vibrações harmônicas de alta frequência.',
      lagCompensationText: 'Resposta extraordinária de 15ms quase sem lag, com assistência elétrica imediata.'
    },
    chassisAlert: 'Atenção: Este motor vibra muito. O design do câmbio precisará de reforço estrutural.'
  },
  Audi: {
    ice: {
      architecture: 'V6 120°',
      blockWeightKg: 145,
      pistonMaterial: 'Aço AMS 6487 (Art. C15.7.1)',
      thermalPowerHp: 530,
      torqueNm: 475,
      thermalEfficiency: 95,
      operatingTempC: 106,
      turboLagMs: 45
    },
    ers: {
      batteryWeightKg: 30,
      cellType: 'Alta Capacidade',
      mgukPowerKw: 350,
      recoveryCapacity: 70,
      clippingRisk: 30,
      coolingDemand: 70
    },
    integration: {
      thermalSync: 70,
      dissipationText: 'Ângulo aberto de 120° reduz a altura mas exige canais de ar mais longos nas laterais.',
      lagCompensationText: 'Turbo volumoso com 45ms de lag requer pré-carregamento contínuo de energia elétrica do MGU-K.'
    },
    chassisAlert: 'Atenção: Este motor exige um chassi mais largo e pesado. Você terá que compensar no design aerodinâmico.'
  }
};

export type EngineFactoryId = 'cosworth' | 'porsche' | 'renault' | 'bmw' | 'toyota';

export interface EngineFactoryData {
  id: EngineFactoryId;
  name: string;
  fullName: string;
  location: string;
  costM: number;
  integrationWeeks: number;
  statusTag: string;
  pwr: number;
  rel: number;
  nif: number;
  pros: string;
  cons: string;
  logisticWarning: string;
  engineerDiagnosis: string;
}

export const AVAILABLE_FACTORIES: Record<EngineFactoryId, EngineFactoryData> = {
  cosworth: {
    id: 'cosworth',
    name: 'Cosworth',
    fullName: 'COSWORTH POWERTRAINS (NORTHAMPTON)',
    location: 'Northampton, Reino Unido',
    costM: 25,
    integrationWeeks: 6,
    statusTag: 'DNA CLÁSSICO E LEVE',
    pwr: 75,
    rel: 74,
    nif: 3.5,
    pros: 'Pacote compacto e leve, abrindo espaço traseiro para assoalho e difusor eficientes.',
    cons: 'Não possui ERS próprio (exige compra de terceiros, custo extra).',
    logisticWarning: 'Sede no Motorsport Valley (UK). Logística rápida de peças e fornecedores locais, minimizando atrito aduaneiro.',
    engineerDiagnosis: 'O bloco é compacto e utiliza pistões de liga de ferro FIA (AMS 6487), que exigem pré-aquecimento rigoroso a 90°C. Como não temos ERS próprio, dependemos da integração elétrica de terceiros.'
  },
  porsche: {
    id: 'porsche',
    name: 'Porsche',
    fullName: 'PORSCHE WEISSACH POWERTRAINS',
    location: 'Weissach, Alemanha',
    costM: 30,
    integrationWeeks: 12,
    statusTag: 'PROJETO ABANDONADO',
    pwr: 90,
    rel: 68,
    nif: 4.0,
    pros: 'Hardware elétrico de elite. Potencial de eficiência energética monstruoso.',
    cons: 'Software inacabado. Motor vai quebrar e ferver (Alto risco).',
    logisticWarning: 'Fábrica na Alemanha. +2 semanas de atraso na integração com o Brasil e desalfandegamento de componentes de alta voltagem.',
    engineerDiagnosis: 'A base elétrica é excelente, mas o software está inacabado. O motor vai ferver nas retas se não ampliarmos o arrefecimento.'
  },
  renault: {
    id: 'renault',
    name: 'Renault',
    fullName: 'RENAULT VIRY-CHÂTILLON HERITAGE',
    location: 'Viry-Châtillon, França',
    costM: 35,
    integrationWeeks: 8,
    statusTag: 'SUAVIDADE FRANCESA',
    pwr: 80,
    rel: 75,
    nif: 4.0,
    pros: 'Bloco térmico ultra suave e linear. Perfeito para não gastar pneus.',
    cons: 'Sistema ERS pesado e ineficiente.',
    logisticWarning: 'Instalação em transição na França. Burocracia sindical e logística europeia (+1 semana de integração).',
    engineerDiagnosis: 'Instalações completas em Viry-Châtillon, porém o turbo tem resposta lenta em baixa rotação e o conjunto elétrico exige sidepods mais largos.'
  },
  bmw: {
    id: 'bmw',
    name: 'BMW',
    fullName: 'BMW MOTORSPORT POWERTRAINS',
    location: 'Munique, Alemanha',
    costM: 38,
    integrationWeeks: 8,
    statusTag: 'POTÊNCIA BRUTA',
    pwr: 95,
    rel: 76,
    nif: 4.5,
    pros: 'O motor mais potente do mercado. Excelente para retas.',
    cons: 'Vibração extrema. Vai rachar o chassi e câmbio se não for reforçado.',
    logisticWarning: 'Bancada e fundição em Munique. Alta rigidez estrutural exigida na remessa de blocos brutos.',
    engineerDiagnosis: 'Excelente virabrequim e bloco de altíssima rigidez, mas o ERS foi projetado para endurance e exigirá recalibração de software e reforço estrutural no câmbio.'
  },
  toyota: {
    id: 'toyota',
    name: 'Toyota',
    fullName: 'TOYOTA GAZOO POWERTRAINS EUROPE',
    location: 'Colônia, Alemanha',
    costM: 40,
    integrationWeeks: 10,
    statusTag: 'EFICIÊNCIA E DURABILIDADE',
    pwr: 70,
    rel: 82,
    nif: 5.0,
    pros: 'Confiabilidade mecânica impecável. O carro sempre termina.',
    cons: 'ERS defasado e potência de pico baixa. Ficará para trás nas retas.',
    logisticWarning: 'Infraestrutura de ponta da Toyota Gazoo Racing em Colônia. Túnel de vento de referência e logística confiável.',
    engineerDiagnosis: 'Maturidade operacional e dinamômetros de padrão mundial em Colônia, contudo o peso total do conjunto híbrido excede o limite ideal em 8 kg.'
  }
};

export const FACTORY_DOSSIER_DATA: Record<EngineFactoryId, TechnicalDossierData> = {
  cosworth: {
    ice: {
      architecture: 'V6 90°',
      blockWeightKg: 139,
      pistonMaterial: 'Aço AMS 6487 (Art. C15.7.1)',
      thermalPowerHp: 530,
      torqueNm: 465,
      thermalEfficiency: 84,
      operatingTempC: 102,
      turboLagMs: 40
    },
    ers: {
      batteryWeightKg: 35,
      cellType: 'Íon-Lítio (Terceiros)',
      mgukPowerKw: 350,
      recoveryCapacity: 75,
      clippingRisk: 25,
      coolingDemand: 75
    },
    integration: {
      thermalSync: 80,
      dissipationText: 'O sistema de refrigeração dá conta do bloco ICE, mas o ERS terceirizado exige radiadores auxiliares e cablagem extra.',
      lagCompensationText: 'Curva de turbo com 40 ms de lag exige calibração antecipada de torque no MGU-K para evitar perda na saída de curva.'
    },
    chassisAlert: 'Impacto Técnico (Aero & Chassi — GDD Seção 20/21): A ausência de um ERS nativo exige tubulações externas para refrigerar o MGU-K, alargando os sidepods (+4% de Arrasto / -2 km/h na reta), embora libere volume traseiro para um difusor mais agressivo.'
  },
  porsche: {
    ice: {
      architecture: 'V6 90°',
      blockWeightKg: 146,
      pistonMaterial: 'Aço X38CrMoV5-3 + Cabeçote Aço',
      thermalPowerHp: 560,
      torqueNm: 505,
      thermalEfficiency: 92,
      operatingTempC: 115,
      turboLagMs: 25
    },
    ers: {
      batteryWeightKg: 32,
      cellType: 'Células Densas (Porsche E-Tech)',
      mgukPowerKw: 350,
      recoveryCapacity: 98,
      clippingRisk: 5,
      coolingDemand: 98
    },
    integration: {
      thermalSync: 70,
      dissipationText: 'Hardware de topo abandonado: risco crítico de sobreaquecimento em calor extremo (115°C).',
      lagCompensationText: 'MGU-K monstro compensa o turbo em apenas 25ms, mas aquece as células de lítio rapidamente.'
    },
    chassisAlert: 'Atenção: Risco crítico de sobreaquecimento térmico. Exige radiadores superdimensionados e software customizado de resfriamento.'
  },
  renault: {
    ice: {
      architecture: 'V6 90°',
      blockWeightKg: 144,
      pistonMaterial: 'Alumínio/Aço',
      thermalPowerHp: 535,
      torqueNm: 480,
      thermalEfficiency: 86,
      operatingTempC: 104,
      turboLagMs: 30
    },
    ers: {
      batteryWeightKg: 30,
      cellType: 'Lítio Convencional',
      mgukPowerKw: 350,
      recoveryCapacity: 80,
      clippingRisk: 20,
      coolingDemand: 82
    },
    integration: {
      thermalSync: 88,
      dissipationText: 'Linearidade térmica impecável entre combustão e regeneração elétrica sem picos de estresse.',
      lagCompensationText: 'Entrega suave e progressiva que poupa pneus traseiros na tração de saída de curva.'
    },
    chassisAlert: 'Atenção: Entrega de torque suave poupa os pneus traseiros, mas o peso elevado da bateria exige lastro frontal.'
  },
  bmw: {
    ice: {
      architecture: 'V6 90°',
      blockWeightKg: 150,
      pistonMaterial: 'Aço Forjado M-Power',
      thermalPowerHp: 575,
      torqueNm: 520,
      thermalEfficiency: 88,
      operatingTempC: 108,
      turboLagMs: 35
    },
    ers: {
      batteryWeightKg: 28,
      cellType: 'Células Densas M-Hybrid',
      mgukPowerKw: 350,
      recoveryCapacity: 88,
      clippingRisk: 10,
      coolingDemand: 90
    },
    integration: {
      thermalSync: 85,
      dissipationText: 'Trocas térmicas eficientes, suportando longas retas em potência máxima com estabilidade.',
      lagCompensationText: 'Força bruta instantânea com sobrealimentação agressiva em médias e altas rotações.'
    },
    chassisAlert: 'Atenção: Vibração extrema do bloco exige travessas de reforço no monocoque e carcaça de câmbio ultra-rígida.'
  },
  toyota: {
    ice: {
      architecture: 'V6 90°',
      blockWeightKg: 147,
      pistonMaterial: 'Aço Forjado TGR',
      thermalPowerHp: 525,
      torqueNm: 470,
      thermalEfficiency: 89,
      operatingTempC: 100,
      turboLagMs: 28
    },
    ers: {
      batteryWeightKg: 26,
      cellType: 'Lítio Durável',
      mgukPowerKw: 350,
      recoveryCapacity: 78,
      clippingRisk: 22,
      coolingDemand: 76
    },
    integration: {
      thermalSync: 92,
      dissipationText: 'Ciclo térmico ultra constante (100°C) com tolerância a falhas superior a qualquer outro bloco.',
      lagCompensationText: 'Software conservador prioriza durabilidade mecânica sobre torque de pico instantâneo.'
    },
    chassisAlert: 'Atenção: Alta confiabilidade e temperatura estável (100°C) permitem sidepods mais estreitos e eficientes.'
  }
};

export interface FactorySlidersDna {
  iceEficPot: number;
  iceBloco: number;
  iceTorque: number;
  iceTurbo: number;
  iceCombustivel: number;
  iceVirabrequim: number;
  ersSoftware: number;
  ersAntiClipping: number;
  ersBateria: number;
  ersArquitetura: number;
}

export const DEFAULT_SLIDERS_DNA: FactorySlidersDna = {
  iceEficPot: 50,
  iceBloco: 0,
  iceTorque: 50,
  iceTurbo: 50,
  iceCombustivel: 50,
  iceVirabrequim: 50,
  ersSoftware: 50,
  ersAntiClipping: 0,
  ersBateria: 0,
  ersArquitetura: 50
};

export const FACTORY_DNA_PRESETS: Record<EngineFactoryId, FactorySlidersDna> = {
  porsche: {
    iceEficPot: 75,
    iceBloco: 100,
    iceTorque: 50,
    iceTurbo: 20,
    iceCombustivel: 30,
    iceVirabrequim: 60,
    ersSoftware: 80,
    ersAntiClipping: 0,
    ersBateria: 0,
    ersArquitetura: 80
  },
  renault: {
    iceEficPot: 50,
    iceBloco: 0,
    iceTorque: 20,
    iceTurbo: 50,
    iceCombustivel: 50,
    iceVirabrequim: 30,
    ersSoftware: 20,
    ersAntiClipping: 0,
    ersBateria: 100,
    ersArquitetura: 20
  },
  bmw: {
    iceEficPot: 20,
    iceBloco: 100,
    iceTorque: 80,
    iceTurbo: 80,
    iceCombustivel: 80,
    iceVirabrequim: 80,
    ersSoftware: 80,
    ersAntiClipping: 0,
    ersBateria: 0,
    ersArquitetura: 80
  },
  toyota: {
    iceEficPot: 60,
    iceBloco: 0,
    iceTorque: 40,
    iceTurbo: 50,
    iceCombustivel: 40,
    iceVirabrequim: 20,
    ersSoftware: 10,
    ersAntiClipping: 0,
    ersBateria: 100,
    ersArquitetura: 30
  },
  cosworth: {
    iceEficPot: 50,
    iceBloco: 0,
    iceTorque: 50,
    iceTurbo: 50,
    iceCombustivel: 50,
    iceVirabrequim: 50,
    ersSoftware: 50,
    ersAntiClipping: 0,
    ersBateria: 0,
    ersArquitetura: 50
  }
};

export interface FixedEngineArchitecture {
  supplierOrFactory: string;
  blockAngle: string;
  pistonStroke: string;
  turboLayout: string;
  batteryTech: string;
  injectionType: string;
  badge: string;
}

export const CUSTOMER_FIXED_ARCH: Record<CustomerEngineSupplier, FixedEngineArchitecture> = {
  Mercedes: {
    supplierOrFactory: 'Mercedes-AMG High Performance Powertrains',
    blockAngle: 'V6 90°',
    pistonStroke: 'Curso Longo (Foco em Torque)',
    turboLayout: 'Turbo Standard',
    batteryTech: 'Bateria Lítio Padrão',
    injectionType: 'Injeção Direta',
    badge: 'HOMOLOGAÇÃO MERCEDES HPP'
  },
  Ferrari: {
    supplierOrFactory: 'Scuderia Ferrari Powertrains',
    blockAngle: 'V6 90°',
    pistonStroke: 'Curso Curto (Foco em Giro)',
    turboLayout: 'Turbo Pequeno (Fora do V)',
    batteryTech: 'Bateria Lítio Leve',
    injectionType: 'Injeção Direta',
    badge: 'HOMOLOGAÇÃO SCUDERIA FERRARI'
  },
  Honda: {
    supplierOrFactory: 'Honda Racing Corporation (HRC)',
    blockAngle: 'V6 90°',
    pistonStroke: 'Curso Curto',
    turboLayout: 'Turbo Hot-V (Dentro do V)',
    batteryTech: 'Bateria Densas',
    injectionType: 'Injeção Dupla',
    badge: 'HOMOLOGAÇÃO HONDA HRC'
  },
  'Red Bull-Ford': {
    supplierOrFactory: 'Red Bull Ford Powertrains',
    blockAngle: 'V6 90°',
    pistonStroke: 'Curso Longo',
    turboLayout: 'Turbo Standard',
    batteryTech: 'Bateria Lítio',
    injectionType: 'Injeção Direta',
    badge: 'HOMOLOGAÇÃO RBPT-FORD'
  },
  Audi: {
    supplierOrFactory: 'Audi Formula Racing Technology',
    blockAngle: 'V6 120° (Largo)',
    pistonStroke: 'Curso Longo',
    turboLayout: 'Turbo Grande Standard',
    batteryTech: 'Bateria Estado Sólido',
    injectionType: 'Injeção Dupla',
    badge: 'HOMOLOGAÇÃO AUDI REVOLUTION'
  }
};

export const FACTORY_FIXED_ARCH: Record<EngineFactoryId, FixedEngineArchitecture> = {
  porsche: {
    supplierOrFactory: 'Porsche Weissach Powertrains',
    blockAngle: 'V6 90°',
    pistonStroke: 'Curso Curto (Foco em Giro)',
    turboLayout: 'Turbo Pequeno Integrado',
    batteryTech: 'Bateria Lítio Alta Tensão',
    injectionType: 'Injeção Direta',
    badge: 'GABARITO WEISSACH DE FÁBRICA'
  },
  cosworth: {
    supplierOrFactory: 'Cosworth Engineering Northampton',
    blockAngle: 'V6 90°',
    pistonStroke: 'Curso Longo (Alta Compressão)',
    turboLayout: 'Turbo Standard Externo',
    batteryTech: 'Sem ERS Próprio (Requer Terceiros)',
    injectionType: 'Injeção Direta Mecânica',
    badge: 'GABARITO COSWORTH DE FÁBRICA'
  },
  renault: {
    supplierOrFactory: 'Renault Sport F1 Viry-Châtillon',
    blockAngle: 'V6 90°',
    pistonStroke: 'Curso Longo (Linearidade)',
    turboLayout: 'Turbo Médio Monoturbo',
    batteryTech: 'Bateria Células Densas (Pesada)',
    injectionType: 'Injeção Direta Convencional',
    badge: 'GABARITO VIRY DE FÁBRICA'
  },
  bmw: {
    supplierOrFactory: 'BMW Motorsport Powertrains',
    blockAngle: 'V6 90°',
    pistonStroke: 'Curso Curto (Giro Rápido)',
    turboLayout: 'Turbo Grande de Fluxo Contínuo',
    batteryTech: 'Bateria Lítio Modular',
    injectionType: 'Injeção Dupla Estratificada',
    badge: 'GABARITO BMW MOTORSPORT'
  },
  toyota: {
    supplierOrFactory: 'Toyota Gazoo Racing Powertrains',
    blockAngle: 'V6 90°',
    pistonStroke: 'Curso Longo (Confiabilidade Robusta)',
    turboLayout: 'Turbo Standard Duplo Estágio',
    batteryTech: 'Bateria Células Densas Duráveis',
    injectionType: 'Injeção Direta Otimizada',
    badge: 'GABARITO GAZOO RACING'
  }
};

export interface BaseEngineArch {
  blockAngle: '90' | '120';
  pistonStroke: 'longo' | 'curto';
  turboLayout: 'pequeno' | 'standard' | 'grande';
  batteryTech: string;
  injectionType: string;
  supplierOrFactory: string;
}

export const getBaseEngineArch = (
  engineChoice: 'customer' | 'bought_factory' | 'phoenix',
  customerSupplier: CustomerEngineSupplier,
  factoryId: EngineFactoryId,
  emergencySupplier: CustomerEngineSupplier | null
): BaseEngineArch => {
  const activeCustomer = emergencySupplier || (engineChoice === 'customer' ? customerSupplier : null);
  if (activeCustomer) {
    switch (activeCustomer) {
      case 'Ferrari':
        return {
          blockAngle: '90',
          pistonStroke: 'curto',
          turboLayout: 'pequeno',
          batteryTech: 'Bateria Lítio Leve',
          injectionType: 'Injeção Direta',
          supplierOrFactory: 'Scuderia Ferrari Powertrains'
        };
      case 'Honda':
        return {
          blockAngle: '90',
          pistonStroke: 'curto',
          turboLayout: 'standard',
          batteryTech: 'Bateria Células Densas',
          injectionType: 'Injeção Dupla',
          supplierOrFactory: 'Honda Racing Corporation (HRC)'
        };
      case 'Audi':
        return {
          blockAngle: '120',
          pistonStroke: 'longo',
          turboLayout: 'grande',
          batteryTech: 'Bateria Estado Sólido',
          injectionType: 'Injeção Dupla',
          supplierOrFactory: 'Audi Formula Racing Technology'
        };
      case 'Red Bull-Ford':
        return {
          blockAngle: '90',
          pistonStroke: 'longo',
          turboLayout: 'standard',
          batteryTech: 'Bateria Lítio Padrão',
          injectionType: 'Injeção Direta',
          supplierOrFactory: 'Red Bull Ford Powertrains'
        };
      case 'Mercedes':
      default:
        return {
          blockAngle: '90',
          pistonStroke: 'longo',
          turboLayout: 'standard',
          batteryTech: 'Bateria Lítio Padrão',
          injectionType: 'Injeção Direta',
          supplierOrFactory: 'Mercedes-AMG High Performance Powertrains'
        };
    }
  }

  if (engineChoice === 'bought_factory') {
    switch (factoryId) {
      case 'porsche':
        return {
          blockAngle: '90',
          pistonStroke: 'curto',
          turboLayout: 'pequeno',
          batteryTech: 'Bateria Lítio Alta Tensão',
          injectionType: 'Injeção Direta',
          supplierOrFactory: 'Porsche Weissach Powertrains'
        };
      case 'cosworth':
        return {
          blockAngle: '90',
          pistonStroke: 'longo',
          turboLayout: 'standard',
          batteryTech: 'Sem ERS Próprio (Requer Terceiros)',
          injectionType: 'Injeção Direta Mecânica',
          supplierOrFactory: 'Cosworth Engineering Northampton'
        };
      case 'renault':
        return {
          blockAngle: '90',
          pistonStroke: 'longo',
          turboLayout: 'standard',
          batteryTech: 'Bateria Células Densas',
          injectionType: 'Injeção Direta Convencional',
          supplierOrFactory: 'Renault Sport F1 Viry-Châtillon'
        };
      case 'bmw':
        return {
          blockAngle: '90',
          pistonStroke: 'curto',
          turboLayout: 'grande',
          batteryTech: 'Bateria Lítio Modular',
          injectionType: 'Injeção Dupla Estratificada',
          supplierOrFactory: 'BMW Motorsport Powertrains'
        };
      case 'toyota':
        return {
          blockAngle: '90',
          pistonStroke: 'longo',
          turboLayout: 'standard',
          batteryTech: 'Bateria Células Densas Duráveis',
          injectionType: 'Injeção Direta Otimizada',
          supplierOrFactory: 'Toyota Gazoo Racing Powertrains'
        };
    }
  }

  // Phoenix (Do Zero)
  return {
    blockAngle: '90',
    pistonStroke: 'longo',
    turboLayout: 'standard',
    batteryTech: 'Bateria Customizada Fênix',
    injectionType: 'Injeção Direta de Alta Pressão',
    supplierOrFactory: 'Apex Protocol Fênix In-House'
  };
};

// ============================================================================
// MERCADO DE PILOTOS: ANÁLISE DE MERCADO & MARKETABILITY (re-exportado de profileSheets)
// ============================================================================
export { getDriverMarketAnalysis, getDriverTeamName, type DriverMarketAnalysis };

interface OnboardingFlowProps {
  onComplete: (data: OnboardingResult) => void;
  onCancel: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onCancel }) => {
  const {
    allTeams,
    drivers,
    staff,
    playerTeam,
    setLanguage,
    language,
    t,
    playRadioSound,
    motorHomologado,
    setMotorHomologado,
    semanasRestantesPreTemporada,
    setSemanasRestantesPreTemporada,
    motorHomologadoFIA,
    setMotorHomologadoFIA,
    homologarMotorFIA,
    financials,
    setFinancials,
    addNotification,
    soundEnabled
  } = useGame();

  // Wizard Step: 1 to 7
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState<boolean>(false);
  const [showFiaFreezeAlertModal, setShowFiaFreezeAlertModal] = useState<boolean>(false);
  const [hardwareBlockedByTime, setHardwareBlockedByTime] = useState<boolean>(false);

  // Step 1: Career Path & Identity
  const [careerPath, setCareerPath] = useState<CareerPath>('custom_team');
  const [selectedRealTeamId, setSelectedRealTeamId] = useState<string>('ferrari');
  const [customTeamName, setCustomTeamName] = useState<string>('Apex Grand Prix Team');
  const [customTeamShort, setCustomTeamShort] = useState<string>('APX');
  const [selectedHqId, setSelectedHqId] = useState<string>('silverstone');
  const selectedHq = HEADQUARTERS_OPTIONS.find(h => h.id === selectedHqId) || HEADQUARTERS_OPTIONS[0];
  const [customColor, setCustomColor] = useState<string>('#E10600');
  const [customSecondaryColor, setCustomSecondaryColor] = useState<string>('#FFFFFF');
  const [principalName, setPrincipalName] = useState<string>('Guilherme');
  const [principalBackground, setPrincipalBackground] = useState<PrincipalBackgroundId>('chief_engineer');


  const [projectAmbition, setProjectAmbition] = useState<ProjectAmbitionId>('balanced');
  const ambitionSpec = PROJECT_AMBITION_OPTIONS[projectAmbition];
  const selectedBackground = PRINCIPAL_BACKGROUNDS.find(b => b.id === principalBackground) || PRINCIPAL_BACKGROUNDS[0];
  const isMagnateBackground = ['financial_magnate', 'financial', 'marketing_shark', 'enthusiast_heir'].includes(principalBackground);
  const backgroundCashBonusUsd = selectedBackground.modifiers.cashBonus ?? (isMagnateBackground ? 25000000 : 0);
  const hqCashNetDeltaUsd = (selectedHq.modifiers.cashBonus || 0) - (selectedHq.modifiers.startingBudgetPenalty || 0);
  const initialBudgetUsd =
    (careerPath === 'real_team' ? 135000000 : ambitionSpec.budgetUsd) +
    backgroundCashBonusUsd +
    hqCashNetDeltaUsd;

  const liveSynergy = evaluateSynergy(selectedHq, selectedBackground);
  const selectedTeamDossier: RealTeamDossier = REAL_TEAMS_DOSSIERS[selectedRealTeamId] || REAL_TEAMS_DOSSIERS['ferrari'];

  // Step 2: FIA Meeting & Board Directive
  const [boardAccepted, setBoardAccepted] = useState<boolean>(true);

  // Step 4: Power Unit Origin + Phoenix Assembly + Technical Dossier
  const [engineChoice, setEngineChoice] = useState<EngineOrigin>('customer');
  const [customerSupplier, setCustomerSupplier] = useState<CustomerEngineSupplier>('Mercedes');
  const [selectedFactoryId, setSelectedFactoryId] = useState<EngineFactoryId>('porsche');
  const [puPhaseStage, setPuPhaseStage] = useState<'select' | 'phoenix_assembly' | 'dossier'>('select');
  const [puIceMaterial, setPuIceMaterial] = useState<'aluminum' | 'titanium'>('aluminum');
  const [puTurboSize, setPuTurboSize] = useState<number>(50); // 0 (quick spool) to 100 (peak HP)
  const [puErsBatteryType, setPuErsBatteryType] = useState<'dense_pack' | 'lightweight_lithium'>('lightweight_lithium');
  const [puSoftwareBias, setPuSoftwareBias] = useState<number>(50); // 0 (harvest) to 100 (deploy)
  const [puInjectionMapping, setPuInjectionMapping] = useState<number>(50); // 0 (Economy: +5 eFuel, -2 PWR) to 100 (Performance: -5 eFuel, +5 PWR)

  // Step 4: Technical Dossier & Assembly Line
  const [recalibrateBench, setRecalibrateBench] = useState<boolean>(false);
  const [gabaritoApproved, setGabaritoApproved] = useState<boolean>(true);

  // Bancada de Montagem (10 Sliders Dinâmicos & Layout Escuro F1)
  const [showBancadaModal, setShowBancadaModal] = useState<boolean>(false);
  const [showDynamoReportModal, setShowDynamoReportModal] = useState<boolean>(false);
  const [showConfirmGoToDynamoModal, setShowConfirmGoToDynamoModal] = useState<boolean>(false);
  const [showFiaHomologationConfirmModal, setShowFiaHomologationConfirmModal] = useState<boolean>(false);
  const [customEngineName, setCustomEngineName] = useState<string>('');

  // Custos Industriais do Motor (Protótipo vs Produção Final)
  const [prototypeCostSpent, setPrototypeCostSpent] = useState<number>(0);
  const [productionCostSpent, setProductionCostSpent] = useState<number>(0);
  const [lastIncurredPrototypeCost, setLastIncurredPrototypeCost] = useState<number>(2000000);
  const [budgetErrorMessage, setBudgetErrorMessage] = useState<string | null>(null);
  const [dynoNotification, setDynoNotification] = useState<string | null>(null);
  const [productionNotification, setProductionNotification] = useState<string | null>(null);

  // Parâmetros Físicos SI do Veículo em Concepção (M01-M12)
  const [vehicleParamsDraft, setVehicleParamsDraft] = useState<VehicleEngineeringParameters>(() => ({
    ...DEFAULT_VEHICLE_PARAMS
  }));
  const [tradeoffsAcknowledged, setTradeoffsAcknowledged] = useState<boolean>(true);

  // Fase 7: Laboratório de P&D de Concepção Integrada M03-M10 (4 Sub-etapas)
  const [chassisSubStep, setChassisSubStep] = useState<ConceptionSubStep>('gearbox');
  const [gearboxMaterial, setGearboxMaterial] = useState<'aluminum' | 'carbon' | 'titanium'>('titanium');
  const [gearboxRatio, setGearboxRatio] = useState<number>(50); // 0 (Aceleração Curta) a 100 (Velocidade Máxima Longa)
  const [gearboxLayout, setGearboxLayout] = useState<'compact' | 'voluminous'>('compact');
  const [gearboxFinalized, setGearboxFinalized] = useState<boolean>(false);
  const [gearboxCostSpent, setGearboxCostSpent] = useState<number>(0);

  // Fase 7 -> Fase 8: Cerimônia de Lançamento Oficial & Nomeação de Chassi
  const [chassisName, setChassisName] = useState<string>('APX-01');
  const [showCarLaunchModal, setShowCarLaunchModal] = useState<boolean>(false);
  const [chassisLaunchConfirmed, setChassisLaunchConfirmed] = useState<boolean>(false);

  const [chassisSidepodConcept, setChassisSidepodConcept] = useState<'conventional' | 'downwash' | 'zeropod'>('downwash');
  const [chassisSuspensionFront, setChassisSuspensionFront] = useState<'pushrod' | 'pullrod'>('pullrod');
  const [chassisSuspensionRear, setChassisSuspensionRear] = useState<'pushrod' | 'pullrod'>('pushrod');
  const [chassisCoolingAperture, setChassisCoolingAperture] = useState<'tight' | 'balanced' | 'open'>('balanced');

  const updateVehicleParamsDraft = React.useCallback((patch: Partial<VehicleEngineeringParameters>) => {
    setVehicleParamsDraft(prev => ({ ...prev, ...patch }));
    if (patch.gearboxMaterial) setGearboxMaterial(patch.gearboxMaterial);
    if (patch.gearRatioBias !== undefined) setGearboxRatio(patch.gearRatioBias);
    if (patch.gearboxLayout) setGearboxLayout(patch.gearboxLayout);
    if (patch.frontSuspensionType) setChassisSuspensionFront(patch.frontSuspensionType);
    if (patch.rearSuspensionType) setChassisSuspensionRear(patch.rearSuspensionType);
    if (patch.iceMaterial) setPuIceMaterial(patch.iceMaterial);
    if (patch.batteryCellTech) {
      setPuErsBatteryType(patch.batteryCellTech === 'dense_pack' ? 'dense_pack' : 'lightweight_lithium');
    }
    if (patch.ersDeployBiasPct !== undefined) setPuSoftwareBias(patch.ersDeployBiasPct);
  }, []);

  // Modal de Evolução Institucional (Status de Montadora / Works Team)
  const [showWorksTeamModal, setShowWorksTeamModal] = useState<boolean>(false);
  const [worksTeamPendingAction, setWorksTeamPendingAction] = useState<'factory' | 'phoenix' | null>(null);
  const [worksTeamNameInput, setWorksTeamNameInput] = useState<string>('');

  // Coluna 1: ICE (6 Sliders) - Inicializados pelo DNA da Fábrica
  const [sliderIceEficPot, setSliderIceEficPot] = useState<number>(FACTORY_DNA_PRESETS.porsche.iceEficPot);
  const [sliderIceBloco, setSliderIceBloco] = useState<number>(FACTORY_DNA_PRESETS.porsche.iceBloco);
  const [sliderIceTorque, setSliderIceTorque] = useState<number>(FACTORY_DNA_PRESETS.porsche.iceTorque);
  const [sliderIceTurbo, setSliderIceTurbo] = useState<number>(FACTORY_DNA_PRESETS.porsche.iceTurbo);
  const [sliderIceCombustivel, setSliderIceCombustivel] = useState<number>(FACTORY_DNA_PRESETS.porsche.iceCombustivel);
  const [sliderIceVirabrequim, setSliderIceVirabrequim] = useState<number>(FACTORY_DNA_PRESETS.porsche.iceVirabrequim);

  // Coluna 2: ERS (4 Sliders)
  const [sliderErsSoftware, setSliderErsSoftware] = useState<number>(FACTORY_DNA_PRESETS.porsche.ersSoftware);
  const [sliderErsAntiClipping, setSliderErsAntiClipping] = useState<number>(FACTORY_DNA_PRESETS.porsche.ersAntiClipping);
  const [sliderErsBateria, setSliderErsBateria] = useState<number>(FACTORY_DNA_PRESETS.porsche.ersBateria);
  const [sliderErsArquitetura, setSliderErsArquitetura] = useState<number>(FACTORY_DNA_PRESETS.porsche.ersArquitetura);

  // ERS de Terceiros (Mercado de 5 Fornecedores) & Acordo Emergencial
  const [thirdPartyErsSupplier, setThirdPartyErsSupplier] = useState<CustomerEngineSupplier | null>(null);
  const [showErsMarketModal, setShowErsMarketModal] = useState<boolean>(false);
  const thirdPartyErsMercedes = thirdPartyErsSupplier === 'Mercedes';
  const [emergencyMercedesDeal, setEmergencyMercedesDeal] = useState<boolean>(false);
  const [emergencySupplier, setEmergencySupplier] = useState<CustomerEngineSupplier | null>(null);
  const [selectedEmergencySupplier, setSelectedEmergencySupplier] = useState<CustomerEngineSupplier>('Mercedes');

  // Base Architecture determination for current engine
  const baseArch = React.useMemo(() => getBaseEngineArch(
    engineChoice,
    customerSupplier,
    selectedFactoryId,
    emergencySupplier
  ), [engineChoice, customerSupplier, selectedFactoryId, emergencySupplier]);

  // Architecture Customization states (unlocked before FIA homologation)
  const turboLayoutToDefaultMm = (layout: 'pequeno' | 'standard' | 'grande'): number =>
    layout === 'pequeno' ? 82 : layout === 'grande' ? 100 : 91;

  const [engineBlockAngle, setEngineBlockAngle] = useState<'90' | '120'>(baseArch.blockAngle);
  const [enginePistonStroke, setEnginePistonStroke] = useState<'longo' | 'curto'>(baseArch.pistonStroke);
  const [engineTurboMm, setEngineTurboMm] = useState<number>(() => turboLayoutToDefaultMm(baseArch.turboLayout));
  const engineTurboLayout: 'pequeno' | 'standard' | 'grande' =
    engineTurboMm < 87 ? 'pequeno' : engineTurboMm > 95 ? 'grande' : 'standard';
  const [phoenixInjectionType, setPhoenixInjectionType] = useState<'direta' | 'dupla'>('direta');

  // Synchronize when baseArch changes
  React.useEffect(() => {
    setEngineBlockAngle(baseArch.blockAngle);
    setEnginePistonStroke(baseArch.pistonStroke);
    setEngineTurboMm(turboLayoutToDefaultMm(baseArch.turboLayout));
  }, [baseArch]);

  const isPurchasedEngine = engineChoice === 'customer' || engineChoice === 'bought_factory' || Boolean(emergencySupplier) || emergencyMercedesDeal;

  const fixedArch = {
    supplierOrFactory: baseArch.supplierOrFactory,
    blockAngle: `V6 ${engineBlockAngle}°`,
    pistonStroke: enginePistonStroke === 'longo' ? 'Curso Longo (Foco em Torque)' : 'Curso Curto (Foco em Giro)',
    turboLayout: `${engineTurboMm} mm (${engineTurboLayout === 'pequeno' ? 'Pequeno' : engineTurboLayout === 'grande' ? 'Grande' : 'Padrão'})`,
    batteryTech: baseArch.batteryTech,
    injectionType: baseArch.injectionType,
    badge: engineChoice === 'phoenix' ? 'PROJETO IN-HOUSE FÊNIX' : (emergencySupplier ? `HOMOLOGAÇÃO ${emergencySupplier.toUpperCase()}` : (engineChoice === 'customer' ? `HOMOLOGAÇÃO ${customerSupplier.toUpperCase()}` : `GABARITO ${selectedFactoryId.toUpperCase()}`))
  };

  // Saved Sliders state for Bancada Revert / Cancel
  const [savedSliders, setSavedSliders] = useState<{
    iceEficPot: number;
    iceBloco: number;
    iceTorque: number;
    iceTurbo: number;
    iceCombustivel: number;
    iceVirabrequim: number;
    ersSoftware: number;
    ersAntiClipping: number;
    ersBateria: number;
    ersArquitetura: number;
    thirdPartyErsSupplier: CustomerEngineSupplier | null;
    blockAngle: '90' | '120';
    pistonStroke: 'longo' | 'curto';
    turboLayout: 'pequeno' | 'standard' | 'grande';
    turboMm: number;
  }>({
    ...FACTORY_DNA_PRESETS.porsche,
    thirdPartyErsSupplier: null,
    blockAngle: '90',
    pistonStroke: 'curto',
    turboLayout: 'pequeno',
    turboMm: 82
  });

  // DNA da Fábrica Ativa
  const activeDna: FactorySlidersDna = engineChoice === 'bought_factory'
    ? (FACTORY_DNA_PRESETS[selectedFactoryId] || DEFAULT_SLIDERS_DNA)
    : DEFAULT_SLIDERS_DNA;

  const applyFactoryDna = (fid: EngineFactoryId) => {
    const dna = FACTORY_DNA_PRESETS[fid] || DEFAULT_SLIDERS_DNA;
    const bArch = getBaseEngineArch('bought_factory', customerSupplier, fid, null);
    const defaultMm = turboLayoutToDefaultMm(bArch.turboLayout);
    setEngineBlockAngle(bArch.blockAngle);
    setEnginePistonStroke(bArch.pistonStroke);
    setEngineTurboMm(defaultMm);
    setSliderIceEficPot(dna.iceEficPot);
    setSliderIceBloco(dna.iceBloco);
    setSliderIceTorque(dna.iceTorque);
    setSliderIceTurbo(dna.iceTurbo);
    setSliderIceCombustivel(dna.iceCombustivel);
    setSliderIceVirabrequim(dna.iceVirabrequim);
    setSliderErsSoftware(dna.ersSoftware);
    setSliderErsAntiClipping(dna.ersAntiClipping);
    setSliderErsBateria(dna.ersBateria);
    setSliderErsArquitetura(dna.ersArquitetura);
    setThirdPartyErsSupplier(null);
    setEmergencyMercedesDeal(false);
    setEmergencySupplier(null);
    setSavedSliders({
      ...dna,
      thirdPartyErsSupplier: null,
      blockAngle: bArch.blockAngle,
      pistonStroke: bArch.pistonStroke,
      turboLayout: bArch.turboLayout,
      turboMm: defaultMm
    });
  };

  const activeThirdPartyErs = thirdPartyErsSupplier ? THIRD_PARTY_ERS_OPTIONS[thirdPartyErsSupplier] : null;
  const isMercedesBatteryLocked = Boolean(activeThirdPartyErs?.locksBatteryHardware);

  // Backward compatibility aliases
  const sliderPistoes = sliderIceBloco;
  const sliderCompressao = sliderIceCombustivel;
  const sliderTurbo = sliderIceTurbo;
  const sliderSoftwareErs = thirdPartyErsMercedes ? 45 : sliderErsSoftware;
  const sliderBateria = isMercedesBatteryLocked ? 70 : sliderErsBateria;

  // Time Budget & Dynamo Roll
  const [dynamoFailed, setDynamoFailed] = useState<boolean>(false);
  const [dynamoTested, setDynamoTested] = useState<boolean>(false);
  const [abandonedToZero, setAbandonedToZero] = useState<boolean>(false);

  // Dynamic Time Calculation (Regras de Modificação de Bancada):
  // 1. Arquitetura (+4 Semanas cada): Ângulo do Bloco, Curso do Pistão, Layout do Turbo
  const isBlockAngleChanged = engineBlockAngle !== baseArch.blockAngle;
  const isPistonStrokeChanged = enginePistonStroke !== baseArch.pistonStroke;
  const isTurboLayoutChanged = engineTurboLayout !== baseArch.turboLayout;
  const archDelayWeeks = (isBlockAngleChanged ? 4 : 0) + (isPistonStrokeChanged ? 4 : 0) + (isTurboLayoutChanged ? 4 : 0);

  // 2. Hardware Pesado (+2 Semanas cada): Material do Bloco, Pistões/Virabrequim, Bateria, Inversor/Arquitetura ERS
  const isBlocoChanged = Math.abs(sliderIceBloco - activeDna.iceBloco) >= 15;
  const isVirabrequimChanged = Math.abs(sliderIceVirabrequim - activeDna.iceVirabrequim) >= 15;
  const isBateriaChanged = !isMercedesBatteryLocked && Math.abs(sliderErsBateria - activeDna.ersBateria) >= 15;
  const isErsArqChanged = !isMercedesBatteryLocked && Math.abs(sliderErsArquitetura - activeDna.ersArquitetura) >= 15;
  const hardwareDelayWeeks = (isBlocoChanged ? 2 : 0) + (isVirabrequimChanged ? 2 : 0) + (isBateriaChanged ? 2 : 0) + (isErsArqChanged ? 2 : 0);

  // 3. Software (+1 Semana cada): Potência/Eficiência, Curva de Torque, Mapeamento Combustível, ERS Software, Anti-Clipping
  const isEficPotChanged = Math.abs(sliderIceEficPot - activeDna.iceEficPot) >= 15;
  const isTorqueChanged = Math.abs(sliderIceTorque - activeDna.iceTorque) >= 15;
  const isCombustivelChanged = Math.abs(sliderIceCombustivel - activeDna.iceCombustivel) >= 15;
  const isErsSoftChanged = !thirdPartyErsSupplier && Math.abs(sliderErsSoftware - activeDna.ersSoftware) >= 15;
  const isAntiClipChanged = !thirdPartyErsSupplier && Math.abs(sliderErsAntiClipping - activeDna.ersAntiClipping) >= 15;
  const softwareDelayWeeks = (isEficPotChanged ? 1 : 0) + (isTorqueChanged ? 1 : 0) + (isCombustivelChanged ? 1 : 0) + (isErsSoftChanged ? 1 : 0) + (isAntiClipChanged ? 1 : 0);

  // Semanas individuais para exibição nos badges
  const iceBlocoWeeks = isBlocoChanged ? 2 : 0;
  const iceVirabrequimWeeks = isVirabrequimChanged ? 2 : 0;
  const ersBateriaWeeks = isBateriaChanged ? 2 : 0;
  const ersArquiteturaWeeks = isErsArqChanged ? 2 : 0;
  const iceEficPotWeeks = isEficPotChanged ? 1 : 0;
  const iceTorqueWeeks = isTorqueChanged ? 1 : 0;
  const iceCombustivelWeeks = isCombustivelChanged ? 1 : 0;
  const iceTurboWeeks = isTurboLayoutChanged ? 4 : 0;
  const ersSoftwareWeeks = isErsSoftChanged ? 1 : 0;
  const ersAntiClippingWeeks = isAntiClipChanged ? 1 : 0;
  const ersSupplierWeeks = activeThirdPartyErs ? activeThirdPartyErs.delayWeeks : 0;
  const ersSupplierCostUsd = activeThirdPartyErs ? activeThirdPartyErs.costUsd : 0;
  const emergencyWeeks = (emergencyMercedesDeal || emergencySupplier) ? 2 : 0;

  const iceWeeksTotal = archDelayWeeks + (isBlocoChanged ? 2 : 0) + (isVirabrequimChanged ? 2 : 0) + (isEficPotChanged ? 1 : 0) + (isTorqueChanged ? 1 : 0) + (isCombustivelChanged ? 1 : 0);
  const ersWeeksTotal = (isBateriaChanged ? 2 : 0) + (isErsArqChanged ? 2 : 0) + (isErsSoftChanged ? 1 : 0) + (isAntiClipChanged ? 1 : 0) + ersSupplierWeeks;
  const modifiedWeeks = archDelayWeeks + hardwareDelayWeeks + softwareDelayWeeks + emergencyWeeks + ersSupplierWeeks;

  // Regras de Bloqueio e Tempo de Pré-Temporada da Bancada
  const isHardwareBlocked = motorHomologado || hardwareBlockedByTime || ((semanasRestantesPreTemporada - modifiedWeeks) <= 0 && hardwareBlockedByTime);
  const semanasRestantesCalculadas = Math.max(0, semanasRestantesPreTemporada - modifiedWeeks);

  // 4. Custos Industriais do Motor (Protótipo vs Produção Final FIA)
  const numArchChanges = (isBlockAngleChanged ? 1 : 0) + (isPistonStrokeChanged ? 1 : 0) + (isTurboLayoutChanged ? 1 : 0);
  const numHardwareChanges = (isBlocoChanged ? 1 : 0) + (isVirabrequimChanged ? 1 : 0) + (isBateriaChanged ? 1 : 0) + (isErsArqChanged ? 1 : 0);
  const totalIndustrialChanges = numArchChanges + numHardwareChanges;
  const custoPrototipo = 2000000 + (totalIndustrialChanges * 500000) + ersSupplierCostUsd; // Começa em $2.0M + mod. estruturais + ERS externo
  const custoPorMotor = 1500000; // Começa em $1.5M por unidade
  const custoProducaoTotal = custoPorMotor * 8; // $12.0M (8 motores oficiais: 4 por piloto)

  // Compatibilidade entre Bloco ICE (Coluna 1) e Fornecedor de ERS selecionado (Coluna 2)
  const computeIceErsHarmonyDelta = (sup: CustomerEngineSupplier): { delta: number; reason: string } => {
    switch (sup) {
      case 'Mercedes': {
        let delta = 4; // Calibração base Brixworth
        if (engineBlockAngle === '90') delta += 3;
        else delta -= 5;
        if (enginePistonStroke === 'longo') delta += 2;
        if (sliderIceEficPot >= 45) delta += 2;
        return {
          delta,
          reason: engineBlockAngle === '120'
            ? 'Bloco V6 120° reduz eficiência de empacotamento com packs Mercedes'
            : 'Sincronia estável com bloco V6 90° e software Anti-Clipping 100%'
        };
      }
      case 'Ferrari': {
        let delta = 0;
        if (enginePistonStroke === 'curto') delta += 4;
        else delta -= 3;
        if (engineTurboMm <= 90) delta += 4;
        else if (engineTurboMm > 96) delta -= 5;
        if (engineBlockAngle === '120') delta -= 6;
        return {
          delta,
          reason: enginePistonStroke === 'curto' && engineTurboMm <= 90
            ? 'Casamento térmico ágil com curso curto e turbo compacto'
            : 'Inércia/geometria do ICE eleva demanda térmica sobre o ERS Ferrari'
        };
      }
      case 'Honda': {
        // Penalidade explícita de -10% pela vibração + sensibilidade ao material/ângulo do bloco ICE
        let delta = -10;
        if (sliderIceBloco >= 60) delta += 3;
        else if (sliderIceBloco < 30) delta -= 4;
        if (engineBlockAngle === '120') delta -= 3;
        return {
          delta,
          reason: sliderIceBloco >= 60
            ? '-10% vibração Honda (parcialmente amortecida por bloco em Titânio)'
            : '-10% vibração Honda amplificada em bloco ICE de baixa rigidez'
        };
      }
      case 'Red Bull-Ford': {
        let delta = 0;
        if (sliderIceTorque >= 55) delta += 4;
        else delta -= 3;
        if (sliderIceCombustivel >= 55) delta += 3;
        if (enginePistonStroke === 'longo') delta += 2;
        if (engineTurboMm < 84) delta -= 4;
        return {
          delta,
          reason: sliderIceTorque >= 55
            ? 'Torque elevado do ICE casa com entrega +5 PWR do ERS RBPT-Ford'
            : 'ICE conservador subutiliza a descarga agressiva RBPT-Ford'
        };
      }
      case 'Audi': {
        let delta = 0;
        if (engineBlockAngle === '120') delta += 6;
        else delta -= 6;
        if (engineTurboMm >= 93) delta += 4;
        else delta -= 3;
        if (enginePistonStroke === 'curto') delta -= 3;
        return {
          delta,
          reason: engineBlockAngle === '120'
            ? 'Arquitetura V6 120° e turbo grande alinham com packs Audi'
            : 'Pacote largo Audi gera conflito harmônico com bloco estreito V6 90°'
        };
      }
    }
  };

  // Índice de Harmonia (0 a 100): Penaliza desvios severos do DNA original + Compatibilidade ICE x ERS
  const dnaCorrelationMod = (selectedBackground.modifiers.correlationErrorMod || 0);
  let harmoniaCalc = 100;
  const dEfic = Math.abs(sliderIceEficPot - activeDna.iceEficPot);
  const dBloco = Math.abs(sliderIceBloco - activeDna.iceBloco);
  const dTorque = Math.abs(sliderIceTorque - activeDna.iceTorque);
  const dTurbo = isPurchasedEngine ? 0 : Math.abs(sliderIceTurbo - activeDna.iceTurbo);
  const dComb = Math.abs(sliderIceCombustivel - activeDna.iceCombustivel);
  const dVira = Math.abs(sliderIceVirabrequim - activeDna.iceVirabrequim);

  harmoniaCalc -= Math.round(dEfic * 0.15);
  harmoniaCalc -= Math.round(dBloco * 0.12);
  harmoniaCalc -= Math.round(dTorque * 0.10);
  harmoniaCalc -= Math.round(dTurbo * 0.15);
  harmoniaCalc -= Math.round(dComb * 0.18);
  harmoniaCalc -= Math.round(dVira * 0.15);
  if (isBlockAngleChanged) harmoniaCalc -= 10;
  if (isPistonStrokeChanged) harmoniaCalc -= 10;
  if (isTurboLayoutChanged) harmoniaCalc -= 10;

  const activeErsHarmonyInfo = thirdPartyErsSupplier ? computeIceErsHarmonyDelta(thirdPartyErsSupplier) : null;

  if (!thirdPartyErsSupplier) {
    const dErsSoft = Math.abs(sliderErsSoftware - activeDna.ersSoftware);
    const dAntiClip = Math.abs(sliderErsAntiClipping - activeDna.ersAntiClipping);
    const dBateria = isPurchasedEngine ? 0 : Math.abs(sliderErsBateria - activeDna.ersBateria);
    const dArq = isPurchasedEngine ? 0 : Math.abs(sliderErsArquitetura - activeDna.ersArquitetura);
    harmoniaCalc -= Math.round(dErsSoft * 0.15);
    harmoniaCalc -= Math.round(dAntiClip * 0.08);
    harmoniaCalc -= Math.round(dBateria * 0.15);
    harmoniaCalc -= Math.round(dArq * 0.15);
  } else if (activeErsHarmonyInfo) {
    harmoniaCalc += activeErsHarmonyInfo.delta;
    if (!isMercedesBatteryLocked) {
      const dErsSoft = Math.abs(sliderErsSoftware - activeDna.ersSoftware);
      harmoniaCalc -= Math.round(dErsSoft * 0.08);
    }
  }
  harmoniaCalc -= Math.round(dnaCorrelationMod * 15);
  const indiceHarmonia = Math.max(15, Math.min(100, Math.round(harmoniaCalc)));

  const erroCorrelacaoPercent = Math.round((dnaCorrelationMod + ((emergencyMercedesDeal || emergencySupplier) ? 0.15 : 0)) * 100);
  const riscoIncompatibilidade = 100 - indiceHarmonia;

  // Chance de Quebra no Dinamômetro (Audi dobra a chance!)
  const baseChanceFalhaDinamometro = Math.max(
    0,
    Math.min(
      95,
      indiceHarmonia < 70
        ? Math.round(35 + (70 - indiceHarmonia) * 0.8 + (dnaCorrelationMod * 20))
        : (modifiedWeeks > 0 || Boolean(thirdPartyErsSupplier)
            ? Math.round(Math.max(5, (100 - indiceHarmonia) * 0.35 + (dnaCorrelationMod * 15)))
            : 0)
    )
  );
  const chanceFalhaDinamometro = activeThirdPartyErs?.dynoFailureMultiplier === 2
    ? Math.min(95, Math.max(10, baseChanceFalhaDinamometro) * 2)
    : baseChanceFalhaDinamometro;

  const executeDynamoTest = () => {
    playRadioSound();

    // 1. Deduzir o Custo do Protótipo do Caixa e do Teto de Gastos imediatamente
    setFinancials(prev => ({
      ...prev,
      bankBalance: prev.bankBalance - custoPrototipo,
      costCapSpent: prev.costCapSpent + custoPrototipo
    }));
    setPrototypeCostSpent(prev => prev + custoPrototipo);
    setLastIncurredPrototypeCost(custoPrototipo);

    // 2. Exibir notificação
    const msg = `Protótipo usinado e enviado à bancada. -$${(custoPrototipo / 1000000).toFixed(1)}M.`;
    addNotification('PROTÓTIPO ENVIADO AO DINAMÔMETRO', msg, 'info');
    setDynoNotification(msg);

    // 3. Rodar a simulação de teste
    if (modifiedWeeks === 0 && !thirdPartyErsSupplier && !emergencyMercedesDeal && !emergencySupplier) {
      setDynamoFailed(false);
      setDynamoTested(true);
      setShowDynamoReportModal(true);
      return;
    }
    const roll = Math.random() * 100;
    if (roll < chanceFalhaDinamometro) {
      setDynamoFailed(true);
      setDynamoTested(true);
    } else {
      setDynamoFailed(false);
      setDynamoTested(true);
    }
    setShowDynamoReportModal(true);
  };

  // Step 3 & Step 6: Technical Pillars + Drivers + Radio Race Engineers
  const [selectedDriver1, setSelectedDriver1] = useState<string | null>(null);
  const [selectedDriver2, setSelectedDriver2] = useState<string | null>(null);
  const [selectedReserveDriver, setSelectedReserveDriver] = useState<string | null>(null);
  const [selectedHeadAero, setSelectedHeadAero] = useState<string | null>(null);
  const [selectedHeadPU, setSelectedHeadPU] = useState<string | null>(null);
  const [selectedSportingDirector, setSelectedSportingDirector] = useState<string | null>(null);
  const [selectedChiefMechanic, setSelectedChiefMechanic] = useState<string | null>('staff_mech_fic_1');
  const [selectedRaceEngineer1, setSelectedRaceEngineer1] = useState<string | null>(null);
  const [selectedRaceEngineer2, setSelectedRaceEngineer2] = useState<string | null>(null);
  const [selectedAffiliate, setSelectedAffiliate] = useState<string>('driver_affiliate_1');

  // Driver Negotiation & Risk Premium States
  const [negotiatingDriver, setNegotiatingDriver] = useState<{
    driver: Driver;
    slot: 't1' | 't2' | 'reserve';
    riskSalary: number;
  } | null>(null);

  const [driverContractSalaries, setDriverContractSalaries] = useState<Record<string, number>>({});

  // Sub-tabs & Search for Step 6 Market (Drivers + Race Radio Engineers + Chief Mechanic)
  const [step6MainTab, setStep6MainTab] = useState<'drivers' | 'radio_engineers' | 'chief_mechanic'>('drivers');
  const [driverCategory, setDriverCategory] = useState<'F1' | 'F2' | 'F3' | 'FREE_AGENTS'>('F1');
  const [marketSearch, setMarketSearch] = useState<string>('');
  const [expandedDriverProfile, setExpandedDriverProfile] = useState<Driver | null>(null);
  const [expandedStaffProfile, setExpandedStaffProfile] = useState<StaffMember | null>(null);

  // Player team reputation calculation
  const realTeamReputation = allTeams.find(t => t.id === selectedRealTeamId)?.reputation || 75;
  const playerReputation = careerPath === 'real_team'
    ? realTeamReputation
    : (45 + (ambitionSpec.aeroFacilityLevel >= 2 ? 6 : 0) + (engineChoice === 'bought_factory' || engineChoice === 'phoenix' ? 15 : 0) + (principalBackground === 'f1_driver' ? 10 : 0));

  // Auto-fill real team squad if player selects real team
  React.useEffect(() => {
    if (careerPath === 'real_team') {
      const realDrivers = F1_DRIVERS_REAL.filter(d => d.teamId === selectedRealTeamId);
      if (realDrivers.length >= 2) {
        setSelectedDriver1(realDrivers[0].id);
        setSelectedDriver2(realDrivers[1].id);
      }
      setSelectedReserveDriver('free_drugovich');
      if (selectedRealTeamId === 'ferrari') {
        setSelectedHeadAero('staff_aero_tondi');
        setSelectedHeadPU('staff_pu_gualtieri');
        setSelectedSportingDirector('staff_sport_ioverno');
        setSelectedChiefMechanic('staff_mech_lee');
        setSelectedRaceEngineer1('staff_re_bozzi');
        setSelectedRaceEngineer2('staff_re_adami');
      } else if (selectedRealTeamId === 'redbull') {
        setSelectedHeadAero('staff_aero_wache');
        setSelectedHeadPU('staff_pu_hodgkinson');
        setSelectedSportingDirector('staff_sport_wheatley');
        setSelectedChiefMechanic('staff_mech_calum');
        setSelectedRaceEngineer1('staff_re_lambiase');
        setSelectedRaceEngineer2('staff_re_fic_1');
      } else if (selectedRealTeamId === 'mercedes') {
        setSelectedHeadAero('staff_aero_allison');
        setSelectedHeadPU('staff_pu_thomas');
        setSelectedSportingDirector('staff_sport_meadows');
        setSelectedChiefMechanic('staff_mech_lee');
        setSelectedRaceEngineer1('staff_re_bono');
        setSelectedRaceEngineer2('staff_re_fic_2');
      } else if (selectedRealTeamId === 'astonmartin') {
        setSelectedHeadAero('staff_aero_newey');
        setSelectedHeadPU('staff_pu_watanabe');
        setSelectedSportingDirector('staff_sport_cowell');
        setSelectedChiefMechanic('staff_mech_calum');
        setSelectedRaceEngineer1('staff_re_fic_1');
        setSelectedRaceEngineer2('staff_re_fic_2');
      } else if (selectedRealTeamId === 'mclaren') {
        setSelectedHeadAero('staff_aero_prodromou');
        setSelectedHeadPU('staff_pu_thomas');
        setSelectedSportingDirector('staff_sport_wheatley');
        setSelectedChiefMechanic('staff_mech_lee');
        setSelectedRaceEngineer1('staff_re_joseph');
        setSelectedRaceEngineer2('staff_re_stallard');
      } else {
        setSelectedHeadAero('staff_aero_fic_1');
        setSelectedHeadPU('staff_pu_fic_1');
        setSelectedSportingDirector('staff_sport_fic_1');
        setSelectedChiefMechanic('staff_mech_fic_1');
        setSelectedRaceEngineer1('staff_re_fic_1');
        setSelectedRaceEngineer2('staff_re_fic_2');
      }
    }
  }, [careerPath, selectedRealTeamId]);

  // Check if engine choice was locked in Phase 5 (Ponto de Não Retorno FIA)
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('apex_f1_engine_locked');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.engineChoice) setEngineChoice(parsed.engineChoice);
        if (parsed.selectedFactoryId) setSelectedFactoryId(parsed.selectedFactoryId);
        if (parsed.customerSupplier) setCustomerSupplier(parsed.customerSupplier);
        if (parsed.locked && currentStep < 5) {
          setCurrentStep(5);
          setPuPhaseStage(parsed.puStage || 'dossier');
        }
      }
    } catch (_) {}
  }, []);

  // Trava Fase 3: Os 3 Pilares Técnicos de Projeto & Organização (Chefe Aero + Chefe PU + Chefe de Gerenciamento)
  const isStep3Complete = Boolean(
    selectedHeadAero &&
    selectedHeadPU &&
    selectedSportingDirector
  );

  // Trava Fase 6: Equipe Operacional de Pista (2 Titulares + 1 Reserva + 2 Rádio + Chefe Mecânico)
  const isStep6Complete = Boolean(
    selectedDriver1 &&
    selectedDriver2 &&
    selectedDriver1 !== selectedDriver2 &&
    selectedReserveDriver &&
    selectedRaceEngineer1 &&
    selectedRaceEngineer2 &&
    selectedRaceEngineer1 !== selectedRaceEngineer2 &&
    selectedChiefMechanic
  );

  // Step 5: Car Philosophy (M02 - 6 Filosofias Oficiais) & Staff Conflict Evaluator
  const [philosophy, setPhilosophy] = useState<VehiclePhilosophyCode>('aero_efficiency');
  const [fuelPartner, setFuelPartner] = useState<FuelPartnerId>('petronas');
  const [preSeasonRan, setPreSeasonRan] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    lapTime: number;
    rank: number;
    porpoising: boolean;
    reliability: number;
    delayWeeks: number;
  } | null>(null);

  // Step 7: Commercial Sponsors Sign-off
  const [selectedTitleSponsor, setSelectedTitleSponsor] = useState<string>('aramco');
  const [commercialSigned, setCommercialSigned] = useState<boolean>(true);

  // Time Budget & Modifications Calculations
  const isEmergencyActive = emergencyMercedesDeal || Boolean(emergencySupplier);
  const effectiveEmergencySupplier: CustomerEngineSupplier = emergencySupplier || 'Mercedes';

  const integrationWeeks = isEmergencyActive
    ? 2
    : (engineChoice === 'bought_factory'
        ? AVAILABLE_FACTORIES[selectedFactoryId].integrationWeeks
        : (engineChoice === 'phoenix' ? 8 : 0));

  const currentWeeksRemaining = abandonedToZero ? -18 : (8 - integrationWeeks - (isEmergencyActive ? 0 : modifiedWeeks));

  // Nationality Marketing Bonus Check
  const isDriverPatrioticOrEmerging = (drvId: string | null) => {
    if (!drvId) return false;
    const drv = ALL_MARKET_DRIVERS.find(d => d.id === drvId) || drivers.find(d => d.id === drvId);
    if (!drv) return false;
    const hqCountry = (selectedHq?.country || '').toLowerCase();
    const drvNat = (drv.nationality || '').toLowerCase();

    const isSame =
      ((hqCountry.includes('brasil') || hqCountry.includes('brazil')) && (drvNat.includes('brasil') || drvNat.includes('brazil'))) ||
      ((hqCountry.includes('reino unido') || hqCountry.includes('uk')) && (drvNat.includes('united kingdom') || drvNat.includes('british'))) ||
      ((hqCountry.includes('itália') || hqCountry.includes('italy')) && (drvNat.includes('italy') || drvNat.includes('italian'))) ||
      ((hqCountry.includes('alemanha') || hqCountry.includes('germany')) && (drvNat.includes('germany') || drvNat.includes('german'))) ||
      ((hqCountry.includes('estados unidos') || hqCountry.includes('usa')) && (drvNat.includes('united states') || drvNat.includes('american'))) ||
      ((hqCountry.includes('japão') || hqCountry.includes('japan')) && (drvNat.includes('japan') || drvNat.includes('japanese')));

    const isEmerging = ['argentina', 'estonia', 'new zealand'].includes(drvNat);
    return isSame || isEmerging;
  };

  const hasPatrioticBonus = isDriverPatrioticOrEmerging(selectedDriver1) || isDriverPatrioticOrEmerging(selectedDriver2);
  const isManufacturer = engineChoice === 'bought_factory' || engineChoice === 'phoenix';

  let calculatedBaseDeFas = 5000000;
  if (isManufacturer) calculatedBaseDeFas += 5000000;
  if (hasPatrioticBonus) calculatedBaseDeFas *= 2;

  let calculatedReceitaMarketing = 2000000;
  if (isManufacturer) calculatedReceitaMarketing += 2000000;
  let calculatedReceitaMerchandising = 500000;
  if (hasPatrioticBonus) calculatedReceitaMarketing = Math.round(calculatedReceitaMarketing * 1.5);

  // Adiciona o Efeito Estrela (MKT > 90) e o bônus de Piloto Único do país
  const hiredDriversList = [
    ALL_MARKET_DRIVERS.find(d => d.id === selectedDriver1) || drivers.find(d => d.id === selectedDriver1),
    ALL_MARKET_DRIVERS.find(d => d.id === selectedDriver2) || drivers.find(d => d.id === selectedDriver2),
    ALL_MARKET_DRIVERS.find(d => d.id === selectedReserveDriver) || drivers.find(d => d.id === selectedReserveDriver)
  ].filter(Boolean) as Driver[];

  hiredDriversList.forEach(drv => {
    // 1. O Efeito Estrela (Marketability > 90)
    if ((drv.marketability || 0) > 90) {
      calculatedBaseDeFas += 10000000;
      calculatedReceitaMarketing += 5000000;
      calculatedReceitaMerchandising += 2000000;
    }
    // 2. Piloto Único do seu país no grid (ex: Bortoleto no Brasil)
    const analysis = getDriverMarketAnalysis(drv);
    if (analysis.isSoleRepresentative) {
      calculatedReceitaMarketing += 3000000;
    }
  });

  // Gatilho de tempo esgotado na Bancada de Montagem (Semanas Restantes <= 0)
  useEffect(() => {
    if (showBancadaModal && !motorHomologado && !hardwareBlockedByTime && !showFiaFreezeAlertModal) {
      if ((semanasRestantesPreTemporada - modifiedWeeks) <= 0) {
        setShowFiaFreezeAlertModal(true);
      }
    }
  }, [showBancadaModal, motorHomologado, hardwareBlockedByTime, showFiaFreezeAlertModal, semanasRestantesPreTemporada, modifiedWeeks]);

  // Fase 7 - CAD: Especificações e Cálculos do Câmbio
  const getGearboxSpecs = () => {
    // 1. Material da Carcaça
    // Alumínio: Barato ($1.0M), mas pesado (+12kg) e pode rachar se o piloto subir muito na zebra (-6% REL, -2 TRC).
    // Carbono: Leve (-8kg, $1.8M, 3 Semanas) e ajuda no CG (+2 TRC), mas frágil em batidas (+10% risco de quebra).
    // Titânio: Muito resistente e durável, mas pesa +5kg ($1.3M, 2 Semanas) (+5% REL).
    let materialCost = 1300000;
    let materialWeeks = 2;
    let materialWeightDelta = '+5 kg';
    let materialWeightNum = 53;
    let materialName = 'Titânio Impresso em 3D';
    let materialDesc = 'Muito resistente e durável, mas pesa +5kg.';
    let materialAlert = 'Alta resistência mecânica e durabilidade comprovada contra zebras e torção (+5% REL).';
    let materialTrcMod = 0;

    if (gearboxMaterial === 'aluminum') {
      materialCost = 1000000;
      materialWeeks = 1;
      materialWeightDelta = '+12 kg';
      materialWeightNum = 65;
      materialName = 'Alumínio Usinado 6061-T6';
      materialDesc = 'Barato, mas pesado e pode rachar se o piloto subir muito na zebra.';
      materialAlert = '⚠️ Risco de trinca por fadiga em zebras altas (-6% Confiabilidade).';
      materialTrcMod = -2;
    } else if (gearboxMaterial === 'carbon') {
      materialCost = 1800000;
      materialWeeks = 3;
      materialWeightDelta = '-8 kg';
      materialWeightNum = 45;
      materialName = 'Fibra de Carbono Estrutural';
      materialDesc = 'Leve e ajuda no centro de gravidade, mas frágil (risco de quebra em batidas).';
      materialAlert = '⚠️ Frágil a colisões e toques na traseira (Risco de quebra em batidas).';
      materialTrcMod = +2;
    }

    // 2. Relação de Marchas
    // Aceleração (Curta): Excelente para pistas travadas (Mônaco), mas o carro bate no limitador nas retas de Monza.
    // Velocidade Máxima (Longa): Foguete em Monza e Baku, mas o carro demora a sair das curvas lentas.
    let ratioLabel = 'Equilibrada (50%)';
    let ratioDesc = 'Escalonamento harmônico para pistas mistas.';
    let ratioTrcMod = 0;
    let ratioTopSpeedMod = 'Neutro';
    if (gearboxRatio < 35) {
      ratioLabel = 'Aceleração Curta (Mônaco)';
      ratioDesc = 'Excelente para pistas travadas (Mônaco), mas o carro bate no limitador nas retas de Monza.';
      ratioTrcMod = +6;
      ratioTopSpeedMod = '-8 km/h em reta (Limitador precoce)';
    } else if (gearboxRatio > 65) {
      ratioLabel = 'Velocidade Máxima Longa (Monza)';
      ratioDesc = 'Foguete em Monza e Baku, mas o carro demora a sair das curvas lentas.';
      ratioTrcMod = -5;
      ratioTopSpeedMod = '+10 km/h em reta';
    }

    // 3. Layout da Carcaça (Correção Seção 4.5: não altera troca de pneus no pit stop; altera acesso de manutenção/reparo na garagem e bloqueio do difusor)
    // Compacto: Excelente para a aerodinâmica traseira (libera o difusor). Ônus: Acesso mecânico restrito na garagem (+22 min em reparos/inspeções).
    // Volumoso: Fácil acesso para os mecânicos (-12 min em reparos na garagem). Ônus: Bloqueia o fluxo de ar do difusor (perde downforce).
    let layoutCostMod = 200000;
    let layoutLength = '370 mm';
    let layoutName = 'Compacto (Slim Aero)';
    let layoutDesc = 'Excelente para a aerodinâmica traseira (libera o difusor). Ônus: Acesso mecânico apertado aumenta o tempo de manutenção/reparo na garagem.';
    let pitStopText = '+22 min (Manutenção/Reparo na Garagem · Pit Stop Pneus Inalterado)';
    let drgRating = 'Classe A+ (Arrasto Mínimo)';
    let diffuserStatus = '100% Desobstruído (Difusor 2026 Livre)';

    if (gearboxLayout === 'voluminous') {
      layoutCostMod = -100000;
      layoutLength = '435 mm';
      layoutName = 'Volumoso (Modular Mecânico)';
      layoutDesc = 'Fácil acesso para os mecânicos (reparos rápidos na garagem). Ônus: Bloqueia o fluxo de ar do difusor (perde downforce).';
      pitStopText = '-12 min (Manutenção/Reparo Ágil · Pit Stop Pneus Inalterado)';
      drgRating = 'Classe C (Arrasto Elevado)';
      diffuserStatus = 'Difusor Obstruído (-35% Eficiência Aero)';
    }

    const totalCost = materialCost + layoutCostMod;
    const totalWeeks = materialWeeks;
    const trcTotal = Math.max(60, Math.min(99, 80 + ratioTrcMod + materialTrcMod));

    return {
      materialCost,
      materialWeeks,
      materialWeightDelta,
      materialWeightNum,
      materialName,
      materialDesc,
      materialAlert,
      ratioLabel,
      ratioDesc,
      ratioTrcMod,
      ratioTopSpeedMod,
      layoutCostMod,
      layoutLength,
      layoutName,
      layoutDesc,
      pitStopText,
      drgRating,
      diffuserStatus,
      totalCost,
      totalWeeks,
      trcTotal
    };
  };

  const handleFinalizeGearbox = () => {
    playRadioSound();
    const specs = getGearboxSpecs();
    const costDiff = specs.totalCost - gearboxCostSpent;
    if (costDiff !== 0) {
      setFinancials(prev => ({
        ...prev,
        bankBalance: prev.bankBalance - costDiff,
        costCapSpent: prev.costCapSpent + costDiff
      }));
      setGearboxCostSpent(specs.totalCost);
    }
    setGearboxFinalized(true);
    addNotification(
      'CAD M09 - CÂMBIO HOMOLOGADO',
      `Carcaça em ${specs.materialName} (${specs.layoutName}) finalizada. Custo: $${(specs.totalCost / 1e6).toFixed(1)}M | Tempo: ${specs.totalWeeks} Semanas.`,
      'info'
    );
    setChassisSubStep('packaging');
  };

  // Execução do Teste de Pré-Temporada no Bahrein usando o Motor Físico M01-M11 (Fase 8)
  const runBahrainPreSeasonTest = () => {
    playRadioSound();
    if (currentWeeksRemaining < 0 || abandonedToZero) {
      setTestResult({
        lapTime: 94.850,
        rank: 11,
        porpoising: false,
        reliability: 45,
        delayWeeks: abandonedToZero ? 4 : 0
      });
      setPreSeasonRan(true);
      return;
    }

    const aeroOffset = selectedBackground.modifiers.floorDownforceBonus || 0;
    const solved = solveVehiclePhysics(vehicleParamsDraft, {
      componentLevelAvg: 1,
      aeroDownforceOffset: aeroOffset
    });

    const racePreview = runRaceSimulation(
      vehicleParamsDraft,
      {
        circuitCode: 'silverstone',
        fidelityMode: 'dynamic',
        weather: 'dry_clear',
        initialFuelKg: 35,
        stints: [{ compound: 'medium', lapsCount: 3 }],
        trafficFollowGapS: 6.0,
        pitStopDurationS: 20.0,
        seed: 2026
      },
      FIA_2026_DEFAULT_EDITION
    );

    const fastestLapS = racePreview.lapTelemetry.length > 0
      ? Math.min(...racePreview.lapTelemetry.map(l => l.lapTimeS))
      : 90.5;

    const puDelayWeeks = engineChoice === 'phoenix' && (solved.thermalMarginC < 4 || solved.summary.reliabilityScore < 72) ? 1 : 0;
    const relMod = selectedBackground.modifiers.reliabilityDelta || 0;
    const emergencyRelPenalty = isEmergencyActive ? -8 : 0;
    const computedReliability = Math.min(
      99,
      Math.max(40, Math.round(solved.summary.reliabilityScore + relMod + (recalibrateBench ? 4 : 0) + emergencyRelPenalty))
    );
    const computedRank = Math.max(1, Math.min(11, Math.round(11 - (solved.summary.carRating - 65) / 3.2)));

    setTestResult({
      lapTime: Math.round(fastestLapS * 1000) / 1000,
      rank: computedRank,
      porpoising: solved.porpoisingRiskPct >= 35,
      reliability: computedReliability,
      delayWeeks: puDelayWeeks
    });
    setPreSeasonRan(true);
  };

  // Staff hired objects & Combined Leadership DNA (Player + 3 Chiefs)
  const hiredHeadAeroObj = ALL_STAFF_MEMBERS.find(s => s.id === selectedHeadAero) || null;
  const hiredHeadPuObj = ALL_STAFF_MEMBERS.find(s => s.id === selectedHeadPU) || null;
  const hiredSportingObj = ALL_STAFF_MEMBERS.find(s => s.id === selectedSportingDirector) || null;
  const combinedLeadershipDna = React.useMemo(
    () =>
      evaluateCombinedLeadershipDna({
        principalBackground: selectedBackground,
        headAero: hiredHeadAeroObj,
        headPu: hiredHeadPuObj,
        sportingDirector: hiredSportingObj
      }),
    [selectedBackground, hiredHeadAeroObj, hiredHeadPuObj, hiredSportingObj]
  );
  const philosophyConflict = React.useMemo(
    () =>
      evaluateStaffPhilosophyConflict({
        philosophyCode: normalizeToM02Philosophy(philosophy),
        principalBackground: selectedBackground,
        headAero: hiredHeadAeroObj,
        headPu: hiredHeadPuObj,
        sportingDirector: hiredSportingObj,
        engineOrigin: engineChoice,
        customerSupplier,
        thirdPartyErsSupplier,
        includePowerUnitConstraints: currentStep >= 5
      }),
    [philosophy, selectedBackground, hiredHeadAeroObj, hiredHeadPuObj, hiredSportingObj, engineChoice, customerSupplier, thirdPartyErsSupplier, currentStep]
  );
  const cascadingRdImpact = React.useMemo(
    () =>
      evaluateCascadingRdImpact({
        philosophyCode: normalizeToM02Philosophy(philosophy),
        principalBackground: selectedBackground,
        headAero: hiredHeadAeroObj,
        headPu: hiredHeadPuObj,
        sportingDirector: hiredSportingObj
      }),
    [philosophy, selectedBackground, hiredHeadAeroObj, hiredHeadPuObj, hiredSportingObj]
  );

  // Enforce Zero-Pod lockout automatically if Mercedes Customer or Ferrari ERS requires larger sidepods
  React.useEffect(() => {
    if (philosophyConflict.lockedSidepodConcepts.includes('zeropod') && chassisSidepodConcept === 'zeropod') {
      setChassisSidepodConcept('downwash');
      updateVehicleParamsDraft({
        sidepodInletAreaCm2: thirdPartyErsSupplier === 'Ferrari' ? 395 : 355,
        hotAirExitAreaCm2: 335,
        sidepodUndercutPct: 60,
        radiatorVolumeL: 13.0
      });
    }
  }, [philosophyConflict.lockedSidepodConcepts, chassisSidepodConcept, thirdPartyErsSupplier, updateVehicleParamsDraft]);

  // Helper step progression (8 Fases)
  const nextStep = () => {
    playRadioSound();
    if (currentStep === 3) {
      if (!isStep3Complete) return;
      // Sincroniza o Caixa Inicial e o Teto de Gastos (0% utilizado) a partir da Aposta do Conselho na Fase 3
      setFinancials(prev => ({
        ...prev,
        bankBalance: initialBudgetUsd,
        costCapLimit: 135000000,
        costCapSpent: 0
      }));
      setCurrentStep(4);
      return;
    }
    if (currentStep === 4) {
      setCurrentStep(5);
      return;
    }
    if (currentStep === 5) {
      if (puPhaseStage === 'select') {
        setPuPhaseStage(engineChoice === 'phoenix' ? 'phoenix_assembly' : 'dossier');
        return;
      }
      if (puPhaseStage === 'phoenix_assembly') {
        setPuPhaseStage('dossier');
        return;
      }
      if (puPhaseStage === 'dossier') {
        setCurrentStep(6);
        return;
      }
    }
    if (currentStep === 6 && !isStep6Complete) {
      return;
    }
    if (currentStep === 7) {
      if (chassisSubStep === 'gearbox') {
        handleFinalizeGearbox();
        return;
      }
      if (chassisSubStep === 'packaging') {
        setChassisSubStep('monocoque');
        return;
      }
      if (chassisSubStep === 'monocoque') {
        setChassisSubStep('dynamics');
        return;
      }
      if (chassisSubStep === 'dynamics') {
        if (!chassisLaunchConfirmed) {
          setShowCarLaunchModal(true);
          return;
        }
        setCurrentStep(8);
        return;
      }
    }
    if (currentStep === 8 && !preSeasonRan) {
      runBahrainPreSeasonTest();
      return;
    }

    if (currentStep < 8) {
      setCurrentStep(prev => prev + 1);
    } else {
      const realTeamObj = allTeams.find(t => t.id === selectedRealTeamId);
      onComplete({
        careerPath,
        userRole: careerPath === 'custom_team' ? 'owner' : 'principal',
        teamId: careerPath === 'custom_team' ? 'apex' : selectedRealTeamId,
        teamName: careerPath === 'custom_team' ? customTeamName : (realTeamObj?.name || 'Scuderia Ferrari HP'),
        teamShort: careerPath === 'custom_team' ? customTeamShort : (realTeamObj?.shortName || 'FER'),
        teamColor: careerPath === 'custom_team' ? customColor : (realTeamObj?.color || '#E8002D'),
        principalName,
        principalBackground,
        engineOrigin: isEmergencyActive ? 'customer' : engineChoice,
        engineSupplier: isEmergencyActive
          ? CUSTOMER_ENGINES[effectiveEmergencySupplier].fullName
          : (engineChoice === 'customer'
              ? customerSupplier
              : (engineChoice === 'bought_factory' ? AVAILABLE_FACTORIES[selectedFactoryId].fullName : 'In-House Phoenix PU')),
        location: careerPath === 'custom_team' ? selectedHq.name : (realTeamObj?.location || 'Maranello, Italy'),
        hqBonus: careerPath === 'custom_team' ? selectedHq.bonus : undefined,
        hqOnus: careerPath === 'custom_team' ? selectedHq.onus : undefined,
        philosophy,
        fuelPartner,
        puInjectionMapping: engineChoice !== 'customer' ? puInjectionMapping : undefined,
        driver1Id: selectedDriver1 || 'f2_browning',
        driver2Id: selectedDriver2 || 'free_drugovich',
        affiliateId: selectedReserveDriver || selectedAffiliate || 'f2_camara',
        reserveDriverId: selectedReserveDriver || undefined,
        headAeroId: selectedHeadAero || undefined,
        headPUId: selectedHeadPU || undefined,
        sportingDirectorId: selectedSportingDirector || undefined,
        chiefMechanicId: selectedChiefMechanic || undefined,
        raceEngineer1Id: selectedRaceEngineer1 || undefined,
        raceEngineer2Id: selectedRaceEngineer2 || undefined,
        projectAmbition,
        boardTargetPosition: ambitionSpec.boardTargetPosition,
        boardPressureLevel: ambitionSpec.pressureLevel,
        initialProjectBudgetUsd: ambitionSpec.budgetUsd,
        staffPhilosophyPenaltyPct: philosophyConflict.efficiencyDeltaPct,
        boardSynergyPct: cascadingRdImpact.boardSynergyPct,
        rdTimePenaltyMultiplier: cascadingRdImpact.rdTimeMultiplier,
        silentSabotageAeroPct: cascadingRdImpact.silentSabotageAeroPct,
        boardroomConflictMoralePenalty: cascadingRdImpact.moralePenalty,
        cascadingNarrativeEvent: cascadingRdImpact.narrativeEventTitle && cascadingRdImpact.narrativeEventText
          ? {
              title: cascadingRdImpact.narrativeEventTitle,
              message: cascadingRdImpact.narrativeEventText,
              mediaHeadline: cascadingRdImpact.mediaRumourText
            }
          : null,
        hqLogisticsCostFactor: selectedHq.modifiers.logisticsCostMultiplier,
        hqEuropeanStaffAppeal: selectedHq.modifiers.europeanStaffAppeal,
        semanasParaTeste: currentWeeksRemaining,
        baseDeFas: calculatedBaseDeFas,
        receitaMarketing: calculatedReceitaMarketing,
        receitaMerchandising: calculatedReceitaMerchandising,
        hasPatrioticBonus,
        engineModifications: {
          reprogramErs: sliderErsSoftware > 50 || Boolean(thirdPartyErsSupplier),
          reinforcePistons: sliderIceBloco > 0,
          redesignChamber: sliderIceEficPot > 50 || sliderIceCombustivel > 50
        },
        thirdPartyErsMercedes,
        thirdPartyErsSupplier,
        thirdPartyErsCost: ersSupplierCostUsd,
        emergencyMercedesDeal: isEmergencyActive,
        emergencySupplier: isEmergencyActive ? effectiveEmergencySupplier : undefined,
        emergencyPenaltyDescription: isEmergencyActive ? EMERGENCY_ENGINE_OPTIONS[effectiveEmergencySupplier].penaltyDetail : undefined,
        emergencyMercedesCost: 20000000,
        abandonedToZero,
        preseasonMissed: currentWeeksRemaining < 0 && !abandonedToZero,
        preseasonOverrunWeeks: currentWeeksRemaining < 0 ? Math.abs(currentWeeksRemaining) : 0,
        customCorrelationErrorMod: isEmergencyActive ? 0.15 : 0,
        dynamoFailed,
        prototypeCostPaid: prototypeCostSpent,
        productionCostPaid: productionCostSpent,
        gearboxCostPaid: gearboxCostSpent || getGearboxSpecs().totalCost,
        gearboxConfig: {
          material: vehicleParamsDraft.gearboxMaterial,
          ratio: vehicleParamsDraft.gearRatioBias,
          layout: vehicleParamsDraft.gearboxLayout,
          cost: gearboxCostSpent || getGearboxSpecs().totalCost,
          productionWeeks: getGearboxSpecs().totalWeeks
        },
        chassisConfig: {
          sidepodConcept: chassisSidepodConcept,
          suspensionFront: vehicleParamsDraft.frontSuspensionType,
          suspensionRear: vehicleParamsDraft.rearSuspensionType
        },
        vehicleParams: vehicleParamsDraft,
        chassisName: chassisName || getDefaultChassisSuggestions(
          careerPath === 'custom_team' ? customTeamShort : (realTeamObj?.shortName || 'FER'),
          careerPath === 'custom_team' ? customTeamName : (realTeamObj?.name || 'Scuderia Ferrari HP')
        )[0],
        customEngineName: (() => {
          const baseName = customEngineName.trim() || (
            isEmergencyActive
              ? CUSTOMER_ENGINES[effectiveEmergencySupplier].fullName
              : (engineChoice === 'customer'
                  ? CUSTOMER_ENGINES[customerSupplier].fullName
                  : (engineChoice === 'bought_factory'
                      ? `${AVAILABLE_FACTORIES[selectedFactoryId].name} Spec-I`
                      : `${customTeamName} Apex Works Spec-I`))
          );
          if (!isEmergencyActive && thirdPartyErsSupplier && !baseName.toLowerCase().includes(thirdPartyErsSupplier.toLowerCase())) {
            return `${baseName} + ERS ${thirdPartyErsSupplier}`;
          }
          return baseName;
        })(),
        homologatedPeakPowerHp: (() => {
          const m08Final = evaluatePowerUnit(
            vehicleParamsDraft,
            {
              rpm: 11600,
              throttleRatio: 1.0,
              vehicleSpeedMs: 75,
              ambientTempK: 298.15,
              airPressurePa: 101325,
              initialSoc01: 0.72,
              cycleDurationS: 5.0,
              regenPowerCommandW: 110000,
              deployCommandRatio: Math.max(0.25, Math.min(1.0, vehicleParamsDraft.ersDeployBiasPct / 85)),
              cumulativeRaceCycles: 120,
            },
            FIA_2026_DEFAULT_EDITION
          );
          const ersHarmonyPowerDeltaHp = activeErsHarmonyInfo ? Math.round(activeErsHarmonyInfo.delta * 0.75) : 0;
          const ersBonusHp =
            (activeThirdPartyErs?.pwrDelta ? Math.round(activeThirdPartyErs.pwrDelta * 2.4) : 0) +
            ersHarmonyPowerDeltaHp;
          const rawIceHp = Math.round((m08Final.shaftAndIce.icePowerW / 1000) * 1.34102209) + ersBonusHp;
          const adjIceHp = Math.round(rawIceHp * (1 + combinedLeadershipDna.puPowerDeltaPct / 100));
          return adjIceHp + Math.round(Math.min(350, vehicleParamsDraft.mgukMaxKw) * 1.34102209);
        })(),
        puDevelopmentCeilingPct:
          !isEmergencyActive && engineChoice === 'bought_factory'
            ? (thirdPartyErsSupplier ? 92 : 94)
            : 100,
        puCoolingAeroPenaltyPct:
          !isEmergencyActive && thirdPartyErsSupplier
            ? 3.0
            : (!isEmergencyActive && engineChoice === 'customer' ? 1.5 : 0),
        testResult
      });
      try {
        localStorage.removeItem('apex_f1_engine_locked');
      } catch (_) {}
    }
  };

  const prevStep = () => {
    playRadioSound();
    if (currentStep === 5 && puPhaseStage === 'dossier') {
      // Ponto de Não Retorno: O contrato de PU já foi homologado pela FIA
      return;
    }
    if (currentStep === 5 && puPhaseStage === 'phoenix_assembly') {
      setPuPhaseStage('select');
      return;
    }
    if (currentStep === 7) {
      if (chassisSubStep === 'dynamics') {
        setChassisSubStep('monocoque');
        return;
      }
      if (chassisSubStep === 'monocoque') {
        setChassisSubStep('packaging');
        return;
      }
      if (chassisSubStep === 'packaging') {
        setChassisSubStep('gearbox');
        return;
      }
    }
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      setShowExitConfirmModal(true);
    }
  };

  // 3. AÇÃO: Assinar Novo Registro FIA e Iniciar Temporada
  const handleConfirmWorksTeam = () => {
    playRadioSound();
    const trimmed = worksTeamNameInput.trim();
    if (trimmed) {
      setCustomTeamName(trimmed);
    }

    const nextPuStage = worksTeamPendingAction === 'phoenix' ? 'phoenix_assembly' : 'dossier';

    // Trava irreversível do motor no sistema
    try {
      localStorage.setItem('apex_f1_engine_locked', JSON.stringify({
        engineChoice: worksTeamPendingAction === 'factory' ? 'bought_factory' : 'phoenix',
        selectedFactoryId,
        customerSupplier,
        puStage: nextPuStage,
        locked: true
      }));
    } catch (_) {}

    setShowWorksTeamModal(false);
    setCurrentStep(5);
    setPuPhaseStage(nextPuStage);
  };

  const selectedTeamData = careerPath === 'real_team'
    ? allTeams.find(t => t.id === selectedRealTeamId) || allTeams[1]
    : {
        name: customTeamName,
        shortName: customTeamShort,
        color: customColor,
        location: selectedHq.name,
        carRating: 78
      };

  return (
    <div className="fixed inset-0 z-50 bg-[#15151E] text-[#F7F4F1] overflow-y-auto select-none flex flex-col justify-between">
      {/* Background Graphic Grid */}
      <div className="absolute inset-0 f1-pattern-micro-grid pointer-events-none opacity-80" />
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-[#E10600]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 border-b border-[#2C2C3A] bg-[#15151E]/95 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <F1Logo className="h-6" variant="red" />
            <div className="flex flex-col border-l border-white/10 pl-3">
              <span className="font-f1-wide font-black text-xs tracking-wider text-white">
                ROTEIRO DE INÍCIO · TEMPORADA 2026
              </span>
              <span className="font-f1-mono text-[10px] text-zinc-400">
                FASE {currentStep} DE 8
              </span>
            </div>
          </div>

          {/* Stepper Dots */}
          <div className="hidden sm:flex items-center gap-1.5 font-f1-mono text-xs">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(step => (
              <div
                key={step}
                className={`flex items-center justify-center w-6 h-6 text-[10px] font-bold border transition-colors ${
                  step === currentStep
                    ? 'border-[#E10600] bg-[#E10600] text-white'
                    : step < currentStep
                    ? 'border-emerald-500 bg-emerald-950/40 text-emerald-400'
                    : 'border-white/10 bg-[#1C1C26] text-zinc-500'
                }`}
              >
                0{step}
              </div>
            ))}
          </div>

          {/* Botão SAIR com Modal de Confirmação */}
          <button
            type="button"
            onClick={() => setShowExitConfirmModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C1C26] hover:bg-red-950/60 border border-white/10 hover:border-red-500/60 text-zinc-300 hover:text-white text-xs font-f1-wide font-bold uppercase transition-all tracking-wider cursor-pointer"
            title="Sair para o Menu Principal"
          >
            <LogOut className="w-3.5 h-3.5 text-red-500" />
            <span>SAIR</span>
          </button>
        </div>
      </header>

      {/* Persistent Season Budget Telemetry Strip (Fases 1 a 8) */}
      {(() => {
        const availableBudgetUsd = initialBudgetUsd;
        const lockedEngineCommitUsd =
          currentStep > 5 || (currentStep === 5 && puPhaseStage === 'dossier')
            ? (isEmergencyActive
                ? 20_000_000
                : engineChoice === 'bought_factory'
                ? 24_000_000
                : engineChoice === 'phoenix'
                ? 32_000_000
                : 0) +
              (ersSupplierCostUsd > 0 && prototypeCostSpent < ersSupplierCostUsd ? ersSupplierCostUsd : 0)
            : 0;
        const committedSpentUsd =
          prototypeCostSpent + productionCostSpent + gearboxCostSpent + lockedEngineCommitUsd;

        const sumStaffSalaries = (ids: Array<string | null>) =>
          ids.reduce((acc, id) => {
            if (!id) return acc;
            const st = ALL_STAFF_MEMBERS.find(s => s.id === id) || staff.find(s => s.id === id);
            return acc + (st?.salary || 0);
          }, 0);

        const sumDriverSalaries = (ids: Array<string | null>) =>
          ids.reduce((acc, id) => {
            if (!id) return acc;
            const drv = ALL_MARKET_DRIVERS.find(d => d.id === id) || drivers.find(d => d.id === id);
            if (!drv) return acc;
            return acc + (driverContractSalaries[id] || drv.salary || 0);
          }, 0);

        let phaseProjectionUsd = 0;
        let phaseProjectionLabel = `Projeção Fase 0${currentStep}`;

        if (currentStep === 1 || currentStep === 2) {
          phaseProjectionUsd = 0;
          phaseProjectionLabel = currentStep === 1 ? 'Base Orçamentária' : 'Teto FIA ($135M)';
        } else if (currentStep === 3) {
          phaseProjectionUsd = sumStaffSalaries([selectedHeadAero, selectedHeadPU, selectedSportingDirector]);
          phaseProjectionLabel = 'Folha Diretoria Técnica';
        } else if (currentStep === 4) {
          phaseProjectionUsd = 0;
          phaseProjectionLabel = 'Conceito M02 ($0)';
        } else if (currentStep === 5) {
          if (puPhaseStage === 'dossier') {
            phaseProjectionUsd = productionCostSpent === 0 ? custoProducaoTotal : 0;
            phaseProjectionLabel = productionCostSpent === 0 ? 'Lote Produção (8 UPs)' : 'Produção Homologada';
          } else {
            phaseProjectionUsd =
              (isEmergencyActive
                ? 20_000_000
                : engineChoice === 'bought_factory'
                ? 24_000_000
                : engineChoice === 'phoenix'
                ? 32_000_000
                : 15_000_000) + ersSupplierCostUsd;
            phaseProjectionLabel =
              engineChoice === 'customer' ? 'Contrato Cliente / Ano' : 'Aquisição / Fênix + ERS';
          }
        } else if (currentStep === 6) {
          phaseProjectionUsd =
            sumDriverSalaries([selectedDriver1, selectedDriver2, selectedReserveDriver]) +
            sumStaffSalaries([selectedRaceEngineer1, selectedRaceEngineer2, selectedChiefMechanic]);
          phaseProjectionLabel = 'Folha Pista (Pilotos + Box)';
        } else if (currentStep === 7) {
          phaseProjectionUsd = gearboxFinalized ? 0 : getGearboxSpecs().totalCost;
          phaseProjectionLabel = gearboxFinalized ? 'Câmbio Homologado' : 'Câmbio & Carcaça M09';
        } else if (currentStep === 8) {
          phaseProjectionUsd = currentWeeksRemaining < 0 && !abandonedToZero ? 1_500_000 : 0;
          phaseProjectionLabel = phaseProjectionUsd > 0 ? 'Multa / Logística Extra' : 'Testes Bahrein';
        }

        const remainingBalanceUsd = availableBudgetUsd - committedSpentUsd;
        const isNegative = remainingBalanceUsd < 0;
        const isTight = remainingBalanceUsd >= 0 && remainingBalanceUsd < 15_000_000;

        return (
          <div className="relative z-10 border-b border-[#2C2C3A] bg-[#101017]/95 px-6 py-2">
            <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-[11px] font-f1-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[#E10600] inline-block shrink-0" />
                <span className="font-f1-wide font-black text-[10px] tracking-widest text-zinc-300 uppercase">
                  ORÇAMENTO DA TEMPORADA
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 items-center">
                <div>
                  <span className="text-[9px] text-zinc-500 uppercase block">Verba Inicial</span>
                  <span className="text-white font-bold tabular-nums">
                    ${(availableBudgetUsd / 1_000_000).toFixed(1)}M
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 uppercase block">Comprometido</span>
                  <span className="text-amber-300 font-bold tabular-nums">
                    -${(committedSpentUsd / 1_000_000).toFixed(1)}M
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 uppercase block">{phaseProjectionLabel}</span>
                  <span className="text-cyan-300 font-bold tabular-nums">
                    ${(phaseProjectionUsd / 1_000_000).toFixed(1)}M
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 uppercase block">Saldo Disponível</span>
                  <span
                    className={`font-f1-wide font-black tabular-nums ${
                      isNegative ? 'text-red-400' : isTight ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    ${(remainingBalanceUsd / 1_000_000).toFixed(1)}M
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Step Content Canvas */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-8 flex-1 w-full">
        {/* ========================================================== */}
        {/* STEP 1: A ESCOLHA DO LEGADO                                */}
        {/* ========================================================== */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-f1-mono text-[#E10600] font-bold tracking-widest uppercase">
                FASE 1: ESCOLHA DO LEGADO & CARREIRA
              </span>
              <h2 className="font-f1-wide font-black text-2xl sm:text-3xl text-white uppercase">
                Defina o seu papel na Fórmula 1®
              </h2>
              <p className="text-sm text-zinc-400">
                A sua relação com o conselho administrativo e as regras de demissão variam radicalmente entre assumir uma equipe histórica ou construir a 12ª construtora.
              </p>
            </div>

            {/* Path Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Path A */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setCareerPath('real_team')}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setCareerPath('real_team');
                  }
                }}
                className={`p-5 text-left border transition-all cursor-pointer select-none ${
                  careerPath === 'real_team'
                    ? 'bg-[#1C1C26] border-[#E10600] ring-1 ring-[#E10600] shadow-lg'
                    : 'bg-[#15151E] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 bg-white/10 text-white font-f1-mono text-[10px] font-bold uppercase">
                    CAMINHO A
                  </span>
                  <Briefcase className="w-5 h-5 text-[#E10600]" />
                </div>
                <h3 className="font-f1-wide font-black text-lg text-white uppercase">
                  Assumir uma Equipe Real (As 11 do Grid)
                </h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Você é contratado como <span className="text-white font-bold">Team Principal</span>. Herda instalações de alto nível, os pilotos e o DNA histórico da escuderia.
                </p>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-3 min-h-[30px]">
                  <span className="text-[11px] font-f1-mono text-zinc-400 whitespace-nowrap overflow-hidden text-ellipsis">
                    Estatuto de Governança & Demissão
                  </span>
                  <F1HelpTooltip
                    title="Regra de Carreira & Conselho"
                    ruleCode="FIA ART. 2.1 · GOVERNANÇA"
                    badge="DEMISSÃO ATIVA"
                    badgeType="danger"
                    description="Ao assumir uma equipe oficial existente do grid, você atua sob contrato profissional como Team Principal contratado pelo Conselho Administrativo da montadora."
                    warning="⚠️ RISCO DE DEMISSÃO: Se os resultados em pista caírem drasticamente ou a confiança do conselho e a moral da equipe despencarem, você poderá ser demitido no decorrer da temporada."
                    details={[
                      'Metas de construtores revisadas periodicamente',
                      'Confiança do conselho varia de 0 a 100%',
                      'Herda DNA, fábrica e pilotos já contratados'
                    ]}
                    position="top-right"
                  />
                </div>
              </div>

              {/* Path B */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setCareerPath('custom_team')}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setCareerPath('custom_team');
                  }
                }}
                className={`p-5 text-left border transition-all cursor-pointer select-none ${
                  careerPath === 'custom_team'
                    ? 'bg-[#1C1C26] border-[#E10600] ring-1 ring-[#E10600] shadow-lg'
                    : 'bg-[#15151E] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 bg-[#E10600] text-white font-f1-mono text-[10px] font-bold uppercase">
                    CAMINHO B (RECOMENDADO)
                  </span>
                  <Crown className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="font-f1-wide font-black text-lg text-white uppercase">
                  Criar uma Equipe do Zero (A 12ª Construtora)
                </h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Você entra como <span className="text-white font-bold">Dono / Proprietário</span>. Começa do galpão Nível 1, define identidade, sede e cores.
                </p>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-3 min-h-[30px]">
                  <span className="text-[11px] font-f1-mono text-zinc-400 whitespace-nowrap overflow-hidden text-ellipsis">
                    Estatuto de Construtor & Franquia
                  </span>
                  <F1HelpTooltip
                    title="Status de Construtor & Propriedade"
                    ruleCode="FIA ART. 1.4 · CONCESSÃO 12ª EQUIPE"
                    badge="IMUNIDADE TOTAL"
                    badgeType="success"
                    description="Você entra como Dono / Proprietário majoritário da 12ª construtora. Você detém a titularidade das ações e do direito comercial da vaga no grid."
                    warning="🛡️ IMUNIDADE COMPLETA: O conselho não pode demiti-lo. Caso deseje gerenciar outra equipe no futuro, será obrigatório antes liquidar ou vender a sua escuderia no mercado."
                    details={[
                      'Liberdade total de identidade, sede e cores',
                      'Começa no galpão Nível 1 com evolução aberta',
                      'Controle irrestrito sobre contratações e demissões'
                    ]}
                    position="top-right"
                  />
                </div>
              </div>
            </div>

            {/* Customizer Sub-panel */}
            {careerPath === 'real_team' ? (
              <div className="bg-[#1C1C26] p-5 border border-white/10 space-y-4">
                <label className="text-xs font-f1-wide font-bold text-white uppercase block">
                  Selecione a Escuderia do Grid para Comandar
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {allTeams.filter(t => t.id !== 'apex').map(team => (
                    <button
                      key={team.id}
                      onClick={() => setSelectedRealTeamId(team.id)}
                      className={`p-3 text-left border text-xs transition-all ${
                        selectedRealTeamId === team.id
                          ? 'border-[#E10600] bg-white/10 text-white font-bold'
                          : 'border-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="w-3 h-1.5 mb-1.5" style={{ backgroundColor: team.color }} />
                      <div className="font-f1-wide uppercase truncate">{team.shortName} · {team.name}</div>
                      <div className="text-[10px] font-f1-mono text-zinc-400 mt-0.5">Motor: {team.engineSupplier}</div>
                    </button>
                  ))}
                </div>

                {/* ========================================================================= */}
                {/* 🖥️ TELA DE PERFIL DA EQUIPE: O DOSSIÊ DO TEAM PRINCIPAL                 */}
                {/* ========================================================================= */}
                <div className="bg-[#15151E] border-2 border-white/15 p-5 space-y-6 f1-container-roof shadow-2xl relative overflow-hidden">
                  {/* Subtle livery stripe on top */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ backgroundColor: selectedTeamDossier.color }}
                  />

                  {/* 1. CABEÇALHO (A Identidade) */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3.5">
                      <div
                        className="w-14 h-14 border border-white/20 flex flex-col items-center justify-center font-f1-wide font-black text-xl text-white shadow-lg shrink-0"
                        style={{ backgroundColor: selectedTeamDossier.color }}
                      >
                        {selectedTeamDossier.shortName}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xl">{selectedTeamDossier.flagEmoji}</span>
                          <span className="font-f1-mono text-xs text-zinc-400 uppercase tracking-wider">
                            {selectedTeamDossier.location}
                          </span>
                          <span className="px-2 py-0.5 bg-white/10 text-zinc-300 font-f1-mono text-[10px] font-bold uppercase">
                            MODELO: {selectedTeamDossier.carModel}
                          </span>
                        </div>
                        <h3 className="font-f1-wide font-black text-2xl text-white uppercase tracking-tight mt-0.5">
                          {selectedTeamDossier.officialFullName}
                        </h3>
                      </div>
                    </div>

                    <div className="flex flex-col md:items-end gap-1.5 shrink-0">
                      <div className="flex items-center gap-2 text-xs font-f1-mono text-amber-300 bg-amber-950/30 border border-amber-500/40 px-3 py-1 font-bold">
                        <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>{selectedTeamDossier.constructorTitles} Construtores</span>
                        <span className="text-zinc-600">|</span>
                        <span>{selectedTeamDossier.driverTitles} Pilotos</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-f1-mono">
                        <span className="text-zinc-400">Reputação:</span>
                        <span className="text-emerald-400 font-bold uppercase">
                          {selectedTeamDossier.reputationLabel}
                        </span>
                      </div>
                      <div className="text-[10px] font-f1-mono text-zinc-400 bg-black/40 px-2.5 py-0.5 border border-white/10">
                        🎯 <span className="text-white font-bold">Meta:</span> {selectedTeamDossier.boardExpectation}
                      </div>
                    </div>
                  </div>

                  {/* 2. COLUNA ESQUERDA & DIREITA (DNA, HISTÓRIA & O PLANTEL) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* COLUNA ESQUERDA: DNA E HISTÓRIA (O Passado e o Presente) - 6 cols */}
                    <div className="lg:col-span-6 space-y-4">
                      <div className="space-y-2">
                        <span className="text-[10px] font-f1-mono text-[#E10600] font-bold uppercase tracking-wider block">
                          [ HISTÓRIA & IDENTIDADE DA ESCUDERIA ]
                        </span>
                        <p className="text-xs text-zinc-300 font-light leading-relaxed italic border-l-2 border-[#E10600] pl-3 py-0.5 bg-white/[0.02]">
                          "{selectedTeamDossier.historicalIntro}"
                        </p>
                      </div>

                      {/* DNA Fixo da Equipe */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-f1-mono text-zinc-400 font-bold uppercase tracking-wider block">
                          DNA Histórico da Equipe (Modificadores Fixos)
                        </span>
                        <div className="space-y-2">
                          {selectedTeamDossier.fixedDnaTags.map((dna, idx) => (
                            <div
                              key={idx}
                              className={`p-2.5 border text-xs font-f1-mono space-y-1 ${
                                dna.type === 'positive'
                                  ? 'bg-emerald-950/20 border-emerald-500/30'
                                  : dna.type === 'negative'
                                  ? 'bg-red-950/20 border-red-500/30'
                                  : 'bg-white/5 border-white/10'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span>{dna.icon}</span>
                                <span className="font-bold text-white uppercase text-[11px]">
                                  {dna.label}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-400 leading-snug pl-6">
                                {dna.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Status da Diretoria */}
                      <div className="bg-amber-950/20 border border-amber-500/40 p-3 text-xs font-f1-mono space-y-1">
                        <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase text-[10px]">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Status do Conselho Administrativo</span>
                        </div>
                        <p className="text-zinc-300 text-[11px] leading-relaxed">
                          {selectedTeamDossier.boardStatus}
                        </p>
                      </div>
                    </div>

                    {/* COLUNA DIREITA: O PLANTEL (Pessoas e Ativos) - 6 cols */}
                    <div className="lg:col-span-6 space-y-4">
                      {/* Pilotos Atuais */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-f1-mono text-zinc-400 font-bold uppercase tracking-wider">
                            Plantel de Pilotos Herdado
                          </span>
                          <span className="text-[10px] font-f1-mono text-cyan-400">
                            {selectedTeamDossier.drivers.length} Pilotos Ativos
                          </span>
                        </div>

                        <div className="space-y-2">
                          {selectedTeamDossier.drivers.map((drv, idx) => (
                            <div
                              key={idx}
                              className="bg-[#1C1C26] border border-white/10 p-3 flex items-center justify-between gap-3 text-xs font-f1-mono hover:border-white/20 transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-black/60 border border-white/10 flex items-center justify-center font-f1-wide font-black text-xs text-white">
                                  #{drv.number}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-white font-bold font-f1-wide uppercase text-xs">
                                      {drv.name}
                                    </span>
                                    <span className="text-[9px] px-1.5 py-0.2 bg-white/10 text-zinc-400 uppercase">
                                      {drv.role}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-zinc-400 mt-0.5">
                                    Foco: <span className="text-zinc-300">{drv.focus}</span> · Contrato: <span className="text-cyan-400 font-bold">{drv.contractUntil}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="text-[9px] text-zinc-500 uppercase block">Overall</span>
                                <span className={`font-f1-wide font-black text-sm ${
                                  drv.rating >= 90 ? 'text-amber-400' : drv.rating >= 80 ? 'text-emerald-400' : 'text-zinc-300'
                                }`}>
                                  {drv.rating}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Equipe Técnica Herdada */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-f1-mono text-zinc-400 font-bold uppercase tracking-wider block">
                          Corpo Técnico em Exercício
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-f1-mono">
                          {selectedTeamDossier.technicalStaff.map((staff, idx) => (
                            <div key={idx} className="bg-[#1C1C26] border border-white/5 p-2.5 space-y-0.5">
                              <span className="text-[9px] text-cyan-400 uppercase font-bold block">
                                {staff.role}
                              </span>
                              <span className="text-white font-bold text-[11px] block truncate">
                                {staff.name}
                              </span>
                              <span className="text-[9px] text-zinc-400 block truncate">
                                {staff.focus}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. RODAPÉ (A Máquina: Relatório de Telemetria do Carro e Motor) */}
                  <div className="bg-[#111118] border border-white/15 p-4 sm:p-5 space-y-4 f1-container-frame">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <Gauge className="w-5 h-5 text-cyan-400 shrink-0" />
                        <div>
                          <span className="font-f1-wide font-black text-sm text-white uppercase tracking-wider block">
                            Dossiê de Telemetria · Ponto de Partida 2026
                          </span>
                          <span className="text-[10px] font-f1-mono text-zinc-400">
                            Diagnóstico Técnico Confidencial de Fábrica
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-black/60 border border-white/10 text-cyan-400 font-f1-mono text-[10px] font-bold uppercase">
                        FORNECEDOR: {selectedTeamDossier.powerUnitSupplier} ({selectedTeamDossier.powerUnitType})
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* UNIDADE DE POTÊNCIA (O Motor) */}
                      <div className="space-y-3">
                        <span className="text-xs font-f1-mono text-emerald-400 font-bold uppercase tracking-wider block flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 shrink-0" />
                          UNIDADE DE POTÊNCIA (O MOTOR 2026)
                        </span>

                        <div className="space-y-2.5 bg-[#171722] p-3 border border-white/5">
                          {selectedTeamDossier.puMetrics.map((metric, idx) => (
                            <div key={idx} className="space-y-1 text-xs font-f1-mono">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-zinc-300 font-bold">{metric.label}</span>
                                <span className={`text-[10px] font-bold ${
                                  metric.status === 'good' ? 'text-emerald-400' : metric.status === 'warning' ? 'text-amber-400' : 'text-red-400'
                                }`}>
                                  {metric.tierText}
                                </span>
                              </div>
                              <div className="w-full bg-black/60 h-2 border border-white/10 overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-500 ${
                                    metric.status === 'good' ? 'bg-emerald-400' : metric.status === 'warning' ? 'bg-amber-400' : 'bg-red-400'
                                  }`}
                                  style={{ width: `${metric.value}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* DESEMPENHO DO CHASSI (O Carro Atual) */}
                      <div className="space-y-3">
                        <span className="text-xs font-f1-mono text-cyan-400 font-bold uppercase tracking-wider block flex items-center gap-1.5">
                          <Wind className="w-3.5 h-3.5 shrink-0" />
                          DESEMPENHO DO CHASSI & AERODINÂMICA
                        </span>

                        <div className="space-y-2.5 bg-[#171722] p-3 border border-white/5">
                          {selectedTeamDossier.chassisMetrics.map((metric, idx) => (
                            <div key={idx} className="space-y-1 text-xs font-f1-mono">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-zinc-300 font-bold">{metric.label}</span>
                                <span className={`text-[10px] font-bold ${
                                  metric.status === 'good' ? 'text-emerald-400' : metric.status === 'warning' ? 'text-amber-400' : 'text-red-400'
                                }`}>
                                  {metric.tierText}
                                </span>
                              </div>
                              <div className="w-full bg-black/60 h-2 border border-white/10 overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-500 ${
                                    metric.status === 'good' ? 'bg-cyan-400' : metric.status === 'warning' ? 'bg-amber-400' : 'bg-red-400'
                                  }`}
                                  style={{ width: `${metric.value}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Vantagens e Vulnerabilidades */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs font-f1-mono border-t border-white/5">
                      <div className="bg-emerald-950/20 border border-emerald-500/30 p-2.5">
                        <span className="text-emerald-400 font-bold uppercase text-[10px] block">
                          🛡️ Vantagem Competitiva Herdada:
                        </span>
                        <p className="text-zinc-300 text-[11px] leading-relaxed mt-0.5">
                          {selectedTeamDossier.tacticalAdvantage}
                        </p>
                      </div>

                      <div className="bg-red-950/20 border border-red-500/30 p-2.5">
                        <span className="text-red-400 font-bold uppercase text-[10px] block">
                          ⚠️ Vulnerabilidade Crítica de Início de Temporada:
                        </span>
                        <p className="text-zinc-300 text-[11px] leading-relaxed mt-0.5">
                          {selectedTeamDossier.tacticalVulnerability}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 5. BOTÃO DE AÇÃO (O Contrato) */}
                  <div className="bg-black/50 border border-white/15 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <span className="text-xs font-f1-mono font-bold text-amber-300 uppercase block flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                        AVISO OFICIAL DE GOVERNANÇA & DEMISSÃO
                      </span>
                      <p className="text-[11px] font-f1-mono text-zinc-400 leading-snug">
                        {selectedTeamDossier.boardWarning}
                      </p>
                    </div>

                    <button
                      onClick={nextStep}
                      className="px-6 py-3.5 bg-[#E10600] hover:bg-[#B30500] text-white font-f1-wide font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(225,6,0,0.4)] flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                    >
                      <span>{selectedTeamDossier.contractSignText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Team Principal Profile & DNA Inicial (Real Team) */}
                <div className="pt-3 border-t border-white/5 space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-f1-wide font-bold text-white uppercase block mb-1">
                        Seu Nome (Team Principal Contratado)
                      </label>
                      <input
                        type="text"
                        value={principalName}
                        onChange={e => setPrincipalName(e.target.value)}
                        className="w-full bg-[#15151E] border border-white/10 px-3 py-2 text-xs text-white font-f1-mono focus:border-[#E10600] focus:outline-none"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-f1-wide font-bold text-white uppercase block">
                          Seu Histórico Pessoal (DNA de Chefe)
                        </label>
                        <span className="text-[10px] font-f1-mono text-zinc-400">
                          6 Perfis de Carreira
                        </span>
                      </div>
                      <select
                        value={principalBackground}
                        onChange={e => setPrincipalBackground(e.target.value as PrincipalBackgroundId)}
                        className="w-full bg-[#15151E] border border-white/15 px-3 py-2 text-xs text-white font-f1-mono focus:border-[#E10600] focus:outline-none cursor-pointer"
                      >
                        {PRINCIPAL_BACKGROUNDS.map((bg, idx) => (
                          <option key={bg.id} value={bg.id}>
                            {idx + 1}. {bg.name} (Foco: {bg.focus})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Visual Tags & Detailed Impact Card (Bonus in Green, Onus in Red) */}
                  <div className="bg-[#15151E] border border-white/10 p-3.5 space-y-3 f1-container-roof">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-[#E10600] inline-block shrink-0" />
                        <div>
                          <span className="font-f1-wide font-black text-sm text-white uppercase block">
                            {selectedBackground.name}
                          </span>
                          <span className="text-[10px] font-f1-mono text-zinc-400">
                            Foco: {selectedBackground.focus}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-f1-mono text-zinc-300 bg-white/5 border border-white/10 px-2 py-0.5 uppercase tracking-wider font-bold">
                        {selectedBackground.badge}
                      </span>
                    </div>

                    {/* Vibe Callout */}
                    <div className="bg-black/30 border-l-2 border-amber-400 px-3 py-1.5 text-[11px] font-f1-mono text-amber-300 italic">
                      <span className="font-bold text-amber-400 not-italic uppercase text-[10px] mr-1.5">[VIBE]:</span>
                      {selectedBackground.vibe}
                    </div>

                    {/* BÔNUS (VERDE) & ÔNUS (VERMELHO) TAGS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Bônus Tag */}
                      <div className="bg-emerald-950/50 border border-emerald-500/50 p-2.5 space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-f1-mono font-bold text-[10px] uppercase tracking-wider">
                          <span className="w-2 h-2 bg-emerald-400 inline-block shrink-0" />
                          <span>BÔNUS DO PERFIL</span>
                        </div>
                        <p className="text-xs font-f1-mono text-emerald-300 font-bold leading-snug">
                          {selectedBackground.bonus}
                        </p>
                      </div>

                      {/* Ônus Tag */}
                      <div className="bg-red-950/50 border border-red-500/50 p-2.5 space-y-1">
                        <div className="flex items-center gap-1.5 text-red-400 font-f1-mono font-bold text-[10px] uppercase tracking-wider">
                          <span className="w-2 h-2 bg-red-400 inline-block shrink-0" />
                          <span>ÔNUS DO PERFIL</span>
                        </div>
                        <p className="text-xs font-f1-mono text-red-300 font-bold leading-snug">
                          {selectedBackground.onus}
                        </p>
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-400 font-light leading-relaxed border-t border-white/5 pt-2">
                      {selectedBackground.description}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#1C1C26] p-5 border border-white/10 space-y-5">
                {/* Team Name and Short Code */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-f1-wide font-bold text-white uppercase block mb-1">
                      Nome da Construtora
                    </label>
                    <input
                      type="text"
                      value={customTeamName}
                      onChange={e => setCustomTeamName(e.target.value)}
                      className="w-full bg-[#15151E] border border-white/10 px-3 py-2 text-xs text-white font-f1-mono focus:border-[#E10600] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-f1-wide font-bold text-white uppercase block mb-1">
                      Sigla Oficial (3 Letras)
                    </label>
                    <input
                      type="text"
                      maxLength={3}
                      value={customTeamShort}
                      onChange={e => setCustomTeamShort(e.target.value.toUpperCase())}
                      className="w-full bg-[#15151E] border border-white/10 px-3 py-2 text-xs text-white font-f1-mono uppercase focus:border-[#E10600] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Sede Tecnológica (Expanded 10 Locations with Bonus & Onus) */}
                <div className="space-y-2.5 pt-1 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-f1-wide font-bold text-white uppercase block">
                      Sede Tecnológica (Base Operacional)
                    </label>
                    <span className="text-[10px] font-f1-mono text-zinc-400">
                      10 Polos Globais de Engenharia
                    </span>
                  </div>

                  <select
                    value={selectedHqId}
                    onChange={e => setSelectedHqId(e.target.value)}
                    className="w-full bg-[#15151E] border border-white/15 px-3 py-2.5 text-xs text-white font-f1-mono focus:border-[#E10600] focus:outline-none cursor-pointer"
                  >
                    {HEADQUARTERS_OPTIONS.map(hq => (
                      <option key={hq.id} value={hq.id}>
                        {hq.flagEmoji} {hq.name}
                      </option>
                    ))}
                  </select>

                  {/* Modificadores de Bônus e Ônus Exibidos Abaixo do Menu */}
                  <div className="p-4 bg-[#15151E] border border-white/10 space-y-3 f1-tab-chamfer">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{selectedHq.flagEmoji}</span>
                        <div>
                          <span className="font-f1-wide font-black text-xs sm:text-sm text-white uppercase tracking-wider block">
                            {selectedHq.name}
                          </span>
                          <span className="text-[10px] font-f1-mono text-zinc-400">
                            Polo Industrial F1 · {selectedHq.country}
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] font-f1-mono bg-white/5 border border-white/10 text-zinc-300 px-2 py-0.5 font-bold uppercase shrink-0">
                        MODIFICADORES DE POLO
                      </span>
                    </div>

                    {/* Bonus & Onus Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* BÔNUS */}
                      <div className="bg-emerald-950/30 border border-emerald-500/40 p-3 space-y-1 f1-container-frame">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-f1-mono font-bold text-[10px] uppercase tracking-wider">
                          <span className="w-2 h-2 bg-emerald-400 inline-block shrink-0" />
                          <span>BÔNUS TÉCNICO</span>
                        </div>
                        <p className="text-xs font-f1-mono text-emerald-200 font-bold leading-snug">
                          {selectedHq.bonus}
                        </p>
                      </div>

                      {/* ÔNUS */}
                      <div className="bg-amber-950/30 border border-amber-500/40 p-3 space-y-1 f1-container-frame">
                        <div className="flex items-center gap-1.5 text-amber-400 font-f1-mono font-bold text-[10px] uppercase tracking-wider">
                          <span className="w-2 h-2 bg-amber-400 inline-block shrink-0" />
                          <span>ÔNUS OPERACIONAL</span>
                        </div>
                        <p className="text-xs font-f1-mono text-amber-200 font-bold leading-snug">
                          {selectedHq.onus}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-[#1C1C26] border border-white/10 p-2.5 flex items-center justify-between text-xs font-f1-mono">
                        <span className="text-zinc-400 uppercase text-[10px]">Custo Logístico Anual:</span>
                        <span className="text-cyan-400 font-bold tabular-nums">
                          ${(selectedHq.modifiers.logisticsAnnualCostM ?? 5.0).toFixed(1)}M/ano
                        </span>
                      </div>
                      <div className="bg-[#1C1C26] border border-white/10 p-2.5 flex items-center justify-between text-xs font-f1-mono">
                        <span className="text-zinc-400 uppercase text-[10px]">Apelo p/ Staff Europeu:</span>
                        <span
                          className={`font-bold tabular-nums ${
                            (selectedHq.modifiers.europeanStaffAppeal ?? 0) >= 10
                              ? 'text-emerald-400'
                              : (selectedHq.modifiers.europeanStaffAppeal ?? 0) < 0
                              ? 'text-amber-400'
                              : 'text-white'
                          }`}
                        >
                          {(selectedHq.modifiers.europeanStaffAppeal ?? 0) > 0
                            ? `+${selectedHq.modifiers.europeanStaffAppeal}%`
                            : `${selectedHq.modifiers.europeanStaffAppeal ?? 0}%`}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-400 font-light leading-relaxed border-t border-white/5 pt-2">
                      {selectedHq.description}
                    </p>
                  </div>
                </div>

                {/* Team Principal Profile & DNA Inicial (10 Comprehensive Profiles) */}
                <div className="pt-3 border-t border-white/5 space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-f1-wide font-bold text-white uppercase block mb-1">
                        Seu Nome (Dono / Team Principal)
                      </label>
                      <input
                        type="text"
                        value={principalName}
                        onChange={e => setPrincipalName(e.target.value)}
                        className="w-full bg-[#15151E] border border-white/10 px-3 py-2 text-xs text-white font-f1-mono focus:border-[#E10600] focus:outline-none"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-f1-wide font-bold text-white uppercase block">
                          Seu Histórico (DNA Inicial)
                        </label>
                        <span className="text-[10px] font-f1-mono text-zinc-400">
                          6 Perfis de Carreira
                        </span>
                      </div>
                      <select
                        value={principalBackground}
                        onChange={e => setPrincipalBackground(e.target.value as PrincipalBackgroundId)}
                        className="w-full bg-[#15151E] border border-white/15 px-3 py-2 text-xs text-white font-f1-mono focus:border-[#E10600] focus:outline-none cursor-pointer"
                      >
                        {PRINCIPAL_BACKGROUNDS.map((bg, idx) => (
                          <option key={bg.id} value={bg.id}>
                            {idx + 1}. {bg.name} (Foco: {bg.focus})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Visual Tags & Detailed Impact Card (Bonus in Green, Onus in Red) */}
                  <div className="bg-[#15151E] border border-white/10 p-3.5 space-y-3 f1-container-roof">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-[#E10600] inline-block shrink-0" />
                        <div>
                          <span className="font-f1-wide font-black text-sm text-white uppercase block">
                            {selectedBackground.name}
                          </span>
                          <span className="text-[10px] font-f1-mono text-zinc-400">
                            Foco: {selectedBackground.focus}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-f1-mono text-zinc-300 bg-white/5 border border-white/10 px-2 py-0.5 uppercase tracking-wider font-bold">
                        {selectedBackground.badge}
                      </span>
                    </div>

                    {/* Vibe Callout */}
                    <div className="bg-black/30 border-l-2 border-amber-400 px-3 py-1.5 text-[11px] font-f1-mono text-amber-300 italic">
                      <span className="font-bold text-amber-400 not-italic uppercase text-[10px] mr-1.5">[VIBE]:</span>
                      {selectedBackground.vibe}
                    </div>

                    {/* BÔNUS (VERDE) & ÔNUS (VERMELHO) TAGS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Bônus Tag (Verde Esmeralda) */}
                      <div className="bg-emerald-950/50 border border-emerald-500/50 p-2.5 space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-f1-mono font-bold text-[10px] uppercase tracking-wider">
                          <span className="w-2 h-2 bg-emerald-400 inline-block shrink-0" />
                          <span>BÔNUS DO PERFIL</span>
                        </div>
                        <p className="text-xs font-f1-mono text-emerald-300 font-bold leading-snug">
                          {selectedBackground.bonus}
                        </p>
                      </div>

                      {/* Ônus Tag (Vermelho Rubro) */}
                      <div className="bg-red-950/50 border border-red-500/50 p-2.5 space-y-1">
                        <div className="flex items-center gap-1.5 text-red-400 font-f1-mono font-bold text-[10px] uppercase tracking-wider">
                          <span className="w-2 h-2 bg-red-400 inline-block shrink-0" />
                          <span>ÔNUS DO PERFIL</span>
                        </div>
                        <p className="text-xs font-f1-mono text-red-300 font-bold leading-snug">
                          {selectedBackground.onus}
                        </p>
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-400 font-light leading-relaxed border-t border-white/5 pt-2">
                      {selectedBackground.description}
                    </p>
                  </div>

                  {/* ========================================================================= */}
                  {/* PAINEL DE RESUMO DA NOVA EQUIPE (12ª VAGA) & META-GAME DE SINERGIA       */}
                  {/* ========================================================================= */}
                  <div className={`p-4 sm:p-5 border-2 space-y-4 shadow-2xl relative overflow-hidden transition-all duration-300 ${
                    liveSynergy.type === 'perfect_synergy'
                      ? 'bg-[#121E19]/90 border-emerald-500/60 shadow-[0_0_35px_rgba(16,185,129,0.15)]'
                      : liveSynergy.type === 'mitigation'
                      ? 'bg-[#101C24]/90 border-cyan-500/60 shadow-[0_0_35px_rgba(6,182,212,0.15)]'
                      : liveSynergy.type === 'hardcore'
                      ? 'bg-[#221215]/90 border-red-500/60 shadow-[0_0_35px_rgba(239,68,68,0.2)]'
                      : 'bg-[#1E1B14]/90 border-amber-500/60 shadow-[0_0_35px_rgba(245,158,11,0.15)]'
                  }`}>
                    {/* Top status bar indicator */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 font-f1-mono text-[9px] font-black uppercase tracking-wider bg-white/10 text-white">
                            RESUMO DA NOVA EQUIPE (12ª VAGA)
                          </span>
                          <span className={`px-2.5 py-0.5 font-f1-mono text-[9px] font-black uppercase tracking-wider rounded-none ${
                            liveSynergy.type === 'perfect_synergy'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50'
                              : liveSynergy.type === 'mitigation'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                              : liveSynergy.type === 'hardcore'
                              ? 'bg-red-500/20 text-red-300 border border-red-400/50'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                          }`}>
                            {liveSynergy.typeBadge}
                          </span>
                        </div>
                        <h4 className="font-f1-wide font-black text-lg sm:text-xl text-white uppercase tracking-tight">
                          "{liveSynergy.paddockLabel}"
                        </h4>
                        <p className="text-[11px] font-f1-mono text-zinc-400">
                          {selectedHq.name} + {selectedBackground.name}
                        </p>
                      </div>

                      <div className="bg-black/50 border border-white/15 px-3.5 py-2 text-right shrink-0">
                        <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block tracking-wider">
                          Caixa Inicial Efetivo:
                        </span>
                        <span className="font-f1-wide font-black text-xl text-emerald-400 tracking-wider">
                          {liveSynergy.initialCashFormatted}
                        </span>
                      </div>
                    </div>

                    {/* Metric Bars: Tecnologia, Marketing, Moral */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Tecnologia */}
                      <div className="bg-[#15151E] border border-white/10 p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs font-f1-mono">
                          <span className="text-zinc-400 uppercase text-[10px] font-bold">Tecnologia & P&D</span>
                          <span className="text-cyan-300 font-bold font-f1-wide">{liveSynergy.techRating}/100</span>
                        </div>
                        <div className="w-full bg-white/5 h-2 rounded-none overflow-hidden border border-white/10">
                          <div
                            className="bg-cyan-400 h-full transition-all duration-500"
                            style={{ width: `${liveSynergy.techRating}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-f1-mono text-zinc-400 block truncate">
                          Sede: {selectedHq.name.split(',')[0]} + {selectedBackground.bonusShort}
                        </span>
                      </div>

                      {/* Marketing */}
                      <div className="bg-[#15151E] border border-white/10 p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs font-f1-mono">
                          <span className="text-zinc-400 uppercase text-[10px] font-bold">Marketing & Mídia</span>
                          <span className="text-amber-300 font-bold font-f1-wide">{liveSynergy.marketingRating}/100</span>
                        </div>
                        <div className="w-full bg-white/5 h-2 rounded-none overflow-hidden border border-white/10">
                          <div
                            className="bg-amber-400 h-full transition-all duration-500"
                            style={{ width: `${liveSynergy.marketingRating}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-f1-mono text-zinc-400 block truncate">
                          Projeção de Patrocínios e Fãs
                        </span>
                      </div>

                      {/* Moral */}
                      <div className="bg-[#15151E] border border-white/10 p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs font-f1-mono">
                          <span className="text-zinc-400 uppercase text-[10px] font-bold">Moral da Equipe</span>
                          <span className="text-emerald-300 font-bold font-f1-wide">{liveSynergy.moraleRating}/100</span>
                        </div>
                        <div className="w-full bg-white/5 h-2 rounded-none overflow-hidden border border-white/10">
                          <div
                            className="bg-emerald-400 h-full transition-all duration-500"
                            style={{ width: `${liveSynergy.moraleRating}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-f1-mono text-zinc-400 block truncate">
                          Clima da fábrica e sinergia de boxes
                        </span>
                      </div>
                    </div>

                    {/* Dossiê Narrativo de Sinergia */}
                    <div className={`p-3.5 border ${
                      liveSynergy.type === 'perfect_synergy'
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                        : liveSynergy.type === 'mitigation'
                        ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200'
                        : liveSynergy.type === 'hardcore'
                        ? 'bg-red-950/40 border-red-500/50 text-red-200'
                        : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                    } space-y-1.5`}>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="font-f1-wide font-black text-xs uppercase tracking-wider text-white">
                          💡 SINERGIA DETECTADA
                        </span>
                      </div>
                      <p className="text-xs font-f1-mono leading-relaxed italic">
                        "{liveSynergy.summaryQuote}"
                      </p>
                    </div>

                    {/* Vantagens e Riscos Operacionais */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-f1-mono">
                      <div className="bg-[#15151E] border border-emerald-500/30 p-3 space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase text-[10px]">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Vantagens Estratégicas</span>
                        </div>
                        <p className="text-zinc-300 text-[11px] leading-relaxed">
                          {liveSynergy.prosText}
                        </p>
                      </div>

                      <div className="bg-[#15151E] border border-amber-500/30 p-3 space-y-1">
                        <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase text-[10px]">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Riscos & Teto de Custos</span>
                        </div>
                        <p className="text-zinc-300 text-[11px] leading-relaxed">
                          {liveSynergy.risksText}
                        </p>
                      </div>
                    </div>

                    {/* Roadmap Tático de 5 a 7 Temporadas */}
                    <div className="bg-black/50 border border-white/10 p-3 flex items-start gap-2.5 text-xs font-f1-mono">
                      <Target className="w-4 h-4 text-[#E10600] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-white font-f1-wide font-bold uppercase text-[10px] tracking-wider block">
                          Caminho para o Título (Estratégia de Longo Prazo · 5 a 7 Anos):
                        </span>
                        <p className="text-zinc-300 text-[11px] leading-relaxed mt-0.5">
                          {liveSynergy.fiveYearRoadmapAdvice}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================== */}
        {/* STEP 2: A REUNIÃO COM A FIA                                */}
        {/* ========================================================== */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-f1-mono text-[#E10600] font-bold tracking-widest uppercase">
                FASE 2: CONFERÊNCIA OFICIAL NA FIA (PLACE DE LA CONCORDE)
              </span>
              <h2 className="font-f1-wide font-black text-2xl sm:text-3xl text-white uppercase">
                Apresentação do Regulamento & Carta do Conselho
              </h2>
              <p className="text-sm text-zinc-400">
                A Federação Internacional do Automóvel ratifica formalmente a sua entrada e entrega o dossiê do Teto de Gastos de $135M.
              </p>
            </div>

            {/* Official FIA Certificate */}
            <div className="bg-[#1C1C26] border-2 border-white/10 p-6 f1-container-roof relative overflow-hidden space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center font-f1-wide font-black text-[#E10600]">
                    FIA
                  </div>
                  <div>
                    <h3 className="font-f1-wide font-black text-base text-white uppercase">
                      CERTIFICADO DE CONFORMIDADE TÉCNICA 2026
                    </h3>
                    <span className="text-[10px] font-f1-mono text-zinc-400">
                      HOMOLOGAÇÃO REGULATÓRIA GLOBAL · FIA FORMULA ONE WORLD CHAMPIONSHIP
                    </span>
                  </div>
                </div>
                <span className="text-xs font-f1-mono text-emerald-400 font-bold border border-emerald-500/30 px-2.5 py-1">
                  APROVADO
                </span>
              </div>

              {/* 2026 Technical Pillars Presentation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-f1-mono">
                <div className="bg-[#15151E] p-3 border border-white/5 space-y-1">
                  <span className="text-[#E10600] font-bold block">1. PU 50/50 HÍBRIDA</span>
                  <p className="text-zinc-300">
                    V6 1.6L Térmico + 350kW ERS Elétrico. Extinção do MGU-H. Combustível 100% sustentável.
                  </p>
                </div>
                <div className="bg-[#15151E] p-3 border border-white/5 space-y-1">
                  <span className="text-[#E10600] font-bold block">2. ASAS ATIVAS</span>
                  <p className="text-zinc-300">
                    Modo X em retas (baixo arrasto) e Modo Z em curvas (alta carga aerodinâmica).
                  </p>
                </div>
                <div className="bg-[#15151E] p-3 border border-white/5 space-y-1">
                  <span className="text-[#E10600] font-bold block">3. COST CAP $135M</span>
                  <p className="text-zinc-300">
                    Auditoria legal rigorosa com penalidades severas caso o teto seja violado.
                  </p>
                </div>
              </div>

              {/* Card de Destaque: TETO DE CUSTOS E COMPLIANCE FIA 2026 */}
              <div className="bg-[#15151E] border border-[#E10600]/40 p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#E10600]" />
                    <h4 className="font-f1-wide font-black text-xs sm:text-sm text-white uppercase tracking-wider">
                      REGULAMENTO FINANCEIRO E TETO DE CUSTOS (COST CAP FIA 2026)
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-f1-mono">
                    <span className="text-zinc-400">PERFIL DE COMANDO:</span>
                    <span className="text-white font-bold uppercase">{selectedBackground.name}</span>
                  </div>
                </div>

                {/* Barra Única: Teto de Gastos (Cost Cap) */}
                <div className="bg-[#1C1C26] border border-white/10 p-4 space-y-2.5 font-f1-mono">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-zinc-200 font-bold uppercase">
                      Teto de Gastos Oficial (Cost Cap FIA)
                    </span>
                    <span className="text-base font-f1-wide font-black text-white tabular-nums">
                      $135.0M <span className="text-[10px] font-f1-mono text-zinc-400 font-normal">(Teto Regulamentar)</span>
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-black/70 border border-white/10 overflow-hidden">
                    <div className="h-full bg-[#E10600] transition-all duration-300" style={{ width: '0%' }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-400">
                      Auditoria obrigatória sobre desenvolvimento, manufatura, peças e operações da temporada 2026.
                    </span>
                    <span className="text-emerald-400 font-bold tabular-nums whitespace-nowrap">0% Utilizado</span>
                  </div>
                </div>

                {/* Nota de Aviso em Vermelho */}
                <div className="bg-red-950/60 border border-red-500/60 p-3 flex items-start gap-2.5 text-xs font-f1-mono text-red-300">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed font-medium text-red-200">
                    Pressão Regulamentar: Contratos de motor, desenvolvimento de peças e operações consomem este limite anual. Ultrapassar o Cost Cap resultará em perda imediata de pontos no Campeonato de Construtores. O aporte financeiro do Conselho será definido na próxima fase.
                  </p>
                </div>
              </div>

              {/* Board Directives Card */}
              <div className="bg-[#15151E] p-4 border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-xs font-f1-wide font-bold text-white uppercase">
                  <FileText className="w-4 h-4 text-[#E10600]" />
                  <span>Carta de Diretrizes Regulamentares da FIA</span>
                </div>
                <p className="text-xs text-zinc-200 leading-relaxed font-f1-mono">
                  "Sua licença de construtor está homologada para 2026. Na etapa seguinte, alinhe com o Conselho o nível de investimento inicial, as metas esportivas e contrate os 3 Pilares Técnicos da organização."
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* STEP 3: ORGANIZAÇÃO, DNA, DIRETORIA E 3 PILARES TÉCNICOS   */}
        {/* ========================================================== */}
        {currentStep === 3 && (
          <Step3OrganizationAndStaff
            careerPath={careerPath}
            teamName={careerPath === 'custom_team' ? customTeamName : (allTeams.find(t => t.id === selectedRealTeamId)?.name || 'Equipe')}
            realTeamReputation={realTeamReputation}
            selectedHq={selectedHq}
            selectedBackground={selectedBackground}
            projectAmbition={projectAmbition}
            onSelectProjectAmbition={setProjectAmbition}
            selectedHeadAero={selectedHeadAero}
            selectedHeadPU={selectedHeadPU}
            selectedSportingDirector={selectedSportingDirector}
            onToggleStaff={staffObj => {
              playRadioSound();
              if (staffObj.role === 'head_aero') {
                setSelectedHeadAero(prev => (prev === staffObj.id ? null : staffObj.id));
              } else if (staffObj.role === 'head_pu') {
                setSelectedHeadPU(prev => (prev === staffObj.id ? null : staffObj.id));
              } else if (staffObj.role === 'sporting_director' || staffObj.role === 'head_management') {
                setSelectedSportingDirector(prev => (prev === staffObj.id ? null : staffObj.id));
              } else if (staffObj.role === 'chief_mechanic' || staffObj.role === 'head_mechanics') {
                setSelectedChiefMechanic(prev => (prev === staffObj.id ? null : staffObj.id));
              }
            }}
            onExpandStaff={setExpandedStaffProfile}
            onPlaySound={playRadioSound}
          />
        )}

        {/* ========================================================== */}
        {/* STEP 5: ESCOLHA DA PU, MONTAGEM FÊNIX & DOSSIÊ/DINAMÔMETRO */}
        {/* ========================================================== */}
        {currentStep === 5 && puPhaseStage !== 'dossier' && (
          <div className="space-y-6">
            {puPhaseStage === 'select' ? (
              <>
                <div className="space-y-1">
                  <span className="text-xs font-f1-mono text-[#E10600] font-bold tracking-widest uppercase">
                    FASE 5 · ETAPA 01: ESCOLHA DA UNIDADE DE POTÊNCIA (PU)
                  </span>
                  <h2 className="font-f1-wide font-black text-2xl sm:text-3xl text-white uppercase">
                    O Motor Certo para o Conceito Aprovado
                  </h2>
                  <p className="text-sm text-zinc-400">
                    Com o conceito do carro definido na Fase 4 e sua diretoria técnica reunida, escolha a Unidade de Potência 2026 que melhor atende ao empacotamento, refrigeração e metas do projeto:
                  </p>
                </div>

                {/* Reunião Técnica à Mesa com Seu Staff */}
                {(() => {
                  const approvedPhilCode = normalizeToM02Philosophy(philosophy);
                  const puMeetingAdvice = getPuRecommendationForCarPhilosophy({
                    philosophyCode: approvedPhilCode,
                    headPu: hiredHeadPuObj,
                    headAero: hiredHeadAeroObj,
                    engineOrigin: engineChoice,
                    customerSupplier,
                    selectedFactoryName: AVAILABLE_FACTORIES[selectedFactoryId].name,
                    selectedFactoryWeeks: AVAILABLE_FACTORIES[selectedFactoryId].integrationWeeks
                  });
                  return (
                    <div className="bg-[#181822] border border-cyan-500/35 p-4 space-y-3 f1-pattern-micro-grid">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-cyan-400" />
                          <span className="font-f1-wide font-black text-xs text-white uppercase tracking-wider">
                            REUNIÃO TÉCNICA À MESA · ESCOLHA DE MOTOR PARA: {puMeetingAdvice.philosophyName.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-[10px] font-f1-mono text-amber-300 bg-amber-950/50 border border-amber-500/35 px-2 py-0.5 uppercase font-bold">
                          META DO CONSELHO: {ambitionSpec.boardExpectationText}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-f1-mono">
                        <div className="bg-[#12121A] border border-white/10 p-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-emerald-400 font-bold uppercase text-[10px]">
                              CHEFE DE PU · {hiredHeadPuObj?.name || 'Engenheiro de Propulsão'}
                            </span>
                            <span className="text-[10px] text-zinc-400 tabular-nums">OVR {hiredHeadPuObj?.rating || 75}</span>
                          </div>
                          <p className="text-zinc-300 leading-relaxed text-[11px]">
                            {puMeetingAdvice.puChiefAdvice}
                          </p>
                        </div>
                        <div className="bg-[#12121A] border border-white/10 p-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-cyan-400 font-bold uppercase text-[10px]">
                              CHEFE DE AERO · {hiredHeadAeroObj?.name || 'Diretor Aerodinâmico'}
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              {hiredHeadAeroObj ? getStaffFullProfile(hiredHeadAeroObj).designDna : 'Aero Balanceado'}
                            </span>
                          </div>
                          <p className="text-zinc-300 leading-relaxed text-[11px]">
                            {puMeetingAdvice.aeroChiefAdvice}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Alerta do Relógio da Pré-Temporada (Time Budget) */}
                <div className={`p-4 border font-f1-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  currentWeeksRemaining >= 0
                    ? 'bg-[#1C1C26] border-white/10 text-zinc-300'
                    : 'bg-red-950/40 border-[#E10600] text-red-300'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <Calendar className={`w-4 h-4 shrink-0 ${currentWeeksRemaining >= 0 ? 'text-cyan-400' : 'text-[#E10600]'}`} />
                    <div>
                      <span className="font-bold text-white uppercase block">
                        RELÓGIO DA PRÉ-TEMPORADA (ORÇAMENTO FIA: 8 SEMANAS BASE)
                      </span>
                      <span>
                        Faltam <span className={`font-bold ${currentWeeksRemaining >= 0 ? 'text-emerald-400' : 'text-red-400 font-f1-wide text-sm'}`}>{currentWeeksRemaining} semanas</span> para os testes. O tempo de integração da sua fábrica consumiu <span className="text-white font-bold">{integrationWeeks} semanas</span>.
                      </span>
                    </div>
                  </div>
                  {currentWeeksRemaining < 0 && (
                    <span className="px-2.5 py-1 bg-[#E10600] text-white font-f1-wide text-[10px] uppercase font-bold shrink-0">
                      CRONOGRAMA ESTOURADO · PRÉ-TEMPORADA PERDIDA
                    </span>
                  )}
                </div>

                {/* 3 Engine Origin Paths (Mantendo layout atual das 3 opções) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Option 1: Cliente */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setEngineChoice('customer')}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setEngineChoice('customer');
                      }
                    }}
                    className={`p-5 text-left border transition-all flex flex-col justify-between cursor-pointer select-none ${
                      engineChoice === 'customer'
                        ? 'bg-[#1C1C26] border-[#E10600] ring-1 ring-[#E10600] shadow-lg'
                        : 'bg-[#15151E] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block mb-1">OPÇÃO 01</span>
                      <h3 className="font-f1-wide font-black text-base text-white uppercase">
                        Cliente de Montadora
                      </h3>
                      <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                        Motor pronto e homologado por uma grande fornecedora. Zero atraso na entrega, mas você não pode evoluir o motor internamente.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
                      <span className="text-[11px] font-f1-mono text-emerald-400">
                        Zero Atraso · Homologação Pronta
                      </span>
                      <F1HelpTooltip
                        title="Unidade de Potência Cliente"
                        ruleCode="REGRA TÉCNICA · FIA PU ART. 5"
                        badge="HOMOLOGAÇÃO DIRETA"
                        badgeType="success"
                        description="Recebe a especificação idêntica à da fábrica oficial. Você economiza tempo de P&D e recursos de manufatura, focando 100% no chassi e na aerodinâmica."
                        warning="RESTRIÇÃO DE HOMOLOGAÇÃO: Não é permitido alterar mapas elétricos internos ou a arquitetura térmica do bloco sem anuência da montadora matriz."
                        position="top-right"
                      />
                    </div>
                  </div>

                  {/* Option 2: Comprar Fábrica */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setEngineChoice('bought_factory');
                      applyFactoryDna(selectedFactoryId);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setEngineChoice('bought_factory');
                        applyFactoryDna(selectedFactoryId);
                      }
                    }}
                    className={`p-5 text-left border transition-all flex flex-col justify-between cursor-pointer select-none ${
                      engineChoice === 'bought_factory'
                        ? 'bg-[#1C1C26] border-[#E10600] ring-1 ring-[#E10600] shadow-lg'
                        : 'bg-[#15151E] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-f1-mono text-amber-400 uppercase block mb-1">OPÇÃO 02</span>
                      <h3 className="font-f1-wide font-black text-base text-white uppercase">
                        Comprar Fábrica de Motores
                      </h3>
                      <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                        Adquire uma divisão industrial de ponta (ex: Cosworth / Mecachrome). Você ganha status de <span className="text-white font-bold">Montadora</span> e pode evoluir o motor.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
                      <span className="text-[11px] font-f1-mono text-amber-400">
                        1 Sem. Integração · $12M
                      </span>
                      <F1HelpTooltip
                        title="Aquisição Industrial de Motores"
                        ruleCode="FIA ART. 3.2 · MONTADORA"
                        badge="STATUS CONSTRUTOR PU"
                        badgeType="warning"
                        description="Sua equipe assume uma fábrica estabelecida no mercado. Garante independência total de desenvolvimento e a faculdade de fornecer motores a outras escuderias."
                        warning="CUSTO DE TRANSIÇÃO: Exige 1 semana para calibrar as bancadas de teste da fábrica adquirida e auditar o inventário metalúrgico."
                        position="top-right"
                      />
                    </div>
                  </div>

                  {/* Option 3: Projeto Fênix */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setEngineChoice('phoenix')}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setEngineChoice('phoenix');
                      }
                    }}
                    className={`p-5 text-left border transition-all flex flex-col justify-between cursor-pointer select-none ${
                      engineChoice === 'phoenix'
                        ? 'bg-[#1C1C26] border-[#E10600] ring-1 ring-[#E10600] shadow-lg'
                        : 'bg-[#15151E] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-f1-mono text-[#E10600] uppercase block mb-1">OPÇÃO 03 (EXTREMO)</span>
                      <h3 className="font-f1-wide font-black text-base text-white uppercase">
                        Do Zero: Protocolo Fênix
                      </h3>
                      <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                        Projeta o motor 2026 100% in-house. Controle total de tamanho e refrigeração, mas altíssimo risco de atrasar e perder o início da temporada!
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
                      <span className="text-[11px] font-f1-mono text-red-400">
                        Risco Real de Atraso
                      </span>
                      <F1HelpTooltip
                        title="Protocolo Fênix (Motor Próprio do Zero)"
                        ruleCode="DIRETRIZ FÊNIX · ALTO RISCO"
                        badge="P&D INDEPENDENTE"
                        badgeType="danger"
                        description="Concepção 100% autônoma do V6 1.6L e do ERS de 350kW. Máximo teto de performance possível, desenhado sob medida para o seu chassi."
                        warning="⚠️ PERIGO DE ATRASO: Há risco real de a PU não ficar pronta a tempo para os testes de pré-temporada no Bahrein, forçando a equipe a perder as primeiras rodadas do calendário."
                        position="top-right"
                      />
                    </div>
                    {engineChoice === 'phoenix' && (
                      <div className="mt-3 p-2.5 bg-red-950/60 border border-red-500/60 text-[10px] font-f1-mono text-red-200">
                        <strong className="text-red-300 uppercase block mb-0.5">⚠️ ALERTA DE TETO DE GASTOS:</strong>
                        Seu Teto de Gastos restante será de $85M. Você precisará contratar pilotos e staff de baixo custo para não falir.
                      </div>
                    )}
                  </div>
                </div>

                {/* 1. ABA DE CLIENTES (SELEÇÃO DOS 6 MOTORES) */}
                {engineChoice === 'customer' && (
                  <div className="bg-[#1C1C26] p-5 border border-white/10 space-y-5 f1-pattern-micro-grid">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-f1-wide font-black text-white uppercase block tracking-wider">
                          Escolha o Fornecedor Oficial de Motores 2026
                        </span>
                        <span className="text-[10px] font-f1-mono text-zinc-400">
                          5 Fornecedores Homologados pela FIA
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        Selecione a montadora parceira para analisar a telemetria, curva de potência e prós/contras técnicos de 2026:
                      </p>
                    </div>

                    {/* Grade dos 5 Motores */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                      {(['Mercedes', 'Ferrari', 'Red Bull-Ford', 'Honda', 'Audi'] as CustomerEngineSupplier[]).map(sup => {
                        const engine = CUSTOMER_ENGINES[sup];
                        const isSelected = customerSupplier === sup;
                        const fit = evaluatePuFitWithPhilosophy({
                          philosophyCode: normalizeToM02Philosophy(philosophy),
                          supplierOrFactoryId: sup,
                          isFactory: false
                        });
                        return (
                          <button
                            key={sup}
                            onClick={() => {
                              playRadioSound();
                              setCustomerSupplier(sup);
                            }}
                            className={`p-3 text-left border transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'border-[#E10600] bg-[#252533] ring-1 ring-[#E10600] shadow-md'
                                : 'border-white/10 bg-[#15151E] hover:border-white/20 hover:bg-[#1a1a24]'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-[10px] font-f1-mono font-bold uppercase ${isSelected ? 'text-[#E10600]' : 'text-zinc-400'}`}>
                                  {sup === 'Red Bull-Ford' ? 'RB-FORD' : sup.toUpperCase()}
                                </span>
                                <span className="text-[9px] font-f1-mono text-zinc-400">
                                  2026
                                </span>
                              </div>
                              <div className="font-f1-wide uppercase font-black text-xs text-white truncate">
                                {sup}
                              </div>
                              <div
                                className={`text-[9px] font-f1-mono font-bold mt-1 ${
                                  fit.fitTone === 'emerald'
                                    ? 'text-emerald-400'
                                    : fit.fitTone === 'amber'
                                    ? 'text-amber-400'
                                    : 'text-cyan-400'
                                }`}
                              >
                                {fit.fitLabel}
                              </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-white/5 text-[9px] font-f1-mono text-zinc-400 space-y-0.5 tabular-nums">
                              <div className="flex justify-between"><span>POT:</span><span className="text-white font-bold">{engine.power}</span></div>
                              <div className="flex justify-between"><span>REL:</span><span className="text-emerald-400 font-bold">{engine.reliability}%</span></div>
                              <div className="flex justify-between"><span>E-FUEL:</span><span className="text-lime-400 font-bold">{engine.fuelEfficiency}</span></div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Painel Inferior de Detalhes: Barras de Atributos + Prós / Contras + Botão de Confirmação */}
                    {(() => {
                      const sel = CUSTOMER_ENGINES[customerSupplier];
                      const selectedFit = evaluatePuFitWithPhilosophy({
                        philosophyCode: normalizeToM02Philosophy(philosophy),
                        supplierOrFactoryId: customerSupplier,
                        isFactory: false
                      });
                      return (
                        <div className="bg-[#15151E] p-5 border border-white/10 space-y-5 f1-container-roof">
                          {/* Header do Motor Selecionado */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 bg-[#E10600] inline-block shrink-0" />
                              <h3 className="font-f1-wide font-black text-sm sm:text-base text-white uppercase tracking-wider">
                                {sel.fullName}
                              </h3>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-f1-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-0.5 uppercase tracking-wider font-bold">
                                {sel.badge}
                              </span>
                              <span className="text-[10px] font-f1-mono text-zinc-300 bg-white/5 border border-white/10 px-2 py-0.5">
                                {sel.costText}
                              </span>
                            </div>
                          </div>

                          {/* 2 Colunas: Barras de Progresso (Esquerda) vs Prós e Contras (Direita) */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Coluna Esquerda: Barras de Progresso */}
                            <div className="space-y-3 bg-[#1C1C26] p-4 border border-white/5">
                              <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block font-bold tracking-wider">
                                ATRIBUTOS TÉCNICOS DA UNIDADE DE POTÊNCIA (FIA 2026)
                              </span>

                              {/* Barra de Potência */}
                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-xs font-f1-mono">
                                  <span className="text-zinc-300 font-bold">POTÊNCIA DE PICO (TÉRMICA + 350kW ERS)</span>
                                  <span className="text-white font-bold tabular-nums">{sel.power} / 100</span>
                                </div>
                                <div className="h-2.5 w-full bg-black/50 border border-white/10 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-amber-500 to-[#E10600] transition-all duration-300"
                                    style={{ width: `${sel.power}%` }}
                                  />
                                </div>
                                <span className="text-[9px] font-f1-mono text-zinc-400 block">
                                  Deploy instantâneo de 350kW na reta principal e entrega de cavalaria do V6 Turbo.
                                </span>
                              </div>

                              {/* Barra de Confiabilidade */}
                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-xs font-f1-mono">
                                  <span className="text-zinc-300 font-bold">CONFIABILIDADE TÉRMICA & MECÂNICA</span>
                                  <span className="text-emerald-400 font-bold tabular-nums">{sel.reliability} / 100</span>
                                </div>
                                <div className="h-2.5 w-full bg-black/50 border border-white/10 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300"
                                    style={{ width: `${sel.reliability}%` }}
                                  />
                                </div>
                                <span className="text-[9px] font-f1-mono text-zinc-400 block">
                                  Resistência ao estresse cíclico e tolerância de componentes a falhas térmicas.
                                </span>
                              </div>

                              {/* Barra de Eficiência de Combustível */}
                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-xs font-f1-mono">
                                  <span className="text-zinc-300 font-bold">EFICIÊNCIA DE COMBUSTÍVEL (100% E-FUEL)</span>
                                  <span className="text-lime-400 font-bold tabular-nums">{sel.fuelEfficiency} / 100</span>
                                </div>
                                <div className="h-2.5 w-full bg-black/50 border border-white/10 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-emerald-700 to-lime-400 transition-all duration-300"
                                    style={{ width: `${sel.fuelEfficiency}%` }}
                                  />
                                </div>
                                <span className="text-[9px] font-f1-mono text-zinc-400 block">
                                  Rendimento e economia do combustível sustentável de fluxo limitado a 70kg/h.
                                </span>
                              </div>

                              {/* Barra de Gestão de Energia (ERS) */}
                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-xs font-f1-mono">
                                  <span className="text-zinc-300 font-bold">GESTÃO DE ENERGIA (ERS 350kW)</span>
                                  <span className="text-indigo-400 font-bold tabular-nums">{sel.ersManagement} / 100</span>
                                </div>
                                <div className="h-2.5 w-full bg-black/50 border border-white/10 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-blue-700 to-indigo-400 transition-all duration-300"
                                    style={{ width: `${sel.ersManagement}%` }}
                                  />
                                </div>
                                <span className="text-[9px] font-f1-mono text-zinc-400 block">
                                  Recuperação em frenagens e consistência na entrega dos 350kW da bateria.
                                </span>
                              </div>

                              {/* Barra de Peso */}
                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-xs font-f1-mono">
                                  <span className="text-zinc-300 font-bold">ÍNDICE DE LEVEZA & COMPACTAÇÃO (PESO)</span>
                                  <span className="text-cyan-400 font-bold tabular-nums">{sel.weight} / 100</span>
                                </div>
                                <div className="h-2.5 w-full bg-black/50 border border-white/10 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-300"
                                    style={{ width: `${sel.weight}%` }}
                                  />
                                </div>
                                <span className="text-[9px] font-f1-mono text-zinc-400 block">
                                  Densidade estrutural e espaço liberado para túneis aerodinâmicos do assoalho.
                                </span>
                              </div>
                            </div>

                            {/* Coluna Direita: Prós e Contras */}
                            <div className="space-y-3.5 flex flex-col justify-between">
                              <div className="space-y-3">
                                {/* Prós (Verde) */}
                                <div className="bg-emerald-950/40 border border-emerald-500/40 p-3.5 space-y-1.5">
                                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[10px] uppercase tracking-wider">
                                    <span className="w-2 h-2 bg-emerald-400 inline-block shrink-0" />
                                    <span>PRÓS (DADOS REAIS FIA 2026)</span>
                                  </div>
                                  <p className="text-xs font-bold text-emerald-300 leading-relaxed">
                                    {sel.pros}
                                  </p>
                                </div>

                                {/* Contras (Vermelho) */}
                                <div className="bg-red-950/40 border border-red-500/40 p-3.5 space-y-1.5">
                                  <div className="flex items-center gap-1.5 text-red-400 font-bold text-[10px] uppercase tracking-wider">
                                    <span className="w-2 h-2 bg-red-400 inline-block shrink-0" />
                                    <span>CONTRAS (DESVANTAGENS TÉCNICAS)</span>
                                  </div>
                                  <p className="text-xs font-bold text-red-300 leading-relaxed">
                                    {sel.cons}
                                  </p>
                                </div>
                              </div>

                              <div className="text-[11px] font-f1-mono text-zinc-300 bg-[#1C1C26] p-3 border border-white/10 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] uppercase font-bold text-zinc-400">
                                    COMPATIBILIDADE C/ CONCEITO DA FASE 4:
                                  </span>
                                  <span
                                    className={`font-bold ${
                                      selectedFit.fitTone === 'emerald'
                                        ? 'text-emerald-400'
                                        : selectedFit.fitTone === 'amber'
                                        ? 'text-amber-400'
                                        : 'text-cyan-400'
                                    }`}
                                  >
                                    {selectedFit.fitLabel}
                                  </span>
                                </div>
                                <p className="text-zinc-300">{selectedFit.reason}</p>
                                <div className="text-zinc-400 pt-1 border-t border-white/5">
                                  Homologação 2026: Ao confirmar o motor da <span className="text-white font-bold">{customerSupplier}</span>, o gabarito traseiro é liberado para a Fase 6 (Pista) e CAD na Fase 7.
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Botão de Confirmação Direta para Dossiê / Gabarito */}
                          <div className="pt-2 border-t border-white/5">
                            <button
                              onClick={() => {
                                playRadioSound();
                                const supDna = getSupplierDnaSpec(customerSupplier);
                                updateVehicleParamsDraft({
                                  iceMaterial: ICE_METALLURGY_2026[supDna.defaultIceMetallurgy].legacyIceMaterial,
                                  iceMetallurgyId: supDna.defaultIceMetallurgy,
                                  turboDiameterMm: customerSupplier === 'Ferrari' ? 80 : customerSupplier === 'Audi' ? 98 : 88,
                                  batteryCellTech: supDna.defaultBatteryTech,
                                  batterySubChemistry: supDna.defaultBatterySubChem,
                                  ersDeployBiasPct: customerSupplier === 'Mercedes' ? 62 : customerSupplier === 'Ferrari' ? 68 : 55
                                });
                                try {
                                  localStorage.setItem('apex_f1_engine_locked', JSON.stringify({
                                    engineChoice: 'customer',
                                    customerSupplier,
                                    selectedFactoryId,
                                    puStage: 'dossier',
                                    locked: true
                                  }));
                                } catch (_) {}
                                setPuPhaseStage('dossier');
                              }}
                              className="w-full py-3.5 bg-[#E10600] hover:bg-[#c20500] text-white font-f1-wide font-black text-xs sm:text-sm uppercase tracking-wider f1-tab-chamfer transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                            >
                              <Cpu className="w-4 h-4" />
                              <span>CONFIRMAR MOTOR E INICIAR GABARITO</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* 2. SE FOR COMPRAR FÁBRICA */}
                {engineChoice === 'bought_factory' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-xs font-f1-mono text-zinc-400 uppercase tracking-wider font-bold">
                        SELEÇÃO DE FÁBRICA INDUSTRIAL DISPONÍVEL PARA AQUISIÇÃO (5 OPÇÕES)
                      </span>
                      <span className="text-[10px] font-f1-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 border border-amber-500/30">
                        DIREITO DE PROPRIEDADE INDUSTRIAL & GABARITO FÍSICO
                      </span>
                    </div>

                    {/* Grade de 5 Fábricas */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                      {(Object.keys(AVAILABLE_FACTORIES) as EngineFactoryId[]).map(fid => {
                        const factory = AVAILABLE_FACTORIES[fid];
                        const isSelected = selectedFactoryId === fid;
                        const fit = evaluatePuFitWithPhilosophy({
                          philosophyCode: normalizeToM02Philosophy(philosophy),
                          supplierOrFactoryId: fid,
                          isFactory: true
                        });
                        return (
                          <div
                            key={fid}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              playRadioSound();
                              setSelectedFactoryId(fid);
                              applyFactoryDna(fid);
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                playRadioSound();
                                setSelectedFactoryId(fid);
                                applyFactoryDna(fid);
                              }
                            }}
                            className={`p-3 text-left border transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'bg-[#1C1C26] border-[#E10600] ring-1 ring-[#E10600] shadow-lg shadow-[#E10600]/20'
                                : 'bg-[#15151E] border-white/10 hover:border-white/20'
                            }`}
                          >
                            <div className="space-y-1">
                              <span className="text-[9px] font-f1-mono text-zinc-400 uppercase tracking-widest block font-bold">
                                {factory.statusTag}
                              </span>
                              <div className="font-f1-wide font-black text-sm text-white uppercase">
                                {factory.name}
                              </div>
                              <div
                                className={`text-[9px] font-f1-mono font-bold ${
                                  fit.fitTone === 'emerald'
                                    ? 'text-emerald-400'
                                    : fit.fitTone === 'amber'
                                    ? 'text-amber-400'
                                    : 'text-cyan-400'
                                }`}
                              >
                                {fit.fitLabel}
                              </div>
                            </div>
                            <div className="pt-2 mt-2 border-t border-white/5 space-y-0.5">
                              <div className="flex items-center justify-between text-[11px] font-f1-mono tabular-nums">
                                <span className="text-emerald-400 font-bold">${factory.costM}M</span>
                                <span className="text-zinc-400">{factory.integrationWeeks} Semanas</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Painel de Detalhes da Fábrica Selecionada */}
                    {(() => {
                      const selFactory = AVAILABLE_FACTORIES[selectedFactoryId];
                      const factoryFit = evaluatePuFitWithPhilosophy({
                        philosophyCode: normalizeToM02Philosophy(philosophy),
                        supplierOrFactoryId: selectedFactoryId,
                        isFactory: true
                      });
                      return (
                        <div className="bg-[#15151E] p-5 border border-white/10 space-y-5 f1-pattern-micro-grid">
                          {/* Header do Painel */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-f1-mono bg-[#E10600] text-white px-2 py-0.5 font-bold uppercase tracking-wider">
                                  {selFactory.statusTag}
                                </span>
                                <span className="text-xs font-f1-mono text-zinc-400">
                                  {selFactory.location}
                                </span>
                              </div>
                              <h3 className="font-f1-wide font-black text-xl text-white uppercase tracking-wider mt-1">
                                {selFactory.fullName}
                              </h3>
                            </div>
                            <div className="text-left sm:text-right shrink-0">
                              <span className="text-[10px] font-f1-mono text-zinc-400 block uppercase">VALOR DE AQUISIÇÃO</span>
                              <span className="font-f1-wide font-black text-lg text-emerald-400">${selFactory.costM}M</span>
                              <span className="text-[10px] font-f1-mono text-zinc-400 block">
                                Prazo de Integração: <span className="text-white font-bold">{selFactory.integrationWeeks} Semanas</span>
                              </span>
                            </div>
                          </div>

                          {/* 2 Colunas: Barras Técnicas (Esquerda) vs Análise & Logística (Direita) */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Coluna Esquerda: Barras de Atributos Técnicos */}
                            <div className="space-y-3.5 bg-[#1C1C26] p-4 border border-white/5">
                              <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block font-bold tracking-wider">
                                ATRIBUTOS TÉCNICOS & CAPACIDADE FABRIL (FIA 2026)
                              </span>

                              {/* Potencial de Performance (PWR) */}
                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-xs font-f1-mono">
                                  <span className="text-zinc-300 font-bold">POTENCIAL DE PERFORMANCE (PWR)</span>
                                  <span className="text-white font-bold tabular-nums">{selFactory.pwr} / 100</span>
                                </div>
                                <div className="h-2.5 w-full bg-black/50 border border-white/10 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-amber-500 to-[#E10600] transition-all duration-300"
                                    style={{ width: `${selFactory.pwr}%` }}
                                  />
                                </div>
                                <span className="text-[9px] font-f1-mono text-zinc-400 block">
                                  Teto máximo de desenvolvimento térmico e potência de pico alcançável na bancada.
                                </span>
                              </div>

                              {/* Confiabilidade Base (REL) */}
                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-xs font-f1-mono">
                                  <span className="text-zinc-300 font-bold">CONFIABILIDADE BASE HERDADA (REL)</span>
                                  <span className="text-emerald-400 font-bold tabular-nums">{selFactory.rel} / 100</span>
                                </div>
                                <div className="h-2.5 w-full bg-black/50 border border-white/10 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300"
                                    style={{ width: `${selFactory.rel}%` }}
                                  />
                                </div>
                                <span className="text-[9px] font-f1-mono text-zinc-400 block">
                                  Estado de integridade mecânica dos motores e ferramentais herdados.
                                </span>
                              </div>

                              {/* Maturidade da Fábrica (NIF) */}
                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-xs font-f1-mono">
                                  <span className="text-zinc-300 font-bold">MATURIDADE DA FÁBRICA (NIF)</span>
                                  <span className="text-cyan-400 font-bold tabular-nums">
                                    {selFactory.nif.toFixed(1)} / 5.0
                                  </span>
                                </div>
                                <div className="h-2.5 w-full bg-black/50 border border-white/10 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-blue-700 via-cyan-500 to-cyan-300 transition-all duration-300"
                                    style={{ width: `${(selFactory.nif / 5) * 100}%` }}
                                  />
                                </div>
                                <span className="text-[9px] font-f1-mono text-zinc-400 block">
                                  Qualidade das bancadas de fluxo, fundição de precisão e maquinário CNC de 5 eixos.
                                </span>
                              </div>
                            </div>

                            {/* Coluna Direita: Prós, Contras e Fator Logístico */}
                            <div className="space-y-3 flex flex-col justify-between">
                              <div className="space-y-3">
                                {/* Prós */}
                                <div className="bg-emerald-950/20 border border-emerald-500/20 p-3 space-y-1">
                                  <div className="flex items-center gap-1.5 text-emerald-400 font-f1-mono text-xs font-bold uppercase">
                                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                                    <span>VANTAGEM ESTRATÉGICA (PRÓS)</span>
                                  </div>
                                  <p className="text-xs text-emerald-200/90 leading-relaxed font-sans pl-5">
                                    {selFactory.pros}
                                  </p>
                                </div>

                                {/* Contras */}
                                <div className="bg-rose-950/20 border border-rose-500/20 p-3 space-y-1">
                                  <div className="flex items-center gap-1.5 text-rose-400 font-f1-mono text-xs font-bold uppercase">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    <span>DESAFIO TÉCNICO (CONTRAS)</span>
                                  </div>
                                  <p className="text-xs text-rose-200/90 leading-relaxed font-sans pl-5">
                                    {selFactory.cons}
                                  </p>
                                </div>

                                {/* Aviso Logístico (Amarelo) */}
                                <div className="bg-amber-950/25 border border-amber-500/30 p-3 space-y-1">
                                  <div className="flex items-center gap-1.5 text-amber-400 font-f1-mono text-xs font-bold uppercase">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    <span>AVISO LOGÍSTICO & ADUANEIRO</span>
                                  </div>
                                  <p className="text-xs text-amber-200/95 leading-relaxed font-sans pl-5">
                                    {selFactory.logisticWarning}
                                  </p>
                                </div>
                              </div>

                              <div className="text-[11px] font-f1-mono text-zinc-300 bg-[#1C1C26] p-3 border border-white/10 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] uppercase font-bold text-zinc-400">
                                    COMPATIBILIDADE C/ CONCEITO DA FASE 4:
                                  </span>
                                  <span
                                    className={`font-bold ${
                                      factoryFit.fitTone === 'emerald'
                                        ? 'text-emerald-400'
                                        : factoryFit.fitTone === 'amber'
                                        ? 'text-amber-400'
                                        : 'text-cyan-400'
                                    }`}
                                  >
                                    {factoryFit.fitLabel}
                                  </span>
                                </div>
                                <p className="text-zinc-300">{factoryFit.reason}</p>
                                <div className="text-zinc-400 pt-1 border-t border-white/5">
                                  Homologação 2026: Ao confirmar a aquisição de <span className="text-white font-bold">{selFactory.fullName}</span>, sua equipe assume a propriedade intelectual e libera o gabarito para a Fase 6 e Fase 7.
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Botão de Confirmação Direta para Dossiê / Bancada */}
                          <div className="pt-2 border-t border-white/5">
                            <button
                              onClick={() => {
                                playRadioSound();
                                setWorksTeamPendingAction('factory');
                                setWorksTeamNameInput(
                                  customTeamName
                                    ? (customTeamName.includes('Powertrains') || customTeamName.includes('Works')
                                        ? customTeamName
                                        : `${customTeamName} Powertrains`)
                                    : 'Apex Powertrains'
                                );
                                setShowWorksTeamModal(true);
                              }}
                              className="w-full py-3.5 bg-[#E10600] hover:bg-[#c20500] text-white font-f1-wide font-black text-xs sm:text-sm uppercase tracking-wider f1-tab-chamfer transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                            >
                              <Building2 className="w-4 h-4" />
                              <span>CONFIRMAR COMPRA DA FÁBRICA E INTEGRAR</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* 3. SE FOR DO ZERO (PROTOCOLO FÊNIX) */}
                {engineChoice === 'phoenix' && (
                  <div className="bg-[#1C1C26] p-6 border border-white/10 space-y-4 f1-pattern-micro-grid">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <span className="text-[10px] font-f1-mono text-[#E10600] font-bold uppercase tracking-widest block">
                          PROGRAMA EXPERIMENTAL IN-HOUSE
                        </span>
                        <h3 className="font-f1-wide font-black text-lg text-white uppercase mt-0.5">
                          Protocolo Fênix Mk-I (Do Zero)
                        </h3>
                      </div>
                      <span className="text-xs font-f1-mono bg-amber-950/40 text-amber-300 border border-amber-500/30 px-3 py-1 font-bold">
                        CONFIGURAÇÃO DE BANCADA EXIGIDA
                      </span>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed max-w-3xl">
                      Como construtor 100% independente, a sua equipe possui liberdade total de concepção. Vá para a bancada de montagem para ajustar as especificações de hardware térmico e elétrico que ditarão o centro de gravidade e a refrigeração do carro.
                    </p>

                    {/* ALERTA CUSTO DA FÊNIX E O TETO DE GASTOS */}
                    <div className="p-4 bg-red-950/40 border border-[#E10600] flex items-start gap-3">
                      <AlertOctagon className="w-5 h-5 text-[#E10600] shrink-0 mt-0.5" />
                      <div className="text-xs font-f1-mono">
                        <span className="font-f1-wide font-black text-red-300 uppercase block mb-1">
                          ALERTA FIA · TETO DE GASTOS DO PROTOCOLO FÊNIX ($50M)
                        </span>
                        <p className="text-red-100 font-bold leading-relaxed">
                          Seu Teto de Gastos restante será de $85M. Você precisará contratar pilotos e staff de baixo custo para não falir.
                        </p>
                        <p className="text-zinc-400 text-[11px] mt-1.5">
                          Evolução Planejada: No Ano 2, o Teto de Gastos aumentará para $140M e patrocínios subirão de 15% a 25% com o amadurecimento do motor.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => {
                          playRadioSound();
                          setWorksTeamPendingAction('phoenix');
                          setWorksTeamNameInput(
                            customTeamName
                              ? (customTeamName.includes('Powertrains') || customTeamName.includes('Works')
                                  ? customTeamName
                                  : `${customTeamName} Powertrains`)
                              : 'Apex Powertrains'
                          );
                          setShowWorksTeamModal(true);
                        }}
                        className="w-full sm:w-auto px-8 py-3 bg-[#E10600] hover:bg-[#c20500] text-white font-f1-wide font-bold text-xs uppercase tracking-wider f1-tab-chamfer transition-colors flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                      >
                        <Wrench className="w-4 h-4" />
                        <span>CONFIGURAR MONTAGEM DA PU NA BANCADA</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* TELA DE CONFIGURAÇÃO DA MONTAGEM DA PU (SLIDERS ICE, ERS, TURBO) */
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-xs font-f1-mono text-[#E10600] font-bold tracking-widest uppercase">
                    BANCADA DE ENGENHARIA DE MOTORES · FIA ART. 5
                  </span>
                  <h2 className="font-f1-wide font-black text-2xl sm:text-3xl text-white uppercase">
                    Configuração da Montagem da PU 2026
                  </h2>
                  <p className="text-sm text-zinc-400">
                    Defina a arquitetura metalúrgica, curva de sobrealimentação e divisão de energia antes de gerar o gabarito físico.
                  </p>
                </div>

                <div className="bg-[#1C1C26] border border-white/10 p-6 f1-container-bucket space-y-6">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="font-f1-wide font-black text-sm text-white uppercase">
                      ESPECIFICAÇÃO DE PROJETO: {engineChoice === 'bought_factory' ? 'Cosworth-Apex Factory Spec' : 'Apex Protocol Fênix Mk-I'}
                    </span>
                    <span className="text-xs font-f1-mono text-zinc-400">BANCADA DE DINAMÔMETRO</span>
                  </div>

                  {/* Os 4 Ajustes da Montagem */}
                  <div className="space-y-5">
                    {/* 1. Metalurgia ICE */}
                    <div className="space-y-2">
                      <label className="text-xs font-f1-wide font-bold text-white uppercase block">
                        1. Metalurgia do Bloco ICE (V6 1.6L Turbo)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setPuIceMaterial('aluminum')}
                          className={`p-3 text-left border text-xs font-f1-mono transition-all cursor-pointer ${
                            puIceMaterial === 'aluminum'
                              ? 'border-[#E10600] bg-[#252533] text-white font-bold ring-1 ring-[#E10600]'
                              : 'border-white/10 bg-[#15151E] text-zinc-400 hover:text-white'
                          }`}
                        >
                          <div className="font-f1-wide font-bold text-white">Liga de Ferro Padrão FIA (AMS 6487)</div>
                          <div className="text-[10px] text-zinc-400 mt-1">Bloco Al · Pistões Aço AMS 6487 · 142 kg · $9.5M</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPuIceMaterial('titanium')}
                          className={`p-3 text-left border text-xs font-f1-mono transition-all cursor-pointer ${
                            puIceMaterial === 'titanium'
                              ? 'border-[#E10600] bg-[#252533] text-white font-bold ring-1 ring-[#E10600]'
                              : 'border-white/10 bg-[#15151E] text-zinc-400 hover:text-white'
                          }`}
                        >
                          <div className="font-f1-wide font-bold text-white">Cabeçote Aço Especial + Pistões X38CrMoV5-3</div>
                          <div className="text-[10px] text-zinc-400 mt-1">+15°C teto térmico · +8 kg · $14.0M</div>
                        </button>
                      </div>
                    </div>

                    {/* 2. Turbocharger Diameter & Spool */}
                    <div className="space-y-2 bg-[#15151E] p-3.5 border border-white/5">
                      <div className="flex justify-between items-center text-xs font-f1-mono">
                        <label className="font-f1-wide font-bold text-white uppercase">
                          2. Diâmetro do Turbocompressor & Spool
                        </label>
                        <span className="text-[#E10600] font-bold">{puTurboSize}% Peak HP (Alta Velocidade)</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={90}
                        value={puTurboSize}
                        onChange={e => setPuTurboSize(Number(e.target.value))}
                        className="w-full accent-[#E10600] h-1.5 bg-zinc-700 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] font-f1-mono text-zinc-400">
                        <span>Turbo Menor (Spool Rápido em Saídas Lentas)</span>
                        <span>Turbo Maior (Potência de Pico em Retas Longas)</span>
                      </div>
                    </div>

                    {/* 3. ERS Battery Pack */}
                    <div className="space-y-2">
                      <label className="text-xs font-f1-wide font-bold text-white uppercase block">
                        3. Arquitetura da Bateria ERS (350kW)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setPuErsBatteryType('lightweight_lithium')}
                          className={`p-3 text-left border text-xs font-f1-mono transition-all cursor-pointer ${
                            puErsBatteryType === 'lightweight_lithium'
                              ? 'border-[#E10600] bg-[#252533] text-white font-bold ring-1 ring-[#E10600]'
                              : 'border-white/10 bg-[#15151E] text-zinc-400 hover:text-white'
                          }`}
                        >
                          <div className="font-f1-wide font-bold text-white">Lightweight Lithium Cells</div>
                          <div className="text-[10px] text-zinc-400 mt-1">Descarga rápida · Peso mínimo regulamentar</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPuErsBatteryType('dense_pack')}
                          className={`p-3 text-left border text-xs font-f1-mono transition-all cursor-pointer ${
                            puErsBatteryType === 'dense_pack'
                              ? 'border-[#E10600] bg-[#252533] text-white font-bold ring-1 ring-[#E10600]'
                              : 'border-white/10 bg-[#15151E] text-zinc-400 hover:text-white'
                          }`}
                        >
                          <div className="font-f1-wide font-bold text-white">Dense Energy Pack</div>
                          <div className="text-[10px] text-zinc-400 mt-1">+12 kg de massa · Reserva sustentada para ultrapassagens</div>
                        </button>
                      </div>
                    </div>

                    {/* 4. Software de Deploy / Recuperação */}
                    <div className="space-y-2 bg-[#15151E] p-3.5 border border-white/5">
                      <div className="flex justify-between items-center text-xs font-f1-mono">
                        <label className="font-f1-wide font-bold text-white uppercase">
                          4. Mapeamento de Deploy Elétrico (Software)
                        </label>
                        <span className="text-cyan-400 font-bold">{puSoftwareBias}% Foco em Deploy</span>
                      </div>
                      <input
                        type="range"
                        min={15}
                        max={85}
                        value={puSoftwareBias}
                        onChange={e => setPuSoftwareBias(Number(e.target.value))}
                        className="w-full accent-cyan-400 h-1.5 bg-zinc-700 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] font-f1-mono text-zinc-400">
                        <span>Recuperação Agressiva (Harvesting)</span>
                        <span>Deploy Contínuo (Aceleração Contínua 350kW)</span>
                      </div>
                    </div>

                    {/* 5. Mapeamento de Injeção de E-Fuel (Economia vs. Performance) */}
                    <div className="space-y-2 bg-[#15151E] p-3.5 border border-white/5">
                      <div className="flex justify-between items-center text-xs font-f1-mono">
                        <label className="font-f1-wide font-bold text-white uppercase">
                          5. Mapeamento de Injeção (Economia vs. Performance)
                        </label>
                        <span className={`font-bold ${puInjectionMapping > 50 ? 'text-amber-400' : puInjectionMapping < 50 ? 'text-lime-400' : 'text-white'}`}>
                          {puInjectionMapping > 50
                            ? `Foco em Performance (+${Math.round(5 * (puInjectionMapping - 50) / 50)} PWR / -${Math.round(5 * (puInjectionMapping - 50) / 50)} E-Fuel)`
                            : puInjectionMapping < 50
                            ? `Foco em Eficiência (+${Math.round(5 * (50 - puInjectionMapping) / 50)} E-Fuel / -${Math.round(2 * (50 - puInjectionMapping) / 50)} PWR)`
                            : 'Equilibrado FIA (Padrão)'}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={puInjectionMapping}
                        onChange={e => setPuInjectionMapping(Number(e.target.value))}
                        className="w-full accent-lime-400 h-1.5 bg-zinc-700 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] font-f1-mono text-zinc-400">
                        <span className="text-lime-400 font-bold">← Foco em Eficiência (+5 E-Fuel / -2 PWR)</span>
                        <span className="text-zinc-500">Padrão 2026</span>
                        <span className="text-amber-400 font-bold">Foco em Performance (-5 E-Fuel / +5 PWR) →</span>
                      </div>
                    </div>
                  </div>

                  {/* Resumo da PU Configurada */}
                  {(() => {
                    const thermalMismatch = Math.abs(puTurboSize - puSoftwareBias);
                    const thermalSync = Math.max(70, Math.min(100, 100 - Math.round(thermalMismatch * 0.35)));
                    const puWeight = (puIceMaterial === 'titanium' ? 148 : 142) + (puErsBatteryType === 'dense_pack' ? 12 : 0);
                    const injectionPWRDelta = puInjectionMapping >= 50
                      ? Math.round(5 * (puInjectionMapping - 50) / 50)
                      : Math.round(-2 * (50 - puInjectionMapping) / 50);
                    const injectionEFuelDelta = Math.round(5 * (50 - puInjectionMapping) / 50);
                    const puPower = Math.round(80 + (puTurboSize * 0.15) + injectionPWRDelta);
                    const puRel = puIceMaterial === 'titanium' ? (engineChoice === 'phoenix' ? 84 : 90) : (engineChoice === 'phoenix' ? 76 : 82);
                    const puEFuel = Math.min(100, Math.max(60, 80 + injectionEFuelDelta));

                    return (
                      <div className="bg-[#15151E] p-4 border border-white/10 space-y-3">
                        <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block font-bold">
                          DIAGNÓSTICO DA PU MONTADA EM BANCADA
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs font-f1-mono">
                          <div className="bg-[#1C1C26] p-2.5 border border-white/5">
                            <span className="text-[9px] text-zinc-400 uppercase block">POTÊNCIA (PWR)</span>
                            <span className="text-white font-bold text-sm">{puPower} pts</span>
                            <span className="text-[9px] text-zinc-500 block mt-0.5">{injectionPWRDelta >= 0 ? `+${injectionPWRDelta}` : injectionPWRDelta} injeção</span>
                          </div>
                          <div className="bg-[#1C1C26] p-2.5 border border-white/5">
                            <span className="text-[9px] text-zinc-400 uppercase block">EFICIÊNCIA E-FUEL</span>
                            <span className="text-lime-400 font-bold text-sm">{puEFuel} pts</span>
                            <span className="text-[9px] text-zinc-500 block mt-0.5">{injectionEFuelDelta >= 0 ? `+${injectionEFuelDelta}` : injectionEFuelDelta} injeção</span>
                          </div>
                          <div className="bg-[#1C1C26] p-2.5 border border-white/5">
                            <span className="text-[9px] text-zinc-400 uppercase block">CONFIABILIDADE BASE</span>
                            <span className="text-emerald-400 font-bold text-sm">{puRel}%</span>
                          </div>
                          <div className="bg-[#1C1C26] p-2.5 border border-white/5">
                            <span className="text-[9px] text-zinc-400 uppercase block">PESO TOTAL PU</span>
                            <span className="text-cyan-400 font-bold text-sm">{puWeight} kg</span>
                          </div>
                          <div className="bg-[#1C1C26] p-2.5 border border-white/5">
                            <span className="text-[9px] text-zinc-400 uppercase block">CASAMENTO TÉRMICO</span>
                            <span className="text-amber-400 font-bold text-sm">{thermalSync}% Sync</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Botões de Ação na Montagem */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => setPuPhaseStage('select')}
                      className="w-full sm:w-auto px-4 py-2.5 border border-white/10 bg-[#15151E] text-zinc-400 hover:text-white text-xs font-f1-wide uppercase tracking-wider transition-colors"
                    >
                      Voltar à Seleção de Origem
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        playRadioSound();
                        updateVehicleParamsDraft({
                          iceMaterial: puIceMaterial,
                          iceMetallurgyId: puIceMaterial === 'titanium' ? 'ferrari_steel_head' : 'fia_iron_ams6487',
                          turboDiameterMm: Math.max(78, Math.min(104, Math.round(78 + (puTurboSize / 100) * 26))),
                          batteryCellTech: puErsBatteryType === 'dense_pack' ? 'dense_pack' : 'lightweight_lithium',
                          ersDeployBiasPct: puSoftwareBias,
                          iceCompressionRatio: Math.round((15.2 + (puInjectionMapping / 100) * 1.0) * 100) / 100
                        });
                        try {
                          localStorage.setItem('apex_f1_engine_locked', JSON.stringify({
                            engineChoice: 'phoenix',
                            selectedFactoryId,
                            customerSupplier,
                            puStage: 'dossier',
                            locked: true
                          }));
                        } catch (_) {}
                        setPuPhaseStage('dossier');
                      }}
                      className="w-full sm:w-auto px-6 py-3 bg-[#E10600] hover:bg-[#c20500] text-white font-f1-wide font-black text-xs uppercase tracking-wider f1-tab-chamfer transition-colors flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                    >
                      <Cpu className="w-4 h-4" />
                      <span>CONFIRMAR MONTAGEM E GERAR DOSSIÊ TÉCNICO</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================== */}
        {/* STEP 5 (ETAPA 02): DOSSIÊ TÉCNICO, BANCADA & DINAMÔMETRO   */}
        {/* ========================================================== */}
        {currentStep === 5 && puPhaseStage === 'dossier' && (() => {
          const isEmergency = emergencyMercedesDeal || Boolean(emergencySupplier);
          const effectiveEmergencySupplier: CustomerEngineSupplier = emergencySupplier || 'Mercedes';

          const engineFullName = isEmergency
            ? `${CUSTOMER_ENGINES[effectiveEmergencySupplier].fullName} (Acordo Emergencial)`
            : engineChoice === 'customer'
            ? CUSTOMER_ENGINES[customerSupplier].fullName
            : engineChoice === 'bought_factory'
            ? `${AVAILABLE_FACTORIES[selectedFactoryId].fullName} Spec-I 2026`
            : 'Apex Protocol Fênix Mk-I 2026 (In-House)';

          const m08Live = evaluatePowerUnit(
            vehicleParamsDraft,
            {
              rpm: 11600,
              throttleRatio: 1.0,
              vehicleSpeedMs: 75,
              ambientTempK: 298.15,
              airPressurePa: 101325,
              initialSoc01: 0.72,
              cycleDurationS: 5.0,
              regenPowerCommandW: 110000,
              deployCommandRatio: Math.max(0.25, Math.min(1.0, vehicleParamsDraft.ersDeployBiasPct / 85)),
              cumulativeRaceCycles: 120,
            },
            FIA_2026_DEFAULT_EDITION
          );

          const liveCompRatio = vehicleParamsDraft.iceCompressionRatio;
          const liveTurboDiamMm = vehicleParamsDraft.turboDiameterMm;
          const liveBatteryTech = vehicleParamsDraft.batteryCellTech;
          const liveTurboLagMs = Math.round(m08Live.turbocharger.spoolLagMs);

          const puReliabilityBase = isEmergency
            ? Math.max(68, CUSTOMER_ENGINES[effectiveEmergencySupplier].reliability)
            : engineChoice === 'customer'
            ? Math.max(68, CUSTOMER_ENGINES[customerSupplier].reliability)
            : engineChoice === 'bought_factory'
            ? Math.max(70, AVAILABLE_FACTORIES[selectedFactoryId].rel)
            : (vehicleParamsDraft.iceMetallurgyId === 'ferrari_steel_head' ? 82 : 76);

          const modConfiabilidade = selectedBackground.modifiers.reliabilityDelta || 0;
          // Fator de Estresse reativo aos sliders da bancada (Compressão + Turbo + Bateria Alta Densidade + ERS externo)
          const compStress = Math.max(0, Math.round((liveCompRatio - 15.0) * 10)); // 15.3 -> -3%, 16.0 -> -10%
          const turboStress = liveTurboDiamMm >= 96 ? Math.round((liveTurboDiamMm - 94) * 0.6) : 0; // 104mm -> -6%
          const batteryHeatStress = liveBatteryTech === 'dense_pack' ? 3 : 0; // Pack Alta Densidade esquenta mais
          const thirdPartyIntegrationStress = activeThirdPartyErs
            ? Math.max(2, Math.round((100 - activeThirdPartyErs.reliabilityScore) * 0.2))
            : (engineChoice === 'bought_factory' && selectedFactoryId === 'cosworth' ? 3 : 0);
          const stressFactorPct = compStress + turboStress + batteryHeatStress + thirdPartyIntegrationStress;
          const leadershipRelBonus = combinedLeadershipDna.puRiskMitigated ? 4 : 0;
          const netStressDelta = modConfiabilidade + leadershipRelBonus - stressFactorPct;
          const relFinalCalculado = Math.min(
            98,
            Math.max(40, puReliabilityBase + netStressDelta + (recalibrateBench ? 4 : 0))
          );

          const ersHarmonyPowerDeltaHp = activeErsHarmonyInfo ? Math.round(activeErsHarmonyInfo.delta * 0.75) : 0;
          const ersPowerBonusHp =
            (activeThirdPartyErs?.pwrDelta ? Math.round(activeThirdPartyErs.pwrDelta * 2.4) : 0) +
            ersHarmonyPowerDeltaHp;
          const rawDisplayedPowerHp = Math.round((m08Live.shaftAndIce.icePowerW / 1000) * 1.34102209) + ersPowerBonusHp;
          const displayedPowerHp = Math.round(rawDisplayedPowerHp * (1 + combinedLeadershipDna.puPowerDeltaPct / 100));
          const peakCombinedPowerHp = displayedPowerHp + Math.round(Math.min(350, vehicleParamsDraft.mgukMaxKw) * 1.34102209);
          const resolvedIceSpec = ICE_METALLURGY_2026[resolveIceMetallurgyId(vehicleParamsDraft.iceMetallurgyId, vehicleParamsDraft.iceMaterial)];
          const displayedIceWeightKg = 142 + resolvedIceSpec.massDeltaKg;
          const baseBatteryWeightKg =
            liveBatteryTech === 'dense_pack'
              ? 41
              : liveBatteryTech === 'ultra_solid_state'
              ? 37
              : 35;
          const displayedBatteryWeightKg = Math.max(30, baseBatteryWeightKg + (activeThirdPartyErs?.weightDeltaKg || 0));

          const activeSupplierLabel = isEmergency
            ? effectiveEmergencySupplier
            : engineChoice === 'customer'
            ? customerSupplier
            : engineChoice === 'bought_factory'
            ? AVAILABLE_FACTORIES[selectedFactoryId].name
            : 'In-House Fênix';

          const philosophyCodeM02 = normalizeToM02Philosophy(philosophy);
          const philosophyDisplayMap: Record<VehiclePhilosophyCode, string> = {
            low_drag: 'Baixo Arrasto (Low Drag)',
            high_downforce: 'Alta Carga (High Downforce)',
            stable_platform: 'Plataforma Estável',
            aero_efficiency: 'Eficiência Aerodinâmica (L/D)',
            mechanical_grip: 'Aderência Mecânica',
            balanced_adaptive: 'Equilibrado / Adaptativo',
          };
          const philosophyDisplayLabel = philosophyDisplayMap[philosophyCodeM02];

          const headPuProfileInfo = hiredHeadPuObj ? getStaffFullProfile(hiredHeadPuObj) : null;
          const headAeroProfileInfo = hiredHeadAeroObj ? getStaffFullProfile(hiredHeadAeroObj) : null;

          const boardroomVerdictStep5 = evaluateBoardroomPuVerdict({
            vehicleParams: vehicleParamsDraft,
            puOutputs: m08Live,
            relFinalPct: relFinalCalculado,
            headPuName: hiredHeadPuObj?.name || 'Gabriel Santos',
            headPuTag: headPuProfileInfo?.staffPhilosophyTag || 'INOVADOR',
            headAeroName: hiredHeadAeroObj?.name || 'Marcus Vance',
            headAeroTag: headAeroProfileInfo?.staffPhilosophyTag || 'ALTO DOWNFORCE',
            philosophyCode: philosophyCodeM02,
            philosophyName: philosophyDisplayLabel,
            requiresLargerSidepods: Boolean(activeThirdPartyErs?.requiresLargerSidepods || engineChoice === 'customer'),
          });

          // Detecção de customização pelo jogador vs gabarito original de fábrica
          const modifiedParamCount =
            (isBlockAngleChanged ? 1 : 0) +
            (isPistonStrokeChanged ? 1 : 0) +
            (isTurboLayoutChanged ? 1 : 0) +
            (isBlocoChanged ? 1 : 0) +
            (isVirabrequimChanged ? 1 : 0) +
            (isBateriaChanged ? 1 : 0) +
            (isErsArqChanged ? 1 : 0) +
            (isEficPotChanged ? 1 : 0) +
            (isTorqueChanged ? 1 : 0) +
            (isCombustivelChanged ? 1 : 0) +
            (isErsSoftChanged ? 1 : 0) +
            (isAntiClipChanged ? 1 : 0) +
            (Math.abs(liveCompRatio - 15.2) >= 0.2 ? 1 : 0) +
            (activeThirdPartyErs ? 1 : 0);
          const isPlayerModifiedProject =
            (engineChoice === 'bought_factory' || engineChoice === 'phoenix') &&
            (modifiedParamCount > 0 || modifiedWeeks > 0 || totalIndustrialChanges > 0);
          const customizationExtraCostUsd = Math.max(0, custoPrototipo - 2000000) + (softwareDelayWeeks * 250000);
          const baseFactoryRel =
            engineChoice === 'bought_factory'
              ? Math.max(70, AVAILABLE_FACTORIES[selectedFactoryId].rel)
              : 76;
          const netRelDeltaVsBase = relFinalCalculado - baseFactoryRel;

          const baseFactoryM08 = evaluatePowerUnit(
            {
              ...DEFAULT_VEHICLE_PARAMS,
              iceMetallurgyId:
                engineChoice === 'bought_factory' && selectedFactoryId === 'porsche'
                  ? 'ferrari_steel_head'
                  : 'fia_iron_ams6487',
            },
            {
              rpm: 11600,
              throttleRatio: 1.0,
              vehicleSpeedMs: 75,
              ambientTempK: 298.15,
              airPressurePa: 101325,
              initialSoc01: 0.72,
              cycleDurationS: 5.0,
              regenPowerCommandW: 110000,
              deployCommandRatio: Math.max(0.25, Math.min(1.0, DEFAULT_VEHICLE_PARAMS.ersDeployBiasPct / 85)),
              cumulativeRaceCycles: 120,
            },
            FIA_2026_DEFAULT_EDITION
          );
          const baseFactoryIceHp = Math.round(
            ((baseFactoryM08.shaftAndIce.icePowerW / 1000) * 1.34102209) *
              (1 + combinedLeadershipDna.puPowerDeltaPct / 100)
          );
          const baseFactoryCombinedPowerHp =
            baseFactoryIceHp + Math.round(Math.min(350, DEFAULT_VEHICLE_PARAMS.mgukMaxKw) * 1.34102209);
          const netPowerDeltaVsBase = peakCombinedPowerHp - baseFactoryCombinedPowerHp;

          const defaultCustomEngineName =
            engineChoice === 'customer'
              ? CUSTOMER_ENGINES[customerSupplier].fullName
              : isEmergency
              ? `${effectiveEmergencySupplier} Emergencial`
              : `${(customTeamShort || 'APX').toUpperCase()}-01 Evo`;
          const effectiveCustomEngineName = customEngineName.trim() || defaultCustomEngineName;

          const officialCardMetrics = computeNormalizedOfficialPuCard({
            vehicleParams: vehicleParamsDraft,
            puOutputs: m08Live,
            displayedPowerHp: peakCombinedPowerHp,
            relFinalCalculado,
            iceWeightKg: displayedIceWeightKg,
            batteryWeightKg: displayedBatteryWeightKg,
            fuelPartner,
            activeThirdPartyErsName: activeThirdPartyErs?.supplier || null,
            requiresLargerSidepods: Boolean(activeThirdPartyErs?.requiresLargerSidepods || engineChoice === 'customer'),
            dnaLabel: `${selectedBackground.name} · ${philosophyDisplayLabel}`,
            engineOrigin: isEmergency ? 'customer' : engineChoice,
            isYear1Project: careerPath === 'custom_team' && !isEmergency && engineChoice !== 'customer',
            teamName: careerPath === 'custom_team' ? customTeamName : (realTeamObj?.name ?? undefined),
          });

          // Sinergia / Balanço Térmico ICE + ERS reage diretamente a Turbo, Compressão, Bateria e Margem M08
          const turboThermalPenalty = liveTurboDiamMm > 91 ? Math.round((liveTurboDiamMm - 91) * 1.2) : 0;
          const compThermalPenalty = liveCompRatio > 15.3 ? Math.round((liveCompRatio - 15.3) * 18) : 0;
          const densePackThermalPenalty = liveBatteryTech === 'dense_pack' ? 4 : 0;
          const rawThermalSync =
            68 +
            m08Live.thermalAndLubrication.thermalMarginK * 1.3 -
            turboThermalPenalty -
            compThermalPenalty -
            densePackThermalPenalty +
            (activeThirdPartyErs?.requiresLargerSidepods ? -6 : 0);

          const hasThirdPartyOrCustomerErs = engineChoice === 'customer' || Boolean(activeThirdPartyErs) || isEmergency;
          const detonationWarningActive = liveCompRatio >= 15.7 && (hasThirdPartyOrCustomerErs || m08Live.thermalAndLubrication.thermalMarginK < 6);
          const thermalOverloadActive = detonationWarningActive || m08Live.thermalAndLubrication.thermalMarginK < 4 || liveTurboDiamMm >= 100;

          const liveDissipationText = detonationWarningActive
            ? `Aviso: Alta compressão (${liveCompRatio.toFixed(1)}:1) + ERS ${activeThirdPartyErs ? 'terceirizado' : 'integrado'} = Risco de detonação e superaquecimento nos radiadores.`
            : liveTurboDiamMm >= 98
            ? `Turbo grande (${liveTurboDiamMm} mm) eleva o calor de exaustão junto com o sistema elétrico (${Math.round(m08Live.thermalAndLubrication.heatTotalGeneratedW / 1000)} kW totais). Exige mais abertura nos sidepods.`
            : `O sistema de refrigeração dissipa ${(m08Live.thermalAndLubrication.heatRejectedW / 1000).toFixed(1)} kW com fluxo de ${m08Live.thermalAndLubrication.airMassFlowKgS.toFixed(2)} kg/s, mantendo ICE + ERS equilibrados.`;

          const liveLagCompensationText = liveTurboDiamMm >= 98
            ? `Turbo muito grande (${liveTurboLagMs} ms de lag). O MGU-K precisará intervir mais na saída de curva para cobrir o atraso, drenando bateria.`
            : liveTurboDiamMm <= 86
            ? `Turbo compacto (${liveTurboLagMs} ms de lag). Resposta rápida nas saídas de curva permite ao MGU-K poupar bateria para as retas.`
            : `Curva de turbo com ${liveTurboLagMs} ms de lag. O torque do MGU-K preenche a faixa transiente de forma equilibrada.`;

          // Resolving Dynamic Technical Dossier Data enriched with M08 physical outputs
          const baseDossier: TechnicalDossierData = isEmergency
            ? PU_DOSSIER_DATA[effectiveEmergencySupplier]
            : (engineChoice === 'customer'
                ? PU_DOSSIER_DATA[customerSupplier]
                : (engineChoice === 'bought_factory'
                    ? FACTORY_DOSSIER_DATA[selectedFactoryId]
                    : {
                        ice: {
                          architecture: `V6 ${engineBlockAngle}°`,
                          blockWeightKg: displayedIceWeightKg,
                          pistonMaterial: `Aço ${resolvedIceSpec.pistonAlloyCode} (Art. C15.7.1)`,
                          thermalPowerHp: displayedPowerHp,
                          torqueNm: Math.round(m08Live.shaftAndIce.iceTorqueNm),
                          thermalEfficiency: Math.round(m08Live.shaftAndIce.iceThermalEfficiency * 100),
                          operatingTempC: Math.round(m08Live.thermalAndLubrication.iceTempK - 273.15),
                          turboLagMs: liveTurboLagMs
                        },
                        ers: {
                          batteryWeightKg: displayedBatteryWeightKg,
                          cellType:
                            liveBatteryTech === 'ultra_solid_state'
                              ? 'Ultra Densidade Si-C / Semi-Sólido (4.8 MJ)'
                              : liveBatteryTech === 'dense_pack'
                              ? 'Pack Alta Densidade CFRP (4.4 MJ)'
                              : 'Lítio Leve CFRP (4.0 MJ)',
                          mgukPowerKw: Math.round(m08Live.ersAndBattery.mgukActualShaftW / 1000),
                          recoveryCapacity: Math.round(100 - vehicleParamsDraft.ersDeployBiasPct * 0.35),
                          clippingRisk: Math.max(0, Math.round((1 - m08Live.ersAndBattery.finalSoc01) * 45)),
                          coolingDemand: Math.min(100, Math.round(m08Live.thermalAndLubrication.heatTotalGeneratedW / 4500))
                        },
                        integration: {
                          thermalSync: Math.max(40, Math.min(100, Math.round(rawThermalSync))),
                          dissipationText: liveDissipationText,
                          lagCompensationText: liveLagCompensationText
                        },
                        chassisAlert: resolvedIceSpec.tradeOffSummary
                      }));

          // Impacto Técnico conectado com GDD Seção 20 e 21 (Aerodinâmica e Filosofia do Carro)
          const computeChassisAndAeroImpact = (): string => {
            if (isEmergency) {
              return `Integração emergencial do bloco ${effectiveEmergencySupplier} altera os pontos de fixação no monocoque (+15% de erro de correlação no túnel de vento). ${EMERGENCY_ENGINE_OPTIONS[effectiveEmergencySupplier].penaltyDetail}`;
            }
            if (engineChoice === 'customer' || Boolean(activeThirdPartyErs)) {
              const dragLossKmh = activeThirdPartyErs?.requiresLargerSidepods || engineChoice === 'customer' ? '2 a 3 km/h' : '1 a 2 km/h';
              return `Ausência de integração nativa do ERS exige tubulações externas para refrigerar o MGU-K, alargando os sidepods (+4% de Arrasto / +${displayedBatteryWeightKg - 35} kg). Você perde cerca de ${dragLossKmh} em retas longas, mas o volume traseiro estabiliza curvas lentas.`;
            }
            if (resolvedIceSpec.id === 'ferrari_steel_head') {
              return `O cabeçote de aço especial suporta calor extremo e permite sidepods mais estreitos (-3% de Arrasto / +2 km/h na reta), favorecendo ${philosophyDisplayLabel} apesar de +8 kg extras na traseira.`;
            }
            if (liveTurboDiamMm >= 98 || liveCompRatio >= 15.8) {
              return `A carga térmica elevada obriga abrir as saídas de ar quente (+3% de Arrasto / -2 km/h em reta), penalizando a aerodinâmica para proteger o conjunto ICE + ERS.`;
            }
            if (liveBatteryTech === 'dense_pack') {
              return `O Pack Alta Densidade adiciona +6 kg no assoalho central, exigindo ajuste de balanço das asas para manter a agilidade em chicanes.`;
            }
            return `Empacotamento compacto (${displayedIceWeightKg + displayedBatteryWeightKg} kg totais) libera cintura traseira estreita ("Coke Bottle") para ganhar +3% de downforce no difusor sem sacrificar velocidade máxima.`;
          };

          // Apply live M08 SI values onto the Dossier
          const dossier: TechnicalDossierData = {
            ice: {
              ...baseDossier.ice,
              blockWeightKg: displayedIceWeightKg,
              pistonMaterial: `Aço ${resolvedIceSpec.pistonAlloyCode} · ${resolvedIceSpec.shortLabel}`,
              thermalPowerHp: displayedPowerHp,
              torqueNm: Math.round(m08Live.shaftAndIce.iceTorqueNm),
              thermalEfficiency: Math.round(m08Live.shaftAndIce.iceThermalEfficiency * 100),
              operatingTempC: Math.round(m08Live.thermalAndLubrication.iceTempK - 273.15),
              turboLagMs: liveTurboLagMs
            },
            ers: {
              ...baseDossier.ers,
              batteryWeightKg: displayedBatteryWeightKg,
              mgukPowerKw: Math.round(m08Live.ersAndBattery.mgukActualShaftW / 1000),
              clippingRisk: thirdPartyErsMercedes
                ? 0
                : Math.min(100, Math.max(0, Math.round((1 - m08Live.ersAndBattery.finalSoc01) * 45 * (1 - sliderErsAntiClipping / 140)) + (activeThirdPartyErs?.deratingRiskDeltaPct || 0))),
              cellType: activeThirdPartyErs
                ? activeThirdPartyErs.fullName
                : liveBatteryTech === 'ultra_solid_state'
                ? 'Ultra Densidade Si-C (4.8 MJ)'
                : liveBatteryTech === 'dense_pack'
                ? 'Pack Alta Densidade (4.4 MJ)'
                : 'Lítio Leve CFRP (4.0 MJ)',
              coolingDemand: Math.min(
                100,
                Math.round(m08Live.thermalAndLubrication.heatTotalGeneratedW / 4500) +
                  (activeThirdPartyErs?.requiresLargerSidepods ? 24 : 0) +
                  (liveBatteryTech === 'dense_pack' ? 8 : 0)
              )
            },
            integration: {
              thermalSync: Math.max(
                35,
                Math.min(100, Math.round((indiceHarmonia + Math.max(35, Math.min(100, rawThermalSync))) / 2))
              ),
              dissipationText: liveDissipationText,
              lagCompensationText: liveLagCompensationText
            },
            chassisAlert: computeChassisAndAeroImpact()
          };

          const getEngineerDiagnosisText = () => {
            const weightPenaltyKg = displayedBatteryWeightKg - 35;
            const pistonBrief =
              resolvedIceSpec.id === 'ferrari_steel_head'
                ? `cabeçote em aço especial (${resolvedIceSpec.pistonAlloyCode}) que aguenta calor extremo acima de 110°C`
                : `pistões de liga de ferro FIA (${resolvedIceSpec.pistonAlloyCode}) que exigem aquecimento rigoroso de 90°C no box`;

            if (isEmergency) {
              return `Acordo emergencial com a ${effectiveEmergencySupplier} fechado às pressas. O bloco usa ${pistonBrief}, e a integração improvisada com o chassi traz risco direto na pista: ${EMERGENCY_ENGINE_OPTIONS[effectiveEmergencySupplier].penaltyDetail}`;
            }
            if (engineChoice === 'customer') {
              return `Temos um motor ${customerSupplier} homologado${customerSupplier === 'Red Bull-Ford' ? ', referência de potência bruta no ICE' : ''}. Os ${pistonBrief}, e nossa falta de um ERS próprio nos deixa reféns da calibração do fornecedor${weightPenaltyKg > 0 ? `. O carro está ${weightPenaltyKg} kg mais pesado por causa do pacote elétrico` : ''}.${liveTurboDiamMm >= 98 ? ` Além disso, o turbo de ${liveTurboDiamMm} mm gera ${liveTurboLagMs} ms de lag nas saídas de curva.` : ''}`;
            }
            if (engineChoice === 'bought_factory') {
              const factoryName = AVAILABLE_FACTORIES[selectedFactoryId].name;
              const missingOwnErs = !activeThirdPartyErs && selectedFactoryId === 'cosworth';
              if (activeThirdPartyErs) {
                const originAdj =
                  activeThirdPartyErs.supplier === 'Mercedes'
                    ? 'alemã'
                    : activeThirdPartyErs.supplier === 'Ferrari'
                    ? 'italiana'
                    : activeThirdPartyErs.supplier === 'Honda'
                    ? 'japonesa'
                    : activeThirdPartyErs.supplier === 'Audi'
                    ? 'alemã'
                    : 'anglo-americana';
                const blockOriginAdj =
                  selectedFactoryId === 'cosworth'
                    ? 'inglesa'
                    : selectedFactoryId === 'porsche' || selectedFactoryId === 'bmw'
                    ? 'alemã'
                    : selectedFactoryId === 'renault'
                    ? 'francesa'
                    : 'japonesa';
                return `O bloco ${factoryName} é leve, mas casar o ERS da ${activeThirdPartyErs.supplier} com ele foi um parto. A fiação externa e o calor gerado pela bateria ${originAdj} estão estressando a base ${blockOriginAdj} (sincronia ${dossier.integration.thermalSync}%)${
                  weightPenaltyKg > 0 ? `, além de adicionar +${weightPenaltyKg} kg na traseira.` : '.'
                }`;
              }
              return `Assumimos a base ${factoryName} com ${pistonBrief} (sincronia ${dossier.integration.thermalSync}%). ${
                missingOwnErs
                  ? 'Como o pacote Cosworth não traz ERS nativo, dependemos de unidade elétrica de terceiros e sua fiação externa'
                  : `O calor do MGU-K (${Math.round(m08Live.thermalAndLubrication.heatElectricalW / 1000)} kW elétricos) combinado ao ICE está pressionando a área do cockpit`
              }${weightPenaltyKg > 0 ? `, com +${weightPenaltyKg} kg extras no conjunto de baterias.` : '.'}`;
            }
            return `A base do nosso motor Fênix usa ${pistonBrief} com sincronia térmica de ${dossier.integration.thermalSync}% junto ao chassi. ${
              thermalOverloadActive
                ? `Atenção: o calor combinado do ICE (${dossier.ice.operatingTempC}°C) e do MGU-K está invadindo o cockpit e ameaçando a confiabilidade (${relFinalCalculado}%).`
                : 'Temos liberdade total de calibração para buscar potência sem sacrificar a durabilidade.'
            }`;
          };

          return (
            <div className="space-y-6">
              <div className="space-y-1">
                <span className="text-xs font-f1-mono text-[#E10600] font-bold tracking-widest uppercase">
                  FASE 5 · ETAPA 02: DOSSIÊ TÉCNICO, BANCADA & DINAMÔMETRO
                </span>
                <h2 className="font-f1-wide font-black text-2xl sm:text-3xl text-white uppercase">
                  Dossiê Técnico & Gabarito do Motor
                </h2>
                <p className="text-sm text-zinc-400">
                  Ajuste o comportamento do motor e valide o equilíbrio com o conceito aerodinâmico aprovado na Fase 4 antes de homologar na FIA.
                </p>
              </div>

              {/* Header com Unidade de Potência Homologada e Ações Unificadas */}
              <div className="bg-[#1C1C26] border border-white/10 p-5 f1-container-bucket space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-3.5 h-3.5 bg-[#E10600] inline-block shrink-0 shadow-[0_0_8px_#E10600]" />
                    <div>
                      <span className="text-[10px] font-f1-mono text-zinc-400 uppercase tracking-widest block">
                        {motorHomologadoFIA ? 'UNIDADE DE POTÊNCIA HOMOLOGADA (FIA 2026)' : 'PROJETO DE UNIDADE DE POTÊNCIA (FIA 2026)'}
                      </span>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <span className="font-f1-wide font-black text-base sm:text-lg text-white uppercase tracking-wider">
                          {motorHomologadoFIA ? effectiveCustomEngineName : engineFullName}
                        </span>
                        {motorHomologadoFIA ? (
                          <span className="text-[10px] font-f1-mono bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 font-bold uppercase inline-flex items-center gap-1 shadow-sm">
                            <Lock className="w-3 h-3 text-emerald-400" />
                            <span>HOMOLOGADO FIA 🔒</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-f1-mono bg-amber-500/20 text-amber-300 border border-amber-500/50 px-2.5 py-0.5 font-bold uppercase inline-flex items-center gap-1.5 shadow-sm">
                            <Wrench className="w-3 h-3 text-amber-400" />
                            <span>PROJETO PRÉ-HOMOLOGADO (EDITÁVEL)</span>
                          </span>
                        )}
                        {isPlayerModifiedProject && (
                          <span className="text-[10px] font-f1-mono bg-cyan-950/60 text-cyan-300 border border-cyan-500/50 px-2.5 py-0.5 font-bold uppercase inline-flex items-center gap-1.5">
                            <span>🛠️ PROJETO MODIFICADO PELO JOGADOR</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEmergency ? (
                      <span className="text-xs font-f1-mono text-red-300 bg-red-950/40 border border-red-500/40 px-3 py-1 font-bold shrink-0">
                        ACORDO EMERGENCIAL {effectiveEmergencySupplier.toUpperCase()}
                      </span>
                    ) : (
                      <span className="text-xs font-f1-mono text-zinc-300 bg-white/5 border border-white/10 px-3 py-1 font-bold shrink-0">
                        FILOSOFIA: {philosophyDisplayLabel.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* CHECKLIST DE ALINHAMENTO (FASE 3/4 ↔ FASE 5) + HISTÓRICO DE CUSTOMIZAÇÃO DE FÁBRICA */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                  <div className={`${isPlayerModifiedProject ? 'lg:col-span-7' : 'lg:col-span-12'} bg-[#15151E] border border-white/10 p-3.5 space-y-2 text-xs font-f1-mono`}>
                    <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                        Checklist de Alinhamento · Diretoria (Fase 3) & Conceito (Fase 4)
                      </span>
                      <span className="text-[10px] text-zinc-400">{boardroomVerdictStep5.chassisRdDelayNote}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className={`p-2.5 border flex items-center justify-between gap-2 ${
                        boardroomVerdictStep5.puAlignmentPct >= 75
                          ? 'bg-emerald-950/20 border-emerald-500/35 text-emerald-200'
                          : 'bg-amber-950/25 border-amber-500/40 text-amber-200'
                      }`}>
                        <div className="flex items-center gap-2">
                          {boardroomVerdictStep5.puAlignmentPct >= 75 ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          )}
                          <span>Alinhamento com Chefe de PU ({boardroomVerdictStep5.puChiefName})</span>
                        </div>
                        <strong className="tabular-nums text-white">{boardroomVerdictStep5.puAlignmentPct}%</strong>
                      </div>

                      <div className={`p-2.5 border flex items-center justify-between gap-2 ${
                        boardroomVerdictStep5.aeroAlignmentPct >= 75
                          ? 'bg-emerald-950/20 border-emerald-500/35 text-emerald-200'
                          : 'bg-red-950/25 border-red-500/40 text-red-200'
                      }`}>
                        <div className="flex items-center gap-2">
                          {boardroomVerdictStep5.aeroAlignmentPct >= 75 ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                          )}
                          <span>Alinhamento com Chefe de Aero ({boardroomVerdictStep5.aeroChiefName})</span>
                        </div>
                        <strong className="tabular-nums text-white">{boardroomVerdictStep5.aeroAlignmentPct}%</strong>
                      </div>
                    </div>
                  </div>

                  {isPlayerModifiedProject && (
                    <div className="lg:col-span-5 bg-cyan-950/20 border border-cyan-500/40 p-3.5 space-y-1.5 text-xs font-f1-mono">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-cyan-300 uppercase">
                          Fábrica Customizada pelo Jogador
                        </span>
                        <span className="text-[10px] font-bold text-amber-300 tabular-nums">
                          Trade-offs aplicados ({modifiedParamCount})
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-200 leading-snug">
                        Alterações no Projeto:{' '}
                        <strong className={netRelDeltaVsBase >= 0 ? 'text-emerald-400' : 'text-amber-300'}>
                          {netRelDeltaVsBase >= 0 ? `+${netRelDeltaVsBase}%` : `${netRelDeltaVsBase}%`} confiabilidade
                        </strong>{' '}
                        |{' '}
                        <strong className={netPowerDeltaVsBase >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {netPowerDeltaVsBase >= 0 ? `+${netPowerDeltaVsBase}` : `${netPowerDeltaVsBase}`} CV
                        </strong>{' '}
                        <span className="text-zinc-400 tabular-nums">(Total: {peakCombinedPowerHp} CV)</span>.
                      </div>
                      <div className="text-[11px] text-amber-300 font-bold pt-1 border-t border-cyan-500/20 tabular-nums">
                        Custo de Customização: ${(customizationExtraCostUsd / 1000000).toFixed(1)}M{' '}
                        <span className="text-zinc-400 font-normal">(Horas extras de usinagem e testes)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Nota de Congelamento / Pré-Homologação FIA */}
                <div className="p-2.5 bg-[#15151E] border border-white/5 text-[11px] font-f1-mono text-zinc-400 flex items-center gap-2">
                  {motorHomologadoFIA ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>
                        <strong className="text-amber-400">Nota FIA:</strong> O hardware de {effectiveCustomEngineName} está congelado até o fim da temporada. Modificações permitidas apenas via Software ou Janelas ADUO.
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>
                        <strong className="text-amber-400">Nota FIA:</strong> O prazo de homologação é no fim da pré-temporada. Você ainda pode ajustar a bancada, mas modificações estruturais consomem semanas e orçamento.
                      </span>
                    </>
                  )}
                </div>

                {/* 1. BOTÕES NO TOPO: ABRIR BANCADA DE MONTAGEM & ACEITAR MOTOR E INICIAR CHASSI */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      playRadioSound();
                      if (motorHomologado) {
                        setShowFiaFreezeAlertModal(true);
                      }
                      setSavedSliders({
                        iceEficPot: sliderIceEficPot,
                        iceBloco: sliderIceBloco,
                        iceTorque: sliderIceTorque,
                        iceTurbo: sliderIceTurbo,
                        iceCombustivel: sliderIceCombustivel,
                        iceVirabrequim: sliderIceVirabrequim,
                        ersSoftware: sliderErsSoftware,
                        ersAntiClipping: sliderErsAntiClipping,
                        ersBateria: sliderErsBateria,
                        ersArquitetura: sliderErsArquitetura,
                        thirdPartyErsSupplier,
                        blockAngle: engineBlockAngle,
                        pistonStroke: enginePistonStroke,
                        turboLayout: engineTurboLayout,
                        turboMm: engineTurboMm
                      });
                      setShowBancadaModal(true);
                    }}
                    className="w-full sm:w-auto px-5 py-3 border border-amber-500/40 bg-amber-950/20 hover:bg-amber-950/40 text-amber-300 font-f1-wide font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <Wrench className="w-4 h-4 text-amber-400" />
                    <span>ABRIR BANCADA DE MONTAGEM</span>
                    {modifiedWeeks > 0 && (
                      <span className="ml-1 text-[10px] font-f1-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 border border-amber-500/30 font-bold">
                        +{modifiedWeeks}w MODIFICADAS
                      </span>
                    )}
                  </button>

                  {motorHomologadoFIA && !dynamoFailed && (
                    <button
                      type="button"
                      onClick={() => {
                        playRadioSound();
                        setShowDynamoReportModal(true);
                      }}
                      className="w-full sm:w-auto px-5 py-3 border border-emerald-500/40 bg-emerald-950/25 hover:bg-emerald-950/45 text-emerald-300 font-f1-wide font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span>VER CARD OFICIAL HOMOLOGADO</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (motorHomologadoFIA) {
                        playRadioSound();
                        nextStep();
                      } else {
                        playRadioSound();
                        setShowConfirmGoToDynamoModal(true);
                      }
                    }}
                    className="w-full sm:w-auto px-6 py-3 bg-[#E10600] hover:bg-[#c20500] text-white font-f1-wide font-black text-xs uppercase tracking-wider f1-tab-chamfer transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                  >
                    {motorHomologadoFIA ? (
                      <>
                        <Users className="w-4 h-4" />
                        <span>Avançar para Equipe de Pista (Fase 6)</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <Cpu className="w-4 h-4" />
                        <span>ACEITAR MOTOR E IR PARA O DINAMÔMETRO</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Alerta do Relógio da Pré-Temporada no Dossiê */}
              <div className={`p-4 border font-f1-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                currentWeeksRemaining >= 0
                  ? 'bg-[#1C1C26] border-white/10 text-zinc-300'
                  : 'bg-red-950/40 border-[#E10600] text-red-300'
              }`}>
                <div className="flex items-center gap-2.5">
                  <Calendar className={`w-4 h-4 shrink-0 ${currentWeeksRemaining >= 0 ? 'text-cyan-400' : 'text-[#E10600]'}`} />
                  <div>
                    <span className="font-bold text-white uppercase block">
                      RELÓGIO DA PRÉ-TEMPORADA (ORÇAMENTO FIA: 8 SEMANAS BASE)
                    </span>
                    <span>
                      Faltam <span className={`font-bold ${currentWeeksRemaining >= 0 ? 'text-emerald-400' : 'text-red-400 font-f1-wide text-sm'}`}>{currentWeeksRemaining} semanas</span> para os testes. O tempo de integração da fábrica consumiu <span className="text-white font-bold">{integrationWeeks} semanas</span>{modifiedWeeks > 0 ? ` e as modificações consumiram ${modifiedWeeks} semanas` : ''}.
                    </span>
                  </div>
                </div>
                {currentWeeksRemaining < 0 && (
                  <span className="px-2.5 py-1 bg-[#E10600] text-white font-f1-wide text-[10px] uppercase font-bold shrink-0">
                    CRONOGRAMA ESTOURADO · PRÉ-TEMPORADA PERDIDA
                  </span>
                )}
              </div>

              {/* CALIBRAÇÃO FÍSICA M08 (SI + GATE 08 INTEGRADO NA CONCEPÇÃO DA PU) */}
              <OnboardingM08PowerUnitWorkbench
                vehicleParams={vehicleParamsDraft}
                onUpdateParams={updateVehicleParamsDraft}
                isHardwareLocked={motorHomologadoFIA || isHardwareBlocked}
                isCustomerOrPurchased={isPurchasedEngine}
                supplierName={
                  isEmergency
                    ? effectiveEmergencySupplier
                    : engineChoice === 'customer'
                    ? customerSupplier
                    : engineChoice === 'bought_factory'
                    ? (selectedFactoryId === 'porsche' ? 'Ferrari' : selectedFactoryId === 'cosworth' ? 'Red Bull-Ford' : 'In-House')
                    : 'In-House'
                }
                unlockedMaterials={
                  isEmergency || engineChoice === 'customer'
                    ? getSupplierDnaSpec(isEmergency ? effectiveEmergencySupplier : customerSupplier).starterUnlockedMaterials
                    : engineChoice === 'bought_factory' && selectedFactoryId === 'porsche'
                    ? ['fia_iron_ams6487', 'ferrari_steel_head', 'lightweight_lithium', 'dense_pack']
                    : ['fia_iron_ams6487', 'lightweight_lithium', 'dense_pack']
                }
                headPuName={hiredHeadPuObj?.name || 'Gabriel Santos'}
                headPuTag={headPuProfileInfo?.staffPhilosophyTag || 'INOVADOR'}
                headAeroName={hiredHeadAeroObj?.name || 'Marcus Vance'}
                headAeroTag={headAeroProfileInfo?.staffPhilosophyTag || 'ALTO DOWNFORCE'}
                philosophyCode={philosophyCodeM02}
                philosophyName={philosophyDisplayLabel}
                fuelPartner={fuelPartner}
                relFinalPct={relFinalCalculado}
                requiresLargerSidepods={Boolean(activeThirdPartyErs?.requiresLargerSidepods || engineChoice === 'customer')}
                isBoughtFactoryModified={isPlayerModifiedProject}
                modifiedParamsCount={modifiedParamCount}
              />

              {/* 3 CARDS GRANDES: ICE, ERS, CASAMENTO E INTEGRAÇÃO */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* CARD 1: MOTOR A COMBUSTÃO (ICE) */}
                <div className="bg-[#1C1C26] border border-white/10 p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Header Card 1 */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-amber-500" />
                        <h3 className="font-f1-wide font-bold text-sm text-white uppercase tracking-wider">
                          1. MOTOR A COMBUSTÃO (ICE)
                        </h3>
                      </div>
                      <span className="text-[9px] font-f1-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 border border-amber-500/30 uppercase font-bold">
                        50% TÉRMICO
                      </span>
                    </div>

                    {/* Tabela de Especificações ICE */}
                    <div className="space-y-1.5 text-xs font-f1-mono">
                      <span className="text-[10px] text-zinc-400 uppercase block font-bold tracking-wider mb-2">
                        ESPECIFICAÇÕES DO BLOCO TÉRMICO
                      </span>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-zinc-400">Arquitetura:</span>
                        <span className="text-white font-bold">{dossier.ice.architecture}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-zinc-400">Peso do Bloco:</span>
                        <span className="text-white font-bold tabular-nums">{dossier.ice.blockWeightKg} kg</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-zinc-400">Material dos Pistões:</span>
                        <span className="text-white font-bold">{dossier.ice.pistonMaterial}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-zinc-400">Potência Térmica:</span>
                        <span className="text-amber-400 font-bold tabular-nums">{dossier.ice.thermalPowerHp} CV</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-zinc-400">Torque Máximo:</span>
                        <span className="text-white font-bold tabular-nums">{dossier.ice.torqueNm} Nm</span>
                      </div>
                    </div>

                    {/* Barras de Status ICE */}
                    <div className="space-y-3 pt-2 border-t border-white/10">
                      <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block font-bold tracking-wider">
                        STATUS OPERACIONAL DO ICE
                      </span>

                      {/* Eficiência Térmica */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-f1-mono">
                          <span className="text-zinc-300">Eficiência Térmica:</span>
                          <span className="text-lime-400 font-bold tabular-nums">{dossier.ice.thermalEfficiency}%</span>
                        </div>
                        <div className="h-2 w-full bg-black/60 border border-white/10 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-600 to-lime-400 transition-all duration-300"
                            style={{ width: `${dossier.ice.thermalEfficiency}%` }}
                          />
                        </div>
                      </div>

                      {/* Temperatura de Operação */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-f1-mono">
                          <span className="text-zinc-300">Temperatura de Operação:</span>
                          <span className="text-amber-400 font-bold tabular-nums">{dossier.ice.operatingTempC}°C</span>
                        </div>
                        <div className="h-2 w-full bg-black/60 border border-white/10 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-300"
                            style={{ width: `${Math.min(100, ((dossier.ice.operatingTempC - 80) / 45) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-f1-mono text-zinc-500 block">Tolerância nominal: 95°C - 115°C</span>
                      </div>

                      {/* Tamanho do Turbo (Lag em ms) */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-f1-mono">
                          <span className="text-zinc-300">Tamanho do Turbo (Lag):</span>
                          <span className="text-cyan-400 font-bold tabular-nums">{dossier.ice.turboLagMs} ms</span>
                        </div>
                        <div className="h-2 w-full bg-black/60 border border-white/10 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-amber-500 transition-all duration-300"
                            style={{ width: `${Math.min(100, (dossier.ice.turboLagMs / 60) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-f1-mono text-zinc-500 block">
                          {dossier.ice.turboLagMs <= 25 ? 'Spool Rápido (Menor Inércia)' : 'Turbo Volumoso (Potência em Alta)'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CARD 2: SISTEMA ELÉTRICO (ERS) */}
                <div className="bg-[#1C1C26] border border-white/10 p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Header Card 2 */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-emerald-400" />
                        <h3 className="font-f1-wide font-bold text-sm text-white uppercase tracking-wider">
                          2. SISTEMA ELÉTRICO (ERS)
                        </h3>
                      </div>
                      <span className="text-[9px] font-f1-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 border border-emerald-500/30 uppercase font-bold">
                        50% ELÉTRICO
                      </span>
                    </div>

                    {/* Tabela de Especificações ERS */}
                    <div className="space-y-1.5 text-xs font-f1-mono">
                      <span className="text-[10px] text-zinc-400 uppercase block font-bold tracking-wider mb-2">
                        ESPECIFICAÇÕES DA CADEIA ELÉTRICA
                      </span>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-zinc-400">Peso da Bateria:</span>
                        <span className="text-white font-bold tabular-nums">{dossier.ers.batteryWeightKg} kg</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-zinc-400">Tipo de Célula:</span>
                        <span className="text-white font-bold">{dossier.ers.cellType}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-zinc-400">Potência MGU-K:</span>
                        <span className="text-emerald-400 font-bold tabular-nums">{dossier.ers.mgukPowerKw} kW (~470 CV)</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-zinc-400">Tensão Nominal:</span>
                        <span className="text-white font-bold">800V DC (FIA 2026)</span>
                      </div>
                    </div>

                    {/* Barras de Status ERS */}
                    <div className="space-y-3 pt-2 border-t border-white/10">
                      <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block font-bold tracking-wider">
                        STATUS OPERACIONAL DO ERS
                      </span>

                      {/* Capacidade de Recuperação */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-f1-mono">
                          <span className="text-zinc-300">Capacidade de Recuperação:</span>
                          <span className="text-cyan-400 font-bold tabular-nums">{dossier.ers.recoveryCapacity}%</span>
                        </div>
                        <div className="h-2 w-full bg-black/60 border border-white/10 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-300"
                            style={{ width: `${dossier.ers.recoveryCapacity}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-f1-mono text-zinc-500 block">Eficiência de regeneração em frenagem</span>
                      </div>

                      {/* Risco de Clipping */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-f1-mono">
                          <span className="text-zinc-300">Risco de Clipping:</span>
                          <span className={`font-bold tabular-nums ${dossier.ers.clippingRisk === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {dossier.ers.clippingRisk}%
                          </span>
                        </div>
                        <div className="h-2 w-full bg-black/60 border border-white/10 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              dossier.ers.clippingRisk === 0 ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-red-500'
                            }`}
                            style={{ width: `${Math.max(5, dossier.ers.clippingRisk)}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-f1-mono text-zinc-500 block">
                          {dossier.ers.clippingRisk === 0 ? 'Zero corte elétrico no final de retas' : 'Risco de perda de 350kW em retas longas'}
                        </span>
                      </div>

                      {/* Refrigeração Exigida */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-f1-mono">
                          <span className="text-zinc-300">Refrigeração Exigida:</span>
                          <span className="text-indigo-400 font-bold tabular-nums">{dossier.ers.coolingDemand}%</span>
                        </div>
                        <div className="h-2 w-full bg-black/60 border border-white/10 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-blue-400 transition-all duration-300"
                            style={{ width: `${dossier.ers.coolingDemand}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-f1-mono text-zinc-500 block">Fluxo de ar necessário para a bateria</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CARD 3: CASAMENTO E INTEGRAÇÃO */}
                <div className="bg-[#1C1C26] border border-white/10 p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Header Card 3 */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-cyan-400" />
                        <h3 className="font-f1-wide font-bold text-sm text-white uppercase tracking-wider">
                          3. CASAMENTO E INTEGRAÇÃO
                        </h3>
                      </div>
                      <span className="text-[9px] font-f1-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 border border-cyan-500/30 uppercase font-bold">
                        SINCRONIA TOTAL
                      </span>
                    </div>

                    {/* Gráfico de Sincronia Térmica */}
                    <div className="bg-[#15151E] p-3.5 border border-white/5 space-y-2">
                      <div className="flex justify-between items-center text-xs font-f1-mono">
                        <span className="text-zinc-300 font-bold uppercase">Sincronia Térmica do Conjunto:</span>
                        <span className="text-cyan-400 font-black text-sm tabular-nums">
                          {dossier.integration.thermalSync}%
                        </span>
                      </div>
                      <div className="h-3 w-full bg-black/60 border border-white/10 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400 transition-all duration-300"
                          style={{ width: `${dossier.integration.thermalSync}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-f1-mono text-zinc-400 block">
                        Equilíbrio de dissipação e tolerância mecânica entre bloco V6 e MGU-K.
                      </span>
                    </div>

                    {/* Diagnósticos: Balanço Térmico ICE + ERS e Lag */}
                    <div className="space-y-2.5">
                      {/* Q1: Balanço Térmico ICE + ERS */}
                      <div
                        className={`p-3 border space-y-1 ${
                          detonationWarningActive
                            ? 'bg-red-950/35 border-red-500/60'
                            : thermalOverloadActive
                            ? 'bg-amber-950/25 border-amber-500/40'
                            : 'bg-[#15151E] border-white/5'
                        }`}
                      >
                        <div
                          className={`text-[10px] font-f1-mono font-bold uppercase ${
                            detonationWarningActive
                              ? 'text-red-400'
                              : thermalOverloadActive
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          Balanço Térmico: ICE + ERS
                        </div>
                        <div className="text-[10px] font-f1-mono text-zinc-400">
                          O sistema de refrigeração consegue dissipar o calor do ICE + ERS?
                        </div>
                        <p
                          className={`text-xs leading-relaxed ${
                            detonationWarningActive ? 'text-red-200 font-bold' : 'text-zinc-300'
                          }`}
                        >
                          {dossier.integration.dissipationText}
                        </p>
                      </div>

                      {/* Q2: Preenchimento de Lag */}
                      <div className="bg-[#15151E] p-3 border border-white/5 space-y-1">
                        <div className="text-[10px] font-f1-mono text-cyan-400 font-bold uppercase">
                          Preenchimento de Lag: O ERS compensa o turbo?
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          {dossier.integration.lagCompensationText}
                        </p>
                      </div>
                    </div>

                    {/* Confiabilidade do Motor */}
                    <div className="bg-[#15151E] p-3 border border-white/5 space-y-1 text-xs font-f1-mono">
                      <span className="text-[10px] text-zinc-400 block uppercase font-bold">
                        CONFIABILIDADE FINAL (PU)
                      </span>
                      <div className="text-white font-bold text-xs leading-snug">
                        Confiabilidade Base ({puReliabilityBase}%){' '}
                        {netStressDelta >= 0
                          ? `+ Ajuste (+${netStressDelta}%)`
                          : `- Fator de Estresse (-${Math.abs(netStressDelta)}%)`}{' '}
                        {recalibrateBench ? '+ Dyno (+4%) ' : ''}
                        ={' '}
                        <span
                          className={`text-sm ${
                            relFinalCalculado >= 75
                              ? 'text-emerald-400'
                              : relFinalCalculado >= 65
                              ? 'text-amber-400'
                              : 'text-red-400'
                          }`}
                        >
                          {relFinalCalculado}%
                        </span>
                      </div>
                      <div className="pt-1 flex items-center justify-between">
                        <span className="text-[10px] text-zinc-400">Recalibração Dinamômetro:</span>
                        <button
                          type="button"
                          onClick={() => setRecalibrateBench(!recalibrateBench)}
                          className={`px-2 py-0.5 border text-[10px] font-f1-mono uppercase transition-all cursor-pointer ${
                            recalibrateBench
                              ? 'border-[#E10600] bg-[#E10600] text-white font-bold'
                              : 'border-white/10 bg-[#1C1C26] text-zinc-400'
                          }`}
                        >
                          {recalibrateBench ? '+4% Ativado' : 'Desativado'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* NOVO BLOCO DE DESTAQUE: DIAGNÓSTICO DO ENGENHEIRO-CHEFE */}
              <div className="bg-amber-950/20 border-2 border-amber-500/50 p-4 space-y-2.5 f1-container-frame">
                <div className="flex items-center gap-2 text-amber-400 font-f1-wide font-bold text-xs uppercase tracking-wider">
                  <Wrench className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>DIAGNÓSTICO DO ENGENHEIRO-CHEFE ({activeSupplierLabel.toUpperCase()})</span>
                </div>
                <p className="text-xs font-f1-mono text-amber-200 leading-relaxed italic border-l-2 border-amber-500/60 pl-3">
                  "{getEngineerDiagnosisText()}"
                </p>
                <div className="text-[11px] font-f1-mono text-zinc-300 pt-2 border-t border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span>
                    <strong className="text-white">Recomendação:</strong>{' '}
                    {thermalOverloadActive
                      ? 'Reduza a compressão ou amplie o pacote de refrigeração no CAD.'
                      : engineChoice === 'bought_factory' || engineChoice === 'phoenix'
                      ? 'Avalie modificações na Bancada de Montagem antes de congelar.'
                      : 'Ajuste os sidepods e o difusor no CAD para extrair o máximo deste motor.'}
                  </span>
                  <span className="text-[10px] text-amber-400/80 font-bold uppercase tracking-wider">
                    ANÁLISE DE OFICINA PÓS-HOMOLOGAÇÃO
                  </span>
                </div>
              </div>

              {/* IMPACTO NO DESIGN DO CHASSI E AERODINÂMICA (GDD SEÇÃO 20/21) */}
              <div className="bg-amber-950/25 border border-amber-500/40 p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-f1-wide font-bold text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>IMPACTO TÉCNICO NO DESIGN DO CHASSI & AERODINÂMICA</span>
                </div>
                <p className="text-xs font-bold text-amber-200 leading-relaxed">
                  {dossier.chassisAlert}
                </p>
                <div className="text-[11px] font-f1-mono text-zinc-400 pt-1 border-t border-amber-500/20">
                  Gabarito Físico liberado: Pontos de fixação traseiros do câmbio e envelope de sidepods exportados para o CAD (Seção 20 & 21 do GDD).
                </div>
              </div>

              {/* BOTÕES DE AÇÃO INFERIORES: ABRIR BANCADA & ACEITAR MOTOR E INICIAR CHASSI */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    playRadioSound();
                    if (motorHomologado) {
                      setShowFiaFreezeAlertModal(true);
                    }
                    setSavedSliders({
                      iceEficPot: sliderIceEficPot,
                      iceBloco: sliderIceBloco,
                      iceTorque: sliderIceTorque,
                      iceTurbo: sliderIceTurbo,
                      iceCombustivel: sliderIceCombustivel,
                      iceVirabrequim: sliderIceVirabrequim,
                      ersSoftware: sliderErsSoftware,
                      ersAntiClipping: sliderErsAntiClipping,
                      ersBateria: sliderErsBateria,
                      ersArquitetura: sliderErsArquitetura,
                      thirdPartyErsSupplier,
                      blockAngle: engineBlockAngle,
                      pistonStroke: enginePistonStroke,
                      turboLayout: engineTurboLayout,
                      turboMm: engineTurboMm
                    });
                    setShowBancadaModal(true);
                  }}
                  className="w-full sm:w-1/2 py-4 border border-amber-500/40 bg-amber-950/20 hover:bg-amber-950/40 text-amber-300 font-f1-wide font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Wrench className="w-4 h-4 text-amber-400" />
                  <span>ABRIR BANCADA DE MONTAGEM</span>
                  {modifiedWeeks > 0 && (
                    <span className="text-[10px] font-f1-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 border border-amber-500/30 font-bold">
                      +{modifiedWeeks}w MODIFICADAS
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (motorHomologadoFIA) {
                      playRadioSound();
                      nextStep();
                    } else {
                      playRadioSound();
                      setShowConfirmGoToDynamoModal(true);
                    }
                  }}
                  className="w-full sm:w-1/2 py-4 bg-[#E10600] hover:bg-[#c20500] text-white font-f1-wide font-black text-xs uppercase tracking-wider f1-tab-chamfer transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  {motorHomologadoFIA ? (
                    <>
                      <Users className="w-4 h-4" />
                      <span>Avançar para Equipe de Pista (Fase 6)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>ACEITAR MOTOR E IR PARA O DINAMÔMETRO</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* MODAL 1: NOVA BANCADA DE MONTAGEM (10 SLIDERS EM 2 COLUNAS & ERS MERCEDES) */}
              {showBancadaModal && (
                <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
                  <div className="bg-[#1C1C26] border-2 border-white/20 max-w-5xl w-full p-5 sm:p-7 f1-container-bucket space-y-6 shadow-2xl animate-in zoom-in-95 my-auto max-h-[94vh] overflow-y-auto f1-pattern-micro-grid">
                    {/* Header do Modal */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-amber-400 font-f1-mono text-[11px] font-bold uppercase tracking-widest">
                          <Wrench className="w-4 h-4 text-amber-400" />
                          <span>ENGENHARIA AVANÇADA DE PROPULSÃO · PROTOCOLO FÊNIX</span>
                        </div>
                        <h3 className="font-f1-wide font-black text-xl text-white uppercase tracking-wider flex items-center gap-2.5">
                          <span>Bancada de Montagem Industrial</span>
                          {motorHomologado ? (
                            <span className="text-[10px] font-f1-mono bg-zinc-800 text-amber-400 border border-amber-500/50 px-2 py-0.5 font-bold uppercase inline-flex items-center gap-1 shadow-sm">
                              <Lock className="w-3 h-3 text-amber-400" />
                              <span>MOTOR HOMOLOGADO 🔒</span>
                            </span>
                          ) : hardwareBlockedByTime ? (
                            <span className="text-[10px] font-f1-mono bg-red-950/60 text-red-300 border border-red-500/50 px-2 py-0.5 font-bold uppercase inline-flex items-center gap-1 shadow-sm">
                              <Lock className="w-3 h-3 text-red-400" />
                              <span>TEMPO ESGOTADO (HARDWARE SELADO) 🔒</span>
                            </span>
                          ) : null}
                        </h3>
                        <p className="text-xs text-zinc-400 font-f1-mono">
                          Calibração de tolerâncias mecânicas do ICE e malha de controle eletrotérmico do ERS 2026.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center">
                        {/* Botão de Reset para Original da Fábrica */}
                        <button
                          type="button"
                          disabled={dynamoTested || motorHomologado}
                          onClick={() => {
                            if (dynamoTested || motorHomologado) return;
                            playRadioSound();
                            setHardwareBlockedByTime(false);
                            const dna = activeDna;
                            setSliderIceEficPot(dna.iceEficPot);
                            setSliderIceBloco(dna.iceBloco);
                            setSliderIceTorque(dna.iceTorque);
                            setSliderIceTurbo(dna.iceTurbo);
                            setSliderIceCombustivel(dna.iceCombustivel);
                            setSliderIceVirabrequim(dna.iceVirabrequim);
                            setSliderErsSoftware(dna.ersSoftware);
                            setSliderErsAntiClipping(dna.ersAntiClipping);
                            setSliderErsBateria(dna.ersBateria);
                            setSliderErsArquitetura(dna.ersArquitetura);
                            setThirdPartyErsSupplier(null);
                            setEngineBlockAngle(baseArch.blockAngle);
                            setEnginePistonStroke(baseArch.pistonStroke);
                            setEngineTurboMm(turboLayoutToDefaultMm(baseArch.turboLayout));
                          }}
                          className={`px-3.5 py-2 border text-xs font-f1-wide font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                            (dynamoTested || motorHomologado)
                              ? 'border-white/5 bg-zinc-900/60 text-zinc-600 cursor-not-allowed opacity-50'
                              : 'border-red-500/30 bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 cursor-pointer shadow-sm'
                          }`}
                          title={
                            motorHomologado
                              ? 'Reset bloqueado: o motor já foi homologado e lacrado pela FIA.'
                              : dynamoTested
                              ? 'Reset bloqueado: o motor já foi submetido ao teste do dinamômetro.'
                              : 'Zera todos os sliders e restaura as especificações originais da fábrica'
                          }
                        >
                          {(dynamoTested || motorHomologado) ? <Lock className="w-3.5 h-3.5 text-zinc-500" /> : <RotateCcw className="w-3.5 h-3.5" />}
                          <span>{motorHomologado ? 'RESET BLOQUEADO (MOTOR HOMOLOGADO 🔒)' : dynamoTested ? 'RESET BLOQUEADO (PÓS-DINAMÔMETRO)' : 'RESETAR PARA ORIGINAL DA FÁBRICA'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSliderIceEficPot(savedSliders.iceEficPot);
                            setSliderIceBloco(savedSliders.iceBloco);
                            setSliderIceTorque(savedSliders.iceTorque);
                            setSliderIceTurbo(savedSliders.iceTurbo);
                            setSliderIceCombustivel(savedSliders.iceCombustivel);
                            setSliderIceVirabrequim(savedSliders.iceVirabrequim);
                            setSliderErsSoftware(savedSliders.ersSoftware);
                            setSliderErsAntiClipping(savedSliders.ersAntiClipping);
                            setSliderErsBateria(savedSliders.ersBateria);
                            setSliderErsArquitetura(savedSliders.ersArquitetura);
                            setThirdPartyErsSupplier(savedSliders.thirdPartyErsSupplier);
                            setEngineBlockAngle(savedSliders.blockAngle);
                            setEnginePistonStroke(savedSliders.pistonStroke);
                            setEngineTurboMm(savedSliders.turboMm);
                            setShowBancadaModal(false);
                          }}
                          className="p-2 border border-white/10 bg-[#15151E] hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Banner de Homologação FIA (Se o motor estiver congelado) */}
                    {motorHomologado ? (
                      <div className="bg-amber-950/60 border-2 border-amber-500/70 p-4 f1-container-bucket flex items-start gap-3.5 shadow-lg">
                        <div className="w-9 h-9 bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                          <Lock className="w-5 h-5 text-amber-400" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-f1-wide font-black text-sm text-white uppercase tracking-wider">
                              PROJETO SELADO PELA FIA · HARDWARE CONGELADO 🔒
                            </span>
                            <span className="text-[10px] font-f1-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 font-bold uppercase">
                              HOMOLOGAÇÃO 2026
                            </span>
                          </div>
                          <p className="text-xs text-zinc-300 font-f1-mono leading-relaxed">
                            O hardware desta PU está congelado até o fim da temporada. Sliders de ICE, Materiais e Células ERS estão permanentemente bloqueados. <strong>Apenas os sliders de Software (Deploy/Harvest e Anti-Clipping) permanecem editáveis</strong> para ajuste fino nos finais de semana de corrida.
                          </p>
                        </div>
                      </div>
                    ) : hardwareBlockedByTime ? (
                      <div className="bg-red-950/60 border-2 border-red-500/70 p-4 f1-container-bucket flex items-start gap-3.5 shadow-lg">
                        <div className="w-9 h-9 bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0">
                          <Lock className="w-5 h-5 text-red-400" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-f1-wide font-black text-sm text-white uppercase tracking-wider">
                              TEMPO DE PRÉ-TEMPORADA ESGOTADO · HARDWARE SELADO 🔒
                            </span>
                            <span className="text-[10px] font-f1-mono bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 font-bold uppercase">
                              PRAZO FIA EXPIRADO
                            </span>
                          </div>
                          <p className="text-xs text-zinc-300 font-f1-mono leading-relaxed">
                            As 8 semanas de pré-temporada acabaram. Os comissários da FIA aplicaram os lacres compulsórios no hardware. As especificações físicas estão congeladas. <strong>Prossiga para o Dinamômetro para testar a Unidade de Potência.</strong>
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {/* 4. ALERTA VISUAL NA BANCADA: AVISO EM VERMELHO NO TOPO */}
                    <div className="bg-red-950/70 border-2 border-red-500/80 p-3.5 f1-container-bucket flex items-center gap-3 shadow-lg">
                      <div className="w-8 h-8 bg-red-600/20 border border-red-500/50 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                      </div>
                      <p className="text-xs font-f1-mono text-red-200 leading-tight">
                        <strong className="text-white uppercase font-f1-wide">Atenção:</strong> Alterar a arquitetura de um motor de fábrica é um processo industrial complexo. Cada alteração estrutural adiciona <strong className="text-amber-300 font-bold">+4 semanas</strong> ao seu cronograma.
                      </p>
                    </div>

                    {/* 1. SEÇÃO DE ARQUITETURA MECÂNICA & GEOMETRIA DO BLOCO (UNIFICADA) */}
                    <div className={`bg-[#15151E] border-2 ${isHardwareBlocked ? 'border-zinc-700/60' : 'border-amber-500/40'} p-4 f1-container-bucket space-y-3 shadow-lg`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 ${isHardwareBlocked ? 'bg-zinc-800 border-zinc-600' : 'bg-amber-950/60 border-amber-500/40'} border flex items-center justify-center shrink-0`}>
                            {isHardwareBlocked ? <Lock className="w-4 h-4 text-zinc-400" /> : <Wrench className="w-4 h-4 text-amber-400" />}
                          </div>
                          <div>
                            <span className={`text-[10px] font-f1-mono font-bold uppercase tracking-widest block ${isHardwareBlocked ? 'text-zinc-400' : 'text-amber-400'}`}>
                              {motorHomologado ? 'ESPINHA DORSAL CONGELADA PELA FIA 🔒' : hardwareBlockedByTime ? 'TEMPO ESGOTADO · HARDWARE BLOQUEADO 🔒' : 'ARQUITETURA PRÉ-HOMOLOGAÇÃO (EDITÁVEL)'}
                            </span>
                            <h4 className="font-f1-wide font-black text-sm sm:text-base text-white uppercase tracking-wider flex items-center gap-2">
                              <span>ARQUITETURA MECÂNICA & GEOMETRIA DO BLOCO</span>
                              <span className="text-[10px] font-f1-mono text-zinc-400 font-normal">
                                ({baseArch.supplierOrFactory})
                              </span>
                            </h4>
                          </div>
                        </div>
                        <span className={`text-[10px] font-f1-mono px-2.5 py-1 font-bold shrink-0 self-start sm:self-center border ${
                          isHardwareBlocked
                            ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        }`}>
                          {motorHomologado ? 'CONGELADO FIA 🔒' : hardwareBlockedByTime ? 'TEMPO ESGOTADO 🔒' : 'LIBERADO P/ MODIFICAÇÃO (+4w/alteração)'}
                        </span>
                      </div>

                      {/* Grade com os 5 Parâmetros de Arquitetura */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {/* 1. Ângulo do Bloco */}
                        <div className={`p-2.5 border space-y-2 ${isHardwareBlocked ? 'bg-zinc-900/60 border-white/5 opacity-60' : 'bg-[#1C1C26] border-white/10'}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-f1-mono text-zinc-400 uppercase font-bold tracking-wider">
                              1. Ângulo do Bloco
                            </span>
                            {isHardwareBlocked ? <Lock className="w-3 h-3 text-zinc-500" /> : isBlockAngleChanged ? (
                              <span className="text-[9px] font-f1-mono bg-amber-500/20 text-amber-300 px-1 font-bold border border-amber-500/30">+4w</span>
                            ) : null}
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              disabled={isHardwareBlocked}
                              onClick={() => {
                                playRadioSound();
                                setEngineBlockAngle('90');
                              }}
                              className={`py-1.5 px-1 text-center border text-[10px] font-f1-mono transition-all ${
                                isHardwareBlocked ? 'cursor-not-allowed' : 'cursor-pointer'
                              } ${
                                engineBlockAngle === '90'
                                  ? 'border-amber-500 bg-amber-950/50 text-white font-bold ring-1 ring-amber-400'
                                  : 'border-white/10 bg-[#15151E] text-zinc-400 hover:text-white'
                              }`}
                            >
                              <div className="font-bold">V6 90°</div>
                              <div className="text-[8px] text-zinc-400">Estreito</div>
                            </button>
                            <button
                              type="button"
                              disabled={isHardwareBlocked}
                              onClick={() => {
                                playRadioSound();
                                setEngineBlockAngle('120');
                              }}
                              className={`py-1.5 px-1 text-center border text-[10px] font-f1-mono transition-all ${
                                isHardwareBlocked ? 'cursor-not-allowed' : 'cursor-pointer'
                              } ${
                                engineBlockAngle === '120'
                                  ? 'border-amber-500 bg-amber-950/50 text-white font-bold ring-1 ring-amber-400'
                                  : 'border-white/10 bg-[#15151E] text-zinc-400 hover:text-white'
                              }`}
                            >
                              <div className="font-bold">V6 120°</div>
                              <div className="text-[8px] text-zinc-400">Largo (CG Baixo)</div>
                            </button>
                          </div>
                          <span className="text-[8px] font-f1-mono text-zinc-500 block truncate">
                            Base: V6 {baseArch.blockAngle}° {isBlockAngleChanged ? '(Modificado)' : '(Original)'}
                          </span>
                        </div>

                        {/* 2. Curso do Pistão */}
                        <div className={`p-2.5 border space-y-2 ${isHardwareBlocked ? 'bg-zinc-900/60 border-white/5 opacity-60' : 'bg-[#1C1C26] border-white/10'}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-f1-mono text-zinc-400 uppercase font-bold tracking-wider">
                              2. Curso do Pistão
                            </span>
                            {isHardwareBlocked ? <Lock className="w-3 h-3 text-zinc-500" /> : isPistonStrokeChanged ? (
                              <span className="text-[9px] font-f1-mono bg-amber-500/20 text-amber-300 px-1 font-bold border border-amber-500/30">+4w</span>
                            ) : null}
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              disabled={isHardwareBlocked}
                              onClick={() => {
                                playRadioSound();
                                setEnginePistonStroke('longo');
                              }}
                              className={`py-1.5 px-1 text-center border text-[10px] font-f1-mono transition-all ${
                                isHardwareBlocked ? 'cursor-not-allowed' : 'cursor-pointer'
                              } ${
                                enginePistonStroke === 'longo'
                                  ? 'border-amber-500 bg-amber-950/50 text-white font-bold ring-1 ring-amber-400'
                                  : 'border-white/10 bg-[#15151E] text-zinc-400 hover:text-white'
                              }`}
                            >
                              <div className="font-bold">Longo</div>
                              <div className="text-[8px] text-zinc-400">Torque</div>
                            </button>
                            <button
                              type="button"
                              disabled={isHardwareBlocked}
                              onClick={() => {
                                playRadioSound();
                                setEnginePistonStroke('curto');
                              }}
                              className={`py-1.5 px-1 text-center border text-[10px] font-f1-mono transition-all ${
                                isHardwareBlocked ? 'cursor-not-allowed' : 'cursor-pointer'
                              } ${
                                enginePistonStroke === 'curto'
                                  ? 'border-amber-500 bg-amber-950/50 text-white font-bold ring-1 ring-amber-400'
                                  : 'border-white/10 bg-[#15151E] text-zinc-400 hover:text-white'
                              }`}
                            >
                              <div className="font-bold">Curto</div>
                              <div className="text-[8px] text-zinc-400">Giro Alto</div>
                            </button>
                          </div>
                          <span className="text-[8px] font-f1-mono text-zinc-500 block truncate">
                            Base: Curso {baseArch.pistonStroke === 'longo' ? 'Longo' : 'Curto'} {isPistonStrokeChanged ? '(Modificado)' : '(Original)'}
                          </span>
                        </div>

                        {/* 3. Diâmetro / Layout Contínuo do Turbo (GDD Sec. 30: 78–104 mm) */}
                        <div className={`p-2.5 border space-y-2 ${isHardwareBlocked ? 'bg-zinc-900/60 border-white/5 opacity-60' : 'bg-[#1C1C26] border-white/10'}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-f1-mono text-zinc-400 uppercase font-bold tracking-wider">
                              3. Diâmetro do Turbo (mm)
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-f1-mono text-cyan-300 font-bold tabular-nums">
                                {engineTurboMm} mm
                              </span>
                              {isHardwareBlocked ? <Lock className="w-3 h-3 text-zinc-500" /> : isTurboLayoutChanged ? (
                                <span className="text-[9px] font-f1-mono bg-amber-500/20 text-amber-300 px-1 font-bold border border-amber-500/30">+4w</span>
                              ) : null}
                            </div>
                          </div>
                          <input
                            type="range"
                            disabled={isHardwareBlocked}
                            min={78}
                            max={104}
                            step={1}
                            value={engineTurboMm}
                            onChange={(e) => {
                              const nextMm = Math.max(78, Math.min(104, Number(e.target.value)));
                              setEngineTurboMm(nextMm);
                            }}
                            className="w-full accent-amber-500 cursor-pointer disabled:cursor-not-allowed"
                          />
                          <div className="flex justify-between text-[8px] font-f1-mono text-zinc-400">
                            <span>78 Pequeno</span>
                            <span>91 Padrão</span>
                            <span>104 Grande</span>
                          </div>
                          <span className="text-[8px] font-f1-mono text-zinc-500 block truncate">
                            Base: {turboLayoutToDefaultMm(baseArch.turboLayout)} mm ({baseArch.turboLayout}) {isTurboLayoutChanged ? '(Modificado)' : '(Original)'}
                          </span>
                        </div>

                        {/* 4. Tecnologia da Bateria */}
                        <div className="bg-[#1C1C26] border border-white/10 p-2.5 space-y-1 relative">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-f1-mono text-zinc-400 uppercase font-bold tracking-wider">
                              4. Tecnologia Bateria
                            </span>
                            <Lock className="w-3 h-3 text-zinc-500" />
                          </div>
                          <div className="font-f1-wide font-black text-xs text-white uppercase truncate" title={baseArch.batteryTech}>
                            {baseArch.batteryTech}
                          </div>
                          <span className="text-[8px] font-f1-mono text-zinc-500 block">Células ERS 350kW FIA</span>
                        </div>

                        {/* 5. Injeção */}
                        <div className="bg-[#1C1C26] border border-white/10 p-2.5 space-y-1 relative col-span-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-f1-mono text-zinc-400 uppercase font-bold tracking-wider">
                              5. Injeção
                            </span>
                            <Lock className="w-3 h-3 text-zinc-500" />
                          </div>
                          <div className="font-f1-wide font-black text-xs text-white uppercase truncate" title={baseArch.injectionType}>
                            {baseArch.injectionType}
                          </div>
                          <span className="text-[8px] font-f1-mono text-zinc-500 block">Injeção direta de alta pressão FIA</span>
                        </div>
                      </div>
                    </div>

                    {/* Top Diagnostics: Contador de Atraso, Índice de Harmonia & Custo de Engenharia */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs font-f1-mono">
                      {/* Box 1: Contador de Semanas Restantes e Pré-Temporada */}
                      <div className={`p-4 border space-y-2 ${semanasRestantesCalculadas > 0 ? 'bg-[#15151E] border-white/10' : 'bg-red-950/30 border-red-500/50'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                            SEMANAS RESTANTES DE PRÉ-TEMPORADA
                          </span>
                          <span className={`text-base font-f1-wide font-black ${semanasRestantesCalculadas > 3 ? 'text-emerald-400' : semanasRestantesCalculadas > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                            {semanasRestantesCalculadas} SEMANAS
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-300 leading-relaxed bg-[#1C1C26] p-2 border border-white/5 flex items-center justify-between">
                          <span className="text-zinc-400">Tempo de Modificações:</span>
                          <span className={`font-bold font-f1-mono ${modifiedWeeks > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            +{modifiedWeeks}w ({iceWeeksTotal}w ICE / {ersWeeksTotal}w ERS)
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px]">
                          <span className="text-zinc-400">Status do Cronograma:</span>
                          <span className={`font-bold ${semanasRestantesCalculadas > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {semanasRestantesCalculadas > 0 ? `${semanasRestantesCalculadas} semanas disponíveis` : 'Tempo Esgotado · Hardware Selado'}
                          </span>
                        </div>
                        {semanasRestantesCalculadas <= 0 && (
                          <div className="bg-red-950/60 border border-red-500/40 p-2 text-[10px] text-red-200 font-bold leading-tight">
                            ⚠ ATENÇÃO: As 8 semanas de pré-temporada acabaram! O hardware foi selado pela FIA. Prossiga para o Dinamômetro.
                          </div>
                        )}
                      </div>

                      {/* Box 2: Índice de Harmonia */}
                      <div className="bg-[#15151E] p-4 border border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                            ÍNDICE DE HARMONIA
                          </span>
                          <span className={`text-base font-f1-wide font-black ${
                            indiceHarmonia >= 80 ? 'text-emerald-400' : indiceHarmonia >= 70 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {indiceHarmonia} / 100
                          </span>
                        </div>
                        {/* Barra de Progresso de Harmonia */}
                        <div className="h-2.5 w-full bg-black/60 border border-white/10 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              indiceHarmonia >= 80 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : indiceHarmonia >= 70 ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-gradient-to-r from-red-600 to-red-400'
                            }`}
                            style={{ width: `${indiceHarmonia}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-zinc-400 pt-1 flex items-center justify-between">
                          <span>Sincronia ICE/ERS & Equilíbrio Térmico</span>
                          <span className={`font-bold ${indiceHarmonia >= 70 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {indiceHarmonia >= 80 ? 'Estável' : indiceHarmonia >= 70 ? 'Atenção' : 'Alto Risco de Quebra'}
                          </span>
                        </div>
                        {indiceHarmonia < 70 && (
                          <div className="bg-red-950/60 border border-red-500/40 p-2 text-[10px] text-red-200 font-bold leading-tight">
                            ⚠ ALERTA CRÍTICO: Harmonia abaixo de 70! Risco extremo de fundição no ensaio de carga plena a 15.000 RPM!
                          </div>
                        )}
                        {activeThirdPartyErs && activeErsHarmonyInfo && (
                          <div className={`text-[10px] font-bold leading-snug p-2 border ${
                            activeErsHarmonyInfo.delta >= 0
                              ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-300'
                              : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                          }`}>
                            <div>
                              Acoplamento ICE × ERS {activeThirdPartyErs.supplier}:{' '}
                              <span className="tabular-nums">
                                {activeErsHarmonyInfo.delta >= 0 ? `+${activeErsHarmonyInfo.delta}%` : `${activeErsHarmonyInfo.delta}%`} no desempenho e harmonia
                              </span>
                            </div>
                            <div className="text-[9px] font-normal opacity-90 mt-0.5">{activeErsHarmonyInfo.reason}</div>
                          </div>
                        )}
                      </div>

                      {/* Box 3: Custo de Engenharia */}
                      <div className="bg-[#15151E] p-4 border border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                            <span>CUSTO DE ENGENHARIA</span>
                          </span>
                          <span className="text-[10px] font-f1-mono text-zinc-400 uppercase">
                            P&D INDUSTRIAL
                          </span>
                        </div>

                        <div className="space-y-1.5 pt-0.5">
                          {/* Custo do Protótipo + Customização */}
                          <div className="bg-[#1C1C26] p-2 border border-white/5 space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-zinc-400 uppercase">Custo do Protótipo:</span>
                              <span className="font-f1-wide font-black text-white text-sm tabular-nums">
                                ${(custoPrototipo / 1000000).toFixed(1)}M
                              </span>
                            </div>
                            <span className="text-[9px] text-zinc-500 block leading-tight">
                              Base: $2.0M {totalIndustrialChanges > 0 ? `+ $${(totalIndustrialChanges * 0.5).toFixed(1)}M (${totalIndustrialChanges} mod.)` : ''}{activeThirdPartyErs ? ` + ${activeThirdPartyErs.costText} (ERS ${activeThirdPartyErs.supplier})` : totalIndustrialChanges === 0 ? '(Sem alterações físicas)' : ''}
                            </span>
                            {totalIndustrialChanges > 0 && (
                              <div className="text-[10px] text-amber-300 font-bold pt-1 border-t border-white/5 tabular-nums">
                                Custo de Customização: ${((custoPrototipo - 2000000) / 1000000).toFixed(1)}M (Horas extras de usinagem e testes)
                              </div>
                            )}
                          </div>

                          {/* Custo de Produção */}
                          <div className="bg-[#1C1C26] p-2 border border-white/5 space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-zinc-400 uppercase">Custo de Produção:</span>
                              <span className="font-f1-wide font-black text-cyan-400 text-xs">
                                ${(custoPorMotor / 1000000).toFixed(1)}M <span className="text-[9px] text-zinc-400 font-normal">/ un</span>
                              </span>
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px]">
                              <span className="text-zinc-400 font-bold">Custo Final (8 motores):</span>
                              <span className="font-bold text-white">${(custoProducaoTotal / 1000000).toFixed(1)}M</span>
                            </div>
                            <span className="text-[9px] text-zinc-500 block">
                              Exigência FIA: 8 motores (4 para cada piloto)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* DUAS COLUNAS: ICE (6 SLIDERS) & ERS (4 SLIDERS) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* COLUNA 1: MOTOR A COMBUSTÃO (ICE) - 6 SLIDERS */}
                      <div className="space-y-4 bg-[#15151E] p-4 border border-white/10">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <span className="text-xs font-f1-wide font-black text-white uppercase flex items-center gap-2">
                            <Flame className="w-4 h-4 text-orange-400" />
                            <span>COLUNA 1: MOTOR A COMBUSTÃO (ICE)</span>
                          </span>
                          <span className="text-[10px] font-f1-mono text-zinc-400 uppercase">
                            Hardware Térmico
                          </span>
                        </div>

                        {/* Slider 1: Eficiência Térmica vs Potência (Software) */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-f1-mono">
                            <span className="text-white font-bold flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
                              <span>1. Eficiência Térmica vs Potência</span>
                              {motorHomologadoFIA && (
                                <span className="text-[10px] font-f1-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-1.5 py-0.2 font-bold">
                                  SOFTWARE LIBERADO ⚡
                                </span>
                              )}
                            </span>
                            <span className="text-orange-400 font-bold bg-orange-950/40 px-2 py-0.5 border border-orange-500/30 text-[11px]">
                              {sliderIceEficPot >= 65 ? `${sliderIceEficPot}% (Foco Eficiência)` : sliderIceEficPot <= 35 ? `${sliderIceEficPot}% (Foco Potência)` : `${sliderIceEficPot}% (Equilibrado)`} · +{iceEficPotWeeks} sem.
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={1}
                            disabled={false}
                            value={sliderIceEficPot}
                            onChange={(e) => setSliderIceEficPot(Number(e.target.value))}
                            className="w-full accent-[#E10600] h-2 bg-[#252533] rounded-lg cursor-pointer"
                          />
                          <div className="flex justify-between text-[10px] font-f1-mono text-zinc-400">
                            <span>Potência Extrema (+PWR)</span>
                            <span>Eficiência Máxima (E-Fuel 95)</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px] font-f1-mono pt-1">
                            <span className="text-emerald-400">
                              ✓ {sliderIceEficPot >= 50 ? `+${Math.round((sliderIceEficPot - 50) * 0.16)} Eficiência E-Fuel (Zero Fuel Saving)` : `+${Math.round((50 - sliderIceEficPot) * 0.16)} PWR térmico em reta`}
                            </span>
                            <span className="text-rose-400 text-right">
                              ✗ {sliderIceEficPot >= 50 ? 'Menor velocidade terminal em retas (-2 PWR)' : 'Maior estresse térmico (+10°C / Fuel Saving)'}
                            </span>
                          </div>
                        </div>

                        {/* Slider 2: Materiais do Bloco */}
                        <div className={`space-y-1.5 pt-2 border-t border-white/5 ${isHardwareBlocked ? 'opacity-60' : ''}`}>
                          <div className="flex items-center justify-between text-xs font-f1-mono">
                            <span className="text-white font-bold flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                              <span>2. Materiais do Bloco</span>
                              {isHardwareBlocked && <Lock className="w-3.5 h-3.5 text-amber-400 inline" />}
                            </span>
                            <span className="text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 border border-emerald-500/30 text-[11px]">
                              {sliderIceBloco === 0 ? 'Aço AMS 6487 (FIA)' : sliderIceBloco >= 80 ? 'Cabeçote Aço Especial' : 'Liga Al-Si + 15CDV6'} · +{iceBlocoWeeks} sem.
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={1}
                            disabled={isHardwareBlocked}
                            value={sliderIceBloco}
                            onChange={(e) => setSliderIceBloco(Number(e.target.value))}
                            className={`w-full accent-[#E10600] h-2 bg-[#252533] rounded-lg ${isHardwareBlocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                          />
                          <div className="flex justify-between text-[10px] font-f1-mono text-zinc-400">
                            <span>Liga Ferro Padrão FIA [AMS 6487]</span>
                            <span>Aço Especial / Cabeçote Alta Temp</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px] font-f1-mono pt-1">
                            <span className="text-emerald-400">
                              ✓ {sliderIceBloco > 0 ? `+${Math.round((sliderIceBloco / 100) * 8)}% Confiabilidade (REL)` : 'Peso mínimo no chassi (142kg)'}
                            </span>
                            <span className="text-rose-400 text-right">
                              ✗ {sliderIceBloco > 0 ? `+${Math.round((sliderIceBloco / 100) * 12)} kg de massa traseira` : 'Risco de trinca sob pressão'}
                            </span>
                          </div>
                        </div>

                        {/* Slider 3: Curva de Torque (Software) */}
                        <div className="space-y-1.5 pt-2 border-t border-white/5">
                          <div className="flex items-center justify-between text-xs font-f1-mono">
                            <span className="text-white font-bold flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                              <span>3. Curva de Torque</span>
                              {motorHomologadoFIA && (
                                <span className="text-[10px] font-f1-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-1.5 py-0.2 font-bold">
                                  SOFTWARE LIBERADO ⚡
                                </span>
                              )}
                            </span>
                            <span className="text-amber-400 font-bold bg-amber-950/40 px-2 py-0.5 border border-amber-500/30 text-[11px]">
                              {sliderIceTorque <= 35 ? `${sliderIceTorque}% (Torque Linear)` : sliderIceTorque >= 65 ? `${sliderIceTorque}% (Coice em Alta)` : `${sliderIceTorque}% (Equilibrado)`} · +{iceTorqueWeeks} sem.
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={1}
                            disabled={false}
                            value={sliderIceTorque}
                            onChange={(e) => setSliderIceTorque(Number(e.target.value))}
                            className="w-full accent-[#E10600] h-2 bg-[#252533] rounded-lg cursor-pointer"
                          />
                          <div className="flex justify-between text-[10px] font-f1-mono text-zinc-400">
                            <span>Torque Linear (Saída Lenta / Progressivo)</span>
                            <span>Coice Agressivo (Alta Rotação / Fim de Reta)</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px] font-f1-mono pt-1">
                            <span className="text-emerald-400">
                              ✓ {sliderIceTorque >= 50 ? 'Tração e potência de topo em 8ª marcha' : 'Aceleração vigorosa e linear em saídas lentas'}
                            </span>
                            <span className="text-rose-400 text-right">
                              ✗ {sliderIceTorque >= 50 ? 'Patinação de pneus e maior desgaste térmico' : 'Déficit de velocidade final em retas longas'}
                            </span>
                          </div>
                        </div>

                        {/* Slider 5: Mapeamento de Combustível (Software) */}
                        <div className="space-y-1.5 pt-2 border-t border-white/5">
                          <div className="flex items-center justify-between text-xs font-f1-mono">
                            <span className="text-white font-bold flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                              <span>5. Mapeamento de Combustível</span>
                              {motorHomologadoFIA && (
                                <span className="text-[10px] font-f1-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-1.5 py-0.2 font-bold">
                                  SOFTWARE LIBERADO ⚡
                                </span>
                              )}
                            </span>
                            <span className="text-red-400 font-bold bg-red-950/40 px-2 py-0.5 border border-red-500/30 text-[11px]">
                              {sliderIceCombustivel}% · +{iceCombustivelWeeks} sem.
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={1}
                            disabled={false}
                            value={sliderIceCombustivel}
                            onChange={(e) => setSliderIceCombustivel(Number(e.target.value))}
                            className="w-full accent-[#E10600] h-2 bg-[#252533] rounded-lg cursor-pointer"
                          />
                          <div className="flex justify-between text-[10px] font-f1-mono text-zinc-400">
                            <span>Mistura Pobre (Eco Saver)</span>
                            <span>Mistura Rica (Injeção Extrema)</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px] font-f1-mono pt-1">
                            <span className="text-emerald-400">
                              ✓ {sliderIceCombustivel >= 50 ? `+${Math.round((sliderIceCombustivel - 50) * 0.12)} PWR injeção direta` : 'Consumo reduzido (zero fuel saving)'}
                            </span>
                            <span className="text-rose-400 text-right">
                              ✗ {sliderIceCombustivel >= 50 ? 'Risco elevado de detonação na câmara' : 'Déficit de aceleração nas relargadas'}
                            </span>
                          </div>
                        </div>

                        {/* Slider 6: Inércia do Virabrequim */}
                        <div className={`space-y-1.5 pt-2 border-t border-white/5 ${isHardwareBlocked ? 'opacity-60' : ''}`}>
                          <div className="flex items-center justify-between text-xs font-f1-mono">
                            <span className="text-white font-bold flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-violet-400 inline-block" />
                              <span>6. Inércia do Virabrequim</span>
                              {isHardwareBlocked && <Lock className="w-3.5 h-3.5 text-amber-400 inline" />}
                            </span>
                            <span className="text-violet-400 font-bold bg-violet-950/40 px-2 py-0.5 border border-violet-500/30 text-[11px]">
                              {sliderIceVirabrequim}% · +{iceVirabrequimWeeks} sem.
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={1}
                            disabled={isHardwareBlocked}
                            value={sliderIceVirabrequim}
                            onChange={(e) => setSliderIceVirabrequim(Number(e.target.value))}
                            className={`w-full accent-[#E10600] h-2 bg-[#252533] rounded-lg ${isHardwareBlocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                          />
                          <div className="flex justify-between text-[10px] font-f1-mono text-zinc-400">
                            <span>Pesado Balanceado (Zero Vibração)</span>
                            <span>Ultra-Leve Aliviado (Rev-up Rápido)</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px] font-f1-mono pt-1">
                            <span className="text-emerald-400">
                              ✓ {sliderIceVirabrequim >= 50 ? '+4% Subida rápida de giro (rev up)' : '+5% Vida útil e integridade mecânica'}
                            </span>
                            <span className="text-rose-400 text-right">
                              ✗ {sliderIceVirabrequim >= 50 ? 'Vibrações de 2ª ordem severas no câmbio' : 'Giro lento e menor agilidade'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* COLUNA 2: SISTEMA ELÉTRICO (ERS) - 4 SLIDERS & BOTÃO MERCEDES */}
                      <div className="space-y-4 bg-[#15151E] p-4 border border-white/10">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <span className="text-xs font-f1-wide font-black text-white uppercase flex items-center gap-2">
                            <Zap className="w-4 h-4 text-cyan-400" />
                            <span>COLUNA 2: SISTEMA ELÉTRICO (ERS)</span>
                          </span>
                          <span className="text-[10px] font-f1-mono text-zinc-400 uppercase">
                            Software & MGU-K 350kW
                          </span>
                        </div>

                        {/* 2. MERCADO DE FORNECEDORES DE ERS (5 MONTADORAS) */}
                        <div className="bg-[#1C1C26] p-3.5 border border-white/10 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-f1-mono text-zinc-400 uppercase font-bold tracking-wider">
                              FORNECIMENTO EXTERNO DE ERS
                            </span>
                            {activeThirdPartyErs ? (
                              <span className="text-[10px] font-f1-mono bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 font-bold uppercase">
                                ERS {activeThirdPartyErs.supplier} ATIVO
                              </span>
                            ) : motorHomologado ? (
                              <span className="text-[10px] font-f1-mono bg-zinc-800 text-amber-400 border border-amber-500/40 px-2 py-0.5 font-bold uppercase inline-flex items-center gap-1">
                                <Lock className="w-3 h-3 text-amber-400" />
                                <span>TRAVADO FIA</span>
                              </span>
                            ) : isHardwareBlocked ? (
                              <span className="text-[10px] font-f1-mono bg-zinc-800 text-zinc-400 border border-zinc-700 px-2 py-0.5 font-bold uppercase inline-flex items-center gap-1">
                                <Lock className="w-3 h-3 text-zinc-400" />
                                <span>TEMPO ESGOTADO</span>
                              </span>
                            ) : null}
                          </div>

                          {activeThirdPartyErs ? (
                            <div className="space-y-2 text-[10px] font-f1-mono">
                              <div className="text-xs text-emerald-300 leading-relaxed">
                                ✓ <strong>{activeThirdPartyErs.fullName}</strong>
                              </div>
                              <div className="bg-[#15151E] p-2.5 border border-white/5 space-y-2">
                                <div className="grid grid-cols-3 gap-1.5 pb-1.5 border-b border-white/5">
                                  <div>
                                    <span className="text-zinc-500 block">HARDWARE · PESO</span>
                                    <span className="text-white font-bold tabular-nums">
                                      {activeThirdPartyErs.weightKg} kg ({activeThirdPartyErs.weightDeltaKg === 0 ? 'Base' : `${activeThirdPartyErs.weightDeltaKg > 0 ? `+${activeThirdPartyErs.weightDeltaKg}` : activeThirdPartyErs.weightDeltaKg}kg`})
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-zinc-500 block">CONFIABILIDADE</span>
                                    <span className="text-cyan-300 font-bold tabular-nums">{activeThirdPartyErs.reliabilityScore}/100</span>
                                  </div>
                                  <div>
                                    <span className="text-zinc-500 block">INSTALAÇÃO</span>
                                    <span className="text-amber-300 font-bold tabular-nums">{activeThirdPartyErs.costText} · +{activeThirdPartyErs.delayWeeks} sem.</span>
                                  </div>
                                </div>
                                <div className="text-zinc-300 leading-snug">
                                  <span className="text-blue-300 font-bold">Software:</span> {activeThirdPartyErs.softwareDeployLabel} · {activeThirdPartyErs.softwareControlNote}
                                </div>
                                <div className="text-zinc-300 leading-snug pt-1 border-t border-white/5">
                                  <span className="text-amber-300 font-bold">Integração no Carro:</span> {activeThirdPartyErs.aeroImpactText}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-zinc-400 font-f1-mono leading-relaxed">
                              {motorHomologado
                                ? 'O período de homologação expirou. Contratações de ERS de terceiros só podem ser solicitadas na próxima temporada.'
                                : isHardwareBlocked
                                ? 'O tempo de pré-temporada expirou. O hardware está congelado para montagem no dinamômetro.'
                                : 'Compare os 5 fornecedores do grid (Mercedes, Ferrari, Honda, Red Bull-Ford e Audi) e escolha o pacote ERS adequado ao seu bloco ICE.'}
                            </p>
                          )}

                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              type="button"
                              disabled={isHardwareBlocked}
                              onClick={() => {
                                if (isHardwareBlocked) return;
                                playRadioSound();
                                setShowErsMarketModal(true);
                              }}
                              className={`flex-1 py-2.5 border-2 text-white font-f1-wide font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md ${
                                isHardwareBlocked
                                  ? 'bg-zinc-800/60 border-white/10 text-zinc-500 cursor-not-allowed'
                                  : activeThirdPartyErs
                                  ? 'bg-emerald-950/50 hover:bg-emerald-900/60 border-emerald-500 cursor-pointer'
                                  : 'bg-red-950/40 hover:bg-red-900/60 border-[#E10600] cursor-pointer'
                              }`}
                            >
                              {isHardwareBlocked ? <Lock className="w-4 h-4 text-zinc-500" /> : <Zap className="w-4 h-4 text-cyan-400" />}
                              <span>
                                {motorHomologado
                                  ? 'AQUISIÇÃO BLOQUEADA (MOTOR HOMOLOGADO 🔒)'
                                  : isHardwareBlocked
                                  ? 'AQUISIÇÃO BLOQUEADA (TEMPO ESGOTADO 🔒)'
                                  : activeThirdPartyErs
                                  ? `ERS ${activeThirdPartyErs.supplier.toUpperCase()} SELECIONADO`
                                  : 'SELECIONAR FORNECEDOR DE ERS'}
                              </span>
                            </button>

                            {activeThirdPartyErs && !isHardwareBlocked && (
                              <button
                                type="button"
                                onClick={() => {
                                  playRadioSound();
                                  setThirdPartyErsSupplier(null);
                                }}
                                className="px-3 py-2.5 bg-[#252533] hover:bg-[#2F2F40] border border-white/20 text-zinc-300 text-[10px] font-f1-wide font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0"
                              >
                                Remover
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Slider 7: Software (Recuperação vs Implantação) */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-f1-mono">
                            <span className="text-white font-bold flex items-center gap-1.5 flex-wrap">
                              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
                              <span>7. Software (Recuperação vs Implantação)</span>
                              {thirdPartyErsMercedes ? (
                                <span className="text-[10px] font-f1-mono text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 px-1.5 py-0.2 font-bold">
                                  FOCO SEGURANÇA MERCEDES
                                </span>
                              ) : motorHomologadoFIA ? (
                                <span className="text-[10px] font-f1-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-1.5 py-0.2 font-bold">
                                  SOFTWARE LIBERADO ⚡
                                </span>
                              ) : null}
                            </span>
                            <span className="text-cyan-400 font-bold bg-cyan-950/40 px-2 py-0.5 border border-cyan-500/30 text-[11px]">
                              {`${sliderErsSoftware}% · +${ersSoftwareWeeks} sem.`}
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={1}
                            value={sliderErsSoftware}
                            onChange={(e) => setSliderErsSoftware(Number(e.target.value))}
                            className="w-full accent-[#E10600] cursor-pointer h-2 bg-[#252533] rounded-lg"
                          />
                          <div className="flex justify-between text-[10px] font-f1-mono text-zinc-400">
                            <span>Recuperação 350kW (Frenagem)</span>
                            <span>Deploy Agressivo (Retas)</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px] font-f1-mono pt-1">
                            <span className="text-emerald-400">
                              ✓ {sliderErsSoftware >= 50 ? 'Deploy agressivo de 350kW em retas' : 'Bateria sempre carregada para o setor 3'}
                            </span>
                            <span className="text-rose-400 text-right">
                              ✗ {sliderErsSoftware >= 50 ? 'Risco de descarregar antes da linha de chegada' : 'Falta de entrega de potência em disputas'}
                            </span>
                          </div>
                        </div>

                        {/* Slider 8: Curva Anti-Clipping */}
                        <div className="space-y-1.5 pt-2 border-t border-white/5">
                          <div className="flex items-center justify-between text-xs font-f1-mono">
                            <span className="text-white font-bold flex items-center gap-1.5 flex-wrap">
                              <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                              <span>8. Curva Anti-Clipping</span>
                              {thirdPartyErsMercedes ? (
                                <span className="text-[10px] font-f1-mono text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 px-1.5 py-0.2 font-bold">
                                  SEGURANÇA 100% (MERCEDES)
                                </span>
                              ) : motorHomologadoFIA ? (
                                <span className="text-[10px] font-f1-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-1.5 py-0.2 font-bold">
                                  SOFTWARE LIBERADO ⚡
                                </span>
                              ) : null}
                            </span>
                            <span className="text-blue-400 font-bold bg-blue-950/40 px-2 py-0.5 border border-blue-500/30 text-[11px]">
                              {`${sliderErsAntiClipping}% · +${ersAntiClippingWeeks} sem.`}
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={1}
                            value={sliderErsAntiClipping}
                            onChange={(e) => setSliderErsAntiClipping(Number(e.target.value))}
                            className="w-full accent-[#E10600] cursor-pointer h-2 bg-[#252533] rounded-lg"
                          />
                          <div className="flex justify-between text-[10px] font-f1-mono text-zinc-400">
                            <span>Padrão de Fábrica (Corte Brusco)</span>
                            <span>Curva Preditiva FIA 2026 (Anti-Clipping)</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px] font-f1-mono pt-1">
                            <span className="text-emerald-400">
                              ✓ {sliderErsAntiClipping > 0 ? `Reduz clipping para ${Math.max(0, 100 - sliderErsAntiClipping)}%` : 'Mapeamento elétrico simplificado'}
                            </span>
                            <span className="text-rose-400 text-right">
                              ✗ {sliderErsAntiClipping > 0 ? 'Requer calibração complexa de microcódigo' : 'Corte abrupto de 350kW no fim das retas'}
                            </span>
                          </div>
                        </div>

                        {/* Slider 9: Química das Células (Densa vs Lítio) */}
                        <div className={`space-y-1.5 pt-2 border-t border-white/5 ${(isMercedesBatteryLocked || isHardwareBlocked) ? 'opacity-60' : ''}`}>
                          <div className="flex items-center justify-between text-xs font-f1-mono">
                            <span className="text-white font-bold flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-lime-400 inline-block" />
                              <span>9. Química das Células (Densa vs Lítio)</span>
                              {(isMercedesBatteryLocked || isHardwareBlocked) && <Lock className="w-3.5 h-3.5 text-amber-400 inline" />}
                            </span>
                            <span className="text-lime-400 font-bold bg-lime-950/40 px-2 py-0.5 border border-lime-500/30 text-[11px]">
                              {isMercedesBatteryLocked ? '70% (Mercedes Packs 🔒)' : (sliderErsBateria <= 30 ? 'Lítio Leve' : sliderErsBateria >= 70 ? 'Células Densas' : 'Química Mista')} · +{ersBateriaWeeks} sem.
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={1}
                            disabled={isMercedesBatteryLocked || isHardwareBlocked}
                            value={isMercedesBatteryLocked ? 70 : sliderErsBateria}
                            onChange={(e) => setSliderErsBateria(Number(e.target.value))}
                            className={`w-full accent-[#E10600] h-2 bg-[#252533] rounded-lg ${(isMercedesBatteryLocked || isHardwareBlocked) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                          />
                          <div className="flex justify-between text-[10px] font-f1-mono text-zinc-400">
                            <span>Lítio Leve (-Peso / +Risco de Calor)</span>
                            <span>Células Densas (+Peso / -Calor)</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px] font-f1-mono pt-1">
                            <span className="text-emerald-400">
                              ✓ {sliderErsBateria >= 50 ? '+15 kW contínuos e alta estabilidade térmica' : 'Chassi 12kg mais leve no centro de gravidade'}
                            </span>
                            <span className="text-rose-400 text-right">
                              ✗ {sliderErsBateria >= 50 ? '+14kg de peso estático adicional no assoalho' : 'Sensibilidade crítica a altas temperaturas'}
                            </span>
                          </div>
                        </div>

                        {/* Slider 10: Arquitetura (Modular vs Compacto) */}
                        <div className={`space-y-1.5 pt-2 border-t border-white/5 ${(isMercedesBatteryLocked || isHardwareBlocked) ? 'opacity-60' : ''}`}>
                          <div className="flex items-center justify-between text-xs font-f1-mono">
                            <span className="text-white font-bold flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" />
                              <span>10. Arquitetura (Modular vs Compacto)</span>
                              {(isMercedesBatteryLocked || isHardwareBlocked) && <Lock className="w-3.5 h-3.5 text-amber-400 inline" />}
                            </span>
                            <span className="text-teal-400 font-bold bg-teal-950/40 px-2 py-0.5 border border-teal-500/30 text-[11px]">
                              {isMercedesBatteryLocked ? '70% (Mercedes 🔒)' : `${sliderErsArquitetura}% · +${ersArquiteturaWeeks} sem.`}
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={1}
                            disabled={isMercedesBatteryLocked || isHardwareBlocked}
                            value={isMercedesBatteryLocked ? 70 : sliderErsArquitetura}
                            onChange={(e) => setSliderErsArquitetura(Number(e.target.value))}
                            className={`w-full accent-[#E10600] h-2 bg-[#252533] rounded-lg ${(isMercedesBatteryLocked || isHardwareBlocked) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                          />
                          <div className="flex justify-between text-[10px] font-f1-mono text-zinc-400">
                            <span>Modular (Manutenção Fácil)</span>
                            <span>Ultra-Compacto Integrado ao Câmbio</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px] font-f1-mono pt-1">
                            <span className="text-emerald-400">
                              ✓ {sliderErsArquitetura > 0 ? '+5 Downforce na carenagem traseira e difusor' : 'Fácil manutenção e isolamento EMI'}
                            </span>
                            <span className="text-rose-400 text-right">
                              ✗ {sliderErsArquitetura > 0 ? 'Interferência eletromagnética (EMI) próxima à ECU' : 'Carenagem traseira mais volumosa (+arrasto)'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Botões de Ação na Base do Modal */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          setSliderIceEficPot(savedSliders.iceEficPot);
                          setSliderIceBloco(savedSliders.iceBloco);
                          setSliderIceTorque(savedSliders.iceTorque);
                          setSliderIceTurbo(savedSliders.iceTurbo);
                          setSliderIceCombustivel(savedSliders.iceCombustivel);
                          setSliderIceVirabrequim(savedSliders.iceVirabrequim);
                          setSliderErsSoftware(savedSliders.ersSoftware);
                          setSliderErsAntiClipping(savedSliders.ersAntiClipping);
                          setSliderErsBateria(savedSliders.ersBateria);
                          setSliderErsArquitetura(savedSliders.ersArquitetura);
                          setThirdPartyErsSupplier(savedSliders.thirdPartyErsSupplier);
                          setEngineBlockAngle(savedSliders.blockAngle);
                          setEnginePistonStroke(savedSliders.pistonStroke);
                          setEngineTurboMm(savedSliders.turboMm);
                          setShowBancadaModal(false);
                        }}
                        className="w-full sm:w-auto px-5 py-3 border border-white/10 bg-[#15151E] hover:bg-white/5 text-zinc-300 font-f1-wide font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                      >
                        CANCELAR E VOLTAR AO DOSSIÊ
                      </button>

                      <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => {
                            playRadioSound();
                            setSavedSliders({
                              iceEficPot: sliderIceEficPot,
                              iceBloco: sliderIceBloco,
                              iceTorque: sliderIceTorque,
                              iceTurbo: sliderIceTurbo,
                              iceCombustivel: sliderIceCombustivel,
                              iceVirabrequim: sliderIceVirabrequim,
                              ersSoftware: sliderErsSoftware,
                              ersAntiClipping: sliderErsAntiClipping,
                              ersBateria: sliderErsBateria,
                              ersArquitetura: sliderErsArquitetura,
                              thirdPartyErsSupplier,
                              blockAngle: engineBlockAngle,
                              pistonStroke: enginePistonStroke,
                              turboLayout: engineTurboLayout,
                              turboMm: engineTurboMm
                            });
                            updateVehicleParamsDraft({
                              iceMaterial: sliderIceBloco >= 50 ? 'titanium' : 'aluminum',
                              iceMetallurgyId: sliderIceBloco >= 75 ? 'ferrari_steel_head' : sliderIceBloco >= 35 ? 'al_si_low_friction' : 'fia_iron_ams6487',
                              iceCompressionRatio: Math.round((15.2 + (sliderIceCombustivel / 100) * 1.0) * 100) / 100,
                              turboDiameterMm: Math.max(78, Math.min(104, engineTurboMm)),
                              batteryCellTech: (isMercedesBatteryLocked || sliderErsBateria >= 50) ? 'dense_pack' : 'lightweight_lithium',
                              ersDeployBiasPct: sliderErsSoftware
                            });
                            setShowBancadaModal(false);
                          }}
                          className="w-full sm:w-auto px-5 py-3 border border-white/20 bg-[#252533] hover:bg-[#2F2F40] text-white font-f1-wide font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                        >
                          APLICAR E VER NO DOSSIÊ
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            playRadioSound();
                            setSavedSliders({
                              iceEficPot: sliderIceEficPot,
                              iceBloco: sliderIceBloco,
                              iceTorque: sliderIceTorque,
                              iceTurbo: sliderIceTurbo,
                              iceCombustivel: sliderIceCombustivel,
                              iceVirabrequim: sliderIceVirabrequim,
                              ersSoftware: sliderErsSoftware,
                              ersAntiClipping: sliderErsAntiClipping,
                              ersBateria: sliderErsBateria,
                              ersArquitetura: sliderErsArquitetura,
                              thirdPartyErsSupplier,
                              blockAngle: engineBlockAngle,
                              pistonStroke: enginePistonStroke,
                              turboLayout: engineTurboLayout,
                              turboMm: engineTurboMm
                            });
                            updateVehicleParamsDraft({
                              iceMaterial: sliderIceBloco >= 50 ? 'titanium' : 'aluminum',
                              iceMetallurgyId: sliderIceBloco >= 75 ? 'ferrari_steel_head' : sliderIceBloco >= 35 ? 'al_si_low_friction' : 'fia_iron_ams6487',
                              iceCompressionRatio: Math.round((15.2 + (sliderIceCombustivel / 100) * 1.0) * 100) / 100,
                              turboDiameterMm: Math.max(78, Math.min(104, engineTurboMm)),
                              batteryCellTech: (isMercedesBatteryLocked || sliderErsBateria >= 50) ? 'dense_pack' : 'lightweight_lithium',
                              ersDeployBiasPct: sliderErsSoftware
                            });
                            setShowBancadaModal(false);
                            setShowConfirmGoToDynamoModal(true);
                          }}
                          className="w-full sm:w-auto px-6 py-3 bg-[#E10600] hover:bg-[#c20500] text-white font-f1-wide font-black text-xs uppercase tracking-wider f1-tab-chamfer transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>HOMOLOGAR MODIFICAÇÕES E IR AO DINAMÔMETRO</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* MODAL DE SELEÇÃO DE FORNECEDOR DE ERS (5 MONTADORAS) */}
              {showErsMarketModal && (
                <div className="fixed inset-0 z-[130] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                  <div className="bg-[#1C1C26] border-2 border-cyan-500/60 max-w-[1360px] w-full p-5 sm:p-6 f1-container-bucket space-y-5 shadow-2xl animate-in zoom-in-95 my-auto">
                    <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-f1-mono text-cyan-400 font-bold uppercase tracking-widest block">
                          MERCADO DE SUBSISTEMAS ELÉTRICOS · 350KW FIA 2026
                        </span>
                        <h3 className="font-f1-wide font-black text-lg text-white uppercase tracking-wider">
                          SELECIONAR FORNECEDOR DE ERS
                        </h3>
                        <p className="text-[11px] font-f1-mono text-zinc-400">
                          Cada pacote separa o <strong className="text-cyan-300">Hardware Elétrico</strong>, o <strong className="text-blue-300">Software de Controle</strong> e a <strong className="text-amber-300">Integração no Carro</strong> (acoplamento com o ICE e demanda nos Sidepods).
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowErsMarketModal(false)}
                        className="p-2 border border-white/10 bg-[#15151E] hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3.5 items-stretch">
                      {(['Mercedes', 'Ferrari', 'Honda', 'Red Bull-Ford', 'Audi'] as CustomerEngineSupplier[]).map((sup) => {
                        const opt = THIRD_PARTY_ERS_OPTIONS[sup];
                        const isSelected = thirdPartyErsSupplier === sup;
                        const harmonyPreview = computeIceErsHarmonyDelta(sup);

                        return (
                          <div
                            key={sup}
                            className={`p-4 border flex flex-col justify-between gap-4 transition-all ${
                              isSelected
                                ? 'bg-[#15151E] border-cyan-400 ring-1 ring-cyan-400'
                                : 'bg-[#15151E] border-white/10 hover:border-white/30'
                            }`}
                          >
                            <div className="space-y-3">
                              {/* Cabeçalho do Fornecedor */}
                              <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2.5">
                                <div>
                                  <span className="font-f1-wide font-black text-sm text-white uppercase block leading-tight">
                                    {sup}
                                  </span>
                                  <span className="text-[10px] font-f1-mono text-zinc-400 block mt-0.5">
                                    {opt.fullName}
                                  </span>
                                </div>
                                <span className="text-xs font-f1-mono font-bold text-amber-300 tabular-nums whitespace-nowrap shrink-0">
                                  {opt.costText}
                                </span>
                              </div>

                              {/* 1. HARDWARE ELÉTRICO (350kW) */}
                              <div className="space-y-1.5 text-[11px] font-f1-mono">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                                  <Zap className="w-3.5 h-3.5 shrink-0" />
                                  <span>Hardware Elétrico (350kW)</span>
                                </div>
                                <div className="flex justify-between gap-2">
                                  <span className="text-zinc-400">Peso do Pack:</span>
                                  <span className={`font-bold tabular-nums text-right ${opt.weightDeltaKg < 0 ? 'text-emerald-400' : opt.weightDeltaKg > 0 ? 'text-amber-300' : 'text-zinc-200'}`}>
                                    {opt.weightKg} kg ({opt.weightDeltaKg === 0 ? 'Base' : `${opt.weightDeltaKg > 0 ? `+${opt.weightDeltaKg}` : opt.weightDeltaKg}kg vs. Base`})
                                  </span>
                                </div>
                                <div className="flex justify-between gap-2">
                                  <span className="text-zinc-400">Confiabilidade Base:</span>
                                  <span className={`font-bold tabular-nums ${opt.reliabilityScore >= 85 ? 'text-cyan-300' : opt.reliabilityScore < 70 ? 'text-red-400' : 'text-zinc-200'}`}>
                                    {opt.reliabilityScore}/100
                                  </span>
                                </div>
                                <p className="text-[10px] text-zinc-400 leading-snug pt-0.5">
                                  {opt.hardwareNote}
                                </p>
                              </div>

                              {/* 2. SOFTWARE & CONTROLE */}
                              <div className="pt-2.5 border-t border-white/10 space-y-1.5 text-[11px] font-f1-mono">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-400">
                                  <Cpu className="w-3.5 h-3.5 shrink-0" />
                                  <span>Software & Controle</span>
                                </div>
                                <div>
                                  <span className="text-zinc-400 block text-[10px]">Deploy & Eficiência:</span>
                                  <span className="text-white font-bold leading-snug block">
                                    {opt.softwareDeployLabel}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-zinc-400 block text-[10px]">Segurança & Sliders:</span>
                                  <p className="text-[10px] text-zinc-300 leading-snug">
                                    {opt.softwareControlNote}
                                  </p>
                                </div>
                              </div>

                              {/* 3. INTEGRAÇÃO NO CARRO */}
                              <div className="pt-2.5 border-t border-white/10 space-y-2 text-[11px] font-f1-mono">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                                  <Wrench className="w-3.5 h-3.5 shrink-0" />
                                  <span>Integração no Carro</span>
                                </div>
                                <div>
                                  <div className="flex justify-between gap-2">
                                    <span className="text-zinc-400">Acoplamento c/ Motor:</span>
                                    <span className={`font-bold tabular-nums ${harmonyPreview.delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                      {harmonyPreview.delta >= 0 ? `+${harmonyPreview.delta}%` : `${harmonyPreview.delta}%`}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-zinc-400 leading-snug mt-0.5">
                                    {harmonyPreview.delta >= 0
                                      ? `Soma ao desempenho final e harmonia do motor (${harmonyPreview.reason}).`
                                      : `Aplicado como penalidade direta ao desempenho final do motor e margem de quebra (${harmonyPreview.reason}).`}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-zinc-400 block text-[10px]">Impacto Aerodinâmico:</span>
                                  <span className={`font-bold leading-snug block ${opt.requiresLargerSidepods || opt.coolingScore < 65 ? 'text-amber-300' : 'text-emerald-400'}`}>
                                    {opt.aeroDemandLevel}
                                  </span>
                                  <p className="text-[10px] text-zinc-300 leading-snug mt-0.5">
                                    {opt.aeroImpactText}
                                  </p>
                                </div>
                                <div className="flex justify-between gap-2 pt-1 border-t border-white/5">
                                  <span className="text-zinc-400">Tempo de Instalação:</span>
                                  <span className="text-white font-bold tabular-nums">
                                    +{opt.delayWeeks} {opt.delayWeeks === 1 ? 'Semana' : 'Semanas'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                playRadioSound();
                                setThirdPartyErsSupplier(sup);
                                if (sup === 'Mercedes') {
                                  // Foco em segurança (Anti-Clipping a 100%) e trava sliders de hardware da bateria (9 e 10)
                                  setSliderErsAntiClipping(100);
                                  setSliderErsSoftware(45);
                                } else if (sup === 'Ferrari') {
                                  // Exige sidepods maiores no P&D (penalidade de arrasto)
                                  if (chassisSidepodConcept === 'zeropod') {
                                    setChassisSidepodConcept('conventional');
                                  }
                                  updateVehicleParamsDraft({
                                    sidepodInletAreaCm2: Math.max(395, vehicleParamsDraft.sidepodInletAreaCm2),
                                    hotAirExitAreaCm2: Math.max(380, vehicleParamsDraft.hotAirExitAreaCm2)
                                  });
                                } else if (sup === 'Red Bull-Ford') {
                                  // Alta entrega elétrica
                                  updateVehicleParamsDraft({
                                    mgukMaxKw: 350,
                                    ersDeployBiasPct: Math.max(65, sliderErsSoftware)
                                  });
                                }
                                setShowErsMarketModal(false);
                              }}
                              className={`w-full py-2.5 font-f1-wide font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                                isSelected
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-[#E10600] hover:bg-[#c20500] text-white'
                              }`}
                            >
                              {isSelected ? 'Selecionado' : `Escolher ${sup}`}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* MODAL 2: RELATÓRIO DE TESTE NO DINAMÔMETRO (A TELA 3 REFORMULADA) */}
              {showDynamoReportModal && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                  <div className={`bg-[#1C1C26] border-2 max-w-2xl w-full p-6 f1-container-bucket space-y-5 shadow-2xl animate-in zoom-in-95 my-auto ${
                    dynamoFailed ? 'border-[#E10600]' : 'border-emerald-500'
                  }`}>
                    {/* Header do Dinamômetro */}
                    <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                      {dynamoFailed ? (
                        <div className="w-12 h-12 bg-red-950/60 border-2 border-red-500 flex items-center justify-center shrink-0 shadow-[0_0_15px_#E10600]">
                          <Flame className="w-6 h-6 text-[#E10600] animate-bounce" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-emerald-950/60 border-2 border-emerald-500 flex items-center justify-center shrink-0 shadow-[0_0_15px_#10B981]">
                          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                        </div>
                      )}

                      <div className="space-y-0.5">
                        <span className="text-[10px] font-f1-mono uppercase tracking-widest text-zinc-400 block font-bold">
                          FIA HOMOLOGATION · BANCADA DE TESTES A 15.000 RPM
                        </span>
                        <h3 className={`font-f1-wide font-black text-xl uppercase tracking-wider ${
                          dynamoFailed ? 'text-[#E10600]' : 'text-emerald-400'
                        }`}>
                          {dynamoFailed ? 'MOTOR FUNDIU NA BANCADA' : 'RELATÓRIO DE TESTE NO DINAMÔMETRO: APROVADO'}
                        </h3>
                      </div>
                    </div>

                    {/* CENÁRIO 1: O MOTOR FUNDIU (FALHA CRÍTICA) */}
                    {dynamoFailed ? (
                      <div className="space-y-4">
                        <div className="bg-red-950/30 border border-red-500/40 p-4 space-y-2 font-f1-mono text-xs">
                          <div className="flex items-center gap-2 text-red-400 font-bold uppercase tracking-wider text-[11px]">
                            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                            <span>FALHA CATASTRÓFICA EM CARGA MÁXIMA</span>
                          </div>
                          <p className="text-red-200 leading-relaxed text-xs">
                            Durante o ensaio de estresse térmico a 15.000 RPM sob carga máxima, a detonação na câmara de combustão superou os limites metalúrgicos. O pistão fundiu, as válvulas colidiram e o inversor do MGU-K sofreu curto-circuito catastrófico. O motor de testes está destruído!
                          </p>
                          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-red-500/20 text-[10px]">
                            <div>
                              <span className="text-zinc-400 block">Índice de Harmonia:</span>
                              <span className="text-red-400 font-bold text-xs">{indiceHarmonia} / 100</span>
                            </div>
                            <div>
                              <span className="text-zinc-400 block">Chance de Quebra:</span>
                              <span className="text-red-400 font-bold text-xs">{chanceFalhaDinamometro}%</span>
                            </div>
                            <div>
                              <span className="text-zinc-400 block">Erro de Correlação:</span>
                              <span className="text-amber-400 font-bold text-xs">{erroCorrelacaoPercent >= 0 ? `+${erroCorrelacaoPercent}%` : `${erroCorrelacaoPercent}%`}</span>
                            </div>
                          </div>
                        </div>

                        {/* Alerta de Perda Financeira do Protótipo */}
                        <div className="bg-red-950/80 border-2 border-red-600 p-3.5 text-xs font-f1-mono text-red-200 flex items-center gap-2.5">
                          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 animate-pulse" />
                          <div>
                            <span className="font-bold text-red-100 block text-xs">
                              O protótipo foi destruído no teste. Você perdeu o investimento de ${(lastIncurredPrototypeCost / 1000000).toFixed(1)}M.
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              O custo do protótipo foi debitado do Caixa e computado no Teto de Gastos FIA. O custo de produção em série não foi cobrado.
                            </span>
                          </div>
                        </div>

                        {/* As 3 Opções de Recuperação Exclusivas */}
                        <div className="space-y-3 pt-1">
                          <span className="text-[10px] font-f1-mono text-zinc-400 uppercase font-bold tracking-wider block">
                            SELECIONE O PROTOCOLO DE RECUPERAÇÃO DA EQUIPE:
                          </span>

                          {/* OPÇÃO A: Usar Motor Original de Fábrica (Sem Modificações) */}
                          <div className="bg-[#15151E] border border-amber-500/40 p-4 space-y-2.5 text-left">
                            <div className="flex items-center justify-between">
                              <span className="font-f1-wide font-black text-xs text-white uppercase flex items-center gap-1.5">
                                <span className="text-amber-400">OPÇÃO A:</span> Usar Motor Original de Fábrica (Sem Modificações)
                              </span>
                              <span className="text-[10px] font-f1-mono bg-white/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 font-bold">
                                CUSTO: $0
                              </span>
                            </div>
                            <p className="text-xs text-zinc-300 font-f1-mono leading-relaxed italic">
                              "Descarte todas as modificações e use o motor base exatamente como veio da fábrica."
                            </p>
                            <div className="text-[11px] font-f1-mono bg-black/40 p-2.5 border border-red-500/30 text-red-300">
                              <strong className="text-red-400">Efeito:</strong> O carro corre, mas com os defeitos originais (ex: {
                                engineChoice === 'bought_factory'
                                  ? (selectedFactoryId === 'porsche'
                                      ? 'Porsche vai ferver por causa do software'
                                      : selectedFactoryId === 'cosworth'
                                      ? 'Cosworth com pistões frágeis e sem ERS próprio'
                                      : selectedFactoryId === 'renault'
                                      ? 'Renault com ERS pesado e sidepods alargados'
                                      : selectedFactoryId === 'bmw'
                                      ? 'BMW com vibração do virabrequim no chassi'
                                      : 'Toyota com déficit de 0,5s/volta por ERS defasado')
                                  : (customerSupplier === 'Mercedes'
                                      ? 'Mercedes com reatividade baixa em largadas'
                                      : customerSupplier === 'Honda'
                                      ? 'Honda com vibrações excessivas'
                                      : customerSupplier === 'Ferrari'
                                      ? 'Ferrari com derating prematuro no fim das retas'
                                      : customerSupplier === 'Red Bull-Ford'
                                      ? 'Red Bull-Ford com integração inicial de MGU-K'
                                      : 'Audi com alto turbo lag')
                              }).
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                playRadioSound();
                                const dna = activeDna;
                                setSliderIceEficPot(dna.iceEficPot);
                                setSliderIceBloco(dna.iceBloco);
                                setSliderIceTorque(dna.iceTorque);
                                setSliderIceTurbo(dna.iceTurbo);
                                setSliderIceCombustivel(dna.iceCombustivel);
                                setSliderIceVirabrequim(dna.iceVirabrequim);
                                setSliderErsSoftware(dna.ersSoftware);
                                setSliderErsAntiClipping(dna.ersAntiClipping);
                                setSliderErsBateria(dna.ersBateria);
                                setSliderErsArquitetura(dna.ersArquitetura);
                                setThirdPartyErsSupplier(null);
                                setEmergencyMercedesDeal(false);
                                setEmergencySupplier(null);
                                setAbandonedToZero(false);
                                setDynamoFailed(false);
                                setDynamoTested(true);
                                setShowDynamoReportModal(false);
                                setShowBancadaModal(false);
                              }}
                              className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white font-f1-wide font-bold text-xs uppercase tracking-wider transition-all border border-white/20 flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <span>Usar Motor Original de Fábrica ($0)</span>
                            </button>
                          </div>

                          {/* OPÇÃO B: Acordo Emergencial com Fornecedor Cliente */}
                          <div className="bg-red-950/20 border-2 border-red-500/60 p-4 space-y-3 text-left shadow-lg">
                            <div className="flex items-center justify-between">
                              <span className="font-f1-wide font-black text-xs text-red-200 uppercase flex items-center gap-1.5">
                                <Zap className="w-4 h-4 text-amber-400" />
                                <span className="text-red-400">OPÇÃO B:</span> Acordo Emergencial (Compra de PU Cliente)
                              </span>
                              <span className="text-[10px] font-f1-mono bg-red-950/80 text-red-300 border border-red-500/40 px-2 py-0.5 font-bold">
                                CUSTO: $20M · +2 SEMANAS
                              </span>
                            </div>

                            <p className="text-xs text-zinc-300 font-f1-mono leading-relaxed">
                              Selecione um fornecedor de emergência no mercado (Disponibilidade Imediata).
                            </p>

                            {/* Grade horizontal com os 5 motores clientes disponíveis */}
                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
                              {(['Mercedes', 'Ferrari', 'Honda', 'Red Bull-Ford', 'Audi'] as CustomerEngineSupplier[]).map(sup => {
                                const isSelected = selectedEmergencySupplier === sup;
                                const opt = EMERGENCY_ENGINE_OPTIONS[sup];
                                return (
                                  <button
                                    key={sup}
                                    type="button"
                                    onClick={() => {
                                      playRadioSound();
                                      setSelectedEmergencySupplier(sup);
                                    }}
                                    className={`p-2.5 text-left border transition-all cursor-pointer flex flex-col justify-between relative rounded-sm ${
                                      isSelected
                                        ? 'bg-red-950/80 border-red-500 shadow-[0_0_15px_rgba(225,6,0,0.6)] ring-1 ring-red-400'
                                        : 'bg-[#15151E] border-white/10 hover:border-white/30 hover:bg-white/5 opacity-80'
                                    }`}
                                  >
                                    {isSelected && (
                                      <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                                    )}
                                    <div className="space-y-1">
                                      <span className="text-[8px] font-f1-mono font-bold tracking-widest text-zinc-400 uppercase block truncate">
                                        {opt.tag}
                                      </span>
                                      <span className="font-f1-wide font-black text-xs text-white uppercase block leading-tight">
                                        {sup}
                                      </span>
                                    </div>

                                    <div className="pt-2 space-y-1 border-t border-white/10 mt-2">
                                      <div className="flex items-center justify-between text-[10px] font-f1-mono">
                                        <span className="text-zinc-400">PWR: <strong className="text-zinc-200">{opt.pwr}</strong></span>
                                        <span className="text-zinc-400">REL: <strong className="text-zinc-200">{opt.rel}</strong></span>
                                      </div>
                                      <div className="text-[9px] font-f1-mono font-bold text-red-400 bg-red-950/60 p-1 border border-red-500/30 leading-snug">
                                        {opt.penaltyStat}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Resumo de Penalidades Gerais e Específicas */}
                            <div className="text-[11px] font-f1-mono bg-black/50 p-3 border border-red-500/30 space-y-2">
                              <div className="text-zinc-300">
                                <strong className="text-white">Penalidade Específica ({selectedEmergencySupplier}): </strong>
                                <span className="text-red-300">{EMERGENCY_ENGINE_OPTIONS[selectedEmergencySupplier].penaltyDetail}</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1.5 border-t border-red-500/20 text-[10px] text-red-400 font-bold">
                                <span className="flex items-center gap-1">✗ Custo Base: $20.000.000</span>
                                <span className="flex items-center gap-1">✗ Atraso: +2 Semanas</span>
                                <span className="flex items-center gap-1">✗ Erro de Correlação: +15%</span>
                              </div>
                            </div>

                            {/* Botão de Assinatura com Nome do Fornecedor e Custo */}
                            <button
                              type="button"
                              onClick={() => {
                                playRadioSound();
                                setEmergencyMercedesDeal(true);
                                setEmergencySupplier(selectedEmergencySupplier);
                                setCustomerSupplier(selectedEmergencySupplier);
                                setThirdPartyErsSupplier(null);
                                setAbandonedToZero(false);
                                setDynamoFailed(false);
                                setDynamoTested(true);
                                setShowDynamoReportModal(false);
                                setShowBancadaModal(false);
                              }}
                              className="w-full py-3 bg-[#E10600] hover:bg-[#c20500] text-white font-f1-wide font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Zap className="w-4 h-4" />
                              <span>Assinar Acordo de Emergência ({selectedEmergencySupplier} - $20M)</span>
                            </button>
                          </div>

                          {/* OPÇÃO C: Construir do Zero (Protocolo Fênix Total) */}
                          <div className="bg-amber-950/20 border-2 border-amber-500/60 p-4 space-y-2.5 text-left shadow-lg">
                            <div className="flex items-center justify-between">
                              <span className="font-f1-wide font-black text-xs text-amber-200 uppercase flex items-center gap-1.5">
                                <Flame className="w-4 h-4 text-amber-400" />
                                <span className="text-amber-400">OPÇÃO C:</span> Construir do Zero (Protocolo Fênix Total)
                              </span>
                              <span className="text-[10px] font-f1-mono bg-amber-950/80 text-amber-300 border border-amber-500/40 px-2 py-0.5 font-bold">
                                18 SEMANAS ATRASO
                              </span>
                            </div>
                            <p className="text-xs text-zinc-300 font-f1-mono leading-relaxed italic">
                              "Jogar o motor da fábrica no lixo e iniciar a construção de um motor 100% novo."
                            </p>
                            <div className="text-[11px] font-f1-mono bg-black/40 p-2.5 border border-amber-500/30 space-y-1">
                              <div className="text-zinc-300">
                                <strong className="text-white">Efeito:</strong> Você perde os testes e as primeiras 4 corridas, mas terá o motor perfeitamente integrado ao chassi.
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1 text-[10px] text-amber-300 font-bold">
                                <span>✗ 18 Semanas de atraso (Estreia em Miami)</span>
                                <span>✗ Perde Testes & 4 Primeiras Corridas (DNS)</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                playRadioSound();
                                setAbandonedToZero(true);
                                setEmergencyMercedesDeal(false);
                                setEmergencySupplier(null);
                                setThirdPartyErsSupplier(null);
                                setDynamoFailed(false);
                                setDynamoTested(true);
                                setShowDynamoReportModal(false);
                                setShowBancadaModal(false);
                              }}
                              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-f1-wide font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <span>Iniciar Protocolo Fênix Total</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : motorHomologadoFIA ? (
                      /* CENÁRIO 3 (PÓS-HOMOLOGAÇÃO FIA): CARD PADRONIZADO DO MOTOR OFICIAL DA EQUIPE */
                      <div className="space-y-5">
                        {/* Cabeçalho do Card Oficial Homologado */}
                        <div className="bg-[#15151E] border border-emerald-500/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-f1-mono bg-emerald-600 text-white px-2.5 py-0.5 font-bold uppercase tracking-wider inline-flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                <span>UNIDADE DE POTÊNCIA HOMOLOGADA</span>
                              </span>
                              <span className="text-[10px] font-f1-mono text-cyan-300 bg-cyan-950/50 border border-cyan-500/30 px-2 py-0.5 uppercase font-bold">
                                DNA: {officialCardMetrics.dnaBadge}
                              </span>
                            </div>
                            <h3 className="font-f1-wide font-black text-xl text-white uppercase tracking-wider mt-1.5">
                              {effectiveCustomEngineName} 2026
                            </h3>
                          </div>
                          <div className="text-left sm:text-right font-f1-mono shrink-0">
                            <span className="text-[10px] text-zinc-400 uppercase block">Custo de Produção</span>
                            <span className="text-sm font-black text-emerald-400 tabular-nums">
                              -${(custoProducaoTotal / 1000000).toFixed(1)}M (Pago)
                            </span>
                          </div>
                        </div>

                        {/* Formato Padrão de 2 Colunas (Igual aos Cards de Fornecedores) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {/* Coluna Esquerda: 5 Barras Visuais 0-100 */}
                          <div className="space-y-3 bg-[#15151E] p-4 border border-white/10">
                            <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block font-bold tracking-wider">
                              ATRIBUTOS OFICIAIS HOMOLOGADOS (FIA 2026)
                            </span>

                            {/* 1. Potência de Pico */}
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-xs font-f1-mono">
                                <span className="text-zinc-300 font-bold">POTÊNCIA DE PICO ({officialCardMetrics.totalPowerCv} CV)</span>
                                <span className="text-white font-bold tabular-nums">{officialCardMetrics.powerScore} / 100</span>
                              </div>
                              <div className="h-2.5 w-full bg-black/50 border border-white/10 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-amber-500 to-[#E10600] transition-all duration-300"
                                  style={{ width: `${officialCardMetrics.powerScore}%` }}
                                />
                              </div>
                            </div>

                            {/* 2. Confiabilidade */}
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-xs font-f1-mono">
                                <span className="text-zinc-300 font-bold">CONFIABILIDADE TÉRMICA & MECÂNICA</span>
                                <span
                                  className={`font-bold tabular-nums ${
                                    officialCardMetrics.reliabilityScore >= 75
                                      ? 'text-emerald-400'
                                      : officialCardMetrics.reliabilityScore >= 65
                                      ? 'text-amber-400'
                                      : 'text-red-400'
                                  }`}
                                >
                                  {officialCardMetrics.reliabilityScore} / 100
                                </span>
                              </div>
                              <div className="h-2.5 w-full bg-black/50 border border-white/10 overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-300 ${
                                    officialCardMetrics.reliabilityScore >= 75
                                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                                      : officialCardMetrics.reliabilityScore >= 65
                                      ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                                      : 'bg-gradient-to-r from-red-700 to-red-500'
                                  }`}
                                  style={{ width: `${officialCardMetrics.reliabilityScore}%` }}
                                />
                              </div>
                            </div>

                            {/* 3. Eficiência (100% E-Fuel) */}
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-xs font-f1-mono">
                                <span className="text-zinc-300 font-bold">EFICIÊNCIA DE COMBUSTÍVEL (E-FUEL)</span>
                                <span className="text-lime-400 font-bold tabular-nums">{officialCardMetrics.fuelEfficiencyScore} / 100</span>
                              </div>
                              <div className="h-2.5 w-full bg-black/50 border border-white/10 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-700 to-lime-400 transition-all duration-300"
                                  style={{ width: `${officialCardMetrics.fuelEfficiencyScore}%` }}
                                />
                              </div>
                            </div>

                            {/* 4. Gestão de Energia ERS */}
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-xs font-f1-mono">
                                <span className="text-zinc-300 font-bold">GESTÃO DE ENERGIA (ERS 350kW)</span>
                                <span className="text-indigo-400 font-bold tabular-nums">{officialCardMetrics.ersManagementScore} / 100</span>
                              </div>
                              <div className="h-2.5 w-full bg-black/50 border border-white/10 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-blue-700 to-indigo-400 transition-all duration-300"
                                  style={{ width: `${officialCardMetrics.ersManagementScore}%` }}
                                />
                              </div>
                            </div>

                            {/* 5. Índice de Leveza */}
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-xs font-f1-mono">
                                <span className="text-zinc-300 font-bold">ÍNDICE DE LEVEZA ({officialCardMetrics.totalWeightKg} kg)</span>
                                <span className="text-cyan-400 font-bold tabular-nums">{officialCardMetrics.lightweightScore} / 100</span>
                              </div>
                              <div className="h-2.5 w-full bg-black/50 border border-white/10 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-300"
                                  style={{ width: `${officialCardMetrics.lightweightScore}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Coluna Direita: Prós (Verde), Contras (Vermelho) e Compatibilidade com o Chassi (Azul Escuro) */}
                          <div className="space-y-3 flex flex-col justify-between">
                            <div className="space-y-3">
                              <div className="bg-emerald-950/40 border border-emerald-500/40 p-3.5 space-y-1.5">
                                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[10px] uppercase tracking-wider">
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                  <span>PRÓS DO {(careerPath === 'custom_team' ? customTeamName : (realTeamObj?.name ?? 'Seu Projeto')).trim().split(/\s+/)[0].toUpperCase()}</span>
                                </div>
                                <ul className="space-y-1 text-xs font-bold text-emerald-200 leading-relaxed">
                                  {officialCardMetrics.pros.map((item, idx) => (
                                    <li key={idx}>• {item}</li>
                                  ))}
                                </ul>
                              </div>

                              <div className="bg-red-950/40 border border-red-500/40 p-3.5 space-y-1.5">
                                <div className="flex items-center gap-1.5 text-red-400 font-bold text-[10px] uppercase tracking-wider">
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                  <span>CONTRAS & PONTOS DE ATENÇÃO</span>
                                </div>
                                <ul className="space-y-1 text-xs font-bold text-red-200 leading-relaxed">
                                  {officialCardMetrics.cons.map((item, idx) => (
                                    <li key={idx}>• {item}</li>
                                  ))}
                                </ul>
                              </div>

                              <div className="bg-slate-900/80 border border-cyan-500/35 p-3.5 space-y-1">
                                <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-[10px] uppercase tracking-wider">
                                  <Layers className="w-3.5 h-3.5 shrink-0" />
                                  <span>COMPATIBILIDADE COM O CHASSI (FASE 4 / 7)</span>
                                </div>
                                <p className="text-xs text-zinc-200 leading-relaxed font-f1-mono">
                                  {officialCardMetrics.chassisCompatibility}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Painel de Análise de Risco do Projeto & Maturidade Ano 1 vs Grid 2026 */}
                        {officialCardMetrics.riskAnalysis.isYear1Project && (
                          <div className="bg-[#15151E] border border-amber-500/40 p-4 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                              <span className="text-[11px] font-f1-wide font-bold text-amber-300 uppercase flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                                <span>ANÁLISE DE RISCO DO PROJETO &amp; CUSTO REAL DE PROPRIEDADE (ANO 1)</span>
                              </span>
                              <span className="text-[10px] font-f1-mono text-zinc-400 tabular-nums">
                                Bancada Bruta {officialCardMetrics.riskAnalysis.rawUncappedPowerScore}/100 · Pista Ano 1 {officialCardMetrics.powerScore}/100
                              </span>
                            </div>

                            <p className="text-xs font-f1-mono text-zinc-300 leading-relaxed">
                              {officialCardMetrics.riskAnalysis.summaryWarning}
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-f1-mono tabular-nums">
                              <div className="bg-amber-950/25 p-2.5 border border-amber-500/45">
                                <span className="text-[10px] text-amber-200 uppercase flex items-center gap-1.5 font-bold">
                                  <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  <span>TETO DE DESENVOLVIMENTO</span>
                                </span>
                                <span className="text-amber-300 font-bold text-sm block mt-0.5">{officialCardMetrics.riskAnalysis.developmentCeilingPct}% Máx. Ano 1</span>
                                <span className="text-[10px] text-zinc-400 block">Trava arquitetônica — satura até ADUO/Ano 2</span>
                              </div>
                              <div className="bg-[#1C1C26] p-2.5 border border-white/10">
                                <span className="text-[10px] text-zinc-400 uppercase block">ÔNUS TÉRMICO / AERO</span>
                                <span className={officialCardMetrics.riskAnalysis.coolingAeroPenaltyPct > 0 ? 'text-red-400 font-bold text-sm' : 'text-emerald-400 font-bold text-sm'}>
                                  {officialCardMetrics.riskAnalysis.coolingAeroPenaltyPct > 0
                                    ? `-${officialCardMetrics.riskAnalysis.coolingAeroPenaltyPct.toFixed(1)}% Eficiência Aero`
                                    : '0.0% Neutro'}
                                </span>
                                <span className="text-[10px] text-zinc-500 block">
                                  {officialCardMetrics.riskAnalysis.coolingAeroPenaltyPct > 0 ? '+20% fluxo nos sidepods' : 'Empacotamento limpo'}
                                </span>
                              </div>
                              <div className="bg-[#1C1C26] p-2.5 border border-white/10">
                                <span className="text-[10px] text-zinc-400 uppercase block">PROJEÇÃO 24 GPs</span>
                                <span className={officialCardMetrics.reliabilityScore < 72 ? 'text-red-400 font-bold text-xs' : 'text-emerald-400 font-bold text-xs'}>
                                  {officialCardMetrics.riskAnalysis.estimatedSeasonDnfs24Races}
                                </span>
                                <span className="text-[10px] text-zinc-500 block">
                                  {officialCardMetrics.riskAnalysis.extraMaintenanceCostAnnualM > 0
                                    ? `Manutenção extra: +$${officialCardMetrics.riskAnalysis.extraMaintenanceCostAnnualM.toFixed(1)}M/ano`
                                    : 'Custo operacional padrão'}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1.5 pt-1 border-t border-white/10">
                              <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block font-bold">
                                COMPARATIVO DE MATURIDADE ANO 1 NO GRID 2026 (PISO DE ESTREIA)
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] font-f1-mono tabular-nums">
                                {officialCardMetrics.riskAnalysis.year1GridComparison.map((row) => (
                                  <div
                                    key={row.label}
                                    className={`flex items-center justify-between px-2.5 py-1.5 border ${
                                      row.tier === 'player'
                                        ? 'bg-amber-950/35 border-amber-500/50 text-amber-200 font-bold'
                                        : 'bg-[#1C1C26] border-white/5 text-zinc-300'
                                    }`}
                                  >
                                    <span className="truncate pr-2">{row.label}</span>
                                    <span className="font-bold shrink-0">{row.score}/100</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {productionNotification && (
                          <div className="bg-emerald-950/60 border border-emerald-500/50 p-3 text-xs font-f1-mono text-emerald-200 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="font-bold">{productionNotification}</span>
                          </div>
                        )}

                        <div className="pt-1 flex flex-col sm:flex-row gap-3">
                          <button
                            type="button"
                            onClick={() => setShowDynamoReportModal(false)}
                            className="sm:w-1/3 py-4 border border-white/15 bg-[#15151E] hover:bg-white/5 text-zinc-300 font-f1-wide font-bold text-xs uppercase tracking-wider cursor-pointer"
                          >
                            Ver Dossiê
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              playRadioSound();
                              setShowDynamoReportModal(false);
                              nextStep();
                            }}
                            className="sm:w-2/3 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-f1-wide font-black text-sm uppercase tracking-wider f1-tab-chamfer transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Aprovar Relatório e Ir para a Pista (Fase 6)</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* CENÁRIO 2: DINAMÔMETRO APROVADO (PRÉ-HOMOLOGAÇÃO FIA) */
                      <div className="space-y-4">
                        <div className="bg-[#15151E] p-4 border border-white/10 space-y-2 font-f1-mono text-xs">
                          <p className="text-zinc-300 leading-relaxed">
                            O trem de força completou o ensaio a 15.000 RPM com curva de torque e dissipação térmica aprovadas. Batize sua unidade de potência antes de selar a homologação na FIA.
                          </p>
                        </div>

                        {/* Campo editável para Nome do Motor Customizado */}
                        {engineChoice !== 'customer' && !isEmergency && (
                          <div className="bg-[#15151E] border border-white/10 p-4 space-y-2">
                            <label
                              htmlFor="custom-engine-name-input"
                              className="text-[10px] font-f1-mono text-amber-400 uppercase font-bold tracking-wider block"
                            >
                              NOME OFICIAL DA SUA UNIDADE DE POTÊNCIA 2026
                            </label>
                            <input
                              id="custom-engine-name-input"
                              type="text"
                              maxLength={32}
                              value={customEngineName}
                              placeholder={defaultCustomEngineName}
                              onChange={(e) => setCustomEngineName(e.target.value)}
                              className="w-full bg-[#1C1C26] border border-white/20 focus:border-emerald-400 px-3 py-2 text-sm font-f1-wide font-bold text-white uppercase outline-none"
                            />
                            <span className="text-[10px] font-f1-mono text-zinc-400 block">
                              Este nome aparecerá no certificado oficial da FIA e na ficha técnica do carro.
                            </span>
                          </div>
                        )}

                        {/* Card de Dimensões e Chassi (Gabarito Físico 2026) */}
                        <div className="bg-[#15151E] border border-white/10 p-4 space-y-3 f1-pattern-micro-grid">
                          <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <span className="text-xs font-f1-wide font-bold text-white uppercase flex items-center gap-2">
                              <Cpu className="w-4 h-4 text-emerald-400" />
                              <span>GABARITO FÍSICO DO MOTOR & CHASSI (FIA 2026)</span>
                            </span>
                            <span className="text-[10px] font-f1-mono text-emerald-400 font-bold">
                              CAD LIBERADO
                            </span>
                          </div>

                          {/* 4 KPIs de Dimensões e Performance */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-f1-mono tabular-nums">
                            <div className="bg-[#1C1C26] p-3 border border-white/5">
                              <span className="text-[9px] text-zinc-400 uppercase block font-bold">POTÊNCIA FINAL</span>
                              <span className="text-white font-f1-wide font-black text-lg tabular-nums">{peakCombinedPowerHp} CV</span>
                              <span className="text-[9px] text-emerald-400 block mt-0.5">Combustão + 350kW</span>
                            </div>

                            <div className="bg-[#1C1C26] p-3 border border-white/5">
                              <span className="text-[9px] text-zinc-400 uppercase block font-bold">PESO TOTAL DA PU</span>
                              <span className="text-cyan-400 font-f1-wide font-black text-lg">{displayedIceWeightKg + dossier.ers.batteryWeightKg} kg</span>
                              <span className="text-[9px] text-zinc-500 block mt-0.5">Bloco + Bateria + MGU-K</span>
                            </div>

                            <div className="bg-[#1C1C26] p-3 border border-white/5">
                              <span className="text-[9px] text-zinc-400 uppercase block font-bold">DIMENSÕES CAD</span>
                              <span className="text-amber-400 font-f1-wide font-black text-xs">583x447x395</span>
                              <span className="text-[9px] text-zinc-500 block mt-0.5">Comp x Larg x Alt (mm)</span>
                            </div>

                            <div className="bg-[#1C1C26] p-3 border border-white/5">
                              <span className="text-[9px] text-zinc-400 uppercase block font-bold">CONFIABILIDADE</span>
                              <span className="text-emerald-400 font-f1-wide font-black text-lg">{relFinalCalculado}%</span>
                              <span className="text-[9px] text-zinc-500 block mt-0.5">Estimativa Base 2026</span>
                            </div>
                          </div>
                        </div>

                        {officialCardMetrics.riskAnalysis.isYear1Project && (
                          <div className="bg-[#15151E] border border-amber-500/40 p-4 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                              <span className="text-[11px] font-f1-wide font-bold text-amber-300 uppercase flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                                <span>MATURIDADE ANO 1 &amp; CUSTO REAL DE PROPRIEDADE</span>
                              </span>
                              <span className="text-[10px] font-f1-mono text-zinc-400 tabular-nums">
                                Força Real Ano 1: {officialCardMetrics.powerScore}/100 (vs Audi 78 · Ferrari 92)
                              </span>
                            </div>
                            <p className="text-xs font-f1-mono text-zinc-300 leading-relaxed">
                              {officialCardMetrics.riskAnalysis.summaryWarning}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-f1-mono tabular-nums">
                              <div className="bg-amber-950/25 p-2.5 border border-amber-500/45">
                                <span className="text-[9px] text-amber-200 uppercase flex items-center gap-1 font-bold">
                                  <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                                  <span>TETO ARQUITETÔNICO</span>
                                </span>
                                <span className="text-amber-300 font-bold block mt-0.5">{officialCardMetrics.riskAnalysis.developmentCeilingPct}% Máx. Ano 1</span>
                              </div>
                              <div className="bg-[#1C1C26] p-2.5 border border-white/5">
                                <span className="text-[9px] text-zinc-400 uppercase block">IMPACTO AERO</span>
                                <span className={officialCardMetrics.riskAnalysis.coolingAeroPenaltyPct > 0 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                                  {officialCardMetrics.riskAnalysis.coolingAeroPenaltyPct > 0
                                    ? `-${officialCardMetrics.riskAnalysis.coolingAeroPenaltyPct.toFixed(1)}% Eficiência`
                                    : '0.0% Neutro'}
                                </span>
                              </div>
                              <div className="bg-[#1C1C26] p-2.5 border border-white/5">
                                <span className="text-[9px] text-zinc-400 uppercase block">RISCO EM 24 GPs</span>
                                <span className={officialCardMetrics.reliabilityScore < 72 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                                  {officialCardMetrics.riskAnalysis.estimatedSeasonDnfs24Races}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {dynoNotification && (
                          <div className="bg-[#15151E] border border-white/10 p-3 text-xs font-f1-mono text-zinc-300 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span>{dynoNotification}</span>
                            </span>
                            <span className="text-[10px] text-zinc-400 tabular-nums">Caixa: ${(financials.bankBalance / 1000000).toFixed(1)}M</span>
                          </div>
                        )}

                        {budgetErrorMessage && (
                          <div className="bg-red-950/80 border-2 border-red-500 p-3 text-xs font-f1-mono text-red-200 flex items-center gap-2 animate-pulse">
                            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                            <span className="font-bold">{budgetErrorMessage}</span>
                          </div>
                        )}

                        <div className="bg-[#15151E] p-3 border border-white/10 flex items-center justify-between text-xs font-f1-mono">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-zinc-400 uppercase font-bold">CUSTO DE PRODUÇÃO DA FROTA (8 MOTORES):</span>
                            <span className="text-[10px] text-zinc-500 block">4 PUs por piloto (Art. 5 FIA 2026) · $1.5M/un</span>
                          </div>
                          <span className="text-white font-f1-wide font-black text-sm tabular-nums">
                            -${(custoProducaoTotal / 1000000).toFixed(1)}M
                          </span>
                        </div>

                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              playRadioSound();
                              const totalFrota = custoProducaoTotal;
                              const hasCash = financials.bankBalance >= totalFrota;
                              const hasCap = (financials.costCapSpent + totalFrota) <= financials.costCapLimit;
                              if (!hasCash || !hasCap) {
                                setBudgetErrorMessage("Orçamento insuficiente para produção da frota. Ajuste suas finanças.");
                                return;
                              }
                              setBudgetErrorMessage(null);
                              setShowFiaHomologationConfirmModal(true);
                            }}
                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-f1-wide font-black text-sm uppercase tracking-wider f1-tab-chamfer transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Aprovar e Homologar Motor (-${(custoProducaoTotal / 1000000).toFixed(1)}M)</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ========================================================== */}
        {/* STEP 4: CONCEITO E FILOSOFIA DO CARRO (M02) & E-FUEL       */}
        {/* ========================================================== */}
        {currentStep === 4 && (() => {
          const fuelHpBonus = fuelPartner === 'shell' ? 3 : fuelPartner === 'aramco' ? 2 : 0;
          const solvedM02Preview = solveVehiclePhysics(vehicleParamsDraft, {
            componentLevelAvg: 1,
            aeroDownforceOffset: selectedBackground.modifiers.floorDownforceBonus || 0
          });
          const aeroProfile = hiredHeadAeroObj ? getStaffFullProfile(hiredHeadAeroObj) : null;
          const puProfile = hiredHeadPuObj ? getStaffFullProfile(hiredHeadPuObj) : null;
          const sportProfile = hiredSportingObj ? getStaffFullProfile(hiredSportingObj) : null;

          return (
            <div className="space-y-6">
              <div className="space-y-1">
                <span className="text-xs font-f1-mono text-[#E10600] font-bold tracking-widest uppercase">
                  FASE 4 · M02 CONCEITO DO CARRO, SINERGIA DO STAFF & E-FUEL
                </span>
                <h2 className="font-f1-wide font-black text-2xl sm:text-3xl text-white uppercase">
                  Conceito do Carro 2026 & Reunião de Diretoria
                </h2>
                <p className="text-sm text-zinc-400">
                  Com sua diretoria técnica contratada na Fase 3, defina o conceito do carro desta temporada. Escolher uma filosofia alinhada ao seu Chefe de Aero acelera o desenvolvimento; ir contra o DNA dele gera perda de eficiência e moral.
                </p>
              </div>

              {/* Comparativo: DNA Combinado da Diretoria (Você + 3 Chefes) vs. Sinergia/Conflito com o Conceito do Carro */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                <div className="bg-[#181822] border border-purple-500/35 p-4 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-[10px] font-f1-mono font-bold text-purple-300 uppercase tracking-widest">
                      DNA COMBINADO DA DIRETORIA (FASE 3 · IMUTÁVEL)
                    </span>
                    <span className="text-[10px] font-f1-mono font-bold text-cyan-300 tabular-nums">
                      Sinergia {combinedLeadershipDna.synergyPct}%
                    </span>
                  </div>
                  <div className="text-xs font-f1-mono space-y-1 text-zinc-300">
                    <div>
                      Você (Team Principal): <span className="text-white font-bold">{selectedBackground.name}</span>{' '}
                      <span className="text-[#E10600] font-bold">· [{combinedLeadershipDna.principalCard.leadershipTag}]</span>
                    </div>
                    <div className="text-[10px] text-emerald-400">
                      Seu Bônus Global: {selectedBackground.bonusShort}
                    </div>
                    <div>Chefe de Aero: <span className="text-cyan-300 font-bold">{hiredHeadAeroObj?.name || 'Não definido'}</span> {aeroProfile ? `· [${aeroProfile.staffPhilosophyTag}]` : ''}</div>
                    <div>Chefe de PU: <span className="text-emerald-300 font-bold">{hiredHeadPuObj?.name || 'Não definido'}</span> {puProfile ? `· [${puProfile.staffPhilosophyTag}]` : ''}</div>
                    <div>Chefe de Gerenciamento: <span className="text-zinc-100 font-bold">{hiredSportingObj?.name || 'Não definido'}</span> {sportProfile ? `· [${sportProfile.staffPhilosophyTag}]` : ''}</div>
                  </div>
                  <div className="pt-1.5 border-t border-white/10 text-[10px] font-f1-mono text-zinc-300">
                    <span className="font-bold text-white block">{combinedLeadershipDna.combinedHeadline}</span>
                    <span className="text-zinc-400">{combinedLeadershipDna.narrativeSummary}</span>
                  </div>
                </div>

                <div className={`p-4 border space-y-2.5 ${
                  philosophyConflict.hasConflict
                    ? 'bg-red-950/35 border-red-500/60'
                    : philosophyConflict.efficiencyDeltaPct > 0
                    ? 'bg-emerald-950/30 border-emerald-500/50'
                    : 'bg-[#181822] border-amber-500/35'
                }`}>
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-[10px] font-f1-mono font-bold uppercase tracking-widest text-white">
                      {philosophyConflict.hasConflict
                        ? 'ALERTA VERMELHO · CONFLITO DE DNA'
                        : philosophyConflict.efficiencyDeltaPct > 0
                        ? 'ALERTA VERDE · SINERGIA DETECTADA'
                        : 'DIAGNÓSTICO STAFF × CONCEITO DO CARRO'}
                    </span>
                    <span className={`text-[10px] font-f1-mono font-bold px-2 py-0.5 border tabular-nums ${
                      philosophyConflict.efficiencyDeltaPct < 0
                        ? 'bg-red-950/80 border-red-500/50 text-red-300'
                        : philosophyConflict.efficiencyDeltaPct > 0
                        ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                        : 'bg-white/10 border-white/15 text-zinc-300'
                    }`}>
                      {philosophyConflict.efficiencyDeltaPct > 0 ? `+${philosophyConflict.efficiencyDeltaPct}% Eficiência P&D` : philosophyConflict.efficiencyDeltaPct < 0 ? `${philosophyConflict.efficiencyDeltaPct}% Eficiência P&D` : '0% Neutro'}
                    </span>
                  </div>
                  <div className="space-y-2 text-[11px] font-f1-mono leading-relaxed">
                    {philosophyConflict.warnings.map((w, idx) => (
                      <div key={`w_${idx}`} className="flex items-start gap-2 text-red-200 font-bold">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <span>{w}</span>
                      </div>
                    ))}
                    {philosophyConflict.bonuses.map((b, idx) => (
                      <div key={`b_${idx}`} className="flex items-start gap-2 text-emerald-300 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </div>
                    ))}
                    {philosophyConflict.warnings.length === 0 && philosophyConflict.bonuses.length === 0 && (
                      <p className="text-zinc-300">
                        Equilíbrio neutro: o corpo técnico contratado executa esta filosofia sem atrito ou bônus extremo.
                      </p>
                    )}
                  </div>
                  <div className="pt-1 border-t border-white/10 text-[10px] font-f1-mono text-zinc-400">
                    Próximo passo (Fase 5): O conceito aprovado aqui orientará seu Chefe de PU na escolha do motor ideal.
                  </div>
                </div>
              </div>

              <OnboardingM02PhilosophySelector
                selectedPhilosophy={normalizeToM02Philosophy(philosophy)}
                onSelectPhilosophy={(code, baselinePatch) => {
                  playRadioSound();
                  setPhilosophy(code);
                  updateVehicleParamsDraft(baselinePatch);
                }}
                vehicleParams={vehicleParamsDraft}
                tradeoffsAcknowledged={tradeoffsAcknowledged}
                onToggleTradeoffsAck={setTradeoffsAcknowledged}
                principalBackground={selectedBackground}
                headAero={hiredHeadAeroObj}
                headPu={hiredHeadPuObj}
                sportingDirector={hiredSportingObj}
              />

              {/* Resumo Simplificado do Carro Configurado */}
              <div className="bg-[#15151E] p-4 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs font-f1-wide font-bold text-white uppercase">
                    RESUMO DO CARRO CONFIGURADO
                  </span>
                  <span className="text-[11px] text-zinc-400">Atualização em tempo real</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div
                    className="bg-[#1C1C26] p-3 border border-white/5"
                    title={`Dados de engenharia: CL ${solvedM02Preview.cornerMode.clTotal.toFixed(2)} · Downforce ${Math.round(solvedM02Preview.cornerMode.downforceTotalN)} N`}
                  >
                    <span className="text-[11px] text-zinc-400 block">Equilíbrio Aero</span>
                    <span className="text-emerald-400 font-mono font-bold text-base tabular-nums">
                      L/D {solvedM02Preview.cornerMode.aeroEfficiencyLD.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-zinc-400 block mt-0.5">
                      {solvedM02Preview.cornerMode.aeroEfficiencyLD >= 3.8
                        ? 'Ótima eficiência reta/curva'
                        : solvedM02Preview.cornerMode.clTotal >= 3.5
                        ? 'Forte pressão em curva'
                        : 'Ajuste equilibrado'}
                    </span>
                  </div>
                  <div
                    className="bg-[#1C1C26] p-3 border border-white/5"
                    title={`Potência na roda: ${solvedM02Preview.totalWheelPowerKw.toFixed(0)} kW`}
                  >
                    <span className="text-[11px] text-zinc-400 block">Potência do Motor</span>
                    <span className="text-cyan-400 font-mono font-bold text-base tabular-nums">
                      {solvedM02Preview.totalWheelPowerHp + fuelHpBonus} cv
                    </span>
                    <span className="text-[11px] text-zinc-400 block mt-0.5">
                      {fuelHpBonus > 0 ? `Inclui +${fuelHpBonus} cv do E-Fuel` : 'Potência base configurada'}
                    </span>
                  </div>
                  <div
                    className="bg-[#1C1C26] p-3 border border-white/5"
                    title={`Rigidez torcional do chassi: ${(solvedM02Preview.torsionalStiffnessNmDeg / 1000).toFixed(1)} kNm/°`}
                  >
                    <span className="text-[11px] text-zinc-400 block">Peso do Carro</span>
                    <span className="text-white font-mono font-bold text-base tabular-nums">
                      {solvedM02Preview.totalMassKg.toFixed(1)} kg
                    </span>
                    <span className="text-[11px] text-zinc-400 block mt-0.5">
                      Limite FIA: {solvedM02Preview.legalMinMassKg} kg
                    </span>
                  </div>
                  <div className="bg-[#1C1C26] p-3 border border-white/5">
                    <span className="text-[11px] text-zinc-400 block">Caixa Disponível</span>
                    <span className="text-emerald-400 font-mono font-bold text-base tabular-nums">
                      ${(financials.bankBalance / 1000000).toFixed(1)}M
                    </span>
                    <span className="text-[11px] text-zinc-400 block mt-0.5">
                      Teto Gasto: ${(financials.costCapSpent / 1000000).toFixed(1)}M / $135M
                    </span>
                  </div>
                </div>
              </div>

              {/* Parceria Oficial de Combustível (E-Fuel FIA 2026) */}
              <div className="bg-[#15151E] p-4 border border-white/10 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-white/5 pb-2">
                  <div>
                    <span className="text-xs font-f1-wide font-black text-white uppercase block">
                      Parceria de Combustível Sustentável (E-Fuel 2026)
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Escolha a petrolífera técnica: ela define se o carro foca em menos peso no tanque ou mais potência na reta.
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-lime-400 bg-lime-950/40 border border-lime-500/30 px-2.5 py-0.5 uppercase font-bold shrink-0">
                    FIA 100% Sustentável
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* 1. Petronas (Economia de Combustível) */}
                  <button
                    type="button"
                    onClick={() => {
                      playRadioSound();
                      setFuelPartner('petronas');
                    }}
                    className={`p-3 text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      fuelPartner === 'petronas'
                        ? 'bg-[#1C1C26] border-emerald-500 ring-1 ring-emerald-500 shadow-md'
                        : 'bg-[#15151E] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-f1-wide font-black text-white uppercase">Petronas</span>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/40 px-1.5 py-0.5 border border-emerald-500/30">
                          +5% Eficiência
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400 font-semibold block">Economia de Combustível</span>
                      <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                        O carro larga com menos litros no tanque (até 15 kg mais leve) e permite usar modo Ataque por mais voltas sem faltar combustível.
                      </p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/5 text-[11px] text-emerald-400 font-semibold">
                      ✓ Bônus: O carro fica mais leve (menos litros no tanque)
                    </div>
                  </button>

                  {/* 2. Shell (Potência Máxima) */}
                  <button
                    type="button"
                    onClick={() => {
                      playRadioSound();
                      setFuelPartner('shell');
                    }}
                    className={`p-3 text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      fuelPartner === 'shell'
                        ? 'bg-[#1C1C26] border-[#E10600] ring-1 ring-[#E10600] shadow-md'
                        : 'bg-[#15151E] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-f1-wide font-black text-white uppercase">Shell</span>
                        <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-950/40 px-1.5 py-0.5 border border-amber-500/30">
                          +3 cv
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400 font-semibold block">Potência Máxima</span>
                      <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                        Combustão de alta pressão para entregar mais cavalos de potência nas saídas de curva e retas longas.
                      </p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/5 text-[11px] text-amber-400 font-semibold">
                      ✓ Bônus: +3 cv extras para ultrapassagens
                    </div>
                  </button>

                  {/* 3. Aramco (Equilibrado) */}
                  <button
                    type="button"
                    onClick={() => {
                      playRadioSound();
                      setFuelPartner('aramco');
                    }}
                    className={`p-3 text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      fuelPartner === 'aramco'
                        ? 'bg-[#1C1C26] border-cyan-500 ring-1 ring-cyan-500 shadow-md'
                        : 'bg-[#15151E] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-f1-wide font-black text-white uppercase">Aramco</span>
                        <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-950/40 px-1.5 py-0.5 border border-cyan-500/30">
                          +2 cv / +2%
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400 font-semibold block">Equilibrado</span>
                      <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                        Entrega cavalaria extra no motor combinada com leve economia de combustível para aliviar o peso na largada.
                      </p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/5 text-[11px] text-cyan-400 font-semibold">
                      ✓ Bônus: +2 cv e leve economia de peso no tanque
                    </div>
                  </button>
                </div>
              </div>

              {/* Botão de Avanço da Fase 4 para a Fase 5 */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full sm:w-auto px-6 py-3.5 bg-[#E10600] hover:bg-[#c20500] text-white font-f1-wide font-black text-xs uppercase tracking-wider f1-tab-chamfer transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <span>Confirmar Conceito do Carro & Escolher Motor (Fase 5)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })()}

        {/* ========================================================== */}
        {/* STEP 6: PILOTOS & ENGENHEIROS DE CORRIDA (RÁDIO)           */}
        {/* ========================================================== */}
        {currentStep === 6 && (() => {
          const getDriverObj = (id: string | null) => {
            if (!id) return null;
            return ALL_MARKET_DRIVERS.find(d => d.id === id) || drivers.find(d => d.id === id) || null;
          };
          const getStaffObj = (id: string | null) => {
            if (!id) return null;
            return ALL_STAFF_MEMBERS.find(s => s.id === id) || staff.find(s => s.id === id) || null;
          };

          const drv1 = getDriverObj(selectedDriver1);
          const drv2 = getDriverObj(selectedDriver2);
          const drvRes = getDriverObj(selectedReserveDriver);
          const re1 = getStaffObj(selectedRaceEngineer1);
          const re2 = getStaffObj(selectedRaceEngineer2);
          const mechObj = getStaffObj(selectedChiefMechanic);
          const mechPitOps = evaluatePitAndGarageOperations({
            chiefMechanicRating: mechObj?.rating ?? 76,
            principalBackground,
            isSakuraHq: selectedHq.id === 'sakura',
          });

          const filledStep6Count = [
            Boolean(selectedDriver1),
            Boolean(selectedDriver2 && selectedDriver2 !== selectedDriver1),
            Boolean(selectedReserveDriver),
            Boolean(selectedRaceEngineer1),
            Boolean(selectedRaceEngineer2 && selectedRaceEngineer2 !== selectedRaceEngineer1),
            Boolean(selectedChiefMechanic)
          ].filter(Boolean).length;

          const driverRec = getRecommendedDriverTraitsForPhilosophy(normalizeToM02Philosophy(philosophy));

          const query = marketSearch.trim().toLowerCase();
          let currentDriversList = F1_DRIVERS_REAL;
          if (driverCategory === 'F2') currentDriversList = F2_DRIVERS_REAL;
          else if (driverCategory === 'F3') currentDriversList = F3_DRIVERS_REAL;
          else if (driverCategory === 'FREE_AGENTS') currentDriversList = FREE_AGENT_DRIVERS;

          const filteredDrivers = currentDriversList.filter(d => {
            if (!query) return true;
            return (
              d.name.toLowerCase().includes(query) ||
              d.nationality.toLowerCase().includes(query) ||
              (d.shortCode || '').toLowerCase().includes(query)
            );
          });

          const filteredRadioEngineers = RACE_ENGINEER_MEMBERS.filter(s => {
            if (!query) return true;
            const profile = getStaffFullProfile(s);
            return (
              s.name.toLowerCase().includes(query) ||
              (s.currentTeam || s.teamOrigin || '').toLowerCase().includes(query) ||
              profile.staffPhilosophyTag.toLowerCase().includes(query)
            );
          });

          const filteredChiefMechanics = CHIEF_MECHANIC_STAFF_MEMBERS.filter(s => {
            if (!query) return true;
            const profile = getStaffFullProfile(s);
            return (
              s.name.toLowerCase().includes(query) ||
              (s.currentTeam || s.teamOrigin || '').toLowerCase().includes(query) ||
              (s.specialty || '').toLowerCase().includes(query) ||
              profile.designDna.toLowerCase().includes(query)
            );
          });

          const missingSlots: string[] = [];
          if (!selectedDriver1) missingSlots.push('Piloto Titular #1');
          if (!selectedDriver2) missingSlots.push('Piloto Titular #2');
          if (selectedDriver1 && selectedDriver2 && selectedDriver1 === selectedDriver2) missingSlots.push('Pilotos Titulares Duplicados');
          if (!selectedReserveDriver) missingSlots.push('Piloto Reserva');
          if (!selectedRaceEngineer1) missingSlots.push('Engenheiro de Corrida (Carro #1)');
          if (!selectedRaceEngineer2) missingSlots.push('Engenheiro de Corrida (Carro #2)');
          if (selectedRaceEngineer1 && selectedRaceEngineer2 && selectedRaceEngineer1 === selectedRaceEngineer2) missingSlots.push('Engenheiros de Rádio Duplicados');
          if (!selectedChiefMechanic) missingSlots.push('Chefe Mecânico (Garagem & Pit Crew)');

          return (
            <div className="space-y-6">
              {/* Header Title */}
              <div className="space-y-1">
                <span className="text-xs font-f1-mono text-[#E10600] font-bold tracking-widest uppercase">
                  FASE 6: EQUIPE OPERACIONAL DE PISTA, PILOTOS & GARAGEM
                </span>
                <h2 className="font-f1-wide font-black text-2xl sm:text-3xl text-white uppercase">
                  Pilotos, Rádio & Chefe Mecânico
                </h2>
                <p className="text-sm text-zinc-400">
                  Monte toda a operação de pista: contrate os 2 pilotos titulares, 1 reserva, os 2 engenheiros de corrida (rádio) e o Chefe Mecânico da garagem e pit stops.
                </p>
              </div>

              {/* Recomendação Dinâmica de Atributos por Filosofia do Carro (Fase 4) */}
              <div className="bg-[#181822] border border-cyan-500/40 p-4 space-y-2 f1-pattern-micro-grid">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-cyan-400" />
                    <span className="font-f1-wide font-bold text-xs text-white uppercase">
                      {driverRec.title}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {driverRec.priorityAttrs.map(tr => (
                      <span
                        key={tr}
                        className="text-[10px] font-f1-mono font-bold px-2 py-0.5 bg-cyan-950/60 border border-cyan-400/40 text-cyan-200 uppercase"
                      >
                        {tr}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] font-f1-mono text-zinc-300 leading-relaxed">
                  {driverRec.summary}
                </p>
              </div>

              {/* Checklist Obrigatório (6 Slots Operacionais de Pista + Resumo Diretoria Fase 3) */}
              <div className={`p-4 border transition-all ${
                isStep6Complete
                  ? 'bg-[#101C15] border-emerald-500/50 shadow-lg shadow-emerald-950/20'
                  : 'bg-[#1C1C26] border-amber-500/40'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    {isStep6Complete ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Lock className="w-5 h-5 text-amber-400" />
                    )}
                    <div>
                      <h3 className="font-f1-wide font-bold text-sm text-white uppercase tracking-wider">
                        EQUIPE OPERACIONAL DE PISTA ({filledStep6Count}/6 SLOTS)
                      </h3>
                      <span className="text-[11px] font-f1-mono text-zinc-400">
                        {isStep6Complete
                          ? '✓ Dupla titular, reserva, engenheiros de rádio e chefe mecânico homologados.'
                          : 'Preencha todos os 6 slots operacionais de pista para liberar a concepção M03–M10.'}
                      </span>
                    </div>
                  </div>
                  <span className={`text-xs font-f1-mono px-3 py-1 font-bold uppercase tracking-wider border whitespace-nowrap shrink-0 ${
                    isStep6Complete
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                      : 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                  }`}>
                    {isStep6Complete ? 'TRAVA LIBERADA' : 'TRAVA DE AVANÇO ATIVA'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
                  {/* Slot 1: Titular 1 */}
                  <div className={`p-2.5 border text-xs font-f1-mono flex flex-col justify-between min-h-[92px] ${
                    drv1 ? 'bg-[#15151E] border-emerald-500/40' : 'bg-amber-950/15 border-dashed border-amber-500/50'
                  }`}>
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold mb-1">
                        <span>TITULAR #1</span>
                        {drv1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      {drv1 ? (
                        <div>
                          <div className="font-f1-wide font-bold text-white text-xs truncate">{drv1.name}</div>
                          <div className="text-[10px] text-zinc-400">OVR {drv1.ovr || drv1.attributes.pace} · {drv1.nationality}</div>
                          <div className="text-[9px] font-f1-mono text-zinc-300">
                            ${((driverContractSalaries[drv1.id] || drv1.salary) / 1000000).toFixed(1)}M/ano
                          </div>
                        </div>
                      ) : (
                        <span className="text-amber-400 font-bold text-[11px] block mt-1">Pendente</span>
                      )}
                    </div>
                    {drv1 && (
                      <button
                        type="button"
                        onClick={() => setSelectedDriver1(null)}
                        className="text-[9px] text-red-400 hover:text-red-300 underline text-left mt-1 cursor-pointer"
                      >
                        Desmarcar
                      </button>
                    )}
                  </div>

                  {/* Slot 2: Titular 2 */}
                  <div className={`p-2.5 border text-xs font-f1-mono flex flex-col justify-between min-h-[92px] ${
                    drv2 ? 'bg-[#15151E] border-emerald-500/40' : 'bg-amber-950/15 border-dashed border-amber-500/50'
                  }`}>
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold mb-1">
                        <span>TITULAR #2</span>
                        {drv2 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      {drv2 ? (
                        <div>
                          <div className="font-f1-wide font-bold text-white text-xs truncate">{drv2.name}</div>
                          <div className="text-[10px] text-zinc-400">OVR {drv2.ovr || drv2.attributes.pace} · {drv2.nationality}</div>
                          <div className="text-[9px] font-f1-mono text-zinc-300">
                            ${((driverContractSalaries[drv2.id] || drv2.salary) / 1000000).toFixed(1)}M/ano
                          </div>
                        </div>
                      ) : (
                        <span className="text-amber-400 font-bold text-[11px] block mt-1">Pendente</span>
                      )}
                    </div>
                    {drv2 && (
                      <button
                        type="button"
                        onClick={() => setSelectedDriver2(null)}
                        className="text-[9px] text-red-400 hover:text-red-300 underline text-left mt-1 cursor-pointer"
                      >
                        Desmarcar
                      </button>
                    )}
                  </div>

                  {/* Slot 3: Reserva */}
                  <div className={`p-2.5 border text-xs font-f1-mono flex flex-col justify-between min-h-[92px] ${
                    drvRes ? 'bg-[#15151E] border-cyan-500/40' : 'bg-amber-950/15 border-dashed border-amber-500/50'
                  }`}>
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold mb-1">
                        <span>PILOTO RESERVA</span>
                        {drvRes ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      {drvRes ? (
                        <div>
                          <div className="font-f1-wide font-bold text-white text-xs truncate">{drvRes.name}</div>
                          <div className="text-[10px] text-cyan-300">[{drvRes.series || 'F1'}] OVR {drvRes.ovr || drvRes.attributes.pace}</div>
                          <div className="text-[9px] font-f1-mono text-zinc-300">
                            ${((driverContractSalaries[drvRes.id] || drvRes.salary) / 1000000).toFixed(1)}M/ano
                          </div>
                        </div>
                      ) : (
                        <span className="text-amber-400 font-bold text-[11px] block mt-1">Pendente (F1/F2/F3)</span>
                      )}
                    </div>
                    {drvRes && (
                      <button
                        type="button"
                        onClick={() => setSelectedReserveDriver(null)}
                        className="text-[9px] text-red-400 hover:text-red-300 underline text-left mt-1 cursor-pointer"
                      >
                        Desmarcar
                      </button>
                    )}
                  </div>

                  {/* Slot 4: Engenheiro de Corrida #1 */}
                  <div className={`p-2.5 border text-xs font-f1-mono flex flex-col justify-between min-h-[92px] ${
                    re1 ? 'bg-[#15151E] border-emerald-500/40' : 'bg-amber-950/15 border-dashed border-amber-500/50'
                  }`}>
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold mb-1">
                        <span>RÁDIO CARRO #1</span>
                        {re1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      {re1 ? (
                        <div>
                          <div className="font-f1-wide font-bold text-white text-xs truncate">{re1.name}</div>
                          <div className="text-[10px] text-zinc-400">OVR {re1.rating} · Rádio Pista</div>
                        </div>
                      ) : (
                        <span className="text-amber-400 font-bold text-[11px] block mt-1">Pendente</span>
                      )}
                    </div>
                    {re1 && (
                      <button
                        type="button"
                        onClick={() => setSelectedRaceEngineer1(null)}
                        className="text-[9px] text-red-400 hover:text-red-300 underline text-left mt-1 cursor-pointer"
                      >
                        Desmarcar
                      </button>
                    )}
                  </div>

                  {/* Slot 5: Engenheiro de Corrida #2 */}
                  <div className={`p-2.5 border text-xs font-f1-mono flex flex-col justify-between min-h-[92px] ${
                    re2 ? 'bg-[#15151E] border-emerald-500/40' : 'bg-amber-950/15 border-dashed border-amber-500/50'
                  }`}>
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold mb-1">
                        <span>RÁDIO CARRO #2</span>
                        {re2 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      {re2 ? (
                        <div>
                          <div className="font-f1-wide font-bold text-white text-xs truncate">{re2.name}</div>
                          <div className="text-[10px] text-zinc-400">OVR {re2.rating} · Rádio Pista</div>
                        </div>
                      ) : (
                        <span className="text-amber-400 font-bold text-[11px] block mt-1">Pendente</span>
                      )}
                    </div>
                    {re2 && (
                      <button
                        type="button"
                        onClick={() => setSelectedRaceEngineer2(null)}
                        className="text-[9px] text-red-400 hover:text-red-300 underline text-left mt-1 cursor-pointer"
                      >
                        Desmarcar
                      </button>
                    )}
                  </div>

                  {/* Slot 6: Chefe Mecânico (Garagem & Pit Crew) */}
                  <div
                    onClick={() => {
                      if (!mechObj) setStep6MainTab('chief_mechanic');
                    }}
                    className={`p-2.5 border text-xs font-f1-mono flex flex-col justify-between min-h-[92px] ${
                      mechObj
                        ? 'bg-[#15151E] border-emerald-500/40'
                        : 'bg-amber-950/15 border-dashed border-amber-500/50 cursor-pointer'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold mb-1">
                        <span>CHEFE MECÂNICO</span>
                        {mechObj ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      {mechObj ? (
                        <div>
                          <div className="font-f1-wide font-bold text-white text-xs truncate">{mechObj.name}</div>
                          <div className="text-[10px] text-zinc-400 tabular-nums">
                            OVR {mechObj.rating} · Pit {mechPitOps.totalPitDeltaSec > 0 ? `+${mechPitOps.totalPitDeltaSec.toFixed(2)}` : mechPitOps.totalPitDeltaSec.toFixed(2)}s
                          </div>
                          <div className="text-[9px] font-f1-mono text-emerald-300 tabular-nums">
                            Erro Box: {mechPitOps.pitErrorProbPct}%
                          </div>
                        </div>
                      ) : (
                        <span className="text-amber-400 font-bold text-[11px] block mt-1">Pendente (Garagem)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {mechObj ? (
                        <>
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              setStep6MainTab('chief_mechanic');
                            }}
                            className="text-[9px] text-cyan-300 hover:text-cyan-200 underline cursor-pointer"
                          >
                            Trocar
                          </button>
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedChiefMechanic(null);
                            }}
                            className="text-[9px] text-red-400 hover:text-red-300 underline cursor-pointer"
                          >
                            Desmarcar
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setStep6MainTab('chief_mechanic');
                          }}
                          className="text-[9px] text-amber-300 hover:text-amber-200 underline cursor-pointer"
                        >
                          Contratar
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Resumo da Diretoria Técnica (Fase 3) + Conceito (Fase 4) + Motor (Fase 5) */}
                <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap items-center gap-3 text-[10px] font-f1-mono text-zinc-300">
                  <span className="text-zinc-400 uppercase font-bold">Liderança & Projeto (Fases 3–5):</span>
                  <span>Aero: <strong className="text-white">{hiredHeadAeroObj?.name || '—'}</strong></span>
                  <span>· PU: <strong className="text-white">{hiredHeadPuObj?.name || '—'}</strong></span>
                  <span>· Gerenciamento: <strong className="text-white">{hiredSportingObj?.name || '—'}</strong></span>
                  <span>· Conceito F4: <strong className="text-cyan-300 uppercase">{philosophy.replace('_', ' ')}</strong></span>
                </div>

                {!isStep6Complete && missingSlots.length > 0 && (
                  <div className="mt-3 p-2 bg-amber-950/40 border border-amber-500/30 text-[11px] font-f1-mono text-amber-200 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      <strong>Atenção:</strong> Pendente de contratação: {missingSlots.join(', ')}. Utilize as abas abaixo para completar a garagem.
                    </span>
                  </div>
                )}
              </div>

              {/* PAINEL DE MARKETING, FÃS & REPUTAÇÃO */}
              <div className="bg-[#1C1C26] border border-white/10 p-4 f1-pattern-micro-grid flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-f1-mono text-amber-400 font-bold uppercase tracking-widest block">
                    SISTEMA DE MARKETING & ENGAJAMENTO DE FÃS
                  </span>
                  <div className="flex flex-wrap items-center gap-4">
                    <div>
                      <span className="text-[10px] text-zinc-400 font-f1-mono block">BASE DE FÃS ESTIMADA:</span>
                      <span className="text-lg font-f1-wide font-black text-white tabular-nums">
                        {calculatedBaseDeFas.toLocaleString()} Fãs
                      </span>
                    </div>
                    <div className="h-8 w-[1px] bg-white/10 hidden sm:block" />
                    <div>
                      <span className="text-[10px] text-zinc-400 font-f1-mono block">RECEITA ANUAL DE MARKETING:</span>
                      <span className="text-lg font-f1-wide font-black text-emerald-400 tabular-nums">
                        ${(calculatedReceitaMarketing / 1000000).toFixed(2)}M / ano
                      </span>
                    </div>
                    <div className="h-8 w-[1px] bg-white/10 hidden sm:block" />
                    <div>
                      <span className="text-[10px] text-zinc-400 font-f1-mono block">RECEITA MERCHANDISING:</span>
                      <span className="text-lg font-f1-wide font-black text-cyan-400 tabular-nums">
                        ${(calculatedReceitaMerchandising / 1000000).toFixed(2)}M / ano
                      </span>
                    </div>
                    <div className="h-8 w-[1px] bg-white/10 hidden sm:block" />
                    <div>
                      <span className="text-[10px] text-zinc-400 font-f1-mono block">REPUTAÇÃO DA EQUIPE:</span>
                      <span className="text-lg font-f1-wide font-black text-amber-400 tabular-nums">
                        {playerReputation} / 100
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-left sm:text-right">
                  {isManufacturer && (
                    <span className="inline-block text-[10px] font-f1-mono bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 font-bold uppercase mb-1">
                      ✓ Equipe de Fábrica (+5.000.000 Fãs & +15 Reputação)
                    </span>
                  )}
                  {hasPatrioticBonus ? (
                    <span className="block text-[10px] font-f1-mono bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 font-bold uppercase">
                      ★ Bônus Nacional / Mercado Ativo (2x Fãs & +50% Receita)
                    </span>
                  ) : (
                    <span className="block text-[10px] font-f1-mono text-zinc-400">
                      Dica: Piloto da nacionalidade da sede ({selectedHq?.country}) ou de mercado emergente dobra a base de fãs!
                    </span>
                  )}
                </div>
              </div>

              {/* NAVEGAÇÃO PRINCIPAL: PILOTOS vs RÁDIO vs CHEFE MECÂNICO */}
              <div className="space-y-4">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStep6MainTab('drivers')}
                      className={`px-4 py-2 text-xs font-f1-wide font-bold uppercase transition-all flex items-center gap-2 border whitespace-nowrap shrink-0 cursor-pointer ${
                        step6MainTab === 'drivers'
                          ? 'bg-[#E10600] text-white border-[#E10600] shadow-md'
                          : 'bg-[#15151E] text-zinc-400 border-white/10 hover:text-white'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>Mercado de Pilotos</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep6MainTab('radio_engineers')}
                      className={`px-4 py-2 text-xs font-f1-wide font-bold uppercase transition-all flex items-center gap-2 border whitespace-nowrap shrink-0 cursor-pointer ${
                        step6MainTab === 'radio_engineers'
                          ? 'bg-[#E10600] text-white border-[#E10600] shadow-md'
                          : 'bg-[#15151E] text-zinc-400 border-white/10 hover:text-white'
                      }`}
                    >
                      <Wrench className="w-4 h-4" />
                      <span>Engenheiros de Corrida (Rádio)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep6MainTab('chief_mechanic')}
                      className={`px-4 py-2 text-xs font-f1-wide font-bold uppercase transition-all flex items-center gap-2 border whitespace-nowrap shrink-0 cursor-pointer ${
                        step6MainTab === 'chief_mechanic'
                          ? 'bg-[#E10600] text-white border-[#E10600] shadow-md'
                          : 'bg-[#15151E] text-zinc-400 border-white/10 hover:text-white'
                      }`}
                    >
                      <Sliders className="w-4 h-4" />
                      <span>Chefe Mecânico (Garagem & Box)</span>
                    </button>
                  </div>

                  <div className="relative min-w-[240px]">
                    <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={marketSearch}
                      onChange={e => setMarketSearch(e.target.value)}
                      placeholder={
                        step6MainTab === 'drivers'
                          ? 'Buscar piloto, país, sigla...'
                          : step6MainTab === 'radio_engineers'
                          ? 'Buscar engenheiro de rádio, equipe...'
                          : 'Buscar chefe mecânico, especialidade...'
                      }
                      className="w-full bg-[#15151E] border border-white/10 pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 font-f1-mono focus:outline-none focus:border-[#E10600]"
                    />
                  </div>
                </div>

                {/* SUB-ABA: MERCADO DE PILOTOS */}
                {step6MainTab === 'drivers' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDriverCategory('F1')}
                        className={`px-3 py-1.5 text-xs font-f1-mono font-bold uppercase border transition-all whitespace-nowrap cursor-pointer ${
                          driverCategory === 'F1'
                            ? 'bg-white/20 border-white text-white'
                            : 'bg-[#15151E] border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        Fórmula 1 (Grid Oficial)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDriverCategory('F2')}
                        className={`px-3 py-1.5 text-xs font-f1-mono font-bold uppercase border transition-all whitespace-nowrap cursor-pointer ${
                          driverCategory === 'F2'
                            ? 'bg-cyan-950/70 border-cyan-400 text-cyan-300'
                            : 'bg-[#15151E] border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        Fórmula 2 (Jovens Talentos)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDriverCategory('F3')}
                        className={`px-3 py-1.5 text-xs font-f1-mono font-bold uppercase border transition-all whitespace-nowrap cursor-pointer ${
                          driverCategory === 'F3'
                            ? 'bg-blue-950/70 border-blue-400 text-blue-300'
                            : 'bg-[#15151E] border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        Fórmula 3 (Revelações)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDriverCategory('FREE_AGENTS')}
                        className={`px-3 py-1.5 text-xs font-f1-mono font-bold uppercase border transition-all whitespace-nowrap cursor-pointer ${
                          driverCategory === 'FREE_AGENTS'
                            ? 'bg-amber-950/70 border-amber-400 text-amber-300'
                            : 'bg-[#15151E] border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        Agentes Livres (Veteranos & Reservas)
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredDrivers.map(d => {
                        const isT1 = d.id === selectedDriver1;
                        const isT2 = d.id === selectedDriver2;
                        const isRes = d.id === selectedReserveDriver;
                        const reqRep = d.requiredReputation || 0;
                        const repDiff = playerReputation - reqRep;

                        let interestState: DriverInterestState = 'no_interest';
                        if (repDiff >= 0) {
                          interestState = 'interested';
                        } else if (repDiff >= -15) {
                          interestState = 'negotiable';
                        } else {
                          interestState = 'no_interest';
                        }

                        const riskSalary = Math.round(d.salary * 1.30);
                        const contractedSalary = driverContractSalaries[d.id];
                        const effectiveSalary = contractedSalary || (interestState === 'negotiable' ? riskSalary : d.salary);

                        const handleAssignDriverSlot = (drv: Driver, slot: 't1' | 't2' | 'reserve') => {
                          const currentlyInSlot =
                            (slot === 't1' && drv.id === selectedDriver1) ||
                            (slot === 't2' && drv.id === selectedDriver2) ||
                            (slot === 'reserve' && drv.id === selectedReserveDriver);

                          if (currentlyInSlot) {
                            if (slot === 't1') setSelectedDriver1(null);
                            else if (slot === 't2') setSelectedDriver2(null);
                            else setSelectedReserveDriver(null);
                            return;
                          }

                          if (interestState === 'negotiable' && !contractedSalary) {
                            setNegotiatingDriver({ driver: drv, slot, riskSalary });
                            return;
                          }

                          if (slot === 't1') {
                            if (selectedDriver2 === drv.id) setSelectedDriver2(null);
                            if (selectedReserveDriver === drv.id) setSelectedReserveDriver(null);
                            setSelectedDriver1(drv.id);
                          } else if (slot === 't2') {
                            if (selectedDriver1 === drv.id) setSelectedDriver1(null);
                            if (selectedReserveDriver === drv.id) setSelectedReserveDriver(null);
                            setSelectedDriver2(drv.id);
                          } else {
                            if (selectedDriver1 === drv.id) setSelectedDriver1(null);
                            if (selectedDriver2 === drv.id) setSelectedDriver2(null);
                            setSelectedReserveDriver(drv.id);
                          }
                          playRadioSound();
                        };

                        return (
                          <DriverMarketCard
                            key={d.id}
                            driver={d}
                            isT1={isT1}
                            isT2={isT2}
                            isRes={isRes}
                            interestState={interestState}
                            playerReputation={playerReputation}
                            effectiveSalary={effectiveSalary}
                            contractedSalary={contractedSalary}
                            riskSalary={riskSalary}
                            onExpand={setExpandedDriverProfile}
                            onAssignSlot={handleAssignDriverSlot}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SUB-ABA: ENGENHEIROS DE CORRIDA (RÁDIO) */}
                {step6MainTab === 'radio_engineers' && (
                  <div className="space-y-4">
                    <div className="bg-[#181822] border border-white/10 p-3 text-[11px] font-f1-mono text-zinc-300">
                      Designe 2 engenheiros de corrida distintos para o muro dos boxes: um para o <strong className="text-white">Rádio Carro #1</strong> ({drv1?.name || 'Titular #1'}) e outro para o <strong className="text-white">Rádio Carro #2</strong> ({drv2?.name || 'Titular #2'}). A qualidade da comunicação reduz erros estratégicos e melhora o feedback de setup na pista.
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredRadioEngineers.map(s => {
                        const slot: 1 | 2 | null =
                          selectedRaceEngineer1 === s.id
                            ? 1
                            : selectedRaceEngineer2 === s.id
                            ? 2
                            : null;
                        const interest = calculateStaffInterest({
                          staff: s,
                          projectAmbition,
                          hqOption: selectedHq,
                          isRealTeam: careerPath === 'real_team',
                          realTeamReputation
                        });
                        return (
                          <StaffMarketCard
                            key={s.id}
                            staffMember={s}
                            isAssigned={slot !== null}
                            interest={interest}
                            raceEngineerSlot={slot}
                            onExpand={setExpandedStaffProfile}
                            onToggleAssign={() => {}}
                            onAssignRaceEngineer={(staffObj, targetCar) => {
                              playRadioSound();
                              if (targetCar === 1) {
                                if (selectedRaceEngineer2 === staffObj.id) setSelectedRaceEngineer2(null);
                                setSelectedRaceEngineer1(prev => (prev === staffObj.id ? null : staffObj.id));
                              } else {
                                if (selectedRaceEngineer1 === staffObj.id) setSelectedRaceEngineer1(null);
                                setSelectedRaceEngineer2(prev => (prev === staffObj.id ? null : staffObj.id));
                              }
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SUB-ABA: CHEFE MECÂNICO (GARAGEM & PIT CREW) */}
                {step6MainTab === 'chief_mechanic' && (
                  <div className="space-y-4">
                    <div className="bg-[#181822] border border-white/10 p-3 text-[11px] font-f1-mono text-zinc-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span>
                        O <strong className="text-white">Chefe Mecânico</strong> lidera a garagem na pista: governa a velocidade da troca de pneus, reduz a chance de falha na pistola pneumática e acelera a montagem/manutenção entre sessões.
                      </span>
                      {mechObj && (
                        <span className="text-emerald-300 font-bold whitespace-nowrap shrink-0 tabular-nums">
                          Atual: {mechObj.name} (Pit {mechPitOps.totalPitDeltaSec > 0 ? `+${mechPitOps.totalPitDeltaSec.toFixed(2)}` : mechPitOps.totalPitDeltaSec.toFixed(2)}s · Erro {mechPitOps.pitErrorProbPct}%)
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredChiefMechanics.map(s => {
                        const isAssigned = selectedChiefMechanic === s.id;
                        const interest = calculateStaffInterest({
                          staff: s,
                          projectAmbition,
                          hqOption: selectedHq,
                          isRealTeam: careerPath === 'real_team',
                          realTeamReputation
                        });
                        return (
                          <StaffMarketCard
                            key={s.id}
                            staffMember={s}
                            isAssigned={isAssigned}
                            interest={interest}
                            onExpand={setExpandedStaffProfile}
                            onToggleAssign={staffObj => {
                              playRadioSound();
                              setSelectedChiefMechanic(prev => (prev === staffObj.id ? null : staffObj.id));
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ========================================================== */}
        {/* STEP 7: CONCEPÇÃO COMPLETA M03–M10 (CÂMBIO, PACKAGING 3D, MONOCOQUE/AERO & DINÂMICA/MDO) */}
        {/* ========================================================== */}
        {currentStep === 7 && (() => {
          const isEmergency = emergencyMercedesDeal || Boolean(emergencySupplier);
          const effectiveEmergencySupplier = emergencySupplier || 'Mercedes';
          const engineFullName = isEmergency
            ? `${CUSTOMER_ENGINES[effectiveEmergencySupplier].fullName} (Acordo Emergencial)`
            : engineChoice === 'customer'
            ? CUSTOMER_ENGINES[customerSupplier].fullName
            : engineChoice === 'bought_factory'
            ? `${AVAILABLE_FACTORIES[selectedFactoryId].name} Spec-I`
            : `${customTeamName} Apex Works Spec-I`;
          const specs = getGearboxSpecs();
          const lockedEngineBankUsd = isEmergency
            ? 20_000_000
            : engineChoice === 'bought_factory'
            ? 24_000_000
            : engineChoice === 'phoenix'
            ? 32_000_000
            : 0;
          const lockedEngineCapUsd = isEmergency
            ? 15_000_000
            : engineChoice === 'bought_factory'
            ? 18_000_000
            : engineChoice === 'phoenix'
            ? 25_000_000
            : 0;
          const externalErsPendingUsd =
            ersSupplierCostUsd > 0 && prototypeCostSpent < ersSupplierCostUsd ? ersSupplierCostUsd : 0;
          const committedCarCostUsd =
            prototypeCostSpent + productionCostSpent + gearboxCostSpent + lockedEngineBankUsd + externalErsPendingUsd;
          const availableBudgetBeforePendingPhase7 = initialBudgetUsd - committedCarCostUsd;
          const costCapCommittedBeforePendingPhase7 =
            38_000_000 + prototypeCostSpent + productionCostSpent + gearboxCostSpent + lockedEngineCapUsd + externalErsPendingUsd;

          return (
            <OnboardingCarConceptionLab
              subStep={chassisSubStep}
              onChangeSubStep={(step) => {
                playRadioSound();
                setChassisSubStep(step);
              }}
              vehicleParams={vehicleParamsDraft}
              onUpdateParams={updateVehicleParamsDraft}
              philosophyCode={normalizeToM02Philosophy(philosophy)}
              sidepodConcept={chassisSidepodConcept}
              onSelectSidepodConcept={(concept) => {
                playRadioSound();
                setChassisSidepodConcept(concept);
                updateVehicleParamsDraft({
                  sidepodInletAreaCm2: concept === 'zeropod' ? 275 : concept === 'conventional' ? 395 : 335,
                  hotAirExitAreaCm2: concept === 'zeropod' ? 265 : concept === 'conventional' ? 380 : 325,
                  sidepodUndercutPct: concept === 'zeropod' ? 78 : concept === 'downwash' ? 68 : 44,
                  radiatorVolumeL: concept === 'zeropod' ? 10.6 : concept === 'conventional' ? 14.5 : 12.6
                });
              }}
              engineFullName={engineFullName}
              engineBlockAngle={engineBlockAngle}
              isEmergency={isEmergency}
              emergencySupplierName={effectiveEmergencySupplier}
              gearboxFinalized={gearboxFinalized}
              gearboxCostUsd={specs.totalCost}
              gearboxWeeks={specs.totalWeeks}
              onFinalizeGearbox={handleFinalizeGearbox}
              onReleaseToBahrain={() => {
                playRadioSound();
                setShowCarLaunchModal(true);
              }}
              ferrariErsSidepodMandatory={thirdPartyErsSupplier === 'Ferrari'}
              sidepodZeroPodBlocked={philosophyConflict.lockedSidepodConcepts.includes('zeropod')}
              coolingSidepodConstraintReason={philosophyConflict.packagingConstraintReason}
              headAero={hiredHeadAeroObj}
              headPU={hiredHeadPuObj}
              sportingDirector={hiredSportingObj}
              chiefMechanic={ALL_STAFF_MEMBERS.find(s => s.id === selectedChiefMechanic) || null}
              availableBudgetUsd={availableBudgetBeforePendingPhase7}
              committedCarCostUsd={committedCarCostUsd}
              costCapCommittedUsd={costCapCommittedBeforePendingPhase7}
              costCapLimitUsd={135_000_000}
            />
          );
        })()}

        {/* ========================================================== */}
        {/* STEP 8: PRÉ-TEMPORADA NO BAHREIN & CONTRATOS COMERCIAIS    */}
        {/* ========================================================== */}
        {currentStep === 8 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-f1-mono text-[#E10600] font-bold tracking-widest uppercase">
                FASE 8: PRÉ-TEMPORADA NO BAHREIN & CONTRATOS
              </span>
              <h2 className="font-f1-wide font-black text-2xl sm:text-3xl text-white uppercase">
                Testes em Sakhir & Propostas Comerciais
              </h2>
              <p className="text-sm text-zinc-400">
                Avalie o comportamento dinâmico do novo carro nos 3 dias de testes oficiais e assine os contratos comerciais para a abertura da temporada.
              </p>
            </div>

            {/* Se o cronograma estourou, pré-temporada perdida */}
            {(currentWeeksRemaining < 0 || abandonedToZero) && (
              <div className="bg-red-950/40 border-2 border-[#E10600] p-4 text-xs font-f1-mono text-red-200 space-y-3">
                <div className="flex items-center gap-2 text-white font-f1-wide font-black text-sm uppercase">
                  <AlertTriangle className="w-5 h-5 text-[#E10600] shrink-0" />
                  <span>CRONOGRAMA ESTOURADO · PRÉ-TEMPORADA PERDIDA ({currentWeeksRemaining} SEMANAS)</span>
                </div>
                <p className="leading-relaxed">
                  ⚠️ Devido ao atraso na homologação, a equipe não pôde realizar os testes de shakedown em Sakhir e não possui dados de telemetria de pré-temporada. O acerto do carro no GP1 começará do zero no Treino Livre 1 (TL1).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <div className="bg-[#15151E] border border-red-500/40 p-2.5">
                    <span className="text-[10px] text-zinc-400 uppercase block font-bold">Dados de Setup (TL1)</span>
                    <span className="text-red-400 font-bold">0% Telemetria (Começa do Zero)</span>
                  </div>
                  <div className="bg-[#15151E] border border-red-500/40 p-2.5">
                    <span className="text-[10px] text-zinc-400 uppercase block font-bold">Frete Aéreo & Multa FIA</span>
                    <span className="text-amber-300 font-bold tabular-nums">-$1.5M no Caixa</span>
                  </div>
                  <div className="bg-[#15151E] border border-red-500/40 p-2.5">
                    <span className="text-[10px] text-zinc-400 uppercase block font-bold">Estado da Equipe</span>
                    <span className="text-rose-300 font-bold tabular-nums">Engenheiros Exaustos (-8% Moral)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bahrain Pre-Season Test Simulation Canvas */}
            <div className="bg-[#1C1C26] p-6 border border-white/10 f1-pattern-micro-grid space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="font-f1-wide font-black text-sm text-white uppercase">
                  TESTES OFICIAIS DE PRÉ-TEMPORADA NO BAHREIN (3 DIAS)
                </span>
                <span className="text-xs font-f1-mono text-zinc-400">CIRCUITO DE SAKHIR</span>
              </div>

              {!preSeasonRan ? (
                <div className="py-8 text-center space-y-3">
                  <Activity className="w-10 h-10 text-[#E10600] mx-auto" />
                  <p className="text-xs font-f1-mono text-zinc-300 max-w-lg mx-auto leading-relaxed">
                    {currentWeeksRemaining < 0 || abandonedToZero
                      ? `Atraso de ${Math.abs(currentWeeksRemaining)} semana(s) estourou o prazo do shakedown. O carro seguirá de frete aéreo direto para o paddock do GP1 sem nenhuma volta de teste prévia.`
                      : 'O chassi foi montado e o motor homologado está instalado. Inicie os testes livres para aferir a telemetria real na pista do Bahrein!'}
                  </p>
                  <button
                    type="button"
                    onClick={runBahrainPreSeasonTest}
                    className="px-6 py-2.5 bg-[#E10600] hover:bg-[#c20500] text-white font-f1-wide font-bold text-xs uppercase tracking-wider f1-tab-chamfer transition-colors cursor-pointer shadow-lg"
                  >
                    {currentWeeksRemaining < 0 || abandonedToZero
                      ? 'Confirmar Atraso e Seguir Sem Shakedown para o GP1'
                      : 'Liberar Carro para a Pista do Bahrein'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-f1-mono">
                    <div className="bg-[#15151E] p-3 border border-white/5">
                      <span className="text-[10px] text-zinc-400 block uppercase">MELHOR TEMPO</span>
                      <span className="text-white font-bold text-sm tabular-nums">
                        {currentWeeksRemaining < 0 || abandonedToZero ? 'Sem Tempo (DNS)' : `${testResult?.lapTime.toFixed(3)}s`}
                      </span>
                    </div>
                    <div className="bg-[#15151E] p-3 border border-white/5">
                      <span className="text-[10px] text-zinc-400 block uppercase">POSIÇÃO NA TABELA</span>
                      <span className={currentWeeksRemaining < 0 || abandonedToZero ? 'text-red-400 font-bold text-sm' : 'text-emerald-400 font-bold text-sm'}>
                        {currentWeeksRemaining < 0 || abandonedToZero ? 'Não Participou' : `P${testResult?.rank} no Grid`}
                      </span>
                    </div>
                    <div className="bg-[#15151E] p-3 border border-white/5">
                      <span className="text-[10px] text-zinc-400 block uppercase">TELEMETRIA INICIAL</span>
                      <span className={`font-bold text-sm ${currentWeeksRemaining < 0 || abandonedToZero ? 'text-red-400' : testResult?.porpoising ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {currentWeeksRemaining < 0 || abandonedToZero ? 'Setup 0% (TL1 do Zero)' : (testResult?.porpoising ? 'Porpoising Detectado' : 'Fluxo Estável')}
                      </span>
                    </div>
                    <div className="bg-[#15151E] p-3 border border-white/5">
                      <span className="text-[10px] text-zinc-400 block uppercase">CONFIABILIDADE</span>
                      <span className={`font-bold text-sm tabular-nums ${currentWeeksRemaining < 0 || abandonedToZero ? 'text-amber-300' : 'text-white'}`}>
                        {currentWeeksRemaining < 0 || abandonedToZero ? 'Sem Teste de Pista' : `${testResult?.reliability}%`}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 bg-[#15151E] p-3 border border-white/5 font-f1-mono leading-relaxed">
                    {currentWeeksRemaining < 0 || abandonedToZero
                      ? `⚠️ Devido ao atraso na homologação, o ${chassisName} não possui dados de telemetria de pré-temporada. O acerto do carro no GP1 começará do zero (0% de confiança no TL1), gerando desgaste de equipe (-8% moral) e custo emergencial de frete aéreo (-$1.5M).`
                      : (testResult?.delayWeeks === 0
                        ? `✓ SHAKEDOWN NO BAHREIN: O novo ${chassisName} da ${careerPath === 'custom_team' ? customTeamName : (allTeams.find(t => t.id === selectedRealTeamId)?.name || 'equipe')} chamou atenção no paddock e completou 142 voltas em Sakhir sem falhas catastróficas. Dados suficientes coletados para atrair patrocinadores!`
                        : `⚠️ SHAKEDOWN NO BAHREIN: O novo ${chassisName} entrou na pista com pequeno atraso de montagem na PU, mas completou a coleta de telemetria a tempo para a abertura do campeonato.`)}
                  </p>
                </div>
              )}
            </div>

            {/* Sponsor Deals Grid + Compromisso com o Conselho */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#1C1C26] p-5 border border-white/10 space-y-3 f1-container-frame">
                <div className="flex items-center justify-between">
                  <span className="font-f1-wide font-black text-sm text-white uppercase">
                    Aramco Global Energy
                  </span>
                  <span className="text-[10px] font-f1-mono bg-[#E10600] text-white px-2 py-0.5 font-bold">
                    PATROCINADOR MASTER
                  </span>
                </div>
                <div className="text-xs font-f1-mono space-y-1 text-zinc-300">
                  <div>Cota Anual: <span className="text-white font-bold">$38.000.000</span></div>
                  <div>Bônus por GP Pontuado: <span className="text-emerald-400 font-bold">+$1.200.000</span></div>
                  <div>Meta do Conselho ({ambitionSpec.title}): <span className="text-amber-300 font-bold">{ambitionSpec.boardExpectationText}</span></div>
                  <div>Pressão da Diretoria: <span className="text-zinc-300 font-bold">{ambitionSpec.pressureLabel}</span></div>
                </div>
              </div>

              <div className="bg-[#1C1C26] p-5 border border-white/10 space-y-3 f1-container-frame">
                <div className="flex items-center justify-between">
                  <span className="font-f1-wide font-black text-sm text-white uppercase">
                    Cognizant & Heineken 0.0%
                  </span>
                  <span className="text-[10px] font-f1-mono bg-white/10 text-zinc-300 px-2 py-0.5 font-bold">
                    SECUNDÁRIOS
                  </span>
                </div>
                <div className="text-xs font-f1-mono space-y-1 text-zinc-300">
                  <div>Cota Combinada: <span className="text-white font-bold">$32.000.000</span></div>
                  <div>Bônus por Classificação no Top 10: <span className="text-emerald-400 font-bold">+$900.000</span></div>
                  <div>Logística Anual da Sede ({selectedHq.name}): <span className="text-amber-300 font-bold">-${(selectedHq.modifiers.logisticsAnnualCostM ?? 5.0).toFixed(1)}M/ano</span></div>
                </div>
              </div>
            </div>

            {/* Launch Banner */}
            <div className="bg-[#1C1C26] p-6 border-2 border-[#E10600] text-center space-y-3 f1-pattern-red-grid">
              <Flag className="w-10 h-10 text-[#E10600] mx-auto" />
              <h3 className="font-f1-wide font-black text-xl text-white uppercase">
                TUDO PRONTO PARA O GRANDE PRÊMIO DE ABERTURA!
              </h3>
              <p className="text-xs font-f1-mono text-zinc-300 max-w-lg mx-auto">
                O motor foi homologado, o carro montado dentro do Teto de Gastos de $135M e a meta do Conselho ({ambitionSpec.boardExpectationText}) foi selada. As luzes vermelhas vão se apagar!
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer Navigation Bar */}
      <footer className="relative z-10 border-t border-[#2C2C3A] bg-[#101017] py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 5 && puPhaseStage === 'dossier'}
            className={`px-4 py-2 text-xs font-f1-wide uppercase flex items-center gap-1.5 transition-colors ${
              currentStep === 5 && puPhaseStage === 'dossier'
                ? 'text-amber-500/90 cursor-not-allowed border border-amber-500/20 bg-amber-950/20'
                : 'text-zinc-400 hover:text-white cursor-pointer'
            }`}
          >
            {currentStep === 5 && puPhaseStage === 'dossier' ? (
              <span className="flex items-center gap-1.5 font-f1-mono text-[11px] normal-case">
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Contrato de PU homologado pela FIA. Alterações de fornecedor só na próxima temporada.</span>
              </span>
            ) : (
              <>
                <ArrowLeft className="w-4 h-4" />
                <span>
                  {currentStep === 1
                    ? 'Cancelar'
                    : currentStep === 5 && puPhaseStage === 'phoenix_assembly'
                    ? 'Voltar à Seleção de Motor'
                    : 'Fase Anterior'}
                </span>
              </>
            )}
          </button>

          <button
            onClick={nextStep}
            disabled={(currentStep === 3 && !isStep3Complete) || (currentStep === 6 && !isStep6Complete)}
            className={`px-6 py-2.5 font-f1-wide font-bold text-xs uppercase tracking-wider f1-tab-chamfer transition-colors flex items-center gap-2 shadow-lg ${
              (currentStep === 3 && !isStep3Complete) || (currentStep === 6 && !isStep6Complete)
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/10'
                : 'bg-[#E10600] hover:bg-[#c20500] text-white cursor-pointer'
            }`}
          >
            {(currentStep === 3 && !isStep3Complete) || (currentStep === 6 && !isStep6Complete) ? (
              <>
                <Lock className="w-4 h-4 text-amber-500" />
                <span>
                  {currentStep === 3
                    ? 'Trava de Avanço (Contrate os 3 Pilares Técnicos)'
                    : 'Trava de Avanço (Complete Pilotos, Rádio e Chefe Mecânico)'}
                </span>
              </>
            ) : (
              <>
                <span>
                  {currentStep === 2
                    ? 'ACEITAR TERMOS E DEFINIR ORGANIZAÇÃO & STAFF'
                    : currentStep === 3
                    ? 'Confirmar Diretoria Técnica & Definir Conceito do Carro'
                    : currentStep === 4
                    ? 'Confirmar Conceito do Carro & Escolher Motor (PU)'
                    : currentStep === 5 && puPhaseStage === 'select'
                    ? 'Gerar Gabarito / Dossiê do Motor'
                    : currentStep === 5 && puPhaseStage === 'phoenix_assembly'
                    ? 'Confirmar Montagem & Gerar Dossiê Técnico'
                    : currentStep === 5 && puPhaseStage === 'dossier'
                    ? 'Avançar para Equipe de Pista (Pilotos, Rádio & Mecânico)'
                    : currentStep === 6
                    ? 'Confirmar Garagem & Ir para Concepção M03–M10'
                    : currentStep === 8
                    ? 'Assinar Superlicença & Entrar na Pista'
                    : currentStep === 7 && chassisSubStep === 'gearbox'
                    ? 'Finalizar Câmbio e Ir para Packaging 3D'
                    : currentStep === 7 && chassisSubStep === 'packaging'
                    ? 'Avançar para Monocoque & Aero'
                    : currentStep === 7 && chassisSubStep === 'monocoque'
                    ? 'Avançar para Dinâmica & Pareto'
                    : currentStep === 7 && chassisSubStep === 'dynamics'
                    ? 'Liberar Carro para o Bahrein'
                    : 'Confirmar & Próxima Fase'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </footer>

      {/* Modal de Celebração & Homologação FIA: Novo Status de Montadora (Works Team) */}
      {showWorksTeamModal && (
        <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="max-w-2xl w-full bg-gradient-to-b from-[#1A1826] via-[#12111C] to-[#0A0A10] border-2 border-amber-500/80 p-6 sm:p-8 f1-container-bucket shadow-[0_0_80px_rgba(245,158,11,0.3)] relative space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Top Ornamental Badge */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-amber-400 inline-block animate-pulse" />
                <span className="text-[10px] font-f1-mono text-amber-300 font-bold uppercase tracking-widest bg-amber-950/60 border border-amber-500/40 px-2.5 py-1">
                  ⭐ HOMOLOGAÇÃO OFICIAL FIA · PROTOCOLO WORKS 2026
                </span>
              </div>
              <span className="text-[10px] font-f1-mono text-amber-200/80 uppercase tracking-widest font-bold">
                STATUS CONCEDIDO: MONTADORA (WORKS TEAM)
              </span>
            </div>

            {/* Modal Title */}
            <div className="space-y-1">
              <h2 className="font-f1-wide font-black text-xl sm:text-2xl lg:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-amber-100 uppercase tracking-wider">
                HOMOLOGAÇÃO FIA: NOVO STATUS DE MONTADORA
              </h2>
              <span className="text-xs font-f1-mono text-amber-400 font-bold uppercase tracking-wider block">
                FABRICANTE OFICIAL DE UNIDADES DE POTÊNCIA (CONSTRUTOR INDEPENDENTE)
              </span>
            </div>

            {/* Dra. Helena Vance Card */}
            <div className="bg-[#151522] border border-amber-500/40 p-4 relative overflow-hidden flex flex-col sm:flex-row gap-4 items-start shadow-inner">
              {/* Avatar Dra. Helena Vance */}
              <div className="flex sm:flex-col items-center gap-2.5 shrink-0">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-600 via-amber-700 to-amber-950 border-2 border-amber-400 flex items-center justify-center shadow-lg font-f1-wide font-black text-xl text-white">
                  HV
                </div>
                <div className="sm:text-center">
                  <span className="font-f1-wide font-black text-xs text-white uppercase block">
                    Dra. Helena Vance
                  </span>
                  <span className="text-[9px] font-f1-mono text-amber-300 uppercase block tracking-tighter">
                    Dir. Operações & Regulação FIA
                  </span>
                </div>
              </div>

              {/* Speech Dispatch */}
              <div className="space-y-2 border-t sm:border-t-0 sm:border-l border-white/10 sm:pl-4 pt-2 sm:pt-0">
                <div className="flex items-center gap-1.5 text-[10px] font-f1-mono text-amber-400 font-bold uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 bg-emerald-400 inline-block animate-ping" />
                  <span>COMUNICADO EXCLUSIVO · PADDOCK FIA</span>
                </div>
                <p className="text-xs font-sans text-zinc-200 leading-relaxed italic">
                  "Chefe, uma notícia histórica! Com a aquisição da nossa própria divisão de motores, a FIA nos concedeu o status oficial de <strong className="text-amber-300 not-italic uppercase font-f1-wide">MONTADORA (Works Team)</strong>. Não dependemos mais de terceiros, podemos evoluir nosso motor e vender para clientes no futuro. A imprensa está chamando isso de <strong className="text-white not-italic">'O Nascimento da {customTeamName} Powertrains'</strong>. O senhor gostaria de atualizar o nome oficial da nossa marca no grid?"
                </p>
              </div>
            </div>

            {/* 3 Status Bonus Boxes */}
            <div className="space-y-2">
              <span className="text-[10px] font-f1-mono text-zinc-400 uppercase tracking-widest font-bold block">
                BÔNUS DE STATUS INSTITUCIONAL:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Box 1: Reputação */}
                <div className="bg-[#151522] border border-amber-500/40 p-3.5 space-y-1 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-f1-mono text-amber-300 font-bold uppercase tracking-wider">
                      REPUTAÇÃO
                    </span>
                    <Trophy className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-f1-wide font-black text-amber-400 tabular-nums">
                    +15
                  </div>
                  <p className="text-[11px] text-zinc-300 font-sans leading-tight">
                    Sua equipe agora é vista como fabricante.
                  </p>
                </div>

                {/* Box 2: Base de Fãs */}
                <div className="bg-[#151522] border border-cyan-500/40 p-3.5 space-y-1 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-f1-mono text-cyan-300 font-bold uppercase tracking-wider">
                      BASE DE FÃS
                    </span>
                    <Megaphone className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-f1-wide font-black text-cyan-400 tabular-nums">
                    +5.000.000
                  </div>
                  <p className="text-[11px] text-zinc-300 font-sans leading-tight">
                    A imprensa e os fãs estão eufóricos.
                  </p>
                </div>

                {/* Box 3: Receita de Marketing */}
                <div className="bg-[#151522] border border-emerald-500/40 p-3.5 space-y-1 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-f1-mono text-emerald-300 font-bold uppercase tracking-wider">
                      MARKETING
                    </span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-f1-wide font-black text-emerald-400 tabular-nums">
                    +$2.0M<span className="text-xs font-normal">/ano</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 font-sans leading-tight">
                    Novos patrocinadores de tecnologia.
                  </p>
                </div>
              </div>
            </div>

            {/* Input para Editar o Nome Oficial da Equipe */}
            <div className="bg-[#151522] border border-white/10 p-4 space-y-2">
              <label className="text-xs font-f1-wide font-bold text-white uppercase tracking-wider block">
                Nome Oficial da Equipe / Montadora no Grid:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={worksTeamNameInput}
                  onChange={e => setWorksTeamNameInput(e.target.value)}
                  placeholder="Ex: Apex Powertrains ou Brasa Racing Works"
                  className="w-full bg-[#0D0D14] border-2 border-amber-500/60 px-4 py-3 text-sm text-white font-f1-mono font-bold focus:border-[#E10600] focus:outline-none transition-all placeholder:text-zinc-600 shadow-inner"
                />
              </div>
              <p className="text-[11px] font-f1-mono text-zinc-400 leading-tight">
                Dica: O nome inserido aqui atualiza todo o sistema (Top Bar, Dashboard e Imprensa).
              </p>
            </div>

            {/* Action Button & Lock Notice */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleConfirmWorksTeam}
                disabled={!worksTeamNameInput.trim()}
                className="w-full py-4 bg-gradient-to-r from-[#E10600] via-[#c20500] to-[#E10600] hover:from-[#c20500] hover:to-[#a30400] disabled:opacity-50 disabled:cursor-not-allowed text-white font-f1-wide font-black text-xs sm:text-sm uppercase tracking-wider f1-tab-chamfer transition-all flex items-center justify-center gap-3 shadow-[0_0_35px_rgba(225,6,0,0.5)] border border-amber-400/50 cursor-pointer"
              >
                <Award className="w-5 h-5 text-amber-300" />
                <span>Assinar Novo Registro FIA e Iniciar Temporada</span>
                <ArrowRight className="w-5 h-5 text-amber-300" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] font-f1-mono text-amber-400/90 uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Momento irreversível de progressão institucional. Confirmação obrigatória.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Saída da Criação de Equipe */}
      {showExitConfirmModal && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#15151E] border-2 border-red-600/70 p-6 f1-container-bucket shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <div className="w-10 h-10 bg-red-600/20 border border-red-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <span className="text-[10px] font-f1-mono text-red-500 font-bold uppercase tracking-widest block">
                  PROTOCOLO DE ABANDONO FIA
                </span>
                <h3 className="font-f1-wide font-black text-base text-white uppercase tracking-wider">
                  CONFIRMAR SAÍDA
                </h3>
              </div>
            </div>

            <p className="text-xs font-f1-mono text-zinc-300 leading-relaxed bg-[#1C1C26] p-3.5 border border-white/5">
              Atenção: Se você sair agora, todo o progresso desta nova equipe (escolha de motor, fábrica e pré-temporada) será PERDIDO. Você será redirecionado ao Menu Principal. Deseja continuar?
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowExitConfirmModal(false)}
                className="w-full py-2.5 bg-[#252533] hover:bg-[#2F2F40] border border-white/20 text-white text-xs font-f1-wide font-bold uppercase tracking-wider transition-all cursor-pointer text-center"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirmModal(false);
                  try {
                    localStorage.removeItem('apex_f1_engine_locked');
                    sessionStorage.clear();
                  } catch (_) {}
                  onCancel();
                }}
                className="w-full py-2.5 bg-[#E10600] hover:bg-[#B30500] text-white text-xs font-f1-wide font-black uppercase tracking-wider transition-all cursor-pointer text-center shadow-lg"
              >
                Confirmar e Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Alerta Compulsório da FIA (Selo do Motor) */}
      {showFiaFreezeAlertModal && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-[#15151E] border-2 border-amber-500/80 p-6 f1-container-bucket shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <div className="w-10 h-10 bg-amber-500/20 border border-amber-500 flex items-center justify-center shrink-0">
                <Lock className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <span className="text-[10px] font-f1-mono text-amber-400 font-bold uppercase tracking-widest block">
                  COMISSÁRIOS TÉCNICOS DA FIA · REGULAMENTO 2026
                </span>
                <h3 className="font-f1-wide font-black text-base sm:text-lg text-white uppercase tracking-wider">
                  HOMOLOGAÇÃO COMPULSÓRIA DO MOTOR
                </h3>
              </div>
            </div>

            <div className="space-y-3 font-f1-mono text-xs">
              <div className="bg-red-950/50 border border-red-500/50 p-4 text-red-200 font-bold leading-relaxed text-sm flex items-center gap-3">
                <AlertOctagon className="w-6 h-6 text-[#E10600] shrink-0" />
                <span>A FIA selou o projeto. O tempo da pré-temporada acabou.</span>
              </div>

              <div className="bg-[#1C1C26] p-3.5 border border-white/5 space-y-2 text-zinc-300 leading-relaxed">
                <p>
                  O prazo regulamentar para o congelamento técnico dos motores expirou. Os fiscais da FIA aplicaram os lacres compulsórios nas câmaras de combustão, no virabrequim e no subsistema híbrido.
                </p>
                <div className="text-[11px] text-zinc-400 space-y-1 pt-1 border-t border-white/5">
                  <div>• <strong>Hardware ICE & ERS:</strong> Congelados permanentemente até o fim da temporada.</div>
                  <div>• <strong>Ajustes Permitidos:</strong> Apenas mapas de Software (deploy/harvest e curva anti-clipping) ou via <em>Janelas de Homologação ADUO</em>.</div>
                  {dynamoFailed && (
                    <div className="text-amber-400 font-bold pt-1">
                      • Protocolo de Emergência acionado: como o motor estava danificado ou reprovado na bancada, a equipe foi obrigada a adotar um motor homologado de emergência.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  playRadioSound();
                  setShowFiaFreezeAlertModal(false);
                  setHardwareBlockedByTime(true);
                }}
                className="w-full py-3 bg-[#E10600] hover:bg-[#c20500] text-white text-xs font-f1-wide font-black uppercase tracking-wider transition-all cursor-pointer text-center shadow-lg"
              >
                ENTENDIDO (PROSSEGUIR)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Negociação do Estado 2 (Prêmio de Risco) */}
      {negotiatingDriver && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#15151E] border-2 border-amber-500/80 p-6 f1-container-bucket shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <div className="w-10 h-10 bg-amber-500/20 border border-amber-500 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <span className="text-[10px] font-f1-mono text-amber-400 font-bold uppercase tracking-widest block">
                  NEGOCIAÇÃO SALARIAL · PRÊMIO DE RISCO
                </span>
                <h3 className="font-f1-wide font-black text-base text-white uppercase tracking-wider">
                  {negotiatingDriver.driver.name}
                </h3>
              </div>
            </div>

            <div className="space-y-3 font-f1-mono text-xs">
              <p className="text-zinc-200 leading-relaxed bg-[#1C1C26] p-3.5 border border-white/5">
                Atenção: <strong className="text-white">{negotiatingDriver.driver.name}</strong> aceitou conversar, mas exige um salário de <strong className="text-amber-400">${(negotiatingDriver.riskSalary / 1000000).toFixed(1)}M</strong> por ano para correr em uma equipe com a nossa reputação ({playerReputation} vs {negotiatingDriver.driver.requiredReputation} exigida). Aceita pagar?
              </p>

              <div className="bg-black/40 p-3 border border-white/5 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Salário Padrão do Card:</span>
                  <span className="text-zinc-400 line-through">${(negotiatingDriver.driver.salary / 1000000).toFixed(1)}M/ano</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-amber-400">Salário com Prêmio de Risco (+30%):</span>
                  <span className="text-amber-300 text-sm">${(negotiatingDriver.riskSalary / 1000000).toFixed(1)}M/ano</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-white/5 text-emerald-400 font-bold">
                  <span>Bônus de Patrocínio do Piloto:</span>
                  <span>+{getDriverMarketAnalysis(negotiatingDriver.driver).marketingBonusCashM.toFixed(1)}M/ano</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setNegotiatingDriver(null)}
                className="w-full py-2.5 bg-[#252533] hover:bg-[#2F2F40] border border-white/20 text-white text-xs font-f1-wide font-bold uppercase tracking-wider transition-all cursor-pointer text-center"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  playRadioSound();
                  const drvId = negotiatingDriver.driver.id;
                  const slot = negotiatingDriver.slot;
                  setDriverContractSalaries(prev => ({
                    ...prev,
                    [drvId]: negotiatingDriver.riskSalary
                  }));

                  if (slot === 't1') {
                    if (selectedDriver2 === drvId) setSelectedDriver2(null);
                    if (selectedReserveDriver === drvId) setSelectedReserveDriver(null);
                    setSelectedDriver1(drvId);
                  } else if (slot === 't2') {
                    if (selectedDriver1 === drvId) setSelectedDriver1(null);
                    if (selectedReserveDriver === drvId) setSelectedReserveDriver(null);
                    setSelectedDriver2(drvId);
                  } else {
                    if (selectedDriver1 === drvId) setSelectedDriver1(null);
                    if (selectedDriver2 === drvId) setSelectedDriver2(null);
                    setSelectedReserveDriver(drvId);
                  }
                  setNegotiatingDriver(null);
                }}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-f1-wide font-black uppercase tracking-wider transition-all cursor-pointer text-center shadow-lg"
              >
                Aceitar & Contratar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAÇÃO DE TESTE NO DINAMÔMETRO */}
      {showConfirmGoToDynamoModal && (
        <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#15151E] border-2 border-amber-500/80 p-6 f1-container-bucket shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <div className="w-10 h-10 bg-amber-500/20 border border-amber-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <span className="text-[10px] font-f1-mono text-amber-400 font-bold uppercase tracking-widest block">
                  BANCO DE ENSAIOS A 15.000 RPM
                </span>
                <h3 className="font-f1-wide font-black text-base text-white uppercase tracking-wider">
                  TESTE NO DINAMÔMETRO
                </h3>
              </div>
            </div>

            <div className="bg-[#1C1C26] p-3.5 border border-white/5 space-y-2 text-xs font-f1-mono">
              <p className="text-zinc-300 leading-relaxed">
                Atenção: Ao levar o motor ao dinamômetro, o tempo de pré-temporada será consumido. Deseja prosseguir?
              </p>
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-amber-400 font-bold">
                <span>CUSTO DO PROTÓTIPO:</span>
                <span>-${(custoPrototipo / 1000000).toFixed(1)}M</span>
              </div>
              <span className="text-[10px] text-zinc-500 block leading-tight">
                O valor será deduzido imediatamente do seu Caixa e lançado no Teto de Gastos de P&D da FIA.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmGoToDynamoModal(false)}
                className="w-full py-2.5 bg-[#252533] hover:bg-[#2F2F40] border border-white/20 text-white text-xs font-f1-wide font-bold uppercase tracking-wider transition-all cursor-pointer text-center"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmGoToDynamoModal(false);
                  executeDynamoTest();
                }}
                className="w-full py-2.5 bg-[#E10600] hover:bg-[#B30500] text-white text-xs font-f1-wide font-black uppercase tracking-wider transition-all cursor-pointer text-center shadow-lg"
              >
                Confirmar e Ir ao Dinamômetro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAÇÃO DE HOMOLOGAÇÃO FIA (CONGELAMENTO DE HARDWARE) */}
      {showFiaHomologationConfirmModal && (
        <div className="fixed inset-0 z-[125] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#15151E] border-2 border-emerald-500/80 p-6 f1-container-bucket shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-500 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <span className="text-[10px] font-f1-mono text-emerald-400 font-bold uppercase tracking-widest block">
                  FIA HOMOLOGATION BUREAU · CONGELAMENTO DE HARDWARE
                </span>
                <h3 className="font-f1-wide font-black text-base text-white uppercase tracking-wider">
                  HOMOLOGAR MOTOR OFICIALMENTE
                </h3>
              </div>
            </div>

            <div className="bg-[#1C1C26] p-3.5 border border-white/5 space-y-2.5 text-xs font-f1-mono">
              <p className="text-zinc-300 leading-relaxed">
                Assinatura FIA: Ao homologar <strong className="text-white">{customEngineName.trim() || `${(customTeamShort || 'APX').toUpperCase()}-01 Evo`}</strong>, o hardware do motor será congelado até o fim da temporada. Você não poderá voltar atrás. Confirmar?
              </p>
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-emerald-400 font-bold">
                <span>CUSTO DE PRODUÇÃO (8 MOTORES):</span>
                <span className="tabular-nums">-${(custoProducaoTotal / 1000000).toFixed(1)}M</span>
              </div>
              <span className="text-[10px] text-zinc-500 block leading-tight">
                Produção da frota oficial de 8 unidades (4 PUs por piloto). Valor debitado do Caixa e lançado no Teto de Gastos FIA.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowFiaHomologationConfirmModal(false)}
                className="w-full py-2.5 bg-[#252533] hover:bg-[#2F2F40] border border-white/20 text-white text-xs font-f1-wide font-bold uppercase tracking-wider transition-all cursor-pointer text-center"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  playRadioSound();
                  const totalFrota = custoProducaoTotal;

                  // 1. Deduzir o Custo de Produção Final do Caixa e do Teto de Gastos
                  setFinancials(prev => ({
                    ...prev,
                    bankBalance: prev.bankBalance - totalFrota,
                    costCapSpent: prev.costCapSpent + totalFrota
                  }));
                  setProductionCostSpent(totalFrota);

                  // 2. Exibir notificação
                  const finalName = customEngineName.trim() || `${(customTeamShort || 'APX').toUpperCase()}-01 Evo`;
                  const msg = `Homologação FIA assinada (${finalName}). 8 unidades produzidas para a temporada. -$${(totalFrota / 1000000).toFixed(1)}M.`;
                  addNotification('HOMOLOGAÇÃO FIA RATIFICADA', msg, 'info');
                  setProductionNotification(msg);

                  // 3. Selar o motor e exibir Card Oficial Homologado
                  homologarMotorFIA();
                  setMotorHomologadoFIA(true);
                  setMotorHomologado(true);
                  setSemanasRestantesPreTemporada(0);
                  setShowFiaHomologationConfirmModal(false);
                  setShowDynamoReportModal(true);
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-f1-wide font-black uppercase tracking-wider transition-all cursor-pointer text-center shadow-lg"
              >
                Confirmar Homologação FIA
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL EXPANSÍVEL: FICHA COMPLETA DO PILOTO */}
      {expandedDriverProfile && (() => {
        const d = expandedDriverProfile;
        const reqRep = d.requiredReputation || 0;
        const repDiff = playerReputation - reqRep;
        const interestState: DriverInterestState =
          repDiff >= 0 ? 'interested' : repDiff >= -15 ? 'negotiable' : 'no_interest';
        const riskSalary = Math.round(d.salary * 1.30);
        const contractedSalary = driverContractSalaries[d.id];
        const effectiveSalary = contractedSalary || (interestState === 'negotiable' ? riskSalary : d.salary);

        return (
          <DriverProfileModal
            driver={d}
            isT1={d.id === selectedDriver1}
            isT2={d.id === selectedDriver2}
            isRes={d.id === selectedReserveDriver}
            interestState={interestState}
            playerReputation={playerReputation}
            effectiveSalary={effectiveSalary}
            contractedSalary={contractedSalary}
            onClose={() => setExpandedDriverProfile(null)}
            onAssignSlot={(drv, slot) => {
              const currentlyInSlot =
                (slot === 't1' && drv.id === selectedDriver1) ||
                (slot === 't2' && drv.id === selectedDriver2) ||
                (slot === 'reserve' && drv.id === selectedReserveDriver);

              if (currentlyInSlot) {
                if (slot === 't1') setSelectedDriver1(null);
                else if (slot === 't2') setSelectedDriver2(null);
                else setSelectedReserveDriver(null);
                return;
              }
              if (interestState === 'negotiable' && !contractedSalary) {
                setExpandedDriverProfile(null);
                setNegotiatingDriver({ driver: drv, slot, riskSalary });
                return;
              }
              if (slot === 't1') {
                if (selectedDriver2 === drv.id) setSelectedDriver2(null);
                if (selectedReserveDriver === drv.id) setSelectedReserveDriver(null);
                setSelectedDriver1(drv.id);
              } else if (slot === 't2') {
                if (selectedDriver1 === drv.id) setSelectedDriver1(null);
                if (selectedReserveDriver === drv.id) setSelectedReserveDriver(null);
                setSelectedDriver2(drv.id);
              } else {
                if (selectedDriver1 === drv.id) setSelectedDriver1(null);
                if (selectedDriver2 === drv.id) setSelectedDriver2(null);
                setSelectedReserveDriver(drv.id);
              }
              playRadioSound();
            }}
          />
        );
      })()}

      {/* MODAL EXPANSÍVEL: FICHA COMPLETA DO CHEFE / ENGENHEIRO (STAFF) */}
      {expandedStaffProfile && (() => {
        const s = expandedStaffProfile;
        const isAssigned =
          (s.role === 'head_aero' && selectedHeadAero === s.id) ||
          (s.role === 'head_pu' && selectedHeadPU === s.id) ||
          ((s.role === 'sporting_director' || s.role === 'head_management') && selectedSportingDirector === s.id) ||
          ((s.role === 'chief_mechanic' || s.role === 'head_mechanics') && selectedChiefMechanic === s.id) ||
          (s.role === 'race_engineer' && (selectedRaceEngineer1 === s.id || selectedRaceEngineer2 === s.id));
        const staffInterest = calculateStaffInterest({
          staff: s,
          projectAmbition,
          hqOption: selectedHq,
          isRealTeam: careerPath === 'real_team',
          realTeamReputation
        });

        return (
          <StaffProfileModal
            staffMember={s}
            isAssigned={isAssigned}
            interest={staffInterest}
            onClose={() => setExpandedStaffProfile(null)}
            onToggleAssign={staffObj => {
              playRadioSound();
              if (staffObj.role === 'head_aero') {
                setSelectedHeadAero(selectedHeadAero === staffObj.id ? null : staffObj.id);
              } else if (staffObj.role === 'head_pu') {
                setSelectedHeadPU(selectedHeadPU === staffObj.id ? null : staffObj.id);
              } else if (staffObj.role === 'sporting_director' || staffObj.role === 'head_management') {
                setSelectedSportingDirector(selectedSportingDirector === staffObj.id ? null : staffObj.id);
              } else if (staffObj.role === 'chief_mechanic' || staffObj.role === 'head_mechanics') {
                setSelectedChiefMechanic(selectedChiefMechanic === staffObj.id ? null : staffObj.id);
              } else if (staffObj.role === 'race_engineer') {
                if (selectedRaceEngineer1 === staffObj.id) {
                  setSelectedRaceEngineer1(null);
                } else if (selectedRaceEngineer2 === staffObj.id) {
                  setSelectedRaceEngineer2(null);
                } else if (!selectedRaceEngineer1) {
                  setSelectedRaceEngineer1(staffObj.id);
                } else {
                  setSelectedRaceEngineer2(staffObj.id);
                }
              }
            }}
          />
        );
      })()}
      {/* CERIMÔNIA DE LANÇAMENTO OFICIAL DO MONOPOSTO 2026 & NOMEAÇÃO DE CHASSI FIA */}
      {(() => {
        const realTeamObj = allTeams.find(t => t.id === selectedRealTeamId);
        const activeTeamId = careerPath === 'custom_team' ? 'apex' : selectedRealTeamId;
        const activeTeamName = careerPath === 'custom_team' ? customTeamName : (realTeamObj?.name || 'Scuderia Ferrari HP');
        const activeTeamShort = careerPath === 'custom_team' ? customTeamShort : (realTeamObj?.shortName || 'FER');
        const activeTeamColor = careerPath === 'custom_team' ? customColor : (realTeamObj?.color || '#E8002D');
        const activeTeamSecondary = careerPath === 'custom_team' ? customSecondaryColor : (realTeamObj?.secondaryColor || '#FFFFFF');
        const activePuFullName = customEngineName.trim() || (
          isEmergencyActive
            ? `${CUSTOMER_ENGINES[effectiveEmergencySupplier].fullName} (Acordo Emergencial)`
            : engineChoice === 'customer'
            ? CUSTOMER_ENGINES[customerSupplier].fullName
            : engineChoice === 'bought_factory'
            ? `${AVAILABLE_FACTORIES[selectedFactoryId].name} Spec-I`
            : `${customTeamName} Apex Works Spec-I`
        );
        const livePkg = buildPackagingArchitecture(vehicleParamsDraft, FIA_2026_DEFAULT_EDITION);
        const defaultSuggested = getDefaultChassisSuggestions(activeTeamShort, activeTeamName)[0] || 'APX-01';

        return (
          <CarLaunchModal
            isOpen={showCarLaunchModal}
            initialChassisName={chassisLaunchConfirmed ? chassisName : (careerPath === 'real_team' && realTeamObj?.carModelName ? realTeamObj.carModelName : defaultSuggested)}
            teamId={activeTeamId}
            teamName={activeTeamName}
            teamShort={activeTeamShort}
            teamColor={activeTeamColor}
            teamSecondaryColor={activeTeamSecondary}
            powerUnitName={activePuFullName}
            packaging={livePkg}
            vehicleParams={vehicleParamsDraft}
            drivers={drivers}
            soundEnabled={soundEnabled}
            onCancel={() => setShowCarLaunchModal(false)}
            onConfirmAndAdvance={(confirmedName) => {
              setChassisName(confirmedName);
              setChassisLaunchConfirmed(true);
              setShowCarLaunchModal(false);
              setCurrentStep(8);
            }}
          />
        );
      })()}
    </div>
  );
};
