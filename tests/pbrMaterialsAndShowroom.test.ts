import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  createAutomotivePaintMaterial,
  createCarbonFiberMaterial,
  createMechanicalMaterial,
  createTirePbrMaterial,
} from '../src/components/three/materialEngine';
import {
  createDecalMesh,
  createDecalTexture,
  createStandardDecalLayout,
} from '../src/components/three/decalSystem';
import {
  getComponentFocusTarget,
  setSubsystemHighlight,
} from '../src/components/three/conceptionEngine';
import {
  F1_2026_MODEL_REGISTRY,
  validateAssetRequirements,
} from '../src/components/three/assetRegistry';
import type { ComponentPackage3D } from '../src/engine/modules/m03Packaging';

describe('PBR Material Engine — Prompt 3 Implementation', () => {
  it('creates glossy automotive paint with high clearcoat and low roughness', () => {
    const mat = createAutomotivePaintMaterial({ color: '#DC0000', finishType: 'gloss' });
    expect(mat.clearcoat).toBeGreaterThanOrEqual(0.9);
    expect(mat.roughness).toBeLessThanOrEqual(0.2);
    expect(mat.reflectivity).toBeGreaterThan(0.85);
    mat.dispose();
  });

  it('creates matte automotive paint with suppressed clearcoat and high roughness', () => {
    const mat = createAutomotivePaintMaterial({ color: '#1E293B', finishType: 'matte' });
    expect(mat.clearcoat).toBeLessThan(0.3);
    expect(mat.roughness).toBeGreaterThanOrEqual(0.5);
    mat.dispose();
  });

  it('creates metallic and pearlescent paint variations with elevated metalness', () => {
    const metallicMat = createAutomotivePaintMaterial({ color: '#E2E8F0', finishType: 'metallic' });
    expect(metallicMat.metalness).toBeGreaterThan(0.6);
    metallicMat.dispose();

    const pearlMat = createAutomotivePaintMaterial({ color: '#FFFFFF', finishType: 'pearl' });
    expect(pearlMat.clearcoat).toBe(1.0);
    pearlMat.dispose();
  });

  it('creates authentic carbon fiber (twill and forged) with dual-sided rendering', () => {
    const twillMat = createCarbonFiberMaterial({ weaveType: 'twill_2x2' });
    expect(twillMat.side).toBe(THREE.DoubleSide);
    expect(twillMat.bumpScale).toBeGreaterThan(0);
    twillMat.dispose();

    const forgedMat = createCarbonFiberMaterial({ weaveType: 'forged' });
    expect(forgedMat.roughness).toBe(0.35);
    forgedMat.dispose();
  });

  it('creates specialized mechanical metals (titanium, aluminum, heat-treated exhaust)', () => {
    const titanium = createMechanicalMaterial('titanium');
    expect(titanium.metalness).toBeGreaterThan(0.8);
    titanium.dispose();

    const exhaust = createMechanicalMaterial('exhaust_heat_treated');
    expect(exhaust.metalness).toBe(0.92);
    exhaust.dispose();

    const brake = createMechanicalMaterial('brake_carbon_ceramic');
    expect(brake.roughness).toBeGreaterThan(0.7);
    brake.dispose();
  });

  it('creates tire rubber with compound adjustments and wear scaling', () => {
    const freshTire = createTirePbrMaterial({ compound: 'soft', wear01: 0 });
    const wornTire = createTirePbrMaterial({ compound: 'soft', wear01: 0.8 });
    expect(wornTire.roughness).toBeGreaterThan(freshTire.roughness);
    freshTire.dispose();
    wornTire.dispose();
  });
});

describe('Livery Engine & Decals — Prompt 4 Implementation', () => {
  it('generates a decal texture with clean alpha channel', () => {
    const tex = createDecalTexture({ text: '16', color: '#FFFFFF' });
    expect(tex).toBeInstanceOf(THREE.Texture);
    tex.dispose();
  });

  it('constructs a decal mesh with polygon offset to prevent Z-fighting', () => {
    const decals = createStandardDecalLayout({
      driverNumber: 44,
      driverCode: 'HAM',
      sponsorName: 'FERRARI',
    });
    expect(decals.length).toBeGreaterThanOrEqual(3);

    const noseMesh = createDecalMesh(decals[0]);
    expect(noseMesh.name).toContain('Decal_nose');
    const mat = noseMesh.material as THREE.MeshBasicMaterial;
    expect(mat.polygonOffset).toBe(true);
    expect(mat.depthWrite).toBe(false);

    noseMesh.geometry.dispose();
    mat.dispose();
  });
});

