import React, { useState } from 'react';
import { Gauge, Wind, Cpu, ShieldCheck, Flame, Sliders } from 'lucide-react';
import { useGame } from '../../context/GameContext';

interface TelemetryMetric {
  id: string;
  label: string;
  category: 'AERO_STRAIGHT' | 'CORNERING' | 'CHASSIS_SYSTEMS';
  value: number;
  gridAverage: number;
  gridRank: number;
}

interface PowerUnitStats {
  name: string;
  dna: string;
  peakPower: number;
  hp: number;
  thermalReliability: number;
  fuelEfficiency: number;
  ersManagement: number;
  lightnessIndex: number;
  weightKg: number;
}

const INITIAL_CAR_METRICS: TelemetryMetric[] = [
  { id: 'top_speed',      label: 'Velocidade Máxima (Top Speed)',         category: 'AERO_STRAIGHT',  value: 68, gridAverage: 65, gridRank: 9  },
  { id: 'active_aero',   label: 'Eficiência Asa Ativa (Modo X / DRS)',   category: 'AERO_STRAIGHT',  value: 46, gridAverage: 60, gridRank: 19 },
  { id: 'low_speed',     label: 'Curvas de Baixa Velocidade',             category: 'CORNERING',      value: 58, gridAverage: 62, gridRank: 15 },
  { id: 'medium_speed',  label: 'Curvas de Média Velocidade',             category: 'CORNERING',      value: 82, gridAverage: 64, gridRank: 3  },
  { id: 'high_speed',    label: 'Curvas de Alta Velocidade',              category: 'CORNERING',      value: 91, gridAverage: 63, gridRank: 1  },
  { id: 'dirty_air',     label: 'Fluxo de Ar / Tolerância Ar Sujo',      category: 'CHASSIS_SYSTEMS', value: 51, gridAverage: 61, gridRank: 17 },
  { id: 'tyre_pres',     label: 'Preservação de Pneus (Chassi)',          category: 'CHASSIS_SYSTEMS', value: 66, gridAverage: 64, gridRank: 11 },
  { id: 'cooling',       label: 'Refrigeração do Motor & Freios',         category: 'CHASSIS_SYSTEMS', value: 89, gridAverage: 65, gridRank: 1  },
];

