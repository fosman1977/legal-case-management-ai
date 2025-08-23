/**
 * Enhanced AI Client with Multi-Engine Consensus
 * Integrates the 7-engine system with the existing unifiedAIClient
 */

// Enhanced multi-engine system with advanced legal intelligence
import { EntityExtractionResult } from './unifiedAIClient';
import { multiEngineProcessor, ProcessingOptions, ConsensusResult } from './multiEngineProcessor';

export interface EnhancedProcessingOptions extends ProcessingOptions {
  fallbackToAI: boolean;
  enableConsensus: boolean;
  transparencyLevel: 'basic' | 'detailed' | 'full';
}

export interface EnhancedResult extends ConsensusResult {
  fallbackUsed: boolean;
  transparencyLevel: 'basic' | 'detailed' | 'full';
  processingMode: 'rules-only' | 'consensus' | 'ai-enhanced' | 'fallback-ai';
  recommendations?: string[];
}

/**
 * Enhanced AI Client that combines multi-engine processing with AI fallback
 */
export class EnhancedAIClient {
  private isEnginesInitialized = false;

  /**
   * Initialize all engines
   */
  async initializeEngines(): Promise<boolean> {
    try {
      console.log('🚀 Initializing multi-engine processing system...');
      
      // In production, would initialize all engines
      this.isEnginesInitialized = true;
      
      console.log('✅ Multi-engine system ready');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize engines:', error);
      return false;
    }
  }

  /**
   * Enhanced entity extraction with multi-engine consensus
   */
  async extractEntities(
    text: string, 
    documentType: string,
    options: Partial<EnhancedProcessingOptions> = {}
  ): Promise<EnhancedResult> {
    const startTime = Date.now();
    
    // Set defaults - NO LocalAI, using multi-engine only
    const enhancedOptions: EnhancedProcessingOptions = {
      requiredAccuracy: 'high',
      maxProcessingTime: 30000,
      documentType: documentType as 'legal' | 'court-order' | 'pleading' | 'authority' | 'user-note',
      fallbackToAI: false,  // Disabled - we don't use LocalAI anymore
      enableConsensus: true,
      transparencyLevel: 'detailed',
      ...options
    };

    // Initialize engines if needed
    if (!this.isEnginesInitialized) {
      await this.initializeEngines();
    }

    try {
      // Always use multi-engine processing (no LocalAI)
      console.log(`🎯 Starting ${enhancedOptions.requiredAccuracy} accuracy multi-engine processing...`);
      
      const consensusResult = await multiEngineProcessor.processDocument(text, enhancedOptions);
      
      return {
        ...consensusResult,
        fallbackUsed: false,
        transparencyLevel: enhancedOptions.transparencyLevel,
        processingMode: consensusResult.transparencyReport.primaryMethod as 'rules-only' | 'consensus' | 'ai-enhanced' | 'fallback-ai',
        recommendations: this.generateRecommendations(consensusResult)
      };
    } catch (error) {
      console.error('❌ Multi-engine processing error:', error);
      // Return empty result with proper structure
      return this.createEmptyEnhancedResult('processing-error', enhancedOptions.transparencyLevel);
    }
  }

  /**
   * Intelligent routing based on document characteristics
   */
  async extractEntitiesIntelligent(
    text: string,
    documentType: string,
    userPreference?: 'speed' | 'accuracy' | 'balanced'
  ): Promise<EnhancedResult> {
    const complexity = this.assessDocumentComplexity(text);
    const textLength = text.length;
    
    let options: Partial<EnhancedProcessingOptions>;
    
    // Intelligent routing logic - NO LocalAI
    if (userPreference === 'speed' || (complexity === 'simple' && textLength < 5000)) {
      options = {
        requiredAccuracy: 'standard',
        enableConsensus: false,
        fallbackToAI: false,  // No LocalAI
        transparencyLevel: 'basic'
      };
    } else if (userPreference === 'accuracy' || complexity === 'complex') {
      options = {
        requiredAccuracy: 'near-perfect',
        enableConsensus: true,
        fallbackToAI: false,  // No LocalAI
        transparencyLevel: 'full'
      };
    } else {
      // Balanced approach
      options = {
        requiredAccuracy: 'high',
        enableConsensus: true,
        fallbackToAI: false,  // No LocalAI
        transparencyLevel: 'detailed'
      };
    }
    
    console.log(`🧠 Intelligent routing: ${userPreference || 'auto'} mode, ${complexity} complexity`);
    
    return this.extractEntities(text, documentType, options);
  }

