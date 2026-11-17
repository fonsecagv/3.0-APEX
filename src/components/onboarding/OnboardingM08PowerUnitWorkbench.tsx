import React, { useMemo, useState } from 'react';
import {
  Flame,
  Zap,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Info,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  FlaskConical,
  X,
  Star,
  Thermometer,
  Play,
  Activity,
  Users,
  ShieldCheck,
} from 'lucide-react';
import type { VehicleEngineeringParameters } from '../../types/physics';
import type { CustomerEngineSupplier, FuelPartnerId } from '../../types/f1';
import { FIA_2026_DEFAULT_EDITION } from '../../engine/modules/m03Packaging';
import { evaluatePowerUnit, evaluateGate08 } from '../../engine/modules/m08PowerUnit';
import {
  BATTERY_ARCHITECTURES_2026,
  BATTERY_SUB_CHEMISTRIES,
  ICE_METALLURGY_2026,
  PU_MATERIAL_RESEARCH_PROJECTS,
  getSupplierDnaSpec,
  resolveBatteryArchitectureId,
  resolveIceMetallurgyId,
  type BatteryArchitectureId,
  type IceMetallurgyId,
} from '../../data/puMaterials2026';
import {
  computePuStarRatings,
  evaluateBoardroomPuVerdict,
  simulateEndurance1000Laps,
  type Endurance1000LapReport,
} from '../../utils/puBenchHelpers';

interface OnboardingM08PowerUnitWorkbenchProps {
  vehicleParams: VehicleEngineeringParameters;
  onUpdateParams: (patch: Partial<VehicleEngineeringParameters>) => void;
  isHardwareLocked: boolean;
  isCustomerOrPurchased: boolean;
  supplierName?: CustomerEngineSupplier | 'In-House' | string | null;
  unlockedMaterials?: string[];
  onGoToResearch?: () => void;
  // Optional context props (backwards-compatible with EngineeringTab or tests)
  headPuName?: string;
  headPuTag?: string;
  headAeroName?: string;
  headAeroTag?: string;
  philosophyCode?: string;
  philosophyName?: string;
  fuelPartner?: FuelPartnerId;
  relFinalPct?: number;
  requiresLargerSidepods?: boolean;
  isBoughtFactoryModified?: boolean;
  modifiedParamsCount?: number;
}

const SLIDER_BASE =
  'w-full appearance-none bg-transparent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#E10600] [&::-webkit-slider-thumb]:-mt-1 [&::-moz-range-track]:h-2 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#E10600]';

const SLIDER_CLASS = `${SLIDER_BASE} [&::-webkit-slider-runnable-track]:bg-zinc-800 [&::-moz-range-track]:bg-zinc-800`;
const SLIDER_TRANSPARENT_TRACK = `${SLIDER_BASE} relative z-10 [&::-webkit-slider-runnable-track]:bg-transparent [&::-moz-range-track]:bg-transparent`;

const ICE_ORDER: IceMetallurgyId[] = ['fia_iron_ams6487', 'ferrari_steel_head', 'al_si_low_friction'];
const BATTERY_ORDER: BatteryArchitectureId[] = ['lightweight_lithium', 'dense_pack', 'ultra_solid_state'];

