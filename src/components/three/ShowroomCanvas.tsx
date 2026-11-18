import React, { useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import * as THREE from 'three';

const SceneEnvironmentAndControls: React.FC = () => {
  const controlsRef = useRef<OrbitControls | null>(null);
  const { camera, gl, scene } = useThree();

  useEffect(() => {
    const pmremGenerator = new THREE.PMREMGenerator(gl);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    scene.background = new THREE.Color(0x0c0d13);
    roomEnv.dispose();

    return () => {
      envTarget.dispose();
      pmremGenerator.dispose();
    };
  }, [gl, scene]);

  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 4;
    controls.maxDistance = 30;
    controlsRef.current = controls;

    return () => {
      controls.dispose();
      controlsRef.current = null;
    };
  }, [camera, gl]);

  return null;
};

/**
 * Canvas used by the Showroom. Uses procedural RoomEnvironment (zero external EXR fetches) and OrbitControls.
 */
export const ShowroomCanvas: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Canvas camera={{ position: [0, 2, 10], fov: 45 }}>
      <SceneEnvironmentAndControls />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.9} castShadow />
      {children}
    </Canvas>
  );
};
