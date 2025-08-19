/**
 * Blackstone UK Legal NLP Engine
 * Specialized for UK case law, statutes, and legal concepts
 */

import { EntityExtractionResult } from '../utils/unifiedAIClient';

export interface BlackstoneConfig {
  confidence: number;
  ukFocus: boolean;
  includeLegislation: boolean;
  includeCommonLaw: boolean;
}

export class BlackstoneEngine {
  private config: BlackstoneConfig;
  private isInitialized: boolean = false;

  // UK Legal terminology patterns
  private readonly ukLegalTerms = {
    courts: [
      'Supreme Court', 'Court of Appeal', 'High Court', 'Crown Court', 'Magistrates Court',
      'County Court', 'Family Court', 'Employment Tribunal', 'Upper Tribunal',
      'First-tier Tribunal', 'Administrative Court', 'Commercial Court',
      'Chancery Division', 'Queen\'s Bench Division', 'Family Division'
    ],
    legalRoles: [
      'Lord Justice', 'Mr Justice', 'Mrs Justice', 'Lady Justice', 'District Judge',
      'Circuit Judge', 'Recorder', 'Master', 'Deputy Master', 'Registrar',
      'Queen\'s Counsel', 'QC', 'KC', 'King\'s Counsel', 'Junior Counsel',
      'Solicitor', 'Barrister', 'Advocate'
    ],
    legalConcepts: [
      'res judicata', 'ultra vires', 'ratio decidendi', 'obiter dictum',
      'per incuriam', 'sub nom', 'estoppel', 'negligence', 'breach of duty',
      'reasonable foreseeability', 'duty of care', 'causation', 'remoteness',
      'contributory negligence', 'vicarious liability', 'strict liability'
    ],
    statutePatterns: [
      /\b([A-Z][a-zA-Z\s]+Act)\s+(\d{4})\b/g,
      /\bSection\s+(\d+[A-Za-z]?)\s+(?:of\s+)?(?:the\s+)?([A-Z][a-zA-Z\s]+Act\s+\d{4})/g,
      /\b(s\.|sec\.|section)\s*(\d+[A-Za-z]?)\b/gi,
      /\bSchedule\s+(\d+[A-Za-z]?)\b/gi
    ],
    casePatterns: [
      /\b([A-Z][a-zA-Z\s&]+)\s+v\.?\s+([A-Z][a-zA-Z\s&]+)\s*\[(\d{4})\]\s*([A-Z]+)\s*(\d+)/g,
      /\b([A-Z][a-zA-Z\s&]+)\s+v\.?\s+([A-Z][a-zA-Z\s&]+)\s*\((\d{4})\)\s*([A-Z]+)\s*(\d+)/g,
      /\bR\s+v\.?\s+([A-Z][a-zA-Z\s]+)\s*\[(\d{4})\]\s*([A-Z]+)\s*(\d+)/g
    ]
  };

  constructor(config: Partial<BlackstoneConfig> = {}) {
    this.config = {
      confidence: 0.95,
      ukFocus: true,
      includeLegislation: true,
      includeCommonLaw: true,
      ...config
    };
  }

  /**
   * Initialize the Blackstone engine
   */
  async initialize(): Promise<boolean> {
    try {
      // In production, this would load UK legal knowledge bases
      console.log('🏛️ Initializing Blackstone UK Legal Engine...');
      
      // Simulate initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      this.isInitialized = true;
      console.log('✅ Blackstone engine initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Blackstone engine:', error);
      return false;
    }
  }

  /**
   * Extract legal entities using UK-focused rules
   */
  async extractEntities(text: string, documentType: string): Promise<EntityExtractionResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const result: EntityExtractionResult = {
      persons: this.extractLegalPersons(text),
      issues: this.extractLegalIssues(text),
      chronologyEvents: this.extractLegalEvents(text),
      authorities: this.extractLegalAuthorities(text)
    };

    console.log(`🏛️ Blackstone extracted: ${result.persons.length} persons, ${result.issues.length} issues, ${result.authorities.length} authorities`);
    
