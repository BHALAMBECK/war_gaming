import { useState } from 'react';
import { useOpsStore } from '@/ui/stores/opsStore';
import { useScenarioStore } from '@/ui/stores/scenarioStore';
import { useAgentStore } from '@/ui/stores/agentStore';
import { FIDELITY_LABELS } from '@/sim/orbit/fidelity';
import { ScenarioDesigner } from './ScenarioDesigner';
import { ConstellationDesigner } from './ConstellationDesigner';
import { ScenarioSection } from '@/ui/ScenarioSection';

type StudioTab = 'scenario' | 'constellation' | 'load' | 'summary';

/**
 * Design / analyze / build screen (no live ops globe).
 */
export function StudioShell() {
  const setAppPhase = useOpsStore((s) => s.setAppPhase);
  const scenarioName = useScenarioStore((s) => s.scenarioName);
  const currentScenario = useScenarioStore((s) => s.currentScenario);
  const agents = useAgentStore((s) => s.agents);
  const [tab, setTab] = useState<StudioTab>('scenario');

  const friendly = agents.filter((a) => a.team === 'friendly').length;
  const enemy = agents.length - friendly;

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
              ['constellation', 'Constellation'],
              ['load', 'Load / save'],
              ['summary', 'Analysis summary'],
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
          {tab === 'constellation' && <ConstellationDesigner />}
          {tab === 'load' && <ScenarioSection isExpanded />}
          {tab === 'summary' && (
            <div>
              <div className="ops-section-title" style={{ marginTop: 0 }}>
                Project summary
              </div>
              <div className="ops-stat-row">
                <span className="k">Name</span>
                <span className="v">{currentScenario?.name ?? '—'}</span>
              </div>
              <div className="ops-stat-row">
                <span className="k">Seed</span>
                <span className="v">{currentScenario?.seed ?? '—'}</span>
              </div>
              <div className="ops-stat-row">
                <span className="k">Tracks</span>
                <span className="v">{agents.length}</span>
              </div>
              <div className="ops-stat-row">
                <span className="k">Friendly / Enemy</span>
                <span className="v">
                  {friendly} / {enemy}
                </span>
              </div>
              <div className="ops-stat-row">
                <span className="k">Propagator</span>
                <span className="v">
                  {FIDELITY_LABELS[currentScenario?.sim.fidelity ?? 0]}
                </span>
              </div>
              <div className="ops-stat-row">
                <span className="k">Time step</span>
                <span className="v">
                  {currentScenario?.sim.timeStep ?? '—'}s
                </span>
              </div>
              <p
                style={{
                  marginTop: 14,
                  fontSize: 11,
                  color: 'var(--ops-muted)',
                  lineHeight: 1.4,
                }}
              >
                Use Scenario / Constellation designers to build fleets, then{' '}
                <strong>Run ops</strong> for the live three-panel Earth / Solar
                console.
              </p>
              <button
                type="button"
                className="ops-btn active"
                style={{ marginTop: 10 }}
                onClick={() => setAppPhase('ops')}
              >
                Run ops
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
