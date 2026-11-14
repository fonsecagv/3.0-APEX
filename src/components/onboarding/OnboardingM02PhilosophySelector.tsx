import React, { useMemo, useState } from 'react';
import {
  Compass,
  Wind,
  Layers,
  Activity,
  Scale,
  Wrench,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type { VehicleEngineeringParameters } from '../../types/physics';
import {
  TRACK_CHARACTERISTICS_CATALOG,
  VEHICLE_PHILOSOPHIES_M02,
  evaluatePhilosophyForTrack,
  evaluateGate02,
  type VehiclePhilosophyCode,
} from '../../engine/modules/m02Philosophy';
import { solveVehiclePhysics } from '../../engine/physicsEngine';
import { getPhilosophyBaselinePatch } from './onboardingPresets';
import { loadCircuitPackage } from '../../circuits';
import { RealCircuitMap } from '../circuits/RealCircuitMap';

interface OnboardingM02PhilosophySelectorProps {
  selectedPhilosophy: VehiclePhilosophyCode;
  onSelectPhilosophy: (code: VehiclePhilosophyCode, applyBaselinePatch: Partial<VehicleEngineeringParameters>) => void;
  vehicleParams: VehicleEngineeringParameters;
  tradeoffsAcknowledged: boolean;
  onToggleTradeoffsAck: (ack: boolean) => void;
}

const PHILOSOPHY_ICONS: Record<VehiclePhilosophyCode, React.ReactNode> = {
  low_drag: <Wind className="w-4 h-4 text-cyan-400" />,
  high_downforce: <Layers className="w-4 h-4 text-[#E10600]" />,
  stable_platform: <Scale className="w-4 h-4 text-amber-400" />,
  aero_efficiency: <Compass className="w-4 h-4 text-emerald-400" />,
  mechanical_grip: <Wrench className="w-4 h-4 text-purple-400" />,
  balanced_adaptive: <Activity className="w-4 h-4 text-blue-400" />,
};

export const OnboardingM02PhilosophySelector: React.FC<OnboardingM02PhilosophySelectorProps> = ({
  selectedPhilosophy,
  onSelectPhilosophy,
  vehicleParams,
  tradeoffsAcknowledged,
  onToggleTradeoffsAck,
}) => {
  const [previewTrackCode, setPreviewTrackCode] = useState<string>('albert_park');

  const previewCircuitPkg = useMemo(() => loadCircuitPackage(previewTrackCode, 2026), [previewTrackCode]);
  const physics = useMemo(() => solveVehiclePhysics(vehicleParams), [vehicleParams]);

  const report = useMemo(
    () =>
      evaluatePhilosophyForTrack(
        selectedPhilosophy,
        previewTrackCode,
        {
          aeroEfficiencyLd: physics.cornerMode.aeroEfficiencyLD,
          clTotal: physics.cornerMode.clTotal,
          cdTotal: physics.cornerMode.cdTotal,
          platformStability01: Math.max(0.1, Math.min(0.99, physics.summary.consistencyScore / 100)),
          mechanicalGrip01: Math.max(0.1, Math.min(0.99, physics.summary.cornerGripScore / 100)),
          thermalMarginK: physics.thermalMarginC,
        },
        physics.totalMassKg < physics.legalMinMassKg ? 1 : 0,
        tradeoffsAcknowledged
      ),
    [selectedPhilosophy, previewTrackCode, physics, tradeoffsAcknowledged]
  );

  const gate02 = useMemo(() => evaluateGate02(report), [report]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#1C1C26] border border-white/10 p-3.5">
        <div className="flex items-center gap-2 text-xs font-f1-mono">
          <span className="text-[#E10600] font-bold uppercase">M02 · 6 FILOSOFIAS OFICIAIS DO MANUAL MESTRE</span>
          <span
            className={`px-2 py-0.5 border text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
              gate02.passed
                ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-400'
                : 'bg-amber-950/50 border-amber-500/40 text-amber-300'
            }`}
          >
            {gate02.passed ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
            <span>GATE 02: {gate02.passed ? 'APROVADO' : 'CONFIRME TRADE-OFFS'}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-f1-mono">
          <span className="text-zinc-400">Simular Aderência ao Circuito:</span>
          <select
            value={previewTrackCode}
            onChange={(e) => setPreviewTrackCode(e.target.value)}
            className="bg-[#15151E] border border-white/15 px-2.5 py-1 text-white"
          >
            {TRACK_CHARACTERISTICS_CATALOG.map((t) => (
              <option key={t.circuitCode} value={t.circuitCode}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 6 Official M02 Philosophies Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.values(VEHICLE_PHILOSOPHIES_M02).map((phil) => {
          const isSelected = selectedPhilosophy === phil.code;
          const topWeight = [...phil.weights].sort((a, b) => b.weight - a.weight)[0];
          return (
            <button
              key={phil.code}
              type="button"
              onClick={() => onSelectPhilosophy(phil.code, getPhilosophyBaselinePatch(phil.code))}
              className={`p-4 text-left border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                isSelected
                  ? 'bg-[#1C1C26] border-[#E10600] ring-1 ring-[#E10600]'
                  : 'bg-[#15151E] border-white/10 hover:border-white/25'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-f1-wide font-bold text-white uppercase">
                    {PHILOSOPHY_ICONS[phil.code]}
                    <span>{phil.name}</span>
                  </div>
                  <span className="text-[10px] font-f1-mono text-zinc-400">v{phil.version}</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">{phil.priority}</p>
              </div>

              <div className="pt-2 border-t border-white/10 text-[10px] font-f1-mono space-y-1">
                <div className="flex justify-between text-cyan-300">
                  <span>Foco Principal ({Math.round(topWeight.weight * 100)}%):</span>
                  <span className="font-bold">{topWeight.label}</span>
                </div>
                <div className="text-amber-300/90 leading-tight">{phil.typicalTradeoffs[0]}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Live M02 Analysis & Tradeoff Acknowledgment */}
      <div className="bg-[#1C1C26] border border-white/10 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
          <span className="text-xs font-f1-wide font-bold text-white uppercase">
            MATRIZ DE OBJETIVOS & TRADE-OFFS ({report.philosophy.name} em {report.track.name})
          </span>
          <div className="flex items-center gap-4 text-xs font-f1-mono tabular-nums">
            <span className="text-emerald-400 font-bold">
              Compatibilidade Pista: {report.trackCompatibilityPct}%
            </span>
            <span className="text-cyan-300 font-bold">Função Objetivo J = {report.objectiveScoreJ}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-f1-mono">
            {report.philosophy.weights.map((w) => (
              <div key={w.metric} className="bg-[#15151E] p-2.5 border border-white/5 space-y-0.5">
                <div className="flex justify-between text-zinc-400">
                  <span>{(w.weight * 100).toFixed(0)}%</span>
                  <span className="uppercase text-[9px] text-amber-400">{w.relationType}</span>
                </div>
                <div className="text-white font-bold truncate" title={w.label}>
                  {w.label}
                </div>
                <div className="text-[10px] text-cyan-300">
                  Alvo: {w.targetMin}–{w.targetMax} {w.unitSi}
                </div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-4">
            <RealCircuitMap circuitPackage={previewCircuitPkg} compact />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/10">
          <div className="text-[11px] font-f1-mono text-zinc-300 space-y-0.5">
            {report.tradeoffsToConfirm.map((t, i) => (
              <div key={i}>• Trade-off M02: {t}</div>
            ))}
          </div>

          <label className="flex items-center gap-2 text-xs font-f1-mono text-white bg-[#15151E] border border-white/15 px-3 py-2 cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={tradeoffsAcknowledged}
              onChange={(e) => onToggleTradeoffsAck(e.target.checked)}
              className="accent-[#E10600]"
            />
            <span>Aceito os trade-offs físicos (Gate 02)</span>
          </label>
        </div>
      </div>
    </div>
  );
};
