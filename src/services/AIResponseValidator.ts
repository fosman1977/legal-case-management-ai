/**
 * AI Response Analysis and Validation - Phase 3 Advanced AI Integration
 * Validates Claude responses for quality, relevance, legal accuracy, and completeness
 * Provides quality scoring and improvement suggestions
 */

import { ClaudeResponse } from './RealTimeClaudeIntegration';
import { ConsultationSession } from './AIConsultationManager';
import { EnhancedConsultationPattern } from './EnhancedPatternGenerator';

export interface ValidationCriteria {
  legalAccuracy: {
    weight: number;
    checks: string[];
  };
  relevance: {
    weight: number;
    contextFactors: string[];
  };
  completeness: {
    weight: number;
    requiredElements: string[];
  };
  actionability: {
    weight: number;
    actionIndicators: string[];
  };
  consistency: {
    weight: number;
    sessionHistory: boolean;
  };
}

export interface ValidationResult {
  id: string;
  responseId: string;
  overallScore: number;
  confidence: number;
  validationTimestamp: Date;
  
  qualityMetrics: {
    legalAccuracy: QualityScore;
    relevance: QualityScore;
    completeness: QualityScore;
    actionability: QualityScore;
    consistency: QualityScore;
  };
  
  detailedAnalysis: {
    strengths: string[];
    weaknesses: string[];
    missingElements: string[];
    inconsistencies: string[];
    improvementSuggestions: string[];
  };
  
  flaggedIssues: ValidationIssue[];
  recommendedActions: RecommendedAction[];
  
  complianceChecks: {
    legalEthics: ComplianceResult;
    professionalStandards: ComplianceResult;
    riskAppropriate: ComplianceResult;
    clientInterest: ComplianceResult;
  };
}

export interface QualityScore {
  score: number; // 0-1
  rationale: string;
  contributingFactors: string[];
  improvementAreas: string[];
}

export interface ValidationIssue {
  id: string;
  type: 'accuracy' | 'relevance' | 'completeness' | 'consistency' | 'ethical' | 'risk';
  severity: 'critical' | 'major' | 'minor' | 'informational';
  description: string;
  location: string; // Where in response
  suggestedFix: string;
  impact: string;
}

export interface RecommendedAction {
  type: 'clarify' | 'expand' | 'modify' | 'verify' | 'supplement';
  priority: 'immediate' | 'high' | 'medium' | 'low';
  description: string;
  expectedImprovement: number; // 0-1 expected score improvement
}

export interface ComplianceResult {
  compliant: boolean;
  confidence: number;
  issues: string[];
  recommendations: string[];
}

export interface ValidationContext {
  consultationPattern: EnhancedConsultationPattern;
  session: ConsultationSession;
  roundNumber: number;
  previousValidations: ValidationResult[];
  userExpectations: string[];
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  legalJurisdiction: string[];
}

/**
 * AI Response Validator - Ensures quality and compliance of Claude responses
 */
export class AIResponseValidator {
  private validationHistory: ValidationResult[] = [];
  private legalKnowledgeBase: Map<string, any> = new Map();
  private validationRules: Map<string, any> = new Map();
  
  constructor() {
    this.initializeLegalKnowledgeBase();
    this.initializeValidationRules();
  }

