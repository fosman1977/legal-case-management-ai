/**
 * AI Consultation Manager - Phase 3 Advanced AI Integration
 * Manages intelligent consultation with Claude AI using enhanced patterns
 * Provides multi-round consultations, context awareness, and strategic follow-ups
 */

import { EnhancedConsultationPattern } from './EnhancedPatternGenerator';

export interface ConsultationSession {
  id: string;
  caseId: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'completed' | 'paused' | 'archived';
  consultationRounds: ConsultationRound[];
  sessionContext: {
    consultationPattern: EnhancedConsultationPattern;
    sessionGoals: string[];
    priorityAreas: string[];
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    timeConstraints?: string;
    budgetConsiderations?: string;
  };
  insights: SessionInsight[];
  actionItems: ActionItem[];
  confidenceMetrics: {
    overallConfidence: number;
    strategyCoherence: number;
    riskAssessmentAccuracy: number;
    recommendationReliability: number;
  };
}

export interface ConsultationRound {
  id: string;
  roundNumber: number;
  timestamp: Date;
  promptType: 'initial' | 'follow_up' | 'clarification' | 'deep_dive' | 'strategic_pivot';
  prompt: string;
  response: string;
  confidence: number;
  keyInsights: string[];
  followUpQuestions: string[];
  strategyRecommendations: string[];
  riskAssessments: string[];
  evidenceRequirements: string[];
  tacticalAdvice: string[];
  duration: number; // milliseconds
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    totalCost?: number;
  };
}

export interface SessionInsight {
  id: string;
  type: 'strategic' | 'tactical' | 'risk' | 'evidence' | 'settlement' | 'procedural';
  priority: 'critical' | 'high' | 'medium' | 'low';
  insight: string;
  supportingEvidence: string[];
  actionable: boolean;
  timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  confidence: number;
  sourceRound: string; // Round ID that generated this insight
}

export interface ActionItem {
  id: string;
  category: 'investigation' | 'evidence_gathering' | 'legal_research' | 'client_communication' | 'court_preparation' | 'settlement_negotiation';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  description: string;
  deadline?: Date;
  estimatedEffort: string;
  dependencies: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  assignedTo?: string;
  notes: string[];
}

export interface ConsultationOptions {
  maxRounds?: number;
  focusAreas?: string[];
  consultationStyle?: 'comprehensive' | 'focused' | 'rapid' | 'exploratory';
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
  timeConstraints?: string;
  budgetConsiderations?: string;
  enableFollowUps?: boolean;
  enableDeepDives?: boolean;
  enableStrategicPivots?: boolean;
}

export interface ConsultationResult {
  session: ConsultationSession;
  strategicSummary: {
    recommendedStrategy: string;
    keyStrengths: string[];
    majorRisks: string[];
    criticalActions: string[];
    settlementProspects: string;
    litigationStrategy: string;
  };
  evidenceStrategy: {
    strengthsToLeverage: string[];
    gapsToAddress: string[];
    witnessStrategy: string[];
    documentStrategy: string[];
  };
  riskManagement: {
    highPriorityRisks: string[];
    mitigationStrategies: string[];
    contingencyPlans: string[];
  };
  nextSteps: ActionItem[];
  consultationMetrics: {
    totalRounds: number;
    totalDuration: number;
    averageConfidence: number;
    tokenUsage: { total: number; cost: number };
    insightsGenerated: number;
  };
}

/**
 * Advanced AI Consultation Manager - Orchestrates intelligent multi-round consultations with Claude
 */
export class AIConsultationManager {
  private activeSessions: Map<string, ConsultationSession> = new Map();
  private consultationHistory: ConsultationSession[] = [];

  constructor(
    private claudeAPIKey?: string,
    private defaultOptions: ConsultationOptions = {}
  ) {}

  /**
   * Start comprehensive consultation session
   */
  async startConsultation(
    caseId: string,
    consultationPattern: EnhancedConsultationPattern,
    options: ConsultationOptions = {}
  ): Promise<ConsultationResult> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create consultation session
    const session = this.createConsultationSession(sessionId, caseId, consultationPattern, options);
    this.activeSessions.set(sessionId, session);

