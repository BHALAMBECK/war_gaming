import { useOpsStore } from '@/ui/stores/opsStore';
import { useScenarioStore } from '@/ui/stores/scenarioStore';
import { useAgentStore } from '@/ui/stores/agentStore';
import { AnalysisHubPage } from './AnalysisHubPage';
import { PhaseNav } from './PhaseNav';
import { StageBeams } from './StageBeams';
import { MovingBorder } from './MovingBorder';

/** Dedicated analysis page (no globe). */
export function AnalysisShell() {
  const setAppPhase = useOpsStore((s) => s.setAppPhase);
  const scenarioName = useScenarioStore((s) => s.scenarioName);
  const agents = useAgentStore((s) => s.agents);

  return (
    <div className="ops-stage">
      <StageBeams />
      <header className="ops-stage-header studio">
        <div className="ops-brand">
          OSWV <span>Analysis</span>
        </div>
        <div className="ops-stage-subtitle ops-mono">
          {scenarioName || 'Untitled'} · {agents.length} sats
        </div>
        <PhaseNav current="analysis" />
        <MovingBorder
          className="ops-cta-moving-border"
          onClick={() => setAppPhase('ops')}
        >
          Run live ops
        </MovingBorder>
      </header>
      <main className="ops-analysis-shell-main">
        <AnalysisHubPage />
      </main>
    </div>
  );
}
