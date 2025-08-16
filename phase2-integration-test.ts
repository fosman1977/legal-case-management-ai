/**
 * PHASE 2 INTEGRATION TEST SUITE
 * 
 * Real-world integration testing of Phase 2 professional enhancement system
 * Tests complete pipeline: Phase 1 → Phase 2 → Professional deployment validation
 */

import { createEnhancedLegalAnalysisIntegrator } from './src/core/enhanced-legal-analysis-integration';
import { EnhancedAIAnalysisResult } from './src/utils/optimizedAIAnalysis';

interface TestResult {
  testName: string;
  passed: boolean;
  confidence: number;
  duration: number;
  details: any;
  error?: string;
}

class Phase2IntegrationTester {
  private testResults: TestResult[] = [];
  
  async runComprehensiveTest(): Promise<void> {
    console.log('🔬 PHASE 2 INTEGRATION TEST SUITE');
    console.log('=====================================\n');
    
    // Test 1: Basic Phase 2 Integration
    await this.testBasicPhase2Integration();
    
    // Test 2: Contract Analysis Pipeline
    await this.testContractAnalysisPipeline();
    
    // Test 3: Professional Confidence Achievement
    await this.testProfessionalConfidenceAchievement();
    
    // Test 4: Court Admissibility Validation
    await this.testCourtAdmissibilityValidation();
    
    // Test 5: Performance Benchmarking
    await this.testPerformanceBenchmark();
    
    // Generate final report
    this.generateTestReport();
  }
  
