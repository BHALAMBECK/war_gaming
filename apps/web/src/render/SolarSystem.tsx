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
import { useAgentStore } from '@/ui/stores/agentStore';
import { PLANETS, planetPositionAu, sampleOrbitAu } from '@/sim/solar/planets';
import {
  loadBodyTextures,
  releaseBodyTextures,
  type BodyTextureSet,
} from './textures/planetTextures';
import type { CentralBody } from '@/sim/orbit/bodies';

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
    planetId === 'mars' ? 0.035 : planetId === 'earth' ? 0.012 : 0.01;

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
    loadBodyTextures('moon').then((set) => {
      if (cancelled) return;
      setTextures(set);
    });
    return () => {
      cancelled = true;
      releaseBodyTextures('moon');
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
      meshRef.current.rotation.y += dt * 0.04;
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
 * LOD sat markers near Earth / Moon / Mars in the schematic overview.
 */
function OverviewSatMarkers({ simTime }: { simTime: number }) {
  const agents = useAgentStore((s) => s.agents);
  const selectAgent = useAgentStore((s) => s.selectAgent);
  const setViewMode = useOpsStore((s) => s.setViewMode);

  const byBody = useMemo(() => {
    const groups: Record<CentralBody, typeof agents> = {
      earth: [],
      moon: [],
      mars: [],
    };
    for (const a of agents) {
      const body = (a.centralBody ?? 'earth') as CentralBody;
      if (body in groups) groups[body].push(a);
    }
    return groups;
  }, [agents]);

  const markers = useMemo(() => {
    const out: {
      id: string;
      x: number;
      y: number;
      z: number;
      body: CentralBody;
      hero: boolean;
      friendly: boolean;
    }[] = [];

    const earth = PLANETS.find((p) => p.id === 'earth')!;
    const mars = PLANETS.find((p) => p.id === 'mars')!;
    const [ex, ey, ez] = planetPositionAu(earth, simTime);
    const [mx, my, mz] = planetPositionAu(mars, simTime);
    const moonDist = earth.displayRadius * 3.2;
    const moonAngle = simTime * 0.00002;
    const moonPos: [number, number, number] = [
      ex + Math.cos(moonAngle) * moonDist,
      ey,
      ez + Math.sin(moonAngle) * moonDist,
    ];

    const place = (
      body: CentralBody,
      center: [number, number, number],
      displayR: number
    ) => {
      const list = byBody[body];
      list.forEach((agent, i) => {
        const n = Math.max(1, list.length);
        const ang = (i / n) * Math.PI * 2;
        const ring = displayR * (1.6 + (i % 3) * 0.25);
        out.push({
          id: agent.id,
          x: center[0] + Math.cos(ang) * ring,
          y: center[1] + Math.sin(ang * 0.7) * ring * 0.15,
          z: center[2] + Math.sin(ang) * ring,
          body,
          hero: agent.visualRole === 'hero',
          friendly: agent.team === 'friendly',
        });
      });
    };

    place('earth', [ex, ey, ez], earth.displayRadius);
    place('moon', moonPos, earth.displayRadius * 0.27);
    place('mars', [mx, my, mz], mars.displayRadius);
    return out;
  }, [byBody, simTime]);

  if (markers.length === 0) return null;

  return (
    <group>
      {markers.map((m) => (
        <mesh
          key={m.id}
          position={[m.x, m.y, m.z]}
          onClick={(e) => {
            e.stopPropagation();
            selectAgent(m.id);
            setViewMode(m.body);
          }}
        >
          <sphereGeometry args={[m.hero ? 0.012 : 0.006, 8, 8]} />
          <meshBasicMaterial
            color={
              m.hero ? '#c4a574' : m.friendly ? '#3b82f6' : '#e10600'
            }
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
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
        return [id, set] as const;
      })
    ).then((entries) => {
      if (cancelled) return;
      setTextureMap(Object.fromEntries(entries));
    });

    return () => {
      cancelled = true;
      for (const id of ids) releaseBodyTextures(id);
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
      {/* Soft solar glow */}
      <mesh scale={2.4}>
        <sphereGeometry args={[0.08, 32, 32]} />
        <meshBasicMaterial
          color="#ffaa44"
          transparent
          opacity={0.18}
          depthWrite={false}
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
      <OverviewSatMarkers simTime={simTime} />
    </group>
  );
}
