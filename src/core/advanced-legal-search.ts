/**
 * ADVANCED LEGAL SEARCH INTERFACE
 * 
 * Lawyer-focused search interface providing sophisticated legal document search
 * with entity filtering, practice area specialization, and legal context awareness
 * 
 * Status: Phase 1, Week 5-6 - Advanced Search Implementation
 * Purpose: Provide lawyer-grade search interface for legal case analysis
 */

import { EventEmitter } from 'events';
import { 
  EnterpriseSearchEngine, 
  SearchQuery, 
  SearchResult, 
  SearchFilters,
  SearchOptions 
} from './enterprise-search-engine';
import { ResolvedLegalEntity } from './legal-entity-resolver';

export interface LegalSearchQuery {
  // Basic search parameters
  searchText: string;
  searchType: 'natural_language' | 'boolean' | 'citation' | 'entity_focused' | 'timeline' | 'precedent';
  
  // Legal-specific filters
  legalFilters: LegalSearchFilters;
  
  // Search scope and context
  scope: LegalSearchScope;
  
  // Advanced options
  options: LegalSearchOptions;
}

export interface LegalSearchFilters {
  // Practice area filtering
  practiceAreas?: LegalPracticeArea[];
  
  // Entity filtering
  entityFilters?: EntityFilters;
  
  // Document classification
  documentTypes?: LegalDocumentType[];
  
  // Temporal filtering
  temporalFilters?: TemporalFilters;
  
  // Jurisdiction and legal system
  jurisdiction?: Jurisdiction;
  
  // Relevance and quality filters
  qualityFilters?: QualityFilters;
}

export interface EntityFilters {
  // Required entities (must be present)
  requiredEntities?: string[];
  
  // Entity types to focus on
  entityTypes?: LegalEntityType[];
  
  // Entity relationships
  entityRelationships?: EntityRelationshipFilter[];
  
  // Entity confidence threshold
  minEntityConfidence?: number;
  
  // Entity prominence (how central to document)
  minEntityProminence?: number;
}

export interface EntityRelationshipFilter {
  relationshipType: 'represents' | 'opposes' | 'contracts_with' | 'employed_by' | 'affiliated_with';
  fromEntity?: string;
  toEntity?: string;
  strengthThreshold?: number;
}

export interface TemporalFilters {
  // Document creation/modification dates
  documentDateRange?: DateRange;
  
  // Event dates mentioned in documents
  eventDateRange?: DateRange;
  
  // Statute of limitations considerations
  statuteOfLimitationsDate?: Date;
  
  // Timeline analysis
  timelineFilters?: TimelineFilters;
}

export interface TimelineFilters {
  // Focus on specific time periods
  criticalPeriods?: DateRange[];
  
  // Exclude routine/administrative periods
  excludeRoutinePeriods?: boolean;
  
  // Focus on periods with high activity
  highActivityPeriods?: boolean;
}

export interface QualityFilters {
  // Minimum document completeness
  minCompleteness?: number;
  
  // OCR/extraction quality
  minExtractionQuality?: number;
  
  // Legal analysis confidence
  minAnalysisConfidence?: number;
  
  // Exclude low-quality documents
  excludeLowQuality?: boolean;
}

export interface LegalSearchScope {
  // Case-specific search
  caseIds?: string[];
  
  // Cross-case search
  includeRelatedCases?: boolean;
  
  // Document collections
  documentCollections?: string[];
  
  // Search depth
  searchDepth: 'surface' | 'standard' | 'comprehensive' | 'exhaustive';
}

export interface LegalSearchOptions {
  // Result presentation
  maxResults?: number;
  groupByEntity?: boolean;
  groupByDocumentType?: boolean;
  groupByTimePeriod?: boolean;
  
  // Result enhancement
  includeEntityContext?: boolean;
  includeLegalCitations?: boolean;
  includeRelatedDocuments?: boolean;
  includeTimelineContext?: boolean;
  
  // Analysis options
  performSentimentAnalysis?: boolean;
  identifyLegalIssues?: boolean;
  extractLegalPrecedents?: boolean;
  
  // Output formatting
  highlightLegalTerms?: boolean;
  showConfidenceScores?: boolean;
  includeExecutiveSummary?: boolean;
}

export interface LegalSearchResult extends SearchResult {
  // Enhanced legal context
  legalContext: LegalResultContext;
  
  // Legal analysis
  legalAnalysis: LegalResultAnalysis;
  
  // Relationships to other results
  relationships: LegalResultRelationship[];
  
  // Legal importance scoring
  legalImportance: LegalImportanceScore;
}

