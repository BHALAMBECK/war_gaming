import { useMemo, useState } from 'react';
import { useScenarioStore } from '@/ui/stores/scenarioStore';
import { useDesignStore } from '@/ui/stores/designStore';
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
import { BuilderFooter } from './BuilderFooter';
import { runLoadedScenario, showProject } from './studioNavigation';

export function ConstellationDesigner() {
  const loadScenario = useScenarioStore((s) => s.loadScenario);
  const currentScenario = useScenarioStore((s) => s.currentScenario);
  const satelliteDraft = useDesignStore((s) => s.satelliteDraft);
  const adding = (currentScenario?.agents.length ?? 0) > 0;
  const [draft, setDraft] = useState<ConstellationDraft>(DEFAULT_CONSTELLATION_DRAFT);
  const [scenarioName, setScenarioName] = useState('Custom Constellation');
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

  const mergeIntoCurrent = () => {
    if (!currentScenario) {
      throw new Error('Load a scenario first');
    }
    const extra = attachBusToAgents(
      generateConstellationAgents({
        ...draft,
        idPrefix: draft.idPrefix || 'sat',
      }),
      satelliteDraft
    );
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
    return validateScenario({
      ...currentScenario,
      agents: [...currentScenario.agents, ...renamed],
      description: `${currentScenario.description} + merged ${renamed.length} sats`,
    });
  };

  const commit = () => {
    setError('');
    try {
      const scenario =
        adding && currentScenario ? mergeIntoCurrent() : buildScenario();
      loadScenario(scenario);
      try {
        saveToLocalStorage(scenario);
      } catch {
        /* the sim can still start if local save fails */
      }
      useDesignStore.getState().resetScenarioWizard(false);
      runLoadedScenario();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to build constellation');
    }
  };

  return (
    <div className="ops-builder">
      <div className="ops-builder-body">
      <p style={designerHint}>
        {adding
          ? 'Shape the shell. The next step adds it to this project and runs.'
          : 'Shape the shell. The next step runs it.'}
      </p>

      {!adding && (
        <label style={designerRow}>
          <span className="ops-label">Scenario name</span>
          <input
            style={designerField}
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
          />
        </label>
      )}
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
      {error && (
        <p style={{ ...designerHint, color: 'var(--ops-danger)', marginTop: 8 }}>
          {error}
        </p>
      )}
      </div>
      <BuilderFooter
        backLabel="Project"
        onBack={showProject}
        primaryLabel={adding ? 'Add these satellites and run' : 'Run this constellation'}
        onPrimary={commit}
      />
    </div>
  );
}
