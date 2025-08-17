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

    return persons;
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

    return issues;
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

    return events;
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