/**
 * STREAMING DOCUMENT PROCESSOR
 * Memory-bounded streaming implementation for large document processing
 * 
 * Status: Phase 1, Week 2 - Distributed Processing
 * Purpose: Process documents of any size within 2GB memory limit
 * Integration: Works with enterprise-queue.ts and resource-monitor.ts
 */

import { EventEmitter } from 'events';
import { ResourceMonitor } from './resource-monitor';

export interface StreamingOptions {
  chunkSize: number;           // Size of each processing chunk in bytes
  maxMemoryUsage: number;       // Maximum memory usage in bytes
  enableBackpressure: boolean; // Pause when memory pressure detected
  compressionEnabled: boolean; // Compress chunks in memory
  cacheStrategy: 'none' | 'lru' | 'fifo';
  gcInterval: number;          // Garbage collection interval in ms
  onProgress?: (progress: StreamingProgress) => void;
  abortSignal?: AbortSignal;
}

export interface StreamingProgress {
  bytesProcessed: number;
  totalBytes: number;
  chunksProcessed: number;
  totalChunks: number;
  percentage: number;
  currentMemoryUsage: number;
  estimatedTimeRemaining: number;
  throughput: number; // Bytes per second
  stage: 'initializing' | 'streaming' | 'processing' | 'finalizing' | 'complete';
}

export interface ProcessingChunk {
  id: string;
  index: number;
  data: ArrayBuffer | string;
  size: number;
  startOffset: number;
  endOffset: number;
  processed: boolean;
  result?: ChunkResult;
  retryCount: number;
  checksum?: string;
}

export interface ChunkResult {
  chunkId: string;
  extractedText?: string;
  entities?: any[];
  tables?: any[];
  metadata?: any;
  processingTime: number;
  memoryUsed: number;
  compressed: boolean;
}

export interface StreamingResult {
  documentId: string;
  fileName: string;
  totalSize: number;
  chunksProcessed: number;
  processingTime: number;
  peakMemoryUsage: number;
  averageMemoryUsage: number;
  results: ChunkResult[];
  mergedResult?: any;
  errors: StreamingError[];
  successful: boolean;
}

export interface StreamingError {
  chunkId: string;
  error: string;
  recoverable: boolean;
  retryAttempts: number;
}

export interface MemoryPressureInfo {
  level: 'low' | 'medium' | 'high' | 'critical';
  currentUsage: number;
  limit: number;
  percentage: number;
  recommendation: 'continue' | 'throttle' | 'pause' | 'abort';
}

export class StreamingDocumentProcessor extends EventEmitter {
  private resourceMonitor: ResourceMonitor;
  private activeStreams: Map<string, StreamingSession> = new Map();
  private memoryPool: MemoryPool;
  private gcTimer: NodeJS.Timeout | null = null;
  private compressionWorker: CompressionWorker | null = null;
  
  private readonly DEFAULT_CHUNK_SIZE = 1024 * 1024; // 1MB chunks
  private readonly MAX_MEMORY_LIMIT = 2 * 1024 * 1024 * 1024; // 2GB
  private readonly MEMORY_SAFETY_MARGIN = 0.85; // Use only 85% of limit

  constructor(resourceMonitor: ResourceMonitor) {
    super();
    this.resourceMonitor = resourceMonitor;
    this.memoryPool = new MemoryPool(this.MAX_MEMORY_LIMIT * this.MEMORY_SAFETY_MARGIN);
    
    console.log('🌊 Streaming Document Processor initialized');
    console.log(`   Memory limit: ${(this.MAX_MEMORY_LIMIT / 1024 / 1024).toFixed(0)}MB`);
    console.log(`   Safety margin: ${(this.MEMORY_SAFETY_MARGIN * 100).toFixed(0)}%`);
  }

