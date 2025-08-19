import { CasePatterns } from './claudeConsultationService';

export interface DocumentAnalysis {
  documentType: string;
  wordCount: number;
  sections: string[];
  keyTerms: string[];
  entities: string[];
  dateReferences: number;
  monetaryValues: string[];
}

export class PatternExtractionService {
  
  // Main method to extract anonymous patterns from case data
  async extractPatterns(caseData: string, caseMetadata?: any): Promise<CasePatterns> {
    // Analyze document structure and content
    const analysis = await this.analyzeDocument(caseData);
    
    return {
      documentType: await this.classifyDocument(analysis, caseData),
      jurisdiction: await this.identifyJurisdiction(caseData, caseMetadata),
      issues: await this.extractLegalIssues(analysis, caseData),
      valueCategory: await this.categorizeValue(analysis, caseData),
      riskFactors: await this.identifyRisks(analysis, caseData),
      complexity: await this.assessComplexity(analysis, caseData),
      parties: await this.countParties(analysis, caseData),
      hasTimeConstraints: await this.detectTimeConstraints(caseData),
      urgency: await this.assessUrgency(caseData, caseMetadata)
    };
  }

  // Analyze document structure and extract basic information
  private async analyzeDocument(caseData: string): Promise<DocumentAnalysis> {
    const text = caseData.toLowerCase();
    
    return {
      documentType: 'unknown',
      wordCount: text.split(/\s+/).length,
      sections: this.extractSections(caseData),
      keyTerms: this.extractKeyTerms(text),
      entities: this.extractEntities(caseData),
      dateReferences: this.countDateReferences(caseData),
      monetaryValues: this.extractMonetaryValues(caseData)
    };
  }

  // Classify document type based on content and structure
  private async classifyDocument(analysis: DocumentAnalysis, caseData: string): Promise<string> {
    const text = caseData.toLowerCase();
    
    // Contract documents
    if (this.hasContractTerms(text)) {
      if (text.includes('employment') || text.includes('employee') || text.includes('employer')) {
        return 'Employment Contract';
      }
      if (text.includes('supply') || text.includes('goods') || text.includes('services')) {
        return 'Commercial Supply Agreement';
      }
      if (text.includes('lease') || text.includes('rent') || text.includes('tenancy')) {
        return 'Property Lease Agreement';
      }
      return 'Commercial Contract';
    }

    // Litigation documents
    if (this.hasLitigationTerms(text)) {
      if (text.includes('employment tribunal') || text.includes('unfair dismissal')) {
        return 'Employment Tribunal Case';
      }
      if (text.includes('commercial') || text.includes('breach of contract')) {
        return 'Commercial Dispute';
      }
      if (text.includes('personal injury') || text.includes('negligence')) {
        return 'Personal Injury Claim';
      }
      return 'Civil Litigation';
    }

    // Property documents
    if (text.includes('property') || text.includes('land') || text.includes('conveyancing')) {
      return 'Property Transaction';
    }

    // Family law
    if (text.includes('divorce') || text.includes('custody') || text.includes('matrimonial')) {
      return 'Family Law Matter';
    }

    // Criminal law
    if (text.includes('criminal') || text.includes('prosecution') || text.includes('defendant')) {
      return 'Criminal Law Case';
    }

    // Corporate documents
    if (text.includes('merger') || text.includes('acquisition') || text.includes('corporate')) {
      return 'Corporate Transaction';
    }

    return 'Legal Document';
  }

  // Identify jurisdiction based on legal terms and references
  private async identifyJurisdiction(caseData: string, metadata?: any): Promise<string> {
    if (metadata?.jurisdiction) {
      return metadata.jurisdiction;
    }

    const text = caseData.toLowerCase();
    
    // UK jurisdictions
    if (text.includes('england and wales') || text.includes('english law')) {
      return 'England & Wales';
    }
    if (text.includes('scotland') || text.includes('scottish law')) {
      return 'Scotland';
    }
    if (text.includes('northern ireland')) {
      return 'Northern Ireland';
    }

    // UK courts
    if (text.includes('high court') || text.includes('court of appeal') || text.includes('supreme court')) {
      return 'England & Wales';
    }

    // EU references
    if (text.includes('european union') || text.includes('eu law') || text.includes('ecj')) {
      return 'European Union';
    }

    // US references
    if (text.includes('united states') || text.includes('us law') || text.includes('federal court')) {
      return 'United States';
    }

    // Default to England & Wales for UK-based system
    return 'England & Wales';
  }

