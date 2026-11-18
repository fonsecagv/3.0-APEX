import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { F1TabBucket } from '../brand/F1Logo';
import { Driver, StaffMember } from '../../types/f1';
import {
  Users,
  Award,
  Heart,
  TrendingUp,
  Shield,
  Briefcase,
  Star,
  DollarSign,
  ChevronRight,
  Flame,
  UserCheck,
  Sparkles,
  Battery,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PRINCIPAL_BACKGROUNDS } from '../../data/principalBackgroundsData';
import { evaluatePitAndGarageOperations } from '../../engine/simulationEngine';
import { PersonAvatar } from '../common/PersonAvatar';
import type { EngineeringAvatarRole } from '../../engine/engineeringFeedbackEngine';
import {
  computeDriverAttributeTrends,
  getDriverRpgLevel,
  getDriverXpProgress,
  getStaffFacilityLimitFeedback,
  getStaffMaxLevelForCentral,
  getStaffRpgLevel,
  getStaffXpProgress,
  type AttributeTrend,
} from '../../engine/rpgProgressionEngine';

export const TeamTab: React.FC = () => {
  const {
    drivers,
    staff,
    facilities,
    playerTeam,
    principalProfile,
    signDriver,
    dismissDriverAndPromote,
    promoteAffiliateToFP1,
    selectedAffiliateInFP1,
    financials,
    organizarEventoMarketing,
    baseDeFas,
    receitaMarketing
  } = useGame();

  const activeBg = PRINCIPAL_BACKGROUNDS.find(b => b.id === principalProfile.background) || PRINCIPAL_BACKGROUNDS[0];

  const starter1 =
    drivers.find(d => d.id === playerTeam.drivers?.[0]) ||
    drivers.find(d => d.teamId === playerTeam.id && !d.isAffiliate) ||
    drivers[0];
  const starter2 =
    drivers.find(d => d.id === playerTeam.drivers?.[1]) ||
    drivers.filter(d => d.teamId === playerTeam.id && !d.isAffiliate && d.id !== starter1?.id)[0];
  const reserveDriver =
    (playerTeam.affiliateDriverId ? drivers.find(d => d.id === playerTeam.affiliateDriverId) : undefined) ||
    drivers.find(d => d.teamId === playerTeam.id && d.isAffiliate);

  const playerDrivers = [starter1, starter2].filter((d): d is Driver => Boolean(d));
  const rosterEntries: Array<{ roleLabel: string; isReserve: boolean; driver: Driver }> = [
    ...(starter1 ? [{ roleLabel: 'Titular 1', isReserve: false, driver: starter1 }] : []),
    ...(starter2 ? [{ roleLabel: 'Titular 2', isReserve: false, driver: starter2 }] : []),
    ...(reserveDriver ? [{ roleLabel: 'Piloto Reserva', isReserve: true, driver: reserveDriver }] : []),
  ];

  const [selectedDriver, setSelectedDriver] = useState<Driver>(starter1 || drivers[0]);
  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'academy' | 'staff' | 'market'>('roster');

  // Marketing Modal State
  const [showMarketingModal, setShowMarketingModal] = useState<boolean>(false);
  const [marketingSelectedDriverId, setMarketingSelectedDriverId] = useState<string>('');
  const [marketingFeedback, setMarketingFeedback] = useState<string | null>(null);

  const activeSelectedDriver =
    rosterEntries.find(e => e.driver.id === selectedDriver.id)?.driver ||
    playerDrivers[0] ||
    selectedDriver;
  const affiliateDrivers = drivers.filter(d => d.isAffiliate);
  const marketDrivers = drivers.filter(d => d.teamId !== playerTeam.id && !d.isAffiliate);
  const [replacingDriverId, setReplacingDriverId] = useState<string | null>(null);

  const teamCentralLevel = facilities.find(f => f.id === 'fac_team_hq')?.level || 1;
  const simFacilityLevel = facilities.find(f => f.id === 'fac_simulator')?.level || 1;
  const centralCapInfo = getStaffMaxLevelForCentral(teamCentralLevel);

  const matchesStaffRoleAlias = (staffRole: StaffMember['role'], targetRole: StaffMember['role']) => {
    if (staffRole === targetRole) return true;
    if (targetRole === 'sporting_director' && staffRole === 'head_management') return true;
    if (targetRole === 'chief_mechanic' && staffRole === 'head_mechanics') return true;
    return false;
  };

  const resolveTeamChief = (targetRole: StaffMember['role'], teamNamedMember?: string) => {
    const byTeamField = teamNamedMember
      ? staff.find(s => matchesStaffRoleAlias(s.role, targetRole) && s.name === teamNamedMember)
      : undefined;
    const byCurrentTeam = staff.find(
      s =>
        matchesStaffRoleAlias(s.role, targetRole) &&
        (s.currentTeam === playerTeam.name ||
          (playerTeam.name === 'APEX Grand Prix Team' && s.currentTeam === 'APEX Grand Prix Team'))
    );
    const byStarter = staff.find(
      s =>
        matchesStaffRoleAlias(s.role, targetRole) &&
        (s.id.startsWith('staff_head') || s.id === 'staff_sporting_dir' || s.id === 'staff_chief_mechanic')
    );
    return byTeamField || byCurrentTeam || byStarter || staff.find(s => matchesStaffRoleAlias(s.role, targetRole));
  };

  const diretoriaSummary = (
    [
      { role: 'head_aero', label: 'Chefe de Aero', named: playerTeam.headOfAero },
      { role: 'head_pu', label: 'Chefe de PU', named: playerTeam.headOfPowerUnit },
      { role: 'sporting_director', label: 'Chefe de Gerenciamento', named: playerTeam.sportingDirector },
      { role: 'chief_mechanic', label: 'Chefe Mecânico', named: playerTeam.chiefMechanic },
    ] as const
  ).map(item => ({
    ...item,
    member: resolveTeamChief(item.role, item.named),
  }));

  const renderTrendBadge = (trend?: AttributeTrend) => {
    if (trend === 'up') {
      return (
        <span className="text-emerald-400 font-black ml-1.5" title="Em evolução">
          ↑
        </span>
      );
    }
    if (trend === 'down') {
      return (
        <span className="text-red-400 font-black ml-1.5" title="Declínio natural / baixa moral">
          ↓
        </span>
      );
    }
    return (
      <span className="text-zinc-500 font-bold ml-1.5" title="Estável">
        →
      </span>
    );
  };

  const getMentalityColor = (m: number) => {
    if (m >= 85) return 'text-emerald-400';
    if (m >= 70) return 'text-cyan-400';
    if (m >= 50) return 'text-amber-400';
    return 'text-[#E10600]';
  };

  const getMentalityLabel = (m: number) => {
    if (m >= 85) return 'ELATED / MAXIMUM MORALE';
    if (m >= 70) return 'CONFIDENT';
    if (m >= 50) return 'RESTLESS';
    return 'DEMORALIZED / POACHING RISK';
  };

  const getTrustStatus = (rawTrust?: number) => {
    const val = Math.max(0, Math.min(100, Math.round(rawTrust ?? 75)));
    if (val === 0) {
      return {
        val,
        label: 'CRISE DE CONFIANÇA (VAZAMENTO)',
        textCls: 'text-red-400',
        barCls: 'bg-[#E10600]',
      };
    }
    if (val < 40) {
      return {
        val,
        label: 'DESGASTADA / CRISE',
        textCls: 'text-red-400',
        barCls: 'bg-[#E10600]',
      };
    }
    if (val < 70) {
      return {
        val,
        label: 'ESTÁVEL',
        textCls: 'text-amber-300',
        barCls: 'bg-amber-400',
      };
    }
    return {
      val,
      label: 'CONFIANÇA ALTA',
      textCls: 'text-emerald-400',
      barCls: 'bg-emerald-500',
    };
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-nav */}
      <div className="bg-[#1C1C26] border border-white/10 p-5 f1-pattern-micro-grid">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-f1-mono text-[#E10600] font-bold tracking-widest uppercase">
              SECTION 5: CAPITAL HUMANO & MENTALIDADE (PPL)
            </span>
            <h1 className="font-f1-wide font-black text-xl lg:text-2xl text-white uppercase mt-0.5">
              Personnel & Driver Academy
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
              Manage pilot contracts, key technical directors, and F2/F3 development affiliates. 
              Mentality (0-100) dynamically dictates on-track pace, error probability, and rival poaching resistance.
            </p>
          </div>

          {/* Sub-tab segmented buttons */}
          <div className="flex items-center gap-1 p-1 bg-[#15151E] border border-white/10 shrink-0">
            <button
              onClick={() => setActiveSubTab('roster')}
              className={`px-3 py-1.5 text-xs font-f1-wide uppercase tracking-wider transition-colors ${
                activeSubTab === 'roster' ? 'bg-[#E10600] text-white font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Race Roster
            </button>
            <button
              onClick={() => setActiveSubTab('academy')}
              className={`px-3 py-1.5 text-xs font-f1-wide uppercase tracking-wider transition-colors ${
                activeSubTab === 'academy' ? 'bg-[#E10600] text-white font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Academy (F2/F3)
            </button>
            <button
              onClick={() => setActiveSubTab('staff')}
              className={`px-3 py-1.5 text-xs font-f1-wide uppercase tracking-wider transition-colors ${
                activeSubTab === 'staff' ? 'bg-[#E10600] text-white font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Technical Staff
            </button>
            <button
              onClick={() => setActiveSubTab('market')}
              className={`px-3 py-1.5 text-xs font-f1-wide uppercase tracking-wider transition-colors ${
                activeSubTab === 'market' ? 'bg-[#E10600] text-white font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Transfer Market
            </button>
          </div>
        </div>
      </div>

      {/* Principal DNA & Leadership Modifiers Active Banner */}
      <div className="bg-[#1C1C26] border border-white/10 p-4 space-y-3 f1-container-roof">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#E10600] inline-block shrink-0" />
            <span className="text-xs font-f1-wide font-black text-white uppercase">
              DNA de Comando: {principalProfile.name} · {activeBg.name}
            </span>
          </div>
          <span className="text-[10px] font-f1-mono text-zinc-300 bg-white/5 border border-white/10 px-2 py-0.5 uppercase tracking-wider font-bold">
            {activeBg.badge}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-f1-mono">
          {/* Active Bonus Tag in Green */}
          <div className="bg-emerald-950/40 border border-emerald-500/40 p-2.5 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[10px] uppercase tracking-wider">
              <span className="w-2 h-2 bg-emerald-400 inline-block shrink-0" />
              <span>BÔNUS ATIVO</span>
            </div>
            <p className="font-bold text-emerald-300 leading-snug">
              {activeBg.bonus}
            </p>
          </div>

          {/* Active Onus Tag in Red */}
          <div className="bg-red-950/40 border border-red-500/40 p-2.5 space-y-1">
            <div className="flex items-center gap-1.5 text-red-400 font-bold text-[10px] uppercase tracking-wider">
              <span className="w-2 h-2 bg-red-400 inline-block shrink-0" />
              <span>ÔNUS ATIVO</span>
            </div>
            <p className="font-bold text-red-300 leading-snug">
              {activeBg.onus}
            </p>
          </div>
        </div>

        <p className="text-[11px] text-zinc-400 font-light leading-relaxed border-t border-white/5 pt-2">
          {activeBg.description}
        </p>
      </div>

      {/* SUB-TAB: RACE ROSTER */}
      {activeSubTab === 'roster' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Driver Cards (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-f1-wide font-bold text-white uppercase block">
                PRIMARY DRIVER PAIRING
              </span>
              <button
                onClick={() => {
                  setMarketingSelectedDriverId(playerDrivers[0]?.id || '');
                  setShowMarketingModal(true);
                  setMarketingFeedback(null);
                }}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-f1-wide font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow transition-transform hover:scale-[1.02]"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Organizar Evento de Marketing
              </button>
            </div>

            {rosterEntries.map(({ roleLabel, isReserve, driver }, idx) => {
              const isSelected = activeSelectedDriver.id === driver.id;
              const drvLevel = getDriverRpgLevel(driver);
              const drvXp = getDriverXpProgress(driver);
              const reserveReady = isReserve && (driver.attributes.pace >= 72 || drvLevel >= 3);

              return (
                <div
                  key={`${roleLabel}_${driver.id}`}
                  onClick={() => setSelectedDriver(driver)}
                  className={`p-4 border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#232330] border-[#E10600] shadow-md'
                      : 'bg-[#1C1C26] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-[#15151E] border border-white/10 flex items-center justify-center font-f1-wide font-black text-lg text-white shrink-0">
                        {driver.number}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`text-[9px] font-f1-mono px-1.5 py-0.5 font-bold uppercase border ${
                              isReserve
                                ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                                : 'bg-[#E10600]/20 border-[#E10600]/50 text-white'
                            }`}
                          >
                            {roleLabel}
                          </span>
                          <span className="text-[9px] font-f1-mono px-1.5 py-0.5 bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold">
                            NV. {drvLevel}/10
                          </span>
                        </div>
                        <div className="font-f1-wide font-black text-sm text-white uppercase truncate mt-0.5">
                          {driver.name}
                        </div>
                        <div className="text-[11px] font-f1-mono text-zinc-400">
                          {driver.nationality} · {driver.age} anos · {isReserve ? (driver.series || 'RESERVA') : `Carro #${idx + 1}`}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">PACE</span>
                      <span className="font-f1-wide font-black text-lg text-[#E10600] tabular-nums">
                        {driver.attributes.pace}
                      </span>
                    </div>
                  </div>

                  {/* Driver XP & Reserve Readiness */}
                  <div className="mt-3 space-y-1.5 bg-[#15151E] p-2 border border-white/5">
                    <div className="flex justify-between items-center text-[10px] font-f1-mono tabular-nums">
                      <span className="text-zinc-400 uppercase">Experiência (XP) · Simulador Nv.{simFacilityLevel}</span>
                      <span className="text-cyan-300 font-bold">
                        {drvXp}/100 XP {driver.lastXpDelta ? `(+${driver.lastXpDelta})` : ''}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-cyan-400" style={{ width: `${drvXp}%` }} />
                    </div>
                    {isReserve && (
                      <div className="pt-1 flex items-center justify-between gap-2">
                        <span
                          className={`text-[9px] font-f1-mono font-bold px-1.5 py-0.5 border ${
                            reserveReady
                              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                              : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                          }`}
                        >
                          {reserveReady ? '[ PRONTO PARA SUBSTITUIR ]' : '[ EM DESENVOLVIMENTO NO SIMULADOR ]'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            promoteAffiliateToFP1(driver.id);
                          }}
                          className="text-[9px] font-f1-mono px-2 py-0.5 bg-[#252533] hover:bg-cyan-700 border border-white/10 text-white uppercase font-bold cursor-pointer"
                        >
                          Treino TL1 (+XP)
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Mentality & Trust bars */}
                  <div className="mt-4 pt-3 border-t border-white/5 space-y-2.5">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-f1-mono">
                        <span className="text-zinc-400">MENTALITY MORALE</span>
                        <span className={`font-bold tabular-nums ${getMentalityColor(driver.mentality)}`}>
                          {driver.mentality}% ({getMentalityLabel(driver.mentality)})
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-[#E10600]"
                          style={{ width: `${driver.mentality}%` }}
                        />
                      </div>
                    </div>

                    {(() => {
                      const trustMeta = getTrustStatus(driver.trust);
                      return (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-f1-mono tabular-nums">
                            <span className="text-zinc-400 uppercase">Confiança / Escuta Ativa</span>
                            <span className={`font-bold ${trustMeta.textCls}`}>
                              {trustMeta.val}/100 ({trustMeta.label})
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-white/10 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${trustMeta.barCls}`}
                              style={{ width: `${trustMeta.val}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Marketability & Fadiga metrics */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-f1-mono bg-[#15151E] p-2 border border-white/5">
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase">MARKETABILITY</span>
                      <span className="text-amber-400 font-bold font-f1-wide">{driver.marketability || 70} / 100</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase">FADIGA</span>
                      <span className={`font-bold font-f1-wide ${(driver.fatigue || 0) > 70 ? 'text-red-400' : (driver.fatigue || 0) > 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {driver.fatigue || 0}%
                      </span>
                    </div>
                  </div>

                  {/* Contract info */}
                  <div className="mt-3 flex items-center justify-between text-[11px] font-f1-mono text-zinc-400">
                    <span>${(driver.salary / 1000000).toFixed(1)}M / year</span>
                    <span>{driver.contractYearsRemaining} Years Left</span>
                    <span>Buyout: ${(driver.buyoutClause / 1000000).toFixed(1)}M</span>
                  </div>

                  {/* In-season Driver Dismissal & Replacement (only for race starters) */}
                  {!isReserve && (
                  <div className="mt-3 pt-2.5 border-t border-white/10">
                    {replacingDriverId === driver.id ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-f1-mono text-amber-300 uppercase font-bold">
                          <span>Escolha quem assume o Carro #{idx + 1}:</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReplacingDriverId(null);
                            }}
                            className="text-zinc-400 hover:text-white cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto">
                          {affiliateDrivers.slice(0, 6).map((cand) => (
                            <button
                              key={cand.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                dismissDriverAndPromote(driver.id, cand.id);
                                setReplacingDriverId(null);
                              }}
                              className="px-2.5 py-1.5 bg-[#15151E] hover:bg-[#E10600]/20 border border-white/10 hover:border-[#E10600] text-left text-[11px] font-f1-mono flex items-center justify-between cursor-pointer"
                            >
                              <span className="text-white font-bold">
                                {cand.name} ({cand.series})
                              </span>
                              <span className="text-emerald-400 font-bold tabular-nums">
                                PACE {cand.attributes.pace} · Promover
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReplacingDriverId(driver.id);
                        }}
                        className="w-full py-1.5 bg-[#15151E] hover:bg-red-950/60 border border-white/10 hover:border-red-500/50 text-[10px] font-f1-mono uppercase text-zinc-300 hover:text-white transition-colors cursor-pointer"
                      >
                        Dispensar Titular & Promover Substituto
                      </button>
                    )}
                  </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Column: Driver Telemetry Profile + Resumo da Diretoria (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Resumo da Diretoria Técnica */}
            <F1TabBucket
              title="RESUMO DA DIRETORIA TÉCNICA (CHEFES CONTRATADOS)"
              badge={`CENTRAL NV.${teamCentralLevel} (TETO STAFF NV.${centralCapInfo.maxStaffLevel})`}
            >
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {diretoriaSummary.map(item => {
                    const stfLvl = item.member ? getStaffRpgLevel(item.member) : 1;
                    return (
                      <div key={item.role} className="bg-[#15151E] border border-white/10 p-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {item.member && (
                            <PersonAvatar
                              role={item.role as EngineeringAvatarRole}
                              name={item.member.name}
                              sizeClass="w-8 h-8"
                              accentColor="#E10600"
                            />
                          )}
                          <div className="min-w-0">
                            <span className="text-[9px] font-f1-mono text-zinc-400 uppercase block">{item.label}</span>
                            <span className="text-xs font-f1-wide font-bold text-white uppercase truncate block">
                              {item.member?.name || 'Cargo Vago'}
                            </span>
                          </div>
                        </div>
                        {item.member && (
                          <div className="text-right font-f1-mono shrink-0">
                            <span className="text-[10px] text-amber-400 font-bold block">{'★'.repeat(stfLvl)}</span>
                            <span className="text-[10px] text-emerald-400 font-bold tabular-nums">OVR {item.member.rating}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('staff')}
                    className="text-[10px] font-f1-mono text-cyan-300 hover:text-white uppercase font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Gerenciar Evolução do Staff Técnico</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </F1TabBucket>

            {(() => {
              const attrTrends = computeDriverAttributeTrends(activeSelectedDriver, simFacilityLevel);
              return (
            <F1TabBucket
              title={`DRIVER TELEMETRY PROFILE: ${activeSelectedDriver.name.toUpperCase()}`}
              badge={`#${activeSelectedDriver.number} · ${activeSelectedDriver.shortCode} · NV.${getDriverRpgLevel(activeSelectedDriver)}`}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-[#15151E] p-2.5 border border-white/5">
                    <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">RITMO / PACE</span>
                    <span className="font-f1-mono font-bold text-sm text-white tabular-nums">
                      {activeSelectedDriver.attributes.pace} / 99
                      {renderTrendBadge(attrTrends.pace)}
                    </span>
                  </div>

                  <div className="bg-[#15151E] p-2.5 border border-white/5">
                    <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">CORNERING</span>
                    <span className="font-f1-mono font-bold text-sm text-white tabular-nums">
                      {activeSelectedDriver.attributes.cornering} / 99
                      {renderTrendBadge(attrTrends.cornering)}
                    </span>
                  </div>

                  <div className="bg-[#15151E] p-2.5 border border-white/5">
                    <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">BRAKING</span>
                    <span className="font-f1-mono font-bold text-sm text-white tabular-nums">
                      {activeSelectedDriver.attributes.braking} / 99
                      {renderTrendBadge(attrTrends.braking)}
                    </span>
                  </div>

                  <div className="bg-[#15151E] p-2.5 border border-white/5">
                    <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">TIRE PRESERVATION</span>
                    <span className="font-f1-mono font-bold text-sm text-white tabular-nums">
                      {activeSelectedDriver.attributes.tireManagement} / 99
                      {renderTrendBadge(attrTrends.tireManagement)}
                    </span>
                  </div>

                  <div className="bg-[#15151E] p-2.5 border border-white/5">
                    <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">WET WEATHER MASTERY</span>
                    <span className="font-f1-mono font-bold text-sm text-white tabular-nums">
                      {activeSelectedDriver.attributes.wetWeather} / 99
                      {renderTrendBadge(attrTrends.wetWeather)}
                    </span>
                  </div>

                  <div className="bg-[#15151E] p-2.5 border border-white/5">
                    <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">REACTION TIME</span>
                    <span className="font-f1-mono font-bold text-sm text-white tabular-nums">
                      {activeSelectedDriver.attributes.reactionTime} / 99
                      {renderTrendBadge(attrTrends.reactionTime)}
                    </span>
                  </div>

                  <div className="bg-[#15151E] p-2.5 border border-white/5">
                    <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">COMPOSURE UNDER FIRE</span>
                    <span className="font-f1-mono font-bold text-sm text-white tabular-nums">
                      {activeSelectedDriver.attributes.composure} / 99
                      {renderTrendBadge(attrTrends.composure)}
                    </span>
                  </div>

                  <div className="bg-[#15151E] p-2.5 border border-white/5">
                    <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">OVERTAKING AGGRESSION</span>
                    <span className="font-f1-mono font-bold text-sm text-white tabular-nums">
                      {activeSelectedDriver.attributes.overtaking} / 99
                      {renderTrendBadge(attrTrends.overtaking)}
                    </span>
                  </div>

                  <div className="bg-[#15151E] p-2.5 border border-white/5">
                    <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">TECHNICAL SETUP FEEDBACK</span>
                    <span className="font-f1-mono font-bold text-sm text-white tabular-nums">
                      {activeSelectedDriver.attributes.feedback} / 99
                      {renderTrendBadge(attrTrends.feedback)}
                    </span>
                  </div>
                </div>

                {/* Mentality 3 Pillars Breakdown (GDD Section 5.1) */}
                <div className="bg-[#15151E] p-4 border border-white/5 space-y-3">
                  <span className="text-xs font-f1-wide font-bold text-white uppercase block">
                    MENTALITY TRIAD EQUATION
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-f1-mono">
                    <div>
                      <span className="text-[10px] text-zinc-400 block">1. PERSONAL STATUS</span>
                      <span className="text-emerald-400 font-bold">Satisfied (Fair Salary)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 block">2. CAR PACE & RESULTS</span>
                      <span className="text-cyan-400 font-bold">Competitive (P5-P8)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 block">3. TEAM PRINCIPAL TRUST</span>
                      <span className="text-white font-bold">High (Active Upgrades)</span>
                    </div>
                  </div>
                </div>
              </div>
            </F1TabBucket>
              );
            })()}
          </div>
        </div>
      )}

      {/* SUB-TAB: DRIVER ACADEMY (F2/F3 AFFILIATES) */}
      {activeSubTab === 'academy' && (
        <div className="space-y-6">
          <div className="bg-[#1C1C26] p-4 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-f1-wide font-black text-sm text-white uppercase">
                Young Driver Development Program (Affiliates)
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Affiliates train on the Hexapod Simulator. Handing over the car in FP1 accelerates their attributes while meeting FIA rookie allocation regulations.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {affiliateDrivers.map(aff => (
              <F1TabBucket
                key={aff.id}
                title={`ACADEMY CANDIDATE: ${aff.name.toUpperCase()}`}
                badge="F2 GRADUATE"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-f1-wide font-bold text-sm text-white uppercase">
                        {aff.name}
                      </div>
                      <div className="text-xs font-f1-mono text-zinc-400">
                        {aff.nationality} · Age {aff.age} · Potential: {aff.potential}%
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">SALARY</span>
                      <span className="font-f1-mono font-bold text-white text-xs">
                        ${(aff.salary / 1000).toFixed(0)}k/yr
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs font-f1-mono bg-[#15151E] p-3 border border-white/5">
                    <div>
                      <span className="text-[10px] text-zinc-400 block">RAW PACE</span>
                      <span className="text-white font-bold">{aff.attributes.pace}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 block">FEEDBACK</span>
                      <span className="text-white font-bold">{aff.attributes.feedback}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 block">MENTALITY</span>
                      <span className="text-emerald-400 font-bold">{aff.mentality}%</span>
                    </div>
                  </div>

                  {aff.id === 'f2_camara' && (
                    <div className="bg-emerald-950/30 border border-emerald-500/40 px-2.5 py-1.5 text-[10px] font-f1-mono text-emerald-300">
                      Pré-contrato Haas F1 (2027) · Estreia antecipável na F1 mediante substituição de titular.
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => promoteAffiliateToFP1(aff.id)}
                      className="w-full py-2 bg-[#252533] hover:bg-[#323244] border border-white/10 text-white font-f1-wide font-bold text-[11px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Treino TL1 (+XP)</span>
                    </button>
                    {playerDrivers[0] && (
                      <button
                        type="button"
                        onClick={() => {
                          dismissDriverAndPromote(playerDrivers[0].id, aff.id);
                          setActiveSubTab('roster');
                        }}
                        className="w-full py-2 bg-[#E10600] hover:bg-[#c20500] text-white font-f1-wide font-bold text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Promover no Lugar de {playerDrivers[0].shortCode}
                      </button>
                    )}
                  </div>
                </div>
              </F1TabBucket>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB: TECHNICAL STAFF (GDD Sec. 6-8 Hierarchy) */}
      {activeSubTab === 'staff' && (() => {
        const chiefRoles: Array<{
          role: StaffMember['role'];
          title: string;
          scope: string;
          named?: string;
        }> = [
          {
            role: 'head_aero',
            title: '1. Chefe de Aerodinâmica',
            scope: 'Conceito aero, CFD, Túnel de Vento e redução do erro de correlação',
            named: playerTeam.headOfAero
          },
          {
            role: 'head_pu',
            title: '2. Chefe de PU e Componentes',
            scope: 'Unidade de Potência, Transmissão, Sistemas e manufatura de peças',
            named: playerTeam.headOfPowerUnit
          },
          {
            role: 'sporting_director',
            title: '3. Chefe de Gerenciamento',
            scope: 'Organização, Pilotos, Estratégia de corrida e regulamento FIA',
            named: playerTeam.sportingDirector
          },
          {
            role: 'chief_mechanic',
            title: '4. Chefe Mecânico · Equipe de Pista & Garagem',
            scope: 'Montagem, Manutenção preventiva, Preparação dos carros e Pit Stops',
            named: playerTeam.chiefMechanic
          }
        ];

        const activeChiefs = chiefRoles.map(cr => ({
          ...cr,
          member: resolveTeamChief(cr.role, cr.named)
        }));
        const teamRaceEngineers = staff.filter(
          s =>
            s.role === 'race_engineer' &&
            (s.currentTeam === playerTeam.name ||
              (playerTeam.name === 'APEX Grand Prix Team' && s.currentTeam === 'APEX Grand Prix Team'))
        );
        const activeChiefIds = new Set([
          ...activeChiefs.map(c => c.member?.id).filter(Boolean),
          ...teamRaceEngineers.map(e => e.id),
        ]);
        const otherStaff = staff.filter(s => !activeChiefIds.has(s.id));

        return (
          <div className="space-y-6">
            {/* Top Command Node: Player = Team Principal + Technical Director */}
            <div className="bg-[#1C1C26] border border-[#E10600]/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-f1-mono text-[#E10600] font-bold uppercase tracking-widest block">
                  GDD SEÇÃO 6 · COMANDO UNIFICADO DA ESCUDERIA
                </span>
                <h2 className="font-f1-wide font-black text-base text-white uppercase">
                  {principalProfile.name} · Team Principal & Diretor Técnico
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  3 Pilares de Projeto & Organização (Aero, PU e Gerenciamento) + Chefe Mecânico na Equipe Operacional de Pista (Garagem & Pit Crew).
                </p>
              </div>
              <span className="px-3 py-1 bg-[#E10600]/20 border border-[#E10600] text-white font-f1-mono text-xs font-bold uppercase shrink-0 whitespace-nowrap">
                4 CHEFES DIRETOS
              </span>
            </div>

            {/* 4 Direct Chiefs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeChiefs.map(({ role, title, scope, member }) => {
                const mechOps =
                  role === 'chief_mechanic' && member
                    ? evaluatePitAndGarageOperations({
                        chiefMechanicRating: member.rating,
                        principalBackground: principalProfile.background,
                        isSakuraHq: Boolean(playerTeam.location?.includes('Sakura')),
                      })
                    : null;

                const staffLevel = member ? getStaffRpgLevel(member) : 1;
                const staffXp = member ? getStaffXpProgress(member) : 0;
                const limitInfo = member ? getStaffFacilityLimitFeedback(member, teamCentralLevel) : null;

                return (
                  <F1TabBucket
                    key={role}
                    title={title.toUpperCase()}
                    badge={member ? `NV.${staffLevel}/5 · NOTA ${member.rating}` : 'VAGO'}
                  >
                    {member ? (
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <PersonAvatar
                              role={role as EngineeringAvatarRole}
                              name={member.name}
                              sizeClass="w-12 h-12"
                              accentColor={(member.trust ?? 75) < 40 ? '#E10600' : '#10B981'}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-f1-wide font-black text-sm text-white uppercase truncate">{member.name}</h3>
                                <span className="text-amber-400 text-xs shrink-0" title={`Nível ${staffLevel}/5`}>
                                  {'★'.repeat(staffLevel)}
                                  <span className="text-zinc-600">{'★'.repeat(Math.max(0, 5 - staffLevel))}</span>
                                </span>
                              </div>
                              <div className="text-xs font-f1-mono text-zinc-400">
                                DNA: <span className="text-[#E10600] font-bold">{member.teamOrigin}</span> · Moral {member.morale ?? member.mentality}%
                              </div>
                            </div>
                          </div>
                          <div className="text-right font-f1-mono text-xs shrink-0">
                            <span className="text-[10px] text-zinc-500 uppercase block">SALÁRIO</span>
                            <span className="text-white font-bold tabular-nums">${(member.salary / 1000000).toFixed(2)}M/ano</span>
                          </div>
                        </div>

                        {/* Staff XP Bar + Central Cap */}
                        <div className="bg-[#15151E] p-2.5 border border-white/5 space-y-1.5">
                          <div className="flex justify-between text-[10px] font-f1-mono tabular-nums">
                            <span className="text-zinc-400 uppercase">
                              Evolução Técnica (Teto Central Nv.{teamCentralLevel}: Nv.{centralCapInfo.maxStaffLevel})
                            </span>
                            <span className="text-cyan-300 font-bold">
                              {staffXp}/100 XP {member.lastXpDelta ? `(+${member.lastXpDelta})` : ''}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-white/10 overflow-hidden">
                            <div
                              className={`h-full ${limitInfo?.isLimited ? 'bg-amber-400' : 'bg-cyan-400'}`}
                              style={{ width: `${staffXp}%` }}
                            />
                          </div>
                          {limitInfo && (
                            <p
                              className={`text-[10px] font-f1-mono leading-relaxed italic pt-1 ${
                                limitInfo.isLimited ? 'text-amber-300' : 'text-zinc-400'
                              }`}
                            >
                              {limitInfo.quote}
                            </p>
                          )}
                        </div>

                        {(() => {
                          const trustMeta = getTrustStatus(member.trust);
                          return (
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-f1-mono tabular-nums">
                                <span className="text-zinc-400 uppercase">Confiança / Respeito</span>
                                <span className={`font-bold ${trustMeta.textCls}`}>
                                  {trustMeta.val}/100 ({trustMeta.label})
                                </span>
                              </div>
                              <div className="h-1.5 w-full bg-white/10 overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-300 ${trustMeta.barCls}`}
                                  style={{ width: `${trustMeta.val}%` }}
                                />
                              </div>
                              {trustMeta.val < 40 && (
                                <div className="text-[10px] font-f1-mono text-red-300 font-bold pt-0.5">
                                  DESENGAJADO: -10% VELOCIDADE P&D neste setor até recuperar confiança.
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        <div className="bg-[#15151E] p-3 border border-white/5 text-xs font-f1-mono space-y-1">
                          <span className="text-[10px] text-zinc-400 uppercase block">ESPECIALIDADE & ESCOPO DIRETO</span>
                          <div className="text-white font-bold">{member.specialty}</div>
                          <div className="text-[10px] text-cyan-300">{scope}</div>
                          {mechOps && (
                            <div className="text-[10px] text-emerald-300 pt-1 border-t border-white/5 tabular-nums">
                              Impacto Real: Pit Stop {mechOps.totalPitDeltaSec > 0 ? `+${mechOps.totalPitDeltaSec.toFixed(2)}` : mechOps.totalPitDeltaSec.toFixed(2)}s · Risco Erro Box {mechOps.pitErrorProbPct}% · Turnaround Garagem {mechOps.garageTurnaroundDeltaMin > 0 ? `+${mechOps.garageTurnaroundDeltaMin}` : mechOps.garageTurnaroundDeltaMin} min
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs font-f1-mono text-amber-400">Cargo aguardando nomeação.</div>
                    )}
                  </F1TabBucket>
                );
              })}
            </div>

            {/* Hired Race Radio Engineers (Carro #1 & Carro #2) */}
            {teamRaceEngineers.length > 0 && (
              <F1TabBucket
                title="ENGENHEIROS DE CORRIDA (RÁDIO DE PISTA)"
                badge={`${teamRaceEngineers.length}/2 ENGENHEIROS ATIVOS`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teamRaceEngineers.map((eng, engIdx) => {
                    const pairedDriver = playerDrivers[engIdx];
                    const engLvl = getStaffRpgLevel(eng);
                    const engXp = getStaffXpProgress(eng);
                    return (
                      <div key={eng.id} className="bg-[#15151E] border border-cyan-500/30 p-3.5 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <PersonAvatar
                              role="race_engineer"
                              name={eng.name}
                              sizeClass="w-10 h-10"
                              accentColor="#06B6D4"
                            />
                            <div className="min-w-0">
                              <span className="text-[9px] font-f1-mono text-cyan-400 font-bold uppercase block">
                                RÁDIO CARRO #{engIdx + 1}{pairedDriver ? ` · ${pairedDriver.name.toUpperCase()}` : ''}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <h3 className="font-f1-wide font-black text-sm text-white uppercase truncate">{eng.name}</h3>
                                <span className="text-amber-400 text-[10px]">
                                  {'★'.repeat(engLvl)}
                                </span>
                              </div>
                              <div className="text-[10px] font-f1-mono text-zinc-400">
                                {eng.teamOrigin} · OVR {eng.rating} · Moral {eng.morale ?? eng.mentality}%
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-f1-mono text-zinc-300 font-bold shrink-0 tabular-nums">
                            ${(eng.salary / 1000000).toFixed(2)}M/ano
                          </span>
                        </div>

                        <div className="text-[11px] font-f1-mono text-zinc-300 bg-[#1C1C26] p-2 border border-white/5">
                          {eng.specialty}
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-f1-mono tabular-nums">
                            <span className="text-zinc-400 uppercase">XP Operacional</span>
                            <span className="text-cyan-300 font-bold">{engXp}/100 XP</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/10 overflow-hidden">
                            <div className="h-full bg-cyan-400" style={{ width: `${engXp}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </F1TabBucket>
            )}

            {/* Paddock Directory / Candidates */}
            {otherStaff.length > 0 && (
              <F1TabBucket title="DIRETORIA TÉCNICA & CANDIDATOS DO PADDOCK" badge={`${otherStaff.length} PROFISSIONAIS`}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {otherStaff.slice(0, 12).map(s => (
                    <div key={s.id} className="bg-[#15151E] border border-white/10 p-3 text-xs font-f1-mono space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-f1-wide font-bold text-white uppercase">{s.name}</span>
                        <span className="text-emerald-400 font-bold">OVR {s.rating}</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 uppercase">
                        {s.role.replace('_', ' ')} · {s.currentTeam || s.teamOrigin}
                      </div>
                      <div className="text-[10px] text-zinc-300 truncate" title={s.specialty}>
                        {s.specialty}
                      </div>
                    </div>
                  ))}
                </div>
              </F1TabBucket>
            )}
          </div>
        );
      })()}

      {/* SUB-TAB: TRANSFER MARKET & SCOUTING */}
      {activeSubTab === 'market' && (
        <div className="space-y-4">
          <div className="bg-[#1C1C26] p-4 border border-white/10 flex items-center justify-between">
            <span className="text-xs font-f1-wide font-bold text-white uppercase">
              RIVAL PADDOCK SCOUTING & POACHING DIRECTORY
            </span>
            <span className="text-xs font-f1-mono text-zinc-400">
              Contract Buyout Penalty applies upon acquisition
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketDrivers.map(d => {
              const canAffordBuyout = financials.bankBalance >= d.buyoutClause;

              return (
                <div key={d.id} className="bg-[#1C1C26] p-4 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-f1-wide font-bold text-sm text-white uppercase">{d.name}</div>
                      <div className="text-xs font-f1-mono text-zinc-400">
                        {d.nationality} · Age {d.age} · Pace: <span className="text-[#E10600] font-bold">{d.attributes.pace}</span>
                      </div>
                    </div>
                    <span className="text-xs font-f1-mono text-zinc-300 uppercase font-bold">
                      {d.teamId.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-f1-mono bg-[#15151E] p-2.5 border border-white/5">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">CURRENT SALARY</span>
                      <span className="text-zinc-300">${(d.salary / 1000000).toFixed(1)}M</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">BUYOUT PENALTY</span>
                      <span className="text-[#E10600] font-bold">${(d.buyoutClause / 1000000).toFixed(1)}M</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">MORALE</span>
                      <span className={`font-bold ${getMentalityColor(d.mentality)}`}>{d.mentality}%</span>
                    </div>
                  </div>

                  <button
                    onClick={() => signDriver(d.id, d.salary * 1.15, 2)}
                    disabled={!canAffordBuyout}
                    className="w-full py-2 bg-[#252533] hover:bg-[#E10600] disabled:opacity-40 text-white font-f1-wide font-bold text-xs uppercase tracking-wider transition-colors"
                  >
                    Trigger Buyout & Sign Contract
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: ORGANIZAR EVENTO DE MARKETING */}
      {showMarketingModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1C1C26] border border-amber-500/40 w-full max-w-xl p-6 shadow-2xl relative space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-f1-wide font-black text-white uppercase tracking-wider">
                    Organizar Evento de Marketing
                  </h2>
                  <span className="text-[10px] font-f1-mono text-zinc-400">
                    ATIVAÇÃO COMERCIAL DE PILOTOS & ENGAJAMENTO GLOBAL DE FÃS
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowMarketingModal(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rules / Impact Briefing */}
            <div className="grid grid-cols-2 gap-3 text-xs font-f1-mono bg-[#15151E] p-3 border border-white/5">
              <div className="space-y-1">
                <span className="text-[10px] text-red-400 font-bold uppercase block tracking-wider">
                  CUSTOS DA AÇÃO
                </span>
                <div className="text-zinc-200 space-y-0.5">
                  <div>• <strong>$0.5M</strong> do Caixa (Logística do evento)</div>
                  <div>• <strong>+20</strong> Fadiga do Piloto (1 dia de folga perdido)</div>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-emerald-400 font-bold uppercase block tracking-wider">
                  RETORNO DA AÇÃO
                </span>
                <div className="text-emerald-300 space-y-0.5">
                  <div>• <strong>+$2.0M</strong> Imediatos no Caixa (+1.5M líquido)</div>
                  <div>• <strong>+5%</strong> na Base de Fãs Global</div>
                </div>
              </div>
            </div>

            {/* Driver Selection */}
            <div className="space-y-2">
              <label className="text-xs font-f1-wide font-bold text-white uppercase tracking-wider block">
                Selecione o Piloto para a Ativação:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {playerDrivers.map(drv => {
                  const isSelected = (marketingSelectedDriverId || playerDrivers[0]?.id) === drv.id;
                  const fatigue = drv.fatigue || 0;
                  const isTooFatigued = fatigue >= 90;

                  return (
                    <div
                      key={drv.id}
                      onClick={() => !isTooFatigued && setMarketingSelectedDriverId(drv.id)}
                      className={`p-3 border cursor-pointer transition-all ${
                        isTooFatigued
                          ? 'opacity-50 cursor-not-allowed bg-black/40 border-red-500/20'
                          : isSelected
                          ? 'bg-amber-950/20 border-amber-500 shadow-md ring-1 ring-amber-500/40'
                          : 'bg-[#15151E] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-f1-wide font-black text-sm text-white uppercase">
                          {drv.name}
                        </div>
                        <span className="text-xs font-f1-mono font-bold text-amber-400">
                          MKT: {drv.marketability}
                        </span>
                      </div>
                      <div className="text-[11px] font-f1-mono text-zinc-400 mt-0.5">
                        #{drv.number} · {drv.nationality}
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-white/5 space-y-1">
                        <div className="flex justify-between text-[10px] font-f1-mono">
                          <span className="text-zinc-400">Fadiga:</span>
                          <span className={fatigue > 70 ? 'text-red-400 font-bold' : fatigue > 30 ? 'text-amber-400' : 'text-emerald-400'}>
                            {fatigue}% {isTooFatigued ? '(Exausto)' : ''}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-white/10 overflow-hidden">
                          <div
                            className={`h-full ${fatigue > 70 ? 'bg-red-500' : fatigue > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, fatigue)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Caixa check */}
            <div className="text-xs font-f1-mono text-zinc-400 flex items-center justify-between border-t border-white/10 pt-3">
              <span>Saldo em Caixa Disponível:</span>
              <span className={`font-bold tabular-nums ${financials.bankBalance < 500000 ? 'text-red-400' : 'text-emerald-400'}`}>
                ${(financials.bankBalance / 1000000).toFixed(2)}M
              </span>
            </div>

            {/* Feedback Message if any */}
            {marketingFeedback && (
              <div className="p-3 bg-white/5 border border-white/10 text-xs font-f1-mono text-white">
                {marketingFeedback}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowMarketingModal(false)}
                className="px-4 py-2 border border-white/10 text-zinc-300 font-f1-mono text-xs uppercase hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                disabled={financials.bankBalance < 500000}
                onClick={() => {
                  const targetId = marketingSelectedDriverId || playerDrivers[0]?.id;
                  if (!targetId) return;
                  const res = organizarEventoMarketing(targetId);
                  if (res.success) {
                    setMarketingFeedback(res.message);
                    setTimeout(() => {
                      setShowMarketingModal(false);
                      setMarketingFeedback(null);
                    }, 1200);
                  } else {
                    setMarketingFeedback(res.message);
                  }
                }}
                className={`px-5 py-2 font-f1-wide font-black text-xs uppercase tracking-wider transition-all ${
                  financials.bankBalance < 500000
                    ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black shadow-lg cursor-pointer'
                }`}
              >
                Confirmar Evento ($0.5M)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
