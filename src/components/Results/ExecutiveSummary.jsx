/**
 * Executive Summary Component - Week 6 Day 1-2
 * High-level summary of analysis results and insights
 */

import React from 'react';

const ExecutiveSummary = ({ analysis, insights }) => {
  const calculateRiskLevel = () => {
    if (!insights?.risk_assessment) return 'moderate';
    const confidence = insights.confidence || 0.5;
    if (confidence > 0.8) return 'low';
    if (confidence > 0.5) return 'moderate';
    return 'high';
  };

  const riskLevel = calculateRiskLevel();

  return (
    <div className="executive-summary">
      <section className="summary-section">
        <h2>Case Overview</h2>
        <div className="overview-grid">
          <div className="overview-item">
            <label>Documents Analyzed</label>
            <value>{analysis?.documents?.length || 0}</value>
          </div>
          <div className="overview-item">
            <label>Legal Issues Identified</label>
            <value>{analysis?.legal_issues?.length || 0}</value>
          </div>
          <div className="overview-item">
            <label>Key Entities</label>
            <value>{analysis?.entities?.length || 0}</value>
          </div>
          <div className="overview-item">
            <label>Timeline Span</label>
            <value>{analysis?.timeline?.span || 'N/A'}</value>
          </div>
        </div>
      </section>

      <section className="summary-section">
        <h2>Key Findings</h2>
        <div className="findings-list">
          {insights?.strategic_framework && (
            <div className="finding-item">
              <span className="finding-icon">📋</span>
              <div className="finding-content">
                <h3>Strategic Framework</h3>
                <p>{insights.strategic_framework.slice(0, 200)}...</p>
              </div>
            </div>
          )}
          
          {insights?.evidence_priorities && (
            <div className="finding-item">
              <span className="finding-icon">🔍</span>
              <div className="finding-content">
                <h3>Evidence Priorities</h3>
                <p>{insights.evidence_priorities.slice(0, 200)}...</p>
              </div>
            </div>
          )}

          {analysis?.primary_issues && analysis.primary_issues.length > 0 && (
            <div className="finding-item">
              <span className="finding-icon">⚖️</span>
              <div className="finding-content">
                <h3>Primary Legal Issues</h3>
                <ul className="issues-list">
                  {analysis.primary_issues.slice(0, 3).map((issue, idx) => (
                    <li key={idx}>{issue.concept} (Importance: {issue.importance})</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="summary-section">
        <h2>Risk Assessment</h2>
        <div className={`risk-assessment ${riskLevel}`}>
          <div className="risk-indicator">
            <span className="risk-level">Risk Level: {riskLevel.toUpperCase()}</span>
            <div className="risk-meter">
              <div className={`risk-fill ${riskLevel}`}></div>
            </div>
          </div>
          
          {insights?.risk_assessment && (
            <div className="risk-details">
              <p>{insights.risk_assessment.slice(0, 300)}...</p>
            </div>
          )}
        </div>
      </section>

      <section className="summary-section">
        <h2>Recommended Actions</h2>
        <div className="actions-grid">
          {insights?.actionable_items && insights.actionable_items.length > 0 ? (
            insights.actionable_items.slice(0, 5).map((item, idx) => (
              <div key={idx} className={`action-item priority-${item.priority || 'medium'}`}>
                <span className="action-number">{idx + 1}</span>
                <span className="action-text">{item.action}</span>
                <span className={`priority-badge ${item.priority || 'medium'}`}>
                  {(item.priority || 'medium').toUpperCase()}
                </span>
              </div>
            ))
          ) : (
            <div className="no-actions">
              <p>Review strategic insights for detailed recommendations</p>
            </div>
          )}
        </div>
      </section>

      <section className="summary-section">
        <h2>Next Steps</h2>
        <div className="next-steps">
          <div className="step-item">
            <span className="step-icon">1</span>
            <div className="step-content">
              <h4>Review Detailed Analysis</h4>
              <p>Examine document analysis and timeline for comprehensive understanding</p>
            </div>
          </div>
          <div className="step-item">
            <span className="step-icon">2</span>
            <div className="step-content">
              <h4>Consider Strategic Insights</h4>
              <p>Review AI-generated strategic guidance for case preparation</p>
            </div>
          </div>
          <div className="step-item">
            <span className="step-icon">3</span>
            <div className="step-content">
              <h4>Export for Court</h4>
              <p>Generate court-ready documentation using export options</p>
            </div>
          </div>
        </div>
      </section>

      <div className="summary-footer">
        <div className="confidence-indicator">
          <span>Analysis Confidence: </span>
          <strong>{Math.round((insights?.confidence || 0.85) * 100)}%</strong>
        </div>
        <div className="privacy-notice">
          <span>🔒 All data anonymized for privacy protection</span>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveSummary;