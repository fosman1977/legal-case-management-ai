/**
 * UNIVERSAL DOCUMENT EXTRACTOR
 * Supports PDF, Word, and other document formats with enhanced legal analysis
 */

// @ts-ignore - mammoth doesn't have perfect TypeScript definitions
import * as mammoth from 'mammoth';
import { fileTypeFromBuffer } from 'file-type';
import { ProductionDocumentExtractor, ExtractionOptions } from './productionDocumentExtractor';

interface UniversalExtractionResult {
  text: string;
  format: 'pdf' | 'docx' | 'doc' | 'txt' | 'rtf' | 'unknown';
  method: 'native' | 'ocr' | 'hybrid' | 'word' | 'text' | 'streaming';
  processingTime: number;
  metadata: {
    fileName: string;
    fileSize: number;
    fileType: string;
    pages?: number;
    wordCount?: number;
    characterCount?: number;
  };
  // Enhanced features for supported formats
  entities?: any[];
  tables?: any[];
  quality?: any;
  legalMetadata?: any;
  // Word-specific features
  images?: any[];
  styles?: any[];
  warnings?: string[];
}

export class UniversalDocumentExtractor {
  /**
   * Main extraction method that handles multiple document formats
   */
  static async extract(
    file: File,
    options: {
      extractTables?: boolean;
      extractEntities?: boolean;
      extractImages?: boolean;
      maxPages?: number;
      preserveFormatting?: boolean;
    } = {}
  ): Promise<UniversalExtractionResult> {
    const startTime = Date.now();
    
    console.log(`📄 Processing document: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    
    try {
      // Detect file format
      const format = await this.detectFormat(file);
      console.log(`🔍 Detected format: ${format}`);
      
      let result: UniversalExtractionResult;
      
      switch (format) {
        case 'pdf':
          result = await this.extractFromPDF(file, options);
          break;
        case 'docx':
          result = await this.extractFromWordModern(file, options);
          break;
        case 'doc':
          result = await this.extractFromWordLegacy(file, options);
          break;
        case 'txt':
          result = await this.extractFromText(file, options);
          break;
        case 'rtf':
          result = await this.extractFromRTF(file, options);
          break;
        default:
          result = await this.extractAsText(file, options);
      }
      
      result.processingTime = Date.now() - startTime;
      result.format = format;
      
      console.log(`✅ Extraction complete in ${result.processingTime}ms`);
      return result;
      
    } catch (error) {
      console.error('Document extraction failed:', error);
      return this.createErrorResult(file, error, Date.now() - startTime);
    }
  }

  /**
   * Detect document format using file extension and magic bytes
   */
  private static async detectFormat(file: File): Promise<'pdf' | 'docx' | 'doc' | 'txt' | 'rtf' | 'unknown'> {
    const extension = file.name.toLowerCase().split('.').pop() || '';
    
    // First check by extension (fast)
    if (extension === 'pdf') return 'pdf';
    if (extension === 'docx') return 'docx';
    if (extension === 'doc') return 'doc';
    if (extension === 'txt') return 'txt';
    if (extension === 'rtf') return 'rtf';
    
    // Enhanced magic byte detection with DOCX-specific signatures
    try {
      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer.slice(0, 8192)); // Read more bytes for better detection
      const header = Array.from(uint8Array.slice(0, 200)).map(b => String.fromCharCode(b)).join('');
      
      // PDF signature (most reliable first)
      if (header.startsWith('%PDF-')) return 'pdf';
      
      // DOCX signature - ZIP container with Office content
      if (uint8Array[0] === 0x50 && uint8Array[1] === 0x4B && // PK header (ZIP)
          (header.includes('[Content_Types].xml') || 
           header.includes('word/document.xml') ||
           header.includes('_rels/.rels'))) {
        console.log('🔍 Detected DOCX by content signature');
        return 'docx';
      }
      
      // Legacy DOC signature (Microsoft Office Compound Document)
      if (uint8Array[0] === 0xD0 && uint8Array[1] === 0xCF && 
          uint8Array[2] === 0x11 && uint8Array[3] === 0xE0) {
        return 'doc';
      }
      
      // RTF signature
      if (header.startsWith('{\\rtf')) return 'rtf';
      
      // Fallback to file-type library for other formats
      const fileType = await fileTypeFromBuffer(uint8Array);
      
      if (fileType?.mime === 'application/pdf') return 'pdf';
      if (fileType?.mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
      if (fileType?.mime === 'application/msword') return 'doc';
      if (fileType?.mime === 'text/plain') return 'txt';
      if (fileType?.mime === 'application/rtf') return 'rtf';
      
      // Check if it's plain text by examining byte patterns
      const isLikelyText = uint8Array.slice(0, 1024).every(byte => 
        byte < 128 && (byte >= 32 || byte === 9 || byte === 10 || byte === 13)
      );
      if (isLikelyText) return 'txt';
      
    } catch (error) {
      console.warn('Enhanced file type detection failed:', error);
    }
    
    return 'unknown';
  }

  /**
   * Validate DOCX structure and detect potential issues with enhanced diagnostics
   */
  private static validateDOCXStructure(arrayBuffer: ArrayBuffer): { 
    isValid: boolean; 
    warnings: string[]; 
    severity: 'low' | 'medium' | 'high';
    suggestions: string[];
  } {
    const warnings: string[] = [];
    const suggestions: string[] = [];
    let isValid = true;
    let severity: 'low' | 'medium' | 'high' = 'low';
    
    try {
      const uint8Array = new Uint8Array(arrayBuffer.slice(0, 8192));
      const header = Array.from(uint8Array.slice(0, 1000)).map(b => String.fromCharCode(b)).join('');
      
      // Check for ZIP signature (DOCX is a ZIP container)
      if (!(uint8Array[0] === 0x50 && uint8Array[1] === 0x4B)) {
        warnings.push('Missing ZIP signature - file may be corrupted');
        suggestions.push('Try re-saving the document from Word or check file integrity');
        isValid = false;
        severity = 'high';
      }
      
      // Check for required DOCX components
      if (!header.includes('[Content_Types].xml')) {
        warnings.push('Missing Content_Types.xml - may cause extraction issues');
        suggestions.push('Document metadata is incomplete');
        if (severity === 'low') severity = 'medium';
      }
      
      if (!header.includes('word/document.xml') && !header.includes('word/')) {
        warnings.push('Missing word/document.xml - not a valid Word document');
        suggestions.push('This may not be a genuine Word document or is severely corrupted');
        isValid = false;
        severity = 'high';
      }
      
      if (!header.includes('_rels/.rels')) {
        warnings.push('Missing relationships file - document structure may be incomplete');
        suggestions.push('Document relationships are missing - some content may not extract properly');
        if (severity === 'low') severity = 'medium';
      }
      
      // Check file size (very small files are likely incomplete)
      if (arrayBuffer.byteLength < 10000) {
        warnings.push(`Document appears very small (${arrayBuffer.byteLength} bytes) - may be incomplete`);
        suggestions.push('Check if file downloaded/copied completely');
        if (severity === 'low') severity = 'medium';
      }
      
      // Check for common corruption patterns
      const nullBytes = uint8Array.slice(0, 1000).filter(byte => byte === 0).length;
      if (nullBytes > 100) {
        warnings.push(`High number of null bytes detected (${nullBytes}/1000) - possible corruption`);
        suggestions.push('File may be corrupted or not a valid DOCX document');
        if (severity === 'low') severity = 'medium';
      }
      
      // Check for potential encoding issues
      const nonPrintableBytes = uint8Array.slice(0, 1000).filter(byte => byte < 32 && ![9, 10, 13].includes(byte)).length;
      if (nonPrintableBytes > 500) {
        warnings.push('Unusual byte patterns detected - may indicate corruption or wrong file type');
        suggestions.push('Verify this is a genuine Word document (.docx) file');
        if (severity === 'low') severity = 'medium';
      }
      
    } catch (error) {
      warnings.push(`Validation error: ${error}`);
      suggestions.push('Unable to analyze document structure - severe corruption likely');
      isValid = false;
      severity = 'high';
    }
    
    return { isValid, warnings, severity, suggestions };
  }

  /**
   * Process corrupted or invalid DOCX files with fallback methods
   */
  private static async processCurrptedDOCX(
    file: File, 
    validationWarnings: string[], 
    arrayBuffer: ArrayBuffer
  ): Promise<UniversalExtractionResult> {
    console.log('🛠️ Processing corrupted DOCX with fallback methods...');
    
    const warnings = [...validationWarnings];
    let text = '';
    let method: 'word' | 'text' = 'text';
    
    try {
      // Try mammoth extraction anyway (sometimes works despite validation issues)
      try {
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
        method = 'word';
        
        if (text && text.length > 100) {
          console.log('✅ Mammoth extraction succeeded despite validation warnings');
        } else {
          throw new Error('Mammoth extraction returned insufficient content');
        }
      } catch (mammothError) {
        console.warn('❌ Mammoth extraction failed, trying raw text extraction:', mammothError);
        
        // Fallback: Try to extract as raw text
        text = await this.extractTextFromCorruptedDOCX(arrayBuffer);
        method = 'text';
        warnings.push('Used raw text extraction due to DOCX corruption');
      }
      
      // Basic metadata
      const metadata = {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        wordCount: this.countWords(text),
        characterCount: text.length,
      };
      
      console.log(`📊 Corrupted DOCX processed: ${metadata.wordCount} words using ${method} method`);
      
      return {
        text: this.cleanWordText(text),
        format: 'docx',
        method,
        processingTime: 0,
        metadata,
        warnings
      };
      
    } catch (error) {
      console.error('❌ All fallback methods failed:', error);
      
      // Last resort: return error result with partial info
      return {
        text: `[Error: Could not extract from corrupted DOCX file: ${file.name}]\n\nValidation Issues:\n${validationWarnings.join('\n')}`,
        format: 'docx',
        method: 'text',
        processingTime: 0,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          wordCount: 0,
          characterCount: 0,
        },
        warnings: [...warnings, 'Complete extraction failure - file severely corrupted']
      };
    }
  }

  /**
   * Extract readable text from corrupted DOCX by examining raw content
   */
  private static async extractTextFromCorruptedDOCX(arrayBuffer: ArrayBuffer): Promise<string> {
    try {
      // Convert to text and look for readable content
      const uint8Array = new Uint8Array(arrayBuffer);
      let text = '';
      
      // Look for XML-like content that might contain text
      const possibleText = Array.from(uint8Array)
        .map(byte => (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : ' ')
        .join('');
      
      // Extract potential words (sequences of letters)
      const words = possibleText.match(/[a-zA-Z]{2,}/g) || [];
      
      // Filter out XML tags and common Office artifacts
      const filteredWords = words.filter(word => 
        !word.match(/^(xml|rels|word|document|style|font|color|para|run|text|prop)$/i) &&
        word.length > 2 &&
        word.length < 50
      );
      
      if (filteredWords.length > 10) {
        text = filteredWords.join(' ');
        console.log(`🔍 Extracted ${filteredWords.length} words from corrupted DOCX using raw parsing`);
      } else {
        text = '[Document appears to contain no readable text or is severely corrupted]';
      }
      
      return text;
      
    } catch (error) {
      console.error('Raw text extraction from corrupted DOCX failed:', error);
      return '[Unable to extract any readable content from corrupted document]';
    }
  }

  /**
   * Extract from PDF using optimized PDF extractor
   */
  private static async extractFromPDF(
    file: File,
    options: any
  ): Promise<UniversalExtractionResult> {
    console.log('📑 Using optimized PDF extraction with full document processing...');
    
    // Determine extraction mode based on options
    const extractionOptions: ExtractionOptions = {
      mode: options.quickPreview ? 'preview' : 'full',
      maxPages: options.maxPages || Infinity,
      enableOCR: options.enableOCR !== false,
      enableTables: options.extractTables !== false,
      enableEntities: options.extractEntities !== false,
      enableStreaming: options.streaming || false,
      parallel: true,
      onProgress: options.onProgress || undefined,
      abortSignal: options.abortSignal || undefined
    };
    
    // Initialize production extractor if needed
    await ProductionDocumentExtractor.initialize();
    
    // Use production extractor for maximum performance
    const pdfResult = await ProductionDocumentExtractor.extract(file, extractionOptions);
    
    return {
      text: pdfResult.text,
      format: 'pdf',
      method: pdfResult.method,
      processingTime: pdfResult.processingTime,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        pages: pdfResult.metadata.pages,
        wordCount: this.countWords(pdfResult.text),
        characterCount: pdfResult.text.length
      },
      entities: pdfResult.entities,
      tables: pdfResult.tables,
      quality: pdfResult.quality,
      legalMetadata: pdfResult.legalMetadata
    };
  }

  /**
   * Extract from modern Word documents (.docx)
   */
  private static async extractFromWordModern(
    file: File,
    options: any
  ): Promise<UniversalExtractionResult> {
    console.log('📝 Extracting from Word document (.docx)...');
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Validate DOCX structure before processing
      const validation = this.validateDOCXStructure(arrayBuffer);
      if (!validation.isValid) {
        console.warn(`⚠️ DOCX validation issues (${validation.severity} severity):`, validation.warnings);
        if (validation.suggestions.length > 0) {
          console.info('💡 Suggestions:', validation.suggestions);
        }
        
        // For severely corrupted files, try alternative processing
        if (validation.severity === 'high' || validation.warnings.includes('Missing word/document.xml - not a valid Word document')) {
          console.log('🔄 Attempting fallback processing for corrupted DOCX...');
          return this.processCurrptedDOCX(file, validation.warnings, arrayBuffer);
        }
      } else if (validation.warnings.length > 0) {
        // Even valid files may have warnings
        console.info(`ℹ️ DOCX validation warnings (${validation.severity} severity):`, validation.warnings);
      }
      
      // Enhanced mammoth options for legal documents
      const mammothOptions: any = {
        convertImage: options.extractImages ? mammoth.images.imgElement(function(image: any) {
          return image.read("base64").then(function(imageBuffer: string) {
            return {
              src: "data:" + image.contentType + ";base64," + imageBuffer
            };
          });
        }) : undefined,
        
        // Enhanced style mapping for legal documents
        styleMap: [
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh", 
          "p[style-name='Heading 3'] => h3:fresh",
          "p[style-name='Title'] => h1.title:fresh",
          "p[style-name='Subtitle'] => h2.subtitle:fresh",
          // Legal document specific styles
          "p[style-name='Legal Heading'] => h2.legal:fresh",
          "p[style-name='Case Citation'] => p.citation:fresh",
          "p[style-name='Quote'] => blockquote:fresh",
          "p[style-name='Clause'] => p.clause:fresh"
        ],
        
        // Preserve table structure for legal documents
        includeDefaultStyleMap: true,
        preserveEmptyParagraphs: false
      };
      
      // Extract both raw text and HTML with error handling
      const [textResult, htmlResult] = await Promise.allSettled([
        mammoth.extractRawText({ arrayBuffer }),
        mammoth.convertToHtml({ arrayBuffer }, mammothOptions)
      ]);
      
      let text = '';
      let htmlContent = '';
      let warnings: string[] = [];
      
      if (textResult.status === 'fulfilled') {
        text = textResult.value.value;
        const messages = textResult.value.messages || [];
        warnings = warnings.concat(messages.map((msg: any) => msg.message || String(msg)));
      } else {
        console.error('Text extraction failed:', textResult.reason);
        warnings.push('Text extraction failed');
      }
      
      if (htmlResult.status === 'fulfilled') {
        htmlContent = htmlResult.value.value;
        const messages = htmlResult.value.messages || [];
        warnings = warnings.concat(messages.map((msg: any) => msg.message || String(msg)));
      } else {
        console.error('HTML conversion failed:', htmlResult.reason);
        warnings.push('HTML conversion failed');
      }
      
      // Extract enhanced metadata
      const metadata = {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        wordCount: this.countWords(text),
        characterCount: text.length
      };
      
      console.log(`📊 Word document processed: ${metadata.wordCount} words, ${warnings.length} warnings`);
      
      let entities: any[] = [];
      let legalMetadata: any = {};
      
      // Apply legal analysis if enabled
      if (options.extractEntities) {
        entities = await this.extractLegalEntitiesFromText(text);
        legalMetadata = this.analyzeLegalDocument(text, entities);
      }
      
      return {
        text: this.cleanWordText(text),
        format: 'docx',
        method: 'word',
        processingTime: 0, // Will be set by caller
        metadata,
        entities,
        legalMetadata,
        images: options.extractImages && htmlResult.status === 'fulfilled' ? 
          this.extractImagesFromHtml(htmlResult.value.value) : [],
        warnings
      };
      
    } catch (error) {
      console.error('Word extraction failed:', error);
      throw error;
    }
  }

  /**
   * Extract from legacy Word documents (.doc)
   */
  private static async extractFromWordLegacy(
    file: File,
    options: any
  ): Promise<UniversalExtractionResult> {
    console.log('📝 Extracting from legacy Word document (.doc)...');
    
    // For .doc files, we'll try to read as text or suggest conversion
    const text = await this.readAsText(file);
    
    const metadata = {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      wordCount: this.countWords(text),
      characterCount: text.length
    };
    
    return {
      text,
      format: 'doc',
      method: 'text',
      processingTime: 0,
      metadata,
      warnings: ['Legacy .doc format detected. Consider converting to .docx for better extraction quality.']
    };
  }

  /**
   * Extract from plain text files
   */
  private static async extractFromText(
    file: File,
    options: any
  ): Promise<UniversalExtractionResult> {
    console.log('📄 Extracting from text file...');
    
    const text = await this.readAsText(file);
    
    const metadata = {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      wordCount: this.countWords(text),
      characterCount: text.length
    };
    
    let entities: any[] = [];
    let legalMetadata: any = {};
    
    // Apply legal analysis if enabled
    if (options.extractEntities) {
      entities = await this.extractLegalEntitiesFromText(text);
      legalMetadata = this.analyzeLegalDocument(text, entities);
    }
    
    return {
      text,
      format: 'txt',
      method: 'text',
      processingTime: 0,
      metadata,
      entities,
      legalMetadata
    };
  }

  /**
   * Extract from RTF files
   */
  private static async extractFromRTF(
    file: File,
    options: any
  ): Promise<UniversalExtractionResult> {
    console.log('📄 Extracting from RTF file...');
    
    const text = await this.readAsText(file);
    
    // Basic RTF parsing - remove RTF control codes
    const cleanText = text.replace(/\\[a-z]+[0-9]*\s?/gi, '')
                         .replace(/[{}]/g, '')
                         .replace(/\\\\/g, '\\')
                         .trim();
    
    const metadata = {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      wordCount: this.countWords(cleanText),
      characterCount: cleanText.length
    };
    
    return {
      text: cleanText,
      format: 'rtf',
      method: 'text',
      processingTime: 0,
      metadata
    };
  }

  /**
   * Fallback: extract as plain text
   */
  private static async extractAsText(
    file: File,
    options: any
  ): Promise<UniversalExtractionResult> {
    console.log('📄 Extracting as plain text (fallback)...');
    
    const text = await this.readAsText(file);
    
    const metadata = {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      wordCount: this.countWords(text),
      characterCount: text.length
    };
    
    return {
      text,
      format: 'unknown',
      method: 'text',
      processingTime: 0,
      metadata,
      warnings: [`Unknown file format: ${file.type || 'no type'}. Extracted as plain text.`]
    };
  }

  /**
   * Read file as text
   */
  private static async readAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  /**
   * Clean Word extracted text
   */
  private static cleanWordText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/^\s+|\s+$/gm, '')
      .trim();
  }

  /**
   * Count words in text
   */
  private static countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Extract legal entities from plain text
   */
  private static async extractLegalEntitiesFromText(text: string): Promise<any[]> {
    // Simplified legal entity extraction for non-PDF documents
    const entities: any[] = [];
    
    // UK Case numbers
    const caseNumberPattern = /\[(\d{4})\]\s+[A-Z]+\s+\d+/g;
    let match;
    while ((match = caseNumberPattern.exec(text)) !== null) {
      entities.push({
        type: 'case_number',
        value: match[0],
        context: this.getContext(text, match.index, 50),
        confidence: 0.9
      });
    }
    
    // Monetary amounts
    const amountPattern = /£[\d,]+(?:\.\d{2})?/g;
    while ((match = amountPattern.exec(text)) !== null) {
      entities.push({
        type: 'monetary_amount',
        value: match[0],
        context: this.getContext(text, match.index, 30),
        confidence: 0.95
      });
    }
    
    // Courts
    const courtPattern = /(?:High\s+Court|Crown\s+Court|County\s+Court|Supreme\s+Court)/gi;
    while ((match = courtPattern.exec(text)) !== null) {
      entities.push({
        type: 'court',
        value: match[0],
        context: this.getContext(text, match.index, 40),
        confidence: 0.85
      });
    }
    
    return entities;
  }

  /**
   * Analyze legal document type and metadata
   */
  private static analyzeLegalDocument(text: string, entities: any[]): any {
    const lowerText = text.toLowerCase().substring(0, 2000);
    
    let documentType = 'legal_document';
    if (lowerText.includes('witness statement')) documentType = 'witness_statement';
    else if (lowerText.includes('skeleton argument')) documentType = 'skeleton_argument';
    else if (lowerText.includes('particulars of claim')) documentType = 'particulars_of_claim';
    else if (lowerText.includes('defence')) documentType = 'defence';
    else if (lowerText.includes('judgment')) documentType = 'judgment';
    
    const caseNumber = entities.find(e => e.type === 'case_number')?.value;
    const court = entities.find(e => e.type === 'court')?.value;
    
    return {
      documentType,
      caseNumber,
      court,
      entities: entities.length
    };
  }

  /**
   * Get context around matched text
   */
  private static getContext(text: string, index: number, length: number): string {
    const start = Math.max(0, index - length);
    const end = Math.min(text.length, index + length);
    return text.substring(start, end).replace(/\s+/g, ' ').trim();
  }

  /**
   * Extract images from HTML (Word conversion)
   */
  private static extractImagesFromHtml(html: string): any[] {
    const images: any[] = [];
    const imgPattern = /<img[^>]+src="([^"]*)"[^>]*>/gi;
    let match;
    
    while ((match = imgPattern.exec(html)) !== null) {
      images.push({
        src: match[1],
        type: 'embedded'
      });
    }
    
    return images;
  }

  /**
   * Create error result
   */
  private static createErrorResult(
    file: File,
    error: any,
    processingTime: number
  ): UniversalExtractionResult {
    return {
      text: `[Error extracting document: ${file.name}]\n${error.message || 'Unknown error'}`,
      format: 'unknown',
      method: 'native',
      processingTime,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        wordCount: 0,
        characterCount: 0
      },
      warnings: [`Extraction failed: ${error.message || 'Unknown error'}`]
    };
  }

  /**
   * Check if file is supported
   */
  static isSupported(file: File): boolean {
    const extension = file.name.toLowerCase().split('.').pop() || '';
    const supportedExtensions = ['pdf', 'docx', 'doc', 'txt', 'rtf'];
    return supportedExtensions.includes(extension);
  }

  /**
   * Get supported formats list
   */
  static getSupportedFormats(): string[] {
    return ['PDF', 'Word (.docx)', 'Legacy Word (.doc)', 'Text (.txt)', 'Rich Text (.rtf)'];
  }
}

// Export for backward compatibility
export const DocumentExtractor = UniversalDocumentExtractor;