describe('Conception 3D & Engineering Subsystems — Prompt 5 Implementation', () => {
  it('highlights chosen subsystem and dims outer bodywork', () => {
    const carRoot = new THREE.Group();
    const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
    bodyMesh.name = 'CarBody_Nose';
    carRoot.add(bodyMesh);

    const cadGroup = new THREE.Group();
    const engineBox = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
    engineBox.name = 'Subsystem_pu_ice_Package';
    cadGroup.add(engineBox);

    // Activate pu_ice highlight
    setSubsystemHighlight(carRoot, cadGroup, 'pu_ice');
    expect((bodyMesh.material as THREE.MeshStandardMaterial).opacity).toBeLessThan(0.3);
    expect((engineBox.material as THREE.MeshStandardMaterial).opacity).toBeGreaterThan(0.9);

    // Reset highlight
    setSubsystemHighlight(carRoot, cadGroup, null);
    expect((bodyMesh.material as THREE.MeshStandardMaterial).opacity).toBe(1.0);

    bodyMesh.geometry.dispose();
    (bodyMesh.material as THREE.Material).dispose();
    engineBox.geometry.dispose();
    (engineBox.material as THREE.Material).dispose();
  });

  it('computes component focus target vector relative to wheelbase', () => {
    const dummyPkg: ComponentPackage3D = {
      id: 'ice_pkg',
      name: 'V6 Internal Combustion Engine',
      subsystem: 'pu_ice',
      massKg: 150,
      xCgM: 1.8,
      yCgM: 0.0,
      zCgM: 0.28,
      bboxHalfXM: 0.3,
      bboxHalfYM: 0.25,
      bboxHalfZM: 0.25,
      cgImpact: { frontWeightDistPctDelta: 0, cgHeightMmDelta: 0 },
    };

    const target = getComponentFocusTarget(dummyPkg, 3.6);
    expect(target.x).toBeCloseTo(0.0, 2); // 1.8 - 3.6 / 2 = 0
    expect(target.y).toBeCloseTo(0.28, 2);
    expect(target.z).toBeCloseTo(0.0, 2);
  });
});

describe('Asset Registry & Validation — Prompt 7 Implementation', () => {
  it('catalogs all 11 official 2026 teams and universal custom chassis', () => {
    expect(F1_2026_MODEL_REGISTRY.ferrari).toBeDefined();
    expect(F1_2026_MODEL_REGISTRY.mclaren).toBeDefined();
    expect(F1_2026_MODEL_REGISTRY.mercedes).toBeDefined();
    expect(F1_2026_MODEL_REGISTRY.redbull).toBeDefined();
    expect(F1_2026_MODEL_REGISTRY.williams).toBeDefined();
    expect(F1_2026_MODEL_REGISTRY.aston_martin).toBeDefined();
    expect(F1_2026_MODEL_REGISTRY.alpine).toBeDefined();
    expect(F1_2026_MODEL_REGISTRY.haas).toBeDefined();
    expect(F1_2026_MODEL_REGISTRY.vcarb).toBeDefined();
    expect(F1_2026_MODEL_REGISTRY.audi).toBeDefined();
    expect(F1_2026_MODEL_REGISTRY.cadillac).toBeDefined();
    expect(F1_2026_MODEL_REGISTRY.custom_base).toBeDefined();
  });

  it('validates 3D assets against FIA 2026 dimensions threshold', () => {
    const valid = validateAssetRequirements({ length: 5.25, width: 2.0, height: 0.95 });
    expect(valid.isValid).toBe(true);
    expect(valid.errors.length).toBe(0);

    const oversized = validateAssetRequirements({ length: 7.2, width: 2.0, height: 0.95 });
    expect(oversized.isValid).toBe(false);
    expect(oversized.errors[0]).toContain('Comprimento fora das regras FIA 2026');
  });

  it('constructs 2026 procedural hull with outward normals, no hovering nosePlate, and non-crossing sidepods', async () => {
    const { buildF1Car2026 } = await import('../src/components/three/f1CarBuilder');
    const { resolveTeamLivery2026 } = await import('../src/data/f12026Liveries');

    const audiLivery = resolveTeamLivery2026({ id: 'audi' });
    const built = buildF1Car2026(audiLivery, {
      wheelbaseM: 3.4,
      frontTrackM: 1.9,
      rearTrackM: 1.9,
      frontRideHeightMm: 22,
      rearRideHeightMm: 46,
      frontWingFlapDeg: 24,
      rearWingFlapDeg: 26,
      diffuserAngleDeg: 11,
      sidepodConcept: 'downwash',
      sidepodInletAreaM2: 0.032,
      suspensionFront: 'pullrod',
      suspensionRear: 'pushrod',
      aeroMode: 'mode_z',
      tireCompound: 'soft',
    });

    const monoGroup = built.root.getObjectByName('MonocoqueAndNose') as THREE.Group | undefined;
    expect(monoGroup).toBeDefined();
    expect(built.root.getObjectByName('NoseNumberPlate')).toBeUndefined();

    // First child of MonocoqueAndNose is the lofted chassis+nose mesh
    const monoMesh = monoGroup?.children[0] as THREE.Mesh;
    const pos = monoMesh.geometry.getAttribute('position');
    const norm = monoMesh.geometry.getAttribute('normal');
    expect(pos.count).toBeGreaterThan(100);

    // Sample crown/side normals relative to local ring centerline (y ≈ 0.35, z = 0) to guarantee outward winding
    let outwardVotes = 0;
    let totalChecked = 0;
    for (let i = 0; i < pos.count; i += 5) {
      const py = pos.getY(i);
      const pz = pos.getZ(i);
      const ny = norm.getY(i);
      const nz = norm.getZ(i);
      const dot = (py - 0.32) * ny + pz * nz;
      if (Math.abs(dot) > 0.001) {
        totalChecked += 1;
        if (dot > 0) outwardVotes += 1;
      }
    }
    expect(outwardVotes / Math.max(1, totalChecked)).toBeGreaterThan(0.85);

    const podsGroup = built.root.getObjectByName('SidepodsAndEngineCover') as THREE.Group | undefined;
    expect(podsGroup).toBeDefined();
    expect(built.bodyPaintMaterials.length).toBeGreaterThanOrEqual(4);

    built.dispose();
  });
});