export interface LegalResultContext {
  practiceArea: LegalPracticeArea;
  documentClassification: LegalDocumentType;
  legalIssues: LegalIssue[];
  citations: LegalCitation[];
  jurisdiction: Jurisdiction;
  timelinePosition: TimelinePosition;
}

export interface LegalResultAnalysis {
  keyLegalConcepts: LegalConcept[];
  legalEntities: EnhancedEntityMatch[];
  proceduralStatus: ProceduralStatus;
  substantiveAnalysis: SubstantiveAnalysis;
  riskIndicators: RiskIndicator[];
}

export interface LegalResultRelationship {
  relatedDocumentId: string;
  relationshipType: 'cites' | 'cited_by' | 'amends' | 'amended_by' | 'responds_to' | 'supports' | 'contradicts';
  strength: number;
  description: string;
}

export interface LegalImportanceScore {
  overallImportance: number; // 0-1 scale
  factorBreakdown: {
    precedentialValue: number;
    entityImportance: number;
    proceduralSignificance: number;
    evidentialValue: number;
    strategicImportance: number;
  };
  explanations: string[];
}

// Supporting type definitions
export type LegalPracticeArea = 
  | 'contract_law' | 'corporate_law' | 'litigation' | 'employment_law' 
  | 'intellectual_property' | 'real_estate' | 'family_law' | 'criminal_law'
  | 'bankruptcy' | 'tax_law' | 'securities' | 'antitrust' | 'environmental'
  | 'healthcare' | 'immigration' | 'personal_injury' | 'other';

export type LegalDocumentType = 
  | 'contract' | 'motion' | 'brief' | 'pleading' | 'deposition' | 'correspondence'
  | 'discovery_request' | 'discovery_response' | 'exhibit' | 'transcript'
  | 'court_order' | 'judgment' | 'settlement' | 'expert_report' | 'other';

export type LegalEntityType = 
  | 'person' | 'organization' | 'court' | 'judge' | 'lawyer' | 'law_firm'
  | 'government_agency' | 'corporation' | 'partnership' | 'trust' | 'other';

export type Jurisdiction = 'federal' | 'state' | 'local' | 'international' | 'other';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface LegalIssue {
  issue: string;
  category: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
}

export interface LegalCitation {
  citation: string;
  citationType: 'case' | 'statute' | 'regulation' | 'secondary';
  relevance: number;
  context: string;
}

export interface TimelinePosition {
  chronologicalPosition: 'early' | 'middle' | 'late' | 'unknown';
  relatedEvents: string[];
  significance: 'critical' | 'important' | 'routine';
}

export interface LegalConcept {
  concept: string;
  definition: string;
  relevance: number;
  practiceArea: LegalPracticeArea;
}

export interface EnhancedEntityMatch {
  entity: string;
  entityType: LegalEntityType;
  confidence: number;
  role: string;
  prominence: number;
  relationships: string[];
}

export interface ProceduralStatus {
  phase: 'pre_litigation' | 'discovery' | 'motion_practice' | 'trial' | 'appeal' | 'settlement' | 'closed';
  deadlines: Date[];
  requirements: string[];
}

export interface SubstantiveAnalysis {
  claims: string[];
  defenses: string[];
  elements: LegalElement[];
  strengths: string[];
  weaknesses: string[];
}

export interface LegalElement {
  element: string;
  satisfied: boolean | null;
  evidence: string[];
  confidence: number;
}

export interface RiskIndicator {
  risk: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  impact: string;
  mitigation: string[];
}

export class AdvancedLegalSearch extends EventEmitter {
  private searchEngine: EnterpriseSearchEngine;
  
  // Legal knowledge base
  private practiceAreaKeywords = new Map<LegalPracticeArea, string[]>([
    ['contract_law', ['contract', 'agreement', 'breach', 'performance', 'consideration', 'offer', 'acceptance']],
    ['litigation', ['complaint', 'answer', 'discovery', 'motion', 'trial', 'evidence', 'witness']],
    ['corporate_law', ['corporation', 'board', 'shareholder', 'merger', 'acquisition', 'governance']],
    ['employment_law', ['employee', 'employer', 'discrimination', 'harassment', 'termination', 'wages']],
    ['intellectual_property', ['patent', 'trademark', 'copyright', 'infringement', 'license']],
    ['real_estate', ['property', 'deed', 'lease', 'zoning', 'title', 'easement']],
    ['family_law', ['divorce', 'custody', 'alimony', 'adoption', 'prenuptial', 'domestic']],
    ['criminal_law', ['criminal', 'prosecution', 'defense', 'guilty', 'innocent', 'sentence']]
  ]);
  
