/**
 * Procedural constellation + hero satellite geometries.
 */

import { BoxGeometry, CylinderGeometry, ConeGeometry } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Mid-detail constellation: bus + panels + dish + thruster. */
export function createConstellationGeometry() {
  const bus = new BoxGeometry(0.014, 0.011, 0.018);
  const panelL = new BoxGeometry(0.034, 0.0022, 0.012);
  panelL.translate(-0.026, 0, 0);
  const panelR = new BoxGeometry(0.034, 0.0022, 0.012);
  panelR.translate(0.026, 0, 0);
  const dish = new CylinderGeometry(0.006, 0.006, 0.0015, 16);
  dish.rotateX(Math.PI / 2);
  dish.translate(0, 0.008, 0.004);
  const antenna = new CylinderGeometry(0.0008, 0.0008, 0.012, 6);
  antenna.translate(0, 0.014, 0);
  const thruster = new ConeGeometry(0.003, 0.006, 8);
  thruster.rotateX(Math.PI);
  thruster.translate(0, 0, -0.012);

  const parts = [bus, panelL, panelR, dish, antenna, thruster];
  const merged = mergeGeometries(parts, false);
  for (const g of parts) g.dispose();
  if (!merged) throw new Error('Failed to merge constellation geometry');
  return merged;
}

/** Higher-detail hero showcase craft. */
export function createHeroGeometry() {
  const bus = new BoxGeometry(0.028, 0.02, 0.036);
  const panelL = new BoxGeometry(0.06, 0.003, 0.022);
  panelL.translate(-0.048, 0, 0);
  const panelR = new BoxGeometry(0.06, 0.003, 0.022);
  panelR.translate(0.048, 0, 0);
  const dish = new CylinderGeometry(0.012, 0.012, 0.0025, 24);
  dish.rotateX(Math.PI / 2);
  dish.translate(0, 0.014, 0.01);
  const antenna = new CylinderGeometry(0.0012, 0.0012, 0.022, 8);
  antenna.translate(0.01, 0.024, 0);
  const thruster = new ConeGeometry(0.005, 0.01, 10);
  thruster.rotateX(Math.PI);
  thruster.translate(0, 0, -0.024);
  const radiator = new BoxGeometry(0.018, 0.0015, 0.028);
  radiator.translate(0, -0.012, 0);

  const parts = [bus, panelL, panelR, dish, antenna, thruster, radiator];
  const merged = mergeGeometries(parts, false);
  for (const g of parts) g.dispose();
  if (!merged) throw new Error('Failed to merge hero geometry');
  return merged;
}

export const TEAM_COLOR_FRIENDLY = '#3b82f6';
export const TEAM_COLOR_ENEMY = '#e10600';
export const TEAM_COLOR_SELECTED = '#fff200';
export const TEAM_COLOR_HOVERED = '#ff6b4a';
export const HERO_ACCENT = '#c4a574';
