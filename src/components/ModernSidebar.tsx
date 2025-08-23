import React, { useState } from 'react';

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  description: string;
  badge?: number;
  children?: NavigationItem[];
}

interface ModernSidebarProps {
  currentView: string;
  onNavigate: (view: string, context?: any) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const navigationStructure: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '🏠',
    description: 'Overview and recent activity'
  },
  {
    id: 'cases',
    label: 'Cases',
    icon: '⚖️',
    description: 'Manage legal cases and matters',
    children: [
      { id: 'cases-all', label: 'All Cases', icon: '📋', description: 'View all cases' },
      { id: 'cases-active', label: 'Active Cases', icon: '🟢', description: 'Currently active cases' },
      { id: 'cases-create', label: 'New Case', icon: '➕', description: 'Create new case' }
    ]
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: '📄',
    description: 'Document management and processing',
    children: [
      { id: 'documents-manager', label: 'Document Manager', icon: '📁', description: 'Organize documents' },
      { id: 'documents-upload', label: 'Upload & Scan', icon: '📤', description: 'Add new documents' },
      { id: 'documents-processing', label: 'Processing Queue', icon: '⚙️', description: 'Document analysis status' },
      { id: 'documents-pleadings', label: 'Pleadings Manager', icon: '📋', description: 'Manage legal pleadings' }
    ]
  },
  {
    id: 'case-building',
    label: 'Case Building',
    icon: '🏗️',
    description: 'Build and organize case materials',
    children: [
      { id: 'case-calendar', label: 'Calendar & Deadlines', icon: '📅', description: 'Track important dates' },
      { id: 'case-timeline', label: 'Timeline Builder', icon: '⏱️', description: 'Create case chronology' },
      { id: 'case-authorities', label: 'Legal Authorities', icon: '⚖️', description: 'Manage case law' },
      { id: 'case-parties', label: 'Parties & Persons', icon: '👥', description: 'Dramatis personae' }
    ]
  },
  {
    id: 'research',
    label: 'Research',
    icon: '🔍',
    description: 'Legal research and analysis tools',
    children: [
      { id: 'research-parallel-ai', label: 'Parallel AI Research', icon: '🤖', description: 'AI-powered legal research' },
      { id: 'research-advanced-search', label: 'Advanced Search', icon: '🔎', description: 'Deep search capabilities' },
      { id: 'research-knowledge-graph', label: 'Knowledge Graph', icon: '🕸️', description: 'Visual case relationships' }
    ]
  },
  {
    id: 'analysis',
    label: 'Analysis',
    icon: '📊',
    description: 'AI-powered document and case analysis',
    children: [
      { id: 'analysis-classification', label: 'Smart Classification', icon: '🏷️', description: 'Categorize cases and docs' },
      { id: 'analysis-insights', label: 'Insight Generation', icon: '💡', description: 'AI-generated insights' },
      { id: 'analysis-presentation', label: 'Presentation Prep', icon: '🎯', description: 'Court presentation tools' },
      { id: 'analysis-keypoints', label: 'Key Points Analysis', icon: '📝', description: 'Extract key information' }
    ]
  },
  {
    id: 'tools',
    label: 'Tools',
    icon: '⚙️',
    description: 'System tools and optimization',
    children: [
      { id: 'tools-engine-discovery', label: 'Engine Discovery', icon: '🔧', description: 'Legal processing engines' },
      { id: 'tools-benchmarks', label: 'Legal Benchmarks', icon: '📈', description: 'Performance metrics' },
      { id: 'tools-optimization', label: 'System Optimization', icon: '🚀', description: 'Performance tuning' },
      { id: 'tools-health', label: 'System Health', icon: '💚', description: 'Status monitoring' },
      { id: 'tools-security', label: 'Privacy & Security', icon: '🔐', description: 'Security management' },
      { id: 'tools-presentation', label: 'Presentation Prep', icon: '🎯', description: 'Court presentation tools' },
      { id: 'tools-compliance', label: 'Compliance Check', icon: '✅', description: 'Regulatory compliance' },
      { id: 'tools-lnat-testing', label: 'LNAT Testing', icon: '🧪', description: 'Legal aptitude testing' },
      { id: 'tools-comprehensive-testing', label: 'Comprehensive Testing', icon: '📊', description: 'Full system testing' },
      { id: 'tools-backend-status', label: 'Backend Status', icon: '🔧', description: 'System status monitoring' }
    ]
  }
];

