import React, { useState, useEffect } from 'react';
import { localAIService, LocalAIStatus } from '../services/localAIService';
import { AIModelMigration } from '../utils/aiModelMigration';

export const LocalAIConnector: React.FC = () => {
  const [status, setStatus] = useState<LocalAIStatus>(localAIService.getStatus());
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [endpoint, setEndpoint] = useState('http://localhost:8080');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    // Subscribe to status changes
    const unsubscribe = localAIService.onStatusChange(setStatus);
    
    // Run model migration on component load
    AIModelMigration.migrateStoredPreferences().catch(console.warn);
    
    return unsubscribe;
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await localAIService.connect(endpoint);
    } catch (error) {
      // Error is already shown in the status
      console.error('Connection failed:', error);
      // Show user-friendly alert
      if (error instanceof Error && error.message.includes('not running')) {
        if (window.confirm('LocalAI is not running. Would you like to see setup instructions?')) {
          setShowAdvanced(true);
        }
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    localAIService.disconnect();
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const success = await localAIService.test();
      alert(success ? '✅ LocalAI is working correctly!' : '❌ LocalAI test failed');
    } catch (error) {
      alert(`❌ Test failed: ${error}`);
    } finally {
      setTesting(false);
    }
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    try {
      localAIService.setModel(e.target.value);
    } catch (error) {
      console.error('Failed to set model:', error);
    }
  };

  return (
    <div className="localai-connector">
      <div className="card">
        <div className="card-header">
          <h3>
            🤖 LocalAI Connection
            <span className={`status-badge ${status.connected ? 'connected' : 'disconnected'}`}>
              {status.connected ? '● Connected' : '○ Disconnected'}
            </span>
          </h3>
        </div>

        <div className="card-body">
          {!status.connected ? (
            <div className="connect-section">
              <p className="description">
                Connect to LocalAI for air-gapped AI processing. All data stays on your machine.
              </p>

              <div className="endpoint-input">
                <label>LocalAI Endpoint:</label>
                <input
                  type="text"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="http://localhost:8080"
                  disabled={connecting}
                />
              </div>

              <button
                className="btn btn-primary btn-large"
                onClick={handleConnect}
                disabled={connecting}
              >
                {connecting ? (
                  <>
                    <span className="spinner"></span>
                    Connecting...
                  </>
                ) : (
                  <>
                    🚀 One-Click Connect
                  </>
                )}
              </button>

              <button
                className="btn btn-link"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? '▼' : '▶'} Advanced Setup
              </button>

              {showAdvanced && (
                <div className="advanced-section">
                  <h4>Setup Instructions:</h4>
                  <div className="setup-steps">
                    <div className="step">
                      <span className="step-number">1</span>
                      <div>
                        <strong>Install Docker:</strong>
                        <code>curl -fsSL https://get.docker.com | sh</code>
                      </div>
                    </div>
                    <div className="step">
                      <span className="step-number">2</span>
                      <div>
                        <strong>Start LocalAI:</strong>
                        <code>docker-compose -f docker-compose.minimal.yml up -d</code>
                      </div>
                    </div>
                    <div className="step">
                      <span className="step-number">3</span>
                      <div>
                        <strong>Click Connect above!</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {status.error && (
                <div className="error-message">
                  ⚠️ {status.error}
                </div>
              )}
            </div>
          ) : (
            <div className="connected-section">
              <div className="connection-info">
                <div className="info-row">
                  <span className="label">Endpoint:</span>
                  <span className="value">{status.endpoint}</span>
                </div>
                <div className="info-row">
                  <span className="label">Last Check:</span>
                  <span className="value">
                    {status.lastCheck ? new Date(status.lastCheck).toLocaleTimeString() : 'Never'}
                  </span>
                </div>
              </div>

              <div className="model-selector">
                <label>Active Model:</label>
                <select 
                  value={status.currentModel} 
                  onChange={handleModelChange}
                  className="model-dropdown"
                >
                  {status.availableModels.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>

              <div className="available-models">
                <h4>Available Models ({status.availableModels.length}):</h4>
                <div className="model-list">
                  {status.availableModels.map(model => (
                    <div key={model} className="model-item">
                      <span className="model-name">{model}</span>
                      {model === status.currentModel && (
                        <span className="active-badge">Active</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="action-buttons">
                <button
                  className="btn btn-secondary"
                  onClick={handleTest}
                  disabled={testing}
                >
                  {testing ? 'Testing...' : '🧪 Test Connection'}
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleDisconnect}
                >
                  🔌 Disconnect
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .localai-connector {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }

        .card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .card-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
        }

        .card-header h3 {
          margin: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 24px;
        }

        .status-badge {
          font-size: 14px;
          padding: 6px 12px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.2);
        }

        .status-badge.connected {
          background: #10b981;
        }

        .status-badge.disconnected {
          background: #ef4444;
        }

        .card-body {
          padding: 24px;
        }

        .description {
          color: #666;
          margin-bottom: 24px;
          font-size: 16px;
        }

        .endpoint-input {
          margin-bottom: 20px;
        }

        .endpoint-input label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
        }

        .endpoint-input input {
          width: 100%;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.3s;
        }

        .endpoint-input input:focus {
          outline: none;
          border-color: #667eea;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          width: 100%;
          justify-content: center;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-large {
          padding: 16px 32px;
          font-size: 18px;
        }

        .btn-secondary {
          background: #6b7280;
          color: white;
        }

        .btn-secondary:hover {
          background: #4b5563;
        }

        .btn-danger {
          background: #ef4444;
          color: white;
        }

        .btn-danger:hover {
          background: #dc2626;
        }

        .btn-link {
          background: none;
          color: #667eea;
          margin-top: 16px;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .advanced-section {
          margin-top: 20px;
          padding: 20px;
          background: #f9fafb;
          border-radius: 8px;
        }

        .advanced-section h4 {
          margin-top: 0;
          color: #333;
        }

        .setup-steps {
          margin-top: 16px;
        }

        .step {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
        }

        .step-number {
          width: 28px;
          height: 28px;
          background: #667eea;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          flex-shrink: 0;
        }

        code {
          background: #1f2937;
          color: #10b981;
          padding: 4px 8px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          display: block;
          margin-top: 4px;
        }

        .error-message {
          margin-top: 16px;
          padding: 12px;
          background: #fee;
          border: 1px solid #fcc;
          border-radius: 8px;
          color: #c00;
        }

        .connected-section {
          animation: fadeIn 0.3s ease-in;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .connection-info {
          background: #f0f9ff;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .info-row:last-child {
          margin-bottom: 0;
        }

        .label {
          font-weight: 600;
          color: #666;
        }

        .value {
          color: #333;
        }

        .model-selector {
          margin-bottom: 20px;
        }

        .model-selector label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
        }

        .model-dropdown {
          width: 100%;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 16px;
          background: white;
          cursor: pointer;
        }

        .available-models h4 {
          color: #333;
          margin-bottom: 12px;
        }

        .model-list {
          display: grid;
          gap: 8px;
        }

        .model-item {
          padding: 12px;
          background: #f9fafb;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .model-name {
          font-weight: 500;
          color: #333;
        }

        .active-badge {
          background: #10b981;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .action-buttons .btn {
          flex: 1;
        }
      `}</style>
    </div>
  );
};