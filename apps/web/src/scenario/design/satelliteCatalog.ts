/**
 * Catalog of satellite bus components and launch vehicles for design-time quoting.
 * Values are illustrative research placeholders, not vendor quotes.
 */

export type ComponentCategory =
  | 'adcs'
  | 'power'
  | 'comms'
  | 'propulsion'
  | 'payload'
  | 'structure';

export interface CatalogComponent {
  id: string;
  name: string;
  category: ComponentCategory;
  description: string;
  massKg: number;
  /** Hardware cost in USD (2026 placeholder) */
  unitCostUsd: number;
  powerW?: number;
}

export type SatelliteProfileId =
  | 'scout'
  | 'imaging'
  | 'comms'
  | 'defense'
  | 'custom';

export interface SatelliteProfile {
  id: SatelliteProfileId;
  label: string;
  blurb: string;
  /** Default component id → quantity for this profile */
  defaults: Record<string, number>;
}

export type LaunchVehicleId =
  | 'falcon9-rideshare'
  | 'electron'
  | 'ariane6'
  | 'custom-lv';

export interface LaunchVehicle {
  id: LaunchVehicleId;
  label: string;
  /** USD per kg to reference orbit (placeholder) */
  costPerKgUsd: number;
  /** Minimum invoice USD */
  minCostUsd: number;
  /** Max manifest mass per slot (kg) */
  maxMassKg: number;
}

export const COMPONENT_CATALOG: CatalogComponent[] = [
  {
    id: 'rw-small',
    name: 'Reaction wheel (4 N·m·s)',
    category: 'adcs',
    description: 'Small sat momentum storage',
    massKg: 1.2,
    unitCostUsd: 85_000,
    powerW: 8,
  },
  {
    id: 'rw-medium',
    name: 'Reaction wheel (15 N·m·s)',
    category: 'adcs',
    description: 'Medium torque wheels for agile buses',
    massKg: 2.8,
    unitCostUsd: 210_000,
    powerW: 15,
  },
  {
    id: 'star-tracker',
    name: 'Star tracker',
    category: 'adcs',
    description: 'Arc-second class attitude sensing',
    massKg: 0.9,
    unitCostUsd: 120_000,
    powerW: 5,
  },
  {
    id: 'magnetorquer',
    name: 'Magnetorquer rod set',
    category: 'adcs',
    description: 'Detumble / momentum dump assist',
    massKg: 0.6,
    unitCostUsd: 35_000,
    powerW: 2,
  },
  {
    id: 'battery',
    name: 'Li-ion battery module',
    category: 'power',
    description: '400 Wh class storage',
    massKg: 3.5,
    unitCostUsd: 45_000,
    powerW: 0,
  },
  {
    id: 'solar-array',
    name: 'Deployable solar array',
    category: 'power',
    description: '300 W peak at 1 AU',
    massKg: 4.2,
    unitCostUsd: 95_000,
    powerW: -300,
  },
  {
    id: 'eps',
    name: 'Electrical power system',
    category: 'power',
    description: 'PPT + regulation',
    massKg: 1.8,
    unitCostUsd: 55_000,
    powerW: 0,
  },
  {
    id: 's-band-radio',
    name: 'S-band transceiver',
    category: 'comms',
    description: 'TT&C + moderate downlink',
    massKg: 1.5,
    unitCostUsd: 75_000,
    powerW: 12,
  },
  {
    id: 'lasercom',
    name: 'Optical downlink terminal',
    category: 'comms',
    description: 'High-rate lasercom aperture',
    massKg: 2.2,
    unitCostUsd: 380_000,
    powerW: 25,
  },
  {
    id: 'hydrazine-thruster',
    name: 'Monoprop thruster module',
    category: 'propulsion',
    description: 'Δv kit with 200 m/s class tank',
    massKg: 5.5,
    unitCostUsd: 140_000,
    powerW: 3,
  },
  {
    id: 'electric-prop',
    name: 'Hall effect EP module',
    category: 'propulsion',
    description: 'High Isp, low thrust',
    massKg: 8.0,
    unitCostUsd: 320_000,
    powerW: 180,
  },
  {
    id: 'camera-payload',
    name: 'Multispectral imager',
    category: 'payload',
    description: 'Earth observation payload',
    massKg: 6.0,
    unitCostUsd: 450_000,
    powerW: 40,
  },
  {
    id: 'rf-payload',
    name: 'Ka-band payload processor',
    category: 'payload',
    description: 'Bent-pipe / regenerative comms',
    massKg: 4.5,
    unitCostUsd: 520_000,
    powerW: 55,
  },
  {
    id: 'laser-weapon-payload',
    name: 'Directed-energy module',
    category: 'payload',
    description: 'Research sandbox laser package',
    massKg: 12.0,
    unitCostUsd: 890_000,
    powerW: 200,
  },
  {
    id: 'bus-structure',
    name: 'Bus structure + thermal',
    category: 'structure',
    description: 'Frame, MLI, radiators',
    massKg: 8.0,
    unitCostUsd: 110_000,
    powerW: 0,
  },
];

