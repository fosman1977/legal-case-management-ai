import React, { useState, useEffect } from 'react';

interface AISettingsProps {
  caseId: string;
}

export const AISettings: React.FC<AISettingsProps> = ({ caseId }) => {
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [availableModels, setAvailableModels] = useState<string[]>(['gpt-4']);
  const [localAIStatus, setLocalAIStatus] = useState<boolean>(false);

  useEffect(() => {
    // Load AI preferences from localStorage
    const savedPrefs = localStorage.getItem(`ai_prefs_${caseId}`);
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs);
      setSelectedModel(prefs.selectedModel ?? 'gpt-4');
    }
    
    // Check LocalAI status and load models
    checkLocalAIStatus();
    fetchAvailableModels();
  }, [caseId]);

  const checkLocalAIStatus = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8080/v1/models', { 
        signal: AbortSignal.timeout(5000) 
      });
      setLocalAIStatus(response.ok);
    } catch {
      setLocalAIStatus(false);
    }
  };

  const fetchAvailableModels = async () => {
    let models: string[] = ['gpt-4']; // fallback to commonly available LocalAI model

    try {
      const response = await fetch('http://127.0.0.1:8080/v1/models');
      if (response.ok) {
        const data = await response.json();
        models = data.data?.map((model: any) => model.id) || models;
      }
    } catch (error) {
      console.log('Could not fetch LocalAI models, using defaults');
    }

    setAvailableModels(models.length > 0 ? models : ['gpt-4']);
  };

  const saveAIPrefs = (newSelectedModel?: string) => {
    const model = newSelectedModel ?? selectedModel;
    
    setSelectedModel(model);
    
    localStorage.setItem(`ai_prefs_${caseId}`, JSON.stringify({
      selectedModel: model
    }));
    
    // Update the AI analyzer with new model
    if ((window as any).aiAnalyzer) {
      (window as any).aiAnalyzer.setLocalAISettings(true, model);
    }
  };

  return (
    <div className="ai-settings">
      <div className="settings-header">
        <h3>🤖 AI Configuration</h3>
        <p className="settings-description">
          Configure your LocalAI setup for document analysis and case management.
        </p>
        <div className="local-ai-notice">
          <p>ℹ️ <strong>LocalAI Integration:</strong> This app uses LocalAI for OpenAI-compatible local AI processing. 
          Your data never leaves your machine, ensuring complete privacy and security.</p>
        </div>
      </div>

      <div className="ai-options">
        <div className="option-card">
          <div className="option-header">
            <h4>LocalAI Status</h4>
          </div>
          <div className="option-content">
            <div className="localai-status">
              <p>
                <span className="status-indicator">
                  🤖 LocalAI: 
                  <span className={`status-badge ${localAIStatus ? 'online' : 'offline'}`}>
                    {localAIStatus ? '● Online' : '● Offline'}
                  </span>
                </span>
              </p>
              {!localAIStatus && (
                <p className="status-help">
                  Make sure LocalAI is running: <code>docker-compose -f docker-compose.minimal.yml up -d</code>
                </p>
              )}
            </div>
            <button 
              className="btn btn-secondary"
              onClick={() => {
                checkLocalAIStatus();
                fetchAvailableModels();
              }}
              style={{ marginTop: '10px' }}
            >
              🔄 Refresh Status
            </button>
          </div>
        </div>

        <div className="option-card">
          <div className="option-header">
            <h4>AI Model Selection</h4>
          </div>
          <div className="option-content">
            <p>Choose which LocalAI model to use for document analysis:</p>
            <select 
              value={selectedModel} 
              onChange={(e) => saveAIPrefs(e.target.value)}
              className="model-selector"
            >
              {availableModels.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
            <p className="model-info">
              Current model: <strong>{selectedModel}</strong>
            </p>
            {!localAIStatus && (
              <p className="warning-note">
                <strong>Note:</strong> LocalAI is offline. Please start the LocalAI service to see available models.
              </p>
            )}
          </div>
        </div>

        <div className="info-card">
          <h4>About LocalAI</h4>
          <div className="info-content">
            <div className="info-item">
              <span className="info-label">🔒 Privacy:</span>
              <span>All data processing happens locally on your machine</span>
            </div>
            <div className="info-item">
              <span className="info-label">🌐 Compatibility:</span>
              <span>OpenAI-compatible API endpoints</span>
            </div>
            <div className="info-item">
              <span className="info-label">⚡ Performance:</span>
              <span>Optimized for local hardware with configurable models</span>
            </div>
            <div className="info-item">
              <span className="info-label">📊 Models:</span>
              <span>Supports various model formats (GGML, GGUF, etc.)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};