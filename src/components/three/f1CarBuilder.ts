import * as THREE from 'three';
import type { Livery2026Spec } from '../../data/f12026Liveries';
import type { AeroMode, TireCompound } from '../../types/f1';
import { createF1TextureBundle, type F1TextureBundle } from './f1Textures';

export interface F1CarBuildParams {
  wheelbaseM: number;
  frontTrackM: number;
  rearTrackM: number;
  frontRideHeightMm: number;
  rearRideHeightMm: number;
  frontWingFlapDeg: number;
  rearWingFlapDeg: number;
  wingSpanM?: number;
  diffuserAngleDeg: number;
  sidepodConcept: 'downwash' | 'conventional' | 'zeropod';
  sidepodInletAreaM2: number;
  suspensionFront: 'pushrod' | 'pullrod';
  suspensionRear: 'pushrod' | 'pullrod';
  aeroMode: AeroMode;
  tireCompound: TireCompound;
}

export type CarVisualMode = 'showroom' | 'xray_cad';

export interface BuiltF1Car {
  root: THREE.Group;
  bodyPaintMaterials: THREE.MeshPhysicalMaterial[];
  carbonMaterials: THREE.MeshStandardMaterial[];
  explodeParts: Array<{
    group: THREE.Group;
    basePos: THREE.Vector3;
    offset: THREE.Vector3;
  }>;
  setVisualMode: (mode: CarVisualMode) => void;
  applyExplodeFactor: (factor01: number) => void;
  dispose: () => void;
}

interface LoftStation {
  xM: number;
  zBottomM: number;
  zTopM: number;
  halfWidthM: number;
  topRoundness: number;
  bottomFlatness: number;
  /** Optional subtle upper shoulder concave sculpting for waterslide sidepods */
  waterslideDip?: number;
}

/**
 * Generates a closed, smoothly shaded multi-station lofted BufferGeometry with guaranteed
 * outward normals and zero UV folding seams.
 */
