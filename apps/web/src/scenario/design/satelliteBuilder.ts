/**
 * Satellite bus draft: high-level profile with optional component overrides.
 */

import {
  getComponent,
  getProfile,
  type LaunchVehicleId,
  type SatelliteProfileId,
} from './satelliteCatalog';

export interface SatelliteDraft {
  name: string;
  profile: SatelliteProfileId;
  /** When true, user edits component quantities; otherwise profile defaults apply */
  customizeComponents: boolean;
  /** Component id → quantity (merged with profile when not customizing) */
  components: Record<string, number>;
  launchVehicle: LaunchVehicleId;
  /** Integration & test margin on hardware (0–50 typical) */
  integrationMarginPct: number;
}

export const DEFAULT_SATELLITE_DRAFT: SatelliteDraft = {
  name: 'Fleet bus',
  profile: 'scout',
  customizeComponents: false,
  components: {},
  launchVehicle: 'falcon9-rideshare',
  integrationMarginPct: 12,
};

export interface ResolvedBillOfMaterials {
  lines: Array<{
    id: string;
    name: string;
    quantity: number;
    massKg: number;
    unitCostUsd: number;
    extendedCostUsd: number;
  }>;
  dryMassKg: number;
  hardwareCostUsd: number;
  integrationCostUsd: number;
  unitBusCostUsd: number;
  peakPowerW: number;
  summary: string;
}

function effectiveComponents(draft: SatelliteDraft): Record<string, number> {
  const profile = getProfile(draft.profile);
  const base = draft.customizeComponents
    ? { ...profile.defaults, ...draft.components }
    : { ...profile.defaults };
  const out: Record<string, number> = {};
  for (const [id, qty] of Object.entries(base)) {
    if (qty > 0) out[id] = qty;
  }
  return out;
}

export function resolveBillOfMaterials(
  draft: SatelliteDraft
): ResolvedBillOfMaterials {
  const components = effectiveComponents(draft);
  const lines: ResolvedBillOfMaterials['lines'] = [];
  let dryMassKg = 0;
  let hardwareCostUsd = 0;
  let peakPowerW = 0;

  for (const [id, quantity] of Object.entries(components)) {
    const part = getComponent(id);
    if (!part || quantity <= 0) continue;
    const massKg = part.massKg * quantity;
    const extendedCostUsd = part.unitCostUsd * quantity;
    dryMassKg += massKg;
    hardwareCostUsd += extendedCostUsd;
    if (part.powerW && part.powerW > 0) {
      peakPowerW += part.powerW * quantity;
    }
    lines.push({
      id,
      name: part.name,
      quantity,
      massKg,
      unitCostUsd: part.unitCostUsd,
      extendedCostUsd,
    });
  }

  lines.sort((a, b) => b.extendedCostUsd - a.extendedCostUsd);

  const integrationCostUsd =
    hardwareCostUsd * (draft.integrationMarginPct / 100);
  const unitBusCostUsd = hardwareCostUsd + integrationCostUsd;
  const profile = getProfile(draft.profile);
  const summary = `${profile.label} · ${dryMassKg.toFixed(1)} kg dry · ${peakPowerW} W peak`;

  return {
    lines,
    dryMassKg,
    hardwareCostUsd,
    integrationCostUsd,
    unitBusCostUsd,
    peakPowerW,
    summary,
  };
}

export function patchComponentsFromProfile(
  draft: SatelliteDraft,
  profile: SatelliteProfileId
): SatelliteDraft {
  const defaults = getProfile(profile).defaults;
  return {
    ...draft,
    profile,
    components: draft.customizeComponents ? { ...defaults } : {},
  };
}

export function agentBusMetadata(draft: SatelliteDraft): {
  profile: SatelliteProfileId;
  name: string;
  dryMassKg: number;
  unitBusCostUsd: number;
  summary: string;
} {
  const bom = resolveBillOfMaterials(draft);
  return {
    profile: draft.profile,
    name: draft.name,
    dryMassKg: bom.dryMassKg,
    unitBusCostUsd: bom.unitBusCostUsd,
    summary: bom.summary,
  };
}
