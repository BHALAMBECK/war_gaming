/**
 * Coordinate conversion utilities for ECI (Earth-Centered Inertial) to scene coordinates.
 * Scene uses normalized units where Earth radius = 1.
 */

import { EARTH_RADIUS } from '@/sim/orbit/constants';

/**
 * Convert ECI position (meters) to scene coordinates (normalized units).
 * Scene uses Earth radius = 1 as the unit.
 * @param position ECI position in meters [x, y, z]
 * @returns Scene position in normalized units [x, y, z]
 */
export function eciToScene(position: [number, number, number]): [number, number, number] {
  return [
    position[0] / EARTH_RADIUS,
    position[1] / EARTH_RADIUS,
    position[2] / EARTH_RADIUS,
  ];
}

/**
 * Convert scene coordinates (normalized units) to ECI position (meters).
 * @param position Scene position in normalized units [x, y, z]
 * @returns ECI position in meters [x, y, z]
 */
export function sceneToEci(position: [number, number, number]): [number, number, number] {
  return [
    position[0] * EARTH_RADIUS,
    position[1] * EARTH_RADIUS,
    position[2] * EARTH_RADIUS,
  ];
}
