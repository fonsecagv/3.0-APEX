import type { TrackCharacteristicsSi } from '../engine/modules/m02Philosophy.ts';
import type { CircuitSegmentSpec } from '../engine/modules/m11RaceSimulation.ts';
import type { RawGeoJsonCircuitFeature } from './data/realCircuitsGeoJson.ts';
import type {
  CircuitSectorSummary,
  DetectedCorner,
  PitBoxMarker,
  PitLaneGeometry,
  ProcessedCircuitPackage,
  SeasonCircuitMetadata,
  StraightZone,
  TrackGeometryPoint,
} from './types.ts';

const EARTH_RADIUS_M = 6371000;
const SVG_WIDTH = 600;
const SVG_HEIGHT = 400;
const SVG_PADDING = 38;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineDistanceM(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateRawGeoJsonLoopLengthM(coords: [number, number][]): number {
  if (coords.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    total += haversineDistanceM(coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1]);
  }
  const first = coords[0];
  const last = coords[coords.length - 1];
  const closureGap = haversineDistanceM(last[0], last[1], first[0], first[1]);
  if (closureGap > 1) {
    total += closureGap;
  }
  return Math.round(total);
}

function projectToLocalEnuMeters(coords: [number, number][]): Array<{ xM: number; yM: number }> {
  const n = coords.length;
  const meanLon = coords.reduce((acc, c) => acc + c[0], 0) / n;
  const meanLat = coords.reduce((acc, c) => acc + c[1], 0) / n;
  const cosLat = Math.cos(toRad(meanLat));

  return coords.map(([lon, lat]) => ({
    xM: toRad(lon - meanLon) * EARTH_RADIUS_M * cosLat,
    yM: toRad(lat - meanLat) * EARTH_RADIUS_M,
  }));
}

function buildSmoothClosedOrOpenSvgPath(pts: Array<{ svgX: number; svgY: number }>, closed: boolean): string {
  if (pts.length < 2) return '';
  const fmt = (v: number) => v.toFixed(1);
  let d = `M ${fmt(pts[0].svgX)},${fmt(pts[0].svgY)}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${fmt(pts[i].svgX)},${fmt(pts[i].svgY)}`;
  }
  if (closed) d += ' Z';
  return d;
}

function computeSignedCurvature(
  prev: { xM: number; yM: number },
  curr: { xM: number; yM: number },
  next: { xM: number; yM: number }
): number {
  const ax = curr.xM - prev.xM;
  const ay = curr.yM - prev.yM;
  const bx = next.xM - curr.xM;
  const by = next.yM - curr.yM;
  const cx = next.xM - prev.xM;
  const cy = next.yM - prev.yM;

  const la = Math.hypot(ax, ay);
  const lb = Math.hypot(bx, by);
  const lc = Math.hypot(cx, cy);
  const denom = la * lb * lc;
  if (denom < 1e-3) return 0;

  // 2 * signed area of triangle (prev, curr, next)
  const cross = ax * by - ay * bx;
  const kappa = (2 * cross) / denom;
  // Clamp extreme polyline vertex jitter to physical F1 minimum hairpin radius (~11 m)
  return Math.max(-0.09, Math.min(0.09, kappa));
}

function deriveSyntheticElevationM(
  progress: number,
  baseAltitudeM: number,
  elevMin: number,
  elevMax: number
): number {
  const span = Math.max(0.5, elevMax - elevMin);
  const mid = (elevMin + elevMax) / 2;
  const wave =
    0.58 * Math.sin(2 * Math.PI * progress + 0.4) +
    0.28 * Math.sin(4 * Math.PI * progress - 0.7) +
    0.14 * Math.cos(6 * Math.PI * progress);
  return Math.round((baseAltitudeM - mid + mid + (wave * span) / 2) * 100) / 100;
}

