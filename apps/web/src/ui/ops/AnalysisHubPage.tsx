import { useMemo } from 'react';
import { useAgentStore } from '@/ui/stores/agentStore';
import { useSimClockStore } from '@/ui/stores/simClockStore';
import { useOpsStore, FIDELITY_LABELS } from '@/ui/stores/opsStore';
import { useSystemsStore } from '@/ui/stores/systemsStore';
import { useTaskStore } from '@/ui/stores/taskStore';
import { useScenarioStore } from '@/ui/stores/scenarioStore';
import { useRunRecorderStore } from '@/ui/stores/runRecorderStore';
import { useDesignStore } from '@/ui/stores/designStore';
import { fleetSummary } from '@/sim/systems/analysis';
import { buildRunExport, downloadRunExport } from '@/util/runExport';
import { quoteProgram } from '@/scenario/design/pricing';
import { QuoteSummary } from './QuoteSummary';
import { designerHint } from './designerStyles';

/**
 * Full-page analysis: scoring, fleet health, logs, exports, program quote.
 */
export function AnalysisHubPage() {
  const agents = useAgentStore((s) => s.agents);
  const simTime = useSimClockStore((s) => s.simTime);
  const formatTime = useSimClockStore((s) => s.formatTime);
  const seed = useSimClockStore((s) => s.seed);
  const timeStep = useSimClockStore((s) => s.timeStep);
  const fidelity = useOpsStore((s) => s.fidelity);
  const setAppPhase = useOpsStore((s) => s.setAppPhase);
  const engagements = useSystemsStore((s) => s.engagements);
  const snapshots = useSystemsStore((s) => s.snapshots);
  const score = useTaskStore((s) => s.score);
  const objectives = useTaskStore((s) => s.objectives);
  const scenarioName = useScenarioStore((s) => s.scenarioName);
  const recording = useRunRecorderStore((s) => s.recording);
  const samples = useRunRecorderStore((s) => s.samples);
  const setRecording = useRunRecorderStore((s) => s.setRecording);
  const satelliteDraft = useDesignStore((s) => s.satelliteDraft);

  const fleet = useMemo(() => fleetSummary(agents), [agents]);
  const completedObjs = objectives.filter((o) => o.completed).length;

  const programQuote = useMemo(
    () => quoteProgram(satelliteDraft, Math.max(1, agents.length)),
    [satelliteDraft, agents.length]
  );

  const exportRun = () => {
    const bundle = buildRunExport({
      scenarioName: scenarioName || 'untitled',
      seed,
      fidelity,
      timeStep,
      agentCount: agents.length,
      trajectory: samples,
      engagements,
      snapshots,
    });
    downloadRunExport(bundle);
  };

  return (
    <div className="ops-analysis-page">
      <div className="ops-section-title" style={{ marginTop: 0 }}>
        Analysis hub
      </div>
      <p style={designerHint}>
        Mission scoring, fleet metrics, event logs, and program cost for the
        loaded scenario. Use Mission Ops during live runs for engagement controls.
      </p>

      <div className="ops-analysis-grid">
        <section className="ops-analysis-card">
          <div className="ops-section-title">Scenario</div>
          <div className="ops-stat-row">
            <span className="k">Name</span>
            <span className="v">{scenarioName || '—'}</span>
          </div>
          <div className="ops-stat-row">
            <span className="k">Sim time</span>
            <span className="v">{formatTime()}</span>
          </div>
          <div className="ops-stat-row">
            <span className="k">Seed</span>
            <span className="v">{seed}</span>
          </div>
          <div className="ops-stat-row">
            <span className="k">Propagator</span>
            <span className="v">{FIDELITY_LABELS[fidelity]}</span>
          </div>
          <div className="ops-stat-row">
            <span className="k">dt</span>
            <span className="v">{timeStep}s</span>
          </div>
        </section>

        <section className="ops-analysis-card">
          <div className="ops-section-title">Task scoring</div>
          <div className="ops-stat-row">
            <span className="k">Score</span>
            <span className="v">{score}</span>
          </div>
          <div className="ops-stat-row">
            <span className="k">Objectives</span>
            <span className="v">
              {completedObjs}/{objectives.length} complete
            </span>
          </div>
          {objectives.map((o) => (
            <div className="ops-stat-row" key={o.id}>
              <span className="k">{o.type}</span>
              <span className="v">{o.completed ? 'done' : 'open'}</span>
            </div>
          ))}
        </section>

        <section className="ops-analysis-card">
          <div className="ops-section-title">Fleet health</div>
          <div className="ops-stat-row">
            <span className="k">Tracks</span>
            <span className="v">{fleet.total}</span>
          </div>
          <div className="ops-stat-row">
            <span className="k">Friendly / Enemy</span>
            <span className="v">
              {fleet.friendly} / {fleet.enemy}
            </span>
          </div>
          <div className="ops-stat-row">
            <span className="k">Avg HP (F/E)</span>
            <span className="v">
              {fleet.avgHpFriendly.toFixed(0)} / {fleet.avgHpEnemy.toFixed(0)}
            </span>
          </div>
          <div className="ops-stat-row">
            <span className="k">Engagements</span>
            <span className="v">{engagements.length}</span>
          </div>
          <div className="ops-stat-row">
            <span className="k">Snapshots</span>
            <span className="v">{snapshots.length}</span>
          </div>
        </section>

        <section className="ops-analysis-card">
          <div className="ops-section-title">Research run</div>
          <div className="ops-stat-row">
            <span className="k">Record</span>
            <span className="v">
              {recording ? `ON · ${samples.length} samples` : 'OFF'}
            </span>
          </div>
          <div className="ops-btn-group" style={{ marginTop: 6 }}>
            <button
              type="button"
              className={`ops-btn ${recording ? 'active' : ''}`}
              onClick={() => setRecording(!recording)}
            >
              {recording ? 'Stop record' : 'Record'}
            </button>
            <button type="button" className="ops-btn" onClick={exportRun}>
              Export run
            </button>
          </div>
          <p style={{ ...designerHint, marginTop: 8 }}>
            t={simTime.toFixed(0)}s · Export bundles trajectory when recording
            is enabled.
          </p>
        </section>
      </div>

      <QuoteSummary
        quote={programQuote}
        title={`Program quote · ${satelliteDraft.name}`}
      />

      <div className="ops-section-title">Engagement log</div>
      <div className="ops-feed ops-analysis-feed">
        {engagements.length === 0 && <div>No engagements yet.</div>}
        {engagements.slice(0, 24).map((e) => (
          <div key={e.id} className={e.hit ? 'hit' : 'miss'}>
            t={e.simTime.toFixed(0)}s {e.shooterId}→{e.targetId}: {e.reason}
            {e.rangeM > 0 ? ` @ ${(e.rangeM / 1000).toFixed(0)}km` : ''}
          </div>
        ))}
      </div>

      <div className="ops-section-title">Sensor archive</div>
      <div className="ops-feed ops-analysis-feed">
        {snapshots.length === 0 && <div>No snapshots.</div>}
        {snapshots.slice(0, 16).map((s) => (
          <div key={s.id}>
            t={s.simTime.toFixed(0)}s {s.agentId}: {s.label}
          </div>
        ))}
      </div>

      <div className="ops-btn-group" style={{ marginTop: 14 }}>
        <button
          type="button"
          className="ops-btn active"
          onClick={() => setAppPhase('ops')}
        >
          Run ops
        </button>
        <button
          type="button"
          className="ops-btn"
          onClick={() => setAppPhase('studio')}
        >
          Studio
        </button>
      </div>
    </div>
  );
}
