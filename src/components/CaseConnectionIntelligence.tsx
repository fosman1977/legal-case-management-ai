/**
 * Case Connection Intelligence
 * AI-powered system for discovering connections between cases
 */

import React, { useState, useEffect } from 'react';

interface CaseConnection {
  id: string;
  sourceCaseId: string;
  targetCaseId: string;
  connectionType: 'similar_facts' | 'same_parties' | 'related_legal_issues' | 'precedent_citing' | 'temporal_sequence' | 'jurisdictional_overlap';
  strength: number; // 0-1
  confidence: number; // 0-1
  metadata: {
    sharedEntities?: string[];
    commonLegalPrinciples?: string[];
    timelineOverlap?: boolean;
    jurisdictionalFactors?: string[];
    evidentialSimilarity?: number;
    outcomeRelevance?: 'supportive' | 'contradictory' | 'neutral';
    [key: string]: any;
  };
  description: string;
  insights: string[];
}

interface CaseCluster {
  id: string;
  caseIds: string[];
  theme: string;
  description: string;
  strength: number;
  legalPrinciples: string[];
  practiceArea: 'criminal' | 'civil' | 'poca' | 'mixed';
}

interface CasePattern {
  id: string;
  type: 'success_pattern' | 'failure_pattern' | 'procedural_pattern' | 'evidence_pattern';
  caseIds: string[];
  pattern: string;
  confidence: number;
  actionableInsights: string[];
}

interface ConnectionInsight {
  id: string;
  type: 'strategic' | 'procedural' | 'evidential' | 'precedential';
  title: string;
  description: string;
  relatedConnections: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
}

interface CaseConnectionIntelligenceProps {
  currentCaseId: string;
  allCases: any[]; // Array of case objects
  onConnectionsFound?: (connections: CaseConnection[]) => void;
  onInsightsGenerated?: (insights: ConnectionInsight[]) => void;
}