  private legalTermWeights = new Map<string, number>([
    // High-value legal terms
    ['breach', 3.0], ['liability', 3.0], ['damages', 3.0], ['negligence', 3.0],
    ['contract', 2.5], ['agreement', 2.5], ['evidence', 2.5], ['witness', 2.5],
    ['motion', 2.0], ['discovery', 2.0], ['deposition', 2.0], ['settlement', 2.0],
    
    // Procedural terms
    ['plaintiff', 2.2], ['defendant', 2.2], ['court', 2.0], ['judge', 2.0],
    ['attorney', 1.8], ['counsel', 1.8], ['trial', 2.0], ['hearing', 1.8],
    
    // Document types
    ['exhibit', 1.5], ['pleading', 1.5], ['brief', 1.5], ['affidavit', 1.5]
  ]);

  constructor(searchEngine: EnterpriseSearchEngine) {
    super();
    this.searchEngine = searchEngine;
    console.log('⚖️  Advanced Legal Search interface initialized');
  }

  /**
   * Perform advanced legal search
   */
  async search(query: LegalSearchQuery): Promise<LegalSearchResult[]> {
    console.log(`⚖️  Legal Search: "${query.searchText}" (${query.searchType})`);
    
    const startTime = Date.now();
    
    try {
      // Convert legal query to enterprise search query
      const enterpriseQuery = await this.convertToEnterpriseQuery(query);
      
      // Perform search using enterprise engine
      const baseResults = await this.searchEngine.search(enterpriseQuery);
      
      // Enhance results with legal analysis
      const legalResults = await this.enhanceWithLegalAnalysis(baseResults, query);
      
      // Apply legal-specific ranking
      const rankedResults = this.applyLegalRanking(legalResults, query);
      
      // Group results if requested
      const finalResults = this.groupResults(rankedResults, query.options);
      
      const searchTime = Date.now() - startTime;
      console.log(`✅ Legal search completed: ${finalResults.length} results in ${searchTime}ms`);
      
      this.emit('legalSearchComplete', {
        query: query.searchText,
        searchType: query.searchType,
        resultCount: finalResults.length,
        searchTime
      });
      
      return finalResults;
      
    } catch (error) {
      console.error('❌ Legal search failed:', error);
      this.emit('legalSearchError', error);
      throw error;
    }
  }

  /**
   * Convert legal search query to enterprise search query
   */
  private async convertToEnterpriseQuery(query: LegalSearchQuery): Promise<SearchQuery> {
    let searchText = query.searchText;
    let searchType: SearchQuery['type'] = 'hybrid';
    
    // Enhance search text based on type
    switch (query.searchType) {
      case 'natural_language':
        searchText = this.enhanceNaturalLanguageQuery(searchText, query.legalFilters);
        searchType = 'hybrid';
        break;
        
      case 'boolean':
        searchType = 'fulltext';
        break;
        
      case 'entity_focused':
        searchType = 'entity';
        break;
        
      case 'citation':
        searchText = this.enhanceCitationQuery(searchText);
        searchType = 'fulltext';
        break;
        
      case 'timeline':
        searchText = this.enhanceTimelineQuery(searchText, query.legalFilters);
        searchType = 'hybrid';
        break;
        
      case 'precedent':
        searchText = this.enhancePrecedentQuery(searchText);
        searchType = 'semantic';
        break;
    }
    
    // Convert legal filters to enterprise filters
    const filters = this.convertLegalFilters(query.legalFilters);
    
    // Convert legal options to enterprise options
    const options = this.convertLegalOptions(query.options);
    
    return {
      text: searchText,
      type: searchType,
      filters,
      options
    };
  }

  /**
   * Enhance natural language query with legal context
   */
  private enhanceNaturalLanguageQuery(searchText: string, filters: LegalSearchFilters): string {
    let enhanced = searchText;
    
    // Add practice area keywords
    if (filters.practiceAreas) {
      for (const area of filters.practiceAreas) {
        const keywords = this.practiceAreaKeywords.get(area) || [];
        // Add most relevant keywords (simplified approach)
        enhanced += ` ${keywords.slice(0, 2).join(' ')}`;
      }
    }
    
    // Add entity type context
    if (filters.entityFilters?.entityTypes) {
      const entityTerms = filters.entityFilters.entityTypes.join(' ');
      enhanced += ` ${entityTerms}`;
    }
    
    return enhanced.trim();
  }

  /**
   * Enhance citation-focused query
   */
  private enhanceCitationQuery(searchText: string): string {
    // Add citation-related terms
    return `${searchText} cite cited citation precedent authority`;
  }

  /**
   * Enhance timeline-focused query
   */
  private enhanceTimelineQuery(searchText: string, filters: LegalSearchFilters): string {
    let enhanced = searchText;
    
    // Add temporal terms
    enhanced += ' date time period event chronology timeline';
    
    // Add date-specific terms if date filters present
    if (filters.temporalFilters?.documentDateRange) {
      enhanced += ' when during occurred happened';
    }
    
    return enhanced;
  }

