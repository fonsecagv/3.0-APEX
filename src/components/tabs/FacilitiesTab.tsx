import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { F1TabBucket } from '../brand/F1Logo';
import { getFacilityRpgSummary } from '../../engine/rpgProgressionEngine';
import {
  Building2,
  Wind,
  Cpu,
  Wrench,
  Monitor,
  Radio,
  Clock,
  ArrowUpRight,
  Truck,
  FileSignature,
  ArrowRight,
  Lock,
  Users,
  CloudRain,
  Landmark,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

const LEVEL_TIER_NAMES: Record<number, string> = {
  1: 'Básico',
  2: 'Intermediário',
  3: 'Avançado',
  4: 'Alta Performance',
  5: 'Elite'
};

type FacilityFilter = 'all' | 'desenvolvimento' | 'pessoal' | 'operacoes' | 'pu_works';

export const FacilitiesTab: React.FC = () => {
  const {
    facilities,
    upgradeFacility,
    maintainFacility,
    financials,
    playerTeam,
    puClients,
    maxPuClientsCapacity,
    setActiveTab,
    playRadioSound,
    modificadorTempoManufatura,
    modificadorTempoPeD
  } = useGame();

  const [categoryFilter, setCategoryFilter] = useState<FacilityFilter>('all');

  const isWorksTeam =
    playerTeam?.isManufacturer ||
    playerTeam?.engineOrigin === 'bought_factory' ||
    playerTeam?.engineOrigin === 'phoenix';

  const activeClientsCount = puClients?.filter(c => c.status === 'active').length || 0;
  const capacityPct = Math.min(100, Math.round((activeClientsCount / maxPuClientsCapacity) * 100));
  const isCapacityFull = activeClientsCount >= maxPuClientsCapacity;

  const totalAnnualUpkeep = facilities.reduce((sum, f) => sum + f.annualUpkeep, 0);

  const visibleFacilities = facilities.filter(f => {
    if (categoryFilter === 'all') return true;
    return f.category === categoryFilter;
  });

  const getFacilityIcon = (id: string) => {
    switch (id) {
      case 'fac_wind_tunnel': return <Wind className="w-5 h-5 text-[#E10600]" />;
      case 'fac_cfd': return <Cpu className="w-5 h-5 text-blue-400" />;
      case 'fac_design_office': return <Building2 className="w-5 h-5 text-purple-400" />;
      case 'fac_manufacturing':
      case 'fac_parts_test':
      case 'fac_suspension_sim':
        return <Wrench className="w-5 h-5 text-amber-400" />;
      case 'fac_simulator': return <Monitor className="w-5 h-5 text-emerald-400" />;
      case 'fac_team_hq':
      case 'fac_scouting':
        return <Users className="w-5 h-5 text-cyan-400" />;
      case 'fac_weather': return <CloudRain className="w-5 h-5 text-sky-400" />;
      case 'fac_boardroom':
      case 'fac_hospitality':
      case 'fac_memorabilia':
      case 'fac_tourism':
        return <Landmark className="w-5 h-5 text-zinc-300" />;
      case 'fac_pu_factory': return <Cpu className="w-5 h-5 text-[#E10600]" />;
      default: return <Radio className="w-5 h-5 text-cyan-400" />;
    }
  };

  const getCategoryLabel = (cat?: string) => {
    switch (cat) {
      case 'desenvolvimento': return 'Desenvolvimento';
      case 'pessoal': return 'Pessoal';
      case 'operacoes': return 'Operações';
      case 'pu_works': return 'Montadora Works';
      default: return 'Infraestrutura';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview & Upkeep Header */}
      <div className="bg-[#1C1C26] border border-white/10 p-5 f1-pattern-micro-grid">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-f1-mono text-[#E10600] font-bold tracking-widest uppercase">
              GDD SEÇÕES 9–10 · CAMPUS INDUSTRIAL ({facilities.length} INSTALAÇÕES ATIVAS)
            </span>
            <h1 className="font-f1-wide font-black text-xl lg:text-2xl text-white uppercase mt-0.5">
              Instalações, Desenvolvimento & Operações
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
              Todas as equipes iniciam com as 15 instalações comuns no Nível 1 (Básico). Montadoras Works possuem a 16ª instalação exclusiva (Fábrica de PU). Evolua capacidade, qualidade, produtividade e tecnologia mantendo a conservação em dia.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-[#15151E] p-3 border border-white/5 text-right">
              <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">CUSTO OPERACIONAL</span>
              <span className="text-sm font-f1-mono font-bold text-white tabular-nums">
                ${(totalAnnualUpkeep / 1000000).toFixed(1)}M / ANO
              </span>
            </div>
            <div className="bg-[#15151E] p-3 border border-white/5 text-right">
              <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">SALDO EM CAIXA</span>
              <span className="text-sm font-f1-mono font-bold text-emerald-400 tabular-nums">
                ${(financials.bankBalance / 1000000).toFixed(1)}M
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Decentralized Logistics Notice */}
      <div className="bg-[#1C1C26] border border-white/10 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Truck className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <span className="font-f1-wide font-bold text-xs text-white uppercase">
              TOPOLOGIA LOGÍSTICA: {playerTeam.location} ➔ FÁBRICA PU: {playerTeam.engineLocation}
            </span>
            <p className="text-xs text-zinc-400 mt-0.5">
              Latência de integração chassi–PU controlada. Manutenção preventiva mantém erro de correlação dentro da faixa nominal.
            </p>
          </div>
        </div>
        <span className="text-[10px] font-f1-mono bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 px-2.5 py-1">
          LOGÍSTICA NOMINAL
        </span>
      </div>

      {/* Works Team PU Production & Client Supply */}
      {isWorksTeam ? (
        <div className="bg-[#1C1C26] border-2 border-amber-500/40 p-5 f1-container-bucket space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-950/60 border border-amber-500/50 flex items-center justify-center shrink-0">
                <FileSignature className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-f1-mono text-amber-400 font-bold uppercase tracking-widest block">
                    PROGRAMA OFICIAL DE MONTADORA (WORKS TEAM)
                  </span>
                  <span className="text-[9px] font-f1-mono bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 font-bold">
                    16ª INSTALAÇÃO HOMOLOGADA
                  </span>
                </div>
                <h3 className="font-f1-wide font-black text-sm lg:text-base text-white uppercase mt-0.5">
                  Capacidade de Produção de PU & Clientes
                </h3>
              </div>
            </div>

            <button
              onClick={() => {
                playRadioSound();
                setActiveTab('pu_clients');
              }}
              className="px-4 py-2.5 bg-[#E10600] hover:bg-[#c20500] text-white font-f1-wide font-black text-xs uppercase tracking-wider f1-tab-chamfer transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer shrink-0"
            >
              <FileSignature className="w-4 h-4" />
              <span>Departamento de Clientes</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-f1-mono">
              <span className="text-zinc-400 font-bold uppercase">
                Capacidade de Manufatura de PU: <strong className={isCapacityFull ? 'text-red-400' : 'text-amber-400'}>{activeClientsCount} / {maxPuClientsCapacity} Clientes Ativos ({capacityPct}%)</strong>
              </span>
              <span className="text-zinc-400">
                Gargalo Fabril: <strong className="text-cyan-400">{activeClientsCount === 0 ? 'Normal (1.0x)' : activeClientsCount === 1 ? '+50% Tempo P&D (1.5x)' : 'Dobro do Tempo (2.0x)'}</strong>
              </span>
            </div>

            <div className="w-full bg-zinc-900 h-2.5 border border-white/10 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  activeClientsCount === 0
                    ? 'bg-emerald-500'
                    : activeClientsCount === 1
                    ? 'bg-amber-400'
                    : 'bg-gradient-to-r from-amber-500 to-red-500'
                }`}
                style={{ width: `${capacityPct}%` }}
              />
            </div>

            {isCapacityFull ? (
              <p className="text-[11px] font-f1-mono text-red-400 font-bold">
                Capacidade da fábrica esgotada (100%). Expanda as instalações para aceitar novos clientes.
              </p>
            ) : (
              <p className="text-[11px] font-f1-mono text-zinc-400">
                A fábrica possui {maxPuClientsCapacity - activeClientsCount} slot(s) de fornecimento disponível(is). Cada cliente gera receita comercial livre do Teto de Gastos.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-[#1C1C26] border border-white/10 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-zinc-500" />
            </div>
            <div>
              <span className="font-f1-wide font-bold text-xs text-white uppercase block">
                FÁBRICA DE PU PARA CLIENTES (EXCLUSIVA DE MONTADORAS WORKS)
              </span>
              <p className="text-xs text-zinc-400 mt-0.5">
                Sua equipe é cliente da fornecedora {playerTeam.engineSupplier} e opera as 15 instalações comuns.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-f1-mono bg-zinc-800 text-zinc-400 px-2 py-1 font-bold">
            CLIENT TEAM (15)
          </span>
        </div>
      )}

      {/* Category Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 bg-[#1C1C26] border border-white/10 p-2">
        {[
          { id: 'all' as FacilityFilter, label: `Todas (${facilities.length})` },
          { id: 'desenvolvimento' as FacilityFilter, label: 'Desenvolvimento (6)' },
          { id: 'pessoal' as FacilityFilter, label: 'Pessoal (3)' },
          { id: 'operacoes' as FacilityFilter, label: 'Operações (6)' },
          ...(isWorksTeam ? [{ id: 'pu_works' as FacilityFilter, label: 'Fábrica PU Works (1)' }] : [])
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setCategoryFilter(tab.id)}
            className={`px-3 py-1.5 text-xs font-f1-mono uppercase font-bold transition-colors cursor-pointer ${
              categoryFilter === tab.id
                ? 'bg-[#E10600] text-white'
                : 'bg-[#15151E] text-zinc-400 hover:text-white border border-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Facilities Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleFacilities.map(fac => {
          const maxTier = fac.capacidadeExpansao ?? 5;
          const isMaxLevel = fac.level >= maxTier;
          const isUpgrading = fac.isUpgrading;
          const canAfford = financials.bankBalance >= fac.upgradeCost;
          const conservation = fac.conservacaoPct ?? 96;
          const maintenanceCost = Math.round(fac.annualUpkeep * 0.25);
          const tierName = LEVEL_TIER_NAMES[fac.level] || `Nível ${fac.level}`;

          return (
            <F1TabBucket
              key={fac.id}
              title={fac.name}
              badge={`NV ${fac.level}/${maxTier} · ${tierName.toUpperCase()}`}
            >
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-[#15151E] border border-white/5 shrink-0">
                    {getFacilityIcon(fac.id)}
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-f1-mono uppercase px-1.5 py-0.5 bg-white/5 border border-white/10 text-zinc-300 inline-block">
                      {getCategoryLabel(fac.category)}
                    </span>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {fac.description}
                    </p>
                    <div className="text-[11px] font-f1-mono text-emerald-400 font-bold">
                      {fac.effect}
                    </div>
                  </div>
                </div>

                {fac.id === 'fac_manufacturing' && (
                  <div className="p-2 bg-[#15151E] border border-white/5 space-y-1">
                    <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block font-bold">
                      FÓRMULA DE TEMPO DE PRODUÇÃO:
                    </span>
                    <div className="text-[11px] font-f1-mono text-white font-bold">
                      TempoFinal = TempoBase * {modificadorTempoManufatura.toFixed(2)} * {modificadorTempoPeD.toFixed(2)}
                    </div>
                  </div>
                )}

                {(() => {
                  const rpgSummary = getFacilityRpgSummary(fac.id, fac.level);
                  if (!rpgSummary) return null;
                  return (
                    <div
                      className={`p-2.5 border text-[11px] font-f1-mono leading-relaxed ${
                        fac.id === 'fac_scouting'
                          ? 'bg-zinc-900/70 border-white/10 text-zinc-300'
                          : 'bg-cyan-950/25 border-cyan-500/35 text-cyan-200'
                      }`}
                    >
                      <span className="text-[9px] font-bold uppercase tracking-wider block mb-0.5 text-cyan-400">
                        {fac.id === 'fac_scouting' ? 'ESCOPO DE MERCADO' : 'IMPACTO DE PROGRESSÃO (RPG)'}
                      </span>
                      {rpgSummary}
                    </div>
                  );
                })()}

                {/* GDD Sec. 10 Metrics (Capacidade, Qualidade, Produtividade, Tecnologia, Conservação) */}
                <div className="grid grid-cols-2 gap-1.5 bg-[#15151E] p-2.5 border border-white/5 text-[10px] font-f1-mono tabular-nums">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Capacidade:</span>
                    <span className="text-white font-bold">{fac.capacidade ?? 40 + fac.level * 10}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Qualidade:</span>
                    <span className="text-white font-bold">{fac.qualidade ?? 42 + fac.level * 10}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Produtividade:</span>
                    <span className="text-cyan-300 font-bold">{fac.produtividade ?? 40 + fac.level * 10}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Tecnologia:</span>
                    <span className="text-cyan-300 font-bold">{fac.tecnologia ?? 38 + fac.level * 11}</span>
                  </div>
                </div>

                {/* Conservation & Maintenance Status */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-f1-mono">
                    <span className="text-zinc-400 flex items-center gap-1">
                      {fac.manutencaoNecessaria ? (
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                      ) : (
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      )}
                      CONSERVAÇÃO
                    </span>
                    <span className={conservation < 75 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                      {conservation.toFixed(0)}% {fac.manutencaoNecessaria ? '· MANUTENÇÃO RECOMENDADA' : ''}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full ${conservation < 75 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, conservation)}%` }}
                    />
                  </div>
                </div>

                {/* Level Progress Indicator (1-5) */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-f1-mono text-zinc-400">
                    <span>EXPANSÃO (BÁSICO ➔ ELITE)</span>
                    <span className="text-white font-bold">{fac.level} / {maxTier}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1 h-2">
                    {[1, 2, 3, 4, 5].map(lvl => (
                      <div
                        key={lvl}
                        className={`h-full ${
                          lvl <= fac.level
                            ? 'bg-[#E10600]'
                            : lvl === fac.level + 1 && isUpgrading
                            ? 'bg-amber-400'
                            : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Upkeep, Maintenance & Upgrade action */}
                <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs font-f1-mono">
                  <div>
                    <span className="text-[10px] text-zinc-500 block">CUSTO ANUAL</span>
                    <span className="text-zinc-300 tabular-nums">
                      ${(fac.annualUpkeep / 1000000).toFixed(1)}M/ano
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {conservation < 92 && (
                      <button
                        type="button"
                        onClick={() => maintainFacility(fac.id)}
                        disabled={financials.bankBalance < maintenanceCost}
                        className="px-2.5 py-1.5 bg-[#232330] hover:bg-emerald-700 disabled:opacity-40 text-white text-[10px] font-bold uppercase cursor-pointer"
                      >
                        Manter (${(maintenanceCost / 1000000).toFixed(2)}M)
                      </button>
                    )}

                    {isMaxLevel ? (
                      <span className="text-[11px] font-f1-wide text-zinc-500 uppercase font-bold">
                        NÍVEL ELITE
                      </span>
                    ) : isUpgrading ? (
                      <span className="text-[11px] font-f1-wide text-amber-400 uppercase font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {fac.weeksRemaining} SEM
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => upgradeFacility(fac.id)}
                        disabled={!canAfford}
                        className="px-3 py-1.5 bg-[#E10600] hover:bg-[#c20500] disabled:opacity-40 text-white font-f1-wide font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Expandir (${(fac.upgradeCost / 1000000).toFixed(1)}M)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </F1TabBucket>
          );
        })}
      </div>
    </div>
  );
};
