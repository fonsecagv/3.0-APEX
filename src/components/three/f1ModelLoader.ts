import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import type { Livery2026Spec } from '../../data/f12026Liveries';
import { buildF1Car2026, type BuiltF1Car, type CarVisualMode, type F1CarBuildParams } from './f1CarBuilder';

// Cache for loaded GLTF models to avoid redundant downloads
const modelCache = new Map<string, THREE.Group>();

let sharedDracoLoader: DRACOLoader | null = null;
let sharedGltfLoader: GLTFLoader | null = null;

function getSharedGltfLoader(): GLTFLoader {
  if (!sharedGltfLoader) {
    sharedGltfLoader = new GLTFLoader();
    try {
      if (typeof window !== 'undefined') {
        sharedDracoLoader = new DRACOLoader();
        sharedDracoLoader.setDecoderPath('/draco/');
        sharedGltfLoader.setDRACOLoader(sharedDracoLoader);
      }
    } catch (e) {
      console.warn('[F1ModelLoader] DracoLoader init deferred or failed:', e);
    }
  }
  return sharedGltfLoader;
}

/**
 * Checks whether a given URL returns 200 OK before attempting a heavy GLTF parse.
 */
async function checkModelExists(url: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Applies PBR materials, carbon fiber finishes, and team colors to an imported 3D mesh.
 */
function enhanceCarModelMaterials(
  model: THREE.Group,
  livery: Livery2026Spec,
  params: F1CarBuildParams
): { bodyPaintMaterials: THREE.MeshPhysicalMaterial[]; carbonMaterials: THREE.MeshStandardMaterial[] } {
  const isGloss = livery.finishType === 'gloss';
  const primaryColor = new THREE.Color(livery.primaryHex);
  const secondaryColor = new THREE.Color(livery.secondaryHex);
  const accentColor = new THREE.Color(livery.accentHex);

  const bodyPaintMaterials: THREE.MeshPhysicalMaterial[] = [];
  const carbonMaterials: THREE.MeshStandardMaterial[] = [];

  const bodyPaintMat = new THREE.MeshPhysicalMaterial({
    color: primaryColor,
    roughness: isGloss ? 0.16 : 0.44,
    metalness: livery.finishType === 'matte' ? 0.14 : 0.28,
    clearcoat: isGloss ? 0.96 : 0.22,
    clearcoatRoughness: isGloss ? 0.08 : 0.42,
    reflectivity: 0.88,
  });
  bodyPaintMaterials.push(bodyPaintMat);

  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x181a20,
    roughness: 0.38,
    metalness: 0.36,
    side: THREE.DoubleSide,
  });
  carbonMaterials.push(carbonMat);

  model.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const name = (mesh.name || '').toLowerCase();
      const origMatName = (mesh.material && (mesh.material as THREE.Material).name
        ? (mesh.material as THREE.Material).name
        : ''
      ).toLowerCase();

      // If mesh belongs to bodywork, upgrade to high-end automotive clearcoat paint
      if (
        name.includes('body') ||
        name.includes('chassis') ||
        name.includes('engine_cover') ||
        name.includes('sidepod') ||
        name.includes('nose') ||
        origMatName.includes('body') ||
        origMatName.includes('paint')
      ) {
        if (!mesh.material || !(mesh.material as THREE.MeshPhysicalMaterial).clearcoat) {
          mesh.material = bodyPaintMat;
        } else {
          // If already has PBR material, enhance its clearcoat & team color
          const mat = (mesh.material as THREE.MeshPhysicalMaterial).clone();
          mat.clearcoat = isGloss ? 0.95 : 0.2;
          mat.clearcoatRoughness = isGloss ? 0.08 : 0.4;
          mesh.material = mat;
          bodyPaintMaterials.push(mat);
        }
      } else if (
        name.includes('wing') ||
        name.includes('floor') ||
        name.includes('diffuser') ||
        name.includes('suspension') ||
        name.includes('bargeboard') ||
        origMatName.includes('carbon')
      ) {
        mesh.material = carbonMat;
      }

      // Modular part visibility by sidepod concept
      if (name.includes('zeropod') && params.sidepodConcept !== 'zeropod') {
        mesh.visible = false;
      }
      if (name.includes('downwash') && params.sidepodConcept !== 'downwash') {
        mesh.visible = false;
      }
    }
  });

  return { bodyPaintMaterials, carbonMaterials };
}

