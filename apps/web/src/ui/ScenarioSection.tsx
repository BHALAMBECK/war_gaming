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

interface ScenarioSectionProps {
  isExpanded: boolean;
}

export function ScenarioSection({ isExpanded }: ScenarioSectionProps) {
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

  if (!isExpanded) {
    return null;
  }

  return (
    <>
      <style>{`
        .scenario-section-button:hover {
          background: rgba(255, 255, 255, 0.15) !important;
          border-color: rgba(255, 255, 255, 0.3) !important;
          transform: translateY(-1px);
        }
        .scenario-section-input:focus {
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
      <div style={sectionStyle}>
        {/* Current scenario display */}
        {currentScenario && (
          <div style={currentScenarioStyle}>
            <div style={currentScenarioLabelStyle}>Current:</div>
            <div style={currentScenarioNameStyle}>{scenarioName || 'Unnamed'}</div>
          </div>
        )}

        {/* Load from file */}
        <button onClick={handleLoadFromFile} className="scenario-section-button" style={buttonStyle}>
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
            className="scenario-section-input"
            style={inputStyle}
            placeholder="Scenario name..."
          />
          <textarea
            value={saveDescription}
            onChange={(e) => setSaveDescription(e.target.value)}
            className="scenario-section-input"
            style={{ ...inputStyle, ...textareaStyle }}
            placeholder="Description (optional)..."
            rows={2}
          />
          <button onClick={handleSave} className="scenario-section-button" style={buttonStyle}>
            💾 Save to LocalStorage
          </button>
        </div>

        {/* Download current scenario */}
        <button
          onClick={handleDownload}
          className="scenario-section-button"
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

const sectionStyle: React.CSSProperties = {
  marginTop: '10px',
  paddingTop: '10px',
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  marginBottom: '8px',
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '6px',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '500',
  transition: 'all 0.2s ease',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '13px',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  transition: 'all 0.2s ease',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
  marginBottom: '8px',
  boxSizing: 'border-box',
};

const textareaStyle: React.CSSProperties = {
  resize: 'vertical',
  minHeight: '50px',
  fontFamily: 'system-ui, -apple-system, sans-serif',
};

const currentScenarioStyle: React.CSSProperties = {
  padding: '8px',
  background: 'rgba(100, 150, 255, 0.1)',
  borderRadius: '6px',
  marginBottom: '10px',
  border: '1px solid rgba(100, 150, 255, 0.2)',
};

const currentScenarioLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: '500',
  color: 'rgba(255, 255, 255, 0.7)',
  marginBottom: '4px',
};

const currentScenarioNameStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: '700',
  color: '#fff',
};

const scenariosListStyle: React.CSSProperties = {
  maxHeight: '150px',
  overflowY: 'auto',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '6px',
  background: 'rgba(0, 0, 0, 0.3)',
};

const scenarioItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '6px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
};

const scenarioItemButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '6px 10px',
  background: 'transparent',
  border: 'none',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '12px',
  textAlign: 'left',
  borderRadius: '4px',
  transition: 'all 0.2s ease',
};

const deleteButtonStyle: React.CSSProperties = {
  padding: '3px 8px',
  background: 'rgba(220, 80, 80, 0.2)',
  border: '1px solid rgba(220, 80, 80, 0.4)',
  borderRadius: '4px',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '16px',
  fontWeight: 'bold',
  lineHeight: '1',
  transition: 'all 0.2s ease',
  marginLeft: '6px',
};