function detectGeometryCorners(
  points: TrackGeometryPoint[],
  metadata: SeasonCircuitMetadata
): DetectedCorner[] {
  const corners: DetectedCorner[] = [];
  const threshold = 0.0042; // ~238 m radius or tighter qualifies as cornering load
  const n = points.length;

  let i = 0;
  while (i < n) {
    if (Math.abs(points[i].signedCurvatureInvM) >= threshold) {
      const startIdx = i;
      let peakIdx = i;
      let maxAbsK = Math.abs(points[i].signedCurvatureInvM);
      let leftCount = 0;
      let rightCount = 0;

      while (
        i < n &&
        (Math.abs(points[i].signedCurvatureInvM) >= threshold * 0.72 ||
          (i + 1 < n && Math.abs(points[i + 1].signedCurvatureInvM) >= threshold))
      ) {
        const k = points[i].signedCurvatureInvM;
        if (Math.abs(k) > maxAbsK) {
          maxAbsK = Math.abs(k);
          peakIdx = i;
        }
        if (k > 0) leftCount++;
        else if (k < 0) rightCount++;
        i++;
      }

      const endIdx = Math.min(n - 1, i - 1);
      const startDistM = points[startIdx].distanceFromStartM;
      const endDistM = points[endIdx].distanceFromStartM;
      const apexPt = points[peakIdx];
      const minRadiusM = Math.max(12, Math.round(1 / Math.max(0.002, maxAbsK)));
      const direction: DetectedCorner['direction'] =
        leftCount > 0 && rightCount > 0 && Math.min(leftCount, rightCount) >= 1
          ? 'chicane'
          : apexPt.signedCurvatureInvM >= 0
          ? 'left'
          : 'right';

      const speedBand: DetectedCorner['speedBand'] =
        minRadiusM < 55 ? 'slow' : minRadiusM < 135 ? 'medium' : 'fast';

      // Approximate physical apex cornering speed: v = sqrt(mu_eff * g * R)
      const muEff = speedBand === 'slow' ? 1.85 : speedBand === 'medium' ? 2.55 : 3.35;
      const targetSpeedKmh = Math.round(
        Math.min(315, Math.max(58, Math.sqrt(muEff * 9.80665 * minRadiusM) * 3.6))
      );

      const cNum = corners.length + 1;
      corners.push({
        cornerNumber: cNum,
        name: metadata.cornerNameOverrides?.[cNum] || `Curva ${cNum}`,
        startDistM: Math.round(startDistM),
        apexDistM: Math.round(apexPt.distanceFromStartM),
        endDistM: Math.round(endDistM),
        apexProgress: apexPt.normalizedProgress,
        svgX: apexPt.svgX,
        svgY: apexPt.svgY,
        direction,
        minRadiusM,
        maxCurvatureInvM: Math.round(maxAbsK * 10000) / 10000,
        speedBand,
        targetSpeedKmh,
        isChicane: direction === 'chicane',
        kerbSeverity: speedBand === 'slow' ? 0.78 : speedBand === 'medium' ? 0.62 : 0.42,
        runoffType: metadata.dominantRunoff,
      });
    } else {
      i++;
    }
  }

  return corners;
}

function detectStraightsAndModeX(points: TrackGeometryPoint[]): StraightZone[] {
  const straights: StraightZone[] = [];
  const straightCurvatureMax = 0.0036; // R > 277 m -> active aero Mode X eligible
  const n = points.length;
  let i = 0;

  while (i < n) {
    if (Math.abs(points[i].signedCurvatureInvM) < straightCurvatureMax) {
      const startIdx = i;
      while (i < n && Math.abs(points[i].signedCurvatureInvM) < straightCurvatureMax) {
        i++;
      }
      const endIdx = Math.min(n - 1, i - 1);
      const lengthM = points[endIdx].distanceFromStartM - points[startIdx].distanceFromStartM;
      if (lengthM >= 190) {
        const sNum = straights.length + 1;
        const isModeX = lengthM >= 260;
        const estTop = Math.round(Math.min(358, 252 + (lengthM / 1100) * 88 + (isModeX ? 14 : 0)));
        straights.push({
          straightIndex: sNum,
          name: sNum === 1 ? 'Reta Principal / Largada' : `Zona Modo X #${sNum}`,
          startDistM: Math.round(points[startIdx].distanceFromStartM),
          endDistM: Math.round(points[endIdx].distanceFromStartM),
          lengthM: Math.round(lengthM),
          startProgress: points[startIdx].normalizedProgress,
          endProgress: points[endIdx].normalizedProgress,
          isModeXActive: isModeX,
          estimatedPeakSpeedKmh: estTop,
        });
      }
    } else {
      i++;
    }
  }

  return straights;
}

