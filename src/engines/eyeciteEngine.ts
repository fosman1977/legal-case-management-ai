/**
 * Eyecite Case Citation Extraction Engine
 * Specialized for precise legal citation identification and validation
 */

import { EntityExtractionResult } from '../utils/unifiedAIClient';

export interface EyeciteConfig {
  confidence: number;
  includeForeign: boolean;
  validateCitations: boolean;
  includeNeutralCitations: boolean;
}

export class EyeciteEngine {
  private config: EyeciteConfig;
  private isInitialized: boolean = false;

  // Comprehensive citation patterns for UK and international courts
  private readonly citationPatterns = {
    // UK Citation patterns
    ukCitations: [
      // Neutral citations: [2023] UKSC 15
      /\[(\d{4})\]\s+(UKSC|UKPC|EWCA|EWHC|UKUT|UKFTT|EWCOP|EWFC)\s+(Civ|Crim|Admin|Comm|Ch|Fam|QB|TCC|Mercantile|Pat|IPEC|Costs|CPR)?\s*(\d+)/g,
      
      // Law Reports: [2023] 1 AC 123
      /\[(\d{4})\]\s+(\d+)\s+(AC|WLR|All\s*ER|QB|Ch|Fam|BCLC|BCC|EWCA|Lloyd's\s*Rep)\s+(\d+)/g,
      
      // Weekly Law Reports: [2023] 1 WLR 456
      /\[(\d{4})\]\s+(\d+)\s+(WLR|All\s*ER)\s+(\d+)/g,
      
      // European cases: Case C-123/45
      /Case\s+C-(\d+)\/(\d+)/g,
      
      // Older citations: (1985) 1 AC 567
      /\((\d{4})\)\s+(\d+)\s+(AC|WLR|All\s*ER|QB|Ch|Fam)\s+(\d+)/g
    ],

    // Court abbreviations and their full names
    courtAbbreviations: {
      'UKSC': 'UK Supreme Court',
      'UKPC': 'UK Privy Council',
      'EWCA': 'England and Wales Court of Appeal',
      'EWHC': 'England and Wales High Court',
      'UKUT': 'UK Upper Tribunal',
      'UKFTT': 'UK First-tier Tribunal',
      'EWCOP': 'England and Wales Court of Protection',
      'EWFC': 'England and Wales Family Court'
    },

    // Division abbreviations
    divisionAbbreviations: {
      'Civ': 'Civil Division',
      'Crim': 'Criminal Division', 
      'Admin': 'Administrative Court',
      'Comm': 'Commercial Court',
      'Ch': 'Chancery Division',
      'Fam': 'Family Division',
      'QB': 'Queen\'s Bench Division',
      'TCC': 'Technology and Construction Court',
      'Mercantile': 'Mercantile Court',
      'Pat': 'Patents Court',
      'IPEC': 'Intellectual Property Enterprise Court',
      'Costs': 'Costs Court',
      'CPR': 'Civil Procedure Rules'
    },

    // Law report abbreviations
    reportAbbreviations: {
      'AC': 'Appeal Cases',
      'WLR': 'Weekly Law Reports',
      'All ER': 'All England Law Reports',
      'QB': 'Queen\'s Bench',
      'Ch': 'Chancery',
      'Fam': 'Family',
      'BCLC': 'Butterworths Company Law Cases',
      'BCC': 'British Company Cases',
      'Lloyd\'s Rep': 'Lloyd\'s Law Reports'
    }
  };

  // Statutory citation patterns
  private readonly statutePatterns = [
    // UK Acts: Human Rights Act 1998
    /\b([A-Z][A-Za-z\s&]+Act)\s+(\d{4})\b/g,
    
    // Sections: s 15 or section 15(3)
    /\b(?:s(?:ection)?\.?\s*)(\d+[A-Za-z]?)(?:\(([^)]+)\))?\b/g,
    
    // Statutory Instruments: SI 2023/456
    /\bSI\s+(\d{4})\/(\d+)\b/g,
    
    // European legislation: Art 8 ECHR
    /\b(?:Art(?:icle)?\.?\s*)(\d+[A-Za-z]?)(?:\(([^)]+)\))?\s+(ECHR|TFEU|TEU|Charter)\b/g,
    
