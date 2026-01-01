/**
 * MissionBriefingPanel component: explains mission objectives and gameplay.
 */

import { useState } from 'react';
import { useTaskStore } from '@/ui/stores/taskStore';

/**
 * MissionBriefingPanel component with collapsible content.
 * Explains objective types, scoring, and gameplay mechanics.
 */
export function MissionBriefingPanel() {
  const { objectives } = useTaskStore();
  const [expanded, setExpanded] = useState(true);
  
  // Only show panel if there are objectives
  if (objectives.length === 0) return null;
  
  return (
    <>
      <style>{`
        .mission-briefing-header:hover {
          background: rgba(255, 255, 255, 0.1) !important;
        }
        .mission-briefing-panel::-webkit-scrollbar {
          width: 8px;
        }
        .mission-briefing-panel::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        .mission-briefing-panel::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }
        .mission-briefing-panel::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.4);
        }
      `}</style>
      <div style={panelStyle} className="mission-briefing-panel">
        <button
          onClick={() => setExpanded(!expanded)}
          className="mission-briefing-header"
          style={headerStyle}
        >
          <span style={headerTitleStyle}>Mission Briefing</span>
          <span style={chevronStyle}>{expanded ? '▼' : '▶'}</span>
        </button>
        <div
          style={{
            ...contentStyle,
            maxHeight: expanded ? '1000px' : '0',
            opacity: expanded ? 1 : 0,
          }}
        >
          <div style={sectionStyle}>
            <div style={paragraphStyle}>
              Complete objectives by guiding agents to specific locations. Agents automatically navigate to assigned objectives.
            </div>
            
            <div style={sectionTitleStyle}>Objective Types</div>
            
            <div style={itemStyle}>
              <div style={itemTitleStyle}>Inspect Point</div>
              <div style={itemDescriptionStyle}>
                Small <strong style={{ color: '#ffff00' }}>yellow</strong> sphere. Any agent can complete by getting within the threshold distance.
              </div>
            </div>
            
            <div style={itemStyle}>
              <div style={itemTitleStyle}>Relay Node</div>
              <div style={itemDescriptionStyle}>
                Medium <strong style={{ color: '#ff8800' }}>orange</strong> sphere. One agent must hold position within the threshold for 30 seconds.
              </div>
            </div>
            
            <div style={itemStyle}>
              <div style={itemTitleStyle}>Formation Zone</div>
              <div style={itemDescriptionStyle}>
                Large <strong style={{ color: '#aa00ff' }}>purple</strong> wireframe sphere. Multiple agents must enter the zone simultaneously to complete.
              </div>
            </div>
            
            <div style={sectionTitleStyle}>Scoring</div>
            <div style={paragraphStyle}>
              Points are awarded when objectives are completed. Different objectives have different point values. Check the TASKS panel (top-left) to track your score and progress.
            </div>
            
            <div style={sectionTitleStyle}>Visual Indicators</div>
            <div style={paragraphStyle}>
              <strong style={{ color: '#ffff00' }}>Yellow</strong> = Inspect Point objectives
              <br />
              <strong style={{ color: '#ff8800' }}>Orange</strong> = Relay Node objectives
              <br />
              <strong style={{ color: '#aa00ff' }}>Purple</strong> = Formation Zone objectives
              <br />
              <strong style={{ color: '#00ff00' }}>Green</strong> = Completed objectives
            </div>
            
            <div style={sectionTitleStyle}>Status</div>
            <div style={paragraphStyle}>
              Monitor your progress in the TASKS panel (top-left corner), which displays your current score, elapsed time, and objective completion status.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: '180px',
  left: '20px',
  background: 'rgba(0, 0, 0, 0.85)',
  borderRadius: '12px',
  color: '#fff',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: '13px',
  minWidth: '280px',
  maxWidth: '320px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  zIndex: 1000,
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(255, 255, 255, 0.3) rgba(0, 0, 0, 0.2)',
};

const headerStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  background: 'rgba(255, 255, 255, 0.08)',
  border: 'none',
  borderTopLeftRadius: '12px',
  borderTopRightRadius: '12px',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '600',
  transition: 'all 0.2s ease',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
};

const headerTitleStyle: React.CSSProperties = {
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
};

const chevronStyle: React.CSSProperties = {
  fontSize: '12px',
  transition: 'transform 0.2s ease',
};

const contentStyle: React.CSSProperties = {
  overflow: 'hidden',
  transition: 'max-height 0.3s ease, opacity 0.3s ease',
};

const sectionStyle: React.CSSProperties = {
  padding: '16px 20px',
  maxHeight: 'calc(100vh - 250px)',
  overflowY: 'auto',
};

const sectionTitleStyle: React.CSSProperties = {
  marginTop: '16px',
  marginBottom: '8px',
  fontSize: '13px',
  fontWeight: '600',
  color: 'rgba(255, 255, 255, 0.9)',
  letterSpacing: '0.3px',
};

const paragraphStyle: React.CSSProperties = {
  marginBottom: '12px',
  fontSize: '12px',
  lineHeight: '1.6',
  color: 'rgba(255, 255, 255, 0.8)',
};

const itemStyle: React.CSSProperties = {
  marginBottom: '12px',
  padding: '8px 0',
};

const itemTitleStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: '600',
  color: 'rgba(255, 255, 255, 0.95)',
  marginBottom: '4px',
};

const itemDescriptionStyle: React.CSSProperties = {
  fontSize: '11px',
  lineHeight: '1.5',
  color: 'rgba(255, 255, 255, 0.7)',
  paddingLeft: '8px',
};

const highlightStyle: React.CSSProperties = {
  color: 'rgba(255, 255, 255, 0.95)',
  fontWeight: '500',
};
