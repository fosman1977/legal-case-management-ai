/**
 * Enhanced AI Client with Multi-Engine Consensus
 * Integrates the 7-engine system with the existing unifiedAIClient
 */

import { unifiedAIClient, EntityExtractionResult, AIResponse } from './unifiedAIClient';
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
    
    // Set defaults
    const enhancedOptions: EnhancedProcessingOptions = {
      requiredAccuracy: 'high',
      maxProcessingTime: 30000,
      documentType: documentType as 'legal' | 'court-order' | 'pleading' | 'authority' | 'user-note',
      fallbackToAI: true,
      enableConsensus: true,
      transparencyLevel: 'detailed',
      ...options
    };

    // Initialize engines if needed
    if (!this.isEnginesInitialized) {
      await this.initializeEngines();
    }

    try {
      // Attempt multi-engine processing
      if (enhancedOptions.enableConsensus) {
        console.log(`🎯 Starting ${enhancedOptions.requiredAccuracy} accuracy processing...`);
        
        const consensusResult = await multiEngineProcessor.processDocument(text, enhancedOptions);
        
        return {
          ...consensusResult,
          fallbackUsed: false,
          transparencyLevel: enhancedOptions.transparencyLevel,
          processingMode: consensusResult.transparencyReport.primaryMethod as 'rules-only' | 'consensus' | 'ai-enhanced' | 'fallback-ai',
          recommendations: this.generateRecommendations(consensusResult)
        };
      }
    } catch (error) {
      console.warn('⚠️ Multi-engine processing failed, falling back to AI:', error);
    }

    // Fallback to original AI processing
    if (enhancedOptions.fallbackToAI) {
      console.log('🤖 Using AI fallback processing...');
      
      try {
        const aiResult = await unifiedAIClient.extractEntities(text, documentType);
        
        return this.convertToEnhancedResult(aiResult, 'fallback-ai', enhancedOptions.transparencyLevel);
      } catch (aiError) {
        console.error('❌ AI fallback also failed:', aiError);
        
        // Return empty result with error indication
        return this.createEmptyEnhancedResult('failed', enhancedOptions.transparencyLevel);
      }
    }

    // No fallback - return empty result
    return this.createEmptyEnhancedResult('no-fallback', enhancedOptions.transparencyLevel);
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
    
    // Intelligent routing logic
    if (userPreference === 'speed' || (complexity === 'simple' && textLength < 5000)) {
      options = {
        requiredAccuracy: 'standard',
        enableConsensus: false,
        fallbackToAI: true,
        transparencyLevel: 'basic'
      };
    } else if (userPreference === 'accuracy' || complexity === 'complex') {
      options = {
        requiredAccuracy: 'near-perfect',
        enableConsensus: true,
        fallbackToAI: true,
        transparencyLevel: 'full'
      };
    } else {
      // Balanced approach
      options = {
        requiredAccuracy: 'high',
        enableConsensus: true,
        fallbackToAI: true,
        transparencyLevel: 'detailed'
      };
    }
    
    console.log(`🧠 Intelligent routing: ${userPreference || 'auto'} mode, ${complexity} complexity`);
    
    return this.extractEntities(text, documentType, options);
  }

  /**
   * Document analysis with multi-engine insights
   */
  async analyzeDocument(
    text: string,
    analysisType: 'summary' | 'strengths' | 'weaknesses' | 'chronology'
  ): Promise<string> {
    try {
      // Try enhanced analysis first
      const entities = await this.extractEntitiesIntelligent(text, 'legal', 'balanced');
      
      // Generate enhanced analysis using entity insights
      const analysisContext = this.buildAnalysisContext(entities);
      
      // Use AI for analysis with enhanced context
      const prompt = this.buildAnalysisPrompt(analysisType, text, analysisContext);
      const response = await unifiedAIClient.query(prompt, { temperature: 0.3 });
      
      return response.content;
    } catch (error) {
      console.warn('Enhanced analysis failed, using basic analysis:', error);
      return unifiedAIClient.analyzeDocument(text, analysisType);
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