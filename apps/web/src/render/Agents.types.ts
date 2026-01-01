/**
 * Type definitions for agent rendering.
 */

import { CartesianState } from '@/sim/orbit/types';
import { BehaviorFlags, Team } from '@/scenario/types';

/**
 * Agent with rendering metadata.
 */
export interface Agent {
  /** Unique identifier */
  id: string;
  /** Current orbital state in ECI frame (meters) */
  state: CartesianState;
  /** Behavior flags for swarm behaviors */
  behaviors: BehaviorFlags;
  /** Team/faction (friendly or enemy) */
  team: Team;
  /** Remaining delta-v budget in m/s */
  dvRemaining: number;
  /** Whether this agent is currently selected */
  selected?: boolean;
  /** Whether this agent is currently hovered */
  hovered?: boolean;
}
