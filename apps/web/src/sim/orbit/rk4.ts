/**
 * Classic RK4 integrator for Cartesian orbital state.
 */

import { CartesianState } from './types';
import { totalAccelerationJ2, twoBodyAcceleration } from './j2';

type AccelFn = (position: [number, number, number]) => [number, number, number];

function add3(
  a: [number, number, number],
  b: [number, number, number],
  s = 1
): [number, number, number] {
  return [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
}

function derive(
  state: CartesianState,
  accel: AccelFn
): { dr: [number, number, number]; dv: [number, number, number] } {
  return {
    dr: state.velocity,
    dv: accel(state.position),
  };
}

/**
 * Single RK4 step.
 * @param includeJ2 when true, includes J2 in acceleration model
 */
export function propagateRk4(
  state: CartesianState,
  deltaTime: number,
  includeJ2 = true
): CartesianState {
  // Sub-step large deltas for stability (cap ~60s substeps)
  const maxSub = 60;
  let remaining = deltaTime;
  let current = state;
  const accel: AccelFn = includeJ2 ? totalAccelerationJ2 : twoBodyAcceleration;

  while (remaining > 1e-12) {
    const dt = Math.min(remaining, maxSub);
    current = rk4Step(current, dt, accel);
    remaining -= dt;
  }
  return current;
}

function rk4Step(
  state: CartesianState,
  dt: number,
  accel: AccelFn
): CartesianState {
  const k1 = derive(state, accel);

  const s2: CartesianState = {
    position: add3(state.position, k1.dr, dt / 2),
    velocity: add3(state.velocity, k1.dv, dt / 2),
  };
  const k2 = derive(s2, accel);

  const s3: CartesianState = {
    position: add3(state.position, k2.dr, dt / 2),
    velocity: add3(state.velocity, k2.dv, dt / 2),
  };
  const k3 = derive(s3, accel);

  const s4: CartesianState = {
    position: add3(state.position, k3.dr, dt),
    velocity: add3(state.velocity, k3.dv, dt),
  };
  const k4 = derive(s4, accel);

  const dr: [number, number, number] = [
    (k1.dr[0] + 2 * k2.dr[0] + 2 * k3.dr[0] + k4.dr[0]) / 6,
    (k1.dr[1] + 2 * k2.dr[1] + 2 * k3.dr[1] + k4.dr[1]) / 6,
    (k1.dr[2] + 2 * k2.dr[2] + 2 * k3.dr[2] + k4.dr[2]) / 6,
  ];
  const dv: [number, number, number] = [
    (k1.dv[0] + 2 * k2.dv[0] + 2 * k3.dv[0] + k4.dv[0]) / 6,
    (k1.dv[1] + 2 * k2.dv[1] + 2 * k3.dv[1] + k4.dv[1]) / 6,
    (k1.dv[2] + 2 * k2.dv[2] + 2 * k3.dv[2] + k4.dv[2]) / 6,
  ];

  return {
    position: add3(state.position, dr, dt),
    velocity: add3(state.velocity, dv, dt),
  };
}
