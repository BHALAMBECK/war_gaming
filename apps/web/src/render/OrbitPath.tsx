import { useMemo } from 'react';
import { useAgentStore } from '@/ui/stores/agentStore';
import { cartesianToElements, elementsToCartesian } from '@/sim/orbit/conversions';
import { OrbitalElements } from '@/sim/orbit/types';
import { eciToScene } from './utils/coordinateConversion';

/**
 * OrbitPath component that visualizes the full orbit ellipse for the selected agent.
 */
export function OrbitPath() {
  const selectedAgent = useAgentStore((state) => state.getSelectedAgent());

  // Calculate orbit path points
  const orbitPoints = useMemo(() => {
    if (!selectedAgent) return null;

    try {
      // Convert current state to orbital elements
      const elements = cartesianToElements(selectedAgent.state);

      // Generate points along the orbit by varying true anomaly
      const numPoints = 100;
      const points: [number, number, number][] = [];

      for (let i = 0; i <= numPoints; i++) {
        const ν = (i / numPoints) * 2 * Math.PI;
        
        // Create orbital elements with this true anomaly
        const orbitElements: OrbitalElements = {
          ...elements,
          ν,
        };

        // Convert to Cartesian state
        const state = elementsToCartesian(orbitElements);
        
        // Convert to scene coordinates
        const scenePos = eciToScene(state.position);
        points.push(scenePos);
      }

      return points;
    } catch (error) {
      console.warn('Failed to calculate orbit path:', error);
      return null;
    }
  }, [selectedAgent]);

  // Convert points to Float32Array for buffer geometry
  // Always call this hook, even if orbitPoints is null
  const positions = useMemo(() => {
    if (!orbitPoints) {
      // Return empty array if no points
      return new Float32Array(0);
    }
    const array = new Float32Array(orbitPoints.length * 3);
    orbitPoints.forEach((point, index) => {
      array[index * 3] = point[0];
      array[index * 3 + 1] = point[1];
      array[index * 3 + 2] = point[2];
    });
    return array;
  }, [orbitPoints]);

  // Only render if we have valid data
  if (!selectedAgent || !orbitPoints) return null;

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={orbitPoints.length}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#00ffff" opacity={0.5} transparent lineWidth={1} />
    </line>
  );
}