function buildLoftedHull(
  stations: LoftStation[],
  wheelbaseM: number,
  radialSegments = 40
): THREE.BufferGeometry {
  const xCenter = wheelbaseM / 2;
  const ringCount = radialSegments + 1;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const xMin = stations[0].xM;
  const xSpan = Math.max(0.01, stations[stations.length - 1].xM - xMin);

  for (let s = 0; s < stations.length; s += 1) {
    const st = stations[s];
    const threeX = st.xM - xCenter;
    const zMid = (st.zBottomM + st.zTopM) * 0.5;
    const zHalf = Math.max(0.004, (st.zTopM - st.zBottomM) * 0.5);
    const u = (st.xM - xMin) / xSpan;

    for (let r = 0; r < ringCount; r += 1) {
      const frac = r / radialSegments;
      // Start at bottom keel (-PI/2) so frac=0.25 is +Z, frac=0.50 is +Y crown, frac=0.75 is -Z
      const theta = -Math.PI / 2 + frac * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      const absSin = Math.abs(sinT);
      let yOffset: number;
      if (sinT >= 0) {
        yOffset = Math.pow(absSin, 1 / Math.max(0.4, st.topRoundness)) * zHalf;
        if (st.waterslideDip && absSin > 0.35 && Math.abs(cosT) < 0.72) {
          yOffset -= st.waterslideDip * (1 - Math.abs(cosT) / 0.72) * 0.045;
        }
      } else {
        const flatPow = 1 - st.bottomFlatness * 0.55;
        yOffset = -Math.pow(absSin, Math.max(0.28, flatPow)) * zHalf;
      }

      const zWidthScale = sinT >= 0 ? Math.pow(Math.abs(cosT), 0.85) : Math.pow(Math.abs(cosT), 0.72);
      const threeZ = Math.sign(cosT) * zWidthScale * st.halfWidthM;
      const threeY = zMid + yOffset;

      positions.push(threeX, threeY, threeZ);
      // v=0.5 aligns cleanly to dead-center top spine (+Y); keel seam stays at dark carbon v=0 / v=1
      uvs.push(u, 1 - frac);
    }
  }

  for (let s = 0; s < stations.length - 1; s += 1) {
    for (let r = 0; r < radialSegments; r += 1) {
      const a = s * ringCount + r;
      const b = (s + 1) * ringCount + r;
      const c = (s + 1) * ringCount + (r + 1);
      const d = s * ringCount + (r + 1);

      // Outward CCW winding: (b - a) along +X cross (d - a) along +theta points outward!
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Generates an asymmetric contoured sidepod shell whose inward edge stays tucked
 * cleanly inside the monocoque wall (never crossing z=0 into the opposite sidepod!)
 * and whose outer UVs map cleanly front->back (u) and bottom->top (v).
 */
function buildSidepodHull(
  stations: LoftStation[],
  wheelbaseM: number,
  sideSign: -1 | 1,
  innerTuckM: number,
  outerCenterOffsetM: number,
  radialSegments = 34
): THREE.BufferGeometry {
  const xCenter = wheelbaseM / 2;
  const ringCount = radialSegments + 1;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const xMin = stations[0].xM;
  const xSpan = Math.max(0.01, stations[stations.length - 1].xM - xMin);

  for (let s = 0; s < stations.length; s += 1) {
    const st = stations[s];
    const threeX = st.xM - xCenter;
    const zMid = (st.zBottomM + st.zTopM) * 0.5;
    const zHalf = Math.max(0.006, (st.zTopM - st.zBottomM) * 0.5);
    const u = (st.xM - xMin) / xSpan;

    for (let r = 0; r < ringCount; r += 1) {
      const frac = r / radialSegments;
      const theta = -Math.PI / 2 + frac * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      const absSin = Math.abs(sinT);
      let yOffset: number;
      if (sinT >= 0) {
        yOffset = Math.pow(absSin, 1 / Math.max(0.4, st.topRoundness)) * zHalf;
        if (st.waterslideDip && Math.abs(cosT) < 0.75) {
          yOffset -= st.waterslideDip * (1 - Math.abs(cosT) / 0.75) * 0.042;
        }
      } else {
        const flatPow = 1 - st.bottomFlatness * 0.55;
        yOffset = -Math.pow(absSin, Math.max(0.28, flatPow)) * zHalf;
      }

      const zWidthScale = sinT >= 0 ? Math.pow(Math.abs(cosT), 0.84) : Math.pow(Math.abs(cosT), 0.70);
      const rawZ = outerCenterOffsetM + Math.sign(cosT) * zWidthScale * st.halfWidthM;
      // Clamp inward surface strictly inside chassis half-width so left & right pods never cross/clip
      const clampedZ = sideSign > 0 ? Math.max(innerTuckM, rawZ) : Math.min(-innerTuckM, rawZ);
      const threeY = zMid + yOffset;

      positions.push(threeX, threeY, clampedZ);
      const vNorm = THREE.MathUtils.clamp(0.5 + (yOffset / Math.max(0.01, zHalf)) * 0.5, 0, 1);
      uvs.push(u, vNorm);
    }
  }

  for (let s = 0; s < stations.length - 1; s += 1) {
    for (let r = 0; r < radialSegments; r += 1) {
      const a = s * ringCount + r;
      const b = (s + 1) * ringCount + r;
      const c = (s + 1) * ringCount + (r + 1);
      const d = s * ringCount + (r + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Maps ExtrudeGeometry raw world-unit UVs into clean normalized [0..1] planar coordinates
 * so shark-fin numbers and wing endplate badges render without tiling or stretching.
 */
function normalizePlanarUVs(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const pos = geo.getAttribute('position');
  if (!bb || !pos) return geo;

  const spanX = Math.max(0.001, bb.max.x - bb.min.x);
  const spanY = Math.max(0.001, bb.max.y - bb.min.y);
  const uvArr = new Float32Array(pos.count * 2);

  for (let i = 0; i < pos.count; i += 1) {
    uvArr[i * 2] = (pos.getX(i) - bb.min.x) / spanX;
    uvArr[i * 2 + 1] = (pos.getY(i) - bb.min.y) / spanY;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uvArr, 2));
  return geo;
}

/**
 * Generates a swept, gull-wing curved 2026 F1 multi-station airfoil element.
 */
function buildSweptWingElement(
  chordCenterM: number,
  chordTipM: number,
  thicknessM: number,
  spanM: number,
  sweepBackM: number,
  archDropCenterM: number,
  camberM: number,
  spanSegments = 22,
  profileSegments = 14
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const ringCols = profileSegments + 1;

  for (let s = 0; s <= spanSegments; s += 1) {
    const t = s / spanSegments;
    const spanFrac = t * 2 - 1;
    const absFrac = Math.abs(spanFrac);
    const threeZ = spanFrac * (spanM * 0.5);

    const xSweep = sweepBackM * Math.pow(absFrac, 1.45);
    const yArch = -archDropCenterM * (1 - Math.pow(absFrac, 1.8));
    const localChord = THREE.MathUtils.lerp(chordCenterM, chordTipM, Math.pow(absFrac, 1.2));
    const localThick = thicknessM * THREE.MathUtils.lerp(1.0, 0.8, absFrac);

    for (let p = 0; p <= profileSegments; p += 1) {
      const theta = (p / profileSegments) * Math.PI * 2;
      const chordFrac = 0.5 - 0.5 * Math.cos(theta);
      const signY = Math.sin(theta) >= 0 ? 1 : -1;

      const localX = xSweep + (chordFrac - 0.5) * localChord;
      const camberCurve = Math.sin(chordFrac * Math.PI) * camberM;
      const foilThick =
        signY >= 0
          ? Math.sin(Math.pow(chordFrac, 0.72) * Math.PI) * localThick * 0.72
          : -Math.sin(Math.pow(chordFrac, 0.85) * Math.PI) * localThick * 0.28;
      const localY = yArch + camberCurve + foilThick;

      positions.push(localX, localY, threeZ);
      uvs.push(t, chordFrac);
    }
  }

  for (let s = 0; s < spanSegments; s += 1) {
    for (let p = 0; p < profileSegments; p += 1) {
      const a = s * ringCols + p;
      const b = (s + 1) * ringCols + p;
      const c = (s + 1) * ringCols + (p + 1);
      const d = s * ringCols + (p + 1);

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function buildWingElement(
  chordM: number,
  thicknessM: number,
  spanM: number,
  camberM: number
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-chordM * 0.5, 0);
  shape.quadraticCurveTo(-chordM * 0.12, thicknessM * 0.78 + camberM, chordM * 0.5, -camberM * 0.35);
  shape.quadraticCurveTo(0, -thicknessM * 0.34 + camberM * 0.25, -chordM * 0.5, 0);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: spanM,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.003,
    bevelSegments: 2,
    curveSegments: 12,
  });
  geo.translate(0, 0, -spanM * 0.5);
  geo.computeVertexNormals();
  return geo;
}

export function buildF1Car2026(
  livery: Livery2026Spec,
  params: F1CarBuildParams,
  maxAnisotropy = 4,
  driverIndex: 0 | 1 = 0
): BuiltF1Car {
  const activeDriver = livery.drivers[driverIndex] || livery.drivers[0];
  const aero = livery.aeroGeometry;
  const L = params.wheelbaseM;
  const xCenter = L / 2;
  const toThree = (xM: number, yM: number, zM: number) =>
    new THREE.Vector3(xM - xCenter, zM, yM);

  const textures: F1TextureBundle = createF1TextureBundle(
    livery,
    params.tireCompound,
    maxAnisotropy,
    driverIndex
  );
  const disposables: Array<{ dispose: () => void }> = [textures];
  const regGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    disposables.push(g);
    return g;
  };
  const regMat = <T extends THREE.Material>(m: T): T => {
    disposables.push(m);
    return m;
  };

  const isGloss = livery.finishType === 'gloss';
  const isSatin = livery.finishType === 'satin_carbon';
  const bodyPaintMaterials: THREE.MeshPhysicalMaterial[] = [];
  const carbonMaterials: THREE.MeshStandardMaterial[] = [];

  const paintRoughness = isGloss ? 0.14 : isSatin ? 0.32 : 0.48;
  const paintMetalness = isGloss ? 0.24 : isSatin ? 0.32 : 0.16;
  const paintClearcoat = isGloss ? 0.96 : isSatin ? 0.42 : 0.14;
  const paintClearcoatRough = isGloss ? 0.06 : isSatin ? 0.26 : 0.46;

  // Separate dedicated material zones so chassis/sidepod/wing textures never repeat or bleed across parts
  const monocoqueMat = regMat(
    new THREE.MeshPhysicalMaterial({
      map: textures.liveryMonocoque,
      roughness: paintRoughness,
      metalness: paintMetalness,
      clearcoat: paintClearcoat,
      clearcoatRoughness: paintClearcoatRough,
      reflectivity: 0.9,
    })
  );
  bodyPaintMaterials.push(monocoqueMat);

  const sidepodMat = regMat(
    new THREE.MeshPhysicalMaterial({
      map: textures.liverySidepod,
      roughness: paintRoughness,
      metalness: paintMetalness,
      clearcoat: paintClearcoat,
      clearcoatRoughness: paintClearcoatRough,
      reflectivity: 0.9,
    })
  );
  bodyPaintMaterials.push(sidepodMat);

  const sidepodLeftMat = regMat(
    new THREE.MeshPhysicalMaterial({
      map: textures.liverySidepodLeft,
      roughness: paintRoughness,
      metalness: paintMetalness,
      clearcoat: paintClearcoat,
      clearcoatRoughness: paintClearcoatRough,
      reflectivity: 0.9,
    })
  );
  bodyPaintMaterials.push(sidepodLeftMat);

  const cowlMat = regMat(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(aero.cowlHex || livery.primaryHex),
      roughness: paintRoughness,
      metalness: paintMetalness,
      clearcoat: paintClearcoat,
      clearcoatRoughness: paintClearcoatRough,
    })
  );
  bodyPaintMaterials.push(cowlMat);

  const finPaintMat = regMat(
    new THREE.MeshPhysicalMaterial({
      map: textures.liveryFin,
      roughness: paintRoughness + 0.04,
      metalness: paintMetalness,
      clearcoat: paintClearcoat,
      clearcoatRoughness: paintClearcoatRough,
      side: THREE.DoubleSide,
    })
  );
  bodyPaintMaterials.push(finPaintMat);

  const frontWingPrimaryMat = regMat(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(aero.frontWingPrimaryHex || livery.primaryHex),
      roughness: paintRoughness,
      metalness: paintMetalness,
      clearcoat: paintClearcoat,
      clearcoatRoughness: paintClearcoatRough,
    })
  );
  bodyPaintMaterials.push(frontWingPrimaryMat);

  const frontWingEndplateMat = regMat(
    new THREE.MeshPhysicalMaterial({
      map: textures.liveryFrontWing,
      roughness: paintRoughness + 0.06,
      metalness: 0.24,
      clearcoat: paintClearcoat,
      side: THREE.DoubleSide,
    })
  );
  bodyPaintMaterials.push(frontWingEndplateMat);

  const rearWingFlapMat = regMat(
    new THREE.MeshPhysicalMaterial({
      map: textures.liveryRearWing,
      roughness: paintRoughness,
      metalness: paintMetalness,
      clearcoat: paintClearcoat,
      clearcoatRoughness: paintClearcoatRough,
      side: THREE.DoubleSide,
    })
  );
  bodyPaintMaterials.push(rearWingFlapMat);

  const accentPaintMat = regMat(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(aero.floorTrimHex || livery.accentHex),
      roughness: 0.2,
      metalness: 0.34,
      clearcoat: 0.85,
    })
  );
  bodyPaintMaterials.push(accentPaintMat);

  const haloMat = regMat(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(aero.haloHex || '#161820'),
      roughness: 0.22,
      metalness: 0.3,
      clearcoat: 0.72,
    })
  );
  bodyPaintMaterials.push(haloMat);

  const wishboneMat = regMat(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(aero.wishboneHex || '#181A22'),
      roughness: aero.wishboneHex === '#E5E7EB' ? 0.25 : 0.42,
      metalness: aero.wishboneHex === '#E5E7EB' ? 0.18 : 0.38,
    })
  );
  carbonMaterials.push(wishboneMat);

  const tCamMat = regMat(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(activeDriver.tCamHex),
      roughness: 0.24,
      metalness: 0.35,
    })
  );

  const carbonMat = regMat(
    new THREE.MeshStandardMaterial({
      map: textures.carbonAlbedo,
      bumpMap: textures.carbonBump,
      bumpScale: 0.004,
      roughness: 0.42,
      metalness: 0.34,
      side: THREE.DoubleSide,
    })
  );
  carbonMaterials.push(carbonMat);

  const titaniumMat = regMat(
    new THREE.MeshStandardMaterial({
      color: 0x4b5563,
      roughness: 0.22,
      metalness: 0.88,
    })
  );

  const exhaustMat = regMat(
    new THREE.MeshStandardMaterial({
      color: 0xa1a8b5,
      roughness: 0.20,
      metalness: 0.92,
    })
  );

  const tireTreadMat = regMat(
    new THREE.MeshStandardMaterial({
      color: 0x16171d,
      bumpMap: textures.tireTreadBump,
      bumpScale: 0.0035,
      roughness: 0.84,
      metalness: 0.04,
    })
  );

  const tireSideMat = regMat(
    new THREE.MeshStandardMaterial({
      map: textures.tireSidewall,
      roughness: 0.62,
      metalness: 0.16,
    })
  );

  const root = new THREE.Group();
  root.name = 'F1Car2026Root';

  const explodeParts: BuiltF1Car['explodeParts'] = [];
  const registerExplode = (group: THREE.Group, offsetX: number, offsetY: number, offsetZ: number) => {
    explodeParts.push({
      group,
      basePos: group.position.clone(),
      offset: new THREE.Vector3(offsetX, offsetY, offsetZ),
    });
  };

  const rideFrontM = Math.max(0.015, params.frontRideHeightMm * 0.001);
  const rideRearM = Math.max(0.030, params.rearRideHeightMm * 0.001);
  const rakeMidM = (rideFrontM + rideRearM) * 0.5;
  const chassisPitchRad = Math.atan2(rideRearM - rideFrontM, L);

  const isModeX = params.aeroMode === 'mode_x';
  const fwActiveDeg = isModeX ? params.frontWingFlapDeg * 0.34 : params.frontWingFlapDeg;
  const rwActiveDeg = isModeX ? params.rearWingFlapDeg * 0.28 : params.rearWingFlapDeg;

  // ---------------------------------------------------------------------------
  // 0. CLEAN CONTACT FLOOR SHADOW (NO GLOWING NEON RING OR OVERLAPPING PLINTH)
  // ---------------------------------------------------------------------------
  const plinthGroup = new THREE.Group();
  plinthGroup.name = 'ShowroomTurntablePlinth';

  const shadowMat = regMat(
    new THREE.MeshBasicMaterial({
      map: textures.floorShadow,
      transparent: true,
      opacity: 0.86,
      depthWrite: false,
    })
  );
  const shadowPlane = new THREE.Mesh(regGeo(new THREE.PlaneGeometry(5.6, 2.55)), shadowMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.set(0.06, 0.002, 0);
  plinthGroup.add(shadowPlane);
  root.add(plinthGroup);

  // ---------------------------------------------------------------------------
  // 1. MONOCOQUE TUB & PER-TEAM SCULPTED 2026 NOSECONE (NO FLOATING NOSE PLATE!)
  // ---------------------------------------------------------------------------
  const monocoqueGroup = new THREE.Group();
  monocoqueGroup.name = 'MonocoqueAndNose';

  const noseTipWidth =
    aero.noseStyle === 'slim_needle'
      ? 0.045
      : aero.noseStyle === 'broad_spoon'
      ? 0.088
      : aero.noseStyle === 'wedge_chisel'
      ? 0.068
      : 0.058;
  const noseTipZBottom = aero.noseStyle === 'slim_needle' ? 0.155 : 0.172;
  const airboxPeakZ = aero.airboxShape === 'oval_wide' ? 0.93 : aero.airboxShape === 'triangle' ? 0.96 : 0.945;

  const monoStations: LoftStation[] = [
    { xM: -1.16, zBottomM: noseTipZBottom, zTopM: noseTipZBottom + 0.052, halfWidthM: noseTipWidth, topRoundness: 0.95, bottomFlatness: 0.25 },
    { xM: -0.96, zBottomM: 0.155, zTopM: 0.258, halfWidthM: noseTipWidth + 0.05, topRoundness: 0.95, bottomFlatness: 0.35 },
    { xM: -0.62, zBottomM: 0.14, zTopM: 0.335, halfWidthM: 0.162, topRoundness: 0.9, bottomFlatness: 0.55 },
    { xM: -0.22, zBottomM: 0.12, zTopM: 0.452, halfWidthM: 0.214, topRoundness: 0.82, bottomFlatness: 0.72 },
    { xM: 0.18, zBottomM: 0.085, zTopM: 0.535, halfWidthM: 0.255, topRoundness: 0.75, bottomFlatness: 0.88 },
    { xM: 0.58, zBottomM: 0.08, zTopM: 0.55, halfWidthM: 0.275, topRoundness: 0.72, bottomFlatness: 0.92 },
    { xM: 1.15, zBottomM: 0.08, zTopM: 0.585, halfWidthM: 0.262, topRoundness: 0.85, bottomFlatness: 0.92 },
    { xM: 1.55, zBottomM: 0.09, zTopM: airboxPeakZ, halfWidthM: aero.airboxShape === 'oval_wide' ? 0.226 : 0.206, topRoundness: 1.25, bottomFlatness: 0.8 },
    { xM: 2.25, zBottomM: 0.10, zTopM: 0.835, halfWidthM: 0.175, topRoundness: 1.32, bottomFlatness: 0.78 },
    { xM: 2.95, zBottomM: 0.14, zTopM: 0.56, halfWidthM: 0.108, topRoundness: 1.25, bottomFlatness: 0.55 },
    { xM: L + 0.24, zBottomM: 0.22, zTopM: 0.385, halfWidthM: 0.06, topRoundness: 1.05, bottomFlatness: 0.3 },
  ];
  const monoMesh = new THREE.Mesh(regGeo(buildLoftedHull(monoStations, L, 40)), monocoqueMat);
  monoMesh.castShadow = true;
  monoMesh.receiveShadow = true;
  monocoqueGroup.add(monoMesh);

  // Nose Pitot Sensor Probe
  const pitotStem = new THREE.Mesh(regGeo(new THREE.CylinderGeometry(0.004, 0.005, 0.12, 8)), titaniumMat);
  pitotStem.rotation.z = THREE.MathUtils.degToRad(18);
  pitotStem.position.copy(toThree(-0.18, 0, 0.515));
  monocoqueGroup.add(pitotStem);

  // Cockpit carbon recess & headrest bolsters
  const cockpitRecess = new THREE.Mesh(regGeo(new THREE.BoxGeometry(0.76, 0.11, 0.33)), carbonMat);
  cockpitRecess.position.copy(toThree(1.02, 0, 0.53));
  monocoqueGroup.add(cockpitRecess);

  for (const side of [-1, 1] as const) {
    const bolster = new THREE.Mesh(regGeo(new THREE.BoxGeometry(0.54, 0.08, 0.05)), cowlMat);
    bolster.position.copy(toThree(1.04, side * 0.20, 0.575));
    monocoqueGroup.add(bolster);
  }

  // Distinct Per-Team Roll-Hoop Airbox Intake Shape
  let airboxGeo: THREE.BufferGeometry;
  if (aero.airboxShape === 'triangle') {
    const triShape = new THREE.Shape();
    triShape.moveTo(-0.08, -0.06);
    triShape.lineTo(0.08, -0.06);
    triShape.lineTo(0, 0.09);
    triShape.closePath();
    airboxGeo = regGeo(new THREE.ExtrudeGeometry(triShape, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.008 }));
    airboxGeo.rotateY(Math.PI / 2);
    airboxGeo.translate(-0.08, 0, 0);
  } else if (aero.airboxShape === 'oval_wide') {
    airboxGeo = regGeo(new THREE.CylinderGeometry(0.092, 0.104, 0.16, 20));
    airboxGeo.rotateZ(Math.PI / 2);
    airboxGeo.scale(1, 0.85, 1.32);
  } else if (aero.airboxShape === 'circular') {
    airboxGeo = regGeo(new THREE.CylinderGeometry(0.088, 0.094, 0.16, 20));
    airboxGeo.rotateZ(Math.PI / 2);
  } else {
    airboxGeo = regGeo(new THREE.CylinderGeometry(0.084, 0.098, 0.17, 18));
    airboxGeo.rotateZ(Math.PI / 2);
  }
  const airboxIntake = new THREE.Mesh(airboxGeo, carbonMat);
  airboxIntake.position.copy(toThree(1.48, 0, 0.845));
  monocoqueGroup.add(airboxIntake);

  // Official FIA T-Cam (Black = Driver 1, Neon Yellow = Driver 2)
  const tCamPost = new THREE.Mesh(regGeo(new THREE.BoxGeometry(0.05, 0.08, 0.024)), carbonMat);
  tCamPost.position.copy(toThree(1.55, 0, 0.99));
  const tCamBar = new THREE.Mesh(regGeo(new THREE.BoxGeometry(0.065, 0.024, 0.25)), tCamMat);
  tCamBar.position.copy(toThree(1.55, 0, 1.03));
  monocoqueGroup.add(tCamPost, tCamBar);

  // Stainless Central Exhaust Tailpipe + Twin Wastegates
  const tailpipe = new THREE.Mesh(regGeo(new THREE.CylinderGeometry(0.05, 0.054, 0.24, 20)), exhaustMat);
  tailpipe.rotation.z = Math.PI / 2;
  tailpipe.position.copy(toThree(L + 0.34, 0, 0.36));
  monocoqueGroup.add(tailpipe);

  for (const side of [-1, 1] as const) {
    const wastegate = new THREE.Mesh(regGeo(new THREE.CylinderGeometry(0.019, 0.021, 0.19, 14)), exhaustMat);
    wastegate.rotation.z = Math.PI / 2;
    wastegate.position.copy(toThree(L + 0.32, side * 0.072, 0.345));
    monocoqueGroup.add(wastegate);
  }

  root.add(monocoqueGroup);

  // ---------------------------------------------------------------------------
  // 2. SCULPTED COKE-BOTTLE SIDEPODS (NON-OVERLAPPING INNER TUCK) & SHARK FIN
  // ---------------------------------------------------------------------------
  const engineCoverGroup = new THREE.Group();
  engineCoverGroup.name = 'SidepodsAndEngineCover';

  const inletScale = Math.max(0.84, Math.min(1.20, params.sidepodInletAreaM2 / 0.032));
  const profileWidthFactor =
    aero.sidepodProfile === 'compact_inwash'
      ? 0.78
      : aero.sidepodProfile === 'box_shoulder'
      ? 1.05
      : aero.sidepodProfile === 'waterslide_gully'
      ? 1.01
      : 0.98;
  const conceptScale = params.sidepodConcept === 'zeropod' ? 0.74 : profileWidthFactor;
  const maxPodHalfW = Math.min(0.46, 0.38 * conceptScale * Math.sqrt(inletScale));
  const podDropZ = aero.sidepodProfile === 'downwash_ramp' ? 0.285 : aero.sidepodProfile === 'box_shoulder' ? 0.385 : 0.335;
  const gullyDip = aero.sidepodProfile === 'waterslide_gully' ? 0.75 : 0;

  for (const side of [-1, 1] as const) {
    const podStations: LoftStation[] = [
      { xM: 1.36, zBottomM: 0.24, zTopM: 0.505, halfWidthM: maxPodHalfW * 0.56, topRoundness: aero.sidepodProfile === 'box_shoulder' ? 0.55 : 0.74, bottomFlatness: 0.38 },
      { xM: 1.58, zBottomM: 0.165, zTopM: 0.518, halfWidthM: maxPodHalfW * 0.88, topRoundness: 0.76, bottomFlatness: 0.58, waterslideDip: gullyDip },
      { xM: 1.94, zBottomM: 0.112, zTopM: 0.468, halfWidthM: maxPodHalfW * 0.80, topRoundness: 0.82, bottomFlatness: 0.86, waterslideDip: gullyDip },
      { xM: 2.38, zBottomM: 0.10, zTopM: podDropZ, halfWidthM: maxPodHalfW * 0.54, topRoundness: 0.92, bottomFlatness: 0.85 },
      { xM: 2.86, zBottomM: 0.11, zTopM: 0.255, halfWidthM: maxPodHalfW * 0.22, topRoundness: 1.0, bottomFlatness: 0.75 },
    ];
    // Keep inner boundary strictly at side * 0.16m inside the monocoque wall (zero crossover past z=0!)
    const podOuterCenterZ = side * (0.265 + maxPodHalfW * 0.55);
    const podGeo = regGeo(buildSidepodHull(podStations, L, side, 0.16, podOuterCenterZ, 34));
    const podMesh = new THREE.Mesh(podGeo, side < 0 ? sidepodLeftMat : sidepodMat);
    podMesh.castShadow = true;
    podMesh.receiveShadow = true;
    engineCoverGroup.add(podMesh);

    // Overbite Sidepod Intake Scoop + Carbon Radiator Mouth cleanly seated at pod leading face
    const overbite = new THREE.Mesh(
      regGeo(new THREE.BoxGeometry(0.15, 0.022, maxPodHalfW * 0.92)),
      cowlMat
    );
    overbite.position.copy(toThree(1.33, side * (0.29 + maxPodHalfW * 0.45), 0.50));
    overbite.rotation.y = side * 0.16;
    engineCoverGroup.add(overbite);

    const inletMouth = new THREE.Mesh(
      regGeo(new THREE.BoxGeometry(0.09, 0.155, maxPodHalfW * 0.86)),
      carbonMat
    );
    inletMouth.position.copy(toThree(1.375, side * (0.29 + maxPodHalfW * 0.44), 0.39));
    inletMouth.rotation.y = side * 0.18;
    engineCoverGroup.add(inletMouth);
  }

  // Per-Team Shark Fin Dorsal Blade with normalized UVs [0..1]
  const finShape = new THREE.Shape();
  if (aero.finProfile === 'tall_notched') {
    finShape.moveTo(0, 0);
    finShape.lineTo(1.32, -0.10);
    finShape.lineTo(1.34, -0.50);
    finShape.lineTo(0, -0.35);
  } else if (aero.finProfile === 'stepped_vane') {
    finShape.moveTo(0, 0);
    finShape.lineTo(0.85, -0.12);
    finShape.lineTo(0.95, -0.22);
    finShape.lineTo(1.36, -0.26);
    finShape.lineTo(1.36, -0.52);
    finShape.lineTo(0, -0.35);
  } else if (aero.finProfile === 'compact_blade') {
    finShape.moveTo(0, 0);
    finShape.lineTo(1.18, -0.24);
    finShape.lineTo(1.18, -0.49);
    finShape.lineTo(0, -0.34);
  } else {
    finShape.moveTo(0, 0);
    finShape.lineTo(1.36, -0.21);
    finShape.lineTo(1.36, -0.52);
    finShape.lineTo(0, -0.35);
  }
  finShape.closePath();

  const finGeo = regGeo(
    normalizePlanarUVs(
      new THREE.ExtrudeGeometry(finShape, {
        depth: 0.014,
        bevelEnabled: false,
      })
    )
  );
  finGeo.translate(0, 0, -0.007);
  const finMesh = new THREE.Mesh(finGeo, finPaintMat);
  finMesh.position.copy(toThree(1.62, 0, 0.935));
  finMesh.castShadow = true;
  engineCoverGroup.add(finMesh);

  root.add(engineCoverGroup);
  registerExplode(engineCoverGroup, 0, 0.54, 0);

  // ---------------------------------------------------------------------------
  // 3. TEAM-PAINTED HALO, DRIVER HELMET (PER-PILOT) & AERO MIRRORS
  // ---------------------------------------------------------------------------
  const haloGroup = new THREE.Group();
  haloGroup.name = 'HaloAndDriver';

  const haloCurve = new THREE.CatmullRomCurve3([
    toThree(1.32, -0.225, 0.56),
    toThree(1.02, -0.245, 0.69),
    toThree(0.70, -0.115, 0.70),
    toThree(0.62, 0.0, 0.695),
    toThree(0.70, 0.115, 0.70),
    toThree(1.02, 0.245, 0.69),
    toThree(1.32, 0.225, 0.56),
  ]);
  const haloTube = new THREE.Mesh(regGeo(new THREE.TubeGeometry(haloCurve, 36, 0.024, 14, false)), haloMat);
  haloTube.castShadow = true;
  haloGroup.add(haloTube);

  const haloFrontPost = new THREE.CatmullRomCurve3([
    toThree(0.56, 0, 0.52),
    toThree(0.61, 0, 0.62),
    toThree(0.64, 0, 0.695),
  ]);
  const haloPostMesh = new THREE.Mesh(
    regGeo(new THREE.TubeGeometry(haloFrontPost, 12, 0.02, 12, false)),
    haloMat
  );
  haloGroup.add(haloPostMesh);

  const helmetMat = regMat(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(activeDriver.helmetPrimaryHex),
      roughness: 0.14,
      metalness: 0.25,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
    })
  );
  const helmet = new THREE.Mesh(regGeo(new THREE.SphereGeometry(0.118, 24, 20)), helmetMat);
  helmet.scale.set(1.15, 0.98, 0.94);
  helmet.position.copy(toThree(1.10, 0, 0.575));
  haloGroup.add(helmet);

  const helmetStripeMat = regMat(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(activeDriver.helmetSecondaryHex),
      roughness: 0.18,
      metalness: 0.3,
      clearcoat: 0.95,
    })
  );
  const helmetSpoiler = new THREE.Mesh(regGeo(new THREE.BoxGeometry(0.085, 0.032, 0.12)), helmetStripeMat);
  helmetSpoiler.position.copy(toThree(1.20, 0, 0.635));
  helmetSpoiler.rotation.z = THREE.MathUtils.degToRad(-14);
  haloGroup.add(helmetSpoiler);

  const visorMat = regMat(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(activeDriver.helmetVisorHex),
      roughness: 0.06,
      metalness: 0.94,
    })
  );
  const visor = new THREE.Mesh(
    regGeo(new THREE.CylinderGeometry(0.121, 0.121, 0.056, 20, 1, true, -Math.PI * 0.34, Math.PI * 0.68)),
    visorMat
  );
  visor.rotation.y = -Math.PI / 2;
  visor.position.copy(toThree(1.09, 0, 0.585));
  haloGroup.add(visor);

  for (const side of [-1, 1] as const) {
    const stalk = new THREE.Mesh(regGeo(new THREE.BoxGeometry(0.035, 0.075, 0.13)), carbonMat);
    stalk.position.copy(toThree(0.92, side * 0.36, 0.565));
    const housing = new THREE.Mesh(regGeo(new THREE.BoxGeometry(0.085, 0.044, 0.14)), cowlMat);
    housing.position.copy(toThree(0.92, side * 0.44, 0.598));
    const mirrorTopVane = new THREE.Mesh(regGeo(new THREE.BoxGeometry(0.055, 0.009, 0.17)), carbonMat);
    mirrorTopVane.position.copy(toThree(0.92, side * 0.44, 0.63));
    haloGroup.add(stalk, housing, mirrorTopVane);
  }

  root.add(haloGroup);
  registerExplode(haloGroup, 0, 0.40, 0);

  // ---------------------------------------------------------------------------
  // 4. 2026 SWEPT ACTIVE-AERO FRONT WING (CLEAN ELEMENT MATERIALS + ENDPLATE UVs)
  // ---------------------------------------------------------------------------
  const frontWingGroup = new THREE.Group();
  frontWingGroup.name = 'FrontWing2026';

  const fwSpan = Math.max(1.70, Math.min(1.90, params.wingSpanM ?? 1.80));

  const fwMainGeo = regGeo(buildSweptWingElement(0.24, 0.18, 0.022, fwSpan, 0.16, 0.025, 0.016));
  const fwMainMesh = new THREE.Mesh(fwMainGeo, carbonMat);
  fwMainMesh.position.copy(toThree(-1.04, 0, 0.115));
  fwMainMesh.rotation.z = THREE.MathUtils.degToRad(4.5);
  fwMainMesh.castShadow = true;
  frontWingGroup.add(fwMainMesh);

  for (let f = 0; f < 3; f += 1) {
    const flapPitchDeg = 7 + fwActiveDeg * (0.44 + f * 0.18);
    const chordCenter = 0.12 - f * 0.014;
    const chordTip = 0.085 - f * 0.011;
    const flapGeo = regGeo(
      buildSweptWingElement(chordCenter, chordTip, 0.013, fwSpan - 0.05, 0.15 - f * 0.015, 0.018, 0.011)
    );
    const flapMat = f === 2 ? frontWingPrimaryMat : f === 1 ? cowlMat : carbonMat;
    const flapMesh = new THREE.Mesh(flapGeo, flapMat);
    flapMesh.position.copy(toThree(-0.90 + f * 0.092, 0, 0.135 + f * 0.025));
    flapMesh.rotation.z = THREE.MathUtils.degToRad(flapPitchDeg);
    flapMesh.castShadow = true;
    frontWingGroup.add(flapMesh);
  }

  const fwEndShape = new THREE.Shape();
  fwEndShape.moveTo(-0.26, 0);
  fwEndShape.lineTo(0.32, 0);
  fwEndShape.lineTo(0.28, 0.25);
  fwEndShape.quadraticCurveTo(0.06, 0.28, -0.18, 0.14);
  fwEndShape.closePath();
  const fwEndGeo = regGeo(
    normalizePlanarUVs(
      new THREE.ExtrudeGeometry(fwEndShape, {
        depth: 0.016,
        bevelEnabled: true,
        bevelThickness: 0.003,
        bevelSize: 0.003,
      })
    )
  );
  fwEndGeo.translate(0, 0, -0.008);

  for (const side of [-1, 1] as const) {
    const endplate = new THREE.Mesh(fwEndGeo, frontWingEndplateMat);
    endplate.position.copy(toThree(-0.74, side * (fwSpan * 0.5), 0.075));
    endplate.rotation.y = side * 0.08;
    endplate.castShadow = true;
    frontWingGroup.add(endplate);

    const footplate = new THREE.Mesh(regGeo(new THREE.BoxGeometry(0.46, 0.012, 0.065)), carbonMat);
    footplate.position.copy(toThree(-0.73, side * (fwSpan * 0.5 + 0.028), 0.082));
    frontWingGroup.add(footplate);

    const diveplane = new THREE.Mesh(regGeo(new THREE.BoxGeometry(0.18, 0.01, 0.048)), accentPaintMat);
    diveplane.position.copy(toThree(-0.72, side * (fwSpan * 0.5 + 0.022), 0.185));
    diveplane.rotation.z = THREE.MathUtils.degToRad(14);
    frontWingGroup.add(diveplane);
  }

  root.add(frontWingGroup);
  registerExplode(frontWingGroup, -0.78, 0.05, 0);

  // ---------------------------------------------------------------------------
  // 5. 2026 VENTURI FLOOR, BARGEBOARDS, DIFFUSER & FIA RAIN LIGHT
  // ---------------------------------------------------------------------------
  const floorGroup = new THREE.Group();
  floorGroup.name = 'VenturiFloorAndDiffuser';

  const floorShape = new THREE.Shape();
  floorShape.moveTo(0.45, 0.18);
  floorShape.lineTo(0.85, 0.78);
  floorShape.lineTo(L - 0.35, 0.78);
  floorShape.lineTo(L + 0.12, 0.52);
  floorShape.lineTo(L + 0.42, 0.50);
  floorShape.lineTo(L + 0.42, -0.50);
  floorShape.lineTo(L + 0.12, -0.52);
  floorShape.lineTo(L - 0.35, -0.78);
  floorShape.lineTo(0.85, -0.78);
  floorShape.lineTo(0.45, -0.18);
  floorShape.closePath();

  const floorGeo = regGeo(new THREE.ExtrudeGeometry(floorShape, { depth: 0.024, bevelEnabled: false }));
  floorGeo.rotateX(Math.PI / 2);
  floorGeo.translate(-xCenter, 0.065 + rakeMidM, 0);
  const floorMesh = new THREE.Mesh(floorGeo, carbonMat);
  floorMesh.receiveShadow = true;
  floorMesh.castShadow = true;
  floorGroup.add(floorMesh);

  for (const side of [-1, 1] as const) {
    const bargeboard = new THREE.Mesh(regGeo(new THREE.BoxGeometry(0.50, 0.24, 0.014)), carbonMat);
    bargeboard.position.copy(toThree(1.05, side * 0.74, 0.185));
    bargeboard.rotation.y = side * -0.14;
    floorGroup.add(bargeboard);

    const edgeStrake = new THREE.Mesh(regGeo(new THREE.BoxGeometry(1.38, 0.024, 0.044)), accentPaintMat);
    edgeStrake.position.copy(toThree(1.85, side * 0.785, 0.082));
    floorGroup.add(edgeStrake);
  }

  const diffAngleRad = THREE.MathUtils.degToRad(params.diffuserAngleDeg);
  const diffRamp = new THREE.Mesh(regGeo(new THREE.BoxGeometry(0.60, 0.022, 0.96)), carbonMat);
  diffRamp.position.copy(toThree(L + 0.26, 0, 0.14));
  diffRamp.rotation.z = diffAngleRad;
  floorGroup.add(diffRamp);

  for (const yStrake of [-0.34, -0.14, 0.14, 0.34]) {
    const strake = new THREE.Mesh(regGeo(new THREE.BoxGeometry(0.48, 0.14, 0.012)), carbonMat);
    strake.position.copy(toThree(L + 0.28, yStrake, 0.12));
    floorGroup.add(strake);
  }

  const crashBox = new THREE.Mesh(regGeo(new THREE.BoxGeometry(0.42, 0.14, 0.12)), carbonMat);
  crashBox.position.copy(toThree(L + 0.32, 0, 0.28));
  const rainLightMat = regMat(
    new THREE.MeshStandardMaterial({
      color: 0xff1e1e,
      emissive: 0xff0000,
      emissiveIntensity: 1.65,
      roughness: 0.2,
    })
  );
  const rainLight = new THREE.Mesh(regGeo(new THREE.BoxGeometry(0.024, 0.092, 0.04)), rainLightMat);
  rainLight.position.copy(toThree(L + 0.535, 0, 0.28));
  floorGroup.add(crashBox, rainLight);

  root.add(floorGroup);
  registerExplode(floorGroup, 0, -0.26, 0);

  // ---------------------------------------------------------------------------
  // 6. 2026 ACTIVE-AERO REAR WING (DEDICATED FLAP TEXTURE + CLEAN ENDPLATE UVs)
  // ---------------------------------------------------------------------------
  const rearWingGroup = new THREE.Group();
  rearWingGroup.name = 'RearWing2026';

  for (const side of [-1, 1] as const) {
    const pylon = new THREE.Mesh(regGeo(new THREE.BoxGeometry(0.22, 0.46, 0.016)), carbonMat);
    pylon.position.copy(toThree(L + 0.26, side * 0.065, 0.62));
    pylon.rotation.z = -0.12;
    rearWingGroup.add(pylon);
  }

  const beamWing = new THREE.Mesh(regGeo(buildWingElement(0.18, 0.018, 0.88, 0.015)), carbonMat);
  beamWing.position.copy(toThree(L + 0.38, 0, 0.42));
  beamWing.rotation.z = THREE.MathUtils.degToRad(16);
  rearWingGroup.add(beamWing);

  const rwSpan = 1.02;
  const rwMain = new THREE.Mesh(regGeo(buildSweptWingElement(0.25, 0.22, 0.026, rwSpan, 0.03, 0.02, 0.024)), carbonMat);
  rwMain.position.copy(toThree(L + 0.34, 0, 0.835));
  rwMain.rotation.z = THREE.MathUtils.degToRad(14);
  rwMain.castShadow = true;
  rearWingGroup.add(rwMain);

  const rwFlap = new THREE.Mesh(
    regGeo(buildSweptWingElement(0.17, 0.15, 0.018, rwSpan - 0.04, 0.02, 0.012, 0.015)),
    rearWingFlapMat
  );
  rwFlap.position.copy(toThree(L + 0.49, 0, 0.895));
  rwFlap.rotation.z = THREE.MathUtils.degToRad(8 + rwActiveDeg * 0.95);
  rwFlap.castShadow = true;
  rearWingGroup.add(rwFlap);

  const rwEndShape = new THREE.Shape();
  rwEndShape.moveTo(-0.22, -0.34);
  rwEndShape.lineTo(0.16, -0.34);
  rwEndShape.quadraticCurveTo(0.24, 0.05, 0.20, 0.22);
  rwEndShape.lineTo(-0.18, 0.14);
  rwEndShape.quadraticCurveTo(-0.26, -0.05, -0.22, -0.34);
  const rwEndGeo = regGeo(
    normalizePlanarUVs(
      new THREE.ExtrudeGeometry(rwEndShape, {
        depth: 0.016,
        bevelEnabled: true,
        bevelThickness: 0.003,
        bevelSize: 0.003,
      })
    )
  );
  rwEndGeo.translate(0, 0, -0.008);

  for (const side of [-1, 1] as const) {
    const rwEnd = new THREE.Mesh(rwEndGeo, frontWingEndplateMat);
    rwEnd.position.copy(toThree(L + 0.38, side * (rwSpan * 0.5), 0.78));
    rwEnd.castShadow = true;
    rearWingGroup.add(rwEnd);
  }

  root.add(rearWingGroup);
  registerExplode(rearWingGroup, 0.68, 0.16, 0);

  // ---------------------------------------------------------------------------
  // 7. DOUBLE-WISHBONE SUSPENSION (TEAM WISHBONE FINISH) & WHEEL WAKE DEFLECTORS
  // ---------------------------------------------------------------------------
  const suspGroup = new THREE.Group();
  suspGroup.name = 'SuspensionAndBrakes';

  const addWishboneLink = (pA: THREE.Vector3, pB: THREE.Vector3, radius: number, mat: THREE.Material) => {
    const curve = new THREE.LineCurve3(pA, pB);
    const link = new THREE.Mesh(regGeo(new THREE.TubeGeometry(curve, 1, radius, 8, false)), mat);
    link.scale.set(1.4, 0.55, 1.0);
    suspGroup.add(link);
  };

  const fHalfT = params.frontTrackM * 0.5;
  const rHalfT = params.rearTrackM * 0.5;

  for (const side of [-1, 1] as const) {
    const fUprightTop = toThree(0, side * (fHalfT - 0.11), 0.44);
    const fUprightBot = toThree(0, side * (fHalfT - 0.11), 0.24);
    addWishboneLink(toThree(-0.14, side * 0.18, 0.42), fUprightTop, 0.013, wishboneMat);
    addWishboneLink(toThree(0.22, side * 0.21, 0.41), fUprightTop, 0.013, wishboneMat);
    addWishboneLink(toThree(-0.12, side * 0.16, 0.18), fUprightBot, 0.014, wishboneMat);
    addWishboneLink(toThree(0.24, side * 0.19, 0.18), fUprightBot, 0.014, wishboneMat);

    if (params.suspensionFront === 'pushrod') {
      addWishboneLink(toThree(0.05, side * 0.19, 0.46), fUprightBot, 0.011, titaniumMat);
    } else {
      addWishboneLink(toThree(0.05, side * 0.18, 0.17), fUprightTop, 0.011, titaniumMat);
    }

    const wakeCurve = new THREE.CatmullRomCurve3([
      toThree(-0.22, side * (fHalfT - 0.18), 0.56),
      toThree(-0.02, side * (fHalfT - 0.15), 0.72),
      toThree(0.22, side * (fHalfT - 0.16), 0.68),
    ]);
    const wakeMesh = new THREE.Mesh(
      regGeo(new THREE.TubeGeometry(wakeCurve, 16, 0.014, 8, false)),
      carbonMat
    );
    wakeMesh.scale.set(1.0, 0.5, 2.2);
    suspGroup.add(wakeMesh);

    const rUprightTop = toThree(L, side * (rHalfT - 0.12), 0.44);
    const rUprightBot = toThree(L, side * (rHalfT - 0.12), 0.23);
    addWishboneLink(toThree(L - 0.28, side * 0.14, 0.43), rUprightTop, 0.014, wishboneMat);
    addWishboneLink(toThree(L + 0.14, side * 0.10, 0.42), rUprightTop, 0.014, wishboneMat);
    addWishboneLink(toThree(L - 0.26, side * 0.15, 0.19), rUprightBot, 0.015, wishboneMat);
    addWishboneLink(toThree(L + 0.15, side * 0.11, 0.19), rUprightBot, 0.015, wishboneMat);

    if (params.suspensionRear === 'pushrod') {
      addWishboneLink(toThree(L - 0.05, side * 0.13, 0.47), rUprightBot, 0.011, titaniumMat);
    } else {
      addWishboneLink(toThree(L - 0.05, side * 0.13, 0.18), rUprightTop, 0.011, titaniumMat);
    }
  }

  root.add(suspGroup);

  // ---------------------------------------------------------------------------
  // 8. 18-INCH WHEELS, PIRELLI TIRES, CUSTOM AERO SPOKE COVERS & CALIPERS
  // ---------------------------------------------------------------------------
  const createTireGeometry = (radiusM: number, widthM: number) => {
    const hw = widthM * 0.5;
    const pts: THREE.Vector2[] = [
      new THREE.Vector2(0.225, -hw),
      new THREE.Vector2(radiusM - 0.028, -hw),
      new THREE.Vector2(radiusM, -hw * 0.72),
      new THREE.Vector2(radiusM, hw * 0.72),
      new THREE.Vector2(radiusM - 0.028, hw),
      new THREE.Vector2(0.225, hw),
    ];
    const geo = regGeo(new THREE.LatheGeometry(pts, 40));
    geo.rotateX(Math.PI / 2);
    return geo;
  };

  const frontTireGeo = createTireGeometry(0.36, 0.305);
  const rearTireGeo = createTireGeometry(0.36, 0.385);
  const wheelCoverGeo = regGeo(new THREE.CircleGeometry(0.232, 36));
  const rimAccentRingGeo = regGeo(new THREE.RingGeometry(0.214, 0.232, 36));
  const brakeDiscGeo = regGeo(new THREE.CylinderGeometry(0.165, 0.165, 0.032, 24));
  brakeDiscGeo.rotateX(Math.PI / 2);
  const caliperGeo = regGeo(new THREE.BoxGeometry(0.08, 0.14, 0.055));
  const spokeBladeGeo = regGeo(new THREE.BoxGeometry(0.022, 0.16, 0.014));

  const brakeDiscMat = regMat(
    new THREE.MeshStandardMaterial({
      map: textures.brakeDisc,
      roughness: 0.42,
      metalness: 0.58,
    })
  );
  const rimRingMat = regMat(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(livery.rimAccentHex),
      roughness: 0.24,
      metalness: 0.75,
      side: THREE.DoubleSide,
    })
  );
  const caliperMat = regMat(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(aero.caliperHex || '#dc2626'),
      roughness: 0.28,
      metalness: 0.65,
    })
  );
  const spokeAlloyMat = regMat(
    new THREE.MeshStandardMaterial({
      color: 0x262a34,
      roughness: 0.32,
      metalness: 0.72,
    })
  );

  const wheelDefs = [
    { name: 'WheelFL', xM: 0, yM: -fHalfT, isRear: false, side: -1 },
    { name: 'WheelFR', xM: 0, yM: fHalfT, isRear: false, side: 1 },
    { name: 'WheelRL', xM: L, yM: -rHalfT, isRear: true, side: -1 },
    { name: 'WheelRR', xM: L, yM: rHalfT, isRear: true, side: 1 },
  ];

  const spokeCount =
    aero.wheelCoverStyle === 'spoke_5_open'
      ? 5
      : aero.wheelCoverStyle === 'turbine_10'
      ? 10
      : 0;

  for (const w of wheelDefs) {
    const wGroup = new THREE.Group();
    wGroup.name = w.name;
    wGroup.position.copy(toThree(w.xM, w.yM, 0.36));

    const widthM = w.isRear ? 0.385 : 0.305;
    const tireMesh = new THREE.Mesh(w.isRear ? rearTireGeo : frontTireGeo, tireTreadMat);
    tireMesh.castShadow = true;
    tireMesh.receiveShadow = true;
    wGroup.add(tireMesh);

    const outerCover = new THREE.Mesh(wheelCoverGeo, tireSideMat);
    outerCover.position.z = w.side * (widthM * 0.5 + 0.002);
    if (w.side < 0) outerCover.rotation.y = Math.PI;
    wGroup.add(outerCover);

    const outerAccentRing = new THREE.Mesh(rimAccentRingGeo, rimRingMat);
    outerAccentRing.position.z = w.side * (widthM * 0.5 + 0.004);
    if (w.side < 0) outerAccentRing.rotation.y = Math.PI;
    wGroup.add(outerAccentRing);

    if (spokeCount > 0) {
      for (let sp = 0; sp < spokeCount; sp += 1) {
        const ang = (sp / spokeCount) * Math.PI * 2;
        const spoke = new THREE.Mesh(spokeBladeGeo, spokeAlloyMat);
        const rMid = 0.125;
        spoke.position.set(
          Math.cos(ang) * rMid,
          Math.sin(ang) * rMid,
          w.side * (widthM * 0.5 + 0.005)
        );
        spoke.rotation.z = ang - Math.PI / 2;
        wGroup.add(spoke);
      }
    }

    const nutMesh = new THREE.Mesh(regGeo(new THREE.CylinderGeometry(0.032, 0.038, 0.026, 16)), rimRingMat);
    nutMesh.rotation.x = Math.PI / 2;
    nutMesh.position.z = w.side * (widthM * 0.5 + 0.008);
    wGroup.add(nutMesh);

    const rotor = new THREE.Mesh(brakeDiscGeo, brakeDiscMat);
    rotor.position.z = -w.side * (widthM * 0.34);
    const caliper = new THREE.Mesh(caliperGeo, caliperMat);
    caliper.position.set(-0.10, 0.04, -w.side * (widthM * 0.34));
    wGroup.add(rotor, caliper);

    const scoop = new THREE.Mesh(regGeo(new THREE.BoxGeometry(0.18, 0.24, 0.06)), carbonMat);
    scoop.position.set(0.02, 0.01, -w.side * (widthM * 0.5 + 0.02));
    wGroup.add(scoop);

    root.add(wGroup);
    registerExplode(wGroup, w.isRear ? 0.24 : -0.24, 0, w.side * 0.44);
  }

  monocoqueGroup.rotation.z = -chassisPitchRad;
  engineCoverGroup.rotation.z = -chassisPitchRad;
  haloGroup.rotation.z = -chassisPitchRad;

  const setVisualMode = (mode: CarVisualMode) => {
    const isXray = mode === 'xray_cad';
    plinthGroup.visible = !isXray;
    for (const mat of bodyPaintMaterials) {
      mat.transparent = isXray;
      mat.opacity = isXray ? 0.22 : 1.0;
      mat.depthWrite = !isXray;
      mat.needsUpdate = true;
    }
    for (const mat of carbonMaterials) {
      mat.transparent = isXray;
      mat.opacity = isXray ? 0.28 : 1.0;
      mat.depthWrite = !isXray;
      mat.needsUpdate = true;
    }
    tireTreadMat.transparent = isXray;
    tireTreadMat.opacity = isXray ? 0.45 : 1.0;
    tireSideMat.transparent = isXray;
    tireSideMat.opacity = isXray ? 0.45 : 1.0;
  };

  const applyExplodeFactor = (factor01: number) => {
    const f = THREE.MathUtils.clamp(factor01, 0, 1);
    for (const part of explodeParts) {
      part.group.position.copy(part.basePos).addScaledVector(part.offset, f);
    }
  };

  return {
    root,
    bodyPaintMaterials,
    carbonMaterials,
    explodeParts,
    setVisualMode,
    applyExplodeFactor,
    dispose: () => {
      for (const d of disposables) d.dispose();
    },
  };
}
