/**
 * Local frame coordinate system for swarm behaviors.
 * 
 * Local frame is centered on a reference point (formation centroid) and aligned
 * with the orbital plane. The frame is defined by:
 * - Radial: points from Earth center to reference point
 * - Along-track: in orbital plane, perpendicular to radial (prograde direction)
 * - Cross-track: perpendicular to orbital plane (normal to plane)
 */

import { CartesianState } from '@/sim/orbit/types';
import { LocalFrame, LocalFrameState } from './types';

/**
 * Compute local frame from reference state (formation centroid).
 * @param referenceState Reference state in ECI frame
 * @returns Local frame coordinate system
 */
export function computeLocalFrame(referenceState: CartesianState): LocalFrame {
  const [rx, ry, rz] = referenceState.position;
  const [vx, vy, vz] = referenceState.velocity;
  
  // Compute radial direction (normalized)
  const r = Math.sqrt(rx * rx + ry * ry + rz * rz);
  if (r < 1e-6) {
    throw new Error('Reference position too close to Earth center');
  }
  const radial: [number, number, number] = [rx / r, ry / r, rz / r];
  
  // Compute velocity magnitude
  const v = Math.sqrt(vx * vx + vy * vy + vz * vz);
  
  // Compute angular momentum vector (h = r × v)
  const hx = ry * vz - rz * vy;
  const hy = rz * vx - rx * vz;
  const hz = rx * vy - ry * vx;
  const h = Math.sqrt(hx * hx + hy * hy + hz * hz);
  
  // Cross-track direction (normal to orbital plane, normalized angular momentum)
  if (h < 1e-6) {
    // Degenerate orbit, use default cross-track (Z-axis)
    const crossTrack: [number, number, number] = [0, 0, 1];
    // Use velocity direction as along-track if available
    const alongTrack: [number, number, number] = v > 1e-6
      ? [vx / v, vy / v, vz / v]
      : [1, 0, 0];
    return { origin: referenceState.position, radial, alongTrack, crossTrack };
  }
  
  const crossTrack: [number, number, number] = [hx / h, hy / h, hz / h];
  
  // Along-track direction: cross-track × radial (in orbital plane, prograde)
  const ax = crossTrack[1] * radial[2] - crossTrack[2] * radial[1];
  const ay = crossTrack[2] * radial[0] - crossTrack[0] * radial[2];
  const az = crossTrack[0] * radial[1] - crossTrack[1] * radial[0];
  const a = Math.sqrt(ax * ax + ay * ay + az * az);
  const alongTrack: [number, number, number] = a > 1e-6
    ? [ax / a, ay / a, az / a]
    : [1, 0, 0]; // Fallback
  
  return { origin: referenceState.position, radial, alongTrack, crossTrack };
}

/**
 * Convert ECI state to local frame coordinates.
 * @param state State in ECI frame
 * @param localFrame Local frame definition
 * @returns State in local frame
 */
export function eciToLocalFrame(
  state: CartesianState,
  localFrame: LocalFrame
): LocalFrameState {
  const [px, py, pz] = state.position;
  const [vx, vy, vz] = state.velocity;
  const [ox, oy, oz] = localFrame.origin;
  
  // Position relative to origin
  const dx = px - ox;
  const dy = py - oy;
  const dz = pz - oz;
  
  // Project onto local frame axes
  const [rx, ry, rz] = localFrame.radial;
  const [ax, ay, az] = localFrame.alongTrack;
  const [cx, cy, cz] = localFrame.crossTrack;
  
  const position: [number, number, number] = [
    dx * rx + dy * ry + dz * rz,      // Radial component
    dx * ax + dy * ay + dz * az,      // Along-track component
    dx * cx + dy * cy + dz * cz,      // Cross-track component
  ];
  
  const velocity: [number, number, number] = [
    vx * rx + vy * ry + vz * rz,      // Radial velocity
    vx * ax + vy * ay + vz * az,      // Along-track velocity
    vx * cx + vy * cy + vz * cz,      // Cross-track velocity
  ];
  
  return { position, velocity };
}

/**
 * Convert local frame state to ECI coordinates.
 * @param localState State in local frame
 * @param localFrame Local frame definition
 * @returns State in ECI frame
 */
export function localFrameToEci(
  localState: LocalFrameState,
  localFrame: LocalFrame
): CartesianState {
  const [pr, pa, pc] = localState.position;
  const [vr, va, vc] = localState.velocity;
  
  const [rx, ry, rz] = localFrame.radial;
  const [ax, ay, az] = localFrame.alongTrack;
  const [cx, cy, cz] = localFrame.crossTrack;
  const [ox, oy, oz] = localFrame.origin;
  
  // Transform position
  const position: [number, number, number] = [
    ox + pr * rx + pa * ax + pc * cx,
    oy + pr * ry + pa * ay + pc * cy,
    oz + pr * rz + pa * az + pc * cz,
  ];
  
  // Transform velocity
  const velocity: [number, number, number] = [
    vr * rx + va * ax + vc * cx,
    vr * ry + va * ay + vc * cy,
    vr * rz + va * az + vc * cz,
  ];
  
  return { position, velocity };
}

/**
 * Compute centroid (average position and velocity) of multiple agents.
 * @param states Array of states in ECI frame
 * @returns Centroid state
 */
export function computeCentroid(states: CartesianState[]): CartesianState {
  if (states.length === 0) {
    throw new Error('Cannot compute centroid of empty array');
  }
  
  let sumPx = 0, sumPy = 0, sumPz = 0;
  let sumVx = 0, sumVy = 0, sumVz = 0;
  
  for (const state of states) {
    const [px, py, pz] = state.position;
    const [vx, vy, vz] = state.velocity;
    sumPx += px;
    sumPy += py;
    sumPz += pz;
    sumVx += vx;
    sumVy += vy;
    sumVz += vz;
  }
  
  const n = states.length;
  return {
    position: [sumPx / n, sumPy / n, sumPz / n],
    velocity: [sumVx / n, sumVy / n, sumVz / n],
  };
}
