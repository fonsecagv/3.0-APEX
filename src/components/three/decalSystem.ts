import * as THREE from 'three';

export type DecalSurfaceZone =
  | 'nose'
  | 'front_wing'
  | 'sidepod_left'
  | 'sidepod_right'
  | 'engine_cover'
  | 'rear_wing';

export interface DecalItem {
  id: string;
  name: string;
  text?: string;
  textColor?: string;
  bgColor?: string;
  zone: DecalSurfaceZone;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number];
  opacity?: number;
}

export interface LiveryCustomizationSpec {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  finishType: 'gloss' | 'matte' | 'metallic' | 'satin' | 'pearl';
  driverNumber: number;
  driverCode: string;
  decals: DecalItem[];
}

/**
 * Creates a dynamic CanvasTexture for text-based sponsors and numbers.
 */
export function createDecalTexture(options: {
  text: string;
  fontFamily?: string;
  color?: string;
  bgColor?: string;
  width?: number;
  height?: number;
}): THREE.CanvasTexture {
  const {
    text,
    fontFamily = 'Montserrat, Arial, sans-serif',
    color = '#FFFFFF',
    bgColor = 'transparent',
    width = 512,
    height = 256,
  } = options;

  if (typeof document === 'undefined') {
    const dummy = { width: 2, height: 2, getContext: () => null } as unknown as HTMLCanvasElement;
    return new THREE.CanvasTexture(dummy);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  if (bgColor !== 'transparent') {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.fillStyle = color;
  ctx.font = `900 ${Math.round(height * 0.55)}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '2px';
  ctx.fillText(text.toUpperCase(), width / 2, height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates a decal mesh positioned on a car surface zone with Z-fighting prevention.
 */
export function createDecalMesh(decal: DecalItem): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(decal.scale[0], decal.scale[1]);

  const texture = createDecalTexture({
    text: decal.text || decal.name,
    color: decal.textColor || '#FFFFFF',
    bgColor: decal.bgColor || 'transparent',
  });

  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: decal.opacity ?? 1.0,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = `Decal_${decal.zone}_${decal.id}`;
  mesh.position.set(...decal.position);
  mesh.rotation.set(...decal.rotation);
  return mesh;
}

/**
 * Builds standard 2026 decal layouts for a team.
 */
export function createStandardDecalLayout(params: {
  driverNumber: number;
  driverCode: string;
  sponsorName?: string;
  engineSupplier?: string;
}): DecalItem[] {
  const { driverNumber, driverCode, sponsorName = 'APEX RACING', engineSupplier = 'HYBRID 2026' } = params;

  return [
    // Nose driver number
    {
      id: 'num_nose',
      name: `#${driverNumber}`,
      text: `${driverNumber}`,
      zone: 'nose',
      position: [-1.82, 0.42, 0],
      rotation: [-Math.PI / 4, 0, 0],
      scale: [0.38, 0.38],
    },
    // Left sidepod primary sponsor
    {
      id: 'sponsor_left',
      name: sponsorName,
      text: sponsorName,
      zone: 'sidepod_left',
      position: [0.45, 0.48, 0.62],
      rotation: [0, -Math.PI / 2, 0],
      scale: [0.95, 0.28],
    },
    // Right sidepod primary sponsor
    {
      id: 'sponsor_right',
      name: sponsorName,
      text: sponsorName,
      zone: 'sidepod_right',
      position: [0.45, 0.48, -0.62],
      rotation: [0, Math.PI / 2, 0],
      scale: [0.95, 0.28],
    },
    // Engine cover badge
    {
      id: 'engine_badge',
      name: engineSupplier,
      text: engineSupplier,
      zone: 'engine_cover',
      position: [1.85, 0.72, 0.05],
      rotation: [0, -Math.PI / 2, 0],
      scale: [0.72, 0.18],
    },
  ];
}
