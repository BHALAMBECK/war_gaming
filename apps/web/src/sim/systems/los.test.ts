import { describe, it, expect } from 'vitest';
import { hasLineOfSight, distanceMeters } from './los';
import { EARTH_RADIUS } from '@/sim/orbit/constants';

describe('los', () => {
  it('reports clear LOS for two nearby LEO sats', () => {
    const r = EARTH_RADIUS + 500e3;
    const a: [number, number, number] = [r, 0, 0];
    // ~2° apart along the equator — chord stays outside Earth
    const ang = (2 * Math.PI) / 180;
    const b: [number, number, number] = [r * Math.cos(ang), r * Math.sin(ang), 0];
    expect(hasLineOfSight(a, b)).toBe(true);
  });

  it('reports blocked LOS for antipodal LEO sats', () => {
    const a: [number, number, number] = [EARTH_RADIUS + 400e3, 0, 0];
    const b: [number, number, number] = [-(EARTH_RADIUS + 400e3), 0, 0];
    expect(hasLineOfSight(a, b)).toBe(false);
  });

  it('computes distance', () => {
    expect(distanceMeters([0, 0, 0], [3, 4, 0])).toBe(5);
  });
});
