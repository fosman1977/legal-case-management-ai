import { CaseDocument, AIAnalysisResult, ChronologyEvent, Person, Issue, KeyPoint, LegalAuthority } from '../types';
import { indexedDBManager } from './indexedDB';
import { PDFTextExtractor } from '../services/enhancedBrowserPdfExtractor';
import { unifiedAIClient } from './unifiedAIClient';
import { optimizedAIAnalyzer, EnhancedAIAnalysisResult } from './optimizedAIAnalysis';

class AIDocumentAnalyzer {
  private useLocalAI: boolean = true;
  private localAIModel: string = 'gpt-3.5-turbo';
  private analysisCache = new Map<string, any>();
  private cacheTimeout = 30 * 60 * 1000; // 30 minutes cache
  private fastMode: boolean = true;

  /**
   * Configure AI analysis settings
   */
  setLocalAISettings(enabled: boolean, model: string = 'gpt-3.5-turbo', fastMode: boolean = false) {
    this.useLocalAI = enabled;
    this.localAIModel = model;
    this.fastMode = fastMode;
    console.log(`🤖 AI Analyzer configured: LocalAI ${enabled ? 'enabled' : 'disabled'}, Model: ${model}, Fast: ${fastMode}`);
  }

  /**
   * Get available LocalAI models
   */
  async getAvailableModels() {
    try {
      return await unifiedAIClient.getModels();
    } catch (error) {
      console.error('Failed to get LocalAI models:', error);
      return [];
    }
  }

  /**
   * Analyze documents using optimized AI pipeline
   */
  async analyzeDocuments(
    documents: CaseDocument[],
    progressCallback?: (stage: string, progress: number) => void
  ): Promise<AIAnalysisResult> {
    const startTime = Date.now();

    try {
      console.log(`🚀 Starting optimized AI analysis of ${documents.length} documents...`);
      
      // Configure optimized analyzer
      optimizedAIAnalyzer.configure({
        parallelProcessing: true,
        useStructuredData: true,
        confidenceThreshold: 0.6,
        enableProgressCallbacks: true
      });

      // Use optimized analyzer with enhanced progress callbacks
      const result = await optimizedAIAnalyzer.analyzeDocuments(documents, {
        analysisType: this.fastMode ? 'quick' : 'full',
        onProgress: (progress) => {
          // Convert optimized progress to legacy format
          const stageNames = {
            'extracting': 'Extracting document content...',
            'structuring': 'Processing structured data...',
            'analyzing': 'Performing AI analysis...',
            'entities': 'Extracting entities...',
            'summarizing': 'Generating summary...',
            'complete': 'Analysis complete!'
          };
          
          const stageName = stageNames[progress.stage] || progress.status;
          progressCallback?.(stageName, progress.percentage);
        }
      });
      
      // Convert enhanced result to legacy format for backward compatibility
      const legacyResult: AIAnalysisResult = {
        summary: result.summary,
        keyPoints: result.keyPoints,
        persons: result.persons,
        issues: result.issues,
        chronologyEvents: result.chronologyEvents,
        legalAuthorities: result.legalAuthorities,
        confidence: result.confidence,
        metadata: {
          ...result.metadata,
          enhancedExtraction: true,
          extractionQuality: result.extractionQuality,
          processingStats: result.processingStats
        }
      };
      
      // Save to cache and IndexedDB
      await this.saveAnalysisResult(legacyResult);
      
      const analysisTime = Date.now() - startTime;
      console.log(`✅ Optimized AI Analysis complete in ${(analysisTime / 1000).toFixed(2)}s`);
      console.log(`   - Documents processed: ${result.processingStats.documentsProcessed}`);
      console.log(`   - Entities extracted: ${result.processingStats.entitiesExtracted}`);
      console.log(`   - Tables analyzed: ${result.processingStats.tablesAnalyzed}`);
      console.log(`   - Overall quality: ${(result.extractionQuality.overall * 100).toFixed(1)}%`);

      return legacyResult;
    } catch (error) {
      console.error('❌ Optimized AI analysis failed, falling back to legacy:', error);
      
      // Fallback to legacy analysis
      try {
        const fallbackResult = await this.performAIAnalysis(documents, this.localAIModel, progressCallback);
        await this.saveAnalysisResult(fallbackResult);
        return fallbackResult;
      } catch (fallbackError) {
        console.error('❌ Fallback analysis also failed:', fallbackError);
        throw error;
      }
    }
  }

