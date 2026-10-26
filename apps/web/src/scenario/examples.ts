/**
 * Example scenario loader: loads prebuilt scenarios from examples folder.
 */

import { Scenario } from './types';
import { validateScenario } from './schema';
import { expandLargeSwarmScenario } from './examples/generateLargeSwarm';

import demoScenarioData from './examples/demo.json';
import taskDemoScenarioData from './examples/task-demo.json';
import largeSwarmScenarioData from './examples/large-swarm.json';
import simpleRingScenarioData from './examples/simple-ring.json';

/**
 * Available example scenario names.
 */
export type ExampleScenarioName = 'demo' | 'task-demo' | 'large-swarm' | 'simple-ring';

export const EXAMPLE_SCENARIO_LABELS: Record<ExampleScenarioName, string> = {
  demo: 'Demo',
  'simple-ring': 'Simple Ring',
  'large-swarm': 'Large Swarm (500)',
  'task-demo': 'Task Demo',
};

/**
 * Map of example scenario names to their data.
 */
const EXAMPLE_SCENARIOS: Record<ExampleScenarioName, unknown> = {
  demo: demoScenarioData,
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
    const validated = validateScenario(scenarioData);
    if (name === 'large-swarm') {
      return expandLargeSwarmScenario(validated);
    }
    return validated;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to validate example scenario "${name}": ${error.message}`
      );
    }
    throw error;
  }
}

/**
 * Get list of available example scenario names.
 */
export function getExampleScenarioNames(): ExampleScenarioName[] {
  return Object.keys(EXAMPLE_SCENARIOS) as ExampleScenarioName[];
}
