// src/state/teamSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { SponsorContract } from '../types/sponsor';
import type { Driver } from '../types/f1';
import type { StaffMember } from '../types/staff';

interface FanBase {
  size: number;
  growthRate: number;
}

interface TeamState {
  drivers: Driver[];
  staff: StaffMember[];
  sponsorContracts: SponsorContract[];
  fanBase: FanBase;
  sponsorRevenue: number;
}

const initialState: TeamState = {
  drivers: [],
  staff: [],
  sponsorContracts: [],
  fanBase: { size: 0, growthRate: 0 },
  sponsorRevenue: 0,
};

export const teamSlice = createSlice({
  name: 'team',
  initialState,
  reducers: {
    addSponsorContract(state, action: PayloadAction<SponsorContract>) {
      state.sponsorContracts.push(action.payload);
    },
    removeSponsorContract(state, action: PayloadAction<string>) {
      state.sponsorContracts = state.sponsorContracts.filter(c => c.id !== action.payload);
    },
    hireStaffMember(state, action: PayloadAction<StaffMember>) {
      const member = action.payload;
      state.staff.push({ ...member, isHired: true });
    },
    fireStaffMember(state, action: PayloadAction<string>) {
      state.staff = state.staff.filter(s => s.id !== action.payload);
    },
    updateSponsorSatisfaction(
      state,
      action: PayloadAction<{ id: string; delta: number }>
    ) {
      const contract = state.sponsorContracts.find(c => c.id === action.payload.id);
      if (contract) {
        contract.satisfaction = Math.max(0, Math.min(100, contract.satisfaction + action.payload.delta));
        if (contract.satisfaction === 0) contract.isActive = false;
      }
    },
    setSponsorRevenue(state, action: PayloadAction<number>) {
      state.sponsorRevenue = action.payload;
    },
    setFanBase(state, action: PayloadAction<FanBase>) {
      state.fanBase = action.payload;
    },
  },
});

export const {
  addSponsorContract,
  removeSponsorContract,
  hireStaffMember,
  fireStaffMember,
  updateSponsorSatisfaction,
  setSponsorRevenue,
  setFanBase,
} = teamSlice.actions;

export default teamSlice.reducer;
