/**
 * Performance Optimizer - Week 12 Day 1-2
 * Optimize processing pipeline for production use
 */

import { Worker } from 'worker_threads'
import os from 'os'
import crypto from 'crypto'

class WorkerPool {
  constructor(options) {
    this.maxWorkers = options.maxWorkers
    this.workerScript = options.workerScript
    this.workers = []
    this.availableWorkers = []
    this.pendingTasks = []
    this.activeJobs = new Map()
    
    this.initializeWorkers()
  }

  initializeWorkers() {
    for (let i = 0; i < this.maxWorkers; i++) {
      this.createWorker(i)
    }
  }

  createWorker(id) {
    const worker = new Worker(this.workerScript, {
      workerData: { workerId: id }
    })
    
    worker.workerId = id
    worker.isAvailable = true
    
    worker.on('message', (result) => {
      const job = this.activeJobs.get(result.taskId)
      if (job) {
        job.resolve(result)
        this.activeJobs.delete(result.taskId)
        this.releaseWorker(worker)
      }
    })
    
    worker.on('error', (error) => {
      const tasks = Array.from(this.activeJobs.values()).filter(job => 
        job.workerId === worker.workerId
      )
      
      tasks.forEach(job => {
        job.reject(error)
        this.activeJobs.delete(job.taskId)
      })
      
      // Recreate worker
      this.workers = this.workers.filter(w => w.workerId !== id)
      this.createWorker(id)
    })
    
    this.workers.push(worker)
    this.availableWorkers.push(worker)
  }

  async execute(taskType, data) {
    return new Promise((resolve, reject) => {
      const taskId = crypto.randomUUID()
      const task = {
        taskId,
        taskType,
        data,
        resolve,
        reject,
        timestamp: Date.now()
      }
      
      const worker = this.getAvailableWorker()
      if (worker) {
        this.assignTask(worker, task)
      } else {
        this.pendingTasks.push(task)
      }
    })
  }

  getAvailableWorker() {
    return this.availableWorkers.shift()
  }

  assignTask(worker, task) {
    worker.isAvailable = false
    task.workerId = worker.workerId
    this.activeJobs.set(task.taskId, task)
    
    worker.postMessage({
      taskId: task.taskId,
      taskType: task.taskType,
      data: task.data
    })
  }

  releaseWorker(worker) {
    worker.isAvailable = true
    this.availableWorkers.push(worker)
    
    // Process pending tasks
    if (this.pendingTasks.length > 0) {
      const nextTask = this.pendingTasks.shift()
      this.assignTask(worker, nextTask)
    }
  }

  async terminate() {
    await Promise.all(this.workers.map(worker => worker.terminate()))
    this.workers = []
    this.availableWorkers = []
    this.pendingTasks = []
    this.activeJobs.clear()
  }

  getStatus() {
    return {
      totalWorkers: this.workers.length,
      availableWorkers: this.availableWorkers.length,
      activeJobs: this.activeJobs.size,
      pendingTasks: this.pendingTasks.length,
      workerUtilization: 1 - (this.availableWorkers.length / this.workers.length)
    }
  }
}

class PerformanceOptimizer {
  constructor() {
    this.worker_pool = null
    this.cache = new Map()
    this.processing_queue = []
    
    this.optimization_config = {
      max_workers: Math.max(2, os.cpus().length - 1),
      cache_size_limit: 1000,
      cache_ttl: 3600000, // 1 hour
      batch_sizes: {
        electronic: 10,  // Fast processing
        scanned: 3,      // OCR intensive  
        text: 20,        // Very fast
        complex: 5       // Analysis intensive
      },
      memory_threshold: 0.8, // 80% memory usage threshold
      concurrent_batches: 4
    }
    
    this.performance_metrics = {
      total_documents_processed: 0,
      total_processing_time: 0,
      cache_hits: 0,
      cache_misses: 0,
      worker_utilization_history: [],
      batch_performance_history: [],
      memory_usage_history: [],
      error_count: 0
    }
    
    this.processing_stats = new Map()
    this.batch_timings = new Map()
  }

