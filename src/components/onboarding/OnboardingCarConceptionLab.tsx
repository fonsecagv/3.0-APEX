import React, { useMemo, useState } from 'react';
import {
  Cpu,
  Layers,
  Box,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Shield,
  Wind,
  Wrench,
  RotateCcw,
} from 'lucide-react';
import type { Driver, StaffMember, Team } from '../../types/f1';
import type { VehicleEngineeringParameters } from '../../types/physics';
import { FIA_2026_DEFAULT_EDITION } from '../../engine/modules/m03Packaging';
import { evaluateGate03 } from '../../engine/modules/m03Packaging';
import { evaluateGate04 } from '../../engine/modules/m04Aerodynamics';
import { evaluateGate05 } from '../../engine/modules/m05VehicleDynamics';
import { evaluateGate06 } from '../../engine/modules/m06Tires';
import { evaluateGate07 } from '../../engine/modules/m07Structures';
import { evaluateGate09, computeGearboxStaffSynergy } from '../../engine/modules/m09Transmission';
import { runMultidisciplinarySimulation, evaluateGate10 } from '../../engine/modules/m10Multidisciplinary';
import { evaluatePhilosophyForTrack, evaluateGate02, type VehiclePhilosophyCode } from '../../engine/modules/m02Philosophy';
import { COMPOSITE_MATERIALS } from '../../data/physicsDatabase';
import { Packaging3DViewport } from '../engineering/Packaging3DViewport';
import { CarSilhouette2026 } from './CarSilhouette2026';
import {
  computeMonocoqueChassisCostUsd,
  evaluatePhase7ScopeAlignment,
  type Phase7ScopeFeedback,
} from '../../engine/phase7BoardFeedback';

export type ConceptionSubStep = 'gearbox' | 'packaging' | 'monocoque' | 'dynamics';

interface OnboardingCarConceptionLabProps {
  subStep: ConceptionSubStep;
  onChangeSubStep: (step: ConceptionSubStep) => void;
  vehicleParams: VehicleEngineeringParameters;
  onUpdateParams: (patch: Partial<VehicleEngineeringParameters>) => void;
  philosophyCode: VehiclePhilosophyCode;
  sidepodConcept: 'downwash' | 'conventional' | 'zeropod';
  onSelectSidepodConcept: (concept: 'downwash' | 'conventional' | 'zeropod') => void;
  engineFullName: string;
  engineBlockAngle: '90' | '120';
  isEmergency: boolean;
  emergencySupplierName: string;
  gearboxFinalized: boolean;
  gearboxCostUsd: number;
  gearboxWeeks: number;
  onFinalizeGearbox: () => void;
  onReleaseToBahrain: () => void;
  ferrariErsSidepodMandatory?: boolean;
  sidepodZeroPodBlocked?: boolean;
  coolingSidepodConstraintReason?: string | null;
  headAero?: StaffMember | null;
  headPU?: StaffMember | null;
  sportingDirector?: StaffMember | null;
  chiefMechanic?: StaffMember | null;
  availableBudgetUsd?: number;
  committedCarCostUsd?: number;
  costCapCommittedUsd?: number;
  costCapLimitUsd?: number;
  playerTeam?: Partial<Team> | null;
  allTeams?: Team[];
  drivers?: Driver[];
  isLaunchModalOpen?: boolean;
}

