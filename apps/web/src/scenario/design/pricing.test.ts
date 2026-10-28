import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SATELLITE_DRAFT,
  resolveBillOfMaterials,
} from './satelliteBuilder';
import { quoteProgram, formatUsd } from './pricing';

describe('satelliteBuilder', () => {
  it('resolves profile defaults with mass and cost', () => {
    const bom = resolveBillOfMaterials(DEFAULT_SATELLITE_DRAFT);
    expect(bom.lines.length).toBeGreaterThan(3);
    expect(bom.dryMassKg).toBeGreaterThan(5);
    expect(bom.unitBusCostUsd).toBeGreaterThan(bom.hardwareCostUsd);
  });

  it('custom profile includes selected reaction wheels', () => {
    const bom = resolveBillOfMaterials({
      ...DEFAULT_SATELLITE_DRAFT,
      customizeComponents: true,
      profile: 'custom',
      components: {
        'bus-structure': 1,
        'rw-medium': 4,
        'star-tracker': 1,
        'battery': 1,
        'solar-array': 1,
        'eps': 1,
        's-band-radio': 1,
      },
    });
    const rw = bom.lines.find((l) => l.id === 'rw-medium');
    expect(rw?.quantity).toBe(4);
  });
});

describe('pricing', () => {
  it('quotes fleet with launch included', () => {
    const q = quoteProgram(DEFAULT_SATELLITE_DRAFT, 24);
    expect(q.totalProgramUsd).toBeGreaterThan(q.fleetHardwareUsd);
    expect(q.launch.launchCostUsd).toBeGreaterThan(0);
    expect(q.costPerSatUsd).toBeLessThan(q.totalProgramUsd);
  });

  it('applies constellation discount for large fleets', () => {
    const small = quoteProgram(DEFAULT_SATELLITE_DRAFT, 6);
    const large = quoteProgram(DEFAULT_SATELLITE_DRAFT, 48);
    const smallPerKgLaunch = small.launch.launchCostUsd / small.launch.massKg;
    const largePerKgLaunch = large.launch.launchCostUsd / large.launch.massKg;
    expect(largePerKgLaunch).toBeLessThan(smallPerKgLaunch);
  });

  it('formats currency', () => {
    expect(formatUsd(1_500_000)).toBe('$1.50M');
  });
});
