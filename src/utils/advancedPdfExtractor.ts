// Enhanced PDF extractor for large legal documents
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export interface ExtractionProgress {
  currentPage: number;
  totalPages: number;
  extractedText: string;
  status: 'processing' | 'completed' | 'error';
  error?: string;
}

export interface ExtractionOptions {
  chunkSize?: number; // Process pages in chunks
  preserveFormatting?: boolean; // Try to preserve document structure
  extractImages?: boolean; // Extract image descriptions
  maxFileSize?: number; // Max file size in MB
  onProgress?: (progress: ExtractionProgress) => void;
}

export class AdvancedPDFExtractor {
  
  /**
   * Extract text from large legal documents with progress tracking
   */
  static async extractTextAdvanced(
    file: File, 
    options: ExtractionOptions = {}
  ): Promise<string> {
    const {
      chunkSize = 5, // Process 5 pages at a time
      preserveFormatting = true,
      maxFileSize = 100, // 100MB limit
      onProgress
    } = options;

    try {
      // File size check
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxFileSize) {
        throw new Error(`File too large: ${fileSizeMB.toFixed(1)}MB. Maximum: ${maxFileSize}MB`);
      }

      console.log(`📄 Advanced PDF extraction for: ${file.name} (${fileSizeMB.toFixed(1)}MB)`);
      
      // Load PDF with optimized settings for large files
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        isEvalSupported: false,
        disableFontFace: true,
        disableRange: false, // Enable range requests for large files
        disableStream: false, // Enable streaming for large files
        standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
        // Memory management
        maxImageSize: 1024 * 1024, // 1MB max per image
        cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
        cMapPacked: true
      }).promise;

      const numPages = pdf.numPages;
      console.log(`📋 Processing ${numPages} pages in chunks of ${chunkSize}`);

      let fullText = '';
      // let structuredContent: any[] = []; // Reserved for future structured extraction

      // Process pages in chunks to manage memory
      for (let startPage = 1; startPage <= numPages; startPage += chunkSize) {
        const endPage = Math.min(startPage + chunkSize - 1, numPages);
        
        console.log(`🔄 Processing pages ${startPage}-${endPage}...`);
        
        const chunkText = await this.processPageChunk(
          pdf, 
          startPage, 
          endPage, 
          preserveFormatting
        );
        
        fullText += chunkText;
        
        // Report progress
        if (onProgress) {
          onProgress({
            currentPage: endPage,
            totalPages: numPages,
            extractedText: fullText,
            status: endPage === numPages ? 'completed' : 'processing'
          });
        }

        // Small delay to prevent blocking
        if (endPage < numPages) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      // Clean up
      pdf.destroy();

      console.log(`✅ Advanced extraction complete: ${fullText.length} characters`);
      return this.postProcessText(fullText);

    } catch (error) {
      console.error('❌ Advanced PDF extraction failed:', error);
      
      if (onProgress) {
        onProgress({
          currentPage: 0,
          totalPages: 0,
          extractedText: '',
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      throw error;
    }
  }

  /**
   * Process a chunk of pages
   */
  private static async processPageChunk(
    pdf: any,
    startPage: number,
    endPage: number,
    preserveFormatting: boolean
  ): Promise<string> {
    let chunkText = '';

    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const pageText = await this.extractPageText(page, pageNum, preserveFormatting);
        chunkText += pageText;
        
        // Clean up page resources immediately
        page.cleanup();
        
      } catch (pageError) {
        console.warn(`⚠️ Failed to extract page ${pageNum}:`, pageError);
        chunkText += `\n\n--- Page ${pageNum} ---\n[Error: ${pageError instanceof Error ? pageError.message : 'Unknown error'}]\n`;
      }
    }

    return chunkText;
  }

  /**
   * Extract text from a single page with formatting preservation
   */
  private static async extractPageText(
    page: any,
    pageNum: number,
    preserveFormatting: boolean
  ): Promise<string> {
    const textContent = await page.getTextContent();
    
    if (!preserveFormatting) {
      // Simple text extraction
      const pageText = textContent.items
        .filter((item: any) => 'str' in item)
        .map((item: any) => item.str)
        .join(' ');
      
      return `\n\n--- Page ${pageNum} ---\n${pageText}`;
    }

    // Advanced formatting preservation
    return this.extractFormattedText(textContent, pageNum);
  }

  /**
   * Extract text while preserving document structure
   */
  private static extractFormattedText(textContent: any, pageNum: number): string {
    let pageText = `\n\n--- Page ${pageNum} ---\n`;
    let currentLine = '';
    let lastY = null;
    let lastFontSize = null;

    for (const item of textContent.items) {
      if (!('str' in item)) continue;

      const text = item.str;
      const y = item.transform[5]; // Y coordinate
      const fontSize = item.transform[0]; // Font size

      // Detect new lines based on Y coordinate
      if (lastY !== null && Math.abs(y - lastY) > 5) {
        if (currentLine.trim()) {
          pageText += currentLine.trim() + '\n';
        }
        currentLine = '';
      }

      // Detect headings based on font size
      if (lastFontSize !== null && fontSize > lastFontSize * 1.2) {
        if (currentLine.trim()) {
          pageText += '\n' + currentLine.trim() + '\n';
        }
        currentLine = `## ${text} `;
      } else {
        currentLine += text + ' ';
      }

      lastY = y;
      lastFontSize = fontSize;
    }

    // Add remaining text
    if (currentLine.trim()) {
      pageText += currentLine.trim() + '\n';
    }

    return pageText;
  }

  /**
   * Post-process extracted text for legal documents
   */
  private static postProcessText(text: string): string {
    return text
      // Fix common PDF extraction issues
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add spaces between camelCase
      .replace(/(\d+)([A-Z])/g, '$1 $2') // Add spaces between numbers and letters
      .replace(/([.!?])([A-Z])/g, '$1 $2') // Add spaces after sentences
      // Clean up multiple spaces and line breaks
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Preserve legal document structure
      .replace(/\b(WHEREAS|THEREFORE|IN WITNESS WHEREOF|PARTIES|BACKGROUND)\b/g, '\n\n$1')
      .replace(/\b(\d+\.)\s/g, '\n$1 ') // Number lists
      .replace(/\b([a-z])\)\s/g, '\n  $1) ') // Letter lists
      .trim();
  }

  /**
   * Extract text with OCR fallback for scanned documents
   */
  static async extractWithOCR(file: File, options: ExtractionOptions = {}): Promise<string> {
    try {
      // First try regular text extraction
      const text = await this.extractTextAdvanced(file, options);
      
      // Check if extraction was successful (enough text found)
      const wordCount = text.split(/\s+/).length;
      if (wordCount > 50) {
        return text;
      }

      console.log('⚠️ Low text content detected, document may be scanned');
      
      // TODO: Implement OCR fallback using Tesseract.js
      // For now, return extracted text with warning
      return `[WARNING: This appears to be a scanned document with limited extractable text.]\n\n${text}`;
      
    } catch (error) {
      console.error('Extraction failed:', error);
      throw error;
    }
  }

  /**
   * Check if file is suitable for processing
   */
  static async validateFile(file: File): Promise<{valid: boolean, issues: string[]}> {
    const issues: string[] = [];
    
    // Check file type
    if (!this.isPDF(file)) {
      issues.push('File is not a PDF');
    }
    
    // Check file size (100MB limit)
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > 100) {
      issues.push(`File too large: ${sizeMB.toFixed(1)}MB (max 100MB)`);
    }
    
    // Check if file is empty
    if (file.size === 0) {
      issues.push('File is empty');
    }

    try {
      // Quick PDF validation
      const arrayBuffer = await file.arrayBuffer();
      await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    } catch (error) {
      issues.push('File appears to be corrupted or not a valid PDF');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Check if a file is a PDF
   */
  static isPDF(file: File): boolean {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  }
}