import React, { useState, useEffect } from 'react';
// import { FolderSetup } from './FolderSetup'; // Replaced by per-case folder setup

interface SecuritySettingsProps {
  caseId: string;
}

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({ caseId }) => {
  const [useAnonymization, setUseAnonymization] = useState(true);
  const [showMappingStats, setShowMappingStats] = useState(false);
  const [lastAnalysisStats, _setLastAnalysisStats] = useState<Record<string, number> | null>(null);
  const [selectedModel, setSelectedModel] = useState('llama3.2:1b');
  const [availableModels, setAvailableModels] = useState<string[]>(['llama3.2:1b']);

  useEffect(() => {
    // Load security preferences from localStorage
    const savedPrefs = localStorage.getItem(`security_prefs_${caseId}`);
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs);
      setUseAnonymization(prefs.useAnonymization ?? true);
      setSelectedModel(prefs.selectedModel ?? 'llama3.2:1b');
    }
    
    // Load available models from Ollama API
    fetchAvailableModels();
  }, [caseId]);

  const fetchAvailableModels = async () => {
    try {
      const response = await fetch('http://127.0.0.1:11434/api/tags');
      if (response.ok) {
        const data = await response.json();
        const models = data.models?.map((model: any) => model.name) || [];
        setAvailableModels(models.length > 0 ? models : ['llama3.2:1b']);
      }
    } catch (error) {
      console.log('Could not fetch Ollama models, using defaults');
      setAvailableModels(['llama3.2:1b']);
    }
  };

  const saveSecurityPrefs = (newUseAnonymization?: boolean, newSelectedModel?: string) => {
    const useAnon = newUseAnonymization ?? useAnonymization;
    const model = newSelectedModel ?? selectedModel;
    
    setUseAnonymization(useAnon);
    setSelectedModel(model);
    
    localStorage.setItem(`security_prefs_${caseId}`, JSON.stringify({
      useAnonymization: useAnon,
      selectedModel: model
    }));
    
    // Update the AI analyzer with new model
    if ((window as any).aiAnalyzer) {
      (window as any).aiAnalyzer.setOllamaSettings(true, model);
    }
  };

  const exportAnonymizationMapping = () => {
    // This would export the anonymization mapping for backup
    const mapping = localStorage.getItem(`anonymization_mapping_${caseId}`);
    if (mapping) {
      const blob = new Blob([mapping], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `case_${caseId}_anonymization_mapping.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      alert('No anonymization mapping found for this case.');
    }
  };

  const importAnonymizationMapping = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          // Validate the mapping format
          JSON.parse(content);
          localStorage.setItem(`anonymization_mapping_${caseId}`, content);
          alert('Anonymization mapping imported successfully.');
        } catch (error) {
          alert('Invalid mapping file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="security-settings">
      <div className="settings-header">
        <h3>🔒 Security & Privacy Settings</h3>
        <p className="settings-description">
          Configure how your sensitive case data is handled during AI analysis.
        </p>
        <div className="local-ai-notice">
          <p>ℹ️ <strong>Local AI Detected:</strong> Since you're using Ollama (local AI), your data never leaves your machine. 
          You may want to <strong>disable anonymization</strong> for better AI accuracy and performance.</p>
        </div>
      </div>

      {/* Note: OneDrive folder setup is now per-case in the Documents tab */}

      <div className="security-options">
        <div className="option-card">
          <div className="option-header">
            <h4>Data Anonymization</h4>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={useAnonymization}
                onChange={(e) => saveSecurityPrefs(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <div className="option-content">
            {useAnonymization ? (
              <div className="security-enabled">
                <p className="status-text">✅ <strong>SECURE MODE ENABLED</strong></p>
                <p>Your sensitive data will be anonymized before AI analysis:</p>
                <ul>
                  <li>Names → [PERSON-1], [PERSON-2]</li>
                  <li>Companies → [COMPANY-1], [COMPANY-2]</li>
                  <li>Amounts → [AMOUNT-1], [AMOUNT-2]</li>
                  <li>Dates → [DATE-1], [DATE-2]</li>
                  <li>Addresses → [ADDRESS-1], [ADDRESS-2]</li>
                  <li>Phone/Email → [PHONE-1], [EMAIL-1]</li>
                </ul>
                <p className="privacy-note">
                  <strong>Privacy Guarantee:</strong> No real names, amounts, or sensitive 
                  information will be sent to AI services.
                </p>
              </div>
            ) : (
              <div className="security-disabled">
                <p className="status-text">⚠️ <strong>DIRECT MODE</strong></p>
                <p>AI will analyze your documents directly without anonymization.</p>
                <p className="warning-note">
                  <strong>Warning:</strong> This mode sends raw document content to AI services. 
                  Only use if you have explicit consent or are using local AI.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="option-card">
          <div className="option-header">
            <h4>AI Model Selection</h4>
          </div>
          <div className="option-content">
            <p>Choose which Ollama model to use for document analysis:</p>
            <select 
              value={selectedModel} 
              onChange={(e) => saveSecurityPrefs(undefined, e.target.value)}
              className="model-selector"
            >
              {availableModels.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
            <p className="model-info">
              Current model: <strong>{selectedModel}</strong>
            </p>
          </div>
        </div>

        {useAnonymization && (
          <div className="anonymization-tools">
            <h4>Anonymization Management</h4>
            
            <div className="tool-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowMappingStats(!showMappingStats)}
              >
                {showMappingStats ? 'Hide' : 'Show'} Anonymization Stats
              </button>
              
              <button 
                className="btn btn-secondary"
                onClick={exportAnonymizationMapping}
              >
                📤 Export Mapping
              </button>
              
              <label className="btn btn-secondary file-upload-btn">
                📥 Import Mapping
                <input
                  type="file"
                  accept=".json"
                  onChange={importAnonymizationMapping}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {showMappingStats && lastAnalysisStats && (
              <div className="mapping-stats">
                <h5>Last Analysis Statistics:</h5>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-label">People:</span>
                    <span className="stat-value">{lastAnalysisStats.people}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Companies:</span>
                    <span className="stat-value">{lastAnalysisStats.companies}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Amounts:</span>
                    <span className="stat-value">{lastAnalysisStats.amounts}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Dates:</span>
                    <span className="stat-value">{lastAnalysisStats.dates}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Addresses:</span>
                    <span className="stat-value">{lastAnalysisStats.addresses}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Total Tokens:</span>
                    <span className="stat-value">{lastAnalysisStats.totalTokens}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="security-info">
          <h4>How Anonymization Works</h4>
          <div className="info-content">
            <div className="process-step">
              <span className="step-number">1</span>
              <div>
                <h5>Local Analysis</h5>
                <p>Your documents are scanned for sensitive information using pattern recognition.</p>
              </div>
            </div>
            <div className="process-step">
              <span className="step-number">2</span>
              <div>
                <h5>Token Replacement</h5>
                <p>Sensitive data is replaced with anonymous tokens like [PERSON-1], [AMOUNT-2].</p>
              </div>
            </div>
            <div className="process-step">
              <span className="step-number">3</span>
              <div>
                <h5>AI Analysis</h5>
                <p>Only anonymized text is sent to AI services for analysis.</p>
              </div>
            </div>
            <div className="process-step">
              <span className="step-number">4</span>
              <div>
                <h5>Result Restoration</h5>
                <p>AI results are de-anonymized locally before display to you.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export the current security preferences for use by AI analysis
export const getSecurityPreferences = (caseId: string) => {
  const savedPrefs = localStorage.getItem(`security_prefs_${caseId}`);
  if (savedPrefs) {
    const prefs = JSON.parse(savedPrefs);
    return {
      useAnonymization: prefs.useAnonymization ?? true
    };
  }
  return { useAnonymization: true }; // Default to secure mode
};