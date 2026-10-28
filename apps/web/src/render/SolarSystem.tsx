import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Mesh,
  Vector3,
} from 'three';

export type SolarControlsHandle = {
  target: Vector3;
  minDistance: number;
  maxDistance: number;
  update: () => void;
};
import { useSimClockStore } from '@/ui/stores/simClockStore';
import { useOpsStore } from '@/ui/stores/opsStore';
import { PLANETS, planetPositionAu, sampleOrbitAu } from '@/sim/solar/planets';
import {
  disposeBodyTextures,
  loadBodyTextures,
  type BodyTextureSet,
} from './textures/planetTextures';

function OrbitRing({ planetId }: { planetId: string }) {
  const planet = PLANETS.find((p) => p.id === planetId)!;
  const geometry = useMemo(() => {
    const geo = new BufferGeometry();
    const pts = sampleOrbitAu(planet, 256);
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
      <ringGeometry args={[inner, outer, 96]} />
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
  textures,
  focused,
}: {
  planetId: string;
  simTime: number;
  textures: BodyTextureSet;
  focused: boolean;
}) {
  const planet = PLANETS.find((p) => p.id === planetId)!;
  const setFocusedBodyId = useOpsStore((s) => s.setFocusedBodyId);
  const ref = useRef<Mesh>(null);
  const [x, y, z] = planetPositionAu(planet, simTime);
  const hasMap = Boolean(textures.map);
  const segments = focused || planetId === 'earth' || planetId === 'mars' ? 96 : 64;
  const bumpScale =
    planetId === 'mars' ? 0.012 : planetId === 'earth' ? 0.008 : 0.006;

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setFocusedBodyId(planetId);
  };

  return (
    <group position={[x, y, z]}>
      <mesh ref={ref} onClick={onClick}>
        <sphereGeometry args={[planet.displayRadius, segments, segments]} />
        <meshStandardMaterial
          color={hasMap ? '#ffffff' : planet.color}
          map={textures.map ?? null}
          bumpMap={textures.bump ?? null}
          bumpScale={textures.bump ? bumpScale * planet.displayRadius * 40 : 0}
          normalMap={textures.normal ?? null}
          emissive={planet.emissive ?? '#000000'}
          emissiveIntensity={planet.emissive ? 0.4 : 0}
          roughness={0.55}
          metalness={0.12}
        />
      </mesh>
      {planet.id === 'saturn' && (
        <SaturnRings radius={planet.displayRadius} />
      )}
      {planet.id === 'earth' && (
        <EarthMoonCompanion earthRadius={planet.displayRadius} />
      )}
    </group>
  );
}

function EarthMoonCompanion({ earthRadius }: { earthRadius: number }) {
  const setFocusedBodyId = useOpsStore((s) => s.setFocusedBodyId);
  const [textures, setTextures] = useState<BodyTextureSet>({});
  const angle = useRef(0);
  const meshRef = useRef<Mesh>(null);
  const moonR = earthRadius * 0.27;
  const dist = earthRadius * 3.2;

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
    });
    return () => {
      cancelled = true;
      disposeBodyTextures(loaded);
    };
  }, []);

  useFrame((_, dt) => {
    angle.current += dt * 0.15;
    if (meshRef.current) {
      meshRef.current.position.set(
        Math.cos(angle.current) * dist,
        0,
        Math.sin(angle.current) * dist
      );
      meshRef.current.rotation.y += dt * 0.2;
    }
  });

  return (
    <mesh
      ref={meshRef}
      onClick={(e) => {
        e.stopPropagation();
        setFocusedBodyId('moon');
      }}
    >
      <sphereGeometry args={[moonR, 96, 96]} />
      <meshStandardMaterial
        map={textures.map ?? null}
        bumpMap={textures.bump ?? textures.map ?? null}
        bumpScale={0.02}
        color={textures.map ? '#ffffff' : '#aaaaaa'}
        roughness={0.92}
        metalness={0.02}
      />
    </mesh>
  );
}

/**
 * Smoothly follow the focused body with OrbitControls target.
 */
export function SolarFocusController({
  controlsRef,
}: {
  controlsRef: MutableRefObject<SolarControlsHandle | null>;
}) {
  const focusedBodyId = useOpsStore((s) => s.focusedBodyId);
  const simTime = useSimClockStore((s) => s.simTime);
  const desired = useMemo(() => new Vector3(), []);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (!focusedBodyId || focusedBodyId === 'sun') {
      desired.set(0, 0, 0);
      controls.minDistance = 0.4;
      controls.maxDistance = 120;
    } else if (focusedBodyId === 'moon') {
      const earth = PLANETS.find((p) => p.id === 'earth')!;
      const [ex, ey, ez] = planetPositionAu(earth, simTime);
      const t = performance.now() * 0.00015;
      const dist = earth.displayRadius * 3.2;
      desired.set(ex + Math.cos(t) * dist, ey, ez + Math.sin(t) * dist);
      controls.minDistance = earth.displayRadius * 0.15;
      controls.maxDistance = 40;
    } else {
      const planet = PLANETS.find((p) => p.id === focusedBodyId);
      if (!planet) return;
      const [x, y, z] = planetPositionAu(planet, simTime);
      desired.set(x, y, z);
      controls.minDistance = Math.max(0.02, planet.displayRadius * 1.8);
      controls.maxDistance = 120;
    }

    controls.target.lerp(desired, 0.08);
    controls.update();
  });

  return null;
}

/**
 * Heliocentric solar-system map (Sun + planets). Free Three.js — no Cesium.
 */
export function SolarSystem() {
  const simTime = useSimClockStore((s) => s.simTime);
  const focusedBodyId = useOpsStore((s) => s.focusedBodyId);
  const setFocusedBodyId = useOpsStore((s) => s.setFocusedBodyId);
  const [textureMap, setTextureMap] = useState<
    Record<string, BodyTextureSet>
  >({});

  useEffect(() => {
    let cancelled = false;
    const loaded: Record<string, BodyTextureSet> = {};
    const ids = [
      'earth',
      'mars',
      'moon',
      'mercury',
      'venus',
      'jupiter',
      'saturn',
      'uranus',
      'neptune',
    ];

    Promise.all(
      ids.map(async (id) => {
        const set = await loadBodyTextures(id);
        loaded[id] = set;
        return [id, set] as const;
      })
    ).then((entries) => {
      if (cancelled) {
        for (const set of Object.values(loaded)) disposeBodyTextures(set);
        return;
      }
      setTextureMap(Object.fromEntries(entries));
    });

    return () => {
      cancelled = true;
      for (const set of Object.values(loaded)) disposeBodyTextures(set);
    };
  }, []);

  return (
    <group
      onPointerMissed={() => {
        setFocusedBodyId(null);
      }}
    >
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          setFocusedBodyId('sun');
        }}
      >
        <sphereGeometry args={[0.08, 64, 64]} />
        <meshStandardMaterial
          color="#ffcc66"
          emissive="#ff9900"
          emissiveIntensity={1.6}
        />
      </mesh>
      <pointLight color="#ffd27a" intensity={2.8} distance={100} decay={1.05} />
      <ambientLight intensity={0.45} />

      {PLANETS.map((p) => (
        <group key={p.id}>
          <OrbitRing planetId={p.id} />
          <PlanetBody
            planetId={p.id}
            simTime={simTime}
            textures={textureMap[p.id] ?? {}}
            focused={focusedBodyId === p.id}
          />
        </group>
      ))}
    </group>
  );
}
