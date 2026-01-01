import { useState } from 'react';

interface HideUIButtonProps {
  onToggle: (hidden: boolean) => void;
}

export function HideUIButton({ onToggle }: HideUIButtonProps) {
  const [hidden, setHidden] = useState(false);

  const handleClick = () => {
    const newHidden = !hidden;
    setHidden(newHidden);
    onToggle(newHidden);
  };

  return (
    <>
      <style>{`
        .hide-ui-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
        }
      `}</style>
      <button
        onClick={handleClick}
        className="hide-ui-button"
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          padding: '12px 20px',
          background: hidden 
            ? 'rgba(100, 255, 100, 0.25)' 
            : 'rgba(0, 0, 0, 0.85)',
          border: hidden
            ? '1px solid rgba(100, 255, 100, 0.4)'
            : '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '8px',
          color: '#fff',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          zIndex: 1000,
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {hidden ? 'Show UI' : 'Hide UI'}
      </button>
    </>
  );
}

