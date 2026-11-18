import React, { useState, useRef, useEffect } from 'react';
import { useGame, GameTab } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { F1Logo } from '../brand/F1Logo';
import {
  Play,
  Calendar,
  Save,
  Home,
  Globe,
  Volume2,
  VolumeX,
  Check,
  Clock,
  CloudUpload,
  LogIn,
  LogOut,
  Settings,
  Database,
} from 'lucide-react';
import { SettingsGear } from '../header/SettingsGear';

export const TopBar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentWeek,
    seasonYear,
    currentCircuit,
    semanasParaTeste,
    playerTeam,
    puClients,
    advanceWeek,
    setShowStartScreen,
    saveGame,
    language,
    setLanguage,
    t,
    soundEnabled,
    setSoundEnabled,
    playRadioSound,
    exportCareerStatePayload,
    openGrandsPrixMode,
    cloudSaving,
    cloudSaveStatus,
    authError,
    user,
    signInWithGoogle,
    signOutUser,
    handleCloudSave,
    saveSuccess,
    setSaveSuccess,
  } = useGame();

  const { signInWithGoogle: authGoogle, signOutUser: authSignOut } = useAuth();

  // Dropdown state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleManualSave = () => {
    saveGame();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Build navigation tabs (including optional PU Clients)
  const navTabs = [
    { id: 'overview', label: t.command },
    { id: 'engineering', label: t.engineering },
    { id: 'facilities', label: t.facilities },
    { id: 'team', label: t.personnel },
    { id: 'financials', label: t.costCap },
    { id: 'race_weekend', label: t.grandPrix },
    ...(playerTeam?.isManufacturer ||
    playerTeam?.engineOrigin === 'bought_factory' ||
    playerTeam?.engineOrigin === 'phoenix'
      ? [
          {
            id: 'pu_clients',
            label: 'Clientes de PU',
            badge:
              puClients?.filter((c) => c.status === 'active').length > 0
                ? `${puClients?.filter((c) => c.status === 'active').length}/2`
                : undefined,
          },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#15151E] border-b border-[#2C2C3A] text-white select-none">
      {/* Top line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-[#E10600] via-[#E10600] to-transparent" />

      <div className="max-w-[1440px] mx-auto px-3 lg:px-5 min-h-16 py-2 flex flex-wrap xl:flex-nowrap items-center justify-between gap-2.5">
        {/* Left – Home + Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              setShowStartScreen(true);
              playRadioSound();
            }}
            className="p-1.5 bg-[#1C1C26] hover:bg-[#252533] border border-white/10 text-zinc-400 hover:text-white transition-colors"
            title={t.mainMenu}
          >
            <Home className="w-4 h-4" />
          </button>

          <F1Logo className="h-5 lg:h-6" variant="red" />

          <div className="hidden 2xl:flex flex-col border-l border-white/10 pl-2.5">
            <span className="font-f1-wide font-black text-xs tracking-wider text-white">APEX 2026</span>
            <span className="font-f1-mono text-[10px] text-zinc-400">HYBRID REGULATIONS</span>
          </div>
        </div>

        {/* Center – Navigation tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1 justify-center">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as GameTab);
                  playRadioSound();
                }}
                className={`px-2 xl:px-2.5 py-2 text-[11px] xl:text-xs font-f1-wide uppercase tracking-wider transition-colors whitespace-nowrap border-b-2 ${
                  isActive
                    ? 'text-white font-bold border-[#E10600]'
                    : 'text-zinc-400 border-transparent hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="ml-1 text-[9px] font-f1-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 py-0.5 font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right – Quick actions + Settings dropdown */}
        <div className="flex items-center gap-1.5 xl:gap-2 shrink-0 ml-auto">
          {/* Save button */}
          <button
            onClick={handleManualSave}
            className="p-2 bg-[#1C1C26] hover:bg-[#252533] border border-white/10 text-xs font-f1-mono text-zinc-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            title={language === 'pt' ? 'Salvar jogo localmente' : 'Save current game locally'}
          >
            {saveSuccess ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Save className="w-3.5 h-3.5 text-[#E10600]" />
            )}
            <span className="hidden 2xl:inline text-[11px] uppercase">
              {saveSuccess ? (language === 'pt' ? 'Salvo!' : 'Saved!') : language === 'pt' ? 'Salvar' : 'Save'}
            </span>
          </button>

          {/* Settings gear dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setSettingsOpen((v) => !v)}
              title="Configurações"
              className={`p-2 rounded border transition-colors ${
                settingsOpen
                  ? 'bg-zinc-800 border-red-500 text-white'
                  : 'bg-zinc-900 border-zinc-700 hover:border-zinc-500 text-zinc-300'
              }`}
            >
              <Settings className={`w-5 h-5 transition-transform ${settingsOpen ? 'rotate-45' : ''}`} />
            </button>

            {settingsOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[#14161c] border border-zinc-700 rounded shadow-2xl py-2 text-xs z-50" ref={menuRef}>
                <div className="px-3 py-1.5 text-[10px] font-bold tracking-widest text-zinc-500 uppercase border-b border-zinc-800">
                  Configurações & Nuvem
                </div>

                {/* Áudio */}
                <button
                  onClick={() => {
                    setSoundEnabled(!soundEnabled);
                    if (!soundEnabled) playRadioSound();
                  }}
                  className="w-full px-3 py-2 flex items-center justify-between hover:bg-zinc-800/80 text-zinc-200"
                >
                  <span className="flex items-center gap-2">
                    {soundEnabled ? (
                      <Volume2 size={15} className="text-emerald-400" />
                    ) : (
                      <VolumeX size={15} className="text-red-500" />
                    )}
                    Áudio do Jogo
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">{soundEnabled ? 'ATIVO' : 'MUTADO'}</span>
                </button>

                {/* Idioma */}
                <button
                  onClick={() => {
                    setLanguage(language === 'pt' ? 'en' : 'pt');
                    playRadioSound();
                  }}
                  className="w-full px-3 py-2 flex items-center justify-between hover:bg-zinc-800/80 text-zinc-200"
                >
                  <span className="flex items-center gap-2">
                    <Globe size={15} className="text-sky-400" />
                    Idioma / Language
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-bold text-[10px]">
                    {language === 'pt' ? 'PT-BR' : 'EN-US'}
                  </span>
                </button>

                <div className="my-1 border-t border-zinc-800" />

                {/* Firebase login */}
                <button
                  onClick={() => {
                    setSettingsOpen(false);
                    signInWithGoogle();
                  }}
                  className="w-full px-3 py-2 flex items-center gap-2 hover:bg-zinc-800/80 text-zinc-200"
                >
                  <LogIn size={15} className="text-amber-400" />
                  Conectar / Login Firebase
                </button>

                {/* Cloud SQL */}
                <button
                  onClick={() => {
                    setSettingsOpen(false);
                    handleCloudSave();
                  }}
                  className="w-full px-3 py-2 flex items-center gap-2 hover:bg-zinc-800/80 text-zinc-200"
                >
                  <Database size={15} className="text-cyan-400" />
                  Configurar Cloud SQL
                </button>

                {/* Cloud SQL Save – mantém visual antigo */}
                <button
                  onClick={handleCloudSave}
                  disabled={cloudSaving}
                  className="w-full px-3 py-2 flex items-center gap-2 text-zinc-300 hover:text-white disabled:opacity-50"
                  title={authError || (user ? `Cloud SQL (${user.email || 'Google'})` : 'Conectar Google e salvar no Cloud SQL')}
                >
                  <CloudUpload
                    className={`w-3.5 h-3.5 ${
                      cloudSaveStatus === 'saved'
                        ? 'text-emerald-400'
                        : cloudSaveStatus === 'error'
                        ? 'text-red-400'
                        : 'text-cyan-400'
                    }`}
                  />
                  <span className="hidden 2xl:inline">
                    {cloudSaving
                      ? '...'
                      : cloudSaveStatus === 'saved'
                      ? 'Nuvem OK'
                      : cloudSaveStatus === 'error'
                      ? 'Erro'
                      : 'Cloud SQL'}
                  </span>
                </button>

                {/* Logout if logged */}
                {user && (
                  <button
                    onClick={async () => {
                      await signOutUser();
                      playRadioSound();
                    }}
                    className="w-full px-3 py-2 flex items-center gap-2 hover:bg-zinc-800/80 text-zinc-200"
                  >
                    <LogOut size={15} className="text-emerald-400" />
                    Sair ({user.email?.split('@')[0] || 'Google'})
                  </button>
                )}
              </div>
            )}
          </div>

          {/* GP badge */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono">
            <Calendar size={13} className="text-zinc-500" />
            <span>S1 · Melbourne</span>
          </div>

          {/* Avançar semana */}
          <button
            onClick={() => {
              advanceWeek();
              playRadioSound();
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#E10600] hover:bg-[#c20500] text-white text-xs font-black uppercase tracking-wider"
          >
            <Play size={12} fill="currentColor" />
            <span>{t.advanceWeek}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
