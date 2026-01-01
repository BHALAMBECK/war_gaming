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
import { UIContainer } from '@/ui/UIContainer';
import { PerformanceOverlay } from '@/ui/PerformanceOverlay';
import { PerformanceTracker } from '@/ui/PerformanceTracker';
import { useCameraStore } from '@/ui/stores/cameraStore';
import { useSimClock } from '@/sim/useSimClock';
import { useAgentStore } from '@/ui/stores/agentStore';
import { useScenarioStore } from '@/ui/stores/scenarioStore';
import { generateTestAgents } from '@/util/generateTestAgents';

function Scene() {
  const preset = useCameraStore((state) => state.preset);
  const enableOrbitControls = preset === 'freecam';
  const setAgents = useAgentStore((state) => state.setAgents);
  const currentScenario = useScenarioStore((state) => state.currentScenario);
  const loadScenario = useScenarioStore((state) => state.loadScenario);
  
  // Initialize sim clock hook (runs in render loop)
  useSimClock();

  // Initialize agents on mount - use scenario if available, otherwise generate test agents
  useEffect(() => {
    if (currentScenario) {
      // Scenario is already loaded via store, but ensure agents are set
      // The scenario loader should have already set them, but this is a safety check
      loadScenario(currentScenario);
    } else {
      // Default: generate test agents if no scenario is loaded
      const testAgents = generateTestAgents(500);
      setAgents(testAgents);
    }
  }, [setAgents, currentScenario, loadScenario]);

  return (
    <>
      {/* Camera setup */}
      <PerspectiveCamera
        makeDefault
        position={[0, 0, 5]}
        fov={50}
      />
      {enableOrbitControls && (
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={2}
          maxDistance={20}
        />
      )}
      
      {/* Camera controller for presets */}
      <CameraController />
      
      {/* Lighting */}
      <Lighting />
      
      {/* Starfield background */}
      <Starfield />
      
      {/* Earth */}
      <Earth radius={1} />
      
      {/* Moon */}
      <Moon />
      
      {/* Agents */}
      <Agents />
      
      {/* Orbit path for selected agent */}
      <OrbitPath />
      
      {/* Trajectory preview for planned maneuver */}
      <TrajectoryPreview />
      
      {/* Objectives */}
      <Objectives />
    </>
  );
}

function App() {
  const [uiHidden, setUIHidden] = useState(false);
  const [performanceOverlayVisible, setPerformanceOverlayVisible] = useState(false);
  const [fps, setFps] = useState(0);

  return (
    <>
      <Canvas
        gl={{ antialias: true }}
        dpr={[1, 2]}
        style={{ width: '100%', height: '100%', background: '#000' }}
      >
        <Scene />
        <PerformanceTracker 
          enabled={performanceOverlayVisible}
          onFpsUpdate={setFps} 
        />
      </Canvas>
      <UIContainer 
        hidden={uiHidden} 
        onToggleHide={setUIHidden}
        performanceOverlayVisible={performanceOverlayVisible}
        onPerformanceOverlayToggle={setPerformanceOverlayVisible}
      />
      <PerformanceOverlay visible={performanceOverlayVisible} fps={fps} />
    </>
  );
}

export default App;

