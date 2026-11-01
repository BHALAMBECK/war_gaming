import { useOpsStore, type AppPhase } from '@/ui/stores/opsStore';

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
    <nav className="ops-phase-nav" aria-label="Application sections">
      {PHASES.map((phase, index) => {
        const active = current === phase.id;
        const label = compact ? phase.short : phase.label;
        return (
          <span key={phase.id} className="ops-phase-nav-item">
            {index > 0 ? <span className="ops-phase-sep" aria-hidden /> : null}
            <button
              type="button"
              className={`ops-phase-link${active ? ' active' : ''}`}
              aria-current={active ? 'page' : undefined}
              title={phase.label}
              disabled={active}
              onClick={() => setAppPhase(phase.id)}
            >
              {label}
            </button>
          </span>
        );
      })}
    </nav>
  );
}
