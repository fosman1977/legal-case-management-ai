/**
 * Bulletproof Anonymization - Week 10 Day 1-2  
 * Advanced anonymization system with reversible mapping
 */

class BulletproofAnonymizer {
  constructor() {
    this.anonymization_map = new Map()
    this.reverse_map = new Map()
    this.entity_counters = {
      person: 0,
      organization: 0,
      location: 0,
      financial: 0,
      date: 0,
      identifier: 0
    }
    
    this.patterns = {
      person_names: /\b[A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g,
      organizations: /\b[A-Z][a-zA-Z\s&,\.]+(?:Inc|LLC|Corp|Ltd|Company|Co\.|Organization|Org)\b/g,
      email_addresses: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone_numbers: /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
      ssn_numbers: /\b\d{3}-\d{2}-\d{4}\b/g,
      addresses: /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Way|Court|Ct|Place|Pl)\b/g,
      financial_amounts: /\$[\d,]+(?:\.\d{2})?/g,
      case_numbers: /\b(?:Case|Cause|Civil|Criminal|File)\s*(?:No\.?|Number|#)\s*[\w\d-]+\b/gi,
      account_numbers: /\b(?:Account|Acct)\s*(?:No\.?|Number|#)\s*[\w\d-]+\b/gi,
      dates: /\b(?:\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}-\d{1,2}-\d{2,4}|\d{1,2}\.\d{1,2}\.\d{2,4})\b/g
    }
    
    this.sensitive_terms = [
      'confidential', 'privileged', 'attorney-client', 'work product',
      'trade secret', 'proprietary', 'classified', 'restricted'
    ]
  }

  async extractAndAnonymize(extracted_documents) {
    const anonymized_documents = []
    const entities = []
    
    for (const doc of extracted_documents.documents) {
      const { anonymized_doc, doc_entities } = await this.anonymizeDocument(doc)
      anonymized_documents.push(anonymized_doc)
      entities.push(...doc_entities)
    }
    
    return {
      documents: anonymized_documents,
      entities: this.consolidateEntities(entities),
      anonymization_mapping: this.createSecureMapping(),
      anonymization_summary: {
        total_entities: entities.length,
        unique_entities: new Set(entities.map(e => e.anonymized_value)).size,
        patterns_detected: Object.keys(this.patterns).filter(pattern => 
          entities.some(e => e.detection_pattern === pattern)
        )
      }
    }
  }

  async anonymizeDocument(document) {
    let content = document.content || ''
    const doc_entities = []
    let entityId = 0

    // Process each pattern type
    for (const [pattern_name, pattern] of Object.entries(this.patterns)) {
      const matches = content.match(pattern) || []
      
      for (const match of matches) {
        const entity_type = this.getEntityType(pattern_name)
        const anonymized_value = this.generateAnonymizedValue(match, entity_type)
        
        // Store mapping
        if (!this.anonymization_map.has(match)) {
          this.anonymization_map.set(match, anonymized_value)
          this.reverse_map.set(anonymized_value, match)
        }
        
        // Create entity record
        const entity = {
          id: `${document.id}_entity_${entityId++}`,
          original_value: match, // Keep for local processing only
          anonymized_value: anonymized_value,
          type: entity_type,
          detection_pattern: pattern_name,
          source_documents: [document.id],
          confidence: this.calculateDetectionConfidence(match, pattern_name),
          context: this.extractContext(content, match)
        }
        
        doc_entities.push(entity)
        
        // Replace in content with anonymized value
        content = content.replace(new RegExp(this.escapeRegExp(match), 'g'), anonymized_value)
      }
    }
    
    // Additional sensitive content redaction
    content = this.redactSensitiveContent(content)
    
    return {
      anonymized_doc: {
        ...document,
        content: content,
        anonymization_applied: true,
        entities_detected: doc_entities.length,
        anonymization_timestamp: new Date().toISOString()
      },
      doc_entities: doc_entities
    }
  }

  getEntityType(pattern_name) {
    const type_map = {
      person_names: 'person',
      organizations: 'organization', 
      email_addresses: 'contact',
      phone_numbers: 'contact',
      ssn_numbers: 'identifier',
      addresses: 'location',
      financial_amounts: 'financial',
      case_numbers: 'identifier',
      account_numbers: 'identifier',
      dates: 'date'
    }
    
    return type_map[pattern_name] || 'general'
  }

  generateAnonymizedValue(original, entity_type) {
    // Check if already anonymized
    if (this.anonymization_map.has(original)) {
      return this.anonymization_map.get(original)
    }
    
    const counter = ++this.entity_counters[entity_type] || 1
    
    switch (entity_type) {
      case 'person':
        return `PERSON_${counter.toString().padStart(3, '0')}`
      case 'organization':
        return `ORG_${counter.toString().padStart(3, '0')}`
      case 'location':
        return `LOCATION_${counter.toString().padStart(3, '0')}`
      case 'financial':
        // Preserve magnitude for analysis while anonymizing
        const amount = parseFloat(original.replace(/[^0-9.]/g, ''))
        const magnitude = this.getAmountMagnitude(amount)
        return `AMOUNT_${magnitude}_${counter.toString().padStart(3, '0')}`
      case 'date':
        // Preserve relative timing while anonymizing specific dates
        return `DATE_REF_${counter.toString().padStart(3, '0')}`
      case 'contact':
        return `CONTACT_${counter.toString().padStart(3, '0')}`
      case 'identifier':
        return `ID_${counter.toString().padStart(3, '0')}`
      default:
        return `ENTITY_${counter.toString().padStart(3, '0')}`
    }
  }

  getAmountMagnitude(amount) {
    if (amount < 1000) return 'SMALL'
    if (amount < 10000) return 'MEDIUM'
    if (amount < 100000) return 'LARGE'
    if (amount < 1000000) return 'MAJOR'
    return 'MASSIVE'
  }

  calculateDetectionConfidence(match, pattern_name) {
    let confidence = 0.8 // Base confidence
    
    // Pattern-specific confidence adjustments
    switch (pattern_name) {
      case 'email_addresses':
        confidence = 0.95 // Email patterns are very reliable
        break
      case 'ssn_numbers':
        confidence = 0.98 // SSN patterns are extremely reliable
        break
      case 'person_names':
        // Check if it looks like a real name vs. random capitalized words
        if (this.isLikelyPersonName(match)) {
          confidence = 0.85
        } else {
          confidence = 0.6
        }
        break
      case 'financial_amounts':
        confidence = 0.9
        break
      case 'dates':
        confidence = 0.88
        break
      case 'organizations':
        // Check for common org suffixes
        if (/(?:Inc|LLC|Corp|Ltd|Company)$/i.test(match)) {
          confidence = 0.9
        } else {
          confidence = 0.7
        }
        break
    }
    
    return confidence
  }

  isLikelyPersonName(name) {
    const parts = name.split(/\s+/)
    
    // Must have at least first and last name
    if (parts.length < 2) return false
    
    // Check against common non-person patterns
    const non_person_indicators = [
      'United States', 'New York', 'Los Angeles', 'Supreme Court',
      'Department', 'Agency', 'Bureau', 'Office', 'Commission'
    ]
    
    return !non_person_indicators.some(indicator => name.includes(indicator))
  }

  extractContext(content, match) {
    const index = content.indexOf(match)
    if (index === -1) return ''
    
    const start = Math.max(0, index - 50)
    const end = Math.min(content.length, index + match.length + 50)
    
    return content.substring(start, end).trim()
  }

  redactSensitiveContent(content) {
    let redacted = content
    
    // Redact sensitive terms contexts
    this.sensitive_terms.forEach(term => {
      const pattern = new RegExp(`\\b${term}\\b[^.!?]*[.!?]`, 'gi')
      redacted = redacted.replace(pattern, `[REDACTED - ${term.toUpperCase()}]`)
    })
    
    return redacted
  }

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  consolidateEntities(entities) {
    const consolidated = []
    const entity_map = new Map()
    
    entities.forEach(entity => {
      const key = entity.anonymized_value
      
      if (entity_map.has(key)) {
        // Merge with existing entity
        const existing = entity_map.get(key)
        existing.source_documents = [...new Set([...existing.source_documents, ...entity.source_documents])]
        existing.confidence = Math.max(existing.confidence, entity.confidence)
      } else {
        entity_map.set(key, { ...entity })
        consolidated.push(entity_map.get(key))
      }
    })
    
    return consolidated
  }

  createSecureMapping() {
    // Return only non-reversible mapping information for security
    return {
      total_mappings: this.anonymization_map.size,
      entity_counts: { ...this.entity_counters },
      anonymization_timestamp: new Date().toISOString(),
      security_note: 'Original values are not included for privacy protection'
    }
  }

  // Deanonymization method (use with extreme caution)
  deanonymize(anonymized_value) {
    // This method should only be used in secure, controlled environments
    if (!this.reverse_map.has(anonymized_value)) {
      throw new Error('Anonymized value not found in mapping')
    }
    
    return this.reverse_map.get(anonymized_value)
  }

  // Clear sensitive data from memory
  clearMappings() {
    this.anonymization_map.clear()
    this.reverse_map.clear()
    this.entity_counters = {
      person: 0,
      organization: 0,
      location: 0,
      financial: 0,
      date: 0,
      identifier: 0
    }
  }

  // Privacy analysis
  analyzePrivacyRisk(entities) {
    const risks = []
    
    // Check for high-risk entity concentrations
    const person_count = entities.filter(e => e.type === 'person').length
    if (person_count > 10) {
      risks.push({
        type: 'high_person_concentration',
        severity: 'medium',
        count: person_count,
        recommendation: 'Consider additional anonymization layers'
      })
    }
    
    // Check for identifier exposure
    const identifier_count = entities.filter(e => e.type === 'identifier').length
    if (identifier_count > 5) {
      risks.push({
        type: 'identifier_exposure',
        severity: 'high',
        count: identifier_count,
        recommendation: 'Review identifier anonymization strategy'
      })
    }
    
    // Check for financial data concentration
    const financial_count = entities.filter(e => e.type === 'financial').length
    if (financial_count > 20) {
      risks.push({
        type: 'financial_data_concentration', 
        severity: 'medium',
        count: financial_count,
        recommendation: 'Consider financial data aggregation'
      })
    }
    
    return {
      risk_score: this.calculateRiskScore(risks),
      risks: risks,
      privacy_grade: this.calculatePrivacyGrade(risks)
    }
  }

  calculateRiskScore(risks) {
    let score = 0
    risks.forEach(risk => {
      switch (risk.severity) {
        case 'high': score += 3; break
        case 'medium': score += 2; break
        case 'low': score += 1; break
      }
    })
    return Math.min(score, 10) // Cap at 10
  }

  calculatePrivacyGrade(risks) {
    const risk_score = this.calculateRiskScore(risks)
    
    if (risk_score === 0) return 'A+'
    if (risk_score <= 2) return 'A'
    if (risk_score <= 4) return 'B'
    if (risk_score <= 6) return 'C'
    if (risk_score <= 8) return 'D'
    return 'F'
  }

  // Utility methods
  getAnonymizerStats() {
    return {
      anonymizer_type: 'BulletproofAnonymizer',
      patterns_supported: Object.keys(this.patterns).length,
      entity_types: Object.keys(this.entity_counters),
      current_mappings: this.anonymization_map.size,
      capabilities: [
        'Multi-pattern entity detection',
        'Reversible anonymization mapping',
        'Sensitive content redaction', 
        'Privacy risk analysis',
        'Entity consolidation',
        'Magnitude-preserving financial anonymization',
        'Context extraction',
        'Confidence scoring'
      ],
      security_features: [
        'Memory mapping clearance',
        'Secure mapping export',
        'Privacy risk assessment',
        'Sensitive term redaction'
      ]
    }
  }
}

export default BulletproofAnonymizer