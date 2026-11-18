import React, { useState } from 'react';
import chiefAeroPortrait from '../../assets/images/chief_aero_portrait_1794925823034.jpg';
import chiefPuPortrait from '../../assets/images/chief_pu_portrait_1794925821175.jpg';
import chiefMechPortrait from '../../assets/images/chief_mech_portrait_1794925822081.jpg';
import driverSimPortrait from '../../assets/images/driver_sim_portrait_1794925822787.jpg';
import type { EngineeringAvatarRole } from '../../engine/engineeringFeedbackEngine';

interface PersonAvatarProps {
  role: EngineeringAvatarRole;
  name: string;
  sizeClass?: string;
  accentColor?: string;
}

const AVATAR_BY_ROLE: Record<EngineeringAvatarRole, string> = {
  head_aero: chiefAeroPortrait,
  head_pu: chiefPuPortrait,
  chief_mechanic: chiefMechPortrait,
  sporting_director: chiefMechPortrait,
  race_engineer: chiefMechPortrait,
  driver: driverSimPortrait,
};

function getInitials(name: string): string {
  const parts = (name || 'F1').trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

export const PersonAvatar: React.FC<PersonAvatarProps> = ({
  role,
  name,
  sizeClass = 'w-14 h-14',
  accentColor = '#E10600',
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const src = AVATAR_BY_ROLE[role];

  if (imgFailed || !src) {
    return (
      <div
        className={`${sizeClass} shrink-0 bg-[#15151E] border flex items-center justify-center font-f1-wide font-black text-sm text-white select-none`}
        style={{ borderColor: accentColor }}
        aria-label={name}
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} shrink-0 bg-[#15151E] border overflow-hidden relative`}
      style={{ borderColor: accentColor }}
    >
      <img
        src={src}
        alt={`Retrato técnico de ${name}`}
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className="w-full h-full object-cover object-top"
      />
    </div>
  );
};