  /**
   * Process a document using streaming to stay within memory limits
   */
  async processDocumentStream(
    file: File,
    options: Partial<StreamingOptions> = {}
  ): Promise<StreamingResult> {
    const streamId = `stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const enhancedOptions = this.getEnhancedOptions(options);
    
    console.log(`🌊 Starting streaming processing: ${file.name} (${this.formatBytes(file.size)})`);
    
    // Create streaming session
    const session: StreamingSession = {
      id: streamId,
      file,
      options: enhancedOptions,
      chunks: [],
      currentChunkIndex: 0,
      bytesProcessed: 0,
      startTime: Date.now(),
      peakMemoryUsage: 0,
      memoryReadings: [],
      errors: [],
      paused: false,
      aborted: false
    };
    
    this.activeStreams.set(streamId, session);
    
    try {
      // Start garbage collection timer
      this.startGarbageCollection(enhancedOptions.gcInterval);
      
      // Calculate chunks
      const chunks = this.calculateChunks(file.size, enhancedOptions.chunkSize);
      session.chunks = chunks;
      
      console.log(`📊 Processing ${chunks.length} chunks of ${this.formatBytes(enhancedOptions.chunkSize)} each`);
      
      // Process chunks with backpressure
      const results = await this.processChunksWithBackpressure(session);
      
      // Merge results
      const mergedResult = await this.mergeChunkResults(results);
      
      // Calculate final metrics
      const processingTime = Date.now() - session.startTime;
      const peakMemory = Math.max(...session.memoryReadings);
      const avgMemory = session.memoryReadings.reduce((a, b) => a + b, 0) / session.memoryReadings.length;
      
      const streamingResult: StreamingResult = {
        documentId: streamId,
        fileName: file.name,
        totalSize: file.size,
        chunksProcessed: chunks.filter(c => c.processed).length,
        processingTime,
        peakMemoryUsage: peakMemory,
        averageMemoryUsage: avgMemory,
        results,
        mergedResult,
        errors: session.errors,
        successful: session.errors.length === 0
      };
      
      console.log(`✅ Streaming complete: ${file.name}`);
      console.log(`   Peak memory: ${this.formatBytes(peakMemory)} (${(peakMemory / this.MAX_MEMORY_LIMIT * 100).toFixed(1)}% of limit)`);
      console.log(`   Processing time: ${(processingTime / 1000).toFixed(1)}s`);
      console.log(`   Throughput: ${this.formatBytes(file.size / (processingTime / 1000))}/s`);
      
      this.emit('streamingComplete', streamingResult);
      return streamingResult;
      
    } catch (error) {
      console.error(`❌ Streaming failed: ${(error as Error).message}`);
      throw error;
      
    } finally {
      // Cleanup
      this.activeStreams.delete(streamId);
      this.stopGarbageCollection();
      await this.memoryPool.cleanup();
    }
  }

  /**
   * Process chunks with backpressure handling
   */
  private async processChunksWithBackpressure(
    session: StreamingSession
  ): Promise<ChunkResult[]> {
    const results: ChunkResult[] = [];
    const options = session.options;
    
    for (let i = 0; i < session.chunks.length; i++) {
      if (session.aborted) {
        break;
      }
      
      const chunk = session.chunks[i];
      
      // Check memory pressure before processing
      const memoryPressure = await this.checkMemoryPressure();
      
      // Handle backpressure
      if (options.enableBackpressure) {
        await this.handleBackpressure(memoryPressure, session);
      }
      
      // Process chunk
      try {
        const chunkData = await this.readChunk(session.file, chunk);
        const result = await this.processChunk(chunkData, chunk, options);
        
        chunk.processed = true;
        chunk.result = result;
        results.push(result);
        
        // Update progress
        session.bytesProcessed += chunk.size;
        session.currentChunkIndex = i + 1;
        
        // Track memory
        const currentMemory = this.resourceMonitor.getCurrentMetrics().memory.used;
        session.memoryReadings.push(currentMemory);
        session.peakMemoryUsage = Math.max(session.peakMemoryUsage, currentMemory);
        
        // Report progress
        if (options.onProgress) {
          const progress = this.calculateProgress(session);
          options.onProgress(progress);
        }
        
        // Release chunk memory if not caching
        if (options.cacheStrategy === 'none') {
          await this.releaseChunkMemory(chunk);
        }
        
        this.emit('chunkProcessed', {
          chunkId: chunk.id,
          index: i,
          total: session.chunks.length,
          memoryUsage: currentMemory
        });
        
      } catch (error) {
        console.error(`❌ Chunk ${chunk.id} failed: ${(error as Error).message}`);
        
        // Retry logic
        if (chunk.retryCount < 3) {
          chunk.retryCount++;
          i--; // Retry this chunk
          await this.delay(1000 * chunk.retryCount); // Exponential backoff
        } else {
          session.errors.push({
            chunkId: chunk.id,
            error: (error as Error).message,
            recoverable: false,
            retryAttempts: chunk.retryCount
          });
        }
      }
      
      // Yield to event loop periodically
      if (i % 10 === 0) {
        await this.delay(0);
      }
    }
    
    return results;
  }

  /**
   * Read a chunk from the file
   */
  private async readChunk(file: File, chunk: ProcessingChunk): Promise<ArrayBuffer> {
    const slice = file.slice(chunk.startOffset, chunk.endOffset);
    return await slice.arrayBuffer();
  }

  /**
   * Process a single chunk
   */
  private async processChunk(
    data: ArrayBuffer,
    chunk: ProcessingChunk,
    options: StreamingOptions
  ): Promise<ChunkResult> {
    const startTime = Date.now();
    const startMemory = this.resourceMonitor.getCurrentMetrics().memory.used;
    
    // Compress if enabled
    let processedData: ArrayBuffer | string = data;
    let compressed = false;
    
    if (options.compressionEnabled && data.byteLength > 10000) {
      processedData = await this.compressData(data);
      compressed = true;
    }
    
    // Simulate processing (in real implementation, this would extract text, entities, etc.)
    const extractedText = this.simulateTextExtraction(data);
    const entities = this.simulateEntityExtraction(extractedText);
    
    const processingTime = Date.now() - startTime;
    const memoryUsed = this.resourceMonitor.getCurrentMetrics().memory.used - startMemory;
    
    return {
      chunkId: chunk.id,
      extractedText,
      entities,
      tables: [],
      metadata: {
        offset: chunk.startOffset,
        size: chunk.size,
        compressed
      },
      processingTime,
      memoryUsed,
      compressed
    };
  }

  /**
   * Check current memory pressure
   */
  private async checkMemoryPressure(): Promise<MemoryPressureInfo> {
    const metrics = this.resourceMonitor.getCurrentMetrics();
    const currentUsage = metrics.memory.used;
    const limit = this.MAX_MEMORY_LIMIT * this.MEMORY_SAFETY_MARGIN;
    const percentage = currentUsage / limit;
    
    let level: MemoryPressureInfo['level'];
    let recommendation: MemoryPressureInfo['recommendation'];
    
    if (percentage < 0.5) {
      level = 'low';
      recommendation = 'continue';
    } else if (percentage < 0.7) {
      level = 'medium';
      recommendation = 'continue';
    } else if (percentage < 0.85) {
      level = 'high';
      recommendation = 'throttle';
    } else {
      level = 'critical';
      recommendation = percentage > 0.95 ? 'abort' : 'pause';
    }
    
    return {
      level,
      currentUsage,
      limit,
      percentage: percentage * 100,
      recommendation
    };
  }

  /**
   * Handle backpressure based on memory pressure
   */
  private async handleBackpressure(
    pressure: MemoryPressureInfo,
    session: StreamingSession
  ): Promise<void> {
    switch (pressure.recommendation) {
      case 'throttle':
        // Slow down processing
        console.log(`⚠️ Memory pressure high (${pressure.percentage.toFixed(1)}%), throttling...`);
        await this.delay(500);
        break;
        
      case 'pause':
        // Pause and wait for memory to free up
        console.log(`🚨 Memory pressure critical (${pressure.percentage.toFixed(1)}%), pausing...`);
        session.paused = true;
        
        // Try to free memory
        await this.resourceMonitor.optimizeMemory();
        await this.memoryPool.freeMemory(100 * 1024 * 1024); // Free 100MB
        
        // Wait for memory to reduce
        let attempts = 0;
        while (attempts < 10) {
          await this.delay(1000);
          const newPressure = await this.checkMemoryPressure();
          if (newPressure.percentage < 70) {
            break;
          }
          attempts++;
        }
        
        session.paused = false;
        console.log('▶️ Resuming after memory pressure reduced');
        break;
        
      case 'abort':
        // Abort processing
        console.error('💥 Memory limit exceeded, aborting stream');
        session.aborted = true;
        throw new Error('Memory limit exceeded during streaming');
        
      case 'continue':
      default:
        // No action needed
        break;
    }
  }

  /**
   * Merge results from all chunks
   */
  private async mergeChunkResults(results: ChunkResult[]): Promise<any> {
    // Combine all extracted text
    const fullText = results
      .map(r => r.extractedText)
      .filter(Boolean)
      .join('\n');
    
    // Combine all entities (deduplicate)
    const allEntities = results.flatMap(r => r.entities || []);
    const uniqueEntities = this.deduplicateEntities(allEntities);
    
    // Combine all tables
    const allTables = results.flatMap(r => r.tables || []);
    
    return {
      text: fullText,
      entities: uniqueEntities,
      tables: allTables,
      chunkCount: results.length,
      metadata: {
        processingMethod: 'streaming',
        chunksProcessed: results.length,
        compressionUsed: results.some(r => r.compressed)
      }
    };
  }

  /**
   * Calculate chunk boundaries
   */
  private calculateChunks(fileSize: number, chunkSize: number): ProcessingChunk[] {
    const chunks: ProcessingChunk[] = [];
    const numChunks = Math.ceil(fileSize / chunkSize);
    
    for (let i = 0; i < numChunks; i++) {
      const startOffset = i * chunkSize;
      const endOffset = Math.min(startOffset + chunkSize, fileSize);
      
      chunks.push({
        id: `chunk-${i}`,
        index: i,
        data: null as any,
        size: endOffset - startOffset,
        startOffset,
        endOffset,
        processed: false,
        retryCount: 0
      });
    }
    
    return chunks;
  }

  /**
   * Calculate streaming progress
   */
  private calculateProgress(session: StreamingSession): StreamingProgress {
    const percentage = (session.bytesProcessed / session.file.size) * 100;
    const elapsedTime = Date.now() - session.startTime;
    const throughput = session.bytesProcessed / (elapsedTime / 1000);
    const estimatedTimeRemaining = ((session.file.size - session.bytesProcessed) / throughput) * 1000;
    
    let stage: StreamingProgress['stage'];
    if (percentage === 0) stage = 'initializing';
    else if (percentage < 100) stage = 'streaming';
    else stage = 'complete';
    
    return {
      bytesProcessed: session.bytesProcessed,
      totalBytes: session.file.size,
      chunksProcessed: session.currentChunkIndex,
      totalChunks: session.chunks.length,
      percentage,
      currentMemoryUsage: this.resourceMonitor.getCurrentMetrics().memory.used,
      estimatedTimeRemaining,
      throughput,
      stage
    };
  }

  /**
   * Release memory used by a chunk
   */
  private async releaseChunkMemory(chunk: ProcessingChunk): Promise<void> {
    chunk.data = null as any;
    if (chunk.result) {
      // Keep only essential data
      chunk.result.extractedText = undefined;
    }
    
    // Suggest garbage collection
    if (global.gc) {
      global.gc();
    }
  }

  /**
   * Start periodic garbage collection
   */
  private startGarbageCollection(interval: number): void {
    this.gcTimer = setInterval(() => {
      if (global.gc) {
        const before = this.resourceMonitor.getCurrentMetrics().memory.used;
        global.gc();
        const after = this.resourceMonitor.getCurrentMetrics().memory.used;
        const freed = before - after;
        
        if (freed > 0) {
          console.log(`♻️ GC freed ${this.formatBytes(freed)}`);
        }
      }
    }, interval);
  }

  /**
   * Stop garbage collection timer
   */
  private stopGarbageCollection(): void {
    if (this.gcTimer) {
      clearInterval(this.gcTimer);
      this.gcTimer = null;
    }
  }

  /**
   * Compress data to reduce memory usage
   */
  private async compressData(data: ArrayBuffer): Promise<string> {
    // Simple compression simulation (in production, use actual compression)
    const uint8Array = new Uint8Array(data);
    return btoa(String.fromCharCode.apply(null, Array.from(uint8Array.slice(0, 1000))));
  }

  /**
   * Simulate text extraction from chunk
   */
  private simulateTextExtraction(data: ArrayBuffer): string {
    // Simulation - in production, this would use actual PDF extraction
    const decoder = new TextDecoder();
    const text = decoder.decode(data.slice(0, Math.min(1000, data.byteLength)));
    return text || `Extracted text from ${data.byteLength} bytes`;
  }

  /**
   * Simulate entity extraction
   */
  private simulateEntityExtraction(text: string): any[] {
    // Simulation - in production, this would use NLP
    return [
      { type: 'person', text: 'John Doe', confidence: 0.95 },
      { type: 'organization', text: 'Acme Corp', confidence: 0.88 }
    ];
  }

  /**
   * Deduplicate entities
   */
  private deduplicateEntities(entities: any[]): any[] {
    const seen = new Set();
    return entities.filter(entity => {
      const key = `${entity.type}-${entity.text}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Get enhanced options with defaults
   */
  private getEnhancedOptions(options: Partial<StreamingOptions>): StreamingOptions {
    return {
      chunkSize: options.chunkSize || this.DEFAULT_CHUNK_SIZE,
      maxMemoryUsage: options.maxMemoryUsage || this.MAX_MEMORY_LIMIT * this.MEMORY_SAFETY_MARGIN,
      enableBackpressure: options.enableBackpressure !== false,
      compressionEnabled: options.compressionEnabled !== false,
      cacheStrategy: options.cacheStrategy || 'none',
      gcInterval: options.gcInterval || 30000, // 30 seconds
      onProgress: options.onProgress,
      abortSignal: options.abortSignal
    };
  }

  /**
   * Format bytes for display
   */
  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)}GB`;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get active streaming sessions
   */
  getActiveSessions(): StreamingSession[] {
    return Array.from(this.activeStreams.values());
  }

  /**
   * Abort a streaming session
   */
  abortSession(sessionId: string): boolean {
    const session = this.activeStreams.get(sessionId);
    if (session) {
      session.aborted = true;
      console.log(`🛑 Aborted streaming session: ${sessionId}`);
      return true;
    }
    return false;
  }
}

/**
 * Memory pool for managing chunk allocations
 */
class MemoryPool {
  private limit: number;
  private used: number = 0;
  private allocations: Map<string, number> = new Map();

  constructor(limit: number) {
    this.limit = limit;
  }

  async allocate(id: string, size: number): Promise<boolean> {
    if (this.used + size > this.limit) {
      return false;
    }
    
    this.allocations.set(id, size);
    this.used += size;
    return true;
  }

  release(id: string): void {
    const size = this.allocations.get(id);
    if (size) {
      this.used -= size;
      this.allocations.delete(id);
    }
  }

  async freeMemory(targetBytes: number): Promise<number> {
    let freed = 0;
    
    // Free oldest allocations first
    for (const [id, size] of this.allocations) {
      if (freed >= targetBytes) break;
      
      this.release(id);
      freed += size;
    }
    
    return freed;
  }

  async cleanup(): Promise<void> {
    this.allocations.clear();
    this.used = 0;
  }

  getUsage(): { used: number; limit: number; percentage: number } {
    return {
      used: this.used,
      limit: this.limit,
      percentage: (this.used / this.limit) * 100
    };
  }
}

/**
 * Compression worker for background compression
 */
class CompressionWorker {
  compress(data: ArrayBuffer): Promise<ArrayBuffer> {
    // Placeholder for actual compression implementation
    return Promise.resolve(data);
  }

  decompress(data: ArrayBuffer): Promise<ArrayBuffer> {
    // Placeholder for actual decompression implementation
    return Promise.resolve(data);
  }
}

// Interfaces
interface StreamingSession {
  id: string;
  file: File;
  options: StreamingOptions;
  chunks: ProcessingChunk[];
  currentChunkIndex: number;
  bytesProcessed: number;
  startTime: number;
  peakMemoryUsage: number;
  memoryReadings: number[];
  errors: StreamingError[];
  paused: boolean;
  aborted: boolean;
}

// Export singleton instance
export const streamingProcessor = new StreamingDocumentProcessor(
  new ResourceMonitor({ monitoringInterval: 5000 })
);

console.log('🌊 Streaming Document Processor module loaded');