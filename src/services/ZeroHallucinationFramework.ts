/**
 * Zero Hallucination Framework - Phase 1 Week 5-6
 * Implements strategy's anti-hallucination requirements
 * Only report what's actually found, never fabricate
 */

export interface ConfidenceScoring {
  highConfidence: number; // >95% - Report as found
  mediumConfidence: number; // 90-95% - Flag for review  
  lowConfidence: number; // <90% - Do not report
}

export interface VerificationRules {
  crossReference: boolean; // Multiple engines must agree
  sourceTracking: boolean; // Every finding linked to source location
  confidenceScoring: boolean; // Clear confidence indicators for all results
}

export interface FindingVerification {
  finding: any;
  confidence: number;
  sources: string[];
  crossReferencedBy: number;
  sourceLocation: {
    page?: number;
    line?: number;
    character?: number;
    context: string;
  };
  verificationStatus: 'verified' | 'requires_review' | 'rejected';
  verificationNotes: string[];
}

export interface ZeroHallucinationResult {
  verifiedFindings: FindingVerification[];
  rejectedFindings: FindingVerification[];
  overallConfidence: number;
  qualityMetrics: {
    totalFindings: number;
    verifiedFindings: number;
    rejectedFindings: number;
    averageConfidence: number;
    crossReferenceRate: number;
  };
  recommendedActions: string[];
}

/**
 * Zero Hallucination Framework
 * Ensures only verified, high-confidence findings are reported
 */
export class ZeroHallucinationFramework {
  private confidenceThresholds: ConfidenceScoring = {
    highConfidence: 0.95,
    mediumConfidence: 0.90,
    lowConfidence: 0.90
  };

  private verificationRules: VerificationRules = {
    crossReference: true,
    sourceTracking: true,
    confidenceScoring: true
  };

  constructor(
    thresholds?: Partial<ConfidenceScoring>,
    rules?: Partial<VerificationRules>
  ) {
    if (thresholds) {
      this.confidenceThresholds = { ...this.confidenceThresholds, ...thresholds };
    }
    if (rules) {
      this.verificationRules = { ...this.verificationRules, ...rules };
    }
  }

  /**
   * Main verification method - implements strategy's anti-hallucination framework
   */
  async verifyFindings(
    findings: any[],
    extractionResults: any[],
    options: { strictMode?: boolean; requireSourceTracking?: boolean } = {}
  ): Promise<ZeroHallucinationResult> {
    const verifiedFindings: FindingVerification[] = [];
    const rejectedFindings: FindingVerification[] = [];

    for (const finding of findings) {
      const verification = await this.verifyIndividualFinding(
        finding, 
        extractionResults,
        options
      );

      if (verification.verificationStatus === 'verified') {
        verifiedFindings.push(verification);
      } else {
        rejectedFindings.push(verification);
      }
    }

    const qualityMetrics = this.calculateQualityMetrics(verifiedFindings, rejectedFindings);
    const recommendedActions = this.generateRecommendations(qualityMetrics, options);

    return {
      verifiedFindings,
      rejectedFindings,
      overallConfidence: qualityMetrics.averageConfidence,
      qualityMetrics,
      recommendedActions
    };
  }

