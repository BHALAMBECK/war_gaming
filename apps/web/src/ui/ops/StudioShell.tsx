import { useState } from 'react';
import { useOpsStore } from '@/ui/stores/opsStore';
import { useScenarioStore } from '@/ui/stores/scenarioStore';
import { useAgentStore } from '@/ui/stores/agentStore';
import { ScenarioDesigner } from './ScenarioDesigner';
import { ConstellationDesigner } from './ConstellationDesigner';
import { SatelliteDesigner } from './SatelliteDesigner';
import { AnalysisHubPage } from './AnalysisHubPage';
import { ScenarioSection } from '@/ui/ScenarioSection';

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
            onClick={() => setAppPhase('analysis')}
          >
            Analysis hub
          </button>
          <button
            type="button"
            className="ops-btn active"
            onClick={() => setAppPhase('ops')}
          >
            Run ops
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
          {tab === 'scenario' && <ScenarioDesigner />}
          {tab === 'satellite' && <SatelliteDesigner />}
          {tab === 'constellation' && <ConstellationDesigner />}
          {tab === 'load' && <ScenarioSection isExpanded />}
          {tab === 'analysis' && <AnalysisHubPage />}
        </main>
      </div>
    </div>
  );
}
