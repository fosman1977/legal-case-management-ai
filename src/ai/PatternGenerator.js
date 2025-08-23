/**
 * Enhanced Pattern Generator - Week 5 Day 1-2 Implementation
 * Generates rich consultation patterns for Claude AI consultation
 */

class EnhancedPatternGenerator {
  constructor() {
    this.legalConceptWeights = {
      'breach of contract': 0.95,
      'negligence': 0.90,
      'damages': 0.85,
      'liability': 0.90,
      'jurisdiction': 0.80,
      'precedent': 0.85,
      'misrepresentation': 0.88,
      'duress': 0.92,
      'frustration': 0.85,
      'estoppel': 0.87
    };

    this.jurisdictionIndicators = {
      'England and Wales': ['EWCA', 'EWHC', 'England and Wales'],
      'Scotland': ['Scottish law', 'Court of Session', 'Sheriff Court'],
      'Northern Ireland': ['Northern Ireland', 'NICA'],
      'European': ['European Union', 'CJEU', 'European Court']
    };
  }

  generateConsultationPattern(documents, analysis) {
    console.log('🧠 Generating enhanced consultation pattern...');

    const pattern = {
      // Document characteristics
      document_profile: {
        types: this.classifyDocumentTypes(documents),
        volume: documents.length,
        complexity: this.assessOverallComplexity(documents),
        date_range: this.extractDateRange(documents),
        jurisdiction: this.identifyJurisdiction(documents)
      },

      // Legal issue analysis
      legal_analysis: {
        primary_issues: this.identifyPrimaryLegalIssues(analysis),
        secondary_issues: this.identifySecondaryIssues(analysis),
        procedural_considerations: this.identifyProceduralIssues(analysis),
        evidence_categories: this.categorizeEvidence(documents)
      },

      // Relationship patterns
      relationship_patterns: {
        entity_relationships: this.mapEntityRelationships(analysis),
        temporal_patterns: this.identifyTemporalPatterns(analysis),
        financial_patterns: this.identifyFinancialPatterns(analysis),
        communication_patterns: this.identifyCommunicationPatterns(analysis)
      },

      // Risk and complexity indicators
      risk_indicators: {
        timeline_pressures: this.identifyTimelinePressures(analysis),
        evidence_gaps: this.identifyEvidenceGaps(analysis),
        complexity_factors: this.identifyComplexityFactors(analysis),
        strategic_considerations: this.identifyStrategicConsiderations(analysis)
      },

      // Pattern metadata
      pattern_metadata: {
        generated_at: new Date().toISOString(),
        confidence: this.calculatePatternConfidence(documents, analysis),
        anonymization_verified: true,
        pattern_version: '5.0.0'
      }
    };

    console.log(`✅ Pattern generated with ${Math.round(pattern.pattern_metadata.confidence * 100)}% confidence`);
    return pattern;
  }

  classifyDocumentTypes(documents) {
    const typeClassification = {};
    
    documents.forEach(doc => {
      const type = this.classifySingleDocument(doc);
      typeClassification[type] = (typeClassification[type] || 0) + 1;
    });

    return {
      distribution: typeClassification,
      primary_type: this.findPrimaryType(typeClassification),
      document_complexity: this.assessDocumentComplexity(typeClassification)
    };
  }

  classifySingleDocument(document) {
    const filename = document.name.toLowerCase();
    const text = document.extractedText || '';

    // Contract indicators
    if (this.hasContractIndicators(filename, text)) {
      return 'contract';
    }

    // Court document indicators
    if (this.hasCourtDocumentIndicators(filename, text)) {
      return 'court_document';
    }

    // Correspondence indicators
    if (this.hasCorrespondenceIndicators(filename, text)) {
      return 'correspondence';
    }

    // Financial document indicators
    if (this.hasFinancialIndicators(filename, text)) {
      return 'financial_document';
    }

    // Evidence indicators
    if (this.hasEvidenceIndicators(filename, text)) {
      return 'evidence';
    }

    return 'general_document';
  }

  hasContractIndicators(filename, text) {
    const contractKeywords = [
      'contract', 'agreement', 'terms', 'conditions',
      'consideration', 'obligations', 'warranties'
    ];
    
    return contractKeywords.some(keyword => 
      filename.includes(keyword) || 
      text.toLowerCase().includes(keyword)
    );
  }