export const CaseConnectionIntelligence: React.FC<CaseConnectionIntelligenceProps> = ({
  currentCaseId,
  allCases,
  onConnectionsFound,
  onInsightsGenerated
}) => {
  const [connections, setConnections] = useState<CaseConnection[]>([]);
  const [clusters, setClusters] = useState<CaseCluster[]>([]);
  const [patterns, setPatterns] = useState<CasePattern[]>([]);
  const [insights, setInsights] = useState<ConnectionInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<CaseConnection | null>(null);

  useEffect(() => {
    if (currentCaseId && allCases.length > 0) {
      analyzeConnections();
    }
  }, [currentCaseId, allCases]);

  const analyzeConnections = async (): Promise<void> => {
    setIsAnalyzing(true);
    
    try {
      // Simulate connection analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const foundConnections = findCaseConnections(currentCaseId, allCases);
      const identifiedClusters = identifyCaseClusters(foundConnections, allCases);
      const discoveredPatterns = discoverCasePatterns(foundConnections, allCases);
      const generatedInsights = generateConnectionInsights(foundConnections, identifiedClusters, discoveredPatterns);
      
      setConnections(foundConnections);
      setClusters(identifiedClusters);
      setPatterns(discoveredPatterns);
      setInsights(generatedInsights);
      
      onConnectionsFound?.(foundConnections);
      onInsightsGenerated?.(generatedInsights);
      
    } catch (error) {
      console.error('Connection analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const findCaseConnections = (caseId: string, cases: any[]): CaseConnection[] => {
    const connections: CaseConnection[] = [];
    const currentCase = cases.find(c => c.id === caseId);
    
    if (!currentCase) return connections;
    
    cases.forEach(targetCase => {
      if (targetCase.id === caseId) return; // Skip self
      
      // Analyze similar facts
      const factSimilarity = analyzeSimilarFacts(currentCase, targetCase);
      if (factSimilarity.strength > 0.3) {
        connections.push({
          id: `conn_facts_${caseId}_${targetCase.id}`,
          sourceCaseId: caseId,
          targetCaseId: targetCase.id,
          connectionType: 'similar_facts',
          strength: factSimilarity.strength,
          confidence: factSimilarity.confidence,
          metadata: {
            sharedEntities: factSimilarity.sharedEntities,
            evidentialSimilarity: factSimilarity.evidentialSimilarity
          },
          description: `Cases share similar factual patterns with ${Math.round(factSimilarity.strength * 100)}% similarity`,
          insights: factSimilarity.insights
        });
      }
      
      // Analyze same parties
      const partySimilarity = analyzeSameParties(currentCase, targetCase);
      if (partySimilarity.strength > 0.5) {
        connections.push({
          id: `conn_parties_${caseId}_${targetCase.id}`,
          sourceCaseId: caseId,
          targetCaseId: targetCase.id,
          connectionType: 'same_parties',
          strength: partySimilarity.strength,
          confidence: partySimilarity.confidence,
          metadata: {
            sharedEntities: partySimilarity.sharedParties
          },
          description: `Cases involve the same parties or related entities`,
          insights: partySimilarity.insights
        });
      }
      
      // Analyze legal issues
      const legalSimilarity = analyzeRelatedLegalIssues(currentCase, targetCase);
      if (legalSimilarity.strength > 0.4) {
        connections.push({
          id: `conn_legal_${caseId}_${targetCase.id}`,
          sourceCaseId: caseId,
          targetCaseId: targetCase.id,
          connectionType: 'related_legal_issues',
          strength: legalSimilarity.strength,
          confidence: legalSimilarity.confidence,
          metadata: {
            commonLegalPrinciples: legalSimilarity.commonPrinciples,
            outcomeRelevance: legalSimilarity.outcomeRelevance
          },
          description: `Cases address similar legal issues and principles`,
          insights: legalSimilarity.insights
        });
      }
      
      // Analyze temporal sequence
      const temporalConnection = analyzeTemporalSequence(currentCase, targetCase);
      if (temporalConnection.strength > 0.2) {
        connections.push({
          id: `conn_temporal_${caseId}_${targetCase.id}`,
          sourceCaseId: caseId,
          targetCaseId: targetCase.id,
          connectionType: 'temporal_sequence',
          strength: temporalConnection.strength,
          confidence: temporalConnection.confidence,
          metadata: {
            timelineOverlap: temporalConnection.timelineOverlap
          },
          description: `Cases have temporal relationship or sequential occurrence`,
          insights: temporalConnection.insights
        });
      }
    });
    
    return connections;
  };

  const analyzeSimilarFacts = (case1: any, case2: any) => {
    // Simulate fact similarity analysis
    const case1Facts = extractFactsFromCase(case1);
    const case2Facts = extractFactsFromCase(case2);
    
    const sharedEntities = findSharedEntities(case1Facts, case2Facts);
    const similarity = calculateFactSimilarity(case1Facts, case2Facts);
    
    return {
      strength: similarity,
      confidence: 0.8,
      sharedEntities,
      evidentialSimilarity: similarity,
      insights: [
        `Both cases involve similar factual circumstances`,
        `Shared evidence types and witness patterns`,
        `Comparable timeline of events`
      ]
    };
  };

  const analyzeSameParties = (case1: any, case2: any) => {
    // Extract party information
    const case1Parties = extractPartiesFromCase(case1);
    const case2Parties = extractPartiesFromCase(case2);
    
    const sharedParties = case1Parties.filter(p1 => 
      case2Parties.some(p2 => 
        p1.name.toLowerCase() === p2.name.toLowerCase() ||
        p1.aliases?.some(alias => p2.aliases?.includes(alias))
      )
    );
    
    const strength = sharedParties.length / Math.max(case1Parties.length, case2Parties.length);
    
    return {
      strength,
      confidence: 0.9,
      sharedParties: sharedParties.map(p => p.name),
      insights: [
        `Cases involve overlapping parties`,
        `Character evidence may be relevant`,
        `Previous case outcomes may influence current strategy`
      ]
    };
  };

  const analyzeRelatedLegalIssues = (case1: any, case2: any) => {
    const case1Issues = extractLegalIssuesFromCase(case1);
    const case2Issues = extractLegalIssuesFromCase(case2);
    
    const commonPrinciples = case1Issues.filter(issue1 =>
      case2Issues.some(issue2 => 
        issue1.toLowerCase().includes(issue2.toLowerCase()) ||
        issue2.toLowerCase().includes(issue1.toLowerCase())
      )
    );
    
    const strength = commonPrinciples.length / Math.max(case1Issues.length, case2Issues.length);
    
    const outcomeRelevance: 'supportive' | 'contradictory' | 'neutral' = 
      Math.random() > 0.6 ? 'supportive' : 
      Math.random() > 0.3 ? 'neutral' : 'contradictory';
    
    return {
      strength,
      confidence: 0.7,
      commonPrinciples,
      outcomeRelevance,
      insights: [
        `Cases share common legal principles`,
        `Precedent value for current case strategy`,
        `Similar arguments may be applicable`
      ]
    };
  };

  const analyzeTemporalSequence = (case1: any, case2: any) => {
    const case1Date = new Date(case1.createdAt || case1.updatedAt);
    const case2Date = new Date(case2.createdAt || case2.updatedAt);
    
    const timeDiff = Math.abs(case1Date.getTime() - case2Date.getTime());
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
    
    // Stronger connection if cases are closer in time
    const strength = Math.max(0, 1 - daysDiff / 365); // Decay over a year
    
    return {
      strength,
      confidence: 0.6,
      timelineOverlap: daysDiff < 30,
      insights: [
        `Cases occurred in temporal proximity`,
        `May share contemporary legal context`,
        `Sequential development of legal strategy`
      ]
    };
  };

  const identifyCaseClusters = (connections: CaseConnection[], cases: any[]): CaseCluster[] => {
    const clusters: CaseCluster[] = [];
    
    // Group cases by practice area and strong connections
    const practiceAreaGroups = {
      criminal: cases.filter(c => c.metadata?.practiceArea === 'criminal'),
      civil: cases.filter(c => c.metadata?.practiceArea === 'civil'),
      poca: cases.filter(c => c.metadata?.practiceArea === 'poca')
    };
    
    Object.entries(practiceAreaGroups).forEach(([area, areaCases]) => {
      if (areaCases.length > 1) {
        const strongConnections = connections.filter(conn => 
          areaCases.some(c => c.id === conn.sourceCaseId) &&
          areaCases.some(c => c.id === conn.targetCaseId) &&
          conn.strength > 0.6
        );
        
        if (strongConnections.length > 0) {
          clusters.push({
            id: `cluster_${area}`,
            caseIds: areaCases.map(c => c.id),
            theme: `${area.charAt(0).toUpperCase() + area.slice(1)} Practice Area Cluster`,
            description: `Strongly connected ${area} cases with similar characteristics`,
            strength: strongConnections.reduce((sum, conn) => sum + conn.strength, 0) / strongConnections.length,
            legalPrinciples: extractClusterPrinciples(strongConnections),
            practiceArea: area as any
          });
        }
      }
    });
    
    return clusters;
  };

  const discoverCasePatterns = (connections: CaseConnection[], cases: any[]): CasePattern[] => {
    const patterns: CasePattern[] = [];
    
    // Identify success patterns
    const successfulCases = cases.filter(c => c.status === 'concluded' && c.metadata?.outcome === 'successful');
    if (successfulCases.length > 1) {
      const successConnections = connections.filter(conn =>
        successfulCases.some(c => c.id === conn.sourceCaseId) &&
        successfulCases.some(c => c.id === conn.targetCaseId)
      );
      
      if (successConnections.length > 0) {
        patterns.push({
          id: 'pattern_success',
          type: 'success_pattern',
          caseIds: successfulCases.map(c => c.id),
          pattern: 'Common factors in successful case outcomes',
          confidence: 0.8,
          actionableInsights: [
            'Replicate successful argument structures',
            'Apply similar evidence presentation strategies',
            'Consider comparable settlement approaches'
          ]
        });
      }
    }
    
    // Identify procedural patterns
    const proceduralConnections = connections.filter(conn => 
      conn.connectionType === 'temporal_sequence' && conn.strength > 0.5
    );
    
    if (proceduralConnections.length > 0) {
      patterns.push({
        id: 'pattern_procedural',
        type: 'procedural_pattern',
        caseIds: proceduralConnections.flatMap(conn => [conn.sourceCaseId, conn.targetCaseId]),
        pattern: 'Sequential case handling and procedural flow',
        confidence: 0.7,
        actionableInsights: [
          'Optimize case scheduling and resource allocation',
          'Learn from procedural efficiencies',
          'Anticipate similar procedural challenges'
        ]
      });
    }
    
    return patterns;
  };

  const generateConnectionInsights = (
    connections: CaseConnection[], 
    clusters: CaseCluster[], 
    patterns: CasePattern[]
  ): ConnectionInsight[] => {
    const insights: ConnectionInsight[] = [];
    
    // Strategic insights from strong connections
    const strongConnections = connections.filter(conn => conn.strength > 0.7);
    if (strongConnections.length > 0) {
      insights.push({
        id: 'insight_strategic_precedent',
        type: 'strategic',
        title: 'Strong Precedent Connections Identified',
        description: `${strongConnections.length} cases with high similarity scores provide strategic precedent value`,
        relatedConnections: strongConnections.map(c => c.id),
        priority: 'high',
        actionable: true
      });
    }
    
    // Evidential insights
    const evidentialConnections = connections.filter(conn => 
      conn.metadata.evidentialSimilarity && conn.metadata.evidentialSimilarity > 0.6
    );
    if (evidentialConnections.length > 0) {
      insights.push({
        id: 'insight_evidential_patterns',
        type: 'evidential',
        title: 'Evidence Patterns Across Connected Cases',
        description: 'Similar evidence types and presentation strategies found in related cases',
        relatedConnections: evidentialConnections.map(c => c.id),
        priority: 'medium',
        actionable: true
      });
    }
    
    // Procedural insights from clusters
    if (clusters.length > 0) {
      insights.push({
        id: 'insight_cluster_efficiency',
        type: 'procedural',
        title: 'Case Cluster Optimization Opportunities',
        description: `${clusters.length} case clusters identified for potential resource optimization`,
        relatedConnections: [],
        priority: 'medium',
        actionable: true
      });
    }
    
    // Pattern-based insights
    const successPatterns = patterns.filter(p => p.type === 'success_pattern');
    if (successPatterns.length > 0) {
      insights.push({
        id: 'insight_success_replication',
        type: 'strategic',
        title: 'Success Pattern Replication Opportunity',
        description: 'Identified successful case patterns that can be applied to current strategy',
        relatedConnections: [],
        priority: 'critical',
        actionable: true
      });
    }
    
    return insights;
  };

  // Helper functions
  const extractFactsFromCase = (caseObj: any) => {
    // Simulate fact extraction
    return [
      'commercial dispute',
      'contract breach',
      'financial damages',
      'timeline evidence'
    ];
  };

  const extractPartiesFromCase = (caseObj: any) => {
    // Simulate party extraction
    return [
      { name: 'John Smith', aliases: ['J Smith'], role: 'defendant' },
      { name: 'ABC Corp', aliases: ['ABC Corporation'], role: 'claimant' }
    ];
  };

  const extractLegalIssuesFromCase = (caseObj: any) => {
    // Simulate legal issue extraction
    return [
      'breach of contract',
      'negligence',
      'damages assessment',
      'causation'
    ];
  };

  const findSharedEntities = (facts1: string[], facts2: string[]) => {
    return facts1.filter(fact => facts2.includes(fact));
  };

  const calculateFactSimilarity = (facts1: string[], facts2: string[]) => {
    const sharedFacts = findSharedEntities(facts1, facts2);
    return sharedFacts.length / Math.max(facts1.length, facts2.length);
  };

  const extractClusterPrinciples = (connections: CaseConnection[]) => {
    const principles = new Set<string>();
    connections.forEach(conn => {
      conn.metadata.commonLegalPrinciples?.forEach(principle => 
        principles.add(principle)
      );
    });
    return Array.from(principles);
  };

  return (
    <div className="case-connection-intelligence">
      {isAnalyzing && (
        <div className="analysis-indicator">
          <span className="spinner">🔄</span>
          <span>Analyzing case connections...</span>
        </div>
      )}
      
      <div className="connection-summary">
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-value">{connections.length}</span>
            <span className="summary-label">Connections</span>
          </div>
          <div className="summary-item">
            <span className="summary-value">{clusters.length}</span>
            <span className="summary-label">Clusters</span>
          </div>
          <div className="summary-item">
            <span className="summary-value">{patterns.length}</span>
            <span className="summary-label">Patterns</span>
          </div>
          <div className="summary-item">
            <span className="summary-value">{insights.length}</span>
            <span className="summary-label">Insights</span>
          </div>
        </div>
      </div>
      
      <div className="connections-list">
        <h4>🔗 Case Connections</h4>
        {connections.slice(0, 5).map(connection => (
          <div 
            key={connection.id} 
            className={`connection-item ${connection.connectionType}`}
            onClick={() => setSelectedConnection(connection)}
          >
            <div className="connection-header">
              <span className="connection-type">
                {connection.connectionType.replace('_', ' ')}
              </span>
              <div className="connection-strength">
                <span className="strength-value">
                  {Math.round(connection.strength * 100)}%
                </span>
              </div>
            </div>
            <p className="connection-description">{connection.description}</p>
            <div className="connection-meta">
              <span className="confidence">
                {Math.round(connection.confidence * 100)}% confidence
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="insights-preview">
        <h4>💡 Key Insights</h4>
        {insights.slice(0, 3).map(insight => (
          <div key={insight.id} className={`insight-item ${insight.priority}`}>
            <h5>{insight.title}</h5>
            <p>{insight.description}</p>
            {insight.actionable && (
              <span className="actionable-badge">Actionable</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CaseConnectionIntelligence;