  // Extract legal issues from the document
  private async extractLegalIssues(analysis: DocumentAnalysis, caseData: string): Promise<string[]> {
    const text = caseData.toLowerCase();
    const issues: string[] = [];

    // Contract issues
    if (text.includes('breach')) issues.push('Breach of contract');
    if (text.includes('termination') && !text.includes('employment termination')) issues.push('Contract termination');
    if (text.includes('force majeure')) issues.push('Force majeure');
    if (text.includes('penalty') || text.includes('liquidated damages')) issues.push('Penalty clause');

    // Employment issues
    if (text.includes('unfair dismissal')) issues.push('Unfair dismissal');
    if (text.includes('discrimination')) issues.push('Discrimination');
    if (text.includes('redundancy')) issues.push('Redundancy');
    if (text.includes('notice period')) issues.push('Notice period');

    // Property issues
    if (text.includes('possession') && text.includes('property')) issues.push('Property possession');
    if (text.includes('repair') && text.includes('landlord')) issues.push('Repair obligations');

    // Negligence issues
    if (text.includes('negligence')) issues.push('Professional negligence');
    if (text.includes('duty of care')) issues.push('Duty of care');

    // Commercial issues
    if (text.includes('delivery') && text.includes('late')) issues.push('Late delivery');
    if (text.includes('quality') && text.includes('defect')) issues.push('Quality defects');
    if (text.includes('payment') && text.includes('late')) issues.push('Late payment');

    // Intellectual property
    if (text.includes('trademark') || text.includes('copyright') || text.includes('patent')) {
      issues.push('Intellectual property');
    }

    // If no specific issues found, add generic ones based on document type
    if (issues.length === 0) {
      if (analysis.documentType.includes('Contract')) {
        issues.push('Contract interpretation', 'Performance obligations');
      } else if (analysis.documentType.includes('Dispute')) {
        issues.push('Liability assessment', 'Damages calculation');
      }
    }

    return issues.slice(0, 5); // Limit to 5 issues
  }

  // Categorize case value based on monetary references
  private async categorizeValue(analysis: DocumentAnalysis, caseData: string): Promise<string> {
    const values = analysis.monetaryValues;
    
    if (values.length === 0) {
      return 'Unspecified value';
    }

    // Extract maximum numerical value
    const amounts = values.map(val => {
      const match = val.match(/[\d,]+/);
      return match ? parseInt(match[0].replace(/,/g, '')) : 0;
    });

    const maxAmount = Math.max(...amounts);

    if (maxAmount >= 1000000) return 'High value (£1M+)';
    if (maxAmount >= 100000) return 'Substantial (£100K+)';
    if (maxAmount >= 10000) return 'Medium (£10K+)';
    if (maxAmount >= 1000) return 'Small claims (£1K+)';
    
    return 'Low value (Under £1K)';
  }

  // Identify risk factors
  private async identifyRisks(analysis: DocumentAnalysis, caseData: string): Promise<string[]> {
    const text = caseData.toLowerCase();
    const risks: string[] = [];

    // Time-related risks
    if (text.includes('urgent') || text.includes('deadline')) {
      risks.push('Time-critical deadlines');
    }
    if (text.includes('limitation') && text.includes('period')) {
      risks.push('Limitation period concerns');
    }

    // Financial risks
    if (text.includes('high value') || analysis.monetaryValues.length > 3) {
      risks.push('Significant financial exposure');
    }
    if (text.includes('costs') && text.includes('liability')) {
      risks.push('Adverse costs liability');
    }

    // Evidential risks
    if (text.includes('witness') && text.includes('unavailable')) {
      risks.push('Key witness unavailability');
    }
    if (text.includes('document') && text.includes('missing')) {
      risks.push('Missing critical documents');
    }

    // Procedural risks
    if (text.includes('complex') && text.includes('procedure')) {
      risks.push('Complex procedural requirements');
    }
    if (text.includes('multi-jurisdictional') || text.includes('cross-border')) {
      risks.push('Multi-jurisdictional complexity');
    }

    // Reputational risks
    if (text.includes('media') || text.includes('publicity')) {
      risks.push('Reputational exposure');
    }

    // Regulatory risks
    if (text.includes('regulatory') || text.includes('compliance')) {
      risks.push('Regulatory compliance issues');
    }

    return risks.slice(0, 4); // Limit to 4 risk factors
  }

  // Assess case complexity
  private async assessComplexity(analysis: DocumentAnalysis, caseData: string): Promise<'low' | 'medium' | 'high'> {
    let complexityScore = 0;

    // Word count factor
    if (analysis.wordCount > 10000) complexityScore += 2;
    else if (analysis.wordCount > 5000) complexityScore += 1;

    // Number of sections
    if (analysis.sections.length > 10) complexityScore += 2;
    else if (analysis.sections.length > 5) complexityScore += 1;

    // Legal terminology density
    if (analysis.keyTerms.length > 20) complexityScore += 2;
    else if (analysis.keyTerms.length > 10) complexityScore += 1;

    // Multiple parties
    const partyCount = await this.countParties(analysis, caseData);
    if (partyCount > 3) complexityScore += 2;
    else if (partyCount > 2) complexityScore += 1;

    // Specific complexity indicators
    const text = caseData.toLowerCase();
    if (text.includes('multi-jurisdictional')) complexityScore += 2;
    if (text.includes('class action') || text.includes('group litigation')) complexityScore += 2;
    if (text.includes('expert evidence') || text.includes('technical evidence')) complexityScore += 1;
    if (text.includes('international') && text.includes('law')) complexityScore += 1;

    if (complexityScore >= 6) return 'high';
    if (complexityScore >= 3) return 'medium';
    return 'low';
  }

