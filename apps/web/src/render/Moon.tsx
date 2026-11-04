import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { TexturedBodySphere } from './TexturedBodySphere';

interface MoonProps {
  radius?: number;
  orbitDistance?: number;
  orbitSpeed?: number;
  /** When false, skip orbital animation (e.g. solar companion positioning). */
  orbit?: boolean;
}

export function Moon({
  radius = 0.27,
  orbitDistance = 3.5,
  orbitSpeed = 0.001,
  orbit = true,
}: MoonProps) {
  const groupRef = useRef<Group>(null);
  const orbitAngleRef = useRef(0);

  useFrame(() => {
    if (orbit && groupRef.current) {
      orbitAngleRef.current += orbitSpeed;
      groupRef.current.position.x =
        Math.cos(orbitAngleRef.current) * orbitDistance;
      groupRef.current.position.z =
        Math.sin(orbitAngleRef.current) * orbitDistance;
      groupRef.current.position.y = 0;
    }
  });

  return (
    <group ref={groupRef}>
      <TexturedBodySphere
        bodyId="moon"
        radius={radius}
        spin={0.006}
        fallbackColor="#a8a29a"
        bumpScale={0.16}
      />
    </group>
  );
}
