/**
 * Qdrant Search Engine - Week 11 Day 1-2
 * Vector database integration for semantic document search
 */

import { QdrantClient } from '@qdrant/js-client-rest'
import { pipeline } from '@xenova/transformers'

class QdrantSearchEngine {
  constructor() {
    this.client = new QdrantClient({ url: 'http://localhost:6333' })
    this.collection_name = 'legal_documents'
    this.embedder = null
    
    this.search_config = {
      vector_size: 384, // MiniLM-L6-v2 output size
      similarity_metric: 'Cosine',
      default_search_limit: 10,
      min_similarity_threshold: 0.7
    }
    
    this.pattern_weights = {
      legal_issues: 0.3,
      entities: 0.2,
      timeline: 0.2,
      evidence: 0.15,
      relationships: 0.15
    }
  }

  async initialize() {
    console.log('🚀 Initializing Qdrant search engine...')
    
    try {
      await this.setupCollection()
      this.embedder = await pipeline('feature-extraction', 'sentence-transformers/all-MiniLM-L6-v2')
      console.log('✅ Qdrant search engine initialized successfully')
      return true
    } catch (error) {
      console.error('❌ Failed to initialize Qdrant:', error)
      throw error
    }
  }

  async setupCollection() {
    try {
      await this.client.createCollection(this.collection_name, {
        vectors: {
          size: this.search_config.vector_size,
          distance: this.search_config.similarity_metric
        },
        optimizers_config: {
          default_segment_number: 2
        },
        replication_factor: 1
      })
      console.log(`✅ Created collection: ${this.collection_name}`)
    } catch (error) {
      // Collection might already exist
      if (error.status === 409) {
        console.log(`ℹ️ Collection ${this.collection_name} already exists`)
      } else {
        console.error('Collection setup error:', error.message)
        throw error
      }
    }
  }

  async indexDocument(document, analysis_results, case_context) {
    try {
      console.log(`📥 Indexing document: ${document.id}`)
      
      // Generate embeddings for different aspects of the document
      const embeddings = await this.generateDocumentEmbeddings(document, analysis_results)
      
      // Create comprehensive metadata
      const metadata = {
        // Document metadata (anonymized)
        document_id: document.id,
        document_type: analysis_results.document_type || document.type || 'general',
        document_name: document.name || 'Unknown Document',
        case_id: case_context.case_id || 'unknown_case',
        processing_date: new Date().toISOString(),
        
        // Analysis metadata
        entity_count: analysis_results.entities?.length || 0,
        legal_issues: analysis_results.legal_issues || [],
        complexity_score: analysis_results.complexity_score || this.calculateComplexityScore(analysis_results),
        confidence_score: analysis_results.confidence_score || 0.8,
        
        // Pattern metadata for similar case matching
        pattern_signature: this.createPatternSignature(analysis_results),
        jurisdiction: case_context.jurisdiction || 'unknown',
        practice_area: case_context.practice_area || 'general',
        case_type: case_context.case_type || 'litigation',
        
        // Timeline metadata
        timeline_events: analysis_results.timeline_analysis?.timeline_events?.length || 0,
        date_range: this.extractDateRange(analysis_results),
        
        // Evidence metadata
        evidence_strength: analysis_results.evidence_analysis?.overall_strength || 'unknown',
        evidence_count: analysis_results.evidence_analysis?.evidence_items?.length || 0,
        
        // Relationship metadata
        key_entities: this.extractKeyEntities(analysis_results),
        relationship_count: analysis_results.relationship_analysis?.relationships?.length || 0,
        
        // Vector components for specialized search
        content_embedding_id: `${document.id}_content`,
        legal_embedding_id: `${document.id}_legal`,
        entity_embedding_id: `${document.id}_entity`
      }
      
      // Store main document vector
      await this.client.upsert(this.collection_name, {
        points: [{
          id: this.generateVectorId(document.id),
          vector: embeddings.combined,
          payload: metadata
        }]
      })
      
      console.log(`✅ Successfully indexed document: ${document.id}`)
      
      return {
        success: true,
        document_id: document.id,
        vector_id: this.generateVectorId(document.id),
        embeddings_generated: Object.keys(embeddings).length,
        metadata_stored: true
      }
      
    } catch (error) {
      console.error(`❌ Failed to index document ${document.id}:`, error)
      throw error
    }
  }

  async generateDocumentEmbeddings(document, analysis_results) {
    const embeddings = {}
    
    // Content embedding - main document text
    const content_text = document.content || document.text || ''
    if (content_text) {
      const content_result = await this.embedder(content_text.slice(0, 512)) // Limit for model
      embeddings.content = Array.from(content_result.data)
    }
    
    // Legal concepts embedding
    const legal_concepts = this.extractLegalConcepts(analysis_results)
    if (legal_concepts) {
      const legal_result = await this.embedder(legal_concepts)
      embeddings.legal_concepts = Array.from(legal_result.data)
    }
    
    // Entities embedding
    const entities_text = this.formatEntitiesForEmbedding(analysis_results.entities || [])
    if (entities_text) {
      const entities_result = await this.embedder(entities_text)
      embeddings.entities = Array.from(entities_result.data)
    }
    
    // Combined embedding - weighted average
    embeddings.combined = this.combineEmbeddings(embeddings)
    
    return embeddings
  }

  combineEmbeddings(embeddings) {
    const weights = {
      content: 0.5,
      legal_concepts: 0.3,
      entities: 0.2
    }
    
    const combined = new Array(this.search_config.vector_size).fill(0)
    let total_weight = 0
    
    for (const [key, embedding] of Object.entries(embeddings)) {
      if (key !== 'combined' && embedding) {
        const weight = weights[key] || 0.1
        for (let i = 0; i < embedding.length; i++) {
          combined[i] += embedding[i] * weight
        }
        total_weight += weight
      }
    }
    
    // Normalize
    if (total_weight > 0) {
      for (let i = 0; i < combined.length; i++) {
        combined[i] /= total_weight
      }
    }
    
    return combined
  }

  async searchSimilarDocuments(query, filters = {}) {
    try {
      console.log(`🔍 Searching for: "${query}"`)
      
      // Generate query embedding
      const query_result = await this.embedder(query)
      const query_embedding = Array.from(query_result.data)
      
      // Build search parameters
      const search_params = {
        vector: query_embedding,
        limit: filters.limit || this.search_config.default_search_limit,
        with_payload: true,
        with_vector: false
      }
      
      // Add filters if provided
      if (Object.keys(filters).length > 0) {
        search_params.filter = this.buildFilterQuery(filters)
      }
      
      // Execute search
      const search_results = await this.client.search(this.collection_name, search_params)
      
      // Process and enhance results
      const enhanced_results = search_results.map(result => ({
        document_id: result.payload.document_id,
        document_name: result.payload.document_name,
        document_type: result.payload.document_type,
        similarity_score: result.score,
        relevance_percentage: Math.round(result.score * 100),
        metadata: {
          case_id: result.payload.case_id,
          practice_area: result.payload.practice_area,
          jurisdiction: result.payload.jurisdiction,
          complexity_score: result.payload.complexity_score,
          entity_count: result.payload.entity_count,
          evidence_strength: result.payload.evidence_strength,
          processing_date: result.payload.processing_date
        },
        relevance_explanation: this.explainRelevance(result, query)
      }))
      
      // Filter by minimum similarity threshold
      const filtered_results = enhanced_results.filter(
        r => r.similarity_score >= this.search_config.min_similarity_threshold
      )
      
      console.log(`✅ Found ${filtered_results.length} relevant documents`)
      
      return {
        query: query,
        total_results: filtered_results.length,
        results: filtered_results,
        search_timestamp: new Date().toISOString()
      }
      
    } catch (error) {
      console.error('❌ Search failed:', error)
      throw error
    }
  }

