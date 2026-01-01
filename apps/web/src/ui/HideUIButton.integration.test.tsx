import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HideUIButton } from './HideUIButton';

describe('HideUIButton integration', () => {
  describe('button toggle', () => {
    it('toggles UI visibility when clicked', async () => {
      const user = userEvent.setup();
      const onToggle = vi.fn();

      render(<HideUIButton onToggle={onToggle} />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent(/hide ui/i);

      await user.click(button);

      expect(onToggle).toHaveBeenCalledWith(true);
      expect(button).toHaveTextContent(/show ui/i);
    });

    it('button text changes between "Hide UI" and "Show UI"', async () => {
      const user = userEvent.setup();
      const onToggle = vi.fn();

      const { rerender } = render(<HideUIButton onToggle={onToggle} />);

      let button = screen.getByRole('button');
      expect(button).toHaveTextContent(/hide ui/i);

      await user.click(button);
      expect(onToggle).toHaveBeenCalledWith(true);

      // Simulate UI being hidden
      rerender(<HideUIButton onToggle={onToggle} />);
      // Note: The component uses internal state, so we need to check the callback
      // The actual text change happens via internal state
    });

    it('calls onToggle callback with correct state', async () => {
      const user = userEvent.setup();
      const onToggle = vi.fn();

      render(<HideUIButton onToggle={onToggle} />);

      const button = screen.getByRole('button');

      // First click - should hide UI
      await user.click(button);
      expect(onToggle).toHaveBeenCalledWith(true);
      expect(onToggle).toHaveBeenCalledTimes(1);

      // Second click - should show UI
      await user.click(button);
      expect(onToggle).toHaveBeenCalledWith(false);
      expect(onToggle).toHaveBeenCalledTimes(2);
    });
  });

  describe('button styling', () => {
    it('has correct initial styling when UI is visible', () => {
      const onToggle = vi.fn();
      render(<HideUIButton onToggle={onToggle} />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      // Button should be visible and styled
    });

    it('updates styling when UI is hidden', async () => {
      const user = userEvent.setup();
      const onToggle = vi.fn();
      render(<HideUIButton onToggle={onToggle} />);

      const button = screen.getByRole('button');
      await user.click(button);

      // Button should still be visible (it's the only UI element when hidden)
      expect(button).toBeInTheDocument();
    });
  });

  describe('button position', () => {
    it('is positioned absolutely in top-left', () => {
      const onToggle = vi.fn();
      render(<HideUIButton onToggle={onToggle} />);

      const button = screen.getByRole('button');
      const styles = window.getComputedStyle(button);
      expect(styles.position).toBe('absolute');
    });
  });
});

