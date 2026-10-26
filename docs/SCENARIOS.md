# Scenario System

Scenarios are the **experiment config** for OSWV: initial conditions, seed, fixed time step, and propagator fidelity. Same scenario + seed + fidelity + timeStep → same physics under the fixed-step clock.

## Schema

```typescript
interface Scenario {
  name: string;
  description: string;
  version: string;
  earth: { radius: number; mu?: number };
  agents: AgentScenario[];
  sim: {
    timeStep: number;      // fixed physics dt (seconds); honored by sim clock
    maxTime?: number;      // metadata / export bound (no auto-stop yet)
    initialTime?: number;  // defaults to 0
    fidelity?: 0 | 1 | 2;  // 0 Kepler, 1 Kepler+J2, 2 RK4+J2 (default 0)
  };
  seed: string;
  objectives?: Objective[];
}
```

Agents may include `team`, `dvRemaining`, and behavior flags. Validation is Zod-based (`apps/web/src/scenario/schema.ts`).

## Fidelity tiers

| Value | Label | Notes |
|------:|-------|-------|
| 0 | Kepler (2-body) | Fast research baseline |
| 1 | Kepler + J2 | Mild Earth-oblateness kick |
| 2 | RK4 + J2 | Higher-cost numerical step |

Sandbox fidelity — not ops-grade ephemeris. Saved scenarios write the current slider value into `sim.fidelity`.

## Fixed-step determinism

Physics advances in whole `sim.timeStep` increments (accumulator + 50-step/frame cap). Wall-clock FPS does not change the numerical path. Prefer moderate time scales when recording long runs.

## Load / save / export

| Action | Where |
|--------|--------|
| Built-in examples | Tools → Scenarios picker |
| Load/save JSON | Tools → Scenarios (file + localStorage) |
| Download scenario IC | Tools → Download Scenario |
| Record trajectory | Mission Ops → Record |
| Export run bundle | Mission Ops → Export run |

Run export JSON shape: `{ meta, trajectory, events }` with seed, fidelity, timeStep, subsampled states, and engagement/snapshot logs.

## Example catalog

| Name | Description |
|------|-------------|
| `demo` | Short cinematic demo |
| `simple-ring` | Ring formation, LEO |
| `large-swarm` | Stub JSON; expands to **500** agents at load (`generateLargeSwarm.ts`) |
| `task-demo` | Task allocation objectives |

Path: `apps/web/src/scenario/examples/`.
