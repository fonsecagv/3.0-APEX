import { COMPOSITE_MATERIALS } from '../data/physicsDatabase.ts';
import type { StaffMember } from '../types/f1.ts';
import type {
  CfdReportData,
  EngineerDiagnostic,
  EngineeringChecklistItem,
  FeaReportData,
  SimulationReport,
  ThermalReportData,
  VehicleEngineeringParameters,
} from '../types/physics.ts';
import { evaluateStructures } from './modules/m07Structures.ts';
import { solveVehiclePhysics } from './physicsEngine.ts';
import { validateFia2026Compliance } from './regulatoryEngine.ts';

export interface SimulationRunContext {
  componentType: 'pu' | 'gearbox' | 'chassis' | 'suspension' | 'floor' | 'wings';
  params: VehicleEngineeringParameters;
  atrHoursUsed: number;
  windTunnelLevel: number;
  cfdLevel: number;
  simulatorLevel?: number;
  dnaCorrelationModifier: number; // e.g. -0.35 or +0.15
  staff: StaffMember[];
  componentLevelAvg?: number;
  ambientTempC?: number;
}

export function runMultiPhysicsSimulation(ctx: SimulationRunContext): SimulationReport {
  const {
    componentType,
    params,
    atrHoursUsed,
    windTunnelLevel,
    cfdLevel,
    simulatorLevel = 2,
    dnaCorrelationModifier,
    staff,
    componentLevelAvg = 1,
    ambientTempC = 25,
  } = ctx;

  // Calibration uncertainty depends on WT, CFD, Simulator, ATR hours & Principal DNA
  const baseErrorPct = Math.max(
    2.5,
    Number((22 - (windTunnelLevel * 2.6 + cfdLevel * 2.1 + simulatorLevel * 0.9) - Math.min(3.5, atrHoursUsed / 25)).toFixed(1))
  );
  const finalCorrelationErrorPct = Math.max(
    1.0,
    Number((baseErrorPct + baseErrorPct * dnaCorrelationModifier).toFixed(1))
  );

  // Solve unified SI physics via M01..M09 facade
  const physics = solveVehiclePhysics(params, {
    ambientTempC,
    componentLevelAvg,
    referenceSpeedKmh: 250,
  });

  const regulatory = validateFia2026Compliance(params, {
    totalMassKg: physics.totalMassKg,
    effectiveMgukPowerKw: physics.effectiveMgukPowerKw,
  });

  const structures = evaluateStructures(params, {
    peakDownforceN: physics.cornerMode.downforceTotalN * 1.4,
    peakCornerLatAccelMs2: 4.2 * 9.80665,
    peakBrakeAccelMs2: 4.8 * 9.80665,
    totalMassKg: physics.totalMassKg,
    shaftPowerW: (physics.effectiveIcePowerKw + physics.effectiveMgukPowerKw) * 1000,
  });

  // 1. CFD Report (derived strictly from M04 outputs)
  const separationZones: string[] = [];
  if (params.diffuserAngleDeg > 11.2) {
    separationZones.push(`Rampa do difusor (${params.diffuserAngleDeg.toFixed(1)}°) — gradiente adverso elevado`);
  }
  if (params.rearWingFlapCornerDeg > 41) {
    separationZones.push(`Flap superior da asa traseira (${params.rearWingFlapCornerDeg}°) em Modo Z`);
  }
  if (params.gearboxLayout === 'voluminous') {
    separationZones.push('Esteira na garganta central por bloqueio da carcaça volumosa');
  }
  if (params.sidepodUndercutPct > 76) {
    separationZones.push('Possível descolamento no undercut agressivo em guinada > 4°');
  }

  const cfd: CfdReportData = {
    pressureMap: {
      frontWingSuctionKpa: Number((-3.1 - (params.frontWingFlapCornerDeg / 40) * 2.4).toFixed(2)),
      floorThroatSuctionKpa: Number((-5.8 - (24 / Math.max(12, params.frontRideHeightMm)) * 2.1).toFixed(2)),
      diffuserExitKpa: Number((-1.2 + (physics.diffuserPressureRecoveryPct / 100) * 0.85).toFixed(2)),
      sidepodStagnationKpa: Number((2.4 + (params.sidepodInletAreaCm2 / 480) * 0.4).toFixed(2)),
    },
    flowVelocityPeakMs: Number((physics.referenceSpeedMs * (1.28 + (physics.diffuserPressureRecoveryPct / 100) * 0.24)).toFixed(1)),
    downforceSplitPct: {
      frontWing: Number((physics.cornerMode.aeroBalanceFrontPct * 0.62).toFixed(1)),
      floor: Number((46 + (physics.diffuserPressureRecoveryPct - 60) * 0.15).toFixed(1)),
      rearWing: Number((100 - physics.cornerMode.aeroBalanceFrontPct * 0.62 - (46 + (physics.diffuserPressureRecoveryPct - 60) * 0.15)).toFixed(1)),
    },
    totalDragN: physics.cornerMode.dragForceN,
    separationZones: separationZones.length > 0 ? separationZones : ['Escoamento aderido em toda a faixa operacional simulada'],
    vorticityIndex: Number((1.8 + (params.floorEdgeComplexity / 100) * 2.4).toFixed(2)),
    rideHeightSensitivityNPerMm: physics.rideHeightSensitivityNPerMm,
    yawSensitivityPct: physics.yawSensitivityPct,
    classification: cfdLevel >= 3 ? 'Simulado' : 'Estimado',
  };

  // 2. FEA Report (directly from M07 CLT & Mesh Convergence)
  const fiber = COMPOSITE_MATERIALS[params.compositeFiber];
  const latestMeshPt = structures.meshConvergence.points[structures.meshConvergence.points.length - 1];
  const fea: FeaReportData = {
    maxVonMisesStressMpa: physics.maxLaminateStressMpa,
    allowableYieldMpa: Math.round(structures.allowables.tensileStrengthMpa),
    maxDeflectionMm: Number((latestMeshPt.maxDeflectionM * 1000).toFixed(2)),
    torsionalStiffnessNmDeg: physics.torsionalStiffnessNmDeg,
    bucklingSafetyFactor: physics.bucklingSafetyFactor,
    firstNaturalModeHz: Number((28 + (physics.torsionalStiffnessNmDeg / 22000) * 14).toFixed(1)),
    estimatedFatigueLifeRaces: physics.fatigueLifeRaces,
    delaminationRiskPct: physics.delaminationRiskPct,
    classification: 'Simulado',
  };

  // 3. Thermal Report (directly from M08/M09)
  const criticalRegions: string[] = [];
  if (physics.iceOperatingTempC > 113) criticalRegions.push(`Bloco/Cabeçote ICE (${physics.iceOperatingTempC}°C)`);
  if (physics.batteryCellTempC > 58) criticalRegions.push(`Células ERS 350kW (${physics.batteryCellTempC}°C)`);
  if (physics.gearboxOilTempC > 125) criticalRegions.push(`Óleo da Transmissão (${physics.gearboxOilTempC}°C)`);
  if (physics.thermalMarginC < 5) criticalRegions.push('Margem térmica crítica sob ar sujo / vácuo');

  const thermal: ThermalReportData = {
    iceTempC: physics.iceOperatingTempC,
    batteryTempC: physics.batteryCellTempC,
    gearboxOilTempC: physics.gearboxOilTempC,
    brakePeakTempC: Math.round(690 + (physics.totalMassKg - 768) * 3.5),
    heatGeneratedKw: physics.totalPuHeatKw,
    coolingCapacityKw: physics.radiatorHeatRejectionKw,
    thermalMarginC: physics.thermalMarginC,
    criticalRegions: criticalRegions.length > 0 ? criticalRegions : ['Nenhuma região acima do limiar térmico de alerta'],
    classification: 'Simulado',
  };

  const getStaffRating = (role: StaffMember['role'], fallback: number) =>
    staff.find((s) => s.role === role)?.rating ?? fallback;
  const getStaffName = (role: StaffMember['role'], fallback: string) =>
    staff.find((s) => s.role === role)?.name ?? fallback;

  const techDirRating = getStaffRating('tech_director', 76);
  const aeroRating = getStaffRating('head_aero', 78);
  const chiefEngRating = getStaffRating('chief_engineer', 75);
  const puRating = getStaffRating('head_pu', 77);
  const sportRating = getStaffRating('sporting_director', 75);

  const calcUncertainty = (comp: number) =>
    Math.max(2.0, Number((finalCorrelationErrorPct * (1.28 - (comp / 100) * 0.55)).toFixed(1)));

  const diagnostics: EngineerDiagnostic[] = [
    {
      specialistRole: 'Diretor Técnico',
      specialistName: getStaffName('tech_director', 'Diretor Técnico Chefe'),
      competenceRating: techDirRating,
      diagnostic: regulatory.compliant
        ? `Projeto global em conformidade FIA 2026 (Massa ${physics.totalMassKg} kg, Balanço ${physics.cornerMode.aeroBalanceFrontPct}% Diant.).`
        : `ALERTA REGULAMENTAR: ${regulatory.violations[0]?.parameter} fora da diretriz ${regulatory.violations[0]?.article}.`,
      physicalHypothesis:
        physics.porpoisingRiskPct > 50
          ? 'Acoplamento aeroelástico entre sucção do assoalho e curso de mola está reduzindo a margem de estabilidade em alta velocidade.'
          : 'A arquitetura integrada mantém coerência entre balanço aerodinâmico, centro de gravidade e rigidez torcional.',
      availableEvidence: `Simulação integrada L/D=${physics.cornerMode.aeroEfficiencyLD} (Modo Z) → ${physics.straightMode.aeroEfficiencyLD} (Modo X); Erro ±${finalCorrelationErrorPct}%.`,
      recommendedSolution: !regulatory.compliant
        ? 'Corrigir os parâmetros fora do envelope FIA 2026 antes de liberar fabricação CAD.'
        : physics.porpoisingRiskPct > 50
        ? 'Elevar altura dianteira em +2 mm ou endurecer molas em +20 N/mm para estabilizar a plataforma.'
        : 'Aprovar pacote atual para validação em pista nos treinos livres.',
      estimatedCostUsd: 850000,
      riskLevel: !regulatory.compliant || physics.porpoisingRiskPct > 65 ? 'Crítico' : physics.porpoisingRiskPct > 45 ? 'Moderado' : 'Baixo',
      uncertaintyPct: calcUncertainty(techDirRating),
      dependencies: ['Assoalho', 'Suspensão', 'Monocoque', 'Unidade de Potência'],
    },
    {
      specialistRole: 'Chefe de Aerodinâmica',
      specialistName: getStaffName('head_aero', 'Chefe de Aerodinâmica'),
      competenceRating: aeroRating,
      diagnostic: `Modo Z gera ${(physics.cornerMode.downforceTotalN / 1000).toFixed(2)} kN @ 250 km/h; Modo X reduz arrasto em ${physics.straightMode.dragReductionPct}%.`,
      physicalHypothesis:
        separationZones.length > 0 && params.diffuserAngleDeg > 11
          ? 'Gradiente adverso de pressão no difusor está provocando descolamento da camada limite (AER-005/018).'
          : 'Recuperação de pressão do difusor e vedação por vórtices operam dentro da zona aderida.',
      availableEvidence: `Recuperação difusor: ${physics.diffuserPressureRecoveryPct}% | Margem de separação: ${physics.separationMarginPct}% | Sensibilidade Yaw: ${physics.yawSensitivityPct}%.`,
      recommendedSolution:
        params.diffuserAngleDeg > 11
          ? 'Reduzir expansão do difusor para 9.5°–10.5° ou ampliar undercut dos sidepods para energizar a rampa traseira.'
          : 'Manter geometria atual do difusor e refinar atuação coordenada dos flaps no Modo X.',
      estimatedCostUsd: 1400000,
      riskLevel: physics.separationMarginPct < 50 ? 'Alto' : 'Baixo',
      uncertaintyPct: calcUncertainty(aeroRating),
      dependencies: ['Layout do Câmbio', 'Undercut dos Sidepods', 'Altura Traseira'],
    },
    {
      specialistRole: 'Chefe de Dinâmica',
      specialistName: getStaffName('chief_engineer', 'Chefe de Dinâmica Veicular'),
      competenceRating: chiefEngRating,
      diagnostic: `Frequência natural ${physics.naturalFrequencyHz} Hz (ζ=${physics.dampingRatio}); pico lateral Pacejka ${(physics.tirePeakLateralN / 1000).toFixed(1)} kN.`,
      physicalHypothesis:
        physics.tireLoadSensitivityLossPct > 8.5
          ? 'Transferência lateral excessiva está saturando o pneu externo (TIR-005), desperdiçando aderência total no eixo.'
          : 'Ganho de cambagem cinemático compensa a rolagem em curva mantendo área de contato uniforme.',
      availableEvidence: `Rolagem @4.2G: ${physics.cornerRollDeg}° | Ganho de cambagem: ${physics.camberGainDegPerMm}°/mm | Janela térmica pneu: ${physics.tireThermalWindowHealthPct}%.`,
      recommendedSolution:
        physics.dampingRatio < 0.35
          ? 'Elevar amortecimento (N·s/m) para suprimir oscilações de heave sem enrijecer demais a barra estabilizadora.'
          : 'Calibrar camber estático para -2.6° e ajustar anti-dive para preservar altura dianteira em frenagem.',
      estimatedCostUsd: 620000,
      riskLevel: physics.tireThermalWindowHealthPct < 75 ? 'Alto' : 'Moderado',
      uncertaintyPct: calcUncertainty(chiefEngRating),
      dependencies: ['Camber & Toe', 'Molas & ARB', 'Rigidez Torcional do Chassi'],
    },
    {
      specialistRole: 'Chefe de Estruturas',
      specialistName: getStaffName('chief_engineer', 'Chefe de Estruturas & FEA'),
      competenceRating: Math.round((techDirRating + chiefEngRating) / 2),
      diagnostic: `Rigidez torcional ${physics.torsionalStiffnessNmDeg.toLocaleString()} N·m/° | Fator de flambagem ${physics.bucklingSafetyFactor}x | Tsai-Wu máx ${structures.failureSummary.worstTsaiWuIndex}.`,
      physicalHypothesis:
        physics.bucklingSafetyFactor < 1.15
          ? 'Painéis finos do monocoque apresentam margem reduzida contra flambagem (STR-005) sob carga combinada.'
          : 'Matrizes CLT [A,B,D] 0°/±45°/90° equilibram rigidez flexional e torcional em série com o câmbio.',
      availableEvidence: `Tensão máx. laminado: ${physics.maxLaminateStressMpa} MPa | Delaminação: ${physics.delaminationRiskPct}% | Impacto FIA: ${physics.impactAbsorptionMarginPct}%.`,
      recommendedSolution:
        physics.delaminationRiskPct > 30
          ? 'Equilibrar lâminas ±45° e 90° no layup ou ampliar reforços locais nos pontos de fixação.'
          : 'Estrutura apta aos testes de impacto e deflexão estática da FIA.',
      estimatedCostUsd: 950000,
      riskLevel: physics.bucklingSafetyFactor < 1.1 || physics.fatigueLifeRaces < 4 ? 'Alto' : 'Baixo',
      uncertaintyPct: calcUncertainty(techDirRating),
      dependencies: ['Laminado CFRP', 'Carcaça do Câmbio', 'Ancoragem PU'],
    },
    {
      specialistRole: 'Chefe de PU',
      specialistName: getStaffName('head_pu', 'Chefe de Unidade de Potência'),
      competenceRating: puRating,
      diagnostic: `Potência efetiva nas rodas: ${physics.totalWheelPowerHp} CV (${physics.totalWheelPowerKw} kW) | Eficiência transmissão: ${physics.transmissionEfficiencyPct}%.`,
      physicalHypothesis:
        physics.batteryJouleLossesKw > 16
          ? 'Corrente elevada no barramento de 800V eleva perdas resistivas I²R, reduzindo eficiência líquida de descarga 350 kW.'
          : 'Casamento térmico ICE (50%) + MGU-K 350 kW (50%) e turbo lag mantêm entrega linear.',
      availableEvidence: `ICE: ${physics.effectiveIcePowerKw} kW | MGU-K: ${physics.effectiveMgukPowerKw} kW | Perdas Joule: ${physics.batteryJouleLossesKw} kW | Lag turbo: ${physics.turboSpoolLagMs} ms.`,
      recommendedSolution:
        physics.batteryJouleLossesKw > 16
          ? 'Reduzir agressividade de deploy ou optar por células de menor resistência interna.'
          : 'Sincronizar relação de marchas com a curva de enchimento do turbo.',
      estimatedCostUsd: 1100000,
      riskLevel: physics.batteryCellTempC > 60 ? 'Alto' : 'Baixo',
      uncertaintyPct: calcUncertainty(puRating),
      dependencies: ['Resistência Interna Bateria', 'Diâmetro do Turbo', 'Eficiência Transmissão'],
    },
    {
      specialistRole: 'Engenheiro Térmico',
      specialistName: 'Eng. Chefe de Termodinâmica',
      competenceRating: Math.round((puRating + aeroRating) / 2),
      diagnostic: `Geração total PU: ${physics.totalPuHeatKw} kW vs Rejeição radiador: ${physics.radiatorHeatRejectionKw} kW | Margem térmica: ${physics.thermalMarginC > 0 ? '+' : ''}${physics.thermalMarginC}°C.`,
      physicalHypothesis:
        physics.thermalMarginC < 4
          ? `Vazão mássica nos sidepods (${physics.massFlowKgS} kg/s) insuficiente para dissipar calor do ICE + I²R em circuitos quentes.`
          : 'Circuito de arrefecimento possui folga convectiva para corrida em vácuo sem derating.',
      availableEvidence: `T_ICE: ${physics.iceOperatingTempC}°C | T_Bateria: ${physics.batteryCellTempC}°C | T_Óleo Câmbio: ${physics.gearboxOilTempC}°C | Arrasto térmico: ${physics.coolingDragN} N.`,
      recommendedSolution:
        physics.thermalMarginC < 5
          ? 'Ampliar entrada dos sidepods em +25 cm² e abrir saída traseira de ar quente para eliminar estrangulamento.'
          : 'É possível fechar levemente os dutos (-10 cm²) para economizar arrasto em pistas frias.',
      estimatedCostUsd: 480000,
      riskLevel: physics.thermalMarginC < 2 ? 'Crítico' : physics.thermalMarginC < 6 ? 'Moderado' : 'Baixo',
      uncertaintyPct: calcUncertainty((puRating + aeroRating) / 2),
      dependencies: ['Sidepods', 'Radiadores', 'Saída de Ar Quente', 'Temperatura Ambiente'],
    },
    {
      specialistRole: 'Engenheiro de Materiais',
      specialistName: getStaffName('sporting_director', 'Eng. de Materiais & Manufatura'),
      competenceRating: sportRating,
      diagnostic: `Fibra ${fiber.name.split(' ')[1]} + Carcaça Câmbio ${params.gearboxMaterial.toUpperCase()} | Vida útil: ${physics.fatigueLifeRaces} GPs.`,
      physicalHypothesis:
        params.gearboxMaterial === 'carbon'
          ? 'Carcaça em CFRP reduz massa (-8 kg), porém alta fragilidade à fratura eleva risco em impactos traseiros.'
          : params.gearboxMaterial === 'aluminum'
          ? 'Alumínio possui menor razão de fadiga, exigindo maior largura de dentes ou cautela sobre zebras.'
          : 'Titânio 3D Ti-6Al-4V equilibra resistência à fadiga e tolerância térmica apesar da densidade maior.',
      availableEvidence: `Massa total: ${physics.totalMassKg} kg | Margem impacto: ${physics.impactAbsorptionMarginPct}% | Manutenção garagem: ${physics.maintenanceTurnaroundPenaltyMin > 0 ? `+${physics.maintenanceTurnaroundPenaltyMin}` : physics.maintenanceTurnaroundPenaltyMin} min.`,
      recommendedSolution:
        params.compositeFiber === 'm40j' && physics.delaminationRiskPct > 28
          ? 'Combinar reforços locais em T1000G nas bordas e furos para evitar propagação de trincas.'
          : 'Especificação de materiais validada para lote de manufatura e inspeção NDT.',
      estimatedCostUsd: 700000,
      riskLevel: physics.fatigueLifeRaces < 4 || physics.impactAbsorptionMarginPct < 88 ? 'Alto' : 'Baixo',
      uncertaintyPct: calcUncertainty(sportRating),
      dependencies: ['Layup 0°/±45°/90°', 'Liga do Câmbio', 'Largura dos Dentes'],
    },
  ];

  const checklist: EngineeringChecklistItem[] = [
    { id: 1, criterion: 'Definição física e funcional', passed: true, detail: `Componente ${componentType.toUpperCase()} acoplado à cadeia energética M01–M12.` },
    { id: 2, criterion: 'Parâmetros geométricos / funcionamento', passed: true, detail: 'Dimensões em mm, cm², graus, N/mm e correntes configuráveis.' },
    { id: 3, criterion: 'Unidades e intervalos válidos (SI)', passed: true, detail: 'Cálculo interno estrito em kg, m, m/s, N, W, Pa, K e J.' },
    { id: 4, criterion: 'Fenômenos físicos associados', passed: true, detail: 'Mapeado para catálogo AER / FLU / THE / STR / DYN / TIR.' },
    { id: 5, criterion: 'Equações ou modelos matemáticos', passed: true, detail: 'Continuidade, Bernoulli, Fz, P=I²R, CLT [A,B,D] e Pacejka combinada.' },
    { id: 6, criterion: 'Fontes técnicas documentadas', passed: true, detail: 'NASA Glenn, Milliken, Pacejka, Jones CLT, NIST, OpenFOAM/CalculiX.' },
    { id: 7, criterion: 'Efeitos positivos e negativos', passed: true, detail: 'Todo ganho gera contrapartida térmica, estrutural, de arrasto ou massa.' },
    { id: 8, criterion: 'Dependências entre componentes', passed: true, detail: 'Acoplamento forte entre PU, câmbio, chassi, suspensão, assoalho e asas.' },
    { id: 9, criterion: 'Limitações e restrições regulamentares', passed: regulatory.compliant, detail: regulatory.compliant ? 'Conforme edição FIA 2026 ativa.' : `Violação detectada: ${regulatory.violations[0]?.parameter}` },
    { id: 10, criterion: 'Modelo de simulação definido', passed: true, detail: 'Relatórios CFD, FEA CLT e balanço térmico executados.' },
    { id: 11, criterion: 'Critérios de validação', passed: physics.thermalMarginC >= 0 && physics.bucklingSafetyFactor >= 1.0, detail: `Margem térmica ${physics.thermalMarginC}°C · Flambagem ${physics.bucklingSafetyFactor}x.` },
    { id: 12, criterion: 'Representação adequada na interface', passed: true, detail: 'Parâmetros configurados separados de resultados simulados e incerteza.' },
  ];

  const checklistScore = checklist.filter((c) => c.passed).length;

  const consequenceChain: string[] = [
    `Geometria & Aero: Modo Z gera ${(physics.cornerMode.downforceTotalN / 1000).toFixed(2)} kN (L/D ${physics.cornerMode.aeroEfficiencyLD}) → Modo X corta arrasto em ${physics.straightMode.dragReductionPct}%.`,
    `Dinâmica: Carga vertical exige suspensão a ${physics.naturalFrequencyHz} Hz (ζ=${physics.dampingRatio}); sensibilidade à altura em ${physics.rideHeightSensitivityNPerMm} N/mm.`,
    `Estruturas: Rigidez em série ${physics.torsionalStiffnessNmDeg.toLocaleString()} N·m/° com massa de ${physics.totalMassKg} kg e fator de flambagem ${physics.bucklingSafetyFactor}x.`,
    `Térmica: Fluxo de ${physics.massFlowKgS} kg/s rejeita ${physics.radiatorHeatRejectionKw} kW frente a ${physics.totalPuHeatKw} kW gerados (Joule ERS ${physics.batteryJouleLossesKw} kW) → margem ${physics.thermalMarginC}°C.`,
    `Pneus: Magic Formula estima pico lateral de ${(physics.tirePeakLateralN / 1000).toFixed(1)} kN com janela térmica de ${physics.tireThermalWindowHealthPct}% e desgaste x${physics.tireWearRateMultiplier}.`,
  ];

  const approved =
    regulatory.compliant &&
    physics.thermalMarginC >= 0 &&
    physics.bucklingSafetyFactor >= 1.0 &&
    physics.porpoisingRiskPct < 75;

  return {
    timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    componentType,
    approved,
    atrHoursUsed,
    baseCorrelationErrorPct: baseErrorPct,
    finalCorrelationErrorPct,
    dnaModifierPct: Number((dnaCorrelationModifier * 100).toFixed(0)),
    physics,
    regulatory,
    cfd,
    fea,
    thermal,
    diagnostics,
    checklist,
    checklistScore,
    consequenceChain,
  };
}
