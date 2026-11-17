import type { VehicleEngineeringParameters } from '../types/physics';
import type { FuelPartnerId } from '../types/f1';
import { FIA_2026_DEFAULT_EDITION } from '../engine/modules/m03Packaging';
import { evaluatePowerUnit, type PowerUnitOutputs } from '../engine/modules/m08PowerUnit';
import { ICE_METALLURGY_2026, resolveIceMetallurgyId } from '../data/puMaterials2026';

export interface EnduranceLapPoint {
  lap: number;
  iceTempC: number;
  waterTempC: number;
  batTempC: number;
  powerCv: number;
  derated: boolean;
}

export interface Endurance1000LapReport {
  points: EnduranceLapPoint[];
  peakPowerCv: number;
  endPowerCv: number;
  peakIceTempC: number;
  peakWaterTempC: number;
  peakBatTempC: number;
  overheatLap: number | null;
  passed: boolean;
  summaryText: string;
  recommendation: string;
}

export interface PuStarRatings {
  icePowerStars: number; // 1..5
  icePowerLabel: string;
  reliabilityStars: number; // 1..5
  reliabilityLabel: string;
  fuelEfficiencyStars: number; // 1..5
  fuelEfficiencyLabel: string;
}

export interface BoardroomPuVerdict {
  puChiefName: string;
  aeroChiefName: string;
  puChiefQuote: string;
  aeroChiefQuote: string;
  puAlignmentPct: number;
  aeroAlignmentPct: number;
  chassisRdDelayNote: string;
}

export interface PuMaturityRiskAnalysis {
  isYear1Project: boolean;
  engineOrigin: 'customer' | 'bought_factory' | 'phoenix';
  factoryFloorLabel: string;
  rawUncappedPowerScore: number;
  year1MaturityPenaltyPts: number;
  developmentCeilingPct: number;
  coolingAeroPenaltyPct: number;
  estimatedSeasonDnfs24Races: string;
  extraMaintenanceCostAnnualM: number;
  year1GridComparison: Array<{
    label: string;
    score: number;
    tier: 'works_top' | 'player' | 'year1_rookie';
  }>;
  summaryWarning: string;
}

export interface NormalizedOfficialPuCard {
  powerScore: number;
  reliabilityScore: number;
  fuelEfficiencyScore: number;
  ersManagementScore: number;
  lightweightScore: number;
  totalPowerCv: number;
  totalWeightKg: number;
  pros: string[];
  cons: string[];
  chassisCompatibility: string;
  dnaBadge: string;
  riskAnalysis: PuMaturityRiskAnalysis;
}

/**
 * Simula 1000 voltas de carga sustentada em bancada sobre o modelo M08 real,
 * capturando degradação cíclica de bateria, fadiga térmica de compressão/turbo
 * e ponto de perda de potência (derating).
 */
