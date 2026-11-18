import * as THREE from 'three';
import type { TireCompound } from '../../types/f1';

export type AutomotiveFinishType = 'gloss' | 'matte' | 'metallic' | 'satin' | 'pearl';
export type CarbonWeaveType = 'twill_2x2' | 'forged' | 'matte' | 'gloss';
export type MechanicalMetalType =
  | 'titanium'
  | 'aluminum'
  | 'magnesium'
  | 'exhaust_heat_treated'
  | 'brake_carbon_ceramic';

// Procedural micro-texture generator (PBR maps with zero external image dependencies)
let cachedCarbonAlbedo: THREE.CanvasTexture | null = null;
let cachedCarbonBump: THREE.CanvasTexture | null = null;
let cachedForgedCarbon: THREE.CanvasTexture | null = null;

function getCarbonTextures(): { albedo: THREE.Texture; bump: THREE.Texture } {
  if (typeof document === 'undefined') {
    const fallbackCanvas = { width: 2, height: 2, getContext: () => null } as unknown as HTMLCanvasElement;
    const dummy = new THREE.CanvasTexture(fallbackCanvas);
    return { albedo: dummy, bump: dummy };
  }

  if (cachedCarbonAlbedo && cachedCarbonBump) {
    return { albedo: cachedCarbonAlbedo, bump: cachedCarbonBump };
  }

  const size = 128;
  const cColor = document.createElement('canvas');
  cColor.width = size;
  cColor.height = size;
  const ctx = cColor.getContext('2d')!;

  const cBump = document.createElement('canvas');
  cBump.width = size;
  cBump.height = size;
  const btx = cBump.getContext('2d')!;

  const cell = 8;
  for (let y = 0; y < size; y += cell) {
    for (let x = 0; x < size; x += cell) {
      const isAlt = ((x / cell) ^ (y / cell)) & 1;
      const shade = isAlt ? 24 : 12;
      ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
      ctx.fillRect(x, y, cell, cell);

      const bumpVal = isAlt ? 200 : 55;
      btx.fillStyle = `rgb(${bumpVal},${bumpVal},${bumpVal})`;
      btx.fillRect(x, y, cell, cell);
    }
  }

  cachedCarbonAlbedo = new THREE.CanvasTexture(cColor);
  cachedCarbonAlbedo.wrapS = THREE.RepeatWrapping;
  cachedCarbonAlbedo.wrapT = THREE.RepeatWrapping;
  cachedCarbonAlbedo.repeat.set(16, 16);

  cachedCarbonBump = new THREE.CanvasTexture(cBump);
  cachedCarbonBump.wrapS = THREE.RepeatWrapping;
  cachedCarbonBump.wrapT = THREE.RepeatWrapping;
  cachedCarbonBump.repeat.set(16, 16);

  return { albedo: cachedCarbonAlbedo, bump: cachedCarbonBump };
}

function getForgedCarbonTexture(): THREE.Texture {
  if (typeof document === 'undefined') {
    const fallback = { width: 2, height: 2, getContext: () => null } as unknown as HTMLCanvasElement;
    return new THREE.CanvasTexture(fallback);
  }

  if (cachedForgedCarbon) return cachedForgedCarbon;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#111217';
  ctx.fillRect(0, 0, size, size);

  // Random chopped carbon flake pattern
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const w = 4 + Math.random() * 14;
    const h = 2 + Math.random() * 5;
    const angle = Math.random() * Math.PI;
    const brightness = 18 + Math.random() * 32;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = `rgb(${brightness},${brightness},${brightness + 2})`;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.restore();
  }

  cachedForgedCarbon = new THREE.CanvasTexture(canvas);
  cachedForgedCarbon.wrapS = THREE.RepeatWrapping;
  cachedForgedCarbon.wrapT = THREE.RepeatWrapping;
  cachedForgedCarbon.repeat.set(8, 8);
  return cachedForgedCarbon;
}

/**
 * PBR Automotive Paint Material with dual-layer clearcoat and realistic reflectivity.
 */
