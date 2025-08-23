import React from 'react';

interface AppHeaderProps {
  onCommandCenter: () => void;
  onSearch: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onCommandCenter,
  onSearch,
}) => {

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
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              Search
            </button>

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
    </header>
  );
};