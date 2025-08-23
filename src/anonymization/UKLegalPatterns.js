/**
 * UK Legal Pattern Recognition - Exact implementation from roadmap
 * Week 4: Day 5 UK Legal Pattern Recognition
 */

class UKLegalPatterns {
  constructor() {
    this.patterns = {
      companies_house: /\b\d{8}\b/, // 8-digit company numbers
      court_cases: /\[?\d{4}\]\s*[A-Z]{2,4}\s*\d+/g, // [2023] EWCA Civ 123
      hmcts_refs: /[A-Z]{2}\d{2}[A-Z]\d{5}/g, // AB12C34567
      vat_numbers: /GB\d{9}|\d{9}/g,
      nhs_numbers: /\d{3}\s?\d{3}\s?\d{4}/g,
      nino: /[A-Z]{2}\d{6}[A-Z]/g,
      postcodes: /[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}/gi,
      solicitors_refs: /[A-Z]{2,4}\/\d+\/[A-Z\d]+/g
    };

    // Enhanced patterns for legal contexts
    this.enhancedPatterns = {
      legal_citations: {
        regex: /\[?\d{4}\]\s*[A-Z]{2,6}\s*(Civ|Crim|Admin|Ch|QB|EWHC|EWCA|UKSC)\s*\d+/gi,
        type: 'LEGAL_CITATION',
        confidence: 0.95
      },
      case_names: {
        regex: /([A-Z][a-z]+(?: [A-Z][a-z]+)*)\s+v\.?\s+([A-Z][a-z]+(?: [A-Z][a-z]+)*)/g,
        type: 'CASE_NAME',
        confidence: 0.90
      },
      statutes: {
        regex: /([\w\s]+)\s+(Act|Regulations?|Rules?|Order)\s+\d{4}/g,
        type: 'STATUTE',
        confidence: 0.85
      },
      court_references: {
        regex: /(?:Court|Tribunal)\s+(?:of\s+)?(?:Appeal|First\s+Instance|Queen's\s+Bench|Chancery|Family)/gi,
        type: 'COURT',
        confidence: 0.88
      },
      judicial_titles: {
        regex: /(?:Lord\s+Justice|Lady\s+Justice|Mr\s+Justice|Mrs\s+Justice|Master|District\s+Judge|Circuit\s+Judge)\s+[A-Z][a-z]+/g,
        type: 'JUDICIAL_TITLE',
        confidence: 0.92
      },
      legal_roles: {
        regex: /\b(?:Claimant|Defendant|Appellant|Respondent|Intervener|Interested\s+Party)\b/gi,
        type: 'LEGAL_ROLE',
        confidence: 0.80
      }
    };
  }

  extract(text) {
    const entities = [];
    
    // Extract basic UK patterns
    for (const [type, pattern] of Object.entries(this.patterns)) {
      const matches = text.match(pattern) || [];
      for (const match of matches) {
        entities.push({
          type: type,
          value: match,
          confidence: 0.95,
          start: text.indexOf(match),
          end: text.indexOf(match) + match.length,
          source: 'uk_legal_patterns'
        });
      }
    }

    // Extract enhanced legal patterns
    for (const [name, patternData] of Object.entries(this.enhancedPatterns)) {
      const matches = [...text.matchAll(patternData.regex)];
      for (const match of matches) {
        entities.push({
          type: patternData.type,
          value: match[0],
          confidence: patternData.confidence,
          start: match.index,
          end: match.index + match[0].length,
          source: 'enhanced_legal_patterns',
          pattern_name: name,
          groups: match.slice(1) // Capture groups
        });
      }
    }

    return this.deduplicateEntities(entities);
  }

  deduplicateEntities(entities) {
    // Remove duplicate entities with overlapping ranges
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

  // Specialized extraction methods
  extractCourtReferences(text) {
    const courtPatterns = [
      /\[?\d{4}\]\s*EWCA\s*Civ\s*\d+/gi,  // Court of Appeal Civil
      /\[?\d{4}\]\s*EWCA\s*Crim\s*\d+/gi, // Court of Appeal Criminal
      /\[?\d{4}\]\s*EWHC\s*\d+\s*\([A-Z]+\)/gi, // High Court
      /\[?\d{4}\]\s*UKSC\s*\d+/gi,        // Supreme Court
      /\[?\d{4}\]\s*UKPC\s*\d+/gi         // Privy Council
    ];

    const references = [];
    
    for (const pattern of courtPatterns) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        references.push({
          citation: match[0],
          court: this.identifyCourt(match[0]),
          year: this.extractYear(match[0]),
          start: match.index,
          end: match.index + match[0].length,
          confidence: 0.98
        });
      }
    }

    return references;
  }

