# Scenario System

## Overview

Scenarios define the initial conditions and rules for a simulation run. They are JSON files that can be saved, loaded, and shared.

## JSON Schema (Placeholder for Milestone 6)

```typescript
interface Scenario {
  // Metadata
  name: string;
  description: string;
  version: string;
  
  // Earth parameters
  earth: {
    radius: number; // meters
    // ... other Earth params
  };
  
  // Agent initial conditions
  agents: Array<{
    id: string;
    // Orbital elements or Cartesian state
    orbit: OrbitalElements | CartesianState;
    // Behavior flags
    behaviors: {
      cohesion: boolean;
      separation: boolean;
      alignment: boolean;
      formation?: FormationType;
    };
  }>;
  
  // Simulation parameters
  sim: {
    timeStep: number; // seconds
    maxTime: number; // seconds
    // ... other sim params
  };
  
  // Seed for deterministic RNG
  seed: string;
}
```

## Example Scenarios (Placeholder)

### Simple Ring Formation
- 50 agents in circular orbit
- Ring formation behavior enabled
- Low Earth Orbit (~400km altitude)

### Large Swarm
- 500 agents in various orbits
- All behaviors enabled
- Collision avoidance active

### Demo Scenario
- Pre-configured for 30-60 second demo
- Optimized visuals
- Auto-plays with UI hidden

## Implementation Notes

- Scenarios stored in `apps/web/src/scenario/`
- JSON schema validation on load
- Save/load via localStorage or file download
- Deterministic playback: same scenario + seed = same run

