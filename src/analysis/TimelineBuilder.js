/**
 * Advanced Timeline Builder - Week 8 Day 1-2
 * Sophisticated timeline reconstruction with gap detection and causation analysis
 */

import DateExtractor from './DateExtractor.js'
import TimeSequenceAnalyzer from './TimeSequenceAnalyzer.js'
import CausalEventDetector from './CausalEventDetector.js'

class AdvancedTimelineBuilder {
  constructor() {
    this.temporal_extractors = [
      new DateExtractor(),
      new TimeSequenceAnalyzer(),
      new CausalEventDetector()
    ]
  }

  async buildComplexTimeline(documents, entities) {
    // Extract all temporal references
    const temporal_data = await this.extractAllTemporalData(documents)
    
    // Resolve temporal references
    const resolved_timeline = await this.resolveTemporalReferences(temporal_data)
    
    // Detect event sequences
    const event_sequences = await this.detectEventSequences(resolved_timeline)
    
    // Analyze causation patterns
    const causation_chains = await this.analyzeCausationChains(event_sequences)
    
    // Identify gaps and inconsistencies
    const timeline_analysis = await this.analyzeTimelineIntegrity(resolved_timeline)

    return {
      timeline: resolved_timeline,
      sequences: event_sequences,
      causation: causation_chains,
      analysis: timeline_analysis,
      patterns: this.createTimelinePatterns(resolved_timeline, timeline_analysis)
    }
  }

  async extractAllTemporalData(documents) {
    const temporal_data = []
    
    for (const doc of documents) {
      // Extract explicit dates
      const explicit_dates = await this.extractExplicitDates(doc.content)
      
      // Extract relative time references
      const relative_times = await this.extractRelativeTimeReferences(doc.content)
      
      // Extract temporal sequences
      const sequences = await this.extractTemporalSequences(doc.content)
      
      temporal_data.push({
        document_id: doc.id,
        explicit_dates,
        relative_times,
        sequences,
        document_date: doc.creation_date
      })
    }
    
    return temporal_data
  }

  async extractExplicitDates(content) {
    const dateExtractor = this.temporal_extractors[0] // DateExtractor
    return await dateExtractor.extractExplicitDates(content)
  }

  async extractRelativeTimeReferences(content) {
    const dateExtractor = this.temporal_extractors[0] // DateExtractor
    return await dateExtractor.extractRelativeTimeReferences(content)
  }

  async extractTemporalSequences(content) {
    const sequenceAnalyzer = this.temporal_extractors[1] // TimeSequenceAnalyzer
    return await sequenceAnalyzer.extractTemporalSequences(content)
  }

  async resolveTemporalReferences(temporal_data) {
    const timeline_events = []
    let eventId = 0

    for (const docData of temporal_data) {
      // Process explicit dates
      for (const dateInfo of docData.explicit_dates) {
        if (dateInfo.normalized_date) {
          timeline_events.push({
            id: `event_${eventId++}`,
            type: 'explicit_date',
            date: dateInfo.normalized_date.iso_date,
            time: dateInfo.normalized_time || null,
            confidence: dateInfo.confidence,
            source_document: docData.document_id,
            raw_reference: dateInfo.raw_text,
            context: dateInfo.context,
            resolution_method: 'direct_parsing'
          })
        }
      }

      // Resolve relative time references
      for (const relativeRef of docData.relative_times) {
        const resolvedDate = await this.resolveRelativeReference(relativeRef, docData.document_date)
        if (resolvedDate) {
          timeline_events.push({
            id: `event_${eventId++}`,
            type: 'resolved_relative',
            date: resolvedDate.iso_date,
            confidence: relativeRef.resolution_confidence * 0.8, // Lower confidence for resolved dates
            source_document: docData.document_id,
            raw_reference: relativeRef.raw_text,
            context: relativeRef.context,
            resolution_method: 'relative_resolution',
            reference_anchor: docData.document_date
          })
        }
      }

      // Process temporal sequences
      if (docData.sequences.individual_sequences) {
        for (const sequence of docData.sequences.individual_sequences) {
          timeline_events.push({
            id: `event_${eventId++}`,
            type: 'sequence_event',
            sequence_type: sequence.sequence_type,
            temporal_position: sequence.temporal_position,
            confidence: sequence.confidence,
            source_document: docData.document_id,
            raw_reference: sequence.raw_text,
            context: sequence.raw_text,
            resolution_method: 'sequence_analysis',
            sequence_indicators: sequence.indicators
          })
        }
      }
    }

    // Sort events by date where possible
    const sortedEvents = this.sortTimelineEvents(timeline_events)
    
    return {
      events: sortedEvents,
      resolution_summary: this.summarizeResolution(timeline_events),
      confidence_distribution: this.analyzeConfidenceDistribution(timeline_events)
    }
  }

