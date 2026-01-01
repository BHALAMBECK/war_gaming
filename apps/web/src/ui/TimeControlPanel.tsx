import { useState } from 'react';
import { useSimClockStore } from '@/ui/stores/simClockStore';
import { ScenarioSection } from './ScenarioSection';

export function TimeControlPanel() {
  const {
    paused,
    timeScale,
    seed,
    toggle,
    setTimeScale,
    setSeed,
    step,
    reset,
    formatTime,
  } = useSimClockStore();
  
  const [scenariosExpanded, setScenariosExpanded] = useState(false);

  return (
    <>
      <style>{`
        .time-control-button:hover {
          background: rgba(255, 255, 255, 0.15) !important;
          border-color: rgba(255, 255, 255, 0.3) !important;
          transform: translateY(-1px);
        }
        .time-control-button.danger:hover {
          background: rgba(255, 100, 100, 0.3) !important;
          border-color: rgba(255, 100, 100, 0.5) !important;
        }
        .time-control-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          outline: none;
        }
        .time-control-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          background: rgba(100, 150, 255, 0.8);
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s;
        }
        .time-control-slider::-webkit-slider-thumb:hover {
          background: rgba(100, 150, 255, 1);
          transform: scale(1.1);
        }
        .time-control-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: rgba(100, 150, 255, 0.8);
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s;
        }
        .time-control-slider::-moz-range-thumb:hover {
          background: rgba(100, 150, 255, 1);
          transform: scale(1.1);
        }
        .time-control-input:focus {
          outline: none;
          border-color: rgba(100, 150, 255, 0.5);
          background: rgba(255, 255, 255, 0.12);
        }
        .scenarios-header:hover {
          background: rgba(255, 255, 255, 0.1) !important;
        }
        .time-control-panel::-webkit-scrollbar {
          width: 8px;
        }
        .time-control-panel::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        .time-control-panel::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }
        .time-control-panel::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.4);
        }
      `}</style>
      <div className="time-control-panel" style={panelStyle}>
        <h3 style={titleStyle}>Time Control</h3>
        
        {/* Play/Pause button */}
        <button onClick={toggle} className="time-control-button" style={buttonStyle}>
          {paused ? '▶ Play' : '⏸ Pause'}
        </button>

        {/* Time scale slider */}
        <div style={controlGroupStyle}>
          <label style={labelStyle}>
            Time Scale: {timeScale.toFixed(1)}x
          </label>
          <input
            type="range"
            min="0.1"
            max="100"
            step="0.1"
            value={timeScale}
            onChange={(e) => setTimeScale(parseFloat(e.target.value))}
            className="time-control-slider"
            style={sliderStyle}
          />
        </div>

        {/* Single step button (only when paused) */}
        {paused && (
          <button onClick={step} className="time-control-button" style={buttonStyle}>
            Step (+1s)
          </button>
        )}

        {/* Current time display */}
        <div style={timeDisplayStyle}>
          <div style={timeLabelStyle}>Sim Time:</div>
          <div style={timeValueStyle}>{formatTime()}</div>
        </div>

        {/* Seed input */}
        <div style={controlGroupStyle}>
          <label style={labelStyle}>Seed:</label>
          <input
            type="text"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            className="time-control-input"
            style={inputStyle}
            placeholder="Enter seed..."
          />
        </div>

        {/* Reset button */}
        <button onClick={reset} className="time-control-button danger" style={{ ...buttonStyle, ...dangerButtonStyle }}>
          Reset
        </button>

        {/* Collapsible Scenarios Section */}
        <div style={scenariosSectionStyle}>
          <button
            onClick={() => setScenariosExpanded(!scenariosExpanded)}
            className="scenarios-header"
            style={scenariosHeaderStyle}
          >
            <span>Scenarios</span>
            <span style={chevronStyle}>{scenariosExpanded ? '▼' : '▶'}</span>
          </button>
          <div
            style={{
              ...scenariosContentStyle,
              maxHeight: scenariosExpanded ? '1000px' : '0',
              opacity: scenariosExpanded ? 1 : 0,
            }}
          >
            <ScenarioSection isExpanded={scenariosExpanded} />
          </div>
        </div>
      </div>
    </>
  );
}

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: '240px',
  right: '20px',
  background: 'rgba(0, 0, 0, 0.85)',
  padding: '12px',
  borderRadius: '12px',
  color: '#fff',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: '13px',
  minWidth: '220px',
  maxWidth: '280px',
  maxHeight: 'calc(100vh - 260px)',
  overflowY: 'auto',
  overflowX: 'hidden',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  zIndex: 100,
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(255, 255, 255, 0.3) rgba(0, 0, 0, 0.2)',
};

const titleStyle: React.CSSProperties = {
  margin: '0 0 12px 0',
  fontSize: '16px',
  fontWeight: '700',
  letterSpacing: '0.5px',
  color: '#fff',
  textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  marginBottom: '8px',
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '8px',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '500',
  transition: 'all 0.2s ease',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
};

const dangerButtonStyle: React.CSSProperties = {
  background: 'rgba(220, 80, 80, 0.2)',
  borderColor: 'rgba(220, 80, 80, 0.4)',
  marginTop: '4px',
};

const controlGroupStyle: React.CSSProperties = {
  marginBottom: '10px',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '12px',
  fontWeight: '500',
  color: 'rgba(255, 255, 255, 0.85)',
  letterSpacing: '0.3px',
};

const sliderStyle: React.CSSProperties = {
  width: '100%',
  cursor: 'pointer',
  marginTop: '4px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '13px',
  fontFamily: 'monospace',
  transition: 'all 0.2s ease',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
};

const timeDisplayStyle: React.CSSProperties = {
  padding: '10px',
  background: 'rgba(100, 150, 255, 0.1)',
  borderRadius: '8px',
  marginBottom: '10px',
  textAlign: 'center',
  border: '1px solid rgba(100, 150, 255, 0.2)',
  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
};

const timeLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: '500',
  color: 'rgba(255, 255, 255, 0.7)',
  marginBottom: '4px',
  letterSpacing: '0.5px',
};

const timeValueStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: '700',
  fontFamily: 'monospace',
  color: '#fff',
  textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
};

const scenariosSectionStyle: React.CSSProperties = {
  marginTop: '10px',
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  paddingTop: '10px',
};

const scenariosHeaderStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '8px',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '500',
  transition: 'all 0.2s ease',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
};

const chevronStyle: React.CSSProperties = {
  fontSize: '12px',
  transition: 'transform 0.2s ease',
};

const scenariosContentStyle: React.CSSProperties = {
  overflow: 'hidden',
  transition: 'max-height 0.3s ease, opacity 0.3s ease',
};
