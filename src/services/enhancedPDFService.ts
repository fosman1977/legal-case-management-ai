/**
 * Enhanced PDF Service with Auto-Setup PDF-Extract-Kit
 * Seamlessly integrates advanced PDF extraction with fallback support
 */

import { ExtractedDocument, ExtractionOptions, ExtractionStatus } from '../types/extractedDocument';
import { EntityExtractionResult } from '../utils/unifiedAIClient';
import { multiEngineProcessor } from '../utils/multiEngineProcessor';

export interface PDFProcessingResult {
  success: boolean;
  document?: ExtractedDocument;
  extractedText: string;
  entities: EntityExtractionResult;
  extractionMethod: 'enhanced' | 'basic' | 'fallback';
  processingTime: number;
  error?: string;
  warnings?: string[];
}

export class EnhancedPDFService {
  private serviceUrl = 'http://localhost:8001';
  private serviceStatus: 'unknown' | 'starting' | 'ready' | 'unavailable' = 'unknown';
  private setupAttempted = false;
  private statusListeners: Array<(status: string) => void> = [];

  constructor() {
    this.checkServiceStatus();
  }

  /**
   * Subscribe to service status changes
   */
  onStatusChange(callback: (status: string) => void) {
    this.statusListeners.push(callback);
    callback(this.serviceStatus); // Send current status immediately
  }

  /**
   * Get current service capabilities
   */
  getCapabilities(): {
    advancedExtraction: boolean;
    tableExtraction: boolean;
    imageExtraction: boolean;
    formulaExtraction: boolean;
    layoutAnalysis: boolean;
  } {
    const isEnhanced = this.serviceStatus === 'ready';
    return {
      advancedExtraction: isEnhanced,
      tableExtraction: isEnhanced,
      imageExtraction: isEnhanced,
      formulaExtraction: isEnhanced,
      layoutAnalysis: isEnhanced
    };
  }

