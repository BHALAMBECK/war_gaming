import { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import { Earth } from '@/render/Earth';
import { Moon } from '@/render/Moon';
import { Mars } from '@/render/Mars';
import { LocalMoon } from '@/render/LocalBody';
import { Starfield } from '@/render/Starfield';
import { Lighting } from '@/render/Lighting';
import { CameraController } from '@/render/CameraController';
import { Agents } from '@/render/Agents';
import { AgentSimLoop } from '@/render/AgentSimLoop';
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
import { SimLaunchOverlay } from '@/ui/ops/SimLaunchOverlay';
import { PerformanceOverlay } from '@/ui/PerformanceOverlay';
import { PerformanceTracker } from '@/ui/PerformanceTracker';
import { useCameraStore } from '@/ui/stores/cameraStore';
import { useOpsStore, isOverviewMode } from '@/ui/stores/opsStore';
import { useSimClock } from '@/sim/useSimClock';
import { useAgentStore } from '@/ui/stores/agentStore';
import { useScenarioStore } from '@/ui/stores/scenarioStore';
import type { CentralBody } from '@/sim/orbit/bodies';

function BodyLocalScene({ body }: { body: CentralBody }) {
  const preset = useCameraStore((state) => state.preset);
  const enableOrbitControls = preset === 'freecam';
  const minDistance = preset === 'zoomIn' ? 0.2 : 1.2;

  useSimClock();

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[0, 0, 5]}
        fov={50}
        near={0.02}
        far={5000}
      />
      {enableOrbitControls && (
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={minDistance}
          maxDistance={20}
        />
      )}
      <CameraController centralBody={body} />
      <Lighting />
      <Starfield />
      {body === 'earth' && (
        <>
          <Earth radius={1} />
          <Moon />
        </>
      )}
      {body === 'moon' && <LocalMoon radius={1} />}
      {body === 'mars' && <Mars radius={1} />}
      <Agents centralBody={body} />
      <OrbitPath />
      {body === 'earth' && (
        <>
          <TrajectoryPreview />
          <Objectives />
          <SensorFrustum />
          <LaserEffects />
        </>
      )}
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
      <Starfield radius={500} count={12000} />
      <SolarSystem />
    </>
  );
}

function SceneBootstrap() {
  const currentScenario = useScenarioStore((state) => state.currentScenario);
  const loadScenario = useScenarioStore((state) => state.loadScenario);

  useEffect(() => {
    if (currentScenario) {
      loadScenario(currentScenario);
    }
  }, [currentScenario, loadScenario]);

  return null;
}

function OpsEmptyState() {
  const currentScenario = useScenarioStore((s) => s.currentScenario);
  const agents = useAgentStore((s) => s.agents);
  const pendingLaunch = useOpsStore((s) => s.pendingSimLaunch);

  if (currentScenario || agents.length > 0 || pendingLaunch) {
    return null;
  }

  return (
    <div className="ops-empty-ops">
      <h2>No project loaded</h2>
      <p>Open a project from the Library to see the visual and start a sim.</p>
    </div>
  );
}

function ActiveScene() {
  const viewMode = useOpsStore((s) => s.viewMode);

  if (isOverviewMode(viewMode)) {
    return <SolarScene />;
  }
  if (viewMode === 'moon') {
    return <BodyLocalScene body="moon" />;
  }
  if (viewMode === 'mars') {
    return <BodyLocalScene body="mars" />;
  }
  return <BodyLocalScene body="earth" />;
}

export function OpsRuntime() {
  const [uiHidden, setUIHidden] = useState(false);
  const [performanceOverlayVisible, setPerformanceOverlayVisible] =
    useState(false);
  const [fps, setFps] = useState(0);

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
        gl={{
          antialias: true,
          toneMapping: ACESFilmicToneMapping,
          outputColorSpace: SRGBColorSpace,
        }}
        dpr={[1, 2]}
        onCreated={({ gl }) => {
          gl.toneMappingExposure = 1.08;
        }}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          background:
            'radial-gradient(ellipse at 50% 120%, #0a1525 0%, #030508 55%, #000 100%)',
        }}
      >
        <SceneBootstrap />
        <AgentSimLoop />
        <ActiveScene />
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
      <OpsEmptyState />
      <SimLaunchOverlay />
      <PerformanceOverlay visible={performanceOverlayVisible} fps={fps} />
    </div>
  );
}
