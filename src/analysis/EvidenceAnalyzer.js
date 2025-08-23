/**
 * Evidence Classification System - Week 9 Day 1-2
 * Comprehensive evidence analysis, categorization, and strength assessment
 */

class EvidenceAnalyzer {
  constructor() {
    this.evidence_types = {
      documentary: ['contracts', 'correspondence', 'records', 'reports'],
      testimonial: ['witness_statements', 'expert_reports', 'depositions'],
      physical: ['photographs', 'objects', 'samples'],
      digital: ['emails', 'metadata', 'logs', 'databases']
    }
    
    this.strength_factors = {
      authenticity: ['source_verification', 'chain_of_custody', 'digital_signatures', 'provenance'],
      relevance: ['direct_relationship', 'probative_value', 'legal_significance', 'case_centrality'],
      reliability: ['source_credibility', 'consistency', 'corroboration', 'bias_assessment'],
      admissibility: ['hearsay_exceptions', 'foundation_requirements', 'privilege_issues', 'relevance_balancing']
    }
    
    this.evidence_patterns = {
      documentary_indicators: [
        /\b(?:contract|agreement|letter|memo|report|invoice|receipt|statement|record)\b/gi,
        /\b(?:signed|executed|dated|witnessed|notarized|certified)\b/gi,
        /\b(?:attachment|exhibit|appendix|schedule|addendum)\b/gi
      ],
      testimonial_indicators: [
        /\b(?:testified|stated|declared|swore|affirmed|witnessed|observed)\b/gi,
        /\b(?:deposition|affidavit|declaration|statement|testimony)\b/gi,
        /\b(?:expert|witness|declarant|affiant|deponent)\b/gi
      ],
      digital_indicators: [
        /\b(?:email|metadata|timestamp|log|database|backup|hash|digital)\b/gi,
        /\b(?:server|system|network|IP|MAC|URL|filename|filepath)\b/gi,
        /\b(?:created|modified|accessed|deleted|downloaded|uploaded)\b/gi
      ]
    }
  }

  async analyzeEvidence(documents, entities, timeline) {
    const evidence_items = await this.identifyEvidenceItems(documents)
    const categorized = await this.categorizeEvidence(evidence_items)
    const strengths = await this.assessEvidenceStrength(categorized)
    const corroboration = await this.analyzeCorroboration(categorized, timeline)
    const gaps = await this.identifyEvidenceGaps(categorized, entities)

    return {
      evidence_inventory: categorized,
      strength_assessment: strengths,
      corroboration_analysis: corroboration,
      gap_analysis: gaps,
      patterns: this.createEvidencePatterns(categorized, strengths, gaps)
    }
  }

  async identifyEvidenceItems(documents) {
    const evidence_items = []
    let evidenceId = 0

    for (const doc of documents) {
      const items = await this.extractEvidenceFromDocument(doc)
      items.forEach(item => {
        evidence_items.push({
          id: `evidence_${evidenceId++}`,
          source_document: doc.id,
          document_type: doc.type,
          content: item.content,
          context: item.context,
          page_reference: item.page_reference,
          extraction_confidence: item.confidence,
          metadata: {
            creation_date: doc.creation_date,
            author: doc.author,
            source_type: doc.source_type,
            file_format: doc.file_format
          }
        })
      })
    }

    return evidence_items
  }

  async extractEvidenceFromDocument(document) {
    const content = document.content || document.text || ''
    const evidence_items = []
    
    // Extract sentences that appear to be evidentiary
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20)
    
    sentences.forEach((sentence, index) => {
      const evidenceScore = this.calculateEvidenceScore(sentence)
      
      if (evidenceScore > 0.6) {
        evidence_items.push({
          content: sentence.trim(),
          context: this.extractSentenceContext(sentences, index),
          page_reference: this.estimatePageReference(index, sentences.length),
          confidence: evidenceScore,
          indicators: this.identifyEvidenceIndicators(sentence)
        })
      }
    })

