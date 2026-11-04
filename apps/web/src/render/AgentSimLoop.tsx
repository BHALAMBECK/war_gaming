/**
 * Fixed-step agent physics loop — always mounted so all bodies advance
 * regardless of which body-local / overview scene is visible.
 */

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAgentStore } from '@/ui/stores/agentStore';
import { useSimClockStore } from '@/ui/stores/simClockStore';
import { useTaskStore } from '@/ui/stores/taskStore';
import { useOpsStore } from '@/ui/stores/opsStore';
import { useSystemsStore } from '@/ui/stores/systemsStore';
import { useRunRecorderStore } from '@/ui/stores/runRecorderStore';
import { stepAgents, ObjectiveType } from '@/sim/stepAgents';
import type { Agent } from './Agents.types';
import type { Objective } from '@/sim/tasks/types';

export function AgentSimLoop() {
  const { agents, updateAgentsBatch } = useAgentStore();
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
    if (agents.length === 0) return;
    if (!clockInstance || paused) return;

    const currentSimTime = clockInstance.getTime();

    if (lastSimTimeRef.current === null) {
      lastSimTimeRef.current = currentSimTime;
      return;
    }

    const simDelta = currentSimTime - lastSimTimeRef.current;
    if (simDelta <= 0) return;

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

      useRunRecorderStore.getState().maybeSample(workingAgents, stepSimTime);
    }

    pruneBeams(currentSimTime);

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
          (updates as { assignedAgentIds?: string[] }).assignedAgentIds =
            zone.assignedAgentIds;
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
  });

  return null;
}
