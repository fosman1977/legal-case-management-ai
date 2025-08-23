/**
 * Local Contradiction Detector - Phase 2 Enhanced Local Analysis
 * Semantic analysis to find conflicts between documents
 * Generates patterns like: "Timeline conflict between witness statement and contract"
 */

export interface ContradictionType {
  type: 'timeline' | 'factual' | 'financial' | 'procedural' | 'witness' | 'legal';
  severity: 'critical' | 'significant' | 'minor';
  confidence: number;
}

export interface ContradictionEvidence {
  documentId: string;
  documentType: string;
  location: {
    page?: number;
    line?: number;
    context: string;
  };
  statement: string;
  confidence: number;
}

export interface DetectedContradiction {
  id: string;
  type: ContradictionType;
  title: string;
  description: string;
  evidence: ContradictionEvidence[];
  impact: {
    legalSignificance: 'high' | 'medium' | 'low';
    strategicImplications: string[];
    recommendedActions: string[];
  };
  anonymousPattern: string;
  confidence: number;
  detectedAt: Date;
}

export interface ContradictionAnalysisResult {
  contradictions: DetectedContradiction[];
  summary: {
    totalContradictions: number;
    criticalContradictions: number;
    timelineConflicts: number;
    factualDisputes: number;
    overallRiskScore: number;
  };
  anonymousPatterns: string[];
  recommendations: string[];
}

/**
 * Advanced contradiction detection engine
 * Finds conflicts, inconsistencies, and disputes across multiple documents
 */
export class LocalContradictionDetector {
  private contradictionPatterns = {
    timeline: [
      { pattern: /(?:on|dated|executed on)\s+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/gi, type: 'date_reference' },
      { pattern: /(?:before|after|prior to|following)\s+(.*?)\s+(?:on|dated)/gi, type: 'sequence_reference' },
      { pattern: /(?:received|sent|delivered|signed)\s+(?:on|at)\s+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/gi, type: 'action_date' }
    ],
    
    financial: [
      { pattern: /(?:amount|sum|total|payment)\s+(?:of|was|is)\s+£([\d,]+(?:\.\d{2})?)/gi, type: 'amount_stated' },
      { pattern: /(?:paid|received|transferred)\s+£([\d,]+(?:\.\d{2})?)/gi, type: 'amount_transacted' },
      { pattern: /(?:owing|owed|due)\s+£([\d,]+(?:\.\d{2})?)/gi, type: 'amount_owed' }
    ],
    
    factual: [
      { pattern: /(?:states|confirms|alleges|claims)\s+that\s+(.*?)(?:\.|,|;)/gi, type: 'statement' },
      { pattern: /(?:denies|disputes|refutes|contradicts)\s+(.*?)(?:\.|,|;)/gi, type: 'denial' },
      { pattern: /(?:witness|party|claimant|defendant)\s+(.*?)\s+(?:states|confirms)/gi, type: 'witness_statement' }
    ]
  };

  constructor() {}

  /**
   * Main contradiction detection method
   */
  async detectContradictions(documents: any[]): Promise<ContradictionAnalysisResult> {
    const contradictions: DetectedContradiction[] = [];
    
    // Phase 1: Extract structured information from each document
    const documentAnalysis = await this.analyzeDocuments(documents);
    
    // Phase 2: Cross-document contradiction detection
    const timelineContradictions = await this.detectTimelineContradictions(documentAnalysis);
    const factualContradictions = await this.detectFactualContradictions(documentAnalysis);
    const financialContradictions = await this.detectFinancialContradictions(documentAnalysis);
    const witnessContradictions = await this.detectWitnessContradictions(documentAnalysis);
    
    contradictions.push(
      ...timelineContradictions,
      ...factualContradictions,
      ...financialContradictions,
      ...witnessContradictions
    );

    // Phase 3: Generate summary and anonymous patterns
    const summary = this.generateSummary(contradictions);
    const anonymousPatterns = this.generateAnonymousPatterns(contradictions);
    const recommendations = this.generateRecommendations(contradictions);

    return {
      contradictions,
      summary,
      anonymousPatterns,
      recommendations
    };
  }

