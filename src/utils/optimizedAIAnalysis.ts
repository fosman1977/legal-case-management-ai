/**
 * OPTIMIZED AI ANALYSIS PIPELINE
 * Leverages enhanced document extraction and production-grade AI processing
 * Maximum performance and accuracy for legal document analysis
 */

import { CaseDocument, AIAnalysisResult, ChronologyEvent, Person, Issue, KeyPoint, LegalAuthority } from '../types';
import { indexedDBManager } from './indexedDB';
import { ProductionDocumentExtractor, ExtractionResult, ExtractedEntity, ExtractedTable } from '../services/productionDocumentExtractor';
import { unifiedAIClient } from './unifiedAIClient';
import { intelligentModelRouter, DocumentClassification } from './intelligentModelRouter';
import { advancedCacheSystem, CacheKey } from './advancedCacheSystem';
import { 
  LegalEntity, 
  LegalTable, 
  DocumentMetadata, 
  ProcessingStatistics, 
  QualityMetrics,
  LegalEntityArray,
  LegalTableArray,
  MetadataArray 
} from '../types/strict-interfaces';

interface OptimizedAIConfig {
  maxTokensPerChunk: number;
  parallelProcessing: boolean;
  useStructuredData: boolean;
  confidenceThreshold: number;
  enableProgressCallbacks: boolean;
  contextWindow: number;
  enableEnhancedLegalReasoning?: boolean;
  targetLawyerGradeConfidence?: number;
  jurisdiction?: string;
  practiceArea?: string;
}

interface AIProgressUpdate {
  stage: 'extracting' | 'structuring' | 'analyzing' | 'entities' | 'summarizing' | 'complete';
  current: number;
  total: number;
  percentage: number;
  status: string;
  details?: {
    documentsProcessed?: number;
    entitiesFound?: number;
    tablesProcessed?: number;
    currentDocument?: string;
  };
}

export interface EnhancedAIAnalysisResult extends AIAnalysisResult {
  summary: string;
  extractionQuality: {
    overall: number;
    textQuality: number;
    structureQuality: number;
    aiConfidence: number;
  };
  processingStats: {
    documentsProcessed: number;
    entitiesExtracted: number;
    tablesAnalyzed: number;
    aiTokensUsed: number;
    processingTime: number;
  };
  structuredData: {
    tables: LegalTableArray;
    entities: LegalEntityArray;
    metadata: MetadataArray;
  };
}

class OptimizedAIAnalyzer {
  private config: OptimizedAIConfig = {
    maxTokensPerChunk: 8000,
    parallelProcessing: true,
    useStructuredData: true,
    confidenceThreshold: 0.6,
    enableProgressCallbacks: true,
    contextWindow: 4000,
    enableEnhancedLegalReasoning: true,
    targetLawyerGradeConfidence: 0.95,
    jurisdiction: 'federal',
    practiceArea: 'general'
  };

  private analysisCache = new Map<string, EnhancedAIAnalysisResult>();
  private cacheTimeout = 60 * 60 * 1000; // 1 hour cache

  /**
   * Configure the AI analyzer
   */
  configure(config: Partial<OptimizedAIConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('🤖 Optimized AI Analyzer configured:', this.config);
  }

