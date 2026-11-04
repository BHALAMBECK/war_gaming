import { useState } from 'react';
import {
  useOpsStore,
  FIDELITY_LABELS,
  type FidelityLevel,
} from '@/ui/stores/opsStore';
import { useSimClockStore } from '@/ui/stores/simClockStore';
import { useScenarioStore } from '@/ui/stores/scenarioStore';

const SPEED_PRESETS = [0.5, 1, 2, 5, 10] as const;
const FIDELITY_LEVELS: FidelityLevel[] = [0, 1, 2];

/**
 * Centered prompt when a project is opened into Live ops.
 * Start keeps the scenario fidelity. Speed and fidelity can be changed first.
 */
export function SimLaunchOverlay() {
  const pending = useOpsStore((s) => s.pendingSimLaunch);
  const setPending = useOpsStore((s) => s.setPendingSimLaunch);
  const setFidelity = useOpsStore((s) => s.setFidelity);
  const scenarioName = useScenarioStore((s) => s.scenarioName);
  const setPaused = useSimClockStore((s) => s.setPaused);
  const setTimeScale = useSimClockStore((s) => s.setTimeScale);

  const [customizing, setCustomizing] = useState(false);
  const [draftFidelity, setDraftFidelity] = useState<FidelityLevel>(0);
  const [draftSpeed, setDraftSpeed] = useState(1);

  const fidelity = useOpsStore((s) => s.fidelity);

  if (!pending) return null;

  const start = (timeScale: number, fidelityOverride?: FidelityLevel) => {
    setFidelity(fidelityOverride ?? useOpsStore.getState().fidelity);
    setTimeScale(timeScale);
    setPaused(false);
    setPending(false);
    setCustomizing(false);
    setDraftFidelity(0);
    setDraftSpeed(1);
  };

  const backToLibrary = () => {
    setPending(false);
    setCustomizing(false);
    setDraftFidelity(0);
    setDraftSpeed(1);
    useOpsStore.getState().setAppPhase('library');
  };

  const openCustomize = () => {
    setDraftFidelity(useOpsStore.getState().fidelity);
    setDraftSpeed(1);
    setCustomizing(true);
  };

  return (
    <div className="ops-launch-overlay" role="dialog" aria-modal="true">
      <div className="ops-launch-panel ops-glass-card">
        <p className="ops-eyebrow">Ready to run</p>
        <h2 className="ops-launch-title">{scenarioName || 'Untitled project'}</h2>

        {!customizing ? (
          <>
            <p className="ops-launch-lead">
              Starts at{' '}
              <span className="ops-mono">
                {FIDELITY_LABELS[fidelity]} · 1×
              </span>
            </p>
            <div className="ops-launch-actions">
              <button
                type="button"
                className="ops-btn active ops-btn-primary"
                onClick={() => start(1)}
              >
                Start
              </button>
            </div>
            <div className="ops-launch-links">
              <button type="button" className="ops-text-btn" onClick={openCustomize}>
                Change fidelity or speed
              </button>
              <button type="button" className="ops-text-btn" onClick={backToLibrary}>
                Library
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="ops-launch-lead">
              Choose fidelity and speed, then start.
            </p>

            <div className="ops-launch-field">
              <span className="ops-eyebrow">Fidelity</span>
              <div className="ops-btn-group ops-launch-presets">
                {FIDELITY_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={`ops-btn ${draftFidelity === level ? 'active' : ''}`}
                    onClick={() => setDraftFidelity(level)}
                    title={FIDELITY_LABELS[level]}
                  >
                    {FIDELITY_LABELS[level]}
                  </button>
                ))}
              </div>
            </div>

            <div className="ops-launch-field">
              <span className="ops-eyebrow">Speed</span>
              <div className="ops-btn-group ops-launch-presets">
                {SPEED_PRESETS.map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    className={`ops-btn ${draftSpeed === speed ? 'active' : ''}`}
                    onClick={() => setDraftSpeed(speed)}
                  >
                    {speed}×
                  </button>
                ))}
              </div>
            </div>

            <div className="ops-launch-actions">
              <button
                type="button"
                className="ops-btn active"
                onClick={() => start(draftSpeed, draftFidelity)}
              >
                Start
              </button>
              <button
                type="button"
                className="ops-btn"
                onClick={() => setCustomizing(false)}
              >
                Back
              </button>
              <button
                type="button"
                className="ops-text-btn"
                onClick={backToLibrary}
              >
                Library
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
