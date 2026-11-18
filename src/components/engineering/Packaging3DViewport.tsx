import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { ComponentPackage3D, PackagingAnalysisOutputs } from '../../engine/modules/m03Packaging';
import type { AeroMode, Driver, Team, TireCompound } from '../../types/f1';
import type { VehicleEngineeringParameters } from '../../types/physics';
import { LIVERY_2026_CATALOG, resolveTeamLivery2026, type Livery2026Spec } from '../../data/f12026Liveries';
import { buildF1Car2026, type BuiltF1Car, type CarVisualMode } from '../three/f1CarBuilder';
import { loadOrBuildF1Car, type CarModelMetadata, type LoadedF1CarInstance } from '../three/f1ModelLoader';
import { ChevronDown, ChevronUp, Eye, Layers, Maximize2, Minimize2, RotateCw, Sparkles, Wind, X } from 'lucide-react';

interface Packaging3DViewportProps {
  packaging: PackagingAnalysisOutputs;
  vehicleParams?: Partial<VehicleEngineeringParameters>;
  playerTeam?: Partial<Team> | null;
  allTeams?: Team[];
  drivers?: Driver[];
  defaultVisualMode?: CarVisualMode;
  defaultSelectedTeamId?: string;
  selectedTeamIdOverride?: string;
  onSelectTeamId?: (teamId: string) => void;
  heightClass?: string;
  defaultAutoSpin?: boolean;
}

const SUBSYSTEM_COLORS: Record<ComponentPackage3D['subsystem'], number> = {
  cockpit: 0x38bdf8,
  pu_ice: 0xf97316,
  energy_store: 0x10b981,
  gearbox_diff: 0xa855f7,
  cooling_radiators: 0x06b6d4,
  front_susp_brakes: 0x94a3b8,
  rear_susp_brakes: 0x64748b,
  floor_diffuser: 0x334155,
  wings: 0xeab308,
  driver_ballast: 0xfbbf24,
};

type CameraViewPreset = 'iso' | 'side' | 'top' | 'front' | 'front_wing' | 'cockpit' | 'rear';

const CAMERA_PRESETS: Record<
  CameraViewPreset,
  { pos: [number, number, number]; target: [number, number, number]; label: string }
> = {
  iso: { pos: [3.35, 1.48, 3.05], target: [0.05, 0.36, 0], label: '3D Iso' },
  side: { pos: [0.05, 0.56, 4.35], target: [0.05, 0.38, 0], label: 'Lado' },
  top: { pos: [0.05, 4.85, 0.04], target: [0.05, 0.25, 0], label: 'Topo' },
  front: { pos: [-3.95, 0.62, 0.22], target: [0.0, 0.35, 0], label: 'Frente' },
  front_wing: { pos: [-2.85, 0.55, 1.35], target: [-1.85, 0.24, 0], label: 'Asa Diant.' },
  cockpit: { pos: [0.45, 1.16, 0.92], target: [-0.45, 0.52, 0], label: 'Halo' },
  rear: { pos: [3.75, 0.85, 1.05], target: [0.95, 0.42, 0], label: 'Difusor' },
};

const TIRE_OPTIONS: Array<{ id: TireCompound; label: string; dot: string }> = [
  { id: 'soft', label: 'Soft', dot: '#EF4444' },
  { id: 'medium', label: 'Med', dot: '#FACC15' },
  { id: 'hard', label: 'Hard', dot: '#F1F5F9' },
  { id: 'inter', label: 'Inter', dot: '#22C55E' },
  { id: 'wet', label: 'Wet', dot: '#3B82F6' },
];

const SUBSYSTEM_TRADE_OFFS: Record<ComponentPackage3D['subsystem'], { tag: string; impact: string }> = {
  cockpit: { tag: 'ESTRUTURA & PILOTO', impact: 'Define proteção lateral FIA, centro de gravidade dianteiro e rigidez torcional do chassi.' },
  pu_ice: { tag: 'UNIDADE DE POTÊNCIA', impact: 'Maior massa concentrada no centro-traseiro; desloca o CG para trás e exige fluxo térmico contínuo.' },
  energy_store: { tag: 'BATERIA ERS 350kW', impact: 'Posição baixa sob a célula reduz altura do CG e melhora estabilidade em curvas de alta.' },
  gearbox_diff: { tag: 'TRANSMISSÃO M09', impact: 'Carcaça compacta libera a garganta do difusor traseiro, aumentando downforce sem arrasto extra.' },
  cooling_radiators: { tag: 'ARREFECIMENTO', impact: 'Radiadores volumosos protegem a PU do derating, porém alargam os sidepods (+arrasto).' },
  front_susp_brakes: { tag: 'EIXO DIANTEIRO', impact: 'Controla anti-dive na freada e estabilidade de altura da asa dianteira.' },
  rear_susp_brakes: { tag: 'EIXO TRASEIRO', impact: 'Governa tração na saída de curva, anti-squat e limpeza de esteira no difusor.' },
  floor_diffuser: { tag: 'EFEITO SOLO 2026', impact: 'Principal gerador de downforce eficiente; sensível à altura traseira e risco de porpoising.' },
  wings: { tag: 'AERO ATIVA X/Z', impact: 'Ajusta balanço dianteiro/traseiro em curva (Modo Z) e reduz arrasto na reta (Modo X).' },
  driver_ballast: { tag: 'LASTRO & COCKPIT', impact: 'Lastro estratégico permite atingir o peso mínimo FIA ajustando o balanço F/R ideal.' },
};

