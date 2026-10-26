# Research-First Polish Design

**Date:** 2026-10-26  
**Status:** Approved; implementing  
**Approach:** In-browser research harness + targeted product polish (Approach 1)

## Goal

Make OSWV something a researcher can clone from git, load a scenario, run a **reproducible** simulation at a chosen fidelity, and **export** results—while cleaning the ops UI enough that the product feels intentional.

## Non-goals (this pass)

- Headless Node/CLI batch runner
- WebWorker simulation / LOD
- Predictive collision module (`sim/collision/`)
- Ephemeris-grade solar / real weapon phenomenology
- Full visual redesign of Earth or ops theme

## Context

OSWV already has: Kepler / Kepler+J2 / RK4+J2 fidelity, seeded RNG, Zod scenarios, Lattice ops shell, example JSON files. Gaps that block research use:

1. Live sim advances with **render-frame deltas** (FPS-dependent numerics).
2. **Fidelity is UI-only** — not in scenario JSON; `timeStep` is schema-present but not honored on load/save.
3. **No run export** — engagements/snapshots are in-memory only.
4. **Examples / demo** poorly wired (`large-swarm` effectively broken; Demo orphaned from ops shell).
5. **Docs drift** — milestones/scenarios outdated relative to code.

## Design

### 1. Fixed-step simulation

**Behavior**

- Physics steps use a fixed `dt = scenario.sim.timeStep` (default `1.0` s if unset).
- Each render frame: accumulate `frameDelta * timeScale`; while accumulator ≥ `dt`, run one sim step and subtract `dt`.
- Cap max steps per frame at **50**; leftover stays in accumulator.
- Pause + single-step advances exactly one `dt` (existing step control maps to fixed `dt`).
- `SimClock.simTime` increments by `dt` per physics step (not by wall-clock-scaled frame delta).
- `sim.maxTime` is **metadata only** this pass (documented export/experiment bound). No automatic sim stop.

**Where**

- Add pure helper `sim/fixedStep.ts` (accumulator API) called from `render/Agents.tsx` so logic is unit-testable without R3F.
- `simClockStore` gains `timeStep` (default `1.0`); TimeControlPanel shows it as an editable field (clamped to a sane positive range, e.g. 0.1–60 s).

**Acceptance**

- Same scenario + seed + fidelity + timeStep → identical agent positions after N steps regardless of frame rate (tested with synthetic deltas).
- Golden hash/fixture test for one short run.

### 2. Scenario = experiment config

**Schema additions** (`SimParams`)

```ts
sim: {
  timeStep: number;       // already present; now honored
  maxTime?: number;       // already present; optional soft stop / export bound
  initialTime?: number;   // already present; honored
  fidelity?: 0 | 1 | 2;   // NEW; default 0 for backward compatibility
}
```

**Load** (`loader.ts`)

- Apply `seed`, `initialTime`, agents, objectives (existing).
- Set `opsStore.fidelity` from `sim.fidelity ?? 0`.
- Set clock `timeStep` from `sim.timeStep`.
- Persist `dvRemaining` on agents (saver currently drops it — fix).

**Save** (`saver.ts`)

- Write `sim.timeStep` from store (not hardcoded `1.0`).
- Write `sim.fidelity` from `opsStore`.
- Write `dvRemaining` on each agent.

**UI**

- Fidelity slider remains live; changing it updates the active run config (and thus what save/export embeds).
- Short research note under slider: what each tier includes / excludes (sandbox, not ops-grade).

**Acceptance**

- Round-trip: load example → change fidelity → save JSON → reload → same fidelity and timeStep.
- Old scenarios without `fidelity` still load (default 0).

### 3. Run export

**Format:** JSON bundle download (one file), research-friendly:

```json
{
  "meta": {
    "scenarioName": "...",
    "seed": "...",
    "fidelity": 1,
    "timeStep": 1.0,
    "exportedAt": "ISO-8601",
    "agentCount": 50,
    "simTimeStart": 0,
    "simTimeEnd": 120
  },
  "trajectory": [
    { "t": 0, "agents": [{ "id": "...", "r": [x,y,z], "v": [vx,vy,vz] }] }
  ],
  "events": [
    { "t": 12.0, "type": "engagement" | "snapshot", "payload": { ... } }
  ]
}
```

**Recording**

