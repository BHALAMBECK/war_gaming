import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock R3F hooks globally
vi.mock('@react-three/fiber', async () => {
  const actual = await vi.importActual('@react-three/fiber');
  return {
    ...actual,
    useFrame: vi.fn((callback) => {
      // Mock useFrame to call callback with mock state and delta
      if (typeof callback === 'function') {
        const mockState = {
          clock: { getElapsedTime: () => 0, getDelta: () => 0.016 },
          camera: { position: { x: 0, y: 0, z: 5 } },
          scene: {},
          gl: {},
          raycaster: {},
          pointer: { x: 0, y: 0 },
          viewport: { width: 800, height: 600 },
        };
        callback(mockState, 0.016);
      }
    }),
    useThree: vi.fn(() => ({
      camera: {
        position: { x: 0, y: 0, z: 5 },
        lookAt: vi.fn(),
      },
      scene: {},
      gl: {},
      raycaster: {},
      pointer: { x: 0, y: 0 },
      viewport: { width: 800, height: 600 },
      clock: { getElapsedTime: () => 0, getDelta: () => 0.016 },
    })),
  };
});