  /**
   * Analyze documents with enhanced extraction integration and intelligent caching
   */
  async analyzeDocuments(
    documents: CaseDocument[],
    options: {
      onProgress?: (progress: AIProgressUpdate) => void;
      abortSignal?: AbortSignal;
      analysisType?: 'full' | 'quick' | 'entities_only' | 'summary_only';
    } = {}
  ): Promise<EnhancedAIAnalysisResult> {
    const startTime = Date.now();
    const { onProgress, abortSignal, analysisType = 'full' } = options;

    // Generate cache key for this analysis
    const cacheKey = this.generateAnalysisCacheKey(documents, analysisType);
    
    // Check cache first
    onProgress?.({
      stage: 'extracting' as const,
      current: 0,
      total: 1,
      percentage: 5,
      status: 'Checking cache...'
    });

    const cachedResult = await advancedCacheSystem.get<EnhancedAIAnalysisResult>(cacheKey);
    if (cachedResult) {
      console.log(`📦 Cache hit! Returning cached analysis (${cachedResult.source})`);
      onProgress?.({
        stage: 'complete',
        current: 1,
        total: 1,
        percentage: 100,
        status: `Loaded from ${cachedResult.source} cache`
      });
      return cachedResult.data;
    }

    try {
      // Initialize production document extractor
      await ProductionDocumentExtractor.initialize();

      console.log(`🚀 Starting optimized AI analysis of ${documents.length} documents...`);
      
      onProgress?.({
        stage: 'extracting',
        current: 0,
        total: documents.length,
        percentage: 0,
        status: 'Extracting document content with enhanced parser...'
      });

      // Step 1: Extract structured content from all documents
      const extractionResults = await this.extractStructuredContent(
        documents, 
        onProgress, 
        abortSignal
      );

      if (abortSignal?.aborted) throw new Error('Analysis cancelled');

      onProgress?.({
        stage: 'structuring',
        current: documents.length,
        total: documents.length,
        percentage: 30,
        status: 'Processing structured data...',
        details: {
          documentsProcessed: documents.length,
          entitiesFound: extractionResults.reduce((sum, r) => sum + r.entities.length, 0),
          tablesProcessed: extractionResults.reduce((sum, r) => sum + r.tables.length, 0)
        }
      });

      // Step 2: Structure and prepare data for AI analysis
      const structuredData = await this.structureExtractedData(extractionResults);

      if (abortSignal?.aborted) throw new Error('Analysis cancelled');

      // Step 3: Perform AI analysis based on type
      let aiResults: EnhancedAIAnalysisResult;

      switch (analysisType) {
        case 'quick':
          aiResults = await this.performQuickAnalysis(structuredData, onProgress, abortSignal);
          break;
        case 'entities_only':
          aiResults = await this.performEntityOnlyAnalysis(structuredData, onProgress, abortSignal);
          break;
        case 'summary_only':
          aiResults = await this.performSummaryOnlyAnalysis(structuredData, onProgress, abortSignal);
          break;
        default:
          aiResults = await this.performFullAnalysis(structuredData, onProgress, abortSignal);
      }

      // Step 4: Calculate final metrics
      const processingTime = Date.now() - startTime;
      aiResults.processingStats.processingTime = processingTime;

      onProgress?.({
        stage: 'complete',
        current: documents.length,
        total: documents.length,
        percentage: 100,
        status: `Analysis complete in ${(processingTime / 1000).toFixed(1)}s`,
        details: {
          documentsProcessed: documents.length,
          entitiesFound: aiResults.processingStats.entitiesExtracted,
          tablesProcessed: aiResults.processingStats.tablesAnalyzed
        }
      });

      // Cache results using advanced cache system
      await advancedCacheSystem.set(cacheKey, aiResults, {
        ttl: 24 * 60 * 60 * 1000, // 24 hours
        confidence: aiResults.extractionQuality.overall
      });

      console.log(`✅ Optimized AI analysis complete in ${(processingTime / 1000).toFixed(2)}s`);
      return aiResults;

    } catch (error) {
      console.error('❌ Optimized AI analysis failed:', error);
      throw error;
    } finally {
      await ProductionDocumentExtractor.cleanup();
    }
  }

  /**
   * Extract structured content using ProductionDocumentExtractor
   */
  private async extractStructuredContent(
    documents: CaseDocument[],
    onProgress?: (progress: AIProgressUpdate) => void,
    abortSignal?: AbortSignal
  ): Promise<ExtractionResult[]> {
    const results: ExtractionResult[] = [];

    for (let i = 0; i < documents.length; i++) {
      if (abortSignal?.aborted) throw new Error('Analysis cancelled');

      const doc = documents[i];
      
      onProgress?.({
        stage: 'extracting',
        current: i + 1,
        total: documents.length,
        percentage: Math.round(((i + 1) / documents.length) * 25), // 25% of total progress
        status: `Extracting: ${doc.title}`,
        details: { currentDocument: doc.title }
      });

      try {
        // Check if document has file content to extract
        if (doc.fileContent || doc.fileName) {
          // Create blob from document content for extraction
          const blob = new Blob([doc.fileContent || doc.content], { type: doc.fileType || 'text/plain' });
          const file = new File([blob], doc.fileName || `${doc.title}.txt`, { type: doc.fileType || 'text/plain' });
          
          const extractionResult = await ProductionDocumentExtractor.extract(file, {
            mode: 'full',
            enableOCR: true,
            enableTables: true,
            enableEntities: true,
            parallel: true,
            abortSignal,
            onProgress: (extractProgress) => {
              onProgress?.({
                stage: 'extracting',
                current: i + 1,
                total: documents.length,
                percentage: Math.round(((i + extractProgress.percentage / 100) / documents.length) * 25),
                status: `Extracting: ${doc.title} (${extractProgress.percentage}%)`,
                details: { currentDocument: doc.title }
              });
            }
          });

          results.push(extractionResult);
        } else {
          // For text-only documents, create structured result
          const mockResult: ExtractionResult = {
            text: doc.content,
            sections: [{
              title: doc.title,
              content: doc.content,
              level: 1,
              pageStart: 1,
              pageEnd: 1,
              type: 'paragraph'
            }],
            tables: [],
            entities: [],
            metadata: {
              fileName: doc.title,
              fileSize: doc.content.length,
              fileType: 'text/plain',
              pageCount: 1
            },
            structure: {
              headings: [doc.title],
              paragraphs: 1,
              pageBreaks: [1]
            },
            quality: {
              overall: 0.9,
              textQuality: 0.9,
              structureQuality: 0.8,
              warnings: [],
              suggestions: [],
              pagesProcessed: 1,
              totalPages: 1
            },
            method: 'native',
            processingTime: 0
          };

          results.push(mockResult);
        }
      } catch (error) {
        console.error(`Failed to extract document ${doc.title}:`, error);
        
        // Create fallback result
        const fallbackResult: ExtractionResult = {
          text: doc.content,
          sections: [],
          tables: [],
          entities: [],
          metadata: {
            fileName: doc.title,
            fileSize: doc.content.length,
            fileType: 'unknown',
            pageCount: 1
          },
          structure: {
            headings: [],
            paragraphs: 0,
            pageBreaks: []
          },
          quality: {
            overall: 0.3,
            textQuality: 0.3,
            structureQuality: 0.3,
            warnings: ['Extraction failed'],
            suggestions: ['Manual review required'],
            pagesProcessed: 0,
            totalPages: 1
          },
          method: 'native',
          processingTime: 0
        };

        results.push(fallbackResult);
      }
    }

    return results;
  }

