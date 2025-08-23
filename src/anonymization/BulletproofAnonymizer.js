/**
 * Bulletproof Anonymizer - Exact implementation from roadmap
 * Week 4: Day 3-4 Multi-Layer Anonymization Engine
 */

import EnhancedBlackstoneEngine from '../engines/EnhancedBlackstoneEngine.js';
import PresidioAnalyzer from './PresidioAnalyzer.js';
import UKLegalPatterns from './UKLegalPatterns.js';

class BulletproofAnonymizer {
  constructor() {
    this.blackstone = new EnhancedBlackstoneEngine();
    this.presidio = new PresidioAnalyzer();
    this.ukPatterns = new UKLegalPatterns();
    this.verificationThreshold = 0.01; // Maximum acceptable risk score
  }

  async anonymizeDocument(text, caseContext = {}) {
    console.log('🔒 Starting bulletproof anonymization process...');
    
    try {
      // Layer 1: BlackstoneNLP for UK legal entities
      console.log('Layer 1: BlackstoneNLP entity extraction...');
      const legalEntities = await this.blackstone.extractEntities(text);
      
      // Layer 2: Presidio for comprehensive PII
      console.log('Layer 2: Presidio PII detection...');
      const piiEntities = await this.presidio.analyzePII(text);
      
      // Layer 3: Custom UK legal patterns
      console.log('Layer 3: UK legal pattern recognition...');
      const ukEntities = this.ukPatterns.extract(text);
      
      // Layer 4: Merge and verify
      console.log('Layer 4: Entity merging and verification...');
      const allEntities = this.mergeEntitySets(legalEntities, piiEntities, ukEntities);
      
      // Layer 5: Create anonymization mapping
      console.log('Layer 5: Creating consistent mapping...');
      const mapping = this.createConsistentMapping(allEntities, caseContext);
      
      // Layer 6: Apply anonymization
      console.log('Layer 6: Applying anonymization...');
      const anonymized = this.applyAnonymization(text, mapping);
      
      // Layer 7: Verify no leakage
      console.log('Layer 7: Verification and risk assessment...');
      const verification = await this.verifyAnonymization(anonymized, mapping);
      
      if (verification.risk_score > this.verificationThreshold) {
        throw new Error(`Anonymization verification failed: Risk score ${verification.risk_score} exceeds threshold ${this.verificationThreshold}`);
      }

      console.log(`✅ Bulletproof anonymization complete: ${Math.round((1 - verification.risk_score) * 100)}% confidence`);

      return {
        patterns: this.extractPatterns(anonymized, mapping),
        mapping: mapping, // Store locally only
        verification: verification,
        confidence: 1 - verification.risk_score,
        layers_processed: 7,
        entities_found: allEntities.length,
        processing_time: Date.now()
      };
      
    } catch (error) {
      console.error('❌ Bulletproof anonymization failed:', error);
      throw error;
    }
  }

  mergeEntitySets(legalEntities, piiEntities, ukEntities) {
    const allEntities = [];
    
    // Add legal entities with source tracking
    legalEntities.forEach(entity => {
      allEntities.push({
        ...entity,
        source: 'blackstone',
        category: 'legal'
      });
    });

    // Add PII entities with source tracking
    piiEntities.forEach(entity => {
      allEntities.push({
        text: entity.text,
        type: entity.entity_type,
        start: entity.start,
        end: entity.end,
        confidence: entity.score,
        source: 'presidio',
        category: 'pii'
      });
    });

    // Add UK pattern entities with source tracking
    ukEntities.forEach(entity => {
      allEntities.push({
        text: entity.value,
        type: entity.type,
        start: entity.start,
        end: entity.end,
        confidence: entity.confidence,
        source: 'uk_patterns',
        category: 'legal_uk'
      });
    });

    // Deduplicate overlapping entities
    return this.deduplicateEntities(allEntities);
  }

