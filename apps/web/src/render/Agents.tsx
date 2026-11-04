/**
 * Body-local constellation + hero rendering (physics lives in AgentSimLoop).
 */

import { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { InstancedMesh, Object3D, Color, Mesh } from 'three';
import { useAgentStore } from '@/ui/stores/agentStore';
import { bodyToScene } from './utils/coordinateConversion';
import { getBodyParams, type CentralBody } from '@/sim/orbit/bodies';
import {
  createConstellationGeometry,
  createHeroGeometry,
  TEAM_COLOR_ENEMY,
  TEAM_COLOR_FRIENDLY,
  TEAM_COLOR_HOVERED,
  TEAM_COLOR_SELECTED,
  HERO_ACCENT,
} from './satelliteMeshes';

const tempObject = new Object3D();
const tempColor = new Color();

export interface AgentsProps {
  /** Only draw agents for this central body (required for body-local views). */
  centralBody: CentralBody;
}

/**
 * Agents component using InstancedMesh for constellation sats + discrete hero meshes.
 */
export function Agents({ centralBody }: AgentsProps) {
  const instancedMeshRef = useRef<InstancedMesh>(null);
  const heroMeshRef = useRef<Mesh>(null);
  const { raycaster, camera, pointer, gl } = useThree();
  const { agents, selectAgent, hoverAgent, clearSelection } = useAgentStore();

  const bodyRadius = getBodyParams(centralBody).radius;

  const constellationAgents = useMemo(
    () =>
      agents.filter(
        (a) =>
          (a.centralBody ?? 'earth') === centralBody &&
          (a.visualRole ?? 'constellation') !== 'hero'
      ),
    [agents, centralBody]
  );

  const heroAgents = useMemo(
    () =>
      agents.filter(
        (a) =>
          (a.centralBody ?? 'earth') === centralBody &&
          a.visualRole === 'hero'
      ),
    [agents, centralBody]
  );

  const satGeometry = useMemo(() => createConstellationGeometry(), []);
  const heroGeometry = useMemo(() => createHeroGeometry(), []);

  useEffect(() => {
    return () => {
      satGeometry.dispose();
      heroGeometry.dispose();
    };
  }, [satGeometry, heroGeometry]);

  useEffect(() => {
    if (instancedMeshRef.current) {
      instancedMeshRef.current.count = constellationAgents.length;
    }
  }, [constellationAgents.length]);

  useFrame(() => {
    if (instancedMeshRef.current && constellationAgents.length > 0) {
      constellationAgents.forEach((agent, index) => {
        const scenePos = bodyToScene(agent.state.position, bodyRadius);
        tempObject.position.set(scenePos[0], scenePos[1], scenePos[2]);
        const scale = agent.selected ? 1.5 : agent.hovered ? 1.2 : 1.0;
        tempObject.scale.set(scale, scale, scale);
        tempObject.updateMatrix();
        instancedMeshRef.current!.setMatrixAt(index, tempObject.matrix);

        if (agent.selected) {
          tempColor.set(TEAM_COLOR_SELECTED);
        } else if (agent.hovered) {
          tempColor.set(TEAM_COLOR_HOVERED);
        } else {
          tempColor.set(
            agent.team === 'friendly' ? TEAM_COLOR_FRIENDLY : TEAM_COLOR_ENEMY
          );
        }
        instancedMeshRef.current!.setColorAt(index, tempColor);
      });
      instancedMeshRef.current.instanceMatrix.needsUpdate = true;
      if (instancedMeshRef.current.instanceColor) {
        instancedMeshRef.current.instanceColor.needsUpdate = true;
      }
    }

    // Single hero showcase (first hero for this body)
    const hero = heroAgents[0];
    if (heroMeshRef.current && hero) {
      const scenePos = bodyToScene(hero.state.position, bodyRadius);
      heroMeshRef.current.position.set(scenePos[0], scenePos[1], scenePos[2]);
      const scale = hero.selected ? 1.35 : hero.hovered ? 1.15 : 1.0;
      heroMeshRef.current.scale.setScalar(scale);
      heroMeshRef.current.visible = true;
    } else if (heroMeshRef.current) {
      heroMeshRef.current.visible = false;
    }
  });

  useEffect(() => {
    const handleClick = () => {
      raycaster.setFromCamera(pointer, camera);

      if (heroMeshRef.current?.visible) {
        const heroHits = raycaster.intersectObject(heroMeshRef.current);
        if (heroHits.length > 0 && heroAgents[0]) {
          selectAgent(heroAgents[0].id);
          return;
        }
      }

      if (instancedMeshRef.current && constellationAgents.length > 0) {
        const intersects = raycaster.intersectObject(instancedMeshRef.current);
        if (intersects.length > 0) {
          const intersection = intersects[0]!;
          if (intersection.instanceId !== undefined) {
            const agentId = constellationAgents[intersection.instanceId]?.id;
            if (agentId) {
              selectAgent(agentId);
              return;
            }
          }
        }
      }

      clearSelection();
    };

    gl.domElement.addEventListener('click', handleClick);
    return () => {
      gl.domElement.removeEventListener('click', handleClick);
    };
  }, [
    constellationAgents,
    heroAgents,
    raycaster,
    camera,
    pointer,
    gl,
    selectAgent,
    clearSelection,
  ]);

  useFrame(() => {
    raycaster.setFromCamera(pointer, camera);

    if (heroMeshRef.current?.visible) {
      const heroHits = raycaster.intersectObject(heroMeshRef.current);
      if (heroHits.length > 0 && heroAgents[0]) {
        hoverAgent(heroAgents[0].id);
        return;
      }
    }

    if (instancedMeshRef.current && constellationAgents.length > 0) {
      const intersects = raycaster.intersectObject(instancedMeshRef.current);
      if (intersects.length > 0) {
        const intersection = intersects[0]!;
        if (intersection.instanceId !== undefined) {
          const agentId = constellationAgents[intersection.instanceId]?.id;
          if (agentId) {
            hoverAgent(agentId);
            return;
          }
        }
      }
    }

    hoverAgent(null);
  });

  if (constellationAgents.length === 0 && heroAgents.length === 0) {
    return null;
  }

  return (
    <group>
      {constellationAgents.length > 0 && (
        <instancedMesh
          ref={instancedMeshRef}
          args={[satGeometry, undefined, Math.max(1, constellationAgents.length)]}
        >
          <meshStandardMaterial
            metalness={0.35}
            roughness={0.4}
            toneMapped={true}
          />
        </instancedMesh>
      )}
      <mesh ref={heroMeshRef} geometry={heroGeometry} visible={false}>
        <meshStandardMaterial
          color={HERO_ACCENT}
          metalness={0.45}
          roughness={0.35}
          emissive="#22180c"
          emissiveIntensity={0.15}
        />
      </mesh>
    </group>
  );
}
