import { DoubleSide } from 'three';
import { useAgentStore } from '@/ui/stores/agentStore';
import { eciToScene } from './utils/coordinateConversion';
import { cameraLookDirection } from '@/sim/systems/sensors';
import { EARTH_RADIUS } from '@/sim/orbit/constants';

/**
 * Visual FOV cone for the selected satellite's camera.
 */
export function SensorFrustum() {
  const selected = useAgentStore((s) =>
    s.agents.find((a) => a.id === s.selectedAgentId)
  );

  if (!selected?.systems?.camera?.active) return null;

  const cam = selected.systems.camera;
  const pos = eciToScene(selected.state.position);
  const look = cameraLookDirection(selected, 'velocity');
  const rangeScene = cam.rangeM / EARTH_RADIUS;
  const halfRad = (cam.fovDeg * Math.PI) / 180;
  const radius = Math.max(0.01, Math.tan(halfRad) * rangeScene);

  const len =
    Math.sqrt(look[0] ** 2 + look[1] ** 2 + look[2] ** 2) || 1;
  const dir: [number, number, number] = [
    look[0] / len,
    look[1] / len,
    look[2] / len,
  ];

  // Map local +Y (cone axis) to look direction
  const yaw = Math.atan2(dir[0], dir[2]);
  const pitch = Math.asin(Math.max(-1, Math.min(1, -dir[1])));

  return (
    <group position={pos} rotation={[pitch + Math.PI / 2, yaw, 0]}>
      <mesh position={[0, rangeScene / 2, 0]}>
        <coneGeometry args={[radius, rangeScene, 20, 1, true]} />
        <meshBasicMaterial
          color="#3d9a8b"
          transparent
          opacity={0.14}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
