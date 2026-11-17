import React, { useMemo, useState } from 'react';
import type { ComponentSpec, Team } from '../../types/f1';
import type { VehicleEngineeringParameters, VehiclePhysicsOutputs } from '../../types/physics';
import {
  computeCarRadarProfile,
  computeRivalRadarProfile,
} from '../../engine/chassisLaunchAndSeasonLoop';
import { computeDriverPerceivedRadarProfile } from '../../engine/engineeringFeedbackEngine';

interface CarRadarComparisonChartProps {
  playerTeam: Team;
  allTeams: Team[];
  vehicleParams: VehicleEngineeringParameters;
  vehiclePhysics: VehiclePhysicsOutputs;
  components: ComponentSpec[];
  correlationErrorPct?: number;
  leadDriverFeedback?: number;
}

export const CarRadarComparisonChart: React.FC<CarRadarComparisonChartProps> = ({
  playerTeam,
  allTeams,
  vehicleParams,
  vehiclePhysics,
  components,
  correlationErrorPct = 8.5,
  leadDriverFeedback = 80,
}) => {
  const rivals = useMemo(
    () =>
      allTeams
        .filter((t) => !t.isPlayer)
        .sort((a, b) => (b.carRating || 0) - (a.carRating || 0)),
    [allTeams]
  );

  const [selectedRivalId, setSelectedRivalId] = useState<string>(
    () => rivals[0]?.id || 'ferrari'
  );

  const activeRival =
    rivals.find((r) => r.id === selectedRivalId) || rivals[0] || playerTeam;

  const playerAxes = useMemo(
    () => computeCarRadarProfile(vehicleParams, vehiclePhysics, components),
    [vehicleParams, vehiclePhysics, components]
  );

  const driverAxes = useMemo(
    () =>
      computeDriverPerceivedRadarProfile({
        vehicleParams,
        vehiclePhysics,
        components,
        correlationErrorPct,
        driverFeedbackRating: leadDriverFeedback,
      }),
    [vehicleParams, vehiclePhysics, components, correlationErrorPct, leadDriverFeedback]
  );

  const rivalAxes = useMemo(
    () => computeRivalRadarProfile(activeRival),
    [activeRival]
  );

  const maxPilotGapPts = useMemo(() => {
    return playerAxes.reduce((maxGap, axis, idx) => {
      const pilotVal = driverAxes[idx]?.value ?? axis.value;
      return Math.max(maxGap, Math.abs(axis.value - pilotVal));
    }, 0);
  }, [playerAxes, driverAxes]);

  const cx = 140;
  const cy = 128;
  const maxR = 86;

  const pointFor = (idx: number, val0to100: number) => {
    const angle = (-Math.PI / 2) + (idx * (2 * Math.PI)) / 6;
    const r = (Math.max(10, Math.min(100, val0to100)) / 100) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const toPolygonPoints = (vals: number[]) =>
    vals
      .map((v, i) => {
        const pt = pointFor(i, v);
        return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
      })
      .join(' ');

  const ringLevels = [25, 50, 75, 100];
  const playerColor = playerTeam.color || '#E10600';
  const rivalColor = activeRival.color || '#38BDF8';
  const pilotColor = '#22D3EE';

  return (
    <div className="space-y-3">
      {/* Rival selector & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#15151E] p-2.5 border border-white/10">
        <div className="flex items-center gap-2 text-[11px] font-f1-mono">
          <span className="text-zinc-400 uppercase whitespace-nowrap">Comparar contra:</span>
          <select
            value={activeRival.id}
            onChange={(e) => setSelectedRivalId(e.target.value)}
            className="bg-[#1C1C26] border border-white/20 px-2.5 py-1 text-white font-bold cursor-pointer"
          >
            {rivals.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.carModelName || r.shortName} · OVR {r.carRating})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[10px] font-f1-mono">
          <span className="flex items-center gap-1.5 text-white font-bold whitespace-nowrap">
            <span className="w-2.5 h-2.5 inline-block border border-white/40" style={{ backgroundColor: playerColor }} />
            {playerTeam.carModelName || playerTeam.shortName} (Túnel)
          </span>
          <span className="flex items-center gap-1.5 text-cyan-300 font-bold whitespace-nowrap">
            <span className="w-3 h-0 inline-block border-t-2 border-dotted border-[#22D3EE]" />
            Feedback do Piloto
          </span>
          <span className="flex items-center gap-1.5 text-zinc-300 whitespace-nowrap">
            <span className="w-2.5 h-2.5 inline-block border border-dashed border-white/60" style={{ backgroundColor: rivalColor }} />
            {activeRival.carModelName || activeRival.shortName}
          </span>
        </div>
      </div>

      {/* Radar SVG + Tabular Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-[#15151E] p-3 border border-white/5">
        <div className="sm:col-span-6 flex justify-center">
          <svg viewBox="0 0 280 256" className="w-full max-w-[270px] h-auto select-none">
            {/* Concentric Hexagons */}
            {ringLevels.map((lvl) => (
              <polygon
                key={lvl}
                points={toPolygonPoints(Array(6).fill(lvl))}
                fill="none"
                stroke="rgba(255,255,255,0.10)"
                strokeWidth="1"
              />
            ))}

            {/* Axis Spokes & Labels */}
            {playerAxes.map((axis, idx) => {
              const outer = pointFor(idx, 100);
              const lblPos = pointFor(idx, 118);
              return (
                <g key={axis.key}>
                  <line
                    x1={cx}
                    y1={cy}
                    x2={outer.x}
                    y2={outer.y}
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth="1"
                  />
                  <text
                    x={lblPos.x}
                    y={lblPos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#A1A1AA"
                    fontSize="8.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {axis.label.toUpperCase()}
                  </text>
                </g>
              );
            })}

            {/* Rival Dashed Polygon */}
            <polygon
              points={toPolygonPoints(rivalAxes.map((a) => a.value))}
              fill={rivalColor}
              fillOpacity={0.14}
              stroke={rivalColor}
              strokeWidth="1.8"
              strokeDasharray="4 3"
            />

            {/* Player Filled Polygon (Wind Tunnel Baseline) */}
            <polygon
              points={toPolygonPoints(playerAxes.map((a) => a.value))}
              fill={playerColor}
              fillOpacity={0.28}
              stroke={playerColor}
              strokeWidth="2.2"
            />

            {/* Driver Perceived Feedback Dotted Polygon */}
            <polygon
              points={toPolygonPoints(driverAxes.map((a) => a.value))}
              fill="none"
              stroke={pilotColor}
              strokeWidth="2"
              strokeDasharray="3 3"
            />

            {/* Player Vertices */}
            {playerAxes.map((axis, idx) => {
              const pt = pointFor(idx, axis.value);
              return (
                <circle
                  key={`pt_${axis.key}`}
                  cx={pt.x}
                  cy={pt.y}
                  r="3"
                  fill="#FFFFFF"
                  stroke={playerColor}
                  strokeWidth="1.5"
                />
              );
            })}
          </svg>
        </div>

        <div className="sm:col-span-6 space-y-1.5 text-[11px] font-f1-mono tabular-nums">
          {playerAxes.map((axis, idx) => {
            const rivalVal = rivalAxes[idx]?.value ?? 80;
            const pilotVal = driverAxes[idx]?.value ?? axis.value;
            const delta = axis.value - rivalVal;
            return (
              <div
                key={axis.key}
                className="flex items-center justify-between bg-[#1C1C26] px-2.5 py-1.5 border border-white/5"
              >
                <span className="text-zinc-300 truncate pr-2">{axis.label}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-white font-bold" title="Projeção Túnel/CFD">{axis.value}</span>
                  <span className="text-cyan-300 text-[10px]" title="Percepção do Piloto">({pilotVal})</span>
                  <span className="text-zinc-500">vs {rivalVal}</span>
                  <span
                    className={`w-8 text-right font-bold ${
                      delta > 0
                        ? 'text-emerald-400'
                        : delta < 0
                        ? 'text-red-400'
                        : 'text-zinc-400'
                    }`}
                  >
                    {delta > 0 ? `+${delta}` : delta}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {maxPilotGapPts > 3 && (
        <div className="flex items-center justify-between gap-3 bg-[#15151E] border border-cyan-500/30 px-3 py-2 text-[11px] font-f1-mono tabular-nums">
          <span className="text-cyan-300 font-bold uppercase">
            Erro de Correlação Túnel vs Pista: ±{correlationErrorPct.toFixed(1)}%
          </span>
          <span className="text-amber-300 font-bold">
            Divergência máx: {maxPilotGapPts} pts (linha pontilhada)
          </span>
        </div>
      )}
    </div>
  );
};

