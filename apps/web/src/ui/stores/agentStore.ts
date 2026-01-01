import { create } from 'zustand';
import { Agent } from '@/render/Agents.types';
import { CartesianState } from '@/sim/orbit/types';
import { applyDeltaV } from '@/sim/maneuvers/deltaV';
import { rtnToEci } from '@/sim/maneuvers/rtnToEci';

interface AgentState {
  agents: Agent[];
  selectedAgentId: string | null;
  hoveredAgentId: string | null;
  setAgents: (agents: Agent[]) => void;
  updateAgent: (id: string, state: CartesianState) => void;
  updateAgentsBatch: (updates: Array<{ id: string; state: CartesianState }>) => void;
  selectAgent: (id: string | null) => void;
  hoverAgent: (id: string | null) => void;
  clearSelection: () => void;
  getSelectedAgent: () => Agent | null;
  applyDeltaVToAgent: (id: string, rtnVector: [number, number, number]) => void;
  updateAgentDvRemaining: (id: string, dvRemaining: number) => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  selectedAgentId: null,
  hoveredAgentId: null,
  setAgents: (agents) => set({ agents }),
  updateAgent: (id, state) => {
    set((current) => ({
      agents: current.agents.map((agent) =>
        agent.id === id ? { ...agent, state } : agent
      ),
    }));
  },
  updateAgentsBatch: (updates) => {
    set((current) => {
      const updateMap = new Map(updates.map((u) => [u.id, u.state]));
      return {
        agents: current.agents.map((agent) =>
          updateMap.has(agent.id)
            ? { ...agent, state: updateMap.get(agent.id)! }
            : agent
        ),
      };
    });
  },
  selectAgent: (id) => {
    set((current) => ({
      selectedAgentId: id,
      agents: current.agents.map((agent) => ({
        ...agent,
        selected: agent.id === id,
      })),
    }));
  },
  hoverAgent: (id) => {
    set((current) => ({
      hoveredAgentId: id,
      agents: current.agents.map((agent) => ({
        ...agent,
        hovered: agent.id === id,
      })),
    }));
  },
  clearSelection: () => {
    set((current) => ({
      selectedAgentId: null,
      agents: current.agents.map((agent) => ({
        ...agent,
        selected: false,
      })),
    }));
  },
  getSelectedAgent: () => {
    const state = get();
    return state.agents.find((a) => a.id === state.selectedAgentId) || null;
  },
  applyDeltaVToAgent: (id, rtnVector) => {
    const state = get();
    const agent = state.agents.find((a) => a.id === id);
    if (!agent) {
      console.warn(`Agent ${id} not found`);
      return;
    }

    try {
      // Convert RTN vector to ECI frame
      const dvVector = rtnToEci(rtnVector, agent.state);

      // Apply delta-v burn
      const { newState, newDvRemaining } = applyDeltaV(
        agent.state,
        dvVector,
        agent.dvRemaining
      );

      // Update agent state and delta-v budget
      set((current) => ({
        agents: current.agents.map((a) =>
          a.id === id
            ? { ...a, state: newState, dvRemaining: newDvRemaining }
            : a
        ),
      }));
    } catch (error) {
      console.error(`Failed to apply delta-v to agent ${id}:`, error);
      throw error;
    }
  },
  updateAgentDvRemaining: (id, dvRemaining) => {
    set((current) => ({
      agents: current.agents.map((agent) =>
        agent.id === id ? { ...agent, dvRemaining: Math.max(0, dvRemaining) } : agent
      ),
    }));
  },
}));
