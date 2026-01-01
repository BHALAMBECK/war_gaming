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
import { setSeed } from '@/util/seed';

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

    agents.push({
      id: agentScenario.id,
      state,
      behaviors: agentScenario.behaviors,
      // Default to 'friendly' if team is not specified (backward compatibility)
      team: agentScenario.team ?? 'friendly',
      // Default to 1000 m/s if dvRemaining is not specified (backward compatibility)
      dvRemaining: agentScenario.dvRemaining ?? 1000,
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
  useSimClockStore.getState().setSeed(scenario.seed);
  useSimClockStore.getState().setSimTime(scenario.sim.initialTime ?? 0);
  
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
