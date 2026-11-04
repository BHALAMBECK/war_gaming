/**
 * Body-local / companion sphere that reliably applies albedo + bump after async load.
 */

import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Mesh,
  MeshStandardMaterial,
  BackSide,
  AdditiveBlending,
} from 'three';
import {
  loadBodyTextures,
  releaseBodyTextures,
  type BodyTextureSet,
} from './textures/planetTextures';

export interface TexturedBodySphereProps {
  bodyId: 'moon' | 'mars' | 'earth';
  radius?: number;
  /** Axial spin in radians per second (visual only). */
  spin?: number;
  /** Fallback albedo if CDN textures fail. */
  fallbackColor?: string;
  /** Bump intensity once textures are ready. */
  bumpScale?: number;
  /** Optional thin haze shell (Mars). */
  haze?: { color: string; opacity: number; scale?: number };
}

export function TexturedBodySphere({
  bodyId,
  radius = 1,
  spin = 0.008,
  fallbackColor = '#888888',
  bumpScale = 0.12,
  haze,
}: TexturedBodySphereProps) {
  const meshRef = useRef<Mesh>(null);
  const matRef = useRef<MeshStandardMaterial>(null);
  const [textures, setTextures] = useState<BodyTextureSet>({});

  useEffect(() => {
    let active = true;

    loadBodyTextures(bodyId)
      .then((set) => {
        if (!active) return;
        setTextures(set);
      })
      .catch(() => {
        /* keep fallback color */
      });

    return () => {
      active = false;
      releaseBodyTextures(bodyId);
    };
  }, [bodyId]);

  // Imperatively bind maps — R3F often skips declarative texture updates on first paint.
  useEffect(() => {
    const mat = matRef.current;
    if (!mat) return;

    const map = textures.map ?? null;
    const bump = textures.bump ?? textures.map ?? null;
    const normal = textures.normal ?? null;

    mat.map = map;
    mat.bumpMap = bump;
    mat.normalMap = normal;
    mat.bumpScale = map || bump ? bumpScale : 0;
    mat.color.set(map ? '#ffffff' : fallbackColor);
    mat.needsUpdate = true;
    if (map) map.needsUpdate = true;
    if (bump && bump !== map) bump.needsUpdate = true;
  }, [textures, bumpScale, fallbackColor]);

  useFrame((_, delta) => {
    if (meshRef.current && spin !== 0) {
      meshRef.current.rotation.y += spin * delta;
    }
  });

  const hasMap = Boolean(textures.map);

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, 128, 128]} />
        <meshStandardMaterial
          ref={matRef}
          color={hasMap ? '#ffffff' : fallbackColor}
          roughness={bodyId === 'mars' ? 0.78 : 0.92}
          metalness={0.04}
        />
      </mesh>
      {haze && (
        <mesh scale={haze.scale ?? 1.02}>
          <sphereGeometry args={[radius, 64, 64]} />
          <meshBasicMaterial
            color={haze.color}
            transparent
            opacity={haze.opacity}
            side={BackSide}
            depthWrite={false}
            blending={AdditiveBlending}
          />
        </mesh>
      )}
    </group>
  );
}
