/**
 * Scenario saver: exports current app state to Scenario format.
 */

import { Scenario, AgentScenario, BehaviorFlags, FormationType } from './types';
import { Agent } from '@/render/Agents.types';
import { OrbitalElements, CartesianState } from '@/sim/orbit/types';
import { cartesianToElements } from '@/sim/orbit/conversions';
import { useSimClockStore } from '@/ui/stores/simClockStore';
import { useAgentStore } from '@/ui/stores/agentStore';
import { useTaskStore } from '@/ui/stores/taskStore';
import { EARTH_RADIUS, EARTH_MU } from '@/sim/orbit/constants';

/**
 * Convert agent to scenario format.
 * Converts Cartesian state to orbital elements for storage.
 * 
 * @param agent Agent to convert
 * @returns AgentScenario with orbital elements
 */
function agentToScenario(agent: Agent): AgentScenario {
  // Convert Cartesian state to orbital elements
  const elements = cartesianToElements(agent.state);
  
  return {
    id: agent.id,
    orbit: elements as OrbitalElements,
    behaviors: agent.behaviors, // Preserve agent behaviors
    team: agent.team, // Preserve team property
  };
}

/**
 * Save current app state as a scenario.
 * 
 * @param name Scenario name
 * @param description Scenario description
 * @param version Scenario version (defaults to "1.0.0")
 * @returns Scenario object
 */
export function saveScenario(
  name: string,
  description: string = '',
  version: string = '1.0.0'
): Scenario {
  const simClockStore = useSimClockStore.getState();
  const agentStore = useAgentStore.getState();
  const taskStore = useTaskStore.getState();
  
  // Get current agents
  const agents = agentStore.agents;
  
  // Convert agents to scenario format
  const agentScenarios: AgentScenario[] = agents.map(agentToScenario);
  
  // Get sim params from clock store
  // Note: timeStep is not directly stored, use a default
  const timeStep = 1.0; // Default time step in seconds
  
  // Get objectives from task store (deep clone to avoid mutations)
  const objectives = taskStore.objectives.length > 0
    ? taskStore.objectives.map((obj) => ({ ...obj }))
    : undefined;
  
  // Create scenario
  const scenario: Scenario = {
    name,
    description,
    version,
    earth: {
      radius: EARTH_RADIUS,
      mu: EARTH_MU,
    },
    agents: agentScenarios,
    sim: {
      timeStep,
      initialTime: simClockStore.simTime,
    },
    seed: simClockStore.seed,
    objectives,
  };
  
  return scenario;
}

/**
 * Convert scenario to JSON string.
 * 
 * @param scenario Scenario to serialize
 * @param pretty Whether to pretty-print JSON (defaults to true)
 * @returns JSON string
 */
export function scenarioToJSON(scenario: Scenario, pretty: boolean = true): string {
  if (pretty) {
    return JSON.stringify(scenario, null, 2);
  }
  return JSON.stringify(scenario);
}

/**
 * Download scenario as JSON file.
 * 
 * @param scenario Scenario to download
 * @param filename Optional filename (defaults to scenario name with .json extension)
 */
export function downloadScenario(scenario: Scenario, filename?: string): void {
  const json = scenarioToJSON(scenario, true);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `${scenario.name.replace(/[^a-z0-9]/gi, '_')}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
