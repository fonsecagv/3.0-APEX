import React, { useState } from 'react';
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
  LogOut
} from 'lucide-react';

export const TopBar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentWeek,
    seasonYear,
    currentCircuit,
    financials,
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
    openGrandsPrixMode
  } = useGame();

  const { user, signInWithGoogle, signOutUser, authError } = useAuth();

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [cloudSaving, setCloudSaving] = useState(false);
  const [cloudSaveStatus, setCloudSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  const isWorksTeam =
    playerTeam?.isManufacturer ||
    playerTeam?.engineOrigin === 'bought_factory' ||
    playerTeam?.engineOrigin === 'phoenix';

  const activeClientsCount = puClients?.filter(c => c.status === 'active').length || 0;

  const navItems: { id: GameTab; label: string; badge?: string }[] = [
    { id: 'overview', label: t.command },
    { id: 'engineering', label: t.engineering },
    { id: 'facilities', label: t.facilities },
    { id: 'team', label: t.personnel },
    { id: 'financials', label: t.costCap },
    { id: 'race_weekend', label: t.grandPrix },
    ...(isWorksTeam
      ? [
          {
            id: 'pu_clients' as GameTab,
            label: 'Clientes de PU',
            badge: activeClientsCount > 0 ? `${activeClientsCount}/2` : undefined
          }
        ]
      : [])
  ];

  const handleManualSave = () => {
    saveGame();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleCloudSave = async () => {
    setCloudSaving(true);
    setCloudSaveStatus('idle');
    try {
      let activeUser = user;
      if (!activeUser) {
        activeUser = await signInWithGoogle();
      }
      if (!activeUser) {
        setCloudSaveStatus('error');
        return;
      }
      const token = await activeUser.getIdToken();
      await fetch('/api/db/seed', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = exportCareerStatePayload();
      const resp = await fetch('/api/career/snapshots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error('Snapshot save failed');
      setCloudSaveStatus('saved');
      playRadioSound();
      setTimeout(() => setCloudSaveStatus('idle'), 2500);
    } catch {
      setCloudSaveStatus('error');
    } finally {
      setCloudSaving(false);
    }
  };

  const costCapRemaining = financials.costCapLimit - financials.costCapSpent;
  const isCostCapWarning = costCapRemaining < 10000000;

  return (
    <header className="sticky top-0 z-50 bg-[#15151E] border-b border-[#2C2C3A] text-white select-none">
      {/* Red F1 Signature Baseline Line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-[#E10600] via-[#E10600] to-transparent" />

      <div className="max-w-7xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark & Main Menu Return */}
        <div className="flex items-center gap-3 shrink-0">
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

          <F1Logo className="h-6" variant="red" />
          
          <div className="hidden sm:flex flex-col border-l border-white/10 pl-3">
            <span className="font-f1-wide font-black text-xs tracking-wider text-white">APEX 2026</span>
            <span className="font-f1-mono text-[10px] text-zinc-400">HYBRID REGULATIONS</span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  playRadioSound();
                }}
                className={`px-3 py-1.5 text-xs font-f1-wide uppercase tracking-wider transition-colors relative whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'text-white font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-1.5 text-[9px] font-f1-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-bold">
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-[-14px] left-0 right-0 h-[3px] bg-[#E10600]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Financials, Quick Save, Language & Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Cost Cap Quick Stat */}
          <div className="hidden lg:flex items-center gap-3 text-right">
            <div>
              <div className="flex items-center justify-end gap-1 text-[11px] font-f1-mono text-zinc-400">
                <span>{t.cash}:</span>
                <span className="text-white font-bold font-f1-mono tabular-nums">
                  ${(financials.bankBalance / 1000000).toFixed(1)}M
                </span>
              </div>
              <div className="flex items-center justify-end gap-1 text-[10px] font-f1-mono">
                <span className="text-zinc-400">{t.costCap.toUpperCase()}:</span>
                <span
                  className={`font-bold tabular-nums ${
                    isCostCapWarning ? 'text-red-400' : 'text-zinc-300'
                  }`}
                >
                  ${(financials.costCapSpent / 1000000).toFixed(1)} / $135M
                </span>
              </div>
            </div>
          </div>

          {/* Quick Save Button (Local) */}
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
            <span className="hidden xl:inline text-[11px] uppercase">
              {saveSuccess ? (language === 'pt' ? 'Salvo!' : 'Saved!') : (language === 'pt' ? 'Salvar' : 'Save')}
            </span>
          </button>

          {/* Cloud SQL Save & Auth Button */}
          <button
            onClick={handleCloudSave}
            disabled={cloudSaving}
            className="p-2 bg-[#1C1C26] hover:bg-[#252533] border border-white/10 text-xs font-f1-mono text-zinc-300 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
            <span className="hidden xl:inline text-[11px] uppercase">
              {cloudSaving
                ? '...'
                : cloudSaveStatus === 'saved'
                ? 'Nuvem OK'
                : cloudSaveStatus === 'error'
                ? 'Erro'
                : 'Cloud SQL'}
            </span>
          </button>

          {user ? (
            <button
              onClick={signOutUser}
              className="p-2 bg-[#1C1C26] hover:bg-[#252533] border border-white/10 text-xs font-f1-mono text-zinc-300 transition-colors flex items-center gap-1 cursor-pointer"
              title={`Conectado: ${user.email || user.displayName || 'Engenheiro'} — Clique para sair`}
            >
              <LogOut className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="p-2 bg-[#1C1C26] hover:bg-[#252533] border border-white/10 text-xs font-f1-mono text-zinc-300 transition-colors flex items-center gap-1 cursor-pointer"
              title="Entrar com Google (Firebase Auth)"
            >
              <LogIn className="w-3.5 h-3.5 text-zinc-300" />
            </button>
          )}

          {/* Language Toggle */}
          <button
            onClick={() => {
              setLanguage(language === 'pt' ? 'en' : 'pt');
              playRadioSound();
            }}
            className="px-2.5 py-1.5 bg-[#1C1C26] hover:bg-[#252533] border border-white/10 text-xs font-f1-mono text-zinc-300 transition-colors flex items-center gap-1"
          >
            <Globe className="w-3.5 h-3.5 text-[#E10600]" />
            <span className="font-bold">{language === 'pt' ? 'PT' : 'EN'}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playRadioSound();
            }}
            className="p-2 bg-[#1C1C26] hover:bg-[#252533] border border-white/10 text-zinc-400 hover:text-white transition-colors"
            title={language === 'pt' ? 'Efeitos Sonoros' : 'Sound Effects'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-600" />}
          </button>

          {/* Contador Regressivo dos Testes do Bahrein */}
          <div className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 border text-xs font-f1-mono ${
            semanasParaTeste >= 0
              ? 'bg-[#1C1C26] border-white/10 text-zinc-300'
              : 'bg-red-950/60 border-[#E10600] text-red-300'
          }`}>
            <Clock className={`w-3.5 h-3.5 ${semanasParaTeste >= 0 ? 'text-cyan-400' : 'text-[#E10600]'}`} />
            <span className="font-bold">
              TESTES DO BAHREIN:
            </span>
            <span className={`font-bold tabular-nums ${semanasParaTeste >= 0 ? 'text-emerald-400' : 'text-red-400 font-f1-wide'}`}>
              {semanasParaTeste >= 0 ? `${semanasParaTeste} Semanas Restantes` : `ATRASADO (${semanasParaTeste} Semanas)`}
            </span>
          </div>

          {/* Calendar Indicator -> Quick Jump to Grands Prix & Circuits Catalog */}
          <button
            type="button"
            onClick={() => {
              openGrandsPrixMode();
              playRadioSound();
            }}
            title={language === 'pt' ? 'Abrir modo Grandes Prêmios & Todos os Circuitos' : 'Open Grands Prix & Circuits Explorer'}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#1C1C26] hover:bg-[#252533] border border-white/10 hover:border-[#E10600]/60 text-xs font-f1-mono text-zinc-300 transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-[#E10600]" />
            <span>{t.week} {currentWeek}</span>
            <span className="text-zinc-500">·</span>
            <span className="text-white font-bold">{currentCircuit.city} GP</span>
          </button>

          {/* Primary Action Button */}
          <button
            onClick={() => {
              advanceWeek();
              playRadioSound();
            }}
            className="px-4 py-2 bg-[#E10600] hover:bg-[#c20500] text-white font-f1-wide font-bold text-xs uppercase tracking-wider transition-colors f1-tab-chamfer flex items-center gap-2 shadow-sm whitespace-nowrap shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{t.advanceWeek}</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation bar */}
      <div className="md:hidden flex items-center justify-around px-2 py-2 border-t border-white/5 bg-[#1C1C26] overflow-x-auto">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              playRadioSound();
            }}
            className={`px-2 py-1 text-[11px] font-f1-wide uppercase tracking-wider whitespace-nowrap ${
              activeTab === item.id ? 'text-[#E10600] font-bold' : 'text-zinc-400'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
