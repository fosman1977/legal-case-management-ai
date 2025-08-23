/**
 * Semantic Document Analysis - Week 7 Day 1-2
 * Advanced pattern recognition and contradiction detection
 */

import { pipeline } from '@huggingface/transformers'

class SemanticAnalyzer {
  constructor() {
    this.embedder = null
    this.similarity_threshold = 0.85
  }

  async initialize() {
    this.embedder = await pipeline('sentence-similarity', 'sentence-transformers/all-MiniLM-L6-v2')
  }

  async analyzeDocumentSimilarity(documents) {
    const embeddings = await Promise.all(
      documents.map(doc => this.embedder(doc.content))
    )

    const similarities = []
    for (let i = 0; i < documents.length; i++) {
      for (let j = i + 1; j < documents.length; j++) {
        const similarity = this.cosineSimilarity(embeddings[i], embeddings[j])
        if (similarity > this.similarity_threshold) {
          similarities.push({
            doc1: documents[i],
            doc2: documents[j],
            similarity_score: similarity,
            pattern_type: this.classifySimilarityPattern(similarity, documents[i], documents[j])
          })
        }
      }
    }

    return similarities
  }

  async detectSemanticContradictions(documents) {
    const contradictions = []
    
    for (let i = 0; i < documents.length; i++) {
      for (let j = i + 1; j < documents.length; j++) {
        const contradiction = await this.findContradictions(documents[i], documents[j])
        if (contradiction.confidence > 0.8) {
          contradictions.push({
            doc1: documents[i],
            doc2: documents[j],
            contradiction: contradiction,
            pattern: this.createContradictionPattern(contradiction)
          })
        }
      }
    }

    return contradictions
  }

  createContradictionPattern(contradiction) {
    // Create abstract pattern for Claude consultation
    return {
      type: "semantic_contradiction",
      pattern: `Document type ${contradiction.doc1_type} contradicts ${contradiction.doc2_type} regarding ${contradiction.topic}`,
      severity: contradiction.severity,
      confidence: contradiction.confidence,
      resolution_strategy: contradiction.suggested_resolution
    }
  }

  cosineSimilarity(vecA, vecB) {
    // Handle both tensor and array inputs
    const a = Array.isArray(vecA) ? vecA : vecA.data || vecA
    const b = Array.isArray(vecB) ? vecB : vecB.data || vecB
    
    let dotProduct = 0
    let normA = 0
    let normB = 0
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  classifySimilarityPattern(similarity, doc1, doc2) {
    const type1 = doc1.type || 'unknown'
    const type2 = doc2.type || 'unknown'
    
    if (similarity > 0.95) {
      return {
        category: 'near_duplicate',
        description: `${type1} and ${type2} documents are nearly identical`,
        legal_implication: 'Potential document redundancy or versioning issue'
      }
    } else if (similarity > 0.90) {
      return {
        category: 'high_overlap',
        description: `${type1} and ${type2} documents share significant content`,
        legal_implication: 'Documents may reference same events or evidence'
      }
    } else if (similarity > this.similarity_threshold) {
      return {
        category: 'related_content',
        description: `${type1} and ${type2} documents contain related information`,
        legal_implication: 'Documents may be part of same legal matter or chain'
      }
    }
    
    return {
      category: 'unrelated',
      description: 'Documents appear unrelated',
      legal_implication: 'No significant content overlap detected'
    }
  }

  async findContradictions(doc1, doc2) {
    // Extract key claims and statements from both documents
    const claims1 = await this.extractClaims(doc1)
    const claims2 = await this.extractClaims(doc2)
    
    const contradictions = []
    
    for (const claim1 of claims1) {
      for (const claim2 of claims2) {
        const contradiction = await this.compareClaimsForContradiction(claim1, claim2)
        if (contradiction.confidence > 0.8) {
          contradictions.push(contradiction)
        }
      }
    }
    
    if (contradictions.length === 0) {
      return {
        confidence: 0.0,
        contradictions: [],
        doc1_type: doc1.type,
        doc2_type: doc2.type
      }
    }
    
    // Return the highest confidence contradiction
    const topContradiction = contradictions.reduce((max, current) => 
      current.confidence > max.confidence ? current : max
    )
    
    return {
      confidence: topContradiction.confidence,
      contradictions: contradictions,
      topic: topContradiction.topic,
      doc1_type: doc1.type || 'unknown',
      doc2_type: doc2.type || 'unknown',
      severity: this.assessContradictionSeverity(topContradiction),
      suggested_resolution: this.suggestResolution(topContradiction, doc1, doc2)
    }
  }

  async extractClaims(document) {
    const content = document.content || document.text || ''
    
    // Simple claim extraction - look for assertive statements
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10)
    
    const claims = []
    for (const sentence of sentences) {
      const trimmed = sentence.trim()
      
      // Look for assertive patterns
      if (this.isAssertiveStatement(trimmed)) {
        claims.push({
          text: trimmed,
          type: this.classifyClaimType(trimmed),
          confidence: this.calculateClaimConfidence(trimmed),
          entities: await this.extractEntitiesFromClaim(trimmed)
        })
      }
    }
    
    return claims
  }

