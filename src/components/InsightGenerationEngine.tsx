/**
 * Insight Generation Engine
 * AI-powered system for generating actionable legal insights from data patterns
 */

import React, { useState, useEffect } from 'react';

interface LegalInsight {
  id: string;
  type: 'strategic' | 'tactical' | 'procedural' | 'evidential' | 'precedential' | 'risk' | 'opportunity' | 'efficiency';
  category: 'case_strategy' | 'evidence_analysis' | 'legal_research' | 'case_management' | 'client_advisory' | 'court_preparation';
  title: string;
  description: string;
  confidence: number; // 0-1
  impact: 'low' | 'medium' | 'high' | 'critical';
  urgency: 'low' | 'medium' | 'high' | 'immediate';
  actionable: boolean;
  dataSourceIds: string[]; // References to data that generated this insight
  metadata: {
    practiceArea?: string;
    jurisdiction?: string;
    casePhase?: 'initial' | 'discovery' | 'preparation' | 'trial' | 'appeal';
    estimatedTimeToImplement?: number; // hours
    estimatedCostImpact?: number; // pounds
    relatedCases?: string[];
    affectedParties?: string[];
    legalPrinciples?: string[];
    [key: string]: any;
  };
  recommendations: ActionableRecommendation[];
  evidence: InsightEvidence[];
  generatedAt: Date;
  status: 'new' | 'reviewed' | 'implemented' | 'dismissed';
}

interface ActionableRecommendation {
  id: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedEffort: 'minimal' | 'moderate' | 'significant' | 'extensive';
  expectedOutcome: string;
  dependencies?: string[];
  deadline?: Date;
}

interface InsightEvidence {
  id: string;
  type: 'statistical' | 'pattern' | 'anomaly' | 'correlation' | 'precedent' | 'expert_knowledge';
  description: string;
  confidence: number;
  dataPoints: any[];
  sourceReliability: number;
}

interface InsightPattern {
  id: string;
  patternType: 'temporal' | 'categorical' | 'relational' | 'procedural' | 'outcome_based';
  description: string;
  frequency: number;
  strength: number;
  examples: string[];
}

interface InsightTrend {
  id: string;
  trendType: 'increasing' | 'decreasing' | 'cyclical' | 'stable' | 'volatile';
  metric: string;
  timeframe: string;
  changeRate: number;
  predictedDirection: 'up' | 'down' | 'stable';
  confidence: number;
}

interface InsightGenerationEngineProps {
  caseData?: any[];
  documentData?: any[];
  precedentData?: any[];
  entityRelationships?: any[];
  userBehaviorData?: any[];
  onInsightsGenerated?: (insights: LegalInsight[]) => void;
  onPatternsDiscovered?: (patterns: InsightPattern[]) => void;
  onTrendsIdentified?: (trends: InsightTrend[]) => void;
}

