/**
 * Database Optimization Service
 * Enterprise-grade database optimization for large document volumes
 */

interface DocumentChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  size: number; // bytes
  hash: string;
  metadata: {
    startOffset: number;
    endOffset: number;
    type: 'text' | 'table' | 'header' | 'footer' | 'citation';
    precedence: number;
    entities?: string[];
    keywords?: string[];
  };
  created: Date;
  lastAccessed: Date;
}

interface DocumentIndex {
  documentId: string;
  title: string;
  caseId: string;
  documentType: string;
  size: number;
  chunkCount: number;
  keywords: string[];
  entities: string[];
  lastModified: Date;
  accessCount: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  compressionRatio?: number;
  indexedAt: Date;
}

interface BatchProcessingJob {
  id: string;
  type: 'indexing' | 'compression' | 'cleanup' | 'migration' | 'backup';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  documentIds: string[];
  progress: number; // 0-100
  startTime?: Date;
  endTime?: Date;
  error?: string;
  priority: number;
  estimatedDuration: number; // minutes
  resultStats?: {
    processed: number;
    successful: number;
    failed: number;
    bytesProcessed: number;
    bytesOptimized: number;
  };
}

interface StorageMetrics {
  totalDocuments: number;
  totalSize: number; // bytes
  compressedSize: number; // bytes
  compressionRatio: number;
  avgDocumentSize: number;
  largestDocument: number;
  chunkDistribution: Record<string, number>;
  storageEfficiency: number;
  redundantData: number;
  fragmentationLevel: number;
}

interface QueryOptimization {
  queryType: string;
  indexUsage: string[];
  executionTime: number;
  optimizationSuggestions: string[];
  cacheable: boolean;
  frequency: number;
}

export class DatabaseOptimizationService {
  private documentChunks: Map<string, DocumentChunk[]> = new Map();
  private documentIndices: Map<string, DocumentIndex> = new Map();
  private batchJobs: Map<string, BatchProcessingJob> = new Map();
  private storageMetrics: StorageMetrics | null = null;
  private queryOptimizations: QueryOptimization[] = [];
  
  private configuration = {
    chunkSize: 64 * 1024, // 64KB default chunk size
    maxChunkSize: 512 * 1024, // 512KB max chunk size
    compressionEnabled: true,
    compressionLevel: 6, // 1-9, 6 is balanced
    indexUpdateInterval: 300000, // 5 minutes
    batchProcessingLimit: 50, // documents per batch
    storageThreshold: 0.8, // 80% storage warning
    cacheWarmupSize: 100, // most accessed documents
    redundancyCheck: true,
    autoCleanupEnabled: true,
    backupRetentionDays: 30
  };

  constructor() {
    this.initializeOptimization();
  }

  /**
   * Initialize database optimization system
   */
  private initializeOptimization(): void {
    console.log('💾 Initializing Database Optimization Service...');
    
    // Start periodic optimization tasks
    setInterval(() => {
      this.performMaintenanceTasks();
    }, this.configuration.indexUpdateInterval);
    
    // Initialize storage metrics collection
    setInterval(() => {
      this.updateStorageMetrics();
    }, 60000); // Every minute
    
    console.log('✅ Database optimization service initialized');
    console.log(`📊 Configuration: Chunk size ${this.configuration.chunkSize / 1024}KB, Compression level ${this.configuration.compressionLevel}`);
  }

