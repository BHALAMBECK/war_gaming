/**
 * Procedural constellation layouts that emit AgentScenario[] for the scenario schema.
 */

import seedrandom from 'seedrandom';
import { EARTH_RADIUS } from '@/sim/orbit/constants';
import {
  FormationType,
  type AgentScenario,
  type BehaviorFlags,
  type Team,
} from '@/scenario/types';

export type ConstellationPattern = 'ring' | 'walker' | 'shell';

export type TeamMode = 'all-friendly' | 'all-enemy' | 'split' | 'alternate';

export interface ConstellationDraft {
  /** Stable id prefix, e.g. "const" → const-0 */
  idPrefix: string;
  pattern: ConstellationPattern;
  /** Total sats for ring/shell; for walker ignored if planes*satsPerPlane set */
  count: number;
  /** Altitude above Earth surface (meters) */
  altitudeM: number;
  /** Inclination (radians) */
  inclinationRad: number;
  eccentricity: number;
  /** Walker: number of orbital planes */
  planes: number;
  /** Walker: sats per plane */
  satsPerPlane: number;
  /** Walker relative phasing factor F (0 … planes-1 typical) */
  phaseFactor: number;
  /** Shell: altitude band half-width (meters) around altitudeM */
  shellSpreadM: number;
  teamMode: TeamMode;
  behaviors: BehaviorFlags;
  dvRemaining: number;
  seed: string;
}

export const DEFAULT_CONSTELLATION_DRAFT: ConstellationDraft = {
  idPrefix: 'sat',
  pattern: 'ring',
  count: 24,
  altitudeM: 550e3,
  inclinationRad: Math.PI / 4,
  eccentricity: 0,
  planes: 4,
  satsPerPlane: 6,
  phaseFactor: 1,
  shellSpreadM: 100e3,
  teamMode: 'all-friendly',
  behaviors: {
    cohesion: true,
    separation: true,
    alignment: true,
    formation: FormationType.RING,
  },
  dvRemaining: 1000,
  seed: 'constellation-default',
};

function clampAngle(a: number, max: number): number {
  let x = a % max;
  if (x < 0) x += max;
  return x;
}

function resolveTeam(mode: TeamMode, index: number, total: number): Team {
  switch (mode) {
    case 'all-enemy':
      return 'enemy';
    case 'split':
      return index < Math.ceil(total / 2) ? 'friendly' : 'enemy';
    case 'alternate':
      return index % 2 === 0 ? 'friendly' : 'enemy';
    case 'all-friendly':
    default:
      return 'friendly';
  }
}

function agentFromElements(
  id: string,
  a: number,
  e: number,
  i: number,
  Ω: number,
  ω: number,
  ν: number,
  draft: ConstellationDraft,
  index: number,
  total: number
): AgentScenario {
  return {
    id,
    orbit: {
      a,
      e: Math.min(1, Math.max(0, e)),
      i: Math.min(Math.PI, Math.max(0, i)),
      Ω: clampAngle(Ω, 2 * Math.PI),
      ω: clampAngle(ω, 2 * Math.PI),
      ν: clampAngle(ν, 2 * Math.PI),
    },
    behaviors: { ...draft.behaviors },
    team: resolveTeam(draft.teamMode, index, total),
    dvRemaining: draft.dvRemaining,
  };
}

function generateRing(draft: ConstellationDraft): AgentScenario[] {
  const n = Math.max(1, Math.floor(draft.count));
  const a = EARTH_RADIUS + draft.altitudeM;
  const agents: AgentScenario[] = [];
  for (let i = 0; i < n; i++) {
    const ν = (2 * Math.PI * i) / n;
    agents.push(
      agentFromElements(
        `${draft.idPrefix}-${i}`,
        a,
        draft.eccentricity,
        draft.inclinationRad,
        0,
        0,
        ν,
        draft,
        i,
        n
      )
    );
  }
  return agents;
}

/**
 * Walker-delta style: t planes × s sats, RAAN spaced 2π/t, in-plane anomaly
 * spaced 2π/s with relative plane phase F * 2π / (t*s).
 */
function generateWalker(draft: ConstellationDraft): AgentScenario[] {
  const t = Math.max(1, Math.floor(draft.planes));
  const s = Math.max(1, Math.floor(draft.satsPerPlane));
  const total = t * s;
  const a = EARTH_RADIUS + draft.altitudeM;
  const F = Math.max(0, Math.floor(draft.phaseFactor));
  const agents: AgentScenario[] = [];
  let index = 0;
  for (let p = 0; p < t; p++) {
    const Ω = (2 * Math.PI * p) / t;
    const planePhase = (F * p * 2 * Math.PI) / total;
    for (let j = 0; j < s; j++) {
      const ν = (2 * Math.PI * j) / s + planePhase;
      agents.push(
        agentFromElements(
          `${draft.idPrefix}-${index}`,
          a,
          draft.eccentricity,
          draft.inclinationRad,
          Ω,
          0,
          ν,
          draft,
          index,
          total
        )
      );
      index += 1;
    }
  }
  return agents;
}

function generateShell(draft: ConstellationDraft): AgentScenario[] {
  const n = Math.max(1, Math.floor(draft.count));
  const rng = seedrandom(draft.seed);
  const agents: AgentScenario[] = [];
  for (let i = 0; i < n; i++) {
    const alt =
      draft.altitudeM + (rng() * 2 - 1) * Math.max(0, draft.shellSpreadM);
    const a = EARTH_RADIUS + Math.max(200e3, alt);
    agents.push(
      agentFromElements(
        `${draft.idPrefix}-${i}`,
        a,
        draft.eccentricity * rng(),
        draft.inclinationRad,
        rng() * 2 * Math.PI,
        rng() * 2 * Math.PI,
        rng() * 2 * Math.PI,
        draft,
        i,
        n
      )
    );
  }
  return agents;
}

export function constellationAgentCount(draft: ConstellationDraft): number {
  if (draft.pattern === 'walker') {
    return (
      Math.max(1, Math.floor(draft.planes)) *
      Math.max(1, Math.floor(draft.satsPerPlane))
    );
  }
  return Math.max(1, Math.floor(draft.count));
}

/**
 * Generate agents for a constellation draft. Deterministic for the same draft.
 */
export function generateConstellationAgents(
  draft: ConstellationDraft
): AgentScenario[] {
  switch (draft.pattern) {
    case 'walker':
      return generateWalker(draft);
    case 'shell':
      return generateShell(draft);
    case 'ring':
    default:
      return generateRing(draft);
  }
}
