import React, { useState, useEffect } from 'react';
import { X, Download, CheckCircle, AlertCircle, Cpu, HardDrive, Wifi } from 'lucide-react';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface ModelInfo {
  name: string;
  size: string;
  description: string;
  recommended: boolean;
  useCase: string;
  downloaded: boolean;
  downloading: boolean;
  progress: number;
}

interface SetupWizardProps {
  onClose: () => void;
  onComplete: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [localAIStatus, setLocalAIStatus] = useState<any>(null);
  const [models, setModels] = useState<{ [key: string]: ModelInfo }>({});
  const [selectedModel, setSelectedModel] = useState<string>('mistral-7b-instruct-legal');
  const [isStartingLocalAI, setIsStartingLocalAI] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{ [key: string]: number }>({});

  const steps: SetupStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Legal Case Manager AI',
      description: 'Let\'s set up your secure, air-gapped AI assistant for legal document analysis.',
      completed: false
    },
    {
      id: 'localai-setup',
      title: 'Initialize LocalAI',
      description: 'Download and configure LocalAI for private AI processing on your machine.',
      completed: false
    },
    {
      id: 'model-selection',
      title: 'Choose Your AI Model',
      description: 'Select the best AI model for your legal practice needs.',
      completed: false
    },
    {
      id: 'model-download',
      title: 'Download AI Model',
      description: 'Download your selected model for offline processing.',
      completed: false
    },
    {
      id: 'completion',
      title: 'Setup Complete',
      description: 'Your Legal Case Manager AI is ready to use!',
      completed: false
    }
  ];

  useEffect(() => {
    loadModels();
    
    // Listen for download progress
    const handleDownloadProgress = (event: any, data: { modelName: string; progress: number }) => {
      setDownloadProgress(prev => ({
        ...prev,
        [data.modelName]: data.progress
      }));
      
      setModels(prev => ({
        ...prev,
        [data.modelName]: {
          ...prev[data.modelName],
          downloading: data.progress < 100,
          downloaded: data.progress === 100,
          progress: data.progress
        }
      }));
    };

    // @ts-ignore - Electron IPC
    window.electronAPI?.on?.('localai:download-progress', handleDownloadProgress);

    return () => {
      // @ts-ignore - Electron IPC
      window.electronAPI?.removeListener?.('localai:download-progress', handleDownloadProgress);
    };
  }, []);

  const loadModels = async () => {
    try {
      // @ts-ignore - Electron IPC
      const availableModels = await window.electronAPI?.invoke('localai:get-models');
      if (availableModels) {
        const modelEntries = Object.entries(availableModels).map(([key, model]: [string, any]) => [
          key,
          {
            ...model,
            downloaded: false,
            downloading: false,
            progress: 0
          }
        ]);
        setModels(Object.fromEntries(modelEntries));
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const checkLocalAIStatus = async () => {
    try {
      // @ts-ignore - Electron IPC
      const status = await window.electronAPI?.invoke('localai:status');
      setLocalAIStatus(status);
      return status?.isRunning || false;
    } catch (error) {
      console.error('Failed to check LocalAI status:', error);
      return false;
    }
  };

  const startLocalAI = async () => {
    setIsStartingLocalAI(true);
    try {
      // @ts-ignore - Electron IPC
      const success = await window.electronAPI?.invoke('localai:start');
      if (success) {
        await checkLocalAIStatus();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to start LocalAI:', error);
      return false;
    } finally {
      setIsStartingLocalAI(false);
    }
  };

  const downloadModel = async (modelName: string) => {
    setModels(prev => ({
      ...prev,
      [modelName]: {
        ...prev[modelName],
        downloading: true,
        progress: 0
      }
    }));

    try {
      // @ts-ignore - Electron IPC
      const success = await window.electronAPI?.invoke('localai:download-model', modelName);
      
      if (success) {
        setModels(prev => ({
          ...prev,
          [modelName]: {
            ...prev[modelName],
            downloaded: true,
            downloading: false,
            progress: 100
          }
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to download model:', error);
      setModels(prev => ({
        ...prev,
        [modelName]: {
          ...prev[modelName],
          downloading: false,
          progress: 0
        }
      }));
      return false;
    }
  };

  const completeSetup = async () => {
    try {
      // @ts-ignore - Electron IPC
      await window.electronAPI?.invoke('setup:complete');
      onComplete();
    } catch (error) {
      console.error('Failed to complete setup:', error);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderWelcomeStep = () => (
    <div className="setup-step">
      <div className="welcome-content">
        <div className="welcome-icon">⚖️</div>
        <h2>Welcome to Legal Case Manager AI</h2>
        <p className="welcome-description">
          This setup wizard will configure your secure, air-gapped AI assistant for legal document analysis. 
          All processing happens locally on your machine - no data ever leaves your computer.
        </p>
        
        <div className="features-grid">
          <div className="feature">
            <Wifi className="feature-icon" />
            <h3>100% Offline</h3>
            <p>No internet required after setup</p>
          </div>
          <div className="feature">
            <HardDrive className="feature-icon" />
            <h3>Local Storage</h3>
            <p>All data stays on your machine</p>
          </div>
          <div className="feature">
            <Cpu className="feature-icon" />
            <h3>Powerful AI</h3>
            <p>Legal-specialized models</p>
          </div>
        </div>

        <div className="system-requirements">
          <h3>System Requirements:</h3>
          <ul>
            <li>8GB RAM minimum (16GB recommended)</li>
            <li>10GB available disk space</li>
            <li>Modern CPU (2018 or newer recommended)</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderLocalAISetupStep = () => (
    <div className="setup-step">
      <h2>Initialize LocalAI</h2>
      <p>LocalAI provides the AI processing engine that runs entirely on your machine.</p>
      
      <div className="localai-status">
        {localAIStatus?.isRunning ? (
          <div className="status-success">
            <CheckCircle className="status-icon" />
            <span>LocalAI is running on port {localAIStatus.port}</span>
          </div>
        ) : (
          <div className="status-info">
            <AlertCircle className="status-icon" />
            <span>LocalAI needs to be started</span>
          </div>
        )}
      </div>

      <div className="setup-actions">
        <button 
          className="btn btn-primary"
          onClick={startLocalAI}
          disabled={isStartingLocalAI || localAIStatus?.isRunning}
        >
          {isStartingLocalAI ? 'Starting LocalAI...' : 'Start LocalAI'}
        </button>
        
        <button 
          className="btn btn-secondary"
          onClick={checkLocalAIStatus}
        >
          Check Status
        </button>
      </div>

      {localAIStatus?.isRunning && (
        <div className="success-message">
          ✅ LocalAI is ready! You can proceed to the next step.
        </div>
      )}
    </div>
  );

  const renderModelSelectionStep = () => (
    <div className="setup-step">
      <h2>Choose Your AI Model</h2>
      <p>Select the AI model that best fits your legal practice needs:</p>
      
      <div className="models-grid">
        {Object.entries(models).map(([key, model]) => (
          <div 
            key={key}
            className={`model-card ${selectedModel === key ? 'selected' : ''} ${model.recommended ? 'recommended' : ''}`}
            onClick={() => setSelectedModel(key)}
          >
            {model.recommended && <div className="recommended-badge">Recommended</div>}
            
            <h3>{model.name}</h3>
            <div className="model-size">{model.size}</div>
            <p className="model-description">{model.description}</p>
            
            <div className="model-use-case">
              <strong>Best for:</strong> {model.useCase}
            </div>
            
            {selectedModel === key && (
              <div className="selected-indicator">
                <CheckCircle className="selected-icon" />
                Selected
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="model-recommendation">
        <h3>💡 Recommendation</h3>
        <p>
          For most legal practices, we recommend <strong>Mistral 7B Instruct</strong>. 
          It offers the best balance of accuracy, speed, and resource usage for legal document analysis.
        </p>
      </div>
    </div>
  );

  const renderModelDownloadStep = () => {
    const model = models[selectedModel];
    
    return (
      <div className="setup-step">
        <h2>Download AI Model</h2>
        <p>Downloading your selected AI model to your local machine.</p>
        
        {model && (
          <div className="download-section">
            <div className="model-info">
              <h3>{model.name}</h3>
              <div className="model-details">
                <span>Size: {model.size}</span>
                <span>•</span>
                <span>{model.description}</span>
              </div>
            </div>
            
            {model.downloading ? (
              <div className="download-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${model.progress}%` }}
                  ></div>
                </div>
                <div className="progress-text">
                  Downloading... {Math.round(model.progress)}%
                </div>
              </div>
            ) : model.downloaded ? (
              <div className="download-complete">
                <CheckCircle className="success-icon" />
                <span>Model downloaded successfully!</span>
              </div>
            ) : (
              <div className="download-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => downloadModel(selectedModel)}
                >
                  <Download className="btn-icon" />
                  Download Model
                </button>
              </div>
            )}
          </div>
        )}
        
        <div className="download-info">
          <h4>What happens during download:</h4>
          <ul>
            <li>The AI model is downloaded directly to your computer</li>
            <li>No data is sent to external servers</li>
            <li>The model will be available for offline use</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderCompletionStep = () => (
    <div className="setup-step">
      <div className="completion-content">
        <div className="completion-icon">🎉</div>
        <h2>Setup Complete!</h2>
        <p>Your Legal Case Manager AI is now ready to use.</p>
        
        <div className="completion-summary">
          <h3>What's been configured:</h3>
          <ul>
            <li>✅ LocalAI engine is running</li>
            <li>✅ {models[selectedModel]?.name} model is installed</li>
            <li>✅ Secure, offline processing is enabled</li>
            <li>✅ Your data stays on your machine</li>
          </ul>
        </div>
        
        <div className="next-steps">
          <h3>Next Steps:</h3>
          <ul>
            <li>Create your first case to start analyzing documents</li>
            <li>Upload PDFs, Word docs, or text files for AI analysis</li>
            <li>Use AI-powered chronology extraction and case summarization</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return renderWelcomeStep();
      case 'localai-setup':
        return renderLocalAISetupStep();
      case 'model-selection':
        return renderModelSelectionStep();
      case 'model-download':
        return renderModelDownloadStep();
      case 'completion':
        return renderCompletionStep();
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return true;
      case 'localai-setup':
        return localAIStatus?.isRunning;
      case 'model-selection':
        return selectedModel;
      case 'model-download':
        return models[selectedModel]?.downloaded;
      case 'completion':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="setup-wizard-overlay">
      <div className="setup-wizard">
        <div className="setup-header">
          <h1>Setup Wizard</h1>
          <button className="close-button" onClick={onClose}>
            <X />
          </button>
        </div>
        
        <div className="setup-progress">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`progress-step ${index <= currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
            >
              <div className="step-number">
                {index < currentStep ? '✓' : index + 1}
              </div>
              <div className="step-title">{step.title}</div>
            </div>
          ))}
        </div>
        
        <div className="setup-content">
          {renderCurrentStep()}
        </div>
        
        <div className="setup-footer">
          <button 
            className="btn btn-secondary"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            Previous
          </button>
          
          {currentStep === steps.length - 1 ? (
            <button 
              className="btn btn-primary"
              onClick={completeSetup}
            >
              Finish Setup
            </button>
          ) : (
            <button 
              className="btn btn-primary"
              onClick={nextStep}
              disabled={!canProceed()}
            >
              Next
            </button>
          )}
        </div>
      </div>
      
      <style>{`
        .setup-wizard-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .setup-wizard {
          background: white;
          border-radius: 16px;
          max-width: 800px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .setup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 32px;
          border-bottom: 1px solid #e0e0e0;
        }

        .setup-header h1 {
          margin: 0;
          font-size: 24px;
          color: #333;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          padding: 4px;
        }

        .setup-progress {
          display: flex;
          justify-content: space-between;
          padding: 24px 32px;
          background: #f8f9fa;
        }

        .progress-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          text-align: center;
        }

        .step-number {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #e0e0e0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          margin-bottom: 8px;
          transition: all 0.3s;
        }

        .progress-step.active .step-number {
          background: #667eea;
          color: white;
        }

        .progress-step.completed .step-number {
          background: #10b981;
          color: white;
        }

        .step-title {
          font-size: 12px;
          color: #666;
          max-width: 120px;
        }

        .setup-content {
          padding: 32px;
          flex: 1;
        }

        .setup-step h2 {
          margin: 0 0 16px 0;
          color: #333;
        }

        .welcome-content {
          text-align: center;
        }

        .welcome-icon {
          font-size: 64px;
          margin-bottom: 24px;
        }

        .welcome-description {
          font-size: 16px;
          color: #666;
          margin-bottom: 32px;
          line-height: 1.6;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-bottom: 32px;
        }

        .feature {
          text-align: center;
          padding: 20px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          color: #667eea;
          margin-bottom: 16px;
        }

        .feature h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          color: #333;
        }

        .feature p {
          margin: 0;
          color: #666;
          font-size: 14px;
        }

        .system-requirements {
          text-align: left;
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
        }

        .system-requirements h3 {
          margin: 0 0 12px 0;
          color: #333;
        }

        .system-requirements ul {
          margin: 0;
          padding-left: 20px;
          color: #666;
        }

        .localai-status {
          margin: 24px 0;
        }

        .status-success {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #10b981;
          font-weight: 500;
        }

        .status-info {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #f59e0b;
          font-weight: 500;
        }

        .setup-actions {
          display: flex;
          gap: 12px;
          margin: 24px 0;
        }

        .success-message {
          background: #dcfce7;
          color: #166534;
          padding: 12px;
          border-radius: 8px;
          margin-top: 16px;
        }

        .models-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
          margin: 24px 0;
        }

        .model-card {
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
        }

        .model-card:hover {
          border-color: #667eea;
        }

        .model-card.selected {
          border-color: #667eea;
          background: #f0f4ff;
        }

        .model-card.recommended {
          border-color: #10b981;
        }

        .recommended-badge {
          position: absolute;
          top: -8px;
          right: 16px;
          background: #10b981;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }

        .model-card h3 {
          margin: 0 0 8px 0;
          color: #333;
        }

        .model-size {
          color: #667eea;
          font-weight: bold;
          margin-bottom: 12px;
        }

        .model-description {
          color: #666;
          margin-bottom: 16px;
          line-height: 1.5;
        }

        .model-use-case {
          color: #333;
          font-size: 14px;
          background: #f8f9fa;
          padding: 8px;
          border-radius: 4px;
        }

        .selected-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #667eea;
          font-weight: bold;
          margin-top: 12px;
        }

        .selected-icon {
          width: 20px;
          height: 20px;
        }

        .model-recommendation {
          background: #fffbeb;
          border: 1px solid #fbbf24;
          border-radius: 8px;
          padding: 16px;
          margin-top: 24px;
        }

        .model-recommendation h3 {
          margin: 0 0 8px 0;
          color: #92400e;
        }

        .download-section {
          margin: 24px 0;
        }

        .model-info h3 {
          margin: 0 0 8px 0;
          color: #333;
        }

        .model-details {
          color: #666;
          display: flex;
          gap: 8px;
          align-items: center;
          margin-bottom: 20px;
        }

        .download-progress {
          margin: 16px 0;
        }

        .progress-bar {
          background: #e0e0e0;
          border-radius: 8px;
          height: 8px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          background: #667eea;
          height: 100%;
          transition: width 0.3s ease;
        }

        .progress-text {
          text-align: center;
          color: #666;
          font-weight: 500;
        }

        .download-complete {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #10b981;
          font-weight: 500;
        }

        .success-icon {
          width: 20px;
          height: 20px;
        }

        .download-actions {
          margin: 16px 0;
        }

        .btn-icon {
          width: 16px;
          height: 16px;
          margin-right: 8px;
        }

        .download-info {
          background: #f0f4ff;
          border: 1px solid #667eea;
          border-radius: 8px;
          padding: 16px;
          margin-top: 24px;
        }

        .download-info h4 {
          margin: 0 0 8px 0;
          color: #333;
        }

        .download-info ul {
          margin: 0;
          padding-left: 20px;
          color: #666;
        }

        .completion-content {
          text-align: center;
        }

        .completion-icon {
          font-size: 64px;
          margin-bottom: 24px;
        }

        .completion-summary,
        .next-steps {
          text-align: left;
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin: 24px 0;
        }

        .completion-summary h3,
        .next-steps h3 {
          margin: 0 0 12px 0;
          color: #333;
        }

        .completion-summary ul,
        .next-steps ul {
          margin: 0;
          padding-left: 20px;
          color: #666;
        }

        .setup-footer {
          display: flex;
          justify-content: space-between;
          padding: 24px 32px;
          border-top: 1px solid #e0e0e0;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          transition: all 0.3s;
        }

        .btn-primary {
          background: #667eea;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #5a67d8;
        }

        .btn-secondary {
          background: #6b7280;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #4b5563;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};