  /**
   * Enhance precedent-focused query
   */
  private enhancePrecedentQuery(searchText: string): string {
    return `${searchText} precedent authority case law holding ruling decision`;
  }

  /**
   * Convert legal filters to enterprise search filters
   */
  private convertLegalFilters(legalFilters: LegalSearchFilters): SearchFilters {
    const filters: SearchFilters = {};
    
    // Document types
    if (legalFilters.documentTypes) {
      filters.documentTypes = legalFilters.documentTypes;
    }
    
    // Temporal filters
    if (legalFilters.temporalFilters?.documentDateRange) {
      filters.dateRange = {
        start: legalFilters.temporalFilters.documentDateRange.start,
        end: legalFilters.temporalFilters.documentDateRange.end
      };
    }
    
    // Entity filters
    if (legalFilters.entityFilters?.requiredEntities) {
      filters.entities = legalFilters.entityFilters.requiredEntities;
    }
    
    // Confidence threshold
    if (legalFilters.qualityFilters?.minAnalysisConfidence) {
      filters.confidenceThreshold = legalFilters.qualityFilters.minAnalysisConfidence;
    }
    
    // Practice areas (converted to keywords)
    if (legalFilters.practiceAreas) {
      // This would be implemented as a custom filter in the enterprise engine
      // For now, we'll enhance the search text instead
    }
    
    return filters;
  }

  /**
   * Convert legal options to enterprise search options
   */
  private convertLegalOptions(legalOptions: LegalSearchOptions): SearchOptions {
    return {
      maxResults: legalOptions.maxResults || 50,
      includeSnippets: true,
      snippetLength: 300,
      highlightTerms: legalOptions.highlightLegalTerms || true,
      rankingStrategy: 'importance'
    };
  }

  /**
   * Enhance search results with legal analysis
   */
  private async enhanceWithLegalAnalysis(
    baseResults: SearchResult[], 
    query: LegalSearchQuery
  ): Promise<LegalSearchResult[]> {
    
    const legalResults: LegalSearchResult[] = [];
    
    for (const result of baseResults) {
      // Analyze legal context
      const legalContext = await this.analyzeLegalContext(result, query);
      
      // Perform legal analysis
      const legalAnalysis = await this.performLegalAnalysis(result, query);
      
      // Find relationships
      const relationships = await this.findLegalRelationships(result, baseResults);
      
      // Calculate legal importance
      const legalImportance = this.calculateLegalImportance(result, legalContext, legalAnalysis);
      
      legalResults.push({
        ...result,
        legalContext,
        legalAnalysis,
        relationships,
        legalImportance
      });
    }
    
    return legalResults;
  }

  /**
   * Analyze legal context of search result
   */
  private async analyzeLegalContext(result: SearchResult, query: LegalSearchQuery): Promise<LegalResultContext> {
    // Determine practice area
    const practiceArea = this.determinePracticeArea(result);
    
    // Classify document type
    const documentClassification = this.classifyLegalDocument(result);
    
    // Identify legal issues
    const legalIssues = this.identifyLegalIssues(result);
    
    // Extract citations
    const citations = this.extractLegalCitations(result);
    
    // Determine jurisdiction
    const jurisdiction = this.determineJurisdiction(result);
    
    // Analyze timeline position
    const timelinePosition = this.analyzeTimelinePosition(result);
    
    return {
      practiceArea,
      documentClassification,
      legalIssues,
      citations,
      jurisdiction,
      timelinePosition
    };
  }

  /**
   * Determine practice area from document content
   */
  private determinePracticeArea(result: SearchResult): LegalPracticeArea {
    const content = result.snippets.map(s => s.text).join(' ').toLowerCase();
    
    let bestMatch: LegalPracticeArea = 'other';
    let maxScore = 0;
    
    for (const [area, keywords] of this.practiceAreaKeywords.entries()) {
      const score = keywords.reduce((sum, keyword) => {
        const matches = (content.match(new RegExp(keyword, 'gi')) || []).length;
        return sum + matches;
      }, 0);
      
      if (score > maxScore) {
        maxScore = score;
        bestMatch = area;
      }
    }
    
    return bestMatch;
  }

  /**
   * Classify legal document type
   */
  private classifyLegalDocument(result: SearchResult): LegalDocumentType {
    // Use existing metadata or infer from name/content
    return result.metadata.documentType as LegalDocumentType || 'other';
  }

