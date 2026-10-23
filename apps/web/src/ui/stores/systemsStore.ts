import { create } from 'zustand';

export interface EngagementEvent {
  id: string;
  simTime: number;
  shooterId: string;
  targetId: string;
  hit: boolean;
  reason: string;
  rangeM: number;
}

export interface SensorSnapshot {
  id: string;
  simTime: number;
  agentId: string;
  targetIds: string[];
  label: string;
}

interface SystemsState {
  engagements: EngagementEvent[];
  snapshots: SensorSnapshot[];
  activeBeams: Array<{
    id: string;
    fromId: string;
    toId: string;
    expiresAt: number;
  }>;
  addEngagement: (event: Omit<EngagementEvent, 'id'>) => void;
  addSnapshot: (snap: Omit<SensorSnapshot, 'id'>) => void;
  addBeam: (beam: { fromId: string; toId: string; expiresAt: number }) => void;
  pruneBeams: (simTime: number) => void;
  clearAnalysis: () => void;
}

let eventSeq = 0;

export const useSystemsStore = create<SystemsState>((set, get) => ({
  engagements: [],
  snapshots: [],
  activeBeams: [],
  addEngagement: (event) => {
    eventSeq += 1;
    set((state) => ({
      engagements: [
        { ...event, id: `eng-${eventSeq}` },
        ...state.engagements,
      ].slice(0, 100),
    }));
  },
  addSnapshot: (snap) => {
    eventSeq += 1;
    set((state) => ({
      snapshots: [
        { ...snap, id: `snap-${eventSeq}` },
        ...state.snapshots,
      ].slice(0, 50),
    }));
  },
  addBeam: (beam) => {
    eventSeq += 1;
    set((state) => ({
      activeBeams: [
        ...state.activeBeams,
        { ...beam, id: `beam-${eventSeq}` },
      ],
    }));
  },
  pruneBeams: (simTime) => {
    const beams = get().activeBeams;
    if (beams.every((b) => b.expiresAt > simTime)) return;
    set({
      activeBeams: beams.filter((b) => b.expiresAt > simTime),
    });
  },
  clearAnalysis: () =>
    set({ engagements: [], snapshots: [], activeBeams: [] }),
}));
