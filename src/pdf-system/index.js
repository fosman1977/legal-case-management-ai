
/**
 * Main PDF Processor - Orchestrates all extraction methods
 * Integrated with Legal Case Management System
 */

const path = require('path');
const fs = require('fs').promises;
const { PDFExtractor } = require('./processors/pdf-extractor');
const { OCREngine } = require('./processors/ocr-engine');
const { TableExtractor } = require('./processors/table-extractor');
const { LayoutAnalyzer } = require('./processors/layout-analyzer');
const { DocumentClassifier } = require('./processors/document-classifier');
const { QualityChecker } = require('./utils/quality-checker');

class LegalPDFProcessor {
  constructor(config = {}) {
    this.config = {
      ocrEnabled: true,
      tableExtraction: true,
      layoutAnalysis: true,
      parallel: true,
      maxWorkers: 4,
      cacheResults: true,
      outputFormat: 'json',
      confidence: 0.85,
      ...config
    };
    
    this.initialized = false;
  }
  
  async initializeComponents() {
    if (this.initialized) return;
    
    console.log('Initializing Legal PDF Processing System...');
    
    // Initialize components
    this.pdfExtractor = new PDFExtractor();
    this.ocrEngine = new OCREngine({
      workers: this.config.maxWorkers,
      languages: ['eng', 'fra', 'deu', 'spa']
    });
    this.tableExtractor = new TableExtractor();
    this.layoutAnalyzer = new LayoutAnalyzer();
    this.classifier = new DocumentClassifier();
    this.qualityChecker = new QualityChecker();
    
    // Load ONNX models if available
    await this.loadModels();
    
    this.initialized = true;
    console.log('✓ Legal PDF System initialized successfully');
  }
  
  async loadModels() {
    const modelsPath = path.join(__dirname, '../../models/onnx');
    
    try {
      const modelFiles = await fs.readdir(modelsPath);
      console.log(`Found ${modelFiles.length} ONNX models`);
      
      // Load models based on availability
      if (modelFiles.includes('layoutlm.onnx')) {
        await this.layoutAnalyzer.loadLayoutLM(path.join(modelsPath, 'layoutlm.onnx'));
      }
      
      if (modelFiles.includes('table-transformer.onnx')) {
        await this.tableExtractor.loadTableTransformer(path.join(modelsPath, 'table-transformer.onnx'));
      }
      
    } catch (error) {
      console.log('Note: ONNX models not found. Using fallback methods.');
    }
  }
  
  /**
   * Main processing method - compatible with existing interface
   */
  async processPDF(pdfPath, options = {}) {
    await this.initializeComponents();
    
    const startTime = Date.now();
    
    console.log(`\nProcessing: ${path.basename(pdfPath)}`);
    console.log('─'.repeat(50));
    
    const result = {
      file: pdfPath,
      timestamp: new Date().toISOString(),
      metadata: {},
      text: '',
      pages: [],
      tables: [],
      entities: {},
      structure: {},
      quality: {},
      errors: [],
      processingTime: 0,
      method: 'legal-pdf-processor'
    };
    
    try {
      // Step 1: Extract metadata and classify document
      result.metadata = await this.pdfExtractor.extractMetadata(pdfPath);
      const docType = await this.classifier.classify(pdfPath);
      result.metadata.documentType = docType;
      
      console.log(`Document Type: ${docType}`);
      console.log(`Pages: ${result.metadata.pages || 'Unknown'}`);
      
      // Step 2: Extract native text (if available)
      const nativeText = await this.pdfExtractor.extractNativeText(pdfPath);
      
      // Step 3: Analyze layout
      if (this.config.layoutAnalysis) {
        console.log('Analyzing document layout...');
        result.structure = await this.layoutAnalyzer.analyze(pdfPath);
      }
      
      // Step 4: Process each page
      const pageCount = result.metadata.pages || 1;
      
      for (let pageNum = 1; pageNum <= Math.min(pageCount, 100); pageNum++) {
        const pageResult = await this.processPage(pdfPath, pageNum, {
          hasNativeText: nativeText.pages[pageNum - 1]?.hasText || false,
          documentType: docType
        });
        
        result.pages.push(pageResult);
        result.text += pageResult.text + '\n\n';
        
        // Collect tables
        if (pageResult.tables && pageResult.tables.length > 0) {
          result.tables.push(...pageResult.tables);
        }
        
        // Progress indicator
        if (pageNum % 10 === 0) {
          console.log(`Processed ${pageNum}/${pageCount} pages...`);
        }
      }
      
      // Step 5: Post-processing
      console.log('Running post-processing...');
      
      // Extract legal entities
      result.entities = await this.extractLegalEntities(result.text, docType);
      
      // Quality assessment
      result.quality = await this.qualityChecker.assess(result);
      
      // Clean up text
      result.text = this.cleanText(result.text);
      
    } catch (error) {
      console.error('Processing error:', error);
      result.errors.push({
        stage: 'processing',
        error: error.message
      });
    }
    
    result.processingTime = Date.now() - startTime;
    console.log(`\n✓ Processing complete in ${result.processingTime}ms`);
    
    return result;
  }