  async findSimilarCasePatterns(case_analysis, limit = 5) {
    try {
      console.log('🔍 Finding similar case patterns...')
      
      // Create pattern signature for current case
      const case_signature = this.createPatternSignature(case_analysis)
      const pattern_text = this.formatPatternForEmbedding(case_signature)
      
      // Generate pattern embedding
      const pattern_result = await this.embedder(pattern_text)
      const pattern_embedding = Array.from(pattern_result.data)
      
      // Search for similar patterns
      const search_params = {
        vector: pattern_embedding,
        limit: limit,
        with_payload: true,
        score_threshold: 0.6 // Lower threshold for pattern matching
      }
      
      // Add practice area filter if available
      if (case_analysis.practice_area) {
        search_params.filter = {
          must: [
            { key: 'practice_area', match: { value: case_analysis.practice_area } }
          ]
        }
      }
      
      const similar_cases = await this.client.search(this.collection_name, search_params)
      
      // Analyze and enhance results
      const pattern_matches = similar_cases.map(case_match => ({
        case_id: case_match.payload.case_id,
        document_id: case_match.payload.document_id,
        similarity_score: case_match.score,
        similarity_percentage: Math.round(case_match.score * 100),
        pattern_similarities: this.analyzePatternSimilarities(
          case_signature, 
          case_match.payload.pattern_signature
        ),
        strategic_insights: this.extractStrategicInsights(case_match.payload),
        key_differences: this.identifyKeyDifferences(case_signature, case_match.payload.pattern_signature),
        relevance_factors: {
          practice_area_match: case_match.payload.practice_area === case_analysis.practice_area,
          jurisdiction_match: case_match.payload.jurisdiction === case_analysis.jurisdiction,
          complexity_similarity: Math.abs(
            (case_match.payload.complexity_score || 0) - (case_analysis.complexity_score || 0)
          ) < 0.2,
          evidence_strength_similar: case_match.payload.evidence_strength === case_analysis.evidence_strength
        }
      }))
      
      console.log(`✅ Found ${pattern_matches.length} similar case patterns`)
      
      return {
        query_case: {
          case_id: case_analysis.case_id,
          pattern_signature: case_signature
        },
        similar_patterns: pattern_matches,
        recommendations: this.generatePatternRecommendations(pattern_matches),
        search_timestamp: new Date().toISOString()
      }
      
    } catch (error) {
      console.error('❌ Pattern search failed:', error)
      throw error
    }
  }

  createPatternSignature(analysis_results) {
    return {
      // Legal pattern signature
      legal_issues: analysis_results.legal_issues || [],
      legal_concepts: this.extractLegalConcepts(analysis_results),
      
      // Entity pattern signature
      entity_types: this.categorizeEntityTypes(analysis_results.entities || []),
      entity_relationships: analysis_results.relationship_analysis?.relationship_types || [],
      
      // Timeline pattern signature
      timeline_complexity: analysis_results.timeline_analysis?.complexity || 'medium',
      event_density: analysis_results.timeline_analysis?.timeline_events?.length || 0,
      temporal_span: this.calculateTemporalSpan(analysis_results),
      
      // Evidence pattern signature
      evidence_types: this.categorizeEvidenceTypes(analysis_results.evidence_analysis),
      evidence_strength: analysis_results.evidence_analysis?.overall_strength || 'unknown',
      corroboration_level: analysis_results.evidence_analysis?.corroboration_score || 0,
      
      // Complexity indicators
      document_count: analysis_results.document_count || 1,
      complexity_score: analysis_results.complexity_score || 0.5,
      confidence_level: analysis_results.confidence_score || 0.8
    }
  }