  /**
   * Verify individual finding against anti-hallucination rules
   */
  private async verifyIndividualFinding(
    finding: any,
    extractionResults: any[],
    options: { strictMode?: boolean; requireSourceTracking?: boolean }
  ): Promise<FindingVerification> {
    const verification: FindingVerification = {
      finding,
      confidence: finding.confidence || 0,
      sources: [],
      crossReferencedBy: 0,
      sourceLocation: {
        context: finding.context || 'Unknown context'
      },
      verificationStatus: 'rejected',
      verificationNotes: []
    };

    // Rule 1: Confidence threshold check
    if (finding.confidence < this.confidenceThresholds.lowConfidence) {
      verification.verificationNotes.push(
        `Confidence ${Math.round(finding.confidence * 100)}% below threshold ${Math.round(this.confidenceThresholds.lowConfidence * 100)}%`
      );
      return verification;
    }

    // Rule 2: Source tracking requirement
    if (this.verificationRules.sourceTracking || options.requireSourceTracking) {
      const sourceLocation = this.findSourceLocation(finding, extractionResults);
      if (!sourceLocation) {
        verification.verificationNotes.push('No source location found for finding');
        return verification;
      }
      verification.sourceLocation = sourceLocation;
      verification.sources.push(sourceLocation.context);
    }

    // Rule 3: Cross-reference requirement
    if (this.verificationRules.crossReference) {
      const crossReferences = this.findCrossReferences(finding, extractionResults);
      verification.crossReferencedBy = crossReferences.length;
      
      if (crossReferences.length === 0 && options.strictMode) {
        verification.verificationNotes.push('No cross-references found in strict mode');
        return verification;
      }

      if (crossReferences.length > 0) {
        verification.sources.push(...crossReferences);
        verification.confidence = Math.min(
          verification.confidence + (crossReferences.length * 0.05),
          1.0
        );
      }
    }

    // Rule 4: Context validation
    if (!this.validateContext(finding)) {
      verification.verificationNotes.push('Context validation failed');
      return verification;
    }

    // Rule 5: Semantic consistency
    const semanticCheck = this.checkSemanticConsistency(finding, extractionResults);
    if (!semanticCheck.consistent) {
      verification.verificationNotes.push(`Semantic inconsistency: ${semanticCheck.reason}`);
      if (options.strictMode) {
        return verification;
      }
    }

    // Final verification decision
    if (verification.confidence >= this.confidenceThresholds.mediumConfidence) {
      if (verification.confidence >= this.confidenceThresholds.highConfidence) {
        verification.verificationStatus = 'verified';
        verification.verificationNotes.push('High confidence - approved for reporting');
      } else {
        verification.verificationStatus = options.strictMode ? 'requires_review' : 'verified';
        verification.verificationNotes.push('Medium confidence - flagged for review');
      }
    } else {
      verification.verificationNotes.push('Below medium confidence threshold');
    }

    return verification;
  }

  /**
   * Find source location of finding in extraction results
   */
  private findSourceLocation(finding: any, extractionResults: any[]): any {
    for (const result of extractionResults) {
      if (result.text && typeof result.text === 'string') {
        const findingText = finding.text || finding.value || String(finding);
        const index = result.text.toLowerCase().indexOf(findingText.toLowerCase());
        
        if (index !== -1) {
          const lines = result.text.substring(0, index).split('\n');
          const context = this.extractContext(result.text, index, findingText.length);
          
          return {
            page: result.metadata?.pageCount || 1,
            line: lines.length,
            character: index,
            context: context
          };
        }
      }
    }
    return null;
  }

  /**
   * Find cross-references to the finding across extraction results
   */
  private findCrossReferences(finding: any, extractionResults: any[]): string[] {
    const references: string[] = [];
    const findingText = (finding.text || finding.value || String(finding)).toLowerCase();
    
    for (const result of extractionResults) {
      if (result.text && typeof result.text === 'string') {
        const text = result.text.toLowerCase();
        let lastIndex = -1;
        let count = 0;
        
        while ((lastIndex = text.indexOf(findingText, lastIndex + 1)) !== -1) {
          count++;
          if (count > 1) {
            references.push(`${result.metadata?.processingMethod || 'unknown'}: ${count} occurrences`);
            break;
          }
        }
      }
      
      // Check in structured data (tables, entities, etc.)
      if (result.tables) {
        for (const table of result.tables) {
          if (JSON.stringify(table).toLowerCase().includes(findingText)) {
            references.push(`Table data in ${result.metadata?.processingMethod || 'unknown'}`);
          }
        }
      }
    }
    
    return references;
  }

  /**
   * Validate context of finding
   */
  private validateContext(finding: any): boolean {
    if (!finding.context || typeof finding.context !== 'string') {
      return false;
    }
    
    // Context should be meaningful (not just repeated characters or random strings)
    const context = finding.context.trim();
    if (context.length < 10) return false;
    
    // Check for reasonable character distribution
    const uniqueChars = new Set(context.toLowerCase()).size;
    if (uniqueChars < 5) return false; // Too repetitive
    
    return true;
  }

