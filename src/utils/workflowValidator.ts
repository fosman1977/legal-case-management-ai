/**
 * Workflow Integration Validator
 * Ensures end-to-end workflow integrity and progress tracking
 */

export interface WorkflowValidation {
  isValid: boolean;
  missingComponents: string[];
  recommendations: string[];
  confidence: number;
}

export class WorkflowValidator {
  private static instance: WorkflowValidator;
  
  public static getInstance(): WorkflowValidator {
    if (!WorkflowValidator.instance) {
      WorkflowValidator.instance = new WorkflowValidator();
    }
    return WorkflowValidator.instance;
  }
  
  /**
   * Validate complete workflow from case selection to export
   */
  validateCompleteWorkflow(
    selectedCase: any,
    analysisResults: any,
    consultationResults: any,
    workflowProgress: any
  ): WorkflowValidation {
    const missingComponents: string[] = [];
    const recommendations: string[] = [];
    let confidence = 1.0;
    
    // Step 1: Case Selection Validation
    if (!selectedCase) {
      missingComponents.push('Selected Case');
      recommendations.push('Select a case from the Cases section');
      confidence -= 0.25;
    }
    
    // Step 2: Analysis Results Validation
    if (!analysisResults) {
      missingComponents.push('Document Analysis');
      recommendations.push('Upload and analyze documents in the Analyze section');
      confidence -= 0.25;
    } else {
      // Validate analysis completeness
      if (!analysisResults.enhancedAnalysis) {
        recommendations.push('Enable enhanced analysis features (Phase 2)');
        confidence -= 0.1;
      }
      
      if (!analysisResults.entitiesFound || analysisResults.entitiesFound < 1) {
        recommendations.push('Ensure documents contain extractable entities');
        confidence -= 0.1;
      }
      
      // Validate Phase 2 Analysis Components
      const phase2Components = [
        'contradictions',
        'relationships', 
        'timeline',
        'semantics'
      ];
      
      phase2Components.forEach(component => {
        if (!analysisResults.enhancedAnalysis?.[component]) {
          recommendations.push(`Enable ${component} analysis for comprehensive insights`);
          confidence -= 0.05;
        }
      });
    }
    
    // Step 3: Consultation Results Validation
    if (!consultationResults) {
      missingComponents.push('AI Consultation');
      recommendations.push('Complete AI consultation in the Insights section');
      confidence -= 0.2;
    } else {
      // Validate consultation completeness
      const requiredConsultationFields = [
        'strategicAnalysis',
        'keyFindings',
        'recommendedActions',
        'caseStrategy'
      ];
      
      requiredConsultationFields.forEach(field => {
        if (!consultationResults[field]) {
          recommendations.push(`Consultation missing ${field} - retry consultation`);
          confidence -= 0.05;
        }
      });
    }
    
    // Step 4: Progress Tracking Validation
    if (!workflowProgress) {
      missingComponents.push('Workflow Progress Tracking');
      recommendations.push('Workflow progress tracking not initialized');
      confidence -= 0.15;
    } else {
      const expectedStages = [
        'case_selected',
        'documents_uploaded', 
        'analysis_complete',
        'consultation_complete',
        'ready_for_export'
      ];
      
      const completedStages = workflowProgress.completedStages || [];
      const missingStages = expectedStages.filter(stage => 
        !completedStages.includes(stage)
      );
      
      if (missingStages.length > 0) {
        recommendations.push(`Complete workflow stages: ${missingStages.join(', ')}`);
        confidence -= (missingStages.length * 0.05);
      }
      
      if (workflowProgress.confidenceLevel && workflowProgress.confidenceLevel < 0.8) {
        recommendations.push('Consider reviewing analysis quality - confidence below 80%');
        confidence -= 0.05;
      }
    }
    
    return {
      isValid: missingComponents.length === 0,
      missingComponents,
      recommendations: recommendations.slice(0, 5), // Limit to top 5 recommendations
      confidence: Math.max(0, confidence)
    };
  }
  
  /**
   * Validate data privacy compliance throughout workflow
   */
  validatePrivacyCompliance(analysisResults: any, consultationResults: any): boolean {
    // Check that no raw client data is in consultation results
    if (consultationResults?.consultationMetadata) {
      const metadata = consultationResults.consultationMetadata;
      
      // Ensure only anonymous patterns were transmitted
      if (metadata.dataTransmitted !== 'Anonymous patterns only' && 
          metadata.dataTransmitted !== 'No external data transmission') {
        return false;
      }
      
      // Ensure privacy compliance flag is set
      if (!metadata.privacyCompliant) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Generate workflow completion report
   */
  generateCompletionReport(
    selectedCase: any,
    analysisResults: any, 
    consultationResults: any,
    workflowProgress: any
  ) {
    const validation = this.validateCompleteWorkflow(
      selectedCase,
      analysisResults,
      consultationResults,
      workflowProgress
    );
    
    const privacyCompliant = this.validatePrivacyCompliance(
      analysisResults,
      consultationResults
    );
    
    return {
      metadata: {
        generated: new Date().toISOString(),
        tool: 'Legal Case Manager AI - Workflow Validator',
        version: '3.0.0'
      },
      workflow_status: {
        is_complete: validation.isValid,
        completion_confidence: Math.round(validation.confidence * 100),
        privacy_compliant: privacyCompliant,
        stages_completed: workflowProgress?.completedStages?.length || 0,
        total_stages: 5
      },
      case_summary: {
        case_title: selectedCase?.title || 'No case selected',
        case_id: selectedCase?.id || null,
        documents_processed: analysisResults?.processedFiles || 0,
        entities_found: analysisResults?.entitiesFound || 0,
        consultation_completed: !!consultationResults
      },
      analysis_quality: {
        overall_confidence: analysisResults?.qualityMetrics?.averageConfidence || 0,
        enhanced_analysis_enabled: !!analysisResults?.enhancedAnalysis,
        phase2_components: {
          contradictions: analysisResults?.enhancedAnalysis?.contradictionsFound || 0,
          relationships: analysisResults?.enhancedAnalysis?.relationshipsFound || 0,
          timeline_events: analysisResults?.enhancedAnalysis?.timelineEvents || 0,
          semantic_concepts: analysisResults?.enhancedAnalysis?.semanticConcepts || 0
        }
      },
      recommendations: validation.recommendations,
      ready_for_export: {
        chronology: !!(analysisResults?.enhancedAnalysis?.timeline?.length > 0),
        case_analysis: !!analysisResults,
        strategic_report: !!consultationResults,
        skeleton_argument: !!consultationResults?.caseStrategy
      }
    };
  }
}

export const workflowValidator = WorkflowValidator.getInstance();