  analyzePatternSimilarities(pattern1, pattern2) {
    if (!pattern1 || !pattern2) return { overall_similarity: 0 }
    
    const similarities = {
      legal_issues: this.calculateArraySimilarity(pattern1.legal_issues, pattern2.legal_issues),
      entity_types: this.calculateObjectSimilarity(pattern1.entity_types, pattern2.entity_types),
      timeline_complexity: pattern1.timeline_complexity === pattern2.timeline_complexity ? 1 : 0.5,
      evidence_strength: pattern1.evidence_strength === pattern2.evidence_strength ? 1 : 0.3,
      complexity_score: 1 - Math.abs(pattern1.complexity_score - pattern2.complexity_score)
    }
    
    // Calculate weighted overall similarity
    const weights = {
      legal_issues: 0.35,
      entity_types: 0.2,
      timeline_complexity: 0.15,
      evidence_strength: 0.2,
      complexity_score: 0.1
    }
    
    let overall_similarity = 0
    let total_weight = 0
    
    for (const [key, similarity] of Object.entries(similarities)) {
      const weight = weights[key] || 0.1
      overall_similarity += similarity * weight
      total_weight += weight
    }
    
    similarities.overall_similarity = total_weight > 0 ? overall_similarity / total_weight : 0
    
    return similarities
  }

  extractStrategicInsights(case_metadata) {
    const insights = []
    
    // Evidence-based insights
    if (case_metadata.evidence_strength === 'strong') {
      insights.push({
        type: 'evidence',
        insight: 'Strong evidence foundation similar to this case',
        recommendation: 'Leverage similar evidence presentation strategies'
      })
    }
    
    // Complexity-based insights
    if (case_metadata.complexity_score > 0.8) {
      insights.push({
        type: 'complexity',
        insight: 'High complexity case with multiple interconnected issues',
        recommendation: 'Consider phased approach to case presentation'
      })
    }
    
    // Entity-based insights
    if (case_metadata.entity_count > 10) {
      insights.push({
        type: 'entities',
        insight: 'Multiple parties involved requiring careful relationship mapping',
        recommendation: 'Create comprehensive dramatis personae documentation'
      })
    }
    
    // Timeline-based insights
    if (case_metadata.timeline_events > 20) {
      insights.push({
        type: 'timeline',
        insight: 'Complex temporal sequence requiring detailed chronology',
        recommendation: 'Develop visual timeline for court presentation'
      })
    }
    
    return insights
  }

  buildFilterQuery(filters) {
    const must_conditions = []
    const should_conditions = []
    
    // Build must conditions (AND)
    if (filters.case_id) {
      must_conditions.push({ key: 'case_id', match: { value: filters.case_id } })
    }
    
    if (filters.practice_area) {
      must_conditions.push({ key: 'practice_area', match: { value: filters.practice_area } })
    }
    
    if (filters.jurisdiction) {
      must_conditions.push({ key: 'jurisdiction', match: { value: filters.jurisdiction } })
    }
    
    if (filters.document_type) {
      must_conditions.push({ key: 'document_type', match: { value: filters.document_type } })
    }
    
    // Build should conditions (OR)
    if (filters.min_complexity) {
      should_conditions.push({ 
        key: 'complexity_score', 
        range: { gte: filters.min_complexity } 
      })
    }
    
    if (filters.evidence_strength) {
      should_conditions.push({ 
        key: 'evidence_strength', 
        match: { value: filters.evidence_strength } 
      })
    }
    
    // Combine conditions
    const filter_query = {}
    
    if (must_conditions.length > 0) {
      filter_query.must = must_conditions
    }
    
    if (should_conditions.length > 0) {
      filter_query.should = should_conditions
    }
    
    return Object.keys(filter_query).length > 0 ? filter_query : null
  }

  explainRelevance(search_result, query) {
    const explanations = []
    const score = search_result.score
    const payload = search_result.payload
    
    // Score-based explanation
    if (score > 0.9) {
      explanations.push('Very high semantic similarity to query')
    } else if (score > 0.8) {
      explanations.push('Strong semantic match with query terms')
    } else if (score > 0.7) {
      explanations.push('Good contextual relevance to query')
    }
    
    // Metadata-based explanations
    if (payload.legal_issues && payload.legal_issues.length > 0) {
      explanations.push(`Contains ${payload.legal_issues.length} relevant legal issues`)
    }
    
    if (payload.evidence_strength === 'strong') {
      explanations.push('Strong evidence alignment')
    }
    
    if (payload.entity_count > 5) {
      explanations.push(`Rich entity context (${payload.entity_count} entities)`)
    }
    
    return explanations.join('; ')
  }

