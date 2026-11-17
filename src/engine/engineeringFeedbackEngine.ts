import type {
  CarPhilosophy,
  ComponentSpec,
  Driver,
  StaffMember,
} from '../types/f1';
import type {
  RegulatoryCheckResult,
  SimulatorPilotReport,
  VehicleEngineeringParameters,
  VehiclePhysicsOutputs,
} from '../types/physics';
import { computeCarRadarProfile, type CarRadarAxis } from './chassisLaunchAndSeasonLoop';

export type EngineeringAvatarRole =
  | 'head_aero'
  | 'head_pu'
  | 'chief_mechanic'
  | 'sporting_director'
  | 'driver';

export interface ChiefCadFeedback {
  chiefId: string;
  chiefName: string;
  chiefRole: StaffMember['role'];
  avatarRole: EngineeringAvatarRole;
  sectorLabel: string;
  chiefRating: number;
  chiefTrust: number;
  chiefMorale: number;
  status: 'aligned' | 'warning' | 'critical';
  isDisengaged: boolean;
  quote: string;
  recommendationSummary: string;
  recommendedPatch: Partial<VehicleEngineeringParameters> | null;
  atrHoursCost: number;
  rdSpeedModifierPct: number;
  adviceKey: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getCadSectorAtrHoursCost(type: ComponentSpec['type']): number {
  switch (type) {
    case 'floor':
    case 'wings':
      return 20;
    case 'chassis':
      return 12;
    case 'suspension':
      return 8;
    case 'pu':
    case 'gearbox':
    default:
      return 0;
  }
}

export function resolveActiveChiefForCadType(
  selectedType: ComponentSpec['type'],
  staff: StaffMember[],
  teamName?: string
): {
  member: StaffMember | undefined;
  fallbackName: string;
  fallbackRole: StaffMember['role'];
  sectorLabel: string;
  avatarRole: EngineeringAvatarRole;
} {
  let targetRole: StaffMember['role'] = 'head_aero';
  let fallbackName = 'Marcus Vance';
  let sectorLabel = 'AERO';
  let avatarRole: EngineeringAvatarRole = 'head_aero';

  if (selectedType === 'pu' || selectedType === 'gearbox') {
    targetRole = 'head_pu';
    fallbackName = 'Dr. Klaus Weber';
    sectorLabel = 'PU & TRANSMISSÃO';
    avatarRole = 'head_pu';
  } else if (selectedType === 'suspension') {
    targetRole = 'chief_mechanic';
    fallbackName = 'Lee Stevenson';
    sectorLabel = 'DINÂMICA & CHASSI';
    avatarRole = 'chief_mechanic';
  } else if (selectedType === 'chassis') {
    targetRole = 'head_aero';
    fallbackName = 'Marcus Vance';
    sectorLabel = 'CHASSI & AERO';
    avatarRole = 'head_aero';
  } else {
    targetRole = 'head_aero';
    fallbackName = 'Marcus Vance';
    sectorLabel = 'AERO';
    avatarRole = 'head_aero';
  }

  const teamMatch = teamName
    ? staff.find(
        (s) =>
          s.role === targetRole &&
          (s.currentTeam === teamName || s.currentTeam === 'APEX Grand Prix Team')
      )
    : undefined;

  const starterMatch = staff.find(
    (s) =>
      s.role === targetRole &&
      (s.id.startsWith('staff_head') ||
        s.id === 'staff_sporting_dir' ||
        s.id === 'staff_chief_mechanic')
  );

  const member = teamMatch || starterMatch || staff.find((s) => s.role === targetRole);

  return {
    member,
    fallbackName,
    fallbackRole: targetRole,
    sectorLabel,
    avatarRole,
  };
}

export function evaluateChiefCadFeedback(params: {
  selectedType: ComponentSpec['type'];
  vehicleParams: VehicleEngineeringParameters;
  vehiclePhysics: VehiclePhysicsOutputs;
  philosophy?: CarPhilosophy;
  regulatory: RegulatoryCheckResult;
  staff: StaffMember[];
  teamName?: string;
}): ChiefCadFeedback {
  const {
    selectedType,
    vehicleParams,
    vehiclePhysics,
    philosophy = 'balanced',
    regulatory,
    staff,
    teamName,
  } = params;

  const resolved = resolveActiveChiefForCadType(selectedType, staff, teamName);
  const member = resolved.member;
  const chiefId = member?.id ?? `fallback_${resolved.fallbackRole}`;
  const chiefName = member?.name ?? resolved.fallbackName;
  const chiefRole = member?.role ?? resolved.fallbackRole;
  const chiefRating = member?.rating ?? 82;
  const chiefTrust = clamp(Math.round(member?.trust ?? 75), 0, 100);
  const chiefMorale = clamp(Math.round(member?.morale ?? member?.mentality ?? 80), 0, 100);
  const isDisengaged = chiefTrust < 40;
  const atrHoursCost = getCadSectorAtrHoursCost(selectedType);

  let status: ChiefCadFeedback['status'] = 'aligned';
  let quote = '';
  let recommendationSummary = 'Parâmetros dentro da janela técnica aprovada para este setor.';
  let recommendedPatch: Partial<VehicleEngineeringParameters> | null = null;
  let adviceKey = `${selectedType}_ok`;

  if (selectedType === 'chassis') {
    if (vehicleParams.wheelbaseMm > 3400) {
      status = 'critical';
      adviceKey = 'chassis_wheelbase_illegal';
      quote = `Chefe, com ${vehicleParams.wheelbaseMm} mm de entre-eixos estamos acima do teto FIA 2026 (3400 mm). O carro será desclassificado na inspeção técnica!`;
      recommendationSummary = 'Reduzir entre-eixos para 3380 mm para homologação legal e agilidade.';
      recommendedPatch = { wheelbaseMm: 3380 };
    } else if (vehicleParams.laminateThicknessMm < 3.5) {
      status = 'warning';
      adviceKey = 'chassis_thickness_low';
      quote = `Chefe, baixar o monocoque para ${vehicleParams.laminateThicknessMm.toFixed(1)} mm economiza peso, mas deixa o carro frágil e sujeito a reprovação no Crash Test ou flexão nas zebras! Recomendo manter em 3.6 mm.`;
      recommendationSummary = 'Reforçar espessura do laminado para 3.6 mm (+rigidez torcional e segurança FIA).';
      recommendedPatch = { laminateThicknessMm: 3.6 };
    } else if (vehiclePhysics.bucklingSafetyFactor < 1.15 || vehiclePhysics.delaminationRiskPct > 30) {
      status = 'warning';
      adviceKey = 'chassis_layup_shear';
      quote = `A orientação das lâminas está com risco de delaminação (${vehiclePhysics.delaminationRiskPct}%). Precisamos ampliar a fração ±45° e o reforço local para segurar a torção do assoalho.`;
      recommendationSummary = 'Ajustar laminado para ±45°=40% e reforço local=32%.';
      recommendedPatch = { layupPly45Pct: 40, localReinforcementPct: 32 };
    } else {
      quote = `Excelente escolha, Chefe. ${vehicleParams.laminateThicknessMm.toFixed(1)} mm de espessura e ${vehiclePhysics.torsionalStiffnessNmDeg.toLocaleString()} N·m/° mantêm a rigidez torcional ideal sem estourar o peso. Aprovado!`;
    }
  } else if (selectedType === 'wings') {
    if (philosophy === 'high_downforce' && vehicleParams.frontWingFlapCornerDeg < 30) {
      status = 'warning';
      adviceKey = 'wings_high_df_mismatch';
      quote = `Chefe, você pediu um carro High Downforce, mas ajustou a asa dianteira para apenas ${vehicleParams.frontWingFlapCornerDeg}° no Modo Z. Em curvas lentas vamos sofrer com subesterço! Sugiro subir para 32°.`;
      recommendationSummary = 'Subir flap dianteiro no Modo Z para 32° e traseiro para 38° para cumprir o DNA High Downforce.';
      recommendedPatch = { frontWingFlapCornerDeg: 32, rearWingFlapCornerDeg: 38 };
    } else if (philosophy === 'low_drag' && vehicleParams.rearWingFlapStraightDeg > 11) {
      status = 'warning';
      adviceKey = 'wings_low_drag_mismatch';
      quote = `Nossa filosofia é Low Drag, mas a asa traseira em Modo X (${vehicleParams.rearWingFlapStraightDeg}°) ainda deixa muita parede de ar nas retas. Feche o flap para 7° no Modo X.`;
      recommendationSummary = 'Reduzir flaps no Modo X para 7°/7° para extrair máxima velocidade final.';
      recommendedPatch = { frontWingFlapStraightDeg: 7, rearWingFlapStraightDeg: 7 };
    } else if (vehiclePhysics.cornerMode.aeroBalanceFrontPct > 50.5) {
      status = 'warning';
      adviceKey = 'wings_front_heavy_oversteer';
      quote = `Balanço aerodinâmico muito adiantado (${vehiclePhysics.cornerMode.aeroBalanceFrontPct}% diant.). A traseira vai escapar na entrada das curvas rápidas!`;
      recommendationSummary = 'Adicionar +3° de asa traseira no Modo Z para estabilizar a traseira.';
      recommendedPatch = {
        rearWingFlapCornerDeg: clamp(vehicleParams.rearWingFlapCornerDeg + 3, 22, 48),
      };
    } else if (vehiclePhysics.cornerMode.aeroBalanceFrontPct < 42.5) {
      status = 'warning';
      adviceKey = 'wings_rear_heavy_understeer';
      quote = `O carro está saindo de frente no papel (${vehiclePhysics.cornerMode.aeroBalanceFrontPct}% diant.). Precisamos de mais mordida no eixo dianteiro em Modo Z.`;
      recommendationSummary = 'Aumentar asa dianteira em +3° no Modo Z para recuperar apontamento.';
      recommendedPatch = {
        frontWingFlapCornerDeg: clamp(vehicleParams.frontWingFlapCornerDeg + 3, 18, 42),
      };
    } else {
      quote = `Balanço perfeito entre Modo Z (${vehiclePhysics.cornerMode.aeroBalanceFrontPct}% diant.) e abertura do Modo X (-${vehiclePhysics.straightMode.dragReductionPct}% de arrasto). Os pilotos vão sentir confiança na freada.`;
    }
  } else if (selectedType === 'floor') {
    if (vehicleParams.frontRideHeightMm < 18) {
      status = 'critical';
      adviceKey = 'floor_ride_height_illegal';
      quote = `Altura dianteira em ${vehicleParams.frontRideHeightMm} mm viola o piso mínimo FIA 2026 de 18 mm e vai gastar a prancha até a desclassificação!`;
      recommendationSummary = 'Elevar altura dianteira para 21 mm para eliminar desgaste de prancha.';
      recommendedPatch = { frontRideHeightMm: 21 };
    } else if (vehiclePhysics.porpoisingRiskPct > 48) {
      status = 'warning';
      adviceKey = 'floor_porpoising_high';
      quote = `Atenção, Chefe: o túnel do assoalho e o difusor em ${vehicleParams.diffuserAngleDeg.toFixed(1)}° elevaram o risco de porpoising para ${vehiclePhysics.porpoisingRiskPct}%. Na pista o carro vai quicar nas retas!`;
      recommendationSummary = 'Ajustar altura dianteira para 22 mm e difusor para 10.4° para estabilizar o fluxo.';
      recommendedPatch = {
        frontRideHeightMm: Math.max(22, vehicleParams.frontRideHeightMm),
        diffuserAngleDeg: Math.min(10.4, vehicleParams.diffuserAngleDeg),
      };
    } else if (vehiclePhysics.thermalMarginC < 4) {
      status = 'warning';
      adviceKey = 'floor_cooling_choked';
      quote = `Esses sidepods fechados (${vehicleParams.sidepodInletAreaCm2} cm²) deixaram a margem térmica em apenas ${vehiclePhysics.thermalMarginC}°C. Em corrida quente vamos sofrer derating elétrico!`;
      recommendationSummary = 'Ampliar entrada dos sidepods (+35 cm²) e abrir saída quente (+25 cm²).';
      recommendedPatch = {
        sidepodInletAreaCm2: clamp(vehicleParams.sidepodInletAreaCm2 + 35, 240, 480),
        hotAirExitAreaCm2: clamp(vehicleParams.hotAirExitAreaCm2 + 25, 200, 450),
      };
    } else {
      quote = `Escoamento aderido no difusor (${vehiclePhysics.diffuserPressureRecoveryPct}% recuperação) com porpoising sob controle (${vehiclePhysics.porpoisingRiskPct}%) e refrigeração saudável.`;
    }
  } else if (selectedType === 'pu') {
    if (vehicleParams.iceCompressionRatio > 16.0 || vehicleParams.mgukMaxKw > 350) {
      status = 'critical';
      adviceKey = 'pu_fia_limit_breach';
      quote = `Cuidado! Compressão ${vehicleParams.iceCompressionRatio.toFixed(1)}:1 ou MGU-K ${vehicleParams.mgukMaxKw} kW estoura o teto regulamentar da FIA 2026 (16.0:1 / 350 kW).`;
      recommendationSummary = 'Enquadrar compressão em 15.8:1 e MGU-K em 350 kW dentro da regra FIA.';
      recommendedPatch = {
        iceCompressionRatio: Math.min(15.8, vehicleParams.iceCompressionRatio),
        mgukMaxKw: Math.min(350, vehicleParams.mgukMaxKw),
      };
    } else if (vehiclePhysics.thermalMarginC < 4) {
      status = 'warning';
      adviceKey = 'pu_thermal_overload';
      quote = `Com essa calibração, a bateria ERS já chega a ${vehiclePhysics.batteryCellTempC}°C e temos só ${vehiclePhysics.thermalMarginC}°C de folga térmica. Em tráfego o sistema vai cortar potência!`;
      recommendationSummary = 'Aliviar compressão para 15.4:1 e ajustar deploy ERS para preservar margem térmica.';
      recommendedPatch = {
        iceCompressionRatio: Math.min(15.4, vehicleParams.iceCompressionRatio),
        ersDeployBiasPct: clamp(vehicleParams.ersDeployBiasPct - 10, 10, 90),
      };
    } else {
      quote = `Dinamômetro limpo: ${vehiclePhysics.totalWheelPowerHp} CV na roda, perdas Joule contidas em ${vehiclePhysics.batteryJouleLossesKw} kW e temperatura estável.`;
    }
  } else if (selectedType === 'gearbox') {
    if (vehiclePhysics.gearboxOilTempC > 124) {
      status = 'warning';
      adviceKey = 'gearbox_oil_hot';
      quote = `O óleo da transmissão está batendo ${vehiclePhysics.gearboxOilTempC}°C. Se mantermos esse trocador pequeno, corremos risco de falha hidráulica nas últimas voltas.`;
      recommendationSummary = 'Elevar trocador de óleo para 14 kW e ampliar largura dos dentes em +1 mm.';
      recommendedPatch = {
        gearboxOilCoolingKw: clamp(Math.max(14, vehicleParams.gearboxOilCoolingKw), 6, 18),
        gearToothWidthMm: clamp(vehicleParams.gearToothWidthMm + 1, 14, 22),
      };
    } else if (vehiclePhysics.fatigueLifeRaces < 5) {
      status = 'warning';
      adviceKey = 'gearbox_fatigue_low';
      quote = `Com dentes de ${vehicleParams.gearToothWidthMm} mm em ${vehicleParams.gearboxMaterial.toUpperCase()}, a caixa dura só ${vehiclePhysics.fatigueLifeRaces} GPs — vamos tomar punição de grid antes da metade do ano!`;
      recommendationSummary = 'Aumentar largura dos dentes para 18.5 mm para garantir ciclo regulamentar de 5+ GPs.';
      recommendedPatch = { gearToothWidthMm: 18.5 };
    } else {
      quote = `Eficiência mecânica de ${vehiclePhysics.transmissionEfficiencyPct}% e vida útil projetada para ${vehiclePhysics.fatigueLifeRaces} GPs. Projeto robusto para homologação.`;
    }
  } else if (selectedType === 'suspension') {
    if (vehicleParams.springRateNmm > 300 || vehiclePhysics.naturalFrequencyHz > 5.8) {
      status = 'warning';
      adviceKey = 'suspension_too_stiff';
      quote = `Molas em ${vehicleParams.springRateNmm} N/mm deixam a plataforma muito dura (${vehiclePhysics.naturalFrequencyHz} Hz). Em pistas onduladas ou sobre zebras os pilotos vão perder tração e travar rodas.`;
      recommendationSummary = 'Suavizar molas para 245 N/mm e recalibrar barra estabilizadora para 85 N/mm.';
      recommendedPatch = { springRateNmm: 245, antiRollBarNmm: 85 };
    } else if (vehiclePhysics.dampingRatio < 0.45) {
      status = 'warning';
      adviceKey = 'suspension_underdamped';
      quote = `Razão de amortecimento ζ=${vehiclePhysics.dampingRatio} está baixa demais para controlar o salto aerodinâmico em alta velocidade.`;
      recommendationSummary = 'Subir amortecedor para 4600 N·s/m para estabilizar a plataforma.';
      recommendedPatch = { damperNsM: 4600 };
    } else {
      quote = `Excelente compromisso cinemático: rolagem de ${vehiclePhysics.cornerRollDeg}° e janela térmica dos pneus em ${vehiclePhysics.tireThermalWindowHealthPct}%. A equipe de pista está pronta para montar.`;
    }
  }

  if (!regulatory.compliant && status === 'aligned') {
    status = 'critical';
    adviceKey = `${selectedType}_reg_violation`;
    quote = `Atenção, Chefe: existe uma violação regulamentar em ${regulatory.violations[0]?.parameter}. Precisamos corrigir antes de aprovar a manufatura.`;
  }

  // Override hostility / disengagement tone when chiefTrust < 40
  if (isDisengaged) {
    if (status === 'aligned') {
      quote = `Os números fecham no papel, mas vou ser direto: se você continuar ignorando a engenharia de ${resolved.sectorLabel}, não faz sentido me chamar para as reuniões. P&D operando com -10% de ritmo.`;
    } else {
      quote = `Se é assim que vamos trabalhar — você ignorando os alertas técnicos do setor — não me chame para as reuniões. Minha recomendação continua registrada, mas a equipe está desengajada (-10% velocidade P&D).`;
    }
  }

  const rdSpeedModifierPct = isDisengaged ? -10 : status === 'aligned' ? 5 : 0;

  return {
    chiefId,
    chiefName,
    chiefRole,
    avatarRole: resolved.avatarRole,
    sectorLabel: resolved.sectorLabel,
    chiefRating,
    chiefTrust,
    chiefMorale,
    status,
    isDisengaged,
    quote,
    recommendationSummary,
    recommendedPatch,
    atrHoursCost,
    rdSpeedModifierPct,
    adviceKey,
  };
}

export function computeDriverPerceivedRadarProfile(params: {
  vehicleParams: VehicleEngineeringParameters;
  vehiclePhysics: VehiclePhysicsOutputs;
  components: ComponentSpec[];
  correlationErrorPct: number;
  driverFeedbackRating?: number;
}): CarRadarAxis[] {
  const {
    vehicleParams,
    vehiclePhysics,
    components,
    correlationErrorPct,
    driverFeedbackRating = 80,
  } = params;

  const baseAxes = computeCarRadarProfile(vehicleParams, vehiclePhysics, components);
  const errorScale = clamp(correlationErrorPct / 15, 0.15, 1.35);
  const driverClarity = clamp((driverFeedbackRating - 65) / 35, 0, 1);

  const porpoisingPenalty =
    vehiclePhysics.porpoisingRiskPct > 45
      ? (vehiclePhysics.porpoisingRiskPct - 40) * 0.24
      : 0;
  const frontOversteerBias = Math.max(0, vehiclePhysics.cornerMode.aeroBalanceFrontPct - 49.0);
  const understeerBias = Math.max(0, 44.5 - vehiclePhysics.cornerMode.aeroBalanceFrontPct);
  const stiffnessPenalty = vehicleParams.springRateNmm > 280 ? (vehicleParams.springRateNmm - 270) * 0.12 : 0;
  const thermalPenalty = vehiclePhysics.thermalMarginC < 6 ? (6 - vehiclePhysics.thermalMarginC) * 1.4 : 0;

  return baseAxes.map((axis) => {
    let delta = 0;
    if (axis.key === 'downforce') {
      // Túnel otimista vs sensação real do piloto sob porpoising e erro de correlação
      delta = -(2.5 + errorScale * 5.2 + porpoisingPenalty * 0.45 + understeerBias * 1.2);
    } else if (axis.key === 'lowDrag') {
      delta = -(1.5 + errorScale * 3.8 + (vehiclePhysics.porpoisingRiskPct > 55 ? 2.5 : 0));
    } else if (axis.key === 'traction') {
      delta = -(2.0 + errorScale * 3.2 + stiffnessPenalty * 0.55 + frontOversteerBias * 1.5);
    } else if (axis.key === 'tireCare') {
      delta = -(1.8 + errorScale * 3.4 + stiffnessPenalty * 0.4 + porpoisingPenalty * 0.25);
    } else if (axis.key === 'powerUnit') {
      delta = -(1.0 + errorScale * 2.4 + thermalPenalty * 0.7);
    } else if (axis.key === 'reliability') {
      delta = -(1.5 + errorScale * 2.8 + thermalPenalty * 0.8 + (vehiclePhysics.fatigueLifeRaces < 5 ? 3 : 0));
    }

    // Pilotos com alto feedback percebem discrepâncias sutis com maior nitidez
    const perceived = Math.round(clamp(axis.value + delta * (0.85 + driverClarity * 0.25), 30, 99));
    return {
      ...axis,
      value: perceived,
    };
  });
}

export function generateDriverSimulatorReport(params: {
  vehicleParams: VehicleEngineeringParameters;
  vehiclePhysics: VehiclePhysicsOutputs;
  components: ComponentSpec[];
  leadDriver?: Driver;
  correlationErrorPct: number;
}): SimulatorPilotReport {
  const {
    vehicleParams,
    vehiclePhysics,
    components,
    leadDriver,
    correlationErrorPct,
  } = params;

  const driverId = leadDriver?.id ?? 'lead_driver';
  const driverName = leadDriver?.name ?? 'Piloto Titular #1';
  const driverNumber = leadDriver?.number ?? 1;
  const feedbackRating = leadDriver?.attributes?.feedback ?? 82;
  const trustRating = clamp(Math.round(leadDriver?.trust ?? 75), 0, 100);

  const driverPerceivedAxes = computeDriverPerceivedRadarProfile({
    vehicleParams,
    vehiclePhysics,
    components,
    correlationErrorPct,
    driverFeedbackRating: feedbackRating,
  });

  const aeroFront = vehiclePhysics.cornerMode.aeroBalanceFrontPct;
  const porpoising = vehiclePhysics.porpoisingRiskPct;
  const thermalMargin = vehiclePhysics.thermalMarginC;
  const springRate = vehicleParams.springRateNmm;

  let handlingVerdict: SimulatorPilotReport['handlingVerdict'] = 'estavel';
  let quote = '';
  let suggestedAdjustment = '';
  let recommendedActionType: SimulatorPilotReport['recommendedActionType'] = 'vehicle';
  let recommendedParamsPatch: Partial<VehicleEngineeringParameters> | undefined;

  if (trustRating <= 15) {
    handlingVerdict = 'critico';
    quote = `Eu já disse três vezes no simulador que esse carro está imprevisível na curva de alta! Se continuarem ignorando meus dados, na pista eu vou ter que arriscar além do limite para compensar.`;
    suggestedAdjustment = 'Recalibrar plataforma e reconstruir confiança com o piloto aplicando a correção abaixo.';
    recommendedParamsPatch = {
      frontRideHeightMm: Math.max(22, vehicleParams.frontRideHeightMm),
      springRateNmm: Math.min(255, springRate),
    };
  } else if (porpoising > 50) {
    handlingVerdict = 'critico';
    quote = `O carro está quicando no final das retas e perco a referência da freada quando o assoalho sela demais! O túnel diz que temos carga, mas no volante é assustador.`;
    suggestedAdjustment = 'Subir altura dianteira (+2 mm) e reduzir inclinação extrema do difusor.';
    recommendedParamsPatch = {
      frontRideHeightMm: clamp(vehicleParams.frontRideHeightMm + 2, 18, 36),
      diffuserAngleDeg: clamp(Math.min(10.5, vehicleParams.diffuserAngleDeg), 6, 14.5),
    };
  } else if (aeroFront > 49.5) {
    handlingVerdict = 'nervoso';
    quote = `A frente entra rápido demais, mas a traseira está saindo de lado na entrada das curvas de média! Preciso de mais apoio atrás ou vou gastar os pneus traseiros em 8 voltas.`;
    suggestedAdjustment = 'Adicionar +3° de asa traseira no Modo Z ou reduzir asa dianteira em -2°.';
    recommendedParamsPatch = {
      rearWingFlapCornerDeg: clamp(vehicleParams.rearWingFlapCornerDeg + 3, 22, 48),
      frontWingFlapCornerDeg: clamp(vehicleParams.frontWingFlapCornerDeg - 2, 18, 42),
    };
  } else if (aeroFront < 43.0) {
    handlingVerdict = 'nervoso';
    quote = `Estou brigando com saída de frente (subesterço) no meio da curva. Viro o volante e o bico simplesmente não aponta para o ápice!`;
    suggestedAdjustment = 'Elevar asa dianteira no Modo Z em +3° para recuperar mordida na entrada.';
    recommendedParamsPatch = {
      frontWingFlapCornerDeg: clamp(vehicleParams.frontWingFlapCornerDeg + 3, 18, 42),
    };
  } else if (springRate > 285) {
    handlingVerdict = 'rigido';
    quote = `A suspensão está dura como uma tábua sobre as zebras! Toda vez que ataco a zebra na saída de curva o carro perde tração e destraciona.`;
    suggestedAdjustment = 'Amaciar molas para 245 N/mm para ganhar aderência mecânica nas zebras.';
    recommendedParamsPatch = {
      springRateNmm: 245,
    };
  } else if (thermalMargin < 4) {
    handlingVerdict = 'rigido';
    quote = `No stint longo o painel pede lift-and-coast por temperatura de bateria e o deploy do ERS corta antes do fim da reta!`;
    suggestedAdjustment = 'Ampliar entrada dos sidepods (+30 cm²) para proteger a entrega elétrica.';
    recommendedParamsPatch = {
      sidepodInletAreaCm2: clamp(vehicleParams.sidepodInletAreaCm2 + 30, 240, 480),
    };
  } else {
    handlingVerdict = 'estavel';
    quote = `A frente está bem plantada e o balanço entre Modo Z e Modo X responde de forma previsível. Com ${correlationErrorPct.toFixed(1)}% de incerteza de túnel, só falta ajustar o fino na pista.`;
    suggestedAdjustment = 'Plataforma aprovada pelo piloto — manter base atual para o próximo GP.';
    recommendedActionType = undefined;
  }

  return {
    driverId,
    driverName,
    driverNumber,
    feedbackRating,
    trustRating,
    handlingVerdict,
    quote,
    suggestedAdjustment,
    recommendedActionType,
    recommendedParamsPatch,
    driverPerceivedAxes,
  };
}
