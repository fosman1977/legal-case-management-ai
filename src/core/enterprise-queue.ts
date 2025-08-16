/**
 * ENTERPRISE PROCESSING QUEUE
 * Priority-based task queue for document processing with legal intelligence integration
 * 
 * Status: Phase 1, Week 1 - Core enterprise architecture
 * Integration: Works with existing productionDocumentExtractor.ts
 * Legal AI: Includes hooks for future legal intelligence engine
 */

import { EventEmitter } from 'events';
import PQueue from 'p-queue';

// Core interfaces for enterprise processing
export interface ProcessingTask {
  id: string;
  type: 'document_extraction' | 'legal_analysis' | 'cross_document' | 'search_indexing';
  priority: TaskPriority;
  data: any;
  options: ProcessingOptions;
  createdAt: Date;
  estimatedDuration: number;
  dependencies?: string[]; // Task IDs this task depends on
  legalIntelligenceHooks?: LegalIntelligenceHooks;
}

export interface ProcessingOptions {
  maxRetries: number;
  timeout: number;
  memoryLimit: number;
  enableProgressCallbacks: boolean;
  abortSignal?: AbortSignal;
  checkpointingEnabled: boolean;
  legalAnalysisEnabled: boolean;
}

export interface ProcessingResult {
  taskId: string;
  status: 'completed' | 'failed' | 'cancelled' | 'partial';
  result?: any;
  error?: string;
  processingTime: number;
  memoryUsed: number;
  checkpoints: Checkpoint[];
  legalIntelligenceData?: LegalIntelligenceResult;
}

export interface QueueStatus {
  totalTasks: number;
  pendingTasks: number;
  activeTasks: number;
  completedTasks: number;
  failedTasks: number;
  estimatedTimeRemaining: number;
  memoryUsage: number;
  activeWorkers: number;
}

export interface Checkpoint {
  id: string;
  taskId: string;
  timestamp: Date;
  progress: number;
  data: any;
  recoverable: boolean;
}

// Legal Intelligence Integration (Phase 2 preparation)
export interface LegalIntelligenceHooks {
  onDocumentProcessed?: (doc: any) => Promise<void>;
  onEntityExtracted?: (entity: any) => Promise<void>;
  onLegalAnalysisNeeded?: (data: any) => Promise<void>;
  onCaseAnalysisComplete?: (analysis: any) => Promise<void>;
}

export interface LegalIntelligenceResult {
  entities: any[];
  legalIssues: any[];
  caseSignificance: 'critical' | 'important' | 'contextual';
  confidenceScore: number;
  analysisComplete: boolean;
}

export enum TaskPriority {
  CRITICAL = 1,    // Urgent legal deadlines, court filings
  HIGH = 2,        // Pleadings, key evidence documents  
  MEDIUM = 3,      // Standard case documents
  LOW = 4,         // Background materials, correspondence
  BACKGROUND = 5   // Archive processing, optimization tasks
}

export class EnterpriseProcessingQueue extends EventEmitter {
  private queue: PQueue;
  private tasks: Map<string, ProcessingTask> = new Map();
  private results: Map<string, ProcessingResult> = new Map();
  private checkpoints: Map<string, Checkpoint[]> = new Map();
  private resourceMonitor: any; // Will be injected
  private running: boolean = false;

  constructor(config: EnterpriseQueueConfig = {}) {
    super();

    // Configure main processing queue with enterprise settings
    this.queue = new PQueue({
      concurrency: config.maxConcurrentTasks || this.calculateOptimalConcurrency(),
      timeout: config.defaultTimeout || 300000, // 5 minutes default
      throwOnTimeout: false,
      interval: config.throttleInterval || 100,
      intervalCap: config.throttleCap || 10
    });

    // Set up queue event handlers
    this.setupQueueEventHandlers();
    
    console.log(`🏗️ Enterprise Processing Queue initialized with ${this.queue.concurrency} concurrent workers`);
  }

