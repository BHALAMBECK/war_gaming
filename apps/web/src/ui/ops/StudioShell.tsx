import { useState } from 'react';
import { useScenarioStore } from '@/ui/stores/scenarioStore';
import { useAgentStore } from '@/ui/stores/agentStore';
import { useDesignStore } from '@/ui/stores/designStore';
import { useOpsStore } from '@/ui/stores/opsStore';
import { downloadScenario } from '@/scenario/saver';
import { saveToLocalStorage } from '@/scenario/storage';
import {
  SCENARIO_STEP_LABEL,
  coerceScenarioStep,
} from '@/scenario/design/scenarioBuilder';
import { ScenarioDesigner } from './ScenarioDesigner';
import { ConstellationDesigner } from './ConstellationDesigner';
import { SatelliteDesigner, SATELLITE_STEP_LABELS } from './SatelliteDesigner';
import { PhaseNav } from './PhaseNav';
import { StageBeams } from './StageBeams';
import { MovingBorder } from './MovingBorder';
import {
  continueScenario,
  openConstellation,
  openSatellite,
  runLoadedScenario,
  showProject,
  startScenario,
} from './studioNavigation';

/**
 * Project bench, or a single builder with everything else hidden.
 */
export function StudioShell() {
  const focus = useOpsStore((s) => s.studioFocus);
  const template = useDesignStore((s) => s.scenarioDraft.template);
  const scenarioStep = useDesignStore((s) => s.scenarioStep);
  const satelliteStep = useDesignStore((s) => s.satelliteStep);

  if (focus === 'home') {
    return <ProjectBench />;
  }

  const title =
    focus === 'scenario'
      ? 'Scenario'
      : focus === 'satellite'
        ? 'Satellite'
        : 'Constellation';
  const stepLabel =
    focus === 'scenario'
      ? SCENARIO_STEP_LABEL[coerceScenarioStep(template, scenarioStep)]
      : focus === 'satellite'
        ? SATELLITE_STEP_LABELS[satelliteStep] ?? 'Profile'
        : 'Shell';

  return (
    <div className="ops-stage">
      <header className="ops-stage-header studio ops-focus-header">
        <div className="ops-brand">
          OSWV <span>{title}</span>
        </div>
        <div className="ops-stage-subtitle ops-mono">{stepLabel}</div>
        <button type="button" className="ops-text-btn" onClick={showProject}>
          Project
        </button>
      </header>
      <main className="ops-studio-main ops-studio-main-focus">
        {focus === 'scenario' && <ScenarioDesigner />}
        {focus === 'satellite' && <SatelliteDesigner />}
        {focus === 'constellation' && <ConstellationDesigner />}
      </main>
    </div>
  );
}

function ProjectBench() {
  const scenarioName = useScenarioStore((s) => s.scenarioName);
  const currentScenario = useScenarioStore((s) => s.currentScenario);
  const agents = useAgentStore((s) => s.agents);
  const busName = useDesignStore((s) => s.satelliteDraft.name);
  const started = useDesignStore((s) => s.scenarioDraftStarted);
  const draftName = useDesignStore((s) => s.scenarioDraft.name);
  const draftTemplate = useDesignStore((s) => s.scenarioDraft.template);
  const storedStep = useDesignStore((s) => s.scenarioStep);
  const satelliteStep = useDesignStore((s) => s.satelliteStep);
  const [notice, setNotice] = useState('');
  const draftStep = SCENARIO_STEP_LABEL[coerceScenarioStep(draftTemplate, storedStep)];

  const continuingSatellite = !started && satelliteStep > 0;

  const primary = started
    ? { label: 'Continue the scenario', action: continueScenario }
    : continuingSatellite
      ? {
          label: 'Continue the satellite',
          action: () => openSatellite('home', false),
        }
      : agents.length > 0
        ? { label: 'Run live ops', action: runLoadedScenario }
        : { label: 'Build a scenario', action: startScenario };

  const save = () => {
    if (!currentScenario) return;
    try {
      saveToLocalStorage(currentScenario);
      setNotice(`Saved ${currentScenario.name}`);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Save failed');
    }
  };

  return (
    <div className="ops-stage">
      <StageBeams />
      <header className="ops-stage-header studio">
        <div className="ops-brand">
          OSWV <span>Studio</span>
        </div>
        <div className="ops-stage-subtitle ops-mono">
          {scenarioName || 'Untitled'} · {agents.length} sats
        </div>
        <PhaseNav current="studio" />
      </header>
      <main className="ops-stage-main ops-bench">
        <p className="ops-eyebrow">This project</p>
        <h1 className="ops-stage-heading">
          {started ? draftName || 'Untitled scenario' : scenarioName || 'Untitled'}
        </h1>
        <p className="ops-stage-lead">
          {started
            ? `In progress · ${draftStep}`
            : `${agents.length} satellites · bus ${busName}`}
        </p>
        <MovingBorder onClick={primary.action}>{primary.label}</MovingBorder>

        <div className="ops-bench-list">
          {agents.length > 0 && !started && (
            <button type="button" className="ops-btn ops-choice" onClick={startScenario}>
              <strong>Build a new scenario</strong>
              <span>Replaces this fleet when you run it</span>
            </button>
          )}
          {!continuingSatellite && (
            <button
              type="button"
              className="ops-btn ops-choice"
              onClick={() => openSatellite('home', satelliteStep === 0)}
            >
              <strong>
                {satelliteStep > 0 ? 'Continue the satellite' : 'Design the satellite'}
              </strong>
              <span>{busName}</span>
            </button>
          )}
          <button type="button" className="ops-btn ops-choice" onClick={openConstellation}>
            <strong>Add satellites</strong>
            <span>
              {agents.length > 0
                ? 'Add a shell to this project, then run'
                : 'Build a shell and run it'}
            </span>
          </button>
        </div>

        {started && currentScenario && (
          <button type="button" className="ops-text-btn" onClick={runLoadedScenario}>
            Run the loaded project instead
          </button>
        )}
        {started && (
          <button type="button" className="ops-text-btn" onClick={startScenario}>
            Start the scenario over
          </button>
        )}

        <p className="ops-eyebrow" style={{ marginTop: 22 }}>
          On this device
        </p>
        <div className="ops-bench-links">
          <button
            type="button"
            className="ops-text-btn"
            disabled={!currentScenario}
            onClick={save}
          >
            Save
          </button>
          <button
            type="button"
            className="ops-text-btn"
            disabled={!currentScenario}
            onClick={() => {
              if (currentScenario) downloadScenario(currentScenario);
            }}
          >
            Download
          </button>
        </div>
        {notice && <p className="ops-stage-lead">{notice}</p>}
      </main>
    </div>
  );
}
