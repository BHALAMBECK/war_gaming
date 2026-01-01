import { useCameraStore, CameraPreset } from './stores/cameraStore';

export function CameraPanel() {
  const preset = useCameraStore((state) => state.preset);
  const setPreset = useCameraStore((state) => state.setPreset);

  const presets: { value: CameraPreset; label: string }[] = [
    { value: 'freecam', label: 'Freecam' },
    { value: 'cinematic', label: 'Cinematic Orbit' },
    { value: 'follow', label: 'Follow Target' },
  ];

  return (
    <>
      <style>{`
        .camera-panel-button:hover {
          background: rgba(255, 255, 255, 0.15) !important;
          border-color: rgba(255, 255, 255, 0.3) !important;
          transform: translateY(-1px);
        }
        .camera-panel-button.active:hover {
          background: rgba(100, 150, 255, 0.4) !important;
          border-color: rgba(100, 150, 255, 0.6) !important;
        }
      `}</style>
      <div style={panelStyle}>
        <h3 style={titleStyle}>Camera</h3>
        <div style={buttonGroupStyle}>
          {presets.map((p) => (
            <button
              key={p.value}
              onClick={() => setPreset(p.value)}
              className={`camera-panel-button ${preset === p.value ? 'active' : ''}`}
              style={{
                ...buttonStyle,
                ...(preset === p.value ? activeButtonStyle : {}),
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: '20px',
  right: '20px',
  background: 'rgba(0, 0, 0, 0.85)',
  padding: '12px',
  borderRadius: '12px',
  color: '#fff',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: '13px',
  minWidth: '200px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  zIndex: 100,
};

const titleStyle: React.CSSProperties = {
  margin: '0 0 12px 0',
  fontSize: '16px',
  fontWeight: '700',
  letterSpacing: '0.5px',
  color: '#fff',
  textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
};

const buttonGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const buttonStyle: React.CSSProperties = {
  padding: '8px 12px',
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '8px',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '500',
  transition: 'all 0.2s ease',
  textAlign: 'left',
  width: '100%',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
};

const activeButtonStyle: React.CSSProperties = {
  background: 'rgba(100, 150, 255, 0.25)',
  borderColor: 'rgba(100, 150, 255, 0.5)',
  boxShadow: '0 2px 8px rgba(100, 150, 255, 0.3)',
};
