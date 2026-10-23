import { useMemo } from 'react';
import { BufferGeometry, Float32BufferAttribute } from 'three';
import { useAgentStore } from '@/ui/stores/agentStore';
import { useSystemsStore } from '@/ui/stores/systemsStore';
import { eciToScene } from './utils/coordinateConversion';

function BeamLine({
  from,
  to,
}: {
  from: [number, number, number];
  to: [number, number, number];
}) {
  const geometry = useMemo(() => {
    const geo = new BufferGeometry();
    geo.setAttribute(
      'position',
      new Float32BufferAttribute([...from, ...to], 3)
    );
    return geo;
  }, [from, to]);

  return (
    <line>
      <primitive object={geometry} attach="geometry" />
      <lineBasicMaterial color="#fff200" />
    </line>
  );
}

/**
 * Transient LOS laser beams between shooter and target.
 */
export function LaserEffects() {
  const agents = useAgentStore((s) => s.agents);
  const beams = useSystemsStore((s) => s.activeBeams);

  const agentMap = useMemo(() => {
    return new Map(agents.map((a) => [a.id, a]));
  }, [agents]);

  return (
    <group>
      {beams.map((beam) => {
        const fromAgent = agentMap.get(beam.fromId);
        const toAgent = agentMap.get(beam.toId);
        if (!fromAgent || !toAgent) return null;
        const from = eciToScene(fromAgent.state.position);
        const to = eciToScene(toAgent.state.position);
        return <BeamLine key={beam.id} from={from} to={to} />;
      })}
    </group>
  );
}
