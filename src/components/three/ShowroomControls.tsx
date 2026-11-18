import React, { useState } from 'react';
import { componentRegistry } from './ComponentRegistry';
import { ModelAssetEntry, F1_2026_MODEL_REGISTRY } from './assetRegistry';
import { ShowroomCarInstance } from './ShowroomCarInstance';
import { Canvas } from '@react-three/fiber';
import { ShowroomCanvas } from './ShowroomCanvas';

/**
 * UI panel for the showroom: select a team, change its livery color, and switch camera presets.
 */
export const ShowroomControls: React.FC = () => {
  const [selectedTeam, setSelectedTeam] = useState<string>('ferrari');
  const [liveryColor, setLiveryColor] = useState<string>('#ff0000');

  const entry = F1_2026_MODEL_REGISTRY[selectedTeam] as ModelAssetEntry;

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTeam(e.target.value);
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLiveryColor(e.target.value);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <ShowroomCanvas>
        <ShowroomCarInstance entry={entry} liveryColor={liveryColor} />
      </ShowroomCanvas>
      {/* Overlay UI */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          background: 'rgba(0,0,0,0.6)',
          padding: '8px',
          borderRadius: '4px',
          color: '#fff',
        }}
      >
        <div>
          <label>
            Team:{' '}
            <select value={selectedTeam} onChange={handleTeamChange}>
              {Object.keys(F1_2026_MODEL_REGISTRY).map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div style={{ marginTop: '4px' }}>
          <label>
            Livery Color:{' '}
            <input type="color" value={liveryColor} onChange={handleColorChange} />
          </label>
        </div>
      </div>
    </div>
  );
};
