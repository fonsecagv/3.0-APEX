import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { SettingsModal } from './SettingsModal';

export const SettingsGear: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 bg-[#1C1C26] hover:bg-[#252533] border border-white/10 text-zinc-300 rounded"
        title="Configurações"
      >
        <Settings className="w-5 h-5" />
      </button>
      <SettingsModal open={open} onClose={() => setOpen(false)} />
    </>
  );
};
