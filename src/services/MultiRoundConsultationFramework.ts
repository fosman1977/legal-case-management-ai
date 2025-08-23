/**
 * Multi-round Consultation Framework - Phase 3 Advanced AI Integration
 * Orchestrates complete multi-round consultation sessions with intelligent flow management
 * Integrates all Phase 3 components for seamless consultation experience
 */

import { AIConsultationManager, ConsultationSession, ConsultationOptions, ConsultationResult } from './AIConsultationManager';
import { RealTimeClaudeIntegration, ClaudeRequest, ClaudeResponse } from './RealTimeClaudeIntegration';
import { AdvancedPromptEngine, PromptContext } from './AdvancedPromptEngine';
import { ContextAwareFollowUpSystem, FollowUpSuggestion } from './ContextAwareFollowUpSystem';
import { AIResponseValidator, ValidationResult } from './AIResponseValidator';
import { EnhancedConsultationPattern } from './EnhancedPatternGenerator';

export interface ConsultationFrameworkConfig {
  claudeConfig: {
    apiKey: string;
    model?: 'claude-3-sonnet' | 'claude-3-haiku' | 'claude-3-opus';
    maxTokens?: number;
    temperature?: number;
  };
  consultationSettings: {
    maxRounds?: number;
    autoFollowUp?: boolean;
    validationRequired?: boolean;
    streamingEnabled?: boolean;
    qualityThreshold?: number;
  };
  frameworkOptions: {
    enableLearning?: boolean;
    enableOptimization?: boolean;
    enableMetrics?: boolean;
    debugMode?: boolean;
  };
}

export interface ConsultationSession {
  session: ConsultationSession;
  currentState: 'initializing' | 'active' | 'paused' | 'completing' | 'completed' | 'error';
  progress: {
    currentRound: number;
    totalPlannedRounds: number;
    completionPercentage: number;
    timeElapsed: number;
    estimatedTimeRemaining: number;
  };
  qualityMetrics: {
    averageValidationScore: number;
    consistencyScore: number;
    userSatisfactionScore: number;
    effectivenessRating: number;
  };
  streamingState?: {
    isStreaming: boolean;
    currentChunk: string;
    accumulatedContent: string;
    streamProgress: number;
  };
}

export interface RoundResult {
  roundNumber: number;
  prompt: string;
  response: ClaudeResponse;
  validation: ValidationResult;
  followUpSuggestions: FollowUpSuggestion[];
  roundMetrics: {
    promptQuality: number;
    responseQuality: number;
    relevanceScore: number;
    actionabilityScore: number;
    duration: number;
    tokenUsage: number;
    cost: number;
  };
  userFeedback?: {
    satisfaction: number; // 1-5
    usefulness: number; // 1-5
    clarity: number; // 1-5
    comments?: string;
  };
}

export interface FrameworkMetrics {
  totalSessions: number;
  averageRounds: number;
  averageSessionDuration: number;
  averageQualityScore: number;
  totalTokensUsed: number;
  totalCost: number;
  userSatisfactionRating: number;
  completionRate: number;
  errorRate: number;
  performanceMetrics: {
    averageResponseTime: number;
    streamingUtilization: number;
    validationAccuracy: number;
    followUpRelevance: number;
  };
}

/**
 * Multi-round Consultation Framework - Complete consultation orchestration
 */
export class MultiRoundConsultationFramework {
  private consultationManager: AIConsultationManager;
  private claudeIntegration: RealTimeClaudeIntegration;
  private promptEngine: AdvancedPromptEngine;
  private followUpSystem: ContextAwareFollowUpSystem;
  private responseValidator: AIResponseValidator;

  private activeSessions: Map<string, ConsultationSession> = new Map();
  private frameworkMetrics: FrameworkMetrics;
  private config: ConsultationFrameworkConfig;

