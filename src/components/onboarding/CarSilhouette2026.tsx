import React, { useState } from 'react';
import { Wind } from 'lucide-react';
import type { VehicleEngineeringParameters } from '../../types/physics';

export interface SilhouetteGeometry {
  rakeMm: number;
  rakeDeg: number;
  frontClearancePx: number;
  rearClearancePx: number;
  diffuserExitY: number;
  frontFlapAngleDeg: number;
  rearFlapAngleDeg: number;
}

export function computeSilhouetteGeometry(
  params: Pick<
    VehicleEngineeringParameters,
    | 'frontRideHeightMm'
    | 'rearRideHeightMm'
    | 'diffuserAngleDeg'
    | 'frontWingFlapCornerDeg'
    | 'frontWingFlapStraightDeg'
    | 'rearWingFlapCornerDeg'
    | 'rearWingFlapStraightDeg'
  >,
  aeroMode: 'mode_z' | 'mode_x'
): SilhouetteGeometry {
  const rakeMm = params.rearRideHeightMm - params.frontRideHeightMm;
  const rakeDeg = Number(((Math.atan2(rakeMm, 2800) * 180) / Math.PI).toFixed(2));

  // Visual exaggeration factor so 18–75mm ride height & 6–15° diffuser read immediately to the eye
  const frontClearancePx = Math.max(4, Math.min(24, (params.frontRideHeightMm - 10) * 0.45));
  const rearClearancePx = Math.max(8, Math.min(42, (params.rearRideHeightMm - 18) * 0.55));
  const groundY = 148;
  const diffuserLiftPx = Math.max(8, Math.min(34, (params.diffuserAngleDeg - 4) * 2.4));
  const diffuserExitY = groundY - rearClearancePx - diffuserLiftPx;

  const frontFlapAngleDeg =
    aeroMode === 'mode_x' ? params.frontWingFlapStraightDeg : params.frontWingFlapCornerDeg;
  const rearFlapAngleDeg =
    aeroMode === 'mode_x' ? params.rearWingFlapStraightDeg : params.rearWingFlapCornerDeg;

  return {
    rakeMm,
    rakeDeg,
    frontClearancePx,
    rearClearancePx,
    diffuserExitY,
    frontFlapAngleDeg,
    rearFlapAngleDeg,
  };
}

interface CarSilhouette2026Props {
  params: VehicleEngineeringParameters;
  title?: string;
}

