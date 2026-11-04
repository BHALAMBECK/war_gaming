/**
 * Type definitions for agent rendering.
 */

import { CartesianState } from '@/sim/orbit/types';
import { BehaviorFlags, Team, type CentralBody, type VisualRole } from '@/scenario/types';
import { AgentSystems } from '@/sim/systems/types';

/**
 * Agent with rendering metadata.
 */
export interface Agent {
  /** Unique identifier */
  id: string;
  /** Current orbital state in body-centered inertial frame (meters) */
  state: CartesianState;
  /** Behavior flags for swarm behaviors */
  behaviors: BehaviorFlags;
  /** Team/faction (friendly or enemy) */
  team: Team;
  /** Remaining delta-v budget in m/s */
  dvRemaining: number;
  /** Onboard sensors / abstract weapons */
  systems?: AgentSystems;
  /** Central body for propagation (defaults to earth) */
  centralBody: CentralBody;
  /** Mesh role for constellation vs hero showcase */
  visualRole: VisualRole;
  /** Whether this agent is currently selected */
  selected?: boolean;
  /** Whether this agent is currently hovered */
  hovered?: boolean;
}