export const SATELLITE_PROFILES: SatelliteProfile[] = [
  {
    id: 'scout',
    label: 'Scout bus',
    blurb: 'Minimal ADCS + comms for swarm nodes',
    defaults: {
      'bus-structure': 1,
      'rw-small': 3,
      'star-tracker': 1,
      'magnetorquer': 1,
      'battery': 1,
      'solar-array': 1,
      'eps': 1,
      's-band-radio': 1,
    },
  },
  {
    id: 'imaging',
    label: 'Imaging bus',
    blurb: 'Stable pointing + EO payload',
    defaults: {
      'bus-structure': 1,
      'rw-medium': 4,
      'star-tracker': 2,
      'magnetorquer': 1,
      'battery': 2,
      'solar-array': 2,
      'eps': 1,
      's-band-radio': 1,
      'camera-payload': 1,
      'hydrazine-thruster': 1,
    },
  },
  {
    id: 'comms',
    label: 'Comms relay',
    blurb: 'Power-heavy relay with optical downlink option',
    defaults: {
      'bus-structure': 1,
      'rw-medium': 3,
      'star-tracker': 1,
      'battery': 2,
      'solar-array': 3,
      'eps': 1,
      's-band-radio': 1,
      'lasercom': 1,
      'rf-payload': 1,
    },
  },
  {
    id: 'defense',
    label: 'Defense research',
    blurb: 'Maneuver + sensor + directed energy package',
    defaults: {
      'bus-structure': 1,
      'rw-medium': 4,
      'star-tracker': 2,
      'magnetorquer': 1,
      'battery': 3,
      'solar-array': 3,
      'eps': 1,
      's-band-radio': 1,
      'hydrazine-thruster': 1,
      'laser-weapon-payload': 1,
    },
  },
  {
    id: 'custom',
    label: 'Custom (pick parts)',
    blurb: 'Start from an empty bill of materials',
    defaults: {
      'bus-structure': 1,
      'rw-small': 1,
      'star-tracker': 1,
      'battery': 1,
      'solar-array': 1,
      'eps': 1,
      's-band-radio': 1,
    },
  },
];

export const LAUNCH_VEHICLES: LaunchVehicle[] = [
  {
    id: 'falcon9-rideshare',
    label: 'Falcon 9 rideshare (LEO)',
    costPerKgUsd: 5_500,
    minCostUsd: 275_000,
    maxMassKg: 200,
  },
  {
    id: 'electron',
    label: 'Electron dedicated',
    costPerKgUsd: 18_000,
    minCostUsd: 7_500_000,
    maxMassKg: 300,
  },
  {
    id: 'ariane6',
    label: 'Ariane 6 rideshare',
    costPerKgUsd: 8_200,
    minCostUsd: 450_000,
    maxMassKg: 150,
  },
  {
    id: 'custom-lv',
    label: 'Custom / TBD vehicle',
    costPerKgUsd: 10_000,
    minCostUsd: 500_000,
    maxMassKg: 500,
  },
];

const catalogById = new Map(COMPONENT_CATALOG.map((c) => [c.id, c]));

export function getComponent(id: string): CatalogComponent | undefined {
  return catalogById.get(id);
}

export function getProfile(id: SatelliteProfileId): SatelliteProfile {
  return (
    SATELLITE_PROFILES.find((p) => p.id === id) ??
    SATELLITE_PROFILES[0]
  );
}

export function getLaunchVehicle(id: LaunchVehicleId): LaunchVehicle {
  return (
    LAUNCH_VEHICLES.find((v) => v.id === id) ?? LAUNCH_VEHICLES[0]
  );
}

export const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  adcs: 'ADCS',
  power: 'Power',
  comms: 'Comms',
  propulsion: 'Propulsion',
  payload: 'Payload',
  structure: 'Structure',
};
