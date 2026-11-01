import { useMemo, useState } from 'react';
import { useOpsStore } from '@/ui/stores/opsStore';
import { PhaseNav } from './PhaseNav';
import { StageSpotlight } from './StageSpotlight';
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

const EXAMPLE_BLURBS: Partial<Record<ExampleScenarioName, string>> = {
  demo: 'Small fleet for smoke tests and demos.',
  'task-demo': 'Agents with objectives and tasking.',
  'large-swarm': 'Stress the renderer with 500 tracks.',
  'simple-ring': 'Classic ring constellation layout.',
};

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
        <PhaseNav current="library" />
      </header>

      <main className="ops-stage-main">
        <StageSpotlight className="ops-library-hero">
          <p className="ops-eyebrow">Project library</p>
          <h1 className="ops-stage-heading">Choose a project</h1>
          <p className="ops-stage-lead">
            Open an example or saved scenario, design in Studio, then step into the
            live globe when you are ready to run.
            {scenarioName ? (
              <>
                {' '}
                Last open: <span className="ops-mono">{scenarioName}</span>
              </>
            ) : null}
          </p>
        </StageSpotlight>

        <section>
          <p className="ops-eyebrow">Start here</p>
          <div className="ops-bento">
            <button
              type="button"
              className="ops-project-card ops-bento-feature ops-glass-card"
              onClick={newBlank}
            >
              <span className="ops-card-kicker">Blank slate</span>
              <strong>New blank project</strong>
              <span className="ops-card-desc">
                Empty sandbox — configure fleet and sim in Studio.
              </span>
            </button>
            {scenarioName ? (
              <button
                type="button"
                className="ops-project-card ops-glass-card"
                onClick={() => setAppPhase('studio')}
              >
                <span className="ops-card-kicker">Continue</span>
                <strong>Resume studio</strong>
                <span className="ops-mono">{scenarioName}</span>
              </button>
            ) : null}
            {examples.map((name) => (
              <button
                key={name}
                type="button"
                className="ops-project-card ops-glass-card"
                onClick={() => openExample(name)}
              >
                <span className="ops-card-kicker">Example</span>
                <strong>{EXAMPLE_SCENARIO_LABELS[name]}</strong>
                <span className="ops-card-desc">
                  {EXAMPLE_BLURBS[name] ?? name}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <p className="ops-eyebrow">Saved on this device</p>
          {saved.length === 0 ? (
            <p className="ops-empty-note">
              No local projects yet. Save from Studio or Constellation designer.
            </p>
          ) : (
            <div className="ops-project-grid">
              {saved.map((name) => (
                <div key={name} className="ops-project-card row ops-glass-card">
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