export const Packaging3DViewport: React.FC<Packaging3DViewportProps> = ({
  packaging,
  vehicleParams,
  playerTeam,
  allTeams,
  drivers,
  defaultVisualMode = 'xray_cad',
  defaultSelectedTeamId,
  selectedTeamIdOverride,
  onSelectTeamId,
  heightClass = 'h-[470px]',
  defaultAutoSpin = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const carRef = useRef<BuiltF1Car | null>(null);
  const cadGroupRef = useRef<THREE.Group | null>(null);
  const pickGroupRef = useRef<THREE.Group | null>(null);
  const pickableMeshesRef = useRef<THREE.Mesh[]>([]);
  const requestRenderRef = useRef<() => void>(() => {});
  const isSoftwareGlRef = useRef<boolean>(false);
  const cameraGoalRef = useRef<{ pos: THREE.Vector3; target: THREE.Vector3; active: boolean }>({
    pos: new THREE.Vector3(...CAMERA_PRESETS.iso.pos),
    target: new THREE.Vector3(...CAMERA_PRESETS.iso.target),
    active: false,
  });
  const explodeTargetRef = useRef<number>(0);
  const autoSpinRef = useRef<boolean>(defaultAutoSpin);

  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(null);
  const [webglUnavailable, setWebglUnavailable] = useState<boolean>(false);
  const [viewPreset, setViewPreset] = useState<CameraViewPreset>('iso');
  const [visualMode, setVisualMode] = useState<CarVisualMode>(defaultVisualMode);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [carMetadata, setCarMetadata] = useState<CarModelMetadata | null>(null);
  const [aeroMode, setAeroMode] = useState<AeroMode>('mode_z');
  const [tireCompound, setTireCompound] = useState<TireCompound>('soft');
  const [explodePct, setExplodePct] = useState<number>(0);
  const [internalTeamId, setInternalTeamId] = useState<string>(
    defaultSelectedTeamId || playerTeam?.id || 'player_car'
  );
  const [driverIndex, setDriverIndex] = useState<0 | 1>(0);
  const [autoSpin, setAutoSpin] = useState<boolean>(defaultAutoSpin);
  const [dockExpanded, setDockExpanded] = useState<boolean>(false);

  const selectedTeamId = selectedTeamIdOverride ?? internalTeamId;
  const selectTeam = (id: string) => {
    setInternalTeamId(id);
    onSelectTeamId?.(id);
  };

  const collidingNames = useMemo(() => {
    const names = new Set<string>();
    for (const c of packaging.interferences) {
      if (c.hasCollision) {
        names.add(c.componentA);
        names.add(c.componentB);
      }
    }
    return names;
  }, [packaging.interferences]);

  const selectedPackage = useMemo(
    () => (selectedPkgId ? packaging.packages.find((p) => p.id === selectedPkgId) || null : null),
    [packaging.packages, selectedPkgId]
  );

  // Resolve player team's live active drivers so Pilot 1 / Pilot 2 reflects current lineup
  const playerTeamDrivers = useMemo(() => {
    if (!drivers || !playerTeam?.drivers) return undefined;
    const matched = playerTeam.drivers
      .map((dId) => drivers.find((d) => d.id === dId))
      .filter((d): d is Driver => Boolean(d));
    return matched.length >= 2 ? matched : undefined;
  }, [drivers, playerTeam]);

  // Build active 2026 livery spec from either player's car or official 2026 grid team
  const activeLivery: Livery2026Spec = useMemo(() => {
    if (selectedTeamId === 'player_car' || (playerTeam?.id && selectedTeamId === playerTeam.id)) {
      return resolveTeamLivery2026(playerTeam || { id: 'apex', isPlayer: true }, undefined, playerTeamDrivers);
    }
    const preset = LIVERY_2026_CATALOG.find((c) => c.teamId === selectedTeamId);
    if (preset) return preset;
    const matchedTeam = allTeams?.find((t) => t.id === selectedTeamId);
    return resolveTeamLivery2026(matchedTeam || null);
  }, [selectedTeamId, playerTeam, allTeams, playerTeamDrivers]);

  const activeDriver = activeLivery.drivers[driverIndex] || activeLivery.drivers[0];

  const effectiveCarParams = useMemo(() => {
    const undercut = vehicleParams?.sidepodUndercutPct ?? 58;
    const derivedConcept: 'downwash' | 'conventional' | 'zeropod' =
      undercut >= 55 ? 'downwash' : undercut <= 25 ? 'zeropod' : 'conventional';
    const isModeX = aeroMode === 'mode_x';
    return {
      wheelbaseM: packaging.wheelbaseM,
      frontTrackM: packaging.frontTrackM,
      rearTrackM: packaging.rearTrackM,
      frontRideHeightMm: vehicleParams?.frontRideHeightMm ?? 24,
      rearRideHeightMm: vehicleParams?.rearRideHeightMm ?? 52,
      frontWingFlapDeg: isModeX
        ? (vehicleParams?.frontWingFlapStraightDeg ?? 10)
        : (vehicleParams?.frontWingFlapCornerDeg ?? 28),
      rearWingFlapDeg: isModeX
        ? (vehicleParams?.rearWingFlapStraightDeg ?? 8)
        : (vehicleParams?.rearWingFlapCornerDeg ?? 26),
      wingSpanM: (vehicleParams?.wingSpanMm ?? 1800) * 0.001,
      diffuserAngleDeg: vehicleParams?.diffuserAngleDeg ?? 10.5,
      sidepodConcept: derivedConcept,
      sidepodInletAreaM2: (vehicleParams?.sidepodInletAreaCm2 ?? 320) * 0.0001,
      suspensionFront: vehicleParams?.frontSuspensionType ?? 'pushrod',
      suspensionRear: vehicleParams?.rearSuspensionType ?? 'pullrod',
      aeroMode,
      tireCompound,
    };
  }, [packaging.wheelbaseM, packaging.frontTrackM, packaging.rearTrackM, vehicleParams, aeroMode, tireCompound]);

  const applyCameraPreset = (preset: CameraViewPreset) => {
    setViewPreset(preset);
    const p = CAMERA_PRESETS[preset];
    cameraGoalRef.current.pos.set(...p.pos);
    cameraGoalRef.current.target.set(...p.target);
    cameraGoalRef.current.active = true;
    requestRenderRef.current();
  };

  // Initialize persistent WebGL scene, lighting, controls, and RoomEnvironment once
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let probeSoftwareGl = false;
    try {
      const probeCanvas = document.createElement('canvas');
      const glProbe = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
      if (glProbe) {
        const dbg = glProbe.getExtension('WEBGL_debug_renderer_info');
        const unmasked = dbg ? String(glProbe.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '') : '';
        probeSoftwareGl = /SwiftShader|llvmpipe|Mesa|ANGLE.*Basic/i.test(unmasked);
      }
    } catch {
      probeSoftwareGl = false;
    }
    isSoftwareGlRef.current = probeSoftwareGl;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !probeSoftwareGl,
        alpha: false,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglUnavailable(true);
      return;
    }

    setWebglUnavailable(false);
    const width = Math.max(320, container.clientWidth);
    const height = Math.max(300, container.clientHeight);
    renderer.setPixelRatio(probeSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = !probeSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglUnavailable(true);
    };
    const handleContextRestored = () => {
      setWebglUnavailable(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0d13);
    scene.fog = new THREE.FogExp2(0x0c0d13, 0.058);
    sceneRef.current = scene;

    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.05, 50);
    camera.position.copy(cameraGoalRef.current.pos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !probeSoftwareGl;
    controls.dampingFactor = 0.07;
    controls.minDistance = 1.6;
    controls.maxDistance = 8.5;
    controls.maxPolarAngle = Math.PI * 0.485;
    controls.autoRotate = autoSpinRef.current && !probeSoftwareGl;
    controls.autoRotateSpeed = 0.85;
    controls.target.copy(cameraGoalRef.current.target);
    controls.update();
    controlsRef.current = controls;

    const envDisposables: Array<{ dispose: () => void }> = [];

    // 3-Point Studio Lighting + Overhead Showroom Soft-Fill
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x15161e, 0.55);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.9);
    keyLight.position.set(4.5, 6.4, 3.8);
    if (!probeSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 16;
      keyLight.shadow.camera.left = -3.4;
      keyLight.shadow.camera.right = 3.4;
      keyLight.shadow.camera.top = 3.4;
      keyLight.shadow.camera.bottom = -3.4;
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.0);
    rimLight.position.set(-4.5, 2.8, -3.5);
    scene.add(rimLight);

    if (!probeSoftwareGl) {
      const overheadFill = new THREE.DirectionalLight(0xe0f2fe, 0.78);
      overheadFill.position.set(-0.2, 5.4, -1.6);
      scene.add(overheadFill);
    }

    const studioFloorGeo = new THREE.CircleGeometry(7.2, 64);
    studioFloorGeo.rotateX(-Math.PI / 2);
    const studioFloorMat = new THREE.MeshStandardMaterial({
      color: 0x10121a,
      roughness: 0.76,
      metalness: 0.14,
    });
    const studioFloor = new THREE.Mesh(studioFloorGeo, studioFloorMat);
    studioFloor.position.y = -0.029;
    studioFloor.receiveShadow = true;
    scene.add(studioFloor);
    envDisposables.push(studioFloorGeo, studioFloorMat);

    const grid = new THREE.GridHelper(9, 36, 0x262c3d, 0x151923);
    grid.position.y = -0.028;
    scene.add(grid);

    const cadGroup = new THREE.Group();
    scene.add(cadGroup);
    cadGroupRef.current = cadGroup;

    // Dedicated always-visible invisible pick proxy group so clicking works in BOTH Showroom 2026 & Raio-X M03
    const pickGroup = new THREE.Group();
    scene.add(pickGroup);
    pickGroupRef.current = pickGroup;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downX = 0;
    let downY = 0;
    let lastMoveCheck = 0;

    const castAtPointer = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return [];
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects(pickableMeshesRef.current, false);
    };

    const handlePointerDown = (ev: PointerEvent) => {
      downX = ev.clientX;
      downY = ev.clientY;
    };
    const handlePointerUp = (ev: PointerEvent) => {
      const dist = Math.hypot(ev.clientX - downX, ev.clientY - downY);
      if (dist > 6) return; // Ignore orbit camera drags
      const hits = castAtPointer(ev.clientX, ev.clientY);
      if (hits.length > 0) {
        const hitId = hits[0].object.userData?.pkgId;
        if (typeof hitId === 'string') setSelectedPkgId(hitId);
      }
    };
    const handlePointerMove = (ev: PointerEvent) => {
      const now = performance.now();
      if (now - lastMoveCheck < 50) return;
      lastMoveCheck = now;
      const hits = castAtPointer(ev.clientX, ev.clientY);
      renderer.domElement.style.cursor = hits.length > 0 ? 'pointer' : 'grab';
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);
    renderer.domElement.addEventListener('pointermove', handlePointerMove);

    let rafId = 0;
    let currentExplode = explodeTargetRef.current;
    let prevTime = performance.now();
    let needsRender = true;

    const tick = (now: number) => {
      rafId = 0;
      const dt = Math.min(0.05, Math.max(0.001, (now - prevTime) / 1000));
      prevTime = now;

      let keepRunning = false;
      const activeCar = carRef.current;

      if (activeCar) {
        if (Math.abs(currentExplode - explodeTargetRef.current) > 0.002) {
          currentExplode = THREE.MathUtils.damp(currentExplode, explodeTargetRef.current, 8.5, dt);
          activeCar.applyExplodeFactor(currentExplode);
          keepRunning = true;
        } else if (currentExplode !== explodeTargetRef.current) {
          currentExplode = explodeTargetRef.current;
          activeCar.applyExplodeFactor(currentExplode);
        }
      }

      if (cameraGoalRef.current.active) {
        camera.position.x = THREE.MathUtils.damp(camera.position.x, cameraGoalRef.current.pos.x, 7.5, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, cameraGoalRef.current.pos.y, 7.5, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, cameraGoalRef.current.pos.z, 7.5, dt);
        controls.target.x = THREE.MathUtils.damp(controls.target.x, cameraGoalRef.current.target.x, 8.5, dt);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, cameraGoalRef.current.target.y, 8.5, dt);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, cameraGoalRef.current.target.z, 8.5, dt);

        if (
          camera.position.distanceToSquared(cameraGoalRef.current.pos) < 0.0004 &&
          controls.target.distanceToSquared(cameraGoalRef.current.target) < 0.0004
        ) {
          camera.position.copy(cameraGoalRef.current.pos);
          controls.target.copy(cameraGoalRef.current.target);
          cameraGoalRef.current.active = false;
        } else {
          keepRunning = true;
        }
      }

      const dampingMoved = controls.update();
      if ((dampingMoved || (autoSpinRef.current && !probeSoftwareGl)) && !probeSoftwareGl) {
        keepRunning = true;
      }

      renderer.render(scene, camera);

      if (keepRunning || needsRender) {
        needsRender = false;
        if (keepRunning) {
          rafId = requestAnimationFrame(tick);
        }
      }
    };

    const requestRender = () => {
      needsRender = true;
      if (!rafId) {
        prevTime = performance.now();
        rafId = requestAnimationFrame(tick);
      }
    };
    requestRenderRef.current = requestRender;

    const handleControlStart = () => {
      cameraGoalRef.current.active = false;
      if (autoSpinRef.current) {
        autoSpinRef.current = false;
        controls.autoRotate = false;
        setAutoSpin(false);
      }
      requestRender();
    };
    const handleControlChange = () => {
      requestRender();
    };
    controls.addEventListener('start', handleControlStart);
    controls.addEventListener('change', handleControlChange);

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(300, entry.contentRect.width);
        const h = Math.max(280, entry.contentRect.height);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        requestRender();
      }
    });
    ro.observe(container);

    requestRender();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      ro.disconnect();
      controls.removeEventListener('start', handleControlStart);
      controls.removeEventListener('change', handleControlChange);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      controls.dispose();
      envTarget.dispose();
      pmrem.dispose();
      sceneRef.current = null;
      rendererRef.current = null;
      controlsRef.current = null;
      cadGroupRef.current = null;
      pickGroupRef.current = null;
      for (const d of envDisposables) d.dispose();
      renderer.dispose();
    };
  }, []);

  // Fast swap/rebuild of 2026 F1 Car Mesh via GLTF loader or procedural engine
  useEffect(() => {
    const scene = sceneRef.current;
    const renderer = rendererRef.current;
    if (!scene || !renderer) return;

    let isMounted = true;
    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    loadOrBuildF1Car(activeLivery, effectiveCarParams, maxAniso, driverIndex).then((builtCar) => {
      if (!isMounted || !sceneRef.current) {
        builtCar.dispose();
        return;
      }
      if (carRef.current) {
        scene.remove(carRef.current.root);
        carRef.current.dispose();
      }
      builtCar.setVisualMode(visualMode);
      builtCar.applyExplodeFactor(explodeTargetRef.current);
      scene.add(builtCar.root);
      carRef.current = builtCar;
      setCarMetadata(builtCar.metadata);
      requestRenderRef.current();
    });

    return () => {
      isMounted = false;
      if (carRef.current) {
        scene.remove(carRef.current.root);
        carRef.current.dispose();
        carRef.current = null;
      }
    };
  }, [activeLivery, effectiveCarParams, driverIndex]);

  // Fast rebuild of M03 X-Ray CAD Overlay + Invisible Raycast Proxies when packaging or selected package changes
  useEffect(() => {
    const cadGroup = cadGroupRef.current;
    const pickGroup = pickGroupRef.current;
    if (!cadGroup || !pickGroup) return;

    const cadDisposables: Array<{ dispose: () => void }> = [];
    const pickableMeshes: THREE.Mesh[] = [];
    const sharedPickMat = new THREE.MeshBasicMaterial({ visible: false });
    cadDisposables.push(sharedPickMat);

    const L = packaging.wheelbaseM;
    const xCenterOffset = L / 2;
    const toThree = (xM: number, yM: number, zM: number) =>
      new THREE.Vector3(xM - xCenterOffset, zM, yM);

    const envGeo = new THREE.BoxGeometry(
      packaging.edition.maxWheelbaseM + 1.5,
      packaging.overallHeightM,
      packaging.edition.maxWidthM
    );
    const envEdges = new THREE.EdgesGeometry(envGeo);
    const envMat = new THREE.LineBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.35 });
    const envLine = new THREE.LineSegments(envEdges, envMat);
    envLine.position.set(0.1, packaging.overallHeightM / 2, 0);
    cadGroup.add(envLine);
    cadDisposables.push(envGeo, envEdges, envMat);

    for (const pkg of packaging.packages) {
      const isColliding = collidingNames.has(pkg.name);
      const isSelected = pkg.id === selectedPkgId;
      const color = isColliding ? 0xef4444 : SUBSYSTEM_COLORS[pkg.subsystem] ?? 0x64748b;

      const boxGeo = new THREE.BoxGeometry(
        Math.max(0.05, pkg.bboxHalfXM * 2),
        Math.max(0.03, pkg.bboxHalfZM * 2),
        Math.max(0.05, pkg.bboxHalfYM * 2)
      );
      const boxMat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.35,
        metalness: 0.4,
        transparent: true,
        opacity: pkg.subsystem === 'floor_diffuser' ? 0.24 : isSelected ? 0.85 : 0.58,
      });
      const boxPos = toThree(pkg.xCgM, pkg.yCgM, pkg.zCgM);
      const boxMesh = new THREE.Mesh(boxGeo, boxMat);
      boxMesh.position.copy(boxPos);
      cadGroup.add(boxMesh);

      // Always-active invisible proxy collider for raycasting across both Showroom & X-Ray modes
      const pickMesh = new THREE.Mesh(boxGeo, sharedPickMat);
      pickMesh.position.copy(boxPos);
      pickMesh.userData = { pkgId: pkg.id };
      pickGroup.add(pickMesh);
      pickableMeshes.push(pickMesh);

      const edgesGeo = new THREE.EdgesGeometry(boxGeo);
      const edgesMat = new THREE.LineBasicMaterial({
        color: isColliding ? 0xfca5a5 : isSelected ? 0xffffff : 0x94a3b8,
        transparent: true,
        opacity: isSelected ? 0.95 : 0.4,
      });
      boxMesh.add(new THREE.LineSegments(edgesGeo, edgesMat));
      cadDisposables.push(boxGeo, boxMat, edgesGeo, edgesMat);
    }

    const cgGeo = new THREE.SphereGeometry(0.06, 18, 18);
    const cgMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xca8a04,
      emissiveIntensity: 0.65,
      roughness: 0.2,
    });
    const cgPos = toThree(packaging.cgM.x, packaging.cgM.y, packaging.cgM.z);
    const cgMesh = new THREE.Mesh(cgGeo, cgMat);
    cgMesh.position.copy(cgPos);
    cadGroup.add(cgMesh);

    const dropLineGeo = new THREE.BufferGeometry().setFromPoints([
      cgPos,
      new THREE.Vector3(cgPos.x, 0, cgPos.z),
    ]);
    const dropLineMat = new THREE.LineBasicMaterial({ color: 0xfacc15 });
    const dropLine = new THREE.Line(dropLineGeo, dropLineMat);
    cadGroup.add(dropLine);
    cadDisposables.push(cgGeo, cgMat, dropLineGeo, dropLineMat);

    const hpGeo = new THREE.SphereGeometry(0.025, 10, 10);
    const hpMatFront = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    const hpMatRear = new THREE.MeshBasicMaterial({ color: 0xf472b6 });
    cadDisposables.push(hpGeo, hpMatFront, hpMatRear);

    for (const hp of packaging.hardpoints) {
      const m = new THREE.Mesh(hpGeo, hp.axle === 'front' ? hpMatFront : hpMatRear);
      m.position.copy(toThree(hp.xM, hp.yM, hp.zM));
      cadGroup.add(m);
    }

    const originPos = toThree(0, 0, 0.02);
    const xArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), originPos, 0.55, 0xef4444, 0.09, 0.05);
    const yArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), originPos, 0.55, 0x22c55e, 0.09, 0.05);
    const zArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), originPos, 0.55, 0x3b82f6, 0.09, 0.05);
    cadGroup.add(xArrow, yArrow, zArrow);

    cadGroup.visible = visualMode === 'xray_cad';
    pickableMeshesRef.current = pickableMeshes;
    requestRenderRef.current();

    return () => {
      cadGroup.clear();
      pickGroup.clear();
      pickableMeshesRef.current = [];
      for (const d of cadDisposables) d.dispose();
    };
  }, [packaging, collidingNames, selectedPkgId]);

  useEffect(() => {
    if (carRef.current) {
      carRef.current.setVisualMode(visualMode);
    }
    if (cadGroupRef.current) {
      cadGroupRef.current.visible = visualMode === 'xray_cad';
    }
    requestRenderRef.current();
  }, [visualMode]);

  useEffect(() => {
    explodeTargetRef.current = explodePct / 100;
    requestRenderRef.current();
  }, [explodePct]);

  useEffect(() => {
    autoSpinRef.current = autoSpin;
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoSpin && !isSoftwareGlRef.current;
    }
    requestRenderRef.current();
  }, [autoSpin]);

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 w-screen h-screen bg-[#0c0d13] overflow-hidden select-none'
          : `relative w-full ${heightClass} bg-[#0c0d13] border border-white/10 overflow-hidden select-none`
      }
    >
      {webglUnavailable ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
          <div className="text-[11px] font-f1-mono text-amber-300 mb-2">
            WebGL indisponível neste dispositivo — Projeção Ortográfica 2D (Plano X-Z SAE/ISO)
          </div>
          <svg viewBox="-0.8 -0.2 5.2 1.5" className="w-full max-w-2xl h-64 bg-[#15151E] border border-white/10">
            <line x1="-0.5" y1="1.05" x2="4.1" y2="1.05" stroke="#334155" strokeWidth="0.015" />
            {packaging.packages.map((p) => {
              const isCol = collidingNames.has(p.name);
              const ySvg = 1.05 - (p.zCgM + p.bboxHalfZM);
              return (
                <rect
                  key={p.id}
                  x={p.xCgM - p.bboxHalfXM}
                  y={ySvg}
                  width={p.bboxHalfXM * 2}
                  height={p.bboxHalfZM * 2}
                  fill={isCol ? '#ef4444' : '#38bdf8'}
                  fillOpacity={0.35}
                  stroke={isCol ? '#fca5a5' : '#e2e8f0'}
                  strokeWidth="0.01"
                  onClick={() => setSelectedPkgId(p.id)}
                />
              );
            })}
            <circle cx={packaging.cgM.x} cy={1.05 - packaging.cgM.z} r="0.045" fill="#facc15" />
          </svg>
        </div>
      ) : (
        <div ref={containerRef} className="w-full h-full" />
      )}

      {/* Top-Left Camera Presets & Visual Mode Switcher (Solid surfaces, zero backdrop-blur) */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-1.5 bg-[#101017]/94 border border-white/15 px-2.5 py-1.5 max-w-[calc(100%-1.5rem)]">
        {(Object.keys(CAMERA_PRESETS) as CameraViewPreset[]).map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => applyCameraPreset(preset)}
            className={`px-2 py-0.5 text-[10px] font-f1-mono uppercase cursor-pointer border transition-colors ${
              viewPreset === preset
                ? 'bg-[#E10600] border-[#E10600] text-white font-bold'
                : 'bg-[#171822] border-white/10 text-zinc-300 hover:text-white'
            }`}
          >
            {CAMERA_PRESETS[preset].label}
          </button>
        ))}

        <div className="flex items-center gap-1 pl-2 border-l border-white/15">
          <button
            type="button"
            onClick={() => setVisualMode('showroom')}
            className={`px-2 py-0.5 text-[10px] font-f1-mono uppercase cursor-pointer border flex items-center gap-1 ${
              visualMode === 'showroom'
                ? 'bg-cyan-600 border-cyan-400 text-white font-bold'
                : 'bg-[#171822] border-white/10 text-zinc-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Showroom 2026</span>
          </button>
          <button
            type="button"
            onClick={() => setVisualMode('xray_cad')}
            className={`px-2 py-0.5 text-[10px] font-f1-mono uppercase cursor-pointer border flex items-center gap-1 ${
              visualMode === 'xray_cad'
                ? 'bg-amber-600 border-amber-400 text-white font-bold'
                : 'bg-[#171822] border-white/10 text-zinc-300 hover:text-white'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Raio-X M03</span>
          </button>
        </div>
      </div>

      {/* Top-Right Chassis, Driver & T-Cam Telemetry Strip */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        {carMetadata && (
          <div className="hidden sm:flex items-center gap-1.5 bg-[#101017]/94 border border-white/15 px-2 py-1 text-[9px] font-f1-mono">
            <span
              className={`px-1.5 py-0.2 uppercase font-bold border ${
                carMetadata.source === 'team_glb'
                  ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                  : carMetadata.source === 'base_glb'
                  ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300'
                  : 'bg-zinc-800 border-white/20 text-zinc-300'
              }`}
            >
              {carMetadata.source === 'team_glb'
                ? '3D GLB Oficial'
                : carMetadata.source === 'base_glb'
                ? 'GLB Base 2026'
                : 'CAD Paramétrico'}
            </span>
            <span className="text-zinc-400">
              {(carMetadata.triangleCount / 1000).toFixed(1)}k tris
            </span>
          </div>
        )}

        <div className="hidden lg:flex items-center gap-2 bg-[#101017]/94 border border-white/15 px-3 py-1.5 text-[10px] font-f1-mono">
          <span
            className="w-2.5 h-2.5 border border-white/30 shrink-0"
            style={{ backgroundColor: activeLivery.primaryHex }}
          />
          <span className="font-f1-wide font-bold text-white uppercase">{activeLivery.carModelName}</span>
          <span className="text-zinc-500">·</span>
          <span className="text-white font-bold tabular-nums">#{activeDriver.number} {activeDriver.shortCode}</span>
          <span
            className="w-2.5 h-2.5 border border-white/40 shrink-0"
            title={`FIA T-Cam: ${driverIndex === 0 ? 'Preta (Carro 1)' : 'Amarela (Carro 2)'}`}
            style={{ backgroundColor: activeDriver.tCamHex }}
          />
          <span className="text-zinc-500">·</span>
          <span className="text-zinc-300">{activeLivery.engineBadge}</span>
        </div>

        <button
          type="button"
          onClick={() => setIsFullscreen((prev) => !prev)}
          title={isFullscreen ? 'Sair do Modo Showroom Tela Cheia' : 'Expandir Showroom Tela Cheia (F1 Showroom 3D)'}
          className="bg-[#101017]/94 hover:bg-[#202230] border border-white/15 hover:border-cyan-400 p-2 text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-[10px] font-f1-mono uppercase"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-cyan-400" /> : <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />}
          <span className="hidden sm:inline font-bold">{isFullscreen ? 'Minimizar' : 'Showroom 3D'}</span>
        </button>
      </div>

      {/* Bottom Collapsible Inspector & Formula Dream 2026 Showroom Dock */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-col gap-2 pointer-events-none">
        {selectedPackage && (() => {
          const massPct = (selectedPackage.massKg / Math.max(1, packaging.totalMassKg)) * 100;
          const deltaXMm = Math.round((selectedPackage.xCgM - packaging.cgM.x) * 1000);
          const deltaZMm = Math.round((selectedPackage.zCgM - packaging.cgM.z) * 1000);
          const info = SUBSYSTEM_TRADE_OFFS[selectedPackage.subsystem];
          return (
            <div className="pointer-events-auto self-start w-full max-w-md bg-[#101017]/95 border border-[#E10600]/60 px-3.5 py-2.5 text-[11px] font-f1-mono shadow-xl space-y-2">
              <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-1.5">
                <div>
                  <span className="text-[9px] text-[#E10600] font-bold uppercase tracking-wider block">
                    {info.tag}
                  </span>
                  <span className="font-f1-wide font-black text-xs text-white uppercase">
                    {selectedPackage.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPkgId(null)}
                  title="Fechar inspeção"
                  className="text-zinc-400 hover:text-white p-0.5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 tabular-nums bg-[#171822] p-2 border border-white/5">
                <div>
                  <span className="text-[9px] text-zinc-400 block uppercase">Massa</span>
                  <span className="text-amber-300 font-bold">{selectedPackage.massKg.toFixed(1)} kg</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 block uppercase">% Total</span>
                  <span className="text-cyan-300 font-bold">{massPct.toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 block uppercase">Impacto CG</span>
                  <span className="text-white font-bold">
                    {deltaXMm <= 0 ? `${Math.abs(deltaXMm)}mm Diant.` : `${deltaXMm}mm Tras.`} · {deltaZMm >= 0 ? `+${deltaZMm}` : deltaZMm}mm Z
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-zinc-300 leading-snug">{info.impact}</p>
            </div>
          );
        })()}

        <div className="pointer-events-auto bg-[#101017]/94 border border-white/15 px-3 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-f1-mono">
            <div className="flex items-center gap-2 min-w-0">
              <Eye className="w-3.5 h-3.5 text-[#E10600] shrink-0" />
              <span className="text-white font-bold truncate">
                {activeLivery.teamName} ({activeLivery.carModelName})
              </span>
              <span className="hidden md:inline text-zinc-400 truncate">
                · #{activeDriver.number} {activeDriver.name}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {/* Driver 1 vs Driver 2 Switcher (mirrors Formula Dream driver=0 / driver=1) */}
              <div className="flex items-center border border-white/15 bg-[#171822]">
                {activeLivery.drivers.map((drv, idx) => {
                  const slot = idx as 0 | 1;
                  const active = driverIndex === slot;
                  return (
                    <button
                      key={`${activeLivery.teamId}_${slot}`}
                      type="button"
                      onClick={() => setDriverIndex(slot)}
                      title={`${drv.name} · T-Cam ${slot === 0 ? 'Preta' : 'Amarela'}`}
                      className={`px-2 py-0.5 uppercase cursor-pointer flex items-center gap-1.5 transition-colors ${
                        active
                          ? 'bg-[#E10600] text-white font-bold'
                          : 'text-zinc-300 hover:text-white'
                      }`}
                    >
                      <span
                        className="w-2 h-2 border border-white/40 shrink-0"
                        style={{ backgroundColor: drv.tCamHex }}
                      />
                      <span className="tabular-nums">#{drv.number} {drv.shortCode}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setAeroMode((prev) => (prev === 'mode_z' ? 'mode_x' : 'mode_z'))}
                className={`px-2 py-0.5 border uppercase cursor-pointer flex items-center gap-1 ${
                  aeroMode === 'mode_x'
                    ? 'bg-cyan-700 border-cyan-400 text-white font-bold'
                    : 'bg-[#171822] border-white/15 text-zinc-200'
                }`}
              >
                <Wind className="w-3 h-3" />
                <span>{aeroMode === 'mode_x' ? 'Modo X (Reta)' : 'Modo Z (Curva)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setAutoSpin((v) => !v)}
                className={`px-2 py-0.5 border uppercase cursor-pointer flex items-center gap-1 ${
                  autoSpin
                    ? 'bg-emerald-700 border-emerald-400 text-white font-bold'
                    : 'bg-[#171822] border-white/15 text-zinc-200 hover:text-white'
                }`}
              >
                <RotateCw className="w-3 h-3" />
                <span>360°</span>
              </button>

              <button
                type="button"
                onClick={() => setDockExpanded((v) => !v)}
                className="px-2 py-0.5 bg-[#171822] hover:bg-[#232534] border border-white/15 text-zinc-200 uppercase cursor-pointer flex items-center gap-1"
              >
                <span>{dockExpanded ? 'Ocultar Grid 2026' : 'Grid 2026 & Pneus'}</span>
                {dockExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {dockExpanded && (
            <div className="mt-2.5 pt-2.5 border-t border-white/10 space-y-2.5 text-[10px] font-f1-mono">
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => selectTeam('player_car')}
                  className={`px-2 py-1 border uppercase cursor-pointer ${
                    selectedTeamId === 'player_car' || (playerTeam?.id && selectedTeamId === playerTeam.id)
                      ? 'bg-[#E10600] border-[#E10600] text-white font-bold'
                      : 'bg-[#171822] border-white/10 text-zinc-300 hover:text-white'
                  }`}
                >
                  Meu Carro ({playerTeam?.shortName || 'APX'})
                </button>
                {LIVERY_2026_CATALOG.map((spec) => (
                  <button
                    key={spec.teamId}
                    type="button"
                    onClick={() => selectTeam(spec.teamId)}
                    className={`px-2 py-1 border uppercase cursor-pointer flex items-center gap-1.5 ${
                      selectedTeamId === spec.teamId
                        ? 'bg-[#252636] border-white text-white font-bold'
                        : 'bg-[#171822] border-white/10 text-zinc-300 hover:text-white'
                    }`}
                  >
                    <span
                      className="w-2 h-2 border border-white/30"
                      style={{ backgroundColor: spec.primaryHex }}
                    />
                    <span>{spec.carModelName}</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-zinc-400 mr-1">PNEU 18&quot;:</span>
                  {TIRE_OPTIONS.map((tOpt) => (
                    <button
                      key={tOpt.id}
                      type="button"
                      onClick={() => setTireCompound(tOpt.id)}
                      className={`px-2 py-0.5 border uppercase cursor-pointer flex items-center gap-1 ${
                        tireCompound === tOpt.id
                          ? 'bg-[#252636] border-white text-white font-bold'
                          : 'bg-[#171822] border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tOpt.dot }} />
                      <span>{tOpt.label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 min-w-[200px]">
                  <span className="text-zinc-400 whitespace-nowrap">EXPLODIR CAD:</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={explodePct}
                    onChange={(e) => setExplodePct(Number(e.target.value))}
                    className="w-full accent-[#E10600] h-1.5 bg-zinc-700 cursor-pointer"
                  />
                  <span className="text-white font-bold tabular-nums w-8 text-right">{explodePct}%</span>
                </div>
              </div>

              <div className="text-zinc-400">{activeLivery.visualNotes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
