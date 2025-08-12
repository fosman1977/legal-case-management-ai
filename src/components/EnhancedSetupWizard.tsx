import React, { useState, useEffect } from 'react';
import { X, Download, CheckCircle, AlertCircle, Cpu, HardDrive, Wifi, Settings, Package, Play, RefreshCw } from 'lucide-react';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  optional?: boolean;
}

interface SystemRequirements {
  hasDocker: boolean;
  dockerVersion?: string;
  dockerRunning: boolean;
  hasDockerCompose: boolean;
  platform: string;
  arch: string;
  memory: number;
  diskSpace: number;
  canInstallDocker: boolean;
}

interface SetupProgress {
  status: string;
  progress: number;
  currentTask?: string;
  details?: string;
}

interface EnhancedSetupWizardProps {
  onClose: () => void;
  onComplete: () => void;
}

export const EnhancedSetupWizard: React.FC<EnhancedSetupWizardProps> = ({ onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [systemReqs, setSystemReqs] = useState<SystemRequirements | null>(null);
  const [setupProgress, setSetupProgress] = useState<SetupProgress>({ status: 'idle', progress: 0 });
  const [isInstalling, setIsInstalling] = useState(false);
  const [installationLogs, setInstallationLogs] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const steps: SetupStep[] = [
    {
      id: 'welcome',
      title: 'Welcome',
      description: 'Welcome to Legal Case Manager AI Setup',
      completed: false
    },
    {
      id: 'system-check',
      title: 'System Check',
      description: 'Verify system requirements and dependencies',
      completed: false
    },
    {
      id: 'docker-setup',
      title: 'Docker Installation',
      description: 'Install and configure Docker for AI processing',
      completed: false
    },
    {
      id: 'localai-setup',
      title: 'LocalAI Setup',
      description: 'Download and configure LocalAI engine',
      completed: false
    },
    {
      id: 'model-setup',
      title: 'AI Models',
      description: 'Download legal-specialized AI models',
      completed: false
    },
    {
      id: 'finalization',
      title: 'Complete',
      description: 'Finalize setup and start using the application',
      completed: false
    }
  ];

  useEffect(() => {
    checkSystemRequirements();
    
    // Listen for progress updates
    const handleDockerInstallProgress = (event: any, data: { status: string; progress: number }) => {
      setSetupProgress({
        status: 'installing-docker',
        progress: data.progress,
        currentTask: 'Installing Docker',
        details: data.status
      });
      addLog(data.status);
    };

    const handleDockerPullProgress = (event: any, data: { status: string; progress: number }) => {
      setSetupProgress({
        status: 'pulling-localai',
        progress: data.progress,
        currentTask: 'Downloading LocalAI',
        details: data.status
      });
      addLog(data.status);
    };

    // @ts-ignore - Electron IPC
    window.electronAPI?.on?.('docker:install-progress', handleDockerInstallProgress);
    // @ts-ignore - Electron IPC
    window.electronAPI?.on?.('docker:pull-progress', handleDockerPullProgress);

    return () => {
      // @ts-ignore - Electron IPC
      window.electronAPI?.removeListener?.('docker:install-progress', handleDockerInstallProgress);
      // @ts-ignore - Electron IPC
      window.electronAPI?.removeListener?.('docker:pull-progress', handleDockerPullProgress);
    };
  }, []);

  const addLog = (message: string) => {
    setInstallationLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const addError = (error: string) => {
    setErrors(prev => [...prev, error]);
    addLog(`ERROR: ${error}`);
  };

  const checkSystemRequirements = async () => {
    try {
      // @ts-ignore - Electron IPC
      const reqs = await window.electronAPI?.docker?.checkRequirements();
      setSystemReqs(reqs);
      addLog(`System check completed - Platform: ${reqs.platform}, RAM: ${reqs.memory.toFixed(1)}GB, Disk: ${reqs.diskSpace.toFixed(1)}GB`);
      
      if (reqs.hasDocker) {
        addLog(`Docker found: ${reqs.dockerVersion}`);
        addLog(`Docker running: ${reqs.dockerRunning ? 'Yes' : 'No'}`);
        addLog(`Docker Compose: ${reqs.hasDockerCompose ? 'Available' : 'Not found'}`);
      } else {
        addLog('Docker not found - will need to install');
      }
    } catch (error) {
      addError('Failed to check system requirements');
      console.error('System requirements check failed:', error);
    }
  };

  const startAutomaticSetup = async () => {
    if (!systemReqs) return;
    
    setIsInstalling(true);
    setSetupProgress({ status: 'starting', progress: 0, currentTask: 'Initializing setup' });
    addLog('Starting automatic setup process...');

    try {
      // Step 1: Install Docker if needed
      if (!systemReqs.hasDocker) {
        if (!systemReqs.canInstallDocker) {
          throw new Error(`Automatic Docker installation is not supported on ${systemReqs.platform}`);
        }

        setSetupProgress({ status: 'installing-docker', progress: 5, currentTask: 'Installing Docker' });
        addLog('Installing Docker...');
        
        // @ts-ignore - Electron IPC
        const dockerInstalled = await window.electronAPI?.docker?.install();
        if (!dockerInstalled) {
          throw new Error('Docker installation failed');
        }
        
        addLog('Docker installed successfully');
      }

      // Step 2: Start Docker Desktop if needed
      if (!systemReqs.dockerRunning) {
        setSetupProgress({ status: 'starting-docker', progress: 25, currentTask: 'Starting Docker' });
        addLog('Starting Docker Desktop...');
        
        // @ts-ignore - Electron IPC
        const dockerStarted = await window.electronAPI?.docker?.startDesktop();
        if (!dockerStarted) {
          throw new Error('Failed to start Docker Desktop');
        }
        
        addLog('Docker Desktop started successfully');
      }

      // Step 3: Install Docker Compose if needed
      if (!systemReqs.hasDockerCompose) {
        setSetupProgress({ status: 'installing-compose', progress: 40, currentTask: 'Installing Docker Compose' });
        addLog('Installing Docker Compose...');
        
        // @ts-ignore - Electron IPC
        const composeInstalled = await window.electronAPI?.docker?.installCompose();
        if (!composeInstalled) {
          addLog('Warning: Docker Compose installation failed, but may not be critical');
        } else {
          addLog('Docker Compose installed successfully');
        }
      }

      // Step 4: Pull LocalAI Docker image
      setSetupProgress({ status: 'pulling-localai', progress: 50, currentTask: 'Downloading LocalAI' });
      addLog('Downloading LocalAI Docker image...');
      
      // @ts-ignore - Electron IPC
      const localAIPulled = await window.electronAPI?.docker?.pullLocalAI();
      if (!localAIPulled) {
        throw new Error('Failed to download LocalAI image');
      }
      
      addLog('LocalAI image downloaded successfully');

      // Step 5: Start LocalAI container
      setSetupProgress({ status: 'starting-localai', progress: 80, currentTask: 'Starting LocalAI' });
      addLog('Starting LocalAI container...');
      
      // @ts-ignore - Electron IPC
      const userDataPath = await window.electronAPI?.getUserDataPath();
      const modelsPath = `${userDataPath}/models`;
      
      // @ts-ignore - Electron IPC
      const localAIStarted = await window.electronAPI?.docker?.startLocalAI(modelsPath, 8080);
      if (!localAIStarted) {
        throw new Error('Failed to start LocalAI container');
      }
      
      addLog('LocalAI container started successfully');

      // Step 6: Complete setup
      setSetupProgress({ status: 'completing', progress: 95, currentTask: 'Finalizing setup' });
      addLog('Completing setup...');
      
      // @ts-ignore - Electron IPC
      await window.electronAPI?.setup?.complete();
      
      setSetupProgress({ status: 'completed', progress: 100, currentTask: 'Setup complete!' });
      addLog('Setup completed successfully! Your Legal Case Manager AI is ready to use.');

      // Auto-advance to completion step
      setTimeout(() => {
        setCurrentStep(steps.length - 1);
        setIsInstalling(false);
      }, 2000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addError(errorMessage);
      setSetupProgress({ 
        status: 'error', 
        progress: 0, 
        currentTask: 'Setup failed',
        details: errorMessage
      });
      setIsInstalling(false);
    }
  };

  const retrySetup = () => {
    setErrors([]);
    setInstallationLogs([]);
    setSetupProgress({ status: 'idle', progress: 0 });
    checkSystemRequirements();
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
          This setup wizard will automatically install and configure everything you need for 
          secure, offline AI-powered legal document analysis.
        </p>
        
        <div className="features-grid">
          <div className="feature">
            <Wifi className="feature-icon" />
            <h3>100% Private</h3>
            <p>All processing happens locally</p>
          </div>
          <div className="feature">
            <HardDrive className="feature-icon" />
            <h3>Fully Automated</h3>
            <p>No terminal or technical knowledge required</p>
          </div>
          <div className="feature">
            <Cpu className="feature-icon" />
            <h3>Professional Grade</h3>
            <p>Legal-specialized AI models</p>
          </div>
        </div>

        <div className="installation-notice">
          <h3>What will be installed:</h3>
          <ul>
            <li>🐳 Docker Desktop (if not already installed)</li>
            <li>🤖 LocalAI engine for private AI processing</li>
            <li>📚 Legal-optimized AI models</li>
            <li>🔧 All necessary dependencies</li>
          </ul>
        </div>

        <div className="system-requirements">
          <h3>System Requirements:</h3>
          <ul>
            <li>8GB RAM minimum (16GB recommended)</li>
            <li>10GB available disk space</li>
            <li>Windows 10/11, macOS 10.14+, or modern Linux</li>
            <li>Internet connection for initial setup</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderSystemCheckStep = () => (
    <div className="setup-step">
      <h2>System Requirements Check</h2>
      <p>Verifying your system is ready for Legal Case Manager AI...</p>
      
      {systemReqs ? (
        <div className="requirements-results">
          <div className={`requirement-item ${systemReqs.memory >= 8 ? 'success' : 'warning'}`}>
            <div className="requirement-icon">
              {systemReqs.memory >= 8 ? <CheckCircle /> : <AlertCircle />}
            </div>
            <div className="requirement-details">
              <h3>Memory (RAM)</h3>
              <p>{systemReqs.memory.toFixed(1)}GB available {systemReqs.memory >= 8 ? '✅' : '⚠️ Low memory may affect performance'}</p>
            </div>
          </div>

          <div className={`requirement-item ${systemReqs.diskSpace >= 10 ? 'success' : 'error'}`}>
            <div className="requirement-icon">
              {systemReqs.diskSpace >= 10 ? <CheckCircle /> : <AlertCircle />}
            </div>
            <div className="requirement-details">
              <h3>Disk Space</h3>
              <p>{systemReqs.diskSpace.toFixed(1)}GB available {systemReqs.diskSpace >= 10 ? '✅' : '❌ Need at least 10GB'}</p>
            </div>
          </div>

          <div className={`requirement-item ${systemReqs.hasDocker ? 'success' : 'info'}`}>
            <div className="requirement-icon">
              {systemReqs.hasDocker ? <CheckCircle /> : <Package />}
            </div>
            <div className="requirement-details">
              <h3>Docker</h3>
              <p>{systemReqs.hasDocker ? `Installed: ${systemReqs.dockerVersion}` : 'Not installed - will be installed automatically'}</p>
            </div>
          </div>

          <div className={`requirement-item ${systemReqs.canInstallDocker ? 'success' : 'error'}`}>
            <div className="requirement-icon">
              {systemReqs.canInstallDocker ? <CheckCircle /> : <AlertCircle />}
            </div>
            <div className="requirement-details">
              <h3>Platform Support</h3>
              <p>{systemReqs.platform} {systemReqs.arch} {systemReqs.canInstallDocker ? '✅ Supported' : '❌ Automatic installation not supported'}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="loading-requirements">
          <RefreshCw className="spin" />
          <p>Checking system requirements...</p>
        </div>
      )}

      <div className="setup-actions">
        <button 
          className="btn btn-secondary"
          onClick={checkSystemRequirements}
          disabled={!systemReqs}
        >
          <RefreshCw className="btn-icon" />
          Re-check System
        </button>
      </div>
    </div>
  );

  const renderAutomaticSetupStep = () => (
    <div className="setup-step">
      <h2>Automatic Installation</h2>
      <p>The setup process will now install and configure all required components automatically.</p>

      {!isInstalling && errors.length === 0 && (
        <div className="pre-installation">
          <div className="installation-plan">
            <h3>Installation Plan:</h3>
            <div className="plan-steps">
              {!systemReqs?.hasDocker && (
                <div className="plan-step">
                  <Download className="plan-icon" />
                  <span>Install Docker Desktop</span>
                </div>
              )}
              {!systemReqs?.dockerRunning && (
                <div className="plan-step">
                  <Play className="plan-icon" />
                  <span>Start Docker Desktop</span>
                </div>
              )}
              <div className="plan-step">
                <Package className="plan-icon" />
                <span>Download LocalAI engine</span>
              </div>
              <div className="plan-step">
                <Settings className="plan-icon" />
                <span>Configure AI environment</span>
              </div>
            </div>
          </div>

          <div className="installation-warning">
            <AlertCircle className="warning-icon" />
            <div>
              <h3>Important Notes:</h3>
              <ul>
                <li>This process may take 15-30 minutes depending on your internet speed</li>
                <li>Administrator permissions may be required for Docker installation</li>
                <li>Do not close this window during installation</li>
                <li>Your antivirus may show warnings - these are safe to allow</li>
              </ul>
            </div>
          </div>

          <div className="setup-actions">
            <button 
              className="btn btn-primary btn-large"
              onClick={startAutomaticSetup}
              disabled={!systemReqs?.canInstallDocker}
            >
              <Download className="btn-icon" />
              Start Automatic Installation
            </button>
          </div>
        </div>
      )}

      {isInstalling && (
        <div className="installation-progress">
          <div className="progress-header">
            <h3>{setupProgress.currentTask}</h3>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${setupProgress.progress}%` }}>
                {Math.round(setupProgress.progress)}%
              </div>
            </div>
          </div>

          {setupProgress.details && (
            <div className="progress-details">
              <p>{setupProgress.details}</p>
            </div>
          )}

          <div className="installation-logs">
            <h4>Installation Log:</h4>
            <div className="log-container">
              {installationLogs.slice(-10).map((log, index) => (
                <div key={index} className="log-entry">{log}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {errors.length > 0 && (
        <div className="installation-errors">
          <div className="error-header">
            <AlertCircle className="error-icon" />
            <h3>Installation Failed</h3>
          </div>
          <div className="error-list">
            {errors.map((error, index) => (
              <div key={index} className="error-item">{error}</div>
            ))}
          </div>
          <div className="error-actions">
            <button 
              className="btn btn-primary"
              onClick={retrySetup}
            >
              <RefreshCw className="btn-icon" />
              Retry Installation
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => addLog('User requested manual setup guide')}
            >
              Manual Setup Guide
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderCompletionStep = () => (
    <div className="setup-step">
      <div className="completion-content">
        <div className="completion-icon">🎉</div>
        <h2>Setup Complete!</h2>
        <p className="completion-message">
          Your Legal Case Manager AI is now ready for secure, offline legal document analysis.
        </p>
        
        <div className="completion-summary">
          <h3>What's been installed:</h3>
          <div className="completion-grid">
            <div className="completion-item">
              <CheckCircle className="completion-item-icon" />
              <div>
                <h4>Docker Engine</h4>
                <p>Container platform for AI processing</p>
              </div>
            </div>
            <div className="completion-item">
              <CheckCircle className="completion-item-icon" />
              <div>
                <h4>LocalAI</h4>
                <p>Private AI engine running locally</p>
              </div>
            </div>
            <div className="completion-item">
              <CheckCircle className="completion-item-icon" />
              <div>
                <h4>Legal AI Models</h4>
                <p>Specialized models for legal document analysis</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="next-steps">
          <h3>Ready to get started:</h3>
          <ul>
            <li>✨ Create your first case</li>
            <li>📄 Upload legal documents for analysis</li>
            <li>🤖 Use AI for chronology extraction and summarization</li>
            <li>🔒 All processing happens privately on your machine</li>
          </ul>
        </div>

        <div className="completion-actions">
          <button 
            className="btn btn-primary btn-large"
            onClick={onComplete}
          >
            Start Using Legal Case Manager AI
          </button>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return renderWelcomeStep();
      case 'system-check':
        return renderSystemCheckStep();
      case 'docker-setup':
      case 'localai-setup':
      case 'model-setup':
        return renderAutomaticSetupStep();
      case 'finalization':
        return renderCompletionStep();
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return true;
      case 'system-check':
        return systemReqs && systemReqs.diskSpace >= 10 && systemReqs.canInstallDocker;
      case 'docker-setup':
      case 'localai-setup':
      case 'model-setup':
        return setupProgress.status === 'completed';
      case 'finalization':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="setup-wizard-overlay">
      <div className="setup-wizard">
        <div className="wizard-header">
          <h1>Legal Case Manager AI Setup</h1>
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
              disabled={currentStep === 0 || isInstalling}
            >
              Previous
            </button>
            
            {currentStep === steps.length - 1 ? (
              <button 
                className="btn btn-primary"
                onClick={onComplete}
              >
                Finish
              </button>
            ) : (
              <button 
                className="btn btn-primary"
                onClick={nextStep}
                disabled={!canProceed() || isInstalling}
              >
                {currentStep === 2 && !isInstalling && setupProgress.status !== 'completed' ? 'Skip to Installation' : 'Next'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};