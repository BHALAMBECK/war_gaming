/**
 * Earth physical constants for orbital mechanics calculations.
 * All values in SI units (meters, seconds, m³/s²).
 */

/**
 * Earth's mean radius in meters.
 * Source: WGS84 ellipsoid mean radius
 */
export const EARTH_RADIUS = 6.371e6; // meters

/**
 * Earth's standard gravitational parameter (μ = GM).
 * Units: m³/s²
 * Source: WGS84 value
 */
export const EARTH_MU = 3.986004418e14; // m³/s²

/**
 * Standard gravitational acceleration at Earth's surface.
 * Units: m/s²
 */
export const EARTH_G = 9.80665; // m/s²

