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
                  <div className="dropdown-section">
                    <div className="dropdown-label">Cases</div>
                    <button className="dropdown-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                      </svg>
                      New Case
                    </button>
                    <button className="dropdown-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      Calendar
                    </button>
                  </div>

                  <div className="dropdown-section">
                    <div className="dropdown-label">Tools</div>
                    <button className="dropdown-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 19c-5 0-8-3-8-8s3-8 8-8 8 3 8 8-3 8-8 8z"/>
                        <path d="m21 21-4.35-4.35"/>
                      </svg>
                      Advanced Search
                    </button>
                    <button className="dropdown-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
                      </svg>
                      AI Engine
                    </button>
                    <button className="dropdown-item">
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