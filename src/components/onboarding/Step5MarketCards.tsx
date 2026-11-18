import React from 'react';
import { Driver, StaffMember } from '../../types/f1';
import {
  getAttributeVisualTone,
  getDriverMarketAnalysis,
  getDriverPotentialProfile,
  getDriverTeamName,
  getDriverTechnicalAttributes,
  getStaffFullProfile,
  type StaffInterestEvaluation
} from '../../utils/profileSheets';
import {
  Award,
  Briefcase,
  Check,
  Cpu,
  DollarSign,
  Maximize2,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  UserCheck,
  X
} from 'lucide-react';

export type DriverInterestState = 'interested' | 'negotiable' | 'no_interest';

export interface DriverMarketCardProps {
  driver: Driver;
  isT1: boolean;
  isT2: boolean;
  isRes: boolean;
  interestState: DriverInterestState;
  playerReputation: number;
  effectiveSalary: number;
  contractedSalary?: number;
  riskSalary: number;
  onExpand: (driver: Driver) => void;
  onAssignSlot: (driver: Driver, slot: 't1' | 't2' | 'reserve') => void;
}

const getDriverInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
};

const AttributeProgressRow: React.FC<{
  label: string;
  value: number;
  compact?: boolean;
}> = ({ label, value, compact = true }) => {
  const tone = getAttributeVisualTone(value);
  return (
    <div className={compact ? 'space-y-0.5' : 'space-y-1'}>
      <div className="flex items-center justify-between gap-1 leading-none">
        <span className={`${compact ? 'text-[10px]' : 'text-[11px]'} text-zinc-300 truncate`}>
          {label}
        </span>
        <span
          className={`${compact ? 'text-[10px]' : 'text-xs'} font-bold tabular-nums shrink-0 ${tone.textClass}`}
        >
          {value}
        </span>
      </div>
      <div className={`${compact ? 'h-1' : 'h-1.5'} w-full bg-white/10 rounded-full overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${tone.barClass}`}
          style={{ width: `${Math.max(4, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
};

export const DriverMarketCard: React.FC<DriverMarketCardProps> = ({
  driver,
  isT1,
  isT2,
  isRes,
  interestState,
  playerReputation,
  effectiveSalary,
  contractedSalary,
  onExpand,
  onAssignSlot
}) => {
  const isSelected = isT1 || isT2 || isRes;
  const reqRep = driver.requiredReputation || 0;
  const marketAnalysis = getDriverMarketAnalysis(driver);
  const potentialProfile = getDriverPotentialProfile(driver);
  const techAttributes = getDriverTechnicalAttributes(driver);
  const teamDisplayName = getDriverTeamName(driver);
  const ovrValue = driver.ovr || driver.attributes.pace;
  const feedbackVal = driver.attributes.feedback;
  const feedbackTone = getAttributeVisualTone(feedbackVal);
  const mktTone = getAttributeVisualTone(marketAnalysis.effectiveMarketability);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onExpand(driver)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onExpand(driver);
        }
      }}
      className={`p-4 border rounded-lg text-xs font-f1-mono flex flex-col justify-between transition-all cursor-pointer group ${
        isSelected
          ? 'bg-[#1A1826] border-[#E10600] shadow-lg shadow-[#E10600]/15'
          : 'bg-[#15151E] border-white/10 hover:border-white/35 hover:bg-[#191924]'
      }`}
    >
      <div className="space-y-3">
        {/* SEÇÃO 1: CABEÇALHO (Foto/Avatar, Nome, Nacionalidade, Equipe Atual, Idade e OVR) */}
        <div className="flex items-start justify-between gap-2.5 pb-2.5 border-b border-white/10">
          <div className="flex items-start gap-2.5 min-w-0">
            <div
              className="w-11 h-11 rounded-lg border border-white/20 flex flex-col items-center justify-center shrink-0 shadow-inner relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${driver.avatarColor || '#1F2937'} 0%, #0E0E15 100%)`
              }}
            >
              <span className="font-f1-wide font-black text-xs text-white leading-none">
                {driver.shortCode || getDriverInitials(driver.name)}
              </span>
              <span className="text-[9px] text-white/80 font-bold leading-none mt-0.5 tabular-nums">
                #{driver.number}
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-f1-wide font-black text-sm text-white group-hover:text-amber-300 transition-colors truncate">
                  {driver.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap text-[10px]">
                <span className="text-zinc-200 font-bold">{driver.nationality}</span>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-300 font-bold tabular-nums">{driver.age} anos</span>
                <span className="text-zinc-600">·</span>
                {driver.isFreeAgent || driver.teamId === 'free_agent' || !driver.teamId ? (
                  <span className="font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-1.5 py-0.5 rounded">
                    Agente Livre
                  </span>
                ) : (
                  <span className="font-bold text-zinc-200 bg-white/10 border border-white/15 px-1.5 py-0.5 rounded">
                    {teamDisplayName}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right shrink-0 flex flex-col items-end">
            <div className="px-2 py-1 rounded bg-black/50 border border-white/15 text-center">
              <span
                className={`text-lg font-f1-wide font-black tabular-nums block leading-none ${
                  ovrValue > 90 ? 'text-[#39FF14]' : ovrValue < 60 ? 'text-red-400' : 'text-amber-400'
                }`}
              >
                {ovrValue}
              </span>
              <span className="text-[8px] text-zinc-400 uppercase tracking-widest font-bold block mt-0.5">
                OVR
              </span>
            </div>
            <span className="text-[9px] text-cyan-400/90 group-hover:text-cyan-300 flex items-center gap-1 mt-1 font-bold">
              <Maximize2 className="w-2.5 h-2.5" />
              Ficha
            </span>
          </div>
        </div>

        {/* SEÇÃO 2: STATUS DE CONTRATAÇÃO (Salário, Multa, Reputação Exigida, Status) */}
        <div className="bg-[#1C1C26]/90 border border-white/10 rounded p-2.5 space-y-1.5">
          <div className="flex items-center justify-between gap-2 pb-1 border-b border-white/5">
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
              Status de Contratação
            </span>
            {interestState === 'interested' ? (
              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-emerald-950/80 text-emerald-300 border-emerald-500/50">
                ✓ Interessado
              </span>
            ) : interestState === 'negotiable' ? (
              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-amber-950/80 text-amber-300 border-amber-500/50">
                ⚠ Negociável (+30%)
              </span>
            ) : (
              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-red-950/80 text-red-300 border-red-500/50">
                ✗ Sem Interesse
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <div>
              <span className="text-zinc-500 block">Salário</span>
              <span className={`font-bold tabular-nums ${contractedSalary ? 'text-amber-400' : 'text-white'}`}>
                ${(effectiveSalary / 1000000).toFixed(1)}M/ano
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block">Multa Rescisória</span>
              <span className="text-amber-400 font-bold tabular-nums">
                {driver.buyoutClause ? `$${(driver.buyoutClause / 1000000).toFixed(1)}M` : 'Sem Multa'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-zinc-500 block">Reputação Exigida</span>
              <span
                className={`font-bold tabular-nums ${
                  interestState === 'interested'
                    ? 'text-emerald-400'
                    : interestState === 'negotiable'
                    ? 'text-amber-400'
                    : 'text-red-400'
                }`}
              >
                {reqRep > 0 ? `${reqRep}+` : '0+'} <span className="text-zinc-500">({playerReputation})</span>
              </span>
            </div>
          </div>
        </div>

        {/* SEÇÃO 3: FICHA TÉCNICA (12 ATRIBUTOS EM PT-BR COM BARRAS 0-100) */}
        <div className="bg-black/35 border border-white/10 rounded p-2.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
              Ficha Técnica (PT-BR)
            </span>
            <span className="text-[9px] text-zinc-500">
              <span className="text-[#39FF14] font-bold">&gt;90</span> ·{' '}
              <span className="text-red-400 font-bold">&lt;60</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {techAttributes.map(attr => (
              <AttributeProgressRow key={attr.key} label={attr.label} value={attr.value} compact />
            ))}
          </div>
        </div>

        {/* SEÇÃO 4: FICHA COMERCIAL E DESENVOLVIMENTO */}
        <div className="bg-[#1C1C26]/70 border border-white/10 rounded p-2.5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
              Comercial & Desenvolvimento
            </span>
            <span
              className={`text-[9px] font-f1-wide font-black uppercase px-2 py-0.5 rounded border ${
                potentialProfile.isElite
                  ? 'bg-gradient-to-r from-purple-600/50 via-fuchsia-500/45 to-purple-500/50 border-purple-300/80 text-purple-100 shadow-[0_0_12px_rgba(168,85,247,0.6)]'
                  : potentialProfile.tier === 'Alto'
                  ? 'bg-cyan-950/70 border-cyan-400/50 text-cyan-200'
                  : 'bg-zinc-800/80 border-zinc-600 text-zinc-300'
              }`}
            >
              Potencial: {potentialProfile.tier}
            </span>
          </div>

          {/* Feedback Técnico */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-zinc-300">Feedback Técnico</span>
              <span className={`font-bold tabular-nums ${feedbackTone.textClass}`}>
                {feedbackVal} / 100
              </span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${feedbackTone.barClass}`}
                style={{ width: `${feedbackVal}%` }}
              />
            </div>
          </div>

          {/* Marketability + Patrocínio */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-zinc-300">Marketability (Comercial)</span>
              <span className="flex items-center gap-1.5 tabular-nums">
                <span className={`font-bold ${mktTone.textClass}`}>
                  {marketAnalysis.effectiveMarketability}
                </span>
                <span className="text-emerald-400 font-bold">
                  (+${marketAnalysis.marketingBonusCashM.toFixed(1)}M/ano)
                </span>
              </span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${mktTone.barClass}`}
                style={{ width: `${marketAnalysis.effectiveMarketability}%` }}
              />
            </div>
          </div>

          {/* Bônus Nacional */}
          {marketAnalysis.isSoleRepresentative && (
            <div className="text-[10px] font-bold text-amber-300 bg-gradient-to-r from-amber-950/80 via-yellow-900/40 to-amber-950/80 border border-amber-400/60 px-2 py-1 rounded flex items-center gap-1.5 shadow-[0_0_10px_rgba(245,158,11,0.25)]">
              <span>★ Bônus de Mercado: +15 Marketability</span>
            </div>
          )}
        </div>
      </div>

      {/* BOTÕES DE CONTRATAÇÃO (stopPropagation para não abrir modal ao contratar) */}
      <div
        className="mt-3 pt-3 border-t border-white/10 space-y-1.5"
        onClick={e => e.stopPropagation()}
      >
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            disabled={interestState === 'no_interest' && !isT1}
            onClick={() => onAssignSlot(driver, 't1')}
            className={`py-2 px-2 rounded text-[10px] font-f1-wide font-bold uppercase transition-all flex items-center justify-center gap-1 ${
              isT1
                ? 'bg-[#E10600] text-white shadow-md cursor-pointer'
                : interestState === 'interested'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                : interestState === 'negotiable'
                ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer'
                : 'bg-red-950/50 border border-red-500/30 text-red-400/80 cursor-not-allowed'
            }`}
          >
            {isT1
              ? '✓ Titular #1'
              : interestState === 'negotiable'
              ? 'Negociar #1'
              : interestState === 'no_interest'
              ? 'Indisponível'
              : 'Titular #1'}
          </button>

          <button
            type="button"
            disabled={interestState === 'no_interest' && !isT2}
            onClick={() => onAssignSlot(driver, 't2')}
            className={`py-2 px-2 rounded text-[10px] font-f1-wide font-bold uppercase transition-all flex items-center justify-center gap-1 ${
              isT2
                ? 'bg-[#E10600] text-white shadow-md cursor-pointer'
                : interestState === 'interested'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                : interestState === 'negotiable'
                ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer'
                : 'bg-red-950/50 border border-red-500/30 text-red-400/80 cursor-not-allowed'
            }`}
          >
            {isT2
              ? '✓ Titular #2'
              : interestState === 'negotiable'
              ? 'Negociar #2'
              : interestState === 'no_interest'
              ? 'Indisponível'
              : 'Titular #2'}
          </button>
        </div>

        <button
          type="button"
          disabled={interestState === 'no_interest' && !isRes}
          onClick={() => onAssignSlot(driver, 'reserve')}
          className={`w-full py-1.5 rounded text-[10px] font-f1-wide font-bold uppercase transition-all flex items-center justify-center gap-1 ${
            isRes
              ? 'bg-cyan-600 text-white shadow-md cursor-pointer'
              : interestState === 'interested'
              ? 'bg-white/10 hover:bg-cyan-700 text-zinc-100 cursor-pointer border border-white/15'
              : interestState === 'negotiable'
              ? 'bg-amber-700/80 hover:bg-amber-600 text-white cursor-pointer'
              : 'bg-red-950/40 border border-red-500/25 text-red-400/75 cursor-not-allowed'
          }`}
        >
          {isRes
            ? '✓ Piloto Reserva (Dispensar)'
            : interestState === 'negotiable'
            ? 'Negociar Reserva (Exige Prêmio +30%)'
            : interestState === 'no_interest'
            ? 'Sem Interesse na Equipe Atual'
            : 'Contratar como Reserva'}
        </button>
      </div>
    </div>
  );
};

export interface DriverProfileModalProps {
  driver: Driver | null;
  isT1: boolean;
  isT2: boolean;
  isRes: boolean;
  interestState: DriverInterestState;
  playerReputation: number;
  effectiveSalary: number;
  contractedSalary?: number;
  onClose: () => void;
  onAssignSlot: (driver: Driver, slot: 't1' | 't2' | 'reserve') => void;
}

export const DriverProfileModal: React.FC<DriverProfileModalProps> = ({
  driver,
  isT1,
  isT2,
  isRes,
  interestState,
  playerReputation,
  effectiveSalary,
  contractedSalary,
  onClose,
  onAssignSlot
}) => {
  if (!driver) return null;

  const reqRep = driver.requiredReputation || 0;
  const marketAnalysis = getDriverMarketAnalysis(driver);
  const potentialProfile = getDriverPotentialProfile(driver);
  const techAttributes = getDriverTechnicalAttributes(driver);
  const teamDisplayName = getDriverTeamName(driver);
  const ovrValue = driver.ovr || driver.attributes.pace;
  const feedbackVal = driver.attributes.feedback;
  const feedbackTone = getAttributeVisualTone(feedbackVal);
  const mktTone = getAttributeVisualTone(marketAnalysis.effectiveMarketability);

  return (
    <div
      className="fixed inset-0 z-[130] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="max-w-3xl w-full bg-[#15151E] border-2 border-[#E10600]/80 rounded-lg p-6 shadow-2xl space-y-5 font-f1-mono my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* 1. CABEÇALHO COMPLETO */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-lg border-2 border-white/25 flex flex-col items-center justify-center shrink-0 shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${driver.avatarColor || '#1F2937'} 0%, #09090F 100%)`
              }}
            >
              <span className="font-f1-wide font-black text-lg text-white leading-none">
                {driver.shortCode || getDriverInitials(driver.name)}
              </span>
              <span className="text-xs text-white/85 font-bold mt-1 tabular-nums">
                #{driver.number}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-[#E10600] font-bold uppercase tracking-widest">
                  FICHA COMPLETA DO PILOTO · {driver.series || 'F1'}
                </span>
                <span
                  className={`text-[10px] font-f1-wide font-black uppercase px-2 py-0.5 rounded border ${
                    potentialProfile.isElite
                      ? 'bg-gradient-to-r from-purple-600/50 via-fuchsia-500/45 to-purple-500/50 border-purple-300/80 text-purple-100 shadow-[0_0_12px_rgba(168,85,247,0.6)]'
                      : potentialProfile.tier === 'Alto'
                      ? 'bg-cyan-950/70 border-cyan-400/50 text-cyan-200'
                      : 'bg-zinc-800/80 border-zinc-600 text-zinc-300'
                  }`}
                >
                  Potencial: {potentialProfile.tier} ({potentialProfile.numericPotential})
                </span>
              </div>
              <h3 className="font-f1-wide font-black text-xl sm:text-2xl text-white uppercase">
                {driver.name}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-300">
                <span className="font-bold">{driver.nationality}</span>
                <span className="text-zinc-600">·</span>
                <span className="font-bold text-white">{driver.age} anos</span>
                <span className="text-zinc-600">·</span>
                <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15 font-bold text-zinc-100">
                  {teamDisplayName}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <div className="px-4 py-2 rounded-lg bg-[#1C1C26] border border-white/15 text-center">
              <span
                className={`text-3xl font-f1-wide font-black tabular-nums block leading-none ${
                  ovrValue > 90 ? 'text-[#39FF14]' : ovrValue < 60 ? 'text-red-400' : 'text-amber-400'
                }`}
              >
                {ovrValue}
              </span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                OVR GERAL
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-300 hover:text-white cursor-pointer"
              aria-label="Fechar Ficha Completa"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. STATUS DE CONTRATAÇÃO */}
        <div className="bg-[#1C1C26] border border-white/10 rounded-lg p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
            <span className="text-xs font-f1-wide font-bold text-white uppercase flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-400" />
              Status de Contratação & Cláusulas
            </span>
            {interestState === 'interested' ? (
              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded border bg-emerald-950/80 text-emerald-300 border-emerald-500/50">
                ✓ Interessado na Proposta
              </span>
            ) : interestState === 'negotiable' ? (
              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded border bg-amber-950/80 text-amber-300 border-amber-500/50">
                ⚠ Negociável (Exige Prêmio de Risco +30%)
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded border bg-red-950/80 text-red-300 border-red-500/50">
                ✗ Sem Interesse (Reputação Insuficiente)
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-black/30 p-2.5 rounded border border-white/5">
              <span className="text-[10px] text-zinc-400 block">Salário Anual</span>
              <span className={`font-bold text-sm tabular-nums ${contractedSalary ? 'text-amber-400' : 'text-white'}`}>
                ${(effectiveSalary / 1000000).toFixed(1)}M/ano
              </span>
            </div>
            <div className="bg-black/30 p-2.5 rounded border border-white/5">
              <span className="text-[10px] text-zinc-400 block">Multa Rescisória</span>
              <span className="font-bold text-sm text-amber-400 tabular-nums">
                {driver.buyoutClause ? `$${(driver.buyoutClause / 1000000).toFixed(1)}M` : 'Sem Multa'}
              </span>
            </div>
            <div className="bg-black/30 p-2.5 rounded border border-white/5">
              <span className="text-[10px] text-zinc-400 block">Reputação Exigida</span>
              <span
                className={`font-bold text-sm tabular-nums ${
                  interestState === 'interested'
                    ? 'text-emerald-400'
                    : interestState === 'negotiable'
                    ? 'text-amber-400'
                    : 'text-red-400'
                }`}
              >
                {reqRep}+ (Equipe: {playerReputation})
              </span>
            </div>
            <div className="bg-black/30 p-2.5 rounded border border-white/5">
              <span className="text-[10px] text-zinc-400 block">Contrato Vigente</span>
              <span className="font-bold text-sm text-zinc-200 tabular-nums">
                {driver.contractYearsRemaining > 0
                  ? `${driver.contractYearsRemaining} ano(s)`
                  : 'Livre Imediato'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. FICHA TÉCNICA COMPLETA (12 ATRIBUTOS EM PT-BR) */}
        <div className="bg-[#1C1C26] border border-white/10 rounded-lg p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
            <span className="text-xs font-f1-wide font-bold text-white uppercase flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Ficha Técnica Completa (12 Atributos)
            </span>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="text-[#39FF14] font-bold">● &gt;90 Elite (Verde Neon)</span>
              <span className="text-red-400 font-bold">● &lt;60 Alerta (Vermelho)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-3">
            {techAttributes.map(attr => (
              <AttributeProgressRow
                key={attr.key}
                label={attr.label}
                value={attr.value}
                compact={false}
              />
            ))}
          </div>
        </div>

        {/* 4. FICHA COMERCIAL E DESENVOLVIMENTO */}
        <div className="bg-[#1C1C26] border border-white/10 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-f1-wide font-bold text-white uppercase flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Ficha Comercial & Desenvolvimento
            </span>
            <span className="text-[10px] text-zinc-400">
              Tier de Mercado: <strong className="text-white">{marketAnalysis.marketabilityTier}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-black/30 p-3 rounded border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-400 font-bold uppercase">
                  Potencial de Desenvolvimento
                </span>
                <span
                  className={`text-[10px] font-f1-wide font-black uppercase px-2.5 py-0.5 rounded border ${
                    potentialProfile.isElite
                      ? 'bg-gradient-to-r from-purple-600/50 via-fuchsia-500/45 to-purple-500/50 border-purple-300/80 text-purple-100 shadow-[0_0_12px_rgba(168,85,247,0.6)]'
                      : potentialProfile.tier === 'Alto'
                      ? 'bg-cyan-950/70 border-cyan-400/50 text-cyan-200'
                      : 'bg-zinc-800/80 border-zinc-600 text-zinc-300'
                  }`}
                >
                  {potentialProfile.tier}
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">{potentialProfile.summary}</p>
            </div>

            <div className="bg-black/30 p-3 rounded border border-white/5 space-y-2.5">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-300 font-bold">Feedback Técnico</span>
                  <span className={`font-bold tabular-nums ${feedbackTone.textClass}`}>
                    {feedbackVal} / 100
                  </span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${feedbackTone.barClass}`}
                    style={{ width: `${feedbackVal}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-300 font-bold">Marketability (Comercial)</span>
                  <span className="tabular-nums">
                    <span className={`font-bold ${mktTone.textClass}`}>
                      {marketAnalysis.effectiveMarketability}
                    </span>{' '}
                    <span className="text-emerald-400 font-bold">
                      (+${marketAnalysis.marketingBonusCashM.toFixed(1)}M/ano)
                    </span>
                  </span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${mktTone.barClass}`}
                    style={{ width: `${marketAnalysis.effectiveMarketability}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {marketAnalysis.isSoleRepresentative && (
            <div className="text-xs font-bold text-amber-300 bg-gradient-to-r from-amber-950/80 via-yellow-900/40 to-amber-950/80 border border-amber-400/60 px-3 py-2 rounded flex items-center justify-between gap-2">
              <span>★ Bônus de Mercado: +15 Marketability (Único representante do país no grid)</span>
              <span className="text-emerald-300">{marketAnalysis.bonusText}</span>
            </div>
          )}
        </div>

        {/* AÇÕES DIRETAS DE CONTRATAÇÃO */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-white/10">
          <button
            type="button"
            disabled={interestState === 'no_interest' && !isT1}
            onClick={() => onAssignSlot(driver, 't1')}
            className={`py-2.5 rounded text-xs font-f1-wide font-bold uppercase transition-all ${
              isT1
                ? 'bg-[#E10600] text-white cursor-pointer'
                : interestState === 'interested'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                : interestState === 'negotiable'
                ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer'
                : 'bg-red-950/50 border border-red-500/30 text-red-400/80 cursor-not-allowed'
            }`}
          >
            {isT1 ? '✓ Titular #1 (Dispensar)' : 'Contratar Titular #1'}
          </button>
          <button
            type="button"
            disabled={interestState === 'no_interest' && !isT2}
            onClick={() => onAssignSlot(driver, 't2')}
            className={`py-2.5 rounded text-xs font-f1-wide font-bold uppercase transition-all ${
              isT2
                ? 'bg-[#E10600] text-white cursor-pointer'
                : interestState === 'interested'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                : interestState === 'negotiable'
                ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer'
                : 'bg-red-950/50 border border-red-500/30 text-red-400/80 cursor-not-allowed'
            }`}
          >
            {isT2 ? '✓ Titular #2 (Dispensar)' : 'Contratar Titular #2'}
          </button>
          <button
            type="button"
            disabled={interestState === 'no_interest' && !isRes}
            onClick={() => onAssignSlot(driver, 'reserve')}
            className={`py-2.5 rounded text-xs font-f1-wide font-bold uppercase transition-all ${
              isRes
                ? 'bg-cyan-600 text-white cursor-pointer'
                : interestState === 'interested'
                ? 'bg-white/10 hover:bg-cyan-600 text-white border border-white/15 cursor-pointer'
                : interestState === 'negotiable'
                ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer'
                : 'bg-red-950/50 border border-red-500/30 text-red-400/80 cursor-not-allowed'
            }`}
          >
            {isRes ? '✓ Reserva (Dispensar)' : 'Contratar Reserva'}
          </button>
        </div>
      </div>
    </div>
  );
};

export interface StaffMarketCardProps {
  staffMember: StaffMember;
  isAssigned: boolean;
  interest?: StaffInterestEvaluation;
  raceEngineerSlot?: 1 | 2 | null;
  onAssignRaceEngineer?: (staff: StaffMember, carSlot: 1 | 2) => void;
  onExpand: (staff: StaffMember) => void;
  onToggleAssign: (staff: StaffMember) => void;
}

const getStaffAccentColor = (role: StaffMember['role']): string => {
  switch (role) {
    case 'head_aero':
      return '#0EA5E9';
    case 'head_pu':
      return '#E10600';
    case 'sporting_director':
      return '#F59E0B';
    case 'chief_mechanic':
      return '#10B981';
    case 'race_engineer':
      return '#A855F7';
    default:
      return '#6366F1';
  }
};

export const StaffMarketCard: React.FC<StaffMarketCardProps> = ({
  staffMember,
  isAssigned,
  interest,
  raceEngineerSlot,
  onAssignRaceEngineer,
  onExpand,
  onToggleAssign
}) => {
  const profile = getStaffFullProfile(staffMember);
  const accent = getStaffAccentColor(staffMember.role);
  const isFree =
    !staffMember.buyoutClause ||
    staffMember.currentTeam === 'Agente Livre' ||
    !staffMember.currentTeam;

  const isBlocked = interest?.status === 'blocked' && !isAssigned;
  const isNegotiable = interest?.status === 'negotiable' && !isAssigned;
  const displaySalary = isNegotiable && interest ? interest.requiredSalaryUsd : staffMember.salary;

  const interestBarColor =
    !interest || interest.interestPct >= 65
      ? 'bg-emerald-500'
      : interest.interestPct >= 35
      ? 'bg-amber-400'
      : 'bg-red-500';

  const interestTextColor =
    !interest || interest.interestPct >= 65
      ? 'text-emerald-400'
      : interest.interestPct >= 35
      ? 'text-amber-300'
      : 'text-red-400';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onExpand(staffMember)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onExpand(staffMember);
        }
      }}
      className={`p-4 border rounded-lg text-xs font-f1-mono flex flex-col justify-between transition-all cursor-pointer group ${
        isAssigned
          ? 'bg-[#101C15] border-emerald-500 shadow-lg shadow-emerald-950/30'
          : isBlocked
          ? 'bg-[#15151E]/85 border-white/10 opacity-85 hover:border-red-500/40'
          : 'bg-[#15151E] border-white/10 hover:border-white/35 hover:bg-[#191924]'
      }`}
    >
      <div className="space-y-3">
        {/* TAG DE FILOSOFIA NO TOPO */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
          <span className="text-[10px] font-f1-wide font-black tracking-wider uppercase px-2 py-0.5 rounded bg-purple-950/70 border border-purple-400/50 text-purple-200">
            [ FILOSOFIA: {profile.staffPhilosophyTag} ]
          </span>
          <span className="text-[9px] text-zinc-400 uppercase font-bold">
            {staffMember.isFictional ? 'Especialista' : 'Paddock F1'}
          </span>
        </div>

        {/* SEÇÃO 1: CABEÇALHO DO CHEFE */}
        <div className="flex items-start justify-between gap-2.5 pb-2.5 border-b border-white/10">
          <div className="flex items-start gap-2.5 min-w-0">
            <div
              className="w-11 h-11 rounded-lg border border-white/20 flex flex-col items-center justify-center shrink-0 shadow-inner"
              style={{
                background: `linear-gradient(135deg, ${accent} 0%, #0E0E15 100%)`
              }}
            >
              <span className="font-f1-wide font-black text-xs text-white leading-none">
                {getDriverInitials(staffMember.name)}
              </span>
              <span className="text-[8px] text-white/85 font-bold uppercase mt-0.5">
                {staffMember.role === 'race_engineer' ? 'RÁDIO' : staffMember.isFictional ? 'ENG' : 'F1'}
              </span>
            </div>

            <div className="min-w-0">
              <span className="font-f1-wide font-black text-sm text-white group-hover:text-emerald-300 transition-colors block truncate">
                {staffMember.name}
              </span>
              {/* ESPECIALIZAÇÃO EM DESTAQUE ABSOLUTO */}
              <span
                className="text-[11px] font-f1-wide font-black text-cyan-400 uppercase tracking-wider block mt-0.5 truncate"
                title={staffMember.specialty || profile.designDna}
              >
                🎯 {staffMember.specialty || profile.designDna}
              </span>
              <span className="text-[10px] text-zinc-400 block truncate mt-0.5">
                {profile.roleLabel}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-zinc-400 flex-wrap">
                <span className="text-zinc-200 font-bold">{profile.age} anos</span>
                <span>·</span>
                <span className="truncate max-w-[160px]">
                  {staffMember.currentTeam || staffMember.teamOrigin || 'Agente Livre'}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right shrink-0 flex flex-col items-end">
            <div className="px-2 py-1 rounded bg-black/50 border border-white/15 text-center">
              <span
                className={`text-lg font-f1-wide font-black tabular-nums block leading-none ${
                  staffMember.rating > 90
                    ? 'text-[#39FF14]'
                    : staffMember.rating < 60
                    ? 'text-red-400'
                    : 'text-emerald-400'
                }`}
              >
                {staffMember.rating}
              </span>
              <span className="text-[8px] text-zinc-400 uppercase tracking-widest font-bold block mt-0.5">
                OVR
              </span>
            </div>
            <span className="text-[9px] text-cyan-400/90 group-hover:text-cyan-300 flex items-center gap-1 mt-1 font-bold">
              <Maximize2 className="w-2.5 h-2.5" />
              Ficha
            </span>
          </div>
        </div>

        {/* BARRA DE NÍVEL DE INTERESSE (0-100%) */}
        {interest && (
          <div className="bg-[#1C1C26]/95 border border-white/10 rounded p-2.5 space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-[10px]">
              <span className="text-zinc-300 font-bold uppercase">Nível de Interesse</span>
              <span className={`font-bold tabular-nums ${interestTextColor}`}>
                {interest.interestPct}% · {interest.statusLabel}
              </span>
            </div>
            <div className="h-1.5 w-full bg-black/70 rounded-full overflow-hidden border border-white/10">
              <div
                className={`h-full rounded-full transition-all duration-300 ${interestBarColor}`}
                style={{ width: `${interest.interestPct}%` }}
              />
            </div>
            <p className="text-[10px] text-zinc-400 leading-snug">{interest.reason}</p>
          </div>
        )}

        {/* SEÇÃO 2: STATUS DE CONTRATAÇÃO */}
        <div className="bg-[#1C1C26]/90 border border-white/10 rounded p-2.5 space-y-1.5">
          <div className="flex items-center justify-between pb-1 border-b border-white/5">
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
              Contrato & Custos
            </span>
            <span
              className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                isFree
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                  : 'bg-amber-950/70 text-amber-300 border-amber-500/40'
              }`}
            >
              {isFree ? '✓ Sem Multa' : 'Com Multa'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <span className="text-zinc-500 block">Salário Anual</span>
              <span className={`font-bold tabular-nums ${isNegotiable ? 'text-amber-300' : 'text-white'}`}>
                ${(displaySalary / 1000000).toFixed(2)}M/ano
              </span>
            </div>
            <div className="text-right">
              <span className="text-zinc-500 block">Multa Rescisória</span>
              <span className="text-amber-400 font-bold tabular-nums">
                {staffMember.buyoutClause
                  ? `$${(staffMember.buyoutClause / 1000000).toFixed(1)}M`
                  : 'Isento ($0)'}
              </span>
            </div>
          </div>
        </div>

        {/* SEÇÃO 3: DNA DE PROJETO & IMPACTO NA FASE 5 */}
        <div className="bg-gradient-to-r from-[#1D1B2E] to-[#15151E] border border-purple-500/35 rounded p-2.5 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-purple-300 flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              DNA Técnico
            </span>
            <span className="text-[10px] font-f1-wide font-black text-purple-100 bg-purple-600/35 border border-purple-400/60 px-2 py-0.5 rounded">
              {profile.designDna}
            </span>
          </div>
          <p className="text-[10px] text-zinc-300 leading-snug">{profile.philosophyImpactSummary}</p>
        </div>

        {/* SEÇÃO 4: PILARES DO CARGO (3 DESTAQUES + RESUMO) */}
        <div className="bg-black/35 border border-white/10 rounded p-2.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
              Atributos-Chave do Cargo
            </span>
            <span className="text-[9px] text-zinc-500">
              <span className="text-[#39FF14] font-bold">&gt;90</span> ·{' '}
              <span className="text-red-400 font-bold">&lt;60</span>
            </span>
          </div>
          <div className="space-y-1.5">
            {profile.pillarAttributes.map(attr => (
              <AttributeProgressRow key={attr.key} label={attr.label} value={attr.value} compact />
            ))}
          </div>
        </div>
      </div>

      {/* BOTÃO DE CONTRATAÇÃO (stopPropagation para não abrir modal ao clicar) */}
      <div className="mt-3 pt-3 border-t border-white/10" onClick={e => e.stopPropagation()}>
        {staffMember.role === 'race_engineer' && onAssignRaceEngineer ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isBlocked && raceEngineerSlot !== 1}
              onClick={() => onAssignRaceEngineer(staffMember, 1)}
              className={`py-2 rounded text-[11px] font-f1-wide font-bold uppercase transition-all whitespace-nowrap ${
                raceEngineerSlot === 1
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                  : isBlocked
                  ? 'bg-red-950/40 border border-red-500/30 text-red-400/80 cursor-not-allowed'
                  : isNegotiable
                  ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer'
                  : 'bg-white/10 hover:bg-[#E10600] text-white border border-white/15 cursor-pointer'
              }`}
            >
              {raceEngineerSlot === 1 ? '✓ Rádio Carro #1' : 'Rádio Carro #1'}
            </button>
            <button
              type="button"
              disabled={isBlocked && raceEngineerSlot !== 2}
              onClick={() => onAssignRaceEngineer(staffMember, 2)}
              className={`py-2 rounded text-[11px] font-f1-wide font-bold uppercase transition-all whitespace-nowrap ${
                raceEngineerSlot === 2
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                  : isBlocked
                  ? 'bg-red-950/40 border border-red-500/30 text-red-400/80 cursor-not-allowed'
                  : isNegotiable
                  ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer'
                  : 'bg-white/10 hover:bg-[#E10600] text-white border border-white/15 cursor-pointer'
              }`}
            >
              {raceEngineerSlot === 2 ? '✓ Rádio Carro #2' : 'Rádio Carro #2'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={isBlocked}
            onClick={() => onToggleAssign(staffMember)}
            className={`w-full py-2 rounded text-xs font-f1-wide font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
              isAssigned
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md cursor-pointer'
                : isBlocked
                ? 'bg-red-950/45 border border-red-500/35 text-red-400/80 cursor-not-allowed'
                : isNegotiable
                ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer'
                : 'bg-white/10 text-white hover:bg-[#E10600] border border-white/15 cursor-pointer'
            }`}
          >
            {isAssigned
              ? '✓ Homologado no Cargo (Dispensar)'
              : isBlocked
              ? 'Sem Interesse no Projeto Atual'
              : isNegotiable
              ? `Negociar (+25% · $${(displaySalary / 1000000).toFixed(1)}M)`
              : 'Contratar para o Cargo'}
          </button>
        )}
      </div>
    </div>
  );
};

export interface StaffProfileModalProps {
  staffMember: StaffMember | null;
  isAssigned: boolean;
  interest?: StaffInterestEvaluation;
  onClose: () => void;
  onToggleAssign: (staff: StaffMember) => void;
}

export const StaffProfileModal: React.FC<StaffProfileModalProps> = ({
  staffMember,
  isAssigned,
  interest,
  onClose,
  onToggleAssign
}) => {
  if (!staffMember) return null;

  const profile = getStaffFullProfile(staffMember);
  const accent = getStaffAccentColor(staffMember.role);
  const isFree =
    !staffMember.buyoutClause ||
    staffMember.currentTeam === 'Agente Livre' ||
    !staffMember.currentTeam;
  const isBlocked = interest?.status === 'blocked' && !isAssigned;
  const isNegotiable = interest?.status === 'negotiable' && !isAssigned;

  return (
    <div
      className="fixed inset-0 z-[130] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="max-w-2xl w-full bg-[#15151E] border-2 border-emerald-500/80 rounded-lg p-6 shadow-2xl space-y-5 font-f1-mono my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* 1. CABEÇALHO */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-lg border-2 border-white/25 flex flex-col items-center justify-center shrink-0 shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${accent} 0%, #09090F 100%)`
              }}
            >
              <span className="font-f1-wide font-black text-lg text-white leading-none">
                {getDriverInitials(staffMember.name)}
              </span>
              <span className="text-[10px] text-white/80 font-bold uppercase mt-1">
                {staffMember.role === 'race_engineer' ? 'RÁDIO' : staffMember.isFictional ? 'ENG' : 'F1'}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                  FICHA COMPLETA · {profile.roleLabel}
                </span>
                <span className="text-[10px] font-f1-wide font-black px-2 py-0.5 rounded bg-purple-950/70 border border-purple-400/50 text-purple-200">
                  [ FILOSOFIA: {profile.staffPhilosophyTag} ]
                </span>
              </div>
              <h3 className="font-f1-wide font-black text-xl sm:text-2xl text-white uppercase">
                {staffMember.name}
              </h3>
              {/* ESPECIALIDADE EM DESTAQUE NO MODAL */}
              <span className="text-xs font-f1-wide font-black text-cyan-400 uppercase tracking-wider block">
                🎯 {staffMember.specialty || profile.designDna}
              </span>
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-300">
                <span className="font-bold text-white">{profile.age} anos</span>
                <span className="text-zinc-600">·</span>
                <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15 font-bold">
                  {staffMember.currentTeam || 'Agente Livre'}
                </span>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-400">Origem: {staffMember.teamOrigin}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <div className="px-4 py-2 rounded-lg bg-[#1C1C26] border border-white/15 text-center">
              <span
                className={`text-3xl font-f1-wide font-black tabular-nums block leading-none ${
                  staffMember.rating > 90
                    ? 'text-[#39FF14]'
                    : staffMember.rating < 60
                    ? 'text-red-400'
                    : 'text-emerald-400'
                }`}
              >
                {staffMember.rating}
              </span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                OVR CHEFE
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-300 hover:text-white cursor-pointer"
              aria-label="Fechar Ficha Completa do Chefe"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* INTERESSE NO PROJETO */}
        {interest && (
          <div className="bg-[#1C1C26] border border-white/10 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase text-zinc-300">Nível de Interesse na Equipe</span>
              <span
                className={`font-bold tabular-nums ${
                  interest.interestPct >= 65
                    ? 'text-emerald-400'
                    : interest.interestPct >= 35
                    ? 'text-amber-300'
                    : 'text-red-400'
                }`}
              >
                {interest.interestPct}% · {interest.statusLabel}
              </span>
            </div>
            <div className="h-2 w-full bg-black/70 rounded-full overflow-hidden border border-white/10">
              <div
                className={`h-full rounded-full ${
                  interest.interestPct >= 65
                    ? 'bg-emerald-500'
                    : interest.interestPct >= 35
                    ? 'bg-amber-400'
                    : 'bg-red-500'
                }`}
                style={{ width: `${interest.interestPct}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-300">{interest.reason}</p>
          </div>
        )}

        {/* 2. DNA DE PROJETO */}
        <div className="bg-gradient-to-r from-[#1E1A30] via-[#1C1C26] to-[#15151E] border border-purple-500/45 rounded-lg p-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-f1-wide font-bold text-purple-200 uppercase flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              DNA de Projeto & Impacto na Filosofia do Carro
            </span>
            <span className="text-xs font-f1-wide font-black text-purple-100 bg-purple-600/45 border border-purple-300/70 px-3 py-1 rounded">
              {profile.designDna}
            </span>
          </div>
          <p className="text-xs text-white font-bold">{staffMember.specialty}</p>
          <p className="text-[11px] text-zinc-300 leading-relaxed">{profile.philosophyImpactSummary}</p>
        </div>

        {/* 3. STATUS DE CONTRATAÇÃO */}
        <div className="bg-[#1C1C26] border border-white/10 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-black/30 p-2.5 rounded border border-white/5">
            <span className="text-[10px] text-zinc-400 block">Status no Mercado</span>
            <span className={`font-bold ${isFree ? 'text-emerald-400' : 'text-amber-300'}`}>
              {isFree ? '✓ Disponível (Sem Multa)' : 'Sob Contrato (Com Multa)'}
            </span>
          </div>
          <div className="bg-black/30 p-2.5 rounded border border-white/5">
            <span className="text-[10px] text-zinc-400 block">Salário Anual</span>
            <span className="font-bold text-white text-sm tabular-nums">
              ${((isNegotiable && interest ? interest.requiredSalaryUsd : staffMember.salary) / 1000000).toFixed(2)}M/ano
            </span>
          </div>
          <div className="bg-black/30 p-2.5 rounded border border-white/5">
            <span className="text-[10px] text-zinc-400 block">Multa Rescisória</span>
            <span className="font-bold text-amber-400 text-sm tabular-nums">
              {staffMember.buyoutClause
                ? `$${(staffMember.buyoutClause / 1000000).toFixed(1)}M`
                : 'Isento ($0)'}
            </span>
          </div>
        </div>

        {/* 4. FICHA TÉCNICA DE STAFF (7 ATRIBUTOS EM PT-BR) */}
        <div className="bg-[#1C1C26] border border-white/10 rounded-lg p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
            <span className="text-xs font-f1-wide font-bold text-white uppercase flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-400" />
              Avaliação Técnica & Gestão (0–100)
            </span>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="text-[#39FF14] font-bold">● &gt;90 Elite (Verde Neon)</span>
              <span className="text-red-400 font-bold">● &lt;60 Alerta (Vermelho)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {profile.attributes.map(attr => (
              <AttributeProgressRow
                key={attr.key}
                label={attr.label}
                value={attr.value}
                compact={false}
              />
            ))}
          </div>
        </div>

        {/* BOTÃO DE CONTRATAÇÃO */}
        <div className="pt-2 border-t border-white/10 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded bg-[#252533] hover:bg-[#2F2F40] border border-white/15 text-xs font-f1-wide font-bold text-white uppercase cursor-pointer"
          >
            Fechar
          </button>
          <button
            type="button"
            disabled={isBlocked}
            onClick={() => {
              onToggleAssign(staffMember);
              onClose();
            }}
            className={`flex-1 py-2.5 rounded text-xs font-f1-wide font-black uppercase transition-all ${
              isAssigned
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                : isBlocked
                ? 'bg-red-950/50 border border-red-500/40 text-red-400 cursor-not-allowed'
                : 'bg-[#E10600] hover:bg-[#c20500] text-white shadow-lg cursor-pointer'
            }`}
          >
            {isAssigned
              ? '✓ Homologado no Cargo (Dispensar)'
              : isBlocked
              ? 'Sem Interesse no Projeto Atual'
              : `Contratar ${staffMember.name}`}
          </button>
        </div>
      </div>
    </div>
  );
};