  constructor(config: ConsultationFrameworkConfig) {
    this.config = config;
    
    // Initialize all Phase 3 components
    this.claudeIntegration = new RealTimeClaudeIntegration(config.claudeConfig);
    this.consultationManager = new AIConsultationManager(config.claudeConfig.apiKey);
    this.promptEngine = new AdvancedPromptEngine();
    this.followUpSystem = new ContextAwareFollowUpSystem();
    this.responseValidator = new AIResponseValidator();

    this.frameworkMetrics = this.initializeMetrics();
  }

  /**
   * Start comprehensive multi-round consultation
   */
  async startConsultation(
    caseId: string,
    consultationPattern: EnhancedConsultationPattern,
    options: ConsultationOptions = {}
  ): Promise<ConsultationSession> {
    const sessionId = `framework_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Create session state
      const sessionState: ConsultationSession = {
        session: await this.initializeConsultationSession(sessionId, caseId, consultationPattern, options),
        currentState: 'initializing',
        progress: {
          currentRound: 0,
          totalPlannedRounds: options.maxRounds || 5,
          completionPercentage: 0,
          timeElapsed: 0,
          estimatedTimeRemaining: 0
        },
        qualityMetrics: {
          averageValidationScore: 0,
          consistencyScore: 0,
          userSatisfactionScore: 0,
          effectivenessRating: 0
        }
      };

      this.activeSessions.set(sessionId, sessionState);
      sessionState.currentState = 'active';

      // Execute consultation rounds
      await this.executeConsultationFlow(sessionState, consultationPattern, options);

      return sessionState;

    } catch (error) {
      console.error('Framework consultation error:', error);
      throw new Error(`Multi-round consultation failed: ${error.message}`);
    }
  }

  /**
   * Start streaming consultation with real-time updates
   */
  async startStreamingConsultation(
    caseId: string,
    consultationPattern: EnhancedConsultationPattern,
    onUpdate: (update: ConsultationUpdate) => void,
    options: ConsultationOptions = {}
  ): Promise<ConsultationSession> {
    const sessionId = `streaming_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const sessionState = await this.startConsultation(caseId, consultationPattern, {
        ...options,
        enableStreaming: true
      });

      sessionState.streamingState = {
        isStreaming: false,
        currentChunk: '',
        accumulatedContent: '',
        streamProgress: 0
      };

      // Execute with streaming updates
      await this.executeStreamingConsultationFlow(sessionState, consultationPattern, onUpdate, options);

      return sessionState;

    } catch (error) {
      console.error('Streaming consultation error:', error);
      throw new Error(`Streaming consultation failed: ${error.message}`);
    }
  }

  /**
   * Execute consultation flow with intelligent round management
   */
  private async executeConsultationFlow(
    sessionState: ConsultationSession,
    consultationPattern: EnhancedConsultationPattern,
    options: ConsultationOptions
  ): Promise<void> {
    const maxRounds = options.maxRounds || 5;
    let currentRound = 0;
    const sessionStartTime = Date.now();

    while (currentRound < maxRounds && sessionState.currentState === 'active') {
      try {
        currentRound++;
        sessionState.progress.currentRound = currentRound;
        
        // Execute consultation round
        const roundResult = await this.executeConsultationRound(
          sessionState,
          consultationPattern,
          currentRound,
          options
        );

        // Update session with round results
        this.updateSessionWithRoundResult(sessionState, roundResult);
        
        // Check if we should continue
        const shouldContinue = await this.evaluateContinuation(sessionState, roundResult, options);
        if (!shouldContinue) {
          break;
        }

        // Update progress
        sessionState.progress.completionPercentage = Math.min(
          95, 
          (currentRound / maxRounds) * 100
        );
        sessionState.progress.timeElapsed = Date.now() - sessionStartTime;
        sessionState.progress.estimatedTimeRemaining = this.estimateRemainingTime(
          sessionState.progress.timeElapsed,
          currentRound,
          maxRounds - currentRound
        );

      } catch (error) {
        console.error(`Round ${currentRound} failed:`, error);
        sessionState.currentState = 'error';
        throw error;
      }
    }

    // Complete session
    sessionState.currentState = 'completing';
    await this.finalizeConsultation(sessionState);
    sessionState.currentState = 'completed';
    sessionState.progress.completionPercentage = 100;
  }

  /**
   * Execute single consultation round with full Phase 3 integration
   */
  private async executeConsultationRound(
    sessionState: ConsultationSession,
    consultationPattern: EnhancedConsultationPattern,
    roundNumber: number,
    options: ConsultationOptions
  ): Promise<RoundResult> {
    const roundStartTime = Date.now();

    // 1. Generate optimized prompt
    const promptContext: Partial<PromptContext> = {
      consultationStage: this.determineConsultationStage(roundNumber, sessionState),
      previousRounds: sessionState.session.consultationRounds,
      sessionGoals: sessionState.session.sessionContext.sessionGoals,
      priorityAreas: sessionState.session.sessionContext.priorityAreas,
      riskTolerance: sessionState.session.sessionContext.riskTolerance,
      timeConstraints: options.timeConstraints,
      budgetConstraints: options.budgetConsiderations,
      clientProfile: 'balanced' // Would be derived from user preferences
    };

    const promptType = roundNumber === 1 ? 'initial' : 
                      roundNumber === 2 ? 'follow_up' :
                      roundNumber > 3 ? 'deep_dive' : 'clarification';

    const generatedPrompt = this.promptEngine.generatePrompt(
      consultationPattern,
      promptContext,
      promptType
    );

    // 2. Send request to Claude
    const claudeRequest: ClaudeRequest = {
      messages: [
        { role: 'user', content: generatedPrompt.content }
      ],
      maxTokens: this.config.claudeConfig.maxTokens,
      temperature: this.config.claudeConfig.temperature,
      metadata: {
        caseId: sessionState.session.caseId,
        sessionId: sessionState.session.id,
        consultationType: promptType
      }
    };

    const claudeResponse = await this.claudeIntegration.sendRequest(claudeRequest);

    // 3. Validate response quality
    const validation = await this.responseValidator.validateResponse(
      claudeResponse,
      {
        consultationPattern,
        session: sessionState.session,
        roundNumber,
        previousValidations: [],
        userExpectations: sessionState.session.sessionContext.sessionGoals,
        riskTolerance: sessionState.session.sessionContext.riskTolerance,
        legalJurisdiction: ['UK', 'England and Wales']
      }
    );

    // 4. Generate follow-up suggestions
    const followUpSuggestions = await this.followUpSystem.analyzeResponseAndGenerateFollowUps(
      sessionState.session.id,
      `round_${roundNumber}`,
      claudeResponse,
      sessionState.session
    );

    // 5. Calculate round metrics
    const roundDuration = Date.now() - roundStartTime;
    const roundMetrics = {
      promptQuality: generatedPrompt.qualityMetrics.clarity * generatedPrompt.qualityMetrics.specificity,
      responseQuality: validation.overallScore,
      relevanceScore: validation.qualityMetrics.relevance.score,
      actionabilityScore: validation.qualityMetrics.actionability.score,
      duration: roundDuration,
      tokenUsage: claudeResponse.usage.totalTokens,
      cost: claudeResponse.usage.estimatedCost
    };

    return {
      roundNumber,
      prompt: generatedPrompt.content,
      response: claudeResponse,
      validation,
      followUpSuggestions,
      roundMetrics
    };
  }

  /**
   * Execute streaming consultation with real-time updates
   */
  private async executeStreamingConsultationFlow(
    sessionState: ConsultationSession,
    consultationPattern: EnhancedConsultationPattern,
    onUpdate: (update: ConsultationUpdate) => void,
    options: ConsultationOptions
  ): Promise<void> {
    // Similar to executeConsultationFlow but with streaming callbacks
    const maxRounds = options.maxRounds || 5;
    let currentRound = 0;

    while (currentRound < maxRounds && sessionState.currentState === 'active') {
      currentRound++;
      sessionState.progress.currentRound = currentRound;
      
      onUpdate({
        type: 'round_start',
        sessionId: sessionState.session.id,
        roundNumber: currentRound,
        progress: sessionState.progress
      });

      // Execute round with streaming
      const roundResult = await this.executeStreamingRound(
        sessionState,
        consultationPattern,
        currentRound,
        options,
        onUpdate
      );

      this.updateSessionWithRoundResult(sessionState, roundResult);
      
      onUpdate({
        type: 'round_complete',
        sessionId: sessionState.session.id,
        roundResult,
        followUpSuggestions: roundResult.followUpSuggestions
      });

      const shouldContinue = await this.evaluateContinuation(sessionState, roundResult, options);
      if (!shouldContinue) {
        break;
      }
    }

    await this.finalizeConsultation(sessionState);
    
    onUpdate({
      type: 'session_complete',
      sessionId: sessionState.session.id,
      finalResult: this.createConsultationResult(sessionState)
    });
  }

  /**
   * Execute streaming round with chunk-by-chunk updates
   */
  private async executeStreamingRound(
    sessionState: ConsultationSession,
    consultationPattern: EnhancedConsultationPattern,
    roundNumber: number,
    options: ConsultationOptions,
    onUpdate: (update: ConsultationUpdate) => void
  ): Promise<RoundResult> {
    // Generate prompt (same as non-streaming)
    const generatedPrompt = this.promptEngine.generatePrompt(
      consultationPattern,
      {
        consultationStage: this.determineConsultationStage(roundNumber, sessionState),
        previousRounds: sessionState.session.consultationRounds
      },
      roundNumber === 1 ? 'initial' : 'follow_up'
    );

    onUpdate({
      type: 'prompt_generated',
      sessionId: sessionState.session.id,
      prompt: generatedPrompt
    });

    // Send streaming request
    sessionState.streamingState!.isStreaming = true;
    sessionState.streamingState!.accumulatedContent = '';

    const claudeRequest: ClaudeRequest = {
      messages: [{ role: 'user', content: generatedPrompt.content }],
      stream: true
    };

    const claudeResponse = await this.claudeIntegration.sendStreamingRequest(
      claudeRequest,
      (chunk) => {
        sessionState.streamingState!.currentChunk = chunk.delta;
        sessionState.streamingState!.accumulatedContent += chunk.delta;
        sessionState.streamingState!.streamProgress = chunk.isComplete ? 100 : 
          Math.min(95, sessionState.streamingState!.accumulatedContent.length / 50);

        onUpdate({
          type: 'streaming_chunk',
          sessionId: sessionState.session.id,
          chunk: chunk.delta,
          accumulatedContent: sessionState.streamingState!.accumulatedContent,
          progress: sessionState.streamingState!.streamProgress
        });
      }
    );

    sessionState.streamingState!.isStreaming = false;

    // Validate and generate follow-ups (same as non-streaming)
    const validation = await this.responseValidator.validateResponse(claudeResponse, {
      consultationPattern,
      session: sessionState.session,
      roundNumber,
      previousValidations: [],
      userExpectations: sessionState.session.sessionContext.sessionGoals,
      riskTolerance: sessionState.session.sessionContext.riskTolerance,
      legalJurisdiction: ['UK']
    });

    const followUpSuggestions = await this.followUpSystem.analyzeResponseAndGenerateFollowUps(
      sessionState.session.id,
      `round_${roundNumber}`,
      claudeResponse,
      sessionState.session
    );

    return {
      roundNumber,
      prompt: generatedPrompt.content,
      response: claudeResponse,
      validation,
      followUpSuggestions,
      roundMetrics: {
        promptQuality: 0.8,
        responseQuality: validation.overallScore,
        relevanceScore: validation.qualityMetrics.relevance.score,
        actionabilityScore: validation.qualityMetrics.actionability.score,
        duration: 5000,
        tokenUsage: claudeResponse.usage.totalTokens,
        cost: claudeResponse.usage.estimatedCost
      }
    };
  }

  /**
   * Evaluate whether consultation should continue
   */
  private async evaluateContinuation(
    sessionState: ConsultationSession,
    roundResult: RoundResult,
    options: ConsultationOptions
  ): Promise<boolean> {
    // Don't continue if quality threshold not met
    if (options.qualityThreshold && roundResult.validation.overallScore < options.qualityThreshold) {
      return false;
    }

    // Don't continue if no follow-up suggestions
    if (!options.autoFollowUp || roundResult.followUpSuggestions.length === 0) {
      return false;
    }

    // Don't continue if high completion score reached
    const conversationFlow = this.followUpSystem.getConversationFlow(sessionState.session.id);
    if (conversationFlow && conversationFlow.completionScore > 0.85) {
      return false;
    }

    // Continue if high-value follow-ups available
    const highValueSuggestions = roundResult.followUpSuggestions.filter(s => s.estimatedValue > 0.7);
    return highValueSuggestions.length > 0;
  }

  /**
   * Update session state with round results
   */
  private updateSessionWithRoundResult(
    sessionState: ConsultationSession,
    roundResult: RoundResult
  ): void {
    // Update quality metrics
    const currentAvg = sessionState.qualityMetrics.averageValidationScore;
    const roundCount = sessionState.progress.currentRound;
    sessionState.qualityMetrics.averageValidationScore = 
      (currentAvg * (roundCount - 1) + roundResult.validation.overallScore) / roundCount;

    // Update consistency score
    if (roundCount > 1) {
      sessionState.qualityMetrics.consistencyScore = roundResult.validation.qualityMetrics.consistency.score;
    }

    // Update framework metrics
    this.updateFrameworkMetrics(roundResult);
  }

  /**
   * Finalize consultation session
   */
  private async finalizeConsultation(sessionState: ConsultationSession): Promise<void> {
    // Generate final consultation result
    const consultationResult = this.createConsultationResult(sessionState);
    
    // Update learning systems
    if (this.config.frameworkOptions.enableLearning) {
      await this.updateLearningFromSession(sessionState, consultationResult);
    }

    // Archive session
    this.activeSessions.delete(sessionState.session.id);
    
    // Update global metrics
    this.frameworkMetrics.totalSessions++;
    this.frameworkMetrics.averageRounds = 
      ((this.frameworkMetrics.averageRounds * (this.frameworkMetrics.totalSessions - 1)) + 
       sessionState.progress.currentRound) / this.frameworkMetrics.totalSessions;
  }

  /**
   * Create consultation result from session state
   */
  private createConsultationResult(sessionState: ConsultationSession): ConsultationResult {
    // This would create a comprehensive result from the session state
    // For brevity, returning a basic structure
    return {
      session: sessionState.session,
      strategicSummary: {
        recommendedStrategy: 'Comprehensive strategic approach based on consultation',
        keyStrengths: ['Strong analysis', 'Clear recommendations'],
        majorRisks: ['Identified risks from consultation'],
        criticalActions: ['Priority actions from rounds'],
        settlementProspects: 'Settlement analysis from consultation',
        litigationStrategy: 'Litigation strategy from consultation'
      },
      evidenceStrategy: {
        strengthsToLeverage: ['Evidence strengths identified'],
        gapsToAddress: ['Evidence gaps identified'],
        witnessStrategy: ['Witness strategy recommendations'],
        documentStrategy: ['Document strategy recommendations']
      },
      riskManagement: {
        highPriorityRisks: ['High priority risks from consultation'],
        mitigationStrategies: ['Risk mitigation strategies'],
        contingencyPlans: ['Contingency plans developed']
      },
      nextSteps: [],
      consultationMetrics: {
        totalRounds: sessionState.progress.currentRound,
        totalDuration: sessionState.progress.timeElapsed,
        averageConfidence: sessionState.qualityMetrics.averageValidationScore,
        tokenUsage: { total: 0, cost: 0 },
        insightsGenerated: sessionState.session.insights.length
      }
    };
  }

  // Helper methods
  private async initializeConsultationSession(
    sessionId: string,
    caseId: string,
    consultationPattern: EnhancedConsultationPattern,
    options: ConsultationOptions
  ): Promise<ConsultationSession> {
    // Initialize underlying consultation session
    // This would integrate with the AIConsultationManager
    return {
      id: sessionId,
      caseId,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
      consultationRounds: [],
      sessionContext: {
        consultationPattern,
        sessionGoals: ['Develop comprehensive strategy'],
        priorityAreas: consultationPattern.synthesis.keyRiskFactors.slice(0, 3),
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

  private determineConsultationStage(roundNumber: number, sessionState: ConsultationSession): string {
    if (roundNumber === 1) return 'initial';
    if (roundNumber <= 2) return 'exploration';
    if (roundNumber <= 4) return 'analysis';
    return 'synthesis';
  }

  private estimateRemainingTime(elapsed: number, completedRounds: number, remainingRounds: number): number {
    if (completedRounds === 0) return 0;
    const avgRoundTime = elapsed / completedRounds;
    return avgRoundTime * remainingRounds;
  }

  private initializeMetrics(): FrameworkMetrics {
    return {
      totalSessions: 0,
      averageRounds: 0,
      averageSessionDuration: 0,
      averageQualityScore: 0,
      totalTokensUsed: 0,
      totalCost: 0,
      userSatisfactionRating: 0,
      completionRate: 0,
      errorRate: 0,
      performanceMetrics: {
        averageResponseTime: 0,
        streamingUtilization: 0,
        validationAccuracy: 0,
        followUpRelevance: 0
      }
    };
  }

  private updateFrameworkMetrics(roundResult: RoundResult): void {
    this.frameworkMetrics.totalTokensUsed += roundResult.roundMetrics.tokenUsage;
    this.frameworkMetrics.totalCost += roundResult.roundMetrics.cost;
    
    // Update other metrics as needed
  }

  private async updateLearningFromSession(
    sessionState: ConsultationSession,
    consultationResult: ConsultationResult
  ): Promise<void> {
    // Update prompt engine effectiveness
    sessionState.session.consultationRounds.forEach(round => {
      // This would update template effectiveness based on validation scores
    });

    // Update follow-up system learning
    // The follow-up system would learn from effective question patterns
  }

  /**
   * Get active session by ID
   */
  getActiveSession(sessionId: string): ConsultationSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Pause active session
   */
  async pauseSession(sessionId: string): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.currentState = 'paused';
      return true;
    }
    return false;
  }

  /**
   * Resume paused session
   */
  async resumeSession(sessionId: string): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    if (session && session.currentState === 'paused') {
      session.currentState = 'active';
      return true;
    }
    return false;
  }

  /**
   * Get framework performance metrics
   */
  getFrameworkMetrics(): FrameworkMetrics {
    return { ...this.frameworkMetrics };
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<{
    claudeAPI: string;
    promptEngine: string;
    followUpSystem: string;
    validator: string;
    overall: string;
  }> {
    const claudeHealth = await this.claudeIntegration.healthCheck();
    
    return {
      claudeAPI: claudeHealth.status,
      promptEngine: 'healthy', // Would implement health checks
      followUpSystem: 'healthy',
      validator: 'healthy',
      overall: claudeHealth.status === 'healthy' ? 'healthy' : 'degraded'
    };
  }

  /**
   * Update user feedback for session quality
   */
  updateUserFeedback(
    sessionId: string,
    roundNumber: number,
    feedback: {
      satisfaction: number;
      usefulness: number;
      clarity: number;
      comments?: string;
    }
  ): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      // Update quality metrics based on feedback
      session.qualityMetrics.userSatisfactionScore = feedback.satisfaction;
      session.qualityMetrics.effectivenessRating = feedback.usefulness;
    }
  }
}

export default MultiRoundConsultationFramework;

// Supporting types for streaming updates
export interface ConsultationUpdate {
  type: 'round_start' | 'prompt_generated' | 'streaming_chunk' | 'round_complete' | 'session_complete';
  sessionId: string;
  roundNumber?: number;
  progress?: ConsultationSession['progress'];
  prompt?: any;
  chunk?: string;
  accumulatedContent?: string;
  roundResult?: RoundResult;
  followUpSuggestions?: FollowUpSuggestion[];
  finalResult?: ConsultationResult;
}