export function simulateEndurance1000Laps(
  vehicleParams: VehicleEngineeringParameters,
  options?: {
    reliabilityBonusPct?: number;
    thirdPartyErsPenaltyPct?: number;
  }
): Endurance1000LapReport {
  const checkpoints = [1, 50, 100, 200, 350, 500, 650, 800, 900, 1000];
  const compRatio = vehicleParams.iceCompressionRatio;
  const turboDiam = vehicleParams.turboDiameterMm;
  const rInt = vehicleParams.batteryInternalResistanceMOhm;
  const relBonus = options?.reliabilityBonusPct ?? 0;
  const thirdPartyPenalty = options?.thirdPartyErsPenaltyPct ?? 0;

  // Fator de acúmulo térmico progressivo em teste contínuo sem parada de box
  const compThermalStress = Math.max(0, (compRatio - 15.1) * 7.2);
  const turboThermalStress = Math.max(0, (turboDiam - 92) * 0.45);
  const rIntThermalStress = Math.max(0, (rInt - 13) * 0.55);
  const coolingBonus = Math.max(-2, (vehicleParams.radiatorVolumeL - 12.5) * 0.65);

  const points: EnduranceLapPoint[] = [];
  let overheatLap: number | null = null;
  let peakPowerCv = 0;
  let peakIceTempC = 0;
  let peakWaterTempC = 0;
  let peakBatTempC = 0;

  for (const lap of checkpoints) {
    const progress = lap / 1000;
    const pu = evaluatePowerUnit(
      vehicleParams,
      {
        rpm: 11600,
        throttleRatio: 1.0,
        vehicleSpeedMs: 75,
        ambientTempK: 298.15 + progress * 3.5,
        airPressurePa: 101325,
        initialSoc01: 0.72,
        cycleDurationS: 5.0,
        regenPowerCommandW: 110000,
        deployCommandRatio: Math.max(0.85, Math.min(1.0, vehicleParams.ersDeployBiasPct / 70)),
        cumulativeRaceCycles: lap * 12,
      },
      FIA_2026_DEFAULT_EDITION
    );

    const thermalSoakIce =
      progress * (compThermalStress + turboThermalStress + thirdPartyPenalty * 0.25 - coolingBonus - relBonus * 0.15);
    const thermalSoakBat = progress * (rIntThermalStress + (vehicleParams.ersDeployBiasPct > 65 ? 3.5 : 0));

    const iceTempC = Math.round((pu.thermalAndLubrication.iceTempK - 273.15 + Math.max(0, thermalSoakIce)) * 10) / 10;
    const waterTempC = Math.round((iceTempC - 6.5 + Math.max(0, thermalSoakIce * 0.35)) * 10) / 10;
    const batTempC = Math.round((pu.thermalAndLubrication.batteryTempK - 273.15 + Math.max(0, thermalSoakBat)) * 10) / 10;

    const derated = pu.thermalAndLubrication.derateApplied || iceTempC >= 117.5 || batTempC >= 69.5;
    const rawCv = (pu.totalShaftOutput.crankshaftTotalPowerW / 1000) * 1.34102209;
    const enduranceDeratePenalty = derated ? Math.max(0.88, 1 - Math.max(0, iceTempC - 116) * 0.015) : 1;
    const powerCv = Math.round(rawCv * enduranceDeratePenalty);

    if (powerCv > peakPowerCv) peakPowerCv = powerCv;
    if (iceTempC > peakIceTempC) peakIceTempC = iceTempC;
    if (waterTempC > peakWaterTempC) peakWaterTempC = waterTempC;
    if (batTempC > peakBatTempC) peakBatTempC = batTempC;

    if (derated && overheatLap === null) {
      overheatLap = lap === 1 ? 10 : Math.max(12, Math.round(lap * 0.72));
    }

    points.push({
      lap,
      iceTempC,
      waterTempC,
      batTempC,
      powerCv,
      derated,
    });
  }

  const endPowerCv = points[points.length - 1]?.powerCv ?? peakPowerCv;
  const passed = overheatLap === null;

  let summaryText = `Pico de ${peakPowerCv} CV estável até a volta 1000 (Água máx: ${peakWaterTempC.toFixed(0)}°C · Bateria máx: ${peakBatTempC.toFixed(0)}°C).`;
  let recommendation = 'Conjunto aprovado no ensaio de longa duração: nenhuma perda de potência prevista para a distância de GP.';

  if (overheatLap !== null) {
    const suggestedComp = Math.max(14.0, Math.round((compRatio - 0.2) * 10) / 10).toFixed(1);
    summaryText = `Pico de ${peakPowerCv} CV na volta 1, mas superaquecimento crítico detectado por volta da Volta ${overheatLap} (${peakIceTempC.toFixed(0)}°C no bloco / ${peakWaterTempC.toFixed(0)}°C na água).`;
    recommendation =
      compRatio >= 15.3
        ? `Recomendação do Conselho: Reduza a agressividade do motor para ${suggestedComp}:1 (ou diminua o tamanho do turbo) para completar as 1000 voltas sem corte de potência.`
        : 'Recomendação do Conselho: Alivie o calor da bateria ou reduza o ataque contínuo do ERS para evitar corte térmico.';
  }

  return {
    points,
    peakPowerCv,
    endPowerCv,
    peakIceTempC,
    peakWaterTempC,
    peakBatTempC,
    overheatLap,
    passed,
    summaryText,
    recommendation,
  };
}

