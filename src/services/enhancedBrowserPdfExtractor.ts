/**
 * ENHANCED PDF EXTRACTION SYSTEM
 * Drop-in replacement that fixes worker issues and adds advanced features
 */

import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
import { getAirGapConfig, isAirGapMode } from '../config/airgap-config';

// Fix worker issues with multiple fallback strategies
const configurePDFWorker = (): void => {
  
  if (isAirGapMode()) {
    console.log('🔒 AIR-GAP MODE: Configuring PDF.js for offline operation');
  } else {
    console.log('🔧 Configuring PDF.js worker with fallback strategies...');
  }
  
  try {
    // Simple and reliable: use the bundled worker from public folder
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    console.log('✅ Using bundled PDF.js worker from public folder');
  } catch (error) {
    console.error('Failed to set PDF.js worker:', error);
    
    // Last resort fallback - try CDN if not in air-gap mode
    try {
      if (!isAirGapMode()) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.54/pdf.worker.min.mjs`;
        console.log('✅ Fallback: Using CDN worker (not air-gap mode)');
      } else {
        throw new Error('Air-gap mode: Cannot use external CDN worker');
      }
    } catch (cdnError) {
      console.error('All PDF.js worker configurations failed:', cdnError);
      throw new Error('Cannot configure PDF.js worker. Please ensure pdf.worker.min.mjs is available.');
    }
  }
};

// Enhanced interfaces with legal document specifics
interface ExtractedTable {
  pageNumber: number;
  headers: string[];
  rows: string[][];
  markdown: string;
  confidence: number;
  type?: 'financial' | 'schedule' | 'comparison' | 'general';
}

interface ExtractedEntity {
  type: 'person' | 'organization' | 'date' | 'location' | 'legal_citation' | 
        'monetary_amount' | 'case_number' | 'statute' | 'regulation' | 
        'court' | 'judge' | 'solicitor' | 'barrister';
  value: string;
  normalizedValue?: string;
  context: string;
  pageNumber: number;
  confidence: number;
}

interface ExtractedSection {
  title: string;
  content: string;
  level: number;
  pageStart: number;
  pageEnd: number;
  type?: 'heading' | 'paragraph' | 'list' | 'quote' | 'footnote';
}

interface ExtractionQuality {
  overall: number;
  textQuality: number;
  structureQuality: number;
  ocrQuality?: number;
  warnings: string[];
  suggestions: string[];
}

interface ExtractionResult {
  text: string;
  sections: ExtractedSection[];
  tables: ExtractedTable[];
  entities: ExtractedEntity[];
  metadata: any;
  structure: {
    headings: string[];
    paragraphs: number;
    pageBreaks: number[];
  };
  quality: ExtractionQuality;
  method: 'native' | 'ocr' | 'hybrid';
  processingTime: number;
  // Legal document specific
  legalMetadata?: {
    caseNumber?: string;
    court?: string;
    parties?: string[];
    date?: string;
    documentType?: string;
  };
}

export class EnhancedBrowserPDFExtractor {
  private static initialized = false;
  
  // Enhanced legal patterns with UK and US support
  private static readonly LEGAL_PATTERNS = {
    // UK Case Numbers
    ukCaseNumbers: [
      /\[(\d{4})\]\s+[A-Z]+\s+\d+/g, // [2024] EWHC 123
      /\[(\d{4})\]\s+UKSC\s+\d+/g,    // [2024] UKSC 45
      /\[(\d{4})\]\s+EWCA\s+(?:Civ|Crim)\s+\d+/g, // [2024] EWCA Civ 789
    ],
    
    // Legal parties with role detection
    parties: [
      /(?:Claimant|Plaintiff)[s]?\s*:?\s*([A-Z][A-Za-z\s,.'&\-()]+?)(?=\n|Defendant|Respondent|$)/gis,
      /(?:Defendant|Respondent)[s]?\s*:?\s*([A-Z][A-Za-z\s,.'&\-()]+?)(?=\n|Claimant|Plaintiff|$)/gis,
      /Between\s+([A-Z][A-Za-z\s,.'&\-()]+?)\s+(?:and|AND|v\.?|vs?\.?)\s+([A-Z][A-Za-z\s,.'&\-()]+)/gis,
    ],
    
    // Courts and Judges
    courts: [
      /(?:High\s+Court|Crown\s+Court|County\s+Court|Supreme\s+Court|Court\s+of\s+Appeal)/gi,
      /(?:Chancery\s+Division|Queen's\s+Bench|Family\s+Division|Commercial\s+Court)/gi,
    ],
    
    judges: [
      /(?:Mr\s+Justice|Mrs\s+Justice|Lord\s+Justice|Lady\s+Justice)\s+([A-Z][a-z]+)/g,
      /(?:Judge|District\s+Judge|Deputy\s+District\s+Judge)\s+([A-Z][a-z]+)/g,
    ],
    
    // Financial amounts with currency
    amounts: [
      /(?:£|GBP|USD|\$|EUR|€)\s?([\d,]+(?:\.\d{2})?)/g,
      /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:pounds?|dollars?|euros?)/gi,
    ],
    
    // Dates with context
    dates: [
      /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi,
      /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/g,
      /(\d{4})-(\d{2})-(\d{2})/g,
    ],
  };

  /**
   * Initialize system (auto-called on first use)
   */
  private static initialize(): void {
    if (this.initialized) return;
    
    console.log('🚀 Initializing Enhanced PDF Extractor...');
    
    // Configure PDF.js worker
    configurePDFWorker();
    
    this.initialized = true;
    console.log('✅ Enhanced PDF Extractor ready');
  }

  /**
   * Main extraction method - backward compatible
   */
  static async extractText(file: File): Promise<string> {
    const result = await this.extract(file);
    return result.text;
  }

  /**
   * OCR fallback - backward compatible
   */
  static async extractWithOCRFallback(file: File): Promise<string> {
    const result = await this.extract(file, { forceOCR: true });
    return result.text;
  }

  /**
   * Table extraction - backward compatible
   */
  static async extractTables(file: File): Promise<ExtractedTable[]> {
    const result = await this.extract(file);
    return result.tables;
  }

  /**
   * Enhanced extraction with all features
   */
  static async extract(
    file: File, 
    options: {
      forceOCR?: boolean;
      extractTables?: boolean;
      extractEntities?: boolean;
      maxPages?: number;
    } = {}
  ): Promise<ExtractionResult> {
    const startTime = Date.now();
    
    // Auto-initialize
    this.initialize();
    
    console.log(`📄 Processing: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    
    try {
      // Verify worker configuration before processing
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        console.warn('⚠️ PDF.js worker not configured, re-initializing...');
        this.initialize();
        
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          throw new Error('PDF.js worker configuration failed. Please check that pdf.worker.min.mjs is accessible.');
        }
      }
      
      // Load PDF with browser-compatible options
      const arrayBuffer = await file.arrayBuffer();
      
      console.log(`🔧 Using PDF.js worker: ${pdfjsLib.GlobalWorkerOptions.workerSrc}`);
      
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
        verbosity: 0,
      });
      
      const pdf = await loadingTask.promise;
      
      // Choose extraction strategy
      let result: ExtractionResult;
      
      if (options.forceOCR) {
        result = await this.extractWithOCR(pdf, file, options.maxPages);
      } else {
        result = await this.extractWithNative(pdf, file, options.maxPages);
      }
      
      // Enhance with legal analysis
      if (options.extractEntities !== false) {
        result.entities = await this.extractLegalEntities(result.text, pdf.numPages);
        result.legalMetadata = this.extractLegalMetadata(result.entities, result.text);
      }
      
      // Extract tables if needed
      if (options.extractTables !== false) {
        result.tables = await this.extractBasicTables(pdf);
      }
      
      // Assess quality
      result.quality = this.assessQuality(result);
      
      // Cleanup
      pdf.destroy();
      
      result.processingTime = Date.now() - startTime;
      console.log(`✅ Extraction complete in ${result.processingTime}ms`);
      
      return result;
      
    } catch (error) {
      console.error('Extraction failed:', error);
      return this.createErrorResult(file, error, Date.now() - startTime);
    }
  }

  /**
   * Native PDF text extraction
   */
  private static async extractWithNative(
    pdf: any, 
    file: File, 
    maxPages?: number
  ): Promise<ExtractionResult> {
    console.log('📝 Using enhanced native text extraction...');
    
    const sections: ExtractedSection[] = [];
    const allText: string[] = [];
    const pageBreaks: number[] = [];
    
    const pagesToProcess = Math.min(maxPages || pdf.numPages, pdf.numPages);
    
    for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Extract structured text
      const { text, structure } = this.extractStructuredText(textContent.items, pageNum);
      
      allText.push(text);
      sections.push(...structure);
      pageBreaks.push(allText.join('\n').length);
      
      page.cleanup();
      
      // Progress
      if (pageNum % 10 === 0) {
        console.log(`Processed ${pageNum}/${pagesToProcess} pages...`);
      }
    }
    
    return {
      text: this.cleanText(allText.join('\n\n')),
      sections,
      tables: [],
      entities: [],
      metadata: await this.extractMetadata(file, pdf),
      structure: {
        headings: sections.filter(s => s.type === 'heading').map(s => s.title),
        paragraphs: sections.filter(s => s.type === 'paragraph').length,
        pageBreaks,
      },
      quality: {
        overall: 0.9,
        textQuality: 0.95,
        structureQuality: 0.85,
        warnings: [],
        suggestions: [],
      },
      method: 'native',
      processingTime: 0,
    };
  }

  /**
   * OCR extraction for scanned documents
   */
  private static async extractWithOCR(
    pdf: any,
    file: File,
    maxPages?: number
  ): Promise<ExtractionResult> {
    const config = getAirGapConfig();
    
    if (config.FULLY_OFFLINE && !config.OCR.ENABLED) {
      console.warn('🔒 AIR-GAP MODE: OCR disabled - external model downloads not allowed');
      throw new Error('OCR not available in air-gap mode without pre-downloaded models');
    }
    
    console.log('🔍 Using OCR extraction...');
    
    const sections: ExtractedSection[] = [];
    const allText: string[] = [];
    const pageBreaks: number[] = [];
    
    const pagesToProcess = Math.min(maxPages || 5, pdf.numPages); // Limit for performance
    
    for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 }); // Higher res for better OCR
      
      // Render to canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;
      
      // Simple OCR using Tesseract
      try {
        const { data } = await Tesseract.recognize(canvas, 'eng', {
          logger: (m: any) => {
            if (m.status === 'recognizing text') {
              console.log(`OCR Page ${pageNum}: ${Math.round(m.progress * 100)}%`);
            }
          }
        });
        
        allText.push(data.text);
        sections.push({
          title: `Page ${pageNum}`,
          content: data.text,
          level: 0,
          pageStart: pageNum,
          pageEnd: pageNum,
          type: 'paragraph',
        });
        pageBreaks.push(allText.join('\n').length);
        
      } catch (ocrError) {
        console.warn(`OCR failed for page ${pageNum}:`, ocrError);
        allText.push(`[OCR failed for page ${pageNum}]`);
      }
      
      page.cleanup();
      console.log(`OCR processed page ${pageNum}/${pagesToProcess}`);
    }
    
    if (pagesToProcess < pdf.numPages) {
      allText.push(`\n[Note: OCR processed ${pagesToProcess} of ${pdf.numPages} pages for performance]`);
    }
    
    return {
      text: this.cleanText(allText.join('\n\n')),
      sections,
      tables: [],
      entities: [],
      metadata: await this.extractMetadata(file, pdf),
      structure: {
        headings: sections.filter(s => s.type === 'heading').map(s => s.title),
        paragraphs: sections.filter(s => s.type === 'paragraph').length,
        pageBreaks,
      },
      quality: {
        overall: 0.75,
        textQuality: 0.7,
        structureQuality: 0.6,
        ocrQuality: 0.8,
        warnings: pagesToProcess < pdf.numPages ? ['Partial OCR due to page limit'] : [],
        suggestions: ['Review OCR output for accuracy'],
      },
      method: 'ocr',
      processingTime: 0,
    };
  }

  /**
   * Extract structured text from PDF items
   */
  private static extractStructuredText(
    items: any[], 
    pageNum: number
  ): { text: string; structure: ExtractedSection[] } {
    const sections: ExtractedSection[] = [];
    const lines: string[] = [];
    
    if (!items.length) {
      return { text: '', structure: [] };
    }
    
    // Sort items by position
    items.sort((a, b) => {
      const yDiff = b.transform[5] - a.transform[5];
      if (Math.abs(yDiff) > 2) return yDiff;
      return a.transform[4] - b.transform[4];
    });
    
    // Group into lines and detect structure
    let currentLine = '';
    let lastY = items[0].transform[5];
    
    items.forEach((item) => {
      const y = item.transform[5];
      const fontSize = item.height || 12;
      
      // New line detection
      if (Math.abs(lastY - y) > fontSize * 0.5) {
        if (currentLine) {
          lines.push(currentLine);
          
          // Detect headings
          if (fontSize > 14 || currentLine.match(/^(SECTION|\d+\.|[IVX]+\.)/)) {
            sections.push({
              title: currentLine,
              content: '',
              level: fontSize > 16 ? 1 : fontSize > 14 ? 2 : 3,
              pageStart: pageNum,
              pageEnd: pageNum,
              type: 'heading',
            });
          }
        }
        currentLine = item.str;
        lastY = y;
      } else {
        currentLine += ' ' + item.str;
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return {
      text: lines.join('\n'),
      structure: sections,
    };
  }

  /**
   * Enhanced table extraction using layout analysis
   */
  private static async extractBasicTables(pdf: any): Promise<ExtractedTable[]> {
    const tables: ExtractedTable[] = [];
    const maxPagesToProcess = Math.min(pdf.numPages, 20); // Increased from 10
    
    console.log(`🔍 Starting enhanced table detection across ${maxPagesToProcess} pages...`);
    
    for (let pageNum = 1; pageNum <= maxPagesToProcess; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Enhanced table detection using layout analysis
        const pageTables = await this.extractTablesFromPage(textContent.items, pageNum);
        tables.push(...pageTables);
        
        page.cleanup();
        
        if (pageNum % 5 === 0) {
          console.log(`📊 Table detection: processed ${pageNum}/${maxPagesToProcess} pages, found ${tables.length} tables`);
        }
      } catch (error) {
        console.warn(`⚠️ Table extraction failed for page ${pageNum}:`, error);
      }
    }
    
    console.log(`✅ Enhanced table detection complete: found ${tables.length} tables`);
    return tables;
  }

  /**
   * Extract tables from a single page using advanced layout analysis
   */
  private static async extractTablesFromPage(items: any[], pageNum: number): Promise<ExtractedTable[]> {
    if (!items.length) return [];

    const tables: ExtractedTable[] = [];
    
    // Sort items by vertical position (top to bottom), then horizontal (left to right)
    const sortedItems = items.sort((a, b) => {
      const yDiff = b.transform[5] - a.transform[5]; // Y coordinate (inverted for PDF)
      if (Math.abs(yDiff) > 2) return yDiff;
      return a.transform[4] - b.transform[4]; // X coordinate
    });

    // Group items into rows based on Y coordinates
    const rows = this.groupItemsIntoRows(sortedItems);
    
    // Detect table regions
    const tableRegions = this.detectTableRegions(rows);
    
    // Extract structured tables from regions
    for (const region of tableRegions) {
      try {
        const table = this.extractStructuredTable(region, pageNum);
        if (table && table.headers.length > 1 && table.rows.length > 0) {
          tables.push(table);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to extract table from region on page ${pageNum}:`, error);
      }
    }
    
    return tables;
  }

  /**
   * Group text items into rows based on Y coordinates
   */
  private static groupItemsIntoRows(items: any[]): Array<{ y: number; items: any[] }> {
    const rows: Array<{ y: number; items: any[] }> = [];
    const tolerance = 3; // Pixels tolerance for same row
    
    for (const item of items) {
      const y = item.transform[5];
      let foundRow = false;
      
      // Find existing row or create new one
      for (const row of rows) {
        if (Math.abs(row.y - y) <= tolerance) {
          row.items.push(item);
          foundRow = true;
          break;
        }
      }
      
      if (!foundRow) {
        rows.push({ y, items: [item] });
      }
    }
    
    // Sort items within each row by X coordinate
    rows.forEach(row => {
      row.items.sort((a, b) => a.transform[4] - b.transform[4]);
    });
    
    return rows;
  }

  /**
   * Detect potential table regions using advanced heuristics
   */
  private static detectTableRegions(rows: Array<{ y: number; items: any[] }>): Array<Array<{ y: number; items: any[] }>> {
    const regions: Array<Array<{ y: number; items: any[] }>> = [];
    let currentRegion: Array<{ y: number; items: any[] }> = [];
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const isTableRow = this.isLikelyTableRow(row, rows, i);
      
      if (isTableRow) {
        currentRegion.push(row);
      } else {
        // End current region if it has enough rows to be a table
        if (currentRegion.length >= 2) {
          regions.push([...currentRegion]);
        }
        currentRegion = [];
      }
    }
    
    // Don't forget the last region
    if (currentRegion.length >= 2) {
      regions.push(currentRegion);
    }
    
    return regions.filter(region => region.length >= 2); // At least 2 rows (header + data)
  }

  /**
   * Determine if a row is likely part of a table
   */
  private static isLikelyTableRow(
    row: { y: number; items: any[] }, 
    allRows: Array<{ y: number; items: any[] }>, 
    index: number
  ): boolean {
    const items = row.items;
    
    // Must have multiple items (columns)
    if (items.length < 2) return false;
    
    // Check for consistent spacing patterns
    const spacings = [];
    for (let i = 1; i < items.length; i++) {
      const spacing = items[i].transform[4] - (items[i-1].transform[4] + (items[i-1].width || 0));
      spacings.push(spacing);
    }
    
    // Look for regular patterns in spacing
    const avgSpacing = spacings.reduce((a, b) => a + b, 0) / spacings.length;
    const regularSpacing = spacings.every(s => Math.abs(s - avgSpacing) < avgSpacing * 0.5);
    
    // Check for alignment with adjacent rows
    let alignmentScore = 0;
    const checkRange = 2; // Check 2 rows before and after
    
    for (let offset = -checkRange; offset <= checkRange; offset++) {
      const adjacentIndex = index + offset;
      if (adjacentIndex >= 0 && adjacentIndex < allRows.length && adjacentIndex !== index) {
        const adjacentRow = allRows[adjacentIndex];
        alignmentScore += this.calculateRowAlignment(row, adjacentRow);
      }
    }
    
    // Heuristics for table detection
    const hasMultipleColumns = items.length >= 2;
    const hasRegularSpacing = regularSpacing;
    const hasGoodAlignment = alignmentScore > 0.3;
    const hasNumericContent = items.some(item => /\d/.test(item.str));
    const hasShortCells = items.every(item => (item.str || '').length < 50);
    
    // Legal document specific patterns
    const hasLegalTableMarkers = items.some(item => 
      /^(claim|amount|date|party|£|\$|%|vs?\.?|and|or)$/i.test((item.str || '').trim())
    );
    
    return (hasMultipleColumns && hasShortCells) && 
           (hasRegularSpacing || hasGoodAlignment || hasNumericContent || hasLegalTableMarkers);
  }

  /**
   * Calculate alignment score between two rows
   */
  private static calculateRowAlignment(row1: { y: number; items: any[] }, row2: { y: number; items: any[] }): number {
    if (row1.items.length !== row2.items.length) return 0;
    
    let alignmentScore = 0;
    const tolerance = 10; // Pixels
    
    for (let i = 0; i < Math.min(row1.items.length, row2.items.length); i++) {
      const x1 = row1.items[i].transform[4];
      const x2 = row2.items[i].transform[4];
      
      if (Math.abs(x1 - x2) <= tolerance) {
        alignmentScore += 1;
      }
    }
    
    return alignmentScore / Math.max(row1.items.length, row2.items.length);
  }

  /**
   * Extract structured table from detected region
   */
  private static extractStructuredTable(
    region: Array<{ y: number; items: any[] }>, 
    pageNum: number
  ): ExtractedTable | null {
    if (region.length < 2) return null;
    
    try {
      // Determine column structure from all rows
      const columnPositions = this.determineColumnPositions(region);
      
      // Extract headers (assume first row is headers)
      const headerRow = region[0];
      const headers = this.extractCellsFromRow(headerRow, columnPositions);
      
      // Extract data rows
      const dataRows = region.slice(1);
      const rows = dataRows.map(row => this.extractCellsFromRow(row, columnPositions));
      
      // Filter out empty rows
      const validRows = rows.filter(row => row.some(cell => cell.trim().length > 0));
      
      if (headers.length === 0 || validRows.length === 0) return null;
      
      // Calculate confidence based on data quality
      const confidence = this.calculateTableConfidence(headers, validRows, region);
      
      return {
        pageNumber: pageNum,
        headers: headers.map(h => h.trim()),
        rows: validRows,
        markdown: this.tableToMarkdown(headers, validRows),
        confidence,
        type: this.detectAdvancedTableType(headers, validRows),
      };
      
    } catch (error) {
      console.warn('Failed to extract structured table:', error);
      return null;
    }
  }

  /**
   * Determine column positions across all rows in a region
   */
  private static determineColumnPositions(region: Array<{ y: number; items: any[] }>): number[] {
    const allPositions = new Set<number>();
    
    // Collect all X positions
    region.forEach(row => {
      row.items.forEach(item => {
        allPositions.add(Math.round(item.transform[4]));
      });
    });
    
    // Sort positions and merge nearby ones
    const sortedPositions = Array.from(allPositions).sort((a, b) => a - b);
    const mergedPositions = [];
    const mergeThreshold = 15; // Pixels
    
    let lastPos = sortedPositions[0];
    mergedPositions.push(lastPos);
    
    for (let i = 1; i < sortedPositions.length; i++) {
      const pos = sortedPositions[i];
      if (pos - lastPos > mergeThreshold) {
        mergedPositions.push(pos);
        lastPos = pos;
      }
    }
    
    return mergedPositions;
  }

  /**
   * Extract cell content from a row based on column positions
   */
  private static extractCellsFromRow(row: { y: number; items: any[] }, columnPositions: number[]): string[] {
    const cells = new Array(columnPositions.length).fill('');
    const tolerance = 20; // Pixels
    
    row.items.forEach(item => {
      const itemX = item.transform[4];
      
      // Find the best matching column
      let bestColumn = 0;
      let bestDistance = Math.abs(columnPositions[0] - itemX);
      
      for (let i = 1; i < columnPositions.length; i++) {
        const distance = Math.abs(columnPositions[i] - itemX);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestColumn = i;
        }
      }
      
      // Add content to the cell if within tolerance
      if (bestDistance <= tolerance) {
        const existingContent = cells[bestColumn];
        const newContent = (item.str || '').trim();
        
        if (newContent) {
          cells[bestColumn] = existingContent ? 
            (existingContent + ' ' + newContent) : 
            newContent;
        }
      }
    });
    
    return cells.map(cell => cell.trim());
  }

  /**
   * Calculate confidence score for extracted table
   */
  private static calculateTableConfidence(headers: string[], rows: string[][], region: any[]): number {
    let score = 0.5; // Base score
    
    // Header quality
    const validHeaders = headers.filter(h => h.length > 0 && h.length < 30);
    score += (validHeaders.length / headers.length) * 0.2;
    
    // Data consistency
    const consistentRowLengths = rows.every(row => 
      Math.abs(row.length - headers.length) <= 1
    );
    if (consistentRowLengths) score += 0.15;
    
    // Content quality
    const hasNumericData = rows.some(row => 
      row.some(cell => /\d/.test(cell))
    );
    if (hasNumericData) score += 0.1;
    
    // Legal document indicators
    const hasLegalContent = [...headers, ...rows.flat()].some(content =>
      /£|\$|claim|amount|date|court|case|party|vs?\.?/i.test(content)
    );
    if (hasLegalContent) score += 0.05;
    
    return Math.min(score, 1.0);
  }

  /**
   * Convert table to markdown
   */
  private static tableToMarkdown(headers: string[], rows: string[][]): string {
    let markdown = '| ' + headers.join(' | ') + ' |\n';
    markdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
    rows.forEach(row => {
      markdown += '| ' + row.join(' | ') + ' |\n';
    });
    return markdown;
  }

  /**
   * Enhanced table type detection with legal document specifics
   */
  private static detectAdvancedTableType(headers: string[], rows: string[][]): 'financial' | 'schedule' | 'comparison' | 'general' {
    const allContent = [...headers, ...rows.flat()].join(' ').toLowerCase();
    
    // Financial tables (common in legal documents)
    if (allContent.match(/amount|£|\$|€|price|cost|total|balance|damages|settlement|fee|expense|claim/)) {
      return 'financial';
    }
    
    // Schedule tables (case management, deadlines)
    if (allContent.match(/date|time|schedule|deadline|hearing|trial|disclosure|service|filing|due/)) {
      return 'schedule';
    }
    
    // Comparison tables (case law, precedents)
    if (allContent.match(/vs?\.?|versus|comparison|before|after|claimant|defendant|plaintiff|respondent|appellant/)) {
      return 'comparison';
    }
    
    // Legal-specific tables
    if (allContent.match(/case|court|judge|barrister|solicitor|witness|evidence|exhibit|bundle|page|para/)) {
      return 'comparison'; // Legal comparison/reference table
    }
    
    return 'general';
  }

  /**
   * Legacy table type detection for backward compatibility
   */
  private static detectTableType(headers: string[]): 'financial' | 'schedule' | 'comparison' | 'general' {
    // Use the enhanced method with empty rows for backward compatibility
    return this.detectAdvancedTableType(headers, []);
  }

  /**
   * Extract legal entities with enhanced patterns
   */
  private static async extractLegalEntities(
    text: string, 
    pageCount: number
  ): Promise<ExtractedEntity[]> {
    const entities: ExtractedEntity[] = [];
    const processedEntities = new Set<string>();
    
    // Helper to add unique entities
    const addEntity = (entity: ExtractedEntity) => {
      const key = `${entity.type}-${entity.value}`;
      if (!processedEntities.has(key)) {
        processedEntities.add(key);
        entities.push(entity);
      }
    };
    
    // Extract UK case numbers
    for (const pattern of this.LEGAL_PATTERNS.ukCaseNumbers) {
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(text)) !== null) {
        addEntity({
          type: 'case_number',
          value: match[0],
          normalizedValue: match[0].replace(/\s+/g, ' ').trim(),
          context: this.getContext(text, match.index, 50),
          pageNumber: this.estimatePage(match.index, text.length, pageCount),
          confidence: 0.95,
        });
      }
    }
    
    // Extract parties
    for (const pattern of this.LEGAL_PATTERNS.parties) {
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(text)) !== null) {
        if (match[1]) {
          const party = match[1].trim();
          if (party.length > 2 && party.length < 100) {
            addEntity({
              type: 'person',
              value: party,
              normalizedValue: this.normalizeName(party),
              context: this.getContext(text, match.index, 50),
              pageNumber: this.estimatePage(match.index, text.length, pageCount),
              confidence: 0.85,
            });
          }
        }
      }
    }
    
    // Extract courts
    for (const pattern of this.LEGAL_PATTERNS.courts) {
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(text)) !== null) {
        addEntity({
          type: 'court',
          value: match[0],
          context: this.getContext(text, match.index, 50),
          pageNumber: this.estimatePage(match.index, text.length, pageCount),
          confidence: 0.9,
        });
      }
    }
    
    // Extract monetary amounts
    for (const pattern of this.LEGAL_PATTERNS.amounts) {
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(text)) !== null) {
        addEntity({
          type: 'monetary_amount',
          value: match[0],
          normalizedValue: this.normalizeAmount(match[0]),
          context: this.getContext(text, match.index, 50),
          pageNumber: this.estimatePage(match.index, text.length, pageCount),
          confidence: 0.95,
        });
      }
    }
    
    console.log(`✅ Extracted ${entities.length} legal entities`);
    return entities;
  }

  /**
   * Extract legal metadata from entities
   */
  private static extractLegalMetadata(
    entities: ExtractedEntity[], 
    text: string
  ): any {
    const metadata: any = {};
    
    // Find case number
    const caseNumber = entities.find(e => e.type === 'case_number');
    if (caseNumber) {
      metadata.caseNumber = caseNumber.value;
    }
    
    // Find court
    const court = entities.find(e => e.type === 'court');
    if (court) {
      metadata.court = court.value;
    }
    
    // Find parties
    const parties = entities
      .filter(e => e.type === 'person')
      .slice(0, 5)
      .map(e => e.normalizedValue || e.value);
    if (parties.length) {
      metadata.parties = parties;
    }
    
    // Detect document type
    metadata.documentType = this.detectDocumentType(text);
    
    return metadata;
  }

  /**
   * Detect document type from content
   */
  private static detectDocumentType(text: string): string {
    const lower = text.toLowerCase().substring(0, 2000);
    
    if (lower.includes('witness statement')) return 'witness_statement';
    if (lower.includes('skeleton argument')) return 'skeleton_argument';
    if (lower.includes('particulars of claim')) return 'particulars_of_claim';
    if (lower.includes('defence')) return 'defence';
    if (lower.includes('judgment')) return 'judgment';
    if (lower.includes('order')) return 'order';
    if (lower.includes('bundle')) return 'bundle';
    if (lower.includes('expert report')) return 'expert_report';
    
    return 'legal_document';
  }

  /**
   * Normalize name
   */
  private static normalizeName(name: string): string {
    return name
      .replace(/\s+/g, ' ')
      .replace(/^(Mr|Mrs|Ms|Dr|Prof)\.?\s+/i, '')
      .trim();
  }

  /**
   * Normalize amount
   */
  private static normalizeAmount(amount: string): string {
    const cleaned = amount.replace(/[^\d.,]/g, '');
    const value = parseFloat(cleaned.replace(/,/g, ''));
    
    if (isNaN(value)) return amount;
    
    if (amount.includes('£') || amount.match(/GBP/i)) {
      return `£${value.toFixed(2)}`;
    }
    if (amount.includes('$') || amount.match(/USD/i)) {
      return `$${value.toFixed(2)}`;
    }
    if (amount.includes('€') || amount.match(/EUR/i)) {
      return `€${value.toFixed(2)}`;
    }
    
    return amount;
  }

  /**
   * Get context around position
   */
  private static getContext(text: string, index: number, length: number): string {
    const start = Math.max(0, index - length);
    const end = Math.min(text.length, index + length);
    return text
      .substring(start, end)
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Estimate page number from text position
   */
  private static estimatePage(index: number, textLength: number, pageCount: number): number {
    return Math.min(Math.ceil((index / textLength) * pageCount), pageCount) || 1;
  }

  /**
   * Assess extraction quality
   */
  private static assessQuality(result: ExtractionResult): ExtractionQuality {
    const quality: ExtractionQuality = {
      overall: 0,
      textQuality: 0,
      structureQuality: 0,
      warnings: [],
      suggestions: [],
    };
    
    // Assess text quality
    const words = result.text.split(/\s+/);
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
    
    if (avgWordLength < 2 || avgWordLength > 15) {
      quality.warnings.push('Unusual word length distribution');
      quality.textQuality = 0.6;
    } else {
      quality.textQuality = 0.9;
    }
    
    // Assess structure quality
    quality.structureQuality = result.sections.length > 0 ? 0.8 : 0.5;
    
    if (result.entities.length === 0) {
      quality.suggestions.push('No legal entities detected');
    }
    
    // Calculate overall
    quality.overall = (quality.textQuality + quality.structureQuality) / 2;
    
    if (result.method === 'ocr') {
      quality.ocrQuality = 0.75;
      quality.overall *= 0.9; // OCR penalty
    }
    
    return quality;
  }

  /**
   * Clean extracted text
   */
  private static cleanText(text: string): string {
    return text
      .replace(/\f/g, '\n') // Form feeds to newlines
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // Control characters
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/[ \t]{2,}/g, ' ') // Multiple spaces/tabs
      .replace(/\n{3,}/g, '\n\n') // Multiple newlines
      .replace(/^\s+|\s+$/gm, '') // Trim lines
      .trim();
  }

  /**
   * Extract enhanced metadata
   */
  private static async extractMetadata(file: File, pdf: any): Promise<any> {
    try {
      const metadata = await pdf.getMetadata();
      const info = metadata.info as any;
      
      return {
        title: info?.Title || file.name,
        author: info?.Author || 'Unknown',
        subject: info?.Subject || '',
        keywords: info?.Keywords || '',
        creator: info?.Creator || '',
        producer: info?.Producer || '',
        creationDate: info?.CreationDate || null,
        modificationDate: info?.ModDate || null,
        pages: pdf.numPages,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        // Enhanced metadata
        isEncrypted: pdf.isEncrypted || false,
        version: metadata.version || 'Unknown',
      };
    } catch (error) {
      console.warn('Metadata extraction failed:', error);
      return {
        title: file.name,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        pages: pdf?.numPages || 0,
      };
    }
  }

  /**
   * Create error result
   */
  private static createErrorResult(
    file: File, 
    error: any,
    processingTime: number
  ): ExtractionResult {
    console.error('Creating error result:', error);
    
    return {
      text: `[Error extracting PDF: ${file.name}]\n${error.message || 'Unknown error'}`,
      sections: [],
      tables: [],
      entities: [],
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        error: error.message,
      },
      structure: {
        headings: [],
        paragraphs: 0,
        pageBreaks: [],
      },
      quality: {
        overall: 0,
        textQuality: 0,
        structureQuality: 0,
        warnings: ['Extraction failed'],
        suggestions: ['Try alternative extraction method'],
      },
      method: 'native',
      processingTime,
    };
  }

  /**
   * Check if file is PDF - backward compatible
   */
  static isPDF(file: File): boolean {
    return file.type === 'application/pdf' || 
           file.name.toLowerCase().endsWith('.pdf');
  }
}

// Create backward-compatible exports
export const BrowserPDFExtractor = EnhancedBrowserPDFExtractor;
export const PDFTextExtractor = EnhancedBrowserPDFExtractor;