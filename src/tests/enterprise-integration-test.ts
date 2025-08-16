/**
 * ENTERPRISE INTEGRATION TEST HARNESS
 * Validates all Week 1 enterprise components working together
 * 
 * Status: Phase 1, Week 1 - Integration Testing
 * Purpose: Ensure enterprise architecture meets performance and reliability targets
 * Tests: Memory usage, processing speed, error recovery, incremental processing
 */

import { enterpriseProcessor } from '../core/enterprise-integration';
import { enterpriseQueue } from '../core/enterprise-queue';
import { enterpriseWorkerPool } from '../workers/enterprise-worker-pool';
import { resourceMonitor } from '../core/resource-monitor';
import { incrementalProcessor } from '../core/incremental-processor';

export interface TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  memoryUsed: number;
  errors: string[];
  details: any;
}

export interface TestSuite {
  name: string;
  tests: TestCase[];
  results: TestResult[];
  summary: TestSummary;
}

export interface TestCase {
  name: string;
  description: string;
  test: () => Promise<TestResult>;
  timeout: number;
  critical: boolean;
}

export interface TestSummary {
  totalTests: number;
  passed: number;
  failed: number;
  criticalFailures: number;
  totalDuration: number;
  peakMemory: number;
  averageMemory: number;
  performanceTargetsMet: boolean;
}

export class EnterpriseIntegrationTester {
  private results: TestResult[] = [];
  private startTime: number = 0;
  private peakMemory: number = 0;

  constructor() {
    console.log('🧪 Enterprise Integration Test Harness initialized');
  }

  /**
   * Run complete integration test suite
   */
  async runFullTestSuite(): Promise<TestSuite> {
    console.log('🚀 Starting Enterprise Integration Test Suite...\n');
    this.startTime = Date.now();

    const suite: TestSuite = {
      name: 'Enterprise Integration Test Suite',
      tests: this.getTestCases(),
      results: [],
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        criticalFailures: 0,
        totalDuration: 0,
        peakMemory: 0,
        averageMemory: 0,
        performanceTargetsMet: false
      }
    };

    // Start resource monitoring
    resourceMonitor.startMonitoring();
    
    // Track memory usage
    const memoryInterval = setInterval(() => {
      const metrics = resourceMonitor.getCurrentMetrics();
      this.peakMemory = Math.max(this.peakMemory, metrics.memory.used);
    }, 1000);

    try {
      // Run each test
      for (const testCase of suite.tests) {
        console.log(`\n📋 Running: ${testCase.name}`);
        console.log(`   ${testCase.description}`);
        
        const result = await this.runTestWithTimeout(testCase);
        suite.results.push(result);
        this.results.push(result);
        
        if (result.passed) {
          console.log(`   ✅ PASSED in ${result.duration}ms`);
        } else {
          console.log(`   ❌ FAILED: ${result.errors.join(', ')}`);
          if (testCase.critical) {
            suite.summary.criticalFailures++;
          }
        }
      }

      // Generate summary
      suite.summary = this.generateSummary(suite.results);
      
      // Print test report
      this.printTestReport(suite);

    } finally {
      clearInterval(memoryInterval);
      resourceMonitor.stopMonitoring();
    }