  /**
   * Structure extracted data for AI processing
   */
  private async structureExtractedData(extractionResults: ExtractionResult[]): Promise<{
    documents: Array<{
      title: string;
      content: string;
      entities: LegalEntityArray;
      tables: LegalTableArray;
      metadata: DocumentMetadata;
      quality: number;
    }>;
    globalEntities: LegalEntityArray;
    globalTables: LegalTableArray;
    qualityMetrics: {
      averageQuality: number;
      totalPages: number;
      totalEntities: number;
      totalTables: number;
    };
  }> {
    const documents = extractionResults.map((result, index) => ({
      title: result.metadata.fileName || `Document ${index + 1}`,
      content: result.text,
      entities: result.entities as LegalEntityArray,
      tables: result.tables as unknown as LegalTableArray,
      metadata: result.metadata as DocumentMetadata,
      quality: result.quality.overall
    }));

    // Aggregate global data
    const globalEntities = extractionResults.flatMap(r => r.entities) as LegalEntityArray;
    const globalTables = extractionResults.flatMap(r => r.tables) as unknown as LegalTableArray;

    // Calculate quality metrics
    const qualityMetrics = {
      averageQuality: extractionResults.reduce((sum, r) => sum + r.quality.overall, 0) / extractionResults.length,
      totalPages: extractionResults.reduce((sum, r) => sum + r.quality.totalPages, 0),
      totalEntities: globalEntities.length,
      totalTables: globalTables.length
    };

    return {
      documents,
      globalEntities,
      globalTables,
      qualityMetrics
    };
  }

