import { useMemo, useState } from 'react';
import {
  CATEGORY_LABELS,
  COMPONENT_CATALOG,
  LAUNCH_VEHICLES,
  SATELLITE_PROFILES,
  type ComponentCategory,
} from '@/scenario/design/satelliteCatalog';
import {
  patchComponentsFromProfile,
  resolveBillOfMaterials,
  type SatelliteDraft,
} from '@/scenario/design/satelliteBuilder';
import { quoteProgram } from '@/scenario/design/pricing';
import { useDesignStore } from '@/ui/stores/designStore';
import { useAgentStore } from '@/ui/stores/agentStore';
import { useOpsStore } from '@/ui/stores/opsStore';
import { QuoteSummary } from './QuoteSummary';
import { designerField, designerHint, designerRow } from './designerStyles';
import { WizardStepper } from './WizardStepper';
import { BuilderFooter } from './BuilderFooter';
import { finishSatellite, showProject } from './studioNavigation';

export const SATELLITE_STEP_LABELS = ['Profile', 'Parts', 'Launch', 'Review'] as const;

export function SatelliteDesigner() {
  const draft = useDesignStore((s) => s.satelliteDraft);
  const setDraft = useDesignStore((s) => s.setSatelliteDraft);
  const patch = useDesignStore((s) => s.patchSatelliteDraft);
  const step = useDesignStore((s) => s.satelliteStep);
  const setStep = useDesignStore((s) => s.setSatelliteStep);
  const builderReturn = useOpsStore((s) => s.builderReturn);
  const scenarioStarted = useDesignStore((s) => s.scenarioDraftStarted);
  const agentCount = useAgentStore((s) => s.agents.length);
  const [error, setError] = useState('');

  const bom = useMemo(() => resolveBillOfMaterials(draft), [draft]);
  const unitQuote = useMemo(() => quoteProgram(draft, 1), [draft]);
  const returnToScenario = builderReturn === 'scenario' || scenarioStarted;

  const setComponentQty = (id: string, quantity: number) => {
    const qty = Math.max(0, Math.min(99, Math.floor(quantity)));
    patch({
      customizeComponents: true,
      components: { ...draft.components, [id]: qty },
    });
  };

  const componentsByCategory = useMemo(() => {
    const map = new Map<ComponentCategory, typeof COMPONENT_CATALOG>();
    for (const c of COMPONENT_CATALOG) {
      const list = map.get(c.category) ?? [];
      list.push(c);
      map.set(c.category, list);
    }
    return map;
  }, []);

  const profileDefaults = useMemo(
    () => getProfileComponents({ ...draft, customizeComponents: false }),
    [draft]
  );

  const finish = () => {
    setError('');
    try {
      finishSatellite();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not apply this bus');
    }
  };

  const leave = () => {
    if (builderReturn === 'scenario') {
      useOpsStore.getState().setStudioFocus('scenario');
      return;
    }
    showProject();
  };

  const primaryLabel = returnToScenario
    ? 'Use this bus'
    : agentCount > 0
      ? 'Run live ops'
      : 'Build the scenario';

  return (
    <div className="ops-builder">
      <div className="ops-builder-body">
        <WizardStepper
          steps={SATELLITE_STEP_LABELS}
          step={step}
          onStep={setStep}
        />

        {step === 0 && (
          <div>
            <p style={designerHint}>Pick a bus to continue.</p>
            {SATELLITE_PROFILES.map((profile) => (
              <button
                key={profile.id}
                type="button"
                className={`ops-btn ops-choice ${draft.profile === profile.id ? 'active' : ''}`}
                onClick={() => {
                  if (draft.profile !== profile.id) {
                    setDraft(patchComponentsFromProfile(draft, profile.id));
                  }
                  setStep(1);
                }}
              >
                <strong>{profile.label}</strong>
                <span>{profile.blurb}</span>
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div>
            <div className="ops-btn-group" style={{ marginBottom: 8 }}>
              <button
                type="button"
                className={`ops-btn ${!draft.customizeComponents ? 'active' : ''}`}
                onClick={() => patch({ customizeComponents: false })}
              >
                Profile defaults
              </button>
              <button
                type="button"
                className={`ops-btn ${draft.customizeComponents ? 'active' : ''}`}
                onClick={() =>
                  patch({
                    customizeComponents: true,
                    components: { ...profileDefaults, ...draft.components },
                  })
                }
              >
                Customize parts
              </button>
            </div>
            {!draft.customizeComponents && (
              <p style={designerHint}>
                Using {SATELLITE_PROFILES.find((p) => p.id === draft.profile)?.label}{' '}
                defaults. Customize only if you need different parts.
              </p>
            )}
            {draft.customizeComponents &&
              [...componentsByCategory.entries()].map(([cat, parts]) => (
                <div key={cat}>
                  <div className="ops-section-title">{CATEGORY_LABELS[cat]}</div>
                  {parts.map((part) => {
                    const qty = draft.components[part.id] ?? profileDefaults[part.id] ?? 0;
                    return (
                      <label key={part.id} style={designerRow}>
                        <span className="ops-label" title={part.description}>
                          {part.name}
                        </span>
                        <input
                          style={{ ...designerField, maxWidth: 72 }}
                          type="number"
                          min={0}
                          max={12}
                          value={qty}
                          onChange={(e) => {
                            const quantity = Number(e.target.value);
                            if (Number.isFinite(quantity)) {
                              setComponentQty(part.id, quantity);
                            }
                          }}
                        />
                      </label>
                    );
                  })}
                </div>
              ))}
            <div className="ops-stat-row">
              <span className="k">Dry mass</span>
              <span className="v">{bom.dryMassKg.toFixed(1)} kg</span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <p style={designerHint}>Pick a launch vehicle to review the bus.</p>
            {LAUNCH_VEHICLES.map((lv) => (
              <button
                key={lv.id}
                type="button"
                className={`ops-btn ops-choice ${draft.launchVehicle === lv.id ? 'active' : ''}`}
                onClick={() => {
                  patch({ launchVehicle: lv.id });
                  setStep(3);
                }}
              >
                <strong>{lv.label}</strong>
                <span>
                  ${(lv.costPerKgUsd / 1000).toFixed(1)}k/kg · min $
                  {(lv.minCostUsd / 1_000_000).toFixed(2)}M
                </span>
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <div>
            <label style={designerRow}>
              <span className="ops-label">Bus name</span>
              <input
                style={designerField}
                value={draft.name}
                onChange={(e) => patch({ name: e.target.value })}
              />
            </label>
            <label style={designerRow}>
              <span className="ops-label">Integration margin (%)</span>
              <input
                style={designerField}
                type="number"
                min={0}
                max={40}
                value={draft.integrationMarginPct}
                onChange={(e) => {
                  const integrationMarginPct = Number(e.target.value);
                  if (Number.isFinite(integrationMarginPct)) {
                    patch({ integrationMarginPct });
                  }
                }}
              />
            </label>
            <div className="ops-stat-row">
              <span className="k">Configuration</span>
              <span className="v">{bom.summary}</span>
            </div>
            <QuoteSummary quote={unitQuote} title="Single-satellite quote" />
            {error && (
              <p style={{ ...designerHint, color: 'var(--ops-danger)', marginTop: 8 }}>
                {error}
              </p>
            )}
          </div>
        )}
      </div>

      <BuilderFooter
        backLabel={step === 0 ? (builderReturn === 'scenario' ? 'Back to scenario' : 'Project') : 'Back'}
        onBack={() => {
          if (step === 0) leave();
          else setStep(step - 1);
        }}
        primaryLabel={step === 1 ? 'Choose a launch vehicle' : step === 3 ? primaryLabel : undefined}
        onPrimary={
          step === 1 ? () => setStep(2) : step === 3 ? finish : undefined
        }
      />
    </div>
  );
}

function getProfileComponents(draft: SatelliteDraft): Record<string, number> {
  return resolveBillOfMaterials(draft).lines.reduce(
    (acc, line) => {
      acc[line.id] = line.quantity;
      return acc;
    },
    {} as Record<string, number>
  );
}