  async initializeWorkerPool() {
    console.log('🚀 Initializing worker pool for performance optimization...')
    
    try {
      this.worker_pool = new WorkerPool({
        maxWorkers: this.optimization_config.max_workers,
        workerScript: new URL('./workers/analysis-worker.js', import.meta.url).pathname
      })
      
      console.log(`✅ Worker pool initialized with ${this.optimization_config.max_workers} workers`)
      
      // Start performance monitoring
      this.startPerformanceMonitoring()
      
      return true
    } catch (error) {
      console.error('❌ Failed to initialize worker pool:', error)
      throw error
    }
  }

  async optimizeDocumentProcessing(documents) {
    console.log(`⚡ Optimizing processing for ${documents.length} documents...`)
    
    const optimization_start = performance.now()
    
    try {
      // Pre-process documents for optimization
      const preprocessed = await this.preprocessDocuments(documents)
      
      // Check cache for previously processed documents
      const { cached_results, uncached_documents } = await this.checkCache(preprocessed)
      
      // Batch documents by type and complexity
      const batches = this.createOptimalBatches(uncached_documents)
      
      // Process batches in parallel using worker pool
      const batch_results = await this.processAllBatches(batches)
      
      // Merge results with cached data
      const final_results = this.mergeBatchResults([...cached_results, ...batch_results])
      
      // Update performance metrics
      const total_time = performance.now() - optimization_start
      this.updatePerformanceMetrics(documents.length, total_time)
      
      console.log(`✅ Document processing optimized in ${Math.round(total_time)}ms`)
      
      return {
        success: true,
        documents_processed: documents.length,
        total_processing_time: total_time,
        cached_results: cached_results.length,
        processed_results: batch_results.reduce((sum, batch) => sum + batch.documents_processed, 0),
        optimization_summary: {
          batches_created: batches.length,
          cache_hit_rate: cached_results.length / documents.length,
          worker_efficiency: this.calculateWorkerEfficiency(),
          memory_efficiency: this.getMemoryEfficiency()
        },
        results: final_results
      }
      
    } catch (error) {
      this.performance_metrics.error_count++
      console.error('❌ Document processing optimization failed:', error)
      throw error
    }
  }

  async preprocessDocuments(documents) {
    console.log('📋 Preprocessing documents for optimization...')
    
    return documents.map(doc => ({
      ...doc,
      processing_hash: this.generateProcessingHash(doc),
      estimated_complexity: this.estimateProcessingComplexity(doc),
      processing_type: this.determineProcessingType(doc),
      priority: this.calculateProcessingPriority(doc),
      size_category: this.categorizeDocumentSize(doc)
    }))
  }

  async checkCache(documents) {
    const cached_results = []
    const uncached_documents = []
    
    for (const doc of documents) {
      const cached = this.getCachedResult(doc.processing_hash)
      if (cached && !this.isCacheExpired(cached)) {
        cached_results.push({
          ...cached.result,
          cache_hit: true,
          document_id: doc.id
        })
        this.performance_metrics.cache_hits++
      } else {
        uncached_documents.push(doc)
        this.performance_metrics.cache_misses++
      }
    }
    
    console.log(`💾 Cache: ${cached_results.length} hits, ${uncached_documents.length} misses`)
    
    return { cached_results, uncached_documents }
  }

  createOptimalBatches(documents) {
    console.log('📦 Creating optimal processing batches...')
    
    // Group documents by processing requirements
    const document_groups = {
      electronic: documents.filter(doc => this.isElectronicPDF(doc)),
      scanned: documents.filter(doc => this.isScannedDocument(doc)),
      text: documents.filter(doc => this.isTextDocument(doc)),
      complex: documents.filter(doc => this.isComplexDocument(doc))
    }
    
    const batches = []
    
    // Create batches optimized for processing type
    for (const [type, docs] of Object.entries(document_groups)) {
      if (docs.length > 0) {
        const type_batches = this.createBatches(docs, type, this.optimization_config.batch_sizes[type])
        batches.push(...type_batches)
      }
    }
    
    // Sort batches by priority
    batches.sort((a, b) => b.average_priority - a.average_priority)
    
    console.log(`📦 Created ${batches.length} optimal batches`)
    
    return batches
  }

