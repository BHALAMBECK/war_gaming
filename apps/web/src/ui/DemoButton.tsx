/**
 * DemoButton component: prominent button to start demo mode.
 */

import { useState } from 'react';
import { startDemo, ExampleScenarioName } from './demo/demoMode';

interface DemoButtonProps {
  onUIHide?: () => void;
  scenarioName?: ExampleScenarioName;
}

export function DemoButton({ onUIHide, scenarioName = 'demo' }: DemoButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Start demo with auto-hide UI after 2 seconds
      startDemo(scenarioName, {
        autoHideUIDelay: 2000,
        onUIHide,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start demo';
      setError(errorMessage);
      console.error('Demo start error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .demo-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(100, 150, 255, 0.4) !important;
        }
        .demo-button:active:not(:disabled) {
          transform: translateY(0);
        }
      `}</style>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="demo-button"
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '16px 32px',
          background: isLoading
            ? 'rgba(100, 150, 255, 0.3)'
            : 'linear-gradient(135deg, rgba(100, 150, 255, 0.9), rgba(150, 200, 255, 0.9))',
          border: '2px solid rgba(100, 150, 255, 0.6)',
          borderRadius: '12px',
          color: '#fff',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: '600',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          zIndex: 1001,
          transition: 'all 0.2s ease',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {isLoading ? 'Loading Demo...' : '🎬 Demo'}
      </button>
      {error && (
        <div
          style={{
            position: 'absolute',
            top: '70px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '8px 16px',
            background: 'rgba(255, 50, 50, 0.9)',
            border: '1px solid rgba(255, 100, 100, 0.6)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '12px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            zIndex: 1002,
            maxWidth: '400px',
            textAlign: 'center',
          }}
        >
          {error}
        </div>
      )}
    </>
  );
}