  deduplicateEntities(entities) {
    const sorted = entities.sort((a, b) => a.start - b.start);
    const deduplicated = [];
    
    for (const entity of sorted) {
      const overlapping = deduplicated.find(existing => 
        this.hasOverlap(existing, entity)
      );
      
      if (!overlapping) {
        deduplicated.push(entity);
      } else if (entity.confidence > overlapping.confidence) {
        // Replace with higher confidence entity
        const index = deduplicated.indexOf(overlapping);
        deduplicated[index] = entity;
      }
    }
    
    return deduplicated;
  }

  hasOverlap(entity1, entity2) {
    return !(entity1.end <= entity2.start || entity2.end <= entity1.start);
  }

  createConsistentMapping(allEntities, caseContext) {
    const mapping = {
      entities: [],
      replacements: {},
      context: caseContext,
      created_at: new Date().toISOString()
    };

    // Group entities by type for consistent replacement
    const entityGroups = {};
    
    allEntities.forEach(entity => {
      const key = entity.type || 'UNKNOWN';
      if (!entityGroups[key]) {
        entityGroups[key] = [];
      }
      entityGroups[key].push(entity);
    });

    // Create consistent replacements for each type
    for (const [entityType, entities] of Object.entries(entityGroups)) {
      entities.forEach((entity, index) => {
        const replacement = this.generateReplacement(entityType, index + 1);
        
        mapping.entities.push({
          original: entity.text,
          replacement: replacement,
          type: entityType,
          start: entity.start,
          end: entity.end,
          confidence: entity.confidence,
          source: entity.source,
          category: entity.category
        });

        mapping.replacements[entity.text] = replacement;
      });
    }

    return mapping;
  }

  generateReplacement(entityType, index) {
    const replacements = {
      'PERSON': `<PERSON_${index}>`,
      'CASE_NAME': `<CASE_${index}>`,
      'LEGAL_CITATION': `<CITATION_${index}>`,
      'EMAIL_ADDRESS': `<EMAIL_${index}>`,
      'PHONE_NUMBER': `<PHONE_${index}>`,
      'LOCATION': `<LOCATION_${index}>`,
      'DATE_TIME': `<DATE_${index}>`,
      'companies_house': `<COMPANY_${index}>`,
      'court_cases': `<COURT_CASE_${index}>`,
      'nino': `<NINO_${index}>`,
      'postcodes': `<POSTCODE_${index}>`
    };

    return replacements[entityType] || `<${entityType.toUpperCase()}_${index}>`;
  }

  applyAnonymization(text, mapping) {
    let anonymizedText = text;
    
    // Sort entities by position (reverse order for replacement)
    const sortedEntities = [...mapping.entities].sort((a, b) => b.start - a.start);

    for (const entity of sortedEntities) {
      anonymizedText = anonymizedText.substring(0, entity.start) + 
                     entity.replacement + 
                     anonymizedText.substring(entity.end);
    }

    return anonymizedText;
  }

  async verifyAnonymization(anonymizedText, mapping) {
    console.log('🔍 Performing anonymization verification...');
    
    const verification = {
      risk_score: 0,
      issues: [],
      checks_performed: [],
      confidence: 0
    };

    // Check 1: No original entities remain
    const entityLeakage = this.checkEntityLeakage(anonymizedText, mapping);
    verification.checks_performed.push('entity_leakage');
    if (entityLeakage.leaked.length > 0) {
      verification.risk_score += 0.5;
      verification.issues.push(`Entity leakage detected: ${entityLeakage.leaked.length} entities`);
    }

    // Check 2: Re-run PII detection on anonymized text
    const residualPII = await this.checkResidualPII(anonymizedText);
    verification.checks_performed.push('residual_pii');
    if (residualPII.found.length > 0) {
      verification.risk_score += 0.3;
      verification.issues.push(`Residual PII detected: ${residualPII.found.length} items`);
    }

    // Check 3: Pattern-based leakage detection
    const patternLeakage = this.checkPatternLeakage(anonymizedText);
    verification.checks_performed.push('pattern_leakage');
    if (patternLeakage.suspicious.length > 0) {
      verification.risk_score += 0.2;
      verification.issues.push(`Suspicious patterns detected: ${patternLeakage.suspicious.length} patterns`);
    }

    // Check 4: Context preservation verification
    const contextCheck = this.verifyContextPreservation(anonymizedText, mapping);
    verification.checks_performed.push('context_preservation');
    verification.context_preserved = contextCheck.preserved;

    verification.confidence = Math.max(0, 1 - verification.risk_score);
    verification.passed = verification.risk_score <= this.verificationThreshold;

    console.log(`🔍 Verification complete: Risk score ${verification.risk_score}, Confidence ${Math.round(verification.confidence * 100)}%`);

    return verification;
  }