- Explicit **Record** toggle in Analysis hub (default **off**). While on, append trajectory samples to an in-memory buffer (cap ~10k samples; drop oldest if exceeded).
- Subsample: every **1** step if agent count ≤ 200; every **5** steps if > 200.
- **Export run** always available: writes meta + any buffered trajectory + current `systemsStore` engagement/snapshot logs. If Record was never on, `trajectory` may be empty but `events` still export.

**Acceptance**

- After a short recorded run, export file opens as valid JSON with meta matching UI seed/fidelity/timeStep.
- Unit test for serializer shape (no browser download required).

### 4. Examples + demo

- Add **built-in scenario picker** in Ops Tools (`ScenarioSection`): Demo, Simple Ring, Large Swarm, Task Demo.
- **Large swarm:** keep a compact JSON stub plus `scenario/examples/generateLargeSwarm.ts` that expands to **500** agents at load when the picker selects Large Swarm (documented in SCENARIOS.md). Do not commit a 500-agent JSON blob.
- Wire **Demo** into OpsShell Tools (reuse `demoMode.ts` behavior; auto-hide UI after ~2 s for capture).
- Leave `UIContainer.tsx` / `ScenarioPanel.tsx` / `DemoButton.tsx` unmounted; add a one-line file comment `// Legacy — ops shell is the only entry (App.tsx → OpsShell)`. Do not delete in this pass (avoids churn in stale tests); App continues to mount only `OpsShell`.

**Acceptance**

- Fresh clone → Dev → pick Large Swarm → **500** agents.
- Demo control in ops Tools runs a prebuilt sequence without console errors.

### 5. Docs

- Rewrite [`docs/SCENARIOS.md`](../../SCENARIOS.md): real schema, fidelity, timeStep, seeds, load/save/export, example catalog.
- Sync [`docs/MILESTONES.md`](../../MILESTONES.md) status to match shipped code (mark implemented milestones complete; leave true gaps open).
- README: research subsection (reproducibility, fidelity tiers, fixed-step, export); remove/fix stale `.cursor/rules` pointer; optional `.nvmrc` / engines if CI/local Node is known.
- Brief note in ARCHITECTURE on fixed-step + experiment config.

### 6. Targeted polish

- Fidelity control copy + research notes (ops theme, no purple/glow redesign).
- Example load toast/status (“Loaded simple-ring · seed … · fidelity Kepler+J2”).
- Export + Record affordances next to Analysis / Tools.
- No Earth shader overhaul; only quiet console noise if cheap.

### 7. Tests

| Test | Intent |
|------|--------|
| Fixed-step accumulator | N synthetic frames of uneven delta → same end state as N×dt |
| Scenario fidelity round-trip | schema + load/save |
| Golden short trajectory | hash positions after K steps for seed×fidelity |
| Run export serializer | meta + trajectory + events shape |
| large-swarm / examples | agent count ≥ documented minimum |

## File touch map (expected)

| Area | Paths |
|------|--------|
| Fixed step | `sim/fixedStep.ts` (new), `SimClock` / `simClockStore`, `render/Agents.tsx` |
| Scenario | `scenario/types.ts`, `schema.ts`, `loader.ts`, `saver.ts`, `examples/*` |
| Export | `util/runExport.ts` (new) or `scenario/runExport.ts`, `systemsStore` / Analysis hub |
| UI | `ui/ops/OpsShell.tsx`, `ScenarioSection.tsx`, demo wiring, fidelity labels |
| Docs | `README.md`, `docs/SCENARIOS.md`, `docs/MILESTONES.md`, `docs/ARCHITECTURE.md` |
| Tests | colocated `*.test.ts` next to new modules + one golden test |

## Success criteria

A researcher can:

1. `npm install && npm run dev`
2. Load a built-in example (or their JSON) with documented seed + fidelity + timeStep
3. Run and get FPS-independent physics for that config
4. Export a run bundle they can archive or diff
5. Read docs that match the software

## Risks / mitigations

| Risk | Mitigation |
|------|------------|
| Fixed-step + high timeScale overloads main thread | Step cap per frame; document recommended timeScale |
| Huge trajectory files | Subsample by agent count; document |
| Breaking old scenarios | Optional `fidelity`; defaults preserve current behavior |
| Scope creep into CLI/workers | Explicit non-goals |

## Implementation order

1. Schema + saver/loader fidelity/timeStep/dvRemaining  
2. Fixed-step accumulator + Agents integration + tests  
3. Run recorder/export + UI  
4. Examples picker + large-swarm + demo wire-up  
5. Docs + milestone sync  
6. Polish copy / status feedback  
