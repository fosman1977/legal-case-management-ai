/**
 * Enhanced Pattern Generator - Week 10 Day 1-2
 * Advanced pattern generation for Claude consultation
 */

class EnhancedPatternGenerator {
  constructor() {
    this.pattern_types = [
      'case_profile',
      'complexity_indicators',
      'risk_factors', 
      'strategic_opportunities',
      'analytical_insights',
      'evidence_patterns',
      'relationship_patterns',
      'timeline_patterns',
      'contradiction_patterns'
    ]
    
    this.complexity_thresholds = {
      documents: { simple: 5, moderate: 20, complex: 50, highly_complex: 100 },
      entities: { simple: 10, moderate: 50, complex: 150, highly_complex: 300 },
      relationships: { simple: 5, moderate: 25, complex: 75, highly_complex: 150 },
      timeline_events: { simple: 10, moderate: 30, complex: 75, highly_complex: 150 }
    }
  }

  generateCaseProfile(analysis_results) {
    return {
      pattern_type: 'case_profile',
      document_complexity: this.assessDocumentComplexity(analysis_results),
      entity_complexity: this.assessEntityComplexity(analysis_results),
      relationship_complexity: this.assessRelationshipComplexity(analysis_results),
      temporal_complexity: this.assessTemporalComplexity(analysis_results),
      evidence_complexity: this.assessEvidenceComplexity(analysis_results),
      overall_complexity_score: this.calculateOverallComplexity(analysis_results),
      case_characteristics: this.identifyCaseCharacteristics(analysis_results),
      legal_domain_indicators: this.identifyLegalDomain(analysis_results),
      privacy_compliance: 'Full anonymization applied throughout analysis'
    }
  }

