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
  Info,
  Star,
} from 'lucide-react';
import type { VehicleEngineeringParameters } from '../../types/physics';
import {
  TRACK_CHARACTERISTICS_CATALOG,
  VEHICLE_PHILOSOPHIES_M02,
  evaluatePhilosophyForTrack,
  evaluateGate02,
  type VehiclePhilosophyCode,
  type TrackCharacteristicsSi,
} from '../../engine/modules/m02Philosophy';
import { solveVehiclePhysics } from '../../engine/physicsEngine';
import { getPhilosophyBaselinePatch } from './onboardingPresets';
import { loadCircuitPackage } from '../../circuits';
import { RealCircuitMap } from '../circuits/RealCircuitMap';

import type { StaffMember } from '../../types/f1';
import type { PrincipalBackgroundId, PrincipalBackgroundOption } from '../../data/principalBackgroundsData';
import {
  PHILOSOPHY_SPECTRUM_POSITION,
  evaluateCascadingRdImpact,
  evaluatePhilosophyFitWithLeadership,
  getEngineersTargetShadow
} from '../../utils/profileSheets';

interface OnboardingM02PhilosophySelectorProps {
  selectedPhilosophy: VehiclePhilosophyCode;
  onSelectPhilosophy: (code: VehiclePhilosophyCode, applyBaselinePatch: Partial<VehicleEngineeringParameters>) => void;
  vehicleParams: VehicleEngineeringParameters;
  tradeoffsAcknowledged: boolean;
  onToggleTradeoffsAck: (ack: boolean) => void;
  principalBackground?: PrincipalBackgroundOption | PrincipalBackgroundId | string | null;
  headAero?: StaffMember | null;
  headPu?: StaffMember | null;
  sportingDirector?: StaffMember | null;
}

const PHILOSOPHY_ICONS: Record<VehiclePhilosophyCode, React.ReactNode> = {
  low_drag: <Wind className="w-4 h-4 text-cyan-400" />,
  high_downforce: <Layers className="w-4 h-4 text-[#E10600]" />,
  stable_platform: <Scale className="w-4 h-4 text-amber-400" />,
  aero_efficiency: <Compass className="w-4 h-4 text-emerald-400" />,
  mechanical_grip: <Wrench className="w-4 h-4 text-purple-400" />,
  balanced_adaptive: <Activity className="w-4 h-4 text-blue-400" />,
};

interface VisualAttributeBar {
  label: string;
  pct: number; // 0..100
  qualifier: string;
}

interface VisualPhilosophyProfile {
  headline: string;
  formulaTooltip: string;
  bars: VisualAttributeBar[];
  // 1..5 base car capability scores for track fit comparison
  carStrengths: {
    topSpeed: number;
    braking: number;
    highSpeedCorners: number;
    tractionSlowCorners: number;
  };
}

