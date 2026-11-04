# Sim Launch Flow Design

**Date:** 2026-11-03  
**Status:** Implemented  
**Approach:** Launch overlay on Ops (Approach 1)

## Goal

Make the primary path obvious: open a project → see the visual immediately → explicitly start the sim (defaults or customize). Stop dumping users into Studio forms and stop the sim running without consent.

## Decisions (locked)

| Topic | Choice |
|-------|--------|
| Start prompt shape | **C** — “Start with defaults?”; **Customize…** for fidelity + speed |
| Who gets the flow | **C** — every scenario open (examples, saved, blank) |
| Defaults | **A** — fidelity `0` (Kepler), timeScale `1×` |
| Studio / Analysis | **A** — keep in PhaseNav; demote (not the default landing) |
| Implementation approach | **1** — overlay on Live ops, not a new app phase |

## Non-goals (this pass)

- Redesigning Studio / Analysis internals
- Collapsing or removing PhaseNav phases
- Changing physics, fidelity meanings, or scenario schema
- Auto-cinematic demo camera / auto-hide UI (existing Ops “Demo” tool stays as-is unless touched incidentally)

## Context / current breakage

1. **Library → Studio**: `ProjectLibrary` loads examples/saved/blank into `studio`, so first contact is forms, not the globe.
2. **Sim runs immediately**: `simClockStore` defaults `paused: false`; entering Ops often means motion before the user understands state.
3. **Silent 500-agent bootstrap**: `OpsRuntime` `SceneBootstrap` calls `generateTestAgents(500)` when there is no scenario — looks like a real project.
4. **Multi-body land on Earth view**: solar-style scenarios can look “empty” or wrong until the user discovers Overview.
5. **Cognitive load**: four phases with weak primary CTA; hard to tell what is going on.

## Design

### 1. Primary path: Library → Live ops + launch overlay

**Behavior**

- Clicking an **example**, **saved project**, or **New blank project** must:
  1. Load the scenario into app state (existing `loadScenario` path).
  2. Set `appPhase` to `'ops'` (not `'studio'`).
  3. Force sim **paused**.
  4. Reset / set sim time to scenario `sim.initialTime` (existing load behavior).
  5. Open the launch overlay (`pendingSimLaunch` / equivalent → `true`).
- “Resume studio” (continue last project in Studio) stays a Studio entry; it does **not** open the launch overlay.
- Opening another project from Library repeats the full launch sequence (new load + overlay).

**Empty Ops**

- Navigating PhaseNav → Live ops with **no** loaded scenario: no fake agents; show a short empty state (“Open a project from Library”). No launch overlay.

### 2. SimLaunchOverlay

**Placement**

- Rendered in the Ops phase (above the globe). Modal dimmer + centered panel. Does not invent a new `AppPhase`.

**Content (collapsed / defaults mode)**

- Scenario name (title)
- Copy: start with defaults? (Kepler · 1×)
- Actions:
  - **Start** — apply fidelity `0`, timeScale `1.0`, unpause, clear pending launch
  - **Customize…** — expand inline controls (no navigation away)
  - **Not yet** — dismiss overlay, remain paused; user may use normal time controls later

**Customize mode**

- Fidelity control: `0 | 1 | 2` (existing labels)
- Speed control: discrete presets **`0.5 | 1 | 2 | 5 | 10`** (not the full Ops 0.1–100 slider — keep the launch dialog short)
- Draft values live in overlay local state until **Start**
- **Start** applies draft fidelity + timeScale, unpause, clear pending launch
- User can collapse Customize back to the defaults prompt without starting

**Re-prompt rules**

- New project open from Library → re-prompt
- Studio ↔ Ops ↔ Analysis without a new load → **do not** re-prompt
- Choosing **Not yet** → no automatic re-prompt for that load

### 3. State

Add to `opsStore` (names may vary slightly in implementation):

- `pendingSimLaunch: boolean`
- `setPendingSimLaunch(open: boolean)`

Helpers (recommended, not required as a separate module): a single `openProjectInOps(scenario)` used by Library so pause + phase + pending flag stay consistent.

### 4. Fidelity / clock interaction with `loadScenario`

- `loadScenario` may continue to write `scenario.sim.fidelity` into the ops store for Studio/export honesty.
- When the user presses **Start** (defaults or customize), the launch choice **overwrites** fidelity and timeScale for the run. Defaults prompt always means Kepler · 1× unless Customize changed the draft.
- Until Start, the clock stays paused regardless of prior store `paused` value.

### 5. Multi-body view default

- On project open into Ops: if any agent has `centralBody` other than `'earth'`, set `viewMode` to overview (`'overview'` / `'solar'` alias already supported).
- Earth-only scenarios keep current default Earth view.

### 6. Remove silent swarm bootstrap

- Delete / gate the `generateTestAgents(500)` path in `SceneBootstrap` when there is no intended project.
- Empty agent list + no scenario → empty state UI, not a synthetic swarm.

### 7. Studio / Analysis demotion (copy + entry only)

- PhaseNav remains Library / Studio / Analysis / Live ops.
- Library hero copy updates: open a project to see the live visual and start when ready; Studio is for designing, not the default landing.
- Studio “Run live ops” continues to go to Ops; if the scenario was already running or Not-yet’d, do not force the overlay again (same re-prompt rules). Optional later: a “Restart launch prompt” control — **out of scope**.

## Error handling

- Failed example/saved load: keep Library visible, show existing error string; do not switch phase or open overlay.
- Overlay Start with zero agents (blank project): still allowed — user sees empty globe running; blank is an intentional sandbox.

## Testing

- Library example click → phase `ops`, paused, overlay visible, agents from example (not 500 stubs).
- Start defaults → fidelity `0`, timeScale `1`, unpaused, overlay gone.
- Customize → chosen fidelity/scale applied only on Start.
- Not yet → overlay gone, still paused.
- Second Library open → overlay returns.
- Studio → Ops without new load → no overlay.
- Multi-body example → overview view mode.
- Ops with no scenario → no synthetic agents; empty state.

## Implementation sketch (files)

| Area | Likely touch |
|------|----------------|
| Store | `apps/web/src/ui/stores/opsStore.ts` |
| Overlay | new `apps/web/src/ui/ops/SimLaunchOverlay.tsx` |
| Wire overlay | `OpsShell.tsx` or `OpsRuntime.tsx` |
| Library entry | `ProjectLibrary.tsx` |
| Bootstrap | `OpsRuntime.tsx` (`SceneBootstrap`) |
| Clock default | `simClockStore.ts` (default `paused: true` if safe for tests; else force pause on Ops project open) |
| Copy | Library hero / empty states |

Adjust tests that assumed `paused: false` on fresh store if the default flips.