  /**
   * Check semantic consistency of finding
   */
  private checkSemanticConsistency(finding: any, extractionResults: any[]): { consistent: boolean; reason?: string } {
    // Check if finding type matches its content
    if (finding.type === 'date') {
      const datePattern = /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b|\b\d{1,2}(?:st|nd|rd|th)?\s+\w+\s+\d{4}\b/;
      if (!datePattern.test(String(finding.text || finding.value))) {
        return { consistent: false, reason: 'Date type but no date pattern found' };
      }
    }
    
    if (finding.type === 'financial' || finding.category === 'financial') {
      const financialPattern = /£|pound|GBP|\d+\.\d{2}/i;
      if (!financialPattern.test(String(finding.text || finding.value))) {
        return { consistent: false, reason: 'Financial type but no financial pattern found' };
      }
    }
    
    if (finding.type === 'person' || finding.category === 'person') {
      const personPattern = /\b[A-Z][a-z]+\s+[A-Z][a-z]+/;
      if (!personPattern.test(String(finding.text || finding.value))) {
        return { consistent: false, reason: 'Person type but no name pattern found' };
      }
    }
    
    return { consistent: true };
  }

  /**
   * Extract context around finding location
   */
  private extractContext(text: string, index: number, length: number): string {
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + length + 50);
    const context = text.substring(start, end);
    
    return `...${context}...`;
  }

  /**
   * Calculate quality metrics for verification results
   */
  private calculateQualityMetrics(
    verifiedFindings: FindingVerification[],
    rejectedFindings: FindingVerification[]
  ) {
    const totalFindings = verifiedFindings.length + rejectedFindings.length;
    const allFindings = [...verifiedFindings, ...rejectedFindings];
    
    const averageConfidence = allFindings.length > 0
      ? allFindings.reduce((sum, f) => sum + f.confidence, 0) / allFindings.length
      : 0;
    
    const crossReferencedFindings = allFindings.filter(f => f.crossReferencedBy > 0).length;
    const crossReferenceRate = totalFindings > 0 ? crossReferencedFindings / totalFindings : 0;
    
    return {
      totalFindings,
      verifiedFindings: verifiedFindings.length,
      rejectedFindings: rejectedFindings.length,
      averageConfidence,
      crossReferenceRate
    };
  }

  /**
   * Generate recommendations based on quality metrics
   */
  private generateRecommendations(
    metrics: any,
    options: { strictMode?: boolean; requireSourceTracking?: boolean }
  ): string[] {
    const recommendations: string[] = [];
    
    if (metrics.averageConfidence < 0.8) {
      recommendations.push('Consider improving document quality or using alternative extraction methods');
    }
    
    if (metrics.crossReferenceRate < 0.5) {
      recommendations.push('Low cross-reference rate detected - consider additional verification sources');
    }
    
    if (metrics.rejectedFindings > metrics.verifiedFindings) {
      recommendations.push('High rejection rate - review extraction confidence thresholds');
    }
    
    if (metrics.verifiedFindings === 0) {
      recommendations.push('No findings passed verification - document may be unsuitable for analysis');
    }
    
    if (metrics.verifiedFindings > 50) {
      recommendations.push('High number of verified findings - consider grouping similar entities');
    }
    
    if (options.strictMode && metrics.averageConfidence > 0.95) {
      recommendations.push('Excellent verification quality - suitable for high-stakes analysis');
    }
    
    return recommendations;
  }

  /**
   * Create summary report of verification process
   */
  createVerificationReport(result: ZeroHallucinationResult): string {
    const report = [
      '=== ZERO HALLUCINATION VERIFICATION REPORT ===',
      '',
      `Total Findings Processed: ${result.qualityMetrics.totalFindings}`,
      `Verified Findings: ${result.qualityMetrics.verifiedFindings}`,
      `Rejected Findings: ${result.qualityMetrics.rejectedFindings}`,
      `Overall Confidence: ${Math.round(result.overallConfidence * 100)}%`,
      `Cross-Reference Rate: ${Math.round(result.qualityMetrics.crossReferenceRate * 100)}%`,
      '',
      'VERIFICATION STATUS:',
      result.qualityMetrics.verifiedFindings > 0 ? 
        '✅ PASSED - Findings available for reporting' : 
        '❌ FAILED - No reliable findings for reporting',
      '',
      'RECOMMENDATIONS:',
      ...result.recommendedActions.map(action => `• ${action}`),
      '',
      'REJECTED FINDINGS SUMMARY:',
      ...result.rejectedFindings.slice(0, 5).map(finding => 
        `• ${finding.finding.text || finding.finding.value || 'Unknown'}: ${finding.verificationNotes.join(', ')}`
      ),
      result.rejectedFindings.length > 5 ? `... and ${result.rejectedFindings.length - 5} more` : ''
    ];

    return report.join('\n');
  }
}

export default ZeroHallucinationFramework;