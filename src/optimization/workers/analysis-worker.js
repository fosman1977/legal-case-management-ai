/**
 * Analysis Worker - Week 12 Day 1-2
 * Worker thread for CPU-intensive document analysis tasks
 */

import { parentPort, workerData } from 'worker_threads'
import { performance } from 'perf_hooks'

class AnalysisWorker {
  constructor(workerId) {
    this.workerId = workerId
    this.processedTasks = 0
    this.totalProcessingTime = 0
    this.initializeTime = Date.now()
    
    console.log(`👷 Analysis worker ${workerId} initialized`)
  }

  async processTask(taskType, data) {
    const start_time = performance.now()
    let result = null
    
    try {
      switch (taskType) {
        case 'processBatch':
          result = await this.processBatch(data)
          break
        case 'analyzeDocument':
          result = await this.analyzeDocument(data)
          break
        case 'extractText':
          result = await this.extractText(data)
          break
        case 'performOCR':
          result = await this.performOCR(data)
          break
        default:
          throw new Error(`Unknown task type: ${taskType}`)
      }
      
      const processing_time = performance.now() - start_time
      this.processedTasks++
      this.totalProcessingTime += processing_time
      
      return {
        taskId: data.taskId || 'unknown',
        success: true,
        result: result,
        processing_time: processing_time,
        worker_id: this.workerId,
        worker_stats: this.getWorkerStats()
      }
      
    } catch (error) {
      const processing_time = performance.now() - start_time
      
      return {
        taskId: data.taskId || 'unknown',
        success: false,
        error: error.message,
        processing_time: processing_time,
        worker_id: this.workerId,
        worker_stats: this.getWorkerStats()
      }
    }
  }

  async processBatch(data) {
    const { documents, processing_type, batch_id, optimization_config } = data
    
    console.log(`🔄 Worker ${this.workerId} processing batch: ${batch_id} (${documents.length} docs, type: ${processing_type})`)
    
    const batch_results = []
    const batch_start = performance.now()
    
    for (const document of documents) {
      try {
        const doc_result = await this.processDocument(document, processing_type, optimization_config)
        batch_results.push({
          document_id: document.id,
          success: true,
          ...doc_result
        })
      } catch (error) {
        batch_results.push({
          document_id: document.id,
          success: false,
          error: error.message,
          processing_time: 0
        })
      }
    }
    
    const batch_processing_time = performance.now() - batch_start
    
    return {
      batch_id: batch_id,
      processing_type: processing_type,
      documents_processed: documents.length,
      successful_documents: batch_results.filter(r => r.success).length,
      batch_processing_time: batch_processing_time,
      average_doc_time: batch_processing_time / documents.length,
      results: batch_results
    }
  }

  async processDocument(document, processing_type, optimization_config) {
    const doc_start = performance.now()
    
    // Simulate different processing types
    let processing_result = null
    
    switch (processing_type) {
      case 'text':
        processing_result = await this.processTextDocument(document)
        break
      case 'electronic':
        processing_result = await this.processElectronicPDF(document)
        break
      case 'scanned':
        processing_result = await this.processScannedDocument(document)
        break
      case 'complex':
        processing_result = await this.processComplexDocument(document)
        break
      default:
        processing_result = await this.processGenericDocument(document)
    }
    
    const processing_time = performance.now() - doc_start
    
    return {
      document_type: document.type,
      processing_type: processing_type,
      processing_time: processing_time,
      content_extracted: processing_result.content_length || 0,
      entities_found: processing_result.entities?.length || 0,
      analysis_results: processing_result,
      worker_efficiency: this.calculateCurrentEfficiency()
    }
  }

  async processTextDocument(document) {
    // Simulate text document processing
    await this.simulateProcessingDelay(50, 150) // 50-150ms
    
    const content = document.content || document.text || 'Sample text content'
    const words = content.split(/\s+/).length
    
    return {
      content: content,
      content_length: content.length,
      word_count: words,
      processing_complexity: 'low',
      entities: this.extractBasicEntities(content),
      metadata: {
        processing_method: 'direct_text',
        extraction_confidence: 0.95
      }
    }
  }

  async processElectronicPDF(document) {
    // Simulate electronic PDF processing
    await this.simulateProcessingDelay(200, 800) // 200-800ms
    
    const estimated_pages = Math.floor((document.size || 1024000) / 100000) + 1
    const content = this.generateSampleContent(document, 'pdf')
    
    return {
      content: content,
      content_length: content.length,
      page_count: estimated_pages,
      processing_complexity: 'medium',
      entities: this.extractLegalEntities(content),
      metadata: {
        processing_method: 'pdf_extraction',
        extraction_confidence: 0.90,
        pages_processed: estimated_pages
      }
    }
  }

