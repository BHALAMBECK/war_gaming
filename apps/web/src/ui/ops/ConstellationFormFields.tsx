import type { CSSProperties } from 'react';
import type { ConstellationDraft } from '@/scenario/design/constellationGenerator';
import { constellationAgentCount } from '@/scenario/design/constellationGenerator';
import {
  PATTERN_OPTIONS,
  TEAM_MODE_OPTIONS,
} from '@/scenario/design/scenarioBuilder';
import { FormationType } from '@/scenario/types';
import { designerField, designerRow } from './designerStyles';

interface ConstellationFormFieldsProps {
  value: ConstellationDraft;
  onChange: (next: ConstellationDraft) => void;
  title?: string;
}

function deg(rad: number) {
  return (rad * 180) / Math.PI;
}

function toRad(degVal: number) {
  return (degVal * Math.PI) / 180;
}

const countStyle: CSSProperties = {
  fontSize: 10,
  color: 'var(--ops-warn)',
  marginBottom: 8,
  fontFamily: 'var(--ops-mono)',
};

export function ConstellationFormFields({
  value,
  onChange,
  title,
}: ConstellationFormFieldsProps) {
  const patch = (partial: Partial<ConstellationDraft>) =>
    onChange({ ...value, ...partial });

  const count = constellationAgentCount(value);

  return (
    <div>
      {title && <div className="ops-section-title">{title}</div>}
      <div style={countStyle}>
        Preview: {count} satellite{count === 1 ? '' : 's'}
      </div>

      <label style={designerRow}>
        <span className="ops-label">Pattern</span>
        <select
          style={designerField}
          value={value.pattern}
          onChange={(e) =>
            patch({
              pattern: e.target.value as ConstellationDraft['pattern'],
              behaviors: {
                ...value.behaviors,
                formation:
                  e.target.value === 'ring'
                    ? FormationType.RING
                    : FormationType.NONE,
              },
            })
          }
        >
          {PATTERN_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      {value.pattern === 'walker' ? (
        <>
          <label style={designerRow}>
            <span className="ops-label">Planes</span>
            <input
              style={designerField}
              type="number"
              min={1}
              max={48}
              value={value.planes}
              onChange={(e) => patch({ planes: Number(e.target.value) })}
            />
          </label>
          <label style={designerRow}>
            <span className="ops-label">Sats per plane</span>
            <input
              style={designerField}
              type="number"
              min={1}
              max={200}
              value={value.satsPerPlane}
              onChange={(e) => patch({ satsPerPlane: Number(e.target.value) })}
            />
          </label>
          <label style={designerRow}>
            <span className="ops-label">Phase factor F</span>
            <input
              style={designerField}
              type="number"
              min={0}
              max={64}
              value={value.phaseFactor}
              onChange={(e) => patch({ phaseFactor: Number(e.target.value) })}
            />
          </label>
        </>
      ) : (
        <label style={designerRow}>
          <span className="ops-label">Satellite count</span>
          <input
            style={designerField}
            type="number"
            min={1}
            max={2000}
            value={value.count}
            onChange={(e) => patch({ count: Number(e.target.value) })}
          />
        </label>
      )}

      <label style={designerRow}>
        <span className="ops-label">Altitude (km)</span>
        <input
          style={designerField}
          type="number"
          min={200}
          max={40000}
          step={10}
          value={Math.round(value.altitudeM / 1000)}
          onChange={(e) => patch({ altitudeM: Number(e.target.value) * 1000 })}
        />
      </label>

      {value.pattern === 'shell' && (
        <label style={designerRow}>
          <span className="ops-label">Shell spread ± (km)</span>
          <input
            style={designerField}
            type="number"
            min={0}
            max={2000}
            value={Math.round(value.shellSpreadM / 1000)}
            onChange={(e) =>
              patch({ shellSpreadM: Number(e.target.value) * 1000 })
            }
          />
        </label>
      )}

      <label style={designerRow}>
        <span className="ops-label">Inclination (deg)</span>
        <input
          style={designerField}
          type="number"
          min={0}
          max={180}
          step={1}
          value={Math.round(deg(value.inclinationRad) * 10) / 10}
          onChange={(e) =>
            patch({ inclinationRad: toRad(Number(e.target.value)) })
          }
        />
      </label>

      <label style={designerRow}>
        <span className="ops-label">Eccentricity</span>
        <input
          style={designerField}
          type="number"
          min={0}
          max={0.9}
          step={0.01}
          value={value.eccentricity}
          onChange={(e) => patch({ eccentricity: Number(e.target.value) })}
        />
      </label>

      <label style={designerRow}>
        <span className="ops-label">Teams</span>
        <select
          style={designerField}
          value={value.teamMode}
          onChange={(e) =>
            patch({
              teamMode: e.target.value as ConstellationDraft['teamMode'],
            })
          }
        >
          {TEAM_MODE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label style={designerRow}>
        <span className="ops-label">Id prefix</span>
        <input
          style={designerField}
          type="text"
          value={value.idPrefix}
          onChange={(e) => patch({ idPrefix: e.target.value || 'sat' })}
        />
      </label>

      <div className="ops-label" style={{ marginBottom: 4 }}>
        Behaviors
      </div>
      <div
        className="ops-btn-group"
        style={{ marginBottom: 8, flexWrap: 'wrap' }}
      >
        {(['cohesion', 'separation', 'alignment'] as const).map((key) => (
          <button
            key={key}
            type="button"
            className={`ops-btn ${value.behaviors[key] ? 'active' : ''}`}
            onClick={() =>
              patch({
                behaviors: {
                  ...value.behaviors,
                  [key]: !value.behaviors[key],
                },
              })
            }
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  );
}
