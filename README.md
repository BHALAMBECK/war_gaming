# OSWV - Orbital Swarm Wargame Visualizer

A browser-based interactive 3D space swarm sandbox. Renders Earth, satellites, orbit propagation, swarm behaviors, scenario editor, and cinematic capture.

## Purpose

OSWV is a visual sandbox for entertainment, education, and **lightweight orbital research experiments**. It demonstrates orbital mechanics, swarm behaviors, and formation flying in a browser 3D environment—with seeded, fixed-step runs you can export.

## Safety Guardrails

This project is an **entertainment / education sandbox**, not an operational kill-chain trainer.

Abstract LOS lasers and onboard cameras exist as **game mechanics** (range, Earth occultation, cooldown, HP). We do **not** model real weapon effects, guidance, jamming, or classified sensor phenomenology.

Swarm behaviors remain abstract (cohesion, separation, alignment, formation, task allocation).

## Quick Start

Requires **Node.js 20+** (tested on 22).

```bash
# Install dependencies
npm install

# Start dev server (Vite, port 3000)
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Build for production
npm run build
```

## Research use

1. Open **Tools → Scenarios** and load a built-in example (or your JSON).
2. Set **seed**, **time step**, and **fidelity** (Kepler → Kepler+J2 → RK4+J2). These are written into scenario JSON on save.
3. Physics uses a **fixed `timeStep`** accumulator (not raw frame delta), so FPS should not change the numerical path.
4. In **Mission Ops**, toggle **Record**, run, then **Export run** for a JSON bundle (`meta`, `trajectory`, `events`).

See [docs/SCENARIOS.md](docs/SCENARIOS.md) for schema and example catalog.

## Project Structure

```
apps/web/src/
├── app/           # App entry, router, layout
├── render/        # R3F components (Earth, Agents, Starfield)
├── sim/           # Simulation logic (orbit, swarm, collision)
├── scenario/      # Scenario definitions, serialization
├── ui/            # UI components (panels, HUD)
└── util/          # Utilities (math, units, logging)
```

## Milestones

See [docs/MILESTONES.md](docs/MILESTONES.md) for detailed milestone tracking.

**Current Status**: Ops modernization — Lattice-style three-panel shell, fidelity-tiered propagator, solar map, mission ops hub

## Tech Stack

- **Vite** + **React** + **TypeScript**
- **Three.js** via **react-three-fiber** (R3F) — no Cesium, no paid map services
- **Zustand** for state management
- **Vitest** for testing
- **ESLint** + **Prettier** for code quality

## Ops UI

- **Earth** globe view (tracks, FOV cones, laser beams)
- **Solar map** (Sun + planets, free procedural)
- **Fidelity slider**: Kepler → Kepler+J2 → RK4+J2 (persisted in scenarios)
- **Mission Ops** hub: telemetry, Record/Export, camera snapshots, LOS laser engagements
- **Demo** button: loads the demo scenario and auto-hides UI for capture

## Development

### Coding Standards

- TypeScript strict mode, no `any`
- SI units internally (m, s, kg)
- Deterministic simulation (same seed + scenario + fidelity + timeStep = same run)
- Performance budgets: 60 FPS for 500 agents, 30 FPS for 5,000 agents

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/MILESTONES.md](docs/MILESTONES.md).

## License

ISC

