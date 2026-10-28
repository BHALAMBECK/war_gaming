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
import { QuoteSummary } from './QuoteSummary';
import { designerField, designerHint, designerRow } from './designerStyles';

const STEPS = ['Profile', 'Components', 'Launch', 'Review'] as const;

export function SatelliteDesigner() {
  const draft = useDesignStore((s) => s.satelliteDraft);
  const setDraft = useDesignStore((s) => s.setSatelliteDraft);
  const patch = useDesignStore((s) => s.patchSatelliteDraft);
  const [step, setStep] = useState(0);

  const bom = useMemo(() => resolveBillOfMaterials(draft), [draft]);
  const unitQuote = useMemo(() => quoteProgram(draft, 1), [draft]);

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

  return (
    <div>
      <div className="ops-section-title" style={{ marginTop: 0 }}>
        Satellite Designer
      </div>
      <p style={designerHint}>
        Pick a high-level bus profile, optionally tune reaction wheels and
        other components, then use the same bus for constellation and scenario
        quotes.
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
          <label style={designerRow}>
            <span className="ops-label">Bus name</span>
            <input
              style={designerField}
              value={draft.name}
              onChange={(e) => patch({ name: e.target.value })}
            />
          </label>
          {SATELLITE_PROFILES.map((profile) => (
            <button
              key={profile.id}
              type="button"
              className={`ops-btn ${draft.profile === profile.id ? 'active' : ''}`}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                marginBottom: 6,
              }}
              onClick={() =>
                setDraft(patchComponentsFromProfile(draft, profile.id))
              }
            >
              <strong>{profile.label}</strong>
              <div style={{ fontSize: 10, color: 'var(--ops-muted)', marginTop: 2 }}>
                {profile.blurb}
              </div>
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
              defaults. Switch to Customize to change reaction wheels and other
              line items.
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
                        onChange={(e) =>
                          setComponentQty(part.id, Number(e.target.value))
                        }
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
          <label style={designerRow}>
            <span className="ops-label">Integration margin (%)</span>
            <input
              style={designerField}
              type="number"
              min={0}
              max={40}
              value={draft.integrationMarginPct}
              onChange={(e) =>
                patch({ integrationMarginPct: Number(e.target.value) })
              }
            />
          </label>
          {LAUNCH_VEHICLES.map((lv) => (
            <button
              key={lv.id}
              type="button"
              className={`ops-btn ${draft.launchVehicle === lv.id ? 'active' : ''}`}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                marginBottom: 6,
              }}
              onClick={() => patch({ launchVehicle: lv.id })}
            >
              <strong>{lv.label}</strong>
              <div style={{ fontSize: 10, color: 'var(--ops-muted)', marginTop: 2 }}>
                ${(lv.costPerKgUsd / 1000).toFixed(1)}k/kg · min $
                {(lv.minCostUsd / 1_000_000).toFixed(2)}M
              </div>
            </button>
          ))}
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="ops-stat-row">
            <span className="k">Configuration</span>
            <span className="v">{bom.summary}</span>
          </div>
          <QuoteSummary quote={unitQuote} title="Single-satellite quote" />
          <p style={{ ...designerHint, marginTop: 8 }}>
            Constellation and scenario designers multiply this bus by fleet size
            and include launch in the program total.
          </p>
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
