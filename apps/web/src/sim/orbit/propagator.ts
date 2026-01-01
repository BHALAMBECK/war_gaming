/**
 * Orbit propagator using Kepler solver (analytical two-body problem).
 * Provides deterministic, stable propagation for elliptical orbits.
 */

import { CartesianState, OrbitalElements } from './types';
import { cartesianToElements, elementsToCartesian } from './conversions';
import { EARTH_MU } from './constants';

/**
 * Propagate orbit using Kepler solver.
 * Converts state to orbital elements, advances mean anomaly, converts back.
 * 
 * @param state Initial Cartesian state in ECI frame
 * @param deltaTime Time step in seconds
 * @returns New Cartesian state after propagation
 */
export function propagateKepler(
  state: CartesianState,
  deltaTime: number
): CartesianState {
  // Convert to orbital elements
  const elements = cartesianToElements(state);

  // Calculate mean motion and period
  const n = Math.sqrt(EARTH_MU / (elements.a * elements.a * elements.a)); // Mean motion (rad/s)
  const period = (2 * Math.PI) / n; // Orbital period (s)

  // Get current mean anomaly from true anomaly
  const M0 = meanAnomalyFromTrue(elements.ν!, elements.e);

  // Advance mean anomaly
  const deltaM = n * deltaTime;
  let M1 = M0 + deltaM;

  // Normalize mean anomaly to [0, 2π) to prevent unbounded growth
  // This is necessary for long-duration simulations to maintain numerical stability
  // Normalization is deterministic and doesn't affect orbit accuracy
  M1 = normalizeAngle(M1);

  // Create new orbital elements with updated mean anomaly
  const newElements: OrbitalElements = {
    ...elements,
    M: M1,
    ν: undefined, // Clear true anomaly, will be computed from M
  };

  // Convert back to Cartesian state
  return elementsToCartesian(newElements);
}

/**
 * Convert true anomaly to mean anomaly.
 * @param ν True anomaly (radians)
 * @param e Eccentricity
 * @returns Mean anomaly (radians)
 */
function meanAnomalyFromTrue(ν: number, e: number): number {
  // Convert true anomaly to eccentric anomaly
  const cosν = Math.cos(ν);
  const sinν = Math.sin(ν);

  const cosE = (e + cosν) / (1 + e * cosν);
  const sinE = (Math.sqrt(1 - e * e) * sinν) / (1 + e * cosν);

  const E = Math.atan2(sinE, cosE);

  // Convert eccentric anomaly to mean anomaly: M = E - e*sin(E)
  const M = E - e * Math.sin(E);

  return normalizeAngle(M);
}

/**
 * Normalize angle to [0, 2π).
 * @param angle Angle in radians
 * @returns Normalized angle
 */
function normalizeAngle(angle: number): number {
  angle = angle % (2 * Math.PI);
  if (angle < 0) {
    angle += 2 * Math.PI;
  }
  return angle;
}

/**
 * Propagate multiple states in batch (optimized for performance).
 * @param states Array of Cartesian states
 * @param deltaTime Time step in seconds
 * @returns Array of new Cartesian states
 */
export function propagateKeplerBatch(
  states: CartesianState[],
  deltaTime: number
): CartesianState[] {
  return states.map((state) => propagateKepler(state, deltaTime));
}

