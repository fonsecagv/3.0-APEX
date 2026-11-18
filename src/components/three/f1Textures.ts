import * as THREE from 'three';
import type { DriverShowroomProfile, Livery2026Spec } from '../../data/f12026Liveries';
import type { TireCompound } from '../../types/f1';

export interface F1TextureBundle {
  carbonAlbedo: THREE.CanvasTexture;
  carbonBump: THREE.CanvasTexture;
  liveryMonocoque: THREE.CanvasTexture;
  liverySidepod: THREE.CanvasTexture;
  liverySidepodLeft: THREE.CanvasTexture;
  liveryFin: THREE.CanvasTexture;
  liveryFrontWing: THREE.CanvasTexture;
  liveryRearWing: THREE.CanvasTexture;
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
  tex.anisotropy = Math.max(1, Math.min(16, maxAnisotropy));
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
      ctx.fillStyle = isWarp ? '#15181f' : '#1f232c';
      ctx.fillRect(x, y, cell, cell);
      ctx.fillStyle = isWarp ? '#1c2028' : '#111319';
      ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);

      btx.fillStyle = isWarp ? '#b4b4b4' : '#585858';
      btx.fillRect(x, y, cell, cell);
    }
  }

  return {
    albedo: finalizeTexture(cColor, true, maxAnisotropy, 14, 14),
    bump: finalizeTexture(cBump, false, maxAnisotropy, 14, 14),
  };
}

function isLightPrimarySpec(spec: Livery2026Spec): boolean {
  return spec.patternStyle === 'vcarb_white_bull' || spec.patternStyle === 'haas_white_red';
}

/**
 * Dedicated Monocoque / Nose / Upper Spine Livery Texture (2048x1024).
 * UV convention on monoMesh:
 *   u (canvas X 0..w): 0 = nose tip (-X), 1 = engine tail (+X)
 *   v (canvas Y h..0): v = 0.5 (canvas cy = h * 0.5) is exact TOP centerline of nose & chassis!
 *   Top-down viewer facing from nose (-X) toward cockpit (+X):
 *   Rotating canvas ctx by -Math.PI/2 makes text read upright Left->Right cleanly!
 */
