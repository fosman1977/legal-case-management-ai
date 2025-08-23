/**
 * Legal Regex Pattern Matching Engine
 * High-precision rule-based extraction using legal patterns
 */

import { EntityExtractionResult } from '../utils/unifiedAIClient';

export class LegalRegexEngine {
  private readonly patterns = {
    // Monetary amounts and damages
    monetary: [
      /£([\d,]+(?:\.\d{2})?)\s*(?:million|m|thousand|k)?/gi,
      /damages?\s+(?:of\s+)?£([\d,]+(?:\.\d{2})?)/gi,
      /costs?\s+(?:of\s+)?£([\d,]+(?:\.\d{2})?)/gi,
      /compensation\s+(?:of\s+)?£([\d,]+(?:\.\d{2})?)/gi
    ],

    // Legal deadlines and time periods
    deadlines: [
      /within\s+(\d+)\s+(days?|weeks?|months?)/gi,
      /(?:by|before)\s+(\d{1,2}(?:st|nd|rd|th)?\s+\w+\s+\d{4})/gi,
      /no\s+later\s+than\s+([^.]+)/gi,
      /time\s+limit\s+(?:of\s+)?(\d+\s+\w+)/gi
    ],

    // Court orders and directions
    orders: [
      /(?:ordered|directed|declared)\s+that\s+([^.]+)/gi,
      /the\s+court\s+(?:orders?|directs?)\s+([^.]+)/gi,
      /it\s+is\s+(?:ordered|directed)\s+that\s+([^.]+)/gi,
      /judgment\s+(?:is\s+)?(?:given|entered)\s+(?:for|in\s+favour\s+of)\s+([^.]+)/gi
    ],

    // Legal procedures
    procedures: [
      /(?:application|motion|petition)\s+(?:for|to)\s+([^.]+)/gi,
      /(?:claimant|plaintiff)\s+(?:seeks?|claims?|requests?)\s+([^.]+)/gi,
      /(?:defendant|respondent)\s+(?:contends?|argues?|submits?)\s+([^.]+)/gi,
      /the\s+issue\s+(?:is|are)\s+([^.]+)/gi
    ],

    // Addresses and locations
    addresses: [
      /(\d+[A-Za-z]?\s+[A-Z][a-zA-Z\s]+(?:Street|Road|Avenue|Lane|Close|Drive|Place|Square|Gardens|Court|Way|Crescent|Grove|Park|Rise|Hill|Green|Common|Mews))/g,
      /([A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2})/g // UK postcodes
    ],

    // Professional entities
    professionals: [
      /([A-Z][a-zA-Z\s]+)\s+(?:Solicitors?|Barristers?|QC|KC|Chambers)/g,
      /([A-Z][a-zA-Z\s&]+)\s+(?:LLP|Limited|Ltd|Partnership)/g,
      /Messrs\.?\s+([A-Z][a-zA-Z\s&]+)/g
    ],

    // Legal concepts and causes of action
    legalConcepts: [
      /(?:cause\s+of\s+action|claim)\s+(?:in|for|under)\s+([^.]+)/gi,
      /(?:breach\s+of|negligent|negligence)\s+([^.]+)/gi,
      /(?:liable|liability)\s+(?:for|in)\s+([^.]+)/gi,
      /(?:damages\s+for|loss\s+of)\s+([^.]+)/gi
    ]
  };

  private isInitialized: boolean = false;

  async initialize(): Promise<boolean> {
    console.log('🔍 Initializing Legal Regex Engine...');
    this.isInitialized = true;
    console.log('✅ Legal Regex engine initialized');
    return true;
  }

  async extractEntities(text: string, documentType: string): Promise<EntityExtractionResult> {
    if (!this.isInitialized) await this.initialize();

    const result: EntityExtractionResult = {
      persons: this.extractPersons(text),
      issues: this.extractIssues(text),
      chronologyEvents: this.extractEvents(text),
      authorities: this.extractAuthorities(text)
    };

    console.log(`🔍 Legal Regex extracted: ${result.persons.length} persons, ${result.issues.length} issues`);
    return result;
  }