const VISUAL_PHILOSOPHY_PROFILES: Record<VehiclePhilosophyCode, VisualPhilosophyProfile> = {
  low_drag: {
    headline: 'Voa nas retas, mas sofre nas curvas lentas.',
    formulaTooltip: 'Foco em reduzir arrasto aerodinâmico D = ½ρV²CdA e potência dissipada P_D = D·V. Alvo Cd: 0.68–0.82.',
    bars: [
      { label: 'Velocidade Máxima', pct: 94, qualifier: 'Altíssima' },
      { label: 'Curvas Rápidas', pct: 58, qualifier: 'Média' },
      { label: 'Curvas Lentas', pct: 34, qualifier: 'Baixa' },
      { label: 'Estabilidade', pct: 44, qualifier: 'Difícil de acertar' },
    ],
    carStrengths: { topSpeed: 5, braking: 3, highSpeedCorners: 3, tractionSlowCorners: 2 },
  },
  high_downforce: {
    headline: 'Máxima pressão no chão para devorar curvas rápidas.',
    formulaTooltip: 'Maximiza força vertical Fz = ½ρV²ClA. Alvo Cl: 3.6–4.4 (maior arrasto induzido Cdi ∝ Cl²).',
    bars: [
      { label: 'Velocidade Máxima', pct: 42, qualifier: 'Baixa' },
      { label: 'Curvas Rápidas', pct: 95, qualifier: 'Altíssima' },
      { label: 'Curvas Lentas', pct: 78, qualifier: 'Alta' },
      { label: 'Estabilidade', pct: 64, qualifier: 'Média-Alta' },
    ],
    carStrengths: { topSpeed: 2, braking: 5, highSpeedCorners: 5, tractionSlowCorners: 4 },
  },
  stable_platform: {
    headline: 'Carro previsível e fácil de guiar em vento e ondulações.',
    formulaTooltip: 'Minimiza variação ∂Fz/∂h e migração de centro de pressão entre Modo Z e Modo X.',
    bars: [
      { label: 'Velocidade Máxima', pct: 64, qualifier: 'Média-Alta' },
      { label: 'Curvas Rápidas', pct: 74, qualifier: 'Alta' },
      { label: 'Curvas Lentas', pct: 72, qualifier: 'Alta' },
      { label: 'Estabilidade', pct: 95, qualifier: 'Altíssima' },
    ],
    carStrengths: { topSpeed: 3, braking: 4, highSpeedCorners: 4, tractionSlowCorners: 4 },
  },
  aero_efficiency: {
    headline: 'Equilíbrio inteligente: rápido nas retas sem perder apoio nas curvas.',
    formulaTooltip: 'Maximiza a razão CL/CD (Alvo L/D: 3.8–4.5) em todo o envelope de velocidades.',
    bars: [
      { label: 'Velocidade Máxima', pct: 84, qualifier: 'Alta' },
      { label: 'Curvas Rápidas', pct: 80, qualifier: 'Alta' },
      { label: 'Curvas Lentas', pct: 62, qualifier: 'Média' },
      { label: 'Estabilidade', pct: 74, qualifier: 'Alta' },
    ],
    carStrengths: { topSpeed: 5, braking: 4, highSpeedCorners: 4, tractionSlowCorners: 3 },
  },
  mechanical_grip: {
    headline: 'Foco em tração, zebras e preservação dos pneus em pistas travadas.',
    formulaTooltip: 'Prioriza forças de pneu Fy/Fx e complacência de suspensão (160–215 N/mm) sobre zebras.',
    bars: [
      { label: 'Velocidade Máxima', pct: 52, qualifier: 'Média' },
      { label: 'Curvas Rápidas', pct: 62, qualifier: 'Média' },
      { label: 'Curvas Lentas', pct: 94, qualifier: 'Altíssima' },
      { label: 'Estabilidade', pct: 82, qualifier: 'Alta' },
    ],
    carStrengths: { topSpeed: 3, braking: 4, highSpeedCorners: 3, tractionSlowCorners: 5 },
  },
  balanced_adaptive: {
    headline: 'Versátil e competitivo em qualquer tipo de circuito do calendário.',
    formulaTooltip: 'Distribui pesos equilibrados entre L/D, CL, estabilidade, aderência mecânica e folga térmica.',
    bars: [
      { label: 'Velocidade Máxima', pct: 72, qualifier: 'Boa' },
      { label: 'Curvas Rápidas', pct: 74, qualifier: 'Boa' },
      { label: 'Curvas Lentas', pct: 74, qualifier: 'Boa' },
      { label: 'Estabilidade', pct: 78, qualifier: 'Boa' },
    ],
    carStrengths: { topSpeed: 4, braking: 4, highSpeedCorners: 4, tractionSlowCorners: 4 },
  },
};

function getBarColorClass(pct: number): string {
  if (pct >= 80) return 'bg-emerald-500';
  if (pct >= 62) return 'bg-cyan-400';
  if (pct >= 45) return 'bg-amber-400';
  return 'bg-red-500';
}

function getDemandLabel(score01: number): { label: string; toneClass: string } {
  if (score01 >= 0.68) return { label: 'Essencial', toneClass: 'text-red-400' };
  if (score01 >= 0.45) return { label: 'Alta', toneClass: 'text-amber-300' };
  if (score01 >= 0.25) return { label: 'Média', toneClass: 'text-zinc-200' };
  return { label: 'Baixa', toneClass: 'text-zinc-400' };
}

function getStarQualifier(stars: number): { label: string; colorClass: string } {
  if (stars >= 5) return { label: 'Excelente', colorClass: 'text-emerald-400' };
  if (stars === 4) return { label: 'Boa', colorClass: 'text-cyan-300' };
  if (stars === 3) return { label: 'Média', colorClass: 'text-amber-300' };
  return { label: 'Fraca', colorClass: 'text-red-400' };
}

