// Import PDF.js and Tesseract for OCR
import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

// Configure PDF.js worker - v5 with proper version handling
if (typeof pdfjsLib !== 'undefined' && pdfjsLib.version) {
  try {
    const version = pdfjsLib.version;
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
    console.log(`PDF.js worker configured for version ${version}`);
  } catch (error) {
    console.warn('Failed to set PDF.js worker from CDN, using local fallback');
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  }
} else {
  console.warn('PDF.js version not detected, using fallback worker');
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

// Enhanced text extraction interfaces
interface TextItem {
  str: string;
  dir: string;
  width: number;
  height: number;
  transform: number[];
  fontName?: string;
  hasEOL?: boolean;
}

interface EnhancedTextContent {
  items: TextItem[];
  styles: any;
}

export class PDFTextExtractor {
  /**
   * Extract text content from a PDF file with enhanced layout preservation
   * @param file - The PDF file to extract text from
   * @returns Promise<string> - The extracted text content with better formatting
   */
  static async extractText(file: File): Promise<string> {
    console.log(`📄 Starting enhanced PDF text extraction for: ${file.name}`);
    
    // Try multiple extraction methods in order of preference
    const extractionMethods = [
      () => this.extractWithLayoutPreservation(file),
      () => this.extractWithBasicMethod(file),
      () => this.extractWithFallback(file)
    ];
    
    for (let i = 0; i < extractionMethods.length; i++) {
      try {
        const result = await extractionMethods[i]();
        if (result && result.length > 100) { // Ensure we got meaningful content
          console.log(`✅ PDF extraction successful using method ${i + 1}: ${result.length} characters`);
          return result;
        }
      } catch (error) {
        console.warn(`⚠️ PDF extraction method ${i + 1} failed:`, error);
      }
    }
    
    // If all methods fail, return basic file info
    return `[PDF File: ${file.name}, Size: ${Math.round(file.size / 1024)}KB - All extraction methods failed. This may be a scanned PDF or corrupted file.]`;
  }

  /**
   * Enhanced extraction with layout preservation
   */
  private static async extractWithLayoutPreservation(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      isEvalSupported: false,
      disableFontFace: false, // Enable fonts for better text extraction
      disableRange: false,    // Enable range requests for better performance
      disableStream: false,   // Enable streaming for large PDFs
      standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
      verbosity: 0 // Reduce console noise
    });
    
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    console.log(`📋 Enhanced extraction: PDF has ${numPages} pages`);
    
    let fullText = '';
    
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.0 });
        const textContent = await page.getTextContent() as EnhancedTextContent;
        
        // Sort text items by position (top to bottom, left to right)
        const sortedItems = textContent.items
          .filter(item => item.str && item.str.trim())
          .sort((a, b) => {
            const yDiff = b.transform[5] - a.transform[5]; // Y position (inverted)
            if (Math.abs(yDiff) < 5) { // Same line tolerance
              return a.transform[4] - b.transform[4]; // X position
            }
            return yDiff > 0 ? 1 : -1;
          });
        
        // Group items into lines based on Y position
        const lines: TextItem[][] = [];
        let currentLine: TextItem[] = [];
        let lastY = -1;
        
        for (const item of sortedItems) {
          const currentY = Math.round(item.transform[5]);
          
          if (lastY !== -1 && Math.abs(currentY - lastY) > 5) {
            // New line detected
            if (currentLine.length > 0) {
              lines.push([...currentLine]);
              currentLine = [];
            }
          }
          
          currentLine.push(item);
          lastY = currentY;
        }
        
        if (currentLine.length > 0) {
          lines.push(currentLine);
        }
        
        // Convert lines to text with proper spacing
        let pageText = '';
        for (const line of lines) {
          // Sort items in line by X position
          const sortedLine = line.sort((a, b) => a.transform[4] - b.transform[4]);
          
          let lineText = '';
          let lastX = -1;
          
          for (let i = 0; i < sortedLine.length; i++) {
            const item = sortedLine[i];
            const currentX = item.transform[4];
            
            // Add appropriate spacing based on position gap
            if (lastX !== -1) {
              const gap = currentX - lastX;
              if (gap > 20) {
                lineText += '   '; // Large gap = multiple spaces
              } else if (gap > 5) {
                lineText += ' '; // Small gap = single space
              }
            }
            
            lineText += item.str;
            lastX = currentX + item.width;
          }
          
          lineText = lineText.replace(/\s+/g, ' ').trim();
          
          if (lineText) {
            pageText += lineText + '\n';
          }
        }
        
        // Add page content with better formatting
        if (pageText.trim()) {
          const cleanPageText = this.cleanPageText(pageText);
          fullText += pageNum === 1 ? cleanPageText : `\n\n--- Page ${pageNum} ---\n${cleanPageText}`;
        }
        
        console.log(`📄 Enhanced: Extracted ${pageText.length} characters from page ${pageNum}`);
        
        page.cleanup();
        
      } catch (pageError) {
        console.warn(`⚠️ Enhanced extraction failed for page ${pageNum}:`, pageError);
        throw pageError; // Re-throw to try next method
      }
    }
    
    pdf.destroy();
    return this.cleanExtractedText(fullText);
  }

  /**
   * Basic extraction method (fallback)
   */
  private static async extractWithBasicMethod(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      isEvalSupported: false,
      disableFontFace: true
    });
    
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    let fullText = '';
    
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .filter(item => 'str' in item)
        .map(item => (item as any).str)
        .join(' ');
      
      fullText += `\n\n--- Page ${pageNum} ---\n${pageText}`;
      page.cleanup();
    }
    
    pdf.destroy();
    return this.cleanExtractedText(fullText);
  }

  /**
   * Last resort fallback extraction
   */
  private static async extractWithFallback(file: File): Promise<string> {
    // Try to read the file as text (for text-based PDFs)
    const text = await file.text();
    if (text && text.length > 100) {
      return this.cleanExtractedText(text);
    }
    
    throw new Error('No text content could be extracted');
  }

  /**
   * Clean and normalize page text
   */
  private static cleanPageText(text: string): string {
    return text
      // Fix common PDF text extraction issues
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase
      .replace(/(\w)([([])/g, '$1 $2') // Space before brackets
      .replace(/([)\]])(\w)/g, '$1 $2') // Space after brackets
      // Clean up hyphenation and line breaks
      .replace(/-\n/g, '') // Remove hyphen line breaks
      .replace(/\n([a-z])/g, ' $1') // Join broken words
      // Normalize spacing
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Clean and normalize extracted text
   */
  private static cleanExtractedText(text: string): string {
    return text
      // Remove page separators from final text
      .replace(/--- Page \d+ ---\n/g, '\n')
      // Remove excessive whitespace
      .replace(/[ \t]{2,}/g, ' ')
      // Normalize line breaks
      .replace(/\n{3,}/g, '\n\n')
      // Remove page break artifacts
      .replace(/[\u000C\u2028\u2029]/g, '\n')
      // Fix common PDF extraction artifacts
      .replace(/([.!?])\s*([A-Z])/g, '$1 $2') // Ensure space after sentence endings
      .replace(/(\w)([.!?])([A-Z])/g, '$1$2 $3') // Space after punctuation
      // Remove redundant spaces
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Check if a file is a PDF
   * @param file - The file to check
   * @returns boolean - True if the file is a PDF
   */
  static isPDF(file: File): boolean {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  }

  /**
   * Detect if a PDF might be scanned (image-based) by checking text density
   */
  static async isLikelyScannedPDF(file: File): Promise<boolean> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      // Check first few pages for text content
      const pagesToCheck = Math.min(3, pdf.numPages);
      let totalTextLength = 0;
      let totalPages = 0;
      
      for (let pageNum = 1; pageNum <= pagesToCheck; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          const pageText = textContent.items
            .filter(item => 'str' in item)
            .map(item => (item as any).str)
            .join('');
          
          totalTextLength += pageText.length;
          totalPages++;
          
          page.cleanup();
        } catch (error) {
          console.warn(`Failed to check page ${pageNum} for text content:`, error);
        }
      }
      
      pdf.destroy();
      
      // If average text per page is very low, it's likely scanned
      const avgTextPerPage = totalTextLength / totalPages;
      const isScanned = avgTextPerPage < 50; // Less than 50 characters per page
      
      console.log(`📊 PDF text density analysis: ${avgTextPerPage.toFixed(1)} chars/page - ${isScanned ? 'Likely scanned' : 'Text-based'}`);
      
      return isScanned;
    } catch (error) {
      console.warn('Failed to analyze PDF text density:', error);
      return false; // Assume text-based if check fails
    }
  }

  /**
   * Advanced extraction with OCR fallback for scanned PDFs
   */
  static async extractWithOCRFallback(file: File): Promise<string> {
    // First try regular extraction
    try {
      const regularText = await this.extractText(file);
      
      // Check if we got meaningful content
      if (regularText.length > 200 && !regularText.includes('All extraction methods failed')) {
        return regularText;
      }
    } catch (error) {
      console.warn('Regular PDF extraction failed, checking if OCR is needed:', error);
    }
    
    // Check if it's likely a scanned PDF
    const isScanned = await this.isLikelyScannedPDF(file);
    
    if (isScanned) {
      console.log('📸 Detected scanned PDF - attempting OCR extraction');
      
      try {
        return await this.extractWithOCR(file);
      } catch (ocrError) {
        console.error('OCR extraction failed:', ocrError);
        return `[Scanned PDF: ${file.name}] - This appears to be a scanned PDF. Text extraction failed. Original error: ${ocrError instanceof Error ? ocrError.message : 'Unknown OCR error'}`;
      }
    }
    
    // If not scanned but still failed, return standard error message
    return `[PDF File: ${file.name}, Size: ${Math.round(file.size / 1024)}KB - Text extraction failed. The PDF may be corrupted or use unsupported features.]`;
  }

  /**
   * Extract text using OCR for scanned PDFs
   */
  private static async extractWithOCR(file: File): Promise<string> {
    console.log('🔍 Starting OCR extraction for scanned PDF...');
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      
      let fullText = '';
      
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR
          
          // Create canvas to render PDF page
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d')!;
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          // Render PDF page to canvas
          const renderContext = {
            canvasContext: context,
            viewport: viewport,
            canvas: canvas
          };
          
          await page.render(renderContext).promise;
          
          // Convert canvas to image data for OCR
          const imageData = canvas.toDataURL('image/png');
          
          console.log(`📸 Running OCR on page ${pageNum}/${numPages}...`);
          
          // Run Tesseract OCR
          const { data: { text } } = await Tesseract.recognize(
            imageData,
            'eng',
            {
              logger: m => {
                if (m.status === 'recognizing text') {
                  console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
                }
              }
            }
          );
          
          if (text && text.trim()) {
            const cleanedText = this.cleanPageText(text);
            fullText += pageNum === 1 ? cleanedText : `\n\n--- Page ${pageNum} ---\n${cleanedText}`;
            console.log(`✅ OCR extracted ${text.length} characters from page ${pageNum}`);
          }
          
          page.cleanup();
          
        } catch (pageError) {
          console.warn(`⚠️ OCR failed for page ${pageNum}:`, pageError);
          fullText += `\n\n--- Page ${pageNum} ---\n[OCR extraction failed for this page]\n`;
        }
      }
      
      pdf.destroy();
      
      if (fullText.trim()) {
        console.log(`✅ OCR extraction completed: ${fullText.length} characters total`);
        return this.cleanExtractedText(fullText);
      } else {
        throw new Error('OCR extracted no readable text');
      }
      
    } catch (error) {
      console.error('OCR extraction failed:', error);
      throw new Error(`OCR extraction failed: ${error instanceof Error ? error.message : 'Unknown OCR error'}`);
    }
  }

  /**
   * Extract metadata from a PDF file
   * @param file - The PDF file
   * @returns Promise<object> - PDF metadata
   */
  static async extractMetadata(file: File): Promise<any> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`
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
        pages: pdf.numPages
      };
    } catch (error) {
      console.warn('Failed to extract PDF metadata:', error);
      return {
        title: file.name,
        author: 'Unknown',
        subject: '',
        creator: '',
        producer: '',
        creationDate: null,
        modificationDate: null,
        pages: 0
      };
    }
  }
}