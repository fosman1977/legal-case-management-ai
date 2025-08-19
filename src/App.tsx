import { useState, useEffect } from 'react';
import "./styles.css";
import "./styles/design-system.css";
import "./styles/components.css";
import { Case } from './types';
import { storage } from './utils/storage';
import { AppHeader } from './components/AppHeader';
import { CleanDashboard } from './components/CleanDashboard';
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
import { UniversalCommandCenter } from './components/UniversalCommandCenter';
import { SmartCaseClassification } from './components/SmartCaseClassification';
import { IntelligentDocumentViewer } from './components/IntelligentDocumentViewer';
import { AdvancedLegalSearch } from './components/AdvancedLegalSearch';
import { LegalKnowledgeGraph } from './components/LegalKnowledgeGraph';

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
  const [showCommandCenter, setShowCommandCenter] = useState(false);
  const [showCaseClassification, setShowCaseClassification] = useState(false);
  const [newCaseName, setNewCaseName] = useState('');
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showKnowledgeGraph, setShowKnowledgeGraph] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);

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
    
    // Global keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K for Command Center
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandCenter(true);
      }
      
      // Cmd+N or Ctrl+N for New Case
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        handleNewCase();
      }
      
      // Cmd+F or Ctrl+F for Advanced Search
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setShowAdvancedSearch(true);
      }
      
      // Cmd+G or Ctrl+G for Knowledge Graph
      if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
        e.preventDefault();
        setShowKnowledgeGraph(true);
      }
      
      // Escape to close modals
      if (e.key === 'Escape') {
        setShowCommandCenter(false);
        setShowCaseClassification(false);
        setShowDocumentViewer(false);
        setShowAdvancedSearch(false);
        setShowKnowledgeGraph(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
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

  const handleSmartNewCase = (caseName: string) => {
    setNewCaseName(caseName);
    setShowCaseClassification(true);
  };

  const handleClassificationComplete = (result: any) => {
    // Create a new case with the classification data
    const newCase: Case = {
      id: self.crypto?.randomUUID?.() || `case_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: newCaseName,
      description: `Classified as ${result.primaryType.toUpperCase()} case with ${Math.round(result.confidence * 100)}% confidence`,
      status: 'active',
      priority: result.estimatedComplexity === 'very_high' ? 'high' : 
                result.estimatedComplexity === 'high' ? 'high' : 'medium',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: result.subCategories,
      documents: [],
      timeline: [],
      metadata: {
        classification: result,
        practiceArea: result.primaryType,
        aiConfidence: result.confidence,
        suggestedFeatures: result.suggestedFeatures,
        estimatedDuration: result.estimatedDuration,
        fundingOptions: result.fundingOptions
      }
    };

    handleSaveCase(newCase);
    setShowCaseClassification(false);
    setNewCaseName('');
  };

  const handleEditCase = () => {
    const caseToEdit = cases.find(c => c.id === selectedCaseId);
    if (caseToEdit) {
      setEditingCase(caseToEdit);
      setShowForm(true);
    }
  };

  const selectedCase = cases.find(c => c.id === selectedCaseId);

  // Show case detail if a case is selected
  if (selectedCase) {
    return (
      <div className="App">
        <AppHeader
          onCommandCenter={() => setShowCommandCenter(true)}
          onSearch={() => setShowAdvancedSearch(true)}
        />
        
        <CaseDetail
          case={selectedCase}
          onEditCase={handleEditCase}
          onDeleteCase={() => {
            setCases(prev => prev.filter(c => c.id !== selectedCase.id));
            setSelectedCaseId(undefined);
          }}
        />
        
        {/* Keep modals for advanced features */}
        <UniversalCommandCenter
          isOpen={showCommandCenter}
          onClose={() => setShowCommandCenter(false)}
          currentContext={{
            caseId: selectedCase.id,
            documentId: undefined,
            pageUrl: window.location.href,
            selectedText: undefined
          }}
        />
        
        {showAdvancedSearch && (
          <div className="modal-overlay" onClick={() => setShowAdvancedSearch(false)}>
            <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
              <div className="card-header flex-between">
                <h2 className="heading-2">Advanced Search</h2>
                <button className="btn btn-ghost" onClick={() => setShowAdvancedSearch(false)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className="card-content">
                <AdvancedLegalSearch 
                  isOpen={true} 
                  onClose={() => setShowAdvancedSearch(false)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="App">
      <AppHeader
        onCommandCenter={() => setShowCommandCenter(true)}
        onSearch={() => setShowAdvancedSearch(true)}
      />
      
      <CleanDashboard
        cases={cases}
        onNewCase={() => setShowForm(true)}
        onSelectCase={setSelectedCaseId}
        onOpenCommand={() => setShowCommandCenter(true)}
      />

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => {
          setShowForm(false);
          setEditingCase(undefined);
        }}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex-between">
              <h2 className="heading-2">
                {editingCase ? 'Edit Case' : 'New Case'}
              </h2>
              <button 
                className="btn btn-ghost" 
                onClick={() => {
                  setShowForm(false);
                  setEditingCase(undefined);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="card-content">
              <CaseForm
                initialCase={editingCase}
                onSave={handleSaveCase}
                onCancel={() => {
                  setShowForm(false);
                  setEditingCase(undefined);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Command Center */}
      <UniversalCommandCenter
        isOpen={showCommandCenter}
        onClose={() => setShowCommandCenter(false)}
        currentContext={{
          caseId: undefined,
          documentId: undefined,
          pageUrl: window.location.href,
          selectedText: undefined
        }}
      />

      {/* Advanced Search Modal */}
      {showAdvancedSearch && (
        <div className="modal-overlay" onClick={() => setShowAdvancedSearch(false)}>
          <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex-between">
              <h2 className="heading-2">Advanced Search</h2>
              <button className="btn btn-ghost" onClick={() => setShowAdvancedSearch(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="card-content">
              <AdvancedLegalSearch 
                isOpen={true} 
                onClose={() => setShowAdvancedSearch(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Calendar Modal */}
      {showGlobalCalendar && (
        <div className="modal-overlay" onClick={() => setShowGlobalCalendar(false)}>
          <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex-between">
              <h2 className="heading-2">Global Calendar</h2>
              <button className="btn btn-ghost" onClick={() => setShowGlobalCalendar(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="card-content">
              <GlobalProceduralCalendar onClose={() => setShowGlobalCalendar(false)} />
            </div>
          </div>
        </div>
      )}

      {/* LocalAI Modal */}
      {showLocalAI && (
        <div className="modal-overlay" onClick={() => setShowLocalAI(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex-between">
              <h2 className="heading-2">LocalAI Connection</h2>
              <button className="btn btn-ghost" onClick={() => setShowLocalAI(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="card-content">
              <LocalAIConnector />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
