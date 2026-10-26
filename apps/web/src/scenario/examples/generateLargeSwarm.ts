/**
 * Expand the large-swarm stub into a 500-agent scenario at load time.
 */

import seedrandom from 'seedrandom';
import type { Scenario, AgentScenario } from '../types';
import { FormationType } from '../types';
import { EARTH_RADIUS } from '@/sim/orbit/constants';

export const LARGE_SWARM_AGENT_COUNT = 500;

/**
 * Deterministically generate N agent definitions from a seed string.
 * Uses a local RNG so global sim seed is not clobbered.
 */
export function generateLargeSwarmAgents(
  count: number,
  seed: string
): AgentScenario[] {
  const rng = seedrandom(seed);
  const agents: AgentScenario[] = [];

  for (let i = 0; i < count; i++) {
    const altitude = 400e3 + rng() * 1600e3;
    const a = EARTH_RADIUS + altitude;
    agents.push({
      id: `agent-${i}`,
      orbit: {
        a,
        e: rng() * 0.3,
        i: rng() * Math.PI,
        Ω: rng() * 2 * Math.PI,
        ω: rng() * 2 * Math.PI,
        ν: rng() * 2 * Math.PI,
      },
      behaviors: {
        cohesion: true,
        separation: true,
        alignment: true,
        formation: FormationType.NONE,
      },
      team: i % 2 === 0 ? 'friendly' : 'enemy',
      dvRemaining: 1000,
    });
  }

  return agents;
}

/**
 * Expand a large-swarm stub scenario to the full agent set.
 */
export function expandLargeSwarmScenario(stub: Scenario): Scenario {
  return {
    ...stub,
    agents: generateLargeSwarmAgents(
      LARGE_SWARM_AGENT_COUNT,
      stub.seed || 'large-swarm-default'
    ),
    sim: {
      ...stub.sim,
      fidelity: stub.sim.fidelity ?? 0,
    },
  };
}
