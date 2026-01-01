import { CameraPanel } from './CameraPanel';
import { HideUIButton } from './HideUIButton';
import { TimeControlPanel } from './TimeControlPanel';
import { TaskPanel } from './TaskPanel';
import { MissionBriefingPanel } from './MissionBriefingPanel';
import { DemoButton } from './DemoButton';
import { PerformanceToggle } from './PerformanceToggle';
import { ManeuverPanel } from './ManeuverPanel';

interface UIContainerProps {
  hidden: boolean;
  onToggleHide: (hidden: boolean) => void;
  performanceOverlayVisible: boolean;
  onPerformanceOverlayToggle: (visible: boolean) => void;
}

export function UIContainer({ 
  hidden, 
  onToggleHide,
  performanceOverlayVisible,
  onPerformanceOverlayToggle,
}: UIContainerProps) {
  if (hidden) {
    return (
      <>
        <HideUIButton onToggle={onToggleHide} />
        <PerformanceToggle onToggle={onPerformanceOverlayToggle} />
      </>
    );
  }

  return (
    <>
      <HideUIButton onToggle={onToggleHide} />
      <DemoButton onUIHide={onToggleHide} />
      <PerformanceToggle onToggle={onPerformanceOverlayToggle} />
      <CameraPanel />
      <TimeControlPanel />
      <ManeuverPanel />
      <TaskPanel />
      <MissionBriefingPanel />
    </>
  );
}
