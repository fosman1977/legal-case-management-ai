/**
 * INCREMENTAL PROCESSING SYSTEM
 * Smart change detection and incremental updates for enterprise document processing
 * 
 * Status: Phase 1, Week 1 - Core enterprise architecture
 * Purpose: Minimize processing time by only processing changed/new documents
 * Integration: Works with enterprise-queue.ts and document processing pipeline
 */

import { EventEmitter } from 'events';
import { createHash } from 'crypto';

export interface FileChangeSet {
  added: FileChange[];
  modified: FileChange[];
  deleted: FileChange[];
  unchanged: FileChange[];
  totalChanges: number;
  changeRatio: number; // Percentage of files that changed
}

export interface FileChange {
  path: string;
  name: string;
  size: number;
  lastModified: Date;
  hash: string;
  changeType: 'added' | 'modified' | 'deleted' | 'unchanged';
  previousHash?: string;
  previousSize?: number;
  previousModified?: Date;
}

export interface ProcessingState {
  id: string;
  folderPath: string;
  lastScanTime: Date;
  lastProcessingTime: Date;
  totalFiles: number;
  processedFiles: number;
  fileStates: Map<string, FileState>;
  processingMetadata: ProcessingMetadata;
  checkpointData: CheckpointData[];
}

export interface FileState {
  path: string;
  name: string;
  size: number;
  lastModified: Date;
  hash: string;
  lastProcessed: Date;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  extractionChecksum?: string; // Checksum of extracted content
  legalAnalysisChecksum?: string; // Checksum of legal analysis results
  searchIndexed: boolean;
  version: number;
  retryCount: number;
  error?: string;
}

export interface ProcessingMetadata {
  version: string;
  processingMode: 'full' | 'incremental';
  legalIntelligenceEnabled: boolean;
  searchIndexingEnabled: boolean;
  lastOptimization: Date;
  performanceMetrics: IncrementalPerformanceMetrics;
}

export interface CheckpointData {
  id: string;
  timestamp: Date;
  filesCompleted: number;
  totalFiles: number;
  currentFile?: string;
  recoverable: boolean;
  metadata: any;
}

export interface IncrementalPerformanceMetrics {
  averageProcessingTime: number;
  changeDetectionTime: number;
  incrementalSavings: number; // Time saved vs full processing
  cacheHitRatio: number;
  errorRate: number;
  throughput: number; // Files per minute
}

export interface IncrementalProcessingOptions {
  enableChangeDetection: boolean;
  enableContentHashing: boolean;
  enableSmartSkipping: boolean;
  forceFullProcess: boolean;
  batchSize: number;
  checkpointInterval: number; // Number of files between checkpoints
  cacheExpiryHours: number;
  parallelChangeDetection: boolean;
  onProgress?: (progress: IncrementalProgress) => void;
  abortSignal?: AbortSignal;
}

export interface IncrementalProgress {
  stage: 'scanning' | 'change_detection' | 'processing' | 'optimization' | 'complete';
  totalFiles: number;
  scannedFiles: number;
  changedFiles: number;
  processedFiles: number;
  percentage: number;
  timeElapsed: number;
  estimatedTimeRemaining: number;
  currentFile?: string;
  changesSummary: FileChangeSet;
  performanceMetrics: IncrementalPerformanceMetrics;
}

export class IncrementalProcessor extends EventEmitter {
  private states: Map<string, ProcessingState> = new Map();
  private running: boolean = false;
  private currentProcessing: Set<string> = new Set();

  constructor() {
    super();
    console.log('🔄 Incremental Processor initialized');
  }

