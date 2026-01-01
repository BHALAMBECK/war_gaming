/**
 * ManeuverPanel component: allows player to execute delta-v burns on selected satellite.
 * Shows delta-v budget and RTN (Radial, Along-Track, Normal) input fields.
 * 
 * RTN Frame:
 * - Radial (R): Points from Earth center to satellite (outward)
 * - Along-Track (T): Prograde direction (in orbital plane, perpendicular to radial)
 * - Normal (N): Cross-track direction (perpendicular to orbital plane)
 * 
 * Units: All delta-v inputs and budget in meters/second (m/s)
 */

import { useState, useEffect } from 'react';
import { useAgentStore } from '@/ui/stores/agentStore';
import { updateTrajectoryPreview } from '@/render/TrajectoryPreview';

/**
 * ManeuverPanel component for executing delta-v burns.
 * Only visible when a satellite is selected.
 * Positioned on the right side of the screen.
 */
export function ManeuverPanel() {
  const selectedAgent = useAgentStore((state) => state.getSelectedAgent());
  const applyDeltaVToAgent = useAgentStore((state) => state.applyDeltaVToAgent);
  
  // RTN delta-v inputs (in m/s)
  const [radial, setRadial] = useState<string>('0');
  const [alongTrack, setAlongTrack] = useState<string>('0');
  const [normal, setNormal] = useState<string>('0');
  
  // Error message for invalid inputs
  const [error, setError] = useState<string | null>(null);

  // Parse input value (allow empty string for editing)
  const parseInput = (value: string): number => {
    if (value === '' || value === '-') return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  // Format delta-v budget for display
  const formatDeltaV = (dv: number): string => {
    if (dv >= 1000) {
      return `${(dv / 1000).toFixed(2)} km/s`;
    }
    return `${dv.toFixed(1)} m/s`;
  };

  // Reset inputs when selection changes
  useEffect(() => {
    setRadial('0');
    setAlongTrack('0');
    setNormal('0');
    setError(null);
    updateTrajectoryPreview([0, 0, 0]);
  }, [selectedAgent?.id]);

  // Update trajectory preview when RTN inputs change
  useEffect(() => {
    const rtnVector: [number, number, number] = [
      parseInput(radial),
      parseInput(alongTrack),
      parseInput(normal),
    ];
    updateTrajectoryPreview(rtnVector);
  }, [radial, alongTrack, normal]);

  // Don't render if no agent is selected
  if (!selectedAgent) return null;

  const dvRemaining = selectedAgent.dvRemaining;

  // Calculate total delta-v magnitude from inputs (using helper function defined above)
  const currentRtnVector: [number, number, number] = [
    parseInput(radial),
    parseInput(alongTrack),
    parseInput(normal),
  ];
  const dvMagnitude = Math.sqrt(
    currentRtnVector[0] * currentRtnVector[0] +
    currentRtnVector[1] * currentRtnVector[1] +
    currentRtnVector[2] * currentRtnVector[2]
  );

  // Check if burn is valid
  const isValidInput = 
    radial !== '' &&
    alongTrack !== '' &&
    normal !== '' &&
    !isNaN(parseFloat(radial)) &&
    !isNaN(parseFloat(alongTrack)) &&
    !isNaN(parseFloat(normal)) &&
    dvMagnitude > 0 &&
    dvMagnitude <= dvRemaining;

  // Handle Execute Burn button click
  const handleExecuteBurn = () => {
    if (!isValidInput) {
      setError('Invalid delta-v values');
      return;
    }

    try {
      setError(null);
      applyDeltaVToAgent(selectedAgent.id, currentRtnVector);
      // Reset inputs after successful burn
      setRadial('0');
      setAlongTrack('0');
      setNormal('0');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to execute burn';
      setError(message);
    }
  };

  return (
    <div style={panelStyle}>
      <div style={titleStyle}>Maneuver Planner</div>
      
      <div style={rowStyle}>
        <div style={labelStyle}>Δv Remaining:</div>
        <div style={valueStyle}>{formatDeltaV(dvRemaining)}</div>
      </div>

      <div style={dividerStyle} />

      <div style={inputGroupStyle}>
        <label style={inputLabelStyle}>
          Radial (m/s)
          <input
            type="number"
            value={radial}
            onChange={(e) => setRadial(e.target.value)}
            style={inputStyle}
            step="0.1"
          />
        </label>

        <label style={inputLabelStyle}>
          Along-Track (m/s)
          <input
            type="number"
            value={alongTrack}
            onChange={(e) => setAlongTrack(e.target.value)}
            style={inputStyle}
            step="0.1"
          />
        </label>

        <label style={inputLabelStyle}>
          Normal (m/s)
          <input
            type="number"
            value={normal}
            onChange={(e) => setNormal(e.target.value)}
            style={inputStyle}
            step="0.1"
          />
        </label>
      </div>

      {dvMagnitude > 0 && (
        <div style={infoStyle}>
          Total Δv: {formatDeltaV(dvMagnitude)}
        </div>
      )}

      {error && (
        <div style={errorStyle}>{error}</div>
      )}

      <button
        onClick={handleExecuteBurn}
        disabled={!isValidInput}
        style={{
          ...buttonStyle,
          ...(!isValidInput ? disabledButtonStyle : {}),
        }}
      >
        Execute Burn
      </button>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: '360px', // Positioned below TimeControlPanel
  right: '20px',
  background: 'rgba(0, 0, 0, 0.85)',
  padding: '16px 20px',
  borderRadius: '12px',
  color: '#fff',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: '14px',
  minWidth: '250px',
  maxWidth: '300px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  zIndex: 1000,
};

const titleStyle: React.CSSProperties = {
  margin: '0 0 12px 0',
  fontSize: '16px',
  fontWeight: 700,
  letterSpacing: '0.5px',
  color: '#fff',
  textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '12px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 500,
  color: 'rgba(255, 255, 255, 0.7)',
  letterSpacing: '0.3px',
};

const valueStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  fontFamily: 'monospace',
  color: '#fff',
  textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
};

const dividerStyle: React.CSSProperties = {
  height: '1px',
  background: 'rgba(255, 255, 255, 0.1)',
  margin: '12px 0',
};

const inputGroupStyle: React.CSSProperties = {
  marginBottom: '12px',
};

const inputLabelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '12px',
  fontWeight: 500,
  color: 'rgba(255, 255, 255, 0.85)',
  letterSpacing: '0.3px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  marginBottom: '12px',
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '14px',
  fontFamily: 'monospace',
  boxSizing: 'border-box',
  transition: 'all 0.2s ease',
};

const infoStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'rgba(255, 255, 255, 0.6)',
  marginBottom: '8px',
  textAlign: 'center',
  fontFamily: 'monospace',
};

const errorStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#ff6b6b',
  marginBottom: '8px',
  padding: '6px 8px',
  background: 'rgba(255, 107, 107, 0.1)',
  border: '1px solid rgba(255, 107, 107, 0.3)',
  borderRadius: '6px',
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  background: 'rgba(100, 150, 255, 0.2)',
  border: '1px solid rgba(100, 150, 255, 0.4)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
};

const disabledButtonStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.05)',
  borderColor: 'rgba(255, 255, 255, 0.1)',
  color: 'rgba(255, 255, 255, 0.3)',
  cursor: 'not-allowed',
};
