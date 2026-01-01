import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fireEvent } from '@testing-library/react';
import { TimeControlPanel } from './TimeControlPanel';
import { useSimClockStore } from './stores/simClockStore';
import { SimClock } from '@/sim/SimClock';
import { setSeed } from '@/util/seed';

describe('TimeControlPanel integration', () => {
  beforeEach(() => {
    // Reset store state
    const store = useSimClockStore.getState();
    store.reset();
    store.setPaused(false);
    store.setTimeScale(1.0);
    store.setSeed('default');
    store.setClockInstance(null);
    setSeed('default');
    cleanup(); // Clean up any rendered components
  });

  describe('play/pause button', () => {
    it('toggles simulation when clicked', async () => {
      const user = userEvent.setup();
      const clock = new SimClock({ paused: false });
      useSimClockStore.getState().setClockInstance(clock);

      render(<TimeControlPanel />);

      const playPauseButton = screen.getByRole('button', { name: /pause/i });
      expect(playPauseButton).toBeInTheDocument();

      await user.click(playPauseButton);

      expect(useSimClockStore.getState().paused).toBe(true);
      expect(clock.isPaused()).toBe(true);
      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
    });

    it('shows play button when paused', () => {
      const clock = new SimClock({ paused: true });
      useSimClockStore.getState().setClockInstance(clock);
      useSimClockStore.getState().setPaused(true);

      render(<TimeControlPanel />);

      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
    });

    it('shows pause button when playing', () => {
      const clock = new SimClock({ paused: false });
      useSimClockStore.getState().setClockInstance(clock);
      useSimClockStore.getState().setPaused(false);

      render(<TimeControlPanel />);

      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });
  });

  describe('time scale slider', () => {
    it('changes simulation speed when adjusted', async () => {
      const user = userEvent.setup();
      const clock = new SimClock({ timeScale: 1.0 });
      useSimClockStore.getState().setClockInstance(clock);

      render(<TimeControlPanel />);

      const slider = screen.getByRole('slider') as HTMLInputElement;
      expect(slider).toBeInTheDocument();
      expect(slider).toHaveValue('1');

      // Change to 2.5x using fireEvent for range input
      fireEvent.change(slider, { target: { value: '2.5' } });

      expect(useSimClockStore.getState().timeScale).toBe(2.5);
      expect(clock.getTimeScale()).toBe(2.5);
    });

    it('displays current time scale value', () => {
      useSimClockStore.getState().setTimeScale(3.5);

      render(<TimeControlPanel />);

      expect(screen.getByText(/time scale: 3\.5x/i)).toBeInTheDocument();
    });

    it('respects min and max bounds (0.1x to 100x)', async () => {
      const user = userEvent.setup();
      const clock = new SimClock();
      useSimClockStore.getState().setClockInstance(clock);

      render(<TimeControlPanel />);

      const slider = screen.getByRole('slider') as HTMLInputElement;

      // Try to set below minimum
      fireEvent.change(slider, { target: { value: '0.05' } });
      // Should clamp to 0.1
      expect(useSimClockStore.getState().timeScale).toBeGreaterThanOrEqual(0.1);

      // Try to set above maximum
      fireEvent.change(slider, { target: { value: '150' } });
      // Should clamp to 100
      expect(useSimClockStore.getState().timeScale).toBeLessThanOrEqual(100);
    });
  });

  describe('single step button', () => {
    it('advances sim by fixed delta when paused', async () => {
      const user = userEvent.setup();
      const clock = new SimClock({ paused: true, simTime: 10 });
      useSimClockStore.getState().setClockInstance(clock);
      useSimClockStore.getState().setPaused(true);
      useSimClockStore.getState().setSimTime(10);

      render(<TimeControlPanel />);

      const stepButton = screen.getByRole('button', { name: /step/i });
      expect(stepButton).toBeInTheDocument();

      await user.click(stepButton);

      expect(useSimClockStore.getState().simTime).toBe(11);
      expect(clock.getTime()).toBe(11);
    });

    it('is hidden when not paused', () => {
      const clock = new SimClock({ paused: false });
      useSimClockStore.getState().setClockInstance(clock);
      useSimClockStore.getState().setPaused(false);

      render(<TimeControlPanel />);

      expect(screen.queryByRole('button', { name: /step/i })).not.toBeInTheDocument();
    });

    it('is visible when paused', () => {
      const clock = new SimClock({ paused: true });
      useSimClockStore.getState().setClockInstance(clock);
      useSimClockStore.getState().setPaused(true);

      render(<TimeControlPanel />);

      expect(screen.getByRole('button', { name: /step/i })).toBeInTheDocument();
    });
  });

  describe('current sim time display', () => {
    it('displays formatted time correctly', () => {
      useSimClockStore.getState().setSimTime(45);
      const { rerender } = render(<TimeControlPanel />);
      expect(screen.getByText(/45s/i)).toBeInTheDocument();

      useSimClockStore.getState().setSimTime(125);
      rerender(<TimeControlPanel />);
      expect(screen.getAllByText(/2m 5s/i).length).toBeGreaterThan(0);

      useSimClockStore.getState().setSimTime(3665);
      rerender(<TimeControlPanel />);
      expect(screen.getAllByText(/1h 1m 5s/i).length).toBeGreaterThan(0);
    });

    it('updates when sim time changes', () => {
      const { rerender } = render(<TimeControlPanel />);
      
      useSimClockStore.getState().setSimTime(10);
      rerender(<TimeControlPanel />);
      expect(screen.getByText(/10s/i)).toBeInTheDocument();

      useSimClockStore.getState().setSimTime(20);
      rerender(<TimeControlPanel />);
      expect(screen.getByText(/20s/i)).toBeInTheDocument();
    });
  });

  describe('seed input', () => {
    it('allows setting deterministic seed', async () => {
      const user = userEvent.setup();
      const clock = new SimClock({ seed: 'old-seed' });
      useSimClockStore.getState().setClockInstance(clock);

      render(<TimeControlPanel />);

      const seedInput = screen.getByPlaceholderText(/enter seed/i) as HTMLInputElement;
      expect(seedInput).toBeInTheDocument();

      await user.clear(seedInput);
      await user.type(seedInput, 'new-deterministic-seed');

      // Trigger onChange by blurring
      await user.tab();

      expect(useSimClockStore.getState().seed).toBe('new-deterministic-seed');
      expect(clock.getSeed()).toBe('new-deterministic-seed');
    });

    it('displays current seed value', () => {
      useSimClockStore.getState().setSeed('test-seed-123');

      render(<TimeControlPanel />);

      const seedInput = screen.getByPlaceholderText(/enter seed/i) as HTMLInputElement;
      expect(seedInput.value).toBe('test-seed-123');
    });
  });

  describe('reset button', () => {
    it('resets simulation time when clicked', async () => {
      const user = userEvent.setup();
      const clock = new SimClock({ simTime: 100 });
      useSimClockStore.getState().setClockInstance(clock);
      useSimClockStore.getState().setSimTime(100);

      render(<TimeControlPanel />);

      const resetButton = screen.getByRole('button', { name: /reset/i });
      expect(resetButton).toBeInTheDocument();

      await user.click(resetButton);

      expect(useSimClockStore.getState().simTime).toBe(0);
      expect(clock.getTime()).toBe(0);
    });

    it('has danger styling', () => {
      render(<TimeControlPanel />);

      const resetButton = screen.getByRole('button', { name: /reset/i });
      expect(resetButton).toHaveClass('danger');
    });
  });

  describe('panel layout and styling', () => {
    it('renders all control elements', () => {
      render(<TimeControlPanel />);

      expect(screen.getByText(/time control/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /play|pause/i })).toBeInTheDocument();
      expect(screen.getByRole('slider')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter seed/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
    });
  });
});

