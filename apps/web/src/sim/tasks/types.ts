/**
 * Type definitions for task allocation system.
 * Defines objective types and related structures.
 */

/**
 * Objective types for the task allocation mini-game.
 */
export enum ObjectiveType {
  INSPECT_POINT = 'inspect_point',
  RELAY_NODE = 'relay_node',
  HOLD_FORMATION_ZONE = 'hold_formation_zone',
}

/**
 * Base interface for all objectives.
 */
export interface BaseObjective {
  /** Unique identifier */
  id: string;
  /** Objective type */
  type: ObjectiveType;
  /** Position in ECI frame (meters) */
  position: [number, number, number];
  /** Score value awarded when completed */
  points: number;
  /** Whether this objective has been completed */
  completed: boolean;
}

/**
 * Inspect Point objective: agents must approach within threshold distance.
 */
export interface InspectPointObjective extends BaseObjective {
  type: ObjectiveType.INSPECT_POINT;
  /** Distance threshold in meters - objective completes when an agent gets within this distance */
  threshold: number;
  /** Velocity threshold in m/s (optional) - relative speed must be below this for completion. Defaults to 10 m/s if not specified. */
  vThreshold?: number;
}

/**
 * Relay Node objective: requires an agent to maintain position for a duration.
 */
export interface RelayNodeObjective extends BaseObjective {
  type: ObjectiveType.RELAY_NODE;
  /** Required hold duration in seconds */
  holdDuration: number;
  /** Distance threshold in meters - agent must stay within this distance */
  threshold: number;
  /** ID of agent assigned to this objective (null if unassigned) */
  assignedAgentId: string | null;
  /** Simulation time when agent entered threshold (null if not entered) */
  startTime: number | null;
}

/**
 * Hold Formation Zone objective: requires multiple agents to maintain formation within a zone.
 */
export interface HoldFormationZoneObjective extends BaseObjective {
  type: ObjectiveType.HOLD_FORMATION_ZONE;
  /** Zone radius in meters */
  radius: number;
  /** Minimum number of agents required in zone */
  requiredAgents: number;
  /** IDs of agents assigned to this objective */
  assignedAgentIds: string[];
}

/**
 * Union type for all objective types.
 */
export type Objective = InspectPointObjective | RelayNodeObjective | HoldFormationZoneObjective;

/**
 * Parameters for objective steering behavior.
 */
export interface ObjectiveSteeringParams {
  /** Weight for objective steering (m/s²) */
  objectiveWeight: number;
}

/**
 * Default objective steering parameters.
 */
export const DEFAULT_OBJECTIVE_STEERING_PARAMS: ObjectiveSteeringParams = {
  objectiveWeight: 0.5,
};
