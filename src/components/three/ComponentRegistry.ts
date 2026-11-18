import * as THREE from 'three';

/**
 * Registry that maps component IDs to their Three.js Object3D instances.
 * Allows lookup, visibility toggling and retrieval of groups for the editor.
 */
class ComponentRegistry {
  private map = new Map<string, THREE.Object3D>();

  register(id: string, object: THREE.Object3D) {
    this.map.set(id, object);
  }

  get(id: string): THREE.Object3D | undefined {
    return this.map.get(id);
  }

  list(): string[] {
    return Array.from(this.map.keys());
  }

  setVisibility(id: string, visible: boolean) {
    const obj = this.map.get(id);
    if (obj) obj.visible = visible;
  }
}

export const componentRegistry = new ComponentRegistry();
