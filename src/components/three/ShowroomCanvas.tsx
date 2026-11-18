import React, { useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { PMREMGenerator } from 'three';

/**
 * Canvas used by the Showroom. Adds an HDRI environment and basic orbit controls.
 */
export const ShowroomCanvas: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const controlsRef = useRef<OrbitControls>(null);
  const { camera, gl, scene } = useThree();

  // Load HDR environment only once.
  useEffect(() => {
    const loader = new RGBELoader();
    loader.load('/textures/hdri/studio.exr', (texture) => {
      const pmremGenerator = new PMREMGenerator(gl);
      const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      scene.environment = envMap;
      scene.background = envMap;
      texture.dispose();
      pmremGenerator.dispose();
    });
  }, [gl, scene]);

  // Orbit controls
  useEffect(() => {
    if (!controlsRef.current) {
      const controls = new OrbitControls(camera, gl.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.1;
      controls.minDistance = 5;
      controls.maxDistance = 30;
      controlsRef.current = controls;
    }
    return () => {
      controlsRef.current?.dispose();
    };
  }, [camera, gl]);

  return (
    <Canvas camera={{ position: [0, 2, 10], fov: 45 }}>
      {/* Basic lights for added contrast */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
      {children}
    </Canvas>
  );
};
