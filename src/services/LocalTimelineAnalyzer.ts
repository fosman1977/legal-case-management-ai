/**
 * Local Timeline Analyzer - Phase 2 Enhanced Local Analysis
 * Temporal pattern analysis to identify gaps, sequences, and chronology issues
 * Generates patterns like: "6-month gap in documentation between contract and performance"
 */

export interface TimelineEvent {
  id: string;
  date: Date;
  description: string;
  documentId: string;
  documentType: string;
  confidence: number;
  eventType: 'contract_date' | 'performance_date' | 'payment_date' | 'correspondence_date' | 
            'delivery_date' | 'termination_date' | 'breach_date' | 'notice_date' | 'other';
  relatedEntities: string[];
  sourceLocation: {
    page?: number;
    line?: number;
    context: string;
  };
}

export interface TimelineGap {
  id: string;
  startDate: Date;
  endDate: Date;
  duration: {
    days: number;
    months: number;
    description: string;
  };
  gapType: 'documentation' | 'activity' | 'correspondence' | 'legal_action' | 'performance';
  significance: 'critical' | 'significant' | 'minor';
  beforeEvent?: TimelineEvent;
  afterEvent?: TimelineEvent;
  potentialIssues: string[];
  anonymousPattern: string;
}

export interface SequenceAnalysis {
  id: string;
  eventSequence: TimelineEvent[];
  sequenceType: 'legal_process' | 'contract_performance' | 'dispute_escalation' | 'payment_cycle';
  isLogical: boolean;
  issues: {
    type: 'out_of_order' | 'impossible_timing' | 'missing_step' | 'concurrent_conflict';
    description: string;
    affectedEvents: string[];
  }[];
  confidence: number;
  anonymousPattern: string;
}

export interface TemporalPattern {
  id: string;
  patternType: 'recurring' | 'seasonal' | 'deadline_driven' | 'escalation' | 'delay';
  frequency?: string;
  events: TimelineEvent[];
  description: string;
  legalSignificance: string;
  anonymousPattern: string;
}

export interface TimelineAnalysisResult {
  timeline: TimelineEvent[];
  gaps: TimelineGap[];
  sequences: SequenceAnalysis[];
  patterns: TemporalPattern[];
  summary: {
    totalEvents: number;
    timespan: {
      start: Date;
      end: Date;
      duration: string;
    };
    criticalGaps: number;
    sequenceIssues: number;
    overallCoherence: number;
  };
  insights: {
    keyFindings: string[];
    riskIndicators: string[];
    strategicConsiderations: string[];
  };
  anonymousPatterns: string[];
  recommendations: string[];
}

/**
 * Advanced timeline analysis engine
 * Identifies temporal patterns, gaps, and chronological issues across documents
 */
export class LocalTimelineAnalyzer {
  private datePatterns = [
    { pattern: /\b(\d{1,2}[\\/\-\.]\d{1,2}[\\/\-\.]\d{2,4})\b/g, type: 'date_slash' },
    { pattern: /\b(\d{1,2}(?:st|nd|rd|th)?\s+\w+\s+\d{4})\b/g, type: 'date_written' },
    { pattern: /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi, type: 'date_month_written' },
    { pattern: /\b(\d{4}[\-\/]\d{1,2}[\-\/]\d{1,2})\b/g, type: 'date_iso' }
  ];

  private eventTypePatterns = {
    contract_date: [
      /(?:executed|signed|agreed|entered into).*?(?:on|dated)\s*([^.]+)/gi,
      /(?:contract|agreement).*?(?:dated|of)\s*([^.]+)/gi
    ],
    performance_date: [
      /(?:performed|delivered|completed).*?(?:on|by)\s*([^.]+)/gi,
      /(?:performance|delivery).*?(?:due|required).*?(?:on|by)\s*([^.]+)/gi
    ],
    payment_date: [
      /(?:paid|payment|remitted).*?(?:on|dated)\s*([^.]+)/gi,
      /(?:due|payable).*?(?:on|by)\s*([^.]+)/gi
    ],
    correspondence_date: [
      /(?:letter|email|correspondence).*?(?:dated|sent).*?([^.]+)/gi,
      /(?:wrote|sent|received).*?(?:on|dated)\s*([^.]+)/gi
    ]
  };