  isAssertiveStatement(sentence) {
    const assertivePatterns = [
      /\b(is|are|was|were|will be|shall be)\b/i,
      /\b(states|confirms|declares|certifies)\b/i,
      /\b(on|dated|occurred|happened)\b/i,
      /\b(amount|sum|total|paid|received)\b/i,
      /\b(agreed|contracted|promised)\b/i
    ]
    
    return assertivePatterns.some(pattern => pattern.test(sentence))
  }

  classifyClaimType(claim) {
    if (/\b(amount|sum|total|\$|£|€)\b/i.test(claim)) return 'financial'
    if (/\b(date|on|occurred|happened|when)\b/i.test(claim)) return 'temporal'
    if (/\b(agreed|contracted|promised|terms)\b/i.test(claim)) return 'contractual'
    if (/\b(states|declares|confirms|certifies)\b/i.test(claim)) return 'declarative'
    return 'factual'
  }

  calculateClaimConfidence(claim) {
    let confidence = 0.5
    
    // Increase confidence for specific patterns
    if (/\b(specifically|explicitly|clearly)\b/i.test(claim)) confidence += 0.2
    if (/\b(amount|sum|date|number)\b/i.test(claim)) confidence += 0.15
    if (/\b(section|clause|paragraph)\b/i.test(claim)) confidence += 0.1
    
    // Decrease confidence for uncertain language
    if (/\b(may|might|possibly|perhaps|unclear)\b/i.test(claim)) confidence -= 0.2
    if (/\b(approximately|about|around)\b/i.test(claim)) confidence -= 0.1
    
    return Math.min(Math.max(confidence, 0.1), 1.0)
  }

  async extractEntitiesFromClaim(claim) {
    // Simple entity extraction
    const entities = {
      dates: this.extractDates(claim),
      amounts: this.extractAmounts(claim),
      names: this.extractNames(claim),
      locations: this.extractLocations(claim)
    }
    
    return entities
  }

  extractDates(text) {
    const datePatterns = [
      /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
      /\b\d{1,2}-\d{1,2}-\d{2,4}\b/g,
      /\b\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{2,4}\b/gi,
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{2,4}\b/gi
    ]
    
    const dates = []
    datePatterns.forEach(pattern => {
      const matches = text.match(pattern) || []
      dates.push(...matches)
    })
    
    return dates
  }

  extractAmounts(text) {
    const amountPatterns = [
      /[\$£€]\s*[\d,]+\.?\d*/g,
      /\b\d+\.\d{2}\s*(dollars?|pounds?|euros?)\b/gi,
      /\b\d{1,3}(,\d{3})*(\.\d{2})?\b/g
    ]
    
    const amounts = []
    amountPatterns.forEach(pattern => {
      const matches = text.match(pattern) || []
      amounts.push(...matches)
    })
    
    return amounts
  }

  extractNames(text) {
    // Simple name extraction - capitalized words
    const namePattern = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g
    return text.match(namePattern) || []
  }

  extractLocations(text) {
    // Simple location extraction
    const locationPattern = /\b[A-Z][a-z]+\s+(Street|Road|Avenue|Lane|Drive|Court|Place|Way)\b/g
    return text.match(locationPattern) || []
  }

