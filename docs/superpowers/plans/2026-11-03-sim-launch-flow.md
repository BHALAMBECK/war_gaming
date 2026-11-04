# Sim Launch Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Open any project straight into paused Live ops with a Start/Customize overlay; remove silent swarm bootstrap and multi-body Earth-view confusion.

**Architecture:** Library calls `openProjectInOps(scenario)` which loads, pauses, sets view mode, flips `pendingSimLaunch`, and goes to `ops`. `SimLaunchOverlay` applies defaults (fidelity 0, 1×) or customized drafts on Start. No new AppPhase.

**Tech Stack:** React, TypeScript, Zustand, Vitest, existing ops theme CSS

**Spec:** `docs/superpowers/specs/2026-11-03-sim-launch-flow-design.md`

## Global Constraints

- Defaults on Start: fidelity `0`, timeScale `1.0`
- Customize presets: fidelity `0|1|2`; speed `0.5|1|2|5|10`
- Do not re-prompt on Studio ↔ Ops without a new Library load
- No new AppPhase; keep PhaseNav as-is
- Do not commit unless the user asks (session user rule)

## File map

| File | Role |
|------|------|
| `apps/web/src/ui/stores/opsStore.ts` | `pendingSimLaunch` + setter |
| `apps/web/src/ui/ops/openProjectInOps.ts` | Single entry: load + pause + view + phase + prompt |
| `apps/web/src/ui/ops/openProjectInOps.test.ts` | Unit tests for helper |
| `apps/web/src/ui/ops/SimLaunchOverlay.tsx` | Modal UI |
| `apps/web/src/ui/ops/ProjectLibrary.tsx` | Use helper; update copy |
| `apps/web/src/app/OpsRuntime.tsx` | Remove 500-agent bootstrap; empty state; mount overlay |
| `apps/web/src/ui/stores/simClockStore.ts` | Default `paused: true` |
| `apps/web/src/ui/ops/opsTheme.css` | Overlay styles |

---

### Task 1: `pendingSimLaunch` + `openProjectInOps`

**Files:**
- Modify: `apps/web/src/ui/stores/opsStore.ts`
- Create: `apps/web/src/ui/ops/openProjectInOps.ts`
- Create: `apps/web/src/ui/ops/openProjectInOps.test.ts`
- Modify: `apps/web/src/ui/stores/simClockStore.ts` (default `paused: true`)

**Interfaces:**
- Produces: `openProjectInOps(scenario: Scenario): void`
- Produces: `useOpsStore` fields `pendingSimLaunch: boolean`, `setPendingSimLaunch(open: boolean): void`

- [x] **Step 1: Write failing tests for openProjectInOps**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { openProjectInOps } from './openProjectInOps';
import { useOpsStore } from '@/ui/stores/opsStore';
import { useSimClockStore } from '@/ui/stores/simClockStore';
import { useAgentStore } from '@/ui/stores/agentStore';
import { loadExampleScenario } from '@/scenario/examples';

beforeEach(() => {
  useOpsStore.setState({
    appPhase: 'library',
    pendingSimLaunch: false,
    viewMode: 'earth',
    fidelity: 1,
  });
  useSimClockStore.setState({ paused: false, timeScale: 5 });
  useAgentStore.getState().setAgents([]);
});

it('loads into ops paused with launch prompt', () => {
  openProjectInOps(loadExampleScenario('demo'));
  expect(useOpsStore.getState().appPhase).toBe('ops');
  expect(useOpsStore.getState().pendingSimLaunch).toBe(true);
  expect(useSimClockStore.getState().paused).toBe(true);
  expect(useAgentStore.getState().agents.length).toBeGreaterThan(0);
});

it('sets overview for multi-body scenarios', () => {
  openProjectInOps(loadExampleScenario('solar-missions'));
  expect(useOpsStore.getState().viewMode).toBe('overview');
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `cd apps/web && npx vitest run src/ui/ops/openProjectInOps.test.ts`

- [ ] **Step 3: Implement store fields + helper**

`opsStore`: add `pendingSimLaunch: false`, `setPendingSimLaunch`.

`openProjectInOps.ts`:

```ts
import type { Scenario } from '@/scenario/types';
import { useScenarioStore } from '@/ui/stores/scenarioStore';
import { useSimClockStore } from '@/ui/stores/simClockStore';
import { useOpsStore } from '@/ui/stores/opsStore';

export function openProjectInOps(scenario: Scenario): void {
  useScenarioStore.getState().loadScenario(scenario);
  useSimClockStore.getState().setPaused(true);
  const multiBody = scenario.agents.some(
    (a) => (a.centralBody ?? 'earth') !== 'earth'
  );
  useOpsStore.getState().setViewMode(multiBody ? 'overview' : 'earth');
  useOpsStore.getState().setPendingSimLaunch(true);
  useOpsStore.getState().setAppPhase('ops');
}
```

Default `paused: true` in `simClockStore`.

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit only if user asked**

---

### Task 2: SimLaunchOverlay + CSS

**Files:**
- Create: `apps/web/src/ui/ops/SimLaunchOverlay.tsx`
- Modify: `apps/web/src/ui/ops/opsTheme.css`

**Interfaces:**
- Consumes: `pendingSimLaunch`, `setPendingSimLaunch`, `setFidelity`, scenario name, sim clock setters
- Produces: `<SimLaunchOverlay />` — renders null when `pendingSimLaunch` is false

- [ ] **Step 1: Implement overlay**

Behavior:
- Defaults mode: title = scenario name; Start applies fidelity 0 + timeScale 1 + unpause + clear pending
- Customize… expands fidelity 0|1|2 and speed 0.5|1|2|5|10 in local state; Start applies drafts
- Not yet: clear pending, stay paused
- Collapse customize without starting

- [ ] **Step 2: Add `.ops-launch-overlay` / panel / actions styles matching ops glass look**

- [ ] **Step 3: Manual smoke / light unit if needed — overlay returns null when pending false**

---

### Task 3: Wire Library + OpsRuntime

**Files:**
- Modify: `apps/web/src/ui/ops/ProjectLibrary.tsx`
- Modify: `apps/web/src/app/OpsRuntime.tsx`

- [ ] **Step 1: ProjectLibrary** — replace `loadScenario` + `setAppPhase('studio')` for example/saved/blank with `openProjectInOps`; keep Resume studio → `setAppPhase('studio')` only; update hero copy

- [ ] **Step 2: OpsRuntime** — remove `generateTestAgents(500)` path; when no scenario and agents empty, show empty-state div; render `<SimLaunchOverlay />` above OpsShell

- [ ] **Step 3: Fix any tests broken by `paused: true` default**

Run: `cd apps/web && npx vitest run`

- [ ] **Step 4: Spec status → Approved / implementing**

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Library → ops + overlay | 1, 3 |
| Start defaults 0 / 1× | 2 |
| Customize fidelity + speed presets | 2 |
| Not yet stays paused | 2 |
| No re-prompt without new load | 1 (only Library sets pending) |
| Multi-body → overview | 1 |
| Remove 500 bootstrap | 3 |
| Empty Ops state | 3 |
| Studio demotion copy | 3 |
