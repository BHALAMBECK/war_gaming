import { describe, it, expect } from 'vitest';
import { setSeed } from '@/util/seed';
import { elementsToCartesian } from './conversions';
import { propagateOrbit } from './propagator';
import type { OrbitalElements } from './types';
import type { FidelityLevel } from './fidelity';

function hashPositions(positions: Array<[number, number, number]>): string {
  // Stable decimal truncation for golden comparison
  return positions
    .map(
      ([x, y, z]) =>
        `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`
    )
    .join('|');
}

describe('golden fixed-step trajectory', () => {
  it('matches fixture for Kepler fidelity after 60 steps', () => {
    setSeed('golden-kepler');
    const elements: OrbitalElements = {
      a: 6771000,
      e: 0.01,
      i: 0.5,
      Ω: 0.2,
      ω: 0.3,
      ν: 0.4,
    };
    let state = elementsToCartesian(elements);
    const dt = 1.0;
    const fidelity: FidelityLevel = 0;
    for (let i = 0; i < 60; i++) {
      state = propagateOrbit(state, dt, fidelity);
    }
    const hash = hashPositions([state.position]);
    expect(hash).toBe('5927329.197,2981969.369,953270.524');
  });
});
