import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSimClockStore } from './simClockStore';
import { SimClock } from '@/sim/SimClock';
import { setSeed } from '@/util/seed';

describe('simClockStore integration', () => {
  beforeEach(() => {
    // Reset store state
    const { result } = renderHook(() => useSimClockStore());
    act(() => {
      result.current.reset();
      result.current.setPaused(false);
      result.current.setTimeScale(1.0);
      result.current.setSeed('default');
      result.current.setClockInstance(null);
    });
    setSeed('default');
  });

  describe('store initialization', () => {
    it('initializes with default values', () => {
      const { result } = renderHook(() => useSimClockStore());
      expect(result.current.paused).toBe(false);
      expect(result.current.timeScale).toBe(1.0);
      expect(result.current.simTime).toBe(0);
      expect(result.current.seed).toBe('default');
      expect(result.current.clockInstance).toBe(null);
    });
  });

  describe('setPaused', () => {
    it('updates store and clock instance', () => {
      const { result } = renderHook(() => useSimClockStore());
      
      // Create a clock instance
      const clock = new SimClock({ paused: false });
      act(() => {
        result.current.setClockInstance(clock);
      });

      act(() => {
        result.current.setPaused(true);
      });

      expect(result.current.paused).toBe(true);
      expect(clock.isPaused()).toBe(true);
    });

    it('works without clock instance (fallback)', () => {
      const { result } = renderHook(() => useSimClockStore());
      
      act(() => {
        result.current.setPaused(true);
      });

      expect(result.current.paused).toBe(true);
    });
  });

  describe('setTimeScale', () => {
    it('updates store and clock instance', () => {
      const { result } = renderHook(() => useSimClockStore());
      
      const clock = new SimClock({ timeScale: 1.0 });
      act(() => {
        result.current.setClockInstance(clock);
      });

      act(() => {
        result.current.setTimeScale(2.5);
      });

      expect(result.current.timeScale).toBe(2.5);
      expect(clock.getTimeScale()).toBe(2.5);
    });

    it('works without clock instance (fallback)', () => {
      const { result } = renderHook(() => useSimClockStore());
      
      act(() => {
        result.current.setTimeScale(3.0);
      });

      expect(result.current.timeScale).toBe(3.0);
    });
  });

  describe('setSeed', () => {
    it('updates store, clock instance, and resets time', () => {
      const { result } = renderHook(() => useSimClockStore());
      
      const clock = new SimClock({ seed: 'old-seed', simTime: 100 });
      act(() => {
        result.current.setClockInstance(clock);
        result.current.setSimTime(100);
      });

      act(() => {
        result.current.setSeed('new-seed');
      });

      expect(result.current.seed).toBe('new-seed');
      expect(clock.getSeed()).toBe('new-seed');
      expect(result.current.simTime).toBe(0);
      expect(clock.getTime()).toBe(0);
    });

    it('works without clock instance (fallback)', () => {
      const { result } = renderHook(() => useSimClockStore());
      
      act(() => {
        result.current.setSeed('test-seed');
      });

      expect(result.current.seed).toBe('test-seed');
    });
  });

  describe('toggle', () => {
    it('toggles pause state in store and clock', () => {
      const { result } = renderHook(() => useSimClockStore());
      
      const clock = new SimClock({ paused: false });
      act(() => {
        result.current.setClockInstance(clock);
      });

      expect(result.current.paused).toBe(false);
      expect(clock.isPaused()).toBe(false);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.paused).toBe(true);
      expect(clock.isPaused()).toBe(true);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.paused).toBe(false);
      expect(clock.isPaused()).toBe(false);
    });

    it('works without clock instance (fallback)', () => {
      const { result } = renderHook(() => useSimClockStore());
      
      act(() => {
        result.current.toggle();
      });

      expect(result.current.paused).toBe(true);
    });
  });

  describe('step', () => {
    it('advances time when paused', () => {
      const { result } = renderHook(() => useSimClockStore());
      
      const clock = new SimClock({ paused: true, simTime: 10 });
      act(() => {
        result.current.setClockInstance(clock);
        result.current.setPaused(true);
        result.current.setSimTime(10);
      });

      act(() => {
        result.current.step();
      });

      expect(result.current.simTime).toBe(11);
      expect(clock.getTime()).toBe(11);
    });

    it('works without clock instance (fallback)', () => {
      const { result } = renderHook(() => useSimClockStore());
      
      act(() => {
        result.current.setPaused(true);
        result.current.setSimTime(5);
        result.current.step();
      });

      expect(result.current.simTime).toBe(6);
    });
  });

  describe('reset', () => {
    it('resets time in store and clock', () => {
      const { result } = renderHook(() => useSimClockStore());
      
      const clock = new SimClock({ simTime: 100 });
      act(() => {
        result.current.setClockInstance(clock);
        result.current.setSimTime(100);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.simTime).toBe(0);
      expect(clock.getTime()).toBe(0);
    });

    it('works without clock instance (fallback)', () => {
      const { result } = renderHook(() => useSimClockStore());
      
      act(() => {
        result.current.setSimTime(50);
        result.current.reset();
      });

      expect(result.current.simTime).toBe(0);
    });
  });

  describe('formatTime', () => {
    it('formats simTime correctly', () => {
      const { result } = renderHook(() => useSimClockStore());
      
      act(() => {
        result.current.setSimTime(45);
      });
      expect(result.current.formatTime()).toBe('45s');

      act(() => {
        result.current.setSimTime(125);
      });
      expect(result.current.formatTime()).toBe('2m 5s');

      act(() => {
        result.current.setSimTime(3665);
      });
      expect(result.current.formatTime()).toBe('1h 1m 5s');

      act(() => {
        result.current.setSimTime(90061);
      });
      expect(result.current.formatTime()).toBe('1d 1h 1m 1s');
    });
  });

  describe('setClockInstance', () => {
    it('stores clock instance', () => {
      const { result } = renderHook(() => useSimClockStore());
      
      const clock = new SimClock();
      act(() => {
        result.current.setClockInstance(clock);
      });

      expect(result.current.clockInstance).toBe(clock);
    });

    it('can set to null', () => {
      const { result } = renderHook(() => useSimClockStore());
      
      const clock = new SimClock();
      act(() => {
        result.current.setClockInstance(clock);
        result.current.setClockInstance(null);
      });

      expect(result.current.clockInstance).toBe(null);
    });
  });

  describe('integration with clock updates', () => {
    it('store updates when clock time changes', () => {
      const { result } = renderHook(() => useSimClockStore());
      
      const clock = new SimClock({ paused: false });
      act(() => {
        result.current.setClockInstance(clock);
      });

      // Simulate clock update
      act(() => {
        clock.update(0.016);
        result.current.setSimTime(clock.getTime());
      });

      expect(result.current.simTime).toBeCloseTo(0.016, 5);
    });
  });
});

