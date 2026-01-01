import { create } from 'zustand';

export type CameraPreset = 'freecam' | 'cinematic' | 'follow';

interface CameraState {
  preset: CameraPreset;
  setPreset: (preset: CameraPreset) => void;
}

export const useCameraStore = create<CameraState>((set) => ({
  preset: 'freecam',
  setPreset: (preset) => set({ preset }),
}));

