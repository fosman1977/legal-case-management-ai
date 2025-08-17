import { useState, useEffect } from 'react';
import "./styles.css";
import { Case } from './types';
import { storage } from './utils/storage';
import { CaseList } from './components/CaseList';
import { CaseForm } from './components/CaseForm';
import { CaseDetail } from './components/CaseDetail';
import { GlobalProceduralCalendar } from './components/GlobalProceduralCalendar';
import { LocalAIConnector } from './components/LocalAIConnector';
import { EnhancedSetupWizard } from './components/EnhancedSetupWizard';
import { EngineDiscoveryDashboard } from './components/EngineDiscoveryDashboard';
import { LegalBenchmarkDashboard } from './components/LegalBenchmarkDashboard';
import { ProductionPerformanceDashboard } from './components/ProductionPerformanceDashboard';
import { DatabaseOptimizationDashboard } from './components/DatabaseOptimizationDashboard';
import { EncryptionManagementDashboard } from './components/EncryptionManagementDashboard';
import { AccessLoggingDashboard } from './components/AccessLoggingDashboard';

export default function App() {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | undefined>();
  const [showForm, setShowForm] = useState(false);
  const [editingCase, setEditingCase] = useState<Case | undefined>();
  const [showGlobalCalendar, setShowGlobalCalendar] = useState(false);
  const [showLocalAI, setShowLocalAI] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [showEngineDiscovery, setShowEngineDiscovery] = useState(false);
  const [showLegalBenchmarks, setShowLegalBenchmarks] = useState(false);
  const [showProductionDashboard, setShowProductionDashboard] = useState(false);
  const [showDatabaseDashboard, setShowDatabaseDashboard] = useState(false);
  const [showEncryptionDashboard, setShowEncryptionDashboard] = useState(false);
  const [showAccessLoggingDashboard, setShowAccessLoggingDashboard] = useState(false);

  useEffect(() => {
    loadCases();
    
    // Listen for setup wizard trigger from Electron
    // @ts-ignore - Electron IPC
    if (window.electronAPI?.on) {
      // @ts-ignore - Electron IPC
      window.electronAPI.on('show-setup-wizard', () => {
        setShowSetupWizard(true);
      });
    }
    
    return () => {
      // @ts-ignore - Electron IPC
      if (window.electronAPI?.removeAllListeners) {
        // @ts-ignore - Electron IPC
        window.electronAPI.removeAllListeners('show-setup-wizard');
      }
    };
  }, []);

  const loadCases = async () => {
    try {
      const loadedCases = await storage.getCases();
      setCases(loadedCases);
      if (loadedCases.length > 0 && !selectedCaseId) {
        setSelectedCaseId(loadedCases[0].id);
      }
    } catch (error) {
      console.error('Failed to load cases:', error);
      // Fallback to sync method if async fails
      const fallbackCases = storage.getCasesSync();
      setCases(fallbackCases);
      if (fallbackCases.length > 0 && !selectedCaseId) {
        setSelectedCaseId(fallbackCases[0].id);
      }
    }
  };

  const handleSaveCase = async (caseData: Case) => {
    try {
      await storage.saveCase(caseData);
      await loadCases();
      setShowForm(false);
      setEditingCase(undefined);
      setSelectedCaseId(caseData.id);
    } catch (error) {
      console.error('Failed to save case:', error);
      alert('Failed to save case. Please try again.');
    }
  };

  const handleDeleteCase = async () => {
    if (selectedCaseId) {
      try {
        await storage.deleteCase(selectedCaseId);
        await loadCases();
        setSelectedCaseId(undefined);
      } catch (error) {
        console.error('Failed to delete case:', error);
        alert('Failed to delete case. Please try again.');
      }
    }
  };

  const handleNewCase = () => {
    setEditingCase(undefined);
    setShowForm(true);
  };

  const handleEditCase = () => {
    const caseToEdit = cases.find(c => c.id === selectedCaseId);
    if (caseToEdit) {
      setEditingCase(caseToEdit);
      setShowForm(true);
    }
  };

  const selectedCase = cases.find(c => c.id === selectedCaseId);

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <div className="header-text">
            <h1>Agentic Case Management</h1>
            <p>AI-powered legal case preparation and document analysis platform</p>
          </div>
          <div className="header-actions">
            <button 
              className="btn btn-primary calendar-btn"
              onClick={() => setShowGlobalCalendar(true)}
              title="View all deadlines across all cases"
            >
              📅 Global Calendar
            </button>
            <button 
              className="btn btn-primary ai-btn"
              onClick={() => setShowLocalAI(true)}
              title="Connect to LocalAI for air-gapped AI processing"
            >
              🤖 LocalAI
            </button>
            <button 
              className="btn btn-primary discovery-btn"
              onClick={() => setShowEngineDiscovery(true)}
              title="Engine discovery and performance monitoring"
            >
              🔍 AI Engines
            </button>
            <button 
              className="btn btn-primary benchmark-btn"
              onClick={() => setShowLegalBenchmarks(true)}
              title="Legal reasoning and critical thinking benchmarks"
            >
              ⚖️ Benchmarks
            </button>
            <button 
              className="btn btn-primary production-btn"
              onClick={() => setShowProductionDashboard(true)}
              title="Production performance monitoring and optimization"
            >
              ⚡ Production
            </button>
            <button 
              className="btn btn-primary database-btn"
              onClick={() => setShowDatabaseDashboard(true)}
              title="Database optimization and storage management"
            >
              💾 Database
            </button>
            <button 
              className="btn btn-primary encryption-btn"
              onClick={() => setShowEncryptionDashboard(true)}
              title="Document encryption and security management"
            >
              🔐 Encryption
            </button>
            <button 
              className="btn btn-primary audit-btn"
              onClick={() => setShowAccessLoggingDashboard(true)}
              title="Access logging and audit trail monitoring"
            >
              📋 Audit Trail
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => setShowSetupWizard(true)}
              title="Run setup wizard"
            >
              🔧 Setup
            </button>
          </div>
        </div>
      </header>

      {showGlobalCalendar && (
        <GlobalProceduralCalendar onClose={() => setShowGlobalCalendar(false)} />
      )}

      {showLocalAI && (
        <div className="modal-overlay" onClick={() => setShowLocalAI(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowLocalAI(false)}>×</button>
            <LocalAIConnector />
          </div>
        </div>
      )}

      {showSetupWizard && (
        <EnhancedSetupWizard
          onClose={() => setShowSetupWizard(false)}
          onComplete={() => {
            setShowSetupWizard(false);
            // Optionally reload the app or refresh components
          }}
        />
      )}

      {showEngineDiscovery && (
        <div className="modal-overlay" onClick={() => setShowEngineDiscovery(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowEngineDiscovery(false)}>×</button>
            <EngineDiscoveryDashboard />
          </div>
        </div>
      )}

      {showLegalBenchmarks && (
        <div className="modal-overlay" onClick={() => setShowLegalBenchmarks(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowLegalBenchmarks(false)}>×</button>
            <LegalBenchmarkDashboard />
          </div>
        </div>
      )}

      {showProductionDashboard && (
        <div className="modal-overlay" onClick={() => setShowProductionDashboard(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowProductionDashboard(false)}>×</button>
            <ProductionPerformanceDashboard />
          </div>
        </div>
      )}

      {showDatabaseDashboard && (
        <div className="modal-overlay" onClick={() => setShowDatabaseDashboard(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowDatabaseDashboard(false)}>×</button>
            <DatabaseOptimizationDashboard />
          </div>
        </div>
      )}

      {showEncryptionDashboard && (
        <div className="modal-overlay" onClick={() => setShowEncryptionDashboard(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowEncryptionDashboard(false)}>×</button>
            <EncryptionManagementDashboard />
          </div>
        </div>
      )}

      {showAccessLoggingDashboard && (
        <div className="modal-overlay" onClick={() => setShowAccessLoggingDashboard(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAccessLoggingDashboard(false)}>×</button>
            <AccessLoggingDashboard />
          </div>
        </div>
      )}

      <div className="app-content">
        <aside className="sidebar">
          <CaseList
            cases={cases}
            onSelectCase={setSelectedCaseId}
            selectedCaseId={selectedCaseId}
            onNewCase={handleNewCase}
          />
        </aside>

        <main className="main-content">
          {showForm ? (
            <CaseForm
              initialCase={editingCase}
              onSave={handleSaveCase}
              onCancel={() => {
                setShowForm(false);
                setEditingCase(undefined);
              }}
            />
          ) : selectedCase ? (
            <CaseDetail
              case={selectedCase}
              onEditCase={handleEditCase}
              onDeleteCase={handleDeleteCase}
            />
          ) : (
            <div className="welcome-message">
              <h2>Welcome to Agentic Case Management</h2>
              <p>Create your first case to get started with AI-powered legal document analysis and case preparation.</p>
              <button className="btn btn-primary btn-large" onClick={handleNewCase}>
                Create Your First Case
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
