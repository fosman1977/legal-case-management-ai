/**
 * LEGAL INTELLIGENCE INTEGRATION
 * Integrates cross-document analysis with enterprise processing pipeline
 * 
 * Status: Phase 1, Week 4 - Cross-Document Analysis Integration
 * Purpose: Bridge between enterprise processing and legal intelligence
 * Value: Transforms document processing into legal case intelligence
 */

import { EventEmitter } from 'events';
import { CrossDocumentAnalyzer, CrossDocumentAnalysis } from './cross-document-analyzer';
import { LegalEntityResolver, ResolvedLegalEntity } from './legal-entity-resolver';
import { EnterpriseProcessingQueue, ProcessingTask, TaskPriority } from './enterprise-queue';

export interface LegalIntelligenceOptions {
  enableEntityResolution: boolean;
  enableDocumentRelationships: boolean;
  enableTimelineConstruction: boolean;
  enableInsightGeneration: boolean;
  enableKnowledgeGraph: boolean;
  confidenceThreshold: number;
  jurisdiction: 'us' | 'uk' | 'auto';
  practiceAreas: string[];
}

export interface CaseIntelligenceResult {
  caseId: string;
  caseName: string;
  analysis: CrossDocumentAnalysis;
  keyEntities: ResolvedLegalEntity[];
  caseStrategy: CaseStrategyInsights;
  riskAssessment: RiskAssessment;
  actionItems: ActionItem[];
  metadata: CaseIntelligenceMetadata;
}

export interface CaseStrategyInsights {
  strengthAssessment: {
    overall: 'strong' | 'moderate' | 'weak';
    confidence: number;
    factors: StrengthFactor[];
  };
  evidenceAnalysis: {
    strongEvidence: EvidenceItem[];
    weakEvidence: EvidenceItem[];
    missingEvidence: string[];
  };
  adversaryAnalysis: {
    opposingParties: ResolvedLegalEntity[];
    opposingCounsel: ResolvedLegalEntity[];
    relationships: EntityRelationshipInsight[];
  };
  timelineSignificance: {
    criticalPeriods: TimePeriod[];
    deadlines: Deadline[];
    gaps: TimelineGap[];
  };
}

export interface StrengthFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  magnitude: number; // 0-1 scale
  confidence: number;
  evidence: string[];
}

export interface EvidenceItem {
  documentId: string;
  documentName: string;
  evidenceType: 'smoking_gun' | 'supporting' | 'circumstantial' | 'contradictory';
  description: string;
  strength: number; // 0-1 scale
  reliability: number; // 0-1 scale
  legalSignificance: 'critical' | 'important' | 'contextual';
}

export interface EntityRelationshipInsight {
  relationship: string;
  entities: string[];
  significance: 'case_critical' | 'important' | 'contextual';
  implications: string[];
}

export interface TimePeriod {
  startDate: Date;
  endDate: Date;
  description: string;
  significance: 'statute_of_limitations' | 'damages_period' | 'key_events' | 'other';
  events: string[];
}

export interface Deadline {
  date: Date;
  type: 'filing' | 'discovery' | 'motion' | 'trial' | 'statute_of_limitations';
  description: string;
  status: 'upcoming' | 'missed' | 'completed';
  daysRemaining?: number;
  consequences: string;
}

export interface TimelineGap {
  startDate: Date;
  endDate: Date;
  duration: number; // days
  significance: string;
  missingInformation: string[];
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: RiskFactor[];
  mitigationStrategies: MitigationStrategy[];
  probabilities: {
    favorableOutcome: number;
    settlement: number;
    trial: number;
    appeal: number;
  };
}

export interface RiskFactor {
  factor: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number; // 0-1
  impact: string;
  evidence: string[];
  mitigation?: string;
}

export interface MitigationStrategy {
  strategy: string;
  priority: 'high' | 'medium' | 'low';
  timeline: string;
  cost: 'low' | 'medium' | 'high';
  effectiveness: number; // 0-1
  description: string;
}

export interface ActionItem {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'discovery' | 'legal_research' | 'expert_witness' | 'motion' | 'settlement' | 'trial_prep';
  description: string;
  dueDate?: Date;
  estimatedHours: number;
  assignee?: string;
  dependencies: string[];
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
}

