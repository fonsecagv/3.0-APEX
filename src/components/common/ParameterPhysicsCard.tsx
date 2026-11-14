import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { PARAMETER_PHYSICS_CARDS, PHYSICS_PHENOMENA_CATALOG } from '../../data/physicsDatabase';
import { DataClassification } from '../../types/physics';

interface ParameterPhysicsCardProps {
  cardKey: keyof typeof PARAMETER_PHYSICS_CARDS;
  configuredSummary: string;
  simulatedSummary?: string;
  classification?: DataClassification;
  isSimulationStale?: boolean;
}

export const ParameterPhysicsCard: React.FC<ParameterPhysicsCardProps> = ({
  cardKey,
  configuredSummary,
  simulatedSummary,
  classification = 'Estimado',
  isSimulationStale = true
}) => {
  const [expanded, setExpanded] = useState(false);
  const meta = PARAMETER_PHYSICS_CARDS[cardKey];
  if (!meta) return null;

  const phenomenon = PHYSICS_PHENOMENA_CATALOG.find(p => p.id === meta.phenomenonId);

  return (
    <div className="bg-[#12121A] border border-white/10 text-xs font-f1-mono">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(prev => !prev)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded(prev => !prev);
          }
        }}
        className="w-full px-3 py-2 flex items-center justify-between gap-2 cursor-pointer hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="text-[11px] font-bold text-zinc-200 truncate">
            {meta.title}
          </span>
          <span className="text-[9px] px-1.5 py-0.5 border border-white/10 text-zinc-400 shrink-0">
            {meta.phenomenonId}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-zinc-400 hidden sm:inline">
            {expanded ? 'Ocultar física' : 'Fundamentação física'}
          </span>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-2 border-t border-white/10 space-y-2.5 bg-[#15151E]">
          {/* Configured vs Simulated separation (Regra 1) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="bg-[#1C1C26] p-2 border border-white/5">
              <span className="text-[9px] text-zinc-400 uppercase block font-bold">
                PARÂMETRO CONFIGURADO ({meta.parameterName})
              </span>
              <span className="text-white font-bold">{configuredSummary}</span>
            </div>

            <div className="bg-[#1C1C26] p-2 border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-zinc-400 uppercase font-bold">
                  RESPOSTA DO MODELO ({classification.toUpperCase()})
                </span>
                {isSimulationStale ? (
                  <span className="text-[9px] text-amber-400 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    Pendente CFD/FEA
                  </span>
                ) : (
                  <span className="text-[9px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Simulado
                  </span>
                )}
              </div>
              <span className="text-cyan-300 font-bold block mt-0.5">
                {simulatedSummary || meta.analysisPendingText}
              </span>
            </div>
          </div>

          {/* Fundamentação Física */}
          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">
              Fundamentação física
            </span>
            <ul className="space-y-0.5 text-[11px] text-zinc-300 list-disc list-inside">
              {meta.fundamentacaoFisica.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
            {phenomenon && (
              <div className="mt-1.5 px-2 py-1 bg-[#1C1C26] border border-white/5 text-[10px] text-zinc-300">
                <span className="text-zinc-500 uppercase">Equação base ({phenomenon.units}): </span>
                <span className="text-amber-300 font-bold">{phenomenon.equations}</span>
              </div>
            )}
          </div>

          {/* Análise de Engenharia / Limitação */}
          <div className="bg-amber-950/20 border border-amber-500/25 p-2 text-[11px] text-amber-200/90 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold uppercase text-[10px] text-amber-300 block">
                Análise de engenharia & limitações
              </span>
              <span>{meta.exploratoryNote}</span>
            </div>
          </div>

          {/* Dependências */}
          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">
              Dependências acopladas
            </span>
            <div className="flex flex-wrap gap-1.5">
              {meta.dependencies.map(dep => (
                <span
                  key={dep}
                  className="text-[10px] px-2 py-0.5 bg-[#1C1C26] border border-white/10 text-zinc-300"
                >
                  {dep}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
