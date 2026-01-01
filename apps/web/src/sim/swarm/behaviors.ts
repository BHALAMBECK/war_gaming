/**
 * Core swarm behaviors: cohesion, separation, alignment.
 * All behaviors operate in local frame coordinates.
 */

import { LocalFrame, LocalFrameState, BehaviorParams } from './types';

/**
 * Compute cohesion behavior: move toward center of nearby neighbors.
 * @param agents Local frame states of all agents
 * @param agentIndex Index of the agent to compute behavior for
 * @param localFrame Local frame (for reference)
 * @param params Behavior parameters
 * @returns Velocity adjustment in local frame [vr, va, vc]
 */
export function computeCohesion(
  agents: LocalFrameState[],
  agentIndex: number,
  _localFrame: LocalFrame,
  params: BehaviorParams
): [number, number, number] {
  if (agents.length <= 1) {
    return [0, 0, 0];
  }
  
  const agent = agents[agentIndex]!;
  const [px, py, pz] = agent.position;
  
  let sumX = 0, sumY = 0, sumZ = 0;
  let count = 0;
  
  // Find neighbors within radius
  for (let i = 0; i < agents.length; i++) {
    if (i === agentIndex) continue;
    
    const neighbor = agents[i]!;
    const [nx, ny, nz] = neighbor.position;
    
    const dx = nx - px;
    const dy = ny - py;
    const dz = nz - pz;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    if (dist < params.neighborRadius) {
      sumX += nx;
      sumY += ny;
      sumZ += nz;
      count++;
    }
  }
  
  if (count === 0) {
    return [0, 0, 0];
  }
  
  // Compute center of neighbors
  const centerX = sumX / count;
  const centerY = sumY / count;
  const centerZ = sumZ / count;
  
  // Desired direction toward center
  const dirX = centerX - px;
  const dirY = centerY - py;
  const dirZ = centerZ - pz;
  const dirMag = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
  
  if (dirMag < 1e-6) {
    return [0, 0, 0];
  }
  
  // Normalize and scale by weight
  const normalizedX = dirX / dirMag;
  const normalizedY = dirY / dirMag;
  const normalizedZ = dirZ / dirMag;
  
  return [
    normalizedX * params.cohesionWeight,
    normalizedY * params.cohesionWeight,
    normalizedZ * params.cohesionWeight,
  ];
}

/**
 * Compute separation behavior: avoid close neighbors.
 * @param agents Local frame states of all agents
 * @param agentIndex Index of the agent to compute behavior for
 * @param localFrame Local frame (for reference)
 * @param params Behavior parameters
 * @returns Velocity adjustment in local frame [vr, va, vc]
 */
export function computeSeparation(
  agents: LocalFrameState[],
  agentIndex: number,
  localFrame: LocalFrame,
  params: BehaviorParams
): [number, number, number] {
  if (agents.length <= 1) {
    return [0, 0, 0];
  }
  
  const agent = agents[agentIndex]!;
  const [px, py, pz] = agent.position;
  
  let steerX = 0, steerY = 0, steerZ = 0;
  
  // Avoid neighbors that are too close
  for (let i = 0; i < agents.length; i++) {
    if (i === agentIndex) continue;
    
    const neighbor = agents[i]!;
    const [nx, ny, nz] = neighbor.position;
    
    const dx = px - nx;
    const dy = py - ny;
    const dz = pz - nz;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    // Stronger avoidance for closer neighbors
    if (dist < params.neighborRadius && dist > 1e-6) {
      const invDist = 1.0 / dist;
      // Weight inversely proportional to distance (closer = stronger)
      const weight = params.separationWeight * invDist * invDist;
      steerX += (dx / dist) * weight;
      steerY += (dy / dist) * weight;
      steerZ += (dz / dist) * weight;
    }
  }
  
  return [steerX, steerY, steerZ];
}

/**
 * Compute alignment behavior: align velocity with nearby neighbors.
 * @param agents Local frame states of all agents
 * @param agentIndex Index of the agent to compute behavior for
 * @param localFrame Local frame (for reference)
 * @param params Behavior parameters
 * @returns Velocity adjustment in local frame [vr, va, vc]
 */
export function computeAlignment(
  agents: LocalFrameState[],
  agentIndex: number,
  _localFrame: LocalFrame,
  params: BehaviorParams
): [number, number, number] {
  if (agents.length <= 1) {
    return [0, 0, 0];
  }
  
  const agent = agents[agentIndex]!;
  const [px, py, pz] = agent.position;
  const [vx, vy, vz] = agent.velocity;
  
  let sumVx = 0, sumVy = 0, sumVz = 0;
  let count = 0;
  
  // Average velocity of neighbors
  for (let i = 0; i < agents.length; i++) {
    if (i === agentIndex) continue;
    
    const neighbor = agents[i]!;
    const [nx, ny, nz] = neighbor.position;
    
    const dx = nx - px;
    const dy = ny - py;
    const dz = nz - pz;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    if (dist < params.neighborRadius) {
      const [nvx, nvy, nvz] = neighbor.velocity;
      sumVx += nvx;
      sumVy += nvy;
      sumVz += nvz;
      count++;
    }
  }
  
  if (count === 0) {
    return [0, 0, 0];
  }
  
  // Average neighbor velocity
  const avgVx = sumVx / count;
  const avgVy = sumVy / count;
  const avgVz = sumVz / count;
  
  // Steer toward average velocity
  const steerX = (avgVx - vx) * params.alignmentWeight;
  const steerY = (avgVy - vy) * params.alignmentWeight;
  const steerZ = (avgVz - vz) * params.alignmentWeight;
  
  return [steerX, steerY, steerZ];
}