  async processScannedDocument(document) {
    // Simulate OCR processing (most intensive)
    await this.simulateProcessingDelay(2000, 5000) // 2-5 seconds
    
    const estimated_pages = Math.floor((document.size || 2048000) / 200000) + 1
    const content = this.generateSampleContent(document, 'scanned')
    
    return {
      content: content,
      content_length: content.length,
      page_count: estimated_pages,
      processing_complexity: 'high',
      ocr_confidence: 0.85,
      entities: this.extractLegalEntities(content),
      metadata: {
        processing_method: 'ocr_extraction',
        extraction_confidence: 0.75,
        pages_processed: estimated_pages,
        ocr_engine: 'tesseract'
      }
    }
  }

  async processComplexDocument(document) {
    // Simulate complex document analysis
    await this.simulateProcessingDelay(1000, 3000) // 1-3 seconds
    
    const content = this.generateSampleContent(document, 'complex')
    
    return {
      content: content,
      content_length: content.length,
      processing_complexity: 'very_high',
      entities: this.extractComplexEntities(content),
      relationships: this.extractRelationships(content),
      legal_issues: this.identifyLegalIssues(content),
      metadata: {
        processing_method: 'advanced_analysis',
        extraction_confidence: 0.88,
        analysis_depth: 'comprehensive'
      }
    }
  }

  async processGenericDocument(document) {
    // Fallback processing
    await this.simulateProcessingDelay(100, 500) // 100-500ms
    
    const content = document.content || document.text || 'Generic document content'
    
    return {
      content: content,
      content_length: content.length,
      processing_complexity: 'medium',
      entities: this.extractBasicEntities(content),
      metadata: {
        processing_method: 'generic',
        extraction_confidence: 0.70
      }
    }
  }

  async analyzeDocument(data) {
    const { document, analysis_type } = data
    
    // Simulate document analysis
    await this.simulateProcessingDelay(500, 1500)
    
    const analysis_results = {
      document_id: document.id,
      analysis_type: analysis_type,
      complexity_score: Math.random() * 0.5 + 0.3,
      confidence_score: Math.random() * 0.3 + 0.7,
      legal_issues: this.identifyLegalIssues(document.content || ''),
      entities: this.extractLegalEntities(document.content || ''),
      sentiment_analysis: {
        overall_sentiment: Math.random() > 0.5 ? 'positive' : 'negative',
        confidence: Math.random() * 0.3 + 0.7
      }
    }
    
    return analysis_results
  }

  async extractText(data) {
    const { document } = data
    
    // Simulate text extraction
    await this.simulateProcessingDelay(200, 1000)
    
    const extracted_text = this.generateSampleContent(document, 'extraction')
    
    return {
      document_id: document.id,
      extracted_text: extracted_text,
      character_count: extracted_text.length,
      word_count: extracted_text.split(/\s+/).length,
      extraction_method: 'worker_extraction'
    }
  }

  async performOCR(data) {
    const { document, ocr_options } = data
    
    // Simulate OCR processing (longest task)
    await this.simulateProcessingDelay(3000, 8000)
    
    const ocr_result = {
      document_id: document.id,
      extracted_text: this.generateSampleContent(document, 'ocr'),
      confidence_score: 0.75 + Math.random() * 0.2,
      processing_time_ms: 3000 + Math.random() * 5000,
      pages_processed: Math.floor((document.size || 1024000) / 200000) + 1,
      ocr_engine: 'tesseract',
      language_detected: 'en'
    }
    
    return ocr_result
  }

  // Entity extraction methods
  extractBasicEntities(content) {
    const entities = []
    
    // Simulate basic entity extraction
    const person_matches = content.match(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g) || []
    person_matches.slice(0, 5).forEach((match, index) => {
      entities.push({
        id: `person_${index}`,
        type: 'person',
        text: match,
        confidence: 0.8 + Math.random() * 0.15
      })
    })
    
    const org_matches = content.match(/\b[A-Z][A-Za-z\s]+(Inc|LLC|Corp|Ltd)\b/g) || []
    org_matches.slice(0, 3).forEach((match, index) => {
      entities.push({
        id: `org_${index}`,
        type: 'organization',
        text: match,
        confidence: 0.85 + Math.random() * 0.1
      })
    })
    
    return entities
  }

  extractLegalEntities(content) {
    const entities = this.extractBasicEntities(content)
    
    // Add legal-specific entities
    const legal_terms = ['contract', 'agreement', 'plaintiff', 'defendant', 'court', 'judge']
    legal_terms.forEach((term, index) => {
      if (content.toLowerCase().includes(term)) {
        entities.push({
          id: `legal_${index}`,
          type: 'legal_concept',
          text: term,
          confidence: 0.9
        })
      }
    })
    
    // Add case numbers, dates, amounts
    const case_numbers = content.match(/\b(?:Case|Civil|Criminal)\s*No\.?\s*[\w\d-]+/gi) || []
    case_numbers.slice(0, 2).forEach((match, index) => {
      entities.push({
        id: `case_${index}`,
        type: 'case_number',
        text: match,
        confidence: 0.95
      })
    })
    
    return entities
  }

