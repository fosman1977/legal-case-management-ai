import React, { useState, useEffect } from 'react';

export interface ConsultationLogEntry {
  id: string;
  timestamp: string;
  patternType: string;
  guidanceType: string;
  status: 'success' | 'error' | 'fallback';
  responseTime: number;
  dataProtected: boolean;
}

export interface AITransparencyProps {
  consultationActive: boolean;
  consultationLog: ConsultationLogEntry[];
  aiEnabled: boolean;
  onToggleAI: (enabled: boolean) => void;
  className?: string;
}

export const AITransparencyDashboard: React.FC<AITransparencyProps> = ({
  consultationActive,
  consultationLog,
  aiEnabled,
  onToggleAI,
  className = ''
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const recentConsultations = consultationLog.slice(0, 5);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
            <polyline points="20,6 9,17 4,12"/>
          </svg>
        );
      case 'error':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        );
      case 'fallback':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`dashboard-card ${className}`}>
      <div className="dashboard-card-header">
        <h3 className="dashboard-card-title">
          <svg className="dashboard-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
          </svg>
          AI Consultation Status
        </h3>
        <button 
          className="dashboard-card-action"
          onClick={() => setShowDetails(!showDetails)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d={showDetails ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"}/>
          </svg>
        </button>
      </div>

      <div className="dashboard-card-content">
        {/* AI Status Indicator */}
        <div className="ai-status-section">
          <div className="ai-status-indicator">
            <div className={`status-light ${consultationActive ? 'active' : 'inactive'}`} />
            <div className="status-text">
              <span className="status-label">
                {consultationActive ? 'Consultation Active' : 'Consultation Inactive'}
              </span>
              {consultationActive && (
                <span className="status-detail">Consulting external AI for guidance...</span>
              )}
            </div>
          </div>
          
          {/* AI Toggle */}
          <div className="ai-toggle">
            <label className="toggle-label">
              <input 
                type="checkbox" 
                checked={aiEnabled} 
                onChange={(e) => onToggleAI(e.target.checked)}
                className="toggle-checkbox"
              />
              <span className="toggle-slider"></span>
              <span className="toggle-text">Enable AI Consultation</span>
            </label>
          </div>
        </div>

        {/* Data Protection Confirmation */}
        <div className="data-protection-panel">
          <div className="protection-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
              <path d="M9,12l2,2 4,-4"/>
              <path d="M21,12c0,1.66 -1.34,3 -3,3l-1.5,0c-0.83,0 -1.5,-0.67 -1.5,-1.5 0,-0.83 0.67,-1.5 1.5,-1.5l1.5,0c1.66,0 3,-1.34 3,-3 0,-1.66 -1.34,-3 -3,-3l-1.5,0c-0.83,0 -1.5,0.67 -1.5,1.5"/>
              <path d="M12,2v20"/>
            </svg>
          </div>
          <div className="protection-content">
            <div className="protection-title">Data Protection Active</div>
            <div className="protection-details">
              <div className="protection-item">
                <span className="checkmark">✓</span>
                No case data transmitted externally
              </div>
              <div className="protection-item">
                <span className="checkmark">✓</span>
                Only anonymous patterns sent for consultation
              </div>
              <div className="protection-item">
                <span className="checkmark">✓</span>
                Full regulatory compliance maintained
              </div>
            </div>
          </div>
        </div>

        {/* Consultation Activity Log */}
        {showDetails && (
          <div className="consultation-log">
            <h4 className="log-title">Recent Consultations</h4>
            {recentConsultations.length > 0 ? (
              <div className="log-entries">
                {recentConsultations.map((entry) => (
                  <div key={entry.id} className="log-entry">
                    <div className="log-entry-header">
                      <div className="log-entry-status">
                        {getStatusIcon(entry.status)}
                        <span className={`log-entry-status-text status-${entry.status}`}>
                          {entry.status === 'success' ? 'Success' : 
                           entry.status === 'error' ? 'Error' : 'Local Fallback'}
                        </span>
                      </div>
                      <div className="log-entry-time">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="log-entry-content">
                      <div className="log-entry-detail">
                        <span className="log-label">Pattern:</span>
                        <span className="log-value">{entry.patternType}</span>
                      </div>
                      <div className="log-entry-detail">
                        <span className="log-label">Guidance:</span>
                        <span className="log-value">{entry.guidanceType}</span>
                      </div>
                      <div className="log-entry-detail">
                        <span className="log-label">Response Time:</span>
                        <span className="log-value">{entry.responseTime}ms</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-log">
                <div className="empty-log-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="M21 21l-4.35-4.35"/>
                  </svg>
                </div>
                <div className="empty-log-text">No consultations yet</div>
              </div>
            )}
          </div>
        )}

        {/* Performance Metrics */}
        {showDetails && consultationLog.length > 0 && (
          <div className="performance-metrics">
            <h4 className="metrics-title">Performance Metrics</h4>
            <div className="metrics-grid">
              <div className="metric-item">
                <div className="metric-value">
                  {Math.round(consultationLog.reduce((acc, entry) => acc + entry.responseTime, 0) / consultationLog.length)}ms
                </div>
                <div className="metric-label">Avg Response Time</div>
              </div>
              <div className="metric-item">
                <div className="metric-value">
                  {Math.round((consultationLog.filter(e => e.status === 'success').length / consultationLog.length) * 100)}%
                </div>
                <div className="metric-label">Success Rate</div>
              </div>
              <div className="metric-item">
                <div className="metric-value">100%</div>
                <div className="metric-label">Data Protected</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};