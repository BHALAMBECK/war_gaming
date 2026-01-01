# OSWV Milestones

Status tracking for all project milestones. Each milestone includes acceptance checks and links to related files.

## Milestone 0: Repo Scaffold + Dev Tooling
**Status**: ✅ Complete  
**Goal**: Working dev environment with blank R3F scene.

**Acceptance Checks**:
- [x] `npm install` completes without errors
- [x] `npm run dev` (in apps/web) launches dev server
- [x] Browser shows blank black canvas (no errors in console)
- [x] `npm run lint` passes (or reports only intentional warnings)
- [x] `npm test` runs (may have 0 tests, but command works)
- [x] TypeScript compilation succeeds (`npm run build` or `tsc --noEmit`)
- [x] `.cursor/rules/*.mdc` files exist and contain project context
- [x] `docs/MILESTONES.md` lists all 10 milestones

**Files**: Root configs, `apps/web/` configs, `.cursor/rules/`, basic React app.

---

## Milestone 1: Earth Render (Beauty Pass v1)
**Status**: ✅ Complete  
**Goal**: Beautiful 3D Earth with day texture, night lights, specular, and starfield.

**Acceptance Checks**:
- [ ] Earth renders with day texture visible
- [ ] Night lights texture overlays correctly (emissive)
- [ ] Specular highlights visible on day side
- [ ] Starfield renders in background
- [ ] Camera orbit controls work (mouse drag rotates, scroll zooms)
- [ ] No console errors or warnings
- [ ] FPS stable at 60fps (check browser DevTools)
- [ ] Earth looks "good enough for LinkedIn" (subjective, but should be recognizable)

**Files**: `apps/web/src/render/Earth.tsx`, `Starfield.tsx`, `Lighting.tsx`, `App.tsx` updates.

---

## Milestone 2: Camera and Capture
**Status**: ✅ Complete  
**Goal**: Camera presets and UI toggle for recording.

**Acceptance Checks**:
- [ ] Three camera presets available via UI dropdown/buttons
- [ ] "Cinematic Orbit" auto-rotates smoothly
- [ ] "Follow Target" follows Earth center (or placeholder target)
- [ ] "Freecam" allows manual control
- [ ] UI hide button exists and toggles UI visibility
- [ ] When UI is hidden, only Earth/scene visible (clean for recording)
- [ ] Camera transitions are smooth (no jumps)
- [ ] No console errors

**Files**: `apps/web/src/render/CameraController.tsx`, `apps/web/src/ui/CameraPanel.tsx`, `HideUIButton.tsx`.

---

## Milestone 3: Time Control Core
**Status**: ✅ Complete  
**Goal**: Deterministic simulation clock with pause/play, time scale, and single-step.

**Acceptance Checks**:
- [ ] Play/pause button toggles simulation
- [ ] Time scale slider changes simulation speed (0.1x to 100x)
- [ ] Single step button advances sim by fixed delta when paused
- [ ] Current sim time displays in UI (formatted as days/hours/minutes/seconds)
- [ ] Seed input allows setting deterministic seed
- [ ] Same seed + same scenario = identical simulation run (test: reset, play, compare)
- [ ] Sim clock independent of render FPS (test: cap FPS, sim still advances correctly)
- [ ] No console errors

**Files**: `apps/web/src/sim/SimClock.ts`, `useSimClock.ts`, `apps/web/src/ui/TimeControlPanel.tsx`, `apps/web/src/util/seed.ts`.

---

## Milestone 4: Two-Body Orbit Propagation v1
**Status**: ✅ Complete   
**Goal**: Define satellite state using classical orbital elements. Propagate with stable approach (Kepler solver or numerical integration).

**Acceptance Checks**:
- [ ] Satellites stay in plausible orbits, no drift explosion
- [ ] Orbital elements convert to/from Cartesian state correctly
- [ ] Propagation is deterministic (same initial state + time = same final state)
- [ ] Performance: 500 agents propagate in <16ms per step

**Files**: `apps/web/src/sim/orbit/`, orbital elements types, propagator.

---

## Milestone 5: Agent Rendering
**Status**: ⏳ Pending  
**Goal**: Render N agents as instanced meshes or points for performance. Optional orbit path line for selected agents.

**Acceptance Checks**:
- [ ] 500 agents stable FPS (60fps target)
- [ ] Selection works (click or hover highlights agent)
- [ ] Orbit path visualization for selected agent (optional)
- [ ] Instanced rendering used (not individual meshes)

**Files**: `apps/web/src/render/Agents.tsx`, selection logic, orbit path component.

---

## Milestone 6: Scenario System v1
**Status**: ⏳ Pending  
**Goal**: JSON scenario: Earth params, agent initial conditions, behaviors toggles. Save/load locally.

**Acceptance Checks**:
- [ ] Scenarios reload identically, deterministic playback
- [ ] JSON schema validates
- [ ] Save/load UI works (localStorage or file download)
- [ ] Example scenarios included

**Files**: `apps/web/src/scenario/`, JSON schema, save/load UI.

---

## Milestone 7: Swarm Behavior v1 (Abstract)
**Status**: ⏳ Pending  
**Goal**: Cohesion, separation, alignment in orbital local frame (abstract). "Formation" mode: ring, plane, lattice.

**Acceptance Checks**:
- [ ] Visual reconfiguration visible
- [ ] No collisions (basic)
- [ ] Formation presets work (ring, plane, lattice)
- [ ] Behaviors are abstract (not framed as attack)

**Files**: `apps/web/src/sim/swarm/`, behavior implementations.

---

## Milestone 8: Collision Avoidance + Safety Bubble
**Status**: ⏳ Pending  
**Goal**: Simple predictive avoidance in local frame.

**Acceptance Checks**:
- [ ] Agents maintain minimum separation
- [ ] Avoidance is predictive (not reactive)
- [ ] Performance impact acceptable (<5ms for 500 agents)

**Files**: `apps/web/src/sim/collision/`, avoidance algorithm.

---

## Milestone 9: Task Allocation Mini-Game
**Status**: ⏳ Pending  
**Goal**: Abstract objectives: "inspect points", "relay nodes", "hold formation zones". Score and timer.

**Acceptance Checks**:
- [ ] Visible objectives in scene
- [ ] Agents respond to objectives
- [ ] Score and timer display
- [ ] Objectives are abstract (not weapon-related)

**Files**: `apps/web/src/sim/tasks/`, objective system, scoring.

---

## Milestone 10: Demo Polish
**Status**: ⏳ Pending  
**Goal**: Prebuilt demo scenarios and "one button demo" sequence.

**Acceptance Checks**:
- [ ] "Demo" button plays prebuilt scenario
- [ ] UI auto-hides after 2 seconds
- [ ] Clean 30-60 second clip ready for recording
- [ ] Performance overlay toggle works

**Files**: Demo scenarios, demo mode logic, polish pass.

