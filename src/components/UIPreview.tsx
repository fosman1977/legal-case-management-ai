/**
 * UI/UX Preview Component
 * Demonstrates the revolutionary interface design concepts
 */

import React, { useState } from 'react';

interface UIPreviewProps {
  onClose: () => void;
}

export const UIPreview: React.FC<UIPreviewProps> = ({ onClose }) => {
  const [activeDemo, setActiveDemo] = useState<'mission-control' | 'command-center' | 'case-setup' | 'document-viewer' | 'criminal-workspace'>('mission-control');
  const [showCommandCenter, setShowCommandCenter] = useState(false);

  const MissionControlDemo = () => (
    <div className="ui-demo-container">
      <div className="ui-demo-header">
        <h1>🏛️ Agentic Legal Intelligence</h1>
        <div className="ui-demo-header-actions">
          <span className="notification-badge">🔔 3</span>
          <span className="user-info">👤 Sarah QC</span>
          <button className="settings-btn">⚙️</button>
        </div>
      </div>

      <div className="ui-demo-search-bar" onClick={() => setShowCommandCenter(true)}>
        <div className="search-input-demo">
          🔍 What do you need? <span className="search-placeholder">Type anything or Cmd+K</span>
        </div>
      </div>

      <div className="ui-demo-main-grid">
        <div className="ui-demo-active-case">
          <h3>🏛️ Active Case</h3>
          <div className="case-title">R v Smith (Criminal)</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '67%' }}></div>
            <span className="progress-text">67%</span>
          </div>
          
          <div className="critical-actions">
            <h4>🔥 Critical Actions</h4>
            <div className="action-item urgent">• Plea deadline: 3d</div>
            <div className="action-item warning">• Disclosure: 5d</div>
            <div className="action-item high-risk">• Witness risk: HIGH</div>
          </div>
          
          <button className="view-details-btn">View Details</button>
        </div>

        <div className="ui-demo-intelligence-pulse">
          <h3>⚡ Intelligence Pulse</h3>
          
          <div className="intelligence-metric">
            <span className="metric-label">📊 Case Strength:</span>
            <span className="metric-value strong">STRONG (87%)</span>
          </div>
          
          <div className="intelligence-metric">
            <span className="metric-label">💰 Settlement Likely:</span>
            <span className="metric-value">£2.3M</span>
          </div>
          
          <div className="intelligence-metric">
            <span className="metric-label">⚖️ Success Probability:</span>
            <span className="metric-value">78%</span>
          </div>
          
          <div className="intelligence-metric">
            <span className="metric-label">⏰ Optimal timing:</span>
            <span className="metric-value">Next 2 weeks</span>
          </div>

          <div className="next-actions">
            <h4>🎯 Next Best Actions:</h4>
            <div className="action-recommendation">1. File summary judgment motion</div>
            <div className="action-recommendation">2. Depose key witness (personality profile suggests vulnerability)</div>
            <div className="action-recommendation">3. Negotiate Part 36 offer at £2.1M</div>
          </div>
        </div>
      </div>

      <div className="ui-demo-recent-activity">
        <h3>📚 Recent Activity</h3>
        <div className="activity-item">
          <span className="activity-icon">○</span>
          <span className="activity-text">Document reviewed: witness_statement_jones.pdf (3 contradictions)</span>
        </div>
        <div className="activity-item">
          <span className="activity-icon">○</span>
          <span className="activity-text">Strategy updated: Settlement probability increased 15%</span>
        </div>
        <div className="activity-item">
          <span className="activity-icon">○</span>
          <span className="activity-text">Alert: New similar case decided - strengthens position</span>
        </div>
      </div>
    </div>
  );

  const CommandCenterDemo = () => (
    <div className="command-center-overlay" onClick={() => setShowCommandCenter(false)}>
      <div className="command-center-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Command Center</h2>
        
        <div className="command-input">
          <span className="command-icon">🔍</span>
          <input 
            type="text" 
            placeholder="What's my best strategy for this fraud case?"
            className="command-input-field"
            autoFocus
          />
        </div>

        <div className="command-suggestions">
          <h3>💡 Suggestions:</h3>
          <div className="suggestion-item">
            <span className="suggestion-icon">🧠</span>
            <span className="suggestion-text">"Analyze judge's sentencing patterns for fraud cases"</span>
          </div>
          <div className="suggestion-item">
            <span className="suggestion-icon">⚖️</span>
            <span className="suggestion-text">"Calculate optimal plea timing with discount factors"</span>
          </div>
          <div className="suggestion-item">
            <span className="suggestion-icon">🔍</span>
            <span className="suggestion-text">"Find contradictions in prosecution evidence"</span>
          </div>
          <div className="suggestion-item">
            <span className="suggestion-icon">💰</span>
            <span className="suggestion-text">"Estimate confiscation exposure with benefit calculation"</span>
          </div>
        </div>

        <div className="quick-actions">
          <h3>⚡ Quick Actions:</h3>
          <div className="quick-action-buttons">
            <button className="quick-action-btn">🏛️ Switch Case</button>
            <button className="quick-action-btn">📄 View Documents</button>
            <button className="quick-action-btn">⏰ Check Deadlines</button>
            <button className="quick-action-btn">🤖 AI Analysis</button>
          </div>
        </div>

        <div className="recent-results">
          <h3>📈 Recent Results:</h3>
          <div className="result-item">
            <span>• "Part 36 calculator" → Optimal offer: £1.8M (78% acceptance)</span>
          </div>
          <div className="result-item">
            <span>• "Judge Smith patterns" → Rules against prosecution 60% in fraud cases</span>
          </div>
        </div>
      </div>
    </div>
  );

  const CaseSetupDemo = () => (
    <div className="case-setup-container">
      <h2>🗂️ New Case Setup</h2>
      
      <div className="case-name-input">
        <label>Case Name:</label>
        <input type="text" value="R v Thompson" className="case-input" />
      </div>

      <div className="ai-detection">
        <div className="detection-result">
          <span className="detection-icon">🤖</span>
          <span className="detection-text">AI Detection: Criminal Fraud with POCA implications</span>
        </div>
        <div className="confidence-bar">
          <span>Confidence:</span>
          <div className="confidence-meter">
            <div className="confidence-fill" style={{ width: '95%' }}></div>
            <span className="confidence-text">95%</span>
          </div>
        </div>
      </div>

      <div className="practice-area-selection">
        <h3>⚙️ Adjust Classification:</h3>
        <div className="practice-buttons">
          <button className="practice-btn active">Criminal</button>
          <button className="practice-btn">Civil</button>
          <button className="practice-btn">POCA</button>
          <button className="practice-btn">Mixed</button>
        </div>
      </div>

      <div className="category-selection">
        <h3>Specific Categories: (select multiple)</h3>
        <div className="category-grid">
          <label className="category-checkbox">
            <input type="checkbox" checked />
            <span>Fraud/Financial Crime</span>
          </label>
          <label className="category-checkbox">
            <input type="checkbox" checked />
            <span>Confiscation Proceedings</span>
          </label>
          <label className="category-checkbox">
            <input type="checkbox" checked />
            <span>Money Laundering</span>
          </label>
          <label className="category-checkbox">
            <input type="checkbox" checked />
            <span>Restraint Orders</span>
          </label>
          <label className="category-checkbox">
            <input type="checkbox" />
            <span>Civil Recovery</span>
          </label>
          <label className="category-checkbox">
            <input type="checkbox" />
            <span>Unexplained Wealth Orders</span>
          </label>
        </div>
      </div>

      <div className="features-activated">
        <h3>💡 Features Activated:</h3>
        <div className="feature-list">
          <div className="feature-item">• Criminal court deadlines tracker</div>
          <div className="feature-item">• POCA benefit calculator</div>
          <div className="feature-item">• Hidden asset detection</div>
          <div className="feature-item">• Sentencing guidelines intelligence</div>
          <div className="feature-item">• Legal aid optimization</div>
        </div>
      </div>

      <div className="setup-actions">
        <button className="btn btn-primary">📁 Create Case</button>
        <button className="btn btn-secondary">🔄 Re-scan</button>
        <button className="btn btn-tertiary">❌ Cancel</button>
      </div>
    </div>
  );

  const DocumentViewerDemo = () => (
    <div className="document-viewer-demo">
      <div className="document-header">
        <span className="document-title">📄 witness_statement_jones.pdf</span>
        <div className="document-actions">
          <button className="doc-action-btn">⚙️</button>
          <button className="doc-action-btn">🔍</button>
          <button className="doc-action-btn">✕</button>
        </div>
      </div>

      <div className="document-content-area">
        <div className="document-sidebar">
          <div className="tags-section">
            <h4>🏷️ Smart Tags</h4>
            <div className="tag-buttons">
              <button className="smart-tag">+ Contradicts Smith</button>
              <button className="smart-tag">+ Key Evidence</button>
              <button className="smart-tag">+ Timeline Issue</button>
              <button className="smart-tag">+ Credibility</button>
            </div>
          </div>

          <div className="ai-suggestions">
            <h4>💡 AI Suggestions:</h4>
            <div className="suggestion-list">
              <div className="ai-suggestion">• Hostile witness</div>
              <div className="ai-suggestion">• Memory reliability</div>
              <div className="ai-suggestion">• Cross-exam strategy</div>
            </div>
          </div>

          <div className="related-docs">
            <h4>🔗 Related:</h4>
            <div className="related-list">
              <div className="related-item">• Smith statement</div>
              <div className="related-item">• CCTV footage</div>
              <div className="related-item">• Expert report</div>
            </div>
          </div>

          <div className="analysis-summary">
            <h4>📊 Analysis:</h4>
            <div className="analysis-metric">Credibility: 67%</div>
            <div className="analysis-metric">Reliability: 54%</div>
            <div className="analysis-metric">Value: High</div>
          </div>
        </div>

        <div className="document-text">
          <h3>WITNESS STATEMENT</h3>
          <br />
          <p>I, Michael Jones, make this statement...</p>
          <br />
          <p>
            At approximately <span className="highlight-red">3:30pm</span> on 15th March 2023, I witnessed the defendant enter...
          </p>
          <div className="ai-annotation contradiction">
            🔴 CONTRADICTION: Smith's statement says 2:30pm - 1 hour difference
          </div>
          <br />
          <p>
            The defendant appeared nervous and was <span className="highlight-yellow">carrying a large bag</span> which he...
          </p>
          <div className="ai-annotation evidence">
            🟡 KEY EVIDENCE: Physical description matches forensic findings
          </div>
          <br />
          <p>
            <span className="highlight-orange">I am certain of these facts</span> because...
          </p>
          <div className="ai-annotation credibility">
            🟠 CREDIBILITY ISSUE: "Certain" but multiple inconsistencies noted
          </div>
        </div>
      </div>

      <div className="highlighting-toolbar">
        <span>🎨 Highlighting Toolbar:</span>
        <button className="highlight-btn red">🔴 Contradiction</button>
        <button className="highlight-btn yellow">🟡 Evidence</button>
        <button className="highlight-btn blue">🔵 Legal Issue</button>
        <button className="highlight-btn green">🟢 Fact</button>
        <button className="highlight-btn purple">🟣 Custom</button>
      </div>
    </div>
  );

  const CriminalWorkspaceDemo = () => (
    <div className="criminal-workspace-demo">
      <div className="workspace-header">
        <h2>⚖️ Criminal Defence - R v Thompson</h2>
        <div className="workspace-switcher">
          <button className="switch-btn active">Criminal</button>
          <button className="switch-btn">Civil</button>
          <button className="switch-btn">POCA</button>
        </div>
      </div>

      <div className="workspace-widgets">
        <div className="widget sentencing-calc">
          <h3>Sentencing Calculator</h3>
          <div className="widget-content">
            <div className="charge-list">
              <div className="charge-item">• Fraud (Cat 4: £2M)</div>
              <div className="charge-item">• Money Laundering</div>
            </div>
            <div className="guidelines-range">
              <strong>Guidelines Range:</strong><br />
              4-7 years (Cat B)
            </div>
            <div className="plea-credit">
              <strong>Plea Credit:</strong> 33%
            </div>
            <div className="likely-sentence">
              <strong>Likely:</strong> 3-5 years
            </div>
            <button className="widget-btn">Mitigation Planner</button>
          </div>
        </div>

        <div className="widget legal-aid">
          <h3>Legal Aid Status</h3>
          <div className="widget-content">
            <div className="aid-status">
              <strong>Representation:</strong><br />
              ✓ Granted (Crown)
            </div>
            <div className="contribution">
              <strong>Contribution:</strong> £0
            </div>
            <div className="cco-risk">
              <strong>CCO Risk:</strong> Medium
            </div>
            <div className="next-review">
              <strong>Next Review:</strong> 45d
            </div>
            <button className="widget-btn">Optimize</button>
          </div>
        </div>

        <div className="widget disclosure">
          <h3>CPS Disclosure</h3>
          <div className="widget-content">
            <div className="disclosure-stage">
              <strong>Stage:</strong> Primary
            </div>
            <div className="due-date">
              <strong>Due:</strong> 12 days
            </div>
            <div className="status">
              <strong>Status:</strong> 67% received
            </div>
            <div className="unused-items">
              <strong>Unused:</strong> 15 items
            </div>
            <div className="disclosure-actions">
              <button className="widget-btn-sm">View Schedule</button>
              <button className="widget-btn-sm">Chase Missing</button>
            </div>
          </div>
        </div>
      </div>

      <div className="judge-intelligence">
        <h3>Judge Intelligence</h3>
        <div className="judge-profile">
          <h4>HHJ Sarah Williams (Crown Court)</h4>
          <div className="judge-stats">
            <div className="stat-item">• Sentencing: 15% below guidelines average</div>
            <div className="stat-item">• Plea acceptance: High (92% accepted within 2 weeks)</div>
            <div className="stat-item">• Case management: Strict on deadlines, prefers efficiency</div>
            <div className="stat-item">• Recent pattern: Favourable to early cooperation (last 6 months)</div>
          </div>
          <div className="strategy-recommendation">
            <strong>💡 Strategy:</strong> File plea within 14 days for maximum discount probability
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="ui-preview-container">
      <div className="ui-preview-header">
        <h1>🎨 Revolutionary UI/UX Preview</h1>
        <button onClick={onClose} className="preview-close-btn">✕</button>
      </div>

      <div className="ui-preview-nav">
        <button 
          className={`nav-btn ${activeDemo === 'mission-control' ? 'active' : ''}`}
          onClick={() => setActiveDemo('mission-control')}
        >
          🏛️ Mission Control
        </button>
        <button 
          className={`nav-btn ${activeDemo === 'case-setup' ? 'active' : ''}`}
          onClick={() => setActiveDemo('case-setup')}
        >
          🗂️ Case Setup
        </button>
        <button 
          className={`nav-btn ${activeDemo === 'document-viewer' ? 'active' : ''}`}
          onClick={() => setActiveDemo('document-viewer')}
        >
          📄 Document Viewer
        </button>
        <button 
          className={`nav-btn ${activeDemo === 'criminal-workspace' ? 'active' : ''}`}
          onClick={() => setActiveDemo('criminal-workspace')}
        >
          ⚖️ Criminal Workspace
        </button>
      </div>

      <div className="ui-preview-content">
        {activeDemo === 'mission-control' && <MissionControlDemo />}
        {activeDemo === 'case-setup' && <CaseSetupDemo />}
        {activeDemo === 'document-viewer' && <DocumentViewerDemo />}
        {activeDemo === 'criminal-workspace' && <CriminalWorkspaceDemo />}
      </div>

      {showCommandCenter && <CommandCenterDemo />}
    </div>
  );
};