  // Utility methods
  extractLegalConcepts(analysis_results) {
    const concepts = []
    
    if (analysis_results.legal_issues) {
      concepts.push(...analysis_results.legal_issues)
    }
    
    if (analysis_results.semantic_analysis?.key_themes) {
      concepts.push(...analysis_results.semantic_analysis.key_themes.map(t => t.theme))
    }
    
    return concepts.join(' ')
  }

  formatEntitiesForEmbedding(entities) {
    if (!entities || entities.length === 0) return ''
    
    return entities
      .map(entity => `${entity.type}: ${entity.anonymized_value || entity.name}`)
      .join('; ')
  }

  categorizeEntityTypes(entities) {
    const types = {}
    
    entities.forEach(entity => {
      const type = entity.type || 'unknown'
      types[type] = (types[type] || 0) + 1
    })
    
    return types
  }

  categorizeEvidenceTypes(evidence_analysis) {
    if (!evidence_analysis?.evidence_items) return []
    
    const types = new Set()
    evidence_analysis.evidence_items.forEach(item => {
      if (item.type) types.add(item.type)
    })
    
    return Array.from(types)
  }

  calculateTemporalSpan(analysis_results) {
    if (!analysis_results.timeline_analysis?.timeline_events) return 0
    
    const events = analysis_results.timeline_analysis.timeline_events
    if (events.length < 2) return 0
    
    const dates = events.map(e => new Date(e.date)).sort((a, b) => a - b)
    const span_days = (dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24)
    
    return Math.round(span_days)
  }

  calculateComplexityScore(analysis_results) {
    let score = 0.5 // Base score
    
    // Adjust based on various factors
    if (analysis_results.entities?.length > 10) score += 0.1
    if (analysis_results.timeline_analysis?.timeline_events?.length > 20) score += 0.1
    if (analysis_results.evidence_analysis?.evidence_items?.length > 15) score += 0.1
    if (analysis_results.legal_issues?.length > 5) score += 0.1
    if (analysis_results.relationship_analysis?.relationships?.length > 25) score += 0.1
    
    return Math.min(score, 1.0)
  }

  extractDateRange(analysis_results) {
    if (!analysis_results.timeline_analysis?.timeline_events) {
      return { start: null, end: null }
    }
    
    const events = analysis_results.timeline_analysis.timeline_events
    const dates = events.map(e => new Date(e.date)).sort((a, b) => a - b)
    
    return {
      start: dates[0]?.toISOString() || null,
      end: dates[dates.length - 1]?.toISOString() || null
    }
  }

  extractKeyEntities(analysis_results) {
    if (!analysis_results.entities) return []
    
    // Extract top entities by importance/frequency
    return analysis_results.entities
      .filter(e => e.confidence > 0.7)
      .slice(0, 10)
      .map(e => ({
        type: e.type,
        value: e.anonymized_value || e.name
      }))
  }

  formatPatternForEmbedding(pattern_signature) {
    const parts = []
    
    if (pattern_signature.legal_issues?.length > 0) {
      parts.push(`Legal issues: ${pattern_signature.legal_issues.join(', ')}`)
    }
    
    if (pattern_signature.legal_concepts) {
      parts.push(`Concepts: ${pattern_signature.legal_concepts}`)
    }
    
    if (pattern_signature.evidence_strength) {
      parts.push(`Evidence: ${pattern_signature.evidence_strength}`)
    }
    
    if (pattern_signature.complexity_score) {
      parts.push(`Complexity: ${pattern_signature.complexity_score}`)
    }
    
    return parts.join('; ')
  }