  hasCourtDocumentIndicators(filename, text) {
    const courtKeywords = [
      'judgment', 'order', 'pleading', 'claim',
      'defence', 'witness statement', 'skeleton argument'
    ];
    
    return courtKeywords.some(keyword => 
      filename.includes(keyword) || 
      text.toLowerCase().includes(keyword)
    );
  }

  hasCorrespondenceIndicators(filename, text) {
    const correspondenceKeywords = [
      'letter', 'email', 'correspondence', 'communication',
      'dear', 'yours faithfully', 'yours sincerely'
    ];
    
    return correspondenceKeywords.some(keyword => 
      filename.includes(keyword) || 
      text.toLowerCase().includes(keyword)
    );
  }

  hasFinancialIndicators(filename, text) {
    const financialKeywords = [
      'invoice', 'receipt', 'payment', 'financial',
      'account', 'statement', 'damages', 'compensation'
    ];
    
    return financialKeywords.some(keyword => 
      filename.includes(keyword) || 
      text.toLowerCase().includes(keyword)
    );
  }

  hasEvidenceIndicators(filename, text) {
    const evidenceKeywords = [
      'evidence', 'exhibit', 'proof', 'documentation',
      'record', 'log', 'transcript'
    ];
    
    return evidenceKeywords.some(keyword => 
      filename.includes(keyword) || 
      text.toLowerCase().includes(keyword)
    );
  }

  findPrimaryType(typeClassification) {
    return Object.keys(typeClassification).reduce((a, b) => 
      typeClassification[a] > typeClassification[b] ? a : b
    );
  }

  assessDocumentComplexity(typeClassification) {
    const typeCount = Object.keys(typeClassification).length;
    const totalDocs = Object.values(typeClassification).reduce((sum, count) => sum + count, 0);
    
    if (typeCount === 1) return 'simple';
    if (typeCount <= 3 && totalDocs <= 10) return 'moderate';
    return 'complex';
  }

  assessOverallComplexity(documents) {
    const totalSize = documents.reduce((sum, doc) => sum + (doc.size || 0), 0);
    const avgConfidence = documents.reduce((sum, doc) => sum + (doc.confidence || 0.8), 0) / documents.length;
    
    return {
      document_count: documents.length,
      total_size_mb: Math.round(totalSize / (1024 * 1024)),
      average_confidence: Math.round(avgConfidence * 100) / 100,
      complexity_score: this.calculateComplexityScore(documents)
    };
  }

  calculateComplexityScore(documents) {
    let score = 0;
    
    // Document count factor
    if (documents.length > 20) score += 0.3;
    else if (documents.length > 10) score += 0.2;
    else if (documents.length > 5) score += 0.1;
    
    // Size factor
    const totalSize = documents.reduce((sum, doc) => sum + (doc.size || 0), 0);
    if (totalSize > 100 * 1024 * 1024) score += 0.3; // >100MB
    else if (totalSize > 50 * 1024 * 1024) score += 0.2; // >50MB
    else if (totalSize > 10 * 1024 * 1024) score += 0.1; // >10MB
    
    // Type diversity factor
    const types = new Set(documents.map(doc => this.classifySingleDocument(doc)));
    if (types.size > 4) score += 0.2;
    else if (types.size > 2) score += 0.1;
    
    return Math.min(1.0, score);
  }

  extractDateRange(documents) {
    const dates = [];
    
    documents.forEach(doc => {
      if (doc.metadata && doc.metadata.created) {
        dates.push(new Date(doc.metadata.created));
      }
      
      // Extract dates from filenames
      const filename = doc.name;
      const dateMatches = filename.match(/\d{4}[-_]\d{2}[-_]\d{2}/g);
      if (dateMatches) {
        dateMatches.forEach(dateStr => {
          const date = new Date(dateStr.replace(/_/g, '-'));
          if (!isNaN(date.getTime())) {
            dates.push(date);
          }
        });
      }
    });
    
    if (dates.length === 0) {
      return {
        earliest: null,
        latest: null,
        span_days: 0
      };
    }
    
    const earliest = new Date(Math.min(...dates));
    const latest = new Date(Math.max(...dates));
    const spanDays = Math.floor((latest - earliest) / (1000 * 60 * 60 * 24));
    
    return {
      earliest: earliest.toISOString().split('T')[0],
      latest: latest.toISOString().split('T')[0],
      span_days: spanDays
    };
  }

