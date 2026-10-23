/**
 * Onboard camera / sensor helpers (sandbox FOV + LOS imaging).
 */

import { Agent } from '@/render/Agents.types';
import { angleToTargetDeg, distanceMeters, hasLineOfSight } from './los';

export interface VisibleTarget {
  id: string;
  rangeM: number;
  angleDeg: number;
}

/**
 * Default look direction: anti-radial (nadir toward Earth center from sat).
 * For LEO imaging this points roughly Earthward; for space-to-space we also
 * accept velocity-aligned look via `lookMode`.
 */
export function cameraLookDirection(
  agent: Agent,
  lookMode: 'nadir' | 'velocity' = 'velocity'
): [number, number, number] {
  if (lookMode === 'nadir') {
    const [x, y, z] = agent.state.position;
    const r = Math.sqrt(x * x + y * y + z * z) || 1;
    return [-x / r, -y / r, -z / r];
  }
  const [vx, vy, vz] = agent.state.velocity;
  const v = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1;
  return [vx / v, vy / v, vz / v];
}

export function findTargetsInFov(
  observer: Agent,
  candidates: Agent[],
  lookMode: 'nadir' | 'velocity' = 'velocity'
): VisibleTarget[] {
  const cam = observer.systems?.camera;
  if (!cam?.active) return [];

  const look = cameraLookDirection(observer, lookMode);
  const results: VisibleTarget[] = [];

  for (const other of candidates) {
    if (other.id === observer.id) continue;
    const range = distanceMeters(observer.state.position, other.state.position);
    if (range > cam.rangeM) continue;
    if (!hasLineOfSight(observer.state.position, other.state.position)) continue;
    const angle = angleToTargetDeg(
      observer.state.position,
      other.state.position,
      look
    );
    if (angle <= cam.fovDeg) {
      results.push({ id: other.id, rangeM: range, angleDeg: angle });
    }
  }

  return results.sort((a, b) => a.rangeM - b.rangeM);
}
