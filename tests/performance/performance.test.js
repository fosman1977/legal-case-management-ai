/**
 * Performance Tests - Week 12 Day 3-4
 * Performance and load testing for the complete system
 */

import { describe, test, expect, beforeAll, afterAll, jest } from '@jest/globals'
import { performance } from 'perf_hooks'
import PerformanceOptimizer from '../../src/optimization/PerformanceOptimizer.js'
import UnifiedAnalysisEngine from '../../src/analysis/UnifiedAnalysisEngine.js'
import BulletproofAnonymizer from '../../src/analysis/BulletproofAnonymizer.js'

describe('Performance Tests', () => {
  let performance_optimizer
  let analysis_engine
  let anonymizer
  let test_documents

  beforeAll(async () => {
    // Initialize components
    performance_optimizer = new PerformanceOptimizer()
    await performance_optimizer.initializeWorkerPool()
    
    analysis_engine = new UnifiedAnalysisEngine()
    anonymizer = new BulletproofAnonymizer()
    
    // Generate test documents
    test_documents = generatePerformanceTestDocuments()
    
    console.log('🚀 Performance test environment initialized')
  }, 30000)

  afterAll(async () => {
    if (performance_optimizer) {
      await performance_optimizer.cleanup()
    }
    console.log('✅ Performance test cleanup completed')
  }, 10000)

  describe('Document Processing Performance', () => {
    test('should process single document within performance thresholds', async () => {
      const document = test_documents.medium_complexity
      const start_time = performance.now()
      
      const result = await performance_optimizer.optimizeDocumentProcessing([document])
      const processing_time = performance.now() - start_time
      
      expect(result.success).toBe(true)
      expect(processing_time).toBeLessThan(2000) // 2 seconds max for single doc
      expect(result.optimization_summary.worker_efficiency).toBeGreaterThan(0.1)
      
      console.log(`📄 Single document: ${Math.round(processing_time)}ms`)
    }, 5000)

    test('should handle batch processing efficiently', async () => {
      const batch_sizes = [5, 10, 20, 50]
      const results = []
      
      for (const batch_size of batch_sizes) {
        const documents = test_documents.varied_complexity.slice(0, batch_size)
        const start_time = performance.now()
        
        const result = await performance_optimizer.optimizeDocumentProcessing(documents)
        const processing_time = performance.now() - start_time
        
        const throughput = batch_size / (processing_time / 1000) // docs per second
        
        results.push({
          batch_size,
          processing_time,
          throughput,
          success: result.success
        })
        
        expect(result.success).toBe(true)
        expect(throughput).toBeGreaterThan(0.1) // At least 0.1 docs/second
        
        console.log(`📦 Batch ${batch_size}: ${Math.round(processing_time)}ms, ${throughput.toFixed(2)} docs/sec`)
      }
      
      // Verify throughput improves with batch size (up to a point)
      expect(results[1].throughput).toBeGreaterThanOrEqual(results[0].throughput * 0.8)
      expect(results[2].throughput).toBeGreaterThanOrEqual(results[1].throughput * 0.8)
    }, 60000)

    test('should scale with available CPU cores', async () => {
      const documents = test_documents.uniform_medium.slice(0, 20)
      const optimization_configs = [
        { max_workers: 1 },
        { max_workers: 2 },
        { max_workers: Math.max(2, require('os').cpus().length - 1) }
      ]
      
      const results = []
      
      for (const config of optimization_configs) {
        performance_optimizer.updateConfiguration(config)
        
        const start_time = performance.now()
        const result = await performance_optimizer.optimizeDocumentProcessing(documents)
        const processing_time = performance.now() - start_time
        
        results.push({
          workers: config.max_workers,
          processing_time,
          throughput: documents.length / (processing_time / 1000)
        })
        
        console.log(`👷 ${config.max_workers} workers: ${Math.round(processing_time)}ms`)
      }
      
      // Should see some improvement with more workers
      expect(results[1].processing_time).toBeLessThanOrEqual(results[0].processing_time * 1.2)
    }, 30000)
  })

  describe('Memory Performance', () => {
    test('should maintain memory efficiency under load', async () => {
      const initial_memory = process.memoryUsage()
      const documents = test_documents.large_set // 100 documents
      
      const result = await performance_optimizer.optimizeDocumentProcessing(documents)
      
      const final_memory = process.memoryUsage()
      const memory_increase = (final_memory.heapUsed - initial_memory.heapUsed) / 1024 / 1024
      
      expect(result.success).toBe(true)
      expect(memory_increase).toBeLessThan(200) // Less than 200MB increase
      expect(result.optimization_summary.memory_efficiency).toBeGreaterThan(0.3)
      
      console.log(`💾 Memory increase: ${Math.round(memory_increase)}MB`)
    }, 45000)

    test('should handle memory pressure gracefully', async () => {
      // Simulate memory pressure with large documents
      const large_documents = Array.from({ length: 10 }, (_, i) => ({
        id: `large-${i}`,
        name: `Large Document ${i}.pdf`,
        type: 'pdf',
        size: 10 * 1024 * 1024, // 10MB each
        content: 'Large document content '.repeat(50000),
        estimated_complexity: 0.8
      }))
      
      const result = await performance_optimizer.optimizeDocumentProcessing(large_documents)
      
      expect(result.success).toBe(true)
      expect(result.documents_processed).toBe(large_documents.length)
      
      console.log(`🏋️ Memory pressure test: ${result.documents_processed} large documents processed`)
    }, 30000)

    test('should implement effective caching', async () => {
      const documents = test_documents.cache_test_set
      
      // First pass - cache miss
      const start_time_1 = performance.now()
      const result1 = await performance_optimizer.optimizeDocumentProcessing(documents)
      const time_1 = performance.now() - start_time_1
      
      // Second pass - should hit cache  
      const start_time_2 = performance.now()
      const result2 = await performance_optimizer.optimizeDocumentProcessing(documents)
      const time_2 = performance.now() - start_time_2
      
      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      
      // Cache should provide speedup
      expect(time_2).toBeLessThan(time_1 * 0.8) // At least 20% faster
      
      const cache_hit_rate = result2.optimization_summary.cache_hit_rate || 0
      expect(cache_hit_rate).toBeGreaterThan(0.5) // At least 50% cache hits
      
      console.log(`💾 Cache performance: ${Math.round(time_1)}ms → ${Math.round(time_2)}ms (${Math.round(cache_hit_rate * 100)}% hit rate)`)
    }, 20000)
  })

  describe('Anonymization Performance', () => {
    test('should anonymize documents within time constraints', async () => {
      const document_sizes = [
        { name: 'small', content: 'Small document '.repeat(100) },
        { name: 'medium', content: 'Medium document with John Smith and ABC Corp '.repeat(500) },
        { name: 'large', content: 'Large document with multiple entities John Smith, Jane Doe, ABC Corp Ltd, XYZ Inc '.repeat(2000) }
      ]
      
      for (const doc of document_sizes) {
        const start_time = performance.now()
        
        const result = await anonymizer.anonymizeDocument({
          id: `perf-${doc.name}`,
          content: doc.content
        })
        
        const processing_time = performance.now() - start_time
        
        expect(result.anonymized_doc).toBeDefined()
        expect(processing_time).toBeLessThan(3000) // 3 seconds max
        
        const throughput = doc.content.length / processing_time // chars per ms
        
        console.log(`🔒 ${doc.name} anonymization: ${Math.round(processing_time)}ms, ${throughput.toFixed(2)} chars/ms`)
      }
    }, 15000)

    test('should handle high entity density efficiently', async () => {
      // Create document with many entities
      const entities = [
        'John Smith', 'Jane Doe', 'Bob Johnson', 'Alice Brown', 'Charlie Wilson',
        'ABC Corp', 'XYZ Ltd', 'Tech Inc', 'Legal LLC', 'Services Co',
        'john@email.com', 'jane@company.com', 'bob@firm.co.uk',
        '020-1234-5678', '0161-987-6543', '0131-555-0123',
        '123 Main St', '456 Oak Road', '789 High Street'
      ]
      
      const high_density_content = entities.join(', ').repeat(50)
      
      const start_time = performance.now()
      const result = await anonymizer.anonymizeDocument({
        id: 'high-density-test',
        content: high_density_content
      })
      const processing_time = performance.now() - start_time
      
      expect(result.doc_entities.length).toBeGreaterThan(50) // Should detect many entities
      expect(processing_time).toBeLessThan(5000) // 5 seconds max
      
      console.log(`🎯 High density: ${result.doc_entities.length} entities in ${Math.round(processing_time)}ms`)
    }, 10000)
  })

  describe('Concurrent Processing Performance', () => {
    test('should handle concurrent analysis requests', async () => {
      const concurrent_count = 5
      const documents_per_request = 10
      
      const concurrent_requests = Array.from({ length: concurrent_count }, (_, i) => {
        const documents = test_documents.varied_complexity.slice(i * documents_per_request, (i + 1) * documents_per_request)
        return analysis_engine.analyzeCase(documents, {
          case_id: `concurrent-${i}`,
          practice_area: 'general'
        })
      })
      
      const start_time = performance.now()
      const results = await Promise.allSettled(concurrent_requests)
      const total_time = performance.now() - start_time
      
      const successful_results = results.filter(r => r.status === 'fulfilled' && r.value?.success)
      
      expect(successful_results.length).toBeGreaterThanOrEqual(concurrent_count * 0.8) // At least 80% success
      expect(total_time).toBeLessThan(60000) // 1 minute max
      
      console.log(`🔄 Concurrent processing: ${successful_results.length}/${concurrent_count} successful in ${Math.round(total_time)}ms`)
    }, 70000)

    test('should maintain performance under sustained load', async () => {
      const iterations = 10
      const documents_per_iteration = 5
      const processing_times = []
      
      for (let i = 0; i < iterations; i++) {
        const documents = test_documents.uniform_medium.slice(0, documents_per_iteration)
        
        const start_time = performance.now()
        const result = await performance_optimizer.optimizeDocumentProcessing(documents)
        const processing_time = performance.now() - start_time
        
        processing_times.push(processing_time)
        
        expect(result.success).toBe(true)
        
        // Small delay between iterations
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // Performance should remain relatively stable
      const average_time = processing_times.reduce((a, b) => a + b, 0) / processing_times.length
      const max_time = Math.max(...processing_times)
      const min_time = Math.min(...processing_times)
      
      expect(max_time / min_time).toBeLessThan(3) // No more than 3x variation
      
      console.log(`📊 Sustained load: avg ${Math.round(average_time)}ms, range ${Math.round(min_time)}-${Math.round(max_time)}ms`)
    }, 60000)
  })

  describe('Worker Pool Performance', () => {
    test('should efficiently utilize worker threads', async () => {
      const documents = test_documents.worker_test_set
      
      const start_time = performance.now()
      const result = await performance_optimizer.optimizeDocumentProcessing(documents)
      const processing_time = performance.now() - start_time
      
      expect(result.success).toBe(true)
      
      const worker_efficiency = result.optimization_summary.worker_efficiency
      expect(worker_efficiency).toBeGreaterThan(0.3) // At least 30% efficiency
      
      console.log(`👷 Worker efficiency: ${Math.round(worker_efficiency * 100)}% in ${Math.round(processing_time)}ms`)
    }, 20000)

    test('should handle worker failures gracefully', async () => {
      const documents = test_documents.error_prone_set
      
      // Some documents may cause worker errors
      const result = await performance_optimizer.optimizeDocumentProcessing(documents)
      
      // Should complete even with some failures
      expect(result.success).toBe(true)
      expect(result.documents_processed).toBeGreaterThan(0)
      
      console.log(`⚠️ Error resilience: ${result.documents_processed}/${documents.length} processed`)
    }, 15000)
  })

  describe('Search Performance', () => {
    test('should perform semantic searches efficiently', async () => {
      // This would require actual Qdrant integration for full testing
      // For now, test the search engine initialization and configuration
      
      const { QdrantSearchEngine } = await import('../../src/search/QdrantSearchEngine.js')
      const search_engine = new QdrantSearchEngine()
      
      const start_time = performance.now()
      const status = search_engine.getEngineStatus()
      const config_time = performance.now() - start_time
      
      expect(status.engine_type).toBe('QdrantSearchEngine')
      expect(status.capabilities).toContain('Semantic document search')
      expect(config_time).toBeLessThan(100) // Configuration should be fast
      
      console.log(`🔍 Search engine config: ${Math.round(config_time)}ms`)
    })
  })

  describe('End-to-End Performance', () => {
    test('should complete full analysis pipeline within acceptable time', async () => {
      const case_documents = test_documents.complete_case
      const case_context = {
        case_id: 'performance-test-case',
        practice_area: 'commercial_litigation',
        jurisdiction: 'uk'
      }
      
      const start_time = performance.now()
      const result = await analysis_engine.analyzeCase(case_documents, case_context)
      const total_time = performance.now() - start_time
      
      expect(result.success).toBe(true)
      expect(result.processing_summary.documents_processed).toBe(case_documents.length)
      expect(total_time).toBeLessThan(30000) // 30 seconds max for complete case
      
      // Verify all components completed
      expect(result.unified_results).toBeDefined()
      expect(result.unified_results.enhanced_patterns).toBeDefined()
      expect(result.unified_results.privacy_protection).toBeDefined()
      
      const throughput = case_documents.length / (total_time / 1000)
      
      console.log(`🎯 End-to-end: ${case_documents.length} docs in ${Math.round(total_time)}ms (${throughput.toFixed(2)} docs/sec)`)
    }, 35000)
  })
})

// Helper function to generate performance test documents
function generatePerformanceTestDocuments() {
  const base_content = {
    simple: 'Simple legal document for testing purposes.',
    medium: 'Commercial contract between John Smith and ABC Corporation Ltd. The agreement covers service provision and payment terms. Contact: john@abc.com, phone: 020-1234-5678.',
    complex: 'Complex litigation case involving multiple parties: John Smith (Claimant), ABC Corp Ltd (First Defendant), XYZ Services Inc (Second Defendant). Case No. ABC-2023-001. Financial damages claimed: £50,000. Key dates: contract signed 15/03/2023, breach occurred 20/06/2023, proceedings issued 01/08/2023. Multiple witnesses, extensive documentary evidence, and cross-claims between defendants.'
  }
  
  return {
    medium_complexity: {
      id: 'perf-medium-1',
      name: 'Medium Document.pdf',
      type: 'pdf',
      size: 500000,
      content: base_content.medium,
      estimated_complexity: 0.5
    },
    
    varied_complexity: Array.from({ length: 100 }, (_, i) => {
      const complexity_types = ['simple', 'medium', 'complex']
      const type = complexity_types[i % 3]
      return {
        id: `varied-${i}`,
        name: `Document ${i}.pdf`,
        type: 'pdf',
        size: 100000 + Math.random() * 900000,
        content: base_content[type] + ` Document ${i}.`,
        estimated_complexity: type === 'simple' ? 0.2 : type === 'medium' ? 0.5 : 0.8
      }
    }),
    
    uniform_medium: Array.from({ length: 50 }, (_, i) => ({
      id: `uniform-${i}`,
      name: `Uniform Document ${i}.pdf`,
      type: 'pdf',
      size: 500000,
      content: base_content.medium + ` Document ${i}.`,
      estimated_complexity: 0.5
    })),
    
    large_set: Array.from({ length: 100 }, (_, i) => ({
      id: `large-set-${i}`,
      name: `Large Set Document ${i}.pdf`,
      type: 'pdf',
      size: 200000 + Math.random() * 800000,
      content: (i % 3 === 0 ? base_content.complex : base_content.medium) + ` Document ${i}.`,
      estimated_complexity: 0.3 + Math.random() * 0.4
    })),
    
    cache_test_set: Array.from({ length: 20 }, (_, i) => ({
      id: `cache-${i % 5}`, // Only 5 unique IDs, so duplicates will test caching
      name: `Cache Test ${i % 5}.pdf`,
      type: 'pdf',
      size: 300000,
      content: base_content.medium + ` Cache test document ${i % 5}.`,
      estimated_complexity: 0.4
    })),
    
    worker_test_set: Array.from({ length: 30 }, (_, i) => ({
      id: `worker-${i}`,
      name: `Worker Test ${i}.pdf`,
      type: 'pdf',
      size: 400000,
      content: base_content.medium + ` Worker test document ${i}.`,
      estimated_complexity: 0.5
    })),
    
    error_prone_set: [
      ...Array.from({ length: 5 }, (_, i) => ({
        id: `good-${i}`,
        name: `Good Document ${i}.pdf`,
        type: 'pdf',
        content: base_content.simple,
        estimated_complexity: 0.3
      })),
      ...Array.from({ length: 3 }, (_, i) => ({
        id: `problematic-${i}`,
        name: `Problematic Document ${i}.pdf`,
        type: 'pdf',
        content: null, // Problematic content
        size: 0,
        estimated_complexity: 1.0
      }))
    ],
    
    complete_case: Array.from({ length: 15 }, (_, i) => ({
      id: `case-doc-${i}`,
      name: `Case Document ${i}.pdf`,
      type: 'pdf',
      size: 300000 + Math.random() * 700000,
      content: base_content[i % 3 === 0 ? 'complex' : 'medium'] + ` Case document ${i}.`,
      estimated_complexity: 0.4 + Math.random() * 0.4
    }))
  }
}