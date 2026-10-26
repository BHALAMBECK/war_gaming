/**
 * One fixed physics step for the agent fleet (orbit + swarm + optional tasks).
 */

import type { Agent } from '@/render/Agents.types';
import type { FidelityLevel } from '@/sim/orbit/fidelity';
import { propagateOrbitBatch } from '@/sim/orbit/propagator';
import {
  computeSwarmForces,
  enforceMinimumSeparation,
  DEFAULT_BEHAVIOR_PARAMS,
} from '@/sim/swarm';
import { allocateTasks, updateObjectiveState } from '@/sim/tasks/allocation';
import { computeObjectiveSteeringBatch } from '@/sim/tasks/steering';
import {
  DEFAULT_OBJECTIVE_STEERING_PARAMS,
  ObjectiveType,
  type Objective,
} from '@/sim/tasks/types';

export interface StepAgentsResult {
  agents: Agent[];
  objectives: Objective[];
  newlyCompleted: string[];
}

/**
 * Advance all agents by one fixed `dt` seconds.
 * Selected agents skip swarm/task steering (player-controlled).
 */
export function stepAgents(
  agents: Agent[],
  objectives: Objective[],
  dt: number,
  simTime: number,
  fidelity: FidelityLevel
): StepAgentsResult {
  if (agents.length === 0 || dt <= 0) {
    return { agents, objectives, newlyCompleted: [] };
  }

  const playerControlledIds = new Set(
    agents.filter((a) => a.selected).map((a) => a.id)
  );
  const playerControlledAgents = agents.filter((a) =>
    playerControlledIds.has(a.id)
  );
  const autoAgents = agents.filter((a) => !playerControlledIds.has(a.id));

  const playerStates = playerControlledAgents.map((a) => a.state);
  const propagatedPlayerStates = propagateOrbitBatch(
    playerStates,
    dt,
    fidelity
  );

  const objectivesWorking = objectives.map((obj) => ({ ...obj }));
  let propagatedAutoStates = autoAgents.map((a) => a.state);

  if (objectivesWorking.length > 0 && autoAgents.length > 0) {
    allocateTasks(autoAgents, objectivesWorking);

    const autoStates = autoAgents.map((a) => a.state);
    const objectiveAdjustments = computeObjectiveSteeringBatch(
      autoAgents,
      objectivesWorking,
      DEFAULT_OBJECTIVE_STEERING_PARAMS
    );
    const swarmAdjustments = computeSwarmForces(
      autoAgents,
      DEFAULT_BEHAVIOR_PARAMS,
      dt
    );
    const velocityAdjustments = swarmAdjustments.map((swarmAdj, index) => {
      const objAdj = objectiveAdjustments[index]!;
      return {
        delta: [
          swarmAdj.delta[0] + objAdj.delta[0],
          swarmAdj.delta[1] + objAdj.delta[1],
          swarmAdj.delta[2] + objAdj.delta[2],
        ] as [number, number, number],
      };
    });
    enforceMinimumSeparation(agents, velocityAdjustments, DEFAULT_BEHAVIOR_PARAMS);

    const adjustedStates = autoStates.map((state, index) => {
      const adjustment = velocityAdjustments[index]!;
      const [vx, vy, vz] = state.velocity;
      const [dvx, dvy, dvz] = adjustment.delta;
      return {
        position: state.position,
        velocity: [vx + dvx * dt, vy + dvy * dt, vz + dvz * dt] as [
          number,
          number,
          number,
        ],
      };
    });
    propagatedAutoStates = propagateOrbitBatch(adjustedStates, dt, fidelity);
  } else if (autoAgents.length > 0) {
    const autoStates = autoAgents.map((a) => a.state);
    const velocityAdjustments = computeSwarmForces(
      autoAgents,
      DEFAULT_BEHAVIOR_PARAMS,
      dt
    );
    enforceMinimumSeparation(
      autoAgents,
      velocityAdjustments,
      DEFAULT_BEHAVIOR_PARAMS
    );
    const adjustedStates = autoStates.map((state, index) => {
      const adjustment = velocityAdjustments[index]!;
      const [vx, vy, vz] = state.velocity;
      const [dvx, dvy, dvz] = adjustment.delta;
      return {
        position: state.position,
        velocity: [vx + dvx * dt, vy + dvy * dt, vz + dvz * dt] as [
          number,
          number,
          number,
        ],
      };
    });
    propagatedAutoStates = propagateOrbitBatch(adjustedStates, dt, fidelity);
  }

  const nextById = new Map<string, Agent>();
  playerControlledAgents.forEach((agent, index) => {
    nextById.set(agent.id, {
      ...agent,
      state: propagatedPlayerStates[index]!,
    });
  });
  autoAgents.forEach((agent, index) => {
    nextById.set(agent.id, {
      ...agent,
      state: propagatedAutoStates[index]!,
    });
  });
  const nextAgents = agents.map((a) => nextById.get(a.id) ?? a);

  let newlyCompleted: string[] = [];
  if (objectivesWorking.length > 0) {
    newlyCompleted = updateObjectiveState(
      objectivesWorking,
      nextAgents,
      simTime
    );
  }

  return {
    agents: nextAgents,
    objectives: objectivesWorking,
    newlyCompleted,
  };
}

/** Re-export for callers that patch relay fields */
export { ObjectiveType };