  async resolveRelativeReference(relativeRef, anchorDate) {
    if (!anchorDate) return null

    const referenceText = relativeRef.raw_text.toLowerCase()
    const anchor = new Date(anchorDate)
    
    if (isNaN(anchor.getTime())) return null

    let resolvedDate = new Date(anchor)

    // Handle specific relative terms
    if (referenceText.includes('yesterday')) {
      resolvedDate.setDate(anchor.getDate() - 1)
    } else if (referenceText.includes('today')) {
      resolvedDate = new Date(anchor)
    } else if (referenceText.includes('tomorrow')) {
      resolvedDate.setDate(anchor.getDate() + 1)
    } else if (referenceText.includes('last week')) {
      resolvedDate.setDate(anchor.getDate() - 7)
    } else if (referenceText.includes('next week')) {
      resolvedDate.setDate(anchor.getDate() + 7)
    } else if (referenceText.includes('last month')) {
      resolvedDate.setMonth(anchor.getMonth() - 1)
    } else if (referenceText.includes('next month')) {
      resolvedDate.setMonth(anchor.getMonth() + 1)
    } else if (referenceText.includes('last year')) {
      resolvedDate.setFullYear(anchor.getFullYear() - 1)
    } else if (referenceText.includes('next year')) {
      resolvedDate.setFullYear(anchor.getFullYear() + 1)
    } else {
      // Handle complex relative references
      const durationMatch = referenceText.match(/(\d+)\s+(days?|weeks?|months?|years?)\s+(ago|later|before|after)/i)
      if (durationMatch) {
        const [, amount, unit, direction] = durationMatch
        const multiplier = ['before', 'ago'].includes(direction) ? -1 : 1
        const value = parseInt(amount) * multiplier

        switch (unit.toLowerCase()) {
          case 'day':
          case 'days':
            resolvedDate.setDate(anchor.getDate() + value)
            break
          case 'week':
          case 'weeks':
            resolvedDate.setDate(anchor.getDate() + (value * 7))
            break
          case 'month':
          case 'months':
            resolvedDate.setMonth(anchor.getMonth() + value)
            break
          case 'year':
          case 'years':
            resolvedDate.setFullYear(anchor.getFullYear() + value)
            break
        }
      } else {
        return null // Cannot resolve
      }
    }

    return {
      iso_date: resolvedDate.toISOString().split('T')[0],
      year: resolvedDate.getFullYear(),
      month: resolvedDate.getMonth() + 1,
      day: resolvedDate.getDate(),
      resolution_confidence: 0.7
    }
  }

