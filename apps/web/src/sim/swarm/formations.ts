/**
 * Formation target generators for swarm behaviors.
 * All formations return target positions in local frame coordinates.
 */

import { FormationType } from '@/scenario/types';

/**
 * Compute ring formation target position for an agent.
 * Agents are arranged in a circle in the orbital plane.
 * @param agentIndex Index of the agent (0-based)
 * @param totalAgents Total number of agents in formation
 * @param radius Radius of the ring in meters (default: auto-scale based on agent count)
 * @returns Target position in local frame [radial, along-track, cross-track]
 */
export function computeRingFormation(
  agentIndex: number,
  totalAgents: number,
  radius?: number
): [number, number, number] {
  if (totalAgents <= 0) {
    throw new Error('Total agents must be positive');
  }
  
  // Auto-scale radius if not provided
  // Base radius on number of agents (roughly 10km per agent)
  const defaultRadius = totalAgents > 1 ? (totalAgents * 10000) : 10000;
  const r = radius ?? defaultRadius;
  
  // Angle around the ring
  const angle = (agentIndex / totalAgents) * 2 * Math.PI;
  
  // Ring lies in orbital plane (radial = 0, along-track and cross-track form circle)
  // We'll place it in along-track/cross-track plane
  const alongTrack = r * Math.cos(angle);
  const crossTrack = r * Math.sin(angle);
  
  // Radial component is 0 (same orbital altitude)
  return [0, alongTrack, crossTrack];
}

/**
 * Compute plane formation target position for an agent.
 * Agents are arranged in a grid in the orbital plane.
 * @param agentIndex Index of the agent (0-based)
 * @param totalAgents Total number of agents in formation
 * @param spacing Spacing between agents in meters (default: 5000m)
 * @returns Target position in local frame [radial, along-track, cross-track]
 */
export function computePlaneFormation(
  agentIndex: number,
  totalAgents: number,
  spacing: number = 5000
): [number, number, number] {
  if (totalAgents <= 0) {
    throw new Error('Total agents must be positive');
  }
  
  // Compute grid dimensions (square-ish grid)
  const gridSize = Math.ceil(Math.sqrt(totalAgents));
  
  // Position in grid
  const row = Math.floor(agentIndex / gridSize);
  const col = agentIndex % gridSize;
  
  // Center the grid
  const centerOffset = (gridSize - 1) / 2;
  const x = (col - centerOffset) * spacing;
  const y = (row - centerOffset) * spacing;
  
  // Place in along-track/cross-track plane (radial = 0)
  return [0, x, y];
}

/**
 * Compute lattice formation target position for an agent.
 * Agents are arranged in a 3D cubic lattice.
 * @param agentIndex Index of the agent (0-based)
 * @param totalAgents Total number of agents in formation
 * @param spacing Spacing between lattice points in meters (default: 5000m)
 * @returns Target position in local frame [radial, along-track, cross-track]
 */
export function computeLatticeFormation(
  agentIndex: number,
  totalAgents: number,
  spacing: number = 5000
): [number, number, number] {
  if (totalAgents <= 0) {
    throw new Error('Total agents must be positive');
  }
  
  // Compute 3D grid dimensions (cubic-ish)
  const latticeSize = Math.ceil(Math.cbrt(totalAgents));
  
  // Position in 3D grid
  const layer = Math.floor(agentIndex / (latticeSize * latticeSize));
  const remainder = agentIndex % (latticeSize * latticeSize);
  const row = Math.floor(remainder / latticeSize);
  const col = remainder % latticeSize;
  
  // Center the lattice
  const centerOffset = (latticeSize - 1) / 2;
  const radial = (layer - centerOffset) * spacing;
  const alongTrack = (col - centerOffset) * spacing;
  const crossTrack = (row - centerOffset) * spacing;
  
  return [radial, alongTrack, crossTrack];
}

/**
 * Get formation target position for an agent based on formation type.
 * @param formationType Type of formation
 * @param agentIndex Index of the agent
 * @param totalAgents Total number of agents
 * @param params Optional formation parameters (radius, spacing)
 * @returns Target position in local frame [radial, along-track, cross-track]
 */
export function getFormationTarget(
  formationType: FormationType | undefined,
  agentIndex: number,
  totalAgents: number,
  params?: { radius?: number; spacing?: number }
): [number, number, number] | null {
  if (!formationType || formationType === FormationType.NONE) {
    return null;
  }
  
  switch (formationType) {
    case FormationType.RING:
      return computeRingFormation(agentIndex, totalAgents, params?.radius);
    case FormationType.PLANE:
      return computePlaneFormation(agentIndex, totalAgents, params?.spacing);
    case FormationType.LATTICE:
      return computeLatticeFormation(agentIndex, totalAgents, params?.spacing);
    default:
      return null;
  }
}
