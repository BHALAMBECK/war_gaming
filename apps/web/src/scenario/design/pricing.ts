/**
 * Programmatic cost quotes for satellites and constellations (design-time).
 */

import {
  getLaunchVehicle,
  type LaunchVehicleId,
} from './satelliteCatalog';
import {
  resolveBillOfMaterials,
  type SatelliteDraft,
} from './satelliteBuilder';

export interface LaunchQuote {
  vehicleId: LaunchVehicleId;
  vehicleLabel: string;
  massKg: number;
  launchCostUsd: number;
  note: string;
}

export interface ProgramQuote {
  satelliteCount: number;
  unitBusCostUsd: number;
  fleetHardwareUsd: number;
  launch: LaunchQuote;
  /** Single launch slot assumption for small fleets; scales with ceil mass slots */
  launchSlots: number;
  totalProgramUsd: number;
  costPerSatUsd: number;
  dryMassKgPerSat: number;
}

export interface QuoteLineItem {
  label: string;
  amountUsd: number;
  detail?: string;
}

function launchCostForMass(
  vehicleId: LaunchVehicleId,
  totalMassKg: number
): { costUsd: number; slots: number; note: string } {
  const vehicle = getLaunchVehicle(vehicleId);
  const slots = Math.max(1, Math.ceil(totalMassKg / vehicle.maxMassKg));
  const massPerSlot = totalMassKg / slots;
  const perSlot = Math.max(
    vehicle.minCostUsd,
    massPerSlot * vehicle.costPerKgUsd
  );
  const costUsd = perSlot * slots;
  const note =
    slots === 1
      ? `Single manifest · ${totalMassKg.toFixed(1)} kg`
      : `${slots} manifests · ~${massPerSlot.toFixed(1)} kg each`;
  return { costUsd, slots, note };
}

/** Rideshare discount when launching many identical sats on one vehicle class */
function constellationLaunchMultiplier(satelliteCount: number): number {
  if (satelliteCount >= 48) return 0.82;
  if (satelliteCount >= 24) return 0.88;
  if (satelliteCount >= 12) return 0.93;
  return 1;
}

export function quoteProgram(
  draft: SatelliteDraft,
  satelliteCount: number
): ProgramQuote {
  const count = Math.max(1, Math.floor(satelliteCount));
  const bom = resolveBillOfMaterials(draft);
  const fleetHardwareUsd = bom.unitBusCostUsd * count;
  const totalMassKg = bom.dryMassKg * count;
  const launchBase = launchCostForMass(draft.launchVehicle, totalMassKg);
  const multiplier = constellationLaunchMultiplier(count);
  const launchCostUsd = launchBase.costUsd * multiplier;
  const totalProgramUsd = fleetHardwareUsd + launchCostUsd;

  const vehicle = getLaunchVehicle(draft.launchVehicle);

  return {
    satelliteCount: count,
    unitBusCostUsd: bom.unitBusCostUsd,
    fleetHardwareUsd,
    launch: {
      vehicleId: draft.launchVehicle,
      vehicleLabel: vehicle.label,
      massKg: totalMassKg,
      launchCostUsd,
      note: `${launchBase.note}${multiplier < 1 ? ` · ${Math.round((1 - multiplier) * 100)}% constellation discount` : ''}`,
    },
    launchSlots: launchBase.slots,
    totalProgramUsd,
    costPerSatUsd: totalProgramUsd / count,
    dryMassKgPerSat: bom.dryMassKg,
  };
}

export function formatUsd(n: number): string {
  if (n >= 1_000_000_000) {
    return `$${(n / 1_000_000_000).toFixed(2)}B`;
  }
  if (n >= 1_000_000) {
    return `$${(n / 1_000_000).toFixed(2)}M`;
  }
  if (n >= 1_000) {
    return `$${(n / 1_000).toFixed(0)}k`;
  }
  return `$${n.toFixed(0)}`;
}

export function quoteLineItems(quote: ProgramQuote): QuoteLineItem[] {
  return [
    {
      label: 'Bus hardware + integration (fleet)',
      amountUsd: quote.fleetHardwareUsd,
      detail: `${quote.satelliteCount} × ${formatUsd(quote.unitBusCostUsd)}`,
    },
    {
      label: `Launch (${quote.launch.vehicleLabel})`,
      amountUsd: quote.launch.launchCostUsd,
      detail: quote.launch.note,
    },
    {
      label: 'Total program',
      amountUsd: quote.totalProgramUsd,
      detail: `${formatUsd(quote.costPerSatUsd)} per sat`,
    },
  ];
}