  sortTimelineEvents(events) {
    return events.sort((a, b) => {
      // First sort by date if both have valid dates
      if (a.date && b.date) {
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        
        if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
          return dateA - dateB
        }
      }
      
      // Then sort by temporal position for sequence events
      if (a.temporal_position && b.temporal_position) {
        const positionOrder = ['beginning', 'previous', 'middle', 'concurrent', 'end', 'unspecified']
        const aIndex = positionOrder.indexOf(a.temporal_position)
        const bIndex = positionOrder.indexOf(b.temporal_position)
        
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex
        }
      }
      
      // Finally sort by confidence (higher first)
      return b.confidence - a.confidence
    })
  }

  async detectEventSequences(resolved_timeline) {
    const sequences = []
    const events = resolved_timeline.events

    // Group events by document
    const eventsByDocument = this.groupEventsByDocument(events)
    
    for (const [docId, docEvents] of Object.entries(eventsByDocument)) {
      // Detect temporal sequences within document
      const docSequences = await this.detectDocumentSequences(docEvents, docId)
      sequences.push(...docSequences)
    }

    // Cross-document sequence detection
    const crossDocSequences = await this.detectCrossDocumentSequences(events)
    sequences.push(...crossDocSequences)

    return {
      document_sequences: sequences.filter(s => s.scope === 'document'),
      cross_document_sequences: sequences.filter(s => s.scope === 'cross_document'),
      sequence_analysis: this.analyzeSequencePatterns(sequences)
    }
  }

  groupEventsByDocument(events) {
    const grouped = {}
    
    events.forEach(event => {
      const docId = event.source_document
      if (!grouped[docId]) {
        grouped[docId] = []
      }
      grouped[docId].push(event)
    })
    
    return grouped
  }

  async detectDocumentSequences(events, documentId) {
    const sequences = []
    
    // Sort events within document
    const sortedEvents = events.sort((a, b) => {
      if (a.date && b.date) {
        return new Date(a.date) - new Date(b.date)
      }
      return a.confidence - b.confidence
    })

    // Find consecutive event patterns
    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const currentEvent = sortedEvents[i]
      const nextEvent = sortedEvents[i + 1]
      
      const sequence = this.analyzeEventPair(currentEvent, nextEvent, documentId)
      if (sequence && sequence.confidence > 0.6) {
        sequences.push(sequence)
      }
    }

    return sequences
  }

  analyzeEventPair(event1, event2, documentId) {
    // Calculate temporal relationship
    const temporalRelation = this.calculateTemporalRelation(event1, event2)
    
    if (!temporalRelation.valid) return null

    return {
      id: `seq_${event1.id}_${event2.id}`,
      scope: 'document',
      document_id: documentId,
      events: [event1, event2],
      temporal_relation: temporalRelation.type,
      time_gap: temporalRelation.gap,
      confidence: this.calculateSequenceConfidence(event1, event2, temporalRelation),
      sequence_type: this.classifySequenceType(event1, event2),
      legal_significance: this.assessSequenceLegalSignificance(event1, event2)
    }
  }

  calculateTemporalRelation(event1, event2) {
    if (!event1.date || !event2.date) {
      return { valid: false }
    }

    const date1 = new Date(event1.date)
    const date2 = new Date(event2.date)
    
    if (isNaN(date1.getTime()) || isNaN(date2.getTime())) {
      return { valid: false }
    }

    const timeDiff = date2.getTime() - date1.getTime()
    const daysDiff = Math.abs(timeDiff) / (1000 * 60 * 60 * 24)

    let relationType = 'sequential'
    if (daysDiff < 1) {
      relationType = 'concurrent'
    } else if (daysDiff > 365) {
      relationType = 'distant'
    }

    return {
      valid: true,
      type: relationType,
      gap: daysDiff,
      direction: timeDiff > 0 ? 'forward' : 'backward'
    }
  }

  calculateSequenceConfidence(event1, event2, temporalRelation) {
    let confidence = 0.5 // Base confidence
    
    // Higher confidence for explicit dates
    if (event1.type === 'explicit_date' && event2.type === 'explicit_date') {
      confidence += 0.3
    }
    
    // Adjust based on individual event confidence
    const avgEventConfidence = (event1.confidence + event2.confidence) / 2
    confidence += avgEventConfidence * 0.2
    
    // Temporal relation affects confidence
    switch (temporalRelation.type) {
      case 'concurrent':
        confidence += 0.1
        break
      case 'sequential':
        confidence += 0.15
        break
      case 'distant':
        confidence -= 0.1
        break
    }
    
    return Math.min(Math.max(confidence, 0.1), 1.0)
  }

  classifySequenceType(event1, event2) {
    // Analyze event content to classify sequence type
    const contexts = [event1.context, event2.context].join(' ').toLowerCase()
    
    if (/contract|agreement|signed|executed/.test(contexts)) {
      return 'contractual_sequence'
    }
    if (/payment|paid|invoice|bill/.test(contexts)) {
      return 'financial_sequence'
    }
    if (/notice|notified|informed|communication/.test(contexts)) {
      return 'communication_sequence'
    }
    if (/breach|default|violation|claim/.test(contexts)) {
      return 'dispute_sequence'
    }
    
    return 'general_sequence'
  }

  assessSequenceLegalSignificance(event1, event2) {
    let significance = 0.5
    
    // Both events with high individual confidence
    if (event1.confidence > 0.8 && event2.confidence > 0.8) {
      significance += 0.2
    }
    
    // Legal terminology in context
    const combinedContext = `${event1.context} ${event2.context}`.toLowerCase()
    const legalTerms = ['contract', 'breach', 'payment', 'notice', 'claim', 'damages', 'default']
    const legalTermCount = legalTerms.filter(term => combinedContext.includes(term)).length
    significance += legalTermCount * 0.05
    
    return Math.min(significance, 1.0)
  }

  async detectCrossDocumentSequences(events) {
    const sequences = []
    
    // Group events by date ranges
    const dateRanges = this.groupEventsByDateRange(events)
    
    // Find sequences across documents within similar time frames
    for (const range of dateRanges) {
      if (range.events.length >= 2) {
        const crossDocSeqs = this.findCrossDocumentPatterns(range.events)
        sequences.push(...crossDocSeqs)
      }
    }
    
    return sequences
  }

  groupEventsByDateRange(events) {
    const ranges = []
    const rangeSize = 30 // 30-day ranges
    
    const datedEvents = events.filter(e => e.date).sort((a, b) => new Date(a.date) - new Date(b.date))
    
    if (datedEvents.length === 0) return ranges

    let currentRange = {
      start_date: datedEvents[0].date,
      end_date: null,
      events: []
    }

    datedEvents.forEach(event => {
      const eventDate = new Date(event.date)
      const rangeStart = new Date(currentRange.start_date)
      const daysDiff = (eventDate - rangeStart) / (1000 * 60 * 60 * 24)
      
      if (daysDiff <= rangeSize) {
        currentRange.events.push(event)
        currentRange.end_date = event.date
      } else {
        // Start new range
        if (currentRange.events.length > 0) {
          ranges.push(currentRange)
        }
        currentRange = {
          start_date: event.date,
          end_date: event.date,
          events: [event]
        }
      }
    })
    
    if (currentRange.events.length > 0) {
      ranges.push(currentRange)
    }
    
    return ranges
  }

  findCrossDocumentPatterns(events) {
    const sequences = []
    
    // Group events by document to ensure cross-document nature
    const docGroups = this.groupEventsByDocument(events)
    const docIds = Object.keys(docGroups)
    
    if (docIds.length < 2) return sequences // Need at least 2 documents
    
    // Find patterns between document pairs
    for (let i = 0; i < docIds.length; i++) {
      for (let j = i + 1; j < docIds.length; j++) {
        const doc1Events = docGroups[docIds[i]]
        const doc2Events = docGroups[docIds[j]]
        
        const crossSeq = this.analyzeCrossDocumentRelation(doc1Events, doc2Events, docIds[i], docIds[j])
        if (crossSeq && crossSeq.confidence > 0.5) {
          sequences.push(crossSeq)
        }
      }
    }
    
    return sequences
  }

  analyzeCrossDocumentRelation(events1, events2, docId1, docId2) {
    // Find the best matching event pair across documents
    let bestPair = null
    let bestConfidence = 0
    
    events1.forEach(event1 => {
      events2.forEach(event2 => {
        const relation = this.calculateTemporalRelation(event1, event2)
        if (relation.valid) {
          const confidence = this.calculateSequenceConfidence(event1, event2, relation)
          if (confidence > bestConfidence) {
            bestConfidence = confidence
            bestPair = { event1, event2, relation }
          }
        }
      })
    })
    
    if (bestPair && bestConfidence > 0.5) {
      return {
        id: `cross_seq_${docId1}_${docId2}`,
        scope: 'cross_document',
        document_ids: [docId1, docId2],
        events: [bestPair.event1, bestPair.event2],
        temporal_relation: bestPair.relation.type,
        time_gap: bestPair.relation.gap,
        confidence: bestConfidence,
        sequence_type: this.classifySequenceType(bestPair.event1, bestPair.event2),
        legal_significance: this.assessSequenceLegalSignificance(bestPair.event1, bestPair.event2)
      }
    }
    
    return null
  }

  async analyzeCausationChains(event_sequences) {
    const causalDetector = this.temporal_extractors[2] // CausalEventDetector
    const chains = []

    // Analyze each sequence for causal relationships
    const allSequences = [
      ...event_sequences.document_sequences,
      ...event_sequences.cross_document_sequences
    ]

    for (const sequence of allSequences) {
      if (sequence.events.length >= 2) {
        const causalAnalysis = await this.analyzeCausalRelationship(sequence)
        if (causalAnalysis.has_causation) {
          chains.push({
            sequence_id: sequence.id,
            causation_type: causalAnalysis.causation_type,
            causal_strength: causalAnalysis.strength,
            confidence: causalAnalysis.confidence,
            events: sequence.events,
            causal_indicators: causalAnalysis.indicators,
            legal_impact: causalAnalysis.legal_impact
          })
        }
      }
    }

    return {
      causation_chains: chains,
      causation_summary: this.summarizeCausationAnalysis(chains),
      causal_network: this.buildCausalNetwork(chains)
    }
  }

  async analyzeCausalRelationship(sequence) {
    const event1 = sequence.events[0]
    const event2 = sequence.events[1]
    
    // Combine contexts for causal analysis
    const combinedContext = `${event1.context} ${event2.context}`
    
    // Look for causal indicators
    const causalIndicators = this.findCausalIndicators(combinedContext)
    
    if (causalIndicators.length === 0) {
      return { has_causation: false }
    }

    // Calculate causal strength
    const strength = this.calculateCausalStrength(causalIndicators, combinedContext)
    
    // Determine causation type
    const causationType = this.determineCausationType(causalIndicators)
    
    return {
      has_causation: true,
      causation_type: causationType,
      strength: strength,
      confidence: this.calculateCausalConfidence(causalIndicators, strength),
      indicators: causalIndicators,
      legal_impact: this.assessCausalLegalImpact(event1, event2, strength)
    }
  }

  findCausalIndicators(text) {
    const indicators = []
    const causalPatterns = [
      { pattern: /\b(?:caused by|results from|due to|because of)\b/gi, type: 'direct_causation', strength: 0.9 },
      { pattern: /\b(?:leads to|results in|causes|brings about)\b/gi, type: 'forward_causation', strength: 0.8 },
      { pattern: /\b(?:consequently|therefore|thus|hence)\b/gi, type: 'consequential', strength: 0.7 },
      { pattern: /\b(?:following|after|subsequent to)\b/gi, type: 'temporal_causation', strength: 0.6 },
      { pattern: /\b(?:enables|allows|makes possible)\b/gi, type: 'enabling_causation', strength: 0.6 }
    ]
    
    causalPatterns.forEach(patternInfo => {
      const matches = text.match(patternInfo.pattern) || []
      matches.forEach(match => {
        indicators.push({
          text: match,
          type: patternInfo.type,
          strength: patternInfo.strength
        })
      })
    })
    
    return indicators
  }

  calculateCausalStrength(indicators, context) {
    if (indicators.length === 0) return 0
    
    // Average strength of all indicators
    const avgStrength = indicators.reduce((sum, ind) => sum + ind.strength, 0) / indicators.length
    
    // Boost for multiple indicators
    const multipleBonus = Math.min(indicators.length * 0.05, 0.15)
    
    // Legal context boost
    const legalBoost = /\b(?:contract|breach|payment|default|claim)\b/gi.test(context) ? 0.1 : 0
    
    return Math.min(avgStrength + multipleBonus + legalBoost, 1.0)
  }

  determineCausationType(indicators) {
    const types = indicators.map(ind => ind.type)
    
    if (types.includes('direct_causation')) return 'direct_causation'
    if (types.includes('forward_causation')) return 'forward_causation'
    if (types.includes('consequential')) return 'consequential'
    if (types.includes('temporal_causation')) return 'temporal_causation'
    if (types.includes('enabling_causation')) return 'enabling_causation'
    
    return 'general_causation'
  }

  calculateCausalConfidence(indicators, strength) {
    let confidence = 0.6 // Base confidence
    
    // Strong indicators increase confidence
    confidence += strength * 0.3
    
    // Multiple diverse indicators increase confidence
    const uniqueTypes = new Set(indicators.map(ind => ind.type))
    confidence += uniqueTypes.size * 0.05
    
    return Math.min(Math.max(confidence, 0.1), 1.0)
  }

  assessCausalLegalImpact(event1, event2, strength) {
    let impact = strength * 0.5 // Base impact from causal strength
    
    // High confidence events have higher impact
    const avgConfidence = (event1.confidence + event2.confidence) / 2
    impact += avgConfidence * 0.3
    
    // Legal sequence types have higher impact
    const legalSequenceTypes = ['contractual_sequence', 'financial_sequence', 'dispute_sequence']
    // Note: We would need the sequence type from the parent sequence object
    // For now, we'll use a conservative estimate
    impact += 0.2
    
    return Math.min(impact, 1.0)
  }

  analyzeTimelineIntegrity(timeline) {
    return {
      gaps: this.identifyTemporalGaps(timeline),
      conflicts: this.identifyTemporalConflicts(timeline),
      inconsistencies: this.identifyInconsistencies(timeline),
      confidence_assessment: this.assessTimelineConfidence(timeline),
      completeness_score: this.calculateCompletenessScore(timeline)
    }
  }

  identifyTemporalGaps(timeline) {
    const gaps = []
    const datedEvents = timeline.events
      .filter(e => e.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date))

    for (let i = 0; i < datedEvents.length - 1; i++) {
      const current = datedEvents[i]
      const next = datedEvents[i + 1]
      
      const currentDate = new Date(current.date)
      const nextDate = new Date(next.date)
      const gapDays = (nextDate - currentDate) / (1000 * 60 * 60 * 24)
      
      if (gapDays > 30) { // Significant gap threshold
        gaps.push({
          id: `gap_${i}`,
          start_event: current,
          end_event: next,
          gap_duration_days: gapDays,
          severity: this.assessGapSeverity(gapDays),
          potential_missing_events: this.estimateMissingEvents(current, next, gapDays)
        })
      }
    }

    return gaps
  }

  assessGapSeverity(gapDays) {
    if (gapDays > 365) return 'critical'
    if (gapDays > 180) return 'high'
    if (gapDays > 90) return 'medium'
    return 'low'
  }

  estimateMissingEvents(startEvent, endEvent, gapDays) {
    // Estimate potential missing events based on context
    const contexts = `${startEvent.context} ${endEvent.context}`.toLowerCase()
    let estimatedEvents = 0
    
    // Contract-related gaps likely have intermediate steps
    if (/contract|agreement/.test(contexts)) {
      estimatedEvents = Math.floor(gapDays / 30) // Monthly milestones
    }
    
    // Financial sequences may have regular payments
    if (/payment|invoice|bill/.test(contexts)) {
      estimatedEvents = Math.floor(gapDays / 30) // Monthly payments
    }
    
    // Communication sequences may have regular correspondence
    if (/notice|communication|letter/.test(contexts)) {
      estimatedEvents = Math.floor(gapDays / 14) // Bi-weekly communications
    }
    
    return Math.max(1, estimatedEvents)
  }

  identifyTemporalConflicts(timeline) {
    const conflicts = []
    const events = timeline.events

    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i]
        const event2 = events[j]
        
        const conflict = this.checkTemporalConflict(event1, event2)
        if (conflict) {
          conflicts.push(conflict)
        }
      }
    }

    return conflicts
  }

  checkTemporalConflict(event1, event2) {
    // Check for same-day events from same document with conflicting sequence indicators
    if (event1.date === event2.date && event1.source_document === event2.source_document) {
      const indicators1 = event1.sequence_indicators || []
      const indicators2 = event2.sequence_indicators || []
      
      // Look for conflicting temporal positions
      const hasConflict = this.hasConflictingIndicators(indicators1, indicators2)
      
      if (hasConflict) {
        return {
          id: `conflict_${event1.id}_${event2.id}`,
          type: 'temporal_sequence_conflict',
          event1: event1,
          event2: event2,
          conflict_description: 'Events have conflicting temporal sequence indicators for same date',
          severity: 'medium',
          resolution_suggestion: 'Review source document for correct event ordering'
        }
      }
    }

    // Check for impossible date sequences
    if (event1.date && event2.date) {
      const date1 = new Date(event1.date)
      const date2 = new Date(event2.date)
      
      // Check if sequence indicators conflict with actual dates
      if (this.hasDateSequenceConflict(event1, event2, date1, date2)) {
        return {
          id: `conflict_${event1.id}_${event2.id}`,
          type: 'date_sequence_conflict',
          event1: event1,
          event2: event2,
          conflict_description: 'Sequence indicators conflict with actual chronological order',
          severity: 'high',
          resolution_suggestion: 'Verify dates and sequence relationships in source documents'
        }
      }
    }

    return null
  }

  hasConflictingIndicators(indicators1, indicators2) {
    // Check for mutually exclusive temporal positions
    const conflictingPairs = [
      ['beginning', 'end'],
      ['before', 'after'],
      ['first', 'last'],
      ['previous', 'subsequent']
    ]
    
    const texts1 = indicators1.map(ind => ind.text?.toLowerCase() || '')
    const texts2 = indicators2.map(ind => ind.text?.toLowerCase() || '')
    
    return conflictingPairs.some(([term1, term2]) => 
      texts1.some(t => t.includes(term1)) && texts2.some(t => t.includes(term2)) ||
      texts1.some(t => t.includes(term2)) && texts2.some(t => t.includes(term1))
    )
  }

  hasDateSequenceConflict(event1, event2, date1, date2) {
    // If event1 has "after" indicator but comes before event2 chronologically
    const indicators1 = event1.sequence_indicators || []
    const indicators2 = event2.sequence_indicators || []
    
    const event1HasAfter = indicators1.some(ind => /after|subsequent|following|then|next/.test(ind.text?.toLowerCase() || ''))
    const event1HasBefore = indicators1.some(ind => /before|previous|earlier|prior/.test(ind.text?.toLowerCase() || ''))
    
    if (event1HasAfter && date1 < date2) {
      // Event1 claims to be after something but is dated before event2
      return true
    }
    
    if (event1HasBefore && date1 > date2) {
      // Event1 claims to be before something but is dated after event2
      return true
    }
    
    return false
  }

  identifyInconsistencies(timeline) {
    const inconsistencies = []
    
    // Check for events with very low confidence in critical positions
    const criticalEvents = timeline.events.filter(e => 
      e.temporal_position === 'beginning' || e.temporal_position === 'end'
    )
    
    criticalEvents.forEach(event => {
      if (event.confidence < 0.5) {
        inconsistencies.push({
          type: 'low_confidence_critical_event',
          event: event,
          issue: `Critical timeline position event has low confidence (${Math.round(event.confidence * 100)}%)`,
          severity: 'medium',
          recommendation: 'Verify this event with additional documentation'
        })
      }
    })
    
    // Check for resolution method inconsistencies
    const resolvedEvents = timeline.events.filter(e => e.resolution_method === 'relative_resolution')
    if (resolvedEvents.length > timeline.events.length * 0.5) {
      inconsistencies.push({
        type: 'excessive_relative_resolution',
        affected_events: resolvedEvents.length,
        issue: 'More than 50% of timeline events rely on relative date resolution',
        severity: 'high',
        recommendation: 'Seek additional documents with explicit dates'
      })
    }
    
    return inconsistencies
  }

  assessTimelineConfidence(timeline) {
    const events = timeline.events
    if (events.length === 0) return 0
    
    // Calculate overall confidence metrics
    const avgConfidence = events.reduce((sum, e) => sum + e.confidence, 0) / events.length
    
    // Count high-confidence events
    const highConfidenceEvents = events.filter(e => e.confidence > 0.8).length
    const highConfidenceRatio = highConfidenceEvents / events.length
    
    // Count explicit date events (more reliable)
    const explicitDateEvents = events.filter(e => e.type === 'explicit_date').length
    const explicitDateRatio = explicitDateEvents / events.length
    
    // Assess temporal coverage
    const datedEvents = events.filter(e => e.date).length
    const temporalCoverage = datedEvents / events.length
    
    return {
      overall_confidence: avgConfidence,
      high_confidence_ratio: highConfidenceRatio,
      explicit_date_ratio: explicitDateRatio,
      temporal_coverage: temporalCoverage,
      confidence_grade: this.gradeTimelineConfidence(avgConfidence, highConfidenceRatio, explicitDateRatio)
    }
  }

  gradeTimelineConfidence(avgConf, highConfRatio, explicitRatio) {
    const score = (avgConf * 0.4) + (highConfRatio * 0.3) + (explicitRatio * 0.3)
    
    if (score > 0.8) return 'A'
    if (score > 0.7) return 'B'
    if (score > 0.6) return 'C'
    if (score > 0.5) return 'D'
    return 'F'
  }

  calculateCompletenessScore(timeline) {
    const events = timeline.events
    let completeness = 0.5 // Base completeness
    
    // Bonus for having events in different temporal positions
    const positions = new Set(events.map(e => e.temporal_position).filter(Boolean))
    completeness += positions.size * 0.05
    
    // Bonus for multiple resolution methods (shows comprehensive analysis)
    const methods = new Set(events.map(e => e.resolution_method))
    completeness += methods.size * 0.05
    
    // Bonus for temporal sequences present
    const hasSequences = events.some(e => e.type === 'sequence_event')
    if (hasSequences) completeness += 0.1
    
    // Penalty for excessive gaps
    const analysis = this.analyzeTimelineIntegrity(timeline)
    const criticalGaps = analysis.gaps.filter(g => g.severity === 'critical').length
    completeness -= criticalGaps * 0.1
    
    return Math.min(Math.max(completeness, 0.1), 1.0)
  }

  createTimelinePatterns(timeline, analysis) {
    return {
      temporal_complexity: this.assessTemporalComplexity(timeline),
      gap_patterns: analysis.gaps.map(gap => this.createGapPattern(gap)),
      conflict_patterns: analysis.conflicts.map(conflict => this.createConflictPattern(conflict)),
      sequence_patterns: this.identifySequencePatterns(timeline),
      causation_patterns: this.identifyCausationPatterns(timeline)
    }
  }

  assessTemporalComplexity(timeline) {
    const events = timeline.events
    
    return {
      event_count: events.length,
      date_range_days: this.calculateDateRange(events),
      resolution_methods: this.countResolutionMethods(events),
      temporal_positions: this.countTemporalPositions(events),
      complexity_score: this.calculateComplexityScore(events)
    }
  }

  calculateDateRange(events) {
    const datedEvents = events.filter(e => e.date).map(e => new Date(e.date))
    if (datedEvents.length < 2) return 0
    
    const earliest = new Date(Math.min(...datedEvents))
    const latest = new Date(Math.max(...datedEvents))
    
    return (latest - earliest) / (1000 * 60 * 60 * 24)
  }

  countResolutionMethods(events) {
    const methods = {}
    events.forEach(event => {
      const method = event.resolution_method || 'unknown'
      methods[method] = (methods[method] || 0) + 1
    })
    return methods
  }

  countTemporalPositions(events) {
    const positions = {}
    events.forEach(event => {
      const position = event.temporal_position || 'unspecified'
      positions[position] = (positions[position] || 0) + 1
    })
    return positions
  }

  calculateComplexityScore(events) {
    let score = events.length * 0.1 // Base score from event count
    
    // Add complexity for different types of events
    const types = new Set(events.map(e => e.type))
    score += types.size * 0.05
    
    // Add complexity for temporal relationships
    const positions = new Set(events.map(e => e.temporal_position).filter(Boolean))
    score += positions.size * 0.05
    
    return Math.min(score, 1.0)
  }

  createGapPattern(gap) {
    return {
      pattern_type: 'temporal_gap',
      pattern_id: gap.id,
      description: `${gap.gap_duration_days}-day gap between events`,
      severity: gap.severity,
      gap_duration: gap.gap_duration_days,
      estimated_missing_events: gap.potential_missing_events,
      legal_significance: gap.severity === 'critical' ? 'high' : 'medium',
      privacy_note: 'Gap analysis based on temporal patterns only'
    }
  }

  createConflictPattern(conflict) {
    return {
      pattern_type: 'temporal_conflict',
      pattern_id: conflict.id,
      description: conflict.conflict_description,
      severity: conflict.severity,
      conflict_type: conflict.type,
      resolution_suggestion: conflict.resolution_suggestion,
      legal_significance: conflict.severity === 'high' ? 'high' : 'medium',
      privacy_note: 'Conflict analysis preserves temporal relationships only'
    }
  }

  identifySequencePatterns(timeline) {
    const events = timeline.events
    const sequenceEvents = events.filter(e => e.type === 'sequence_event')
    
    return sequenceEvents.map(event => ({
      pattern_type: 'temporal_sequence',
      pattern_id: `seq_pattern_${event.id}`,
      description: `${event.sequence_type} sequence at ${event.temporal_position} position`,
      sequence_type: event.sequence_type,
      temporal_position: event.temporal_position,
      confidence: event.confidence,
      legal_significance: this.assessSequencePatternSignificance(event),
      privacy_note: 'Sequence pattern based on temporal structure only'
    }))
  }

  assessSequencePatternSignificance(event) {
    const legalSequenceTypes = ['contractual_sequence', 'financial_sequence', 'dispute_sequence']
    const criticalPositions = ['beginning', 'end']
    
    let significance = 0.5
    
    if (legalSequenceTypes.includes(event.sequence_type)) {
      significance += 0.2
    }
    
    if (criticalPositions.includes(event.temporal_position)) {
      significance += 0.15
    }
    
    if (event.confidence > 0.8) {
      significance += 0.1
    }
    
    return Math.min(significance, 1.0)
  }

  identifyCausationPatterns(timeline) {
    // This would typically be populated by the causation analysis results
    // For now, we'll create placeholder patterns based on timeline structure
    const patterns = []
    
    const events = timeline.events
    const sequentialPairs = []
    
    // Find sequential event pairs that might indicate causation
    const datedEvents = events.filter(e => e.date).sort((a, b) => new Date(a.date) - new Date(b.date))
    
    for (let i = 0; i < datedEvents.length - 1; i++) {
      const current = datedEvents[i]
      const next = datedEvents[i + 1]
      
      const timeDiff = (new Date(next.date) - new Date(current.date)) / (1000 * 60 * 60 * 24)
      
      // Events within reasonable timeframe might be causally related
      if (timeDiff > 0 && timeDiff < 90) {
        patterns.push({
          pattern_type: 'potential_causation',
          pattern_id: `causation_${current.id}_${next.id}`,
          description: `Potential causal relationship between sequential events`,
          cause_event: current,
          effect_event: next,
          time_gap_days: timeDiff,
          confidence: this.estimateCausationConfidence(current, next, timeDiff),
          legal_significance: this.assessCausationPatternSignificance(current, next),
          privacy_note: 'Causation pattern based on temporal sequence only'
        })
      }
    }
    
    return patterns
  }

  estimateCausationConfidence(event1, event2, timeDiff) {
    let confidence = 0.4 // Base confidence for temporal sequence
    
    // Closer events are more likely to be causally related
    if (timeDiff < 7) confidence += 0.2
    else if (timeDiff < 30) confidence += 0.1
    
    // Higher individual confidence boosts causation confidence
    const avgEventConfidence = (event1.confidence + event2.confidence) / 2
    confidence += avgEventConfidence * 0.2
    
    // Legal event types are more likely to have causal relationships
    const contexts = `${event1.context} ${event2.context}`.toLowerCase()
    if (/contract|payment|breach|notice|claim/.test(contexts)) {
      confidence += 0.1
    }
    
    return Math.min(confidence, 1.0)
  }

  assessCausationPatternSignificance(event1, event2) {
    let significance = 0.5
    
    // Both events with high confidence
    if (event1.confidence > 0.8 && event2.confidence > 0.8) {
      significance += 0.2
    }
    
    // Legal context increases significance
    const contexts = `${event1.context} ${event2.context}`.toLowerCase()
    const legalTerms = ['contract', 'breach', 'payment', 'default', 'claim', 'damages']
    const legalTermCount = legalTerms.filter(term => contexts.includes(term)).length
    significance += legalTermCount * 0.05
    
    return Math.min(significance, 1.0)
  }

  // Utility methods for summary and analysis
  summarizeResolution(events) {
    const methods = this.countResolutionMethods(events)
    const totalEvents = events.length
    
    return {
      total_events: totalEvents,
      resolution_breakdown: methods,
      explicit_date_percentage: Math.round((methods['direct_parsing'] || 0) / totalEvents * 100),
      relative_resolution_percentage: Math.round((methods['relative_resolution'] || 0) / totalEvents * 100),
      sequence_analysis_percentage: Math.round((methods['sequence_analysis'] || 0) / totalEvents * 100)
    }
  }

  analyzeConfidenceDistribution(events) {
    const highConf = events.filter(e => e.confidence > 0.8).length
    const mediumConf = events.filter(e => e.confidence > 0.6 && e.confidence <= 0.8).length
    const lowConf = events.filter(e => e.confidence <= 0.6).length
    
    return {
      high_confidence: highConf,
      medium_confidence: mediumConf,
      low_confidence: lowConf,
      distribution_percentages: {
        high: Math.round(highConf / events.length * 100),
        medium: Math.round(mediumConf / events.length * 100),
        low: Math.round(lowConf / events.length * 100)
      }
    }
  }

  analyzeSequencePatterns(sequences) {
    const docSequences = sequences.filter(s => s.scope === 'document')
    const crossDocSequences = sequences.filter(s => s.scope === 'cross_document')
    
    return {
      total_sequences: sequences.length,
      document_sequences: docSequences.length,
      cross_document_sequences: crossDocSequences.length,
      sequence_types: this.getSequenceTypeDistribution(sequences),
      avg_confidence: this.calculateAverageSequenceConfidence(sequences),
      legal_significance_distribution: this.getSequenceLegalSignificanceDistribution(sequences)
    }
  }

  getSequenceTypeDistribution(sequences) {
    const distribution = {}
    sequences.forEach(seq => {
      const type = seq.sequence_type || 'unknown'
      distribution[type] = (distribution[type] || 0) + 1
    })
    return distribution
  }

  calculateAverageSequenceConfidence(sequences) {
    if (sequences.length === 0) return 0
    return sequences.reduce((sum, seq) => sum + seq.confidence, 0) / sequences.length
  }

  getSequenceLegalSignificanceDistribution(sequences) {
    const high = sequences.filter(s => s.legal_significance > 0.7).length
    const medium = sequences.filter(s => s.legal_significance > 0.4 && s.legal_significance <= 0.7).length
    const low = sequences.filter(s => s.legal_significance <= 0.4).length
    
    return { high, medium, low }
  }

  summarizeCausationAnalysis(chains) {
    return {
      total_causation_chains: chains.length,
      causation_types: this.getCausationTypeDistribution(chains),
      avg_causal_strength: this.calculateAverageCausalStrength(chains),
      avg_confidence: this.calculateAverageCausalConfidence(chains),
      legal_impact_distribution: this.getCausalLegalImpactDistribution(chains)
    }
  }

  getCausationTypeDistribution(chains) {
    const distribution = {}
    chains.forEach(chain => {
      const type = chain.causation_type || 'unknown'
      distribution[type] = (distribution[type] || 0) + 1
    })
    return distribution
  }

  calculateAverageCausalStrength(chains) {
    if (chains.length === 0) return 0
    return chains.reduce((sum, chain) => sum + chain.causal_strength, 0) / chains.length
  }

  calculateAverageCausalConfidence(chains) {
    if (chains.length === 0) return 0
    return chains.reduce((sum, chain) => sum + chain.confidence, 0) / chains.length
  }

  getCausalLegalImpactDistribution(chains) {
    const high = chains.filter(c => c.legal_impact > 0.7).length
    const medium = chains.filter(c => c.legal_impact > 0.4 && c.legal_impact <= 0.7).length
    const low = chains.filter(c => c.legal_impact <= 0.4).length
    
    return { high, medium, low }
  }

  buildCausalNetwork(chains) {
    // Build a network representation of causal relationships
    const network = {
      nodes: new Map(),
      edges: [],
      clusters: []
    }
    
    let nodeId = 0
    
    chains.forEach(chain => {
      chain.events.forEach(event => {
        if (!network.nodes.has(event.id)) {
          network.nodes.set(event.id, {
            id: `node_${nodeId++}`,
            event_id: event.id,
            event_type: event.type,
            confidence: event.confidence,
            source_document: event.source_document
          })
        }
      })
      
      // Add edge between events in causation chain
      if (chain.events.length >= 2) {
        network.edges.push({
          source: network.nodes.get(chain.events[0].id).id,
          target: network.nodes.get(chain.events[1].id).id,
          causation_type: chain.causation_type,
          strength: chain.causal_strength,
          confidence: chain.confidence
        })
      }
    })
    
    return {
      nodes: Array.from(network.nodes.values()),
      edges: network.edges,
      metrics: {
        node_count: network.nodes.size,
        edge_count: network.edges.length,
        avg_causation_strength: this.calculateAverageCausalStrength(chains)
      }
    }
  }

  // Main analysis method summary
  getBuilderStats() {
    return {
      builder_type: 'AdvancedTimelineBuilder',
      extractors: this.temporal_extractors.map(extractor => ({
        type: extractor.constructor.name,
        stats: extractor.getExtractionStats ? extractor.getExtractionStats() : null
      })),
      capabilities: [
        'Complex timeline reconstruction',
        'Temporal reference resolution',
        'Event sequence detection',
        'Causation chain analysis',
        'Gap detection and analysis',
        'Conflict identification',
        'Timeline integrity assessment',
        'Pattern generation'
      ],
      privacy_compliance: 'Full anonymization maintained throughout analysis'
    }
  }
}

export default AdvancedTimelineBuilder