  /**
   * Compatibility method for existing interface
   */
  static async extractText(file) {
    const processor = new LegalPDFProcessor();
    const result = await processor.processPDF(file);
    return result.text;
  }

  /**
   * Compatibility method for existing interface  
   */
  static async extractWithOCRFallback(file) {
    const processor = new LegalPDFProcessor({ ocrEnabled: true });
    const result = await processor.processPDF(file);
    return result.text;
  }

  /**
   * Enhanced table extraction
   */
  static async extractTables(file) {
    const processor = new LegalPDFProcessor({ tableExtraction: true });
    const result = await processor.processPDF(file);
    return result.tables;
  }
  
  async processPage(pdfPath, pageNum, context) {
    const pageResult = {
      pageNumber: pageNum,
      text: '',
      tables: [],
      confidence: 0,
      method: 'unknown'
    };
    
    try {
      // Try native text extraction first
      if (context.hasNativeText) {
        const nativeText = await this.pdfExtractor.extractPageText(pdfPath, pageNum);
        
        if (nativeText && nativeText.length > 50) {
          pageResult.text = nativeText;
          pageResult.method = 'native';
          pageResult.confidence = 0.95;
        }
      }
      
      // Fall back to OCR if needed
      if (!pageResult.text || pageResult.text.length < 50) {
        if (this.config.ocrEnabled) {
          const ocrResult = await this.ocrEngine.recognizePage(pdfPath, pageNum);
          pageResult.text = ocrResult.text;
          pageResult.confidence = ocrResult.confidence;
          pageResult.method = 'ocr';
        }
      }
      
      // Extract tables
      if (this.config.tableExtraction) {
        pageResult.tables = await this.tableExtractor.extractFromPage(pdfPath, pageNum);
      }
      
    } catch (error) {
      pageResult.errors = [error.message];
    }
    
    return pageResult;
  }
  
  async extractLegalEntities(text, documentType) {
    // Enhanced legal entity extraction
    const entities = {
      parties: [],
      dates: [],
      amounts: [],
      citations: [],
      clauses: [],
      caseNumbers: [],
      statutes: []
    };
    
    // Extract parties (enhanced pattern matching)
    const partyPattern = /(?:Plaintiff|Defendant|Appellant|Respondent|Party|vs\.?|v\.?)\s*:?\s*([A-Z][A-Za-z\s,.'&-]+)/gi;
    let match;
    while ((match = partyPattern.exec(text)) !== null) {
      const party = match[1].trim();
      if (party.length > 2 && party.length < 100) {
        entities.parties.push(party);
      }
    }
    
    // Extract case numbers
    const casePattern = /(?:Case\s*(?:No\.?|Number)|Docket\s*(?:No\.?|Number))[:\s]*([A-Z0-9\-\/]+)/gi;
    while ((match = casePattern.exec(text)) !== null) {
      entities.caseNumbers.push(match[1].trim());
    }
    
    // Extract dates (multiple formats)
    const datePatterns = [
      /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/g,
      /\b(\w+\s+\d{1,2},?\s+\d{4})\b/g,
      /\b(\d{1,2}\s+\w+\s+\d{4})\b/g
    ];
    
    for (const pattern of datePatterns) {
      while ((match = pattern.exec(text)) !== null) {
        entities.dates.push(match[1]);
      }
    }
    
    // Extract monetary amounts
    const amountPattern = /\$[\d,]+(?:\.\d{2})?|USD\s+[\d,]+(?:\.\d{2})?/g;
    while ((match = amountPattern.exec(text)) !== null) {
      entities.amounts.push(match[0]);
    }
    
    // Extract legal citations
    const citationPattern = /\b\d+\s+[A-Z][a-z]+\.?\s*(?:\d+[a-z]?|App\.?|Supp\.?)\s+\d+/g;
    while ((match = citationPattern.exec(text)) !== null) {
      entities.citations.push(match[0]);
    }
    
    // Extract statutes
    const statutePattern = /\b(?:\d+\s+U\.S\.C\.|\d+\s+C\.F\.R\.)[^\s,;)]+/g;
    while ((match = statutePattern.exec(text)) !== null) {
      entities.statutes.push(match[0]);
    }
    
    return entities;
  }
  
  cleanText(text) {
    // Enhanced text cleaning for legal documents
    return text
      .replace(/\s+/g, ' ')           // Normalize whitespace
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // Remove control characters
      .replace(/−/g, '-')              // Normalize dashes
      .replace(/"/g, '"')              // Normalize quotes
      .replace(/"/g, '"')
      .replace(/'/g, "'")
      .replace(/'/g, "'")
      .replace(/…/g, '...')            // Normalize ellipsis
      .replace(/\f/g, '\n')           // Form feed to newline
      .trim();
  }
  
  async shutdown() {
    console.log('Shutting down PDF processor...');
    
    if (this.ocrEngine) {
      await this.ocrEngine.terminate();
    }
    
    console.log('✓ Shutdown complete');
  }
}

module.exports = { LegalPDFProcessor };
