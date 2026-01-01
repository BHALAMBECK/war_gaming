/**
 * Tests for scenario system: determinism, validation, and save/load.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Scenario, AgentScenario, FormationType } from './types';
import { validateScenario, safeParseScenario } from './schema';
import { scenarioToAgents, loadScenario } from './loader';
import { saveScenario } from './saver';
import { OrbitalElements, CartesianState } from '@/sim/orbit/types';
import { useSimClockStore } from '@/ui/stores/simClockStore';
import { useAgentStore } from '@/ui/stores/agentStore';
import { setSeed } from '@/util/seed';
import { propagateKepler } from '@/sim/orbit/propagator';
import { EARTH_RADIUS, EARTH_MU } from '@/sim/orbit/constants';

describe('scenario', () => {
  beforeEach(() => {
    // Reset stores before each test
    useSimClockStore.getState().reset();
    useAgentStore.getState().setAgents([]);
    setSeed('test-seed');
  });

  describe('schema validation', () => {
    it('validates correct scenario', () => {
      const scenario: Scenario = {
        name: 'Test Scenario',
        description: 'Test description',
        version: '1.0.0',
        earth: {
          radius: EARTH_RADIUS,
          mu: EARTH_MU,
        },
        agents: [
          {
            id: 'agent-0',
            orbit: {
              a: 6771000,
              e: 0,
              i: 0.7853981633974483,
              Ω: 0,
              ω: 0,
              ν: 0,
            },
            behaviors: {
              cohesion: true,
              separation: false,
              alignment: true,
              formation: FormationType.RING,
            },
          },
        ],
        sim: {
          timeStep: 1.0,
          initialTime: 0,
        },
        seed: 'test-seed',
      };

      const validated = validateScenario(scenario);
      expect(validated.name).toBe('Test Scenario');
      expect(validated.agents).toHaveLength(1);
    });

    it('rejects scenario with invalid orbital elements', () => {
      const invalidScenario = {
        name: 'Invalid',
        description: '',
        version: '1.0.0',
        earth: { radius: EARTH_RADIUS },
        agents: [
          {
            id: 'agent-0',
            orbit: {
              a: -1000, // Invalid: negative semi-major axis
              e: 0,
              i: 0,
              Ω: 0,
              ω: 0,
            },
            behaviors: {
              cohesion: false,
              separation: false,
              alignment: false,
            },
          },
        ],
        sim: { timeStep: 1.0 },
        seed: 'test',
      };

      expect(() => validateScenario(invalidScenario)).toThrow();
    });

    it('rejects scenario with missing required fields', () => {
      const invalidScenario = {
        name: 'Invalid',
        // Missing description, version, etc.
      };

      expect(() => validateScenario(invalidScenario)).toThrow();
    });

    it('safeParseScenario returns success flag', () => {
      const validScenario: Scenario = {
        name: 'Test',
        description: '',
        version: '1.0.0',
        earth: { radius: EARTH_RADIUS },
        agents: [],
        sim: { timeStep: 1.0 },
        seed: 'test',
      };

      const result = safeParseScenario(validScenario);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Test');
      }
    });
  });

  describe('scenarioToAgents', () => {
    it('converts orbital elements to agents', () => {
      const scenario: Scenario = {
        name: 'Test',
        description: '',
        version: '1.0.0',
        earth: { radius: EARTH_RADIUS },
        agents: [
          {
            id: 'agent-0',
            orbit: {
              a: 6771000,
              e: 0,
              i: 0.7853981633974483,
              Ω: 0,
              ω: 0,
              ν: 0,
            } as OrbitalElements,
            behaviors: {
              cohesion: false,
              separation: false,
              alignment: false,
            },
          },
        ],
        sim: { timeStep: 1.0 },
        seed: 'test',
      };

      const agents = scenarioToAgents(scenario);
      expect(agents).toHaveLength(1);
      expect(agents[0].id).toBe('agent-0');
      expect(agents[0].state.position).toHaveLength(3);
      expect(agents[0].state.velocity).toHaveLength(3);
    });

    it('converts Cartesian state to agents', () => {
      const scenario: Scenario = {
        name: 'Test',
        description: '',
        version: '1.0.0',
        earth: { radius: EARTH_RADIUS },
        agents: [
          {
            id: 'agent-0',
            orbit: {
              position: [6771000, 0, 0],
              velocity: [0, 7546, 0],
            } as CartesianState,
            behaviors: {
              cohesion: false,
              separation: false,
              alignment: false,
            },
          },
        ],
        sim: { timeStep: 1.0 },
        seed: 'test',
      };

      const agents = scenarioToAgents(scenario);
      expect(agents).toHaveLength(1);
      expect(agents[0].id).toBe('agent-0');
      expect(agents[0].state.position).toEqual([6771000, 0, 0]);
      expect(agents[0].state.velocity).toEqual([0, 7546, 0]);
    });
  });

  describe('save/load roundtrip', () => {
    it('save and load produces identical scenario', () => {
      // Create initial scenario
      const originalScenario: Scenario = {
        name: 'Roundtrip Test',
        description: 'Test description',
        version: '1.0.0',
        earth: {
          radius: EARTH_RADIUS,
          mu: EARTH_MU,
        },
        agents: [
          {
            id: 'agent-0',
            orbit: {
              a: 6771000,
              e: 0.1,
              i: 0.7853981633974483,
              Ω: 0.5,
              ω: 1.0,
              ν: 1.5,
            },
            behaviors: {
              cohesion: true,
              separation: true,
              alignment: false,
              formation: FormationType.RING,
            },
          },
        ],
        sim: {
          timeStep: 1.0,
          initialTime: 100,
        },
        seed: 'roundtrip-seed',
      };

      // Load scenario
      loadScenarioDirect(originalScenario);

      // Save scenario
      const savedScenario = saveScenario(
        originalScenario.name,
        originalScenario.description,
        originalScenario.version
      );

      // Compare key fields
      expect(savedScenario.name).toBe(originalScenario.name);
      expect(savedScenario.description).toBe(originalScenario.description);
      expect(savedScenario.version).toBe(originalScenario.version);
      expect(savedScenario.seed).toBe(originalScenario.seed);
      expect(savedScenario.earth.radius).toBe(originalScenario.earth.radius);
      expect(savedScenario.sim.timeStep).toBe(originalScenario.sim.timeStep);
      expect(savedScenario.agents).toHaveLength(originalScenario.agents.length);

      // Compare agent orbital elements (should be close due to conversion)
      const savedElements = savedScenario.agents[0].orbit as OrbitalElements;
      const originalElements = originalScenario.agents[0].orbit as OrbitalElements;
      expect(savedElements.a).toBeCloseTo(originalElements.a, 1);
      expect(savedElements.e).toBeCloseTo(originalElements.e, 3);
    });
  });

  describe('determinism', () => {
    it('same scenario + seed produces identical agent states after propagation', () => {
      const scenario: Scenario = {
        name: 'Determinism Test',
        description: '',
        version: '1.0.0',
        earth: { radius: EARTH_RADIUS },
        agents: [
          {
            id: 'agent-0',
            orbit: {
              a: 6771000,
              e: 0.1,
              i: 0.7853981633974483,
              Ω: 0.5,
              ω: 1.0,
              ν: 1.5,
            },
            behaviors: {
              cohesion: false,
              separation: false,
              alignment: false,
            },
          },
        ],
        sim: { timeStep: 1.0 },
        seed: 'deterministic-seed',
      };

      // Load scenario first time
      setSeed(scenario.seed);
      loadScenarioDirect(scenario);
      const agents1 = useAgentStore.getState().agents;
      const state1 = agents1[0].state;

      // Propagate by 100 seconds
      const propagated1 = propagateKepler(state1, 100);

      // Reset and load again
      useSimClockStore.getState().reset();
      useAgentStore.getState().setAgents([]);
      setSeed(scenario.seed);
      loadScenario(scenario);
      const agents2 = useAgentStore.getState().agents;
      const state2 = agents2[0].state;

      // Propagate by 100 seconds again
      const propagated2 = propagateKepler(state2, 100);

      // Results should be identical
      expect(propagated1.position[0]).toBeCloseTo(propagated2.position[0], 5);
      expect(propagated1.position[1]).toBeCloseTo(propagated2.position[1], 5);
      expect(propagated1.position[2]).toBeCloseTo(propagated2.position[2], 5);
      expect(propagated1.velocity[0]).toBeCloseTo(propagated2.velocity[0], 5);
      expect(propagated1.velocity[1]).toBeCloseTo(propagated2.velocity[1], 5);
      expect(propagated1.velocity[2]).toBeCloseTo(propagated2.velocity[2], 5);
    });
  });
});
