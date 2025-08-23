/**
 * Document Extraction - Week 10 Day 1-2
 * Optimized document processing and content extraction
 */

class DocumentExtractor {
  constructor() {
    this.supported_formats = ['pdf', 'docx', 'txt', 'html', 'rtf', 'odt']
    this.extraction_config = {
      max_file_size: 50 * 1024 * 1024, // 50MB
      timeout: 30000, // 30 seconds
      preserve_formatting: true,
      extract_metadata: true
    }
  }

  async processDocuments(documents) {
    const processed = []
    const processing_errors = []

    for (const doc of documents) {
      try {
        const startTime = performance.now()
        
        const extracted = await this.extractDocumentContent(doc)
        const processingTime = performance.now() - startTime

        processed.push({
          ...extracted,
          processing_time: processingTime,
          processing_status: 'success'
        })
      } catch (error) {
        processing_errors.push({
          document_id: doc.id || doc.name,
          error: error.message,
          status: 'failed'
        })
        
        // Add minimal document entry for failed processing
        processed.push({
          id: doc.id || doc.name,
          content: '',
          metadata: { processing_error: error.message },
          processing_status: 'failed'
        })
      }
    }

    return {
      documents: processed,
      processing_summary: {
        total_documents: documents.length,
        successful: processed.filter(d => d.processing_status === 'success').length,
        failed: processing_errors.length,
        errors: processing_errors
      }
    }
  }

  async extractDocumentContent(document) {
    // Validate document
    this.validateDocument(document)
    
    // Extract based on format
    const format = this.detectFormat(document)
    let content = ''
    let metadata = {}

    switch (format) {
      case 'txt':
      case 'text':
        content = await this.extractTextContent(document)
        break
      case 'pdf':
        content = await this.extractPDFContent(document)
        metadata = await this.extractPDFMetadata(document)
        break
      case 'docx':
      case 'doc':
        content = await this.extractWordContent(document)
        metadata = await this.extractWordMetadata(document)
        break
      case 'html':
        content = await this.extractHTMLContent(document)
        break
      default:
        content = await this.extractTextContent(document)
    }

    // Post-process content
    const processed_content = this.postProcessContent(content)
    
    return {
      id: document.id || document.name || `doc_${Date.now()}`,
      name: document.name || document.filename || 'Unknown Document',
      content: processed_content,
      original_format: format,
      metadata: {
        ...metadata,
        file_size: this.calculateContentSize(processed_content),
        extraction_timestamp: new Date().toISOString(),
        word_count: this.countWords(processed_content),
        character_count: processed_content.length
      },
      type: this.classifyDocumentType(processed_content),
      creation_date: document.creation_date || document.date || new Date().toISOString(),
      author: document.author || metadata.author || 'Unknown'
    }
  }

  validateDocument(document) {
    if (!document) {
      throw new Error('Document is null or undefined')
    }
    
    if (document.size && document.size > this.extraction_config.max_file_size) {
      throw new Error(`Document size exceeds maximum allowed size of ${this.extraction_config.max_file_size} bytes`)
    }
  }

  detectFormat(document) {
    // Check file extension
    if (document.name || document.filename) {
      const filename = document.name || document.filename
      const extension = filename.split('.').pop()?.toLowerCase()
      
      if (this.supported_formats.includes(extension)) {
        return extension
      }
    }
    
    // Check MIME type
    if (document.type) {
      const mimeMap = {
        'text/plain': 'txt',
        'application/pdf': 'pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'application/msword': 'doc',
        'text/html': 'html',
        'application/rtf': 'rtf'
      }
      
      return mimeMap[document.type] || 'txt'
    }
    
    // Default to text
    return 'txt'
  }

  async extractTextContent(document) {
    if (document.content) {
      return document.content
    }
    
    if (document.text) {
      return document.text
    }
    
    // If document has a file buffer/blob
    if (document.buffer || document.data) {
      try {
        const buffer = document.buffer || document.data
        return buffer.toString('utf8')
      } catch (error) {
        throw new Error(`Failed to extract text content: ${error.message}`)
      }
    }
    
    throw new Error('No extractable content found in document')
  }

  async extractPDFContent(document) {
    // In a real implementation, this would use a PDF parsing library
    // For now, return content if available or placeholder
    if (document.content || document.text) {
      return document.content || document.text
    }
    
    return `[PDF Content - ${document.name || 'Unknown PDF'}]\n\nPDF content would be extracted here using a PDF parsing library.`
  }

