import React, { useMemo, useState } from 'react';
import {
  getRawGeoJsonFeatureMeta,
  loadAllAvailableCircuitPackages,
  loadCircuitHistoricalPackages,
} from '../../circuits/CircuitLoader';
import { evaluateTrackPhysics, type TrackPhysicsEvaluation } from '../../circuits/TrackPhysics';
import type { ProcessedCircuitPackage } from '../../circuits/types';
import { DEFAULT_VEHICLE_PARAMS, solveVehiclePhysics } from '../../engine/physicsEngine';
import type { VehicleEngineeringParameters, VehiclePhysicsOutputs } from '../../types/physics';
import { RealCircuitMap } from './RealCircuitMap';
import {
  Activity,
  AlertTriangle,
  ArrowUpDown,
  Calendar,
  Compass,
  Database,
  Flag,
  Gauge,
  Globe,
  Layers,
  MapPin,
  Search,
  ShieldCheck,
  Table2,
  Thermometer,
  Wind,
  X,
  Zap,
} from 'lucide-react';

interface GrandsPrixExplorerProps {
  seasonYear?: number;
  vehicleParams?: VehicleEngineeringParameters;
  vehiclePhysics?: VehiclePhysicsOutputs;
  currentCircuitId?: string;
  currentRound?: number;
  onEnterRaceWeekend?: () => void;
  onClose?: () => void;
}

type CircuitFilterMode =
  | 'all'
  | 'calendar_2026'
  | 'sprint'
  | 'reserve_historical'
  | 'high_aero'
  | 'mode_x_dominant';

type DetailTab = 'overview_map' | 'physics_m02' | 'segments_corners' | 'provenance';

type SortKey =
  | 'round'
  | 'officialLengthM'
  | 'officialCorners'
  | 'laps'
  | 'altitudeM'
  | 'pitLaneLossSec'
  | 'modeXFractionPct'
  | 'peakStraightSpeedKmh'
  | 'totalPredictedLapTimeSec';

interface EnrichedCircuitEntry {
  pkg: ProcessedCircuitPackage;
  trackPhysics: TrackPhysicsEvaluation;
  rawMeta: ReturnType<typeof getRawGeoJsonFeatureMeta>;
}

const SURFACE_LABEL: Record<string, string> = {
  permanent_race_asphalt: 'Asfalto Permanente de Competição',
  high_grip_resurfaced: 'Asfalto Recapeado de Alta Aderência',
  street_low_grip_asphalt: 'Asfalto Urbano / Baixa Aderência',
  abrasive_granite_asphalt: 'Asfalto Granítico Abrasivo',
};

const AERO_DEMAND_LABEL: Record<string, string> = {
  very_low: 'Muito Baixa (Low Drag)',
  low: 'Baixa',
  medium: 'Média / Equilibrada',
  high: 'Alta',
  very_high: 'Muito Alta (Máx. Carga)',
};

const RUNOFF_LABEL: Record<string, string> = {
  gravel: 'Caixa de Brita',
  asphalt_tarmac: 'Asfalto / Tarmac',
  concrete_wall: 'Muro Urbano / Concreto',
  grass_hybrid: 'Grama / Híbrido',
};

function formatLapTime(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return '—';
  const mins = Math.floor(sec / 60);
  const rem = sec - mins * 60;
  return `${mins}:${rem < 10 ? '0' : ''}${rem.toFixed(3)}`;
}

