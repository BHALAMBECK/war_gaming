/**
 * Build and download research run export bundles.
 */

import type { TrajectorySample } from '@/ui/stores/runRecorderStore';
import type { FidelityLevel } from '@/sim/orbit/fidelity';
import type { EngagementEvent, SensorSnapshot } from '@/ui/stores/systemsStore';

export interface RunExportMeta {
  scenarioName: string;
  seed: string;
  fidelity: FidelityLevel;
  timeStep: number;
  exportedAt: string;
  agentCount: number;
  simTimeStart: number;
  simTimeEnd: number;
}

export interface RunExportEvent {
  t: number;
  type: 'engagement' | 'snapshot';
  payload: EngagementEvent | SensorSnapshot;
}

export interface RunExportBundle {
  meta: RunExportMeta;
  trajectory: TrajectorySample[];
  events: RunExportEvent[];
}

export interface BuildRunExportInput {
  scenarioName: string;
  seed: string;
  fidelity: FidelityLevel;
  timeStep: number;
  agentCount: number;
  trajectory: TrajectorySample[];
  engagements: EngagementEvent[];
  snapshots: SensorSnapshot[];
  /** Wall-clock export timestamp; injectable for tests */
  exportedAt?: string;
}

export function buildRunExport(input: BuildRunExportInput): RunExportBundle {
  const trajectory = input.trajectory;
  const simTimeStart =
    trajectory.length > 0 ? trajectory[0]!.t : 0;
  const simTimeEnd =
    trajectory.length > 0
      ? trajectory[trajectory.length - 1]!.t
      : 0;

  const events: RunExportEvent[] = [
    ...input.engagements.map((e) => ({
      t: e.simTime,
      type: 'engagement' as const,
      payload: e,
    })),
    ...input.snapshots.map((s) => ({
      t: s.simTime,
      type: 'snapshot' as const,
      payload: s,
    })),
  ].sort((a, b) => a.t - b.t);

  return {
    meta: {
      scenarioName: input.scenarioName,
      seed: input.seed,
      fidelity: input.fidelity,
      timeStep: input.timeStep,
      exportedAt: input.exportedAt ?? new Date().toISOString(),
      agentCount: input.agentCount,
      simTimeStart,
      simTimeEnd,
    },
    trajectory,
    events,
  };
}

export function downloadRunExport(
  bundle: RunExportBundle,
  filename?: string
): void {
  const json = JSON.stringify(bundle, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safe =
    filename ||
    `${bundle.meta.scenarioName.replace(/[^a-z0-9]/gi, '_') || 'run'}_export.json`;
  link.download = safe;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
