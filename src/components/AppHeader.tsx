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
                  {/* Core Legal Tools */}
                  <div className="dropdown-section">
                    <div className="dropdown-label">📋 Case Management</div>
                    <button className="dropdown-item" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', ctrlKey: true }))}>
                      ➕ New Case <span className="dropdown-shortcut">⌘N</span>
                    </button>
                    <button className="dropdown-item" onClick={() => window.dispatchEvent(new Event('show-document-manager'))}>
                      📄 Document Manager
                    </button>
                    <button className="dropdown-item" onClick={() => window.dispatchEvent(new Event('show-calendar'))}>
                      📅 Deadlines & Calendar
                    </button>
                    <button className="dropdown-item" onClick={() => window.dispatchEvent(new Event('show-chronology'))}>
                      ⏱️ Timeline Builder
                    </button>
                    <button className="dropdown-item" onClick={() => window.dispatchEvent(new Event('show-authorities'))}>
                      ⚖️ Legal Authorities
                    </button>
                    <button className="dropdown-item" onClick={() => window.dispatchEvent(new Event('show-dramatis-personae'))}>
                      👥 Parties & Persons
                    </button>
                  </div>

                  {/* AI-Powered Analysis */}
                  <div className="dropdown-section">
                    <div className="dropdown-label">🤖 AI Legal Analysis</div>
                    <button className="dropdown-item" onClick={() => window.dispatchEvent(new Event('show-case-classification'))}>
                      🔍 Smart Case Classification
                    </button>
                    <button className="dropdown-item" onClick={() => window.dispatchEvent(new Event('show-insight-generation'))}>
                      💡 AI Insight Generator
                    </button>
                    <button className="dropdown-item" onClick={() => window.dispatchEvent(new Event('show-presentation-prep'))}>
                      📊 Court Presentation Prep
                    </button>
                    <button className="dropdown-item" onClick={() => window.dispatchEvent(new Event('show-pleadings-manager'))}>
                      📝 Pleadings Assistant
                    </button>
                    <button className="dropdown-item" onClick={() => window.dispatchEvent(new Event('show-keypoints-presentation'))}>
                      🎯 Key Points Analysis
                    </button>
                  </div>

                  {/* Search & Discovery */}
                  <div className="dropdown-section">
                    <div className="dropdown-label">🔍 Search & Research</div>
                    <button className="dropdown-item" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', ctrlKey: true }))}>
                      🔎 Advanced Search <span className="dropdown-shortcut">⌘F</span>
                    </button>
                    <button className="dropdown-item" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', ctrlKey: true }))}>
                      🕸️ Knowledge Graph <span className="dropdown-shortcut">⌘G</span>
                    </button>
                    <button className="dropdown-item" onClick={() => window.dispatchEvent(new Event('show-engine-discovery'))}>
                      ⚙️ Multi-Engine Analysis
                    </button>
                  </div>

                  {/* System Administration */}
                  <div className="dropdown-section">
                    <div className="dropdown-label">🛠️ System & Settings</div>
                    <button className="dropdown-item" onClick={() => window.dispatchEvent(new Event('show-settings'))}>
                      ⚙️ AI & Model Settings
                    </button>
                    <button className="dropdown-item" onClick={() => window.dispatchEvent(new Event('show-benchmarks'))}>
                      📊 Legal Engine Benchmarks
                    </button>
                    <button className="dropdown-item" onClick={() => window.dispatchEvent(new Event('show-production-dashboard'))}>
                      📈 Performance Monitor
                    </button>
                    <button className="dropdown-item" onClick={() => window.dispatchEvent(new Event('show-encryption-dashboard'))}>
                      🔐 Privacy & Security
                    </button>
                  </div>

                  {/* Help & Support */}
                  <div className="dropdown-section">
                    <div className="dropdown-label">❓ Help & Support</div>
                    <button className="dropdown-item" onClick={() => window.dispatchEvent(new Event('show-help'))}>
                      📖 User Guide
                    </button>
                    <button className="dropdown-item" onClick={() => window.dispatchEvent(new Event('show-shortcuts'))}>
                      ⌨️ Keyboard Shortcuts
                    </button>
                    <button className="dropdown-item" onClick={() => window.dispatchEvent(new Event('show-about'))}>
                      ℹ️ About Legal AI
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