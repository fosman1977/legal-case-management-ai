import { useState, useEffect } from 'react';

// Week 13 Design System - Pure CSS-in-JS (No Legacy CSS)
import { ThemeProvider } from './design/ThemeProvider.jsx';
import { injectGlobalStyles } from './design/GlobalStyles.js';

// Core utilities (keep)
import { systemTest } from './utils/systemTest';
import { multiEngineProcessor } from './utils/multiEngineProcessor';
import { Case } from './types';
import { storage } from './utils/storage';

// Core components only (4 sections focus)
import { SystemTestButton } from './components/SystemTestButton';
import { CaseForm } from './components/CaseForm';
import { CaseList } from './components/CaseList';
import { CaseDetail } from './components/CaseDetail';
import { EnhancedDocumentUpload } from './components/EnhancedDocumentUpload';
import { ExtractedContentViewer } from './components/ExtractedContentViewer';
import { AITransparencyDashboard } from './components/AITransparencyDashboard';

// Navigation sections for focused workflow
type NavigationSection = 'cases' | 'analyze' | 'insights' | 'privacy';

export default function SimplifiedApp() {
  // Core state management
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | undefined>();
  const [activeSection, setActiveSection] = useState<NavigationSection>('cases');
  
  // Form management
  const [showForm, setShowForm] = useState(false);
  const [editingCase, setEditingCase] = useState<Case | undefined>();
  
  // Document workflow
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  
  useEffect(() => {
    loadCases();
    
    // Development utilities (keep for testing)
    (window as any).systemTest = systemTest;
    (window as any).multiEngineProcessor = multiEngineProcessor;
    (window as any).storage = storage;
    console.log('🧪 System test available: window.systemTest.run()');
    
    // Essential keyboard shortcuts only
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+N or Ctrl+N for New Case
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        handleNewCase();
      }
      
      // Escape to close modals
      if (e.key === 'Escape') {
        setShowForm(false);
      }
      
      // Number keys for section navigation
      if (e.key >= '1' && e.key <= '4') {
        const sections: NavigationSection[] = ['cases', 'analyze', 'insights', 'privacy'];
        setActiveSection(sections[parseInt(e.key) - 1]);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Core data loading
  const loadCases = async () => {
    try {
      const loadedCases = await storage.getCases();
      setCases(loadedCases);
      
      if (loadedCases.length > 0 && !selectedCaseId) {
        setSelectedCaseId(loadedCases[0].id);
      }
    } catch (error) {
      console.error('Failed to load cases:', error);
    }
  };

  // Case management handlers
  const handleNewCase = () => {
    setEditingCase(undefined);
    setShowForm(true);
  };

  const handleEditCase = (caseToEdit: Case) => {
    setEditingCase(caseToEdit);
    setShowForm(true);
  };

  const handleFormSubmit = async (caseData: Case) => {
    try {
      if (editingCase) {
        await storage.saveCase(caseData);
        setCases(prev => prev.map(c => c.id === caseData.id ? caseData : c));
      } else {
        await storage.saveCase(caseData);
        setCases(prev => [...prev, caseData]);
        setSelectedCaseId(caseData.id);
      }
      setShowForm(false);
      setEditingCase(undefined);
    } catch (error) {
      console.error('Failed to save case:', error);
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    if (confirm('Are you sure you want to delete this case?')) {
      try {
        await storage.deleteCase(caseId);
        setCases(prev => prev.filter(c => c.id !== caseId));
        if (selectedCaseId === caseId) {
          setSelectedCaseId(cases.length > 1 ? cases.find(c => c.id !== caseId)?.id : undefined);
        }
      } catch (error) {
        console.error('Failed to delete case:', error);
      }
    }
  };

  // Get selected case
  const selectedCase = cases.find(c => c.id === selectedCaseId);

  // Navigation sections definition
  const navigationSections = [
    { 
      id: 'cases' as NavigationSection, 
      label: 'Cases', 
      icon: '📁',
      shortcut: '1',
      description: 'Case creation and organization'
    },
    { 
      id: 'analyze' as NavigationSection, 
      label: 'Analyze', 
      icon: '📄',
      shortcut: '2', 
      description: 'Document upload and analysis workflow'
    },
    { 
      id: 'insights' as NavigationSection, 
      label: 'Insights', 
      icon: '🤖',
      shortcut: '3',
      description: 'AI consultation results and timeline'
    },
    { 
      id: 'privacy' as NavigationSection, 
      label: 'Privacy', 
      icon: '🔒',
      shortcut: '4',
      description: 'Transparency dashboard and compliance'
    }
  ];

  // Use existing CaseList component with proper interface
  const SimpleCaseList = () => (
    <div className="cases-list-container">
      <div className="cases-header">
        <h3>Cases ({cases.length})</h3>
        <button className="btn btn-primary" onClick={handleNewCase}>
          + New Case
        </button>
      </div>
      
      <CaseList 
        cases={cases}
        onSelectCase={setSelectedCaseId}
        selectedCaseId={selectedCaseId}
        onNewCase={handleNewCase}
      />
    </div>
  );

  // Main content renderer based on active section
  const renderMainContent = () => {
    switch (activeSection) {
      case 'cases':
        return (
          <div className="section-content">
            <div className="section-header">
              <h1>Case Management</h1>
              <p>Create and organize your legal cases</p>
            </div>
            
            <div className="cases-layout">
              <div className="cases-column">
                <SimpleCaseList />
              </div>
              
              {selectedCase && (
                <div className="case-detail-column">
                  <CaseDetail 
                    case={selectedCase}
                    onEdit={() => handleEditCase(selectedCase)}
                    onDelete={() => handleDeleteCase(selectedCase.id)}
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 'analyze':
        return (
          <div className="section-content">
            <div className="section-header">
              <h1>Document Analysis</h1>
              <p>Upload and analyze legal documents with AI</p>
              {selectedCase && (
                <div className="current-case">
                  Working on: <strong>{selectedCase.title}</strong>
                </div>
              )}
            </div>
            
            {selectedCase ? (
              <div className="analysis-workflow">
                <EnhancedDocumentUpload 
                  caseId={selectedCase.id}
                  onDocumentAdded={(document) => {
                    setSelectedDocument(document);
                    setActiveSection('insights'); // Auto-navigate to results
                  }}
                />
              </div>
            ) : (
              <div className="no-case-selected">
                <div className="empty-state">
                  <div className="empty-icon">📁</div>
                  <h3>No Case Selected</h3>
                  <p>Please select a case from the Cases section to begin document analysis.</p>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => setActiveSection('cases')}
                  >
                    Go to Cases
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'insights':
        return (
          <div className="section-content">
            <div className="section-header">
              <h1>Analysis Results & Insights</h1>
              <p>Review AI-powered analysis and extracted information</p>
              {selectedCase && (
                <div className="current-case">
                  Case: <strong>{selectedCase.title}</strong>
                </div>
              )}
            </div>
            
            {selectedCase ? (
              <div className="insights-content">
                {selectedDocument ? (
                  <ExtractedContentViewer 
                    document={selectedDocument}
                    caseId={selectedCase.id}
                  />
                ) : (
                  <div className="case-insights">
                    <div className="insights-grid">
                      {/* Simple case summary */}
                      <div className="insight-card">
                        <h4>Case Overview</h4>
                        <div className="case-summary">
                          <div><strong>Status:</strong> {selectedCase.status}</div>
                          <div><strong>Priority:</strong> {selectedCase.priority}</div>
                          <div><strong>Documents:</strong> {selectedCase.documents?.length || 0}</div>
                          <div><strong>Timeline Events:</strong> {selectedCase.timeline?.length || 0}</div>
                        </div>
                      </div>
                      
                      {/* Simple timeline */}
                      {selectedCase.timeline && selectedCase.timeline.length > 0 && (
                        <div className="insight-card">
                          <h4>Recent Timeline</h4>
                          <div className="simple-timeline">
                            {selectedCase.timeline.slice(-5).map(event => (
                              <div key={event.id} className="timeline-item">
                                <div className="timeline-date">{event.date}</div>
                                <div className="timeline-desc">{event.description}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Document list */}
                      {selectedCase.documents && selectedCase.documents.length > 0 && (
                        <div className="insight-card">
                          <h4>Documents</h4>
                          <div className="documents-list">
                            {selectedCase.documents.map(doc => (
                              <div key={doc.id} className="document-item">
                                <span className="doc-title">{doc.title}</span>
                                <span className="doc-type">{doc.type}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="no-case-selected">
                <div className="empty-state">
                  <div className="empty-icon">🤖</div>
                  <h3>No Case Selected</h3>
                  <p>Please select a case to view insights and analysis results.</p>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => setActiveSection('cases')}
                  >
                    Go to Cases
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'privacy':
        return (
          <div className="section-content">
            <div className="section-header">
              <h1>Privacy & Compliance</h1>
              <p>Transparency dashboard and regulatory compliance</p>
            </div>
            
            <AITransparencyDashboard />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="simplified-app">
      {/* Professional Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="app-title">
            <h1>Legal Case Management AI</h1>
            <span className="app-subtitle">Professional Document Analysis System</span>
          </div>
          
          <div className="header-actions">
            {selectedCase && (
              <div className="current-case-indicator">
                <span>Active Case:</span>
                <strong>{selectedCase.title}</strong>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="app-layout">
        {/* Clean Sidebar Navigation */}
        <nav className="main-sidebar">
          <div className="nav-sections">
            {navigationSections.map(section => (
              <button
                key={section.id}
                className={`nav-button ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => setActiveSection(section.id)}
                title={`${section.description} (Shortcut: ${section.shortcut})`}
              >
                <span className="nav-icon">{section.icon}</span>
                <span className="nav-label">{section.label}</span>
                <span className="nav-shortcut">{section.shortcut}</span>
              </button>
            ))}
          </div>
          
          <div className="nav-footer">
            <div className="keyboard-hint">
              <small>Use 1-4 keys for quick navigation</small>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="main-content">
          {renderMainContent()}
        </main>
      </div>

      {/* Modal for Case Form */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCase ? 'Edit Case' : 'Create New Case'}</h2>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>×</button>
            </div>
            <div className="modal-content">
              <CaseForm 
                case={editingCase}
                onSubmit={handleFormSubmit}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Development Test Button */}
      <SystemTestButton />

      {/* Professional Styles */}
      <style jsx>{`
        .simplified-app {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #fafafa;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .app-header {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          padding: 1rem 2rem;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .app-title h1 {
          margin: 0;
          color: #111827;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .app-subtitle {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .current-case-indicator {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .current-case-indicator strong {
          color: #111827;
          margin-left: 0.5rem;
        }

        .app-layout {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .main-sidebar {
          width: 240px;
          background: white;
          border-right: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
        }

        .nav-sections {
          flex: 1;
          padding: 1rem 0;
        }

        .nav-button {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1.5rem;
          border: none;
          background: none;
          text-align: left;
          cursor: pointer;
          color: #6b7280;
          transition: all 0.2s;
          border-left: 3px solid transparent;
          width: 100%;
        }

        .nav-button:hover {
          background: #f9fafb;
          color: #111827;
        }

        .nav-button.active {
          background: #dbeafe;
          color: #1d4ed8;
          border-left-color: #1d4ed8;
        }

        .nav-icon {
          font-size: 1.25rem;
        }

        .nav-label {
          flex: 1;
          font-weight: 500;
        }

        .nav-shortcut {
          background: #f3f4f6;
          color: #6b7280;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .nav-button.active .nav-shortcut {
          background: #bfdbfe;
          color: #1d4ed8;
        }

        .nav-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid #f3f4f6;
        }

        .keyboard-hint {
          color: #9ca3af;
          text-align: center;
        }

        .main-content {
          flex: 1;
          overflow: auto;
          background: #fafafa;
        }

        .section-content {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .section-header {
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e5e7eb;
        }

        .section-header h1 {
          margin: 0 0 0.5rem 0;
          color: #111827;
          font-size: 2rem;
          font-weight: 700;
        }

        .section-header p {
          margin: 0;
          color: #6b7280;
          font-size: 1rem;
        }

        .current-case {
          margin-top: 0.5rem;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .cases-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          height: calc(100vh - 300px);
        }

        .cases-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .cases-header h3 {
          margin: 0;
          color: #111827;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .cases-grid {
          display: grid;
          gap: 1rem;
        }

        .case-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .case-card:hover {
          border-color: #d1d5db;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .case-card.selected {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .case-title {
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.5rem;
        }

        .case-meta {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .case-status, .case-priority {
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: capitalize;
        }

        .case-status {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .case-priority {
          background: #fef3c7;
          color: #d97706;
        }

        .case-actions {
          display: flex;
          gap: 0.5rem;
        }

        .no-case-selected {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 60vh;
        }

        .empty-state {
          text-align: center;
          max-width: 400px;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .empty-state h3 {
          margin: 0 0 0.5rem 0;
          color: #111827;
          font-size: 1.5rem;
        }

        .empty-state p {
          margin: 0 0 1.5rem 0;
          color: #6b7280;
        }

        .insights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .insight-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1.5rem;
        }

        .insight-card h4 {
          margin: 0 0 1rem 0;
          color: #111827;
          font-size: 1.125rem;
          font-weight: 600;
        }

        .case-summary div {
          padding: 0.5rem 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .timeline-item {
          display: flex;
          gap: 1rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .timeline-date {
          min-width: 100px;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .document-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .doc-type {
          color: #6b7280;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}