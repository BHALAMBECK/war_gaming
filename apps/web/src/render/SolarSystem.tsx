import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferGeometry, Float32BufferAttribute, Mesh } from 'three';
import { useSimClockStore } from '@/ui/stores/simClockStore';
import { PLANETS, planetPositionAu, sampleOrbitAu } from '@/sim/solar/planets';

function OrbitRing({ planetId }: { planetId: string }) {
  const planet = PLANETS.find((p) => p.id === planetId)!;
  const geometry = useMemo(() => {
    const geo = new BufferGeometry();
    const pts = sampleOrbitAu(planet, 160);
    geo.setAttribute('position', new Float32BufferAttribute(pts, 3));
    return geo;
  }, [planet]);

  return (
    <lineLoop geometry={geometry}>
      <lineBasicMaterial color="#2a3a48" transparent opacity={0.55} />
    </lineLoop>
  );
}

function PlanetBody({
  planetId,
  simTime,
}: {
  planetId: string;
  simTime: number;
}) {
  const planet = PLANETS.find((p) => p.id === planetId)!;
  const ref = useRef<Mesh>(null);
  const [x, y, z] = planetPositionAu(planet, simTime);

  return (
    <mesh ref={ref} position={[x, y, z]}>
      <sphereGeometry args={[planet.displayRadius, 24, 24]} />
      <meshStandardMaterial
        color={planet.color}
        emissive={planet.emissive ?? '#000000'}
        emissiveIntensity={planet.emissive ? 0.4 : 0}
        roughness={0.55}
        metalness={0.15}
      />
    </mesh>
  );
}

/**
 * Heliocentric solar-system map (Sun + planets). Free Three.js — no Cesium.
 */
export function SolarSystem() {
  const simTime = useSimClockStore((s) => s.simTime);
  const sunPulse = useRef(0);

  useFrame((_, delta) => {
    sunPulse.current += delta;
  });

  return (
    <group>
      {/* Sun */}
      <mesh>
        <sphereGeometry args={[0.08, 32, 32]} />
        <meshStandardMaterial
          color="#ffcc66"
          emissive="#ff9900"
          emissiveIntensity={1.4}
        />
      </mesh>
      <pointLight color="#ffd27a" intensity={2.2} distance={80} decay={1.2} />
      <ambientLight intensity={0.18} />

      {PLANETS.map((p) => (
        <group key={p.id}>
          <OrbitRing planetId={p.id} />
          <PlanetBody planetId={p.id} simTime={simTime} />
        </group>
      ))}
    </group>
  );
}
