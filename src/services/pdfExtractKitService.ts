/**
 * PDF-Extract-Kit Service
 * Integrates advanced PDF extraction capabilities
 */

import { 
  ExtractedDocument, 
  ExtractedTable, 
  ExtractedImage, 
  ExtractedFormula,
  DocumentLayout,
  ExtractionOptions 
} from '../types/extractedDocument';

export class PDFExtractKitService {
  private apiUrl: string;
  private timeout: number;
  private retryAttempts: number;

  constructor(
    apiUrl: string = process.env.REACT_APP_PDF_EXTRACT_KIT_URL || 'http://localhost:8001',
    timeout: number = 60000,
    retryAttempts: number = 3
  ) {
    this.apiUrl = apiUrl;
    this.timeout = timeout;
    this.retryAttempts = retryAttempts;
  }

  /**
   * Check if service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      const data = await response.json();
      return data.status === 'healthy' && data.models_loaded;
    } catch (error) {
      console.error('PDF-Extract-Kit health check failed:', error);
      return false;
    }
  }

  /**
   * Extract content from PDF document
   */
  async extractDocument(
    pdfFile: File | ArrayBuffer,
    options: ExtractionOptions = {}
  ): Promise<ExtractedDocument> {
    const defaultOptions: ExtractionOptions = {
      extractText: true,
      extractTables: true,
      extractImages: true,
      extractFormulas: true,
      outputFormat: 'json',
      ...options
    };

    // Convert to File if ArrayBuffer
    const file = pdfFile instanceof File 
      ? pdfFile 
      : new File([pdfFile], 'document.pdf', { type: 'application/pdf' });

    // Prepare form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('extract_text', String(defaultOptions.extractText));
    formData.append('extract_tables', String(defaultOptions.extractTables));
    formData.append('extract_images', String(defaultOptions.extractImages));
    formData.append('extract_formulas', String(defaultOptions.extractFormulas));
    formData.append('output_format', defaultOptions.outputFormat || 'json');

    // Make request with retry logic
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`🔄 PDF-Extract-Kit: Attempt ${attempt}/${this.retryAttempts}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(`${this.apiUrl}/extract`, {
          method: 'POST',
          body: formData,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Extraction failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        
        // Process and validate result
        return this.processExtractionResult(result);
        
      } catch (error) {
        lastError = error as Error;
        console.error(`Attempt ${attempt} failed:`, error);
        
        if (attempt < this.retryAttempts) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    // All attempts failed
    throw lastError || new Error('PDF extraction failed after all retry attempts');
  }

  /**
   * Process and validate extraction result
   */
  private processExtractionResult(rawResult: any): ExtractedDocument {
    // Validate and transform the result
    const document: ExtractedDocument = {
      text: rawResult.text || '',
      layout: this.processLayout(rawResult.layout),
      tables: this.processTables(rawResult.tables || []),
      images: this.processImages(rawResult.images || []),
      formulas: this.processFormulas(rawResult.formulas || []),
      metadata: {
        totalPages: rawResult.metadata?.totalPages || 0,
        totalTables: rawResult.metadata?.totalTables || 0,
        totalImages: rawResult.metadata?.totalImages || 0,
        totalFormulas: rawResult.metadata?.totalFormulas || 0,
        textLength: rawResult.metadata?.textLength || 0,
        extractionTime: new Date().toISOString()
      },
      entities: {
        persons: [],
        issues: [],
        chronologyEvents: [],
        authorities: []
      }
    };

    return document;
  }

  /**
   * Process layout information
   */
  private processLayout(rawLayout: any): DocumentLayout {
    if (!rawLayout || !rawLayout.pages) {
      return { pages: [], structure: [] };
    }

    return {
      pages: rawLayout.pages.map((page: any) => ({
        pageNumber: page.pageNumber || 0,
        width: page.width || 0,
        height: page.height || 0,
        elements: (page.elements || []).map((elem: any) => ({
          type: elem.type || 'text',
          bbox: elem.bbox || [0, 0, 0, 0],
          content: elem.content || '',
          confidence: elem.confidence || 0
        }))
      })),
      structure: this.buildDocumentStructure(rawLayout.pages)
    };
  }

  /**
   * Build document structure tree
   */
  private buildDocumentStructure(pages: any[]): any[] {
    const structure: any[] = [];
    
    for (const page of pages) {
      const pageNode = {
        type: 'page',
        pageNumber: page.pageNumber,
        children: []
      };

      // Group elements by type and position
      const titles = page.elements.filter((e: any) => e.type === 'title');
      const headers = page.elements.filter((e: any) => e.type === 'header');
      const text = page.elements.filter((e: any) => e.type === 'text');

      // Build hierarchical structure
      for (const title of titles) {
        const titleNode = {
          type: 'section',
          title: title.content,
          children: []
        };

        // Find related content
        const relatedHeaders = headers.filter((h: any) => 
          h.bbox[1] > title.bbox[1] && h.bbox[1] < title.bbox[1] + 500
        );

        for (const header of relatedHeaders) {
          const headerNode = {
            type: 'subsection',
            title: header.content,
            content: []
          };

          // Find text under this header
          const relatedText = text.filter((t: any) =>
            t.bbox[1] > header.bbox[1] && t.bbox[1] < header.bbox[1] + 300
          );

          headerNode.content = relatedText.map((t: any) => t.content);
          titleNode.children.push(headerNode);
        }

        pageNode.children.push(titleNode);
      }

      structure.push(pageNode);
    }

    return structure;
  }

  /**
   * Process extracted tables
   */
  private processTables(rawTables: any[]): ExtractedTable[] {
    return rawTables.map((table, index) => ({
      id: table.id || `table_${index}`,
      pageNumber: table.pageNumber || 0,
      bbox: table.bbox || [0, 0, 0, 0],
      html: table.html || '',
      markdown: table.markdown || '',
      data: table.data || [],
      headers: table.headers || [],
      confidence: table.confidence || 0,
      rows: table.data?.length || 0,
      columns: table.headers?.length || 0
    }));
  }

  /**
   * Process extracted images
   */
  private processImages(rawImages: any[]): ExtractedImage[] {
    return rawImages.map((image, index) => ({
      id: image.id || `image_${index}`,
      pageNumber: image.pageNumber || 0,
      bbox: image.bbox || [0, 0, 0, 0],
      base64: image.base64 || '',
      caption: image.caption || '',
      type: this.classifyImageType(image),
      confidence: image.confidence || 0,
      width: image.bbox ? image.bbox[2] - image.bbox[0] : 0,
      height: image.bbox ? image.bbox[3] - image.bbox[1] : 0
    }));
  }

  /**
   * Classify image type based on context
   */
  private classifyImageType(image: any): 'photo' | 'diagram' | 'chart' | 'signature' | 'logo' {
    // Simple heuristics for image classification
    const width = image.bbox ? image.bbox[2] - image.bbox[0] : 0;
    const height = image.bbox ? image.bbox[3] - image.bbox[1] : 0;
    const aspectRatio = width / height;

    if (aspectRatio > 3 && height < 100) return 'signature';
    if (width < 200 && height < 200) return 'logo';
    if (image.caption?.toLowerCase().includes('chart') || 
        image.caption?.toLowerCase().includes('graph')) return 'chart';
    if (image.caption?.toLowerCase().includes('diagram') ||
        image.caption?.toLowerCase().includes('figure')) return 'diagram';
    
    return 'photo';
  }

  /**
   * Process extracted formulas
   */
  private processFormulas(rawFormulas: any[]): ExtractedFormula[] {
    return rawFormulas.map((formula, index) => ({
      id: formula.id || `formula_${index}`,
      pageNumber: formula.pageNumber || 0,
      bbox: formula.bbox || [0, 0, 0, 0],
      type: formula.type || 'inline',
      latex: formula.latex || '',
      rendered: formula.rendered || '',
      context: formula.context || '',
      confidence: formula.confidence || 0
    }));
  }

  /**
   * Extract text with structure preservation
   */
  async extractStructuredText(pdfFile: File | ArrayBuffer): Promise<string> {
    const result = await this.extractDocument(pdfFile, {
      extractText: true,
      extractTables: false,
      extractImages: false,
      extractFormulas: false
    });

    return this.buildStructuredText(result.layout);
  }

  /**
   * Build structured text from layout
   */
  private buildStructuredText(layout: DocumentLayout): string {
    let structuredText = '';

    for (const page of layout.pages) {
      structuredText += `\n--- Page ${page.pageNumber} ---\n\n`;

      // Sort elements by vertical position
      const sortedElements = page.elements.sort((a, b) => {
        if (Math.abs(a.bbox[1] - b.bbox[1]) < 10) {
          return a.bbox[0] - b.bbox[0]; // Same line, sort by x
        }
        return a.bbox[1] - b.bbox[1]; // Sort by y
      });

      for (const element of sortedElements) {
        switch (element.type) {
          case 'title':
            structuredText += `\n# ${element.content}\n\n`;
            break;
          case 'header':
            structuredText += `\n## ${element.content}\n\n`;
            break;
          case 'text':
            structuredText += `${element.content} `;
            break;
          case 'table':
            structuredText += `\n[TABLE: ${element.content}]\n\n`;
            break;
          case 'formula':
            structuredText += ` [FORMULA: ${element.content}] `;
            break;
          case 'footer':
            structuredText += `\n---\n${element.content}\n---\n`;
            break;
        }
      }
    }

    return structuredText.trim();
  }

  /**
   * Extract tables as CSV
   */
  async extractTablesAsCSV(pdfFile: File | ArrayBuffer): Promise<string[]> {
    const result = await this.extractDocument(pdfFile, {
      extractText: false,
      extractTables: true,
      extractImages: false,
      extractFormulas: false
    });

    return result.tables.map(table => {
      const csv: string[] = [];
      
      // Add headers
      if (table.headers.length > 0) {
        csv.push(table.headers.join(','));
      }

      // Add data rows
      for (const row of table.data) {
        csv.push(row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(','));
      }

      return csv.join('\n');
    });
  }
}

// Export singleton instance
export const pdfExtractKitService = new PDFExtractKitService();
export default pdfExtractKitService;