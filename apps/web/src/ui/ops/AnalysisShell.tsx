import { useOpsStore } from '@/ui/stores/opsStore';
import { useScenarioStore } from '@/ui/stores/scenarioStore';
import { useAgentStore } from '@/ui/stores/agentStore';
import { AnalysisHubPage } from './AnalysisHubPage';

/** Dedicated analysis page (no globe). */
export function AnalysisShell() {
  const setAppPhase = useOpsStore((s) => s.setAppPhase);
  const scenarioName = useScenarioStore((s) => s.scenarioName);
  const agents = useAgentStore((s) => s.agents);

  return (
    <div className="ops-stage">
      <header className="ops-stage-header studio">
        <div className="ops-brand">
          OSWV <span>Analysis</span>
        </div>
        <div className="ops-stage-subtitle ops-mono">
          {scenarioName || 'Untitled'} · {agents.length} sats
        </div>
        <div className="ops-btn-group" style={{ marginLeft: 'auto' }}>
          <button
            type="button"
            className="ops-btn"
            onClick={() => setAppPhase('library')}
          >
            Library
          </button>
          <button
            type="button"
            className="ops-btn"
            onClick={() => setAppPhase('studio')}
          >
            Studio
          </button>
          <button type="button" className="ops-btn active" onClick={() => setAppPhase('ops')}>
            Run ops
          </button>
        </div>
      </header>
      <main className="ops-analysis-shell-main">
        <AnalysisHubPage />
      </main>
    </div>
  );
}
