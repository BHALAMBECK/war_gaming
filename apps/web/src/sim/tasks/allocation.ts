/**
 * Task allocation logic: assigns agents to objectives.
 */

import { Agent } from '@/render/Agents.types';
import { Objective, ObjectiveType, InspectPointObjective, RelayNodeObjective, HoldFormationZoneObjective } from './types';

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
 * Find the nearest agent to a given position that is not already assigned.
 */
function findNearestAgent(
  agents: Agent[],
  position: [number, number, number],
  excludeAgentIds: Set<string> = new Set()
): Agent | null {
  let nearestAgent: Agent | null = null;
  let nearestDistance = Infinity;
  
  for (const agent of agents) {
    if (excludeAgentIds.has(agent.id)) continue;
    
    const dist = distance(agent.state.position, position);
    if (dist < nearestDistance) {
      nearestDistance = dist;
      nearestAgent = agent;
    }
  }
  
  return nearestAgent;
}

/**
 * Find agents within a given radius of a position.
 */
function findAgentsInRadius(
  agents: Agent[],
  position: [number, number, number],
  radius: number,
  excludeAgentIds: Set<string> = new Set()
): Agent[] {
  return agents.filter((agent) => {
    if (excludeAgentIds.has(agent.id)) return false;
    return distance(agent.state.position, position) <= radius;
  });
}

/**
 * Allocate tasks to agents.
 * Updates objectives with assigned agent IDs.
 * 
 * @param agents Array of agents
 * @param objectives Array of objectives (will be mutated to update assignments)
 */
export function allocateTasks(agents: Agent[], objectives: Objective[]): void {
  // Track which agents are already assigned
  const assignedAgentIds = new Set<string>();
  
  // Process each objective
  for (const objective of objectives) {
    if (objective.completed) continue; // Skip completed objectives
    
    switch (objective.type) {
      case ObjectiveType.INSPECT_POINT: {
        const inspectObj = objective as InspectPointObjective;
        // Assign nearest unassigned agent
        const nearest = findNearestAgent(agents, inspectObj.position, assignedAgentIds);
        if (nearest) {
          // For inspect points, we don't track assignment in the objective
          // but we mark the agent as "interested" for steering purposes
          assignedAgentIds.add(nearest.id);
        }
        break;
      }
      
      case ObjectiveType.RELAY_NODE: {
        const relayObj = objective as RelayNodeObjective;
        // If already assigned and agent still exists, keep assignment
        if (relayObj.assignedAgentId) {
          const assignedAgent = agents.find((a) => a.id === relayObj.assignedAgentId);
          if (assignedAgent) {
            assignedAgentIds.add(relayObj.assignedAgentId);
            continue; // Keep existing assignment
          } else {
            // Agent no longer exists, clear assignment
            relayObj.assignedAgentId = null;
          }
        }
        
        // Assign nearest unassigned agent
        const nearest = findNearestAgent(agents, relayObj.position, assignedAgentIds);
        if (nearest) {
          relayObj.assignedAgentId = nearest.id;
          assignedAgentIds.add(nearest.id);
        }
        break;
      }
      
      case ObjectiveType.HOLD_FORMATION_ZONE: {
        const zoneObj = objective as HoldFormationZoneObjective;
        // Clear invalid assignments (agents that no longer exist)
        zoneObj.assignedAgentIds = zoneObj.assignedAgentIds.filter((id) =>
          agents.some((a) => a.id === id)
        );
        
        // Find agents already in the zone that are assigned
        const agentsInZone = findAgentsInRadius(
          agents,
          zoneObj.position,
          zoneObj.radius
        );
        
        // Add agents in zone to assigned list
        for (const agent of agentsInZone) {
          if (!zoneObj.assignedAgentIds.includes(agent.id)) {
            zoneObj.assignedAgentIds.push(agent.id);
          }
          assignedAgentIds.add(agent.id);
        }
        
        // If we need more agents, assign nearest unassigned agents
        const neededAgents = zoneObj.requiredAgents - zoneObj.assignedAgentIds.length;
        if (neededAgents > 0) {
          for (let i = 0; i < neededAgents; i++) {
            const nearest = findNearestAgent(agents, zoneObj.position, assignedAgentIds);
            if (nearest) {
              zoneObj.assignedAgentIds.push(nearest.id);
              assignedAgentIds.add(nearest.id);
            } else {
              break; // No more agents available
            }
          }
        }
        break;
      }
    }
  }
}

/**
 * Update objective states based on agent positions and check for completion.
 * 
 * @param objectives Array of objectives (will be mutated)
 * @param agents Array of agents
 * @param simTime Current simulation time in seconds
 * @returns Array of objective IDs that were just completed
 */
export function updateObjectiveState(
  objectives: Objective[],
  agents: Agent[],
  simTime: number
): string[] {
  const newlyCompleted: string[] = [];
  
  for (const objective of objectives) {
    if (objective.completed) continue;
    
    switch (objective.type) {
      case ObjectiveType.INSPECT_POINT: {
        const inspectObj = objective as InspectPointObjective;
        // Check if any agent is within distance threshold
        for (const agent of agents) {
          const dist = distance(agent.state.position, inspectObj.position);
          if (dist <= inspectObj.threshold) {
            // Check velocity threshold if specified (default: 10 m/s)
            const vThreshold = inspectObj.vThreshold ?? 10;
            
            // Calculate relative velocity magnitude
            const [ax, ay, az] = agent.state.position;
            const [ox, oy, oz] = inspectObj.position;
            const [vx, vy, vz] = agent.state.velocity;
            
            // For inspection, we check if the agent is moving slowly relative to the objective
            // (assuming objective is stationary, so agent velocity magnitude is relative speed)
            const relativeSpeed = Math.sqrt(vx * vx + vy * vy + vz * vz);
            
            if (relativeSpeed <= vThreshold) {
              inspectObj.completed = true;
              newlyCompleted.push(inspectObj.id);
              break;
            }
          }
        }
        break;
      }
      
      case ObjectiveType.RELAY_NODE: {
        const relayObj = objective as RelayNodeObjective;
        if (!relayObj.assignedAgentId) break;
        
        const assignedAgent = agents.find((a) => a.id === relayObj.assignedAgentId);
        if (!assignedAgent) {
          // Agent no longer exists, reset
          relayObj.assignedAgentId = null;
          relayObj.startTime = null;
          break;
        }
        
        const dist = distance(assignedAgent.state.position, relayObj.position);
        if (dist <= relayObj.threshold) {
          // Agent is within threshold
          if (relayObj.startTime === null) {
            relayObj.startTime = simTime;
          } else {
            // Check if hold duration has elapsed
            const elapsed = simTime - relayObj.startTime;
            if (elapsed >= relayObj.holdDuration) {
              relayObj.completed = true;
              newlyCompleted.push(relayObj.id);
            }
          }
        } else {
          // Agent moved outside threshold, reset timer
          relayObj.startTime = null;
        }
        break;
      }
      
      case ObjectiveType.HOLD_FORMATION_ZONE: {
        const zoneObj = objective as HoldFormationZoneObjective;
        // Count agents currently in zone
        const agentsInZone = findAgentsInRadius(
          agents,
          zoneObj.position,
          zoneObj.radius
        );
        
        // Check if we have enough agents in zone
        if (agentsInZone.length >= zoneObj.requiredAgents) {
          zoneObj.completed = true;
          newlyCompleted.push(zoneObj.id);
        }
        break;
      }
    }
  }
  
  return newlyCompleted;
}
