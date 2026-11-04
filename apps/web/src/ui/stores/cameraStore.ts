import { create } from 'zustand';

export type CameraPreset = 'freecam' | 'cinematic' | 'follow' | 'zoomIn';

interface CameraState {
  preset: CameraPreset;
  /** When true (zoomIn), camera follows selected or hero while time advances. */
  followTarget: boolean;
  setPreset: (preset: CameraPreset) => void;
  setFollowTarget: (follow: boolean) => void;
}

export const useCameraStore = create<CameraState>((set) => ({
  preset: 'freecam',
  followTarget: true,
  setPreset: (preset) => set({ preset }),
  setFollowTarget: (followTarget) => set({ followTarget }),
}));
