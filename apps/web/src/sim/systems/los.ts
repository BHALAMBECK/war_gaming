/**
 * Line-of-sight geometry against a spherical Earth occultation model.
 */

import { EARTH_RADIUS } from '@/sim/orbit/constants';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

function toVec3(p: [number, number, number]): Vec3 {
  return { x: p[0], y: p[1], z: p[2] };
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function len(a: Vec3): number {
  return Math.sqrt(dot(a, a));
}

/**
 * True if the segment from A to B does not intersect the Earth sphere
 * (aside from endpoints outside the sphere). Uses closest-approach on the chord.
 */
export function hasLineOfSight(
  from: [number, number, number],
  to: [number, number, number],
  bodyRadius: number = EARTH_RADIUS
): boolean {
  const a = toVec3(from);
  const b = toVec3(to);
  const ab = sub(b, a);
  const abLen = len(ab);
  if (abLen < 1e-6) return false;

  // Both endpoints must be outside the body
  if (len(a) <= bodyRadius || len(b) <= bodyRadius) return false;

  // Closest point on infinite line to origin: t = -dot(a, ab) / |ab|^2
  const t = -dot(a, ab) / (abLen * abLen);
  if (t <= 0 || t >= 1) {
    // Closest approach outside segment — LOS clear if endpoints outside
    return true;
  }

  const closest: Vec3 = {
    x: a.x + ab.x * t,
    y: a.y + ab.y * t,
    z: a.z + ab.z * t,
  };
  return len(closest) > bodyRadius;
}

export function distanceMeters(
  a: [number, number, number],
  b: [number, number, number]
): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Angle between velocity-forward (or nadir-avoiding look) and target vector.
 * Uses position→target as look direction from `from`.
 */
export function angleToTargetDeg(
  from: [number, number, number],
  to: [number, number, number],
  lookDir: [number, number, number]
): number {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dz = to[2] - from[2];
  const tLen = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const lLen = Math.sqrt(
    lookDir[0] ** 2 + lookDir[1] ** 2 + lookDir[2] ** 2
  );
  if (tLen < 1e-6 || lLen < 1e-6) return 180;
  const cos =
    (dx * lookDir[0] + dy * lookDir[1] + dz * lookDir[2]) / (tLen * lLen);
  return (Math.acos(Math.min(1, Math.max(-1, cos))) * 180) / Math.PI;
}
