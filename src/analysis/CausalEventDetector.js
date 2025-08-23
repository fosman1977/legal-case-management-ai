/**
 * Causal Event Detection - Week 8 Day 1-2
 * Advanced causation pattern detection and analysis
 */

class CausalEventDetector {
  constructor() {
    this.causalPatterns = [
      // Direct causation
      /\b(?:caused by|results from|due to|because of|as a result of|stems from|originates from)\b/gi,
      /\b(?:causes|results in|leads to|brings about|produces|generates|creates)\b/gi,
      
      // Conditional causation
      /\b(?:if.*then|when.*occurs|should.*happen|in the event of|provided that)\b/gi,
      
      // Consequential patterns
      /\b(?:consequently|therefore|thus|hence|accordingly|as a consequence|in consequence)\b/gi,
      
      // Enabling conditions
      /\b(?:enables|allows|permits|facilitates|makes possible|paves the way for)\b/gi,
      
      // Preventive causation
      /\b(?:prevents|stops|blocks|hinders|impedes|precludes|avoids)\b/gi,
      
      // Temporal causation
      /\b(?:following|after|subsequent to|in response to|triggered by|prompted by)\b/gi
    ]
    
    this.eventIndicators = [
      // Legal events
      /\b(?:agreement|contract|breach|violation|default|payment|delivery|performance|notice|demand|claim|lawsuit|settlement|judgment)\b/gi,
      
      // Action words
      /\b(?:occurred|happened|took place|transpired|ensued|commenced|began|started|ended|concluded|completed)\b/gi,
      
      // State changes
      /\b(?:became|turned|changed|transformed|converted|evolved|developed|deteriorated|improved)\b/gi,
      
      // Communication events
      /\b(?:informed|notified|advised|communicated|disclosed|reported|announced|declared)\b/gi
    ]
    
    this.strengthIndicators = [
      // Strong causation
      { pattern: /\b(?:directly caused|solely responsible|primary cause|main reason)\b/gi, strength: 0.9 },
      
      // Medium causation
      { pattern: /\b(?:contributed to|played a role|factor in|influenced|affected)\b/gi, strength: 0.7 },
      
      // Weak causation
      { pattern: /\b(?:may have caused|possibly led to|potentially resulted|might have)\b/gi, strength: 0.5 },
      
      // Negative causation
      { pattern: /\b(?:did not cause|unrelated to|independent of|not responsible)\b/gi, strength: 0.1 }
    ]
  }

  async detectCausalEvents(content) {
    const events = []
    let eventId = 0

    // Split content into sentences for analysis
    const sentences = this.splitIntoSentences(content)
    
    sentences.forEach((sentence, index) => {
      const causalRelations = this.identifyCausalRelations(sentence)
      
      causalRelations.forEach(relation => {
        const event = {
          id: `event_${eventId++}`,
          sentence_index: index,
          sentence: sentence.trim(),
          causation_type: relation.type,
          cause: relation.cause,
          effect: relation.effect,
          causal_strength: relation.strength,
          confidence: relation.confidence,
          temporal_indicators: this.extractTemporalIndicators(sentence),
          context_entities: this.extractContextEntities(sentence),
          legal_significance: this.assessLegalSignificance(relation, sentence)
        }
        
        events.push(event)
      })
    })

    return {
      causal_events: events,
      causation_chains: this.buildCausationChains(events),
      causal_network: this.buildCausalNetwork(events),
      analysis_summary: this.analyzeCausalComplexity(events)
    }
  }

