import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { PU_CLIENT_PROPOSALS, PuClientProposal } from '../../data/puClientsData';
import {
  FileSignature,
  Building2,
  DollarSign,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Zap,
  TrendingUp,
  Cpu,
  ArrowRight,
  Lock,
  Flame,
  Award
} from 'lucide-react';

export const PuClientsTab: React.FC = () => {
  const {
    playerTeam,
    financials,
    components,
    puClients,
    signPuClient,
    terminatePuClient,
    maxPuClientsCapacity,
    setActiveTab,
    playRadioSound
  } = useGame();

  const [confirmTerminateId, setConfirmTerminateId] = useState<string | null>(null);

  const isWorksTeam =
    playerTeam?.isManufacturer ||
    playerTeam?.engineOrigin === 'bought_factory' ||
    playerTeam?.engineOrigin === 'phoenix';

  const puComp = components.find(c => c.type === 'pu');
  const puReliability = puComp?.reliability ?? 85;
  const puPower = puComp?.performance ?? 80;

  const activeClients = puClients.filter(c => c.status === 'active');
  const activeCount = activeClients.length;
  const capacityPercent = Math.min(100, Math.round((activeCount / maxPuClientsCapacity) * 100));
  const isCapacityFull = activeCount >= maxPuClientsCapacity;

  const totalAnnualRevenue = activeClients.reduce((sum, c) => sum + c.annualPayment, 0);

  // Se não for equipe de fábrica, bloqueia o acesso e exibe a justificativa regulamentar
  if (!isWorksTeam) {
    return (
      <div className="space-y-6">
        <div className="bg-[#1C1C26] border-2 border-red-500/50 p-8 f1-container-bucket text-center space-y-4">
          <div className="w-16 h-16 bg-red-950/60 border-2 border-red-500/50 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(239,68,68,0.3)]">
            <Lock className="w-8 h-8 text-red-400" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-f1-mono text-red-400 font-bold uppercase tracking-widest block">
              ACESSO RESTRITO · REGULAMENTO FIA 2026
            </span>
            <h1 className="font-f1-wide font-black text-2xl text-white uppercase">
              Departamento de Clientes Desativado
            </h1>
          </div>

          <p className="text-sm font-f1-mono text-zinc-300 max-w-xl mx-auto leading-relaxed">
            Sua equipe compete atualmente como cliente de motor da fornecedora{' '}
            <strong className="text-white">{playerTeam?.engineSupplier || 'Mercedes'}</strong>. 
            Apenas equipes com status oficial de <strong className="text-amber-400">Montadora (Works Team)</strong> — que adquiriram uma fábrica ou construíram a divisão de motores do zero — possuem homologação da FIA para fornecer e vender Unidades de Potência para equipes clientes.
          </p>

          <div className="pt-4 flex justify-center gap-3">
            <button
              onClick={() => {
                playRadioSound();
                setActiveTab('overview');
              }}
              className="px-6 py-2.5 bg-[#E10600] hover:bg-[#c20500] text-white font-f1-wide font-bold text-xs uppercase tracking-wider f1-tab-chamfer transition-colors cursor-pointer"
            >
              Voltar ao Comando
            </button>
            <button
              onClick={() => {
                playRadioSound();
                setActiveTab('facilities');
              }}
              className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-f1-wide font-bold text-xs uppercase tracking-wider border border-white/10 transition-colors cursor-pointer"
            >
              Ver Fábrica & Instalações
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Status Oficial de Montadora */}
      <div className="bg-[#1C1C26] border border-white/10 p-5 f1-pattern-micro-grid">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-f1-mono text-[#E10600] font-bold tracking-widest uppercase">
                DIVISÃO COMERCIAL DE MOTORES · FIA WORKS PROGRAM
              </span>
              <span className="text-[9px] font-f1-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 font-bold uppercase inline-flex items-center gap-1">
                <Award className="w-3 h-3 text-amber-400" />
                STATUS: MONTADORA OFICIAL
              </span>
            </div>
            <h1 className="font-f1-wide font-black text-xl lg:text-2xl text-white uppercase mt-1">
              Departamento de Clientes (Fornecimento de PU)
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
              Gerencie contratos comerciais de venda de motor para equipes do grid. Cada equipe cliente gera aporte direto de receita anual no Caixa, porém ocupa capacidade fabril da montadora.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-[#15151E] p-3 border border-white/5 text-right">
              <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">RECEITA ANUAL DE CLIENTES</span>
              <span className="text-sm font-f1-mono font-bold text-emerald-400 tabular-nums">
                +${(totalAnnualRevenue / 1000000).toFixed(1)}M / ANO
              </span>
              <span className="text-[9px] font-f1-mono text-zinc-500 block">Isento do Cost Cap</span>
            </div>
            <div className="bg-[#15151E] p-3 border border-white/5 text-right">
              <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">SLOTS DE MANUFATURA</span>
              <span className={`text-sm font-f1-mono font-bold tabular-nums ${isCapacityFull ? 'text-red-400' : 'text-amber-400'}`}>
                {activeCount} / {maxPuClientsCapacity} SLOTS ({capacityPercent}%)
              </span>
              <span className="text-[9px] font-f1-mono text-zinc-500 block">Capacidade da Fábrica</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de 4 Métricas de Gestão de Clientes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-f1-mono">
        <div className="bg-[#1C1C26] p-4 border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase font-bold">
            <span>Capacidade da Fábrica</span>
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span className={`font-f1-wide font-black text-lg ${isCapacityFull ? 'text-red-400' : 'text-white'}`}>
            {capacityPercent}%
          </span>
          <span className="text-[10px] text-zinc-500 block">
            {isCapacityFull ? 'Capacidade esgotada (100%)' : `${maxPuClientsCapacity - activeCount} slot(s) disponível(is)`}
          </span>
        </div>

        <div className="bg-[#1C1C26] p-4 border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase font-bold">
            <span>Gargalo de Produção</span>
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <span className="font-f1-wide font-black text-lg text-cyan-400">
            {activeCount === 0 ? '1.0x (Normal)' : activeCount === 1 ? '1.5x (+50% Tempo)' : '2.0x (Dobro do Tempo)'}
          </span>
          <span className="text-[10px] text-zinc-500 block">
            {activeCount === 0 ? 'Fábrica 100% dedicada' : 'Manufatura de upgrades próprios dividida'}
          </span>
        </div>

        <div className="bg-[#1C1C26] p-4 border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase font-bold">
            <span>Confiabilidade da PU</span>
            <Flame className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className={`font-f1-wide font-black text-lg ${puReliability >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {puReliability}%
          </span>
          <span className="text-[10px] text-zinc-500 block">
            {puReliability < 80 ? '⚠️ Risco de quebra no cliente' : 'Margem segura contra crises'}
          </span>
        </div>

        <div className="bg-[#1C1C26] p-4 border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase font-bold">
            <span>Potência do Motor</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span className="font-f1-wide font-black text-lg text-white">
            {puPower} PWR
          </span>
          <span className="text-[10px] text-zinc-500 block">
            {puPower < 76 ? '⚠️ Risco de rescisão por lentidão' : 'Desempenho aprovado pelos clientes'}
          </span>
        </div>
      </div>

      {/* PAINEL DE GESTÃO: MEDIDOR DE CAPACIDADE DE PRODUÇÃO DE PU */}
      <div className="bg-[#1C1C26] border-2 border-white/10 p-5 f1-container-bucket space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
          <div>
            <span className="text-xs font-f1-wide font-black text-white uppercase block">
              MEDIDOR: CAPACIDADE DE PRODUÇÃO DE PU DA MONTADORA
            </span>
            <span className="text-[10px] font-f1-mono text-zinc-400">
              Cada equipe cliente exige 8 motores por ano e consome 1 slot de manufatura da fábrica:
            </span>
          </div>
          <span className={`text-[10px] font-f1-mono px-2.5 py-1 font-bold uppercase ${
            isCapacityFull
              ? 'bg-red-950/60 text-red-300 border border-red-500/40'
              : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
          }`}>
            {isCapacityFull ? '100% OPERANDO NO LIMITE' : `${capacityPercent}% CAPACIDADE ATIVA`}
          </span>
        </div>

        {/* Barra de Progresso de Capacidade */}
        <div className="space-y-1.5 pt-1">
          <div className="w-full bg-zinc-900 h-3 border border-white/10 overflow-hidden relative">
            <div
              className={`h-full transition-all duration-500 ${
                activeCount === 0
                  ? 'bg-emerald-500'
                  : activeCount === 1
                  ? 'bg-amber-400'
                  : 'bg-gradient-to-r from-amber-500 to-red-500'
              }`}
              style={{ width: `${capacityPercent}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] font-f1-mono text-zinc-400 font-bold">
            <span>0 CLIENTES (0%)</span>
            <span className={activeCount === 1 ? 'text-amber-400 font-black' : ''}>1 CLIENTE (50% - +50% TEMPO P&D)</span>
            <span className={activeCount === 2 ? 'text-red-400 font-black' : ''}>2 CLIENTES (100% - DOBRO DO TEMPO)</span>
          </div>
        </div>

        {isCapacityFull && (
          <div className="p-3 bg-red-950/30 border border-red-500/40 text-xs font-f1-mono text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>
              <strong>Capacidade da fábrica esgotada. Expanda as instalações.</strong> Você atingiu o teto regulamentar de fornecimento simultâneo para 2 equipes. Seus próprios upgrades de motor demoram o dobro do tempo para serem usinados.
            </span>
          </div>
        )}
      </div>

      {/* OS PRÓS E CONTRAS & REGRAS REGULAMENTARES (2 COLUNAS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Bônus de Caixa & Regra da Paridade FIA */}
        <div className="bg-[#1C1C26] border border-emerald-500/40 p-4 space-y-2.5 f1-container-bucket">
          <div className="flex items-center gap-2 text-emerald-400 font-f1-wide font-black text-xs uppercase">
            <ShieldCheck className="w-4 h-4" />
            <span>O Bônus no Caixa & Paridade FIA (Art. 28.5)</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed font-f1-mono">
            <strong>O Bônus:</strong> Ao assinar com um cliente, a equipe recebe <span className="text-emerald-400 font-bold">+$15.0M no Caixa</span> (dinheiro real) por ano. Esse valor NÃO entra no Teto de Gastos (é considerado receita comercial de venda de hardware).
          </p>
          <div className="p-2.5 bg-[#15151E] border border-white/5 text-[11px] font-f1-mono text-zinc-400">
            <strong className="text-amber-400">Regra da FIA (Paridade):</strong> Você é legalmente obrigado a entregar o mesmo motor que usa. É proibido fornecer uma versão "capada" e guardar a melhor para si. Todas as melhorias serão automaticamente replicadas para os clientes.
          </div>
        </div>

        {/* Card 2: Gargalo de Produção & O Espião */}
        <div className="bg-[#1C1C26] border border-amber-500/40 p-4 space-y-2.5 f1-container-bucket">
          <div className="flex items-center gap-2 text-amber-400 font-f1-wide font-black text-xs uppercase">
            <AlertTriangle className="w-4 h-4" />
            <span>O Ônus da Manufatura & O Espião Industrial</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed font-f1-mono">
            <strong>Gargalo Fabril:</strong> Cada cliente consome 1 slot de manufatura. Se vender para 2 equipes, seus próprios upgrades de motor demoram o <span className="text-amber-400 font-bold">dobro do tempo (2.0x)</span> para serem produzidos.
          </p>
          <div className="p-2.5 bg-[#15151E] border border-white/5 text-[11px] font-f1-mono text-zinc-400">
            <strong className="text-red-400">O Espião:</strong> Cuidado! Ao vender nosso motor, os engenheiros da IA rival aprenderão com o nosso design e telemetria. A equipe cliente evoluirá <span className="text-white font-bold">10% mais rápido</span> no ano seguinte.
          </div>
        </div>
      </div>

      {/* LISTA DE EQUIPES MENORES / CLIENTES DISPONÍVEIS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <h2 className="font-f1-wide font-black text-sm lg:text-base text-white uppercase tracking-wider">
            Propostas de Fornecimento de Motor no Grid
          </h2>
          <span className="text-[10px] font-f1-mono text-zinc-400">
            {activeCount} de {maxPuClientsCapacity} contratos assinados
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PU_CLIENT_PROPOSALS.map(proposal => {
            const activeContract = activeClients.find(c => c.proposalId === proposal.id);
            const isSigned = Boolean(activeContract);

            return (
              <div
                key={proposal.id}
                className={`p-5 border-2 transition-all f1-container-bucket space-y-4 ${
                  isSigned
                    ? 'bg-[#1C1C26] border-emerald-500/70 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                    : 'bg-[#1C1C26] border-white/10 hover:border-white/20'
                }`}
              >
                {/* Header do Card com Nome e Identidade da Equipe */}
                <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-4 h-4 rounded-full inline-block shrink-0 shadow-sm"
                      style={{ backgroundColor: proposal.color }}
                    />
                    <div>
                      <h3 className="font-f1-wide font-black text-sm text-white uppercase">
                        {proposal.teamName}
                      </h3>
                      <span className="text-[10px] font-f1-mono text-zinc-400">
                        Sede: {proposal.country} · Tag: {proposal.shortName}
                      </span>
                    </div>
                  </div>

                  {isSigned ? (
                    <span className="text-[10px] font-f1-mono bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-2 py-1 font-bold inline-flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      CONTRATO ATIVO
                    </span>
                  ) : (
                    <span className="text-[10px] font-f1-mono bg-zinc-800 text-zinc-400 border border-white/10 px-2 py-1 font-bold uppercase shrink-0">
                      DISPONÍVEL
                    </span>
                  )}
                </div>

                {/* Métricas Financeiras e Duração */}
                <div className="grid grid-cols-2 gap-3 text-xs font-f1-mono">
                  <div className="bg-[#15151E] p-2.5 border border-white/5">
                    <span className="text-[9px] text-zinc-500 uppercase block font-bold">VALOR DO CONTRATO</span>
                    <span className="text-emerald-400 font-f1-wide font-black text-sm">
                      ${(proposal.annualPayment / 1000000).toFixed(1)}M / ANO
                    </span>
                    <span className="text-[9px] text-zinc-500 block mt-0.5">Caixa direto (Sem Cost Cap)</span>
                  </div>

                  <div className="bg-[#15151E] p-2.5 border border-white/5">
                    <span className="text-[9px] text-zinc-500 uppercase block font-bold">DURAÇÃO DO ACORDO</span>
                    <span className="text-white font-f1-wide font-black text-sm">
                      {isSigned && activeContract
                        ? `${activeContract.seasonsRemaining} Temporada(s) Restante(s)`
                        : `${proposal.durationSeasons} Temporada(s)`}
                    </span>
                    <span className="text-[9px] text-zinc-500 block mt-0.5">
                      {isSigned && activeContract ? `Assinado no ano ${activeContract.signedInYear}` : 'Renovação anual'}
                    </span>
                  </div>
                </div>

                {/* Descrição e Demandas Técnicas */}
                <div className="space-y-2 text-xs font-f1-mono">
                  <p className="text-zinc-300 leading-relaxed">
                    {proposal.description}
                  </p>
                  <div className="p-2.5 bg-[#15151E] border border-white/5 text-[11px] text-zinc-400">
                    <strong className="text-white">Demanda Técnica:</strong> {proposal.technicalDemands}
                  </div>
                </div>

                {/* Monitor de Ocorrências (Se Ativo) */}
                {isSigned && activeContract && (
                  <div className="p-3 bg-zinc-900 border border-white/10 space-y-1.5 text-xs font-f1-mono">
                    <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                      MONITOR DE CRISES COM A EQUIPE
                    </span>
                    <div className="flex justify-between text-[11px]">
                      <span>Quebras de Motor: <strong className={activeContract.engineFailureCount > 0 ? 'text-red-400' : 'text-emerald-400'}>{activeContract.engineFailureCount}</strong></span>
                      <span>Lentidão Consecutiva: <strong className={activeContract.consecutiveSlowestRaces > 0 ? 'text-amber-400' : 'text-emerald-400'}>{activeContract.consecutiveSlowestRaces} / 3</strong></span>
                    </div>
                    {activeContract.consecutiveSlowestRaces >= 2 && (
                      <span className="text-[10px] text-red-400 font-bold block">
                        ⚠️ Alerta Crítico: Mais 1 corrida como o mais lento e a equipe rescindirá o contrato!
                      </span>
                    )}
                  </div>
                )}

                {/* Botões de Ação */}
                <div className="pt-2">
                  {isSigned && activeContract ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-f1-mono text-emerald-400 font-bold">
                        ✓ Fornecimento ativo e paridade FIA assegurada
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          playRadioSound();
                          terminatePuClient(activeContract.id);
                        }}
                        className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/40 font-f1-mono text-xs uppercase font-bold transition-all cursor-pointer"
                      >
                        Rescindir Acordo
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isCapacityFull}
                      onClick={() => {
                        playRadioSound();
                        signPuClient(proposal.id);
                      }}
                      className={`w-full py-3 font-f1-wide font-black text-xs uppercase tracking-wider f1-tab-chamfer transition-all flex items-center justify-center gap-2 shadow-md ${
                        isCapacityFull
                          ? 'bg-zinc-800 text-zinc-500 border border-white/10 cursor-not-allowed'
                          : 'bg-[#E10600] hover:bg-[#c20500] text-white cursor-pointer'
                      }`}
                    >
                      {isCapacityFull ? (
                        <>
                          <Lock className="w-4 h-4 text-zinc-500" />
                          <span>Capacidade da fábrica esgotada. Expanda as instalações.</span>
                        </>
                      ) : (
                        <>
                          <FileSignature className="w-4 h-4" />
                          <span>Assinar Contrato (+${(proposal.annualPayment / 1000000).toFixed(1)}M/ano)</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