function buildTrackSimplifiedFit(
  philosophyCode: VehiclePhilosophyCode,
  track: TrackCharacteristicsSi
): {
  sectorTones: ['strong' | 'neutral' | 'weak', 'strong' | 'neutral' | 'weak', 'strong' | 'neutral' | 'weak'];
  summaryText: string;
} {
  const strengths = VISUAL_PHILOSOPHY_PROFILES[philosophyCode].carStrengths;
  const speedStrong = strengths.topSpeed >= 4;
  const cornerStrong = strengths.highSpeedCorners >= 4 || strengths.tractionSlowCorners >= 4;

  if (philosophyCode === 'low_drag') {
    return {
      sectorTones: ['strong', 'neutral', 'weak'],
      summaryText:
        'Seu carro deve ganhar ~0.25s nas retas principais, mas pode perder ~0.35s nos trechos de curvas lentas e freadas fortes.'
    };
  }
  if (philosophyCode === 'high_downforce') {
    return {
      sectorTones: [track.highSpeedShare > 0.36 ? 'weak' : 'neutral', 'strong', 'strong'],
      summaryText:
        'Seu carro deve ganhar ~0.30s nas sequências de curvas médias e rápidas, mas pode perder ~0.20s no fim das retas longas.'
    };
  }
  if (philosophyCode === 'aero_efficiency') {
    return {
      sectorTones: ['strong', 'strong', track.lowSpeedShare > 0.28 ? 'weak' : 'neutral'],
      summaryText:
        'Seu carro deve ganhar ~0.20s nas retas e curvas fluidas, perdendo apenas ~0.15s nas freadas de curva lenta.'
    };
  }
  if (philosophyCode === 'mechanical_grip') {
    return {
      sectorTones: [track.highSpeedShare > 0.38 ? 'weak' : 'neutral', 'neutral', 'strong'],
      summaryText:
        'Seu carro ganha ~0.25s na saída de curvas lentas e sobre zebras, mas sofre ~0.20s nas retas longas.'
    };
  }
  if (philosophyCode === 'stable_platform') {
    return {
      sectorTones: ['neutral', 'strong', 'neutral'],
      summaryText:
        'Plataforma muito constante em todos os setores: evita erros sobre zebras e mantém ritmo sólido com vento lateral.'
    };
  }

  return {
    sectorTones: [
      speedStrong ? 'strong' : 'neutral',
      cornerStrong ? 'strong' : 'neutral',
      'neutral'
    ],
    summaryText:
      'Ritmo equilibrado nos três setores da pista, sem fraquezas críticas em retas ou curvas técnicas.'
  };
}

