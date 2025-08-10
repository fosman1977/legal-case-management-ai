// Browser-only PDF extraction - no Node.js dependencies
import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

// Disable PDF.js worker for maximum browser compatibility
// This runs PDF.js in main thread which is more reliable but slower
const configureWorker = () => {
  try {
    console.log('🔧 Configuring PDF.js for browser compatibility...');
    
    // Disable worker completely for better compatibility
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';
    if (pdfjsLib.GlobalWorkerOptions.workerPort !== undefined) {
      pdfjsLib.GlobalWorkerOptions.workerPort = null;
    }
    
    console.log('✅ PDF.js configured for main-thread processing (no worker)');
    
  } catch (error) {
    console.warn('PDF.js configuration warning:', error);
    // Try alternate configuration
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '';
      console.log('✅ Fallback PDF.js configuration applied');
    } catch (fallbackError) {
      console.error('Failed to configure PDF.js:', fallbackError);
    }
  }
};

// Configure immediately
configureWorker();

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
  method: 'pdfjs-browser' | 'tesseract-browser' | 'enhanced-browser';
  confidence: number;
}

export class BrowserPDFExtractor {
  private static readonly LEGAL_PATTERNS = {
    // Enhanced patterns for legal documents
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
    
    // Legal citations - enhanced
    citations: [
      /\b\d+\s+[A-Z][a-z]+\.?\s*(?:\d+[a-z]?|App\.?|Supp\.?)\s+\d+/g,
      /\b\d+\s+F\.?\s*(?:2d|3d)?\s+\d+/g,
      /\b\d+\s+S\.?\s*Ct\.?\s+\d+/g,
      /\b\d+\s+U\.S\.?\s+\d+/g
    ],
    
    // Monetary amounts
    amounts: [
      /\$[\d,]+(?:\.\d{2})?/g,
      /USD\s+[\d,]+(?:\.\d{2})?/g,
      /(?:dollars?|USD)\s+[\d,]+(?:\.\d{2})?/gi
    ]
  };

  /**
   * Main extraction method optimized for browser environment
   */
  static async extractText(file: File): Promise<string> {
    const result = await this.extract(file);
    return result.text;
  }

  /**
   * OCR fallback method
   */
  static async extractWithOCRFallback(file: File): Promise<string> {
    const result = await this.extractWithOCR(file);
    return result.text;
  }

  /**
   * Table extraction
   */
  static async extractTables(file: File): Promise<ExtractedTable[]> {
    const result = await this.extract(file);
    return result.tables;
  }

  /**
   * Reconfigure PDF.js (no-op since we don't use workers)
   */
  private static reconfigureWorker(): void {
    console.log('🔧 PDF.js reconfiguration requested (main-thread mode)');
  }

  /**
   * Main extraction method
   */
  static async extract(file: File): Promise<ExtractionResult> {
    console.log(`🚀 Starting browser PDF extraction for: ${file.name}`);
    
    try {
      // Analyze PDF characteristics
      const characteristics = await this.analyzePDF(file);
      
      // Route to appropriate extraction method
      if (characteristics.isScanned) {
        return await this.extractWithOCR(file);
      } else if (characteristics.hasTables) {
        return await this.extractWithEnhancedPDFJS(file);
      } else {
        return await this.extractWithPDFJS(file);
      }
      
    } catch (error) {
      console.error('PDF extraction failed:', error);
      
      // If it's a worker error, try to reconfigure and retry once
      if (error instanceof Error && error.message.includes('worker')) {
        console.log('🔄 Worker error detected, attempting reconfiguration...');
        this.reconfigureWorker();
        
        try {
          // Wait a moment for worker reconfiguration
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Retry with basic extraction
          return await this.extractWithPDFJS(file);
        } catch (retryError) {
          console.error('Retry after worker reconfiguration failed:', retryError);
        }
      }
      
      return {
        text: `[Error extracting PDF: ${file.name}] - ${error instanceof Error ? error.message : 'Unknown error'}`,
        tables: [],
        entities: [],
        metadata: { fileName: file.name, fileSize: file.size },
        method: 'pdfjs-browser',
        confidence: 0
      };
    }
  }

