import { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Earth } from '@/render/Earth';
import { Moon } from '@/render/Moon';
import { Starfield } from '@/render/Starfield';
import { Lighting } from '@/render/Lighting';
import { CameraController } from '@/render/CameraController';
import { Agents } from '@/render/Agents';
import { OrbitPath } from '@/render/OrbitPath';
import { Objectives } from '@/render/Objectives';
import { TrajectoryPreview } from '@/render/TrajectoryPreview';
import {
  SolarSystem,
  SolarFocusController,
  type SolarControlsHandle,
} from '@/render/SolarSystem';
import { SensorFrustum } from '@/render/SensorFrustum';
import { LaserEffects } from '@/render/LaserEffects';
import { OpsShell } from '@/ui/ops/OpsShell';
import { ProjectLibrary } from '@/ui/ops/ProjectLibrary';
import { StudioShell } from '@/ui/ops/StudioShell';
import { AnalysisShell } from '@/ui/ops/AnalysisShell';
import { PerformanceOverlay } from '@/ui/PerformanceOverlay';
import { PerformanceTracker } from '@/ui/PerformanceTracker';
import { useCameraStore } from '@/ui/stores/cameraStore';
import { useOpsStore } from '@/ui/stores/opsStore';
import { useSimClock } from '@/sim/useSimClock';
import { useAgentStore } from '@/ui/stores/agentStore';
import { useScenarioStore } from '@/ui/stores/scenarioStore';
import { generateTestAgents } from '@/util/generateTestAgents';

function EarthScene() {
  const preset = useCameraStore((state) => state.preset);
  const enableOrbitControls = preset === 'freecam';

  useSimClock();

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
      {enableOrbitControls && (
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={1.2}
          maxDistance={20}
        />
      )}
      <CameraController />
      <Lighting />
      <Starfield />
      <Earth radius={1} />
      <Moon />
      <Agents />
      <OrbitPath />
      <TrajectoryPreview />
      <Objectives />
      <SensorFrustum />
      <LaserEffects />
    </>
  );
}

function SolarScene() {
  useSimClock();
  const controlsRef = useRef<SolarControlsHandle | null>(null);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 8, 18]} fov={50} />
      <OrbitControls
        ref={controlsRef as never}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={0.15}
        maxDistance={120}
      />
      <SolarFocusController controlsRef={controlsRef} />
      <Starfield radius={500} />
      <SolarSystem />
    </>
  );
}

function SceneBootstrap() {
  const setAgents = useAgentStore((state) => state.setAgents);
  const agents = useAgentStore((state) => state.agents);
  const currentScenario = useScenarioStore((state) => state.currentScenario);
  const loadScenario = useScenarioStore((state) => state.loadScenario);

  useEffect(() => {
    if (currentScenario) {
      loadScenario(currentScenario);
    } else if (agents.length === 0) {
      setAgents(generateTestAgents(500));
    }
  }, [setAgents, currentScenario, loadScenario, agents.length]);

  return null;
}

function OpsRuntime() {
  const [uiHidden, setUIHidden] = useState(false);
  const [performanceOverlayVisible, setPerformanceOverlayVisible] =
    useState(false);
  const [fps, setFps] = useState(0);
  const viewMode = useOpsStore((s) => s.viewMode);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: 'var(--ops-bg, #080808)',
      }}
    >
      <Canvas
        gl={{ antialias: true }}
        dpr={[1, 2]}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          background: '#050505',
        }}
      >
        <SceneBootstrap />
        {viewMode === 'earth' ? <EarthScene /> : <SolarScene />}
        <PerformanceTracker
          enabled={performanceOverlayVisible}
          onFpsUpdate={setFps}
        />
      </Canvas>
      <OpsShell
        hidden={uiHidden}
        onToggleHide={setUIHidden}
        performanceOverlayVisible={performanceOverlayVisible}
        onPerformanceOverlayToggle={setPerformanceOverlayVisible}
      />
      <PerformanceOverlay visible={performanceOverlayVisible} fps={fps} />
    </div>
  );
}

function App() {
  const appPhase = useOpsStore((s) => s.appPhase);

  if (appPhase === 'library') {
    return <ProjectLibrary />;
  }
  if (appPhase === 'studio') {
    return <StudioShell />;
  }
  if (appPhase === 'analysis') {
    return <AnalysisShell />;
  }
  return <OpsRuntime />;
}

export default App;
