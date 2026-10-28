import { useMemo, useState } from 'react';
import { useOpsStore } from '@/ui/stores/opsStore';
import { useScenarioStore } from '@/ui/stores/scenarioStore';
import {
  EXAMPLE_SCENARIO_LABELS,
  getExampleScenarioNames,
  loadExampleScenario,
  type ExampleScenarioName,
} from '@/scenario/examples';
import {
  deleteFromLocalStorage,
  listLocalStorageScenarios,
  loadFromLocalStorage,
} from '@/scenario/storage';
import { DEFAULT_SCENARIO_WIZARD } from '@/scenario/design/scenarioBuilder';
import { buildScenarioFromWizard } from '@/scenario/design/scenarioBuilder';

/**
 * Full-screen project / scenario library (AppPhase = library).
 */
export function ProjectLibrary() {
  const setAppPhase = useOpsStore((s) => s.setAppPhase);
  const loadScenario = useScenarioStore((s) => s.loadScenario);
  const scenarioName = useScenarioStore((s) => s.scenarioName);
  const [saved, setSaved] = useState(() => listLocalStorageScenarios());
  const [error, setError] = useState('');

  const examples = useMemo(() => getExampleScenarioNames(), []);

  const openExample = (name: ExampleScenarioName) => {
    try {
      const scenario = loadExampleScenario(name);
      loadScenario(scenario);
      setAppPhase('studio');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load example');
    }
  };

  const openSaved = (name: string) => {
    try {
      const scenario = loadFromLocalStorage(name);
      if (!scenario) throw new Error('Not found in local storage');
      loadScenario(scenario);
      setAppPhase('studio');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to open project');
    }
  };

  const newBlank = () => {
    try {
      const scenario = buildScenarioFromWizard({
        ...DEFAULT_SCENARIO_WIZARD,
        template: 'empty',
        name: 'Untitled Project',
        description: 'New project from library',
      });
      loadScenario(scenario);
      setAppPhase('studio');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create project');
    }
  };

  const removeSaved = (name: string) => {
    deleteFromLocalStorage(name);
    setSaved(listLocalStorageScenarios());
  };

  return (
    <div className="ops-stage">
      <header className="ops-stage-header">
        <div className="ops-brand">
          OSWV <span>Lattice Ops</span>
        </div>
        <div className="ops-stage-subtitle">Project library</div>
      </header>

      <main className="ops-stage-main">
        <p className="ops-stage-lead">
          Pick a scenario to design and analyze, then run it in the ops console.
          {scenarioName ? (
            <>
              {' '}
              Last open: <span className="ops-mono">{scenarioName}</span>
            </>
          ) : null}
        </p>

        <div className="ops-btn-group" style={{ marginBottom: 20 }}>
          <button type="button" className="ops-btn active" onClick={newBlank}>
            New blank project
          </button>
          {scenarioName && (
            <button
              type="button"
              className="ops-btn"
              onClick={() => setAppPhase('studio')}
            >
              Resume studio
            </button>
          )}
        </div>

        <section>
          <div className="ops-section-title">Built-in examples</div>
          <div className="ops-project-grid">
            {examples.map((name) => (
              <button
                key={name}
                type="button"
                className="ops-project-card"
                onClick={() => openExample(name)}
              >
                <strong>{EXAMPLE_SCENARIO_LABELS[name]}</strong>
                <span className="ops-mono">{name}</span>
              </button>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 24 }}>
          <div className="ops-section-title">Saved locally</div>
          {saved.length === 0 ? (
            <p style={{ color: 'var(--ops-muted)', fontSize: 12 }}>
              No local projects yet. Save from Studio or Constellation designer.
            </p>
          ) : (
            <div className="ops-project-grid">
              {saved.map((name) => (
                <div key={name} className="ops-project-card row">
                  <button
                    type="button"
                    className="ops-btn"
                    style={{ flex: 1, textAlign: 'left' }}
                    onClick={() => openSaved(name)}
                  >
                    {name}
                  </button>
                  <button
                    type="button"
                    className="ops-btn danger"
                    onClick={() => removeSaved(name)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {error && (
          <p style={{ color: 'var(--ops-danger)', marginTop: 16, fontSize: 12 }}>
            {error}
          </p>
        )}
      </main>
    </div>
  );
}