function createMonocoqueTexture(
  spec: Livery2026Spec,
  driver: DriverShowroomProfile,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const w = 2048;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const cy = h * 0.5;

  // 1. Base monocoque paint
  ctx.fillStyle = spec.primaryHex;
  ctx.fillRect(0, 0, w, h);

  // 2. Clean exposed carbon under-keel along bottom seam (v near 0 and 1 => cy near 0 and h)
  ctx.fillStyle = '#12141a';
  ctx.fillRect(0, 0, w, h * 0.14);
  ctx.fillRect(0, h * 0.86, w, h * 0.14);

  // 3. Per-team authentic monocoque/nose color splits
  switch (spec.patternStyle) {
    case 'ferrari_clean': {
      // SF-26 crisp white upper cowl & engine cover crown behind halo/cockpit
      ctx.fillStyle = spec.secondaryHex;
      ctx.beginPath();
      ctx.moveTo(w * 0.45, cy - h * 0.24);
      ctx.lineTo(w * 0.94, cy - h * 0.19);
      ctx.lineTo(w * 0.94, cy + h * 0.19);
      ctx.lineTo(w * 0.45, cy + h * 0.24);
      ctx.closePath();
      ctx.fill();

      // Thin yellow + white racing pinstripe bordering the nose side
      ctx.fillStyle = spec.accentHex;
      ctx.fillRect(w * 0.08, cy - h * 0.25, w * 0.82, 7);
      ctx.fillRect(w * 0.08, cy + h * 0.25 - 7, w * 0.82, 7);
      break;
    }
    case 'mercedes_silver_black': {
      // W17 metallic silver forward nosecone fading smoothly into satin black carbon
      const silGrad = ctx.createLinearGradient(0, 0, w * 0.48, 0);
      silGrad.addColorStop(0, spec.secondaryHex);
      silGrad.addColorStop(0.68, spec.secondaryHex);
      silGrad.addColorStop(1, 'rgba(200, 205, 214, 0)');
      ctx.fillStyle = silGrad;
      ctx.fillRect(0, h * 0.16, w * 0.48, h * 0.68);

      // Petronas teal nose & cowl border stripes
      ctx.fillStyle = spec.accentHex;
      ctx.fillRect(w * 0.04, cy - h * 0.24, w * 0.78, 8);
      ctx.fillRect(w * 0.04, cy + h * 0.24 - 8, w * 0.78, 8);
      break;
    }
    case 'redbull_matte': {
      // RB22 yellow nosecone tip + red bull collar + yellow airbox crown
      ctx.fillStyle = spec.accentHex;
      ctx.fillRect(0, h * 0.15, w * 0.155, h * 0.70);
      ctx.fillStyle = spec.secondaryHex;
      ctx.fillRect(w * 0.155, h * 0.18, w * 0.025, h * 0.64);
      ctx.fillStyle = spec.accentHex;
      ctx.fillRect(w * 0.55, cy - h * 0.16, w * 0.22, h * 0.32);
      break;
    }
    case 'audi_titan': {
      // Diagonal cut from titanium front into obsidian carbon rear & neon red stripe
      ctx.fillStyle = spec.secondaryHex;
      ctx.beginPath();
      ctx.moveTo(w * 0.56, 0);
      ctx.lineTo(w, 0);
      ctx.lineTo(w, h);
      ctx.lineTo(w * 0.56, h);
      ctx.lineTo(w * 0.48, cy);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = spec.accentHex;
      ctx.fillRect(w * 0.54, cy - h * 0.24, w * 0.03, h * 0.48);
      break;
    }
    case 'mclaren_papaya': {
      // Papaya front monocoque transitioning to exposed carbon engine cover spine
      ctx.fillStyle = spec.secondaryHex;
      ctx.fillRect(w * 0.56, h * 0.15, w * 0.44, h * 0.70);
      ctx.fillStyle = spec.primaryHex;
      ctx.fillRect(w * 0.56, cy - h * 0.11, w * 0.34, h * 0.22);
      break;
    }
    case 'alpine_bwt': {
      // Bright BWT pink nosecone top transitioning cleanly into dark Alpine navy
      ctx.fillStyle = spec.secondaryHex;
      ctx.fillRect(0, cy - h * 0.22, w * 0.36, h * 0.44);
      break;
    }
    case 'williams_royal': {
      // Royal blue body with crisp sky-blue twin centerline chevrons
      ctx.fillStyle = spec.secondaryHex;
      ctx.fillRect(w * 0.05, cy - h * 0.23, w * 0.85, 9);
      ctx.fillRect(w * 0.05, cy + h * 0.23 - 9, w * 0.85, 9);
      break;
    }
    case 'aston_racing_green': {
      // Racing green body with chartreuse-lime edge pinstripes
      ctx.fillStyle = '#CEDC00';
      ctx.fillRect(w * 0.04, cy - h * 0.24, w * 0.88, 7);
      ctx.fillRect(w * 0.04, cy + h * 0.24 - 7, w * 0.88, 7);
      break;
    }
    case 'vcarb_white_bull': {
      // White pearl front + yellow/red bull overhead airbox + navy rear spine
      ctx.fillStyle = spec.accentHex;
      ctx.fillRect(w * 0.54, cy - h * 0.15, w * 0.20, h * 0.30);
      ctx.fillStyle = spec.secondaryHex;
      ctx.fillRect(w * 0.02, cy - h * 0.12, w * 0.09, h * 0.24);
      ctx.fillStyle = '#161C2E';
      ctx.fillRect(w * 0.74, h * 0.16, w * 0.26, h * 0.68);
      break;
    }
    case 'haas_white_red': {
      // Clean white spine with Haas red & obsidian cockpit framing stripes
      ctx.fillStyle = spec.secondaryHex;
      ctx.fillRect(w * 0.06, cy - h * 0.22, w * 0.84, 12);
      ctx.fillRect(w * 0.06, cy + h * 0.22 - 12, w * 0.84, 12);
      break;
    }
    case 'cadillac_stealth': {
      // Asymmetric obsidian black & ice-white geometric nose/cowl split
      ctx.fillStyle = spec.secondaryHex;
      ctx.fillRect(0, cy, w * 0.42, h * 0.28);
      ctx.fillRect(w * 0.56, cy - h * 0.26, w * 0.40, h * 0.26);
      break;
    }
    default: {
      // Custom team: crisp secondary nose collar + shoulder accent stripes
      ctx.fillStyle = spec.secondaryHex;
      ctx.fillRect(w * 0.02, cy - h * 0.16, w * 0.11, h * 0.32);
      ctx.fillStyle = spec.secondaryHex;
      ctx.fillRect(w * 0.12, cy - h * 0.24, w * 0.78, 8);
      ctx.fillRect(w * 0.12, cy + h * 0.24 - 8, w * 0.78, 8);
      break;
    }
  }

  // 4. Subtle chassis panel seam lines (NO sidepod louvres on nose!)
  const isLight = isLightPrimarySpec(spec) || spec.patternStyle === 'mercedes_silver_black';
  ctx.save();
  ctx.strokeStyle = isLight ? 'rgba(15, 23, 42, 0.22)' : 'rgba(0, 0, 0, 0.42)';
  ctx.lineWidth = 3;
  for (const xFrac of [0.16, 0.34, 0.56, 0.78]) {
    ctx.beginPath();
    ctx.moveTo(w * xFrac, h * 0.15);
    ctx.lineTo(w * xFrac, h * 0.85);
    ctx.stroke();
  }
  ctx.restore();

  // 5. Direct Nose-Top Stamp (Eliminates overlapping nosePlate mesh completely!)
  // Viewer standing in front of nose (-X) looking toward cockpit (+X):
  // -pi/2 rotation maps local +X -> canvas -Y (+v = Right on viewer's screen)
  // and local -Y -> canvas +X (+u = Up toward cockpit on viewer's screen).
  const isNoseLight =
    isLightPrimarySpec(spec) ||
    spec.patternStyle === 'mercedes_silver_black' ||
    spec.patternStyle === 'mclaren_papaya' ||
    spec.patternStyle === 'audi_titan';

  // Team crest medallion near nose tip (u = 0.09)
  ctx.save();
  ctx.translate(w * 0.09, cy);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = spec.accentHex;
  ctx.fillRect(-76, -34, 152, 68);
  ctx.font = '900 32px "Arial Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#101218';
  ctx.fillText(spec.shortName, 0, 2);
  ctx.restore();

  // Crisp Official Driver Racing Number cleanly inlaid on forward nosecone (u = 0.21)
  ctx.save();
  ctx.translate(w * 0.21, cy);
  ctx.rotate(-Math.PI / 2);
  ctx.font = '900 132px "Arial Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 10;
  ctx.strokeStyle = isNoseLight ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)';
  ctx.strokeText(String(driver.number), 0, 0);
  ctx.fillStyle = isNoseLight ? '#111318' : '#FFFFFF';
  ctx.fillText(String(driver.number), 0, 0);
  ctx.restore();

  // Stamped Player/Team Chassis Model Name just ahead of front bulkhead / halo (u = 0.305)
  if (spec.carModelName) {
    ctx.save();
    ctx.translate(w * 0.305, cy);
    ctx.rotate(-Math.PI / 2);
    ctx.font = '900 30px "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isNoseLight ? '#111318' : '#FFFFFF';
    ctx.fillText(spec.carModelName.toUpperCase(), 0, 0);
    ctx.restore();
  }

  return finalizeTexture(canvas, true, maxAnisotropy, 1, 1);
}

