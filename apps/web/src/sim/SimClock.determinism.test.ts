import { describe, it, expect, beforeEach } from 'vitest';
import { SimClock } from './SimClock';
import { setSeed, random } from '@/util/seed';
import { testDeterminism, compareSimulationResults } from '@/test/helpers';

describe('SimClock determinism', () => {
  beforeEach(() => {
    setSeed('test-seed');
  });

  describe('same seed + same scenario = identical simulation run', () => {
    it('produces identical time progression with same seed and same updates', () => {
      const runSimulation = () => {
        const clock = new SimClock({ seed: 'deterministic-test', simTime: 0 });
        clock.play();
        // Simulate 10 frames at 60fps (0.016s each)
        for (let i = 0; i < 10; i++) {
          clock.update(0.016);
        }
        return clock.getTime();
      };

      const results = testDeterminism(runSimulation, 3);
      // All runs should produce identical results
      expect(results[0]).toBe(results[1]);
      expect(results[1]).toBe(results[2]);
    });

    it('produces identical results with same seed after reset', () => {
      const seed = 'reset-test-seed';
      
      // First run
      const clock1 = new SimClock({ seed, simTime: 0 });
      clock1.play();
      for (let i = 0; i < 5; i++) {
        clock1.update(0.016);
      }
      const time1 = clock1.getTime();

      // Reset and run again
      const clock2 = new SimClock({ seed, simTime: 0 });
      clock2.play();
      for (let i = 0; i < 5; i++) {
        clock2.update(0.016);
      }
      const time2 = clock2.getTime();

      expect(time1).toBe(time2);
    });

    it('produces identical results with same seed and same time scale', () => {
      const seed = 'timescale-test';
      const timeScale = 2.5;

      const runSim = () => {
        const clock = new SimClock({ seed, timeScale, simTime: 0 });
        clock.play();
        clock.update(0.016);
        clock.update(0.016);
        return clock.getTime();
      };

      const results = testDeterminism(runSim, 2);
      expect(results[0]).toBe(results[1]);
    });
  });

  describe('reset + play with same seed produces identical results', () => {
    it('reset and replay produces same sequence', () => {
      const seed = 'reset-replay-test';
      const clock = new SimClock({ seed, simTime: 0 });
      
      // First playthrough
      clock.play();
      const times1: number[] = [];
      for (let i = 0; i < 5; i++) {
        clock.update(0.016);
        times1.push(clock.getTime());
      }

      // Reset and replay
      clock.reset();
      clock.play();
      const times2: number[] = [];
      for (let i = 0; i < 5; i++) {
        clock.update(0.016);
        times2.push(clock.getTime());
      }

      expect(times1).toEqual(times2);
    });

    it('reset maintains seed for determinism', () => {
      const seed = 'reset-seed-test';
      const clock = new SimClock({ seed, simTime: 0 });
      
      clock.play();
      clock.update(0.016);
      const timeBeforeReset = clock.getTime();

      clock.reset();
      expect(clock.getSeed()).toBe(seed);
      
      clock.play();
      clock.update(0.016);
      const timeAfterReset = clock.getTime();

      // Should be the same because same seed, same update
      expect(timeAfterReset).toBe(timeBeforeReset);
    });
  });

  describe('sim clock independent of render FPS', () => {
    it('produces same final time with different frame deltas (same total time)', () => {
      const seed = 'fps-independence-test';
      
      // Simulate 60fps: 60 frames at 0.016s each = 0.96s total
      const clock60fps = new SimClock({ seed, simTime: 0, timeScale: 1.0 });
      clock60fps.play();
      for (let i = 0; i < 60; i++) {
        clock60fps.update(0.016);
      }
      const time60fps = clock60fps.getTime();

      // Simulate 30fps: 30 frames at 0.032s each = 0.96s total
      const clock30fps = new SimClock({ seed, simTime: 0, timeScale: 1.0 });
      clock30fps.play();
      for (let i = 0; i < 30; i++) {
        clock30fps.update(0.032);
      }
      const time30fps = clock30fps.getTime();

      // Should be approximately the same (within floating point precision)
      expect(time60fps).toBeCloseTo(time30fps, 5);
    });

    it('produces same final time with variable frame deltas (same total time)', () => {
      const seed = 'variable-fps-test';
      const totalTime = 1.0; // 1 second total
      
      // Constant frame rate
      const clockConstant = new SimClock({ seed, simTime: 0 });
      clockConstant.play();
      for (let i = 0; i < 60; i++) {
        clockConstant.update(1.0 / 60);
      }

      // Variable frame rate (but same total)
      const clockVariable = new SimClock({ seed, simTime: 0 });
      clockVariable.play();
      const variableDeltas = [
        0.02, 0.015, 0.018, 0.012, 0.02, 0.015, // First 6 frames
        ...Array(54).fill(1.0 / 60), // Rest at constant rate
      ];
      let variableTotal = 0;
      for (const delta of variableDeltas) {
        clockVariable.update(delta);
        variableTotal += delta;
      }

      // Both should reach approximately the same time
      expect(clockConstant.getTime()).toBeCloseTo(clockVariable.getTime(), 5);
    });

    it('time scale affects result regardless of frame rate', () => {
      const seed = 'timescale-fps-test';
      
      // 60fps at 2x time scale
      const clock1 = new SimClock({ seed, simTime: 0, timeScale: 2.0 });
      clock1.play();
      for (let i = 0; i < 60; i++) {
        clock1.update(0.016);
      }

      // 30fps at 2x time scale (should get same result)
      const clock2 = new SimClock({ seed, simTime: 0, timeScale: 2.0 });
      clock2.play();
      for (let i = 0; i < 30; i++) {
        clock2.update(0.032);
      }

      expect(clock1.getTime()).toBeCloseTo(clock2.getTime(), 5);
    });
  });

  describe('determinism with RNG usage', () => {
    it('same seed produces same RNG sequence even with clock updates', () => {
      const seed = 'rng-clock-test';
      
      const runWithRNG = () => {
        const clock = new SimClock({ seed, simTime: 0 });
        clock.play();
        const rngValues: number[] = [];
        for (let i = 0; i < 5; i++) {
          clock.update(0.016);
          rngValues.push(random()); // Use RNG during simulation
        }
        return { time: clock.getTime(), rngValues };
      };

      const result1 = runWithRNG();
      const result2 = runWithRNG();

      expect(result1.time).toBe(result2.time);
      expect(result1.rngValues).toEqual(result2.rngValues);
    });
  });

  describe('edge cases for determinism', () => {
    it('handles pause/resume deterministically', () => {
      const seed = 'pause-resume-test';
      
      const run1 = () => {
        const clock = new SimClock({ seed, simTime: 0 });
        clock.play();
        clock.update(0.016);
        clock.pause();
        clock.update(0.016); // Should not advance
        clock.play();
        clock.update(0.016);
        return clock.getTime();
      };

      const run2 = () => {
        const clock = new SimClock({ seed, simTime: 0 });
        clock.play();
        clock.update(0.016);
        clock.pause();
        clock.update(0.016); // Should not advance
        clock.play();
        clock.update(0.016);
        return clock.getTime();
      };

      expect(run1()).toBe(run2());
    });

    it('handles time scale changes deterministically', () => {
      const seed = 'timescale-change-test';
      
      const run = () => {
        const clock = new SimClock({ seed, simTime: 0, timeScale: 1.0 });
        clock.play();
        clock.update(0.016);
        clock.setTimeScale(2.0);
        clock.update(0.016);
        clock.setTimeScale(0.5);
        clock.update(0.016);
        return clock.getTime();
      };

      const results = testDeterminism(run, 2);
      expect(results[0]).toBe(results[1]);
    });
  });
});