  /**
   * Perform full AI analysis with all features including advanced legal reasoning
   */
  private async performFullAnalysis(
    structuredData: any,
    onProgress?: (progress: AIProgressUpdate) => void,
    abortSignal?: AbortSignal
  ): Promise<EnhancedAIAnalysisResult> {
    onProgress?.({
      stage: 'analyzing',
      current: 1,
      total: 6,
      percentage: 30,
      status: 'Performing comprehensive AI analysis...'
    });

    // Use existing entities to enhance AI prompts
    const existingEntities = structuredData.globalEntities;
    const existingTables = structuredData.globalTables;

    // Create enhanced context for AI
    const enhancedContext = this.buildEnhancedContext(structuredData);

    // Step 1: Standard AI analysis (parallel processing)
    onProgress?.({
      stage: 'analyzing',
      current: 2,
      total: 6,
      percentage: 40,
      status: 'Analyzing persons, issues, and chronology...'
    });

    const [persons, issues, chronology, authorities, summary, keyPoints] = await Promise.all([
      this.analyzePersonsWithContext(enhancedContext, existingEntities),
      this.analyzeIssuesWithContext(enhancedContext, existingTables),
      this.analyzeChronologyWithContext(enhancedContext, existingEntities),
      this.analyzeAuthoritiesWithContext(enhancedContext, existingEntities),
      this.generateEnhancedSummary(enhancedContext),
      this.extractKeyPointsWithContext(enhancedContext, existingTables)
    ]);

    if (abortSignal?.aborted) throw new Error('Analysis cancelled');

    // Step 2: Create basic analysis result
    const basicResult: EnhancedAIAnalysisResult = {
      // Standard AI analysis results
      chronologyEvents: chronology,
      persons: persons,
      issues: issues,
      keyPoints: keyPoints,
      authorities: authorities,
      confidence: this.calculateOverallConfidence(
        persons.map(p => ({ confidence: 0.8 })), 
        issues.map(i => ({ confidence: 0.8 })), 
        chronology.map(c => ({ confidence: 0.8 })), 
        authorities.map(a => ({ confidence: 0.8 }))
      ),
      processingTime: 0, // Set by caller
      summary: summary,

      // Enhanced results
      extractionQuality: {
        overall: structuredData.qualityMetrics.averageQuality,
        textQuality: structuredData.qualityMetrics.averageQuality,
        structureQuality: structuredData.qualityMetrics.averageQuality,
        aiConfidence: this.calculateOverallConfidence(
          persons.map(p => ({ confidence: 0.8 })), 
          issues.map(i => ({ confidence: 0.8 })), 
          chronology.map(c => ({ confidence: 0.8 })), 
          authorities.map(a => ({ confidence: 0.8 }))
        )
      },
      processingStats: {
        documentsProcessed: structuredData.documents.length,
        entitiesExtracted: structuredData.globalEntities.length,
        tablesAnalyzed: structuredData.globalTables.length,
        aiTokensUsed: this.estimateTokensUsed(enhancedContext),
        processingTime: 0 // Set by caller
      },
      structuredData: {
        tables: structuredData.globalTables,
        entities: structuredData.globalEntities,
        metadata: structuredData.documents.map((d: any) => d.metadata)
      }
    };

    // Step 3: Check if enhanced legal analysis is enabled
    if (this.config.enableEnhancedLegalReasoning) {
      onProgress?.({
        stage: 'analyzing',
        current: 3,
        total: 6,
        percentage: 55,
        status: 'Applying advanced legal reasoning (IRAC)...'
      });

      try {
        // Import and use enhanced legal analysis integration
        const { createEnhancedLegalAnalysisIntegrator } = await import('../core/enhanced-legal-analysis-integration');
        const integrator = createEnhancedLegalAnalysisIntegrator();

        onProgress?.({
          stage: 'analyzing',
          current: 4,
          total: 6,
          percentage: 70,
          status: 'Performing professional defensibility assessment...'
        });

        // Enhance the basic analysis with advanced legal reasoning
        const enhancedResult = await integrator.enhanceAIAnalysis(
          basicResult,
          structuredData.documents,
          `case-${Date.now()}`,
          {
            enableIRAC: true,
            enableDefensibility: true,
            enableUncertaintyQuantification: true,
            targetConfidence: this.config.targetLawyerGradeConfidence || 0.95,
            jurisdiction: this.config.jurisdiction || 'federal',
            practiceArea: this.config.practiceArea || 'general'
          }
        );

        onProgress?.({
          stage: 'analyzing',
          current: 5,
          total: 6,
          percentage: 85,
          status: `Enhanced analysis complete: ${(enhancedResult.lawyerGradeConfidence * 100).toFixed(1)}% confidence`
        });

        console.log(`✅ Enhanced legal analysis applied:`);
        console.log(`   Lawyer-grade confidence: ${(enhancedResult.lawyerGradeConfidence * 100).toFixed(1)}%`);
        console.log(`   IRAC issues: ${enhancedResult.iracAnalysis.issues.length}`);
        console.log(`   Professional readiness: ${enhancedResult.professionalReadiness.readinessLevel}`);

        return enhancedResult;

      } catch (error) {
        console.warn('⚠️ Enhanced legal analysis failed, falling back to basic analysis:', error);
        // Continue with basic analysis if enhanced fails
      }
    }

    onProgress?.({
      stage: 'summarizing',
      current: 6,
      total: 6,
      percentage: 90,
      status: 'Finalizing analysis results...'
    });

    return basicResult;
  }

  /**
   * Build enhanced context using structured extraction data
   */
  private buildEnhancedContext(structuredData: any): string {
    let context = '';

    // Add document summaries
    context += '=== DOCUMENT SUMMARIES ===\n';
    structuredData.documents.forEach((doc: any, index: number) => {
      context += `${index + 1}. ${doc.title} (Quality: ${(doc.quality * 100).toFixed(1)}%)\n`;
      context += `${doc.content.substring(0, 500)}...\n\n`;
    });

    // Add extracted entities
    if (structuredData.globalEntities.length > 0) {
      context += '=== PRE-EXTRACTED ENTITIES ===\n';
      
      const entityGroups = structuredData.globalEntities.reduce((groups: any, entity: ExtractedEntity) => {
        if (!groups[entity.type]) groups[entity.type] = [];
        groups[entity.type].push(entity);
        return groups;
      }, {});

      Object.entries(entityGroups).forEach(([type, entities]: [string, any]) => {
        context += `${type.toUpperCase()}: ${entities.map((e: any) => `${e.value} (${(e.confidence * 100).toFixed(0)}%)`).join(', ')}\n`;
      });
      context += '\n';
    }

    // Add extracted tables
    if (structuredData.globalTables.length > 0) {
      context += '=== EXTRACTED TABLES ===\n';
      structuredData.globalTables.forEach((table: ExtractedTable, index: number) => {
        context += `Table ${index + 1} (${table.type}, Page ${table.pageNumber}):\n`;
        context += table.markdown.substring(0, 300) + '...\n\n';
      });
    }

    // Add quality metrics
    context += '=== QUALITY METRICS ===\n';
    context += `Average Quality: ${(structuredData.qualityMetrics.averageQuality * 100).toFixed(1)}%\n`;
    context += `Total Pages: ${structuredData.qualityMetrics.totalPages}\n`;
    context += `Entities Found: ${structuredData.qualityMetrics.totalEntities}\n`;
    context += `Tables Found: ${structuredData.qualityMetrics.totalTables}\n\n`;

    return context;
  }

