/**
 * Approximate heliocentric Keplerian elements for visualization (J2000-ish).
 * Sandbox entertainment fidelity — not ephemeris-grade.
 */

import { AU, SUN_MU } from '@/sim/orbit/constants';

export interface PlanetDef {
  id: string;
  name: string;
  /** Semi-major axis in AU */
  aAu: number;
  e: number;
  /** Inclination degrees */
  iDeg: number;
  /** Longitude of ascending node degrees */
  lanDeg: number;
  /** Argument of perihelion degrees */
  periDeg: number;
  /** Mean anomaly at epoch degrees */
  m0Deg: number;
  /** Display radius (scene units, exaggerated) */
  displayRadius: number;
  color: string;
  emissive?: string;
}

export const PLANETS: PlanetDef[] = [
  {
    id: 'mercury',
    name: 'Mercury',
    aAu: 0.387,
    e: 0.206,
    iDeg: 7.0,
    lanDeg: 48.3,
    periDeg: 29.1,
    m0Deg: 174.8,
    displayRadius: 0.012,
    color: '#a0a0a0',
  },
  {
    id: 'venus',
    name: 'Venus',
    aAu: 0.723,
    e: 0.007,
    iDeg: 3.4,
    lanDeg: 76.7,
    periDeg: 54.9,
    m0Deg: 50.4,
    displayRadius: 0.018,
    color: '#e8cda0',
  },
  {
    id: 'earth',
    name: 'Earth',
    aAu: 1.0,
    e: 0.017,
    iDeg: 0.0,
    lanDeg: 0,
    periDeg: 102.9,
    m0Deg: 100.5,
    displayRadius: 0.02,
    color: '#3a7bd5',
  },
  {
    id: 'mars',
    name: 'Mars',
    aAu: 1.524,
    e: 0.093,
    iDeg: 1.9,
    lanDeg: 49.6,
    periDeg: 286.5,
    m0Deg: 19.4,
    displayRadius: 0.014,
    color: '#c1440e',
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    aAu: 5.203,
    e: 0.048,
    iDeg: 1.3,
    lanDeg: 100.5,
    periDeg: 273.9,
    m0Deg: 20.0,
    displayRadius: 0.06,
    color: '#c9a36a',
  },
  {
    id: 'saturn',
    name: 'Saturn',
    aAu: 9.537,
    e: 0.054,
    iDeg: 2.5,
    lanDeg: 113.7,
    periDeg: 339.4,
    m0Deg: 317.0,
    displayRadius: 0.05,
    color: '#e6d5a8',
  },
  {
    id: 'uranus',
    name: 'Uranus',
    aAu: 19.191,
    e: 0.047,
    iDeg: 0.8,
    lanDeg: 74.0,
    periDeg: 96.5,
    m0Deg: 142.2,
    displayRadius: 0.035,
    color: '#7fdbda',
  },
  {
    id: 'neptune',
    name: 'Neptune',
    aAu: 30.069,
    e: 0.009,
    iDeg: 1.8,
    lanDeg: 131.8,
    periDeg: 273.2,
    m0Deg: 256.2,
    displayRadius: 0.034,
    color: '#4169e1',
  },
];

function deg2rad(d: number): number {
  return (d * Math.PI) / 180;
}

function normalizeAngle(a: number): number {
  a = a % (2 * Math.PI);
  if (a < 0) a += 2 * Math.PI;
  return a;
}

function solveKepler(M: number, e: number): number {
  let E = M;
  for (let i = 0; i < 12; i++) {
    E = M + e * Math.sin(E);
  }
  return E;
}

/**
 * Heliocentric position in scene units (1 unit = 1 AU) at simTime seconds from epoch.
 */
export function planetPositionAu(
  planet: PlanetDef,
  simTimeS: number
): [number, number, number] {
  const a = planet.aAu * AU;
  const n = Math.sqrt(SUN_MU / (a * a * a));
  const M = normalizeAngle(deg2rad(planet.m0Deg) + n * simTimeS);
  const E = solveKepler(M, planet.e);
  const cosE = Math.cos(E);
  const sinE = Math.sin(E);
  const xOrb = a * (cosE - planet.e);
  const yOrb = a * Math.sqrt(1 - planet.e * planet.e) * sinE;

  const i = deg2rad(planet.iDeg);
  const Ω = deg2rad(planet.lanDeg);
  const ω = deg2rad(planet.periDeg);

  const cosΩ = Math.cos(Ω);
  const sinΩ = Math.sin(Ω);
  const cosω = Math.cos(ω);
  const sinω = Math.sin(ω);
  const cosi = Math.cos(i);
  const sini = Math.sin(i);

  const x =
    (cosΩ * cosω - sinΩ * sinω * cosi) * xOrb +
    (-cosΩ * sinω - sinΩ * cosω * cosi) * yOrb;
  const y =
    (sinΩ * cosω + cosΩ * sinω * cosi) * xOrb +
    (-sinΩ * sinω + cosΩ * cosω * cosi) * yOrb;
  const z = sinω * sini * xOrb + cosω * sini * yOrb;

  return [x / AU, y / AU, z / AU];
}

/** Sample an orbit ellipse in AU for a line loop. */
export function sampleOrbitAu(planet: PlanetDef, samples = 128): Float32Array {
  const pts = new Float32Array(samples * 3);
  const period =
    (2 * Math.PI) / Math.sqrt(SUN_MU / (planet.aAu * AU) ** 3);
  for (let i = 0; i < samples; i++) {
    const t = (i / samples) * period;
    const [x, y, z] = planetPositionAu(planet, t);
    pts[i * 3] = x;
    pts[i * 3 + 1] = y;
    pts[i * 3 + 2] = z;
  }
  return pts;
}
