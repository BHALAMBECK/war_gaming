/**
 * JSON schema validation for scenarios using Zod.
 */

import { z } from 'zod';
import { Scenario, FormationType, BehaviorFlags, AgentScenario, EarthParams, SimParams } from './types';
import { OrbitalElements, CartesianState } from '@/sim/orbit/types';
import { ObjectiveType } from '@/sim/tasks/types';

/**
 * Zod schema for FormationType enum.
 */
const FormationTypeSchema = z.nativeEnum(FormationType);

/**
 * Zod schema for BehaviorFlags.
 */
const BehaviorFlagsSchema: z.ZodType<BehaviorFlags> = z.object({
  cohesion: z.boolean(),
  separation: z.boolean(),
  alignment: z.boolean(),
  formation: FormationTypeSchema.optional(),
});

/**
 * Zod schema for orbital elements.
 */
const OrbitalElementsSchema: z.ZodType<OrbitalElements> = z.object({
  a: z.number().positive(),
  e: z.number().min(0).max(1),
  i: z.number().min(0).max(Math.PI),
  Ω: z.number().min(0).max(2 * Math.PI),
  ω: z.number().min(0).max(2 * Math.PI),
  ν: z.number().min(0).max(2 * Math.PI).optional(),
  M: z.number().min(0).max(2 * Math.PI).optional(),
}).refine(
  (data) => data.ν !== undefined || data.M !== undefined,
  { message: 'Orbital elements must have either ν (true anomaly) or M (mean anomaly)' }
);

/**
 * Zod schema for Cartesian state.
 */
const CartesianStateSchema: z.ZodType<CartesianState> = z.object({
  position: z.tuple([z.number(), z.number(), z.number()]),
  velocity: z.tuple([z.number(), z.number(), z.number()]),
});

/**
 * Zod schema for orbit state (union of OrbitalElements and CartesianState).
 */
const OrbitStateSchema = z.union([OrbitalElementsSchema, CartesianStateSchema]);

/**
 * Zod schema for Team.
 */
const TeamSchema = z.enum(['friendly', 'enemy']);

/**
 * Zod schema for AgentScenario.
 */
const AgentScenarioSchema: z.ZodType<AgentScenario> = z.object({
  id: z.string().min(1),
  orbit: OrbitStateSchema,
  behaviors: BehaviorFlagsSchema,
  team: TeamSchema.optional().default('friendly'),
  dvRemaining: z.number().nonnegative().optional(),
});

/**
 * Zod schema for EarthParams.
 */
const EarthParamsSchema: z.ZodType<EarthParams> = z.object({
  radius: z.number().positive(),
  mu: z.number().positive().optional(),
});

/**
 * Zod schema for SimParams.
 */
const SimParamsSchema: z.ZodType<SimParams> = z.object({
  timeStep: z.number().positive(),
  maxTime: z.number().positive().optional(),
  initialTime: z.number().min(0).optional(),
});

/**
 * Zod schema for ObjectiveType enum.
 */
const ObjectiveTypeSchema = z.nativeEnum(ObjectiveType);

/**
 * Zod schema for base objective (common fields).
 */
const BaseObjectiveSchema = z.object({
  id: z.string().min(1),
  type: ObjectiveTypeSchema,
  position: z.tuple([z.number(), z.number(), z.number()]),
  points: z.number().min(0),
  completed: z.boolean(),
});

/**
 * Zod schema for InspectPointObjective.
 */
const InspectPointObjectiveSchema = BaseObjectiveSchema.extend({
  type: z.literal(ObjectiveType.INSPECT_POINT),
  threshold: z.number().positive(),
  vThreshold: z.number().positive().optional(),
});

/**
 * Zod schema for RelayNodeObjective.
 */
const RelayNodeObjectiveSchema = BaseObjectiveSchema.extend({
  type: z.literal(ObjectiveType.RELAY_NODE),
  holdDuration: z.number().positive(),
  threshold: z.number().positive(),
  assignedAgentId: z.string().nullable(),
  startTime: z.number().nullable(),
});

/**
 * Zod schema for HoldFormationZoneObjective.
 */
const HoldFormationZoneObjectiveSchema = BaseObjectiveSchema.extend({
  type: z.literal(ObjectiveType.HOLD_FORMATION_ZONE),
  radius: z.number().positive(),
  requiredAgents: z.number().int().min(1),
  assignedAgentIds: z.array(z.string()),
});

/**
 * Zod schema for Objective (union of all objective types).
 */
const ObjectiveSchema = z.discriminatedUnion('type', [
  InspectPointObjectiveSchema,
  RelayNodeObjectiveSchema,
  HoldFormationZoneObjectiveSchema,
]);

/**
 * Zod schema for complete Scenario.
 */
const ScenarioSchema: z.ZodType<Scenario> = z.object({
  name: z.string().min(1),
  description: z.string(),
  version: z.string().min(1),
  earth: EarthParamsSchema,
  agents: z.array(AgentScenarioSchema).min(0),
  sim: SimParamsSchema,
  seed: z.string(),
  objectives: z.array(ObjectiveSchema).optional(),
});

/**
 * Validate and parse scenario data.
 * @param data Unknown data to validate
 * @returns Validated Scenario object
 * @throws Error if validation fails
 */
export function validateScenario(data: unknown): Scenario {
  try {
    return ScenarioSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('\n');
      throw new Error(`Scenario validation failed:\n${errorMessages}`);
    }
    throw error;
  }
}

/**
 * Safe parse scenario data (returns result object instead of throwing).
 * @param data Unknown data to validate
 * @returns Parse result with success flag
 */
export function safeParseScenario(data: unknown): { success: true; data: Scenario } | { success: false; error: z.ZodError } {
  const result = ScenarioSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
