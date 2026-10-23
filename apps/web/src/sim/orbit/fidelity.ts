/**
 * Propagation fidelity tiers for the sandbox.
 */

export type FidelityLevel = 0 | 1 | 2;

export const FIDELITY_LABELS: Record<FidelityLevel, string> = {
  0: 'Kepler (2-body)',
  1: 'Kepler + J2',
  2: 'RK4 + J2',
};