    // Regulations: reg 15 or regulation 15(2)
    /\b(?:reg(?:ulation)?\.?\s*)(\d+[A-Za-z]?)(?:\(([^)]+)\))?\b/g
  ];

  constructor(config: Partial<EyeciteConfig> = {}) {
    this.config = {
      confidence: 0.98,
      includeForeign: true,
      validateCitations: true,
      includeNeutralCitations: true,
      ...config
    };
  }

  /**
   * Initialize the Eyecite engine
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('📚 Initializing Eyecite Citation Engine...');
      
      // In production, this would load citation databases and validation rules
      await new Promise(resolve => setTimeout(resolve, 50));
      
      this.isInitialized = true;
      console.log('✅ Eyecite engine initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Eyecite engine:', error);
      return false;
    }
  }

  /**
   * Extract legal entities focusing on citations
   */
  async extractEntities(text: string, documentType: string): Promise<EntityExtractionResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const result: EntityExtractionResult = {
      persons: this.extractPersonsFromCitations(text),
      issues: [], // Eyecite focuses on citations, not issues
      chronologyEvents: this.extractDatesFromCitations(text),
      authorities: this.extractLegalAuthorities(text)
    };

    console.log(`📚 Eyecite extracted: ${result.authorities.length} authorities, ${result.persons.length} persons from citations`);
    
    return result;
  }

  /**
   * Extract persons mentioned in case names
   */
  private extractPersonsFromCitations(text: string): Array<{ name: string; role: string; confidence: number }> {
    const persons: Array<{ name: string; role: string; confidence: number }> = [];
    
    // Extract parties from case citations
    const caseNamePatterns = [
      // Standard case format: Smith v Jones
      /\b([A-Z][A-Za-z\s&]+)\s+v\.?\s+([A-Z][A-Za-z\s&]+)(?:\s+\[|\s+\()/g,
      
      // R v Criminal cases
      /\bR\s+v\.?\s+([A-Z][A-Za-z\s]+)(?:\s+\[|\s+\()/g,
      
      // Re cases: Re Smith
      /\bRe\s+([A-Z][A-Za-z\s]+)(?:\s+\[|\s+\()/g,
      
      // Ex parte cases: Ex p Smith
      /\bEx\s+p(?:arte)?\s+([A-Z][A-Za-z\s]+)(?:\s+\[|\s+\()/g
    ];

    // Standard v. format
    let match;
    const standardPattern = caseNamePatterns[0];
    while ((match = standardPattern.exec(text)) !== null) {
      const claimant = this.cleanPartyName(match[1]);
      const defendant = this.cleanPartyName(match[2]);
      
      if (this.isValidPartyName(claimant)) {
        persons.push({
          name: claimant,
          role: 'Claimant/Appellant',
          confidence: 0.95
        });
      }
      
      if (this.isValidPartyName(defendant)) {
        persons.push({
          name: defendant,
          role: 'Defendant/Respondent', 
          confidence: 0.95
        });
      }
    }

    // R v cases (criminal)
    const criminalPattern = caseNamePatterns[1];
    while ((match = criminalPattern.exec(text)) !== null) {
      const defendant = this.cleanPartyName(match[1]);
      
      if (this.isValidPartyName(defendant)) {
        persons.push({
          name: defendant,
          role: 'Defendant',
          confidence: 0.97
        });
      }
    }

    // Re cases
    const rePattern = caseNamePatterns[2];
    while ((match = rePattern.exec(text)) !== null) {
      const party = this.cleanPartyName(match[1]);
      
      if (this.isValidPartyName(party)) {
        persons.push({
          name: party,
          role: 'Subject of proceedings',
          confidence: 0.93
        });
      }
    }

    return this.deduplicatePersons(persons);
  }

  /**
   * Extract chronology events from citation dates
   */
  private extractDatesFromCitations(text: string): Array<{ date: string; event: string; confidence: number }> {
    const events: Array<{ date: string; event: string; confidence: number }> = [];
    
    // Extract years from citations and create chronology events
    this.citationPatterns.ukCitations.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const year = match[1];
        const court = match[2];
        const caseNumber = match[4] || match[3];
        
        const courtName = this.citationPatterns.courtAbbreviations[court] || court;
        
        events.push({
          date: `${year}-01-01`, // Approximate date (year only from citation)
          event: `Case decided in ${courtName}`,
          confidence: 0.85
        });
      }
    });

    return events;
  }

  /**
   * Extract legal authorities (main function)
   */
  private extractLegalAuthorities(text: string): Array<{ citation: string; relevance: string; confidence: number }> {
    const authorities: Array<{ citation: string; relevance: string; confidence: number }> = [];
    
    // Extract case citations
    authorities.push(...this.extractCaseCitations(text));
    
    // Extract statutory authorities
    authorities.push(...this.extractStatutoryCitations(text));
    
    // Extract European authorities
    authorities.push(...this.extractEuropeanAuthorities(text));
    
    return this.deduplicateAuthorities(authorities);
  }

  /**
   * Extract case citations
   */
  private extractCaseCitations(text: string): Array<{ citation: string; relevance: string; confidence: number }> {
    const citations: Array<{ citation: string; relevance: string; confidence: number }> = [];
    
    this.citationPatterns.ukCitations.forEach((pattern, index) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const fullCitation = match[0].trim();
        const year = match[1];
        const court = match[2];
        
        // Determine relevance based on court level
        let relevance = 'Case law authority';
        let confidence = 0.95;
        
        switch (court) {
          case 'UKSC':
            relevance = 'Supreme Court precedent (binding)';
            confidence = 0.99;
            break;
          case 'UKPC':
            relevance = 'Privy Council decision (highly persuasive)';
            confidence = 0.97;
            break;
          case 'EWCA':
            relevance = 'Court of Appeal decision (binding on lower courts)';
            confidence = 0.96;
            break;
          case 'EWHC':
            relevance = 'High Court decision (persuasive)';
            confidence = 0.93;
            break;
          default:
            relevance = 'Tribunal or specialist court decision';
            confidence = 0.90;
        }
        
        citations.push({
          citation: fullCitation,
          relevance: relevance,
          confidence: confidence
        });
      }
    });
    
    return citations;
  }

  /**
   * Extract statutory citations
   */
  private extractStatutoryCitations(text: string): Array<{ citation: string; relevance: string; confidence: number }> {
    const citations: Array<{ citation: string; relevance: string; confidence: number }> = [];
    
    this.statutePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const fullCitation = match[0].trim();
        
        let relevance = 'Statutory authority';
        let confidence = 0.94;
        
        // Specific handling for different types
        if (fullCitation.includes('Act')) {
          relevance = 'Primary legislation (Act of Parliament)';
          confidence = 0.96;
        } else if (fullCitation.includes('SI')) {
          relevance = 'Secondary legislation (Statutory Instrument)';
          confidence = 0.93;
        } else if (fullCitation.includes('ECHR') || fullCitation.includes('TFEU') || fullCitation.includes('TEU')) {
          relevance = 'European/International law';
          confidence = 0.95;
        }
        
        citations.push({
          citation: fullCitation,
          relevance: relevance,
          confidence: confidence
        });
      }
    });
    
    return citations;
  }

  /**
   * Extract European authorities
   */
  private extractEuropeanAuthorities(text: string): Array<{ citation: string; relevance: string; confidence: number }> {
    const citations: Array<{ citation: string; relevance: string; confidence: number }> = [];
    
    // European Court of Justice cases
    const ecjPattern = /\bCase\s+C-(\d+)\/(\d+)(?:\s+([A-Z][A-Za-z\s&]+))?\b/g;
    let match;
    while ((match = ecjPattern.exec(text)) !== null) {
      citations.push({
        citation: match[0].trim(),
        relevance: 'European Court of Justice decision',
        confidence: 0.96
      });
    }

    // European Court of Human Rights
    const echrPattern = /\b([A-Z][A-Za-z\s&]+)\s+v\.?\s+([A-Z][A-Za-z\s&]+)\s+(?:\(|\[).*?ECHR/g;
    while ((match = echrPattern.exec(text)) !== null) {
      citations.push({
        citation: match[0].trim(),
        relevance: 'European Court of Human Rights decision',
        confidence: 0.94
      });
    }
    
    return citations;
  }

  /**
   * Clean party name
   */
  private cleanPartyName(name: string): string {
    return name.trim()
      .replace(/\s+/g, ' ')
      .replace(/^(The\s+|Mr\s+|Mrs\s+|Ms\s+|Dr\s+|Sir\s+|Lady\s+)/i, '')
      .replace(/\s+(Ltd|Limited|PLC|plc|Inc|Corp|Corporation)$/i, '');
  }

  /**
   * Validate party name
   */
  private isValidPartyName(name: string): boolean {
    // Filter out common legal terms that aren't party names
    const exclusions = [
      'Court', 'Justice', 'Judge', 'Tribunal', 'Commission', 'Authority',
      'Secretary', 'State', 'Crown', 'Regina', 'Majesty', 'Government'
    ];
    
    return name.length > 2 && 
           name.length < 50 && 
           !exclusions.some(term => name.includes(term)) &&
           /^[A-Z]/.test(name);
  }

  /**
   * Deduplicate persons
   */
  private deduplicatePersons(persons: Array<{ name: string; role: string; confidence: number }>): Array<{ name: string; role: string; confidence: number }> {
    const unique: Array<{ name: string; role: string; confidence: number }> = [];
    
    persons.forEach(person => {
      const existing = unique.find(p => 
        p.name.toLowerCase() === person.name.toLowerCase()
      );
      
      if (!existing) {
        unique.push(person);
      } else if (person.confidence > existing.confidence) {
        const index = unique.indexOf(existing);
        unique[index] = person;
      }
    });
    
    return unique;
  }

  /**
   * Deduplicate authorities
   */
  private deduplicateAuthorities(authorities: Array<{ citation: string; relevance: string; confidence: number }>): Array<{ citation: string; relevance: string; confidence: number }> {
    const unique: Array<{ citation: string; relevance: string; confidence: number }> = [];
    
    authorities.forEach(authority => {
      const existing = unique.find(a => 
        this.normalizeCitation(a.citation) === this.normalizeCitation(authority.citation)
      );
      
      if (!existing) {
        unique.push(authority);
      } else if (authority.confidence > existing.confidence) {
        const index = unique.indexOf(existing);
        unique[index] = authority;
      }
    });
    
    return unique;
  }

  /**
   * Normalize citation for comparison
   */
  private normalizeCitation(citation: string): string {
    return citation.toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[.,;:]/g, '')
      .trim();
  }

  /**
   * Validate citation format
   */
  validateCitation(citation: string): { isValid: boolean; type: string; confidence: number } {
    // Test against known patterns
    for (const pattern of this.citationPatterns.ukCitations) {
      if (pattern.test(citation)) {
        return {
          isValid: true,
          type: 'UK Case Citation',
          confidence: 0.95
        };
      }
    }
    
    for (const pattern of this.statutePatterns) {
      if (pattern.test(citation)) {
        return {
          isValid: true,
          type: 'Statutory Citation',
          confidence: 0.93
        };
      }
    }
    
    return {
      isValid: false,
      type: 'Unknown',
      confidence: 0.0
    };
  }

  /**
   * Get engine status
   */
  getStatus(): { name: string; isAvailable: boolean; confidence: number; specialties: string[] } {
    return {
      name: 'Eyecite Citation Engine',
      isAvailable: this.isInitialized,
      confidence: this.config.confidence,
      specialties: ['Case citations', 'Statutory references', 'Legal authorities', 'Citation validation']
    };
  }
}

// Export singleton instance
export const eyeciteEngine = new EyeciteEngine();
export default eyeciteEngine;