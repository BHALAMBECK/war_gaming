/**
 * J2 zonal harmonic perturbation acceleration (ECI, Earth-fixed approx).
 */

import { EARTH_J2, EARTH_MU, EARTH_RADIUS } from './constants';

/**
 * Compute J2 acceleration at position r (meters).
 * @returns acceleration m/s² in ECI
 */
export function j2Acceleration(
  position: [number, number, number]
): [number, number, number] {
  const [x, y, z] = position;
  const r2 = x * x + y * y + z * z;
  const r = Math.sqrt(r2);
  if (r < EARTH_RADIUS * 0.5) {
    return [0, 0, 0];
  }

  const r5 = r2 * r2 * r;
  const z2 = z * z;
  const factor =
    (-1.5 * EARTH_J2 * EARTH_MU * EARTH_RADIUS * EARTH_RADIUS) / r5;
  const k = 5 * (z2 / r2);

  return [
    factor * x * (1 - k),
    factor * y * (1 - k),
    factor * z * (3 - k),
  ];
}

/**
 * Two-body point-mass acceleration.
 */
export function twoBodyAcceleration(
  position: [number, number, number]
): [number, number, number] {
  const [x, y, z] = position;
  const r2 = x * x + y * y + z * z;
  const r = Math.sqrt(r2);
  if (r < 1) return [0, 0, 0];
  const factor = -EARTH_MU / (r2 * r);
  return [factor * x, factor * y, factor * z];
}

export function totalAccelerationJ2(
  position: [number, number, number]
): [number, number, number] {
  const a0 = twoBodyAcceleration(position);
  const aJ2 = j2Acceleration(position);
  return [a0[0] + aJ2[0], a0[1] + aJ2[1], a0[2] + aJ2[2]];
}
