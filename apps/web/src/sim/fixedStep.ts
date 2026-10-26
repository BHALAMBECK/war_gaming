/**
 * Fixed-step accumulator for FPS-independent physics.
 */

export const DEFAULT_MAX_STEPS_PER_FRAME = 50;

export interface FixedStepResult {
  /** Whole physics steps to run this frame */
  steps: number;
  /** Leftover time not yet consumed */
  accumulator: number;
}

/**
 * Accumulate wall/frame time into whole fixed steps.
 *
 * @param accumulator Previous leftover (seconds of sim time)
 * @param frameDelta Render frame delta (seconds, wall clock)
 * @param timeScale Simulation speed multiplier
 * @param dt Fixed physics step (seconds)
 * @param maxSteps Cap steps per frame (spiral-of-death guard)
 */
export function accumulateFixedSteps(
  accumulator: number,
  frameDelta: number,
  timeScale: number,
  dt: number,
  maxSteps: number = DEFAULT_MAX_STEPS_PER_FRAME
): FixedStepResult {
  if (!(dt > 0) || !Number.isFinite(dt)) {
    return { steps: 0, accumulator };
  }

  let acc = accumulator + Math.max(0, frameDelta) * Math.max(0, timeScale);
  let steps = 0;
  while (acc >= dt && steps < maxSteps) {
    acc -= dt;
    steps += 1;
  }
  return { steps, accumulator: acc };
}
