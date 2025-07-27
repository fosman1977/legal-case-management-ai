import React from 'react';
import { Case } from '../types';

interface CaseListProps {
  cases: Case[];
  onSelectCase: (caseId: string) => void;
  selectedCaseId?: string;
  onNewCase: () => void;
}

export const CaseList: React.FC<CaseListProps> = ({ 
  cases, 
  onSelectCase, 
  selectedCaseId,
  onNewCase 
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: Case['status']) => {
    const colors = {
      preparation: 'badge-warning',
      ready: 'badge-success',
      concluded: 'badge-secondary'
    };
    return colors[status];
  };

  return (
    <div className="case-list">
      <div className="case-list-header">
        <h3>My Cases</h3>
        <button className="btn btn-primary" onClick={onNewCase}>
          + New Case
        </button>
      </div>
      <div className="case-list-items">
        {cases.length === 0 ? (
          <p className="empty-state">No cases yet. Create your first case to get started.</p>
        ) : (
          cases.map(caseItem => (
            <div
              key={caseItem.id}
              className={`case-item ${selectedCaseId === caseItem.id ? 'selected' : ''}`}
              onClick={() => onSelectCase(caseItem.id)}
            >
              <div className="case-item-header">
                <h4>{caseItem.title}</h4>
                <span className={`badge ${getStatusBadge(caseItem.status)}`}>
                  {caseItem.status}
                </span>
              </div>
              <p className="case-ref">{caseItem.courtReference}</p>
              <p className="case-parties">{caseItem.client} v {caseItem.opponent}</p>
              <div className="case-item-footer">
                <span className="court">{caseItem.court}</span>
                <span className="hearing-date">
                  Hearing: {formatDate(caseItem.hearingDate)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};