// Fixed PDF extraction with proper worker configuration
import * as pdfjsLib from 'pdfjs-dist';

// Properly configure PDF.js worker for browser environment  
if (typeof pdfjsLib !== 'undefined') {
  // Use local worker file to avoid CSP issues
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

interface ExtractedEntity {
  type: 'person' | 'organization' | 'date' | 'location' | 'legal_citation' | 'monetary_amount';
  value: string;
  context: string;
  pageNumber: number;
}

interface ExtractionResult {
  text: string;
  entities: ExtractedEntity[];
  metadata: any;
  method: string;
  confidence: number;
  pages: number;
}

export class FixedPDFExtractor {
  private static readonly LEGAL_PATTERNS = {
    caseNumber: /\b(?:Case\s*(?:No\.?|Number)|Docket\s*(?:No\.?|Number))[:\s]*([A-Z0-9\-\/]+)/gi,
    legalCitation: /\b\d+\s+[A-Z][a-z]+\.?\s*(?:\d+[a-z]?|App\.?|Supp\.?)\s+\d+/g,
    monetaryAmount: /\$[\d,]+(?:\.\d{2})?|\£[\d,]+(?:\.\d{2})?/g,
    dates: /\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b|\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
    parties: /(?:Plaintiff|Defendant|Appellant|Respondent)[s]?\s*:?\s*([A-Z][A-Za-z\s,.'&\-]{2,50})/gi
  };

  /**
   * Main extraction method - simplified and robust
   */
  static async extract(file: File): Promise<ExtractionResult> {
    console.log(`🚀 Starting PDF extraction for: ${file.name}`);
    
    if (!this.isPDF(file)) {
      throw new Error('File is not a PDF');
    }

    try {
      // Primary method: PDF.js with proper configuration
      return await this.extractWithPDFJS(file);
    } catch (error) {
      console.warn('PDF.js extraction failed:', error);
      
      try {
        // Fallback: Simple binary text extraction
        return await this.extractWithBinaryParsing(file);
      } catch (fallbackError) {
        console.error('All extraction methods failed:', fallbackError);
        
        // Final fallback: Return structured error with minimal info
        return {
          text: `PDF extraction failed for ${file.name}. The file may be encrypted, corrupted, or use unsupported encoding.`,
          entities: [],
          metadata: { 
            title: file.name, 
            fileName: file.name, 
            fileSize: file.size,
            error: 'Extraction failed'
          },
          method: 'error-fallback',
          confidence: 0,
          pages: 0
        };
      }
    }
  }

  /**
   * Extract using PDF.js with proper error handling
   */
  private static async extractWithPDFJS(file: File): Promise<ExtractionResult> {
    console.log('📄 Using PDF.js for extraction...');
    
    const arrayBuffer = await file.arrayBuffer();
    
    // Proper PDF.js configuration
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      verbosity: 0, // Reduce console noise
      disableWorker: false, // Allow worker to work properly
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true
    });
    
    const pdf = await loadingTask.promise;
    let fullText = '';
    const allEntities: ExtractedEntity[] = [];
    
    console.log(`📊 Processing ${pdf.numPages} pages...`);
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Extract text with better formatting preservation
        const pageText = textContent.items
          .map((item: any) => {
            // Handle different item types
            if (item.str) {
              return item.str;
            }
            return '';
          })
          .join(' ');
        
        if (pageText.trim()) {
          fullText += `\n--- Page ${pageNum} ---\n${pageText}`;
          
          // Extract entities from this page
          const pageEntities = this.extractLegalEntities(pageText, pageNum);
          allEntities.push(...pageEntities);
        }
        
        // Clean up page resources
        page.cleanup();
        
      } catch (pageError) {
        console.warn(`Failed to process page ${pageNum}:`, pageError);
        fullText += `\n--- Page ${pageNum} ---\n[Page extraction failed]`;
      }
    }
    
    // Get metadata
    let metadata = { title: file.name, fileName: file.name, fileSize: file.size };
    try {
      const pdfMetadata = await pdf.getMetadata();
      metadata = {
        ...metadata,
        title: pdfMetadata.info?.Title || file.name,
        author: pdfMetadata.info?.Author || 'Unknown',
        subject: pdfMetadata.info?.Subject || '',
        pages: pdf.numPages
      };
    } catch (metaError) {
      console.warn('Metadata extraction failed:', metaError);
    }
    
    // Clean up PDF resources
    pdf.destroy();
    
    const cleanedText = this.cleanExtractedText(fullText);
    
    return {
      text: cleanedText,
      entities: allEntities,
      metadata,
      method: 'pdfjs',
      confidence: cleanedText.length > 100 ? 0.85 : 0.4,
      pages: pdf.numPages
    };
  }

  /**
   * Binary parsing fallback method
   */
  private static async extractWithBinaryParsing(file: File): Promise<ExtractionResult> {
    console.log('🔍 Using binary parsing fallback...');
    
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const pdfString = new TextDecoder('latin1').decode(uint8Array);
    
    // Extract text using multiple strategies
    const extractedTexts: string[] = [];
    
    // Strategy 1: Text in parentheses (most common)
    const parenMatches = pdfString.match(/\(([^)]{3,})\)/g) || [];
    parenMatches.forEach(match => {
      const text = match.slice(1, -1)
        .replace(/\\[0-7]{3}/g, '') // Remove octal escapes
        .replace(/\\[nrtbf()\\]/g, ' '); // Replace escape sequences
      
      if (this.isReadableText(text)) {
        extractedTexts.push(text);
      }
    });
    
    // Strategy 2: Text in angle brackets
    const bracketMatches = pdfString.match(/<([^>]{3,})>/g) || [];
    bracketMatches.forEach(match => {
      const text = match.slice(1, -1);
      if (this.isReadableText(text)) {
        extractedTexts.push(text);
      }
    });
    
    // Strategy 3: Direct text patterns
    const directMatches = pdfString.match(/\b[A-Z][a-z]{2,}(?:\s+[A-Z]?[a-z]+)*\b/g) || [];
    const filteredDirect = directMatches.filter(text => 
      text.length > 3 && 
      text.length < 100 && 
      /[a-zA-Z]/.test(text) &&
      !text.match(/^[A-Z]{4,}$/) // Avoid all-caps noise
    );
    
    extractedTexts.push(...filteredDirect);
    
    const fullText = extractedTexts.join(' ').replace(/\s+/g, ' ').trim();
    
    if (fullText.length < 50) {
      throw new Error('No readable text found in PDF');
    }
    
    const entities = this.extractLegalEntities(fullText, 1);
    
    return {
      text: fullText,
      entities,
      metadata: { 
        title: file.name, 
        fileName: file.name, 
        fileSize: file.size,
        extractionMethod: 'binary-parsing'
      },
      method: 'binary-parsing',
      confidence: 0.6,
      pages: 1
    };
  }

  /**
   * Check if text contains readable content
   */
  private static isReadableText(text: string): boolean {
    if (!text || text.length < 3) return false;
    
    // Check for reasonable ratio of letters to total characters
    const letterCount = (text.match(/[a-zA-Z]/g) || []).length;
    const ratio = letterCount / text.length;
    
    // Must have at least 60% letters and some common words
    return ratio > 0.6 && /\b(the|and|or|of|in|to|for|with)\b/i.test(text);
  }

  /**
   * Extract legal entities from text
   */
  private static extractLegalEntities(text: string, pageNumber: number): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    
    // Extract case numbers
    let match;
    const casePattern = this.LEGAL_PATTERNS.caseNumber;
    while ((match = casePattern.exec(text)) !== null) {
      entities.push({
        type: 'legal_citation',
        value: match[0],
        context: this.getContext(text, match[0]),
        pageNumber
      });
    }
    
    // Extract monetary amounts
    const amounts = text.match(this.LEGAL_PATTERNS.monetaryAmount) || [];
    amounts.forEach(amount => {
      entities.push({
        type: 'monetary_amount',
        value: amount,
        context: this.getContext(text, amount),
        pageNumber
      });
    });
    
    // Extract dates
    const dates = text.match(this.LEGAL_PATTERNS.dates) || [];
    dates.forEach(date => {
      entities.push({
        type: 'date',
        value: date,
        context: this.getContext(text, date),
        pageNumber
      });
    });
    
    // Extract legal citations
    const citations = text.match(this.LEGAL_PATTERNS.legalCitation) || [];
    citations.forEach(citation => {
      entities.push({
        type: 'legal_citation',
        value: citation,
        context: this.getContext(text, citation),
        pageNumber
      });
    });
    
    return entities;
  }

  /**
   * Get context around a matched entity
   */
  private static getContext(text: string, match: string, contextLength: number = 50): string {
    const index = text.indexOf(match);
    if (index === -1) return match;
    
    const start = Math.max(0, index - contextLength);
    const end = Math.min(text.length, index + match.length + contextLength);
    
    return text.substring(start, end).replace(/\s+/g, ' ').trim();
  }

  /**
   * Clean extracted text
   */
  private static cleanExtractedText(text: string): string {
    return text
      .replace(/--- Page \d+ ---\n/g, '\n')
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Check if file is PDF
   */
  static isPDF(file: File): boolean {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  }

  /**
   * Simple interface for backward compatibility
   */
  static async extractText(file: File): Promise<string> {
    const result = await this.extract(file);
    return result.text;
  }
}