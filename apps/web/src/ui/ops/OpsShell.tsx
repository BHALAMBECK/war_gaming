import './opsTheme.css';
import { EntityPanel } from './EntityPanel';
import { MissionOpsPanel } from './MissionOpsPanel';
import {
  useOpsStore,
  FIDELITY_LABELS,
  FidelityLevel,
  PANEL_LIMITS,
  isOverviewMode,
  type ViewMode,
} from '@/ui/stores/opsStore';
import { useSimClockStore } from '@/ui/stores/simClockStore';
import { useAgentStore } from '@/ui/stores/agentStore';
import { useCameraStore } from '@/ui/stores/cameraStore';
import { TimeControlPanel } from '@/ui/TimeControlPanel';
import { ManeuverPanel } from '@/ui/ManeuverPanel';
import { TaskPanel } from '@/ui/TaskPanel';
import { CameraPanel } from '@/ui/CameraPanel';
import { startDemo } from '@/ui/demo/demoMode';
import { showProject } from './studioNavigation';
import { useCallback, useMemo, useRef, useState } from 'react';
import { usePanelResize } from './usePanelResize';
import { PhaseNav } from './PhaseNav';

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
  const agents = useAgentStore((s) => s.agents);
  const cameraPreset = useCameraStore((s) => s.preset);
  const setCameraPreset = useCameraStore((s) => s.setPreset);
  const hasMultiBody = useMemo(
    () => agents.some((a) => (a.centralBody ?? 'earth') !== 'earth'),
    [agents]
  );
  const activeModeLabel = useMemo(() => {
    if (cameraPreset === 'zoomIn') return 'Zoom in';
    if (isOverviewMode(viewMode)) return 'Overview';
    if (viewMode === 'moon') return 'Moon';
    if (viewMode === 'mars') return 'Mars';
    return 'Earth';
  }, [viewMode, cameraPreset]);

  const goBody = (mode: ViewMode) => {
    setCameraPreset('freecam');
    setViewMode(mode);
  };

  const goZoomIn = () => {
    const selected = useAgentStore.getState().getSelectedAgent();
    const hero = agents.find(
      (a) => a.visualRole === 'hero' || a.id.startsWith('HERO-')
    );
    const target = selected ?? hero;
    if (target) {
      const body = target.centralBody ?? 'earth';
      if (body === 'moon' || body === 'mars' || body === 'earth') {
        setViewMode(body);
      }
    } else if (isOverviewMode(viewMode)) {
      setViewMode('earth');
    }
    setCameraPreset('zoomIn');
  };
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
  const [controlsOpen, setControlsOpen] = useState(false);
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
          {controlsOpen && (
            <div className="ops-controls-drawer">
              <div className="ops-section-title" style={{ marginTop: 0 }}>
                Run controls
              </div>
              <LegacyPanelHost />
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
          <MissionOpsPanel />
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

        <PhaseNav current="ops" compact />

        <div className="ops-btn-group">
          {hasMultiBody ? (
            <>
              <button
                type="button"
                className={`ops-btn ${isOverviewMode(viewMode) && cameraPreset !== 'zoomIn' ? 'active' : ''}`}
                onClick={() => goBody('overview')}
              >
                Overview
              </button>
              <button
                type="button"
                className={`ops-btn ${viewMode === 'earth' && cameraPreset !== 'zoomIn' ? 'active' : ''}`}
                onClick={() => goBody('earth')}
              >
                Earth
              </button>
              <button
                type="button"
                className={`ops-btn ${viewMode === 'moon' && cameraPreset !== 'zoomIn' ? 'active' : ''}`}
                onClick={() => goBody('moon')}
              >
                Moon
              </button>
              <button
                type="button"
                className={`ops-btn ${viewMode === 'mars' && cameraPreset !== 'zoomIn' ? 'active' : ''}`}
                onClick={() => goBody('mars')}
              >
                Mars
              </button>
              <button
                type="button"
                className={`ops-btn ${cameraPreset === 'zoomIn' ? 'active' : ''}`}
                onClick={goZoomIn}
              >
                Zoom in
              </button>
              <span className="ops-label" style={{ marginLeft: 8 }}>
                Mode: {activeModeLabel}
              </span>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`ops-btn ${viewMode === 'earth' ? 'active' : ''}`}
                onClick={() => goBody('earth')}
              >
                Earth
              </button>
              <button
                type="button"
                className={`ops-btn ${isOverviewMode(viewMode) ? 'active' : ''}`}
                onClick={() => goBody('overview')}
              >
                Solar map
              </button>
            </>
          )}
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
            className={`ops-btn ${controlsOpen ? 'active' : ''}`}
            onClick={() => setControlsOpen(!controlsOpen)}
          >
            Controls
          </button>
          <button type="button" className="ops-btn" onClick={showProject}>
            Design
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
    </div>
  );
}