  /**
   * Analyze individual documents for structured information
   */
  private async analyzeDocuments(documents: any[]): Promise<any[]> {
    const analyses = [];
    
    for (const doc of documents) {
      const analysis = {
        id: doc.id || `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: this.classifyDocument(doc),
        dates: this.extractDates(doc.text || doc.content || ''),
        amounts: this.extractAmounts(doc.text || doc.content || ''),
        statements: this.extractStatements(doc.text || doc.content || ''),
        parties: this.extractParties(doc.text || doc.content || ''),
        text: doc.text || doc.content || '',
        metadata: doc.metadata || {}
      };
      analyses.push(analysis);
    }
    
    return analyses;
  }

  /**
   * Detect timeline contradictions between documents
   */
  private async detectTimelineContradictions(analyses: any[]): Promise<DetectedContradiction[]> {
    const contradictions: DetectedContradiction[] = [];
    
    // Compare dates across documents
    for (let i = 0; i < analyses.length; i++) {
      for (let j = i + 1; j < analyses.length; j++) {
        const doc1 = analyses[i];
        const doc2 = analyses[j];
        
        // Check for conflicting dates for same events
        const conflicts = this.findDateConflicts(doc1, doc2);
        
        for (const conflict of conflicts) {
          contradictions.push({
            id: `timeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: {
              type: 'timeline',
              severity: this.assessTimelineSeverity(conflict),
              confidence: conflict.confidence
            },
            title: `Timeline Conflict: ${conflict.eventType}`,
            description: `Conflicting dates found for ${conflict.eventType} between ${doc1.type} and ${doc2.type}`,
            evidence: [
              {
                documentId: doc1.id,
                documentType: doc1.type,
                location: { context: conflict.doc1Context },
                statement: conflict.doc1Statement,
                confidence: 0.85
              },
              {
                documentId: doc2.id,
                documentType: doc2.type,
                location: { context: conflict.doc2Context },
                statement: conflict.doc2Statement,
                confidence: 0.85
              }
            ],
            impact: {
              legalSignificance: this.assessLegalSignificance(conflict),
              strategicImplications: [
                'Timeline inconsistencies may affect credibility',
                'May require clarification through witness statements',
                'Could impact limitation period calculations'
              ],
              recommendedActions: [
                'Verify correct dates through additional documentation',
                'Prepare explanation for timeline discrepancies',
                'Consider chronology of events in case strategy'
              ]
            },
            anonymousPattern: this.createTimelinePattern(conflict),
            confidence: conflict.confidence,
            detectedAt: new Date()
          });
        }
      }
    }
    
    return contradictions;
  }

  /**
   * Detect factual contradictions in statements
   */
  private async detectFactualContradictions(analyses: any[]): Promise<DetectedContradiction[]> {
    const contradictions: DetectedContradiction[] = [];
    
    // Compare factual statements across documents
    for (let i = 0; i < analyses.length; i++) {
      for (let j = i + 1; j < analyses.length; j++) {
        const doc1 = analyses[i];
        const doc2 = analyses[j];
        
        const factualConflicts = this.findFactualConflicts(doc1, doc2);
        
        for (const conflict of factualConflicts) {
          contradictions.push({
            id: `factual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: {
              type: 'factual',
              severity: 'significant',
              confidence: conflict.confidence
            },
            title: `Factual Contradiction: ${conflict.topic}`,
            description: `Conflicting statements about ${conflict.topic} between documents`,
            evidence: conflict.evidence,
            impact: {
              legalSignificance: 'high',
              strategicImplications: [
                'Factual disputes require resolution',
                'May need expert evidence or witness testimony',
                'Could affect case strength and settlement position'
              ],
              recommendedActions: [
                'Investigate source of factual discrepancy',
                'Gather supporting evidence for preferred version',
                'Consider implications for case narrative'
              ]
            },
            anonymousPattern: `Factual contradiction pattern: ${conflict.category} dispute between document types`,
            confidence: conflict.confidence,
            detectedAt: new Date()
          });
        }
      }
    }
    
    return contradictions;
  }

  /**
   * Detect financial contradictions and discrepancies
   */
  private async detectFinancialContradictions(analyses: any[]): Promise<DetectedContradiction[]> {
    const contradictions: DetectedContradiction[] = [];
    
    // Compare financial amounts across documents
    const financialData = this.extractFinancialData(analyses);
    const conflicts = this.findFinancialConflicts(financialData);
    
    for (const conflict of conflicts) {
      contradictions.push({
        id: `financial_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: {
          type: 'financial',
          severity: 'critical',
          confidence: conflict.confidence
        },
        title: `Financial Discrepancy: ${conflict.category}`,
        description: conflict.description,
        evidence: conflict.evidence,
        impact: {
          legalSignificance: 'high',
          strategicImplications: [
            'Financial discrepancies may indicate calculation errors',
            'Could affect quantum of damages claim',
            'May require forensic accounting review'
          ],
          recommendedActions: [
            'Verify calculations and source figures',
            'Obtain clarification on financial methodology',
            'Consider expert financial evidence'
          ]
        },
        anonymousPattern: `Financial contradiction pattern: Amount discrepancy in ${conflict.category}`,
        confidence: conflict.confidence,
        detectedAt: new Date()
      });
    }
    
    return contradictions;
  }

  /**
   * Detect witness statement contradictions
   */
  private async detectWitnessContradictions(analyses: any[]): Promise<DetectedContradiction[]> {
    const contradictions: DetectedContradiction[] = [];
    
    // Find witness statements across documents
    const witnessStatements = this.extractWitnessStatements(analyses);
    const conflicts = this.findWitnessConflicts(witnessStatements);
    
    for (const conflict of conflicts) {
      contradictions.push({
        id: `witness_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: {
          type: 'witness',
          severity: 'significant',
          confidence: conflict.confidence
        },
        title: `Witness Statement Conflict`,
        description: conflict.description,
        evidence: conflict.evidence,
        impact: {
          legalSignificance: 'medium',
          strategicImplications: [
            'Witness credibility may be questioned',
            'Requires clarification in examination',
            'May affect weight of evidence'
          ],
          recommendedActions: [
            'Clarify witness accounts through additional questioning',
            'Consider corroborating evidence',
            'Assess impact on witness credibility'
          ]
        },
        anonymousPattern: `Witness contradiction pattern: Conflicting accounts of same event`,
        confidence: conflict.confidence,
        detectedAt: new Date()
      });
    }
    
    return contradictions;
  }

  // Helper methods for document analysis
  private classifyDocument(doc: any): string {
    const text = (doc.text || doc.content || '').toLowerCase();
    if (text.includes('witness statement')) return 'Witness Statement';
    if (text.includes('contract') || text.includes('agreement')) return 'Contract';
    if (text.includes('invoice')) return 'Invoice';
    if (text.includes('correspondence') || text.includes('letter')) return 'Correspondence';
    if (text.includes('expert report')) return 'Expert Report';
    return 'Document';
  }

  private extractDates(text: string): any[] {
    const dates = [];
    const datePatterns = [
      /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g,
      /\b\d{1,2}(?:st|nd|rd|th)?\s+\w+\s+\d{4}\b/g
    ];

    datePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const context = text.substring(
          Math.max(0, match.index - 30),
          Math.min(text.length, match.index + match[0].length + 30)
        );
        dates.push({
          date: match[0],
          context,
          position: match.index
        });
      }
    });

    return dates;
  }

  private extractAmounts(text: string): any[] {
    const amounts = [];
    const amountPattern = /£([\d,]+(?:\.\d{2})?)/g;
    
    let match;
    while ((match = amountPattern.exec(text)) !== null) {
      const context = text.substring(
        Math.max(0, match.index - 40),
        Math.min(text.length, match.index + match[0].length + 40)
      );
      amounts.push({
        amount: match[0],
        value: parseFloat(match[1].replace(/,/g, '')),
        context,
        position: match.index
      });
    }

    return amounts;
  }

  private extractStatements(text: string): any[] {
    const statements = [];
    const statementPattern = /(?:states|confirms|alleges|claims)\s+that\s+(.*?)(?:\.|,|;)/gi;
    
    let match;
    while ((match = statementPattern.exec(text)) !== null) {
      statements.push({
        statement: match[1],
        context: match[0],
        position: match.index
      });
    }

    return statements;
  }

  private extractParties(text: string): any[] {
    const parties = [];
    const partyPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Ltd|Limited|PLC|Corporation|Inc)\b/g;
    
    let match;
    while ((match = partyPattern.exec(text)) !== null) {
      parties.push({
        name: match[0],
        position: match.index
      });
    }

    return parties;
  }

  // Conflict detection helper methods
  private findDateConflicts(doc1: any, doc2: any): any[] {
    const conflicts = [];
    
    // Simple mock implementation - in production would use sophisticated date comparison
    if (doc1.dates.length > 0 && doc2.dates.length > 0) {
      conflicts.push({
        eventType: 'Contract Execution',
        doc1Statement: doc1.dates[0].context,
        doc2Statement: doc2.dates[0].context,
        doc1Context: doc1.dates[0].context,
        doc2Context: doc2.dates[0].context,
        confidence: 0.78
      });
    }
    
    return conflicts;
  }

  private findFactualConflicts(doc1: any, doc2: any): any[] {
    return []; // Mock implementation
  }

  private extractFinancialData(analyses: any[]): any {
    return { conflicts: [] }; // Mock implementation
  }

  private findFinancialConflicts(financialData: any): any[] {
    return []; // Mock implementation
  }

  private extractWitnessStatements(analyses: any[]): any[] {
    return []; // Mock implementation
  }

  private findWitnessConflicts(witnessStatements: any[]): any[] {
    return []; // Mock implementation
  }

  private assessTimelineSeverity(conflict: any): 'critical' | 'significant' | 'minor' {
    return 'significant';
  }

  private assessLegalSignificance(conflict: any): 'high' | 'medium' | 'low' {
    return 'medium';
  }

  private createTimelinePattern(conflict: any): string {
    return `Timeline contradiction pattern: ${conflict.eventType} date discrepancy between document types`;
  }

  private generateSummary(contradictions: DetectedContradiction[]): ContradictionAnalysisResult['summary'] {
    return {
      totalContradictions: contradictions.length,
      criticalContradictions: contradictions.filter(c => c.type.severity === 'critical').length,
      timelineConflicts: contradictions.filter(c => c.type.type === 'timeline').length,
      factualDisputes: contradictions.filter(c => c.type.type === 'factual').length,
      overallRiskScore: Math.min(1.0, contradictions.length * 0.1)
    };
  }

  private generateAnonymousPatterns(contradictions: DetectedContradiction[]): string[] {
    return contradictions.map(c => c.anonymousPattern);
  }

  private generateRecommendations(contradictions: DetectedContradiction[]): string[] {
    const recommendations = [];
    
    if (contradictions.length > 5) {
      recommendations.push('High number of contradictions detected - comprehensive review recommended');
    }
    
    if (contradictions.some(c => c.type.type === 'timeline')) {
      recommendations.push('Timeline conflicts require chronology verification');
    }
    
    if (contradictions.some(c => c.type.type === 'financial')) {
      recommendations.push('Financial discrepancies may require expert analysis');
    }
    
    return recommendations;
  }
}

export default LocalContradictionDetector;