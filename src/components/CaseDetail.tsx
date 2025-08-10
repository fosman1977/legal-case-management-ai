import React, { useState } from 'react';
import { Case, CaseDocument } from '../types';
import { storage } from '../utils/storage';
import { EnhancedDocumentManager } from './EnhancedDocumentManager';
import { EnhancedKeyPointsPresentation } from './EnhancedKeyPointsPresentation';
import { EnhancedAuthoritiesManager } from './EnhancedAuthoritiesManager';
import { AutoGenerator } from './AutoGenerator';
import { EnhancedChronologyBuilder } from './EnhancedChronologyBuilder';
import { EnhancedDramatisPersonae } from './EnhancedDramatisPersonae';
import { EnhancedIssuesBuilder } from './EnhancedIssuesBuilder';
import { AISettings } from './AISettings';
import { EnhancedAIDialogue } from './EnhancedAIDialogue';
import { EnhancedRAGDialogue } from './EnhancedRAGDialogue';
import { EnhancedCaseOverview } from './EnhancedCaseOverview';
import { PleadingsManager } from './PleadingsManager';
import { AISyncNotification } from './AISyncNotification';
import { AISystemOverview } from './AISystemOverview';
import { SkeletonsManager } from './SkeletonsManager';
import { UserNotesManager } from './UserNotesManager';
import { OrdersDirectionsManager } from './OrdersDirectionsManager';

interface CaseDetailProps {
  case: Case;
  onEditCase: () => void;
  onDeleteCase: () => void;
}

