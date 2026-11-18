import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  analyzeModelGeometry,
  cloneModelWithIsolatedMaterials,
  loadOrBuildF1Car,
  normalizeCarModelDimensions,
} from '../src/components/three/f1ModelLoader';
import { LIVERY_2026_CATALOG } from '../src/data/f12026Liveries';
import type { F1CarBuildParams } from '../src/components/three/f1CarBuilder';

const sampleParams: F1CarBuildParams = {
  wheelbaseM: 3.5,
  frontTrackM: 1.62,
  rearTrackM: 1.58,
  frontRideHeightMm: 28,
  rearRideHeightMm: 72,
  frontWingFlapDeg: 14,
  rearWingFlapDeg: 28,
  diffuserAngleDeg: 12.5,
  sidepodConcept: 'downwash',
  sidepodInletAreaM2: 0.12,
  suspensionFront: 'pushrod',
  suspensionRear: 'pullrod',
  aeroMode: 'mode_z',
  tireCompound: 'soft',
};

describe('F1 3D Model Engine — Prompt 2 Implementation', () => {
  const ferrariLivery = LIVERY_2026_CATALOG.find((l) => l.teamId === 'ferrari')!;

  it('procedural fallback activates gracefully with valid FIA 2026 metadata', async () => {
    const carInstance = await loadOrBuildF1Car(ferrariLivery, sampleParams, 4, 0);

    expect(carInstance).toBeDefined();
    expect(carInstance.root).toBeInstanceOf(THREE.Group);
    expect(carInstance.metadata).toBeDefined();
    expect(carInstance.metadata.source).toBe('procedural');
    expect(carInstance.metadata.triangleCount).toBeGreaterThan(1000);
    expect(carInstance.metadata.vertexCount).toBeGreaterThan(1000);
    // FIA 2026 length envelope: ~5.0m to 5.6m
    expect(carInstance.metadata.dimensionsM.length).toBeGreaterThanOrEqual(4.8);
    expect(carInstance.metadata.dimensionsM.length).toBeLessThanOrEqual(5.8);

    carInstance.dispose();
  });

  it('clones hierarchies with isolated materials to prevent cross-contamination', () => {
    const templateGroup = new THREE.Group();
    const sharedBoxGeo = new THREE.BoxGeometry(1, 1, 1);
    const sharedMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(sharedBoxGeo, sharedMat);
    templateGroup.add(mesh);

    const instA = cloneModelWithIsolatedMaterials(templateGroup);
    const instB = cloneModelWithIsolatedMaterials(templateGroup);

    // Both instances share the exact same GPU geometry buffer (zero memory bloat)
    const meshA = instA.clonedRoot.children[0] as THREE.Mesh;
    const meshB = instB.clonedRoot.children[0] as THREE.Mesh;
    expect(meshA.geometry).toBe(sharedBoxGeo);
    expect(meshB.geometry).toBe(sharedBoxGeo);

    // But materials are deeply isolated instances
    expect(meshA.material).not.toBe(meshB.material);
    expect(meshA.material).not.toBe(sharedMat);

    // Mutating instance A material has zero effect on instance B or template
    (meshA.material as THREE.MeshStandardMaterial).color.setHex(0x0000ff);
    expect((meshB.material as THREE.MeshStandardMaterial).color.getHex()).toBe(0xff0000);
    expect(sharedMat.color.getHex()).toBe(0xff0000);

    // Disposal of instance A does not destroy shared geometry buffer
    for (const m of instA.ownedMaterials) m.dispose();
    expect(sharedBoxGeo.attributes.position).toBeDefined();

    for (const m of instB.ownedMaterials) m.dispose();
    sharedBoxGeo.dispose();
    sharedMat.dispose();
  });

  it('normalizes model orientation and scale to standard 5.25m FIA spec', () => {
    const testCar = new THREE.Group();
    // Simulate raw unaligned model: length along Z (6.0m), width along X (2.0m)
    const unalignedBox = new THREE.BoxGeometry(2.0, 1.0, 6.0);
    const mat = new THREE.MeshBasicMaterial();
    const mesh = new THREE.Mesh(unalignedBox, mat);
    mesh.position.set(0, 0.5, 0); // Bottom at Y=0
    testCar.add(mesh);

    normalizeCarModelDimensions(testCar);

    const bbox = new THREE.Box3().setFromObject(testCar);
    const size = new THREE.Vector3();
    bbox.getSize(size);

    // After normalization, length must be along X and scaled to ~5.25m
    expect(size.x).toBeCloseTo(5.25, 1);
    // Ground alignment: lowest point must sit at Y = 0
    expect(bbox.min.y).toBeCloseTo(0, 1);

    unalignedBox.dispose();
    mat.dispose();
  });

  it('analyzes complex geometries and identifies subsystem categories', () => {
    const carRoot = new THREE.Group();
    const wingMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 1), new THREE.MeshBasicMaterial());
    wingMesh.name = 'FrontWing_ActiveFlap';
    const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(2, 0.05, 1), new THREE.MeshBasicMaterial());
    floorMesh.name = 'VenturiFloor_Diffuser';
    carRoot.add(wingMesh);
    carRoot.add(floorMesh);

    const analysis = analyzeModelGeometry(carRoot);
    expect(analysis.triangleCount).toBe(24); // 12 + 12
    expect(analysis.identifiedParts).toContain('Asas (Front/Rear Wing)');
    expect(analysis.identifiedParts).toContain('Assoalho & Difusor');

    wingMesh.geometry.dispose();
    floorMesh.geometry.dispose();
  });
});
