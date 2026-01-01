import { create } from 'zustand';
import { SimClock } from '@/sim/SimClock';

interface SimClockState {
  paused: boolean;
  timeScale: number;
  simTime: number; // seconds
  seed: string;
  clockInstance: SimClock | null;
  setPaused: (paused: boolean) => void;
  setTimeScale: (scale: number) => void;
  setSimTime: (time: number) => void;
  setSeed: (seed: string) => void;
  setClockInstance: (clock: SimClock | null) => void;
  toggle: () => void;
  step: () => void;
  reset: () => void;
  formatTime: () => string;
}

export const useSimClockStore = create<SimClockState>((set, get) => ({
  paused: false,
  timeScale: 1.0,
  simTime: 0,
  seed: 'default',
  clockInstance: null,
  setPaused: (paused) => {
    set({ paused });
    const clock = get().clockInstance;
    if (clock) {
      paused ? clock.pause() : clock.play();
    }
  },
  setTimeScale: (timeScale) => {
    set({ timeScale });
    const clock = get().clockInstance;
    if (clock) {
      clock.setTimeScale(timeScale);
    }
  },
  setSimTime: (simTime) => set({ simTime }),
  setSeed: (seed) => {
    set({ seed });
    const clock = get().clockInstance;
    if (clock) {
      clock.setSeed(seed);
      clock.reset(); // Reset time when seed changes
      set({ simTime: 0 }); // Update store time after reset
    }
  },
  setClockInstance: (clockInstance) => set({ clockInstance }),
  toggle: () => {
    const clock = get().clockInstance;
    if (clock) {
      clock.toggle();
      set({ paused: clock.isPaused() });
    } else {
      // Fallback: toggle paused state directly
      set((state) => ({ paused: !state.paused }));
    }
  },
  step: () => {
    const clock = get().clockInstance;
    if (clock && clock.isPaused()) {
      clock.step();
      set({ simTime: clock.getTime() });
    } else {
      // Fallback: increment simTime directly
      set((state) => ({ simTime: state.simTime + 1.0 }));
    }
  },
  reset: () => {
    const clock = get().clockInstance;
    if (clock) {
      clock.reset();
      set({ simTime: 0 });
    } else {
      set({ simTime: 0 });
    }
  },
  formatTime: () => {
    const simTime = get().simTime;
    const totalSeconds = Math.floor(simTime);
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
  },
}));

