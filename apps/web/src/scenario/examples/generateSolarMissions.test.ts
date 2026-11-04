import { describe, it, expect } from 'vitest';
import {
  expandSolarMissionsScenario,
  generateSolarMissionsAgents,
  SOLAR_MISSIONS_EARTH_COUNT,
  SOLAR_MISSIONS_MOON_COUNT,
  SOLAR_MISSIONS_MARS_COUNT,
  SOLAR_MISSIONS_HERO_ID,
} from './generateSolarMissions';
import { EARTH_RADIUS, EARTH_MU } from '@/sim/orbit/constants';

describe('generateSolarMissions', () => {
  it('creates 10 Earth + 10 Moon + 10 Mars + 1 hero', () => {
    const agents = generateSolarMissionsAgents();
    expect(agents).toHaveLength(
      SOLAR_MISSIONS_EARTH_COUNT +
        SOLAR_MISSIONS_MOON_COUNT +
        SOLAR_MISSIONS_MARS_COUNT +
        1
    );
    expect(agents.filter((a) => a.centralBody === 'earth')).toHaveLength(
      SOLAR_MISSIONS_EARTH_COUNT + 1
    );
    expect(agents.filter((a) => a.centralBody === 'moon')).toHaveLength(
      SOLAR_MISSIONS_MOON_COUNT
    );
    expect(agents.filter((a) => a.centralBody === 'mars')).toHaveLength(
      SOLAR_MISSIONS_MARS_COUNT
    );
    const hero = agents.find((a) => a.id === SOLAR_MISSIONS_HERO_ID);
    expect(hero?.visualRole).toBe('hero');
    expect(hero?.centralBody).toBe('earth');
  });

  it('expands stub with Kepler fidelity', () => {
    const expanded = expandSolarMissionsScenario({
      name: 'Solar Missions',
      description: '',
      version: '1.0.0',
      earth: { radius: EARTH_RADIUS, mu: EARTH_MU },
      agents: [],
      sim: { timeStep: 1, fidelity: 2 },
      seed: 'test',
    });
    expect(expanded.agents.length).toBe(31);
    expect(expanded.sim.fidelity).toBe(0);
  });
});