  constructor() {}

  /**
   * Main timeline analysis method
   */
  async analyzeTimeline(documents: any[]): Promise<TimelineAnalysisResult> {
    // Phase 1: Extract all temporal events
    const events = await this.extractTimelineEvents(documents);
    
    // Phase 2: Identify gaps in documentation/activity
    const gaps = await this.identifyTimelineGaps(events);
    
    // Phase 3: Analyze event sequences for logical flow
    const sequences = await this.analyzeEventSequences(events);
    
    // Phase 4: Detect temporal patterns
    const patterns = await this.detectTemporalPatterns(events);
    
    // Phase 5: Generate insights and analysis
    const summary = this.generateTimelineSummary(events, gaps, sequences);
    const insights = this.generateTimelineInsights(events, gaps, sequences, patterns);
    const anonymousPatterns = this.generateAnonymousPatterns(gaps, sequences, patterns);
    const recommendations = this.generateRecommendations(insights, gaps, sequences);

    return {
      timeline: events,
      gaps,
      sequences,
      patterns,
      summary,
      insights,
      anonymousPatterns,
      recommendations
    };
  }

  /**
   * Extract timeline events from documents
   */
  private async extractTimelineEvents(documents: any[]): Promise<TimelineEvent[]> {
    const events: TimelineEvent[] = [];
    
    for (const doc of documents) {
      const text = doc.text || doc.content || '';
      const docType = this.classifyDocument(doc);
      
      // Extract dates using various patterns
      const extractedDates = this.extractDates(text);
      
      for (const dateInfo of extractedDates) {
        // Determine event type based on context
        const eventType = this.determineEventType(dateInfo.context, text);
        
        // Extract related entities from context
        const relatedEntities = this.extractRelatedEntities(dateInfo.context);
        
        const event: TimelineEvent = {
          id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          date: dateInfo.date,
          description: this.generateEventDescription(dateInfo, eventType, docType),
          documentId: doc.id || `doc_${Date.now()}`,
          documentType: docType,
          confidence: dateInfo.confidence,
          eventType,
          relatedEntities,
          sourceLocation: {
            context: dateInfo.context
          }
        };
        
        events.push(event);
      }
    }
    
    // Sort events chronologically
    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Identify significant gaps in timeline
   */
  private async identifyTimelineGaps(events: TimelineEvent[]): Promise<TimelineGap[]> {
    const gaps: TimelineGap[] = [];
    
    if (events.length < 2) return gaps;
    
    for (let i = 0; i < events.length - 1; i++) {
      const currentEvent = events[i];
      const nextEvent = events[i + 1];
      
      const timeDiff = nextEvent.date.getTime() - currentEvent.date.getTime();
      const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      
      // Identify significant gaps (more than 30 days for most cases, 7 days for urgent matters)
      const isSignificantGap = this.isSignificantGap(daysDiff, currentEvent, nextEvent);
      
      if (isSignificantGap) {
        const gap: TimelineGap = {
          id: `gap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          startDate: currentEvent.date,
          endDate: nextEvent.date,
          duration: {
            days: daysDiff,
            months: Math.floor(daysDiff / 30),
            description: this.formatDuration(daysDiff)
          },
          gapType: this.classifyGap(currentEvent, nextEvent),
          significance: this.assessGapSignificance(daysDiff, currentEvent, nextEvent),
          beforeEvent: currentEvent,
          afterEvent: nextEvent,
          potentialIssues: this.identifyPotentialIssues(daysDiff, currentEvent, nextEvent),
          anonymousPattern: this.createGapPattern(daysDiff, currentEvent.eventType, nextEvent.eventType)
        };
        
        gaps.push(gap);
      }
    }
    
    return gaps;
  }

  /**
   * Analyze event sequences for logical flow
   */
  private async analyzeEventSequences(events: TimelineEvent[]): Promise<SequenceAnalysis[]> {
    const sequences: SequenceAnalysis[] = [];
    
    // Group events by type of legal process
    const eventGroups = this.groupEventsByProcess(events);
    
    for (const [processType, processEvents] of Object.entries(eventGroups)) {
      if (processEvents.length < 2) continue;
      
      const sequence: SequenceAnalysis = {
        id: `sequence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        eventSequence: processEvents,
        sequenceType: processType as any,
        isLogical: true,
        issues: [],
        confidence: 0.85,
        anonymousPattern: ''
      };
      
      // Analyze sequence for logical issues
      const issues = this.analyzeSequenceLogic(processEvents, processType);
      sequence.issues = issues;
      sequence.isLogical = issues.length === 0;
      sequence.anonymousPattern = this.createSequencePattern(processType, processEvents, issues);
      
      if (issues.length > 0) {
        sequence.confidence = Math.max(0.6, sequence.confidence - (issues.length * 0.1));
      }
      
      sequences.push(sequence);
    }
    
    return sequences;
  }

  /**
   * Detect temporal patterns in events
   */
  private async detectTemporalPatterns(events: TimelineEvent[]): Promise<TemporalPattern[]> {
    const patterns: TemporalPattern[] = [];
    
    // Detect recurring patterns
    const recurringPatterns = this.detectRecurringPatterns(events);
    patterns.push(...recurringPatterns);
    
    // Detect escalation patterns
    const escalationPatterns = this.detectEscalationPatterns(events);
    patterns.push(...escalationPatterns);
    
    // Detect deadline-driven patterns
    const deadlinePatterns = this.detectDeadlinePatterns(events);
    patterns.push(...deadlinePatterns);
    
    return patterns;
  }

  // Helper methods for timeline analysis

  private extractDates(text: string): any[] {
    const dates = [];
    
    this.datePatterns.forEach(({ pattern, type }) => {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      
      while ((match = regex.exec(text)) !== null) {
        const dateStr = match[1];
        const parsedDate = this.parseDate(dateStr);
        
        if (parsedDate && this.isValidDate(parsedDate)) {
          const context = text.substring(
            Math.max(0, match.index - 50),
            Math.min(text.length, match.index + match[0].length + 50)
          );
          
          dates.push({
            date: parsedDate,
            original: dateStr,
            type,
            context,
            confidence: this.assessDateConfidence(dateStr, context),
            position: match.index
          });
        }
      }
    });
    
    return dates;
  }

  private parseDate(dateStr: string): Date | null {
    try {
      // Handle various date formats
      let parsed = new Date(dateStr);
      
      // Handle DD/MM/YYYY format specifically for UK
      if (dateStr.match(/^\d{1,2}[\\/\-\.]\d{1,2}[\\/\-\.]\d{2,4}$/)) {
        const parts = dateStr.split(/[\\/\-\.]/);
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
          const year = parseInt(parts[2], 10);
          const fullYear = year < 100 ? (year > 50 ? 1900 + year : 2000 + year) : year;
          parsed = new Date(fullYear, month, day);
        }
      }
      
      return isNaN(parsed.getTime()) ? null : parsed;
    } catch {
      return null;
    }
  }

  private isValidDate(date: Date): boolean {
    const now = new Date();
    const hundredYearsAgo = new Date(now.getFullYear() - 100, 0, 1);
    const tenYearsAhead = new Date(now.getFullYear() + 10, 11, 31);
    
    return date >= hundredYearsAgo && date <= tenYearsAhead;
  }

  private assessDateConfidence(dateStr: string, context: string): number {
    let confidence = 0.7;
    
    // Higher confidence for specific formats
    if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) confidence += 0.15;
    if (context.toLowerCase().includes('dated') || context.toLowerCase().includes('signed')) confidence += 0.1;
    if (context.toLowerCase().includes('contract') || context.toLowerCase().includes('agreement')) confidence += 0.05;
    
    return Math.min(0.98, confidence);
  }

