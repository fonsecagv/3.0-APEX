import * as THREE from 'three';
import type { DriverShowroomProfile, Livery2026Spec } from '../../data/f12026Liveries';
import type { TireCompound } from '../../types/f1';

export interface F1TextureBundle {
  carbonAlbedo: THREE.CanvasTexture;
  carbonBump: THREE.CanvasTexture;
  liveryBody: THREE.CanvasTexture;
  liveryNose: THREE.CanvasTexture;
  liveryFin: THREE.CanvasTexture;
  tireSidewall: THREE.CanvasTexture;
  tireTreadBump: THREE.CanvasTexture;
  brakeDisc: THREE.CanvasTexture;
  floorShadow: THREE.CanvasTexture;
  dispose: () => void;
}

const TIRE_COMPOUND_HEX: Record<TireCompound, { hex: string; label: string }> = {
  soft: { hex: '#EF4444', label: 'P ZERO' },
  medium: { hex: '#FACC15', label: 'P ZERO' },
  hard: { hex: '#F1F5F9', label: 'P ZERO' },
  inter: { hex: '#22C55E', label: 'CINTURATO' },
  wet: { hex: '#3B82F6', label: 'CINTURATO' },
};

function finalizeTexture(
  canvas: HTMLCanvasElement,
  isColor: boolean,
  maxAnisotropy: number,
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.anisotropy = Math.max(1, Math.min(8, maxAnisotropy));
  tex.wrapS = repeatX > 1 ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  tex.wrapT = repeatY > 1 ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.needsUpdate = true;
  return tex;
}

function createCarbonPair(maxAnisotropy: number): {
  albedo: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
} {
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
      const idx = ((x / cell) + (y / cell)) % 4;
      const isWarp = idx < 2;
      ctx.fillStyle = isWarp ? '#181b22' : '#242832';
      ctx.fillRect(x, y, cell, cell);
      ctx.fillStyle = isWarp ? '#21252e' : '#14171d';
      ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);

      btx.fillStyle = isWarp ? '#b8b8b8' : '#5e5e5e';
      btx.fillRect(x, y, cell, cell);
    }
  }

  return {
    albedo: finalizeTexture(cColor, true, maxAnisotropy, 12, 12),
    bump: finalizeTexture(cBump, false, maxAnisotropy, 12, 12),
  };
}

function isLightPrimarySpec(spec: Livery2026Spec): boolean {
  return spec.patternStyle === 'vcarb_white_bull' || spec.patternStyle === 'haas_white_red';
}