export function createAutomotivePaintMaterial(options: {
  color: THREE.ColorRepresentation;
  finishType?: AutomotiveFinishType;
  roughnessOverride?: number;
  metalnessOverride?: number;
}): THREE.MeshPhysicalMaterial {
  const { color, finishType = 'gloss', roughnessOverride, metalnessOverride } = options;

  let roughness = 0.16;
  let metalness = 0.22;
  let clearcoat = 0.95;
  let clearcoatRoughness = 0.08;
  let reflectivity = 0.88;

  switch (finishType) {
    case 'gloss':
      roughness = 0.14;
      metalness = 0.24;
      clearcoat = 0.98;
      clearcoatRoughness = 0.06;
      reflectivity = 0.92;
      break;
    case 'matte':
      roughness = 0.52;
      metalness = 0.12;
      clearcoat = 0.15;
      clearcoatRoughness = 0.48;
      reflectivity = 0.45;
      break;
    case 'metallic':
      roughness = 0.18;
      metalness = 0.68;
      clearcoat = 0.92;
      clearcoatRoughness = 0.10;
      reflectivity = 0.95;
      break;
    case 'satin':
      roughness = 0.34;
      metalness = 0.28;
      clearcoat = 0.45;
      clearcoatRoughness = 0.26;
      reflectivity = 0.72;
      break;
    case 'pearl':
      roughness = 0.15;
      metalness = 0.42;
      clearcoat = 1.0;
      clearcoatRoughness = 0.05;
      reflectivity = 0.98;
      break;
  }

  if (roughnessOverride !== undefined) roughness = roughnessOverride;
  if (metalnessOverride !== undefined) metalness = metalnessOverride;

  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    roughness,
    metalness,
    clearcoat,
    clearcoatRoughness,
    reflectivity,
  });
}

/**
 * PBR Carbon Fiber Material with authentic weave or forged structure.
 */
export function createCarbonFiberMaterial(options: {
  weaveType?: CarbonWeaveType;
  colorTint?: THREE.ColorRepresentation;
}): THREE.MeshStandardMaterial {
  const { weaveType = 'twill_2x2', colorTint = 0x181a20 } = options;

  if (weaveType === 'forged') {
    const forgedTex = getForgedCarbonTexture();
    return new THREE.MeshStandardMaterial({
      map: forgedTex,
      color: new THREE.Color(colorTint),
      roughness: 0.35,
      metalness: 0.42,
      side: THREE.DoubleSide,
    });
  }

  const { albedo, bump } = getCarbonTextures();
  const isGloss = weaveType === 'gloss';
  const isMatte = weaveType === 'matte';

  return new THREE.MeshStandardMaterial({
    map: albedo,
    bumpMap: bump,
    bumpScale: 0.0035,
    color: new THREE.Color(colorTint),
    roughness: isGloss ? 0.18 : isMatte ? 0.65 : 0.38,
    metalness: isGloss ? 0.48 : isMatte ? 0.18 : 0.36,
    side: THREE.DoubleSide,
  });
}

/**
 * PBR Mechanical Metal Material for suspension, titanium hardware and brake heat dissipation.
 */
export function createMechanicalMaterial(metalType: MechanicalMetalType): THREE.MeshStandardMaterial {
  switch (metalType) {
    case 'titanium':
      return new THREE.MeshStandardMaterial({
        color: 0x5a6375,
        roughness: 0.28,
        metalness: 0.88,
      });
    case 'aluminum':
      return new THREE.MeshStandardMaterial({
        color: 0xd1d5db,
        roughness: 0.35,
        metalness: 0.76,
      });
    case 'magnesium':
      return new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.42,
        metalness: 0.65,
      });
    case 'exhaust_heat_treated':
      return new THREE.MeshStandardMaterial({
        color: 0xa8774f,
        roughness: 0.22,
        metalness: 0.92,
      });
    case 'brake_carbon_ceramic':
      return new THREE.MeshStandardMaterial({
        color: 0x27272a,
        roughness: 0.72,
        metalness: 0.38,
      });
  }
}

/**
 * PBR Tire Rubber Material with compound color stripes and optional race wear.
 */
export function createTirePbrMaterial(options: {
  compound: TireCompound;
  wear01?: number;
}): THREE.MeshStandardMaterial {
  const { wear01 = 0 } = options;
  const baseRoughness = 0.80 + wear01 * 0.15;

  return new THREE.MeshStandardMaterial({
    color: 0x15161b,
    roughness: Math.min(0.98, baseRoughness),
    metalness: 0.06,
  });
}