export function computePuStarRatings(
  vehicleParams: VehicleEngineeringParameters,
  puOutputs: PowerUnitOutputs,
  relFinalPct: number,
  fuelPartner?: FuelPartnerId
): PuStarRatings {
  const iceHp = (puOutputs.shaftAndIce.icePowerW / 1000) * 1.34102209;
  const fuelBonus = fuelPartner === 'shell' ? 2 : fuelPartner === 'aramco' ? 1 : 0;

  // 1..5 stars for ICE Power
  const icePowerStars =
    iceHp >= 575 ? 5 : iceHp >= 555 ? 4 : iceHp >= 535 ? 3 : iceHp >= 515 ? 2 : 1;
  const icePowerLabel =
    icePowerStars >= 5
      ? 'Referência de Reta'
      : icePowerStars === 4
      ? 'Forte em Alta'
      : icePowerStars === 3
      ? 'Competitivo'
      : 'Abaixo da Média';

  // 1..5 stars for Reliability
  const effectiveRel = relFinalPct - (puOutputs.thermalAndLubrication.derateApplied ? 14 : 0);
  const reliabilityStars =
    effectiveRel >= 86 ? 5 : effectiveRel >= 78 ? 4 : effectiveRel >= 69 ? 3 : effectiveRel >= 58 ? 2 : 1;
  const reliabilityLabel =
    reliabilityStars >= 4
      ? 'À Prova de Balas'
      : reliabilityStars === 3
      ? 'Estável (Atenção ao Calor)'
      : 'Risco de Quebra!';

  // 1..5 stars for Fuel Efficiency (based on thermal eff + compression + eFuel partner)
  const effPct = puOutputs.shaftAndIce.iceThermalEfficiency * 100 + fuelBonus;
  const compPenalty = Math.max(0, vehicleParams.iceCompressionRatio - 15.6) * 2.5;
  const fuelScore = effPct - compPenalty;
  const fuelEfficiencyStars =
    fuelScore >= 52 ? 5 : fuelScore >= 49.5 ? 4 : fuelScore >= 46.5 ? 3 : fuelScore >= 43 ? 2 : 1;
  const fuelEfficiencyLabel =
    fuelEfficiencyStars >= 4
      ? 'Baixo Consumo (Menos Peso na Largada)'
      : fuelEfficiencyStars === 3
      ? 'Consumo Padrão'
      : 'Consumo Alto (Exige Fuel Saving)';

  return {
    icePowerStars,
    icePowerLabel,
    reliabilityStars,
    reliabilityLabel,
    fuelEfficiencyStars,
    fuelEfficiencyLabel,
  };
}

