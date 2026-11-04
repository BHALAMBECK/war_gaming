/**
 * Orbit propagator using Kepler solver (analytical two-body problem).
 * Provides deterministic, stable propagation for elliptical orbits.
 * Fidelity tiers also expose J2-aware and RK4 numerical modes (Earth only).
 */

import { CartesianState, OrbitalElements } from './types';
import { cartesianToElements, elementsToCartesian } from './conversions';
import { EARTH_MU } from './constants';
import { j2Acceleration } from './j2';
import { propagateRk4 } from './rk4';
import type { FidelityLevel } from './fidelity';
import {
  type CentralBody,
  getBodyParams,
  noteNonEarthFidelityRejected,
  resolvePropagationFidelity,
} from './bodies';

/**
 * Propagate orbit using Kepler solver.
 * Converts state to orbital elements, advances mean anomaly, converts back.
 *
 * @param state Initial Cartesian state in body-centered inertial frame
 * @param deltaTime Time step in seconds
 * @param mu Gravitational parameter (defaults to Earth μ)
 * @returns New Cartesian state after propagation
 */
export function propagateKepler(
  state: CartesianState,
  deltaTime: number,
  mu: number = EARTH_MU
): CartesianState {
  // Convert to orbital elements
  const elements = cartesianToElements(state, mu);

  // Calculate mean motion (rad/s)
  const n = Math.sqrt(mu / (elements.a * elements.a * elements.a));

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
  return elementsToCartesian(newElements, mu);
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
 * @param mu Gravitational parameter (defaults to Earth μ)
 * @returns Array of new Cartesian states
 */
export function propagateKeplerBatch(
  states: CartesianState[],
  deltaTime: number,
  mu: number = EARTH_MU
): CartesianState[] {
  return states.map((state) => propagateKepler(state, deltaTime, mu));
}

/**
 * Medium fidelity: Kepler step + first-order J2 velocity kick (Encke-lite).
 * Cheap approximation — good visual nodal precession without full RK cost.
 * Earth-only; callers must gate non-Earth bodies to Kepler.
 */
export function propagateKeplerJ2(
  state: CartesianState,
  deltaTime: number
): CartesianState {
  const kepler = propagateKepler(state, deltaTime, EARTH_MU);
  const aJ2 = j2Acceleration(state.position);
  return {
    position: kepler.position,
    velocity: [
      kepler.velocity[0] + aJ2[0] * deltaTime,
      kepler.velocity[1] + aJ2[1] * deltaTime,
      kepler.velocity[2] + aJ2[2] * deltaTime,
    ],
  };
}

/**
 * Dispatch propagation by fidelity tier and central body.
 * 0 = Kepler, 1 = Kepler+J2 kick, 2 = RK4+J2 (Earth only).
 * Non-Earth: always Kepler with that body's μ.
 */
export function propagateOrbit(
  state: CartesianState,
  deltaTime: number,
  fidelity: FidelityLevel = 0,
  centralBody: CentralBody = 'earth'
): CartesianState {
  const effective = resolvePropagationFidelity(centralBody, fidelity);
  if (effective !== fidelity) {
    noteNonEarthFidelityRejected(centralBody);
  }
  const mu = getBodyParams(centralBody).mu;

  switch (effective) {
    case 1:
      return propagateKeplerJ2(state, deltaTime);
    case 2:
      return propagateRk4(state, deltaTime, true);
    case 0:
    default:
      return propagateKepler(state, deltaTime, mu);
  }
}

export function propagateOrbitBatch(
  states: CartesianState[],
  deltaTime: number,
  fidelity: FidelityLevel = 0,
  centralBody: CentralBody = 'earth'
): CartesianState[] {
  return states.map((state) =>
    propagateOrbit(state, deltaTime, fidelity, centralBody)
  );
}
