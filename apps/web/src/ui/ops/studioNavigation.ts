/**
 * Where a click goes next. Builders stay inside studio; running leaves it.
 */

import { validateScenario } from '@/scenario/schema';
import { attachBusToAgents } from '@/scenario/design/agentBus';
import { useDesignStore } from '@/ui/stores/designStore';
import { useAgentStore } from '@/ui/stores/agentStore';
import {
  useOpsStore,
  type BuilderReturn,
} from '@/ui/stores/opsStore';
import { useScenarioStore } from '@/ui/stores/scenarioStore';
import { useSimClockStore } from '@/ui/stores/simClockStore';

export function showProject(): void {
  const ops = useOpsStore.getState();
  ops.setBuilderReturn('home');
  ops.setStudioFocus('home');
  ops.setAppPhase('studio');
}

export function startScenario(): void {
  useDesignStore.getState().resetScenarioWizard(true);
  const ops = useOpsStore.getState();
  ops.setBuilderReturn('home');
  ops.setStudioFocus('scenario');
  ops.setAppPhase('studio');
}

export function continueScenario(): void {
  const ops = useOpsStore.getState();
  ops.setBuilderReturn('home');
  ops.setStudioFocus('scenario');
  ops.setAppPhase('studio');
}

export function openSatellite(returnTo: BuilderReturn, fresh: boolean): void {
  if (fresh) useDesignStore.getState().setSatelliteStep(0);
  const ops = useOpsStore.getState();
  ops.setBuilderReturn(returnTo);
  ops.setStudioFocus('satellite');
  ops.setAppPhase('studio');
}

export function openConstellation(): void {
  const ops = useOpsStore.getState();
  ops.setStudioFocus('constellation');
  ops.setAppPhase('studio');
}

/** Write the current bus onto the loaded scenario so a later run keeps it. */
export function applyBusToLoadedScenario(): void {
  const scenario = useScenarioStore.getState().currentScenario;
  if (!scenario || scenario.agents.length === 0) return;
  const draft = useDesignStore.getState().satelliteDraft;
  const next = validateScenario({
    ...scenario,
    agents: attachBusToAgents(scenario.agents, draft),
  });
  useScenarioStore.getState().loadScenario(next);
}

function focusViewForLoadedScenario(): void {
  const scenario = useScenarioStore.getState().currentScenario;
  const multiBody =
    scenario?.agents.some((a) => (a.centralBody ?? 'earth') !== 'earth') ??
    false;
  useOpsStore.getState().setViewMode(multiBody ? 'overview' : 'earth');
}

/**
 * Run the scenario already loaded. Fidelity stays as the scenario set it.
 * Skips the launch prompt — the builder already collected those settings.
 */
export function runLoadedScenario(): void {
  focusViewForLoadedScenario();
  useDesignStore.getState().setSatelliteStep(0);
  const ops = useOpsStore.getState();
  ops.setPendingSimLaunch(false);
  useSimClockStore.getState().setTimeScale(1);
  useSimClockStore.getState().setPaused(false);
  ops.setAppPhase('ops');
  // Keep the builder on screen during the phase fade, then return studio to the bench.
  window.setTimeout(() => {
    if (useOpsStore.getState().appPhase === 'ops') {
      useOpsStore.getState().setStudioFocus('home');
    }
  }, 700);
}

export function resumeStudio(): void {
  const design = useDesignStore.getState();
  if (design.scenarioDraftStarted) {
    continueScenario();
    return;
  }
  if (design.satelliteStep > 0) {
    openSatellite('home', false);
    return;
  }
  showProject();
}

/** After the satellite builder, go to the scenario, the sim, or start a scenario. */
export function finishSatellite(): void {
  applyBusToLoadedScenario();
  useDesignStore.getState().setSatelliteStep(0);
  const started = useDesignStore.getState().scenarioDraftStarted;
  const returnTo = useOpsStore.getState().builderReturn;
  if (returnTo === 'scenario' || started) {
    useOpsStore.getState().setStudioFocus('scenario');
    return;
  }
  if (useAgentStore.getState().agents.length > 0) {
    runLoadedScenario();
    return;
  }
  startScenario();
}
