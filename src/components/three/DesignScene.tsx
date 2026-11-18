import React, { useEffect, useState } from 'react';
import { DesignCanvas } from './DesignCanvas';
import { DesignControls } from './DesignControls';
import { componentRegistry } from './ComponentRegistry';
import { buildF1Car2026 } from './f1CarBuilder';
import type { Livery2026Spec } from '../../data/f12026Liveries';
import type { F1CarBuildParams } from './f1CarBuilder';

/**
 * High‑level scene that loads a car, registers its sub‑systems, and exposes the UI.
 * Used at route /design.
 */
export const DesignScene: React.FC<{ livery: Livery2026Spec; params: F1CarBuildParams }> = ({ livery, params }) => {
  const [car, setCar] = useState<ReturnType<typeof buildF1Car2026> | null>(null);

  useEffect(() => {
    // Build the car once.
    const built = buildF1Car2026(livery, params);
    setCar(built);

    // Register groups for visibility toggling.
    const register = (name: string, obj: THREE.Object3D) => {
      componentRegistry.register(name, obj);
    };

    // Walk the root and register named sub‑groups if they exist.
    built.root.traverse((child) => {
      if ((child as any).name) {
        register((child as any).name, child as THREE.Object3D);
      }
    });

    // Cleanup on unmount.
    return () => {
      built.dispose();
    };
  }, [livery, params]);

  if (!car) return null;

  return (
    <DesignCanvas>
      {/* Insert the built car into the scene */}
      <primitive object={car.root} />
      {/* UI overlay */}
      <DesignControls car={car} />
    </DesignCanvas>
  );
};