export const GrandsPrixExplorer: React.FC<GrandsPrixExplorerProps> = ({
  seasonYear = 2026,
  vehicleParams = DEFAULT_VEHICLE_PARAMS,
  vehiclePhysics,
  currentCircuitId,
  currentRound,
  onEnterRaceWeekend,
  onClose,
}) => {
  const effectivePhysics = useMemo(
    () => vehiclePhysics ?? solveVehiclePhysics(vehicleParams),
    [vehiclePhysics, vehicleParams]
  );

  const allEntries: EnrichedCircuitEntry[] = useMemo(() => {
    const pkgs = loadAllAvailableCircuitPackages(seasonYear);
    return pkgs.map((pkg) => ({
      pkg,
      trackPhysics: evaluateTrackPhysics(pkg, vehicleParams, effectivePhysics),
      rawMeta: getRawGeoJsonFeatureMeta(pkg.metadata.geojsonId),
    }));
  }, [seasonYear, vehicleParams, effectivePhysics]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<CircuitFilterMode>('all');
  const [viewLayout, setViewLayout] = useState<'inspector' | 'comparison'>('inspector');
  const [detailTab, setDetailTab] = useState<DetailTab>('overview_map');
  const [selectedCode, setSelectedCode] = useState<string>(
    currentCircuitId || allEntries[0]?.pkg.metadata.circuitCode || 'albert_park'
  );
  const [selectedVersionYear, setSelectedVersionYear] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('round');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allEntries.filter(({ pkg, trackPhysics }) => {
      const m = pkg.metadata;
      const inCurrentSeasonCal = m.inCalendar && m.seasonYear === seasonYear;
      if (filterMode === 'calendar_2026' && !inCurrentSeasonCal) return false;
      if (filterMode === 'sprint' && (!m.isSprint || !inCurrentSeasonCal)) return false;
      if (filterMode === 'reserve_historical' && inCurrentSeasonCal) return false;
      if (filterMode === 'high_aero' && m.aeroDemand !== 'high' && m.aeroDemand !== 'very_high') return false;
      if (filterMode === 'mode_x_dominant' && trackPhysics.modeXFractionPct < 45) return false;

      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.officialGpTitle.toLowerCase().includes(q) ||
        m.country.toLowerCase().includes(q) ||
        m.city.toLowerCase().includes(q) ||
        m.circuitCode.toLowerCase().includes(q) ||
        m.geojsonId.toLowerCase().includes(q)
      );
    });
  }, [allEntries, filterMode, searchQuery]);

  const sortedComparisonEntries = useMemo(() => {
    const copy = [...filteredEntries];
    copy.sort((a, b) => {
      const getVal = (e: EnrichedCircuitEntry): number => {
        switch (sortKey) {
          case 'round': {
            const inCal = e.pkg.metadata.inCalendar && e.pkg.metadata.seasonYear === seasonYear;
            return inCal ? e.pkg.metadata.round : 100 + e.pkg.metadata.officialLengthM / 10000;
          }
          case 'officialLengthM':
            return e.pkg.metadata.officialLengthM;
          case 'officialCorners':
            return e.pkg.metadata.officialCorners;
          case 'laps':
            return e.pkg.metadata.laps;
          case 'altitudeM':
            return e.pkg.trackCharacteristics.altitudeM;
          case 'pitLaneLossSec':
            return e.pkg.metadata.pitLaneLossSec;
          case 'modeXFractionPct':
            return e.trackPhysics.modeXFractionPct;
          case 'peakStraightSpeedKmh':
            return e.trackPhysics.peakStraightSpeedKmh;
          case 'totalPredictedLapTimeSec':
            return e.trackPhysics.totalPredictedLapTimeSec;
        }
      };
      const diff = getVal(a) - getVal(b);
      return sortAsc ? diff : -diff;
    });
    return copy;
  }, [filteredEntries, sortKey, sortAsc]);

  const historicalVersions = useMemo(() => {
    return loadCircuitHistoricalPackages(selectedCode);
  }, [selectedCode]);

  const activeEntry: EnrichedCircuitEntry = useMemo(() => {
    const baseEntry =
      allEntries.find((e) => e.pkg.metadata.circuitCode === selectedCode) ||
      filteredEntries[0] ||
      allEntries[0];

    if (selectedVersionYear !== null && historicalVersions.length > 0) {
      const match = historicalVersions.find((p) => p.metadata.seasonYear === selectedVersionYear);
      if (match) {
        return {
          pkg: match,
          trackPhysics: evaluateTrackPhysics(match, vehicleParams, effectivePhysics),
          rawMeta: getRawGeoJsonFeatureMeta(match.metadata.geojsonId),
        };
      }
    }
    return baseEntry;
  }, [allEntries, filteredEntries, selectedCode, selectedVersionYear, historicalVersions, vehicleParams, effectivePhysics]);

  const m = activeEntry.pkg.metadata;
  const tp = activeEntry.trackPhysics;
  const tc = activeEntry.pkg.trackCharacteristics;
  const val = activeEntry.pkg.validation;
  const raw = activeEntry.rawMeta;

  const totalCalendarCount = allEntries.filter(
    (e) => e.pkg.metadata.inCalendar && e.pkg.metadata.seasonYear === seasonYear
  ).length;
  const totalReserveCount = allEntries.length - totalCalendarCount;
  const sprintCount = allEntries.filter(
    (e) => e.pkg.metadata.isSprint && e.pkg.metadata.inCalendar && e.pkg.metadata.seasonYear === seasonYear
  ).length;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(key === 'round' || key === 'totalPredictedLapTimeSec');
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Explorer Header Bar */}
      <div className="bg-[#1C1C26] border border-white/10 p-5 f1-pattern-micro-grid">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-f1-mono text-[#E10600] font-bold uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5" />
              <span>CATÁLOGO INTEGRAL DE GRANDES PRÊMIOS & TELEMETRIA DE CIRCUITOS · {seasonYear}</span>
            </div>
            <h1 className="font-f1-wide font-black text-xl sm:text-2xl text-white uppercase mt-1">
              Todos os Circuitos, Traçados GeoJSON & Engenharia de Pista
            </h1>
            <p className="text-xs font-f1-mono text-zinc-400 mt-1">
              {totalCalendarCount} Etapas Oficiais do Calendário {seasonYear} · {sprintCount} Fins de Semana Sprint ·{' '}
              {totalReserveCount} Traçados de Reserva / Históricos ({allEntries.length} circuitos no banco)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setViewLayout('inspector')}
              className={`px-3.5 py-2 text-xs font-f1-wide font-bold uppercase tracking-wider border transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                viewLayout === 'inspector'
                  ? 'bg-[#E10600] border-[#E10600] text-white'
                  : 'bg-[#15151E] border-white/10 text-zinc-300 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Inspeção Completa</span>
            </button>
            <button
              type="button"
              onClick={() => setViewLayout('comparison')}
              className={`px-3.5 py-2 text-xs font-f1-wide font-bold uppercase tracking-wider border transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                viewLayout === 'comparison'
                  ? 'bg-[#E10600] border-[#E10600] text-white'
                  : 'bg-[#15151E] border-white/10 text-zinc-300 hover:text-white'
              }`}
            >
              <Table2 className="w-3.5 h-3.5" />
              <span>Tabela Comparativa ({filteredEntries.length})</span>
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-xs font-f1-wide font-bold uppercase tracking-wider bg-[#15151E] border border-white/15 text-zinc-300 hover:text-white cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Fechar</span>
              </button>
            )}
          </div>
        </div>

        {/* Search + Filter Bar */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por GP, circuito, país, cidade ou GeoJSON (ex: au-1953, madring)..."
              className="w-full bg-[#15151E] border border-white/10 pl-9 pr-3 py-2 text-xs font-f1-mono text-white placeholder:text-zinc-500 focus:border-[#E10600] focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', label: `Todos (${allEntries.length})` },
                { id: 'calendar_2026', label: `Calendário ${seasonYear} (${totalCalendarCount})` },
                { id: 'sprint', label: `Sprint (${sprintCount})` },
                { id: 'reserve_historical', label: `Reserva & Históricos (${totalReserveCount})` },
                { id: 'high_aero', label: 'Alta Carga Aero' },
                { id: 'mode_x_dominant', label: 'Modo X >= 45%' },
              ] as { id: CircuitFilterMode; label: string }[]
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterMode(f.id)}
                className={`px-2.5 py-1.5 text-[11px] font-f1-mono font-bold uppercase border transition-colors cursor-pointer whitespace-nowrap ${
                  filterMode === f.id
                    ? 'bg-white text-[#15151E] border-white'
                    : 'bg-[#15151E] text-zinc-400 border-white/10 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: COMPARATIVE TABLE OF ALL CIRCUITS */}
      {viewLayout === 'comparison' ? (
        <div className="bg-[#1C1C26] border border-white/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs font-f1-mono text-zinc-400">
            <span>Clique em qualquer coluna para ordenar ou clique em uma linha para abrir o dossiê completo do circuito.</span>
            <span className="tabular-nums text-white font-bold">{sortedComparisonEntries.length} circuitos exibidos</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-f1-mono">
              <thead>
                <tr className="bg-[#15151E] border-b border-white/10 text-[10px] text-zinc-400 uppercase">
                  <th className="py-2.5 px-3">
                    <button type="button" onClick={() => handleSort('round')} className="inline-flex items-center gap-1 hover:text-white cursor-pointer">
                      <span>Etapa</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-2.5 px-3">Grande Prêmio / Circuito</th>
                  <th className="py-2.5 px-3">Local / GeoJSON</th>
                  <th className="py-2.5 px-3 text-right">
                    <button type="button" onClick={() => handleSort('officialLengthM')} className="inline-flex items-center gap-1 hover:text-white cursor-pointer">
                      <span>Extensão</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-2.5 px-3 text-right">
                    <button type="button" onClick={() => handleSort('officialCorners')} className="inline-flex items-center gap-1 hover:text-white cursor-pointer">
                      <span>Curvas</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-2.5 px-3 text-right">
                    <button type="button" onClick={() => handleSort('laps')} className="inline-flex items-center gap-1 hover:text-white cursor-pointer">
                      <span>Voltas</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-2.5 px-3 text-right">
                    <button type="button" onClick={() => handleSort('altitudeM')} className="inline-flex items-center gap-1 hover:text-white cursor-pointer">
                      <span>Alt / ρ</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-2.5 px-3 text-right">
                    <button type="button" onClick={() => handleSort('modeXFractionPct')} className="inline-flex items-center gap-1 hover:text-white cursor-pointer">
                      <span>Modo X</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-2.5 px-3 text-right">
                    <button type="button" onClick={() => handleSort('peakStraightSpeedKmh')} className="inline-flex items-center gap-1 hover:text-white cursor-pointer">
                      <span>V_max</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-2.5 px-3 text-right">
                    <button type="button" onClick={() => handleSort('pitLaneLossSec')} className="inline-flex items-center gap-1 hover:text-white cursor-pointer">
                      <span>Pit Loss</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-2.5 px-3 text-right">
                    <button type="button" onClick={() => handleSort('totalPredictedLapTimeSec')} className="inline-flex items-center gap-1 hover:text-white cursor-pointer">
                      <span>Volta Prev.</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sortedComparisonEntries.map(({ pkg, trackPhysics }) => {
                  const meta = pkg.metadata;
                  const isCurrent = meta.circuitCode === currentCircuitId;
                  const inCurrentCal = meta.inCalendar && meta.seasonYear === seasonYear;
                  return (
                    <tr
                      key={`${meta.seasonYear}-${meta.circuitCode}`}
                      onClick={() => {
                        setSelectedCode(meta.circuitCode);
                        setSelectedVersionYear(null);
                        setViewLayout('inspector');
                      }}
                      className={`hover:bg-white/10 cursor-pointer transition-colors ${
                        isCurrent ? 'bg-[#E10600]/15' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 tabular-nums whitespace-nowrap">
                        <span className="font-bold text-white">
                          {inCurrentCal ? `R${String(meta.round).padStart(2, '0')}` : `RES (${meta.seasonYear})`}
                        </span>
                        {meta.isSprint && (
                          <span className="ml-1.5 text-[10px] text-amber-400 font-bold">SPRINT</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-white">{meta.officialGpTitle}</div>
                        <div className="text-[10px] text-zinc-400">{meta.name}</div>
                      </td>
                      <td className="py-2.5 px-3 text-zinc-300">
                        <div>{meta.city}, {meta.country}</div>
                        <div className="text-[10px] text-zinc-500">{meta.geojsonId} · {meta.gpDateIso}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-white">{meta.officialLengthM} m</td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-zinc-200">{meta.officialCorners}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-zinc-200">{meta.laps}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-cyan-300">
                        {pkg.trackCharacteristics.altitudeM}m · {trackPhysics.airDensityKgM3}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-emerald-400 font-bold">
                        {trackPhysics.modeXFractionPct}%
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-white">
                        {trackPhysics.peakStraightSpeedKmh} km/h
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-amber-300">
                        {meta.pitLaneLossSec.toFixed(1)}s
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-bold text-white">
                        {formatLapTime(trackPhysics.totalPredictedLapTimeSec)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VIEW MODE 2: SPLIT MASTER-DETAIL EXPLORER */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Master Scrollable Circuit Selector */}
          <div className="lg:col-span-4 bg-[#1C1C26] border border-white/10 overflow-hidden">
            <div className="px-3.5 py-2.5 bg-[#15151E] border-b border-white/10 flex items-center justify-between text-[11px] font-f1-mono">
              <span className="text-zinc-300 font-bold uppercase">
                Grandes Prêmios & Pistas ({filteredEntries.length})
              </span>
              <span className="text-zinc-500">GeoJSON Real</span>
            </div>

            {filteredEntries.length === 0 ? (
              <div className="p-6 text-center text-xs font-f1-mono text-zinc-400 space-y-2">
                <p>Nenhum circuito corresponde aos filtros aplicados.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterMode('all');
                  }}
                  className="px-3 py-1.5 bg-[#E10600] text-white font-bold uppercase cursor-pointer"
                >
                  Limpar Filtros
                </button>
              </div>
            ) : (
              <div className="max-h-[760px] overflow-y-auto divide-y divide-white/5">
                {filteredEntries.map(({ pkg, trackPhysics }) => {
                  const meta = pkg.metadata;
                  const isSelected = meta.circuitCode === m.circuitCode;
                  const isCurrentGp = meta.circuitCode === currentCircuitId;
                  const inCurrentCal = meta.inCalendar && meta.seasonYear === seasonYear;
                  return (
                    <button
                      key={`${meta.seasonYear}-${meta.circuitCode}`}
                      type="button"
                      onClick={() => {
                        setSelectedCode(meta.circuitCode);
                        setSelectedVersionYear(null);
                      }}
                      className={`w-full text-left p-3 transition-colors cursor-pointer flex items-center gap-3 ${
                        isSelected
                          ? 'bg-[#E10600]/20 border-r-2 border-r-[#E10600]'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      {/* Mini SVG Track Preview */}
                      <div className="w-16 h-12 bg-[#15151E] border border-white/10 p-1 shrink-0 flex items-center justify-center">
                        <svg viewBox={pkg.svgViewBox} className="w-full h-full">
                          <path
                            d={pkg.svgCenterlinePath}
                            fill="none"
                            stroke={isSelected ? '#E10600' : '#a1a1aa'}
                            strokeWidth={18}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 text-[10px] font-f1-mono">
                          <span className={inCurrentCal ? 'text-[#E10600] font-bold' : 'text-zinc-400 font-bold'}>
                            {inCurrentCal ? `ETAPA ${String(meta.round).padStart(2, '0')}` : `RESERVA / HIST. (${meta.seasonYear})`}
                            {meta.isSprint ? ' · SPRINT' : ''}
                            {isCurrentGp ? ' · PRÓXIMO GP' : ''}
                          </span>
                          <span className="text-zinc-500 tabular-nums">{meta.officialLengthM} m</span>
                        </div>
                        <div className="font-f1-wide font-bold text-xs text-white truncate mt-0.5">
                          {meta.officialGpTitle}
                        </div>
                        <div className="text-[10px] font-f1-mono text-zinc-400 truncate mt-0.5 tabular-nums">
                          {meta.name} · {meta.city} ({meta.geojsonId}) · {trackPhysics.modeXFractionPct}% Modo X
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Complete Technical & Historical Dossier */}
          <div className="lg:col-span-8 space-y-4">
            {/* Selected Circuit Hero Summary */}
            <div className="bg-[#1C1C26] border border-white/10 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-f1-mono text-zinc-400">
                    <span className="text-[#E10600] font-bold uppercase">
                      {m.inCalendar && m.seasonYear === seasonYear
                        ? `ETAPA ${m.round} DE ${totalCalendarCount}`
                        : `TRAÇADO RESERVA / HISTÓRICO (${m.seasonYear})`}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-zinc-500" />
                      {m.gpDateIso}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-zinc-500" />
                      {m.city}, {m.country}
                    </span>
                    {m.isSprint && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-400 font-bold uppercase">FDS Sprint</span>
                      </>
                    )}
                    {m.circuitCode === currentCircuitId && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-emerald-400 font-bold uppercase">
                          GP Atual (R{currentRound || m.round})
                        </span>
                      </>
                    )}
                  </div>

                  <h2 className="font-f1-wide font-black text-xl sm:text-2xl text-white uppercase mt-1">
                    {m.officialGpTitle} — {m.name}
                  </h2>
                  <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">{m.description}</p>
                </div>

                {/* Historical Season Snapshot Toggle + Race Weekend Jump */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {historicalVersions.length > 1 && (
                    <div className="flex items-center gap-1 bg-[#15151E] border border-white/10 p-1 text-[10px] font-f1-mono">
                      <span className="px-1.5 text-zinc-500 uppercase">Versão:</span>
                      {historicalVersions.map((ver) => {
                        const isActiveVer = m.seasonYear === ver.metadata.seasonYear;
                        return (
                          <button
                            key={ver.metadata.seasonYear}
                            type="button"
                            onClick={() => setSelectedVersionYear(ver.metadata.seasonYear)}
                            className={`px-2 py-0.5 font-bold cursor-pointer ${
                              isActiveVer ? 'bg-[#E10600] text-white' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            {ver.metadata.seasonYear}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {onEnterRaceWeekend && m.circuitCode === currentCircuitId && (
                    <button
                      type="button"
                      onClick={onEnterRaceWeekend}
                      className="px-3.5 py-2 bg-[#E10600] hover:bg-[#c20500] text-white font-f1-wide font-bold text-[11px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>Ir para Operações deste GP</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Key Telemetry KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs font-f1-mono">
                <div className="bg-[#15151E] border border-white/5 p-2.5">
                  <span className="text-[10px] text-zinc-500 uppercase block">EXTENSÃO OFICIAL</span>
                  <span className="text-base font-bold text-white tabular-nums">{m.officialLengthM} m</span>
                  <span className="text-[10px] text-zinc-400 block tabular-nums">{m.laps} voltas</span>
                </div>
                <div className="bg-[#15151E] border border-white/5 p-2.5">
                  <span className="text-[10px] text-zinc-500 uppercase block">DISTÂNCIA GP</span>
                  <span className="text-base font-bold text-white tabular-nums">{m.officialRaceDistanceKm} km</span>
                  <span className="text-[10px] text-zinc-400 block tabular-nums">{m.officialCorners} curvas ({activeEntry.pkg.corners.length} det.)</span>
                </div>
                <div className="bg-[#15151E] border border-white/5 p-2.5">
                  <span className="text-[10px] text-zinc-500 uppercase block">VOLTA PREVISTA SI</span>
                  <span className="text-base font-bold text-cyan-300 tabular-nums">{formatLapTime(tp.totalPredictedLapTimeSec)}</span>
                  <span className="text-[10px] text-zinc-400 block tabular-nums">Base: {formatLapTime(m.baseLapTimeSec)}</span>
                </div>
                <div className="bg-[#15151E] border border-white/5 p-2.5">
                  <span className="text-[10px] text-zinc-500 uppercase block">V_MAX / MODO X</span>
                  <span className="text-base font-bold text-emerald-400 tabular-nums">{tp.peakStraightSpeedKmh} km/h</span>
                  <span className="text-[10px] text-zinc-400 block tabular-nums">{tp.modeXFractionPct}% da volta</span>
                </div>
                <div className="bg-[#15151E] border border-white/5 p-2.5">
                  <span className="text-[10px] text-zinc-500 uppercase block">ALTITUDE / AR (ρ)</span>
                  <span className="text-base font-bold text-white tabular-nums">{tc.altitudeM} m</span>
                  <span className="text-[10px] text-cyan-400 block tabular-nums">ρ = {tp.airDensityKgM3} kg/m³</span>
                </div>
                <div className="bg-[#15151E] border border-white/5 p-2.5">
                  <span className="text-[10px] text-zinc-500 uppercase block">PIT LANE LOSS</span>
                  <span className="text-base font-bold text-amber-300 tabular-nums">{m.pitLaneLossSec.toFixed(1)} s</span>
                  <span className="text-[10px] text-zinc-400 block tabular-nums">Lim. {m.pitSpeedLimitKmh} km/h</span>
                </div>
              </div>

              {/* Detail Sub-Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 border-b border-white/10 pb-2">
                {(
                  [
                    { id: 'overview_map', label: '1. Traçado Real & Ficha Oficial' },
                    { id: 'physics_m02', label: '2. Física de Pista, ERS & Asfalto' },
                    { id: 'segments_corners', label: `3. Curvas (${activeEntry.pkg.corners.length}), Setores & Segmentos M11` },
                    { id: 'provenance', label: '4. Proveniência & Validação GeoJSON' },
                  ] as { id: DetailTab; label: string }[]
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setDetailTab(tab.id)}
                    className={`px-3 py-1.5 text-[11px] font-f1-wide font-bold uppercase tracking-wider border transition-colors cursor-pointer whitespace-nowrap ${
                      detailTab === tab.id
                        ? 'bg-[#E10600] border-[#E10600] text-white'
                        : 'bg-[#15151E] border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* SUB-TAB 1: REAL CIRCUIT MAP + HISTORICAL & PIT DATA */}
              {detailTab === 'overview_map' && (
                <div className="space-y-4">
                  <RealCircuitMap circuitPackage={activeEntry.pkg} trackPhysics={tp} showInspector />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-f1-mono">
                    <div className="bg-[#15151E] border border-white/10 p-4 space-y-2.5">
                      <div className="text-[11px] font-f1-wide font-bold text-white uppercase flex items-center gap-2 border-b border-white/10 pb-2">
                        <Flag className="w-3.5 h-3.5 text-[#E10600]" />
                        <span>Histórico & Dados Geográficos GeoJSON</span>
                      </div>
                      <div className="grid grid-cols-2 gap-y-2 gap-x-3 tabular-nums">
                        <div>
                          <span className="text-[10px] text-zinc-500 block">INAUGURAÇÃO DO CIRCUITO</span>
                          <span className="text-white font-bold">{raw?.opened ?? '—'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 block">PRIMEIRO GP DE F1</span>
                          <span className="text-white font-bold">{raw?.firstgp ?? '—'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 block">ID GEOJSON / CÓDIGO</span>
                          <span className="text-cyan-300 font-bold">{m.geojsonId} / {m.circuitCode}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 block">VERSÃO NO REPOSITÓRIO</span>
                          <span className="text-zinc-200 font-bold">{m.versionTag}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 block">COORDENADAS LARGADA (WGS84)</span>
                          <span className="text-zinc-300">{raw ? `${raw.startLat}°, ${raw.startLon}°` : '—'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 block">PONTOS DA POLILINHA</span>
                          <span className="text-zinc-200">{activeEntry.pkg.points.length} vértices</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#15151E] border border-white/10 p-4 space-y-2.5">
                      <div className="text-[11px] font-f1-wide font-bold text-white uppercase flex items-center gap-2 border-b border-white/10 pb-2">
                        <Gauge className="w-3.5 h-3.5 text-amber-400" />
                        <span>Operações de Pit Lane & Exigências Competitivas</span>
                      </div>
                      <div className="grid grid-cols-2 gap-y-2 gap-x-3 tabular-nums">
                        <div>
                          <span className="text-[10px] text-zinc-500 block">DEMANDA AERODINÂMICA</span>
                          <span className="text-white font-bold">{AERO_DEMAND_LABEL[m.aeroDemand] || m.aeroDemand}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 block">SEVERIDADE DE PNEUS</span>
                          <span className="text-amber-300 font-bold">{m.tireWearSeverity} / 5</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 block">DIFICULDADE ULTRAPASSAGEM</span>
                          <span className="text-white font-bold">{m.overtakeDifficulty} / 5</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 block">ESCAPE DOMINANTE</span>
                          <span className="text-zinc-200 font-bold">{RUNOFF_LABEL[m.dominantRunoff] || m.dominantRunoff}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 block">EXTENSÃO DO PIT LANE</span>
                          <span className="text-zinc-200">{activeEntry.pkg.pitLane.lengthM} m ({activeEntry.pkg.pitLane.pitBoxes.length} boxes)</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 block">ENTRADA / SAÍDA PIT</span>
                          <span className="text-zinc-300">
                            {(activeEntry.pkg.pitLane.entryProgress * 100).toFixed(0)}% → {(activeEntry.pkg.pitLane.exitProgress * 100).toFixed(0)}% volta
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 2: FULL TRACK PHYSICS, M02 CHARACTERISTICS & ENERGY */}
              {detailTab === 'physics_m02' && (
                <div className="space-y-4 text-xs font-f1-mono">
                  {/* Physics Coupling With Current Car */}
                  <div className="bg-[#15151E] border border-white/10 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                      <span className="font-f1-wide font-bold text-white uppercase flex items-center gap-2">
                        <Zap className="w-4 h-4 text-emerald-400" />
                        <span>Acoplamento Físico SI com a Configuração Atual do Carro</span>
                      </span>
                      <span className="text-[10px] text-zinc-400 tabular-nums">
                        Massa {effectivePhysics.totalMassKg} kg · CL(Z) {effectivePhysics.cornerMode.clTotal} · CD(X) {effectivePhysics.straightMode.cdTotal}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 tabular-nums">
                      <div className="p-2.5 bg-[#1C1C26] border border-white/5">
                        <span className="text-[10px] text-zinc-500 block">TEMPO PREVISTO / VOLTA</span>
                        <span className="text-base font-bold text-cyan-300">{formatLapTime(tp.totalPredictedLapTimeSec)}</span>
                      </div>
                      <div className="p-2.5 bg-[#1C1C26] border border-white/5">
                        <span className="text-[10px] text-zinc-500 block">VEL. MÁX. / MÍN. ÁPICE</span>
                        <span className="text-base font-bold text-white">{tp.peakStraightSpeedKmh} / {tp.minApexSpeedKmh} km/h</span>
                      </div>
                      <div className="p-2.5 bg-[#1C1C26] border border-white/5">
                        <span className="text-[10px] text-zinc-500 block">G LATERAL MÁXIMO</span>
                        <span className="text-base font-bold text-white">{tp.maxLateralG} G</span>
                      </div>
                      <div className="p-2.5 bg-[#1C1C26] border border-white/5">
                        <span className="text-[10px] text-zinc-500 block">MODO X NA VOLTA</span>
                        <span className="text-base font-bold text-emerald-400">{tp.modeXFractionPct}%</span>
                      </div>

                      <div className="p-2.5 bg-[#1C1C26] border border-white/5">
                        <span className="text-[10px] text-zinc-500 block">ERS DEPLOY / VOLTA</span>
                        <span className="text-sm font-bold text-amber-300">-{tp.totalErsDeployKjPerLap} kJ</span>
                      </div>
                      <div className="p-2.5 bg-[#1C1C26] border border-white/5">
                        <span className="text-[10px] text-zinc-500 block">ERS HARVEST / VOLTA</span>
                        <span className="text-sm font-bold text-emerald-400">+{tp.totalErsHarvestKjPerLap} kJ</span>
                      </div>
                      <div className="p-2.5 bg-[#1C1C26] border border-white/5">
                        <span className="text-[10px] text-zinc-500 block">SALDO LÍQUIDO ERS</span>
                        <span className={`text-sm font-bold ${tp.netErsBalanceKjPerLap < 0 ? 'text-amber-300' : 'text-emerald-400'}`}>
                          {tp.netErsBalanceKjPerLap > 0 ? '+' : ''}{tp.netErsBalanceKjPerLap} kJ/volta
                        </span>
                      </div>
                      <div className="p-2.5 bg-[#1C1C26] border border-white/5">
                        <span className="text-[10px] text-zinc-500 block">ESTABILIDADE / REFRIG.</span>
                        <span className="text-sm font-bold text-white">
                          {(tp.stabilityIndex01 * 100).toFixed(0)}% / {(tp.coolingDemandIndex01 * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Atmosphere, Geometry & Surface M02 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#15151E] border border-white/10 p-4 space-y-2.5">
                      <div className="text-[11px] font-f1-wide font-bold text-white uppercase flex items-center gap-2 border-b border-white/10 pb-2">
                        <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Atmosfera, Topografia & Vento (M01 / M02)</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5 tabular-nums">
                        <div>
                          <span className="text-[10px] text-zinc-500 block">ALTITUDE / DENSIDADE DO AR</span>
                          <span className="text-white font-bold">{tc.altitudeM} m · {tp.airDensityKgM3} kg/m³</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 block">TEMPERATURA AMBIENTE</span>
                          <span className="text-white font-bold">{(m.ambientTempK - 273.15).toFixed(1)} °C ({m.ambientTempK} K)</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 block">VENTO MÉDIO</span>
                          <span className="text-zinc-200 font-bold">{m.windSpeedMs} m/s ({(m.windSpeedMs * 3.6).toFixed(1)} km/h)</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 block">ELEVAÇÃO MÍN / MÁX</span>
                          <span className="text-zinc-200 font-bold">{m.elevationMinM} m → {m.elevationMaxM} m (Δ {m.elevationMaxM - m.elevationMinM} m)</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 block">LARGURA DE PISTA</span>
                          <span className="text-zinc-200">{m.trackWidthMinM} m – {m.trackWidthMaxM} m</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 block">INCLINAÇÃO (BANKING MÁX)</span>
                          <span className="text-zinc-200">{m.maxBankingDeg}°</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#15151E] border border-white/10 p-4 space-y-2.5">
                      <div className="text-[11px] font-f1-wide font-bold text-white uppercase flex items-center gap-2 border-b border-white/10 pb-2">
                        <Activity className="w-3.5 h-3.5 text-amber-400" />
                        <span>Espectro de Velocidade & Superfície (M02 / M06)</span>
                      </div>
                      <div className="space-y-2 tabular-nums">
                        <div>
                          <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                            <span>Alta (&gt;220): {(tc.highSpeedShare * 100).toFixed(0)}%</span>
                            <span>Média (130-220): {(tc.mediumSpeedShare * 100).toFixed(0)}%</span>
                            <span>Baixa (&lt;130): {(tc.lowSpeedShare * 100).toFixed(0)}%</span>
                          </div>
                          <div className="w-full h-2.5 bg-[#1C1C26] flex overflow-hidden border border-white/10">
                            <div style={{ width: `${tc.highSpeedShare * 100}%` }} className="bg-emerald-400 h-full" />
                            <div style={{ width: `${tc.mediumSpeedShare * 100}%` }} className="bg-amber-400 h-full" />
                            <div style={{ width: `${tc.lowSpeedShare * 100}%` }} className="bg-[#E10600] h-full" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <span className="text-[10px] text-zinc-500 block">TIPO DE ASFALTO</span>
                            <span className="text-white font-bold">{SURFACE_LABEL[m.surfaceType] || m.surfaceType}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-500 block">RUGOSIDADE / GRIP BASE</span>
                            <span className="text-cyan-300 font-bold">{m.surfaceRoughnessUm} µm · μ={m.baseGripFactor}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-500 block">MENOR RAIO DE CURVA</span>
                            <span className="text-white font-bold">{tc.minCornerRadiusM.toFixed(1)} m</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-500 block">FRENAGEM / TRAÇÃO</span>
                            <span className="text-zinc-200">{(tc.brakingSeverity * 100).toFixed(0)}% / {(tc.tractionDemand * 100).toFixed(0)}%</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-500 block">ONDULAÇÃO / ZEBRAS</span>
                            <span className="text-zinc-200">{(tc.bumpinessIndex * 100).toFixed(0)}% / {(tc.kerbSeverity * 100).toFixed(0)}%</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-500 block">ESTRESSE PNEU / SUSPENSÃO</span>
                            <span className="text-amber-300 font-bold">
                              {(tp.tireStressIndex01 * 100).toFixed(0)}% / {(tp.suspensionKerbStress01 * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 3: SECTORS, STRAIGHTS, ALL CORNERS & 10 M11 SEGMENTS */}
              {detailTab === 'segments_corners' && (
                <div className="space-y-4 text-xs font-f1-mono">
                  {/* Sectors S1/S2/S3 & Straights */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#15151E] border border-white/10 p-3.5 space-y-2">
                      <div className="text-[11px] font-f1-wide font-bold text-white uppercase flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Setores Oficiais Derivados da Geometria (S1 / S2 / S3)</span>
                      </div>
                      <div className="divide-y divide-white/5">
                        {activeEntry.pkg.sectors.map((sec) => (
                          <div key={sec.sector} className="py-2 flex items-center justify-between gap-2 tabular-nums">
                            <div>
                              <span className={`font-bold ${sec.sector === 1 ? 'text-cyan-400' : sec.sector === 2 ? 'text-amber-400' : 'text-[#E10600]'}`}>
                                Setor {sec.sector}
                              </span>
                              <span className="text-[10px] text-zinc-500 block">
                                {(sec.startProgress * 100).toFixed(0)}% – {(sec.endProgress * 100).toFixed(0)}% da volta
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-white font-bold block">{sec.lengthM} m</span>
                              <span className="text-[10px] text-zinc-400">
                                Δh {sec.elevationDeltaM > 0 ? '+' : ''}{sec.elevationDeltaM.toFixed(1)} m · κ {sec.avgCurvatureInvM.toFixed(4)} m⁻¹
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-[#15151E] border border-white/10 p-3.5 space-y-2">
                      <div className="text-[11px] font-f1-wide font-bold text-white uppercase flex items-center gap-2">
                        <Wind className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Retas & Zonas de Asa Ativa Modo X ({activeEntry.pkg.straights.length})</span>
                      </div>
                      <div className="max-h-44 overflow-y-auto divide-y divide-white/5">
                        {activeEntry.pkg.straights.map((st) => (
                          <div key={st.straightIndex} className="py-1.5 flex items-center justify-between gap-2 tabular-nums">
                            <div>
                              <span className="text-white font-bold">{st.name}</span>
                              <span className="text-[10px] text-zinc-500 block">
                                {Math.round(st.startDistM)} m → {Math.round(st.endDistM)} m
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-emerald-400 font-bold block">{Math.round(st.lengthM)} m</span>
                              <span className="text-[10px] text-zinc-400">
                                {st.isModeXActive ? 'MODO X ATIVO' : 'ZONA CURTA'} · ~{st.estimatedPeakSpeedKmh} km/h
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* All Detected Corners Table */}
                  <div className="bg-[#15151E] border border-white/10 overflow-hidden">
                    <div className="px-3.5 py-2.5 border-b border-white/10 text-[11px] font-f1-wide font-bold text-white uppercase">
                      Mapeamento Completo de Curvas Detectadas ({activeEntry.pkg.corners.length} geométricas · {m.officialCorners} oficiais)
                    </div>
                    <div className="max-h-64 overflow-y-auto overflow-x-auto">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-[#1C1C26] text-[10px] text-zinc-400 uppercase border-b border-white/10">
                            <th className="py-2 px-2.5">#</th>
                            <th className="py-2 px-2.5">Curva</th>
                            <th className="py-2 px-2.5">Direção</th>
                            <th className="py-2 px-2.5">Faixa</th>
                            <th className="py-2 px-2.5 text-right">Raio Mín.</th>
                            <th className="py-2 px-2.5 text-right">Vel. Alvo</th>
                            <th className="py-2 px-2.5 text-right">Ápice (m)</th>
                            <th className="py-2 px-2.5 text-right">Zebra</th>
                            <th className="py-2 px-2.5">Escape</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 tabular-nums">
                          {activeEntry.pkg.corners.map((c) => (
                            <tr key={c.cornerNumber} className="hover:bg-white/5">
                              <td className="py-1.5 px-2.5 font-bold text-[#E10600]">T{c.cornerNumber}</td>
                              <td className="py-1.5 px-2.5 text-white font-bold">
                                {c.name}{c.isChicane ? ' (Chicane)' : ''}
                              </td>
                              <td className="py-1.5 px-2.5 text-zinc-300 uppercase">{c.direction}</td>
                              <td className="py-1.5 px-2.5 text-zinc-300 uppercase">{c.speedBand}</td>
                              <td className="py-1.5 px-2.5 text-right text-white">{c.minRadiusM.toFixed(1)} m</td>
                              <td className="py-1.5 px-2.5 text-right text-cyan-300 font-bold">{c.targetSpeedKmh} km/h</td>
                              <td className="py-1.5 px-2.5 text-right text-zinc-400">{Math.round(c.apexDistM)} m</td>
                              <td className="py-1.5 px-2.5 text-right text-amber-300">{Math.round(c.kerbSeverity * 100)}%</td>
                              <td className="py-1.5 px-2.5 text-zinc-300">{RUNOFF_LABEL[c.runoffType] || c.runoffType}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* All 10 M11 Physical Segments */}
                  <div className="bg-[#15151E] border border-white/10 overflow-hidden">
                    <div className="px-3.5 py-2.5 border-b border-white/10 text-[11px] font-f1-wide font-bold text-white uppercase">
                      Segmentos Físicos M11 & Avaliação Dinâmica por Trecho ({tp.segments.length} trechos = {m.officialLengthM} m)
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-[#1C1C26] text-[10px] text-zinc-400 uppercase border-b border-white/10">
                            <th className="py-2 px-2.5">Trecho</th>
                            <th className="py-2 px-2.5">Modo</th>
                            <th className="py-2 px-2.5 text-right">Ext.</th>
                            <th className="py-2 px-2.5 text-right">Ent/Ápice/Saída</th>
                            <th className="py-2 px-2.5 text-right">G Lat / Freio</th>
                            <th className="py-2 px-2.5 text-right">DF / Arrasto</th>
                            <th className="py-2 px-2.5 text-right">ERS (- / +)</th>
                            <th className="py-2 px-2.5 text-right">Tempo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 tabular-nums">
                          {tp.segments.map((seg) => (
                            <tr key={seg.segmentIndex} className="hover:bg-white/5">
                              <td className="py-1.5 px-2.5">
                                <span className="text-zinc-500 mr-1">#{seg.segmentIndex}</span>
                                <span className="text-white font-bold">{seg.segmentName}</span>
                              </td>
                              <td className={`py-1.5 px-2.5 font-bold ${seg.aeroModeUsed === 'MODE_X' ? 'text-emerald-400' : 'text-amber-300'}`}>
                                {seg.aeroModeUsed === 'MODE_X' ? 'Modo X' : 'Modo Z'}
                              </td>
                              <td className="py-1.5 px-2.5 text-right text-zinc-200">{seg.lengthM} m</td>
                              <td className="py-1.5 px-2.5 text-right text-cyan-300">
                                {seg.entrySpeedKmh} / {seg.apexOrPeakSpeedKmh} / {seg.exitSpeedKmh}
                              </td>
                              <td className="py-1.5 px-2.5 text-right text-zinc-200">
                                {seg.lateralG}G / {seg.brakingG}G
                              </td>
                              <td className="py-1.5 px-2.5 text-right text-zinc-300">
                                {seg.downforceN}N / {seg.dragN}N
                              </td>
                              <td className="py-1.5 px-2.5 text-right">
                                <span className="text-amber-300">-{seg.ersDeployKj}</span>
                                <span className="text-zinc-600"> / </span>
                                <span className="text-emerald-400">+{seg.ersHarvestKj} kJ</span>
                              </td>
                              <td className="py-1.5 px-2.5 text-right text-white font-bold">{seg.segmentTimeSec.toFixed(2)}s</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 4: PROVENANCE, VALIDATION & SOURCES */}
              {detailTab === 'provenance' && (
                <div className="space-y-4 text-xs font-f1-mono">
                  <div className="bg-[#15151E] border border-white/10 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                      <span className="font-f1-wide font-bold text-white uppercase flex items-center gap-2">
                        <Database className="w-4 h-4 text-[#E10600]" />
                        <span>Auditoria Geométrica, Proveniência & Rastreabilidade</span>
                      </span>
                      <span
                        className={`px-2 py-0.5 border font-bold uppercase inline-flex items-center gap-1 ${
                          m.provenance.confidence === 'referencia_inicial'
                            ? 'bg-amber-950/50 border-amber-500/40 text-amber-300'
                            : 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                        }`}
                      >
                        {m.provenance.confidence === 'referencia_inicial' ? (
                          <AlertTriangle className="w-3 h-3" />
                        ) : (
                          <ShieldCheck className="w-3 h-3" />
                        )}
                        <span>{m.provenance.confidence} ({m.provenance.certificationStatus})</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 tabular-nums">
                      <div className="p-2.5 bg-[#1C1C26] border border-white/5">
                        <span className="text-[10px] text-zinc-500 block">HAVERSINE CALCULADO</span>
                        <span className="text-white font-bold">{val.calculatedLengthM} m</span>
                      </div>
                      <div className="p-2.5 bg-[#1C1C26] border border-white/5">
                        <span className="text-[10px] text-zinc-500 block">OFICIAL FIA</span>
                        <span className="text-white font-bold">{val.officialLengthM} m</span>
                      </div>
                      <div className="p-2.5 bg-[#1C1C26] border border-white/5">
                        <span className="text-[10px] text-zinc-500 block">DELTA COMPRIMENTO</span>
                        <span className="text-cyan-300 font-bold">
                          {val.lengthDeltaM > 0 ? '+' : ''}{val.lengthDeltaM} m ({val.lengthDeltaPct}%)
                        </span>
                      </div>
                      <div className="p-2.5 bg-[#1C1C26] border border-white/5">
                        <span className="text-[10px] text-zinc-500 block">MALHA / LOOP FECHADO</span>
                        <span className="text-emerald-400 font-bold">
                          {val.pointCount} pts · {val.isClosedLoop ? 'Loop Fechado' : 'Aberto'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase block">FONTE DE GEOMETRIA</span>
                        <span className="text-white">{m.provenance.geometrySource}</span>
                        <div className="text-[10px] text-zinc-400 break-all">{m.provenance.geometryRepoUrl}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase block">FONTES DE METADADOS</span>
                        <ul className="list-disc list-inside text-zinc-300 space-y-0.5">
                          {m.provenance.metadataSources.map((src, idx) => (
                            <li key={idx}>{src}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase block">NOTAS TÉCNICAS</span>
                        <p className="text-zinc-300 leading-relaxed">{m.provenance.notes}</p>
                      </div>
                    </div>

                    {val.warnings.length > 0 && (
                      <div className="bg-amber-950/30 border border-amber-500/40 p-3 space-y-1 text-amber-200">
                        <span className="font-bold uppercase text-[10px] block">Avisos de Validação</span>
                        {val.warnings.map((w, i) => (
                          <div key={i}>• {w}</div>
                        ))}
                      </div>
                    )}
                    {val.errors.length > 0 && (
                      <div className="bg-red-950/30 border border-red-500/40 p-3 space-y-1 text-red-200">
                        <span className="font-bold uppercase text-[10px] block">Erros de Validação</span>
                        {val.errors.map((err, i) => (
                          <div key={i}>• {err}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
