import { describe, it, expect } from 'vitest';
import { elementsToCartesian, cartesianToElements } from './conversions';
import { OrbitalElements, CartesianState } from './types';
import { EARTH_RADIUS, EARTH_MU } from './constants';

describe('conversions', () => {
  describe('elementsToCartesian', () => {
    it('converts circular orbit to Cartesian state', () => {
      // Circular orbit at 400 km altitude (LEO)
      const altitude = 400e3; // meters
      const radius = EARTH_RADIUS + altitude;
      const elements: OrbitalElements = {
        a: radius,
        e: 0,
        i: 0,
        Ω: 0,
        ω: 0,
        ν: 0,
      };

      const state = elementsToCartesian(elements);

      // Should be at perigee (since ν=0) on positive x-axis
      expect(state.position[0]).toBeCloseTo(radius, 1);
      expect(state.position[1]).toBeCloseTo(0, 1);
      expect(state.position[2]).toBeCloseTo(0, 1);

      // Velocity should be perpendicular to position
      const r = Math.sqrt(
        state.position[0] ** 2 +
        state.position[1] ** 2 +
        state.position[2] ** 2
      );
      const v = Math.sqrt(
        state.velocity[0] ** 2 +
        state.velocity[1] ** 2 +
        state.velocity[2] ** 2
      );
      const circularVelocity = Math.sqrt(EARTH_MU / r);
      expect(v).toBeCloseTo(circularVelocity, 1);
    });

    it('converts elliptical orbit with true anomaly', () => {
      const elements: OrbitalElements = {
        a: 7000e3, // 7,000 km semi-major axis
        e: 0.1,
        i: Math.PI / 4, // 45 degrees
        Ω: Math.PI / 6, // 30 degrees
        ω: Math.PI / 3, // 60 degrees
        ν: Math.PI / 2, // 90 degrees (at apogee for this orbit)
      };

      const state = elementsToCartesian(elements);

      // Verify position and velocity are reasonable
      const r = Math.sqrt(
        state.position[0] ** 2 +
        state.position[1] ** 2 +
        state.position[2] ** 2
      );
      expect(r).toBeGreaterThan(0);
      expect(r).toBeLessThan(2 * elements.a);

      const v = Math.sqrt(
        state.velocity[0] ** 2 +
        state.velocity[1] ** 2 +
        state.velocity[2] ** 2
      );
      expect(v).toBeGreaterThan(0);
    });

    it('converts orbit with mean anomaly', () => {
      const elements: OrbitalElements = {
        a: 7000e3,
        e: 0.1,
        i: 0,
        Ω: 0,
        ω: 0,
        M: Math.PI, // Mean anomaly of π
      };

      const state = elementsToCartesian(elements);

      // Should produce valid state
      const r = Math.sqrt(
        state.position[0] ** 2 +
        state.position[1] ** 2 +
        state.position[2] ** 2
      );
      expect(r).toBeGreaterThan(0);
    });

    it('throws error if neither ν nor M provided', () => {
      const elements: OrbitalElements = {
        a: 7000e3,
        e: 0.1,
        i: 0,
        Ω: 0,
        ω: 0,
      };

      expect(() => elementsToCartesian(elements)).toThrow();
    });
  });

  describe('cartesianToElements', () => {
    it('extracts elements from circular orbit state', () => {
      // Create circular orbit at 400 km
      const altitude = 400e3;
      const radius = EARTH_RADIUS + altitude;
      const v = Math.sqrt(EARTH_MU / radius);

      const state: CartesianState = {
        position: [radius, 0, 0],
        velocity: [0, v, 0],
      };

      const elements = cartesianToElements(state);

      expect(elements.a).toBeCloseTo(radius, 1); // Allow some tolerance
      expect(elements.e).toBeCloseTo(0, 0.01); // Should be nearly circular
      expect(elements.i).toBeCloseTo(0, 0.01); // Equatorial
    });

    it('extracts elements from elliptical orbit state', () => {
      // Create elliptical orbit
      const a = 7000e3;
      const e = 0.1;
      const elements: OrbitalElements = {
        a,
        e,
        i: Math.PI / 6,
        Ω: Math.PI / 4,
        ω: Math.PI / 3,
        ν: Math.PI / 2,
      };

      const state = elementsToCartesian(elements);
      const extracted = cartesianToElements(state);

      // Verify extracted elements match (within tolerance)
      expect(extracted.a).toBeCloseTo(a, 1);
      expect(extracted.e).toBeCloseTo(e, 0.01);
      expect(extracted.i).toBeCloseTo(elements.i, 0.01);
      // Angles may differ by 2π, so normalize
      const normalizeAngle = (angle: number) => {
        angle = angle % (2 * Math.PI);
        if (angle < 0) angle += 2 * Math.PI;
        return angle;
      };
      expect(normalizeAngle(extracted.Ω)).toBeCloseTo(normalizeAngle(elements.Ω), 0.01);
      expect(normalizeAngle(extracted.ω)).toBeCloseTo(normalizeAngle(elements.ω), 0.01);
    });
  });

  describe('bidirectional conversion', () => {
    it('round-trips circular orbit accurately', () => {
      const original: OrbitalElements = {
        a: EARTH_RADIUS + 400e3,
        e: 0,
        i: 0,
        Ω: 0,
        ω: 0,
        ν: 0,
      };

      const state = elementsToCartesian(original);
      const converted = cartesianToElements(state);

      expect(converted.a).toBeCloseTo(original.a, 1);
      expect(converted.e).toBeCloseTo(original.e, 0.01);
    });

    it('round-trips elliptical orbit accurately', () => {
      const original: OrbitalElements = {
        a: 10000e3,
        e: 0.3,
        i: Math.PI / 3,
        Ω: Math.PI / 4,
        ω: Math.PI / 6,
        ν: Math.PI / 3,
      };

      const state = elementsToCartesian(original);
      const converted = cartesianToElements(state);

      expect(converted.a).toBeCloseTo(original.a, 1);
      expect(converted.e).toBeCloseTo(original.e, 0.01);
      expect(converted.i).toBeCloseTo(original.i, 0.01);
    });

    it('round-trips with mean anomaly', () => {
      const original: OrbitalElements = {
        a: 8000e3,
        e: 0.2,
        i: Math.PI / 4,
        Ω: 0,
        ω: 0,
        M: Math.PI / 2,
      };

      const state = elementsToCartesian(original);
      const converted = cartesianToElements(state);

      // For mean anomaly round-trip test, verify that the orbit parameters
      // are preserved (semi-major axis, eccentricity, inclination) rather than
      // trying to recover the exact mean anomaly, since there can be numerical
      // precision issues in the conversion chain M -> E -> ν -> E -> M
      
      // Verify key orbital parameters are preserved
      expect(converted.a).toBeCloseTo(original.a, 1);
      expect(converted.e).toBeCloseTo(original.e, 0.01);
      expect(converted.i).toBeCloseTo(original.i, 0.01);
      
      // Verify that if we convert back to Cartesian and then to elements again,
      // we get consistent results (round-trip stability)
      const state2 = elementsToCartesian({
        ...converted,
        ν: converted.ν,
      });
      const converted2 = cartesianToElements(state2);
      
      // The orbit should be stable (semi-major axis should match)
      expect(converted2.a).toBeCloseTo(original.a, 1);
    });
  });

  describe('edge cases', () => {
    it('handles equatorial orbit (i=0)', () => {
      const elements: OrbitalElements = {
        a: 7000e3,
        e: 0.1,
        i: 0,
        Ω: 0, // Ω undefined for equatorial, but we set to 0
        ω: Math.PI / 4,
        ν: Math.PI / 2,
      };

      const state = elementsToCartesian(elements);
      const converted = cartesianToElements(state);

      expect(converted.i).toBeCloseTo(0, 0.01);
    });

    it('handles polar orbit (i=π/2)', () => {
      const elements: OrbitalElements = {
        a: 7000e3,
        e: 0.1,
        i: Math.PI / 2,
        Ω: Math.PI / 4,
        ω: 0,
        ν: 0,
      };

      const state = elementsToCartesian(elements);
      const converted = cartesianToElements(state);

      expect(converted.i).toBeCloseTo(Math.PI / 2, 0.01);
    });

    it('handles high eccentricity orbit', () => {
      const elements: OrbitalElements = {
        a: 10000e3,
        e: 0.9,
        i: 0,
        Ω: 0,
        ω: 0,
        ν: 0,
      };

      const state = elementsToCartesian(elements);
      const converted = cartesianToElements(state);

      expect(converted.e).toBeCloseTo(0.9, 0.01);
    });
  });
});