  /**
   * Add a task to the processing queue with priority support
   */
  async addTask(task: ProcessingTask): Promise<string> {
    // Validate task
    if (!task.id || !task.type || !task.data) {
      throw new Error('Invalid task: missing required fields');
    }

    // Store task metadata
    this.tasks.set(task.id, {
      ...task,
      createdAt: new Date(),
      estimatedDuration: task.estimatedDuration || this.estimateTaskDuration(task)
    });

    // Add to priority queue
    await this.queue.add(
      () => this.processTask(task),
      { 
        priority: this.getPriorityWeight(task.priority),
        signal: task.options.abortSignal
      }
    );

    this.emit('taskAdded', { taskId: task.id, queueSize: this.queue.size });
    
    console.log(`📋 Task added: ${task.id} (${task.type}) - Priority: ${TaskPriority[task.priority]}`);
    return task.id;
  }

  /**
   * Process a single task with full enterprise features
   */
  private async processTask(task: ProcessingTask): Promise<ProcessingResult> {
    const startTime = Date.now();
    let memoryUsed = 0;
    const checkpoints: Checkpoint[] = [];

    try {
      console.log(`⚙️ Processing task: ${task.id} (${task.type})`);
      this.emit('taskStarted', { taskId: task.id, startTime });

      // Check dependencies
      if (task.dependencies) {
        await this.waitForDependencies(task.dependencies);
      }

      // Memory check before processing
      if (this.resourceMonitor) {
        const memoryStatus = await this.resourceMonitor.checkMemoryAvailable();
        if (memoryStatus.available < task.options.memoryLimit) {
          await this.resourceMonitor.optimizeMemory();
        }
      }

      let result: any;

      // Process based on task type with legal intelligence integration
      switch (task.type) {
        case 'document_extraction':
          result = await this.processDocumentExtraction(task, checkpoints);
          break;
          
        case 'legal_analysis':
          result = await this.processLegalAnalysis(task, checkpoints);
          break;
          
        case 'cross_document':
          result = await this.processCrossDocumentAnalysis(task, checkpoints);
          break;
          
        case 'search_indexing':
          result = await this.processSearchIndexing(task, checkpoints);
          break;
          
        default:
          throw new Error(`Unsupported task type: ${task.type}`);
      }

      // Final memory measurement
      if (this.resourceMonitor) {
        memoryUsed = await this.resourceMonitor.getTaskMemoryUsage(task.id);
      }

      const processingResult: ProcessingResult = {
        taskId: task.id,
        status: 'completed',
        result,
        processingTime: Date.now() - startTime,
        memoryUsed,
        checkpoints,
        legalIntelligenceData: result.legalIntelligenceData
      };

      this.results.set(task.id, processingResult);
      this.emit('taskCompleted', processingResult);
      
      console.log(`✅ Task completed: ${task.id} in ${processingResult.processingTime}ms`);
      return processingResult;

    } catch (error) {
      const processingResult: ProcessingResult = {
        taskId: task.id,
        status: 'failed',
        error: (error as Error).message,
        processingTime: Date.now() - startTime,
        memoryUsed,
        checkpoints
      };

      this.results.set(task.id, processingResult);
      this.emit('taskFailed', processingResult);
      
      console.error(`❌ Task failed: ${task.id} - ${(error as Error).message}`);
      return processingResult;
    }
  }

