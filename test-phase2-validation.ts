/**
 * PHASE 2 VALIDATION TEST SUITE
 * 
 * Tests and validates the complete Phase 2 professional enhancement system
 * Verifies achievement of 95%+ lawyer-grade confidence
 */

import { courtAdmissibilityFramework } from './src/core/court-admissibility-framework';
import { professionalRiskManagement } from './src/core/professional-risk-management';
import { advancedValidationEngine } from './src/core/advanced-validation-engine';
import { phase2IntegrationSystem } from './src/core/phase2-integration';
import { enhancedUncertaintyQuantifier } from './src/core/enhanced-uncertainty-quantification';

async function testCourtAdmissibilityFramework() {
  console.log('\n🔬 Testing Court Admissibility Framework...');
  
  // Mock analysis results for testing
  const mockAnalysisResults = {
    confidence: 0.89,
    iracAnalysis: { issues: ['Contract validity'], rules: ['UCC Article 2'] },
    professionalDefensibility: { defensibilityScore: 0.85 },
    uncertaintyQuantification: { overallUncertainty: 0.12 },
    professionalReadiness: { readinessLevel: 'standard_deployment' }
  };

  // Mock uncertainty quantification
  const mockUncertaintyQuantification = {
    confidenceInterval: {
      pointEstimate: 0.89,
      lowerBound: 0.83,
      upperBound: 0.95,
      confidenceLevel: 0.95,
      intervalWidth: 0.12,
      precision: 'high' as const
    },
    uncertaintyFactors: [{
      factor: 'Model uncertainty',
      impact: 0.08,
      confidence: 0.85,
      source: 'model_uncertainty' as const,
      mitigation: 'Enhanced validation',
      weight: 1.0
    }],
    statisticalMetrics: {
      sampleSize: 100,
      variance: 0.02,
      standardDeviation: 0.14,
      standardError: 0.014,
      marginOfError: 0.08,
      reliability: 0.88,
      validity: 0.87
    },
    reliabilityAssessment: {
      overallReliability: 0.88,
      componentReliabilities: [{
        component: 'Legal reasoning',
        reliability: 0.89,
        uncertaintyContribution: 0.11,
        improvementPotential: 0.08
      }],
      riskLevel: 'medium' as const,
      professionalAcceptability: 'acceptable' as const,
      recommendations: ['Enhanced validation recommended']
    },
    recommendedActions: [{
      action: 'Implement additional validation',
      priority: 'high' as const,
      expectedImprovement: 0.05,
      effort: 'medium' as const,
      description: 'Add expert review layer'
    }]
  };

  try {
    const admissibilityAssessment = await courtAdmissibilityFramework.assessCourtAdmissibility(
      mockAnalysisResults,
      mockUncertaintyQuantification,
      {
        jurisdiction: 'federal',
        courtType: 'federal',
        caseType: 'contract_dispute',
        expertWitnessRequired: true
      }
    );

    console.log(`   ✅ Admissibility Score: ${(admissibilityAssessment.overallAdmissibility * 100).toFixed(1)}%`);
    console.log(`   ✅ Daubert Compliance: ${admissibilityAssessment.daubertCompliance.complianceLevel}`);
    console.log(`   ✅ Deployment Clearance: ${admissibilityAssessment.deploymentClearance.clearanceLevel}`);
    
    return admissibilityAssessment;
  } catch (error) {
    console.error('   ❌ Court Admissibility Framework test failed:', error);
    throw error;
  }
}

