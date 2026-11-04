import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Camera, Vector3 } from 'three';
import { useCameraStore } from '@/ui/stores/cameraStore';
import { useAgentStore } from '@/ui/stores/agentStore';
import { useOpsStore, isOverviewMode } from '@/ui/stores/opsStore';
import { bodyToScene } from './utils/coordinateConversion';
import { getBodyParams, type CentralBody } from '@/sim/orbit/bodies';

interface CameraControllerProps {
  /** Body for scene-scale conversion when following sats. */
  centralBody?: CentralBody;
}

function resolveFollowAgent(
  agents: ReturnType<typeof useAgentStore.getState>['agents'],
  selectedId: string | null,
  body: CentralBody
) {
  const selected = selectedId
    ? agents.find((a) => a.id === selectedId)
    : undefined;
  if (selected && (selected.centralBody ?? 'earth') === body) {
    return selected;
  }
  const hero = agents.find(
    (a) =>
      (a.centralBody ?? 'earth') === body &&
      (a.visualRole === 'hero' || a.id.startsWith('HERO-'))
  );
  return hero ?? null;
}

export function CameraController({
  centralBody = 'earth',
}: CameraControllerProps) {
  const { camera } = useThree();
  const preset = useCameraStore((state) => state.preset);
  const followTarget = useCameraStore((state) => state.followTarget);
  const agents = useAgentStore((s) => s.agents);
  const selectedAgentId = useAgentStore((s) => s.selectedAgentId);
  const viewMode = useOpsStore((s) => s.viewMode);
  const cameraRef = useRef<Camera>(camera);
  const orbitAngleRef = useRef(0);
  const lookAt = useRef(new Vector3(0, 0, 0));

  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  useFrame((_state, delta) => {
    const currentCamera = cameraRef.current;
    if (!currentCamera) return;
    if (isOverviewMode(viewMode)) return;

    const bodyRadius = getBodyParams(centralBody).radius;
    const lerpSpeed = 2.0;
    const distance = 5;

    switch (preset) {
      case 'cinematic': {
        orbitAngleRef.current += delta * 0.1;
        const x = Math.cos(orbitAngleRef.current) * distance;
        const z = Math.sin(orbitAngleRef.current) * distance;
        const desiredPosition = new Vector3(x, 2, z);
        currentCamera.position.lerp(desiredPosition, lerpSpeed * delta);
        currentCamera.lookAt(0, 0, 0);
        break;
      }

      case 'follow':
      case 'zoomIn': {
        const agent = resolveFollowAgent(
          agents,
          selectedAgentId,
          centralBody
        );
        if (agent && (preset === 'zoomIn' || followTarget)) {
          const scenePos = bodyToScene(agent.state.position, bodyRadius);
          lookAt.current.set(scenePos[0], scenePos[1], scenePos[2]);
          // Craft meshes span ~0.06–0.12; stay outside that so Zoom in does not clip.
          const closeDist = preset === 'zoomIn' ? 0.32 : 0.55;
          const offset = new Vector3(closeDist * 0.55, closeDist * 0.35, closeDist);
          const desiredPosition = lookAt.current.clone().add(offset);
          currentCamera.position.lerp(desiredPosition, lerpSpeed * delta);
          currentCamera.lookAt(lookAt.current);
        } else {
          const offset = new Vector3(0, 2, distance);
          currentCamera.position.lerp(offset, lerpSpeed * delta);
          currentCamera.lookAt(0, 0, 0);
        }
        break;
      }

      case 'freecam':
      default:
        break;
    }
  });

  return null;
}