  /**
   * Process document extraction with legal intelligence hooks
   */
  private async processDocumentExtraction(
    task: ProcessingTask, 
    checkpoints: Checkpoint[]
  ): Promise<any> {
    
    // Import existing document extractor
    const { ProductionDocumentExtractor } = await import('../services/productionDocumentExtractor');
    
    const file = task.data.file;
    const options = task.data.options || {};

    // Enhanced options for enterprise processing
    const enterpriseOptions = {
      ...options,
      mode: options.mode || 'standard',
      enableOCR: options.enableOCR !== false,
      enableTables: options.enableTables !== false,
      enableEntities: options.enableEntities !== false,
      parallel: true,
      onProgress: (progress: any) => {
        // Create checkpoint every 10% progress
        if (progress.percentage % 10 === 0) {
          const checkpoint: Checkpoint = {
            id: `${task.id}-${Date.now()}`,
            taskId: task.id,
            timestamp: new Date(),
            progress: progress.percentage,
            data: progress,
            recoverable: true
          };
          checkpoints.push(checkpoint);
        }

        this.emit('taskProgress', {
          taskId: task.id,
          progress: progress.percentage,
          stage: progress.stage,
          status: progress.status
        });
      },
      abortSignal: task.options.abortSignal
    };

    // Process document with existing extractor
    const extractionResult = await ProductionDocumentExtractor.extract(file, enterpriseOptions);

    // Legal Intelligence Integration Point (Phase 2 preparation)
    let legalIntelligenceData: LegalIntelligenceResult | undefined;
    
    if (task.options.legalAnalysisEnabled && task.legalIntelligenceHooks) {
      console.log(`🧠 Triggering legal intelligence analysis for: ${file.name}`);
      
      // Call legal intelligence hooks (will be implemented in Phase 2)
      if (task.legalIntelligenceHooks.onDocumentProcessed) {
        await task.legalIntelligenceHooks.onDocumentProcessed(extractionResult);
      }

      if (task.legalIntelligenceHooks.onEntityExtracted && extractionResult.entities) {
        for (const entity of extractionResult.entities) {
          await task.legalIntelligenceHooks.onEntityExtracted(entity);
        }
      }

      // Placeholder for legal intelligence analysis (Phase 2)
      legalIntelligenceData = {
        entities: extractionResult.entities || [],
        legalIssues: [], // Will be populated in Phase 2
        caseSignificance: 'contextual', // Will be determined in Phase 2
        confidenceScore: 0.8, // Will be calculated in Phase 2
        analysisComplete: false // Will be true when Phase 2 is implemented
      };
    }

    return {
      ...extractionResult,
      legalIntelligenceData,
      enterpriseMetadata: {
        taskId: task.id,
        processingMode: 'enterprise',
        legalAnalysisEnabled: task.options.legalAnalysisEnabled,
        checkpointsCreated: checkpoints.length
      }
    };
  }

  /**
   * Process legal analysis (Phase 2 implementation target)
   */
  private async processLegalAnalysis(task: ProcessingTask, checkpoints: Checkpoint[]): Promise<any> {
    console.log(`🧠 Legal analysis task: ${task.id} (Phase 2 implementation target)`);
    
    // Placeholder for Phase 2 legal intelligence engine
    const placeholderResult = {
      analysisType: 'legal_intelligence',
      status: 'phase_2_implementation_required',
      placeholder: true,
      message: 'Legal analysis will be implemented in Phase 2 (Weeks 7-12)',
      taskId: task.id
    };

    // Create checkpoint for legal analysis
    const checkpoint: Checkpoint = {
      id: `${task.id}-legal-analysis`,
      taskId: task.id,
      timestamp: new Date(),
      progress: 100,
      data: placeholderResult,
      recoverable: true
    };
    checkpoints.push(checkpoint);

    return placeholderResult;
  }

  /**
   * Process cross-document analysis (Phase 1 foundation, Phase 2 enhancement)
   */
  private async processCrossDocumentAnalysis(task: ProcessingTask, checkpoints: Checkpoint[]): Promise<any> {
    console.log(`🔗 Cross-document analysis task: ${task.id}`);
    
    // Basic cross-document analysis (Phase 1)
    const documents = task.data.documents;
    
    // Placeholder for sophisticated cross-document analysis
    const basicResult = {
      analysisType: 'cross_document',
      documentCount: documents?.length || 0,
      relationshipsFound: 0, // Will be calculated
      entitiesResolved: 0, // Will be calculated
      timelineEvents: [], // Will be populated
      status: 'basic_implementation',
      phase2Enhancement: 'Advanced relationship analysis in Phase 2',
      taskId: task.id
    };

    return basicResult;
  }

  /**
   * Process search indexing (Phase 1 Week 5 target)
   */
  private async processSearchIndexing(task: ProcessingTask, checkpoints: Checkpoint[]): Promise<any> {
    console.log(`🔍 Search indexing task: ${task.id} (Week 5 implementation target)`);
    
    const placeholderResult = {
      analysisType: 'search_indexing',
      status: 'week_5_implementation_target',
      documentsIndexed: 0,
      indexSize: 0,
      taskId: task.id
    };

    return placeholderResult;
  }