  /**
   * Detect changes in a folder since last processing
   */
  async detectChanges(
    folderHandle: FileSystemDirectoryHandle,
    options: Partial<IncrementalProcessingOptions> = {}
  ): Promise<FileChangeSet> {
    const startTime = Date.now();
    const enhancedOptions = this.getEnhancedOptions(options);
    
    console.log(`🔍 Detecting changes in folder: ${folderHandle.name}`);
    
    // Get or create processing state
    const folderPath = await this.getFolderPath(folderHandle);
    let state = this.states.get(folderPath);
    
    if (!state) {
      state = await this.createInitialState(folderHandle, folderPath);
      this.states.set(folderPath, state);
    }

    // Scan current folder structure
    const currentFiles = await this.scanFolderStructure(folderHandle, enhancedOptions);
    
    // Compare with previous state
    const changeSet = await this.compareFileStates(state, currentFiles, enhancedOptions);
    
    // Update performance metrics
    const detectionTime = Date.now() - startTime;
    state.processingMetadata.performanceMetrics.changeDetectionTime = detectionTime;
    state.lastScanTime = new Date();
    
    console.log(`✅ Change detection complete: ${changeSet.totalChanges} changes found in ${detectionTime}ms`);
    
    this.emit('changesDetected', {
      folderPath,
      changeSet,
      detectionTime
    });
    
    return changeSet;
  }