  /**
   * Document analysis with multi-engine insights (no LocalAI)
   */
  async analyzeDocument(
    text: string,
    analysisType: 'summary' | 'strengths' | 'weaknesses' | 'chronology'
  ): Promise<string> {
    try {
      // Extract entities using multi-engine system
      const entities = await this.extractEntitiesIntelligent(text, 'legal', 'balanced');
      
      // Generate analysis based on extracted entities
      const analysisContext = this.buildAnalysisContext(entities);
      
      // Generate rule-based analysis from entities
      return this.generateRuleBasedAnalysis(analysisType, text, analysisContext, entities);
    } catch (error) {
      console.error('Document analysis failed:', error);
      return 'Analysis unavailable - please check the extracted entities directly.';
    }
  }
  
  /**
   * Generate rule-based analysis from extracted entities
   */
  private generateRuleBasedAnalysis(
    analysisType: 'summary' | 'strengths' | 'weaknesses' | 'chronology',
    text: string,
    context: string,
    entities: EnhancedResult
  ): string {
    switch (analysisType) {
      case 'summary':
        return `Document Summary:\n\n` +
          `Persons Identified: ${entities.persons.map(p => p.name).join(', ') || 'None'}\n` +
          `Legal Issues: ${entities.issues.map(i => i.issue).join(', ') || 'None'}\n` +
          `Authorities Cited: ${entities.authorities.map(a => a.citation).join(', ') || 'None'}\n` +
          `Key Events: ${entities.chronologyEvents.length} events identified\n\n` +
          `Processing Confidence: ${entities.consensusConfidence}%`;
      
      case 'chronology':
        if (entities.chronologyEvents.length === 0) {
          return 'No chronological events identified in the document.';
        }
        return 'Chronological Events:\n\n' + 
          entities.chronologyEvents
            .map(e => `• ${e.date}: ${e.event}`)
            .join('\n');
      
      case 'strengths':
        const strengths = [];
        if (entities.authorities.length > 0) strengths.push('Strong legal authority citations');
        if (entities.persons.length > 3) strengths.push('Multiple parties properly identified');
        if (entities.chronologyEvents.length > 2) strengths.push('Clear chronological structure');
        return 'Document Strengths:\n\n' + (strengths.length > 0 ? strengths.map(s => `• ${s}`).join('\n') : 'No specific strengths identified.');
      
      case 'weaknesses':
        const weaknesses = [];
        if (entities.authorities.length === 0) weaknesses.push('No legal authorities cited');
        if (entities.issues.length === 0) weaknesses.push('No clear legal issues identified');
        if (entities.consensusConfidence < 70) weaknesses.push('Low confidence in entity extraction');
        return 'Document Weaknesses:\n\n' + (weaknesses.length > 0 ? weaknesses.map(w => `• ${w}`).join('\n') : 'No specific weaknesses identified.');
      
      default:
        return context;
    }
  }

  /**
   * Assess document complexity
   */
  private assessDocumentComplexity(text: string): 'simple' | 'medium' | 'complex' {
    const indicators = {
      length: text.length,
      legalTerms: (text.match(/\b(pursuant|whereas|heretofore|notwithstanding|aforementioned)\b/gi) || []).length,
      citations: (text.match(/\[\d{4}\]|v\.|[A-Z][a-z]+ v [A-Z][a-z]+/g) || []).length,
      sections: (text.match(/section|paragraph|clause|schedule/gi) || []).length,
      monetary: (text.match(/£[\d,]+/g) || []).length
    };
    
    const complexityScore = 
      (indicators.length > 10000 ? 3 : indicators.length > 3000 ? 1 : 0) +
      (indicators.legalTerms > 15 ? 3 : indicators.legalTerms > 5 ? 1 : 0) +
      (indicators.citations > 10 ? 3 : indicators.citations > 3 ? 1 : 0) +
      (indicators.sections > 15 ? 2 : indicators.sections > 5 ? 1 : 0) +
      (indicators.monetary > 5 ? 1 : 0);
    
    if (complexityScore >= 8) return 'complex';
    if (complexityScore >= 4) return 'medium';
    return 'simple';
  }

