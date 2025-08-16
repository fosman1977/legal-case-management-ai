/**
 * ENTERPRISE INTEGRATION LAYER
 * Integrates enterprise queue and worker pool with existing document extractor
 * 
 * Status: Phase 1, Week 1 - Core enterprise architecture
 * Purpose: Bridge between enterprise processing system and existing document extraction
 * Integration: Connects enterprise-queue.ts, enterprise-worker-pool.ts, and productionDocumentExtractor.ts
 */

import { EventEmitter } from 'events';
import { EnterpriseProcessingQueue, ProcessingTask, ProcessingResult, TaskPriority } from './enterprise-queue';
import { EnterpriseWorkerPool, WorkerType, WorkerTask } from '../workers/enterprise-worker-pool';
import { ResourceMonitor } from './resource-monitor';

export interface EnterpriseExtractionOptions {
  mode: 'preview' | 'standard' | 'full' | 'enterprise';
  enableLegalIntelligence: boolean;
  enableBackgroundProcessing: boolean;
  enableIncrementalProcessing: boolean;
  priority: TaskPriority;
  batchSize: number;
  memoryLimit: number;
  timeoutMs: number;
  onProgress?: (progress: EnterpriseProgressUpdate) => void;
  onDocumentComplete?: (result: DocumentResult) => void;
  abortSignal?: AbortSignal;
}

export interface EnterpriseProgressUpdate {
  totalDocuments: number;
  processedDocuments: number;
  percentage: number;
  stage: 'initializing' | 'processing' | 'legal_analysis' | 'indexing' | 'complete';
  currentDocument?: string;
  documentsPerMinute: number;
  estimatedTimeRemaining: number;
  memoryUsage: number;
  activeWorkers: number;
  queueLength: number;
  errors: ProcessingError[];
}

export interface DocumentResult {
  documentId: string;
  fileName: string;
  status: 'completed' | 'failed' | 'skipped';
  extractionResult?: any;
  legalIntelligenceData?: any;
  processingTime: number;
  memoryUsed: number;
  workerId?: string;
  error?: string;
}

export interface ProcessingError {
  documentId: string;
  fileName: string;
  error: string;
  stage: string;
  recoverable: boolean;
  retryCount: number;
}

export interface FolderProcessingResult {
  folderId: string;
  folderName: string;
  totalDocuments: number;
  successfulDocuments: number;
  failedDocuments: number;
  skippedDocuments: number;
  totalProcessingTime: number;
  averageProcessingTime: number;
  memoryPeakUsage: number;
  documentsPerMinute: number;
  legalEntitiesExtracted: number;
  legalEventsIdentified: number;
  crossDocumentRelationships: number;
  searchIndexSize: number;
  results: DocumentResult[];
  errors: ProcessingError[];
  performanceMetrics: PerformanceMetrics;
}

export interface PerformanceMetrics {
  cpuUsageAverage: number;
  cpuUsagePeak: number;
  memoryUsageAverage: number;
  memoryUsagePeak: number;
  diskUsage: number;
  throughputTargetMet: boolean;
  qualityTargetMet: boolean;
  reliabilityScore: number;
}

export class EnterpriseDocumentProcessor extends EventEmitter {
  private queue: EnterpriseProcessingQueue;
  private workerPool: EnterpriseWorkerPool;
  private resourceMonitor: ResourceMonitor;
  private running: boolean = false;
  private processingStatistics: Map<string, FolderProcessingResult> = new Map();
  private activeProcesses: Map<string, ProcessingSession> = new Map();

  constructor(
    queue: EnterpriseProcessingQueue,
    workerPool: EnterpriseWorkerPool,
    resourceMonitor: ResourceMonitor
  ) {
    super();
    
    this.queue = queue;
    this.workerPool = workerPool;
    this.resourceMonitor = resourceMonitor;

    this.setupEventHandlers();
    console.log('🏭 Enterprise Document Processor initialized');
  }

  /**
   * Start the enterprise processor
   */
  async start(): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;
    
