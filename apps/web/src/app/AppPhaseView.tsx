import { useEffect, useState, type ReactNode } from 'react';
import { useOpsStore, type AppPhase } from '@/ui/stores/opsStore';
import { ProjectLibrary } from '@/ui/ops/ProjectLibrary';
import { StudioShell } from '@/ui/ops/StudioShell';
import { AnalysisShell } from '@/ui/ops/AnalysisShell';
import { OpsRuntime } from './OpsRuntime';

const EXIT_MS = 200;
const ENTER_MS = 480;

function phaseContent(phase: AppPhase): ReactNode {
  switch (phase) {
    case 'library':
      return <ProjectLibrary />;
    case 'studio':
      return <StudioShell />;
    case 'analysis':
      return <AnalysisShell />;
    case 'ops':
    default:
      return <OpsRuntime />;
  }
}

/**
 * Cross-fades between app phases instead of hard-swapping the tree.
 */
export function AppPhaseView() {
  const appPhase = useOpsStore((s) => s.appPhase);
  const [renderPhase, setRenderPhase] = useState(appPhase);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (appPhase === renderPhase) return;

    setVisible(false);
    const swapTimer = window.setTimeout(() => {
      setRenderPhase(appPhase);
      requestAnimationFrame(() => setVisible(true));
    }, EXIT_MS);

    return () => window.clearTimeout(swapTimer);
  }, [appPhase, renderPhase]);

  const entering = visible;
  const isOps = renderPhase === 'ops';

  return (
    <div
      className={[
        'ops-app-root',
        entering ? 'ops-phase-enter' : 'ops-phase-exit',
        isOps ? 'ops-app-root-ops' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ['--ops-phase-enter-ms' as string]: `${ENTER_MS}ms`,
        ['--ops-phase-exit-ms' as string]: `${EXIT_MS}ms`,
      }}
    >
      {phaseContent(renderPhase)}
    </div>
  );
}