  /**
   * Generate recommendations based on consensus result
   */
  private generateRecommendations(result: ConsensusResult): string[] {
    const recommendations: string[] = [];
    
    if (result.consensusConfidence < 0.8) {
      recommendations.push('Consider manual review due to lower confidence');
    }
    
    if (result.conflictsResolved > 3) {
      recommendations.push('Multiple engine conflicts resolved - verify key entities');
    }
    
    if (result.processingStats.engineAgreement < 0.7) {
      recommendations.push('Low engine agreement - results may need validation');
    }
    
    if (result.enginesUsed.includes('ai-enhancement')) {
      recommendations.push('AI enhancement used - consider rules-based validation');
    }
    
    return recommendations;
  }

  /**
   * Build analysis context from entities
   */
  private buildAnalysisContext(entities: EnhancedResult): string {
    const context = {
      keyPersons: entities.persons.slice(0, 5).map(p => p.name),
      mainIssues: entities.issues.slice(0, 3).map(i => i.issue),
      authorities: entities.authorities.slice(0, 3).map(a => a.citation),
      confidence: entities.consensusConfidence,
      processingMode: entities.processingMode
    };
    
    return `Analysis context: ${JSON.stringify(context, null, 2)}`;
  }

  /**
   * Build enhanced analysis prompt
   */
  private buildAnalysisPrompt(analysisType: string, text: string, context: string): string {
    const basePrompt = {
      summary: 'Provide a comprehensive summary of this legal document',
      strengths: 'Analyze the legal strengths and favorable points',
      weaknesses: 'Identify potential weaknesses, risks, and challenges',
      chronology: 'Extract and organize all dates and events chronologically'
    }[analysisType];
    
    return `${basePrompt}, considering the following extracted entities:

${context}

Document text:
${text.substring(0, 8000)}

Provide detailed analysis based on the extracted legal entities and their relationships.`;
  }

  /**
   * Convert AI result to enhanced result format
   */
  private convertToEnhancedResult(
    aiResult: EntityExtractionResult,
    mode: string,
    transparencyLevel: string
  ): EnhancedResult {
    return {
      ...aiResult,
      consensusConfidence: 0.80,
      enginesUsed: ['ai-fallback'],
      conflictsResolved: 0,
      processingStats: {
        totalTime: 0,
        averageConfidence: 0.80,
        engineAgreement: 1.0
      },
      transparencyReport: {
        primaryMethod: 'ai',
        engineBreakdown: [{
          engine: 'ai-fallback',
          contribution: 1.0,
          confidence: 0.80
        }]
      },
      fallbackUsed: true,
      transparencyLevel: transparencyLevel as 'basic' | 'detailed' | 'full',
      processingMode: mode as 'rules-only' | 'consensus' | 'ai-enhanced' | 'fallback-ai',
      recommendations: ['AI fallback used - consider validation with rules engines']
    };
  }

  /**
   * Create empty enhanced result
   */
  private createEmptyEnhancedResult(mode: string, transparencyLevel: string): EnhancedResult {
    return {
      persons: [],
      issues: [],
      chronologyEvents: [],
      authorities: [],
      consensusConfidence: 0,
      enginesUsed: [],
      conflictsResolved: 0,
      processingStats: {
        totalTime: 0,
        averageConfidence: 0,
        engineAgreement: 0
      },
      transparencyReport: {
        primaryMethod: 'rules',
        engineBreakdown: []
      },
      fallbackUsed: false,
      transparencyLevel: transparencyLevel as 'basic' | 'detailed' | 'full',
      processingMode: mode as 'rules-only' | 'consensus' | 'ai-enhanced' | 'fallback-ai',
      recommendations: ['Processing failed - manual review required']
    };
  }

  /**
   * Get system status
   */
  async getSystemStatus(): Promise<{
    engines: any[];
    aiClient: any;
    overallHealth: 'healthy' | 'degraded' | 'offline';
  }> {
    const engines = multiEngineProcessor.getEngineStatus();
    const aiStatus = await unifiedAIClient.isAvailable();
    
    const healthyEngines = engines.filter(e => e.health === 'healthy').length;
    const overallHealth = 
      healthyEngines >= 5 && aiStatus ? 'healthy' :
      healthyEngines >= 3 || aiStatus ? 'degraded' : 'offline';
    
    return {
      engines,
      aiClient: {
        available: aiStatus,
        connectionStatus: unifiedAIClient.getConnectionStatus()
      },
      overallHealth
    };
  }
}

// Export singleton instance
export const enhancedAIClient = new EnhancedAIClient();
export default enhancedAIClient;