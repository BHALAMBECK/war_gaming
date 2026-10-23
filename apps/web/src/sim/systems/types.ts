/**
 * Onboard satellite systems for the sandbox (sensors + abstract LOS lasers).
 */

export interface CameraSystem {
  /** Field of view half-angle in degrees */
  fovDeg: number;
  /** Max useful imaging range in meters */
  rangeM: number;
  /** Whether the sensor is powered */
  active: boolean;
}

export interface LaserSystem {
  /** Max engagement range in meters */
  rangeM: number;
  /** Abstract power rating (kW) — sandbox only */
  powerKw: number;
  /** Cooldown between shots in seconds */
  cooldownS: number;
  /** Sim time of last fire attempt */
  lastFiredAt: number;
}

export interface AgentSystems {
  camera: CameraSystem;
  laser: LaserSystem;
  hp: number;
  maxHp: number;
}

export const DEFAULT_CAMERA: CameraSystem = {
  fovDeg: 25,
  rangeM: 500e3,
  active: true,
};

export const DEFAULT_LASER: LaserSystem = {
  rangeM: 200e3,
  powerKw: 50,
  cooldownS: 5,
  lastFiredAt: -Infinity,
};

export function createDefaultSystems(team: 'friendly' | 'enemy'): AgentSystems {
  return {
    camera: { ...DEFAULT_CAMERA },
    laser: {
      ...DEFAULT_LASER,
      // Enemy lasers slightly shorter range for asymmetry
      rangeM: team === 'enemy' ? 150e3 : 200e3,
    },
    hp: 100,
    maxHp: 100,
  };
}