export const EngineeringPerformanceTelemetry: React.FC = () => {
  const { playerTeam, motorHomologadoFIA, vehiclePhysics, drivers } = useGame();

  // Build PU stats from context, falling back to sensible defaults
  const puStats: PowerUnitStats = {
    name: playerTeam?.carModelName || 'GAR 01 2026',
    dna: motorHomologadoFIA?.dna || 'DNA DO PILOTO · ADERÊNCIA MECÂNICA',
    peakPower:        motorHomologadoFIA?.peakPower        ?? vehiclePhysics?.summary?.carRating    ?? 83,
    hp:               motorHomologadoFIA?.hp               ?? Math.round(vehiclePhysics?.totalWheelPowerKw * 1.36) ?? 1077,
    thermalReliability: motorHomologadoFIA?.thermalReliability ?? vehiclePhysics?.summary?.reliabilityScore ?? 71,
    fuelEfficiency:   motorHomologadoFIA?.fuelEfficiency   ?? 95,
    ersManagement:    motorHomologadoFIA?.ersManagement    ?? vehiclePhysics?.summary?.carRating    ?? 84,
    lightnessIndex:   motorHomologadoFIA?.lightnessIndex   ?? 99,
    weightKg:         motorHomologadoFIA?.weightKg         ?? 173,
  };

  const [selectedCar, setSelectedCar] = useState<1 | 2>(1);
  const [isSandboxMode, setIsSandboxMode] = useState(false);
  const [metrics, setMetrics] = useState<TelemetryMetric[]>(INITIAL_CAR_METRICS);

  const overallRank = Math.round(
    metrics.reduce((acc, m) => acc + m.gridRank, 0) / metrics.length
  );

  const getRankStyling = (rank: number) => {
    if (rank === 1)   return { text: 'text-fuchsia-400', bar: 'bg-fuchsia-500' };
    if (rank <= 5)    return { text: 'text-cyan-400',    bar: 'bg-cyan-400'    };
    if (rank <= 14)   return { text: 'text-zinc-100',    bar: 'bg-zinc-200'    };
    return               { text: 'text-amber-500',   bar: 'bg-amber-500'   };
  };

  const handleSliderChange = (id: string, newValue: number) => {
    setMetrics(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const diff = newValue - item.gridAverage;
        const estimatedRank = Math.max(1, Math.min(22, Math.round(11 - diff * 0.35)));
        return { ...item, value: newValue, gridRank: estimatedRank };
      })
    );
  };

  const car1Driver = drivers?.find(d => d.seat === 'driver1' || d.seat === 1);
  const car2Driver = drivers?.find(d => d.seat === 'driver2' || d.seat === 2);

  const renderMetricRow = (metric: TelemetryMetric) => {
    const style = getRankStyling(metric.gridRank);
    return (
      <div key={metric.id} className="py-2.5 border-b border-zinc-800/80 last:border-none">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-semibold text-zinc-200 tracking-wide">{metric.label}</span>
          <div className="flex items-center gap-3">
            {isSandboxMode && (
              <span className="font-mono text-[11px] text-zinc-400">
                Índice: <strong className="text-white">{metric.value}</strong>/100
              </span>
            )}
            <span className={`font-black font-mono text-sm ${style.text}`}>
              {metric.gridRank}º
            </span>
          </div>
        </div>
        {/* Progress bar + grid average marker */}
        <div className="relative h-2.5 w-full bg-zinc-900 rounded-sm border border-zinc-800">
          <div
            className={`h-full transition-all duration-200 rounded-l-sm ${style.bar}`}
            style={{ width: `${metric.value}%` }}
          />
          {/* White vertical marker = Average on Grid */}
          <div
            title={`Média do Grid: ${metric.gridAverage}/100`}
            className="absolute top-[-4px] bottom-[-4px] w-[2px] bg-white shadow-[0_0_6px_rgba(255,255,255,0.9)] z-10"
            style={{ left: `${metric.gridAverage}%` }}
          />
          {/* Transparent overlay slider when sandbox is on */}
          {isSandboxMode && (
            <input
              type="range" min={10} max={100} value={metric.value}
              onChange={e => handleSliderChange(metric.id, Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#0b0c10] text-zinc-100 p-4 rounded-lg border border-zinc-800">

      {/* LEFT – PU Dynamometer */}
      <div className="lg:col-span-5 bg-[#111318] border border-emerald-900/50 rounded-md p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700/60 text-emerald-400 text-[10px] font-bold tracking-widest uppercase">
                <ShieldCheck size={12} /> Unidade de Potência Homologada
              </span>
              <h2 className="text-xl font-black tracking-wider text-white mt-2">{puStats.name}</h2>
              <p className="text-[11px] font-mono text-cyan-400 mt-0.5">DNA: {puStats.dna}</p>
            </div>
            <Cpu size={28} className="text-emerald-500/70" />
          </div>

          <p className="text-[11px] font-bold tracking-widest text-zinc-500 uppercase mb-4">
            Atributos Oficiais Homologados (FIA 2026)
          </p>

          <div className="space-y-4 font-mono text-xs">
            {/* Peak Power */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-zinc-300 font-bold">POTÊNCIA DE PICO ({puStats.hp} CV)</span>
                <span className="text-white font-bold">{puStats.peakPower} / 100</span>
              </div>
              <div className="h-2 w-full bg-zinc-900 rounded-sm overflow-hidden">
                <div className="h-full bg-gradient-to-r from-red-600 to-orange-500" style={{ width: `${puStats.peakPower}%` }} />
              </div>
            </div>
            {/* Thermal Reliability */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-zinc-300 font-bold">CONFIABILIDADE TÉRMICA & MECÂNICA</span>
                <span className="text-amber-400 font-bold">{puStats.thermalReliability} / 100</span>
              </div>
              <div className="h-2 w-full bg-zinc-900 rounded-sm overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: `${puStats.thermalReliability}%` }} />
              </div>
            </div>
            {/* Fuel Efficiency */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-zinc-300 font-bold">EFICIÊNCIA DE COMBUSTÍVEL (E-FUEL)</span>
                <span className="text-emerald-400 font-bold">{puStats.fuelEfficiency} / 100</span>
              </div>
              <div className="h-2 w-full bg-zinc-900 rounded-sm overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${puStats.fuelEfficiency}%` }} />
              </div>
            </div>
            {/* ERS Management */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-zinc-300 font-bold">GESTÃO DE ENERGIA (ERS 350kW)</span>
                <span className="text-indigo-400 font-bold">{puStats.ersManagement} / 100</span>
              </div>
              <div className="h-2 w-full bg-zinc-900 rounded-sm overflow-hidden">
                <div className="h-full bg-indigo-500" style={{ width: `${puStats.ersManagement}%` }} />
              </div>
            </div>
            {/* Lightness Index */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-zinc-300 font-bold">ÍNDICE DE LEVEZA ({puStats.weightKg} kg)</span>
                <span className="text-cyan-400 font-bold">{puStats.lightnessIndex} / 100</span>
              </div>
              <div className="h-2 w-full bg-zinc-900 rounded-sm overflow-hidden">
                <div className="h-full bg-cyan-400" style={{ width: `${puStats.lightnessIndex}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Thermal warning */}
        <div className="mt-6 p-3 rounded bg-amber-950/30 border border-amber-800/50 flex items-start gap-2.5 text-[11px] text-amber-200/90">
          <Flame size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <span>
            <strong>Margem Térmica ({puStats.thermalReliability}/100):</strong> Priorize{' '}
            <em>Refrigeração</em> e <em>Fluxo de Ar</em> nos Sidepods para evitar cortes de
            potência em corrida.
          </span>
        </div>
      </div>

      {/* RIGHT – Grid Performance Telemetry */}
      <div className="lg:col-span-7 bg-[#111318] border border-zinc-800 rounded-md p-5 flex flex-col">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Gauge size={18} className="text-red-500" />
              <h3 className="text-base font-black tracking-wider uppercase text-white">
                CARRO {selectedCar} — PERFORMANCE NO GRID
              </h3>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xs text-zinc-400">Ranking Geral Atual:</span>
              <span className="text-2xl font-black text-white font-mono">
                {overallRank}º{' '}
                <span className="text-xs font-normal text-zinc-500">/ 22 carros</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSandboxMode(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold border transition-colors ${
                isSandboxMode
                  ? 'bg-red-600/20 border-red-500 text-red-400'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500'
              }`}
            >
              <Sliders size={13} />
              {isSandboxMode ? 'Simulando Alvos P&D' : 'Ajustar Alvos P&D'}
            </button>
            <div className="flex rounded overflow-hidden border border-zinc-700 text-xs font-bold">
              <button
                onClick={() => setSelectedCar(1)}
                className={`px-3 py-1.5 ${selectedCar === 1 ? 'bg-red-600 text-white' : 'bg-zinc-900 text-zinc-400'}`}
              >
                CAR 1{car1Driver ? ` · ${car1Driver.name.split(' ').pop()}` : ''}
              </button>
              <button
                onClick={() => setSelectedCar(2)}
                className={`px-3 py-1.5 ${selectedCar === 2 ? 'bg-red-600 text-white' : 'bg-zinc-900 text-zinc-400'}`}
              >
                CAR 2{car2Driver ? ` · ${car2Driver.name.split(' ').pop()}` : ''}
              </button>
            </div>
          </div>
        </div>

        {/* Group 1: Straight-line & Active Aero */}
        <div className="mb-4">
          <div className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-1 flex items-center gap-1.5">
            <Wind size={12} /> Aerodinâmica & Velocidade Final
          </div>
          {metrics.filter(m => m.category === 'AERO_STRAIGHT').map(renderMetricRow)}
        </div>

        {/* Group 2: Cornering */}
        <div className="mb-4">
          <div className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-1">
            Desempenho em Curvas (Cornering)
          </div>
          {metrics.filter(m => m.category === 'CORNERING').map(renderMetricRow)}
        </div>

        {/* Group 3: Chassis Systems */}
        <div>
          <div className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-1">
            Chassi, Fluxo de Ar & Sistemas
          </div>
          {metrics.filter(m => m.category === 'CHASSIS_SYSTEMS').map(renderMetricRow)}
        </div>

        {/* Legend footer */}
        <div className="mt-5 pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="inline-block w-[3px] h-3.5 bg-white shadow-[0_0_5px_#fff]" />
            <span>Média do Grid (Average on Grid)</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px]">
            <span className="text-fuchsia-400">■ 1º Líder</span>
            <span className="text-cyan-400">■ Top 5</span>
            <span className="text-zinc-200">■ Meio Pelotão</span>
            <span className="text-amber-500">■ Fundo Grid</span>
          </div>
        </div>
      </div>
    </div>
  );
};
