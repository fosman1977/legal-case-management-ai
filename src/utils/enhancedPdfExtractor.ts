// Enhanced PDF extraction with best-in-class libraries for legal documents
import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

// Note: LegalPDFProcessor is Node.js only, not available in browser
// We'll use dynamic import only when in Node.js environment
declare const process: any;

// Configure PDF.js worker - v5 with proper version handling  
if (typeof pdfjsLib !== 'undefined' && pdfjsLib.version) {
  try {
    const version = pdfjsLib.version;
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
    console.log(`Enhanced PDF.js worker configured for version ${version}`);
  } catch (error) {
    console.warn('Failed to set PDF.js worker from CDN, using local fallback');
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  }
} else {
  console.warn('PDF.js version not detected, using fallback worker');
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

// Enhanced interfaces for structured extraction
interface ExtractedTable {
  pageNumber: number;
  headers: string[];
  rows: string[][];
  markdown: string;
}

interface ExtractedEntity {
  type: 'person' | 'organization' | 'date' | 'location' | 'legal_citation' | 'monetary_amount';
  value: string;
  context: string;
  pageNumber: number;
}

interface ExtractionResult {
  text: string;
  tables: ExtractedTable[];
  entities: ExtractedEntity[];
  metadata: any;
  method: 'scribe' | 'mupdf' | 'pdf2json' | 'pdfjs' | 'tesseract' | 'enhanced-pdfjs-browser' | 'legal-pdf-processor';
  confidence: number;
}

export class EnhancedPDFExtractor {
  private static readonly LEGAL_PATTERNS = {
    caseNumber: /\b(?:Case\s*(?:No\.?|Number)|Docket\s*(?:No\.?|Number))[:\s]*([A-Z0-9\-\/]+)/gi,
    courtOrder: /\b(?:ORDER|JUDGMENT|DECREE|RULING)\b/gi,
    deadline: /\b(?:by|before|on\s+or\s+before|no\s+later\s+than|within)\s+(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\w+\s+\d{1,2},?\s+\d{4})/gi,
    legalCitation: /\b\d+\s+[A-Z][a-z]+\.?\s*(?:\d+[a-z]?|App\.?|Supp\.?)\s+\d+/g,
    statute: /\b(?:\d+\s+U\.S\.C\.|\d+\s+C\.F\.R\.)[^\s,;)]+/g,
  };

  /**
   * Main extraction method with intelligent routing - browser-compatible
   */
  static async extract(file: File): Promise<ExtractionResult> {
    console.log(`🚀 Starting enhanced PDF extraction for: ${file.name}`);
    
    // Check if we're in Node.js environment for advanced processing
    const isNodeJs = typeof process !== 'undefined' && process.versions && process.versions.node;
    
    if (isNodeJs) {
      try {
        // Dynamic import for Node.js environment only
        // @ts-ignore - Dynamic import of CommonJS module in Node.js environment
        const module = await import('../pdf-system/index.js');
        const { LegalPDFProcessor } = module as any;
        
        const processor = new LegalPDFProcessor({
          ocrEnabled: true,
          tableExtraction: true,
          layoutAnalysis: true,
          parallel: true,
          maxWorkers: 2,
          confidence: 0.85
        });
        
        // Process with advanced system
        const result = await processor.processPDF(file);
        
        // Convert to our interface format
        const extractionResult: ExtractionResult = {
          text: result.text,
          tables: result.tables.map((table: any) => ({
            pageNumber: table.pageNumber || 1,
            headers: table.headers || [],
            rows: table.rows || [],
            markdown: this.tableToMarkdown(table)
          })),
          entities: this.convertEntities(result.entities),
          metadata: result.metadata,
          method: result.method || 'legal-pdf-processor',
          confidence: result.quality?.overall || 0.9
        };
        
        await processor.shutdown();
        return extractionResult;
        
      } catch (error) {
        console.warn('Advanced Node.js extraction failed, using browser fallback:', error);
      }
    }
    
    // Browser environment or Node.js fallback - use enhanced browser methods
    console.log('Using browser-compatible PDF extraction methods');
    
    const characteristics = await this.analyzePDF(file);
    
    // Route to appropriate extraction method based on characteristics
    if (characteristics.isScanned) {
      return await this.extractWithTesseract(file);
    } else if (characteristics.hasTables) {
      return await this.extractWithEnhancedPDFJS(file);
    } else {
      return await this.extractWithPDFJS(file);
    }
  }

  /**
   * Analyze PDF characteristics to determine best extraction method
   */
  private static async analyzePDF(file: File): Promise<{
    isScanned: boolean;
    hasTables: boolean;
    pageCount: number;
    hasComplexLayout: boolean;
  }> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let isScanned = true;
      let hasTables = false;
      let hasComplexLayout = false;
      
      // Sample first 3 pages
      const samplesToCheck = Math.min(3, pdf.numPages);
      
      for (let i = 1; i <= samplesToCheck; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Check if scanned (low text density)
        if (textContent.items.length > 20) {
          isScanned = false;
        }
        
        // Check for table indicators
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        if (pageText.includes('|') || /\t{2,}/.test(pageText)) {
          hasTables = true;
        }
        
        // Check for complex layout (multiple columns, varied positions)
        const xPositions = new Set(textContent.items.map((item: any) => 
          Math.round(item.transform?.[4] || 0)
        ));
        
        if (xPositions.size > 10) {
          hasComplexLayout = true;
        }
        
        page.cleanup();
      }
      
      const pageCount = pdf.numPages;
      pdf.destroy();
      
      console.log(`📊 PDF Analysis: Pages=${pageCount}, Scanned=${isScanned}, Tables=${hasTables}, Complex=${hasComplexLayout}`);
      
      return { isScanned, hasTables, pageCount, hasComplexLayout };
    } catch (error) {
      console.warn('PDF analysis failed:', error);
      return { isScanned: false, hasTables: false, pageCount: 0, hasComplexLayout: false };
    }
  }

  /**
   * Extract using enhanced PDF.js with better legal entity extraction
   */
  private static async extractWithEnhancedPDFJS(file: File): Promise<ExtractionResult> {
    console.log('📄 Using enhanced PDF.js for browser extraction...');
    
    // Use the regular PDF.js method but with enhanced post-processing
    const result = await this.extractWithPDFJS(file);
    
    // Enhance the result with better legal entity extraction
    result.entities = await this.extractEnhancedLegalEntities(result.text);
    result.method = 'enhanced-pdfjs-browser';
    result.confidence = Math.min(result.confidence + 0.1, 1.0); // Slight boost for enhanced processing
    
    return result;
  }

  /**
   * Extract using enhanced Tesseract.js (Scribe.js is not available yet)
   */
  private static async extractWithScribe(file: File): Promise<ExtractionResult> {
    console.log('🔍 Using enhanced Tesseract.js for OCR extraction...');
    return await this.extractWithTesseract(file);
  }

  /**
   * Extract with enhanced PDF.js (MuPDF not available yet)
   */
  private static async extractWithMuPDF(file: File): Promise<ExtractionResult> {
    console.log('📊 Using enhanced PDF.js for extraction...');
    return await this.extractWithPDFJS(file);
  }

  /**
   * Extract using enhanced PDF.js (pdf2json not available yet)
   */
  private static async extractWithPdf2Json(file: File): Promise<ExtractionResult> {
    console.log('⚡ Using enhanced PDF.js for high-performance extraction...');
    return await this.extractWithPDFJS(file);
  }

  /**
   * Extract using PDF.js (fallback)
   */
  private static async extractWithPDFJS(file: File): Promise<ExtractionResult> {
    console.log('📄 Using PDF.js for extraction...');
    
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    const entities: ExtractedEntity[] = [];
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += `\n--- Page ${pageNum} ---\n${pageText}`;
      
      // Extract entities
      const pageEntities = this.extractLegalEntities(pageText, pageNum);
      entities.push(...pageEntities);
      
      page.cleanup();
    }
    
    pdf.destroy();
    
    return {
      text: this.cleanExtractedText(fullText),
      tables: [],
      entities,
      metadata: await this.extractMetadata(file),
      method: 'pdfjs',
      confidence: 0.85
    };
  }

  /**
   * Fallback to Tesseract if Scribe fails
   */
  private static async extractWithTesseract(file: File): Promise<ExtractionResult> {
    console.log('🔄 Falling back to Tesseract.js...');
    
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    const entities: ExtractedEntity[] = [];
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({
        canvasContext: context,
        viewport: viewport,
        canvas: canvas
      }).promise;
      
      const { data: { text } } = await Tesseract.recognize(
        canvas.toDataURL('image/png'),
        'eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              console.log(`Tesseract: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );
      
      fullText += `\n--- Page ${pageNum} ---\n${text}`;
      
      const pageEntities = this.extractLegalEntities(text, pageNum);
      entities.push(...pageEntities);
      
      page.cleanup();
    }
    
    pdf.destroy();
    
    return {
      text: this.cleanExtractedText(fullText),
      tables: [],
      entities,
      metadata: await this.extractMetadata(file),
      method: 'tesseract',
      confidence: 0.75
    };
  }

  /**
   * Enhanced legal entity extraction for browser environment
   */
  private static async extractEnhancedLegalEntities(text: string): Promise<ExtractedEntity[]> {
    const entities: ExtractedEntity[] = [];
    
    // Enhanced patterns for legal documents
    const enhancedPatterns = {
      // Case numbers - multiple formats
      caseNumbers: [
        /(?:Case\s*(?:No\.?|Number)|Docket\s*(?:No\.?|Number))[:\s]*([A-Z0-9\-\/\.\s]{3,20})/gi,
        /(?:Civil\s*(?:Action|Case))\s*(?:No\.?)?\s*([A-Z0-9\-\/\.\s]{3,20})/gi,
        /(?:Criminal\s*(?:Action|Case))\s*(?:No\.?)?\s*([A-Z0-9\-\/\.\s]{3,20})/gi
      ],
      
      // Legal parties - enhanced patterns
      parties: [
        /(?:Plaintiff|Defendant|Appellant|Respondent|Petitioner|Applicant)[s]?\s*:?\s*([A-Z][A-Za-z\s,.'&\-]{2,100})/gi,
        /([A-Z][A-Za-z\s,.'&\-]{2,50})\s+(?:vs?\.?|v\.?)\s+([A-Z][A-Za-z\s,.'&\-]{2,50})/gi,
        /(?:In\s+the\s+Matter\s+of)\s+([A-Z][A-Za-z\s,.'&\-]{2,100})/gi
      ],
      
      // Dates - comprehensive patterns
      dates: [
        /\b(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\b/g,
        /\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})\b/gi,
        /\b(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})\b/gi,
        /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{1,2},?\s+\d{4})\b/gi
      ],
      
      // Legal citations - enhanced
      citations: [
        /\b\d+\s+[A-Z][a-z]+\.?\s*(?:\d+[a-z]?|App\.?|Supp\.?)\s+\d+/g,
        /\b\d+\s+F\.?\s*(?:2d|3d)?\s+\d+/g,
        /\b\d+\s+S\.?\s*Ct\.?\s+\d+/g,
        /\b\d+\s+U\.S\.?\s+\d+/g
      ],
      
      // Statutes and regulations
      statutes: [
        /\b(?:\d+\s+U\.S\.C\.|\d+\s+C\.F\.R\.)[^\s,;)]+/g,
        /\b(?:Section|§)\s*\d+[A-Za-z0-9\.\-\(\)]*\s*(?:of\s+[A-Za-z\s]+)?/g
      ],
      
      // Monetary amounts - comprehensive
      amounts: [
        /\$[\d,]+(?:\.\d{2})?/g,
        /USD\s+[\d,]+(?:\.\d{2})?/g,
        /(?:dollars?|USD)\s+[\d,]+(?:\.\d{2})?/gi,
        /[\d,]+(?:\.\d{2})?\s+dollars?/gi
      ]
    };
    
    // Extract case numbers
    for (const pattern of enhancedPatterns.caseNumbers) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const caseNumber = match[1].trim();
        if (caseNumber.length >= 3 && caseNumber.length <= 20) {
          entities.push({
            type: 'legal_citation',
            value: `Case No. ${caseNumber}`,
            context: this.getContext(text, match[0]),
            pageNumber: 1 // Would need page tracking in full implementation
          });
        }
      }
    }
    
    // Extract legal parties
    for (const pattern of enhancedPatterns.parties) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (match[1]) {
          const party = match[1].trim();
          if (party.length > 2 && party.length < 100 && !party.match(/^\d+$/)) {
            entities.push({
              type: 'person',
              value: party,
              context: this.getContext(text, match[0]),
              pageNumber: 1
            });
          }
        }
        if (match[2]) {
          const party = match[2].trim();
          if (party.length > 2 && party.length < 100 && !party.match(/^\d+$/)) {
            entities.push({
              type: 'person',
              value: party,
              context: this.getContext(text, match[0]),
              pageNumber: 1
            });
          }
        }
      }
    }
    
    // Extract dates
    for (const pattern of enhancedPatterns.dates) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          type: 'date',
          value: match[1],
          context: this.getContext(text, match[0]),
          pageNumber: 1
        });
      }
    }
    
    // Extract legal citations
    for (const pattern of enhancedPatterns.citations) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          type: 'legal_citation',
          value: match[0],
          context: this.getContext(text, match[0]),
          pageNumber: 1
        });
      }
    }
    
    // Extract statutes
    for (const pattern of enhancedPatterns.statutes) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          type: 'legal_citation',
          value: match[0],
          context: this.getContext(text, match[0]),
          pageNumber: 1
        });
      }
    }
    
    // Extract monetary amounts
    for (const pattern of enhancedPatterns.amounts) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          type: 'monetary_amount',
          value: match[0],
          context: this.getContext(text, match[0]),
          pageNumber: 1
        });
      }
    }
    
    // Remove duplicates based on type and value
    const unique = entities.filter((entity, index, self) => 
      index === self.findIndex(e => e.type === entity.type && e.value === entity.value)
    );
    
    console.log(`✅ Enhanced entity extraction found ${unique.length} legal entities`);
    return unique;
  }

  /**
   * Extract legal entities from text (basic version)
   */
  private static extractLegalEntities(text: string, pageNumber: number): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    
    // Extract case numbers
    const caseNumbers = text.match(this.LEGAL_PATTERNS.caseNumber) || [];
    caseNumbers.forEach(match => {
      entities.push({
        type: 'legal_citation',
        value: match,
        context: this.getContext(text, match),
        pageNumber
      });
    });
    
    // Extract deadlines
    const deadlines = text.match(this.LEGAL_PATTERNS.deadline) || [];
    deadlines.forEach(match => {
      entities.push({
        type: 'date',
        value: match,
        context: this.getContext(text, match),
        pageNumber
      });
    });
    
    // Extract legal citations
    const citations = text.match(this.LEGAL_PATTERNS.legalCitation) || [];
    citations.forEach(match => {
      entities.push({
        type: 'legal_citation',
        value: match,
        context: this.getContext(text, match),
        pageNumber
      });
    });
    
    // Extract monetary amounts
    const amounts = text.match(/\$[\d,]+(?:\.\d{2})?/g) || [];
    amounts.forEach(match => {
      entities.push({
        type: 'monetary_amount',
        value: match,
        context: this.getContext(text, match),
        pageNumber
      });
    });
    
    return entities;
  }

  /**
   * Get surrounding context for an entity
   */
  private static getContext(text: string, match: string, contextLength: number = 50): string {
    const index = text.indexOf(match);
    if (index === -1) return '';
    
    const start = Math.max(0, index - contextLength);
    const end = Math.min(text.length, index + match.length + contextLength);
    
    return text.substring(start, end).replace(/\n/g, ' ').trim();
  }

  /**
   * Clean extracted text
   */
  private static cleanExtractedText(text: string): string {
    return text
      .replace(/--- Page \d+ ---\n/g, '\n')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[\u000C\u2028\u2029]/g, '\n')
      .replace(/([.!?])\s*([A-Z])/g, '$1 $2')
      .replace(/(\w)([.!?])([A-Z])/g, '$1$2 $3')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract metadata from PDF
   */
  private static async extractMetadata(file: File): Promise<any> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      const metadata = await pdf.getMetadata();
      const info = metadata.info as any;
      
      pdf.destroy();
      
      return {
        title: info?.Title || file.name,
        author: info?.Author || 'Unknown',
        subject: info?.Subject || '',
        creator: info?.Creator || '',
        producer: info?.Producer || '',
        creationDate: info?.CreationDate || null,
        modificationDate: info?.ModDate || null,
        pages: pdf.numPages,
        fileName: file.name,
        fileSize: file.size
      };
    } catch (error) {
      console.warn('Metadata extraction failed:', error);
      return {
        title: file.name,
        fileName: file.name,
        fileSize: file.size
      };
    }
  }

  /**
   * Check if file is a PDF
   */
  static isPDF(file: File): boolean {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  }

  /**
   * Legacy method for backward compatibility
   */
  static async extractText(file: File): Promise<string> {
    const result = await this.extract(file);
    return result.text;
  }

  /**
   * Legacy method for backward compatibility
   */
  static async extractWithOCRFallback(file: File): Promise<string> {
    const result = await this.extract(file);
    return result.text;
  }

  /**
   * Extract tables specifically (useful for contracts, court orders)
   */
  static async extractTables(file: File): Promise<ExtractedTable[]> {
    const result = await this.extract(file);
    return result.tables;
  }

  /**
   * Extract legal entities specifically
   */
  static async extractLegalEntitiesFromFile(file: File): Promise<ExtractedEntity[]> {
    const result = await this.extract(file);
    return result.entities;
  }

  // Removed unused fileToPath method

  /**
   * Convert table to markdown format
   */
  private static tableToMarkdown(table: any): string {
    if (!table.headers || !table.rows) return '';
    
    let markdown = '';
    
    // Add headers
    if (table.headers.length > 0) {
      markdown += '| ' + table.headers.join(' | ') + ' |\\n';
      markdown += '|' + table.headers.map(() => ' --- ').join('|') + '|\\n';
    }
    
    // Add rows
    for (const row of table.rows) {
      markdown += '| ' + row.join(' | ') + ' |\\n';
    }
    
    return markdown;
  }

  /**
   * Convert entities from new format to our interface
   */
  private static convertEntities(entities: any): ExtractedEntity[] {
    const converted: ExtractedEntity[] = [];
    
    if (entities.parties) {
      entities.parties.forEach((party: string) => {
        converted.push({
          type: 'person',
          value: party,
          context: 'Legal party',
          pageNumber: 1 // Default, would need page tracking
        });
      });
    }
    
    if (entities.dates) {
      entities.dates.forEach((date: string) => {
        converted.push({
          type: 'date',
          value: date,
          context: 'Legal date reference',
          pageNumber: 1
        });
      });
    }
    
    if (entities.amounts) {
      entities.amounts.forEach((amount: string) => {
        converted.push({
          type: 'monetary_amount',
          value: amount,
          context: 'Financial amount',
          pageNumber: 1
        });
      });
    }
    
    if (entities.citations) {
      entities.citations.forEach((citation: string) => {
        converted.push({
          type: 'legal_citation',
          value: citation,
          context: 'Legal citation',
          pageNumber: 1
        });
      });
    }
    
    return converted;
  }
}

// Export for backward compatibility
export const PDFTextExtractor = EnhancedPDFExtractor;