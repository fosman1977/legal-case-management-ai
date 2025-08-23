/**
 * Strategic Insights View Component - Week 6 Day 1-2
 * Display AI-generated strategic legal insights
 */

import React, { useState } from 'react';

const StrategicInsightsView = ({ insights }) => {
  const [expandedSection, setExpandedSection] = useState('strategic_framework');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.7);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const formatInsightText = (text) => {
    if (!text) return 'No insights available for this section.';
    
    // Split into paragraphs and format
    return text.split('\n\n').map((paragraph, idx) => {
      // Check for bullet points
      if (paragraph.includes('- ')) {
        const items = paragraph.split('\n').filter(line => line.trim().startsWith('-'));
        if (items.length > 0) {
          return (
            <ul key={idx} className="insight-list">
              {items.map((item, i) => (
                <li key={i}>{item.replace(/^-\s*/, '')}</li>
              ))}
            </ul>
          );
        }
      }
      
      // Check for numbered lists
      if (/^\d+\./.test(paragraph.trim())) {
        const items = paragraph.split('\n').filter(line => /^\d+\./.test(line.trim()));
        if (items.length > 0) {
          return (
            <ol key={idx} className="insight-numbered-list">
              {items.map((item, i) => (
                <li key={i}>{item.replace(/^\d+\.\s*/, '')}</li>
              ))}
            </ol>
          );
        }
      }
      
      // Regular paragraph
      return <p key={idx} className="insight-paragraph">{paragraph}</p>;
    });
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 0.9) return 'Very High';
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.7) return 'Moderate';
    if (confidence >= 0.6) return 'Low';
    return 'Very Low';
  };

  const getConfidenceClass = (confidence) => {
    if (confidence >= 0.9) return 'very-high';
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.7) return 'moderate';
    return 'low';
  };

  const sections = [
    {
      id: 'strategic_framework',
      title: 'Legal Strategy Framework',
      icon: '🎯',
      content: insights?.strategic_framework,
      priority: 'high'
    },
    {
      id: 'evidence_priorities',
      title: 'Evidence Development Priorities',
      icon: '🔍',
      content: insights?.evidence_priorities,
      priority: 'high'
    },
    {
      id: 'risk_assessment',
      title: 'Risk Assessment & Mitigation',
      icon: '⚠️',
      content: insights?.risk_assessment,
      priority: 'critical'
    },
    {
      id: 'tactical_recommendations',
      title: 'Tactical Recommendations',
      icon: '📋',
      content: insights?.tactical_recommendations,
      priority: 'medium'
    }
  ];

  const insightConfidence = insights?.confidence || 0.85;
  const showInsight = insightConfidence >= confidenceThreshold;

  return (
    <div className="strategic-insights-view">
      <div className="insights-header">
        <h2>AI-Generated Strategic Insights</h2>
        <div className="confidence-display">
          <label>Analysis Confidence:</label>
          <div className={`confidence-badge ${getConfidenceClass(insightConfidence)}`}>
            <span className="confidence-value">{Math.round(insightConfidence * 100)}%</span>
            <span className="confidence-label">{getConfidenceLabel(insightConfidence)}</span>
          </div>
        </div>
      </div>

      {!showInsight && (
        <div className="low-confidence-warning">
          <span className="warning-icon">⚠️</span>
          <p>Confidence level below threshold. Consider gathering more information for better insights.</p>
        </div>
      )}

      <div className="insights-sections">
        {sections.map(section => (
          <div 
            key={section.id}
            className={`insight-section ${expandedSection === section.id ? 'expanded' : ''} priority-${section.priority}`}
          >
            <div 
              className="section-header"
              onClick={() => toggleSection(section.id)}
            >
              <span className="section-icon">{section.icon}</span>
              <h3>{section.title}</h3>
              <span className="expand-icon">{expandedSection === section.id ? '−' : '+'}</span>
            </div>
            
            {expandedSection === section.id && (
              <div className="section-content">
                {formatInsightText(section.content)}
              </div>
            )}
          </div>
        ))}
      </div>

      {insights?.actionable_items && insights.actionable_items.length > 0 && (
        <div className="actionable-insights">
          <h3>Immediate Action Items</h3>
          <div className="action-items-grid">
            {insights.actionable_items.map((item, idx) => (
              <div key={idx} className={`action-card priority-${item.priority || 'medium'}`}>
                <div className="action-header">
                  <span className="action-number">{idx + 1}</span>
                  <span className={`priority-indicator ${item.priority || 'medium'}`}>
                    {(item.priority || 'medium').toUpperCase()}
                  </span>
                </div>
                <p className="action-description">{item.action}</p>
                {item.deadline && (
                  <div className="action-deadline">
                    <span className="deadline-icon">⏰</span>
                    <span>{item.deadline}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {insights?.frameworks_used && insights.frameworks_used.length > 0 && (
        <div className="frameworks-used">
          <h3>Analysis Frameworks Applied</h3>
          <div className="framework-tags">
            {insights.frameworks_used.map((framework, idx) => (
              <span key={idx} className="framework-tag">
                {framework.replace(/_/g, ' ').charAt(0).toUpperCase() + 
                 framework.replace(/_/g, ' ').slice(1)}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="insights-footer">
        <div className="consultation-info">
          <h4>Consultation Details</h4>
          <div className="info-grid">
            <div className="info-item">
              <label>Model Used:</label>
              <value>{insights?.model || 'Claude 3.5 Sonnet'}</value>
            </div>
            <div className="info-item">
              <label>Analysis Type:</label>
              <value>{insights?.consultation_type || 'Strategic Analysis'}</value>
            </div>
            <div className="info-item">
              <label>Generated:</label>
              <value>{new Date().toLocaleString()}</value>
            </div>
            <div className="info-item">
              <label>Privacy Status:</label>
              <value className="success">✓ Pattern-based (No client data)</value>
            </div>
          </div>
        </div>

        <div className="insights-actions">
          <button className="btn-primary" onClick={() => window.print()}>
            Print Insights
          </button>
          <button className="btn-secondary" onClick={() => console.log('Request new consultation')}>
            Request Updated Analysis
          </button>
        </div>
      </div>

      {insights?.raw_response && (
        <details className="raw-response">
          <summary>View Raw AI Response</summary>
          <pre>{insights.raw_response}</pre>
        </details>
      )}
    </div>
  );
};

export default StrategicInsightsView;