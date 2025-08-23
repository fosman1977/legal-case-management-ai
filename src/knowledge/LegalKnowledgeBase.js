/**
 * Legal Knowledge Base - Week 11 Day 3-4
 * Knowledge base functionality for strategic case learning
 */

class LegalKnowledgeBase {
  constructor(qdrant_engine) {
    this.search_engine = qdrant_engine
    this.knowledge_patterns = new Map()
    
    this.knowledge_config = {
      min_confidence_threshold: 0.7,
      pattern_retention_limit: 1000,
      success_weight: 0.8,
      failure_weight: 0.2,
      learning_rate: 0.1
    }
    
    this.pattern_statistics = {
      total_cases: 0,
      successful_cases: 0,
      failed_cases: 0,
      pattern_matches: 0,
      confidence_improvements: 0
    }
    
    this.strategy_effectiveness = new Map()
    this.precedent_database = new Map()
  }

  async addCaseKnowledge(case_analysis, case_outcome, strategic_notes) {
    console.log('📚 Adding case knowledge to knowledge base...')
    
    try {
      // Extract learnable patterns from successful cases
      const knowledge_entry = {
        entry_id: `kb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        
        // Case pattern information
        pattern_signature: this.createKnowledgeSignature(case_analysis),
        case_id: case_analysis.case_id || 'unknown',
        case_complexity: case_analysis.complexity_score || 0.5,
        
        // Strategic information
        strategic_approach: strategic_notes.approach || 'standard',
        key_evidence: strategic_notes.critical_evidence || [],
        success_factors: strategic_notes.success_factors || [],
        risk_factors: strategic_notes.risk_factors || [],
        
        // Outcome information
        outcome: case_outcome,
        outcome_success: this.evaluateOutcomeSuccess(case_outcome),
        outcome_confidence: case_outcome.confidence || 0.8,
        
        // Learning information
        lessons_learned: strategic_notes.lessons_learned || [],
        reusable_strategies: this.extractReusableStrategies(strategic_notes),
        precedent_value: this.calculatePrecedentValue(case_analysis, case_outcome),
        
        // Metadata
        practice_area: case_analysis.practice_area || 'general',
        jurisdiction: case_analysis.jurisdiction || 'unknown',
        judge_preferences: strategic_notes.judge_preferences || null,
        opposing_counsel_tactics: strategic_notes.opposing_tactics || null
      }

      // Store in knowledge base
      await this.storeKnowledgeEntry(knowledge_entry)
      
      // Update pattern learning
      this.updatePatternLearning(knowledge_entry)
      
      // Update strategy effectiveness tracking
      this.updateStrategyEffectiveness(knowledge_entry)
      
      // Update precedent database
      this.updatePrecedentDatabase(knowledge_entry)
      
      // Index in vector database for semantic search
      await this.indexKnowledgeEntry(knowledge_entry)
      
      console.log(`✅ Successfully added case knowledge: ${knowledge_entry.entry_id}`)
      
      return {
        success: true,
        entry_id: knowledge_entry.entry_id,
        patterns_learned: knowledge_entry.reusable_strategies.length,
        precedent_value: knowledge_entry.precedent_value,
        knowledge_statistics: this.getKnowledgeStatistics()
      }
      
    } catch (error) {
      console.error('❌ Failed to add case knowledge:', error)
      throw error
    }
  }

  async queryKnowledgeBase(current_case_analysis) {
    console.log('🔍 Querying knowledge base for strategic guidance...')
    
    try {
      // Find similar case patterns in knowledge base
      const similar_patterns = await this.search_engine.findSimilarCasePatterns(
        current_case_analysis,
        10 // Get more patterns for better guidance
      )
      
      // Filter patterns based on confidence threshold
      const relevant_patterns = similar_patterns.similar_patterns?.filter(
        pattern => pattern.similarity_score >= this.knowledge_config.min_confidence_threshold
      ) || []
      
      // Extract relevant strategic guidance
      const strategic_guidance = relevant_patterns.map(pattern => ({
        pattern_id: pattern.case_id,
        applicability_score: pattern.similarity_score,
        strategic_approach: this.extractStrategicApproach(pattern),
        evidence_priorities: this.extractEvidencePriorities(pattern),
        risk_mitigation: this.extractRiskMitigation(pattern),
        precedent_relevance: this.extractPrecedentRelevance(pattern),
        success_likelihood: this.calculateSuccessLikelihood(pattern),
        tactical_recommendations: this.generateTacticalRecommendations(pattern)
      }))
      
      // Synthesize recommendations from multiple patterns
      const synthesized_recommendations = this.synthesizeRecommendations(strategic_guidance)
      
      // Calculate overall confidence
      const confidence_score = this.calculateGuidanceConfidence(strategic_guidance)
      
      // Extract key insights
      const key_insights = this.extractKeyInsights(strategic_guidance)
      
      console.log(`✅ Found ${relevant_patterns.length} relevant patterns with ${Math.round(confidence_score * 100)}% confidence`)
      
      return {
        similar_cases_found: relevant_patterns.length,
        strategic_guidance: strategic_guidance,
        confidence_score: confidence_score,
        recommended_approaches: synthesized_recommendations,
        key_insights: key_insights,
        risk_assessment: this.assessRisks(strategic_guidance),
        opportunity_analysis: this.analyzeOpportunities(strategic_guidance),
        precedent_chain: this.buildPrecedentChain(relevant_patterns)
      }
      
    } catch (error) {
      console.error('❌ Knowledge base query failed:', error)
      return {
        similar_cases_found: 0,
        strategic_guidance: [],
        confidence_score: 0,
        recommended_approaches: [],
        error: error.message
      }
    }
  }

  async enhanceClaudeConsultation(base_patterns, knowledge_insights) {
    console.log('🤖 Enhancing Claude consultation with knowledge base insights...')
    
    // Combine base patterns with knowledge base insights
    const enhanced_patterns = {
      ...base_patterns,
      
      // Enhanced patterns from knowledge base
      similar_case_patterns: knowledge_insights.similar_cases_found > 0 ? {
        pattern_count: knowledge_insights.similar_cases_found,
        strategic_precedents: knowledge_insights.recommended_approaches,
        success_indicators: this.extractSuccessIndicators(knowledge_insights),
        risk_patterns: this.extractRiskPatterns(knowledge_insights),
        opportunity_patterns: this.extractOpportunityPatterns(knowledge_insights)
      } : null,
      
      // Strategic context enhancement
      strategic_context: {
        knowledge_base_guidance: knowledge_insights.strategic_guidance,
        confidence_enhancement: knowledge_insights.confidence_score,
        precedent_patterns: this.extractPrecedentPatterns(knowledge_insights),
        tactical_recommendations: this.consolidateTacticalRecommendations(knowledge_insights),
        risk_mitigation_strategies: this.consolidateRiskStrategies(knowledge_insights)
      },
      
      // Learning insights
      learning_insights: {
        pattern_frequency: this.analyzePatternFrequency(knowledge_insights),
        success_correlation: this.analyzeSuccessCorrelation(knowledge_insights),
        failure_warnings: this.extractFailureWarnings(knowledge_insights),
        best_practices: this.extractBestPractices(knowledge_insights)
      },
      
      // Enhanced consultation prompts
      consultation_enhancements: {
        suggested_questions: this.generateSuggestedQuestions(knowledge_insights),
        areas_of_concern: this.identifyAreasOfConcern(knowledge_insights),
        strategic_opportunities: this.identifyStrategicOpportunities(knowledge_insights),
        precedent_arguments: this.formulatePrecedentArguments(knowledge_insights)
      }
    }
    
    console.log('✅ Claude consultation enhanced with knowledge base insights')
    
    return enhanced_patterns
  }

  // Knowledge signature creation
  createKnowledgeSignature(case_analysis) {
    return {
      // Core pattern elements
      legal_issues: case_analysis.legal_issues || [],
      complexity_level: this.categorizeComplexity(case_analysis.complexity_score),
      evidence_profile: this.createEvidenceProfile(case_analysis),
      entity_profile: this.createEntityProfile(case_analysis),
      timeline_profile: this.createTimelineProfile(case_analysis),
      
      // Strategic elements
      practice_area: case_analysis.practice_area,
      jurisdiction: case_analysis.jurisdiction,
      case_type: case_analysis.case_type,
      
      // Pattern metadata
      signature_version: '1.0',
      creation_timestamp: new Date().toISOString(),
      confidence_score: case_analysis.confidence_score || 0.8
    }
  }

  // Storage and retrieval methods
  async storeKnowledgeEntry(knowledge_entry) {
    // Store in local pattern map
    this.knowledge_patterns.set(knowledge_entry.entry_id, knowledge_entry)
    
    // Update statistics
    this.pattern_statistics.total_cases++
    if (knowledge_entry.outcome_success) {
      this.pattern_statistics.successful_cases++
    } else {
      this.pattern_statistics.failed_cases++
    }
    
    // Enforce retention limit
    if (this.knowledge_patterns.size > this.knowledge_config.pattern_retention_limit) {
      this.pruneOldestPatterns()
    }
  }

  async indexKnowledgeEntry(knowledge_entry) {
    // Prepare document for vector indexing
    const index_document = {
      id: knowledge_entry.entry_id,
      content: this.formatKnowledgeForIndexing(knowledge_entry),
      type: 'knowledge_entry'
    }
    
    const analysis_results = {
      document_type: 'knowledge_base_entry',
      legal_issues: knowledge_entry.pattern_signature.legal_issues,
      complexity_score: knowledge_entry.case_complexity,
      entities: [],
      evidence_analysis: {
        overall_strength: knowledge_entry.outcome_success ? 'strong' : 'weak'
      }
    }
    
    const case_context = {
      case_id: knowledge_entry.case_id,
      practice_area: knowledge_entry.practice_area,
      jurisdiction: knowledge_entry.jurisdiction
    }
    
    // Index in Qdrant
    await this.search_engine.indexDocument(index_document, analysis_results, case_context)
  }

  // Pattern learning and updating
  updatePatternLearning(knowledge_entry) {
    const pattern_key = this.generatePatternKey(knowledge_entry.pattern_signature)
    
    if (!this.knowledge_patterns.has(pattern_key)) {
      this.knowledge_patterns.set(pattern_key, {
        occurrences: 0,
        success_rate: 0,
        strategies: [],
        lessons: []
      })
    }
    
    const pattern = this.knowledge_patterns.get(pattern_key)
    pattern.occurrences++
    
    // Update success rate with learning rate
    const success_value = knowledge_entry.outcome_success ? 1 : 0
    pattern.success_rate = pattern.success_rate * (1 - this.knowledge_config.learning_rate) +
                          success_value * this.knowledge_config.learning_rate
    
    // Add unique strategies
    knowledge_entry.reusable_strategies.forEach(strategy => {
      if (!pattern.strategies.some(s => s.id === strategy.id)) {
        pattern.strategies.push(strategy)
      }
    })
    
    // Add unique lessons
    knowledge_entry.lessons_learned.forEach(lesson => {
      if (!pattern.lessons.includes(lesson)) {
        pattern.lessons.push(lesson)
      }
    })
    
    this.pattern_statistics.pattern_matches++
  }

  updateStrategyEffectiveness(knowledge_entry) {
    const approach = knowledge_entry.strategic_approach
    
    if (!this.strategy_effectiveness.has(approach)) {
      this.strategy_effectiveness.set(approach, {
        total_uses: 0,
        successful_uses: 0,
        effectiveness_score: 0.5
      })
    }
    
    const strategy_stats = this.strategy_effectiveness.get(approach)
    strategy_stats.total_uses++
    
    if (knowledge_entry.outcome_success) {
      strategy_stats.successful_uses++
    }
    
    strategy_stats.effectiveness_score = strategy_stats.successful_uses / strategy_stats.total_uses
  }

  updatePrecedentDatabase(knowledge_entry) {
    if (knowledge_entry.precedent_value > 0.7) {
      const precedent_key = `${knowledge_entry.practice_area}_${knowledge_entry.jurisdiction}`
      
      if (!this.precedent_database.has(precedent_key)) {
        this.precedent_database.set(precedent_key, [])
      }
      
      this.precedent_database.get(precedent_key).push({
        case_id: knowledge_entry.case_id,
        entry_id: knowledge_entry.entry_id,
        precedent_value: knowledge_entry.precedent_value,
        key_principles: knowledge_entry.lessons_learned,
        applicable_scenarios: knowledge_entry.reusable_strategies
      })
    }
  }

  // Strategy extraction and synthesis
  extractReusableStrategies(strategic_notes) {
    const strategies = []
    
    // Extract approach strategies
    if (strategic_notes.approach) {
      strategies.push({
        id: `strategy_approach_${Date.now()}`,
        type: 'approach',
        description: strategic_notes.approach,
        effectiveness: strategic_notes.approach_effectiveness || 0.7,
        applicable_conditions: strategic_notes.approach_conditions || []
      })
    }
    
    // Extract evidence strategies
    if (strategic_notes.critical_evidence?.length > 0) {
      strategic_notes.critical_evidence.forEach((evidence, index) => {
        strategies.push({
          id: `strategy_evidence_${index}_${Date.now()}`,
          type: 'evidence',
          description: `Prioritize evidence: ${evidence}`,
          effectiveness: 0.8,
          applicable_conditions: ['similar_evidence_available']
        })
      })
    }
    
    // Extract success factor strategies
    if (strategic_notes.success_factors?.length > 0) {
      strategic_notes.success_factors.forEach((factor, index) => {
        strategies.push({
          id: `strategy_success_${index}_${Date.now()}`,
          type: 'success_factor',
          description: factor,
          effectiveness: 0.75,
          applicable_conditions: []
        })
      })
    }
    
    // Extract tactical strategies
    if (strategic_notes.tactical_moves) {
      strategic_notes.tactical_moves.forEach((tactic, index) => {
        strategies.push({
          id: `strategy_tactical_${index}_${Date.now()}`,
          type: 'tactical',
          description: tactic,
          effectiveness: strategic_notes.tactical_effectiveness?.[index] || 0.7,
          applicable_conditions: strategic_notes.tactical_conditions?.[index] || []
        })
      })
    }
    
    return strategies
  }

  synthesizeRecommendations(strategic_guidance) {
    const recommendations = []
    
    // Group guidance by approach type
    const approach_groups = {}
    strategic_guidance.forEach(guidance => {
      const approach = guidance.strategic_approach?.type || 'general'
      if (!approach_groups[approach]) {
        approach_groups[approach] = []
      }
      approach_groups[approach].push(guidance)
    })
    
    // Synthesize recommendations for each approach
    for (const [approach, guidances] of Object.entries(approach_groups)) {
      const avg_applicability = guidances.reduce((sum, g) => sum + g.applicability_score, 0) / guidances.length
      const avg_success = guidances.reduce((sum, g) => sum + (g.success_likelihood || 0.5), 0) / guidances.length
      
      recommendations.push({
        approach_type: approach,
        confidence: avg_applicability,
        expected_success: avg_success,
        evidence_priorities: this.consolidateEvidencePriorities(guidances),
        risk_factors: this.consolidateRiskFactors(guidances),
        tactical_sequence: this.buildTacticalSequence(guidances),
        precedent_support: this.consolidatePrecedents(guidances)
      })
    }
    
    // Sort by confidence and expected success
    recommendations.sort((a, b) => 
      (b.confidence * b.expected_success) - (a.confidence * a.expected_success)
    )
    
    return recommendations.slice(0, 5) // Return top 5 recommendations
  }

  // Confidence and scoring calculations
  calculateGuidanceConfidence(strategic_guidance) {
    if (strategic_guidance.length === 0) return 0
    
    // Calculate weighted confidence based on multiple factors
    let total_confidence = 0
    let total_weight = 0
    
    strategic_guidance.forEach(guidance => {
      const weight = guidance.applicability_score
      const confidence = guidance.applicability_score * (guidance.success_likelihood || 0.5)
      
      total_confidence += confidence * weight
      total_weight += weight
    })
    
    const base_confidence = total_weight > 0 ? total_confidence / total_weight : 0
    
    // Apply adjustments based on pattern count
    const pattern_adjustment = Math.min(strategic_guidance.length / 10, 1.0) * 0.2
    
    return Math.min(base_confidence + pattern_adjustment, 1.0)
  }

  calculatePrecedentValue(case_analysis, case_outcome) {
    let value = 0.5 // Base value
    
    // Adjust based on outcome success
    if (case_outcome.success) value += 0.2
    
    // Adjust based on complexity
    if (case_analysis.complexity_score > 0.7) value += 0.1
    
    // Adjust based on uniqueness
    if (case_analysis.unique_factors?.length > 0) value += 0.1
    
    // Adjust based on clarity of outcome
    if (case_outcome.clarity === 'definitive') value += 0.1
    
    return Math.min(value, 1.0)
  }

  calculateSuccessLikelihood(pattern) {
    // Base likelihood from pattern similarity
    let likelihood = pattern.similarity_score * 0.5
    
    // Adjust based on strategic insights
    if (pattern.strategic_insights?.length > 3) likelihood += 0.1
    
    // Adjust based on evidence alignment
    if (pattern.relevance_factors?.evidence_strength_similar) likelihood += 0.15
    
    // Adjust based on complexity alignment
    if (pattern.relevance_factors?.complexity_similarity) likelihood += 0.15
    
    // Adjust based on jurisdiction match
    if (pattern.relevance_factors?.jurisdiction_match) likelihood += 0.1
    
    return Math.min(likelihood, 0.95)
  }

  // Outcome evaluation
  evaluateOutcomeSuccess(case_outcome) {
    if (typeof case_outcome === 'boolean') return case_outcome
    
    if (case_outcome.success !== undefined) return case_outcome.success
    
    // Evaluate based on outcome type
    if (case_outcome.type === 'settlement' && case_outcome.favorable) return true
    if (case_outcome.type === 'verdict' && case_outcome.verdict === 'favorable') return true
    if (case_outcome.type === 'dismissal' && case_outcome.with_prejudice === false) return true
    
    return false
  }

  // Extraction methods
  extractStrategicApproach(pattern) {
    return {
      type: pattern.strategic_insights?.[0]?.type || 'standard',
      description: pattern.strategic_insights?.[0]?.insight || 'Standard litigation approach',
      confidence: pattern.similarity_score
    }
  }

  extractEvidencePriorities(pattern) {
    const priorities = []
    
    pattern.strategic_insights?.forEach(insight => {
      if (insight.type === 'evidence') {
        priorities.push({
          priority: insight.recommendation,
          importance: 'high'
        })
      }
    })
    
    return priorities
  }

  extractRiskMitigation(pattern) {
    const risks = []
    
    pattern.key_differences?.forEach(diff => {
      risks.push({
        risk_factor: diff.aspect,
        mitigation: `Address difference in ${diff.aspect}`,
        severity: this.assessRiskSeverity(diff)
      })
    })
    
    return risks
  }

  extractPrecedentRelevance(pattern) {
    return {
      relevance_score: pattern.similarity_score,
      applicable_precedents: pattern.pattern_similarities?.legal_issues || 0,
      distinguishing_factors: pattern.key_differences || []
    }
  }

  generateTacticalRecommendations(pattern) {
    const recommendations = []
    
    pattern.strategic_insights?.forEach(insight => {
      recommendations.push({
        tactic: insight.recommendation,
        timing: this.suggestTiming(insight.type),
        priority: this.assessPriority(insight.type)
      })
    })
    
    return recommendations
  }

  // Success and risk analysis
  extractSuccessIndicators(knowledge_insights) {
    const indicators = []
    
    knowledge_insights.strategic_guidance?.forEach(guidance => {
      if (guidance.success_likelihood > 0.7) {
        indicators.push({
          indicator: guidance.strategic_approach.description,
          confidence: guidance.success_likelihood,
          supporting_precedents: guidance.precedent_relevance?.applicable_precedents || 0
        })
      }
    })
    
    return indicators
  }

  extractRiskPatterns(knowledge_insights) {
    const patterns = []
    
    knowledge_insights.strategic_guidance?.forEach(guidance => {
      guidance.risk_mitigation?.forEach(risk => {
        patterns.push({
          pattern: risk.risk_factor,
          frequency: 1, // Would be calculated from historical data
          severity: risk.severity,
          mitigation: risk.mitigation
        })
      })
    })
    
    return patterns
  }

  extractOpportunityPatterns(knowledge_insights) {
    return knowledge_insights.opportunity_analysis || []
  }

  extractPrecedentPatterns(knowledge_insights) {
    return knowledge_insights.precedent_chain || []
  }

  extractFailureWarnings(knowledge_insights) {
    const warnings = []
    
    knowledge_insights.strategic_guidance?.forEach(guidance => {
      if (guidance.success_likelihood < 0.3) {
        warnings.push({
          warning: `Low success likelihood for ${guidance.strategic_approach.type}`,
          likelihood: guidance.success_likelihood,
          recommendation: 'Consider alternative approach'
        })
      }
    })
    
    return warnings
  }

  extractBestPractices(knowledge_insights) {
    const practices = []
    
    knowledge_insights.recommended_approaches?.forEach(approach => {
      if (approach.expected_success > 0.8) {
        practices.push({
          practice: approach.approach_type,
          success_rate: approach.expected_success,
          evidence_priorities: approach.evidence_priorities,
          tactical_sequence: approach.tactical_sequence
        })
      }
    })
    
    return practices
  }

  // Utility methods
  categorizeComplexity(complexity_score) {
    if (complexity_score < 0.3) return 'simple'
    if (complexity_score < 0.6) return 'moderate'
    if (complexity_score < 0.8) return 'complex'
    return 'highly_complex'
  }

  createEvidenceProfile(case_analysis) {
    return {
      total_evidence: case_analysis.evidence_analysis?.evidence_items?.length || 0,
      evidence_strength: case_analysis.evidence_analysis?.overall_strength || 'unknown',
      evidence_types: case_analysis.evidence_analysis?.evidence_types || []
    }
  }

  createEntityProfile(case_analysis) {
    return {
      total_entities: case_analysis.entities?.length || 0,
      entity_types: this.categorizeEntities(case_analysis.entities || []),
      key_relationships: case_analysis.relationship_analysis?.key_relationships || []
    }
  }

  createTimelineProfile(case_analysis) {
    return {
      total_events: case_analysis.timeline_analysis?.timeline_events?.length || 0,
      timeline_complexity: case_analysis.timeline_analysis?.complexity || 'medium',
      critical_periods: case_analysis.timeline_analysis?.critical_periods || []
    }
  }

  categorizeEntities(entities) {
    const categories = {}
    entities.forEach(entity => {
      const type = entity.type || 'unknown'
      categories[type] = (categories[type] || 0) + 1
    })
    return categories
  }

  formatKnowledgeForIndexing(knowledge_entry) {
    const parts = [
      `Case: ${knowledge_entry.case_id}`,
      `Approach: ${knowledge_entry.strategic_approach}`,
      `Outcome: ${knowledge_entry.outcome_success ? 'successful' : 'unsuccessful'}`,
      `Practice Area: ${knowledge_entry.practice_area}`,
      `Jurisdiction: ${knowledge_entry.jurisdiction}`,
      `Lessons: ${knowledge_entry.lessons_learned.join('; ')}`,
      `Strategies: ${knowledge_entry.reusable_strategies.map(s => s.description).join('; ')}`
    ]
    
    return parts.join(' | ')
  }

  generatePatternKey(pattern_signature) {
    return `${pattern_signature.practice_area}_${pattern_signature.jurisdiction}_${pattern_signature.complexity_level}`
  }

  pruneOldestPatterns() {
    // Convert to array and sort by timestamp
    const entries = Array.from(this.knowledge_patterns.entries())
    entries.sort((a, b) => new Date(a[1].timestamp) - new Date(b[1].timestamp))
    
    // Remove oldest 10%
    const removeCount = Math.floor(entries.length * 0.1)
    for (let i = 0; i < removeCount; i++) {
      this.knowledge_patterns.delete(entries[i][0])
    }
  }

  // Analysis utility methods
  extractKeyInsights(strategic_guidance) {
    const insights = []
    
    // Most applicable approach
    if (strategic_guidance.length > 0) {
      const best = strategic_guidance[0]
      insights.push({
        type: 'primary_approach',
        insight: `Recommended approach: ${best.strategic_approach.type}`,
        confidence: best.applicability_score
      })
    }
    
    // Common risk factors
    const all_risks = strategic_guidance.flatMap(g => g.risk_mitigation || [])
    if (all_risks.length > 0) {
      insights.push({
        type: 'risk_summary',
        insight: `${all_risks.length} risk factors identified across similar cases`,
        confidence: 0.8
      })
    }
    
    return insights
  }

  assessRisks(strategic_guidance) {
    const risk_summary = {
      high_risks: [],
      medium_risks: [],
      low_risks: []
    }
    
    strategic_guidance.forEach(guidance => {
      guidance.risk_mitigation?.forEach(risk => {
        if (risk.severity === 'high') {
          risk_summary.high_risks.push(risk)
        } else if (risk.severity === 'medium') {
          risk_summary.medium_risks.push(risk)
        } else {
          risk_summary.low_risks.push(risk)
        }
      })
    })
    
    return risk_summary
  }

  analyzeOpportunities(strategic_guidance) {
    const opportunities = []
    
    strategic_guidance.forEach(guidance => {
      if (guidance.success_likelihood > 0.7) {
        opportunities.push({
          opportunity: guidance.strategic_approach.description,
          likelihood: guidance.success_likelihood,
          tactical_path: guidance.tactical_recommendations
        })
      }
    })
    
    return opportunities
  }

  buildPrecedentChain(relevant_patterns) {
    return relevant_patterns.map(pattern => ({
      case_reference: pattern.case_id,
      relevance: pattern.similarity_score,
      distinguishing_factors: pattern.key_differences,
      applicable_principles: pattern.strategic_insights
    }))
  }

  // Consolidation methods
  consolidateEvidencePriorities(guidances) {
    const priorities = new Map()
    
    guidances.forEach(guidance => {
      guidance.evidence_priorities?.forEach(priority => {
        const key = priority.priority
        if (!priorities.has(key)) {
          priorities.set(key, { count: 0, importance: priority.importance })
        }
        priorities.get(key).count++
      })
    })
    
    return Array.from(priorities.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([priority, data]) => ({ priority, frequency: data.count, importance: data.importance }))
  }

  consolidateRiskFactors(guidances) {
    const risks = new Map()
    
    guidances.forEach(guidance => {
      guidance.risk_mitigation?.forEach(risk => {
        const key = risk.risk_factor
        if (!risks.has(key)) {
          risks.set(key, { count: 0, severities: [] })
        }
        risks.get(key).count++
        risks.get(key).severities.push(risk.severity)
      })
    })
    
    return Array.from(risks.entries()).map(([factor, data]) => ({
      risk_factor: factor,
      frequency: data.count,
      average_severity: this.calculateAverageSeverity(data.severities)
    }))
  }

  buildTacticalSequence(guidances) {
    const tactics = []
    
    guidances.forEach(guidance => {
      guidance.tactical_recommendations?.forEach(tactic => {
        tactics.push(tactic)
      })
    })
    
    // Sort by priority and timing
    tactics.sort((a, b) => {
      if (a.priority !== b.priority) {
        return this.priorityValue(b.priority) - this.priorityValue(a.priority)
      }
      return this.timingValue(a.timing) - this.timingValue(b.timing)
    })
    
    return tactics.slice(0, 10) // Return top 10 tactics
  }

  consolidatePrecedents(guidances) {
    const precedents = []
    
    guidances.forEach(guidance => {
      if (guidance.precedent_relevance?.relevance_score > 0.7) {
        precedents.push({
          case_id: guidance.pattern_id,
          relevance: guidance.precedent_relevance.relevance_score,
          applicable_points: guidance.precedent_relevance.applicable_precedents
        })
      }
    })
    
    return precedents
  }

  consolidateTacticalRecommendations(knowledge_insights) {
    return knowledge_insights.recommended_approaches?.flatMap(
      approach => approach.tactical_sequence || []
    ) || []
  }

  consolidateRiskStrategies(knowledge_insights) {
    return knowledge_insights.risk_assessment || {}
  }

  // Analysis helper methods
  analyzePatternFrequency(knowledge_insights) {
    const frequency = {}
    
    knowledge_insights.strategic_guidance?.forEach(guidance => {
      const approach = guidance.strategic_approach?.type || 'unknown'
      frequency[approach] = (frequency[approach] || 0) + 1
    })
    
    return frequency
  }

  analyzeSuccessCorrelation(knowledge_insights) {
    const correlations = []
    
    knowledge_insights.strategic_guidance?.forEach(guidance => {
      correlations.push({
        approach: guidance.strategic_approach?.type,
        success_likelihood: guidance.success_likelihood,
        applicability: guidance.applicability_score
      })
    })
    
    return correlations
  }

  generateSuggestedQuestions(knowledge_insights) {
    const questions = []
    
    // Questions based on risk factors
    if (knowledge_insights.risk_assessment?.high_risks?.length > 0) {
      questions.push('How should we address the identified high-risk factors?')
    }
    
    // Questions based on opportunities
    if (knowledge_insights.opportunity_analysis?.length > 0) {
      questions.push('What is the best sequence to pursue the identified opportunities?')
    }
    
    // Questions based on precedents
    if (knowledge_insights.precedent_chain?.length > 0) {
      questions.push('How can we distinguish our case from unfavorable precedents?')
    }
    
    return questions
  }

  identifyAreasOfConcern(knowledge_insights) {
    const concerns = []
    
    // Low confidence areas
    if (knowledge_insights.confidence_score < 0.5) {
      concerns.push({
        area: 'overall_strategy',
        concern: 'Low confidence in strategic recommendations',
        severity: 'high'
      })
    }
    
    // High risk areas
    knowledge_insights.risk_assessment?.high_risks?.forEach(risk => {
      concerns.push({
        area: risk.risk_factor,
        concern: risk.mitigation,
        severity: 'high'
      })
    })
    
    return concerns
  }

  identifyStrategicOpportunities(knowledge_insights) {
    return knowledge_insights.opportunity_analysis || []
  }

  formulatePrecedentArguments(knowledge_insights) {
    const arguments = []
    
    knowledge_insights.precedent_chain?.forEach(precedent => {
      arguments.push({
        precedent_case: precedent.case_reference,
        supporting_argument: `This case supports our position with ${Math.round(precedent.relevance * 100)}% relevance`,
        distinguishing_points: precedent.distinguishing_factors
      })
    })
    
    return arguments
  }

  // Severity and priority helpers
  assessRiskSeverity(difference) {
    const severity_map = {
      'evidence_strength': 'high',
      'complexity': 'medium',
      'timeline_complexity': 'low'
    }
    
    return severity_map[difference.aspect] || 'medium'
  }

  suggestTiming(insight_type) {
    const timing_map = {
      'evidence': 'discovery',
      'complexity': 'pre-trial',
      'entities': 'initial',
      'timeline': 'mid-case'
    }
    
    return timing_map[insight_type] || 'flexible'
  }

  assessPriority(insight_type) {
    const priority_map = {
      'evidence': 'high',
      'complexity': 'medium',
      'entities': 'medium',
      'timeline': 'low'
    }
    
    return priority_map[insight_type] || 'medium'
  }

  calculateAverageSeverity(severities) {
    const severity_values = { 'high': 3, 'medium': 2, 'low': 1 }
    const total = severities.reduce((sum, sev) => sum + (severity_values[sev] || 2), 0)
    const avg = total / severities.length
    
    if (avg > 2.5) return 'high'
    if (avg > 1.5) return 'medium'
    return 'low'
  }

  priorityValue(priority) {
    const values = { 'high': 3, 'medium': 2, 'low': 1 }
    return values[priority] || 2
  }

  timingValue(timing) {
    const values = { 'initial': 1, 'discovery': 2, 'mid-case': 3, 'pre-trial': 4, 'flexible': 5 }
    return values[timing] || 3
  }

  // Statistics and monitoring
  getKnowledgeStatistics() {
    return {
      ...this.pattern_statistics,
      total_patterns: this.knowledge_patterns.size,
      total_strategies: this.strategy_effectiveness.size,
      total_precedents: Array.from(this.precedent_database.values()).flat().length,
      success_rate: this.pattern_statistics.successful_cases / 
                   (this.pattern_statistics.total_cases || 1)
    }
  }

  getEngineStatus() {
    return {
      engine_type: 'LegalKnowledgeBase',
      statistics: this.getKnowledgeStatistics(),
      configuration: this.knowledge_config,
      capabilities: [
        'Case knowledge storage',
        'Pattern learning',
        'Strategic guidance',
        'Precedent tracking',
        'Risk assessment',
        'Opportunity analysis',
        'Claude consultation enhancement'
      ]
    }
  }
}

export default LegalKnowledgeBase