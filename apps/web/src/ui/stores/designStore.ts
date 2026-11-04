import { create } from 'zustand';
import {
  DEFAULT_SATELLITE_DRAFT,
  type SatelliteDraft,
} from '@/scenario/design/satelliteBuilder';
import {
  DEFAULT_SCENARIO_WIZARD,
  type ScenarioStepId,
  type ScenarioWizardDraft,
} from '@/scenario/design/scenarioBuilder';

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

function freshScenarioDraft(): ScenarioWizardDraft {
  return structuredClone(DEFAULT_SCENARIO_WIZARD);
}

interface DesignState {
  satelliteDraft: SatelliteDraft;
  satelliteStep: number;
  scenarioDraft: ScenarioWizardDraft;
  scenarioStep: ScenarioStepId;
  /** True while a scenario wizard is in progress and not yet run. */
  scenarioDraftStarted: boolean;
  setSatelliteDraft: (draft: SatelliteDraft) => void;
  patchSatelliteDraft: (partial: Partial<SatelliteDraft>) => void;
  setSatelliteStep: (step: number) => void;
  patchScenarioDraft: (partial: Partial<ScenarioWizardDraft>) => void;
  setScenarioStep: (step: ScenarioStepId) => void;
  resetScenarioWizard: (started: boolean) => void;
}

export const useDesignStore = create<DesignState>((set) => ({
  satelliteDraft: loadDraft(),
  satelliteStep: 0,
  scenarioDraft: freshScenarioDraft(),
  scenarioStep: 'template',
  scenarioDraftStarted: false,
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
  setSatelliteStep: (step) =>
    set({ satelliteStep: Math.max(0, Math.min(3, step)) }),
  patchScenarioDraft: (partial) =>
    set((s) => ({ scenarioDraft: { ...s.scenarioDraft, ...partial } })),
  setScenarioStep: (scenarioStep) => set({ scenarioStep }),
  resetScenarioWizard: (scenarioDraftStarted) =>
    set({
      scenarioDraft: freshScenarioDraft(),
      scenarioStep: 'template',
      scenarioDraftStarted,
    }),
}));
