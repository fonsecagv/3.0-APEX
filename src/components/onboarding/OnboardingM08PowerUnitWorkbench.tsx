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
} from 'lucide-react';
import type { VehicleEngineeringParameters } from '../../types/physics';
import type { CustomerEngineSupplier } from '../../types/f1';
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

interface OnboardingM08PowerUnitWorkbenchProps {
  vehicleParams: VehicleEngineeringParameters;
  onUpdateParams: (patch: Partial<VehicleEngineeringParameters>) => void;
  isHardwareLocked: boolean;
  isCustomerOrPurchased: boolean;
  supplierName?: CustomerEngineSupplier | 'In-House' | string | null;
  unlockedMaterials?: string[];
  onGoToResearch?: () => void;
}

const SLIDER_BASE =
  'w-full appearance-none bg-transparent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-amber-200 [&::-webkit-slider-thumb]:-mt-1 [&::-moz-range-track]:h-1.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-amber-500 [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-amber-200';

const SLIDER_CLASS = `${SLIDER_BASE} [&::-webkit-slider-runnable-track]:bg-zinc-800 [&::-moz-range-track]:bg-zinc-800`;
const SLIDER_TRANSPARENT_TRACK = `${SLIDER_BASE} relative z-10 [&::-webkit-slider-runnable-track]:bg-transparent [&::-moz-range-track]:bg-transparent`;

const ICE_ORDER: IceMetallurgyId[] = ['fia_iron_ams6487', 'ferrari_steel_head', 'al_si_low_friction'];
const BATTERY_ORDER: BatteryArchitectureId[] = ['lightweight_lithium', 'dense_pack', 'ultra_solid_state'];

