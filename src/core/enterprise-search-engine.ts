/**
 * ENTERPRISE SEARCH ENGINE
 * 
 * Advanced search system combining full-text, semantic, and legal-specific search
 * Designed for legal document analysis with entity-aware and context-sensitive search
 * 
 * Status: Phase 1, Week 5-6 - Enterprise Search Implementation
 * Purpose: Provide lawyer-grade search capabilities across case folders
 */

import { EventEmitter } from 'events';
import { ResolvedLegalEntity } from './legal-entity-resolver';

export interface SearchQuery {
  text: string;
  type: 'fulltext' | 'semantic' | 'entity' | 'hybrid';
  filters?: SearchFilters;
  options?: SearchOptions;
}

export interface SearchFilters {
  documentTypes?: string[];
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  entities?: string[];
  practiceAreas?: string[];
  jurisdiction?: string;
  confidenceThreshold?: number;
  caseIds?: string[];
}

export interface SearchOptions {
  maxResults?: number;
  includeSnippets?: boolean;
  snippetLength?: number;
  highlightTerms?: boolean;
  rankingStrategy?: 'relevance' | 'date' | 'importance' | 'entity_density';
  semanticThreshold?: number;
  fuzzyMatch?: boolean;
  caseSensitive?: boolean;
}

export interface SearchResult {
  documentId: string;
  documentName: string;
  score: number;
  relevanceType: 'exact' | 'semantic' | 'entity' | 'context';
  snippets: SearchSnippet[];
  entities: EntityMatch[];
  metadata: SearchResultMetadata;
}

export interface SearchSnippet {
  text: string;
  startOffset: number;
  endOffset: number;
  highlighted: string;
  context: string;
  score: number;
}

export interface EntityMatch {
  entity: string;
  entityType: string;
  confidence: number;
  positions: number[];
  context: string[];
}

export interface SearchResultMetadata {
  documentType: string;
  createdDate?: Date;
  modifiedDate?: Date;
  caseId?: string;
  practiceArea?: string;
  jurisdiction?: string;
  wordCount: number;
  pageCount?: number;
}

export interface SearchIndex {
  documents: Map<string, IndexedDocument>;
  invertedIndex: Map<string, PostingList>;
  entityIndex: Map<string, EntityPostingList>;
  semanticIndex: Map<string, SemanticVector>;
  metadata: SearchIndexMetadata;
}

export interface IndexedDocument {
  id: string;
  name: string;
  content: string;
  tokens: string[];
  entities: ResolvedLegalEntity[];
  semanticVector?: number[];
  metadata: SearchResultMetadata;
  lastIndexed: Date;
}

export interface PostingList {
  term: string;
  documents: Map<string, TermFrequency>;
  totalFrequency: number;
}

export interface TermFrequency {
  documentId: string;
  frequency: number;
  positions: number[];
  contexts: string[];
}

export interface EntityPostingList {
  entity: string;
  entityType: string;
  documents: Map<string, EntityOccurrence>;
  totalOccurrences: number;
}

export interface EntityOccurrence {
  documentId: string;
  occurrences: number;
  positions: number[];
  confidence: number;
  contexts: string[];
}

export interface SemanticVector {
  documentId: string;
  vector: number[];
  magnitude: number;
  keywords: string[];
}

export interface SearchIndexMetadata {
  totalDocuments: number;
  totalTerms: number;
  totalEntities: number;
  lastUpdated: Date;
  version: string;
  statistics: {
    avgDocumentLength: number;
    avgEntityCount: number;
    commonTerms: string[];
    rareTerms: string[];
  };
}

export class EnterpriseSearchEngine extends EventEmitter {
  private searchIndex: SearchIndex;
  private isIndexing: boolean = false;
  private indexingProgress: number = 0;
  
  // Legal-specific search configurations
  private legalStopWords = new Set([
    'whereas', 'therefore', 'heretofore', 'hereinafter', 'notwithstanding',
    'pursuant', 'thereof', 'hereby', 'herein', 'therein', 'aforesaid'
  ]);
  