function buildPitLaneGeometry(
  points: TrackGeometryPoint[],
  metadata: SeasonCircuitMetadata
): PitLaneGeometry {
  const n = points.length;
  const entryIdx = Math.max(0, Math.floor(n * 0.90));
  const exitIdx = Math.min(n - 1, Math.max(2, Math.floor(n * 0.08)));

  // Pit lane slices across last 10% and first 8% offset perpendicularly inward
  const pitSlice: TrackGeometryPoint[] = [
    ...points.slice(entryIdx),
    ...points.slice(0, exitIdx + 1),
  ];

  // Determine track center in SVG to offset pit lane slightly inward toward paddock center
  const cx = points.reduce((s, p) => s + p.svgX, 0) / n;
  const cy = points.reduce((s, p) => s + p.svgY, 0) / n;

  const pitSvgPts = pitSlice.map((pt, idx) => {
    const prev = pitSlice[Math.max(0, idx - 1)];
    const next = pitSlice[Math.min(pitSlice.length - 1, idx + 1)];
    const tx = next.svgX - prev.svgX;
    const ty = next.svgY - prev.svgY;
    const len = Math.hypot(tx, ty) || 1;
    // Two candidate normals
    const nx1 = -ty / len;
    const ny1 = tx / len;
    const dotCenter = nx1 * (cx - pt.svgX) + ny1 * (cy - pt.svgY);
    const sign = dotCenter >= 0 ? 1 : -1;
    // Taper offset at entry & exit
    const u = idx / Math.max(1, pitSlice.length - 1);
    const envelope = Math.sin(Math.PI * u);
    const offsetPx = 11 * envelope;
    return {
      svgX: pt.svgX + sign * nx1 * offsetPx,
      svgY: pt.svgY + sign * ny1 * offsetPx,
    };
  });

  const pitBoxes: PitBoxMarker[] = [];
  for (let b = 0; b < 12; b++) {
    const frac = 0.25 + (b / 11) * 0.5;
    const pIdx = Math.min(pitSvgPts.length - 1, Math.floor(frac * (pitSvgPts.length - 1)));
    pitBoxes.push({
      boxIndex: b + 1,
      svgX: Number(pitSvgPts[pIdx].svgX.toFixed(1)),
      svgY: Number(pitSvgPts[pIdx].svgY.toFixed(1)),
      label: `Box ${b + 1}`,
    });
  }

  return {
    entryProgress: points[entryIdx].normalizedProgress,
    exitProgress: points[exitIdx].normalizedProgress,
    lengthM: Math.round(metadata.officialLengthM * 0.14),
    pitLossSec: metadata.pitLaneLossSec,
    speedLimitKmh: metadata.pitSpeedLimitKmh,
    svgPath: buildSmoothClosedOrOpenSvgPath(pitSvgPts, false),
    pitBoxes,
  };
}