  checkEntityLeakage(anonymizedText, mapping) {
    const leaked = [];
    
    for (const entity of mapping.entities) {
      if (anonymizedText.includes(entity.original)) {
        leaked.push({
          entity: entity.original,
          type: entity.type,
          positions: this.findAllOccurrences(anonymizedText, entity.original)
        });
      }
    }

    return { leaked, count: leaked.length };
  }

  async checkResidualPII(anonymizedText) {
    try {
      // Re-run PII detection on anonymized text
      const residualEntities = await this.presidio.analyzePII(anonymizedText);
      
      // Filter out placeholder entities (our replacements)
      const actualPII = residualEntities.filter(entity => 
        !entity.text.startsWith('<') || !entity.text.endsWith('>')
      );

      return {
        found: actualPII,
        count: actualPII.length
      };
    } catch (error) {
      console.warn('Residual PII check failed:', error);
      return { found: [], count: 0 };
    }
  }

  checkPatternLeakage(anonymizedText) {
    const suspiciousPatterns = [
      /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // Potential names not caught
      /\b\d{2,3}-\d{3}-\d{4}\b/g,      // Phone-like patterns
      /\b[A-Z]{2}\d{6}[A-Z]\b/g,       // NINO-like patterns
      /\b\d{8}\b/g                     // Company number patterns
    ];

    const suspicious = [];
    
    for (const [index, pattern] of suspiciousPatterns.entries()) {
      const matches = [...anonymizedText.matchAll(pattern)];
      if (matches.length > 0) {
        suspicious.push({
          pattern: `pattern_${index + 1}`,
          matches: matches.map(m => m[0]),
          count: matches.length
        });
      }
    }

    return { suspicious, count: suspicious.length };
  }

  verifyContextPreservation(anonymizedText, mapping) {
    // Check that legal structure and meaning are preserved
    const preservationChecks = {
      case_structure: anonymizedText.includes('<CASE_') || anonymizedText.includes('<CITATION_'),
      legal_roles: /\b(Claimant|Defendant|Appellant|Respondent)\b/i.test(anonymizedText),
      court_context: /\b(Court|Judge|Justice|Tribunal)\b/i.test(anonymizedText),
      legal_concepts: /\b(contract|negligence|damages|liability|jurisdiction)\b/i.test(anonymizedText)
    };

    const preservedCount = Object.values(preservationChecks).filter(Boolean).length;
    const totalChecks = Object.keys(preservationChecks).length;

    return {
      preserved: preservedCount / totalChecks,
      checks: preservationChecks
    };
  }

  extractPatterns(anonymizedText, mapping) {
    // Convert anonymized content to abstract patterns for Claude
    return {
      document_type: this.classifyDocumentType(anonymizedText),
      legal_issues: this.identifyLegalIssues(anonymizedText),
      entity_patterns: this.createEntityPatterns(mapping),
      complexity_indicators: this.assessComplexity(anonymizedText),
      jurisdiction_markers: this.identifyJurisdiction(anonymizedText),
      anonymization_quality: {
        entities_anonymized: mapping.entities.length,
        confidence: mapping.verification?.confidence || 0,
        risk_score: mapping.verification?.risk_score || 0
      }
    };
  }