  private determineEventType(context: string, fullText: string): TimelineEvent['eventType'] {
    const lowerContext = context.toLowerCase();
    
    if (lowerContext.includes('contract') || lowerContext.includes('agreement') || lowerContext.includes('signed')) {
      return 'contract_date';
    }
    if (lowerContext.includes('payment') || lowerContext.includes('paid') || lowerContext.includes('invoice')) {
      return 'payment_date';
    }
    if (lowerContext.includes('delivered') || lowerContext.includes('performance') || lowerContext.includes('completed')) {
      return 'performance_date';
    }
    if (lowerContext.includes('letter') || lowerContext.includes('correspondence') || lowerContext.includes('email')) {
      return 'correspondence_date';
    }
    if (lowerContext.includes('notice') || lowerContext.includes('notification')) {
      return 'notice_date';
    }
    if (lowerContext.includes('breach') || lowerContext.includes('default')) {
      return 'breach_date';
    }
    if (lowerContext.includes('terminate') || lowerContext.includes('end')) {
      return 'termination_date';
    }
    
    return 'other';
  }

  private extractRelatedEntities(context: string): string[] {
    const entities = [];
    
    // Extract company names
    const companyPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Ltd|Limited|PLC|Corporation|Inc)\b/g;
    let match;
    while ((match = companyPattern.exec(context)) !== null) {
      entities.push(match[0]);
    }
    