  /**
   * Process PDF with automatic service setup
   */
  async processPDF(
    file: File,
    options: ExtractionOptions = {}
  ): Promise<PDFProcessingResult> {
    const startTime = Date.now();
    
    try {
      // Auto-setup service if needed
      await this.ensureServiceReady();
      
      // Try enhanced extraction first
      if (this.serviceStatus === 'ready') {
        try {
          return await this.processWithEnhancedExtraction(file, options, startTime);
        } catch (error) {
          console.warn('Enhanced extraction failed, falling back to basic:', error);
          return await this.processWithBasicExtraction(file, startTime, ['Enhanced extraction failed']);
        }
      } else {
        // Use basic extraction
        return await this.processWithBasicExtraction(file, startTime);
      }
      
    } catch (error) {
      return {
        success: false,
        extractedText: '',
        entities: { persons: [], issues: [], chronologyEvents: [], authorities: [] },
        extractionMethod: 'fallback',
        processingTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * Enhanced extraction using PDF-Extract-Kit
   */
  private async processWithEnhancedExtraction(
    file: File, 
    options: ExtractionOptions,
    startTime: number
  ): Promise<PDFProcessingResult> {
    // Prepare form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('extract_text', String(options.extractText ?? true));
    formData.append('extract_tables', String(options.extractTables ?? true));
    formData.append('extract_images', String(options.extractImages ?? true));
    formData.append('extract_formulas', String(options.extractFormulas ?? true));

    // Make request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(`${this.serviceUrl}/extract`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const extractionResult = await response.json();
      
      // Build enhanced text for entity extraction
      const enhancedText = this.buildEnhancedText(extractionResult);
      
      // Run 8-engine entity extraction on enhanced text
      const entities = await multiEngineProcessor.processDocument(enhancedText, {
        requiredAccuracy: 'high',
        documentType: 'legal',
        maxProcessingTime: 30000
      });

      // Merge table entities
      const tableEntities = this.extractEntitiesFromTables(extractionResult.tables || []);
      const mergedEntities = this.mergeEntityResults(entities, tableEntities);

      // Build final document
      const document: ExtractedDocument = {
        text: enhancedText,
        entities: mergedEntities,
        layout: extractionResult.layout || { pages: [], structure: [] },
        tables: extractionResult.tables || [],
        images: extractionResult.images || [],
        formulas: extractionResult.formulas || [],
        metadata: {
          ...extractionResult.metadata,
          extractionTime: new Date().toISOString(),
          processingTime: Date.now() - startTime
        }
      };

      return {
        success: true,
        document,
        extractedText: enhancedText,
        entities: mergedEntities,
        extractionMethod: 'enhanced',
        processingTime: Date.now() - startTime
      };

    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Basic extraction using existing system
   */
  private async processWithBasicExtraction(
    file: File, 
    startTime: number,
    warnings: string[] = []
  ): Promise<PDFProcessingResult> {
    
    // Convert file to text using existing method
    const text = await this.extractTextFromPDF(file);
    
    // Run 8-engine entity extraction
    const entities = await multiEngineProcessor.processDocument(text, {
      requiredAccuracy: 'standard',
      documentType: 'legal',
      maxProcessingTime: 20000
    });

    return {
      success: true,
      extractedText: text,
      entities,
      extractionMethod: 'basic',
      processingTime: Date.now() - startTime,
      warnings
    };
  }

  /**
   * Extract text from PDF using basic methods
   */
  private async extractTextFromPDF(file: File): Promise<string> {
    try {
      // Use existing PDF.js or similar basic extraction
      const arrayBuffer = await file.arrayBuffer();
      
      // Import PDF.js dynamically and configure worker
      const pdfjsLib = await import('pdfjs-dist');
      
      // Configure worker for PDF.js
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        console.log('🔧 Configuring PDF.js worker...');
        try {
          // Use local worker to avoid CSP issues
          pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
          console.log('✅ PDF.js worker configured with local file');
        } catch (error) {
          console.warn('Worker configuration failed, disabling worker:', error);
          pdfjsLib.GlobalWorkerOptions.workerSrc = '';
        }
      }
      
      console.log(`🔧 Using PDF.js worker: ${pdfjsLib.GlobalWorkerOptions.workerSrc || 'main thread'}`);
      
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        text += pageText + '\n';
      }
      
      console.log(`✅ PDF text extraction completed: ${text.length} characters`);
      return text;
    } catch (error) {
      console.error('Basic PDF extraction failed:', error);
      console.error('Error details:', {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack
      });
      
      // Return a more informative error message
      return `PDF extraction failed: ${(error as Error).message}`;
    }
  }

  /**
   * Ensure PDF-Extract-Kit service is ready
   */
  private async ensureServiceReady(): Promise<void> {
    if (this.serviceStatus === 'ready') {
      return;
    }

    if (this.serviceStatus === 'starting') {
      // Wait for startup to complete
      await this.waitForServiceReady();
      return;
    }

    if (!this.setupAttempted) {
      this.setupAttempted = true;
      await this.attemptServiceSetup();
    }
  }

  /**
   * Check if service is running
   */
  private async checkServiceStatus(): Promise<void> {
    try {
      const response = await fetch(`${this.serviceUrl}/health`, {
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        const data = await response.json();
        this.updateStatus(data.models_loaded ? 'ready' : 'starting');
      } else {
        this.updateStatus('unavailable');
      }
    } catch (error) {
      this.updateStatus('unavailable');
    }
  }

  /**
   * Attempt to start the service automatically
   */
  private async attemptServiceSetup(): Promise<void> {
    this.updateStatus('starting');
    
    try {
      // Try to start the service using our auto-setup
      const setupResponse = await fetch('/api/setup-pdf-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoStart: true })
      });

      if (setupResponse.ok) {
        // Wait for service to be ready
        await this.waitForServiceReady();
      } else {
        this.updateStatus('unavailable');
      }
    } catch (error) {
      console.warn('Auto-setup failed:', error);
      this.updateStatus('unavailable');
    }
  }

  /**
   * Wait for service to become ready
   */
  private async waitForServiceReady(maxWaitTime = 30000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        const response = await fetch(`${this.serviceUrl}/health`, {
          signal: AbortSignal.timeout(2000)
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.models_loaded) {
            this.updateStatus('ready');
            return;
          }
        }
      } catch (error) {
        // Continue waiting
      }
    }
    
    // Timeout
    this.updateStatus('unavailable');
  }