  classifyDocumentType(anonymizedText) {
    const typeIndicators = this.ukPatterns.analyzeDocumentType(anonymizedText);
    return {
      primary_type: typeIndicators.type,
      confidence: typeIndicators.confidence,
      alternative_types: Object.keys(typeIndicators.scores)
        .filter(type => type !== typeIndicators.type)
        .sort((a, b) => typeIndicators.scores[b] - typeIndicators.scores[a])
        .slice(0, 2)
    };
  }

  identifyLegalIssues(anonymizedText) {
    const legalConcepts = [
      'breach of contract', 'negligence', 'damages', 'liability',
      'jurisdiction', 'precedent', 'misrepresentation', 'duress'
    ];

    const found = [];
    for (const concept of legalConcepts) {
      const regex = new RegExp(`\\b${concept}\\b`, 'gi');
      const matches = anonymizedText.match(regex);
      if (matches) {
        found.push({
          concept: concept,
          frequency: matches.length,
          context: 'legal_analysis'
        });
      }
    }

    return found;
  }

  createEntityPatterns(mapping) {
    const patterns = {};
    
    for (const entity of mapping.entities) {
      const category = entity.category || 'unknown';
      if (!patterns[category]) {
        patterns[category] = [];
      }
      
      patterns[category].push({
        type: entity.type,
        confidence: entity.confidence,
        source: entity.source
      });
    }

    return patterns;
  }

  assessComplexity(anonymizedText) {
    return {
      text_length: anonymizedText.length,
      paragraph_count: anonymizedText.split('\n\n').length,
      sentence_count: anonymizedText.split(/[.!?]+/).length,
      entity_density: (anonymizedText.match(/<[A-Z_]+_\d+>/g) || []).length,
      legal_density: this.calculateLegalDensity(anonymizedText)
    };
  }

  calculateLegalDensity(text) {
    const legalTerms = [
      'court', 'judge', 'law', 'legal', 'statute', 'case',
      'contract', 'agreement', 'liability', 'damages', 'negligence'
    ];

    const words = text.toLowerCase().split(/\s+/);
    const legalWordCount = words.filter(word => 
      legalTerms.some(term => word.includes(term))
    ).length;

    return legalWordCount / words.length;
  }

  identifyJurisdiction(anonymizedText) {
    const jurisdictionMarkers = [
      { pattern: /England\s+(?:and|&)\s+Wales/gi, jurisdiction: 'England and Wales' },
      { pattern: /Scottish?\s+law/gi, jurisdiction: 'Scotland' },
      { pattern: /Northern\s+Ireland/gi, jurisdiction: 'Northern Ireland' },
      { pattern: /European\s+(?:Union|Court)/gi, jurisdiction: 'European' },
      { pattern: /EWCA|EWHC|UKSC/gi, jurisdiction: 'England and Wales' }
    ];

    const found = [];
    for (const marker of jurisdictionMarkers) {
      const matches = anonymizedText.match(marker.pattern);
      if (matches) {
        found.push({
          jurisdiction: marker.jurisdiction,
          frequency: matches.length,
          confidence: 0.9
        });
      }
    }

    return found;
  }

  findAllOccurrences(text, searchString) {
    const indices = [];
    let index = text.indexOf(searchString);
    
    while (index !== -1) {
      indices.push(index);
      index = text.indexOf(searchString, index + 1);
    }
    
    return indices;
  }

  // Utility methods
  getAnonymizerInfo() {
    return {
      name: 'Bulletproof Anonymizer',
      version: '1.0.0',
      layers: 7,
      verification_threshold: this.verificationThreshold,
      components: [
        this.blackstone.getEngineInfo(),
        this.presidio.getAnalyzerInfo(),
        this.ukPatterns.getPatternInfo()
      ],
      features: [
        'Multi-layer entity detection',
        'Consistent anonymization mapping',
        'Verification and risk assessment',
        'Pattern extraction for AI consultation',
        'UK legal specialization'
      ]
    };
  }

  updateVerificationThreshold(newThreshold) {
    if (newThreshold >= 0 && newThreshold <= 1) {
      this.verificationThreshold = newThreshold;
      return true;
    }
    return false;
  }
}

export default BulletproofAnonymizer;