  /**
   * Get current queue status
   */
  getQueueStatus(): QueueStatus {
    const completed = Array.from(this.results.values()).filter(r => r.status === 'completed').length;
    const failed = Array.from(this.results.values()).filter(r => r.status === 'failed').length;
    
    return {
      totalTasks: this.tasks.size,
      pendingTasks: this.queue.pending,
      activeTasks: this.queue.size,
      completedTasks: completed,
      failedTasks: failed,
      estimatedTimeRemaining: this.calculateEstimatedTimeRemaining(),
      memoryUsage: this.getCurrentMemoryUsage(),
      activeWorkers: this.queue.concurrency
    };
  }

  /**
   * Cancel a specific task
   */
  async cancelTask(taskId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    // If task has AbortSignal, trigger it
    if (task.options.abortSignal && !task.options.abortSignal.aborted) {
      // Create abort event
      this.emit('taskCancelled', { taskId });
    }

    this.tasks.delete(taskId);
    console.log(`🚫 Task cancelled: ${taskId}`);
    return true;
  }

  /**
   * Get task result
   */
  getTaskResult(taskId: string): ProcessingResult | undefined {
    return this.results.get(taskId);
  }

  /**
   * Get all checkpoints for a task
   */
  getTaskCheckpoints(taskId: string): Checkpoint[] {
    return this.checkpoints.get(taskId) || [];
  }

  // Private helper methods
  private calculateOptimalConcurrency(): number {
    // Base concurrency on available CPU cores and memory
    const cpuCores = typeof navigator !== 'undefined' ? 
      navigator.hardwareConcurrency || 4 : 4;
    
    // Conservative approach for legal document processing
    return Math.max(2, Math.min(cpuCores, 8));
  }

  private getPriorityWeight(priority: TaskPriority): number {
    // Higher numbers = higher priority in p-queue
    return 6 - priority;
  }

  private estimateTaskDuration(task: ProcessingTask): number {
    // Rough estimates based on task type and data size
    switch (task.type) {
      case 'document_extraction':
        const fileSize = task.data.file?.size || 1024 * 1024; // 1MB default
        return Math.max(5000, fileSize / 1024); // ~1ms per KB
      case 'legal_analysis':
        return 30000; // 30 seconds for legal analysis
      case 'cross_document':
        return 60000; // 1 minute for cross-document analysis
      case 'search_indexing':
        return 10000; // 10 seconds for indexing
      default:
        return 15000; // 15 seconds default
    }
  }

  private async waitForDependencies(dependencies: string[]): Promise<void> {
    // Wait for all dependency tasks to complete
    const checkInterval = 1000; // Check every second
    
    while (dependencies.some(depId => {
      const result = this.results.get(depId);
      return !result || result.status === 'failed';
    })) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
  }

  private calculateEstimatedTimeRemaining(): number {
    // Simple estimation based on average task duration and queue size
    const avgDuration = 15000; // 15 seconds average
    return (this.queue.pending + this.queue.size) * avgDuration / this.queue.concurrency;
  }

  private getCurrentMemoryUsage(): number {
    // Memory usage estimation (will be enhanced with ResourceMonitor)
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  private setupQueueEventHandlers(): void {
    this.queue.on('add', () => {
      this.emit('queueAdd', this.getQueueStatus());
    });

    this.queue.on('next', () => {
      this.emit('queueNext', this.getQueueStatus());
    });

    this.queue.on('idle', () => {
      this.emit('queueIdle', this.getQueueStatus());
      console.log('✅ Enterprise queue idle - all tasks processed');
    });

    this.queue.on('error', (error) => {
      this.emit('queueError', { error: error.message });
      console.error('❌ Queue error:', error);
    });
  }

  /**
   * Shutdown the queue gracefully
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down enterprise processing queue...');
    this.running = false;
    
    // Wait for current tasks to complete
    await this.queue.onIdle();
    
    // Clear task data
    this.tasks.clear();
    this.results.clear();
    this.checkpoints.clear();
    
    console.log('✅ Enterprise queue shutdown complete');
  }
}

// Configuration interface
export interface EnterpriseQueueConfig {
  maxConcurrentTasks?: number;
  defaultTimeout?: number;
  throttleInterval?: number;
  throttleCap?: number;
  enableCheckpointing?: boolean;
  enableLegalIntelligence?: boolean;
}

// Export default configured instance
export const enterpriseQueue = new EnterpriseProcessingQueue({
  enableCheckpointing: true,
  enableLegalIntelligence: true
});

console.log('🏗️ Enterprise Processing Queue module loaded');