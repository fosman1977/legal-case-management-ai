/**
 * Context-Aware Follow-up System - Phase 3 Advanced AI Integration
 * Intelligent follow-up question generation and conversation flow management
 * Learns from consultation patterns to suggest optimal follow-up paths
 */

import { ConsultationSession, ConsultationRound, SessionInsight } from './AIConsultationManager';
import { ClaudeResponse } from './RealTimeClaudeIntegration';
import { EnhancedConsultationPattern } from './EnhancedPatternGenerator';

export interface FollowUpSuggestion {
  id: string;
  type: 'clarification' | 'deep_dive' | 'implementation' | 'alternative_scenario' | 'risk_exploration' | 'strategic_pivot';
  priority: 'critical' | 'high' | 'medium' | 'low';
  question: string;
  rationale: string;
  expectedInsights: string[];
  estimatedValue: number; // 0-1 score of potential value
  complexity: 'basic' | 'intermediate' | 'advanced';
  resourceImplications: {
    timeRequired: string;
    expertiseNeeded: string[];
    costImplications: 'low' | 'medium' | 'high';
  };
  triggeredBy: {
    roundId: string;
    insight: string;
    responsePattern: string;
  };
}

export interface ConversationFlow {
  currentStage: 'opening' | 'exploration' | 'analysis' | 'synthesis' | 'conclusion';
  completionScore: number; // 0-1 how complete the consultation feels
  coverageAreas: {
    strategy: number;
    risk: number;
    evidence: number;
    settlement: number;
    implementation: number;
  };
  recommendedNextSteps: string[];
  conversationHealth: {
    coherence: number; // How well responses build on each other
    depth: number; // How deep the analysis has gone
    breadth: number; // How many areas have been covered
    actionability: number; // How actionable the advice has been
  };
}

export interface ResponseAnalysis {
  id: string;
  roundId: string;
  content: string;
  analysisResults: {
    sentiment: 'confident' | 'uncertain' | 'analytical' | 'cautious';
    depth: 'surface' | 'moderate' | 'deep' | 'comprehensive';
    actionability: 'low' | 'medium' | 'high' | 'very_high';
    specificity: 'vague' | 'general' | 'specific' | 'detailed';
    completeness: 'partial' | 'adequate' | 'thorough' | 'comprehensive';
  };
  keyThemes: string[];
  identifiedGaps: string[];
  suggestedFollowUps: string[];
  riskIndicators: string[];
  opportunityMarkers: string[];
  confidenceMarkers: string[];
  uncertaintyAreas: string[];
}

export interface ConversationContext {
  session: ConsultationSession;
  consultationPattern: EnhancedConsultationPattern;
  currentFlow: ConversationFlow;
  responseHistory: ResponseAnalysis[];
  learningPoints: LearningPoint[];
  contextualMemory: ContextualMemory;
}

export interface LearningPoint {
  id: string;
  type: 'pattern_recognition' | 'effective_question' | 'strategic_insight' | 'process_optimization';
  description: string;
  confidence: number;
  applicability: {
    caseTypes: string[];
    consultationStages: string[];
    complexityLevels: number[];
  };
  effectiveness: number; // How well this approach worked
  timestamp: Date;
}

export interface ContextualMemory {
  keyDecisions: { decision: string; reasoning: string; round: number }[];
  strategicThemes: { theme: string; frequency: number; importance: number }[];
  clientPreferences: { preference: string; strength: number }[];
  effectiveApproaches: { approach: string; success: number }[];
  avoidedPitfalls: { pitfall: string; prevention: string }[];
}

/**
 * Context-Aware Follow-up System - Manages intelligent conversation flow
 */
export class ContextAwareFollowUpSystem {
  private conversationContexts: Map<string, ConversationContext> = new Map();
  private learningDatabase: LearningPoint[] = [];
  private responsePatterns: Map<string, any> = new Map();
  
  constructor() {
    this.initializeResponsePatterns();
  }

