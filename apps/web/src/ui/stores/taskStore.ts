/**
 * Zustand store for task allocation and scoring state.
 */

import { create } from 'zustand';
import { Objective } from '@/sim/tasks/types';

interface TaskState {
  /** Array of objectives */
  objectives: Objective[];
  /** Current score */
  score: number;
  /** Game timer in seconds (independent of sim clock) */
  gameTime: number;
  /** Whether the timer is running */
  timerRunning: boolean;
  /** Last update timestamp for timer */
  lastTimerUpdate: number | null;
  
  /** Set objectives (resets score and timer) */
  setObjectives: (objectives: Objective[]) => void;
  /** Update an objective */
  updateObjective: (id: string, updates: Partial<Objective>) => void;
  /** Complete an objective (awards points if not already completed) */
  completeObjective: (id: string) => void;
  /** Reset tasks (clear objectives, reset score and timer) */
  resetTasks: () => void;
  /** Update game timer (called from render loop) */
  updateTimer: (deltaTime: number) => void;
  /** Start timer */
  startTimer: () => void;
  /** Stop timer */
  stopTimer: () => void;
  /** Format game time as MM:SS or HH:MM:SS */
  formatGameTime: () => string;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  objectives: [],
  score: 0,
  gameTime: 0,
  timerRunning: false,
  lastTimerUpdate: null,
  
  setObjectives: (objectives) => {
    set({
      objectives: [...objectives],
      score: 0,
      gameTime: 0,
      timerRunning: objectives.length > 0,
      lastTimerUpdate: objectives.length > 0 ? Date.now() : null,
    });
  },
  
  updateObjective: (id, updates) => {
    set((state) => ({
      objectives: state.objectives.map((obj) =>
        obj.id === id ? { ...obj, ...updates } as Objective : obj
      ),
    }));
  },
  
  completeObjective: (id) => {
    set((state) => {
      const objective = state.objectives.find((obj) => obj.id === id);
      if (!objective || objective.completed) {
        return state; // Already completed or not found
      }
      
      // Award points and mark as completed
      const newScore = state.score + objective.points;
      const updatedObjectives = state.objectives.map((obj) =>
        obj.id === id ? { ...obj, completed: true } : obj
      );
      
      // Check if all objectives are completed
      const allCompleted = updatedObjectives.every((obj) => obj.completed);
      
      return {
        objectives: updatedObjectives,
        score: newScore,
        timerRunning: !allCompleted, // Stop timer when all complete
        lastTimerUpdate: allCompleted ? null : state.lastTimerUpdate,
      };
    });
  },
  
  resetTasks: () => {
    set({
      objectives: [],
      score: 0,
      gameTime: 0,
      timerRunning: false,
      lastTimerUpdate: null,
    });
  },
  
  updateTimer: (deltaTime: number) => {
    set((state) => {
      if (!state.timerRunning) {
        return state;
      }
      
      return {
        gameTime: state.gameTime + deltaTime,
      };
    });
  },
  
  startTimer: () => {
    set({
      timerRunning: true,
      lastTimerUpdate: Date.now(),
    });
  },
  
  stopTimer: () => {
    set({
      timerRunning: false,
      lastTimerUpdate: null,
    });
  },
  
  formatGameTime: () => {
    const gameTime = get().gameTime;
    const totalSeconds = Math.floor(gameTime);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  },
}));