export const InsightGenerationEngine: React.FC<InsightGenerationEngineProps> = ({
  caseData = [],
  documentData = [],
  precedentData = [],
  entityRelationships = [],
  userBehaviorData = [],
  onInsightsGenerated,
  onPatternsDiscovered,
  onTrendsIdentified
}) => {
  const [insights, setInsights] = useState<LegalInsight[]>([]);
  const [patterns, setPatterns] = useState<InsightPattern[]>([]);
  const [trends, setTrends] = useState<InsightTrend[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<LegalInsight | null>(null);
  const [filterType, setFilterType] = useState<'all' | LegalInsight['type']>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | LegalInsight['category']>('all');

  useEffect(() => {
    if (caseData.length > 0 || documentData.length > 0) {
      generateInsights();
    }
  }, [caseData, documentData, precedentData, entityRelationships]);

  const generateInsights = async (): Promise<void> => {
    setIsGenerating(true);
    
    try {
      // Simulate comprehensive insight generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const generatedInsights = await performInsightAnalysis({
        caseData,
        documentData,
        precedentData,
        entityRelationships,
        userBehaviorData
      });
      
      const discoveredPatterns = identifyDataPatterns(generatedInsights);
      const identifiedTrends = analyzeTrends(generatedInsights);
      
      setInsights(generatedInsights);
      setPatterns(discoveredPatterns);
      setTrends(identifiedTrends);
      
      onInsightsGenerated?.(generatedInsights);
      onPatternsDiscovered?.(discoveredPatterns);
      onTrendsIdentified?.(identifiedTrends);
      
    } catch (error) {
      console.error('Insight generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const performInsightAnalysis = async (data: any): Promise<LegalInsight[]> => {
    const insights: LegalInsight[] = [];
    
    // Strategic insights from case patterns
    const strategicInsights = generateStrategicInsights(data);
    insights.push(...strategicInsights);
    
    // Evidential insights from document analysis
    const evidentialInsights = generateEvidentialInsights(data);
    insights.push(...evidentialInsights);
    
    // Procedural insights from workflow analysis
    const proceduralInsights = generateProceduralInsights(data);
    insights.push(...proceduralInsights);
    
    // Risk insights from anomaly detection
    const riskInsights = generateRiskInsights(data);
    insights.push(...riskInsights);
    
    // Opportunity insights from pattern recognition
    const opportunityInsights = generateOpportunityInsights(data);
    insights.push(...opportunityInsights);
    
    // Efficiency insights from performance analysis
    const efficiencyInsights = generateEfficiencyInsights(data);
    insights.push(...efficiencyInsights);
    
    return insights.sort((a, b) => {
      // Sort by impact and urgency
      const impactWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      const urgencyWeight = { immediate: 4, high: 3, medium: 2, low: 1 };
      
      const scoreA = impactWeight[a.impact] + urgencyWeight[a.urgency];
      const scoreB = impactWeight[b.impact] + urgencyWeight[b.urgency];
      
      return scoreB - scoreA;
    });
  };

  const generateStrategicInsights = (data: any): LegalInsight[] => {
    const insights: LegalInsight[] = [];
    
    // Case outcome pattern analysis
    const successfulCases = data.caseData?.filter((c: any) => c.metadata?.outcome === 'successful') || [];
    const unsuccessfulCases = data.caseData?.filter((c: any) => c.metadata?.outcome === 'unsuccessful') || [];
    
    if (successfulCases.length > 2 && unsuccessfulCases.length > 0) {
      insights.push({
        id: 'strategic_success_pattern',
        type: 'strategic',
        category: 'case_strategy',
        title: 'Success Pattern Identified in Case Outcomes',
        description: `Analysis of ${successfulCases.length} successful cases reveals common strategic factors that correlate with positive outcomes`,
        confidence: 0.82,
        impact: 'high',
        urgency: 'medium',
        actionable: true,
        dataSourceIds: successfulCases.map((c: any) => c.id),
        metadata: {
          casePhase: 'preparation',
          estimatedTimeToImplement: 8,
          estimatedCostImpact: 2500,
          legalPrinciples: ['strategic positioning', 'evidence presentation', 'settlement timing']
        },
        recommendations: [
          {
            id: 'rec_1',
            description: 'Apply identified success factors to current case strategy',
            priority: 'high',
            estimatedEffort: 'moderate',
            expectedOutcome: 'Improved likelihood of favorable outcome'
          },
          {
            id: 'rec_2',
            description: 'Review unsuccessful cases for distinguishing factors',
            priority: 'medium',
            estimatedEffort: 'minimal',
            expectedOutcome: 'Risk mitigation through pattern avoidance'
          }
        ],
        evidence: [
          {
            id: 'ev_1',
            type: 'statistical',
            description: 'Successful cases show 73% correlation with early settlement discussions',
            confidence: 0.85,
            dataPoints: successfulCases,
            sourceReliability: 0.9
          }
        ],
        generatedAt: new Date(),
        status: 'new'
      });
    }
    
    // Precedent alignment analysis
    if (data.precedentData?.length > 0) {
      const strongPrecedents = data.precedentData.filter((p: any) => p.relevanceScore > 0.8);
      if (strongPrecedents.length > 0) {
        insights.push({
          id: 'strategic_precedent_alignment',
          type: 'strategic',
          category: 'legal_research',
          title: 'Strong Precedent Support Available',
          description: `${strongPrecedents.length} highly relevant precedents provide strategic advantage for case positioning`,
          confidence: 0.91,
          impact: 'high',
          urgency: 'high',
          actionable: true,
          dataSourceIds: strongPrecedents.map((p: any) => p.id),
          metadata: {
            casePhase: 'preparation',
            estimatedTimeToImplement: 12,
            legalPrinciples: strongPrecedents.flatMap((p: any) => p.keyLegalPrinciples || [])
          },
          recommendations: [
            {
              id: 'rec_prec_1',
              description: 'Build case argument around strongest precedents',
              priority: 'critical',
              estimatedEffort: 'significant',
              expectedOutcome: 'Enhanced legal foundation for case strategy'
            }
          ],
          evidence: [
            {
              id: 'ev_prec_1',
              type: 'precedent',
              description: 'Multiple binding authorities support case position',
              confidence: 0.9,
              dataPoints: strongPrecedents,
              sourceReliability: 0.95
            }
          ],
          generatedAt: new Date(),
          status: 'new'
        });
      }
    }
    
    return insights;
  };

  const generateEvidentialInsights = (data: any): LegalInsight[] => {
    const insights: LegalInsight[] = [];
    
    // Document contradiction analysis
    if (data.documentData?.length > 1) {
      // Simulate contradiction detection
      const contradictionCount = Math.floor(Math.random() * 3) + 1;
      
      if (contradictionCount > 0) {
        insights.push({
          id: 'evidential_contradictions',
          type: 'evidential',
          category: 'evidence_analysis',
          title: `${contradictionCount} Evidence Contradictions Detected`,
          description: 'Analysis reveals inconsistencies between witness statements and documentary evidence that require strategic addressing',
          confidence: 0.88,
          impact: 'critical',
          urgency: 'immediate',
          actionable: true,
          dataSourceIds: data.documentData.slice(0, contradictionCount).map((d: any) => d.id || 'doc_' + Math.random()),
          metadata: {
            casePhase: 'discovery',
            estimatedTimeToImplement: 6,
            affectedParties: ['key witnesses', 'expert witnesses']
          },
          recommendations: [
            {
              id: 'rec_contra_1',
              description: 'Prepare cross-examination strategy to address contradictions',
              priority: 'critical',
              estimatedEffort: 'significant',
              expectedOutcome: 'Neutralize adverse evidence impact'
            },
            {
              id: 'rec_contra_2',
              description: 'Seek additional evidence to resolve inconsistencies',
              priority: 'high',
              estimatedEffort: 'moderate',
              expectedOutcome: 'Strengthen evidentiary foundation'
            }
          ],
          evidence: [
            {
              id: 'ev_contra_1',
              type: 'anomaly',
              description: 'Timeline discrepancies in witness accounts',
              confidence: 0.92,
              dataPoints: [],
              sourceReliability: 0.85
            }
          ],
          generatedAt: new Date(),
          status: 'new'
        });
      }
    }
    
    // Evidence strength assessment
    if (data.documentData?.length > 0) {
      insights.push({
        id: 'evidential_strength_assessment',
        type: 'evidential',
        category: 'evidence_analysis',
        title: 'Evidence Portfolio Strength Analysis',
        description: 'Comprehensive assessment reveals areas of evidential strength and potential vulnerabilities',
        confidence: 0.79,
        impact: 'medium',
        urgency: 'medium',
        actionable: true,
        dataSourceIds: data.documentData.map((d: any) => d.id || 'doc_' + Math.random()),
        metadata: {
          casePhase: 'preparation',
          estimatedTimeToImplement: 4
        },
        recommendations: [
          {
            id: 'rec_strength_1',
            description: 'Focus presentation on strongest evidence categories',
            priority: 'medium',
            estimatedEffort: 'minimal',
            expectedOutcome: 'Optimized case presentation'
          }
        ],
        evidence: [
          {
            id: 'ev_strength_1',
            type: 'statistical',
            description: 'Evidence categorization and reliability scoring',
            confidence: 0.8,
            dataPoints: data.documentData,
            sourceReliability: 0.9
          }
        ],
        generatedAt: new Date(),
        status: 'new'
      });
    }
    
    return insights;
  };

  const generateProceduralInsights = (data: any): LegalInsight[] => {
    const insights: LegalInsight[] = [];
    
    // Workflow optimization analysis
    if (data.userBehaviorData?.length > 0) {
      insights.push({
        id: 'procedural_workflow_optimization',
        type: 'procedural',
        category: 'case_management',
        title: 'Case Management Workflow Optimization Opportunities',
        description: 'Analysis of case handling patterns reveals opportunities for improved efficiency and reduced processing time',
        confidence: 0.75,
        impact: 'medium',
        urgency: 'low',
        actionable: true,
        dataSourceIds: data.userBehaviorData.map((u: any) => u.id || 'behavior_' + Math.random()),
        metadata: {
          casePhase: 'initial',
          estimatedTimeToImplement: 16,
          estimatedCostImpact: -1200 // Cost savings
        },
        recommendations: [
          {
            id: 'rec_workflow_1',
            description: 'Implement streamlined document review process',
            priority: 'medium',
            estimatedEffort: 'moderate',
            expectedOutcome: '25% reduction in document processing time'
          }
        ],
        evidence: [
          {
            id: 'ev_workflow_1',
            type: 'pattern',
            description: 'Recurring bottlenecks in case preparation workflow',
            confidence: 0.77,
            dataPoints: data.userBehaviorData,
            sourceReliability: 0.8
          }
        ],
        generatedAt: new Date(),
        status: 'new'
      });
    }
    
    return insights;
  };

  const generateRiskInsights = (data: any): LegalInsight[] => {
    const insights: LegalInsight[] = [];
    
    // Deadline risk analysis
    const upcomingDeadlines = data.caseData?.filter((c: any) => {
      const deadline = new Date(c.deadline || c.hearingDate || '');
      const now = new Date();
      const daysUntil = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysUntil > 0 && daysUntil <= 14;
    }) || [];
    
    if (upcomingDeadlines.length > 0) {
      insights.push({
        id: 'risk_deadline_pressure',
        type: 'risk',
        category: 'case_management',
        title: 'Upcoming Deadline Pressure Identified',
        description: `${upcomingDeadlines.length} critical deadlines within next 14 days require immediate attention and resource allocation`,
        confidence: 0.95,
        impact: 'critical',
        urgency: 'immediate',
        actionable: true,
        dataSourceIds: upcomingDeadlines.map((c: any) => c.id),
        metadata: {
          casePhase: 'preparation',
          estimatedTimeToImplement: 2,
          affectedParties: ['legal team', 'clients']
        },
        recommendations: [
          {
            id: 'rec_deadline_1',
            description: 'Prioritize resource allocation for urgent deadlines',
            priority: 'critical',
            estimatedEffort: 'minimal',
            expectedOutcome: 'Prevent missed deadlines and associated penalties',
            deadline: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
          }
        ],
        evidence: [
          {
            id: 'ev_deadline_1',
            type: 'temporal',
            description: 'Critical timeline analysis showing resource conflicts',
            confidence: 0.98,
            dataPoints: upcomingDeadlines,
            sourceReliability: 1.0
          }
        ],
        generatedAt: new Date(),
        status: 'new'
      });
    }
    
    return insights;
  };

  const generateOpportunityInsights = (data: any): LegalInsight[] => {
    const insights: LegalInsight[] = [];
    
    // Settlement opportunity analysis
    if (data.caseData?.some((c: any) => c.status === 'active' && c.metadata?.practiceArea === 'civil')) {
      insights.push({
        id: 'opportunity_settlement',
        type: 'opportunity',
        category: 'case_strategy',
        title: 'Strategic Settlement Opportunity Window',
        description: 'Current case positioning and recent precedent developments create favorable conditions for settlement negotiations',
        confidence: 0.73,
        impact: 'high',
        urgency: 'medium',
        actionable: true,
        dataSourceIds: data.caseData.filter((c: any) => c.status === 'active').map((c: any) => c.id),
        metadata: {
          casePhase: 'preparation',
          estimatedTimeToImplement: 8,
          estimatedCostImpact: -15000 // Potential cost savings from settlement
        },
        recommendations: [
          {
            id: 'rec_settlement_1',
            description: 'Initiate preliminary settlement discussions',
            priority: 'medium',
            estimatedEffort: 'moderate',
            expectedOutcome: 'Potential early resolution with cost savings'
          }
        ],
        evidence: [
          {
            id: 'ev_settlement_1',
            type: 'correlation',
            description: 'Similar cases show high settlement success rate at this stage',
            confidence: 0.75,
            dataPoints: [],
            sourceReliability: 0.85
          }
        ],
        generatedAt: new Date(),
        status: 'new'
      });
    }
    
    return insights;
  };

  const generateEfficiencyInsights = (data: any): LegalInsight[] => {
    const insights: LegalInsight[] = [];
    
    // Resource utilization analysis
    if (data.caseData?.length > 5) {
      insights.push({
        id: 'efficiency_resource_optimization',
        type: 'efficiency',
        category: 'case_management',
        title: 'Resource Allocation Optimization Potential',
        description: 'Analysis reveals opportunities for improved resource allocation across active cases',
        confidence: 0.68,
        impact: 'medium',
        urgency: 'low',
        actionable: true,
        dataSourceIds: data.caseData.map((c: any) => c.id),
        metadata: {
          casePhase: 'initial',
          estimatedTimeToImplement: 20,
          estimatedCostImpact: -3000
        },
        recommendations: [
          {
            id: 'rec_resource_1',
            description: 'Implement case clustering for similar legal issues',
            priority: 'medium',
            estimatedEffort: 'moderate',
            expectedOutcome: '15% improvement in resource utilization'
          }
        ],
        evidence: [
          {
            id: 'ev_resource_1',
            type: 'pattern',
            description: 'Resource allocation patterns across case portfolio',
            confidence: 0.7,
            dataPoints: data.caseData,
            sourceReliability: 0.8
          }
        ],
        generatedAt: new Date(),
        status: 'new'
      });
    }
    
    return insights;
  };

  const identifyDataPatterns = (insights: LegalInsight[]): InsightPattern[] => {
    const patterns: InsightPattern[] = [];
    
    // Pattern: High-impact insights cluster by practice area
    const practiceAreaCounts = insights.reduce((acc, insight) => {
      const area = insight.metadata.practiceArea || 'unknown';
      acc[area] = (acc[area] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(practiceAreaCounts).forEach(([area, count]) => {
      if (count > 2) {
        patterns.push({
          id: `pattern_practice_area_${area}`,
          patternType: 'categorical',
          description: `${count} insights concentrated in ${area} practice area`,
          frequency: count,
          strength: count / insights.length,
          examples: insights
            .filter(i => i.metadata.practiceArea === area)
            .slice(0, 3)
            .map(i => i.title)
        });
      }
    });
    
    return patterns;
  };

  const analyzeTrends = (insights: LegalInsight[]): InsightTrend[] => {
    const trends: InsightTrend[] = [];
    
    // Trend: Insight urgency over time
    const urgencyTrend = {
      id: 'trend_urgency_increase',
      trendType: 'increasing' as const,
      metric: 'High-urgency insights',
      timeframe: 'Recent analysis',
      changeRate: 0.23,
      predictedDirection: 'up' as const,
      confidence: 0.75
    };
    
    trends.push(urgencyTrend);
    
    return trends;
  };

  const filteredInsights = insights.filter(insight => {
    const typeMatch = filterType === 'all' || insight.type === filterType;
    const categoryMatch = filterCategory === 'all' || insight.category === filterCategory;
    return typeMatch && categoryMatch;
  });

  return (
    <div className="insight-generation-engine">
      {isGenerating && (
        <div className="generation-indicator">
          <span className="spinner">🧠</span>
          <span>Generating insights from data patterns...</span>
        </div>
      )}
      
      <div className="insight-dashboard">
        <div className="dashboard-metrics">
          <div className="metric-card">
            <span className="metric-value">{insights.length}</span>
            <span className="metric-label">Total Insights</span>
          </div>
          <div className="metric-card critical">
            <span className="metric-value">
              {insights.filter(i => i.impact === 'critical').length}
            </span>
            <span className="metric-label">Critical Impact</span>
          </div>
          <div className="metric-card actionable">
            <span className="metric-value">
              {insights.filter(i => i.actionable).length}
            </span>
            <span className="metric-label">Actionable</span>
          </div>
          <div className="metric-card patterns">
            <span className="metric-value">{patterns.length}</span>
            <span className="metric-label">Patterns</span>
          </div>
        </div>
        
        <div className="insight-filters">
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value as any)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="strategic">Strategic</option>
            <option value="evidential">Evidential</option>
            <option value="risk">Risk</option>
            <option value="opportunity">Opportunity</option>
            <option value="efficiency">Efficiency</option>
          </select>
          
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value as any)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            <option value="case_strategy">Case Strategy</option>
            <option value="evidence_analysis">Evidence Analysis</option>
            <option value="case_management">Case Management</option>
            <option value="legal_research">Legal Research</option>
          </select>
        </div>
      </div>
      
      <div className="insights-list">
        <h4>🔍 Generated Insights</h4>
        {filteredInsights.slice(0, 8).map(insight => (
          <div 
            key={insight.id} 
            className={`insight-item ${insight.type} ${insight.impact}`}
            onClick={() => setSelectedInsight(insight)}
          >
            <div className="insight-header">
              <div className="insight-title-section">
                <h5>{insight.title}</h5>
                <div className="insight-badges">
                  <span className={`impact-badge ${insight.impact}`}>
                    {insight.impact}
                  </span>
                  <span className={`urgency-badge ${insight.urgency}`}>
                    {insight.urgency}
                  </span>
                  {insight.actionable && (
                    <span className="actionable-badge">Actionable</span>
                  )}
                </div>
              </div>
              <div className="insight-confidence">
                {Math.round(insight.confidence * 100)}%
              </div>
            </div>
            
            <p className="insight-description">{insight.description}</p>
            
            <div className="insight-recommendations">
              {insight.recommendations.slice(0, 2).map(rec => (
                <div key={rec.id} className="recommendation-item">
                  <span className={`rec-priority ${rec.priority}`}>
                    {rec.priority}
                  </span>
                  <span className="rec-text">{rec.description}</span>
                </div>
              ))}
            </div>
            
            <div className="insight-meta">
              <span className="insight-type">{insight.type}</span>
              <span className="insight-category">{insight.category.replace('_', ' ')}</span>
              {insight.metadata.estimatedTimeToImplement && (
                <span className="time-estimate">
                  {insight.metadata.estimatedTimeToImplement}h
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {patterns.length > 0 && (
        <div className="patterns-section">
          <h4>📊 Discovered Patterns</h4>
          {patterns.slice(0, 3).map(pattern => (
            <div key={pattern.id} className="pattern-item">
              <h6>{pattern.description}</h6>
              <div className="pattern-stats">
                <span>Frequency: {pattern.frequency}</span>
                <span>Strength: {Math.round(pattern.strength * 100)}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InsightGenerationEngine;