  /**
   * Analyze Claude response and generate follow-up suggestions
   */
  async analyzeResponseAndGenerateFollowUps(
    sessionId: string,
    roundId: string,
    claudeResponse: ClaudeResponse,
    session: ConsultationSession
  ): Promise<FollowUpSuggestion[]> {
    
    // Get or create conversation context
    const context = this.getOrCreateContext(sessionId, session);
    
    // Analyze the response
    const responseAnalysis = await this.analyzeResponse(roundId, claudeResponse.content, context);
    context.responseHistory.push(responseAnalysis);
    
    // Update conversation flow
    context.currentFlow = this.updateConversationFlow(context, responseAnalysis);
    
    // Generate follow-up suggestions
    const followUpSuggestions = this.generateFollowUpSuggestions(context, responseAnalysis);
    
    // Learn from patterns
    this.updateLearning(context, responseAnalysis, followUpSuggestions);
    
    // Update context
    this.conversationContexts.set(sessionId, context);
    
    return followUpSuggestions.sort((a, b) => b.estimatedValue - a.estimatedValue).slice(0, 5);
  }

  /**
   * Get or create conversation context
   */
  private getOrCreateContext(sessionId: string, session: ConsultationSession): ConversationContext {
    let context = this.conversationContexts.get(sessionId);
    
    if (!context) {
      context = {
        session,
        consultationPattern: session.sessionContext.consultationPattern,
        currentFlow: {
          currentStage: 'opening',
          completionScore: 0.1,
          coverageAreas: {
            strategy: 0,
            risk: 0,
            evidence: 0,
            settlement: 0,
            implementation: 0
          },
          recommendedNextSteps: [],
          conversationHealth: {
            coherence: 0.8,
            depth: 0.2,
            breadth: 0.1,
            actionability: 0.3
          }
        },
        responseHistory: [],
        learningPoints: [],
        contextualMemory: {
          keyDecisions: [],
          strategicThemes: [],
          clientPreferences: [],
          effectiveApproaches: [],
          avoidedPitfalls: []
        }
      };
      
      this.conversationContexts.set(sessionId, context);
    }
    
    return context;
  }

  /**
   * Analyze Claude response content
   */
  private async analyzeResponse(roundId: string, content: string, context: ConversationContext): Promise<ResponseAnalysis> {
    const analysis: ResponseAnalysis = {
      id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      roundId,
      content,
      analysisResults: {
        sentiment: this.analyzeSentiment(content),
        depth: this.analyzeDepth(content),
        actionability: this.analyzeActionability(content),
        specificity: this.analyzeSpecificity(content),
        completeness: this.analyzeCompleteness(content, context)
      },
      keyThemes: this.extractKeyThemes(content),
      identifiedGaps: this.identifyGaps(content, context),
      suggestedFollowUps: this.extractSuggestedFollowUps(content),
      riskIndicators: this.identifyRiskIndicators(content),
      opportunityMarkers: this.identifyOpportunityMarkers(content),
      confidenceMarkers: this.identifyConfidenceMarkers(content),
      uncertaintyAreas: this.identifyUncertaintyAreas(content)
    };

    return analysis;
  }

  /**
   * Analyze response sentiment/tone
   */
  private analyzeSentiment(content: string): ResponseAnalysis['analysisResults']['sentiment'] {
    const contentLower = content.toLowerCase();
    
    if (contentLower.includes('recommend') && contentLower.includes('strongly')) return 'confident';
    if (contentLower.includes('uncertain') || contentLower.includes('unclear') || contentLower.includes('depends')) return 'uncertain';
    if (contentLower.includes('careful') || contentLower.includes('cautious') || contentLower.includes('risk')) return 'cautious';
    return 'analytical';
  }