  // Count number of parties (anonymized)
  private async countParties(analysis: DocumentAnalysis, caseData: string): Promise<number> {
    const text = caseData.toLowerCase();
    
    // Count party references
    let partyCount = 0;
    
    if (text.includes('claimant') || text.includes('plaintiff')) partyCount++;
    if (text.includes('defendant')) partyCount++;
    if (text.includes('third party')) partyCount++;
    if (text.includes('intervener')) partyCount++;
    
    // Contract parties
    if (text.includes('buyer') && text.includes('seller')) partyCount = Math.max(partyCount, 2);
    if (text.includes('landlord') && text.includes('tenant')) partyCount = Math.max(partyCount, 2);
    if (text.includes('employer') && text.includes('employee')) partyCount = Math.max(partyCount, 2);

    // Count "party" references
    const partyMatches = text.match(/\bparty\b/g);
    if (partyMatches && partyMatches.length > partyCount) {
      partyCount = Math.min(partyMatches.length, 6); // Cap at 6
    }

    return Math.max(partyCount, 2); // Minimum 2 parties
  }

  // Detect time constraints
  private async detectTimeConstraints(caseData: string): Promise<boolean> {
    const text = caseData.toLowerCase();
    
    return text.includes('deadline') || 
           text.includes('time limit') || 
           text.includes('urgent') ||
           text.includes('limitation period') ||
           text.includes('time of the essence') ||
           text.includes('immediate') ||
           /\d+\s*days?\s*notice/.test(text);
  }

  // Assess urgency level
  private async assessUrgency(caseData: string, metadata?: any): Promise<'low' | 'medium' | 'high' | 'urgent'> {
    const text = caseData.toLowerCase();
    
    if (metadata?.urgency) {
      return metadata.urgency;
    }

    // Urgent indicators
    if (text.includes('injunction') || text.includes('urgent application')) return 'urgent';
    if (text.includes('immediate') && text.includes('action required')) return 'urgent';
    
    // High urgency
    if (text.includes('deadline') && text.includes('tomorrow')) return 'urgent';
    if (text.includes('limitation') && text.includes('expires')) return 'high';
    
    // Medium urgency
    if (text.includes('soon') || text.includes('priority')) return 'medium';
    if (/\d+\s*days?\s*remaining/.test(text)) return 'medium';
    
    return 'low';
  }

  // Helper methods for pattern recognition

  private hasContractTerms(text: string): boolean {
    const contractTerms = [
      'agreement', 'contract', 'clause', 'terms', 'conditions',
      'obligations', 'consideration', 'performance', 'breach'
    ];
    return contractTerms.some(term => text.includes(term));
  }

  private hasLitigationTerms(text: string): boolean {
    const litigationTerms = [
      'claim', 'defendant', 'claimant', 'court', 'tribunal',
      'judgment', 'damages', 'liability', 'negligence'
    ];
    return litigationTerms.some(term => text.includes(term));
  }

  private extractSections(caseData: string): string[] {
    // Extract section headers (simplified)
    const sections = caseData.match(/^[A-Z\s]+:|\d+\.\s+[A-Z][^:]+:/gm) || [];
    return sections.map(s => s.replace(/[:\d\.]/g, '').trim()).slice(0, 15);
  }

  private extractKeyTerms(text: string): string[] {
    const legalTerms = [
      'contract', 'agreement', 'liability', 'damages', 'breach',
      'negligence', 'duty', 'obligation', 'consideration', 'performance',
      'termination', 'clause', 'provision', 'remedy', 'relief'
    ];
    
    return legalTerms.filter(term => text.includes(term));
  }

  private extractEntities(caseData: string): string[] {
    // Extract anonymized entity types (not actual names)
    const entityPatterns = [
      /\b[A-Z][a-z]+ (Ltd|Limited|Plc|Inc|Corp|LLC)\b/g,
      /\b(Mr|Mrs|Ms|Dr)\s+[A-Z][a-z]+/g
    ];
    
    const entities: string[] = [];
    for (const pattern of entityPatterns) {
      const matches = caseData.match(pattern) || [];
      entities.push(...matches);
    }
    
    // Return anonymized count rather than actual entities
    return entities.length > 0 ? [`${entities.length} entities identified`] : [];
  }

  private countDateReferences(caseData: string): number {
    const datePatterns = [
      /\d{1,2}\/\d{1,2}\/\d{4}/g,
      /\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/gi,
      /\b\d{4}\b/g
    ];
    
    let count = 0;
    for (const pattern of datePatterns) {
      const matches = caseData.match(pattern) || [];
      count += matches.length;
    }
    
    return count;
  }

  private extractMonetaryValues(caseData: string): string[] {
    const moneyPatterns = [
      /£[\d,]+\.?\d*/g,
      /\$[\d,]+\.?\d*/g,
      /€[\d,]+\.?\d*/g,
      /\b\d+\s*(?:pounds?|dollars?|euros?)\b/gi
    ];
    
    const values: string[] = [];
    for (const pattern of moneyPatterns) {
      const matches = caseData.match(pattern) || [];
      values.push(...matches);
    }
    
    return values.slice(0, 10); // Limit to prevent overwhelming
  }
}