  calculateArraySimilarity(arr1, arr2) {
    if (!arr1 || !arr2) return 0
    
    const set1 = new Set(arr1)
    const set2 = new Set(arr2)
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])
    
    return union.size > 0 ? intersection.size / union.size : 0
  }

  calculateObjectSimilarity(obj1, obj2) {
    if (!obj1 || !obj2) return 0
    
    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)
    const allKeys = new Set([...keys1, ...keys2])
    
    let similarity = 0
    for (const key of allKeys) {
      if (obj1[key] && obj2[key]) {
        similarity += 1 - Math.abs(obj1[key] - obj2[key]) / Math.max(obj1[key], obj2[key])
      }
    }
    
    return allKeys.size > 0 ? similarity / allKeys.size : 0
  }

  identifyKeyDifferences(pattern1, pattern2) {
    const differences = []
    
    if (pattern1.evidence_strength !== pattern2.evidence_strength) {
      differences.push({
        aspect: 'evidence_strength',
        pattern1: pattern1.evidence_strength,
        pattern2: pattern2.evidence_strength
      })
    }
    
    if (Math.abs(pattern1.complexity_score - pattern2.complexity_score) > 0.3) {
      differences.push({
        aspect: 'complexity',
        pattern1: pattern1.complexity_score,
        pattern2: pattern2.complexity_score
      })
    }
    
    if (pattern1.timeline_complexity !== pattern2.timeline_complexity) {
      differences.push({
        aspect: 'timeline_complexity',
        pattern1: pattern1.timeline_complexity,
        pattern2: pattern2.timeline_complexity
      })
    }
    
    return differences
  }

  generatePatternRecommendations(pattern_matches) {
    const recommendations = []
    
    // Analyze common successful patterns
    const strong_evidence_patterns = pattern_matches.filter(
      p => p.strategic_insights.some(i => i.type === 'evidence')
    )
    
    if (strong_evidence_patterns.length > 0) {
      recommendations.push({
        type: 'evidence_strategy',
        recommendation: 'Similar cases with strong evidence succeeded with systematic presentation',
        confidence: 0.8
      })
    }
    
    // Complexity handling recommendations
    const complex_patterns = pattern_matches.filter(
      p => p.pattern_similarities.complexity_score > 0.8
    )
    
    if (complex_patterns.length > 0) {
      recommendations.push({
        type: 'case_management',
        recommendation: 'Complex similar cases benefited from phased litigation approach',
        confidence: 0.75
      })
    }
    
    return recommendations
  }

  generateVectorId(document_id) {
    // Generate unique vector ID from document ID
    return `vec_${document_id}_${Date.now()}`
  }

  // Status and management methods
  async getCollectionStatus() {
    try {
      const collection_info = await this.client.getCollection(this.collection_name)
      
      return {
        collection_name: this.collection_name,
        vector_count: collection_info.vectors_count,
        vector_size: this.search_config.vector_size,
        distance_metric: this.search_config.similarity_metric,
        status: 'active'
      }
    } catch (error) {
      return {
        collection_name: this.collection_name,
        status: 'error',
        error: error.message
      }
    }
  }

  async clearCollection() {
    try {
      await this.client.deleteCollection(this.collection_name)
      await this.setupCollection()
      console.log('✅ Collection cleared and recreated')
      return true
    } catch (error) {
      console.error('❌ Failed to clear collection:', error)
      throw error
    }
  }

  getEngineStatus() {
    return {
      engine_type: 'QdrantSearchEngine',
      collection: this.collection_name,
      vector_size: this.search_config.vector_size,
      similarity_metric: this.search_config.similarity_metric,
      embedder_model: 'sentence-transformers/all-MiniLM-L6-v2',
      capabilities: [
        'Semantic document search',
        'Similar case pattern matching',
        'Multi-dimensional vector storage',
        'Filtered search queries',
        'Pattern-based recommendations',
        'Strategic insight extraction'
      ],
      configuration: this.search_config
    }
  }
}

export default QdrantSearchEngine