export const OnboardingM02PhilosophySelector: React.FC<OnboardingM02PhilosophySelectorProps> = ({
  selectedPhilosophy,
  onSelectPhilosophy,
  vehicleParams,
  tradeoffsAcknowledged,
  onToggleTradeoffsAck,
  principalBackground,
  headAero,
  headPu,
  sportingDirector,
}) => {
  const [previewTrackCode, setPreviewTrackCode] = useState<string>('albert_park');
  const [hoveredPhilosophy, setHoveredPhilosophy] = useState<VehiclePhilosophyCode | null>(null);
  const [openCardInfoCode, setOpenCardInfoCode] = useState<VehiclePhilosophyCode | null>(null);
  const [showCascadeFormulaInfo, setShowCascadeFormulaInfo] = useState(false);
  const [showTrackMathInfo, setShowTrackMathInfo] = useState(false);

  const previewCircuitPkg = useMemo(() => loadCircuitPackage(previewTrackCode, 2026), [previewTrackCode]);
  const physics = useMemo(() => solveVehiclePhysics(vehicleParams), [vehicleParams]);

  const activePreviewCode = hoveredPhilosophy ?? selectedPhilosophy;
  const activeCascade = useMemo(
    () =>
      evaluateCascadingRdImpact({
        philosophyCode: activePreviewCode,
        principalBackground,
        headAero,
        headPu,
        sportingDirector,
      }),
    [activePreviewCode, principalBackground, headAero, headPu, sportingDirector]
  );

  const engineersShadow = useMemo(
    () => getEngineersTargetShadow({ principalBackground, headAero }),
    [principalBackground, headAero]
  );
  const currentSpectrumPos = PHILOSOPHY_SPECTRUM_POSITION[activePreviewCode] ?? 50;

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
  const simplifiedMapFit = useMemo(
    () => buildTrackSimplifiedFit(selectedPhilosophy, report.track),
    [selectedPhilosophy, report.track]
  );

  const activeTrackRows = useMemo(() => {
    const baseStrengths = VISUAL_PHILOSOPHY_PROFILES[selectedPhilosophy].carStrengths;
    const track = report.track;

    const topSpeedDemand = Math.min(1, track.highSpeedShare * 1.45);
    const brakingDemand = track.brakingSeverity;
    const highSpeedCornerDemand = Math.min(1, track.mediumSpeedShare * 1.35);
    const tractionSlowDemand = Math.min(1, Math.max(track.tractionDemand, track.lowSpeedShare * 1.4));

    return [
      {
        label: 'Velocidade Máxima',
        demand: getDemandLabel(topSpeedDemand),
        stars: baseStrengths.topSpeed,
      },
      {
        label: 'Frenagem',
        demand: getDemandLabel(brakingDemand),
        stars: baseStrengths.braking,
      },
      {
        label: 'Curvas Rápidas',
        demand: getDemandLabel(highSpeedCornerDemand),
        stars: baseStrengths.highSpeedCorners,
      },
      {
        label: 'Tração e Curvas Lentas',
        demand: getDemandLabel(tractionSlowDemand),
        stars: baseStrengths.tractionSlowCorners,
      },
    ];
  }, [selectedPhilosophy, report.track]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#1C1C26] border border-white/10 p-3.5">
        <div className="flex items-center gap-3 text-xs">
          <span className="text-[#E10600] font-f1-wide font-bold uppercase">
            Escolha a Filosofia do Carro (6 Conceitos)
          </span>
          <span
            className={`px-2 py-0.5 border text-[10px] font-mono font-bold uppercase inline-flex items-center gap-1 ${
              gate02.passed
                ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-400'
                : 'bg-amber-950/50 border-amber-500/40 text-amber-300'
            }`}
          >
            {gate02.passed ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
            <span>{gate02.passed ? 'Aprovado' : 'Confirme Trade-offs'}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-400">Testar na pista:</span>
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

      {/* 6 Filosofias com Barras Visuais Intuitivas (Fórmulas ficam no botão "i") */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {Object.values(VEHICLE_PHILOSOPHIES_M02).map((phil) => {
          const isSelected = selectedPhilosophy === phil.code;
          const visual = VISUAL_PHILOSOPHY_PROFILES[phil.code];
          const leadershipFit = evaluatePhilosophyFitWithLeadership({
            philosophyCode: phil.code,
            principalBackground,
            headAero,
            headPu,
            sportingDirector,
          });
          const cardCascade = evaluateCascadingRdImpact({
            philosophyCode: phil.code,
            principalBackground,
            headAero,
            headPu,
            sportingDirector,
          });

          const cardBorderClass = isSelected
            ? 'bg-[#1C1C26] border-[#E10600] ring-1 ring-[#E10600]'
            : leadershipFit.tier === 'conflict'
            ? 'bg-[#15151E] border-red-500/35 hover:border-red-400/70'
            : leadershipFit.tier === 'risk'
            ? 'bg-[#15151E] border-amber-500/35 hover:border-amber-400/70'
            : leadershipFit.tier === 'recommended'
            ? 'bg-[#15151E] border-emerald-500/40 hover:border-emerald-400/75'
            : 'bg-[#15151E] border-white/10 hover:border-white/25';

          const isInfoOpen = openCardInfoCode === phil.code;

          return (
            <div
              key={phil.code}
              role="button"
              tabIndex={0}
              onMouseEnter={() => setHoveredPhilosophy(phil.code)}
              onMouseLeave={() => setHoveredPhilosophy(null)}
              onFocus={() => setHoveredPhilosophy(phil.code)}
              onBlur={() => setHoveredPhilosophy(null)}
              onClick={() => onSelectPhilosophy(phil.code, getPhilosophyBaselinePatch(phil.code))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectPhilosophy(phil.code, getPhilosophyBaselinePatch(phil.code));
                }
              }}
              className={`p-4 text-left border transition-all cursor-pointer flex flex-col justify-between gap-3.5 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${cardBorderClass}`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-f1-wide font-bold text-white uppercase">
                    {PHILOSOPHY_ICONS[phil.code]}
                    <span>{phil.name}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {(headAero || principalBackground) && leadershipFit.tier !== 'neutral' && (
                      <span
                        className={`text-[10px] font-mono font-bold uppercase ${
                          leadershipFit.tier === 'recommended'
                            ? 'text-emerald-400'
                            : leadershipFit.tier === 'risk'
                            ? 'text-amber-300'
                            : 'text-red-400'
                        }`}
                      >
                        {leadershipFit.badgeLabel}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenCardInfoCode(isInfoOpen ? null : phil.code);
                      }}
                      title="Ver fórmula física e metas de engenharia"
                      aria-label={`Ver detalhes técnicos de ${phil.name}`}
                      className={`p-1 border transition-colors ${
                        isInfoOpen
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-zinc-200 leading-snug">{visual.headline}</p>

                {isInfoOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="p-2.5 bg-[#0f0f15] border border-cyan-500/40 text-[11px] text-cyan-200 leading-relaxed"
                  >
                    <strong className="block text-white mb-0.5">Detalhes Técnicos (Engenharia):</strong>
                    {visual.formulaTooltip}
                  </div>
                )}
              </div>

              {/* 4 Barras de Atributos do Carro */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                {visual.bars.map((bar) => (
                  <div key={bar.label} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-300">{bar.label}</span>
                      <span className="text-white font-semibold tabular-nums">{bar.qualifier}</span>
                    </div>
                    <div className="h-1.5 w-full bg-black/70 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-200 ${getBarColorClass(bar.pct)}`}
                        style={{ width: `${bar.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* O que o Chefe de Aero / Diretoria acha + Prazo */}
              <div className="pt-2.5 border-t border-white/10 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between tabular-nums">
                  <span className="text-zinc-400">Prazo do Chassi Inicial:</span>
                  <span
                    className={`font-mono font-bold ${
                      cardCascade.projectedChassisWeeks > 10
                        ? 'text-red-400'
                        : cardCascade.projectedChassisWeeks > 8
                        ? 'text-amber-300'
                        : 'text-emerald-400'
                    }`}
                  >
                    {cardCascade.projectedChassisWeeks} sem (Normal: {cardCascade.baseChassisWeeks})
                  </span>
                </div>

                {(headAero || principalBackground) && (
                  <div className="pt-1 border-t border-white/5 flex items-start gap-1.5">
                    {leadershipFit.tier === 'conflict' ? (
                      <span className="text-red-400 flex items-start gap-1.5 leading-snug">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{leadershipFit.reason}</span>
                      </span>
                    ) : leadershipFit.tier === 'risk' ? (
                      <span className="text-amber-300 flex items-start gap-1.5 leading-snug">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{leadershipFit.reason}</span>
                      </span>
                    ) : leadershipFit.tier === 'recommended' ? (
                      <span className="text-emerald-400 flex items-start gap-1.5 leading-snug">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{leadershipFit.reason}</span>
                      </span>
                    ) : (
                      <span className="text-zinc-400 leading-snug">{leadershipFit.reason}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* PREVIEW DE DESENVOLVIMENTO & SOMBRA DOS ENGENHEIROS */}
      <div
        className={`p-4 border space-y-3.5 ${
          activeCascade.isSevereCascade
            ? 'bg-red-950/25 border-red-500/60'
            : activeCascade.efficiencyDisplayPct < 95
            ? 'bg-amber-950/20 border-amber-500/50'
            : 'bg-[#1C1C26] border-emerald-500/35'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
          <div className="flex items-center gap-2 text-xs font-f1-wide font-bold uppercase text-white">
            <span>
              Impacto na Fábrica (P&D) · {VEHICLE_PHILOSOPHIES_M02[activePreviewCode].name}
            </span>
            {hoveredPhilosophy && hoveredPhilosophy !== selectedPhilosophy && (
              <span className="text-[11px] font-sans text-cyan-300 font-normal normal-case">
                (Prévia ao passar o mouse)
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
            <span
              className={`font-bold ${
                activeCascade.projectedChassisWeeks > 10
                  ? 'text-red-400'
                  : activeCascade.projectedChassisWeeks > 8
                  ? 'text-amber-300'
                  : 'text-emerald-400'
              }`}
            >
              Chassi Inicial: {activeCascade.projectedChassisWeeks} Semanas (Normal: {activeCascade.baseChassisWeeks} sem)
            </span>
            <span className="text-zinc-400">
              Peça Média: <strong className="text-white">{activeCascade.projectedPartWeeks} sem</strong>
            </span>
          </div>
        </div>

        {/* Sombra dos Engenheiros (Linha Tracejada de Alvo vs Posição do Carro) + Eficiência P&D */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-7 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-cyan-300 font-semibold">Foco em Retas</span>
              <span className="text-zinc-300">
                Alvo dos Engenheiros: <strong className="text-white">{engineersShadow.targetLabel}</strong>
              </span>
              <span className="text-[#E10600] font-semibold">Foco em Curvas</span>
            </div>
            <div className="relative h-6 bg-[#15151E] border border-white/15 px-2 flex items-center">
              <div className="w-full h-1 bg-white/10" />
              {/* Linha Tracejada da Sombra dos Engenheiros */}
              <div
                className="absolute top-0 bottom-0 border-l-2 border-dashed border-cyan-300 z-10 pointer-events-none"
                style={{ left: `${engineersShadow.targetPosition}%` }}
                title={`Alvo recomendado pelos engenheiros: ${engineersShadow.targetLabel}`}
              >
                <span className="absolute -top-0.5 left-1 text-[9px] text-cyan-300 whitespace-nowrap">
                  Alvo Staff
                </span>
              </div>
              {/* Posição Atual / Hovered do Conceito */}
              <div
                className={`absolute top-1 bottom-1 w-2.5 -ml-1.5 transition-all duration-200 z-20 ${
                  activeCascade.isSevereCascade
                    ? 'bg-red-500'
                    : activeCascade.efficiencyDisplayPct < 95
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ left: `${currentSpectrumPos}%` }}
                title={`Conceito: ${VEHICLE_PHILOSOPHIES_M02[activePreviewCode].name}`}
              />
            </div>
          </div>

          <div className="lg:col-span-5 space-y-1.5">
            <div className="flex items-center justify-between text-xs tabular-nums">
              <span className="text-zinc-300 font-semibold">Ritmo da Equipe</span>
              <div className="flex items-center gap-1.5">
                <span
                  className={`font-mono font-bold ${
                    activeCascade.efficiencyDisplayPct >= 100
                      ? 'text-emerald-400'
                      : activeCascade.efficiencyDisplayPct >= 75
                      ? 'text-amber-300'
                      : 'text-red-400'
                  }`}
                >
                  {activeCascade.efficiencyDisplayPct}%
                </span>
                <button
                  type="button"
                  onClick={() => setShowCascadeFormulaInfo(v => !v)}
                  title="Ver cálculo multiplicativo de P&D"
                  aria-label="Ver cálculo multiplicativo de P&D"
                  className="p-0.5 border border-white/15 text-zinc-400 hover:text-white"
                >
                  <Info className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="h-2.5 w-full bg-black/70 border border-white/10 overflow-hidden">
              <div
                className={`h-full transition-all duration-200 ${
                  activeCascade.efficiencyDisplayPct >= 100
                    ? 'bg-emerald-500'
                    : activeCascade.efficiencyDisplayPct >= 75
                    ? 'bg-amber-400'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, activeCascade.efficiencyDisplayPct)}%` }}
              />
            </div>
            {showCascadeFormulaInfo && (
              <div className="text-[11px] font-mono text-cyan-200 bg-[#0f0f15] border border-cyan-500/35 px-2.5 py-1.5">
                Cálculo: Diretoria ({activeCascade.boardSpeedMultiplier.toFixed(2)}x) × Alinhamento ({activeCascade.philosophyMultiplier.toFixed(2)}x) = {(activeCascade.combinedSpeedMultiplier * 100).toFixed(0)}% velocidade.
              </div>
            )}
          </div>
        </div>

        {/* Detalhes da Cascata / Alerta de Sabotagem e Mídia */}
        <div className="text-xs space-y-1.5 pt-1 border-t border-white/10">
          {activeCascade.headlineAlert && (
            <div className="text-red-300 font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>{activeCascade.headlineAlert}</span>
            </div>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-zinc-300">
            {activeCascade.reasons.map((r, idx) => (
              <span key={idx}>• {r}</span>
            ))}
          </div>
          {activeCascade.narrativeEventText && (
            <div className="p-2.5 bg-red-950/40 border border-red-500/45 text-red-200 space-y-1">
              <div className="font-bold text-white">{activeCascade.narrativeEventTitle}</div>
              <div>{activeCascade.narrativeEventText}</div>
              {activeCascade.mediaRumourText && (
                <div className="text-amber-300 font-semibold">{activeCascade.mediaRumourText}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SISTEMA DE NECESSIDADES DA PISTA VS PONTOS FORTES DO CARRO + MAPA POR CORES */}
      <div className="bg-[#1C1C26] border border-white/10 p-4 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
          <div>
            <span className="text-xs font-f1-wide font-bold text-white uppercase block">
              {report.track.name} · O que a pista exige vs. Seu Carro ({report.philosophy.name})
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs tabular-nums">
            <span className="text-emerald-400 font-mono font-bold">
              Compatibilidade: {report.trackCompatibilityPct}%
            </span>
            <button
              type="button"
              onClick={() => setShowTrackMathInfo(v => !v)}
              title="Ver função objetivo e alvos matemáticos SI"
              aria-label="Ver função objetivo e alvos matemáticos SI"
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#15151E] border border-white/15 text-[11px] text-zinc-300 hover:text-white"
            >
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>Dados de Engenharia</span>
            </button>
          </div>
        </div>

        {showTrackMathInfo && (
          <div className="p-3 bg-[#0f0f15] border border-cyan-500/35 text-[11px] font-mono text-cyan-200 space-y-1">
            <div>
              <strong>Função Objetivo J = {report.objectiveScoreJ}</strong> · Alvo CL [{report.targetRanges.targetClRange.join('–')}] · Alvo Cd [{report.targetRanges.targetCdRange.join('–')}] · Razão L/D [{report.targetRanges.targetLdRange.join('–')}]
            </div>
            <div className="text-zinc-400">
              Pressão aerodinâmica e arrasto são simulados continuamente em unidades SI durante os fins de semana de corrida.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Estrelas e Requisitos da Pista */}
          <div className="lg:col-span-7 bg-[#15151E] border border-white/10 p-3.5 flex flex-col justify-between gap-3">
            <div className="grid grid-cols-12 text-[11px] text-zinc-400 border-b border-white/10 pb-1.5 font-semibold">
              <span className="col-span-4">Característica</span>
              <span className="col-span-3">A pista exige</span>
              <span className="col-span-5 text-right">Seu carro aqui</span>
            </div>

            <div className="space-y-2.5">
              {activeTrackRows.map((row) => {
                const qual = getStarQualifier(row.stars);
                return (
                  <div
                    key={row.label}
                    className="grid grid-cols-12 items-center gap-2 text-xs py-1 border-b border-white/5 last:border-b-0"
                  >
                    <span className="col-span-4 text-white font-medium">{row.label}</span>
                    <span className={`col-span-3 font-semibold ${row.demand.toneClass}`}>
                      {row.demand.label}
                    </span>
                    <div className="col-span-5 flex items-center justify-end gap-2">
                      <div className="flex items-center gap-0.5" aria-label={`${row.stars} de 5 estrelas`}>
                        {[1, 2, 3, 4, 5].map((idx) => (
                          <Star
                            key={idx}
                            className={`w-3.5 h-3.5 ${
                              idx <= row.stars
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-zinc-700'
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`text-[11px] font-semibold w-16 text-right ${qual.colorClass}`}>
                        {qual.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mapa Simplificado com Setores Verde / Roxo / Vermelho */}
          <div className="lg:col-span-5">
            <RealCircuitMap
              circuitPackage={previewCircuitPkg}
              compact
              simplifiedFit={simplifiedMapFit}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/10">
          <div className="text-xs text-zinc-300 space-y-0.5">
            {report.tradeoffsToConfirm.map((t, i) => (
              <div key={i}>• Trade-off: {t}</div>
            ))}
          </div>

          <label className="flex items-center gap-2 text-xs text-white bg-[#15151E] border border-white/15 px-3.5 py-2 cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={tradeoffsAcknowledged}
              onChange={(e) => onToggleTradeoffsAck(e.target.checked)}
              className="accent-[#E10600]"
            />
            <span>Aceito os compromissos de projeto (Gate 02)</span>
          </label>
        </div>
      </div>
    </div>
  );
};