export const OnboardingM08PowerUnitWorkbench: React.FC<OnboardingM08PowerUnitWorkbenchProps> = ({
  vehicleParams,
  onUpdateParams,
  isHardwareLocked,
  isCustomerOrPurchased,
  supplierName,
  unlockedMaterials,
  onGoToResearch,
}) => {
  const [showTurboAdvanced, setShowTurboAdvanced] = useState(false);
  const [showErsAdvanced, setShowErsAdvanced] = useState(false);
  const [showCellChemistry, setShowCellChemistry] = useState(false);
  const [showBomModal, setShowBomModal] = useState(false);

  const turboArRatio = vehicleParams.turboArRatio ?? 0.92;
  const ersPreservationPct = vehicleParams.ersPreservationPct ?? 55;

  const dnaSpec = useMemo(() => getSupplierDnaSpec(supplierName), [supplierName]);
  const effectiveUnlocked = useMemo(
    () => new Set(unlockedMaterials && unlockedMaterials.length > 0 ? unlockedMaterials : dnaSpec.starterUnlockedMaterials),
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

  // Compressão do motor: estados claros para Team Principal
  const compRatio = vehicleParams.iceCompressionRatio;
  const compRiskLevel = compRatio <= 14.8 ? 'low' : compRatio <= 15.4 ? 'moderate' : 'high';
  const compGainLabel = compRiskLevel === 'low' ? 'Baixo' : compRiskLevel === 'moderate' ? 'Médio' : 'Alto';
  const compHeatLabel = compRiskLevel === 'low' ? 'Seguro' : compRiskLevel === 'moderate' ? 'Moderado' : 'CRÍTICO';

  // Turbo categorization aligned cleanly with 78-86 / 87-95 / 96-104 mm
  const turboDiam = vehicleParams.turboDiameterMm;
  const turboCategory = turboDiam <= 86 ? 'Pequeno' : turboDiam <= 95 ? 'Padrão' : 'Grande';
  const turboResponseLabel = turboDiam <= 86 ? 'Rápida' : turboDiam <= 95 ? 'Média' : 'Lenta';
  const turboTopEndLabel = turboDiam <= 86 ? 'Baixa' : turboDiam <= 95 ? 'Média' : 'Alta';

  // Semáforo combinado de risco de quebra do motor (Compressão extrema + Turbo grande ou margem térmica crítica)
  const highEngineBreakRisk =
    (compRatio >= 15.8 && turboDiam >= 100) ||
    (compRatio >= 15.5 && turboDiam >= 98) ||
    pu.thermalAndLubrication.thermalMarginK < 4 ||
    pu.thermalAndLubrication.derateApplied;

  // ERS strategy & battery resistance classification
  const deployPct = Math.round(vehicleParams.ersDeployBiasPct);
  const regenPct = 100 - deployPct;
  const ersModeBadge =
    deployPct <= 42
      ? {
          label: 'Modo: Economia (Defende posição)',
          cls: 'text-emerald-300 border-emerald-500/40 bg-emerald-950/35',
        }
      : deployPct >= 62
      ? {
          label: 'Modo: Ataque (Gasta mais bateria)',
          cls: 'text-amber-300 border-amber-500/45 bg-amber-950/40',
        }
      : {
          label: 'Modo: Equilibrado',
          cls: 'text-zinc-200 border-white/15 bg-[#1C1C26]',
        };

  const jouleLossKw = pu.ersAndBattery.jouleLossW / 1000;
  const rIntMOhm = vehicleParams.batteryInternalResistanceMOhm;
  const rIntLevel: 'low' | 'moderate' | 'high' =
    rIntMOhm <= 12.0 ? 'low' : rIntMOhm <= 16.5 ? 'moderate' : 'high';
  const rIntLevelLabel = rIntLevel === 'low' ? 'Baixa' : rIntLevel === 'moderate' ? 'Média' : 'Alta';

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

  return (
    <div className="bg-[#1C1C26] border border-cyan-500/30 p-5 space-y-5 f1-container-bucket">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-f1-mono text-cyan-400 font-bold uppercase tracking-widest">
              M08 · CALIBRAÇÃO DA UNIDADE DE POTÊNCIA (F1 2026)
            </span>
            <span
              className={`text-[10px] font-f1-mono px-2 py-0.5 border font-bold uppercase inline-flex items-center gap-1 ${
                gate08.passed
                  ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-400'
                  : 'bg-red-950/50 border-red-500/40 text-red-400'
              }`}
            >
              {gate08.passed ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
              <span>HOMOLOGAÇÃO: {gate08.passed ? 'APROVADA' : 'ATENÇÃO'}</span>
            </span>
            {supplierName && (
              <span className="text-[10px] font-f1-mono px-2 py-0.5 border border-white/15 bg-[#15151E] text-zinc-300 uppercase">
                Motor: {dnaSpec.puDesignation}
              </span>
            )}
          </div>
          <h3 className="font-f1-wide font-black text-base text-white uppercase mt-1">
            Ajuste de Performance, Retas & Confiabilidade (Motor + Elétrico)
          </h3>
          <p className="text-xs text-zinc-400 font-f1-mono">
            Equilibre velocidade na reta, resposta nas curvas e resistência ao calor ao longo da corrida.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setShowBomModal(true)}
            className="text-[10px] font-f1-mono bg-[#15151E] hover:bg-white/10 border border-cyan-500/40 text-cyan-300 px-3 py-1.5 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Ver BOM / Detalhes da Peça</span>
          </button>
          {(isHardwareLocked || isCustomerOrPurchased) && (
            <div className="text-[10px] font-f1-mono bg-amber-950/40 border border-amber-500/40 text-amber-300 px-3 py-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>
                {isCustomerOrPurchased
                  ? 'Homologado pelo Fornecedor — Apenas Software ERS editável'
                  : 'Hardware selado pela FIA — Apenas Software ERS editável'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Controls Grid: ICE & Turbo (Left) + ERS & Battery (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT COLUMN: ICE + TURBO */}
        <div className="bg-[#15151E] border border-white/10 p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-f1-wide font-bold text-amber-400 uppercase flex items-center gap-1.5">
              <Flame className="w-4 h-4" />
              <span>Motor a Combustão & Turbo</span>
            </span>
            <span className="text-[10px] font-f1-mono text-zinc-400">
              {isCustomerOrPurchased ? `Homologado (${dnaSpec.supplier})` : 'Projeto Fabricante'}
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
                    {activeIceSpec.tooltip} (Pistão homologado: {activeIceSpec.pistonAlloyCode})
                  </div>
                </div>
              </div>
              {isCustomerOrPurchased && (
                <span className="text-[10px] font-f1-mono px-2 py-0.5 bg-amber-950/40 border border-amber-500/40 text-amber-300 inline-flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Homologado pelo Fornecedor</span>
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

          {/* 2. Compressão do Motor */}
          <div className="space-y-1.5 border-t border-white/10 pt-3.5">
            <div className="flex justify-between items-center text-xs font-f1-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-200 font-bold">Compressão do Motor</span>
                <div className="relative group inline-flex items-center">
                  <button
                    type="button"
                    aria-label="Detalhes técnicos da compressão do motor"
                    title={`Razão de compressão (r_c · Teto FIA 16.0:1). Eficiência térmica atual: ${(pu.shaftAndIce.iceThermalEfficiency * 100).toFixed(1)}%.`}
                    className="text-zinc-400 hover:text-amber-400 focus:text-amber-400 transition-colors cursor-help"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                  <div className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity absolute left-0 bottom-full mb-1.5 z-20 w-72 bg-[#0D0D14] border border-amber-500/40 p-2.5 text-[10px] text-zinc-200 leading-snug shadow-lg">
                    Razão de compressão (r_c · Limite máximo FIA 2026: 16.0:1). Eficiência térmica atual (η_th):{' '}
                    <strong className="text-amber-300">{(pu.shaftAndIce.iceThermalEfficiency * 100).toFixed(1)}%</strong>. Valores maiores geram mais potência, mas aumentam calor e desgaste.
                  </div>
                </div>
              </div>
              <span
                className={`font-bold text-sm tabular-nums ${
                  compRiskLevel === 'high'
                    ? 'text-red-400'
                    : compRiskLevel === 'moderate'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {compRatio.toFixed(1)}:1
              </span>
            </div>
            <input
              type="range"
              aria-label="Compressão do Motor"
              disabled={isHardwareLocked}
              min={14.0}
              max={16.0}
              step={0.1}
              value={compRatio}
              onChange={(e) => onUpdateParams({ iceCompressionRatio: Number(e.target.value) })}
              className={SLIDER_CLASS}
            />
            <div className="flex justify-between text-[10px] font-f1-mono text-zinc-400">
              <span>Mais Confiável</span>
              <span>Mais Potência</span>
            </div>
            <div
              className={`text-[11px] font-f1-mono px-2.5 py-1.5 border flex flex-wrap items-center justify-between gap-2 ${
                compRiskLevel === 'high'
                  ? 'bg-red-950/35 border-red-500/50 text-red-200'
                  : compRiskLevel === 'moderate'
                  ? 'bg-[#1C1C26] border-amber-500/30 text-zinc-200'
                  : 'bg-emerald-950/25 border-emerald-500/35 text-emerald-200'
              }`}
            >
              <span>
                Ganho de Aceleração: <strong className="text-white">{compGainLabel}</strong>
              </span>
              <span>
                Risco de Superaquecimento:{' '}
                <strong
                  className={
                    compRiskLevel === 'high'
                      ? 'text-red-400 uppercase'
                      : compRiskLevel === 'moderate'
                      ? 'text-amber-300'
                      : 'text-emerald-400'
                  }
                >
                  {compHeatLabel}
                </strong>
              </span>
            </div>
          </div>

          {/* 3. Diâmetro da Roda do Turbo — Limpo, Zona Colorida na Barra, Consequência na Pista */}
          <div className="space-y-2 border-t border-white/10 pt-3.5">
            <div className="flex items-center justify-between gap-2 text-xs font-f1-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-200 font-bold">Diâmetro da Roda do Turbo</span>
                <div className="relative group inline-flex items-center">
                  <button
                    type="button"
                    aria-label="Explicação do Diâmetro da Roda do Turbo"
                    title={`Turbo menor responde mais cedo nas saídas de curva; turbo maior entrega velocidade máxima nas retas. Lag técnico estimado: ${pu.turbocharger.spoolLagMs.toFixed(0)} ms.`}
                    className="text-zinc-400 hover:text-amber-400 focus:text-amber-400 transition-colors cursor-help"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                  <div className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity absolute left-0 bottom-full mb-1.5 z-20 w-72 bg-[#0D0D14] border border-amber-500/40 p-2.5 text-[10px] text-zinc-200 leading-snug shadow-lg">
                    Turbo menor (78 mm) enche rápido na saída de curva. Turbo maior (104 mm) demora mais para responder, mas voa no fim da reta.
                    <span className="block mt-1 text-zinc-400">
                      Dado técnico: atraso de spool estimado em {pu.turbocharger.spoolLagMs.toFixed(0)} ms (PR {pu.turbocharger.operatingPoint.pressureRatio.toFixed(2)}).
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-amber-400 font-bold text-sm tabular-nums">{turboDiam} mm</span>
            </div>

            {/* Feedback de Consequência Dinâmica Acima do Slider (sem ms técnicos) */}
            <div className="flex items-center justify-between text-[11px] font-f1-mono bg-[#1C1C26] border border-white/10 px-2.5 py-1.5">
              <span className="text-zinc-300">
                Resposta: <strong className="text-white">{turboResponseLabel}</strong>
              </span>
              <span className="text-zinc-300">
                Vel. Máxima: <strong className="text-white">{turboTopEndLabel}</strong>
              </span>
            </div>

            {/* Rótulos centralizados sobre zonas + Barra colorida na própria trilha do slider */}
            <div className="space-y-1">
              <div className="flex w-full text-[10px] font-f1-mono uppercase tracking-wider">
                <div
                  className={`w-[32.7%] text-center transition-colors ${
                    turboCategory === 'Pequeno' ? 'text-sky-300 font-bold' : 'text-zinc-500'
                  }`}
                >
                  Pequeno
                </div>
                <div
                  className={`w-[34.6%] text-center transition-colors ${
                    turboCategory === 'Padrão' ? 'text-zinc-100 font-bold' : 'text-zinc-500'
                  }`}
                >
                  Padrão
                </div>
                <div
                  className={`w-[32.7%] text-center transition-colors ${
                    turboCategory === 'Grande' ? 'text-amber-300 font-bold' : 'text-zinc-500'
                  }`}
                >
                  Grande
                </div>
              </div>

              <div className="relative flex items-center h-4">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 h-1.5 flex overflow-hidden border border-white/10"
                >
                  <div className="w-[32.7%] bg-sky-500/35" />
                  <div className="w-[34.6%] bg-zinc-500/35 border-x border-white/15" />
                  <div className="w-[32.7%] bg-amber-500/40" />
                </div>
                <input
                  type="range"
                  aria-label="Diâmetro da Roda do Turbo"
                  disabled={isHardwareLocked}
                  min={78}
                  max={104}
                  step={1}
                  value={turboDiam}
                  onChange={(e) => onUpdateParams({ turboDiameterMm: Number(e.target.value) })}
                  className={SLIDER_TRANSPARENT_TRACK}
                />
              </div>

              <div className="flex justify-between text-[10px] font-f1-mono text-zinc-500 tabular-nums">
                <span>78 mm</span>
                <span>104 mm</span>
              </div>
            </div>

            {/* Acordeão Avançado (Carcaça A/R) */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowTurboAdvanced((prev) => !prev)}
                className="flex items-center gap-1.5 text-[10px] font-f1-mono uppercase tracking-wider text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer"
              >
                {showTurboAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span>Ajuste Fino do Turbo (Avançado)</span>
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

          {/* Semáforo de Risco Combinado (Compressão + Turbo / Margem Térmica) */}
          {highEngineBreakRisk && (
            <div className="bg-red-950/45 border border-red-500/70 p-2.5 text-[11px] font-f1-mono text-red-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-red-300 block">⚠️ Risco Alto de Quebra do Motor</span>
                <span className="text-[10px] text-red-200/90">
                  Pressão e calor excessivos podem causar perda de potência ou abandono na corrida. Reduza a compressão ou o tamanho do turbo.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: ERS & BATTERY */}
        <div className="bg-[#15151E] border border-white/10 p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-f1-wide font-bold text-emerald-400 uppercase flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              <span>Sistema Elétrico & Bateria (ERS)</span>
            </span>
            <span className="text-[10px] font-f1-mono text-zinc-400">Potência & Energia na Volta</span>
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

              {activeBatterySpec.supportsSubChemistry && (
                <button
                  type="button"
                  onClick={() => setShowCellChemistry((prev) => !prev)}
                  className="text-[10px] font-f1-mono text-cyan-400 hover:text-cyan-300 underline cursor-pointer shrink-0"
                >
                  {showCellChemistry ? 'Ocultar Química' : 'Ver Química da Célula'}
                </button>
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
                <span className="text-[10px] text-amber-300">Homologado</span>
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

            {/* Sub-opção Química da Célula (NCA vs Silício-Carbono) */}
            {activeBatterySpec.supportsSubChemistry && showCellChemistry && (
              <div className="bg-[#1C1C26] border border-cyan-500/30 p-2.5 space-y-2">
                <div className="text-[10px] font-f1-mono uppercase text-cyan-300 font-bold">
                  Química Interna da Célula (Detalhes Avançados)
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
                          isHardwareLocked || isCustomerOrPurchased ? 'opacity-65 cursor-not-allowed' : 'cursor-pointer'
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

          {/* 2. Stat Box Limite MGU-K + Acordeão Avançado (Derating) */}
          <div className="border-t border-white/10 pt-3.5 space-y-2">
            <div className="flex items-center justify-between bg-[#1C1C26] border border-white/10 px-3 py-2">
              <div className="text-xs font-f1-mono">
                <span className="text-zinc-400 block text-[10px] uppercase">Potência Máxima do Motor Elétrico</span>
                <span className="text-emerald-400 font-bold tabular-nums">
                  {vehicleParams.mgukMaxKw} kW{' '}
                  <span className="text-zinc-400 font-normal">· Máximo permitido pela FIA (350 kW)</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowErsAdvanced((prev) => !prev)}
                className="flex items-center gap-1 text-[10px] font-f1-mono uppercase text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer"
              >
                {showErsAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span>Avançado</span>
              </button>
            </div>

            {showErsAdvanced && (
              <div className="bg-[#1C1C26] border border-white/10 p-3 space-y-1.5">
                <div className="flex justify-between text-[11px] font-f1-mono">
                  <span className="text-zinc-300">Limitar Potência Elétrica (Poupar Calor)</span>
                  <span className="text-amber-400 font-bold tabular-nums">{vehicleParams.mgukMaxKw} kW</span>
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
                  <span>280 kW (Menos calor)</span>
                  <span>350 kW (Potência máxima)</span>
                </div>
              </div>
            )}
          </div>

          {/* 3. Estratégia Bidirecional ERS + Preservação de Energia */}
          <div className="border-t border-white/10 pt-3.5 space-y-3">
            {/* Slider Bidirecional Recuperação <-> Deploy */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-f1-mono">
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-200 font-bold">Mapa Deploy ERS</span>
                  <div className="relative group inline-flex items-center">
                    <button
                      type="button"
                      aria-label="Detalhes técnicos do Mapa Deploy ERS"
                      title={`Distribuição atual de software: ${deployPct}% Deploy / ${regenPct}% Recuperação nas freadas.`}
                      className="text-zinc-400 hover:text-emerald-400 focus:text-emerald-400 transition-colors cursor-help"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                    <div className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity absolute left-0 bottom-full mb-1.5 z-20 w-64 bg-[#0D0D14] border border-emerald-500/40 p-2 text-[10px] text-zinc-200 leading-snug shadow-lg">
                      Define o quanto o carro gasta bateria nas retas ({deployPct}% Deploy) versus o quanto recarrega nas freadas ({regenPct}% Recuperação).
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
                  aria-label="Mapa Deploy ERS Bidirecional"
                  min={10}
                  max={90}
                  step={1}
                  value={vehicleParams.ersDeployBiasPct}
                  onChange={(e) => onUpdateParams({ ersDeployBiasPct: Number(e.target.value) })}
                  className={SLIDER_CLASS}
                />
              </div>

              <div className="flex justify-between text-[10px] font-f1-mono text-zinc-400">
                <span>← Recuperação</span>
                <span className="text-zinc-500">50/50</span>
                <span>Deploy →</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className={`inline-block text-[11px] font-f1-mono font-bold px-2.5 py-1 border ${ersModeBadge.cls}`}>
                  {ersModeBadge.label}
                </span>
              </div>
            </div>

            {/* Preservação de Energia (Anti-Clipping sem jargão SOC) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px] font-f1-mono gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-200 font-bold">Preservação de Energia</span>
                  <div className="relative group inline-flex items-center">
                    <button
                      type="button"
                      aria-label="Detalhes do controle de reserva da bateria"
                      title="Reserva mínima de carga (SOC / Anti-Clipping) para evitar que o carro perca potência elétrica antes do fim da reta."
                      className="text-zinc-400 hover:text-emerald-400 focus:text-emerald-400 transition-colors cursor-help"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                    <div className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity absolute left-0 bottom-full mb-1.5 z-20 w-64 bg-[#0D0D14] border border-emerald-500/40 p-2 text-[10px] text-zinc-200 leading-snug shadow-lg">
                      Sistema Anti-Clipping (controle de State of Charge — SOC): guarda energia elétrica para evitar corte repentino de potência no fim das retas longas.
                    </div>
                  </div>
                </div>
                <span className="text-amber-400 font-bold tabular-nums">{ersPreservationPct}%</span>
              </div>
              <input
                type="range"
                aria-label="Preservação de Energia"
                min={0}
                max={100}
                step={5}
                value={ersPreservationPct}
                onChange={(e) => onUpdateParams({ ersPreservationPct: Number(e.target.value) })}
                className={SLIDER_CLASS}
              />
              <div className="flex justify-between items-center text-[10px] font-f1-mono text-zinc-400 gap-2">
                <span>Usar Tudo (Risco de Acabar no meio da reta)</span>
                <span className="text-right">Economizar Tudo (Foco em defesa)</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <span className="text-[11px] font-f1-mono text-zinc-300">
                  Estratégia: <strong className="text-white">Guardar {ersPreservationPct}% da energia para o final da corrida.</strong>
                </span>
                {pu.ersAndBattery.clippingRiskLevel === 'high' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-f1-mono text-red-300 font-bold bg-red-950/45 border border-red-500/50 px-2 py-0.5">
                    <AlertTriangle className="w-3 h-3 text-red-400" />
                    <span>⚠️ Risco de Faltar Bateria na Reta</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 4. Resistência da Bateria (esconde mΩ e I²R no tooltip) */}
          <div className="border-t border-white/10 pt-3.5 space-y-1.5">
            <div className="flex justify-between items-center text-[11px] font-f1-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-200 font-bold">Resistência da Bateria</span>
                <div className="relative group inline-flex items-center">
                  <button
                    type="button"
                    aria-label="Detalhes técnicos da resistência interna da bateria"
                    title={`Resistência interna (R_int): ${rIntMOhm.toFixed(1)} mΩ | Perda térmica I²R: ${jouleLossKw.toFixed(2)} kW.`}
                    className="text-zinc-400 hover:text-emerald-400 focus:text-emerald-400 transition-colors cursor-help"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                  <div className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity absolute left-0 bottom-full mb-1.5 z-20 w-72 bg-[#0D0D14] border border-emerald-500/40 p-2 text-[10px] text-zinc-200 leading-snug shadow-lg">
                    Medida elétrica interna (R_int): <strong className="text-amber-300">{rIntMOhm.toFixed(1)} mΩ</strong>.
                    Perda por efeito Joule (I²R): <strong className="text-amber-300">{jouleLossKw.toFixed(2)} kW</strong> convertidos em calor nas células.
                  </div>
                </div>
              </div>
              <span
                className={`font-bold ${
                  rIntLevel === 'low' ? 'text-emerald-400' : rIntLevel === 'moderate' ? 'text-amber-400' : 'text-red-400'
                }`}
              >
                {rIntLevelLabel}
              </span>
            </div>
            <input
              type="range"
              aria-label="Resistência da Bateria"
              disabled={isHardwareLocked}
              min={8}
              max={22}
              step={0.5}
              value={rIntMOhm}
              onChange={(e) => onUpdateParams({ batteryInternalResistanceMOhm: Number(e.target.value) })}
              className={SLIDER_CLASS}
            />
            <div
              className={`text-[11px] font-f1-mono px-2.5 py-1.5 border flex flex-wrap items-center justify-between gap-2 ${
                rIntLevel === 'low'
                  ? 'bg-emerald-950/25 border-emerald-500/35 text-emerald-200'
                  : rIntLevel === 'moderate'
                  ? 'bg-[#1C1C26] border-amber-500/35 text-amber-200'
                  : 'bg-red-950/40 border-red-500/50 text-red-200'
              }`}
            >
              {rIntLevel === 'low' && (
                <>
                  <span>
                    Perda de Energia: <strong className="text-emerald-400">Baixa</strong>
                  </span>
                  <span>
                    Aquecimento: <strong className="text-emerald-400">Baixo</strong>
                  </span>
                </>
              )}
              {rIntLevel === 'moderate' && (
                <>
                  <span>
                    Perda de Energia: <strong className="text-amber-300">Média</strong>
                  </span>
                  <span>
                    Aquecimento: <strong className="text-amber-300">Moderado</strong>
                  </span>
                </>
              )}
              {rIntLevel === 'high' && (
                <>
                  <span>
                    Perda de Energia: <strong className="text-red-300">Alta (Bateria esquenta)</strong>
                  </span>
                  <span>
                    <strong className="text-red-400">Risco de Corte de Potência</strong>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry Footer Agrupado em Desempenho na Pista + Confiabilidade */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <div className="bg-[#15151E] border border-white/10 p-3 space-y-2">
          <div className="text-[10px] font-f1-mono text-zinc-400 uppercase tracking-widest border-b border-white/5 pb-1">
            Desempenho na Pista
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs font-f1-mono tabular-nums">
            <div className="bg-[#1C1C26] p-2.5 border border-white/5">
              <span className="text-[10px] text-zinc-400 uppercase block">POTÊNCIA TOTAL</span>
              <span className="text-white font-bold text-sm">{Math.round(totalPowerHp)} CV</span>
              <span className="text-[10px] text-emerald-400 block">
                {totalPowerKw.toFixed(0)} kW · Motor + Elétrico
              </span>
            </div>

            <div className="bg-[#1C1C26] p-2.5 border border-white/5">
              <span className="text-[10px] text-zinc-400 uppercase block">ENTREGA HÍBRIDA</span>
              <span className="text-amber-400 font-bold text-sm">
                {icePowerKw.toFixed(0)} / {mgukPowerKw.toFixed(0)} kW
              </span>
              <span
                className={`text-[10px] block ${
                  pu.thermalAndLubrication.derateApplied ? 'text-red-400 font-bold' : 'text-zinc-400'
                }`}
              >
                {pu.thermalAndLubrication.derateApplied ? '⚠️ Corte de Potência Ativo' : 'Entrega Normal'}
              </span>
            </div>

            <div className="bg-[#1C1C26] p-2.5 border border-white/5">
              <span className="text-[10px] text-zinc-400 uppercase block">EFICIÊNCIA ELÉTRICA</span>
              <span
                className={`font-bold text-sm ${
                  rIntLevel === 'low' ? 'text-emerald-400' : rIntLevel === 'moderate' ? 'text-amber-300' : 'text-red-400'
                }`}
              >
                Perda {rIntLevelLabel}
              </span>
              <span className="text-[10px] text-zinc-400 block">
                {rIntLevel === 'high' ? 'Bateria esquenta rápido' : 'Fluxo estável de energia'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#15151E] border border-white/10 p-3 space-y-2">
          <div className="text-[10px] font-f1-mono text-zinc-400 uppercase tracking-widest border-b border-white/5 pb-1">
            Confiabilidade & Limite Térmico
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs font-f1-mono tabular-nums">
            <div className="bg-[#1C1C26] p-2.5 border border-white/5">
              <span className="text-[10px] text-zinc-400 uppercase block">TEMPERATURA</span>
              <span
                className={`font-bold text-sm ${
                  pu.thermalAndLubrication.thermalMarginK < 4 ? 'text-red-400' : 'text-cyan-300'
                }`}
              >
                {iceTempC.toFixed(0)}° / {batTempC.toFixed(0)}° / {oilTempC.toFixed(0)}°C
              </span>
              <span
                className={`text-[10px] block ${
                  pu.thermalAndLubrication.thermalMarginK < 4
                    ? 'text-red-400 font-bold'
                    : pu.thermalAndLubrication.thermalMarginK < 10
                    ? 'text-amber-300'
                    : 'text-emerald-400'
                }`}
              >
                {pu.thermalAndLubrication.thermalMarginK < 4
                  ? '⚠️ Superaquecimento Crítico'
                  : pu.thermalAndLubrication.thermalMarginK < 10
                  ? 'Atenção ao Calor'
                  : 'Temperatura Segura'}
              </span>
            </div>

            <div className="bg-[#1C1C26] p-2.5 border border-white/5">
              <span className="text-[10px] text-zinc-400 uppercase block">RESPOSTA DO TURBO</span>
              <span
                className={`font-bold text-sm ${
                  pu.turbocharger.operatingPoint.inSurgeMargin && pu.turbocharger.operatingPoint.inChokeMargin
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}
              >
                {turboResponseLabel}
              </span>
              <span className="text-[10px] text-zinc-400 block">Vel. Máxima: {turboTopEndLabel}</span>
            </div>

            <div className="bg-[#1C1C26] p-2.5 border border-white/5">
              <span className="text-[10px] text-zinc-400 uppercase block">DURABILIDADE DO MOTOR</span>
              <span className={`font-bold text-sm ${highEngineBreakRisk ? 'text-red-400' : 'text-emerald-400'}`}>
                ~{pu.reliability.estimatedPuLifeRaces.toFixed(0)} Corridas
              </span>
              <span className={`text-[10px] block ${highEngineBreakRisk ? 'text-red-400 font-bold' : 'text-zinc-400'}`}>
                {highEngineBreakRisk ? '⚠️ Risco Alto de Quebra' : 'Operação Estável'}
              </span>
            </div>
          </div>
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

      {/* BOM (Bill of Materials) + Árvore de Pesquisa Modal (Camada de Profundidade sob demanda) */}
      {showBomModal && (
        <div className="fixed inset-0 z-[140] bg-black/85 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1C1C26] border border-cyan-500/50 max-w-4xl w-full p-5 space-y-4 my-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-f1-mono text-cyan-400 uppercase tracking-widest block">
                  SEÇÃO 40 GDD · BILL OF MATERIALS (BOM) & REGULAMENTO FIA 2026
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
