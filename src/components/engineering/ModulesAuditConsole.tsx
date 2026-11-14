import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { CASING_ALLOYS, COMPOSITE_MATERIALS } from '../../data/physicsDatabase';
import {
  exportCalculixInputDeck,
  exportOpenFoamDeck,
  type ExternalSolverStatus,
} from '../../engine/adapters/externalCfdFeaAdapter';
import {
  BASE_EQUATIONS_CATALOG,
  COORDINATE_FRAME_STANDARD,
  FLUID_CATALOG,
  evaluateEquationSafely,
} from '../../engine/modules/m01Foundation';
import {
  TRACK_CHARACTERISTICS_CATALOG,
  VEHICLE_PHILOSOPHIES_M02,
  type VehiclePhilosophyCode,
  evaluatePhilosophyForTrack,
} from '../../engine/modules/m02Philosophy';
import { FIA_2026_DEFAULT_EDITION, buildPackagingArchitecture } from '../../engine/modules/m03Packaging';
import { evaluateAerodynamics } from '../../engine/modules/m04Aerodynamics';
import { TIRE_COMPOUND_CATALOG, type TireCompoundCode, evaluateTirePhysics } from '../../engine/modules/m06Tires';
import { evaluatePowerUnit } from '../../engine/modules/m08PowerUnit';
import { evaluateTransmission } from '../../engine/modules/m09Transmission';
import {
  type CouplingMode,
  type FidelityLevel,
  runMultidisciplinarySimulation,
} from '../../engine/modules/m10Multidisciplinary';
import {
  type RaceFidelityMode,
  type RaceWeatherCondition,
  runRaceSimulation,
} from '../../engine/modules/m11RaceSimulation';
import { type CalibrationMethod, runCalibrationPipeline } from '../../engine/modules/m12Calibration';
import { evaluateAllGates } from '../../engine/traceability/traceabilityRegistry';
import { Packaging3DViewport } from './Packaging3DViewport';
import { normalizeToM02Philosophy } from '../onboarding/onboardingPresets';
import { evaluateTrackPhysics, loadCircuitPackage } from '../../circuits';
import { RealCircuitMap } from '../circuits/RealCircuitMap';
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  ClipboardCheck,
  CloudUpload,
  Compass,
  Download,
  Flag,
  Layers,
  Wind,
  Wrench,
} from 'lucide-react';

type WorkbenchTab =
  | 'm01_m02'
  | 'm03_3d'
  | 'm04_m06'
  | 'm07_m09'
  | 'm10_mdo'
  | 'm11_race'
  | 'm12_cal_gates';

