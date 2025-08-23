/**
 * General Entity Extraction Engine
 * Designed for robust extraction of names, dates, and issues from any document type
 */

import { EntityExtractionResult } from '../utils/unifiedAIClient';

export class GeneralEntityEngine {
  private isInitialized: boolean = false;

  async initialize(): Promise<boolean> {
    console.log('🎯 Initializing General Entity Engine...');
    this.isInitialized = true;
    console.log('✅ General Entity engine initialized');
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

    console.log(`🎯 General Entity extracted: ${result.persons.length} persons, ${result.issues.length} issues, ${result.chronologyEvents.length} events`);
    return result;
  }

  private extractPersons(text: string): Array<{ name: string; role: string; confidence: number }> {
    const persons: Array<{ name: string; role: string; confidence: number }> = [];

    // Comprehensive person name patterns
    const personPatterns = [
      // Titles + Full Names
      {
        pattern: /\b(Mr\.?|Mrs\.?|Ms\.?|Miss|Dr\.?|Professor|Prof\.?|Sir|Dame|Lord|Lady)\s+([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+){1,3})\b/g,
        role: 'Individual',
        confidence: 0.90
      },
      // Full names with common actions/contexts
      {
        pattern: /\b([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:said|stated|told|asked|replied|explained|argued|claimed|testified|declared|mentioned|reported|indicated|confirmed|denied|admitted|suggested|proposed|recommended|concluded|found|discovered|observed|noted|wrote|signed|agreed|disagreed|decided|ruled|ordered|directed)\b/g,
        role: 'Individual',
        confidence: 0.85
      },
      // Names in quotes or with quotes
      {
        pattern: /["']([A-Z][a-zA-Z\s'-]+)["']\s*(?:said|told|stated|explained|argued|claimed)/g,
        role: 'Individual',
        confidence: 0.88
      },
      // Professional contexts
      {
        pattern: /\b(?:solicitor|barrister|counsel|attorney|lawyer|advocate)\s+([A-Z][a-zA-Z\s'-]+)/gi,
        role: 'Legal Professional',
        confidence: 0.92
      },
      // Medical professionals
      {
        pattern: /\b(?:doctor|dr\.?|physician|consultant|surgeon)\s+([A-Z][a-zA-Z\s'-]+)/gi,
        role: 'Medical Professional',
        confidence: 0.90
      },
      // Academic/Expert contexts
      {
        pattern: /\b(?:professor|prof\.?|expert|specialist|researcher)\s+([A-Z][a-zA-Z\s'-]+)/gi,
        role: 'Expert/Academic',
        confidence: 0.89
      },
      // Names with roles/positions
      {
        pattern: /\b([A-Z][a-zA-Z\s'-]+),?\s+(?:who is|as|being)\s+(?:a|an|the)\s+([a-zA-Z\s]+)/g,
        role: 'Individual',
        confidence: 0.80
      },
      // Employee/workplace contexts
      {
        pattern: /\b(?:employee|worker|manager|director|ceo|chairman|president)\s+([A-Z][a-zA-Z\s'-]+)/gi,
        role: 'Professional',
        confidence: 0.85
      },
      // Witness/testimony contexts
      {
        pattern: /\b(?:witness|testified by|testimony of|statement by|according to)\s+([A-Z][a-zA-Z\s'-]+)/gi,
        role: 'Witness',
        confidence: 0.87
      }
    ];

    personPatterns.forEach(({ pattern, role, confidence }) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const name = (match[1] || match[2] || '').trim();
        const contextRole = match[2] ? this.normalizeRole(match[2]) : role;
        
        if (this.isValidPersonName(name)) {
          persons.push({
            name: name,
            role: contextRole,
            confidence: confidence
          });
        }
      }
    });

    // Extract simple capitalized names in sentences (lower confidence)
    const simpleNamePattern = /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g;
    let match;
    while ((match = simpleNamePattern.exec(text)) !== null) {
      const name = match[1].trim();
      if (this.isValidPersonName(name) && this.hasPersonContext(text, match.index)) {
        persons.push({
          name: name,
          role: 'Individual',
          confidence: 0.65
        });
      }
    }

    return this.deduplicatePersons(persons);
  }

  private extractIssues(text: string): Array<{ issue: string; type: string; confidence: number }> {
    const issues: Array<{ issue: string; type: string; confidence: number }> = [];

    // Issue identification patterns
    const issuePatterns = [
      // Direct issue statements
      {
        pattern: /\b(?:the\s+)?(?:main\s+|primary\s+|key\s+|central\s+)?(?:issue|question|problem|matter|dispute|concern)\s+(?:is|are|relates to|concerns?|involves?)\s+([^.!?]{15,200})/gi,
        type: 'main',
        confidence: 0.90
      },
      // Whether questions (legal issues often phrased this way)
      {
        pattern: /\b(?:whether|if)\s+([^.!?]{20,180})/gi,
        type: 'question',
        confidence: 0.85
      },
      // Claims and allegations
      {
        pattern: /\b(?:claims?|alleges?|contends?|argues?|maintains?|asserts?)\s+(?:that\s+)?([^.!?]{20,180})/gi,
        type: 'claim',
        confidence: 0.82
      },
      // Disputes and disagreements
      {
        pattern: /\b(?:disputes?|disagrees?|contests?|challenges?|objects? to)\s+([^.!?]{15,150})/gi,
        type: 'dispute',
        confidence: 0.80
      },
      // Problems and complaints
      {
        pattern: /\b(?:problem|complaint|grievance|objection)\s+(?:is|was|about|regarding|concerning)\s+([^.!?]{15,150})/gi,
        type: 'complaint',
        confidence: 0.78
      },
      // Numbered/bulleted issues
      {
        pattern: /^\s*(?:\d+\.?|\*|\-|\•)\s+([^.\n]{20,150})/gm,
        type: 'listed',
        confidence: 0.75
      },
      // Headings that look like issues
      {
        pattern: /^([A-Z][^.\n]{15,100})$/gm,
        type: 'heading',
        confidence: 0.70
      }
    ];

    issuePatterns.forEach(({ pattern, type, confidence }) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const issueText = match[1].trim();
        if (this.isValidIssue(issueText)) {
          issues.push({
            issue: issueText,
            type: this.categorizeIssue(issueText, type),
            confidence: confidence
          });
        }
      }
    });

    return this.deduplicateIssues(issues);
  }

  private extractEvents(text: string): Array<{ date: string; event: string; confidence: number }> {
    const events: Array<{ date: string; event: string; confidence: number }> = [];

    // Comprehensive date patterns
    const datePatterns = [
      // DD/MM/YYYY variations
      /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/g,
      // Month DD, YYYY
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/g,
      // DD Month YYYY
      /\b(\d{1,2})(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/g,
      // ISO format
      /\b(\d{4})-(\d{2})-(\d{2})\b/g,
      // Month YYYY
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/g,
      // Relative dates
      /\b(yesterday|today|tomorrow|last week|next week|last month|next month|last year|next year)\b/gi
    ];

    datePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const dateStr = match[0];
        
        // Extract context around the date
        const contextStart = Math.max(0, match.index - 200);
        const contextEnd = Math.min(text.length, match.index + 200);
        const context = text.substring(contextStart, contextEnd);
        
        // Look for event indicators around the date
        const eventKeywords = [
          'meeting', 'conference', 'hearing', 'trial', 'appointment', 'interview',
          'deadline', 'due', 'expires', 'signed', 'executed', 'delivered', 'received',
          'sent', 'occurred', 'happened', 'took place', 'scheduled', 'planned',
          'filed', 'submitted', 'completed', 'finished', 'started', 'began',
          'ended', 'concluded', 'decided', 'ruled', 'ordered', 'judgment',
          'agreement', 'contract', 'letter', 'email', 'call', 'visit'
        ];

        let eventFound = false;
        for (const keyword of eventKeywords) {
          if (context.toLowerCase().includes(keyword)) {
            const eventDescription = this.extractEventFromContext(context, keyword, dateStr);
            events.push({
              date: dateStr,
              event: eventDescription,
              confidence: 0.82
            });
            eventFound = true;
            break;
          }
        }

        // If no specific event found, create a generic one
        if (!eventFound) {
          events.push({
            date: dateStr,
            event: `Event on ${dateStr}`,
            confidence: 0.60
          });
        }
      }
    });

    return this.deduplicateEvents(events);
  }

  private extractAuthorities(text: string): Array<{ citation: string; relevance: string; confidence: number }> {
    const authorities: Array<{ citation: string; relevance: string; confidence: number }> = [];

    // Authority patterns (documents, references, sources)
    const authorityPatterns = [
      // Document references
      {
        pattern: /\b(?:document|report|letter|email|memo|statement|agreement|contract|policy|procedure|manual|guideline|standard)\s+(?:titled|named|called|labeled|referenced as)\s+["']([^"']{10,100})["']/gi,
        relevance: 'Referenced document',
        confidence: 0.85
      },
      // Legal citations (broad pattern)
      {
        pattern: /\b([A-Z][a-zA-Z\s&]+\s+v\.?\s+[A-Z][a-zA-Z\s&]+\s*[\[\(]\d{4}[\]\)])/g,
        relevance: 'Case citation',
        confidence: 0.90
      },
      // Legislation references
      {
        pattern: /\b([A-Z][a-zA-Z\s]+Act\s+\d{4})/g,
        relevance: 'Legislation',
        confidence: 0.88
      },
      // Section references
      {
        pattern: /\b(?:Section|Clause|Article|Paragraph)\s+(\d+[A-Za-z]?(?:\(\d+\))?(?:\([a-z]\))?)/gi,
        relevance: 'Legal provision',
        confidence: 0.82
      },
      // Website/URL references
      {
        pattern: /\b(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/g,
        relevance: 'Web reference',
        confidence: 0.75
      },
      // Publications and books
      {
        pattern: /\b(?:according to|as stated in|as per|referring to)\s+["']?([^"'\n]{15,80})["']?\s+(?:by|authored by)?\s*([A-Z][a-zA-Z\s]+)?/gi,
        relevance: 'Publication reference',
        confidence: 0.80
      }
    ];

    authorityPatterns.forEach(({ pattern, relevance, confidence }) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const citation = match[1] ? match[1].trim() : match[0].trim();
        if (citation.length > 5) {
          authorities.push({
            citation: citation,
            relevance: relevance,
            confidence: confidence
          });
        }
      }
    });

    return this.deduplicateAuthorities(authorities);
  }

  // Helper methods
  private isValidPersonName(name: string): boolean {
    if (!name || name.length < 3) return false;
    
    // Filter out common non-person words
    const nonPersonWords = [
      'company', 'limited', 'ltd', 'corporation', 'corp', 'inc', 'llc',
      'court', 'judge', 'case', 'matter', 'document', 'evidence', 'statement',
      'agreement', 'contract', 'application', 'order', 'judgment', 'decision',
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
      'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
      'september', 'october', 'november', 'december'
    ];
    
    const lowerName = name.toLowerCase();
    return !nonPersonWords.some(word => lowerName.includes(word));
  }

  private hasPersonContext(text: string, position: number): boolean {
    const contextStart = Math.max(0, position - 50);
    const contextEnd = Math.min(text.length, position + 50);
    const context = text.substring(contextStart, contextEnd).toLowerCase();
    
    const personIndicators = [
      'said', 'told', 'asked', 'replied', 'stated', 'explained', 'mentioned',
      'person', 'individual', 'man', 'woman', 'employee', 'worker', 'manager',
      'mr', 'mrs', 'ms', 'dr', 'professor'
    ];
    
    return personIndicators.some(indicator => context.includes(indicator));
  }

  private isValidIssue(text: string): boolean {
    if (!text || text.length < 10 || text.length > 300) return false;
    
    // Check for reasonable word ratio
    const words = text.split(/\s+/).length;
    if (words < 3 || words > 50) return false;
    
    // Filter out non-substantive content
    const nonIssuePatterns = [
      /^\s*(?:see|refer|note|page|paragraph|section|chapter|table|figure)\s/i,
      /^\s*(?:\d+\s*)+$/,
      /^\s*[^\w\s]+\s*$/
    ];
    
    return !nonIssuePatterns.some(pattern => pattern.test(text));
  }

  private categorizeIssue(text: string, defaultType: string): string {
    const lowerText = text.toLowerCase();
    
    // Legal categories
    if (lowerText.match(/\b(contract|agreement|breach|terms|conditions)\b/)) return 'contract';
    if (lowerText.match(/\b(negligence|duty|care|liability|damages)\b/)) return 'tort';
    if (lowerText.match(/\b(employment|work|job|dismissal|discrimination)\b/)) return 'employment';
    if (lowerText.match(/\b(property|land|house|lease|rent)\b/)) return 'property';
    if (lowerText.match(/\b(criminal|crime|guilty|sentence|conviction)\b/)) return 'criminal';
    if (lowerText.match(/\b(family|divorce|custody|child|marriage)\b/)) return 'family';
    
    // General categories
    if (lowerText.match(/\b(money|payment|cost|fee|amount)\b/)) return 'financial';
    if (lowerText.match(/\b(time|date|deadline|schedule)\b/)) return 'procedural';
    if (lowerText.match(/\b(whether|if|question)\b/)) return 'question';
    
    return defaultType;
  }

  private normalizeRole(role: string): string {
    const normalized = role.toLowerCase().trim();
    
    const roleMap: { [key: string]: string } = {
      'solicitor': 'Solicitor',
      'barrister': 'Barrister',
      'counsel': 'Counsel',
      'attorney': 'Attorney',
      'lawyer': 'Lawyer',
      'doctor': 'Doctor',
      'professor': 'Professor',
      'manager': 'Manager',
      'director': 'Director',
      'employee': 'Employee',
      'witness': 'Witness',
      'expert': 'Expert'
    };
    
    return roleMap[normalized] || this.capitalizeFirst(normalized);
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private extractEventFromContext(context: string, keyword: string, date: string): string {
    // Find the sentence containing the keyword
    const sentences = context.split(/[.!?]+/);
    const relevantSentence = sentences.find(s => s.toLowerCase().includes(keyword));
    
    if (relevantSentence && relevantSentence.trim().length < 150) {
      return relevantSentence.trim();
    }
    
    return `${this.capitalizeFirst(keyword)} on ${date}`;
  }

  // Deduplication methods
  private deduplicatePersons(persons: Array<{ name: string; role: string; confidence: number }>): Array<{ name: string; role: string; confidence: number }> {
    const unique: Array<{ name: string; role: string; confidence: number }> = [];
    
    persons.forEach(person => {
      const existing = unique.find(p => 
        this.namesAreSimilar(p.name, person.name)
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

  private deduplicateIssues(issues: Array<{ issue: string; type: string; confidence: number }>): Array<{ issue: string; type: string; confidence: number }> {
    const unique: Array<{ issue: string; type: string; confidence: number }> = [];
    
    issues.forEach(issue => {
      const existing = unique.find(i => 
        this.issuesAreSimilar(i.issue, issue.issue)
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

  private deduplicateEvents(events: Array<{ date: string; event: string; confidence: number }>): Array<{ date: string; event: string; confidence: number }> {
    const unique: Array<{ date: string; event: string; confidence: number }> = [];
    
    events.forEach(event => {
      const existing = unique.find(e => 
        e.date === event.date && this.eventsAreSimilar(e.event, event.event)
      );
      
      if (!existing) {
        unique.push(event);
      } else if (event.confidence > existing.confidence) {
        const index = unique.indexOf(existing);
        unique[index] = event;
      }
    });
    
    return unique;
  }

  private deduplicateAuthorities(authorities: Array<{ citation: string; relevance: string; confidence: number }>): Array<{ citation: string; relevance: string; confidence: number }> {
    const unique: Array<{ citation: string; relevance: string; confidence: number }> = [];
    
    authorities.forEach(authority => {
      const existing = unique.find(a => 
        a.citation.toLowerCase().trim() === authority.citation.toLowerCase().trim()
      );
      
      if (!existing) {
        unique.push(authority);
      }
    });
    
    return unique;
  }

  // Similarity check methods
  private namesAreSimilar(name1: string, name2: string): boolean {
    const n1 = name1.toLowerCase().trim();
    const n2 = name2.toLowerCase().trim();
    
    // Exact match
    if (n1 === n2) return true;
    
    // Check if one name contains the other (for partial matches)
    if (n1.includes(n2) || n2.includes(n1)) return true;
    
    // Check for similar names with different titles
    const cleanName1 = n1.replace(/^(mr\.?|mrs\.?|ms\.?|dr\.?|professor|prof\.?)\s+/i, '');
    const cleanName2 = n2.replace(/^(mr\.?|mrs\.?|ms\.?|dr\.?|professor|prof\.?)\s+/i, '');
    
    return cleanName1 === cleanName2;
  }

  private issuesAreSimilar(issue1: string, issue2: string): boolean {
    const i1 = issue1.toLowerCase().trim();
    const i2 = issue2.toLowerCase().trim();
    
    if (i1 === i2) return true;
    
    // Check for substantial overlap (80% of shorter text)
    const shorter = i1.length < i2.length ? i1 : i2;
    const longer = i1.length >= i2.length ? i1 : i2;
    
    const overlapThreshold = shorter.length * 0.8;
    let overlap = 0;
    
    const shorterWords = shorter.split(/\s+/);
    const longerWords = longer.split(/\s+/);
    
    shorterWords.forEach(word => {
      if (word.length > 3 && longerWords.some(w => w.includes(word))) {
        overlap += word.length;
      }
    });
    
    return overlap >= overlapThreshold;
  }

  private eventsAreSimilar(event1: string, event2: string): boolean {
    const e1 = event1.toLowerCase().trim();
    const e2 = event2.toLowerCase().trim();
    
    // Extract key action words
    const getActionWords = (text: string) => {
      const actionWords = text.match(/\b(meeting|hearing|trial|deadline|signed|delivered|received|occurred|happened|scheduled|planned|filed|completed|started|ended)\b/g);
      return actionWords || [];
    };
    
    const actions1 = getActionWords(e1);
    const actions2 = getActionWords(e2);
    
    return actions1.some(action => actions2.includes(action));
  }

  getStatus() {
    return {
      name: 'General Entity Engine',
      isAvailable: this.isInitialized,
      confidence: 0.85,
      specialties: ['Person names', 'General issues', 'Date extraction', 'Document references']
    };
  }
}

export const generalEntityEngine = new GeneralEntityEngine();