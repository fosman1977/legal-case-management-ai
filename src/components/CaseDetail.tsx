import React, { useState } from 'react';
import { Case, CaseDocument } from '../types';
import { storage } from '../utils/storage';
import { EnhancedDocumentManager } from './EnhancedDocumentManager';
import { KeyPointsManager } from './KeyPointsManager';
import { ChronologyManager } from './ChronologyManager';
import { AuthoritiesManager } from './AuthoritiesManager';
import { PresentationPrep } from './PresentationPrep';
import { AutoGenerator } from './AutoGenerator';
import { ChronologyBuilder } from './ChronologyBuilder';
import { DramatisPersonae } from './DramatisPersonae';
import { IssuesBuilder } from './IssuesBuilder';
import { SecuritySettings } from './SecuritySettings';
import { AIDialogue } from './AIDialogue';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'auto-generate' | 'ai-dialogue' | 'ai-chronology' | 'ai-persons' | 'ai-issues' | 'keypoints' | 'chronology' | 'authorities' | 'presentation' | 'settings'>('overview');
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

      <div className="case-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          Documents
        </button>
        <button 
          className={`tab ${activeTab === 'auto-generate' ? 'active' : ''}`}
          onClick={() => setActiveTab('auto-generate')}
        >
          🚀 Auto-Generate
        </button>
        <button 
          className={`tab ${activeTab === 'ai-dialogue' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai-dialogue')}
        >
          💬 AI Q&A
        </button>
        <button 
          className={`tab ${activeTab === 'ai-chronology' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai-chronology')}
        >
          📅 AI Chronology
        </button>
        <button 
          className={`tab ${activeTab === 'ai-persons' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai-persons')}
        >
          👥 Persons
        </button>
        <button 
          className={`tab ${activeTab === 'ai-issues' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai-issues')}
        >
          ⚖️ Issues
        </button>
        <button 
          className={`tab ${activeTab === 'keypoints' ? 'active' : ''}`}
          onClick={() => setActiveTab('keypoints')}
        >
          Key Points
        </button>
        <button 
          className={`tab ${activeTab === 'chronology' ? 'active' : ''}`}
          onClick={() => setActiveTab('chronology')}
        >
          Chronology
        </button>
        <button 
          className={`tab ${activeTab === 'authorities' ? 'active' : ''}`}
          onClick={() => setActiveTab('authorities')}
        >
          Authorities
        </button>
        <button 
          className={`tab ${activeTab === 'presentation' ? 'active' : ''}`}
          onClick={() => setActiveTab('presentation')}
        >
          Presentation
        </button>
        <button 
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          🔒 Settings
        </button>
      </div>

      <div className="case-content">
        {activeTab === 'overview' && (
          <div className="case-overview">
            <div className="overview-grid">
              <div className="overview-item">
                <label>Client:</label>
                <p>{caseData.client}</p>
              </div>
              <div className="overview-item">
                <label>Opponent:</label>
                <p>{caseData.opponent}</p>
              </div>
              <div className="overview-item">
                <label>Court:</label>
                <p>{caseData.court}</p>
              </div>
              <div className="overview-item">
                <label>Judge:</label>
                <p>{caseData.judge || 'Not assigned'}</p>
              </div>
              <div className="overview-item">
                <label>Hearing Date:</label>
                <p>{new Date(caseData.hearingDate).toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}</p>
              </div>
              <div className="overview-item">
                <label>Status:</label>
                <p className={`status-${caseData.status}`}>{caseData.status.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <EnhancedDocumentManager caseId={caseData.id} onDocumentChange={refreshDocuments} />
        )}

        {activeTab === 'auto-generate' && (
          <AutoGenerator caseId={caseData.id} documents={documents} />
        )}

        {activeTab === 'ai-dialogue' && (
          <AIDialogue 
            caseId={caseData.id} 
            documents={documents}
          />
        )}

        {activeTab === 'ai-chronology' && (
          <ChronologyBuilder caseId={caseData.id} />
        )}

        {activeTab === 'ai-persons' && (
          <DramatisPersonae caseId={caseData.id} />
        )}

        {activeTab === 'ai-issues' && (
          <IssuesBuilder caseId={caseData.id} />
        )}

        {activeTab === 'keypoints' && (
          <KeyPointsManager caseId={caseData.id} />
        )}

        {activeTab === 'chronology' && (
          <ChronologyManager caseId={caseData.id} />
        )}

        {activeTab === 'authorities' && (
          <AuthoritiesManager caseId={caseData.id} />
        )}

        {activeTab === 'presentation' && (
          <PresentationPrep caseData={caseData} />
        )}

        {activeTab === 'settings' && (
          <SecuritySettings caseId={caseData.id} />
        )}
      </div>
    </div>
  );
};