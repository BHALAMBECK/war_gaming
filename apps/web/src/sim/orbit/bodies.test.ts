import { describe, it, expect } from 'vitest';
import {
  getBodyParams,
  resolvePropagationFidelity,
  type CentralBody,
} from './bodies';
import { elementsToCartesian, cartesianToElements } from './conversions';
import { propagateKepler, propagateOrbit } from './propagator';
import { EARTH_MU, EARTH_RADIUS } from './constants';

describe('bodies catalog', () => {
  it('returns Earth/Moon/Mars μ and radius', () => {
    const earth = getBodyParams('earth');
    expect(earth.mu).toBe(EARTH_MU);
    expect(earth.radius).toBe(EARTH_RADIUS);

    const moon = getBodyParams('moon');
    expect(moon.mu).toBeGreaterThan(0);
    expect(moon.radius).toBeGreaterThan(1e6);
    expect(moon.radius).toBeLessThan(2e6);

    const mars = getBodyParams('mars');
    expect(mars.mu).toBeGreaterThan(0);
    expect(mars.radius).toBeGreaterThan(3e6);
    expect(mars.radius).toBeLessThan(4e6);
  });

  it('clamps non-Earth fidelity to Kepler', () => {
    expect(resolvePropagationFidelity('earth', 2)).toBe(2);
    expect(resolvePropagationFidelity('moon', 1)).toBe(0);
    expect(resolvePropagationFidelity('mars', 2)).toBe(0);
  });
});

describe('body-centered Kepler', () => {
  it('propagates a lunar circular orbit with Moon μ', () => {
    const moon = getBodyParams('moon');
    const a = moon.radius + 100e3;
    const elements = {
      a,
      e: 0,
      i: 0.1,
      Ω: 0,
      ω: 0,
      ν: 0,
    };
    const state0 = elementsToCartesian(elements, moon.mu);
    const T = 2 * Math.PI * Math.sqrt((a * a * a) / moon.mu);
    const state1 = propagateKepler(state0, T, moon.mu);
    const r0 = Math.hypot(...state0.position);
    const r1 = Math.hypot(...state1.position);
    expect(Math.abs(r1 - r0) / r0).toBeLessThan(1e-6);
    const extracted = cartesianToElements(state1, moon.mu);
    expect(extracted.a).toBeCloseTo(a, -1);
  });

  it('forces Kepler for Moon even when fidelity is RK4', () => {
    const moon = getBodyParams('moon');
    const a = moon.radius + 100e3;
    const state = elementsToCartesian(
      { a, e: 0, i: 0.2, Ω: 0, ω: 0, ν: 0 },
      moon.mu
    );
    const kepler = propagateKepler(state, 60, moon.mu);
    const gated = propagateOrbit(state, 60, 2, 'moon');
    expect(gated.position[0]).toBeCloseTo(kepler.position[0], 3);
    expect(gated.position[1]).toBeCloseTo(kepler.position[1], 3);
    expect(gated.position[2]).toBeCloseTo(kepler.position[2], 3);
  });

  it('Earth path remains default when body omitted', () => {
    const a = EARTH_RADIUS + 500e3;
    const state = elementsToCartesian({
      a,
      e: 0,
      i: 0.5,
      Ω: 0,
      ω: 0,
      ν: 0,
    });
    const next = propagateOrbit(state, 30, 0);
    expect(Math.hypot(...next.position)).toBeGreaterThan(EARTH_RADIUS);
  });
});

describe('CentralBody type coverage', () => {
  it('accepts all bodies', () => {
    const bodies: CentralBody[] = ['earth', 'moon', 'mars'];
    for (const b of bodies) {
      expect(getBodyParams(b).label.length).toBeGreaterThan(0);
    }
  });
});
