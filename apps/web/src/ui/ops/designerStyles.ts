import type { CSSProperties } from 'react';

/** Shared compact inline styles for designer forms (ops theme). */
export const designerField: CSSProperties = {
  width: '100%',
  marginBottom: 6,
  padding: '4px 6px',
  background: 'var(--ops-panel-2)',
  border: '1px solid var(--ops-border)',
  color: 'var(--ops-text)',
  fontSize: 11,
  fontFamily: 'var(--ops-mono)',
};

export const designerRow: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  marginBottom: 8,
};

export const designerHint: CSSProperties = {
  fontSize: 10,
  color: 'var(--ops-muted)',
  marginBottom: 8,
  lineHeight: 1.35,
};