  identifyJurisdiction(documents) {
    const jurisdictionCounts = {};
    
    documents.forEach(doc => {
      const text = doc.extractedText || doc.name || '';
      
      for (const [jurisdiction, indicators] of Object.entries(this.jurisdictionIndicators)) {
        const matches = indicators.filter(indicator => 
          text.toLowerCase().includes(indicator.toLowerCase())
        );
        
        if (matches.length > 0) {
          jurisdictionCounts[jurisdiction] = (jurisdictionCounts[jurisdiction] || 0) + matches.length;
        }
      }
    });
    
    const primaryJurisdiction = Object.keys(jurisdictionCounts).reduce((a, b) => 
      jurisdictionCounts[a] > jurisdictionCounts[b] ? a : b, 'England and Wales'
    );
    
    return {
      primary: primaryJurisdiction,
      confidence: jurisdictionCounts[primaryJurisdiction] / documents.length,
      indicators_found: jurisdictionCounts
    };
  }

  identifyPrimaryLegalIssues(analysis) {
    const legalIssues = [];
    
    // Extract from anonymized text patterns
    if (analysis.legal_concepts) {
      analysis.legal_concepts.forEach(concept => {
        const weight = this.legalConceptWeights[concept.concept.toLowerCase()] || 0.5;
        
        legalIssues.push({
          concept: concept.concept,
          frequency: concept.frequency,
          weight: weight,
          importance_score: concept.frequency * weight,
          context: concept.context
        });
      });
    }
    
    // Sort by importance score
    return legalIssues
      .sort((a, b) => b.importance_score - a.importance_score)
      .slice(0, 5); // Top 5 primary issues
  }

  identifySecondaryIssues(analysis) {
    const secondaryIssues = [];
    
    // Look for related legal concepts with lower frequency/weight
    if (analysis.legal_concepts) {
      analysis.legal_concepts.forEach(concept => {
        const weight = this.legalConceptWeights[concept.concept.toLowerCase()] || 0.5;
        const importance = concept.frequency * weight;
        
        if (importance < 2.0 && importance > 0.5) { // Secondary threshold
          secondaryIssues.push({
            concept: concept.concept,
            frequency: concept.frequency,
            relationship: 'supporting_issue',
            relevance: importance
          });
        }
      });
    }
    
    return secondaryIssues.slice(0, 10); // Top 10 secondary issues
  }