  /**
   * Analyze depth of response
   */
  private analyzeDepth(content: string): ResponseAnalysis['analysisResults']['depth'] {
    const wordCount = content.split(' ').length;
    const sectionCount = (content.match(/##/g) || []).length;
    const detailLevel = (content.match(/\d+\./g) || []).length;
    
    if (wordCount > 1500 && sectionCount > 4 && detailLevel > 8) return 'comprehensive';
    if (wordCount > 800 && sectionCount > 2 && detailLevel > 4) return 'deep';
    if (wordCount > 400 && sectionCount > 1) return 'moderate';
    return 'surface';
  }

  /**
   * Analyze actionability of response
   */
  private analyzeActionability(content: string): ResponseAnalysis['analysisResults']['actionability'] {
    const actionWords = ['should', 'recommend', 'must', 'need to', 'consider', 'implement', 'develop'];
    const actionCount = actionWords.reduce((count, word) => 
      count + (content.toLowerCase().match(new RegExp(word, 'g')) || []).length, 0);
    
    const timeReferences = ['immediate', 'next week', 'within', 'by', 'days', 'weeks'].reduce((count, ref) => 
      count + (content.toLowerCase().includes(ref) ? 1 : 0), 0);
    
    if (actionCount > 8 && timeReferences > 2) return 'very_high';
    if (actionCount > 5 && timeReferences > 1) return 'high';
    if (actionCount > 3) return 'medium';
    return 'low';
  }

  /**
   * Analyze specificity of response
   */
  private analyzeSpecificity(content: string): ResponseAnalysis['analysisResults']['specificity'] {
    const specificMarkers = ['£', '%', 'days', 'weeks', 'months', 'specific', 'exactly', 'precisely'];
    const specificCount = specificMarkers.reduce((count, marker) => 
      count + (content.toLowerCase().includes(marker) ? 1 : 0), 0);
    
    const exampleCount = (content.match(/example|for instance|such as/gi) || []).length;
    
    if (specificCount > 5 && exampleCount > 2) return 'detailed';
    if (specificCount > 3 && exampleCount > 1) return 'specific';
    if (specificCount > 1) return 'general';
    return 'vague';
  }

  /**
   * Analyze completeness relative to context
   */
  private analyzeCompleteness(content: string, context: ConversationContext): ResponseAnalysis['analysisResults']['completeness'] {
    const expectedAreas = ['strategy', 'risk', 'evidence', 'timeline', 'next steps'];
    const coveredAreas = expectedAreas.filter(area => 
      content.toLowerCase().includes(area) || 
      content.toLowerCase().includes(area.replace(' ', ''))
    ).length;
    
    const questionsAsked = context.session.consultationRounds.length;
    const comprehensivenessNeeded = questionsAsked > 1 ? 'high' : 'medium';
    
    if (coveredAreas >= 4 && comprehensivenessNeeded === 'high') return 'comprehensive';
    if (coveredAreas >= 3) return 'thorough';
    if (coveredAreas >= 2) return 'adequate';
    return 'partial';
  }

  /**
   * Extract key themes from response
   */
  private extractKeyThemes(content: string): string[] {
    const themes: string[] = [];
    const contentLower = content.toLowerCase();
    
    const themePatterns = [
      { pattern: /settlement|negotiate|mediation/g, theme: 'Settlement Strategy' },
      { pattern: /risk|danger|vulnerable|threat/g, theme: 'Risk Management' },
      { pattern: /evidence|document|proof|witness/g, theme: 'Evidence Strategy' },
      { pattern: /timeline|chronology|sequence|order/g, theme: 'Timeline Issues' },
      { pattern: /strategy|approach|plan|framework/g, theme: 'Strategic Planning' },
      { pattern: /cost|budget|expense|financial/g, theme: 'Cost Considerations' },
      { pattern: /expert|specialist|professional/g, theme: 'Expert Evidence' },
      { pattern: /court|trial|litigation|judge/g, theme: 'Litigation Planning' }
    ];
    
    themePatterns.forEach(({ pattern, theme }) => {
      if (pattern.test(contentLower)) {
        themes.push(theme);
      }
    });
    
    return themes;
  }

  /**
   * Identify gaps in response coverage
   */
  private identifyGaps(content: string, context: ConversationContext): string[] {
    const gaps: string[] = [];
    const contentLower = content.toLowerCase();
    
    // Check for missing critical areas based on case complexity
    if (context.consultationPattern.synthesis.caseComplexityScore > 0.7) {
      if (!contentLower.includes('expert') && !contentLower.includes('specialist')) {
        gaps.push('Expert evidence requirements not addressed');
      }
    }
    
    if (context.consultationPattern.contradictionPatterns.riskLevel === 'high' || 
        context.consultationPattern.contradictionPatterns.riskLevel === 'critical') {
      if (!contentLower.includes('contingency') && !contentLower.includes('backup')) {
        gaps.push('Contingency planning not discussed');
      }
    }
    
    if (context.session.sessionContext.timeConstraints && 
        !contentLower.includes('urgent') && !contentLower.includes('immediate')) {
      gaps.push('Time constraints not adequately addressed');
    }
    
    // Check consultation coverage areas
    const coverageAreas = context.currentFlow.coverageAreas;
    if (coverageAreas.implementation < 0.3) {
      gaps.push('Implementation details lacking');
    }
    if (coverageAreas.settlement < 0.3 && !contentLower.includes('settlement')) {
      gaps.push('Settlement considerations not explored');
    }
    
    return gaps;
  }

  /**
   * Extract suggested follow-ups from response
   */
  private extractSuggestedFollowUps(content: string): string[] {
    const followUps: string[] = [];
    
    // Look for questions or areas needing clarification
    const questionMatches = content.match(/\?[^?]*$/gm) || [];
    followUps.push(...questionMatches.slice(0, 3));
    
    // Look for "consider" statements
    const considerMatches = content.match(/consider\s+([^.!]+)/gi) || [];
    followUps.push(...considerMatches.slice(0, 3));
    
    // Look for "would benefit from" statements
    const benefitMatches = content.match(/would benefit from\s+([^.!]+)/gi) || [];
    followUps.push(...benefitMatches.slice(0, 2));
    
    return followUps.map(f => f.replace(/consider\s+/gi, '').replace(/would benefit from\s+/gi, '').trim());
  }

  /**
   * Identify risk indicators in response
   */
  private identifyRiskIndicators(content: string): string[] {
    const riskWords = ['concern', 'problem', 'issue', 'challenge', 'difficulty', 'obstacle', 'threat'];
    const risks: string[] = [];
    
    riskWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b[^.!]*[.!]`, 'gi');
      const matches = content.match(regex) || [];
      risks.push(...matches.map(match => match.trim()));
    });
    
    return risks.slice(0, 5);
  }

  /**
   * Identify opportunity markers
   */
  private identifyOpportunityMarkers(content: string): string[] {
    const opportunityWords = ['advantage', 'strength', 'leverage', 'opportunity', 'benefit', 'favorable'];
    const opportunities: string[] = [];
    
    opportunityWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b[^.!]*[.!]`, 'gi');
      const matches = content.match(regex) || [];
      opportunities.push(...matches.map(match => match.trim()));
    });
    