export interface CaseIntelligenceMetadata {
  analysisDate: Date;
  documentsAnalyzed: number;
  analysisVersion: string;
  jurisdiction: string;
  practiceArea: string;
  caseType: string;
  confidenceScore: number;
}

export class LegalIntelligenceEngine extends EventEmitter {
  private crossDocAnalyzer: CrossDocumentAnalyzer;
  private entityResolver: LegalEntityResolver;
  private processingQueue: EnterpriseProcessingQueue;
  
  constructor(
    crossDocAnalyzer: CrossDocumentAnalyzer,
    entityResolver: LegalEntityResolver,
    processingQueue: EnterpriseProcessingQueue
  ) {
    super();
    this.crossDocAnalyzer = crossDocAnalyzer;
    this.entityResolver = entityResolver;
    this.processingQueue = processingQueue;
    
    console.log('🧠 Legal Intelligence Engine initialized');
  }

  /**
   * Analyze a case folder and generate comprehensive legal intelligence
   */
  async analyzeCaseFolder(
    caseId: string,
    caseName: string,
    documents: ProcessedDocument[],
    options: Partial<LegalIntelligenceOptions> = {}
  ): Promise<CaseIntelligenceResult> {
    const startTime = Date.now();
    
    console.log(`🧠 Starting legal intelligence analysis for case: ${caseName}`);
    console.log(`   Documents to analyze: ${documents.length}`);
    
    const enhancedOptions = this.getEnhancedOptions(options);
    
    // Step 1: Perform cross-document analysis
    console.log('Phase 1: Cross-Document Analysis...');
    const analysis = await this.crossDocAnalyzer.analyzeDocumentCollection(documents, {
      caseId,
      enableInsights: enhancedOptions.enableInsightGeneration
    });
    
    // Step 2: Enhanced entity resolution
    console.log('Phase 2: Legal Entity Resolution...');
    const legalContext = this.inferLegalContext(documents, enhancedOptions);
    const entityResult = await this.entityResolver.resolveEntitiesInDocuments(
      documents.map(d => ({ id: d.id, name: d.name, content: d.content || '' })),
      legalContext
    );
    
    // Step 3: Generate case strategy insights
    console.log('Phase 3: Case Strategy Analysis...');
    const caseStrategy = await this.generateCaseStrategyInsights(analysis, entityResult.entities);
    
    // Step 4: Perform risk assessment
    console.log('Phase 4: Risk Assessment...');
    const riskAssessment = await this.performRiskAssessment(analysis, entityResult.entities);
    
    // Step 5: Generate action items
    console.log('Phase 5: Action Item Generation...');
    const actionItems = await this.generateActionItems(analysis, caseStrategy, riskAssessment);
    
    const result: CaseIntelligenceResult = {
      caseId,
      caseName,
      analysis,
      keyEntities: entityResult.entities,
      caseStrategy,
      riskAssessment,
      actionItems,
      metadata: {
        analysisDate: new Date(),
        documentsAnalyzed: documents.length,
        analysisVersion: '1.0.0',
        jurisdiction: enhancedOptions.jurisdiction,
        practiceArea: enhancedOptions.practiceAreas[0] || 'general',
        caseType: this.inferCaseType(analysis),
        confidenceScore: analysis.statistics.confidence
      }
    };
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ Legal intelligence analysis complete in ${processingTime}ms`);
    console.log(`   Entities resolved: ${entityResult.entities.length}`);
    console.log(`   Insights generated: ${analysis.insights.length}`);
    console.log(`   Action items: ${actionItems.length}`);
    console.log(`   Overall confidence: ${(result.metadata.confidenceScore * 100).toFixed(1)}%`);
    
    this.emit('analysisComplete', result);
    return result;
  }

  /**
   * Generate case strategy insights
   */
  private async generateCaseStrategyInsights(
    analysis: CrossDocumentAnalysis,
    entities: ResolvedLegalEntity[]
  ): Promise<CaseStrategyInsights> {
    
    // Assess case strength
    const strengthFactors = this.assessCaseStrength(analysis);
    const strengthAssessment = {
      overall: this.calculateOverallStrength(strengthFactors) as 'strong' | 'moderate' | 'weak',
      confidence: this.calculateStrengthConfidence(strengthFactors),
      factors: strengthFactors
    };
    
    // Analyze evidence
    const evidenceAnalysis = this.analyzeEvidence(analysis);
    
    // Analyze adversaries
    const adversaryAnalysis = this.analyzeAdversaries(entities);
    
    // Analyze timeline significance
    const timelineSignificance = this.analyzeTimelineSignificance(analysis.timeline);
    
    return {
      strengthAssessment,
      evidenceAnalysis,
      adversaryAnalysis,
      timelineSignificance
    };
  }

  /**
   * Assess case strength based on analysis
   */
  private assessCaseStrength(analysis: CrossDocumentAnalysis): StrengthFactor[] {
    const factors: StrengthFactor[] = [];
    
    // Evidence quality factor
    const smokingGuns = analysis.insights.filter(i => i.type === 'pattern' && i.importance === 'critical');
    if (smokingGuns.length > 0) {
      factors.push({
        factor: 'Strong Evidence Found',
        impact: 'positive',
        magnitude: Math.min(smokingGuns.length * 0.3, 0.9),
        confidence: 0.8,
        evidence: smokingGuns.map(s => s.description)
      });
    }
    
    // Contradiction factor
    const contradictions = analysis.insights.filter(i => i.type === 'contradiction');
    if (contradictions.length > 0) {
      factors.push({
        factor: 'Internal Contradictions',
        impact: 'negative',
        magnitude: Math.min(contradictions.length * 0.2, 0.7),
        confidence: 0.9,
        evidence: contradictions.map(c => c.description)
      });
    }
    
    // Timeline completeness factor
    if (analysis.timeline && analysis.timeline.metadata.completeness > 0.8) {
      factors.push({
        factor: 'Complete Timeline',
        impact: 'positive',
        magnitude: analysis.timeline.metadata.completeness * 0.3,
        confidence: 0.7,
        evidence: [`Timeline ${(analysis.timeline.metadata.completeness * 100).toFixed(0)}% complete`]
      });
    }
    
    // Entity resolution quality
    const entityConfidence = Array.from(analysis.entities.values())
      .reduce((sum, e) => sum + e.confidence, 0) / analysis.entities.size;
    
    if (entityConfidence > 0.8) {
      factors.push({
        factor: 'High Entity Resolution Confidence',
        impact: 'positive',
        magnitude: (entityConfidence - 0.5) * 0.4,
        confidence: entityConfidence,
        evidence: [`Average entity confidence: ${(entityConfidence * 100).toFixed(0)}%`]
      });
    }
    
    return factors;
  }

  /**
   * Calculate overall case strength
   */
  private calculateOverallStrength(factors: StrengthFactor[]): string {
    const positiveWeight = factors
      .filter(f => f.impact === 'positive')
      .reduce((sum, f) => sum + (f.magnitude * f.confidence), 0);
      
    const negativeWeight = factors
      .filter(f => f.impact === 'negative')
      .reduce((sum, f) => sum + (f.magnitude * f.confidence), 0);
    
    const netStrength = positiveWeight - negativeWeight;
    
    if (netStrength > 0.6) return 'strong';
    if (netStrength > 0.2) return 'moderate';
    return 'weak';
  }

  /**
   * Calculate strength confidence
   */
  private calculateStrengthConfidence(factors: StrengthFactor[]): number {
    if (factors.length === 0) return 0.5;
    
    const avgConfidence = factors.reduce((sum, f) => sum + f.confidence, 0) / factors.length;
    const factorCountBonus = Math.min(factors.length * 0.05, 0.2);
    
    return Math.min(avgConfidence + factorCountBonus, 1.0);
  }

  /**
   * Analyze evidence from the case
   */
  private analyzeEvidence(analysis: CrossDocumentAnalysis): CaseStrategyInsights['evidenceAnalysis'] {
    const strongEvidence: EvidenceItem[] = [];
    const weakEvidence: EvidenceItem[] = [];
    const missingEvidence: string[] = [];
    
    // Identify strong evidence from insights
    const criticalInsights = analysis.insights.filter(i => i.importance === 'critical');
    for (const insight of criticalInsights) {
      for (const docId of insight.documents) {
        strongEvidence.push({
          documentId: docId,
          documentName: `Document ${docId}`,
          evidenceType: 'smoking_gun',
          description: insight.description,
          strength: 0.9,
          reliability: insight.confidence,
          legalSignificance: 'critical'
        });
      }
    }
    
    // Identify missing evidence from gaps
    const missingEvidenceInsights = analysis.insights.filter(i => i.type === 'missing_evidence');
    for (const insight of missingEvidenceInsights) {
      missingEvidence.push(insight.description);
    }
    
    return {
      strongEvidence,
      weakEvidence,
      missingEvidence
    };
  }

  /**
   * Analyze adversaries and opposing parties
   */
  private analyzeAdversaries(entities: ResolvedLegalEntity[]): CaseStrategyInsights['adversaryAnalysis'] {
    const opposingParties = entities.filter(e => 
      e.roles.has('defendant' as any) || e.roles.has('respondent' as any)
    );
    
    const opposingCounsel = entities.filter(e => 
      e.entityType === 'lawyer' && 
      (e.roles.has('attorney_defendant' as any) || e.roles.has('counsel' as any))
    );
    
    const relationships: EntityRelationshipInsight[] = [];
    
    // Analyze attorney-client relationships
    for (const counsel of opposingCounsel) {
      for (const party of opposingParties) {
        const represents = counsel.relationships.find(r => 
          r.toEntity === party.id && r.relationshipType === 'represents'
        );
        
        if (represents) {
          relationships.push({
            relationship: `${counsel.canonicalName} represents ${party.canonicalName}`,
            entities: [counsel.id, party.id],
            significance: 'case_critical',
            implications: ['Key opposing counsel relationship', 'Strategy implications']
          });
        }
      }
    }
    
    return {
      opposingParties,
      opposingCounsel,
      relationships
    };
  }

  /**
   * Analyze timeline significance
   */
  private analyzeTimelineSignificance(timeline: any): CaseStrategyInsights['timelineSignificance'] {
    const criticalPeriods: TimePeriod[] = [];
    const deadlines: Deadline[] = [];
    const gaps: TimelineGap[] = [];
    
    if (!timeline) {
      return { criticalPeriods, deadlines, gaps };
    }
    
    // Identify critical periods
    if (timeline.periods) {
      for (const period of timeline.periods) {
        criticalPeriods.push({
          startDate: period.startDate,
          endDate: period.endDate,
          description: period.description,
          significance: period.type,
          events: period.relatedEvents
        });
      }
    }
    
    // Convert critical dates to deadlines
    if (timeline.criticalDates) {
      for (const criticalDate of timeline.criticalDates) {
        deadlines.push({
          date: criticalDate.date,
          type: criticalDate.type,
          description: criticalDate.description,
          status: criticalDate.passed ? 'completed' : 'upcoming',
          daysRemaining: criticalDate.daysRemaining,
          consequences: criticalDate.consequences || 'Unknown consequences'
        });
      }
    }
    
    // Convert timeline gaps
    if (timeline.metadata && timeline.metadata.gaps) {
      for (const gap of timeline.metadata.gaps) {
        gaps.push({
          startDate: gap.startDate,
          endDate: gap.endDate,
          duration: gap.duration,
          significance: gap.significance || 'Information gap',
          missingInformation: ['Unknown events or activities during this period']
        });
      }
    }
    
    return {
      criticalPeriods,
      deadlines,
      gaps
    };
  }

  /**
   * Perform risk assessment
   */
  private async performRiskAssessment(
    analysis: CrossDocumentAnalysis,
    entities: ResolvedLegalEntity[]
  ): Promise<RiskAssessment> {
    const riskFactors: RiskFactor[] = [];
    
    // Missing evidence risk
    const missingEvidenceInsights = analysis.insights.filter(i => i.type === 'missing_evidence');
    if (missingEvidenceInsights.length > 0) {
      riskFactors.push({
        factor: 'Missing Critical Evidence',
        severity: 'high',
        probability: 0.8,
        impact: 'Could weaken case significantly',
        evidence: missingEvidenceInsights.map(i => i.description),
        mitigation: 'Conduct additional discovery'
      });
    }
    
    // Timeline gap risk
    if (analysis.timeline && analysis.timeline.metadata.gaps.length > 0) {
      const significantGaps = analysis.timeline.metadata.gaps.filter(g => g.duration > 90);
      if (significantGaps.length > 0) {
        riskFactors.push({
          factor: 'Significant Timeline Gaps',
          severity: 'medium',
          probability: 0.6,
          impact: 'May indicate missing information or activities',
          evidence: significantGaps.map(g => `${g.duration} day gap`),
          mitigation: 'Investigate gap periods through discovery'
        });
      }
    }
    
    // Strong opposing counsel risk
    const opposingCounsel = entities.filter(e => 
      e.entityType === 'lawyer' && e.confidence > 0.8
    );
    if (opposingCounsel.length > 2) {
      riskFactors.push({
        factor: 'Well-Represented Opposition',
        severity: 'medium',
        probability: 0.9,
        impact: 'Opposing party has experienced legal representation',
        evidence: opposingCounsel.map(c => c.canonicalName)
      });
    }
    
    // Calculate overall risk
    const avgSeverity = this.calculateAverageRiskSeverity(riskFactors);
    const overallRisk = this.determineOverallRisk(avgSeverity);
    
    // Generate mitigation strategies
    const mitigationStrategies = this.generateMitigationStrategies(riskFactors);
    
    // Calculate outcome probabilities
    const probabilities = this.calculateOutcomeProbabilities(riskFactors, analysis);
    
    return {
      overallRisk,
      riskFactors,
      mitigationStrategies,
      probabilities
    };
  }

  /**
   * Calculate average risk severity
   */
  private calculateAverageRiskSeverity(riskFactors: RiskFactor[]): number {
    if (riskFactors.length === 0) return 0;
    
    const severityValues = { low: 0.25, medium: 0.5, high: 0.75, critical: 1.0 };
    const totalSeverity = riskFactors.reduce((sum, rf) => 
      sum + (severityValues[rf.severity] * rf.probability), 0
    );
    
    return totalSeverity / riskFactors.length;
  }

  /**
   * Determine overall risk level
   */
  private determineOverallRisk(avgSeverity: number): RiskAssessment['overallRisk'] {
    if (avgSeverity > 0.75) return 'critical';
    if (avgSeverity > 0.5) return 'high';
    if (avgSeverity > 0.25) return 'medium';
    return 'low';
  }

  /**
   * Generate mitigation strategies
   */
  private generateMitigationStrategies(riskFactors: RiskFactor[]): MitigationStrategy[] {
    const strategies: MitigationStrategy[] = [];
    
    for (const risk of riskFactors) {
      if (risk.mitigation) {
        strategies.push({
          strategy: risk.mitigation,
          priority: risk.severity === 'critical' ? 'high' : risk.severity === 'high' ? 'high' : 'medium',
          timeline: risk.severity === 'critical' ? 'Immediate' : '30-60 days',
          cost: 'medium',
          effectiveness: 0.7,
          description: `Mitigate risk: ${risk.factor}`
        });
      }
    }
    
    return strategies;
  }

  /**
   * Calculate outcome probabilities
   */
  private calculateOutcomeProbabilities(riskFactors: RiskFactor[], analysis: CrossDocumentAnalysis): any {
    // Simplified probability calculation
    const riskScore = this.calculateAverageRiskSeverity(riskFactors);
    const strengthScore = analysis.statistics.confidence;
    
    const favorableOutcome = Math.max(0.1, strengthScore - riskScore);
    const settlement = 0.4 + (riskScore * 0.3);
    const trial = Math.max(0.1, 0.6 - settlement);
    const appeal = Math.min(0.3, riskScore * 0.5);
    
    return {
      favorableOutcome,
      settlement,
      trial,
      appeal
    };
  }

  /**
   * Generate actionable items
   */
  private async generateActionItems(
    analysis: CrossDocumentAnalysis,
    caseStrategy: CaseStrategyInsights,
    riskAssessment: RiskAssessment
  ): Promise<ActionItem[]> {
    const actionItems: ActionItem[] = [];
    let itemId = 1;
    
    // Actions from missing evidence
    for (const missing of caseStrategy.evidenceAnalysis.missingEvidence) {
      actionItems.push({
        id: `action-${itemId++}`,
        priority: 'high',
        category: 'discovery',
        description: `Obtain missing evidence: ${missing}`,
        estimatedHours: 8,
        dependencies: [],
        status: 'not_started'
      });
    }
    
    // Actions from timeline gaps
    for (const gap of caseStrategy.timelineSignificance.gaps) {
      if (gap.duration > 60) {
        actionItems.push({
          id: `action-${itemId++}`,
          priority: 'medium',
          category: 'discovery',
          description: `Investigate ${gap.duration}-day timeline gap`,
          estimatedHours: 4,
          dependencies: [],
          status: 'not_started'
        });
      }
    }
    
    // Actions from upcoming deadlines
    for (const deadline of caseStrategy.timelineSignificance.deadlines) {
      if (deadline.status === 'upcoming' && deadline.daysRemaining && deadline.daysRemaining < 30) {
        actionItems.push({
          id: `action-${itemId++}`,
          priority: deadline.daysRemaining < 7 ? 'critical' : 'high',
          category: 'motion',
          description: `Prepare for upcoming deadline: ${deadline.description}`,
          dueDate: deadline.date,
          estimatedHours: 12,
          dependencies: [],
          status: 'not_started'
        });
      }
    }
    
    // Actions from risk mitigation
    for (const strategy of riskAssessment.mitigationStrategies) {
      actionItems.push({
        id: `action-${itemId++}`,
        priority: strategy.priority,
        category: 'discovery',
        description: strategy.strategy,
        estimatedHours: strategy.cost === 'high' ? 16 : strategy.cost === 'medium' ? 8 : 4,
        dependencies: [],
        status: 'not_started'
      });
    }
    
    return actionItems;
  }

  /**
   * Infer legal context from documents
   */
  private inferLegalContext(documents: any[], options: LegalIntelligenceOptions): any {
    return {
      documentType: 'other',
      jurisdiction: options.jurisdiction === 'auto' ? 'us' : options.jurisdiction,
      practiceArea: options.practiceAreas,
      courtLevel: 'other',
      confidence: 0.8
    };
  }

  /**
   * Infer case type from analysis
   */
  private inferCaseType(analysis: CrossDocumentAnalysis): string {
    // Look for indicators in entities and documents
    const entities = Array.from(analysis.entities.values());
    
    if (entities.some(e => e.roles.has('plaintiff' as any) && e.roles.has('defendant' as any))) {
      return 'civil_litigation';
    }
    
    if (entities.some(e => e.type === 'court')) {
      return 'court_proceeding';
    }
    
    return 'general_legal_matter';
  }

  /**
   * Get enhanced options with defaults
   */
  private getEnhancedOptions(options: Partial<LegalIntelligenceOptions>): LegalIntelligenceOptions {
    return {
      enableEntityResolution: options.enableEntityResolution !== false,
      enableDocumentRelationships: options.enableDocumentRelationships !== false,
      enableTimelineConstruction: options.enableTimelineConstruction !== false,
      enableInsightGeneration: options.enableInsightGeneration !== false,
      enableKnowledgeGraph: options.enableKnowledgeGraph !== false,
      confidenceThreshold: options.confidenceThreshold || 0.7,
      jurisdiction: options.jurisdiction || 'us',
      practiceAreas: options.practiceAreas || ['general']
    };
  }
}

// Supporting interfaces
interface ProcessedDocument {
  id: string;
  name: string;
  content?: string;
  metadata?: any;
}

// Export factory function
export function createLegalIntelligenceEngine(
  crossDocAnalyzer: CrossDocumentAnalyzer,
  entityResolver: LegalEntityResolver,
  processingQueue: EnterpriseProcessingQueue
): LegalIntelligenceEngine {
  return new LegalIntelligenceEngine(crossDocAnalyzer, entityResolver, processingQueue);
}

console.log('🧠 Legal Intelligence Integration module loaded');