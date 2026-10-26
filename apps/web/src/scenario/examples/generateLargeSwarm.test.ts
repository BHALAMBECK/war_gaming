import { describe, it, expect } from 'vitest';
import {
  generateLargeSwarmAgents,
  expandLargeSwarmScenario,
  LARGE_SWARM_AGENT_COUNT,
} from './generateLargeSwarm';
import { validateScenario } from '../schema';
import largeSwarmStub from './large-swarm.json';

describe('generateLargeSwarm', () => {
  it('builds 500 deterministic agents', () => {
    const a = generateLargeSwarmAgents(LARGE_SWARM_AGENT_COUNT, 'large-swarm-default');
    const b = generateLargeSwarmAgents(LARGE_SWARM_AGENT_COUNT, 'large-swarm-default');
    expect(a).toHaveLength(500);
    expect(a[0]!.orbit).toEqual(b[0]!.orbit);
    expect(a[499]!.id).toBe('agent-499');
  });

  it('expands stub to a valid 500-agent scenario', () => {
    const stub = validateScenario(largeSwarmStub);
    const expanded = expandLargeSwarmScenario(stub);
    expect(expanded.agents).toHaveLength(500);
    expect(validateScenario(expanded).agents).toHaveLength(500);
  });
});