  /**
   * Optimize document for storage
   */
  async optimizeDocument(documentId: string, content: string, metadata: any): Promise<{
    chunks: DocumentChunk[];
    compressionRatio: number;
    optimizationStats: any;
  }> {
    const startTime = Date.now();
    
    try {
      // 1. Intelligent document chunking
      const chunks = await this.chunkDocument(documentId, content, metadata);
      
      // 2. Apply compression if enabled
      let compressionRatio = 1.0;
      if (this.configuration.compressionEnabled) {
        compressionRatio = await this.compressChunks(chunks);
      }
      
      // 3. Store chunks efficiently
      this.documentChunks.set(documentId, chunks);
      
      // 4. Update document index
      await this.updateDocumentIndex(documentId, chunks, metadata);
      
      // 5. Calculate optimization stats
      const optimizationStats = {
        originalSize: content.length,
        chunksCreated: chunks.length,
        avgChunkSize: chunks.reduce((sum, chunk) => sum + chunk.size, 0) / chunks.length,
        compressionRatio,
        processingTime: Date.now() - startTime,
        storageEfficiency: this.calculateStorageEfficiency(chunks)
      };
      
      console.log(`📊 Document ${documentId} optimized: ${chunks.length} chunks, ${compressionRatio.toFixed(2)}x compression`);
      
      return {
        chunks,
        compressionRatio,
        optimizationStats
      };
      
    } catch (error) {
      console.error(`❌ Failed to optimize document ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Intelligent document chunking based on content structure
   */
  private async chunkDocument(documentId: string, content: string, metadata: any): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];
    
    // Analyze document structure for intelligent chunking
    const structuralBreaks = this.identifyStructuralBreaks(content);
    
    let currentOffset = 0;
    let chunkIndex = 0;
    
    for (const breakPoint of structuralBreaks) {
      if (breakPoint.offset - currentOffset > this.configuration.maxChunkSize) {
        // Break large sections into smaller chunks
        const subChunks = this.createSubChunks(
          content.substring(currentOffset, breakPoint.offset),
          documentId,
          chunkIndex,
          currentOffset
        );
        chunks.push(...subChunks);
        chunkIndex += subChunks.length;
      } else {
        // Create chunk for this structural section
        const chunkContent = content.substring(currentOffset, breakPoint.offset);
        if (chunkContent.trim().length > 0) {
          const chunk = await this.createDocumentChunk(
            documentId,
            chunkIndex,
            chunkContent,
            currentOffset,
            breakPoint.type
          );
          chunks.push(chunk);
          chunkIndex++;
        }
      }
      currentOffset = breakPoint.offset;
    }
    
    // Handle remaining content
    if (currentOffset < content.length) {
      const remainingContent = content.substring(currentOffset);
      if (remainingContent.trim().length > 0) {
        const chunk = await this.createDocumentChunk(
          documentId,
          chunkIndex,
          remainingContent,
          currentOffset,
          'text'
        );
        chunks.push(chunk);
      }
    }
    
    return chunks;
  }

  /**
   * Identify structural breaks in legal documents
   */
  private identifyStructuralBreaks(content: string): Array<{ offset: number; type: string }> {
    const breaks: Array<{ offset: number; type: string }> = [];
    
    // Legal document patterns
    const patterns = [
      { regex: /\n\s*WHEREAS\s*,/gi, type: 'whereas_clause' },
      { regex: /\n\s*NOW\s*,?\s*THEREFORE\s*,/gi, type: 'therefore_clause' },
      { regex: /\n\s*\d+\.\s+/g, type: 'numbered_section' },
      { regex: /\n\s*\([a-z]\)\s+/g, type: 'subsection' },
      { regex: /\n\s*IN\s+WITNESS\s+WHEREOF/gi, type: 'signature_block' },
      { regex: /\n\s*ARTICLE\s+[IVX\d]+/gi, type: 'article' },
      { regex: /\n\s*Section\s+\d+/gi, type: 'section' },
      { regex: /\n\s*\[.*?\]/g, type: 'citation' },
      { regex: /\n\s*Table\s+\d+/gi, type: 'table' },
      { regex: /\n\s*Exhibit\s+[A-Z\d]+/gi, type: 'exhibit' }
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.regex.exec(content)) !== null) {
        breaks.push({
          offset: match.index,
          type: pattern.type
        });
      }
    });
    
    // Sort by offset
    breaks.sort((a, b) => a.offset - b.offset);
    
    // Add document start and end
    breaks.unshift({ offset: 0, type: 'document_start' });
    breaks.push({ offset: content.length, type: 'document_end' });
    
    return breaks;
  }

  /**
   * Create sub-chunks for large sections
   */
  private createSubChunks(
    content: string,
    documentId: string,
    startIndex: number,
    baseOffset: number
  ): DocumentChunk[] {
    const subChunks: DocumentChunk[] = [];
    const targetChunkSize = this.configuration.chunkSize;
    
    let offset = 0;
    let chunkIndex = startIndex;
    
    while (offset < content.length) {
      const endOffset = Math.min(offset + targetChunkSize, content.length);
      
      // Try to break at sentence boundaries
      let breakPoint = endOffset;
      if (endOffset < content.length) {
        const sentenceEnd = content.lastIndexOf('.', endOffset);
        const paragraphEnd = content.lastIndexOf('\n', endOffset);
        breakPoint = Math.max(sentenceEnd, paragraphEnd);
        if (breakPoint <= offset) {
          breakPoint = endOffset; // Force break if no good boundary found
        }
      }
      
      const chunkContent = content.substring(offset, breakPoint);
      if (chunkContent.trim().length > 0) {
        const chunk: DocumentChunk = {
          id: `${documentId}_chunk_${chunkIndex}`,
          documentId,
          chunkIndex,
          content: chunkContent,
          size: chunkContent.length,
          hash: this.calculateHash(chunkContent),
          metadata: {
            startOffset: baseOffset + offset,
            endOffset: baseOffset + breakPoint,
            type: 'text',
            precedence: chunkIndex,
            keywords: this.extractKeywords(chunkContent),
            entities: this.extractEntities(chunkContent)
          },
          created: new Date(),
          lastAccessed: new Date()
        };
        
        subChunks.push(chunk);
        chunkIndex++;
      }
      
      offset = breakPoint;
    }
    
    return subChunks;
  }

  /**
   * Create a document chunk
   */
  private async createDocumentChunk(
    documentId: string,
    chunkIndex: number,
    content: string,
    startOffset: number,
    type: string
  ): Promise<DocumentChunk> {
    const chunk: DocumentChunk = {
      id: `${documentId}_chunk_${chunkIndex}`,
      documentId,
      chunkIndex,
      content,
      size: content.length,
      hash: this.calculateHash(content),
      metadata: {
        startOffset,
        endOffset: startOffset + content.length,
        type: type as any,
        precedence: chunkIndex,
        keywords: this.extractKeywords(content),
        entities: this.extractEntities(content)
      },
      created: new Date(),
      lastAccessed: new Date()
    };
    
    return chunk;
  }

  /**
   * Apply compression to chunks
   */
  private async compressChunks(chunks: DocumentChunk[]): Promise<number> {
    let originalSize = 0;
    let compressedSize = 0;
    
    for (const chunk of chunks) {
      originalSize += chunk.size;
      // Simulate compression (in production, would use actual compression library)
      const compressionRatio = this.simulateCompression(chunk.content);
      compressedSize += chunk.size * compressionRatio;
    }
    
    return originalSize / compressedSize;
  }

  /**
   * Simulate compression algorithm
   */
  private simulateCompression(content: string): number {
    // Simulate compression based on content characteristics
    const repetitionRate = this.calculateRepetition(content);
    const whitespaceRate = (content.match(/\s/g) || []).length / content.length;
    
    // Better compression for repetitive and whitespace-heavy content
    let compressionRatio = 0.7; // Base 30% compression
    compressionRatio -= repetitionRate * 0.3; // Up to 30% better for repetitive content
    compressionRatio -= whitespaceRate * 0.2; // Up to 20% better for whitespace
    
    return Math.max(0.2, compressionRatio); // Minimum 80% compression
  }

  /**
   * Calculate content repetition rate
   */
  private calculateRepetition(content: string): number {
    const words = content.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    return 1 - (uniqueWords.size / words.length);
  }

  /**
   * Update document index
   */
  private async updateDocumentIndex(
    documentId: string,
    chunks: DocumentChunk[],
    metadata: any
  ): Promise<void> {
    const allKeywords = new Set<string>();
    const allEntities = new Set<string>();
    
    chunks.forEach(chunk => {
      chunk.metadata.keywords?.forEach(keyword => allKeywords.add(keyword));
      chunk.metadata.entities?.forEach(entity => allEntities.add(entity));
    });
    
    const index: DocumentIndex = {
      documentId,
      title: metadata.title || 'Untitled Document',
      caseId: metadata.caseId || '',
      documentType: metadata.type || 'unknown',
      size: chunks.reduce((sum, chunk) => sum + chunk.size, 0),
      chunkCount: chunks.length,
      keywords: Array.from(allKeywords),
      entities: Array.from(allEntities),
      lastModified: new Date(),
      accessCount: 0,
      priority: this.determinePriority(metadata),
      indexedAt: new Date()
    };
    
    this.documentIndices.set(documentId, index);
    console.log(`📇 Updated index for document ${documentId}: ${chunks.length} chunks, ${allKeywords.size} keywords`);
  }

  /**
   * Determine document priority based on metadata
   */
  private determinePriority(metadata: any): 'low' | 'medium' | 'high' | 'critical' {
    if (metadata.urgent || metadata.deadline) return 'critical';
    if (metadata.important || metadata.caseType === 'criminal') return 'high';
    if (metadata.active || metadata.recent) return 'medium';
    return 'low';
  }

  /**
   * Start batch processing job
   */
  async startBatchJob(
    type: BatchProcessingJob['type'],
    documentIds: string[],
    priority: number = 1
  ): Promise<string> {
    const jobId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    const job: BatchProcessingJob = {
      id: jobId,
      type,
      status: 'pending',
      documentIds,
      progress: 0,
      priority,
      estimatedDuration: this.estimateJobDuration(type, documentIds.length)
    };
    
    this.batchJobs.set(jobId, job);
    
    // Start processing in background
    this.processBatchJob(jobId).catch(error => {
      console.error(`❌ Batch job ${jobId} failed:`, error);
      job.status = 'failed';
      job.error = error.message;
    });
    
    console.log(`🔄 Started batch job ${jobId}: ${type} for ${documentIds.length} documents`);
    return jobId;
  }

  /**
   * Process batch job
   */
  private async processBatchJob(jobId: string): Promise<void> {
    const job = this.batchJobs.get(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);
    
    job.status = 'running';
    job.startTime = new Date();
    
    const stats = {
      processed: 0,
      successful: 0,
      failed: 0,
      bytesProcessed: 0,
      bytesOptimized: 0
    };
    
    try {
      for (let i = 0; i < job.documentIds.length; i++) {
        const documentId = job.documentIds[i];
        
        try {
          switch (job.type) {
            case 'indexing':
              await this.reindexDocument(documentId);
              break;
            case 'compression':
              await this.compressDocument(documentId);
              break;
            case 'cleanup':
              await this.cleanupDocument(documentId);
              break;
            case 'migration':
              await this.migrateDocument(documentId);
              break;
            case 'backup':
              await this.backupDocument(documentId);
              break;
          }
          
          stats.successful++;
          stats.bytesProcessed += this.getDocumentSize(documentId);
          
        } catch (error) {
          console.error(`❌ Failed to process document ${documentId}:`, error);
          stats.failed++;
        }
        
        stats.processed++;
        job.progress = (stats.processed / job.documentIds.length) * 100;
        
        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      job.status = 'completed';
      job.resultStats = stats;
      
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      job.endTime = new Date();
      console.log(`✅ Batch job ${jobId} ${job.status}: ${stats.successful}/${stats.processed} successful`);
    }
  }

  /**
   * Estimate job duration
   */
  private estimateJobDuration(type: string, documentCount: number): number {
    const baseTimePerDoc = {
      indexing: 0.5, // 30 seconds per document
      compression: 1.0, // 1 minute per document
      cleanup: 0.2, // 12 seconds per document
      migration: 2.0, // 2 minutes per document
      backup: 1.5 // 1.5 minutes per document
    };
    
    return (baseTimePerDoc[type as keyof typeof baseTimePerDoc] || 1.0) * documentCount;
  }

  /**
   * Perform maintenance tasks
   */
  private async performMaintenanceTasks(): Promise<void> {
    try {
      // 1. Update storage metrics
      await this.updateStorageMetrics();
      
      // 2. Clean up expired data
      if (this.configuration.autoCleanupEnabled) {
        await this.cleanupExpiredData();
      }
      
      // 3. Optimize indices
      await this.optimizeIndices();
      
      // 4. Check for redundant data
      if (this.configuration.redundancyCheck) {
        await this.checkRedundantData();
      }
      
      // 5. Update query optimizations
      await this.analyzeQueryPerformance();
      
      console.log('🔧 Database maintenance tasks completed');
      
    } catch (error) {
      console.error('❌ Database maintenance failed:', error);
    }
  }

  /**
   * Update storage metrics
   */
  private async updateStorageMetrics(): Promise<void> {
    let totalSize = 0;
    let compressedSize = 0;
    let documentCount = 0;
    const chunkDistribution: Record<string, number> = {};
    
    this.documentIndices.forEach((index, documentId) => {
      documentCount++;
      totalSize += index.size;
      
      const chunks = this.documentChunks.get(documentId) || [];
      chunks.forEach(chunk => {
        const type = chunk.metadata.type;
        chunkDistribution[type] = (chunkDistribution[type] || 0) + 1;
      });
      
      if (index.compressionRatio) {
        compressedSize += index.size / index.compressionRatio;
      } else {
        compressedSize += index.size;
      }
    });
    
    this.storageMetrics = {
      totalDocuments: documentCount,
      totalSize,
      compressedSize,
      compressionRatio: totalSize / compressedSize,
      avgDocumentSize: documentCount > 0 ? totalSize / documentCount : 0,
      largestDocument: Math.max(...Array.from(this.documentIndices.values()).map(i => i.size)),
      chunkDistribution,
      storageEfficiency: this.calculateOverallStorageEfficiency(),
      redundantData: await this.calculateRedundantData(),
      fragmentationLevel: this.calculateFragmentation()
    };
  }

  /**
   * Utility methods
   */
  
  private calculateHash(content: string): string {
    // Simple hash function (in production, would use cryptographic hash)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  private extractKeywords(content: string): string[] {
    // Simple keyword extraction (in production, would use NLP)
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !this.isStopWord(word));
    
    const wordFreq: Record<string, number> = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  private extractEntities(content: string): string[] {
    // Simple entity extraction (in production, would use NER)
    const entities: string[] = [];
    
    // Legal entity patterns
    const patterns = [
      /\b[A-Z][a-z]+ v\.? [A-Z][a-z]+\b/g, // Case names
      /\b\d+\s+[A-Z][a-z]+\.?\s+\d+\b/g, // Citations
      /\b[A-Z]{2,}\s+[A-Z][a-z]+\b/g, // Organizations
      /\$[\d,]+\.?\d*/g // Monetary amounts
    ];
    
    patterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      entities.push(...matches);
    });
    
    return [...new Set(entities)].slice(0, 20);
  }

  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before',
      'after', 'above', 'below', 'between', 'among', 'throughout', 'shall',
      'will', 'may', 'can', 'must', 'should', 'would', 'could', 'might'
    ]);
    return stopWords.has(word);
  }

  private calculateStorageEfficiency(chunks: DocumentChunk[]): number {
    // Calculate based on chunk size distribution and compression
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const optimalChunkCount = Math.ceil(totalSize / this.configuration.chunkSize);
    const actualChunkCount = chunks.length;
    
    return Math.min(1.0, optimalChunkCount / actualChunkCount);
  }

  private calculateOverallStorageEfficiency(): number {
    let totalEfficiency = 0;
    let documentCount = 0;
    
    this.documentChunks.forEach(chunks => {
      totalEfficiency += this.calculateStorageEfficiency(chunks);
      documentCount++;
    });
    
    return documentCount > 0 ? totalEfficiency / documentCount : 0;
  }

  private async calculateRedundantData(): Promise<number> {
    const chunkHashes = new Map<string, number>();
    let totalSize = 0;
    let redundantSize = 0;
    
    this.documentChunks.forEach(chunks => {
      chunks.forEach(chunk => {
        totalSize += chunk.size;
        const count = chunkHashes.get(chunk.hash) || 0;
        chunkHashes.set(chunk.hash, count + 1);
        
        if (count > 0) {
          redundantSize += chunk.size;
        }
      });
    });
    
    return totalSize > 0 ? redundantSize / totalSize : 0;
  }

  private calculateFragmentation(): number {
    // Simple fragmentation calculation based on chunk size variance
    const allChunkSizes: number[] = [];
    
    this.documentChunks.forEach(chunks => {
      chunks.forEach(chunk => {
        allChunkSizes.push(chunk.size);
      });
    });
    
    if (allChunkSizes.length === 0) return 0;
    
    const avgSize = allChunkSizes.reduce((sum, size) => sum + size, 0) / allChunkSizes.length;
    const variance = allChunkSizes.reduce((sum, size) => sum + Math.pow(size - avgSize, 2), 0) / allChunkSizes.length;
    const stdDev = Math.sqrt(variance);
    
    return Math.min(1.0, stdDev / avgSize);
  }

  private getDocumentSize(documentId: string): number {
    const index = this.documentIndices.get(documentId);
    return index?.size || 0;
  }

  // Stub methods for batch operations
  private async reindexDocument(documentId: string): Promise<void> {
    console.log(`📇 Reindexing document ${documentId}`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async compressDocument(documentId: string): Promise<void> {
    console.log(`🗜️ Compressing document ${documentId}`);
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  private async cleanupDocument(documentId: string): Promise<void> {
    console.log(`🧹 Cleaning up document ${documentId}`);
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  private async migrateDocument(documentId: string): Promise<void> {
    console.log(`📦 Migrating document ${documentId}`);
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  private async backupDocument(documentId: string): Promise<void> {
    console.log(`💾 Backing up document ${documentId}`);
    await new Promise(resolve => setTimeout(resolve, 150));
  }

  private async cleanupExpiredData(): Promise<void> {
    const cutoffDate = new Date(Date.now() - this.configuration.backupRetentionDays * 24 * 60 * 60 * 1000);
    
    // Remove old batch jobs
    this.batchJobs.forEach((job, jobId) => {
      if (job.endTime && job.endTime < cutoffDate) {
        this.batchJobs.delete(jobId);
      }
    });
    
    console.log('🧹 Cleaned up expired data');
  }

  private async optimizeIndices(): Promise<void> {
    // Simulate index optimization
    console.log('📇 Optimizing document indices');
  }

  private async checkRedundantData(): Promise<void> {
    const redundancyLevel = await this.calculateRedundantData();
    if (redundancyLevel > 0.1) { // More than 10% redundant
      console.log(`⚠️ High data redundancy detected: ${(redundancyLevel * 100).toFixed(1)}%`);
    }
  }

  private async analyzeQueryPerformance(): Promise<void> {
    // Simulate query performance analysis
    console.log('📊 Analyzing query performance');
  }

  /**
   * Public API methods
   */

  getStorageMetrics(): StorageMetrics | null {
    return this.storageMetrics;
  }

  getBatchJob(jobId: string): BatchProcessingJob | null {
    return this.batchJobs.get(jobId) || null;
  }

  getAllBatchJobs(): BatchProcessingJob[] {
    return Array.from(this.batchJobs.values());
  }

  getDocumentIndex(documentId: string): DocumentIndex | null {
    return this.documentIndices.get(documentId) || null;
  }

  getAllDocumentIndices(): DocumentIndex[] {
    return Array.from(this.documentIndices.values());
  }

  getDocumentChunks(documentId: string): DocumentChunk[] {
    return this.documentChunks.get(documentId) || [];
  }

  async searchDocuments(query: string, options: {
    caseId?: string;
    documentType?: string;
    limit?: number;
  } = {}): Promise<DocumentIndex[]> {
    const results: DocumentIndex[] = [];
    const queryWords = query.toLowerCase().split(/\s+/);
    
    this.documentIndices.forEach(index => {
      // Filter by options
      if (options.caseId && index.caseId !== options.caseId) return;
      if (options.documentType && index.documentType !== options.documentType) return;
      
      // Check if query matches keywords or entities
      const relevanceScore = this.calculateRelevanceScore(queryWords, index);
      if (relevanceScore > 0) {
        results.push(index);
      }
    });
    
    // Sort by relevance and apply limit
    results.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(queryWords, a);
      const scoreB = this.calculateRelevanceScore(queryWords, b);
      return scoreB - scoreA;
    });
    
    return results.slice(0, options.limit || 50);
  }

  private calculateRelevanceScore(queryWords: string[], index: DocumentIndex): number {
    let score = 0;
    
    queryWords.forEach(word => {
      // Check title
      if (index.title.toLowerCase().includes(word)) score += 3;
      
      // Check keywords
      if (index.keywords.some(keyword => keyword.includes(word))) score += 2;
      
      // Check entities
      if (index.entities.some(entity => entity.toLowerCase().includes(word))) score += 1;
    });
    
    return score;
  }

  async optimizeStorageConfiguration(targetEfficiency: number = 0.85): Promise<{
    currentEfficiency: number;
    recommendations: string[];
    estimatedImprovement: number;
  }> {
    const currentEfficiency = this.storageMetrics?.storageEfficiency || 0;
    const recommendations: string[] = [];
    
    if (currentEfficiency < targetEfficiency) {
      const gap = targetEfficiency - currentEfficiency;
      
      if (this.storageMetrics?.fragmentationLevel && this.storageMetrics.fragmentationLevel > 0.3) {
        recommendations.push('Defragment document chunks to reduce fragmentation');
      }
      
      if (this.storageMetrics?.redundantData && this.storageMetrics.redundantData > 0.1) {
        recommendations.push('Implement deduplication to reduce redundant data');
      }
      
      if (this.storageMetrics?.compressionRatio && this.storageMetrics.compressionRatio < 2.0) {
        recommendations.push('Increase compression level for better space utilization');
      }
      
      recommendations.push('Optimize chunk size based on document characteristics');
      recommendations.push('Implement tiered storage for frequently vs rarely accessed documents');
    }
    
    return {
      currentEfficiency,
      recommendations,
      estimatedImprovement: Math.min(gap * 0.7, 0.2) // Conservative estimate
    };
  }

  updateConfiguration(newConfig: Partial<typeof this.configuration>): void {
    this.configuration = { ...this.configuration, ...newConfig };
    console.log('⚙️ Database optimization configuration updated');
  }

  getConfiguration(): typeof this.configuration {
    return { ...this.configuration };
  }
}

// Export singleton instance
export const databaseOptimizationService = new DatabaseOptimizationService();
export default databaseOptimizationService;