  async compareClaimsForContradiction(claim1, claim2) {
    // Calculate semantic similarity between claims
    if (!this.embedder) {
      await this.initialize()
    }
    
    const embedding1 = await this.embedder(claim1.text)
    const embedding2 = await this.embedder(claim2.text)
    const similarity = this.cosineSimilarity(embedding1, embedding2)
    
    // High similarity with different claim types or entities suggests contradiction
    let contradictionConfidence = 0.0
    let contradictionType = 'none'
    let topic = 'general'
    
    if (similarity > 0.7 && claim1.type === claim2.type) {
      // Same topic, check for contradictory entities
      const entityConflict = this.checkEntityConflicts(claim1.entities, claim2.entities)
      
      if (entityConflict.hasConflict) {
        contradictionConfidence = Math.min(0.9, similarity + 0.1)
        contradictionType = entityConflict.type
        topic = entityConflict.topic
      }
    }
    
    // Check for explicit negation patterns
    if (this.hasNegationConflict(claim1.text, claim2.text)) {
      contradictionConfidence = Math.max(contradictionConfidence, 0.85)
      contradictionType = 'explicit_negation'
      topic = 'factual_contradiction'
    }
    
    return {
      confidence: contradictionConfidence,
      type: contradictionType,
      topic: topic,
      claim1: claim1.text,
      claim2: claim2.text,
      similarity: similarity
    }
  }

  checkEntityConflicts(entities1, entities2) {
    // Check for conflicting dates
    if (entities1.dates.length > 0 && entities2.dates.length > 0) {
      const datesMatch = entities1.dates.some(d1 => 
        entities2.dates.some(d2 => this.normalizeDateString(d1) === this.normalizeDateString(d2))
      )
      if (!datesMatch) {
        return {
          hasConflict: true,
          type: 'date_contradiction',
          topic: 'temporal_facts'
        }
      }
    }
    
    // Check for conflicting amounts
    if (entities1.amounts.length > 0 && entities2.amounts.length > 0) {
      const amountsMatch = entities1.amounts.some(a1 => 
        entities2.amounts.some(a2 => this.normalizeAmount(a1) === this.normalizeAmount(a2))
      )
      if (!amountsMatch) {
        return {
          hasConflict: true,
          type: 'amount_contradiction',
          topic: 'financial_facts'
        }
      }
    }
    
    return { hasConflict: false }
  }

  normalizeDateString(dateStr) {
    // Simple date normalization
    try {
      return new Date(dateStr).toISOString().split('T')[0]
    } catch {
      return dateStr.toLowerCase().replace(/\s+/g, '')
    }
  }

  normalizeAmount(amountStr) {
    // Extract numeric value from amount string
    const numericMatch = amountStr.match(/[\d,]+\.?\d*/)
    return numericMatch ? numericMatch[0].replace(/,/g, '') : amountStr
  }

  hasNegationConflict(text1, text2) {
    // Check for explicit contradictions
    const negationPairs = [
      ['is', 'is not'],
      ['was', 'was not'],
      ['will', 'will not'],
      ['did', 'did not'],
      ['can', 'cannot'],
      ['agreed', 'disagreed'],
      ['paid', 'unpaid'],
      ['present', 'absent']
    ]
    
    for (const [positive, negative] of negationPairs) {
      if ((text1.toLowerCase().includes(positive) && text2.toLowerCase().includes(negative)) ||
          (text1.toLowerCase().includes(negative) && text2.toLowerCase().includes(positive))) {
        return true
      }
    }
    
    return false
  }

  assessContradictionSeverity(contradiction) {
    if (contradiction.confidence > 0.9) return 'critical'
    if (contradiction.confidence > 0.85) return 'high'
    if (contradiction.confidence > 0.8) return 'medium'
    return 'low'
  }

  suggestResolution(contradiction, doc1, doc2) {
    switch (contradiction.type) {
      case 'date_contradiction':
        return 'Review document dates for accuracy and chronological consistency'
      case 'amount_contradiction':
        return 'Verify financial figures and calculation accuracy across documents'
      case 'explicit_negation':
        return 'Investigate contradictory statements and determine authoritative source'
      default:
        return 'Further investigation required to resolve semantic inconsistency'
    }
  }

  // Additional utility methods for semantic analysis
  async analyzeDocumentRelationships(documents) {
    const relationships = []
    
    for (let i = 0; i < documents.length; i++) {
      for (let j = i + 1; j < documents.length; j++) {
        const similarity = await this.calculateDocumentSimilarity(documents[i], documents[j])
        const contradiction = await this.findContradictions(documents[i], documents[j])
        
        relationships.push({
          doc1_id: documents[i].id || i,
          doc2_id: documents[j].id || j,
          similarity_score: similarity,
          contradiction_score: contradiction.confidence,
          relationship_type: this.determineRelationshipType(similarity, contradiction.confidence),
          semantic_patterns: this.extractSemanticPatterns(documents[i], documents[j])
        })
      }
    }
    
    return relationships
  }