  private legalTermWeights = new Map([
    ['contract', 2.0],
    ['agreement', 2.0],
    ['breach', 3.0],
    ['liability', 2.5],
    ['damages', 2.5],
    ['court', 2.0],
    ['judge', 2.0],
    ['attorney', 1.8],
    ['plaintiff', 2.2],
    ['defendant', 2.2],
    ['witness', 1.8],
    ['evidence', 2.5],
    ['testimony', 2.0]
  ]);

  constructor() {
    super();
    this.initializeSearchIndex();
    console.log('🔍 Enterprise Search Engine initialized');
  }

  /**
   * Initialize empty search index
   */
  private initializeSearchIndex(): void {
    this.searchIndex = {
      documents: new Map(),
      invertedIndex: new Map(),
      entityIndex: new Map(),
      semanticIndex: new Map(),
      metadata: {
        totalDocuments: 0,
        totalTerms: 0,
        totalEntities: 0,
        lastUpdated: new Date(),
        version: '1.0.0',
        statistics: {
          avgDocumentLength: 0,
          avgEntityCount: 0,
          commonTerms: [],
          rareTerms: []
        }
      }
    };
  }

  /**
   * Index a collection of documents for search
   */
  async indexDocuments(
    documents: Array<{
      id: string;
      name: string;
      content: string;
      entities?: ResolvedLegalEntity[];
      metadata?: Partial<SearchResultMetadata>;
    }>
  ): Promise<void> {
    console.log(`🔍 Starting indexing of ${documents.length} documents...`);
    
    this.isIndexing = true;
    this.indexingProgress = 0;
    
    try {
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        await this.indexDocument(doc);
        
        this.indexingProgress = ((i + 1) / documents.length) * 100;
        this.emit('indexingProgress', this.indexingProgress);
        
        if (i % 10 === 0) {
          console.log(`   Indexed ${i + 1}/${documents.length} documents (${Math.round(this.indexingProgress)}%)`);
        }
      }
      
      // Update index metadata
      await this.updateIndexMetadata();
      
      console.log(`✅ Indexing complete: ${documents.length} documents indexed`);
      this.emit('indexingComplete', {
        documentsIndexed: documents.length,
        totalTerms: this.searchIndex.metadata.totalTerms,
        totalEntities: this.searchIndex.metadata.totalEntities
      });
      
    } catch (error) {
      console.error('❌ Indexing failed:', error);
      this.emit('indexingError', error);
      throw error;
    } finally {
      this.isIndexing = false;
    }
  }

  /**
   * Index a single document
   */
  private async indexDocument(document: {
    id: string;
    name: string;
    content: string;
    entities?: ResolvedLegalEntity[];
    metadata?: Partial<SearchResultMetadata>;
  }): Promise<void> {
    
    // Tokenize content
    const tokens = this.tokenizeText(document.content);
    
    // Create indexed document
    const indexedDoc: IndexedDocument = {
      id: document.id,
      name: document.name,
      content: document.content,
      tokens: tokens,
      entities: document.entities || [],
      semanticVector: await this.generateSemanticVector(document.content, tokens),
      metadata: {
        documentType: this.inferDocumentType(document.name, document.content),
        wordCount: tokens.length,
        ...document.metadata
      },
      lastIndexed: new Date()
    };
    
    // Add to document index
    this.searchIndex.documents.set(document.id, indexedDoc);
    
    // Update inverted index
    this.updateInvertedIndex(document.id, tokens);
    
    // Update entity index
    if (indexedDoc.entities.length > 0) {
      this.updateEntityIndex(document.id, indexedDoc.entities);
    }
    
    // Update semantic index
    if (indexedDoc.semanticVector) {
      this.updateSemanticIndex(document.id, indexedDoc.semanticVector, tokens);
    }
  }

  /**
   * Tokenize text for indexing
   */
  private tokenizeText(text: string): string[] {
    // Normalize text
    const normalized = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Split into tokens
    const tokens = normalized.split(' ').filter(token => 
      token.length > 2 && 
      !this.legalStopWords.has(token) &&
      !/^\d+$/.test(token) // Exclude pure numbers
    );
    
    return tokens;
  }

  /**
   * Generate semantic vector for document
   */
  private async generateSemanticVector(content: string, tokens: string[]): Promise<number[]> {
    // Simplified semantic vector generation
    // In production, this would use a proper embedding model
    
    const vector = new Array(100).fill(0);
    
    // Weight terms by legal importance and frequency
    const termFreqs = new Map<string, number>();
    tokens.forEach(token => {
      termFreqs.set(token, (termFreqs.get(token) || 0) + 1);
    });
    
    // Generate vector components based on term importance
    let vectorIndex = 0;
    for (const [term, freq] of termFreqs.entries()) {
      if (vectorIndex >= vector.length) break;
      
      const legalWeight = this.legalTermWeights.get(term) || 1.0;
      const tfidf = (freq / tokens.length) * legalWeight;
      
      vector[vectorIndex % vector.length] += tfidf;
      vectorIndex++;
    }
    
    // Normalize vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] = vector[i] / magnitude;
      }
    }
    
    return vector;
  }

  /**
   * Update inverted index with document tokens
   */
  private updateInvertedIndex(documentId: string, tokens: string[]): void {
    const termPositions = new Map<string, number[]>();
    
    // Track term positions
    tokens.forEach((token, position) => {
      if (!termPositions.has(token)) {
        termPositions.set(token, []);
      }
      termPositions.get(token)!.push(position);
    });
    
    // Update inverted index
    for (const [term, positions] of termPositions.entries()) {
      if (!this.searchIndex.invertedIndex.has(term)) {
        this.searchIndex.invertedIndex.set(term, {
          term,
          documents: new Map(),
          totalFrequency: 0
        });
      }
      
      const postingList = this.searchIndex.invertedIndex.get(term)!;
      postingList.documents.set(documentId, {
        documentId,
        frequency: positions.length,
        positions,
        contexts: this.extractContexts(tokens, positions)
      });
      
      postingList.totalFrequency += positions.length;
    }
  }

  /**
   * Update entity index
   */
  private updateEntityIndex(documentId: string, entities: ResolvedLegalEntity[]): void {
    entities.forEach(entity => {
      const entityKey = entity.canonicalName.toLowerCase();
      
      if (!this.searchIndex.entityIndex.has(entityKey)) {
        this.searchIndex.entityIndex.set(entityKey, {
          entity: entity.canonicalName,
          entityType: entity.entityType,
          documents: new Map(),
          totalOccurrences: 0
        });
      }
      
      const entityPostingList = this.searchIndex.entityIndex.get(entityKey)!;
      entityPostingList.documents.set(documentId, {
        documentId,
        occurrences: entity.mentions.length,
        positions: entity.mentions.map(m => m.startPosition),
        confidence: entity.confidence,
        contexts: entity.mentions.map(m => m.context)
      });
      
      entityPostingList.totalOccurrences += entity.mentions.length;
    });
  }

  /**
   * Update semantic index
   */
  private updateSemanticIndex(documentId: string, vector: number[], tokens: string[]): void {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    
    this.searchIndex.semanticIndex.set(documentId, {
      documentId,
      vector,
      magnitude,
      keywords: this.extractKeywords(tokens, 10)
    });
  }

  /**
   * Extract context around term positions
   */
  private extractContexts(tokens: string[], positions: number[], contextSize: number = 5): string[] {
    return positions.map(pos => {
      const start = Math.max(0, pos - contextSize);
      const end = Math.min(tokens.length, pos + contextSize + 1);
      return tokens.slice(start, end).join(' ');
    });
  }

  /**
   * Extract keywords from tokens
   */
  private extractKeywords(tokens: string[], maxKeywords: number): string[] {
    const termFreqs = new Map<string, number>();
    tokens.forEach(token => {
      termFreqs.set(token, (termFreqs.get(token) || 0) + 1);
    });
    
    return Array.from(termFreqs.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxKeywords)
      .map(([term]) => term);
  }

  /**
   * Infer document type from name and content
   */
  private inferDocumentType(name: string, content: string): string {
    const nameLower = name.toLowerCase();
    const contentLower = content.toLowerCase();
    
    if (nameLower.includes('contract') || contentLower.includes('agreement')) {
      return 'contract';
    }
    if (nameLower.includes('motion') || contentLower.includes('motion')) {
      return 'motion';
    }
    if (nameLower.includes('brief') || contentLower.includes('brief')) {
      return 'brief';
    }
    if (nameLower.includes('deposition') || contentLower.includes('deposition')) {
      return 'deposition';
    }
    if (nameLower.includes('correspondence') || contentLower.includes('letter')) {
      return 'correspondence';
    }
    
    return 'other';
  }

  /**
   * Update index metadata after indexing
   */
  private async updateIndexMetadata(): Promise<void> {
    const docs = Array.from(this.searchIndex.documents.values());
    
    this.searchIndex.metadata = {
      totalDocuments: docs.length,
      totalTerms: this.searchIndex.invertedIndex.size,
      totalEntities: this.searchIndex.entityIndex.size,
      lastUpdated: new Date(),
      version: '1.0.0',
      statistics: {
        avgDocumentLength: docs.reduce((sum, doc) => sum + doc.tokens.length, 0) / docs.length,
        avgEntityCount: docs.reduce((sum, doc) => sum + doc.entities.length, 0) / docs.length,
        commonTerms: this.getCommonTerms(10),
        rareTerms: this.getRareTerms(10)
      }
    };
  }

  /**
   * Get most common terms
   */
  private getCommonTerms(count: number): string[] {
    return Array.from(this.searchIndex.invertedIndex.entries())
      .sort((a, b) => b[1].totalFrequency - a[1].totalFrequency)
      .slice(0, count)
      .map(([term]) => term);
  }

  /**
   * Get rarest terms
   */
  private getRareTerms(count: number): string[] {
    return Array.from(this.searchIndex.invertedIndex.entries())
      .sort((a, b) => a[1].totalFrequency - b[1].totalFrequency)
      .slice(0, count)
      .map(([term]) => term);
  }

  /**
   * Perform search across indexed documents
   */
  async search(query: SearchQuery): Promise<SearchResult[]> {
    console.log(`🔍 Searching: "${query.text}" (${query.type})`);
    
    if (this.isIndexing) {
      throw new Error('Cannot search while indexing is in progress');
    }
    
    const startTime = Date.now();
    let results: SearchResult[] = [];
    
    try {
      switch (query.type) {
        case 'fulltext':
          results = await this.performFullTextSearch(query);
          break;
        case 'semantic':
          results = await this.performSemanticSearch(query);
          break;
        case 'entity':
          results = await this.performEntitySearch(query);
          break;
        case 'hybrid':
          results = await this.performHybridSearch(query);
          break;
        default:
          throw new Error(`Unsupported search type: ${query.type}`);
      }
      
      // Apply filters
      results = this.applyFilters(results, query.filters);
      
      // Apply ranking
      results = this.rankResults(results, query.options?.rankingStrategy || 'relevance');
      
      // Limit results
      const maxResults = query.options?.maxResults || 50;
      results = results.slice(0, maxResults);
      
      const searchTime = Date.now() - startTime;
      console.log(`✅ Search completed: ${results.length} results in ${searchTime}ms`);
      
      this.emit('searchComplete', {
        query: query.text,
        resultCount: results.length,
        searchTime
      });
      
      return results;
      
    } catch (error) {
      console.error('❌ Search failed:', error);
      this.emit('searchError', error);
      throw error;
    }
  }

  /**
   * Perform full-text search
   */
  private async performFullTextSearch(query: SearchQuery): Promise<SearchResult[]> {
    const searchTerms = this.tokenizeText(query.text);
    const results: SearchResult[] = [];
    
    // Find documents containing search terms
    const candidateDocuments = new Set<string>();
    
    for (const term of searchTerms) {
      const postingList = this.searchIndex.invertedIndex.get(term);
      if (postingList) {
        for (const docId of postingList.documents.keys()) {
          candidateDocuments.add(docId);
        }
      }
    }
    
    // Score and create results
    for (const docId of candidateDocuments) {
      const doc = this.searchIndex.documents.get(docId);
      if (!doc) continue;
      
      const score = this.calculateFullTextScore(searchTerms, doc);
      if (score > 0) {
        const snippets = this.generateSnippets(searchTerms, doc, query.options);
        const entityMatches = this.findEntityMatches(searchTerms, doc);
        
        results.push({
          documentId: doc.id,
          documentName: doc.name,
          score,
          relevanceType: 'exact',
          snippets,
          entities: entityMatches,
          metadata: doc.metadata
        });
      }
    }
    
    return results;
  }

  /**
   * Perform semantic search
   */
  private async performSemanticSearch(query: SearchQuery): Promise<SearchResult[]> {
    const queryTokens = this.tokenizeText(query.text);
    const queryVector = await this.generateSemanticVector(query.text, queryTokens);
    const results: SearchResult[] = [];
    
    const threshold = query.options?.semanticThreshold || 0.3;
    
    // Calculate semantic similarity with all documents
    for (const [docId, semanticDoc] of this.searchIndex.semanticIndex.entries()) {
      const similarity = this.calculateCosineSimilarity(queryVector, semanticDoc.vector);
      
      if (similarity >= threshold) {
        const doc = this.searchIndex.documents.get(docId);
        if (!doc) continue;
        
        const snippets = this.generateSemanticSnippets(queryTokens, doc, query.options);
        const entityMatches = this.findEntityMatches(queryTokens, doc);
        
        results.push({
          documentId: doc.id,
          documentName: doc.name,
          score: similarity,
          relevanceType: 'semantic',
          snippets,
          entities: entityMatches,
          metadata: doc.metadata
        });
      }
    }
    
    return results;
  }

  /**
   * Perform entity search
   */
  private async performEntitySearch(query: SearchQuery): Promise<SearchResult[]> {
    const queryText = query.text.toLowerCase();
    const results: SearchResult[] = [];
    
    // Search entity index
    for (const [entityKey, entityPosting] of this.searchIndex.entityIndex.entries()) {
      if (entityKey.includes(queryText) || entityPosting.entity.toLowerCase().includes(queryText)) {
        
        for (const [docId, occurrence] of entityPosting.documents.entries()) {
          const doc = this.searchIndex.documents.get(docId);
          if (!doc) continue;
          
          const score = occurrence.confidence * (occurrence.occurrences / entityPosting.totalOccurrences);
          const snippets = this.generateEntitySnippets(entityPosting.entity, doc, query.options);
          
          results.push({
            documentId: doc.id,
            documentName: doc.name,
            score,
            relevanceType: 'entity',
            snippets,
            entities: [{
              entity: entityPosting.entity,
              entityType: entityPosting.entityType,
              confidence: occurrence.confidence,
              positions: occurrence.positions,
              context: occurrence.contexts
            }],
            metadata: doc.metadata
          });
        }
      }
    }
    
    return results;
  }

  /**
   * Perform hybrid search combining multiple approaches
   */
  private async performHybridSearch(query: SearchQuery): Promise<SearchResult[]> {
    // Perform all search types
    const [fullTextResults, semanticResults, entityResults] = await Promise.all([
      this.performFullTextSearch(query),
      this.performSemanticSearch(query),
      this.performEntitySearch(query)
    ]);
    
    // Merge and deduplicate results
    const mergedResults = new Map<string, SearchResult>();
    
    // Weight different search types
    const weights = { fulltext: 0.4, semantic: 0.4, entity: 0.2 };
    
    // Add full-text results
    fullTextResults.forEach(result => {
      mergedResults.set(result.documentId, {
        ...result,
        score: result.score * weights.fulltext,
        relevanceType: 'exact'
      });
    });
    
    // Merge semantic results
    semanticResults.forEach(result => {
      const existing = mergedResults.get(result.documentId);
      if (existing) {
        existing.score += result.score * weights.semantic;
        existing.relevanceType = 'context';
      } else {
        mergedResults.set(result.documentId, {
          ...result,
          score: result.score * weights.semantic,
          relevanceType: 'semantic'
        });
      }
    });
    
    // Merge entity results
    entityResults.forEach(result => {
      const existing = mergedResults.get(result.documentId);
      if (existing) {
        existing.score += result.score * weights.entity;
        existing.entities = [...existing.entities, ...result.entities];
      } else {
        mergedResults.set(result.documentId, {
          ...result,
          score: result.score * weights.entity,
          relevanceType: 'entity'
        });
      }
    });
    
    return Array.from(mergedResults.values());
  }

  /**
   * Calculate full-text score for document
   */
  private calculateFullTextScore(searchTerms: string[], doc: IndexedDocument): number {
    let score = 0;
    
    for (const term of searchTerms) {
      const postingList = this.searchIndex.invertedIndex.get(term);
      if (!postingList) continue;
      
      const termFreq = postingList.documents.get(doc.id);
      if (!termFreq) continue;
      
      // TF-IDF scoring with legal term weighting
      const tf = termFreq.frequency / doc.tokens.length;
      const idf = Math.log(this.searchIndex.metadata.totalDocuments / postingList.documents.size);
      const legalWeight = this.legalTermWeights.get(term) || 1.0;
      
      score += tf * idf * legalWeight;
    }
    
    return score;
  }

  /**
   * Calculate cosine similarity between vectors
   */
  private calculateCosineSimilarity(vector1: number[], vector2: number[]): number {
    if (vector1.length !== vector2.length) return 0;
    
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;
    
    for (let i = 0; i < vector1.length; i++) {
      dotProduct += vector1[i] * vector2[i];
      magnitude1 += vector1[i] * vector1[i];
      magnitude2 += vector2[i] * vector2[i];
    }
    
    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);
    
    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    
    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Generate search snippets
   */
  private generateSnippets(searchTerms: string[], doc: IndexedDocument, options?: SearchOptions): SearchSnippet[] {
    if (!options?.includeSnippets) return [];
    
    const snippets: SearchSnippet[] = [];
    const snippetLength = options.snippetLength || 200;
    const content = doc.content;
    
    for (const term of searchTerms) {
      const postingList = this.searchIndex.invertedIndex.get(term);
      if (!postingList) continue;
      
      const termFreq = postingList.documents.get(doc.id);
      if (!termFreq) continue;
      
      for (const context of termFreq.contexts.slice(0, 3)) { // Max 3 snippets per term
        const startOffset = Math.max(0, content.indexOf(context) - 50);
        const endOffset = Math.min(content.length, startOffset + snippetLength);
        const text = content.substring(startOffset, endOffset);
        
        const highlighted = options.highlightTerms ? 
          text.replace(new RegExp(term, 'gi'), `<mark>$&</mark>`) : text;
        
        snippets.push({
          text,
          startOffset,
          endOffset,
          highlighted,
          context,
          score: 1.0
        });
      }
    }
    
    return snippets.slice(0, 5); // Max 5 snippets per document
  }

  /**
   * Generate semantic snippets
   */
  private generateSemanticSnippets(queryTokens: string[], doc: IndexedDocument, options?: SearchOptions): SearchSnippet[] {
    // Simplified semantic snippet generation
    return this.generateSnippets(queryTokens, doc, options);
  }

  /**
   * Generate entity snippets
   */
  private generateEntitySnippets(entityName: string, doc: IndexedDocument, options?: SearchOptions): SearchSnippet[] {
    if (!options?.includeSnippets) return [];
    
    const snippets: SearchSnippet[] = [];
    const content = doc.content;
    const entityLower = entityName.toLowerCase();
    
    let searchIndex = 0;
    while (searchIndex < content.length) {
      const foundIndex = content.toLowerCase().indexOf(entityLower, searchIndex);
      if (foundIndex === -1) break;
      
      const startOffset = Math.max(0, foundIndex - 100);
      const endOffset = Math.min(content.length, foundIndex + entityName.length + 100);
      const text = content.substring(startOffset, endOffset);
      
      const highlighted = options?.highlightTerms ? 
        text.replace(new RegExp(entityName, 'gi'), `<mark>$&</mark>`) : text;
      
      snippets.push({
        text,
        startOffset,
        endOffset,
        highlighted,
        context: text,
        score: 1.0
      });
      
      searchIndex = foundIndex + entityName.length;
      if (snippets.length >= 3) break; // Max 3 snippets per entity
    }
    
    return snippets;
  }

  /**
   * Find entity matches in search terms
   */
  private findEntityMatches(searchTerms: string[], doc: IndexedDocument): EntityMatch[] {
    const matches: EntityMatch[] = [];
    
    for (const entity of doc.entities) {
      const entityNameTokens = this.tokenizeText(entity.canonicalName);
      const hasMatch = searchTerms.some(term => 
        entityNameTokens.some(entityToken => 
          entityToken.includes(term) || term.includes(entityToken)
        )
      );
      
      if (hasMatch) {
        matches.push({
          entity: entity.canonicalName,
          entityType: entity.entityType,
          confidence: entity.confidence,
          positions: entity.mentions.map(m => m.startPosition),
          context: entity.mentions.map(m => m.context)
        });
      }
    }
    
    return matches;
  }

  /**
   * Apply search filters
   */
  private applyFilters(results: SearchResult[], filters?: SearchFilters): SearchResult[] {
    if (!filters) return results;
    
    return results.filter(result => {
      // Document type filter
      if (filters.documentTypes && filters.documentTypes.length > 0) {
        if (!filters.documentTypes.includes(result.metadata.documentType)) {
          return false;
        }
      }
      
      // Date range filter
      if (filters.dateRange) {
        const docDate = result.metadata.createdDate || result.metadata.modifiedDate;
        if (docDate) {
          if (filters.dateRange.start && docDate < filters.dateRange.start) return false;
          if (filters.dateRange.end && docDate > filters.dateRange.end) return false;
        }
      }
      
      // Entity filter
      if (filters.entities && filters.entities.length > 0) {
        const hasRequiredEntity = filters.entities.some(requiredEntity =>
          result.entities.some(entityMatch => 
            entityMatch.entity.toLowerCase().includes(requiredEntity.toLowerCase())
          )
        );
        if (!hasRequiredEntity) return false;
      }
      
      // Confidence threshold filter
      if (filters.confidenceThreshold !== undefined) {
        if (result.score < filters.confidenceThreshold) return false;
      }
      
      // Case ID filter
      if (filters.caseIds && filters.caseIds.length > 0) {
        if (!filters.caseIds.includes(result.metadata.caseId || '')) {
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Rank search results
   */
  private rankResults(results: SearchResult[], strategy: string): SearchResult[] {
    switch (strategy) {
      case 'relevance':
        return results.sort((a, b) => b.score - a.score);
      
      case 'date':
        return results.sort((a, b) => {
          const dateA = a.metadata.createdDate || a.metadata.modifiedDate || new Date(0);
          const dateB = b.metadata.createdDate || b.metadata.modifiedDate || new Date(0);
          return dateB.getTime() - dateA.getTime();
        });
      
      case 'importance':
        return results.sort((a, b) => {
          const importanceA = this.calculateImportanceScore(a);
          const importanceB = this.calculateImportanceScore(b);
          return importanceB - importanceA;
        });
      
      case 'entity_density':
        return results.sort((a, b) => b.entities.length - a.entities.length);
      
      default:
        return results.sort((a, b) => b.score - a.score);
    }
  }

  /**
   * Calculate importance score based on document type and content
   */
  private calculateImportanceScore(result: SearchResult): number {
    let score = result.score;
    
    // Boost based on document type
    const typeBoosts = {
      'contract': 1.5,
      'motion': 1.3,
      'brief': 1.4,
      'deposition': 1.2,
      'correspondence': 1.0,
      'other': 0.8
    };
    
    score *= typeBoosts[result.metadata.documentType as keyof typeof typeBoosts] || 1.0;
    
    // Boost based on entity density
    score *= 1 + (result.entities.length * 0.1);
    
    return score;
  }

  /**
   * Get search index statistics
   */
  getIndexStatistics(): SearchIndexMetadata {
    return { ...this.searchIndex.metadata };
  }

  /**
   * Check if indexing is in progress
   */
  isIndexingInProgress(): boolean {
    return this.isIndexing;
  }

  /**
   * Get indexing progress
   */
  getIndexingProgress(): number {
    return this.indexingProgress;
  }

  /**
   * Clear search index
   */
  clearIndex(): void {
    this.initializeSearchIndex();
    console.log('🔍 Search index cleared');
  }
}

// Export factory function
export function createEnterpriseSearchEngine(): EnterpriseSearchEngine {
  return new EnterpriseSearchEngine();
}

console.log('🔍 Enterprise Search Engine module loaded');