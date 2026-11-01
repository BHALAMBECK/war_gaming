import { useRef, useMemo } from 'react';
import { Points, AdditiveBlending } from 'three';
import { useFrame } from '@react-three/fiber';

interface StarfieldProps {
  count?: number;
  radius?: number;
}

function buildStarLayer(
  count: number,
  radius: number,
  spread: number,
  seed: number
) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  let s = seed;
  const rand = () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };

  for (let i = 0; i < count; i += 1) {
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(rand() * 2 - 1);
    const r = radius + rand() * radius * spread;
    const i3 = i * 3;
    positions[i3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = r * Math.cos(phi);

    const warmth = rand();
    const b = 0.82 + rand() * 0.18;
    const g = 0.78 + warmth * 0.2;
    const red = 0.72 + warmth * 0.28;
    colors[i3] = red;
    colors[i3 + 1] = g;
    colors[i3 + 2] = b;
  }
  return { positions, colors };
}

export function Starfield({ count = 5000, radius = 100 }: StarfieldProps) {
  const pointsRef = useRef<Points>(null);
  const dustRef = useRef<Points>(null);

  const bright = useMemo(
    () => buildStarLayer(Math.floor(count * 0.35), radius, 0.45, 90210),
    [count, radius]
  );
  const dust = useMemo(
    () => buildStarLayer(count, radius, 0.85, 44021),
    [count, radius]
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (pointsRef.current) {
      pointsRef.current.rotation.y = t * 0.004;
      pointsRef.current.rotation.x = Math.sin(t * 0.07) * 0.015;
    }
    if (dustRef.current) {
      dustRef.current.rotation.y = t * 0.0025;
    }
  });

  return (
    <>
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={dust.positions.length / 3}
            array={dust.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={dust.colors.length / 3}
            array={dust.colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.35}
          vertexColors
          transparent
          opacity={0.55}
          sizeAttenuation
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={bright.positions.length / 3}
            array={bright.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={bright.colors.length / 3}
            array={bright.colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.9}
          vertexColors
          transparent
          opacity={0.92}
          sizeAttenuation
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
    </>
  );
}
