import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Group } from 'three';
import {
  disposeBodyTextures,
  loadBodyTextures,
  type BodyTextureSet,
} from './textures/planetTextures';

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
  const meshRef = useRef<Mesh>(null);
  const groupRef = useRef<Group>(null);
  const orbitAngleRef = useRef(0);
  const [textures, setTextures] = useState<BodyTextureSet>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let loaded: BodyTextureSet = {};

    loadBodyTextures('moon').then((set) => {
      if (cancelled) {
        disposeBodyTextures(set);
        return;
      }
      loaded = set;
      setTextures(set);
      setReady(true);
    });

    return () => {
      cancelled = true;
      disposeBodyTextures(loaded);
    };
  }, []);

  useFrame(() => {
    if (orbit && groupRef.current) {
      orbitAngleRef.current += orbitSpeed;
      groupRef.current.position.x =
        Math.cos(orbitAngleRef.current) * orbitDistance;
      groupRef.current.position.z =
        Math.sin(orbitAngleRef.current) * orbitDistance;
      groupRef.current.position.y = 0;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.00025;
    }
  });

  const hasMap = Boolean(textures.map);

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, 128, 128]} />
        <meshStandardMaterial
          map={textures.map ?? null}
          bumpMap={textures.bump ?? textures.map ?? null}
          bumpScale={hasMap ? 0.045 : 0}
          color={hasMap || !ready ? '#ffffff' : '#9a9a9a'}
          roughness={0.92}
          metalness={0.02}
        />
      </mesh>
    </group>
  );
}
