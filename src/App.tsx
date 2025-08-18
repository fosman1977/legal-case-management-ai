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

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <div className="header-text">
            <h1>Agentic Legal Intelligence</h1>
            <p>Revolutionary AI-powered legal intelligence platform</p>
          </div>
          <div className="header-actions">
            <button 
              className="btn btn-primary command-center-btn"
              onClick={() => setShowCommandCenter(true)}
              title="Universal Command Center (Cmd+K)"
            >
              🚀 Command Center
            </button>
            <button 
              className="btn btn-primary search-btn"
              onClick={() => setShowAdvancedSearch(true)}
              title="Advanced Legal Search (Cmd+F)"
            >
              🔍 Intelligent Search
            </button>
            <button 
              className="btn btn-primary knowledge-graph-btn"
              onClick={() => setShowKnowledgeGraph(true)}
              title="Legal Knowledge Graph (Cmd+G)"
            >
              🧠 Knowledge Graph
            </button>
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

      {/* Revolutionary Command Center */}
      <UniversalCommandCenter
        isOpen={showCommandCenter}
        onClose={() => setShowCommandCenter(false)}
        currentContext={{
          caseId: selectedCase?.id,
          documentId: undefined, // TODO: Add current document context
          pageUrl: window.location.href,
          selectedText: undefined // TODO: Add selected text detection
        }}
      />

      {/* Smart Case Classification */}
      {showCaseClassification && (
        <div className="modal-overlay" onClick={() => setShowCaseClassification(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <SmartCaseClassification
              caseName={newCaseName}
              onClassificationComplete={handleClassificationComplete}
              onClose={() => setShowCaseClassification(false)}
            />
          </div>
        </div>
      )}

      {/* Advanced Legal Search */}
      {showAdvancedSearch && (
        <AdvancedLegalSearch
          isOpen={showAdvancedSearch}
          onClose={() => setShowAdvancedSearch(false)}
          caseContext={selectedCase ? {
            caseId: selectedCase.id,
            practiceArea: selectedCase.metadata?.practiceArea || 'mixed',
            currentTags: selectedCase.tags
          } : undefined}
          onResultSelect={(result) => {
            console.log('Search result selected:', result);
            // TODO: Handle search result selection (open document, navigate, etc.)
          }}
        />
      )}

      {/* Intelligent Document Viewer */}
      {showDocumentViewer && selectedDocument && (
        <IntelligentDocumentViewer
          documentId={selectedDocument.id || 'unknown'}
          documentTitle={selectedDocument.title || 'Document'}
          documentContent={selectedDocument.content || 'Document content not available'}
          documentType={selectedDocument.type || 'witness_statement'}
          caseContext={selectedCase ? {
            caseId: selectedCase.id,
            practiceArea: selectedCase.metadata?.practiceArea || 'mixed',
            relatedDocuments: selectedCase.documents?.map(d => d.id) || []
          } : undefined}
          onClose={() => {
            setShowDocumentViewer(false);
            setSelectedDocument(null);
          }}
          onTagCreate={(tag) => {
            console.log('New tag created:', tag);
            // TODO: Save tag to document/case
          }}
          onAnnotationCreate={(annotation) => {
            console.log('New annotation created:', annotation);
            // TODO: Save annotation to document
          }}
        />
      )}

      {/* Legal Knowledge Graph */}
      {showKnowledgeGraph && (
        <LegalKnowledgeGraph
          isOpen={showKnowledgeGraph}
          onClose={() => setShowKnowledgeGraph(false)}
          caseContext={selectedCase ? {
            caseId: selectedCase.id,
            practiceArea: selectedCase.metadata?.practiceArea || 'mixed'
          } : undefined}
          onNodeSelect={(node) => {
            console.log('Knowledge graph node selected:', node);
            // TODO: Handle node selection (navigate to case, document, etc.)
          }}
          onInsightSelect={(insight) => {
            console.log('Knowledge graph insight selected:', insight);
            // TODO: Handle insight selection (show details, take action, etc.)
          }}
        />
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
              <h2>Welcome to Agentic Legal Intelligence</h2>
              <p>Revolutionary AI-powered legal intelligence for English practice. Start with intelligent case classification or use the Command Center.</p>
              <div className="welcome-actions">
                <button className="btn btn-primary btn-large" onClick={() => handleSmartNewCase('R v ')}>
                  🤖 Smart Case Creation
                </button>
                <button className="btn btn-secondary btn-large" onClick={handleNewCase}>
                  📁 Manual Case Creation
                </button>
                <button className="btn btn-tertiary btn-large" onClick={() => setShowCommandCenter(true)}>
                  🚀 Open Command Center (Cmd+K)
                </button>
              </div>
              <div className="quick-tips">
                <h3>💡 Quick Tips:</h3>
                <ul>
                  <li><kbd>Cmd+K</kbd> - Open Universal Command Center anywhere</li>
                  <li><kbd>Cmd+N</kbd> - Create new case quickly</li>
                  <li>Use natural language commands for analysis</li>
                  <li>AI automatically classifies cases by English legal practice</li>
                </ul>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