  extractComplexEntities(content) {
    const entities = this.extractLegalEntities(content)
    
    // Add complex relationships and cross-references
    entities.forEach(entity => {
      entity.relationships = []
      entity.context_score = Math.random() * 0.3 + 0.7
      entity.importance_score = Math.random() * 0.4 + 0.6
    })
    
    return entities
  }

  extractRelationships(content) {
    // Simulate relationship extraction
    return [
      {
        id: 'rel_1',
        type: 'contractual',
        source: 'party_a',
        target: 'party_b',
        confidence: 0.85
      },
      {
        id: 'rel_2',
        type: 'temporal',
        source: 'event_1',
        target: 'event_2',
        confidence: 0.75
      }
    ]
  }

  identifyLegalIssues(content) {
    const issues = []
    
    const legal_keywords = {
      'contract_breach': ['breach', 'violation', 'default'],
      'negligence': ['negligence', 'duty', 'standard of care'],
      'property_dispute': ['property', 'ownership', 'title'],
      'employment': ['employment', 'termination', 'discrimination']
    }
    
    for (const [issue_type, keywords] of Object.entries(legal_keywords)) {
      const keyword_count = keywords.reduce((count, keyword) => 
        count + (content.toLowerCase().split(keyword).length - 1), 0
      )
      
      if (keyword_count > 0) {
        issues.push({
          type: issue_type,
          confidence: Math.min(0.9, 0.5 + (keyword_count * 0.1)),
          keyword_matches: keyword_count
        })
      }
    }
    
    return issues
  }

  // Utility methods
  generateSampleContent(document, processing_type) {
    const base_content = document.content || document.text || ''
    
    if (base_content.length > 0) {
      return base_content
    }
    
    // Generate sample content based on processing type
    const content_templates = {
      'pdf': 'This is a PDF document containing legal text with parties, dates, and contractual obligations.',
      'scanned': 'This document was scanned and processed via OCR. Text extraction confidence may vary.',
      'complex': 'Complex legal document with multiple parties, cross-references, exhibits, and detailed provisions.',
      'ocr': 'OCR extracted text: Legal document with various formatting challenges and potential recognition errors.',
      'extraction': 'Extracted text content from document processing pipeline.'
    }
    
    const template = content_templates[processing_type] || 'Generic document content'
    const document_name = document.name || document.id || 'unknown'
    
    return `${template} Document: ${document_name}. Processing type: ${processing_type}. ` +
           `Timestamp: ${new Date().toISOString()}. Worker: ${this.workerId}.`
  }

  async simulateProcessingDelay(min_ms, max_ms) {
    const delay = Math.random() * (max_ms - min_ms) + min_ms
    return new Promise(resolve => setTimeout(resolve, delay))
  }

  calculateCurrentEfficiency() {
    if (this.processedTasks === 0) return 1.0
    
    const uptime_ms = Date.now() - this.initializeTime
    const active_time_ratio = this.totalProcessingTime / uptime_ms
    
    return Math.min(1.0, active_time_ratio * 1.2) // Boost factor for efficiency
  }

  getWorkerStats() {
    const uptime_ms = Date.now() - this.initializeTime
    
    return {
      worker_id: this.workerId,
      tasks_processed: this.processedTasks,
      total_processing_time_ms: this.totalProcessingTime,
      uptime_ms: uptime_ms,
      average_task_time: this.processedTasks > 0 ? this.totalProcessingTime / this.processedTasks : 0,
      efficiency: this.calculateCurrentEfficiency(),
      utilization: uptime_ms > 0 ? this.totalProcessingTime / uptime_ms : 0
    }
  }
}

// Worker thread initialization
const worker = new AnalysisWorker(workerData?.workerId || 0)

// Handle messages from main thread
if (parentPort) {
  parentPort.on('message', async (message) => {
    const { taskId, taskType, data } = message
    
    try {
      const result = await worker.processTask(taskType, { ...data, taskId })
      
      parentPort.postMessage({
        ...result,
        taskId: taskId
      })
      
    } catch (error) {
      parentPort.postMessage({
        taskId: taskId,
        success: false,
        error: error.message,
        worker_id: worker.workerId,
        worker_stats: worker.getWorkerStats()
      })
    }
  })
  
  // Handle worker shutdown
  parentPort.on('close', () => {
    console.log(`👷 Analysis worker ${worker.workerId} shutting down`)
    process.exit(0)
  })
  
  console.log(`👷 Analysis worker ${worker.workerId} ready for tasks`)
} else {
  console.error('❌ Worker could not establish communication with parent thread')
  process.exit(1)
}