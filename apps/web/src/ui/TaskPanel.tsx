/**
 * TaskPanel component: displays score and timer for task allocation mini-game.
 */

import { useTaskStore } from '@/ui/stores/taskStore';

/**
 * TaskPanel component showing score and timer.
 * Positioned as HUD overlay in top-left corner.
 */
export function TaskPanel() {
  const { objectives, score, formatGameTime } = useTaskStore();
  
  // Only show panel if there are objectives
  if (objectives.length === 0) return null;
  
  const completedCount = objectives.filter((obj) => obj.completed).length;
  const totalCount = objectives.length;
  
  return (
    <>
      <div style={panelStyle}>
        <div style={titleStyle}>Tasks</div>
        
        <div style={rowStyle}>
          <div style={labelStyle}>Score:</div>
          <div style={valueStyle}>{score}</div>
        </div>
        
        <div style={rowStyle}>
          <div style={labelStyle}>Time:</div>
          <div style={valueStyle}>{formatGameTime()}</div>
        </div>
        
        <div style={progressStyle}>
          {completedCount} / {totalCount} objectives
        </div>
      </div>
    </>
  );
}

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: '20px',
  left: '20px',
  background: 'rgba(0, 0, 0, 0.85)',
  padding: '16px 20px',
  borderRadius: '12px',
  color: '#fff',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: '14px',
  minWidth: '180px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  zIndex: 1000,
};

const titleStyle: React.CSSProperties = {
  margin: '0 0 12px 0',
  fontSize: '14px',
  fontWeight: 600,
  letterSpacing: '0.5px',
  color: 'rgba(255, 255, 255, 0.9)',
  textTransform: 'uppercase',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '8px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 500,
  color: 'rgba(255, 255, 255, 0.7)',
  letterSpacing: '0.3px',
};

const valueStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 700,
  fontFamily: 'monospace',
  color: '#fff',
  textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
};

const progressStyle: React.CSSProperties = {
  marginTop: '8px',
  paddingTop: '8px',
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  fontSize: '11px',
  color: 'rgba(255, 255, 255, 0.6)',
  textAlign: 'center',
};
