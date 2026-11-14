import React, { useState } from 'react';
import type { CareerPath, ProjectAmbitionId, StaffMember } from '../../types/f1';
import type { HQOption } from '../../data/headquartersData';
import type { PrincipalBackgroundOption } from '../../data/principalBackgroundsData';
import {
  AERO_STAFF_MEMBERS,
  PU_STAFF_MEMBERS,
  SPORTING_STAFF_MEMBERS,
  CHIEF_MECHANIC_STAFF_MEMBERS
} from '../../data/marketData';
import {
  PROJECT_AMBITION_OPTIONS,
  calculateStaffInterest,
  getStaffFullProfile
} from '../../utils/profileSheets';
import { StaffMarketCard } from './Step5MarketCards';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Cpu,
  DollarSign,
  Lock,
  Search,
  Shield,
  Target,
  Users,
  Wrench
} from 'lucide-react';

export interface Step3OrganizationAndStaffProps {
  careerPath: CareerPath;
  teamName: string;
  realTeamReputation: number;
  selectedHq: HQOption;
  selectedBackground: PrincipalBackgroundOption;
  projectAmbition: ProjectAmbitionId;
  onSelectProjectAmbition: (id: ProjectAmbitionId) => void;
  selectedHeadAero: string | null;
  selectedHeadPU: string | null;
  selectedSportingDirector: string | null;
  selectedChiefMechanic: string | null;
  onToggleStaff: (staff: StaffMember) => void;
  onExpandStaff: (staff: StaffMember) => void;
  onPlaySound?: () => void;
}

type SubTab3 = 'dna_board' | 'pillars' | 'staff_dna';
type StaffFilterRole = 'aero' | 'pu' | 'sporting' | 'mechanic';

