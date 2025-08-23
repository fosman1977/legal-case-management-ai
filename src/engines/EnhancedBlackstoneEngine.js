/**
 * Enhanced Blackstone Engine - Exact implementation from roadmap
 * Week 2: Day 5 Optimize Existing Engines
 */

class EnhancedBlackstoneEngine {
  constructor() {
    this.confidence_threshold = 0.85;
    this.batch_size = 100;
    this.processing_start_time = null;
  }

  async analyzeDocument(text) {
    this.processing_start_time = performance.now();
    
    const results = {
      entities: await this.extractEntities(text),
      legal_concepts: await this.identifyLegalConcepts(text),
      confidence_scores: await this.calculateConfidence(text),
      processing_time: performance.now() - this.processing_start_time
    };

    return this.filterByConfidence(results);
  }

  async extractEntities(text) {
    // Simulate enhanced entity extraction with confidence scoring
    const entities = [];
    
    // UK Legal Entity Patterns
    const patterns = {
      court_references: {
        regex: /\[?\d{4}\]\s*[A-Z]{2,4}\s*\d+/g,
        type: 'COURT_REFERENCE',
        confidence: 0.95
      },
      case_names: {
        regex: /([A-Z][a-z]+)\s+v\.?\s+([A-Z][a-z]+)/g,
        type: 'CASE_NAME', 
        confidence: 0.90
      },
      legislation: {
        regex: /(Act|Regulations?|Rules?)\s+\d{4}/g,
        type: 'LEGISLATION',
        confidence: 0.85
      },
      legal_concepts: {
        regex: /\b(negligence|breach of contract|damages|liability|jurisdiction)\b/gi,
        type: 'LEGAL_CONCEPT',
        confidence: 0.80
      }
    };

    for (const [name, pattern] of Object.entries(patterns)) {
      const matches = [...text.matchAll(pattern.regex)];
      for (const match of matches) {
        entities.push({
          text: match[0],
          type: pattern.type,
          confidence: pattern.confidence + (Math.random() * 0.1 - 0.05), // Add slight variance
          start: match.index,
          end: match.index + match[0].length,
          pattern_name: name
        });
      }
    }

    return entities;
  }

  async identifyLegalConcepts(text) {
    // Enhanced legal concept identification
    const concepts = [];
    
    const legalConcepts = {
      'contract_law': {
        keywords: ['contract', 'agreement', 'consideration', 'offer', 'acceptance', 'breach'],
        confidence: 0.88
      },
      'tort_law': {
        keywords: ['negligence', 'duty of care', 'breach of duty', 'causation', 'damages'],
        confidence: 0.85
      },
      'criminal_law': {
        keywords: ['conviction', 'sentence', 'prosecution', 'defendant', 'guilty', 'innocent'],
        confidence: 0.90
      },
      'civil_procedure': {
        keywords: ['claim', 'defence', 'judgment', 'trial', 'evidence', 'witness'],
        confidence: 0.82
      }
    };

    for (const [concept, data] of Object.entries(legalConcepts)) {
      let score = 0;
      let found_keywords = [];
      
      for (const keyword of data.keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
          score += matches.length;
          found_keywords.push(keyword);
        }
      }

      if (score > 0) {
        concepts.push({
          concept: concept,
          confidence: Math.min(0.99, data.confidence + (score * 0.02)),
          relevance_score: score,
          found_keywords: found_keywords,
          total_mentions: score
        });
      }
    }

    return concepts;
  }

  async calculateConfidence(text) {
    // Calculate overall confidence metrics
    const metrics = {
      text_length: text.length,
      legal_density: this.calculateLegalDensity(text),
      structure_score: this.analyzeDocumentStructure(text),
      language_quality: this.assessLanguageQuality(text)
    };

    const overall_confidence = (
      metrics.legal_density * 0.4 +
      metrics.structure_score * 0.3 +
      metrics.language_quality * 0.3
    );

    return {
      overall: Math.min(0.99, overall_confidence),
      metrics: metrics,
      threshold_met: overall_confidence >= this.confidence_threshold
    };
  }

  calculateLegalDensity(text) {
    const legalTerms = [
      'court', 'judge', 'law', 'legal', 'statute', 'regulation', 'case',
      'contract', 'agreement', 'liability', 'damages', 'negligence', 
      'breach', 'jurisdiction', 'evidence', 'witness', 'judgment'
    ];

    const words = text.toLowerCase().split(/\s+/);
    const legalWordCount = words.filter(word => 
      legalTerms.some(term => word.includes(term))
    ).length;

    return Math.min(0.99, legalWordCount / words.length * 10); // Scale appropriately
  }

  analyzeDocumentStructure(text) {
    let score = 0.5; // Base score

    // Check for common legal document structures
    if (text.includes('WHEREAS') || text.includes('NOW THEREFORE')) score += 0.2;
    if (text.includes('Section') || text.includes('Article')) score += 0.1;
    if (text.match(/\d+\.\s/g)) score += 0.1; // Numbered sections
    if (text.includes('Signed:') || text.includes('Date:')) score += 0.1;

    return Math.min(0.99, score);
  }

  assessLanguageQuality(text) {
    // Simple language quality assessment
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
    
    // Legal documents typically have longer, more complex sentences
    const qualityScore = avgSentenceLength > 15 ? 0.9 : 0.7;
    
    return Math.min(0.99, qualityScore);
  }

  filterByConfidence(results) {
    return {
      ...results,
      entities: results.entities.filter(e => e.confidence > this.confidence_threshold),
      legal_concepts: results.legal_concepts.filter(c => c.confidence > this.confidence_threshold),
      filtered_count: {
        entities: results.entities.length - results.entities.filter(e => e.confidence > this.confidence_threshold).length,
        concepts: results.legal_concepts.length - results.legal_concepts.filter(c => c.confidence > this.confidence_threshold).length
      },
      performance: {
        processing_time_ms: results.processing_time,
        confidence_threshold: this.confidence_threshold,
        batch_size: this.batch_size
      }
    };
  }

  // Utility methods for integration
  getEngineInfo() {
    return {
      name: 'Enhanced Blackstone Engine',
      version: '2.0.0',
      confidence_threshold: this.confidence_threshold,
      supported_features: [
        'UK Legal Entity Recognition',
        'Legal Concept Identification', 
        'Confidence Scoring',
        'Performance Optimization'
      ]
    };
  }

  updateConfidenceThreshold(newThreshold) {
    if (newThreshold >= 0 && newThreshold <= 1) {
      this.confidence_threshold = newThreshold;
      return true;
    }
    return false;
  }
}

export default EnhancedBlackstoneEngine;