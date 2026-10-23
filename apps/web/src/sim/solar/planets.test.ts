import { describe, it, expect } from 'vitest';
import { PLANETS, planetPositionAu } from './planets';

describe('solar planets', () => {
  it('places Earth near 1 AU', () => {
    const earth = PLANETS.find((p) => p.id === 'earth')!;
    const [x, y, z] = planetPositionAu(earth, 0);
    const r = Math.hypot(x, y, z);
    expect(r).toBeGreaterThan(0.9);
    expect(r).toBeLessThan(1.1);
  });

  it('advances Neptune farther out than Mercury', () => {
    const mercury = PLANETS.find((p) => p.id === 'mercury')!;
    const neptune = PLANETS.find((p) => p.id === 'neptune')!;
    const rm = Math.hypot(...planetPositionAu(mercury, 0));
    const rn = Math.hypot(...planetPositionAu(neptune, 0));
    expect(rn).toBeGreaterThan(rm);
  });
});
