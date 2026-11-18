import React, { useEffect, useMemo, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { F1TabBucket } from '../brand/F1Logo';
import { ParameterPhysicsCard } from '../common/ParameterPhysicsCard';
import { ComponentSpec } from '../../types/f1';
import {
  CASING_ALLOYS,
  COMMUNITY_DATA_SOURCES,
  COMPOSITE_MATERIALS,
  PHYSICS_PHENOMENA_CATALOG
} from '../../data/physicsDatabase';
import { computeMdoParetoSolutions } from '../../engine/optimizationEngine';
import { validateFia2026Compliance } from '../../engine/regulatoryEngine';
import { ModulesAuditConsole } from '../engineering/ModulesAuditConsole';
import { Packaging3DViewport } from '../engineering/Packaging3DViewport';
import { CarRadarComparisonChart } from '../engineering/CarRadarComparisonChart';
import { PersonAvatar } from '../common/PersonAvatar';
import { evaluateChiefCadFeedback } from '../../engine/engineeringFeedbackEngine';
import { buildPackagingArchitecture, FIA_2026_DEFAULT_EDITION } from '../../engine/modules/m03Packaging';
import { LIVERY_2026_CATALOG } from '../../data/f12026Liveries';
import {
  BATTERY_ARCHITECTURES_2026,
  BATTERY_SUB_CHEMISTRIES,
  ICE_METALLURGY_2026,
  PU_MATERIAL_RESEARCH_PROJECTS,
  getSupplierDnaSpec,
  resolveBatteryArchitectureId,
  resolveIceMetallurgyId,
  type BatteryArchitectureId,
  type IceMetallurgyId,
} from '../../data/puMaterials2026';
import {
  Cpu,
  Wind,
  Layers,
  Activity,
  Flame,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  Lock,
  Wrench,
  AlertTriangle,
  X,
  Users,
  BookOpen,
  Thermometer,
  ShieldCheck,
  Sliders,
  Info,
  FileSpreadsheet,
  FlaskConical
} from 'lucide-react';

type SimSubTab = 'correlation' | 'cfd' | 'fea' | 'thermal' | 'pareto' | 'checklist';

export const EngineeringTab: React.FC = () => {
  const {
    components,
    startComponentDevelopment,
    runWindTunnelTest,
    financials,
    currentWeek,
    currentCircuitIndex,
    t,
    language,
    modificadorErroCorrelacao,
    modificadorTempoManufatura,
    modificadorTempoPeD,
    atrNextYearAllocationRatio,
    setAtrNextYearAllocationRatio,
    phoenixDiscountH1,
    aduoWindowActive,
    aduoWeeksRemaining,
    aduoHomologationQuotas,
    aduoLastGapPercent,
    aduoBenchmarkPwr,
    aduoPlayerPwr,
    avaliarADUO,
    aplicarModificacaoADUO,
    vehicleParams,
    updateVehicleParams,
    vehiclePhysics,
    lastSimulationReport,
    playerTeam,
    allTeams,
    drivers,
    staff,
    respondToChiefAdvice,
    respondToDriverFeedback,
    unlockedPuMaterials,
    activePuMaterialResearch,
    startPuMaterialResearch,
    motorHomologadoFIA,
    rdFacilityCapacity,
    trackFeedbackLog,
    upgradeTimeline,
    puDevPoints,
    investPuDevPoints
  } = useGame();

  // Selected CAD Component type
  const [selectedType, setSelectedType] = useState<ComponentSpec['type']>('pu');

  // Simulation panel sub-tab & dirty tracker
  const [engineeringViewMode, setEngineeringViewMode] = useState<'cad' | 'showroom3d' | 'workbench'>('cad');
  const [showroomTeamId, setShowroomTeamId] = useState<string>(playerTeam?.id || 'player_car');

  useEffect(() => {
    if (playerTeam?.id && (showroomTeamId === 'player_car' || showroomTeamId === 'apex')) {
      setShowroomTeamId(playerTeam.id);
    }
  }, [playerTeam?.id]);
  const [simSubTab, setSimSubTab] = useState<SimSubTab>('correlation');
  const [lastSimulatedSnapshot, setLastSimulatedSnapshot] = useState<string>('');
  const [showBriefingModal, setShowBriefingModal] = useState<boolean>(false);
  const [showCatalogModal, setShowCatalogModal] = useState<boolean>(false);
  const [catalogDisciplineFilter, setCatalogDisciplineFilter] = useState<string>('ALL');
  const [showPuCellChem, setShowPuCellChem] = useState<boolean>(false);
  const [showPuBomDrawer, setShowPuBomDrawer] = useState<boolean>(false);
  const [showFeedbackInbox, setShowFeedbackInbox] = useState<boolean>(false);
  const [researchFeedback, setResearchFeedback] = useState<string | null>(null);

  // Wind Tunnel / Multi-Physics testing state
  const [testAtrHours, setTestAtrHours] = useState<number>(40);
  const [windTunnelResult, setWindTunnelResult] = useState<{
    expectedDownforce: number;
    expectedDrag: number;
    baseCorrelationError?: number;
    modificadorErroCorrelacao?: number;
    correlationError: number;
    porpoisingRisk: number;
  } | null>(null);

  // ADUO Assembly Bench Modal & Performance Sliders State
  const [showAduoBenchModal, setShowAduoBenchModal] = useState<boolean>(false);
  const [aduoIceEficPot, setAduoIceEficPot] = useState<number>(65);
  const [aduoIceBloco, setAduoIceBloco] = useState<number>(60);
  const [aduoIceTurbo, setAduoIceTurbo] = useState<number>(70);
  const [aduoIceTorque, setAduoIceTorque] = useState<number>(60);
  const [aduoIceCombustivel, setAduoIceCombustivel] = useState<number>(65);
  const [aduoErsSoftware, setAduoErsSoftware] = useState<number>(70);
  const [aduoErsAntiClipping, setAduoErsAntiClipping] = useState<number>(65);

  const pwrGain = Math.max(
    1,
    Math.min(
      8,
      Math.round(
        (aduoIceEficPot - 50) * 0.05 +
          (aduoIceTurbo - 50) * 0.04 +
          (aduoIceBloco - 50) * 0.03 +
          (aduoIceCombustivel - 50) * 0.02 +
          (aduoErsSoftware - 50) * 0.03 +
          (aduoErsAntiClipping - 50) * 0.03 +
          3
      )
    )
  );
  const projectedPwr = Math.min(100, aduoPlayerPwr + pwrGain);
  const projectedGap = Math.max(0, Number((((aduoBenchmarkPwr - projectedPwr) / aduoBenchmarkPwr) * 100).toFixed(1)));

  // Sequential CAD Pipeline Order (2026 Regulations)
  const pipelineOrder: { type: ComponentSpec['type']; label: string; step: number; desc: string }[] = [
    { type: 'pu', label: '1. Power Unit (ICE + ERS)', step: 1, desc: '50/50 350kW, compressão, turbo & perdas I²R' },
    { type: 'gearbox', label: '2. Câmbio / Transmissão', step: 2, desc: 'Carcaça, engrenamento, óleo & passagem do difusor' },
    { type: 'chassis', label: '3. Chassi / Monocoque', step: 3, desc: 'Laminado anisotrópico 0°/±45°/90°, flambagem & massa' },
    { type: 'suspension', label: '4. Suspensão / Cinemática', step: 4, desc: 'Push/Pull-rod, cambagem, anti-dive/squat & pneus' },
    { type: 'floor', label: '5. Assoalho & Sidepods', step: 5, desc: 'Assoalho plano 2026, difusor 6°-14° & radiadores ε-NTU' },
    { type: 'wings', label: '6. Asas Ativas (Mode X/Z)', step: 6, desc: 'Atuação coordenada Modo Z (Curva) ↔ Modo X (Reta)' }
  ];

  const currentComp = components.find(c => c.type === selectedType);

  const currentParamsKey = useMemo(() => JSON.stringify(vehicleParams), [vehicleParams]);
  const isSimulationStale = !lastSimulationReport || lastSimulatedSnapshot !== currentParamsKey;

  const regulatoryLive = useMemo(
    () =>
      validateFia2026Compliance(vehicleParams, {
        totalMassKg: vehiclePhysics.totalMassKg,
        effectiveMgukPowerKw: vehiclePhysics.effectiveMgukPowerKw
      }),
    [vehicleParams, vehiclePhysics.totalMassKg, vehiclePhysics.effectiveMgukPowerKw]
  );

  const livePackaging = useMemo(
    () => buildPackagingArchitecture(vehicleParams, FIA_2026_DEFAULT_EDITION),
    [vehicleParams]
  );

  const paretoSolutions = useMemo(() => {
    const levelAvg = components.reduce((acc, c) => acc + c.level, 0) / Math.max(1, components.length);
    return computeMdoParetoSolutions(vehicleParams, { componentLevelAvg: levelAvg });
  }, [vehicleParams, components]);

  // Cost & Lead time per CAD module derived from physical choices
  const prototypeSpec = useMemo(() => {
    let cost = 6000000;
    let leadWeeks = 8;

    if (selectedType === 'pu') {
      const iceSpec = ICE_METALLURGY_2026[resolveIceMetallurgyId(vehicleParams.iceMetallurgyId, vehicleParams.iceMaterial)];
      const batSpec = BATTERY_ARCHITECTURES_2026[resolveBatteryArchitectureId(vehicleParams.batteryCellTech)];
      cost = iceSpec.costUsd + batSpec.costDeltaUsd;
      leadWeeks = 12;
    } else if (selectedType === 'gearbox') {
      cost =
        vehicleParams.gearboxMaterial === 'carbon'
          ? 7800000
          : vehicleParams.gearboxMaterial === 'titanium'
          ? 7000000
          : 5400000;
      leadWeeks = vehicleParams.gearboxLayout === 'compact' ? 8 : 6;
    } else if (selectedType === 'chassis') {
      const matCost = COMPOSITE_MATERIALS[vehicleParams.compositeFiber].costPerKgUsd;
      cost = Math.round(5800000 + (matCost - 420) * 4500 + vehicleParams.localReinforcementPct * 25000);
      leadWeeks = 9;
    } else if (selectedType === 'suspension') {
      cost = 5200000;
      leadWeeks = 6;
    } else if (selectedType === 'floor') {
      cost = Math.round(6800000 + vehicleParams.floorEdgeComplexity * 18000);
      leadWeeks = 8;
    } else if (selectedType === 'wings') {
      cost = Math.round(5900000 + vehicleParams.wingStructuralStiffnessPct * 12000);
      leadWeeks = 7;
    }

    const performance =
      selectedType === 'pu'
        ? Math.min(99, Math.round((vehiclePhysics.totalWheelPowerKw / 760) * 88))
        : selectedType === 'floor' || selectedType === 'wings'
        ? vehiclePhysics.summary.aeroScore
        : selectedType === 'suspension'
        ? vehiclePhysics.summary.cornerGripScore
        : vehiclePhysics.summary.carRating;

    return {
      performance,
      reliability: vehiclePhysics.summary.reliabilityScore,
      downforce: vehiclePhysics.summary.downforcePoints,
      drag: vehiclePhysics.summary.dragCoefficient,
      weight: Math.round(vehiclePhysics.totalMassKg),
      porpoising: vehiclePhysics.porpoisingRiskPct,
      cost,
      leadWeeks
    };
  }, [selectedType, vehicleParams, vehiclePhysics]);

  const isMaxLevel = (currentComp?.level || 1) >= (currentComp?.maxLevel || 10);
  const activeDevComps = components.filter(c => c.inDevelopment);
  const activeMfgCount = activeDevComps.length;
  const activeAeroCount = activeDevComps.filter(c => c.type === 'floor' || c.type === 'wings').length;
  const isSelectedAlreadyDeveloping = Boolean(currentComp?.inDevelopment);
  const mfgSlotsFull =
    !isSelectedAlreadyDeveloping && activeMfgCount >= rdFacilityCapacity.manufacturingMaxSlots;
  const aeroSlotsFull =
    !isSelectedAlreadyDeveloping &&
    (selectedType === 'floor' || selectedType === 'wings') &&
    activeAeroCount >= rdFacilityCapacity.aeroMaxSlots;
  const cannotLaunchCad = isMaxLevel || mfgSlotsFull || aeroSlotsFull;

  const leadDriver = useMemo(
    () =>
      drivers.find(d => playerTeam?.drivers?.includes(d.id)) ||
      drivers.find(d => d.teamId === playerTeam?.id && !d.isAffiliate),
    [drivers, playerTeam]
  );

  const chiefFeedback = useMemo(
    () =>
      evaluateChiefCadFeedback({
        selectedType,
        vehicleParams,
        vehiclePhysics,
        philosophy: playerTeam?.filosofiaAtual,
        regulatory: regulatoryLive,
        staff,
        teamName: playerTeam?.name,
        playerChiefName: playerTeam?.headOfPowerUnit,
      }),
    [selectedType, vehicleParams, vehiclePhysics, playerTeam?.filosofiaAtual, playerTeam?.name, playerTeam?.headOfPowerUnit, regulatoryLive, staff]
  );

  const hasIndaiatubaBonus = Boolean(
    playerTeam?.location?.includes('Indaiatuba') ||
    playerTeam?.location?.includes('Brasil') ||
    playerTeam?.location?.includes('Brazil')
  );

  const effectiveFeedback = useMemo(() => {
    const base = leadDriver?.attributes?.feedback ?? 78;
    return Math.min(99, Math.round(base * (hasIndaiatubaBonus ? 1.10 : 1.0)));
  }, [leadDriver?.attributes?.feedback, hasIndaiatubaBonus]);

  const isAeroStallRisk = useMemo(() => {
    return (
      vehiclePhysics.porpoisingRiskPct > 45 ||
      (vehicleParams.frontRideHeightMm <= 22 && vehicleParams.springRateNmm < 235)
    );
  }, [vehiclePhysics.porpoisingRiskPct, vehicleParams.frontRideHeightMm, vehicleParams.springRateNmm]);

  const driverTracksideQuote = useMemo(() => {
    const dName = leadDriver?.name || 'Piloto Titular';
    const sharp = effectiveFeedback >= 80;

    if (selectedType === 'pu') {
      if (vehicleParams.iceCompressionRatio >= 15.5) {
        return sharp
          ? `Rádio (${dName}): "Chefe, o motor está empurrando forte nas retas, mas sinto corte de potência elétrica no final do setor 3. O software deve estar reduzindo o ERS por calor na bateria."`
          : `Rádio (${dName}): "O motor tem força, mas às vezes parece que a bateria acaba antes da reta principal."`;
      }
      return sharp
        ? `Rádio (${dName}): "Entrega de potência progressiva e linear. O turbo responde rápido nas saídas de 2ª e 3ª marcha."`
        : `Rádio (${dName}): "O motor parece bom, sem falhas perceptíveis."`;
    }

    if (selectedType === 'wings') {
      if (vehicleParams.frontWingFlapCornerDeg > 33) {
        return sharp
          ? `Rádio (${dName}): "A asa dianteira a ${vehicleParams.frontWingFlapCornerDeg}° dá muita mordida de frente, mas sinto arrasto excessivo nas retas (+0.3s). Se baixarmos 1.5°, equilibramos o tempo de volta."`
          : `Rádio (${dName}): "O carro faz curva bem, mas sinto que fica preso nas retas."`;
      }
      if (vehicleParams.frontWingFlapCornerDeg < 27) {
        return `Rádio (${dName}): "A frente está escorregando (subesterço) na entrada das curvas rápidas. Precisamos de mais carga aerodinâmica dianteira."`;
      }
      return `Rádio (${dName}): "Balanço aerodinâmico muito neutro. Consigo confiar na frente sem perder velocidade final."`;
    }

    if (selectedType === 'suspension') {
      if (vehicleParams.springRateNmm > 250) {
        return sharp
          ? `Rádio (${dName}): "A suspensão está dura demais sobre as zebras de saída (${vehicleParams.springRateNmm} N/mm)! As rodas perdem contato, destraciono e a traseira chicoteia."`
          : `Rádio (${dName}): "O carro pula muito nas zebras, não consigo acelerar cedo."`;
      }
      if (vehicleParams.springRateNmm < 220) {
        return `Rádio (${dName}): "A suspensão está mole demais. O chassi rola muito nas mudanças rápidas de direção e demora para responder."`;
      }
      return `Rádio (${dName}): "Suspensão na medida certa: absorve bem as irregularidades do asfalto e mantém a plataforma estável."`;
    }

    if (selectedType === 'floor') {
      if (isAeroStallRisk) {
        return sharp
          ? `Rádio (${dName}): "O assoalho está raspando com violência no asfalto! O carro quica, a traseira solta de repente e perco todo o efeito solo nas curvas de alta."`
          : `Rádio (${dName}): "O carro tá batendo no chão e dando medo de acelerar nas retas."`;
      }
      return `Rádio (${dName}): "O efeito solo está funcionando com estabilidade. Sinto a sucção puxando o carro para o chão nas curvas rápidas."`;
    }

    return `Rádio (${dName}): "A rigidez torsional do monocoque transmite com clareza o que os quatro pneus estão fazendo no asfalto."`;
  }, [leadDriver?.name, effectiveFeedback, selectedType, vehicleParams, isAeroStallRisk]);

  const effectiveCost =
    phoenixDiscountH1 && selectedType === 'pu' ? Math.round(prototypeSpec.cost * 0.5) : prototypeSpec.cost;

  const handleLaunchProject = () => {
    if (cannotLaunchCad) return;

    const newSpec: ComponentSpec = {
      id: `comp_${selectedType}_${Date.now()}`,
      name: `${playerTeam?.shortName || 'APX'} Mk-${(currentComp?.level || 1) + 1} 2026 ${selectedType.toUpperCase()}`,
      type: selectedType,
      level: currentComp?.level || 1,
      maxLevel: 10,
      performance: prototypeSpec.performance,
      reliability: prototypeSpec.reliability,
      weightKg: prototypeSpec.weight,
      dragCoefficient: prototypeSpec.drag,
      downforce: prototypeSpec.downforce,
      coolingEfficiency: Math.max(40, Math.min(100, Math.round(70 + vehiclePhysics.thermalMarginC * 1.5))),
      porpoisingRisk: prototypeSpec.porpoising,
      thermalCompatibility: Math.max(40, Math.min(100, Math.round(80 + vehiclePhysics.thermalMarginC * 1.2))),
      cost: effectiveCost,
      costCapImpact: effectiveCost,
      designWeeks: prototypeSpec.leadWeeks,
      atrHoursCost: chiefFeedback.atrHoursCost,
      chiefId: chiefFeedback.chiefId,
      chiefAdviceFollowed: chiefFeedback.status === 'aligned',
    };

    startComponentDevelopment(newSpec, {
      atrHoursCost: chiefFeedback.atrHoursCost,
      chiefId: chiefFeedback.chiefId,
      chiefName: chiefFeedback.chiefName,
      adviceFollowed: chiefFeedback.status === 'aligned',
    });
  };

  const handleRunWindTunnel = () => {
    if (financials.atrWindTunnelHoursAvailable < testAtrHours) return;
    const res = runWindTunnelTest(selectedType, testAtrHours);
    setWindTunnelResult(res);
    setLastSimulatedSnapshot(currentParamsKey);
  };

  // Laminate ply balancer helper so 0° + ±45° + 90° always remain interpretable
  const plySum = vehicleParams.layupPlyZeroPct + vehicleParams.layupPly45Pct + vehicleParams.layupPly90Pct;
  const normZero = Math.round((vehicleParams.layupPlyZeroPct / Math.max(1, plySum)) * 100);
  const norm45 = Math.round((vehicleParams.layupPly45Pct / Math.max(1, plySum)) * 100);
  const norm90 = Math.max(0, 100 - normZero - norm45);

  const filteredPhenomena = useMemo(() => {
    if (catalogDisciplineFilter === 'ALL') return PHYSICS_PHENOMENA_CATALOG;
    return PHYSICS_PHENOMENA_CATALOG.filter(p => p.discipline === catalogDisciplineFilter);
  }, [catalogDisciplineFilter]);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1C1C26] border border-white/10 p-4 f1-pattern-micro-grid">
        <div>
          <span className="text-[10px] font-f1-mono text-[#E10600] font-bold tracking-widest uppercase">
            {t.cadPipeline} · SI MULTI-PHYSICS 2026
          </span>
          <h1 className="font-f1-wide font-black text-xl lg:text-2xl text-white uppercase mt-0.5">
            {t.vehicleDynamics}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {t.cadSubtitle} · Massa Total: <strong className="text-white">{vehiclePhysics.totalMassKg} kg</strong> · L/D Modo Z: <strong className="text-emerald-400">{vehiclePhysics.cornerMode.aeroEfficiencyLD}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowBriefingModal(true)}
            className="px-3 py-2 bg-[#15151E] hover:bg-white/5 border border-white/15 text-xs font-f1-mono text-zinc-200 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-[#E10600]" />
            <span>Briefing 7 Especialistas</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCatalogModal(true)}
            className="px-3 py-2 bg-[#15151E] hover:bg-white/5 border border-white/15 text-xs font-f1-mono text-zinc-200 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Catálogo Físico ({PHYSICS_PHENOMENA_CATALOG.length})</span>
          </button>

          <div className="bg-[#15151E] px-3 py-2 border border-white/5 text-right">
            <span className="text-[10px] font-f1-mono text-zinc-400 block">{t.atrTunnel}</span>
            <span className="text-sm font-f1-mono font-bold text-white tabular-nums">
              {financials.atrWindTunnelHoursAvailable} {language === 'pt' ? 'HORAS RESTANTES' : 'HOURS REMAINING'}
            </span>
          </div>
        </div>
      </div>

      {/* Mode Switcher: CAD & Wind Tunnel vs M01–M12 Scientific Workbench & 3D */}
      <div className="flex flex-wrap items-center gap-2 bg-[#15151E] border border-white/10 p-2">
        <button
          type="button"
          onClick={() => setEngineeringViewMode('cad')}
          className={`px-4 py-2 text-xs font-f1-wide uppercase tracking-wider border transition-colors cursor-pointer ${
            engineeringViewMode === 'cad'
              ? 'bg-[#E10600] border-[#E10600] text-white font-bold'
              : 'bg-[#1C1C26] border-white/10 text-zinc-300 hover:text-white'
          }`}
        >
          Bancada CAD, ADUO & Túnel ATR
        </button>
        <button
          type="button"
          onClick={() => setEngineeringViewMode('showroom3d')}
          className={`px-4 py-2 text-xs font-f1-wide uppercase tracking-wider border transition-colors cursor-pointer ${
            engineeringViewMode === 'showroom3d'
              ? 'bg-[#E10600] border-[#E10600] text-white font-bold'
              : 'bg-[#1C1C26] border-white/10 text-zinc-300 hover:text-white'
          }`}
        >
          Showroom 3D F1 2026 (Grid Completo)
        </button>
        <button
          type="button"
          onClick={() => setEngineeringViewMode('workbench')}
          className={`px-4 py-2 text-xs font-f1-wide uppercase tracking-wider border transition-colors cursor-pointer ${
            engineeringViewMode === 'workbench'
              ? 'bg-[#E10600] border-[#E10600] text-white font-bold'
              : 'bg-[#1C1C26] border-white/10 text-zinc-300 hover:text-white'
          }`}
        >
          M01–M12 Engenharia SI · Packaging 3D & Gates (01–12)
        </button>
      </div>

      {engineeringViewMode === 'workbench' ? (
        <ModulesAuditConsole />
      ) : engineeringViewMode === 'showroom3d' ? (
        <div className="space-y-4">
          <F1TabBucket
            title="SHOWROOM 3D F1 2026 · MONOPOSTO ATIVO & GRID OFICIAL"
            badge="AERO ATIVA X/Z · PBR"
          >
            <div className="space-y-4">
              <Packaging3DViewport
                packaging={livePackaging}
                vehicleParams={vehicleParams}
                playerTeam={playerTeam}
                allTeams={allTeams}
                drivers={drivers}
                defaultVisualMode="showroom"
                selectedTeamIdOverride={showroomTeamId}
                onSelectTeamId={setShowroomTeamId}
                heightClass="h-[540px]"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 text-[11px] font-f1-mono">
                <button
                  type="button"
                  onClick={() => setShowroomTeamId('player_car')}
                  className={`text-left bg-[#15151E] border p-3 space-y-1 cursor-pointer transition-colors ${
                    showroomTeamId === 'player_car' || showroomTeamId === playerTeam?.id
                      ? 'border-[#E10600] bg-[#E10600]/10'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 border border-white/30 shrink-0"
                        style={{ backgroundColor: playerTeam?.color || '#E10600' }}
                      />
                      <span className="font-f1-wide font-bold text-white uppercase truncate">
                        {playerTeam?.carModelName || 'APEX-26'} · Meu Carro
                      </span>
                    </div>
                    <span className="text-[10px] text-[#E10600] font-bold shrink-0">
                      {playerTeam?.shortName || 'APX'}
                    </span>
                  </div>
                  <div className="text-zinc-200 font-bold">{playerTeam?.name || 'APEX Grand Prix Team'}</div>
                  <div className="text-[10px] text-cyan-300">PU {playerTeam?.engineSupplier || 'In-House'}</div>
                  <div className="text-[10px] text-zinc-400">
                    Monoposto da sua escuderia com geometria e parâmetros CAD ao vivo.
                  </div>
                </button>
                {LIVERY_2026_CATALOG.map((car) => {
                  const isPlayerTeam = Boolean(playerTeam?.id && playerTeam.id === car.teamId);
                  const isActive = showroomTeamId === car.teamId;
                  const displayChassis = isPlayerTeam
                    ? (playerTeam?.carModelName || car.carModelName)
                    : car.carModelName;
                  const displayColor = isPlayerTeam
                    ? (playerTeam?.color || car.primaryHex)
                    : car.primaryHex;
                  return (
                    <button
                      key={car.teamId}
                      type="button"
                      onClick={() => setShowroomTeamId(car.teamId)}
                      className={`text-left bg-[#15151E] border p-3 space-y-1 cursor-pointer transition-colors ${
                        isActive
                          ? 'border-white bg-[#232433]'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-3 h-3 border border-white/30 shrink-0"
                            style={{ backgroundColor: displayColor }}
                          />
                          <span className="font-f1-wide font-bold text-white uppercase truncate">
                            {displayChassis}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400 shrink-0">
                          {isPlayerTeam ? `${playerTeam?.shortName || car.shortName} · VOCÊ` : car.shortName}
                        </span>
                      </div>
                      <div className="text-zinc-200 font-bold">{car.driversSummary}</div>
                      <div className="text-[10px] text-cyan-300">{car.engineBadge}</div>
                      <div className="text-[10px] text-zinc-400">{car.visualNotes}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </F1TabBucket>
        </div>
      ) : (
        <>
      {/* SEÇÃO REGULAMENTAR ADUO */}
      <div
        className={`p-4 border f1-container-bucket transition-all ${
          aduoWindowActive
            ? 'bg-[#1C1C26] border-amber-500/70 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
            : 'bg-[#15151E] border-white/10'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${aduoWindowActive ? 'bg-amber-400 animate-ping' : 'bg-zinc-600'}`} />
              <span className="font-f1-mono text-[10px] text-amber-400 font-bold uppercase tracking-widest">
                REGULAMENTO TÉCNICO FIA 2026 · MECANISMO ADUO
              </span>
              <span
                className={`text-[9px] font-f1-mono px-2 py-0.5 border font-bold uppercase ${
                  aduoWindowActive
                    ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                }`}
              >
                {aduoWindowActive ? `JANELA ABERTA (${aduoWeeksRemaining} SEMANAS)` : 'CONGELAMENTO ATIVO'}
              </span>
            </div>

            <h3 className="font-f1-wide font-black text-sm sm:text-base text-white uppercase tracking-wider flex items-center gap-2">
              <span>OPORTUNIDADE DE DESENVOLVIMENTO DE PU (ADUO)</span>
              <span className="text-xs font-f1-mono text-zinc-400 font-normal">
                (Gatilhos: Pós-GP 5, GP 11 e GP 18 · Rodada Atual: GP {currentCircuitIndex + 1})
              </span>
            </h3>

            <p className="text-xs font-f1-mono text-zinc-300 leading-relaxed max-w-3xl">
              Motor Atual: <strong className="text-white">{aduoPlayerPwr} PWR</strong> · Benchmark (Red Bull-Ford):{' '}
              <strong className="text-amber-400">{aduoBenchmarkPwr} PWR</strong> · Déficit de Potência:{' '}
              <strong className={aduoLastGapPercent >= 2 ? 'text-amber-400' : 'text-emerald-400'}>{aduoLastGapPercent}%</strong>.
              {aduoWindowActive ? (
                <span className="text-amber-300 block mt-0.5 font-bold">
                  ✓ {aduoHomologationQuotas} Cota(s) de Homologação disponível(is) para aplicação na Bancada de Montagem.
                </span>
              ) : (
                <span className="text-zinc-400 block mt-0.5">
                  A Bancada de Montagem de motor fica congelada durante a temporada regular, sendo liberada pela FIA apenas se o motor estiver com defasagem ≥2% em uma avaliação ADUO.
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end gap-2 shrink-0">
            {aduoWindowActive && aduoHomologationQuotas > 0 ? (
              <button
                type="button"
                onClick={() => setShowAduoBenchModal(true)}
                className="px-5 py-3 bg-[#E10600] hover:bg-[#B30500] border border-red-400 text-white font-f1-wide font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <Wrench className="w-4 h-4" />
                <span>ABRIR BANCADA DE MONTAGEM ({aduoHomologationQuotas} COTAS)</span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="px-4 py-2.5 bg-zinc-900 border border-zinc-700 text-zinc-500 font-f1-wide font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-not-allowed opacity-75"
                title="Bancada de motor bloqueada pela FIA fora das janelas ADUO"
              >
                <Lock className="w-4 h-4 text-zinc-500" />
                <span>BANCADA DE MONTAGEM (CONGELADA PELA FIA)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => avaliarADUO()}
              className="text-[10px] font-f1-mono text-zinc-400 hover:text-white underline underline-offset-2 transition-colors self-center lg:self-end cursor-pointer"
            >
              Auditoria ADUO FIA
            </button>
          </div>
        </div>
      </div>

      {/* Grade de Slots de P&D & Eficiência das Instalações */}
      <div className="bg-[#1C1C26] border border-white/10 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-f1-mono text-cyan-400 font-bold uppercase tracking-widest block">
              Capacidade de Manufatura & Túnel de Vento
            </span>
            <h2 className="font-f1-wide font-bold text-xs sm:text-sm text-white uppercase">
              Grade de Slots de P&D ({playerTeam.carModelName || 'APX-01'})
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] font-f1-mono tabular-nums">
            <div className="bg-[#15151E] border border-white/10 px-2.5 py-1">
              Fábrica Nv.{rdFacilityCapacity.manufacturingLevel}:{' '}
              <span className={activeMfgCount >= rdFacilityCapacity.manufacturingMaxSlots ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                {activeMfgCount}/{rdFacilityCapacity.manufacturingMaxSlots} slots
              </span>
            </div>
            <div className="bg-[#15151E] border border-white/10 px-2.5 py-1">
              Túnel Nv.{rdFacilityCapacity.windTunnelLevel}:{' '}
              <span className={activeAeroCount >= rdFacilityCapacity.aeroMaxSlots ? 'text-amber-400 font-bold' : 'text-cyan-300 font-bold'}>
                {activeAeroCount}/{rdFacilityCapacity.aeroMaxSlots} aero
              </span>
              {rdFacilityCapacity.aeroEfficiencyBonusPct > 0 && (
                <span className="text-emerald-400 font-bold ml-1.5">
                  (+{rdFacilityCapacity.aeroEfficiencyBonusPct}% DF)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {Array.from({ length: rdFacilityCapacity.manufacturingMaxSlots }).map((_, slotIdx) => {
            const devComp = activeDevComps[slotIdx];
            if (!devComp) {
              return (
                <div
                  key={`slot_empty_${slotIdx}`}
                  className="bg-[#15151E] border border-dashed border-white/15 p-2.5 flex items-center justify-between text-[11px] font-f1-mono text-zinc-500"
                >
                  <span>SLOT #{slotIdx + 1} · LIVRE</span>
                  <span className="text-[10px] uppercase">Pronto para CAD</span>
                </div>
              );
            }
            const totalW = Math.max(1, devComp.designWeeks || 4);
            const leftW = Math.max(0, devComp.developmentWeeksLeft || 0);
            const pct = Math.min(100, Math.max(8, Math.round(((totalW - leftW) / totalW) * 100)));
            return (
              <div
                key={`slot_active_${devComp.id}`}
                className="bg-[#15151E] border border-[#E10600]/50 p-2.5 space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px] font-f1-mono">
                  <span className="text-white font-bold uppercase truncate">{devComp.type} · MK{(devComp.level || 1) + 1}</span>
                  <span className="text-[#E10600] font-bold tabular-nums">{leftW} sem</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-[#E10600]" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6-Step Sequential CAD Pipeline Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {pipelineOrder.map(item => {
          const isSelected = selectedType === item.type;
          const comp = components.find(c => c.type === item.type);
          const isDeveloping = comp?.inDevelopment;

          return (
            <button
              key={item.type}
              type="button"
              onClick={() => {
                setSelectedType(item.type);
              }}
              className={`p-3 text-left border transition-all relative cursor-pointer ${
                isSelected
                  ? 'bg-[#232330] border-[#E10600] shadow-md'
                  : 'bg-[#1C1C26] border-white/10 hover:border-white/20'
              }`}
            >
              {isSelected && <span className="absolute top-0 left-0 right-0 h-[2px] bg-[#E10600]" />}

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-f1-mono text-zinc-400">STEP 0{item.step}</span>
                {isDeveloping ? (
                  <span className="text-[9px] font-f1-mono bg-[#E10600] text-white px-1 font-bold">
                    DEV ({comp?.developmentWeeksLeft}w)
                  </span>
                ) : (
                  <span className="text-[9px] font-f1-mono text-emerald-400 font-bold">MK {comp?.level || 1}</span>
                )}
              </div>

              <div className="font-f1-wide font-bold text-xs uppercase text-white mt-1 truncate">
                {item.label.split('.')[1]}
              </div>

              <div className="text-[10px] font-f1-mono text-zinc-400 mt-1">
                Perf: <span className="text-white font-bold">{comp?.performance || 80}</span> · Rel:{' '}
                <span className="text-white font-bold">{comp?.reliability || 85}%</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Engineering Workstation Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: CAD Parameters & Physical Foundation Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <F1TabBucket
            title={
              selectedType === 'pu'
                ? `CAD DESIGN SUITE: ${chiefFeedback.chiefName.toUpperCase()} (PU)`
                : `CAD DESIGN SUITE: ${chiefFeedback.chiefName.toUpperCase()} (${chiefFeedback.sectorLabel})`
            }
            badge={isSimulationStale ? 'PARÂMETROS EDITADOS' : 'SIMULADO EM BANCADA'}
          >
            <div className="space-y-4">
              {/* ⚠️ ALERTA DE ESTOL AERODINÂMICO & BOTTOMING OUT (IF-M04-M05) */}
              {isAeroStallRisk && (
                <div className="bg-red-950/80 border-2 border-red-500 p-4 space-y-2 f1-container-roof shadow-[0_0_25px_rgba(239,68,68,0.25)]">
                  <div className="flex items-center justify-between gap-2 border-b border-red-500/30 pb-2">
                    <div className="flex items-center gap-2 text-red-400 font-f1-wide font-black text-xs uppercase tracking-wider">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>⚠️ ALERTA CRÍTICO: ESTOL AERODINÂMICO & BOTTOMING OUT (IF-M04-M05)</span>
                    </div>
                    <span className="text-[10px] font-f1-mono text-red-300 bg-red-900/60 px-2 py-0.5 border border-red-500/40 font-bold uppercase">
                      PORPOISING {vehiclePhysics.porpoisingRiskPct.toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs font-f1-mono text-red-200 leading-relaxed">
                    Cuidado, Chefe! O carro está arrastando no asfalto e perdendo downforce nas curvas de alta! A suspensão macia ({vehicleParams.springRateNmm} N/mm) não sustenta a altura de rodagem dianteira ({vehicleParams.frontRideHeightMm}mm) sob a carga aerodinâmica de {Math.round(vehiclePhysics.cornerMode.downforceTotalN)}N. O efeito solo do assoalho estola (-40% downforce nas zebras) e o piloto perderá estabilidade.
                  </p>
                  <div className="bg-black/60 p-2.5 border border-red-500/30 text-[11px] font-f1-mono text-zinc-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span>
                      💡 <span className="text-amber-300 font-bold">Solução de Engenharia:</span> Enrijeça as molas para pelo menos 245 N/mm ou eleve a altura de rodagem dianteira para +26mm.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        updateVehicleParams({
                          springRateNmm: Math.max(vehicleParams.springRateNmm, 245),
                          frontRideHeightMm: Math.max(vehicleParams.frontRideHeightMm, 26)
                        });
                      }}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-f1-mono text-[10px] font-bold uppercase shrink-0 transition-all cursor-pointer"
                    >
                      Corrigir Automaticamente
                    </button>
                  </div>
                </div>
              )}

              {/* Speech Balloon Interativo do Chefe de PU (Gabriel Santos) */}
              {selectedType === 'pu' && (
                <div className="bg-[#15151E] border-2 border-emerald-500/40 p-4 f1-container-roof flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl relative overflow-hidden">
                  <div className="flex items-start gap-3.5">
                    <PersonAvatar
                      name={chiefFeedback.chiefName}
                      role="head_pu"
                      sizeClass="w-12 h-12"
                      accentColor="#10B981"
                    />
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-f1-wide font-black text-xs text-white uppercase tracking-wider">
                          {chiefFeedback.chiefName} · CHEFE DE MOTORES & TRANSMISSÃO
                        </span>
                        <span className="text-[9px] font-f1-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 border border-emerald-500/40 font-bold uppercase">
                          FEEDBACK TÉCNICO DE PU
                        </span>
                      </div>
                      <p className="text-xs font-f1-mono text-zinc-200 leading-relaxed italic">
                        "{chiefFeedback.quote || 'Chefe, se aumentarmos a compressão para 15.5:1, ganhamos potência, mas o motor vai esquentar e vamos precisar abrir os sidepods.'}"
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Painel de Potencial de Evolução do Motor */}
              {selectedType === 'pu' && (() => {
                const puComp = components.find(c => c.type === 'pu');
                const puPot = Math.round(puComp?.performance ?? 82);
                const puRel = Math.round(puComp?.reliability ?? 85);
                const puCeiling = Math.round(playerTeam?.puDevelopmentCeilingPct ?? 92);
                const puLabel = playerTeam?.engineCustomName || playerTeam?.engineSupplier || 'Works 2026';

                return (
                <div className="bg-[#171722] border border-white/10 p-3.5 space-y-3 f1-container-roof">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                    <span className="text-xs font-f1-wide font-bold text-white uppercase flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-cyan-400" />
                      PAINEL DE POTENCIAL DE EVOLUÇÃO DO MOTOR (PU)
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-f1-mono px-2 py-0.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold tabular-nums">
                        PONTOS DE DESENVOLVIMENTO: {puDevPoints}
                      </span>
                      <span className="text-[10px] font-f1-mono text-cyan-400 font-bold">
                        {puLabel.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-f1-mono">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-zinc-400">Potencial Atual ({puRel}% Conf.):</span>
                        <span className="text-emerald-400 font-bold tabular-nums">{puPot} / 100</span>
                      </div>
                      <div className="w-full bg-black/60 h-2 border border-white/10 overflow-hidden">
                        <div className="bg-emerald-400 h-full" style={{ width: `${Math.min(100, puPot)}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-zinc-400">Teto FIA / Arquitetura:</span>
                        <span className="text-amber-400 font-bold tabular-nums">{puCeiling} / 100</span>
                      </div>
                      <div className="w-full bg-black/60 h-2 border border-white/10 overflow-hidden">
                        <div className="bg-amber-400 h-full" style={{ width: `${Math.min(100, puCeiling)}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <p className="text-[11px] font-f1-mono text-zinc-400 italic flex-1 min-w-[220px]">
                      "Chefe, nossa arquitetura {puLabel} opera a {puPot}/100 (teto {puCeiling}/100). Conclua GPs limpos para acumular Pontos de Desenvolvimento e evoluir potência ou confiabilidade." — {chiefFeedback.chiefName}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={puDevPoints < 1 || puPot >= puCeiling}
                        onClick={() => investPuDevPoints('power')}
                        className="px-2.5 py-1 bg-[#E10600] hover:bg-[#c20500] disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-f1-mono text-[10px] font-bold uppercase cursor-pointer disabled:cursor-not-allowed"
                      >
                        +2 Potência (1 Pt)
                      </button>
                      <button
                        type="button"
                        disabled={puDevPoints < 1 || puRel >= 99}
                        onClick={() => investPuDevPoints('reliability')}
                        className="px-2.5 py-1 bg-cyan-700 hover:bg-cyan-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-f1-mono text-[10px] font-bold uppercase cursor-pointer disabled:cursor-not-allowed"
                      >
                        +3% Conf. (1 Pt)
                      </button>
                    </div>
                  </div>
                </div>
                );
              })()}

              {/* 🏎️ FEEDBACK DE PISTA & TELEMETRIA DO PILOTO + CAIXA HISTÓRICA */}
              {leadDriver && (
                <div className="bg-[#15151E] border border-cyan-500/40 p-3.5 space-y-2.5 f1-container-roof">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2.5">
                      <PersonAvatar
                        name={leadDriver.name}
                        role="driver"
                        sizeClass="w-8 h-8"
                        accentColor="#06B6D4"
                      />
                      <div>
                        <span className="font-f1-wide font-black text-xs text-white uppercase block">
                          {leadDriver.name} · FEEDBACK DE PISTA
                        </span>
                        <span className="text-[10px] font-f1-mono text-zinc-400">
                          Sensor Humano da Equipe
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="bg-black/60 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-f1-mono">
                        <span className="text-zinc-400">Precisão Técnica: </span>
                        <span className="text-cyan-400 font-bold tabular-nums">
                          {effectiveFeedback}/99
                        </span>
                        {hasIndaiatubaBonus && (
                          <span className="text-emerald-400 font-bold ml-1" title="Bônus da Sede Indaiatuba (+10%)">
                            (+10% 🇧🇷)
                          </span>
                        )}
                      </div>
                      <span className={`text-[9px] font-f1-mono px-2 py-0.5 font-bold uppercase ${
                        effectiveFeedback >= 85
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : effectiveFeedback >= 75
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {effectiveFeedback >= 85 ? 'PRECISÃO CIRÚRGICA' : effectiveFeedback >= 75 ? 'PRECISO' : 'INTERMEDIÁRIO'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowFeedbackInbox(prev => !prev)}
                        className="text-[10px] font-f1-mono px-2 py-0.5 bg-[#1C1C26] hover:bg-[#252533] border border-white/15 text-zinc-300 hover:text-white cursor-pointer"
                      >
                        Caixa ({trackFeedbackLog.length})
                      </button>
                    </div>
                  </div>

                  <p className="text-xs font-f1-mono text-cyan-200 leading-relaxed italic bg-cyan-950/20 p-2.5 border-l-2 border-cyan-400">
                    "{driverTracksideQuote}"
                  </p>

                  {showFeedbackInbox && (
                    <div className="bg-[#1C1C26] border border-white/10 p-2.5 space-y-2 max-h-48 overflow-y-auto text-[10px] font-f1-mono">
                      <span className="text-cyan-400 font-bold uppercase block">
                        Feedback de Pista (Caixa) · Relatos de TL1/TL2 e Corrida
                      </span>
                      {trackFeedbackLog.length === 0 ? (
                        <div className="text-zinc-400">
                          Nenhum relatório gravado ainda. Complete voltas de Treino Livre (TL1/TL2) ou GPs para registrar leituras dos pilotos.
                        </div>
                      ) : (
                        trackFeedbackLog.slice(0, 8).map(entry => (
                          <div key={entry.id} className="bg-[#15151E] border border-white/5 p-2 space-y-0.5">
                            <div className="flex justify-between text-zinc-400">
                              <span className="text-white font-bold">
                                R{entry.round} · {entry.circuitName} ({entry.session})
                              </span>
                              <span className="text-cyan-300">
                                {entry.driverName} · Conf. {entry.confidencePct}%
                              </span>
                            </div>
                            <div className="text-zinc-200 italic">"{entry.quote}"</div>
                            {entry.setupHint && <div className="text-amber-300">{entry.setupHint}</div>}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
              {/* ============================================================= */}
              {/* MODULE 1: POWER UNIT (ICE + 350kW ERS + I²R JOULE)            */}
              {/* ============================================================= */}
              {selectedType === 'pu' && (() => {
                const isCustomerTeam = !playerTeam?.isManufacturer && playerTeam?.engineOrigin === 'customer';
                const isPuHardwareLocked = isCustomerTeam || (motorHomologadoFIA && !aduoWindowActive);
                const dnaSpec = getSupplierDnaSpec(playerTeam?.engineSupplier);
                const unlockedSet = new Set(unlockedPuMaterials || dnaSpec.starterUnlockedMaterials);
                const activeIceId = resolveIceMetallurgyId(vehicleParams.iceMetallurgyId, vehicleParams.iceMaterial);
                const activeIceSpec = ICE_METALLURGY_2026[activeIceId];
                const activeBatteryId = resolveBatteryArchitectureId(vehicleParams.batteryCellTech);
                const activeBatterySpec = BATTERY_ARCHITECTURES_2026[activeBatteryId];
                const activeSubChem = vehicleParams.batterySubChemistry ?? dnaSpec.defaultBatterySubChem;

                return (
                <div className="space-y-4">
                  {/* DNA + BOM Header Strip */}
                  <div className="bg-[#15151E] p-3 border border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] font-f1-mono">
                    <div>
                      <span className="text-zinc-400">DNA Técnico: </span>
                      <span className="text-amber-400 font-bold">
                        {playerTeam?.engineCustomName || dnaSpec.puDesignation}
                      </span>
                      <span className="text-zinc-500 ml-2">
                        ({playerTeam?.engineOrigin === 'bought_factory' ? 'Fábrica Adquirida (Ano 1)' : dnaSpec.aduoTierLabel})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPuBomDrawer(prev => !prev)}
                      className="text-[10px] px-2.5 py-1 border border-cyan-500/40 bg-[#1C1C26] text-cyan-300 hover:text-white inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>{showPuBomDrawer ? 'Ocultar BOM (Materiais)' : 'Ver BOM / Detalhes da Peça'}</span>
                    </button>
                  </div>

                  {/* BOM (Seção 40 GDD) quando expandida */}
                  {showPuBomDrawer && (
                    <div className="bg-[#15151E] border border-cyan-500/30 p-3 space-y-2 text-[11px] font-f1-mono">
                      <div className="text-[10px] text-cyan-400 uppercase font-bold">
                        Bill of Materials (BOM) — Art. C15.7.1 FIA 2026
                      </div>
                      <div className="divide-y divide-white/5">
                        {[...activeIceSpec.bomItems, ...activeBatterySpec.bomItems].map((item, idx) => (
                          <div key={idx} className="py-1.5 flex items-center justify-between gap-3">
                            <div>
                              <span className="text-white font-bold">{item.component}:</span>{' '}
                              <span className="text-zinc-300">{item.material}</span>
                              <span className="text-zinc-500 block text-[10px]">
                                Fornecedor: {item.supplier} · {item.notes}
                              </span>
                            </div>
                            <span className="text-amber-300 font-bold tabular-nums shrink-0">
                              ${item.unitCostUsd.toLocaleString('en-US')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 1. Material do Bloco */}
                  <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-f1-wide font-bold text-white uppercase">
                          1. Material do Bloco
                        </span>
                        <span
                          title={`${activeIceSpec.tooltip} (Pistão homologado: ${activeIceSpec.pistonAlloyCode})`}
                          className="text-zinc-400 hover:text-amber-400 cursor-help inline-flex"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </span>
                      </div>
                      {isCustomerTeam && (
                        <span className="text-[10px] font-f1-mono px-2 py-0.5 bg-amber-950/40 border border-amber-500/40 text-amber-300 inline-flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>Homologado pelo Fornecedor</span>
                        </span>
                      )}
                    </div>

                    {isCustomerTeam ? (
                      <div className="p-2.5 border border-amber-500/40 bg-[#1C1C26] text-xs font-f1-mono flex items-center justify-between">
                        <span className="text-white font-bold flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          <span>
                            {activeIceSpec.shortLabel} ({dnaSpec.supplier})
                          </span>
                        </span>
                        <span className="text-[10px] text-amber-300">Homologado</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {(['fia_iron_ams6487', 'ferrari_steel_head', 'al_si_low_friction'] as IceMetallurgyId[]).map(
                          matId => {
                            const spec = ICE_METALLURGY_2026[matId];
                            const isSelected = activeIceId === matId;
                            const isUnlocked = unlockedSet.has(matId);
                            const disabled = isPuHardwareLocked || !isUnlocked;

                            return (
                              <button
                                key={matId}
                                type="button"
                                disabled={disabled}
                                title={spec.tooltip}
                                onClick={() =>
                                  updateVehicleParams({
                                    iceMetallurgyId: matId,
                                    iceMaterial: spec.legacyIceMaterial
                                  })
                                }
                                className={`p-2.5 text-left border text-xs transition-all ${
                                  isSelected
                                    ? 'bg-[#E10600]/20 border-[#E10600] text-white font-bold'
                                    : isUnlocked
                                    ? 'bg-[#1C1C26] border-white/10 text-zinc-300 hover:border-white/30 cursor-pointer'
                                    : 'bg-[#121218] border-white/5 text-zinc-500 cursor-not-allowed opacity-75'
                                }`}
                              >
                                <div className="font-f1-wide uppercase flex items-center justify-between gap-1 text-[11px]">
                                  <span>{spec.shortLabel}</span>
                                  {!isUnlocked && <Lock className="w-3 h-3 text-amber-400 shrink-0" />}
                                </div>
                                <div className="text-[10px] font-f1-mono text-zinc-400 mt-1">
                                  {isSelected
                                    ? `Ativo · Pistão ${spec.pistonAlloyCode}`
                                    : isUnlocked
                                    ? `Desbloqueado · $${(spec.costUsd / 1e6).toFixed(1)}M`
                                    : 'Bloqueado (Requer Pesquisa P&D)'}
                                </div>
                              </button>
                            );
                          }
                        )}
                      </div>
                    )}
                    <p className="text-[10px] font-f1-mono text-zinc-400">{activeIceSpec.tradeOffSummary}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(() => {
                      const comp = vehicleParams.iceCompressionRatio;
                      const compLevel = comp <= 14.8 ? 'low' : comp <= 15.4 ? 'moderate' : 'high';
                      const turboDiam = vehicleParams.turboDiameterMm;
                      const turboResp = turboDiam <= 86 ? 'Rápida' : turboDiam <= 95 ? 'Média' : 'Lenta';
                      const turboTop = turboDiam <= 86 ? 'Baixa' : turboDiam <= 95 ? 'Média' : 'Alta';
                      const engineBreakRisk =
                        (comp >= 15.8 && turboDiam >= 100) ||
                        (comp >= 15.5 && turboDiam >= 98) ||
                        vehiclePhysics.thermalMarginC < 4;

                      return (
                        <>
                          <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5">
                                <span className="font-f1-wide font-bold text-white uppercase">2. Compressão do Motor</span>
                                <span
                                  title={`Razão de compressão (r_c · Teto FIA 16.0:1). Valores altos aumentam aceleração e calor.`}
                                  className="text-zinc-400 hover:text-amber-400 cursor-help inline-flex"
                                >
                                  <Info className="w-3.5 h-3.5" />
                                </span>
                              </div>
                              <span
                                className={`font-f1-mono font-bold tabular-nums ${
                                  comp > 16 || compLevel === 'high'
                                    ? 'text-red-400'
                                    : compLevel === 'moderate'
                                    ? 'text-amber-400'
                                    : 'text-emerald-400'
                                }`}
                              >
                                {comp.toFixed(1)}:1
                              </span>
                            </div>
                            <input
                              type="range"
                              disabled={isPuHardwareLocked}
                              min={14.0}
                              max={16.5}
                              step={0.1}
                              value={comp}
                              onChange={e => updateVehicleParams({ iceCompressionRatio: Number(e.target.value) })}
                              className="w-full accent-[#E10600] h-1.5 bg-zinc-700 disabled:opacity-50"
                            />
                            <div className="flex justify-between text-[10px] font-f1-mono text-zinc-400">
                              <span>Mais Confiável</span>
                              <span>Mais Potência</span>
                            </div>
                            <div
                              className={`text-[10px] font-f1-mono px-2 py-1 border flex items-center justify-between ${
                                comp > 16 || compLevel === 'high'
                                  ? 'bg-red-950/35 border-red-500/50 text-red-300'
                                  : compLevel === 'moderate'
                                  ? 'bg-[#1C1C26] border-amber-500/30 text-zinc-200'
                                  : 'bg-emerald-950/25 border-emerald-500/35 text-emerald-200'
                              }`}
                            >
                              <span>
                                Aceleração:{' '}
                                <strong>{compLevel === 'low' ? 'Baixa' : compLevel === 'moderate' ? 'Média' : 'Alta'}</strong>
                              </span>
                              <span>
                                Superaquecimento:{' '}
                                <strong className={comp > 16 || compLevel === 'high' ? 'text-red-400' : ''}>
                                  {comp > 16
                                    ? 'ILEGAL (>16.0:1)'
                                    : compLevel === 'low'
                                    ? 'Seguro'
                                    : compLevel === 'moderate'
                                    ? 'Moderado'
                                    : 'CRÍTICO'}
                                </strong>
                              </span>
                            </div>
                          </div>

                          <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5">
                                <span className="font-f1-wide font-bold text-white uppercase">3. Diâmetro da Roda do Turbo</span>
                                <span
                                  title={`78 mm enche rápido na saída de curva; 104 mm entrega máxima velocidade de reta. Lag técnico: ${vehiclePhysics.turboSpoolLagMs} ms.`}
                                  className="text-zinc-400 hover:text-amber-400 cursor-help inline-flex"
                                >
                                  <Info className="w-3.5 h-3.5" />
                                </span>
                              </div>
                              <span className="font-f1-mono text-white font-bold tabular-nums">{turboDiam} mm</span>
                            </div>
                            <input
                              type="range"
                              disabled={isPuHardwareLocked}
                              min={78}
                              max={104}
                              step={1}
                              value={turboDiam}
                              onChange={e => updateVehicleParams({ turboDiameterMm: Number(e.target.value) })}
                              className="w-full accent-[#E10600] h-1.5 bg-zinc-700 disabled:opacity-50"
                            />
                            <div className="flex justify-between text-[10px] font-f1-mono text-zinc-400">
                              <span>78 mm · Pequeno</span>
                              <span>104 mm · Grande</span>
                            </div>
                            <div className="text-[10px] font-f1-mono px-2 py-1 border border-white/10 bg-[#1C1C26] text-zinc-200 flex items-center justify-between">
                              <span>
                                Resposta: <strong className="text-white">{turboResp}</strong>
                              </span>
                              <span>
                                Vel. Máxima: <strong className="text-white">{turboTop}</strong>
                              </span>
                            </div>
                          </div>

                          {engineBreakRisk && (
                            <div className="sm:col-span-2 bg-red-950/45 border border-red-500/70 p-2.5 text-[11px] font-f1-mono text-red-200 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                              <span>
                                <strong>⚠️ Risco Alto de Quebra do Motor:</strong> Compressão e turbo no limite térmico podem causar falha durante a corrida.
                              </span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* 4. Arquitetura da Bateria ERS + Química da Célula */}
                  <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-f1-wide font-bold text-white uppercase">
                          4. Arquitetura da Bateria (ERS 350 kW)
                        </span>
                        <span
                          title={activeBatterySpec.tooltip}
                          className="text-zinc-400 hover:text-emerald-400 cursor-help inline-flex"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </span>
                      </div>
                      {activeBatterySpec.supportsSubChemistry && (
                        <button
                          type="button"
                          onClick={() => setShowPuCellChem(prev => !prev)}
                          className="text-[10px] font-f1-mono text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                        >
                          {showPuCellChem ? 'Ocultar Química' : 'Ver Química da Célula'}
                        </button>
                      )}
                    </div>

                    {isCustomerTeam ? (
                      <div className="p-2.5 border border-amber-500/40 bg-[#1C1C26] text-xs font-f1-mono flex items-center justify-between">
                        <span className="text-white font-bold flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          <span>
                            {activeBatterySpec.shortLabel} ({dnaSpec.supplier})
                          </span>
                        </span>
                        <span className="text-[10px] text-amber-300">Homologado pelo Fornecedor</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {(['lightweight_lithium', 'dense_pack', 'ultra_solid_state'] as BatteryArchitectureId[]).map(
                          batId => {
                            const spec = BATTERY_ARCHITECTURES_2026[batId];
                            const isSelected = activeBatteryId === batId;
                            const isUnlocked = unlockedSet.has(batId);
                            const disabled = isPuHardwareLocked || !isUnlocked;

                            return (
                              <button
                                key={batId}
                                type="button"
                                disabled={disabled}
                                title={spec.tooltip}
                                onClick={() => updateVehicleParams({ batteryCellTech: batId })}
                                className={`p-2.5 text-left border text-xs transition-all ${
                                  isSelected
                                    ? 'bg-[#E10600]/20 border-[#E10600] text-white font-bold'
                                    : isUnlocked
                                    ? 'bg-[#1C1C26] border-white/10 text-zinc-300 hover:border-white/30 cursor-pointer'
                                    : 'bg-[#121218] border-white/5 text-zinc-500 cursor-not-allowed opacity-75'
                                }`}
                              >
                                <div className="font-f1-wide uppercase flex items-center justify-between gap-1 text-[11px]">
                                  <span>{spec.shortLabel}</span>
                                  {!isUnlocked && <Lock className="w-3 h-3 text-amber-400 shrink-0" />}
                                </div>
                                <div className="text-[10px] font-f1-mono text-zinc-400 mt-0.5">
                                  {isSelected
                                    ? 'Selecionado'
                                    : isUnlocked
                                    ? 'Disponível'
                                    : 'Bloqueado (Requer Pesquisa P&D)'}
                                </div>
                              </button>
                            );
                          }
                        )}
                      </div>
                    )}
                    <p className="text-[11px] font-f1-mono text-zinc-300">{activeBatterySpec.tradeOffSummary}</p>

                    {activeBatterySpec.supportsSubChemistry && showPuCellChem && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {(['nca', 'si_c'] as const).map(chemId => {
                          const chem = BATTERY_SUB_CHEMISTRIES[chemId];
                          const active = activeSubChem === chemId;
                          return (
                            <button
                              key={chemId}
                              type="button"
                              disabled={isPuHardwareLocked}
                              onClick={() => updateVehicleParams({ batterySubChemistry: chemId })}
                              className={`p-2 text-left border text-[10px] font-f1-mono ${
                                isPuHardwareLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                              } ${
                                active
                                  ? 'border-cyan-400 bg-cyan-950/35 text-white font-bold'
                                  : 'border-white/10 bg-[#1C1C26] text-zinc-400 hover:text-white'
                              }`}
                            >
                              <div>{chem.label}</div>
                              <div className="text-[9px] text-zinc-400 mt-0.5">{chem.summary}</div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Árvore de Pesquisa de Materiais 2026 (Seção 39 GDD) */}
                  {!isCustomerTeam && (
                    <div className="bg-[#15151E] p-3 border border-emerald-500/25 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-f1-wide font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                          <FlaskConical className="w-3.5 h-3.5" />
                          <span>Árvore de Pesquisa de Materiais PU 2026 (P&D)</span>
                        </span>
                        {activePuMaterialResearch && (
                          <span className="text-[10px] font-f1-mono text-amber-300 font-bold">
                            Em curso: {activePuMaterialResearch.weeksRemaining}/{activePuMaterialResearch.totalWeeks} sem
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {PU_MATERIAL_RESEARCH_PROJECTS.map(proj => {
                          const unlocked = unlockedSet.has(proj.targetMaterialId);
                          const isActive = activePuMaterialResearch?.projectId === proj.id;
                          return (
                            <div
                              key={proj.id}
                              className={`p-3.5 border text-[10px] font-f1-mono flex flex-col justify-between gap-3 ${
                                unlocked
                                  ? 'border-emerald-500/40 bg-emerald-950/20'
                                  : isActive
                                  ? 'border-amber-500 bg-amber-950/25'
                                  : 'border-white/10 bg-[#1C1C26]'
                              }`}
                            >
                              <div className="space-y-1.5">
                                <div className="font-bold text-white leading-snug">{proj.title}</div>
                                <div className="text-zinc-400 leading-relaxed">{proj.description}</div>
                                <div className="text-zinc-300 pt-0.5 tabular-nums">
                                  ${(proj.costUsd / 1e6).toFixed(1)}M · {proj.durationWeeks} sem · P&D Nv.{proj.minFacilityLevel}+
                                </div>
                              </div>
                              <div className="mt-auto pt-1">
                              {unlocked ? (
                                <span className="text-emerald-400 font-bold uppercase block">✓ Desbloqueado</span>
                              ) : isActive ? (
                                <span className="text-amber-300 font-bold uppercase block">
                                  Pesquisando ({activePuMaterialResearch.weeksRemaining} sem)
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  disabled={Boolean(activePuMaterialResearch)}
                                  onClick={() => {
                                    const res = startPuMaterialResearch(proj.id);
                                    setResearchFeedback(res.message);
                                  }}
                                  className="w-full px-2.5 py-1.5 bg-[#E10600] hover:bg-[#c20500] disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-bold uppercase cursor-pointer disabled:cursor-not-allowed"
                                >
                                  Iniciar Pesquisa
                                </button>
                              )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {researchFeedback && (
                        <div className="text-[10px] font-f1-mono text-cyan-300">{researchFeedback}</div>
                      )}
                    </div>
                  )}

                  {(() => {
                    const rInt = vehicleParams.batteryInternalResistanceMOhm;
                    const rLevel = rInt <= 12.0 ? 'Baixa' : rInt <= 16.5 ? 'Média' : 'Alta';
                    const deployPct = vehicleParams.ersDeployBiasPct;
                    const ersModeText =
                      deployPct <= 42
                        ? 'Modo: Economia (Defende posição)'
                        : deployPct >= 62
                        ? 'Modo: Ataque (Gasta mais bateria)'
                        : 'Modo: Equilibrado';

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-f1-wide font-bold text-white uppercase">Potência Elétrica</span>
                            <span className="font-f1-mono text-emerald-400 font-bold tabular-nums">
                              {vehicleParams.mgukMaxKw} kW
                            </span>
                          </div>
                          <input
                            type="range"
                            min={280}
                            max={360}
                            step={5}
                            value={vehicleParams.mgukMaxKw}
                            onChange={e => updateVehicleParams({ mgukMaxKw: Number(e.target.value) })}
                            className="w-full accent-[#E10600] h-1.5 bg-zinc-700"
                          />
                          <span className="text-[10px] font-f1-mono text-zinc-400 block">
                            {vehicleParams.mgukMaxKw > 350 ? '⚠️ Acima do máximo permitido (350 kW)' : 'Dentro do limite da FIA'}
                          </span>
                        </div>

                        <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="font-f1-wide font-bold text-white uppercase">Resistência da Bateria</span>
                              <span
                                title={`R_int: ${rInt.toFixed(1)} mΩ | Perda térmica I²R: ${vehiclePhysics.batteryJouleLossesKw} kW`}
                                className="text-zinc-400 hover:text-amber-400 cursor-help inline-flex"
                              >
                                <Info className="w-3.5 h-3.5" />
                              </span>
                            </div>
                            <span
                              className={`font-f1-mono font-bold ${
                                rLevel === 'Baixa' ? 'text-emerald-400' : rLevel === 'Média' ? 'text-amber-400' : 'text-red-400'
                              }`}
                            >
                              {rLevel}
                            </span>
                          </div>
                          <input
                            type="range"
                            min={8.0}
                            max={22.0}
                            step={0.5}
                            value={rInt}
                            onChange={e => updateVehicleParams({ batteryInternalResistanceMOhm: Number(e.target.value) })}
                            className="w-full accent-[#E10600] h-1.5 bg-zinc-700"
                          />
                          <span
                            className={`text-[10px] font-f1-mono block ${
                              rLevel === 'Baixa' ? 'text-emerald-400' : rLevel === 'Média' ? 'text-amber-300' : 'text-red-400'
                            }`}
                          >
                            {rLevel === 'Baixa'
                              ? 'Perda de Energia: Baixa | Aquecimento: Baixo'
                              : rLevel === 'Média'
                              ? 'Perda de Energia: Média | Aquecimento: Moderado'
                              : 'Perda Alta (esquenta) | Risco de Corte'}
                          </span>
                        </div>

                        <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-f1-wide font-bold text-white uppercase">Mapa Deploy ERS</span>
                            <span className="font-f1-mono text-white font-bold tabular-nums">{deployPct}%</span>
                          </div>
                          <input
                            type="range"
                            min={15}
                            max={90}
                            step={5}
                            value={deployPct}
                            onChange={e => updateVehicleParams({ ersDeployBiasPct: Number(e.target.value) })}
                            className="w-full accent-[#E10600] h-1.5 bg-zinc-700"
                          />
                          <span className="text-[10px] font-f1-mono text-zinc-300 block">{ersModeText}</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Live Thermal Coupling Box */}
                  <div
                    className={`p-3 border text-xs ${
                      vehiclePhysics.thermalMarginC < 4
                        ? 'bg-red-950/35 border-red-500/60 text-red-200'
                        : 'bg-[#15151E] border-white/5 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-f1-wide font-bold">
                      <span className="flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-[#E10600]" />
                        POTÊNCIA NA RODA: {vehiclePhysics.totalWheelPowerHp} CV ({vehiclePhysics.totalWheelPowerKw} kW) · PICO HOMOLOGADO: {playerTeam.homologatedPeakPowerHp ?? vehiclePhysics.peakCombinedPowerHp} CV
                      </span>
                      <span className={`font-f1-mono ${vehiclePhysics.thermalMarginC < 4 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {vehiclePhysics.thermalMarginC < 4
                          ? '⚠️ Risco Alto de Superaquecimento'
                          : vehiclePhysics.thermalMarginC < 10
                          ? 'Atenção ao Calor'
                          : 'Temperatura Segura'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 font-f1-mono">
                      Motor operando em temperatura {vehiclePhysics.thermalMarginC < 4 ? 'crítica — considere abrir radiadores ou aliviar a compressão.' : 'estável dentro do pacote de refrigeração atual.'}
                    </p>
                  </div>

                  <ParameterPhysicsCard
                    cardKey="pu_ers_thermal"
                    configuredSummary={`${vehicleParams.mgukMaxKw} kW · R=${vehicleParams.batteryInternalResistanceMOhm} mΩ · Comp ${vehicleParams.iceCompressionRatio.toFixed(1)}:1`}
                    simulatedSummary={`Perda Joule ${vehiclePhysics.batteryJouleLossesKw} kW · Células ${vehiclePhysics.batteryCellTempC}°C · ICE ${vehiclePhysics.iceOperatingTempC}°C`}
                    isSimulationStale={isSimulationStale}
                    classification={lastSimulationReport ? 'Simulado' : 'Estimado'}
                  />
                </div>
                );
              })()}

              {/* ============================================================= */}
              {/* MODULE 2: GEARBOX & TRANSMISSION (SECTION 4.5 DECOUPLED)      */}
              {/* ============================================================= */}
              {selectedType === 'gearbox' && (
                <div className="space-y-4">
                  <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                    <span className="text-xs font-f1-wide font-bold text-white block uppercase">
                      1. Material Estrutural da Carcaça do Câmbio
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {(['aluminum', 'titanium', 'carbon'] as const).map(mat => {
                        const spec = CASING_ALLOYS[mat];
                        return (
                          <button
                            key={mat}
                            type="button"
                            onClick={() => updateVehicleParams({ gearboxMaterial: mat })}
                            className={`p-2.5 text-left border text-xs cursor-pointer ${
                              vehicleParams.gearboxMaterial === mat
                                ? 'bg-[#E10600]/20 border-[#E10600] text-white font-bold'
                                : 'bg-[#1C1C26] border-white/10 text-zinc-400'
                            }`}
                          >
                            <div className="font-f1-wide uppercase">{mat.toUpperCase()}</div>
                            <div className="text-[10px] font-f1-mono text-zinc-400 mt-0.5">
                              E={spec.youngsModulusGpa} GPa · ρ={spec.densityKgM3} kg/m³
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                    <span className="text-xs font-f1-wide font-bold text-white block uppercase">
                      2. Empacotamento Traseiro (Difusor vs Manutenção de Garagem)
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => updateVehicleParams({ gearboxLayout: 'compact' })}
                        className={`p-2.5 text-left border text-xs cursor-pointer ${
                          vehicleParams.gearboxLayout === 'compact'
                            ? 'bg-[#E10600]/20 border-[#E10600] text-white font-bold'
                            : 'bg-[#1C1C26] border-white/10 text-zinc-400'
                        }`}
                      >
                        <div className="font-f1-wide uppercase">Compacto (Slim Aero)</div>
                        <div className="text-[10px] font-f1-mono text-zinc-400 mt-0.5">
                          Libera canal do difusor · +22 min manutenção de garagem (Pit Stop pneus inalterado)
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateVehicleParams({ gearboxLayout: 'voluminous' })}
                        className={`p-2.5 text-left border text-xs cursor-pointer ${
                          vehicleParams.gearboxLayout === 'voluminous'
                            ? 'bg-[#E10600]/20 border-[#E10600] text-white font-bold'
                            : 'bg-[#1C1C26] border-white/10 text-zinc-400'
                        }`}
                      >
                        <div className="font-f1-wide uppercase">Volumoso (Modular)</div>
                        <div className="text-[10px] font-f1-mono text-zinc-400 mt-0.5">
                          Acesso mecânico ágil (-12 min reparo) · Obstrui fluxo do difusor
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-f1-wide font-bold text-white uppercase">Relação Final</span>
                        <span className="font-f1-mono text-[#E10600] font-bold">{vehicleParams.gearRatioBias}%</span>
                      </div>
                      <input
                        type="range"
                        min={15}
                        max={85}
                        value={vehicleParams.gearRatioBias}
                        onChange={e => updateVehicleParams({ gearRatioBias: Number(e.target.value) })}
                        className="w-full accent-[#E10600] h-1.5 bg-zinc-700"
                      />
                      <span className="text-[10px] font-f1-mono text-zinc-400 block">Curta (Tração) ↔ Longa</span>
                    </div>

                    <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-f1-wide font-bold text-white uppercase">Largura Dentes</span>
                        <span className="font-f1-mono text-white font-bold">{vehicleParams.gearToothWidthMm} mm</span>
                      </div>
                      <input
                        type="range"
                        min={14}
                        max={22}
                        step={0.5}
                        value={vehicleParams.gearToothWidthMm}
                        onChange={e => updateVehicleParams({ gearToothWidthMm: Number(e.target.value) })}
                        className="w-full accent-[#E10600] h-1.5 bg-zinc-700"
                      />
                      <span className="text-[10px] font-f1-mono text-zinc-400 block">
                        Fadiga: {vehiclePhysics.fatigueLifeRaces} GPs · Efic: {vehiclePhysics.transmissionEfficiencyPct}%
                      </span>
                    </div>

                    <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-f1-wide font-bold text-white uppercase">Trocador Óleo</span>
                        <span className="font-f1-mono text-cyan-400 font-bold">{vehicleParams.gearboxOilCoolingKw} kW</span>
                      </div>
                      <input
                        type="range"
                        min={6}
                        max={18}
                        step={0.5}
                        value={vehicleParams.gearboxOilCoolingKw}
                        onChange={e => updateVehicleParams({ gearboxOilCoolingKw: Number(e.target.value) })}
                        className="w-full accent-[#E10600] h-1.5 bg-zinc-700"
                      />
                      <span className="text-[10px] font-f1-mono text-zinc-400 block">
                        Óleo: {vehiclePhysics.gearboxOilTempC}°C · Perdas: {vehiclePhysics.mechanicalLossesKw} kW
                      </span>
                    </div>
                  </div>

                  <ParameterPhysicsCard
                    cardKey="gearbox_packaging"
                    configuredSummary={`${vehicleParams.gearboxMaterial.toUpperCase()} · ${vehicleParams.gearboxLayout} · Dente ${vehicleParams.gearToothWidthMm} mm`}
                    simulatedSummary={`Eficiência ${vehiclePhysics.transmissionEfficiencyPct}% (${vehiclePhysics.mechanicalLossesKw} kW perdidos) · Vida útil ${vehiclePhysics.fatigueLifeRaces} GPs`}
                    isSimulationStale={isSimulationStale}
                    classification={lastSimulationReport ? 'Simulado' : 'Estimado'}
                  />
                </div>
              )}

              {/* ============================================================= */}
              {/* MODULE 3: CHASSIS & ANISOTROPIC LAMINATE LAYUP                */}
              {/* ============================================================= */}
              {selectedType === 'chassis' && (
                <div className="space-y-4">
                  <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                    <span className="text-xs font-f1-wide font-bold text-white block uppercase">
                      1. Fibra Compósita do Monocoque (Laminado Anisotrópico)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {(['t800', 't1000', 'm40j'] as const).map(fid => {
                        const fspec = COMPOSITE_MATERIALS[fid];
                        return (
                          <button
                            key={fid}
                            type="button"
                            onClick={() => updateVehicleParams({ compositeFiber: fid })}
                            className={`p-2.5 text-left border text-xs cursor-pointer ${
                              vehicleParams.compositeFiber === fid
                                ? 'bg-[#E10600]/20 border-[#E10600] text-white font-bold'
                                : 'bg-[#1C1C26] border-white/10 text-zinc-400'
                            }`}
                          >
                            <div className="font-f1-wide uppercase">{fid.toUpperCase()}</div>
                            <div className="text-[10px] font-f1-mono text-zinc-400 mt-0.5">
                              E={fspec.fiberModulusGpa} GPa · σ={fspec.tensileStrengthMpa} MPa
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-[#15151E] p-3 border border-white/5 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-f1-wide font-bold text-white uppercase">
                        2. Orientação das Lâminas (0° Axial / ±45° Torção / 90° Transversal)
                      </span>
                      <span className="font-f1-mono text-cyan-400 font-bold">
                        Normalizado: {normZero}% / {norm45}% / {norm90}%
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-f1-mono">
                          <span className="text-zinc-300">0° Longitudinal</span>
                          <span className="text-white font-bold">{normZero}%</span>
                        </div>
                        <input
                          type="range"
                          min={10}
                          max={70}
                          value={vehicleParams.layupPlyZeroPct}
                          onChange={e => updateVehicleParams({ layupPlyZeroPct: Number(e.target.value) })}
                          className="w-full accent-[#E10600] h-1.5 bg-zinc-700"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-f1-mono">
                          <span className="text-zinc-300">±45° Cisalhamento</span>
                          <span className="text-white font-bold">{norm45}%</span>
                        </div>
                        <input
                          type="range"
                          min={10}
                          max={70}
                          value={vehicleParams.layupPly45Pct}
                          onChange={e => updateVehicleParams({ layupPly45Pct: Number(e.target.value) })}
                          className="w-full accent-[#E10600] h-1.5 bg-zinc-700"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-f1-mono">
                          <span className="text-zinc-300">90° Transversal</span>
                          <span className="text-white font-bold">{norm90}%</span>
                        </div>
                        <input
                          type="range"
                          min={5}
                          max={50}
                          value={vehicleParams.layupPly90Pct}
                          onChange={e => updateVehicleParams({ layupPly90Pct: Number(e.target.value) })}
                          className="w-full accent-[#E10600] h-1.5 bg-zinc-700"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-f1-wide font-bold text-white uppercase">Espessura</span>
                        <span className="font-f1-mono text-white font-bold">{vehicleParams.laminateThicknessMm.toFixed(1)} mm</span>
                      </div>
                      <input
                        type="range"
                        min={2.4}
                        max={5.2}
                        step={0.1}
                        value={vehicleParams.laminateThicknessMm}
                        onChange={e => updateVehicleParams({ laminateThicknessMm: Number(e.target.value) })}
                        className="w-full accent-[#E10600] h-1.5 bg-zinc-700"
                      />
                      <span className="text-[10px] font-f1-mono text-zinc-400 block">
                        Flambagem FS: {vehiclePhysics.bucklingSafetyFactor}x
                      </span>
                    </div>

                    <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-f1-wide font-bold text-white uppercase">Reforço Local</span>
                        <span className="font-f1-mono text-white font-bold">{vehicleParams.localReinforcementPct}%</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={60}
                        step={2}
                        value={vehicleParams.localReinforcementPct}
                        onChange={e => updateVehicleParams({ localReinforcementPct: Number(e.target.value) })}
                        className="w-full accent-[#E10600] h-1.5 bg-zinc-700"
                      />
                      <span className="text-[10px] font-f1-mono text-zinc-400 block">
                        Delaminação: {vehiclePhysics.delaminationRiskPct}% risco
                      </span>
                    </div>

                    <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-f1-wide font-bold text-white uppercase">Entre-Eixos</span>
                        <span className="font-f1-mono text-[#E10600] font-bold">{vehicleParams.wheelbaseMm} mm</span>
                      </div>
                      <input
                        type="range"
                        min={3250}
                        max={3450}
                        step={10}
                        value={vehicleParams.wheelbaseMm}
                        onChange={e => updateVehicleParams({ wheelbaseMm: Number(e.target.value) })}
                        className="w-full accent-[#E10600] h-1.5 bg-zinc-700"
                      />
                      <span className="text-[10px] font-f1-mono text-zinc-400 block">Limite FIA 2026: 3400 mm</span>
                    </div>
                  </div>

                  <ParameterPhysicsCard
                    cardKey="monocoque_laminate"
                    configuredSummary={`${vehicleParams.compositeFiber.toUpperCase()} · ${normZero}/${norm45}/${norm90}% · ${vehicleParams.laminateThicknessMm.toFixed(1)} mm`}
                    simulatedSummary={`Rigidez Torcional ${vehiclePhysics.torsionalStiffnessNmDeg.toLocaleString()} N·m/° · Massa ${vehiclePhysics.totalMassKg} kg · Impacto ${vehiclePhysics.impactAbsorptionMarginPct}%`}
                    isSimulationStale={isSimulationStale}
                    classification={lastSimulationReport ? 'Simulado' : 'Estimado'}
                  />
                </div>
              )}

              {/* ============================================================= */}
              {/* MODULE 4: SUSPENSION 3D KINEMATICS & TIRES                    */}
              {/* ============================================================= */}
              {selectedType === 'suspension' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                      <span className="text-xs font-f1-wide font-bold text-white block uppercase">
                        1. Arquitetura Dianteira
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {(['pullrod', 'pushrod'] as const).map(stype => (
                          <button
                            key={stype}
                            type="button"
                            onClick={() => updateVehicleParams({ frontSuspensionType: stype })}
                            className={`p-2 text-left border text-xs cursor-pointer ${
                              vehicleParams.frontSuspensionType === stype
                                ? 'bg-[#E10600]/20 border-[#E10600] text-white font-bold'
                                : 'bg-[#1C1C26] border-white/10 text-zinc-400'
                            }`}
                          >
                            <div className="font-f1-wide uppercase">{stype === 'pullrod' ? 'Pull-Rod' : 'Push-Rod'}</div>
                            <div className="text-[10px] font-f1-mono text-zinc-400">
                              {stype === 'pullrod' ? 'CG mais baixo / fluxo limpo' : 'Acesso mecânico ágil'}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                      <span className="text-xs font-f1-wide font-bold text-white block uppercase">
                        2. Arquitetura Traseira
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {(['pushrod', 'pullrod'] as const).map(stype => (
                          <button
                            key={stype}
                            type="button"
                            onClick={() => updateVehicleParams({ rearSuspensionType: stype })}
                            className={`p-2 text-left border text-xs cursor-pointer ${
                              vehicleParams.rearSuspensionType === stype
                                ? 'bg-[#E10600]/20 border-[#E10600] text-white font-bold'
                                : 'bg-[#1C1C26] border-white/10 text-zinc-400'
                            }`}
                          >
                            <div className="font-f1-wide uppercase">{stype === 'pushrod' ? 'Push-Rod' : 'Pull-Rod'}</div>
                            <div className="text-[10px] font-f1-mono text-zinc-400">
                              {stype === 'pushrod' ? 'Libera canal do difusor' : 'Compacta / tração'}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-f1-wide font-bold text-white uppercase">Rigidez Mola</span>
                        <span className="font-f1-mono text-[#E10600] font-bold">{vehicleParams.springRateNmm} N/mm</span>
                      </div>
                      <input
                        type="range"
                        min={140}
                        max={340}
                        step={5}
                        value={vehicleParams.springRateNmm}
                        onChange={e => updateVehicleParams({ springRateNmm: Number(e.target.value) })}
                        className="w-full accent-[#E10600] h-1.5 bg-zinc-700"
                      />
                      <span className="text-[10px] font-f1-mono text-zinc-400 block">
                        Freq. Natural: {vehiclePhysics.naturalFrequencyHz} Hz
                      </span>
                    </div>

                    <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-f1-wide font-bold text-white uppercase">Amortecedor</span>
                        <span className="font-f1-mono text-white font-bold">{vehicleParams.damperNsM} N·s/m</span>
                      </div>
                      <input
                        type="range"
                        min={2500}
                        max={6500}
                        step={100}
                        value={vehicleParams.damperNsM}
                        onChange={e => updateVehicleParams({ damperNsM: Number(e.target.value) })}
                        className="w-full accent-[#E10600] h-1.5 bg-zinc-700"
                      />
                      <span className="text-[10px] font-f1-mono text-zinc-400 block">
                        Razão ζ: {vehiclePhysics.dampingRatio}
                      </span>
                    </div>

                    <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-f1-wide font-bold text-white uppercase">Barra ARB</span>
                        <span className="font-f1-mono text-white font-bold">{vehicleParams.antiRollBarNmm} N/mm</span>
                      </div>
                      <input
                        type="range"
                        min={40}
                        max={140}
                        step={5}
                        value={vehicleParams.antiRollBarNmm}
                        onChange={e => updateVehicleParams({ antiRollBarNmm: Number(e.target.value) })}
                        className="w-full accent-[#E10600] h-1.5 bg-zinc-700"
                      />
                      <span className="text-[10px] font-f1-mono text-zinc-400 block">
                        Rolagem: {vehiclePhysics.cornerRollDeg}° · Transf: {vehiclePhysics.lateralLoadTransferPct}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[#15151E] p-3 border border-white/5 space-y-1.5">
                      <div className="flex justify-between text-[11px] font-f1-mono">
                        <span className="text-zinc-300 font-bold">Anti-Dive</span>
                        <span className="text-white font-bold">{vehicleParams.antiDivePct}%</span>
                      </div>
                      <input
                        type="range"
                        min={15}
                        max={65}
                        value={vehicleParams.antiDivePct}
                        onChange={e => updateVehicleParams({ antiDivePct: Number(e.target.value) })}
                        className="w-full accent-[#E10600] h-1.5 bg-zinc-700"
                      />
                    </div>

                    <div className="bg-[#15151E] p-3 border border-white/5 space-y-1.5">
                      <div className="flex justify-between text-[11px] font-f1-mono">
                        <span className="text-zinc-300 font-bold">Anti-Squat</span>
                        <span className="text-white font-bold">{vehicleParams.antiSquatPct}%</span>
                      </div>
                      <input
                        type="range"
                        min={15}
                        max={65}
                        value={vehicleParams.antiSquatPct}
                        onChange={e => updateVehicleParams({ antiSquatPct: Number(e.target.value) })}
                        className="w-full accent-[#E10600] h-1.5 bg-zinc-700"
                      />
                    </div>

                    <div className="bg-[#15151E] p-3 border border-white/5 space-y-1.5">
                      <div className="flex justify-between text-[11px] font-f1-mono">
                        <span className="text-zinc-300 font-bold">Camber</span>
                        <span className="text-cyan-400 font-bold">{vehicleParams.staticCamberDeg.toFixed(1)}°</span>
                      </div>
                      <input
                        type="range"
                        min={-3.5}
                        max={-1.2}
                        step={0.1}
                        value={vehicleParams.staticCamberDeg}
                        onChange={e => updateVehicleParams({ staticCamberDeg: Number(e.target.value) })}
                        className="w-full accent-[#E10600] h-1.5 bg-zinc-700"
                      />
                    </div>

                    <div className="bg-[#15151E] p-3 border border-white/5 space-y-1.5">
                      <div className="flex justify-between text-[11px] font-f1-mono">
                        <span className="text-zinc-300 font-bold">Inclinação Braço</span>
                        <span className="text-emerald-400 font-bold">{vehicleParams.upperArmInclinationDeg.toFixed(1)}°</span>
                      </div>
                      <input
                        type="range"
                        min={2}
                        max={14}
                        step={0.5}
                        value={vehicleParams.upperArmInclinationDeg}
                        onChange={e => updateVehicleParams({ upperArmInclinationDeg: Number(e.target.value) })}
                        className="w-full accent-[#E10600] h-1.5 bg-zinc-700"
                      />
                    </div>
                  </div>

                  <ParameterPhysicsCard
                    cardKey="suspension_kinematics"
                    configuredSummary={`${vehicleParams.frontSuspensionType.toUpperCase()}/${vehicleParams.rearSuspensionType.toUpperCase()} · K=${vehicleParams.springRateNmm} N/mm · Camber ${vehicleParams.staticCamberDeg.toFixed(1)}°`}
                    simulatedSummary={`Ganho camber ${vehiclePhysics.camberGainDegPerMm}°/mm · Pico lateral pneu ${vehiclePhysics.tirePeakLateralN} N · Desgaste x${vehiclePhysics.tireWearRateMultiplier}`}
                    isSimulationStale={isSimulationStale}
                    classification={lastSimulationReport ? 'Simulado' : 'Estimado'}
                  />
                </div>
              )}

              {/* ============================================================= */}
              {/* MODULE 5: 2026 FLAT FLOOR, DIFFUSER & SIDEPODS COOLING        */}
              {/* ============================================================= */}
              {selectedType === 'floor' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-f1-wide font-bold text-white uppercase">
                          1. Ângulo do Difusor Traseiro (2026)
                        </span>
                        <span className="font-f1-mono text-[#E10600] font-bold tabular-nums">
                          {vehicleParams.diffuserAngleDeg.toFixed(1)}°
                        </span>
                      </div>
                      <input
                        type="range"
                        min={6.0}
                        max={14.5}
                        step={0.2}
                        value={vehicleParams.diffuserAngleDeg}
                        onChange={e => updateVehicleParams({ diffuserAngleDeg: Number(e.target.value) })}
                        className="w-full accent-[#E10600] h-1.5 bg-zinc-700"
                      />
                      <div className="flex justify-between text-[10px] font-f1-mono text-zinc-400">
                        <span>6.0° (Escoamento Aderido)</span>
                        <span>Limite FIA: 14.0° (Estol ~11.5°)</span>
                      </div>
                    </div>

                    <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-f1-wide font-bold text-white uppercase">
                          2. Altura Dianteira / Traseira (Ride Height)
                        </span>
                        <span className="font-f1-mono text-cyan-400 font-bold tabular-nums">
                          {vehicleParams.frontRideHeightMm} / {vehicleParams.rearRideHeightMm} mm
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="range"
                          min={16}
                          max={36}
                          step={1}
                          value={vehicleParams.frontRideHeightMm}
                          onChange={e => updateVehicleParams({ frontRideHeightMm: Number(e.target.value) })}
                          className="w-full accent-[#E10600] h-1.5 bg-zinc-700"
                        />
                        <input
                          type="range"
                          min={34}
                          max={70}
                          step={1}
                          value={vehicleParams.rearRideHeightMm}
                          onChange={e => updateVehicleParams({ rearRideHeightMm: Number(e.target.value) })}
                          className="w-full accent-[#E10600] h-1.5 bg-zinc-700"
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-f1-mono text-zinc-400">
                        <span>Diant. (Mín FIA 18mm)</span>
                        <span>Sensib: {vehiclePhysics.rideHeightSensitivityNPerMm} N/mm</span>
                      </div>
                    </div>
                  </div>

                  {/* Sidepods & Radiators */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-f1-wide font-bold text-white uppercase">Entrada Sidepod</span>
                        <span className="font-f1-mono text-white font-bold">{vehicleParams.sidepodInletAreaCm2} cm²</span>
                      </div>
                      <input
                        type="range"
                        min={240}
                        max={480}
                        step={5}
                        value={vehicleParams.sidepodInletAreaCm2}
                        onChange={e => updateVehicleParams({ sidepodInletAreaCm2: Number(e.target.value) })}
                        className="w-full accent-[#E10600] h-1.5 bg-zinc-700"
                      />
                      <span className="text-[10px] font-f1-mono text-zinc-400 block">
                        Vazão ar: {vehiclePhysics.massFlowKgS} kg/s
                      </span>
                    </div>

                    <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-f1-wide font-bold text-white uppercase">Radiadores</span>
                        <span className="font-f1-mono text-emerald-400 font-bold">{vehicleParams.radiatorVolumeL.toFixed(1)} L</span>
                      </div>
                      <input
                        type="range"
                        min={8.0}
                        max={18.0}
                        step={0.2}
                        value={vehicleParams.radiatorVolumeL}
                        onChange={e => updateVehicleParams({ radiatorVolumeL: Number(e.target.value) })}
                        className="w-full accent-[#E10600] h-1.5 bg-zinc-700"
                      />
                      <span className="text-[10px] font-f1-mono text-zinc-400 block">
                        Rejeição: {vehiclePhysics.radiatorHeatRejectionKw} kW
                      </span>
                    </div>

                    <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-f1-wide font-bold text-white uppercase">Undercut / Borda</span>
                        <span className="font-f1-mono text-amber-400 font-bold">{vehicleParams.sidepodUndercutPct}%</span>
                      </div>
                      <input
                        type="range"
                        min={15}
                        max={90}
                        step={1}
                        value={vehicleParams.sidepodUndercutPct}
                        onChange={e => updateVehicleParams({ sidepodUndercutPct: Number(e.target.value) })}
                        className="w-full accent-[#E10600] h-1.5 bg-zinc-700"
                      />
                      <span className="text-[10px] font-f1-mono text-zinc-400 block">
                        Margem sep.: {vehiclePhysics.separationMarginPct}%
                      </span>
                    </div>
                  </div>

                  {/* Porpoising & Floor Stability Indicator */}
                  <div
                    className={`p-3 border text-xs ${
                      vehiclePhysics.porpoisingRiskPct > 45
                        ? 'bg-red-950/30 border-red-500/40 text-red-200'
                        : 'bg-[#15151E] border-white/5 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-f1-wide font-bold">
                      <span className="flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-[#E10600]" />
                        ASSOLAMENTO 2026, DIFUSOR & PORPOISING (PLT)
                      </span>
                      <span className="font-f1-mono font-bold tabular-nums">
                        {vehiclePhysics.porpoisingRiskPct}% RISCO · Recup. Difusor {vehiclePhysics.diffuserPressureRecoveryPct}%
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      {vehiclePhysics.porpoisingRiskPct > 45
                        ? 'LIMIAR CRÍTICO: A sucção do assoalho plano + altura reduzida estão induzindo oscilação vertical com a frequência da suspensão.'
                        : 'Plataforma do assoalho plano 2026 estável. Fluxo no difusor ampliado permanece aderido.'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <ParameterPhysicsCard
                      cardKey="diffuser_angle"
                      configuredSummary={`Difusor ${vehicleParams.diffuserAngleDeg.toFixed(1)}° · Comp. ${vehicleParams.diffuserLengthMm} mm · Altura ${vehicleParams.frontRideHeightMm}/${vehicleParams.rearRideHeightMm} mm`}
                      simulatedSummary={`Recuperação ${vehiclePhysics.diffuserPressureRecoveryPct}% · Margem separação ${vehiclePhysics.separationMarginPct}% · Downforce ${vehiclePhysics.cornerMode.downforceTotalN} N`}
                      isSimulationStale={isSimulationStale}
                      classification={lastSimulationReport ? 'Simulado' : 'Estimado'}
                    />
                    <ParameterPhysicsCard
                      cardKey="sidepod_inlet"
                      configuredSummary={`Entrada ${vehicleParams.sidepodInletAreaCm2} cm² · Radiador ${vehicleParams.radiatorVolumeL.toFixed(1)} L · Undercut ${vehicleParams.sidepodUndercutPct}%`}
                      simulatedSummary={`Vazão ${vehiclePhysics.massFlowKgS} kg/s · Margem térmica ${vehiclePhysics.thermalMarginC}°C · Arrasto refrig. ${vehiclePhysics.coolingDragN} N`}
                      isSimulationStale={isSimulationStale}
                      classification={lastSimulationReport ? 'Simulado' : 'Estimado'}
                    />
                  </div>
                </div>
              )}

              {/* ============================================================= */}
              {/* MODULE 6: ACTIVE WINGS (CORNER MODE Z <-> STRAIGHT MODE X)    */}
              {/* ============================================================= */}
              {selectedType === 'wings' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-f1-wide font-bold text-white uppercase">Asa Diant. · Modo Z (Curva)</span>
                        <span className="font-f1-mono text-[#E10600] font-bold">{vehicleParams.frontWingFlapCornerDeg}°</span>
                      </div>
                      <input
                        type="range"
                        min={18}
                        max={42}
                        value={vehicleParams.frontWingFlapCornerDeg}
                        onChange={e => updateVehicleParams({ frontWingFlapCornerDeg: Number(e.target.value) })}
                        className="w-full accent-[#E10600] h-1.5 bg-zinc-700"
                      />
                    </div>

                    <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-f1-wide font-bold text-white uppercase">Asa Tras. · Modo Z (Curva)</span>
                        <span className="font-f1-mono text-[#E10600] font-bold">{vehicleParams.rearWingFlapCornerDeg}°</span>
                      </div>
                      <input
                        type="range"
                        min={22}
                        max={48}
                        value={vehicleParams.rearWingFlapCornerDeg}
                        onChange={e => updateVehicleParams({ rearWingFlapCornerDeg: Number(e.target.value) })}
                        className="w-full accent-[#E10600] h-1.5 bg-zinc-700"
                      />
                    </div>

                    <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-f1-wide font-bold text-white uppercase">Asa Diant. · Modo X (Reta)</span>
                        <span className="font-f1-mono text-cyan-400 font-bold">{vehicleParams.frontWingFlapStraightDeg}°</span>
                      </div>
                      <input
                        type="range"
                        min={4}
                        max={18}
                        value={vehicleParams.frontWingFlapStraightDeg}
                        onChange={e => updateVehicleParams({ frontWingFlapStraightDeg: Number(e.target.value) })}
                        className="w-full accent-[#E10600] h-1.5 bg-zinc-700"
                      />
                    </div>

                    <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-f1-wide font-bold text-white uppercase">Asa Tras. · Modo X (Reta)</span>
                        <span className="font-f1-mono text-cyan-400 font-bold">{vehicleParams.rearWingFlapStraightDeg}°</span>
                      </div>
                      <input
                        type="range"
                        min={3}
                        max={16}
                        value={vehicleParams.rearWingFlapStraightDeg}
                        onChange={e => updateVehicleParams({ rearWingFlapStraightDeg: Number(e.target.value) })}
                        className="w-full accent-[#E10600] h-1.5 bg-zinc-700"
                      />
                    </div>
                  </div>

                  {/* Mode Z vs Mode X Live Comparison */}
                  <div className="grid grid-cols-2 gap-3 text-xs font-f1-mono bg-[#15151E] p-3 border border-white/5">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase block font-bold">MODO Z (CURVAS)</span>
                      <span className="text-white font-bold block">
                        DF: {vehiclePhysics.cornerMode.downforceTotalN} N · L/D {vehiclePhysics.cornerMode.aeroEfficiencyLD}
                      </span>
                      <span className="text-emerald-400 text-[11px]">
                        Balanço: {vehiclePhysics.cornerMode.aeroBalanceFrontPct}% Diant.
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase block font-bold">MODO X (RETAS)</span>
                      <span className="text-white font-bold block">
                        Arrasto: {vehiclePhysics.straightMode.dragForceN} N · CdA {vehiclePhysics.straightMode.cdAM2} m²
                      </span>
                      <span className="text-cyan-400 text-[11px]">
                        Redução de Arrasto: -{vehiclePhysics.straightMode.dragReductionPct}%
                      </span>
                    </div>
                  </div>

                  <ParameterPhysicsCard
                    cardKey="active_aero_flaps"
                    configuredSummary={`Modo Z (${vehicleParams.frontWingFlapCornerDeg}°/${vehicleParams.rearWingFlapCornerDeg}°) → Modo X (${vehicleParams.frontWingFlapStraightDeg}°/${vehicleParams.rearWingFlapStraightDeg}°)`}
                    simulatedSummary={`Modo Z L/D ${vehiclePhysics.cornerMode.aeroEfficiencyLD} · Modo X -${vehiclePhysics.straightMode.dragReductionPct}% arrasto`}
                    isSimulationStale={isSimulationStale}
                    classification={lastSimulationReport ? 'Simulado' : 'Estimado'}
                  />
                </div>
              )}

              {/* Max Level Alert */}
              {isMaxLevel && (
                <div className="p-3.5 bg-amber-950/40 border border-amber-500/50 text-amber-200 text-xs font-f1-mono">
                  <div className="flex items-center gap-2 font-f1-wide font-black text-amber-300 uppercase mb-1">
                    <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0" />
                    LIMITE FÍSICO ATINGIDO (NÍVEL 10/10) · RETORNOS DECRESCENTES EXTREMOS
                  </div>
                  <p className="text-[11px] leading-relaxed text-zinc-300">
                    Este componente atingiu o teto físico regulamentar de engenharia.
                  </p>
                </div>
              )}

              {/* Phoenix Bonus Badge */}
              {phoenixDiscountH1 && selectedType === 'pu' && !isMaxLevel && (
                <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-f1-mono flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    BÔNUS DE SOBREVIVÊNCIA FÊNIX (ANO 2): 50% DE DESCONTO EM UPGRADES DE PU ATIVO!
                  </span>
                  <span className="text-[10px] bg-emerald-900/60 px-2 py-0.5 border border-emerald-500/40 text-white font-bold">
                    H1 ATIVO
                  </span>
                </div>
              )}

              {/* Parecer do Chefe de Setor & Escuta Ativa */}
              <div
                className={`p-3.5 border space-y-3 ${
                  chiefFeedback.isDisengaged
                    ? 'bg-red-950/25 border-red-500/40'
                    : chiefFeedback.status === 'critical'
                    ? 'bg-red-950/20 border-[#E10600]/45'
                    : chiefFeedback.status === 'warning'
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : 'bg-[#15151E] border-emerald-500/35'
                }`}
              >
                <div className="flex items-start gap-3">
                  <PersonAvatar
                    role={chiefFeedback.avatarRole}
                    name={chiefFeedback.chiefName}
                    sizeClass="w-12 h-12"
                    accentColor={
                      chiefFeedback.isDisengaged || chiefFeedback.status === 'critical'
                        ? '#E10600'
                        : chiefFeedback.status === 'warning'
                        ? '#F59E0B'
                        : '#10B981'
                    }
                  />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-f1-wide font-black text-white uppercase truncate">
                        {chiefFeedback.chiefName} · <span className="text-zinc-400 font-f1-mono text-[11px]">Nota {chiefFeedback.chiefRating}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 border text-[10px] font-f1-mono font-bold uppercase whitespace-nowrap ${
                          chiefFeedback.isDisengaged
                            ? 'bg-red-950/70 border-red-500/50 text-red-300'
                            : chiefFeedback.chiefTrust >= 70
                            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                            : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                        }`}
                      >
                        {chiefFeedback.isDisengaged
                          ? 'DESENGAJADO'
                          : chiefFeedback.chiefTrust >= 70
                          ? 'ALINHADO'
                          : 'CAUTELOSO'}
                      </span>
                    </div>

                    {/* Trust & Respect progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-f1-mono tabular-nums">
                        <span className="text-zinc-400 uppercase">Confiança / Respeito do Setor</span>
                        <span
                          className={`font-bold ${
                            chiefFeedback.chiefTrust >= 70
                              ? 'text-emerald-400'
                              : chiefFeedback.chiefTrust >= 40
                              ? 'text-amber-300'
                              : 'text-red-400'
                          }`}
                        >
                          {chiefFeedback.chiefTrust}/100 · Ritmo P&D {chiefFeedback.rdSpeedModifierPct >= 0 ? `+${chiefFeedback.rdSpeedModifierPct}%` : `${chiefFeedback.rdSpeedModifierPct}%`}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-black/50 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            chiefFeedback.chiefTrust >= 70
                              ? 'bg-emerald-500'
                              : chiefFeedback.chiefTrust >= 40
                              ? 'bg-amber-400'
                              : 'bg-[#E10600]'
                          }`}
                          style={{ width: `${chiefFeedback.chiefTrust}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-zinc-200 italic leading-relaxed border-t border-white/10 pt-2.5">
                  "{chiefFeedback.quote}"
                </p>

                {chiefFeedback.status !== 'aligned' && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] font-f1-mono text-zinc-300">
                      {chiefFeedback.recommendationSummary}
                    </span>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {chiefFeedback.recommendedPatch && (
                        <button
                          type="button"
                          onClick={() =>
                            respondToChiefAdvice('follow', {
                              chiefId: chiefFeedback.chiefId,
                              chiefName: chiefFeedback.chiefName,
                              adviceKey: chiefFeedback.adviceKey,
                              recommendedPatch: chiefFeedback.recommendedPatch,
                            })
                          }
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-f1-mono font-bold text-[10px] uppercase whitespace-nowrap cursor-pointer transition-colors"
                        >
                          Ouvir & Aplicar Conselho (+10 Confiança)
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          respondToChiefAdvice('ignore', {
                            chiefId: chiefFeedback.chiefId,
                            chiefName: chiefFeedback.chiefName,
                            adviceKey: chiefFeedback.adviceKey,
                          })
                        }
                        className="px-3 py-1.5 bg-[#1C1C26] hover:bg-red-950/60 border border-white/15 text-zinc-300 hover:text-red-200 font-f1-mono font-bold text-[10px] uppercase whitespace-nowrap cursor-pointer transition-colors"
                      >
                        Manter Decisão (-15 Confiança)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Launch Production Bar */}
              <div className="pt-2 border-t border-white/5 space-y-3">
                <div className="bg-[#15151E] border border-white/10 p-2.5 text-[11px] font-f1-mono text-zinc-300 leading-relaxed tabular-nums">
                  Fabricar essa peça custará{' '}
                  <strong className="text-white">${(effectiveCost / 1000000).toFixed(1)}M</strong>
                  {chiefFeedback.atrHoursCost > 0
                    ? ` e consumirá ${chiefFeedback.atrHoursCost} horas de túnel de vento`
                    : ' (0h ATR de túnel)'}
                  .{' '}
                  <span
                    className={
                      chiefFeedback.isDisengaged
                        ? 'text-red-300 font-bold'
                        : chiefFeedback.status === 'aligned'
                        ? 'text-emerald-300 font-bold'
                        : 'text-amber-300 font-bold'
                    }
                  >
                    {chiefFeedback.chiefName}{' '}
                    {chiefFeedback.isDisengaged
                      ? 'está desengajado (+10% prazo).'
                      : chiefFeedback.status === 'aligned'
                      ? 'está ansioso para testar (+5% vel. P&D).'
                      : 'recomenda revisão técnica antes de aprovar.'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs font-f1-mono text-zinc-400 space-y-0.5 tabular-nums">
                    <div>
                      {t.estCapex}: <span className="text-white font-bold">${(effectiveCost / 1000000).toFixed(1)}M</span>{' '}
                      {phoenixDiscountH1 && selectedType === 'pu' && <span className="text-emerald-400 font-bold">(-50%)</span>} ·{' '}
                      {chiefFeedback.atrHoursCost > 0 && (
                        <>
                          ATR: <span className="text-cyan-300 font-bold">{chiefFeedback.atrHoursCost}h</span> ·{' '}
                        </>
                      )}
                      {t.leadTime}:{' '}
                      <span className="text-white font-bold">
                        {Math.max(
                          1,
                          Math.round(
                            prototypeSpec.leadWeeks *
                              modificadorTempoManufatura *
                              modificadorTempoPeD *
                              (chiefFeedback.isDisengaged ? 1.1 : chiefFeedback.status === 'aligned' ? 0.95 : 1.0)
                          )
                        )}{' '}
                        {language === 'pt' ? 'SEMANAS' : 'WEEKS'}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-500 font-f1-mono">
                      Fórmula: TempoFinal = Base ({prototypeSpec.leadWeeks} sem) × Manufatura (x{modificadorTempoManufatura.toFixed(2)}) × P&D (x{modificadorTempoPeD.toFixed(2)})
                      {chiefFeedback.rdSpeedModifierPct !== 0
                        ? ` × Engenheiro (${chiefFeedback.rdSpeedModifierPct > 0 ? '-5%' : '+10%'})`
                        : ''}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleLaunchProject}
                    disabled={cannotLaunchCad || (chiefFeedback.atrHoursCost > 0 && financials.atrWindTunnelHoursAvailable < chiefFeedback.atrHoursCost)}
                    className={`w-full sm:w-auto px-6 py-2.5 font-f1-wide font-bold text-xs uppercase tracking-wider f1-tab-chamfer transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap ${
                      cannotLaunchCad || (chiefFeedback.atrHoursCost > 0 && financials.atrWindTunnelHoursAvailable < chiefFeedback.atrHoursCost)
                        ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                        : 'bg-[#E10600] hover:bg-[#c20500] text-white cursor-pointer'
                    }`}
                  >
                    <Cpu className="w-4 h-4" />
                    <span>
                      {isMaxLevel
                        ? language === 'pt'
                          ? 'LIMITE FÍSICO ATINGIDO (NÍVEL 10)'
                          : 'MAX LEVEL (LEVEL 10)'
                        : aeroSlotsFull
                        ? `TÚNEL DE VENTO LOTADO (${activeAeroCount}/${rdFacilityCapacity.aeroMaxSlots})`
                        : mfgSlotsFull
                        ? `SLOTS DE FÁBRICA LOTADOS (${activeMfgCount}/${rdFacilityCapacity.manufacturingMaxSlots})`
                        : chiefFeedback.atrHoursCost > 0 && financials.atrWindTunnelHoursAvailable < chiefFeedback.atrHoursCost
                        ? `HORAS ATR INSUFICIENTES (${chiefFeedback.atrHoursCost}h)`
                        : t.startCadBtn}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </F1TabBucket>
        </div>

        {/* Right Column: Multi-Physics Simulation (CFD / FEA / Thermal / Pareto / Checklist) (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <F1TabBucket
            title={t.windTunnelTitle}
            badge={lastSimulationReport ? (lastSimulationReport.approved ? 'APROVADO FIA/CAE' : 'ALERTAS CAE') : 'BANCADA CAE'}
          >
            <div className="space-y-4">
              {/* ATR Hours Control */}
              <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-f1-wide font-bold text-white uppercase">
                    {language === 'pt' ? 'HORAS ATR NO TÚNEL / CFD / FEA' : 'ATR TUNNEL / CFD / FEA HOURS'}
                  </span>
                  <span className="font-f1-mono text-[#E10600] font-bold tabular-nums">{testAtrHours}h</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={80}
                  step={5}
                  value={testAtrHours}
                  onChange={e => setTestAtrHours(Number(e.target.value))}
                  className="w-full accent-[#E10600] h-1.5 bg-zinc-700"
                />
                <div className="flex justify-between text-[10px] font-f1-mono text-zinc-400">
                  <span>Varredura Rápida (10h)</span>
                  <span>Modificador DNA: {modificadorErroCorrelacao !== 0 ? `${(modificadorErroCorrelacao * 100).toFixed(0)}%` : '0%'}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRunWindTunnel}
                disabled={financials.atrWindTunnelHoursAvailable < testAtrHours}
                className="w-full py-2.5 bg-[#252533] hover:bg-[#2F2F40] disabled:opacity-40 border border-white/10 text-white font-f1-wide font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Wind className="w-4 h-4 text-[#E10600]" />
                <span>Executar Simulação Multifísica (CFD + FEA + Térmica)</span>
              </button>

              {/* Compact Multi-Physics Sub-Tabs */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 bg-[#15151E] p-1 border border-white/10 text-[10px] font-f1-mono">
                {(
                  [
                    { id: 'correlation', label: 'FIA/Corr.' },
                    { id: 'cfd', label: 'CFD' },
                    { id: 'fea', label: 'FEA' },
                    { id: 'thermal', label: 'Térmica' },
                    { id: 'pareto', label: 'Pareto' },
                    { id: 'checklist', label: '12/12' }
                  ] as { id: SimSubTab; label: string }[]
                ).map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSimSubTab(tab.id)}
                    className={`py-1.5 text-center uppercase font-bold transition-colors cursor-pointer ${
                      simSubTab === tab.id ? 'bg-[#E10600] text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* SUB-TAB 1: CORRELATION & FIA COMPLIANCE */}
              {simSubTab === 'correlation' && (
                <div className="space-y-3 text-xs font-f1-mono">
                  <div
                    className={`p-3 border ${
                      regulatoryLive.compliant
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                        : 'bg-red-950/30 border-red-500/40 text-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        CONFORMIDADE FIA 2026
                      </span>
                      <span>{regulatoryLive.compliant ? 'LEGAL' : `${regulatoryLive.violations.length} VIOLAÇÃO(ÕES)`}</span>
                    </div>
                    {regulatoryLive.violations.map((v, i) => (
                      <div key={i} className="text-[11px] text-red-300 mt-1">
                        • {v.article} ({v.parameter}): {v.measuredValue} [Limite: {v.limitValue}]
                      </div>
                    ))}
                    {regulatoryLive.warnings.map((w, i) => (
                      <div key={i} className="text-[11px] text-amber-300 mt-1">
                        • {w}
                      </div>
                    ))}
                  </div>

                  {windTunnelResult && lastSimulationReport ? (
                    <div className="space-y-3">
                      <div className="bg-[#15151E] p-3 border border-white/10 space-y-2 f1-pattern-micro-grid">
                        <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                          <span className="font-f1-wide font-bold text-white">TELEMETRIA DE CORRELAÇÃO</span>
                          <span className={lastSimulationReport.approved ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                            {lastSimulationReport.approved ? 'APROVADO' : 'REVISAR'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 tabular-nums">
                          <div className="bg-[#1C1C26] p-2 border border-white/5">
                            <span className="text-[10px] text-zinc-400 block">DOWNFORCE MODO Z</span>
                            <span className="text-white font-bold">{lastSimulationReport.physics.cornerMode.downforceTotalN} N</span>
                          </div>
                          <div className="bg-[#1C1C26] p-2 border border-white/5">
                            <span className="text-[10px] text-zinc-400 block">EFICIÊNCIA L/D</span>
                            <span className="text-cyan-400 font-bold">{lastSimulationReport.physics.cornerMode.aeroEfficiencyLD}</span>
                          </div>
                          <div className="bg-[#1C1C26] p-2 border border-white/5">
                            <span className="text-[10px] text-zinc-400 block">ERRO DE CORRELAÇÃO</span>
                            <span className="text-amber-400 font-bold">±{lastSimulationReport.finalCorrelationErrorPct}%</span>
                          </div>
                          <div className="bg-[#1C1C26] p-2 border border-white/5">
                            <span className="text-[10px] text-zinc-400 block">RISCO PORPOISING</span>
                            <span className="text-white font-bold">{lastSimulationReport.physics.porpoisingRiskPct}%</span>
                          </div>
                        </div>
                      </div>

                      {lastSimulationReport.pilotReport && (() => {
                        const pr = lastSimulationReport.pilotReport;
                        const liveDriverTrust = leadDriver?.trust ?? pr.trustRating;
                        const verdictLabel =
                          pr.handlingVerdict === 'estavel'
                            ? 'ESTÁVEL'
                            : pr.handlingVerdict === 'nervoso'
                            ? 'NERVOSO'
                            : pr.handlingVerdict === 'rigido'
                            ? 'RÍGIDO'
                            : 'CRÍTICO';
                        const verdictCls =
                          pr.handlingVerdict === 'estavel'
                            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                            : pr.handlingVerdict === 'critico'
                            ? 'bg-red-950/60 border-red-500/40 text-red-300'
                            : 'bg-amber-950/60 border-amber-500/40 text-amber-300';

                        return (
                          <div className="bg-[#15151E] p-3 border border-cyan-500/35 space-y-2.5">
                            <div className="flex items-start gap-3">
                              <PersonAvatar
                                role="driver"
                                name={pr.driverName}
                                sizeClass="w-11 h-11"
                                accentColor="#22D3EE"
                              />
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="font-f1-wide font-bold text-[11px] text-white uppercase truncate">
                                    Relatório do Simulador ({pr.driverName})
                                  </span>
                                  <span className={`px-2 py-0.5 border text-[9px] font-bold uppercase whitespace-nowrap ${verdictCls}`}>
                                    {verdictLabel}
                                  </span>
                                </div>
                                <div className="space-y-1 tabular-nums">
                                  <div className="flex justify-between text-[10px] text-zinc-400">
                                    <span>Confiança do Piloto · Feedback {pr.feedbackRating}/99</span>
                                    <span className="text-cyan-300 font-bold">{liveDriverTrust}/100</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-black/50 overflow-hidden">
                                    <div
                                      className={`h-full transition-all duration-300 ${
                                        liveDriverTrust >= 70
                                          ? 'bg-cyan-400'
                                          : liveDriverTrust >= 40
                                          ? 'bg-amber-400'
                                          : 'bg-[#E10600]'
                                      }`}
                                      style={{ width: `${liveDriverTrust}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            <p className="text-[11px] text-zinc-200 italic leading-relaxed border-t border-white/10 pt-2">
                              "{pr.quote}"
                            </p>
                            <div className="text-[10px] text-cyan-300">{pr.suggestedAdjustment}</div>

                            {pr.recommendedParamsPatch && (
                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    respondToDriverFeedback(
                                      'listen',
                                      pr.driverId,
                                      `sim_${lastSimulationReport.timestamp}`,
                                      { vehiclePatch: pr.recommendedParamsPatch }
                                    )
                                  }
                                  className="px-2.5 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-[10px] uppercase whitespace-nowrap cursor-pointer transition-colors"
                                >
                                  Aplicar Ajuste do Piloto (+8 Confiança)
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    respondToDriverFeedback(
                                      'ignore',
                                      pr.driverId,
                                      `sim_${lastSimulationReport.timestamp}`
                                    )
                                  }
                                  className="px-2.5 py-1.5 bg-[#1C1C26] hover:bg-red-950/60 border border-white/15 text-zinc-300 hover:text-red-200 font-bold text-[10px] uppercase whitespace-nowrap cursor-pointer transition-colors"
                                >
                                  Ignorar (-12 Confiança)
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="p-3 bg-[#15151E] border border-white/5 text-zinc-400 text-[11px]">
                      Execute a simulação multifísica acima para validar correlação CFD/FEA/Térmica e obter o parecer completo dos 7 engenheiros especialistas.
                    </div>
                  )}
                </div>
              )}

              {/* SUB-TAB 2: CFD REPORT */}
              {simSubTab === 'cfd' && (
                <div className="bg-[#15151E] p-3 border border-white/10 space-y-2.5 text-xs font-f1-mono">
                  <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                    <span className="font-f1-wide font-bold text-white">RELATÓRIO CFD (250 KM/H)</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-cyan-950/50 border border-cyan-500/30 text-cyan-300">
                      {lastSimulationReport ? lastSimulationReport.cfd.classification : 'Estimado em Tempo Real'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#1C1C26] p-2 border border-white/5">
                      <span className="text-[10px] text-zinc-400 block">SUCÇÃO ASSOALHO</span>
                      <span className="text-emerald-400 font-bold">
                        {lastSimulationReport ? lastSimulationReport.cfd.pressureMap.floorThroatSuctionKpa : (-5.8 - (24 / Math.max(12, vehicleParams.frontRideHeightMm)) * 2.1).toFixed(2)} kPa
                      </span>
                    </div>
                    <div className="bg-[#1C1C26] p-2 border border-white/5">
                      <span className="text-[10px] text-zinc-400 block">PICO VELOCIDADE FLUXO</span>
                      <span className="text-white font-bold">
                        {lastSimulationReport ? lastSimulationReport.cfd.flowVelocityPeakMs : (vehiclePhysics.referenceSpeedMs * 1.38).toFixed(1)} m/s
                      </span>
                    </div>
                    <div className="bg-[#1C1C26] p-2 border border-white/5">
                      <span className="text-[10px] text-zinc-400 block">DIVISÃO DF (F / ASS / T)</span>
                      <span className="text-cyan-300 font-bold">
                        {lastSimulationReport
                          ? `${lastSimulationReport.cfd.downforceSplitPct.frontWing}% / ${lastSimulationReport.cfd.downforceSplitPct.floor}% / ${lastSimulationReport.cfd.downforceSplitPct.rearWing}%`
                          : `${vehiclePhysics.cornerMode.aeroBalanceFrontPct}% Diant.`}
                      </span>
                    </div>
                    <div className="bg-[#1C1C26] p-2 border border-white/5">
                      <span className="text-[10px] text-zinc-400 block">SENSIB. ALTURA / YAW</span>
                      <span className="text-amber-300 font-bold">
                        {vehiclePhysics.rideHeightSensitivityNPerMm} N/mm · {vehiclePhysics.yawSensitivityPct}%
                      </span>
                    </div>
                  </div>
                  {lastSimulationReport && (
                    <div className="text-[11px] text-zinc-300 bg-[#1C1C26] p-2 border border-white/5">
                      <span className="text-[10px] text-zinc-400 uppercase block font-bold">Zonas de Separação:</span>
                      {lastSimulationReport.cfd.separationZones.join(' · ')}
                    </div>
                  )}
                </div>
              )}

              {/* SUB-TAB 3: FEA & COMPOSITE STRUCTURES */}
              {simSubTab === 'fea' && (
                <div className="bg-[#15151E] p-3 border border-white/10 space-y-2.5 text-xs font-f1-mono">
                  <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                    <span className="font-f1-wide font-bold text-white">ANÁLISE FEA & LAMINADOS</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-purple-950/50 border border-purple-500/30 text-purple-300">
                      {lastSimulationReport ? lastSimulationReport.fea.classification : 'Estimado CLT'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#1C1C26] p-2 border border-white/5">
                      <span className="text-[10px] text-zinc-400 block">RIGIDEZ TORCIONAL</span>
                      <span className="text-white font-bold">{vehiclePhysics.torsionalStiffnessNmDeg.toLocaleString()} N·m/°</span>
                    </div>
                    <div className="bg-[#1C1C26] p-2 border border-white/5">
                      <span className="text-[10px] text-zinc-400 block">TENSÃO MÁX. / FS FLAMB.</span>
                      <span className="text-amber-300 font-bold">
                        {vehiclePhysics.maxLaminateStressMpa} MPa · {vehiclePhysics.bucklingSafetyFactor}x
                      </span>
                    </div>
                    <div className="bg-[#1C1C26] p-2 border border-white/5">
                      <span className="text-[10px] text-zinc-400 block">MODO NATURAL / FADIGA</span>
                      <span className="text-cyan-300 font-bold">
                        {lastSimulationReport ? lastSimulationReport.fea.firstNaturalModeHz : 36.2} Hz · {vehiclePhysics.fatigueLifeRaces} GPs
                      </span>
                    </div>
                    <div className="bg-[#1C1C26] p-2 border border-white/5">
                      <span className="text-[10px] text-zinc-400 block">DELAMINAÇÃO / IMPACTO</span>
                      <span className={vehiclePhysics.delaminationRiskPct > 30 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {vehiclePhysics.delaminationRiskPct}% · {vehiclePhysics.impactAbsorptionMarginPct}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 4: THERMAL & ENERGY BALANCE */}
              {simSubTab === 'thermal' && (
                <div className="bg-[#15151E] p-3 border border-white/10 space-y-2.5 text-xs font-f1-mono">
                  <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                    <span className="font-f1-wide font-bold text-white flex items-center gap-1.5">
                      <Thermometer className="w-3.5 h-3.5 text-[#E10600]" />
                      BALANÇO TÉRMICO & JOULE (I²R)
                    </span>
                    <span className={vehiclePhysics.thermalMarginC < 4 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                      Margem: {vehiclePhysics.thermalMarginC}°C
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#1C1C26] p-2 border border-white/5">
                      <span className="text-[10px] text-zinc-400 block">TEMP. ICE / BATERIA ERS</span>
                      <span className="text-white font-bold">
                        {vehiclePhysics.iceOperatingTempC}°C / {vehiclePhysics.batteryCellTempC}°C
                      </span>
                    </div>
                    <div className="bg-[#1C1C26] p-2 border border-white/5">
                      <span className="text-[10px] text-zinc-400 block">ÓLEO CÂMBIO / PERDAS I²R</span>
                      <span className="text-amber-300 font-bold">
                        {vehiclePhysics.gearboxOilTempC}°C / {vehiclePhysics.batteryJouleLossesKw} kW
                      </span>
                    </div>
                    <div className="bg-[#1C1C26] p-2 border border-white/5">
                      <span className="text-[10px] text-zinc-400 block">CALOR GERADO VS RADIADOR</span>
                      <span className="text-cyan-300 font-bold">
                        {vehiclePhysics.totalPuHeatKw} kW vs {vehiclePhysics.radiatorHeatRejectionKw} kW
                      </span>
                    </div>
                    <div className="bg-[#1C1C26] p-2 border border-white/5">
                      <span className="text-[10px] text-zinc-400 block">ARRASTO DE REFRIGERAÇÃO</span>
                      <span className="text-white font-bold">{vehiclePhysics.coolingDragN} N</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 5: MDO PARETO FRONTIER (5 NON-DOMINATED SOLUTIONS) */}
              {simSubTab === 'pareto' && (
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 text-xs font-f1-mono">
                  <div className="text-[11px] text-zinc-400">
                    Soluções não-dominadas da Fronteira de Pareto (MDO). Aplicar um conceito recalibra múltiplos subsistemas com trade-offs reais:
                  </div>
                  {paretoSolutions.map(sol => (
                    <div key={sol.id} className="bg-[#15151E] p-3 border border-white/10 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="font-f1-wide font-bold text-white uppercase block">{sol.label}</span>
                          <span className="text-[10px] text-zinc-400">{sol.subtitle}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateVehicleParams(sol.paramsPatch)}
                          className="px-2.5 py-1 bg-[#252533] hover:bg-[#E10600] text-white text-[10px] font-bold uppercase border border-white/10 cursor-pointer shrink-0 transition-colors"
                        >
                          Aplicar
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 text-[10px] bg-[#1C1C26] p-1.5 border border-white/5">
                        <div>
                          <span className="text-zinc-500 block">Δ Volta</span>
                          <span className={sol.metrics.estimatedLapDeltaSec <= 0 ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold'}>
                            {sol.metrics.estimatedLapDeltaSec > 0 ? '+' : ''}
                            {sol.metrics.estimatedLapDeltaSec}s
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block">L/D</span>
                          <span className="text-white font-bold">{sol.metrics.aeroEfficiencyLD}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block">Massa</span>
                          <span className="text-cyan-300 font-bold">{sol.metrics.totalMassKg}kg</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block">Térm.</span>
                          <span className={sol.metrics.thermalMarginC < 4 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                            {sol.metrics.thermalMarginC}°C
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-amber-200/80">{sol.tradeoffNote}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* SUB-TAB 6: 12/12 ENGINEERING DESIGN CHECKLIST */}
              {simSubTab === 'checklist' && (
                <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1 text-xs font-f1-mono">
                  {lastSimulationReport ? (
                    <>
                      <div className="flex items-center justify-between bg-[#15151E] p-2.5 border border-white/10">
                        <span className="font-f1-wide font-bold text-white uppercase">CHECKLIST DE ENGENHARIA</span>
                        <span className={lastSimulationReport.checklistScore === 12 ? 'text-emerald-400 font-black' : 'text-amber-400 font-black'}>
                          {lastSimulationReport.checklistScore} / 12 APROVADOS
                        </span>
                      </div>
                      {lastSimulationReport.checklist.map(item => (
                        <div key={item.id} className="bg-[#15151E] p-2 border border-white/5 flex items-start justify-between gap-2">
                          <div>
                            <span className="text-white font-bold block">
                              {item.id}. {item.criterion}
                            </span>
                            <span className="text-[10px] text-zinc-400">{item.detail}</span>
                          </div>
                          <span className={`text-[10px] font-bold shrink-0 ${item.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                            {item.passed ? 'OK' : 'FALHA'}
                          </span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="p-3 bg-[#15151E] border border-white/5 text-zinc-400 text-[11px]">
                      Rode uma Simulação Multifísica para preencher os 12 critérios do Checklist Integrado de Concepção Veicular.
                    </div>
                  )}
                </div>
              )}
            </div>
          </F1TabBucket>

          {/* Next Year Research Window (Round 12+) */}
          {currentWeek >= 12 && (
            <F1TabBucket
              title={language === 'pt' ? 'JANELA DE PESQUISA · PRÓXIMO ANO' : 'NEXT YEAR RESEARCH WINDOW'}
              badge={language === 'pt' ? 'RODADA 12+ ABERTA' : 'ROUND 12+ OPEN'}
            >
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-f1-wide font-bold text-white uppercase block">
                      Alocar ATR para Pesquisa do Próximo Ano
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Divide os recursos computacionais do túnel e CFD entre o carro atual e a transição regulamentar da próxima temporada.
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 font-f1-mono text-sm font-bold border tabular-nums shrink-0 ${
                      atrNextYearAllocationRatio < 0.4
                        ? 'bg-red-950/40 border-red-500/40 text-red-400'
                        : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                    }`}
                  >
                    {Math.round(atrNextYearAllocationRatio * 100)}% ATR ALOCADO
                  </span>
                </div>

                <div className="space-y-2">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={Math.round(atrNextYearAllocationRatio * 100)}
                    onChange={e => setAtrNextYearAllocationRatio(Number(e.target.value) / 100)}
                    className="w-full accent-[#E10600] h-2 bg-zinc-700 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-f1-mono text-zinc-400">
                    <span>0% (Foco Total Ano 1)</span>
                    <span className="text-amber-400 font-bold">40% (Mínimo Seguro FIA)</span>
                    <span>100% (Abandono do Ano Atual)</span>
                  </div>
                </div>
              </div>
            </F1TabBucket>
          )}

          {/* Active Homologation Specification Summary (Live SI Physics) */}
          <F1TabBucket title="ACTIVE HOMOLOGATION SPECIFICATION" badge={`CHASSI ${playerTeam.carModelName || 'APX-01'}`}>
            <div className="space-y-2 text-xs font-f1-mono divide-y divide-white/5">
              <div className="flex justify-between py-1.5 gap-3">
                <span className="text-zinc-400">CHASSI HOMOLOGADO:</span>
                <span className="text-white font-bold uppercase">{playerTeam.carModelName || 'APX-01'}</span>
              </div>
              <div className="flex justify-between py-1.5 gap-3">
                <span className="text-zinc-400">POWER UNIT SUPPLIER:</span>
                <span className="text-white font-bold text-right tabular-nums">
                  {playerTeam.engineCustomName || playerTeam.engineSupplier}
                  {playerTeam.thirdPartyErsSupplier && !(playerTeam.engineCustomName || '').includes(playerTeam.thirdPartyErsSupplier)
                    ? ` + ERS ${playerTeam.thirdPartyErsSupplier}`
                    : ''}{' '}
                  ({playerTeam.homologatedPeakPowerHp ?? vehiclePhysics.peakCombinedPowerHp} CV)
                </span>
              </div>
              <div className="flex justify-between py-1.5 gap-3">
                <span className="text-zinc-400">MASSA TOTAL (MÍN. FIA 768 kg):</span>
                <span className="text-white font-bold tabular-nums">
                  {vehiclePhysics.totalMassKg} kg ({vehiclePhysics.weightDistFrontPct}% Diant.)
                </span>
              </div>
              <div className="flex justify-between py-1.5 gap-3">
                <span className="text-zinc-400">DIVISÃO TÉRMICA / ERS 2026:</span>
                <span className="text-white font-bold text-right tabular-nums">
                  {vehiclePhysics.effectiveIcePowerKw} kW ICE / 350 kW ERS Pico ({vehiclePhysics.totalWheelPowerHp} CV na roda)
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-zinc-400">AERO ATIVA (MODO Z / MODO X):</span>
                <span className="text-white font-bold">
                  L/D {vehiclePhysics.cornerMode.aeroEfficiencyLD} / -{vehiclePhysics.straightMode.dragReductionPct}% CdA
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-zinc-400">MARGEM TÉRMICA / JANELA PNEU:</span>
                <span className={`font-bold ${vehiclePhysics.thermalMarginC < 4 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {vehiclePhysics.thermalMarginC}°C / {vehiclePhysics.tireThermalWindowHealthPct}% Saúde
                </span>
              </div>
            </div>
          </F1TabBucket>

          {/* 6-Axis Radar Comparison vs Selected Rival */}
          <F1TabBucket title="COMPARATIVO RADAR VS RIVAIS (6 EIXOS)" badge="DESEMPENHO RELATIVO">
            <CarRadarComparisonChart
              playerTeam={playerTeam}
              allTeams={allTeams}
              vehicleParams={vehicleParams}
              vehiclePhysics={vehiclePhysics}
              components={components}
              correlationErrorPct={
                lastSimulationReport?.finalCorrelationErrorPct ??
                Math.max(
                  4,
                  Math.round(
                    (16 - rdFacilityCapacity.windTunnelLevel * 2 - rdFacilityCapacity.cfdLevel * 1.5) * 10
                  ) / 10
                )
              }
              leadDriverFeedback={leadDriver?.attributes?.feedback}
              upgradeTimeline={upgradeTimeline}
            />
          </F1TabBucket>
        </div>
      </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BRIEFING DOS 7 ENGENHEIROS ESPECIALISTAS                            */}
      {/* ========================================================================= */}
      {showBriefingModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-5xl w-full bg-[#15151E] border-2 border-[#E10600]/80 p-6 f1-container-bucket shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="font-f1-mono text-[10px] text-[#E10600] font-bold uppercase tracking-widest">
                  ENGENHARIA INTEGRADA · PARECER TÉCNICO MULTIDISCIPLINAR
                </span>
                <h3 className="font-f1-wide font-black text-lg text-white uppercase">
                  Briefing dos 7 Engenheiros Especialistas
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBriefingModal(false)}
                className="p-1.5 text-zinc-400 hover:text-white border border-white/10 bg-[#1C1C26] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!lastSimulationReport ? (
              <div className="p-6 bg-[#1C1C26] border border-white/10 text-center space-y-3 font-f1-mono text-xs">
                <p className="text-zinc-300">
                  Nenhuma rodada de Simulação Multifísica foi executada ainda para esta configuração.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    handleRunWindTunnel();
                  }}
                  disabled={financials.atrWindTunnelHoursAvailable < testAtrHours}
                  className="px-5 py-2.5 bg-[#E10600] hover:bg-[#c20500] text-white font-f1-wide font-bold uppercase cursor-pointer"
                >
                  Executar Simulação Agora ({testAtrHours}h ATR)
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {lastSimulationReport.consequenceChain.length > 0 && (
                  <div className="bg-amber-950/25 border border-amber-500/40 p-3 text-xs font-f1-mono space-y-1">
                    <span className="text-amber-300 font-bold uppercase block">Cadeias de Consequência Cruzadas Detectadas:</span>
                    {lastSimulationReport.consequenceChain.map((c, idx) => (
                      <div key={idx} className="text-amber-100">• {c}</div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {lastSimulationReport.diagnostics.map(diag => (
                    <div key={diag.specialistRole} className="bg-[#1C1C26] p-4 border border-white/10 space-y-2 text-xs font-f1-mono">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <div>
                          <span className="text-[10px] text-[#E10600] font-bold uppercase block">{diag.specialistRole}</span>
                          <span className="font-f1-wide font-bold text-white">{diag.specialistName} (Rating {diag.competenceRating})</span>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 font-bold border ${
                            diag.riskLevel === 'Crítico'
                              ? 'bg-red-950/60 border-red-500 text-red-300'
                              : diag.riskLevel === 'Alto'
                              ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                              : 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                          }`}
                        >
                          Risco {diag.riskLevel} · ±{diag.uncertaintyPct}%
                        </span>
                      </div>

                      <p className="text-white font-bold">{diag.diagnostic}</p>
                      <p className="text-[11px] text-zinc-400">
                        <strong className="text-zinc-300">Hipótese Física:</strong> {diag.physicalHypothesis}
                      </p>
                      <p className="text-[11px] text-cyan-300">
                        <strong className="text-zinc-300">Evidência:</strong> {diag.availableEvidence}
                      </p>
                      <p className="text-[11px] text-emerald-300">
                        <strong className="text-zinc-300">Solução Recomendada:</strong> {diag.recommendedSolution}{' '}
                        {diag.estimatedCostUsd > 0 && `(Est. $${(diag.estimatedCostUsd / 1e6).toFixed(1)}M)`}
                      </p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {diag.dependencies.map(dep => (
                          <span key={dep} className="text-[9px] px-1.5 py-0.5 bg-[#15151E] border border-white/10 text-zinc-400">
                            {dep}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CATÁLOGO DE FÍSICA (79 FENÔMENOS & FONTES DE DADOS)                */}
      {/* ========================================================================= */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-5xl w-full bg-[#15151E] border-2 border-cyan-500/60 p-6 f1-container-bucket shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="font-f1-mono text-[10px] text-cyan-400 font-bold uppercase tracking-widest">
                  BASE DE CONHECIMENTO FÍSICO · {PHYSICS_PHENOMENA_CATALOG.length} FENÔMENOS CATALOGADOS
                </span>
                <h3 className="font-f1-wide font-black text-lg text-white uppercase">
                  Modelo Físico, Equações & Fontes Públicas
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="p-1.5 text-zinc-400 hover:text-white border border-white/10 bg-[#1C1C26] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 text-xs font-f1-mono">
              {['ALL', 'Aerodinâmica', 'Dinâmica dos Fluidos', 'Termodinâmica', 'Estruturas', 'Dinâmica Veicular', 'Pneus'].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setCatalogDisciplineFilter(d)}
                  className={`px-2.5 py-1 border cursor-pointer ${
                    catalogDisciplineFilter === d
                      ? 'bg-[#E10600] border-[#E10600] text-white font-bold'
                      : 'bg-[#1C1C26] border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  {d === 'ALL' ? `Todos (${PHYSICS_PHENOMENA_CATALOG.length})` : d}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[45vh] overflow-y-auto pr-1 text-xs font-f1-mono">
              {filteredPhenomena.map(ph => (
                <div key={ph.id} className="bg-[#1C1C26] p-3 border border-white/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400 font-bold">{ph.id} · {ph.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-[#15151E] border border-white/10 text-zinc-300">
                      {ph.confidence}
                    </span>
                  </div>
                  <div className="text-[10px] text-amber-300 font-bold">{ph.equations}</div>
                  <div className="text-[11px] text-zinc-300">{ph.consequence}</div>
                  <div className="text-[10px] text-zinc-500">Limitação: {ph.limitations} · {ph.source}</div>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-3">
              <span className="text-[10px] font-f1-mono text-zinc-400 uppercase font-bold block mb-2">
                Referências Científicas & Dados Abertos Suportados
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] font-f1-mono">
                {COMMUNITY_DATA_SOURCES.map(src => (
                  <div key={src.id} className="bg-[#1C1C26] p-2 border border-white/5">
                    <span className="text-white font-bold block">{src.name} ({src.priority})</span>
                    <span className="text-zinc-400 block mt-0.5">{src.scope}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BANCADA DE MONTAGEM ADUO                                           */}
      {/* ========================================================================= */}
      {showAduoBenchModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-4xl w-full bg-[#15151E] border-2 border-amber-500/80 p-6 f1-container-bucket shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/20 border border-amber-500 flex items-center justify-center shrink-0">
                  <Wrench className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-f1-mono text-[10px] text-amber-400 font-bold uppercase tracking-widest">
                      FIA 2026 TECHNICAL REGULATIONS · ADUO BENCH
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 font-bold uppercase">
                      {aduoHomologationQuotas} COTA(S) RESTANTE(S)
                    </span>
                  </div>
                  <h3 className="font-f1-wide font-black text-lg sm:text-xl text-white uppercase tracking-wider">
                    BANCADA DE MONTAGEM DE MOTOR (JANELA ADUO)
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAduoBenchModal(false)}
                className="p-1.5 text-zinc-400 hover:text-white border border-white/10 hover:border-white/20 bg-[#1C1C26] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-950/40 border-2 border-amber-500/70 p-3.5 text-xs font-f1-mono text-amber-200 flex items-start gap-3 shadow-md">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-f1-wide font-bold uppercase text-amber-300 block">
                  AVISO REGULAMENTAR FIA · PENALIDADE DE EMPACOTAMENTO
                </span>
                <p className="text-[11px] text-zinc-200 leading-relaxed">
                  Alterações no motor durante a janela ADUO adicionam <strong>+3 semanas de atraso</strong> no desenvolvimento do chassi enquanto suportes e tubulações são recalculados.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-f1-mono bg-[#1C1C26] p-3.5 border border-white/10">
              <div className="border-r border-white/5 pr-2">
                <span className="text-[10px] text-zinc-400 uppercase block">Potência Atual:</span>
                <span className="font-f1-wide font-black text-base text-white">{aduoPlayerPwr} PWR</span>
              </div>
              <div className="border-r border-white/5 pr-2">
                <span className="text-[10px] text-zinc-400 uppercase block">Ganho Estimado:</span>
                <span className="font-f1-wide font-black text-base text-emerald-400">+{pwrGain} PWR</span>
              </div>
              <div className="border-r border-white/5 pr-2">
                <span className="text-[10px] text-zinc-400 uppercase block">Nova Potência:</span>
                <span className="font-f1-wide font-black text-base text-cyan-400">{projectedPwr} PWR</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase block">Déficit p/ Benchmark:</span>
                <span className="font-f1-wide font-black text-base text-amber-400">{projectedGap}% (era {aduoLastGapPercent}%)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#1C1C26] p-4 border border-white/10 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-f1-mono">
                    <span className="text-zinc-300 font-bold">1. Eficiência Térmica vs Potência Pura</span>
                    <span className="text-amber-400 font-bold">{aduoIceEficPot}%</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={80}
                    value={aduoIceEficPot}
                    onChange={e => setAduoIceEficPot(Number(e.target.value))}
                    className="w-full accent-[#E10600] h-2 bg-[#252533] cursor-pointer"
                  />
                </div>
                <div className="space-y-1.5 pt-2 border-t border-white/5">
                  <div className="flex justify-between text-xs font-f1-mono">
                    <span className="text-zinc-300 font-bold">2. Materiais do Bloco</span>
                    <span className="text-cyan-400 font-bold">{aduoIceBloco}%</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={80}
                    value={aduoIceBloco}
                    onChange={e => setAduoIceBloco(Number(e.target.value))}
                    className="w-full accent-[#E10600] h-2 bg-[#252533] cursor-pointer"
                  />
                </div>
                <div className="space-y-1.5 pt-2 border-t border-white/5">
                  <div className="flex justify-between text-xs font-f1-mono">
                    <span className="text-zinc-300 font-bold">3. Diâmetro do Turbo</span>
                    <span className="text-[#E10600] font-bold">{aduoIceTurbo}%</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={80}
                    value={aduoIceTurbo}
                    onChange={e => setAduoIceTurbo(Number(e.target.value))}
                    className="w-full accent-[#E10600] h-2 bg-[#252533] cursor-pointer"
                  />
                </div>
                <div className="space-y-1.5 pt-2 border-t border-white/5">
                  <div className="flex justify-between text-xs font-f1-mono">
                    <span className="text-zinc-300 font-bold">4. Curva de Torque</span>
                    <span className="text-emerald-400 font-bold">{aduoIceTorque}%</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={80}
                    value={aduoIceTorque}
                    onChange={e => setAduoIceTorque(Number(e.target.value))}
                    className="w-full accent-[#E10600] h-2 bg-[#252533] cursor-pointer"
                  />
                </div>
              </div>

              <div className="bg-[#1C1C26] p-4 border border-white/10 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-f1-mono">
                    <span className="text-zinc-300 font-bold">5. Mapeamento E-Fuel</span>
                    <span className="text-amber-400 font-bold">{aduoIceCombustivel}%</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={80}
                    value={aduoIceCombustivel}
                    onChange={e => setAduoIceCombustivel(Number(e.target.value))}
                    className="w-full accent-[#E10600] h-2 bg-[#252533] cursor-pointer"
                  />
                </div>
                <div className="space-y-1.5 pt-2 border-t border-white/5">
                  <div className="flex justify-between text-xs font-f1-mono">
                    <span className="text-zinc-300 font-bold">6. Software ERS 350kW</span>
                    <span className="text-cyan-400 font-bold">{aduoErsSoftware}%</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={80}
                    value={aduoErsSoftware}
                    onChange={e => setAduoErsSoftware(Number(e.target.value))}
                    className="w-full accent-[#E10600] h-2 bg-[#252533] cursor-pointer"
                  />
                </div>
                <div className="space-y-1.5 pt-2 border-t border-white/5">
                  <div className="flex justify-between text-xs font-f1-mono">
                    <span className="text-zinc-300 font-bold">7. Curva Anti-Clipping</span>
                    <span className="text-lime-400 font-bold">{aduoErsAntiClipping}%</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={80}
                    value={aduoErsAntiClipping}
                    onChange={e => setAduoErsAntiClipping(Number(e.target.value))}
                    className="w-full accent-[#E10600] h-2 bg-[#252533] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowAduoBenchModal(false)}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#252533] hover:bg-[#2F2F40] border border-white/20 text-white text-xs font-f1-wide font-bold uppercase tracking-wider cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const success = aplicarModificacaoADUO(pwrGain, 3);
                  if (success) {
                    setShowAduoBenchModal(false);
                  }
                }}
                disabled={aduoHomologationQuotas <= 0}
                className="w-full sm:w-auto px-6 py-3 bg-[#E10600] hover:bg-[#B30500] disabled:opacity-50 text-white text-xs font-f1-wide font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <Wrench className="w-4 h-4" />
                <span>HOMOLOGAR MODIFICAÇÃO FIA (CONSUMIR 1 COTA) — +3 SEMANAS CHASSI</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
