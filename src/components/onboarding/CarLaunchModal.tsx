import React, { useEffect, useMemo, useState } from 'react';
import { Award, CheckCircle2, ShieldCheck, Sparkles, ArrowRight, X } from 'lucide-react';
import { Packaging3DViewport } from '../engineering/Packaging3DViewport';
import type { PackagingAnalysisOutputs } from '../../engine/modules/m03Packaging';
import type { VehicleEngineeringParameters } from '../../types/physics';
import type { Driver, Team } from '../../types/f1';
import {
  getDefaultChassisSuggestions,
  validateChassisName,
} from '../../engine/chassisLaunchAndSeasonLoop';

interface CarLaunchModalProps {
  isOpen: boolean;
  initialChassisName: string;
  teamId: string;
  teamName: string;
  teamShort: string;
  teamColor: string;
  teamSecondaryColor: string;
  powerUnitName: string;
  packaging: PackagingAnalysisOutputs;
  vehicleParams: VehicleEngineeringParameters;
  drivers?: Driver[];
  soundEnabled?: boolean;
  onCancel: () => void;
  onConfirmAndAdvance: (confirmedChassisName: string) => void;
}

function playRevealFanfare(enabled: boolean) {
  if (!enabled) return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const notes = [196.0, 293.66, 392.0, 523.25];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);
      gain.gain.setValueAtTime(0.001, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(idx === 0 ? 0.08 : 0.06, now + idx * 0.14 + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 1.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 1.4);
    });
  } catch {
    // Web Audio blocked or unavailable
  }
}

function playFiaStampSound(enabled: boolean) {
  if (!enabled) return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    [440, 659.25, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);
      gain.gain.setValueAtTime(0.09, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.38);
    });
  } catch {
    // Web Audio blocked or unavailable
  }
}

