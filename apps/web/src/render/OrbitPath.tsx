import { useMemo } from 'react';
import { useAgentStore } from '@/ui/stores/agentStore';
import { cartesianToElements, elementsToCartesian } from '@/sim/orbit/conversions';
import { OrbitalElements } from '@/sim/orbit/types';
import { bodyToScene } from './utils/coordinateConversion';
import { getBodyParams } from '@/sim/orbit/bodies';

/**
 * OrbitPath component that visualizes the full orbit ellipse for the selected agent.
 */
export function OrbitPath() {
  const selectedAgent = useAgentStore((state) => state.getSelectedAgent());

  // Calculate orbit path points
  const orbitPoints = useMemo(() => {
    if (!selectedAgent) return null;

    try {
      const body = selectedAgent.centralBody ?? 'earth';
      const { mu, radius } = getBodyParams(body);
      const elements = cartesianToElements(selectedAgent.state, mu);

      const numPoints = 100;
      const points: [number, number, number][] = [];

      for (let i = 0; i <= numPoints; i++) {
        const ν = (i / numPoints) * 2 * Math.PI;
        const orbitElements: OrbitalElements = {
          ...elements,
          ν,
        };
        const state = elementsToCartesian(orbitElements, mu);
        const scenePos = bodyToScene(state.position, radius);
        points.push(scenePos);
      }

      return points;
    } catch (error) {
      console.warn('Failed to calculate orbit path:', error);
      return null;
    }
  }, [selectedAgent]);

  const positions = useMemo(() => {
    if (!orbitPoints) {
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
      <lineBasicMaterial color="#00ffff" opacity={0.5} transparent />
    </line>
  );
}
