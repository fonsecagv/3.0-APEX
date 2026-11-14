import React, { useState } from 'react';
import {
  Radio,
  Volume2,
  Terminal,
  ShieldAlert,
  UserCheck,
  Cpu,
  Wind,
  Wrench,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Calendar,
  DollarSign,
  Layers,
  Flame,
  ChevronRight,
  MessageSquare
} from 'lucide-react';

export type CharacterId =
  | 'fia_terminal'
  | 'helena_vance'
  | 'klaus_muller'
  | 'david_sanchez'
  | 'gunter_schmidt'
  | 'hr_director'
  | 'driver_radio';

export interface CharacterProfile {
  id: CharacterId;
  name: string;
  role: string;
  badge: string;
  badgeColor: string;
  avatarBg: string;
  icon: React.ElementType;
  tagline: string;
}

export const CHARACTERS: Record<CharacterId, CharacterProfile> = {
  fia_terminal: {
    id: 'fia_terminal',
    name: 'TERMINAL DA FIA 2026',
    role: 'Sistema Oficial de Governança & Regulamento Técnico',
    badge: 'PROTOCOLO FIA',
    badgeColor: 'border-zinc-500 text-zinc-300 bg-zinc-900/80',
    avatarBg: 'bg-zinc-800 text-zinc-300 border-zinc-600',
    icon: Terminal,
    tagline: 'Diretrizes Técnicas, Teto Orçamentário e Homologação 2026'
  },
  helena_vance: {
    id: 'helena_vance',
    name: 'Dra. Helena Vance',
    role: 'Conselheira Executiva & Relações Corporativas',
    badge: 'CONSELHO & IMPRENSA',
    badgeColor: 'border-amber-500/60 text-amber-400 bg-amber-950/40',
    avatarBg: 'bg-amber-950/80 text-amber-300 border-amber-500',
    icon: UserCheck,
    tagline: 'Proteção do Teto de Gastos, Negociação Comercial e Conselho'
  },
  klaus_muller: {
    id: 'klaus_muller',
    name: 'Klaus Müller',
    role: 'Diretor Técnico & Chefe de Powertrain',
    badge: 'MECÂNICA & PU',
    badgeColor: 'border-red-500/60 text-red-400 bg-red-950/40',
    avatarBg: 'bg-red-950/80 text-red-400 border-red-500',
    icon: Cpu,
    tagline: 'Bloco Térmico V6, ERS 350kW, Bancada e Dinamômetro'
  },
  david_sanchez: {
    id: 'david_sanchez',
    name: 'David Sanchez',
    role: 'Chefe de Aerodinâmica & Túnel de Vento',
    badge: 'AERODINÂMICA & CFD',
    badgeColor: 'border-cyan-500/60 text-cyan-400 bg-cyan-950/40',
    avatarBg: 'bg-cyan-950/80 text-cyan-400 border-cyan-500',
    icon: Wind,
    tagline: 'Efeito Solo, Downwash Sidepods, Difusores e Porpoising'
  },
  gunter_schmidt: {
    id: 'gunter_schmidt',
    name: 'Günter Schmidt',
    role: 'Diretor de Operações de Pista & Pit Wall',
    badge: 'PIT WALL & GARAGEM',
    badgeColor: 'border-emerald-500/60 text-emerald-400 bg-emerald-950/40',
    avatarBg: 'bg-emerald-950/80 text-emerald-400 border-emerald-500',
    icon: Wrench,
    tagline: 'Paradas de Boxe 2.1s, Telemetria ao Vivo e Gestão de Pneus'
  },
  hr_director: {
    id: 'hr_director',
    name: 'Diretoria de RH & Paddock Insider',
    role: 'Gestão de Talentos e Relações com o Grid',
    badge: 'MERCADO DE TALENTOS',
    badgeColor: 'border-purple-500/60 text-purple-400 bg-purple-950/40',
    avatarBg: 'bg-purple-950/80 text-purple-400 border-purple-500',
    icon: ShieldAlert,
    tagline: 'Mercado de Pilotos, Multas Rescisórias e Sinergia da Fábrica'
  },
  driver_radio: {
    id: 'driver_radio',
    name: 'Rádio Cockpit · Piloto Titular',
    role: 'Comunicação Oficial de Pista em Tempo Real',
    badge: 'COCKPIT TELEMETRY',
    badgeColor: 'border-yellow-500/60 text-yellow-400 bg-yellow-950/40',
    avatarBg: 'bg-yellow-950/80 text-yellow-400 border-yellow-500',
    icon: Radio,
    tagline: 'Sensação de Frente, Subviragem, Aderência e Feedback de Acerto'
  }
};

