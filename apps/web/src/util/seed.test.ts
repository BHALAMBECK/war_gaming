import { describe, it, expect, beforeEach } from 'vitest';
import { setSeed, getSeed, random, randomInt, randomFloat, resetSeed } from './seed';

describe('seed utilities', () => {
  beforeEach(() => {
    // Reset to default seed before each test
    setSeed('default');
  });

  describe('setSeed', () => {
    it('initializes RNG with seed', () => {
      setSeed('test-seed-1');
      const value1 = random();
      expect(typeof value1).toBe('number');
      expect(value1).toBeGreaterThanOrEqual(0);
      expect(value1).toBeLessThan(1);
    });

    it('allows setting different seeds', () => {
      setSeed('seed-a');
      const valueA = random();
      setSeed('seed-b');
      const valueB = random();
      // Different seeds should produce different values (very likely)
      // Note: There's a tiny chance they could be the same, but extremely unlikely
      expect(valueA).not.toBe(valueB);
    });
  });

  describe('getSeed', () => {
    it('returns current seed', () => {
      setSeed('my-seed');
      expect(getSeed()).toBe('my-seed');
    });

    it('returns default seed if not set', () => {
      // After beforeEach, seed should be 'default'
      expect(getSeed()).toBe('default');
    });
  });

  describe('random', () => {
    it('returns deterministic values for same seed', () => {
      setSeed('deterministic-seed');
      const value1 = random();
      const value2 = random();
      const value3 = random();

      // Reset seed and get same sequence
      setSeed('deterministic-seed');
      const value1Again = random();
      const value2Again = random();
      const value3Again = random();

      expect(value1Again).toBe(value1);
      expect(value2Again).toBe(value2);
      expect(value3Again).toBe(value3);
    });

    it('returns different values for different seeds', () => {
      setSeed('seed-1');
      const value1 = random();
      const value2 = random();
      const value3 = random();

      setSeed('seed-2');
      const value1b = random();
      const value2b = random();
      const value3b = random();

      // Sequences should be different
      expect(value1).not.toBe(value1b);
      expect(value2).not.toBe(value2b);
      expect(value3).not.toBe(value3b);
    });

    it('returns values in range [0, 1)', () => {
      setSeed('range-test');
      for (let i = 0; i < 100; i++) {
        const value = random();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });

    it('returns different values on subsequent calls', () => {
      setSeed('sequence-test');
      const values = new Set();
      for (let i = 0; i < 100; i++) {
        const value = random();
        values.add(value);
      }
      // Should have many unique values (not all the same)
      expect(values.size).toBeGreaterThan(50);
    });

    it('initializes with default seed if not set', () => {
      // This tests the fallback in random()
      // We'll test by ensuring it doesn't throw
      expect(() => random()).not.toThrow();
      const value = random();
      expect(typeof value).toBe('number');
    });
  });

  describe('randomInt', () => {
    it('returns integers in range [min, max)', () => {
      setSeed('int-test');
      for (let i = 0; i < 100; i++) {
        const value = randomInt(0, 10);
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(10);
      }
    });

    it('handles different ranges', () => {
      setSeed('int-range-test');
      const value1 = randomInt(10, 20);
      expect(value1).toBeGreaterThanOrEqual(10);
      expect(value1).toBeLessThan(20);

      const value2 = randomInt(-5, 5);
      expect(value2).toBeGreaterThanOrEqual(-5);
      expect(value2).toBeLessThan(5);
    });

    it('returns deterministic values for same seed', () => {
      setSeed('int-deterministic');
      const values1 = Array.from({ length: 10 }, () => randomInt(0, 100));

      setSeed('int-deterministic');
      const values2 = Array.from({ length: 10 }, () => randomInt(0, 100));

      expect(values1).toEqual(values2);
    });

    it('handles single value range', () => {
      setSeed('int-single');
      const value = randomInt(5, 6);
      expect(value).toBe(5);
    });
  });

  describe('randomFloat', () => {
    it('returns floats in range [min, max)', () => {
      setSeed('float-test');
      for (let i = 0; i < 100; i++) {
        const value = randomFloat(0, 10);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(10);
      }
    });

    it('handles different ranges', () => {
      setSeed('float-range-test');
      const value1 = randomFloat(10, 20);
      expect(value1).toBeGreaterThanOrEqual(10);
      expect(value1).toBeLessThan(20);

      const value2 = randomFloat(-5, 5);
      expect(value2).toBeGreaterThanOrEqual(-5);
      expect(value2).toBeLessThan(5);
    });

    it('returns deterministic values for same seed', () => {
      setSeed('float-deterministic');
      const values1 = Array.from({ length: 10 }, () => randomFloat(0, 100));

      setSeed('float-deterministic');
      const values2 = Array.from({ length: 10 }, () => randomFloat(0, 100));

      expect(values1).toEqual(values2);
    });

    it('can return fractional values', () => {
      setSeed('float-fractional');
      const value = randomFloat(0, 1);
      // Should be able to get fractional values
      expect(value % 1).not.toBe(0); // Very likely to be fractional
    });
  });

  describe('resetSeed', () => {
    it('reinitializes RNG with new seed', () => {
      setSeed('original');
      const value1 = random();
      const value2 = random();

      resetSeed('new-seed');
      const value3 = random();
      const value4 = random();

      // New seed should produce different sequence
      expect(value1).not.toBe(value3);

      // Verify it's actually using the new seed
      resetSeed('new-seed');
      const value3Again = random();
      expect(value3Again).toBe(value3);
    });

    it('is equivalent to setSeed', () => {
      resetSeed('test-reset');
      const value1 = random();

      setSeed('test-reset');
      const value2 = random();

      expect(value1).toBe(value2);
    });
  });

  describe('determinism across multiple calls', () => {
    it('produces identical sequences with same seed', () => {
      const seed = 'determinism-test';
      setSeed(seed);
      const sequence1 = Array.from({ length: 20 }, () => random());

      setSeed(seed);
      const sequence2 = Array.from({ length: 20 }, () => random());

      expect(sequence1).toEqual(sequence2);
    });

    it('produces different sequences with different seeds', () => {
      setSeed('seed-a');
      const sequenceA = Array.from({ length: 20 }, () => random());

      setSeed('seed-b');
      const sequenceB = Array.from({ length: 20 }, () => random());

      expect(sequenceA).not.toEqual(sequenceB);
    });
  });
});

