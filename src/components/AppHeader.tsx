import React, { useState } from 'react';

interface AppHeaderProps {
  onCommandCenter: () => void;
  onSearch: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onCommandCenter,
  onSearch,
}) => {
  const [showQuickActions, setShowQuickActions] = useState(false);

  return (
    <header className="app-header-minimal">
      <div className="container">
        <div className="flex-between">
          {/* Logo and Title */}
          <div className="header-brand">
            <h1 className="app-title">Legal AI</h1>
            <p className="app-subtitle">Intelligent Case Management</p>
          </div>

          {/* Main Actions */}
          <div className="header-actions">
            {/* Command Palette - Primary Action */}
            <button
              className="btn btn-primary"
              onClick={onCommandCenter}
              title="Command Center (⌘K)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="21 21l-4.35-4.35"/>
              </svg>
              Search
            </button>

            {/* Quick Actions Menu */}
            <div className="dropdown">
              <button
                className="btn btn-ghost"
                onClick={() => setShowQuickActions(!showQuickActions)}
                title="Quick Actions"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="1"/>
                  <circle cx="19" cy="12" r="1"/>
                  <circle cx="5" cy="12" r="1"/>
                </svg>
              </button>

              {showQuickActions && (
                <div className="dropdown-menu">
                  {/* Case Management */}
                  <div className="dropdown-section">
                    <div className="dropdown-label">Case Management</div>
                    <button className="dropdown-item" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', ctrlKey: true }))}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="12" y1="18" x2="12" y2="12"/>
                        <line x1="9" y1="15" x2="15" y2="15"/>
                      </svg>
                      New Case <span className="dropdown-shortcut">⌘N</span>
                    </button>
                    <button className="dropdown-item" onClick={() => window.dispatchEvent(new Event('show-case-classification'))}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>
                      </svg>
                      Smart Classification
                    </button>
                    <button className="dropdown-item" onClick={() => window.dispatchEvent(new Event('show-calendar'))}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      Global Calendar
                    </button>
                  </div>

                  {/* AI & Analysis */}
                  <div className="dropdown-section">
                    <div className="dropdown-label">AI & Analysis</div>
                    <button className="dropdown-item" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', ctrlKey: true }))}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                      </svg>
                      Advanced Search <span className="dropdown-shortcut">⌘F</span>
                    </button>
                    <button className="dropdown-item" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', ctrlKey: true }))}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="5" cy="6" r="3"/>
                        <circle cx="5" cy="18" r="3"/>
                        <circle cx="18" cy="12" r="3"/>
                        <line x1="8" y1="7" x2="15" y2="11"/>
                        <line x1="8" y1="17" x2="15" y2="13"/>
                      </svg>
                      Knowledge Graph <span className="dropdown-shortcut">⌘G</span>
                    </button>
                    <button className="dropdown-item" onClick={() => window.dispatchEvent(new Event('show-engine-discovery'))}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
                      </svg>
                      AI Engines
                    </button>
                    <button className="dropdown-item" onClick={() => window.dispatchEvent(new Event('show-benchmarks'))}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="20" x2="18" y2="10"/>
                        <line x1="12" y1="20" x2="12" y2="4"/>
                        <line x1="6" y1="20" x2="6" y2="14"/>
                      </svg>
                      Legal Benchmarks
                    </button>
                  </div>

                  {/* System & Security */}
                  <div className="dropdown-section">
                    <div className="dropdown-label">System & Security</div>
                    <button className="dropdown-item" onClick={() => window.dispatchEvent(new Event('show-production-dashboard'))}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
                      </svg>
                      Performance Monitor
                    </button>
                    <button className="dropdown-item" onClick={() => window.dispatchEvent(new Event('show-encryption-dashboard'))}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                      Encryption Manager
                    </button>
                    <button className="dropdown-item" onClick={() => window.dispatchEvent(new Event('show-access-logging'))}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10,9 9,9 8,9"/>
                      </svg>
                      Access Logs
                    </button>
                    <button className="dropdown-item" onClick={() => window.dispatchEvent(new Event('show-database-optimization'))}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <ellipse cx="12" cy="5" rx="9" ry="3"/>
                        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                      </svg>
                      Database Optimizer
                    </button>
                  </div>

                  {/* Settings */}
                  <div className="dropdown-section">
                    <div className="dropdown-label">Configuration</div>
                    <button className="dropdown-item" onClick={() => window.dispatchEvent(new Event('show-localai'))}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                      LocalAI Setup
                    </button>
                    <button className="dropdown-item" onClick={() => window.dispatchEvent(new Event('show-setup-wizard'))}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
                      </svg>
                      Setup Wizard
                    </button>
                    <button className="dropdown-item" onClick={() => window.dispatchEvent(new Event('show-settings'))}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      Settings
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="user-menu">
              <button className="btn btn-ghost user-avatar">
                <div className="avatar">
                  <span className="avatar-initials">LA</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop for dropdown */}
      {showQuickActions && (
        <div 
          className="dropdown-backdrop"
          onClick={() => setShowQuickActions(false)}
        />
      )}
    </header>
  );
};