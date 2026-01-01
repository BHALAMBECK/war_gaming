/**
 * PerformanceTracker component: tracks FPS inside Canvas context.
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

interface PerformanceTrackerProps {
  onFpsUpdate: (fps: number) => void;
  enabled: boolean;
}

export function PerformanceTracker({ onFpsUpdate, enabled }: PerformanceTrackerProps) {
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const fpsHistoryRef = useRef<number[]>([]);

  useFrame(() => {
    if (!enabled) return;

    frameCountRef.current += 1;
    const currentTime = performance.now();
    const elapsed = currentTime - lastTimeRef.current;

    // Update FPS every second
    if (elapsed >= 1000) {
      const currentFps = (frameCountRef.current * 1000) / elapsed;
      
      // Add to history for smoothing (keep last 10 values)
      fpsHistoryRef.current.push(currentFps);
      if (fpsHistoryRef.current.length > 10) {
        fpsHistoryRef.current.shift();
      }

      // Calculate smoothed FPS (average of last 10 values)
      const avgFps = fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length;
      
      onFpsUpdate(avgFps);
      
      frameCountRef.current = 0;
      lastTimeRef.current = currentTime;
    }
  });

  return null;
}