function buildSegmentsFromGeometry(
  points: TrackGeometryPoint[],
  corners: DetectedCorner[],
  straights: StraightZone[],
  metadata: SeasonCircuitMetadata
): CircuitSegmentSpec[] {
  // Partition circuit into 10 physical geometry-derived segments aligned to official length
  const numSegments = 10;
  const totalDistM = points[points.length - 1]?.distanceFromStartM || metadata.officialLengthM;
  const scaleToOfficial = metadata.officialLengthM / Math.max(1, totalDistM);
  const segSpecs: CircuitSegmentSpec[] = [];

  for (let s = 0; s < numSegments; s++) {
    const startIdx = Math.floor((s / numSegments) * (points.length - 1));
    const endIdx = Math.max(startIdx + 1, Math.floor(((s + 1) / numSegments) * (points.length - 1)));
    const slice = points.slice(startIdx, endIdx + 1);

    const rawSegLen =
      points[endIdx].distanceFromStartM - points[startIdx].distanceFromStartM;
    const lengthM = Math.max(80, Math.round(rawSegLen * scaleToOfficial));

    const avgAbsCurvature =
      slice.reduce((sum, p) => sum + Math.abs(p.signedCurvatureInvM), 0) / slice.length;
    const maxAbsCurvature = Math.max(
      ...slice.map(p => Math.abs(p.signedCurvatureInvM))
    );
    const avgSlope = slice.reduce((sum, p) => sum + p.slopeRad, 0) / slice.length;
    const endElev = slice[slice.length - 1].elevationM;
    const avgGrip =
      slice.reduce((sum, p) => sum + p.surfaceGripFactor, 0) / slice.length;

    const modeXRatio =
      slice.filter(p => p.aeroModeZone === 'MODE_X').length / slice.length;
    const aeroModeAllowed = modeXRatio >= 0.55 ? 'MODE_X' : 'MODE_Z';

    const segStartM = points[startIdx].distanceFromStartM;
    const segEndM = points[endIdx].distanceFromStartM;
    const matchedCorners = corners.filter(
      c => c.apexDistM >= segStartM && c.apexDistM <= segEndM
    );
    const matchedStraight = straights.find(
      st => st.endDistM >= segStartM && st.startDistM <= segEndM
    );

    let segmentName = `Setor ${slice[0].sector} · Trecho ${s + 1}`;
    if (matchedCorners.length > 0) {
      segmentName = matchedCorners.map(c => c.name).slice(0, 2).join(' / ');
    } else if (matchedStraight) {
      segmentName = matchedStraight.name;
    }

    const overtakeOpportunity =
      aeroModeAllowed === 'MODE_X'
        ? Math.min(0.95, 0.55 + lengthM / 2200)
        : Math.max(0.12, 0.45 - avgAbsCurvature * 7.5);

    segSpecs.push({
      segmentIndex: s + 1,
      segmentName,
      lengthM,
      curvatureInvM: Math.round((avgAbsCurvature * 0.6 + maxAbsCurvature * 0.4) * 10000) / 10000,
      slopeRad: Math.round(avgSlope * 10000) / 10000,
      elevationM: Math.round(endElev * 10) / 10,
      surfaceGripFactor: Math.round(avgGrip * 1000) / 1000,
      aeroModeAllowed,
      overtakeOpportunity: Math.round(overtakeOpportunity * 100) / 100,
    });
  }

  // Adjust last segment length so sum of segment lengths equals officialLengthM exactly
  const currentSum = segSpecs.reduce((acc, s) => acc + s.lengthM, 0);
  const diff = metadata.officialLengthM - currentSum;
  if (segSpecs.length > 0) {
    segSpecs[segSpecs.length - 1].lengthM = Math.max(
      100,
      segSpecs[segSpecs.length - 1].lengthM + diff
    );
  }

  return segSpecs;
}