/**
 * Loads a 2026 F1 car model:
 * 1. Probes `/models/cars/${livery.teamId}.glb`
 * 2. Probes `/models/cars/f1-2026-base.glb`
 * 3. Gracefully falls back to the high-detail procedural model from `buildF1Car2026`
 */
export async function loadOrBuildF1Car(
  livery: Livery2026Spec,
  params: F1CarBuildParams,
  maxAnisotropy = 4,
  driverIndex = 0
): Promise<BuiltF1Car> {
  const teamModelUrl = `/models/cars/${livery.teamId}.glb`;
  const baseModelUrl = `/models/cars/f1-2026-base.glb`;

  let targetUrl: string | null = null;
  if (await checkModelExists(teamModelUrl)) {
    targetUrl = teamModelUrl;
  } else if (await checkModelExists(baseModelUrl)) {
    targetUrl = baseModelUrl;
  }

  // If external GLB is available, load it and prepare it
  if (targetUrl) {
    try {
      const loader = getSharedGltfLoader();
      let rootGroup: THREE.Group;

      if (modelCache.has(targetUrl)) {
        rootGroup = modelCache.get(targetUrl)!.clone(true);
      } else {
        const gltf = await loader.loadAsync(targetUrl);
        rootGroup = gltf.scene;
        modelCache.set(targetUrl, rootGroup.clone(true));
      }

      // Auto-center and normalize scale if needed
      const bbox = new THREE.Box3().setFromObject(rootGroup);
      const size = new THREE.Vector3();
      bbox.getSize(size);
      if (size.x > 0.1) {
        // Target length ~5.2 meters for modern 2026 F1
        const scale = 5.2 / Math.max(size.x, size.z);
        if (Math.abs(scale - 1) > 0.05) {
          rootGroup.scale.setScalar(scale);
        }
      }

      const { bodyPaintMaterials, carbonMaterials } = enhanceCarModelMaterials(rootGroup, livery, params);

      const explodeParts: Array<{
        group: THREE.Group;
        basePos: THREE.Vector3;
        offset: THREE.Vector3;
      }> = [];

      rootGroup.children.forEach((child, idx) => {
        if ((child as THREE.Group).isGroup || (child as THREE.Mesh).isMesh) {
          explodeParts.push({
            group: child as THREE.Group,
            basePos: child.position.clone(),
            offset: new THREE.Vector3((idx % 2 === 0 ? 0.3 : -0.3), (idx % 3) * 0.2, 0),
          });
        }
      });

      return {
        root: rootGroup,
        bodyPaintMaterials,
        carbonMaterials,
        explodeParts,
        setVisualMode: (mode: CarVisualMode) => {
          rootGroup.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              if (mode === 'xray_cad') {
                if (!Array.isArray(mesh.material)) {
                  mesh.material.transparent = true;
                  mesh.material.opacity = 0.28;
                }
              } else {
                if (!Array.isArray(mesh.material)) {
                  mesh.material.transparent = false;
                  mesh.material.opacity = 1.0;
                }
              }
            }
          });
        },
        applyExplodeFactor: (factor01: number) => {
          explodeParts.forEach((part) => {
            part.group.position.lerpVectors(part.basePos, part.basePos.clone().add(part.offset), factor01);
          });
        },
        dispose: () => {
          rootGroup.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.geometry?.dispose();
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach((m) => m.dispose());
              } else if (mesh.material) {
                mesh.material.dispose();
              }
            }
          });
        },
      };
    } catch (err) {
      console.warn(`[F1ModelLoader] Failed to parse GLB at ${targetUrl}, falling back to procedural car:`, err);
    }
  }

  // Guaranteed fallback: high-fidelity parametric 2026 procedural car
  return buildF1Car2026(livery, params, maxAnisotropy, driverIndex);
}