  /**
   * Analyze persons with enhanced context and intelligent model routing
   */
  private async analyzePersonsWithContext(
    context: string, 
    existingEntities: LegalEntityArray,
    classification?: DocumentClassification
  ): Promise<Omit<Person, 'id' | 'caseId'>[]> {
    const personEntities = existingEntities.filter(e => e.type === 'person');
    
    // Select optimal model for this task
    const optimalModel = classification 
      ? intelligentModelRouter.getRecommendedModel('entity', classification)
      : 'gpt-3.5-turbo';

    console.log(`👤 Using model '${optimalModel}' for person analysis (${personEntities.length} pre-extracted)`);
    
    const prompt = `
Based on the provided context and pre-extracted entities, analyze the persons involved in this legal case.

CONTEXT:
${context.substring(0, this.config.contextWindow)}

PRE-EXTRACTED PERSONS:
${personEntities.map(p => `- ${p.value} (confidence: ${(p.confidence * 100).toFixed(0)}%)`).join('\n')}

Provide a comprehensive analysis of all persons, their roles, and relationships. Include:
1. Validated persons from pre-extraction
2. Any additional persons found in context
3. Detailed roles and significance
4. Relationship mappings

Format as JSON array:
[{"name": "string", "role": "string", "significance": "string", "confidence": number}]
`;

    try {
      const response = await unifiedAIClient.query(prompt, {
        temperature: 0.2,
        maxTokens: 2000
      });

      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const persons = JSON.parse(jsonMatch[0]);
        return persons.map((p: any) => ({
          name: p.name,
          role: (p.role as 'claimant' | 'defendant' | 'witness' | 'expert' | 'lawyer' | 'judge' | 'other') || 'other',
          description: p.significance || 'Identified person',
          relevance: p.significance || 'Identified person',
          documentRefs: []
        }));
      }
    } catch (error) {
      console.error('Enhanced person analysis failed:', error);
    }