export const CaseDetail: React.FC<CaseDetailProps> = ({ 
  case: caseData,
  onEditCase,
  onDeleteCase 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'pleadings' | 'skeletons' | 'auto-generate' | 'ai-dialogue' | 'ai-rag' | 'ai-chronology' | 'ai-persons' | 'ai-issues' | 'keypoints-presentation' | 'authorities' | 'user-notes' | 'orders-directions' | 'settings'>('overview');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{top: number, left: number} | null>(null);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);

  // Refresh documents when tab changes or when returning to this component
  const refreshDocuments = async () => {
    try {
      // Merge all document sources like other components
      const allDocs: CaseDocument[] = [];

      // 1. Load scanned documents from localStorage
      const storageKey = `scanned_documents_${caseData.id}`;
      const savedScannedDocs = localStorage.getItem(storageKey);
      if (savedScannedDocs) {
        try {
          const scannedDocuments = JSON.parse(savedScannedDocs);
          allDocs.push(...scannedDocuments);
          console.log(`📦 CaseDetail: Loaded ${scannedDocuments.length} scanned documents`);
        } catch (error) {
          console.error('Failed to parse saved scanned documents:', error);
        }
      }

      // 2. Load traditional documents from storage
      const storageDocs = await storage.getDocumentsAsync(caseData.id);
      allDocs.push(...storageDocs);

      // Remove duplicates (prioritize scanned documents)
      const uniqueDocs = allDocs.filter((doc, index, self) => 
        index === self.findIndex(d => d.fileName === doc.fileName || d.id === doc.id)
      );

      setDocuments(uniqueDocs);
      console.log(`📄 CaseDetail: Total ${uniqueDocs.length} documents for case ${caseData.id}:`, uniqueDocs.map(d => ({ 
        title: d.title, 
        hasFile: !!d.fileId, 
        hasContent: !!d.content,
        hasFileContent: !!d.fileContent,
        isScanned: d.id.startsWith('scan_')
      })));
    } catch (error) {
      console.error('Failed to refresh documents:', error);
      setDocuments(storage.getDocuments(caseData.id));
    }
  };

  React.useEffect(() => {
    refreshDocuments();
  }, [caseData.id]);

  // Handle dropdown positioning and closing
  const handleDropdownToggle = (dropdownName: string, event: React.MouseEvent) => {
    if (activeDropdown === dropdownName) {
      setActiveDropdown(null);
      setDropdownPosition(null);
    } else {
      const button = event.currentTarget as HTMLButtonElement;
      const rect = button.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      });
      setActiveDropdown(dropdownName);
    }
  };

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.nav-dropdown')) {
        setActiveDropdown(null);
        setDropdownPosition(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Refresh documents when switching to tabs that need documents
  React.useEffect(() => {
    if (activeTab === 'ai-dialogue' || activeTab === 'auto-generate') {
      refreshDocuments();
    }
  }, [activeTab]);

  const handleDeleteCase = () => {
    if (window.confirm(`Are you sure you want to delete the case "${caseData.title}"? This will delete all associated documents and data.`)) {
      onDeleteCase();
    }
  };

  return (
    <div className="case-detail">
      <AISyncNotification caseId={caseData.id} />
      <AISystemOverview caseId={caseData.id} />
      <div className="case-detail-header">
        <div>
          <h2>{caseData.title}</h2>
          <p className="case-ref-large">{caseData.courtReference}</p>
        </div>
        <div className="case-actions">
          <button className="btn btn-secondary" onClick={onEditCase}>
            Edit Case
          </button>
          <button className="btn btn-danger" onClick={handleDeleteCase}>
            Delete Case
          </button>
        </div>
      </div>

      <div className="case-navigation">
        {/* Main Tabs */}
        <div className="nav-main-tabs">
          <button 
            className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          
          <button 
            className={`nav-tab ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            📄 Documents
          </button>

          {/* Legal Analysis Dropdown */}
          <div className="nav-dropdown">
            <button 
              className={`nav-tab dropdown-trigger ${['pleadings', 'skeletons', 'authorities'].includes(activeTab) ? 'active' : ''}`}
              onClick={(e) => handleDropdownToggle('legal', e)}
            >
              ⚖️ Legal Analysis <span className="dropdown-arrow">▼</span>
            </button>
          </div>

          {/* AI Tools Dropdown */}
          <div className="nav-dropdown">
            <button 
              className={`nav-tab dropdown-trigger ${['ai-dialogue', 'ai-rag', 'ai-chronology', 'ai-persons', 'ai-issues', 'auto-generate'].includes(activeTab) ? 'active' : ''}`}
              onClick={(e) => handleDropdownToggle('ai', e)}
            >
              🤖 AI Tools <span className="dropdown-arrow">▼</span>
            </button>
          </div>

          {/* Working Tools Dropdown */}
          <div className="nav-dropdown">
            <button 
              className={`nav-tab dropdown-trigger ${['user-notes', 'orders-directions'].includes(activeTab) ? 'active' : ''}`}
              onClick={(e) => handleDropdownToggle('working', e)}
            >
              📝 Working Tools <span className="dropdown-arrow">▼</span>
            </button>
          </div>

          <button 
            className={`nav-tab ${activeTab === 'keypoints-presentation' ? 'active' : ''}`}
            onClick={() => setActiveTab('keypoints-presentation')}
          >
            🎯 Presentation
          </button>

          <button 
            className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            🔒 Settings
          </button>
        </div>
      </div>

      {/* Fixed Position Dropdown Menus */}
      {activeDropdown === 'legal' && dropdownPosition && (
        <div 
          className="dropdown-menu"
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            zIndex: 1001
          }}
        >
          <button 
            className={`dropdown-item ${activeTab === 'pleadings' ? 'active' : ''}`}
            onClick={() => { setActiveTab('pleadings'); setActiveDropdown(null); setDropdownPosition(null); }}
          >
            📋 Pleadings
          </button>
          <button 
            className={`dropdown-item ${activeTab === 'skeletons' ? 'active' : ''}`}
            onClick={() => { setActiveTab('skeletons'); setActiveDropdown(null); setDropdownPosition(null); }}
          >
            ⚖️ Skeleton Arguments
          </button>
          <button 
            className={`dropdown-item ${activeTab === 'authorities' ? 'active' : ''}`}
            onClick={() => { setActiveTab('authorities'); setActiveDropdown(null); setDropdownPosition(null); }}
          >
            📚 Authorities
          </button>
        </div>
      )}

      {activeDropdown === 'ai' && dropdownPosition && (
        <div 
          className="dropdown-menu"
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            zIndex: 1001
          }}
        >
          <button 
            className={`dropdown-item ${activeTab === 'ai-dialogue' ? 'active' : ''}`}
            onClick={() => { setActiveTab('ai-dialogue'); setActiveDropdown(null); setDropdownPosition(null); }}
          >
            💬 AI Q&A (Legacy)
          </button>
          <button 
            className={`dropdown-item ${activeTab === 'ai-rag' ? 'active' : ''}`}
            onClick={() => { setActiveTab('ai-rag'); setActiveDropdown(null); setDropdownPosition(null); }}
          >
            🧠 AI RAG Assistant
          </button>
          <button 
            className={`dropdown-item ${activeTab === 'auto-generate' ? 'active' : ''}`}
            onClick={() => { setActiveTab('auto-generate'); setActiveDropdown(null); setDropdownPosition(null); }}
          >
            🚀 Auto-Generate
          </button>
          <button 
            className={`dropdown-item ${activeTab === 'ai-chronology' ? 'active' : ''}`}
            onClick={() => { setActiveTab('ai-chronology'); setActiveDropdown(null); setDropdownPosition(null); }}
          >
            📅 Timeline Builder
          </button>
          <button 
            className={`dropdown-item ${activeTab === 'ai-persons' ? 'active' : ''}`}
            onClick={() => { setActiveTab('ai-persons'); setActiveDropdown(null); setDropdownPosition(null); }}
          >
            👥 Persons
          </button>
          <button 
            className={`dropdown-item ${activeTab === 'ai-issues' ? 'active' : ''}`}
            onClick={() => { setActiveTab('ai-issues'); setActiveDropdown(null); setDropdownPosition(null); }}
          >
            ⚖️ Issues
          </button>
        </div>
      )}

      {activeDropdown === 'working' && dropdownPosition && (
        <div 
          className="dropdown-menu"
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            zIndex: 1001
          }}
        >
          <button 
            className={`dropdown-item ${activeTab === 'user-notes' ? 'active' : ''}`}
            onClick={() => { setActiveTab('user-notes'); setActiveDropdown(null); setDropdownPosition(null); }}
          >
            📝 User Notes & Memos
          </button>
          <button 
            className={`dropdown-item ${activeTab === 'orders-directions' ? 'active' : ''}`}
            onClick={() => { setActiveTab('orders-directions'); setActiveDropdown(null); setDropdownPosition(null); }}
          >
            📋 Orders & Directions
          </button>
        </div>
      )}

      <div className="case-content">
        {activeTab === 'overview' && (
          <EnhancedCaseOverview caseData={caseData} documents={documents} />
        )}

        {activeTab === 'documents' && (
          <EnhancedDocumentManager caseId={caseData.id} onDocumentChange={refreshDocuments} />
        )}

        {activeTab === 'pleadings' && (
          <PleadingsManager caseId={caseData.id} caseData={caseData} />
        )}

        {activeTab === 'skeletons' && (
          <SkeletonsManager caseId={caseData.id} caseData={caseData} />
        )}

        {activeTab === 'auto-generate' && (
          <AutoGenerator caseId={caseData.id} documents={documents} />
        )}

        {activeTab === 'ai-dialogue' && (
          <EnhancedAIDialogue 
            caseId={caseData.id} 
            documents={documents}
          />
        )}

        {activeTab === 'ai-rag' && (
          <EnhancedRAGDialogue 
            caseId={caseData.id} 
            documents={documents}
          />
        )}

        {activeTab === 'ai-chronology' && (
          <EnhancedChronologyBuilder caseId={caseData.id} />
        )}

        {activeTab === 'ai-persons' && (
          <EnhancedDramatisPersonae caseId={caseData.id} />
        )}

        {activeTab === 'ai-issues' && (
          <EnhancedIssuesBuilder caseId={caseData.id} />
        )}

        {activeTab === 'keypoints-presentation' && (
          <EnhancedKeyPointsPresentation caseId={caseData.id} caseData={caseData} />
        )}

        {activeTab === 'authorities' && (
          <EnhancedAuthoritiesManager caseId={caseData.id} />
        )}

        {activeTab === 'user-notes' && (
          <UserNotesManager caseId={caseData.id} />
        )}

        {activeTab === 'orders-directions' && (
          <OrdersDirectionsManager caseId={caseData.id} />
        )}

        {activeTab === 'settings' && (
          <AISettings caseId={caseData.id} />
        )}
      </div>
    </div>
  );
};