/**
 * Dedicated Outer Sidepod & Upper Shoulder Livery Texture (2048x1024).
 * UV convention on podMesh:
 *   u (0..1): 0 = sidepod inlet leading edge, 1 = coke-bottle rear taper
 *   v (0..1): 0 = lower undercut keel (bottom), 0.5 = mid shoulder flank, 1 = top shoulder crown
 */
function createSidepodTexture(
  spec: Livery2026Spec,
  sideSign: -1 | 1,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const w = 2048;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = spec.primaryHex;
  ctx.fillRect(0, 0, w, h);

  // Dark carbon lower floor/undercut band at bottom (v = 0..0.28 => canvas Y = 0.72*h..h)
  const carbonGrad = ctx.createLinearGradient(0, h * 0.66, 0, h);
  carbonGrad.addColorStop(0, 'rgba(14, 16, 22, 0.0)');
  carbonGrad.addColorStop(0.35, 'rgba(14, 16, 22, 0.92)');
  carbonGrad.addColorStop(1, '#101218');
  ctx.fillStyle = carbonGrad;
  ctx.fillRect(0, h * 0.66, w, h * 0.34);

  switch (spec.patternStyle) {
    case 'ferrari_clean': {
      // Gloss Rosso Corsa with crisp white upper cowling shoulder + racing yellow pinstripe
      ctx.fillStyle = spec.secondaryHex;
      ctx.beginPath();
      ctx.moveTo(w * 0.08, 0);
      ctx.lineTo(w * 0.88, 0);
      ctx.lineTo(w * 0.78, h * 0.24);
      ctx.lineTo(w * 0.16, h * 0.20);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = spec.accentHex;
      ctx.fillRect(w * 0.05, h * 0.25, w * 0.84, 8);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(w * 0.05, h * 0.27, w * 0.84, 4);
      break;
    }
    case 'audi_titan': {
      // Diagonal cut from brushed titanium front to matte black carbon rear + bright neon red wedge
      ctx.fillStyle = spec.secondaryHex;
      ctx.beginPath();
      ctx.moveTo(w * 0.52, 0);
      ctx.lineTo(w, 0);
      ctx.lineTo(w, h);
      ctx.lineTo(w * 0.32, h);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = spec.accentHex;
      ctx.lineWidth = 34;
      ctx.beginPath();
      ctx.moveTo(w * 0.51, 0);
      ctx.lineTo(w * 0.31, h);
      ctx.stroke();

      ctx.fillStyle = spec.accentHex;
      ctx.beginPath();
      ctx.moveTo(w * 0.58, h * 0.16);
      ctx.lineTo(w * 0.92, h * 0.12);
      ctx.lineTo(w * 0.85, h * 0.34);
      ctx.lineTo(w * 0.49, h * 0.34);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'redbull_matte': {
      // Matte navy with vibrant crimson bull splash across mid-flank
      ctx.fillStyle = spec.secondaryHex;
      ctx.beginPath();
      ctx.moveTo(w * 0.22, h * 0.24);
      ctx.lineTo(w * 0.78, h * 0.14);
      ctx.lineTo(w * 0.64, h * 0.62);
      ctx.lineTo(w * 0.16, h * 0.54);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = spec.accentHex;
      ctx.beginPath();
      ctx.arc(w * 0.52, h * 0.34, 68, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'mercedes_silver_black': {
      // Satin carbon black sidepod + vivid sweeping Petronas teal ribbon + tiny silver star speckle
      ctx.strokeStyle = spec.accentHex;
      ctx.lineWidth = 22;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.44);
      ctx.bezierCurveTo(w * 0.32, h * 0.36, w * 0.58, h * 0.58, w * 0.96, h * 0.46);
      ctx.stroke();

      ctx.fillStyle = 'rgba(200, 205, 214, 0.38)';
      for (let i = 0; i < 10; i += 1) {
        const sx = w * (0.48 + (i % 5) * 0.09);
        const sy = h * (0.14 + Math.floor(i / 5) * 0.11);
        ctx.beginPath();
        ctx.arc(sx, sy, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'mclaren_papaya': {
      // Sharp diagonal cutaway from Papaya front into bare carbon sidepod flank
      ctx.fillStyle = spec.secondaryHex;
      ctx.beginPath();
      ctx.moveTo(w * 0.46, 0);
      ctx.lineTo(w, 0);
      ctx.lineTo(w, h);
      ctx.lineTo(w * 0.62, h);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = spec.primaryHex;
      ctx.beginPath();
      ctx.moveTo(w * 0.62, h * 0.62);
      ctx.lineTo(w * 0.95, h * 0.25);
      ctx.lineTo(w, h * 0.48);
      ctx.lineTo(w * 0.72, h * 0.76);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = spec.accentHex;
      ctx.fillRect(w * 0.08, h * 0.48, w * 0.32, 10);
      break;
    }
    case 'aston_racing_green': {
      // Gloss green sidepod + vivid chartreuse-lime undercut wave
      ctx.fillStyle = '#CEDC00';
      ctx.beginPath();
      ctx.moveTo(w * 0.05, h * 0.54);
      ctx.quadraticCurveTo(w * 0.48, h * 0.46, w * 0.92, h * 0.56);
      ctx.lineTo(w * 0.92, h * 0.59);
      ctx.quadraticCurveTo(w * 0.48, h * 0.49, w * 0.05, h * 0.57);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'alpine_bwt': {
      // Metallic pink BWT diagonal block across lower-mid sidepod against deep Alpine blue
      ctx.fillStyle = spec.secondaryHex;
      ctx.beginPath();
      ctx.moveTo(w * 0.12, h * 0.34);
      ctx.lineTo(w * 0.76, h * 0.18);
      ctx.lineTo(w * 0.88, h * 0.60);
      ctx.lineTo(w * 0.18, h * 0.66);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'williams_royal': {
      // Royal blue with sweeping sky-blue + white wave along lower shoulder
      ctx.fillStyle = spec.secondaryHex;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.36);
      ctx.bezierCurveTo(w * 0.32, h * 0.24, w * 0.66, h * 0.50, w, h * 0.38);
      ctx.lineTo(w, h * 0.52);
      ctx.bezierCurveTo(w * 0.64, h * 0.62, w * 0.30, h * 0.38, 0, h * 0.48);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(w * 0.14, h * 0.18, w * 0.64, 14);
      break;
    }
    case 'vcarb_white_bull': {
      // Pearlescent white sidepod + bold navy/red diagonal wedge toward coke-bottle exit
      ctx.fillStyle = '#161C2E';
      ctx.beginPath();
      ctx.moveTo(w * 0.48, h * 0.22);
      ctx.lineTo(w, 0);
      ctx.lineTo(w, h);
      ctx.lineTo(w * 0.28, h);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = spec.secondaryHex;
      ctx.beginPath();
      ctx.moveTo(w * 0.16, h * 0.26);
      ctx.lineTo(w * 0.62, h * 0.14);
      ctx.lineTo(w * 0.52, h * 0.44);
      ctx.lineTo(w * 0.12, h * 0.42);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'haas_white_red': {
      // Gloss white + dynamic obsidian & crimson diagonal graphic
      ctx.fillStyle = spec.secondaryHex;
      ctx.beginPath();
      ctx.moveTo(w * 0.26, h * 0.20);
      ctx.lineTo(w * 0.88, h * 0.08);
      ctx.lineTo(w * 0.82, h * 0.38);
      ctx.lineTo(w * 0.20, h * 0.44);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = spec.accentHex;
      ctx.fillRect(0, h * 0.52, w * 0.94, 24);
      break;
    }
    case 'cadillac_stealth': {
      // Asymmetric high-contrast black/white geometric stepped split
      ctx.fillStyle = spec.secondaryHex;
      ctx.fillRect(w * 0.10, h * 0.22, w * 0.44, h * 0.36);
      ctx.fillStyle = spec.accentHex;
      ctx.fillRect(w * 0.54, h * 0.18, w * 0.34, 12);
      break;
    }
    default: {
      // Custom team: sleek angled factory works stripe
      ctx.fillStyle = spec.secondaryHex;
      ctx.beginPath();
      ctx.moveTo(w * 0.14, h * 0.30);
      ctx.lineTo(w * 0.84, h * 0.14);
      ctx.lineTo(w * 0.90, h * 0.32);
      ctx.lineTo(w * 0.18, h * 0.48);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = spec.accentHex;
      ctx.fillRect(w * 0.08, h * 0.54, w * 0.78, 8);
      break;
    }
  }

  // Sculpted cooling gill louvres cleanly on the UPPER sidepod shoulder ONLY
  const isLight = isLightPrimarySpec(spec);
  ctx.save();
  const gillStart = w * 0.44;
  const gillY = h * 0.10;
  for (let i = 0; i < 8; i += 1) {
    const gx = gillStart + i * 38;
    ctx.fillStyle = 'rgba(10, 12, 16, 0.86)';
    ctx.beginPath();
    ctx.moveTo(gx, gillY);
    ctx.lineTo(gx + 18, gillY);
    ctx.lineTo(gx + 6, gillY + 62);
    ctx.lineTo(gx - 12, gillY + 62);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Team monogram & Chassis Name on outer mid-flank (mirror-safe per sideSign)
  ctx.save();
  const labelX = w * 0.36;
  const labelY = h * 0.46;
  ctx.translate(labelX, labelY);
  if (sideSign < 0) {
    ctx.scale(-1, 1);
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 76px "Arial Black", sans-serif';
  ctx.fillStyle = isLight ? '#14161d' : 'rgba(255, 255, 255, 0.94)';
  ctx.fillText(spec.shortName, 0, -14);

  ctx.font = '800 34px monospace';
  ctx.fillStyle = isLight ? '#E10600' : spec.accentHex;
  ctx.fillText(spec.carModelName.toUpperCase(), 0, 36);
  ctx.restore();

  return finalizeTexture(canvas, true, maxAnisotropy, 1, 1);
}

function createFinTexture(
  spec: Livery2026Spec,
  driver: DriverShowroomProfile,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = spec.aeroGeometry.cowlHex || spec.primaryHex;
  ctx.fillRect(0, 0, w, h);

  // Diagonal rear flash in secondary color
  ctx.fillStyle = spec.secondaryHex;
  ctx.beginPath();
  ctx.moveTo(w * 0.60, 0);
  ctx.lineTo(w, 0);
  ctx.lineTo(w * 0.80, h);
  ctx.lineTo(w * 0.42, h);
  ctx.closePath();
  ctx.fill();

  // Horizontal base pinstripe
  ctx.fillStyle = spec.accentHex;
  ctx.fillRect(0, h * 0.85, w, 16);

  const isLightFin =
    isLightPrimarySpec(spec) ||
    spec.patternStyle === 'ferrari_clean';

  ctx.save();
  ctx.font = '900 185px "Arial Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isLightFin ? '#111318' : '#FFFFFF';
  ctx.fillText(String(driver.number), w * 0.34, h * 0.44);

  ctx.font = '800 46px monospace';
  ctx.fillStyle = isLightFin ? '#E10600' : spec.accentHex;
  ctx.fillText(`${driver.shortCode} · ${spec.carModelName.toUpperCase()}`, w * 0.36, h * 0.76);
  ctx.restore();

  return finalizeTexture(canvas, true, maxAnisotropy, 1, 1);
}

function createFrontWingEndplateTexture(spec: Livery2026Spec, maxAnisotropy: number): THREE.CanvasTexture {
  const w = 512;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = spec.aeroGeometry.frontWingEndplateHex || '#16181F';
  ctx.fillRect(0, 0, w, h);

  // Signature team bottom swoosh
  ctx.fillStyle = spec.accentHex;
  ctx.fillRect(0, h * 0.86, w, h * 0.10);

  if (spec.patternStyle === 'ferrari_clean') {
    // Classic Italian Tricolore bar along lower Ferrari front wing endplate
    ctx.fillStyle = '#009246';
    ctx.fillRect(w * 0.10, h * 0.76, w * 0.26, 20);
    ctx.fillStyle = '#F5F5F5';
    ctx.fillRect(w * 0.36, h * 0.76, w * 0.26, 20);
    ctx.fillStyle = '#CE2B37';
    ctx.fillRect(w * 0.62, h * 0.76, w * 0.28, 20);
  }

  const isLightPlate =
    spec.patternStyle === 'vcarb_white_bull' ||
    spec.patternStyle === 'mclaren_papaya';

  ctx.save();
  ctx.font = '900 72px "Arial Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isLightPlate ? '#111318' : '#FFFFFF';
  ctx.fillText(spec.shortName, w * 0.52, h * 0.56);
  ctx.restore();

  return finalizeTexture(canvas, true, maxAnisotropy, 1, 1);
}

function createRearWingFlapTexture(spec: Livery2026Spec, maxAnisotropy: number): THREE.CanvasTexture {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = spec.rearWingAccentHex || spec.primaryHex;
  ctx.fillRect(0, 0, w, h);

  // Thin edge trim
  ctx.fillStyle = spec.accentHex;
  ctx.fillRect(0, h * 0.88, w, 14);
  ctx.fillRect(0, h * 0.04, w, 10);

  const isLightWing =
    spec.rearWingAccentHex === '#F3F4F6' ||
    spec.rearWingAccentHex === '#38BDF8' ||
    spec.patternStyle === 'mclaren_papaya';

  ctx.save();
  if (spec.patternStyle === 'audi_titan') {
    // Signature 4 interlocking Audi red rings on rear wing active flap
    ctx.strokeStyle = spec.accentHex;
    ctx.lineWidth = 24;
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.arc(w * (0.35 + i * 0.10), h * 0.5, 68, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else {
    ctx.font = '900 132px "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isLightWing ? '#111318' : '#FFFFFF';
    ctx.fillText(spec.carModelName.toUpperCase(), w * 0.5, h * 0.5);
  }
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

function createTireSidewallTexture(
  compound: TireCompound,
  coverStyle: Livery2026Spec['aeroGeometry']['wheelCoverStyle'],
  maxAnisotropy: number
): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;

  ctx.fillStyle = '#13141a';
  ctx.fillRect(0, 0, size, size);

  // Subtle sculpted rubber sidewall shoulder ring
  ctx.strokeStyle = '#1f222c';
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.445, 0, Math.PI * 2);
  ctx.stroke();

  // Pirelli twin compound arc stripes
  const info = TIRE_COMPOUND_HEX[compound] || TIRE_COMPOUND_HEX.medium;
  ctx.strokeStyle = info.hex;
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.355, 0.44, Math.PI - 0.44);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.355, Math.PI + 0.44, Math.PI * 2 - 0.44);
  ctx.stroke();

  // Curved "P ZERO" / "CINTURATO" & "PIRELLI" typography
  ctx.save();
  ctx.font = '900 22px "Arial Black", sans-serif';
  ctx.fillStyle = info.hex;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  drawCurvedText(ctx, info.label, cx, cy, size * 0.355, -Math.PI * 0.5, 0.088);
  drawCurvedText(ctx, 'PIRELLI', cx, cy, size * 0.355, Math.PI * 0.5, 0.088);
  ctx.restore();

  // Inner 18-inch wheel face tailored to wheelCoverStyle
  const hubGrad = ctx.createRadialGradient(cx, cy, size * 0.04, cx, cy, size * 0.28);
  hubGrad.addColorStop(0, '#272b38');
  hubGrad.addColorStop(1, '#111319');
  ctx.fillStyle = hubGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.28, 0, Math.PI * 2);
  ctx.fill();

  if (coverStyle === 'spoke_5_open') {
    // 5-spoke split alloy rim look with recessed dark pockets
    ctx.strokeStyle = '#333848';
    ctx.lineWidth = 16;
    for (let i = 0; i < 5; i += 1) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * size * 0.06, cy + Math.sin(a) * size * 0.06);
      ctx.lineTo(cx + Math.cos(a) * size * 0.26, cy + Math.sin(a) * size * 0.26);
      ctx.stroke();
    }
  } else if (coverStyle === 'turbine_10') {
    ctx.strokeStyle = '#313746';
    ctx.lineWidth = 7;
    for (let i = 0; i < 10; i += 1) {
      const a = (i / 10) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * size * 0.07, cy + Math.sin(a) * size * 0.07);
      ctx.lineTo(cx + Math.cos(a + 0.28) * size * 0.26, cy + Math.sin(a + 0.28) * size * 0.26);
      ctx.stroke();
    }
  } else if (coverStyle === 'mesh_fan') {
    ctx.strokeStyle = '#2d3342';
    ctx.lineWidth = 5;
    for (let i = 0; i < 16; i += 1) {
      const a = (i / 16) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * size * 0.08, cy + Math.sin(a) * size * 0.08);
      ctx.lineTo(cx + Math.cos(a) * size * 0.26, cy + Math.sin(a) * size * 0.26);
      ctx.stroke();
    }
  } else {
    // Clean solid aero wheel disc with subtle machined concentric grooves
    ctx.strokeStyle = '#282c38';
    ctx.lineWidth = 4;
    for (const rFrac of [0.13, 0.20, 0.25]) {
      ctx.beginPath();
      ctx.arc(cx, cy, size * rFrac, 0, Math.PI * 2);
      ctx.stroke();
    }
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
    ctx.fillStyle = x % 8 === 0 ? '#929292' : '#707070';
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
  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Soft wide ambient underbody shadow
  const grad = ctx.createRadialGradient(w * 0.5, h * 0.5, 24, w * 0.5, h * 0.5, w * 0.46);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.88)');
  grad.addColorStop(0.54, 'rgba(0, 0, 0, 0.50)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Crisp grounded tire contact shadow footprints
  const wheelContactCoords = [
    [w * 0.19, h * 0.20],
    [w * 0.19, h * 0.80],
    [w * 0.80, h * 0.20],
    [w * 0.80, h * 0.80],
  ];
  for (const [wx, wy] of wheelContactCoords) {
    const wg = ctx.createRadialGradient(wx, wy, 4, wx, wy, 72);
    wg.addColorStop(0, 'rgba(0, 0, 0, 0.92)');
    wg.addColorStop(0.6, 'rgba(0, 0, 0, 0.35)');
    wg.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = wg;
    ctx.beginPath();
    ctx.ellipse(wx, wy, 72, 46, 0, 0, Math.PI * 2);
    ctx.fill();
  }

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
      liveryMonocoque: dummy,
      liverySidepod: dummy,
      liverySidepodLeft: dummy,
      liveryFin: dummy,
      liveryFrontWing: dummy,
      liveryRearWing: dummy,
      tireSidewall: dummy,
      tireTreadBump: dummy,
      brakeDisc: dummy,
      floorShadow: dummy,
      dispose: () => dummy.dispose(),
    };
  }

  const activeDriver = spec.drivers[driverIndex] || spec.drivers[0];
  const carbon = createCarbonPair(maxAnisotropy);
  const liveryMonocoque = createMonocoqueTexture(spec, activeDriver, maxAnisotropy);
  const liverySidepod = createSidepodTexture(spec, 1, maxAnisotropy);
  const liverySidepodLeft = createSidepodTexture(spec, -1, maxAnisotropy);
  const liveryFin = createFinTexture(spec, activeDriver, maxAnisotropy);
  const liveryFrontWing = createFrontWingEndplateTexture(spec, maxAnisotropy);
  const liveryRearWing = createRearWingFlapTexture(spec, maxAnisotropy);
  const tireSidewall = createTireSidewallTexture(compound, spec.aeroGeometry.wheelCoverStyle, maxAnisotropy);
  const tireTreadBump = createTireTreadBumpTexture(maxAnisotropy);
  const brakeDisc = createBrakeDiscTexture(maxAnisotropy);
  const floorShadow = createFloorShadowTexture(maxAnisotropy);

  return {
    carbonAlbedo: carbon.albedo,
    carbonBump: carbon.bump,
    liveryMonocoque,
    liverySidepod,
    liverySidepodLeft,
    liveryFin,
    liveryFrontWing,
    liveryRearWing,
    tireSidewall,
    tireTreadBump,
    brakeDisc,
    floorShadow,
    dispose: () => {
      carbon.albedo.dispose();
      carbon.bump.dispose();
      liveryMonocoque.dispose();
      liverySidepod.dispose();
      liverySidepodLeft.dispose();
      liveryFin.dispose();
      liveryFrontWing.dispose();
      liveryRearWing.dispose();
      tireSidewall.dispose();
      tireTreadBump.dispose();
      brakeDisc.dispose();
      floorShadow.dispose();
    },
  };
}

export function createCycloramaFloorTexture(maxAnisotropy = 4): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c = size * 0.5;

  const grad = ctx.createRadialGradient(c, c, size * 0.04, c, c, size * 0.5);
  grad.addColorStop(0.0, '#32343d');
  grad.addColorStop(0.28, '#262830');
  grad.addColorStop(0.62, '#13141a');
  grad.addColorStop(1.0, '#07080c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  return finalizeTexture(canvas, true, maxAnisotropy, 1, 1);
}
