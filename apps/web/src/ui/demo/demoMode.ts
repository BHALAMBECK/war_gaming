/**
 * Demo mode orchestrator: manages demo sequence and state.
 */

import { Scenario } from '@/scenario/types';
import { loadScenario } from '@/scenario/loader';
import { loadExampleScenario, ExampleScenarioName } from '@/scenario/examples';
import { useCameraStore } from '@/ui/stores/cameraStore';
import { useSimClockStore } from '@/ui/stores/simClockStore';
import type { CameraPreset } from '@/ui/stores/cameraStore';

/**
 * Previous state before demo started (for cleanup).
 */
interface PreviousState {
  cameraPreset: CameraPreset;
  timeScale: number;
  paused: boolean;
}

/**
 * Start demo mode with a prebuilt scenario.
 * 
 * @param scenarioName Name of the example scenario to load (default: 'demo')
 * @param options Demo configuration options
 * @returns Cleanup function to restore previous state
 */
export function startDemo(
  scenarioName: ExampleScenarioName = 'demo',
  options: {
    cameraPreset?: CameraPreset;
    timeScale?: number;
    autoHideUIDelay?: number;
    onUIHide?: () => void;
  } = {}
): () => void {
  const {
    cameraPreset = 'cinematic',
    timeScale = 2.0,
    autoHideUIDelay = 2000,
    onUIHide,
  } = options;

  // Save previous state
  const cameraStore = useCameraStore.getState();
  const simClockStore = useSimClockStore.getState();
  
  const previousState: PreviousState = {
    cameraPreset: cameraStore.preset,
    timeScale: simClockStore.timeScale,
    paused: simClockStore.paused,
  };

  // Load the scenario
  let scenario: Scenario;
  try {
    scenario = loadExampleScenario(scenarioName);
  } catch (error) {
    console.error('Failed to load demo scenario:', error);
    throw error;
  }

  // Load scenario into app state
  loadScenario(scenario);

  // Configure camera preset
  cameraStore.setPreset(cameraPreset);

  // Configure sim clock
  simClockStore.setTimeScale(timeScale);
  simClockStore.reset(); // Reset to initial time
  simClockStore.setPaused(false); // Start simulation

  // Schedule UI auto-hide
  let hideUITimeout: NodeJS.Timeout | null = null;
  if (autoHideUIDelay > 0 && onUIHide) {
    hideUITimeout = setTimeout(() => {
      onUIHide();
    }, autoHideUIDelay);
  }

  // Return cleanup function
  return () => {
    // Clear timeout if still pending
    if (hideUITimeout) {
      clearTimeout(hideUITimeout);
    }

    // Restore previous state
    const currentCameraStore = useCameraStore.getState();
    const currentSimClockStore = useSimClockStore.getState();
    
    currentCameraStore.setPreset(previousState.cameraPreset);
    currentSimClockStore.setTimeScale(previousState.timeScale);
    currentSimClockStore.setPaused(previousState.paused);
  };
}
