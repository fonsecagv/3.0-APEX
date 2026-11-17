import { COMPOSITE_MATERIALS } from '../data/physicsDatabase.ts';
import type { StaffMember } from '../types/f1.ts';
import type { VehicleEngineeringParameters } from '../types/physics.ts';
import { VEHICLE_PHILOSOPHIES_M02, type VehiclePhilosophyCode } from './modules/m02Philosophy.ts';
import type { PackagingAnalysisOutputs } from './modules/m03Packaging.ts';
import type { AeroOutputs } from './modules/m04Aerodynamics.ts';
import type { VehicleDynamicsOutputs } from './modules/m05VehicleDynamics.ts';
import type { TireSimulationOutputs } from './modules/m06Tires.ts';
import type { StructuralOutputs } from './modules/m07Structures.ts';
import type { PowerUnitOutputs } from './modules/m08PowerUnit.ts';

export type ScopeAlignmentStatus = 'aligned' | 'moderate_conflict' | 'critical_conflict';

export type SpeakerTone = 'positive' | 'caution' | 'angry';

export interface BoardSpeakerFeedback {
  roleLabel: string;
  speakerName: string;
  tone: SpeakerTone;
  quote: string;
}

export interface Phase7ScopeFeedback {
  subStep: 'packaging' | 'monocoque' | 'dynamics';
  targetPhilosophyCode: VehiclePhilosophyCode;
  targetPhilosophyName: string;
  status: ScopeAlignmentStatus;
  statusLabel: string;
  speakers: BoardSpeakerFeedback[];
  impactSummary: string;
  aeroSeverity: SpeakerTone;
}

export interface Phase7FeedbackInputs {
  philosophyCode: VehiclePhilosophyCode;
  sidepodConcept: 'downwash' | 'conventional' | 'zeropod';
  params: VehicleEngineeringParameters;
  packaging: PackagingAnalysisOutputs;
  aeroCorner: AeroOutputs;
  aeroStraight: AeroOutputs;
  dynamics: VehicleDynamicsOutputs;
  tireCorner: TireSimulationOutputs;
  structures: StructuralOutputs;
  powerUnit: PowerUnitOutputs;
  headAero?: Pick<StaffMember, 'name' | 'rating'> | null;
  headPU?: Pick<StaffMember, 'name' | 'rating'> | null;
  sportingDirector?: Pick<StaffMember, 'name' | 'rating'> | null;
  chiefMechanic?: Pick<StaffMember, 'name' | 'rating'> | null;
}

/**
 * Custo industrial estimado do conjunto Monocoque + Célula de Sobrevivência CFRP (Fase 7.3).
 * Reflete custo específico da fibra Torayca (T800S / T1000G / M40J), espessura e reforços locais.
 */
export function computeMonocoqueChassisCostUsd(
  params: Pick<
    VehicleEngineeringParameters,
    'compositeFiber' | 'laminateThicknessMm' | 'localReinforcementPct'
  >
): number {
  const mat = COMPOSITE_MATERIALS[params.compositeFiber] ?? COMPOSITE_MATERIALS.t800;
  const fiberBaseMultiplier =
    params.compositeFiber === 'm40j'
      ? 2.2
      : params.compositeFiber === 't1000'
      ? 1.55
      : 1.0;
  const baseUsd = 2_400_000 * fiberBaseMultiplier;
  const thicknessUsd = Math.max(0, params.laminateThicknessMm - 2.4) * 380_000;
  const reinforcementUsd = Math.max(0, params.localReinforcementPct - 10) * 18_000;
  const materialFactor = mat.costPerKgUsd / 420;
  return Math.round((baseUsd + thicknessUsd + reinforcementUsd * materialFactor) / 50_000) * 50_000;
}

