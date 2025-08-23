import { useState, useEffect } from 'react';
import "./styles.css";
import "./styles/design-system.css";
import "./styles/components.css";
import "./styles/ParallelAI.css";
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
import { ParallelAIResearchDashboard } from './components/ParallelAIResearchDashboard';
import { PleadingsManager } from './components/PleadingsManager';
import { PresentationPrep } from './components/PresentationPrep';
import { InsightGenerationEngine } from './components/InsightGenerationEngine';
import { EnhancedKeyPointsPresentation } from './components/EnhancedKeyPointsPresentation';
import { LNATDashboard } from './components/LNATDashboard';
import { ComprehensiveLegalTestingDashboard } from './components/ComprehensiveLegalTestingDashboard';
import { BackendServicesStatus } from './components/BackendServicesStatus';
import { ComplianceConfirmationSystem } from './components/ComplianceConfirmationSystem';
import { ModernSidebar } from './components/ModernSidebar';

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
  const [showParallelResearch, setShowParallelResearch] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Additional modal states for missing functionality
  const [showPleadingsManager, setShowPleadingsManager] = useState(false);
  const [showPresentationPrep, setShowPresentationPrep] = useState(false);
  const [showInsightGeneration, setShowInsightGeneration] = useState(false);
  const [showKeyPointsPresentation, setShowKeyPointsPresentation] = useState(false);
  const [showLNATTesting, setShowLNATTesting] = useState(false);
  const [showComprehensiveTesting, setShowComprehensiveTesting] = useState(false);
  const [showBackendStatus, setShowBackendStatus] = useState(false);
  const [showCompliance, setShowCompliance] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [showDocumentProcessing, setShowDocumentProcessing] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showAuthorities, setShowAuthorities] = useState(false);
  const [showParties, setShowParties] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

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
        setShowParallelResearch(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Custom event listeners for menu items
    const handleShowCalendar = () => setShowGlobalCalendar(true);
    const handleShowEngineDiscovery = () => setShowEngineDiscovery(true);
    const handleShowBenchmarks = () => setShowLegalBenchmarks(true);
    const handleShowProductionDashboard = () => setShowProductionDashboard(true);
    const handleShowEncryptionDashboard = () => setShowEncryptionDashboard(true);
    const handleShowAccessLogging = () => setShowAccessLoggingDashboard(true);
    const handleShowDatabaseOptimization = () => setShowDatabaseDashboard(true);
    const handleShowLocalAI = () => setShowLocalAI(true);
    const handleShowSetupWizard = () => setShowSetupWizard(true);
    const handleShowCaseClassification = () => setShowCaseClassification(true);
    const handleShowParallelResearch = () => setShowParallelResearch(true);
    
    window.addEventListener('show-calendar', handleShowCalendar);
    window.addEventListener('show-engine-discovery', handleShowEngineDiscovery);
    window.addEventListener('show-benchmarks', handleShowBenchmarks);
    window.addEventListener('show-production-dashboard', handleShowProductionDashboard);
    window.addEventListener('show-encryption-dashboard', handleShowEncryptionDashboard);
    window.addEventListener('show-access-logging', handleShowAccessLogging);
    window.addEventListener('show-database-optimization', handleShowDatabaseOptimization);
    window.addEventListener('show-localai', handleShowLocalAI);
    window.addEventListener('show-setup-wizard', handleShowSetupWizard);
    window.addEventListener('show-case-classification', handleShowCaseClassification);
    window.addEventListener('show-parallel-research', handleShowParallelResearch);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('show-calendar', handleShowCalendar);
      window.removeEventListener('show-engine-discovery', handleShowEngineDiscovery);
      window.removeEventListener('show-benchmarks', handleShowBenchmarks);
      window.removeEventListener('show-production-dashboard', handleShowProductionDashboard);
      window.removeEventListener('show-encryption-dashboard', handleShowEncryptionDashboard);
      window.removeEventListener('show-access-logging', handleShowAccessLogging);
      window.removeEventListener('show-database-optimization', handleShowDatabaseOptimization);
      window.removeEventListener('show-localai', handleShowLocalAI);
      window.removeEventListener('show-setup-wizard', handleShowSetupWizard);
      window.removeEventListener('show-case-classification', handleShowCaseClassification);
      window.removeEventListener('show-parallel-research', handleShowParallelResearch);
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

  const handleNavigation = (view: string, context?: any) => {
    console.log('Navigation clicked:', view);
    setCurrentView(view);
    
    // Handle specific navigation actions
    switch (view) {
      case 'dashboard':
        setSelectedCaseId(undefined);
        break;
      case 'cases-create':
        handleNewCase();
        break;
      case 'research-parallel-ai':
        setShowParallelResearch(true);
        break;
      case 'research-advanced-search':
        setShowAdvancedSearch(true);
        break;
      case 'research-knowledge-graph':
        setShowKnowledgeGraph(true);
        break;
      case 'analysis-classification':
        setShowCaseClassification(true);
        break;
      case 'tools-engine-discovery':
        setShowEngineDiscovery(true);
        break;
      case 'tools-benchmarks':
        setShowLegalBenchmarks(true);
        break;
      case 'tools-optimization':
        setShowDatabaseDashboard(true);
        break;
      case 'tools-health':
        setShowProductionDashboard(true);
        break;
      case 'documents-manager':
        setShowDocumentViewer(true);
        break;
      case 'documents-upload':
        setShowDocumentUpload(true);
        break;
      case 'documents-processing':
        setShowDocumentProcessing(true);
        break;
      case 'documents-pleadings':
        setShowPleadingsManager(true);
        break;
      case 'case-calendar':
        setShowGlobalCalendar(true);
        break;
      case 'case-timeline':
        setShowTimeline(true);
        break;
      case 'case-authorities':
        setShowAuthorities(true);
        break;
      case 'case-parties':
        setShowParties(true);
        break;
      case 'analysis-insights':
        setShowInsightGeneration(true);
        break;
      case 'analysis-presentation':
        setShowPresentationPrep(true);
        break;
      case 'analysis-keypoints':
        setShowKeyPointsPresentation(true);
        break;
      case 'tools-security':
        setShowEncryptionDashboard(true);
        break;
      case 'tools-presentation':
        setShowPresentationPrep(true);
        break;
      case 'tools-compliance':
        setShowCompliance(true);
        break;
      case 'tools-lnat-testing':
        setShowLNATTesting(true);
        break;
      case 'tools-comprehensive-testing':
        setShowComprehensiveTesting(true);
        break;
      case 'tools-backend-status':
        setShowBackendStatus(true);
        break;
      case 'settings':
        setShowLocalAI(true);
        break;
      case 'help':
        setShowHelp(true);
        break;
      case 'shortcuts':
        setShowShortcuts(true);
        break;
      case 'about':
        setShowAbout(true);
        break;
      case 'cases-all':
        // Show all cases in dashboard
        setSelectedCaseId(undefined);
        setCurrentView('cases-all');
        break;
      case 'cases-active':
        // Show active cases in dashboard
        setSelectedCaseId(undefined);
        setCurrentView('cases-active');
        break;
      default:
        console.log(`Navigation to ${view} not implemented yet`);
        break;
    }
  };

  const selectedCase = cases.find(c => c.id === selectedCaseId);

  // Show case detail if a case is selected
  if (selectedCase) {
    return (
      <div className="app-with-sidebar">
        <ModernSidebar
          currentView={currentView}
          onNavigate={handleNavigation}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        <div className={`app-main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
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
      </div>
    );
  }

  return (
    <div className="app-with-sidebar">
      <ModernSidebar
        currentView={currentView}
        onNavigate={handleNavigation}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className={`app-main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
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

      {/* Parallel AI Research Modal */}
      {showParallelResearch && (
        <div className="modal-overlay" onClick={() => setShowParallelResearch(false)}>
          <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex-between">
              <h2 className="heading-2">Parallel AI Legal Research</h2>
              <button className="btn btn-ghost" onClick={() => setShowParallelResearch(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="card-content">
              <ParallelAIResearchDashboard 
                onTaskComplete={(task) => {
                  console.log(`Research task completed: ${task.title}`);
                  // Could trigger notifications or other actions here
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Knowledge Graph Modal */}
      {showKnowledgeGraph && (
        <div className="modal-overlay" onClick={() => setShowKnowledgeGraph(false)}>
          <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex-between">
              <h2 className="heading-2">Legal Knowledge Graph</h2>
              <button className="btn btn-ghost" onClick={() => setShowKnowledgeGraph(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="card-content">
              <LegalKnowledgeGraph 
                isOpen={true}
                onClose={() => setShowKnowledgeGraph(false)} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {showDocumentViewer && (
        <div className="modal-overlay" onClick={() => setShowDocumentViewer(false)}>
          <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex-between">
              <h2 className="heading-2">Document Viewer</h2>
              <button className="btn btn-ghost" onClick={() => setShowDocumentViewer(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="card-content">
              <IntelligentDocumentViewer 
                documentId={selectedDocument?.id || ''}
                documentTitle={selectedDocument?.title || 'Document'}
                documentContent={selectedDocument?.content || ''}
                documentType={selectedDocument?.type}
                onClose={() => setShowDocumentViewer(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Setup Wizard Modal */}
      {showSetupWizard && (
        <div className="modal-overlay" onClick={() => setShowSetupWizard(false)}>
          <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex-between">
              <h2 className="heading-2">Setup Wizard</h2>
              <button className="btn btn-ghost" onClick={() => setShowSetupWizard(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="card-content">
              <EnhancedSetupWizard 
                onClose={() => setShowSetupWizard(false)} 
                onComplete={() => setShowSetupWizard(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Engine Discovery Modal */}
      {showEngineDiscovery && (
        <div className="modal-overlay" onClick={() => setShowEngineDiscovery(false)}>
          <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex-between">
              <h2 className="heading-2">Engine Discovery</h2>
              <button className="btn btn-ghost" onClick={() => setShowEngineDiscovery(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="card-content">
              <EngineDiscoveryDashboard />
            </div>
          </div>
        </div>
      )}

      {/* Legal Benchmarks Modal */}
      {showLegalBenchmarks && (
        <div className="modal-overlay" onClick={() => setShowLegalBenchmarks(false)}>
          <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex-between">
              <h2 className="heading-2">Legal Benchmarks</h2>
              <button className="btn btn-ghost" onClick={() => setShowLegalBenchmarks(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="card-content">
              <LegalBenchmarkDashboard />
            </div>
          </div>
        </div>
      )}

      {/* Production Dashboard Modal */}
      {showProductionDashboard && (
        <div className="modal-overlay" onClick={() => setShowProductionDashboard(false)}>
          <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex-between">
              <h2 className="heading-2">Production Performance</h2>
              <button className="btn btn-ghost" onClick={() => setShowProductionDashboard(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="card-content">
              <ProductionPerformanceDashboard />
            </div>
          </div>
        </div>
      )}

      {/* Database Optimization Modal */}
      {showDatabaseDashboard && (
        <div className="modal-overlay" onClick={() => setShowDatabaseDashboard(false)}>
          <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex-between">
              <h2 className="heading-2">Database Optimization</h2>
              <button className="btn btn-ghost" onClick={() => setShowDatabaseDashboard(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="card-content">
              <DatabaseOptimizationDashboard />
            </div>
          </div>
        </div>
      )}

      {/* Encryption Management Modal */}
      {showEncryptionDashboard && (
        <div className="modal-overlay" onClick={() => setShowEncryptionDashboard(false)}>
          <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex-between">
              <h2 className="heading-2">Encryption Management</h2>
              <button className="btn btn-ghost" onClick={() => setShowEncryptionDashboard(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="card-content">
              <EncryptionManagementDashboard />
            </div>
          </div>
        </div>
      )}

      {/* Access Logging Modal */}
      {showAccessLoggingDashboard && (
        <div className="modal-overlay" onClick={() => setShowAccessLoggingDashboard(false)}>
          <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex-between">
              <h2 className="heading-2">Access Logging</h2>
              <button className="btn btn-ghost" onClick={() => setShowAccessLoggingDashboard(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="card-content">
              <AccessLoggingDashboard />
            </div>
          </div>
        </div>
      )}

      {/* Case Classification Modal */}
      {showCaseClassification && (
        <div className="modal-overlay" onClick={() => setShowCaseClassification(false)}>
          <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex-between">
              <h2 className="heading-2">Smart Case Classification</h2>
              <button className="btn btn-ghost" onClick={() => setShowCaseClassification(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="card-content">
              <SmartCaseClassification 
                caseName={newCaseName}
                onClassificationComplete={handleClassificationComplete}
                onClose={() => setShowCaseClassification(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Pleadings Manager Modal */}
      {showPleadingsManager && (
        <div className="modal-overlay" onClick={() => setShowPleadingsManager(false)}>
          <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex-between">
              <h2 className="heading-2">Pleadings Manager</h2>
              <button className="btn btn-ghost" onClick={() => setShowPleadingsManager(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="card-content">
              <PleadingsManager />
            </div>
          </div>
        </div>
      )}

      {/* Presentation Prep Modal */}
      {showPresentationPrep && (
        <div className="modal-overlay" onClick={() => setShowPresentationPrep(false)}>
          <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex-between">
              <h2 className="heading-2">Court Presentation Prep</h2>
              <button className="btn btn-ghost" onClick={() => setShowPresentationPrep(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="card-content">
              <PresentationPrep />
            </div>
          </div>
        </div>
      )}

      {/* Insight Generation Modal */}
      {showInsightGeneration && (
        <div className="modal-overlay" onClick={() => setShowInsightGeneration(false)}>
          <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex-between">
              <h2 className="heading-2">AI Insight Generation</h2>
              <button className="btn btn-ghost" onClick={() => setShowInsightGeneration(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="card-content">
              <InsightGenerationEngine />
            </div>
          </div>
        </div>
      )}

      {/* Key Points Presentation Modal */}
      {showKeyPointsPresentation && (
        <div className="modal-overlay" onClick={() => setShowKeyPointsPresentation(false)}>
          <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex-between">
              <h2 className="heading-2">Key Points Analysis</h2>
              <button className="btn btn-ghost" onClick={() => setShowKeyPointsPresentation(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="card-content">
              <EnhancedKeyPointsPresentation />
            </div>
          </div>
        </div>
      )}

      {/* LNAT Testing Modal */}
      {showLNATTesting && (
        <div className="modal-overlay" onClick={() => setShowLNATTesting(false)}>
          <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex-between">
              <h2 className="heading-2">LNAT Testing Dashboard</h2>
              <button className="btn btn-ghost" onClick={() => setShowLNATTesting(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="card-content">
              <LNATDashboard />
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Testing Modal */}
      {showComprehensiveTesting && (
        <div className="modal-overlay" onClick={() => setShowComprehensiveTesting(false)}>
          <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex-between">
              <h2 className="heading-2">Comprehensive Legal Testing</h2>
              <button className="btn btn-ghost" onClick={() => setShowComprehensiveTesting(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="card-content">
              <ComprehensiveLegalTestingDashboard />
            </div>
          </div>
        </div>
      )}

      {/* Backend Status Modal */}
      {showBackendStatus && (
        <div className="modal-overlay" onClick={() => setShowBackendStatus(false)}>
          <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex-between">
              <h2 className="heading-2">Backend Services Status</h2>
              <button className="btn btn-ghost" onClick={() => setShowBackendStatus(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="card-content">
              <BackendServicesStatus />
            </div>
          </div>
        </div>
      )}

      {/* Compliance Modal */}
      {showCompliance && (
        <div className="modal-overlay" onClick={() => setShowCompliance(false)}>
          <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex-between">
              <h2 className="heading-2">Compliance Confirmation System</h2>
              <button className="btn btn-ghost" onClick={() => setShowCompliance(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="card-content">
              <ComplianceConfirmationSystem />
            </div>
          </div>
        </div>
      )}

      {/* Simple Help Modal */}
      {showHelp && (
        <div className="modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex-between">
              <h2 className="heading-2">Help & Support</h2>
              <button className="btn btn-ghost" onClick={() => setShowHelp(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="card-content">
              <div className="help-content">
                <h3>User Guide</h3>
                <p>Welcome to Legal AI Case Management System.</p>
                <h4>Getting Started:</h4>
                <ul>
                  <li>Use the sidebar to navigate between different tools</li>
                  <li>Create new cases from the Cases menu</li>
                  <li>Upload documents using the Documents menu</li>
                  <li>Access AI tools for legal research and analysis</li>
                </ul>
                <h4>Keyboard Shortcuts:</h4>
                <ul>
                  <li>⌘K / Ctrl+K - Command Center</li>
                  <li>⌘N / Ctrl+N - New Case</li>
                  <li>⌘F / Ctrl+F - Advanced Search</li>
                  <li>⌘G / Ctrl+G - Knowledge Graph</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div className="modal-overlay" onClick={() => setShowShortcuts(false)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex-between">
              <h2 className="heading-2">Keyboard Shortcuts</h2>
              <button className="btn btn-ghost" onClick={() => setShowShortcuts(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="card-content">
              <div className="shortcuts-list">
                <div className="shortcut-item">
                  <span className="shortcut-keys">⌘K / Ctrl+K</span>
                  <span className="shortcut-desc">Open Command Center</span>
                </div>
                <div className="shortcut-item">
                  <span className="shortcut-keys">⌘N / Ctrl+N</span>
                  <span className="shortcut-desc">Create New Case</span>
                </div>
                <div className="shortcut-item">
                  <span className="shortcut-keys">⌘F / Ctrl+F</span>
                  <span className="shortcut-desc">Advanced Search</span>
                </div>
                <div className="shortcut-item">
                  <span className="shortcut-keys">⌘G / Ctrl+G</span>
                  <span className="shortcut-desc">Knowledge Graph</span>
                </div>
                <div className="shortcut-item">
                  <span className="shortcut-keys">Escape</span>
                  <span className="shortcut-desc">Close Modals</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* About Modal */}
      {showAbout && (
        <div className="modal-overlay" onClick={() => setShowAbout(false)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex-between">
              <h2 className="heading-2">About Legal AI</h2>
              <button className="btn btn-ghost" onClick={() => setShowAbout(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="card-content">
              <div className="about-content">
                <h3>Legal AI Case Management System</h3>
                <p>Version 3.8.1</p>
                <br />
                <p>Revolutionary privacy-compliant legal case management system with advanced AI consultation capabilities.</p>
                <br />
                <h4>Features:</h4>
                <ul>
                  <li>AI-powered legal research and analysis</li>
                  <li>Comprehensive case management</li>
                  <li>Document processing and OCR</li>
                  <li>Legal benchmarking and testing</li>
                  <li>Privacy-compliant design</li>
                </ul>
                <br />
                <p>Built with Electron, React, and TypeScript.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Placeholder modals for items that don't have components yet */}
      {showDocumentUpload && (
        <div className="modal-overlay" onClick={() => setShowDocumentUpload(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex-between">
              <h2 className="heading-2">Document Upload</h2>
              <button className="btn btn-ghost" onClick={() => setShowDocumentUpload(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="card-content">
              <div className="placeholder-content">
                <h3>📤 Document Upload</h3>
                <p>Upload and scan documents for processing.</p>
                <p><em>This feature is under development.</em></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDocumentProcessing && (
        <div className="modal-overlay" onClick={() => setShowDocumentProcessing(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex-between">
              <h2 className="heading-2">Document Processing Queue</h2>
              <button className="btn btn-ghost" onClick={() => setShowDocumentProcessing(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="card-content">
              <div className="placeholder-content">
                <h3>⚙️ Document Processing Queue</h3>
                <p>Monitor document analysis and processing status.</p>
                <p><em>This feature is under development.</em></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTimeline && (
        <div className="modal-overlay" onClick={() => setShowTimeline(false)}>
          <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex-between">
              <h2 className="heading-2">Timeline Builder</h2>
              <button className="btn btn-ghost" onClick={() => setShowTimeline(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="card-content">
              <div className="placeholder-content">
                <h3>⏱️ Timeline Builder</h3>
                <p>Create and manage case chronology and timelines.</p>
                <p><em>This feature is under development.</em></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAuthorities && (
        <div className="modal-overlay" onClick={() => setShowAuthorities(false)}>
          <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex-between">
              <h2 className="heading-2">Legal Authorities</h2>
              <button className="btn btn-ghost" onClick={() => setShowAuthorities(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="card-content">
              <div className="placeholder-content">
                <h3>⚖️ Legal Authorities</h3>
                <p>Manage case law, statutes, and legal authorities.</p>
                <p><em>This feature is under development.</em></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showParties && (
        <div className="modal-overlay" onClick={() => setShowParties(false)}>
          <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="card-header flex-between">
              <h2 className="heading-2">Parties & Persons</h2>
              <button className="btn btn-ghost" onClick={() => setShowParties(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="card-content">
              <div className="placeholder-content">
                <h3>👥 Parties & Persons (Dramatis Personae)</h3>
                <p>Manage parties, witnesses, and key persons in the case.</p>
                <p><em>This feature is under development.</em></p>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