export const OnboardingCarConceptionLab: React.FC<OnboardingCarConceptionLabProps> = ({
  subStep,
  onChangeSubStep,
  vehicleParams,
  onUpdateParams,
  philosophyCode,
  sidepodConcept,
  onSelectSidepodConcept,
  engineFullName,
  engineBlockAngle,
  isEmergency,
  emergencySupplierName,
  gearboxFinalized,
  gearboxCostUsd,
  gearboxWeeks,
  onFinalizeGearbox,
  onReleaseToBahrain,
  ferrariErsSidepodMandatory = false,
  sidepodZeroPodBlocked = false,
  coolingSidepodConstraintReason = null,
  headAero = null,
  headPU = null,
  sportingDirector = null,
  chiefMechanic = null,
  availableBudgetUsd = 80_000_000,
  committedCarCostUsd = 15_000_000,
  costCapCommittedUsd = 53_000_000,
  costCapLimitUsd = 135_000_000,
  playerTeam = null,
  allTeams,
  drivers,
  isLaunchModalOpen = false,
}) => {
  const [selectedGearProbe, setSelectedGearProbe] = useState<number>(6);
  const [draggingGearNum, setDraggingGearNum] = useState<number | null>(null);
  const gearChartTrackRef = React.useRef<HTMLDivElement | null>(null);

  const gearboxStaffSynergy = useMemo(
    () => computeGearboxStaffSynergy(headPU, chiefMechanic),
    [headPU, chiefMechanic]
  );

  const effectiveVehicleParams = useMemo<VehicleEngineeringParameters>(
    () => ({
      ...vehicleParams,
      gearboxStaffTuning: {
        efficiencyBonus: gearboxStaffSynergy.efficiencyBonus,
        fatigueBonusRaces: gearboxStaffSynergy.fatigueBonusRaces,
        shiftReductionS: gearboxStaffSynergy.shiftReductionS,
      },
    }),
    [vehicleParams, gearboxStaffSynergy]
  );

  const mdo = useMemo(
    () =>
      runMultidisciplinarySimulation(
        effectiveVehicleParams,
        {
          fidelityLevel: 'L2',
          couplingMode: 'strong',
          convergenceTolM: 5e-5,
          maxIterations: 25,
          ambientTempK: 298.15,
          airPressurePa: 101325,
          tireCompound: 'medium',
          referenceTrackLapDistM: 5412,
          highSpeedShare: 0.45,
          lowSpeedShare: 0.25,
        },
        FIA_2026_DEFAULT_EDITION
      ),
    [effectiveVehicleParams]
  );

  const pkg = mdo.subsystems.packaging;
  const aeroZ = mdo.subsystems.aeroCorner;
  const aeroX = mdo.subsystems.aeroStraight;
  const dyn = mdo.subsystems.dynamics;
  const tire = mdo.subsystems.tireCorner;
  const str = mdo.subsystems.structures;
  const pu = mdo.subsystems.powerUnit;
  const tr = mdo.subsystems.transmission;

  const gate03 = useMemo(() => evaluateGate03(pkg), [pkg]);
  const gate04 = useMemo(() => evaluateGate04(aeroZ), [aeroZ]);
  const gate05 = useMemo(() => evaluateGate05(dyn), [dyn]);
  const gate06 = useMemo(() => evaluateGate06(tire), [tire]);
  const gate07 = useMemo(() => evaluateGate07(str), [str]);
  const gate09 = useMemo(() => evaluateGate09(tr), [tr]);
  const gate10 = useMemo(() => evaluateGate10(mdo), [mdo]);

  const philReport = useMemo(
    () =>
      evaluatePhilosophyForTrack(
        philosophyCode,
        'silverstone',
        {
          aeroEfficiencyLd: aeroZ.forces.aeroEfficiencyLD,
          clTotal: aeroZ.forces.clTotal,
          cdTotal: aeroZ.forces.cdTotal,
          platformStability01: mdo.vehicleMetrics.stabilityScore01,
          mechanicalGrip01: Math.min(1, tire.forcesAndMoments.fyPeakN / 10000),
          thermalMarginK: pu.thermalAndLubrication.thermalMarginK,
        },
        pkg.envelopeViolations.length + (tr.regulatoryCompliance.compliant ? 0 : 1),
        true
      ),
    [philosophyCode, aeroZ, mdo.vehicleMetrics.stabilityScore01, tire, pu, pkg, tr]
  );
  const gate02 = useMemo(() => evaluateGate02(philReport), [philReport]);

  const gearboxPkg = pkg.packages.find((p) => p.subsystem === 'gearbox_diff');
  const puPkg = pkg.packages.find((p) => p.subsystem === 'pu_ice');

  const handleNormalizeLayup = (changedKey: 'layupPlyZeroPct' | 'layupPly45Pct' | 'layupPly90Pct', nextVal: number) => {
    const clamped = Math.max(5, Math.min(80, Math.round(nextVal)));
    const otherKeys = (['layupPlyZeroPct', 'layupPly45Pct', 'layupPly90Pct'] as const).filter((k) => k !== changedKey);
    const remaining = 100 - clamped;
    const sumOthers = vehicleParams[otherKeys[0]] + vehicleParams[otherKeys[1]];
    const v0 = sumOthers > 0 ? Math.max(5, Math.round((vehicleParams[otherKeys[0]] / sumOthers) * remaining)) : Math.floor(remaining / 2);
    const v1 = Math.max(5, remaining - v0);
    onUpdateParams({
      [changedKey]: clamped,
      [otherKeys[0]]: v0,
      [otherKeys[1]]: v1,
    } as Partial<VehicleEngineeringParameters>);
  };

  const dragReductionPct =
    aeroZ.forces.dragTotalN > 0
      ? (((aeroZ.forces.dragTotalN - aeroX.forces.dragTotalN) / aeroZ.forces.dragTotalN) * 100).toFixed(1)
      : '0.0';

  const gatesSummary = [
    { id: 'G02', label: 'Filosofia', passed: gate02.passed },
    { id: 'G03', label: 'Packaging 3D', passed: gate03.passed },
    { id: 'G04', label: 'Aero X/Z', passed: gate04.passed },
    { id: 'G05', label: 'Dinâmica', passed: gate05.passed },
    { id: 'G06', label: 'Pneus', passed: gate06.passed },
    { id: 'G07', label: 'Estruturas', passed: gate07.passed },
    { id: 'G09', label: 'Transmissão', passed: gate09.passed },
    { id: 'G10', label: 'MDO', passed: gate10.passed },
  ];

  const activeGear = tr.gearboxSet.gears.find((g) => g.gearNumber === selectedGearProbe) ?? tr.gearboxSet.gears[5];

  const computeGearSpeedKmh = React.useCallback(
    (ratio: number) => {
      const totalRatio = ratio * tr.gearboxSet.finalDriveRatio;
      return ((11600 * 2 * Math.PI) / 60 / Math.max(0.5, totalRatio)) * 0.36 * 3.6;
    },
    [tr.gearboxSet.finalDriveRatio]
  );

  const updateSingleGearSpeed = React.useCallback(
    (gearNum: number, targetSpeedKmh: number) => {
      const clampedKmh = Math.max(95, Math.min(375, targetSpeedKmh));
      const wheelOmega = clampedKmh / 3.6 / 0.36;
      const engineOmega = (11600 * 2 * Math.PI) / 60;
      const targetRatio = engineOmega / Math.max(1, wheelOmega * tr.gearboxSet.finalDriveRatio);
      const currentRatios = tr.gearboxSet.gears.map((g) => g.ratio);
      const nextRatios = [...currentRatios];
      nextRatios[gearNum - 1] = Number(Math.max(0.65, Math.min(3.5, targetRatio)).toFixed(3));
      onUpdateParams({ customGearRatios: nextRatios });
    },
    [tr.gearboxSet.finalDriveRatio, tr.gearboxSet.gears, onUpdateParams]
  );

  React.useEffect(() => {
    if (draggingGearNum === null) return;
    const handleMove = (ev: PointerEvent) => {
      const track = gearChartTrackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      if (rect.width <= 0) return;
      const frac = Math.max(0.24, Math.min(1, (ev.clientX - rect.left) / rect.width));
      const targetKmh = 95 + frac * (375 - 95);
      updateSingleGearSpeed(draggingGearNum, targetKmh);
    };
    const handleUp = () => setDraggingGearNum(null);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [draggingGearNum, updateSingleGearSpeed]);

  const topGearSpeedKmh = computeGearSpeedKmh(tr.gearboxSet.gears[tr.gearboxSet.gears.length - 1]?.ratio ?? 0.85);
  const topSpeedEstKmh = mdo.vehicleMetrics.topSpeedEstimateMs * 3.6;

  // Live Budget & Cost Cap calculations across 1/4 - 4/4
  const monocoqueCostUsd = useMemo(
    () => computeMonocoqueChassisCostUsd(effectiveVehicleParams),
    [
      effectiveVehicleParams.compositeFiber,
      effectiveVehicleParams.laminateThicknessMm,
      effectiveVehicleParams.localReinforcementPct,
    ]
  );
  const pendingGearboxCostUsd = gearboxFinalized ? 0 : gearboxCostUsd;
  const liveAccumulatedCarCostUsd = committedCarCostUsd + pendingGearboxCostUsd + monocoqueCostUsd;
  const liveCashAvailableUsd = availableBudgetUsd - pendingGearboxCostUsd - monocoqueCostUsd;
  const liveCostCapProjectedUsd = costCapCommittedUsd + pendingGearboxCostUsd + monocoqueCostUsd;
  const costCapPct = (liveCostCapProjectedUsd / Math.max(1, costCapLimitUsd)) * 100;
  const isBudgetDanger = liveCashAvailableUsd < 0 || costCapPct > 100;
  const isBudgetTight = !isBudgetDanger && (liveCashAvailableUsd < 15_000_000 || costCapPct >= 82);

  // Dynamic Board / Scope Alignment Feedback for screens 2/4, 3/4, 4/4
  const scopeFeedback: Phase7ScopeFeedback | null = useMemo(() => {
    if (subStep === 'gearbox') return null;
    return evaluatePhase7ScopeAlignment(subStep, {
      philosophyCode,
      sidepodConcept,
      params: effectiveVehicleParams,
      packaging: pkg,
      aeroCorner: aeroZ,
      aeroStraight: aeroX,
      dynamics: dyn,
      tireCorner: tire,
      structures: str,
      powerUnit: pu,
      headAero,
      headPU,
      sportingDirector,
      chiefMechanic,
    });
  }, [
    subStep,
    philosophyCode,
    sidepodConcept,
    effectiveVehicleParams,
    pkg,
    aeroZ,
    aeroX,
    dyn,
    tire,
    str,
    pu,
    headAero,
    headPU,
    sportingDirector,
    chiefMechanic,
  ]);

  const renderScopeAlignmentCard = (fb: Phase7ScopeFeedback) => {
    const statusBadgeClass =
      fb.status === 'aligned'
        ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300'
        : fb.status === 'moderate_conflict'
        ? 'bg-amber-950/70 border-amber-500/60 text-amber-300'
        : 'bg-red-950/70 border-red-500/60 text-red-300';

    const statusIcon =
      fb.status === 'aligned' ? '🟢' : fb.status === 'moderate_conflict' ? '🟡' : '🔴';

    const containerBorderClass =
      fb.status === 'aligned'
        ? 'border-emerald-500/35'
        : fb.status === 'moderate_conflict'
        ? 'border-amber-500/45'
        : 'border-red-500/60';

    return (
      <div className={`bg-[#181822] border ${containerBorderClass} p-4 space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-f1-wide font-black text-white uppercase tracking-wider">
              PARECER DA DIRETORIA & ALINHAMENTO DE ESCOPO
            </span>
            <span className="text-[10px] font-f1-mono bg-[#15151E] border border-white/15 px-2 py-0.5 text-cyan-300 font-bold uppercase">
              Filosofia Alvo (Fase 4): {fb.targetPhilosophyName}
            </span>
          </div>
          <span className={`text-[10px] font-f1-mono font-bold px-2.5 py-1 border uppercase ${statusBadgeClass}`}>
            {statusIcon} {fb.statusLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-f1-mono">
          {fb.speakers.map((sp, idx) => {
            const boxStyle =
              sp.tone === 'angry'
                ? 'bg-red-950/55 border-red-500/70 text-red-100'
                : sp.tone === 'caution'
                ? 'bg-amber-950/35 border-amber-500/45 text-amber-100'
                : 'bg-[#15151E] border-emerald-500/30 text-zinc-200';
            const nameColor =
              sp.tone === 'angry'
                ? 'text-red-300'
                : sp.tone === 'caution'
                ? 'text-amber-300'
                : 'text-emerald-300';

            return (
              <div key={idx} className={`p-3 border space-y-1.5 ${boxStyle}`}>
                <div className="flex items-center justify-between gap-2 text-[10px] uppercase font-bold">
                  <span className={nameColor}>
                    {sp.speakerName} ({sp.roleLabel})
                  </span>
                  {sp.tone === 'angry' && (
                    <span className="px-1.5 py-0.5 bg-red-600/80 text-white text-[9px]">DESVIO CRÍTICO</span>
                  )}
                </div>
                <p className={`leading-relaxed text-[11px] ${sp.tone === 'angry' ? 'text-red-200 font-semibold' : ''}`}>
                  {sp.quote}
                </p>
              </div>
            );
          })}
        </div>

        <div className="bg-[#15151E] border border-white/10 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px] font-f1-mono tabular-nums">
          <span className="text-zinc-400 uppercase font-bold text-[10px]">Impacto no Desempenho:</span>
          <span className="text-white font-bold">{fb.impactSummary}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Sticky Financial Telemetry Header across Phase 7 (1/4 to 4/4) */}
      <div
        className={`sticky top-0 z-30 border px-4 py-2.5 shadow-lg transition-colors ${
          isBudgetDanger
            ? 'bg-[#221014] border-red-500/70'
            : isBudgetTight
            ? 'bg-[#1F1A10] border-amber-500/60'
            : 'bg-[#101018] border-emerald-500/40'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-f1-mono tabular-nums">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-f1-wide font-black uppercase tracking-wider text-zinc-300">
              ORÇAMENTO FASE 7 ({subStep === 'gearbox' ? '1/4' : subStep === 'packaging' ? '2/4' : subStep === 'monocoque' ? '3/4' : '4/4'})
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div>
              <span className="text-[9px] text-zinc-400 uppercase mr-1.5">CAIXA DISPONÍVEL:</span>
              <span
                className={`font-f1-wide font-black ${
                  liveCashAvailableUsd < 0
                    ? 'text-red-400'
                    : liveCashAvailableUsd < 15_000_000
                    ? 'text-amber-300'
                    : 'text-emerald-400'
                }`}
              >
                ${(liveCashAvailableUsd / 1_000_000).toFixed(1)}M
              </span>
            </div>
            <div>
              <span className="text-[9px] text-zinc-400 uppercase mr-1.5">CUSTO ACUMULADO DO CARRO:</span>
              <span className="text-white font-f1-wide font-black">
                ${(liveAccumulatedCarCostUsd / 1_000_000).toFixed(1)}M
              </span>
              <span className="text-[10px] text-zinc-400 ml-1.5">
                (CFRP ${(monocoqueCostUsd / 1_000_000).toFixed(1)}M)
              </span>
            </div>
            <div>
              <span className="text-[9px] text-zinc-400 uppercase mr-1.5">TETO FIA ($135M):</span>
              <span
                className={`font-bold ${
                  costCapPct > 100 ? 'text-red-400' : costCapPct >= 82 ? 'text-amber-300' : 'text-emerald-400'
                }`}
              >
                {costCapPct > 100
                  ? `ESTOURO (${costCapPct.toFixed(0)}%)`
                  : costCapPct >= 82
                  ? `Atenção (${costCapPct.toFixed(0)}%)`
                  : `Seguro (${costCapPct.toFixed(0)}%)`}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Header + 4-stage Nav Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-f1-mono text-[#E10600] font-bold tracking-widest uppercase">
              FASE 7: CONCEPÇÃO COMPLETA DO CARRO (M03–M10)
            </span>
            <span className="text-[10px] font-f1-mono bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 font-bold uppercase">
              GATES APROVADOS: {gatesSummary.filter((g) => g.passed).length}/{gatesSummary.length}
            </span>
          </div>
          <h2 className="font-f1-wide font-black text-2xl sm:text-3xl text-white uppercase tracking-wider">
            {subStep === 'gearbox'
              ? '1/4 · Transmissão & Câmbio 8 Marchas (M09)'
              : subStep === 'packaging'
              ? '2/4 · Packaging 3D, Massa, CG & Refrigeração (M03)'
              : subStep === 'monocoque'
              ? '3/4 · Monocoque CFRP (M07) & Aero Ativa X/Z (M04)'
              : '4/4 · Suspensão, Pneus & Otimização MDO (M05/M06/M10)'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {(
            [
              { id: 'gearbox', label: '1. CÂMBIO M09', icon: Cpu, done: gearboxFinalized },
              { id: 'packaging', label: '2. PACKAGING 3D', icon: Box, done: gate03.passed },
              { id: 'monocoque', label: '3. CFRP & AERO', icon: Layers, done: gate04.passed && gate07.passed },
              { id: 'dynamics', label: '4. DINÂMICA & MDO', icon: Activity, done: gate10.passed },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onChangeSubStep(t.id)}
                className={`px-3 py-2 text-[11px] font-f1-wide font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 f1-tab-chamfer cursor-pointer ${
                  subStep === t.id
                    ? 'bg-[#E10600] text-white shadow-md'
                    : 'bg-[#1C1C26] text-zinc-400 hover:text-white border border-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
                {t.done && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Simplified 4-KPI Telemetry Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-f1-mono tabular-nums">
        <div className="bg-[#1C1C26] p-3 border border-white/10">
          <span className="text-[10px] text-zinc-400 uppercase block">Massa Total (FIA ≥ {FIA_2026_DEFAULT_EDITION.minMassKg} kg)</span>
          <span className={`font-f1-wide font-black text-base ${pkg.totalMassKg >= FIA_2026_DEFAULT_EDITION.minMassKg ? 'text-white' : 'text-red-400'}`}>
            {pkg.totalMassKg.toFixed(1)} kg
          </span>
        </div>
        <div className="bg-[#1C1C26] p-3 border border-white/10">
          <span className="text-[10px] text-zinc-400 uppercase block">Potência na Roda (M08→M09)</span>
          <span className="text-emerald-400 font-f1-wide font-black text-base">
            {(tr.kinematicsAndTorque.outputAxlePowerW / 1000).toFixed(1)} kW
            <span className="text-[11px] font-f1-mono text-zinc-400 font-normal ml-1.5">
              ({(tr.kinematicsAndTorque.gearboxEfficiency * 100).toFixed(1)}%)
            </span>
          </span>
        </div>
        <div className="bg-[#1C1C26] p-3 border border-white/10">
          <span className="text-[10px] text-zinc-400 uppercase block">Downforce Total (Modo Z)</span>
          <span className="text-cyan-400 font-f1-wide font-black text-base">
            {Math.round(aeroZ.forces.downforceTotalN).toLocaleString('pt-BR')} N
            <span className="text-[11px] font-f1-mono text-zinc-400 font-normal ml-1.5">
              (Modo X -{dragReductionPct}%)
            </span>
          </span>
        </div>
        <div className="bg-[#1C1C26] p-3 border border-white/10">
          <span className="text-[10px] text-zinc-400 uppercase block">Vel. Máxima Estimada (M10)</span>
          <span className="text-amber-300 font-f1-wide font-black text-base">
            {topSpeedEstKmh.toFixed(1)} km/h
            <span className="text-[11px] font-f1-mono text-zinc-400 font-normal ml-1.5">
              ({mdo.vehicleMetrics.estimatedLapTimeS.toFixed(2)}s)
            </span>
          </span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SUB-STEP 1/4: M09 TRANSMISSÃO & CÂMBIO CAD                           */}
      {/* ===================================================================== */}
      {subStep === 'gearbox' && (
        <div className="space-y-5">
          {/* PU Gabarito Homologado */}
          <div className="bg-[#1C1C26] border border-emerald-500/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-950/60 border border-emerald-500/50 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <span className="text-[10px] font-f1-mono text-emerald-400 font-bold uppercase block">
                  GABARITO HOMOLOGADO FASE 5 · {engineFullName}
                </span>
                <span className="text-xs font-f1-mono text-zinc-300">
                  V6 {engineBlockAngle}° · Massa PU: {puPkg ? puPkg.massKg.toFixed(1) : '145.0'} kg · Eixo Entrada:{' '}
                  {pu.totalShaftOutput.crankshaftTotalTorqueNm.toFixed(0)} N·m ({(pu.totalShaftOutput.crankshaftTotalPowerW / 1000).toFixed(1)} kW)
                </span>
              </div>
            </div>
            <span
              className={`text-[10px] font-f1-mono px-2.5 py-1 border font-bold uppercase ${
                gate09.passed ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-400' : 'bg-red-950/50 border-red-500/40 text-red-400'
              }`}
            >
              GATE 09: {gate09.passed ? 'APROVADO' : 'REPROVADO'}
            </span>
          </div>

          {isEmergency && (
            <div className="bg-red-950/40 border border-red-500/40 p-3 text-xs font-f1-mono text-red-200">
              ⚠️ Motor emergencial {emergencySupplierName}: pontos de ancoragem provisórios aumentam o erro de correlação em +15% até calibragem em pista.
            </div>
          )}

          {/* Responsáveis pelo Câmbio (Bônus Duplo: Chefe de PU + Chefe Mecânico) */}
          <div className="bg-[#1C1C26] border border-cyan-500/35 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
              <span className="text-xs font-f1-wide font-black text-white uppercase flex items-center gap-2">
                <Wrench className="w-4 h-4 text-cyan-400" />
                <span>Responsáveis pelo Câmbio (Bônus Duplo Ativo)</span>
              </span>
              <span className="text-[10px] font-f1-mono text-emerald-300 font-bold tabular-nums bg-emerald-950/50 border border-emerald-500/40 px-2 py-0.5">
                {gearboxStaffSynergy.summaryLabel}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-f1-mono">
              <div className="bg-[#15151E] border border-white/10 p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-cyan-300 font-bold uppercase">1. Chefe de PU & Componentes (Líder Técnico)</span>
                  <span className="text-emerald-400 font-bold tabular-nums">
                    +{(gearboxStaffSynergy.efficiencyBonus * 100).toFixed(2)}% efic. · +{gearboxStaffSynergy.fatigueBonusRaces} GPs fadiga
                  </span>
                </div>
                <div className="font-f1-wide font-bold text-white uppercase">{gearboxStaffSynergy.puLeaderLabel}</div>
                <div className="text-[10px] text-zinc-400">
                  {headPU?.specialty || 'Integração térmica, rigidez de engrenagens e rendimento mecânico M08→M09.'}
                </div>
              </div>

              <div className="bg-[#15151E] border border-white/10 p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-amber-300 font-bold uppercase">2. Chefe Mecânico (Operação & Trocas)</span>
                  <span className="text-emerald-400 font-bold tabular-nums">
                    -{(gearboxStaffSynergy.shiftReductionS * 1000).toFixed(0)} ms nas trocas
                  </span>
                </div>
                <div className="font-f1-wide font-bold text-white uppercase">{gearboxStaffSynergy.mechLeaderLabel}</div>
                <div className="text-[10px] text-zinc-400">
                  {chiefMechanic?.specialty || 'Atuação eletro-hidráulica de caixa, inspeção rápida e turnaround de garagem.'}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 space-y-4">
              {/* Material da Carcaça */}
              <div className="bg-[#1C1C26] border border-white/10 p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-xs font-f1-wide font-black text-white uppercase">1. Material da Carcaça (M03 Massa + M09 Fadiga)</span>
                  <span className="text-[10px] font-f1-mono text-amber-300 font-bold">
                    Massa Câmbio M03: {gearboxPkg?.massKg.toFixed(1)} kg
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(
                    [
                      { id: 'aluminum', name: 'Alumínio 6061', cost: '$1.0M · 1w', desc: 'Maior massa e menor limite de fadiga em zebras.' },
                      { id: 'titanium', name: 'Titânio 3D', cost: '$1.3M · 2w', desc: 'Equilíbrio estrutural elevado contra fadiga e torção.' },
                      { id: 'carbon', name: 'CFRP Estrutural', cost: '$1.8M · 3w', desc: 'Carcaça ultraleve para CG baixo; menor tenacidade a impacto.' },
                    ] as const
                  ).map((mat) => (
                    <button
                      key={mat.id}
                      type="button"
                      onClick={() => onUpdateParams({ gearboxMaterial: mat.id })}
                      className={`p-3 text-left border transition-all cursor-pointer ${
                        vehicleParams.gearboxMaterial === mat.id
                          ? 'bg-[#15151E] border-[#E10600] ring-1 ring-[#E10600]'
                          : 'bg-[#15151E]/60 border-white/10 hover:border-white/25'
                      }`}
                    >
                      <div className="flex justify-between text-xs font-f1-wide font-bold text-white uppercase">
                        <span>{mat.name}</span>
                        <span className="text-[9px] font-f1-mono text-cyan-300">{mat.cost}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1.5 leading-snug">{mat.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Layout da Carcaça (M04 Bloqueio Difusor) */}
              <div className="bg-[#1C1C26] border border-white/10 p-4 space-y-3">
                <span className="text-xs font-f1-wide font-black text-white uppercase block border-b border-white/10 pb-2">
                  2. Layout da Carcaça (Acoplamento M04 Difusor Traseiro)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => onUpdateParams({ gearboxLayout: 'compact' })}
                    className={`p-3 text-left border cursor-pointer ${
                      vehicleParams.gearboxLayout === 'compact'
                        ? 'bg-[#15151E] border-emerald-500 ring-1 ring-emerald-500'
                        : 'bg-[#15151E]/60 border-white/10'
                    }`}
                  >
                    <div className="flex justify-between text-xs font-bold text-white uppercase">
                      <span>Compacto (Slim Aero)</span>
                      <span className="text-[10px] font-f1-mono text-emerald-400">+$0.2M · +22 min garagem</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">Libera garganta do difusor (+recuperação de pressão no M04); acesso apertado na garagem.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateParams({ gearboxLayout: 'voluminous' })}
                    className={`p-3 text-left border cursor-pointer ${
                      vehicleParams.gearboxLayout === 'voluminous'
                        ? 'bg-[#15151E] border-cyan-500 ring-1 ring-cyan-500'
                        : 'bg-[#15151E]/60 border-white/10'
                    }`}
                  >
                    <div className="flex justify-between text-xs font-bold text-white uppercase">
                      <span>Volumoso (Modular)</span>
                      <span className="text-[10px] font-f1-mono text-cyan-400">-$0.1M · -12 min garagem</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">Facilita manutenção, mas obstrui o escoamento traseiro do difusor no M04.</p>
                  </button>
                </div>
              </div>

              {/* Parâmetros M09 Contínuos */}
              <div className="bg-[#1C1C26] border border-white/10 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-f1-mono">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-zinc-300">Viés Relação Final (Curta ↔ Longa):</span>
                    <span className="text-cyan-400 font-bold">{vehicleParams.gearRatioBias}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={vehicleParams.gearRatioBias}
                    onChange={(e) => onUpdateParams({ gearRatioBias: Number(e.target.value) })}
                    className="w-full accent-[#E10600] cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-zinc-300">Largura Dente Engrenagem:</span>
                    <span className="text-white font-bold">{vehicleParams.gearToothWidthMm} mm</span>
                  </div>
                  <input
                    type="range"
                    min={14}
                    max={22}
                    step={1}
                    value={vehicleParams.gearToothWidthMm}
                    onChange={(e) => onUpdateParams({ gearToothWidthMm: Number(e.target.value) })}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-zinc-300">Pré-carga Diferencial (LSD):</span>
                    <span className="text-amber-300 font-bold">{vehicleParams.differentialLockPct}%</span>
                  </div>
                  <input
                    type="range"
                    min={25}
                    max={85}
                    step={1}
                    value={vehicleParams.differentialLockPct}
                    onChange={(e) => onUpdateParams({ differentialLockPct: Number(e.target.value) })}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-zinc-300">Capacidade Resfriamento Óleo:</span>
                    <span className="text-emerald-400 font-bold">{vehicleParams.gearboxOilCoolingKw.toFixed(1)} kW</span>
                  </div>
                  <input
                    type="range"
                    min={6}
                    max={18}
                    step={0.5}
                    value={vehicleParams.gearboxOilCoolingKw}
                    onChange={(e) => onUpdateParams({ gearboxOilCoolingKw: Number(e.target.value) })}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Cost & Action Bar */}
              <div className="p-4 bg-[#1C1C26] border-2 border-amber-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-6 font-f1-mono">
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase block">CUSTO CÂMBIO</span>
                    <span className="font-f1-wide font-black text-lg text-amber-400">${(gearboxCostUsd / 1e6).toFixed(1)}M</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase block">USINAGEM</span>
                    <span className="font-f1-wide font-black text-lg text-white">{gearboxWeeks} Semanas</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onFinalizeGearbox}
                  className="px-5 py-3 bg-[#E10600] hover:bg-[#c20500] text-white font-f1-wide font-black text-xs uppercase tracking-wider f1-tab-chamfer flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Homologar Câmbio & Ir para Packaging 3D</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right: Interactive 8-Gear Horizontal Bar Chart + Parecer dos Chefes */}
            <div className="lg:col-span-5 bg-[#1C1C26] border border-white/10 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                <span className="text-xs font-f1-wide font-black text-white uppercase">
                  ESCALONAMENTO INTERATIVO (1ª A 8ª MARCHA)
                </span>
                <div className="flex items-center gap-2">
                  {vehicleParams.customGearRatios && (
                    <button
                      type="button"
                      onClick={() => onUpdateParams({ customGearRatios: undefined })}
                      className="px-2 py-0.5 bg-[#15151E] hover:bg-white/10 border border-white/15 text-[10px] font-f1-mono text-zinc-300 flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Padrão</span>
                    </button>
                  )}
                  <select
                    value={selectedGearProbe}
                    onChange={(e) => setSelectedGearProbe(Number(e.target.value))}
                    className="bg-[#15151E] border border-white/15 px-2 py-1 text-xs font-f1-mono text-white"
                  >
                    {tr.gearboxSet.gears.map((g) => (
                      <option key={g.gearNumber} value={g.gearNumber}>
                        G{g.gearNumber} ({g.z2Gear}/{g.z1Pinion})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-[10px] font-f1-mono text-zinc-400">
                Arraste a alça direita de cada barra (ou use -/+) para ajustar os degraus de velocidade:
              </div>

              {/* Interactive Horizontal Speed Bars */}
              <div ref={gearChartTrackRef} className="space-y-1.5 text-[10px] font-f1-mono tabular-nums select-none">
                {tr.gearboxSet.gears.map((g, idx) => {
                  const speedKmh = computeGearSpeedKmh(g.ratio);
                  const prevSpeed = idx > 0 ? computeGearSpeedKmh(tr.gearboxSet.gears[idx - 1].ratio) : 0;
                  const stepDelta = idx > 0 ? speedKmh - prevSpeed : speedKmh;
                  const pct = Math.max(18, Math.min(100, ((speedKmh - 80) / (375 - 80)) * 100));
                  const isActive = selectedGearProbe === g.gearNumber;
                  return (
                    <div
                      key={g.gearNumber}
                      onClick={() => setSelectedGearProbe(g.gearNumber)}
                      className={`p-1.5 border cursor-pointer transition-colors ${
                        isActive ? 'bg-[#E10600]/15 border-[#E10600]' : 'bg-[#15151E] border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-white">
                          {g.gearNumber}ª <span className="text-zinc-400 font-normal">({g.z2Gear}/{g.z1Pinion} · i={g.ratio.toFixed(2)})</span>
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          {idx > 0 && (
                            <span className={`text-[9px] min-w-[54px] text-right tabular-nums shrink-0 ${stepDelta < 18 ? 'text-amber-300' : 'text-zinc-400'}`}>
                              +{stepDelta.toFixed(0)} km/h
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateSingleGearSpeed(g.gearNumber, speedKmh - 4);
                            }}
                            className="w-4 h-4 bg-[#1C1C26] border border-white/15 text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer shrink-0"
                            title="Encurtar marcha (-4 km/h)"
                          >
                            -
                          </button>
                          <span className="text-cyan-300 font-bold w-14 text-right tabular-nums shrink-0">{speedKmh.toFixed(0)} km/h</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateSingleGearSpeed(g.gearNumber, speedKmh + 4);
                            }}
                            className="w-4 h-4 bg-[#1C1C26] border border-white/15 text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer shrink-0"
                            title="Alongar marcha (+4 km/h)"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="relative h-2.5 w-full bg-black/50 border border-white/5">
                        <div
                          className={`h-full transition-all ${
                            isActive ? 'bg-[#E10600]' : 'bg-cyan-500/80'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                        <div
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            setSelectedGearProbe(g.gearNumber);
                            setDraggingGearNum(g.gearNumber);
                          }}
                          title="Arrastar relação da marcha"
                          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-4 bg-white border border-black cursor-ew-resize shadow"
                          style={{ left: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-[#15151E] p-3 border border-white/5 space-y-1.5 text-xs font-f1-mono tabular-nums">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Eficiência / Perda Mecânica:</span>
                  <span className="text-emerald-400 font-bold">
                    {(tr.kinematicsAndTorque.gearboxEfficiency * 100).toFixed(2)}% ({(tr.kinematicsAndTorque.mechanicalPowerLossW / 1000).toFixed(1)} kW)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Marcha {activeGear.gearNumber} · Tração na Roda:</span>
                  <span className="text-cyan-300 font-bold">
                    {tr.kinematicsAndTorque.wheelForceTractionLimitedN.toFixed(0)} N{' '}
                    {tr.kinematicsAndTorque.tractionClampedByTire ? '(Limitada Pneu)' : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Troca / Fadiga / FS Eixo:</span>
                  <span className="text-amber-300 font-bold">
                    {(tr.clutchAndShifts.shiftDurationS * 1000).toFixed(0)} ms · {tr.structuralAndFatigue.fatigueLifeRaces} GPs · FS {tr.structuralAndFatigue.shaftSafetyFactor.toFixed(2)}x
                  </span>
                </div>
              </div>

              {/* Parecer Dinâmico dos Chefes */}
              <div className="bg-[#15151E] border border-cyan-500/30 p-3 space-y-2 text-[11px] font-f1-mono">
                <span className="text-[10px] font-f1-wide font-bold text-cyan-300 uppercase block">
                  Parecer dos Chefes sobre o Câmbio Atual
                </span>
                <p className="text-zinc-300 leading-snug">
                  <strong className="text-white">{headPU?.name || 'Chefe de PU'}:</strong>{' '}
                  {topGearSpeedKmh < 322
                    ? `"Com a 8ª marcha fechando em ${topGearSpeedKmh.toFixed(0)} km/h, o ${engineFullName.split(' ')[0]} vai bater no limitador nas retas longas de Monza e Baku."`
                    : topGearSpeedKmh > 350
                    ? `"8ª marcha alongada (${topGearSpeedKmh.toFixed(0)} km/h): excelente final com Modo X aberto, mas o motor precisa de bom torque em baixa para não perder retomada."`
                    : `"Escalonamento até ${topGearSpeedKmh.toFixed(0)} km/h bem casado com o mapa do ${engineFullName.split(' ')[0]} — boa faixa útil para circuitos mistos."`}
                </p>
                <p className="text-zinc-300 leading-snug border-t border-white/5 pt-1.5">
                  <strong className="text-white">{chiefMechanic?.name || 'Chefe Mecânico'}:</strong>{' '}
                  {vehicleParams.gearboxMaterial === 'carbon'
                    ? `"Carcaça em CFRP economiza massa no CG, mas em toques ou zebras duras nossa equipe de garagem precisa redobrar a inspeção estrutural."`
                    : vehicleParams.gearboxLayout === 'compact'
                    ? `"Layout Compacto libera o difusor na pista; na garagem o acesso é mais apertado, então nossa equipe compensa com pré-montagem modular."`
                    : `"Layout Volumoso agiliza em 12 min qualquer troca ou reparo nos boxes entre TL3 e Quali."`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-STEP 2/4: M03 PACKAGING 3D, MASSA, CG & REFRIGERAÇÃO              */}
      {/* ===================================================================== */}
      {subStep === 'packaging' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5 space-y-4">
              {/* Envelope & CG sliders */}
              <div className="bg-[#1C1C26] border border-white/10 p-4 space-y-3 text-xs font-f1-mono">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="font-f1-wide font-bold text-white uppercase">Geometria & Balanço de Massa (M03)</span>
                  <span className={gate03.passed ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                    GATE 03: {gate03.passed ? 'OK' : 'VIOLAÇÃO'}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-zinc-300">Entre-Eixos (Teto FIA 3400 mm):</span>
                    <span className="text-white font-bold">{vehicleParams.wheelbaseMm} mm</span>
                  </div>
                  <input
                    type="range"
                    min={3150}
                    max={3400}
                    step={10}
                    value={vehicleParams.wheelbaseMm}
                    onChange={(e) => onUpdateParams({ wheelbaseMm: Number(e.target.value) })}
                    className="w-full accent-[#E10600] cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-zinc-300">Bitola Total (Teto FIA 1900 mm):</span>
                    <span className="text-white font-bold">{vehicleParams.trackWidthMm} mm</span>
                  </div>
                  <input
                    type="range"
                    min={1780}
                    max={1900}
                    step={5}
                    value={vehicleParams.trackWidthMm}
                    onChange={(e) => onUpdateParams({ trackWidthMm: Number(e.target.value) })}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-zinc-300">Distribuição Peso Dianteiro Alvo:</span>
                    <span className="text-amber-300 font-bold">{vehicleParams.targetFrontWeightPct.toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min={44.0}
                    max={47.5}
                    step={0.1}
                    value={vehicleParams.targetFrontWeightPct}
                    onChange={(e) => onUpdateParams({ targetFrontWeightPct: Number(e.target.value) })}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Sidepod concept presets + Fine Cooling sliders */}
              <div className="bg-[#1C1C26] border border-white/10 p-4 space-y-3">
                <span className="text-xs font-f1-wide font-bold text-white uppercase block border-b border-white/10 pb-2">
                  Conceito de Sidepods & Rede de Arrefecimento (M03↔M04↔M08)
                </span>
                {ferrariErsSidepodMandatory && (
                  <div className="bg-red-950/60 border border-red-500/50 p-2.5 text-[11px] font-f1-mono text-red-200 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>
                      <strong>Requisito Térmico ERS Ferrari:</strong> Admissão mínima de sidepods travada em <strong>395 cm²</strong> (conceito Zero-Pod bloqueado) para evitar superaquecimento, impondo penalidade de arrasto.
                    </span>
                  </div>
                )}
                {!ferrariErsSidepodMandatory && sidepodZeroPodBlocked && coolingSidepodConstraintReason && (
                  <div className="bg-amber-950/60 border border-amber-500/50 p-2.5 text-[11px] font-f1-mono text-amber-200 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{coolingSidepodConstraintReason}</span>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'downwash', title: 'Downwash', sub: 'Equilibrado' },
                      { id: 'conventional', title: 'Undercut Amplo', sub: 'Folga Térmica' },
                      { id: 'zeropod', title: 'Zero-Pod Slim', sub: 'Mínimo Arrasto' },
                    ] as const
                  ).map((c) => {
                    const isZeroPodBlocked = (ferrariErsSidepodMandatory || sidepodZeroPodBlocked) && c.id === 'zeropod';
                    return (
                      <button
                        key={c.id}
                        type="button"
                        disabled={isZeroPodBlocked}
                        onClick={() => onSelectSidepodConcept(c.id)}
                        className={`p-2.5 text-left border text-xs ${
                          isZeroPodBlocked
                            ? 'bg-zinc-900/60 border-white/5 text-zinc-600 cursor-not-allowed opacity-60'
                            : sidepodConcept === c.id
                            ? 'bg-[#15151E] border-[#E10600] ring-1 ring-[#E10600] text-white cursor-pointer'
                            : 'bg-[#15151E]/60 border-white/10 text-zinc-400 hover:text-white cursor-pointer'
                        }`}
                      >
                        <div className="font-f1-wide font-bold uppercase text-[11px]">{c.title}</div>
                        <div className="text-[10px] font-f1-mono text-zinc-400">
                          {isZeroPodBlocked ? (ferrariErsSidepodMandatory ? 'Bloqueado (ERS Ferrari)' : 'Bloqueado (Cooling PU)') : c.sub}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] font-f1-mono pt-1">
                  <div>
                    <div className="flex justify-between text-zinc-300">
                      <span>Admissão Sidepod:</span>
                      <span className="text-white font-bold">{vehicleParams.sidepodInletAreaCm2} cm²</span>
                    </div>
                    <input
                      type="range"
                      min={ferrariErsSidepodMandatory ? 395 : sidepodZeroPodBlocked ? 355 : 240}
                      max={480}
                      step={5}
                      value={
                        ferrariErsSidepodMandatory
                          ? Math.max(395, vehicleParams.sidepodInletAreaCm2)
                          : sidepodZeroPodBlocked
                          ? Math.max(355, vehicleParams.sidepodInletAreaCm2)
                          : vehicleParams.sidepodInletAreaCm2
                      }
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const minFloor = ferrariErsSidepodMandatory ? 395 : sidepodZeroPodBlocked ? 355 : 240;
                        onUpdateParams({ sidepodInletAreaCm2: Math.max(minFloor, val) });
                      }}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-zinc-300">
                      <span>Volume Radiador:</span>
                      <span className="text-white font-bold">{vehicleParams.radiatorVolumeL.toFixed(1)} L</span>
                    </div>
                    <input
                      type="range"
                      min={8}
                      max={18}
                      step={0.2}
                      value={vehicleParams.radiatorVolumeL}
                      onChange={(e) => onUpdateParams({ radiatorVolumeL: Number(e.target.value) })}
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-zinc-300">
                      <span>Undercut Sidepod:</span>
                      <span className="text-white font-bold">{vehicleParams.sidepodUndercutPct}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={90}
                      step={1}
                      value={vehicleParams.sidepodUndercutPct}
                      onChange={(e) => onUpdateParams({ sidepodUndercutPct: Number(e.target.value) })}
                      className="w-full accent-[#E10600] cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-zinc-300">
                      <span>Fluxo Coolant:</span>
                      <span className="text-white font-bold">{vehicleParams.coolantFlowLpm} L/min</span>
                    </div>
                    <input
                      type="range"
                      min={90}
                      max={170}
                      step={2}
                      value={vehicleParams.coolantFlowLpm}
                      onChange={(e) => onUpdateParams({ coolantFlowLpm: Number(e.target.value) })}
                      className="w-full accent-blue-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* M03 Simplified Summary Box (Massa Total, Balanço %, Altura CG) */}
              <div className="bg-[#15151E] border border-white/10 p-3.5 text-xs font-f1-mono space-y-2 tabular-nums">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-zinc-400 block uppercase">Massa Total</span>
                    <span className={`font-bold text-sm ${pkg.totalMassKg >= FIA_2026_DEFAULT_EDITION.minMassKg ? 'text-white' : 'text-red-400'}`}>
                      {pkg.totalMassKg.toFixed(1)} kg
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block uppercase">Balanço Peso</span>
                    <span className="text-cyan-300 font-bold text-sm">
                      {pkg.staticAxleDist.frontPct.toFixed(1)}% / {pkg.staticAxleDist.rearPct.toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block uppercase">Altura do CG</span>
                    <span className="text-amber-300 font-bold text-sm">
                      {(pkg.cgM.z * 1000).toFixed(1)} mm
                    </span>
                  </div>
                </div>
                {(pkg.interferences.some((i) => i.hasCollision) || pkg.envelopeViolations.length > 0) && (
                  <div className="text-red-400 text-[11px] pt-2 border-t border-white/10 space-y-1">
                    {pkg.interferences.some((i) => i.hasCollision) && (
                      <div>
                        ⚠️ {pkg.interferences.filter((i) => i.hasCollision).length} colisão(ões) volumétrica(s) detectada(s) no empacotamento.
                      </div>
                    )}
                    {pkg.envelopeViolations.map((v, idx) => (
                      <div key={idx}>⚠️ {v}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Live Three.js Packaging 3D Viewport */}
            <div className="lg:col-span-7 bg-[#1C1C26] border border-white/10 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-f1-wide font-bold text-white uppercase">
                  INSPEÇÃO VOLUMÉTRICA 3D AO VIVO (THREE.JS · SAE/ISO 2026)
                </span>
                <span className="text-[10px] font-f1-mono text-cyan-300">
                  Clique em qualquer subsistema para inspecionar massa e impacto no CG
                </span>
              </div>
              <Packaging3DViewport
                packaging={pkg}
                vehicleParams={effectiveVehicleParams}
                playerTeam={playerTeam}
                allTeams={allTeams}
                drivers={drivers}
                suspended={isLaunchModalOpen}
              />
            </div>
          </div>

          {scopeFeedback && renderScopeAlignmentCard(scopeFeedback)}

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => onChangeSubStep('gearbox')}
              className="px-4 py-2.5 bg-[#1C1C26] border border-white/10 text-zinc-300 text-xs font-f1-wide font-bold uppercase flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Câmbio</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeSubStep('monocoque')}
              className="px-5 py-2.5 bg-[#E10600] hover:bg-[#c20500] text-white text-xs font-f1-wide font-black uppercase f1-tab-chamfer flex items-center gap-2 cursor-pointer"
            >
              <span>Avançar para CFRP (M07) & Aero X/Z (M04)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-STEP 3/4: M07 ESTRUTURAS CFRP & M04 AERODINÂMICA ATIVA X/Z        */}
      {/* ===================================================================== */}
      {subStep === 'monocoque' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* M07 Structures */}
            <div className="bg-[#1C1C26] border border-white/10 p-4 space-y-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-xs font-f1-wide font-bold text-white uppercase flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[#E10600]" />
                  <span>Monocoque & Laminado Anisotrópico (M07 CLT)</span>
                </span>
                <span className={gate07.passed ? 'text-[10px] font-f1-mono text-emerald-400 font-bold' : 'text-[10px] font-f1-mono text-red-400 font-bold'}>
                  GATE 07: {gate07.passed ? 'APROVADO' : 'FALHA'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(['t800', 't1000', 'm40j'] as const).map((fib) => {
                  const spec = COMPOSITE_MATERIALS[fib];
                  const previewCostUsd = computeMonocoqueChassisCostUsd({
                    compositeFiber: fib,
                    laminateThicknessMm: vehicleParams.laminateThicknessMm,
                    localReinforcementPct: vehicleParams.localReinforcementPct,
                  });
                  return (
                    <button
                      key={fib}
                      type="button"
                      onClick={() => onUpdateParams({ compositeFiber: fib })}
                      className={`p-2.5 text-left border text-xs cursor-pointer ${
                        vehicleParams.compositeFiber === fib
                          ? 'bg-[#15151E] border-[#E10600] ring-1 ring-[#E10600] text-white'
                          : 'bg-[#15151E]/60 border-white/10 text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 font-f1-wide font-bold uppercase">
                        <span>{fib.toUpperCase()}</span>
                        <span className="text-[10px] font-f1-mono text-amber-300 tabular-nums">
                          ${(previewCostUsd / 1e6).toFixed(1)}M
                        </span>
                      </div>
                      <div className="text-[10px] font-f1-mono text-cyan-300">{spec.fiberModulusGpa} GPa</div>
                      <div className="text-[10px] font-f1-mono text-zinc-400">{spec.tensileStrengthMpa} MPa</div>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-f1-mono">
                <div>
                  <div className="flex justify-between">
                    <span className="text-zinc-300">Espessura Laminado:</span>
                    <span className="text-white font-bold">{vehicleParams.laminateThicknessMm.toFixed(1)} mm</span>
                  </div>
                  <input
                    type="range"
                    min={2.4}
                    max={5.2}
                    step={0.1}
                    value={vehicleParams.laminateThicknessMm}
                    onChange={(e) => onUpdateParams({ laminateThicknessMm: Number(e.target.value) })}
                    className="w-full accent-[#E10600] cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between">
                    <span className="text-zinc-300">Reforço Local Ancoragens:</span>
                    <span className="text-white font-bold">{vehicleParams.localReinforcementPct}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={60}
                    step={1}
                    value={vehicleParams.localReinforcementPct}
                    onChange={(e) => onUpdateParams({ localReinforcementPct: Number(e.target.value) })}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-2 text-[11px] font-f1-mono bg-[#15151E] p-3 border border-white/5">
                <div className="flex justify-between text-zinc-400">
                  <span>Orientação das Camadas (0° / ±45° / 90° = 100%)</span>
                  <span className="text-white font-bold">
                    {vehicleParams.layupPlyZeroPct}% / {vehicleParams.layupPly45Pct}% / {vehicleParams.layupPly90Pct}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-zinc-400 block">0° Axial</span>
                    <input
                      type="range"
                      min={10}
                      max={75}
                      value={vehicleParams.layupPlyZeroPct}
                      onChange={(e) => handleNormalizeLayup('layupPlyZeroPct', Number(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                  <div>
                    <span className="text-zinc-400 block">±45° Torção</span>
                    <input
                      type="range"
                      min={10}
                      max={75}
                      value={vehicleParams.layupPly45Pct}
                      onChange={(e) => handleNormalizeLayup('layupPly45Pct', Number(e.target.value))}
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                  </div>
                  <div>
                    <span className="text-zinc-400 block">90° Transv.</span>
                    <input
                      type="range"
                      min={10}
                      max={60}
                      value={vehicleParams.layupPly90Pct}
                      onChange={(e) => handleNormalizeLayup('layupPly90Pct', Number(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-f1-mono tabular-nums bg-[#15151E] p-3 border border-white/5">
                <div>
                  <span className="text-zinc-400 block text-[10px]">RIGIDEZ TORCIONAL</span>
                  <span className="text-white font-bold">{str.stiffnessMetrics.torsionalStiffnessNmPerDeg} N·m/°</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px]">TSAI-WU / FLAMBAGEM</span>
                  <span className={str.failureSummary.worstTsaiWuIndex < 1 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                    {str.failureSummary.worstTsaiWuIndex} / λ={str.failureSummary.minBucklingFactor}
                  </span>
                </div>
              </div>
            </div>

            {/* M04 Active Aero & Floor */}
            <div className="bg-[#1C1C26] border border-white/10 p-4 space-y-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-xs font-f1-wide font-bold text-white uppercase flex items-center gap-1.5">
                  <Wind className="w-4 h-4 text-cyan-400" />
                  <span>Assoalho 2026 & Asas Ativas X/Z (M04)</span>
                </span>
                <span className={gate04.passed ? 'text-[10px] font-f1-mono text-emerald-400 font-bold' : 'text-[10px] font-f1-mono text-red-400 font-bold'}>
                  GATE 04: {gate04.passed ? 'APROVADO' : 'FALHA'}
                </span>
              </div>

              <CarSilhouette2026 params={effectiveVehicleParams} />

              <div className="grid grid-cols-2 gap-3 text-xs font-f1-mono">
                <div>
                  <div className="flex justify-between">
                    <span className="text-zinc-300">Altura Dianteira:</span>
                    <span className="text-white font-bold">{vehicleParams.frontRideHeightMm} mm</span>
                  </div>
                  <input
                    type="range"
                    min={18}
                    max={40}
                    step={1}
                    value={vehicleParams.frontRideHeightMm}
                    onChange={(e) => onUpdateParams({ frontRideHeightMm: Number(e.target.value) })}
                    className="w-full accent-[#E10600] cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between">
                    <span className="text-zinc-300">Altura Traseira:</span>
                    <span className="text-white font-bold">{vehicleParams.rearRideHeightMm} mm</span>
                  </div>
                  <input
                    type="range"
                    min={35}
                    max={75}
                    step={1}
                    value={vehicleParams.rearRideHeightMm}
                    onChange={(e) => onUpdateParams({ rearRideHeightMm: Number(e.target.value) })}
                    className="w-full accent-[#E10600] cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between">
                    <span className="text-zinc-300">Ângulo Difusor:</span>
                    <span className="text-cyan-300 font-bold">{vehicleParams.diffuserAngleDeg.toFixed(1)}°</span>
                  </div>
                  <input
                    type="range"
                    min={6.0}
                    max={15.0}
                    step={0.1}
                    value={vehicleParams.diffuserAngleDeg}
                    onChange={(e) => onUpdateParams({ diffuserAngleDeg: Number(e.target.value) })}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between">
                    <span className="text-zinc-300">Complexidade Borda Assoalho:</span>
                    <span className="text-amber-300 font-bold">{vehicleParams.floorEdgeComplexity}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={vehicleParams.floorEdgeComplexity}
                    onChange={(e) => onUpdateParams({ floorEdgeComplexity: Number(e.target.value) })}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between">
                    <span className="text-zinc-300">Asa Diant. Modo Z / X:</span>
                    <span className="text-white font-bold">
                      {vehicleParams.frontWingFlapCornerDeg}° / {vehicleParams.frontWingFlapStraightDeg}°
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="range"
                      min={18}
                      max={42}
                      value={vehicleParams.frontWingFlapCornerDeg}
                      onChange={(e) => onUpdateParams({ frontWingFlapCornerDeg: Number(e.target.value) })}
                      className="w-full accent-[#E10600] cursor-pointer"
                    />
                    <input
                      type="range"
                      min={4}
                      max={16}
                      value={vehicleParams.frontWingFlapStraightDeg}
                      onChange={(e) => onUpdateParams({ frontWingFlapStraightDeg: Number(e.target.value) })}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between">
                    <span className="text-zinc-300">Asa Tras. Modo Z / X:</span>
                    <span className="text-white font-bold">
                      {vehicleParams.rearWingFlapCornerDeg}° / {vehicleParams.rearWingFlapStraightDeg}°
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="range"
                      min={22}
                      max={48}
                      value={vehicleParams.rearWingFlapCornerDeg}
                      onChange={(e) => onUpdateParams({ rearWingFlapCornerDeg: Number(e.target.value) })}
                      className="w-full accent-[#E10600] cursor-pointer"
                    />
                    <input
                      type="range"
                      min={3}
                      max={15}
                      value={vehicleParams.rearWingFlapStraightDeg}
                      onChange={(e) => onUpdateParams({ rearWingFlapStraightDeg: Number(e.target.value) })}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-f1-mono tabular-nums bg-[#15151E] p-3 border border-white/5">
                <div>
                  <span className="text-zinc-400 block text-[9px]">MODO Z CL / CD</span>
                  <span className="text-white font-bold">{aeroZ.forces.clTotal.toFixed(2)} / {aeroZ.forces.cdTotal.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[9px]">BALANÇO DIANT.</span>
                  <span className="text-cyan-300 font-bold">{(aeroZ.forces.frontBalanceBf * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[9px]">PORPOISING</span>
                  <span className={aeroZ.sensitivities.porpoisingRiskPct > 55 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {aeroZ.sensitivities.porpoisingRiskPct.toFixed(0)}%
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[9px]">SEPARAÇÃO</span>
                  <span className="text-amber-300 font-bold">{aeroZ.sensitivities.separationMarginPct.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>

          {scopeFeedback && renderScopeAlignmentCard(scopeFeedback)}

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => onChangeSubStep('packaging')}
              className="px-4 py-2.5 bg-[#1C1C26] border border-white/10 text-zinc-300 text-xs font-f1-wide font-bold uppercase flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Packaging 3D</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeSubStep('dynamics')}
              className="px-5 py-2.5 bg-[#E10600] hover:bg-[#c20500] text-white text-xs font-f1-wide font-black uppercase f1-tab-chamfer flex items-center gap-2 cursor-pointer"
            >
              <span>Avançar para Dinâmica (M05/M06) & MDO Pareto</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-STEP 4/4: M05 DINÂMICA, M06 PNEUS, M10 MDO & GATES                */}
      {/* ===================================================================== */}
      {subStep === 'dynamics' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* M05 + M06 Controls */}
            <div className="lg:col-span-7 bg-[#1C1C26] border border-white/10 p-4 space-y-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-xs font-f1-wide font-bold text-white uppercase">
                  Cinemática, Suspensão & Contato Pacejka (M05 + M06)
                </span>
                <span className={gate05.passed && gate06.passed ? 'text-[10px] font-f1-mono text-emerald-400 font-bold' : 'text-[10px] font-f1-mono text-amber-400 font-bold'}>
                  G05: {gate05.passed ? 'OK' : 'WARN'} · G06: {gate06.passed ? 'OK' : 'WARN'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                  <span className="text-[11px] font-f1-wide font-bold text-white uppercase block">Eixo Dianteiro</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['pullrod', 'pushrod'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => onUpdateParams({ frontSuspensionType: t })}
                        className={`py-2 px-2 border text-xs font-f1-mono uppercase cursor-pointer ${
                          vehicleParams.frontSuspensionType === t
                            ? 'border-emerald-500 bg-emerald-950/40 text-white font-bold'
                            : 'border-white/10 bg-[#1C1C26] text-zinc-400'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                  <span className="text-[11px] font-f1-wide font-bold text-white uppercase block">Eixo Traseiro</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['pushrod', 'pullrod'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => onUpdateParams({ rearSuspensionType: t })}
                        className={`py-2 px-2 border text-xs font-f1-mono uppercase cursor-pointer ${
                          vehicleParams.rearSuspensionType === t
                            ? 'border-emerald-500 bg-emerald-950/40 text-white font-bold'
                            : 'border-white/10 bg-[#1C1C26] text-zinc-400'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-f1-mono">
                <div>
                  <div className="flex justify-between">
                    <span className="text-zinc-300">Mola (K):</span>
                    <span className="text-white font-bold">{vehicleParams.springRateNmm} N/mm</span>
                  </div>
                  <input
                    type="range"
                    min={140}
                    max={340}
                    step={5}
                    value={vehicleParams.springRateNmm}
                    onChange={(e) => onUpdateParams({ springRateNmm: Number(e.target.value) })}
                    className="w-full accent-[#E10600] cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between">
                    <span className="text-zinc-300">Amortecedor:</span>
                    <span className="text-white font-bold">{vehicleParams.damperNsM} N·s/m</span>
                  </div>
                  <input
                    type="range"
                    min={2500}
                    max={6500}
                    step={100}
                    value={vehicleParams.damperNsM}
                    onChange={(e) => onUpdateParams({ damperNsM: Number(e.target.value) })}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between">
                    <span className="text-zinc-300">Barra (ARB):</span>
                    <span className="text-white font-bold">{vehicleParams.antiRollBarNmm} N/mm</span>
                  </div>
                  <input
                    type="range"
                    min={40}
                    max={140}
                    step={2}
                    value={vehicleParams.antiRollBarNmm}
                    onChange={(e) => onUpdateParams({ antiRollBarNmm: Number(e.target.value) })}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between">
                    <span className="text-zinc-300">Anti-Dive:</span>
                    <span className="text-white font-bold">{vehicleParams.antiDivePct}%</span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={65}
                    step={1}
                    value={vehicleParams.antiDivePct}
                    onChange={(e) => onUpdateParams({ antiDivePct: Number(e.target.value) })}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between">
                    <span className="text-zinc-300">Anti-Squat:</span>
                    <span className="text-white font-bold">{vehicleParams.antiSquatPct}%</span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={65}
                    step={1}
                    value={vehicleParams.antiSquatPct}
                    onChange={(e) => onUpdateParams({ antiSquatPct: Number(e.target.value) })}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between">
                    <span className="text-zinc-300">Camber Estático:</span>
                    <span className="text-white font-bold">{vehicleParams.staticCamberDeg.toFixed(1)}°</span>
                  </div>
                  <input
                    type="range"
                    min={-3.5}
                    max={-1.2}
                    step={0.1}
                    value={vehicleParams.staticCamberDeg}
                    onChange={(e) => onUpdateParams({ staticCamberDeg: Number(e.target.value) })}
                    className="w-full accent-purple-400 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-f1-mono tabular-nums bg-[#15151E] p-3 border border-white/5">
                <div>
                  <span className="text-zinc-400 block text-[9px]">FREQ. NATURAL</span>
                  <span className="text-white font-bold">{dyn.suspensionResponse.naturalFrequencyFrontHz.toFixed(2)} Hz</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[9px]">AMORTEC. ζ</span>
                  <span className="text-cyan-300 font-bold">{dyn.suspensionResponse.dampingRatioFront.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[9px]">PEAK Fy PACEJKA</span>
                  <span className="text-emerald-400 font-bold">{Math.round(tire.forcesAndMoments.fyPeakN)} N</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[9px]">RESÍDUO LLTD</span>
                  <span className="text-amber-300 font-bold">{dyn.wheelLoadsN.closureErrorN.toFixed(2)} N</span>
                </div>
              </div>

              <CarSilhouette2026
                params={effectiveVehicleParams}
                title="Silhueta da Plataforma Dinâmica (Altura, Rake & Resposta Ativa X/Z)"
              />
            </div>

            {/* M10 MDO & Pareto Frontier Quick Optimizer */}
            <div className="lg:col-span-5 bg-[#1C1C26] border border-cyan-500/30 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-f1-wide font-bold text-white uppercase flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Otimização MDO & Fronteira Pareto (M10)</span>
                </span>
                <span className={mdo.solverMetadata.converged ? 'text-[10px] font-f1-mono text-emerald-400 font-bold' : 'text-[10px] font-f1-mono text-red-400 font-bold'}>
                  {mdo.solverMetadata.converged ? `CONVERGIU (${mdo.solverMetadata.iterationsUsed} it)` : 'NÃO CONVERGIU'}
                </span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {mdo.paretoFrontier.slice(0, 4).map((cand) => (
                  <div key={cand.id} className="bg-[#15151E] border border-white/10 p-2.5 text-xs font-f1-mono flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">{cand.label}</div>
                      <div className="text-[10px] text-zinc-400 truncate">{cand.subtitle}</div>
                      <div className="text-[10px] text-cyan-300 tabular-nums">
                        Volta: {cand.metrics.estimatedLapTimeS.toFixed(3)}s · L/D {cand.metrics.aeroEfficiencyLD.toFixed(2)} · {cand.metrics.totalMassKg.toFixed(1)}kg
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onUpdateParams(cand.paramsPatch)}
                      className="px-2.5 py-1.5 bg-[#E10600] hover:bg-[#c20500] text-white font-f1-wide font-bold text-[10px] uppercase shrink-0 cursor-pointer"
                    >
                      Aplicar
                    </button>
                  </div>
                ))}
              </div>

              {/* Gates 02..10 Matrix */}
              <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-white/10 text-[10px] font-f1-mono">
                {gatesSummary.map((g) => (
                  <div
                    key={g.id}
                    className={`px-2 py-1 border text-center font-bold ${
                      g.passed
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                        : 'bg-red-950/40 border-red-500/40 text-red-400'
                    }`}
                  >
                    {g.id}: {g.passed ? 'OK' : 'FAIL'}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {scopeFeedback && renderScopeAlignmentCard(scopeFeedback)}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => onChangeSubStep('monocoque')}
              className="w-full sm:w-auto px-5 py-3 border border-white/10 bg-[#1C1C26] hover:bg-white/5 text-zinc-300 font-f1-wide font-bold text-xs uppercase flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Revisar CFRP & Aero</span>
            </button>

            <button
              type="button"
              onClick={onReleaseToBahrain}
              className="w-full sm:w-auto px-6 py-3.5 bg-[#E10600] hover:bg-[#c20500] text-white font-f1-wide font-black text-xs uppercase tracking-wider f1-tab-chamfer flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>Liberar Carro M01–M10 para o Bahrein</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
