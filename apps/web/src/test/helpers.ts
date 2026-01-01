import { vi } from 'vitest';
import { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { useFrame, useThree } from '@react-three/fiber';

/**
 * Mock R3F useFrame hook
 */
export function mockUseFrame() {
  const mockUseFrame = vi.mocked(useFrame);
  return mockUseFrame;
}

/**
 * Mock R3F useThree hook
 */
export function mockUseThree(mockCamera?: any) {
  const mockUseThree = vi.mocked(useThree);
  mockUseThree.mockReturnValue({
    camera: mockCamera || {
      position: { x: 0, y: 0, z: 5 },
      lookAt: vi.fn(),
    },
    scene: {},
    gl: {},
    raycaster: {},
    pointer: { x: 0, y: 0 },
    viewport: { width: 800, height: 600 },
    clock: { getElapsedTime: () => 0, getDelta: () => 0.016 },
  });
  return mockUseThree;
}

/**
 * Create a mock frame state for useFrame callbacks
 */
export function createMockFrameState(delta: number = 0.016) {
  return {
    clock: {
      getElapsedTime: () => 0,
      getDelta: () => delta,
    },
    camera: {
      position: { x: 0, y: 0, z: 5 },
      lookAt: vi.fn(),
    },
    scene: {},
    gl: {},
    raycaster: {},
    pointer: { x: 0, y: 0 },
    viewport: { width: 800, height: 600 },
  };
}

/**
 * Helper to test determinism - run simulation multiple times and compare results
 */
export function testDeterminism<T>(
  runSimulation: () => T,
  iterations: number = 3
): T[] {
  const results: T[] = [];
  for (let i = 0; i < iterations; i++) {
    results.push(runSimulation());
  }
  return results;
}

/**
 * Helper to compare simulation results for equality
 */
export function compareSimulationResults<T>(
  result1: T,
  result2: T,
  tolerance: number = 0.0001
): boolean {
  if (typeof result1 === 'number' && typeof result2 === 'number') {
    return Math.abs(result1 - result2) < tolerance;
  }
  if (Array.isArray(result1) && Array.isArray(result2)) {
    if (result1.length !== result2.length) return false;
    return result1.every((val, idx) =>
      compareSimulationResults(val, result2[idx], tolerance)
    );
  }
  if (typeof result1 === 'object' && typeof result2 === 'object') {
    const keys1 = Object.keys(result1);
    const keys2 = Object.keys(result2);
    if (keys1.length !== keys2.length) return false;
    return keys1.every((key) =>
      compareSimulationResults(
        (result1 as any)[key],
        (result2 as any)[key],
        tolerance
      )
    );
  }
  return result1 === result2;
}

/**
 * Custom render function for components that need providers
 */
export function renderWithProviders(
  ui: ReactNode,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { ...options });
}

/**
 * Wait for next frame (useful for testing useFrame callbacks)
 */
export function waitForNextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      setTimeout(resolve, 0);
    });
  });
}

/**
 * Mock Zustand store for testing
 */
export function createMockStore<T>(initialState: T) {
  let state = { ...initialState };
  const listeners = new Set<(state: T) => void>();

  return {
    getState: () => state,
    setState: (newState: Partial<T>) => {
      state = { ...state, ...newState };
      listeners.forEach((listener) => listener(state));
    },
    subscribe: (listener: (state: T) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