    return opportunities.slice(0, 5);
  }

  /**
   * Identify confidence markers
   */
  private identifyConfidenceMarkers(content: string): string[] {
    const confidenceWords = ['confident', 'certain', 'clear', 'definitely', 'strongly recommend', 'best approach'];
    return confidenceWords.filter(word => content.toLowerCase().includes(word));
  }

  /**
   * Identify uncertainty areas
   */
  private identifyUncertaintyAreas(content: string): string[] {
    const uncertaintyWords = ['uncertain', 'unclear', 'depends', 'might', 'could', 'potentially', 'possibly'];
    const uncertainties: string[] = [];
    
    uncertaintyWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b[^.!]*[.!]`, 'gi');
      const matches = content.match(regex) || [];
      uncertainties.push(...matches.map(match => match.trim()));
    });
    
    return uncertainties.slice(0, 4);
  }

  /**
   * Update conversation flow based on analysis
   */
  private updateConversationFlow(context: ConversationContext, analysis: ResponseAnalysis): ConversationFlow {
    const currentFlow = context.currentFlow;
    const round = context.session.consultationRounds.length;
    
    // Update stage based on round number and depth
    let newStage = currentFlow.currentStage;
    if (round === 1) newStage = 'exploration';
    else if (round > 1 && analysis.analysisResults.depth === 'deep') newStage = 'analysis';
    else if (round > 2 && analysis.analysisResults.actionability === 'high') newStage = 'synthesis';
    else if (round > 3) newStage = 'conclusion';
    
    // Update coverage areas based on themes
    const newCoverageAreas = { ...currentFlow.coverageAreas };
    analysis.keyThemes.forEach(theme => {
      if (theme.includes('Strategy') || theme.includes('Strategic')) newCoverageAreas.strategy += 0.3;
      if (theme.includes('Risk')) newCoverageAreas.risk += 0.3;
      if (theme.includes('Evidence')) newCoverageAreas.evidence += 0.3;
      if (theme.includes('Settlement')) newCoverageAreas.settlement += 0.3;
      if (theme.includes('Implementation') || analysis.analysisResults.actionability === 'high') newCoverageAreas.implementation += 0.2;
    });
    
    // Cap at 1.0
    Object.keys(newCoverageAreas).forEach(key => {
      newCoverageAreas[key] = Math.min(1.0, newCoverageAreas[key]);
    });
    
    // Update completion score
    const avgCoverage = Object.values(newCoverageAreas).reduce((sum, val) => sum + val, 0) / 5;
    const completionScore = Math.min(0.95, avgCoverage * 0.7 + (round / 10) * 0.3);
    
    // Update conversation health
    const newHealth = {
      coherence: this.calculateCoherence(context, analysis),
      depth: Math.max(currentFlow.conversationHealth.depth, this.mapDepthToScore(analysis.analysisResults.depth)),
      breadth: avgCoverage,
      actionability: Math.max(currentFlow.conversationHealth.actionability, this.mapActionabilityToScore(analysis.analysisResults.actionability))
    };
    
    return {
      currentStage: newStage,
      completionScore,
      coverageAreas: newCoverageAreas,
      recommendedNextSteps: this.generateNextSteps(context, analysis),
      conversationHealth: newHealth
    };
  }

  /**
   * Generate follow-up suggestions
   */
  private generateFollowUpSuggestions(context: ConversationContext, analysis: ResponseAnalysis): FollowUpSuggestion[] {
    const suggestions: FollowUpSuggestion[] = [];
    
    // Generate suggestions based on gaps
    analysis.identifiedGaps.forEach(gap => {
      suggestions.push(this.createGapBasedSuggestion(gap, analysis, context));
    });
    
    // Generate suggestions based on uncertainty areas
    analysis.uncertaintyAreas.forEach(uncertainty => {
      suggestions.push(this.createClarificationSuggestion(uncertainty, analysis, context));
    });
    
    // Generate deep dive suggestions for complex areas
    if (context.consultationPattern.synthesis.caseComplexityScore > 0.6) {
      suggestions.push(...this.createDeepDiveSuggestions(analysis, context));
    }
    
    // Generate implementation-focused suggestions
    if (analysis.analysisResults.actionability === 'high' && context.currentFlow.coverageAreas.implementation < 0.7) {
      suggestions.push(this.createImplementationSuggestion(analysis, context));
    }
    
    // Generate risk exploration suggestions
    if (analysis.riskIndicators.length > 2) {
      suggestions.push(this.createRiskExplorationSuggestion(analysis, context));
    }
    
    // Generate strategic pivot suggestions if patterns suggest it
    if (this.shouldSuggestStrategicPivot(context, analysis)) {
      suggestions.push(this.createStrategicPivotSuggestion(analysis, context));
    }
    
    return suggestions.filter(s => s.estimatedValue > 0.3);
  }

  /**
   * Create gap-based suggestion
   */
  private createGapBasedSuggestion(gap: string, analysis: ResponseAnalysis, context: ConversationContext): FollowUpSuggestion {
    return {
      id: `gap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'clarification',
      priority: 'high',
      question: `You mentioned that ${gap.toLowerCase()}. Could you provide specific guidance on how to address this gap?`,
      rationale: `Identified gap in consultation coverage: ${gap}`,
      expectedInsights: ['Specific action items', 'Resource requirements', 'Timeline implications'],
      estimatedValue: 0.8,
      complexity: 'intermediate',
      resourceImplications: {
        timeRequired: '10-15 minutes additional consultation',
        expertiseNeeded: ['Strategic planning'],
        costImplications: 'low'
      },
      triggeredBy: {
        roundId: analysis.roundId,
        insight: gap,
        responsePattern: 'gap_identification'
      }
    };
  }

  /**
   * Create clarification suggestion
   */
  private createClarificationSuggestion(uncertainty: string, analysis: ResponseAnalysis, context: ConversationContext): FollowUpSuggestion {
    return {
      id: `clarify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'clarification',
      priority: 'medium',
      question: `Could you elaborate on: "${uncertainty.substring(0, 100)}..."? What additional information would help clarify this?`,
      rationale: 'Identified area of uncertainty requiring clarification',
      expectedInsights: ['Clearer guidance', 'Specific recommendations', 'Decision criteria'],
      estimatedValue: 0.6,
      complexity: 'basic',
      resourceImplications: {
        timeRequired: '5-10 minutes',
        expertiseNeeded: ['Legal analysis'],
        costImplications: 'low'
      },
      triggeredBy: {
        roundId: analysis.roundId,
        insight: uncertainty,
        responsePattern: 'uncertainty_detection'
      }
    };
  }

  /**
   * Create deep dive suggestions
   */
  private createDeepDiveSuggestions(analysis: ResponseAnalysis, context: ConversationContext): FollowUpSuggestion[] {
    const suggestions: FollowUpSuggestion[] = [];
    
    if (analysis.riskIndicators.length > 0) {
      suggestions.push({
        id: `deep_risk_${Date.now()}`,
        type: 'deep_dive',
        priority: 'high',
        question: 'Can we do a comprehensive deep-dive risk analysis focusing on the critical risk factors you\'ve identified? I need detailed mitigation strategies and contingency planning.',
        rationale: 'Complex case requires detailed risk analysis',
        expectedInsights: ['Detailed risk mitigation strategies', 'Contingency plans', 'Implementation roadmaps'],
        estimatedValue: 0.9,
        complexity: 'advanced',
        resourceImplications: {
          timeRequired: '15-25 minutes',
          expertiseNeeded: ['Risk management', 'Strategic planning'],
          costImplications: 'medium'
        },
        triggeredBy: {
          roundId: analysis.roundId,
          insight: 'Multiple risk indicators detected',
          responsePattern: 'risk_complexity'
        }
      });
    }
    
    return suggestions;
  }

  /**
   * Create implementation suggestion
   */
  private createImplementationSuggestion(analysis: ResponseAnalysis, context: ConversationContext): FollowUpSuggestion {
    return {
      id: `impl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'implementation',
      priority: 'high',
      question: 'Can you provide a detailed implementation roadmap with specific timelines, resource requirements, and milestone checkpoints for executing your recommended strategy?',
      rationale: 'High actionability detected but implementation details needed',
      expectedInsights: ['Detailed implementation plan', 'Resource allocation', 'Timeline milestones'],
      estimatedValue: 0.85,
      complexity: 'intermediate',
      resourceImplications: {
        timeRequired: '10-20 minutes',
        expertiseNeeded: ['Project management', 'Strategic implementation'],
        costImplications: 'medium'
      },
      triggeredBy: {
        roundId: analysis.roundId,
        insight: 'High actionability with implementation gap',
        responsePattern: 'actionable_strategy'
      }
    };
  }

  /**
   * Create risk exploration suggestion
   */
  private createRiskExplorationSuggestion(analysis: ResponseAnalysis, context: ConversationContext): FollowUpSuggestion {
    return {
      id: `risk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'risk_exploration',
      priority: 'medium',
      question: 'You\'ve identified several risk factors. Can you help me prioritize these risks and develop specific mitigation strategies for the top 3 most critical ones?',
      rationale: 'Multiple risk indicators require prioritization and mitigation planning',
      expectedInsights: ['Risk prioritization matrix', 'Specific mitigation strategies', 'Monitoring approaches'],
      estimatedValue: 0.75,
      complexity: 'intermediate',
      resourceImplications: {
        timeRequired: '10-15 minutes',
        expertiseNeeded: ['Risk assessment', 'Strategic planning'],
        costImplications: 'medium'
      },
      triggeredBy: {
        roundId: analysis.roundId,
        insight: `${analysis.riskIndicators.length} risk indicators identified`,
        responsePattern: 'multiple_risks'
      }
    };
  }

  /**
   * Create strategic pivot suggestion
   */
  private createStrategicPivotSuggestion(analysis: ResponseAnalysis, context: ConversationContext): FollowUpSuggestion {
    return {
      id: `pivot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'strategic_pivot',
      priority: 'critical',
      question: 'Based on the insights we\'ve uncovered, should we consider a fundamental shift in our strategic approach? What alternative strategies might be more effective given what we now know?',
      rationale: 'Analysis suggests current strategy may need revision',
      expectedInsights: ['Alternative strategic approaches', 'Pivot analysis', 'Implementation implications'],
      estimatedValue: 0.95,
      complexity: 'advanced',
      resourceImplications: {
        timeRequired: '20-30 minutes',
        expertiseNeeded: ['Strategic planning', 'Change management'],
        costImplications: 'high'
      },
      triggeredBy: {
        roundId: analysis.roundId,
        insight: 'Strategic pivot indicators detected',
        responsePattern: 'strategy_revision'
      }
    };
  }

  /**
   * Determine if strategic pivot should be suggested
   */
  private shouldSuggestStrategicPivot(context: ConversationContext, analysis: ResponseAnalysis): boolean {
    // Suggest pivot if:
    // - Multiple uncertainty areas
    // - Low confidence in current approach
    // - New significant risks discovered
    // - Major gaps in current strategy
    
    const uncertaintyCount = analysis.uncertaintyAreas.length;
    const riskCount = analysis.riskIndicators.length;
    const gapCount = analysis.identifiedGaps.length;
    const round = context.session.consultationRounds.length;
    
    return (uncertaintyCount > 3 && riskCount > 2) || 
           (gapCount > 2 && round > 1) ||
           (analysis.analysisResults.sentiment === 'uncertain' && round > 2);
  }

  // Utility methods for conversation flow
  private calculateCoherence(context: ConversationContext, analysis: ResponseAnalysis): number {
    // Simple coherence calculation based on theme consistency
    if (context.responseHistory.length < 2) return 0.8;
    
    const currentThemes = new Set(analysis.keyThemes);
    const previousThemes = new Set(context.responseHistory[context.responseHistory.length - 2].keyThemes);
    
    const intersection = new Set([...currentThemes].filter(theme => previousThemes.has(theme)));
    const union = new Set([...currentThemes, ...previousThemes]);
    
    return intersection.size / union.size;
  }

  private mapDepthToScore(depth: string): number {
    const depthMap = { surface: 0.2, moderate: 0.5, deep: 0.8, comprehensive: 1.0 };
    return depthMap[depth] || 0.3;
  }

  private mapActionabilityToScore(actionability: string): number {
    const actionMap = { low: 0.2, medium: 0.5, high: 0.8, very_high: 1.0 };
    return actionMap[actionability] || 0.3;
  }

  private generateNextSteps(context: ConversationContext, analysis: ResponseAnalysis): string[] {
    const steps: string[] = [];
    
    // Based on current stage and analysis
    switch (context.currentFlow.currentStage) {
      case 'opening':
        steps.push('Continue exploring key strategic areas');
        break;
      case 'exploration':
        steps.push('Deep dive into identified priority areas');
        break;
      case 'analysis':
        steps.push('Synthesize insights into actionable strategy');
        break;
      case 'synthesis':
        steps.push('Finalize implementation roadmap');
        break;
      case 'conclusion':
        steps.push('Review and confirm strategic approach');
        break;
    }
    
    // Add specific steps based on gaps
    if (analysis.identifiedGaps.length > 0) {
      steps.push('Address identified consultation gaps');
    }
    
    return steps;
  }

  /**
   * Update learning from consultation patterns
   */
  private updateLearning(
    context: ConversationContext, 
    analysis: ResponseAnalysis, 
    suggestions: FollowUpSuggestion[]
  ): void {
    // Learn from effective question patterns
    if (analysis.analysisResults.depth === 'comprehensive') {
      const learningPoint: LearningPoint = {
        id: `learning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'effective_question',
        description: 'Question pattern that generated comprehensive response',
        confidence: 0.8,
        applicability: {
          caseTypes: [context.consultationPattern.synthesis.disputeCharacterization],
          consultationStages: [context.currentFlow.currentStage],
          complexityLevels: [context.consultationPattern.synthesis.caseComplexityScore]
        },
        effectiveness: this.mapDepthToScore(analysis.analysisResults.depth),
        timestamp: new Date()
      };
      
      this.learningDatabase.push(learningPoint);
    }
    
    // Update contextual memory
    context.contextualMemory.strategicThemes = this.updateStrategicThemes(
      context.contextualMemory.strategicThemes, 
      analysis.keyThemes
    );
    
    context.contextualMemory.effectiveApproaches = this.updateEffectiveApproaches(
      context.contextualMemory.effectiveApproaches,
      analysis,
      suggestions
    );
  }

  private updateStrategicThemes(
    existingThemes: { theme: string; frequency: number; importance: number }[],
    newThemes: string[]
  ) {
    const themeMap = new Map(existingThemes.map(t => [t.theme, t]));
    
    newThemes.forEach(theme => {
      if (themeMap.has(theme)) {
        const existing = themeMap.get(theme)!;
        existing.frequency += 1;
        existing.importance += 0.1;
      } else {
        themeMap.set(theme, { theme, frequency: 1, importance: 0.5 });
      }
    });
    
    return Array.from(themeMap.values());
  }

  private updateEffectiveApproaches(
    existingApproaches: { approach: string; success: number }[],
    analysis: ResponseAnalysis,
    suggestions: FollowUpSuggestion[]
  ) {
    // Track approaches that generated high-value suggestions
    const highValueSuggestions = suggestions.filter(s => s.estimatedValue > 0.7);
    
    if (highValueSuggestions.length > 0) {
      const approachMap = new Map(existingApproaches.map(a => [a.approach, a]));
      
      const approach = `${analysis.analysisResults.depth}_${analysis.analysisResults.actionability}_analysis`;
      
      if (approachMap.has(approach)) {
        const existing = approachMap.get(approach)!;
        existing.success = Math.min(1.0, existing.success + 0.1);
      } else {
        approachMap.set(approach, { approach, success: 0.7 });
      }
      
      return Array.from(approachMap.values());
    }
    
    return existingApproaches;
  }

  /**
   * Initialize response patterns for analysis
   */
  private initializeResponsePatterns(): void {
    // Pattern recognition for common response types
    this.responsePatterns.set('comprehensive_strategy', {
      indicators: ['strategy', 'approach', 'framework', 'plan'],
      minLength: 800,
      expectedSections: ['analysis', 'recommendations', 'implementation']
    });
    
    this.responsePatterns.set('risk_focused', {
      indicators: ['risk', 'concern', 'challenge', 'threat'],
      minLength: 400,
      expectedSections: ['risks', 'mitigation', 'contingency']
    });
    
    this.responsePatterns.set('implementation_guide', {
      indicators: ['implement', 'execute', 'steps', 'timeline'],
      minLength: 600,
      expectedSections: ['actions', 'timeline', 'resources']
    });
  }

  /**
   * Get conversation context by session ID
   */
  getConversationContext(sessionId: string): ConversationContext | undefined {
    return this.conversationContexts.get(sessionId);
  }

  /**
   * Get learning insights
   */
  getLearningInsights(): {
    totalLearningPoints: number;
    effectivePatterns: LearningPoint[];
    commonThemes: string[];
    recommendedApproaches: string[];
  } {
    const effectivePatterns = this.learningDatabase
      .filter(lp => lp.effectiveness > 0.7)
      .sort((a, b) => b.effectiveness - a.effectiveness)
      .slice(0, 10);
    
    const themeCounts = new Map<string, number>();
    this.conversationContexts.forEach(context => {
      context.contextualMemory.strategicThemes.forEach(theme => {
        themeCounts.set(theme.theme, (themeCounts.get(theme.theme) || 0) + theme.frequency);
      });
    });
    
    const commonThemes = Array.from(themeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([theme]) => theme);
    
    const approachCounts = new Map<string, number>();
    this.conversationContexts.forEach(context => {
      context.contextualMemory.effectiveApproaches.forEach(approach => {
        if (approach.success > 0.6) {
          approachCounts.set(approach.approach, (approachCounts.get(approach.approach) || 0) + 1);
        }
      });
    });
    
    const recommendedApproaches = Array.from(approachCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([approach]) => approach);
    
    return {
      totalLearningPoints: this.learningDatabase.length,
      effectivePatterns,
      commonThemes,
      recommendedApproaches
    };
  }

  /**
   * Reset conversation context (for new session)
   */
  resetConversationContext(sessionId: string): void {
    this.conversationContexts.delete(sessionId);
  }

  /**
   * Get conversation flow status
   */
  getConversationFlow(sessionId: string): ConversationFlow | undefined {
    const context = this.conversationContexts.get(sessionId);
    return context?.currentFlow;
  }
}

export default ContextAwareFollowUpSystem;