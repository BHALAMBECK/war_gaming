/**
 * Central-body catalog for body-centered Kepler (v1).
 * Hook for full numerical / SPICE ephemeris in a later fidelity tier.
 */

import { EARTH_MU, EARTH_RADIUS } from './constants';
import type { FidelityLevel } from './fidelity';

/** Bodies that can host constellation satellites in v1. */
export type CentralBody = 'earth' | 'moon' | 'mars';

export interface BodyParams {
  id: CentralBody;
  label: string;
  /** Gravitational parameter μ = GM (m³/s²) */
  mu: number;
  /** Mean radius (m) */
  radius: number;
}

/** Moon GM (m³/s²). Source: DE405 / IAU-ish sandbox value. */
export const MOON_MU = 4.9048695e12;

/** Moon mean radius (m). */
export const MOON_RADIUS = 1.7374e6;

/** Mars GM (m³/s²). Source: IAU 2015 approx. */
export const MARS_MU = 4.282837e13;

/** Mars mean volumetric radius (m). */
export const MARS_RADIUS = 3.3895e6;

const BODY_TABLE: Record<CentralBody, BodyParams> = {
  earth: {
    id: 'earth',
    label: 'Earth',
    mu: EARTH_MU,
    radius: EARTH_RADIUS,
  },
  moon: {
    id: 'moon',
    label: 'Moon',
    mu: MOON_MU,
    radius: MOON_RADIUS,
  },
  mars: {
    id: 'mars',
    label: 'Mars',
    mu: MARS_MU,
    radius: MARS_RADIUS,
  },
};

export function getBodyParams(body: CentralBody): BodyParams {
  return BODY_TABLE[body];
}

export function isCentralBody(value: unknown): value is CentralBody {
  return value === 'earth' || value === 'moon' || value === 'mars';
}

/**
 * Non-Earth bodies support Kepler only in v1 (no J2 / RK4 / SGP4).
 * Returns the fidelity that should actually be used for propagation.
 */
export function resolvePropagationFidelity(
  centralBody: CentralBody,
  fidelity: FidelityLevel
): FidelityLevel {
  if (centralBody !== 'earth' && fidelity !== 0) {
    return 0;
  }
  return fidelity;
}

/** One-shot warning when higher fidelity is requested off-Earth. */
let warnedNonEarthFidelity = false;

export function noteNonEarthFidelityRejected(centralBody: CentralBody): void {
  if (centralBody === 'earth' || warnedNonEarthFidelity) return;
  warnedNonEarthFidelity = true;
  console.warn(
    'Moon/Mars: Kepler only in v1 (J2/RK4/numerical disabled for non-Earth).'
  );
}

/** Test helper to reset the one-shot warning flag. */
export function resetNonEarthFidelityWarning(): void {
  warnedNonEarthFidelity = false;
}