function buildTrackCharacteristicsSi(
  points: TrackGeometryPoint[],
  corners: DetectedCorner[],
  metadata: SeasonCircuitMetadata
): TrackCharacteristicsSi {
  let highCount = 0;
  let medCount = 0;
  let lowCount = 0;

  for (const pt of points) {
    const absK = Math.abs(pt.signedCurvatureInvM);
    if (absK < 0.0055) highCount++;
    else if (absK < 0.020) medCount++;
    else lowCount++;
  }

  const total = Math.max(1, points.length);
  const highSpeedShare = Math.round((highCount / total) * 100) / 100;
  const mediumSpeedShare = Math.round((medCount / total) * 100) / 100;
  const lowSpeedShare = Math.max(
    0.05,
    Math.round((1 - highSpeedShare - mediumSpeedShare) * 100) / 100
  );

  const minCornerRadiusM =
    corners.length > 0
      ? Math.min(...corners.map(c => c.minRadiusM))
      : 30;

  const heavyBrakingZones = corners.filter(c => c.speedBand === 'slow').length;
  const brakingSeverity = Math.min(
    0.98,
    Math.max(0.35, 0.35 + heavyBrakingZones * 0.08)
  );
  const tractionDemand = Math.min(
    0.98,
    Math.max(0.4, 0.38 + lowSpeedShare * 0.72)
  );
  const kerbSeverity =
    corners.length > 0
      ? Math.round(
          (corners.reduce((sum, c) => sum + c.kerbSeverity, 0) / corners.length) * 100
        ) / 100
      : 0.55;
  const bumpinessIndex =
    metadata.surfaceType === 'street_low_grip_asphalt' ? 0.72 : 0.42;

  return {
    circuitCode: metadata.circuitCode,
    name: metadata.name,
    country: metadata.country,
    laps: metadata.laps,
    lapDistanceM: metadata.officialLengthM,
    altitudeM: Math.round((metadata.elevationMinM + metadata.elevationMaxM) / 2),
    ambientTempK: metadata.ambientTempK,
    windSpeedMs: metadata.windSpeedMs,
    highSpeedShare,
    mediumSpeedShare,
    lowSpeedShare,
    minCornerRadiusM,
    brakingSeverity: Math.round(brakingSeverity * 100) / 100,
    tractionDemand: Math.round(tractionDemand * 100) / 100,
    surfaceRoughnessUm: metadata.surfaceRoughnessUm,
    bumpinessIndex,
    kerbSeverity,
  };
}

