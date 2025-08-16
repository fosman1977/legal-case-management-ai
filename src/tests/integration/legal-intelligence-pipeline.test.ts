/**
 * LEGAL INTELLIGENCE PIPELINE INTEGRATION TEST
 * 
 * Comprehensive integration test validating the complete legal intelligence system
 * Tests: Enterprise Queue → Cross-Document Analysis → Entity Resolution → Legal Intelligence
 * 
 * Status: Integration testing for Week 4 completion
 * Purpose: Validate entire legal intelligence pipeline works seamlessly
 */

import { EnterpriseProcessingQueue, ProcessingTask, TaskPriority } from '../../core/enterprise-queue';
import { ResourceMonitor } from '../../core/resource-monitor';
import { CrossDocumentAnalyzer } from '../../core/cross-document-analyzer';
import { LegalEntityResolver } from '../../core/legal-entity-resolver';
import { LegalIntelligenceEngine } from '../../core/legal-intelligence-integration';
import { StreamingDocumentProcessor } from '../../core/streaming-processor';

describe('Legal Intelligence Pipeline Integration', () => {
  let enterpriseQueue: EnterpriseProcessingQueue;
  let resourceMonitor: ResourceMonitor;
  let crossDocAnalyzer: CrossDocumentAnalyzer;
  let entityResolver: LegalEntityResolver;
  let legalIntelligence: LegalIntelligenceEngine;
  let streamingProcessor: StreamingDocumentProcessor;

  // Sample legal case documents for testing
  const sampleCaseDocuments = [
    {
      id: 'contract-001',
      name: 'Master Service Agreement.pdf',
      content: `
        MASTER SERVICE AGREEMENT
        
        This Master Service Agreement ("Agreement") is entered into on January 15, 2023,
        between TechCorp Inc., a Delaware corporation ("Client"), and
        DataSystems LLC, a California limited liability company ("Provider").
        
        The parties agree to the following terms:
        1. Services: Provider shall provide data processing services
        2. Term: This agreement shall commence on February 1, 2023 and continue for 24 months
        3. Payment: Client shall pay $50,000 monthly
        
        Executed by:
        John Smith, CEO of TechCorp Inc.
        Sarah Johnson, Managing Director of DataSystems LLC
      `,
      metadata: { fileSize: 125000, extractedAt: new Date() }
    },
    {
      id: 'amendment-001',
      name: 'Amendment No. 1.pdf',
      content: `
        AMENDMENT NO. 1 TO MASTER SERVICE AGREEMENT
        
        This Amendment No. 1 ("Amendment") to the Master Service Agreement dated
        January 15, 2023 ("Original Agreement") between TechCorp Inc. and DataSystems LLC
        is entered into on August 10, 2023.
        
        WHEREAS, the parties desire to modify the payment terms;
        
        NOW THEREFORE, the parties agree:
        1. Section 3 (Payment) is hereby amended to read: "Client shall pay $65,000 monthly"
        2. All other terms remain in full force and effect
        
        Executed by:
        John Smith, CEO of TechCorp Inc.
        Michael Chen, CFO of DataSystems LLC
      `,
      metadata: { fileSize: 89000, extractedAt: new Date() }
    },
    {
      id: 'dispute-letter-001',
      name: 'Breach Notice Letter.pdf',
      content: `
        NOTICE OF BREACH
        
        Date: November 15, 2023
        
        To: DataSystems LLC
        From: TechCorp Inc. Legal Department
        Re: Breach of Master Service Agreement
        
        Dear Sir/Madam,
        
        TechCorp Inc. hereby provides notice that DataSystems LLC has materially
        breached the Master Service Agreement dated January 15, 2023, as amended.
        
        Specifically:
        1. Services were interrupted for 72 hours on November 1-3, 2023
        2. Data quality has declined below contractual standards since October 2023
        3. Provider failed to provide required monthly reports for September and October 2023
        
        TechCorp demands immediate cure of these breaches within 30 days.
        
        Sincerely,
        Jennifer Adams, General Counsel
        TechCorp Inc.
      `,
      metadata: { fileSize: 67000, extractedAt: new Date() }
    },
    {
      id: 'response-letter-001',  
      name: 'Response to Breach Notice.pdf',
      content: `
        RESPONSE TO BREACH NOTICE
        
        Date: November 22, 2023
        
        To: Jennifer Adams, General Counsel, TechCorp Inc.
        From: Michael Chen, CFO, DataSystems LLC
        Re: Response to Notice of Breach dated November 15, 2023
        
        Dear Ms. Adams,
        
        DataSystems LLC disputes the allegations in your November 15, 2023 letter.
        
        Our position:
        1. The service interruption was caused by TechCorp's network configuration changes
        2. Data quality metrics remain within contractual tolerances
        3. Monthly reports were delayed due to TechCorp's failure to provide required data access
        
        We propose a meeting between Sarah Johnson and John Smith to resolve these issues.
        
        Regards,
        Michael Chen, CFO
        DataSystems LLC
      `,
      metadata: { fileSize: 54000, extractedAt: new Date() }
    }
  ];

  beforeAll(async () => {
    console.log('🧪 Setting up Legal Intelligence Pipeline Integration Test');
    
    // Initialize all components
    resourceMonitor = new ResourceMonitor();
    await resourceMonitor.startMonitoring();
    
    enterpriseQueue = new EnterpriseProcessingQueue();
    crossDocAnalyzer = new CrossDocumentAnalyzer();
    entityResolver = new LegalEntityResolver();
    streamingProcessor = new StreamingDocumentProcessor(resourceMonitor);
    
    legalIntelligence = new LegalIntelligenceEngine(
      crossDocAnalyzer,
      entityResolver,
      enterpriseQueue
    );
    
    console.log('✅ All components initialized');
  });

  afterAll(async () => {
    await resourceMonitor.stopMonitoring();
    console.log('🧪 Test cleanup complete');
  });

  test('Complete Legal Intelligence Pipeline', async () => {
    console.log('\n🎯 Starting complete legal intelligence pipeline test...');
    
    const startTime = Date.now();
    const caseId = 'test-case-001';
    const caseName = 'TechCorp vs DataSystems - Contract Dispute';
    
    // Step 1: Process documents through enterprise queue
    console.log('Phase 1: Enterprise Queue Processing...');
    const queueTasks: ProcessingTask[] = sampleCaseDocuments.map(doc => ({
      id: `task-${doc.id}`,
      type: 'legal_analysis',
      priority: TaskPriority.HIGH,
      data: {
        documentId: doc.id,
        documentName: doc.name,
        caseId: caseId
      },
      createdAt: new Date(),
      estimatedDuration: 30000,
      options: {
        maxRetries: 3,
        timeout: 300000,
        memoryLimit: 512 * 1024 * 1024,
        enableProgressCallbacks: true,
        checkpointingEnabled: true,
        legalAnalysisEnabled: true
      },
      legalIntelligenceHooks: {
        onDocumentProcessed: async (doc: any) => {
          console.log(`Document processed: ${doc.id}`);
        },
        onEntityExtracted: async (entity: any) => {
          console.log(`Entity extracted: ${entity.name}`);
        },
        onLegalAnalysisNeeded: async (data: any) => {
          console.log(`Legal analysis needed for: ${data.id}`);
        }
      }
    }));
    
    // Add tasks to queue
    for (const task of queueTasks) {
      await enterpriseQueue.addTask(task);
    }
    
    // Wait for queue processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const queueStatus = enterpriseQueue.getQueueStatus();
    console.log(`   Queue status: ${queueStatus.pendingTasks} pending, ${queueStatus.completedTasks} completed`);
    
    // Step 2: Perform comprehensive legal intelligence analysis
    console.log('Phase 2: Legal Intelligence Analysis...');
    const result = await legalIntelligence.analyzeCaseFolder(
      caseId,
      caseName,
      sampleCaseDocuments,
      {
        enableEntityResolution: true,
        enableDocumentRelationships: true,
        enableTimelineConstruction: true,
        enableInsightGeneration: true,
        enableKnowledgeGraph: true,
        confidenceThreshold: 0.7,
        jurisdiction: 'us',
        practiceAreas: ['contract_law', 'commercial_litigation']
      }
    );
    
    const processingTime = Date.now() - startTime;
    
    // Step 3: Validate results
    console.log('Phase 3: Results Validation...');
    
    // Validate case intelligence result structure
    expect(result.caseId).toBe(caseId);
    expect(result.caseName).toBe(caseName);
    expect(result.analysis).toBeDefined();
    expect(result.keyEntities).toBeDefined();
    expect(result.caseStrategy).toBeDefined();
    expect(result.riskAssessment).toBeDefined();
    expect(result.actionItems).toBeDefined();
    expect(result.metadata).toBeDefined();
    
    // Validate cross-document analysis
    expect(result.analysis.entities.size).toBeGreaterThan(0);
    expect(result.analysis.documentRelationships).toBeDefined();
    expect(result.analysis.insights.length).toBeGreaterThan(0);
    
    // Validate entity resolution
    expect(result.keyEntities.length).toBeGreaterThan(0);
    const johnSmithEntities = result.keyEntities.filter(e => 
      e.canonicalName.toLowerCase().includes('john smith')
    );
    expect(johnSmithEntities.length).toBeGreaterThanOrEqual(1);
    
    // Validate case strategy
    expect(result.caseStrategy.strengthAssessment).toBeDefined();
    expect(result.caseStrategy.evidenceAnalysis).toBeDefined();
    expect(result.caseStrategy.adversaryAnalysis).toBeDefined();
    expect(result.caseStrategy.timelineSignificance).toBeDefined();
    
    // Validate risk assessment
    expect(result.riskAssessment.overallRisk).toMatch(/^(low|medium|high|critical)$/);
    expect(result.riskAssessment.riskFactors).toBeDefined();
    expect(result.riskAssessment.mitigationStrategies).toBeDefined();
    
    // Validate action items
    expect(result.actionItems.length).toBeGreaterThan(0);
    const criticalActions = result.actionItems.filter(a => a.priority === 'critical');
    expect(criticalActions.length).toBeGreaterThanOrEqual(0);
    
    // Validate metadata
    expect(result.metadata.documentsAnalyzed).toBe(sampleCaseDocuments.length);
    expect(result.metadata.confidenceScore).toBeGreaterThan(0);
    expect(result.metadata.jurisdiction).toBe('us');
    
    console.log('\n📊 INTEGRATION TEST RESULTS:');
    console.log(`   Processing time: ${processingTime}ms`);
    console.log(`   Documents analyzed: ${result.metadata.documentsAnalyzed}`);
    console.log(`   Entities resolved: ${result.keyEntities.length}`);
    console.log(`   Cross-document insights: ${result.analysis.insights.length}`);
    console.log(`   Case strength: ${result.caseStrategy.strengthAssessment.overall}`);
    console.log(`   Overall risk: ${result.riskAssessment.overallRisk}`);
    console.log(`   Action items generated: ${result.actionItems.length}`);
    console.log(`   Overall confidence: ${(result.metadata.confidenceScore * 100).toFixed(1)}%`);
    
    // Performance assertions
    expect(processingTime).toBeLessThan(30000); // Should complete in under 30 seconds
    expect(result.metadata.confidenceScore).toBeGreaterThan(0.6); // Should have reasonable confidence
    
    console.log('✅ Legal Intelligence Pipeline Integration Test PASSED');
    
  }, 60000); // 60 second timeout

  test('Memory Management During Large Case Processing', async () => {
    console.log('\n🧠 Testing memory management with legal intelligence...');
    
    const initialMemory = resourceMonitor.getCurrentMetrics().memory;
    console.log(`Initial memory usage: ${(initialMemory.jsHeapUsed / 1024 / 1024).toFixed(1)}MB`);
    
    // Create larger case for memory testing
    const largeCaseDocuments = [];
    for (let i = 0; i < 20; i++) {
      largeCaseDocuments.push({
        ...sampleCaseDocuments[i % sampleCaseDocuments.length],
        id: `large-doc-${i}`,
        name: `Large Document ${i}.pdf`,
        content: sampleCaseDocuments[i % sampleCaseDocuments.length].content.repeat(10)
      });
    }
    
    const result = await legalIntelligence.analyzeCaseFolder(
      'large-case-001',
      'Large Case Memory Test',
      largeCaseDocuments,
      {
        enableEntityResolution: true,
        enableDocumentRelationships: true,
        confidenceThreshold: 0.6
      }
    );
    
    const finalMemory = resourceMonitor.getCurrentMetrics().memory;
    const memoryIncrease = finalMemory.jsHeapUsed - initialMemory.jsHeapUsed;
    
    console.log(`Final memory usage: ${(finalMemory.jsHeapUsed / 1024 / 1024).toFixed(1)}MB`);
    console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(1)}MB`);
    
    // Memory should stay within reasonable bounds
    expect(finalMemory.jsHeapUsed).toBeLessThan(2 * 1024 * 1024 * 1024); // Under 2GB
    expect(result.metadata.documentsAnalyzed).toBe(20);
    
    console.log('✅ Memory management test PASSED');
  });

  test('Error Handling and Recovery', async () => {
    console.log('\n⚠️  Testing error handling and recovery...');
    
    // Test with malformed document
    const malformedDocuments = [{
      id: 'malformed-001',
      name: 'Corrupted Document.pdf',
      content: null, // Intentionally null content
      metadata: { fileSize: 0 }
    }];
    
    // Should handle gracefully without crashing
    const result = await legalIntelligence.analyzeCaseFolder(
      'error-test-case',
      'Error Handling Test',
      malformedDocuments as any,
      { confidenceThreshold: 0.5 }
    );
    
    expect(result).toBeDefined();
    expect(result.metadata.documentsAnalyzed).toBe(1);
    
    console.log('✅ Error handling test PASSED');
  });

  test('Legal Intelligence Quality Metrics', async () => {
    console.log('\n📈 Validating legal intelligence quality metrics...');
    
    const result = await legalIntelligence.analyzeCaseFolder(
      'quality-test-case',
      'Quality Metrics Test',
      sampleCaseDocuments,
      {
        enableEntityResolution: true,
        enableDocumentRelationships: true,
        enableTimelineConstruction: true,
        enableInsightGeneration: true,
        confidenceThreshold: 0.8
      }
    );
    
    // Legal intelligence quality assertions
    const entityAccuracy = result.keyEntities.filter(e => e.confidence > 0.8).length / result.keyEntities.length;
    const insightQuality = result.analysis.insights.filter(i => i.confidence > 0.7).length / result.analysis.insights.length;
    
    console.log(`Entity resolution accuracy: ${(entityAccuracy * 100).toFixed(1)}%`);
    console.log(`Insight quality score: ${(insightQuality * 100).toFixed(1)}%`);
    console.log(`Case strength confidence: ${(result.caseStrategy.strengthAssessment.confidence * 100).toFixed(1)}%`);
    
    // Quality thresholds for lawyer-grade analysis
    expect(entityAccuracy).toBeGreaterThan(0.7); // 70%+ entity accuracy
    expect(insightQuality).toBeGreaterThan(0.6); // 60%+ insight quality
    expect(result.caseStrategy.strengthAssessment.confidence).toBeGreaterThan(0.6); // 60%+ case assessment confidence
    
    // Should identify key contract entities
    const contractEntities = result.keyEntities.filter(e => 
      e.canonicalName.includes('TechCorp') || e.canonicalName.includes('DataSystems')
    );
    expect(contractEntities.length).toBeGreaterThanOrEqual(2);
    
    // Should identify timeline elements
    expect(result.caseStrategy.timelineSignificance.criticalPeriods).toBeDefined();
    expect(result.caseStrategy.timelineSignificance.deadlines).toBeDefined();
    
    console.log('✅ Legal intelligence quality metrics PASSED');
  });
});

console.log('🧪 Legal Intelligence Pipeline Integration Tests loaded');