  /**
   * Update service status and notify listeners
   */
  private updateStatus(status: typeof this.serviceStatus): void {
    if (this.serviceStatus !== status) {
      this.serviceStatus = status;
      this.statusListeners.forEach(listener => listener(status));
    }
  }

  /**
   * Build enhanced text from extraction result
   */
  private buildEnhancedText(extractionResult: any): string {
    let enhancedText = extractionResult.text || '';
    
    // Add table content as structured text
    if (extractionResult.tables) {
      for (const table of extractionResult.tables) {
        enhancedText += `\n\n[TABLE on page ${table.pageNumber}]:\n`;
        if (table.headers?.length) {
          enhancedText += table.headers.join(' | ') + '\n';
        }
        if (table.data?.length) {
          for (const row of table.data.slice(0, 10)) { // Limit rows
            enhancedText += row.join(' | ') + '\n';
          }
        }
      }
    }

    // Add formula content
    if (extractionResult.formulas) {
      for (const formula of extractionResult.formulas) {
        enhancedText += ` [FORMULA: ${formula.latex}] `;
      }
    }

    return enhancedText;
  }

  /**
   * Extract entities from tables
   */
  private extractEntitiesFromTables(tables: any[]): EntityExtractionResult {
    const entities: EntityExtractionResult = {
      persons: [],
      issues: [],
      chronologyEvents: [],
      authorities: []
    };

    for (const table of tables) {
      // Look for date columns
      const dateColumnIndex = table.headers?.findIndex((h: string) => 
        /date|time|when/i.test(h)
      ) ?? -1;

      if (dateColumnIndex >= 0 && table.data) {
        for (const row of table.data) {
          if (row[dateColumnIndex]) {
            entities.chronologyEvents.push({
              date: row[dateColumnIndex],
              event: `Table entry: ${row.join(' ')}`,
              confidence: 0.85
            });
          }
        }
      }

      // Look for person names
      const nameColumnIndex = table.headers?.findIndex((h: string) =>
        /name|person|party|witness/i.test(h)
      ) ?? -1;

      if (nameColumnIndex >= 0 && table.data) {
        for (const row of table.data) {
          if (row[nameColumnIndex]) {
            entities.persons.push({
              name: row[nameColumnIndex],
              role: 'Table Entry',
              confidence: 0.80
            });
          }
        }
      }
    }

    return entities;
  }

  /**
   * Merge entity results from multiple sources
   */
  private mergeEntityResults(...results: EntityExtractionResult[]): EntityExtractionResult {
    const merged: EntityExtractionResult = {
      persons: [],
      issues: [],
      chronologyEvents: [],
      authorities: []
    };

    for (const result of results) {
      merged.persons.push(...result.persons);
      merged.issues.push(...result.issues);
      merged.chronologyEvents.push(...result.chronologyEvents);
      merged.authorities.push(...result.authorities);
    }

    // Simple deduplication by name/content
    merged.persons = this.deduplicateBy(merged.persons, 'name');
    merged.issues = this.deduplicateBy(merged.issues, 'issue');
    merged.chronologyEvents = this.deduplicateBy(merged.chronologyEvents, 'date');
    merged.authorities = this.deduplicateBy(merged.authorities, 'citation');

    return merged;
  }

  private deduplicateBy<T>(array: T[], key: keyof T): T[] {
    const seen = new Set();
    return array.filter(item => {
      const value = String(item[key]).toLowerCase().trim();
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  }
}

// Export singleton instance
export const enhancedPDFService = new EnhancedPDFService();
export default enhancedPDFService;