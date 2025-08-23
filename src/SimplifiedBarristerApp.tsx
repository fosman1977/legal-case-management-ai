/**
 * Simplified Barrister App - Phase 1 Core Workflow
 * Following Development Strategy: 4-section focused workflow
 * Cases → Analyze → Insights → Privacy
 */

import React, { useState, useEffect } from 'react';
import ThemeProvider from './design/ThemeProvider';
import { injectGlobalStyles } from './design/GlobalStyles';
import { storage } from './utils/storage';
import { Case } from './types';

// Core Components - Only Essential
import Button from './design/components/Button';
import Card, { CardHeader, CardContent } from './design/components/Card';

// Accessibility Integration
import { AccessibilityProvider } from './accessibility/AccessibilityProvider';
import { useKeyboardShortcuts, SkipToMainContent } from './accessibility/KeyboardShortcuts';

// Core Workflow Components
import CasesSection from './sections/CasesSection';
import AnalyzeSection from './sections/AnalyzeSection';
import InsightsSection from './sections/InsightsSection';
import PrivacySection from './sections/PrivacySection';
// Workflow Integration Components
import WorkflowStatusIndicator from './components/WorkflowStatusIndicator';

// Types
type AppSection = 'cases' | 'analyze' | 'insights' | 'privacy';

// Workflow Progress Tracking
type WorkflowStage = 'case_selected' | 'documents_uploaded' | 'analysis_complete' | 'consultation_complete' | 'ready_for_export';

interface WorkflowProgress {
  currentStage: WorkflowStage | null;
  completedStages: WorkflowStage[];
  processingStatus: string;
  lastActivity: string;
  confidenceLevel?: number;
}

interface AppState {
  currentSection: AppSection;
  selectedCase: Case | null;
  cases: Case[];
  isProcessing: boolean;
  analysisResults: any | null; // Store the enhanced analysis results
  consultationPattern: any | null; // Store the enhanced consultation pattern for AI
  consultationResults: any | null; // Store AI consultation results
  workflowProgress: WorkflowProgress;
}

