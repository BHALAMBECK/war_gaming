import { describe, it, expect } from 'vitest';
import { accumulateFixedSteps } from './fixedStep';

describe('accumulateFixedSteps', () => {
  it('produces the same step count for uneven frames vs one lump', () => {
    const dt = 1.0;
    let acc = 0;
    let stepsA = 0;
    for (const frame of [0.016, 0.033, 0.05, 0.1, 0.2, 0.4, 0.181]) {
      const r = accumulateFixedSteps(acc, frame, 1, dt);
      stepsA += r.steps;
      acc = r.accumulator;
    }

    const rB = accumulateFixedSteps(0, 0.016 + 0.033 + 0.05 + 0.1 + 0.2 + 0.4 + 0.181, 1, dt);
    expect(stepsA).toBe(rB.steps);
    expect(acc).toBeCloseTo(rB.accumulator, 10);
  });

  it('respects maxSteps cap and keeps leftover', () => {
    const r = accumulateFixedSteps(0, 100, 1, 1, 50);
    expect(r.steps).toBe(50);
    expect(r.accumulator).toBe(50);
  });

  it('scales by timeScale', () => {
    const r = accumulateFixedSteps(0, 0.5, 4, 1);
    expect(r.steps).toBe(2);
    expect(r.accumulator).toBe(0);
  });
});
