import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { TopBar } from './components/navigation/TopBar';
import { StartScreen } from './components/start/StartScreen';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { DashboardTab } from './components/tabs/DashboardTab';
import { EngineeringTab } from './components/tabs/EngineeringTab';
import { FacilitiesTab } from './components/tabs/FacilitiesTab';
import { TeamTab } from './components/tabs/TeamTab';
import { FinancialsTab } from './components/tabs/FinancialsTab';
import { WeekendTab } from './components/tabs/WeekendTab';
import { PuClientsTab } from './components/tabs/PuClientsTab';
import { F1Logo } from './components/brand/F1Logo';
import { X, CheckCircle2 } from 'lucide-react';

const MainContent: React.FC = () => {
  const {
    activeTab,
    showStartScreen,
    setShowStartScreen,
    showOnboarding,
    setShowOnboarding,
    completeOnboarding,
    resetToastMessage,
    setResetToastMessage,
    onboardingSessionKey
  } = useGame();

  return (
    <>
      {/* Notificação Visual Rápida de Reset no Topo da Tela */}
      {resetToastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
          <div className="bg-[#15151E]/95 border-2 border-emerald-500 text-white px-5 py-3 shadow-[0_0_30px_rgba(16,185,129,0.35)] flex items-center gap-3.5 backdrop-blur-md">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-f1-wide font-black text-xs uppercase tracking-wider text-emerald-300">
              {resetToastMessage}
            </span>
            <button
              onClick={() => setResetToastMessage(null)}
              className="ml-2 text-zinc-400 hover:text-white p-0.5 transition-colors cursor-pointer"
              title="Fechar notificação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {showOnboarding ? (
        <OnboardingFlow
          key={onboardingSessionKey}
          onComplete={completeOnboarding}
          onCancel={() => {
            setShowOnboarding(false);
            setShowStartScreen(true);
          }}
        />
      ) : showStartScreen ? (
        <StartScreen />
      ) : (
        <div className="min-h-screen bg-[#15151E] text-[#F7F4F1] flex flex-col justify-between selection:bg-[#E10600] selection:text-white">
          <div>
            <TopBar />
            <main className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
              {activeTab === 'overview' && <DashboardTab />}
              {activeTab === 'engineering' && <EngineeringTab />}
              {activeTab === 'facilities' && <FacilitiesTab />}
              {activeTab === 'team' && <TeamTab />}
              {activeTab === 'financials' && <FinancialsTab />}
              {activeTab === 'race_weekend' && <WeekendTab />}
              {activeTab === 'pu_clients' && <PuClientsTab />}
            </main>
          </div>

          {/* Official F1 Technical Brand Footer */}
          <footer className="mt-12 border-t border-[#2C2C3A] bg-[#101017] py-8 text-zinc-500 text-xs">
            <div className="max-w-7xl mx-auto px-4 lg:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <F1Logo className="h-5" variant="white" />
                <span className="text-zinc-600">|</span>
                <span className="font-f1-wide text-[11px] uppercase tracking-wider text-zinc-400">
                  FORMULA 1 HYBRID 2026 MASTER MECHANICS v6.0.0
                </span>
              </div>

              <div className="flex items-center gap-6 text-[11px] font-f1-mono text-zinc-400">
                <span>50% THERMAL / 50% ELECTRIC ERS (350kW)</span>
                <span>·</span>
                <span>$135M COST CAP</span>
                <span>·</span>
                <span>ACTIVE AERO MODE X/Z</span>
              </div>
            </div>
          </footer>
        </div>
      )}
    </>
  );
};

export default function App() {
  return (
    <GameProvider>
      <MainContent />
    </GameProvider>
  );
}
