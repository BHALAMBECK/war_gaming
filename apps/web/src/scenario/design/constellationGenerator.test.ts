import { describe, it, expect } from 'vitest';
import {
  DEFAULT_CONSTELLATION_DRAFT,
  constellationAgentCount,
  generateConstellationAgents,
} from './constellationGenerator';
import { FormationType } from '@/scenario/types';
import { EARTH_RADIUS } from '@/sim/orbit/constants';
import { validateScenario } from '@/scenario/schema';
import { EARTH_MU } from '@/sim/orbit/constants';

describe('constellationGenerator', () => {
  it('builds a ring with evenly spaced true anomalies', () => {
    const agents = generateConstellationAgents({
      ...DEFAULT_CONSTELLATION_DRAFT,
      pattern: 'ring',
      count: 8,
      altitudeM: 400e3,
      eccentricity: 0,
    });
    expect(agents).toHaveLength(8);
    expect(constellationAgentCount({ ...DEFAULT_CONSTELLATION_DRAFT, pattern: 'ring', count: 8 })).toBe(8);

    const nus = agents.map((a) => {
      const o = a.orbit as { ν?: number; a: number };
      return o.ν ?? -1;
    });
    expect(nus[0]).toBeCloseTo(0, 10);
    expect(nus[1]).toBeCloseTo(Math.PI / 4, 10);
    expect(nus[4]).toBeCloseTo(Math.PI, 10);

    const a = (agents[0]!.orbit as { a: number }).a;
    expect(a).toBeCloseTo(EARTH_RADIUS + 400e3, 3);
  });

  it('builds a walker delta with planes × satsPerPlane agents', () => {
    const agents = generateConstellationAgents({
      ...DEFAULT_CONSTELLATION_DRAFT,
      pattern: 'walker',
      planes: 3,
      satsPerPlane: 4,
      phaseFactor: 1,
      inclinationRad: 0.9,
    });
    expect(agents).toHaveLength(12);
    expect(
      constellationAgentCount({
        ...DEFAULT_CONSTELLATION_DRAFT,
        pattern: 'walker',
        planes: 3,
        satsPerPlane: 4,
      })
    ).toBe(12);

    const raans = new Set(
      agents.map((a) => (a.orbit as { Ω: number }).Ω.toFixed(8))
    );
    expect(raans.size).toBe(3);
  });

  it('is deterministic for shell pattern given the same seed', () => {
    const draft = {
      ...DEFAULT_CONSTELLATION_DRAFT,
      pattern: 'shell' as const,
      count: 20,
      seed: 'shell-test',
      shellSpreadM: 50e3,
    };
    const a = generateConstellationAgents(draft);
    const b = generateConstellationAgents(draft);
    expect(a).toEqual(b);
    expect(a).toHaveLength(20);
  });

  it('assigns teams according to teamMode', () => {
    const alternate = generateConstellationAgents({
      ...DEFAULT_CONSTELLATION_DRAFT,
      count: 4,
      teamMode: 'alternate',
    });
    expect(alternate.map((x) => x.team)).toEqual([
      'friendly',
      'enemy',
      'friendly',
      'enemy',
    ]);

    const split = generateConstellationAgents({
      ...DEFAULT_CONSTELLATION_DRAFT,
      count: 4,
      teamMode: 'split',
    });
    expect(split.filter((x) => x.team === 'friendly')).toHaveLength(2);
    expect(split.filter((x) => x.team === 'enemy')).toHaveLength(2);
  });

  it('produces agents that pass scenario validation', () => {
    const agents = generateConstellationAgents({
      ...DEFAULT_CONSTELLATION_DRAFT,
      pattern: 'walker',
      planes: 2,
      satsPerPlane: 5,
      behaviors: {
        cohesion: true,
        separation: true,
        alignment: false,
        formation: FormationType.LATTICE,
      },
    });
    const scenario = validateScenario({
      name: 'Const Test',
      description: 'test',
      version: '1.0.0',
      earth: { radius: EARTH_RADIUS, mu: EARTH_MU },
      agents,
      sim: { timeStep: 1, fidelity: 0 },
      seed: 'const-val',
    });
    expect(scenario.agents).toHaveLength(10);
  });
});
