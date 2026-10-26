import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { InstancedMesh, Object3D, Color } from 'three';
import { useAgentStore } from '@/ui/stores/agentStore';
import { useSimClockStore } from '@/ui/stores/simClockStore';
import { useTaskStore } from '@/ui/stores/taskStore';
import { eciToScene } from './utils/coordinateConversion';
import { useOpsStore } from '@/ui/stores/opsStore';
import { useSystemsStore } from '@/ui/stores/systemsStore';
import { useRunRecorderStore } from '@/ui/stores/runRecorderStore';
import { stepAgents, ObjectiveType } from '@/sim/stepAgents';
import type { Agent } from './Agents.types';
import type { Objective } from '@/sim/tasks/types';

const tempObject = new Object3D();
const tempColor = new Color();

/**
 * Agents component using InstancedMesh for high-performance rendering.
 * Physics advances in fixed `timeStep` increments (FPS-independent).
 */
export function Agents() {
  const instancedMeshRef = useRef<InstancedMesh>(null);
  const { raycaster, camera, pointer, gl } = useThree();
  const { agents, updateAgentsBatch, selectAgent, hoverAgent, clearSelection } =
    useAgentStore();
  const { clockInstance, paused } = useSimClockStore();
  const fidelity = useOpsStore((s) => s.fidelity);
  const pruneBeams = useSystemsStore((s) => s.pruneBeams);
  const {
    objectives,
    updateObjective,
    completeObjective,
    updateTimer,
    timerRunning,
  } = useTaskStore();

  const lastSimTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (clockInstance) {
      lastSimTimeRef.current = clockInstance.getTime();
    } else {
      lastSimTimeRef.current = null;
    }
  }, [clockInstance]);

  useFrame(() => {
    if (!instancedMeshRef.current || agents.length === 0) return;

    if (clockInstance && !paused) {
      const currentSimTime = clockInstance.getTime();

      if (lastSimTimeRef.current === null) {
        lastSimTimeRef.current = currentSimTime;
        return;
      }

      const simDelta = currentSimTime - lastSimTimeRef.current;

      if (simDelta > 0) {
        const dt = clockInstance.getTimeStep();
        const numSteps = Math.max(1, Math.round(simDelta / dt));

        let workingAgents: Agent[] = agents.map((a) => ({
          ...a,
          state: {
            position: [...a.state.position] as [number, number, number],
            velocity: [...a.state.velocity] as [number, number, number],
          },
        }));
        let workingObjectives: Objective[] = objectives.map((o) => ({ ...o }));

        for (let stepIdx = 0; stepIdx < numSteps; stepIdx++) {
          const stepSimTime = lastSimTimeRef.current + (stepIdx + 1) * dt;
          const result = stepAgents(
            workingAgents,
            workingObjectives,
            dt,
            stepSimTime,
            fidelity
          );
          workingAgents = result.agents;
          workingObjectives = result.objectives;

          for (const id of result.newlyCompleted) {
            completeObjective(id);
          }

          useRunRecorderStore
            .getState()
            .maybeSample(workingAgents, stepSimTime);
        }

        pruneBeams(currentSimTime);

        // Sync objective assignments / completion back to store
        for (const obj of workingObjectives) {
          const currentObj = objectives.find((o) => o.id === obj.id);
          if (!currentObj) continue;
          const updates: Partial<Objective> = {};
          if (obj.completed !== currentObj.completed) {
            updates.completed = obj.completed;
          }
          if (
            obj.type === ObjectiveType.RELAY_NODE &&
            currentObj.type === ObjectiveType.RELAY_NODE
          ) {
            const relayObj = obj as Extract<
              Objective,
              { type: typeof ObjectiveType.RELAY_NODE }
            >;
            const currentRelay = currentObj as typeof relayObj;
            if (relayObj.assignedAgentId !== currentRelay.assignedAgentId) {
              (updates as { assignedAgentId?: string | null }).assignedAgentId =
                relayObj.assignedAgentId;
            }
            if (relayObj.startTime !== currentRelay.startTime) {
              (updates as { startTime?: number | null }).startTime =
                relayObj.startTime;
            }
          }
          if (
            obj.type === ObjectiveType.HOLD_FORMATION_ZONE &&
            currentObj.type === ObjectiveType.HOLD_FORMATION_ZONE
          ) {
            const zone = obj as Extract<
              Objective,
              { type: typeof ObjectiveType.HOLD_FORMATION_ZONE }
            >;
            const currentZone = currentObj as typeof zone;
            const currentIds = JSON.stringify(
              [...currentZone.assignedAgentIds].sort()
            );
            const newIds = JSON.stringify([...zone.assignedAgentIds].sort());
            if (currentIds !== newIds) {
              (
                updates as { assignedAgentIds?: string[] }
              ).assignedAgentIds = zone.assignedAgentIds;
            }
          }
          if (Object.keys(updates).length > 0) {
            updateObjective(obj.id, updates);
          }
        }

        updateAgentsBatch(
          workingAgents.map((a) => ({ id: a.id, state: a.state }))
        );

        if (timerRunning) {
          updateTimer(simDelta);
        }

        lastSimTimeRef.current = currentSimTime;
      }
    }

    agents.forEach((agent, index) => {
      const scenePos = eciToScene(agent.state.position);

      tempObject.position.set(scenePos[0], scenePos[1], scenePos[2]);

      const scale = agent.selected ? 1.5 : agent.hovered ? 1.2 : 1.0;
      tempObject.scale.set(scale, scale, scale);

      tempObject.updateMatrix();
      instancedMeshRef.current!.setMatrixAt(index, tempObject.matrix);

      if (agent.selected) {
        tempColor.set('#fff200');
      } else if (agent.hovered) {
        tempColor.set('#ff6b4a');
      } else {
        tempColor.set(agent.team === 'friendly' ? '#e10600' : '#e8e8e8');
      }
      instancedMeshRef.current!.setColorAt(index, tempColor);
    });

    instancedMeshRef.current!.instanceMatrix.needsUpdate = true;
    if (instancedMeshRef.current!.instanceColor) {
      instancedMeshRef.current!.instanceColor.needsUpdate = true;
    }
  });

  useEffect(() => {
    const handleClick = () => {
      if (!instancedMeshRef.current) return;

      raycaster.setFromCamera(pointer, camera);

      const intersects = raycaster.intersectObject(instancedMeshRef.current);

      if (intersects.length > 0) {
        const intersection = intersects[0]!;
        if (intersection.instanceId !== undefined) {
          const agentId = agents[intersection.instanceId]?.id;
          if (agentId) {
            selectAgent(agentId);
          }
        }
      } else {
        clearSelection();
      }
    };

    gl.domElement.addEventListener('click', handleClick);
    return () => {
      gl.domElement.removeEventListener('click', handleClick);
    };
  }, [agents, raycaster, camera, pointer, gl, selectAgent, clearSelection]);

  useFrame(() => {
    if (!instancedMeshRef.current || agents.length === 0) return;

    raycaster.setFromCamera(pointer, camera);

    const intersects = raycaster.intersectObject(instancedMeshRef.current);

    if (intersects.length > 0) {
      const intersection = intersects[0]!;
      if (intersection.instanceId !== undefined) {
        const agentId = agents[intersection.instanceId]?.id;
        if (agentId) {
          hoverAgent(agentId);
        }
      }
    } else {
      hoverAgent(null);
    }
  });

  useEffect(() => {
    if (instancedMeshRef.current && agents.length > 0) {
      instancedMeshRef.current.count = agents.length;
    }
  }, [agents.length]);

  if (agents.length === 0) return null;

  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[undefined, undefined, agents.length]}
    >
      <boxGeometry args={[0.02, 0.02, 0.02]} />
      <meshStandardMaterial vertexColors={true} emissiveIntensity={0.5} />
    </instancedMesh>
  );
}