  async calculateDocumentSimilarity(doc1, doc2) {
    if (!this.embedder) {
      await this.initialize()
    }
    
    const embedding1 = await this.embedder(doc1.content || doc1.text || '')
    const embedding2 = await this.embedder(doc2.content || doc2.text || '')
    
    return this.cosineSimilarity(embedding1, embedding2)
  }

  determineRelationshipType(similarity, contradictionScore) {
    if (contradictionScore > 0.8) {
      return 'contradictory'
    } else if (similarity > 0.9) {
      return 'highly_related'
    } else if (similarity > 0.7) {
      return 'related'
    } else if (similarity > 0.5) {
      return 'somewhat_related'
    } else {
      return 'unrelated'
    }
  }

  extractSemanticPatterns(doc1, doc2) {
    return {
      common_entities: this.findCommonEntities(doc1, doc2),
      temporal_relationship: this.analyzeTemporalRelationship(doc1, doc2),
      content_overlap_type: this.classifyContentOverlap(doc1, doc2),
      legal_relationship: this.determineLegalRelationship(doc1, doc2)
    }
  }

  findCommonEntities(doc1, doc2) {
    // Extract and compare entities between documents
    const entities1 = this.extractAllEntities(doc1.content || doc1.text || '')
    const entities2 = this.extractAllEntities(doc2.content || doc2.text || '')
    
    const common = {
      dates: entities1.dates.filter(d1 => entities2.dates.some(d2 => this.normalizeDateString(d1) === this.normalizeDateString(d2))),
      amounts: entities1.amounts.filter(a1 => entities2.amounts.some(a2 => this.normalizeAmount(a1) === this.normalizeAmount(a2))),
      names: entities1.names.filter(n1 => entities2.names.some(n2 => n1.toLowerCase() === n2.toLowerCase())),
      locations: entities1.locations.filter(l1 => entities2.locations.some(l2 => l1.toLowerCase() === l2.toLowerCase()))
    }
    
    return common
  }

  extractAllEntities(text) {
    return {
      dates: this.extractDates(text),
      amounts: this.extractAmounts(text),
      names: this.extractNames(text),
      locations: this.extractLocations(text)
    }
  }

  analyzeTemporalRelationship(doc1, doc2) {
    const dates1 = this.extractDates(doc1.content || doc1.text || '')
    const dates2 = this.extractDates(doc2.content || doc2.text || '')
    
    if (dates1.length === 0 || dates2.length === 0) {
      return 'unknown'
    }
    
    // Simple temporal analysis
    try {
      const date1 = new Date(dates1[0])
      const date2 = new Date(dates2[0])
      
      if (date1.getTime() === date2.getTime()) {
        return 'concurrent'
      } else if (date1 < date2) {
        return 'doc1_before_doc2'
      } else {
        return 'doc2_before_doc1'
      }
    } catch {
      return 'unparseable'
    }
  }

  classifyContentOverlap(doc1, doc2) {
    const type1 = doc1.type || 'unknown'
    const type2 = doc2.type || 'unknown'
    
    if (type1 === type2) {
      return 'same_document_type'
    } else if (this.areRelatedDocumentTypes(type1, type2)) {
      return 'related_document_types'
    } else {
      return 'different_document_types'
    }
  }

  areRelatedDocumentTypes(type1, type2) {
    const relatedTypes = {
      'contract': ['agreement', 'terms', 'invoice'],
      'email': ['correspondence', 'communication', 'letter'],
      'invoice': ['receipt', 'payment', 'bill'],
      'report': ['analysis', 'assessment', 'evaluation']
    }
    
    return Object.entries(relatedTypes).some(([key, related]) => 
      (key === type1 && related.includes(type2)) || (key === type2 && related.includes(type1))
    )
  }

