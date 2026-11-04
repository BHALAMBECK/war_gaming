/**
 * Expand the Solar Missions stub into Earth/Moon/Mars constellations + hero.
 */

import type { Scenario, AgentScenario, BehaviorFlags } from '../types';
import { FormationType } from '../types';
import { getBodyParams, type CentralBody } from '@/sim/orbit/bodies';

const IDLE_BEHAVIORS: BehaviorFlags = {
  cohesion: false,
  separation: false,
  alignment: false,
  formation: FormationType.NONE,
};

export const SOLAR_MISSIONS_EARTH_COUNT = 10;
export const SOLAR_MISSIONS_MOON_COUNT = 10;
export const SOLAR_MISSIONS_MARS_COUNT = 10;
export const SOLAR_MISSIONS_HERO_ID = 'HERO-TRANSFER-1';

function circularConstellation(
  body: CentralBody,
  count: number,
  altitudeM: number,
  planes: number,
  idPrefix: string
): AgentScenario[] {
  const { radius } = getBodyParams(body);
  const a = radius + altitudeM;
  const perPlane = Math.ceil(count / planes);
  const agents: AgentScenario[] = [];
  let n = 0;

  for (let p = 0; p < planes && n < count; p++) {
    const Ω = (p / planes) * 2 * Math.PI;
    const i = body === 'earth' ? (p === 0 ? 0.9 : 1.1) : 0.5 + p * 0.15;
    for (let slot = 0; slot < perPlane && n < count; slot++) {
      const ν = (slot / perPlane) * 2 * Math.PI;
      agents.push({
        id: `${idPrefix}-${n}`,
        orbit: { a, e: 0, i, Ω, ω: 0, ν },
        behaviors: IDLE_BEHAVIORS,
        team: 'friendly',
        dvRemaining: 800,
        centralBody: body,
        visualRole: 'constellation',
      });
      n += 1;
    }
  }

  return agents;
}

function createHero(): AgentScenario {
  const earth = getBodyParams('earth');
  // HEO-style elliptical for visual interest (perigee ~500 km, apogee ~GEO-ish)
  const rp = earth.radius + 500e3;
  const ra = earth.radius + 35000e3;
  const a = (rp + ra) / 2;
  const e = (ra - rp) / (ra + rp);
  return {
    id: SOLAR_MISSIONS_HERO_ID,
    orbit: {
      a,
      e,
      i: 0.4,
      Ω: 0.3,
      ω: 1.2,
      ν: 0,
    },
    behaviors: IDLE_BEHAVIORS,
    team: 'friendly',
    dvRemaining: 2000,
    centralBody: 'earth',
    visualRole: 'hero',
  };
}

/**
 * Build the full 30+1 Solar Missions agent set.
 */
export function generateSolarMissionsAgents(): AgentScenario[] {
  return [
    ...circularConstellation(
      'earth',
      SOLAR_MISSIONS_EARTH_COUNT,
      500e3,
      2,
      'EARTH-SAT'
    ),
    ...circularConstellation(
      'moon',
      SOLAR_MISSIONS_MOON_COUNT,
      100e3,
      2,
      'MOON-SAT'
    ),
    ...circularConstellation(
      'mars',
      SOLAR_MISSIONS_MARS_COUNT,
      300e3,
      2,
      'MARS-SAT'
    ),
    createHero(),
  ];
}

/**
 * Expand a Solar Missions stub scenario to the full agent set.
 */
export function expandSolarMissionsScenario(stub: Scenario): Scenario {
  return {
    ...stub,
    name: stub.name || 'Solar Missions',
    description:
      stub.description ||
      'Tri-body constellation: Earth, Moon, and Mars local Kepler fleets plus a hero HEO craft.',
    agents: generateSolarMissionsAgents(),
    sim: {
      ...stub.sim,
      fidelity: 0,
    },
  };
}
