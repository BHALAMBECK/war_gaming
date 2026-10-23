/**
 * Abstract LOS laser engagement for the sandbox.
 * Entertainment / education only — not a real weapon model.
 */

import { Agent } from '@/render/Agents.types';
import { distanceMeters, hasLineOfSight } from './los';

export interface FireResult {
  hit: boolean;
  reason: string;
  rangeM: number;
  damage: number;
  updatedShooter: Agent;
  updatedTarget: Agent | null;
}

/**
 * Attempt a laser engagement from shooter → target.
 * Requires: armed cooldown clear, range, Earth LOS, opposing team.
 */
export function attemptLaserFire(
  shooter: Agent,
  target: Agent,
  simTime: number
): FireResult {
  const laser = shooter.systems?.laser;
  if (!laser) {
    return {
      hit: false,
      reason: 'No laser system',
      rangeM: 0,
      damage: 0,
      updatedShooter: shooter,
      updatedTarget: null,
    };
  }

  if (simTime - laser.lastFiredAt < laser.cooldownS) {
    return {
      hit: false,
      reason: 'Cooldown',
      rangeM: 0,
      damage: 0,
      updatedShooter: shooter,
      updatedTarget: null,
    };
  }

  if (shooter.team === target.team) {
    return {
      hit: false,
      reason: 'Friendly fire blocked',
      rangeM: 0,
      damage: 0,
      updatedShooter: {
        ...shooter,
        systems: {
          ...shooter.systems!,
          laser: { ...laser, lastFiredAt: simTime },
        },
      },
      updatedTarget: null,
    };
  }

  const rangeM = distanceMeters(shooter.state.position, target.state.position);
  const cooledShooter: Agent = {
    ...shooter,
    systems: {
      ...shooter.systems!,
      laser: { ...laser, lastFiredAt: simTime },
    },
  };

  if (rangeM > laser.rangeM) {
    return {
      hit: false,
      reason: 'Out of range',
      rangeM,
      damage: 0,
      updatedShooter: cooledShooter,
      updatedTarget: null,
    };
  }

  if (!hasLineOfSight(shooter.state.position, target.state.position)) {
    return {
      hit: false,
      reason: 'No LOS (Earth occultation)',
      rangeM,
      damage: 0,
      updatedShooter: cooledShooter,
      updatedTarget: null,
    };
  }

  // Abstract damage scales with power and falls off with range
  const falloff = 1 - rangeM / laser.rangeM;
  const damage = Math.max(5, Math.round(laser.powerKw * 0.4 * falloff));
  const targetSystems = target.systems ?? {
    camera: { fovDeg: 25, rangeM: 500e3, active: true },
    laser: {
      rangeM: 150e3,
      powerKw: 40,
      cooldownS: 5,
      lastFiredAt: -Infinity,
    },
    hp: 100,
    maxHp: 100,
  };
  const newHp = Math.max(0, targetSystems.hp - damage);

  return {
    hit: true,
    reason: 'LOS laser hit',
    rangeM,
    damage,
    updatedShooter: cooledShooter,
    updatedTarget: {
      ...target,
      systems: { ...targetSystems, hp: newHp },
    },
  };
}
