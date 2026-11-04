import { describe, it, expect } from 'vitest';
import { loadExampleScenario } from '../examples';
import { scenarioToAgents } from '../loader';
import { stepAgents } from '@/sim/stepAgents';
import { SOLAR_MISSIONS_HERO_ID } from './generateSolarMissions';

describe('Solar Missions end-to-end', () => {
  it('loads 31 agents across Earth/Moon/Mars with hero', () => {
    const scenario = loadExampleScenario('solar-missions');
    expect(scenario.agents).toHaveLength(31);
    expect(scenario.sim.fidelity).toBe(0);

    const agents = scenarioToAgents(scenario);
    expect(agents).toHaveLength(31);
    expect(agents.every((a) => a.centralBody)).toBe(true);
    expect(agents.filter((a) => a.centralBody === 'moon')).toHaveLength(10);
    expect(agents.filter((a) => a.centralBody === 'mars')).toHaveLength(10);
    expect(agents.find((a) => a.id === SOLAR_MISSIONS_HERO_ID)?.visualRole).toBe(
      'hero'
    );
  });

  it('propagates mixed-body fleet without throwing', () => {
    const agents = scenarioToAgents(loadExampleScenario('solar-missions'));
    const before = agents.map((a) => [...a.state.position] as [number, number, number]);
    const { agents: next } = stepAgents(agents, [], 10, 10, 2);
    expect(next).toHaveLength(31);
    // Positions should advance (Kepler even when fidelity forced to 2 for Moon/Mars)
    let moved = 0;
    for (let i = 0; i < next.length; i++) {
      const d = Math.hypot(
        next[i]!.state.position[0] - before[i]![0],
        next[i]!.state.position[1] - before[i]![1],
        next[i]!.state.position[2] - before[i]![2]
      );
      if (d > 1) moved += 1;
    }
    expect(moved).toBeGreaterThan(20);
  });

  it('Earth-only demo still loads without multi-body fields', () => {
    const demo = loadExampleScenario('demo');
    const agents = scenarioToAgents(demo);
    expect(agents.length).toBeGreaterThan(0);
    expect(agents.every((a) => a.centralBody === 'earth')).toBe(true);
    expect(agents.every((a) => a.visualRole === 'constellation')).toBe(true);
  });
});
