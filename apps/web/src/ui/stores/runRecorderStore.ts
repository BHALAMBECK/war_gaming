import { create } from 'zustand';
import type { Agent } from '@/render/Agents.types';

export interface TrajectoryAgentSample {
  id: string;
  r: [number, number, number];
  v: [number, number, number];
}

export interface TrajectorySample {
  t: number;
  agents: TrajectoryAgentSample[];
}

const MAX_SAMPLES = 10_000;

interface RunRecorderState {
  recording: boolean;
  samples: TrajectorySample[];
  stepCounter: number;
  setRecording: (recording: boolean) => void;
  clearSamples: () => void;
  /**
   * Append a trajectory sample when recording, with subsample rules:
   * every 1 step if ≤200 agents, every 5 steps if >200.
   */
  maybeSample: (agents: Agent[], simTime: number) => void;
}

export const useRunRecorderStore = create<RunRecorderState>((set, get) => ({
  recording: false,
  samples: [],
  stepCounter: 0,
  setRecording: (recording) => {
    if (recording) {
      set({ recording: true, samples: [], stepCounter: 0 });
    } else {
      set({ recording: false });
    }
  },
  clearSamples: () => set({ samples: [], stepCounter: 0 }),
  maybeSample: (agents, simTime) => {
    const { recording, samples, stepCounter } = get();
    if (!recording) return;

    const nextCounter = stepCounter + 1;
    const stride = agents.length > 200 ? 5 : 1;
    if (nextCounter % stride !== 0) {
      set({ stepCounter: nextCounter });
      return;
    }

    const sample: TrajectorySample = {
      t: simTime,
      agents: agents.map((a) => ({
        id: a.id,
        r: [...a.state.position] as [number, number, number],
        v: [...a.state.velocity] as [number, number, number],
      })),
    };

    const next = [...samples, sample];
    if (next.length > MAX_SAMPLES) {
      next.splice(0, next.length - MAX_SAMPLES);
    }
    set({ samples: next, stepCounter: nextCounter });
  },
}));
