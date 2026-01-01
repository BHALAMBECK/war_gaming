/**
 * PerformanceToggle component: button to toggle performance overlay visibility.
 */

import { useState } from 'react';

interface PerformanceToggleProps {
  onToggle: (visible: boolean) => void;
}

export function PerformanceToggle({ onToggle }: PerformanceToggleProps) {
  const [visible, setVisible] = useState(false);

  const handleClick = () => {
    const newVisible = !visible;
    setVisible(newVisible);
    onToggle(newVisible);
  };

  return (
    <>
      <style>{`
        .performance-toggle-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
        }
      `}</style>
      <button
        onClick={handleClick}
        className="performance-toggle-button"
        style={{
          position: 'absolute',
          top: '70px',
          right: '20px',
          padding: '10px 16px',
          background: visible 
            ? 'rgba(100, 150, 255, 0.25)' 
            : 'rgba(0, 0, 0, 0.85)',
          border: visible
            ? '1px solid rgba(100, 150, 255, 0.4)'
            : '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '8px',
          color: '#fff',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: '500',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          zIndex: 1000,
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {visible ? '📊 Hide Stats' : '📊 Show Stats'}
      </button>
    </>
  );
}
