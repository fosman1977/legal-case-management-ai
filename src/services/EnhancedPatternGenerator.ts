/**
 * Enhanced Pattern Generator - Phase 2 Enhanced Local Analysis
 * Synthesizes all local analysis results into rich anonymous patterns for Claude consultation
 * Generates comprehensive patterns like: "Multi-party commercial dispute with 3 timeline contradictions, 
 * complex financial relationship network, 6-month gap in documentation, and conflicting contractual obligations"
 */

import { ContradictionAnalysisResult } from './LocalContradictionDetector';
import { RelationshipAnalysisResult } from './LocalRelationshipMapper';
import { TimelineAnalysisResult } from './LocalTimelineAnalyzer';
import { SemanticAnalysisResult } from './SemanticAnalysisEngine';
import { ExtractionResult } from './EnhancedDocumentProcessor';

export interface PatternSynthesis {
  caseComplexityScore: number;
  disputeCharacterization: string;
  keyRiskFactors: string[];
  strategicAdvantages: string[];
  legalFrameworkIndicators: string[];
  evidentialStrengthAssessment: string;
}

export interface EnhancedConsultationPattern {
  // Core Pattern Information
  patternId: string;
  generatedAt: Date;
  confidenceScore: number;
  
  // Document Analysis Summary
  documentAnalysis: {
    totalDocuments: number;
    documentTypes: string[];
    extractionQuality: string;
    timespan: string;
    complexity: 'low' | 'medium' | 'high' | 'very_high';
  };
  
  // Contradiction Insights
  contradictionPatterns: {
    summary: string;
    criticalIssues: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    anonymizedPatterns: string[];
  };
  
  // Relationship Insights
  relationshipPatterns: {
    networkComplexity: string;
    keyRelationshipTypes: string[];
    influentialEntities: string[];
    anonymizedPatterns: string[];
  };
  
  // Timeline Insights
  temporalPatterns: {
    chronologyAssessment: string;
    significantGaps: string[];
    sequenceIssues: string[];
    anonymizedPatterns: string[];
  };
  
  // Semantic Insights
  semanticPatterns: {
    legalFramework: string;
    disputeNature: string;
    complexityFactors: string[];
    strategicFactors: string[];
    anonymizedPatterns: string[];
  };
  
  // Synthesized Strategic Intelligence
  synthesis: PatternSynthesis;
  
  // Anonymous Consultation Prompt
  claudeConsultationPrompt: string;
  
  // Privacy Verification
  privacyCompliance: {
    anonymizationVerified: boolean;
    noIdentifiableInformation: boolean;
    safeForTransmission: boolean;
    complianceChecks: string[];
  };
}

/**
 * Enhanced Pattern Generator - Creates rich anonymous patterns for Claude consultation
 */
export class EnhancedPatternGenerator {
  
  constructor() {}

