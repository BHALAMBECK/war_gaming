import { create } from 'zustand';
import {
  DEFAULT_SATELLITE_DRAFT,
  type SatelliteDraft,
} from '@/scenario/design/satelliteBuilder';

const STORAGE_KEY = 'oswv.design.satellite';

function loadDraft(): SatelliteDraft {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SATELLITE_DRAFT;
    return { ...DEFAULT_SATELLITE_DRAFT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SATELLITE_DRAFT;
  }
}

function persistDraft(draft: SatelliteDraft) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    /* ignore */
  }
}

interface DesignState {
  satelliteDraft: SatelliteDraft;
  setSatelliteDraft: (draft: SatelliteDraft) => void;
  patchSatelliteDraft: (partial: Partial<SatelliteDraft>) => void;
}

export const useDesignStore = create<DesignState>((set) => ({
  satelliteDraft: loadDraft(),
  setSatelliteDraft: (satelliteDraft) => {
    persistDraft(satelliteDraft);
    set({ satelliteDraft });
  },
  patchSatelliteDraft: (partial) =>
    set((s) => {
      const satelliteDraft = { ...s.satelliteDraft, ...partial };
      persistDraft(satelliteDraft);
      return { satelliteDraft };
    }),
}));
