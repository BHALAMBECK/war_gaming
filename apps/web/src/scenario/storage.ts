/**
 * LocalStorage persistence for scenarios.
 */

import { Scenario } from './types';
import { validateScenario } from './schema';
import { scenarioToJSON } from './saver';

const STORAGE_PREFIX = 'oswv-scenario-';

/**
 * Generate storage key from scenario name.
 */
function getStorageKey(scenarioName: string): string {
  return `${STORAGE_PREFIX}${scenarioName}`;
}

/**
 * Extract scenario name from storage key.
 */
function getNameFromKey(key: string): string {
  return key.replace(STORAGE_PREFIX, '');
}

/**
 * Save scenario to localStorage.
 * 
 * @param scenario Scenario to save
 * @param key Optional custom key (defaults to scenario name)
 */
export function saveToLocalStorage(scenario: Scenario, key?: string): void {
  const storageKey = key ? `${STORAGE_PREFIX}${key}` : getStorageKey(scenario.name);
  const json = scenarioToJSON(scenario, false); // Compact JSON for storage
  
  try {
    localStorage.setItem(storageKey, json);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      throw new Error('LocalStorage quota exceeded. Cannot save scenario.');
    }
    throw error;
  }
}

/**
 * Load scenario from localStorage.
 * 
 * @param key Storage key or scenario name
 * @returns Loaded scenario or null if not found
 * @throws Error if scenario is invalid
 */
export function loadFromLocalStorage(key: string): Scenario | null {
  const storageKey = key.startsWith(STORAGE_PREFIX) ? key : getStorageKey(key);
  const json = localStorage.getItem(storageKey);
  
  if (!json) {
    return null;
  }
  
  try {
    const data = JSON.parse(json);
    return validateScenario(data);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load scenario from localStorage: ${error.message}`);
    }
    throw error;
  }
}

/**
 * List all saved scenario names from localStorage.
 * 
 * @returns Array of scenario names
 */
export function listLocalStorageScenarios(): string[] {
  const scenarios: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX)) {
      const name = getNameFromKey(key);
      scenarios.push(name);
    }
  }
  
  return scenarios.sort();
}

/**
 * Delete scenario from localStorage.
 * 
 * @param key Storage key or scenario name
 */
export function deleteFromLocalStorage(key: string): void {
  const storageKey = key.startsWith(STORAGE_PREFIX) ? key : getStorageKey(key);
  localStorage.removeItem(storageKey);
}

/**
 * Check if a scenario exists in localStorage.
 * 
 * @param key Storage key or scenario name
 * @returns True if scenario exists
 */
export function hasScenarioInLocalStorage(key: string): boolean {
  const storageKey = key.startsWith(STORAGE_PREFIX) ? key : getStorageKey(key);
  return localStorage.getItem(storageKey) !== null;
}
