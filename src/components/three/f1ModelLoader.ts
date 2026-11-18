import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import type { Livery2026Spec } from '../../data/f12026Liveries';
import { buildF1Car2026, type BuiltF1Car, type CarVisualMode, type F1CarBuildParams } from './f1CarBuilder';

export type CarModelSource = 'team_glb' | 'base_glb' | 'procedural';

export interface CarModelMetadata {
  source: CarModelSource;
  modelName: string;
  triangleCount: number;
  vertexCount: number;
  dimensionsM: {
    length: number;
    width: number;
    height: number;
  };
  identifiedParts: string[];
  isDracoCompressed: boolean;
}

export interface LoadedF1CarInstance extends BuiltF1Car {
  metadata: CarModelMetadata;
}

interface CachedModelEntry {
  url: string;
  sourceTemplate: THREE.Group;
  metadata: Omit<CarModelMetadata, 'source'>;
  refCount: number;
}

// Master Cache for GLTF raw templates (read-only, never directly added to scenes)
const gltfTemplateCache = new Map<string, CachedModelEntry>();

let sharedDracoLoader: DRACOLoader | null = null;
let sharedGltfLoader: GLTFLoader | null = null;

export function getSharedGltfLoader(): GLTFLoader {
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
export async function checkModelExists(url: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Computes triangle count, vertex count, and dimensions of a 3D hierarchy.
 */
function isPlinthOrEnvironmentNode(obj: THREE.Object3D): boolean {
  let curr: THREE.Object3D | null = obj;
  while (curr) {
    const n = (curr.name || '').toLowerCase();
    if (n.includes('plinth') || n.includes('turntable') || n.includes('shadow')) return true;
    curr = curr.parent;
  }
  return false;
}

/**
 * Computes triangle count, vertex count, and dimensions of a 3D hierarchy.
 */
export function analyzeModelGeometry(root: THREE.Object3D): {
  triangleCount: number;
  vertexCount: number;
  dimensionsM: { length: number; width: number; height: number };
  identifiedParts: string[];
} {
  let triangleCount = 0;
  let vertexCount = 0;
  const identifiedPartsSet = new Set<string>();
  const carOnlyBbox = new THREE.Box3();

  root.traverse((child) => {
    const name = (child.name || '').toLowerCase();
    const isPlinth = isPlinthOrEnvironmentNode(child);

    if (name.includes('wing')) identifiedPartsSet.add('Asas (Front/Rear Wing)');
    if (name.includes('sidepod')) identifiedPartsSet.add('Pontões (Sidepods)');
    if (name.includes('floor') || name.includes('diffuser')) identifiedPartsSet.add('Assoalho & Difusor');
    if (name.includes('halo')) identifiedPartsSet.add('Halo');
    if (name.includes('wheel') || name.includes('tire')) identifiedPartsSet.add('Rodas & Pneus');
    if (name.includes('monocoque') || name.includes('chassis') || name.includes('body')) {
      identifiedPartsSet.add('Chassi & Monocoque');
    }

    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      if (mesh.geometry) {
        const pos = mesh.geometry.getAttribute('position');
        if (pos) {
          vertexCount += pos.count;
          if (mesh.geometry.index) {
            triangleCount += Math.round(mesh.geometry.index.count / 3);
          } else {
            triangleCount += Math.round(pos.count / 3);
          }
        }
        if (!isPlinth) {
          carOnlyBbox.expandByObject(mesh);
        }
      }
    }
  });

  const size = new THREE.Vector3();
  if (carOnlyBbox.isEmpty()) {
    const fullBbox = new THREE.Box3().setFromObject(root);
    fullBbox.getSize(size);
  } else {
    carOnlyBbox.getSize(size);
  }

  return {
    triangleCount,
    vertexCount,
    dimensionsM: {
      length: Number(Math.max(size.x, size.z).toFixed(2)),
      width: Number(Math.min(size.x, size.z).toFixed(2)),
      height: Number(size.y.toFixed(2)),
    },
    identifiedParts: Array.from(identifiedPartsSet),
  };
}

/**
 * Normalizes model orientation (nose along -X, Y up) and scales to F1 2026 specs (~5.2m length).
 */
export function normalizeCarModelDimensions(root: THREE.Group): void {
  const initialBbox = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  initialBbox.getSize(size);

  // If longer in Z than X, rotate 90° around Y to align lengthwise along X
  if (size.z > size.x * 1.25) {
    root.rotation.y = Math.PI / 2;
    root.updateMatrixWorld(true);
  }

  // Target standard 2026 FIA length: 5.25 meters
  const reBbox = new THREE.Box3().setFromObject(root);
  reBbox.getSize(size);
  const length = Math.max(0.1, size.x);
  const targetLength = 5.25;

  if (Math.abs(length - targetLength) > 0.15) {
    const scaleFactor = targetLength / length;
    root.scale.multiplyScalar(scaleFactor);
    root.updateMatrixWorld(true);
  }

  // Ground alignment: offset Y so the lowest point rests exactly on Y = 0
  const finalBbox = new THREE.Box3().setFromObject(root);
  const yMin = finalBbox.min.y;
  root.position.y -= yMin;

  // Center lateral alignment (Z = 0)
  const zCenter = (finalBbox.min.z + finalBbox.max.z) / 2;
  root.position.z -= zCenter;
  root.updateMatrixWorld(true);
}

/**
 * Creates an isolated visual instance of a cached GLTF hierarchy:
 * - Shared BufferGeometry (efficient GPU memory)
 * - Deep-cloned Material instances (zero cross-contamination)
 * - Safe disposal without deleting cached geometries
 */
export function cloneModelWithIsolatedMaterials(source: THREE.Group): {
  clonedRoot: THREE.Group;
  ownedMaterials: THREE.Material[];
} {
  const ownedMaterials: THREE.Material[] = [];
  const clonedRoot = source.clone(false);

  function copyNode(srcNode: THREE.Object3D, targetNode: THREE.Object3D) {
    for (const child of srcNode.children) {
      if ((child as THREE.Mesh).isMesh) {
        const srcMesh = child as THREE.Mesh;
        let newMat: THREE.Material;

        if (Array.isArray(srcMesh.material)) {
          newMat = srcMesh.material[0]?.clone() ?? new THREE.MeshStandardMaterial();
        } else if (srcMesh.material) {
          newMat = srcMesh.material.clone();
        } else {
          newMat = new THREE.MeshStandardMaterial();
        }

        ownedMaterials.push(newMat);

        const newMesh = new THREE.Mesh(srcMesh.geometry, newMat);
        newMesh.name = srcMesh.name;
        newMesh.position.copy(srcMesh.position);
        newMesh.rotation.copy(srcMesh.rotation);
        newMesh.scale.copy(srcMesh.scale);
        newMesh.castShadow = true;
        newMesh.receiveShadow = true;
        newMesh.visible = srcMesh.visible;
        targetNode.add(newMesh);

        copyNode(child, newMesh);
      } else {
        const newGroup = child.clone(false);
        newGroup.name = child.name;
        newGroup.position.copy(child.position);
        newGroup.rotation.copy(child.rotation);
        newGroup.scale.copy(child.scale);
        newGroup.visible = child.visible;
        targetNode.add(newGroup);

        copyNode(child, newGroup);
      }
    }
  }

  copyNode(source, clonedRoot);
  return { clonedRoot, ownedMaterials };
}

/**
 * Applies team PBR materials and finishes to an isolated model instance.
 */
function applyPbrMaterialsToInstance(
  root: THREE.Group,
  ownedMaterials: THREE.Material[],
  livery: Livery2026Spec,
  params: F1CarBuildParams
): { bodyPaintMaterials: THREE.MeshPhysicalMaterial[]; carbonMaterials: THREE.MeshStandardMaterial[] } {
  const isGloss = livery.finishType === 'gloss';
  const primaryColor = new THREE.Color(livery.primaryHex);

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
  ownedMaterials.push(bodyPaintMat);
  bodyPaintMaterials.push(bodyPaintMat);

  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x181a20,
    roughness: 0.38,
    metalness: 0.36,
    side: THREE.DoubleSide,
  });
  ownedMaterials.push(carbonMat);
  carbonMaterials.push(carbonMat);

  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const name = (mesh.name || '').toLowerCase();
      const origMatName = (mesh.material && (mesh.material as THREE.Material).name
        ? (mesh.material as THREE.Material).name
        : ''
      ).toLowerCase();

      if (
        name.includes('body') ||
        name.includes('chassis') ||
        name.includes('engine_cover') ||
        name.includes('sidepod') ||
        name.includes('nose') ||
        origMatName.includes('body') ||
        origMatName.includes('paint')
      ) {
        mesh.material = bodyPaintMat;
      } else if (
        name.includes('wing') ||
        name.includes('floor') ||
        name.includes('diffuser') ||
        name.includes('suspension') ||
        origMatName.includes('carbon')
      ) {
        mesh.material = carbonMat;
      }

      // Modular sidepod visibility
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
 * Master Loader for F1 Car Models:
 * 1. Team-specific GLB (`/models/cars/{teamId}.glb`)
 * 2. Generic base 2026 GLB (`/models/cars/f1-2026-base.glb`)
 * 3. Procedural Fallback (`buildF1Car2026`)
 */
