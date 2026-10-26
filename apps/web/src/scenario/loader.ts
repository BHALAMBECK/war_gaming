/**
 * Scenario loader: applies scenario to app state.
 */

import { Scenario } from './types';
import { Agent } from '@/render/Agents.types';
import { OrbitalElements, CartesianState } from '@/sim/orbit/types';
import { elementsToCartesian } from '@/sim/orbit/conversions';
import { useSimClockStore } from '@/ui/stores/simClockStore';
import { useAgentStore } from '@/ui/stores/agentStore';
import { useTaskStore } from '@/ui/stores/taskStore';
import { useOpsStore } from '@/ui/stores/opsStore';
import { setSeed } from '@/util/seed';
import { createDefaultSystems } from '@/sim/systems/types';
import type { FidelityLevel } from '@/sim/orbit/fidelity';

/**
 * Convert scenario agent definition to Agent format.
 * Handles both OrbitalElements and CartesianState inputs.
 */
export function scenarioToAgents(scenario: Scenario): Agent[] {
  const agents: Agent[] = [];

  for (const agentScenario of scenario.agents) {
    let state: CartesianState;

    // Check if orbit is OrbitalElements or CartesianState
    if ('position' in agentScenario.orbit && 'velocity' in agentScenario.orbit) {
      // Already Cartesian state
      state = agentScenario.orbit as CartesianState;
    } else {
      // Convert orbital elements to Cartesian state
      const elements = agentScenario.orbit as OrbitalElements;
      state = elementsToCartesian(elements);
    }

    const team = agentScenario.team ?? 'friendly';
    agents.push({
      id: agentScenario.id,
      state,
      behaviors: agentScenario.behaviors,
      // Default to 'friendly' if team is not specified (backward compatibility)
      team,
      // Default to 1000 m/s if dvRemaining is not specified (backward compatibility)
      dvRemaining: agentScenario.dvRemaining ?? 1000,
      systems: createDefaultSystems(team),
      selected: false,
      hovered: false,
    });
  }

  return agents;
}

/**
 * Load scenario into app state.
 * Sets seed, sim time, agents, and objectives.
 * 
 * This function directly accesses store state and can be called from anywhere.
 */
export function loadScenario(scenario: Scenario): void {
  // Set seed first (critical for determinism)
  setSeed(scenario.seed);
  
  // Update sim clock store
  const clock = useSimClockStore.getState();
  clock.setSeed(scenario.seed);
  clock.setSimTime(scenario.sim.initialTime ?? 0);
  clock.setTimeStep(scenario.sim.timeStep);

  // Apply propagator fidelity from experiment config (default 0)
  const fidelity = (scenario.sim.fidelity ?? 0) as FidelityLevel;
  useOpsStore.getState().setFidelity(fidelity);
  
  // Convert scenario agents to Agent format
  const agents = scenarioToAgents(scenario);
  
  // Update agent store
  useAgentStore.getState().setAgents(agents);
  
  // Load objectives into task store (if present)
  if (scenario.objectives) {
    // Deep clone objectives to avoid mutating the scenario
    const objectives = scenario.objectives.map((obj) => ({ ...obj }));
    useTaskStore.getState().setObjectives(objectives);
  } else {
    // No objectives, reset task store
    useTaskStore.getState().resetTasks();
  }
}
