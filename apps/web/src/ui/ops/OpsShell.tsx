import './opsTheme.css';
import { EntityPanel } from './EntityPanel';
import { AnalysisHub } from './AnalysisHub';
import { useOpsStore, FIDELITY_LABELS, FidelityLevel } from '@/ui/stores/opsStore';
import { useSimClockStore } from '@/ui/stores/simClockStore';
import { TimeControlPanel } from '@/ui/TimeControlPanel';
import { ManeuverPanel } from '@/ui/ManeuverPanel';
import { TaskPanel } from '@/ui/TaskPanel';
import { CameraPanel } from '@/ui/CameraPanel';
import { ScenarioSection } from '@/ui/ScenarioSection';
import { startDemo } from '@/ui/demo/demoMode';
import { useRef, useState } from 'react';

interface OpsShellProps {
  hidden: boolean;
  onToggleHide: (hidden: boolean) => void;
  performanceOverlayVisible: boolean;
  onPerformanceOverlayToggle: (visible: boolean) => void;
}

const FIDELITY_NOTES: Record<FidelityLevel, string> = {
  0: 'Two-body Kepler — fast, research baseline',
  1: 'Kepler + J2 kick — mild Earth oblateness',
  2: 'RK4 + J2 — higher cost numerical step',
};

export function OpsShell({
  hidden,
  onToggleHide,
  performanceOverlayVisible,
  onPerformanceOverlayToggle,
}: OpsShellProps) {
  const viewMode = useOpsStore((s) => s.viewMode);
  const setViewMode = useOpsStore((s) => s.setViewMode);
  const fidelity = useOpsStore((s) => s.fidelity);
  const setFidelity = useOpsStore((s) => s.setFidelity);
  const leftPanelOpen = useOpsStore((s) => s.leftPanelOpen);
  const rightPanelOpen = useOpsStore((s) => s.rightPanelOpen);
  const setLeftPanelOpen = useOpsStore((s) => s.setLeftPanelOpen);
  const setRightPanelOpen = useOpsStore((s) => s.setRightPanelOpen);
  const formatTime = useSimClockStore((s) => s.formatTime);
  const paused = useSimClockStore((s) => s.paused);
  const toggle = useSimClockStore((s) => s.toggle);
  const [toolsOpen, setToolsOpen] = useState(false);
  const demoCleanupRef = useRef<(() => void) | null>(null);

  const handleDemo = () => {
    demoCleanupRef.current?.();
    demoCleanupRef.current = startDemo('demo', {
      autoHideUIDelay: 2000,
      onUIHide: () => onToggleHide(true),
    });
  };

  if (hidden) {
    return (
      <div className="ops-shell" style={{ gridTemplateRows: 'auto' }}>
        <div className="ops-topbar" style={{ justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="ops-btn"
            onClick={() => onToggleHide(false)}
          >
            Show UI
          </button>
        </div>
      </div>
    );
  }

  const bodyClass =
    !leftPanelOpen && !rightPanelOpen
      ? 'ops-body both-collapsed'
      : !leftPanelOpen
        ? 'ops-body left-collapsed'
        : !rightPanelOpen
          ? 'ops-body right-collapsed'
          : 'ops-body';

  return (
    <div className="ops-shell">
      <header className="ops-topbar">
        <div className="ops-brand">
          OSWV <span>Lattice Ops</span>
        </div>

        <div className="ops-btn-group">
          <button
            type="button"
            className={`ops-btn ${viewMode === 'earth' ? 'active' : ''}`}
            onClick={() => setViewMode('earth')}
          >
            Earth
          </button>
          <button
            type="button"
            className={`ops-btn ${viewMode === 'solar' ? 'active' : ''}`}
            onClick={() => setViewMode('solar')}
          >
            Solar map
          </button>
        </div>

        <button type="button" className="ops-btn" onClick={toggle}>
          {paused ? 'Play' : 'Pause'}
        </button>

        <div style={{ minWidth: 200, maxWidth: 280 }}>
          <label className="ops-label" htmlFor="fidelity-slider">
            Fidelity: {FIDELITY_LABELS[fidelity]}
          </label>
          <input
            id="fidelity-slider"
            className="ops-slider"
            type="range"
            min={0}
            max={2}
            step={1}
            value={fidelity}
            onChange={(e) =>
              setFidelity(Number(e.target.value) as FidelityLevel)
            }
          />
          <div
            style={{
              fontSize: 10,
              color: 'var(--ops-muted)',
              marginTop: 2,
              lineHeight: 1.3,
            }}
          >
            {FIDELITY_NOTES[fidelity]} · sandbox, not ops-grade ephemeris
          </div>
        </div>

        <div className="ops-btn-group">
          <button type="button" className="ops-btn" onClick={handleDemo}>
            Demo
          </button>
          <button
            type="button"
            className={`ops-btn ${leftPanelOpen ? 'active' : ''}`}
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          >
            Tracks
          </button>
          <button
            type="button"
            className={`ops-btn ${rightPanelOpen ? 'active' : ''}`}
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
          >
            Ops
          </button>
          <button
            type="button"
            className={`ops-btn ${toolsOpen ? 'active' : ''}`}
            onClick={() => setToolsOpen(!toolsOpen)}
          >
            Tools
          </button>
          <button
            type="button"
            className={`ops-btn ${performanceOverlayVisible ? 'active' : ''}`}
            onClick={() =>
              onPerformanceOverlayToggle(!performanceOverlayVisible)
            }
          >
            FPS
          </button>
          <button
            type="button"
            className="ops-btn"
            onClick={() => onToggleHide(true)}
          >
            Hide
          </button>
        </div>

        <div className="ops-time-chip">{formatTime()}</div>
      </header>

      <div className={bodyClass}>
        <aside
          className="ops-panel"
          style={{ visibility: leftPanelOpen ? 'visible' : 'hidden' }}
        >
          <EntityPanel />
        </aside>

        <div className="ops-center">
          {toolsOpen && (
            <div
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 280,
                maxHeight: 'calc(100% - 24px)',
                overflow: 'auto',
                zIndex: 6,
                pointerEvents: 'auto',
                background: 'var(--ops-panel)',
                border: '1px solid var(--ops-border)',
                padding: 8,
              }}
            >
              <div className="ops-section-title" style={{ marginTop: 0 }}>
                Legacy tools
              </div>
              <div style={{ position: 'relative' }}>
                {/* Reuse existing panels without absolute offsets */}
                <LegacyPanelHost />
              </div>
            </div>
          )}
        </div>

        <aside
          className="ops-panel right"
          style={{ visibility: rightPanelOpen ? 'visible' : 'hidden' }}
        >
          <AnalysisHub />
        </aside>
      </div>
    </div>
  );
}

/**
 * Hosts existing control panels inside the tools drawer.
 * Overrides their absolute positioning via a scoped wrapper class.
 */
function LegacyPanelHost() {
  return (
    <div className="ops-legacy-host">
      <style>{`
        .ops-legacy-host > * {
          position: relative !important;
          top: auto !important;
          right: auto !important;
          left: auto !important;
          bottom: auto !important;
          margin-bottom: 10px !important;
          max-width: 100% !important;
          width: 100% !important;
        }
      `}</style>
      <CameraPanel />
      <TimeControlPanel />
      <ManeuverPanel />
      <TaskPanel />
      <div style={{ padding: 8 }}>
        <ScenarioSection isExpanded />
      </div>
    </div>
  );
}
