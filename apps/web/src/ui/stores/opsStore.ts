import { create } from 'zustand';
import {
  FidelityLevel,
  FIDELITY_LABELS,
} from '@/sim/orbit/fidelity';

export type ViewMode = 'earth' | 'solar';
/** Library → Studio (design) → Analysis → Ops (live three-panel run). */
export type AppPhase = 'library' | 'studio' | 'analysis' | 'ops';
export type { FidelityLevel };
export { FIDELITY_LABELS };

const LAYOUT_KEY = 'oswv.ops.layout';

export const PANEL_LIMITS = {
  left: { min: 160, max: 480, default: 220 },
  right: { min: 180, max: 520, default: 260 },
  bottom: { min: 44, max: 140, default: 52 },
} as const;

interface PersistedLayout {
  leftPanelWidth: number;
  rightPanelWidth: number;
  bottomBarHeight: number;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function loadLayout(): PersistedLayout {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY);
    if (!raw) {
      return {
        leftPanelWidth: PANEL_LIMITS.left.default,
        rightPanelWidth: PANEL_LIMITS.right.default,
        bottomBarHeight: PANEL_LIMITS.bottom.default,
      };
    }
    const parsed = JSON.parse(raw) as Partial<PersistedLayout>;
    return {
      leftPanelWidth: clamp(
        Number(parsed.leftPanelWidth) || PANEL_LIMITS.left.default,
        PANEL_LIMITS.left.min,
        PANEL_LIMITS.left.max
      ),
      rightPanelWidth: clamp(
        Number(parsed.rightPanelWidth) || PANEL_LIMITS.right.default,
        PANEL_LIMITS.right.min,
        PANEL_LIMITS.right.max
      ),
      bottomBarHeight: clamp(
        Number(parsed.bottomBarHeight) || PANEL_LIMITS.bottom.default,
        PANEL_LIMITS.bottom.min,
        PANEL_LIMITS.bottom.max
      ),
    };
  } catch {
    return {
      leftPanelWidth: PANEL_LIMITS.left.default,
      rightPanelWidth: PANEL_LIMITS.right.default,
      bottomBarHeight: PANEL_LIMITS.bottom.default,
    };
  }
}

function persistLayout(partial: Partial<PersistedLayout>) {
  try {
    const current = loadLayout();
    localStorage.setItem(
      LAYOUT_KEY,
      JSON.stringify({ ...current, ...partial })
    );
  } catch {
    /* ignore quota / private mode */
  }
}

interface OpsState {
  appPhase: AppPhase;
  viewMode: ViewMode;
  fidelity: FidelityLevel;
  focusedBodyId: string | null;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  engagementArmed: boolean;
  leftPanelWidth: number;
  rightPanelWidth: number;
  bottomBarHeight: number;
  setAppPhase: (phase: AppPhase) => void;
  setViewMode: (mode: ViewMode) => void;
  setFidelity: (level: FidelityLevel) => void;
  setFocusedBodyId: (id: string | null) => void;
  setLeftPanelOpen: (open: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  setEngagementArmed: (armed: boolean) => void;
  setLeftPanelWidth: (width: number) => void;
  setRightPanelWidth: (width: number) => void;
  setBottomBarHeight: (height: number) => void;
}

const initialLayout = loadLayout();

export const useOpsStore = create<OpsState>((set) => ({
  appPhase: 'library',
  viewMode: 'earth',
  fidelity: 0,
  focusedBodyId: null,
  leftPanelOpen: true,
  rightPanelOpen: true,
  engagementArmed: false,
  leftPanelWidth: initialLayout.leftPanelWidth,
  rightPanelWidth: initialLayout.rightPanelWidth,
  bottomBarHeight: initialLayout.bottomBarHeight,
  setAppPhase: (appPhase) => set({ appPhase }),
  setViewMode: (viewMode) => set({ viewMode }),
  setFidelity: (fidelity) => set({ fidelity }),
  setFocusedBodyId: (focusedBodyId) => set({ focusedBodyId }),
  setLeftPanelOpen: (leftPanelOpen) => set({ leftPanelOpen }),
  setRightPanelOpen: (rightPanelOpen) => set({ rightPanelOpen }),
  setEngagementArmed: (engagementArmed) => set({ engagementArmed }),
  setLeftPanelWidth: (width) => {
    const leftPanelWidth = clamp(
      width,
      PANEL_LIMITS.left.min,
      PANEL_LIMITS.left.max
    );
    persistLayout({ leftPanelWidth });
    set({ leftPanelWidth });
  },
  setRightPanelWidth: (width) => {
    const rightPanelWidth = clamp(
      width,
      PANEL_LIMITS.right.min,
      PANEL_LIMITS.right.max
    );
    persistLayout({ rightPanelWidth });
    set({ rightPanelWidth });
  },
  setBottomBarHeight: (height) => {
    const bottomBarHeight = clamp(
      height,
      PANEL_LIMITS.bottom.min,
      PANEL_LIMITS.bottom.max
    );
    persistLayout({ bottomBarHeight });
    set({ bottomBarHeight });
  },
}));