export function evaluateBoardroomPuVerdict(params: {
  vehicleParams: VehicleEngineeringParameters;
  puOutputs: PowerUnitOutputs;
  relFinalPct: number;
  headPuName?: string;
  headPuTag?: string;
  headAeroName?: string;
  headAeroTag?: string;
  philosophyCode?: string;
  philosophyName?: string;
  requiresLargerSidepods?: boolean;
}): BoardroomPuVerdict {
  const {
    vehicleParams,
    puOutputs,
    relFinalPct,
    headPuName = 'Gabriel Santos',
    headPuTag = 'INOVADOR',
    headAeroName = 'Marcus Vance',
    headAeroTag = 'ALTO DOWNFORCE',
    philosophyCode = 'aero_efficiency',
    philosophyName = 'Eficiência Aerodinâmica',
    requiresLargerSidepods = false,
  } = params;

  const comp = vehicleParams.iceCompressionRatio;
  const turbo = vehicleParams.turboDiameterMm;
  const heatTotalKw = puOutputs.thermalAndLubrication.heatTotalGeneratedW / 1000;
  const thermalMargin = puOutputs.thermalAndLubrication.thermalMarginK;

  // PU Chief Quote & Alignment
  let puAlign = 82;
  if (headPuTag.includes('INOVADOR') || headPuTag.includes('AGRESSIVO')) {
    if (comp >= 15.2) puAlign += 12;
    else if (comp <= 14.5) puAlign -= 15;
  } else if (headPuTag.includes('CONSERVADOR')) {
    if (relFinalPct >= 78 && comp <= 15.3) puAlign += 12;
    else if (comp >= 15.6 || relFinalPct < 70) puAlign -= 22;
  }
  if (thermalMargin < 4) puAlign -= 18;
  puAlign = Math.max(32, Math.min(98, Math.round(puAlign)));

  let puChiefQuote = `“O ajuste atual entrega ${Math.round((puOutputs.totalShaftOutput.crankshaftTotalPowerW / 1000) * 1.341)} CV com margem térmica controlada (${relFinalPct}% de confiança).`;
  if (comp >= 15.6 || thermalMargin < 4) {
    puChiefQuote = `“Chefe, essa agressividade de motor (${comp.toFixed(1)}:1) está no limite térmico! Teremos potência bruta na reta, mas se não aliviarmos um pouco, o carro corre risco real de perder potência após 10 voltas.”`;
  } else if (turbo >= 98) {
    puChiefQuote = `“O turbo grande dá velocidade final forte nas retas de Monza e Baku, mas o atraso na saída das curvas lentas obriga o sistema elétrico a gastar mais bateria para compensar.”`;
  } else if (puAlign >= 85) {
    puChiefQuote = `“Excelente equilíbrio! O bloco responde rápido sem fritar o sistema elétrico e atende exatamente ao nosso plano de ${philosophyName}.”`;
  } else {
    puChiefQuote = `“Temos um conjunto seguro, mas podemos extrair mais resposta elétrica na saída de curva sem comprometer a resistência do bloco.”`;
  }

  // Aero Chief Quote & Alignment
  let aeroAlign = 80;
  if (requiresLargerSidepods || heatTotalKw > 265) aeroAlign -= 18;
  else if (heatTotalKw < 245) aeroAlign += 10;

  if (philosophyCode === 'low_drag' && turbo <= 85) aeroAlign -= 8;
  if (philosophyCode === 'high_downforce' && requiresLargerSidepods) aeroAlign -= 12;
  if (vehicleParams.batteryCellTech === 'dense_pack') aeroAlign -= 5;
  aeroAlign = Math.max(34, Math.min(97, Math.round(aeroAlign)));

  let aeroChiefQuote = `“Se mantivermos o calor gerado dentro dessa faixa, consigo afinar os sidepods e preservar a eficiência do assoalho para o conceito de ${philosophyName}.”`;
  if (requiresLargerSidepods || heatTotalKw > 265) {
    aeroChiefQuote = `“Esse calor extra na traseira e nas baterias está me obrigando a abrir os radiadores e alargar a carenagem (sidepods). Vamos perder cerca de 2 a 4% de eficiência aerodinâmica nas retas!”`;
  } else if (vehicleParams.batteryCellTech === 'dense_pack') {
    aeroChiefQuote = `“As células densas adicionam peso no centro do carro; vou precisar recalibrar o balanço das asas e o fluxo do difusor para compensar a inércia nas chicanes.”`;
  } else if (aeroAlign >= 86) {
    aeroChiefQuote = `“Embalagem traseira bem compacta! Isso libera fluxo limpo para o difusor e maximiza o conceito ${philosophyName} sem penalidade de arrasto.”`;
  }

  const chassisRdDelayNote =
    aeroAlign < 65
      ? `Adaptação de sidepods e dutos de refrigeração pode exigir +2 semanas extras no projeto do chassi (${philosophyName}).`
      : aeroAlign < 80
      ? `Chassi exigirá ajuste moderado nas entradas de ar para acomodar o calor atual do motor.`
      : `Empacotamento alinhado ao conceito da Fase 4 — zero atraso estrutural previsto no chassi.`;

  return {
    puChiefName: headPuName,
    aeroChiefName: headAeroName,
    puChiefQuote,
    aeroChiefQuote,
    puAlignmentPct: puAlign,
    aeroAlignmentPct: aeroAlign,
    chassisRdDelayNote,
  };
}

