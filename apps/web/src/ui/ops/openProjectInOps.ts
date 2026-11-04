/**
 * Library → Live ops entry: load scenario, pause, prompt to start.
 */

import type { Scenario } from '@/scenario/types';
import { useScenarioStore } from '@/ui/stores/scenarioStore';
import { useSimClockStore } from '@/ui/stores/simClockStore';
import { useDesignStore } from '@/ui/stores/designStore';
import { useOpsStore } from '@/ui/stores/opsStore';

/**
 * Load a scenario into Live ops with the sim paused and the launch overlay open.
 */
export function openProjectInOps(scenario: Scenario): void {
  useScenarioStore.getState().loadScenario(scenario);
  useDesignStore.getState().resetScenarioWizard(false);
  useDesignStore.getState().setSatelliteStep(0);
  useSimClockStore.getState().setPaused(true);

  const multiBody = scenario.agents.some(
    (a) => (a.centralBody ?? 'earth') !== 'earth'
  );
  useOpsStore.getState().setViewMode(multiBody ? 'overview' : 'earth');
  useOpsStore.getState().setStudioFocus('home');
  useOpsStore.getState().setPendingSimLaunch(true);
  useOpsStore.getState().setAppPhase('ops');
}
