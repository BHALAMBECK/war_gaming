/**
 * Zustand store for scenario state management.
 */

import { create } from 'zustand';
import { Scenario } from '@/scenario/types';
import { loadScenario as loadScenarioIntoApp } from '@/scenario/loader';
import { saveScenario } from '@/scenario/saver';

interface ScenarioState {
  /** Current loaded scenario */
  currentScenario: Scenario | null;
  /** Current scenario name (for display) */
  scenarioName: string;
  /** Set current scenario */
  setCurrentScenario: (scenario: Scenario | null) => void;
  /** Load scenario into app state */
  loadScenario: (scenario: Scenario) => void;
  /** Save current app state as scenario */
  saveCurrentScenario: (name: string, description?: string, version?: string) => Scenario;
  /** Reset scenario (clear current) */
  resetScenario: () => void;
}

export const useScenarioStore = create<ScenarioState>((set) => ({
  currentScenario: null,
  scenarioName: '',
  
  setCurrentScenario: (scenario) => {
    set({
      currentScenario: scenario,
      scenarioName: scenario?.name ?? '',
    });
  },
  
  loadScenario: (scenario) => {
    // Load scenario into app state
    loadScenarioIntoApp(scenario);
    
    // Update store
    set({
      currentScenario: scenario,
      scenarioName: scenario.name,
    });
  },
  
  saveCurrentScenario: (name, description = '', version = '1.0.0') => {
    const scenario = saveScenario(name, description, version);
    
    // Update store with saved scenario
    set({
      currentScenario: scenario,
      scenarioName: scenario.name,
    });
    
    return scenario;
  },
  
  resetScenario: () => {
    set({
      currentScenario: null,
      scenarioName: '',
    });
  },
}));
