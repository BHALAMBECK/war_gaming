# Research-First Polish Implementation Plan

> **For agentic workers:** Execute task-by-task. Steps use checkbox syntax.

**Goal:** Make OSWV clone-and-research ready: fixed-step sim, scenario fidelity/timeStep, run export, example picker, docs + light polish.

**Architecture:** Scenario JSON is the experiment config. `sim/fixedStep.ts` drives FPS-independent physics via an accumulator in `SimClock`/`useSimClock`. Agents step in units of `timeStep`. Run recording lives in a small store; Analysis hub exports a JSON bundle.

**Tech Stack:** Vite, React, TypeScript, Zustand, Zod, Vitest, R3F

**Spec:** `docs/superpowers/specs/2026-10-26-research-polish-design.md`

## Global Constraints

- TypeScript strict, no `any` (except existing legacy spots left untouched)
- SI units internally
- Optional `sim.fidelity` defaults to `0` for old scenarios
- No headless CLI, workers, or Earth redesign
- Branch: `cursor/research-polish-8eb7`

---

### Task 1: Scenario experiment config (fidelity, timeStep, dvRemaining)

**Files:**
- Modify: `apps/web/src/scenario/types.ts`, `schema.ts`, `loader.ts`, `saver.ts`
- Modify: `apps/web/src/ui/stores/simClockStore.ts`, `apps/web/src/sim/SimClock.ts`
- Test: extend `apps/web/src/scenario/scenario.test.ts`

**Produces:** `SimParams.fidelity?: 0|1|2`; loader sets ops fidelity + clock timeStep; saver writes fidelity, timeStep, dvRemaining

- [ ] Add `fidelity?: 0 | 1 | 2` to `SimParams` and Zod schema (optional, 0|1|2)
- [ ] `simClockStore` + `SimClock`: add `timeStep` / `setTimeStep` (clamp 0.1–60); sync `stepDelta`
- [ ] `loader.ts`: set fidelity + timeStep; keep dvRemaining
- [ ] `saver.ts`: write timeStep, fidelity, dvRemaining
- [ ] Tests: validate with/without fidelity; round-trip save fields
- [ ] Commit

### Task 2: Fixed-step accumulator + Agents + golden test

**Files:**
- Create: `apps/web/src/sim/fixedStep.ts`, `fixedStep.test.ts`, `sim/orbit/goldenTrajectory.test.ts`
- Modify: `SimClock.ts`, `useSimClock.ts`, `render/Agents.tsx`

**Produces:** `accumulateFixedSteps(acc, frameDelta, timeScale, dt, maxSteps=50)`; clock advances by `n*dt` only

- [ ] Implement + unit-test accumulator
- [ ] `SimClock.update` uses accumulator; returns `steps * dt`; `step()` uses `timeStep`
- [ ] Agents: for each pending fixed step (from simTime delta / timeStep), run one physics iteration with `dt = timeStep`
- [ ] Golden: propagate N agents K steps at fidelity 0 → stable hash
- [ ] Commit

### Task 3: Run recorder + export

**Files:**
- Create: `apps/web/src/util/runExport.ts`, `runExport.test.ts`, `ui/stores/runRecorderStore.ts`
- Modify: `AnalysisHub.tsx`, `Agents.tsx` (sample when recording)

**Produces:** Record toggle; export JSON `{ meta, trajectory, events }`

- [ ] Recorder store: recording flag, samples[], appendSample, clear, cap 10k
- [ ] Subsample every 1 / 5 steps by agent count
- [ ] `buildRunExport` + `downloadRunExport`
- [ ] Analysis hub: Record + Export buttons
- [ ] Commit

### Task 4: Examples picker, large-swarm generator, Demo

**Files:**
- Create: `apps/web/src/scenario/examples/generateLargeSwarm.ts` + test
- Modify: `examples.ts`, `large-swarm.json` (stub), `ScenarioSection.tsx`, `OpsShell.tsx`
- Legacy comments on `UIContainer.tsx`, `ScenarioPanel.tsx`, `DemoButton.tsx`

- [ ] Generator builds 500 agents from seed
- [ ] `loadExampleScenario('large-swarm')` expands via generator
- [ ] ScenarioSection: built-in picker + status line
- [ ] OpsShell: Demo button → `startDemo` + hide UI
- [ ] Commit

### Task 5: Docs + fidelity UX polish

**Files:** `README.md`, `docs/SCENARIOS.md`, `docs/MILESTONES.md`, `docs/ARCHITECTURE.md`, `OpsShell.tsx`, `TimeControlPanel.tsx`

- [ ] Rewrite SCENARIOS; sync milestones; research README section; architecture fixed-step note
- [ ] Fidelity research note under slider; timeStep field in TimeControlPanel
- [ ] Commit + update PR

---

**Verification:** `npm test`, `npm run lint`, `npm run build`
