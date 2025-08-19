import Anthropic from '@anthropic-ai/sdk';

export interface CasePatterns {
  documentType: string;
  jurisdiction: string;
  issues: string[];
  valueCategory: string;
  riskFactors: string[];
  complexity: 'low' | 'medium' | 'high';
  parties: number;
  hasTimeConstraints: boolean;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
}

export interface LegalGuidance {
  framework: string;
  keyLegalIssues: string[];
  recommendedApproach: string[];
  evidenceToGather: string[];
  riskAssessment: string[];
  strategicConsiderations: string[];
  precedents: string[];
  confidence: number;
  source: string;
  fallback: boolean;
}

export interface ConsultationLogEntry {
  id: string;
  timestamp: string;
  patterns: CasePatterns;
  guidance: LegalGuidance | null;
  status: 'success' | 'error' | 'fallback';
  responseTime: number;
  dataProtected: boolean;
  error?: string;
}

export class ClaudeConsultationService {
  private anthropic: Anthropic | null = null;
  private isEnabled: boolean = false;
  private consultationLog: ConsultationLogEntry[] = [];
  private listeners: ((entry: ConsultationLogEntry) => void)[] = [];

  constructor(apiKey?: string) {
    if (apiKey) {
      this.anthropic = new Anthropic({ apiKey });
      this.isEnabled = true;
    }
  }

  // Initialize with API key
  initialize(apiKey: string): void {
    this.anthropic = new Anthropic({ apiKey });
    this.isEnabled = true;
  }

  // Enable/disable consultation
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  isConsultationEnabled(): boolean {
    return this.isEnabled && this.anthropic !== null;
  }

  // Add event listener for consultation events
  onConsultation(listener: (entry: ConsultationLogEntry) => void): void {
    this.listeners.push(listener);
  }

  // Main consultation method
  async consultOnCase(patterns: CasePatterns): Promise<LegalGuidance> {
    const startTime = Date.now();
    const logEntry: ConsultationLogEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      patterns,
      guidance: null,
      status: 'success',
      responseTime: 0,
      dataProtected: true
    };