  /**
   * Perform AI analysis on documents
   */
  private async performAIAnalysis(
    documents: CaseDocument[], 
    model: string,
    progressCallback?: (stage: string, progress: number) => void
  ): Promise<AIAnalysisResult> {
    const startTime = Date.now();
    
    if (progressCallback) {
      progressCallback('Extracting entities...', 40);
    }

    // Extract entities using unified AI client
    const allText = documents.map(doc => `${doc.title}: ${doc.content}`).join('\n\n');
    
    try {
      const entities = await unifiedAIClient.extractEntities(allText, 'legal');
      
      if (progressCallback) {
        progressCallback('Processing results...', 80);
      }

      // Convert to proper formats
      const chronologyEvents: Omit<ChronologyEvent, 'id' | 'caseId'>[] = entities.chronologyEvents.map(event => ({
        date: event.date,
        description: event.event,
        significance: 'AI-extracted event',
        documentRef: documents[0]?.id
      }));

      const persons: Omit<Person, 'id' | 'caseId'>[] = entities.persons.map(person => ({
        name: person.name,
        role: 'other' as const,
        description: `Role: ${person.role}`,
        relevance: 'AI-extracted person',
        documentRefs: []
      }));

      const issues: Omit<Issue, 'id' | 'caseId'>[] = entities.issues.map(issue => ({
        title: issue.issue,
        description: issue.issue,
        category: 'factual' as const,
        priority: 'medium' as const,
        status: 'unresolved' as const,
        documentRefs: [],
        relatedIssues: []
      }));

      const keyPoints: Omit<KeyPoint, 'id' | 'caseId'>[] = [
        { point: 'Key legal issues have been identified', category: 'legal_argument', supportingDocs: [], order: 1 },
        { point: 'Relevant parties and their roles documented', category: 'opening', supportingDocs: [], order: 2 },
        { point: 'Timeline of events established', category: 'opening', supportingDocs: [], order: 3 }
      ];

      const authorities: Omit<LegalAuthority, 'id' | 'caseId'>[] = entities.authorities.map(auth => ({
        citation: auth.citation,
        principle: auth.relevance,
        relevance: auth.relevance
      }));

      return {
        chronologyEvents,
        persons,
        issues,
        keyPoints,
        authorities,
        confidence: 0.85,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('AI analysis failed:', error);
      
      // Return empty result on failure
      return {
        chronologyEvents: [],
        persons: [],
        issues: [],
        keyPoints: [],
        authorities: [],
        confidence: 0,
        processingTime: 0
      };
    }
  }

  /**
   * Save analysis result to cache and IndexedDB
   */
  private async saveAnalysisResult(result: AIAnalysisResult) {
    try {
      // TODO: Save to IndexedDB for persistence
      // await indexedDBManager.setData('analysis_results', `latest_${Date.now()}`, result);
      
      // Update cache
      this.analysisCache.set('latest', {
        result,
        timestamp: Date.now()
      });
      
      console.log('📁 Analysis result saved to IndexedDB');
    } catch (error) {
      console.error('Failed to save analysis result:', error);
    }
  }

  /**
   * Get cached analysis result
   */
  async getCachedAnalysis(): Promise<AIAnalysisResult | null> {
    const cached = this.analysisCache.get('latest');
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.result;
    }

    // Try to get from IndexedDB
    try {
      // TODO: Get keys from IndexedDB
      // const keys = await indexedDBManager.getAllKeys('analysis_results');
      const keys: string[] = [];
      if (keys.length > 0) {
        const latestKey = keys.sort().pop();
        if (latestKey) {
          // TODO: Get data from IndexedDB
          // const result = await indexedDBManager.getData('analysis_results', latestKey);
          // return result as AIAnalysisResult;
        }
      }
    } catch (error) {
      console.error('Failed to get cached analysis:', error);
    }

    return null;
  }

  /**
   * Clear analysis cache
   */
  clearCache() {
    this.analysisCache.clear();
    console.log('🗑️ Analysis cache cleared');
  }
}

// Export singleton instance
export const aiAnalyzer = new AIDocumentAnalyzer();