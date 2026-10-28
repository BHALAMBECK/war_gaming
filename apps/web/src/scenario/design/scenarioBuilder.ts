/**
 * Build a validated Scenario from a guided wizard draft.
 */

import { EARTH_MU, EARTH_RADIUS } from '@/sim/orbit/constants';
import type { Scenario, ScenarioFidelity } from '@/scenario/types';
import { FormationType } from '@/scenario/types';
import { validateScenario } from '@/scenario/schema';
import {
  DEFAULT_CONSTELLATION_DRAFT,
  generateConstellationAgents,
  type ConstellationDraft,
  type ConstellationPattern,
  type TeamMode,
} from './constellationGenerator';

export type ScenarioTemplate =
  | 'empty'
  | 'single-constellation'
  | 'opposing-fleets';

export interface ScenarioWizardDraft {
  name: string;
  description: string;
  seed: string;
  timeStep: number;
  fidelity: ScenarioFidelity;
  template: ScenarioTemplate;
  /** Primary (friendly) constellation */
  primary: ConstellationDraft;
  /** Used when template === opposing-fleets */
  opposing: ConstellationDraft;
}

export const DEFAULT_SCENARIO_WIZARD: ScenarioWizardDraft = {
  name: 'Custom Scenario',
  description: 'Built with the Scenario Designer',
  seed: 'scenario-designer',
  timeStep: 1,
  fidelity: 0,
  template: 'single-constellation',
  primary: {
    ...DEFAULT_CONSTELLATION_DRAFT,
    idPrefix: 'friendly',
    teamMode: 'all-friendly',
    pattern: 'ring',
    count: 24,
  },
  opposing: {
    ...DEFAULT_CONSTELLATION_DRAFT,
    idPrefix: 'enemy',
    teamMode: 'all-enemy',
    pattern: 'ring',
    count: 24,
    inclinationRad: Math.PI / 3,
    altitudeM: 600e3,
    behaviors: {
      cohesion: true,
      separation: true,
      alignment: true,
      formation: FormationType.NONE,
    },
  },
};

export function previewAgentCount(draft: ScenarioWizardDraft): number {
  if (draft.template === 'empty') return 0;
  const primary = generateConstellationAgents(draft.primary).length;
  if (draft.template === 'opposing-fleets') {
    return primary + generateConstellationAgents(draft.opposing).length;
  }
  return primary;
}

/**
 * Assemble a Scenario from the wizard draft and validate it.
 */
export function buildScenarioFromWizard(
  draft: ScenarioWizardDraft
): Scenario {
  let agents =
    draft.template === 'empty'
      ? []
      : generateConstellationAgents({
          ...draft.primary,
          seed: `${draft.seed}-primary`,
        });

  if (draft.template === 'opposing-fleets') {
    const enemies = generateConstellationAgents({
      ...draft.opposing,
      seed: `${draft.seed}-opposing`,
      teamMode: 'all-enemy',
    });
    agents = [...agents, ...enemies];
  }

  const raw: Scenario = {
    name: draft.name.trim() || 'Untitled Scenario',
    description: draft.description.trim() || 'Scenario Designer export',
    version: '1.0.0',
    earth: {
      radius: EARTH_RADIUS,
      mu: EARTH_MU,
    },
    agents,
    sim: {
      timeStep: Math.max(0.01, draft.timeStep),
      initialTime: 0,
      fidelity: draft.fidelity,
    },
    seed: draft.seed.trim() || 'scenario-designer',
  };

  return validateScenario(raw);
}

/** Helpers for form selects */
export const PATTERN_OPTIONS: { value: ConstellationPattern; label: string }[] =
  [
    { value: 'ring', label: 'Ring (single plane)' },
    { value: 'walker', label: 'Walker delta (multi-plane)' },
    { value: 'shell', label: 'Random shell' },
  ];

export const TEAM_MODE_OPTIONS: { value: TeamMode; label: string }[] = [
  { value: 'all-friendly', label: 'All friendly' },
  { value: 'all-enemy', label: 'All enemy' },
  { value: 'split', label: 'Split half/half' },
  { value: 'alternate', label: 'Alternate teams' },
];

export const TEMPLATE_OPTIONS: {
  value: ScenarioTemplate;
  label: string;
  blurb: string;
}[] = [
  {
    value: 'single-constellation',
    label: 'One constellation',
    blurb: 'Build a single fleet from a constellation pattern.',
  },
  {
    value: 'opposing-fleets',
    label: 'Opposing fleets',
    blurb: 'Friendly constellation vs enemy constellation.',
  },
  {
    value: 'empty',
    label: 'Empty sandbox',
    blurb: 'Metadata + sim settings only (0 sats).',
  },
];