export const SimplifiedBarristerApp: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentSection: 'cases',
    selectedCase: null,
    cases: [],
    isProcessing: false,
    analysisResults: null,
    consultationPattern: null,
    consultationResults: null,
    workflowProgress: {
      currentStage: null,
      completedStages: [],
      processingStatus: 'Ready to begin',
      lastActivity: 'System initialized'
    }
  });

  // Initialize accessibility and keyboard shortcuts
  useKeyboardShortcuts({
    navigateTo: (section: string) => {
      const sectionMap: Record<string, AppSection> = {
        'brief': 'cases',
        'upload': 'analyze', 
        'insights': 'insights',
        'privacy': 'privacy',
        'dashboard': 'cases',
        'research': 'insights',
        'skeleton': 'analyze'
      };
      
      const targetSection = sectionMap[section] || 'cases';
      setState(prev => ({ ...prev, currentSection: targetSection }));
    },
    focusSearch: () => {
      // Focus search in current section
      const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
      searchInput?.focus();
    },
    toggleAIConsultation: () => {
      setState(prev => ({ ...prev, currentSection: 'insights' }));
    },
    openExportDialog: () => {
      // Export current case data
      if (state.selectedCase) {
        console.log('Exporting case:', state.selectedCase.title);
      }
    },
    closeModals: () => {
      // Close any open dialogs or reset selections
      setState(prev => ({ ...prev, selectedCase: null }));
    },
    clearSelections: () => {
      setState(prev => ({ ...prev, selectedCase: null }));
    }
  });

  useEffect(() => {
    loadCases();
    injectGlobalStyles();
  }, []);

  const loadCases = async () => {
    try {
      const cases = await storage.getCases();
      setState(prev => ({ ...prev, cases }));
    } catch (error) {
      console.error('Failed to load cases:', error);
      // Fallback to empty array
      setState(prev => ({ ...prev, cases: [] }));
    }
  };

  const handleSectionChange = (section: AppSection) => {
    setState(prev => ({ ...prev, currentSection: section }));
  };

  const handleCaseSelect = (case_: Case) => {
    setState(prev => ({ 
      ...prev, 
      selectedCase: case_,
      currentSection: 'analyze', // Auto-navigate to analysis
      workflowProgress: {
        currentStage: 'case_selected',
        completedStages: ['case_selected'],
        processingStatus: `Case selected: ${case_.title}`,
        lastActivity: `Selected case at ${new Date().toLocaleTimeString()}`
      }
    }));
  };

  const handleProcessingStart = () => {
    setState(prev => ({ 
      ...prev, 
      isProcessing: true,
      workflowProgress: {
        ...prev.workflowProgress,
        currentStage: 'documents_uploaded',
        processingStatus: 'Processing documents with enhanced analysis...',
        lastActivity: `Document processing started at ${new Date().toLocaleTimeString()}`
      }
    }));
  };

  const handleProcessingComplete = (results: any) => {
    const completedStages = ['case_selected', 'documents_uploaded', 'analysis_complete'];
    
    setState(prev => ({ 
      ...prev, 
      isProcessing: false,
      analysisResults: results,
      currentSection: 'insights', // Auto-navigate to insights
      workflowProgress: {
        currentStage: 'analysis_complete',
        completedStages,
        processingStatus: 'Analysis complete - Ready for AI consultation',
        lastActivity: `Analysis completed at ${new Date().toLocaleTimeString()}`,
        confidenceLevel: results?.enhancedAnalysis?.overallConfidence || results?.confidence || 0.85
      }
    }));
  };

  // New handler for consultation completion
  const handleConsultationComplete = (consultationResults: any) => {
    const completedStages = ['case_selected', 'documents_uploaded', 'analysis_complete', 'consultation_complete'];
    
    setState(prev => ({ 
      ...prev, 
      consultationResults,
      workflowProgress: {
        currentStage: 'consultation_complete',
        completedStages,
        processingStatus: 'AI consultation complete - Ready for professional export',
        lastActivity: `AI consultation completed at ${new Date().toLocaleTimeString()}`,
        confidenceLevel: consultationResults?.confidence || prev.workflowProgress.confidenceLevel
      }
    }));
  };

  // Handler for export completion
  const handleExportComplete = (exportType: string) => {
    const completedStages = ['case_selected', 'documents_uploaded', 'analysis_complete', 'consultation_complete', 'ready_for_export'];
    
    setState(prev => ({ 
      ...prev,
      workflowProgress: {
        currentStage: 'ready_for_export',
        completedStages,
        processingStatus: `${exportType} exported successfully`,
        lastActivity: `${exportType} export completed at ${new Date().toLocaleTimeString()}`,
        confidenceLevel: prev.workflowProgress.confidenceLevel
      }
    }));
  };

  // Main Navigation
  const navigation = [
    { 
      id: 'cases' as AppSection, 
      label: 'Cases', 
      icon: '📁',
      description: 'Case creation and organization'
    },
    { 
      id: 'analyze' as AppSection, 
      label: 'Analyze', 
      icon: '📄',
      description: 'Document upload and analysis'
    },
    { 
      id: 'insights' as AppSection, 
      label: 'Insights', 
      icon: '🤖',
      description: 'AI consultation and timeline'
    },
    { 
      id: 'privacy' as AppSection, 
      label: 'Privacy', 
      icon: '🔒',
      description: 'Transparency and compliance'
    }
  ];

  const currentNav = navigation.find(nav => nav.id === state.currentSection);

  return (
    <AccessibilityProvider>
      <ThemeProvider>
        <div className="barrister-app" style={{ 
          display: 'flex', 
          height: '100vh',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          <SkipToMainContent />
          
          {/* Simplified Sidebar - Only 4 Sections */}
          <aside 
            style={{ 
              width: '240px', 
              backgroundColor: '#1f2937',
              color: 'white',
              display: 'flex',
              flexDirection: 'column'
            }}
            role="navigation"
            aria-label="Main navigation"
          >
            <div style={{ 
              padding: '24px 20px',
              borderBottom: '1px solid #374151'
            }}>
              <h1 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                margin: 0,
                color: 'white'
              }}>
                Legal AI
              </h1>
              <p style={{ 
                fontSize: '0.875rem', 
                color: '#9ca3af',
                margin: '4px 0 0 0'
              }}>
                Barrister Workflow
              </p>
            </div>

            <nav style={{ flex: 1, padding: '16px 0' }}>
              {navigation.map(nav => (
                <button
                  key={nav.id}
                  onClick={() => handleSectionChange(nav.id)}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    backgroundColor: state.currentSection === nav.id ? '#3b82f6' : 'transparent',
                    color: state.currentSection === nav.id ? 'white' : '#d1d5db',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (state.currentSection !== nav.id) {
                      e.currentTarget.style.backgroundColor = '#374151';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (state.currentSection !== nav.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                  aria-current={state.currentSection === nav.id ? 'page' : undefined}
                >
                  <span style={{ fontSize: '1.25rem' }}>{nav.icon}</span>
                  <div>
                    <div>{nav.label}</div>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: '#9ca3af',
                      fontWeight: '400'
                    }}>
                      {nav.description}
                    </div>
                  </div>
                </button>
              ))}
            </nav>

            {/* Enhanced Status Indicator with Workflow Progress */}
            <div style={{ 
              padding: '16px 20px',
              borderTop: '1px solid #374151',
              fontSize: '0.75rem',
              color: '#9ca3af'
            }}>
              {/* Workflow Progress */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '4px'
                }}>
                  <span style={{ fontWeight: '500', color: '#d1d5db' }}>Workflow Progress</span>
                  {state.workflowProgress.confidenceLevel && (
                    <span style={{ color: '#10b981' }}>
                      {Math.round(state.workflowProgress.confidenceLevel * 100)}%
                    </span>
                  )}
                </div>
                
                {/* Progress Bar */}
                <div style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: '#374151',
                  borderRadius: '2px',
                  overflow: 'hidden',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    width: `${(state.workflowProgress.completedStages.length / 5) * 100}%`,
                    height: '100%',
                    backgroundColor: state.isProcessing ? '#f59e0b' : '#10b981',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                
                {/* Current Status */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  marginBottom: '4px'
                }}>
                  {state.isProcessing && (
                    <div className="spinner" style={{
                      width: '10px',
                      height: '10px',
                      border: '2px solid #374151',
                      borderTop: '2px solid #3b82f6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                  )}
                  <span style={{ color: '#d1d5db' }}>
                    {state.workflowProgress.processingStatus}
                  </span>
                </div>
                
                <div style={{ color: '#9ca3af', fontSize: '0.6875rem' }}>
                  {state.workflowProgress.lastActivity}
                </div>
              </div>
              
              {/* Active Case */}
              {state.selectedCase && (
                <div style={{ 
                  padding: '8px',
                  backgroundColor: '#374151',
                  borderRadius: '4px',
                  marginBottom: '8px'
                }}>
                  <div style={{ fontWeight: '500', color: '#d1d5db', marginBottom: '2px' }}>
                    Active Case
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: '0.6875rem' }}>
                    {state.selectedCase.title}
                  </div>
                </div>
              )}
              
              {/* Workflow Stage Indicators */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {[
                  { stage: 'case_selected', icon: '📁', label: 'Case' },
                  { stage: 'documents_uploaded', icon: '📄', label: 'Docs' },
                  { stage: 'analysis_complete', icon: '🔍', label: 'Analysis' },
                  { stage: 'consultation_complete', icon: '🤖', label: 'AI' },
                  { stage: 'ready_for_export', icon: '📋', label: 'Export' }
                ].map(({ stage, icon, label }) => (
                  <div
                    key={stage}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                      padding: '2px 4px',
                      borderRadius: '3px',
                      backgroundColor: state.workflowProgress.completedStages.includes(stage as WorkflowStage) 
                        ? '#065f46' : '#374151',
                      color: state.workflowProgress.completedStages.includes(stage as WorkflowStage)
                        ? '#d1fae5' : '#9ca3af',
                      fontSize: '0.625rem'
                    }}
                  >
                    <span>{icon}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main 
            id="main-content"
            style={{ 
              flex: 1, 
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Header Bar */}
            <header style={{ 
              backgroundColor: 'white',
              borderBottom: '1px solid #e5e7eb',
              padding: '16px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '600', 
                  margin: 0,
                  color: '#1f2937'
                }}>
                  {currentNav?.label}
                </h2>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: '#6b7280',
                  margin: '4px 0 0 0'
                }}>
                  {currentNav?.description}
                </p>
              </div>

              {/* Quick Actions */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="search"
                  placeholder="Search cases..."
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    width: '200px'
                  }}
                />
                <Button 
                  variant="secondary" 
                  onClick={() => setState(prev => ({ ...prev, currentSection: 'insights' }))}
                >
                  🤖 AI Consult
                </Button>
              </div>
            </header>

            {/* Section Content */}
            <div style={{ 
              flex: 1, 
              overflow: 'auto',
              backgroundColor: '#f9fafb',
              padding: '24px'
            }}>
              {state.currentSection === 'cases' && (
                <CasesSection
                  cases={state.cases}
                  selectedCase={state.selectedCase}
                  onCaseSelect={handleCaseSelect}
                  onCaseCreate={() => {}}
                  onCaseUpdate={loadCases}
                />
              )}

              {state.currentSection === 'analyze' && (
                <AnalyzeSection
                  selectedCase={state.selectedCase}
                  onProcessingStart={handleProcessingStart}
                  onProcessingComplete={handleProcessingComplete}
                  onExportComplete={handleExportComplete}
                  isProcessing={state.isProcessing}
                  analysisResults={state.analysisResults}
                />
              )}

              {state.currentSection === 'insights' && (
                <InsightsSection
                  selectedCase={state.selectedCase}
                  isProcessing={state.isProcessing}
                  analysisResults={state.analysisResults}
                  consultationResults={state.consultationResults}
                  onNavigate={handleSectionChange}
                  onConsultationComplete={handleConsultationComplete}
                  onExportComplete={handleExportComplete}
                />
              )}

              {state.currentSection === 'privacy' && (
                <PrivacySection />
              )}
            </div>
          </main>
        </div>

        {/* Real-time Workflow Status Indicator */}
        <WorkflowStatusIndicator
          selectedCase={state.selectedCase}
          analysisResults={state.analysisResults}
          consultationResults={state.consultationResults}
          workflowProgress={state.workflowProgress}
          onNavigate={handleSectionChange}
        />

        {/* Global Styles for Animations */}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .barrister-app input:focus {
            outline: 2px solid #3b82f6;
            outline-offset: 2px;
          }
          
          .barrister-app button:focus {
            outline: 2px solid #3b82f6;
            outline-offset: 2px;
          }
        `}</style>
      </ThemeProvider>
    </AccessibilityProvider>
  );
};

export default SimplifiedBarristerApp;