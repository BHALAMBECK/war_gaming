/**
 * Type definitions for orbital mechanics.
 * All units are SI: meters (m), seconds (s), meters per second (m/s), radians.
 */

/**
 * Classical orbital elements (Keplerian elements).
 * All angles in radians.
 */
export interface OrbitalElements {
  /** Semi-major axis (meters) */
  a: number;
  /** Eccentricity (dimensionless, 0-1 for elliptical orbits) */
  e: number;
  /** Inclination (radians, 0 to π) */
  i: number;
  /** Right ascension of ascending node (radians, 0 to 2π) */
  Ω: number;
  /** Argument of periapsis (radians, 0 to 2π) */
  ω: number;
  /** True anomaly (radians, 0 to 2π) OR Mean anomaly (radians, 0 to 2π) */
  ν?: number;
  M?: number;
}

/**
 * Cartesian state vector in ECI (Earth-Centered Inertial) frame.
 * Position and velocity in meters and m/s respectively.
 */
export interface CartesianState {
  /** Position vector [x, y, z] in meters */
  position: [number, number, number];
  /** Velocity vector [vx, vy, vz] in m/s */
  velocity: [number, number, number];
}

/**
 * Union type for flexible orbit state input.
 */
export type OrbitState = OrbitalElements | CartesianState;