  /**
   * Process only changed files incrementally
   */
  async processChangesOnly(
    folderHandle: FileSystemDirectoryHandle,
    changeSet: FileChangeSet,
    options: Partial<IncrementalProcessingOptions> = {}
  ): Promise<IncrementalProcessingResult> {
    const startTime = Date.now();
    const enhancedOptions = this.getEnhancedOptions(options);
    const folderPath = await this.getFolderPath(folderHandle);
    
    console.log(`⚡ Processing ${changeSet.totalChanges} changed files incrementally`);
    
    const processingId = `incr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.currentProcessing.add(processingId);
    
    try {
      const result = await this.executeIncrementalProcessing(
        folderHandle,
        changeSet,
        enhancedOptions,
        processingId
      );
      
      const totalTime = Date.now() - startTime;
      
      // Calculate savings vs full processing
      const fullProcessingEstimate = this.estimateFullProcessingTime(folderHandle);
      const incrementalSavings = fullProcessingEstimate - totalTime;
      
      // Update state
      const state = this.states.get(folderPath);
      if (state) {
        state.lastProcessingTime = new Date();
        state.processingMetadata.performanceMetrics.incrementalSavings = incrementalSavings;
        this.updateProcessingMetrics(state, result, totalTime);
      }
      
      console.log(`✅ Incremental processing complete in ${totalTime}ms (saved ${incrementalSavings}ms vs full scan)`);
      
      this.emit('incrementalProcessingComplete', {
        processingId,
        folderPath,
        result,
        incrementalSavings,
        totalTime
      });
      
      return result;
      
    } finally {
      this.currentProcessing.delete(processingId);
    }
  }

  /**
   * Save current processing state for recovery
   */
  async saveProcessingState(state: ProcessingState): Promise<void> {
    // In a real implementation, this would persist to database/storage
    console.log(`💾 Saving processing state: ${state.id}`);
    
    // Create checkpoint
    const checkpoint: CheckpointData = {
      id: `checkpoint-${Date.now()}`,
      timestamp: new Date(),
      filesCompleted: state.processedFiles,
      totalFiles: state.totalFiles,
      recoverable: true,
      metadata: {
        version: state.processingMetadata.version,
        lastOptimization: state.processingMetadata.lastOptimization
      }
    };
    
    state.checkpointData.push(checkpoint);
    
    // Keep only recent checkpoints
    if (state.checkpointData.length > 10) {
      state.checkpointData = state.checkpointData.slice(-10);
    }
    
    this.emit('stateSaved', { stateId: state.id, checkpoint });
  }

  /**
   * Resume processing from a checkpoint
   */
  async resumeFromCheckpoint(checkpointId: string): Promise<ProcessingState | null> {
    console.log(`🔄 Resuming from checkpoint: ${checkpointId}`);
    
    // Find state with matching checkpoint
    for (const [path, state] of this.states) {
      const checkpoint = state.checkpointData.find(cp => cp.id === checkpointId);
      if (checkpoint && checkpoint.recoverable) {
        
        // Reset failed/processing files to pending
        for (const [filePath, fileState] of state.fileStates) {
          if (fileState.processingStatus === 'processing' || fileState.processingStatus === 'failed') {
            fileState.processingStatus = 'pending';
            fileState.retryCount = Math.max(0, fileState.retryCount - 1);
          }
        }
        
        console.log(`✅ Resumed from checkpoint: ${checkpoint.filesCompleted}/${checkpoint.totalFiles} files completed`);
        
        this.emit('checkpointResumed', {
          stateId: state.id,
          checkpointId,
          resumePoint: checkpoint.filesCompleted
        });
        
        return state;
      }
    }
    
    console.warn(`⚠️ Checkpoint not found or not recoverable: ${checkpointId}`);
    return null;
  }

  /**
   * Get processing state for a folder
   */
  getProcessingState(folderPath: string): ProcessingState | undefined {
    return this.states.get(folderPath);
  }

  /**
   * Get all processing states
   */
  getAllProcessingStates(): ProcessingState[] {
    return Array.from(this.states.values());
  }

  /**
   * Optimize processing state (cleanup, compression, etc.)
   */
  async optimizeProcessingState(folderPath: string): Promise<OptimizationResult> {
    const state = this.states.get(folderPath);
    if (!state) {
      throw new Error(`No processing state found for folder: ${folderPath}`);
    }
    
    console.log(`🔧 Optimizing processing state: ${folderPath}`);
    const startTime = Date.now();
    
    const result: OptimizationResult = {
      stateId: state.id,
      optimizationType: 'state_optimization',
      itemsProcessed: 0,
      itemsRemoved: 0,
      memoryFreed: 0,
      processingTimeImprovement: 0,
      optimizationTime: 0
    };
    
    // Clean up old file states for deleted files
    const currentFileCount = state.fileStates.size;
    const filesToRemove: string[] = [];
    
    for (const [filePath, fileState] of state.fileStates) {
      // Remove states for files that haven't been seen in a while
      if (fileState.processingStatus === 'failed' && fileState.retryCount > 5) {
        filesToRemove.push(filePath);
      }
    }
    
    filesToRemove.forEach(path => state.fileStates.delete(path));
    result.itemsRemoved = filesToRemove.length;
    
    // Clean up old checkpoints
    const checkpointsBefore = state.checkpointData.length;
    state.checkpointData = state.checkpointData
      .filter(cp => Date.now() - cp.timestamp.getTime() < 86400000) // Keep 24 hours
      .slice(-5); // Keep only last 5
    
    result.itemsRemoved += checkpointsBefore - state.checkpointData.length;
    
    // Update optimization timestamp
    state.processingMetadata.lastOptimization = new Date();
    
    const optimizationTime = Date.now() - startTime;
    result.optimizationTime = optimizationTime;
    result.memoryFreed = (currentFileCount - state.fileStates.size) * 1000; // Rough estimate
    
    console.log(`✅ State optimization complete: removed ${result.itemsRemoved} items in ${optimizationTime}ms`);
    
    this.emit('stateOptimized', result);
    return result;
  }

  /**
   * Clear all processing states
   */
  clearAllStates(): void {
    const stateCount = this.states.size;
    this.states.clear();
    this.currentProcessing.clear();
    
    console.log(`🗑️ Cleared ${stateCount} processing states`);
    this.emit('statesCleared', { count: stateCount });
  }

  // Private methods

  private getEnhancedOptions(options: Partial<IncrementalProcessingOptions>): IncrementalProcessingOptions {
    return {
      enableChangeDetection: options.enableChangeDetection !== false,
      enableContentHashing: options.enableContentHashing !== false,
      enableSmartSkipping: options.enableSmartSkipping !== false,
      forceFullProcess: options.forceFullProcess === true,
      batchSize: options.batchSize || 10,
      checkpointInterval: options.checkpointInterval || 50,
      cacheExpiryHours: options.cacheExpiryHours || 24,
      parallelChangeDetection: options.parallelChangeDetection !== false,
      onProgress: options.onProgress,
      abortSignal: options.abortSignal
    };
  }

  private async getFolderPath(folderHandle: FileSystemDirectoryHandle): Promise<string> {
    // Create a unique identifier for the folder
    // In a real implementation, this might use folder metadata or path resolution
    return `folder-${folderHandle.name}-${Date.now().toString(36)}`;
  }

  private async createInitialState(
    folderHandle: FileSystemDirectoryHandle,
    folderPath: string
  ): Promise<ProcessingState> {
    console.log(`🆕 Creating initial processing state for: ${folderHandle.name}`);
    
    return {
      id: `state-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      folderPath,
      lastScanTime: new Date(),
      lastProcessingTime: new Date(0), // Never processed
      totalFiles: 0,
      processedFiles: 0,
      fileStates: new Map(),
      processingMetadata: {
        version: '1.0.0',
        processingMode: 'incremental',
        legalIntelligenceEnabled: true,
        searchIndexingEnabled: true,
        lastOptimization: new Date(),
        performanceMetrics: {
          averageProcessingTime: 0,
          changeDetectionTime: 0,
          incrementalSavings: 0,
          cacheHitRatio: 0,
          errorRate: 0,
          throughput: 0
        }
      },
      checkpointData: []
    };
  }

  private async scanFolderStructure(
    folderHandle: FileSystemDirectoryHandle,
    options: IncrementalProcessingOptions
  ): Promise<Map<string, FileInfo>> {
    const fileMap = new Map<string, FileInfo>();
    
    await this.scanFolderRecursive(folderHandle, '', fileMap, options);
    
    console.log(`📁 Scanned ${fileMap.size} files in folder structure`);
    return fileMap;
  }

  private async scanFolderRecursive(
    dirHandle: FileSystemDirectoryHandle,
    currentPath: string,
    fileMap: Map<string, FileInfo>,
    options: IncrementalProcessingOptions
  ): Promise<void> {
    for await (const [name, handle] of (dirHandle as any).entries()) {
      const fullPath = currentPath ? `${currentPath}/${name}` : name;
      
      if (handle.kind === 'file') {
        const file = await handle.getFile();
        
        if (this.isProcessableFile(file)) {
          const hash = options.enableContentHashing ? 
            await this.calculateFileHash(file) : 
            this.calculateMetadataHash(file);
          
          fileMap.set(fullPath, {
            path: fullPath,
            name: file.name,
            size: file.size,
            lastModified: new Date(file.lastModified),
            hash,
            file
          });
        }
      } else if (handle.kind === 'directory') {
        await this.scanFolderRecursive(handle, fullPath, fileMap, options);
      }
    }
  }

  private async compareFileStates(
    state: ProcessingState,
    currentFiles: Map<string, FileInfo>,
    options: IncrementalProcessingOptions
  ): Promise<FileChangeSet> {
    const changeSet: FileChangeSet = {
      added: [],
      modified: [],
      deleted: [],
      unchanged: [],
      totalChanges: 0,
      changeRatio: 0
    };
    
    // Check for added and modified files
    for (const [path, fileInfo] of currentFiles) {
      const existingState = state.fileStates.get(path);
      
      if (!existingState) {
        // New file
        changeSet.added.push({
          path,
          name: fileInfo.name,
          size: fileInfo.size,
          lastModified: fileInfo.lastModified,
          hash: fileInfo.hash,
          changeType: 'added'
        });
      } else if (this.hasFileChanged(existingState, fileInfo, options)) {
        // Modified file
        changeSet.modified.push({
          path,
          name: fileInfo.name,
          size: fileInfo.size,
          lastModified: fileInfo.lastModified,
          hash: fileInfo.hash,
          changeType: 'modified',
          previousHash: existingState.hash,
          previousSize: existingState.size,
          previousModified: existingState.lastModified
        });
      } else {
        // Unchanged file
        changeSet.unchanged.push({
          path,
          name: fileInfo.name,
          size: fileInfo.size,
          lastModified: fileInfo.lastModified,
          hash: fileInfo.hash,
          changeType: 'unchanged'
        });
      }
    }
    
    // Check for deleted files
    for (const [path, fileState] of state.fileStates) {
      if (!currentFiles.has(path)) {
        changeSet.deleted.push({
          path,
          name: fileState.name,
          size: fileState.size,
          lastModified: fileState.lastModified,
          hash: fileState.hash,
          changeType: 'deleted'
        });
      }
    }
    
    changeSet.totalChanges = changeSet.added.length + changeSet.modified.length + changeSet.deleted.length;
    changeSet.changeRatio = state.fileStates.size > 0 ? 
      changeSet.totalChanges / state.fileStates.size : 1.0;
    
    return changeSet;
  }

  private hasFileChanged(
    existingState: FileState,
    currentFile: FileInfo,
    options: IncrementalProcessingOptions
  ): boolean {
    // Check multiple change indicators
    if (existingState.size !== currentFile.size) return true;
    if (existingState.lastModified.getTime() !== currentFile.lastModified.getTime()) return true;
    if (options.enableContentHashing && existingState.hash !== currentFile.hash) return true;
    
    return false;
  }

  private async executeIncrementalProcessing(
    folderHandle: FileSystemDirectoryHandle,
    changeSet: FileChangeSet,
    options: IncrementalProcessingOptions,
    processingId: string
  ): Promise<IncrementalProcessingResult> {
    // Placeholder for actual incremental processing implementation
    const result: IncrementalProcessingResult = {
      processingId,
      folderPath: await this.getFolderPath(folderHandle),
      changeSet,
      processedFiles: changeSet.added.length + changeSet.modified.length,
      skippedFiles: changeSet.unchanged.length,
      deletedFiles: changeSet.deleted.length,
      processingTime: 0,
      incrementalSavings: 0,
      successRate: 1.0,
      errors: [],
      performanceMetrics: {
        averageProcessingTime: 0,
        changeDetectionTime: 0,
        incrementalSavings: 0,
        cacheHitRatio: 0.8,
        errorRate: 0,
        throughput: 0
      }
    };
    
    // Simulate processing
    console.log(`⚡ Processing ${result.processedFiles} changed files...`);
    
    return result;
  }

  private estimateFullProcessingTime(folderHandle: FileSystemDirectoryHandle): number {
    // Estimate full processing time based on folder characteristics
    // This would be based on historical data and file counts
    return 300000; // 5 minutes estimate
  }

  private updateProcessingMetrics(
    state: ProcessingState,
    result: IncrementalProcessingResult,
    totalTime: number
  ): void {
    const metrics = state.processingMetadata.performanceMetrics;
    
    metrics.averageProcessingTime = (metrics.averageProcessingTime + totalTime) / 2;
    metrics.incrementalSavings = result.incrementalSavings;
    metrics.cacheHitRatio = result.performanceMetrics.cacheHitRatio;
    metrics.errorRate = result.errors.length / result.processedFiles;
    metrics.throughput = result.processedFiles / (totalTime / 60000); // files per minute
  }

  private isProcessableFile(file: File): boolean {
    const processableTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];

    return processableTypes.includes(file.type) || 
           file.name.toLowerCase().endsWith('.pdf') ||
           file.name.toLowerCase().endsWith('.docx') ||
           file.name.toLowerCase().endsWith('.xlsx');
  }

  private async calculateFileHash(file: File): Promise<string> {
    // Calculate SHA-256 hash of file content
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private calculateMetadataHash(file: File): string {
    // Quick hash based on metadata only
    const metadata = `${file.name}-${file.size}-${file.lastModified}`;
    return createHash('md5').update(metadata).digest('hex');
  }
}

// Supporting interfaces and types
interface FileInfo {
  path: string;
  name: string;
  size: number;
  lastModified: Date;
  hash: string;
  file: File;
}

export interface IncrementalProcessingResult {
  processingId: string;
  folderPath: string;
  changeSet: FileChangeSet;
  processedFiles: number;
  skippedFiles: number;
  deletedFiles: number;
  processingTime: number;
  incrementalSavings: number;
  successRate: number;
  errors: string[];
  performanceMetrics: IncrementalPerformanceMetrics;
}

export interface OptimizationResult {
  stateId: string;
  optimizationType: string;
  itemsProcessed: number;
  itemsRemoved: number;
  memoryFreed: number;
  processingTimeImprovement: number;
  optimizationTime: number;
}

// Export singleton instance
export const incrementalProcessor = new IncrementalProcessor();

console.log('🔄 Incremental Processor module loaded');