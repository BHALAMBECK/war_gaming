/**
 * Example scenario loader: loads prebuilt scenarios from examples folder.
 */

import { Scenario } from './types';
import { validateScenario } from './schema';

// Import example scenarios directly (Vite/TypeScript supports JSON imports)
import demoScenarioData from './examples/demo.json';
import taskDemoScenarioData from './examples/task-demo.json';
import largeSwarmScenarioData from './examples/large-swarm.json';
import simpleRingScenarioData from './examples/simple-ring.json';

/**
 * Available example scenario names.
 */
export type ExampleScenarioName = 'demo' | 'task-demo' | 'large-swarm' | 'simple-ring';

/**
 * Map of example scenario names to their data.
 */
const EXAMPLE_SCENARIOS: Record<ExampleScenarioName, unknown> = {
  'demo': demoScenarioData,
  'task-demo': taskDemoScenarioData,
  'large-swarm': largeSwarmScenarioData,
  'simple-ring': simpleRingScenarioData,
};

/**
 * Load an example scenario by name.
 * 
 * @param name Name of the example scenario (without .json extension)
 * @returns Validated Scenario object
 * @throws Error if scenario not found or validation fails
 */
export function loadExampleScenario(name: ExampleScenarioName): Scenario {
  const scenarioData = EXAMPLE_SCENARIOS[name];
  
  if (!scenarioData) {
    throw new Error(`Example scenario "${name}" not found`);
  }
  
  try {
    return validateScenario(scenarioData);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to validate example scenario "${name}": ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get list of available example scenario names.
 * 
 * @returns Array of example scenario names
 */
export function getExampleScenarioNames(): ExampleScenarioName[] {
  return Object.keys(EXAMPLE_SCENARIOS) as ExampleScenarioName[];
}
