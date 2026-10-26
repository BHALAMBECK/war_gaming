import { describe, it, expect } from 'vitest';
import { buildRunExport } from './runExport';

describe('buildRunExport', () => {
  it('shapes meta, trajectory, and sorted events', () => {
    const bundle = buildRunExport({
      scenarioName: 'Demo',
      seed: 's1',
      fidelity: 1,
      timeStep: 1,
      agentCount: 2,
      exportedAt: '2026-10-26T00:00:00.000Z',
      trajectory: [
        {
          t: 0,
          agents: [
            { id: 'a', r: [1, 0, 0], v: [0, 1, 0] },
            { id: 'b', r: [2, 0, 0], v: [0, 2, 0] },
          ],
        },
        {
          t: 10,
          agents: [
            { id: 'a', r: [1.1, 0, 0], v: [0, 1, 0] },
            { id: 'b', r: [2.1, 0, 0], v: [0, 2, 0] },
          ],
        },
      ],
      engagements: [
        {
          id: 'eng-1',
          simTime: 5,
          shooterId: 'a',
          targetId: 'b',
          hit: true,
          reason: 'ok',
          rangeM: 1000,
        },
      ],
      snapshots: [
        {
          id: 'snap-1',
          simTime: 2,
          agentId: 'a',
          targetIds: ['b'],
          label: '1 contact',
        },
      ],
    });

    expect(bundle.meta).toEqual({
      scenarioName: 'Demo',
      seed: 's1',
      fidelity: 1,
      timeStep: 1,
      exportedAt: '2026-10-26T00:00:00.000Z',
      agentCount: 2,
      simTimeStart: 0,
      simTimeEnd: 10,
    });
    expect(bundle.trajectory).toHaveLength(2);
    expect(bundle.events.map((e) => e.type)).toEqual([
      'snapshot',
      'engagement',
    ]);
  });

  it('allows empty trajectory when never recording', () => {
    const bundle = buildRunExport({
      scenarioName: 'x',
      seed: 's',
      fidelity: 0,
      timeStep: 1,
      agentCount: 0,
      trajectory: [],
      engagements: [],
      snapshots: [],
      exportedAt: '2026-10-26T00:00:00.000Z',
    });
    expect(bundle.trajectory).toEqual([]);
    expect(bundle.meta.simTimeStart).toBe(0);
    expect(bundle.meta.simTimeEnd).toBe(0);
  });
});
