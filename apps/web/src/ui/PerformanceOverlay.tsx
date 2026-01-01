/**
 * PerformanceOverlay component: displays FPS and performance metrics.
 */

import { useAgentStore } from './stores/agentStore';

interface PerformanceOverlayProps {
  visible: boolean;
  fps: number;
}

export function PerformanceOverlay({ visible, fps }: PerformanceOverlayProps) {
  const agentCount = useAgentStore((state) => state.agents.length);

  if (!visible) return null;

  // Color coding for FPS
  const fpsColor = fps >= 55 ? '#4ade80' : fps >= 30 ? '#fbbf24' : '#f87171';

  return (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        padding: '12px 16px',
        background: 'rgba(0, 0, 0, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 1000,
        backdropFilter: 'blur(10px)',
        minWidth: '150px',
      }}
    >
      <div style={{ marginBottom: '8px', fontWeight: '600', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '4px' }}>
        Performance
      </div>
      <div style={{ marginBottom: '4px' }}>
        FPS: <span style={{ color: fpsColor }}>
          {fps.toFixed(1)}
        </span>
      </div>
      <div style={{ marginBottom: '4px' }}>
        Agents: <span style={{ color: '#94a3b8' }}>{agentCount}</span>
      </div>
    </div>
  );
}
