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
import { X, CheckCircle2, AlertTriangle, UserCheck } from 'lucide-react';

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
    onboardingSessionKey,
    pendingHaasCamaraEvent,
    resolveHaasCamaraEvent
  } = useGame();

  return (
    <>
      {/* Modal de Decisão Dinâmica: Crise Ocon vs. Komatsu / Estreia Antecipada Rafael Câmara */}
      {pendingHaasCamaraEvent && !showOnboarding && !showStartScreen && (
        <div className="fixed inset-0 z-[180] bg-black/85 flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-[#15151E] border-2 border-[#E10600] p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-white/10 pb-3 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#E10600]/20 border border-[#E10600] flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-[#E10600]" />
                </div>
                <div>
                  <span className="text-[10px] font-f1-mono text-[#E10600] font-bold uppercase tracking-widest block">
                    EVENTO DE PADDOCK · ETAPA {pendingHaasCamaraEvent.round} ({pendingHaasCamaraEvent.gpName})
                  </span>
                  <h2 className="font-f1-wide font-black text-base sm:text-lg text-white uppercase">
                    Crise na Garagem Haas: Ocon vs. Ayao Komatsu
                  </h2>
                </div>
              </div>
            </div>

            <div className="bg-[#1C1C26] border border-white/10 p-4 text-xs font-f1-mono text-zinc-200 space-y-2 leading-relaxed">
              <p>
                Um desentendimento grave nos bastidores entre <strong className="text-white">Esteban Ocon (#31)</strong> e a liderança da equipe rompeu a confiança interna às vésperas do <strong className="text-amber-300">{pendingHaasCamaraEvent.gpName}</strong>.
              </p>
              <p className="text-zinc-400">
                O brasileiro <strong className="text-emerald-300">Rafael Câmara</strong> — já pré-contratado pela Haas para 2027 — está com superlicença ativa no paddock e pronto para assumir o carro imediatamente em Interlagos.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => resolveHaasCamaraEvent(true)}
                className="p-3.5 bg-[#E10600] hover:bg-[#c20500] text-white font-f1-wide font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserCheck className="w-4 h-4 shrink-0" />
                <span>Demitir Ocon & Estrear Rafael Câmara</span>
              </button>
              <button
                type="button"
                onClick={() => resolveHaasCamaraEvent(false)}
                className="p-3.5 bg-[#1C1C26] hover:bg-[#262635] border border-white/15 text-zinc-200 font-f1-wide font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Manter Ocon até o Fim de 2026
              </button>
            </div>
          </div>
        </div>
      )}

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