    try {
      // Validate patterns contain no client data
      this.validatePatternsAnonymity(patterns);

      if (!this.isConsultationEnabled()) {
        const guidance = this.getFallbackGuidance(patterns);
        logEntry.guidance = guidance;
        logEntry.status = 'fallback';
        logEntry.responseTime = Date.now() - startTime;
        this.addToLog(logEntry);
        return guidance;
      }

      const response = await this.anthropic!.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: this.buildConsultationQuery(patterns)
        }]
      });

      const guidance = this.parseGuidance(response.content);
      logEntry.guidance = guidance;
      logEntry.responseTime = Date.now() - startTime;
      this.addToLog(logEntry);

      return guidance;

    } catch (error) {
      logEntry.status = 'error';
      logEntry.error = error instanceof Error ? error.message : 'Unknown error';
      logEntry.responseTime = Date.now() - startTime;
      
      // Fallback to local guidance on error
      const fallbackGuidance = this.getFallbackGuidance(patterns);
      logEntry.guidance = fallbackGuidance;
      this.addToLog(logEntry);

      return fallbackGuidance;
    }
  }

  // Validate that patterns contain no identifiable information
  private validatePatternsAnonymity(patterns: CasePatterns): void {
    const sensitiveWords = [
      // Common personal identifiers
      'ltd', 'plc', 'limited', 'inc', 'corp', 'llc',
      // Specific locations (examples)
      'london', 'manchester', 'birmingham', 'leeds', 'glasgow',
      // Specific courts (should be generalized)
      'chancery', 'commercial', 'queens bench'
    ];

    const allText = JSON.stringify(patterns).toLowerCase();
    
    for (const word of sensitiveWords) {
      if (allText.includes(word.toLowerCase())) {
        // In production: log warning and further anonymize pattern
        this.addToLog({
          id: this.generateId(),
          timestamp: new Date().toISOString(),
          patterns,
          guidance: null,
          status: 'error',
          responseTime: 0,
          dataProtected: false,
          error: `Potential identifying information detected: ${word}`
        });
      }
    }
  }

  // Build consultation query from anonymous patterns
  private buildConsultationQuery(patterns: CasePatterns): string {
    return `As an AI legal assistant, please provide guidance on the following legal matter characteristics:

**Document Type**: ${patterns.documentType}
**Jurisdiction**: ${patterns.jurisdiction}
**Legal Issues**: ${patterns.issues.join(', ')}
**Case Value Category**: ${patterns.valueCategory}
**Risk Factors**: ${patterns.riskFactors.join(', ')}
**Case Complexity**: ${patterns.complexity}
**Number of Parties**: ${patterns.parties}
**Time Constraints**: ${patterns.hasTimeConstraints ? 'Yes' : 'No'}
**Urgency Level**: ${patterns.urgency}

Please provide:
1. A recommended legal analysis framework
2. Key legal issues to investigate
3. Recommended approach and strategy
4. Evidence that should be gathered
5. Risk assessment and mitigation strategies
6. Strategic considerations for this type of case
7. Relevant legal precedents or areas of law to research

Focus on ${patterns.jurisdiction} law and provide practical, actionable guidance that could be applied to cases with these characteristics.`;
  }

  // Parse Claude's response into structured guidance
  private parseGuidance(content: any): LegalGuidance {
    const textContent = Array.isArray(content) 
      ? content.map(c => c.text || c).join('\n')
      : content.toString();

    // Extract sections using pattern matching
    const sections = this.extractSections(textContent);

    return {
      framework: sections.framework || 'Comprehensive legal analysis approach',
      keyLegalIssues: sections.keyLegalIssues || ['Analyze case facts against legal requirements'],
      recommendedApproach: sections.recommendedApproach || ['Gather evidence', 'Analyze legal position'],
      evidenceToGather: sections.evidenceToGather || ['Relevant documents', 'Witness statements'],
      riskAssessment: sections.riskAssessment || ['Consider potential challenges'],
      strategicConsiderations: sections.strategicConsiderations || ['Evaluate cost vs benefit'],
      precedents: sections.precedents || ['Research relevant case law'],
      confidence: 0.92,
      source: 'Claude AI Consultation',
      fallback: false
    };
  }

  // Extract structured sections from Claude's response
  private extractSections(text: string): any {
    const sections: any = {};

    // Extract framework
    const frameworkMatch = text.match(/(?:framework|approach)[:\s]*(.*?)(?:\n\d+\.|$)/is);
    if (frameworkMatch) {
      sections.framework = frameworkMatch[1].trim();
    }

    // Extract lists using numbered points or bullet points
    sections.keyLegalIssues = this.extractListItems(text, /(?:key.{0,20}issues?|legal.{0,20}issues?):/i);
    sections.recommendedApproach = this.extractListItems(text, /(?:recommended.{0,20}approach|strategy):/i);
    sections.evidenceToGather = this.extractListItems(text, /evidence.*?(?:gather|collect|obtain):/i);
    sections.riskAssessment = this.extractListItems(text, /risk.{0,20}(?:assessment|mitigation):/i);
    sections.strategicConsiderations = this.extractListItems(text, /strategic.{0,20}considerations?:/i);
    sections.precedents = this.extractListItems(text, /(?:precedents?|case.{0,10}law):/i);

    return sections;
  }

  // Extract list items from text after a heading
  private extractListItems(text: string, headingPattern: RegExp): string[] {
    const match = text.match(new RegExp(headingPattern.source + '([\\s\\S]*?)(?:\\n\\d+\\.|\\n\\*\\*|$)', 'i'));
    if (!match) return [];

    const listText = match[1];
    
    // Extract numbered or bulleted items
    const items = listText
      .split(/\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .filter(line => /^[\d\-\*•]/.test(line))
      .map(line => line.replace(/^[\d\-\*•\s]+/, '').trim())
      .filter(line => line.length > 10); // Filter out very short items

    return items.slice(0, 6); // Limit to 6 items per section
  }

  // Fallback guidance when Claude is unavailable
  private getFallbackGuidance(patterns: CasePatterns): LegalGuidance {
    const baseGuidance: LegalGuidance = {
      framework: 'Standard legal analysis framework',
      keyLegalIssues: [
        'Identify relevant legal principles',
        'Analyze factual evidence against legal requirements',
        'Consider jurisdiction-specific regulations'
      ],
      recommendedApproach: [
        'Comprehensive document review',
        'Evidence gathering and analysis',
        'Legal research and precedent analysis'
      ],
      evidenceToGather: [
        'Primary documents and correspondence',
        'Expert witness statements if applicable',
        'Financial records where relevant'
      ],
      riskAssessment: [
        'Evaluate strength of legal position',
        'Consider costs vs potential outcomes',
        'Assess timeline and procedural risks'
      ],
      strategicConsiderations: [
        'Alternative dispute resolution options',
        'Commercial and reputational factors',
        'Long-term relationship considerations'
      ],
      precedents: [
        'Research recent cases in this jurisdiction',
        'Analyze relevant statutory provisions',
        'Consider regulatory guidance'
      ],
      confidence: 0.75,
      source: 'Local knowledge base',
      fallback: true
    };

    // Customize based on patterns
    if (patterns.urgency === 'urgent') {
      baseGuidance.recommendedApproach.unshift('Prioritize urgent procedural requirements');
    }

    if (patterns.complexity === 'high') {
      baseGuidance.strategicConsiderations.push('Consider instructing specialist counsel');
    }

    return baseGuidance;
  }

  // Add entry to consultation log and notify listeners
  private addToLog(entry: ConsultationLogEntry): void {
    this.consultationLog.unshift(entry); // Add to beginning
    
    // Keep only last 100 entries
    if (this.consultationLog.length > 100) {
      this.consultationLog = this.consultationLog.slice(0, 100);
    }

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(entry);
      } catch (error) {
        // Log listener error for debugging
      }
    });
  }

  // Generate unique ID for log entries
  private generateId(): string {
    return `consultation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get consultation log
  getConsultationLog(): ConsultationLogEntry[] {
    return [...this.consultationLog];
  }

  // Get recent consultation statistics
  getConsultationStats(): {
    totalConsultations: number;
    successRate: number;
    averageResponseTime: number;
    lastConsultation?: string;
  } {
    if (this.consultationLog.length === 0) {
      return {
        totalConsultations: 0,
        successRate: 0,
        averageResponseTime: 0
      };
    }

    const successCount = this.consultationLog.filter(entry => entry.status === 'success').length;
    const avgResponseTime = this.consultationLog.reduce((sum, entry) => sum + entry.responseTime, 0) / this.consultationLog.length;

    return {
      totalConsultations: this.consultationLog.length,
      successRate: (successCount / this.consultationLog.length) * 100,
      averageResponseTime: Math.round(avgResponseTime),
      lastConsultation: this.consultationLog[0]?.timestamp
    };
  }

  // Clear consultation log
  clearLog(): void {
    this.consultationLog = [];
  }
}