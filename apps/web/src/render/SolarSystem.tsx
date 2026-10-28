import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Mesh,
  Texture,
  TextureLoader,
  RepeatWrapping,
} from 'three';
import { useSimClockStore } from '@/ui/stores/simClockStore';
import { PLANETS, planetPositionAu, sampleOrbitAu } from '@/sim/solar/planets';

const EARTH_TEXTURE_URL =
  'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/planets/earth_atmos_2048.jpg';
const EARTH_TEXTURE_FALLBACK =
  'https://raw.githubusercontent.com/mrdoob/three.js/r160/examples/textures/planets/earth_atmos_2048.jpg';

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
      <lineBasicMaterial color="#4a6a80" transparent opacity={0.72} />
    </lineLoop>
  );
}

function SaturnRings({ radius }: { radius: number }) {
  const inner = radius * 1.35;
  const outer = radius * 2.35;
  return (
    <mesh rotation={[Math.PI / 2.35, 0.15, 0]}>
      <ringGeometry args={[inner, outer, 64]} />
      <meshBasicMaterial
        color="#d4c4a0"
        transparent
        opacity={0.65}
        side={DoubleSide}
      />
    </mesh>
  );
}

function PlanetBody({
  planetId,
  simTime,
  earthTexture,
}: {
  planetId: string;
  simTime: number;
  earthTexture: Texture | null;
}) {
  const planet = PLANETS.find((p) => p.id === planetId)!;
  const ref = useRef<Mesh>(null);
  const [x, y, z] = planetPositionAu(planet, simTime);
  const isEarth = planet.id === 'earth';
  const useTexture = isEarth && earthTexture !== null;

  return (
    <mesh ref={ref} position={[x, y, z]}>
      <sphereGeometry args={[planet.displayRadius, 64, 64]} />
      <meshStandardMaterial
        color={useTexture ? '#ffffff' : planet.color}
        map={useTexture ? earthTexture : null}
        emissive={planet.emissive ?? '#000000'}
        emissiveIntensity={planet.emissive ? 0.4 : 0}
        roughness={0.55}
        metalness={0.15}
      />
      {planet.id === 'saturn' && (
        <SaturnRings radius={planet.displayRadius} />
      )}
    </mesh>
  );
}

/**
 * Heliocentric solar-system map (Sun + planets). Free Three.js — no Cesium.
 */
export function SolarSystem() {
  const simTime = useSimClockStore((s) => s.simTime);
  const sunPulse = useRef(0);
  const [earthTexture, setEarthTexture] = useState<Texture | null>(null);

  useEffect(() => {
    const loader = new TextureLoader();
    loader.crossOrigin = 'anonymous';
    let cancelled = false;
    let loaded: Texture | null = null;

    const apply = (texture: Texture) => {
      if (cancelled) {
        texture.dispose();
        return;
      }
      texture.wrapS = texture.wrapT = RepeatWrapping;
      texture.anisotropy = 8;
      texture.colorSpace = 'srgb';
      loaded = texture;
      setEarthTexture(texture);
    };

    loader.load(
      EARTH_TEXTURE_URL,
      apply,
      undefined,
      () => {
        loader.load(EARTH_TEXTURE_FALLBACK, apply, undefined, () => {
          /* keep flat Earth color */
        });
      }
    );

    return () => {
      cancelled = true;
      loaded?.dispose();
    };
  }, []);

  useFrame((_, delta) => {
    sunPulse.current += delta;
  });

  return (
    <group>
      {/* Sun */}
      <mesh>
        <sphereGeometry args={[0.08, 48, 48]} />
        <meshStandardMaterial
          color="#ffcc66"
          emissive="#ff9900"
          emissiveIntensity={1.6}
        />
      </mesh>
      <pointLight color="#ffd27a" intensity={2.6} distance={90} decay={1.1} />
      <ambientLight intensity={0.42} />

      {PLANETS.map((p) => (
        <group key={p.id}>
          <OrbitRing planetId={p.id} />
          <PlanetBody
            planetId={p.id}
            simTime={simTime}
            earthTexture={earthTexture}
          />
        </group>
      ))}
    </group>
  );
}
