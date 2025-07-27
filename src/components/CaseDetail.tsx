import React, { useState } from 'react';
import { Case } from '../types';
import { DocumentManager } from './DocumentManager';
import { KeyPointsManager } from './KeyPointsManager';
import { ChronologyManager } from './ChronologyManager';
import { AuthoritiesManager } from './AuthoritiesManager';
import { PresentationPrep } from './PresentationPrep';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'keypoints' | 'chronology' | 'authorities' | 'presentation'>('overview');

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
          <DocumentManager caseId={caseData.id} />
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
      </div>
    </div>
  );
};