    return result;
  }

  /**
   * Extract legal persons (judges, lawyers, parties)
   */
  private extractLegalPersons(text: string): Array<{ name: string; role: string; confidence: number }> {
    const persons: Array<{ name: string; role: string; confidence: number }> = [];
    
    // Extract judges
    const judgePatterns = [
      /(?:Lord|Lady|Mr|Mrs)\s+Justice\s+([A-Z][a-zA-Z]+)/g,
      /([A-Z][a-zA-Z]+)\s+(?:LJ|J)\b/g,
      /(?:District\s+Judge|Circuit\s+Judge|Recorder)\s+([A-Z][a-zA-Z\s]+)/g
    ];
    
    judgePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        persons.push({
          name: match[1].trim(),
          role: 'Judge',
          confidence: 0.95
        });
      }
    });

    // Extract Queen's/King's Counsel
    const qcPattern = /([A-Z][a-zA-Z\s]+)\s+(?:QC|KC|Queen's Counsel|King's Counsel)/g;
    let match;
    while ((match = qcPattern.exec(text)) !== null) {
      persons.push({
        name: match[1].trim(),
        role: 'Queen\'s Counsel',
        confidence: 0.93
      });
    }

    // Extract parties from case names
    const partyPattern = /\b([A-Z][a-zA-Z\s&]+)\s+v\.?\s+([A-Z][a-zA-Z\s&]+)/g;
    while ((match = partyPattern.exec(text)) !== null) {
      persons.push(
        {
          name: match[1].trim(),
          role: 'Claimant/Appellant',
          confidence: 0.88
        },
        {
          name: match[2].trim(),
          role: 'Defendant/Respondent',
          confidence: 0.88
        }
      );
    }

    return this.deduplicatePersons(persons);
  }

  /**
   * Extract legal issues and concepts
   */
  private extractLegalIssues(text: string): Array<{ issue: string; type: string; confidence: number }> {
    const issues: Array<{ issue: string; type: string; confidence: number }> = [];
    
    // Common legal issues patterns
    const issuePatterns = [
      { pattern: /\b(negligence|duty of care|breach of duty|causation)\b/gi, type: 'tort', confidence: 0.90 },
      { pattern: /\b(breach of contract|consideration|frustration|misrepresentation)\b/gi, type: 'contract', confidence: 0.90 },
      { pattern: /\b(judicial review|ultra vires|procedural fairness|legitimate expectation)\b/gi, type: 'public', confidence: 0.92 },
      { pattern: /\b(discrimination|unfair dismissal|redundancy|TUPE)\b/gi, type: 'employment', confidence: 0.89 },
      { pattern: /\b(divorce|custody|matrimonial|family proceedings)\b/gi, type: 'family', confidence: 0.87 },
      { pattern: /\b(sentencing|bail|plea|conviction|acquittal)\b/gi, type: 'criminal', confidence: 0.91 }
    ];

    issuePatterns.forEach(({ pattern, type, confidence }) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        issues.push({
          issue: match[1],
          type: type,
          confidence: confidence
        });
      }
    });

    // Extract issues from headings and numbered paragraphs
    const headingPattern = /^(\d+\.?\s*)(.+)$/gm;
    let headingMatch: RegExpExecArray | null;
    while ((headingMatch = headingPattern.exec(text)) !== null) {
      const heading = headingMatch[2].trim();
      if (heading.length > 10 && heading.length < 100) {
        issues.push({
          issue: heading,
          type: 'procedural',
          confidence: 0.75
        });
      }
    }

    return this.deduplicateIssues(issues);
  }

  /**
   * Extract legal events and dates
   */
  private extractLegalEvents(text: string): Array<{ date: string; event: string; confidence: number }> {
    const events: Array<{ date: string; event: string; confidence: number }> = [];
    
    // Date patterns
    const datePatterns = [
      /(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/g,
      /(\d{1,2}\/\d{1,2}\/\d{4})/g,
      /(\d{4}-\d{2}-\d{2})/g
    ];

    datePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const date = match[1];
        
        // Look for events around this date
        const contextStart = Math.max(0, match.index - 200);
        const contextEnd = Math.min(text.length, match.index + 200);
        const context = text.substring(contextStart, contextEnd);
        
        // Extract relevant legal events
        const eventKeywords = [
          'hearing', 'judgment', 'order', 'application', 'trial', 'appeal',
          'sentencing', 'plea', 'conviction', 'acquittal', 'filing', 'service'
        ];
        
        eventKeywords.forEach(keyword => {
          if (context.toLowerCase().includes(keyword)) {
            events.push({
              date: date,
              event: `${keyword} on ${date}`,
              confidence: 0.82
            });
          }
        });
      }
    });

    return this.deduplicateEvents(events);
  }

  /**
   * Extract legal authorities (cases, statutes, regulations)
   */
  private extractLegalAuthorities(text: string): Array<{ citation: string; relevance: string; confidence: number }> {
    const authorities: Array<{ citation: string; relevance: string; confidence: number }> = [];
    
    // Extract case citations
    this.ukLegalTerms.casePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const citation = match[0];
        authorities.push({
          citation: citation,
          relevance: 'Case law precedent',
          confidence: 0.96
        });
      }
    });

    // Extract statute references
    this.ukLegalTerms.statutePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const citation = match[0];
        authorities.push({
          citation: citation,
          relevance: 'Legislative authority',
          confidence: 0.94
        });
      }
    });

    // Extract European authorities
    const euPattern = /\b(Case\s+C-\d+\/\d+|Art(?:icle)?\s+\d+\s+(?:TFEU|TEU|ECHR))/g;
    let match;
    while ((match = euPattern.exec(text)) !== null) {
      authorities.push({
        citation: match[0],
        relevance: 'European law authority',
        confidence: 0.90
      });
    }

    return this.deduplicateAuthorities(authorities);
  }

  /**
   * Deduplicate extracted persons
   */
  private deduplicatePersons(persons: Array<{ name: string; role: string; confidence: number }>): Array<{ name: string; role: string; confidence: number }> {
    const unique: Array<{ name: string; role: string; confidence: number }> = [];
    
    persons.forEach(person => {
      const existing = unique.find(p => 
        p.name.toLowerCase() === person.name.toLowerCase() &&
        p.role === person.role
      );
      
      if (!existing) {
        unique.push(person);
      } else if (person.confidence > existing.confidence) {
        // Replace with higher confidence version
        const index = unique.indexOf(existing);
        unique[index] = person;
      }
    });
    
    return unique;
  }

  /**
   * Deduplicate extracted issues
   */
  private deduplicateIssues(issues: Array<{ issue: string; type: string; confidence: number }>): Array<{ issue: string; type: string; confidence: number }> {
    const unique: Array<{ issue: string; type: string; confidence: number }> = [];
    
    issues.forEach(issue => {
      const existing = unique.find(i => 
        i.issue.toLowerCase() === issue.issue.toLowerCase()
      );
      
      if (!existing) {
        unique.push(issue);
      } else if (issue.confidence > existing.confidence) {
        const index = unique.indexOf(existing);
        unique[index] = issue;
      }
    });
    
    return unique;
  }

  /**
   * Deduplicate extracted events
   */
  private deduplicateEvents(events: Array<{ date: string; event: string; confidence: number }>): Array<{ date: string; event: string; confidence: number }> {
    const unique: Array<{ date: string; event: string; confidence: number }> = [];
    
    events.forEach(event => {
      const existing = unique.find(e => 
        e.date === event.date && 
        e.event.toLowerCase().includes(event.event.toLowerCase().split(' ')[0])
      );
      
      if (!existing) {
        unique.push(event);
      }
    });
    
    return unique;
  }

  /**
   * Deduplicate extracted authorities
   */
  private deduplicateAuthorities(authorities: Array<{ citation: string; relevance: string; confidence: number }>): Array<{ citation: string; relevance: string; confidence: number }> {
    const unique: Array<{ citation: string; relevance: string; confidence: number }> = [];
    
    authorities.forEach(authority => {
      const existing = unique.find(a => 
        a.citation.toLowerCase() === authority.citation.toLowerCase()
      );
      
      if (!existing) {
        unique.push(authority);
      }
    });
    
    return unique;
  }

  /**
   * Get engine status
   */
  getStatus(): { name: string; isAvailable: boolean; confidence: number; specialties: string[] } {
    return {
      name: 'Blackstone UK Legal Engine',
      isAvailable: this.isInitialized,
      confidence: this.config.confidence,
      specialties: ['UK case law', 'Statutes', 'Legal concepts', 'Court procedures']
    };
  }
}

// Export singleton instance
export const blackstoneEngine = new BlackstoneEngine();
export default blackstoneEngine;