  createBatches(documents, processing_type, batch_size) {
    const batches = []
    
    for (let i = 0; i < documents.length; i += batch_size) {
      const batch_documents = documents.slice(i, i + batch_size)
      const batch = {
        batch_id: this.generateBatchId(),
        documents: batch_documents,
        type: processing_type,
        size: batch_documents.length,
        estimated_time: this.estimateBatchProcessingTime(batch_documents, processing_type),
        average_priority: batch_documents.reduce((sum, doc) => sum + doc.priority, 0) / batch_documents.length,
        memory_requirement: this.estimateMemoryRequirement(batch_documents)
      }
      
      batches.push(batch)
    }
    
    return batches
  }

  async processAllBatches(batches) {
    console.log(`⚙️ Processing ${batches.length} batches in parallel...`)
    
    // Process batches with concurrency limit
    const results = []
    const concurrent_limit = this.optimization_config.concurrent_batches
    
    for (let i = 0; i < batches.length; i += concurrent_limit) {
      const batch_group = batches.slice(i, i + concurrent_limit)
      const group_results = await Promise.allSettled(
        batch_group.map(batch => this.processBatch(batch))
      )
      
      // Extract successful results
      group_results.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          console.error(`❌ Batch processing failed:`, result.reason)
          results.push({
            batch_id: 'failed',
            error: result.reason.message,
            processing_time: 0,
            documents_processed: 0,
            success: false
          })
        }
      })
      
      // Memory management between batch groups
      if (this.shouldRunGarbageCollection()) {
        await this.runGarbageCollection()
      }
    }
    
    return results
  }

  async processBatch(batch) {
    const batch_start = performance.now()
    
    try {
      console.log(`🔄 Processing batch: ${batch.batch_id} (${batch.size} documents, type: ${batch.type})`)
      
      // Process documents in batch using worker pool
      const worker_result = await this.worker_pool.execute('processBatch', {
        documents: batch.documents,
        processing_type: batch.type,
        batch_id: batch.batch_id,
        optimization_config: this.optimization_config
      })
      
      const processing_time = performance.now() - batch_start
      
      // Cache successful results
      if (worker_result.success) {
        this.cacheResults(batch.batch_id, worker_result.results)
      }
      
      // Store batch timing data
      this.batch_timings.set(batch.batch_id, {
        processing_time,
        documents_count: batch.size,
        type: batch.type,
        throughput: batch.size / (processing_time / 1000) // docs per second
      })
      
      const result = {
        batch_id: batch.batch_id,
        results: worker_result.results || [],
        processing_time: processing_time,
        documents_processed: batch.size,
        success: worker_result.success,
        throughput: batch.size / (processing_time / 1000),
        worker_stats: worker_result.worker_stats
      }
      
      console.log(`✅ Batch ${batch.batch_id} completed: ${batch.size} docs in ${Math.round(processing_time)}ms`)
      
      return result
      
    } catch (error) {
      const processing_time = performance.now() - batch_start
      
      console.error(`❌ Batch processing failed: ${batch.batch_id}`, error)
      
      return {
        batch_id: batch.batch_id,
        error: error.message,
        processing_time: processing_time,
        documents_processed: 0,
        success: false
      }
    }
  }

  mergeBatchResults(batch_results) {
    const all_results = []
    const processing_summary = {
      successful_batches: 0,
      failed_batches: 0,
      total_documents: 0,
      total_processing_time: 0,
      average_throughput: 0
    }
    
    batch_results.forEach(batch_result => {
      if (batch_result.success) {
        processing_summary.successful_batches++
        if (batch_result.results) {
          all_results.push(...batch_result.results)
        }
      } else {
        processing_summary.failed_batches++
      }
      
      processing_summary.total_documents += batch_result.documents_processed || 0
      processing_summary.total_processing_time += batch_result.processing_time || 0
    })
    
    // Calculate average throughput
    processing_summary.average_throughput = 
      processing_summary.total_processing_time > 0 ? 
        processing_summary.total_documents / (processing_summary.total_processing_time / 1000) : 0
    
    return {
      documents: all_results,
      processing_summary: processing_summary,
      batch_performance: this.analyzeBatchPerformance(batch_results)
    }
  }

  // Caching methods
  cacheResults(batch_id, results) {
    if (!results) return
    
    // Enforce cache size limit
    if (this.cache.size >= this.optimization_config.cache_size_limit) {
      this.pruneCache()
    }
    
    const cache_entry = {
      batch_id: batch_id,
      result: results,
      timestamp: Date.now(),
      access_count: 0
    }
    
    // Cache individual document results
    if (Array.isArray(results)) {
      results.forEach(result => {
        if (result.document_id) {
          const doc_hash = this.generateResultHash(result.document_id)
          this.cache.set(doc_hash, {
            ...cache_entry,
            result: result,
            document_id: result.document_id
          })
        }
      })
    }
  }

  getCachedResult(processing_hash) {
    const cached = this.cache.get(processing_hash)
    if (cached) {
      cached.access_count++
      return cached
    }
    return null
  }

  isCacheExpired(cache_entry) {
    return (Date.now() - cache_entry.timestamp) > this.optimization_config.cache_ttl
  }

  pruneCache() {
    // Remove oldest entries when cache is full
    const entries = Array.from(this.cache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    
    const remove_count = Math.floor(this.optimization_config.cache_size_limit * 0.2) // Remove 20%
    for (let i = 0; i < remove_count; i++) {
      this.cache.delete(entries[i][0])
    }
    
    console.log(`🗑️ Cache pruned: removed ${remove_count} entries`)
  }

  // Document classification methods
  isElectronicPDF(doc) {
    return doc.type === 'pdf' && 
           !doc.requires_ocr && 
           doc.estimated_complexity < 0.7
  }

  isScannedDocument(doc) {
    return doc.requires_ocr || 
           doc.type === 'image' ||
           (doc.type === 'pdf' && doc.estimated_complexity > 0.8)
  }

  isTextDocument(doc) {
    return ['txt', 'docx', 'html', 'rtf'].includes(doc.type) &&
           doc.estimated_complexity < 0.5
  }

  isComplexDocument(doc) {
    return doc.estimated_complexity > 0.8 ||
           doc.size_category === 'large' ||
           (doc.legal_complexity && doc.legal_complexity > 0.7)
  }

  // Estimation methods
  estimateProcessingComplexity(doc) {
    let complexity = 0.3 // Base complexity
    
    // Adjust based on document type
    const type_complexity = {
      'pdf': 0.5,
      'docx': 0.3,
      'txt': 0.1,
      'html': 0.2,
      'image': 0.8,
      'scan': 0.9
    }
    
    complexity += type_complexity[doc.type] || 0.5
    
    // Adjust based on size
    if (doc.size) {
      if (doc.size > 10 * 1024 * 1024) complexity += 0.2 // > 10MB
      else if (doc.size > 1024 * 1024) complexity += 0.1  // > 1MB
    }
    
    // Adjust based on content indicators
    if (doc.requires_ocr) complexity += 0.3
    if (doc.has_complex_layout) complexity += 0.2
    if (doc.contains_tables) complexity += 0.1
    if (doc.contains_images) complexity += 0.1
    
    return Math.min(complexity, 1.0)
  }

  determineProcessingType(doc) {
    if (this.isScannedDocument(doc)) return 'scanned'
    if (this.isComplexDocument(doc)) return 'complex'
    if (this.isTextDocument(doc)) return 'text'
    return 'electronic'
  }

  calculateProcessingPriority(doc) {
    let priority = 0.5 // Base priority
    
    // Adjust based on document importance
    if (doc.importance === 'high') priority += 0.3
    else if (doc.importance === 'medium') priority += 0.1
    
    // Adjust based on processing urgency
    if (doc.urgent) priority += 0.2
    
    // Adjust based on dependencies
    if (doc.has_dependencies) priority += 0.1
    
    // Adjust based on size (smaller documents get higher priority for throughput)
    if (doc.size && doc.size < 1024 * 1024) priority += 0.1 // < 1MB
    
    return Math.min(priority, 1.0)
  }

  categorizeDocumentSize(doc) {
    if (!doc.size) return 'unknown'
    
    if (doc.size < 1024 * 1024) return 'small'      // < 1MB
    if (doc.size < 10 * 1024 * 1024) return 'medium'  // < 10MB
    if (doc.size < 50 * 1024 * 1024) return 'large'   // < 50MB
    return 'very_large'
  }

  estimateBatchProcessingTime(documents, processing_type) {
    // Base processing times per document (in ms)
    const base_times = {
      'text': 100,
      'electronic': 500,
      'scanned': 3000,
      'complex': 2000
    }
    
    const base_time = base_times[processing_type] || 1000
    
    // Calculate total estimated time
    let total_time = 0
    documents.forEach(doc => {
      let doc_time = base_time
      
      // Adjust for document complexity
      doc_time *= (1 + doc.estimated_complexity)
      
      // Adjust for document size
      if (doc.size) {
        const size_factor = Math.log10(doc.size / 1024) / 4 // Logarithmic scaling
        doc_time *= (1 + Math.max(0, size_factor))
      }
      
      total_time += doc_time
    })
    
    return total_time
  }

  estimateMemoryRequirement(documents) {
    let memory_mb = 50 // Base memory requirement
    
    documents.forEach(doc => {
      if (doc.size) {
        // Estimate memory as 2-3x document size for processing
        memory_mb += (doc.size / (1024 * 1024)) * 2.5
      } else {
        memory_mb += 10 // Default per document
      }
    })
    
    return memory_mb
  }

  // Performance monitoring
  startPerformanceMonitoring() {
    // Monitor performance every 30 seconds
    setInterval(() => {
      this.recordPerformanceMetrics()
    }, 30000)
    
    console.log('📊 Performance monitoring started')
  }

  recordPerformanceMetrics() {
    const worker_status = this.worker_pool?.getStatus()
    const memory_usage = this.getMemoryUsage()
    
    if (worker_status) {
      this.performance_metrics.worker_utilization_history.push({
        timestamp: Date.now(),
        utilization: worker_status.workerUtilization,
        active_jobs: worker_status.activeJobs,
        pending_tasks: worker_status.pendingTasks
      })
    }
    
    this.performance_metrics.memory_usage_history.push({
      timestamp: Date.now(),
      ...memory_usage
    })
    
    // Keep only last 100 records
    if (this.performance_metrics.worker_utilization_history.length > 100) {
      this.performance_metrics.worker_utilization_history = 
        this.performance_metrics.worker_utilization_history.slice(-100)
    }
    
    if (this.performance_metrics.memory_usage_history.length > 100) {
      this.performance_metrics.memory_usage_history = 
        this.performance_metrics.memory_usage_history.slice(-100)
    }
  }

  updatePerformanceMetrics(documents_count, processing_time) {
    this.performance_metrics.total_documents_processed += documents_count
    this.performance_metrics.total_processing_time += processing_time
    
    // Calculate running averages
    this.performance_metrics.average_processing_time = 
      this.performance_metrics.total_processing_time / this.performance_metrics.total_documents_processed
    
    this.performance_metrics.cache_hit_rate = 
      this.performance_metrics.cache_hits / 
      (this.performance_metrics.cache_hits + this.performance_metrics.cache_misses)
  }

  // Utility methods
  generateProcessingHash(doc) {
    const hash_input = `${doc.id}_${doc.type}_${doc.size}_${doc.name}_${doc.last_modified || ''}`
    return crypto.createHash('md5').update(hash_input).digest('hex')
  }

  generateResultHash(document_id) {
    return crypto.createHash('md5').update(`result_${document_id}`).digest('hex')
  }

  generateBatchId() {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  calculateWorkerEfficiency() {
    const worker_status = this.worker_pool?.getStatus()
    if (!worker_status) return 0
    
    return worker_status.workerUtilization
  }

  getMemoryUsage() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage()
      return {
        heap_used_mb: usage.heapUsed / 1024 / 1024,
        heap_total_mb: usage.heapTotal / 1024 / 1024,
        external_mb: usage.external / 1024 / 1024,
        rss_mb: usage.rss / 1024 / 1024
      }
    }
    return { heap_used_mb: 0, heap_total_mb: 0, external_mb: 0, rss_mb: 0 }
  }

  getMemoryEfficiency() {
    const usage = this.getMemoryUsage()
    return usage.heap_total_mb > 0 ? 1 - (usage.heap_used_mb / usage.heap_total_mb) : 1
  }

  shouldRunGarbageCollection() {
    const memory = this.getMemoryUsage()
    const threshold = this.optimization_config.memory_threshold
    
    return memory.heap_total_mb > 0 && 
           (memory.heap_used_mb / memory.heap_total_mb) > threshold
  }

  async runGarbageCollection() {
    if (typeof global !== 'undefined' && global.gc) {
      console.log('🗑️ Running garbage collection...')
      global.gc()
    }
  }

  analyzeBatchPerformance(batch_results) {
    const analysis = {
      total_batches: batch_results.length,
      successful_batches: batch_results.filter(b => b.success).length,
      average_throughput: 0,
      performance_by_type: {},
      bottlenecks: []
    }
    
    // Analyze performance by processing type
    const type_performance = {}
    
    batch_results.forEach(batch => {
      if (batch.success && batch.throughput) {
        const batch_data = this.batch_timings.get(batch.batch_id)
        if (batch_data) {
          const type = batch_data.type
          if (!type_performance[type]) {
            type_performance[type] = { throughputs: [], times: [] }
          }
          type_performance[type].throughputs.push(batch.throughput)
          type_performance[type].times.push(batch_data.processing_time)
        }
      }
    })
    
    // Calculate averages by type
    for (const [type, data] of Object.entries(type_performance)) {
      analysis.performance_by_type[type] = {
        average_throughput: data.throughputs.reduce((a, b) => a + b, 0) / data.throughputs.length,
        average_time: data.times.reduce((a, b) => a + b, 0) / data.times.length,
        batch_count: data.throughputs.length
      }
    }
    
    // Identify bottlenecks
    const all_throughputs = batch_results
      .filter(b => b.success && b.throughput)
      .map(b => b.throughput)
    
    if (all_throughputs.length > 0) {
      const avg_throughput = all_throughputs.reduce((a, b) => a + b, 0) / all_throughputs.length
      analysis.average_throughput = avg_throughput
      
      // Find slow batches
      const slow_threshold = avg_throughput * 0.5
      const slow_batches = batch_results.filter(b => 
        b.success && b.throughput && b.throughput < slow_threshold
      )
      
      if (slow_batches.length > 0) {
        analysis.bottlenecks.push({
          type: 'slow_batches',
          count: slow_batches.length,
          description: `${slow_batches.length} batches performing below 50% of average throughput`
        })
      }
    }
    
    return analysis
  }

  // Status and cleanup methods
  getOptimizationStatus() {
    return {
      optimizer_type: 'PerformanceOptimizer',
      worker_pool_status: this.worker_pool?.getStatus(),
      cache_status: {
        size: this.cache.size,
        limit: this.optimization_config.cache_size_limit,
        hit_rate: this.performance_metrics.cache_hit_rate || 0
      },
      performance_metrics: this.performance_metrics,
      configuration: this.optimization_config,
      capabilities: [
        'Multi-threaded document processing',
        'Intelligent batch optimization',
        'Result caching with TTL',
        'Performance monitoring',
        'Memory management',
        'Worker pool management',
        'Processing type classification'
      ]
    }
  }

  async cleanup() {
    console.log('🧹 Cleaning up performance optimizer...')
    
    if (this.worker_pool) {
      await this.worker_pool.terminate()
    }
    
    this.cache.clear()
    this.processing_queue = []
    this.processing_stats.clear()
    this.batch_timings.clear()
    
    console.log('✅ Performance optimizer cleanup complete')
  }
}

export default PerformanceOptimizer