export const ModernSidebar: React.FC<ModernSidebarProps> = ({
  currentView,
  onNavigate,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['dashboard']));

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleItemClick = (item: NavigationItem) => {
    console.log('Sidebar item clicked:', item.id, item.label);
    if (item.children && item.children.length > 0) {
      toggleSection(item.id);
    } else {
      console.log('Calling onNavigate for:', item.id);
      onNavigate(item.id);
    }
  };

  const isActive = (itemId: string) => {
    return currentView === itemId || currentView.startsWith(itemId + '-');
  };

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const active = isActive(item.id);
    const expanded = expandedSections.has(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id} className="nav-item-container">
        <button
          className={`nav-item ${active ? 'active' : ''} level-${level}`}
          onClick={() => handleItemClick(item)}
          title={isCollapsed ? item.label : item.description}
        >
          <div className="nav-item-content">
            <span className="nav-icon">{item.icon}</span>
            {!isCollapsed && (
              <>
                <span className="nav-label">{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
                {hasChildren && (
                  <span className={`nav-expand ${expanded ? 'expanded' : ''}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9,18 15,12 9,6"></polyline>
                    </svg>
                  </span>
                )}
              </>
            )}
          </div>
        </button>

        {hasChildren && expanded && !isCollapsed && (
          <div className="nav-children">
            {item.children!.map(child => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`modern-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="logo-section">
          <span className="logo-icon">⚖️</span>
          {!isCollapsed && (
            <div className="logo-text">
              <h2>Legal AI</h2>
              <p>Case Management</p>
            </div>
          )}
        </div>
        <button
          className="collapse-toggle"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points={isCollapsed ? "9,18 15,12 9,6" : "15,18 9,12 15,6"}></polyline>
          </svg>
        </button>
      </div>

      {/* Quick Actions */}
      {!isCollapsed && (
        <div className="quick-actions">
          <button 
            className="quick-action-btn primary"
            onClick={() => onNavigate('cases-create')}
          >
            <span>➕</span>
            New Case
          </button>
          <button 
            className="quick-action-btn secondary"
            onClick={() => onNavigate('documents-upload')}
          >
            <span>📤</span>
            Upload Doc
          </button>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="sidebar-navigation">
        {navigationStructure.map(item => renderNavigationItem(item))}
      </nav>

      {/* Bottom Section */}
      <div className="sidebar-footer">
        <button 
          className="nav-item"
          onClick={() => onNavigate('settings')}
          title={isCollapsed ? 'Settings' : 'Application settings'}
        >
          <div className="nav-item-content">
            <span className="nav-icon">⚙️</span>
            {!isCollapsed && <span className="nav-label">Settings</span>}
          </div>
        </button>
        
        <button 
          className="nav-item"
          onClick={() => onNavigate('help')}
          title={isCollapsed ? 'Help' : 'Help and support'}
        >
          <div className="nav-item-content">
            <span className="nav-icon">❓</span>
            {!isCollapsed && <span className="nav-label">Help & Support</span>}
          </div>
        </button>
        
        <button 
          className="nav-item"
          onClick={() => onNavigate('shortcuts')}
          title={isCollapsed ? 'Shortcuts' : 'Keyboard shortcuts'}
        >
          <div className="nav-item-content">
            <span className="nav-icon">⌨️</span>
            {!isCollapsed && <span className="nav-label">Shortcuts</span>}
          </div>
        </button>

        <button 
          className="nav-item"
          onClick={() => onNavigate('about')}
          title={isCollapsed ? 'About' : 'About Legal AI'}
        >
          <div className="nav-item-content">
            <span className="nav-icon">ℹ️</span>
            {!isCollapsed && <span className="nav-label">About</span>}
          </div>
        </button>

        {!isCollapsed && (
          <div className="user-info">
            <div className="user-avatar">👤</div>
            <div className="user-details">
              <div className="user-name">Legal User</div>
              <div className="user-role">Administrator</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernSidebar;