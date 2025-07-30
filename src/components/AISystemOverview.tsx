import React, { useState, useEffect } from 'react';
import { aiEventSystem } from '../utils/aiEventSystem';

interface AISystemOverviewProps {
  caseId: string;
}

export const AISystemOverview: React.FC<AISystemOverviewProps> = ({ caseId }) => {
  const [insights, setInsights] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = aiEventSystem.subscribe(caseId, (insight) => {
      setInsights(prev => [insight, ...prev.slice(0, 19)]); // Keep last 20
    });

    // Load existing insights
    const existingInsights = aiEventSystem.getInsights(caseId);
    setInsights(existingInsights.slice(0, 20));

    return unsubscribe;
  }, [caseId]);

  if (!isVisible) {
    return (
      <button 
        className="ai-overview-toggle"
        onClick={() => setIsVisible(true)}
        title="View AI System Activity"
      >
        🤖 AI Activity ({insights.length})
      </button>
    );
  }

  const groupedInsights = insights.reduce((acc, insight) => {
    const component = insight.sourceComponent;
    if (!acc[component]) acc[component] = [];
    acc[component].push(insight);
    return acc;
  }, {} as Record<string, any[]>);

  const getIcon = (type: string) => {
    switch (type) {
      case 'person': return '👥';
      case 'issue': return '⚖️';
      case 'chronology': return '📅';
      case 'authority': return '📚';
      case 'cross_reference': return '🔗';
      default: return '🤖';
    }
  };

  const getComponentIcon = (component: string) => {
    switch (component) {
      case 'DocumentManager': return '📄';
      case 'EnhancedDocumentManager': return '📄';
      case 'PleadingsManager': return '📋';
      case 'AutoGenerator': return '🚀';
      default: return '🔧';
    }
  };

  return (
    <div className="ai-system-overview">
      <div className="overview-header">
        <h3>🤖 AI System Activity</h3>
        <button onClick={() => setIsVisible(false)}>✕</button>
      </div>

      <div className="overview-stats">
        <div className="stat-item">
          <span className="stat-number">{insights.length}</span>
          <span className="stat-label">Total Insights</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{Object.keys(groupedInsights).length}</span>
          <span className="stat-label">Active Components</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">
            {insights.reduce((sum, i) => sum + (Array.isArray(i.data) ? i.data.length : 1), 0)}
          </span>
          <span className="stat-label">Entities Extracted</span>
        </div>
      </div>

      <div className="overview-content">
        <h4>Component Activity</h4>
        {Object.entries(groupedInsights).map(([component, componentInsights]) => (
          <div key={component} className="component-section">
            <div className="component-header">
              <span className="component-icon">{getComponentIcon(component)}</span>
              <span className="component-name">{component}</span>
              <span className="insight-count">{componentInsights.length} insights</span>
            </div>
            <div className="insight-list">
              {componentInsights.slice(0, 5).map((insight, index) => (
                <div key={insight.id} className="insight-item">
                  <span className="insight-icon">{getIcon(insight.type)}</span>
                  <div className="insight-details">
                    <div className="insight-type">{insight.type}</div>
                    <div className="insight-meta">
                      {insight.sourceDocument} • 
                      {Array.isArray(insight.data) ? ` ${insight.data.length} items` : ' 1 item'} • 
                      {Math.round(insight.confidence * 100)}% confidence
                    </div>
                  </div>
                  <div className="insight-time">
                    {new Date(insight.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              {componentInsights.length > 5 && (
                <div className="more-insights">
                  +{componentInsights.length - 5} more insights...
                </div>
              )}
            </div>
          </div>
        ))}

        {insights.length === 0 && (
          <div className="no-activity">
            <div className="no-activity-icon">🤖</div>
            <h4>No AI Activity Yet</h4>
            <p>Upload and process documents to see AI insights propagating across tabs.</p>
          </div>
        )}
      </div>

      <div className="overview-explanation">
        <h4>How AI Sync Works</h4>
        <div className="sync-flow">
          <div className="flow-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <div className="step-title">Document Processing</div>
              <div className="step-description">AI analyzes uploaded documents</div>
            </div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <div className="step-title">Entity Extraction</div>
              <div className="step-description">Persons, issues, dates, authorities identified</div>
            </div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <div className="step-title">Cross-Tab Sync</div>
              <div className="step-description">Insights automatically appear in relevant tabs</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .ai-overview-toggle {
          position: fixed;
          bottom: 20px;
          right: 20px;
          padding: 12px 16px;
          background: #3f51b5;
          color: white;
          border: none;
          border-radius: 25px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          box-shadow: 0 4px 12px rgba(63, 81, 181, 0.3);
          z-index: 1000;
          transition: all 0.2s;
        }

        .ai-overview-toggle:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(63, 81, 181, 0.4);
        }

        .ai-system-overview {
          position: fixed;
          top: 20px;
          left: 20px;
          width: 400px;
          max-height: 80vh;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
          z-index: 1000;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .overview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: linear-gradient(135deg, #3f51b5 0%, #1a237e 100%);
          color: white;
        }

        .overview-header h3 {
          margin: 0;
          font-size: 16px;
        }

        .overview-header button {
          background: none;
          border: none;
          color: white;
          font-size: 18px;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
        }

        .overview-header button:hover {
          background: rgba(255,255,255,0.1);
        }

        .overview-stats {
          display: flex;
          padding: 16px 20px;
          background: #f8f9fa;
          border-bottom: 1px solid #e0e0e0;
        }

        .stat-item {
          flex: 1;
          text-align: center;
        }

        .stat-number {
          display: block;
          font-size: 24px;
          font-weight: 600;
          color: #3f51b5;
          margin-bottom: 2px;
        }

        .stat-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          font-weight: 500;
        }

        .overview-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px 20px;
        }

        .overview-content h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #333;
          text-transform: uppercase;
          font-weight: 600;
        }

        .component-section {
          margin-bottom: 20px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          overflow: hidden;
        }

        .component-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #f8f9fa;
          font-weight: 500;
        }

        .component-icon {
          font-size: 16px;
        }

        .component-name {
          flex: 1;
          font-size: 14px;
        }

        .insight-count {
          font-size: 12px;
          color: #666;
          background: white;
          padding: 2px 8px;
          border-radius: 12px;
        }

        .insight-list {
          background: white;
        }

        .insight-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 16px;
          border-bottom: 1px solid #f0f0f0;
        }

        .insight-item:last-child {
          border-bottom: none;
        }

        .insight-icon {
          font-size: 14px;
          width: 20px;
          text-align: center;
        }

        .insight-details {
          flex: 1;
          min-width: 0;
        }

        .insight-type {
          font-size: 13px;
          font-weight: 500;
          color: #333;
          text-transform: capitalize;
        }

        .insight-meta {
          font-size: 11px;
          color: #666;
          margin-top: 2px;
        }

        .insight-time {
          font-size: 11px;
          color: #999;
        }

        .more-insights {
          padding: 8px 16px;
          font-size: 12px;
          color: #666;
          font-style: italic;
          text-align: center;
          background: #f8f9fa;
        }

        .no-activity {
          text-align: center;
          padding: 40px 20px;
          color: #666;
        }

        .no-activity-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .no-activity h4 {
          margin: 0 0 8px 0;
          color: #333;
        }

        .no-activity p {
          margin: 0;
          font-size: 14px;
          line-height: 1.4;
        }

        .overview-explanation {
          padding: 16px 20px;
          background: #f8f9fa;
          border-top: 1px solid #e0e0e0;
        }

        .overview-explanation h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #333;
          text-transform: uppercase;
          font-weight: 600;
        }

        .sync-flow {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .flow-step {
          flex: 1;
          text-align: center;
        }

        .step-number {
          width: 24px;
          height: 24px;
          background: #3f51b5;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          margin: 0 auto 8px;
        }

        .step-title {
          font-size: 12px;
          font-weight: 600;
          color: #333;
          margin-bottom: 2px;
        }

        .step-description {
          font-size: 10px;
          color: #666;
          line-height: 1.2;
        }

        .flow-arrow {
          color: #3f51b5;
          font-weight: bold;
          font-size: 16px;
        }

        @media (max-width: 768px) {
          .ai-system-overview {
            left: 10px;
            right: 10px;
            width: auto;
          }

          .ai-overview-toggle {
            bottom: 10px;
            right: 10px;
          }
        }
      `}</style>
    </div>
  );
};