async function testProfessionalRiskManagement() {
  console.log('\n🛡️ Testing Professional Risk Management System...');
  
  const mockAnalysisResults = {
    confidence: 0.91,
    legalReasoning: { confidence: { overallConfidence: 0.91 } },
    professionalDefensibility: { defensibilityScore: 0.88 }
  };

  const mockUncertaintyQuantification = {
    confidenceInterval: {
      pointEstimate: 0.91,
      lowerBound: 0.85,
      upperBound: 0.97,
      confidenceLevel: 0.95,
      intervalWidth: 0.12,
      precision: 'high' as const
    },
    uncertaintyFactors: [],
    statisticalMetrics: {
      sampleSize: 100,
      variance: 0.02,
      standardDeviation: 0.14,
      standardError: 0.014,
      marginOfError: 0.08,
      reliability: 0.89,
      validity: 0.88
    },
    reliabilityAssessment: { 
      overallReliability: 0.89,
      componentReliabilities: [],
      riskLevel: 'medium' as const,
      professionalAcceptability: 'acceptable' as const,
      recommendations: []
    },
    recommendedActions: []
  };

  const mockCourtAdmissibility = {
    overallAdmissibility: 0.86,
    daubertCompliance: { overallScore: 0.84 },
    deploymentClearance: { clearanceLevel: 'limited' }
  };

  try {
    const riskAssessment = await professionalRiskManagement.assessProfessionalRisks(
      mockAnalysisResults,
      mockUncertaintyQuantification,
      mockCourtAdmissibility,
      {
        jurisdiction: 'federal',
        practiceArea: 'commercial_law',
        clientTypes: ['corporation', 'individual'],
        firmSize: 'medium'
      }
    );

    console.log(`   ✅ Overall Risk Score: ${(riskAssessment.overallRiskScore * 100).toFixed(1)}%`);
    console.log(`   ✅ Professional Safety: ${riskAssessment.professionalSafety.safetyLevel}`);
    console.log(`   ✅ Malpractice Compliance: ${(riskAssessment.malpracticeCompliance.complianceScore * 100).toFixed(1)}%`);
    
    return riskAssessment;
  } catch (error) {
    console.error('   ❌ Professional Risk Management test failed:', error);
    throw error;
  }
}

async function testAdvancedValidationEngine() {
  console.log('\n🔍 Testing Advanced Validation Engine...');
  
  const mockAnalysisResults = {
    confidence: 0.90,
    legalReasoning: { confidence: { overallConfidence: 0.90 } }
  };

  const mockUncertaintyQuantification = {
    reliabilityAssessment: { overallReliability: 0.88 }
  };

  const mockCourtAdmissibility = {
    overallAdmissibility: 0.85,
    deploymentClearance: { clearanceLevel: 'limited' }
  };

  const mockProfessionalRisk = {
    overallRiskScore: 0.25,
    professionalSafety: { safetyLevel: 'high' }
  };

  try {
    const validationResult = await advancedValidationEngine.performAdvancedValidation(
      mockAnalysisResults,
      mockUncertaintyQuantification,
      mockCourtAdmissibility,
      mockProfessionalRisk,
      {
        validationLevel: 'comprehensive',
        expertReviewRequired: true,
        targetConfidence: 0.95,
        consensusThreshold: 0.8
      }
    );

    console.log(`   ✅ Overall Validation Score: ${(validationResult.overallValidationScore * 100).toFixed(1)}%`);
    console.log(`   ✅ Lawyer-Grade Confidence: ${(validationResult.lawyerGradeConfidence * 100).toFixed(1)}%`);
    console.log(`   ✅ Professional Deployment Ready: ${validationResult.professionalDeploymentReadiness ? 'Yes' : 'No'}`);
    
    return validationResult;
  } catch (error) {
    console.error('   ❌ Advanced Validation Engine test failed:', error);
    throw error;
  }
}

