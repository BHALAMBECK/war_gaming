import { describe, it, expect } from 'vitest';
import { propagateKeplerBatch } from './propagator';
import { elementsToCartesian } from './conversions';
import { OrbitalElements, CartesianState } from './types';
import { EARTH_RADIUS } from './constants';

/**
 * Generate a random orbital element set for testing.
 */
function generateRandomOrbit(): OrbitalElements {
  // Random altitude between 400 km and 2000 km
  const altitude = 400e3 + Math.random() * 1600e3;
  const radius = EARTH_RADIUS + altitude;

  return {
    a: radius,
    e: Math.random() * 0.3, // Eccentricity 0-0.3
    i: Math.random() * Math.PI, // Inclination 0-π
    Ω: Math.random() * 2 * Math.PI, // RAAN 0-2π
    ω: Math.random() * 2 * Math.PI, // Argument of periapsis 0-2π
    ν: Math.random() * 2 * Math.PI, // True anomaly 0-2π
  };
}

describe('propagator performance', () => {
  it('propagates 500 agents in less than 16ms', () => {
    const numAgents = 500;
    const states: CartesianState[] = [];

    // Generate 500 random orbits
    for (let i = 0; i < numAgents; i++) {
      const elements = generateRandomOrbit();
      states.push(elementsToCartesian(elements));
    }

    const deltaTime = 1.0; // 1 second

    // Warm up (let JIT optimize)
    propagateKeplerBatch(states.slice(0, 10), deltaTime);

    // Measure performance
    const startTime = performance.now();
    propagateKeplerBatch(states, deltaTime);
    const endTime = performance.now();

    const elapsedMs = endTime - startTime;

    // Should complete in less than 16ms (target for 60fps with some headroom)
    expect(elapsedMs).toBeLessThan(16);
  });

  it('propagates 1000 agents efficiently', () => {
    const numAgents = 1000;
    const states: CartesianState[] = [];

    for (let i = 0; i < numAgents; i++) {
      const elements = generateRandomOrbit();
      states.push(elementsToCartesian(elements));
    }

    const deltaTime = 1.0;

    // Warm up
    propagateKeplerBatch(states.slice(0, 10), deltaTime);

    const startTime = performance.now();
    propagateKeplerBatch(states, deltaTime);
    const endTime = performance.now();

    const elapsedMs = endTime - startTime;

    // 1000 agents should still be reasonable (allow more time)
    expect(elapsedMs).toBeLessThan(50);
  });

  it('maintains performance over multiple steps', () => {
    const numAgents = 500;
    const states: CartesianState[] = [];

    for (let i = 0; i < numAgents; i++) {
      const elements = generateRandomOrbit();
      states.push(elementsToCartesian(elements));
    }

    const deltaTime = 1.0;
    const numSteps = 10;

    // Warm up
    propagateKeplerBatch(states.slice(0, 10), deltaTime);

    const startTime = performance.now();
    let currentStates = states;
    for (let step = 0; step < numSteps; step++) {
      currentStates = propagateKeplerBatch(currentStates, deltaTime);
    }
    const endTime = performance.now();

    const elapsedMs = endTime - startTime;
    const avgMsPerStep = elapsedMs / numSteps;

    // Average per step should be under 16ms
    expect(avgMsPerStep).toBeLessThan(16);
  });

  it('handles various orbit types efficiently', () => {
    const states: CartesianState[] = [];

    // Mix of orbit types
    const orbitTypes: OrbitalElements[] = [
      // Low Earth Orbit (circular)
      { a: EARTH_RADIUS + 400e3, e: 0, i: 0, Ω: 0, ω: 0, ν: 0 },
      // Medium Earth Orbit (elliptical)
      { a: 10000e3, e: 0.2, i: Math.PI / 4, Ω: 0, ω: 0, ν: Math.PI / 2 },
      // High eccentricity
      { a: 15000e3, e: 0.8, i: Math.PI / 3, Ω: Math.PI / 2, ω: Math.PI / 4, ν: Math.PI },
      // Polar orbit
      { a: EARTH_RADIUS + 800e3, e: 0.1, i: Math.PI / 2, Ω: 0, ω: 0, ν: 0 },
    ];

    // Create 500 states with various orbit types
    for (let i = 0; i < 500; i++) {
      const orbitType = orbitTypes[i % orbitTypes.length];
      // Add some variation
      const elements: OrbitalElements = {
        ...orbitType,
        ν: (orbitType.ν || 0) + (i * 0.1) % (2 * Math.PI),
      };
      states.push(elementsToCartesian(elements));
    }

    const deltaTime = 1.0;

    // Warm up
    propagateKeplerBatch(states.slice(0, 10), deltaTime);

    const startTime = performance.now();
    propagateKeplerBatch(states, deltaTime);
    const endTime = performance.now();

    const elapsedMs = endTime - startTime;

    expect(elapsedMs).toBeLessThan(16);
  });
});

