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
      const availableModels = await window.electronAPI?.localAI?.getModels();
      if (availableModels) {
        setModels(availableModels);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const checkLocalAIStatus = async () => {
    try {
      // @ts-ignore - Electron IPC
      const status = await window.electronAPI?.localAI?.status();
      setLocalAIStatus(status);
      return status;
    } catch (error) {
      console.error('Failed to check LocalAI status:', error);
      return null;
    }
  };

  useEffect(() => {
    checkLocalAIStatus();
  }, []);

  const startLocalAI = async () => {
    setIsStartingLocalAI(true);
    try {
      // @ts-ignore - Electron IPC
      const started = await window.electronAPI?.localAI?.start();
      if (started) {
        await checkLocalAIStatus();
      }
    } catch (error) {
      console.error('Failed to start LocalAI:', error);
    } finally {
      setIsStartingLocalAI(false);
    }
  };

  const downloadModel = async () => {
    if (!selectedModel) return;
    
    try {
      // @ts-ignore - Electron IPC
      const success = await window.electronAPI?.localAI?.downloadModel(selectedModel);
      if (success) {
        await loadModels();
      }
    } catch (error) {
      console.error('Failed to download model:', error);
    }
  };

  const completeSetup = async () => {
    try {
      // @ts-ignore - Electron IPC
      await window.electronAPI?.setup?.complete();
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
      
      <div className="model-list">
        {Object.entries(models).map(([key, model]) => (
          <div 
            key={key}
            className={`model-card ${selectedModel === key ? 'selected' : ''} ${model.recommended ? 'recommended' : ''}`}
            onClick={() => setSelectedModel(key)}
          >
            <div className="model-header">
              <div>
                <span className="model-name">{model.name}</span>
                {model.recommended && <span className="recommended-badge">RECOMMENDED</span>}
              </div>
              <span className="model-size">{model.size}</span>
            </div>
            <p className="model-description">{model.description}</p>
            <p className="model-usecase">📋 {model.useCase}</p>
            {selectedModel === key && (
              <div className="selected-indicator">
                <CheckCircle className="selected-icon" />
                <span>Selected</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedModel && (
        <div className="model-recommendation">
          <h3>Good Choice!</h3>
          <p>{models[selectedModel]?.name} is {models[selectedModel]?.recommended ? 'our recommended model' : 'a solid choice'} for legal document analysis.</p>
        </div>
      )}
    </div>
  );

  const renderModelDownloadStep = () => {
    const model = models[selectedModel];
    const progress = downloadProgress[selectedModel] || 0;
    
    return (
      <div className="setup-step">
        <h2>Download {model?.name}</h2>
        <p>The model will be downloaded and stored locally for offline use.</p>
        
        {model?.downloading ? (
          <div className="download-progress">
            <h3>Downloading...</h3>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${progress}%` }}>
                {Math.round(progress)}%
              </div>
            </div>
            <p className="download-status">This may take several minutes depending on your connection speed.</p>
          </div>
        ) : model?.downloaded ? (
          <div className="success-message">
            ✅ Model downloaded successfully! You can proceed to complete the setup.
          </div>
        ) : (
          <div className="download-prompt">
            <div className="model-info">
              <h3>{model?.name}</h3>
              <p>Size: {model?.size}</p>
              <p>{model?.description}</p>
            </div>
            
            <button 
              className="btn btn-primary"
              onClick={downloadModel}
            >
              <Download className="btn-icon" />
              Download Model
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderCompletionStep = () => (
    <div className="setup-step">
      <div className="completion-content">
        <div className="completion-icon">🎉</div>
        <h2>Setup Complete!</h2>
        <p className="completion-message">Your Legal Case Manager AI is now ready to use.</p>
        
        <div className="completion-details">
          <h3>What's been configured:</h3>
          <ul>
            <li>✅ LocalAI engine is running</li>
            <li>✅ {models[selectedModel]?.name} model is installed</li>
            <li>✅ Secure, offline processing is enabled</li>
            <li>✅ Your data stays on your machine</li>
          </ul>
        </div>
        
        <div className="completion-details">
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
        <div className="wizard-header">
          <h1>Setup Wizard</h1>
          <button className="wizard-close" onClick={onClose}>
            <X />
          </button>
        </div>
        
        <div className="wizard-progress">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`progress-step ${index <= currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
            >
              <div className="step-circle">
                {index < currentStep ? '✓' : index + 1}
              </div>
              <div className="step-label">{step.title}</div>
            </div>
          ))}
        </div>
        
        <div className="wizard-content">
          {renderCurrentStep()}
        </div>
        
        <div className="wizard-footer">
          <div className="wizard-nav">
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
      </div>
    </div>
  );
};