export const CarLaunchModal: React.FC<CarLaunchModalProps> = ({
  isOpen,
  initialChassisName,
  teamId,
  teamName,
  teamShort,
  teamColor,
  teamSecondaryColor,
  powerUnitName,
  packaging,
  vehicleParams,
  drivers,
  soundEnabled = true,
  onCancel,
  onConfirmAndAdvance,
}) => {
  const suggestions = useMemo(
    () => getDefaultChassisSuggestions(teamShort, teamName),
    [teamShort, teamName]
  );

  const [chassisInput, setChassisInput] = useState<string>(
    initialChassisName || suggestions[0] || 'APX-01'
  );
  const [fiaStamped, setFiaStamped] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setFiaStamped(false);
      setChassisInput(initialChassisName || suggestions[0] || 'APX-01');
      playRevealFanfare(soundEnabled);
    }
  }, [isOpen, initialChassisName, suggestions, soundEnabled]);

  const validation = useMemo(() => validateChassisName(chassisInput), [chassisInput]);

  const previewCarModel = validation.normalized || 'APX-01';

  const previewTeam: Partial<Team> = useMemo(
    () => ({
      id: teamId,
      name: teamName,
      shortName: teamShort,
      carModelName: previewCarModel,
      color: teamColor,
      secondaryColor: teamSecondaryColor,
      isPlayer: true,
      engineSupplier: 'In-House',
    }),
    [teamId, teamName, teamShort, previewCarModel, teamColor, teamSecondaryColor]
  );

  if (!isOpen) return null;

  const handleConfirmRegistration = () => {
    if (!validation.valid) return;
    playFiaStampSound(soundEnabled);
    setFiaStamped(true);
  };

  return (
    <div className="fixed inset-0 z-[130] bg-[#07070C] flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-500">
      <div className="max-w-6xl w-full bg-[#0E0F16] border border-white/15 shadow-2xl overflow-hidden flex flex-col">
        {/* Ceremonial Header */}
        <div className="px-5 py-4 bg-[#14151F] border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 flex items-center justify-center font-f1-wide font-black text-xs text-white border border-white/25 shrink-0"
              style={{ backgroundColor: teamColor }}
            >
              {(teamShort || 'APX').toUpperCase().slice(0, 4)}
            </div>
            <div>
              <span className="text-[10px] font-f1-mono text-[#E10600] font-bold uppercase tracking-[0.2em] block">
                REVELAÇÃO DO PROJETO M01–M10 · SHAKEDOWN CERIMONIAL
              </span>
              <h2 className="font-f1-wide font-black text-lg sm:text-2xl text-white uppercase tracking-wider">
                LANÇAMENTO OFICIAL DO MONOPOSTO 2026
              </h2>
            </div>
          </div>

          {!fiaStamped && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 bg-[#1C1C26] hover:bg-white/10 border border-white/15 text-xs font-f1-mono text-zinc-300 flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Voltar ao Laboratório</span>
            </button>
          )}
        </div>

        {/* Main Ceremonial Split: 3D Showroom Showcase + FIA Naming Document */}
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left: Slowly Rotating 3D Car Wearing Team Livery & Stamped Nose */}
          <div className="lg:col-span-7 relative bg-[#0B0C12] border-b lg:border-b-0 lg:border-r border-white/10 p-3">
            <Packaging3DViewport
              packaging={packaging}
              vehicleParams={vehicleParams}
              playerTeam={previewTeam}
              drivers={drivers}
              defaultVisualMode="showroom"
              defaultSelectedTeamId={teamId}
              defaultAutoSpin={true}
              heightClass="h-[380px] lg:h-[500px]"
            />

            {/* Ceremonial FIA Registration Stamp Overlay after confirmation */}
            {fiaStamped && (
              <div className="mt-3 bg-emerald-950/85 border-2 border-emerald-400 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in zoom-in-95 duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-2 border-emerald-400 bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-7 h-7 text-emerald-300" />
                  </div>
                  <div>
                    <span className="text-[10px] font-f1-mono text-emerald-300 font-bold uppercase tracking-widest block">
                      CARIMBO OFICIAL FIA · HOMOLOGAÇÃO CONCLUÍDA
                    </span>
                    <div className="font-f1-wide font-black text-sm sm:text-base text-white uppercase">
                      CHASSI {previewCarModel} REGISTRADO COM SUCESSO PARA A TEMPORADA 2026.
                    </div>
                  </div>
                </div>
                <Award className="w-6 h-6 text-emerald-300 shrink-0 hidden sm:block" />
              </div>
            )}
          </div>

          {/* Right: Solemn FIA Naming Document */}
          <div className="lg:col-span-5 p-5 sm:p-6 bg-[#13141D] flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              {/* Official Document Header */}
              <div className="border-b border-white/10 pb-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 text-[10px] font-f1-mono font-bold text-white border border-white/25"
                    style={{ backgroundColor: teamColor }}
                  >
                    {teamShort.toUpperCase()}
                  </span>
                  <span className="font-f1-wide font-bold text-sm text-white uppercase">
                    {teamName}
                  </span>
                </div>
                <p className="text-[11px] font-f1-mono text-amber-300 font-bold">
                  Regulamento FIA 2026 - Artigo de Nomeação de Chassi
                </p>
                <p className="text-xs text-zinc-400 italic">
                  &ldquo;Cada construtor deve designar a nomenclatura oficial do seu chassi para a temporada.&rdquo;
                </p>
              </div>

              {/* Editable Chassis Name Input */}
              <div className="space-y-2">
                <label className="block text-[11px] font-f1-mono text-zinc-300 uppercase font-bold tracking-wider">
                  NOME DO CHASSI (Fabricante):
                </label>
                <input
                  type="text"
                  maxLength={10}
                  disabled={fiaStamped}
                  value={chassisInput}
                  onChange={(e) => setChassisInput(e.target.value.toUpperCase())}
                  placeholder="EX: APX-01"
                  style={{ color: teamColor }}
                  className={`w-full px-4 py-3 bg-[#0B0C12] border-2 font-f1-wide font-black text-xl tracking-widest uppercase focus:outline-none transition-colors ${
                    validation.valid
                      ? 'border-white/25 focus:border-white'
                      : 'border-red-500'
                  } disabled:opacity-80`}
                />
                <div className="flex items-center justify-between text-[10px] font-f1-mono">
                  <span className="text-zinc-500">
                    Regra FIA: 3 a 10 caracteres · Sem espaços · Sem nomes rivais
                  </span>
                  <span className="text-zinc-400 tabular-nums">{chassisInput.trim().length}/10</span>
                </div>
                {!validation.valid && validation.error && (
                  <p className="text-[11px] font-f1-mono text-red-400 bg-red-950/40 border border-red-500/40 px-2.5 py-1.5">
                    {validation.error}
                  </p>
                )}
              </div>

              {/* Prefilled Read-Only Power Unit Name */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-f1-mono text-zinc-400 uppercase font-bold tracking-wider">
                  NOME DA UNIDADE DE POTÊNCIA (Motor):
                </label>
                <div className="px-3.5 py-2.5 bg-[#0B0C12] border border-white/10 font-f1-mono font-bold text-xs text-cyan-300">
                  {powerUnitName}
                </div>
              </div>

              {/* Naming Pattern Suggestions */}
              {!fiaStamped && (
                <div className="space-y-2">
                  <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">
                    PADRÃO DE NOMENCLATURA DA EQUIPE (Sugestões):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setChassisInput(sug)}
                        className={`px-2.5 py-1 text-xs font-f1-mono border transition-colors cursor-pointer ${
                          previewCarModel === sug
                            ? 'bg-white/15 border-white text-white font-bold'
                            : 'bg-[#191A26] border-white/10 text-zinc-300 hover:border-white/30'
                        }`}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Nose Cone Stamp Live Visual Preview */}
              <div className="bg-[#0B0C12] border border-white/10 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-f1-mono text-zinc-400 uppercase">
                  <span>PRÉVIA DO BICO DO MONOPOSTO 3D</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    TEMPO REAL
                  </span>
                </div>
                <div className="relative h-20 bg-[#151620] border border-white/10 flex items-center justify-center overflow-hidden">
                  <div
                    className="w-56 h-12 rounded-r-full border border-white/25 flex items-center justify-between px-4 shadow-inner"
                    style={{
                      background: `linear-gradient(90deg, ${teamColor}33 0%, #161822 45%, ${teamColor}66 100%)`,
                    }}
                  >
                    <span className="text-[10px] font-f1-mono text-zinc-300 font-bold">
                      {teamShort.toUpperCase()}
                    </span>
                    <span
                      className="font-f1-wide font-black text-base tracking-widest uppercase"
                      style={{ color: teamColor }}
                    >
                      {previewCarModel}
                    </span>
                    <span className="text-[10px] font-f1-mono text-zinc-400">26</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row gap-2.5">
              {!fiaStamped ? (
                <>
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-3 bg-[#1B1C26] hover:bg-white/10 border border-white/15 text-zinc-300 font-f1-wide font-bold text-xs uppercase cursor-pointer"
                  >
                    CANCELAR
                  </button>
                  <button
                    type="button"
                    disabled={!validation.valid}
                    onClick={handleConfirmRegistration}
                    className="flex-1 px-5 py-3 bg-[#E10600] hover:bg-[#c20500] disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-f1-wide font-black text-xs uppercase tracking-wider f1-tab-chamfer flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>CONFIRMAR LANÇAMENTO</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => onConfirmAndAdvance(previewCarModel)}
                  className="w-full px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-f1-wide font-black text-xs uppercase tracking-wider f1-tab-chamfer flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-colors"
                >
                  <span>IR PARA A PRÉ-TEMPORADA NO BAHREIN</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
