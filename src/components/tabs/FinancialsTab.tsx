import React from 'react';
import { useGame } from '../../context/GameContext';
import { F1TabBucket } from '../brand/F1Logo';
import {
  DollarSign,
  ShieldAlert,
  Award,
  TrendingUp,
  Percent,
  CheckCircle,
  AlertTriangle,
  Scale,
  Users,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  FileSignature,
  ArrowRight
} from 'lucide-react';

export const FinancialsTab: React.FC = () => {
  const {
    financials,
    sponsors,
    playerTeam,
    puClients,
    maxPuClientsCapacity,
    setActiveTab,
    playRadioSound,
    currentWeek,
    seasonYear,
    baseDeFas,
    receitaMarketing,
    receitaMerchandising,
    baseDeFasHistory
  } = useGame();

  const isWorksTeam =
    playerTeam?.isManufacturer ||
    playerTeam?.engineOrigin === 'bought_factory' ||
    playerTeam?.engineOrigin === 'phoenix';

  const activeClients = puClients?.filter(c => c.status === 'active') || [];
  const totalClientRevenue = activeClients.reduce((sum, c) => sum + c.annualPayment, 0);

  const spentPercent = Math.min(100, Math.round((financials.costCapSpent / financials.costCapLimit) * 100));
  const remainingCostCap = financials.costCapLimit - financials.costCapSpent;
  const isCapBreached = financials.costCapSpent > financials.costCapLimit;

  // Cálculos Comerciais
  const currentFans = baseDeFas || 5000000;
  const currentMarketing = receitaMarketing || 2000000;
  const currentMerch = receitaMerchandising || 500000;
  const totalCommercialAnnual = currentMarketing + currentMerch;
  const monthlyCommercialPayout = Math.round(totalCommercialAnnual / 12);

  // Histórico de Fãs para o gráfico
  const fanPoints = baseDeFasHistory && baseDeFasHistory.length > 0
    ? baseDeFasHistory
    : [{ round: 0, raceName: 'Início', fans: currentFans, changePercent: 0 }];

  const maxFans = Math.max(...fanPoints.map(p => p.fans), 10000000) * 1.1;
  const minFans = Math.min(...fanPoints.map(p => p.fans), 1000000) * 0.9;
  const fanRange = maxFans - minFans || 1;

  // Gerador de coordenadas SVG para o gráfico de evolução
  const svgWidth = 650;
  const svgHeight = 140;
  const paddingX = 40;
  const paddingY = 20;
  const chartW = svgWidth - paddingX * 2;
  const chartH = svgHeight - paddingY * 2;

  const pointsCoords = fanPoints.map((pt, idx) => {
    const x = fanPoints.length === 1
      ? paddingX + chartW / 2
      : paddingX + (idx / (fanPoints.length - 1)) * chartW;
    const y = paddingY + chartH - ((pt.fans - minFans) / fanRange) * chartH;
    return { ...pt, x, y };
  });

  const pathD = pointsCoords.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, '');

  const areaD = pointsCoords.length > 0
    ? `${pathD} L ${pointsCoords[pointsCoords.length - 1].x},${paddingY + chartH} L ${pointsCoords[0].x},${paddingY + chartH} Z`
    : '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#1C1C26] border border-white/10 p-5 f1-pattern-micro-grid">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-f1-mono text-[#E10600] font-bold tracking-widest uppercase">
              SECTION 2.2 & 7: FIA COST CAP AUDIT & COMMERCIAL OPERATIONS
            </span>
            <h1 className="font-f1-wide font-black text-xl lg:text-2xl text-white uppercase mt-0.5">
              Financial & Cost Cap Ledger
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
              Strict legal separation between Real Cash (Caixa) and the $135.0M FIA Financial Regulations Cost Cap. 
              Breaching the Cost Cap triggers severe FIA sporting sanctions, point deduction, and ATR tunnel penalties.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-[#15151E] p-3 border border-white/5 text-right">
              <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">BANK RESERVES</span>
              <span className="text-sm font-f1-mono font-bold text-emerald-400 tabular-nums">
                ${(financials.bankBalance / 1000000).toFixed(1)}M
              </span>
            </div>
            <div className="bg-[#15151E] p-3 border border-white/5 text-right">
              <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">CAP EXPENDITURE</span>
              <span className={`text-sm font-f1-mono font-bold tabular-nums ${isCapBreached ? 'text-[#E10600]' : 'text-white'}`}>
                ${(financials.costCapSpent / 1000000).toFixed(1)}M / $135M
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Cost Cap Bar */}
      <F1TabBucket title="FIA COST CAP AUDIT ENVELOPE ($135.0M LIMIT)" badge={`SEASON ${seasonYear}`}>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-f1-mono">
            <div>
              <span className="text-zinc-400">EXPENDITURE COMMITTED:</span>{' '}
              <span className="text-white font-bold">${(financials.costCapSpent / 1000000).toFixed(2)}M</span>
            </div>
            <div>
              <span className="text-zinc-400">HEADROOM REMAINING:</span>{' '}
              <span className={`font-bold ${isCapBreached ? 'text-red-400' : 'text-emerald-400'}`}>
                ${(remainingCostCap / 1000000).toFixed(2)}M ({100 - spentPercent}%)
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-4 w-full bg-[#15151E] border border-white/10 p-0.5 relative">
            <div
              className={`h-full transition-all duration-500 ${
                isCapBreached
                  ? 'bg-red-600'
                  : spentPercent > 85
                  ? 'bg-amber-500'
                  : 'bg-[#E10600]'
              }`}
              style={{ width: `${Math.min(100, spentPercent)}%` }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-f1-mono pt-2">
            <div className="bg-[#15151E] p-3 border border-white/5">
              <span className="text-[10px] text-zinc-500 block uppercase">CAD & R&D EXPENDITURE</span>
              <span className="text-white font-bold">$22.4M</span>
            </div>
            <div className="bg-[#15151E] p-3 border border-white/5">
              <span className="text-[10px] text-zinc-500 block uppercase">MANUFACTURING & FREIGHT</span>
              <span className="text-white font-bold">$12.8M</span>
            </div>
            <div className="bg-[#15151E] p-3 border border-white/5">
              <span className="text-[10px] text-zinc-500 block uppercase">FACILITY AMORTIZATION</span>
              <span className="text-white font-bold">$6.8M</span>
            </div>
          </div>
        </div>
      </F1TabBucket>

      {/* Departamento Comercial (Marketing, Fãs & Merchandising) */}
      <F1TabBucket
        title="DEPARTAMENTO COMERCIAL & RECEITAS DE MARKETING"
        badge="ISENTO DO TETO DE GASTOS FIA (COST CAP EXEMPT)"
      >
        <div className="space-y-6">
          {/* 3 Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Base de Fãs */}
            <div className="bg-[#15151E] p-4 border border-white/5 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-f1-mono text-zinc-400 uppercase tracking-wider">
                  BASE DE FÃS GLOBAL
                </span>
                <Users className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-f1-wide font-black text-white tabular-nums">
                {(currentFans / 1000000).toFixed(2)}M <span className="text-xs font-normal text-zinc-400">fãs</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-2 font-f1-mono leading-tight">
                Vitória (+5%), Pódio (+3%), Top 5 (+1%), Falha (-0.5%). Eventos com pilotos aceleram engajamento.
              </p>
            </div>

            {/* Card 2: Receita de Marketing */}
            <div className="bg-[#15151E] p-4 border border-white/5 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-f1-mono text-zinc-400 uppercase tracking-wider">
                  RECEITA DE MARKETING
                </span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-f1-wide font-black text-emerald-400 tabular-nums">
                ${(currentMarketing / 1000000).toFixed(2)}M <span className="text-xs font-normal text-zinc-400">/ ano</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-2 font-f1-mono leading-tight">
                Repasse mensal de <strong className="text-white">+${(currentMarketing / 12 / 1000000).toFixed(2)}M/mês</strong>. Piloto único nacional atrai marcas locais.
              </p>
            </div>

            {/* Card 3: Receita de Merchandising */}
            <div className="bg-[#15151E] p-4 border border-white/5 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-f1-mono text-zinc-400 uppercase tracking-wider">
                  RECEITA DE MERCHANDISING
                </span>
                <ShoppingBag className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-f1-wide font-black text-amber-400 tabular-nums">
                ${(currentMerch / 1000000).toFixed(2)}M <span className="text-xs font-normal text-zinc-400">/ ano</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-2 font-f1-mono leading-tight">
                <strong className="text-amber-300">Bônus Corrida em Casa:</strong> Receita multiplicada em 3x no GP do país do seu piloto!
              </p>
            </div>
          </div>

          {/* Banner de Isenção do Teto de Gastos */}
          <div className="bg-emerald-950/20 border border-emerald-500/30 p-3.5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <span className="font-f1-wide font-bold text-emerald-300 uppercase block tracking-wider text-[11px]">
                REPASSE MENSAL DIRETO NO CAIXA • 100% ISENTO DO COST CAP
              </span>
              <p className="text-zinc-300 font-f1-mono leading-relaxed">
                A cada 4 semanas, <strong className="text-white">${(monthlyCommercialPayout / 1000000).toFixed(2)}M</strong> (Marketing + Merchandising) entram diretamente no saldo bancário da equipe para custear operações, salários e contratações, sem consumir nenhum centavo do limite regulamentar de $135.0M da FIA.
              </p>
            </div>
          </div>

          {/* Gráfico de Evolução da Base de Fãs */}
          <div className="bg-[#15151E] border border-white/5 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-f1-wide font-bold text-white uppercase tracking-wider">
                  EVOLUÇÃO DA BASE DE FÃS AO LONGO DA TEMPORADA
                </span>
              </div>
              <span className="text-[10px] font-f1-mono text-zinc-400">
                {fanPoints.length} Registro{fanPoints.length > 1 ? 's' : ''} de Etapa
              </span>
            </div>

            {/* SVG Line / Area Chart */}
            <div className="w-full overflow-x-auto">
              <div className="min-w-[550px]">
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-36">
                  <defs>
                    <linearGradient id="fansGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  {[0, 0.5, 1].map((ratio, i) => {
                    const lineY = paddingY + chartH * ratio;
                    const valFans = Math.round(maxFans - ratio * (maxFans - minFans));
                    return (
                      <g key={i}>
                        <line
                          x1={paddingX}
                          y1={lineY}
                          x2={svgWidth - paddingX}
                          y2={lineY}
                          stroke="#ffffff15"
                          strokeDasharray="3 3"
                        />
                        <text
                          x={paddingX - 6}
                          y={lineY + 3}
                          fill="#71717a"
                          fontSize="9"
                          textAnchor="end"
                          fontFamily="monospace"
                        >
                          {(valFans / 1000000).toFixed(1)}M
                        </text>
                      </g>
                    );
                  })}

                  {/* Area fill */}
                  {areaD && (
                    <path d={areaD} fill="url(#fansGradient)" />
                  )}

                  {/* Line stroke */}
                  {pathD && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Dots & Labels */}
                  {pointsCoords.map((pt, i) => (
                    <g key={i} className="group cursor-pointer">
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="4.5"
                        fill="#06b6d4"
                        stroke="#15151E"
                        strokeWidth="2"
                        className="transition-all hover:r-6 hover:fill-cyan-300"
                      />
                      <text
                        x={pt.x}
                        y={paddingY + chartH + 14}
                        fill="#a1a1aa"
                        fontSize="9"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {pt.round === 0 ? 'Pré-Temp' : `R${pt.round}`}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>

            {/* Micro feed of changes */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
              {fanPoints.slice(-5).map((pt, i) => (
                <div
                  key={i}
                  className="bg-[#1C1C26] px-2.5 py-1.5 border border-white/5 flex items-center gap-2 text-[10px] font-f1-mono"
                >
                  <span className="text-zinc-400">{pt.raceName}:</span>
                  <span className="text-white font-bold">{(pt.fans / 1000000).toFixed(2)}M</span>
                  {pt.changePercent !== 0 && (
                    <span className={pt.changePercent > 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                      {pt.changePercent > 0 ? `+${pt.changePercent}%` : `${pt.changePercent}%`}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </F1TabBucket>

      {/* Works Team Clients Commercial Revenue Section */}
      {isWorksTeam && (
        <div className="bg-[#1C1C26] border-2 border-emerald-500/40 p-5 f1-container-bucket space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-950/60 border border-emerald-500/50 flex items-center justify-center shrink-0">
                <FileSignature className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <span className="text-[10px] font-f1-mono text-emerald-400 font-bold uppercase tracking-widest block">
                  RECEITA COMERCIAL DA MONTADORA (WORKS TEAM)
                </span>
                <h3 className="font-f1-wide font-black text-sm lg:text-base text-white uppercase">
                  Fornecimento de Unidades de Potência para Clientes
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
              <span>Gerenciar Clientes de PU</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-f1-mono">
            <div className="bg-[#15151E] p-3 border border-white/5">
              <span className="text-[10px] text-zinc-500 uppercase block font-bold">RECEITA ANUAL TOTAL</span>
              <span className="text-emerald-400 font-f1-wide font-black text-base">
                +${(totalClientRevenue / 1000000).toFixed(1)}M / ANO
              </span>
              <span className="text-[9px] text-zinc-500 block mt-0.5">100% Isento do Cost Cap</span>
            </div>

            <div className="bg-[#15151E] p-3 border border-white/5">
              <span className="text-[10px] text-zinc-500 uppercase block font-bold">CONTRATOS ATIVOS</span>
              <span className="text-white font-f1-wide font-black text-base">
                {activeClients.length} de {maxPuClientsCapacity} Equipes Clientes
              </span>
              <span className="text-[9px] text-zinc-500 block mt-0.5">
                {activeClients.map(c => c.shortName).join(', ') || 'Nenhum contrato ativo'}
              </span>
            </div>

            <div className="bg-[#15151E] p-3 border border-white/5">
              <span className="text-[10px] text-zinc-500 uppercase block font-bold">REGULAMENTO FINANCEIRO</span>
              <span className="text-cyan-400 font-f1-wide font-black text-sm">
                ART. 5.1 FIA (VENDA DE PU)
              </span>
              <span className="text-[9px] text-zinc-500 block mt-0.5">
                Venda de hardware credita diretamente o Caixa
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Sponsors & Commercial Agreements (GDD Section 7) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {sponsors.map(sp => (
          <F1TabBucket
            key={sp.id}
            title={sp.name}
            badge={sp.type.toUpperCase() + ' PARTNER'}
          >
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-f1-mono text-zinc-400 block uppercase">CONTRACTUAL TARGET</span>
                <p className="text-xs font-f1-wide font-bold text-white mt-0.5">
                  {sp.targetObjective}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-f1-mono bg-[#15151E] p-2.5 border border-white/5">
                <div>
                  <span className="text-[10px] text-zinc-500 block">BASE RETAINER</span>
                  <span className="text-white font-bold">${(sp.annualPayout / 1000000).toFixed(1)}M/yr</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block">GP BONUS</span>
                  <span className="text-emerald-400 font-bold">+${(sp.raceBonus / 1000).toFixed(0)}k</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-f1-mono">
                  <span className="text-zinc-400">PARTNER SATISFACTION</span>
                  <span className="text-emerald-400 font-bold">{sp.satisfaction}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${sp.satisfaction}%` }}
                  />
                </div>
              </div>
            </div>
          </F1TabBucket>
        ))}
      </div>
    </div>
  );
};