export const ModulesAuditConsole: React.FC = () => {
  const { vehicleParams, updateVehicleParams, vehiclePhysics, playerTeam, drivers } = useGame();
  const { user, getIdToken } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<WorkbenchTab>('m03_3d');

  // M01 Equation Evaluator state
  const [selectedEqCode, setSelectedEqCode] = useState<string>(BASE_EQUATIONS_CATALOG[0].code);
  const [eqSpeedMs, setEqSpeedMs] = useState<number>(75);

  // M02 Philosophy & Track state (initialized from active team onboarding selection)
  const [philosophyCode, setPhilosophyCode] = useState<VehiclePhilosophyCode>(() =>
    normalizeToM02Philosophy(playerTeam?.filosofiaAtual)
  );
  useEffect(() => {
    if (playerTeam?.filosofiaAtual) {
      setPhilosophyCode(normalizeToM02Philosophy(playerTeam.filosofiaAtual));
    }
  }, [playerTeam?.filosofiaAtual]);
  const [circuitCode, setCircuitCode] = useState<string>('albert_park');
  const [tradeoffsAcknowledged, setTradeoffsAcknowledged] = useState<boolean>(true);

  // M04-M09 Interactive Probe state
  const [aeroFollowDistM, setAeroFollowDistM] = useState<number>(18);
  const [aeroWetSurface, setAeroWetSurface] = useState<boolean>(false);
  const [tireCompound, setTireCompound] = useState<TireCompoundCode>('medium');
  const [tireWaterFilmMm, setTireWaterFilmMm] = useState<number>(0);
  const [selectedGear, setSelectedGear] = useState<number>(6);

  // M10 MDO state
  const [mdoFidelity, setMdoFidelity] = useState<FidelityLevel>('L2');
  const [mdoCoupling, setMdoCoupling] = useState<CouplingMode>('strong');
  const [mdoTolM, setMdoTolM] = useState<number>(5e-5);

  // M11 Race state
  const [raceFidelity, setRaceFidelity] = useState<RaceFidelityMode>('dynamic');
  const [raceWeather, setRaceWeather] = useState<RaceWeatherCondition>('dry_clear');
  const [raceTrafficGapS, setRaceTrafficGapS] = useState<number>(1.2);
  const [raceFuelKg, setRaceFuelKg] = useState<number>(78);

  // M12 Calibration & Adapters state
  const [calMethod, setCalMethod] = useState<CalibrationMethod>('levenberg_marquardt');
  const [calSeed, setCalSeed] = useState<number>(202601);
  const [calMcSamples, setCalMcSamples] = useState<number>(200);
  const [hostAdapters, setHostAdapters] = useState<ExternalSolverStatus[]>([]);
  const [pythonSciAvailable, setPythonSciAvailable] = useState<boolean | null>(null);
  const [persistMessage, setPersistMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch('/api/adapters/host-status')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!mounted || !data) return;
        setHostAdapters(data.adapters || []);
        setPythonSciAvailable(Boolean(data.pythonNumpyScipyAvailable));
      })
      .catch(() => {
        // Keep clean fallback if offline
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Core Coupled Calculations (SI Units)
  const packaging = useMemo(() => buildPackagingArchitecture(vehicleParams, FIA_2026_DEFAULT_EDITION), [vehicleParams]);

  const m02Report = useMemo(
    () =>
      evaluatePhilosophyForTrack(
        philosophyCode,
        circuitCode,
        {
          aeroEfficiencyLd: vehiclePhysics.cornerMode.aeroEfficiencyLD,
          clTotal: vehiclePhysics.cornerMode.clTotal,
          cdTotal: vehiclePhysics.cornerMode.cdTotal,
          platformStability01: Math.max(0.1, Math.min(0.99, vehiclePhysics.summary.consistencyScore / 100)),
          mechanicalGrip01: Math.max(0.1, Math.min(0.99, vehiclePhysics.summary.cornerGripScore / 100)),
          thermalMarginK: vehiclePhysics.thermalMarginC,
        },
        packaging.envelopeViolations.length,
        tradeoffsAcknowledged
      ),
    [philosophyCode, circuitCode, vehiclePhysics, packaging.envelopeViolations.length, tradeoffsAcknowledged]
  );

  const selectedCircuitPackage = useMemo(
    () => loadCircuitPackage(circuitCode, 2026),
    [circuitCode]
  );
  const selectedTrackPhysics = useMemo(
    () => evaluateTrackPhysics(selectedCircuitPackage, vehicleParams, vehiclePhysics),
    [selectedCircuitPackage, vehicleParams, vehiclePhysics]
  );

  const m04CornerProbe = useMemo(
    () =>
      evaluateAerodynamics(
        vehicleParams,
        {
          speedMs: 69.44,
          frontRhM: vehicleParams.frontRideHeightMm / 1000,
          rearRhM: vehicleParams.rearRideHeightMm / 1000,
          pitchRad: 0,
          yawRad: 0.03,
          rollRad: 0,
          mode: 'MODE_Z',
          ambientTempK: 298.15,
          airPressurePa: 101325,
          gearboxLayout: vehicleParams.gearboxLayout,
          followDistanceM: aeroFollowDistM,
          inAeroActivationZone: false,
          wetSurface: aeroWetSurface,
        },
        FIA_2026_DEFAULT_EDITION
      ),
    [vehicleParams, aeroFollowDistM, aeroWetSurface]
  );

  const m04StraightProbe = useMemo(
    () =>
      evaluateAerodynamics(
        vehicleParams,
        {
          speedMs: 88.0,
          frontRhM: vehicleParams.frontRideHeightMm / 1000,
          rearRhM: vehicleParams.rearRideHeightMm / 1000,
          pitchRad: 0,
          yawRad: 0,
          rollRad: 0,
          mode: 'MODE_X',
          ambientTempK: 298.15,
          airPressurePa: 101325,
          gearboxLayout: vehicleParams.gearboxLayout,
          followDistanceM: aeroFollowDistM,
          inAeroActivationZone: true,
          wetSurface: aeroWetSurface,
        },
        FIA_2026_DEFAULT_EDITION
      ),
    [vehicleParams, aeroFollowDistM, aeroWetSurface]
  );

  const m06TireProbe = useMemo(
    () =>
      evaluateTirePhysics({
        compoundCode: tireCompound,
        verticalLoadN: 5200,
        slipAngleRad: 0.105,
        wheelAngularVelRadS: 69.44 / 0.36,
        wheelVxMs: 69.44,
        effectiveRadiusM: 0.36,
        camberRad: (vehicleParams.staticCamberDeg * Math.PI) / 180,
        tempInnerK: 372,
        tempCenterK: 375,
        tempOuterK: 378,
        tempCarcassK: 368,
        ambientTempK: 298.15,
        atmosphericPressurePa: 101325,
        coldGasMolesN: 4.55,
        internalGasVolumeM3: 0.044,
        surfaceGripFactor: 1.0,
        waterFilmMm: tireWaterFilmMm,
        surfaceMacroTextureMm: 1.0,
        dtS: 0.05,
        currentWearRatio: 0.08,
      }),
    [tireCompound, tireWaterFilmMm, vehicleParams.staticCamberDeg]
  );

  const mdoOutputs = useMemo(
    () =>
      runMultidisciplinarySimulation(
        vehicleParams,
        {
          fidelityLevel: mdoFidelity,
          couplingMode: mdoCoupling,
          convergenceTolM: mdoTolM,
          maxIterations: 25,
          ambientTempK: 298.15,
          airPressurePa: 101325,
          tireCompound,
          referenceTrackLapDistM: m02Report.track.lapDistanceM,
          highSpeedShare: m02Report.track.highSpeedShare,
          lowSpeedShare: m02Report.track.lowSpeedShare,
        },
        FIA_2026_DEFAULT_EDITION
      ),
    [vehicleParams, mdoFidelity, mdoCoupling, mdoTolM, tireCompound, m02Report.track]
  );

  const m08PowerProbe = useMemo(
    () =>
      evaluatePowerUnit(
        vehicleParams,
        {
          rpm: 11600,
          throttleRatio: 1.0,
          vehicleSpeedMs: 69.44,
          ambientTempK: 298.15,
          airPressurePa: 101325,
          initialSoc01: 0.72,
          cycleDurationS: 5.0,
          regenPowerCommandW: 110000,
          deployCommandRatio: 0.92,
          cumulativeRaceCycles: 120,
        },
        FIA_2026_DEFAULT_EDITION
      ),
    [vehicleParams]
  );

  const m09TransProbe = useMemo(
    () =>
      evaluateTransmission(
        vehicleParams,
        {
          selectedGear,
          engineTorqueNm: m08PowerProbe.totalShaftOutput.crankshaftTotalTorqueNm,
          engineOmegaRadS: m08PowerProbe.shaftAndIce.crankOmegaRadS,
          wheelOmegaLeftRadS: 69.44 / 0.36 + 1.2,
          wheelOmegaRightRadS: 69.44 / 0.36 - 1.2,
          clutchSlipOmegaRadS: 12.0,
          tireEffectiveRadiusM: 0.36,
          maxTireAxleTractionN: 16800,
          shiftTimeCommandS: 0.045,
          ambientTempK: 298.15,
          isHollowDriveshaft: true,
        },
        FIA_2026_DEFAULT_EDITION
      ),
    [vehicleParams, selectedGear, m08PowerProbe]
  );

  const raceOutputs = useMemo(() => {
    const track = m02Report.track;
    const half = Math.floor(track.laps / 2);
    const stints =
      raceWeather === 'wet_heavy'
        ? [{ compound: 'wet' as TireCompoundCode, lapsCount: track.laps }]
        : raceWeather === 'changing_light_rain'
        ? [
            { compound: 'medium' as TireCompoundCode, lapsCount: half },
            { compound: 'inter' as TireCompoundCode, lapsCount: track.laps - half },
          ]
        : [
            { compound: 'medium' as TireCompoundCode, lapsCount: half },
            { compound: 'hard' as TireCompoundCode, lapsCount: track.laps - half },
          ];
    return runRaceSimulation(
      vehicleParams,
      {
        circuitCode,
        fidelityMode: raceFidelity,
        weather: raceWeather,
        initialFuelKg: raceFuelKg,
        stints,
        trafficFollowGapS: raceTrafficGapS,
        pitStopDurationS: 22.0,
        seed: 2026,
      },
      FIA_2026_DEFAULT_EDITION
    );
  }, [vehicleParams, circuitCode, m02Report.track, raceFidelity, raceWeather, raceTrafficGapS, raceFuelKg]);

  const calibrationOutputs = useMemo(
    () =>
      runCalibrationPipeline(
        vehicleParams,
        {
          method: calMethod,
          seed: calSeed,
          monteCarloSamples: calMcSamples,
          regularizationLambda: 0.05,
          requestedLifecycleStage: 'Approved',
        },
        FIA_2026_DEFAULT_EDITION
      ),
    [vehicleParams, calMethod, calSeed, calMcSamples]
  );

  const fullAudit = useMemo(
    () =>
      evaluateAllGates(vehicleParams, {
        philosophyCode,
        circuitCode,
        tireCompound,
        tradeoffsAcknowledged,
        calibrationSeed: calSeed,
      }),
    [vehicleParams, philosophyCode, circuitCode, tireCompound, tradeoffsAcknowledged, calSeed]
  );

  const openFoamManifest = useMemo(() => exportOpenFoamDeck(vehicleParams, 85), [vehicleParams]);
  const calculixManifest = useMemo(
    () => exportCalculixInputDeck(vehicleParams, mdoOutputs.subsystems.structures.allowables.tensileStrengthMpa),
    [vehicleParams, mdoOutputs.subsystems.structures.allowables.tensileStrengthMpa]
  );

  const eqEvalResult = useMemo(() => {
    try {
      return evaluateEquationSafely(selectedEqCode, {
        rho: 1.184,
        V: eqSpeedMs,
        A: 1.5,
        CL: m04CornerProbe.forces.clTotal,
        CD: m04CornerProbe.forces.cdTotal,
        D: m04CornerProbe.forces.dragTotalN,
        m: packaging.totalMassKg,
        a: 32,
        g: 9.80665,
        T_q: m08PowerProbe.totalShaftOutput.crankshaftTotalTorqueNm,
        omega: m08PowerProbe.shaftAndIce.crankOmegaRadS,
        I_el: m08PowerProbe.ersAndBattery.busCurrentA,
        R_el: m08PowerProbe.ersAndBattery.internalResistanceOhm,
        m_dot: 0.45,
        cp: 1005,
        dT: 35,
        k_th: 45,
        dT_dx: 600,
        z: 1,
        L: packaging.wheelbaseM,
        t: packaging.frontTrackM,
        a_x: 34,
        a_y: 36,
        h: packaging.cgM.z,
      });
    } catch {
      return null;
    }
  }, [selectedEqCode, eqSpeedMs, m04CornerProbe, packaging, m08PowerProbe]);

  const downloadTextFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const persistToCloudSql = async (endpoint: '/api/m10/persist' | '/api/m11/persist' | '/api/m12/persist') => {
    setPersistMessage(null);
    if (!user) {
      setPersistMessage('Faça login com Google (barra superior) para gravar execuções no Cloud SQL.');
      return;
    }
    try {
      const token = await getIdToken();
      if (!token) throw new Error('Token indisponível.');
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          params: vehicleParams,
          fidelityLevel: mdoFidelity,
          couplingMode: mdoCoupling,
          convergenceTolM: mdoTolM,
          circuitCode,
          fidelityMode: raceFidelity,
          weather: raceWeather,
          initialFuelKg: raceFuelKg,
          trafficFollowGapS: raceTrafficGapS,
          method: calMethod,
          seed: calSeed,
          monteCarloSamples: calMcSamples,
        }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      setPersistMessage(`Persistido no PostgreSQL (us-west1) via ${endpoint}.`);
    } catch (err) {
      setPersistMessage(`Falha ao gravar: ${(err as Error).message}`);
    }
  };

  const subTabs: Array<{ id: WorkbenchTab; label: string; icon: React.ReactNode }> = [
    { id: 'm01_m02', label: 'M01–M02 SI & Filosofia', icon: <Compass className="w-3.5 h-3.5" /> },
    { id: 'm03_3d', label: 'M03 Packaging 3D', icon: <Box className="w-3.5 h-3.5" /> },
    { id: 'm04_m06', label: 'M04–M06 Aero / Din / Pneus', icon: <Wind className="w-3.5 h-3.5" /> },
    { id: 'm07_m09', label: 'M07–M09 Estrut / PU / Câmbio', icon: <Wrench className="w-3.5 h-3.5" /> },
    { id: 'm10_mdo', label: 'M10 MDO & Pareto', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'm11_race', label: 'M11 Corrida Segmentada', icon: <Flag className="w-3.5 h-3.5" /> },
    {
      id: 'm12_cal_gates',
      label: `M12 Calibração & Gates (${fullAudit.passedGatesCount}/12)`,
      icon: <ClipboardCheck className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Sub-navigation strip */}
      <div className="bg-[#1C1C26] border border-white/10 p-2 flex flex-wrap items-center gap-1.5">
        {subTabs.map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3 py-2 text-[11px] font-f1-wide uppercase tracking-wider flex items-center gap-1.5 border transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#E10600] border-[#E10600] text-white font-bold'
                  : 'bg-[#15151E] border-white/10 text-zinc-300 hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {persistMessage && (
        <div className="bg-[#15151E] border border-cyan-500/40 px-4 py-2.5 text-xs font-f1-mono text-cyan-200 flex items-center justify-between">
          <span>{persistMessage}</span>
          <button
            type="button"
            onClick={() => setPersistMessage(null)}
            className="text-zinc-400 hover:text-white cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 1: M01 FOUNDATION & M02 PHILOSOPHY                                */}
      {/* ===================================================================== */}
      {activeSubTab === 'm01_m02' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* M02 Philosophy & Track selector */}
          <div className="lg:col-span-7 bg-[#1C1C26] border border-white/10 p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-f1-mono text-[#E10600] uppercase font-bold">
                  M02 · FILOSOFIA DO VEÍCULO & COMPATIBILIDADE DE PISTA
                </span>
                <h2 className="font-f1-wide font-black text-base text-white uppercase">
                  Função Objetivo J = Σ wᵢ·fᵢ(x) - Penalidades
                </h2>
              </div>
              <span className="px-2.5 py-1 bg-[#15151E] border border-white/10 text-xs font-f1-mono text-emerald-400 font-bold tabular-nums">
                Compatibilidade Pista: {m02Report.trackCompatibilityPct}% · J = {m02Report.objectiveScoreJ}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-f1-mono text-zinc-400 uppercase block mb-1">
                  Filosofia Competitiva (6 perfis M02)
                </label>
                <select
                  value={philosophyCode}
                  onChange={(e) => setPhilosophyCode(e.target.value as VehiclePhilosophyCode)}
                  className="w-full bg-[#15151E] border border-white/15 px-3 py-2 text-xs font-f1-mono text-white"
                >
                  {Object.values(VEHICLE_PHILOSOPHIES_M02).map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.name} (v{p.version})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-f1-mono text-zinc-400 uppercase block mb-1">
                  Circuito de Referência (SI Track Catalog)
                </label>
                <select
                  value={circuitCode}
                  onChange={(e) => setCircuitCode(e.target.value)}
                  className="w-full bg-[#15151E] border border-white/15 px-3 py-2 text-xs font-f1-mono text-white"
                >
                  {TRACK_CHARACTERISTICS_CATALOG.map((tr) => (
                    <option key={tr.circuitCode} value={tr.circuitCode}>
                      {tr.name} ({tr.lapDistanceM} m · {tr.laps}v)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-[#15151E] p-3 border border-white/5 text-xs font-f1-mono space-y-1">
              <div className="text-zinc-300">{m02Report.philosophy.priority}</div>
              <div className="text-zinc-400 tabular-nums">
                Alvos: CL [{m02Report.targetRanges.targetClRange.join('–')}] · Cd [
                {m02Report.targetRanges.targetCdRange.join('–')}] · L/D [
                {m02Report.targetRanges.targetLdRange.join('–')}] · Balanço Diant. [
                {(m02Report.targetRanges.targetFrontBalanceRange[0] * 100).toFixed(1)}–
                {(m02Report.targetRanges.targetFrontBalanceRange[1] * 100).toFixed(1)}%]
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[11px] font-f1-mono border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-400 text-left">
                    <th className="py-1.5 pr-2">Métrica</th>
                    <th className="py-1.5 pr-2">Peso</th>
                    <th className="py-1.5 pr-2">Alvo SI</th>
                    <th className="py-1.5 pr-2">Relação</th>
                    <th className="py-1.5">Justificativa Física</th>
                  </tr>
                </thead>
                <tbody>
                  {m02Report.philosophy.weights.map((w) => (
                    <tr key={w.metric} className="border-b border-white/5 text-zinc-200">
                      <td className="py-1.5 pr-2 font-bold">{w.label}</td>
                      <td className="py-1.5 pr-2 tabular-nums text-cyan-300">{(w.weight * 100).toFixed(0)}%</td>
                      <td className="py-1.5 pr-2 tabular-nums">
                        {w.targetMin}–{w.targetMax} {w.unitSi}
                      </td>
                      <td className="py-1.5 pr-2 uppercase text-amber-300">{w.relationType}</td>
                      <td className="py-1.5 text-zinc-400">{w.justification}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <label className="flex items-start gap-2.5 bg-amber-950/20 border border-amber-500/30 p-3 text-xs font-f1-mono text-amber-200 cursor-pointer">
              <input
                type="checkbox"
                checked={tradeoffsAcknowledged}
                onChange={(e) => setTradeoffsAcknowledged(e.target.checked)}
                className="mt-0.5 accent-[#E10600]"
              />
              <span>
                Confirmo ciência explícita dos trade-offs (Gate 02 G02-C4): {m02Report.tradeoffsToConfirm.join(' | ')}
              </span>
            </label>

            <RealCircuitMap
              circuitPackage={selectedCircuitPackage}
              trackPhysics={selectedTrackPhysics}
              compact
            />
          </div>

          {/* M01 Coordinate Frame, AST Parser & Fluid/Material Catalog */}
          <div className="lg:col-span-5 bg-[#1C1C26] border border-white/10 p-4 space-y-4">
            <div className="border-b border-white/10 pb-3">
              <span className="text-[10px] font-f1-mono text-cyan-400 uppercase font-bold">
                M01 · FUNDAÇÃO CIENTÍFICA & PARSER AST CONTROLADO
              </span>
              <h2 className="font-f1-wide font-black text-base text-white uppercase">
                Referencial {COORDINATE_FRAME_STANDARD.frameId}
              </h2>
              <p className="text-[11px] font-f1-mono text-zinc-400 mt-1">
                {COORDINATE_FRAME_STANDARD.origin} · {COORDINATE_FRAME_STANDARD.xAxis} ·{' '}
                {COORDINATE_FRAME_STANDARD.zAxis}
              </p>
            </div>

            <div className="bg-[#15151E] p-3 border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-f1-mono">
                <span className="text-white font-bold">Avaliador Seguro AST (Sem eval())</span>
                <span className="text-emerald-400 tabular-nums">V = {eqSpeedMs} m/s</span>
              </div>
              <select
                value={selectedEqCode}
                onChange={(e) => setSelectedEqCode(e.target.value)}
                className="w-full bg-[#1C1C26] border border-white/15 px-2.5 py-1.5 text-xs font-f1-mono text-white"
              >
              {BASE_EQUATIONS_CATALOG.map((eq) => (
                  <option key={eq.code} value={eq.code}>
                    {eq.code}: {eq.expression} ({eq.expectedUnitSi})
                  </option>
                ))}
              </select>
              <input
                type="range"
                min={25}
                max={95}
                value={eqSpeedMs}
                onChange={(e) => setEqSpeedMs(Number(e.target.value))}
                className="w-full accent-[#E10600] h-1.5 bg-zinc-700"
              />
              {eqEvalResult && (
                <div className="text-xs font-f1-mono text-cyan-300 bg-black/40 p-2 border border-white/5 tabular-nums">
                  Resultado: <strong>{eqEvalResult.value.toFixed(3)}</strong> {eqEvalResult.unitSi} · Verificação 5D:{' '}
                  {eqEvalResult.dimensionalVerified ? 'CONSISTENTE' : 'ERRO DIMENSIONAL'}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-[11px] font-f1-mono text-zinc-400 uppercase">
                Catálogo M01: Fluidos ({FLUID_CATALOG.length}) & Materiais ({Object.keys(COMPOSITE_MATERIALS).length + Object.keys(CASING_ALLOYS).length})
              </div>
              <div className="max-h-52 overflow-y-auto space-y-1.5">
                {FLUID_CATALOG.map((fl) => (
                  <div key={fl.code} className="bg-[#15151E] p-2 border border-white/5 text-[11px] font-f1-mono">
                    <div className="flex justify-between text-white font-bold">
                      <span>{fl.name}</span>
                      <span className="text-zinc-400">{fl.infoClass}</span>
                    </div>
                    <div className="text-zinc-400 tabular-nums">
                      ρ={fl.densityKgM3} kg/m³ · cp={fl.cpJKgK} J/(kg·K) · k={fl.thermalConductivityWmK} W/(m·K)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: M03 PACKAGING 3D VIEWPORT                                      */}
      {/* ===================================================================== */}
      {activeSubTab === 'm03_3d' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-[#1C1C26] border border-white/10 p-3">
              <div className="text-[10px] font-f1-mono text-zinc-400 uppercase">Massa Total / Lastro</div>
              <div className="text-lg font-f1-wide font-black text-white tabular-nums">
                {packaging.totalMassKg} kg
              </div>
              <div className="text-[10px] font-f1-mono text-amber-300 tabular-nums">
                Lastro: {packaging.ballastKg} kg (Mín FIA {packaging.edition.minMassKg} kg)
              </div>
            </div>
            <div className="bg-[#1C1C26] border border-white/10 p-3">
              <div className="text-[10px] font-f1-mono text-zinc-400 uppercase">CG Composto (SAE/ISO)</div>
              <div className="text-sm font-f1-mono font-bold text-cyan-300 tabular-nums mt-1">
                ({packaging.cgM.x}, {packaging.cgM.y}, {packaging.cgM.z}) m
              </div>
              <div className="text-[10px] font-f1-mono text-zinc-400">
                z_CG = {packaging.cgM.z} m
              </div>
            </div>
            <div className="bg-[#1C1C26] border border-white/10 p-3">
              <div className="text-[10px] font-f1-mono text-zinc-400 uppercase">Inércia Yaw Iz (Steiner)</div>
              <div className="text-lg font-f1-wide font-black text-white tabular-nums">
                {packaging.yawInertiaIzKgM2} kg·m²
              </div>
              <div className="text-[10px] font-f1-mono text-zinc-400">Σ(m·r² + Izz,i)</div>
            </div>
            <div className="bg-[#1C1C26] border border-white/10 p-3">
              <div className="text-[10px] font-f1-mono text-zinc-400 uppercase">Distribuição Estática</div>
              <div className="text-lg font-f1-wide font-black text-emerald-400 tabular-nums">
                {packaging.staticAxleDist.frontPct}% / {packaging.staticAxleDist.rearPct}%
              </div>
              <div className="text-[10px] font-f1-mono text-zinc-400 tabular-nums">
                {packaging.staticAxleDist.frontLoadN} / {packaging.staticAxleDist.rearLoadN} N
              </div>
            </div>
            <div className="bg-[#1C1C26] border border-white/10 p-3">
              <div className="text-[10px] font-f1-mono text-zinc-400 uppercase">Colisões AABB / Acesso</div>
              <div
                className={`text-lg font-f1-wide font-black tabular-nums ${
                  packaging.collisionCount === 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {packaging.collisionCount} Colisões
              </div>
              <div className="text-[10px] font-f1-mono text-zinc-400 tabular-nums">
                Manutenção: {packaging.totalMaintenanceMinutes} min
              </div>
            </div>
          </div>

          {/* Interactive Three.js 3D Packaging Scene */}
          <Packaging3DViewport packaging={packaging} vehicleParams={vehicleParams} playerTeam={playerTeam} drivers={drivers} />

          {/* Hardpoints & Interference Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[#1C1C26] border border-white/10 p-4 space-y-2">
              <h3 className="font-f1-wide font-bold text-xs text-white uppercase">
                Hardpoints Publicados ({packaging.coordinateFrame.frameId})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] font-f1-mono">
                  <thead>
                    <tr className="border-b border-white/10 text-zinc-400 text-left">
                      <th className="py-1">Eixo</th>
                      <th className="py-1">Ponto</th>
                      <th className="py-1">X (m)</th>
                      <th className="py-1">Y (m)</th>
                      <th className="py-1">Z (m)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packaging.hardpoints.map((hp) => (
                      <tr key={hp.name} className="border-b border-white/5 text-zinc-200 tabular-nums">
                        <td className="py-1 uppercase text-cyan-400">{hp.axle}</td>
                        <td className="py-1">{hp.name}</td>
                        <td className="py-1">{hp.xM.toFixed(3)}</td>
                        <td className="py-1">{hp.yM.toFixed(3)}</td>
                        <td className="py-1">{hp.zM.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-[#1C1C26] border border-white/10 p-4 space-y-2">
              <h3 className="font-f1-wide font-bold text-xs text-white uppercase">
                Verificação Geométrica de Interferências ({packaging.interferences.length} pares)
              </h3>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {packaging.interferences.map((inf, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between px-2.5 py-1.5 text-[11px] font-f1-mono border ${
                      inf.hasCollision
                        ? 'bg-red-950/30 border-red-500/50 text-red-200'
                        : 'bg-[#15151E] border-white/5 text-zinc-300'
                    }`}
                  >
                    <span className="truncate pr-2">
                      {inf.componentA} ↔ {inf.componentB}
                    </span>
                    <span className="tabular-nums shrink-0 font-bold">
                      folga {inf.minClearanceM.toFixed(3)} m {inf.hasCollision ? 'COLISÃO' : 'OK'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: M04 AERO, M05 DYNAMICS & M06 TIRES                             */}
      {/* ===================================================================== */}
      {activeSubTab === 'm04_m06' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* M04 Aerodynamics */}
          <div className="bg-[#1C1C26] border border-white/10 p-4 space-y-3">
            <div className="border-b border-white/10 pb-2">
              <span className="text-[10px] font-f1-mono text-[#E10600] font-bold uppercase">M04 · AERODINÂMICA</span>
              <h3 className="font-f1-wide font-bold text-sm text-white uppercase">
                Modo Z vs Modo X · Esteira λ
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-f1-mono">
              <div className="bg-[#15151E] p-2.5 border border-white/5">
                <div className="text-[10px] text-zinc-400">Modo Z (69.4 m/s)</div>
                <div className="text-white font-bold tabular-nums">
                  Fz = {Math.round(m04CornerProbe.forces.downforceTotalN)} N
                </div>
                <div className="text-emerald-400 tabular-nums">
                  CL={m04CornerProbe.forces.clTotal} · Cd={m04CornerProbe.forces.cdTotal}
                </div>
              </div>
              <div className="bg-[#15151E] p-2.5 border border-white/5">
                <div className="text-[10px] text-zinc-400">Modo X (88.0 m/s)</div>
                <div className="text-white font-bold tabular-nums">
                  {m04StraightProbe.actuator.mode} ({m04StraightProbe.actuator.activationAllowed ? 'ATIVO' : 'BLOQUEADO'})
                </div>
                <div className="text-cyan-400 tabular-nums">
                  Cd={m04StraightProbe.forces.cdTotal} · P_D={(m04StraightProbe.forces.dragPowerW / 1000).toFixed(0)} kW
                </div>
              </div>
            </div>

            <div className="bg-[#15151E] p-3 border border-white/5 space-y-2 text-xs font-f1-mono">
              <div className="flex justify-between">
                <span className="text-zinc-300">Distância em Tráfego (Esteira)</span>
                <span className="text-amber-300 font-bold tabular-nums">{aeroFollowDistM} m</span>
              </div>
              <input
                type="range"
                min={6}
                max={80}
                value={aeroFollowDistM}
                onChange={(e) => setAeroFollowDistM(Number(e.target.value))}
                className="w-full accent-[#E10600] h-1.5 bg-zinc-700"
              />
              <div className="text-[11px] text-zinc-400 tabular-nums">
                λ={(m04CornerProbe.wakeEffect.lambdaWakeLoss * 100).toFixed(1)}% perda → Fz_limpo=
                {Math.round(m04CornerProbe.wakeEffect.fzCleanN)} N vs Fz_esteira=
                {Math.round(m04CornerProbe.wakeEffect.fzFollowN)} N (+{m04CornerProbe.wakeEffect.coolingPenaltyPct}% arrefec.)
              </div>
              <label className="flex items-center gap-2 text-[11px] text-zinc-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={aeroWetSurface}
                  onChange={(e) => setAeroWetSurface(e.target.checked)}
                  className="accent-[#E10600]"
                />
                <span>Pista Molhada (Bloqueia Modo X por segurança FIA)</span>
              </label>
            </div>

            <div className="space-y-1 text-[11px] font-f1-mono">
              <div className="text-zinc-400 uppercase">8 Fenômenos Aerodinâmicos Ativos</div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {m04CornerProbe.phenomena.map((ph) => (
                  <div key={ph.code} className="flex justify-between bg-[#15151E] px-2 py-1 border border-white/5">
                    <span className="text-zinc-300">{ph.code} {ph.name}</span>
                    <span className="text-cyan-300 tabular-nums">
                      {ph.activeValue} {ph.unitSi}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* M05 Vehicle Dynamics */}
          <div className="bg-[#1C1C26] border border-white/10 p-4 space-y-3">
            <div className="border-b border-white/10 pb-2">
              <span className="text-[10px] font-f1-mono text-cyan-400 font-bold uppercase">M05 · DINÂMICA VEICULAR 3DOF</span>
              <h3 className="font-f1-wide font-bold text-sm text-white uppercase">
                Transferência Geométrica vs Elástica
              </h3>
            </div>

            <div className="bg-[#15151E] p-3 border border-white/5 text-xs font-f1-mono space-y-1.5 tabular-nums">
              <div className="flex justify-between">
                <span className="text-zinc-400">Massa Suspensa / Não-Susp.:</span>
                <span className="text-white font-bold">
                  {mdoOutputs.subsystems.dynamics.masses.sprungMassKg} /{' '}
                  {mdoOutputs.subsystems.dynamics.masses.unsprungFrontKg +
                    mdoOutputs.subsystems.dynamics.masses.unsprungRearKg}{' '}
                  kg
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Freq. Natural (Diant / Tras):</span>
                <span className="text-cyan-300 font-bold">
                  {mdoOutputs.subsystems.dynamics.suspensionResponse.naturalFrequencyFrontHz} /{' '}
                  {mdoOutputs.subsystems.dynamics.suspensionResponse.naturalFrequencyRearHz} Hz
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Amortecimento ζ (Diant / Tras):</span>
                <span className="text-emerald-400 font-bold">
                  {mdoOutputs.subsystems.dynamics.suspensionResponse.dampingRatioFront} /{' '}
                  {mdoOutputs.subsystems.dynamics.suspensionResponse.dampingRatioRear}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Roll Center (Diant / Tras):</span>
                <span className="text-white">
                  {mdoOutputs.subsystems.dynamics.kinematicsAndCompliance.frontRollCenterM} /{' '}
                  {mdoOutputs.subsystems.dynamics.kinematicsAndCompliance.rearRollCenterM} m
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Erro Fechamento ΔFz:</span>
                <span className="text-emerald-400 font-bold">
                  {mdoOutputs.subsystems.dynamics.wheelLoadsN.closureErrorN} N (Sem Duplicação:{' '}
                  {mdoOutputs.subsystems.dynamics.loadTransferSeparation.nonDuplicationVerified ? 'SIM' : 'NÃO'})
                </span>
              </div>
            </div>

            <div className="bg-[#15151E] p-3 border border-white/5 text-[11px] font-f1-mono space-y-1 tabular-nums">
              <div className="text-zinc-400 uppercase mb-1">Cargas Normais por Roda (N)</div>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="bg-black/30 p-1.5">FL: {mdoOutputs.subsystems.dynamics.wheelLoadsN.frontLeft} N</div>
                <div className="bg-black/30 p-1.5">FR: {mdoOutputs.subsystems.dynamics.wheelLoadsN.frontRight} N</div>
                <div className="bg-black/30 p-1.5">RL: {mdoOutputs.subsystems.dynamics.wheelLoadsN.rearLeft} N</div>
                <div className="bg-black/30 p-1.5">RR: {mdoOutputs.subsystems.dynamics.wheelLoadsN.rearRight} N</div>
              </div>
            </div>
          </div>

          {/* M06 Tires Pacejka */}
          <div className="bg-[#1C1C26] border border-white/10 p-4 space-y-3">
            <div className="border-b border-white/10 pb-2">
              <span className="text-[10px] font-f1-mono text-amber-400 font-bold uppercase">
                M06 · PNEUS PACEJKA & TERMODINÂMICA
              </span>
              <h3 className="font-f1-wide font-bold text-sm text-white uppercase">
                Elipse de Atrito · PV=nRT (K) · Aquaplanagem
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-f1-mono">
              <select
                value={tireCompound}
                onChange={(e) => setTireCompound(e.target.value as TireCompoundCode)}
                className="bg-[#15151E] border border-white/15 px-2 py-1.5 text-xs text-white"
              >
                {Object.values(TIRE_COMPOUND_CATALOG).map((tc) => (
                  <option key={tc.code} value={tc.code}>
                    {tc.name}
                  </option>
                ))}
              </select>
              <div className="bg-[#15151E] px-2.5 py-1.5 border border-white/5 flex items-center justify-between">
                <span className="text-zinc-400">Água:</span>
                <span className="text-cyan-300 font-bold tabular-nums">{tireWaterFilmMm.toFixed(1)} mm</span>
              </div>
            </div>

            <input
              type="range"
              min={0}
              max={4}
              step={0.2}
              value={tireWaterFilmMm}
              onChange={(e) => setTireWaterFilmMm(Number(e.target.value))}
              className="w-full accent-[#E10600] h-1.5 bg-zinc-700"
            />

            <div className="bg-[#15151E] p-3 border border-white/5 text-xs font-f1-mono space-y-1 tabular-nums">
              <div className="flex justify-between">
                <span className="text-zinc-400">Fy Combinada / Transitória:</span>
                <span className="text-white font-bold">
                  {Math.round(m06TireProbe.forcesAndMoments.fyCombinedN)} /{' '}
                  {Math.round(m06TireProbe.forcesAndMoments.fyTransientN)} N
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Auto-Alinhamento Mz / Elipse:</span>
                <span className="text-emerald-400">
                  {m06TireProbe.forcesAndMoments.mzAligningNm} N·m (
                  {(m06TireProbe.forcesAndMoments.frictionEllipseUtilization * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Pressão Abs / Manométrica:</span>
                <span className="text-cyan-300">
                  {(m06TireProbe.pressureIdealGas.pressureAbsPa / 1000).toFixed(1)} kPa (
                  {m06TireProbe.pressureIdealGas.pressureGaugePsi.toFixed(1)} psi)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Risco Aquaplanagem / Graining:</span>
                <span className={m06TireProbe.degradationStates.aquaplaningRisk01 > 0.35 ? 'text-red-400 font-bold' : 'text-zinc-200'}>
                  {(m06TireProbe.degradationStates.aquaplaningRisk01 * 100).toFixed(0)}% /{' '}
                  {(m06TireProbe.degradationStates.grainingIndex01 * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: M07 STRUCTURES, M08 POWER UNIT & M09 TRANSMISSION              */}
      {/* ===================================================================== */}
      {activeSubTab === 'm07_m09' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* M07 Structures */}
          <div className="bg-[#1C1C26] border border-white/10 p-4 space-y-3">
            <div className="border-b border-white/10 pb-2">
              <span className="text-[10px] font-f1-mono text-[#E10600] font-bold uppercase">
                M07 · ESTRUTURAS CFRP (CLT [A,B,D])
              </span>
              <h3 className="font-f1-wide font-bold text-sm text-white uppercase">
                5 Load Cases · Flambagem · Convergência Malha
              </h3>
            </div>
            <div className="bg-[#15151E] p-3 border border-white/5 text-xs font-f1-mono space-y-1 tabular-nums">
              <div className="flex justify-between">
                <span className="text-zinc-400">Rigidez Torcional (Em Série):</span>
                <span className="text-white font-bold">
                  {mdoOutputs.subsystems.structures.stiffnessMetrics.torsionalStiffnessNmPerDeg} N·m/deg
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Pior Índice Tsai-Wu (&lt;1.0):</span>
                <span className="text-emerald-400 font-bold">
                  {mdoOutputs.subsystems.structures.failureSummary.worstTsaiWuIndex}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Mínimo Fator Flambagem (&gt;1.0):</span>
                <span className="text-cyan-300 font-bold">
                  {mdoOutputs.subsystems.structures.failureSummary.minBucklingFactor}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Acoplamento B‖ Simetria:</span>
                <span className="text-zinc-200">
                  {mdoOutputs.subsystems.structures.cltMatrices.symmetryErrorNorm.toExponential(1)}
                </span>
              </div>
            </div>
            <div className="space-y-1 text-[11px] font-f1-mono">
              {mdoOutputs.subsystems.structures.loadCases.map((lc) => (
                <div key={lc.caseName} className="flex justify-between bg-[#15151E] px-2 py-1 border border-white/5 tabular-nums">
                  <span className="text-zinc-300 truncate pr-2">{lc.caseName}</span>
                  <span className={lc.passed ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                    TW={lc.tsaiWuIndex} · λ={lc.bucklingFactor}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* M08 Power Unit */}
          <div className="bg-[#1C1C26] border border-white/10 p-4 space-y-3">
            <div className="border-b border-white/10 pb-2">
              <span className="text-[10px] font-f1-mono text-emerald-400 font-bold uppercase">
                M08 · UNIDADE DE POTÊNCIA 2026
              </span>
              <h3 className="font-f1-wide font-bold text-sm text-white uppercase">
                ICE + MGU-K 350kW + Balanço Energia (J)
              </h3>
            </div>
            <div className="bg-[#15151E] p-3 border border-white/5 text-xs font-f1-mono space-y-1 tabular-nums">
              <div className="flex justify-between">
                <span className="text-zinc-400">Potência Eixo Total:</span>
                <span className="text-white font-bold">
                  {(m08PowerProbe.totalShaftOutput.crankshaftTotalPowerW / 1000).toFixed(1)} kW (
                  {m08PowerProbe.totalShaftOutput.crankshaftTotalTorqueNm.toFixed(1)} N·m)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Perda Joule I²R / Corrente:</span>
                <span className="text-amber-300">
                  {(m08PowerProbe.ersAndBattery.jouleLossW / 1000).toFixed(2)} kW @{' '}
                  {m08PowerProbe.ersAndBattery.busCurrentA.toFixed(0)} A
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Resíduo Conservação Energia:</span>
                <span className={m08PowerProbe.energyBalance.balanceClosed ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                  {m08PowerProbe.energyBalance.balanceResidualJ} J (
                  {m08PowerProbe.energyBalance.balanceClosed ? 'FECHADO' : 'ABERTO'})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">T_ICE / T_Bateria / Margem:</span>
                <span className="text-cyan-300">
                  {(m08PowerProbe.thermalAndLubrication.iceTempK - 273.15).toFixed(1)}°C /{' '}
                  {(m08PowerProbe.thermalAndLubrication.batteryTempK - 273.15).toFixed(1)}°C (
                  {m08PowerProbe.thermalAndLubrication.thermalMarginK.toFixed(1)} K)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Turbo Spool / Surge / Choke:</span>
                <span className="text-zinc-200">
                  {m08PowerProbe.turbocharger.spoolLagMs} ms · PR=
                  {m08PowerProbe.turbocharger.operatingPoint.pressureRatio.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* M09 Transmission */}
          <div className="bg-[#1C1C26] border border-white/10 p-4 space-y-3">
            <div className="border-b border-white/10 pb-2 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-f1-mono text-purple-400 font-bold uppercase">
                  M09 · TRANSMISSÃO & DIFERENCIAL
                </span>
                <h3 className="font-f1-wide font-bold text-sm text-white uppercase">
                  8 Marchas Discretas · Semieixo · LSD
                </h3>
              </div>
              <select
                value={selectedGear}
                onChange={(e) => setSelectedGear(Number(e.target.value))}
                className="bg-[#15151E] border border-white/15 px-2 py-1 text-xs font-f1-mono text-white"
              >
                {m09TransProbe.gearboxSet.gears.map((g) => (
                  <option key={g.gearNumber} value={g.gearNumber}>
                    G{g.gearNumber} ({g.z2Gear}/{g.z1Pinion})
                  </option>
                ))}
              </select>
            </div>
            <div className="bg-[#15151E] p-3 border border-white/5 text-xs font-f1-mono space-y-1 tabular-nums">
              <div className="flex justify-between">
                <span className="text-zinc-400">Torque Roda / Tração Limitada:</span>
                <span className="text-white font-bold">
                  {m09TransProbe.kinematicsAndTorque.outputAxleTorqueNm.toFixed(0)} N·m →{' '}
                  {m09TransProbe.kinematicsAndTorque.wheelForceTractionLimitedN.toFixed(0)} N
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Resíduo Diferencial (T_L+T_R-T):</span>
                <span className="text-emerald-400 font-bold">
                  {m09TransProbe.differentialAndYaw.conservationResidualNm} N·m
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Capacidade Embreagem / Troca:</span>
                <span className="text-cyan-300">
                  {m09TransProbe.clutchAndShifts.clutchTorqueCapacityNm.toFixed(0)} N·m ·{' '}
                  {(m09TransProbe.clutchAndShifts.shiftDurationS * 1000).toFixed(0)} ms
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">FS Semieixo / Fadiga Engrenagem:</span>
                <span className="text-zinc-200">
                  FS={m09TransProbe.structuralAndFatigue.shaftSafetyFactor} ·{' '}
                  {m09TransProbe.structuralAndFatigue.fatigueLifeRaces} GPs
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: M10 MULTIDISCIPLINARY MDO & PARETO                             */}
      {/* ===================================================================== */}
      {activeSubTab === 'm10_mdo' && (
        <div className="space-y-4">
          <div className="bg-[#1C1C26] border border-white/10 p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-xs font-f1-mono">
              <div>
                <span className="text-zinc-400 block text-[10px]">Fidelidade</span>
                <select
                  value={mdoFidelity}
                  onChange={(e) => setMdoFidelity(e.target.value as FidelityLevel)}
                  className="bg-[#15151E] border border-white/15 px-2.5 py-1.5 text-white"
                >
                  {(['L0', 'L1', 'L2', 'L3'] as FidelityLevel[]).map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px]">Acoplamento</span>
                <select
                  value={mdoCoupling}
                  onChange={(e) => setMdoCoupling(e.target.value as CouplingMode)}
                  className="bg-[#15151E] border border-white/15 px-2.5 py-1.5 text-white"
                >
                  <option value="strong">Forte (Ponto Fixo M04↔M05↔M06)</option>
                  <option value="weak">Fraco (1 Passagem Aberta)</option>
                </select>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px]">Tolerância Convergência</span>
                <select
                  value={mdoTolM}
                  onChange={(e) => setMdoTolM(Number(e.target.value))}
                  className="bg-[#15151E] border border-white/15 px-2.5 py-1.5 text-white"
                >
                  <option value={5e-5}>5.0e-5 m (Nominal)</option>
                  <option value={1e-6}>1.0e-6 m (Rigoroso)</option>
                  <option value={1e-12}>1.0e-12 m (Testar Falha Honesta)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`px-3 py-1.5 border text-xs font-f1-mono font-bold ${
                  mdoOutputs.solverMetadata.converged
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : 'bg-red-950/30 border-red-500/40 text-red-300'
                }`}
              >
                {mdoOutputs.solverMetadata.converged
                  ? `CONVERGIU (${mdoOutputs.solverMetadata.iterationsUsed} it, res=${mdoOutputs.solverMetadata.finalResidualM} m)`
                  : `NÃO CONVERGIU (res=${mdoOutputs.solverMetadata.finalResidualM} m)`}
              </div>
              <button
                type="button"
                onClick={() => persistToCloudSql('/api/m10/persist')}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-f1-mono font-bold uppercase flex items-center gap-1.5 cursor-pointer"
              >
                <CloudUpload className="w-3.5 h-3.5" />
                <span>Salvar Campanha SQL</span>
              </button>
            </div>
          </div>

          {mdoOutputs.solverMetadata.failureReason && (
            <div className="bg-red-950/30 border border-red-500/50 p-3 text-xs font-f1-mono text-red-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{mdoOutputs.solverMetadata.failureReason}</span>
            </div>
          )}

          {/* DOE Sensitivity & Pareto Frontier */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5 bg-[#1C1C26] border border-white/10 p-4 space-y-3">
              <h3 className="font-f1-wide font-bold text-xs text-white uppercase">
                Sensibilidade Local DOE (∂y/∂p por Diferenças Finitas)
              </h3>
              <div className="space-y-2">
                {mdoOutputs.sensitivityStudy.map((s) => (
                  <div key={s.parameter} className="bg-[#15151E] p-2.5 border border-white/5 text-xs font-f1-mono tabular-nums">
                    <div className="text-white font-bold">
                      {s.label} ({s.unitInput})
                    </div>
                    <div className="text-zinc-400 mt-0.5">
                      ∂t_volta/∂p = <span className="text-cyan-300">{s.dLapTimePerUnitS} s/{s.unitInput}</span> · ∂(L/D)/∂p ={' '}
                      <span className="text-emerald-300">{s.dEfficiencyLdPerUnit}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-[#15151E] p-2.5 border border-white/5 text-[11px] font-f1-mono text-zinc-300 tabular-nums">
                Auditoria Conservação: ΔFz={mdoOutputs.conservationAudit.verticalLoadResidualN} N · ΔE=
                {mdoOutputs.conservationAudit.energyBalanceResidualJ} J · ΔTdiff=
                {mdoOutputs.conservationAudit.diffTorqueResidualNm} N·m
              </div>
            </div>

            <div className="lg:col-span-7 bg-[#1C1C26] border border-white/10 p-4 space-y-3">
              <h3 className="font-f1-wide font-bold text-xs text-white uppercase">
                Fronteira de Pareto Multi-Objetivo (Aplicação Real em CAD)
              </h3>
              <div className="space-y-2">
                {mdoOutputs.paretoFrontier.map((cand) => (
                  <div
                    key={cand.id}
                    className={`p-3 border text-xs font-f1-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      cand.isNonDominated
                        ? 'bg-[#15151E] border-emerald-500/30'
                        : 'bg-[#15151E]/60 border-white/5 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-f1-wide font-bold text-white uppercase">{cand.label}</span>
                        {cand.isNonDominated && (
                          <span className="text-[9px] bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 px-1.5 py-0.5 font-bold">
                            PARETO ÓTIMO
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">{cand.tradeoffNote}</div>
                      <div className="text-[11px] text-cyan-300 tabular-nums mt-1">
                        Volta: {cand.metrics.estimatedLapTimeS}s ({cand.metrics.estimatedLapDeltaS >= 0 ? '+' : ''}
                        {cand.metrics.estimatedLapDeltaS}s) · L/D={cand.metrics.aeroEfficiencyLD} ·{' '}
                        {cand.metrics.totalMassKg} kg · ΔT={cand.metrics.thermalMarginK} K
                      </div>
                    </div>
                    {cand.id !== 'baseline' && (
                      <button
                        type="button"
                        onClick={() => updateVehicleParams(cand.paramsPatch)}
                        className="px-3 py-1.5 bg-[#E10600] hover:bg-[#c20500] text-white font-f1-wide font-bold text-[11px] uppercase shrink-0 cursor-pointer"
                      >
                        Aplicar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 6: M11 SEGMENTED RACE SIMULATION                                  */}
      {/* ===================================================================== */}
      {activeSubTab === 'm11_race' && (
        <div className="space-y-4">
          <div className="bg-[#1C1C26] border border-white/10 p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-xs font-f1-mono">
              <div>
                <span className="text-zinc-400 block text-[10px]">Circuito</span>
                <select
                  value={circuitCode}
                  onChange={(e) => setCircuitCode(e.target.value)}
                  className="bg-[#15151E] border border-white/15 px-2.5 py-1.5 text-white"
                >
                  {TRACK_CHARACTERISTICS_CATALOG.map((tr) => (
                    <option key={tr.circuitCode} value={tr.circuitCode}>
                      {tr.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px]">Fidelidade</span>
                <select
                  value={raceFidelity}
                  onChange={(e) => setRaceFidelity(e.target.value as RaceFidelityMode)}
                  className="bg-[#15151E] border border-white/15 px-2.5 py-1.5 text-white"
                >
                  <option value="strategic">Estratégica (3 Setores)</option>
                  <option value="dynamic">Dinâmica Segmentada</option>
                  <option value="advanced">Avançada (SC/VSC Estocástico)</option>
                </select>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px]">Clima</span>
                <select
                  value={raceWeather}
                  onChange={(e) => setRaceWeather(e.target.value as RaceWeatherCondition)}
                  className="bg-[#15151E] border border-white/15 px-2.5 py-1.5 text-white"
                >
                  <option value="dry_clear">Seco Limpo</option>
                  <option value="overcast_cool">Nublado Frio</option>
                  <option value="changing_light_rain">Chuva Variável (Lâmina d&apos;água)</option>
                  <option value="wet_heavy">Chuva Forte</option>
                </select>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px]">Gap Tráfego: {raceTrafficGapS.toFixed(1)}s</span>
                <input
                  type="range"
                  min={0.5}
                  max={4.0}
                  step={0.1}
                  value={raceTrafficGapS}
                  onChange={(e) => setRaceTrafficGapS(Number(e.target.value))}
                  className="accent-[#E10600]"
                />
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px]">Combustível: {raceFuelKg} kg</span>
                <input
                  type="range"
                  min={55}
                  max={105}
                  step={1}
                  value={raceFuelKg}
                  onChange={(e) => setRaceFuelKg(Number(e.target.value))}
                  className="accent-[#E10600]"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => persistToCloudSql('/api/m11/persist')}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-f1-mono font-bold uppercase flex items-center gap-1.5 cursor-pointer"
            >
              <CloudUpload className="w-3.5 h-3.5" />
              <span>Salvar Corrida SQL</span>
            </button>
          </div>

          <RealCircuitMap
            circuitPackage={selectedCircuitPackage}
            trackPhysics={selectedTrackPhysics}
            showInspector
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-f1-mono tabular-nums">
            <div className="bg-[#1C1C26] border border-white/10 p-3">
              <div className="text-zinc-400 text-[10px] uppercase">Tempo Base / Esperado E[T]</div>
              <div className="text-white font-bold text-base">
                {raceOutputs.totalRaceTimeS}s / {raceOutputs.expectedTimeWithUncertaintyS}s
              </div>
            </div>
            <div className="bg-[#1C1C26] border border-white/10 p-3">
              <div className="text-zinc-400 text-[10px] uppercase">Massa Variável m(t)</div>
              <div className="text-cyan-300 font-bold text-base">
                {raceOutputs.massAndFuelBalance.initialVehicleMassKg} → {raceOutputs.massAndFuelBalance.finalVehicleMassKg} kg
              </div>
            </div>
            <div className="bg-[#1C1C26] border border-white/10 p-3">
              <div className="text-zinc-400 text-[10px] uppercase">Resíduo Máx ERS</div>
              <div className="text-emerald-400 font-bold text-base">{raceOutputs.energySummary.maxLapResidualJ} J</div>
            </div>
            <div className="bg-[#1C1C26] border border-white/10 p-3">
              <div className="text-zinc-400 text-[10px] uppercase">Grip / Água Máx</div>
              <div className="text-amber-300 font-bold text-base">
                {raceOutputs.environmentEvolution.initialGrip}→{raceOutputs.environmentEvolution.finalGrip} ·{' '}
                {raceOutputs.environmentEvolution.peakWaterFilmMm} mm
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[#1C1C26] border border-white/10 p-4 space-y-2">
              <h3 className="font-f1-wide font-bold text-xs text-white uppercase">
                Cenários Probabilísticos E[T] = Σ Pᵢ·Tᵢ
              </h3>
              {raceOutputs.strategyScenarios.map((sc) => (
                <div key={sc.scenarioName} className="bg-[#15151E] p-2.5 border border-white/5 text-xs font-f1-mono tabular-nums">
                  <div className="flex justify-between text-white font-bold">
                    <span>{sc.scenarioName}</span>
                    <span className="text-cyan-300">
                      P={(sc.probability * 100).toFixed(0)}% · {sc.totalTimeS}s
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">{sc.riskNotes}</div>
                </div>
              ))}
            </div>

            <div className="bg-[#1C1C26] border border-white/10 p-4 space-y-2">
              <h3 className="font-f1-wide font-bold text-xs text-white uppercase">
                Segmentação Física do Circuito ({raceOutputs.segments.length} trechos)
              </h3>
              <div className="max-h-56 overflow-y-auto space-y-1 text-[11px] font-f1-mono tabular-nums">
                {raceOutputs.segments.map((seg) => (
                  <div key={seg.segmentIndex} className="bg-[#15151E] px-2.5 py-1.5 border border-white/5 flex justify-between">
                    <span className="text-zinc-200 truncate pr-2">
                      {seg.segmentIndex}. {seg.segmentName}
                    </span>
                    <span className="text-zinc-400 shrink-0">
                      {seg.lengthM}m · {seg.aeroModeAllowed} · κ={seg.curvatureInvM}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 7: M12 CALIBRATION, ADAPTERS & GATES 01-12 MATRIX                 */}
      {/* ===================================================================== */}
      {activeSubTab === 'm12_cal_gates' && (
        <div className="space-y-4">
          {/* M12 Controls & Results */}
          <div className="bg-[#1C1C26] border border-white/10 p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-f1-mono text-[#E10600] font-bold uppercase">
                  M12 · CALIBRAÇÃO, IDENTIFICABILIDADE, UQ MONTE CARLO & ADAPTERS EXTERNOS
                </span>
                <h2 className="font-f1-wide font-black text-base text-white uppercase">
                  Estágio de Governança: {calibrationOutputs.lifecycleGovernance.currentStage}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs font-f1-mono">
                <select
                  value={calMethod}
                  onChange={(e) => setCalMethod(e.target.value as CalibrationMethod)}
                  className="bg-[#15151E] border border-white/15 px-2.5 py-1.5 text-white"
                >
                  <option value="levenberg_marquardt">Levenberg-Marquardt</option>
                  <option value="nelder_mead">Nelder-Mead Simplex</option>
                </select>
                <input
                  type="number"
                  value={calMcSamples}
                  min={100}
                  max={1000}
                  step={50}
                  onChange={(e) => setCalMcSamples(Math.max(100, Number(e.target.value)))}
                  className="w-20 bg-[#15151E] border border-white/15 px-2 py-1.5 text-white tabular-nums"
                  title="Amostras Monte Carlo"
                />
                <input
                  type="number"
                  value={calSeed}
                  onChange={(e) => setCalSeed(Number(e.target.value) || 202601)}
                  className="w-24 bg-[#15151E] border border-white/15 px-2 py-1.5 text-white tabular-nums"
                  title="Semente Determinística"
                />
                <button
                  type="button"
                  onClick={() => persistToCloudSql('/api/m12/persist')}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold uppercase flex items-center gap-1.5 cursor-pointer"
                >
                  <CloudUpload className="w-3.5 h-3.5" />
                  <span>Salvar M12 SQL</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-f1-mono tabular-nums">
              <div className="bg-[#15151E] p-3 border border-white/5 space-y-1">
                <div className="text-zinc-400 uppercase text-[10px]">Identificabilidade (J^T·J)</div>
                <div className="text-white font-bold">
                  Rank {calibrationOutputs.identifiability.identifiabilityRank}/3 · κ=
                  {calibrationOutputs.identifiability.conditionNumber}
                </div>
                <div className="text-amber-300 text-[11px]">
                  Colinearidade se (CL, A) livres: κ={calibrationOutputs.identifiability.collinearDiagnosticPair.unfixedConditionNumber}
                </div>
              </div>

              <div className="bg-[#15151E] p-3 border border-white/5 space-y-1">
                <div className="text-zinc-400 uppercase text-[10px]">Validação Cronológica (Zero Leakage)</div>
                <div className="text-emerald-400 font-bold">
                  RMSE={calibrationOutputs.metrics.valRmse} N · R²={calibrationOutputs.metrics.valRSquared}
                </div>
                <div className="text-zinc-400 text-[11px]">
                  Treino={calibrationOutputs.datasetSplit.trainCount} / Val={calibrationOutputs.datasetSplit.validationCount} (t&gt;
                  {calibrationOutputs.datasetSplit.chronologicalSplitTimestampS}s)
                </div>
              </div>

              <div className="bg-[#15151E] p-3 border border-white/5 space-y-1">
                <div className="text-zinc-400 uppercase text-[10px]">
                  Monte Carlo UQ (N={calibrationOutputs.uncertaintyQuantification.monteCarloSamples})
                </div>
                <div className="text-cyan-300 font-bold">
                  P05={calibrationOutputs.uncertaintyQuantification.uqP05} · P50=
                  {calibrationOutputs.uncertaintyQuantification.uqP50} · P95=
                  {calibrationOutputs.uncertaintyQuantification.uqP95} N
                </div>
                <div className="text-zinc-400 text-[11px]">
                  Spread Volta: [{calibrationOutputs.uncertaintyQuantification.lapSensitivitySpreadS.p05}s –{' '}
                  {calibrationOutputs.uncertaintyQuantification.lapSensitivitySpreadS.p95}s]
                </div>
              </div>
            </div>

            {/* External CFD/FEA Honest Capability & Exportable Decks */}
            <div className="bg-[#15151E] border border-white/10 p-3 space-y-2.5 text-xs font-f1-mono">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-white font-bold uppercase">
                  Integração Externa CFD/FEA (Verificação Real de Binários no Host)
                </span>
                <span className="text-zinc-400">
                  Python NumPy/SciPy:{' '}
                  {pythonSciAvailable === null ? '...' : pythonSciAvailable ? 'INSTALADO' : 'NÃO DETECTADO'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {hostAdapters.map((ad) => (
                  <div key={ad.toolName} className="bg-[#1C1C26] p-2.5 border border-white/10 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-white font-bold">{ad.toolName}</span>
                      <span className={ad.status === 'AVAILABLE' ? 'text-emerald-400' : 'text-amber-300'}>
                        {ad.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400">{ad.honestDisclaimer}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    downloadTextFile(
                      'controlDict_OpenFOAM_APEX2026.txt',
                      `${openFoamManifest.controlDictText}\n\n${openFoamManifest.transportPropertiesText}`
                    )
                  }
                  className="px-3 py-1.5 bg-[#1C1C26] hover:bg-white/10 border border-white/15 text-zinc-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Exportar Caso OpenFOAM (controlDict + transportProperties)</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadTextFile('monocoque_APEX2026.inp', calculixManifest.inpDeckText)}
                  className="px-3 py-1.5 bg-[#1C1C26] hover:bg-white/10 border border-white/15 text-zinc-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Exportar Input Deck CalculiX (.inp)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Gates 01-12 Live Grid */}
          <div className="bg-[#1C1C26] border border-white/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-f1-wide font-black text-sm text-white uppercase">
                Auditoria ao Vivo dos Gates 01 a 12 ({fullAudit.passedGatesCount}/12 Aprovados)
              </h3>
              <span className="text-[11px] font-f1-mono text-zinc-400">{fullAudit.edition.editionId}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {fullAudit.gates.map((gate) => (
                <div
                  key={gate.gateId}
                  className={`p-3 border text-xs font-f1-mono space-y-1.5 ${
                    gate.passed
                      ? 'bg-[#15151E] border-emerald-500/35'
                      : 'bg-red-950/20 border-red-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-f1-wide font-bold text-white">
                      {gate.moduleCode} · {gate.gateId}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-bold flex items-center gap-1 ${
                        gate.passed ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {gate.passed ? 'APROVADO' : 'PENDENTE'}
                    </span>
                  </div>
                  <div className="space-y-0.5 text-[10px] text-zinc-400">
                    {gate.criteria.map((c) => (
                      <div key={c.id} className={c.passed ? 'text-zinc-300' : 'text-red-300'}>
                        {c.passed ? '✓' : '✗'} {c.id}: {c.detail}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Persistent Traceability Matrix Table */}
          <div className="bg-[#1C1C26] border border-white/10 p-4 space-y-2">
            <h3 className="font-f1-wide font-black text-sm text-white uppercase">
              Matriz de Rastreabilidade (Manual Mestre ↔ M01–M12 ↔ PostgreSQL ↔ Testes)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] font-f1-mono border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-400 text-left">
                    <th className="py-1.5 pr-2">ID / Módulo</th>
                    <th className="py-1.5 pr-2">Seção</th>
                    <th className="py-1.5 pr-2">Equação / Fenômeno</th>
                    <th className="py-1.5 pr-2">Componente & Tabelas SQL</th>
                    <th className="py-1.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {fullAudit.traceability.map((row) => (
                    <tr key={row.reqCode} className="border-b border-white/5 text-zinc-200">
                      <td className="py-1.5 pr-2 font-bold text-white">
                        {row.reqCode} ({row.moduleCode})
                      </td>
                      <td className="py-1.5 pr-2 text-zinc-400">{row.manualSection}</td>
                      <td className="py-1.5 pr-2 text-cyan-300">{row.equationRef}</td>
                      <td className="py-1.5 pr-2 text-zinc-400">
                        {row.softwareComponent} · [{row.dbTables}]
                      </td>
                      <td className="py-1.5 font-bold text-emerald-400">{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
