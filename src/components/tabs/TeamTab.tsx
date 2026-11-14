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

export const TeamTab: React.FC = () => {
  const {
    drivers,
    staff,
    playerTeam,
    principalProfile,
    signDriver,
    promoteAffiliateToFP1,
    selectedAffiliateInFP1,
    financials,
    organizarEventoMarketing,
    baseDeFas,
    receitaMarketing
  } = useGame();

  const activeBg = PRINCIPAL_BACKGROUNDS.find(b => b.id === principalProfile.background) || PRINCIPAL_BACKGROUNDS[0];

  const [selectedDriver, setSelectedDriver] = useState<Driver>(
    drivers.find(d => d.teamId === playerTeam.id && !d.isAffiliate) || drivers[0]
  );
  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'academy' | 'staff' | 'market'>('roster');

  // Marketing Modal State
  const [showMarketingModal, setShowMarketingModal] = useState<boolean>(false);
  const [marketingSelectedDriverId, setMarketingSelectedDriverId] = useState<string>('');
  const [marketingFeedback, setMarketingFeedback] = useState<string | null>(null);

  const playerDrivers = drivers.filter(d => d.teamId === playerTeam.id && !d.isAffiliate);
  const affiliateDrivers = drivers.filter(d => d.isAffiliate);
  const marketDrivers = drivers.filter(d => d.teamId !== playerTeam.id && !d.isAffiliate);

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

            {playerDrivers.map((driver, idx) => {
              const isSelected = selectedDriver.id === driver.id;

              return (
                <div
                  key={driver.id}
                  onClick={() => setSelectedDriver(driver)}
                  className={`p-4 border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#232330] border-[#E10600] shadow-md'
                      : 'bg-[#1C1C26] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#15151E] border border-white/10 flex items-center justify-center font-f1-wide font-black text-lg text-white">
                        {driver.number}
                      </div>
                      <div>
                        <div className="font-f1-wide font-black text-sm text-white uppercase">
                          {driver.name}
                        </div>
                        <div className="text-[11px] font-f1-mono text-zinc-400">
                          {driver.nationality} · Age {driver.age} · Car # {idx + 1}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">OVERALL PACE</span>
                      <span className="font-f1-wide font-black text-lg text-[#E10600] tabular-nums">
                        {driver.attributes.pace}
                      </span>
                    </div>
                  </div>

                  {/* Mentality bar */}
                  <div className="mt-4 pt-3 border-t border-white/5 space-y-1">
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
                </div>
              );
            })}
          </div>

          {/* 14 Attributes Radar View (7 cols) */}
          <div className="lg:col-span-7">
            <F1TabBucket
              title={`DRIVER TELEMETRY PROFILE: ${selectedDriver.name.toUpperCase()}`}
              badge={`#${selectedDriver.number} · ${selectedDriver.shortCode}`}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-[#15151E] p-2.5 border border-white/5">
                    <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">CORNERING</span>
                    <span className="font-f1-mono font-bold text-sm text-white tabular-nums">
                      {selectedDriver.attributes.cornering} / 99
                    </span>
                  </div>

                  <div className="bg-[#15151E] p-2.5 border border-white/5">
                    <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">BRAKING</span>
                    <span className="font-f1-mono font-bold text-sm text-white tabular-nums">
                      {selectedDriver.attributes.braking} / 99
                    </span>
                  </div>

                  <div className="bg-[#15151E] p-2.5 border border-white/5">
                    <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">TIRE PRESERVATION</span>
                    <span className="font-f1-mono font-bold text-sm text-white tabular-nums">
                      {selectedDriver.attributes.tireManagement} / 99
                    </span>
                  </div>

                  <div className="bg-[#15151E] p-2.5 border border-white/5">
                    <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">WET WEATHER MASTERY</span>
                    <span className="font-f1-mono font-bold text-sm text-white tabular-nums">
                      {selectedDriver.attributes.wetWeather} / 99
                    </span>
                  </div>

                  <div className="bg-[#15151E] p-2.5 border border-white/5">
                    <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">REACTION TIME</span>
                    <span className="font-f1-mono font-bold text-sm text-white tabular-nums">
                      {selectedDriver.attributes.reactionTime} / 99
                    </span>
                  </div>

                  <div className="bg-[#15151E] p-2.5 border border-white/5">
                    <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">COMPOSURE UNDER FIRE</span>
                    <span className="font-f1-mono font-bold text-sm text-white tabular-nums">
                      {selectedDriver.attributes.composure} / 99
                    </span>
                  </div>

                  <div className="bg-[#15151E] p-2.5 border border-white/5">
                    <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">OVERTAKING AGGRESSION</span>
                    <span className="font-f1-mono font-bold text-sm text-white tabular-nums">
                      {selectedDriver.attributes.overtaking} / 99
                    </span>
                  </div>

                  <div className="bg-[#15151E] p-2.5 border border-white/5">
                    <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">DEFENSIVE RACECRAFT</span>
                    <span className="font-f1-mono font-bold text-sm text-white tabular-nums">
                      {selectedDriver.attributes.defending} / 99
                    </span>
                  </div>

                  <div className="bg-[#15151E] p-2.5 border border-white/5">
                    <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">TECHNICAL SETUP FEEDBACK</span>
                    <span className="font-f1-mono font-bold text-sm text-white tabular-nums">
                      {selectedDriver.attributes.feedback} / 99
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

                  <button
                    onClick={() => promoteAffiliateToFP1(aff.id)}
                    className="w-full py-2 bg-[#E10600] hover:bg-[#c20500] text-white font-f1-wide font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Seat in Upcoming FP1 Session (+XP)</span>
                  </button>
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
        }> = [
          {
            role: 'head_aero',
            title: '1. Chefe de Aerodinâmica',
            scope: 'Conceito aero, CFD, Túnel de Vento e redução do erro de correlação'
          },
          {
            role: 'head_pu',
            title: '2. Chefe de PU e Componentes',
            scope: 'Unidade de Potência, Transmissão, Sistemas e manufatura de peças'
          },
          {
            role: 'sporting_director',
            title: '3. Chefe Esportivo',
            scope: 'Pilotos, Estratégia de corrida, Desempenho esportivo e regulamento FIA'
          },
          {
            role: 'chief_mechanic',
            title: '4. Chefe de Mecânicos',
            scope: 'Montagem, Manutenção preventiva, Preparação dos carros e Pit Stops'
          }
        ];

        const activeChiefs = chiefRoles.map(cr => ({
          ...cr,
          member:
            staff.find(s => s.role === cr.role && (s.currentTeam === playerTeam.name || s.currentTeam === 'APEX Grand Prix Team' || s.id.startsWith('staff_head') || s.id === 'staff_sporting_dir' || s.id === 'staff_chief_mechanic')) ||
            staff.find(s => s.role === cr.role)
        }));
        const activeChiefIds = new Set(activeChiefs.map(c => c.member?.id).filter(Boolean));
        const otherStaff = staff.filter(s => !activeChiefIds.has(s.id));

        return (
          <div className="space-y-6">
            {/* Top Command Node: Player = Team Principal + Technical Director */}
            <div className="bg-[#1C1C26] border-2 border-[#E10600]/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-f1-mono text-[#E10600] font-bold uppercase tracking-widest block">
                  GDD SEÇÃO 6 · COMANDO UNIFICADO DA ESCUDERIA
                </span>
                <h2 className="font-f1-wide font-black text-base text-white uppercase">
                  {principalProfile.name} · Team Principal & Diretor Técnico
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  O jogador centraliza a direção executiva e técnica; os 4 Chefes de Departamento respondem diretamente abaixo.
                </p>
              </div>
              <span className="px-3 py-1 bg-[#E10600]/20 border border-[#E10600] text-white font-f1-mono text-xs font-bold uppercase shrink-0">
                4 CHEFES DIRETOS
              </span>
            </div>

            {/* 4 Direct Chiefs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeChiefs.map(({ role, title, scope, member }) => (
                <F1TabBucket
                  key={role}
                  title={title.toUpperCase()}
                  badge={member ? `NOTA: ${member.rating}` : 'VAGO'}
                >
                  {member ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-f1-wide font-black text-sm text-white uppercase">{member.name}</h3>
                          <div className="text-xs font-f1-mono text-zinc-400">
                            DNA: <span className="text-[#E10600] font-bold">{member.teamOrigin}</span> · Moral {member.mentality}%
                          </div>
                        </div>
                        <div className="text-right font-f1-mono text-xs">
                          <span className="text-[10px] text-zinc-500 uppercase block">SALÁRIO</span>
                          <span className="text-white font-bold">${(member.salary / 1000000).toFixed(2)}M/ano</span>
                        </div>
                      </div>

                      <div className="bg-[#15151E] p-3 border border-white/5 text-xs font-f1-mono space-y-1">
                        <span className="text-[10px] text-zinc-400 uppercase block">ESPECIALIDADE & ESCOPO DIRETO</span>
                        <div className="text-white font-bold">{member.specialty}</div>
                        <div className="text-[10px] text-cyan-300">{scope}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs font-f1-mono text-amber-400">Cargo aguardando nomeação.</div>
                  )}
                </F1TabBucket>
              ))}
            </div>

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