  /**
   * Analyze PDF to determine best extraction method
   */
  private static async analyzePDF(file: File): Promise<{
    isScanned: boolean;
    hasTables: boolean;
    pageCount: number;
    hasComplexLayout: boolean;
  }> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
        verbosity: 0 // Reduce console noise
      });
      const pdf = await loadingTask.promise;
      
      let isScanned = true;
      let hasTables = false;
      
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
        
        page.cleanup();
      }
      
      const pageCount = pdf.numPages;
      pdf.destroy();
      
      console.log(`📊 PDF Analysis: Pages=${pageCount}, Scanned=${isScanned}, Tables=${hasTables}`);
      
      return { isScanned, hasTables, pageCount, hasComplexLayout: false };
    } catch (error) {
      console.warn('PDF analysis failed:', error);
      return { isScanned: false, hasTables: false, pageCount: 0, hasComplexLayout: false };
    }
  }

  /**
   * Extract with enhanced PDF.js
   */
  private static async extractWithEnhancedPDFJS(file: File): Promise<ExtractionResult> {
    console.log('📄 Using enhanced PDF.js extraction...');
    
    const result = await this.extractWithPDFJS(file);
    
    // Enhance with better legal entity extraction
    result.entities = await this.extractLegalEntities(result.text);
    result.method = 'enhanced-browser';
    result.confidence = Math.min(result.confidence + 0.1, 1.0);
    
    return result;
  }

  /**
   * Basic PDF.js extraction
   */
  private static async extractWithPDFJS(file: File): Promise<ExtractionResult> {
    console.log('📄 Using PDF.js extraction...');
    
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
      verbosity: 0
    });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    const entities: ExtractedEntity[] = [];
    const tables: ExtractedTable[] = [];
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += `\n--- Page ${pageNum} ---\n${pageText}`;
      page.cleanup();
    }
    
    const metadata = await this.extractMetadata(file);
    pdf.destroy();
    
    return {
      text: this.cleanExtractedText(fullText),
      tables,
      entities,
      metadata,
      method: 'pdfjs-browser',
      confidence: 0.85
    };
  }

  /**
   * OCR extraction for scanned PDFs
   */
  private static async extractWithOCR(file: File): Promise<ExtractionResult> {
    console.log('🔍 Using Tesseract.js OCR extraction...');
    
    try {
      // Convert PDF pages to images and run OCR
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
        verbosity: 0
      });
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      
      // Process first 10 pages (to avoid browser performance issues)
      const pagesToProcess = Math.min(10, pdf.numPages);
      
      for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });
        
        // Create canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Render page
        await page.render({
          canvasContext: context,
          viewport: viewport,
          canvas: canvas
        }).promise;
        
        // Run OCR
        const imageData = canvas.toDataURL('image/png');
        const { data: { text } } = await Tesseract.recognize(imageData, 'eng', {
          logger: m => {
            if (m.status === 'recognizing text') {
              console.log(`OCR Progress page ${pageNum}: ${Math.round(m.progress * 100)}%`);
            }
          }
        });
        
        fullText += `\n--- Page ${pageNum} ---\n${text}`;
        page.cleanup();
      }
      
      if (pagesToProcess < pdf.numPages) {
        fullText += `\n\n[Note: Only processed ${pagesToProcess} of ${pdf.numPages} pages for performance]`;
      }
      
      const metadata = await this.extractMetadata(file);
      pdf.destroy();
      
      return {
        text: this.cleanExtractedText(fullText),
        tables: [],
        entities: await this.extractLegalEntities(fullText),
        metadata,
        method: 'tesseract-browser',
        confidence: 0.75
      };
      
    } catch (error) {
      console.error('OCR extraction failed:', error);
      throw error;
    }
  }

  /**
   * Extract legal entities with enhanced patterns
   */
  private static async extractLegalEntities(text: string): Promise<ExtractedEntity[]> {
    const entities: ExtractedEntity[] = [];
    
    // Extract case numbers
    for (const pattern of this.LEGAL_PATTERNS.caseNumbers) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const caseNumber = match[1].trim();
        if (caseNumber.length >= 3 && caseNumber.length <= 20) {
          entities.push({
            type: 'legal_citation',
            value: `Case No. ${caseNumber}`,
            context: this.getContext(text, match[0]),
            pageNumber: 1
          });
        }
      }
    }
    
    // Extract legal parties
    for (const pattern of this.LEGAL_PATTERNS.parties) {
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
    
    // Extract legal citations
    for (const pattern of this.LEGAL_PATTERNS.citations) {
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
    for (const pattern of this.LEGAL_PATTERNS.amounts) {
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
    
    // Remove duplicates
    const unique = entities.filter((entity, index, self) => 
      index === self.findIndex(e => e.type === entity.type && e.value === entity.value)
    );
    
    console.log(`✅ Browser entity extraction found ${unique.length} legal entities`);
    return unique;
  }

  /**
   * Get context around matched text
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
   * Extract metadata
   */
  private static async extractMetadata(file: File): Promise<any> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
        verbosity: 0
      });
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
   * Check if file is PDF
   */
  static isPDF(file: File): boolean {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  }
}

// Export as PDFTextExtractor for compatibility
export const PDFTextExtractor = BrowserPDFExtractor;