  identifyCourt(citation) {
    if (citation.includes('EWCA Civ')) return 'Court of Appeal (Civil Division)';
    if (citation.includes('EWCA Crim')) return 'Court of Appeal (Criminal Division)';
    if (citation.includes('EWHC')) return 'High Court of England and Wales';
    if (citation.includes('UKSC')) return 'Supreme Court of the United Kingdom';
    if (citation.includes('UKPC')) return 'Judicial Committee of the Privy Council';
    return 'Unknown Court';
  }

  extractYear(citation) {
    const yearMatch = citation.match(/\[?(\d{4})\]?/);
    return yearMatch ? parseInt(yearMatch[1]) : null;
  }

  extractCaseNames(text) {
    const caseNamePattern = /([A-Z][a-z]+(?: [A-Z][a-z]+)*)\s+v\.?\s+([A-Z][a-z]+(?: [A-Z][a-z]+)*)/g;
    const matches = [...text.matchAll(caseNamePattern)];
    
    return matches.map(match => ({
      fullName: match[0],
      claimant: match[1],
      defendant: match[2],
      start: match.index,
      end: match.index + match[0].length,
      confidence: 0.90,
      type: 'CASE_NAME'
    }));
  }

  extractLegalConcepts(text) {
    const concepts = [
      'breach of contract', 'negligence', 'damages', 'liability',
      'jurisdiction', 'precedent', 'ratio decidendi', 'obiter dicta',
      'ultra vires', 'res judicata', 'estoppel', 'consideration',
      'misrepresentation', 'duress', 'undue influence', 'frustration'
    ];

    const found = [];
    
    for (const concept of concepts) {
      const regex = new RegExp(`\\b${concept}\\b`, 'gi');
      const matches = [...text.matchAll(regex)];
      
      for (const match of matches) {
        found.push({
          concept: concept,
          text: match[0],
          start: match.index,
          end: match.index + match[0].length,
          confidence: 0.85,
          type: 'LEGAL_CONCEPT'
        });
      }
    }

    return found;
  }

  // Analysis methods
  analyzeDocumentType(text) {
    const typeIndicators = {
      'judgment': ['judgment', 'handed down', 'lord justice', 'before:', 'between:'],
      'contract': ['agreement', 'party', 'consideration', 'terms', 'conditions'],
      'witness_statement': ['witness statement', 'i believe', 'to the best of my knowledge'],
      'pleading': ['claim', 'defence', 'particulars', 'prayer for relief'],
      'skeleton_argument': ['skeleton argument', 'authorities', 'submissions']
    };

    const scores = {};
    
    for (const [docType, indicators] of Object.entries(typeIndicators)) {
      scores[docType] = indicators.reduce((score, indicator) => {
        const regex = new RegExp(indicator, 'gi');
        const matches = text.match(regex);
        return score + (matches ? matches.length : 0);
      }, 0);
    }

    // Find document type with highest score
    const maxScore = Math.max(...Object.values(scores));
    const documentType = Object.keys(scores).find(key => scores[key] === maxScore);

    return {
      type: documentType,
      confidence: Math.min(0.95, maxScore * 0.1),
      scores: scores
    };
  }

  // Utility methods
  getPatternInfo() {
    return {
      name: 'UK Legal Pattern Recognition',
      version: '1.0.0',
      patterns: Object.keys(this.patterns),
      enhancedPatterns: Object.keys(this.enhancedPatterns),
      features: [
        'Court Citation Recognition',
        'Case Name Extraction',
        'Legal Concept Identification',
        'Document Type Analysis',
        'UK-Specific Entity Recognition'
      ]
    };
  }

  validatePattern(pattern, text) {
    try {
      const regex = new RegExp(pattern, 'g');
      const matches = [...text.matchAll(regex)];
      return {
        valid: true,
        matches: matches.length,
        examples: matches.slice(0, 3).map(m => m[0])
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }
}

export default UKLegalPatterns;