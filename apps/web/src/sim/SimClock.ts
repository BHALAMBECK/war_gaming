import { setSeed } from '@/util/seed';

export interface SimClockState {
  paused: boolean;
  timeScale: number;
  simTime: number; // seconds
  seed: string;
  stepDelta: number; // seconds per step
}

export class SimClock {
  private state: SimClockState;

  constructor(initialState?: Partial<SimClockState>) {
    this.state = {
      paused: false,
      timeScale: 1.0,
      simTime: 0,
      seed: 'default',
      stepDelta: 1.0,
      ...initialState,
    };
    
    // Initialize RNG with seed
    setSeed(this.state.seed);
  }

  /**
   * Get current simulation time in seconds.
   */
  getTime(): number {
    return this.state.simTime;
  }

  /**
   * Get current time scale multiplier.
   */
  getTimeScale(): number {
    return this.state.timeScale;
  }

  /**
   * Check if simulation is paused.
   */
  isPaused(): boolean {
    return this.state.paused;
  }

  /**
   * Get current seed.
   */
  getSeed(): string {
    return this.state.seed;
  }

  /**
   * Pause the simulation.
   */
  pause(): void {
    this.state.paused = true;
  }

  /**
   * Resume the simulation.
   */
  play(): void {
    this.state.paused = false;
  }

  /**
   * Toggle pause/play.
   */
  toggle(): void {
    this.state.paused = !this.state.paused;
  }

  /**
   * Set time scale (0.1x to 100x).
   */
  setTimeScale(scale: number): void {
    this.state.timeScale = Math.max(0.1, Math.min(100, scale));
    // Pause if scale is 0
    if (this.state.timeScale === 0) {
      this.state.paused = true;
    }
  }

  /**
   * Set seed and reinitialize RNG.
   */
  setSeed(seed: string): void {
    this.state.seed = seed;
    setSeed(seed);
  }

  /**
   * Advance simulation by one step (when paused, for single-step).
   */
  step(): number {
    const delta = this.state.stepDelta;
    this.state.simTime += delta;
    return delta;
  }

  /**
   * Update simulation time based on frame delta and time scale.
   * Returns the actual simulation delta that should be used for physics.
   */
  update(frameDelta: number): number {
    if (this.state.paused || this.state.timeScale === 0) {
      return 0;
    }

    const simDelta = frameDelta * this.state.timeScale;
    this.state.simTime += simDelta;
    return simDelta;
  }

  /**
   * Reset simulation time to 0.
   */
  reset(): void {
    this.state.simTime = 0;
    // Reset seed to ensure determinism
    setSeed(this.state.seed);
  }

  /**
   * Get current state (for serialization).
   */
  getState(): SimClockState {
    return { ...this.state };
  }

  /**
   * Format simulation time as human-readable string.
   */
  formatTime(): string {
    const totalSeconds = Math.floor(this.state.simTime);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }
}

