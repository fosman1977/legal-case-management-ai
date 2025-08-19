import React, { useState } from 'react';
import { Case } from '../types';

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
  const [activeView, setActiveView] = useState<'overview' | 'cases' | 'calendar' | 'tools'>('overview');

  const activeCases = cases.filter(c => c.status === 'active').length;
  const completedCases = cases.filter(c => c.status === 'concluded').length;
  const upcomingDeadlines = cases.flatMap(c => c.timeline || [])
    .filter(e => new Date(e.date) > new Date()).length;

  const recentCases = cases.slice(0, 3);

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <aside className="app-sidebar">
        <nav className="sidebar-nav">
          <div className="sidebar-nav-section">
            <h3 className="sidebar-nav-title">Overview</h3>
            <button
              className={`sidebar-nav-item ${activeView === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveView('overview')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <rect x="9" y="9" width="6" height="6"/>
              </svg>
              Dashboard
            </button>
          </div>

          <div className="sidebar-nav-section">
            <h3 className="sidebar-nav-title">Cases</h3>
            <button
              className={`sidebar-nav-item ${activeView === 'cases' ? 'active' : ''}`}
              onClick={() => setActiveView('cases')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
              </svg>
              All Cases
              <span className="sidebar-nav-badge">{cases.length}</span>
            </button>
            <button
              className="sidebar-nav-item"
              onClick={onNewCase}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              New Case
            </button>
          </div>

          <div className="sidebar-nav-section">
            <h3 className="sidebar-nav-title">Tools</h3>
            <button
              className="sidebar-nav-item"
              onClick={onOpenCommand}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="21 21l-4.35-4.35"/>
              </svg>
              Search
            </button>
            <button
              className={`sidebar-nav-item ${activeView === 'calendar' ? 'active' : ''}`}
              onClick={() => setActiveView('calendar')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Calendar
            </button>
            <button
              className={`sidebar-nav-item ${activeView === 'tools' ? 'active' : ''}`}
              onClick={() => setActiveView('tools')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
              </svg>
              AI Tools
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="app-main">
        <div className="animate-fade-in">
          {activeView === 'overview' && (
            <>
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
                      onClick={() => setActiveView('cases')}
                    >
                      View All
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
            </>
          )}

          {activeView === 'cases' && (
            <div>
              <div className="flex-between mb-6">
                <h2 className="heading-2">All Cases</h2>
                <button className="btn btn-primary" onClick={onNewCase}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="16"/>
                    <line x1="8" y1="12" x2="16" y2="12"/>
                  </svg>
                  New Case
                </button>
              </div>

              {cases.length === 0 ? (
                <div className="empty-state">
                  <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                  </svg>
                  <h3 className="empty-state-title">No Cases Yet</h3>
                  <p className="empty-state-description">
                    Create your first case to get started with case management.
                  </p>
                  <button className="btn btn-primary empty-state-action" onClick={onNewCase}>
                    Create First Case
                  </button>
                </div>
              ) : (
                <div className="case-list">
                  {cases.map((case_) => (
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
              )}
            </div>
          )}

          {activeView === 'calendar' && (
            <div className="empty-state">
              <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <h3 className="empty-state-title">Calendar View</h3>
              <p className="empty-state-description">
                Calendar functionality will be implemented here.
              </p>
            </div>
          )}

          {activeView === 'tools' && (
            <div className="dashboard-grid">
              <div className="dashboard-card">
                <div className="dashboard-card-header">
                  <h3 className="dashboard-card-title">
                    <svg className="dashboard-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="21 21l-4.35-4.35"/>
                    </svg>
                    AI Search
                  </h3>
                </div>
                <div className="dashboard-card-content">
                  <p className="text-body mb-4">Intelligent search across all case documents and legal databases.</p>
                  <button className="btn btn-primary">Launch Search</button>
                </div>
              </div>

              <div className="dashboard-card">
                <div className="dashboard-card-header">
                  <h3 className="dashboard-card-title">
                    <svg className="dashboard-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
                    </svg>
                    AI Engine
                  </h3>
                </div>
                <div className="dashboard-card-content">
                  <p className="text-body mb-4">Configure and monitor AI processing engines.</p>
                  <button className="btn btn-secondary">Configure</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};