import { useState, useRef } from 'react';
import { useScenarioStore } from './stores/scenarioStore';
import { validateScenario } from '@/scenario/schema';
import { downloadScenario } from '@/scenario/saver';
import {
  saveToLocalStorage,
  loadFromLocalStorage,
  listLocalStorageScenarios,
  deleteFromLocalStorage,
} from '@/scenario/storage';

export function ScenarioPanel() {
  const { currentScenario, scenarioName, loadScenario, saveCurrentScenario } = useScenarioStore();
  const [savedScenarios, setSavedScenarios] = useState<string[]>(listLocalStorageScenarios());
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshSavedScenarios = () => {
    setSavedScenarios(listLocalStorageScenarios());
  };

  const handleLoadFromFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        const scenario = validateScenario(data);
        loadScenario(scenario);
        refreshSavedScenarios();
      } catch (error) {
        alert(`Failed to load scenario: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    if (!saveName.trim()) {
      alert('Please enter a scenario name');
      return;
    }

    try {
      const scenario = saveCurrentScenario(saveName.trim(), saveDescription.trim());
      saveToLocalStorage(scenario);
      setSaveName('');
      setSaveDescription('');
      refreshSavedScenarios();
      alert(`Scenario "${scenario.name}" saved successfully!`);
    } catch (error) {
      alert(`Failed to save scenario: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDownload = () => {
    if (!currentScenario) {
      alert('No scenario loaded');
      return;
    }

    try {
      downloadScenario(currentScenario);
    } catch (error) {
      alert(`Failed to download scenario: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleLoadFromStorage = (name: string) => {
    try {
      const scenario = loadFromLocalStorage(name);
      if (scenario) {
        loadScenario(scenario);
      }
    } catch (error) {
      alert(`Failed to load scenario: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteFromStorage = (name: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (confirm(`Delete scenario "${name}"?`)) {
      try {
        deleteFromLocalStorage(name);
        refreshSavedScenarios();
        if (currentScenario?.name === name) {
          useScenarioStore.getState().resetScenario();
        }
      } catch (error) {
        alert(`Failed to delete scenario: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  return (
    <>
      <style>{`
        .scenario-panel-button:hover {
          background: rgba(255, 255, 255, 0.15) !important;
          border-color: rgba(255, 255, 255, 0.3) !important;
          transform: translateY(-1px);
        }
        .scenario-panel-input:focus {
          outline: none;
          border-color: rgba(100, 150, 255, 0.5);
          background: rgba(255, 255, 255, 0.12);
        }
        .scenario-panel-select:focus {
          outline: none;
          border-color: rgba(100, 150, 255, 0.5);
          background: rgba(255, 255, 255, 0.12);
        }
        .scenario-item:hover {
          background: rgba(255, 255, 255, 0.1) !important;
        }
        .scenario-item-delete:hover {
          background: rgba(220, 80, 80, 0.3) !important;
          border-color: rgba(220, 80, 80, 0.5) !important;
        }
      `}</style>
      <div className="scenario-panel" style={panelStyle}>
        <h3 style={titleStyle}>Scenarios</h3>

        {/* Current scenario display */}
        {currentScenario && (
          <div style={currentScenarioStyle}>
            <div style={currentScenarioLabelStyle}>Current:</div>
            <div style={currentScenarioNameStyle}>{scenarioName || 'Unnamed'}</div>
          </div>
        )}

        {/* Load from file */}
        <button onClick={handleLoadFromFile} className="scenario-panel-button" style={buttonStyle}>
          📁 Load from File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {/* Save scenario */}
        <div style={controlGroupStyle}>
          <label style={labelStyle}>Save Scenario:</label>
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            className="scenario-panel-input"
            style={inputStyle}
            placeholder="Scenario name..."
          />
          <textarea
            value={saveDescription}
            onChange={(e) => setSaveDescription(e.target.value)}
            className="scenario-panel-input"
            style={{ ...inputStyle, ...textareaStyle }}
            placeholder="Description (optional)..."
            rows={2}
          />
          <button onClick={handleSave} className="scenario-panel-button" style={buttonStyle}>
            💾 Save to LocalStorage
          </button>
        </div>

        {/* Download current scenario */}
        <button
          onClick={handleDownload}
          className="scenario-panel-button"
          style={buttonStyle}
          disabled={!currentScenario}
        >
          ⬇️ Download Scenario
        </button>

        {/* Saved scenarios list */}
        {savedScenarios.length > 0 && (
          <div style={controlGroupStyle}>
            <label style={labelStyle}>Saved Scenarios:</label>
            <div style={scenariosListStyle}>
              {savedScenarios.map((name) => (
                <div key={name} style={scenarioItemStyle} className="scenario-item">
                  <button
                    onClick={() => handleLoadFromStorage(name)}
                    style={scenarioItemButtonStyle}
                  >
                    {name}
                  </button>
                  <button
                    onClick={(e) => handleDeleteFromStorage(name, e)}
                    className="scenario-item-delete"
                    style={deleteButtonStyle}
                    title="Delete scenario"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: '520px', // Positioned below TimeControlPanel
  right: '20px',
  background: 'rgba(0, 0, 0, 0.85)',
  padding: '20px',
  borderRadius: '12px',
  color: '#fff',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: '14px',
  minWidth: '250px',
  maxWidth: '300px',
  maxHeight: 'calc(100vh - 540px)',
  overflowY: 'auto',
  overflowX: 'hidden',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  zIndex: 100,
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(255, 255, 255, 0.3) rgba(0, 0, 0, 0.2)',
};

const titleStyle: React.CSSProperties = {
  margin: '0 0 16px 0',
  fontSize: '18px',
  fontWeight: '700',
  letterSpacing: '0.5px',
  color: '#fff',
  textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  marginBottom: '10px',
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '8px',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500',
  transition: 'all 0.2s ease',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
};

const controlGroupStyle: React.CSSProperties = {
  marginBottom: '16px',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '8px',
  fontSize: '13px',
  fontWeight: '500',
  color: 'rgba(255, 255, 255, 0.85)',
  letterSpacing: '0.3px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '14px',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  transition: 'all 0.2s ease',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
  marginBottom: '10px',
  boxSizing: 'border-box',
};

const textareaStyle: React.CSSProperties = {
  resize: 'vertical',
  minHeight: '60px',
  fontFamily: 'system-ui, -apple-system, sans-serif',
};

const currentScenarioStyle: React.CSSProperties = {
  padding: '12px',
  background: 'rgba(100, 150, 255, 0.1)',
  borderRadius: '8px',
  marginBottom: '16px',
  border: '1px solid rgba(100, 150, 255, 0.2)',
};

const currentScenarioLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: '500',
  color: 'rgba(255, 255, 255, 0.7)',
  marginBottom: '6px',
};

const currentScenarioNameStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: '700',
  color: '#fff',
};

const scenariosListStyle: React.CSSProperties = {
  maxHeight: '200px',
  overflowY: 'auto',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '8px',
  background: 'rgba(0, 0, 0, 0.3)',
};

const scenarioItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '8px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
};

const scenarioItemButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '8px 12px',
  background: 'transparent',
  border: 'none',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '13px',
  textAlign: 'left',
  borderRadius: '4px',
  transition: 'all 0.2s ease',
};

const deleteButtonStyle: React.CSSProperties = {
  padding: '4px 10px',
  background: 'rgba(220, 80, 80, 0.2)',
  border: '1px solid rgba(220, 80, 80, 0.4)',
  borderRadius: '4px',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '18px',
  fontWeight: 'bold',
  lineHeight: '1',
  transition: 'all 0.2s ease',
  marginLeft: '8px',
};
