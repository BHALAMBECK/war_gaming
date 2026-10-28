import { describe, it, expect } from 'vitest';
import {
  DEFAULT_SCENARIO_WIZARD,
  buildScenarioFromWizard,
  previewAgentCount,
} from './scenarioBuilder';
import { FormationType } from '@/scenario/types';

describe('scenarioBuilder', () => {
  it('builds a single-constellation scenario that validates', () => {
    const scenario = buildScenarioFromWizard({
      ...DEFAULT_SCENARIO_WIZARD,
      name: 'Ring Drill',
      template: 'single-constellation',
      primary: {
        ...DEFAULT_SCENARIO_WIZARD.primary,
        pattern: 'ring',
        count: 12,
      },
    });
    expect(scenario.name).toBe('Ring Drill');
    expect(scenario.agents).toHaveLength(12);
    expect(scenario.sim.fidelity).toBe(0);
    expect(scenario.seed).toBe('scenario-designer');
    expect(previewAgentCount({
      ...DEFAULT_SCENARIO_WIZARD,
      template: 'single-constellation',
      primary: { ...DEFAULT_SCENARIO_WIZARD.primary, count: 12 },
    })).toBe(12);
  });

  it('builds opposing fleets with friendly + enemy agents', () => {
    const scenario = buildScenarioFromWizard({
      ...DEFAULT_SCENARIO_WIZARD,
      template: 'opposing-fleets',
      primary: {
        ...DEFAULT_SCENARIO_WIZARD.primary,
        pattern: 'ring',
        count: 5,
        idPrefix: 'blue',
      },
      opposing: {
        ...DEFAULT_SCENARIO_WIZARD.opposing,
        pattern: 'ring',
        count: 7,
        idPrefix: 'red',
      },
      fidelity: 1,
      timeStep: 2,
    });
    expect(scenario.agents).toHaveLength(12);
    expect(scenario.agents.filter((a) => a.team === 'friendly')).toHaveLength(5);
    expect(scenario.agents.filter((a) => a.team === 'enemy')).toHaveLength(7);
    expect(scenario.sim.fidelity).toBe(1);
    expect(scenario.sim.timeStep).toBe(2);
    expect(scenario.agents.some((a) => a.id.startsWith('blue-'))).toBe(true);
    expect(scenario.agents.some((a) => a.id.startsWith('red-'))).toBe(true);
  });

  it('builds an empty sandbox with zero agents', () => {
    const scenario = buildScenarioFromWizard({
      ...DEFAULT_SCENARIO_WIZARD,
      template: 'empty',
      name: 'Blank',
    });
    expect(scenario.agents).toHaveLength(0);
    expect(previewAgentCount({ ...DEFAULT_SCENARIO_WIZARD, template: 'empty' })).toBe(0);
  });

  it('is deterministic for the same wizard draft', () => {
    const draft = {
      ...DEFAULT_SCENARIO_WIZARD,
      template: 'single-constellation' as const,
      seed: 'det-seed',
      primary: {
        ...DEFAULT_SCENARIO_WIZARD.primary,
        pattern: 'shell' as const,
        count: 15,
        seed: 'ignored-for-primary-override',
        behaviors: {
          cohesion: false,
          separation: true,
          alignment: true,
          formation: FormationType.PLANE,
        },
      },
    };
    const a = buildScenarioFromWizard(draft);
    const b = buildScenarioFromWizard(draft);
    expect(a).toEqual(b);
  });
});
