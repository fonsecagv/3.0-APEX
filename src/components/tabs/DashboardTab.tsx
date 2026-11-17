import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { F1TabBucket } from '../brand/F1Logo';
import { PRINCIPAL_BACKGROUNDS } from '../../data/principalBackgroundsData';
import {
  Flag,
  Gauge,
  Sliders,
  AlertTriangle,
  Award,
  Zap,
  TrendingUp,
  Wind,
  Layers,
  ChevronRight,
  ShieldAlert,
  Users,
  Clock,
  Megaphone,
  AlertOctagon,
  Sparkles,
  X,
  Building2,
  Wrench,
  Shield,
  CheckCircle2,
  Compass,
  Map as MapIcon,
  Wallet,
  ListChecks
} from 'lucide-react';
import { RIVAL_TEAMS_DOSSIER, RivalTeamDossier } from '../../data/marketData';
import { RealCircuitMap } from '../circuits/RealCircuitMap';
import { GrandsPrixExplorer } from '../circuits/GrandsPrixExplorer';

export const DashboardTab: React.FC = () => {
  const {
    playerTeam,
    allTeams,
    drivers,
    currentCircuit,
    currentCircuitPackage,
    currentWeek,
    seasonYear,
    setActiveTab,
    dashboardViewMode,
    setDashboardViewMode,
    vehicleParams,
    vehiclePhysics,
    components,
    financials,
    principalProfile,
    modificadorErroCorrelacao,
    modificadorSinergiaPiloto,
    modificadorTempoPeD,
    modificadorConfiabilidade,
    modificadorConfiancaDiretoria,
    modificadorMoralFabrica,
    modificadorCaixaInicial,
    modificadorDownforce,
    modificadorTempoManufatura,
    modificadorSetupRapido,
    semanasParaTeste,
    baseDeFas,
    receitaMarketing,
    pendingRegulationChange,
    resolveRegulatoryChoice,
    notifications,
    clearNotification,
    performanceHistory,
    consecutiveNoPointsRaces,
    aduoWindowActive,
    aduoWeeksRemaining,
    aduoHomologationQuotas,
    aduoChassisDelayWeeks,
    aduoLastGapPercent,
    aduoBenchmarkPwr,
    aduoPlayerPwr,
    motorHomologadoFIA,
    homologarMotorFIA,
    pendingSeasonEventCard,
    resolveSeasonEventCard,
    pendingMidSeasonDilemma,
    resolveMidSeasonDilemma,
    currentCircuitIndex,
    rdFacilityCapacity,
    setupWindow,
    fpRunsDone,
    simulateFreePractice1And2,
    t,
    language
  } = useGame();

  const [hoveredPointIdx, setHoveredPointIdx] = useState<number | null>(null);
  const [selectedRivalDossier, setSelectedRivalDossier] = useState<RivalTeamDossier | null>(null);

  const activeBg = PRINCIPAL_BACKGROUNDS.find(b => b.id === principalProfile.background) || PRINCIPAL_BACKGROUNDS[0];

  // Sort teams by points
  const sortedTeams = [...allTeams].sort((a, b) => b.points - a.points);
  const playerPosition = sortedTeams.findIndex(t => t.id === playerTeam.id) + 1;

  const crisisTeams = allTeams.filter(t => t.conceptCrisis);
  const isMoraleCrisis = consecutiveNoPointsRaces >= 3 || modificadorMoralFabrica <= -20;

  // Car composite calculations
  const avgDownforce = Math.round(
    components.reduce((acc, c) => acc + c.downforce, 0) / (components.length || 1)
  );
  const avgReliability = Math.round(
    components.reduce((acc, c) => acc + c.reliability, 0) / (components.length || 1)
  );
  const totalWeight = components.reduce((acc, c) => acc + c.weightKg, 0) + 360; // plus engine/chassis base

  return (
    <div className="space-y-6">
      {/* Main Screen View Mode Switcher: Command Center vs All Grands Prix & Circuits */}
      <div className="bg-[#1C1C26] border border-white/10 p-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setDashboardViewMode('command')}
            className={`px-4 py-2 text-xs font-f1-wide font-bold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              dashboardViewMode === 'command'
                ? 'bg-[#E10600] text-white'
                : 'bg-[#15151E] text-zinc-400 hover:text-white border border-white/10'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Painel de Comando</span>
          </button>
          <button
            type="button"
            onClick={() => setDashboardViewMode('grands_prix')}
            className={`px-4 py-2 text-xs font-f1-wide font-bold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              dashboardViewMode === 'grands_prix'
                ? 'bg-[#E10600] text-white'
                : 'bg-[#15151E] text-zinc-400 hover:text-white border border-white/10'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Grandes Prêmios & Todos os Circuitos (31)</span>
          </button>
        </div>
        <span className="text-[11px] font-f1-mono text-zinc-400 px-2">
          Etapa {currentCircuit.round} · {currentCircuit.name} ({currentCircuit.country})
        </span>
      </div>

      {dashboardViewMode === 'grands_prix' ? (
        <GrandsPrixExplorer
          seasonYear={seasonYear}
          vehicleParams={vehicleParams}
          vehiclePhysics={vehiclePhysics}
          currentCircuitId={currentCircuit.id}
          currentRound={currentCircuit.round}
          onEnterRaceWeekend={() => setActiveTab('race_weekend')}
        />
      ) : (
      <>
      {/* PAINEL IMEDIATO DE AÇÃO: PRÓXIMO GP, BOTÃO AVANÇAR SEMANA & PRÓXIMOS PASSOS */}
      {(() => {
        const activeDevCount = components.filter(c => c.inDevelopment).length;
        const maxSlots = rdFacilityCapacity?.manufacturingMaxSlots ?? 2;
        const freeSlots = Math.max(0, maxSlots - activeDevCount);
        const hasPendingDecision = Boolean(pendingSeasonEventCard || pendingMidSeasonDilemma || pendingRegulationChange);
        const aeroLabels: Record<string, string> = {
          very_low: 'Arrasto Mínimo',
          low: 'Baixo Arrasto',
          medium: 'Equilibrado',
          high: 'Alto Downforce',
          very_high: 'Carga Máxima',
        };
        const nextSteps: Array<{ id: string; title: string; detail: string; done: boolean; actionLabel?: string; onClick?: () => void }> = [
          ...(hasPendingDecision
            ? [{
                id: 'decision',
                title: 'Responder decisão pendente do Paddock / FIA',
                detail: 'Há uma carta ou diretiva aguardando sua escolha logo abaixo.',
                done: false,
              }]
            : []),
          {
            id: 'pu_homolog',
            title: motorHomologadoFIA ? 'Unidade de Potência homologada na FIA' : 'Homologar Unidade de Potência antes da Semana 8',
            detail: motorHomologadoFIA
              ? 'Hardware selado — foco liberado para evolução de chassi e pista.'
              : `Restam ${Math.max(0, semanasParaTeste)} semana(s) para o congelamento obrigatório.`,
            done: motorHomologadoFIA,
            actionLabel: !motorHomologadoFIA ? 'Ver Bancada' : undefined,
            onClick: !motorHomologadoFIA ? () => setActiveTab('engineering') : undefined,
          },
          {
            id: 'rd_slots',
            title: freeSlots > 0 ? `Iniciar projeto de P&D (${freeSlots} slot livre)` : `Pipeline de P&D ativo (${activeDevCount}/${maxSlots} slots)`,
            detail: freeSlots > 0
              ? 'Você tem capacidade ociosa na fábrica para desenvolver Assoalho, Asas ou Suspensão.'
              : 'Peças em fabricação avançam semanalmente pelo botão Avançar Semana no topo.',
            done: freeSlots === 0,
            actionLabel: freeSlots > 0 ? 'Abrir P&D' : undefined,
            onClick: freeSlots > 0 ? () => setActiveTab('engineering') : undefined,
          },
          {
            id: 'fp_setup',
            title: setupWindow.confidence >= 65 ? `Acerto de pista encaminhado (${setupWindow.confidence}%)` : `Calibrar setup no Treino Livre (${setupWindow.confidence}%)`,
            detail: fpRunsDone === 0
              ? `Nenhum stint feito ainda em ${currentCircuit.city}.`
              : `${fpRunsDone}/3 stints concluídos para a Classificação.`,
            done: setupWindow.confidence >= 65,
            actionLabel: setupWindow.confidence < 65 ? 'Ir para Treino' : undefined,
            onClick: setupWindow.confidence < 65 ? () => setActiveTab('race_weekend') : undefined,
          },
        ];

        const cashAvailable = Math.round(financials.bankBalance);
        const isDangerCash = cashAvailable < 3_000_000;
        const isLowCash = !isDangerCash && cashAvailable < 8_000_000;
        const cashStatus = isDangerCash
          ? {
              textClass: 'text-red-400',
              borderClass: 'border-red-500/40 bg-red-950/25',
              badgeClass: 'bg-red-950/70 border-red-500/50 text-red-300',
              label: 'PERIGO FINANCEIRO IMINENTE',
            }
          : isLowCash
          ? {
              textClass: 'text-amber-400',
              borderClass: 'border-amber-500/40 bg-amber-950/20',
              badgeClass: 'bg-amber-950/70 border-amber-500/50 text-amber-300',
              label: 'RESERVA BAIXA',
            }
          : {
              textClass: 'text-emerald-400',
              borderClass: 'border-white/10 bg-[#15151E]',
              badgeClass: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300',
              label: 'FLUXO SAUDÁVEL',
            };
        const costCapPct = Math.min(
          100,
          Math.max(0, (financials.costCapSpent / Math.max(1, financials.costCapLimit)) * 100)
        );
        const costCapBarClass =
          costCapPct >= 93 ? 'bg-red-500' : costCapPct >= 80 ? 'bg-amber-500' : 'bg-emerald-500';
        const costCapRemainingM = Math.max(
          0,
          (financials.costCapLimit - financials.costCapSpent) / 1_000_000
        );

        return (
          <div className="bg-[#1C1C26] border border-[#E10600]/45 p-5 f1-pattern-micro-grid">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
              {/* Bloco Esquerdo: Próximo GP, Widget Financeiro & Ação Principal */}
              <div className="xl:col-span-7 flex flex-col justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-f1-mono uppercase tracking-wider">
                    <span className="text-[#E10600] font-bold">PRÓXIMO GRANDE PRÊMIO</span>
                    <span className="text-zinc-500">·</span>
                    <span className="text-zinc-300 font-bold tabular-nums">ETAPA {currentCircuitIndex + 1} / 24</span>
                    <span className="text-zinc-500">·</span>
                    <span className="text-cyan-300 font-bold tabular-nums">SEMANA {currentWeek}</span>
                  </div>
                  <h2 className="font-f1-wide font-black text-xl sm:text-2xl text-white uppercase tracking-wide">
                    {currentCircuit.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-f1-mono text-zinc-300 tabular-nums">
                    <span>{currentCircuit.city}, {currentCircuit.country}</span>
                    <span className="text-zinc-600">·</span>
                    <span>{currentCircuit.laps} voltas</span>
                    <span className="text-zinc-600">·</span>
                    <span>Aero: <strong className="text-white">{aeroLabels[currentCircuit.aeroDemand] || currentCircuit.aeroDemand}</strong></span>
                    <span className="text-zinc-600">·</span>
                    <span>Desgaste Pneus: <strong className="text-white">{currentCircuit.tireWearSeverity}/5</strong></span>
                  </div>
                </div>

                {/* Widget Financeiro em Destaque */}
                <div className={`border p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-4 ${cashStatus.borderClass}`}>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-f1-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5 text-zinc-400" />
                        <span>CAIXA DISPONÍVEL</span>
                      </span>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 border text-[9px] font-f1-mono font-bold uppercase whitespace-nowrap ${cashStatus.badgeClass}`}>
                        {(isDangerCash || isLowCash) ? (
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                        )}
                        <span>{cashStatus.label}</span>
                      </span>
                    </div>
                    <div className={`font-f1-wide font-black text-lg sm:text-xl tabular-nums ${cashStatus.textClass}`}>
                      $ {cashAvailable.toLocaleString('pt-BR')}
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:border-l sm:border-white/10 sm:pl-4">
                    <div className="flex items-center justify-between gap-2 text-[10px] font-f1-mono uppercase">
                      <span className="text-zinc-400">TETO DE GASTOS (COST CAP)</span>
                      <span className="text-white font-bold tabular-nums">
                        ${(financials.costCapSpent / 1_000_000).toFixed(1)}M / ${(financials.costCapLimit / 1_000_000).toFixed(0)}M
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#15151E] border border-white/10 overflow-hidden">
                      <div
                        className={`h-full transition-all ${costCapBarClass}`}
                        style={{ width: `${costCapPct.toFixed(1)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-f1-mono text-zinc-400 tabular-nums">
                      <span>{costCapPct.toFixed(0)}% utilizado</span>
                      <span>Margem restante: <strong className="text-zinc-200">${costCapRemainingM.toFixed(1)}M</strong></span>
                    </div>
                  </div>
                </div>

                {/* Ação Principal Única (CTA) + Atalho Opcional de Treinos Livres */}
                <div className="flex flex-wrap items-center gap-3 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('race_weekend')}
                    className="px-6 py-3 bg-[#E10600] hover:bg-[#c20500] text-white font-f1-wide font-black text-xs sm:text-sm uppercase tracking-wider f1-tab-chamfer transition-colors flex items-center gap-2 shadow-md cursor-pointer whitespace-nowrap"
                  >
                    <Flag className="w-4 h-4" />
                    <span>INICIAR FIM DE SEMANA DO GP</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {fpRunsDone < 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        simulateFreePractice1And2();
                        setActiveTab('race_weekend');
                      }}
                      className="px-4 py-3 bg-[#15151E] hover:bg-[#252533] border border-white/20 hover:border-white/40 text-zinc-200 hover:text-white font-f1-wide font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
                    >
                      <Sliders className="w-4 h-4 text-cyan-400" />
                      <span>Simular Treinos Livres (TL1 e TL2)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Bloco Direito: Próximos Passos Recomendados */}
              <div className="xl:col-span-5 bg-[#15151E] border border-white/10 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-[11px] font-f1-wide font-bold text-white uppercase flex items-center gap-1.5">
                    <ListChecks className="w-4 h-4 text-emerald-400" />
                    <span>PRÓXIMOS PASSOS DA SEMANA</span>
                  </span>
                  <span className="text-[10px] font-f1-mono text-zinc-400 tabular-nums">
                    {nextSteps.filter(s => s.done).length}/{nextSteps.length} concluídos
                  </span>
                </div>
                <div className="space-y-2">
                  {nextSteps.slice(0, 3).map(step => (
                    <div
                      key={step.id}
                      className="flex items-start justify-between gap-2.5 text-xs font-f1-mono bg-[#1C1C26] p-2.5 border border-white/5"
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            step.done ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        />
                        <div className="min-w-0">
                          <div className={`font-bold leading-snug ${step.done ? 'text-zinc-300' : 'text-white'}`}>
                            {step.title}
                          </div>
                          <div className="text-[10px] text-zinc-400 leading-snug mt-0.5">
                            {step.detail}
                          </div>
                        </div>
                      </div>
                      {step.actionLabel && step.onClick && (
                        <button
                          type="button"
                          onClick={step.onClick}
                          className="px-2 py-1 bg-[#252533] hover:bg-[#323244] border border-white/15 text-[10px] font-f1-wide font-bold text-white uppercase shrink-0 cursor-pointer whitespace-nowrap"
                        >
                          {step.actionLabel}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 1. CRIAÇÃO DO EVENTO: O Prazo da FIA (Dia da Homologação FIA) */}
      <div className={`p-4 border font-f1-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        motorHomologadoFIA
          ? 'bg-[#1C1C26] border-emerald-500/40 text-zinc-300'
          : Math.max(0, semanasParaTeste * 7) > 0
          ? 'bg-[#1C1C26] border-white/10 text-zinc-300'
          : 'bg-red-950/40 border-[#E10600] text-red-300 animate-pulse'
      }`}>
        <div className="flex items-center gap-2.5">
          <Clock className={`w-5 h-5 shrink-0 ${motorHomologadoFIA ? 'text-emerald-400' : Math.max(0, semanasParaTeste * 7) > 0 ? 'text-cyan-400' : 'text-[#E10600]'}`} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-f1-wide font-black text-sm text-white uppercase tracking-wider block">
                {motorHomologadoFIA
                  ? 'DIA DA HOMOLOGAÇÃO FIA · PROJETO SELADO'
                  : `Dias para a Homologação da FIA: ${Math.max(0, semanasParaTeste * 7)} dias`}
              </span>
              <span className={`text-[10px] font-f1-mono px-2 py-0.5 border font-bold uppercase ${
                motorHomologadoFIA
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : Math.max(0, semanasParaTeste * 7) > 0
                  ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                  : 'bg-red-950/60 border-red-500/50 text-red-300'
              }`}>
                {motorHomologadoFIA ? 'MOTOR HOMOLOGADO 🔒' : `${semanasParaTeste} SEMANAS`}
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 block mt-0.5">
              {motorHomologadoFIA
                ? 'O hardware desta PU está congelado até o fim da temporada. Modificações permitidas apenas via Software ou Janelas ADUO.'
                : 'Evento FIA: Dia da Homologação (8 semanas após o Dia 00, véspera dos testes do Bahrein). Quando o contador zerar, o hardware da PU será selado compulsoriamente.'}
            </span>
          </div>
        </div>

        {!motorHomologadoFIA && (
          <button
            type="button"
            onClick={() => homologarMotorFIA()}
            className="px-4 py-2 bg-[#252533] hover:bg-[#2F2F40] border border-white/20 text-white font-f1-wide font-bold text-xs uppercase tracking-wider transition-colors shrink-0 cursor-pointer"
          >
            Homologar Motor FIA
          </button>
        )}
      </div>

      {/* 5. IMPACTO NO JOGO: Atraso de Desenvolvimento do Chassi (ADUO) */}
      {aduoChassisDelayWeeks > 0 && (
        <div className="bg-amber-950/40 border-2 border-amber-500/70 p-4 font-f1-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 border border-amber-500 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-f1-wide font-black text-sm text-white uppercase tracking-wider">
                  ATRASO DE DESENVOLVIMENTO DO CHASSI (ADUO)
                </span>
                <span className="text-[10px] bg-amber-500 text-black px-2 py-0.5 font-bold uppercase">
                  +{aduoChassisDelayWeeks} SEMANAS
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                Progresso de CAD e túnel de vento do chassi <strong>congelado</strong> enquanto a fábrica reconfigura a célula de sobrevivência às novas dimensões e tubulações da PU modificada na Bancada ADUO.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 font-f1-mono text-[10px] font-bold uppercase shrink-0 border bg-amber-950/60 border-amber-500/50 text-amber-300">
            CHASSI CONGELADO
          </span>
        </div>
      )}

      {/* Banner de Janela ADUO Aberta */}
      {aduoWindowActive && (
        <div className="bg-[#1C1C26] border-2 border-emerald-500/60 p-4 font-f1-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-500 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-f1-wide font-black text-sm text-white uppercase tracking-wider">
                  JANELA REGULAMENTAR ADUO ABERTA
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 font-bold uppercase">
                  {aduoWeeksRemaining} SEMANAS RESTANTES
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 mt-1">
                Déficit para o benchmark: <strong className="text-amber-400">{aduoLastGapPercent}%</strong> · <strong>{aduoHomologationQuotas} Cota(s)</strong> de homologação disponíveis na Bancada de Montagem de P&D.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('engineering')}
            className="px-4 py-2 bg-[#E10600] hover:bg-[#c20500] text-white font-f1-wide font-bold text-xs uppercase tracking-wider transition-colors shrink-0 cursor-pointer"
          >
            Abrir Bancada em P&D
          </button>
        </div>
      )}

      {/* Regulatory Drift Urgent Banner */}
      {pendingRegulationChange && (
        <div className="bg-[#1C1C26] border-2 border-[#E10600] p-5 f1-pattern-red-grid relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-[#E10600] shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-f1-wide font-black text-sm text-white uppercase tracking-wider">
                    {pendingRegulationChange.title}
                  </span>
                  <span className="text-xs bg-[#E10600] text-white px-2 py-0.5 font-f1-mono font-bold">
                    MANDATORY
                  </span>
                </div>
                <p className="text-sm text-zinc-300 mt-1 max-w-2xl">
                  {pendingRegulationChange.description}
                </p>
                <div className="text-xs font-f1-mono text-zinc-400 mt-1">
                  IMPACT: {pendingRegulationChange.impact} · Targeted Season: {pendingRegulationChange.targetSeason}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {pendingRegulationChange.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => resolveRegulatoryChoice(idx)}
                  className="px-3.5 py-2 bg-[#252533] hover:bg-[#2F2F40] border border-white/10 text-xs font-f1-wide uppercase tracking-wider text-white transition-colors"
                >
                  <div className="font-bold">{opt.label}</div>
                  <div className="text-[10px] font-f1-mono text-[#E10600]">
                    Cost: ${(opt.cost / 1000000).toFixed(1)}M
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CARTA INTERATIVA SEMANAL DE PADDOCK (EVOLUÇÃO PÓS-FASE 8) */}
      {pendingSeasonEventCard && (
        <div className="bg-[#1C1C26] border-2 border-cyan-500/70 p-5 shadow-lg space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-f1-wide font-black text-sm text-white uppercase tracking-wider">
                    {pendingSeasonEventCard.title}
                  </span>
                  <span className="text-[10px] font-f1-mono px-2 py-0.5 bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-bold uppercase">
                    {pendingSeasonEventCard.category.replace('_', ' ')} · SEMANA {pendingSeasonEventCard.weekCreated}
                  </span>
                </div>
                <div className="text-[11px] font-f1-mono text-zinc-400 mt-0.5">
                  Remetente: <span className="text-zinc-200 font-bold">{pendingSeasonEventCard.sender}</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed">
            {pendingSeasonEventCard.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {pendingSeasonEventCard.options.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => resolveSeasonEventCard(idx)}
                className="text-left p-3 bg-[#15151E] hover:bg-[#232332] border border-white/15 hover:border-cyan-400/70 transition-colors cursor-pointer space-y-1"
              >
                <div className="font-f1-wide font-bold text-xs text-white uppercase flex items-center justify-between gap-2">
                  <span>{opt.label}</span>
                  <ChevronRight className="w-4 h-4 text-cyan-400 shrink-0" />
                </div>
                <div className="text-[11px] font-f1-mono text-zinc-400 leading-snug">
                  {opt.effectSummary}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* DILEMA ESTRATÉGICO DE MEIO DE TEMPORADA (ATUAL VS PRÓXIMO ANO) */}
      {pendingMidSeasonDilemma && (
        <div className="bg-[#1C1C26] border-2 border-amber-500/80 p-5 shadow-xl space-y-4">
          <div className="flex items-start gap-3">
            <Compass className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-f1-wide font-black text-sm text-white uppercase tracking-wider">
                  {pendingMidSeasonDilemma.title}
                </span>
                <span className="text-[10px] font-f1-mono bg-amber-500 text-black px-2 py-0.5 font-bold uppercase">
                  DECISÃO ESTRATÉGICA · ETAPA {pendingMidSeasonDilemma.round}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-200 mt-1.5 leading-relaxed">
                {pendingMidSeasonDilemma.description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => resolveMidSeasonDilemma('current_car')}
              className="text-left p-3.5 bg-[#15151E] hover:bg-[#252533] border border-white/15 hover:border-[#E10600] transition-colors cursor-pointer space-y-1.5"
            >
              <div className="font-f1-wide font-bold text-xs text-white uppercase">
                Foco Total no {pendingMidSeasonDilemma.currentChassisName}
              </div>
              <div className="text-[11px] font-f1-mono text-emerald-400">
                +2.5 DFm imediato · 15% ATR no ano seguinte
              </div>
              <div className="text-[10px] font-f1-mono text-zinc-400">
                Maximiza vitórias e pódios nesta temporada; carro do próximo ano nasce mais conservador.
              </div>
            </button>

            <button
              type="button"
              onClick={() => resolveMidSeasonDilemma('balanced')}
              className="text-left p-3.5 bg-[#15151E] hover:bg-[#252533] border border-white/15 hover:border-cyan-400 transition-colors cursor-pointer space-y-1.5"
            >
              <div className="font-f1-wide font-bold text-xs text-white uppercase">
                Transição Equilibrada (50% / 50%)
              </div>
              <div className="text-[11px] font-f1-mono text-cyan-300">
                +1.0 DFm atual · 50% ATR para {pendingMidSeasonDilemma.nextChassisName}
              </div>
              <div className="text-[10px] font-f1-mono text-zinc-400">
                Mantém competitividade nas pistas restantes sem comprometer a base do projeto seguinte.
              </div>
            </button>

            <button
              type="button"
              onClick={() => resolveMidSeasonDilemma('next_year')}
              className="text-left p-3.5 bg-[#15151E] hover:bg-[#252533] border border-white/15 hover:border-amber-400 transition-colors cursor-pointer space-y-1.5"
            >
              <div className="font-f1-wide font-bold text-xs text-white uppercase">
                Virar a Chave para o {pendingMidSeasonDilemma.nextChassisName}
              </div>
              <div className="text-[11px] font-f1-mono text-amber-300">
                +40h ATR · 85% ATR focado no próximo regulamento
              </div>
              <div className="text-[10px] font-f1-mono text-zinc-400">
                Sacrifica upgrades finais do {pendingMidSeasonDilemma.currentChassisName} para acelerar o futuro monoposto.
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 9. A MORAL DA FÁBRICA (O Efeito Dominó) */}
      {isMoraleCrisis && (
        <div className="p-4 bg-red-950/50 border-2 border-[#E10600] flex items-start gap-3.5 animate-pulse">
          <AlertOctagon className="w-6 h-6 text-[#E10600] shrink-0 mt-0.5" />
          <div className="text-xs font-f1-mono">
            <span className="font-f1-wide font-black text-red-300 uppercase text-sm block mb-1">
              CRISE NA FÁBRICA · MORAL ABAIXO DE 40% ({consecutiveNoPointsRaces} CORRIDAS CONSECUTIVAS SEM PONTUAR)
            </span>
            <p className="text-red-100 font-bold leading-relaxed">
              A diretoria e os operários estão desmoralizados. Consequências em vigor: Projetos de P&D demoram <strong>+20% de tempo</strong> para serem concluídos e os pilotos correm sob pressão psicológica extrema, aumentando a taxa de erros e rodadas.
            </p>
            <p className="text-zinc-400 text-[11px] mt-1.5">
              Recuperação: Termine uma corrida entre os 10 primeiros (zona de pontuação) para restaurar a confiança da fábrica.
            </p>
          </div>
        </div>
      )}

      {/* 7. CRISE DE CONCEITO DA IA (Efeito Mercedes 2022) */}
      {crisisTeams.length > 0 && (
        <div className="space-y-2">
          {crisisTeams.map(t => (
            <div key={t.id} className="p-3.5 bg-amber-950/40 border border-amber-500/50 flex items-start gap-3">
              <Megaphone className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs font-f1-mono">
                <span className="font-f1-wide font-black text-amber-300 uppercase block mb-0.5">
                  MANCHETE DO PADDOCK: CRISE DE CONCEITO NA {t.name.toUpperCase()}
                </span>
                <p className="text-zinc-200 leading-relaxed">
                  Imprensa internacional: A <strong>{t.name}</strong> admitiu erro grave no conceito do carro de {seasonYear} e pode demitir seu diretor técnico! O monoposto perdeu cerca de <strong>1.5s no ritmo de volta</strong> em relação aos líderes.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 10. HISTÓRICO DE PERFORMANCE (Gráfico no Dashboard - 3 Anos de Evolução) */}
      <F1TabBucket
        title="HISTÓRICO DE PERFORMANCE & EVOLUÇÃO (3 TEMPORADAS)"
        badge="TELEMETRIA RELATIVA"
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-f1-mono">
            <span className="text-zinc-400">
              Evolução e regressão do ritmo de volta do seu carro vs. os 3 principais concorrentes (Ferrari, Red Bull e Mercedes).
            </span>
            
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-[11px] shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-[#E10600] rounded-full inline-block shadow-[0_0_6px_#E10600]" />
                <span className="text-white font-bold">{playerTeam.shortName} (Seu Carro)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-[#DC0000] rounded-sm inline-block" />
                <span className="text-zinc-300">Ferrari</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-[#1E41FF] rounded-sm inline-block" />
                <span className="text-zinc-300">Red Bull</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-[#00D2BE] rounded-sm inline-block" />
                <span className="text-zinc-300">Mercedes</span>
              </div>
            </div>
          </div>

          {/* SVG Line Chart */}
          <div className="bg-[#15151E] p-4 border border-white/5 relative">
            <svg
              viewBox="0 0 800 240"
              className="w-full h-56 overflow-visible"
            >
              {/* Grid Lines */}
              {[70, 75, 80, 85, 90, 95].map(val => {
                const y = 20 + 180 * (1 - (val - 70) / 26);
                return (
                  <g key={val}>
                    <line x1={45} y1={y} x2={785} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                    <text x={38} y={y + 3} fill="#71717A" fontSize={9} fontFamily="monospace" textAnchor="end">
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Draw Lines */}
              {(() => {
                const pts = performanceHistory;
                const N = pts.length;
                const getX = (i: number) => N === 1 ? 400 : 45 + (i / (N - 1)) * 740;
                const getY = (rating: number) => 20 + 180 * (1 - Math.max(0, Math.min(26, rating - 70)) / 26);

                const playerPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.playerRating)}`).join(' ');
                const ferrariPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.rivalRatings.ferrari)}`).join(' ');
                const rbPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.rivalRatings.redbull)}`).join(' ');
                const mercPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.rivalRatings.mercedes)}`).join(' ');

                return (
                  <>
                    {/* Ferrari Line */}
                    <path d={ferrariPath} fill="none" stroke="#DC0000" strokeWidth={2} opacity={0.7} />
                    {/* Red Bull Line */}
                    <path d={rbPath} fill="none" stroke="#1E41FF" strokeWidth={2} opacity={0.7} />
                    {/* Mercedes Line */}
                    <path d={mercPath} fill="none" stroke="#00D2BE" strokeWidth={2} opacity={0.7} />
                    {/* Player Line (Thicker & Glowing) */}
                    <path d={playerPath} fill="none" stroke="#E10600" strokeWidth={3.5} className="drop-shadow-[0_0_8px_rgba(225,6,0,0.6)]" />

                    {/* Circles & Interaction */}
                    {pts.map((p, i) => {
                      const cx = getX(i);
                      const cy = getY(p.playerRating);
                      const isHovered = hoveredPointIdx === i;

                      return (
                        <g key={i} className="cursor-pointer" onMouseEnter={() => setHoveredPointIdx(i)} onMouseLeave={() => setHoveredPointIdx(null)}>
                          {/* Round Marker tick */}
                          <line x1={cx} y1={200} x2={cx} y2={205} stroke="#52525B" />
                          <text x={cx} y={218} fill="#A1A1AA" fontSize={8} fontFamily="monospace" textAnchor="middle">
                            {p.round === 0 ? 'Teste' : `R${p.round}`}
                          </text>

                          {/* Dots */}
                          <circle cx={cx} cy={getY(p.rivalRatings.ferrari)} r={2} fill="#DC0000" opacity={0.6} />
                          <circle cx={cx} cy={getY(p.rivalRatings.redbull)} r={2} fill="#1E41FF" opacity={0.6} />
                          <circle cx={cx} cy={getY(p.rivalRatings.mercedes)} r={2} fill="#00D2BE" opacity={0.6} />
                          
                          {/* Player dot */}
                          <circle
                            cx={cx}
                            cy={cy}
                            r={isHovered ? 5.5 : 3.5}
                            fill="#E10600"
                            stroke="#FFFFFF"
                            strokeWidth={1.5}
                            className="transition-all"
                          />
                        </g>
                      );
                    })}
                  </>
                );
              })()}
            </svg>

            {/* Hover Tooltip */}
            {hoveredPointIdx !== null && performanceHistory[hoveredPointIdx] && (() => {
              const pt = performanceHistory[hoveredPointIdx];
              return (
                <div className="absolute top-3 right-4 bg-[#1C1C26] border border-white/20 p-3 shadow-xl text-xs font-f1-mono pointer-events-none z-20">
                  <div className="font-f1-wide font-black text-white uppercase text-[11px] mb-1">
                    {pt.round === 0 ? 'Pré-Temporada' : `Rodada ${pt.round} (${pt.circuitName}) · ${pt.season}`}
                  </div>
                  <div className="space-y-0.5 text-[11px]">
                    <div className="text-red-400 font-bold">
                      {playerTeam.shortName}: {pt.playerRating} pts
                    </div>
                    <div className="text-red-300">
                      Ferrari: {pt.rivalRatings.ferrari} pts
                    </div>
                    <div className="text-blue-400">
                      Red Bull: {pt.rivalRatings.redbull} pts
                    </div>
                    <div className="text-teal-300">
                      Mercedes: {pt.rivalRatings.mercedes} pts
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </F1TabBucket>

      {/* 2026 Technical Regulation Hero Card */}
      {(() => {
        const homologatedChassis = playerTeam.carModelName || 'APX-01';
        const basePuName = playerTeam.engineCustomName || playerTeam.engineSupplier;
        const fullHomologatedPu =
          playerTeam.thirdPartyErsSupplier && !basePuName.includes(playerTeam.thirdPartyErsSupplier)
            ? `${basePuName} + ERS ${playerTeam.thirdPartyErsSupplier}`
            : basePuName;
        const homologatedPeakHp = playerTeam.homologatedPeakPowerHp ?? vehiclePhysics.peakCombinedPowerHp;
        const carRank = [...allTeams].sort((a, b) => b.carRating - a.carRating).findIndex(team => team.id === playerTeam.id) + 1;

        return (
          <div className="bg-[#1C1C26] border border-white/10 f1-pattern-micro-grid p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-[#E10600]/10 to-transparent pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div>
                <div className="flex items-center gap-2 text-xs font-f1-mono text-[#E10600] font-bold tracking-widest uppercase">
                  <span>{t.directiveTitle}</span>
                  <span>·</span>
                  <span>{seasonYear}</span>
                </div>
                <h1 className="font-f1-wide font-black text-2xl lg:text-3xl text-white tracking-tight uppercase mt-1">
                  CHASSI: {homologatedChassis}
                </h1>
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-f1-mono text-zinc-300 mt-1.5">
                  <span>Equipe: <strong className="text-white">{playerTeam.name}</strong></span>
                  <span className="text-zinc-600">·</span>
                  <span>PU: <strong className="text-amber-300">{fullHomologatedPu}</strong></span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-emerald-400 font-bold tabular-nums">{homologatedPeakHp} CV Pico</span>
                </div>
                <p className="text-sm text-zinc-400 mt-2 max-w-2xl leading-relaxed">
                  {t.directiveDesc}
                </p>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                <div className="bg-[#15151E] border border-white/5 p-3 min-w-[115px]">
                  <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">{t.standings}</span>
                  <span className="text-xl font-f1-wide font-black text-white tabular-nums">
                    P{playerPosition}
                  </span>
                  <span className="text-[11px] font-f1-mono text-zinc-400 block mt-0.5 tabular-nums">
                    {playerTeam.points} PTS
                  </span>
                </div>

                <div className="bg-[#15151E] border border-white/5 p-3 min-w-[115px]">
                  <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">{t.carIndex}</span>
                  <span className="text-xl font-f1-wide font-black text-[#E10600] tabular-nums">
                    {playerTeam.carRating}
                  </span>
                  <span className="text-[11px] font-f1-mono text-zinc-400 block mt-0.5 tabular-nums">
                    Rank #{carRank} / {allTeams.length}
                  </span>
                </div>

                <div className="bg-[#15151E] border border-white/5 p-3 min-w-[115px]">
                  <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">{t.atrTunnel}</span>
                  <span className="text-xl font-f1-wide font-black text-white tabular-nums">
                    {financials.atrWindTunnelHoursAvailable}h
                  </span>
                  <span className="text-[11px] font-f1-mono text-zinc-400 block mt-0.5 tabular-nums">
                    {financials.atrCfdMegaAllocations} MAUh CFD
                  </span>
                </div>

                <div className="bg-[#15151E] border border-white/5 p-3 min-w-[125px]">
                  <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">MARKETING & FÃS</span>
                  <span className="text-xl font-f1-wide font-black text-cyan-400 tabular-nums">
                    {(baseDeFas / 1000000).toFixed(1)}M
                  </span>
                  <span className="text-[11px] font-f1-mono text-emerald-400 block mt-0.5 tabular-nums">
                    +${(receitaMarketing / 1000000).toFixed(2)}M/ano
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Widget Dedicado: Marketing & Base de Fãs */}
      <div className="bg-[#1C1C26] border border-white/10 p-5 f1-container-bucket space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-[#E10600]" />
            <h2 className="font-f1-wide font-black text-sm sm:text-base text-white uppercase tracking-wider">
              Marketing, Engajamento & Base de Fãs
            </h2>
          </div>
          <span className="text-[10px] font-f1-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2.5 py-1 uppercase tracking-wider font-bold">
            VALOR COMERCIAL DA FRANQUIA
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#15151E] p-4 border border-white/5 space-y-1">
            <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">BASE DE FÃS GLOBAL</span>
            <div className="text-2xl font-f1-wide font-black text-white tabular-nums">
              {baseDeFas.toLocaleString()}
            </div>
            <span className="text-[10px] font-f1-mono text-zinc-500 block">
              {(baseDeFas / 1000000).toFixed(2)} Milhões de torcedores engajados
            </span>
          </div>

          <div className="bg-[#15151E] p-4 border border-white/5 space-y-1">
            <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">RECEITA ANUAL DE MARKETING</span>
            <div className="text-2xl font-f1-wide font-black text-emerald-400 tabular-nums">
              ${(receitaMarketing / 1000000).toFixed(2)}M
            </div>
            <span className="text-[10px] font-f1-mono text-zinc-500 block">
              Contratos comerciais e licenciamento de marca
            </span>
          </div>

          <div className="bg-[#15151E] p-4 border border-white/5 space-y-2 text-xs font-f1-mono">
            <span className="text-[10px] text-zinc-400 uppercase block font-bold">MODIFICADORES DE MERCADO ATIVOS</span>
            <div className="space-y-1">
              {playerTeam.isManufacturer && (
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[11px]">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full shrink-0" />
                  <span>Equipe de Fábrica (+5M Fãs & +15 Reputação)</span>
                </div>
              )}
              {playerTeam.baseDeFas && playerTeam.baseDeFas >= 2000000 && (
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0" />
                  <span>Bônus Nacional / Mercado Único (2x Fãs | +50% Rec)</span>
                </div>
              )}
              <div className="text-[10px] text-zinc-500 pt-0.5">
                Sede: {playerTeam.location} · {playerTeam.drivers.length} Pilotos Titulares
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modificadores de DNA Ativos (Seção de Feedback Visual do Motor de Jogo) */}
      <div className="bg-[#1C1C26] border border-white/10 p-5 f1-container-roof space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#E10600] inline-block shrink-0" />
            <h2 className="font-f1-wide font-black text-sm sm:text-base text-white uppercase tracking-wider">
              Modificadores de DNA Ativos · {activeBg.name} ({principalProfile.name})
            </h2>
          </div>
          <span className="text-[10px] font-f1-mono text-zinc-300 bg-white/5 border border-white/10 px-2.5 py-1 uppercase tracking-wider font-bold">
            {activeBg.badge}
          </span>
        </div>

        {/* Resumo Bônus / Ônus */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-f1-mono">
          <div className="bg-emerald-950/40 border border-emerald-500/40 p-2.5 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[10px] uppercase tracking-wider">
              <span className="w-2 h-2 bg-emerald-400 inline-block shrink-0" />
              <span>BÔNUS ATIVO (VERDE)</span>
            </div>
            <p className="font-bold text-emerald-300 leading-snug">
              {activeBg.bonus}
            </p>
          </div>

          <div className="bg-red-950/40 border border-red-500/40 p-2.5 space-y-1">
            <div className="flex items-center gap-1.5 text-red-400 font-bold text-[10px] uppercase tracking-wider">
              <span className="w-2 h-2 bg-red-400 inline-block shrink-0" />
              <span>ÔNUS ATIVO (VERMELHO)</span>
            </div>
            <p className="font-bold text-red-300 leading-snug">
              {activeBg.onus}
            </p>
          </div>
        </div>

        {/* Variáveis Ativas no Game Engine */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1 text-xs font-f1-mono">
          <div className="bg-[#15151E] p-2.5 border border-white/5">
            <span className="text-[9px] text-zinc-400 block uppercase font-bold">ERRO DE CORRELAÇÃO</span>
            <span className={`font-bold text-xs ${modificadorErroCorrelacao < 0 ? 'text-emerald-400' : modificadorErroCorrelacao > 0 ? 'text-red-400' : 'text-zinc-300'}`}>
              {modificadorErroCorrelacao !== 0 ? `${modificadorErroCorrelacao > 0 ? '+' : ''}${(modificadorErroCorrelacao * 100).toFixed(0)}%` : '0% (Padrão)'}
            </span>
            <span className="text-[9px] text-zinc-500 block truncate mt-0.5">
              {modificadorErroCorrelacao < 0 ? 'Bônus do Engenheiro' : modificadorErroCorrelacao > 0 ? 'Ônus do Estrategista' : 'Neutro'}
            </span>
          </div>

          <div className="bg-[#15151E] p-2.5 border border-white/5">
            <span className="text-[9px] text-zinc-400 block uppercase font-bold">SINERGIA PILOTO</span>
            <span className={`font-bold text-xs ${modificadorSinergiaPiloto > 0 ? 'text-emerald-400' : modificadorSinergiaPiloto < 0 ? 'text-red-400' : 'text-zinc-300'}`}>
              {modificadorSinergiaPiloto !== 0 ? `${modificadorSinergiaPiloto > 0 ? '+' : ''}${modificadorSinergiaPiloto}` : '0 (Padrão)'}
            </span>
            <span className="text-[9px] text-zinc-500 block truncate mt-0.5">
              {modificadorSinergiaPiloto < 0 ? 'Ônus do Engenheiro' : modificadorSinergiaPiloto > 0 ? 'Bônus do Ex-Piloto' : 'Neutro'}
            </span>
          </div>

          <div className="bg-[#15151E] p-2.5 border border-white/5">
            <span className="text-[9px] text-zinc-400 block uppercase font-bold">TEMPO DE P&D</span>
            <span className={`font-bold text-xs ${modificadorTempoPeD > 1.0 ? 'text-red-400' : 'text-zinc-300'}`}>
              x{modificadorTempoPeD.toFixed(2)} {modificadorTempoPeD > 1.0 ? '(+10%)' : ''}
            </span>
            <span className="text-[9px] text-zinc-500 block truncate mt-0.5">
              {modificadorTempoPeD > 1.0 ? 'Ônus do Ex-Piloto' : 'Padrão'}
            </span>
          </div>

          <div className="bg-[#15151E] p-2.5 border border-white/5">
            <span className="text-[9px] text-zinc-400 block uppercase font-bold">CONFIABILIDADE PU</span>
            <span className={`font-bold text-xs ${modificadorConfiabilidade > 0 ? 'text-emerald-400' : 'text-zinc-300'}`}>
              {modificadorConfiabilidade > 0 ? `+${modificadorConfiabilidade}%` : '0% (Padrão)'}
            </span>
            <span className="text-[9px] text-zinc-500 block truncate mt-0.5">
              {modificadorConfiabilidade > 0 ? 'Bônus do Mecânico' : 'Padrão'}
            </span>
          </div>

          <div className="bg-[#15151E] p-2.5 border border-white/5">
            <span className="text-[9px] text-zinc-400 block uppercase font-bold">CONFIANÇA DIRETORIA</span>
            <span className={`font-bold text-xs ${modificadorConfiancaDiretoria < 0 ? 'text-red-400' : 'text-zinc-300'}`}>
              {modificadorConfiancaDiretoria < 0 ? `${modificadorConfiancaDiretoria}%` : '0% (Padrão)'}
            </span>
            <span className="text-[9px] text-zinc-500 block truncate mt-0.5">
              {modificadorConfiancaDiretoria < 0 ? 'Ônus do Mecânico' : 'Padrão'}
            </span>
          </div>

          <div className="bg-[#15151E] p-2.5 border border-white/5">
            <span className="text-[9px] text-zinc-400 block uppercase font-bold">CAIXA INICIAL</span>
            <span className={`font-bold text-xs ${modificadorCaixaInicial > 0 ? 'text-emerald-400' : 'text-zinc-300'}`}>
              {modificadorCaixaInicial > 0 ? `+$${(modificadorCaixaInicial / 1000000).toFixed(0)}M` : '$0M'}
            </span>
            <span className="text-[9px] text-zinc-500 block truncate mt-0.5">
              {modificadorCaixaInicial > 0 ? 'Bônus do Magnata' : 'Padrão ($135M)'}
            </span>
          </div>

          <div className="bg-[#15151E] p-2.5 border border-white/5">
            <span className="text-[9px] text-zinc-400 block uppercase font-bold">MORAL DA FÁBRICA</span>
            <span className={`font-bold text-xs ${modificadorMoralFabrica < 0 ? 'text-red-400' : 'text-zinc-300'}`}>
              {modificadorMoralFabrica < 0 ? `${modificadorMoralFabrica}` : '0 (Padrão)'}
            </span>
            <span className="text-[9px] text-zinc-500 block truncate mt-0.5">
              {modificadorMoralFabrica < 0 ? 'Ônus do Magnata' : 'Padrão'}
            </span>
          </div>

          <div className="bg-[#15151E] p-2.5 border border-white/5">
            <span className="text-[9px] text-zinc-400 block uppercase font-bold">DOWNFORCE (DFm)</span>
            <span className={`font-bold text-xs ${modificadorDownforce > 0 ? 'text-emerald-400' : 'text-zinc-300'}`}>
              {modificadorDownforce > 0 ? `+${modificadorDownforce} pts` : '0 pts'}
            </span>
            <span className="text-[9px] text-zinc-500 block truncate mt-0.5">
              {modificadorDownforce > 0 ? 'Bônus Homem da FIA' : 'Padrão'}
            </span>
          </div>

          <div className="bg-[#15151E] p-2.5 border border-white/5">
            <span className="text-[9px] text-zinc-400 block uppercase font-bold">TEMPO MANUFATURA</span>
            <span className={`font-bold text-xs ${modificadorTempoManufatura > 1.0 ? 'text-red-400' : 'text-zinc-300'}`}>
              x{modificadorTempoManufatura.toFixed(2)} {modificadorTempoManufatura > 1.0 ? '(+20%)' : ''}
            </span>
            <span className="text-[9px] text-zinc-500 block truncate mt-0.5">
              {modificadorTempoManufatura > 1.0 ? 'Ônus Homem da FIA' : 'Padrão'}
            </span>
          </div>

          <div className="bg-[#15151E] p-2.5 border border-white/5">
            <span className="text-[9px] text-zinc-400 block uppercase font-bold">SETUP DE TREINO</span>
            <span className={`font-bold text-xs ${modificadorSetupRapido ? 'text-emerald-400' : 'text-zinc-300'}`}>
              {modificadorSetupRapido ? '50% Mais Rápido' : 'Normal (1.0x)'}
            </span>
            <span className="text-[9px] text-zinc-500 block truncate mt-0.5">
              {modificadorSetupRapido ? 'Bônus do Estrategista' : 'Padrão'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column (Next Race & Active Aero) / Right Column (Standings & Feed) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Grand Prix Card */}
        <div className="lg:col-span-2 space-y-6">
          <F1TabBucket title={t.nextGp} badge={`${t.round} ${currentWeek}`}>
            <div className="flex flex-col md:flex-row items-stretch justify-between gap-6">
              <div className="space-y-3 flex-1">
                <div>
                  <div className="text-xs font-f1-mono text-zinc-400 uppercase">{language === 'pt' ? 'CIRCUITO' : 'LOCATION'}</div>
                  <h2 className="font-f1-wide font-black text-2xl text-white">
                    {currentCircuit.name}
                  </h2>
                  <div className="text-xs text-zinc-300 font-f1-mono mt-0.5">
                    {currentCircuit.city}, {currentCircuit.country} · {currentCircuit.laps} {language === 'pt' ? 'Voltas' : 'Laps'} ({currentCircuit.lapDistanceKm} km)
                  </div>
                </div>

                <p className="text-sm text-zinc-400 leading-relaxed">
                  {currentCircuit.description}
                </p>

                {/* Circuit Technical Demands */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="bg-[#15151E] p-2.5 border border-white/5">
                    <span className="text-[10px] font-f1-mono text-zinc-400 block">{language === 'pt' ? 'DEMANDA AERO' : 'AERO DEMAND'}</span>
                    <span className="text-xs font-f1-wide font-bold text-white uppercase">
                      {currentCircuit.aeroDemand.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="bg-[#15151E] p-2.5 border border-white/5">
                    <span className="text-[10px] font-f1-mono text-zinc-400 block">{language === 'pt' ? 'DESGASTE PNEUS' : 'TIRE WEAR'}</span>
                    <span className="text-xs font-f1-mono font-bold text-white tabular-nums">
                      {currentCircuit.tireWearSeverity} / 5
                    </span>
                  </div>
                  <div className="bg-[#15151E] p-2.5 border border-white/5">
                    <span className="text-[10px] font-f1-mono text-zinc-400 block">{language === 'pt' ? 'PERDA NO PIT' : 'PIT LOSS'}</span>
                    <span className="text-xs font-f1-mono font-bold text-white tabular-nums">
                      {currentCircuit.pitLaneLossSec}s
                    </span>
                  </div>
                </div>

                {/* Action CTA to Jump into Weekend or Full GP Explorer */}
                <div className="pt-2 flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => setActiveTab('race_weekend')}
                    className="w-full sm:w-auto px-5 py-2.5 bg-[#E10600] hover:bg-[#c20500] text-white font-f1-wide font-bold text-xs uppercase tracking-wider f1-tab-chamfer transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Flag className="w-4 h-4" />
                    <span>{t.enterWeekend}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDashboardViewMode('grands_prix')}
                    className="w-full sm:w-auto px-4 py-2.5 bg-[#15151E] hover:bg-[#252533] border border-white/15 text-zinc-200 hover:text-white font-f1-wide font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Compass className="w-4 h-4 text-cyan-400" />
                    <span>{language === 'pt' ? 'Ver Todos os GPs e Circuitos' : 'Browse All GPs & Circuits'}</span>
                  </button>
                </div>
              </div>

              {/* Circuit Real GeoJSON Schematic Outline */}
              <div className="w-full md:w-72 shrink-0">
                <RealCircuitMap circuitPackage={currentCircuitPackage} compact />
              </div>
            </div>
          </F1TabBucket>

          {/* 2026 Active Aerodynamics & Powertrain Integration Status */}
          <F1TabBucket title="2026 VEHICLE DYNAMICS SPECIFICATION" badge={`CHASSI ${playerTeam.carModelName || 'APX-01'}`}>
            {/* Dossiê Técnico Oficial (Chassi / Motor / Peso) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 bg-[#15151E] border border-white/10 p-3.5">
              <div>
                <span className="text-[10px] font-f1-mono text-zinc-500 uppercase block">Chassi Homologado</span>
                <span
                  className="font-f1-wide font-black text-base uppercase tracking-wider"
                  style={{ color: playerTeam.color || '#E10600' }}
                >
                  {playerTeam.carModelName || 'APX-01'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-f1-mono text-zinc-500 uppercase block">Motor / Unidade de Potência</span>
                <span className="font-f1-mono font-bold text-sm text-white block truncate">
                  {(() => {
                    const baseName = playerTeam.engineCustomName || playerTeam.engineSupplier;
                    return playerTeam.thirdPartyErsSupplier && !baseName.includes(playerTeam.thirdPartyErsSupplier)
                      ? `${baseName} + ERS ${playerTeam.thirdPartyErsSupplier}`
                      : baseName;
                  })()}
                </span>
                <span className="text-[11px] font-f1-mono text-amber-400 font-bold tabular-nums block mt-0.5">
                  {playerTeam.homologatedPeakPowerHp ?? vehiclePhysics.peakCombinedPowerHp} CV Pico · {vehiclePhysics.totalWheelPowerHp} CV na roda
                </span>
              </div>
              <div>
                <span className="text-[10px] font-f1-mono text-zinc-500 uppercase block">Peso Total Homologado</span>
                <span className="font-f1-mono font-bold text-sm text-emerald-400 tabular-nums">
                  {Math.round(vehiclePhysics.totalMassKg)} kg <span className="text-[10px] text-zinc-400">(Mín. FIA 768 kg)</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#15151E] p-4 border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-f1-wide font-bold text-white">
                  <Wind className="w-4 h-4 text-[#E10600]" />
                  <span>ACTIVE AERODYNAMICS</span>
                </div>
                <div className="text-xs text-zinc-400">
                  Dual-state active wing flaps. <span className="text-white font-bold">Mode X</span> opens on straights for minimum drag; <span className="text-white font-bold">Mode Z</span> closes in braking zones for corner downforce.
                </div>
                <div className="pt-1 text-[11px] font-f1-mono text-zinc-400">
                  Downforce Index: <span className="text-white font-bold tabular-nums">{avgDownforce} pts</span>
                </div>
              </div>

              <div className="bg-[#15151E] p-4 border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-f1-wide font-bold text-white">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>350kW HYBRID PU</span>
                </div>
                <div className="text-xs text-zinc-400">
                  50% Thermal V6 1.6L + 50% Electric ERS. MGU-H deleted. 100% sustainable e-fuel. Overtake Boost delivers instant 350kW surge.
                </div>
                <div className="pt-1 text-[11px] font-f1-mono text-zinc-400">
                  Thermal Reliability: <span className="text-white font-bold tabular-nums">{avgReliability}%</span>
                </div>
              </div>

              <div className="bg-[#15151E] p-4 border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-f1-wide font-bold text-white">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>{t.chassisReg}</span>
                </div>
                <div className="text-xs text-zinc-400">
                  {language === 'pt' ? 'Entre-eixos: 3.400 mm · Largura: 1.900 mm. Peso mínimo: 768 kg. Túneis Venturi calibrados contra porpoising.' : 'Wheelbase: 3,400 mm · Width: 1,900 mm. Min weight target: 768 kg. Floor ground-effect tunnels tuned to suppress porpoising.'}
                </div>
                <div className="pt-1 text-[11px] font-f1-mono text-zinc-400">
                  {language === 'pt' ? 'Massa Atual:' : 'Current Mass:'} <span className="text-white font-bold tabular-nums">{Math.round(vehiclePhysics.totalMassKg)} kg</span>
                </div>
              </div>
            </div>
          </F1TabBucket>
        </div>

        {/* Right Column: Constructors Championship Table & Telemetry Feed */}
        <div className="space-y-6">
          <F1TabBucket title={t.constructorsChampionship} badge={`${seasonYear} ${t.standings}`}>
            <div className="divide-y divide-white/5 text-xs font-f1-mono">
              {sortedTeams.map((team, idx) => {
                const isPlayer = team.id === playerTeam.id;
                return (
                  <div
                    key={team.id}
                    onClick={() => {
                      if (isPlayer) {
                        const playerDrivers = drivers.filter(d => d.teamId === playerTeam.id && !d.isAffiliate);
                        setSelectedRivalDossier({
                          teamId: playerTeam.id,
                          name: playerTeam.name,
                          shortName: playerTeam.shortName,
                          color: playerTeam.color,
                          teamPrincipal: playerTeam.teamPrincipal || principalProfile?.name || 'Você (Team Principal)',
                          driver1Name: playerDrivers[0]?.name || 'Piloto #1',
                          driver1Number: playerDrivers[0]?.number || 1,
                          driver1Nat: playerDrivers[0]?.nationality || 'Brasil',
                          driver2Name: playerDrivers[1]?.name || 'Piloto #2',
                          driver2Number: playerDrivers[1]?.number || 2,
                          driver2Nat: playerDrivers[1]?.nationality || 'Reino Unido',
                          headOfAero: playerTeam.headOfAero || 'Corpo Técnico Homologado',
                          headOfPowerUnit: playerTeam.headOfPowerUnit || 'Corpo Técnico Homologado',
                          sportingDirector: playerTeam.sportingDirector || 'Diretor de Operações de Pista',
                          engineSupplier: playerTeam.engineSupplier,
                          factoryHq: playerTeam.location,
                          carRating: 84,
                          budgetCapSpend: `$${(financials.costCapSpent / 1000000).toFixed(1)}M / $135.0M`
                        });
                      } else {
                        const dossier = RIVAL_TEAMS_DOSSIER[team.id] || {
                          teamId: team.id,
                          name: team.name,
                          shortName: team.shortName,
                          color: team.color,
                          teamPrincipal: team.teamPrincipal || 'Chefe de Equipe FIA',
                          driver1Name: drivers.filter(d => d.teamId === team.id)[0]?.name || 'Piloto Titular #1',
                          driver1Number: drivers.filter(d => d.teamId === team.id)[0]?.number || 10,
                          driver1Nat: drivers.filter(d => d.teamId === team.id)[0]?.nationality || 'Internacional',
                          driver2Name: drivers.filter(d => d.teamId === team.id)[1]?.name || 'Piloto Titular #2',
                          driver2Number: drivers.filter(d => d.teamId === team.id)[1]?.number || 11,
                          driver2Nat: drivers.filter(d => d.teamId === team.id)[1]?.nationality || 'Internacional',
                          headOfAero: team.headOfAero || 'Diretor de Aerodinâmica',
                          headOfPowerUnit: team.headOfPowerUnit || 'Engenheiro Chefe de PU',
                          sportingDirector: team.sportingDirector || 'Diretor Esportivo',
                          engineSupplier: team.engineSupplier,
                          factoryHq: team.location,
                          carRating: 80,
                          budgetCapSpend: '$125.0M'
                        };
                        setSelectedRivalDossier(dossier);
                      }
                    }}
                    className={`flex items-center justify-between py-2.5 px-2 transition-all cursor-pointer group hover:bg-white/10 ${
                      isPlayer ? 'bg-[#E10600]/15 font-bold text-white' : 'text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-4 text-right text-zinc-400 tabular-nums font-bold">
                        {idx + 1}
                      </span>
                      <span
                        className="w-1.5 h-3 shrink-0"
                        style={{ backgroundColor: team.color }}
                      />
                      <span className="truncate max-w-[140px] font-f1-wide uppercase group-hover:text-white transition-colors">
                        {team.shortName} · {team.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-right tabular-nums text-white font-bold">
                        {team.points} PTS
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-500 opacity-40 group-hover:opacity-100 group-hover:text-white transition-opacity" />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="pt-2 border-t border-white/5 text-[10px] font-f1-mono text-zinc-500 text-center">
              💡 Clique em uma equipe para inspecionar o Dossiê Técnico & Diretoria
            </div>
          </F1TabBucket>

          {/* Team Principal Telemetry & Notifications Feed */}
          <F1TabBucket title={t.pitWallDirectives} badge={`${notifications.length} ${language === 'pt' ? 'AVISOS' : 'NOTICES'}`}>
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={`p-2.5 border text-xs ${
                    n.type === 'penalty'
                      ? 'bg-red-950/30 border-red-500/40 text-red-200'
                      : n.type === 'warning'
                      ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                      : 'bg-[#15151E] border-white/5 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-f1-wide font-bold text-[11px] uppercase tracking-wider">
                    <span>{n.title}</span>
                    <span className="font-f1-mono text-[10px] text-zinc-500">{n.date}</span>
                  </div>
                  <p className="mt-1 text-zinc-300 text-[11px] leading-relaxed">
                    {n.message}
                  </p>
                </div>
              ))}
            </div>
          </F1TabBucket>
        </div>
      </div>

      {/* ========================================================== */}
      {/* MODAL: DOSSIÊ TÉCNICO & DIRETORIA DA EQUIPE RIVAL          */}
      {/* ========================================================== */}
      {selectedRivalDossier && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#15151E] border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative f1-container-frame">
            {/* Modal Header */}
            <div
              className="p-5 border-b border-white/10 flex items-center justify-between"
              style={{ borderLeft: `6px solid ${selectedRivalDossier.color}` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-8 shrink-0 rounded-sm"
                  style={{ backgroundColor: selectedRivalDossier.color }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-f1-mono font-bold px-1.5 py-0.5 bg-white/10 text-white uppercase">
                      {selectedRivalDossier.shortName}
                    </span>
                    <span className="text-[10px] font-f1-mono text-zinc-400 uppercase tracking-widest">
                      DOSSIÊ TÉCNICO & ORGANIZACIONAL
                    </span>
                  </div>
                  <h3 className="font-f1-wide font-black text-xl text-white uppercase mt-0.5">
                    {selectedRivalDossier.name}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedRivalDossier(null)}
                className="p-2 text-zinc-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Top Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-[#1C1C26] border border-white/5">
                  <span className="text-[10px] font-f1-mono text-zinc-400 block uppercase">SEDE DA FÁBRICA</span>
                  <span className="font-f1-wide text-xs text-white font-bold block mt-1">
                    {selectedRivalDossier.factoryHq}
                  </span>
                </div>
                <div className="p-3 bg-[#1C1C26] border border-white/5">
                  <span className="text-[10px] font-f1-mono text-zinc-400 block uppercase">FORNECEDOR DE MOTOR</span>
                  <span className="font-f1-wide text-xs text-amber-400 font-bold block mt-1">
                    {selectedRivalDossier.engineSupplier}
                  </span>
                </div>
                <div className="p-3 bg-[#1C1C26] border border-white/5">
                  <span className="text-[10px] font-f1-mono text-zinc-400 block uppercase">TETO DE GASTOS</span>
                  <span className="font-f1-wide text-xs text-emerald-400 font-bold block mt-1">
                    {selectedRivalDossier.budgetCapSpend}
                  </span>
                </div>
              </div>

              {/* Seção 1: Team Principal & Diretoria */}
              <div className="space-y-3">
                <span className="text-xs font-f1-wide font-black text-[#E10600] uppercase tracking-wider block">
                  1. LIDERANÇA EXECUTIVA & DESPORTIVA
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-[#1C1C26] border border-white/5 space-y-1">
                    <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">TEAM PRINCIPAL</span>
                    <span className="font-f1-wide font-bold text-white text-sm block">
                      {selectedRivalDossier.teamPrincipal}
                    </span>
                    <span className="text-[10px] font-f1-mono text-emerald-400 block">Liderança Geral do Programa</span>
                  </div>

                  <div className="p-3.5 bg-[#1C1C26] border border-white/5 space-y-1">
                    <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">SPORTING DIRECTOR</span>
                    <span className="font-f1-wide font-bold text-white text-sm block">
                      {selectedRivalDossier.sportingDirector}
                    </span>
                    <span className="text-[10px] font-f1-mono text-zinc-400 block">Operações de Pista & FIA</span>
                  </div>
                </div>
              </div>

              {/* Seção 2: Pilotos Titulares */}
              <div className="space-y-3">
                <span className="text-xs font-f1-wide font-black text-[#E10600] uppercase tracking-wider block">
                  2. DUPLA DE PILOTOS TITULARES (TEMPORADA 2026)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Piloto 1 */}
                  <div className="p-3.5 bg-[#1C1C26] border border-white/5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-f1-mono text-zinc-400 uppercase">CARRO #1</span>
                      <span className="text-[10px] font-f1-mono text-zinc-400 font-bold">#{selectedRivalDossier.driver1Number}</span>
                    </div>
                    <span className="font-f1-wide font-bold text-white text-sm block">
                      {selectedRivalDossier.driver1Name}
                    </span>
                    <span className="text-[10px] font-f1-mono text-zinc-400 block">
                      Nacionalidade: {selectedRivalDossier.driver1Nat}
                    </span>
                  </div>

                  {/* Piloto 2 */}
                  <div className="p-3.5 bg-[#1C1C26] border border-white/5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-f1-mono text-zinc-400 uppercase">CARRO #2</span>
                      <span className="text-[10px] font-f1-mono text-zinc-400 font-bold">#{selectedRivalDossier.driver2Number}</span>
                    </div>
                    <span className="font-f1-wide font-bold text-white text-sm block">
                      {selectedRivalDossier.driver2Name}
                    </span>
                    <span className="text-[10px] font-f1-mono text-zinc-400 block">
                      Nacionalidade: {selectedRivalDossier.driver2Nat}
                    </span>
                  </div>
                </div>
              </div>

              {/* Seção 3: Chefia Técnica & Engenharia */}
              <div className="space-y-3">
                <span className="text-xs font-f1-wide font-black text-[#E10600] uppercase tracking-wider block">
                  3. COMANDO DE ENGENHARIA & PERFORMANCE
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-[#1C1C26] border border-white/5 space-y-1">
                    <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">CHEFE DE AERODINÂMICA</span>
                    <span className="font-f1-wide font-bold text-white text-sm block">
                      {selectedRivalDossier.headOfAero}
                    </span>
                    <span className="text-[10px] font-f1-mono text-cyan-400 block">Conceito Aerodinâmico 2026</span>
                  </div>

                  <div className="p-3.5 bg-[#1C1C26] border border-white/5 space-y-1">
                    <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">CHEFE DE MOTOR (POWER UNIT)</span>
                    <span className="font-f1-wide font-bold text-white text-sm block">
                      {selectedRivalDossier.headOfPowerUnit}
                    </span>
                    <span className="text-[10px] font-f1-mono text-amber-400 block">Integração ICE + ERS 350kW</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 bg-[#101017] flex justify-end">
              <button
                onClick={() => setSelectedRivalDossier(null)}
                className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white font-f1-wide font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Fechar Dossiê
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
};
