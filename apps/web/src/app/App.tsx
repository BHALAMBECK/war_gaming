import { useState, useEffect } from 'react';
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
import { SolarSystem } from '@/render/SolarSystem';
import { SensorFrustum } from '@/render/SensorFrustum';
import { LaserEffects } from '@/render/LaserEffects';
import { OpsShell } from '@/ui/ops/OpsShell';
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
          minDistance={2}
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

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 8, 18]} fov={50} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={1}
        maxDistance={80}
      />
      <Starfield />
      <SolarSystem />
    </>
  );
}

function SceneBootstrap() {
  const setAgents = useAgentStore((state) => state.setAgents);
  const currentScenario = useScenarioStore((state) => state.currentScenario);
  const loadScenario = useScenarioStore((state) => state.loadScenario);

  useEffect(() => {
    if (currentScenario) {
      loadScenario(currentScenario);
    } else {
      const testAgents = generateTestAgents(500);
      setAgents(testAgents);
    }
  }, [setAgents, currentScenario, loadScenario]);

  return null;
}

function App() {
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

export default App;
