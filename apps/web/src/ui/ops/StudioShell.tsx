import { useState } from 'react';
import { useScenarioStore } from '@/ui/stores/scenarioStore';
import { useAgentStore } from '@/ui/stores/agentStore';
import { useOpsStore } from '@/ui/stores/opsStore';
import { ScenarioDesigner } from './ScenarioDesigner';
import { ConstellationDesigner } from './ConstellationDesigner';
import { SatelliteDesigner } from './SatelliteDesigner';
import { AnalysisHubPage } from './AnalysisHubPage';
import { ScenarioSection } from '@/ui/ScenarioSection';
import { PhaseNav } from './PhaseNav';

type StudioTab =
  | 'scenario'
  | 'satellite'
  | 'constellation'
  | 'load'
  | 'analysis';

/**
 * Design / analyze / build screen (no live ops globe).
 */
export function StudioShell() {
  const setAppPhase = useOpsStore((s) => s.setAppPhase);
  const scenarioName = useScenarioStore((s) => s.scenarioName);
  const agents = useAgentStore((s) => s.agents);
  const [tab, setTab] = useState<StudioTab>('scenario');

  return (
    <div className="ops-stage">
      <header className="ops-stage-header studio">
        <div className="ops-brand">
          OSWV <span>Studio</span>
        </div>
        <div className="ops-stage-subtitle ops-mono">
          {scenarioName || 'Untitled'} · {agents.length} sats
        </div>
        <PhaseNav current="studio" />
        <div className="ops-btn-group" style={{ marginLeft: 'auto' }}>
          <button
            type="button"
            className="ops-btn active"
            onClick={() => setAppPhase('ops')}
          >
            Run live ops
          </button>
        </div>
      </header>

      <div className="ops-studio-layout">
        <aside className="ops-studio-nav">
          <div className="ops-section-title">Workspace</div>
          {(
            [
              ['scenario', 'Scenario designer'],
              ['satellite', 'Satellite designer'],
              ['constellation', 'Constellation'],
              ['load', 'Load / save'],
              ['analysis', 'Analysis hub'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`ops-btn ${tab === id ? 'active' : ''}`}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                marginBottom: 4,
              }}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </aside>

        <main className="ops-studio-main">
          <div key={tab} className="ops-studio-pane">
            {tab === 'scenario' && <ScenarioDesigner />}
            {tab === 'satellite' && <SatelliteDesigner />}
            {tab === 'constellation' && <ConstellationDesigner />}
            {tab === 'load' && <ScenarioSection isExpanded />}
            {tab === 'analysis' && <AnalysisHubPage />}
          </div>
        </main>
      </div>
    </div>
  );
}
