import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CameraPanel } from './CameraPanel';
import { useCameraStore } from './stores/cameraStore';

describe('CameraPanel integration', () => {
  beforeEach(() => {
    // Reset store to default
    useCameraStore.getState().setPreset('freecam');
  });

  describe('camera presets', () => {
    it('displays three camera presets as buttons', () => {
      render(<CameraPanel />);

      expect(screen.getByRole('button', { name: /freecam/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cinematic orbit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /follow target/i })).toBeInTheDocument();
    });

    it('updates store when preset is selected', async () => {
      const user = userEvent.setup();
      render(<CameraPanel />);

      const cinematicButton = screen.getByRole('button', { name: /cinematic orbit/i });
      await user.click(cinematicButton);

      expect(useCameraStore.getState().preset).toBe('cinematic');
    });

    it('highlights active preset visually', () => {
      useCameraStore.getState().setPreset('cinematic');
      render(<CameraPanel />);

      const cinematicButton = screen.getByRole('button', { name: /cinematic orbit/i });
      expect(cinematicButton).toHaveClass('active');
    });

    it('only one preset is active at a time', () => {
      useCameraStore.getState().setPreset('follow');
      render(<CameraPanel />);

      const freecamButton = screen.getByRole('button', { name: /freecam/i });
      const cinematicButton = screen.getByRole('button', { name: /cinematic orbit/i });
      const followButton = screen.getByRole('button', { name: /follow target/i });

      expect(freecamButton).not.toHaveClass('active');
      expect(cinematicButton).not.toHaveClass('active');
      expect(followButton).toHaveClass('active');
    });

    it('allows switching between presets', async () => {
      const user = userEvent.setup();
      render(<CameraPanel />);

      // Start with freecam (default)
      expect(useCameraStore.getState().preset).toBe('freecam');

      // Switch to cinematic
      await user.click(screen.getByRole('button', { name: /cinematic orbit/i }));
      expect(useCameraStore.getState().preset).toBe('cinematic');

      // Switch to follow
      await user.click(screen.getByRole('button', { name: /follow target/i }));
      expect(useCameraStore.getState().preset).toBe('follow');

      // Switch back to freecam
      await user.click(screen.getByRole('button', { name: /freecam/i }));
      expect(useCameraStore.getState().preset).toBe('freecam');
    });
  });

  describe('panel layout', () => {
    it('renders with correct title', () => {
      render(<CameraPanel />);
      expect(screen.getByText(/camera/i)).toBeInTheDocument();
    });

    it('has proper styling classes', () => {
      render(<CameraPanel />);
      const panel = screen.getByText(/camera/i).closest('div');
      expect(panel).toBeInTheDocument();
    });
  });
});

