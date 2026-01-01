/**
 * Type definitions for swarm behavior system.
 */

/**
 * Local frame coordinate system.
 * Used for swarm behaviors relative to a reference orbit.
 */
export interface LocalFrame {
  /** Origin position in ECI frame (formation centroid) */
  origin: [number, number, number];
  /** Radial direction (normalized, points from Earth center to origin) */
  radial: [number, number, number];
  /** Along-track direction (normalized, in orbital plane, prograde) */
  alongTrack: [number, number, number];
  /** Cross-track direction (normalized, perpendicular to orbital plane) */
  crossTrack: [number, number, number];
}

/**
 * State in local frame coordinates.
 */
export interface LocalFrameState {
  /** Position in local frame (meters) */
  position: [number, number, number];
  /** Velocity in local frame (m/s) */
  velocity: [number, number, number];
}

/**
 * Behavior parameters for tuning swarm behaviors.
 */
export interface BehaviorParams {
  /** Cohesion weight (m/s²) */
  cohesionWeight: number;
  /** Separation weight (m/s²) */
  separationWeight: number;
  /** Alignment weight (m/s²) */
  alignmentWeight: number;
  /** Neighbor detection radius (meters) */
  neighborRadius: number;
  /** Minimum separation distance (meters) */
  minSeparation: number;
  /** Formation steering weight */
  formationWeight: number;
}

/**
 * Default behavior parameters.
 */
export const DEFAULT_BEHAVIOR_PARAMS: BehaviorParams = {
  cohesionWeight: 0.1,
  separationWeight: 1.0,
  alignmentWeight: 0.5,
  neighborRadius: 50000, // 50 km
  minSeparation: 1000, // 1 km
  formationWeight: 0.3,
};

/**
 * Velocity adjustment from swarm behaviors.
 * Applied in ECI frame.
 */
export interface VelocityAdjustment {
  /** Velocity delta [vx, vy, vz] in m/s */
  delta: [number, number, number];
}
