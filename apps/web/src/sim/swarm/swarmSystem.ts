/**
 * Main swarm behavior system.
 * Computes velocity adjustments for agents based on behaviors and formations.
 */

import { Agent } from '@/render/Agents.types';
import {
  LocalFrameState,
  BehaviorParams,
  DEFAULT_BEHAVIOR_PARAMS,
  VelocityAdjustment,
} from './types';
import {
  computeLocalFrame,
  eciToLocalFrame,
  localFrameToEci,
  computeCentroid,
} from './localFrame';
import { computeCohesion, computeSeparation, computeAlignment } from './behaviors';
import { getFormationTarget } from './formations';

/**
 * Compute velocity adjustments for all agents based on swarm behaviors.
 * @param agents Array of agents with their current states and behaviors
 * @param params Behavior parameters (uses defaults if not provided)
 * @param deltaTime Time step in seconds
 * @returns Array of velocity adjustments in ECI frame (one per agent)
 */
export function computeSwarmForces(
  agents: Agent[],
  params: BehaviorParams = DEFAULT_BEHAVIOR_PARAMS,
  deltaTime: number
): VelocityAdjustment[] {
  if (agents.length === 0) {
    return [];
  }
  
  // Group agents by formation type (for now, assume all agents in same group)
  // Future: could support multiple formation groups
  const activeAgents = agents.filter((agent) => {
    const b = agent.behaviors;
    return b.cohesion || b.separation || b.alignment || b.formation;
  });
  
  if (activeAgents.length === 0) {
    // No active behaviors, return zero adjustments
    return agents.map(() => ({ delta: [0, 0, 0] }));
  }
  
  // Compute formation centroid (reference point for local frame)
  const centroidState = computeCentroid(activeAgents.map((a) => a.state));
  const localFrame = computeLocalFrame(centroidState);
  
  // Convert all agents to local frame
  const localStates: LocalFrameState[] = activeAgents.map((agent) =>
    eciToLocalFrame(agent.state, localFrame)
  );
  
  // Compute velocity adjustments for each agent
  const adjustments: VelocityAdjustment[] = [];
  
  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i]!;
    const behaviors = agent.behaviors;
    
    // Check if this agent has any active behaviors
    if (!behaviors.cohesion && !behaviors.separation && !behaviors.alignment && !behaviors.formation) {
      adjustments.push({ delta: [0, 0, 0] });
      continue;
    }
    
    // Find this agent in active agents list
    const activeIndex = activeAgents.findIndex((a) => a.id === agent.id);
    if (activeIndex === -1) {
      adjustments.push({ delta: [0, 0, 0] });
      continue;
    }
    
    const localState = localStates[activeIndex]!;
    
    // Initialize velocity adjustment in local frame
    let velAdjustLocal: [number, number, number] = [0, 0, 0];
    
    // Apply cohesion behavior
    if (behaviors.cohesion) {
      const cohesion = computeCohesion(localStates, activeIndex, localFrame, params);
      velAdjustLocal[0] += cohesion[0]!;
      velAdjustLocal[1] += cohesion[1]!;
      velAdjustLocal[2] += cohesion[2]!;
    }
    
    // Apply separation behavior (includes basic collision avoidance)
    if (behaviors.separation) {
      const separation = computeSeparation(localStates, activeIndex, localFrame, params);
      velAdjustLocal[0] += separation[0]!;
      velAdjustLocal[1] += separation[1]!;
      velAdjustLocal[2] += separation[2]!;
    }
    
    // Apply alignment behavior
    if (behaviors.alignment) {
      const alignment = computeAlignment(localStates, activeIndex, localFrame, params);
      velAdjustLocal[0] += alignment[0]!;
      velAdjustLocal[1] += alignment[1]!;
      velAdjustLocal[2] += alignment[2]!;
    }
    
    // Apply formation steering
    if (behaviors.formation) {
      const formationTarget = getFormationTarget(
        behaviors.formation,
        activeIndex,
        activeAgents.length
      );
      
      if (formationTarget) {
        const [tr, ta, tc] = formationTarget;
        const [pr, pa, pc] = localState.position;
        
        // Compute desired direction to formation target
        const dirR = tr - pr;
        const dirA = ta - pa;
        const dirC = tc - pc;
        const dirMag = Math.sqrt(dirR * dirR + dirA * dirA + dirC * dirC);
        
        if (dirMag > 1e-6) {
          // Normalize and scale by formation weight
          const steerR = (dirR / dirMag) * params.formationWeight;
          const steerA = (dirA / dirMag) * params.formationWeight;
          const steerC = (dirC / dirMag) * params.formationWeight;
          
          velAdjustLocal[0] += steerR;
          velAdjustLocal[1] += steerA;
          velAdjustLocal[2] += steerC;
        }
      }
    }
    
    // Convert velocity adjustment from local frame to ECI frame
    // Create a dummy state with the velocity adjustment
    const localAdjustState: LocalFrameState = {
      position: [0, 0, 0],
      velocity: velAdjustLocal,
    };
    
    const eciAdjustState = localFrameToEci(localAdjustState, localFrame);
    // Extract only velocity (position is dummy)
    adjustments.push({
      delta: eciAdjustState.velocity,
    });
  }
  
  return adjustments;
}

/**
 * Enforce minimum separation (basic collision avoidance).
 * Modifies velocity adjustments to prevent agents from getting too close.
 * @param agents Array of agents
 * @param adjustments Current velocity adjustments (will be modified)
 * @param params Behavior parameters (includes minSeparation)
 */
export function enforceMinimumSeparation(
  agents: Agent[],
  adjustments: VelocityAdjustment[],
  params: BehaviorParams
): void {
  const minSepSq = params.minSeparation * params.minSeparation;
  
  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i]!;
    const [px, py, pz] = agent.state.position;
    
    for (let j = i + 1; j < agents.length; j++) {
      const other = agents[j]!;
      const [ox, oy, oz] = other.state.position;
      
      const dx = px - ox;
      const dy = py - oy;
      const dz = pz - oz;
      const distSq = dx * dx + dy * dy + dz * dz;
      
      if (distSq < minSepSq && distSq > 1e-12) {
        const dist = Math.sqrt(distSq);
        // Strong repulsive force if too close
        const repulsionStrength = (params.minSeparation - dist) / params.minSeparation;
        const repulsionWeight = params.separationWeight * repulsionStrength * 10; // Stronger for safety
        
        // Normalize direction
        const dirX = dx / dist;
        const dirY = dy / dist;
        const dirZ = dz / dist;
        
        // Apply repulsion to both agents
        adjustments[i]!.delta[0] += dirX * repulsionWeight;
        adjustments[i]!.delta[1] += dirY * repulsionWeight;
        adjustments[i]!.delta[2] += dirZ * repulsionWeight;
        
        adjustments[j]!.delta[0] -= dirX * repulsionWeight;
        adjustments[j]!.delta[1] -= dirY * repulsionWeight;
        adjustments[j]!.delta[2] -= dirZ * repulsionWeight;
      }
    }
  }
}
