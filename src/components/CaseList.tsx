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
      active: 'badge-primary',
      preparation: 'badge-warning',
      ready: 'badge-success',
      concluded: 'badge-secondary'
    };
    return colors[status] || 'badge-secondary';
  };

  const getDaysUntilHearing = (hearingDate: string) => {
    const hearing = new Date(hearingDate);
    const today = new Date();
    const diffTime = hearing.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDaysLabel = (days: number) => {
    if (days < 0) {
      return `${Math.abs(days)} days ago`;
    } else if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Tomorrow';
    } else {
      return `${days} days left`;
    }
  };

  const getDaysColor = (days: number) => {
    if (days < 0) return 'days-past';
    if (days === 0) return 'days-today';
    if (days <= 7) return 'days-urgent';
    if (days <= 30) return 'days-soon';
    return 'days-future';
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
          cases.map(caseItem => {
            const daysLeft = caseItem.hearingDate ? getDaysUntilHearing(caseItem.hearingDate) : null;
            return (
              <div
                key={caseItem.id}
                className={`case-item ${selectedCaseId === caseItem.id ? 'selected' : ''}`}
                onClick={() => onSelectCase(caseItem.id)}
              >
                <div className="case-item-header">
                  <h4>{caseItem.title}</h4>
                  <div className="case-badges">
                    <span className={`badge ${getStatusBadge(caseItem.status)}`}>
                      {caseItem.status}
                    </span>
                    {daysLeft !== null && (
                      <span className={`days-countdown ${getDaysColor(daysLeft)}`}>
                        {getDaysLabel(daysLeft)}
                      </span>
                    )}
                  </div>
                </div>
                {caseItem.courtReference && <p className="case-ref">{caseItem.courtReference}</p>}
                {caseItem.description && <p className="case-description">{caseItem.description}</p>}
                {caseItem.client && caseItem.opponent && (
                  <p className="case-parties">{caseItem.client} v {caseItem.opponent}</p>
                )}
                <div className="case-item-footer">
                  {caseItem.court && <span className="court">{caseItem.court}</span>}
                  {caseItem.hearingDate && (
                    <span className="hearing-date">
                      📅 {formatDate(caseItem.hearingDate)}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};