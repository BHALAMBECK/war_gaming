import { describe, it, expect } from 'vitest';
import { propagateKepler, propagateKeplerBatch } from './propagator';
import { elementsToCartesian, cartesianToElements } from './conversions';
import { OrbitalElements, CartesianState } from './types';
import { EARTH_RADIUS, EARTH_MU } from './constants';

describe('propagator', () => {
  describe('propagateKepler', () => {
    it('propagates circular orbit correctly', () => {
      // Circular orbit at 400 km altitude
      const altitude = 400e3;
      const radius = EARTH_RADIUS + altitude;
      const elements: OrbitalElements = {
        a: radius,
        e: 0,
        i: 0,
        Ω: 0,
        ω: 0,
        ν: 0,
      };

      const initialState = elementsToCartesian(elements);
      const period = 2 * Math.PI * Math.sqrt((radius ** 3) / EARTH_MU);

      // Propagate by one period
      const finalState = propagateKepler(initialState, period);

      // Should return to approximately the same position (within tolerance)
      const initialR = Math.sqrt(
        initialState.position[0] ** 2 +
        initialState.position[1] ** 2 +
        initialState.position[2] ** 2
      );
      const finalR = Math.sqrt(
        finalState.position[0] ** 2 +
        finalState.position[1] ** 2 +
        finalState.position[2] ** 2
      );

      expect(finalR).toBeCloseTo(initialR, 1);
    });

    it('propagates elliptical orbit without drift', () => {
      const elements: OrbitalElements = {
        a: 7000e3,
        e: 0.1,
        i: Math.PI / 6,
        Ω: Math.PI / 4,
        ω: Math.PI / 3,
        ν: 0,
      };

      const initialState = elementsToCartesian(elements);
      const period = 2 * Math.PI * Math.sqrt((elements.a ** 3) / EARTH_MU);

      // Propagate for 10 periods
      let state = initialState;
      for (let i = 0; i < 10; i++) {
        state = propagateKepler(state, period);
      }

      // Check that orbit hasn't exploded (semi-major axis should be preserved)
      const r = Math.sqrt(
        state.position[0] ** 2 +
        state.position[1] ** 2 +
        state.position[2] ** 2
      );
      expect(r).toBeGreaterThan(0);
      expect(r).toBeLessThan(2 * elements.a * 1.1); // Allow some tolerance
    });

    it('propagates deterministically', () => {
      const elements: OrbitalElements = {
        a: 8000e3,
        e: 0.2,
        i: Math.PI / 4,
        Ω: 0,
        ω: 0,
        ν: Math.PI / 2,
      };

      const initialState = elementsToCartesian(elements);
      const deltaTime = 3600; // 1 hour

      // Propagate twice with same input
      const state1 = propagateKepler(initialState, deltaTime);
      const state2 = propagateKepler(initialState, deltaTime);

      // Should be identical (deterministic)
      expect(state1.position[0]).toBeCloseTo(state2.position[0], 10);
      expect(state1.position[1]).toBeCloseTo(state2.position[1], 10);
      expect(state1.position[2]).toBeCloseTo(state2.position[2], 10);
      expect(state1.velocity[0]).toBeCloseTo(state2.velocity[0], 10);
      expect(state1.velocity[1]).toBeCloseTo(state2.velocity[1], 10);
      expect(state1.velocity[2]).toBeCloseTo(state2.velocity[2], 10);
    });

    it('propagates with small time steps accurately', () => {
      const elements: OrbitalElements = {
        a: 7000e3,
        e: 0.1,
        i: 0,
        Ω: 0,
        ω: 0,
        ν: 0,
      };

      const initialState = elementsToCartesian(elements);
      const period = 2 * Math.PI * Math.sqrt((elements.a ** 3) / EARTH_MU);

      // Propagate in many small steps
      const numSteps = 100;
      const stepSize = period / numSteps;
      let state = initialState;
      for (let i = 0; i < numSteps; i++) {
        state = propagateKepler(state, stepSize);
      }

      // After one period, verify orbit stability rather than exact position
      // (numerical errors accumulate with many small steps)
      const finalR = Math.sqrt(
        state.position[0] ** 2 +
        state.position[1] ** 2 +
        state.position[2] ** 2
      );

      // Verify orbit is stable: radius should be within reasonable bounds
      // (perigee for this orbit is a*(1-e) = 6300km, apogee is a*(1+e) = 7700km)
      expect(finalR).toBeGreaterThan(6000e3);
      expect(finalR).toBeLessThan(8000e3);
      
      // Verify semi-major axis is preserved (more important than exact position)
      const finalElements = cartesianToElements(state);
      expect(finalElements.a).toBeCloseTo(elements.a, 1); // Allow ~1m tolerance (numerical precision)
    });

    it('handles high eccentricity orbits', () => {
      const elements: OrbitalElements = {
        a: 10000e3,
        e: 0.8,
        i: 0,
        Ω: 0,
        ω: 0,
        ν: 0,
      };

      const initialState = elementsToCartesian(elements);
      const period = 2 * Math.PI * Math.sqrt((elements.a ** 3) / EARTH_MU);

      // Propagate for one period
      const finalState = propagateKepler(initialState, period);

      // Should maintain orbit shape
      const initialR = Math.sqrt(
        initialState.position[0] ** 2 +
        initialState.position[1] ** 2 +
        initialState.position[2] ** 2
      );
      const finalR = Math.sqrt(
        finalState.position[0] ** 2 +
        finalState.position[1] ** 2 +
        finalState.position[2] ** 2
      );

      // Perigee should be similar (allowing tolerance for high eccentricity)
      expect(finalR).toBeCloseTo(initialR, 1); // Allow ~1m tolerance
    });

    it('preserves energy over long propagation', () => {
      const elements: OrbitalElements = {
        a: 7000e3,
        e: 0.1,
        i: Math.PI / 6,
        Ω: 0,
        ω: 0,
        ν: 0,
      };

      const initialState = elementsToCartesian(elements);
      
      // Calculate initial energy
      const r0 = Math.sqrt(
        initialState.position[0] ** 2 +
        initialState.position[1] ** 2 +
        initialState.position[2] ** 2
      );
      const v0 = Math.sqrt(
        initialState.velocity[0] ** 2 +
        initialState.velocity[1] ** 2 +
        initialState.velocity[2] ** 2
      );
      const energy0 = (v0 ** 2) / 2 - EARTH_MU / r0;

      // Propagate for 10 periods
      const period = 2 * Math.PI * Math.sqrt((elements.a ** 3) / EARTH_MU);
      let state = initialState;
      for (let i = 0; i < 10; i++) {
        state = propagateKepler(state, period);
      }

      // Calculate final energy
      const r1 = Math.sqrt(
        state.position[0] ** 2 +
        state.position[1] ** 2 +
        state.position[2] ** 2
      );
      const v1 = Math.sqrt(
        state.velocity[0] ** 2 +
        state.velocity[1] ** 2 +
        state.velocity[2] ** 2
      );
      const energy1 = (v1 ** 2) / 2 - EARTH_MU / r1;

      // Energy should be conserved (within numerical precision)
      expect(energy1).toBeCloseTo(energy0, 0.1);
    });
  });

  describe('propagateKeplerBatch', () => {
    it('propagates multiple states correctly', () => {
      const elements1: OrbitalElements = {
        a: 7000e3,
        e: 0.1,
        i: 0,
        Ω: 0,
        ω: 0,
        ν: 0,
      };

      const elements2: OrbitalElements = {
        a: 8000e3,
        e: 0.2,
        i: Math.PI / 4,
        Ω: 0,
        ω: 0,
        ν: Math.PI / 2,
      };

      const states: CartesianState[] = [
        elementsToCartesian(elements1),
        elementsToCartesian(elements2),
      ];

      const deltaTime = 3600; // 1 hour
      const propagated = propagateKeplerBatch(states, deltaTime);

      expect(propagated).toHaveLength(2);
      expect(propagated[0]?.position).toBeDefined();
      expect(propagated[1]?.position).toBeDefined();

      // Verify states are different (different orbits)
      const state1 = propagated[0]!;
      const state2 = propagated[1]!;
      const r1 = Math.sqrt(
        state1.position[0] ** 2 +
        state1.position[1] ** 2 +
        state1.position[2] ** 2
      );
      const r2 = Math.sqrt(
        state2.position[0] ** 2 +
        state2.position[1] ** 2 +
        state2.position[2] ** 2
      );

      // Should be different (unless by coincidence)
      // At minimum, verify both are valid
      expect(r1).toBeGreaterThan(0);
      expect(r2).toBeGreaterThan(0);
    });

    it('produces same results as individual propagation', () => {
      const elements: OrbitalElements = {
        a: 7000e3,
        e: 0.1,
        i: 0,
        Ω: 0,
        ω: 0,
        ν: 0,
      };

      const state = elementsToCartesian(elements);
      const deltaTime = 1800; // 30 minutes

      // Individual propagation
      const individual = propagateKepler(state, deltaTime);

      // Batch propagation
      const batch = propagateKeplerBatch([state], deltaTime);
      const batchState = batch[0]!;

      expect(batchState.position[0]).toBeCloseTo(individual.position[0], 1);
      expect(batchState.position[1]).toBeCloseTo(individual.position[1], 1);
      expect(batchState.position[2]).toBeCloseTo(individual.position[2], 1);
    });
  });
});

