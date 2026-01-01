/**
 * Objective steering behavior: computes velocity adjustments for agents to move toward objectives.
 */

import { Agent } from '@/render/Agents.types';
import { Objective, ObjectiveType, InspectPointObjective, RelayNodeObjective, HoldFormationZoneObjective, ObjectiveSteeringParams, DEFAULT_OBJECTIVE_STEERING_PARAMS } from './types';
import { VelocityAdjustment } from '@/sim/swarm/types';

/**
 * Calculate distance between two 3D points.
 */
function distance(
  pos1: [number, number, number],
  pos2: [number, number, number]
): number {
  const dx = pos2[0] - pos1[0];
  const dy = pos2[1] - pos1[1];
  const dz = pos2[2] - pos1[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Compute objective steering for a single agent.
 * Returns velocity adjustment in ECI frame.
 * 
 * @param agent Agent to compute steering for
 * @param objectives Array of all objectives
 * @param params Steering parameters
 * @returns Velocity adjustment [vx, vy, vz] in m/s
 */
export function computeObjectiveSteering(
  agent: Agent,
  objectives: Objective[],
  params: ObjectiveSteeringParams = DEFAULT_OBJECTIVE_STEERING_PARAMS
): VelocityAdjustment {
  // Find objective assigned to this agent
  let targetObjective: Objective | null = null;
  
  for (const objective of objectives) {
    if (objective.completed) continue;
    
    switch (objective.type) {
      case ObjectiveType.INSPECT_POINT: {
        // For inspect points, find the nearest uncompleted objective
        // Any agent can complete an inspect point, so we just steer toward the nearest one
        const inspectObj = objective as InspectPointObjective;
        const dist = distance(agent.state.position, inspectObj.position);
        if (!targetObjective) {
          targetObjective = objective;
        } else {
          // Choose closer objective
          const currentDist = distance(agent.state.position, targetObjective.position);
          if (dist < currentDist) {
            targetObjective = objective;
          }
        }
        break;
      }
      
      case ObjectiveType.RELAY_NODE: {
        const relayObj = objective as RelayNodeObjective;
        if (relayObj.assignedAgentId === agent.id) {
          targetObjective = objective;
        }
        break;
      }
      
      case ObjectiveType.HOLD_FORMATION_ZONE: {
        const zoneObj = objective as HoldFormationZoneObjective;
        if (zoneObj.assignedAgentIds.includes(agent.id)) {
          targetObjective = objective;
        }
        break;
      }
    }
  }
  
  // If no target objective found, return zero adjustment
  if (!targetObjective) {
    return { delta: [0, 0, 0] };
  }
  
  // Compute direction vector from agent to objective
  const [ax, ay, az] = agent.state.position;
  const [ox, oy, oz] = targetObjective.position;
  
  const dx = ox - ax;
  const dy = oy - ay;
  const dz = oz - az;
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
  
  if (dist < 1e-6) {
    // Already at target
    return { delta: [0, 0, 0] };
  }
  
  // Normalize direction
  const dirX = dx / dist;
  const dirY = dy / dist;
  const dirZ = dz / dist;
  
  // Scale by objective weight
  const weight = params.objectiveWeight;
  
  return {
    delta: [
      dirX * weight,
      dirY * weight,
      dirZ * weight,
    ],
  };
}

/**
 * Compute objective steering for all agents.
 * 
 * @param agents Array of agents
 * @param objectives Array of objectives
 * @param params Steering parameters
 * @returns Array of velocity adjustments (one per agent)
 */
export function computeObjectiveSteeringBatch(
  agents: Agent[],
  objectives: Objective[],
  params: ObjectiveSteeringParams = DEFAULT_OBJECTIVE_STEERING_PARAMS
): VelocityAdjustment[] {
  return agents.map((agent) => computeObjectiveSteering(agent, objectives, params));
}
