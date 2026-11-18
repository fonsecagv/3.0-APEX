// src/hooks/useTeamDNAMatch.ts
import { useSelector } from 'react-redux';
import type { RootState } from '../state/store';
import { Specialization } from '../types/staff';

/**
 * Hook that determines if a staff member's specialization conflicts with the team's philosophy.
 * Returns true when there is a conflict (i.e., a penalty should be applied).
 */
export const useTeamDNAMatch = (staffSpecialization: Specialization, philosophy?: string): boolean => {
  const teamPhilosophy = useSelector((state: RootState) => (state.team as any).philosophy);
  const normalizedPhilo = (philosophy ?? teamPhilosophy ?? '').toLowerCase();

  // Conflict rules based on design document
  if (normalizedPhilo.includes('low_drag')) {
    return staffSpecialization !== Specialization.LOW_DRAG;
  }
  if (normalizedPhilo.includes('high_downforce')) {
    return staffSpecialization === Specialization.LOW_DRAG;
  }
  // Conservative vs Innovator conflict could be added later
  return false;
};

/** Helper to get a human‑readable conflict message */
export const getConflictMessage = (specialization: Specialization, philosophy: string): string => {
  return `⚠️ Conflito de DNA – ${specialization} não combina com a filosofia ${philosophy}.`;
};