    return evidence_items
  }

  calculateEvidenceScore(sentence) {
    let score = 0.5 // Base score
    
    // Look for factual assertions
    const factualPatterns = [
      /\b(?:on|at|during|between|from|to)\s+\d+/gi, // Date references
      /\b(?:\$|USD|£|EUR|dollars?|pounds?|euros?)\s*[\d,]+/gi, // Financial amounts
      /\b(?:signed|executed|delivered|received|sent|paid|transferred)\b/gi, // Action verbs
      /\b(?:agreement|contract|payment|delivery|notice|demand|breach|default)\b/gi // Legal concepts
    ]
    
    factualPatterns.forEach(pattern => {
      if (pattern.test(sentence)) {
        score += 0.1
      }
    })
    
    // Specific evidence indicators
    if (/\b(?:exhibit|attachment|document|record|evidence)\b/gi.test(sentence)) {
      score += 0.15
    }
    
    // Temporal specificity increases evidence value
    if (/\b(?:\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}\s+\w+\s+\d{2,4})\b/gi.test(sentence)) {
      score += 0.1
    }
    
    // Person/entity references
    if (/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g.test(sentence)) {
      score += 0.05
    }
    
    return Math.min(score, 1.0)
  }

  identifyEvidenceIndicators(sentence) {
    const indicators = []
    
    // Check against each pattern type
    Object.entries(this.evidence_patterns).forEach(([type, patterns]) => {
      patterns.forEach(pattern => {
        const matches = sentence.match(pattern) || []
        matches.forEach(match => {
          indicators.push({
            type: type.replace('_indicators', ''),
            text: match,
            confidence: 0.8
          })
        })
      })
    })
    
    return indicators
  }

  extractSentenceContext(sentences, targetIndex) {
    const contextRadius = 2
    const start = Math.max(0, targetIndex - contextRadius)
    const end = Math.min(sentences.length, targetIndex + contextRadius + 1)
    
    return sentences.slice(start, end).join('. ').trim()
  }

  estimatePageReference(sentenceIndex, totalSentences) {
    // Rough estimation assuming ~20 sentences per page
    const estimatedPage = Math.floor(sentenceIndex / 20) + 1
    return `Page ~${estimatedPage}`
  }

  async categorizeEvidence(evidence_items) {
    const categorized = {
      documentary: [],
      testimonial: [],
      physical: [],
      digital: [],
      uncategorized: []
    }

    evidence_items.forEach(item => {
      const category = this.determineEvidenceCategory(item)
      
      const categorizedItem = {
        ...item,
        category: category,
        subcategory: this.determineSubcategory(item, category),
        legal_classification: this.determineLegalClassification(item),
        priority_score: this.calculatePriorityScore(item, category)
      }
      
      if (categorized[category]) {
        categorized[category].push(categorizedItem)
      } else {
        categorized.uncategorized.push(categorizedItem)
      }
    })

    // Sort each category by priority score
    Object.keys(categorized).forEach(category => {
      categorized[category].sort((a, b) => b.priority_score - a.priority_score)
    })

    return categorized
  }

  determineEvidenceCategory(item) {
    const content = item.content.toLowerCase()
    const context = item.context.toLowerCase()
    const combinedText = `${content} ${context}`
    
    // Analyze indicators from extraction
    const indicatorTypes = item.indicators.map(ind => ind.type)
    const typeCount = {}
    indicatorTypes.forEach(type => {
      typeCount[type] = (typeCount[type] || 0) + 1
    })
    
    // Find most common indicator type
    const dominantType = Object.keys(typeCount).reduce((a, b) => 
      typeCount[a] > typeCount[b] ? a : b, 'documentary'
    )
    
    if (dominantType && ['documentary', 'testimonial', 'digital'].includes(dominantType)) {
      return dominantType
    }
    
    // Fallback to text analysis
    const digitalScore = this.calculateCategoryScore(combinedText, this.evidence_types.digital)
    const testimonialScore = this.calculateCategoryScore(combinedText, this.evidence_types.testimonial)
    const documentaryScore = this.calculateCategoryScore(combinedText, this.evidence_types.documentary)
    const physicalScore = this.calculateCategoryScore(combinedText, this.evidence_types.physical)
    
    const scores = {
      digital: digitalScore,
      testimonial: testimonialScore,
      documentary: documentaryScore,
      physical: physicalScore
    }
    
    const maxCategory = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b)
    
    // Require minimum score threshold
    return scores[maxCategory] > 0.3 ? maxCategory : 'documentary'
  }

  calculateCategoryScore(text, categoryTerms) {
    let score = 0
    const words = text.toLowerCase().split(/\s+/)
    const wordSet = new Set(words)
    
    categoryTerms.forEach(term => {
      const termWords = term.split('_')
      if (termWords.every(word => wordSet.has(word))) {
        score += 1.0 / categoryTerms.length
      } else if (termWords.some(word => wordSet.has(word))) {
        score += 0.5 / categoryTerms.length
      }
    })
    
    return score
  }

  determineSubcategory(item, category) {
    const content = item.content.toLowerCase()
    
    switch (category) {
      case 'documentary':
        if (/contract|agreement/.test(content)) return 'contracts'
        if (/letter|email|correspondence/.test(content)) return 'correspondence'
        if (/record|log|entry/.test(content)) return 'records'
        if (/report|analysis|assessment/.test(content)) return 'reports'
        return 'general_documentary'
        
      case 'testimonial':
        if (/witness|observed|saw/.test(content)) return 'witness_statements'
        if (/expert|opinion|analysis/.test(content)) return 'expert_reports'
        if (/deposition|sworn|under oath/.test(content)) return 'depositions'
        return 'general_testimonial'
        
      case 'digital':
        if (/email|message|correspondence/.test(content)) return 'emails'
        if (/metadata|properties|timestamp/.test(content)) return 'metadata'
        if (/log|entry|record/.test(content)) return 'logs'
        if (/database|table|query/.test(content)) return 'databases'
        return 'general_digital'
        
      case 'physical':
        if (/photograph|photo|image/.test(content)) return 'photographs'
        if (/object|item|device/.test(content)) return 'objects'
        if (/sample|specimen|test/.test(content)) return 'samples'
        return 'general_physical'
        
      default:
        return 'unclassified'
    }
  }

  determineLegalClassification(item) {
    const content = item.content.toLowerCase()
    
    if (/hearsay|statement.*made.*out.*of.*court/.test(content)) {
      return 'hearsay'
    }
    if (/opinion|expert|specialized knowledge/.test(content)) {
      return 'opinion_evidence'
    }
    if (/character|reputation|propensity/.test(content)) {
      return 'character_evidence'
    }
    if (/habit|routine|regular practice/.test(content)) {
      return 'habit_evidence'
    }
    if (/subsequent.*remedial|repair|fix|improvement/.test(content)) {
      return 'subsequent_remedial_measures'
    }
    
    return 'direct_evidence'
  }

  calculatePriorityScore(item, category) {
    let score = 0.5 // Base priority
    
    // Higher extraction confidence increases priority
    score += item.extraction_confidence * 0.3
    
    // Category-based priority adjustments
    const categoryWeights = {
      documentary: 0.8,
      digital: 0.7,
      testimonial: 0.6,
      physical: 0.5
    }
    score += (categoryWeights[category] || 0.4) * 0.2
    
    // Legal significance
    const legalTerms = ['contract', 'breach', 'payment', 'default', 'notice', 'damages', 'liability']
    const legalTermCount = legalTerms.filter(term => item.content.toLowerCase().includes(term)).length
    score += legalTermCount * 0.05
    
    // Temporal specificity
    if (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(item.content)) {
      score += 0.1
    }
    
    // Financial amounts
    if (/\$[\d,]+/.test(item.content)) {
      score += 0.1
    }
    
    return Math.min(score, 1.0)
  }

  async assessEvidenceStrength(evidence_items) {
    const assessments = []
    
    // Flatten categorized evidence for assessment
    const allItems = []
    Object.values(evidence_items).forEach(category => {
      if (Array.isArray(category)) {
        allItems.push(...category)
      }
    })
    
    for (const item of allItems) {
      const strength = {
        authenticity: this.assessAuthenticity(item),
        relevance: this.assessRelevance(item),
        reliability: this.assessReliability(item),
        admissibility: this.assessAdmissibility(item),
        weight: this.calculateOverallWeight(item)
      }
      
      assessments.push({
        evidence_id: item.id,
        strength_profile: strength,
        recommendations: this.generateRecommendations(strength),
        risk_factors: this.identifyRiskFactors(item, strength)
      })
    }
    
    return assessments
  }

  assessAuthenticity(item) {
    let authenticity = 0.7 // Base authenticity score
    
    // Document metadata presence
    if (item.metadata && item.metadata.creation_date) {
      authenticity += 0.1
    }
    
    // Source verification indicators
    const content = item.content.toLowerCase()
    if (/signed|notarized|witnessed|certified/.test(content)) {
      authenticity += 0.15
    }
    
    // Digital signatures or hash references
    if (/signature|hash|checksum|digital.*sign/.test(content)) {
      authenticity += 0.1
    }
    
    // Chain of custody indicators
    if (/received|delivered|transmitted|forwarded/.test(content)) {
      authenticity += 0.05
    }
    
    // File format reliability (for digital evidence)
    if (item.metadata && item.metadata.file_format) {
      const reliableFormats = ['pdf', 'tiff', 'signed', 'encrypted']
      if (reliableFormats.some(format => item.metadata.file_format.toLowerCase().includes(format))) {
        authenticity += 0.05
      }
    }
    
    return Math.min(authenticity, 1.0)
  }

  assessRelevance(item) {
    let relevance = 0.6 // Base relevance
    
    // Legal significance terms
    const legalTerms = ['contract', 'agreement', 'breach', 'payment', 'default', 'notice', 'damages', 'liability', 'obligation', 'performance']
    const legalTermCount = legalTerms.filter(term => item.content.toLowerCase().includes(term)).length
    relevance += Math.min(legalTermCount * 0.05, 0.2)
    
    // Factual specificity
    if (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(item.content)) {
      relevance += 0.1 // Specific dates
    }
    
    if (/\$[\d,]+/.test(item.content)) {
      relevance += 0.1 // Financial amounts
    }
    
    // Party references
    if (/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/.test(item.content)) {
      relevance += 0.05 // Person names
    }
    
    // Causal language
    if (/because|due to|as a result|caused by|led to/.test(item.content.toLowerCase())) {
      relevance += 0.08
    }
    
    // Priority score already calculated
    relevance += item.priority_score * 0.1
    
    return Math.min(relevance, 1.0)
  }

  assessReliability(item) {
    let reliability = 0.65 // Base reliability
    
    // Source credibility
    if (item.metadata && item.metadata.author) {
      reliability += 0.05
    }
    
    // Document type reliability
    const reliableTypes = ['contract', 'official_record', 'financial_statement', 'legal_document']
    if (reliableTypes.includes(item.document_type)) {
      reliability += 0.1
    }
    
    // Contemporary creation (not created after the fact)
    if (item.metadata && item.metadata.creation_date) {
      // This would require comparison with event dates in a real implementation
      reliability += 0.05
    }
    
    // Consistency indicators
    const consistentLanguage = /consistently|regularly|always|standard practice/.test(item.content.toLowerCase())
    if (consistentLanguage) {
      reliability += 0.05
    }
    
    // Objective vs. subjective content
    const objectiveIndicators = /amount|date|time|location|number|quantity/.test(item.content.toLowerCase())
    const subjectiveIndicators = /believe|think|feel|opinion|seems|appears/.test(item.content.toLowerCase())
    
    if (objectiveIndicators && !subjectiveIndicators) {
      reliability += 0.1
    } else if (subjectiveIndicators) {
      reliability -= 0.05
    }
    
    // Extraction confidence
    reliability += item.extraction_confidence * 0.1
    
    return Math.min(Math.max(reliability, 0.1), 1.0)
  }

  assessAdmissibility(item) {
    let admissibility = 0.8 // Base admissibility (presumed admissible)
    
    const content = item.content.toLowerCase()
    
    // Hearsay concerns
    if (this.isLikelyHearsay(item)) {
      admissibility -= 0.3
      
      // Check for hearsay exceptions
      if (this.hasHearsayException(item)) {
        admissibility += 0.2
      }
    }
    
    // Relevance threshold
    const relevance = this.assessRelevance(item)
    if (relevance < 0.4) {
      admissibility -= 0.2
    }
    
    // Privilege concerns
    if (/attorney.*client|legal.*advice|privileged|confidential.*legal/.test(content)) {
      admissibility -= 0.4
    }
    
    // Best evidence rule
    if (item.category === 'documentary' && /copy|duplicate|reproduction/.test(content)) {
      admissibility -= 0.1
    }
    
    // Character evidence restrictions
    if (/character|reputation|propensity/.test(content)) {
      admissibility -= 0.2
    }
    
    // Subsequent remedial measures
    if (/repair|fix|improvement.*after/.test(content)) {
      admissibility -= 0.3
    }
    
    return Math.min(Math.max(admissibility, 0.1), 1.0)
  }

  isLikelyHearsay(item) {
    const content = item.content.toLowerCase()
    
    // Indicators of out-of-court statements
    const hearsayIndicators = [
      /told me|said that|stated that|informed that/,
      /according to|reported that|claimed that/,
      /heard that|was told that|learned that/,
      /he said|she said|they said/
    ]
    
    return hearsayIndicators.some(pattern => pattern.test(content))
  }

  hasHearsayException(item) {
    const content = item.content.toLowerCase()
    
    // Common hearsay exceptions
    const exceptions = [
      /business.*record|kept.*in.*course.*of.*business/,
      /public.*record|official.*record/,
      /excited.*utterance|startled.*exclamation/,
      /present.*sense.*impression/,
      /dying.*declaration/,
      /statement.*against.*interest/,
      /former.*testimony/,
      /admission.*by.*party/
    ]
    
    return exceptions.some(pattern => pattern.test(content))
  }

  calculateOverallWeight(item) {
    // Get individual strength components
    const authenticity = this.assessAuthenticity(item)
    const relevance = this.assessRelevance(item)
    const reliability = this.assessReliability(item)
    const admissibility = this.assessAdmissibility(item)
    
    // Weighted combination
    const weight = (
      authenticity * 0.25 +
      relevance * 0.30 +
      reliability * 0.25 +
      admissibility * 0.20
    )
    
    return weight
  }

  generateRecommendations(strength) {
    const recommendations = []
    
    if (strength.authenticity < 0.7) {
      recommendations.push({
        category: 'authenticity',
        recommendation: 'Verify source and establish chain of custody',
        priority: 'high'
      })
    }
    
    if (strength.relevance < 0.6) {
      recommendations.push({
        category: 'relevance',
        recommendation: 'Clarify connection to legal issues in the case',
        priority: 'medium'
      })
    }
    
    if (strength.reliability < 0.6) {
      recommendations.push({
        category: 'reliability',
        recommendation: 'Seek corroborating evidence or verify source credibility',
        priority: 'medium'
      })
    }
    
    if (strength.admissibility < 0.6) {
      recommendations.push({
        category: 'admissibility',
        recommendation: 'Address potential admissibility challenges before trial',
        priority: 'high'
      })
    }
    
    if (strength.weight > 0.8) {
      recommendations.push({
        category: 'strategic',
        recommendation: 'Consider featuring this evidence prominently in case presentation',
        priority: 'low'
      })
    }
    
    return recommendations
  }

  identifyRiskFactors(item, strength) {
    const risks = []
    
    // Authentication risks
    if (strength.authenticity < 0.6) {
      risks.push({
        type: 'authentication',
        severity: 'high',
        description: 'May face challenges proving authenticity',
        mitigation: 'Obtain authenticating witness or additional documentation'
      })
    }
    
    // Hearsay risks
    if (this.isLikelyHearsay(item) && !this.hasHearsayException(item)) {
      risks.push({
        type: 'hearsay',
        severity: 'high',
        description: 'Likely hearsay without clear exception',
        mitigation: 'Identify applicable hearsay exception or find alternative evidence'
      })
    }
    
    // Relevance risks
    if (strength.relevance < 0.5) {
      risks.push({
        type: 'relevance',
        severity: 'medium',
        description: 'Connection to case issues may be questioned',
        mitigation: 'Develop clearer foundation showing relevance'
      })
    }
    
    // Digital evidence risks
    if (item.category === 'digital' && strength.authenticity < 0.8) {
      risks.push({
        type: 'digital_integrity',
        severity: 'medium',
        description: 'Digital evidence may face integrity challenges',
        mitigation: 'Establish hash values and chain of custody for digital items'
      })
    }
    
    // Best evidence rule risks
    if (item.category === 'documentary' && /copy|duplicate/.test(item.content.toLowerCase())) {
      risks.push({
        type: 'best_evidence',
        severity: 'medium',
        description: 'May need to explain absence of original',
        mitigation: 'Prepare foundation for admission of copy under best evidence rule'
      })
    }
    
    return risks
  }

  async analyzeCorroboration(evidence_items, timeline) {
    const corroboration_networks = []
    
    // Find evidence that supports the same facts
    const fact_groups = this.groupEvidenceByFacts(evidence_items)
    
    for (const [fact, supporting_evidence] of fact_groups) {
      if (supporting_evidence.length > 1) {
        const network = {
          fact: fact,
          supporting_evidence: supporting_evidence,
          corroboration_strength: this.calculateCorroborationStrength(supporting_evidence),
          independence_score: this.assessIndependence(supporting_evidence),
          temporal_consistency: this.checkTemporalConsistency(supporting_evidence, timeline)
        }
        
        corroboration_networks.push(network)
      }
    }
    
    return corroboration_networks
  }

  groupEvidenceByFacts(evidence_items) {
    const factGroups = new Map()
    
    // Flatten categorized evidence
    const allItems = []
    Object.values(evidence_items).forEach(category => {
      if (Array.isArray(category)) {
        allItems.push(...category)
      }
    })
    
    // Extract key facts from each piece of evidence
    allItems.forEach(item => {
      const facts = this.extractKeyFacts(item)
      
      facts.forEach(fact => {
        if (!factGroups.has(fact)) {
          factGroups.set(fact, [])
        }
        factGroups.get(fact).push(item)
      })
    })
    
    return factGroups
  }

  extractKeyFacts(item) {
    const content = item.content.toLowerCase()
    const facts = []
    
    // Extract financial facts
    const amounts = content.match(/\$[\d,]+(?:\.\d{2})?/g) || []
    amounts.forEach(amount => {
      facts.push(`financial_amount_${amount.replace(/[^0-9.]/g, '')}`)
    })
    
    // Extract date facts
    const dates = content.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/g) || []
    dates.forEach(date => {
      facts.push(`date_${date}`)
    })
    
    // Extract person facts
    const persons = content.match(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g) || []
    persons.forEach(person => {
      facts.push(`person_${person.toLowerCase().replace(/\s+/g, '_')}`)
    })
    
    // Extract action facts
    const actions = ['signed', 'paid', 'delivered', 'received', 'breached', 'defaulted', 'terminated']
    actions.forEach(action => {
      if (content.includes(action)) {
        facts.push(`action_${action}`)
      }
    })
    
    // Extract entity/organization facts
    const entities = content.match(/\b[A-Z][a-zA-Z\s]+(?:Inc|LLC|Corp|Ltd|Company)\b/g) || []
    entities.forEach(entity => {
      facts.push(`entity_${entity.toLowerCase().replace(/[^a-z0-9]/g, '_')}`)
    })
    
    return facts
  }

  calculateCorroborationStrength(supporting_evidence) {
    if (supporting_evidence.length < 2) return 0
    
    let strength = 0.5 // Base strength for having multiple pieces
    
    // More evidence pieces increase strength
    strength += Math.min(supporting_evidence.length * 0.1, 0.3)
    
    // Different evidence types increase strength
    const categories = new Set(supporting_evidence.map(item => item.category))
    strength += categories.size * 0.05
    
    // Different sources increase strength
    const sources = new Set(supporting_evidence.map(item => item.source_document))
    strength += sources.size * 0.05
    
    // Average quality of supporting evidence
    const avgWeight = supporting_evidence.reduce((sum, item) => {
      return sum + this.calculateOverallWeight(item)
    }, 0) / supporting_evidence.length
    
    strength += avgWeight * 0.2
    
    return Math.min(strength, 1.0)
  }

  assessIndependence(supporting_evidence) {
    let independence = 1.0 // Perfect independence initially
    
    // Check for same source documents
    const sources = supporting_evidence.map(item => item.source_document)
    const uniqueSources = new Set(sources)
    const sourceIndependence = uniqueSources.size / sources.length
    independence *= sourceIndependence
    
    // Check for same authors
    const authors = supporting_evidence
      .map(item => item.metadata?.author)
      .filter(author => author)
    
    if (authors.length > 0) {
      const uniqueAuthors = new Set(authors)
      const authorIndependence = uniqueAuthors.size / authors.length
      independence *= authorIndependence
    }
    
    // Check for temporal independence (not all created at same time)
    const dates = supporting_evidence
      .map(item => item.metadata?.creation_date)
      .filter(date => date)
    
    if (dates.length > 1) {
      const uniqueDates = new Set(dates)
      const temporalIndependence = uniqueDates.size / dates.length
      independence *= temporalIndependence
    }
    
    return independence
  }

  checkTemporalConsistency(supporting_evidence, timeline) {
    if (!timeline || !timeline.events) {
      return { consistent: true, confidence: 0.5 }
    }
    
    const evidenceDates = []
    
    // Extract dates from evidence content
    supporting_evidence.forEach(item => {
      const dates = item.content.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/g) || []
      dates.forEach(date => {
        try {
          const parsedDate = new Date(date)
          if (!isNaN(parsedDate.getTime())) {
            evidenceDates.push({
              date: parsedDate,
              evidence_id: item.id
            })
          }
        } catch (e) {
          // Ignore invalid dates
        }
      })
    })
    
    if (evidenceDates.length === 0) {
      return { consistent: true, confidence: 0.3 }
    }
    
    // Check consistency with timeline events
    let consistentCount = 0
    let totalChecks = 0
    
    evidenceDates.forEach(evidenceDate => {
      const matchingEvents = timeline.events.filter(event => {
        if (!event.date) return false
        const eventDate = new Date(event.date)
        const timeDiff = Math.abs(eventDate.getTime() - evidenceDate.date.getTime())
        const daysDiff = timeDiff / (1000 * 60 * 60 * 24)
        return daysDiff <= 7 // Within a week
      })
      
      totalChecks++
      if (matchingEvents.length > 0) {
        consistentCount++
      }
    })
    
    const consistency = totalChecks > 0 ? consistentCount / totalChecks : 1.0
    
    return {
      consistent: consistency > 0.7,
      confidence: consistency,
      temporal_matches: consistentCount,
      total_date_references: totalChecks
    }
  }

  async identifyEvidenceGaps(categorized, entities) {
    const gaps = []
    
    // Analyze category balance
    const categoryGaps = this.identifyCategoryGaps(categorized)
    gaps.push(...categoryGaps)
    
    // Analyze factual gaps
    const factualGaps = this.identifyFactualGaps(categorized, entities)
    gaps.push(...factualGaps)
    
    // Analyze temporal gaps
    const temporalGaps = this.identifyTemporalGaps(categorized)
    gaps.push(...temporalGaps)
    
    // Analyze corroboration gaps
    const corroborationGaps = this.identifyCorroborationGaps(categorized)
    gaps.push(...corroborationGaps)
    
    return gaps.sort((a, b) => this.getGapSeverityScore(b.severity) - this.getGapSeverityScore(a.severity))
  }

  identifyCategoryGaps(categorized) {
    const gaps = []
    const categories = ['documentary', 'testimonial', 'digital', 'physical']
    
    categories.forEach(category => {
      const items = categorized[category] || []
      
      if (items.length === 0) {
        gaps.push({
          gap_type: 'category_absence',
          category: category,
          severity: 'medium',
          description: `No ${category} evidence identified`,
          suggested_mitigation: `Seek to obtain ${category} evidence to strengthen case`,
          impact: 'May limit persuasiveness of case presentation'
        })
      } else if (items.length < 3) {
        gaps.push({
          gap_type: 'category_weakness',
          category: category,
          severity: 'low',
          description: `Limited ${category} evidence (${items.length} items)`,
          suggested_mitigation: `Consider seeking additional ${category} evidence`,
          impact: 'May benefit from additional corroboration'
        })
      }
    })
    
    return gaps
  }

  identifyFactualGaps(categorized, entities) {
    const gaps = []
    
    // Flatten evidence items
    const allItems = []
    Object.values(categorized).forEach(category => {
      if (Array.isArray(category)) {
        allItems.push(...category)
      }
    })
    
    // Expected factual elements in legal cases
    const expectedFacts = [
      { fact: 'contract_formation', pattern: /contract|agreement|signed|executed/ },
      { fact: 'payment_terms', pattern: /payment|pay|amount|sum|\$/ },
      { fact: 'performance', pattern: /perform|deliver|complete|fulfill/ },
      { fact: 'breach_notice', pattern: /breach|default|notice|notify/ },
      { fact: 'damages', pattern: /damage|loss|harm|injury/ }
    ]
    
    expectedFacts.forEach(expected => {
      const supportingEvidence = allItems.filter(item => 
        expected.pattern.test(item.content.toLowerCase())
      )
      
      if (supportingEvidence.length === 0) {
        gaps.push({
          gap_type: 'factual_gap',
          fact_type: expected.fact,
          severity: 'high',
          description: `No evidence found for ${expected.fact.replace('_', ' ')}`,
          suggested_mitigation: `Seek evidence establishing ${expected.fact.replace('_', ' ')}`,
          impact: 'May be essential element of legal claim'
        })
      } else if (supportingEvidence.length === 1) {
        gaps.push({
          gap_type: 'insufficient_corroboration',
          fact_type: expected.fact,
          severity: 'medium',
          description: `Only one piece of evidence for ${expected.fact.replace('_', ' ')}`,
          suggested_mitigation: `Seek additional corroborating evidence`,
          impact: 'Single point of failure if evidence is challenged'
        })
      }
    })
    
    return gaps
  }

  identifyTemporalGaps(categorized) {
    const gaps = []
    
    // Flatten evidence items
    const allItems = []
    Object.values(categorized).forEach(category => {
      if (Array.isArray(category)) {
        allItems.push(...category)
      }
    })
    
    // Extract dates from evidence
    const evidenceDates = []
    allItems.forEach(item => {
      const dates = item.content.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/g) || []
      dates.forEach(dateStr => {
        try {
          const date = new Date(dateStr)
          if (!isNaN(date.getTime())) {
            evidenceDates.push({
              date: date,
              evidence_id: item.id,
              content: item.content.substring(0, 100)
            })
          }
        } catch (e) {
          // Ignore invalid dates
        }
      })
    })
    
    if (evidenceDates.length < 2) {
      gaps.push({
        gap_type: 'temporal_absence',
        severity: 'high',
        description: 'Insufficient temporal evidence to establish sequence of events',
        suggested_mitigation: 'Seek evidence with specific dates and times',
        impact: 'May be unable to establish chronology of events'
      })
      return gaps
    }
    
    // Sort dates and check for large gaps
    evidenceDates.sort((a, b) => a.date.getTime() - b.date.getTime())
    
    for (let i = 0; i < evidenceDates.length - 1; i++) {
      const current = evidenceDates[i]
      const next = evidenceDates[i + 1]
      
      const gapDays = (next.date.getTime() - current.date.getTime()) / (1000 * 60 * 60 * 24)
      
      if (gapDays > 90) { // 3-month gap
        gaps.push({
          gap_type: 'temporal_gap',
          severity: gapDays > 365 ? 'high' : 'medium',
          description: `${Math.round(gapDays)}-day gap in evidence timeline`,
          gap_start: current.date.toISOString().split('T')[0],
          gap_end: next.date.toISOString().split('T')[0],
          suggested_mitigation: 'Seek evidence covering the gap period',
          impact: 'May create uncertainty about events during gap period'
        })
      }
    }
    
    return gaps
  }

  identifyCorroborationGaps(categorized) {
    const gaps = []
    
    // Flatten evidence items
    const allItems = []
    Object.values(categorized).forEach(category => {
      if (Array.isArray(category)) {
        allItems.push(...category)
      }
    })
    
    // Find high-priority evidence without corroboration
    const highPriorityItems = allItems.filter(item => item.priority_score > 0.8)
    
    highPriorityItems.forEach(item => {
      const keyFacts = this.extractKeyFacts(item)
      let hasCorroboration = false
      
      keyFacts.forEach(fact => {
        const supportingItems = allItems.filter(other => 
          other.id !== item.id && this.extractKeyFacts(other).includes(fact)
        )
        
        if (supportingItems.length > 0) {
          hasCorroboration = true
        }
      })
      
      if (!hasCorroboration) {
        gaps.push({
          gap_type: 'corroboration_gap',
          evidence_id: item.id,
          severity: 'medium',
          description: 'High-priority evidence lacks corroboration',
          evidence_summary: item.content.substring(0, 100) + '...',
          suggested_mitigation: 'Seek independent evidence supporting these facts',
          impact: 'Evidence may be vulnerable if challenged'
        })
      }
    })
    
    return gaps
  }

  getGapSeverityScore(severity) {
    const scores = { high: 3, medium: 2, low: 1 }
    return scores[severity] || 0
  }

  createEvidencePatterns(evidence, strengths, gaps) {
    return {
      evidence_profile: {
        documentary_strength: this.calculateCategoryStrength(evidence.documentary),
        testimonial_strength: this.calculateCategoryStrength(evidence.testimonial),
        digital_strength: this.calculateCategoryStrength(evidence.digital),
        overall_robustness: this.calculateOverallRobustness(strengths)
      },
      
      weakness_patterns: gaps.map(gap => ({
        type: gap.gap_type,
        severity: gap.severity,
        mitigation_strategy: gap.suggested_mitigation
      })),
      
      strength_patterns: this.identifyStrengthPatterns(strengths)
    }
  }

  calculateCategoryStrength(categoryItems) {
    if (!Array.isArray(categoryItems) || categoryItems.length === 0) {
      return { strength: 0, count: 0, avg_priority: 0 }
    }
    
    const avgPriority = categoryItems.reduce((sum, item) => sum + item.priority_score, 0) / categoryItems.length
    const strength = Math.min(categoryItems.length * 0.2 + avgPriority * 0.8, 1.0)
    
    return {
      strength: strength,
      count: categoryItems.length,
      avg_priority: avgPriority,
      top_items: categoryItems.slice(0, 3).map(item => ({
        id: item.id,
        summary: item.content.substring(0, 50) + '...',
        priority: item.priority_score
      }))
    }
  }

  calculateOverallRobustness(strengths) {
    if (strengths.length === 0) return 0
    
    const avgWeight = strengths.reduce((sum, assessment) => 
      sum + assessment.strength_profile.weight, 0) / strengths.length
    
    const highQualityCount = strengths.filter(s => s.strength_profile.weight > 0.8).length
    const qualityRatio = highQualityCount / strengths.length
    
    return (avgWeight * 0.7) + (qualityRatio * 0.3)
  }

  identifyStrengthPatterns(strengths) {
    const patterns = []
    
    // Identify dominant strength factors
    const strengthFactors = { authenticity: [], relevance: [], reliability: [], admissibility: [] }
    
    strengths.forEach(assessment => {
      Object.keys(strengthFactors).forEach(factor => {
        strengthFactors[factor].push(assessment.strength_profile[factor])
      })
    })
    
    Object.keys(strengthFactors).forEach(factor => {
      const scores = strengthFactors[factor]
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
      const highScoreCount = scores.filter(score => score > 0.8).length
      
      if (avgScore > 0.7) {
        patterns.push({
          type: 'strength_concentration',
          factor: factor,
          average_score: avgScore,
          high_quality_count: highScoreCount,
          description: `Strong ${factor} across evidence base`
        })
      } else if (avgScore < 0.5) {
        patterns.push({
          type: 'weakness_concentration',
          factor: factor,
          average_score: avgScore,
          low_quality_count: scores.filter(score => score < 0.5).length,
          description: `Weakness in ${factor} across evidence base`
        })
      }
    })
    
    return patterns
  }

  // Utility methods for evidence analysis
  getAnalyzerStats() {
    return {
      analyzer_type: 'EvidenceAnalyzer',
      evidence_categories: Object.keys(this.evidence_types),
      strength_factors: Object.keys(this.strength_factors),
      pattern_indicators: Object.keys(this.evidence_patterns),
      capabilities: [
        'Evidence identification and extraction',
        'Multi-category evidence classification',
        'Comprehensive strength assessment',
        'Corroboration network analysis',
        'Evidence gap identification',
        'Legal admissibility assessment',
        'Risk factor identification',
        'Strategic recommendations'
      ],
      privacy_compliance: 'Pattern-based evidence analysis with content anonymization'
    }
  }
}

export default EvidenceAnalyzer