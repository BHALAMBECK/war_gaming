import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { SimClock } from './SimClock';
import { useSimClockStore } from '@/ui/stores/simClockStore';

/**
 * Hook to integrate SimClock with React and R3F render loop.
 * Updates clock based on frame delta and stores clock instance in store.
 * This hook MUST only be used inside a Canvas component (R3F requirement).
 */
export function useSimClock() {
  const clockRef = useRef<SimClock | null>(null);
  const {
    paused,
    timeScale,
    seed,
    timeStep,
    setSimTime,
    setClockInstance,
  } = useSimClockStore();

  // Initialize clock and store reference
  useEffect(() => {
    if (!clockRef.current) {
      clockRef.current = new SimClock({
        seed,
        timeScale,
        paused,
        stepDelta: timeStep,
      });
      setClockInstance(clockRef.current);
    }
    return () => {
      // Cleanup: remove clock instance reference when component unmounts
      setClockInstance(null);
    };
  }, []);

  // Sync clock with store state
  useEffect(() => {
    if (clockRef.current) {
      if (clockRef.current.isPaused() !== paused) {
        paused ? clockRef.current.pause() : clockRef.current.play();
      }
      if (clockRef.current.getTimeScale() !== timeScale) {
        clockRef.current.setTimeScale(timeScale);
      }
      if (clockRef.current.getSeed() !== seed) {
        clockRef.current.setSeed(seed);
      }
      if (clockRef.current.getTimeStep() !== timeStep) {
        clockRef.current.setTimeStep(timeStep);
      }
    }
  }, [paused, timeScale, seed, timeStep]);

  // Update clock in render loop
  useFrame((_state, delta) => {
    if (clockRef.current) {
      const simDelta = clockRef.current.update(delta);
      if (simDelta > 0) {
        setSimTime(clockRef.current.getTime());
      }
    }
  });
}