const renderStars = (count: number, tone: 'amber' | 'emerald' | 'red' | 'cyan') => {
  const activeColor =
    tone === 'emerald'
      ? 'text-emerald-400 fill-emerald-400'
      : tone === 'red'
      ? 'text-red-400 fill-red-400'
      : tone === 'cyan'
      ? 'text-cyan-400 fill-cyan-400'
      : 'text-amber-400 fill-amber-400';

  return (
    <div className="flex items-center gap-0.5" aria-label={`${count} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((idx) => (
        <Star
          key={idx}
          className={`w-3.5 h-3.5 ${idx <= count ? activeColor : 'text-zinc-700'}`}
        />
      ))}
    </div>
  );
};

export const OnboardingM08PowerUnitWorkbench: React.FC<OnboardingM08PowerUnitWorkbenchProps> = ({
  vehicleParams,
  onUpdateParams,
  isHardwareLocked,
  isCustomerOrPurchased,
  supplierName,
  unlockedMaterials,
  onGoToResearch,
  headPuName = 'Gabriel Santos',
  headPuTag = 'INOVADOR',
  headAeroName = 'Marcus Vance',
  headAeroTag = 'ALTO DOWNFORCE',
  philosophyCode = 'aero_efficiency',
  philosophyName = 'Eficiência Aerodinâmica',
  fuelPartner = 'petronas',
  relFinalPct,
  requiresLargerSidepods = false,
}) => {
  const [showTurboAdvanced, setShowTurboAdvanced] = useState(false);
  const [showSoftwareAdvanced, setShowSoftwareAdvanced] = useState(false);
  const [showBomModal, setShowBomModal] = useState(false);
  const [enduranceReport, setEnduranceReport] = useState<Endurance1000LapReport | null>(null);
  const MAX_ENDURANCE_SIMULATIONS = 3;
  const [enduranceSimCount, setEnduranceSimCount] = useState(0);
  const remainingEnduranceSims = Math.max(0, MAX_ENDURANCE_SIMULATIONS - enduranceSimCount);

  const turboArRatio = vehicleParams.turboArRatio ?? 0.92;
  const ersPreservationPct = vehicleParams.ersPreservationPct ?? 55;
  const antiClippingOn = ersPreservationPct >= 35;

  const dnaSpec = useMemo(() => getSupplierDnaSpec(supplierName), [supplierName]);
  const effectiveUnlocked = useMemo(
    () =>
      new Set(
        unlockedMaterials && unlockedMaterials.length > 0
          ? unlockedMaterials
          : dnaSpec.starterUnlockedMaterials
      ),
    [unlockedMaterials, dnaSpec]
  );

  const activeIceId = resolveIceMetallurgyId(vehicleParams.iceMetallurgyId, vehicleParams.iceMaterial);
  const activeIceSpec = ICE_METALLURGY_2026[activeIceId];

  const activeBatteryId = resolveBatteryArchitectureId(vehicleParams.batteryCellTech);
  const activeBatterySpec = BATTERY_ARCHITECTURES_2026[activeBatteryId];
  const activeSubChem = vehicleParams.batterySubChemistry ?? dnaSpec.defaultBatterySubChem;

  const pu = useMemo(
    () =>
      evaluatePowerUnit(
        vehicleParams,
        {
          rpm: 11600,
          throttleRatio: 1.0,
          vehicleSpeedMs: 75,
          ambientTempK: 298.15,
          airPressurePa: 101325,
          initialSoc01: 0.72,
          cycleDurationS: 5.0,
          regenPowerCommandW: 110000,
          deployCommandRatio: Math.max(0.25, Math.min(1.0, vehicleParams.ersDeployBiasPct / 85)),
          cumulativeRaceCycles: 120,
        },
        FIA_2026_DEFAULT_EDITION
      ),
    [vehicleParams]
  );

  const gate08 = useMemo(() => evaluateGate08(pu), [pu]);

  const icePowerKw = pu.shaftAndIce.icePowerW / 1000;
  const mgukPowerKw = pu.ersAndBattery.mgukActualShaftW / 1000;
  const totalPowerKw = pu.totalShaftOutput.crankshaftTotalPowerW / 1000;
  const totalPowerHp = totalPowerKw * 1.34102209;
  const iceTempC = pu.thermalAndLubrication.iceTempK - 273.15;
  const batTempC = pu.thermalAndLubrication.batteryTempK - 273.15;
  const oilTempC = pu.thermalAndLubrication.oilTempK - 273.15;

  const effectiveRelPct = relFinalPct ?? Math.round(pu.reliability.reliabilityScore01 * 100);

  // Leadership verdict & 1-5 star ratings
  const boardroomVerdict = useMemo(
    () =>
      evaluateBoardroomPuVerdict({
        vehicleParams,
        puOutputs: pu,
        relFinalPct: effectiveRelPct,
        headPuName,
        headPuTag,
        headAeroName,
        headAeroTag,
        philosophyCode,
        philosophyName,
        requiresLargerSidepods,
      }),
    [
      vehicleParams,
      pu,
      effectiveRelPct,
      headPuName,
      headPuTag,
      headAeroName,
      headAeroTag,
      philosophyCode,
      philosophyName,
      requiresLargerSidepods,
    ]
  );

  const starRatings = useMemo(
    () => computePuStarRatings(vehicleParams, pu, effectiveRelPct, fuelPartner),
    [vehicleParams, pu, effectiveRelPct, fuelPartner]
  );

  // 1. Engine Aggressiveness (Compression)
  const compRatio = vehicleParams.iceCompressionRatio;
  const compRiskLevel = compRatio <= 14.8 ? 'low' : compRatio <= 15.4 ? 'moderate' : 'high';
  const compStatusFeedback =
    compRiskLevel === 'low'
      ? `Atual: Conservador e Seguro. Prioriza durabilidade e temperaturas baixas, aliviando os radiadores (${headAeroName} agradece).`
      : compRiskLevel === 'moderate'
      ? `Atual: Equilibrado. Aumentar a agressividade dá mais potência na reta, mas esquenta o motor e exige mais refrigeração (afeta ${headAeroName}).`
      : `Atual: Agressivo (${compRatio.toFixed(1)}:1). Ganho máximo em reta, mas calor elevado reduz margem térmica e obriga sidepods maiores (${headAeroName}).`;

  // 2. Turbo Size -> Response (%) vs Top-End (%)
  const turboDiam = vehicleParams.turboDiameterMm;
  const turboNormPct = Math.round(((turboDiam - 78) / 26) * 100);
  const turboTopEndPct = Math.max(15, Math.min(98, Math.round(35 + turboNormPct * 0.6)));
  const turboResponsePct = Math.max(15, Math.min(98, Math.round(95 - turboNormPct * 0.65)));
  const turboCategory = turboDiam <= 86 ? 'Pequeno (Ágil)' : turboDiam <= 95 ? 'Equilibrado' : 'Grande (Retas)';

  // 3. Semáforo Térmico Combinado
  const highEngineBreakRisk =
    (compRatio >= 15.8 && turboDiam >= 100) ||
    (compRatio >= 15.5 && turboDiam >= 98) ||
    pu.thermalAndLubrication.thermalMarginK < 4 ||
    pu.thermalAndLubrication.derateApplied;

  const trafficLightState: 'green' | 'amber' | 'red' = highEngineBreakRisk
    ? 'red'
    : pu.thermalAndLubrication.thermalMarginK < 9 || compRiskLevel === 'high'
    ? 'amber'
    : 'green';

  // 4. ERS Strategy & Battery Heat
  const deployPct = Math.round(vehicleParams.ersDeployBiasPct);
  const regenPct = 100 - deployPct;
  const ersModeBadge =
    deployPct <= 42
      ? {
          label: 'Economia de Energia (Poupa p/ Defesa)',
          cls: 'text-emerald-300 border-emerald-500/40 bg-emerald-950/35',
        }
      : deployPct >= 62
      ? {
          label: 'Ataque Total (Gasta Bateria Rápido)',
          cls: 'text-amber-300 border-amber-500/45 bg-amber-950/40',
        }
      : {
          label: 'Equilibrado (50/50)',
          cls: 'text-zinc-200 border-white/15 bg-[#1C1C26]',
        };

  const jouleLossKw = pu.ersAndBattery.jouleLossW / 1000;
  const rIntMOhm = vehicleParams.batteryInternalResistanceMOhm;
  const rIntLevel: 'low' | 'moderate' | 'high' =
    rIntMOhm <= 12.0 ? 'low' : rIntMOhm <= 16.5 ? 'moderate' : 'high';
  const batteryHeatLabel =
    rIntLevel === 'low' ? 'Baixo' : rIntLevel === 'moderate' ? 'Moderado' : 'Alto (Risco de Corte)';

  const handleSelectIceMetallurgy = (id: IceMetallurgyId) => {
    if (isHardwareLocked || isCustomerOrPurchased) return;
    if (!effectiveUnlocked.has(id)) return;
    const spec = ICE_METALLURGY_2026[id];
    onUpdateParams({
      iceMetallurgyId: id,
      iceMaterial: spec.legacyIceMaterial,
    });
  };

  const handleSelectBattery = (id: BatteryArchitectureId) => {
    if (isHardwareLocked || isCustomerOrPurchased) return;
    if (!effectiveUnlocked.has(id)) return;
    onUpdateParams({
      batteryCellTech: id,
    });
  };

  const handleRun1000LapSim = () => {
    if (enduranceSimCount >= MAX_ENDURANCE_SIMULATIONS) return;
    const report = simulateEndurance1000Laps(vehicleParams, {
      reliabilityBonusPct: effectiveRelPct - 75,
      thirdPartyErsPenaltyPct: requiresLargerSidepods ? 4 : 0,
    });
    setEnduranceReport(report);
    setEnduranceSimCount((prev) => Math.min(MAX_ENDURANCE_SIMULATIONS, prev + 1));
  };

  // Helper to build SVG polyline points for 1000-lap simulation
  const chartGeom = useMemo(() => {
    if (!enduranceReport || enduranceReport.points.length === 0) return null;
    const w = 520;
    const h = 140;
    const padX = 28;
    const padY = 16;
    const pts = enduranceReport.points;

    const minTemp = 75;
    const maxTemp = 128;
    const minCv = Math.max(820, Math.min(...pts.map((p) => p.powerCv)) - 30);
    const maxCv = Math.max(1060, Math.max(...pts.map((p) => p.powerCv)) + 20);

    const xOf = (lap: number) => padX + ((lap - 1) / 999) * (w - padX * 2);
    const yTempOf = (t: number) =>
      h - padY - ((Math.max(minTemp, Math.min(maxTemp, t)) - minTemp) / (maxTemp - minTemp)) * (h - padY * 2);
    const yCvOf = (cv: number) =>
      h - padY - ((Math.max(minCv, Math.min(maxCv, cv)) - minCv) / (maxCv - minCv)) * (h - padY * 2);

    const tempLine = pts.map((p) => `${xOf(p.lap).toFixed(1)},${yTempOf(p.iceTempC).toFixed(1)}`).join(' ');
    const waterLine = pts.map((p) => `${xOf(p.lap).toFixed(1)},${yTempOf(p.waterTempC).toFixed(1)}`).join(' ');
    const cvLine = pts.map((p) => `${xOf(p.lap).toFixed(1)},${yCvOf(p.powerCv).toFixed(1)}`).join(' ');
    const ceilingY = yTempOf(117.5);

    return { w, h, tempLine, waterLine, cvLine, ceilingY };
  }, [enduranceReport]);

  return (
    <div className="bg-[#1C1C26] border border-white/10 p-5 space-y-5 f1-container-bucket">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-f1-mono text-cyan-400 font-bold uppercase tracking-widest">
              BANCADA DE ENGENHARIA (F1 2026)
            </span>
            <span
              className={`text-[10px] font-f1-mono px-2 py-0.5 border font-bold uppercase inline-flex items-center gap-1 ${
                gate08.passed
                  ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-400'
                  : 'bg-red-950/50 border-red-500/40 text-red-400'
              }`}
            >
              {gate08.passed ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
              <span>{gate08.passed ? 'DENTRO DO LIMITE FIA' : 'FORA DO LIMITE SEGURO'}</span>
            </span>
            {supplierName && (
              <span className="text-[10px] font-f1-mono px-2 py-0.5 border border-white/15 bg-[#15151E] text-zinc-300 uppercase">
                Base: {dnaSpec.puDesignation}
              </span>
            )}
          </div>
          <h3 className="font-f1-wide font-black text-base text-white uppercase mt-1">
            Ajuste de Performance, Retas & Confiabilidade
          </h3>
          <p className="text-xs text-zinc-400 font-f1-mono">
            Equilibre potência nas retas, resposta nas curvas e temperatura ao longo da corrida.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            disabled={remainingEnduranceSims === 0}
            onClick={handleRun1000LapSim}
            className="text-[11px] font-f1-wide font-bold uppercase bg-[#E10600] hover:bg-[#c20500] disabled:bg-zinc-800 disabled:text-zinc-500 disabled:border disabled:border-white/10 disabled:cursor-not-allowed text-white px-3.5 py-2 inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-md tabular-nums"
          >
            {remainingEnduranceSims === 0 ? (
              <Lock className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>
              {remainingEnduranceSims > 0
                ? `Rodar Simulação de 1000 Voltas (${remainingEnduranceSims}/3)`
                : 'Limite de Simulações Atingido (0/3)'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowBomModal(true)}
            className="text-[10px] font-f1-mono bg-[#15151E] hover:bg-white/10 border border-cyan-500/40 text-cyan-300 px-3 py-2 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Lista de Peças (BOM)</span>
          </button>

          {(isHardwareLocked || isCustomerOrPurchased) && (
            <div className="text-[10px] font-f1-mono bg-amber-950/40 border border-amber-500/40 text-amber-300 px-3 py-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>
                {isCustomerOrPurchased
                  ? 'Hardware do Fornecedor — Software ERS editável'
                  : 'Hardware selado FIA — Software ERS editável'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* PARTE 2A: VEREDITO DA BANCADA (Liderança + Avaliação por Estrelas 1-5) */}
      <div className="bg-[#15151E] border border-white/10 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-f1-wide font-black text-white uppercase tracking-wider">
              Veredito da Bancada · Conselho Técnico
            </span>
          </div>
          <span className="text-[10px] font-f1-mono text-zinc-400">
            Reação em tempo real ao ajuste dos controles abaixo
          </span>
        </div>

        {/* Avaliações por Estrelas (Substitui status crus por intuição instantânea) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-[#1C1C26] border border-white/10 p-3 flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block font-bold">
                Potência (ICE)
              </span>
              <span className="text-xs font-f1-mono text-white font-bold">{starRatings.icePowerLabel}</span>
            </div>
            {renderStars(starRatings.icePowerStars, 'amber')}
          </div>

          <div
            className={`border p-3 flex items-center justify-between gap-2 ${
              starRatings.reliabilityStars <= 2
                ? 'bg-red-950/35 border-red-500/50'
                : 'bg-[#1C1C26] border-white/10'
            }`}
          >
            <div>
              <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block font-bold">
                Confiabilidade
              </span>
              <span
                className={`text-xs font-f1-mono font-bold ${
                  starRatings.reliabilityStars <= 2 ? 'text-red-400' : 'text-emerald-300'
                }`}
              >
                {starRatings.reliabilityLabel}
              </span>
            </div>
            {renderStars(
              starRatings.reliabilityStars,
              starRatings.reliabilityStars <= 2 ? 'red' : 'emerald'
            )}
          </div>

          <div className="bg-[#1C1C26] border border-white/10 p-3 flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block font-bold">
                Consumo de Combustível
              </span>
              <span className="text-xs font-f1-mono text-cyan-300 font-bold">
                {starRatings.fuelEfficiencyLabel}
              </span>
            </div>
            {renderStars(starRatings.fuelEfficiencyStars, 'cyan')}
          </div>
        </div>

        {/* Falas dinâmicas de Chefe de PU e Chefe de Aero */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-f1-mono">
          <div className="bg-[#1C1C26] border border-white/10 p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-amber-400 font-bold uppercase text-[10px]">
                {boardroomVerdict.puChiefName} · Chefe de Motor (PU)
              </span>
              <span className="text-[10px] text-zinc-400 tabular-nums">
                Alinhamento: <strong className="text-white">{boardroomVerdict.puAlignmentPct}%</strong>
              </span>
            </div>
            <p className="text-zinc-200 leading-relaxed italic">{boardroomVerdict.puChiefQuote}</p>
          </div>

          <div className="bg-[#1C1C26] border border-white/10 p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-cyan-400 font-bold uppercase text-[10px]">
                {boardroomVerdict.aeroChiefName} · Chefe de Aerodinâmica
              </span>
              <span className="text-[10px] text-zinc-400 tabular-nums">
                Alinhamento: <strong className="text-white">{boardroomVerdict.aeroAlignmentPct}%</strong>
              </span>
            </div>
            <p className="text-zinc-200 leading-relaxed italic">{boardroomVerdict.aeroChiefQuote}</p>
          </div>
        </div>
      </div>

      {/* RESULTADO DA SIMULAÇÃO DE 1000 VOLTAS (Quando executada) */}
      {enduranceReport && (
        <div
          className={`p-4 border space-y-3 ${
            enduranceReport.passed
              ? 'bg-emerald-950/20 border-emerald-500/40'
              : 'bg-red-950/30 border-red-500/60'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <Activity
                className={`w-4 h-4 ${enduranceReport.passed ? 'text-emerald-400' : 'text-red-400'}`}
              />
              <span className="font-f1-wide font-black text-xs text-white uppercase tracking-wider">
                [ RESULTADO DO TESTE DE 1000 VOLTAS ]
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-f1-mono tabular-nums">
              <span className="text-zinc-300">
                Pico: <strong className="text-white">{enduranceReport.peakPowerCv} CV</strong>
              </span>
              <span className="text-zinc-300">
                Água Máx: <strong className="text-amber-300">{enduranceReport.peakWaterTempC.toFixed(0)}°C</strong>
              </span>
              <span
                className={`font-bold px-2 py-0.5 border ${
                  enduranceReport.passed
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : 'bg-red-950/60 border-red-500/50 text-red-300'
                }`}
              >
                {enduranceReport.passed ? 'RESISTÊNCIA APROVADA' : `AQUECEU NA VOLTA ${enduranceReport.overheatLap}`}
              </span>
              <button
                type="button"
                aria-label="Fechar resultado da simulação"
                onClick={() => setEnduranceReport(null)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* Gráfico SVG Potência vs Temperatura ao longo de 1000 voltas */}
            {chartGeom && (
              <div className="lg:col-span-7 bg-[#15151E] border border-white/10 p-3">
                <div className="flex items-center justify-between text-[10px] font-f1-mono text-zinc-400 mb-1">
                  <span>CURVA TÉRMICA & ENTREGA DE POTÊNCIA (VOLTAS 1 → 1000)</span>
                  <span className="flex items-center gap-3">
                    <span className="text-red-400">― Temp. Motor (°C)</span>
                    <span className="text-cyan-400">― Temp. Água (°C)</span>
                    <span className="text-emerald-400">― Potência (CV)</span>
                  </span>
                </div>
                <svg
                  viewBox={`0 0 ${chartGeom.w} ${chartGeom.h}`}
                  className="w-full h-32 overflow-visible"
                  role="img"
                  aria-label="Gráfico de temperatura e potência ao longo de 1000 voltas"
                >
                  {/* Linha limite de superaquecimento */}
                  <line
                    x1={28}
                    y1={chartGeom.ceilingY}
                    x2={chartGeom.w - 28}
                    y2={chartGeom.ceilingY}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    strokeOpacity="0.6"
                  />
                  <text
                    x={32}
                    y={chartGeom.ceilingY - 4}
                    fill="#fca5a5"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    Limite Crítico (118°C)
                  </text>
                  <polyline
                    fill="none"
                    stroke="#34d399"
                    strokeWidth="2"
                    points={chartGeom.cvLine}
                  />
                  <polyline
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="1.8"
                    points={chartGeom.waterLine}
                  />
                  <polyline
                    fill="none"
                    stroke="#f87171"
                    strokeWidth="2.2"
                    points={chartGeom.tempLine}
                  />
                </svg>
                <div className="flex justify-between text-[9px] font-f1-mono text-zinc-500 px-6 tabular-nums">
                  <span>Volta 1</span>
                  <span>Volta 250</span>
                  <span>Volta 500</span>
                  <span>Volta 750</span>
                  <span>Volta 1000</span>
                </div>
              </div>
            )}

            <div className="lg:col-span-5 space-y-2 text-xs font-f1-mono">
              <p className="text-white font-bold leading-relaxed">{enduranceReport.summaryText}</p>
              <div className="bg-[#15151E] border border-white/10 p-2.5 text-zinc-200 leading-relaxed">
                {enduranceReport.recommendation}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls Grid: Motor a Combustão & Turbo (Left) + Sistema Elétrico & Software (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT COLUMN: ICE + TURBO */}
        <div className="bg-[#15151E] border border-white/10 p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-f1-wide font-bold text-amber-400 uppercase flex items-center gap-1.5">
              <Flame className="w-4 h-4" />
              <span>Motor a Combustão & Turbo</span>
            </span>
            <span className="text-[10px] font-f1-mono text-zinc-400">
              {isCustomerOrPurchased ? `Base ${dnaSpec.supplier}` : 'Projeto Fabricante'}
            </span>
          </div>

          {/* 1. Material do Bloco */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-f1-mono text-zinc-300 font-bold uppercase">
                  Material do Bloco
                </span>
                <div className="relative group inline-flex items-center">
                  <button
                    type="button"
                    aria-label="Detalhes técnicos do material do bloco FIA 2026"
                    title={activeIceSpec.tooltip}
                    className="text-zinc-400 hover:text-amber-400 focus:text-amber-400 transition-colors cursor-help"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                  <div className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity absolute left-0 bottom-full mb-1.5 z-20 w-72 bg-[#0D0D14] border border-amber-500/40 p-2.5 text-[10px] text-zinc-200 leading-snug shadow-lg">
                    {activeIceSpec.tooltip} (Liga homologada: {activeIceSpec.pistonAlloyCode})
                  </div>
                </div>
              </div>
              {isCustomerOrPurchased && (
                <span className="text-[10px] font-f1-mono px-2 py-0.5 bg-amber-950/40 border border-amber-500/40 text-amber-300 inline-flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Homologado</span>
                </span>
              )}
            </div>

            {isCustomerOrPurchased ? (
              <div className="p-2.5 border border-amber-500/40 bg-[#1C1C26] flex items-center justify-between gap-2 text-xs font-f1-mono">
                <div>
                  <div className="text-white font-bold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {activeIceSpec.shortLabel} ({dnaSpec.supplier})
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-300 mt-1">{activeIceSpec.tradeOffSummary}</div>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {ICE_ORDER.map((matId) => {
                    const spec = ICE_METALLURGY_2026[matId];
                    const isSelected = activeIceId === matId;
                    const isUnlocked = effectiveUnlocked.has(matId);
                    const researchProj = spec.researchProjectId
                      ? PU_MATERIAL_RESEARCH_PROJECTS.find((p) => p.id === spec.researchProjectId)
                      : null;
                    const disabled = isHardwareLocked || !isUnlocked;

                    return (
                      <button
                        key={matId}
                        type="button"
                        disabled={disabled}
                        title={spec.tooltip}
                        onClick={() => handleSelectIceMetallurgy(matId)}
                        className={`p-2 text-left border text-[11px] font-f1-mono transition-all flex flex-col justify-between gap-1 ${
                          isSelected
                            ? 'border-amber-500 bg-amber-950/35 text-white font-bold'
                            : isUnlocked
                            ? 'border-white/15 bg-[#1C1C26] text-zinc-300 hover:border-amber-500/50 hover:text-white cursor-pointer'
                            : 'border-white/5 bg-[#121218] text-zinc-500 cursor-not-allowed opacity-80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="leading-tight">{spec.shortLabel}</span>
                          {!isUnlocked && <Lock className="w-3 h-3 text-amber-400/80 shrink-0 mt-0.5" />}
                        </div>
                        <div className="text-[9px] font-normal">
                          {isSelected ? (
                            <span className="text-amber-300 uppercase font-bold">Selecionado</span>
                          ) : isUnlocked ? (
                            <span className="text-emerald-400">Disponível</span>
                          ) : (
                            <span className="text-amber-400/80">
                              Requer P&D · ${(researchProj ? researchProj.costUsd / 1e6 : 5).toFixed(0)}M
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] font-f1-mono text-zinc-300">{activeIceSpec.tradeOffSummary}</p>
              </>
            )}
          </div>

          {/* 2. Agressividade do Motor (Simplificado: Trade-off protagonista, r_c no tooltip) */}
          <div className="space-y-2 border-t border-white/10 pt-3.5">
            <div className="flex justify-between items-center text-xs font-f1-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-white font-bold">Agresividade do Motor</span>
                <div className="relative group inline-flex items-center">
                  <button
                    type="button"
                    aria-label="Detalhes técnicos da taxa de compressão"
                    title={`Taxa de compressão atual: ${compRatio.toFixed(1)}:1 (Limite FIA 16.0:1). Eficiência térmica: ${(pu.shaftAndIce.iceThermalEfficiency * 100).toFixed(1)}%.`}
                    className="text-zinc-400 hover:text-amber-400 focus:text-amber-400 transition-colors cursor-help"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                  <div className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity absolute left-0 bottom-full mb-1.5 z-20 w-72 bg-[#0D0D14] border border-amber-500/40 p-2.5 text-[10px] text-zinc-200 leading-snug shadow-lg">
                    Parâmetro técnico: Taxa de compressão{' '}
                    <strong className="text-amber-300">{compRatio.toFixed(1)}:1</strong> (limite máximo FIA 2026: 16.0:1). Eficiência térmica (η_th):{' '}
                    <strong className="text-emerald-300">{(pu.shaftAndIce.iceThermalEfficiency * 100).toFixed(1)}%</strong>.
                  </div>
                </div>
              </div>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 border tabular-nums ${
                  compRiskLevel === 'high'
                    ? 'text-red-300 bg-red-950/50 border-red-500/40'
                    : compRiskLevel === 'moderate'
                    ? 'text-amber-300 bg-amber-950/40 border-amber-500/40'
                    : 'text-emerald-300 bg-emerald-950/40 border-emerald-500/40'
                }`}
              >
                {compRiskLevel === 'high'
                  ? 'Foco: Máxima Potência'
                  : compRiskLevel === 'moderate'
                  ? 'Equilibrado'
                  : 'Foco: Máxima Confiança'}
              </span>
            </div>

            {/* Barra de gradiente Verde -> Amarelo -> Vermelho */}
            <div className="relative flex items-center h-4">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 h-2 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-600 opacity-85 border border-white/15"
              />
              <input
                type="range"
                aria-label="Agresividade do Motor"
                disabled={isHardwareLocked}
                min={14.0}
                max={16.0}
                step={0.1}
                value={compRatio}
                onChange={(e) => onUpdateParams({ iceCompressionRatio: Number(e.target.value) })}
                className={SLIDER_TRANSPARENT_TRACK}
              />
            </div>

            <div className="flex justify-between text-[10px] font-f1-mono text-zinc-400">
              <span>← Mais Confiável</span>
              <span>Mais Potência →</span>
            </div>

            <div
              className={`text-[11px] font-f1-mono px-2.5 py-2 border leading-snug ${
                compRiskLevel === 'high'
                  ? 'bg-red-950/35 border-red-500/50 text-red-200'
                  : compRiskLevel === 'moderate'
                  ? 'bg-[#1C1C26] border-amber-500/30 text-amber-100'
                  : 'bg-emerald-950/25 border-emerald-500/35 text-emerald-200'
              }`}
            >
              {compStatusFeedback}
            </div>
          </div>

          {/* 3. Tamanho do Turbo / Resposta vs Vel. Máxima */}
          <div className="space-y-2 border-t border-white/10 pt-3.5">
            <div className="flex items-center justify-between gap-2 text-xs font-f1-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-white font-bold">Tamanho do Turbo (Resposta vs Reta)</span>
                <div className="relative group inline-flex items-center">
                  <button
                    type="button"
                    aria-label="Detalhes técnicos do turbocompressor"
                    title={`Diâmetro da roda: ${turboDiam} mm | Atraso (lag): ${pu.turbocharger.spoolLagMs.toFixed(0)} ms.`}
                    className="text-zinc-400 hover:text-amber-400 focus:text-amber-400 transition-colors cursor-help"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                  <div className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity absolute left-0 bottom-full mb-1.5 z-20 w-72 bg-[#0D0D14] border border-amber-500/40 p-2.5 text-[10px] text-zinc-200 leading-snug shadow-lg">
                    Medida física: <strong className="text-amber-300">{turboDiam} mm</strong>. Atraso de resposta (lag):{' '}
                    <strong className="text-cyan-300">{pu.turbocharger.spoolLagMs.toFixed(0)} ms</strong> (PR {pu.turbocharger.operatingPoint.pressureRatio.toFixed(2)}).
                  </div>
                </div>
              </div>
              <span className="text-amber-400 font-bold text-[11px]">{turboCategory}</span>
            </div>

            {/* Feedback percentual intuitivo (sem ms/mm obrigatórios na cara) */}
            <div className="flex items-center justify-between text-[11px] font-f1-mono bg-[#1C1C26] border border-white/10 px-2.5 py-1.5 tabular-nums">
              <span className="text-zinc-300">
                Resposta em Curva: <strong className="text-sky-300">{turboResponsePct}%</strong>
              </span>
              <span className="text-zinc-300">
                Potência Final (Retas): <strong className="text-amber-300">{turboTopEndPct}%</strong>
              </span>
            </div>

            <div className="relative flex items-center h-4">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 h-2 rounded-full overflow-hidden flex border border-white/10"
              >
                <div className="w-[32.7%] bg-sky-500/40" />
                <div className="w-[34.6%] bg-zinc-500/40 border-x border-white/15" />
                <div className="w-[32.7%] bg-amber-500/45" />
              </div>
              <input
                type="range"
                aria-label="Tamanho do Turbo"
                disabled={isHardwareLocked}
                min={78}
                max={104}
                step={1}
                value={turboDiam}
                onChange={(e) => onUpdateParams({ turboDiameterMm: Number(e.target.value) })}
                className={SLIDER_TRANSPARENT_TRACK}
              />
            </div>

            <div className="flex justify-between text-[10px] font-f1-mono text-zinc-400">
              <span>← Resposta Rápida (Curvas)</span>
              <span>Vel. Máxima (Retas) →</span>
            </div>

            {/* Acordeão Avançado (Carcaça A/R) */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowTurboAdvanced((prev) => !prev)}
                className="flex items-center gap-1.5 text-[10px] font-f1-mono uppercase tracking-wider text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer"
              >
                {showTurboAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span>Configurações Avançadas do Turbo (A/R)</span>
              </button>

              {showTurboAdvanced && (
                <div className="mt-2 bg-[#1C1C26] border border-white/10 p-3 space-y-1.5">
                  <div className="flex justify-between text-[11px] font-f1-mono">
                    <span className="text-zinc-300">Geometria da Carcaça (A/R)</span>
                    <span className="text-amber-400 font-bold tabular-nums">{turboArRatio.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    disabled={isHardwareLocked}
                    min={0.72}
                    max={1.18}
                    step={0.02}
                    value={turboArRatio}
                    onChange={(e) => onUpdateParams({ turboArRatio: Number(e.target.value) })}
                    className={SLIDER_CLASS}
                  />
                  <div className="flex justify-between text-[10px] font-f1-mono text-zinc-400">
                    <span>Mais saída de curva</span>
                    <span>Mais força no fim da reta</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SISTEMA ELÉTRICO & SOFTWARE */}
        <div className="bg-[#15151E] border border-white/10 p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-f1-wide font-bold text-emerald-400 uppercase flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              <span>Sistema Elétrico & Software (ERS)</span>
            </span>
            <span className="text-[10px] font-f1-mono text-zinc-400">350 kW · Gestão de Bateria</span>
          </div>

          {/* 1. Arquitetura da Bateria */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-f1-mono text-zinc-200 font-bold uppercase">
                  Arquitetura da Bateria
                </span>
                <div className="relative group inline-flex items-center">
                  <button
                    type="button"
                    aria-label="Detalhes técnicos da bateria FIA 2026"
                    title={activeBatterySpec.tooltip}
                    className="text-zinc-400 hover:text-emerald-400 focus:text-emerald-400 transition-colors cursor-help"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                  <div className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity absolute left-0 bottom-full mb-1.5 z-20 w-72 bg-[#0D0D14] border border-emerald-500/40 p-2.5 text-[10px] text-zinc-200 leading-snug shadow-lg">
                    {activeBatterySpec.tooltip}
                  </div>
                </div>
              </div>
              {isCustomerOrPurchased && (
                <span className="text-[10px] font-f1-mono text-amber-300">Homologado</span>
              )}
            </div>

            {isCustomerOrPurchased ? (
              <div className="p-2.5 border border-emerald-500/40 bg-[#1C1C26] text-xs font-f1-mono flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-white font-bold">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {activeBatterySpec.shortLabel} ({dnaSpec.supplier})
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 bg-[#1C1C26] border border-white/10 p-0.5 gap-1">
                {BATTERY_ORDER.map((batId) => {
                  const spec = BATTERY_ARCHITECTURES_2026[batId];
                  const isSelected = activeBatteryId === batId;
                  const isUnlocked = effectiveUnlocked.has(batId);
                  const disabled = isHardwareLocked || !isUnlocked;

                  return (
                    <button
                      key={batId}
                      type="button"
                      disabled={disabled}
                      title={spec.tooltip}
                      onClick={() => handleSelectBattery(batId)}
                      className={`py-2 px-1.5 text-center text-[11px] font-f1-mono transition-all ${
                        isSelected
                          ? 'bg-emerald-950/60 border border-emerald-500/70 text-white font-bold'
                          : isUnlocked
                          ? 'border border-transparent text-zinc-300 hover:text-white cursor-pointer'
                          : 'border border-transparent text-zinc-500 cursor-not-allowed opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1 leading-tight">
                        {!isUnlocked && <Lock className="w-3 h-3 text-amber-400/80 shrink-0" />}
                        <span>{spec.shortLabel}</span>
                      </div>
                      {!isUnlocked && (
                        <span className="block text-[9px] text-amber-400/80 mt-0.5">Requer P&D</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <p className="text-[11px] font-f1-mono text-zinc-300">{activeBatterySpec.tradeOffSummary}</p>
          </div>

          {/* 2. Modo de Ataque do ERS (Recuperação vs Deploy 50/50) */}
          <div className="border-t border-white/10 pt-3.5 space-y-2">
            <div className="flex justify-between items-center text-xs font-f1-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-white font-bold">Modo de Ataque do ERS</span>
                <div className="relative group inline-flex items-center">
                  <button
                    type="button"
                    aria-label="Detalhes do Modo de Ataque do ERS"
                    title={`Balanço atual: ${deployPct}% entrega nas retas / ${regenPct}% recuperação nas freadas.`}
                    className="text-zinc-400 hover:text-emerald-400 focus:text-emerald-400 transition-colors cursor-help"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                  <div className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity absolute left-0 bottom-full mb-1.5 z-20 w-64 bg-[#0D0D14] border border-emerald-500/40 p-2 text-[10px] text-zinc-200 leading-snug shadow-lg">
                    Controla o software de entrega elétrica: {deployPct}% Deploy em retas vs {regenPct}% Recuperação nas freadas.
                  </div>
                </div>
              </div>
              <span className="text-amber-400 font-bold tabular-nums">
                {deployPct}% Deploy / {regenPct}% Recup.
              </span>
            </div>

            <div className="relative pt-1">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-1 h-4 w-px bg-white/30 -translate-x-1/2"
              />
              <input
                type="range"
                aria-label="Modo de Ataque do ERS"
                min={10}
                max={90}
                step={1}
                value={vehicleParams.ersDeployBiasPct}
                onChange={(e) => onUpdateParams({ ersDeployBiasPct: Number(e.target.value) })}
                className={SLIDER_CLASS}
              />
            </div>

            <div className="flex justify-between text-[10px] font-f1-mono text-zinc-400">
              <span>← Economia de Energia</span>
              <span className="text-zinc-500">50/50</span>
              <span>Ataque Total →</span>
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className={`inline-block text-[11px] font-f1-mono font-bold px-2.5 py-1 border ${ersModeBadge.cls}`}>
                {ersModeBadge.label}
              </span>
              {/* Tag Proteção Anti-Clipping ON/OFF */}
              <button
                type="button"
                onClick={() =>
                  onUpdateParams({
                    ersPreservationPct: antiClippingOn ? 15 : 65,
                  })
                }
                className={`inline-flex items-center gap-1.5 text-[10px] font-f1-mono font-bold px-2.5 py-1 border cursor-pointer transition-colors ${
                  antiClippingOn
                    ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
                    : 'bg-red-950/40 border-red-500/40 text-red-300'
                }`}
                title="Clique para ligar ou desligar a reserva automática de bateria contra corte no fim da reta"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Proteção Anti-Clipping: {antiClippingOn ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>

          {/* 3. Calor Gerado na Bateria (Substitui jargão mΩ / I²R na tela principal) */}
          <div className="border-t border-white/10 pt-3.5 space-y-1.5">
            <div className="flex justify-between items-center text-[11px] font-f1-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-white font-bold">Perda Térmica / Calor Gerado na Bateria</span>
                <div className="relative group inline-flex items-center">
                  <button
                    type="button"
                    aria-label="Detalhes técnicos da resistência elétrica da bateria"
                    title={`Resistência interna (R_int): ${rIntMOhm.toFixed(1)} mΩ | Perda I²R: ${jouleLossKw.toFixed(2)} kW.`}
                    className="text-zinc-400 hover:text-emerald-400 focus:text-emerald-400 transition-colors cursor-help"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                  <div className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity absolute left-0 bottom-full mb-1.5 z-20 w-72 bg-[#0D0D14] border border-emerald-500/40 p-2 text-[10px] text-zinc-200 leading-snug shadow-lg">
                    Detalhe técnico (SI): R_int = <strong className="text-amber-300">{rIntMOhm.toFixed(1)} mΩ</strong> ·
                    Perda elétrica: <strong className="text-amber-300">{jouleLossKw.toFixed(2)} kW</strong> (P = I²·R) convertidos em calor nas células.
                  </div>
                </div>
              </div>
              <span
                className={`font-bold ${
                  rIntLevel === 'low'
                    ? 'text-emerald-400'
                    : rIntLevel === 'moderate'
                    ? 'text-amber-400'
                    : 'text-red-400'
                }`}
              >
                Calor gerado: {batteryHeatLabel}
              </span>
            </div>

            <input
              type="range"
              aria-label="Perda Térmica da Bateria"
              disabled={isHardwareLocked}
              min={8}
              max={22}
              step={0.5}
              value={rIntMOhm}
              onChange={(e) => onUpdateParams({ batteryInternalResistanceMOhm: Number(e.target.value) })}
              className={SLIDER_CLASS}
            />

            <div className="flex justify-between text-[10px] font-f1-mono text-zinc-400">
              <span>← Frio e Eficiente (Menos Radiador)</span>
              <span>Esquenta Rápido (Risco de Corte) →</span>
            </div>
          </div>

          {/* 4. Acordeão "Configurações Avançadas de Software" (Preservação %, Limite kW, Química da Célula) */}
          <div className="border-t border-white/10 pt-3">
            <button
              type="button"
              onClick={() => setShowSoftwareAdvanced((prev) => !prev)}
              className="flex items-center justify-between w-full text-[11px] font-f1-mono uppercase tracking-wider text-zinc-300 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5 font-bold">
                {showSoftwareAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span>Configurações Avançadas de Software</span>
              </span>
              <span className="text-[10px] text-zinc-400">
                {vehicleParams.mgukMaxKw} kW · Reserva {ersPreservationPct}%
              </span>
            </button>

            {showSoftwareAdvanced && (
              <div className="mt-3 space-y-3 bg-[#1C1C26] border border-white/10 p-3">
                {/* Reserva Anti-Clipping Fina */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-f1-mono">
                    <span className="text-zinc-300">Reserva Mínima Anti-Clipping</span>
                    <span className="text-amber-400 font-bold tabular-nums">{ersPreservationPct}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={ersPreservationPct}
                    onChange={(e) => onUpdateParams({ ersPreservationPct: Number(e.target.value) })}
                    className={SLIDER_CLASS}
                  />
                  <span className="text-[10px] text-zinc-400 font-f1-mono block">
                    Guarda carga elétrica para impedir corte brusco de 350 kW antes da linha de chegada.
                  </span>
                </div>

                {/* Limite MGU-K kW */}
                <div className="space-y-1 pt-2 border-t border-white/5">
                  <div className="flex justify-between text-[11px] font-f1-mono">
                    <span className="text-zinc-300">Teto de Potência Elétrica MGU-K</span>
                    <span className="text-emerald-400 font-bold tabular-nums">{vehicleParams.mgukMaxKw} kW</span>
                  </div>
                  <input
                    type="range"
                    disabled={isHardwareLocked}
                    min={280}
                    max={350}
                    step={5}
                    value={vehicleParams.mgukMaxKw}
                    onChange={(e) => onUpdateParams({ mgukMaxKw: Number(e.target.value) })}
                    className={SLIDER_CLASS}
                  />
                  <div className="flex justify-between text-[10px] font-f1-mono text-zinc-400">
                    <span>280 kW (Poupa calor)</span>
                    <span>350 kW (Máximo FIA)</span>
                  </div>
                </div>

                {/* Química da Célula quando aplicável */}
                {activeBatterySpec.supportsSubChemistry && (
                  <div className="pt-2 border-t border-white/5 space-y-1.5">
                    <div className="text-[10px] font-f1-mono uppercase text-cyan-300 font-bold">
                      Química Interna da Célula (NCA vs Silício-Carbono)
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['nca', 'si_c'] as const).map((chemId) => {
                        const chem = BATTERY_SUB_CHEMISTRIES[chemId];
                        const active = activeSubChem === chemId;
                        return (
                          <button
                            key={chemId}
                            type="button"
                            disabled={isHardwareLocked || isCustomerOrPurchased}
                            onClick={() => onUpdateParams({ batterySubChemistry: chemId })}
                            className={`p-2 text-left border text-[10px] font-f1-mono transition-all ${
                              isHardwareLocked || isCustomerOrPurchased
                                ? 'opacity-65 cursor-not-allowed'
                                : 'cursor-pointer'
                            } ${
                              active
                                ? 'border-cyan-400 bg-cyan-950/40 text-white font-bold'
                                : 'border-white/10 bg-[#15151E] text-zinc-400 hover:text-white'
                            }`}
                          >
                            <div>{chem.label}</div>
                            <div className="text-[9px] text-zinc-400 font-normal mt-0.5">{chem.summary}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Telemetry Footer com Semáforo Visual & Impacto Direto no Chassi */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <div className="bg-[#15151E] border border-white/10 p-3 space-y-2">
          <div className="text-[10px] font-f1-mono text-zinc-400 uppercase tracking-widest border-b border-white/5 pb-1">
            Desempenho Medido na Bancada
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs font-f1-mono tabular-nums">
            <div className="bg-[#1C1C26] p-2.5 border border-white/5">
              <span className="text-[10px] text-zinc-400 uppercase block">POTÊNCIA TOTAL</span>
              <span className="text-white font-bold text-sm">{Math.round(totalPowerHp)} CV</span>
              <span className="text-[10px] text-emerald-400 block">
                {totalPowerKw.toFixed(0)} kW · Híbrido
              </span>
            </div>

            <div className="bg-[#1C1C26] p-2.5 border border-white/5">
              <span className="text-[10px] text-zinc-400 uppercase block">DIVISÃO HÍBRIDA</span>
              <span className="text-amber-400 font-bold text-sm">
                {icePowerKw.toFixed(0)} / {mgukPowerKw.toFixed(0)} kW
              </span>
              <span
                className={`text-[10px] block ${
                  pu.thermalAndLubrication.derateApplied ? 'text-red-400 font-bold' : 'text-zinc-400'
                }`}
              >
                {pu.thermalAndLubrication.derateApplied ? '⚠️ Corte Térmico Ativo' : 'Entrega Linear'}
              </span>
            </div>

            <div className="bg-[#1C1C26] p-2.5 border border-white/5">
              <span className="text-[10px] text-zinc-400 uppercase block">CALOR ELÉTRICO</span>
              <span
                className={`font-bold text-sm ${
                  rIntLevel === 'low'
                    ? 'text-emerald-400'
                    : rIntLevel === 'moderate'
                    ? 'text-amber-300'
                    : 'text-red-400'
                }`}
              >
                {batteryHeatLabel}
              </span>
              <span className="text-[10px] text-zinc-400 block">
                {rIntLevel === 'high' ? 'Pede radiador extra' : 'Fluxo estável'}
              </span>
            </div>
          </div>
        </div>

        {/* Semáforo Térmico Visual + Termômetro */}
        <div
          className={`border p-3 space-y-2 ${
            trafficLightState === 'red'
              ? 'bg-red-950/30 border-red-500/60'
              : trafficLightState === 'amber'
              ? 'bg-amber-950/20 border-amber-500/40'
              : 'bg-[#15151E] border-white/10'
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/5 pb-1">
            <span className="text-[10px] font-f1-mono text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
              <Thermometer
                className={`w-3.5 h-3.5 ${
                  trafficLightState === 'red'
                    ? 'text-red-400'
                    : trafficLightState === 'amber'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              />
              <span>Semáforo Térmico & Durabilidade</span>
            </span>

            {/* Semáforo Verde / Amarelo / Vermelho */}
            <div className="flex items-center gap-1.5 bg-[#0D0D14] px-2 py-0.5 border border-white/10">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  trafficLightState === 'green' ? 'bg-emerald-400' : 'bg-zinc-700'
                }`}
                title="Temperatura Segura"
              />
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  trafficLightState === 'amber' ? 'bg-amber-400' : 'bg-zinc-700'
                }`}
                title="Atenção Térmica"
              />
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  trafficLightState === 'red' ? 'bg-red-500' : 'bg-zinc-700'
                }`}
                title="Risco de Superaquecimento"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs font-f1-mono tabular-nums">
            <div className="bg-[#1C1C26] p-2.5 border border-white/5">
              <span className="text-[10px] text-zinc-400 uppercase block">TEMPERATURA</span>
              <span
                className={`font-bold text-sm ${
                  trafficLightState === 'red' ? 'text-red-400' : 'text-cyan-300'
                }`}
              >
                {iceTempC.toFixed(0)}° / {batTempC.toFixed(0)}° / {oilTempC.toFixed(0)}°C
              </span>
              <span
                className={`text-[10px] block ${
                  trafficLightState === 'red'
                    ? 'text-red-400 font-bold'
                    : trafficLightState === 'amber'
                    ? 'text-amber-300'
                    : 'text-emerald-400'
                }`}
              >
                {trafficLightState === 'red'
                  ? 'Crítico'
                  : trafficLightState === 'amber'
                  ? 'Atenção ao Calor'
                  : 'Faixa Segura'}
              </span>
            </div>

            <div className="bg-[#1C1C26] p-2.5 border border-white/5">
              <span className="text-[10px] text-zinc-400 uppercase block">TURBO (CURVA/RETA)</span>
              <span className="font-bold text-sm text-white">
                {turboResponsePct}% / {turboTopEndPct}%
              </span>
              <span className="text-[10px] text-zinc-400 block">{turboCategory}</span>
            </div>

            <div className="bg-[#1C1C26] p-2.5 border border-white/5">
              <span className="text-[10px] text-zinc-400 uppercase block">VIDA ÚTIL DA PU</span>
              <span className={`font-bold text-sm ${highEngineBreakRisk ? 'text-red-400' : 'text-emerald-400'}`}>
                ~{pu.reliability.estimatedPuLifeRaces.toFixed(0)} GPs
              </span>
              <span className={`text-[10px] block ${highEngineBreakRisk ? 'text-red-400 font-bold' : 'text-zinc-400'}`}>
                {highEngineBreakRisk ? 'Desgaste Severo' : 'Operação Estável'}
              </span>
            </div>
          </div>

          {trafficLightState === 'red' && (
            <div className="bg-red-950/60 border border-red-500/70 px-3 py-2 text-[11px] font-f1-mono text-red-200 font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>
                ⚠️ Risco de Superaquecimento: O carro vai perder potência após 10 voltas se mantiver esse nível de estresse.
              </span>
            </div>
          )}
        </div>
      </div>

      {pu.domainStatus.warnings.length > 0 && (
        <div className="bg-red-950/35 border border-red-500/50 p-3 text-[11px] font-f1-mono text-red-200 flex items-start gap-2">
          <Gauge className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            {pu.domainStatus.warnings.map((w, idx) => (
              <div key={idx}>• {w}</div>
            ))}
          </div>
        </div>
      )}

      {/* BOM (Bill of Materials) Modal */}
      {showBomModal && (
        <div className="fixed inset-0 z-[140] bg-black/85 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1C1C26] border border-cyan-500/50 max-w-4xl w-full p-5 space-y-4 my-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-f1-mono text-cyan-400 uppercase tracking-widest block">
                  BILL OF MATERIALS (BOM) & REGULAMENTO FIA 2026
                </span>
                <h4 className="font-f1-wide font-black text-base text-white uppercase">
                  Lista Real de Materiais — {dnaSpec.puDesignation}
                </h4>
              </div>
              <button
                type="button"
                aria-label="Fechar BOM"
                onClick={() => setShowBomModal(false)}
                className="p-1.5 border border-white/10 bg-[#15151E] hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#15151E] border border-white/10 p-3 text-xs font-f1-mono space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-amber-400 font-bold uppercase">
                  DNA do Fabricante: {dnaSpec.philosophyTitle}
                </span>
                <span className="text-[10px] text-zinc-400">{dnaSpec.aduoTierLabel}</span>
              </div>
              <p className="text-zinc-300 text-[11px]">{dnaSpec.summary}</p>
            </div>

            <div className="overflow-x-auto border border-white/10">
              <table className="w-full text-left text-[11px] font-f1-mono">
                <thead className="bg-[#15151E] text-zinc-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">Componente</th>
                    <th className="p-2.5">Material / Liga Homologada</th>
                    <th className="p-2.5">Fornecedor</th>
                    <th className="p-2.5 text-right">Custo Unitário</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-[#191922] text-zinc-200">
                  {[...activeIceSpec.bomItems, ...activeBatterySpec.bomItems].map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-bold text-white">{item.component}</td>
                      <td className="p-2.5">
                        <div>{item.material}</div>
                        <div className="text-[10px] text-zinc-400">{item.notes}</div>
                      </td>
                      <td className="p-2.5 text-zinc-300">{item.supplier}</td>
                      <td className="p-2.5 text-right text-amber-300 font-bold tabular-nums">
                        ${item.unitCostUsd.toLocaleString('en-US')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-[#15151E] border border-white/10 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-f1-mono text-emerald-400 font-bold uppercase flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>Projetos de Pesquisa de Materiais (P&D)</span>
                </span>
                {onGoToResearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowBomModal(false);
                      onGoToResearch();
                    }}
                    className="text-[10px] font-f1-mono text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                  >
                    Abrir Árvore de Pesquisa (P&D)
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] font-f1-mono">
                {PU_MATERIAL_RESEARCH_PROJECTS.map((proj) => {
                  const unlocked = effectiveUnlocked.has(proj.targetMaterialId);
                  return (
                    <div
                      key={proj.id}
                      className={`p-2 border ${
                        unlocked ? 'border-emerald-500/40 bg-emerald-950/20' : 'border-white/10 bg-[#1C1C26]'
                      }`}
                    >
                      <div className="font-bold text-white">{proj.title}</div>
                      <div className="text-zinc-400 mt-0.5">
                        ${(proj.costUsd / 1e6).toFixed(1)}M · {proj.durationWeeks} sem
                      </div>
                      <div className={`mt-1 font-bold ${unlocked ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {unlocked ? 'DESBLOQUEADO' : 'BLOQUEADO (P&D)'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
