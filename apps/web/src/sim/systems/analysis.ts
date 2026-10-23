/**
 * Lightweight analysis helpers for the mission ops hub.
 */

import { Agent } from '@/render/Agents.types';
import { cartesianToElements } from '@/sim/orbit/conversions';
import { EARTH_RADIUS } from '@/sim/orbit/constants';
import { distanceMeters } from './los';

export interface AgentTelemetry {
  id: string;
  team: string;
  altitudeKm: number;
  speedKms: number;
  inclinationDeg: number;
  dvRemaining: number;
  hp: number;
  maxHp: number;
  laserReady: boolean;
  cameraActive: boolean;
}

export interface NeighborContact {
  id: string;
  team: string;
  rangeKm: number;
}

export function computeTelemetry(agent: Agent, simTime: number): AgentTelemetry {
  const [x, y, z] = agent.state.position;
  const r = Math.sqrt(x * x + y * y + z * z);
  const [vx, vy, vz] = agent.state.velocity;
  const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
  let inclinationDeg = 0;
  try {
    const el = cartesianToElements(agent.state);
    inclinationDeg = (el.i * 180) / Math.PI;
  } catch {
    inclinationDeg = 0;
  }

  const laser = agent.systems?.laser;
  const laserReady = laser
    ? simTime - laser.lastFiredAt >= laser.cooldownS
    : false;

  return {
    id: agent.id,
    team: agent.team,
    altitudeKm: (r - EARTH_RADIUS) / 1000,
    speedKms: speed / 1000,
    inclinationDeg,
    dvRemaining: agent.dvRemaining,
    hp: agent.systems?.hp ?? 100,
    maxHp: agent.systems?.maxHp ?? 100,
    laserReady,
    cameraActive: agent.systems?.camera.active ?? false,
  };
}

export function nearestNeighbors(
  agent: Agent,
  others: Agent[],
  limit = 5
): NeighborContact[] {
  return others
    .filter((o) => o.id !== agent.id)
    .map((o) => ({
      id: o.id,
      team: o.team,
      rangeKm: distanceMeters(agent.state.position, o.state.position) / 1000,
    }))
    .sort((a, b) => a.rangeKm - b.rangeKm)
    .slice(0, limit);
}

export function fleetSummary(agents: Agent[]): {
  total: number;
  friendly: number;
  enemy: number;
  avgHpFriendly: number;
  avgHpEnemy: number;
} {
  const friendly = agents.filter((a) => a.team === 'friendly');
  const enemy = agents.filter((a) => a.team === 'enemy');
  const avg = (list: Agent[]) =>
    list.length === 0
      ? 0
      : list.reduce((s, a) => s + (a.systems?.hp ?? 100), 0) / list.length;

  return {
    total: agents.length,
    friendly: friendly.length,
    enemy: enemy.length,
    avgHpFriendly: avg(friendly),
    avgHpEnemy: avg(enemy),
  };
}