  splitIntoSentences(content) {
    return content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 15) // Minimum length for meaningful causal analysis
  }

  identifyCausalRelations(sentence) {
    const relations = []
    const lowerSentence = sentence.toLowerCase()
    
    // Check for causal patterns
    this.causalPatterns.forEach((pattern, patternIndex) => {
      const matches = sentence.match(pattern)
      
      if (matches) {
        matches.forEach(match => {
          const relation = this.extractCausalRelation(sentence, match, patternIndex)
          if (relation) {
            relations.push(relation)
          }
        })
      }
    })
    
    return relations
  }

  extractCausalRelation(sentence, causalMarker, patternIndex) {
    const markerPosition = sentence.toLowerCase().indexOf(causalMarker.toLowerCase())
    
    // Determine causation direction based on pattern type
    const causationType = this.getCausationType(patternIndex)
    
    let cause, effect
    
    if (causationType === 'forward_causation') {
      // Cause comes before marker, effect after
      cause = this.extractCausePhrase(sentence.substring(0, markerPosition))
      effect = this.extractEffectPhrase(sentence.substring(markerPosition + causalMarker.length))
    } else if (causationType === 'backward_causation') {
      // Effect comes before marker, cause after
      effect = this.extractEffectPhrase(sentence.substring(0, markerPosition))
      cause = this.extractCausePhrase(sentence.substring(markerPosition + causalMarker.length))
    } else {
      // Complex causation - requires more analysis
      const parts = this.analyzeComplexCausation(sentence, causalMarker)
      cause = parts.cause
      effect = parts.effect
    }
    
    if (cause && effect) {
      return {
        type: causationType,
        cause: cause.trim(),
        effect: effect.trim(),
        marker: causalMarker,
        strength: this.calculateCausalStrength(sentence, causalMarker),
        confidence: this.calculateCausalConfidence(sentence, cause, effect, causalMarker)
      }
    }
    
    return null
  }

  getCausationType(patternIndex) {
    const types = [
      'backward_causation',  // caused by, results from, due to
      'forward_causation',   // causes, results in, leads to
      'conditional_causation', // if...then, when...occurs
      'consequential',       // consequently, therefore
      'enabling',            // enables, allows
      'preventive',          // prevents, stops
      'temporal_causation'   // following, after
    ]
    return types[patternIndex] || 'general_causation'
  }

  extractCausePhrase(text) {
    // Extract meaningful cause phrase
    const words = text.trim().split(/\s+/)
    
    // Look for subject-verb patterns
    const meaningfulWords = words.filter(word => 
      word.length > 2 && 
      !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with'].includes(word.toLowerCase())
    )
    
    // Take last 5-10 meaningful words as cause phrase
    return meaningfulWords.slice(-8).join(' ')
  }

  extractEffectPhrase(text) {
    // Extract meaningful effect phrase
    const words = text.trim().split(/\s+/)
    
    const meaningfulWords = words.filter(word => 
      word.length > 2 && 
      !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with'].includes(word.toLowerCase())
    )
    
    // Take first 5-10 meaningful words as effect phrase
    return meaningfulWords.slice(0, 8).join(' ')
  }

  analyzeComplexCausation(sentence, marker) {
    // For complex causation patterns, use more sophisticated analysis
    const parts = sentence.split(new RegExp(marker, 'gi'))
    
    if (parts.length >= 2) {
      return {
        cause: this.extractCausePhrase(parts[0]),
        effect: this.extractEffectPhrase(parts[1])
      }
    }
    
    return { cause: '', effect: '' }
  }

  calculateCausalStrength(sentence, marker) {
    let strength = 0.6 // Base strength
    
    // Check for strength indicators
    this.strengthIndicators.forEach(indicator => {
      if (indicator.pattern.test(sentence)) {
        strength = indicator.strength
      }
    })
    
    // Adjust based on marker strength
    const strongMarkers = ['caused by', 'results in', 'directly leads to', 'solely responsible']
    const weakMarkers = ['may have', 'possibly', 'might', 'could have']
    
    if (strongMarkers.some(strong => sentence.toLowerCase().includes(strong))) {
      strength = Math.min(strength + 0.2, 1.0)
    }
    
    if (weakMarkers.some(weak => sentence.toLowerCase().includes(weak))) {
      strength = Math.max(strength - 0.2, 0.1)
    }
    
    return strength
  }

  calculateCausalConfidence(sentence, cause, effect, marker) {
    let confidence = 0.7 // Base confidence
    
    // Longer, more detailed phrases increase confidence
    const avgPhraseLength = (cause.split(' ').length + effect.split(' ').length) / 2
    confidence += Math.min(avgPhraseLength * 0.02, 0.15)
    
    // Specific legal terminology increases confidence
    const legalTerms = ['contract', 'breach', 'payment', 'default', 'notice', 'claim', 'damages']
    const hasLegalTerms = legalTerms.some(term => sentence.toLowerCase().includes(term))
    
    if (hasLegalTerms) {
      confidence += 0.1
    }
    
    // Clear temporal structure increases confidence
    if (/\b(?:before|after|during|when|then|subsequently)\b/gi.test(sentence)) {
      confidence += 0.05
    }
    
    return Math.min(Math.max(confidence, 0.1), 1.0)
  }

  extractTemporalIndicators(sentence) {
    const temporalWords = []
    const temporalPatterns = [
      /\b(?:before|after|during|when|while|since|until|then|next|previously|subsequently|meanwhile)\b/gi,
      /\b(?:immediately|instantly|soon|later|eventually|finally|initially|originally)\b/gi,
      /\b(?:\d+\s+(?:days?|weeks?|months?|years?)\s+(?:before|after|ago|later))\b/gi
    ]
    
    temporalPatterns.forEach(pattern => {
      const matches = sentence.match(pattern) || []
      temporalWords.push(...matches)
    })
    
    return temporalWords.map(word => word.toLowerCase())
  }

  extractContextEntities(sentence) {
    const entities = {
      people: [],
      organizations: [],
      amounts: [],
      dates: [],
      legal_concepts: []
    }
    
    // Simple entity extraction
    // People (capitalized names)
    const peopleMatches = sentence.match(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g) || []
    entities.people = peopleMatches
    
    // Amounts
    const amountMatches = sentence.match(/\$[\d,]+(?:\.\d{2})?|\b\d+\.\d{2}\s*(?:dollars?|pounds?|euros?)\b/gi) || []
    entities.amounts = amountMatches
    
    // Legal concepts
    const legalConcepts = ['contract', 'agreement', 'breach', 'default', 'payment', 'delivery', 'notice', 'claim', 'damages', 'liability']
    entities.legal_concepts = legalConcepts.filter(concept => sentence.toLowerCase().includes(concept))
    
    return entities
  }

  assessLegalSignificance(relation, sentence) {
    let significance = 0.5 // Base significance
    
    // High-impact legal events
    const highImpactEvents = ['breach', 'default', 'termination', 'lawsuit', 'judgment', 'damages']
    if (highImpactEvents.some(event => sentence.toLowerCase().includes(event))) {
      significance += 0.3
    }
    
    // Financial implications
    if (/\$[\d,]+|\b\d+\.\d{2}/.test(sentence)) {
      significance += 0.2
    }
    
    // Strong causation increases legal significance
    if (relation.strength > 0.8) {
      significance += 0.1
    }
    
    // Temporal precision increases significance
    if (relation.type === 'temporal_causation') {
      significance += 0.05
    }
    
    return Math.min(significance, 1.0)
  }

  buildCausationChains(events) {
    const chains = []
    const processed = new Set()
    
    events.forEach((event, index) => {
      if (processed.has(index)) return
      
      const chain = this.findCausalChain(events, event, processed)
      if (chain.length > 1) {
        chains.push({
          id: `chain_${chains.length}`,
          events: chain,
          chain_strength: this.calculateChainStrength(chain),
          chain_confidence: this.calculateChainConfidence(chain),
          legal_impact: this.assessChainLegalImpact(chain)
        })
      }
    })
    
    return chains
  }

  findCausalChain(allEvents, startEvent, processed) {
    const chain = [startEvent]
    const startIndex = allEvents.indexOf(startEvent)
    processed.add(startIndex)
    
    // Look for events where this event's effect becomes another's cause
    const effectKeywords = this.extractKeywords(startEvent.effect)
    
    allEvents.forEach((otherEvent, index) => {
      if (processed.has(index)) return
      
      const causeKeywords = this.extractKeywords(otherEvent.cause)
      const similarity = this.calculateKeywordSimilarity(effectKeywords, causeKeywords)
      
      if (similarity > 0.6) {
        const subChain = this.findCausalChain(allEvents, otherEvent, processed)
        chain.push(...subChain)
      }
    })
    
    return chain
  }

  extractKeywords(text) {
    return text.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['that', 'this', 'with', 'from', 'they', 'them', 'were', 'have', 'been'].includes(word))
  }

  calculateKeywordSimilarity(keywords1, keywords2) {
    const set1 = new Set(keywords1)
    const set2 = new Set(keywords2)
    
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])
    
    return union.size > 0 ? intersection.size / union.size : 0
  }

  calculateChainStrength(chain) {
    if (chain.length === 0) return 0
    
    const avgStrength = chain.reduce((sum, event) => sum + event.causal_strength, 0) / chain.length
    return avgStrength
  }

  calculateChainConfidence(chain) {
    if (chain.length === 0) return 0
    
    const avgConfidence = chain.reduce((sum, event) => sum + event.confidence, 0) / chain.length
    return avgConfidence
  }

  assessChainLegalImpact(chain) {
    const avgImpact = chain.reduce((sum, event) => sum + event.legal_significance, 0) / chain.length
    
    // Longer chains with consistent high impact are more significant
    const lengthBonus = Math.min(chain.length * 0.05, 0.2)
    
    return Math.min(avgImpact + lengthBonus, 1.0)
  }

  buildCausalNetwork(events) {
    const network = {
      nodes: [],
      edges: [],
      clusters: []
    }
    
    // Create nodes for causes and effects
    const nodeMap = new Map()
    let nodeId = 0
    
    events.forEach(event => {
      if (!nodeMap.has(event.cause)) {
        nodeMap.set(event.cause, {
          id: `node_${nodeId++}`,
          label: event.cause,
          type: 'cause',
          events: [event]
        })
      } else {
        nodeMap.get(event.cause).events.push(event)
      }
      
      if (!nodeMap.has(event.effect)) {
        nodeMap.set(event.effect, {
          id: `node_${nodeId++}`,
          label: event.effect,
          type: 'effect',
          events: [event]
        })
      } else {
        nodeMap.get(event.effect).events.push(event)
      }
    })
    
    network.nodes = Array.from(nodeMap.values())
    
    // Create edges between causes and effects
    events.forEach(event => {
      const causeNode = nodeMap.get(event.cause)
      const effectNode = nodeMap.get(event.effect)
      
      network.edges.push({
        source: causeNode.id,
        target: effectNode.id,
        strength: event.causal_strength,
        confidence: event.confidence,
        event: event
      })
    })
    
    return network
  }

  analyzeCausalComplexity(events) {
    return {
      total_causal_events: events.length,
      causation_types: this.getCausationTypeDistribution(events),
      avg_causal_strength: this.calculateAverageCausalStrength(events),
      avg_confidence: this.calculateAverageConfidence(events),
      legal_significance_distribution: this.getLegalSignificanceDistribution(events),
      temporal_coverage: this.assessTemporalCoverage(events)
    }
  }

  getCausationTypeDistribution(events) {
    const distribution = {}
    events.forEach(event => {
      const type = event.causation_type
      distribution[type] = (distribution[type] || 0) + 1
    })
    return distribution
  }

  calculateAverageCausalStrength(events) {
    if (events.length === 0) return 0
    return events.reduce((sum, event) => sum + event.causal_strength, 0) / events.length
  }

  calculateAverageConfidence(events) {
    if (events.length === 0) return 0
    return events.reduce((sum, event) => sum + event.confidence, 0) / events.length
  }

  getLegalSignificanceDistribution(events) {
    const high = events.filter(e => e.legal_significance > 0.7).length
    const medium = events.filter(e => e.legal_significance > 0.4 && e.legal_significance <= 0.7).length
    const low = events.filter(e => e.legal_significance <= 0.4).length
    
    return { high, medium, low }
  }

  assessTemporalCoverage(events) {
    const hasTemporalIndicators = events.filter(e => e.temporal_indicators.length > 0).length
    return {
      events_with_temporal_data: hasTemporalIndicators,
      temporal_coverage_ratio: events.length > 0 ? hasTemporalIndicators / events.length : 0
    }
  }

  // Utility methods
  getDetectorStats() {
    return {
      detector_type: 'CausalEventDetector',
      causal_patterns: this.causalPatterns.length,
      event_indicators: this.eventIndicators.length,
      strength_indicators: this.strengthIndicators.length,
      capabilities: [
        'Causal relation detection',
        'Causation strength assessment',
        'Causal chain building',
        'Legal significance analysis',
        'Temporal causation analysis',
        'Causal network construction'
      ]
    }
  }
}

export default CausalEventDetector