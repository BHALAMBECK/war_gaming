import { useMemo, useState } from 'react';
import { useScenarioStore } from '@/ui/stores/scenarioStore';
import { useDesignStore } from '@/ui/stores/designStore';
import { downloadScenario } from '@/scenario/saver';
import { saveToLocalStorage } from '@/scenario/storage';
import { EARTH_MU, EARTH_RADIUS } from '@/sim/orbit/constants';
import { validateScenario } from '@/scenario/schema';
import {
  DEFAULT_CONSTELLATION_DRAFT,
  generateConstellationAgents,
  constellationAgentCount,
  type ConstellationDraft,
} from '@/scenario/design/constellationGenerator';
import { attachBusToAgents } from '@/scenario/design/agentBus';
import { quoteProgram } from '@/scenario/design/pricing';
import { ConstellationFormFields } from './ConstellationFormFields';
import { QuoteSummary } from './QuoteSummary';
import { designerField, designerHint, designerRow } from './designerStyles';

export function ConstellationDesigner() {
  const loadScenario = useScenarioStore((s) => s.loadScenario);
  const currentScenario = useScenarioStore((s) => s.currentScenario);
  const satelliteDraft = useDesignStore((s) => s.satelliteDraft);
  const [draft, setDraft] = useState<ConstellationDraft>(DEFAULT_CONSTELLATION_DRAFT);
  const [scenarioName, setScenarioName] = useState('Custom Constellation');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const count = useMemo(() => constellationAgentCount(draft), [draft]);
  const programQuote = useMemo(
    () => quoteProgram(satelliteDraft, count),
    [satelliteDraft, count]
  );

  const buildScenario = () => {
    const agents = attachBusToAgents(
      generateConstellationAgents(draft),
      satelliteDraft
    );
    return validateScenario({
      name: scenarioName.trim() || 'Custom Constellation',
      description: `${draft.pattern} constellation · ${agents.length} sats · designer`,
      version: '1.0.0',
      earth: { radius: EARTH_RADIUS, mu: EARTH_MU },
      agents,
      sim: {
        timeStep: currentScenario?.sim.timeStep ?? 1,
        fidelity: currentScenario?.sim.fidelity ?? 0,
        initialTime: 0,
      },
      seed: draft.seed.trim() || 'constellation-designer',
    });
  };

  const load = (alsoSave: boolean) => {
    setError('');
    try {
      const scenario = buildScenario();
      loadScenario(scenario);
      if (alsoSave) {
        saveToLocalStorage(scenario);
        downloadScenario(scenario);
      }
      setStatus(
        `Loaded ${scenario.name} · ${scenario.agents.length} sats (${draft.pattern})`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to build constellation');
    }
  };

  const mergeIntoCurrent = () => {
    setError('');
    try {
      if (!currentScenario) {
        setError('Load a scenario first, or use Load as new scenario.');
        return;
      }
      const extra = attachBusToAgents(
        generateConstellationAgents({
          ...draft,
          idPrefix: draft.idPrefix || 'sat',
        }),
        satelliteDraft
      );
      // Avoid id collisions
      const existing = new Set(currentScenario.agents.map((a) => a.id));
      const renamed = extra.map((a) => {
        let id = a.id;
        let n = 0;
        while (existing.has(id)) {
          id = `${a.id}-m${n}`;
          n += 1;
        }
        existing.add(id);
        return { ...a, id };
      });
      const scenario = validateScenario({
        ...currentScenario,
        agents: [...currentScenario.agents, ...renamed],
        description: `${currentScenario.description} + merged ${renamed.length} sats`,
      });
      loadScenario(scenario);
      setStatus(
        `Merged ${renamed.length} sats → ${scenario.agents.length} total`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Merge failed');
    }
  };

  return (
    <div>
      <div className="ops-section-title" style={{ marginTop: 0 }}>
        Constellation Designer
      </div>
      <p style={designerHint}>
        Design a ring, Walker-delta, or random shell, then load it as a scenario
        or merge into the current one.
      </p>

      <label style={designerRow}>
        <span className="ops-label">Scenario name</span>
        <input
          style={designerField}
          value={scenarioName}
          onChange={(e) => setScenarioName(e.target.value)}
        />
      </label>
      <label style={designerRow}>
        <span className="ops-label">Seed (shell RNG)</span>
        <input
          style={designerField}
          value={draft.seed}
          onChange={(e) => setDraft({ ...draft, seed: e.target.value })}
        />
      </label>

      <ConstellationFormFields value={draft} onChange={setDraft} />

      <div className="ops-stat-row">
        <span className="k">Total sats</span>
        <span className="v">{count}</span>
      </div>

      <QuoteSummary
        quote={programQuote}
        title={`Program quote · ${satelliteDraft.name}`}
        compact
      />
      <p style={{ ...designerHint, marginTop: 4 }}>
        Bus config from Satellite designer · launch included
      </p>

      <div className="ops-btn-group" style={{ marginTop: 10, flexWrap: 'wrap' }}>
        <button type="button" className="ops-btn active" onClick={() => load(false)}>
          Load as new scenario
        </button>
        <button type="button" className="ops-btn" onClick={() => load(true)}>
          Load + save/download
        </button>
        <button type="button" className="ops-btn" onClick={mergeIntoCurrent}>
          Merge into current
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
