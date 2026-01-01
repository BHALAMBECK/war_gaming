/**
 * Delta-v application module.
 * Handles impulsive burns: updating velocity and tracking delta-v budget.
 * 
 * Units:
 * - Velocity: meters/second (ECI frame)
 * - Delta-v: meters/second
 * - dvRemaining: meters/second
 * 
 * HOW TO TEST:
 * 
 * 1. Select a satellite via click
 * 2. Open Maneuver Panel (should appear on right side)
 * 3. Verify dvRemaining is displayed (default: 1000 m/s)
 * 4. Enter RTN delta-v values (e.g., radial: 0, along-track: 10, normal: 0)
 * 5. Click "Execute Burn"
 * 6. Verify:
 *    - Velocity changes (satellite trajectory changes)
 *    - dvRemaining decreases by |dvVector|
 *    - Trajectory preview updates
 * 7. Try exceeding dvRemaining budget - should show error
 * 8. Approach an objective slowly (< vThreshold) - should complete
 * 9. Selected satellite should NOT auto-navigate (others still do)
 */

import { CartesianState } from '@/sim/orbit/types';

/**
 * Apply impulsive delta-v burn to a satellite state.
 * Updates velocity vector and decrements delta-v budget.
 * 
 * @param state Current orbital state (ECI frame, meters and m/s)
 * @param dvVector Delta-v vector in ECI frame [dvx, dvy, dvz] in m/s
 * @param dvRemaining Current delta-v budget in m/s
 * @returns New state with updated velocity and updated dvRemaining budget
 * @throws Error if delta-v magnitude exceeds available budget
 */
export function applyDeltaV(
  state: CartesianState,
  dvVector: [number, number, number],
  dvRemaining: number
): { newState: CartesianState; newDvRemaining: number } {
  // Validate inputs
  if (dvRemaining < 0) {
    throw new Error(`Delta-v budget cannot be negative (got ${dvRemaining} m/s)`);
  }

  // Calculate delta-v magnitude
  const [dvx, dvy, dvz] = dvVector;
  const dvMagnitude = Math.sqrt(dvx * dvx + dvy * dvy + dvz * dvz);

  // Validate that we have enough delta-v budget
  if (dvMagnitude > dvRemaining) {
    throw new Error(
      `Delta-v magnitude (${dvMagnitude.toFixed(2)} m/s) exceeds available budget (${dvRemaining.toFixed(2)} m/s)`
    );
  }

  // Apply delta-v to velocity
  const [vx, vy, vz] = state.velocity;
  const newVelocity: [number, number, number] = [
    vx + dvx,
    vy + dvy,
    vz + dvz,
  ];

  // Calculate new delta-v budget (ensure it never goes negative)
  const newDvRemaining = Math.max(0, dvRemaining - dvMagnitude);

  return {
    newState: {
      position: state.position, // Position unchanged (impulsive burn assumption)
      velocity: newVelocity,
    },
    newDvRemaining,
  };
}
