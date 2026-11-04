/**
 * Body-centered inertial position (meters) → scene units (body radius = 1).
 */

import { EARTH_RADIUS } from '@/sim/orbit/constants';

/**
 * Convert body-centered position (meters) to scene coordinates.
 * Scene unit = body radius (surface at r = 1).
 */
export function bodyToScene(
  position: [number, number, number],
  bodyRadius: number
): [number, number, number] {
  return [
    position[0] / bodyRadius,
    position[1] / bodyRadius,
    position[2] / bodyRadius,
  ];
}

/**
 * Convert scene coordinates back to meters for a given body radius.
 */
export function sceneToBody(
  position: [number, number, number],
  bodyRadius: number
): [number, number, number] {
  return [
    position[0] * bodyRadius,
    position[1] * bodyRadius,
    position[2] * bodyRadius,
  ];
}

/**
 * Earth convenience: ECI meters → scene (Earth radius = 1).
 */
export function eciToScene(
  position: [number, number, number]
): [number, number, number] {
  return bodyToScene(position, EARTH_RADIUS);
}

/**
 * Scene → ECI meters (Earth radius = 1).
 */
export function sceneToEci(
  position: [number, number, number]
): [number, number, number] {
  return sceneToBody(position, EARTH_RADIUS);
}
