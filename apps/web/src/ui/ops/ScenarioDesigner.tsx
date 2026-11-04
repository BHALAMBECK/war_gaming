import { useMemo, useState } from 'react';
import { useScenarioStore } from '@/ui/stores/scenarioStore';
import { useDesignStore } from '@/ui/stores/designStore';
import { saveToLocalStorage } from '@/scenario/storage';
import { FIDELITY_LABELS } from '@/sim/orbit/fidelity';
import type { FidelityLevel } from '@/sim/orbit/fidelity';
import {
  SCENARIO_STEP_LABEL,
  TEMPLATE_OPTIONS,
  buildScenarioFromWizard,
  coerceScenarioStep,
  nextScenarioStep,
  prevScenarioStep,
  previewAgentCount,
  scenarioStepOrder,
  type ScenarioTemplate,
} from '@/scenario/design/scenarioBuilder';
import { attachBusToAgents } from '@/scenario/design/agentBus';
import { quoteProgram } from '@/scenario/design/pricing';
import { validateScenario } from '@/scenario/schema';
import { ConstellationFormFields } from './ConstellationFormFields';
import { QuoteSummary } from './QuoteSummary';
import { designerField, designerHint, designerRow } from './designerStyles';
import { WizardStepper } from './WizardStepper';
import { BuilderFooter } from './BuilderFooter';
import { openSatellite, runLoadedScenario, showProject } from './studioNavigation';

export function ScenarioDesigner() {
  const loadScenario = useScenarioStore((s) => s.loadScenario);
  const satelliteDraft = useDesignStore((s) => s.satelliteDraft);
  const draft = useDesignStore((s) => s.scenarioDraft);
  const storedStep = useDesignStore((s) => s.scenarioStep);
  const patch = useDesignStore((s) => s.patchScenarioDraft);
  const setScenarioStep = useDesignStore((s) => s.setScenarioStep);
  const [error, setError] = useState('');

  const step = coerceScenarioStep(draft.template, storedStep);
  const order = scenarioStepOrder(draft.template);
  const stepIndex = Math.max(0, order.indexOf(step));

  const agentCount = useMemo(() => previewAgentCount(draft), [draft]);
  const programQuote = useMemo(
    () => (agentCount > 0 ? quoteProgram(satelliteDraft, agentCount) : null),
    [satelliteDraft, agentCount]
  );

  const goForward = () => {
    const next = nextScenarioStep(draft.template, step);
    if (next) setScenarioStep(next);
  };

  const goBack = () => {
    const prev = prevScenarioStep(draft.template, step);
    if (prev) setScenarioStep(prev);
    else showProject();
  };

  const commit = () => {
    setError('');
    try {
      let scenario = buildScenarioFromWizard(draft);
      if (scenario.agents.length > 0) {
        scenario = validateScenario({
          ...scenario,
          agents: attachBusToAgents(scenario.agents, satelliteDraft),
        });
      }
      loadScenario(scenario);
      try {
        saveToLocalStorage(scenario);
      } catch {
        /* the sim can still start if local save fails */
      }
      useDesignStore.getState().resetScenarioWizard(false);
      runLoadedScenario();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to build scenario');
    }
  };

  const primary =
    step === 'fleet'
      ? { label: 'Set the clock', action: goForward }
      : step === 'sim'
        ? { label: 'Review the scenario', action: goForward }
        : step === 'review'
          ? { label: 'Run this scenario', action: commit }
          : null;

  return (
    <div className="ops-builder">
      <div className="ops-builder-body">
        <WizardStepper
          steps={order.map((id) => SCENARIO_STEP_LABEL[id])}
          step={stepIndex}
          onStep={(index) => {
            const id = order[index];
            if (id) setScenarioStep(id);
          }}
        />

        {step === 'template' && (
          <div>
            <p style={designerHint}>Pick a path to continue.</p>
            {TEMPLATE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`ops-btn ops-choice ${draft.template === opt.value ? 'active' : ''}`}
                onClick={() => {
                  const template = opt.value as ScenarioTemplate;
                  patch({ template });
                  const next = nextScenarioStep(template, 'template');
                  if (next) setScenarioStep(next);
                }}
              >
                <strong>{opt.label}</strong>
                <span>{opt.blurb}</span>
              </button>
            ))}
          </div>
        )}

        {step === 'fleet' && (
          <div>
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
          </div>
        )}

        {step === 'sim' && (
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
                onChange={(e) => {
                  const timeStep = Number(e.target.value);
                  if (Number.isFinite(timeStep)) patch({ timeStep });
                }}
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

        {step === 'review' && (
          <div>
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
            {programQuote ? (
              <QuoteSummary
                quote={programQuote}
                title={`Program quote · ${satelliteDraft.name}`}
              />
            ) : (
              <p style={designerHint}>Empty sandbox — no program quote.</p>
            )}
            <button
              type="button"
              className="ops-text-btn"
              onClick={() => openSatellite('scenario', true)}
            >
              Change the satellite
            </button>
          </div>
        )}

        {error && (
          <p style={{ ...designerHint, color: 'var(--ops-danger)', marginTop: 8 }}>
            {error}
          </p>
        )}
      </div>

      <BuilderFooter
        backLabel={step === 'template' ? 'Project' : 'Back'}
        onBack={goBack}
        primaryLabel={primary?.label}
        onPrimary={primary?.action}
      />
    </div>
  );
}