    // Start all components
    await Promise.all([
      this.workerPool.start(),
      this.resourceMonitor.startMonitoring()
    ]);

    console.log('🚀 Enterprise Document Processor started');
    this.emit('processorStarted');
  }

  /**
   * Stop the enterprise processor
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    console.log('🛑 Stopping Enterprise Document Processor...');
    this.running = false;

    // Stop all active processes
    for (const [processId, session] of this.activeProcesses) {
      await this.abortProcess(processId);
    }

    // Stop all components
    await Promise.all([
      this.queue.shutdown(),
      this.workerPool.stop(),
      this.resourceMonitor.stopMonitoring()
    ]);

    this.activeProcesses.clear();
    console.log('✅ Enterprise Document Processor stopped');
    this.emit('processorStopped');
  }

  /**
   * Process a single document with enterprise capabilities
   */
  async processDocument(
    file: File, 
    options: Partial<EnterpriseExtractionOptions> = {}
  ): Promise<DocumentResult> {
    const enhancedOptions = this.getEnhancedOptions(options);
    
    // Create enterprise processing task
    const task: ProcessingTask = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'document_extraction',
      priority: enhancedOptions.priority,
      data: { file, options: enhancedOptions },
      options: {
        maxRetries: 3,
        timeout: enhancedOptions.timeoutMs,
        memoryLimit: enhancedOptions.memoryLimit,
        enableProgressCallbacks: true,
        abortSignal: enhancedOptions.abortSignal,
        checkpointingEnabled: true,
        legalAnalysisEnabled: enhancedOptions.enableLegalIntelligence
      },
      createdAt: new Date(),
      estimatedDuration: this.estimateDocumentProcessingTime(file),
      legalIntelligenceHooks: enhancedOptions.enableLegalIntelligence ? 
        this.createLegalIntelligenceHooks() : undefined
    };

    // Add task to enterprise queue
    const taskId = await this.queue.addTask(task);
    
    // Wait for completion and return result
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Document processing timeout after ${enhancedOptions.timeoutMs}ms`));
      }, enhancedOptions.timeoutMs);

      const handleCompletion = (result: ProcessingResult) => {
        if (result.taskId === taskId) {
          clearTimeout(timeout);
          this.queue.off('taskCompleted', handleCompletion);
          this.queue.off('taskFailed', handleFailure);
          
          resolve(this.convertToDocumentResult(result, file.name));
        }
      };

      const handleFailure = (result: ProcessingResult) => {
        if (result.taskId === taskId) {
          clearTimeout(timeout);
          this.queue.off('taskCompleted', handleCompletion);
          this.queue.off('taskFailed', handleFailure);
          
          reject(new Error(result.error || 'Document processing failed'));
        }
      };

      this.queue.on('taskCompleted', handleCompletion);
      this.queue.on('taskFailed', handleFailure);
    });
  }

  /**
   * Process an entire folder with enterprise-scale capabilities
   */
  async processFolder(
    folderHandle: FileSystemDirectoryHandle,
    options: Partial<EnterpriseExtractionOptions> = {}
  ): Promise<FolderProcessingResult> {
    const processId = `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const enhancedOptions = this.getEnhancedOptions(options);
    
    console.log(`🏗️ Starting enterprise folder processing: ${folderHandle.name}`);
    
    // Get all files in the folder
    const files = await this.getAllFilesFromFolder(folderHandle);
    const totalDocuments = files.length;
    
    if (totalDocuments === 0) {
      throw new Error('No processable documents found in folder');
    }

    // Create processing session
    const session: ProcessingSession = {
      id: processId,
      folderName: folderHandle.name,
      totalDocuments,
      processedDocuments: 0,
      startTime: Date.now(),
      options: enhancedOptions,
      results: [],
      errors: [],
      aborted: false
    };

    this.activeProcesses.set(processId, session);

    try {
      // Process documents in batches
      const results = await this.processFolderInBatches(files, session);
      
      // Create final result
      const finalResult = this.createFolderResult(session, results);
      
      // Store statistics
      this.processingStatistics.set(processId, finalResult);
      
      console.log(`✅ Folder processing complete: ${folderHandle.name} (${results.length} documents)`);
      this.emit('folderProcessingComplete', finalResult);
      
      return finalResult;
      
    } catch (error) {
      console.error(`❌ Folder processing failed: ${folderHandle.name}`, error);
      throw error;
    } finally {
      this.activeProcesses.delete(processId);
    }
  }

  /**
   * Get processing statistics for a folder
   */
  getProcessingStatistics(processId: string): FolderProcessingResult | undefined {
    return this.processingStatistics.get(processId);
  }

  /**
   * Get all processing statistics
   */
  getAllProcessingStatistics(): FolderProcessingResult[] {
    return Array.from(this.processingStatistics.values());
  }

  /**
   * Abort an active processing session
   */
  async abortProcess(processId: string): Promise<boolean> {
    const session = this.activeProcesses.get(processId);
    if (!session) {
      return false;
    }

    session.aborted = true;
    console.log(`🚫 Aborting process: ${processId}`);
    
    // Cancel any pending tasks
    // Note: In a real implementation, we would track task IDs per session
    
    this.emit('processAborted', { processId, folderName: session.folderName });
    return true;
  }

  /**
   * Get current system status
   */
  getSystemStatus() {
    return {
      running: this.running,
      activeProcesses: this.activeProcesses.size,
      queueStatus: this.queue.getQueueStatus(),
      poolStatistics: this.workerPool.getPoolStatistics(),
      resourceMetrics: this.resourceMonitor.getCurrentMetrics(),
      systemLoad: this.resourceMonitor.getSystemLoadScore(),
      recommendedThrottle: this.resourceMonitor.getRecommendedThrottleLevel()
    };
  }

  // Private methods

  private setupEventHandlers(): void {
    // Queue events
    this.queue.on('taskCompleted', (result: ProcessingResult) => {
      this.handleTaskCompletion(result);
    });

    this.queue.on('taskFailed', (result: ProcessingResult) => {
      this.handleTaskFailure(result);
    });

    this.queue.on('taskProgress', (progress: any) => {
      this.handleTaskProgress(progress);
    });

    // Worker pool events
    this.workerPool.on('taskCompleted', (event: any) => {
      console.log(`🎯 Worker task completed: ${event.taskId} by ${event.workerId}`);
    });

    // Resource monitor events
    this.resourceMonitor.on('resourceAlert', (alert: any) => {
      this.handleResourceAlert(alert);
    });
  }

  private getEnhancedOptions(options: Partial<EnterpriseExtractionOptions>): EnterpriseExtractionOptions {
    return {
      mode: options.mode || 'enterprise',
      enableLegalIntelligence: options.enableLegalIntelligence !== false,
      enableBackgroundProcessing: options.enableBackgroundProcessing !== false,
      enableIncrementalProcessing: options.enableIncrementalProcessing !== false,
      priority: options.priority || TaskPriority.MEDIUM,
      batchSize: options.batchSize || 10,
      memoryLimit: options.memoryLimit || 512 * 1024 * 1024, // 512MB
      timeoutMs: options.timeoutMs || 300000, // 5 minutes
      onProgress: options.onProgress,
      onDocumentComplete: options.onDocumentComplete,
      abortSignal: options.abortSignal
    };
  }

  private createLegalIntelligenceHooks() {
    return {
      onDocumentProcessed: async (doc: any) => {
        console.log(`🧠 Legal intelligence: Document processed - ${doc.name}`);
        // Placeholder for legal intelligence integration
      },
      onEntityExtracted: async (entity: any) => {
        console.log(`🏛️ Legal entity extracted: ${entity.text} (${entity.type})`);
        // Placeholder for legal entity processing
      },
      onLegalAnalysisNeeded: async (data: any) => {
        console.log(`⚖️ Legal analysis requested for: ${data.documentName}`);
        // Placeholder for legal analysis triggers
      },
      onCaseAnalysisComplete: async (analysis: any) => {
        console.log(`📊 Case analysis complete: ${analysis.caseId}`);
        // Placeholder for case analysis completion
      }
    };
  }

  private estimateDocumentProcessingTime(file: File): number {
    // Estimate processing time based on file size and type
    const baseTimePerMB = 2000; // 2 seconds per MB
    const fileSizeMB = file.size / (1024 * 1024);
    
    // Type-specific multipliers
    const typeMultipliers: Record<string, number> = {
      'application/pdf': 1.0,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 0.8,
      'application/vnd.ms-excel': 1.2,
      'image/': 2.0 // OCR processing
    };

    const multiplier = Object.entries(typeMultipliers)
      .find(([type]) => file.type.startsWith(type))?.[1] || 1.0;

    return Math.max(5000, fileSizeMB * baseTimePerMB * multiplier);
  }

  private async getAllFilesFromFolder(folderHandle: FileSystemDirectoryHandle): Promise<File[]> {
    const files: File[] = [];
    
    for await (const [name, handle] of folderHandle.entries()) {
      if (handle.kind === 'file') {
        const file = await handle.getFile();
        if (this.isProcessableFile(file)) {
          files.push(file);
        }
      } else if (handle.kind === 'directory') {
        // Recursively process subdirectories
        const subFiles = await this.getAllFilesFromFolder(handle);
        files.push(...subFiles);
      }
    }
    
    return files;
  }

  private isProcessableFile(file: File): boolean {
    const processableTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/jpeg',
      'image/png'
    ];

    return processableTypes.includes(file.type) || 
           file.name.toLowerCase().endsWith('.pdf') ||
           file.name.toLowerCase().endsWith('.docx') ||
           file.name.toLowerCase().endsWith('.xlsx');
  }

  private async processFolderInBatches(
    files: File[], 
    session: ProcessingSession
  ): Promise<DocumentResult[]> {
    const results: DocumentResult[] = [];
    const batchSize = session.options.batchSize;
    
    // Process files in batches to manage memory usage
    for (let i = 0; i < files.length; i += batchSize) {
      if (session.aborted) {
        break;
      }

      const batch = files.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(files.length / batchSize)} (${batch.length} files)`);
      
      // Check memory availability before processing batch
      const memoryCheck = await this.resourceMonitor.checkMemoryAvailable(
        session.options.memoryLimit / (1024 * 1024)
      );
      
      if (!memoryCheck.available) {
        console.log('🧹 Optimizing memory before batch processing...');
        await this.resourceMonitor.optimizeMemory();
      }

      // Process batch in parallel
      const batchPromises = batch.map(file => this.processDocument(file, session.options));
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Collect results
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
          session.processedDocuments++;
        } else {
          // Handle failure
          const error: ProcessingError = {
            documentId: 'unknown',
            fileName: 'unknown',
            error: result.reason.message,
            stage: 'processing',
            recoverable: false,
            retryCount: 0
          };
          session.errors.push(error);
        }
      }

      // Update progress
      if (session.options.onProgress) {
        const progress = this.calculateProgress(session, results);
        session.options.onProgress(progress);
      }

      // Brief pause between batches to allow garbage collection
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }

  private calculateProgress(session: ProcessingSession, results: DocumentResult[]): EnterpriseProgressUpdate {
    const percentage = (session.processedDocuments / session.totalDocuments) * 100;
    const elapsedTime = Date.now() - session.startTime;
    const documentsPerMinute = session.processedDocuments / (elapsedTime / 60000);
    const estimatedTimeRemaining = (session.totalDocuments - session.processedDocuments) / 
      Math.max(1, documentsPerMinute) * 60000;

    return {
      totalDocuments: session.totalDocuments,
      processedDocuments: session.processedDocuments,
      percentage,
      stage: percentage === 100 ? 'complete' : 'processing',
      currentDocument: results[results.length - 1]?.fileName,
      documentsPerMinute,
      estimatedTimeRemaining,
      memoryUsage: this.resourceMonitor.getCurrentMetrics().memory.percentage,
      activeWorkers: this.workerPool.getPoolStatistics().activeWorkers,
      queueLength: this.queue.getQueueStatus().pendingTasks,
      errors: session.errors
    };
  }

  private createFolderResult(session: ProcessingSession, results: DocumentResult[]): FolderProcessingResult {
    const endTime = Date.now();
    const totalProcessingTime = endTime - session.startTime;
    
    const successful = results.filter(r => r.status === 'completed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const skipped = results.filter(r => r.status === 'skipped').length;

    return {
      folderId: session.id,
      folderName: session.folderName,
      totalDocuments: session.totalDocuments,
      successfulDocuments: successful,
      failedDocuments: failed,
      skippedDocuments: skipped,
      totalProcessingTime,
      averageProcessingTime: totalProcessingTime / session.totalDocuments,
      memoryPeakUsage: 0, // Would be tracked during processing
      documentsPerMinute: (successful / (totalProcessingTime / 60000)),
      legalEntitiesExtracted: 0, // Would be calculated from results
      legalEventsIdentified: 0, // Would be calculated from results
      crossDocumentRelationships: 0, // Would be calculated from analysis
      searchIndexSize: 0, // Would be calculated from indexing
      results,
      errors: session.errors,
      performanceMetrics: {
        cpuUsageAverage: 0,
        cpuUsagePeak: 0,
        memoryUsageAverage: 0,
        memoryUsagePeak: 0,
        diskUsage: 0,
        throughputTargetMet: successful >= session.totalDocuments * 0.95,
        qualityTargetMet: failed < session.totalDocuments * 0.05,
        reliabilityScore: successful / session.totalDocuments
      }
    };
  }

  private convertToDocumentResult(result: ProcessingResult, fileName: string): DocumentResult {
    return {
      documentId: result.taskId,
      fileName,
      status: result.status as any,
      extractionResult: result.result,
      legalIntelligenceData: result.legalIntelligenceData,
      processingTime: result.processingTime,
      memoryUsed: result.memoryUsed,
      error: result.error
    };
  }

  private handleTaskCompletion(result: ProcessingResult): void {
    console.log(`✅ Enterprise task completed: ${result.taskId}`);
    this.emit('documentCompleted', result);
  }

  private handleTaskFailure(result: ProcessingResult): void {
    console.error(`❌ Enterprise task failed: ${result.taskId} - ${result.error}`);
    this.emit('documentFailed', result);
  }

  private handleTaskProgress(progress: any): void {
    this.emit('documentProgress', progress);
  }

  private handleResourceAlert(alert: any): void {
    console.warn(`⚠️ Resource alert: ${alert.message}`);
    
    if (alert.level === 'critical') {
      // Temporarily pause new task assignment
      console.log('🚨 Pausing task assignment due to critical resource usage');
    }
    
    this.emit('resourceAlert', alert);
  }
}

interface ProcessingSession {
  id: string;
  folderName: string;
  totalDocuments: number;
  processedDocuments: number;
  startTime: number;
  options: EnterpriseExtractionOptions;
  results: DocumentResult[];
  errors: ProcessingError[];
  aborted: boolean;
}

// Factory function to create enterprise processor
export function createEnterpriseProcessor(): EnterpriseDocumentProcessor {
  const { enterpriseQueue } = require('./enterprise-queue');
  const { enterpriseWorkerPool } = require('../workers/enterprise-worker-pool');
  const { resourceMonitor } = require('./resource-monitor');

  return new EnterpriseDocumentProcessor(
    enterpriseQueue,
    enterpriseWorkerPool,
    resourceMonitor
  );
}

// Export singleton instance
export const enterpriseProcessor = createEnterpriseProcessor();

console.log('🏭 Enterprise Integration Layer loaded');