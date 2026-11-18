import React, { useState, useEffect } from 'react';
import { componentRegistry } from './ComponentRegistry';
import type { BuiltF1Car } from './f1CarBuilder';

/**
 * Simple UI panel to toggle visibility of registered sub‑systems and adjust a few
 * car‑design parameters. Intended to be rendered inside <DesignCanvas>.
 */
export const DesignControls: React.FC<{ car: BuiltF1Car }> = ({ car }) => {
  // ----- Visibility toggles ---------------------------------------------------
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Initialize visibility map with all registered components set to true.
    const ids = componentRegistry.list();
    const init: Record<string, boolean> = {};
    ids.forEach((id) => (init[id] = true));
    setVisibility(init);
  }, []);

  const toggle = (id: string) => {
    const newVis = !visibility[id];
    componentRegistry.setVisibility(id, newVis);
    setVisibility({ ...visibility, [id]: newVis });
  };

  // ----- Parameter sliders ----------------------------------------------------
  const [frontWingFlap, setFrontWingFlap] = useState<number>(0);
  const [rearWingFlap, setRearWingFlap] = useState<number>(0);

  // Apply parameter changes directly on the car groups (if they exist).
  // The car builder stores groups (e.g., frontWingGroup) under known names.
  const applyFlap = (groupName: string, angleDeg: number) => {
    const obj = componentRegistry.get(groupName);
    if (obj) {
      obj.rotation.z = THREE.MathUtils.degToRad(angleDeg);
    }
  };

  useEffect(() => {
    applyFlap('FrontWing2026', frontWingFlap);
  }, [frontWingFlap]);

  useEffect(() => {
    applyFlap('RearWing2026', rearWingFlap);
  }, [rearWingFlap]);

  return (
    <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.5)', padding: '8px', borderRadius: '4px', color: '#fff' }}>
      <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Design Controls</h4>
      <div style={{ marginTop: '4px' }}>
        <strong>Visibility</strong>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '120px', overflowY: 'auto' }}>
          {Object.entries(visibility).map(([id, visible]) => (
            <li key={id}>
              <label>
                <input type="checkbox" checked={visible} onChange={() => toggle(id)} /> {id}
              </label>
            </li>
          ))}
        </ul>
      </div>
      <div style={{ marginTop: '8px' }}>
        <strong>Flap Angles</strong>
        <div>
          <label>
            Front Wing:&nbsp;
            <input
              type="range"
              min="-10"
              max="30"
              value={frontWingFlap}
              onChange={(e) => setFrontWingFlap(parseFloat(e.target.value))}
            />
            {frontWingFlap}°
          </label>
        </div>
        <div>
          <label>
            Rear Wing:&nbsp;
            <input
              type="range"
              min="-10"
              max="30"
              value={rearWingFlap}
              onChange={(e) => setRearWingFlap(parseFloat(e.target.value))}
            />
            {rearWingFlap}°
          </label>
        </div>
      </div>
    </div>
  );
};
