import type { AgentScenario } from '@/scenario/types';
import { agentBusMetadata, type SatelliteDraft } from './satelliteBuilder';

export function attachBusToAgents(
  agents: AgentScenario[],
  draft: SatelliteDraft
): AgentScenario[] {
  const bus = agentBusMetadata(draft);
  return agents.map((a) => ({ ...a, bus }));
}
