import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useAuth, type CloudSnapshotRecord } from '../../context/AuthContext';
import { F1Logo } from '../brand/F1Logo';
import {
  Play,
  RotateCcw,
  FolderOpen,
  Settings,
  Volume2,
  VolumeX,
  Globe,
  Trash2,
  X,
  ChevronRight,
  CloudDownload,
  LogIn,
  LogOut,
  Compass
} from 'lucide-react';

import { PRINCIPAL_BACKGROUNDS, PrincipalBackgroundId } from '../../data/principalBackgroundsData';
import { GrandsPrixExplorer } from '../circuits/GrandsPrixExplorer';

export const StartScreen: React.FC = () => {
  const {
    setShowStartScreen,
    setShowOnboarding,
    language,
    setLanguage,
    t,
    soundEnabled,
    setSoundEnabled,
    realisticCorrelation,
    setRealisticCorrelation,
    playRadioSound,
    hasRecentSave,
    loadRecentSave,
    saveSlots,
    loadGame,
    deleteSaveSlot,
    startNewGame,
    resetGameState,
    allTeams,
    importCareerStatePayload
  } = useGame();

  const { user, signInWithGoogle, signOutUser, getIdToken, authError } = useAuth();

  // Modals
  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showCircuitsModal, setShowCircuitsModal] = useState(false);

  const [cloudSnapshots, setCloudSnapshots] = useState<CloudSnapshotRecord[]>([]);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);

  useEffect(() => {
    if (!showLoadModal || !user) {
      setCloudSnapshots([]);
      return;
    }
    let active = true;
    (async () => {
      setCloudLoading(true);
      setCloudError(null);
      try {
        const token = await getIdToken();
        if (!token) return;
        const resp = await fetch('/api/career/snapshots', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) throw new Error('Falha ao consultar Cloud SQL.');
        const json = (await resp.json()) as { snapshots: CloudSnapshotRecord[] };
        if (active) setCloudSnapshots(json.snapshots || []);
      } catch (err) {
        if (active) setCloudError((err as Error).message);
      } finally {
        if (active) setCloudLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [showLoadModal, user, getIdToken]);

  // New Game Wizard state
  const [newPrincipalName, setNewPrincipalName] = useState('Guilherme');
  const [newBackground, setNewBackground] = useState<PrincipalBackgroundId>('chief_engineer');
  const [newSelectedTeam, setNewSelectedTeam] = useState('apex');
  const selectedBgOption = PRINCIPAL_BACKGROUNDS.find(b => b.id === newBackground) || PRINCIPAL_BACKGROUNDS[0];

  const handleStartNewGame = () => {
    startNewGame({
      principalName: newPrincipalName,
      background: newBackground,
      selectedTeamId: newSelectedTeam
    });
    setShowNewGameModal(false);
  };

  return (
    <div className="min-h-screen bg-[#15151E] text-[#F7F4F1] flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background Ambience: F1 Micro Grid & Red Atmospheric Glow */}
      <div className="absolute inset-0 f1-pattern-micro-grid pointer-events-none opacity-80" />
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-[#E10600]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-black/60 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Brand Bar */}
      <header className="relative z-10 border-b border-[#2C2C3A] bg-[#15151E]/90 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <F1Logo className="h-7" variant="red" />
            <div className="flex flex-col border-l border-white/10 pl-3">
              <span className="font-f1-wide font-black text-sm tracking-wider text-white">APEX 2026</span>
              <span className="font-f1-mono text-[10px] text-zinc-400">HYBRID REGULATIONS ENGINE</span>
            </div>
          </div>

          {/* Auth & Language Toggle */}
          <div className="flex items-center gap-2">
            {user ? (
              <button
                onClick={signOutUser}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C1C26] hover:bg-[#252533] border border-emerald-500/40 text-xs font-f1-mono text-emerald-300 transition-colors cursor-pointer"
                title={`Sessão Google ativa: ${user.email || user.displayName || ''}`}
              >
                <LogOut className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline truncate max-w-[160px]">{user.displayName || user.email || 'Conectado'}</span>
              </button>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C1C26] hover:bg-[#252533] border border-white/10 text-xs font-f1-mono text-zinc-200 transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-cyan-400" />
                <span>{language === 'pt' ? 'Entrar (Google)' : 'Google Sign-In'}</span>
              </button>
            )}

            <button
              onClick={() => {
                setLanguage(language === 'pt' ? 'en' : 'pt');
                playRadioSound();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C1C26] hover:bg-[#252533] border border-white/10 text-xs font-f1-mono text-zinc-300 transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#E10600]" />
              <span className="font-bold">{language === 'pt' ? 'PT-BR' : 'EN-US'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero & Menu */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Hero Title & Regulation Badges (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1C1C26] border border-[#E10600]/30 text-xs font-f1-mono text-[#E10600] tracking-widest font-bold uppercase">
              <span className="w-2 h-2 bg-[#E10600]" />
              <span>OFFICIAL 2026 HYBRID SPECIFICATIONS</span>
            </div>

            <div>
              <h1 className="font-f1-wide font-black text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-none uppercase">
                FORMULA 1®
              </h1>
              <div className="font-f1-wide font-black text-2xl sm:text-3xl text-zinc-300 tracking-wider uppercase mt-2">
                ENGINEERING & MANAGEMENT SIMULATOR
              </div>
            </div>

            <p className="text-base text-zinc-300 max-w-xl font-light leading-relaxed">
              {language === 'pt'
                ? 'Assuma o comando da sua escuderia no divisor de águas de 2026. Projete cada elo do carro na dependência física CAD, construa motores 50% térmicos e 50% elétricos de 350kW, domine as asas ativas Modo X e Modo Z, e comande a telemetria do pit wall dentro do Teto de Gastos de $135M.'
                : 'Take the helm of your racing team in the definitive 2026 regulation reset. Engineer each mechanical component in sequential CAD dependency, develop 50% thermal / 50% electric 350kW powertrains, master Mode X/Z active aero, and direct pit wall live telemetry within the $135M Cost Cap.'}
            </p>

            {/* Technical Regulation Pillars */}
            <div className="grid grid-cols-3 gap-3 pt-4 max-w-lg">
              <div className="bg-[#1C1C26] p-3 border border-white/5">
                <span className="text-[10px] font-f1-mono text-[#E10600] font-bold block uppercase">PU 2026</span>
                <span className="text-xs font-f1-wide font-bold text-white block mt-0.5">50% ICE / 50% ERS</span>
                <span className="text-[10px] font-f1-mono text-zinc-400">350kW · Zero MGU-H</span>
              </div>

              <div className="bg-[#1C1C26] p-3 border border-white/5">
                <span className="text-[10px] font-f1-mono text-[#E10600] font-bold block uppercase">ACTIVE AERO</span>
                <span className="text-xs font-f1-wide font-bold text-white block mt-0.5">MODE X / MODE Z</span>
                <span className="text-[10px] font-f1-mono text-zinc-400">Low Drag / High DF</span>
              </div>

              <div className="bg-[#1C1C26] p-3 border border-white/5">
                <span className="text-[10px] font-f1-mono text-[#E10600] font-bold block uppercase">FINANCIAL</span>
                <span className="text-xs font-f1-wide font-bold text-white block mt-0.5">$135M COST CAP</span>
                <span className="text-[10px] font-f1-mono text-zinc-400">Strict FIA Audit</span>
              </div>
            </div>
          </div>

          {/* Right Action Menu Stack (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            {/* Continue Recent Game */}
            <button
              disabled={!hasRecentSave}
              onClick={() => {
                if (hasRecentSave) {
                  loadRecentSave();
                }
              }}
              className={`w-full p-4 font-f1-wide font-black text-sm uppercase tracking-wider f1-tab-chamfer transition-all flex items-center justify-between group shadow-lg ${
                hasRecentSave
                  ? 'bg-[#E10600] hover:bg-[#c20500] text-white cursor-pointer'
                  : 'bg-[#1C1C26] border border-white/10 text-zinc-500 cursor-not-allowed opacity-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Play className={`w-5 h-5 ${hasRecentSave ? 'fill-current text-white' : 'text-zinc-600'}`} />
                <div className="text-left">
                  <div>{t.continueGame}</div>
                  <div className="text-[10px] font-f1-mono font-normal lowercase">
                    {hasRecentSave
                      ? (language === 'pt' ? 'retomar do último salvamento' : 'resume latest checkpoint')
                      : (language === 'pt' ? 'nenhuma carreira salva disponível' : 'no saved career available')}
                  </div>
                </div>
              </div>
              {hasRecentSave && (
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              )}
            </button>

            {/* New Game Button - 7-Stage Official Onboarding Journey with Total Reset */}
            <button
              onClick={() => {
                resetGameState();
              }}
              className="w-full p-4 bg-[#1C1C26] hover:bg-[#232330] border border-[#E10600]/40 hover:border-[#E10600] text-white font-f1-wide font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <RotateCcw className="w-5 h-5 text-[#E10600]" />
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span>{t.newGame}</span>
                    <span className="text-[9px] font-f1-mono bg-[#E10600] text-white px-1.5 py-0.2 font-bold">
                      7 FASES
                    </span>
                  </div>
                  <div className="text-[10px] font-f1-mono text-zinc-400">
                    {language === 'pt' ? 'roteiro FIA: legado, dia 00, motor, equipe e bahrein' : 'official FIA route: legacy, day 00, PU, team & testing'}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Quick Start Option */}
            <div className="text-right">
              <button
                onClick={() => {
                  setShowNewGameModal(true);
                  playRadioSound();
                }}
                className="text-[11px] font-f1-mono text-zinc-400 hover:text-white underline underline-offset-2 transition-colors inline-flex items-center gap-1"
              >
                <span>{language === 'pt' ? '⚡ Pular para Início Rápido (Arcade)' : '⚡ Skip to Quick Start (Arcade)'}</span>
              </button>
            </div>

            {/* Load Saved Game Button */}
            <button
              onClick={() => {
                setShowLoadModal(true);
                playRadioSound();
              }}
              className="w-full p-4 bg-[#1C1C26] hover:bg-[#232330] border border-white/10 hover:border-white/20 text-white font-f1-wide font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <FolderOpen className="w-5 h-5 text-zinc-400" />
                <div className="text-left">
                  <div>{t.loadGame}</div>
                  <div className="text-[10px] font-f1-mono text-zinc-400">
                    {saveSlots.length} {language === 'pt' ? 'slots disponíveis' : 'slots available'}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Grands Prix & All Circuits Telemetry Catalog Button */}
            <button
              onClick={() => {
                setShowCircuitsModal(true);
                playRadioSound();
              }}
              className="w-full p-4 bg-[#1C1C26] hover:bg-[#232330] border border-cyan-500/30 hover:border-cyan-400 text-white font-f1-wide font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Compass className="w-5 h-5 text-cyan-400" />
                <div className="text-left">
                  <div>{language === 'pt' ? 'Grandes Prêmios & Circuitos 2026' : '2026 Grands Prix & Circuits'}</div>
                  <div className="text-[10px] font-f1-mono text-zinc-400">
                    {language === 'pt'
                      ? '24 etapas + 7 pistas históricas, traçados GeoJSON & física SI'
                      : '24 rounds + 7 historical tracks, GeoJSON centerlines & SI physics'}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Settings Button */}
            <button
              onClick={() => {
                setShowSettingsModal(true);
                playRadioSound();
              }}
              className="w-full p-4 bg-[#1C1C26] hover:bg-[#232330] border border-white/10 hover:border-white/20 text-white font-f1-wide font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-zinc-400" />
                <div className="text-left">
                  <div>{t.settings}</div>
                  <div className="text-[10px] font-f1-mono text-zinc-400">
                    {language === 'pt' ? 'idioma, áudio, correlação ATR' : 'language, audio, ATR correlation'}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </main>

      {/* MODAL: GRANDS PRIX & ALL CIRCUITS EXPLORER */}
      {showCircuitsModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <GrandsPrixExplorer onClose={() => setShowCircuitsModal(false)} />
          </div>
        </div>
      )}

      {/* Bottom Brand Identity Tagline */}
      <footer className="relative z-10 border-t border-[#2C2C3A] bg-[#101017] py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-f1-mono text-zinc-500">
          <div>
            COMMANDING · CHARISMATIC · AUDACIOUS · INTENSE
          </div>
          <div className="flex items-center gap-4 text-zinc-400">
            <span>FIA 2026 TECHNICAL SPECIFICATION</span>
            <span>·</span>
            <span>HYBRID ERA v6.0.0</span>
          </div>
        </div>
      </footer>

      {/* MODAL: NEW GAME WIZARD */}
      {showNewGameModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1C1C26] border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto f1-container-frame">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h2 className="font-f1-wide font-black text-xl text-white uppercase">{t.newGameTitle}</h2>
                  <p className="text-xs text-zinc-400 mt-1">{t.newGameDesc}</p>
                </div>
                <button
                  onClick={() => setShowNewGameModal(false)}
                  className="p-1 text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Principal Name Input */}
              <div className="space-y-2">
                <label className="text-xs font-f1-wide font-bold text-white uppercase block">
                  {t.principalName}
                </label>
                <input
                  type="text"
                  value={newPrincipalName}
                  onChange={e => setNewPrincipalName(e.target.value)}
                  className="w-full bg-[#15151E] border border-white/10 px-3 py-2 text-sm text-white font-f1-mono focus:border-[#E10600] focus:outline-none"
                  placeholder="Nome do Chefe de Equipe"
                />
              </div>

              {/* Background DNA Perks (6 Comprehensive Profiles) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-f1-wide font-bold text-white uppercase block">
                    {t.principalBackground} (DNA Inicial)
                  </label>
                  <span className="text-[10px] font-f1-mono text-zinc-400">
                    6 Perfis de Carreira
                  </span>
                </div>

                <select
                  value={newBackground}
                  onChange={e => setNewBackground(e.target.value as PrincipalBackgroundId)}
                  className="w-full bg-[#15151E] border border-white/15 px-3 py-2 text-xs text-white font-f1-mono focus:border-[#E10600] focus:outline-none cursor-pointer"
                >
                  {PRINCIPAL_BACKGROUNDS.map((bg, idx) => (
                    <option key={bg.id} value={bg.id}>
                      {idx + 1}. {bg.name} ({bg.bonus} | {bg.onus})
                    </option>
                  ))}
                </select>

                {/* Visual Tags Card (Bonus in Green, Onus in Red) */}
                <div className="bg-[#15151E] border border-white/10 p-3 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                    <span className="font-f1-wide font-bold text-xs text-white uppercase">
                      {selectedBgOption.name}
                    </span>
                    <span className="text-[9px] font-f1-mono text-zinc-300 bg-white/5 border border-white/10 px-1.5 py-0.5 uppercase tracking-wider font-bold">
                      {selectedBgOption.badge}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-f1-mono">
                    {/* Bônus Tag */}
                    <div className="bg-emerald-950/50 border border-emerald-500/50 p-2 space-y-0.5">
                      <span className="text-[9px] font-bold text-emerald-400 uppercase block tracking-wider">
                        ● BÔNUS DO PERFIL
                      </span>
                      <p className="text-[11px] font-bold text-emerald-300 leading-snug">
                        {selectedBgOption.bonus}
                      </p>
                    </div>

                    {/* Ônus Tag */}
                    <div className="bg-red-950/50 border border-red-500/50 p-2 space-y-0.5">
                      <span className="text-[9px] font-bold text-red-400 uppercase block tracking-wider">
                        ● ÔNUS DO PERFIL
                      </span>
                      <p className="text-[11px] font-bold text-red-300 leading-snug">
                        {selectedBgOption.onus}
                      </p>
                    </div>
                  </div>

                  <p className="text-[10px] text-zinc-400 font-light leading-relaxed border-t border-white/5 pt-1.5">
                    {selectedBgOption.description}
                  </p>
                </div>
              </div>

              {/* Select Starting Team */}
              <div className="space-y-2">
                <label className="text-xs font-f1-wide font-bold text-white uppercase block">
                  {t.selectTeam}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1 bg-[#15151E] border border-white/5">
                  {allTeams.map(team => (
                    <button
                      key={team.id}
                      onClick={() => setNewSelectedTeam(team.id)}
                      className={`p-2.5 text-center border text-xs transition-all ${
                        newSelectedTeam === team.id
                          ? 'border-[#E10600] bg-white/10 text-white font-bold'
                          : 'border-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="w-4 h-1.5 mx-auto mb-1" style={{ backgroundColor: team.color }} />
                      <div className="font-f1-wide uppercase text-[11px] truncate">{team.shortName}</div>
                      <div className="text-[9px] font-f1-mono text-zinc-400">Idx: {team.carRating}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => setShowNewGameModal(false)}
                  className="px-4 py-2 text-xs font-f1-wide uppercase text-zinc-400 hover:text-white"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleStartNewGame}
                  className="px-6 py-2.5 bg-[#E10600] hover:bg-[#c20500] text-white font-f1-wide font-bold text-xs uppercase tracking-wider f1-tab-chamfer transition-colors"
                >
                  {t.startGameBtn}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LOAD SAVED GAME */}
      {showLoadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1C1C26] border border-white/10 w-full max-w-xl max-h-[85vh] overflow-y-auto f1-container-frame">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="font-f1-wide font-black text-xl text-white uppercase">{t.loadGame}</h2>
                <button
                  onClick={() => setShowLoadModal(false)}
                  className="p-1 text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cloud SQL Section */}
              <div className="bg-[#15151E] border border-cyan-500/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CloudDownload className="w-4 h-4 text-cyan-400" />
                    <span className="font-f1-wide font-bold text-xs text-white uppercase">
                      Cloud SQL PostgreSQL (us-west1)
                    </span>
                  </div>
                  {!user && (
                    <button
                      onClick={signInWithGoogle}
                      className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-f1-mono text-[11px] font-bold uppercase cursor-pointer"
                    >
                      Conectar Google
                    </button>
                  )}
                </div>

                {authError && <p className="text-[11px] font-f1-mono text-red-400">{authError}</p>}
                {cloudError && <p className="text-[11px] font-f1-mono text-red-400">{cloudError}</p>}

                {user && cloudLoading && (
                  <p className="text-xs font-f1-mono text-zinc-400">Consultando snapshots no PostgreSQL...</p>
                )}

                {user && !cloudLoading && cloudSnapshots.length === 0 && (
                  <p className="text-xs font-f1-mono text-zinc-400">
                    Nenhum snapshot salvo na nuvem para {user.email}. Use &quot;Cloud SQL&quot; na barra superior durante a carreira para salvar.
                  </p>
                )}

                {user && cloudSnapshots.length > 0 && (
                  <div className="space-y-2">
                    {cloudSnapshots.map((snap) => (
                      <div
                        key={snap.id}
                        className="p-3 bg-[#1C1C26] border border-white/10 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="font-f1-wide font-bold text-xs text-white uppercase">{snap.teamName}</div>
                          <div className="text-[11px] font-f1-mono text-zinc-400">
                            Temporada {snap.seasonYear} · Semana {snap.week} · Slot {snap.slotId}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (importCareerStatePayload(snap.statePayload)) {
                              setShowLoadModal(false);
                            }
                          }}
                          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-f1-wide font-bold text-[11px] uppercase cursor-pointer"
                        >
                          Carregar Nuvem
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 pt-3">
                <div className="text-[11px] font-f1-mono text-zinc-400 uppercase mb-2">
                  Slots Locais (Navegador)
                </div>
                {saveSlots.length === 0 ? (
                  <div className="py-8 text-center text-xs font-f1-mono text-zinc-400 space-y-2">
                    <FolderOpen className="w-8 h-8 text-zinc-600 mx-auto" />
                    <p>{t.noSavesYet}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {saveSlots.map(slot => (
                      <div
                        key={slot.id}
                        className="p-4 bg-[#15151E] border border-white/5 flex items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2" style={{ backgroundColor: slot.teamColor }} />
                            <span className="font-f1-wide font-bold text-sm text-white uppercase">
                              {slot.name}
                            </span>
                          </div>
                          <div className="text-[11px] font-f1-mono text-zinc-400">
                            {slot.timestamp} · {slot.teamName} · ${(slot.bankBalance / 1000000).toFixed(1)}M
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              loadGame(slot.id);
                              setShowLoadModal(false);
                            }}
                            className="px-4 py-1.5 bg-[#E10600] hover:bg-[#c20500] text-white font-f1-wide font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            Carregar
                          </button>
                          <button
                            onClick={() => deleteSaveSlot(slot.id)}
                            className="p-2 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                            title={t.deleteSlot}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2 border-t border-white/10">
                <button
                  onClick={() => setShowLoadModal(false)}
                  className="px-4 py-2 text-xs font-f1-wide uppercase text-zinc-400 hover:text-white cursor-pointer"
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SETTINGS */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1C1C26] border border-white/10 w-full max-w-lg f1-container-frame">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="font-f1-wide font-black text-xl text-white uppercase">{t.gameSettings}</h2>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="p-1 text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Language Selection */}
              <div className="space-y-2">
                <label className="text-xs font-f1-wide font-bold text-white uppercase block">
                  {t.languageSelect}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setLanguage('pt');
                      playRadioSound();
                    }}
                    className={`p-3 text-center border text-xs font-f1-wide uppercase tracking-wider transition-all ${
                      language === 'pt'
                        ? 'bg-[#E10600] text-white font-bold border-[#E10600]'
                        : 'bg-[#15151E] border-white/10 text-zinc-400'
                    }`}
                  >
                    Português (Brasil) 🇧🇷
                  </button>

                  <button
                    onClick={() => {
                      setLanguage('en');
                      playRadioSound();
                    }}
                    className={`p-3 text-center border text-xs font-f1-wide uppercase tracking-wider transition-all ${
                      language === 'en'
                        ? 'bg-[#E10600] text-white font-bold border-[#E10600]'
                        : 'bg-[#15151E] border-white/10 text-zinc-400'
                    }`}
                  >
                    English (US) 🇺🇸
                  </button>
                </div>
              </div>

              {/* Sound Toggle */}
              <div className="bg-[#15151E] p-4 border border-white/5 flex items-center justify-between">
                <div>
                  <div className="font-f1-wide font-bold text-xs text-white uppercase">
                    {t.soundEffects}
                  </div>
                  <div className="text-[11px] font-f1-mono text-zinc-400 mt-0.5">
                    {t.soundDesc}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSoundEnabled(!soundEnabled);
                    if (!soundEnabled) playRadioSound();
                  }}
                  className={`p-2 border ${
                    soundEnabled ? 'border-emerald-500 bg-emerald-950/30 text-emerald-400' : 'border-white/10 text-zinc-500'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
              </div>

              {/* Correlation Realism Toggle */}
              <div className="bg-[#15151E] p-4 border border-white/5 flex items-center justify-between">
                <div>
                  <div className="font-f1-wide font-bold text-xs text-white uppercase">
                    {t.correlationRealism}
                  </div>
                  <div className="text-[11px] font-f1-mono text-zinc-400 mt-0.5">
                    {t.correlationRealismDesc}
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={realisticCorrelation}
                  onChange={e => setRealisticCorrelation(e.target.checked)}
                  className="w-4 h-4 accent-[#E10600]"
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-white/10">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-6 py-2 bg-[#E10600] hover:bg-[#c20500] text-white font-f1-wide font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  {t.saveSettings}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