    try {
      // Execute multi-round consultation
      await this.executeConsultationRounds(session, options);
      
      // Analyze and synthesize results
      const result = this.synthesizeConsultationResults(session);
      
      // Archive session
      session.status = 'completed';
      session.updatedAt = new Date();
      this.consultationHistory.push(session);
      this.activeSessions.delete(sessionId);

      return result;

    } catch (error) {
      console.error('Consultation error:', error);
      session.status = 'paused';
      throw new Error(`Consultation failed: ${error.message}`);
    }
  }

  /**
   * Create new consultation session
   */
  private createConsultationSession(
    sessionId: string,
    caseId: string,
    consultationPattern: EnhancedConsultationPattern,
    options: ConsultationOptions
  ): ConsultationSession {
    return {
      id: sessionId,
      caseId,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
      consultationRounds: [],
      sessionContext: {
        consultationPattern,
        sessionGoals: this.determineSessionGoals(consultationPattern, options),
        priorityAreas: this.identifyPriorityAreas(consultationPattern),
        riskTolerance: options.riskTolerance || 'moderate',
        timeConstraints: options.timeConstraints,
        budgetConsiderations: options.budgetConsiderations
      },
      insights: [],
      actionItems: [],
      confidenceMetrics: {
        overallConfidence: 0,
        strategyCoherence: 0,
        riskAssessmentAccuracy: 0,
        recommendationReliability: 0
      }
    };
  }

  /**
   * Execute multi-round consultation process
   */
  private async executeConsultationRounds(
    session: ConsultationSession,
    options: ConsultationOptions
  ): Promise<void> {
    const maxRounds = options.maxRounds || 5;
    let currentRound = 0;

    // Round 1: Initial comprehensive consultation
    await this.executeConsultationRound(
      session,
      'initial',
      session.sessionContext.consultationPattern.claudeConsultationPrompt,
      ++currentRound
    );

    // Subsequent rounds based on consultation style and responses
    while (currentRound < maxRounds && this.shouldContinueConsultation(session, options)) {
      const nextRoundType = this.determineNextRoundType(session, options);
      const nextPrompt = this.generateFollowUpPrompt(session, nextRoundType);
      
      if (nextPrompt) {
        await this.executeConsultationRound(session, nextRoundType, nextPrompt, ++currentRound);
      } else {
        break;
      }
    }
  }

  /**
   * Execute single consultation round
   */
  private async executeConsultationRound(
    session: ConsultationSession,
    promptType: ConsultationRound['promptType'],
    prompt: string,
    roundNumber: number
  ): Promise<void> {
    const startTime = Date.now();
    const roundId = `round_${roundNumber}_${Date.now()}`;

    try {
      // Simulate Claude API call (in real implementation, would call actual Claude API)
      const response = await this.callClaudeAPI(prompt);
      const duration = Date.now() - startTime;

      // Parse response for insights
      const insights = this.extractInsights(response, roundId);
      const followUpQuestions = this.extractFollowUpQuestions(response);
      const strategyRecommendations = this.extractStrategyRecommendations(response);
      const riskAssessments = this.extractRiskAssessments(response);
      const evidenceRequirements = this.extractEvidenceRequirements(response);
      const tacticalAdvice = this.extractTacticalAdvice(response);

      // Create consultation round
      const consultationRound: ConsultationRound = {
        id: roundId,
        roundNumber,
        timestamp: new Date(),
        promptType,
        prompt,
        response,
        confidence: this.calculateResponseConfidence(response),
        keyInsights: insights,
        followUpQuestions,
        strategyRecommendations,
        riskAssessments,
        evidenceRequirements,
        tacticalAdvice,
        duration,
        tokenUsage: this.estimateTokenUsage(prompt, response)
      };

      // Add round to session
      session.consultationRounds.push(consultationRound);
      
      // Update session insights and action items
      this.updateSessionInsights(session, consultationRound);
      this.updateActionItems(session, consultationRound);
      
      session.updatedAt = new Date();

    } catch (error) {
      console.error(`Round ${roundNumber} failed:`, error);
      throw error;
    }
  }

  /**
   * Simulate Claude API call - in real implementation would call actual API
   */
  private async callClaudeAPI(prompt: string): Promise<string> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    // Generate sophisticated mock response based on prompt analysis
    return this.generateMockClaudeResponse(prompt);
  }

  /**
   * Generate sophisticated mock Claude response
   */
  private generateMockClaudeResponse(prompt: string): string {
    const promptLower = prompt.toLowerCase();
    
    if (promptLower.includes('case strategy')) {
      return `# Strategic Analysis and Recommendations

## Overall Case Assessment
Based on the complex legal pattern analysis provided, this case presents a **moderately high-risk, high-reward scenario** requiring careful strategic planning.

## Recommended Primary Strategy
**Phased Litigation with Settlement Leverage Approach**

1. **Phase 1 - Strength Consolidation**: Address the timeline contradictions through targeted discovery and witness preparation
2. **Phase 2 - Strategic Disclosure**: Use the well-documented entity relationships as leverage points
3. **Phase 3 - Negotiated Resolution**: Leverage evidential strengths while mitigating identified risks

## Key Strategic Recommendations

### Immediate Priorities (Next 2-4 weeks)
1. **Address Timeline Contradictions**: Commission expert chronology analysis to resolve the 3 critical timeline issues
2. **Exploit Relationship Network**: Use the complex entity connections to establish liability patterns
3. **Fill Documentation Gaps**: Targeted discovery requests for the 6-month gap period

### Risk Mitigation Strategies
1. **Contradiction Management**: Prepare alternative narratives that acknowledge inconsistencies while maintaining case strength
2. **Evidence Sequencing**: Present strongest evidence first to establish credibility before addressing weaknesses
3. **Settlement Preparation**: Develop fallback positions given the evidential challenges

### Settlement Considerations
- **Optimal Settlement Window**: After addressing major contradictions but before full disclosure
- **Leverage Points**: Entity relationship complexity creates settlement pressure
- **Risk Factors**: Timeline issues may weaken settlement position if not resolved

### Litigation Strategy (if settlement fails)
1. **Expert Evidence**: Commission timeline analysis and relationship mapping experts
2. **Witness Strategy**: Prepare witnesses to address contradictions proactively  
3. **Document Strategy**: Use relationship analysis to establish documentary chains of evidence

## Evidence Strategy Recommendations
1. **Strengthen Timeline**: Obtain independent corroboration for disputed dates
2. **Relationship Mapping**: Convert entity analysis into clear liability arguments
3. **Gap Analysis**: Investigate and explain documentation gaps defensively

## Risk Assessment
- **High Risk**: Timeline contradictions may affect overall credibility
- **Medium Risk**: Complex relationships may confuse rather than clarify
- **Low Risk**: Strong evidential foundation provides good baseline

This analysis suggests a **70% likelihood of favorable outcome** with proper execution of the recommended strategy.`;
    }
    
    if (promptLower.includes('follow-up') || promptLower.includes('clarification')) {
      return `# Follow-up Analysis

## Clarification on Timeline Issues
The three critical timeline contradictions appear to center around:
1. **Contract execution dates** - Discrepancy between witness statement and written agreement
2. **Performance milestones** - Gap between promised and actual delivery dates  
3. **Notice periods** - Conflict in formal notification timing

## Strategic Refinement
Based on the pattern analysis, I recommend **prioritizing the relationship network leverage** over attempting to resolve all timeline issues. Here's why:

### Relationship Network as Primary Strategy
- The 8-entity network provides multiple liability pathways
- Complex financial flows create settlement pressure on multiple parties
- Less vulnerable to timeline credibility challenges

### Timeline as Secondary Defense
- Acknowledge inconsistencies early and transparently
- Focus on core timeline elements that are well-documented
- Use expert analysis to explain rather than deny discrepancies

## Enhanced Action Items
1. **Immediate**: Map entity relationships to legal liability theories
2. **Short-term**: Prepare defensive timeline narrative
3. **Medium-term**: Develop multi-party settlement strategy

This approach reduces risk while maximizing strategic advantage.`;
    }

    if (promptLower.includes('deep dive') || promptLower.includes('risk')) {
      return `# Deep Risk Analysis

## Critical Risk Assessment

### Primary Risk Factors (High Impact)
1. **Timeline Contradiction Cascade**: If timeline issues undermine core credibility, entire case theory may collapse
2. **Complexity Overwhelm**: 8-entity relationship network may confuse judge/jury rather than clarify
3. **Documentation Gap Exploitation**: 6-month gap provides opposing counsel with doubt-seeding opportunity

### Secondary Risk Factors (Medium Impact)
1. **Expert Evidence Costs**: Complex analysis requirements may exceed budget constraints
2. **Witness Coordination**: Multiple entities require complex witness preparation
3. **Settlement Timing**: Optimal settlement window may close if risks materialize

## Risk Mitigation Deep Dive

### Timeline Contradiction Management
**Problem**: Witness statements conflict with documentary evidence on key dates
**Solution Framework**:
- Commission independent timeline analysis from digital forensics expert
- Prepare witness amendment statements acknowledging human memory limitations
- Develop "weight of evidence" argument that doesn't depend on perfect chronology

### Relationship Network Strategy
**Problem**: Complex 8-entity network may overwhelm decision-makers
**Solution Framework**:
- Create simplified visual relationship maps for court presentation
- Focus on 3-4 key relationship pathways most favorable to case theory
- Prepare "network effect" arguments showing how complexity supports liability

### Documentation Gap Defense
**Problem**: 6-month gap creates inference opportunities for opposition
**Solution Framework**:
- Proactive explanation of gap reasons (business practice, system changes, etc.)
- Alternative evidence sources for gap period (emails, phone records, bank statements)
- Expert testimony on normal business record retention practices

## Contingency Planning
1. **If timeline contradictions prove fatal**: Pivot to relationship-based liability theory
2. **If relationship network backfires**: Simplify to bilateral dispute model
3. **If documentation gaps expand**: Focus on available evidence quality over completeness

**Overall Risk Rating: Medium-High** with effective mitigation reducing to Medium.`;
    }

    // Default comprehensive response
    return `# Comprehensive Legal Strategy Analysis

## Executive Summary
This case presents a **complex multi-dimensional legal challenge** requiring sophisticated strategic approach. The pattern analysis reveals both significant opportunities and substantial risks that must be carefully balanced.

## Strategic Framework

### Core Strategy: **Structured Complexity Management**
Rather than avoiding the case's complexity, we should embrace and organize it strategically:

1. **Timeline Fortification**: Address contradictions through expert analysis
2. **Relationship Leverage**: Use entity network as primary strategic advantage
3. **Evidence Orchestration**: Present complex evidence in digestible sequences
4. **Risk Buffering**: Prepare defensive positions for identified vulnerabilities

### Tactical Execution Plan

#### Phase 1: Foundation Building (Weeks 1-4)
- Commission timeline analysis expert
- Map entity relationships to liability theories
- Conduct targeted witness interviews
- Identify additional evidence sources for gaps

#### Phase 2: Strategic Positioning (Weeks 5-8)  
- File strategic discovery motions
- Prepare expert witness statements
- Develop visual presentation materials
- Initiate settlement discussions

#### Phase 3: Resolution Execution (Weeks 9-12)
- Execute settlement negotiations or trial preparation
- Present case theory with supporting evidence
- Manage identified risks through contingency plans

## Evidence Strategy
1. **Documentary**: Leverage high-quality extraction results
2. **Expert**: Timeline and relationship analysis experts
3. **Witness**: Coordinate multi-party witness preparation
4. **Demonstrative**: Visual relationship maps and chronologies

## Risk Management
- **High Priority**: Timeline contradiction resolution
- **Medium Priority**: Complexity management for court presentation
- **Low Priority**: Documentation gap defensive explanations

## Settlement Analysis
**Likelihood**: 65% - Complexity creates settlement incentive for all parties
**Optimal Timing**: After Phase 1 completion, before full discovery
**Key Leverage**: Entity relationship complexity and liability uncertainty

## Expected Outcomes
- **Favorable Settlement**: 70% probability with proper execution
- **Trial Victory**: 60% probability if settlement fails
- **Strategic Goals Achievement**: High likelihood with recommended approach

This analysis provides a robust framework for managing case complexity while maximizing strategic advantage.`;
  }

  /**
   * Determine next consultation round type
   */
  private determineNextRoundType(
    session: ConsultationSession,
    options: ConsultationOptions
  ): ConsultationRound['promptType'] {
    const lastRound = session.consultationRounds[session.consultationRounds.length - 1];
    
    if (!lastRound) return 'initial';
    
    // Analyze last response for follow-up opportunities
    if (lastRound.followUpQuestions.length > 0 && options.enableFollowUps !== false) {
      return 'follow_up';
    }
    
    // Check for high-risk areas needing deep dive
    if (lastRound.riskAssessments.length > 0 && options.enableDeepDives !== false) {
      return 'deep_dive';
    }
    
    // Look for strategic pivots based on new insights
    if (session.insights.some(i => i.priority === 'critical') && options.enableStrategicPivots !== false) {
      return 'strategic_pivot';
    }
    
    return 'clarification';
  }

  /**
   * Generate follow-up prompt based on session context
   */
  private generateFollowUpPrompt(
    session: ConsultationSession,
    promptType: ConsultationRound['promptType']
  ): string | null {
    const lastRound = session.consultationRounds[session.consultationRounds.length - 1];
    if (!lastRound) return null;

    switch (promptType) {
      case 'follow_up':
        if (lastRound.followUpQuestions.length > 0) {
          const topQuestions = lastRound.followUpQuestions.slice(0, 3);
          return `# Follow-up Consultation

Based on your previous analysis, please provide deeper insights on these specific questions:

${topQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Please provide specific, actionable guidance for each area, considering:
- The identified case complexity score of ${(session.sessionContext.consultationPattern.synthesis.caseComplexityScore * 100).toFixed(0)}%
- Risk tolerance level: ${session.sessionContext.riskTolerance}
- Current priority areas: ${session.sessionContext.priorityAreas.join(', ')}

Focus on practical implementation steps and potential challenges.`;
        }
        break;

      case 'deep_dive':
        const highRiskAreas = lastRound.riskAssessments.slice(0, 2);
        if (highRiskAreas.length > 0) {
          return `# Deep Risk Analysis Request

Please provide a comprehensive deep-dive analysis of these critical risk factors:

${highRiskAreas.map((risk, i) => `${i + 1}. ${risk}`).join('\n')}

For each risk factor, please address:
- **Probability**: Likelihood of this risk materializing
- **Impact**: Potential consequences if it occurs  
- **Mitigation**: Specific steps to reduce probability/impact
- **Contingency**: What to do if mitigation fails
- **Timeline**: When this risk is most likely to emerge
- **Resources**: What resources are needed to manage this risk

Consider the case's current evidential strength assessment: ${session.sessionContext.consultationPattern.synthesis.evidentialStrengthAssessment}`;
        }
        break;

      case 'strategic_pivot':
        const criticalInsights = session.insights.filter(i => i.priority === 'critical');
        if (criticalInsights.length > 0) {
          return `# Strategic Pivot Analysis

Given these critical insights that have emerged from our consultation:

${criticalInsights.map((insight, i) => `${i + 1}. ${insight.insight}`).join('\n')}

Please analyze whether these insights suggest a fundamental strategy change. Specifically address:
- Should we pivot from the current ${session.sessionContext.consultationPattern.synthesis.disputeCharacterization} approach?
- What alternative strategies might be more effective given these insights?
- How do these insights change our risk/reward calculation?
- What are the implementation implications of a strategic pivot?
- Timeline considerations for making any strategic changes

Provide a clear recommendation: Continue current strategy, Modify current strategy, or Pivot to new strategy.`;
        }
        break;

      case 'clarification':
        return `# Clarification and Refinement

Please provide clarification and additional detail on the key strategic recommendations from your previous analysis.

Specifically, elaborate on:
1. **Implementation Timeline**: More detailed phasing for your recommended strategy
2. **Resource Requirements**: What specific expertise/resources are needed
3. **Decision Points**: Key milestones where strategy might need adjustment  
4. **Success Metrics**: How to measure progress toward strategic goals
5. **Alternative Scenarios**: What if initial strategy encounters obstacles

Also consider any aspects that may have been unclear or need further development based on the case complexity and evidence patterns identified.`;
    }

    return null;
  }

  /**
   * Extract insights from Claude response
   */
  private extractInsights(response: string, roundId: string): string[] {
    const insights = [];
    
    // Look for strategic insights
    const strategicMatches = response.match(/\*\*[^*]+\*\*[^\.!]+[\.!]/g) || [];
    insights.push(...strategicMatches.slice(0, 5));
    
    // Look for key recommendations
    const recommendations = response.match(/(?:recommend|suggest|advise)[^\.!]+[\.!]/gi) || [];
    insights.push(...recommendations.slice(0, 3));
    
    return insights.map(insight => insight.replace(/\*\*/g, '').trim());
  }

  private extractFollowUpQuestions(response: string): string[] {
    // Look for questions or areas needing clarification
    const questions = [];
    
    if (response.toLowerCase().includes('timeline')) {
      questions.push('How should timeline contradictions be addressed in witness preparation?');
    }
    if (response.toLowerCase().includes('settlement')) {
      questions.push('What specific settlement parameters should guide negotiations?');
    }
    if (response.toLowerCase().includes('evidence')) {
      questions.push('What additional evidence gathering would strengthen the case?');
    }
    if (response.toLowerCase().includes('risk')) {
      questions.push('How should contingency plans be prioritized and resourced?');
    }
    
    return questions;
  }

  private extractStrategyRecommendations(response: string): string[] {
    const strategies = [];
    
    // Extract strategic recommendations from response
    const strategyLines = response.split('\n').filter(line => 
      line.toLowerCase().includes('strategy') || 
      line.toLowerCase().includes('recommend') ||
      line.toLowerCase().includes('approach')
    );
    
    return strategyLines.slice(0, 5).map(line => line.replace(/^[\s\-\*#]+/, '').trim());
  }

  private extractRiskAssessments(response: string): string[] {
    const risks = [];
    
    // Look for risk-related content
    const riskLines = response.split('\n').filter(line => 
      line.toLowerCase().includes('risk') || 
      line.toLowerCase().includes('danger') ||
      line.toLowerCase().includes('concern') ||
      line.toLowerCase().includes('vulnerable')
    );
    
    return riskLines.slice(0, 4).map(line => line.replace(/^[\s\-\*#]+/, '').trim());
  }

  private extractEvidenceRequirements(response: string): string[] {
    const evidence = [];
    
    // Look for evidence-related recommendations
    if (response.toLowerCase().includes('expert')) {
      evidence.push('Expert witness testimony required');
    }
    if (response.toLowerCase().includes('document')) {
      evidence.push('Additional documentary evidence needed');
    }
    if (response.toLowerCase().includes('witness')) {
      evidence.push('Witness statement preparation required');
    }
    
    return evidence;
  }

  private extractTacticalAdvice(response: string): string[] {
    const tactics = [];
    
    // Extract tactical advice
    const tacticLines = response.split('\n').filter(line => 
      line.toLowerCase().includes('immediate') || 
      line.toLowerCase().includes('next') ||
      line.toLowerCase().includes('phase') ||
      line.toLowerCase().includes('step')
    );
    
    return tacticLines.slice(0, 3).map(line => line.replace(/^[\s\-\*#]+/, '').trim());
  }

  /**
   * Update session insights based on consultation round
   */
  private updateSessionInsights(session: ConsultationSession, round: ConsultationRound): void {
    // Convert round insights to session insights
    round.keyInsights.forEach(insight => {
      const sessionInsight: SessionInsight = {
        id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: this.categorizeInsight(insight),
        priority: this.assessInsightPriority(insight),
        insight,
        supportingEvidence: [],
        actionable: this.isActionableInsight(insight),
        timeframe: this.determineTimeframe(insight),
        confidence: round.confidence,
        sourceRound: round.id
      };
      
      session.insights.push(sessionInsight);
    });
  }

  /**
   * Update action items based on consultation round
   */
  private updateActionItems(session: ConsultationSession, round: ConsultationRound): void {
    // Convert tactical advice to action items
    round.tacticalAdvice.forEach(advice => {
      if (this.isActionableAdvice(advice)) {
        const actionItem: ActionItem = {
          id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          category: this.categorizeActionItem(advice),
          priority: this.assessActionPriority(advice),
          description: advice,
          estimatedEffort: this.estimateEffort(advice),
          dependencies: [],
          status: 'pending',
          notes: [`Generated from consultation round ${round.roundNumber}`]
        };
        
        session.actionItems.push(actionItem);
      }
    });
  }

  // Helper methods for analysis
  private categorizeInsight(insight: string): SessionInsight['type'] {
    const insightLower = insight.toLowerCase();
    if (insightLower.includes('strategy') || insightLower.includes('approach')) return 'strategic';
    if (insightLower.includes('risk') || insightLower.includes('danger')) return 'risk';
    if (insightLower.includes('evidence') || insightLower.includes('document')) return 'evidence';
    if (insightLower.includes('settlement') || insightLower.includes('negotiate')) return 'settlement';
    if (insightLower.includes('court') || insightLower.includes('procedure')) return 'procedural';
    return 'tactical';
  }

  private assessInsightPriority(insight: string): SessionInsight['priority'] {
    const insightLower = insight.toLowerCase();
    if (insightLower.includes('critical') || insightLower.includes('urgent') || insightLower.includes('immediate')) return 'critical';
    if (insightLower.includes('important') || insightLower.includes('significant')) return 'high';
    if (insightLower.includes('consider') || insightLower.includes('should')) return 'medium';
    return 'low';
  }

  private isActionableInsight(insight: string): boolean {
    const actionWords = ['should', 'must', 'need', 'require', 'recommend', 'advise'];
    return actionWords.some(word => insight.toLowerCase().includes(word));
  }

  private determineTimeframe(insight: string): SessionInsight['timeframe'] {
    const insightLower = insight.toLowerCase();
    if (insightLower.includes('immediate') || insightLower.includes('urgent')) return 'immediate';
    if (insightLower.includes('short') || insightLower.includes('next')) return 'short_term';
    if (insightLower.includes('medium') || insightLower.includes('phase')) return 'medium_term';
    return 'long_term';
  }

  private isActionableAdvice(advice: string): boolean {
    const actionPattern = /\b(prepare|commission|develop|create|conduct|file|obtain|analyze)\b/i;
    return actionPattern.test(advice);
  }

  private categorizeActionItem(advice: string): ActionItem['category'] {
    const adviceLower = advice.toLowerCase();
    if (adviceLower.includes('investigate') || adviceLower.includes('research')) return 'investigation';
    if (adviceLower.includes('evidence') || adviceLower.includes('document')) return 'evidence_gathering';
    if (adviceLower.includes('legal') || adviceLower.includes('case law')) return 'legal_research';
    if (adviceLower.includes('client') || adviceLower.includes('communicate')) return 'client_communication';
    if (adviceLower.includes('court') || adviceLower.includes('trial')) return 'court_preparation';
    if (adviceLower.includes('settlement') || adviceLower.includes('negotiate')) return 'settlement_negotiation';
    return 'investigation';
  }

  private assessActionPriority(advice: string): ActionItem['priority'] {
    const adviceLower = advice.toLowerCase();
    if (adviceLower.includes('urgent') || adviceLower.includes('immediate')) return 'urgent';
    if (adviceLower.includes('critical') || adviceLower.includes('important')) return 'high';
    if (adviceLower.includes('should') || adviceLower.includes('consider')) return 'medium';
    return 'low';
  }

  private estimateEffort(advice: string): string {
    const adviceLower = advice.toLowerCase();
    if (adviceLower.includes('commission') || adviceLower.includes('expert')) return '2-4 weeks';
    if (adviceLower.includes('prepare') || adviceLower.includes('develop')) return '1-2 weeks';
    if (adviceLower.includes('review') || adviceLower.includes('analyze')) return '3-5 days';
    return '1-3 days';
  }

  private calculateResponseConfidence(response: string): number {
    let confidence = 0.75;
    
    // Higher confidence for detailed, structured responses
    if (response.includes('##') || response.includes('###')) confidence += 0.1;
    if (response.length > 1000) confidence += 0.05;
    if (response.includes('recommend') || response.includes('strategy')) confidence += 0.05;
    
    return Math.min(0.95, confidence);
  }

  private estimateTokenUsage(prompt: string, response: string) {
    // Rough token estimation (1 token ≈ 4 characters)
    const inputTokens = Math.ceil(prompt.length / 4);
    const outputTokens = Math.ceil(response.length / 4);
    const totalCost = (inputTokens * 0.003 + outputTokens * 0.015) / 1000; // Rough Claude pricing
    
    return {
      inputTokens,
      outputTokens,
      totalCost
    };
  }

  private shouldContinueConsultation(session: ConsultationSession, options: ConsultationOptions): boolean {
    const lastRound = session.consultationRounds[session.consultationRounds.length - 1];
    
    // Continue if there are follow-up questions and we haven't reached max rounds
    if (lastRound?.followUpQuestions.length > 0 && options.enableFollowUps !== false) {
      return true;
    }
    
    // Continue if there are high-priority risks to explore
    if (lastRound?.riskAssessments.length > 0 && options.enableDeepDives !== false) {
      return true;
    }
    
    // Continue if critical insights need strategic pivot consideration
    if (session.insights.some(i => i.priority === 'critical' && i.actionable)) {
      return true;
    }
    
    return false;
  }

  private determineSessionGoals(
    pattern: EnhancedConsultationPattern,
    options: ConsultationOptions
  ): string[] {
    const goals = ['Develop comprehensive case strategy'];
    
    if (pattern.synthesis.caseComplexityScore > 0.7) {
      goals.push('Manage case complexity effectively');
    }
    
    if (pattern.contradictionPatterns.riskLevel === 'high' || pattern.contradictionPatterns.riskLevel === 'critical') {
      goals.push('Address critical contradictions');
    }
    
    if (options.focusAreas) {
      goals.push(...options.focusAreas.map(area => `Focus on ${area}`));
    }
    
    return goals;
  }

  private identifyPriorityAreas(pattern: EnhancedConsultationPattern): string[] {
    const areas = [];
    
    if (pattern.contradictionPatterns.criticalIssues.length > 0) {
      areas.push('Contradiction Resolution');
    }
    
    if (pattern.temporalPatterns.significantGaps.length > 0) {
      areas.push('Timeline Analysis');
    }
    
    if (pattern.relationshipPatterns.networkComplexity.includes('complex')) {
      areas.push('Relationship Mapping');
    }
    
    if (pattern.semanticPatterns.complexityFactors.length > 2) {
      areas.push('Legal Complexity Management');
    }
    
    return areas;
  }

  /**
   * Synthesize consultation results into comprehensive analysis
   */
  private synthesizeConsultationResults(session: ConsultationSession): ConsultationResult {
    // Calculate metrics
    const totalRounds = session.consultationRounds.length;
    const totalDuration = session.consultationRounds.reduce((sum, round) => sum + round.duration, 0);
    const averageConfidence = session.consultationRounds.length > 0 ? 
      session.consultationRounds.reduce((sum, round) => sum + round.confidence, 0) / session.consultationRounds.length : 0;
    
    const totalTokens = session.consultationRounds.reduce((sum, round) => 
      sum + round.tokenUsage.inputTokens + round.tokenUsage.outputTokens, 0);
    const totalCost = session.consultationRounds.reduce((sum, round) => 
      sum + (round.tokenUsage.totalCost || 0), 0);

    // Update session confidence metrics
    session.confidenceMetrics = {
      overallConfidence: averageConfidence,
      strategyCoherence: this.calculateStrategyCoherence(session),
      riskAssessmentAccuracy: this.calculateRiskAssessmentAccuracy(session),
      recommendationReliability: this.calculateRecommendationReliability(session)
    };

    // Generate strategic summary
    const strategicSummary = this.generateStrategicSummary(session);
    const evidenceStrategy = this.generateEvidenceStrategy(session);
    const riskManagement = this.generateRiskManagement(session);
    const nextSteps = this.prioritizeActionItems(session.actionItems);

    return {
      session,
      strategicSummary,
      evidenceStrategy,
      riskManagement,
      nextSteps,
      consultationMetrics: {
        totalRounds,
        totalDuration,
        averageConfidence,
        tokenUsage: { total: totalTokens, cost: totalCost },
        insightsGenerated: session.insights.length
      }
    };
  }

  private calculateStrategyCoherence(session: ConsultationSession): number {
    // Analyze consistency across consultation rounds
    const strategies = session.consultationRounds.flatMap(round => round.strategyRecommendations);
    // Simple coherence calculation - in practice would use more sophisticated analysis
    return Math.min(0.95, 0.7 + (strategies.length * 0.05));
  }

  private calculateRiskAssessmentAccuracy(session: ConsultationSession): number {
    // Assess quality of risk identification and mitigation suggestions
    const risks = session.consultationRounds.flatMap(round => round.riskAssessments);
    return Math.min(0.95, 0.75 + (risks.length * 0.03));
  }

  private calculateRecommendationReliability(session: ConsultationSession): number {
    // Evaluate actionability and specificity of recommendations
    const actionableInsights = session.insights.filter(i => i.actionable).length;
    const totalInsights = session.insights.length;
    return totalInsights > 0 ? actionableInsights / totalInsights : 0.8;
  }

  private generateStrategicSummary(session: ConsultationSession) {
    const allStrategies = session.consultationRounds.flatMap(round => round.strategyRecommendations);
    const allRisks = session.consultationRounds.flatMap(round => round.riskAssessments);
    
    return {
      recommendedStrategy: allStrategies[0] || 'Comprehensive case analysis and strategic planning',
      keyStrengths: session.sessionContext.consultationPattern.synthesis.strategicAdvantages,
      majorRisks: allRisks.slice(0, 3),
      criticalActions: session.actionItems.filter(a => a.priority === 'urgent').map(a => a.description),
      settlementProspects: 'Moderate to good settlement prospects based on case complexity',
      litigationStrategy: 'Structured approach managing complexity while leveraging strengths'
    };
  }

  private generateEvidenceStrategy(session: ConsultationSession) {
    const evidenceReqs = session.consultationRounds.flatMap(round => round.evidenceRequirements);
    
    return {
      strengthsToLeverage: ['High-quality documentation', 'Complex relationship analysis'],
      gapsToAddress: ['Timeline contradictions', 'Documentation gaps'],
      witnessStrategy: ['Coordinate multi-party witness preparation'],
      documentStrategy: ['Commission expert analysis', 'Fill evidence gaps']
    };
  }

  private generateRiskManagement(session: ConsultationSession) {
    const risks = session.insights.filter(i => i.type === 'risk');
    
    return {
      highPriorityRisks: risks.filter(r => r.priority === 'critical' || r.priority === 'high').map(r => r.insight),
      mitigationStrategies: ['Timeline expert analysis', 'Defensive evidence preparation'],
      contingencyPlans: ['Alternative liability theories', 'Settlement fallback positions']
    };
  }

  private prioritizeActionItems(actionItems: ActionItem[]): ActionItem[] {
    return actionItems
      .sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 10); // Top 10 most important actions
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): ConsultationSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Get consultation history
   */
  getConsultationHistory(): ConsultationSession[] {
    return this.consultationHistory;
  }

  /**
   * Pause active session
   */
  pauseSession(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'paused';
      session.updatedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Resume paused session
   */
  resumeSession(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (session && session.status === 'paused') {
      session.status = 'active';
      session.updatedAt = new Date();
      return true;
    }
    return false;
  }
}

export default AIConsultationManager;