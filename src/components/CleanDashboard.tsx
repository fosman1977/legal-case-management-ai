import React, { useState, useEffect } from 'react';
import { Case } from '../types';
import { AITransparencyDashboard, ConsultationLogEntry } from './AITransparencyDashboard';
import { ComplianceConfirmationSystem } from './ComplianceConfirmationSystem';
import './AITransparencyDashboard.css';
import './ComplianceConfirmationSystem.css';

interface CleanDashboardProps {
  cases: Case[];
  onNewCase: () => void;
  onSelectCase: (caseId: string) => void;
  onOpenCommand: () => void;
}

export const CleanDashboard: React.FC<CleanDashboardProps> = ({
  cases,
  onNewCase,
  onSelectCase,
  onOpenCommand,
}) => {
  // AI Transparency State
  const [consultationActive, setConsultationActive] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [consultationLog, setConsultationLog] = useState<ConsultationLogEntry[]>([]);
  const [showComplianceModal, setShowComplianceModal] = useState(false);

  // Demo consultation log data
  useEffect(() => {
    // Add some sample consultation entries for demonstration
    const sampleEntries: ConsultationLogEntry[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        patternType: 'Commercial Contract Analysis',
        guidanceType: 'Contract Interpretation Framework',
        status: 'success',
        responseTime: 1250,
        dataProtected: true
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        patternType: 'Employment Law Issue',
        guidanceType: 'Dismissal Procedures Guidance',
        status: 'success',
        responseTime: 890,
        dataProtected: true
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        patternType: 'Property Dispute Pattern',
        guidanceType: 'Landlord Tenant Rights Analysis',
        status: 'fallback',
        responseTime: 0,
        dataProtected: true
      }
    ];
    setConsultationLog(sampleEntries);
  }, []);

  const handleToggleAI = (enabled: boolean) => {
    setAiEnabled(enabled);
    if (!enabled) {
      setConsultationActive(false);
    }
  };

  const activeCases = cases.filter(c => c.status === 'active').length;
  const completedCases = cases.filter(c => c.status === 'concluded').length;
  const upcomingDeadlines = cases.flatMap(c => c.timeline || [])
    .filter(e => new Date(e.date) > new Date()).length;

  const recentCases = cases.slice(0, 3);

  return (
    <div className="animate-fade-in">
      {/* AI Transparency Dashboard */}
      <AITransparencyDashboard
        consultationActive={consultationActive}
        consultationLog={consultationLog}
        aiEnabled={aiEnabled}
        onToggleAI={handleToggleAI}
        className="mb-6"
      />

      {/* Quick Stats */}
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">
              <svg className="dashboard-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
              </svg>
              Active Cases
            </h3>
            <button className="dashboard-card-action">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
          <div className="dashboard-card-content">
            <div className="text-3xl font-bold text-gray-900 mb-2">{activeCases}</div>
            <p className="text-small text-muted">Cases requiring attention</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">
              <svg className="dashboard-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9,11 12,14 22,4"/>
                <path d="M21,12v7a2,2 0,0 1,-2,2H5a2,2 0,0 1,-2,-2V5a2,2 0,0 1,2,-2h11"/>
              </svg>
              Completed
            </h3>
          </div>
          <div className="dashboard-card-content">
            <div className="text-3xl font-bold text-gray-900 mb-2">{completedCases}</div>
            <p className="text-small text-muted">Successfully closed cases</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">
              <svg className="dashboard-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
              Upcoming
            </h3>
          </div>
          <div className="dashboard-card-content">
            <div className="text-3xl font-bold text-gray-900 mb-2">{upcomingDeadlines}</div>
            <p className="text-small text-muted">Deadlines this month</p>
          </div>
        </div>
      </div>

      {/* Recent Cases */}
      {recentCases.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <div className="flex-between mb-6">
            <h2 className="heading-2">Recent Cases</h2>
            <button 
              className="btn btn-secondary"
              onClick={onNewCase}
            >
              View All Cases
            </button>
          </div>

          <div className="case-list">
            {recentCases.map((case_) => (
              <div 
                key={case_.id}
                className="case-card"
                onClick={() => onSelectCase(case_.id)}
              >
                <div className="case-card-header">
                  <div>
                    <h3 className="case-card-title">{case_.title}</h3>
                    <div className="case-card-number">#{case_.id.slice(0, 8)}</div>
                  </div>
                  <span className={`status status-${case_.status === 'active' ? 'warning' : 'success'}`}>
                    {case_.status}
                  </span>
                </div>
                <div className="case-card-meta">
                  <div className="case-card-meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    {case_.client}
                  </div>
                  <div className="case-card-meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    {new Date(case_.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compliance Modal */}
      {showComplianceModal && (
        <div className="modal-backdrop">
          <div className="modal-container">
            <ComplianceConfirmationSystem 
              onClose={() => setShowComplianceModal(false)}
              className="compliance-modal"
            />
          </div>
        </div>
      )}
    </div>
  );
};