export function evaluatePhase7ScopeAlignment(
  subStep: 'packaging' | 'monocoque' | 'dynamics',
  input: Phase7FeedbackInputs
): Phase7ScopeFeedback {
  const philSpec = VEHICLE_PHILOSOPHIES_M02[input.philosophyCode] ?? VEHICLE_PHILOSOPHIES_M02.aero_efficiency;
  const targetPhilosophyName = philSpec.name;

  const aeroName = input.headAero?.name || 'Chefe de Aero';
  const puName = input.headPU?.name || 'Chefe de PU';
  const directorName = input.sportingDirector?.name || 'Chefe de Operações';
  const mechName = input.chiefMechanic?.name || 'Chefe Mecânico';

  const { params, packaging, aeroCorner, dynamics, tireCorner, structures, powerUnit } = input;

  // =========================================================================
  // TELA 2/4 — PACKAGING 3D, MASSA, CG & REFRIGERAÇÃO (M03)
  // =========================================================================
  if (subStep === 'packaging') {
    const cgHeightMm = packaging.cgM.z * 1000;
    const baselineCgMm = 292.0;
    const cgDeltaMm = cgHeightMm - baselineCgMm;
    const thermalMarginC = powerUnit.thermalAndLubrication.thermalMarginK;
    const hasCollision = packaging.interferences.some((i) => i.hasCollision);
    const hasViolation = packaging.envelopeViolations.length > 0;
    const inletArea = params.sidepodInletAreaCm2;
    const undercut = params.sidepodUndercutPct;

    // Cooling drag & downforce trade-off relative to baseline 335 cm²
    const coolingDragDeltaPct = Number((((inletArea - 335) / 335) * 9.5).toFixed(1));
    const downforceDeltaPct = Number(
      (((undercut - 65) * 0.14) - Math.max(0, (inletArea - 350) * 0.04)).toFixed(1)
    );

    const wantsHighDfOrEff =
      input.philosophyCode === 'high_downforce' || input.philosophyCode === 'aero_efficiency';
    const wantsLowDrag = input.philosophyCode === 'low_drag';

    let status: ScopeAlignmentStatus = 'aligned';
    let aeroTone: SpeakerTone = 'positive';
    let puTone: SpeakerTone = 'positive';

    if (hasCollision || hasViolation || thermalMarginC < 1.5 || packaging.totalMassKg < 768) {
      status = 'critical_conflict';
      aeroTone = hasCollision || hasViolation ? 'angry' : 'caution';
      puTone = thermalMarginC < 1.5 || packaging.totalMassKg < 768 ? 'angry' : 'caution';
    } else if (
      thermalMarginC < 6.0 ||
      cgDeltaMm > 3.5 ||
      (wantsHighDfOrEff && input.sidepodConcept === 'conventional' && undercut < 52) ||
      (wantsLowDrag && inletArea > 375)
    ) {
      status = 'moderate_conflict';
      if ((wantsHighDfOrEff && undercut < 52) || (wantsLowDrag && inletArea > 375) || thermalMarginC < 5.0) {
        aeroTone = 'caution';
      }
      if (thermalMarginC < 6.0 || cgDeltaMm > 3.5) {
        puTone = 'caution';
      }
    }

    const sidepodTitle =
      input.sidepodConcept === 'downwash'
        ? 'Downwash'
        : input.sidepodConcept === 'zeropod'
        ? 'Zero-Pod Slim'
        : 'Undercut Amplo';

    let aeroQuote = '';
    if (hasCollision) {
      aeroTone = 'angry';
      aeroQuote = `"Chefe, detectamos colisão volumétrica no packaging 3D! Precisamos corrigir as interferências antes de fechar a carenagem do sidepod ${sidepodTitle}."`;
    } else if (wantsLowDrag && inletArea > 375) {
      aeroTone = 'angry';
      aeroQuote = `"Nosso escopo é ${targetPhilosophyName}, mas essa admissão de ${inletArea} cm² gera ${coolingDragDeltaPct > 0 ? `+${coolingDragDeltaPct}%` : `${coolingDragDeltaPct}%`} de arrasto extra. Precisamos fechar os dutos!"`;
    } else if (wantsHighDfOrEff && input.sidepodConcept === 'conventional' && undercut < 52) {
      aeroTone = 'caution';
      aeroQuote = `"O sidepod ${sidepodTitle} garante refrigeração, mas o undercut de ${undercut}% é tímido demais para ${targetPhilosophyName}. Vamos perder carga no assoalho traseiro."`;
    } else if (thermalMarginC < 5.5) {
      aeroTone = 'caution';
      aeroQuote = `"Chefe, o sidepod ${sidepodTitle} (undercut ${undercut}%) ficou excelente para o fluxo de ar, mas a refrigeração está no limite (margem ${thermalMarginC.toFixed(1)}°C). Se não abrirmos as entradas (${inletArea} cm²), a PU vai sofrer derating."`;
    } else {
      aeroQuote = `"Excelente casamento com ${targetPhilosophyName}: o sidepod ${sidepodTitle} com undercut de ${undercut}% limpa a esteira do difusor mantendo a admissão enxuta em ${inletArea} cm²."`;
    }

    let puQuote = '';
    if (packaging.totalMassKg < 768) {
      puTone = 'angry';
      puQuote = `"Atenção: massa total em ${packaging.totalMassKg.toFixed(1)} kg está abaixo do mínimo FIA de 768.0 kg. Precisamos de lastro no assoalho para não tomar DSQ!"`;
    } else if (thermalMarginC < 1.5) {
      puTone = 'angry';
      puQuote = `"Alerta térmico! Com margem de apenas ${thermalMarginC.toFixed(1)}°C e radiador de ${params.radiatorVolumeL.toFixed(1)} L, o ICE e a bateria vão cortar potência (derating) em corrida."`;
    } else if (cgDeltaMm > 3.5) {
      puTone = 'caution';
      puQuote = `"A massa total de ${packaging.totalMassKg.toFixed(1)} kg está ótima, mas a altura do CG subiu +${cgDeltaMm.toFixed(1)} mm (${cgHeightMm.toFixed(1)} mm) com esse layout. Vai afetar a estabilidade nas curvas rápidas."`;
    } else {
      puQuote = `"Massa total controlada em ${packaging.totalMassKg.toFixed(1)} kg, balanço ${packaging.staticAxleDist.frontPct.toFixed(1)}%/${packaging.staticAxleDist.rearPct.toFixed(1)}% e CG baixo (${cgHeightMm.toFixed(1)} mm) com margem térmica segura de +${thermalMarginC.toFixed(1)}°C."`;
    }

    const dfText = `${downforceDeltaPct >= 0 ? '+' : ''}${downforceDeltaPct}% Downforce`;
    const dragText = `${coolingDragDeltaPct >= 0 ? '+' : ''}${coolingDragDeltaPct}% Arrasto (Refrigeração)`;
    const thermalText = `Margem Térmica ${thermalMarginC >= 0 ? '+' : ''}${thermalMarginC.toFixed(1)}°C`;

    return {
      subStep: 'packaging',
      targetPhilosophyCode: input.philosophyCode,
      targetPhilosophyName,
      status,
      statusLabel:
        status === 'aligned'
          ? 'ALINHAMENTO PERFEITO'
          : status === 'moderate_conflict'
          ? 'ATENÇÃO - CONFLITO MODERADO'
          : 'CONFLITO CRÍTICO DE ESCOPO',
      speakers: [
        { roleLabel: 'Chefe de Aero', speakerName: aeroName, tone: aeroTone, quote: aeroQuote },
        { roleLabel: 'Chefe de PU', speakerName: puName, tone: puTone, quote: puQuote },
      ],
      impactSummary: `${dfText} | ${dragText} | ${thermalText}`,
      aeroSeverity: aeroTone,
    };
  }

  // =========================================================================
  // TELA 3/4 — MONOCOQUE CFRP & AERO ATIVA X/Z (M07 + M04)
  // =========================================================================
  if (subStep === 'monocoque') {
    const rakeMm = params.rearRideHeightMm - params.frontRideHeightMm;
    const rwCorner = params.rearWingFlapCornerDeg;
    const fwCorner = params.frontWingFlapCornerDeg;
    const diffuserDeg = params.diffuserAngleDeg;
    const porpoising = aeroCorner.sensitivities.porpoisingRiskPct;
    const tsaiWu = structures.failureSummary.worstTsaiWuIndex;
    const chassisCostUsd = computeMonocoqueChassisCostUsd(params);

    const wantsHighDf =
      input.philosophyCode === 'high_downforce' ||
      input.philosophyCode === 'aero_efficiency' ||
      input.philosophyCode === 'mechanical_grip';
    const wantsLowDrag = input.philosophyCode === 'low_drag';

    // Detect explicit conflict with Phase 4 promise
    const lowWingForHighDf = wantsHighDf && (rwCorner < 31 || fwCorner < 25 || diffuserDeg < 9.0);
    const highWingForLowDrag = wantsLowDrag && (rwCorner > 36 || fwCorner > 32);
    const extremePorpoising = porpoising > 55;
    const structuralFail = tsaiWu >= 1.0 || structures.failureSummary.minBucklingFactor < 1.15;

    let status: ScopeAlignmentStatus = 'aligned';
    let aeroTone: SpeakerTone = 'positive';
    let directorTone: SpeakerTone = 'positive';

    if (lowWingForHighDf || highWingForLowDrag || structuralFail || extremePorpoising) {
      status =
        structuralFail || extremePorpoising || (wantsHighDf && rwCorner < 28) || (wantsLowDrag && rwCorner > 39)
          ? 'critical_conflict'
          : 'moderate_conflict';
      aeroTone =
        lowWingForHighDf || highWingForLowDrag || extremePorpoising ? 'angry' : 'caution';
    } else if (rwCorner >= 38 && !wantsLowDrag) {
      status = 'moderate_conflict';
      directorTone = 'caution';
    } else if (params.compositeFiber === 'm40j' && chassisCostUsd >= 5_000_000) {
      directorTone = 'caution';
    }

    let aeroQuote = '';
    if (lowWingForHighDf) {
      aeroTone = 'angry';
      aeroQuote = `"Inaceitável! Prometemos ${targetPhilosophyName} na Fase 4, mas com asa traseira em ${rwCorner}° (diant. ${fwCorner}°) e difusor a ${diffuserDeg.toFixed(1)}° estamos jogando carga aerodinâmica fora! Suba esses ângulos!"`;
    } else if (highWingForLowDrag) {
      aeroTone = 'angry';
      aeroQuote = `"Contradição total com o escopo ${targetPhilosophyName}! Asa traseira a ${rwCorner}° e dianteira a ${fwCorner}° criam uma parede de arrasto nas retas (Cd ${aeroCorner.forces.cdTotal.toFixed(2)}). Baixe as asas!"`;
    } else if (extremePorpoising) {
      aeroTone = 'angry';
      aeroQuote = `"Perigo de estol no assoalho! Altura de ${params.frontRideHeightMm}mm com difusor em ${diffuserDeg.toFixed(1)}° elevou o porpoising para ${porpoising.toFixed(0)}%. O carro vai quicar no fim das retas."`;
    } else if (wantsLowDrag) {
      aeroQuote = `"No alvo para ${targetPhilosophyName}! Rake enxuto de ${rakeMm}mm, difusor a ${diffuserDeg.toFixed(1)}° e asa traseira em ${rwCorner}° (Modo X ${params.rearWingFlapStraightDeg}°) deixam o carro liso nas retas (L/D ${aeroCorner.forces.aeroEfficiencyLD.toFixed(2)})."`;
    } else {
      aeroQuote = `"Perfeito! O rake de ${rakeMm}mm e o difusor a ${diffuserDeg.toFixed(1)}° vão sugar o carro para o asfalto. Asa dianteira (${fwCorner}°) e traseira (${rwCorner}°) entregam Cl ${aeroCorner.forces.clTotal.toFixed(2)} alinhado a ${targetPhilosophyName}."`;
    }

    let directorQuote = '';
    if (structuralFail) {
      directorTone = 'angry';
      directorQuote = `"Alerta vermelho de homologação FIA! Índice Tsai-Wu em ${tsaiWu.toFixed(2)} (flambagem λ=${structures.failureSummary.minBucklingFactor.toFixed(2)}). Aumente a espessura do laminado (${params.laminateThicknessMm.toFixed(1)}mm) antes do crash test."`;
    } else if (rwCorner >= 37) {
      directorTone = 'caution';
      directorQuote = `"Atenção: asa traseira a ${rwCorner}° gera arrasto elevado (Cd ${aeroCorner.forces.cdTotal.toFixed(2)}). Nas retas de Monza e Las Vegas, vamos sofrer ultrapassagens para carros de Low Drag mesmo com Modo X."`;
    } else if (params.compositeFiber === 'm40j' || chassisCostUsd >= 5_000_000) {
      directorTone = 'caution';
      directorQuote = `"Monocoque em ${params.compositeFiber.toUpperCase()} (${params.laminateThicknessMm.toFixed(1)}mm) dá rigidez top (${structures.stiffnessMetrics.torsionalStiffnessNmPerDeg} N·m/°), mas consome $${(chassisCostUsd / 1e6).toFixed(1)}M do caixa e teto de gastos."`;
    } else {
      directorQuote = `"Laminado ${params.compositeFiber.toUpperCase()} (${params.laminateThicknessMm.toFixed(1)}mm · $${(chassisCostUsd / 1e6).toFixed(1)}M) aprova o Gate 07 com folga (Tsai-Wu ${tsaiWu.toFixed(2)}) sem explodir o orçamento."`;
    }

    return {
      subStep: 'monocoque',
      targetPhilosophyCode: input.philosophyCode,
      targetPhilosophyName,
      status,
      statusLabel:
        status === 'aligned'
          ? 'ALINHAMENTO PERFEITO'
          : status === 'moderate_conflict'
          ? 'ATENÇÃO - CONFLITO MODERADO'
          : 'CONFLITO CRÍTICO DE ESCOPO',
      speakers: [
        { roleLabel: 'Chefe de Aero', speakerName: aeroName, tone: aeroTone, quote: aeroQuote },
        { roleLabel: 'Diretoria & Gestão', speakerName: directorName, tone: directorTone, quote: directorQuote },
      ],
      impactSummary: `Cl ${aeroCorner.forces.clTotal.toFixed(2)} | Cd ${aeroCorner.forces.cdTotal.toFixed(2)} (L/D ${aeroCorner.forces.aeroEfficiencyLD.toFixed(2)}) | Porpoising ${porpoising.toFixed(0)}% | Monocoque $${(chassisCostUsd / 1e6).toFixed(1)}M`,
      aeroSeverity: aeroTone,
    };
  }

  // =========================================================================
  // TELA 4/4 — SUSPENSÃO, PNEUS & OTIMIZAÇÃO MDO (M05 + M06 + M10)
  // =========================================================================
  const springNmm = params.springRateNmm;
  const damperNsM = params.damperNsM;
  const arbNmm = params.antiRollBarNmm;
  const camberDeg = params.staticCamberDeg;
  const downforceN = aeroCorner.forces.downforceTotalN;
  const dampingRatio = dynamics.suspensionResponse.dampingRatioFront;
  const wearRatePct = (tireCorner.degradationStates.abrasiveWearDelta * 100 + tireCorner.degradationStates.thermalDegradation01 * 2.2);
  const treadTempC = tireCorner.thermalNodes.tempTreadAvgK - 273.15;

  const highAeroLoad = downforceN >= 14500 || input.philosophyCode === 'high_downforce' || input.philosophyCode === 'aero_efficiency';
  const tooSoftForAero = highAeroLoad && (springNmm < 245 || damperNsM < 4500);
  const tooStiffForMechanical =
    (input.philosophyCode === 'mechanical_grip' || input.philosophyCode === 'stable_platform') &&
    (springNmm > 285 || arbNmm > 110);
  const excessiveTireStress =
    springNmm >= 295 || arbNmm >= 115 || Math.abs(camberDeg) >= 3.1 || treadTempC > 116;

  let status: ScopeAlignmentStatus = 'aligned';
  let aeroTone: SpeakerTone = 'positive';
  let mechTone: SpeakerTone = 'positive';

  if (tooSoftForAero && (springNmm < 205 || aeroCorner.sensitivities.porpoisingRiskPct > 55)) {
    status = 'critical_conflict';
    aeroTone = 'angry';
  } else if (tooSoftForAero || tooStiffForMechanical || excessiveTireStress) {
    status = 'moderate_conflict';
    if (tooSoftForAero || tooStiffForMechanical) aeroTone = 'caution';
    if (excessiveTireStress) mechTone = 'caution';
  }

  let aeroQuote = '';
  if (tooSoftForAero) {
    aeroTone = springNmm < 205 ? 'angry' : 'caution';
    aeroQuote = `"Chefe, a mola de ${springNmm} N/mm e o amortecedor de ${damperNsM} N·s/m estão muito moles para o nosso nível de Downforce (${Math.round(downforceN)} N). O chassi vai rolar/ceder demais e o assoalho vai perder eficiência (estol). Precisamos endurecer."`;
  } else if (tooStiffForMechanical) {
    aeroTone = 'caution';
    aeroQuote = `"Para o escopo ${targetPhilosophyName}, mola em ${springNmm} N/mm com ARB em ${arbNmm} N/mm trava demais a plataforma sobre zebras e reduz o contato em baixa velocidade."`;
  } else {
    aeroQuote = `"Plataforma controlada (ζ=${dampingRatio.toFixed(2)}, K=${springNmm} N/mm): a altura dinâmica do assoalho se mantém estável sob ${Math.round(downforceN)} N de carga, honrando o projeto ${targetPhilosophyName}."`;
  }

  let mechQuote = '';
  if (excessiveTireStress) {
    mechTone = 'caution';
    mechQuote = `"Cuidado! Com mola em ${springNmm} N/mm, ARB ${arbNmm} N/mm e camber ${camberDeg.toFixed(1)}°, o carro vai superaquecer os pneus dianteiros (${treadTempC.toFixed(0)}°C) em poucas voltas. Precisamos achar um equilíbrio."`;
  } else if (tooSoftForAero) {
    mechTone = 'caution';
    mechQuote = `"Aderência mecânica em baixa está dócil, mas se endurecermos acima de 295 N/mm para segurar o assoalho, os pneus dianteiros vão degradar rápido. Vamos buscar o meio-termo."`;
  } else {
    mechQuote = `"Geometria ${params.frontSuspensionType.toUpperCase()}/${params.rearSuspensionType.toUpperCase()} com camber ${camberDeg.toFixed(1)}° mantém a banda de rodagem na janela ideal (${treadTempC.toFixed(0)}°C) com pico lateral de ${Math.round(tireCorner.forcesAndMoments.fyPeakN)} N."`;
  }

  const mechGripPct = Math.round((tireCorner.degradationStates.effectiveGripMultiplier - 1) * 100 - (tooStiffForMechanical ? 5 : 0));
  const tireRiskText = excessiveTireStress
    ? 'Alto Desgaste de Pneus (Estratégia de 1 parada em risco)'
    : tooSoftForAero
    ? 'Risco de Estol Aerodinâmico em Curvas Rápidas'
    : 'Desgaste Controlado (Janela 1-2 Paradas Viável)';

  return {
    subStep: 'dynamics',
    targetPhilosophyCode: input.philosophyCode,
    targetPhilosophyName,
    status,
    statusLabel:
      status === 'aligned'
        ? 'ALINHAMENTO PERFEITO'
        : status === 'moderate_conflict'
        ? 'ATENÇÃO - PLATAFORMA INSTÁVEL'
        : 'CONFLITO CRÍTICO DE PLATAFORMA',
    speakers: [
      { roleLabel: 'Chefe de Aero', speakerName: aeroName, tone: aeroTone, quote: aeroQuote },
      { roleLabel: 'Chefe Mecânico', speakerName: mechName, tone: mechTone, quote: mechQuote },
    ],
    impactSummary: `${mechGripPct >= 0 ? `+${mechGripPct}%` : `${mechGripPct}%`} Aderência Mecânica | Temp. Banda ${treadTempC.toFixed(0)}°C | ${tireRiskText}`,
    aeroSeverity: aeroTone,
  };
}