  determineLegalRelationship(doc1, doc2) {
    // Simple legal relationship classification
    const legalTerms1 = this.extractLegalTerms(doc1.content || doc1.text || '')
    const legalTerms2 = this.extractLegalTerms(doc2.content || doc2.text || '')
    
    const commonLegalTerms = legalTerms1.filter(term => legalTerms2.includes(term))
    
    if (commonLegalTerms.length > 3) {
      return 'same_legal_matter'
    } else if (commonLegalTerms.length > 0) {
      return 'related_legal_matter'
    } else {
      return 'different_legal_matter'
    }
  }

  extractLegalTerms(text) {
    const legalTerms = [
      'contract', 'agreement', 'clause', 'liability', 'damages', 'breach',
      'plaintiff', 'defendant', 'claimant', 'respondent', 'settlement',
      'jurisdiction', 'statute', 'regulation', 'precedent', 'case law',
      'negligence', 'tort', 'warranty', 'indemnity', 'confidentiality'
    ]
    
    const foundTerms = []
    const lowerText = text.toLowerCase()
    
    legalTerms.forEach(term => {
      if (lowerText.includes(term)) {
        foundTerms.push(term)
      }
    })
    
    return foundTerms
  }

  // Confidence scoring system
  calculateOverallConfidence(similarities, contradictions, relationships) {
    let confidence = 0.8 // Base confidence
    
    // Adjust based on similarities
    const avgSimilarity = similarities.reduce((sum, sim) => sum + sim.similarity_score, 0) / similarities.length || 0
    if (avgSimilarity > 0.9) confidence += 0.1
    else if (avgSimilarity < 0.3) confidence -= 0.1
    
    // Adjust based on contradictions
    const highConfidenceContradictions = contradictions.filter(c => c.contradiction.confidence > 0.8).length
    if (highConfidenceContradictions > 0) {
      confidence -= Math.min(0.3, highConfidenceContradictions * 0.1)
    }
    
    // Adjust based on relationship consistency
    const consistentRelationships = relationships.filter(r => r.relationship_type !== 'contradictory').length
    const totalRelationships = relationships.length || 1
    const consistencyRatio = consistentRelationships / totalRelationships
    confidence = confidence * consistencyRatio
    
    return Math.max(0.1, Math.min(1.0, confidence))
  }

  // Main analysis method
  async performSemanticAnalysis(documents) {
    if (!Array.isArray(documents) || documents.length < 2) {
      throw new Error('Semantic analysis requires at least 2 documents')
    }
    
    await this.initialize()
    
    const [similarities, contradictions, relationships] = await Promise.all([
      this.analyzeDocumentSimilarity(documents),
      this.detectSemanticContradictions(documents),
      this.analyzeDocumentRelationships(documents)
    ])
    
    const overallConfidence = this.calculateOverallConfidence(similarities, contradictions, relationships)
    
    return {
      document_count: documents.length,
      similarities: similarities,
      contradictions: contradictions,
      relationships: relationships,
      overall_confidence: overallConfidence,
      semantic_patterns: this.generateSemanticSummary(similarities, contradictions, relationships),
      analysis_metadata: {
        analyzer_version: '1.0.0',
        analysis_timestamp: new Date().toISOString(),
        similarity_threshold: this.similarity_threshold,
        confidence_threshold: 0.8
      }
    }
  }

  generateSemanticSummary(similarities, contradictions, relationships) {
    return {
      total_similarities_found: similarities.length,
      high_confidence_contradictions: contradictions.filter(c => c.contradiction.confidence > 0.8).length,
      relationship_distribution: this.calculateRelationshipDistribution(relationships),
      key_patterns: this.identifyKeyPatterns(similarities, contradictions, relationships),
      privacy_notes: 'Analysis performed on content patterns only - no personal data retained'
    }
  }

  calculateRelationshipDistribution(relationships) {
    const distribution = {}
    relationships.forEach(rel => {
      const type = rel.relationship_type
      distribution[type] = (distribution[type] || 0) + 1
    })
    return distribution
  }

  identifyKeyPatterns(similarities, contradictions, relationships) {
    const patterns = []
    
    if (similarities.length > 0) {
      patterns.push(`Found ${similarities.length} document similarities above threshold`)
    }
    
    if (contradictions.length > 0) {
      patterns.push(`Detected ${contradictions.length} potential contradictions`)
    }
    
    const contradictoryRels = relationships.filter(r => r.relationship_type === 'contradictory').length
    if (contradictoryRels > 0) {
      patterns.push(`${contradictoryRels} contradictory document relationships identified`)
    }
    
    return patterns
  }
}

export default SemanticAnalyzer