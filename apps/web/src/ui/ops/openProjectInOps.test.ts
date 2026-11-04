import { describe, it, expect, beforeEach } from 'vitest';
import { openProjectInOps } from './openProjectInOps';
import { useOpsStore } from '@/ui/stores/opsStore';
import { useSimClockStore } from '@/ui/stores/simClockStore';
import { useAgentStore } from '@/ui/stores/agentStore';
import { loadExampleScenario } from '@/scenario/examples';

describe('openProjectInOps', () => {
  beforeEach(() => {
    useOpsStore.setState({
      appPhase: 'library',
      pendingSimLaunch: false,
      viewMode: 'earth',
      fidelity: 1,
    });
    useSimClockStore.setState({ paused: false, timeScale: 5 });
    useAgentStore.getState().setAgents([]);
  });

  it('loads into ops paused with launch prompt', () => {
    openProjectInOps(loadExampleScenario('demo'));
    expect(useOpsStore.getState().appPhase).toBe('ops');
    expect(useOpsStore.getState().pendingSimLaunch).toBe(true);
    expect(useSimClockStore.getState().paused).toBe(true);
    expect(useAgentStore.getState().agents.length).toBeGreaterThan(0);
  });

  it('sets overview for multi-body scenarios', () => {
    openProjectInOps(loadExampleScenario('solar-missions'));
    expect(useOpsStore.getState().viewMode).toBe('overview');
  });

  it('keeps earth view for earth-only scenarios', () => {
    openProjectInOps(loadExampleScenario('demo'));
    expect(useOpsStore.getState().viewMode).toBe('earth');
  });
});
