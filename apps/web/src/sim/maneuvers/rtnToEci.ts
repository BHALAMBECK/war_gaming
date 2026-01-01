/**
 * RTN (Radial, Along-Track, Normal) to ECI conversion for delta-v maneuvers.
 * 
 * RTN frame is the orbital local frame:
 * - Radial (R): Points from Earth center to satellite (outward)
 * - Along-track (T): Prograde direction (in orbital plane, perpendicular to radial)
 * - Normal (N): Cross-track direction (perpendicular to orbital plane)
 * 
 * Units:
 * - All vectors in meters/second
 * - Input RTN vector: [radial, along-track, normal] in m/s
 * - Output ECI vector: [x, y, z] in m/s
 */

import { CartesianState } from '@/sim/orbit/types';
import { computeLocalFrame } from '@/sim/swarm/localFrame';

/**
 * Convert RTN (Radial, Along-Track, Normal) delta-v vector to ECI frame.
 * 
 * @param rtnVector Delta-v vector in RTN frame [radial, along-track, normal] in m/s
 * @param state Current orbital state (used to compute RTN frame axes)
 * @returns Delta-v vector in ECI frame [dvx, dvy, dvz] in m/s
 */
export function rtnToEci(
  rtnVector: [number, number, number],
  state: CartesianState
): [number, number, number] {
  const [dvR, dvT, dvN] = rtnVector;

  // Compute RTN frame from current state
  const localFrame = computeLocalFrame(state);

  // Extract RTN basis vectors (all normalized)
  const [rx, ry, rz] = localFrame.radial; // R-axis
  const [tx, ty, tz] = localFrame.alongTrack; // T-axis (along-track/prograde)
  const [nx, ny, nz] = localFrame.crossTrack; // N-axis (normal/cross-track)

  // Transform RTN vector to ECI: dv_eci = dvR * R + dvT * T + dvN * N
  const dvx = dvR * rx + dvT * tx + dvN * nx;
  const dvy = dvR * ry + dvT * ty + dvN * ny;
  const dvz = dvR * rz + dvT * tz + dvN * nz;

  return [dvx, dvy, dvz];
}