  async extractPDFMetadata(document) {
    // In a real implementation, extract actual PDF metadata
    return {
      format: 'PDF',
      pages: document.pages || 1,
      created: document.created || null,
      modified: document.modified || null,
      producer: document.producer || null,
      creator: document.creator || null
    }
  }

  async extractWordContent(document) {
    // In a real implementation, this would use a Word parsing library
    if (document.content || document.text) {
      return document.content || document.text
    }
    
    return `[Word Document Content - ${document.name || 'Unknown Document'}]\n\nWord document content would be extracted here using a Word parsing library.`
  }

  async extractWordMetadata(document) {
    return {
      format: 'Word Document',
      author: document.author || null,
      created: document.created || null,
      modified: document.modified || null,
      revision: document.revision || null
    }
  }

  async extractHTMLContent(document) {
    if (document.content || document.text) {
      // Strip HTML tags for plain text content
      const content = document.content || document.text
      return content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    }
    
    return ''
  }

  postProcessContent(content) {
    if (!content) return ''
    
    // Normalize whitespace
    let processed = content.replace(/\s+/g, ' ').trim()
    
    // Remove excessive line breaks
    processed = processed.replace(/\n\s*\n\s*\n/g, '\n\n')
    
    // Clean up common artifacts
    processed = processed.replace(/\u00A0/g, ' ') // Non-breaking spaces
    processed = processed.replace(/\uFEFF/g, '') // Byte order marks
    
    return processed
  }

  calculateContentSize(content) {
    return new Blob([content]).size
  }

  countWords(content) {
    if (!content) return 0
    return content.trim().split(/\s+/).length
  }

  classifyDocumentType(content) {
    if (!content) return 'unknown'
    
    const lowerContent = content.toLowerCase()
    
    // Legal document classification
    if (/\b(?:contract|agreement|covenant|whereas|party|parties)\b/.test(lowerContent)) {
      return 'contract'
    }
    
    if (/\b(?:email|from:|to:|subject:|sent:)\b/.test(lowerContent)) {
      return 'email'
    }
    
    if (/\b(?:invoice|bill|payment|amount due|total:|subtotal:)\b/.test(lowerContent)) {
      return 'financial'
    }
    
    if (/\b(?:memorandum|memo|re:|regarding:)\b/.test(lowerContent)) {
      return 'memo'
    }
    
    if (/\b(?:letter|dear|sincerely|regards|yours truly)\b/.test(lowerContent)) {
      return 'correspondence'
    }
    
    if (/\b(?:report|analysis|findings|conclusion|recommendation)\b/.test(lowerContent)) {
      return 'report'
    }
    
    if (/\b(?:witness|testimony|statement|declare|swear|affirm)\b/.test(lowerContent)) {
      return 'statement'
    }
    
    if (/\b(?:notice|notification|hereby notify|formal notice)\b/.test(lowerContent)) {
      return 'notice'
    }
    
    return 'general'
  }

  // Utility methods
  getExtractionStats() {
    return {
      extractor_type: 'DocumentExtractor',
      supported_formats: this.supported_formats,
      max_file_size: this.extraction_config.max_file_size,
      capabilities: [
        'Multi-format document extraction',
        'Content normalization',
        'Metadata extraction',
        'Document type classification',
        'Processing error handling',
        'Performance monitoring'
      ]
    }
  }

  // Batch processing optimization
  async processBatch(documents, batch_size = 10) {
    const results = []
    const batches = this.createBatches(documents, batch_size)
    
    for (const batch of batches) {
      const batch_results = await Promise.all(
        batch.map(doc => this.extractDocumentContent(doc).catch(error => ({
          id: doc.id || doc.name,
          content: '',
          metadata: { processing_error: error.message },
          processing_status: 'failed'
        })))
      )
      
      results.push(...batch_results)
    }
    
    return {
      documents: results,
      processing_summary: {
        total_documents: documents.length,
        successful: results.filter(d => d.processing_status !== 'failed').length,
        failed: results.filter(d => d.processing_status === 'failed').length,
        batch_size: batch_size,
        total_batches: batches.length
      }
    }
  }

  createBatches(array, batch_size) {
    const batches = []
    for (let i = 0; i < array.length; i += batch_size) {
      batches.push(array.slice(i, i + batch_size))
    }
    return batches
  }
}

export default DocumentExtractor