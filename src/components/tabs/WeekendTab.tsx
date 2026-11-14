import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { F1TabBucket } from '../brand/F1Logo';
import { TireCompound, EngineMode, AeroMode, PaceMode, FuelMixMode } from '../../types/f1';
import { RealCircuitMap } from '../circuits/RealCircuitMap';
import {
  Flag,
  Play,
  Pause,
  FastForward,
  RotateCcw,
  Zap,
  Wind,
  Gauge,
  Flame,
  Droplet,
  CloudRain,
  Sun,
  ShieldAlert,
  ArrowRight,
  Clock,
  Radio,
  Sliders
} from 'lucide-react';

export const WeekendTab: React.FC = () => {
  const {
    currentCircuit,
    currentCircuitPackage,
    currentTrackPhysics,
    weekendSession,
    setWeekendSession,
    carSetup,
    setupWindow,
    updateCarSetup,
    modificadorSetupRapido,
    fpRunsDone,
    runPracticeLap,
    qualifyingResults,
    runQualifyingShootout,
    isRaceLive,
    isRacePaused,
    raceSpeed,
    currentLap,
    totalLaps,
    liveCars,
    trackWeather,
    trackGripPercent,
    safetyCarStatus,
    trackFlagStatus,
    raceControlFeed,
    pitLaneStartDriverIds,
    togglePitLaneStart,
    resumeFromRedFlag,
    skipToChequeredFlag,
    startRace,
    pauseResumeRace,
    setRaceSpeedMultiplier,
    updateDriverTactics,
    orderPitStop,
    finishRaceWeekend,
    drivers,
    allTeams,
    playerTeam,
    vehiclePhysics,
    t,
    language
  } = useGame();

  const [practiceFeedback, setPracticeFeedback] = useState<string | null>(null);
  const [selectedDriverTactics, setSelectedDriverTactics] = useState<string>('');
  const [selectedPitCompound, setSelectedPitCompound] = useState<TireCompound>('medium');

  const playerCars = liveCars.filter(c => c.isPlayer);
  const activeCar = playerCars.find(c => c.driverId === selectedDriverTactics) || playerCars[0];
  const allPlayerCarsRetired =
    playerCars.length > 0 && playerCars.every(c => c.status === 'retired' || c.isDisqualified);

  const handlePracticeStint = () => {
    const res = runPracticeLap();
    setPracticeFeedback(res.feedback);
  };

  const getCompoundBadge = (compound: TireCompound) => {
    switch (compound) {
      case 'soft':
        return <span className="px-1.5 py-0.5 bg-[#E10600] text-white font-f1-mono font-bold text-[10px] rounded-none">S</span>;
      case 'medium':
        return <span className="px-1.5 py-0.5 bg-[#FFE500] text-black font-f1-mono font-bold text-[10px] rounded-none">M</span>;
      case 'hard':
        return <span className="px-1.5 py-0.5 bg-white text-black font-f1-mono font-bold text-[10px] rounded-none">H</span>;
      case 'inter':
        return <span className="px-1.5 py-0.5 bg-[#47C7FC] text-black font-f1-mono font-bold text-[10px] rounded-none">I</span>;
      case 'wet':
        return <span className="px-1.5 py-0.5 bg-[#0055FF] text-white font-f1-mono font-bold text-[10px] rounded-none">W</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Grand Prix Weekend Header Strip */}
      <div className="bg-[#1C1C26] border border-white/10 p-5 f1-pattern-micro-grid">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-f1-mono text-[#E10600] font-bold tracking-widest uppercase">
              <span>ROUND OPERATIONS</span>
              <span>·</span>
              <span>{currentCircuit.city.toUpperCase()} GRAND PRIX</span>
            </div>
            <h1 className="font-f1-wide font-black text-xl lg:text-2xl text-white uppercase mt-0.5">
              {currentCircuit.name}
            </h1>
            <div className="flex items-center gap-4 text-xs font-f1-mono text-zinc-400 mt-1">
              <span>{currentCircuit.laps} Laps ({currentCircuit.lapDistanceKm} km)</span>
              <span>·</span>
              <span>Aero: {currentCircuit.aeroDemand.toUpperCase()}</span>
              <span>·</span>
              <span>Weather: {trackWeather.toUpperCase()} ({trackGripPercent}% Grip)</span>
            </div>
          </div>

          {/* Weekend Session Stepper */}
          <div className="flex items-center gap-1 bg-[#15151E] p-1 border border-white/10 shrink-0">
            <button
              onClick={() => setWeekendSession('setup_fp')}
              className={`px-3 py-1.5 text-xs font-f1-wide uppercase tracking-wider transition-colors ${
                weekendSession === 'setup_fp' ? 'bg-[#E10600] text-white font-bold' : 'text-zinc-400'
              }`}
            >
              {t.freePractice}
            </button>
            <button
              onClick={() => setWeekendSession('qualifying')}
              className={`px-3 py-1.5 text-xs font-f1-wide uppercase tracking-wider transition-colors ${
                weekendSession === 'qualifying' ? 'bg-[#E10600] text-white font-bold' : 'text-zinc-400'
              }`}
            >
              {t.qualifying}
            </button>
            <button
              onClick={() => setWeekendSession('race')}
              className={`px-3 py-1.5 text-xs font-f1-wide uppercase tracking-wider transition-colors ${
                weekendSession === 'race' ? 'bg-[#E10600] text-white font-bold' : 'text-zinc-400'
              }`}
            >
              {t.liveRace}
            </button>
          </div>
        </div>
      </div>

      {/* PHASE 1: FREE PRACTICE (FP1/2/3) SETUP WINDOW */}
      {weekendSession === 'setup_fp' && (
        <div className="space-y-6">
          <RealCircuitMap
            circuitPackage={currentCircuitPackage}
            trackPhysics={currentTrackPhysics}
            showInspector
          />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Setup Window Sliders (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <F1TabBucket
              title="TELEMETRY SETUP WINDOW OPTIMIZATION"
              badge={`STINT ${fpRunsDone} / 3 COMPLETED`}
            >
              <div className="space-y-5">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Dial in the aerodynamic wing angles, mechanical spring rates, and camber. 
                  High confidence narrows the lap time delta during Qualifying and stabilizes tire thermal graining.
                </p>

                {/* Front Wing Slider */}
                <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-f1-wide font-bold text-white uppercase">FRONT WING FLAP ANGLE</span>
                    <span className="font-f1-mono text-[#E10600] font-bold tabular-nums">{carSetup.frontWingAngle}°</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={45}
                    value={carSetup.frontWingAngle}
                    onChange={e => updateCarSetup({ frontWingAngle: Number(e.target.value) })}
                    className="w-full accent-[#E10600] h-1.5 bg-zinc-700"
                  />
                  <div className="flex justify-between text-[10px] font-f1-mono text-zinc-400">
                    <span>10° (Low Drag Straights)</span>
                    <span>45° (High Apex Bite)</span>
                  </div>
                </div>

                {/* Rear Wing Slider */}
                <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-f1-wide font-bold text-white uppercase">REAR WING DOWNFORCE ANGLE</span>
                    <span className="font-f1-mono text-[#E10600] font-bold tabular-nums">{carSetup.rearWingAngle}°</span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={50}
                    value={carSetup.rearWingAngle}
                    onChange={e => updateCarSetup({ rearWingAngle: Number(e.target.value) })}
                    className="w-full accent-[#E10600] h-1.5 bg-zinc-700"
                  />
                </div>

                {/* Suspension Stiffness */}
                <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-f1-wide font-bold text-white uppercase">SUSPENSION SPRING STIFFNESS</span>
                    <span className="font-f1-mono text-white font-bold tabular-nums">{carSetup.suspensionStiffness} / 10</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={carSetup.suspensionStiffness}
                    onChange={e => updateCarSetup({ suspensionStiffness: Number(e.target.value) })}
                    className="w-full accent-[#E10600] h-1.5 bg-zinc-700"
                  />
                  <div className="flex justify-between text-[10px] font-f1-mono text-zinc-400">
                    <span>Soft (Curbs & Traction)</span>
                    <span>Rigid (Aero Ground Effect Stability)</span>
                  </div>
                </div>

                {/* Tire Pressure */}
                <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-f1-wide font-bold text-white uppercase">TIRE PRESSURE</span>
                    <span className="font-f1-mono text-white font-bold tabular-nums">{carSetup.tirePressurePsi.toFixed(1)} PSI</span>
                  </div>
                  <input
                    type="range"
                    min={20.0}
                    max={25.0}
                    step={0.1}
                    value={carSetup.tirePressurePsi}
                    onChange={e => updateCarSetup({ tirePressurePsi: Number(e.target.value) })}
                    className="w-full accent-[#E10600] h-1.5 bg-zinc-700"
                  />
                </div>

                {/* Action button */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <button
                    onClick={handlePracticeStint}
                    disabled={fpRunsDone >= 3}
                    className="px-5 py-2.5 bg-[#E10600] hover:bg-[#c20500] disabled:opacity-40 text-white font-f1-wide font-bold text-xs uppercase tracking-wider f1-tab-chamfer transition-colors"
                  >
                    Send Out for Practice Stint
                  </button>

                  <button
                    onClick={() => {
                      runQualifyingShootout();
                      setWeekendSession('qualifying');
                    }}
                    className="px-4 py-2 bg-[#232330] hover:bg-[#2C2C3A] text-white font-f1-wide text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5"
                  >
                    <span>Proceed to Qualifying</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </F1TabBucket>
          </div>

          {/* Setup Window Confidence & Driver Feedback (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <F1TabBucket title="DRIVER RADIO & SETUP WINDOW" badge={`${setupWindow.confidence}% CONFIDENCE`}>
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-f1-mono">
                    <span className="text-zinc-400">SETUP CONVERGENCE</span>
                    <div className="flex items-center gap-2">
                      {modificadorSetupRapido && (
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/50 border border-emerald-500/50 px-1.5 py-0.5">
                          SETUP 50% MAIS RÁPIDO
                        </span>
                      )}
                      <span className="text-emerald-400 font-bold tabular-nums">{setupWindow.confidence}%</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-[#15151E] overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${setupWindow.confidence}%` }}
                    />
                  </div>
                </div>

                {/* Driver Radio Box */}
                <div className="bg-[#15151E] p-4 border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-f1-wide font-bold text-[#E10600]">
                    <Radio className="w-4 h-4" />
                    <span>DRIVER PIT RADIO TRANSCRIPT</span>
                  </div>
                  <p className="text-xs text-zinc-300 italic leading-relaxed">
                    "{practiceFeedback || 'Awaiting initial outlap data. Send the car out to gather aero telemetry and brake balance feedback.'}"
                  </p>
                </div>

                <div className="bg-[#15151E] p-3 border border-white/5 text-xs font-f1-mono space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase block">ENGINEER TARGET CORRIDOR</span>
                  <div className="text-zinc-400">Ideal Front Wing: <span className="text-white font-bold">{setupWindow.idealFrontWing}° (±1.5°)</span></div>
                  <div className="text-zinc-400">Ideal Stiffness: <span className="text-white font-bold">{setupWindow.idealStiffness} / 10</span></div>
                </div>

                {/* Compact SI Physical Telemetry Readout */}
                <div className="bg-[#15151E] p-3 border border-white/10 text-xs font-f1-mono space-y-2">
                  <span className="text-[10px] text-cyan-400 uppercase font-bold block">
                    TELEMETRIA FÍSICA HOMOLOGADA (SI)
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-[#1C1C26] p-2 border border-white/5">
                      <span className="text-[9px] text-zinc-400 block">MODO Z / MODO X (L/D)</span>
                      <span className="text-white font-bold">
                        {vehiclePhysics.cornerMode.aeroEfficiencyLD} / -{vehiclePhysics.straightMode.dragReductionPct}% CdA
                      </span>
                    </div>
                    <div className="bg-[#1C1C26] p-2 border border-white/5">
                      <span className="text-[9px] text-zinc-400 block">BALANÇO / PORPOISING</span>
                      <span className={vehiclePhysics.porpoisingRiskPct > 50 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {vehiclePhysics.cornerMode.aeroBalanceFrontPct}% F · {vehiclePhysics.porpoisingRiskPct}% PLT
                      </span>
                    </div>
                    <div className="bg-[#1C1C26] p-2 border border-white/5">
                      <span className="text-[9px] text-zinc-400 block">MARGEM TÉRMICA PU</span>
                      <span className={vehiclePhysics.thermalMarginC < 4 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {vehiclePhysics.thermalMarginC}°C ({vehiclePhysics.batteryCellTempC}°C ERS)
                      </span>
                    </div>
                    <div className="bg-[#1C1C26] p-2 border border-white/5">
                      <span className="text-[9px] text-zinc-400 block">MASSA / JANELA PNEU</span>
                      <span className="text-cyan-300 font-bold">
                        {vehiclePhysics.totalMassKg} kg · {vehiclePhysics.tireThermalWindowHealthPct}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </F1TabBucket>
          </div>
        </div>
        </div>
      )}

      {/* PHASE 2: QUALIFYING KNOCKOUT SHOOTOUT */}
      {weekendSession === 'qualifying' && (
        <div className="space-y-6">
          <F1TabBucket
            title="OFFICIAL QUALIFYING KNOCKOUT TIMING TOWER"
            badge={`${qualifyingResults.length} PILOTOS · 12 EQUIPES`}
          >
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-f1-mono">
                <span className="text-zinc-400">
                  GRID OFICIAL FIA 2026: {qualifyingResults.length} CARROS (VOCÊ PODE OPTAR POR LARGAR DOS BOXES)
                </span>
                <button
                  onClick={() => {
                    startRace();
                  }}
                  className="px-5 py-2.5 bg-[#E10600] hover:bg-[#c20500] text-white font-f1-wide font-bold text-xs uppercase tracking-wider f1-tab-chamfer transition-colors flex items-center gap-2"
                >
                  <Flag className="w-4 h-4" />
                  <span>Commence Grand Prix Race (Lights Out)</span>
                </button>
              </div>

              {/* Timing Table */}
              <div className="divide-y divide-white/5 bg-[#15151E] border border-white/5">
                {qualifyingResults.map((q, idx) => {
                  const driver = drivers.find(d => d.id === q.driverId);
                  const team = allTeams.find(t => t.id === driver?.teamId);
                  const isPlayer = driver?.teamId === playerTeam.id || Boolean(team?.isPlayer);
                  const isPitStart = pitLaneStartDriverIds.includes(q.driverId);
                  const poleLap = qualifyingResults[0]?.lapTimeSec || 80;
                  const deltaSec = q.lapTimeSec - poleLap;

                  return (
                    <div
                      key={q.driverId}
                      className={`flex items-center justify-between py-2 px-3 text-xs font-f1-mono ${
                        isPlayer ? 'bg-[#E10600]/15 font-bold text-white' : 'text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5 text-right font-bold text-zinc-400">{idx + 1}</span>
                        <span className="w-1.5 h-3" style={{ backgroundColor: team?.color || '#888' }} />
                        <span className="font-f1-wide uppercase text-white font-bold">{driver?.name}</span>
                        <span className="text-zinc-500 text-[10px]">{team?.shortName}</span>
                        {isPlayer && (
                          <button
                            type="button"
                            onClick={() => togglePitLaneStart(q.driverId)}
                            className={`px-2 py-0.5 text-[10px] font-f1-mono border transition-colors ${
                              isPitStart
                                ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                                : 'bg-white/5 border-white/15 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {isPitStart ? 'LARGADA DOS BOXES ATIVA' : 'Largar dos Boxes'}
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-6 tabular-nums">
                        <span className="text-white font-bold">{q.lapTimeSec.toFixed(3)}s</span>
                        <span className={`w-16 text-right ${idx === 0 ? 'text-purple-400 font-bold' : 'text-zinc-400'}`}>
                          {isPitStart ? 'PIT LANE' : idx === 0 ? 'POLE' : `+${deltaSec.toFixed(3)}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </F1TabBucket>
        </div>
      )}

      {/* PHASE 3: THE LIVE GRAND PRIX PIT WALL */}
      {weekendSession === 'race' && (
        <div className="space-y-6">
          {/* Race Command Bar: Lap, Speed, Pause, FIA Flag & Weather */}
          <div className="bg-[#1C1C26] border border-white/10 p-3 f1-pattern-micro-grid flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#E10600] rounded-none animate-pulse" />
                <span className="font-f1-wide font-black text-sm text-white uppercase tracking-wider">
                  LIVE GRAND PRIX
                </span>
              </div>
              <div className="text-xs font-f1-mono bg-[#15151E] px-2.5 py-1 border border-white/5">
                LAP <span className="text-white font-bold tabular-nums">{currentLap}</span> / {totalLaps}
              </div>

              {/* FIA Track Flag Status Pill */}
              <div
                className={`px-2.5 py-1 text-xs font-f1-wide font-bold uppercase border flex items-center gap-1.5 ${
                  trackFlagStatus === 'red'
                    ? 'bg-red-600/25 border-red-500 text-red-300 animate-pulse'
                    : trackFlagStatus === 'sc' || safetyCarStatus === 'full_sc'
                    ? 'bg-amber-500/25 border-amber-400 text-amber-300 animate-pulse'
                    : trackFlagStatus === 'vsc' || safetyCarStatus === 'vsc'
                    ? 'bg-yellow-500/20 border-yellow-400 text-yellow-200'
                    : trackFlagStatus === 'yellow'
                    ? 'bg-yellow-500/15 border-yellow-500/70 text-yellow-300'
                    : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>
                  {trackFlagStatus === 'red'
                    ? 'BANDEIRA VERMELHA'
                    : trackFlagStatus === 'sc'
                    ? 'SAFETY CAR NA PISTA'
                    : trackFlagStatus === 'vsc'
                    ? 'VIRTUAL SAFETY CAR (VSC)'
                    : trackFlagStatus === 'yellow'
                    ? 'BANDEIRA AMARELA'
                    : 'BANDEIRA VERDE'}
                </span>
              </div>

              <div className="text-[11px] font-f1-mono bg-[#15151E] px-2.5 py-1 border border-white/5 text-zinc-300 flex items-center gap-1.5">
                {trackWeather === 'heavy_rain' || trackWeather === 'light_rain' ? (
                  <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span className="uppercase">{trackWeather.replace('_', ' ')}</span>
                <span className="text-zinc-500">· Aderência {trackGripPercent}%</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {trackFlagStatus === 'red' && (
                <button
                  onClick={resumeFromRedFlag}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-f1-wide font-bold text-xs uppercase tracking-wider"
                >
                  Autorizar Relargada
                </button>
              )}

              {allPlayerCarsRetired && (
                <button
                  onClick={skipToChequeredFlag}
                  className="px-3 py-1.5 bg-[#E10600] hover:bg-[#c20500] text-white font-f1-wide font-bold text-xs uppercase tracking-wider flex items-center gap-1.5"
                >
                  <FastForward className="w-3.5 h-3.5" />
                  <span>Avançar até Bandeirada</span>
                </button>
              )}

              {/* Speed Multiplier Controls */}
              <div className="flex items-center gap-1 bg-[#15151E] p-1 border border-white/10 text-xs font-f1-mono">
                <button
                  onClick={pauseResumeRace}
                  className="p-1.5 text-zinc-300 hover:text-white"
                  title={isRacePaused ? 'Resume' : 'Pause'}
                >
                  {isRacePaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
                </button>
                {[1, 2, 5, 10].map(s => (
                  <button
                    key={s}
                    onClick={() => setRaceSpeedMultiplier(s)}
                    className={`px-2 py-1 font-bold ${raceSpeed === s ? 'bg-[#E10600] text-white' : 'text-zinc-400 hover:text-white'}`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {allPlayerCarsRetired && (
            <div className="bg-red-950/50 border border-red-500/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-f1-wide font-bold text-red-300 uppercase block">
                  DUPLO ABANDONO DA EQUIPE NA CORRIDA
                </span>
                <p className="text-xs text-zinc-300 mt-0.5">
                  Ambos os carros da equipe abandonaram ou foram desclassificados. Você pode acompanhar a disputa ou avançar diretamente para a bandeirada final.
                </p>
              </div>
              <button
                onClick={skipToChequeredFlag}
                className="px-4 py-2 bg-[#E10600] hover:bg-[#c20500] text-white font-f1-wide font-bold text-xs uppercase tracking-wider shrink-0"
              >
                Simular Até Bandeirada Final
              </button>
            </div>
          )}

          {/* Live Track Radar with Real GeoJSON Centerline & Car Positions */}
          <RealCircuitMap
            circuitPackage={currentCircuitPackage}
            trackPhysics={currentTrackPhysics}
            liveCars={liveCars}
            showInspector
          />

          {/* Grid Layout: Left Column (Live Timing Tower + Race Control) / Right Column (Telemetry & Strategy) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 24 Car Timing Tower (6 cols) */}
            <div className="lg:col-span-6 space-y-4">
              <F1TabBucket title={`GRAND PRIX TIMING TOWER (${liveCars.length} CARROS)`} badge="REAL-TIME GAPS">
                <div className="divide-y divide-white/5 bg-[#15151E] border border-white/5 max-h-[580px] overflow-y-auto">
                  {liveCars.map((car, idx) => {
                    const isLeader = idx === 0 && car.status !== 'retired' && !car.isDisqualified;
                    const isOut = car.status === 'retired' || Boolean(car.isDisqualified);

                    return (
                      <div
                        key={car.driverId}
                        className={`flex items-center justify-between py-2 px-2.5 text-xs font-f1-mono transition-colors ${
                          isOut
                            ? 'opacity-60 bg-black/30 text-zinc-500'
                            : car.isPlayer
                            ? 'bg-[#E10600]/15 font-bold text-white'
                            : 'text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-4 text-right font-bold text-zinc-400 tabular-nums">
                            {car.position}
                          </span>
                          <span className="w-1.5 h-3 shrink-0" style={{ backgroundColor: car.teamColor }} />
                          <span className="font-f1-wide uppercase text-white font-bold w-11 truncate">
                            {car.shortCode}
                          </span>
                          <span className="text-[10px] text-zinc-400 truncate max-w-[90px] hidden sm:inline">
                            {car.driverName.split(' ').slice(-1)[0]}
                          </span>
                          {getCompoundBadge(car.tireCompound)}
                          <span className="text-[10px] text-zinc-500 tabular-nums">
                            {car.tireWearPercent}%w
                          </span>
                          {car.hasBlueFlag && !isOut && (
                            <span className="text-[9px] bg-blue-600/80 text-white px-1 font-bold" title="Bandeira Azul">
                              AZUL
                            </span>
                          )}
                          {(car.penaltySec ?? 0) > 0 && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-400/40 px-1 font-bold">
                              +{car.penaltySec}s
                            </span>
                          )}
                          {car.damagePercent >= 15 && !isOut && (
                            <span className="text-[9px] bg-red-500/20 text-red-300 px-1 font-bold">
                              {car.damagePercent}%D
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2.5 tabular-nums shrink-0">
                          {!isOut && (
                            <div className="w-10 bg-white/10 h-1.5 overflow-hidden hidden sm:block">
                              <div
                                className={`h-full ${car.hasDerating ? 'bg-red-500' : 'bg-emerald-400'}`}
                                style={{ width: `${car.socPercent}%` }}
                              />
                            </div>
                          )}

                          <span
                            className={`w-16 text-right font-f1-mono font-bold ${
                              car.isDisqualified
                                ? 'text-red-400'
                                : car.status === 'retired'
                                ? 'text-amber-400'
                                : isLeader
                                ? 'text-purple-400'
                                : 'text-white'
                            }`}
                          >
                            {car.isDisqualified
                              ? 'DSQ'
                              : car.status === 'retired'
                              ? 'DNF'
                              : isLeader
                              ? 'LEADER'
                              : `+${car.gapToLeaderSec.toFixed(3)}`}
                          </span>

                          {car.inPitLane && !isOut && (
                            <span className="text-[9px] font-f1-wide bg-[#E10600] text-white px-1 font-bold">
                              {car.startedFromPitLane && (car.pitLaneStartTicks ?? 0) > 0 ? 'BOX START' : 'PIT'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </F1TabBucket>

              {/* Live FIA Race Control Feed */}
              <F1TabBucket title="DIREÇÃO DE PROVA FIA (RACE CONTROL)" badge={`${raceControlFeed.length} REGISTROS`}>
                <div className="space-y-1.5 max-h-48 overflow-y-auto text-[11px] font-f1-mono">
                  {raceControlFeed.length === 0 ? (
                    <div className="text-zinc-500 py-2">Sem ocorrências registradas até o momento.</div>
                  ) : (
                    raceControlFeed.slice(0, 12).map(evt => (
                      <div key={evt.id} className="bg-[#15151E] border border-white/5 px-2.5 py-1.5 flex items-start gap-2">
                        <span
                          className={`px-1.5 py-0.5 text-[9px] font-bold uppercase shrink-0 ${
                            evt.flag === 'red' || evt.flag === 'black'
                              ? 'bg-red-600 text-white'
                              : evt.flag === 'sc' || evt.flag === 'vsc' || evt.flag === 'penalty'
                              ? 'bg-amber-500 text-black'
                              : evt.flag === 'yellow'
                              ? 'bg-yellow-400 text-black'
                              : 'bg-emerald-500 text-black'
                          }`}
                        >
                          V{evt.lap}
                        </span>
                        <div className="min-w-0">
                          <div className="text-white font-bold uppercase text-[10px]">{evt.title}</div>
                          <div className="text-zinc-400 text-[10px] leading-snug">{evt.message}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </F1TabBucket>
            </div>

            {/* Right Column: Player Driver Live Telemetry & In-Race Tactical Orders (6 cols) */}
            <div className="lg:col-span-6 space-y-6">
              {/* Driver selector */}
              <div className="flex items-center gap-2">
                {playerCars.map(car => (
                  <button
                    key={car.driverId}
                    onClick={() => setSelectedDriverTactics(car.driverId)}
                    className={`flex-1 p-2.5 border text-xs font-f1-wide uppercase tracking-wider transition-all ${
                      activeCar?.driverId === car.driverId
                        ? 'bg-[#E10600] text-white border-[#E10600] font-bold shadow-md'
                        : 'bg-[#1C1C26] border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>
                      Car #{car.driverNumber} · {car.driverName} (
                      {car.isDisqualified ? 'DSQ' : car.status === 'retired' ? 'DNF' : `P${car.position}`})
                    </span>
                  </button>
                ))}
              </div>

              {activeCar && (activeCar.status === 'retired' || activeCar.isDisqualified) && (
                <div className="bg-red-950/40 border border-red-500/50 p-4 space-y-1 font-f1-mono">
                  <div className="text-xs font-f1-wide font-bold text-red-300 uppercase">
                    {activeCar.isDisqualified
                      ? `CARRO #${activeCar.driverNumber} DESCLASSIFICADO (BANDEIRA PRETA FIA)`
                      : `CARRO #${activeCar.driverNumber} ABANDONOU NA VOLTA ${activeCar.lap} (DNF)`}
                  </div>
                  <div className="text-xs text-zinc-300">
                    Motivo: <span className="text-white font-bold">{activeCar.retireReason || 'Incidente de corrida'}</span>
                  </div>
                </div>
              )}

              {activeCar && (
                <div className="space-y-4">
                  {/* Real-Time Cockpit Telemetry Display */}
                  <F1TabBucket
                    title={`CAR #${activeCar.driverNumber} TELEMETRY TRACE`}
                    badge={activeCar.hasDerating ? 'DERATING ALERT' : 'OPTIMAL'}
                  >
                    <div className="space-y-4">
                      {/* ERS State of Charge (SoC) Bar */}
                      <div className="bg-[#15151E] p-3 border border-white/5 space-y-1.5">
                        <div className="flex justify-between text-xs font-f1-mono">
                          <span className="text-zinc-400 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-emerald-400" />
                            350kW ERS BATTERY CHARGE (SoC)
                          </span>
                          <span className={`font-bold tabular-nums ${activeCar.hasDerating ? 'text-red-400' : 'text-emerald-400'}`}>
                            {activeCar.socPercent}% {activeCar.hasDerating && '(DERATING: NO BOOST)'}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-white/10 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              activeCar.hasDerating ? 'bg-red-500' : 'bg-emerald-400'
                            }`}
                            style={{ width: `${activeCar.socPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Live SI Thermal, Aero & Tire Physical Strip */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-f1-mono">
                        <div className="bg-[#15151E] p-2 border border-white/5">
                          <span className="text-zinc-400 block">AERO ATIVA</span>
                          <span className="text-white font-bold">
                            {activeCar.aeroMode === 'mode_x'
                              ? `Modo X (-${vehiclePhysics.straightMode.dragReductionPct}% CdA)`
                              : `Modo Z (${vehiclePhysics.cornerMode.aeroBalanceFrontPct}% F)`}
                          </span>
                        </div>
                        <div className="bg-[#15151E] p-2 border border-white/5">
                          <span className="text-zinc-400 block">TEMP. ERS / MARGEM</span>
                          <span className={vehiclePhysics.thermalMarginC < 4 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                            {activeCar.batteryTempC.toFixed(1)}°C ({vehiclePhysics.thermalMarginC}°C)
                          </span>
                        </div>
                        <div className="bg-[#15151E] p-2 border border-white/5">
                          <span className="text-zinc-400 block">JANELA PNEU</span>
                          <span className="text-cyan-300 font-bold">
                            {vehiclePhysics.tireThermalWindowHealthPct}% (x{vehiclePhysics.tireWearRateMultiplier})
                          </span>
                        </div>
                        <div className="bg-[#15151E] p-2 border border-white/5">
                          <span className="text-zinc-400 block">MASSA / POTÊNCIA</span>
                          <span className="text-white font-bold">
                            {vehiclePhysics.totalMassKg} kg · {vehiclePhysics.totalWheelPowerHp} CV
                          </span>
                        </div>
                      </div>

                      {/* E-Fuel Consumption & Telemetry Bar (2026 Regulation) */}
                      <div className="bg-[#15151E] p-3 border border-white/5 space-y-2.5">
                        <div className="flex justify-between items-center text-xs font-f1-mono">
                          <span className="text-zinc-400 flex items-center gap-1.5">
                            <Droplet className="w-3.5 h-3.5 text-lime-400" />
                            CONSUMO DE COMBUSTÍVEL (100% E-FUEL)
                          </span>
                          <span className="font-bold tabular-nums text-white">
                            {activeCar.fuelRemainingKg.toFixed(1)} kg / {activeCar.fuelInitialKg} kg
                          </span>
                        </div>

                        {/* Tanque de Combustível Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-f1-mono text-zinc-400">
                            <span>Carga no Tanque</span>
                            <span className={activeCar.fuelRemainingKg < 10 ? 'text-red-400 font-bold animate-pulse' : 'text-zinc-300'}>
                              {((activeCar.fuelRemainingKg / activeCar.fuelInitialKg) * 100).toFixed(0)}%
                              {activeCar.fuelRemainingKg < 10 && ' (CRÍTICO: RISCO PANE SECA)'}
                            </span>
                          </div>
                          <div className="h-2 w-full bg-white/10 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                activeCar.fuelRemainingKg < 10 ? 'bg-red-500' : activeCar.fuelRemainingKg < 25 ? 'bg-amber-500' : 'bg-lime-500'
                              }`}
                              style={{ width: `${Math.min(100, (activeCar.fuelRemainingKg / activeCar.fuelInitialKg) * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Gráfico de Barra: Consumo de Combustível (kg/volta) */}
                        {(() => {
                          const mixMult = activeCar.fuelMixMode === 'rich' ? 2.0 : (activeCar.fuelMixMode === 'lean' ? 0.7 : 1.0);
                          const activeBurnRate = activeCar.fuelBurnKgPerLap * mixMult;
                          const maxRefBurn = 3.2; // Maximum scale for graph
                          const percentOfScale = Math.min(100, (activeBurnRate / maxRefBurn) * 100);

                          return (
                            <div className="space-y-1 bg-[#1C1C26] p-2 border border-white/5">
                              <div className="flex justify-between items-center text-[11px] font-f1-mono">
                                <span className="text-zinc-400 font-bold uppercase">Consumo de Combustível (kg/volta):</span>
                                <span className={`font-black tabular-nums text-sm ${
                                  activeCar.fuelMixMode === 'rich' ? 'text-amber-400' : activeCar.fuelMixMode === 'lean' ? 'text-emerald-400' : 'text-lime-400'
                                }`}>
                                  {activeBurnRate.toFixed(2)} kg/volta
                                </span>
                              </div>
                              
                              <div className="h-3 w-full bg-black/60 border border-white/10 overflow-hidden relative">
                                <div
                                  className={`h-full transition-all duration-300 ${
                                    activeCar.fuelMixMode === 'rich'
                                      ? 'bg-gradient-to-r from-amber-600 to-red-500'
                                      : activeCar.fuelMixMode === 'lean'
                                      ? 'bg-gradient-to-r from-emerald-600 to-teal-400'
                                      : 'bg-gradient-to-r from-lime-600 to-emerald-400'
                                  }`}
                                  style={{ width: `${percentOfScale}%` }}
                                />
                                {/* FIA Reference line at 1.75 kg/volta */}
                                <div
                                  className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10"
                                  style={{ left: `${(1.75 / maxRefBurn) * 100}%` }}
                                  title="Fluxo Limite FIA (70kg/h)"
                                />
                              </div>

                              <div className="flex justify-between text-[9px] font-f1-mono text-zinc-500">
                                <span>0.0 kg/v</span>
                                <span className="text-zinc-400">Teto FIA 2026: ~1.75 kg/v (70 kg/h)</span>
                                <span>3.2 kg/v</span>
                              </div>

                              <div className="flex items-center justify-between text-[10px] font-f1-mono pt-1 border-t border-white/5">
                                <span className="text-zinc-400">Status Fuel Saving:</span>
                                <span className={`font-bold ${
                                  activeCar.fuelMixMode === 'lean' || activeCar.eFuelRating > 85
                                    ? 'text-emerald-400'
                                    : activeCar.fuelSavingPenaltySec <= 0.1
                                    ? 'text-amber-400'
                                    : 'text-red-400'
                                }`}>
                                  {activeCar.fuelMixMode === 'lean'
                                    ? 'Modo Pobre: Sem Penalidade (0.0s)'
                                    : activeCar.eFuelRating > 85
                                    ? 'E-Fuel > 85: Sem Penalidade (0.0s) · Carro -15kg'
                                    : activeCar.fuelSavingPenaltySec <= 0.1
                                    ? 'Fuel Saving Leve (+0.1s/v)'
                                    : 'Fuel Saving Severo (+0.3s/v)'}
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Tactical Directives: Pace & ERS & Active Aero */}
                      {activeCar.status === 'running' && !activeCar.isDisqualified && (
                      <div className="space-y-3">
                        {/* Pace Mode */}
                        <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                          <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">DRIVER PACE MODE</span>
                          <div className="grid grid-cols-4 gap-1.5">
                            {(['conserve', 'balanced', 'push', 'attack'] as PaceMode[]).map(mode => (
                              <button
                                key={mode}
                                onClick={() => updateDriverTactics(activeCar.driverId, { paceMode: mode })}
                                className={`py-1.5 text-xs font-f1-wide uppercase tracking-wider ${
                                  activeCar.paceMode === mode
                                    ? 'bg-[#E10600] text-white font-bold'
                                    : 'bg-[#1C1C26] text-zinc-400 hover:text-white'
                                }`}
                              >
                                {mode}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* MODO DE MISTURA (E-FUEL MIX: RICO / PADRÃO / POBRE) */}
                        <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-f1-mono text-zinc-400 uppercase">MODO DE MISTURA (E-FUEL)</span>
                            <span className={`text-[10px] font-f1-mono font-bold uppercase ${
                              activeCar.fuelMixMode === 'rich' ? 'text-amber-400' : activeCar.fuelMixMode === 'lean' ? 'text-emerald-400' : 'text-zinc-300'
                            }`}>
                              {activeCar.fuelMixMode === 'rich' ? '+5 PWR · 2x Consumo' : activeCar.fuelMixMode === 'lean' ? '-5 PWR · Econômico' : 'Consumo Nominal'}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5 text-xs font-f1-wide uppercase">
                            <button
                              onClick={() => updateDriverTactics(activeCar.driverId, { fuelMixMode: 'rich' })}
                              className={`py-2 px-1 text-center transition-all cursor-pointer ${
                                activeCar.fuelMixMode === 'rich'
                                  ? 'bg-amber-600 text-white font-black ring-1 ring-amber-400 shadow-lg'
                                  : 'bg-[#1C1C26] text-zinc-400 hover:text-white'
                              }`}
                            >
                              <span className="block text-[11px] font-bold">Modo Rico</span>
                              <span className="block text-[9px] font-f1-mono opacity-80">+5 PWR · 2x Flow</span>
                            </button>
                            <button
                              onClick={() => updateDriverTactics(activeCar.driverId, { fuelMixMode: 'standard' })}
                              className={`py-2 px-1 text-center transition-all cursor-pointer ${
                                activeCar.fuelMixMode === 'standard'
                                  ? 'bg-zinc-700 text-white font-black ring-1 ring-zinc-400 shadow-lg'
                                  : 'bg-[#1C1C26] text-zinc-400 hover:text-white'
                              }`}
                            >
                              <span className="block text-[11px] font-bold">Modo Padrão</span>
                              <span className="block text-[9px] font-f1-mono opacity-80">1.0x Nominal</span>
                            </button>
                            <button
                              onClick={() => updateDriverTactics(activeCar.driverId, { fuelMixMode: 'lean' })}
                              className={`py-2 px-1 text-center transition-all cursor-pointer ${
                                activeCar.fuelMixMode === 'lean'
                                  ? 'bg-emerald-600 text-white font-black ring-1 ring-emerald-400 shadow-lg'
                                  : 'bg-[#1C1C26] text-zinc-400 hover:text-white'
                              }`}
                            >
                              <span className="block text-[11px] font-bold">Modo Pobre</span>
                              <span className="block text-[9px] font-f1-mono opacity-80">-5 PWR · Sem Penalidade</span>
                            </button>
                          </div>
                        </div>

                        {/* 2026 Engine & Active Aero Modes */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                            <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">ERS DEPLOYMENT</span>
                            <div className="grid grid-cols-2 gap-1 text-[11px] font-f1-wide uppercase">
                              {(['harvest', 'balanced', 'deploy', 'overtake'] as EngineMode[]).map(mode => (
                                <button
                                  key={mode}
                                  onClick={() => updateDriverTactics(activeCar.driverId, { engineMode: mode })}
                                  className={`p-1 text-center ${
                                    activeCar.engineMode === mode
                                      ? 'bg-emerald-600 text-white font-bold'
                                      : 'bg-[#1C1C26] text-zinc-400'
                                  }`}
                                >
                                  {mode}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                            <span className="text-[10px] font-f1-mono text-zinc-400 uppercase block">ACTIVE AERO (2026)</span>
                            <div className="grid grid-cols-2 gap-1 text-[11px] font-f1-wide uppercase">
                              <button
                                onClick={() => updateDriverTactics(activeCar.driverId, { aeroMode: 'mode_x' })}
                                className={`p-1.5 text-center ${
                                  activeCar.aeroMode === 'mode_x'
                                    ? 'bg-[#E10600] text-white font-bold'
                                    : 'bg-[#1C1C26] text-zinc-400'
                                }`}
                              >
                                Mode X (Straight)
                              </button>
                              <button
                                onClick={() => updateDriverTactics(activeCar.driverId, { aeroMode: 'mode_z' })}
                                className={`p-1.5 text-center ${
                                  activeCar.aeroMode === 'mode_z'
                                    ? 'bg-[#E10600] text-white font-bold'
                                    : 'bg-[#1C1C26] text-zinc-400'
                                }`}
                              >
                                Mode Z (Corner)
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Pit Stop Strategy Order */}
                        <div className="bg-[#15151E] p-3 border border-white/5 space-y-2">
                          <div className="flex items-center justify-between text-xs font-f1-mono">
                            <span className="text-zinc-400 uppercase">PIT STRATEGY CALL</span>
                            <span className="text-zinc-400">Current: {activeCar.tireCompound.toUpperCase()} ({activeCar.tireWearPercent}% wear)</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {(['soft', 'medium', 'hard', 'inter', 'wet'] as TireCompound[]).map(comp => (
                              <button
                                key={comp}
                                onClick={() => setSelectedPitCompound(comp)}
                                className={`flex-1 py-1 text-xs font-f1-mono uppercase font-bold border ${
                                  selectedPitCompound === comp ? 'border-[#E10600] bg-white/10 text-white' : 'border-white/5 text-zinc-500'
                                }`}
                              >
                                {comp[0].toUpperCase()}
                              </button>
                            ))}

                            <button
                              onClick={() => orderPitStop(activeCar.driverId, selectedPitCompound)}
                              className="px-4 py-1.5 bg-[#E10600] hover:bg-[#c20500] text-white font-f1-wide font-bold text-xs uppercase tracking-wider f1-tab-chamfer transition-colors whitespace-nowrap"
                            >
                              Box Box Now
                            </button>
                          </div>
                        </div>
                      </div>
                      )}
                    </div>
                  </F1TabBucket>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PHASE 4: POST-RACE CLASSIFICATION & PODIUM */}
      {weekendSession === 'post_race' && (
        <F1TabBucket title="OFFICIAL FIA RACE CLASSIFICATION & CEREMONY" badge="CHEQUERED FLAG">
          <div className="space-y-6">
            <div className="bg-[#15151E] p-6 border border-white/10 text-center space-y-2 f1-pattern-micro-grid">
              <span className="text-xs font-f1-mono text-[#E10600] font-bold tracking-widest uppercase">
                {currentCircuit.name.toUpperCase()} COMPLETED
              </span>
              <h2 className="font-f1-wide font-black text-2xl text-white uppercase">
                WINNER: {liveCars[0]?.driverName} ({liveCars[0]?.shortCode})
              </h2>
            </div>

            <div className="divide-y divide-white/5 bg-[#15151E] border border-white/5 max-h-80 overflow-y-auto">
              {liveCars.map((car, idx) => {
                const isOut = car.status === 'retired' || Boolean(car.isDisqualified);
                return (
                  <div
                    key={car.driverId}
                    className={`flex items-center justify-between py-2 px-3 text-xs font-f1-mono ${
                      isOut
                        ? 'opacity-65 bg-black/30 text-zinc-500'
                        : car.isPlayer
                        ? 'bg-[#E10600]/15 text-white'
                        : 'text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 text-right font-bold text-zinc-400">{idx + 1}</span>
                      <span className="w-1.5 h-3" style={{ backgroundColor: car.teamColor }} />
                      <span className="font-f1-wide uppercase text-white font-bold">{car.driverName}</span>
                      <span className="text-zinc-500">{car.shortCode}</span>
                      {(car.penaltySec ?? 0) > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/40">
                          +{car.penaltySec}s PEN
                        </span>
                      )}
                      {car.startedFromPitLane && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-white/10 text-zinc-300">PIT START</span>
                      )}
                    </div>
                    <span className="text-white font-bold tabular-nums">
                      {car.isDisqualified
                        ? 'DSQ (0 PTS)'
                        : car.status === 'retired'
                        ? `DNF (${car.retireReason || 'Abandono'})`
                        : idx < 10
                        ? `+${[25, 18, 15, 12, 10, 8, 6, 4, 2, 1][idx]} PTS`
                        : '0 PTS'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={finishRaceWeekend}
                className="px-6 py-2.5 bg-[#E10600] hover:bg-[#c20500] text-white font-f1-wide font-bold text-xs uppercase tracking-wider f1-tab-chamfer transition-colors"
              >
                Conclude Debrief & Collect Prize Funds
              </button>
            </div>
          </div>
        </F1TabBucket>
      )}
    </div>
  );
};
