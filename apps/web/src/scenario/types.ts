/**
 * Type definitions for scenario system.
 * Scenarios define initial conditions and simulation parameters.
 */

import { OrbitalElements, CartesianState } from '@/sim/orbit/types';

/**
 * Formation types for agent behaviors (placeholder for milestone 7).
 */
export enum FormationType {
  NONE = 'none',
  RING = 'ring',
  PLANE = 'plane',
  LATTICE = 'lattice',
}

/**
 * Behavior flags for agents (placeholder for milestone 7).
 */
export interface BehaviorFlags {
  /** Cohesion behavior enabled */
  cohesion: boolean;
  /** Separation behavior enabled */
  separation: boolean;
  /** Alignment behavior enabled */
  alignment: boolean;
  /** Formation type (if any) */
  formation?: FormationType;
}

/**
 * Team/faction for agents.
 */
export type Team = 'friendly' | 'enemy';

/** Design-time bus metadata attached to scenario agents (optional). */
export interface AgentBusMetadata {
  profile: string;
  name: string;
  dryMassKg: number;
  unitBusCostUsd: number;
  summary: string;
}

/**
 * Agent definition in a scenario.
 * Supports both orbital elements and Cartesian state for flexibility.
 */
export interface AgentScenario {
  /** Unique identifier */
  id: string;
  /** Initial orbit state (either elements or Cartesian) */
  orbit: OrbitalElements | CartesianState;
  /** Behavior flags */
  behaviors: BehaviorFlags;
  /** Team/faction (friendly or enemy). Defaults to 'friendly' if not specified. */
  team?: Team;
  /** Initial delta-v budget in m/s. Defaults to 1000 m/s if not specified. */
  dvRemaining?: number;
  /** Optional bus configuration from the satellite designer */
  bus?: AgentBusMetadata;
}

/**
 * Earth parameters in a scenario.
 */
export interface EarthParams {
  /** Earth radius in meters */
  radius: number;
  /** Gravitational parameter μ = GM in m³/s² (optional, defaults to standard value) */
  mu?: number;
}

/**
 * Propagation fidelity tier (matches ops slider / orbit propagator).
 * 0 = Kepler, 1 = Kepler+J2, 2 = RK4+J2
 */
export type ScenarioFidelity = 0 | 1 | 2;

/**
 * Simulation parameters in a scenario.
 */
export interface SimParams {
  /** Fixed physics time step in seconds */
  timeStep: number;
  /** Maximum simulation time in seconds (metadata / export bound; optional) */
  maxTime?: number;
  /** Initial simulation time in seconds (defaults to 0) */
  initialTime?: number;
  /** Propagator fidelity (defaults to 0 if omitted) */
  fidelity?: ScenarioFidelity;
}

/**
 * Complete scenario definition.
 */
export interface Scenario {
  /** Scenario metadata */
  name: string;
  description: string;
  version: string;

  /** Earth parameters */
  earth: EarthParams;

  /** Agent initial conditions */
  agents: AgentScenario[];

  /** Simulation parameters */
  sim: SimParams;

  /** Seed for deterministic RNG */
  seed: string;

  /** Objectives for task allocation (optional for backward compatibility) */
  objectives?: import('@/sim/tasks/types').Objective[];
}
