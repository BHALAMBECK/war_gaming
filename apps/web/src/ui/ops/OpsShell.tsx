import './opsTheme.css';
import { EntityPanel } from './EntityPanel';
import { AnalysisHub } from './AnalysisHub';
import {
  useOpsStore,
  FIDELITY_LABELS,
  FidelityLevel,
  PANEL_LIMITS,
} from '@/ui/stores/opsStore';
import { useSimClockStore } from '@/ui/stores/simClockStore';
import { TimeControlPanel } from '@/ui/TimeControlPanel';
import { ManeuverPanel } from '@/ui/ManeuverPanel';
import { TaskPanel } from '@/ui/TaskPanel';
import { CameraPanel } from '@/ui/CameraPanel';
import { ScenarioSection } from '@/ui/ScenarioSection';
import { ScenarioDesigner } from './ScenarioDesigner';
import { ConstellationDesigner } from './ConstellationDesigner';
import { startDemo } from '@/ui/demo/demoMode';
import { useCallback, useRef, useState } from 'react';
import { usePanelResize } from './usePanelResize';

type ToolsTab = 'load' | 'scenario' | 'constellation' | 'legacy';

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
  const leftPanelWidth = useOpsStore((s) => s.leftPanelWidth);
  const rightPanelWidth = useOpsStore((s) => s.rightPanelWidth);
  const bottomBarHeight = useOpsStore((s) => s.bottomBarHeight);
  const setLeftPanelWidth = useOpsStore((s) => s.setLeftPanelWidth);
  const setRightPanelWidth = useOpsStore((s) => s.setRightPanelWidth);
  const setBottomBarHeight = useOpsStore((s) => s.setBottomBarHeight);
  const formatTime = useSimClockStore((s) => s.formatTime);
  const paused = useSimClockStore((s) => s.paused);
  const toggle = useSimClockStore((s) => s.toggle);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [toolsTab, setToolsTab] = useState<ToolsTab>('scenario');
  const demoCleanupRef = useRef<(() => void) | null>(null);

  const getLeft = useCallback(
    () => useOpsStore.getState().leftPanelWidth,
    []
  );
  const getRight = useCallback(
    () => useOpsStore.getState().rightPanelWidth,
    []
  );
  const getBottom = useCallback(
    () => useOpsStore.getState().bottomBarHeight,
    []
  );

  const leftResize = usePanelResize('x', setLeftPanelWidth, getLeft, {
    min: PANEL_LIMITS.left.min,
    max: PANEL_LIMITS.left.max,
  });
  const rightResize = usePanelResize('x', setRightPanelWidth, getRight, {
    min: PANEL_LIMITS.right.min,
    max: PANEL_LIMITS.right.max,
    sign: -1,
  });
  const bottomResize = usePanelResize('y', setBottomBarHeight, getBottom, {
    min: PANEL_LIMITS.bottom.min,
    max: PANEL_LIMITS.bottom.max,
    sign: -1,
  });

  const handleDemo = () => {
    demoCleanupRef.current?.();
    demoCleanupRef.current = startDemo('demo', {
      autoHideUIDelay: 2000,
      onUIHide: () => onToggleHide(true),
    });
  };

  if (hidden) {
    return (
      <div
        className="ops-shell"
        style={{ gridTemplateRows: `1fr ${bottomBarHeight}px` }}
      >
        <div />
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

  const leftW = leftPanelOpen ? leftPanelWidth : 0;
  const rightW = rightPanelOpen ? rightPanelWidth : 0;
  const fidelityNote = `${FIDELITY_NOTES[fidelity]} · sandbox, not ops-grade ephemeris`;
  const compactBottom = bottomBarHeight < 58;

  return (
    <div
      className="ops-shell"
      style={{ gridTemplateRows: `1fr ${bottomBarHeight}px` }}
    >
      <div
        className="ops-body"
        style={{
          gridTemplateColumns: `${leftW}px 1fr ${rightW}px`,
        }}
      >
        <aside
          className="ops-panel"
          style={{ visibility: leftPanelOpen ? 'visible' : 'hidden' }}
        >
          <EntityPanel />
          {leftPanelOpen && (
            <div
              className="ops-resize-handle ops-resize-handle-x"
              onPointerDown={leftResize.onPointerDown}
              title="Drag to resize"
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize tracks panel"
            />
          )}
        </aside>

        <div className="ops-center">
          {toolsOpen && (
            <div
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 340,
                maxHeight: 'calc(100% - 16px)',
                overflow: 'auto',
                zIndex: 6,
                pointerEvents: 'auto',
                background: 'var(--ops-panel)',
                border: '1px solid var(--ops-border)',
                padding: 8,
              }}
            >
              <div className="ops-section-title" style={{ marginTop: 0 }}>
                Design tools
              </div>
              <div
                className="ops-btn-group"
                style={{ marginBottom: 10, flexWrap: 'wrap' }}
              >
                {(
                  [
                    ['scenario', 'Scenario'],
                    ['constellation', 'Constellation'],
                    ['load', 'Load/Save'],
                    ['legacy', 'Legacy'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={`ops-btn ${toolsTab === id ? 'active' : ''}`}
                    onClick={() => setToolsTab(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {toolsTab === 'scenario' && <ScenarioDesigner />}
              {toolsTab === 'constellation' && <ConstellationDesigner />}
              {toolsTab === 'load' && <ScenarioSection isExpanded />}
              {toolsTab === 'legacy' && (
                <div style={{ position: 'relative' }}>
                  <LegacyPanelHost />
                </div>
              )}
            </div>
          )}
        </div>

        <aside
          className="ops-panel right"
          style={{ visibility: rightPanelOpen ? 'visible' : 'hidden' }}
        >
          {rightPanelOpen && (
            <div
              className="ops-resize-handle ops-resize-handle-x left"
              onPointerDown={rightResize.onPointerDown}
              title="Drag to resize"
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize mission ops panel"
            />
          )}
          <AnalysisHub />
        </aside>
      </div>

      <header
        className={`ops-topbar${compactBottom ? ' compact' : ''}`}
        style={{ height: bottomBarHeight }}
      >
        <div
          className="ops-resize-handle ops-resize-handle-y"
          onPointerDown={bottomResize.onPointerDown}
          title="Drag to resize"
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize bottom bar"
        />
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

        <div className="ops-fidelity">
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
          {!compactBottom && (
            <div className="ops-fidelity-note" title={fidelityNote}>
              {FIDELITY_NOTES[fidelity]}
            </div>
          )}
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
          margin-bottom: 8px !important;
          max-width: 100% !important;
          width: 100% !important;
        }
      `}</style>
      <CameraPanel />
      <TimeControlPanel />
      <ManeuverPanel />
      <TaskPanel />
      <div style={{ padding: 6 }}>
        <ScenarioSection isExpanded />
      </div>
    </div>
  );
}
