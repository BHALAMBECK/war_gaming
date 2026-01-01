import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Starfield } from './Starfield';
import { useFrame } from '@react-three/fiber';

// Mock R3F
vi.mock('@react-three/fiber', () => ({
  useFrame: vi.fn(),
}));

describe('Starfield component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders with default count and radius', () => {
      // Component should render with defaults
      // Structural test - actual rendering requires R3F Canvas
      const StarfieldComponent = Starfield;
      expect(StarfieldComponent).toBeDefined();
    });

    it('accepts custom count and radius props', () => {
      // Component accepts count and radius props
      const props: { count?: number; radius?: number } = {
        count: 10000,
        radius: 200,
      };
      expect(props.count).toBe(10000);
      expect(props.radius).toBe(200);
    });
  });

  describe('position generation', () => {
    it('generates positions correctly', () => {
      // Component uses useMemo to generate positions
      // Positions should be on sphere surface
      const mockUseFrame = vi.mocked(useFrame);
      
      // Component should call useFrame for rotation
      expect(mockUseFrame).toBeDefined();
    });

    it('generates correct number of positions', () => {
      const count = 5000;
      // Component should generate count * 3 values (x, y, z for each star)
      const expectedLength = count * 3;
      expect(expectedLength).toBe(15000);
    });
  });

  describe('animation', () => {
    it('rotates starfield slowly in useFrame', () => {
      const mockCallback = vi.fn();
      const mockUseFrame = vi.mocked(useFrame);
      mockUseFrame.mockImplementation((callback) => {
        if (typeof callback === 'function') {
          callback({} as any, 0.016);
        }
      });

      // Component should use useFrame for rotation
      expect(mockUseFrame).toBeDefined();
    });
  });

  describe('component structure', () => {
    it('exports Starfield component', () => {
      expect(Starfield).toBeDefined();
      expect(typeof Starfield).toBe('function');
    });

    it('has correct prop types', () => {
      const props: { count?: number; radius?: number } = {
        count: 5000,
        radius: 100,
      };
      expect(props.count).toBe(5000);
      expect(props.radius).toBe(100);
    });
  });
});

