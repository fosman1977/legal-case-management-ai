import React, { useState, useEffect } from 'react';
import { modelManager, ModelPack, ModelDownloadProgress } from '../services/modelManager';

interface AISettingsProps {
  caseId: string;
}

export const AISettings: React.FC<AISettingsProps> = ({ caseId }) => {
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [availableModels, setAvailableModels] = useState<string[]>(['gpt-4']);
  const [localAIStatus, setLocalAIStatus] = useState<boolean>(false);
  
  // Model management state
  const [availableModelPacks, setAvailableModelPacks] = useState<ModelPack[]>([]);
  const [installedModels, setInstalledModels] = useState<string[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, ModelDownloadProgress>>({});
  const [claudeApiKey, setClaudeApiKey] = useState<string>('');

  useEffect(() => {
    // Load AI preferences from localStorage
    const savedPrefs = localStorage.getItem(`ai_prefs_${caseId}`);
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs);
      setSelectedModel(prefs.selectedModel ?? 'gpt-4');
    }
    
    // Load Claude API key
    const savedApiKey = localStorage.getItem('claude_api_key');
    if (savedApiKey) {
      setClaudeApiKey(savedApiKey);
    }
    
    // Check LocalAI status and load models
    checkLocalAIStatus();
    fetchAvailableModels();
    
    // Load model packs information
    loadModelPacks();
  }, [caseId]);

  const loadModelPacks = () => {
    setAvailableModelPacks(modelManager.getAvailableModelPacks());
    setInstalledModels(modelManager.getInstalledModels());
  };

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

  const saveClaudeApiKey = (apiKey: string) => {
    setClaudeApiKey(apiKey);
    localStorage.setItem('claude_api_key', apiKey);
    console.log('🔑 Claude API key saved');
  };

  const handleModelDownload = async (modelId: string) => {
    try {
      await modelManager.downloadModel(modelId, (progress) => {
        setDownloadProgress(prev => ({
          ...prev,
          [modelId]: progress
        }));
      });
      
      // Refresh the installed models list
      loadModelPacks();
    } catch (error) {
      console.error('Failed to download model:', error);
      alert(`Failed to download model: ${error}`);
    }
  };

  const handleModelUninstall = async (modelId: string) => {
    if (confirm('Are you sure you want to uninstall this model pack?')) {
      try {
        await modelManager.uninstallModel(modelId);
        loadModelPacks();
        
        // Clear any download progress
        setDownloadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[modelId];
          return newProgress;
        });
      } catch (error) {
        console.error('Failed to uninstall model:', error);
        alert(`Failed to uninstall model: ${error}`);
      }
    }
  };

  return (
    <div className="ai-settings">
      <div className="settings-header">
        <h3>🤖 AI & Model Configuration</h3>
        <p className="settings-description">
          Configure AI services and download enhanced legal analysis models.
        </p>
        <div className="privacy-notice">
          <p>🔒 <strong>Privacy First:</strong> All document processing happens locally. Claude AI receives only anonymous patterns for strategic guidance.</p>
        </div>
      </div>

      <div className="ai-options">
        {/* Claude AI Configuration */}
        <div className="option-card">
          <div className="option-header">
            <h4>🤖 Claude AI Integration</h4>
          </div>
          <div className="option-content">
            <p>Optional: Add your Claude API key for AI-powered strategic insights</p>
            <div className="api-key-input">
              <input
                type="password"
                value={claudeApiKey}
                onChange={(e) => saveClaudeApiKey(e.target.value)}
                placeholder="Enter Claude API key (optional)"
                className="api-key-field"
              />
              {claudeApiKey && (
                <span className="status-indicator success">✅ API Key Configured</span>
              )}
            </div>
            <p className="api-key-help">
              {claudeApiKey 
                ? '🎯 Claude AI consultation available - get strategic insights on your cases'
                : '⚙️ Without API key: Full legal analysis using built-in engines only'
              }
            </p>
          </div>
        </div>

        {/* Enhanced Model Downloads */}
        <div className="option-card">
          <div className="option-header">
            <h4>📦 Enhanced Legal Models</h4>
          </div>
          <div className="option-content">
            <p>Download optional ML models for enhanced legal analysis accuracy</p>
            
            <div className="storage-info">
              <p><strong>Storage Used:</strong> {modelManager.getStorageUsed().total_mb.toFixed(0)} MB</p>
            </div>

            <div className="model-packs">
              {availableModelPacks.map(pack => {
                const isInstalled = installedModels.includes(pack.id);
                const progress = downloadProgress[pack.id];
                const isDownloading = progress && ['downloading', 'extracting', 'installing'].includes(progress.status);

                return (
                  <div key={pack.id} className="model-pack">
                    <div className="pack-header">
                      <h5>{pack.name}</h5>
                      <span className="pack-size">{pack.size} MB</span>
                    </div>
                    
                    <p className="pack-description">{pack.description}</p>
                    
                    <div className="pack-features">
                      <strong>Improvements:</strong> {pack.accuracy_improvement}
                      <ul>
                        {pack.features.map((feature, idx) => (
                          <li key={idx}>{feature}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="pack-actions">
                      {isInstalled ? (
                        <div className="installed-status">
                          <span className="status-badge installed">✅ Installed</span>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleModelUninstall(pack.id)}
                          >
                            🗑️ Uninstall
                          </button>
                        </div>
                      ) : isDownloading ? (
                        <div className="download-progress">
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${(progress.downloaded / progress.total) * 100}%` }}
                            />
                          </div>
                          <span className="progress-text">
                            {progress.status}: {((progress.downloaded / progress.total) * 100).toFixed(0)}%
                          </span>
                        </div>
                      ) : (
                        <button 
                          className="btn btn-primary"
                          onClick={() => handleModelDownload(pack.id)}
                        >
                          📥 Download {pack.name}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="option-card">
          <div className="option-header">
            <h4>🔧 Local Processing Status</h4>
          </div>
          <div className="option-content">
            <div className="localai-status">
              <p>
                <span className="status-indicator">
                  🤖 Local AI: 
                  <span className={`status-badge ${localAIStatus ? 'online' : 'fallback'}`}>
                    {localAIStatus ? '● Enhanced Mode' : '● Standard Mode'}
                  </span>
                </span>
              </p>
              <p className="status-help">
                {localAIStatus 
                  ? '✅ Using local AI for enhanced document analysis and processing'
                  : '✅ Using built-in processing - all features work without external dependencies'
                }
              </p>
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