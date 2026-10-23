import { describe, it, expect } from 'vitest';
import { propagateOrbit, propagateKepler } from './propagator';
import { elementsToCartesian } from './conversions';
import { EARTH_RADIUS, EARTH_MU } from './constants';
import { OrbitalElements } from './types';

function leoState() {
  const elements: OrbitalElements = {
    a: EARTH_RADIUS + 500e3,
    e: 0.001,
    i: Math.PI / 4,
    Ω: 0.2,
    ω: 0.1,
    ν: 0,
  };
  return elementsToCartesian(elements);
}

describe('fidelity propagation', () => {
  it('kepler tier matches propagateKepler', () => {
    const state = leoState();
    const dt = 60;
    const a = propagateKepler(state, dt);
    const b = propagateOrbit(state, dt, 0);
    expect(b.position[0]).toBeCloseTo(a.position[0], 6);
    expect(b.velocity[0]).toBeCloseTo(a.velocity[0], 6);
  });

  it('j2 tier diverges from pure kepler over time', () => {
    const state = leoState();
    const a = EARTH_RADIUS + 500e3;
    const T = 2 * Math.PI * Math.sqrt((a * a * a) / EARTH_MU);

    let kepler = state;
    let j2 = state;
    for (let i = 0; i < 20; i++) {
      kepler = propagateOrbit(kepler, T / 20, 0);
      j2 = propagateOrbit(j2, T / 20, 1);
    }

    expect(
      Math.hypot(
        kepler.velocity[0] - j2.velocity[0],
        kepler.velocity[1] - j2.velocity[1],
        kepler.velocity[2] - j2.velocity[2]
      )
    ).toBeGreaterThan(1e-3);
  });

  it('rk4 tier stays bound for a short arc', () => {
    const state = leoState();
    const next = propagateOrbit(state, 30, 2);
    const r = Math.hypot(...next.position);
    expect(r).toBeGreaterThan(EARTH_RADIUS);
    expect(r).toBeLessThan(EARTH_RADIUS + 2000e3);
  });
});
