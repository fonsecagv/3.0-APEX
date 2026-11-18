import * as THREE from 'three';
import type { ComponentPackage3D } from '../../engine/modules/m03Packaging';

export type ConceptionVisualMode =
  | 'standard'
  | 'xray_cad'
  | 'isolated_subsystem'
  | 'aerodynamics_streamlines'
  | 'exploded_assembly';

export interface SubsystemHighlightState {
  activeSubsystemId: string | null;
  targetFocusPoint: THREE.Vector3 | null;
}

/**
 * Highlights a specific engineering package or subsystem in the 3D view,
 * dimming unrelated parts and elevating the selected subsystem.
 */
export function setSubsystemHighlight(
  carRoot: THREE.Object3D,
  cadGroup: THREE.Group | null,
  activeSubsystem: ComponentPackage3D['subsystem'] | null
): void {
  if (!activeSubsystem) {
    // Restore normal opacity
    carRoot.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (!Array.isArray(mesh.material)) {
          mesh.material.transparent = false;
          mesh.material.opacity = 1.0;
        }
      }
    });

    if (cadGroup) {
      cadGroup.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (!Array.isArray(mesh.material)) {
            mesh.material.opacity = 0.58;
          }
        }
      });
    }
    return;
  }

  // Dim car bodywork to translucent CAD silhouette
  carRoot.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      if (!Array.isArray(mesh.material)) {
        mesh.material.transparent = true;
        mesh.material.opacity = 0.18;
      }
    }
  });

  // Highlight the matching subsystem box in the CAD overlay
  if (cadGroup) {
    cadGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const name = (mesh.name || '').toLowerCase();
        const matches = name.includes(activeSubsystem.toLowerCase());
        if (!Array.isArray(mesh.material)) {
          mesh.material.transparent = true;
          mesh.material.opacity = matches ? 0.95 : 0.08;
        }
      }
    });
  }
}

/**
 * Focuses camera target smoothly towards the active engineering component's CG position.
 */
export function getComponentFocusTarget(pkg: ComponentPackage3D, wheelbaseM: number): THREE.Vector3 {
  const xOffset = wheelbaseM / 2;
  return new THREE.Vector3(pkg.xCgM - xOffset, pkg.zCgM, pkg.yCgM);
}
