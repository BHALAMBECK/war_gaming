/**
 * Generate test agents for milestone 5.
 * Uses deterministic RNG based on seed for reproducible testing.
 */

import { Agent } from '@/render/Agents.types';
import { OrbitalElements } from '@/sim/orbit/types';
import { elementsToCartesian } from '@/sim/orbit/conversions';
import { EARTH_RADIUS } from '@/sim/orbit/constants';
import { randomFloat } from './seed';
import { BehaviorFlags, FormationType } from '@/scenario/types';

/**
 * Generate N test agents with random orbital elements.
 * Uses deterministic seed from sim clock store for reproducibility.
 * @param count Number of agents to generate
 * @returns Array of agents with initial orbital states
 */
export function generateTestAgents(count: number): Agent[] {
  const agents: Agent[] = [];

  for (let i = 0; i < count; i++) {
    // Generate random orbital elements
    // Altitude between 400 km and 2000 km
    const altitude = randomFloat(400e3, 2000e3);
    const radius = EARTH_RADIUS + altitude;
    
    const elements: OrbitalElements = {
      a: radius,
      e: randomFloat(0, 0.3), // Eccentricity 0-0.3 (mostly circular)
      i: randomFloat(0, Math.PI), // Inclination 0-π
      Ω: randomFloat(0, 2 * Math.PI), // RAAN 0-2π
      ω: randomFloat(0, 2 * Math.PI), // Argument of periapsis 0-2π
      ν: randomFloat(0, 2 * Math.PI), // True anomaly 0-2π
    };

    // Convert to Cartesian state
    const state = elementsToCartesian(elements);

    // Default behaviors (all disabled)
    const behaviors: BehaviorFlags = {
      cohesion: false,
      separation: false,
      alignment: false,
      formation: FormationType.NONE,
    };

    // Alternate between friendly and enemy for test agents
    const team: 'friendly' | 'enemy' = i % 2 === 0 ? 'friendly' : 'enemy';

    agents.push({
      id: `agent-${i}`,
      state,
      behaviors,
      team,
      dvRemaining: 1000, // Default delta-v budget: 1000 m/s
      selected: false,
      hovered: false,
    });
  }

  return agents;
}