  /**
   * Validate Claude response comprehensively
   */
  async validateResponse(
    claudeResponse: ClaudeResponse,
    context: ValidationContext,
    criteria?: Partial<ValidationCriteria>
  ): Promise<ValidationResult> {
    
    const validationCriteria = this.buildValidationCriteria(context, criteria);
    const validationId = `validation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Perform quality assessments
    const legalAccuracy = await this.assessLegalAccuracy(claudeResponse.content, context);
    const relevance = await this.assessRelevance(claudeResponse.content, context);
    const completeness = await this.assessCompleteness(claudeResponse.content, context, validationCriteria);
    const actionability = await this.assessActionability(claudeResponse.content, context);
    const consistency = await this.assessConsistency(claudeResponse.content, context);
    
    // Calculate weighted overall score
    const overallScore = this.calculateOverallScore(
      { legalAccuracy, relevance, completeness, actionability, consistency },
      validationCriteria
    );
    
    // Detect issues
    const flaggedIssues = await this.detectIssues(claudeResponse.content, context, {
      legalAccuracy, relevance, completeness, actionability, consistency
    });
    
    // Generate recommendations
    const recommendedActions = this.generateRecommendedActions(
      { legalAccuracy, relevance, completeness, actionability, consistency },
      flaggedIssues,
      context
    );
    
    // Perform compliance checks
    const complianceChecks = await this.performComplianceChecks(claudeResponse.content, context);
    
    // Generate detailed analysis
    const detailedAnalysis = this.generateDetailedAnalysis(
      { legalAccuracy, relevance, completeness, actionability, consistency },
      flaggedIssues,
      context
    );
    
    const validationResult: ValidationResult = {
      id: validationId,
      responseId: claudeResponse.id,
      overallScore,
      confidence: this.calculateValidationConfidence(
        { legalAccuracy, relevance, completeness, actionability, consistency },
        context
      ),
      validationTimestamp: new Date(),
      qualityMetrics: { legalAccuracy, relevance, completeness, actionability, consistency },
      detailedAnalysis,
      flaggedIssues,
      recommendedActions,
      complianceChecks
    };
    
    this.validationHistory.push(validationResult);
    return validationResult;
  }

  /**
   * Assess legal accuracy of response
   */
  private async assessLegalAccuracy(content: string, context: ValidationContext): Promise<QualityScore> {
    const factors = [];
    let score = 0.7; // Base score
    
    // Check for legal concepts appropriate to jurisdiction
    const ukLegalTerms = ['common law', 'statute', 'case law', 'precedent', 'barrister', 'solicitor'];
    const foundUKTerms = ukLegalTerms.filter(term => content.toLowerCase().includes(term)).length;
    if (foundUKTerms > 0) {
      score += 0.1;
      factors.push(`UK legal terminology present (${foundUKTerms} terms)`);
    }
    
    // Check for appropriate legal reasoning patterns
    const reasoningPatterns = ['therefore', 'however', 'furthermore', 'given that', 'in light of'];
    const foundReasoningTerms = reasoningPatterns.filter(pattern => content.toLowerCase().includes(pattern)).length;
    if (foundReasoningTerms > 2) {
      score += 0.05;
      factors.push('Logical legal reasoning structure');
    }
    
    // Check for appropriate qualifications/hedging
    const qualifications = ['may', 'might', 'could', 'potentially', 'depending on', 'subject to'];
    const qualificationCount = qualifications.filter(qual => content.toLowerCase().includes(qual)).length;
    if (qualificationCount > 2) {
      score += 0.05;
      factors.push('Appropriate legal qualifications and hedging');
    } else if (qualificationCount === 0) {
      score -= 0.1;
      factors.push('Lacks appropriate legal caution/qualifications');
    }
    
    // Check for citation or reference to legal standards
    if (content.includes('precedent') || content.includes('case law') || content.includes('authority')) {
      score += 0.05;
      factors.push('References to legal authorities');
    }
    
    // Check for overly definitive statements (potential accuracy risk)
    const definitiveTerms = ['definitely', 'certainly', 'without doubt', 'guaranteed', 'absolutely'];
    const definitiveCount = definitiveTerms.filter(term => content.toLowerCase().includes(term)).length;
    if (definitiveCount > 2) {
      score -= 0.1;
      factors.push('Warning: Overly definitive statements for legal advice');
    }
    
    const improvementAreas = [];
    if (foundUKTerms === 0) improvementAreas.push('Include more jurisdiction-specific terminology');
    if (qualificationCount === 0) improvementAreas.push('Add appropriate legal qualifications');
    if (definitiveCount > 2) improvementAreas.push('Reduce overly definitive language');
    
    return {
      score: Math.max(0.3, Math.min(1.0, score)),
      rationale: 'Legal accuracy assessment based on terminology, reasoning, and appropriate qualifications',
      contributingFactors: factors,
      improvementAreas
    };
  }

  /**
   * Assess relevance to consultation context
   */
  private async assessRelevance(content: string, context: ValidationContext): Promise<QualityScore> {
    const factors = [];
    let score = 0.6;
    
    // Check relevance to case dispute nature
    const disputeNature = context.consultationPattern.synthesis.disputeCharacterization.toLowerCase();
    if (content.toLowerCase().includes(disputeNature)) {
      score += 0.15;
      factors.push('Addresses specific dispute nature');
    }
    
    // Check relevance to identified risk factors
    const riskFactors = context.consultationPattern.synthesis.keyRiskFactors;
    const addressedRisks = riskFactors.filter(risk => 
      content.toLowerCase().includes(risk.toLowerCase().split(' ')[0])
    ).length;
    if (addressedRisks > 0) {
      score += Math.min(0.15, addressedRisks * 0.05);
      factors.push(`Addresses ${addressedRisks} identified risk factors`);
    }
    
    // Check relevance to priority areas
    const priorityAreas = context.session.sessionContext.priorityAreas;
    const addressedPriorities = priorityAreas.filter(area => 
      content.toLowerCase().includes(area.toLowerCase())
    ).length;
    if (addressedPriorities > 0) {
      score += Math.min(0.1, addressedPriorities * 0.05);
      factors.push(`Addresses ${addressedPriorities} priority areas`);
    }
    
    // Check for case complexity appropriate response
    const complexityScore = context.consultationPattern.synthesis.caseComplexityScore;
    if (complexityScore > 0.7 && content.length > 1000) {
      score += 0.05;
      factors.push('Appropriately detailed response for complex case');
    } else if (complexityScore < 0.4 && content.length < 800) {
      score += 0.05;
      factors.push('Appropriately concise response for simple case');
    }
    
    // Check for session goal alignment
    const sessionGoals = context.session.sessionContext.sessionGoals;
    const goalAlignment = sessionGoals.filter(goal => 
      content.toLowerCase().includes(goal.toLowerCase().split(' ')[0])
    ).length;
    if (goalAlignment > 0) {
      score += Math.min(0.1, goalAlignment * 0.05);
      factors.push(`Aligns with ${goalAlignment} session goals`);
    }
    
    const improvementAreas = [];
    if (addressedRisks === 0) improvementAreas.push('Address identified risk factors more directly');
    if (addressedPriorities === 0) improvementAreas.push('Focus more on stated priority areas');
    if (goalAlignment === 0) improvementAreas.push('Better alignment with session goals');
    
    return {
      score: Math.max(0.2, Math.min(1.0, score)),
      rationale: 'Relevance assessment based on context alignment and priority addressing',
      contributingFactors: factors,
      improvementAreas
    };
  }

  /**
   * Assess completeness of response
   */
  private async assessCompleteness(
    content: string, 
    context: ValidationContext, 
    criteria: ValidationCriteria
  ): Promise<QualityScore> {
    const factors = [];
    let score = 0.5;
    
    const requiredElements = criteria.completeness.requiredElements;
    const foundElements = requiredElements.filter(element => 
      content.toLowerCase().includes(element.toLowerCase())
    );
    
    const completionRatio = foundElements.length / requiredElements.length;
    score += completionRatio * 0.4;
    factors.push(`Contains ${foundElements.length}/${requiredElements.length} required elements`);
    
    // Check for strategic analysis sections
    const strategicSections = ['strategy', 'approach', 'recommendations', 'analysis'];
    const foundStrategicSections = strategicSections.filter(section => 
      content.toLowerCase().includes(section)
    ).length;
    if (foundStrategicSections >= 3) {
      score += 0.1;
      factors.push('Contains comprehensive strategic analysis sections');
    }
    
    // Check for implementation guidance
    const implementationTerms = ['steps', 'timeline', 'implement', 'execute', 'action'];
    const foundImplementationTerms = implementationTerms.filter(term => 
      content.toLowerCase().includes(term)
    ).length;
    if (foundImplementationTerms >= 2) {
      score += 0.1;
      factors.push('Contains implementation guidance');
    }
    
    // Check for risk consideration
    const riskTerms = ['risk', 'challenge', 'concern', 'threat', 'issue'];
    const foundRiskTerms = riskTerms.filter(term => 
      content.toLowerCase().includes(term)
    ).length;
    if (foundRiskTerms >= 2) {
      score += 0.05;
      factors.push('Contains risk considerations');
    }
    
    // Check response length appropriateness
    const wordCount = content.split(' ').length;
    if (context.consultationPattern.synthesis.caseComplexityScore > 0.7) {
      if (wordCount > 800) {
        score += 0.05;
        factors.push('Appropriately detailed for complex case');
      } else {
        factors.push('May be too brief for case complexity');
      }
    }
    
    const missingElements = requiredElements.filter(element => !foundElements.includes(element));
    const improvementAreas = missingElements.map(element => `Include ${element}`);
    if (foundImplementationTerms < 2) improvementAreas.push('Add more implementation guidance');
    if (foundRiskTerms < 2) improvementAreas.push('Include more risk analysis');
    
    return {
      score: Math.max(0.2, Math.min(1.0, score)),
      rationale: 'Completeness assessment based on required elements and comprehensive coverage',
      contributingFactors: factors,
      improvementAreas
    };
  }

  /**
   * Assess actionability of response
   */
  private async assessActionability(content: string, context: ValidationContext): Promise<QualityScore> {
    const factors = [];
    let score = 0.4;
    
    // Check for action words
    const actionWords = ['recommend', 'should', 'must', 'consider', 'implement', 'develop', 'prepare', 'conduct'];
    const actionCount = actionWords.reduce((count, word) => 
      count + (content.toLowerCase().match(new RegExp(`\\b${word}\\b`, 'g')) || []).length, 0
    );
    
    if (actionCount > 5) {
      score += 0.2;
      factors.push(`High actionability: ${actionCount} action terms`);
    } else if (actionCount > 2) {
      score += 0.1;
      factors.push(`Moderate actionability: ${actionCount} action terms`);
    }
    
    // Check for specific timelines
    const timelinePattern = /\b(immediate|within|by|next\s+\w+|days?|weeks?|months?)\b/gi;
    const timelineMatches = content.match(timelinePattern) || [];
    if (timelineMatches.length > 3) {
      score += 0.15;
      factors.push(`Specific timelines provided: ${timelineMatches.length} references`);
    }
    
    // Check for numbered steps or structured guidance
    const numberedSteps = content.match(/\d+\./g) || [];
    if (numberedSteps.length > 3) {
      score += 0.15;
      factors.push(`Structured action steps: ${numberedSteps.length} numbered items`);
    }
    
    // Check for resource specifications
    const resourceTerms = ['expert', 'specialist', 'budget', 'cost', 'resource', 'team'];
    const resourceCount = resourceTerms.filter(term => 
      content.toLowerCase().includes(term)
    ).length;
    if (resourceCount > 2) {
      score += 0.1;
      factors.push('Includes resource considerations');
    }
    
    // Check for priority indicators
    const priorityTerms = ['priority', 'urgent', 'critical', 'immediate', 'first', 'primary'];
    const priorityCount = priorityTerms.filter(term => 
      content.toLowerCase().includes(term)
    ).length;
    if (priorityCount > 2) {
      score += 0.05;
      factors.push('Includes priority guidance');
    }
    
    const improvementAreas = [];
    if (actionCount < 3) improvementAreas.push('Include more specific action recommendations');
    if (timelineMatches.length < 2) improvementAreas.push('Add specific timelines');
    if (numberedSteps.length < 2) improvementAreas.push('Structure recommendations as numbered steps');
    if (resourceCount < 2) improvementAreas.push('Include resource requirements');
    
    return {
      score: Math.max(0.2, Math.min(1.0, score)),
      rationale: 'Actionability assessment based on specific recommendations, timelines, and structure',
      contributingFactors: factors,
      improvementAreas
    };
  }

  /**
   * Assess consistency with session history
   */
  private async assessConsistency(content: string, context: ValidationContext): Promise<QualityScore> {
    const factors = [];
    let score = 0.8; // Assume consistent unless proven otherwise
    
    if (context.session.consultationRounds.length <= 1) {
      return {
        score: 0.9,
        rationale: 'First consultation round - no consistency issues possible',
        contributingFactors: ['Initial consultation round'],
        improvementAreas: []
      };
    }
    
    // Check for contradictions with previous rounds
    const previousContent = context.session.consultationRounds
      .slice(0, -1)
      .map(round => round.response)
      .join(' ').toLowerCase();
    
    // Look for strategic consistency
    const currentStrategicTerms = this.extractStrategicTerms(content);
    const previousStrategicTerms = this.extractStrategicTerms(previousContent);
    
    const strategicOverlap = currentStrategicTerms.filter(term => 
      previousStrategicTerms.includes(term)
    ).length;
    
    if (strategicOverlap > 0) {
      score += 0.05;
      factors.push(`Strategic consistency: ${strategicOverlap} overlapping strategic concepts`);
    }
    
    // Check for contradictory recommendations
    const contradictoryPairs = [
      ['settle', 'litigate'],
      ['aggressive', 'conservative'],
      ['urgent', 'delay'],
      ['simple', 'complex']
    ];
    
    let contradictions = 0;
    contradictoryPairs.forEach(([term1, term2]) => {
      if (content.toLowerCase().includes(term1) && previousContent.includes(term2)) {
        contradictions++;
      }
    });
    
    if (contradictions > 0) {
      score -= contradictions * 0.15;
      factors.push(`Warning: ${contradictions} potential contradictions with previous advice`);
    }
    
    // Check for building on previous insights
    const previousInsights = context.session.insights.map(insight => 
      insight.insight.toLowerCase().split(' ')[0]
    );
    const buildingCount = previousInsights.filter(insight => 
      content.toLowerCase().includes(insight)
    ).length;
    
    if (buildingCount > 0) {
      score += 0.05;
      factors.push(`Builds on ${buildingCount} previous insights`);
    }
    
    const improvementAreas = [];
    if (contradictions > 0) improvementAreas.push('Resolve contradictions with previous recommendations');
    if (buildingCount === 0 && context.session.insights.length > 0) {
      improvementAreas.push('Better integration with previous insights');
    }
    
    return {
      score: Math.max(0.3, Math.min(1.0, score)),
      rationale: 'Consistency assessment based on alignment with previous consultation rounds',
      contributingFactors: factors,
      improvementAreas
    };
  }

  /**
   * Extract strategic terms for consistency analysis
   */
  private extractStrategicTerms(content: string): string[] {
    const strategicTerms = [
      'settlement', 'litigation', 'negotiation', 'mediation', 'arbitration',
      'aggressive', 'conservative', 'moderate', 'collaborative',
      'evidence', 'witness', 'expert', 'documentation',
      'risk', 'opportunity', 'strength', 'weakness'
    ];
    
    return strategicTerms.filter(term => content.toLowerCase().includes(term));
  }

  /**
   * Calculate overall validation score
   */
  private calculateOverallScore(
    qualityScores: { [key: string]: QualityScore },
    criteria: ValidationCriteria
  ): number {
    const weights = {
      legalAccuracy: criteria.legalAccuracy.weight,
      relevance: criteria.relevance.weight,
      completeness: criteria.completeness.weight,
      actionability: criteria.actionability.weight,
      consistency: criteria.consistency.weight
    };
    
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    
    let weightedScore = 0;
    Object.entries(qualityScores).forEach(([key, score]) => {
      weightedScore += score.score * weights[key];
    });
    
    return weightedScore / totalWeight;
  }

  /**
   * Detect validation issues
   */
  private async detectIssues(
    content: string,
    context: ValidationContext,
    qualityScores: { [key: string]: QualityScore }
  ): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    
    // Critical accuracy issues
    if (qualityScores.legalAccuracy.score < 0.6) {
      issues.push({
        id: `issue_accuracy_${Date.now()}`,
        type: 'accuracy',
        severity: 'critical',
        description: 'Legal accuracy below acceptable threshold',
        location: 'Throughout response',
        suggestedFix: 'Review legal terminology and add appropriate qualifications',
        impact: 'Could provide misleading legal guidance'
      });
    }
    
    // Relevance issues
    if (qualityScores.relevance.score < 0.5) {
      issues.push({
        id: `issue_relevance_${Date.now()}`,
        type: 'relevance',
        severity: 'major',
        description: 'Response not sufficiently relevant to consultation context',
        location: 'Overall response structure',
        suggestedFix: 'Better address case-specific factors and priorities',
        impact: 'May not provide useful guidance for specific case'
      });
    }
    
    // Completeness issues
    if (qualityScores.completeness.score < 0.6) {
      issues.push({
        id: `issue_completeness_${Date.now()}`,
        type: 'completeness',
        severity: 'major',
        description: 'Response missing key required elements',
        location: 'Missing sections',
        suggestedFix: 'Include all required strategic analysis components',
        impact: 'Incomplete guidance may lead to strategic gaps'
      });
    }
    
    // Consistency issues
    if (qualityScores.consistency.score < 0.7) {
      issues.push({
        id: `issue_consistency_${Date.now()}`,
        type: 'consistency',
        severity: 'major',
        description: 'Inconsistency with previous consultation rounds',
        location: 'Contradictory recommendations',
        suggestedFix: 'Align with previous strategic guidance or explain changes',
        impact: 'Could confuse strategic direction'
      });
    }
    
    // Check for ethical concerns
    const ethicalFlags = ['guarantee', 'certain outcome', 'definitely win', 'no risk'];
    const ethicalIssues = ethicalFlags.filter(flag => content.toLowerCase().includes(flag));
    if (ethicalIssues.length > 0) {
      issues.push({
        id: `issue_ethical_${Date.now()}`,
        type: 'ethical',
        severity: 'critical',
        description: 'Potentially inappropriate certainty in legal advice',
        location: `References to: ${ethicalIssues.join(', ')}`,
        suggestedFix: 'Replace with appropriately qualified language',
        impact: 'Could violate professional conduct standards'
      });
    }
    
    // Check for inappropriate risk advice
    if (context.riskTolerance === 'conservative' && content.toLowerCase().includes('aggressive')) {
      issues.push({
        id: `issue_risk_${Date.now()}`,
        type: 'risk',
        severity: 'minor',
        description: 'Aggressive recommendations for conservative risk tolerance',
        location: 'Strategic recommendations',
        suggestedFix: 'Adjust recommendations to match risk tolerance',
        impact: 'May not align with client preferences'
      });
    }
    
    return issues;
  }

  /**
   * Generate recommended actions for improvement
   */
  private generateRecommendedActions(
    qualityScores: { [key: string]: QualityScore },
    issues: ValidationIssue[],
    context: ValidationContext
  ): RecommendedAction[] {
    const actions: RecommendedAction[] = [];
    
    // Address critical issues first
    const criticalIssues = issues.filter(issue => issue.severity === 'critical');
    criticalIssues.forEach(issue => {
      actions.push({
        type: 'modify',
        priority: 'immediate',
        description: issue.suggestedFix,
        expectedImprovement: 0.3
      });
    });
    
    // Address major issues
    const majorIssues = issues.filter(issue => issue.severity === 'major');
    majorIssues.forEach(issue => {
      actions.push({
        type: 'expand',
        priority: 'high',
        description: issue.suggestedFix,
        expectedImprovement: 0.2
      });
    });
    
    // Improvement suggestions based on scores
    if (qualityScores.actionability.score < 0.7) {
      actions.push({
        type: 'supplement',
        priority: 'medium',
        description: 'Add more specific action items with timelines',
        expectedImprovement: 0.15
      });
    }
    
    if (qualityScores.completeness.score < 0.8) {
      actions.push({
        type: 'expand',
        priority: 'medium',
        description: 'Include missing strategic analysis elements',
        expectedImprovement: 0.1
      });
    }
    
    return actions.sort((a, b) => {
      const priorityOrder = { immediate: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Perform compliance checks
   */
  private async performComplianceChecks(
    content: string,
    context: ValidationContext
  ): Promise<ValidationResult['complianceChecks']> {
    return {
      legalEthics: await this.checkLegalEthics(content),
      professionalStandards: await this.checkProfessionalStandards(content, context),
      riskAppropriate: await this.checkRiskAppropriateness(content, context),
      clientInterest: await this.checkClientInterest(content, context)
    };
  }

  private async checkLegalEthics(content: string): Promise<ComplianceResult> {
    const issues = [];
    const recommendations = [];
    
    // Check for inappropriate certainty
    const certaintyFlags = ['guarantee', 'certain outcome', 'definitely win', 'no chance of losing'];
    const foundFlags = certaintyFlags.filter(flag => content.toLowerCase().includes(flag));
    if (foundFlags.length > 0) {
      issues.push('Inappropriate certainty in legal outcomes');
      recommendations.push('Use appropriately qualified language');
    }
    
    // Check for appropriate disclaimers
    const hasQualifications = ['may', 'might', 'could', 'potentially', 'subject to'].some(qual => 
      content.toLowerCase().includes(qual)
    );
    if (!hasQualifications) {
      issues.push('Lacks appropriate legal qualifications');
      recommendations.push('Add qualifying language to legal advice');
    }
    
    return {
      compliant: issues.length === 0,
      confidence: issues.length === 0 ? 0.9 : Math.max(0.3, 0.9 - (issues.length * 0.2)),
      issues,
      recommendations
    };
  }

  private async checkProfessionalStandards(content: string, context: ValidationContext): Promise<ComplianceResult> {
    const issues = [];
    const recommendations = [];
    
    // Check for appropriate professional tone
    const informalTerms = ['gonna', 'wanna', 'kinda', 'sorta'];
    const foundInformalTerms = informalTerms.filter(term => content.toLowerCase().includes(term));
    if (foundInformalTerms.length > 0) {
      issues.push('Informal language inappropriate for professional legal advice');
      recommendations.push('Use formal, professional language throughout');
    }
    
    // Check for comprehensive analysis approach
    if (content.length < 500 && context.consultationPattern.synthesis.caseComplexityScore > 0.6) {
      issues.push('Analysis may be too brief for case complexity');
      recommendations.push('Provide more comprehensive analysis for complex cases');
    }
    
    return {
      compliant: issues.length === 0,
      confidence: 0.85,
      issues,
      recommendations
    };
  }

  private async checkRiskAppropriateness(content: string, context: ValidationContext): Promise<ComplianceResult> {
    const issues = [];
    const recommendations = [];
    
    const riskTolerance = context.riskTolerance;
    const contentLower = content.toLowerCase();
    
    if (riskTolerance === 'conservative') {
      if (contentLower.includes('aggressive') || contentLower.includes('high-risk')) {
        issues.push('Aggressive recommendations for conservative risk tolerance');
        recommendations.push('Adjust recommendations to match conservative approach');
      }
    } else if (riskTolerance === 'aggressive') {
      if (contentLower.includes('conservative') && !contentLower.includes('consider conservative')) {
        issues.push('Conservative recommendations may not match aggressive risk tolerance');
        recommendations.push('Consider more assertive strategic options');
      }
    }
    
    return {
      compliant: issues.length === 0,
      confidence: 0.8,
      issues,
      recommendations
    };
  }

  private async checkClientInterest(content: string, context: ValidationContext): Promise<ComplianceResult> {
    const issues = [];
    const recommendations = [];
    
    // Check for balanced consideration of options
    const hasSettlementConsideration = content.toLowerCase().includes('settlement');
    const hasLitigationConsideration = content.toLowerCase().includes('litigation') || content.toLowerCase().includes('trial');
    
    if (!hasSettlementConsideration && !hasLitigationConsideration) {
      issues.push('Does not consider both settlement and litigation options');
      recommendations.push('Provide balanced analysis of available options');
    }
    
    // Check for cost considerations
    const hasCostConsideration = ['cost', 'expense', 'budget', 'financial'].some(term => 
      content.toLowerCase().includes(term)
    );
    if (!hasCostConsideration && context.consultationPattern.synthesis.caseComplexityScore > 0.5) {
      issues.push('Missing cost considerations for strategic decisions');
      recommendations.push('Include cost-benefit analysis in recommendations');
    }
    
    return {
      compliant: issues.length === 0,
      confidence: 0.85,
      issues,
      recommendations
    };
  }

  /**
   * Generate detailed analysis summary
   */
  private generateDetailedAnalysis(
    qualityScores: { [key: string]: QualityScore },
    issues: ValidationIssue[],
    context: ValidationContext
  ): ValidationResult['detailedAnalysis'] {
    const strengths = [];
    const weaknesses = [];
    const missingElements = [];
    const inconsistencies = [];
    const improvementSuggestions = [];
    
    // Identify strengths
    Object.entries(qualityScores).forEach(([category, score]) => {
      if (score.score > 0.8) {
        strengths.push(`Strong ${category}: ${score.rationale}`);
      }
      strengths.push(...score.contributingFactors.filter(factor => !factor.includes('Warning')));
    });
    
    // Identify weaknesses
    Object.entries(qualityScores).forEach(([category, score]) => {
      if (score.score < 0.6) {
        weaknesses.push(`Weak ${category}: ${score.rationale}`);
      }
      score.contributingFactors.forEach(factor => {
        if (factor.includes('Warning') || factor.includes('may be')) {
          weaknesses.push(factor);
        }
      });
    });
    
    // Extract missing elements
    Object.values(qualityScores).forEach(score => {
      missingElements.push(...score.improvementAreas);
    });
    
    // Extract inconsistencies
    const consistencyIssues = issues.filter(issue => issue.type === 'consistency');
    inconsistencies.push(...consistencyIssues.map(issue => issue.description));
    
    // Generate improvement suggestions
    Object.values(qualityScores).forEach(score => {
      improvementSuggestions.push(...score.improvementAreas);
    });
    
    issues.forEach(issue => {
      if (!improvementSuggestions.includes(issue.suggestedFix)) {
        improvementSuggestions.push(issue.suggestedFix);
      }
    });
    
    return {
      strengths: [...new Set(strengths)],
      weaknesses: [...new Set(weaknesses)],
      missingElements: [...new Set(missingElements)],
      inconsistencies: [...new Set(inconsistencies)],
      improvementSuggestions: [...new Set(improvementSuggestions)]
    };
  }

  /**
   * Build validation criteria based on context
   */
  private buildValidationCriteria(
    context: ValidationContext,
    customCriteria?: Partial<ValidationCriteria>
  ): ValidationCriteria {
    const defaultCriteria: ValidationCriteria = {
      legalAccuracy: {
        weight: 0.3,
        checks: ['terminology', 'reasoning', 'qualifications']
      },
      relevance: {
        weight: 0.25,
        contextFactors: ['dispute_nature', 'risk_factors', 'priorities']
      },
      completeness: {
        weight: 0.2,
        requiredElements: ['strategy', 'risk', 'implementation', 'timeline']
      },
      actionability: {
        weight: 0.15,
        actionIndicators: ['recommendations', 'steps', 'timelines']
      },
      consistency: {
        weight: 0.1,
        sessionHistory: true
      }
    };
    
    return { ...defaultCriteria, ...customCriteria };
  }

  /**
   * Calculate validation confidence
   */
  private calculateValidationConfidence(
    qualityScores: { [key: string]: QualityScore },
    context: ValidationContext
  ): number {
    // Base confidence on score consistency and context completeness
    const scoreVariance = this.calculateScoreVariance(Object.values(qualityScores).map(s => s.score));
    const contextCompleteness = context.session.consultationRounds.length / 5; // Assume 5 rounds is complete
    
    let confidence = 0.8;
    confidence -= scoreVariance * 0.3; // Reduce confidence for inconsistent scores
    confidence += Math.min(contextCompleteness, 1) * 0.1; // Boost for more complete context
    
    return Math.max(0.3, Math.min(0.95, confidence));
  }

  private calculateScoreVariance(scores: number[]): number {
    if (scores.length === 0) return 0;
    
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    
    return Math.sqrt(variance);
  }

  // Initialize knowledge bases
  private initializeLegalKnowledgeBase(): void {
    // UK legal system knowledge
    this.legalKnowledgeBase.set('uk_legal_terms', [
      'common law', 'statute', 'case law', 'precedent', 'barrister', 'solicitor',
      'chambers', 'brief', 'pleadings', 'disclosure', 'bundle', 'skeleton argument'
    ]);
    
    this.legalKnowledgeBase.set('professional_standards', [
      'appropriate qualifications', 'client interests', 'professional competence',
      'confidentiality', 'independence', 'integrity'
    ]);
    
    this.legalKnowledgeBase.set('risk_indicators', [
      'limitation periods', 'jurisdictional issues', 'evidence availability',
      'witness credibility', 'expert evidence requirements', 'costs implications'
    ]);
  }

  private initializeValidationRules(): void {
    this.validationRules.set('accuracy_thresholds', {
      critical: 0.9,
      acceptable: 0.7,
      concerning: 0.5
    });
    
    this.validationRules.set('completeness_requirements', {
      strategy: 'required',
      risk_assessment: 'required',
      implementation: 'recommended',
      timeline: 'recommended',
      alternatives: 'optional'
    });
  }

  /**
   * Get validation history for analysis
   */
  getValidationHistory(): ValidationResult[] {
    return this.validationHistory;
  }

  /**
   * Get validation statistics
   */
  getValidationStatistics(): {
    totalValidations: number;
    averageScore: number;
    commonIssues: { type: string; count: number }[];
    improvementTrends: { metric: string; trend: 'improving' | 'declining' | 'stable' }[];
  } {
    const totalValidations = this.validationHistory.length;
    const averageScore = totalValidations > 0 ? 
      this.validationHistory.reduce((sum, v) => sum + v.overallScore, 0) / totalValidations : 0;
    
    // Count issue types
    const issueTypeCounts = new Map<string, number>();
    this.validationHistory.forEach(validation => {
      validation.flaggedIssues.forEach(issue => {
        issueTypeCounts.set(issue.type, (issueTypeCounts.get(issue.type) || 0) + 1);
      });
    });
    
    const commonIssues = Array.from(issueTypeCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
    
    // Simple trend analysis (would be more sophisticated in production)
    const improvementTrends = [
      { metric: 'overall_score', trend: 'stable' as const },
      { metric: 'legal_accuracy', trend: 'stable' as const },
      { metric: 'actionability', trend: 'improving' as const }
    ];
    
    return {
      totalValidations,
      averageScore,
      commonIssues,
      improvementTrends
    };
  }
}

export default AIResponseValidator;