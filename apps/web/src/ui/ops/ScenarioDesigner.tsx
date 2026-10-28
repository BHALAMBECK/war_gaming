import { useMemo, useState } from 'react';
import { useScenarioStore } from '@/ui/stores/scenarioStore';
import { downloadScenario } from '@/scenario/saver';
import { saveToLocalStorage } from '@/scenario/storage';
import { FIDELITY_LABELS } from '@/sim/orbit/fidelity';
import type { FidelityLevel } from '@/sim/orbit/fidelity';
import {
  DEFAULT_SCENARIO_WIZARD,
  TEMPLATE_OPTIONS,
  buildScenarioFromWizard,
  previewAgentCount,
  type ScenarioWizardDraft,
  type ScenarioTemplate,
} from '@/scenario/design/scenarioBuilder';
import { ConstellationFormFields } from './ConstellationFormFields';
import { designerField, designerHint, designerRow } from './designerStyles';

const STEPS = ['Template', 'Fleet', 'Sim', 'Review'] as const;

export function ScenarioDesigner() {
  const loadScenario = useScenarioStore((s) => s.loadScenario);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<ScenarioWizardDraft>(DEFAULT_SCENARIO_WIZARD);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const agentCount = useMemo(() => previewAgentCount(draft), [draft]);

  const patch = (partial: Partial<ScenarioWizardDraft>) =>
    setDraft((d) => ({ ...d, ...partial }));

  const apply = (alsoSave: boolean) => {
    setError('');
    try {
      const scenario = buildScenarioFromWizard(draft);
      loadScenario(scenario);
      if (alsoSave) {
        saveToLocalStorage(scenario);
        downloadScenario(scenario);
      }
      setStatus(
        `Loaded ${scenario.name} · ${scenario.agents.length} sats · seed ${scenario.seed}`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to build scenario');
    }
  };

  return (
    <div>
      <div className="ops-section-title" style={{ marginTop: 0 }}>
        Scenario Designer
      </div>
      <p style={designerHint}>
        Guided form to build a valid scenario JSON and load it into the sim.
      </p>

      <div className="ops-btn-group" style={{ marginBottom: 10, flexWrap: 'wrap' }}>
        {STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            className={`ops-btn ${step === i ? 'active' : ''}`}
            onClick={() => setStep(i)}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      {step === 0 && (
        <div>
          <div className="ops-label" style={{ marginBottom: 6 }}>
            Choose a path
          </div>
          {TEMPLATE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`ops-btn ${draft.template === opt.value ? 'active' : ''}`}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                marginBottom: 6,
              }}
              onClick={() =>
                patch({ template: opt.value as ScenarioTemplate })
              }
            >
              <strong>{opt.label}</strong>
              <div style={{ fontSize: 10, color: 'var(--ops-muted)', marginTop: 2 }}>
                {opt.blurb}
              </div>
            </button>
          ))}
          <label style={designerRow}>
            <span className="ops-label">Name</span>
            <input
              style={designerField}
              value={draft.name}
              onChange={(e) => patch({ name: e.target.value })}
            />
          </label>
          <label style={designerRow}>
            <span className="ops-label">Description</span>
            <textarea
              style={{ ...designerField, minHeight: 48, resize: 'vertical' }}
              value={draft.description}
              onChange={(e) => patch({ description: e.target.value })}
            />
          </label>
        </div>
      )}

      {step === 1 && (
        <div>
          {draft.template === 'empty' ? (
            <p style={designerHint}>Empty template — no fleet to configure.</p>
          ) : (
            <>
              <ConstellationFormFields
                title={
                  draft.template === 'opposing-fleets'
                    ? 'Friendly constellation'
                    : 'Constellation'
                }
                value={draft.primary}
                onChange={(primary) => patch({ primary })}
              />
              {draft.template === 'opposing-fleets' && (
                <ConstellationFormFields
                  title="Enemy constellation"
                  value={draft.opposing}
                  onChange={(opposing) => patch({ opposing })}
                />
              )}
            </>
          )}
        </div>
      )}

      {step === 2 && (
        <div>
          <label style={designerRow}>
            <span className="ops-label">Seed</span>
            <input
              style={designerField}
              value={draft.seed}
              onChange={(e) => patch({ seed: e.target.value })}
            />
          </label>
          <label style={designerRow}>
            <span className="ops-label">Time step (s)</span>
            <input
              style={designerField}
              type="number"
              min={0.01}
              step={0.1}
              value={draft.timeStep}
              onChange={(e) => patch({ timeStep: Number(e.target.value) })}
            />
          </label>
          <label style={designerRow}>
            <span className="ops-label">Propagator fidelity</span>
            <select
              style={designerField}
              value={draft.fidelity}
              onChange={(e) =>
                patch({
                  fidelity: Number(e.target.value) as FidelityLevel,
                })
              }
            >
              {([0, 1, 2] as FidelityLevel[]).map((f) => (
                <option key={f} value={f}>
                  {FIDELITY_LABELS[f]}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="ops-stat-row">
            <span className="k">Name</span>
            <span className="v">{draft.name}</span>
          </div>
          <div className="ops-stat-row">
            <span className="k">Template</span>
            <span className="v">{draft.template}</span>
          </div>
          <div className="ops-stat-row">
            <span className="k">Satellites</span>
            <span className="v">{agentCount}</span>
          </div>
          <div className="ops-stat-row">
            <span className="k">Seed</span>
            <span className="v">{draft.seed}</span>
          </div>
          <div className="ops-stat-row">
            <span className="k">Fidelity</span>
            <span className="v">{FIDELITY_LABELS[draft.fidelity]}</span>
          </div>
          <div className="ops-stat-row">
            <span className="k">dt</span>
            <span className="v">{draft.timeStep}s</span>
          </div>
          <div className="ops-btn-group" style={{ marginTop: 10, flexWrap: 'wrap' }}>
            <button type="button" className="ops-btn active" onClick={() => apply(false)}>
              Load into sim
            </button>
            <button type="button" className="ops-btn" onClick={() => apply(true)}>
              Load + save/download
            </button>
          </div>
        </div>
      )}

      <div className="ops-btn-group" style={{ marginTop: 10 }}>
        <button
          type="button"
          className="ops-btn"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          Back
        </button>
        <button
          type="button"
          className="ops-btn"
          disabled={step === STEPS.length - 1}
          onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
        >
          Next
        </button>
      </div>

      {status && (
        <p style={{ ...designerHint, color: 'var(--ops-warn)', marginTop: 8 }}>
          {status}
        </p>
      )}
      {error && (
        <p style={{ ...designerHint, color: 'var(--ops-danger)', marginTop: 8 }}>
          {error}
        </p>
      )}
    </div>
  );
}