export async function loadOrBuildF1Car(
  livery: Livery2026Spec,
  params: F1CarBuildParams,
  maxAnisotropy = 4,
  driverIndex = 0
): Promise<LoadedF1CarInstance> {
  const teamModelUrl = `/models/cars/${livery.teamId}.glb`;
  const baseModelUrl = `/models/cars/f1-2026-base.glb`;

  let targetUrl: string | null = null;
  let detectedSource: CarModelSource = 'procedural';

  if (await checkModelExists(teamModelUrl)) {
    targetUrl = teamModelUrl;
    detectedSource = 'team_glb';
  } else if (await checkModelExists(baseModelUrl)) {
    targetUrl = baseModelUrl;
    detectedSource = 'base_glb';
  }

  // Attempt GLTF / GLB loading if a candidate file is discovered
  if (targetUrl) {
    try {
      let entry = gltfTemplateCache.get(targetUrl);

      if (!entry) {
        const loader = getSharedGltfLoader();
        const gltf = await loader.loadAsync(targetUrl);
        const templateRoot = gltf.scene;

        normalizeCarModelDimensions(templateRoot);
        const geomAnalysis = analyzeModelGeometry(templateRoot);

        entry = {
          url: targetUrl,
          sourceTemplate: templateRoot,
          metadata: {
            modelName: `${livery.carModelName} 3D Spec`,
            triangleCount: geomAnalysis.triangleCount,
            vertexCount: geomAnalysis.vertexCount,
            dimensionsM: geomAnalysis.dimensionsM,
            identifiedParts: geomAnalysis.identifiedParts,
            isDracoCompressed: targetUrl.endsWith('.glb'),
          },
          refCount: 0,
        };
        gltfTemplateCache.set(targetUrl, entry);
      }

      entry.refCount += 1;

      // Safe deep-cloned instance with shared geometry
      const { clonedRoot, ownedMaterials } = cloneModelWithIsolatedMaterials(entry.sourceTemplate);
      const { bodyPaintMaterials, carbonMaterials } = applyPbrMaterialsToInstance(
        clonedRoot,
        ownedMaterials,
        livery,
        params
      );

      const explodeParts: Array<{
        group: THREE.Group;
        basePos: THREE.Vector3;
        offset: THREE.Vector3;
      }> = [];

      clonedRoot.children.forEach((child, idx) => {
        if ((child as THREE.Group).isGroup || (child as THREE.Mesh).isMesh) {
          explodeParts.push({
            group: child as THREE.Group,
            basePos: child.position.clone(),
            offset: new THREE.Vector3(idx % 2 === 0 ? 0.35 : -0.35, ((idx % 3) + 1) * 0.22, 0),
          });
        }
      });

      const metadata: CarModelMetadata = {
        ...entry.metadata,
        source: detectedSource,
      };

      return {
        root: clonedRoot,
        bodyPaintMaterials,
        carbonMaterials,
        explodeParts,
        metadata,
        setVisualMode: (mode: CarVisualMode) => {
          const isXray = mode === 'xray_cad';
          clonedRoot.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach((m) => {
                  m.transparent = isXray;
                  m.opacity = isXray ? 0.26 : 1.0;
                });
              } else if (mesh.material) {
                mesh.material.transparent = isXray;
                mesh.material.opacity = isXray ? 0.26 : 1.0;
              }
            }
          });
        },
        applyExplodeFactor: (factor01: number) => {
          const f = THREE.MathUtils.clamp(factor01, 0, 1);
          explodeParts.forEach((part) => {
            part.group.position.copy(part.basePos).addScaledVector(part.offset, f);
          });
        },
        dispose: () => {
          // Dispose ONLY owned materials and textures — NEVER cached BufferGeometry!
          for (const mat of ownedMaterials) {
            mat.dispose();
          }
          if (entry) {
            entry.refCount = Math.max(0, entry.refCount - 1);
          }
        },
      };
    } catch (err) {
      console.warn(`[F1ModelLoader] Error loading ${targetUrl}, gracefully falling back to procedural:`, err);
    }
  }

  // Procedural Fallback Engine
  const proceduralCar = buildF1Car2026(livery, params, maxAnisotropy, driverIndex);
  const geomAnalysis = analyzeModelGeometry(proceduralCar.root);

  const proceduralMetadata: CarModelMetadata = {
    source: 'procedural',
    modelName: `${livery.carModelName} (APEX Procedural 2026)`,
    triangleCount: geomAnalysis.triangleCount,
    vertexCount: geomAnalysis.vertexCount,
    dimensionsM: geomAnalysis.dimensionsM,
    identifiedParts: geomAnalysis.identifiedParts,
    isDracoCompressed: false,
  };

  return {
    ...proceduralCar,
    metadata: proceduralMetadata,
  };
}
