/**
 * Conversion functions between orbital elements and Cartesian state.
 * All calculations use ECI (Earth-Centered Inertial) coordinate system:
 * - X-axis: Vernal equinox direction
 * - Z-axis: North pole
 * - Y-axis: Completes right-handed system
 */

import { OrbitalElements, CartesianState } from './types';
import { EARTH_MU } from './constants';

/**
 * Convert orbital elements to Cartesian state.
 * @param elements Orbital elements (must have either ν or M)
 * @returns Cartesian state in ECI frame
 */
export function elementsToCartesian(elements: OrbitalElements): CartesianState {
  const { a, e, i, Ω, ω } = elements;

  // Determine true anomaly
  let ν: number;
  if (elements.ν !== undefined) {
    ν = elements.ν;
  } else if (elements.M !== undefined) {
    // Convert mean anomaly to true anomaly via eccentric anomaly
    const E = solveKeplerEquation(elements.M, e);
    ν = trueAnomalyFromEccentric(E, e);
  } else {
    throw new Error('Orbital elements must have either ν (true anomaly) or M (mean anomaly)');
  }

  // Semi-latus rectum
  const p = a * (1 - e * e);

  // Distance from center
  const r = p / (1 + e * Math.cos(ν));

  // Position in perifocal frame (PQW frame)
  const rPerifocal: [number, number, number] = [
    r * Math.cos(ν),
    r * Math.sin(ν),
    0,
  ];

  // Velocity in perifocal frame
  const h = Math.sqrt(EARTH_MU * p); // Specific angular momentum
  // For circular orbits (e=0), the formula simplifies correctly
  // vPerifocal = [-(μ/h)sin(ν), (μ/h)(e+cos(ν)), 0]
  // When e=0: [-(μ/h)sin(ν), (μ/h)cos(ν), 0]
  const vPerifocal: [number, number, number] = [
    -(EARTH_MU / h) * Math.sin(ν),
    (EARTH_MU / h) * (e + Math.cos(ν)),
    0,
  ];

  // Rotation matrices for transformation from perifocal to ECI
  // Standard 3-1-3 Euler rotation: R = R_z(Ω) * R_x(i) * R_z(ω)
  // Note: We use the standard aerospace convention
  const cosΩ = Math.cos(Ω);
  const sinΩ = Math.sin(Ω);
  const cosi = Math.cos(i);
  const sini = Math.sin(i);
  const cosω = Math.cos(ω);
  const sinω = Math.sin(ω);

  // Combined rotation matrix (perifocal to ECI)
  // R = R_z(Ω) * R_x(i) * R_z(ω)
  const R11 = cosΩ * cosω - sinΩ * cosi * sinω;
  const R12 = -cosΩ * sinω - sinΩ * cosi * cosω;
  const R13 = sinΩ * sini;
  const R21 = sinΩ * cosω + cosΩ * cosi * sinω;
  const R22 = -sinΩ * sinω + cosΩ * cosi * cosω;
  const R23 = -cosΩ * sini;
  const R31 = sini * sinω;
  const R32 = sini * cosω;
  const R33 = cosi;

  // Transform position and velocity to ECI
  const position: [number, number, number] = [
    R11 * rPerifocal[0] + R12 * rPerifocal[1] + R13 * rPerifocal[2],
    R21 * rPerifocal[0] + R22 * rPerifocal[1] + R23 * rPerifocal[2],
    R31 * rPerifocal[0] + R32 * rPerifocal[1] + R33 * rPerifocal[2],
  ];

  const velocity: [number, number, number] = [
    R11 * vPerifocal[0] + R12 * vPerifocal[1] + R13 * vPerifocal[2],
    R21 * vPerifocal[0] + R22 * vPerifocal[1] + R23 * vPerifocal[2],
    R31 * vPerifocal[0] + R32 * vPerifocal[1] + R33 * vPerifocal[2],
  ];

  return { position, velocity };
}

/**
 * Convert Cartesian state to orbital elements.
 * @param state Cartesian state in ECI frame
 * @returns Orbital elements (with true anomaly ν)
 */