  /**
   * Identify legal issues in document
   */
  private identifyLegalIssues(result: SearchResult): LegalIssue[] {
    const issues: LegalIssue[] = [];
    const content = result.snippets.map(s => s.text).join(' ').toLowerCase();
    
    // Common legal issue patterns
    const issuePatterns = [
      { pattern: /breach\s+of\s+contract/gi, issue: 'Breach of Contract', category: 'Contract Law' },
      { pattern: /negligence/gi, issue: 'Negligence', category: 'Tort Law' },
      { pattern: /discrimination/gi, issue: 'Discrimination', category: 'Employment Law' },
      { pattern: /patent\s+infringement/gi, issue: 'Patent Infringement', category: 'IP Law' },
      { pattern: /breach\s+of\s+fiduciary\s+duty/gi, issue: 'Breach of Fiduciary Duty', category: 'Corporate Law' }
    ];
    
    for (const issuePattern of issuePatterns) {
      const matches = content.match(issuePattern.pattern);
      if (matches) {
        issues.push({
          issue: issuePattern.issue,
          category: issuePattern.category,
          importance: matches.length > 2 ? 'high' : 'medium',
          confidence: Math.min(0.8, matches.length * 0.2)
        });
      }
    }
    
    return issues;
  }

  /**
   * Extract legal citations from document
   */
  private extractLegalCitations(result: SearchResult): LegalCitation[] {
    const citations: LegalCitation[] = [];
    const content = result.snippets.map(s => s.text).join(' ');
    
    // Citation patterns (simplified)
    const citationPatterns = [
      // Case citations: "123 F.3d 456 (9th Cir. 2000)"
      {
        pattern: /\d+\s+[A-Z]\.\s*\d*d?\s+\d+\s*\([^)]+\s+\d{4}\)/g,
        type: 'case' as const
      },
      // Statute citations: "42 U.S.C. § 1983"
      {
        pattern: /\d+\s+U\.S\.C\.\s*§\s*\d+/g,
        type: 'statute' as const
      },
      // CFR citations: "29 C.F.R. § 1630.2"
      {
        pattern: /\d+\s+C\.F\.R\.\s*§\s*[\d.]+/g,
        type: 'regulation' as const
      }
    ];
    
    for (const citationPattern of citationPatterns) {
      const matches = content.match(citationPattern.pattern);
      if (matches) {
        for (const match of matches) {
          citations.push({
            citation: match.trim(),
            citationType: citationPattern.type,
            relevance: 0.8,
            context: this.extractCitationContext(content, match)
          });
        }
      }
    }
    