export interface NarrativeMessage {
  characterId: CharacterId;
  prefix?: string; // e.g. "[MOTOR E NARRADOR]" | "[RELATÓRIO DE ENGENHARIA]"
  quote: string;
  technicalDetails?: string[];
  alert?: {
    type: 'info' | 'warning' | 'success' | 'danger';
    text: string;
  };
}

interface NarrativeAssistantDispatchProps {
  primaryMessage: NarrativeMessage;
  secondaryMessages?: NarrativeMessage[];
  currentDate?: string;
  budgetBalance?: string;
  weeksRemaining?: number;
  correlationError?: string;
  className?: string;
}

export const NarrativeAssistantDispatch: React.FC<NarrativeAssistantDispatchProps> = ({
  primaryMessage,
  secondaryMessages = [],
  currentDate = '05/01/2026',
  budgetBalance = '$135.0M',
  weeksRemaining = 8,
  correlationError,
  className = ''
}) => {
  const allMessages = [primaryMessage, ...secondaryMessages];
  const [selectedIdx, setSelectedIdx] = useState<number>(0);

  // Active message
  const activeMsg = allMessages[selectedIdx] || primaryMessage;
  const character = CHARACTERS[activeMsg.characterId] || CHARACTERS.fia_terminal;
  const IconComponent = character.icon;

  return (
    <div
      className={`border border-[#2C2C3A] bg-[#171722]/95 backdrop-blur-md rounded-none shadow-2xl relative overflow-hidden ${className}`}
    >
      {/* Top Telemetry Diagnostic Strip */}
      <div className="bg-[#101018] border-b border-white/5 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-f1-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E10600] animate-ping" />
            <span className="text-[10px] font-bold tracking-wider text-white uppercase flex items-center gap-1">
              <Radio className="w-3 h-3 text-[#E10600]" />
              DISPATCH ASSISTENTE EM TEMPO REAL
            </span>
          </div>

          <span className="hidden md:inline-block text-zinc-600">|</span>

          <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            <span>DATA: <strong className="text-zinc-200">{currentDate}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
            <span>SALDO TETO: <strong className="text-emerald-300 font-bold">{budgetBalance}</strong></span>
          </div>

          <span className="text-zinc-700">·</span>

          <div className="flex items-center gap-1.5 text-amber-400">
            <Activity className="w-3.5 h-3.5 text-amber-500" />
            <span>PRAZO FIA: <strong className="text-amber-300 font-bold">{weeksRemaining} sem.</strong></span>
          </div>

          {correlationError && (
            <>
              <span className="text-zinc-700">·</span>
              <div className="flex items-center gap-1.5 text-cyan-400">
                <Wind className="w-3.5 h-3.5 text-cyan-500" />
                <span>CORRELAÇÃO: <strong className="text-cyan-300">{correlationError}</strong></span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Narrative Area */}
      <div className="p-4 sm:p-5">
        {/* Multi-Character Radio Tabs (if secondary messages exist) */}
        {allMessages.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-3 border-b border-white/5 scrollbar-thin">
            <span className="text-[10px] font-f1-mono text-zinc-500 uppercase tracking-wider mr-1 flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              VOZES DO PADDOCK:
            </span>
            {allMessages.map((msg, idx) => {
              const char = CHARACTERS[msg.characterId] || CHARACTERS.fia_terminal;
              const isSelected = idx === selectedIdx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedIdx(idx)}
                  className={`flex items-center gap-2 px-2.5 py-1 text-[11px] font-f1-mono border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#E10600] bg-[#E10600]/20 text-white font-bold shadow-sm'
                      : 'border-white/10 bg-[#1C1C26] text-zinc-400 hover:text-white hover:border-white/30'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-[#E10600]' : 'bg-zinc-500'
                    }`}
                  />
                  <span>{char.name}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start gap-4">
          {/* Character Identity Card / Avatar */}
          <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-1.5 shrink-0 w-full sm:w-56 border-b sm:border-b-0 sm:border-r border-white/10 pb-3 sm:pb-0 sm:pr-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 border flex items-center justify-center shrink-0 ${character.avatarBg}`}
              >
                <IconComponent className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-f1-wide font-black text-xs text-white uppercase tracking-wider">
                  {character.name}
                </span>
                <span className="text-[10px] font-f1-mono text-zinc-400 line-clamp-1">
                  {character.role}
                </span>
              </div>
            </div>

            <div className="mt-1 flex flex-wrap gap-1">
              <span
                className={`text-[9px] font-f1-mono font-bold px-1.5 py-0.5 border uppercase tracking-wider ${character.badgeColor}`}
              >
                {character.badge}
              </span>
            </div>

            {/* Radio Wave Graphic Indicator */}
            <div className="hidden sm:flex items-center gap-1 mt-2 text-zinc-500">
              <Volume2 className="w-3 h-3 text-[#E10600]" />
              <div className="flex items-center gap-0.5 h-3">
                <span className="w-0.5 h-1.5 bg-[#E10600] animate-pulse" />
                <span className="w-0.5 h-3 bg-[#E10600]/80 animate-pulse delay-75" />
                <span className="w-0.5 h-2 bg-[#E10600]/60 animate-pulse delay-150" />
                <span className="w-0.5 h-2.5 bg-[#E10600] animate-pulse" />
              </div>
              <span className="text-[9px] font-f1-mono text-zinc-500 tracking-wider">ENCRYPTED</span>
            </div>
          </div>

          {/* Dialogue Content Canvas */}
          <div className="flex-1 space-y-3 min-w-0">
            {activeMsg.prefix && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-f1-mono font-bold text-[#E10600] tracking-widest uppercase">
                  {activeMsg.prefix}
                </span>
                <span className="h-px flex-1 bg-white/5" />
              </div>
            )}

            <div className="relative pl-3 border-l-2 border-[#E10600]">
              <p className="text-sm font-sans text-zinc-200 leading-relaxed italic">
                "{activeMsg.quote}"
              </p>
            </div>

            {/* Technical Bullet Points (if any) */}
            {activeMsg.technicalDetails && activeMsg.technicalDetails.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 font-f1-mono text-xs">
                {activeMsg.technicalDetails.map((detail, dIdx) => (
                  <div
                    key={dIdx}
                    className="flex items-start gap-2 p-2 bg-[#101018] border border-white/5 text-zinc-300"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-[#E10600] shrink-0 mt-0.5" />
                    <span className="text-[11px] leading-tight">{detail}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Alert Banner (if provided) */}
            {activeMsg.alert && (
              <div
                className={`p-2.5 border text-xs font-f1-mono flex items-center gap-2.5 ${
                  activeMsg.alert.type === 'danger'
                    ? 'border-red-500/60 bg-red-950/40 text-red-300'
                    : activeMsg.alert.type === 'warning'
                    ? 'border-amber-500/60 bg-amber-950/40 text-amber-300'
                    : activeMsg.alert.type === 'success'
                    ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-300'
                    : 'border-cyan-500/60 bg-cyan-950/40 text-cyan-300'
                }`}
              >
                {activeMsg.alert.type === 'danger' || activeMsg.alert.type === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                )}
                <span className="leading-tight">{activeMsg.alert.text}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