export function cartesianToElements(state: CartesianState): OrbitalElements {
  const [x, y, z] = state.position;
  const [vx, vy, vz] = state.velocity;

  // Position and velocity magnitudes
  const r = Math.sqrt(x * x + y * y + z * z);
  const v = Math.sqrt(vx * vx + vy * vy + vz * vz);

  // Specific angular momentum vector
  const hx = y * vz - z * vy;
  const hy = z * vx - x * vz;
  const hz = x * vy - y * vx;
  const h = Math.sqrt(hx * hx + hy * hy + hz * hz);

  // Specific energy (vis-viva energy)
  const energy = (v * v) / 2 - EARTH_MU / r;

  // Semi-major axis from vis-viva equation: v² = μ(2/r - 1/a)
  // Rearranging: 1/a = 2/r - v²/μ, so a = 1/(2/r - v²/μ)
  // This works for all orbit types (elliptical, circular, parabolic, hyperbolic)
  // For elliptical: energy < 0, so a > 0
  // For circular: energy = -μ/(2r), so a = r
  let a = 1 / (2 / r - (v * v) / EARTH_MU);
  
  // If result is negative or very large, it might be hyperbolic (energy > 0)
  // For our purposes (satellites), we expect elliptical orbits, so a should be positive
  if (a < 0 || !isFinite(a)) {
    // Fallback to energy formula for elliptical orbits
    if (energy < 0) {
      a = -EARTH_MU / (2 * energy);
    } else {
      throw new Error('Invalid orbit: hyperbolic orbit detected (energy > 0)');
    }
  }

  // Eccentricity vector
  const v2 = v * v;
  const rv = x * vx + y * vy + z * vz;
  const ex = (1 / EARTH_MU) * ((v2 - EARTH_MU / r) * x - rv * vx);
  const ey = (1 / EARTH_MU) * ((v2 - EARTH_MU / r) * y - rv * vy);
  const ez = (1 / EARTH_MU) * ((v2 - EARTH_MU / r) * z - rv * vz);
  const e = Math.sqrt(ex * ex + ey * ey + ez * ez);

  // Inclination
  // Handle edge case where h is very small (shouldn't happen for valid orbits)
  if (h < 1e-10) {
    throw new Error('Invalid orbit: angular momentum is too small');
  }
  const cosI = hz / h;
  const i = Math.acos(Math.max(-1, Math.min(1, cosI)));

  // Right ascension of ascending node
  const nx = -hy;
  const ny = hx;
  const n = Math.sqrt(nx * nx + ny * ny);
  let Ω: number;
  if (n < 1e-10) {
    // Equatorial orbit, Ω is undefined, set to 0
    Ω = 0;
  } else {
    Ω = Math.acos(nx / n);
    if (ny < 0) {
      Ω = 2 * Math.PI - Ω;
    }
  }

  // Argument of periapsis
  const eDotN = ex * nx + ey * ny;
  let ω: number;
  if (n < 1e-10 || e < 1e-10) {
    // Circular or equatorial orbit, ω is undefined, set to 0
    ω = 0;
  } else {
    ω = Math.acos(eDotN / (e * n));
    if (ez < 0) {
      ω = 2 * Math.PI - ω;
    }
  }

  // True anomaly
  const rDotE = x * ex + y * ey + z * ez;
  let ν: number;
  if (e < 1e-10) {
    // Circular orbit, use argument of latitude
    // For circular orbits, we need to define a reference direction
    // Use the node vector if available, otherwise use x-axis
    if (n > 1e-10) {
      const rDotN = x * nx + y * ny;
      const cosArgLat = rDotN / (r * n);
      const argLat = Math.acos(Math.max(-1, Math.min(1, cosArgLat)));
      ν = argLat - ω;
      if (z < 0) {
        ν = 2 * Math.PI - ν;
      }
    } else {
      // Equatorial circular orbit, use angle from x-axis
      const angle = Math.atan2(y, x);
      ν = normalizeAngle(angle - ω);
    }
  } else {
    const cosν = rDotE / (r * e);
    const sinν = rv / (r * Math.sqrt(EARTH_MU * a * (1 - e * e)));
    ν = Math.atan2(sinν, cosν);
    if (ν < 0) {
      ν += 2 * Math.PI;
    }
  }

  // Normalize angles to [0, 2π)
  Ω = normalizeAngle(Ω);
  ω = normalizeAngle(ω);
  ν = normalizeAngle(ν);

  return { a, e, i, Ω, ω, ν };
}

/**
 * Solve Kepler's equation: M = E - e*sin(E)
 * Uses Newton-Raphson iteration.
 * @param M Mean anomaly (radians)
 * @param e Eccentricity
 * @returns Eccentric anomaly (radians)
 */
function solveKeplerEquation(M: number, e: number): number {
  // Normalize M to [0, 2π)
  M = normalizeAngle(M);

  // Initial guess: E ≈ M for small e, or use more sophisticated guess
  let E = M;
  if (e > 0.8) {
    // Better initial guess for high eccentricity
    E = Math.PI;
  }

  // Newton-Raphson iteration
  const maxIterations = 50;
  const tolerance = 1e-12;

  for (let i = 0; i < maxIterations; i++) {
    const f = E - e * Math.sin(E) - M;
    const fPrime = 1 - e * Math.cos(E);

    if (Math.abs(f) < tolerance) {
      break;
    }

    // Safeguard against division by zero or very small fPrime values
    // If fPrime is too small, skip this iteration to avoid numerical instability
    if (Math.abs(fPrime) < 1e-10) {
      continue;
    }

    const deltaE = f / fPrime;
    E = E - deltaE;

    // Ensure E remains finite (guard against NaN/Inf)
    if (!isFinite(E)) {
      // Reset to previous value or safe fallback
      E = M; // Fallback to mean anomaly as a safe value
      break;
    }
  }

  return normalizeAngle(E);
}

/**
 * Convert eccentric anomaly to true anomaly.
 * @param E Eccentric anomaly (radians)
 * @param e Eccentricity
 * @returns True anomaly (radians)
 */
function trueAnomalyFromEccentric(E: number, e: number): number {
  const cosE = Math.cos(E);
  const sinE = Math.sin(E);

  const cosν = (cosE - e) / (1 - e * cosE);
  const sinν = (Math.sqrt(1 - e * e) * sinE) / (1 - e * cosE);

  let ν = Math.atan2(sinν, cosν);
  return normalizeAngle(ν);
}

/**
 * Normalize angle to [0, 2π).
 * @param angle Angle in radians
 * @returns Normalized angle
 */
function normalizeAngle(angle: number): number {
  angle = angle % (2 * Math.PI);
  if (angle < 0) {
    angle += 2 * Math.PI;
  }
  return angle;
}

