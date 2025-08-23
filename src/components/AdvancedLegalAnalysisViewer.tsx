/**
 * Advanced Legal Analysis Viewer
 * Displays sophisticated legal intelligence results from the advanced engine
 */

import React, { useState, useEffect } from 'react';
import { LegalAnalysisResult, LegalArgument, ContractClause } from '../engines/advancedLegalEngine';

interface AdvancedLegalAnalysisViewerProps {
  caseId: string;
  documentId?: string;
  analysisResult?: LegalAnalysisResult;
}

interface StoredArgument extends LegalArgument {
  sourceDocument: string;
  caseId: string;
  timestamp: string;
}

interface StoredClause extends ContractClause {
  sourceDocument: string;
  caseId: string;
  timestamp: string;
}

interface StoredRiskAssessment {
  id: string;
  sourceDocument: string;
  caseId: string;
  overallRisk: 'high' | 'medium' | 'low';
  riskFactors: string[];
  mitigationSuggestions: string[];
  timelineRisks: string[];
  timestamp: string;
}

export const AdvancedLegalAnalysisViewer: React.FC<AdvancedLegalAnalysisViewerProps> = ({
  caseId,
  documentId,
  analysisResult
}) => {
  const [activeTab, setActiveTab] = useState<'arguments' | 'clauses' | 'risk' | 'entities' | 'summary'>('summary');
  const [legalArguments, setLegalArguments] = useState<StoredArgument[]>([]);
  const [clauses, setClauses] = useState<StoredClause[]>([]);
  const [riskAssessments, setRiskAssessments] = useState<StoredRiskAssessment[]>([]);
  const [advancedEntities, setAdvancedEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdvancedAnalysisData();
  }, [caseId, documentId]);

  const loadAdvancedAnalysisData = () => {
    setLoading(true);
    try {
      // Load legal arguments
      const argumentsData = localStorage.getItem(`legal_arguments_${caseId}`);
      if (argumentsData) {
        const allArguments = JSON.parse(argumentsData);
        setLegalArguments(documentId 
          ? allArguments.filter((arg: StoredArgument) => arg.sourceDocument === documentId)
          : allArguments
        );
      }

      // Load contract clauses
      const clausesData = localStorage.getItem(`contract_clauses_${caseId}`);
      if (clausesData) {
        const allClauses = JSON.parse(clausesData);
        setClauses(documentId 
          ? allClauses.filter((clause: StoredClause) => clause.sourceDocument === documentId)
          : allClauses
        );
      }

      // Load risk assessments
      const riskData = localStorage.getItem(`risk_assessment_${caseId}`);
      if (riskData) {
        const allRisks = JSON.parse(riskData);
        setRiskAssessments(documentId 
          ? allRisks.filter((risk: StoredRiskAssessment) => risk.sourceDocument === documentId)
          : allRisks
        );
      }

      // Load advanced entities
      const entitiesData = localStorage.getItem(`advanced_entities_${caseId}`);
      if (entitiesData) {
        const allEntities = JSON.parse(entitiesData);
        setAdvancedEntities(documentId 
          ? allEntities.filter((entity: any) => entity.sourceDocument === documentId)
          : allEntities
        );
      }

    } catch (error) {
      console.error('Failed to load advanced analysis data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTabCounts = () => {
    if (analysisResult) {
      return {
        arguments: analysisResult.arguments.length,
        clauses: analysisResult.contractClauses.length,
        entities: analysisResult.entities.length,
        risk: analysisResult.riskAssessment ? 1 : 0
      };
    }
    
    return {
      arguments: legalArguments.length,
      clauses: clauses.length,
      entities: advancedEntities.length,
      risk: riskAssessments.length
    };
  };

  const getOverallRiskLevel = () => {
    if (analysisResult?.riskAssessment) {
      return analysisResult.riskAssessment.overallRisk;
    }
    
    if (riskAssessments.length > 0) {
      const recentRisk = riskAssessments[riskAssessments.length - 1];
      return recentRisk.overallRisk;
    }
    
    return 'low';
  };

  const getEntityTypeCounts = () => {
    const entities = analysisResult?.entities || advancedEntities;
    const counts: Record<string, number> = {};
    
    entities.forEach(entity => {
      counts[entity.type] = (counts[entity.type] || 0) + 1;
    });
    
    return counts;
  };

  if (loading) {
    return (
      <div className="advanced-analysis-loading">
        <div className="loading-spinner"></div>
        <p>Loading advanced legal analysis...</p>
      </div>
    );
  }

  const counts = getTabCounts();
  const riskLevel = getOverallRiskLevel();
  const entityCounts = getEntityTypeCounts();
  const hasData = counts.arguments + counts.clauses + counts.entities + counts.risk > 0;

  if (!hasData && !analysisResult) {
    return (
      <div className="no-advanced-analysis">
        <div className="no-analysis-icon">🧠</div>
        <h3>No Advanced Analysis Available</h3>
        <p>Run document processing with high or near-perfect accuracy to generate advanced legal intelligence.</p>
        <div className="analysis-features">
          <div className="feature">💼 Legal Argument Mining</div>
          <div className="feature">📋 Contract Clause Analysis</div>
          <div className="feature">⚠️ Risk Assessment</div>
          <div className="feature">💰 Financial Data Extraction</div>
          <div className="feature">🏛️ Legal Citation Analysis</div>
        </div>
      </div>
    );
  }

  return (
    <div className="advanced-legal-analysis-viewer">
      {/* Summary Header */}
      <div className="analysis-summary">
        <div className="summary-stats">
          <div className="stat-item">
            <div className="stat-value">{counts.entities}</div>
            <div className="stat-label">Advanced Entities</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{counts.arguments}</div>
            <div className="stat-label">Legal Arguments</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{counts.clauses}</div>
            <div className="stat-label">Contract Clauses</div>
          </div>
          <div className={`stat-item risk-${riskLevel}`}>
            <div className="stat-value">{riskLevel.toUpperCase()}</div>
            <div className="stat-label">Risk Level</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="analysis-tabs">
        <button
          className={`tab ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          📊 Summary
        </button>
        <button
          className={`tab ${activeTab === 'arguments' ? 'active' : ''}`}
          onClick={() => setActiveTab('arguments')}
          disabled={counts.arguments === 0}
        >
          💼 Arguments ({counts.arguments})
        </button>
        <button
          className={`tab ${activeTab === 'clauses' ? 'active' : ''}`}
          onClick={() => setActiveTab('clauses')}
          disabled={counts.clauses === 0}
        >
          📋 Clauses ({counts.clauses})
        </button>
        <button
          className={`tab ${activeTab === 'risk' ? 'active' : ''}`}
          onClick={() => setActiveTab('risk')}
          disabled={counts.risk === 0}
        >
          ⚠️ Risk Assessment
        </button>
        <button
          className={`tab ${activeTab === 'entities' ? 'active' : ''}`}
          onClick={() => setActiveTab('entities')}
          disabled={counts.entities === 0}
        >
          🎯 Advanced Entities ({counts.entities})
        </button>
      </div>

      {/* Content Panels */}
      <div className="analysis-content">
        {activeTab === 'summary' && (
          <div className="summary-panel">
            <div className="summary-grid">
              <div className="summary-card">
                <h4>🎯 Entity Analysis</h4>
                <div className="entity-breakdown">
                  {Object.entries(entityCounts).map(([type, count]) => (
                    <div key={type} className="entity-type">
                      <span className="type-name">{type.replace('_', ' ')}</span>
                      <span className="type-count">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="summary-card">
                <h4>⚠️ Risk Overview</h4>
                <div className={`risk-indicator risk-${riskLevel}`}>
                  <div className="risk-level">{riskLevel.toUpperCase()} RISK</div>
                  {(analysisResult?.riskAssessment || riskAssessments[0]) && (
                    <div className="risk-factors">
                      {(analysisResult?.riskAssessment?.riskFactors || riskAssessments[0]?.riskFactors || []).slice(0, 3).map((factor, index) => (
                        <div key={index} className="risk-factor">• {factor}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="summary-card">
                <h4>💼 Legal Strategy</h4>
                <div className="strategy-insights">
                  {counts.arguments > 0 && (
                    <div className="insight">✓ {counts.arguments} legal arguments identified</div>
                  )}
                  {counts.clauses > 0 && (
                    <div className="insight">✓ {counts.clauses} contract clauses analyzed</div>
                  )}
                  {entityCounts.financial > 0 && (
                    <div className="insight">✓ {entityCounts.financial} financial exposures found</div>
                  )}
                  {entityCounts.case_citation > 0 && (
                    <div className="insight">✓ {entityCounts.case_citation} legal precedents cited</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'arguments' && (
          <div className="arguments-panel">
            {(analysisResult?.arguments || legalArguments).map((argument, index) => (
              <div key={argument.id || index} className="argument-card">
                <div className="argument-header">
                  <div className={`argument-type ${argument.argumentType}`}>
                    {argument.argumentType.replace('_', ' ')}
                  </div>
                  <div className="argument-strength">
                    Strength: {Math.round(argument.strength * 100)}%
                  </div>
                </div>
                
                <div className="argument-claim">
                  <h5>Claim:</h5>
                  <p>{argument.claim}</p>
                </div>

                {argument.evidence.length > 0 && (
                  <div className="argument-evidence">
                    <h5>Evidence:</h5>
                    <ul>
                      {argument.evidence.map((evidence, i) => (
                        <li key={i}>{evidence}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {argument.legalBasis.length > 0 && (
                  <div className="argument-basis">
                    <h5>Legal Basis:</h5>
                    <ul>
                      {argument.legalBasis.map((basis, i) => (
                        <li key={i}>{basis}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {argument.counterArguments.length > 0 && (
                  <div className="counter-arguments">
                    <h5>Counter-Arguments:</h5>
                    <ul>
                      {argument.counterArguments.map((counter, i) => (
                        <li key={i}>{counter}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'clauses' && (
          <div className="clauses-panel">
            {(analysisResult?.contractClauses || clauses).map((clause, index) => (
              <div key={clause.id || index} className="clause-card">
                <div className="clause-header">
                  <div className={`clause-type ${clause.type}`}>
                    {clause.type.replace('_', ' ')}
                  </div>
                  <div className={`clause-importance ${clause.importance}`}>
                    {clause.importance}
                  </div>
                  <div className={`clause-risk ${clause.riskLevel}`}>
                    {clause.riskLevel} risk
                  </div>
                </div>
                
                <div className="clause-text">
                  <p>{clause.text}</p>
                </div>

                <div className="clause-analysis">
                  <h5>Analysis:</h5>
                  <p>{clause.analysis}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'risk' && (
          <div className="risk-panel">
            {(analysisResult?.riskAssessment ? [analysisResult.riskAssessment] : riskAssessments).map((risk, index) => (
              <div key={index} className="risk-assessment">
                <div className="risk-header">
                  <h4>Risk Assessment</h4>
                  <div className={`overall-risk risk-${risk.overallRisk}`}>
                    {risk.overallRisk.toUpperCase()} RISK
                  </div>
                </div>

                {risk.riskFactors.length > 0 && (
                  <div className="risk-section">
                    <h5>🚨 Risk Factors:</h5>
                    <ul>
                      {risk.riskFactors.map((factor, i) => (
                        <li key={i} className="risk-factor">{factor}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {risk.mitigationSuggestions.length > 0 && (
                  <div className="risk-section">
                    <h5>🛡️ Mitigation Suggestions:</h5>
                    <ul>
                      {risk.mitigationSuggestions.map((suggestion, i) => (
                        <li key={i} className="mitigation">{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {risk.timelineRisks.length > 0 && (
                  <div className="risk-section">
                    <h5>⏰ Timeline Risks:</h5>
                    <ul>
                      {risk.timelineRisks.map((timelineRisk, i) => (
                        <li key={i} className="timeline-risk">{timelineRisk}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'entities' && (
          <div className="entities-panel">
            <div className="entities-grid">
              {(analysisResult?.entities || advancedEntities).map((entity, index) => (
                <div key={entity.id || index} className="entity-card">
                  <div className="entity-header">
                    <div className={`entity-type ${entity.type}`}>
                      {entity.type.replace('_', ' ')}
                    </div>
                    <div className="entity-confidence">
                      {Math.round(entity.confidence * 100)}%
                    </div>
                  </div>
                  
                  <div className="entity-text">
                    <strong>{entity.text}</strong>
                  </div>

                  {entity.metadata && Object.keys(entity.metadata).length > 0 && (
                    <div className="entity-metadata">
                      {Object.entries(entity.metadata).map(([key, value]) => (
                        <div key={key} className="metadata-item">
                          <span className="metadata-key">{key}:</span>
                          <span className="metadata-value">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="entity-context">
                    <small>{entity.context.substring(0, 100)}...</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .advanced-legal-analysis-viewer {
          width: 100%;
          background: white;
          border-radius: 12px;
          overflow: hidden;
        }

        .analysis-summary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
        }

        .summary-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 20px;
        }

        .stat-item {
          text-align: center;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 12px;
          opacity: 0.9;
        }

        .stat-item.risk-high .stat-value {
          color: #fca5a5;
        }

        .stat-item.risk-medium .stat-value {
          color: #fbbf24;
        }

        .stat-item.risk-low .stat-value {
          color: #86efac;
        }

        .analysis-tabs {
          display: flex;
          border-bottom: 2px solid #e5e7eb;
          background: #f8fafc;
        }

        .tab {
          padding: 12px 20px;
          border: none;
          background: none;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
          font-weight: 500;
        }

        .tab:hover:not(:disabled) {
          background: #e2e8f0;
        }

        .tab.active {
          border-bottom-color: #3b82f6;
          color: #3b82f6;
          background: white;
        }

        .tab:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .analysis-content {
          padding: 20px;
          min-height: 400px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .summary-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
        }

        .summary-card h4 {
          margin: 0 0 12px 0;
          color: #1e293b;
        }

        .entity-breakdown {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .entity-type {
          display: flex;
          justify-content: space-between;
          padding: 4px 8px;
          background: white;
          border-radius: 4px;
          font-size: 14px;
        }

        .type-name {
          text-transform: capitalize;
        }

        .type-count {
          font-weight: 600;
          color: #3b82f6;
        }

        .risk-indicator {
          text-align: center;
          padding: 16px;
          border-radius: 8px;
        }

        .risk-indicator.risk-high {
          background: #fef2f2;
          border: 1px solid #fca5a5;
        }

        .risk-indicator.risk-medium {
          background: #fffbeb;
          border: 1px solid #fbbf24;
        }

        .risk-indicator.risk-low {
          background: #f0fdf4;
          border: 1px solid #86efac;
        }

        .risk-level {
          font-weight: 700;
          font-size: 16px;
          margin-bottom: 8px;
        }

        .risk-factors {
          font-size: 12px;
          text-align: left;
        }

        .risk-factor {
          margin: 2px 0;
        }

        .strategy-insights {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .insight {
          padding: 8px;
          background: white;
          border-radius: 4px;
          font-size: 14px;
          color: #16a34a;
        }

        .argument-card, .clause-card, .risk-assessment {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .argument-header, .clause-header, .risk-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e2e8f0;
        }

        .argument-type, .clause-type {
          background: #3b82f6;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          text-transform: capitalize;
        }

        .argument-strength, .clause-importance, .clause-risk {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 4px;
          background: #e2e8f0;
        }

        .clause-importance.critical {
          background: #fca5a5;
          color: #7f1d1d;
        }

        .clause-risk.high {
          background: #fca5a5;
          color: #7f1d1d;
        }

        .clause-risk.medium {
          background: #fbbf24;
          color: #78350f;
        }

        .clause-risk.low {
          background: #86efac;
          color: #14532d;
        }

        .argument-claim h5,
        .argument-evidence h5,
        .argument-basis h5,
        .counter-arguments h5,
        .clause-analysis h5,
        .risk-section h5 {
          margin: 12px 0 8px 0;
          color: #374151;
          font-size: 14px;
        }

        .argument-claim p,
        .clause-text p,
        .clause-analysis p {
          margin: 0;
          line-height: 1.5;
        }

        .argument-evidence ul,
        .argument-basis ul,
        .counter-arguments ul,
        .risk-section ul {
          margin: 0;
          padding-left: 20px;
        }

        .argument-evidence li,
        .argument-basis li,
        .counter-arguments li {
          margin: 4px 0;
        }

        .risk-factor,
        .mitigation,
        .timeline-risk {
          margin: 8px 0;
          padding: 8px;
          background: white;
          border-radius: 4px;
          border-left: 3px solid #3b82f6;
        }

        .entities-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }

        .entity-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px;
        }

        .entity-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .entity-type {
          background: #3b82f6;
          color: white;
          padding: 3px 6px;
          border-radius: 4px;
          font-size: 11px;
          text-transform: capitalize;
        }

        .entity-confidence {
          font-size: 12px;
          font-weight: 600;
          color: #059669;
        }

        .entity-text {
          margin: 8px 0;
          font-size: 14px;
        }

        .entity-metadata {
          margin: 8px 0;
          font-size: 12px;
        }

        .metadata-item {
          display: flex;
          gap: 8px;
          margin: 2px 0;
        }

        .metadata-key {
          font-weight: 500;
          color: #6b7280;
          min-width: 60px;
        }

        .metadata-value {
          color: #374151;
        }

        .entity-context {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #e2e8f0;
          color: #6b7280;
          font-size: 11px;
        }

        .no-advanced-analysis {
          text-align: center;
          padding: 60px 20px;
        }

        .no-analysis-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .no-advanced-analysis h3 {
          color: #1f2937;
          margin-bottom: 8px;
        }

        .no-advanced-analysis p {
          color: #6b7280;
          margin-bottom: 20px;
        }

        .analysis-features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          margin-top: 20px;
        }

        .feature {
          padding: 12px;
          background: #f3f4f6;
          border-radius: 8px;
          font-size: 14px;
          color: #374151;
        }

        .advanced-analysis-loading {
          text-align: center;
          padding: 60px 20px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f4f6;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .overall-risk {
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 14px;
        }

        .overall-risk.risk-high {
          background: #fca5a5;
          color: #7f1d1d;
        }

        .overall-risk.risk-medium {
          background: #fbbf24;
          color: #78350f;
        }

        .overall-risk.risk-low {
          background: #86efac;
          color: #14532d;
        }
      `}</style>
    </div>
  );
};