    return citations;
  }

  /**
   * Extract context around a citation
   */
  private extractCitationContext(content: string, citation: string): string {
    const index = content.indexOf(citation);
    if (index === -1) return '';
    
    const start = Math.max(0, index - 100);
    const end = Math.min(content.length, index + citation.length + 100);
    
    return content.substring(start, end).trim();
  }

  /**
   * Determine jurisdiction from document content
   */
  private determineJurisdiction(result: SearchResult): Jurisdiction {
    const content = result.snippets.map(s => s.text).join(' ').toLowerCase();
    
    if (content.includes('federal') || content.includes('u.s.c.') || content.includes('c.f.r.')) {
      return 'federal';
    }
    if (content.includes('state') || content.includes('supreme court')) {
      return 'state';
    }
    if (content.includes('municipal') || content.includes('county')) {
      return 'local';
    }
    
    return 'other';
  }

  /**
   * Analyze timeline position of document
   */
  private analyzeTimelinePosition(result: SearchResult): TimelinePosition {
    // Simplified timeline analysis
    // In production, this would integrate with the timeline analysis from cross-document analyzer
    
    return {
      chronologicalPosition: 'unknown',
      relatedEvents: [],
      significance: 'routine'
    };
  }

  /**
   * Perform detailed legal analysis
   */
  private async performLegalAnalysis(result: SearchResult, query: LegalSearchQuery): Promise<LegalResultAnalysis> {
    // Extract key legal concepts
    const keyLegalConcepts = this.extractLegalConcepts(result);
    
    // Enhance entity matches with legal context
    const legalEntities = this.enhanceEntityMatches(result.entities);
    
    // Determine procedural status
    const proceduralStatus = this.analyzeProceduralStatus(result);
    
    // Perform substantive analysis
    const substantiveAnalysis = this.performSubstantiveAnalysis(result);
    
    // Identify risk indicators
    const riskIndicators = this.identifyRiskIndicators(result);
    
    return {
      keyLegalConcepts,
      legalEntities,
      proceduralStatus,
      substantiveAnalysis,
      riskIndicators
    };
  }

  /**
   * Extract key legal concepts
   */
  private extractLegalConcepts(result: SearchResult): LegalConcept[] {
    const concepts: LegalConcept[] = [];
    const content = result.snippets.map(s => s.text).join(' ').toLowerCase();
    
    // Legal concept patterns
    const conceptPatterns = [
      { term: 'consideration', definition: 'Something of value exchanged in a contract', area: 'contract_law' as LegalPracticeArea },
      { term: 'due process', definition: 'Fair treatment through judicial system', area: 'constitutional_law' as LegalPracticeArea },
      { term: 'standing', definition: 'Right to bring legal action', area: 'litigation' as LegalPracticeArea },
      { term: 'damages', definition: 'Monetary compensation for harm', area: 'litigation' as LegalPracticeArea }
    ];
    
    for (const conceptPattern of conceptPatterns) {
      if (content.includes(conceptPattern.term)) {
        concepts.push({
          concept: conceptPattern.term,
          definition: conceptPattern.definition,
          relevance: 0.8,
          practiceArea: conceptPattern.area
        });
      }
    }
    
    return concepts;
  }

  /**
   * Enhance entity matches with legal context
   */
  private enhanceEntityMatches(entityMatches: any[]): EnhancedEntityMatch[] {
    return entityMatches.map(match => ({
      entity: match.entity,
      entityType: match.entityType as LegalEntityType,
      confidence: match.confidence,
      role: this.inferEntityRole(match),
      prominence: this.calculateEntityProminence(match),
      relationships: []
    }));
  }

  /**
   * Infer entity role in legal context
   */
  private inferEntityRole(entityMatch: any): string {
    const entityType = entityMatch.entityType;
    const context = entityMatch.context.join(' ').toLowerCase();
    
    switch (entityType) {
      case 'person':
        if (context.includes('plaintiff')) return 'plaintiff';
        if (context.includes('defendant')) return 'defendant';
        if (context.includes('witness')) return 'witness';
        if (context.includes('attorney') || context.includes('counsel')) return 'attorney';
        return 'party';
        
      case 'organization':
        if (context.includes('client')) return 'client';
        if (context.includes('opposing')) return 'opposing_party';
        return 'entity';
        
      case 'court':
        return 'adjudicator';
        
      default:
        return 'other';
    }
  }

  /**
   * Calculate entity prominence in document
   */
  private calculateEntityProminence(entityMatch: any): number {
    // Simple prominence calculation based on frequency and position
    const frequency = entityMatch.positions.length;
    return Math.min(1.0, frequency * 0.1);
  }

  /**
   * Analyze procedural status
   */
  private analyzeProceduralStatus(result: SearchResult): ProceduralStatus {
    const content = result.snippets.map(s => s.text).join(' ').toLowerCase();
    
    let phase: ProceduralStatus['phase'] = 'pre_litigation';
    
    if (content.includes('discovery') || content.includes('deposition')) {
      phase = 'discovery';
    } else if (content.includes('motion') || content.includes('summary judgment')) {
      phase = 'motion_practice';
    } else if (content.includes('trial') || content.includes('jury')) {
      phase = 'trial';
    } else if (content.includes('appeal') || content.includes('appellate')) {
      phase = 'appeal';
    } else if (content.includes('settlement') || content.includes('mediation')) {
      phase = 'settlement';
    }
    
    return {
      phase,
      deadlines: [],
      requirements: []
    };
  }

  /**
   * Perform substantive legal analysis
   */
  private performSubstantiveAnalysis(result: SearchResult): SubstantiveAnalysis {
    const content = result.snippets.map(s => s.text).join(' ').toLowerCase();
    
    const claims: string[] = [];
    const defenses: string[] = [];
    const elements: LegalElement[] = [];
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    // Identify claims
    if (content.includes('breach of contract')) {
      claims.push('Breach of Contract');
    }
    if (content.includes('negligence')) {
      claims.push('Negligence');
    }
    
    // Identify defenses
    if (content.includes('statute of limitations')) {
      defenses.push('Statute of Limitations');
    }
    if (content.includes('comparative negligence')) {
      defenses.push('Comparative Negligence');
    }
    
    return {
      claims,
      defenses,
      elements,
      strengths,
      weaknesses
    };
  }

  /**
   * Identify risk indicators
   */
  private identifyRiskIndicators(result: SearchResult): RiskIndicator[] {
    const indicators: RiskIndicator[] = [];
    const content = result.snippets.map(s => s.text).join(' ').toLowerCase();
    
    // Risk patterns
    if (content.includes('statute of limitations')) {
      indicators.push({
        risk: 'Statute of Limitations Concern',
        severity: 'high',
        probability: 0.8,
        impact: 'Case may be time-barred',
        mitigation: ['Verify applicable limitation periods', 'Check for tolling events']
      });
    }
    
    if (content.includes('missing evidence') || content.includes('no documentation')) {
      indicators.push({
        risk: 'Evidence Gaps',
        severity: 'medium',
        probability: 0.6,
        impact: 'Weakened case position',
        mitigation: ['Conduct additional discovery', 'Seek alternative evidence sources']
      });
    }
    
    return indicators;
  }

  /**
   * Find relationships between legal results
   */
  private async findLegalRelationships(
    result: SearchResult, 
    allResults: SearchResult[]
  ): Promise<LegalResultRelationship[]> {
    
    const relationships: LegalResultRelationship[] = [];
    
    // Look for citation relationships
    for (const otherResult of allResults) {
      if (otherResult.documentId === result.documentId) continue;
      
      // Check if documents cite each other
      const citesOther = this.checkCitationRelationship(result, otherResult);
      if (citesOther) {
        relationships.push({
          relatedDocumentId: otherResult.documentId,
          relationshipType: 'cites',
          strength: 0.8,
          description: 'Document cites this related document'
        });
      }
      
      // Check for entity overlap
      const entityOverlap = this.calculateEntityOverlap(result, otherResult);
      if (entityOverlap > 0.5) {
        relationships.push({
          relatedDocumentId: otherResult.documentId,
          relationshipType: 'supports',
          strength: entityOverlap,
          description: 'Documents share significant entities'
        });
      }
    }
    
    return relationships;
  }

  /**
   * Check citation relationship between documents
   */
  private checkCitationRelationship(result1: SearchResult, result2: SearchResult): boolean {
    const content1 = result1.snippets.map(s => s.text).join(' ');
    const docName2 = result2.documentName.toLowerCase();
    
    return content1.toLowerCase().includes(docName2);
  }

  /**
   * Calculate entity overlap between documents
   */
  private calculateEntityOverlap(result1: SearchResult, result2: SearchResult): number {
    const entities1 = new Set(result1.entities.map(e => e.entity.toLowerCase()));
    const entities2 = new Set(result2.entities.map(e => e.entity.toLowerCase()));
    
    const intersection = new Set([...entities1].filter(e => entities2.has(e)));
    const union = new Set([...entities1, ...entities2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Calculate legal importance score
   */
  private calculateLegalImportance(
    result: SearchResult,
    legalContext: LegalResultContext,
    legalAnalysis: LegalResultAnalysis
  ): LegalImportanceScore {
    
    // Calculate factor scores
    const precedentialValue = this.calculatePrecedentialValue(legalContext);
    const entityImportance = this.calculateEntityImportance(legalAnalysis);
    const proceduralSignificance = this.calculateProceduralSignificance(legalAnalysis);
    const evidentialValue = this.calculateEvidentialValue(result, legalContext);
    const strategicImportance = this.calculateStrategicImportance(legalAnalysis);
    
    // Calculate overall importance
    const overallImportance = (
      precedentialValue * 0.25 +
      entityImportance * 0.20 +
      proceduralSignificance * 0.20 +
      evidentialValue * 0.20 +
      strategicImportance * 0.15
    );
    
    return {
      overallImportance,
      factorBreakdown: {
        precedentialValue,
        entityImportance,
        proceduralSignificance,
        evidentialValue,
        strategicImportance
      },
      explanations: this.generateImportanceExplanations({
        precedentialValue,
        entityImportance,
        proceduralSignificance,
        evidentialValue,
        strategicImportance
      })
    };
  }

  /**
   * Calculate precedential value
   */
  private calculatePrecedentialValue(legalContext: LegalResultContext): number {
    let score = 0.5; // Base score
    
    // Boost for court documents
    if (legalContext.documentClassification === 'court_order' || 
        legalContext.documentClassification === 'judgment') {
      score += 0.3;
    }
    
    // Boost for citations
    score += Math.min(0.2, legalContext.citations.length * 0.05);
    
    return Math.min(1.0, score);
  }

  /**
   * Calculate entity importance
   */
  private calculateEntityImportance(legalAnalysis: LegalResultAnalysis): number {
    const totalEntities = legalAnalysis.legalEntities.length;
    const highConfidenceEntities = legalAnalysis.legalEntities.filter(e => e.confidence > 0.8).length;
    
    if (totalEntities === 0) return 0;
    
    return (highConfidenceEntities / totalEntities) * 0.7 + 
           Math.min(0.3, totalEntities * 0.05);
  }

  /**
   * Calculate procedural significance
   */
  private calculateProceduralSignificance(legalAnalysis: LegalResultAnalysis): number {
    const phase = legalAnalysis.proceduralStatus.phase;
    
    const phaseScores = {
      'pre_litigation': 0.3,
      'discovery': 0.6,
      'motion_practice': 0.8,
      'trial': 1.0,
      'appeal': 0.9,
      'settlement': 0.7,
      'closed': 0.4
    };
    
    return phaseScores[phase] || 0.5;
  }

  /**
   * Calculate evidential value
   */
  private calculateEvidentialValue(result: SearchResult, legalContext: LegalResultContext): number {
    let score = result.score * 0.5; // Base on search relevance
    
    // Boost for key document types
    const evidentialTypes = ['exhibit', 'deposition', 'expert_report', 'contract'];
    if (evidentialTypes.includes(legalContext.documentClassification)) {
      score += 0.3;
    }
    
    // Boost for high-importance legal issues
    const criticalIssues = legalContext.legalIssues.filter(i => i.importance === 'critical').length;
    score += criticalIssues * 0.1;
    
    return Math.min(1.0, score);
  }

  /**
   * Calculate strategic importance
   */
  private calculateStrategicImportance(legalAnalysis: LegalResultAnalysis): number {
    let score = 0.5; // Base score
    
    // Boost for high-risk indicators
    const highRisks = legalAnalysis.riskIndicators.filter(r => r.severity === 'high' || r.severity === 'critical').length;
    score += highRisks * 0.2;
    
    // Boost for substantive claims
    score += Math.min(0.3, legalAnalysis.substantiveAnalysis.claims.length * 0.1);
    
    return Math.min(1.0, score);
  }

  /**
   * Generate importance explanations
   */
  private generateImportanceExplanations(factors: LegalImportanceScore['factorBreakdown']): string[] {
    const explanations: string[] = [];
    
    if (factors.precedentialValue > 0.7) {
      explanations.push('High precedential value due to court orders or extensive citations');
    }
    
    if (factors.entityImportance > 0.7) {
      explanations.push('Significant entity involvement with high confidence matches');
    }
    
    if (factors.proceduralSignificance > 0.8) {
      explanations.push('Critical procedural phase (trial or motion practice)');
    }
    
    if (factors.evidentialValue > 0.7) {
      explanations.push('Strong evidential value for case development');
    }
    
    if (factors.strategicImportance > 0.7) {
      explanations.push('High strategic importance due to risk factors or key claims');
    }
    
    return explanations;
  }

  /**
   * Apply legal-specific ranking to results
   */
  private applyLegalRanking(results: LegalSearchResult[], query: LegalSearchQuery): LegalSearchResult[] {
    return results.sort((a, b) => {
      // Primary sort by legal importance
      const importanceDiff = b.legalImportance.overallImportance - a.legalImportance.overallImportance;
      if (Math.abs(importanceDiff) > 0.1) return importanceDiff;
      
      // Secondary sort by search relevance
      const scoreDiff = b.score - a.score;
      if (Math.abs(scoreDiff) > 0.1) return scoreDiff;
      
      // Tertiary sort by procedural significance
      const proceduralDiff = b.legalImportance.factorBreakdown.proceduralSignificance - 
                            a.legalImportance.factorBreakdown.proceduralSignificance;
      
      return proceduralDiff;
    });
  }

  /**
   * Group results based on options
   */
  private groupResults(results: LegalSearchResult[], options: LegalSearchOptions): LegalSearchResult[] {
    // For now, return ungrouped results
    // In production, this would implement sophisticated grouping logic
    
    const maxResults = options.maxResults || 50;
    return results.slice(0, maxResults);
  }

  /**
   * Get search suggestions based on partial query
   */
  async getSuggestions(partialQuery: string, practiceArea?: LegalPracticeArea): Promise<string[]> {
    const suggestions: string[] = [];
    
    // Add practice area specific suggestions
    if (practiceArea) {
      const keywords = this.practiceAreaKeywords.get(practiceArea) || [];
      suggestions.push(...keywords.filter(k => k.includes(partialQuery.toLowerCase())));
    }
    
    // Add general legal term suggestions
    const legalTerms = Array.from(this.legalTermWeights.keys());
    suggestions.push(...legalTerms.filter(t => t.includes(partialQuery.toLowerCase())));
    
    return suggestions.slice(0, 10);
  }

  /**
   * Get practice area statistics from search index
   */
  async getPracticeAreaStatistics(): Promise<Map<LegalPracticeArea, number>> {
    const stats = new Map<LegalPracticeArea, number>();
    
    // This would query the search index for practice area distribution
    // For now, return mock data
    stats.set('contract_law', 150);
    stats.set('litigation', 120);
    stats.set('corporate_law', 80);
    stats.set('employment_law', 60);
    
    return stats;
  }
}

// Export factory function
export function createAdvancedLegalSearch(searchEngine: EnterpriseSearchEngine): AdvancedLegalSearch {
  return new AdvancedLegalSearch(searchEngine);
}

console.log('⚖️  Advanced Legal Search module loaded');