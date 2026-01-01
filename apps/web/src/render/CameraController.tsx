import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Camera, Vector3 } from 'three';
import { useCameraStore } from '@/ui/stores/cameraStore';

const CAMERA_PRESETS = {
  freecam: 'freecam',
  cinematic: 'cinematic',
  follow: 'follow',
} as const;

export type CameraPreset = (typeof CAMERA_PRESETS)[keyof typeof CAMERA_PRESETS];

interface CameraControllerProps {
  target?: Vector3;
}

export function CameraController({ target = new Vector3(0, 0, 0) }: CameraControllerProps) {
  const { camera } = useThree();
  const preset = useCameraStore((state) => state.preset);
  const cameraRef = useRef<Camera>(camera);
  const orbitAngleRef = useRef(0);

  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  useFrame((_state, delta) => {
    const currentCamera = cameraRef.current;
    if (!currentCamera) return;

    const distance = 5;
    const lerpSpeed = 2.0; // Smooth transition speed

    switch (preset) {
      case 'cinematic': {
        // Slow auto-rotation around Earth
        orbitAngleRef.current += delta * 0.1;
        const x = Math.cos(orbitAngleRef.current) * distance;
        const z = Math.sin(orbitAngleRef.current) * distance;
        const desiredPosition = new Vector3(x, 2, z);
        
        currentCamera.position.lerp(desiredPosition, lerpSpeed * delta);
        currentCamera.lookAt(target);
        break;
      }

      case 'follow': {
        // Follow target (Earth center for now)
        const offset = new Vector3(0, 2, distance);
        const desiredPosition = target.clone().add(offset);
        
        currentCamera.position.lerp(desiredPosition, lerpSpeed * delta);
        currentCamera.lookAt(target);
        break;
      }

      case 'freecam':
      default: {
        // Freecam: OrbitControls handles this, but we can reset if needed
        // No automatic movement - user controls via OrbitControls
        break;
      }
    }
  });

  return null;
}

