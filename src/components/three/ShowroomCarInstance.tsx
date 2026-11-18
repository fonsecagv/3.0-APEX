import React, { useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';
import { componentRegistry } from './ComponentRegistry';
import { createAutomotivePaintMaterial } from './materialEngine';
import type { ModelAssetEntry } from './assetRegistry';

/**
 * Renders a single car model for the showroom.
 * It clones the loaded GLTF scene so that each instance can have its own livery.
 */
export const ShowroomCarInstance: React.FC<{
  entry: ModelAssetEntry;
  liveryColor?: string; // hex string like '#ff0000'
}> = ({ entry, liveryColor = '#ffffff' }) => {
  const gltf = useLoader(GLTFLoader, entry.filePath);

  // Clone the scene to avoid mutating the original gltf.
  const carScene = useMemo(() => {
    const clone = THREE.SceneUtils.clone(gltf.scene) as THREE.Group;
    // Register the root under the entry id for visibility toggling if needed.
    componentRegistry.register(entry.id, clone);
    // Apply a basic paint material to all meshes that use a material named 'paint'.
    clone.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        // Simple heuristic: replace material if its name includes 'paint' or 'body'.
        if (mesh.material && typeof mesh.material !== 'string') {
          const matName = (mesh.material as any).name?.toLowerCase() || '';
          if (matName.includes('paint') || matName.includes('body')) {
            mesh.material = createAutomotivePaintMaterial({
              color: liveryColor,
              finishType: 'gloss',
            });
          }
        }
      }
    });
    return clone;
  }, [gltf, entry.id, liveryColor]);

  return <primitive object={carScene} />;
};