    return suite;
  }

  /**
   * Get all test cases
   */
  private getTestCases(): TestCase[] {
    return [
      {
        name: 'Component Initialization',
        description: 'Verify all enterprise components initialize correctly',
        test: () => this.testComponentInitialization(),
        timeout: 10000,
        critical: true
      },
      {
        name: 'Single Document Processing',
        description: 'Process a single PDF document through enterprise pipeline',
        test: () => this.testSingleDocumentProcessing(),
        timeout: 30000,
        critical: true
      },
      {
        name: 'Memory Management',
        description: 'Verify memory usage stays under 2GB limit',
        test: () => this.testMemoryManagement(),
        timeout: 60000,
        critical: true
      },
      {
        name: 'Worker Pool Scaling',
        description: 'Test worker pool auto-scaling under load',
        test: () => this.testWorkerPoolScaling(),
        timeout: 30000,
        critical: false
      },
      {
        name: 'Priority Queue Processing',
        description: 'Verify priority-based task processing order',
        test: () => this.testPriorityQueueProcessing(),
        timeout: 30000,
        critical: false
      },
      {
        name: 'Incremental Processing',
        description: 'Test change detection and incremental processing',
        test: () => this.testIncrementalProcessing(),
        timeout: 45000,
        critical: true
      },
      {
        name: 'Error Recovery',
        description: 'Test error handling and recovery mechanisms',
        test: () => this.testErrorRecovery(),
        timeout: 30000,
        critical: true
      },
      {
        name: 'Checkpoint Resume',
        description: 'Test processing resumption from checkpoints',
        test: () => this.testCheckpointResume(),
        timeout: 30000,
        critical: false
      },
      {
        name: 'Resource Monitoring',
        description: 'Verify resource monitoring and alerts',
        test: () => this.testResourceMonitoring(),
        timeout: 20000,
        critical: false
      },
      {
        name: 'Large Folder Processing',
        description: 'Process folder with 100+ documents',
        test: () => this.testLargeFolderProcessing(),
        timeout: 300000, // 5 minutes
        critical: true
      },
      {
        name: 'Legal Intelligence Hooks',
        description: 'Verify legal intelligence integration points',
        test: () => this.testLegalIntelligenceHooks(),
        timeout: 20000,
        critical: false
      },
      {
        name: 'Performance Benchmarks',
        description: 'Validate performance meets enterprise targets',
        test: () => this.testPerformanceBenchmarks(),
        timeout: 60000,
        critical: true
      }
    ];
  }

  /**
   * Test 1: Component Initialization
   */
  private async testComponentInitialization(): Promise<TestResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // Start enterprise processor
      await enterpriseProcessor.start();
      
      // Verify queue is ready
      const queueStatus = enterpriseQueue.getQueueStatus();
      if (queueStatus.totalTasks === undefined) {
        errors.push('Queue not properly initialized');
      }

      // Verify worker pool is ready
      const poolStats = enterpriseWorkerPool.getPoolStatistics();
      if (poolStats.totalWorkers === 0) {
        errors.push('Worker pool has no workers');
      }

      // Verify resource monitor is running
      const metrics = resourceMonitor.getCurrentMetrics();
      if (!metrics.memory || !metrics.cpu) {
        errors.push('Resource monitor not providing metrics');
      }

      // Stop processor
      await enterpriseProcessor.stop();

    } catch (error) {
      errors.push(`Initialization error: ${error.message}`);
    }

    return {
      testName: 'Component Initialization',
      passed: errors.length === 0,
      duration: Date.now() - startTime,
      memoryUsed: resourceMonitor.getCurrentMetrics().memory.used,
      errors,
      details: {
        queueReady: errors.indexOf('Queue') === -1,
        workersReady: errors.indexOf('Worker') === -1,
        monitorReady: errors.indexOf('Resource') === -1
      }
    };
  }

  /**
   * Test 2: Single Document Processing
   */
  private async testSingleDocumentProcessing(): Promise<TestResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      await enterpriseProcessor.start();

      // Create a test PDF file
      const testFile = new File(
        ['Test PDF content for enterprise processing'],
        'test-document.pdf',
        { type: 'application/pdf' }
      );

      // Process the document
      const result = await enterpriseProcessor.processDocument(testFile, {
        priority: 3, // MEDIUM priority
        enableLegalIntelligence: true
      });

      if (result.status !== 'completed') {
        errors.push(`Document processing failed: ${result.status}`);
      }

      await enterpriseProcessor.stop();

    } catch (error) {
      errors.push(`Processing error: ${error.message}`);
    }

    return {
      testName: 'Single Document Processing',
      passed: errors.length === 0,
      duration: Date.now() - startTime,
      memoryUsed: resourceMonitor.getCurrentMetrics().memory.used,
      errors,
      details: {
        documentProcessed: errors.length === 0
      }
    };
  }

  /**
   * Test 3: Memory Management
   */
  private async testMemoryManagement(): Promise<TestResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const memoryLimit = 2 * 1024 * 1024 * 1024; // 2GB

    try {
      await enterpriseProcessor.start();

      // Monitor memory during processing
      let peakMemory = 0;
      const memoryChecks: number[] = [];

      // Create multiple large test files
      const files = [];
      for (let i = 0; i < 10; i++) {
        const largeContent = new Array(10000).fill(`Document ${i} content`).join('\n');
        files.push(new File([largeContent], `large-doc-${i}.pdf`, { type: 'application/pdf' }));
      }

      // Process files and monitor memory
      for (const file of files) {
        await enterpriseProcessor.processDocument(file);
        
        const currentMemory = resourceMonitor.getCurrentMetrics().memory.used;
        memoryChecks.push(currentMemory);
        peakMemory = Math.max(peakMemory, currentMemory);
        
        if (currentMemory > memoryLimit) {
          errors.push(`Memory exceeded limit: ${currentMemory} > ${memoryLimit}`);
          break;
        }
      }

      // Test memory optimization
      const beforeOptimization = resourceMonitor.getCurrentMetrics().memory.used;
      await resourceMonitor.optimizeMemory();
      const afterOptimization = resourceMonitor.getCurrentMetrics().memory.used;
      
      if (afterOptimization >= beforeOptimization) {
        errors.push('Memory optimization did not reduce usage');
      }

      await enterpriseProcessor.stop();

    } catch (error) {
      errors.push(`Memory test error: ${error.message}`);
    }

    return {
      testName: 'Memory Management',
      passed: errors.length === 0,
      duration: Date.now() - startTime,
      memoryUsed: this.peakMemory,
      errors,
      details: {
        peakMemory: this.peakMemory,
        underLimit: this.peakMemory < memoryLimit
      }
    };
  }

  /**
   * Test 4: Worker Pool Scaling
   */
  private async testWorkerPoolScaling(): Promise<TestResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      await enterpriseWorkerPool.start();

      const initialWorkers = enterpriseWorkerPool.getPoolStatistics().totalWorkers;
      
      // Scale up
      await enterpriseWorkerPool.scalePool(initialWorkers + 2);
      const afterScaleUp = enterpriseWorkerPool.getPoolStatistics().totalWorkers;
      
      if (afterScaleUp !== initialWorkers + 2) {
        errors.push('Worker pool did not scale up correctly');
      }

      // Scale down
      await enterpriseWorkerPool.scalePool(initialWorkers);
      const afterScaleDown = enterpriseWorkerPool.getPoolStatistics().totalWorkers;
      
      if (afterScaleDown !== initialWorkers) {
        errors.push('Worker pool did not scale down correctly');
      }

      await enterpriseWorkerPool.stop();

    } catch (error) {
      errors.push(`Scaling error: ${error.message}`);
    }

    return {
      testName: 'Worker Pool Scaling',
      passed: errors.length === 0,
      duration: Date.now() - startTime,
      memoryUsed: resourceMonitor.getCurrentMetrics().memory.used,
      errors,
      details: {
        scalingWorked: errors.length === 0
      }
    };
  }

  /**
   * Test 5: Priority Queue Processing
   */
  private async testPriorityQueueProcessing(): Promise<TestResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const processedOrder: number[] = [];

    try {
      // Track task completion order
      enterpriseQueue.on('taskCompleted', (result) => {
        const priority = result.result?.priority;
        if (priority) processedOrder.push(priority);
      });

      // Add tasks with different priorities
      const tasks = [
        { priority: 5, id: 'low' },     // BACKGROUND
        { priority: 1, id: 'critical' }, // CRITICAL
        { priority: 3, id: 'medium' },   // MEDIUM
        { priority: 2, id: 'high' }      // HIGH
      ];

      for (const task of tasks) {
        await enterpriseQueue.addTask({
          id: task.id,
          type: 'document_extraction',
          priority: task.priority as any,
          data: { test: true },
          options: {
            maxRetries: 1,
            timeout: 5000,
            memoryLimit: 100000,
            enableProgressCallbacks: false,
            checkpointingEnabled: false,
            legalAnalysisEnabled: false
          },
          createdAt: new Date(),
          estimatedDuration: 1000
        });
      }

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Verify priority order (should be 1, 2, 3, 5)
      const expectedOrder = [1, 2, 3, 5];
      if (JSON.stringify(processedOrder) !== JSON.stringify(expectedOrder)) {
        errors.push(`Priority order incorrect: ${processedOrder} vs ${expectedOrder}`);
      }

    } catch (error) {
      errors.push(`Priority test error: ${error.message}`);
    }

    return {
      testName: 'Priority Queue Processing',
      passed: errors.length === 0,
      duration: Date.now() - startTime,
      memoryUsed: resourceMonitor.getCurrentMetrics().memory.used,
      errors,
      details: {
        processedOrder,
        priorityRespected: errors.length === 0
      }
    };
  }

  /**
   * Test 6: Incremental Processing
   */
  private async testIncrementalProcessing(): Promise<TestResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // Create mock folder handle
      const mockFolderHandle = {
        name: 'test-folder',
        kind: 'directory' as const,
        entries: function*() {
          yield ['file1.pdf', { kind: 'file', getFile: async () => new File(['content1'], 'file1.pdf') }];
          yield ['file2.pdf', { kind: 'file', getFile: async () => new File(['content2'], 'file2.pdf') }];
        }
      } as any;

      // First scan
      const initialChanges = await incrementalProcessor.detectChanges(mockFolderHandle);
      
      if (initialChanges.added.length !== 2) {
        errors.push('Initial scan did not detect all files');
      }

      // Second scan (no changes)
      const noChanges = await incrementalProcessor.detectChanges(mockFolderHandle);
      
      if (noChanges.totalChanges !== 0) {
        errors.push('Incremental scan incorrectly detected changes');
      }

      // Process only changes
      const result = await incrementalProcessor.processChangesOnly(
        mockFolderHandle,
        noChanges
      );

      if (result.processedFiles !== 0) {
        errors.push('Processed files when no changes detected');
      }

    } catch (error) {
      errors.push(`Incremental test error: ${error.message}`);
    }

    return {
      testName: 'Incremental Processing',
      passed: errors.length === 0,
      duration: Date.now() - startTime,
      memoryUsed: resourceMonitor.getCurrentMetrics().memory.used,
      errors,
      details: {
        changeDetectionWorked: errors.length === 0
      }
    };
  }

  /**
   * Test 7: Error Recovery
   */
  private async testErrorRecovery(): Promise<TestResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      await enterpriseProcessor.start();

      // Process a file that will fail
      const badFile = new File([''], 'bad-file.xyz', { type: 'application/unknown' });
      
      try {
        await enterpriseProcessor.processDocument(badFile);
        errors.push('Should have thrown error for bad file');
      } catch (error) {
        // Expected error - system should recover
      }

      // Verify system is still operational
      const testFile = new File(['test'], 'good-file.pdf', { type: 'application/pdf' });
      const result = await enterpriseProcessor.processDocument(testFile);
      
      if (result.status === 'failed') {
        errors.push('System did not recover from error');
      }

      await enterpriseProcessor.stop();

    } catch (error) {
      errors.push(`Recovery test error: ${error.message}`);
    }

    return {
      testName: 'Error Recovery',
      passed: errors.length === 0,
      duration: Date.now() - startTime,
      memoryUsed: resourceMonitor.getCurrentMetrics().memory.used,
      errors,
      details: {
        recoverySuccessful: errors.length === 0
      }
    };
  }

  /**
   * Test 8: Checkpoint Resume
   */
  private async testCheckpointResume(): Promise<TestResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // Create a processing state
      const mockState = {
        id: 'test-state',
        folderPath: 'test-folder',
        lastScanTime: new Date(),
        lastProcessingTime: new Date(),
        totalFiles: 10,
        processedFiles: 5,
        fileStates: new Map(),
        processingMetadata: {
          version: '1.0.0',
          processingMode: 'incremental' as const,
          legalIntelligenceEnabled: true,
          searchIndexingEnabled: true,
          lastOptimization: new Date(),
          performanceMetrics: {
            averageProcessingTime: 1000,
            changeDetectionTime: 500,
            incrementalSavings: 2000,
            cacheHitRatio: 0.8,
            errorRate: 0.1,
            throughput: 10
          }
        },
        checkpointData: [{
          id: 'checkpoint-1',
          timestamp: new Date(),
          filesCompleted: 5,
          totalFiles: 10,
          recoverable: true,
          metadata: {}
        }]
      };

      // Save state
      await incrementalProcessor.saveProcessingState(mockState);

      // Resume from checkpoint
      const resumed = await incrementalProcessor.resumeFromCheckpoint('checkpoint-1');
      
      if (!resumed) {
        errors.push('Failed to resume from checkpoint');
      }

    } catch (error) {
      errors.push(`Checkpoint test error: ${error.message}`);
    }

    return {
      testName: 'Checkpoint Resume',
      passed: errors.length === 0,
      duration: Date.now() - startTime,
      memoryUsed: resourceMonitor.getCurrentMetrics().memory.used,
      errors,
      details: {
        checkpointingWorked: errors.length === 0
      }
    };
  }

  /**
   * Test 9: Resource Monitoring
   */
  private async testResourceMonitoring(): Promise<TestResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const alerts: any[] = [];

    try {
      // Listen for resource alerts
      resourceMonitor.on('resourceAlert', (alert) => {
        alerts.push(alert);
      });

      resourceMonitor.startMonitoring();

      // Get metrics
      const metrics = resourceMonitor.getCurrentMetrics();
      
      if (!metrics.memory || !metrics.cpu || !metrics.disk) {
        errors.push('Incomplete resource metrics');
      }

      // Check memory availability
      const memCheck = await resourceMonitor.checkMemoryAvailable(500);
      
      if (memCheck.available === undefined) {
        errors.push('Memory availability check failed');
      }

      // Get system load score
      const loadScore = resourceMonitor.getSystemLoadScore();
      
      if (loadScore < 0 || loadScore > 1) {
        errors.push(`Invalid load score: ${loadScore}`);
      }

      // Get throttle recommendation
      const throttle = resourceMonitor.getRecommendedThrottleLevel();
      
      if (!['none', 'light', 'moderate', 'heavy'].includes(throttle)) {
        errors.push(`Invalid throttle level: ${throttle}`);
      }

      resourceMonitor.stopMonitoring();

    } catch (error) {
      errors.push(`Monitoring test error: ${error.message}`);
    }

    return {
      testName: 'Resource Monitoring',
      passed: errors.length === 0,
      duration: Date.now() - startTime,
      memoryUsed: resourceMonitor.getCurrentMetrics().memory.used,
      errors,
      details: {
        alertsReceived: alerts.length,
        monitoringWorked: errors.length === 0
      }
    };
  }

  /**
   * Test 10: Large Folder Processing (100+ documents)
   */
  private async testLargeFolderProcessing(): Promise<TestResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // Create mock folder with 100 files
      const files = [];
      for (let i = 0; i < 100; i++) {
        files.push([
          `doc-${i}.pdf`,
          { 
            kind: 'file' as const,
            getFile: async () => new File(
              [`Document ${i} content`],
              `doc-${i}.pdf`,
              { type: 'application/pdf' }
            )
          }
        ]);
      }

      const mockLargeFolderHandle = {
        name: 'large-test-folder',
        kind: 'directory' as const,
        entries: function*() {
          for (const file of files) {
            yield file;
          }
        }
      } as any;

      await enterpriseProcessor.start();

      // Process the folder
      const folderStartTime = Date.now();
      const result = await enterpriseProcessor.processFolder(mockLargeFolderHandle, {
        priority: 3,
        batchSize: 10,
        enableLegalIntelligence: false // Disable for speed
      });

      const processingTime = Date.now() - folderStartTime;
      
      // Check results
      if (result.totalDocuments !== 100) {
        errors.push(`Expected 100 documents, got ${result.totalDocuments}`);
      }

      if (result.successfulDocuments < 95) {
        errors.push(`Too many failures: ${result.failedDocuments}/100`);
      }

      // Performance check: should process at least 20 docs/minute
      const docsPerMinute = (result.successfulDocuments / processingTime) * 60000;
      if (docsPerMinute < 20) {
        errors.push(`Processing too slow: ${docsPerMinute.toFixed(1)} docs/min`);
      }

      await enterpriseProcessor.stop();

    } catch (error) {
      errors.push(`Large folder test error: ${error.message}`);
    }

    return {
      testName: 'Large Folder Processing',
      passed: errors.length === 0,
      duration: Date.now() - startTime,
      memoryUsed: this.peakMemory,
      errors,
      details: {
        documentsProcessed: 100,
        performanceAcceptable: errors.length === 0
      }
    };
  }

  /**
   * Test 11: Legal Intelligence Hooks
   */
  private async testLegalIntelligenceHooks(): Promise<TestResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const hooksTriggered: string[] = [];

    try {
      // Track legal intelligence hooks
      const task = {
        id: 'legal-test',
        type: 'document_extraction' as const,
        priority: 2,
        data: { 
          file: new File(['Legal document content'], 'legal.pdf'),
          options: {}
        },
        options: {
          maxRetries: 1,
          timeout: 10000,
          memoryLimit: 100000,
          enableProgressCallbacks: false,
          checkpointingEnabled: false,
          legalAnalysisEnabled: true
        },
        createdAt: new Date(),
        estimatedDuration: 5000,
        legalIntelligenceHooks: {
          onDocumentProcessed: async () => { hooksTriggered.push('document'); },
          onEntityExtracted: async () => { hooksTriggered.push('entity'); },
          onLegalAnalysisNeeded: async () => { hooksTriggered.push('analysis'); },
          onCaseAnalysisComplete: async () => { hooksTriggered.push('case'); }
        }
      };

      await enterpriseQueue.addTask(task);
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      if (hooksTriggered.length === 0) {
        errors.push('No legal intelligence hooks were triggered');
      }

    } catch (error) {
      errors.push(`Legal hooks test error: ${error.message}`);
    }

    return {
      testName: 'Legal Intelligence Hooks',
      passed: errors.length === 0,
      duration: Date.now() - startTime,
      memoryUsed: resourceMonitor.getCurrentMetrics().memory.used,
      errors,
      details: {
        hooksTriggered,
        legalIntegrationReady: errors.length === 0
      }
    };
  }

  /**
   * Test 12: Performance Benchmarks
   */
  private async testPerformanceBenchmarks(): Promise<TestResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const benchmarks = {
      singleDocTime: 0,
      memoryEfficiency: 0,
      throughput: 0,
      incrementalSavings: 0
    };

    try {
      await enterpriseProcessor.start();

      // Benchmark 1: Single document processing time
      const docStart = Date.now();
      await enterpriseProcessor.processDocument(
        new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      );
      benchmarks.singleDocTime = Date.now() - docStart;
      
      if (benchmarks.singleDocTime > 5000) {
        errors.push(`Single doc too slow: ${benchmarks.singleDocTime}ms`);
      }

      // Benchmark 2: Memory efficiency
      const memBefore = resourceMonitor.getCurrentMetrics().memory.used;
      for (let i = 0; i < 10; i++) {
        await enterpriseProcessor.processDocument(
          new File([`doc ${i}`], `doc${i}.pdf`, { type: 'application/pdf' })
        );
      }
      const memAfter = resourceMonitor.getCurrentMetrics().memory.used;
      benchmarks.memoryEfficiency = (memAfter - memBefore) / 10; // Per document
      
      if (benchmarks.memoryEfficiency > 50 * 1024 * 1024) { // 50MB per doc
        errors.push(`Memory usage too high: ${benchmarks.memoryEfficiency / 1024 / 1024}MB per doc`);
      }

      // Benchmark 3: Throughput
      const throughputStart = Date.now();
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(enterpriseProcessor.processDocument(
          new File([`parallel ${i}`], `parallel${i}.pdf`, { type: 'application/pdf' })
        ));
      }
      await Promise.all(promises);
      const throughputTime = Date.now() - throughputStart;
      benchmarks.throughput = (20 / throughputTime) * 60000; // Docs per minute
      
      if (benchmarks.throughput < 30) {
        errors.push(`Throughput too low: ${benchmarks.throughput.toFixed(1)} docs/min`);
      }

      await enterpriseProcessor.stop();

    } catch (error) {
      errors.push(`Benchmark test error: ${error.message}`);
    }

    return {
      testName: 'Performance Benchmarks',
      passed: errors.length === 0,
      duration: Date.now() - startTime,
      memoryUsed: this.peakMemory,
      errors,
      details: benchmarks
    };
  }

  /**
   * Run test with timeout
   */
  private async runTestWithTimeout(testCase: TestCase): Promise<TestResult> {
    return new Promise(async (resolve) => {
      const timeout = setTimeout(() => {
        resolve({
          testName: testCase.name,
          passed: false,
          duration: testCase.timeout,
          memoryUsed: resourceMonitor.getCurrentMetrics().memory.used,
          errors: [`Test timeout after ${testCase.timeout}ms`],
          details: { timedOut: true }
        });
      }, testCase.timeout);

      try {
        const result = await testCase.test();
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        resolve({
          testName: testCase.name,
          passed: false,
          duration: Date.now() - this.startTime,
          memoryUsed: resourceMonitor.getCurrentMetrics().memory.used,
          errors: [`Test error: ${error.message}`],
          details: { error: error.message }
        });
      }
    });
  }

  /**
   * Generate test summary
   */
  private generateSummary(results: TestResult[]): TestSummary {
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const totalDuration = Date.now() - this.startTime;
    const memorySum = results.reduce((sum, r) => sum + r.memoryUsed, 0);
    
    const performanceTargetsMet = 
      this.peakMemory < 2 * 1024 * 1024 * 1024 && // Under 2GB
      passed / results.length >= 0.8; // 80% pass rate

    return {
      totalTests: results.length,
      passed,
      failed,
      criticalFailures: results.filter((r, i) => !r.passed && this.getTestCases()[i].critical).length,
      totalDuration,
      peakMemory: this.peakMemory,
      averageMemory: memorySum / results.length,
      performanceTargetsMet
    };
  }

  /**
   * Print test report
   */
  private printTestReport(suite: TestSuite): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 ENTERPRISE INTEGRATION TEST REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n📈 Summary:`);
    console.log(`   Total Tests: ${suite.summary.totalTests}`);
    console.log(`   ✅ Passed: ${suite.summary.passed}`);
    console.log(`   ❌ Failed: ${suite.summary.failed}`);
    console.log(`   🚨 Critical Failures: ${suite.summary.criticalFailures}`);
    console.log(`   ⏱️ Total Duration: ${(suite.summary.totalDuration / 1000).toFixed(1)}s`);
    console.log(`   💾 Peak Memory: ${(suite.summary.peakMemory / 1024 / 1024).toFixed(1)}MB`);
    console.log(`   🎯 Performance Targets: ${suite.summary.performanceTargetsMet ? '✅ MET' : '❌ NOT MET'}`);
    
    if (suite.summary.failed > 0) {
      console.log(`\n❌ Failed Tests:`);
      suite.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`   - ${r.testName}: ${r.errors.join(', ')}`);
        });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`${suite.summary.performanceTargetsMet ? '✅' : '❌'} Test Suite ${suite.summary.performanceTargetsMet ? 'PASSED' : 'FAILED'}`);
    console.log('='.repeat(60));
  }
}

// Export test runner
export const integrationTester = new EnterpriseIntegrationTester();

// Run tests if executed directly
if (require.main === module) {
  console.log('🚀 Running Enterprise Integration Tests...\n');
  integrationTester.runFullTestSuite().then(suite => {
    process.exit(suite.summary.performanceTargetsMet ? 0 : 1);
  });
}

console.log('🧪 Enterprise Integration Test Harness loaded');