export const CarSilhouette2026: React.FC<CarSilhouette2026Props> = ({
  params,
  title = 'Silhueta Dinâmica 2026 (Perfil Lateral · Rake, Difusor & Asas Ativas)',
}) => {
  const [previewMode, setPreviewMode] = useState<'mode_z' | 'mode_x'>('mode_z');
  const geom = computeSilhouetteGeometry(params, previewMode);

  const groundY = 148;
  const frontFloorY = groundY - geom.frontClearancePx;
  const rearFloorY = groundY - geom.rearClearancePx;
  const pitchOffsetDeg = -geom.rakeDeg * 2.4;

  return (
    <div className="bg-[#15151E] border border-white/10 p-3.5 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-f1-wide font-bold text-white uppercase flex items-center gap-1.5">
          <Wind className="w-3.5 h-3.5 text-cyan-400" />
          <span>{title}</span>
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPreviewMode('mode_z')}
            className={`px-2 py-0.5 text-[10px] font-f1-mono uppercase border cursor-pointer ${
              previewMode === 'mode_z'
                ? 'bg-[#E10600] border-[#E10600] text-white font-bold'
                : 'bg-[#1C1C26] border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            Modo Z (Curva)
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode('mode_x')}
            className={`px-2 py-0.5 text-[10px] font-f1-mono uppercase border cursor-pointer ${
              previewMode === 'mode_x'
                ? 'bg-cyan-600 border-cyan-400 text-white font-bold'
                : 'bg-[#1C1C26] border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            Modo X (Reta)
          </button>
        </div>
      </div>

      <svg viewBox="0 0 640 175" className="w-full h-36 bg-[#0E0E14] border border-white/5">
        {/* Wind flow guide lines */}
        <line x1="20" y1="54" x2="620" y2="54" stroke="#1E293B" strokeDasharray="4 4" strokeWidth="1" />
        <line x1="20" y1="96" x2="620" y2="96" stroke="#1E293B" strokeDasharray="4 4" strokeWidth="1" />

        {/* Asphalt Ground Plane */}
        <line x1="16" y1={groundY} x2="624" y2={groundY} stroke="#475569" strokeWidth="2" />
        <text x="20" y="164" fill="#64748B" fontSize="9" fontFamily="monospace">
          ASFALTO (Z = 0 mm)
        </text>
        <text x="455" y="164" fill="#94A3B8" fontSize="9" fontFamily="monospace">
          RAKE: {geom.rakeMm >= 0 ? `+${geom.rakeMm}` : geom.rakeMm} mm ({geom.rakeDeg}°)
        </text>

        {/* Underfloor & Diffuser Ramp */}
        <polygon
          points={`150,${frontFloorY} 445,${rearFloorY} 536,${geom.diffuserExitY} 536,${rearFloorY - 2} 445,${rearFloorY - 4} 150,${frontFloorY - 4}`}
          fill="#22D3EE"
          fillOpacity="0.28"
          stroke="#22D3EE"
          strokeWidth="1.5"
        />

        {/* Chassis Body (tilted dynamically with pitch/rake) */}
        <g transform={`rotate(${pitchOffsetDeg}, 320, ${groundY - 30})`}>
          {/* Main Nose + Monocoque + Engine Cover */}
          <path
            d={`M 74,${frontFloorY - 6} L 155,${frontFloorY - 26} L 235,${frontFloorY - 34} L 295,${frontFloorY - 34} L 348,${rearFloorY - 58} L 478,${rearFloorY - 42} L 520,${rearFloorY - 26} L 520,${rearFloorY - 6} L 150,${frontFloorY - 4} Z`}
            fill="#1E202E"
            stroke="#E10600"
            strokeWidth="2"
          />
          {/* Halo Safety Arc */}
          <path
            d={`M 238,${frontFloorY - 34} Q 272,${frontFloorY - 58} 308,${frontFloorY - 38}`}
            fill="none"
            stroke="#94A3B8"
            strokeWidth="3"
          />
          {/* Driver Helmet */}
          <circle cx="272" cy={frontFloorY - 39} r="8.5" fill="#FACC15" stroke="#0F172A" strokeWidth="1.5" />

          {/* Active Front Wing Flap */}
          <g transform={`translate(76, ${frontFloorY - 12}) rotate(${-geom.frontFlapAngleDeg * 0.75})`}>
            <rect x="-26" y="-4" width="32" height="5" rx="1.5" fill={previewMode === 'mode_x' ? '#22D3EE' : '#E10600'} />
          </g>

          {/* Active Rear Wing Upper Flap */}
          <g transform={`translate(544, ${rearFloorY - 76}) rotate(${-geom.rearFlapAngleDeg * 0.8})`}>
            <rect x="-24" y="-5" width="32" height="6" rx="1.5" fill={previewMode === 'mode_x' ? '#22D3EE' : '#E10600'} />
          </g>
          {/* Rear Wing Endplate */}
          <rect x="520" y={rearFloorY - 82} width="30" height="44" fill="none" stroke="#64748B" strokeWidth="1.5" />
        </g>

        {/* Front & Rear 18" Tires (anchored on asphalt) */}
        <circle cx="145" cy={groundY - 26} r="25" fill="#0B0C10" stroke="#94A3B8" strokeWidth="2.5" />
        <circle cx="145" cy={groundY - 26} r="13" fill="#181822" stroke="#E10600" strokeWidth="1.5" />

        <circle cx="482" cy={groundY - 26} r="25" fill="#0B0C10" stroke="#94A3B8" strokeWidth="2.5" />
        <circle cx="482" cy={groundY - 26} r="13" fill="#181822" stroke="#E10600" strokeWidth="1.5" />

        {/* Front & Rear Ride Height Indicators */}
        <line x1="185" y1={frontFloorY} x2="185" y2={groundY} stroke="#F59E0B" strokeWidth="1.5" />
        <text x="191" y={groundY - 4} fill="#FCD34D" fontSize="9" fontFamily="monospace">
          Diant: {params.frontRideHeightMm}mm
        </text>

        <line x1="430" y1={rearFloorY} x2="430" y2={groundY} stroke="#F59E0B" strokeWidth="1.5" />
        <text x="348" y={groundY - 4} fill="#FCD34D" fontSize="9" fontFamily="monospace">
          Tras: {params.rearRideHeightMm}mm
        </text>

        <text x="546" y={geom.diffuserExitY + 4} fill="#22D3EE" fontSize="9" fontFamily="monospace">
          Difusor {params.diffuserAngleDeg.toFixed(1)}°
        </text>
      </svg>

      <div className="grid grid-cols-3 gap-2 text-[10px] font-f1-mono tabular-nums text-zinc-300">
        <div>
          Asa Diant.: <strong className="text-white">{geom.frontFlapAngleDeg}°</strong> ({previewMode === 'mode_x' ? 'Aberta' : 'Carga'})
        </div>
        <div>
          Asa Tras.: <strong className="text-white">{geom.rearFlapAngleDeg}°</strong> ({previewMode === 'mode_x' ? 'DRS/X' : 'Carga'})
        </div>
        <div className="text-right">
          Rake: <strong className="text-amber-300">{geom.rakeMm} mm</strong>
        </div>
      </div>
    </div>
  );
};
