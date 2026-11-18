import React, { useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as THREE from 'three';

/**
 * Simple wrapper canvas used by the Design (Conception) editor.
 * Provides a perspective camera, orbit controls and a basic three‑point lighting rig.
 */
export const DesignCanvas: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const controlsRef = useRef<OrbitControls>(null);
  const { camera, gl } = useThree();

  useEffect(() => {
    if (!controlsRef.current) {
      const controls = new OrbitControls(camera, gl.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.1;
      controls.minDistance = 1;
      controls.maxDistance = 10;
      controlsRef.current = controls;
    }
    return () => {
      controlsRef.current?.dispose();
    };
  }, [camera, gl]);

  return (
    <Canvas camera={{ position: [0, 1, 2], fov: 45 }}>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
      <directionalLight position={[-5, 2, -3]} intensity={0.4} />
      {children}
    </Canvas>
  );
};