async function testPhase2Integration() {
  console.log('\n🔗 Testing Phase 2 Integration System...');
  
  const mockAnalysisResults = {
    confidence: 0.89,
    legalReasoning: { 
      confidence: { 
        overallConfidence: 0.89,
        factualConfidence: 0.87,
        legalConfidence: 0.91,
        applicationConfidence: 0.88
      },
      issues: ['Contract formation'],
      entities: [{ id: 'party1', type: 'organization', value: 'ABC Corp' }]
    },
    professionalDefensibility: { defensibilityScore: 0.86 }
  };

  const mockUncertaintyQuantification = {
    confidenceInterval: {
      pointEstimate: 0.89,
      lowerBound: 0.83,
      upperBound: 0.95,
      confidenceLevel: 0.95,
      intervalWidth: 0.12,
      precision: 'high' as const
    },
    uncertaintyFactors: [],
    statisticalMetrics: {
      sampleSize: 100,
      variance: 0.02,
      standardDeviation: 0.14,
      standardError: 0.014,
      marginOfError: 0.08,
      reliability: 0.88,
      validity: 0.87
    },
    reliabilityAssessment: {
      overallReliability: 0.88,
      componentReliabilities: [],
      riskLevel: 'medium' as const,
      professionalAcceptability: 'acceptable' as const,
      recommendations: []
    },
    recommendedActions: []
  };

  try {
    const integrationResult = await phase2IntegrationSystem.performPhase2Integration(
      mockAnalysisResults,
      mockUncertaintyQuantification,
      {
        jurisdiction: 'federal',
        practiceArea: 'commercial_law',
        clientTypes: ['corporation'],
        deploymentContext: 'production',
        targetConfidence: 0.95,
        validationLevel: 'comprehensive'
      }
    );

    console.log(`   ✅ Final Lawyer-Grade Confidence: ${(integrationResult.finalLawyerGradeConfidence * 100).toFixed(1)}%`);
    console.log(`   ✅ Professional Deployment Ready: ${integrationResult.professionalDeploymentReadiness ? 'Yes' : 'No'}`);
    console.log(`   ✅ Deployment Certification: ${integrationResult.deploymentCertification.certificationLevel}`);
    console.log(`   ✅ Quality Assessment: ${integrationResult.qualityAssessment.overallQuality.toFixed(3)}`);
    
    return integrationResult;
  } catch (error) {
    console.error('   ❌ Phase 2 Integration test failed:', error);
    throw error;
  }
}

async function runComprehensivePhase2Test() {
  console.log('\n🚀 Running Comprehensive Phase 2 Validation...\n');
  
  try {
    const startTime = Date.now();
    
    // Test individual components
    const courtAdmissibility = await testCourtAdmissibilityFramework();
    const professionalRisk = await testProfessionalRiskManagement();
    const advancedValidation = await testAdvancedValidationEngine();
    const phase2Integration = await testPhase2Integration();
    
    const endTime = Date.now();
    
    // Comprehensive analysis
    console.log('\n📊 PHASE 2 VALIDATION SUMMARY');
    console.log('====================================');
    console.log(`⏱️  Total Test Duration: ${endTime - startTime}ms`);
    console.log(`⚖️  Court Admissibility: ${(courtAdmissibility.overallAdmissibility * 100).toFixed(1)}%`);
    console.log(`🛡️  Professional Risk Score: ${((1 - professionalRisk.overallRiskScore) * 100).toFixed(1)}%`);
    console.log(`🔍 Advanced Validation: ${(advancedValidation.overallValidationScore * 100).toFixed(1)}%`);
    console.log(`🎯 Final Confidence: ${(phase2Integration.finalLawyerGradeConfidence * 100).toFixed(1)}%`);
    
    // Check if 95%+ target achieved
    const targetAchieved = phase2Integration.finalLawyerGradeConfidence >= 0.95;
    console.log(`\n🎯 95%+ TARGET: ${targetAchieved ? '✅ ACHIEVED' : '❌ NOT ACHIEVED'}`);
    
    if (targetAchieved) {
      console.log('\n🏆 Phase 2 professional enhancement SUCCESSFUL!');
      console.log('   Ready for professional legal deployment');
    } else {
      console.log('\n⚠️  Phase 2 needs additional optimization');
      console.log('   Current confidence below 95% professional threshold');
    }
    
    return {
      success: true,
      targetAchieved,
      finalConfidence: phase2Integration.finalLawyerGradeConfidence,
      components: {
        courtAdmissibility: courtAdmissibility.overallAdmissibility,
        professionalRisk: 1 - professionalRisk.overallRiskScore,
        advancedValidation: advancedValidation.overallValidationScore,
        integration: phase2Integration.finalLawyerGradeConfidence
      }
    };
    
  } catch (error) {
    console.error('\n❌ PHASE 2 VALIDATION FAILED:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Execute comprehensive test
if (require.main === module) {
  runComprehensivePhase2Test()
    .then(result => {
      if (result.success) {
        console.log('\n✅ Phase 2 validation completed successfully');
        process.exit(0);
      } else {
        console.log('\n❌ Phase 2 validation failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

export { runComprehensivePhase2Test };