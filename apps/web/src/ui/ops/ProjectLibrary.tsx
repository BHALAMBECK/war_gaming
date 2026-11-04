import { useMemo, useState } from 'react';
import { PhaseNav } from './PhaseNav';
import { StageSpotlight } from './StageSpotlight';
import { StageBeams } from './StageBeams';
import { TiltCard } from './TiltCard';
import { MovingBorder } from './MovingBorder';
import { ShimmerText } from './ShimmerText';
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
import { openProjectInOps } from './openProjectInOps';
import { resumeStudio, startScenario } from './studioNavigation';
import { useDesignStore } from '@/ui/stores/designStore';

const EXAMPLE_BLURBS: Partial<Record<ExampleScenarioName, string>> = {
  demo: 'Small fleet for smoke tests and demos.',
  'task-demo': 'Agents with objectives and tasking.',
  'large-swarm': 'Stress the renderer with 500 tracks.',
  'simple-ring': 'Classic ring constellation layout.',
  'solar-missions':
    'Tri-body constellation: Earth, Moon, Mars + hero HEO craft.',
};

/**
 * Full-screen project / scenario library (AppPhase = library).
 */
export function ProjectLibrary() {
  const loadScenario = useScenarioStore((s) => s.loadScenario);
  const scenarioName = useScenarioStore((s) => s.scenarioName);
  const draftStarted = useDesignStore((s) => s.scenarioDraftStarted);
  const draftName = useDesignStore((s) => s.scenarioDraft.name);
  const [saved, setSaved] = useState(() => listLocalStorageScenarios());
  const [error, setError] = useState('');

  const examples = useMemo(() => getExampleScenarioNames(), []);

  const openExample = (name: ExampleScenarioName) => {
    try {
      openProjectInOps(loadExampleScenario(name));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load example');
    }
  };

  const openSaved = (name: string) => {
    try {
      const scenario = loadFromLocalStorage(name);
      if (!scenario) throw new Error('Not found in local storage');
      openProjectInOps(scenario);
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
      startScenario();
      useDesignStore.getState().patchScenarioDraft({
        name: 'Untitled Project',
        description: 'New project from library',
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create project');
    }
  };

  const removeSaved = (name: string) => {
    if (!window.confirm(`Delete "${name}" from this device?`)) return;
    deleteFromLocalStorage(name);
    setSaved(listLocalStorageScenarios());
  };

  return (
    <div className="ops-stage">
      <StageBeams />
      <header className="ops-stage-header">
        <div className="ops-brand">
          OSWV <span>Lattice Ops</span>
        </div>
        <PhaseNav current="library" />
      </header>

      <main className="ops-stage-main">
        <StageSpotlight className="ops-library-hero">
          <p className="ops-eyebrow">Project library</p>
          <ShimmerText as="h1" className="ops-stage-heading">
            Choose a project
          </ShimmerText>
          <p className="ops-stage-lead">
            Start a scenario, or open a project and start the sim.
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
            <MovingBorder
              className="ops-bento-feature-wrap"
              onClick={newBlank}
            >
              <span className="ops-card-kicker">Build</span>
              <strong>New scenario</strong>
              <span className="ops-card-desc">
                Walk through the fleet and the clock, one step at a time.
              </span>
            </MovingBorder>
            {scenarioName ? (
              <TiltCard
                className="ops-project-card ops-glass-card"
                onClick={resumeStudio}
              >
                <span className="ops-card-kicker">Continue</span>
                <strong>{draftStarted ? 'Continue scenario' : 'Resume studio'}</strong>
                <span className="ops-mono">
                  {draftStarted ? draftName || scenarioName : scenarioName}
                </span>
              </TiltCard>
            ) : null}
            {examples.map((name) => (
              <TiltCard
                key={name}
                className="ops-project-card ops-glass-card"
                onClick={() => openExample(name)}
              >
                <span className="ops-card-kicker">Example</span>
                <strong>{EXAMPLE_SCENARIO_LABELS[name]}</strong>
                <span className="ops-card-desc">
                  {EXAMPLE_BLURBS[name] ?? name}
                </span>
              </TiltCard>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <p className="ops-eyebrow">Saved on this device</p>
          {saved.length === 0 ? (
            <p className="ops-empty-note">
              No local projects yet. Save from the project screen after you build one.
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