function drawBodyLouvresAndSeams(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  isLight: boolean
) {
  // Subtle bodywork panel seam lines
  ctx.save();
  ctx.strokeStyle = isLight ? 'rgba(15, 23, 42, 0.22)' : 'rgba(0, 0, 0, 0.42)';
  ctx.lineWidth = 2;
  for (const xFrac of [0.22, 0.37, 0.62, 0.81]) {
    ctx.beginPath();
    ctx.moveTo(w * xFrac, h * 0.04);
    ctx.lineTo(w * xFrac, h * 0.72);
    ctx.stroke();
  }

  // Sculpted cooling gill louvres along upper engine cover / sidepod shoulder
  const gillStart = w * 0.48;
  const gillY = h * 0.23;
  for (let i = 0; i < 8; i += 1) {
    const gx = gillStart + i * 18;
    ctx.fillStyle = 'rgba(10, 12, 16, 0.82)';
    ctx.beginPath();
    ctx.moveTo(gx, gillY);
    ctx.lineTo(gx + 10, gillY);
    ctx.lineTo(gx + 4, gillY + 34);
    ctx.lineTo(gx - 6, gillY + 34);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function createLiveryBodyTexture(spec: Livery2026Spec, maxAnisotropy: number): THREE.CanvasTexture {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = spec.primaryHex;
  ctx.fillRect(0, 0, w, h);

  // Exposed lower carbon sidepod undercut band
  const carbonGrad = ctx.createLinearGradient(0, h * 0.68, 0, h);
  carbonGrad.addColorStop(0, 'rgba(16, 18, 24, 0.0)');
  carbonGrad.addColorStop(0.32, 'rgba(16, 18, 24, 0.88)');
  carbonGrad.addColorStop(1, '#101218');
  ctx.fillStyle = carbonGrad;
  ctx.fillRect(0, h * 0.66, w, h * 0.34);

  switch (spec.patternStyle) {
    case 'ferrari_clean': {
      // Maranello SF-26 white engine-cover cowling & nose trim + racing yellow stripe
      ctx.fillStyle = spec.secondaryHex;
      ctx.beginPath();
      ctx.moveTo(w * 0.25, h * 0.10);
      ctx.lineTo(w * 0.84, h * 0.06);
      ctx.lineTo(w * 0.92, h * 0.36);
      ctx.lineTo(w * 0.33, h * 0.31);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = spec.accentHex;
      ctx.fillRect(w * 0.12, h * 0.46, w * 0.76, 6);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(w * 0.12, h * 0.48, w * 0.76, 3);
      break;
    }
    case 'audi_titan': {
      ctx.fillStyle = spec.secondaryHex;
      ctx.beginPath();
      ctx.moveTo(w * 0.48, 0);
      ctx.lineTo(w, 0);
      ctx.lineTo(w, h);
      ctx.lineTo(w * 0.34, h);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = spec.accentHex;
      ctx.lineWidth = 20;
      ctx.beginPath();
      ctx.moveTo(w * 0.47, 0);
      ctx.lineTo(w * 0.33, h);
      ctx.stroke();

      ctx.fillStyle = spec.accentHex;
      ctx.fillRect(w * 0.56, h * 0.24, w * 0.34, 12);
      break;
    }
    case 'redbull_matte': {
      ctx.fillStyle = spec.accentHex;
      ctx.fillRect(0, h * 0.2, w * 0.16, h * 0.6);

      ctx.fillStyle = spec.secondaryHex;
      ctx.beginPath();
      ctx.moveTo(w * 0.36, h * 0.22);
      ctx.lineTo(w * 0.78, h * 0.14);
      ctx.lineTo(w * 0.67, h * 0.62);
      ctx.lineTo(w * 0.30, h * 0.52);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = spec.accentHex;
      ctx.beginPath();
      ctx.arc(w * 0.58, h * 0.35, 38, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'mercedes_silver_black': {
      const silGrad = ctx.createLinearGradient(0, 0, w * 0.5, 0);
      silGrad.addColorStop(0, spec.secondaryHex);
      silGrad.addColorStop(0.74, spec.secondaryHex);
      silGrad.addColorStop(1, 'rgba(200,205,214,0)');
      ctx.fillStyle = silGrad;
      ctx.fillRect(0, 0, w * 0.5, h * 0.72);

      ctx.strokeStyle = spec.accentHex;
      ctx.lineWidth = 11;
      ctx.beginPath();
      ctx.moveTo(w * 0.08, h * 0.56);
      ctx.bezierCurveTo(w * 0.35, h * 0.48, w * 0.62, h * 0.26, w * 0.94, h * 0.22);
      ctx.stroke();
      break;
    }
    case 'mclaren_papaya': {
      ctx.fillStyle = spec.secondaryHex;
      ctx.beginPath();
      ctx.moveTo(w * 0.50, 0);
      ctx.lineTo(w, 0);
      ctx.lineTo(w, h);
      ctx.lineTo(w * 0.66, h);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = spec.accentHex;
      ctx.fillRect(w * 0.20, h * 0.54, w * 0.34, 8);
      break;
    }
    case 'aston_racing_green': {
      ctx.fillStyle = spec.accentHex;
      ctx.fillRect(w * 0.12, h * 0.51, w * 0.78, 8);
      ctx.fillStyle = '#CEDC00';
      ctx.fillRect(w * 0.12, h * 0.54, w * 0.78, 5);
      break;
    }
    case 'alpine_bwt': {
      ctx.fillStyle = spec.secondaryHex;
      ctx.beginPath();
      ctx.moveTo(w * 0.25, h * 0.35);
      ctx.lineTo(w * 0.75, h * 0.22);
      ctx.lineTo(w * 0.85, h * 0.58);
      ctx.lineTo(w * 0.30, h * 0.65);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'williams_royal': {
      ctx.fillStyle = spec.secondaryHex;
      ctx.fillRect(w * 0.36, h * 0.12, w * 0.48, 22);
      ctx.fillStyle = spec.accentHex;
      ctx.fillRect(w * 0.08, h * 0.50, w * 0.84, 9);
      break;
    }
    case 'vcarb_white_bull': {
      ctx.fillStyle = spec.secondaryHex;
      ctx.beginPath();
      ctx.moveTo(w * 0.35, h * 0.25);
      ctx.lineTo(w * 0.86, h * 0.14);
      ctx.lineTo(w * 0.80, h * 0.54);
      ctx.lineTo(w * 0.32, h * 0.48);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = spec.accentHex;
      ctx.fillRect(0, h * 0.44, w * 0.42, 14);
      break;
    }
    case 'haas_white_red': {
      ctx.fillStyle = spec.secondaryHex;
      ctx.fillRect(w * 0.30, h * 0.24, w * 0.52, h * 0.24);
      ctx.fillStyle = spec.accentHex;
      ctx.fillRect(w * 0.06, h * 0.55, w * 0.88, 12);
      break;
    }
    case 'cadillac_stealth': {
      ctx.fillStyle = spec.secondaryHex;
      ctx.beginPath();
      ctx.moveTo(w * 0.28, h * 0.48);
      ctx.lineTo(w * 0.78, h * 0.20);
      ctx.lineTo(w * 0.84, h * 0.30);
      ctx.lineTo(w * 0.34, h * 0.58);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = spec.accentHex;
      ctx.fillRect(w * 0.14, h * 0.60, w * 0.72, 6);
      break;
    }
    default: {
      ctx.fillStyle = spec.secondaryHex;
      ctx.beginPath();
      ctx.moveTo(w * 0.25, h * 0.38);
      ctx.lineTo(w * 0.82, h * 0.18);
      ctx.lineTo(w * 0.88, h * 0.36);
      ctx.lineTo(w * 0.28, h * 0.54);
      ctx.closePath();
      ctx.fill();
      break;
    }
  }

  const isLight = isLightPrimarySpec(spec);
  drawBodyLouvresAndSeams(ctx, w, h, isLight);

  // Sidepod monogram & 2026 chassis tag
  ctx.save();
  ctx.font = '900 42px "Arial Black", sans-serif';
  ctx.fillStyle = isLight ? '#14161d' : 'rgba(255,255,255,0.95)';
  ctx.fillText(spec.shortName, w * 0.38, h * 0.43);
  ctx.font = '700 20px monospace';
  ctx.fillStyle = isLight ? '#E10600' : spec.accentHex;
  ctx.fillText(`${spec.carModelName.toUpperCase()} · 2026`, w * 0.38, h * 0.49);
  ctx.restore();

  return finalizeTexture(canvas, true, maxAnisotropy, 1, 1);
}

function createNoseTexture(
  spec: Livery2026Spec,
  driver: DriverShowroomProfile,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const w = 512;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = spec.primaryHex;
  ctx.fillRect(0, 0, w, h);

  // Pattern accent on top nose surface (vertical: top = tip, bottom = cockpit)
  if (spec.patternStyle === 'ferrari_clean') {
    ctx.fillStyle = spec.secondaryHex;
    ctx.fillRect(w * 0.34, h * 0.62, w * 0.32, h * 0.38);
    ctx.fillStyle = spec.accentHex;
    ctx.fillRect(w * 0.24, h * 0.10, w * 0.52, 6);
  } else if (spec.patternStyle === 'redbull_matte') {
    ctx.fillStyle = spec.accentHex;
    ctx.fillRect(0, 0, w, h * 0.24);
    ctx.fillStyle = spec.secondaryHex;
    ctx.fillRect(w * 0.46, h * 0.26, w * 0.08, h * 0.48);
  } else if (spec.patternStyle === 'mercedes_silver_black') {
    ctx.fillStyle = spec.secondaryHex;
    ctx.fillRect(0, 0, w, h * 0.72);
    ctx.fillStyle = spec.accentHex;
    ctx.fillRect(w * 0.16, 0, 10, h);
    ctx.fillRect(w * 0.84 - 10, 0, 10, h);
  } else {
    ctx.fillStyle = spec.secondaryHex;
    ctx.fillRect(w * 0.43, 0, w * 0.14, h * 0.18);
    ctx.fillStyle = spec.accentHex;
    ctx.fillRect(w * 0.18, h * 0.78, w * 0.64, 8);
  }

  const isLight = isLightPrimarySpec(spec) || spec.patternStyle === 'mercedes_silver_black';

  // Team crest badge near front tip
  ctx.save();
  ctx.fillStyle = spec.accentHex;
  ctx.fillRect(w * 0.41, h * 0.14, w * 0.18, 52);
  ctx.font = '900 22px "Arial Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#111318';
  ctx.fillText(spec.shortName, w * 0.5, h * 0.14 + 27);

  // Large forward-facing racing number (e.g., 16 / 44 / 3 / 63)
  ctx.font = '900 176px "Arial Black", sans-serif';
  ctx.fillStyle = isLight ? '#111318' : '#FFFFFF';
  ctx.strokeStyle = isLight ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)';
  ctx.lineWidth = 8;
  ctx.strokeText(String(driver.number), w * 0.5, h * 0.50);
  ctx.fillText(String(driver.number), w * 0.5, h * 0.50);

  // Driver 3-letter code underneath
  ctx.font = '800 32px monospace';
  ctx.fillStyle = isLight ? '#E10600' : spec.accentHex;
  ctx.fillText(driver.shortCode, w * 0.5, h * 0.70);

  // Official FIA Chassis Name stamped on nose cone
  if (spec.carModelName) {
    ctx.font = '900 26px "Arial Black", sans-serif';
    ctx.fillStyle = isLight ? '#14161D' : '#FFFFFF';
    ctx.fillText(spec.carModelName.toUpperCase(), w * 0.5, h * 0.84);
  }
  ctx.restore();

  return finalizeTexture(canvas, true, maxAnisotropy, 1, 1);
}

function createFinTexture(
  spec: Livery2026Spec,
  driver: DriverShowroomProfile,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = spec.primaryHex;
  ctx.fillRect(0, 0, w, h);

  // Diagonal stripe on shark fin
  ctx.fillStyle = spec.secondaryHex;
  ctx.beginPath();
  ctx.moveTo(w * 0.56, 0);
  ctx.lineTo(w, 0);
  ctx.lineTo(w * 0.78, h);
  ctx.lineTo(w * 0.36, h);
  ctx.closePath();
  ctx.fill();

  // Thin racing pinstripe
  ctx.fillStyle = spec.accentHex;
  ctx.fillRect(0, h * 0.86, w, 10);

  const isLightFin = isLightPrimarySpec(spec);
  ctx.save();
  ctx.font = '900 108px "Arial Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isLightFin ? '#111318' : '#FFFFFF';
  ctx.fillText(String(driver.number), w * 0.36, h * 0.46);

  ctx.font = '800 32px monospace';
  ctx.fillStyle = isLightFin ? '#E10600' : spec.accentHex;
  ctx.fillText(driver.shortCode, w * 0.36, h * 0.76);
  ctx.restore();

  return finalizeTexture(canvas, true, maxAnisotropy, 1, 1);
}

function drawCurvedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  radius: number,
  centerAngle: number,
  stepAngle: number
) {
  const total = (text.length - 1) * stepAngle;
  for (let i = 0; i < text.length; i += 1) {
    const a = centerAngle - total * 0.5 + i * stepAngle;
    ctx.save();
    ctx.translate(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillText(text[i], 0, 0);
    ctx.restore();
  }
}

function createTireSidewallTexture(compound: TireCompound, maxAnisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;

  ctx.fillStyle = '#14151b';
  ctx.fillRect(0, 0, size, size);

  // Outer rubber shoulder bevel
  ctx.strokeStyle = '#1f222c';
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.445, 0, Math.PI * 2);
  ctx.stroke();

  // Pirelli-style twin compound arc stripes
  const info = TIRE_COMPOUND_HEX[compound] || TIRE_COMPOUND_HEX.medium;
  ctx.strokeStyle = info.hex;
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.355, 0.42, Math.PI - 0.42);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.355, Math.PI + 0.42, Math.PI * 2 - 0.42);
  ctx.stroke();

  // Curved "P ZERO" / "CINTURATO" brand arcs on sidewall
  ctx.save();
  ctx.font = '900 22px "Arial Black", sans-serif';
  ctx.fillStyle = info.hex;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  drawCurvedText(ctx, info.label, cx, cy, size * 0.355, -Math.PI * 0.5, 0.085);
  drawCurvedText(ctx, 'PIRELLI', cx, cy, size * 0.355, Math.PI * 0.5, 0.085);
  ctx.restore();

  // Inner 18-inch wheel aero cover disc
  const hubGrad = ctx.createRadialGradient(cx, cy, size * 0.05, cx, cy, size * 0.28);
  hubGrad.addColorStop(0, '#242834');
  hubGrad.addColorStop(1, '#14161c');
  ctx.fillStyle = hubGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.28, 0, Math.PI * 2);
  ctx.fill();

  // Radial aero turbine cover fins
  ctx.strokeStyle = '#2d3240';
  ctx.lineWidth = 6;
  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * size * 0.08, cy + Math.sin(a) * size * 0.08);
    ctx.lineTo(cx + Math.cos(a + 0.22) * size * 0.26, cy + Math.sin(a + 0.22) * size * 0.26);
    ctx.stroke();
  }

  return finalizeTexture(canvas, true, maxAnisotropy, 1, 1);
}

function createTireTreadBumpTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const w = 128;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, w, h);

  for (let x = 0; x < w; x += 4) {
    ctx.fillStyle = x % 8 === 0 ? '#969696' : '#6c6c6c';
    ctx.fillRect(x, 0, 2, h);
  }
  return finalizeTexture(canvas, false, maxAnisotropy, 4, 4);
}

function createBrakeDiscTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c = size / 2;

  ctx.fillStyle = '#2b2e37';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = '#474c59';
  ctx.lineWidth = 3;
  for (let i = 0; i < 28; i += 1) {
    const a = (i / 28) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(c + Math.cos(a) * 44, c + Math.sin(a) * 44);
    ctx.lineTo(c + Math.cos(a + 0.20) * 116, c + Math.sin(a + 0.20) * 116);
    ctx.stroke();
  }
  return finalizeTexture(canvas, true, maxAnisotropy, 1, 1);
}

function createFloorShadowTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(w / 2, h / 2, 18, w / 2, h / 2, w * 0.48);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
  grad.addColorStop(0.58, 'rgba(0, 0, 0, 0.52)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  return finalizeTexture(canvas, true, maxAnisotropy, 1, 1);
}

export function createF1TextureBundle(
  spec: Livery2026Spec,
  compound: TireCompound,
  maxAnisotropy: number,
  driverIndex: 0 | 1 = 0
): F1TextureBundle {
  if (typeof document === 'undefined') {
    const fallbackCanvas = {
      width: 2,
      height: 2,
      getContext: () => null,
    } as unknown as HTMLCanvasElement;
    const dummy = new THREE.CanvasTexture(fallbackCanvas);
    return {
      carbonAlbedo: dummy,
      carbonBump: dummy,
      liveryBody: dummy,
      liveryNose: dummy,
      liveryFin: dummy,
      tireSidewall: dummy,
      tireTreadBump: dummy,
      brakeDisc: dummy,
      floorShadow: dummy,
      dispose: () => dummy.dispose(),
    };
  }

  const activeDriver = spec.drivers[driverIndex] || spec.drivers[0];
  const carbon = createCarbonPair(maxAnisotropy);
  const liveryBody = createLiveryBodyTexture(spec, maxAnisotropy);
  const liveryNose = createNoseTexture(spec, activeDriver, maxAnisotropy);
  const liveryFin = createFinTexture(spec, activeDriver, maxAnisotropy);
  const tireSidewall = createTireSidewallTexture(compound, maxAnisotropy);
  const tireTreadBump = createTireTreadBumpTexture(maxAnisotropy);
  const brakeDisc = createBrakeDiscTexture(maxAnisotropy);
  const floorShadow = createFloorShadowTexture(maxAnisotropy);

  return {
    carbonAlbedo: carbon.albedo,
    carbonBump: carbon.bump,
    liveryBody,
    liveryNose,
    liveryFin,
    tireSidewall,
    tireTreadBump,
    brakeDisc,
    floorShadow,
    dispose: () => {
      carbon.albedo.dispose();
      carbon.bump.dispose();
      liveryBody.dispose();
      liveryNose.dispose();
      liveryFin.dispose();
      tireSidewall.dispose();
      tireTreadBump.dispose();
      brakeDisc.dispose();
      floorShadow.dispose();
    },
  };
}
