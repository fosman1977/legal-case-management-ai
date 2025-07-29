// Import PDF.js
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker - use CDN for simplicity
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export class PDFTextExtractor {
  /**
   * Extract text content from a PDF file
   * @param file - The PDF file to extract text from
   * @returns Promise<string> - The extracted text content
   */
  static async extractText(file: File): Promise<string> {
    try {
      console.log(`📄 Starting PDF text extraction for: ${file.name}`);
      
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        // Disable streaming for better compatibility
        isEvalSupported: false,
        disableFontFace: true,
        disableRange: true,
        disableStream: true,
        // Configure standard fonts to prevent warnings
        standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`
      });
      
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      console.log(`📋 PDF has ${numPages} pages`);
      
      let fullText = '';
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Combine text items into a single string
          const pageText = textContent.items
            .filter(item => 'str' in item) // Filter out non-text items
            .map(item => (item as any).str)
            .join(' ');
          
          fullText += `\n\n--- Page ${pageNum} ---\n${pageText}`;
          
          console.log(`📄 Extracted ${pageText.length} characters from page ${pageNum}`);
          
          // Clean up page resources
          page.cleanup();
          
        } catch (pageError) {
          console.warn(`⚠️ Failed to extract text from page ${pageNum}:`, pageError);
          fullText += `\n\n--- Page ${pageNum} ---\n[Error extracting text from this page]`;
        }
      }
      
      // Clean up document resources
      pdf.destroy();
      
      console.log(`✅ PDF extraction complete: ${fullText.length} total characters from ${file.name}`);
      
      return fullText.trim();
      
    } catch (error) {
      console.error(`❌ PDF extraction failed for ${file.name}:`, error);
      
      // Return basic file info if extraction fails
      return `[PDF File: ${file.name}, Size: ${Math.round(file.size / 1024)}KB - Text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}]`;
    }
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