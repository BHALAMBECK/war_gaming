import seedrandom, { PRNG } from 'seedrandom';

let currentRNG: PRNG | null = null;
let currentSeed: string = 'default';

/**
 * Initialize the RNG with a seed.
 * All subsequent random calls will be deterministic based on this seed.
 */
export function setSeed(seed: string): void {
  currentSeed = seed;
  currentRNG = seedrandom(seed);
}

/**
 * Get the current seed.
 */
export function getSeed(): string {
  return currentSeed;
}

/**
 * Get a random number between 0 and 1 (deterministic based on current seed).
 */
export function random(): number {
  if (!currentRNG) {
    setSeed('default');
  }
  return currentRNG!();
}

/**
 * Get a random integer between min (inclusive) and max (exclusive).
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(random() * (max - min)) + min;
}

/**
 * Get a random float between min (inclusive) and max (exclusive).
 */
export function randomFloat(min: number, max: number): number {
  return random() * (max - min) + min;
}

/**
 * Reset RNG to a new seed (useful for testing determinism).
 */
export function resetSeed(seed: string): void {
  setSeed(seed);
}