  assessDocumentComplexity(analysis_results) {
    const doc_count = analysis_results.semantic?.document_count || 0
    const doc_types = analysis_results.semantic?.document_types || {}
    const type_diversity = Object.keys(doc_types).length
    
    const complexity_level = this.getComplexityLevel(doc_count, this.complexity_thresholds.documents)
    
    return {
      document_count: doc_count,
      document_type_diversity: type_diversity,
      complexity_level: complexity_level,
      dominant_types: Object.entries(doc_types)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([type, count]) => ({ type, count })),
      processing_indicators: {
        avg_processing_time: this.calculateAvgProcessingTime(analysis_results),
        extraction_success_rate: this.calculateExtractionSuccessRate(analysis_results)
      }
    }
  }

  assessEntityComplexity(analysis_results) {
    const entities = analysis_results.relationships?.nodes || []
    const entity_types = {}
    
    entities.forEach(entity => {
      const type = entity.type || 'unknown'
      entity_types[type] = (entity_types[type] || 0) + 1
    })
    
    const complexity_level = this.getComplexityLevel(entities.length, this.complexity_thresholds.entities)
    
    return {
      total_entities: entities.length,
      entity_type_distribution: entity_types,
      complexity_level: complexity_level,
      high_confidence_entities: entities.filter(e => e.confidence > 0.8).length,
      anonymization_applied: true,
      entity_density: this.calculateEntityDensity(analysis_results)
    }
  }

  assessRelationshipComplexity(analysis_results) {
    const relationships = analysis_results.relationships?.edges || []
    const relationship_types = {}
    
    relationships.forEach(rel => {
      const type = rel.type || 'unknown'
      relationship_types[type] = (relationship_types[type] || 0) + 1
    })
    
    const complexity_level = this.getComplexityLevel(relationships.length, this.complexity_thresholds.relationships)
    
    return {
      total_relationships: relationships.length,
      relationship_type_distribution: relationship_types,
      complexity_level: complexity_level,
      strong_relationships: relationships.filter(r => r.strength > 0.7).length,
      network_density: this.calculateNetworkDensity(analysis_results.relationships),
      community_count: analysis_results.relationships?.community_patterns?.length || 0
    }
  }

  assessTemporalComplexity(analysis_results) {
    const timeline = analysis_results.timeline
    const events = timeline?.timeline?.events || []
    const gaps = timeline?.analysis?.gaps || []
    const conflicts = timeline?.analysis?.conflicts || []
    
    const complexity_level = this.getComplexityLevel(events.length, this.complexity_thresholds.timeline_events)
    
    return {
      total_events: events.length,
      complexity_level: complexity_level,
      temporal_gaps: gaps.length,
      temporal_conflicts: conflicts.length,
      timeline_confidence: timeline?.analysis?.confidence_assessment?.overall_confidence || 0,
      date_range_days: this.calculateDateRange(events),
      causation_chains: timeline?.causation?.causation_chains?.length || 0
    }
  }

  assessEvidenceComplexity(analysis_results) {
    const evidence = analysis_results.evidence?.evidence_inventory || {}
    const strengths = analysis_results.evidence?.strength_assessment || []
    const gaps = analysis_results.evidence?.gap_analysis || []
    
    const total_evidence = Object.values(evidence).reduce((sum, category) => 
      sum + (Array.isArray(category) ? category.length : 0), 0
    )
    
    return {
      total_evidence_items: total_evidence,
      evidence_category_distribution: {
        documentary: evidence.documentary?.length || 0,
        testimonial: evidence.testimonial?.length || 0,
        digital: evidence.digital?.length || 0,
        physical: evidence.physical?.length || 0
      },
      average_strength: this.calculateAverageEvidenceStrength(strengths),
      high_strength_evidence: strengths.filter(s => s.strength_profile?.weight > 0.8).length,
      evidence_gaps: gaps.length,
      corroboration_networks: analysis_results.evidence?.corroboration_analysis?.length || 0
    }
  }

  calculateOverallComplexity(analysis_results) {
    const doc_complexity = this.getComplexityScore(this.assessDocumentComplexity(analysis_results).complexity_level)
    const entity_complexity = this.getComplexityScore(this.assessEntityComplexity(analysis_results).complexity_level)
    const relationship_complexity = this.getComplexityScore(this.assessRelationshipComplexity(analysis_results).complexity_level)
    const temporal_complexity = this.getComplexityScore(this.assessTemporalComplexity(analysis_results).complexity_level)
    const evidence_complexity = this.getComplexityScore(this.assessEvidenceComplexity(analysis_results))
    
    const weighted_score = (
      doc_complexity * 0.2 +
      entity_complexity * 0.2 +
      relationship_complexity * 0.2 +
      temporal_complexity * 0.2 +
      evidence_complexity * 0.2
    )
    
    return {
      score: weighted_score,
      grade: this.getComplexityGrade(weighted_score),
      factors: {
        document: doc_complexity,
        entity: entity_complexity,
        relationship: relationship_complexity,
        temporal: temporal_complexity,
        evidence: evidence_complexity
      }
    }
  }

  identifyCaseCharacteristics(analysis_results) {
    const characteristics = []
    
    // Document-based characteristics
    const doc_types = analysis_results.semantic?.document_types || {}
    if (doc_types.contract || doc_types.agreement) {
      characteristics.push('contract_dispute')
    }
    if (doc_types.email || doc_types.correspondence) {
      characteristics.push('communication_heavy')
    }
    if (doc_types.financial || doc_types.invoice) {
      characteristics.push('financial_dispute')
    }
    
    // Timeline characteristics
    const timeline_analysis = analysis_results.timeline?.analysis
    if (timeline_analysis?.gaps?.length > 3) {
      characteristics.push('fragmented_timeline')
    }
    if (timeline_analysis?.conflicts?.length > 2) {
      characteristics.push('disputed_chronology')
    }
    
    // Evidence characteristics
    const evidence = analysis_results.evidence?.evidence_inventory || {}
    const total_evidence = Object.values(evidence).reduce((sum, cat) => sum + (Array.isArray(cat) ? cat.length : 0), 0)
    if (total_evidence > 50) {
      characteristics.push('evidence_rich')
    }
    if (evidence.digital?.length > evidence.documentary?.length) {
      characteristics.push('digital_evidence_dominant')
    }
    
    // Relationship characteristics
    const relationships = analysis_results.relationships
    if (relationships?.community_patterns?.length > 3) {
      characteristics.push('multi_party')
    }
    if (relationships?.influence_patterns?.length > 5) {
      characteristics.push('complex_relationships')
    }
    
    return characteristics
  }

  identifyLegalDomain(analysis_results) {
    const domain_indicators = {
      contract_law: 0,
      employment_law: 0,
      tort_law: 0,
      corporate_law: 0,
      family_law: 0,
      intellectual_property: 0,
      real_estate: 0,
      securities: 0
    }
    
    // Analyze content patterns (anonymized)
    const semantic_analysis = analysis_results.semantic || {}
    
    // Contract law indicators
    if (semantic_analysis.contract_terms || semantic_analysis.agreement_patterns) {
      domain_indicators.contract_law += 2
    }
    
    // Employment law indicators
    if (semantic_analysis.employment_patterns) {
      domain_indicators.employment_law += 2
    }
    
    // Corporate law indicators
    if (semantic_analysis.corporate_patterns) {
      domain_indicators.corporate_law += 2
    }
    
    // Evidence-based domain analysis
    const evidence = analysis_results.evidence?.evidence_inventory || {}
    if (evidence.documentary?.some(doc => doc.subcategory === 'contracts')) {
      domain_indicators.contract_law += 1
    }
    
    // Find dominant domain
    const dominant_domain = Object.entries(domain_indicators)
      .sort(([,a], [,b]) => b - a)[0]
    
    return {
      primary_domain: dominant_domain[0],
      confidence: Math.min(dominant_domain[1] / 5, 1.0),
      domain_scores: domain_indicators,
      multi_domain: Object.values(domain_indicators).filter(score => score > 1).length > 1
    }
  }

  getComplexityLevel(count, thresholds) {
    if (count <= thresholds.simple) return 'simple'
    if (count <= thresholds.moderate) return 'moderate'  
    if (count <= thresholds.complex) return 'complex'
    return 'highly_complex'
  }

  getComplexityScore(level_or_assessment) {
    if (typeof level_or_assessment === 'object') {
      // Handle evidence complexity assessment object
      return 0.5 // Default for complex objects
    }
    
    const scores = {
      simple: 1,
      moderate: 2,
      complex: 3,
      highly_complex: 4
    }
    return scores[level_or_assessment] || 1
  }

  getComplexityGrade(score) {
    if (score >= 3.5) return 'A' // Highly complex
    if (score >= 2.5) return 'B' // Complex
    if (score >= 1.5) return 'C' // Moderate
    return 'D' // Simple
  }

  calculateAvgProcessingTime(analysis_results) {
    // This would come from document processing metrics
    return 0.5 // Placeholder
  }

  calculateExtractionSuccessRate(analysis_results) {
    // This would come from document extraction metrics
    return 0.95 // Placeholder
  }

  calculateEntityDensity(analysis_results) {
    const entities = analysis_results.relationships?.nodes?.length || 0
    const documents = analysis_results.semantic?.document_count || 1
    return entities / documents
  }

  calculateNetworkDensity(relationships_analysis) {
    if (!relationships_analysis || !relationships_analysis.metrics) {
      return 0
    }
    return relationships_analysis.metrics.density || 0
  }

  calculateDateRange(events) {
    const dates = events
      .map(e => e.date)
      .filter(date => date)
      .map(date => new Date(date))
      .filter(date => !isNaN(date.getTime()))
    
    if (dates.length < 2) return 0
    
    const earliest = new Date(Math.min(...dates))
    const latest = new Date(Math.max(...dates))
    
    return (latest - earliest) / (1000 * 60 * 60 * 24) // Days
  }

  calculateAverageEvidenceStrength(strengths) {
    if (!strengths || strengths.length === 0) return 0
    
    const total = strengths.reduce((sum, s) => sum + (s.strength_profile?.weight || 0), 0)
    return total / strengths.length
  }

  // Pattern extraction methods
  extractContradictionPatterns(semantic_analysis) {
    const patterns = []
    
    if (semantic_analysis?.contradictions) {
      semantic_analysis.contradictions.forEach(contradiction => {
        patterns.push({
          pattern_type: 'semantic_contradiction',
          severity: contradiction.contradiction?.severity || 'unknown',
          confidence: contradiction.contradiction?.confidence || 0,
          documents_involved: 2, // Always involves 2 documents
          resolution_strategy: contradiction.contradiction?.resolution_strategy || 'manual_review',
          privacy_note: 'Document content anonymized in analysis'
        })
      })
    }
    
    return patterns
  }

  extractRelationshipPatterns(relationships_analysis) {
    const patterns = []
    
    if (relationships_analysis?.community_patterns) {
      relationships_analysis.community_patterns.forEach(community => {
        patterns.push({
          pattern_type: 'entity_community',
          size: community.entities?.length || 0,
          cohesion: community.cohesion_score || 0,
          dominant_types: community.dominant_entity_types || [],
          legal_significance: community.legal_significance || 'low',
          privacy_note: 'Entity identities anonymized for pattern analysis'
        })
      })
    }
    
    if (relationships_analysis?.influence_patterns) {
      relationships_analysis.influence_patterns.forEach(influence => {
        patterns.push({
          pattern_type: 'influence_hub',
          influence_degree: influence.influence_degree || 0,
          influence_strength: influence.influence_strength || 0,
          connected_entities: influence.connected_entities?.length || 0,
          legal_significance: influence.legal_significance || 'low',
          privacy_note: 'Central entity anonymized for pattern analysis'
        })
      })
    }
    
    return patterns
  }

  extractTimelinePatterns(timeline_analysis) {
    const patterns = []
    
    if (timeline_analysis?.patterns) {
      // Gap patterns
      if (timeline_analysis.patterns.gap_patterns) {
        timeline_analysis.patterns.gap_patterns.forEach(gap => {
          patterns.push({
            pattern_type: 'temporal_gap',
            severity: gap.severity || 'unknown',
            gap_duration: gap.gap_duration || 0,
            estimated_missing_events: gap.estimated_missing_events || 0,
            legal_significance: gap.legal_significance || 'low',
            privacy_note: 'Temporal analysis preserves chronology patterns only'
          })
        })
      }
      
      // Causation patterns
      if (timeline_analysis.patterns.causation_patterns) {
        timeline_analysis.patterns.causation_patterns.forEach(causation => {
          patterns.push({
            pattern_type: 'causation_chain',
            confidence: causation.confidence || 0,
            causal_strength: causation.strength || 0,
            legal_significance: causation.legal_significance || 'low',
            privacy_note: 'Causal analysis based on temporal relationships only'
          })
        })
      }
    }
    
    return patterns
  }

  extractEvidencePatterns(evidence_analysis) {
    const patterns = []
    
    if (evidence_analysis?.patterns) {
      // Strength patterns
      if (evidence_analysis.patterns.strength_patterns) {
        evidence_analysis.patterns.strength_patterns.forEach(strength => {
          patterns.push({
            pattern_type: strength.type || 'evidence_strength',
            factor: strength.factor || 'unknown',
            average_score: strength.average_score || 0,
            description: strength.description || 'Evidence strength pattern',
            privacy_note: 'Evidence analysis based on structural patterns only'
          })
        })
      }
      
      // Weakness patterns  
      if (evidence_analysis.patterns.weakness_patterns) {
        evidence_analysis.patterns.weakness_patterns.forEach(weakness => {
          patterns.push({
            pattern_type: 'evidence_gap',
            severity: weakness.severity || 'unknown',
            gap_type: weakness.type || 'unknown',
            mitigation_strategy: weakness.mitigation_strategy || 'manual_review',
            privacy_note: 'Gap analysis preserves structural information only'
          })
        })
      }
    }
    
    return patterns
  }

  identifyComplexityIndicators(analysis_results) {
    const indicators = []
    
    // Document complexity indicators
    const doc_complexity = this.assessDocumentComplexity(analysis_results)
    if (doc_complexity.complexity_level === 'highly_complex') {
      indicators.push({
        type: 'high_document_volume',
        value: doc_complexity.document_count,
        impact: 'Requires systematic document management approach',
        recommendation: 'Consider document prioritization strategies'
      })
    }
    
    // Entity relationship complexity
    const rel_complexity = this.assessRelationshipComplexity(analysis_results)
    if (rel_complexity.network_density > 0.7) {
      indicators.push({
        type: 'dense_relationship_network',
        value: rel_complexity.network_density,
        impact: 'Complex entity interactions may obscure key relationships',
        recommendation: 'Focus on central entities and strong relationships'
      })
    }
    
    // Timeline complexity
    const temporal_complexity = this.assessTemporalComplexity(analysis_results)
    if (temporal_complexity.temporal_gaps > 5) {
      indicators.push({
        type: 'fragmented_timeline',
        value: temporal_complexity.temporal_gaps,
        impact: 'Timeline gaps may create chronological uncertainties',
        recommendation: 'Seek additional temporal evidence to fill gaps'
      })
    }
    
    // Evidence complexity
    const evidence_complexity = this.assessEvidenceComplexity(analysis_results)
    if (evidence_complexity.evidence_gaps > 3) {
      indicators.push({
        type: 'evidence_deficiencies',
        value: evidence_complexity.evidence_gaps,
        impact: 'Multiple evidence gaps may weaken case foundation',
        recommendation: 'Prioritize evidence acquisition to address critical gaps'
      })
    }
    
    return indicators
  }

  identifyRiskFactors(analysis_results) {
    const risks = []
    
    // Contradiction risks
    const contradictions = analysis_results.semantic?.contradictions || []
    if (contradictions.length > 0) {
      const high_confidence_contradictions = contradictions.filter(c => 
        c.contradiction?.confidence > 0.8
      ).length
      
      if (high_confidence_contradictions > 0) {
        risks.push({
          type: 'semantic_contradictions',
          severity: 'high',
          count: high_confidence_contradictions,
          impact: 'Document contradictions may undermine case consistency',
          mitigation: 'Address contradictions through additional evidence or clarification'
        })
      }
    }
    
    // Evidence strength risks
    const evidence_strengths = analysis_results.evidence?.strength_assessment || []
    const weak_evidence = evidence_strengths.filter(s => s.strength_profile?.weight < 0.5).length
    
    if (weak_evidence > evidence_strengths.length * 0.3) {
      risks.push({
        type: 'weak_evidence_base',
        severity: 'medium',
        percentage: Math.round(weak_evidence / evidence_strengths.length * 100),
        impact: 'Significant portion of evidence may face admissibility challenges',
        mitigation: 'Strengthen evidence authentication and foundation'
      })
    }
    
    // Timeline risks
    const timeline_conflicts = analysis_results.timeline?.analysis?.conflicts || []
    if (timeline_conflicts.length > 2) {
      risks.push({
        type: 'temporal_inconsistencies',
        severity: 'medium',
        count: timeline_conflicts.length,
        impact: 'Timeline conflicts may create credibility issues',
        mitigation: 'Resolve temporal inconsistencies through additional documentation'
      })
    }
    
    // Relationship risks
    const relationships = analysis_results.relationships
    if (relationships?.contradictory_relationships > 0) {
      risks.push({
        type: 'contradictory_relationships',
        severity: 'medium',
        count: relationships.contradictory_relationships,
        impact: 'Conflicting entity relationships may complicate narrative',
        mitigation: 'Investigate and resolve relationship contradictions'
      })
    }
    
    return risks
  }

  identifyStrategicOpportunities(analysis_results) {
    const opportunities = []
    
    // Strong evidence opportunities
    const evidence_strengths = analysis_results.evidence?.strength_assessment || []
    const strong_evidence = evidence_strengths.filter(s => s.strength_profile?.weight > 0.8).length
    
    if (strong_evidence > 5) {
      opportunities.push({
        type: 'strong_evidence_base',
        value: strong_evidence,
        potential: 'High-quality evidence provides solid foundation for case',
        strategy: 'Highlight strongest evidence in case presentation'
      })
    }
    
    // Corroboration opportunities
    const corroboration = analysis_results.evidence?.corroboration_analysis || []
    const strong_corroboration = corroboration.filter(c => c.corroboration_strength > 0.8).length
    
    if (strong_corroboration > 0) {
      opportunities.push({
        type: 'strong_corroboration',
        value: strong_corroboration,
        potential: 'Well-corroborated facts provide persuasive evidence',
        strategy: 'Emphasize corroborated facts in legal arguments'
      })
    }
    
    // Timeline opportunities
    const timeline = analysis_results.timeline
    if (timeline?.analysis?.confidence_assessment?.overall_confidence > 0.8) {
      opportunities.push({
        type: 'reliable_chronology',
        value: timeline.analysis.confidence_assessment.overall_confidence,
        potential: 'Strong timeline provides clear sequence of events',
        strategy: 'Use chronology as organizing principle for case narrative'
      })
    }
    
    // Relationship opportunities
    const relationships = analysis_results.relationships
    if (relationships?.influence_patterns?.length > 0) {
      const key_influences = relationships.influence_patterns.filter(p => 
        p.legal_significance === 'high'
      ).length
      
      if (key_influences > 0) {
        opportunities.push({
          type: 'key_influence_entities',
          value: key_influences,
          potential: 'Central entities may provide leverage points for case strategy',
          strategy: 'Focus discovery and arguments around influential entities'
        })
      }
    }
    
    return opportunities
  }

  // Utility methods
  getGeneratorStats() {
    return {
      generator_type: 'EnhancedPatternGenerator',
      pattern_types_supported: this.pattern_types.length,
      complexity_categories: Object.keys(this.complexity_thresholds),
      capabilities: [
        'Comprehensive case profiling',
        'Multi-dimensional complexity assessment',
        'Risk factor identification',
        'Strategic opportunity analysis',
        'Legal domain classification',
        'Privacy-compliant pattern generation',
        'Cross-analysis integration',
        'Consultation-ready output formatting'
      ],
      privacy_compliance: 'All patterns generated with full anonymization'
    }
  }
}

export default EnhancedPatternGenerator