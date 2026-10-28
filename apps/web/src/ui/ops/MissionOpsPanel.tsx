import { useMemo } from 'react';
import { useAgentStore } from '@/ui/stores/agentStore';
import { useSimClockStore } from '@/ui/stores/simClockStore';
import { useOpsStore } from '@/ui/stores/opsStore';
import { useSystemsStore } from '@/ui/stores/systemsStore';
import {
  computeTelemetry,
  fleetSummary,
  nearestNeighbors,
} from '@/sim/systems/analysis';
import { findTargetsInFov } from '@/sim/systems/sensors';
import { attemptLaserFire } from '@/sim/systems/weapons';

/** Live mission ops: selected asset, engagement, sensor capture (right panel). */
export function MissionOpsPanel() {
  const agents = useAgentStore((s) => s.agents);
  const selected = useAgentStore((s) =>
    s.agents.find((a) => a.id === s.selectedAgentId)
  );
  const patchAgent = useAgentStore((s) => s.patchAgent);
  const simTime = useSimClockStore((s) => s.simTime);
  const formatTime = useSimClockStore((s) => s.formatTime);
  const engagementArmed = useOpsStore((s) => s.engagementArmed);
  const setEngagementArmed = useOpsStore((s) => s.setEngagementArmed);
  const addEngagement = useSystemsStore((s) => s.addEngagement);
  const addSnapshot = useSystemsStore((s) => s.addSnapshot);
  const addBeam = useSystemsStore((s) => s.addBeam);

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

  const fleet = useMemo(() => fleetSummary(agents), [agents]);

  return (
    <>
      <div className="ops-panel-header">
        <span>Mission Ops</span>
        <span className="ops-mono">{formatTime()}</span>
      </div>
      <div className="ops-panel-body">
        <div className="ops-stat-row">
          <span className="k">Fleet</span>
          <span className="v">
            {fleet.total} tracks · {fleet.friendly}/{fleet.enemy} F/E
          </span>
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
              <span className="k">Altitude</span>
              <span className="v">{telemetry.altitudeKm.toFixed(1)} km</span>
            </div>
            <div className="ops-stat-row">
              <span className="k">Speed</span>
              <span className="v">{telemetry.speedKms.toFixed(3)} km/s</span>
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
              <span className="k">FOV contacts</span>
              <span className="v">{fovTargets.length}</span>
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
      </div>
    </>
  );
}
