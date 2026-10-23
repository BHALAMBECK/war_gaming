import { create } from 'zustand';
import {
  FidelityLevel,
  FIDELITY_LABELS,
} from '@/sim/orbit/fidelity';

export type ViewMode = 'earth' | 'solar';
export type { FidelityLevel };
export { FIDELITY_LABELS };

interface OpsState {
  viewMode: ViewMode;
  fidelity: FidelityLevel;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  engagementArmed: boolean;
  setViewMode: (mode: ViewMode) => void;
  setFidelity: (level: FidelityLevel) => void;
  setLeftPanelOpen: (open: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  setEngagementArmed: (armed: boolean) => void;
}

export const useOpsStore = create<OpsState>((set) => ({
  viewMode: 'earth',
  fidelity: 0,
  leftPanelOpen: true,
  rightPanelOpen: true,
  engagementArmed: false,
  setViewMode: (viewMode) => set({ viewMode }),
  setFidelity: (fidelity) => set({ fidelity }),
  setLeftPanelOpen: (leftPanelOpen) => set({ leftPanelOpen }),
  setRightPanelOpen: (rightPanelOpen) => set({ rightPanelOpen }),
  setEngagementArmed: (engagementArmed) => set({ engagementArmed }),
}));