export const Step3OrganizationAndStaff: React.FC<Step3OrganizationAndStaffProps> = ({
  careerPath,
  teamName,
  realTeamReputation,
  selectedHq,
  selectedBackground,
  projectAmbition,
  onSelectProjectAmbition,
  selectedHeadAero,
  selectedHeadPU,
  selectedSportingDirector,
  selectedChiefMechanic,
  onToggleStaff,
  onExpandStaff,
  onPlaySound
}) => {
  const [subTab, setSubTab] = useState<SubTab3>('dna_board');
  const [roleFilter, setRoleFilter] = useState<StaffFilterRole>('aero');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const isRealTeam = careerPath === 'real_team';
  const ambitionSpec = PROJECT_AMBITION_OPTIONS[projectAmbition];
  const europeanAppeal = selectedHq.modifiers.europeanStaffAppeal ?? 0;
  const logisticsCostM = selectedHq.modifiers.logisticsAnnualCostM ?? 5.0;

  const stfAero = AERO_STAFF_MEMBERS.find(s => s.id === selectedHeadAero) || null;
  const stfPU = PU_STAFF_MEMBERS.find(s => s.id === selectedHeadPU) || null;
  const stfSport = SPORTING_STAFF_MEMBERS.find(s => s.id === selectedSportingDirector) || null;
  const stfMech = CHIEF_MECHANIC_STAFF_MEMBERS.find(s => s.id === selectedChiefMechanic) || null;

  const pillarsCompleteCount = [stfAero, stfPU, stfSport].filter(Boolean).length;
  const allThreePillarsReady = pillarsCompleteCount === 3;

  const activeList =
    roleFilter === 'aero'
      ? AERO_STAFF_MEMBERS
      : roleFilter === 'pu'
      ? PU_STAFF_MEMBERS
      : roleFilter === 'sporting'
      ? SPORTING_STAFF_MEMBERS
      : CHIEF_MECHANIC_STAFF_MEMBERS;

  const q = searchQuery.trim().toLowerCase();
  const filteredList = activeList.filter(s => {
    if (!q) return true;
    const profile = getStaffFullProfile(s);
    return (
      s.name.toLowerCase().includes(q) ||
      (s.currentTeam || s.teamOrigin || '').toLowerCase().includes(q) ||
      profile.staffPhilosophyTag.toLowerCase().includes(q) ||
      profile.designDna.toLowerCase().includes(q)
    );
  });

  const hiredStaffList = [stfAero, stfPU, stfSport, stfMech].filter(Boolean) as StaffMember[];
  const totalStaffSalariesUsd = hiredStaffList.reduce((acc, s) => {
    const ev = calculateStaffInterest({
      staff: s,
      projectAmbition,
      hqOption: selectedHq,
      isRealTeam,
      realTeamReputation
    });
    return acc + (ev.status === 'negotiable' ? ev.requiredSalaryUsd : s.salary);
  }, 0);
  const totalBuyoutsUsd = hiredStaffList.reduce((acc, s) => acc + (s.buyoutClause || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Principal */}
      <div className="space-y-1">
        <span className="text-xs font-f1-mono text-[#E10600] font-bold tracking-widest uppercase">
          FASE 3: FUNDAÇÃO DA ORGANIZAÇÃO
        </span>
        <h2 className="font-f1-wide font-black text-2xl sm:text-3xl text-white uppercase">
          DNA, Diretoria, Expectativas & Equipe Técnica
        </h2>
        <p className="text-sm text-zinc-400">
          Antes de escolher o motor ou desenhar o carro, defina a ambição do Conselho e contrate os 3 Pilares Técnicos que darão vida ao projeto.
        </p>
      </div>

      {/* Navegação dos 3 Sub-passos */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={() => {
            onPlaySound?.();
            setSubTab('dna_board');
          }}
          className={`px-4 py-2 text-xs font-f1-wide font-bold uppercase border transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            subTab === 'dna_board'
              ? 'bg-[#E10600] border-[#E10600] text-white shadow-md'
              : 'bg-[#15151E] border-white/10 text-zinc-300 hover:border-white/30'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>3.1 DNA & Aposta do Conselho</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onPlaySound?.();
            setSubTab('pillars');
          }}
          className={`px-4 py-2 text-xs font-f1-wide font-bold uppercase border transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            subTab === 'pillars'
              ? 'bg-[#E10600] border-[#E10600] text-white shadow-md'
              : 'bg-[#15151E] border-white/10 text-zinc-300 hover:border-white/30'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>3.2 Os 3 Pilares Técnicos ({pillarsCompleteCount}/3)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onPlaySound?.();
            setSubTab('staff_dna');
          }}
          className={`px-4 py-2 text-xs font-f1-wide font-bold uppercase border transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            subTab === 'staff_dna'
              ? 'bg-[#E10600] border-[#E10600] text-white shadow-md'
              : 'bg-[#15151E] border-white/10 text-zinc-300 hover:border-white/30'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>3.3 DNA Técnico & Folha</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* SUB-PASSO 3.1: O DNA & A APOSTA DO CONSELHO                          */}
      {/* ==================================================================== */}
      {subTab === 'dna_board' && (
        <div className="space-y-6">
          {/* Card: DNA Imutável da Organização */}
          <div className="bg-[#1C1C26] border border-white/10 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#E10600]" />
                <h3 className="font-f1-wide font-black text-sm text-white uppercase">
                  DNA Imutável da Organização · {teamName}
                </h3>
              </div>
              <span className="text-[10px] font-f1-mono text-zinc-300 bg-white/5 border border-white/10 px-2.5 py-0.5 uppercase font-bold whitespace-nowrap">
                IDENTIDADE DE FUNDAÇÃO
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-f1-mono">
              <div className="bg-[#15151E] p-3 border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-400 uppercase block">PERFIL DO COMANDO</span>
                <span className="text-white font-bold block">{selectedBackground.name}</span>
                <span className="text-[10px] text-emerald-400 block">{selectedBackground.bonus}</span>
              </div>

              <div className="bg-[#15151E] p-3 border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-400 uppercase block">POLO OPERACIONAL (SEDE)</span>
                <span className="text-white font-bold block">
                  {isRealTeam ? 'Fábrica Oficial Estabelecida' : `${selectedHq.flagEmoji} ${selectedHq.name}`}
                </span>
                <span className="text-[10px] text-zinc-400 block">{selectedHq.bonusShort}</span>
              </div>

              <div className="bg-[#15151E] p-3 border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-400 uppercase block">APELO STAFF EUROPEU</span>
                <span
                  className={`font-f1-wide font-black text-base tabular-nums block ${
                    europeanAppeal >= 10
                      ? 'text-emerald-400'
                      : europeanAppeal < 0
                      ? 'text-amber-400'
                      : 'text-white'
                  }`}
                >
                  {europeanAppeal > 0 ? `+${europeanAppeal}%` : `${europeanAppeal}%`}
                </span>
                <span className="text-[10px] text-zinc-400 block">
                  {europeanAppeal >= 10
                    ? 'Alta atratividade para engenheiros F1'
                    : europeanAppeal < 0
                    ? 'Exige salário maior para relocação'
                    : 'Atratividade neutra no paddock'}
                </span>
              </div>

              <div className="bg-[#15151E] p-3 border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-400 uppercase block">CUSTO LOGÍSTICO ANUAL</span>
                <span className="font-f1-wide font-black text-base text-cyan-400 tabular-nums block">
                  ${logisticsCostM.toFixed(1)}M/ano
                </span>
                <span className="text-[10px] text-zinc-400 block">
                  Frete aéreo de peças & logística GP
                </span>
              </div>
            </div>
          </div>

          {/* Card: A Aposta do Conselho (3 Opções de Projeto) */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-f1-wide font-black text-sm text-white uppercase flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                  <span>A Aposta do Conselho (Escolha o Nível de Ambição do Ano 1)</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  O dinheiro que você pede aos acionistas define o nível da sua fábrica, o interesse dos engenheiros e a pressão por resultados.
                </p>
              </div>
              {isRealTeam && (
                <span className="text-[10px] font-f1-mono text-cyan-300 bg-cyan-950/50 border border-cyan-500/40 px-2.5 py-1 uppercase font-bold whitespace-nowrap">
                  Modo Equipe Real: Meta & Pressão do Conselho Aplicadas
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {(['bold', 'balanced', 'grounded'] as ProjectAmbitionId[]).map(id => {
                const opt = PROJECT_AMBITION_OPTIONS[id];
                const isSelected = projectAmbition === id;
                const pressureColor =
                  opt.pressureLevel === 'high'
                    ? 'text-red-400 border-red-500/40 bg-red-950/50'
                    : opt.pressureLevel === 'medium'
                    ? 'text-amber-300 border-amber-500/40 bg-amber-950/50'
                    : 'text-emerald-300 border-emerald-500/40 bg-emerald-950/50';

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onPlaySound?.();
                      onSelectProjectAmbition(opt.id);
                    }}
                    className={`p-5 text-left border rounded-lg transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                      isSelected
                        ? 'bg-[#1D1826] border-[#E10600] ring-1 ring-[#E10600] shadow-lg shadow-[#E10600]/15'
                        : 'bg-[#15151E] border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2.5">
                        <div>
                          <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">
                            {opt.subtitle}
                          </span>
                          <h4 className="font-f1-wide font-black text-sm text-white uppercase mt-0.5">
                            {opt.title}
                          </h4>
                        </div>
                        {isSelected && (
                          <span className="px-2 py-0.5 bg-[#E10600] text-white text-[9px] font-f1-mono font-bold uppercase whitespace-nowrap">
                            SELECIONADO
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-f1-mono">
                        <div className="bg-black/35 p-2.5 border border-white/5 rounded">
                          <span className="text-[9px] text-zinc-400 uppercase block">ORÇAMENTO INICIAL</span>
                          <span className="font-f1-wide font-black text-base text-emerald-400 tabular-nums">
                            {opt.budgetLabel}
                          </span>
                        </div>
                        <div className="bg-black/35 p-2.5 border border-white/5 rounded">
                          <span className="text-[9px] text-zinc-400 uppercase block">PRESSÃO CONSELHO</span>
                          <span className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 border rounded ${pressureColor}`}>
                            {opt.pressureLabel}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs font-f1-mono bg-[#1C1C26]/70 p-3 border border-white/5 rounded">
                        <div className="flex justify-between gap-2">
                          <span className="text-zinc-400">Instalações:</span>
                          <span className="text-white font-bold text-right">{opt.facilityLevelLabel}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-zinc-400">Expectativa:</span>
                          <span className="text-amber-300 font-bold text-right">{opt.boardExpectationText}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-zinc-400">Apelo Staff:</span>
                          <span className={`font-bold tabular-nums ${opt.staffInterestBonusPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {opt.staffInterestBonusPct >= 0 ? `+${opt.staffInterestBonusPct}%` : `${opt.staffInterestBonusPct}%`} Interesse
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] font-f1-mono text-zinc-300 leading-relaxed pt-2 border-t border-white/10">
                      <strong className="text-white">Consequência:</strong> {opt.consequenceText}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                onPlaySound?.();
                setSubTab('pillars');
              }}
              className="px-6 py-3 bg-[#E10600] hover:bg-[#c20500] text-white font-f1-wide font-black text-xs uppercase tracking-wider f1-tab-chamfer transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Avançar para Contratação dos 3 Pilares</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUB-PASSO 3.2: CONTRATAÇÃO DA EQUIPE TÉCNICA (OS 3 PILARES)          */}
      {/* ==================================================================== */}
      {subTab === 'pillars' && (
        <div className="space-y-5">
          {/* Painel dos 3 Pilares Obrigatórios */}
          <div
            className={`p-4 border rounded-lg transition-all ${
              allThreePillarsReady
                ? 'bg-[#101C15] border-emerald-500/50'
                : 'bg-[#1C1C26] border-amber-500/40'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                {allThreePillarsReady ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <Lock className="w-5 h-5 text-amber-400 shrink-0" />
                )}
                <div>
                  <h3 className="font-f1-wide font-bold text-sm text-white uppercase">
                    OS 3 PILARES TÉCNICOS DA ORGANIZAÇÃO ({pillarsCompleteCount}/3 OBRIGATÓRIOS)
                  </h3>
                  <span className="text-[11px] font-f1-mono text-zinc-400">
                    Projeto Selecionado: <strong className="text-white">{ambitionSpec.title}</strong> · Sede:{' '}
                    <strong className="text-white">{selectedHq.name}</strong>
                  </span>
                </div>
              </div>

              <span
                className={`text-[10px] font-f1-mono px-3 py-1 font-bold uppercase border whitespace-nowrap ${
                  allThreePillarsReady
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                    : 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                }`}
              >
                {allThreePillarsReady ? '✓ 3 PILARES HOMOLOGADOS' : 'CONTRATAÇÃO PENDENTE'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-f1-mono">
              {[
                { label: '1. CHEFE DE AERO', roleKey: 'aero' as StaffFilterRole, member: stfAero, required: true },
                { label: '2. CHEFE DE PU & COMP.', roleKey: 'pu' as StaffFilterRole, member: stfPU, required: true },
                { label: '3. CHEFE DE GERENCIAMENTO', roleKey: 'sporting' as StaffFilterRole, member: stfSport, required: true },
                { label: 'CHEFE MECÂNICO (GARAGEM)', roleKey: 'mechanic' as StaffFilterRole, member: stfMech, required: false }
              ].map(slot => {
                const profile = slot.member ? getStaffFullProfile(slot.member) : null;
                return (
                  <div
                    key={slot.label}
                    onClick={() => setRoleFilter(slot.roleKey)}
                    className={`p-3 border rounded cursor-pointer transition-all flex flex-col justify-between min-h-[104px] ${
                      slot.member
                        ? 'bg-[#15151E] border-emerald-500/40'
                        : slot.required
                        ? 'bg-amber-950/15 border-dashed border-amber-500/50'
                        : 'bg-[#15151E]/60 border-white/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold mb-1">
                        <span>{slot.label}</span>
                        {slot.member ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : slot.required ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        ) : null}
                      </div>
                      {slot.member && profile ? (
                        <div className="space-y-0.5">
                          <div className="font-f1-wide font-bold text-white text-xs truncate">
                            {slot.member.name}
                          </div>
                          <div className="text-[10px] text-purple-300 font-bold">
                            [{profile.staffPhilosophyTag}] · OVR {slot.member.rating}
                          </div>
                        </div>
                      ) : (
                        <span className="text-amber-400 font-bold text-[11px] block mt-1">
                          {slot.required ? 'Clique para contratar' : 'Padrão de fábrica ativo'}
                        </span>
                      )}
                    </div>
                    {slot.member && slot.required && (
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          onToggleStaff(slot.member!);
                        }}
                        className="text-[9px] text-red-400 hover:text-red-300 underline text-left mt-1 cursor-pointer"
                      >
                        Dispensar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Aviso sobre Bloqueio Realista de Estrelas */}
          {!isRealTeam && ambitionSpec.aeroFacilityLevel < 3 && (
            <div className="bg-[#15151E] border border-cyan-500/35 p-3 rounded flex items-start gap-2.5 text-xs font-f1-mono text-zinc-300">
              <Building2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-cyan-300">Realismo de Mercado:</strong> Nomes lendários (OVR 90+, como Adrian Newey ou Enrico Gualtieri) exigem infraestrutura de <strong className="text-white">Nível 3+</strong> e rejeitam equipes estreantes de Nível {ambitionSpec.aeroFacilityLevel}. Contrate engenheiros acessíveis ou em ascensão que aceitam crescer com o projeto!
              </span>
            </div>
          )}

          {/* Filtros de Cargo + Busca */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: 'aero', label: '1. Chefe de Aerodinâmica' },
                  { id: 'pu', label: '2. Chefe de PU & Componentes' },
                  { id: 'sporting', label: '3. Chefe de Gerenciamento' },
                  { id: 'mechanic', label: 'Chefe Mecânico (Opcional)' }
                ] as const
              ).map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    onPlaySound?.();
                    setRoleFilter(tab.id);
                  }}
                  className={`px-3 py-1.5 text-xs font-f1-mono font-bold uppercase border transition-all whitespace-nowrap cursor-pointer ${
                    roleFilter === tab.id
                      ? 'bg-white/20 border-white text-white'
                      : 'bg-[#15151E] border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[230px]">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar nome, DNA ou filosofia..."
                className="w-full bg-[#15151E] border border-white/10 pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 font-f1-mono focus:outline-none focus:border-[#E10600]"
              />
            </div>
          </div>

          {/* Grid de Cards do Mercado de Staff */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredList.map(member => {
              const isAssigned =
                (roleFilter === 'aero' && selectedHeadAero === member.id) ||
                (roleFilter === 'pu' && selectedHeadPU === member.id) ||
                (roleFilter === 'sporting' && selectedSportingDirector === member.id) ||
                (roleFilter === 'mechanic' && selectedChiefMechanic === member.id);

              const interest = calculateStaffInterest({
                staff: member,
                projectAmbition,
                hqOption: selectedHq,
                isRealTeam,
                realTeamReputation
              });

              return (
                <StaffMarketCard
                  key={member.id}
                  staffMember={member}
                  isAssigned={isAssigned}
                  interest={interest}
                  onExpand={onExpandStaff}
                  onToggleAssign={onToggleStaff}
                />
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => setSubTab('dna_board')}
              className="px-4 py-2 bg-[#15151E] border border-white/10 text-zinc-300 hover:text-white text-xs font-f1-wide uppercase cursor-pointer"
            >
              Voltar para 3.1
            </button>
            <button
              type="button"
              onClick={() => setSubTab('staff_dna')}
              className="px-6 py-2.5 bg-[#E10600] hover:bg-[#c20500] text-white font-f1-wide font-black text-xs uppercase tracking-wider f1-tab-chamfer flex items-center gap-2 cursor-pointer"
            >
              <span>Ver 3.3 DNA Técnico do Staff</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUB-PASSO 3.3: DNA TÉCNICO DO STAFF & COMPROMISSO FINANCEIRO         */}
      {/* ==================================================================== */}
      {subTab === 'staff_dna' && (
        <div className="space-y-5">
          <div className="bg-[#1C1C26] border border-white/10 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <h3 className="font-f1-wide font-black text-sm text-white uppercase flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-purple-400" />
                  <span>DNA Técnico Combinado da Diretoria de Engenharia</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  A filosofia de cada chefe contratado definirá sinergias ou conflitos ao escolher o conceito do carro na Fase 5.
                </p>
              </div>
              <div className="text-right font-f1-mono text-xs">
                <span className="text-zinc-400 block text-[10px]">COMPROMISSO DE STAFF</span>
                <span className="text-emerald-400 font-bold tabular-nums">
                  ${(totalStaffSalariesUsd / 1000000).toFixed(2)}M/ano
                </span>
                {totalBuyoutsUsd > 0 && (
                  <span className="text-amber-400 block text-[10px] tabular-nums">
                    + ${(totalBuyoutsUsd / 1000000).toFixed(1)}M multas
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: 'Chefe de Aerodinâmica', member: stfAero, filter: 'aero' as StaffFilterRole },
                { title: 'Chefe de PU & Componentes', member: stfPU, filter: 'pu' as StaffFilterRole },
                { title: 'Chefe de Gerenciamento', member: stfSport, filter: 'sporting' as StaffFilterRole }
              ].map(item => {
                const profile = item.member ? getStaffFullProfile(item.member) : null;
                return (
                  <div
                    key={item.title}
                    className={`p-4 border rounded-lg space-y-2.5 ${
                      item.member
                        ? 'bg-[#15151E] border-purple-500/40'
                        : 'bg-amber-950/15 border-dashed border-amber-500/40'
                    }`}
                  >
                    <span className="text-[10px] font-f1-mono text-zinc-400 uppercase font-bold block">
                      {item.title}
                    </span>
                    {item.member && profile ? (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-f1-wide font-black text-sm text-white">
                            {item.member.name}
                          </span>
                          <span className="text-xs font-f1-wide font-black text-emerald-400 tabular-nums">
                            OVR {item.member.rating}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-f1-mono font-bold px-2 py-0.5 bg-purple-950/70 border border-purple-400/50 text-purple-200 rounded">
                            [ FILOSOFIA: {profile.staffPhilosophyTag} ]
                          </span>
                          <span className="text-[10px] font-f1-mono px-2 py-0.5 bg-white/5 border border-white/10 text-zinc-300 rounded">
                            {profile.designDna}
                          </span>
                        </div>
                        <p className="text-[11px] font-f1-mono text-zinc-300 leading-relaxed pt-1 border-t border-white/5">
                          {profile.philosophyImpactSummary}
                        </p>
                      </>
                    ) : (
                      <div className="space-y-2 py-2">
                        <p className="text-xs font-f1-mono text-amber-300">
                          Cargo obrigatório ainda em aberto.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setRoleFilter(item.filter);
                            setSubTab('pillars');
                          }}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-f1-wide font-bold uppercase rounded cursor-pointer"
                        >
                          Contratar Agora
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => setSubTab('pillars')}
              className="px-4 py-2 bg-[#15151E] border border-white/10 text-zinc-300 hover:text-white text-xs font-f1-wide uppercase cursor-pointer"
            >
              Ajustar Contratações em 3.2
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
