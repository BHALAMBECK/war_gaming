# OSWV Architecture

## High-Level Overview

OSWV follows a layered architecture with clear separation between rendering, simulation, UI, and scenario management.

```
┌─────────────────────────────────────────┐
│           UI Layer                      │
│  (Panels, HUD, Controls, Hotkeys)      │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│        Scenario Layer                   │
│  (Definitions, Serialization, Seeds)    │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│        Simulation Layer                 │
│  (Orbit Propagation, Swarm Behaviors)   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│        Render Layer                     │
│  (R3F Scene, Materials, Shaders)        │
└─────────────────────────────────────────┘
```

## Layer Responsibilities

### Render Layer (`apps/web/src/render/`)
- Three.js scene setup via react-three-fiber
- Earth, starfield, lighting, camera
- Agent rendering (instanced meshes)
- Visual effects (orbit paths, selection highlights)
- **No simulation logic** - only visual representation

### Simulation Layer (`apps/web/src/sim/`)
- Orbit propagation (Kepler solver, numerical integration)
- Swarm behaviors (cohesion, separation, alignment, formations)
- Collision avoidance
- Task allocation
- Deterministic RNG (seed-based)
- **No rendering** - pure state transformations

### Scenario Layer (`apps/web/src/scenario/`)
- Scenario JSON schema and validation
- Initial conditions (agent positions, orbital elements)
- Behavior toggles and parameters
- Save/load (localStorage or file)
- Seed management
- **No simulation or rendering** - data structures only

### UI Layer (`apps/web/src/ui/`)
- Control panels (time, camera, scenario, swarm)
- HUD overlay (FPS, sim time, agent count)
- Hotkey handling
- Demo mode orchestration
- **No direct sim/render access** - communicates via Zustand stores

## Data Flow

```
Scenario JSON
    ↓
Scenario Loader (deserializes)
    ↓
Initial State (agents, Earth params)
    ↓
Sim Clock (time control)
    ↓
Sim Step (orbit propagation, behaviors)
    ↓
Updated State (new positions, velocities)
    ↓
Render Loop (R3F useFrame)
    ↓
Visual Update (mesh positions, camera)
```

## State Management

- **Zustand stores** for global state:
  - `useSimClockStore`: time, pause, timeScale, seed
  - `useCameraStore`: preset, target, position
  - `useScenarioStore`: current scenario, agents
  - `useUIStore`: panel visibility, hide UI toggle

- **React state** for component-local UI state only

## Performance Strategy

1. **Instanced Rendering**: Use `InstancedMesh` or `Points` for many agents
2. **Sim/Render Decoupling**: Sim runs at fixed delta, independent of FPS
3. **Frustum Culling**: Don't render off-screen agents
4. **LOD**: Reduce detail for distant agents
5. **Batching**: Update all agent positions in single loop
6. **WebWorker** (future): Move sim step to worker thread

## Coordinate Systems

- **ECI (Earth-Centered Inertial)**: Primary sim coordinate system
- **ECEF (Earth-Centered Earth-Fixed)**: For Earth-relative calculations
- **Local Frame**: For swarm behaviors (relative to formation center)

## Units

- **SI units internally**: meters (m), seconds (s), kilograms (kg)
- Conversions documented at module boundaries
- Three.js uses arbitrary units (1 unit = 1 Earth radius for demo)

## Determinism

- All RNG uses seed-based generator (`seedrandom`)
- Sim step is deterministic: same initial state + time + seed = same final state
- Scenario reload produces identical simulation run
- Golden tests verify determinism

## File Organization

```
apps/web/src/
├── app/           # App entry, router, layout
├── render/        # R3F components (Earth, Agents, Starfield)
├── sim/           # Simulation logic (orbit, swarm, collision)
├── scenario/      # Scenario definitions, serialization
├── ui/            # UI components (panels, HUD)
└── util/          # Utilities (math, units, logging, profiling)
```