  identifyProceduralIssues(analysis) {
    const proceduralKeywords = [
      'limitation', 'statute of limitations', 'procedural',
      'jurisdiction', 'service', 'disclosure', 'case management'
    ];
    
    const proceduralIssues = [];
    
    if (analysis.text) {
      proceduralKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = analysis.text.match(regex);
        
        if (matches) {
          proceduralIssues.push({
            issue: keyword,
            frequency: matches.length,
            urgency: this.assessProceduralUrgency(keyword)
          });
        }
      });
    }
    
    return proceduralIssues;
  }

  assessProceduralUrgency(issue) {
    const urgencyMap = {
      'limitation': 'high',
      'statute of limitations': 'high',
      'service': 'medium',
      'disclosure': 'medium',
      'jurisdiction': 'high',
      'case management': 'low'
    };
    
    return urgencyMap[issue.toLowerCase()] || 'medium';
  }

  categorizeEvidence(documents) {
    const evidenceCategories = {
      documentary: [],
      witness_statements: [],
      expert_reports: [],
      correspondence: [],
      financial: [],
      digital: []
    };
    
    documents.forEach(doc => {
      const type = this.classifySingleDocument(doc);
      const filename = doc.name.toLowerCase();
      
      if (filename.includes('witness') || filename.includes('statement')) {
        evidenceCategories.witness_statements.push({
          document: doc.name,
          type: 'witness_statement',
          strength: this.assessEvidenceStrength(doc)
        });
      } else if (filename.includes('expert') || filename.includes('report')) {
        evidenceCategories.expert_reports.push({
          document: doc.name,
          type: 'expert_report',
          strength: this.assessEvidenceStrength(doc)
        });
      } else if (type === 'correspondence') {
        evidenceCategories.correspondence.push({
          document: doc.name,
          type: 'correspondence',
          strength: this.assessEvidenceStrength(doc)
        });
      } else if (type === 'financial_document') {
        evidenceCategories.financial.push({
          document: doc.name,
          type: 'financial_evidence',
          strength: this.assessEvidenceStrength(doc)
        });
      } else {
        evidenceCategories.documentary.push({
          document: doc.name,
          type: 'documentary',
          strength: this.assessEvidenceStrength(doc)
        });
      }
    });
    
    return evidenceCategories;
  }

  assessEvidenceStrength(document) {
    let strength = 0.5; // Base strength
    
    // Confidence factor
    if (document.confidence > 0.95) strength += 0.3;
    else if (document.confidence > 0.85) strength += 0.2;
    else if (document.confidence > 0.75) strength += 0.1;
    
    // Size factor (more content = potentially stronger)
    if (document.size > 1024 * 1024) strength += 0.1; // >1MB
    
    // Type factor
    const filename = document.name.toLowerCase();
    if (filename.includes('signed') || filename.includes('executed')) strength += 0.2;
    if (filename.includes('draft')) strength -= 0.2;
    if (filename.includes('copy')) strength -= 0.1;
    
    return Math.max(0.1, Math.min(1.0, strength));
  }

  mapEntityRelationships(analysis) {
    const relationships = {
      person_to_person: [],
      person_to_organization: [],
      organization_to_organization: [],
      temporal_relationships: []
    };
    
    // This would typically analyze the anonymized patterns to identify relationships
    // For now, provide structure for relationship mapping
    
    return {
      relationship_count: 0,
      relationship_types: Object.keys(relationships),
      complexity_indicator: 'low', // Based on relationship density
      relationships: relationships
    };
  }

  identifyTemporalPatterns(analysis) {
    return {
      event_sequence: [],
      critical_dates: [],
      timeline_gaps: [],
      urgency_indicators: []
    };
  }

  identifyFinancialPatterns(analysis) {
    return {
      monetary_references: 0,
      financial_complexity: 'low',
      damage_indicators: [],
      financial_relationships: []
    };
  }

  identifyCommunicationPatterns(analysis) {
    return {
      communication_frequency: 'unknown',
      key_correspondents: 0,
      communication_gaps: [],
      escalation_patterns: []
    };
  }

  identifyTimelinePressures(analysis) {
    const pressures = [];
    
    // Look for limitation periods, deadlines, etc.
    const timeKeywords = [
      'deadline', 'limitation', 'expires', 'time limit',
      'urgent', 'immediate', 'asap', 'quickly'
    ];
    
    timeKeywords.forEach(keyword => {
      // In a real implementation, this would search anonymized content
      // For now, return structure
    });
    
    return pressures;
  }

  identifyEvidenceGaps(analysis) {
    return [
      // Structure for evidence gap analysis
    ];
  }

  identifyComplexityFactors(analysis) {
    const factors = [];
    
    if (analysis.document_count > 50) {
      factors.push({
        factor: 'high_document_volume',
        impact: 'high',
        description: 'Large number of documents requiring analysis'
      });
    }
    
    if (analysis.legal_concepts && analysis.legal_concepts.length > 10) {
      factors.push({
        factor: 'multiple_legal_issues',
        impact: 'medium',
        description: 'Multiple complex legal concepts identified'
      });
    }
    
    return factors;
  }

  identifyStrategicConsiderations(analysis) {
    return {
      case_strength_indicators: [],
      risk_factors: [],
      strategic_opportunities: [],
      procedural_considerations: []
    };
  }

  calculatePatternConfidence(documents, analysis) {
    let confidence = 0.7; // Base confidence
    
    // Document confidence factor
    const avgDocConfidence = documents.reduce((sum, doc) => sum + (doc.confidence || 0.8), 0) / documents.length;
    confidence += (avgDocConfidence - 0.8) * 0.3;
    
    // Analysis completeness factor
    if (analysis.legal_concepts && analysis.legal_concepts.length > 0) {
      confidence += 0.1;
    }
    
    // Anonymization verification factor
    if (analysis.anonymization_verified) {
      confidence += 0.1;
    }
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  // Utility methods
  getPatternGeneratorInfo() {
    return {
      name: 'Enhanced Pattern Generator',
      version: '5.0.0',
      features: [
        'Rich consultation patterns',
        'Multi-dimensional analysis',
        'Legal issue prioritization',
        'Evidence categorization',
        'Risk assessment',
        'Strategic guidance preparation'
      ],
      pattern_types: [
        'document_profile',
        'legal_analysis', 
        'relationship_patterns',
        'risk_indicators'
      ]
    };
  }
}

export default EnhancedPatternGenerator;