  /**
   * Generate comprehensive consultation pattern from all analysis results
   */
  async generateEnhancedPattern(
    extractionResults: ExtractionResult[],
    contradictionAnalysis?: ContradictionAnalysisResult,
    relationshipAnalysis?: RelationshipAnalysisResult,
    timelineAnalysis?: TimelineAnalysisResult,
    semanticAnalysis?: SemanticAnalysisResult
  ): Promise<EnhancedConsultationPattern> {
    
    const patternId = `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const generatedAt = new Date();
    
    // Analyze document extraction results
    const documentAnalysis = this.analyzeDocumentResults(extractionResults);
    
    // Process contradiction analysis
    const contradictionPatterns = this.synthesizeContradictionPatterns(contradictionAnalysis);
    
    // Process relationship analysis
    const relationshipPatterns = this.synthesizeRelationshipPatterns(relationshipAnalysis);
    
    // Process timeline analysis
    const temporalPatterns = this.synthesizeTemporalPatterns(timelineAnalysis);
    
    // Process semantic analysis
    const semanticPatterns = this.synthesizeSemanticPatterns(semanticAnalysis);
    
    // Generate strategic synthesis
    const synthesis = this.generateStrategicSynthesis(
      documentAnalysis,
      contradictionPatterns,
      relationshipPatterns,
      temporalPatterns,
      semanticPatterns
    );
    
    // Calculate overall confidence
    const confidenceScore = this.calculateOverallConfidence(
      extractionResults,
      contradictionAnalysis,
      relationshipAnalysis,
      timelineAnalysis,
      semanticAnalysis
    );
    
    // Generate Claude consultation prompt
    const claudeConsultationPrompt = this.generateConsultationPrompt(
      documentAnalysis,
      contradictionPatterns,
      relationshipPatterns,
      temporalPatterns,
      semanticPatterns,
      synthesis
    );
    
    // Verify privacy compliance
    const privacyCompliance = this.verifyPrivacyCompliance(
      claudeConsultationPrompt,
      extractionResults
    );

    return {
      patternId,
      generatedAt,
      confidenceScore,
      documentAnalysis,
      contradictionPatterns,
      relationshipPatterns,
      temporalPatterns,
      semanticPatterns,
      synthesis,
      claudeConsultationPrompt,
      privacyCompliance
    };
  }

  /**
   * Analyze document extraction results
   */
  private analyzeDocumentResults(results: ExtractionResult[]) {
    const totalDocuments = results.length;
    const documentTypes = [...new Set(results.map(r => r.metadata.processingMethod))];
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / totalDocuments;
    
    const extractionQuality = avgConfidence > 0.95 ? 'excellent' : 
                             avgConfidence > 0.85 ? 'good' : 
                             avgConfidence > 0.75 ? 'adequate' : 'needs_review';
    
    const totalPages = results.reduce((sum, r) => sum + (r.metadata.pageCount || 0), 0);
    const hasComplexTables = results.some(r => r.metadata.hasTables);
    const hasScannedDocs = results.some(r => r.metadata.isScanned);
    
    const complexity = totalPages > 100 || hasComplexTables || hasScannedDocs ? 
                      (totalPages > 200 ? 'very_high' : 'high') : 
                      (totalPages > 50 ? 'medium' : 'low') as any;
    
    return {
      totalDocuments,
      documentTypes,
      extractionQuality,
      timespan: `${totalDocuments} documents spanning ${totalPages} pages`,
      complexity
    };
  }

  /**
   * Synthesize contradiction patterns
   */
  private synthesizeContradictionPatterns(analysis?: ContradictionAnalysisResult) {
    if (!analysis) {
      return {
        summary: 'No contradiction analysis performed',
        criticalIssues: [],
        riskLevel: 'low' as any,
        anonymizedPatterns: []
      };
    }
    
    const criticalContradictions = analysis.summary.criticalContradictions;
    const totalContradictions = analysis.summary.totalContradictions;
    
    const riskLevel = criticalContradictions > 2 ? 'critical' :
                     criticalContradictions > 0 ? 'high' :
                     totalContradictions > 3 ? 'medium' : 'low' as any;
    
    const summary = totalContradictions === 0 ? 
      'No significant contradictions detected across documents' :
      `${totalContradictions} contradictions identified including ${criticalContradictions} critical issues`;
    
    const criticalIssues = analysis.contradictions
      .filter(c => c.type.severity === 'critical')
      .map(c => c.anonymousPattern);
    
    return {
      summary,
      criticalIssues,
      riskLevel,
      anonymizedPatterns: analysis.anonymousPatterns
    };
  }

  /**
   * Synthesize relationship patterns
   */
  private synthesizeRelationshipPatterns(analysis?: RelationshipAnalysisResult) {
    if (!analysis) {
      return {
        networkComplexity: 'No relationship analysis performed',
        keyRelationshipTypes: [],
        influentialEntities: [],
        anonymizedPatterns: []
      };
    }
    
    const nodeCount = analysis.entityGraph.nodes.length;
    const edgeCount = analysis.entityGraph.edges.length;
    
    const networkComplexity = nodeCount > 20 ? 'highly complex multi-party network' :
                             nodeCount > 10 ? 'moderately complex network' :
                             nodeCount > 5 ? 'simple network structure' :
                             'basic relationship pattern';
    
    const keyRelationshipTypes = [...new Set(analysis.entityGraph.edges.map(e => e.type))];
    
    // Get most influential entities (anonymized)
    const influentialEntities = analysis.entityGraph.nodes
      .sort((a, b) => (b.connections || 0) - (a.connections || 0))
      .slice(0, 3)
      .map((node, index) => `Highly connected entity ${index + 1} (${node.connections || 0} connections)`);
    
    return {
      networkComplexity,
      keyRelationshipTypes,
      influentialEntities,
      anonymizedPatterns: analysis.anonymousPatterns
    };
  }

  /**
   * Synthesize temporal patterns
   */
  private synthesizeTemporalPatterns(analysis?: TimelineAnalysisResult) {
    if (!analysis) {
      return {
        chronologyAssessment: 'No timeline analysis performed',
        significantGaps: [],
        sequenceIssues: [],
        anonymizedPatterns: []
      };
    }
    
    const chronologyAssessment = analysis.summary.overallCoherence > 0.8 ? 
      'Strong chronological coherence with logical event progression' :
      analysis.summary.overallCoherence > 0.6 ?
      'Moderate chronological coherence with some inconsistencies' :
      'Poor chronological coherence requiring investigation';
    
    const significantGaps = analysis.gaps
      .filter(g => g.significance === 'critical' || g.significance === 'significant')
      .map(g => g.anonymousPattern);
    
    const sequenceIssues = analysis.sequences
      .filter(s => s.issues.length > 0)
      .map(s => s.anonymousPattern);
    
    return {
      chronologyAssessment,
      significantGaps,
      sequenceIssues,
      anonymizedPatterns: analysis.anonymousPatterns
    };
  }

  /**
   * Synthesize semantic patterns
   */
  private synthesizeSemanticPatterns(analysis?: SemanticAnalysisResult) {
    if (!analysis) {
      return {
        legalFramework: 'No semantic analysis performed',
        disputeNature: 'Unknown dispute nature',
        complexityFactors: [],
        strategicFactors: [],
        anonymizedPatterns: []
      };
    }
    
    return {
      legalFramework: analysis.patterns.legalFramework,
      disputeNature: analysis.patterns.disputeNature,
      complexityFactors: analysis.patterns.complexityIndicators,
      strategicFactors: analysis.patterns.strategicFactors,
      anonymizedPatterns: analysis.anonymousPatterns
    };
  }

  /**
   * Generate strategic synthesis combining all analyses
   */
  private generateStrategicSynthesis(
    documentAnalysis: any,
    contradictionPatterns: any,
    relationshipPatterns: any,
    temporalPatterns: any,
    semanticPatterns: any
  ): PatternSynthesis {
    
    // Calculate case complexity score (0-1)
    let complexityScore = 0;
    
    // Document complexity contribution
    complexityScore += documentAnalysis.complexity === 'very_high' ? 0.3 :
                      documentAnalysis.complexity === 'high' ? 0.2 :
                      documentAnalysis.complexity === 'medium' ? 0.1 : 0;
    
    // Contradiction complexity
    complexityScore += contradictionPatterns.riskLevel === 'critical' ? 0.25 :
                      contradictionPatterns.riskLevel === 'high' ? 0.15 :
                      contradictionPatterns.riskLevel === 'medium' ? 0.1 : 0;
    
    // Relationship complexity
    if (relationshipPatterns.networkComplexity.includes('highly complex')) {
      complexityScore += 0.25;
    } else if (relationshipPatterns.networkComplexity.includes('moderately complex')) {
      complexityScore += 0.15;
    }
    
    // Timeline complexity
    if (temporalPatterns.sequenceIssues.length > 0) {
      complexityScore += 0.1;
    }
    if (temporalPatterns.significantGaps.length > 2) {
      complexityScore += 0.1;
    }
    
    const caseComplexityScore = Math.min(1.0, complexityScore);
    
    // Generate dispute characterization
    const disputeCharacterization = this.generateDisputeCharacterization(
      semanticPatterns,
      contradictionPatterns,
      relationshipPatterns,
      caseComplexityScore
    );
    
    // Identify key risk factors
    const keyRiskFactors = this.identifyKeyRiskFactors(
      contradictionPatterns,
      temporalPatterns,
      semanticPatterns
    );
    
    // Identify strategic advantages
    const strategicAdvantages = this.identifyStrategicAdvantages(
      documentAnalysis,
      contradictionPatterns,
      relationshipPatterns,
      temporalPatterns
    );
    
    // Generate legal framework indicators
    const legalFrameworkIndicators = this.generateLegalFrameworkIndicators(
      semanticPatterns,
      relationshipPatterns
    );
    
    // Assess evidential strength
    const evidentialStrengthAssessment = this.assessEvidentialStrength(
      documentAnalysis,
      contradictionPatterns,
      temporalPatterns
    );
    
    return {
      caseComplexityScore,
      disputeCharacterization,
      keyRiskFactors,
      strategicAdvantages,
      legalFrameworkIndicators,
      evidentialStrengthAssessment
    };
  }

  private generateDisputeCharacterization(
    semanticPatterns: any,
    contradictionPatterns: any,
    relationshipPatterns: any,
    complexityScore: number
  ): string {
    const complexityDesc = complexityScore > 0.7 ? 'highly complex' :
                          complexityScore > 0.4 ? 'moderately complex' :
                          'straightforward';
    
    const disputeNature = semanticPatterns.disputeNature || 'legal dispute';
    const contradictionDesc = contradictionPatterns.criticalIssues.length > 0 ? 
      ' with critical contradictions' : '';
    const networkDesc = relationshipPatterns.networkComplexity.includes('complex') ? 
      ' involving multiple parties' : '';
    
    return `${complexityDesc} ${disputeNature}${contradictionDesc}${networkDesc}`;
  }

  private identifyKeyRiskFactors(
    contradictionPatterns: any,
    temporalPatterns: any,
    semanticPatterns: any
  ): string[] {
    const risks = [];
    
    if (contradictionPatterns.riskLevel === 'critical' || contradictionPatterns.riskLevel === 'high') {
      risks.push('Critical contradictions may undermine case coherence');
    }
    
    if (temporalPatterns.significantGaps.length > 0) {
      risks.push('Timeline gaps may indicate missing evidence');
    }
    
    if (temporalPatterns.sequenceIssues.length > 0) {
      risks.push('Chronological inconsistencies may affect credibility');
    }
    
    if (semanticPatterns.complexityFactors.length > 2) {
      risks.push('High legal complexity increases litigation risk');
    }
    
    return risks;
  }

  private identifyStrategicAdvantages(
    documentAnalysis: any,
    contradictionPatterns: any,
    relationshipPatterns: any,
    temporalPatterns: any
  ): string[] {
    const advantages = [];
    
    if (documentAnalysis.extractionQuality === 'excellent') {
      advantages.push('High-quality documentation supports strong evidence base');
    }
    
    if (contradictionPatterns.riskLevel === 'low') {
      advantages.push('Consistent narrative across all documents');
    }
    
    if (temporalPatterns.chronologyAssessment.includes('Strong')) {
      advantages.push('Clear chronological progression strengthens case');
    }
    
    if (relationshipPatterns.influentialEntities.length > 0) {
      advantages.push('Well-documented entity relationships provide strategic leverage');
    }
    
    return advantages;
  }

  private generateLegalFrameworkIndicators(
    semanticPatterns: any,
    relationshipPatterns: any
  ): string[] {
    const indicators = [];
    
    if (semanticPatterns.legalFramework) {
      indicators.push(semanticPatterns.legalFramework);
    }
    
    relationshipPatterns.keyRelationshipTypes.forEach((type: string) => {
      indicators.push(`${type} relationship structure identified`);
    });
    
    return indicators;
  }

  private assessEvidentialStrength(
    documentAnalysis: any,
    contradictionPatterns: any,
    temporalPatterns: any
  ): string {
    let score = 0;
    
    // Document quality contribution
    if (documentAnalysis.extractionQuality === 'excellent') score += 3;
    else if (documentAnalysis.extractionQuality === 'good') score += 2;
    else if (documentAnalysis.extractionQuality === 'adequate') score += 1;
    
    // Contradiction impact
    if (contradictionPatterns.riskLevel === 'low') score += 2;
    else if (contradictionPatterns.riskLevel === 'medium') score += 1;
    else score -= 1;
    
    // Timeline coherence impact
    if (temporalPatterns.chronologyAssessment.includes('Strong')) score += 2;
    else if (temporalPatterns.chronologyAssessment.includes('Moderate')) score += 1;
    else score -= 1;
    
    if (score >= 5) return 'Strong evidential foundation with minimal weaknesses';
    if (score >= 3) return 'Solid evidential base with manageable challenges';
    if (score >= 1) return 'Adequate evidence but requires careful management';
    return 'Weak evidential position requiring significant strengthening';
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(
    extractionResults: ExtractionResult[],
    contradictionAnalysis?: ContradictionAnalysisResult,
    relationshipAnalysis?: RelationshipAnalysisResult,
    timelineAnalysis?: TimelineAnalysisResult,
    semanticAnalysis?: SemanticAnalysisResult
  ): number {
    let totalConfidence = 0;
    let componentCount = 0;
    
    // Extraction confidence
    if (extractionResults.length > 0) {
      const avgExtractionConfidence = extractionResults.reduce((sum, r) => sum + r.confidence, 0) / extractionResults.length;
      totalConfidence += avgExtractionConfidence;
      componentCount++;
    }
    
    // Analysis component confidences
    if (contradictionAnalysis) {
      totalConfidence += 0.85; // Mock confidence for contradiction analysis
      componentCount++;
    }
    
    if (relationshipAnalysis) {
      totalConfidence += relationshipAnalysis.summary.overallConfidence || 0.8;
      componentCount++;
    }
    
    if (timelineAnalysis) {
      totalConfidence += timelineAnalysis.summary.overallCoherence;
      componentCount++;
    }
    
    if (semanticAnalysis) {
      totalConfidence += semanticAnalysis.summary.semanticCoherence;
      componentCount++;
    }
    
    return componentCount > 0 ? totalConfidence / componentCount : 0.7;
  }

  /**
   * Generate comprehensive consultation prompt for Claude
   */
  private generateConsultationPrompt(
    documentAnalysis: any,
    contradictionPatterns: any,
    relationshipPatterns: any,
    temporalPatterns: any,
    semanticPatterns: any,
    synthesis: PatternSynthesis
  ): string {
    const prompt = `# Legal Case Analysis Consultation

## Case Overview
**Dispute Nature**: ${synthesis.disputeCharacterization}
**Case Complexity**: ${(synthesis.caseComplexityScore * 100).toFixed(0)}% complexity score
**Evidential Strength**: ${synthesis.evidentialStrengthAssessment}

## Document Analysis
- **Documentation**: ${documentAnalysis.timespan}
- **Extraction Quality**: ${documentAnalysis.extractionQuality}
- **Document Types**: ${documentAnalysis.documentTypes.join(', ')}

## Key Issues Identified

### Contradictions & Conflicts
${contradictionPatterns.summary}
${contradictionPatterns.criticalIssues.length > 0 ? 
  `\n**Critical Issues**:\n${contradictionPatterns.criticalIssues.map((issue: string) => `- ${issue}`).join('\n')}` : ''}

### Entity Relationships
**Network Structure**: ${relationshipPatterns.networkComplexity}
${relationshipPatterns.influentialEntities.length > 0 ? 
  `\n**Key Entities**: ${relationshipPatterns.influentialEntities.join(', ')}` : ''}

### Timeline Analysis
**Chronology**: ${temporalPatterns.chronologyAssessment}
${temporalPatterns.significantGaps.length > 0 ? 
  `\n**Significant Gaps**: ${temporalPatterns.significantGaps.join('; ')}` : ''}
${temporalPatterns.sequenceIssues.length > 0 ? 
  `\n**Sequence Issues**: ${temporalPatterns.sequenceIssues.join('; ')}` : ''}

### Legal Framework
**Dispute Framework**: ${semanticPatterns.disputeNature}
**Legal Areas**: ${semanticPatterns.legalFramework}
${semanticPatterns.complexityFactors.length > 0 ? 
  `\n**Complexity Factors**: ${semanticPatterns.complexityFactors.join('; ')}` : ''}

## Strategic Assessment

### Risk Factors
${synthesis.keyRiskFactors.map(risk => `- ${risk}`).join('\n')}

### Strategic Advantages
${synthesis.strategicAdvantages.map(advantage => `- ${advantage}`).join('\n')}

### Legal Framework Indicators
${synthesis.legalFrameworkIndicators.map(indicator => `- ${indicator}`).join('\n')}

## Consultation Request

Based on this anonymous legal pattern analysis, please provide strategic guidance on:

1. **Case Strategy**: What overall approach would be most effective given these patterns?
2. **Risk Management**: How should the identified risk factors be addressed?
3. **Evidence Strategy**: What evidence gaps or strengths should be leveraged?
4. **Settlement Considerations**: Does this pattern suggest settlement opportunities or risks?
5. **Litigation Strategy**: If proceeding to trial, what key arguments emerge from these patterns?

Please provide specific, actionable strategic advice based on these anonymous patterns while maintaining complete confidentiality.`;

    return prompt;
  }

  /**
   * Verify privacy compliance of generated pattern
   */
  private verifyPrivacyCompliance(
    consultationPrompt: string,
    extractionResults: ExtractionResult[]
  ) {
    // Check for potential identifiable information
    const complianceChecks = [];
    
    // Verify no specific names, addresses, or identifiable details
    const identityPatterns = [
      /\b[A-Z][a-z]+\s+[A-Z][a-z]+\s+Ltd\b/, // Company names
      /\b\d{2,3}\s+[A-Z][a-z]+\s+Street\b/, // Addresses
      /\b[A-Z]{2}\d{1,2}\s+\d[A-Z]{2}\b/, // UK postcodes
      /\b\d{4}-\d{4}-\d{4}-\d{4}\b/, // Card numbers
      /\b[A-Z]{2}\d{6}[A-Z]\b/ // UK National Insurance numbers
    ];
    
    let hasIdentifiableData = false;
    identityPatterns.forEach(pattern => {
      if (pattern.test(consultationPrompt)) {
        hasIdentifiableData = true;
        complianceChecks.push(`Potential identifiable pattern detected: ${pattern.source}`);
      }
    });
    
    // Verify anonymization was performed on source data
    const anonymizationVerified = extractionResults.every(r => r.safeForTransmission);
    if (anonymizationVerified) {
      complianceChecks.push('Source document anonymization verified');
    }
    
    // Check pattern abstraction level
    const isAbstract = !consultationPrompt.toLowerCase().includes('claimant') &&
                      !consultationPrompt.toLowerCase().includes('defendant') &&
                      !consultationPrompt.toLowerCase().includes('plaintiff');
    
    if (isAbstract) {
      complianceChecks.push('Patterns appropriately abstracted from specific parties');
    }
    
    const noIdentifiableInformation = !hasIdentifiableData;
    const safeForTransmission = anonymizationVerified && noIdentifiableInformation && isAbstract;
    
    return {
      anonymizationVerified,
      noIdentifiableInformation,
      safeForTransmission,
      complianceChecks
    };
  }
}

export default EnhancedPatternGenerator;