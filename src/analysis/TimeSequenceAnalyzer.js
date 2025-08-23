/**
 * Time Sequence Analysis - Week 8 Day 1-2
 * Advanced temporal sequence detection and analysis
 */

class TimeSequenceAnalyzer {
  constructor() {
    this.sequencePatterns = [
      // Explicit sequence indicators
      /\b(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|then|next|after|before|subsequently|previously|finally|lastly)\b/gi,
      
      // Numbered sequences
      /\b(?:\d+\.|step\s+\d+|phase\s+\d+|\d+\)|\(\d+\))\b/gi,
      
      // Temporal connectors
      /\b(?:when|while|during|as|since|until|by|from|to|between|meanwhile|simultaneously|concurrently)\b/gi,
      
      // Causal indicators
      /\b(?:because|due to|as a result|consequently|therefore|thus|hence|leading to|resulting in|caused by)\b/gi,
      
      // Process indicators
      /\b(?:began|started|initiated|commenced|completed|finished|ended|concluded|continued|proceeded)\b/gi
    ]
    
    this.temporalConnectors = [
      'then', 'next', 'after', 'before', 'subsequently', 'previously',
      'meanwhile', 'simultaneously', 'during', 'while', 'when', 'as'
    ]
    
    this.causalIndicators = [
      'because', 'due to', 'as a result', 'consequently', 'therefore',
      'thus', 'hence', 'leading to', 'resulting in', 'caused by'
    ]
  }

  async extractTemporalSequences(content) {
    const sequences = []
    let sequenceId = 0

    // Find explicit sequence markers
    const sequenceMarkers = this.findSequenceMarkers(content)
    
    // Analyze sentence-level sequences
    const sentences = this.splitIntoSentences(content)
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i]
      
      // Check for sequence indicators in current sentence
      const indicators = this.identifySequenceIndicators(sentence)
      
      if (indicators.length > 0) {
        const sequence = {
          id: `sequence_${sequenceId++}`,
          sentence_index: i,
          raw_text: sentence.trim(),
          sequence_type: this.classifySequenceType(indicators),
          indicators: indicators,
          temporal_position: this.determineTemporalPosition(indicators),
          confidence: this.calculateSequenceConfidence(sentence, indicators),
          related_sentences: this.findRelatedSentences(sentences, i, indicators)
        }
        
        sequences.push(sequence)
      }
    }

    // Group related sequences
    const groupedSequences = this.groupRelatedSequences(sequences)
    
    return {
      individual_sequences: sequences,
      grouped_sequences: groupedSequences,
      sequence_chains: this.buildSequenceChains(groupedSequences)
    }
  }

  findSequenceMarkers(content) {
    const markers = []
    let markerId = 0

    this.sequencePatterns.forEach((pattern, patternIndex) => {
      const matches = content.match(pattern) || []
      matches.forEach(match => {
        markers.push({
          id: `marker_${markerId++}`,
          text: match,
          type: this.getMarkerType(patternIndex),
          position: content.indexOf(match),
          context: this.extractMarkerContext(content, match)
        })
      })
    })

    return markers.sort((a, b) => a.position - b.position)
  }

  getMarkerType(patternIndex) {
    const types = [
      'sequence_indicator',
      'numbered_sequence',
      'temporal_connector',
      'causal_indicator',
      'process_indicator'
    ]
    return types[patternIndex] || 'unknown'
  }

  splitIntoSentences(content) {
    // Enhanced sentence splitting that handles legal document structure
    return content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10)
  }

  identifySequenceIndicators(sentence) {
    const indicators = []
    const lowerSentence = sentence.toLowerCase()

    // Find temporal connectors
    this.temporalConnectors.forEach(connector => {
      if (lowerSentence.includes(connector.toLowerCase())) {
        indicators.push({
          type: 'temporal_connector',
          text: connector,
          confidence: 0.8
        })
      }
    })

    // Find causal indicators
    this.causalIndicators.forEach(indicator => {
      if (lowerSentence.includes(indicator.toLowerCase())) {
        indicators.push({
          type: 'causal_indicator',
          text: indicator,
          confidence: 0.85
        })
      }
    })

    // Find numbered sequences
    const numberedMatch = sentence.match(/\b(?:\d+\.|step\s+\d+|phase\s+\d+|\d+\)|\(\d+\))\b/gi)
    if (numberedMatch) {
      numberedMatch.forEach(match => {
        indicators.push({
          type: 'numbered_sequence',
          text: match,
          confidence: 0.9
        })
      })
    }

    // Find ordinal sequences
    const ordinalMatch = sentence.match(/\b(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)\b/gi)
    if (ordinalMatch) {
      ordinalMatch.forEach(match => {
        indicators.push({
          type: 'ordinal_sequence',
          text: match,
          confidence: 0.85
        })
      })
    }

    return indicators
  }

  classifySequenceType(indicators) {
    const types = indicators.map(i => i.type)
    
    if (types.includes('numbered_sequence') || types.includes('ordinal_sequence')) {
      return 'explicit_sequence'
    }
    if (types.includes('causal_indicator')) {
      return 'causal_sequence'
    }
    if (types.includes('temporal_connector')) {
      return 'temporal_sequence'
    }
    
    return 'general_sequence'
  }

  determineTemporalPosition(indicators) {
    // Analyze indicators to determine relative temporal position
    const temporalWords = indicators
      .filter(i => i.type === 'temporal_connector')
      .map(i => i.text.toLowerCase())

    if (temporalWords.some(w => ['first', 'initially', 'began', 'started'].includes(w))) {
      return 'beginning'
    }
    if (temporalWords.some(w => ['then', 'next', 'subsequently', 'after'].includes(w))) {
      return 'middle'
    }
    if (temporalWords.some(w => ['finally', 'lastly', 'ended', 'concluded'].includes(w))) {
      return 'end'
    }
    if (temporalWords.some(w => ['before', 'previously', 'earlier'].includes(w))) {
      return 'previous'
    }
    if (temporalWords.some(w => ['meanwhile', 'simultaneously', 'during'].includes(w))) {
      return 'concurrent'
    }
    
    return 'unspecified'
  }

  calculateSequenceConfidence(sentence, indicators) {
    let confidence = 0.5 // Base confidence
    
    // Multiple indicators increase confidence
    confidence += Math.min(indicators.length * 0.1, 0.3)
    
    // Strong indicators boost confidence
    const strongIndicators = indicators.filter(i => i.confidence > 0.8)
    confidence += strongIndicators.length * 0.05
    
    // Numbered sequences are highly reliable
    if (indicators.some(i => i.type === 'numbered_sequence')) {
      confidence += 0.2
    }
    
    // Causal indicators add reliability in legal contexts
    if (indicators.some(i => i.type === 'causal_indicator')) {
      confidence += 0.15
    }
    
    return Math.min(Math.max(confidence, 0.1), 1.0)
  }

  findRelatedSentences(sentences, currentIndex, indicators) {
    const related = []
    const searchRadius = 3 // Look 3 sentences before and after
    
    const start = Math.max(0, currentIndex - searchRadius)
    const end = Math.min(sentences.length, currentIndex + searchRadius + 1)
    
    for (let i = start; i < end; i++) {
      if (i !== currentIndex) {
        const relatedIndicators = this.identifySequenceIndicators(sentences[i])
        if (relatedIndicators.length > 0) {
          const similarity = this.calculateIndicatorSimilarity(indicators, relatedIndicators)
          if (similarity > 0.3) {
            related.push({
              sentence_index: i,
              sentence: sentences[i],
              similarity: similarity,
              indicators: relatedIndicators
            })
          }
        }
      }
    }
    
    return related
  }

  calculateIndicatorSimilarity(indicators1, indicators2) {
    const types1 = new Set(indicators1.map(i => i.type))
    const types2 = new Set(indicators2.map(i => i.type))
    
    const intersection = new Set([...types1].filter(x => types2.has(x)))
    const union = new Set([...types1, ...types2])
    
    return union.size > 0 ? intersection.size / union.size : 0
  }

  groupRelatedSequences(sequences) {
    const groups = []
    const processed = new Set()
    
    sequences.forEach((sequence, index) => {
      if (processed.has(index)) return
      
      const group = {
        id: `group_${groups.length}`,
        primary_sequence: sequence,
        related_sequences: [],
        sequence_type: sequence.sequence_type,
        confidence: sequence.confidence
      }
      
      // Find related sequences
      sequences.forEach((otherSequence, otherIndex) => {
        if (otherIndex !== index && !processed.has(otherIndex)) {
          if (this.areSequencesRelated(sequence, otherSequence)) {
            group.related_sequences.push(otherSequence)
            processed.add(otherIndex)
          }
        }
      })
      
      processed.add(index)
      groups.push(group)
    })
    
    return groups
  }

  areSequencesRelated(seq1, seq2) {
    // Check if sequences are from adjacent sentences
    const sentenceDiff = Math.abs(seq1.sentence_index - seq2.sentence_index)
    if (sentenceDiff <= 2) return true
    
    // Check if they have similar sequence types
    if (seq1.sequence_type === seq2.sequence_type) return true
    
    // Check for overlapping indicators
    const types1 = new Set(seq1.indicators.map(i => i.type))
    const types2 = new Set(seq2.indicators.map(i => i.type))
    const intersection = new Set([...types1].filter(x => types2.has(x)))
    
    return intersection.size > 0
  }

  buildSequenceChains(groupedSequences) {
    const chains = []
    
    // Sort groups by temporal position and sentence index
    const sortedGroups = groupedSequences.sort((a, b) => {
      const positionOrder = ['beginning', 'middle', 'end', 'previous', 'concurrent', 'unspecified']
      const aPos = positionOrder.indexOf(a.primary_sequence.temporal_position)
      const bPos = positionOrder.indexOf(b.primary_sequence.temporal_position)
      
      if (aPos !== bPos) return aPos - bPos
      return a.primary_sequence.sentence_index - b.primary_sequence.sentence_index
    })
    
    // Build chains from consecutive groups
    let currentChain = null
    
    sortedGroups.forEach(group => {
      if (!currentChain || !this.canExtendChain(currentChain, group)) {
        // Start new chain
        currentChain = {
          id: `chain_${chains.length}`,
          groups: [group],
          chain_type: group.sequence_type,
          start_position: group.primary_sequence.sentence_index,
          confidence: group.confidence
        }
        chains.push(currentChain)
      } else {
        // Extend current chain
        currentChain.groups.push(group)
        currentChain.confidence = (currentChain.confidence + group.confidence) / 2
      }
    })
    
    return chains
  }

  canExtendChain(chain, group) {
    const lastGroup = chain.groups[chain.groups.length - 1]
    
    // Check sentence proximity
    const sentenceDiff = group.primary_sequence.sentence_index - lastGroup.primary_sequence.sentence_index
    if (sentenceDiff > 5) return false // Too far apart
    
    // Check sequence type compatibility
    const compatibleTypes = {
      'explicit_sequence': ['explicit_sequence', 'temporal_sequence'],
      'causal_sequence': ['causal_sequence', 'temporal_sequence'],
      'temporal_sequence': ['explicit_sequence', 'causal_sequence', 'temporal_sequence'],
      'general_sequence': ['general_sequence', 'temporal_sequence']
    }
    
    const chainType = chain.chain_type
    return compatibleTypes[chainType]?.includes(group.sequence_type) || false
  }

  extractMarkerContext(content, marker) {
    const position = content.indexOf(marker)
    if (position === -1) return ''
    
    const contextStart = Math.max(0, position - 30)
    const contextEnd = Math.min(content.length, position + marker.length + 30)
    
    return content.substring(contextStart, contextEnd).trim()
  }

  // Analysis methods
  analyzeSequenceComplexity(sequences) {
    return {
      total_sequences: sequences.individual_sequences.length,
      sequence_types: this.getSequenceTypeDistribution(sequences.individual_sequences),
      chain_count: sequences.sequence_chains.length,
      max_chain_length: Math.max(...sequences.sequence_chains.map(c => c.groups.length), 0),
      avg_confidence: this.calculateAverageConfidence(sequences.individual_sequences),
      temporal_coverage: this.assessTemporalCoverage(sequences.individual_sequences)
    }
  }

  getSequenceTypeDistribution(sequences) {
    const distribution = {}
    sequences.forEach(seq => {
      const type = seq.sequence_type
      distribution[type] = (distribution[type] || 0) + 1
    })
    return distribution
  }

  calculateAverageConfidence(sequences) {
    if (sequences.length === 0) return 0
    const totalConfidence = sequences.reduce((sum, seq) => sum + seq.confidence, 0)
    return totalConfidence / sequences.length
  }

  assessTemporalCoverage(sequences) {
    const positions = new Set(sequences.map(seq => seq.temporal_position))
    const allPositions = ['beginning', 'middle', 'end', 'previous', 'concurrent']
    return {
      covered_positions: Array.from(positions),
      coverage_ratio: positions.size / allPositions.length,
      missing_positions: allPositions.filter(pos => !positions.has(pos))
    }
  }

  // Utility methods
  getAnalyzerStats() {
    return {
      analyzer_type: 'TimeSequenceAnalyzer',
      supported_patterns: this.sequencePatterns.length,
      temporal_connectors: this.temporalConnectors.length,
      causal_indicators: this.causalIndicators.length,
      capabilities: [
        'Explicit sequence detection',
        'Temporal connector analysis',
        'Causal relationship identification',
        'Sequence chain building',
        'Related sequence grouping',
        'Temporal position determination'
      ]
    }
  }
}

export default TimeSequenceAnalyzer