    // Extract person names (simple pattern)
    const personPattern = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g;
    while ((match = personPattern.exec(context)) !== null) {
      if (!entities.includes(match[0])) {
        entities.push(match[0]);
      }
    }
    
    return entities.slice(0, 5); // Limit to avoid noise
  }

  private generateEventDescription(dateInfo: any, eventType: string, docType: string): string {
    const eventTypeDesc = {
      'contract_date': 'Contract execution',
      'payment_date': 'Payment transaction',
      'performance_date': 'Performance milestone',
      'correspondence_date': 'Correspondence',
      'delivery_date': 'Delivery event',
      'termination_date': 'Termination',
      'breach_date': 'Breach occurrence',
      'notice_date': 'Notice served',
      'other': 'Legal event'
    };
    
    return `${eventTypeDesc[eventType] || 'Event'} documented in ${docType}`;
  }

  private classifyDocument(doc: any): string {
    const text = (doc.text || doc.content || '').toLowerCase();
    if (text.includes('witness statement')) return 'Witness Statement';
    if (text.includes('contract') || text.includes('agreement')) return 'Contract';
    if (text.includes('invoice')) return 'Invoice';
    if (text.includes('correspondence') || text.includes('letter')) return 'Correspondence';
    if (text.includes('expert report')) return 'Expert Report';
    return 'Document';
  }

  private isSignificantGap(days: number, beforeEvent: TimelineEvent, afterEvent: TimelineEvent): boolean {
    // Different gap thresholds based on event types
    if (beforeEvent.eventType === 'notice_date' && days > 14) return true;
    if (beforeEvent.eventType === 'breach_date' && days > 30) return true;
    if (beforeEvent.eventType === 'contract_date' && days > 60) return true;
    
    // General threshold for significant gaps
    return days > 45;
  }

  private classifyGap(beforeEvent: TimelineEvent, afterEvent: TimelineEvent): TimelineGap['gapType'] {
    if (beforeEvent.documentType !== afterEvent.documentType) return 'documentation';
    if (beforeEvent.eventType === 'correspondence_date' || afterEvent.eventType === 'correspondence_date') return 'correspondence';
    if (beforeEvent.eventType === 'contract_date' && afterEvent.eventType === 'performance_date') return 'performance';
    return 'activity';
  }

  private assessGapSignificance(days: number, beforeEvent: TimelineEvent, afterEvent: TimelineEvent): 'critical' | 'significant' | 'minor' {
    if (days > 180) return 'critical';
    if (days > 90) return 'significant';
    return 'minor';
  }

  private identifyPotentialIssues(days: number, beforeEvent: TimelineEvent, afterEvent: TimelineEvent): string[] {
    const issues = [];
    
    if (days > 180) {
      issues.push('Extended gap may indicate missing documentation');
    }
    if (beforeEvent.eventType === 'breach_date' && days > 60) {
      issues.push('Delayed response to breach may affect legal position');
    }
    if (beforeEvent.eventType === 'notice_date' && days > 30) {
      issues.push('Extended response time to formal notice');
    }
    
    return issues;
  }

  private createGapPattern(days: number, beforeType: string, afterType: string): string {
    const duration = days > 180 ? 'extended' : days > 90 ? 'significant' : 'moderate';
    return `${duration} gap between ${beforeType.replace('_', ' ')} and ${afterType.replace('_', ' ')} events`;
  }

  private formatDuration(days: number): string {
    if (days < 7) return `${days} days`;
    if (days < 30) return `${Math.floor(days / 7)} weeks`;
    if (days < 365) return `${Math.floor(days / 30)} months`;
    return `${Math.floor(days / 365)} years`;
  }

  private groupEventsByProcess(events: TimelineEvent[]): Record<string, TimelineEvent[]> {
    const groups: Record<string, TimelineEvent[]> = {
      'contract_performance': [],
      'dispute_escalation': [],
      'payment_cycle': [],
      'legal_process': []
    };
    
    events.forEach(event => {
      switch (event.eventType) {
        case 'contract_date':
        case 'performance_date':
        case 'delivery_date':
          groups['contract_performance'].push(event);
          break;
        case 'breach_date':
        case 'notice_date':
        case 'termination_date':
          groups['dispute_escalation'].push(event);
          break;
        case 'payment_date':
          groups['payment_cycle'].push(event);
          break;
        default:
          groups['legal_process'].push(event);
      }
    });
    
    return groups;
  }

  private analyzeSequenceLogic(events: TimelineEvent[], processType: string): SequenceAnalysis['issues'] {
    const issues = [];
    
    // Check for logical sequence issues
    for (let i = 0; i < events.length - 1; i++) {
      const current = events[i];
      const next = events[i + 1];
      
      // Check for impossible timing
      if (this.isImpossibleTiming(current, next)) {
        issues.push({
          type: 'impossible_timing',
          description: `${current.eventType} and ${next.eventType} timing appears impossible`,
          affectedEvents: [current.id, next.id]
        });
      }
      
      // Check for logical order issues
      if (this.isOutOfLogicalOrder(current, next, processType)) {
        issues.push({
          type: 'out_of_order',
          description: `Events appear in unexpected chronological order for ${processType}`,
          affectedEvents: [current.id, next.id]
        });
      }
    }
    
    return issues;
  }

  private isImpossibleTiming(event1: TimelineEvent, event2: TimelineEvent): boolean {
    const timeDiff = Math.abs(event2.date.getTime() - event1.date.getTime());
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
    
    // Same day contract execution and performance might be suspicious
    if (event1.eventType === 'contract_date' && event2.eventType === 'performance_date' && daysDiff < 1) {
      return true;
    }
    
    return false;
  }

  private isOutOfLogicalOrder(event1: TimelineEvent, event2: TimelineEvent, processType: string): boolean {
    if (processType === 'contract_performance') {
      // Contract should come before performance
      if (event1.eventType === 'performance_date' && event2.eventType === 'contract_date') {
        return true;
      }
    }
    
    return false;
  }

  private detectRecurringPatterns(events: TimelineEvent[]): TemporalPattern[] {
    // Mock implementation - in real system would detect actual recurring patterns
    return [];
  }

  private detectEscalationPatterns(events: TimelineEvent[]): TemporalPattern[] {
    const escalationEvents = events.filter(e => 
      ['breach_date', 'notice_date', 'correspondence_date'].includes(e.eventType)
    );
    
    if (escalationEvents.length >= 3) {
      return [{
        id: `escalation_${Date.now()}`,
        patternType: 'escalation',
        events: escalationEvents,
        description: 'Escalating dispute pattern detected',
        legalSignificance: 'May indicate deteriorating relationship requiring intervention',
        anonymousPattern: 'Dispute escalation pattern with multiple formal notices'
      }];
    }
    
    return [];
  }

  private detectDeadlinePatterns(events: TimelineEvent[]): TemporalPattern[] {
    // Mock implementation
    return [];
  }

  private createSequencePattern(processType: string, events: TimelineEvent[], issues: any[]): string {
    const hasIssues = issues.length > 0;
    const issueDesc = hasIssues ? 'with chronological inconsistencies' : 'with logical progression';
    return `${processType} sequence ${issueDesc} spanning ${events.length} events`;
  }

  private generateTimelineSummary(events: TimelineEvent[], gaps: TimelineGap[], sequences: SequenceAnalysis[]) {
    if (events.length === 0) {
      return {
        totalEvents: 0,
        timespan: { start: new Date(), end: new Date(), duration: 'No events' },
        criticalGaps: 0,
        sequenceIssues: 0,
        overallCoherence: 0
      };
    }
    
    const sortedEvents = events.sort((a, b) => a.date.getTime() - b.date.getTime());
    const start = sortedEvents[0].date;
    const end = sortedEvents[sortedEvents.length - 1].date;
    const duration = this.formatDuration(Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    
    const criticalGaps = gaps.filter(g => g.significance === 'critical').length;
    const sequenceIssues = sequences.reduce((sum, seq) => sum + seq.issues.length, 0);
    
    const overallCoherence = Math.max(0, 1 - ((criticalGaps * 0.2) + (sequenceIssues * 0.1)));
    
    return {
      totalEvents: events.length,
      timespan: { start, end, duration },
      criticalGaps,
      sequenceIssues,
      overallCoherence
    };
  }

  private generateTimelineInsights(events: TimelineEvent[], gaps: TimelineGap[], sequences: SequenceAnalysis[], patterns: TemporalPattern[]) {
    const keyFindings = [];
    const riskIndicators = [];
    const strategicConsiderations = [];
    
    if (gaps.length > 0) {
      keyFindings.push(`${gaps.length} significant timeline gaps identified`);
      if (gaps.some(g => g.significance === 'critical')) {
        riskIndicators.push('Critical gaps in documentation timeline');
      }
    }
    
    if (sequences.some(s => s.issues.length > 0)) {
      keyFindings.push('Chronological inconsistencies detected in event sequences');
      riskIndicators.push('Timeline logic issues may affect case credibility');
    }
    
    if (patterns.length > 0) {
      keyFindings.push(`${patterns.length} temporal patterns identified`);
      strategicConsiderations.push('Temporal patterns may reveal underlying case dynamics');
    }
    
    return { keyFindings, riskIndicators, strategicConsiderations };
  }

  private generateAnonymousPatterns(gaps: TimelineGap[], sequences: SequenceAnalysis[], patterns: TemporalPattern[]): string[] {
    const anonymousPatterns = [];
    
    gaps.forEach(gap => anonymousPatterns.push(gap.anonymousPattern));
    sequences.forEach(seq => anonymousPatterns.push(seq.anonymousPattern));
    patterns.forEach(pattern => anonymousPatterns.push(pattern.anonymousPattern));
    
    return anonymousPatterns;
  }

  private generateRecommendations(insights: any, gaps: TimelineGap[], sequences: SequenceAnalysis[]): string[] {
    const recommendations = [];
    
    if (gaps.some(g => g.significance === 'critical')) {
      recommendations.push('Investigate critical timeline gaps for missing documentation');
    }
    
    if (sequences.some(s => s.issues.length > 0)) {
      recommendations.push('Verify chronological inconsistencies through additional evidence');
    }
    
    if (insights.riskIndicators.length > 0) {
      recommendations.push('Consider timeline issues in case strategy and risk assessment');
    }
    
    recommendations.push('Create comprehensive chronology for court presentation');
    
    return recommendations;
  }
}

export default LocalTimelineAnalyzer;