  private async testBasicPhase2Integration(): Promise<void> {
    const testName = 'Basic Phase 2 Integration';
    console.log(`🧪 Running: ${testName}...`);
    const startTime = Date.now();
    
    try {
      const integrator = createEnhancedLegalAnalysisIntegrator();
      
      // Mock basic analysis result
      const mockBasicAnalysis: EnhancedAIAnalysisResult = {
        caseId: 'test-case-001',
        processingStats: {
          documentsProcessed: 3,
          entitiesExtracted: 15,
          processingTimeMs: 1200
        },
        extractionQuality: {
          overall: 0.89,
          entityCompleteness: 0.91,
          textQuality: 0.87
        },
        structuredData: {
          entities: [
            { type: 'person', value: 'John Smith', confidence: 0.92, context: 'CEO of TechCorp Inc.' },
            { type: 'organization', value: 'TechCorp Inc.', confidence: 0.95, context: 'Delaware corporation' },
            { type: 'organization', value: 'DataSystems LLC', confidence: 0.93, context: 'California LLC' }
          ],
          keyPoints: [
            {
              id: 'kp-1',
              caseId: 'test-case-001',
              order: 1,
              point: 'Master Service Agreement execution',
              description: 'Agreement between TechCorp and DataSystems',
              importance: 'high' as const,
              category: 'contract' as const,
              supportingDocs: ['contract-001']
            }
          ],
          timeline: [
            {
              id: 'tl-1',
              caseId: 'test-case-001',
              date: new Date('2023-01-15'),
              event: 'Agreement execution',
              description: 'Master Service Agreement signed',
              documentRefs: ['contract-001'],
              importance: 'high' as const
            }
          ]
        },
        insights: [
          'Contract establishes 24-month service term',
          'Payment terms specify $50,000 monthly',
          'Both parties are properly identified legal entities'
        ],
        recommendations: [
          'Verify corporate authority for signatories',
          'Review payment schedule compliance',
          'Monitor contract performance milestones'
        ]
      };
      
      const mockDocuments = [
        {
          id: 'contract-001',
          name: 'Master Service Agreement.pdf',
          content: `MASTER SERVICE AGREEMENT
          This Agreement is entered into on January 15, 2023, between TechCorp Inc. and DataSystems LLC.
          Term: 24 months commencing February 1, 2023
          Payment: $50,000 monthly`
        }
      ];
      
      // Run Phase 2 enhancement
      const enhancedResult = await integrator.enhanceAIAnalysis(
        mockBasicAnalysis,
        mockDocuments,
        'test-case-001',
        {
          enableIRAC: true,
          enableDefensibility: true,
          enableUncertaintyQuantification: true,
          targetConfidence: 0.95,
          jurisdiction: 'federal',
          practiceArea: 'contract_law'
        }
      );
      
      const duration = Date.now() - startTime;
      const passed = enhancedResult.lawyerGradeConfidence > 0.89; // Should improve from baseline
      
      this.testResults.push({
        testName,
        passed,
        confidence: enhancedResult.lawyerGradeConfidence,
        duration,
        details: {
          iracIssues: enhancedResult.iracAnalysis.issues.length,
          professionalReadiness: enhancedResult.professionalReadiness.readinessLevel,
          uncertaintyFactors: enhancedResult.uncertaintyQuantification.uncertaintyFactors.length
        }
      });
      
      console.log(`   ✅ Enhanced confidence: ${(enhancedResult.lawyerGradeConfidence * 100).toFixed(1)}%`);
      console.log(`   ✅ Professional readiness: ${enhancedResult.professionalReadiness.readinessLevel}`);
      console.log(`   ✅ IRAC issues identified: ${enhancedResult.iracAnalysis.issues.length}`);
      console.log(`   ⏱️  Duration: ${duration}ms\n`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        testName,
        passed: false,
        confidence: 0,
        duration,
        details: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log(`   ❌ Test failed: ${error}\n`);
    }
  }
  
  private async testContractAnalysisPipeline(): Promise<void> {
    const testName = 'Contract Analysis Pipeline';
    console.log(`🧪 Running: ${testName}...`);
    const startTime = Date.now();
    
    try {
      const integrator = createEnhancedLegalAnalysisIntegrator();
      
      // More complex contract scenario
      const complexContractAnalysis: EnhancedAIAnalysisResult = {
        caseId: 'contract-dispute-001',
        processingStats: {
          documentsProcessed: 5,
          entitiesExtracted: 25,
          processingTimeMs: 2400
        },
        extractionQuality: {
          overall: 0.92,
          entityCompleteness: 0.94,
          textQuality: 0.90
        },
        structuredData: {
          entities: [
            { type: 'person', value: 'Michael Johnson', confidence: 0.94, context: 'Contract signatory' },
            { type: 'organization', value: 'GlobalTech Solutions', confidence: 0.96, context: 'Service provider' },
            { type: 'date', value: '2023-03-15', confidence: 0.98, context: 'Contract termination date' },
            { type: 'money', value: '$250,000', confidence: 0.97, context: 'Breach penalty amount' }
          ],
          keyPoints: [
            {
              id: 'kp-1',
              caseId: 'contract-dispute-001',
              order: 1,
              point: 'Material breach of contract',
              description: 'Failure to deliver services per specifications',
              importance: 'critical' as const,
              category: 'breach' as const,
              supportingDocs: ['notice-001', 'contract-001']
            }
          ],
          timeline: [
            {
              id: 'tl-1',
              caseId: 'contract-dispute-001',
              date: new Date('2023-03-15'),
              event: 'Breach notification',
              description: 'Client notified provider of material breach',
              documentRefs: ['notice-001'],
              importance: 'critical' as const
            }
          ]
        },
        insights: [
          'Material breach established with supporting documentation',
          'Penalty clause applies - $250,000 damages',
          'Proper notice procedures followed'
        ],
        recommendations: [
          'Prepare breach of contract lawsuit',
          'Document all damages and mitigation efforts',
          'Consider settlement negotiations'
        ]
      };
      
      const contractDocuments = [
        {
          id: 'contract-001',
          name: 'Service Agreement.pdf',
          content: 'Service delivery requirements and penalty clauses for non-performance'
        },
        {
          id: 'notice-001',
          name: 'Breach Notice.pdf',
          content: 'Formal notice of material breach and demand for cure'
        }
      ];
      
      const enhancedResult = await integrator.enhanceAIAnalysis(
        complexContractAnalysis,
        contractDocuments,
        'contract-dispute-001',
        {
          targetConfidence: 0.95,
          jurisdiction: 'california',
          practiceArea: 'contract_law'
        }
      );
      
      const duration = Date.now() - startTime;
      const passed = enhancedResult.lawyerGradeConfidence >= 0.93; // Higher standard for complex cases
      
      this.testResults.push({
        testName,
        passed,
        confidence: enhancedResult.lawyerGradeConfidence,
        duration,
        details: {
          iracCompliance: enhancedResult.iracAnalysis.methodologyCompliance,
          professionalReadiness: enhancedResult.professionalReadiness.readinessLevel,
          uncertaintyReduction: 1 - enhancedResult.uncertaintyQuantification.reliabilityAssessment.overallReliability
        }
      });
      
      console.log(`   ✅ Contract analysis confidence: ${(enhancedResult.lawyerGradeConfidence * 100).toFixed(1)}%`);
      console.log(`   ✅ IRAC methodology compliance: ${(enhancedResult.iracAnalysis.methodologyCompliance * 100).toFixed(1)}%`);
      console.log(`   ✅ Professional readiness: ${enhancedResult.professionalReadiness.readinessLevel}`);
      console.log(`   ⏱️  Duration: ${duration}ms\n`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        testName,
        passed: false,
        confidence: 0,
        duration,
        details: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log(`   ❌ Test failed: ${error}\n`);
    }
  }
  
  private async testProfessionalConfidenceAchievement(): Promise<void> {
    const testName = 'Professional Confidence Achievement (95%+ Target)';
    console.log(`🧪 Running: ${testName}...`);
    const startTime = Date.now();
    
    try {
      const integrator = createEnhancedLegalAnalysisIntegrator();
      
      // High-quality baseline for professional confidence test
      const highQualityAnalysis: EnhancedAIAnalysisResult = {
        caseId: 'professional-test-001',
        processingStats: {
          documentsProcessed: 7,
          entitiesExtracted: 35,
          processingTimeMs: 3200
        },
        extractionQuality: {
          overall: 0.94,
          entityCompleteness: 0.96,
          textQuality: 0.92
        },
        structuredData: {
          entities: [
            { type: 'person', value: 'Judge Patricia Williams', confidence: 0.97, context: 'Presiding judge' },
            { type: 'organization', value: 'Federal District Court', confidence: 0.98, context: 'Venue' },
            { type: 'case_number', value: '2023-CV-1234', confidence: 0.99, context: 'Case identifier' }
          ],
          keyPoints: [
            {
              id: 'kp-1',
              caseId: 'professional-test-001',
              order: 1,
              point: 'Federal jurisdiction established',
              description: 'Diversity jurisdiction with amount in controversy exceeding $75,000',
              importance: 'critical' as const,
              category: 'jurisdiction' as const,
              supportingDocs: ['complaint-001']
            }
          ],
          timeline: [
            {
              id: 'tl-1',
              caseId: 'professional-test-001',
              date: new Date('2023-08-01'),
              event: 'Complaint filed',
              description: 'Federal lawsuit initiated',
              documentRefs: ['complaint-001'],
              importance: 'critical' as const
            }
          ]
        },
        insights: [
          'Clear federal jurisdiction basis established',
          'Procedural requirements properly satisfied',
          'Strong legal foundation for proceeding'
        ],
        recommendations: [
          'Proceed with federal litigation strategy',
          'Prepare for motion practice',
          'Consider early settlement discussions'
        ]
      };
      
      const professionalDocuments = [
        {
          id: 'complaint-001',
          name: 'Federal Complaint.pdf',
          content: 'Federal court complaint establishing diversity jurisdiction and damages over $75,000'
        }
      ];
      
      const enhancedResult = await integrator.enhanceAIAnalysis(
        highQualityAnalysis,
        professionalDocuments,
        'professional-test-001',
        {
          targetConfidence: 0.95,
          jurisdiction: 'federal',
          practiceArea: 'civil_litigation',
          enableIRAC: true,
          enableDefensibility: true,
          enableUncertaintyQuantification: true
        }
      );
      
      const duration = Date.now() - startTime;
      const targetAchieved = enhancedResult.lawyerGradeConfidence >= 0.95;
      
      this.testResults.push({
        testName,
        passed: targetAchieved,
        confidence: enhancedResult.lawyerGradeConfidence,
        duration,
        details: {
          target: 0.95,
          achieved: enhancedResult.lawyerGradeConfidence,
          improvement: enhancedResult.lawyerGradeConfidence - highQualityAnalysis.extractionQuality.overall,
          professionalReadiness: enhancedResult.professionalReadiness.readinessLevel
        }
      });
      
      console.log(`   🎯 Target: 95.0%`);
      console.log(`   ✅ Achieved: ${(enhancedResult.lawyerGradeConfidence * 100).toFixed(1)}%`);
      console.log(`   📈 Improvement: +${((enhancedResult.lawyerGradeConfidence - highQualityAnalysis.extractionQuality.overall) * 100).toFixed(1)}%`);
      console.log(`   ${targetAchieved ? '🏆 PROFESSIONAL TARGET ACHIEVED' : '⚠️  Professional target not met'}`);
      console.log(`   ⏱️  Duration: ${duration}ms\n`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        testName,
        passed: false,
        confidence: 0,
        duration,
        details: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log(`   ❌ Test failed: ${error}\n`);
    }
  }
  
  private async testCourtAdmissibilityValidation(): Promise<void> {
    const testName = 'Court Admissibility Validation';
    console.log(`🧪 Running: ${testName}...`);
    const startTime = Date.now();
    
    try {
      // Test court admissibility framework directly
      const { courtAdmissibilityFramework } = await import('./src/core/court-admissibility-framework');
      
      const mockAnalysisResults = {
        confidence: 0.93,
        iracAnalysis: { issues: ['Evidence admissibility'], rules: ['Federal Rules of Evidence'] },
        professionalDefensibility: { defensibilityScore: 0.91 },
        uncertaintyQuantification: { overallUncertainty: 0.08 }
      };
      
      const mockUncertaintyQuantification = {
        confidenceInterval: {
          pointEstimate: 0.93,
          lowerBound: 0.88,
          upperBound: 0.98,
          confidenceLevel: 0.95,
          intervalWidth: 0.10,
          precision: 'high' as const
        },
        uncertaintyFactors: [],
        statisticalMetrics: {
          sampleSize: 150,
          variance: 0.015,
          standardDeviation: 0.12,
          standardError: 0.01,
          marginOfError: 0.05,
          reliability: 0.92,
          validity: 0.90
        },
        reliabilityAssessment: {
          overallReliability: 0.92,
          componentReliabilities: [],
          riskLevel: 'low' as const,
          professionalAcceptability: 'high' as const,
          recommendations: []
        },
        recommendedActions: []
      };
      
      const admissibilityAssessment = await courtAdmissibilityFramework.assessCourtAdmissibility(
        mockAnalysisResults,
        mockUncertaintyQuantification,
        {
          jurisdiction: 'federal',
          courtType: 'federal',
          caseType: 'civil_litigation',
          expertWitnessRequired: true
        }
      );
      
      const duration = Date.now() - startTime;
      const passed = admissibilityAssessment.overallAdmissibility >= 0.85;
      
      this.testResults.push({
        testName,
        passed,
        confidence: admissibilityAssessment.overallAdmissibility,
        duration,
        details: {
          daubertCompliance: admissibilityAssessment.daubertCompliance.complianceLevel,
          fryeCompliance: admissibilityAssessment.fryeCompliance.complianceLevel,
          deploymentClearance: admissibilityAssessment.deploymentClearance.clearanceLevel,
          expertWitnessReady: admissibilityAssessment.expertWitnessReadiness.readinessLevel
        }
      });
      
      console.log(`   ⚖️  Overall admissibility: ${(admissibilityAssessment.overallAdmissibility * 100).toFixed(1)}%`);
      console.log(`   📊 Daubert compliance: ${admissibilityAssessment.daubertCompliance.complianceLevel}`);
      console.log(`   📋 Deployment clearance: ${admissibilityAssessment.deploymentClearance.clearanceLevel}`);
      console.log(`   👨‍⚖️ Expert witness: ${admissibilityAssessment.expertWitnessReadiness.readinessLevel}`);
      console.log(`   ⏱️  Duration: ${duration}ms\n`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        testName,
        passed: false,
        confidence: 0,
        duration,
        details: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log(`   ❌ Test failed: ${error}\n`);
    }
  }
  
  private async testPerformanceBenchmark(): Promise<void> {
    const testName = 'Performance Benchmark';
    console.log(`🧪 Running: ${testName}...`);
    const startTime = Date.now();
    
    try {
      const integrator = createEnhancedLegalAnalysisIntegrator();
      
      // Run multiple iterations to get average performance
      const iterations = 5;
      const performanceTimes: number[] = [];
      let totalConfidence = 0;
      
      for (let i = 0; i < iterations; i++) {
        const iterationStart = Date.now();
        
        const testAnalysis: EnhancedAIAnalysisResult = {
          caseId: `perf-test-${i}`,
          processingStats: {
            documentsProcessed: 4,
            entitiesExtracted: 20,
            processingTimeMs: 1800
          },
          extractionQuality: {
            overall: 0.90,
            entityCompleteness: 0.92,
            textQuality: 0.88
          },
          structuredData: {
            entities: [
              { type: 'person', value: 'Test Person', confidence: 0.90, context: 'Performance test' }
            ],
            keyPoints: [
              {
                id: 'kp-perf',
                caseId: `perf-test-${i}`,
                order: 1,
                point: 'Performance benchmark point',
                description: 'Testing processing speed',
                importance: 'medium' as const,
                category: 'test' as const,
                supportingDocs: []
              }
            ],
            timeline: []
          },
          insights: ['Performance test insight'],
          recommendations: ['Performance test recommendation']
        };
        
        const result = await integrator.enhanceAIAnalysis(
          testAnalysis,
          [{ id: 'test-doc', name: 'test.pdf', content: 'Performance test document' }],
          `perf-test-${i}`,
          { targetConfidence: 0.95 }
        );
        
        const iterationTime = Date.now() - iterationStart;
        performanceTimes.push(iterationTime);
        totalConfidence += result.lawyerGradeConfidence;
      }
      
      const duration = Date.now() - startTime;
      const avgTime = performanceTimes.reduce((a, b) => a + b, 0) / iterations;
      const avgConfidence = totalConfidence / iterations;
      const passed = avgTime < 5000; // Should complete within 5 seconds on average
      
      this.testResults.push({
        testName,
        passed,
        confidence: avgConfidence,
        duration,
        details: {
          iterations,
          averageTime: avgTime,
          totalTime: duration,
          averageConfidence: avgConfidence,
          performanceTimes
        }
      });
      
      console.log(`   ⚡ Iterations: ${iterations}`);
      console.log(`   ⏱️  Average time: ${avgTime.toFixed(0)}ms`);
      console.log(`   📊 Average confidence: ${(avgConfidence * 100).toFixed(1)}%`);
      console.log(`   🏃 Performance: ${passed ? 'ACCEPTABLE' : 'NEEDS OPTIMIZATION'}`);
      console.log(`   ⏱️  Total duration: ${duration}ms\n`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        testName,
        passed: false,
        confidence: 0,
        duration,
        details: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log(`   ❌ Test failed: ${error}\n`);
    }
  }
  
  private generateTestReport(): void {
    console.log('📊 INTEGRATION TEST REPORT');
    console.log('==========================\n');
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(t => t.passed).length;
    const failedTests = totalTests - passedTests;
    const averageConfidence = this.testResults.reduce((sum, t) => sum + t.confidence, 0) / totalTests;
    const totalDuration = this.testResults.reduce((sum, t) => sum + t.duration, 0);
    
    console.log(`🧪 Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`📈 Average Confidence: ${(averageConfidence * 100).toFixed(1)}%`);
    console.log(`⏱️  Total Duration: ${totalDuration}ms`);
    console.log(`🎯 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);
    
    console.log('📋 Test Details:');
    this.testResults.forEach(test => {
      const status = test.passed ? '✅' : '❌';
      console.log(`${status} ${test.testName}`);
      console.log(`   Confidence: ${(test.confidence * 100).toFixed(1)}%`);
      console.log(`   Duration: ${test.duration}ms`);
      if (test.error) {
        console.log(`   Error: ${test.error}`);
      }
      console.log('');
    });
    
    // Professional deployment assessment
    const professionalReadyTests = this.testResults.filter(t => t.confidence >= 0.95).length;
    const professionalReadiness = (professionalReadyTests / totalTests) * 100;
    
    console.log('🏆 PROFESSIONAL DEPLOYMENT ASSESSMENT:');
    console.log(`   95%+ Confidence Tests: ${professionalReadyTests}/${totalTests}`);
    console.log(`   Professional Readiness: ${professionalReadiness.toFixed(1)}%`);
    
    if (professionalReadiness >= 80) {
      console.log('   🎉 READY FOR PROFESSIONAL DEPLOYMENT');
    } else if (professionalReadiness >= 60) {
      console.log('   ⚠️  NEEDS OPTIMIZATION BEFORE DEPLOYMENT');
    } else {
      console.log('   ❌ NOT READY FOR PROFESSIONAL DEPLOYMENT');
    }
  }
}

// Execute integration tests
async function runPhase2IntegrationTests() {
  const tester = new Phase2IntegrationTester();
  await tester.runComprehensiveTest();
}

if (require.main === module) {
  runPhase2IntegrationTests()
    .then(() => {
      console.log('\n✅ Phase 2 integration testing complete');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Integration testing failed:', error);
      process.exit(1);
    });
}

export { Phase2IntegrationTester, runPhase2IntegrationTests };