  private extractPersons(text: string): Array<{ name: string; role: string; confidence: number }> {
    const persons: Array<{ name: string; role: string; confidence: number }> = [];

    // Extract professional entities
    this.patterns.professionals.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        persons.push({
          name: match[1].trim(),
          role: 'Legal Professional/Firm',
          confidence: 0.92
        });
      }
    });

    // Extract general person names (broader patterns)
    const generalNamePatterns = [
      // Mr/Mrs/Ms/Dr + Name
      /\b(Mr\.?|Mrs\.?|Ms\.?|Dr\.?)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,2})\b/g,
      // Full names in sentences (Title Case)
      /\b([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)(?:\s+(?:said|stated|argued|claimed|testified|declared|mentioned|reported|indicated))/g,
      // Names with professional titles
      /\b([A-Z][a-zA-Z\s]+)(?:\s+(?:Esq|Solicitor|Barrister|Counsel|Attorney|Lawyer))\b/g,
      // Party references
      /\b(?:the\s+)?(claimant|defendant|plaintiff|respondent|appellant|applicant)[,\s]+([A-Z][a-zA-Z\s]+)/gi,
      // Witness/expert references
      /\b(?:witness|expert|professor|doctor)\s+([A-Z][a-zA-Z\s]+)/gi
    ];

    generalNamePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const name = match[2] ? match[2].trim() : match[1].trim();
        const role = match[2] ? match[1] : 'Individual';
        
        // Filter out common false positives
        if (name && name.length > 3 && !this.isCommonWord(name)) {
          persons.push({
            name: name,
            role: this.capitalizeRole(role),
            confidence: 0.75
          });
        }
      }
    });

    return this.deduplicatePersons(persons);
  }

  private extractIssues(text: string): Array<{ issue: string; type: string; confidence: number }> {
    const issues: Array<{ issue: string; type: string; confidence: number }> = [];

    // Extract legal concepts
    this.patterns.legalConcepts.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        issues.push({
          issue: match[1].trim(),
          type: 'legal',
          confidence: 0.88
        });
      }
    });

    // Extract procedural issues
    this.patterns.procedures.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        issues.push({
          issue: match[1].trim(),
          type: 'procedural',
          confidence: 0.85
        });
      }
    });

    // Enhanced issue extraction patterns
    const enhancedIssuePatterns = [
      // Questions and disputes
      /\b(?:the\s+)?(?:main\s+|primary\s+|key\s+)?(?:issue|question|dispute|matter|problem)\s+(?:is|are|concerns?)\s+([^.!?]+)/gi,
      /\b(?:whether|if)\s+([^.!?]+)/gi,
      // Claims and allegations
      /\b(?:alleges?|claims?|contends?)\s+(?:that\s+)?([^.!?]+)/gi,
      /\b(?:argues?|submits?)\s+(?:that\s+)?([^.!?]+)/gi,
      // Legal grounds
      /\b(?:on\s+the\s+)?(?:grounds?|basis)\s+(?:that\s+|of\s+)?([^.!?]+)/gi,
      // Headings and numbered points (potential issues)
      /^\s*\d+\.\s*([^\n]{10,80})/gm,
      /^\s*[A-Z][^\n]{10,80}$/gm
    ];

    enhancedIssuePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const issueText = match[1] ? match[1].trim() : '';
        if (issueText && issueText.length > 5 && issueText.length < 200) {
          issues.push({
            issue: issueText,
            type: 'general',
            confidence: 0.70
          });
        }
      }
    });

    // Extract common legal issues
    const commonLegalIssues = [
      { pattern: /\b(negligence|duty of care|breach of duty|standard of care)\b/gi, type: 'tort' },
      { pattern: /\b(contract|agreement|breach|consideration|terms)\b/gi, type: 'contract' },
      { pattern: /\b(employment|dismissal|discrimination|harassment)\b/gi, type: 'employment' },
      { pattern: /\b(property|lease|rent|possession|eviction)\b/gi, type: 'property' },
      { pattern: /\b(family|divorce|custody|maintenance|children)\b/gi, type: 'family' },
      { pattern: /\b(criminal|sentence|conviction|guilty|innocent)\b/gi, type: 'criminal' }
    ];

    commonLegalIssues.forEach(({ pattern, type }) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        // Look for context around the match
        const contextStart = Math.max(0, match.index - 100);
        const contextEnd = Math.min(text.length, match.index + 100);
        const context = text.substring(contextStart, contextEnd);
        
        issues.push({
          issue: `${type.charAt(0).toUpperCase() + type.slice(1)} matter: ${match[1]}`,
          type: type,
          confidence: 0.75
        });
      }
    });

    return this.deduplicateIssues(issues);
  }

  private deduplicateIssues(issues: Array<{ issue: string; type: string; confidence: number }>): Array<{ issue: string; type: string; confidence: number }> {
    const unique: Array<{ issue: string; type: string; confidence: number }> = [];
    
    issues.forEach(issue => {
      const existing = unique.find(i => 
        i.issue.toLowerCase().trim() === issue.issue.toLowerCase().trim() ||
        (i.issue.toLowerCase().includes(issue.issue.toLowerCase().substring(0, 20)) && issue.issue.length > 20)
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

  private extractEvents(text: string): Array<{ date: string; event: string; confidence: number }> {
    const events: Array<{ date: string; event: string; confidence: number }> = [];

    // Extract deadlines as events
    this.patterns.deadlines.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        events.push({
          date: this.normalizeDate(match[1]),
          event: `Deadline: ${match[0]}`,
          confidence: 0.90
        });
      }
    });

    // Enhanced date extraction patterns
    const datePatterns = [
      // DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
      /(\d{1,2}[\/\-\.](\d{1,2})[\/\-\.]\d{4})/g,
      // Month DD, YYYY or DD Month YYYY
      /(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/g,
      /((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4})/g,
      // ISO dates
      /(\d{4}-\d{2}-\d{2})/g
    ];

    datePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const date = match[1];
        
        // Look for context around the date
        const contextStart = Math.max(0, match.index - 150);
        const contextEnd = Math.min(text.length, match.index + 150);
        const context = text.substring(contextStart, contextEnd);
        
        // Extract event description from context
        const eventKeywords = [
          'hearing', 'trial', 'judgment', 'order', 'filing', 'service',
          'meeting', 'conference', 'deadline', 'application', 'motion',
          'signed', 'executed', 'delivered', 'received', 'sent', 'occurred'
        ];
        
        let eventFound = false;
        eventKeywords.forEach(keyword => {
          if (context.toLowerCase().includes(keyword) && !eventFound) {
            events.push({
              date: date,
              event: this.extractEventDescription(context, keyword),
              confidence: 0.80
            });
            eventFound = true;
          }
        });
        
        // If no specific event found, just record the date
        if (!eventFound) {
          events.push({
            date: date,
            event: `Event on ${date}`,
            confidence: 0.60
          });
        }
      }
    });

    return this.deduplicateEvents(events);
  }

  private extractAuthorities(text: string): Array<{ citation: string; relevance: string; confidence: number }> {
    const authorities: Array<{ citation: string; relevance: string; confidence: number }> = [];

    // Extract court orders as authorities
    this.patterns.orders.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        authorities.push({
          citation: match[0].trim(),
          relevance: 'Court order/direction',
          confidence: 0.93
        });
      }
    });

    return authorities;
  }

  private normalizeDate(dateStr: string): string {
    // Simple date normalization - in production would use proper date parsing
    return dateStr.replace(/(\d{1,2})(st|nd|rd|th)/, '$1');
  }

  private extractEventDescription(context: string, keyword: string): string {
    // Extract a meaningful event description from context
    const sentences = context.split(/[.!?]/);
    const relevantSentence = sentences.find(s => s.toLowerCase().includes(keyword));
    
    if (relevantSentence) {
      return relevantSentence.trim().substring(0, 100) + (relevantSentence.length > 100 ? '...' : '');
    }
    
    return `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} event`;
  }

  private isCommonWord(word: string): boolean {
    const commonWords = [
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'court', 'case', 'matter', 'document', 'evidence', 'law', 'legal', 'section',
      'order', 'judgment', 'decision', 'ruling', 'opinion', 'appeal', 'application'
    ];
    return commonWords.includes(word.toLowerCase());
  }

  private capitalizeRole(role: string): string {
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  }

  private deduplicatePersons(persons: Array<{ name: string; role: string; confidence: number }>): Array<{ name: string; role: string; confidence: number }> {
    const unique: Array<{ name: string; role: string; confidence: number }> = [];
    
    persons.forEach(person => {
      const existing = unique.find(p => 
        p.name.toLowerCase().trim() === person.name.toLowerCase().trim()
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

  getStatus() {
    return {
      name: 'Legal Regex Engine',
      isAvailable: this.isInitialized,
      confidence: 0.92,
      specialties: ['Pattern matching', 'Structured text', 'Procedural terms', 'Monetary amounts']
    };
  }
}

export const legalRegexEngine = new LegalRegexEngine();