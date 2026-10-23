# OSWV - Orbital Swarm Wargame Visualizer

A browser-based interactive 3D space swarm sandbox. Renders Earth, satellites, orbit propagation, swarm behaviors, scenario editor, and cinematic capture.

## Purpose

OSWV is a visual sandbox for entertainment and education. It demonstrates orbital mechanics, swarm behaviors, and formation flying in a beautiful 3D environment optimized for impressive demos.

## Safety Guardrails

This project is an **entertainment / education sandbox**, not an operational kill-chain trainer.

Abstract LOS lasers and onboard cameras exist as **game mechanics** (range, Earth occultation, cooldown, HP). We do **not** model real weapon effects, guidance, jamming, or classified sensor phenomenology.

Swarm behaviors remain abstract (cohesion, separation, alignment, formation, task allocation).

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Build for production
npm run build
```

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
- **Fidelity slider**: Kepler → Kepler+J2 → RK4+J2
- **Mission Ops** hub: telemetry, camera snapshots, LOS laser engagements

## Development

### Plan/Act Protocol

This project uses a strict two-phase workflow:
1. **PLAN MODE**: Propose plan, file diffs, acceptance checks
2. **ACT MODE**: Implement exactly the agreed plan

### Coding Standards

- TypeScript strict mode, no `any`
- SI units internally (m, s, kg)
- Deterministic simulation (same seed + scenario = same run)
- Performance budgets: 60 FPS for 500 agents, 30 FPS for 5,000 agents

See [.cursor/rules/](.cursor/rules/) for detailed coding guidelines.

## License

ISC

