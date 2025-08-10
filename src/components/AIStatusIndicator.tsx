import React, { useState, useEffect } from 'react';
import { unifiedAIClient } from '../utils/unifiedAIClient';

interface AIStatusIndicatorProps {
  onModelChange?: (model: string) => void;
  showModelSelector?: boolean;
}

export const AIStatusIndicator: React.FC<AIStatusIndicatorProps> = ({
  onModelChange,
  showModelSelector = true
}) => {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [lastError, setLastError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('llama3.2:3b');
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    checkConnection();
    loadModels();
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const isAvailable = await unifiedAIClient.isAvailable();
      const connectionInfo = unifiedAIClient.getConnectionStatus();
      setStatus(connectionInfo.status);
      setLastError(connectionInfo.lastError);
    } catch (error) {
      setStatus('disconnected');
      setLastError(error instanceof Error ? error.message : 'Connection check failed');
    } finally {
      setIsChecking(false);
    }
  };

  const loadModels = async () => {
    try {
      const models = await unifiedAIClient.getModels();
      setAvailableModels(models);
      // Set the first available model as selected if current selection is not available
      if (models.length > 0 && !models.includes(selectedModel)) {
        setSelectedModel(models[0]);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    if (onModelChange) {
      onModelChange(model);
    }
    // Store preference
    localStorage.setItem('preferred_ai_model', model);
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return '#10b981';
      case 'connecting': return '#f59e0b';
      case 'disconnected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = () => {
    if (isChecking) return 'Checking...';
    switch (status) {
      case 'connected': return 'AI Connected';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'AI Disconnected';
      default: return 'Unknown';
    }
  };

  return (
    <div className="ai-status-indicator">
      <div className="status-container">
        <div className="status-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div 
            className="status-dot"
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: getStatusColor(),
              animation: status === 'connecting' ? 'pulse 1.5s infinite' : 'none'
            }}
          />
          <span style={{ fontSize: '14px', color: getStatusColor() }}>
            {getStatusText()}
          </span>
          <button
            onClick={checkConnection}
            disabled={isChecking}
            style={{
              padding: '2px 8px',
              fontSize: '12px',
              background: 'transparent',
              border: '1px solid currentColor',
              borderRadius: '4px',
              cursor: isChecking ? 'not-allowed' : 'pointer',
              opacity: isChecking ? 0.5 : 1
            }}
          >
            Refresh
          </button>
        </div>

        {lastError && status === 'disconnected' && (
          <div style={{
            fontSize: '12px',
            color: '#ef4444',
            marginTop: '4px',
            padding: '4px 8px',
            backgroundColor: '#fee2e2',
            borderRadius: '4px'
          }}>
            Error: {lastError}
          </div>
        )}

        {showModelSelector && availableModels.length > 0 && (
          <div className="model-selector" style={{ marginTop: '8px' }}>
            <label style={{ fontSize: '12px', marginRight: '8px' }}>
              AI Model:
            </label>
            <select
              value={selectedModel}
              onChange={(e) => handleModelChange(e.target.value)}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                borderRadius: '4px',
                border: '1px solid #d1d5db'
              }}
            >
              {availableModels.map(model => (
                <option key={model} value={model}>
                  {model} {model === 'llama3.2:3b' && '(Recommended)'}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};