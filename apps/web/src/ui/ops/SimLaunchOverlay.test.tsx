import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SimLaunchOverlay } from './SimLaunchOverlay';
import { useOpsStore } from '@/ui/stores/opsStore';
import { useSimClockStore } from '@/ui/stores/simClockStore';

describe('SimLaunchOverlay', () => {
  beforeEach(() => {
    useOpsStore.setState({
      pendingSimLaunch: true,
      fidelity: 2,
      appPhase: 'ops',
    });
    useSimClockStore.setState({ paused: true, timeScale: 5 });
  });

  it('starts at the loaded fidelity instead of resetting to Kepler', async () => {
    const user = userEvent.setup();
    render(<SimLaunchOverlay />);

    await user.click(screen.getByRole('button', { name: 'Start' }));

    expect(useOpsStore.getState().fidelity).toBe(2);
    expect(useOpsStore.getState().pendingSimLaunch).toBe(false);
    expect(useSimClockStore.getState().paused).toBe(false);
    expect(useSimClockStore.getState().timeScale).toBe(1);
  });
});
