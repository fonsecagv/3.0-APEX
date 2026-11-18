import React, { useContext } from 'react';
import { X, Settings, Volume2, VolumeX, Globe, LogIn, LogOut } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const {
    soundEnabled,
    setSoundEnabled,
    language,
    setLanguage,
    playRadioSound,
  } = useGame();
  const { user, signInWithGoogle, signOutUser } = useAuth();

  if (!open) return null;

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as typeof language;
    setLanguage(newLang);
    localStorage.setItem('f1_apex_lang', newLang);
    playRadioSound();
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#15151E] rounded-md p-6 w-full max-w-md mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-f1-wide text-white flex items-center">
            <Settings className="w-5 h-5 mr-2" /> Configurações
          </h2>
          <button onClick={onClose} className="p-1 hover:text-white">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Audio */}
        <div className="flex items-center justify-between py-2 border-b border-white/10">
          <label className="flex items-center text-zinc-300">
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 mr-2" />
            ) : (
              <VolumeX className="w-5 h-5 mr-2" />
            )}
            Áudio
          </label>
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={() => setSoundEnabled(!soundEnabled)}
            className="toggle-toggle"
          />
        </div>

        {/* Language */}
        <div className="flex items-center justify-between py-2 border-b border-white/10">
          <label className="flex items-center text-zinc-300">
            <Globe className="w-5 h-5 mr-2" /> Idioma
          </label>
          <select
            value={language}
            onChange={handleLanguageChange}
            className="bg-[#1C1C26] text-zinc-300 px-2 py-1 rounded"
          >
            <option value="en">English</option>
            <option value="pt">Português</option>
          </select>
        </div>

        {/* Firebase Auth */}
        <div className="flex items-center justify-between py-2 border-b border-white/10">
          <label className="flex items-center text-zinc-300">
            <LogIn className="w-5 h-5 mr-2" />
            {user ? 'Sair do Google' : 'Entrar com Google'}
          </label>
          {user ? (
            <button
              onClick={async () => {
                await signOutUser();
                playRadioSound();
              }}
              className="px-3 py-1 bg-[#1C1C26] hover:bg-[#252533] text-zinc-300 rounded"
            >
              {user.email || 'Desconectar'}
            </button>
          ) : (
            <button
              onClick={async () => {
                await signInWithGoogle();
                playRadioSound();
              }}
              className="px-3 py-1 bg-[#1C1C26] hover:bg-[#252533] text-zinc-300 rounded"
            >
              Google
            </button>
          )}
        </div>

        {/* Cloud SQL placeholder */}
        <div className="flex items-center justify-between py-2">
          <label className="flex items-center text-zinc-300">
            <LogOut className="w-5 h-5 mr-2" /> Cloud SQL
          </label>
          <button
            disabled
            className="px-3 py-1 bg-[#1C1C26] text-zinc-600 rounded cursor-not-allowed"
          >
            Conectar (em breve)
          </button>
        </div>
      </div>
    </div>
  );
};