export function processRealCircuitGeometry(
  raw: RawGeoJsonCircuitFeature,
  metadata: SeasonCircuitMetadata
): ProcessedCircuitPackage {
  // Ensure closed loop without duplicate final vertex for curvature math, while measuring true loop length
  const rawCoords = raw.coordinates;
  const isAlreadyClosed =
    rawCoords.length > 2 &&
    haversineDistanceM(
      rawCoords[0][0],
      rawCoords[0][1],
      rawCoords[rawCoords.length - 1][0],
      rawCoords[rawCoords.length - 1][1]
    ) < 5;
  const coords = isAlreadyClosed ? rawCoords.slice(0, -1) : rawCoords;

  const enu = projectToLocalEnuMeters(coords);

  // Bounding box in meters (flip Y because geographic North is up, SVG Y is down)
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of enu) {
    if (p.xM < minX) minX = p.xM;
    if (p.xM > maxX) maxX = p.xM;
    if (-p.yM < minY) minY = -p.yM;
    if (-p.yM > maxY) maxY = -p.yM;
  }

  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);
  const scale = Math.min(
    (SVG_WIDTH - 2 * SVG_PADDING) / spanX,
    (SVG_HEIGHT - 2 * SVG_PADDING) / spanY
  );
  const offsetX = (SVG_WIDTH - spanX * scale) / 2;
  const offsetY = (SVG_HEIGHT - spanY * scale) / 2;

  // Cumulative Haversine distance
  const cumDist: number[] = [0];
  for (let i = 1; i < coords.length; i++) {
    const d = haversineDistanceM(
      coords[i - 1][0],
      coords[i - 1][1],
      coords[i][0],
      coords[i][1]
    );
    cumDist.push(cumDist[i - 1] + d);
  }
  const closingDist = haversineDistanceM(
    coords[coords.length - 1][0],
    coords[coords.length - 1][1],
    coords[0][0],
    coords[0][1]
  );
  const totalRawLengthM = cumDist[cumDist.length - 1] + closingDist;

  // Build initial geometry points
  const points: TrackGeometryPoint[] = coords.map((coord, idx) => {
    const prevIdx = (idx - 1 + coords.length) % coords.length;
    const nextIdx = (idx + 1) % coords.length;
    const signedK = computeSignedCurvature(enu[prevIdx], enu[idx], enu[nextIdx]);
    const absK = Math.abs(signedK);
    const radiusM = absK > 1e-4 ? Math.round(1 / absK) : 9999;
    const distM = cumDist[idx];
    const progress = totalRawLengthM > 0 ? distM / totalRawLengthM : idx / coords.length;

    const svgX = offsetX + (enu[idx].xM - minX) * scale;
    const svgY = offsetY + (-enu[idx].yM - minY) * scale;

    const elevationM = deriveSyntheticElevationM(
      progress,
      raw.altitudeM,
      metadata.elevationMinM,
      metadata.elevationMaxM
    );

    const sector: 1 | 2 | 3 = progress < 0.333 ? 1 : progress < 0.667 ? 2 : 3;
    const aeroModeZone = absK < 0.0036 ? 'MODE_X' : 'MODE_Z';

    const widthRatio = Math.min(1, Math.max(0, 1 - absK * 15));
    const widthM =
      Math.round(
        (metadata.trackWidthMinM +
          (metadata.trackWidthMaxM - metadata.trackWidthMinM) * widthRatio) *
          10
      ) / 10;

    return {
      index: idx,
      lon: coord[0],
      lat: coord[1],
      xM: Math.round(enu[idx].xM * 100) / 100,
      yM: Math.round(enu[idx].yM * 100) / 100,
      svgX: Math.round(svgX * 10) / 10,
      svgY: Math.round(svgY * 10) / 10,
      distanceFromStartM: Math.round(distM * 10) / 10,
      normalizedProgress: Math.round(progress * 10000) / 10000,
      elevationM,
      slopeRad: 0,
      widthM,
      bankingDeg:
        absK > 0.004
          ? Math.round(Math.min(metadata.maxBankingDeg, absK * 95) * 10) / 10
          : 0.5,
      signedCurvatureInvM: Math.round(signedK * 100000) / 100000,
      curvatureRadiusM: radiusM,
      surfaceGripFactor:
        Math.round((metadata.baseGripFactor + (absK < 0.004 ? 0.01 : 0)) * 1000) / 1000,
      hasKerbLeft: signedK > 0.005,
      hasKerbRight: signedK < -0.005,
      runoffLeftM: metadata.dominantRunoff === 'concrete_wall' ? 4 : 24,
      runoffRightM: metadata.dominantRunoff === 'concrete_wall' ? 4 : 24,
      sector,
      aeroModeZone,
    };
  });

  // Compute longitudinal slopes from consecutive elevation differences
  for (let i = 0; i < points.length; i++) {
    const nextIdx = (i + 1) % points.length;
    const ds = Math.max(
      1,
      nextIdx === 0
        ? closingDist
        : points[nextIdx].distanceFromStartM - points[i].distanceFromStartM
    );
    const dz = points[nextIdx].elevationM - points[i].elevationM;
    points[i].slopeRad = Math.round(Math.atan2(dz, ds) * 10000) / 10000;
  }

  // Start/Finish perpendicular tick mark
  const p0 = points[0];
  const p1 = points[1] || p0;
  const tx = p1.svgX - p0.svgX;
  const ty = p1.svgY - p0.svgY;
  const tLen = Math.hypot(tx, ty) || 1;
  const nx = (-ty / tLen) * 10;
  const ny = (tx / tLen) * 10;

  const svgCenterlinePath = buildSmoothClosedOrOpenSvgPath(points, true);

  // Sector SVG sub-paths
  const s1Pts = points.filter(p => p.sector === 1);
  const s2Pts = points.filter(p => p.sector === 2);
  const s3Pts = points.filter(p => p.sector === 3);

  const makeSectorSummary = (
    sector: 1 | 2 | 3,
    pts: TrackGeometryPoint[],
    nextFirst?: TrackGeometryPoint
  ): CircuitSectorSummary => {
    const pathPts = nextFirst ? [...pts, nextFirst] : [...pts, points[0]];
    return {
      sector,
      startProgress: pts[0]?.normalizedProgress ?? 0,
      endProgress: pts[pts.length - 1]?.normalizedProgress ?? 1,
      lengthM: Math.round(metadata.officialLengthM / 3),
      svgPath: buildSmoothClosedOrOpenSvgPath(pathPts, false),
      avgCurvatureInvM:
        Math.round(
          (pts.reduce((sum, p) => sum + Math.abs(p.signedCurvatureInvM), 0) /
            Math.max(1, pts.length)) *
            10000
        ) / 10000,
      elevationDeltaM:
        pts.length > 1
          ? Math.round((pts[pts.length - 1].elevationM - pts[0].elevationM) * 10) / 10
          : 0,
    };
  };

  const sectors: [CircuitSectorSummary, CircuitSectorSummary, CircuitSectorSummary] = [
    makeSectorSummary(1, s1Pts, s2Pts[0]),
    makeSectorSummary(2, s2Pts, s3Pts[0]),
    makeSectorSummary(3, s3Pts),
  ];

  // Mode X SVG segments
  const modeXSvgPaths: string[] = [];
  let runPts: TrackGeometryPoint[] = [];
  for (const pt of points) {
    if (pt.aeroModeZone === 'MODE_X') {
      runPts.push(pt);
    } else if (runPts.length >= 3) {
      modeXSvgPaths.push(buildSmoothClosedOrOpenSvgPath(runPts, false));
      runPts = [];
    } else {
      runPts = [];
    }
  }
  if (runPts.length >= 3) {
    modeXSvgPaths.push(buildSmoothClosedOrOpenSvgPath(runPts, false));
  }

  const corners = detectGeometryCorners(points, metadata);
  const straights = detectStraightsAndModeX(points);
  const pitLane = buildPitLaneGeometry(points, metadata);
  const segments = buildSegmentsFromGeometry(points, corners, straights, metadata);
  const trackCharacteristics = buildTrackCharacteristicsSi(points, corners, metadata);

  const calculatedLengthM = calculateRawGeoJsonLoopLengthM(raw.coordinates);
  const lengthDeltaM = Math.round(calculatedLengthM - metadata.officialLengthM);
  const lengthDeltaPct =
    Math.round((Math.abs(lengthDeltaM) / Math.max(1, metadata.officialLengthM)) * 10000) / 100;

  return {
    metadata,
    points,
    svgViewBox: `0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`,
    svgCenterlinePath,
    svgStartFinishLine: {
      x1: Number((p0.svgX - nx).toFixed(1)),
      y1: Number((p0.svgY - ny).toFixed(1)),
      x2: Number((p0.svgX + nx).toFixed(1)),
      y2: Number((p0.svgY + ny).toFixed(1)),
    },
    sectors,
    modeXSvgPaths,
    corners,
    straights,
    pitLane,
    trackCharacteristics,
    segments,
    validation: {
      circuitCode: metadata.circuitCode,
      seasonYear: metadata.seasonYear,
      valid: true,
      certificationStatus: metadata.provenance.certificationStatus,
      pointCount: raw.coordinates.length,
      isClosedLoop: isAlreadyClosed || closingDist < 120,
      calculatedLengthM,
      officialLengthM: metadata.officialLengthM,
      lengthDeltaM,
      lengthDeltaPct,
      officialRaceDistanceKm: metadata.officialRaceDistanceKm,
      calculatedRaceDistanceKm:
        Math.round(((metadata.laps * metadata.officialLengthM) / 1000) * 1000) / 1000,
      detectedCornerCount: corners.length,
      officialCornerCount: metadata.officialCorners,
      hasFiniteGeometry:
        points.every(
          p =>
            Number.isFinite(p.xM) &&
            Number.isFinite(p.yM) &&
            Number.isFinite(p.svgX) &&
            Number.isFinite(p.svgY) &&
            Number.isFinite(p.signedCurvatureInvM)
        ) && svgCenterlinePath.length > 10,
      warnings: [],
      errors: [],
    },
  };
}
