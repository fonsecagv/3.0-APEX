export enum SponsorCategory {
  Master = "master",
  Secondary = "secondary",
  Technical = "technical",
  Personal = "personal",
}

export type PerformanceGoal =
  | { type: "TopConstructor"; rank: number }
  | { type: "TopDriver"; rank: number }
  | { type: "Q3Appearances"; count: number }
  | { type: "PodiumCount"; count: number };

export interface ContractRequirement {
  requiredColors?: string[]; // hex codes e.g. ["#FF00FF"]
  requiredPilotNationality?: string; // ISO country code
  minMarketability?: number; // 0‑100
}

export interface SponsorContract {
  id: string;
  name: string;
  category: SponsorCategory;
  annualPayment: number; // base $M per year
  performanceGoal: PerformanceGoal;
  bonus: number; // extra $M if goal met
  satisfaction: number; // 0‑100 percentage
  isActive: boolean;
  requirements?: ContractRequirement;
}
