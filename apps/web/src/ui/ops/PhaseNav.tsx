import { useOpsStore, type AppPhase } from '@/ui/stores/opsStore';
import { SegmentedControl } from './SegmentedControl';

const PHASES: { id: AppPhase; label: string; short: string }[] = [
  { id: 'library', label: 'Project library', short: 'Library' },
  { id: 'studio', label: 'Design studio', short: 'Studio' },
  { id: 'analysis', label: 'Analysis hub', short: 'Analysis' },
  { id: 'ops', label: 'Live operations', short: 'Live ops' },
];

interface PhaseNavProps {
  current: AppPhase;
  /** Tighter labels for the ops bottom bar */
  compact?: boolean;
}

/** Shared wayfinding across library, studio, analysis, and the live globe. */
export function PhaseNav({ current, compact }: PhaseNavProps) {
  const setAppPhase = useOpsStore((s) => s.setAppPhase);

  return (
    <SegmentedControl
      className="ops-phase-segmented"
      aria-label="Application sections"
      size={compact ? 'sm' : 'md'}
      value={current}
      onChange={(v) => setAppPhase(v as AppPhase)}
      options={PHASES.map((phase) => ({
        value: phase.id,
        label: compact ? phase.short : phase.label,
        title: phase.label,
      }))}
    />
  );
}
