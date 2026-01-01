# OSWV - Orbital Swarm Wargame Visualizer

A browser-based interactive 3D space swarm sandbox. Renders Earth, satellites, orbit propagation, swarm behaviors, scenario editor, and cinematic capture.

## Purpose

OSWV is a visual sandbox for entertainment and education. It demonstrates orbital mechanics, swarm behaviors, and formation flying in a beautiful 3D environment optimized for impressive demos.

## Safety Guardrails

This project is **NOT** designed for real-world weaponization. We do NOT implement:
- Targeting systems
- Weapon effects
- Intercept guidance
- Jamming or sensor simulation mirroring operational kill chains

Swarm behaviors are abstract (cohesion, separation, alignment, formation, task allocation) and not framed as attack behaviors.

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

**Current Status**: Milestone 0 complete ✅

## Tech Stack

- **Vite** + **React** + **TypeScript**
- **Three.js** via **react-three-fiber** (R3F)
- **Zustand** for state management
- **Vitest** for testing
- **ESLint** + **Prettier** for code quality

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

