import { useMemo } from 'react';
import { useAgentStore } from '@/ui/stores/agentStore';
import { useSimClockStore } from '@/ui/stores/simClockStore';
import { useOpsStore, FIDELITY_LABELS } from '@/ui/stores/opsStore';
import { useSystemsStore } from '@/ui/stores/systemsStore';
import { useTaskStore } from '@/ui/stores/taskStore';
import { useScenarioStore } from '@/ui/stores/scenarioStore';
import { useRunRecorderStore } from '@/ui/stores/runRecorderStore';
import {
  computeTelemetry,
  fleetSummary,
  nearestNeighbors,
} from '@/sim/systems/analysis';
import { findTargetsInFov } from '@/sim/systems/sensors';
import { attemptLaserFire } from '@/sim/systems/weapons';
import { buildRunExport, downloadRunExport } from '@/util/runExport';

export function AnalysisHub() {
  const agents = useAgentStore((s) => s.agents);
  const selected = useAgentStore((s) =>
    s.agents.find((a) => a.id === s.selectedAgentId)
  );
  const patchAgent = useAgentStore((s) => s.patchAgent);
  const simTime = useSimClockStore((s) => s.simTime);
  const formatTime = useSimClockStore((s) => s.formatTime);
  const seed = useSimClockStore((s) => s.seed);
  const timeStep = useSimClockStore((s) => s.timeStep);
  const fidelity = useOpsStore((s) => s.fidelity);
  const engagementArmed = useOpsStore((s) => s.engagementArmed);
  const setEngagementArmed = useOpsStore((s) => s.setEngagementArmed);
  const engagements = useSystemsStore((s) => s.engagements);
  const snapshots = useSystemsStore((s) => s.snapshots);
  const addEngagement = useSystemsStore((s) => s.addEngagement);
  const addSnapshot = useSystemsStore((s) => s.addSnapshot);
  const addBeam = useSystemsStore((s) => s.addBeam);
  const score = useTaskStore((s) => s.score);
  const objectives = useTaskStore((s) => s.objectives);
  const scenarioName = useScenarioStore((s) => s.scenarioName);
  const recording = useRunRecorderStore((s) => s.recording);
  const samples = useRunRecorderStore((s) => s.samples);
  const setRecording = useRunRecorderStore((s) => s.setRecording);

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

  const fleet = useMemo(() => fleetSummary(agents), [agents]);
  const telemetry = selected ? computeTelemetry(selected, simTime) : null;
  const neighbors = selected
    ? nearestNeighbors(selected, agents, 5)
    : [];
  const fovTargets = selected ? findTargetsInFov(selected, agents) : [];

  const fireAtNearestHostile = () => {
    if (!selected || !engagementArmed) return;
    const hostile = neighbors.find((n) => n.team !== selected.team);
    if (!hostile) return;
    const target = agents.find((a) => a.id === hostile.id);
    if (!target) return;

    const result = attemptLaserFire(selected, target, simTime);
    patchAgent(selected.id, result.updatedShooter);
    if (result.updatedTarget) {
      patchAgent(result.updatedTarget.id, result.updatedTarget);
    }
    addEngagement({
      simTime,
      shooterId: selected.id,
      targetId: target.id,
      hit: result.hit,
      reason: result.reason,
      rangeM: result.rangeM,
    });
    if (result.hit) {
      addBeam({
        fromId: selected.id,
        toId: target.id,
        expiresAt: simTime + 1.5,
      });
    }
  };

  const captureSnapshot = () => {
    if (!selected) return;
    const targets = findTargetsInFov(selected, agents);
    addSnapshot({
      simTime,
      agentId: selected.id,
      targetIds: targets.map((t) => t.id),
      label: `${targets.length} contacts in FOV`,
    });
  };

  return (
    <>
      <div className="ops-panel-header">
        <span>Mission Ops</span>
        <span className="ops-mono">{formatTime()}</span>
      </div>
      <div className="ops-panel-body">
        <div className="ops-section-title">Fleet</div>
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
          <span className="k">Propagator</span>
          <span className="v">{FIDELITY_LABELS[fidelity]}</span>
        </div>
        <div className="ops-stat-row">
          <span className="k">Task score</span>
          <span className="v">
            {score} · {objectives.filter((o) => o.completed).length}/
            {objectives.length} objs
          </span>
        </div>

        <div className="ops-section-title">Research run</div>
        <div className="ops-stat-row">
          <span className="k">Record</span>
          <span className="v">
            {recording ? `ON · ${samples.length} samples` : 'OFF'}
          </span>
        </div>
        <div className="ops-btn-group" style={{ marginTop: 6, marginBottom: 8 }}>
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
        <div style={{ fontSize: 11, color: 'var(--ops-muted)', marginBottom: 8 }}>
          Export JSON includes seed, fidelity, timeStep, trajectory (if
          recorded), and engagement/snapshot events.
        </div>

        <div className="ops-section-title">Selected asset</div>
        {!telemetry ? (
          <div style={{ fontSize: 12, color: 'var(--ops-muted)' }}>
            Select a track from the left panel or the globe.
          </div>
        ) : (
          <>
            <div className="ops-stat-row">
              <span className="k">ID</span>
              <span className="v">{telemetry.id}</span>
            </div>
            <div className="ops-stat-row">
              <span className="k">Team</span>
              <span className="v">{telemetry.team}</span>
            </div>
            <div className="ops-stat-row">
              <span className="k">Altitude</span>
              <span className="v">{telemetry.altitudeKm.toFixed(1)} km</span>
            </div>
            <div className="ops-stat-row">
              <span className="k">Speed</span>
              <span className="v">{telemetry.speedKms.toFixed(3)} km/s</span>
            </div>
            <div className="ops-stat-row">
              <span className="k">Inclination</span>
              <span className="v">{telemetry.inclinationDeg.toFixed(1)}°</span>
            </div>
            <div className="ops-stat-row">
              <span className="k">Δv remaining</span>
              <span className="v">{telemetry.dvRemaining.toFixed(0)} m/s</span>
            </div>
            <div className="ops-stat-row">
              <span className="k">Hull</span>
              <span className="v">
                {telemetry.hp}/{telemetry.maxHp}
              </span>
            </div>
            <div className={`ops-hp ${telemetry.hp < 35 ? 'low' : ''}`}>
              <i
                style={{
                  width: `${(telemetry.hp / telemetry.maxHp) * 100}%`,
                }}
              />
            </div>

            <div className="ops-section-title">Camera</div>
            <div className="ops-stat-row">
              <span className="k">Status</span>
              <span className="v">
                {telemetry.cameraActive ? 'ACTIVE' : 'OFF'} · FOV contacts{' '}
                {fovTargets.length}
              </span>
            </div>
            <button
              type="button"
              className="ops-btn"
              style={{ width: '100%', marginTop: 6 }}
              onClick={captureSnapshot}
            >
              Capture sensor snapshot
            </button>

            <div className="ops-section-title">LOS laser</div>
            <div className="ops-stat-row">
              <span className="k">Ready</span>
              <span className="v">
                {telemetry.laserReady ? 'YES' : 'COOLDOWN'}
              </span>
            </div>
            <div className="ops-btn-group" style={{ marginTop: 6 }}>
              <button
                type="button"
                className={`ops-btn danger ${engagementArmed ? 'active' : ''}`}
                onClick={() => setEngagementArmed(!engagementArmed)}
              >
                {engagementArmed ? 'Armed' : 'Safe'}
              </button>
              <button
                type="button"
                className="ops-btn"
                disabled={!engagementArmed || !telemetry.laserReady}
                onClick={fireAtNearestHostile}
              >
                Fire nearest hostile
              </button>
            </div>

            <div className="ops-section-title">Nearest contacts</div>
            {neighbors.map((n) => (
              <div className="ops-stat-row" key={n.id}>
                <span className="k">
                  {n.id} ({n.team})
                </span>
                <span className="v">{n.rangeKm.toFixed(1)} km</span>
              </div>
            ))}
          </>
        )}

        <div className="ops-section-title">Engagement log</div>
        <div className="ops-feed">
          {engagements.length === 0 && <div>No engagements yet.</div>}
          {engagements.slice(0, 12).map((e) => (
            <div key={e.id} className={e.hit ? 'hit' : 'miss'}>
              t={e.simTime.toFixed(0)}s {e.shooterId}→{e.targetId}: {e.reason}
              {e.rangeM > 0 ? ` @ ${(e.rangeM / 1000).toFixed(0)}km` : ''}
            </div>
          ))}
        </div>

        <div className="ops-section-title">Sensor archive</div>
        <div className="ops-feed">
          {snapshots.length === 0 && <div>No snapshots.</div>}
          {snapshots.slice(0, 8).map((s) => (
            <div key={s.id}>
              t={s.simTime.toFixed(0)}s {s.agentId}: {s.label}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
