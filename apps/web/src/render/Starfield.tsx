import { useRef, useMemo } from 'react';
import { Points } from 'three';
import { useFrame } from '@react-three/fiber';

interface StarfieldProps {
  count?: number;
  radius?: number;
}

export function Starfield({ count = 5000, radius = 100 }: StarfieldProps) {
  const pointsRef = useRef<Points>(null);

  // Generate random star positions
  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      // Random point on sphere surface
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = radius + Math.random() * radius * 0.5;

      positions[i] = r * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = r * Math.cos(phi);
    }
    return positions;
  }, [count, radius]);

  // Slow rotation for parallax effect
  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.0001;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#ffffff" sizeAttenuation={false} />
    </points>
  );
}