export function computeNormalizedOfficialPuCard(params: {
  vehicleParams: VehicleEngineeringParameters;
  puOutputs: PowerUnitOutputs;
  displayedPowerHp: number;
  relFinalCalculado: number;
  iceWeightKg: number;
  batteryWeightKg: number;
  fuelPartner: FuelPartnerId;
  activeThirdPartyErsName?: string | null;
  requiresLargerSidepods?: boolean;
  dnaLabel?: string;
  engineOrigin?: 'customer' | 'bought_factory' | 'phoenix';
  isYear1Project?: boolean;
}): NormalizedOfficialPuCard {
  const {
    vehicleParams,
    puOutputs,
    displayedPowerHp,
    relFinalCalculado,
    iceWeightKg,
    batteryWeightKg,
    fuelPartner,
    activeThirdPartyErsName,
    requiresLargerSidepods = false,
    dnaLabel = 'CONCEPÇÃO IN-HOUSE 2026',
    engineOrigin = 'bought_factory',
    isYear1Project = engineOrigin !== 'customer',
  } = params;

  const totalWeightKg = iceWeightKg + batteryWeightKg;

  // Raw theoretical dyno envelope (~940..1085 CV -> 62..97)
  const rawPowerScore = Math.max(
    60,
    Math.min(99, Math.round(62 + ((displayedPowerHp - 940) / 145) * 35))
  );

  // Calibração de Maturidade Ano 1 (2026):
  // Comprar uma fábrica existente (ex: Cosworth) dá um piso inicial superior a construir do zero
  // (Fênix / Audi 78 / Cadillac 75), mas a imaturidade de software, calibração e mapeamento no Ano 1
  // impede igualar montadoras consolidadas (Ferrari 92, Red Bull-Ford 90, Mercedes 91) logo na estreia.
  let powerScore = rawPowerScore;
  if (isYear1Project && engineOrigin === 'bought_factory') {
    const floorAnchored = Math.max(77, rawPowerScore);
    powerScore =
      floorAnchored > 78
        ? Math.min(84, Math.round(78 + (floorAnchored - 78) * 0.30))
        : floorAnchored;
  } else if (isYear1Project && engineOrigin === 'phoenix') {
    const floorAnchored = Math.max(74, rawPowerScore);
    powerScore =
      floorAnchored > 74
        ? Math.min(80, Math.round(74 + (floorAnchored - 74) * 0.28))
        : floorAnchored;
  }

  const year1MaturityPenaltyPts = Math.max(0, rawPowerScore - powerScore);
  const reliabilityScore = Math.max(40, Math.min(99, Math.round(relFinalCalculado)));

  const fuelBonus = fuelPartner === 'shell' ? 6 : fuelPartner === 'aramco' ? 4 : 2;
  const effPct = puOutputs.shaftAndIce.iceThermalEfficiency * 100;
  const compEffPenalty = Math.max(0, (vehicleParams.iceCompressionRatio - 15.5) * 8);
  const fuelEfficiencyScore = Math.max(
    55,
    Math.min(99, Math.round(68 + (effPct - 45) * 3.2 + fuelBonus - compEffPenalty))
  );

  const pres01 = (vehicleParams.ersPreservationPct ?? 55) / 100;
  const rIntPenalty = Math.max(0, (vehicleParams.batteryInternalResistanceMOhm - 12) * 1.4);
  const hybridIntegrationPenalty = activeThirdPartyErsName && isYear1Project ? 4 : 0;
  const ersManagementScore = Math.max(
    55,
    Math.min(
      99,
      Math.round(
        76 +
          pres01 * 16 -
          Math.max(0, vehicleParams.ersDeployBiasPct - 72) * 0.45 -
          rIntPenalty +
          (activeThirdPartyErsName === 'Mercedes' ? 8 : 0) -
          hybridIntegrationPenalty
      )
    )
  );

  // Lightweight: 175kg = ~96, 198kg = ~66
  const lightweightScore = Math.max(55, Math.min(99, Math.round(98 - (totalWeightKg - 175) * 1.45)));

  // Real hidden costs of bought-factory & third-party ERS hybridization
  const developmentCeilingPct =
    engineOrigin === 'bought_factory'
      ? activeThirdPartyErsName
        ? 92
        : 94
      : 100;

  const coolingAeroPenaltyPct = activeThirdPartyErsName
    ? 3.0
    : requiresLargerSidepods
    ? 1.5
    : 0;

  const estimatedSeasonDnfs24Races =
    reliabilityScore < 68
      ? '6 a 8 quebras / falhas mecânicas em 24 GPs'
      : reliabilityScore < 76
      ? '3 a 5 falhas mecânicas em 24 GPs'
      : '1 a 2 incidentes leves esperados';

  const extraMaintenanceCostAnnualM =
    activeThirdPartyErsName && reliabilityScore < 75
      ? 4.5
      : engineOrigin === 'bought_factory' && reliabilityScore < 75
      ? 2.5
      : 0;

  const factoryFloorLabel =
    engineOrigin === 'bought_factory'
      ? 'Base Industrial Comprada (Piso Ano 1 acima da Audi/Cadillac, com teto arquitetônico)'
      : engineOrigin === 'phoenix'
      ? 'Projeto do Zero / Fênix (Piso menor no Ano 1, mas teto livre 100% no Ano 2)'
      : 'Motor Cliente Homologado (Estabilidade de fornecedor sem controle de CAD)';

  const summaryWarning =
    engineOrigin === 'bought_factory'
      ? activeThirdPartyErsName
        ? `Motor híbrido (Bloco comprado + ERS ${activeThirdPartyErsName}) parte na frente de Audi/Cadillac, mas sofre calibração Ano 1 (-${year1MaturityPenaltyPts} pts de pico), -${coolingAeroPenaltyPct.toFixed(1)}% de eficiência aero por refrigeração extra e teto de desenvolvimento em ${developmentCeilingPct}%.`
        : `Fábrica adquirida entrega piso superior a estreantes do zero, porém a maturidade de software no Ano 1 limita o teto inicial em ${powerScore}/100 (teto estrutural ${developmentCeilingPct}% até revisão ADUO/Ano 2).`
      : engineOrigin === 'phoenix'
      ? `Projeto inédito do zero começa no pelotão da Audi (${powerScore}/100) no Ano 1, exigindo paciência antes da virada do Ano 2.`
      : `Motor cliente oferece entrega imediata e previsível dentro dos limites do fornecedor.`;

  const year1GridComparison: PuMaturityRiskAnalysis['year1GridComparison'] = [
    { label: 'Ferrari (Works Consolidada)', score: 92, tier: 'works_top' },
    { label: 'Mercedes / McLaren (Works)', score: 91, tier: 'works_top' },
    { label: 'Red Bull-Ford (Works)', score: 90, tier: 'works_top' },
    {
      label:
        engineOrigin === 'bought_factory'
          ? 'Seu Projeto (Fábrica Comprada · Ano 1)'
          : engineOrigin === 'phoenix'
          ? 'Seu Projeto (Do Zero Fênix · Ano 1)'
          : 'Seu Projeto (Cliente)',
      score: powerScore,
      tier: 'player',
    },
    { label: 'Audi Revolut (Estreante Works)', score: 78, tier: 'year1_rookie' },
    { label: 'Cadillac F1 (Estreante)', score: 75, tier: 'year1_rookie' },
  ];

  const pros: string[] = [];
  const cons: string[] = [];

  if (powerScore >= 82) {
    pros.push(`Piso competitivo de pelotão intermediário alto (${powerScore}/100 · ${displayedPowerHp} CV brutos em bancada), acima de Audi e Cadillac.`);
  } else {
    pros.push(`Curva de entrega progressiva (${powerScore}/100 · ${displayedPowerHp} CV) com base sólida para evoluir via ADUO.`);
  }

  if (reliabilityScore >= 82) pros.push(`Alta durabilidade estrutural (${reliabilityScore}/100) ao longo do campeonato.`);
  if (fuelEfficiencyScore >= 84) pros.push(`Excelente rendimento de E-Fuel — carro larga mais leve e evita economia forçada.`);
  if (ersManagementScore >= 84) pros.push(`Gestão elétrica equilibrada (350 kW) com baixa chance de corte no fim das retas.`);

  if (year1MaturityPenaltyPts > 0) {
    cons.push(`Imaturidade de mapeamento Ano 1 limita rendimento efetivo em pista para ${powerScore}/100 (vs 90–92 das montadoras de ponta).`);
  }
  if (developmentCeilingPct < 100) {
    cons.push(`Teto arquitetônico de ${developmentCeilingPct}%: ganhos de upgrade de PU saturam cedo na temporada.`);
  }
  if (reliabilityScore < 72) {
    cons.push(`Margem de segurança reduzida (${reliabilityScore}/100) projeta ${estimatedSeasonDnfs24Races}.`);
  }
  if (vehicleParams.turboDiameterMm >= 97) {
    cons.push('Turbo grande gera leve atraso de resposta (lag) na saída de curvas lentas.');
  } else if (vehicleParams.turboDiameterMm <= 84) {
    cons.push('Turbo compacto perde um pouco de velocidade final no último terço de retas longas.');
  }
  if (coolingAeroPenaltyPct > 0 || requiresLargerSidepods || puOutputs.thermalAndLubrication.thermalMarginK < 6) {
    cons.push(
      coolingAeroPenaltyPct > 0
        ? `Integração térmica exige +20% de fluxo de ar (-${coolingAeroPenaltyPct.toFixed(1)}% de eficiência aerodinâmica nos sidepods).`
        : 'Demanda elevada de refrigeração exige entradas de ar maiores nos sidepods.'
    );
  }
  if (cons.length === 0) {
    cons.push('Pacote equilibrado sem defeitos severos; evolução contínua depende de atualizações de software e ADUO.');
  }

  const resolvedIce = ICE_METALLURGY_2026[resolveIceMetallurgyId(vehicleParams.iceMetallurgyId, vehicleParams.iceMaterial)];
  const chassisCompatibility =
    coolingAeroPenaltyPct > 0 || requiresLargerSidepods
      ? `Massa total ${totalWeightKg} kg. Integração térmica impõe -${coolingAeroPenaltyPct.toFixed(1)}% de eficiência aerodinâmica por sidepods alargados.`
      : totalWeightKg <= 180
      ? `Conjunto ultra-compacto (${totalWeightKg} kg) com ${resolvedIce.shortLabel}. Permite cintura traseira estreita ("Coke Bottle") e ganho direto de downforce no difusor.`
      : `Massa total ${totalWeightKg} kg com integração limpa ao monocoque e equilíbrio térmico adequado para o conceito da Fase 4.`;

  return {
    powerScore,
    reliabilityScore,
    fuelEfficiencyScore,
    ersManagementScore,
    lightweightScore,
    totalPowerCv: displayedPowerHp,
    totalWeightKg,
    pros,
    cons,
    chassisCompatibility,
    dnaBadge: dnaLabel,
    riskAnalysis: {
      isYear1Project,
      engineOrigin,
      factoryFloorLabel,
      rawUncappedPowerScore: rawPowerScore,
      year1MaturityPenaltyPts,
      developmentCeilingPct,
      coolingAeroPenaltyPct,
      estimatedSeasonDnfs24Races,
      extraMaintenanceCostAnnualM,
      year1GridComparison,
      summaryWarning,
    },
  };
}