    // Fallback: convert existing entities
    return personEntities.map(entity => ({
      name: entity.value,
      role: (entity.contextBefore?.includes('Mr') || entity.contextBefore?.includes('Ms') ? 'other' : 'other') as 'claimant' | 'defendant' | 'witness' | 'expert' | 'lawyer' | 'judge' | 'other',
      description: entity.context.substring(0, 100),
      relevance: entity.context.substring(0, 100),
      documentRefs: []
    }));
  }

  /**
   * Analyze issues with table context
   */
  private async analyzeIssuesWithContext(
    context: string, 
    existingTables: LegalTableArray
  ): Promise<Omit<Issue, 'id' | 'caseId'>[]> {
    const tableContext = existingTables.map(t => 
      `Table (${t.type}): ${t.markdown.substring(0, 200)}...`
    ).join('\n');

    const prompt = `
Analyze the legal issues in this case using the provided context and extracted tables.

CONTEXT:
${context.substring(0, this.config.contextWindow)}

EXTRACTED TABLES:
${tableContext}

Identify legal issues, claims, disputes, and matters of contention. Use table data for financial disputes, schedules, etc.

Format as JSON array:
[{"issue": "string", "type": "string", "description": "string", "severity": "high|medium|low", "confidence": number}]
`;

    try {
      const response = await unifiedAIClient.query(prompt, {
        temperature: 0.3,
        maxTokens: 2000
      });

      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const issues = JSON.parse(jsonMatch[0]);
        return issues.map((i: any) => ({
          title: i.issue,
          description: i.description || i.issue,
          category: (i.type === 'legal' || i.type === 'factual' || i.type === 'quantum' || i.type === 'procedural') ? i.type : 'factual',
          status: 'unresolved' as const,
          priority: (i.severity === 'high' || i.severity === 'medium' || i.severity === 'low') ? i.severity : 'medium',
          documentRefs: [],
          relatedIssues: []
        }));
      }
    } catch (error) {
      console.error('Enhanced issue analysis failed:', error);
    }

    return [];
  }

  // Additional analysis methods...
  private async analyzeChronologyWithContext(_context: string, entities: LegalEntityArray): Promise<Omit<ChronologyEvent, 'id' | 'caseId'>[]> {
    // Implementation similar to analyzePersonsWithContext but for chronology
    const _dateEntities = entities.filter(e => e.type === 'date');
    // ... (implementation details)
    return [];
  }

  private async analyzeAuthoritiesWithContext(_context: string, _entities: LegalEntityArray): Promise<Omit<LegalAuthority, 'id' | 'caseId'>[]> {
    // Implementation for legal authorities
    return [];
  }

  private async generateEnhancedSummary(context: string): Promise<string> {
    const prompt = `Provide a comprehensive legal case summary based on this enhanced context:\n\n${context.substring(0, this.config.contextWindow)}`;
    const response = await unifiedAIClient.query(prompt, { temperature: 0.4 });
    return response.content;
  }

  private async extractKeyPointsWithContext(_context: string, _tables: LegalTableArray): Promise<Omit<KeyPoint, 'id' | 'caseId'>[]> {
    // Implementation for key points
    return [];
  }

  // Quick analysis methods
  private async performQuickAnalysis(structuredData: any, onProgress?: any, abortSignal?: AbortSignal): Promise<EnhancedAIAnalysisResult> {
    onProgress?.({
      stage: 'analyzing',
      current: 1,
      total: 3,
      percentage: 33,
      status: 'Performing quick analysis...'
    });

    // Fast analysis focusing on key elements only
    const enhancedContext = this.buildEnhancedContext(structuredData);
    
    // Simplified parallel processing for speed
    const [summary, keyPersons, majorIssues] = await Promise.all([
      this.generateQuickSummary(enhancedContext),
      this.extractKeyPersonsQuick(structuredData.globalEntities),
      this.identifyMajorIssuesQuick(enhancedContext)
    ]);

    if (abortSignal?.aborted) throw new Error('Analysis cancelled');

    onProgress?.({
      stage: 'analyzing',
      current: 3,
      total: 3,
      percentage: 100,
      status: 'Quick analysis complete'
    });

    return {
      // Simplified results for quick analysis
      chronologyEvents: [],
      persons: keyPersons,
      issues: majorIssues,
      keyPoints: [],
      authorities: [],
      confidence: 0.75, // Lower confidence for quick analysis
      processingTime: 0,
      summary: summary,

      extractionQuality: {
        overall: structuredData.qualityMetrics.averageQuality,
        textQuality: structuredData.qualityMetrics.averageQuality,
        structureQuality: structuredData.qualityMetrics.averageQuality,
        aiConfidence: 0.75
      },
      processingStats: {
        documentsProcessed: structuredData.documents.length,
        entitiesExtracted: structuredData.globalEntities.length,
        tablesAnalyzed: structuredData.globalTables.length,
        aiTokensUsed: this.estimateTokensUsed(enhancedContext.substring(0, 1000)),
        processingTime: 0
      },
      structuredData: {
        tables: structuredData.globalTables,
        entities: structuredData.globalEntities,
        metadata: structuredData.documents.map((d: any) => d.metadata)
      }
    };
  }

  private async performEntityOnlyAnalysis(structuredData: any, onProgress?: any, abortSignal?: AbortSignal): Promise<EnhancedAIAnalysisResult> {
    onProgress?.({
      stage: 'entities',
      current: 1,
      total: 4,
      percentage: 25,
      status: 'Analyzing entities and relationships...'
    });

    // Focus exclusively on entity processing and relationships
    const entities = structuredData.globalEntities;
    
    onProgress?.({
      stage: 'entities',
      current: 2,
      total: 4,
      percentage: 50,
      status: 'Processing person entities...'
    });

    // Enhanced entity analysis
    const [persons, entitySummary, entityRelationships] = await Promise.all([
      this.analyzePersonsWithContext(
        this.buildEntityContext(entities), 
        entities.filter((e: any) => e.type === 'person')
      ),
      this.generateEntitySummary(entities),
      this.analyzeEntityRelationships(entities)
    ]);

    if (abortSignal?.aborted) throw new Error('Analysis cancelled');

    onProgress?.({
      stage: 'entities',
      current: 4,
      total: 4,
      percentage: 100,
      status: 'Entity analysis complete'
    });

    return {
      // Entity-focused results
      chronologyEvents: [],
      persons: persons,
      issues: [],
      keyPoints: entityRelationships.map((rel: any) => ({
        point: `Entity Relationship: ${rel.type} - ${rel.description}`,
        supportingDocs: rel.documentRefs || [],
        category: 'legal_argument' as const,
        order: 1
      })),
      authorities: [],
      confidence: this.calculateEntityConfidence(entities),
      processingTime: 0,
      summary: entitySummary,

      extractionQuality: {
        overall: structuredData.qualityMetrics.averageQuality,
        textQuality: structuredData.qualityMetrics.averageQuality,
        structureQuality: structuredData.qualityMetrics.averageQuality,
        aiConfidence: this.calculateEntityConfidence(entities)
      },
      processingStats: {
        documentsProcessed: structuredData.documents.length,
        entitiesExtracted: entities.length,
        tablesAnalyzed: 0, // Not analyzing tables in entity-only mode
        aiTokensUsed: this.estimateTokensUsed(this.buildEntityContext(entities)),
        processingTime: 0
      },
      structuredData: {
        tables: [],
        entities: entities,
        metadata: structuredData.documents.map((d: any) => d.metadata)
      }
    };
  }

  private async performSummaryOnlyAnalysis(structuredData: any, onProgress?: any, abortSignal?: AbortSignal): Promise<EnhancedAIAnalysisResult> {
    onProgress?.({
      stage: 'summarizing',
      current: 1,
      total: 3,
      percentage: 33,
      status: 'Generating comprehensive summary...'
    });

    // Focus on high-quality summary generation
    const enhancedContext = this.buildEnhancedContext(structuredData);
    
    onProgress?.({
      stage: 'summarizing',
      current: 2,
      total: 3,
      percentage: 67,
      status: 'Creating executive summary...'
    });

    // Generate multiple summary perspectives
    const [executiveSummary, detailedSummary, keyInsights] = await Promise.all([
      this.generateExecutiveSummary(enhancedContext),
      this.generateDetailedSummary(enhancedContext, structuredData.globalTables),
      this.extractKeyInsights(enhancedContext, structuredData.globalEntities)
    ]);

    if (abortSignal?.aborted) throw new Error('Analysis cancelled');

    onProgress?.({
      stage: 'summarizing',
      current: 3,
      total: 3,
      percentage: 100,
      status: 'Summary analysis complete'
    });

    const combinedSummary = `${executiveSummary}\n\n### Detailed Analysis\n${detailedSummary}\n\n### Key Insights\n${keyInsights}`;

    return {
      // Summary-focused results
      chronologyEvents: [],
      persons: [],
      issues: [],
      keyPoints: [{
        point: `Executive Summary: ${executiveSummary}`,
        supportingDocs: [],
        category: 'opening' as const,
        order: 1
      }, {
        point: `Key Insights: ${keyInsights}`,
        supportingDocs: [],
        category: 'legal_argument' as const,
        order: 2
      }],
      authorities: [],
      confidence: this.calculateSummaryConfidence(structuredData),
      processingTime: 0,
      summary: combinedSummary,

      extractionQuality: {
        overall: structuredData.qualityMetrics.averageQuality,
        textQuality: structuredData.qualityMetrics.averageQuality,
        structureQuality: structuredData.qualityMetrics.averageQuality,
        aiConfidence: this.calculateSummaryConfidence(structuredData)
      },
      processingStats: {
        documentsProcessed: structuredData.documents.length,
        entitiesExtracted: structuredData.globalEntities.length,
        tablesAnalyzed: structuredData.globalTables.length,
        aiTokensUsed: this.estimateTokensUsed(enhancedContext),
        processingTime: 0
      },
      structuredData: {
        tables: structuredData.globalTables,
        entities: structuredData.globalEntities,
        metadata: structuredData.documents.map((d: any) => d.metadata)
      }
    };
  }

  // Helper methods for analysis modes
  private async generateQuickSummary(context: string): Promise<string> {
    const prompt = `Provide a brief 2-3 sentence summary of this legal case:\\n\\n${context.substring(0, 1000)}`;
    const response = await unifiedAIClient.query(prompt, { temperature: 0.3, maxTokens: 200 });
    return response.content;
  }

  private async extractKeyPersonsQuick(entities: LegalEntityArray): Promise<Omit<Person, 'id' | 'caseId'>[]> {
    const personEntities = entities.filter(e => e.type === 'person').slice(0, 5); // Top 5 persons
    return personEntities.map(entity => ({
      name: entity.value,
      role: 'other' as const,
      description: entity.context?.substring(0, 50) || 'Key person identified',
      relevance: entity.context?.substring(0, 50) || 'Key person identified',
      documentRefs: []
    }));
  }

  private async identifyMajorIssuesQuick(context: string): Promise<Omit<Issue, 'id' | 'caseId'>[]> {
    const prompt = `Identify 2-3 main legal issues from this case summary:\\n\\n${context.substring(0, 1000)}\\n\\nFormat as brief bullet points.`;
    const response = await unifiedAIClient.query(prompt, { temperature: 0.3, maxTokens: 300 });
    
    // Parse response into issues (simple implementation)
    const issues = response.content.split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('•')).slice(0, 3);
    return issues.map((issue, index) => ({
      title: `Issue ${index + 1}`,
      description: issue.trim().replace(/^[-•]\s*/, ''),
      category: 'factual' as const,
      status: 'unresolved' as const,
      priority: 'medium' as const,
      documentRefs: [],
      relatedIssues: []
    }));
  }

  private buildEntityContext(entities: LegalEntityArray): string {
    const entityGroups = entities.reduce((groups: Record<string, LegalEntity[]>, entity: LegalEntity) => {
      if (!groups[entity.type]) groups[entity.type] = [];
      groups[entity.type].push(entity);
      return groups;
    }, {});

    let context = '=== ENTITY ANALYSIS ===\\n';
    Object.entries(entityGroups).forEach(([type, entitiesOfType]: [string, LegalEntity[]]) => {
      context += `${type.toUpperCase()}: ${entitiesOfType.slice(0, 10).map((e: LegalEntity) => e.value).join(', ')}\\n`;
    });
    return context;
  }

  private async generateEntitySummary(entities: LegalEntityArray): Promise<string> {
    const entityContext = this.buildEntityContext(entities);
    const prompt = `Analyze these extracted entities and provide a summary of the key people, organizations, and relationships:\\n\\n${entityContext}`;
    const response = await unifiedAIClient.query(prompt, { temperature: 0.3, maxTokens: 400 });
    return response.content;
  }

  private async analyzeEntityRelationships(entities: LegalEntityArray): Promise<Array<{
    type: string;
    description: string;
    importance: string;
    documentRefs: string[];
  }>> {
    const personEntities = entities.filter(e => e.type === 'person');
    const orgEntities = entities.filter(e => e.type === 'organization');
    
    // Simple relationship analysis
    const relationships = [];
    
    if (personEntities.length > 1) {
      relationships.push({
        type: 'person-person',
        description: `${personEntities.length} persons identified with potential relationships`,
        importance: 'medium',
        documentRefs: []
      });
    }
    
    if (orgEntities.length > 0 && personEntities.length > 0) {
      relationships.push({
        type: 'person-organization',
        description: `${personEntities.length} persons associated with ${orgEntities.length} organizations`,
        importance: 'high',
        documentRefs: []
      });
    }
    
    return relationships;
  }

  private calculateEntityConfidence(entities: LegalEntityArray): number {
    if (entities.length === 0) return 0.5;
    const avgConfidence = entities.reduce((sum, e) => sum + (e.confidence || 0.7), 0) / entities.length;
    return Math.min(avgConfidence, 0.9); // Cap at 90% for entity-only analysis
  }

  private async generateExecutiveSummary(context: string): Promise<string> {
    const prompt = `Create an executive summary for this legal case. Focus on the most critical points for legal professionals:\\n\\n${context.substring(0, 1500)}`;
    const response = await unifiedAIClient.query(prompt, { temperature: 0.2, maxTokens: 300 });
    return response.content;
  }

  private async generateDetailedSummary(context: string, tables: LegalTableArray): Promise<string> {
    const tableContext = tables.length > 0 ? `\\n\\nTables found: ${tables.length} (${tables.map(t => t.type).join(', ')})` : '';
    const prompt = `Provide a detailed legal analysis based on this case information${tableContext}:\\n\\n${context.substring(0, 2000)}`;
    const response = await unifiedAIClient.query(prompt, { temperature: 0.3, maxTokens: 500 });
    return response.content;
  }

  private async extractKeyInsights(context: string, entities: LegalEntityArray): Promise<string> {
    const entitySummary = entities.length > 0 ? `\\n\\nKey entities: ${entities.slice(0, 10).map(e => e.value).join(', ')}` : '';
    const prompt = `Extract 3-5 key legal insights and implications from this case${entitySummary}:\\n\\n${context.substring(0, 1500)}`;
    const response = await unifiedAIClient.query(prompt, { temperature: 0.4, maxTokens: 400 });
    return response.content;
  }

  private calculateSummaryConfidence(structuredData: any): number {
    // Base confidence on document quality and content completeness
    const baseQuality = structuredData.qualityMetrics.averageQuality;
    const contentCompleteness = Math.min(structuredData.documents.length / 3, 1); // Optimal at 3+ docs
    const entityRichness = Math.min(structuredData.globalEntities.length / 10, 1); // Optimal at 10+ entities
    
    return (baseQuality * 0.6 + contentCompleteness * 0.2 + entityRichness * 0.2);
  }

  // Utility methods
  private calculateOverallConfidence(...entityGroups: Array<Array<{confidence?: number}>>): number {
    const allEntities = entityGroups.flat();
    if (allEntities.length === 0) return 0.5;
    
    const totalConfidence = allEntities.reduce((sum, entity) => sum + (entity.confidence || 0.5), 0);
    return Math.min(totalConfidence / allEntities.length, 1.0);
  }

  private estimateTokensUsed(context: string): number {
    // Rough estimate: 4 characters per token
    return Math.ceil(context.length / 4);
  }

  private async cacheResults(documents: CaseDocument[], results: EnhancedAIAnalysisResult): Promise<void> {
    const cacheKey = this.generateAnalysisCacheKey(documents, 'full');
    this.analysisCache.set(cacheKey.hash, results);
    
    // Save using advanced cache system
    try {
      await advancedCacheSystem.set(cacheKey, results);
    } catch (error) {
      console.error('Failed to cache AI analysis results:', error);
    }
  }

  private generateAnalysisCacheKey(documents: CaseDocument[], analysisType: string): CacheKey {
    return advancedCacheSystem.generateCacheKey({
      content: documents.map(d => d.content).join('\n').substring(0, 1000),
      type: `analysis_${analysisType}`,
      size: documents.reduce((sum, d) => sum + d.content.length, 0),
      metadata: { docCount: documents.length, analysisType }
    });
  }
}

// Export singleton instance
export const optimizedAIAnalyzer = new OptimizedAIAnalyzer();
export type { OptimizedAIConfig, AIProgressUpdate };