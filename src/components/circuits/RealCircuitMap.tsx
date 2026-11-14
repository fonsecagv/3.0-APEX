import React, { useMemo, useState } from 'react';
import type { ProcessedCircuitPackage, DetectedCorner } from '../../circuits/types';
import type { TrackPhysicsEvaluation } from '../../circuits/TrackPhysics';
import type { LiveCarState } from '../../types/f1';
import { ShieldCheck, AlertTriangle, Compass, Mountain, Flag } from 'lucide-react';

interface RealCircuitMapProps {
  circuitPackage: ProcessedCircuitPackage;
  trackPhysics?: TrackPhysicsEvaluation;
  liveCars?: LiveCarState[];
  compact?: boolean;
  showInspector?: boolean;
}

export const RealCircuitMap: React.FC<RealCircuitMapProps> = ({
  circuitPackage,
  trackPhysics,
  liveCars,
  compact = false,
  showInspector = false
}) => {
  const [selectedCornerNum, setSelectedCornerNum] = useState<number | null>(null);

  const {
    metadata,
    points,
    svgViewBox,
    svgCenterlinePath,
    svgStartFinishLine,
    sectors,
    modeXSvgPaths,
    corners,
    pitLane,
    validation
  } = circuitPackage;

  const selectedCorner: DetectedCorner | null = useMemo(() => {
    if (!corners.length) return null;
    if (selectedCornerNum !== null) {
      return corners.find((c) => c.cornerNumber === selectedCornerNum) || corners[0];
    }
    return corners[0];
  }, [corners, selectedCornerNum]);

  // Compact elevation SVG polyline (width 300 x height 42)
  const elevationPolyline = useMemo(() => {
    if (points.length < 2) return '';
    const minE = metadata.elevationMinM;
    const spanE = Math.max(1, metadata.elevationMaxM - metadata.elevationMinM);
    return points
      .filter((_, idx) => idx % Math.max(1, Math.floor(points.length / 80)) === 0 || idx === points.length - 1)
      .map((pt) => {
        const x = (pt.normalizedProgress * 300).toFixed(1);
        const y = (38 - ((pt.elevationM - minE) / spanE) * 32).toFixed(1);
        return `${x},${y}`;
      })
      .join(' ');
  }, [points, metadata.elevationMinM, metadata.elevationMaxM]);

  // Map live cars onto SVG coordinates using normalized lap distance
  const mappedLiveCars = useMemo(() => {
    if (!liveCars || liveCars.length === 0 || points.length === 0) return [];
    return liveCars
      .filter((c) => c.status === 'running')
      .map((car) => {
        const prog = ((car.distanceOnLap % 1) + 1) % 1;
        const idx = Math.min(points.length - 1, Math.max(0, Math.round(prog * (points.length - 1))));
        const pt = points[idx];
        return {
          ...car,
          svgX: pt.svgX,
          svgY: pt.svgY
        };
      });
  }, [liveCars, points]);

  const isReferenceOnly = metadata.provenance.confidence === 'referencia_inicial';

  if (compact) {
    return (
      <div className="w-full h-full bg-[#15151E] border border-white/10 p-2.5 flex flex-col justify-between relative">
        <div className="flex items-center justify-between gap-2 text-[9px] font-f1-mono">
          <span className="text-zinc-400 uppercase truncate">
            {metadata.geojsonId} · {points.length} pts
          </span>
          <span
            className={`px-1.5 py-0.5 font-bold uppercase border ${
              isReferenceOnly
                ? 'bg-amber-950/50 border-amber-500/40 text-amber-300'
                : 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
            }`}
          >
            {isReferenceOnly ? 'Ref. Inicial' : 'Validado'}
          </span>
        </div>

        <svg viewBox={svgViewBox} className="w-full h-32 my-1">
          {/* Pit lane */}
          <path d={pitLane.svgPath} fill="none" stroke="#3f3f46" strokeWidth={3} strokeDasharray="4 3" />
          {/* Asphalt base */}
          <path d={svgCenterlinePath} fill="none" stroke="#272734" strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
          {/* Sector overlays */}
          <path d={sectors[0].svgPath} fill="none" stroke="#22d3ee" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
          <path d={sectors[1].svgPath} fill="none" stroke="#f59e0b" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
          <path d={sectors[2].svgPath} fill="none" stroke="#E10600" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
          {/* Mode X Zones */}
          {modeXSvgPaths.map((p, idx) => (
            <path
              key={idx}
              d={p}
              fill="none"
              stroke="#34d399"
              strokeWidth={2.5}
              strokeDasharray="6 4"
              strokeLinecap="round"
            />
          ))}
          {/* Start/Finish */}
          <line
            x1={svgStartFinishLine.x1}
            y1={svgStartFinishLine.y1}
            x2={svgStartFinishLine.x2}
            y2={svgStartFinishLine.y2}
            stroke="#ffffff"
            strokeWidth={3.5}
          />
        </svg>

        <div className="flex items-center justify-between text-[9px] font-f1-mono text-zinc-400 tabular-nums">
          <span>{metadata.officialLengthM} m · {metadata.officialCorners} curvas</span>
          <span>Δ={validation.lengthDeltaPct}%</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1C1C26] border border-white/10 p-4 space-y-3 f1-pattern-micro-grid">
      {/* Header & Provenance Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-f1-mono text-[#E10600] font-bold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" />
            <span>ROUND {metadata.round || 'RES'} · TRAÇADO REAL GEOJSON ({metadata.geojsonId})</span>
          </div>
          <h3 className="font-f1-wide font-black text-sm text-white uppercase mt-0.5">
            {metadata.name} ({metadata.seasonYear}) · {metadata.officialLengthM} m · {metadata.officialCorners} Curvas · {metadata.laps} Voltas
          </h3>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-f1-mono">
          <span
            className={`px-2 py-0.5 border font-bold uppercase inline-flex items-center gap-1 ${
              isReferenceOnly
                ? 'bg-amber-950/50 border-amber-500/40 text-amber-300'
                : 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
            }`}
            title={metadata.provenance.notes}
          >
            {isReferenceOnly ? <AlertTriangle className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
            <span>{isReferenceOnly ? 'REFERÊNCIA INICIAL (GEOJSON)' : 'VALIDADO'}</span>
          </span>
          <span className="px-2 py-0.5 bg-[#15151E] border border-white/10 text-zinc-300 tabular-nums">
            {points.length} pts · Calc {validation.calculatedLengthM}m (Δ {validation.lengthDeltaPct}%)
          </span>
        </div>
      </div>

      {/* Main Track Canvas + Optional Side Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className={`${showInspector ? 'lg:col-span-8' : 'lg:col-span-12'} bg-[#15151E] border border-white/10 p-3 relative`}>
          <svg viewBox={svgViewBox} className="w-full h-64 sm:h-72">
            {/* Subtle Telemetry Crosshair */}
            <line x1="20" y1="200" x2="580" y2="200" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            <line x1="300" y1="20" x2="300" y2="380" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />

            {/* Pit Lane & Pit Boxes */}
            <path d={pitLane.svgPath} fill="none" stroke="#52525b" strokeWidth={3.5} strokeDasharray="5 3" />
            {pitLane.pitBoxes.map((box) => (
              <rect
                key={box.boxIndex}
                x={box.svgX - 2.2}
                y={box.svgY - 2.2}
                width={4.4}
                height={4.4}
                fill="#f59e0b"
                opacity={0.75}
              />
            ))}

            {/* Track Outer Edge & Asphalt */}
            <path d={svgCenterlinePath} fill="none" stroke="#09090d" strokeWidth={15} strokeLinecap="round" strokeLinejoin="round" />
            <path d={svgCenterlinePath} fill="none" stroke="#2c2c38" strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />

            {/* Sectors S1 / S2 / S3 */}
            <path d={sectors[0].svgPath} fill="none" stroke="#22d3ee" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
            <path d={sectors[1].svgPath} fill="none" stroke="#f59e0b" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
            <path d={sectors[2].svgPath} fill="none" stroke="#E10600" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />

            {/* Mode X Activation Straight Zones */}
            {modeXSvgPaths.map((p, idx) => (
              <path
                key={idx}
                d={p}
                fill="none"
                stroke="#34d399"
                strokeWidth={2.5}
                strokeDasharray="7 4"
                strokeLinecap="round"
              />
            ))}

            {/* Start / Finish Checkered Marker */}
            <line
              x1={svgStartFinishLine.x1}
              y1={svgStartFinishLine.y1}
              x2={svgStartFinishLine.x2}
              y2={svgStartFinishLine.y2}
              stroke="#ffffff"
              strokeWidth={4}
            />

            {/* Corner Apex Markers */}
            {corners.map((corner) => {
              const isSelected = selectedCorner?.cornerNumber === corner.cornerNumber;
              return (
                <g
                  key={corner.cornerNumber}
                  className="cursor-pointer"
                  onClick={() => setSelectedCornerNum(corner.cornerNumber)}
                >
                  <circle
                    cx={corner.svgX}
                    cy={corner.svgY}
                    r={isSelected ? 9 : 6.5}
                    fill={isSelected ? '#E10600' : '#15151E'}
                    stroke={isSelected ? '#ffffff' : '#71717a'}
                    strokeWidth={1.5}
                  />
                  <text
                    x={corner.svgX}
                    y={corner.svgY + 3}
                    textAnchor="middle"
                    fontSize="7.5"
                    fontWeight="bold"
                    fill="#ffffff"
                    className="font-f1-mono select-none"
                  >
                    {corner.cornerNumber}
                  </text>
                </g>
              );
            })}

            {/* Live Race Car Positions */}
            {mappedLiveCars.map((car) => (
              <g key={car.driverId}>
                <circle
                  cx={car.svgX}
                  cy={car.svgY}
                  r={car.isPlayer ? 6.5 : 4.2}
                  fill={car.teamColor}
                  stroke={car.isPlayer ? '#ffffff' : '#000000'}
                  strokeWidth={car.isPlayer ? 2 : 1}
                />
                {car.isPlayer && (
                  <text
                    x={car.svgX + 9}
                    y={car.svgY + 3}
                    fontSize="9"
                    fontWeight="bold"
                    fill="#ffffff"
                    className="font-f1-mono"
                  >
                    {car.shortCode}
                  </text>
                )}
              </g>
            ))}
          </svg>

          {/* Legend Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-[10px] font-f1-mono text-zinc-400">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1"><span className="w-2.5 h-1 bg-cyan-400 inline-block" /> S1</span>
              <span className="inline-flex items-center gap-1"><span className="w-2.5 h-1 bg-amber-400 inline-block" /> S2</span>
              <span className="inline-flex items-center gap-1"><span className="w-2.5 h-1 bg-[#E10600] inline-block" /> S3</span>
              <span className="inline-flex items-center gap-1"><span className="w-3 h-0.5 border-b-2 border-dashed border-emerald-400 inline-block" /> Modo X</span>
              <span className="inline-flex items-center gap-1"><span className="w-2.5 h-1 bg-zinc-500 inline-block" /> Pit ({pitLane.pitBoxes.length} boxes)</span>
            </div>
            <span className="text-zinc-500">Distância Oficial GP: {metadata.officialRaceDistanceKm} km</span>
          </div>
        </div>

        {/* Corner, Elevation & Physics Inspector */}
        {showInspector && (
          <div className="lg:col-span-4 flex flex-col justify-between gap-3">
            {/* Elevation Profile */}
            <div className="bg-[#15151E] border border-white/10 p-3 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-f1-mono text-zinc-400">
                <span className="flex items-center gap-1 font-bold text-white uppercase">
                  <Mountain className="w-3.5 h-3.5 text-cyan-400" />
                  Perfil Altimétrico
                </span>
                <span className="tabular-nums">
                  {metadata.elevationMinM}m – {metadata.elevationMaxM}m
                </span>
              </div>
              <svg viewBox="0 0 300 42" className="w-full h-11 bg-[#1C1C26]/70 border border-white/5">
                <polyline fill="none" stroke="#22d3ee" strokeWidth="1.8" points={elevationPolyline} />
              </svg>
              <div className="flex justify-between text-[9px] font-f1-mono text-zinc-500">
                <span>Largura: {metadata.trackWidthMinM}–{metadata.trackWidthMaxM} m</span>
                <span>Banking máx: {metadata.maxBankingDeg}°</span>
              </div>
            </div>

            {/* Selected Corner Inspector */}
            {selectedCorner && (
              <div className="bg-[#15151E] border border-white/10 p-3 space-y-2 text-[11px] font-f1-mono">
                <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                  <span className="text-white font-bold uppercase">
                    T{selectedCorner.cornerNumber} · {selectedCorner.name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-[#E10600]/20 border border-[#E10600]/40 text-white uppercase">
                    {selectedCorner.speedBand}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <div>
                    <span className="text-zinc-500 block">RAIO MÍNIMO</span>
                    <span className="text-white font-bold tabular-nums">{selectedCorner.minRadiusM.toFixed(1)} m</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">VEL. ÁPICE ALVO</span>
                    <span className="text-cyan-300 font-bold tabular-nums">{selectedCorner.targetSpeedKmh} km/h</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">ZEBRA / KERB</span>
                    <span className="text-amber-300 font-bold tabular-nums">{Math.round(selectedCorner.kerbSeverity * 100)}%</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">ESCAPE / RUNOFF</span>
                    <span className="text-zinc-200 uppercase">{selectedCorner.runoffType.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Track Physics Summary */}
            {trackPhysics && (
              <div className="bg-[#15151E] border border-white/10 p-3 space-y-1.5 text-[10px] font-f1-mono">
                <div className="flex items-center justify-between text-cyan-400 font-bold uppercase">
                  <span className="flex items-center gap-1">
                    <Flag className="w-3 h-3" />
                    Física de Pista (SI)
                  </span>
                  <span className="tabular-nums">ρ = {trackPhysics.airDensityKgM3} kg/m³</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 tabular-nums">
                  <div>
                    <span className="text-zinc-500 block">V_MAX MODO X</span>
                    <span className="text-white font-bold">{trackPhysics.peakStraightSpeedKmh} km/h ({trackPhysics.modeXFractionPct}% volta)</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">G LATERAL MÁX</span>
                    <span className="text-white font-bold">{trackPhysics.maxLateralG} G</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">BALANÇO ERS/VOLTA</span>
                    <span className={trackPhysics.netErsBalanceKjPerLap < 0 ? 'text-amber-300 font-bold' : 'text-emerald-400 font-bold'}>
                      {trackPhysics.netErsBalanceKjPerLap > 0 ? '+' : ''}{trackPhysics.netErsBalanceKjPerLap} kJ
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">ESTABILIDADE / REFRIG.</span>
                    <span className="text-white font-bold">
                      {Math.round(trackPhysics.stabilityIndex01 * 100)}% / {Math.round(trackPhysics.coolingDemandIndex01 * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Validation Warnings if any */}
      {validation.warnings.length > 0 && (
        <div className="bg-amber-950/25 border border-amber-500/30 px-3 py-1.5 text-[10px] font-f1-mono text-amber-200">
          <strong>Nota de Proveniência:</strong> {validation.warnings[0]}
        </div>
      )}
    </div>
  );
};
