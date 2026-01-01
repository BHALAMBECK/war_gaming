/**
 * Objectives component: renders objectives in the 3D scene.
 */

import { useMemo } from 'react';
import { useTaskStore } from '@/ui/stores/taskStore';
import { eciToScene } from './utils/coordinateConversion';
import { ObjectiveType } from '@/sim/tasks/types';
import { EARTH_RADIUS } from '@/sim/orbit/constants';

/**
 * Objectives component that visualizes all objectives in the scene.
 */
export function Objectives() {
  const objectives = useTaskStore((state) => state.objectives);
  
  if (objectives.length === 0) return null;
  
  return (
    <>
      {objectives.map((objective) => (
        <ObjectiveMarker key={objective.id} objective={objective} />
      ))}
    </>
  );
}

/**
 * Individual objective marker component.
 */
function ObjectiveMarker({ objective }: { objective: any }) {
  // Convert ECI position to scene coordinates
  const scenePos = useMemo(() => {
    return eciToScene(objective.position);
  }, [objective.position]);
  
  // Determine base color based on objective type
  let baseColor: string;
  switch (objective.type) {
    case ObjectiveType.INSPECT_POINT:
      baseColor = '#ffff00'; // Yellow
      break;
    case ObjectiveType.RELAY_NODE:
      baseColor = '#ff8800'; // Orange
      break;
    case ObjectiveType.HOLD_FORMATION_ZONE:
      baseColor = '#aa00ff'; // Purple
      break;
    default:
      baseColor = '#ffaa00'; // Fallback orange
  }
  
  // Use green for completed objectives, otherwise use type-specific color
  const color = objective.completed ? '#00ff00' : baseColor;
  const emissive = objective.completed ? '#00ff00' : baseColor;
  
  switch (objective.type) {
    case ObjectiveType.INSPECT_POINT: {
      // Render as a small sphere
      const radius = 0.01; // Scene units
      return (
        <mesh position={[scenePos[0], scenePos[1], scenePos[2]]}>
          <sphereGeometry args={[radius, 16, 16]} />
          <meshStandardMaterial
            color={color}
            emissive={emissive}
            emissiveIntensity={0.8}
          />
        </mesh>
      );
    }
    
    case ObjectiveType.RELAY_NODE: {
      // Render as a slightly larger sphere with pulsing effect
      const baseRadius = 0.015;
      return (
        <mesh position={[scenePos[0], scenePos[1], scenePos[2]]}>
          <sphereGeometry args={[baseRadius, 16, 16]} />
          <meshStandardMaterial
            color={color}
            emissive={emissive}
            emissiveIntensity={objective.completed ? 0.8 : 1.0}
          />
        </mesh>
      );
    }
    
    case ObjectiveType.HOLD_FORMATION_ZONE: {
      // Render as a wireframe sphere showing the zone boundary
      const zoneRadius = objective.radius / EARTH_RADIUS; // Convert to scene units
      
      return (
        <group position={[scenePos[0], scenePos[1], scenePos[2]]}>
          {/* Outer wireframe sphere */}
          <mesh>
            <sphereGeometry args={[zoneRadius, 32, 32]} />
            <meshBasicMaterial
              color={color}
              wireframe
              transparent
              opacity={objective.completed ? 0.3 : 0.5}
            />
          </mesh>
          {/* Center marker */}
          <mesh>
            <sphereGeometry args={[0.01, 16, 16]} />
            <meshStandardMaterial
              color={color}
              emissive={emissive}
              emissiveIntensity={0.8}
            />
          </mesh>
        </group>
      );
    }
    
    default:
      return null;
  }
}
