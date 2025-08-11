/**
 * OPTIMIZED DOCUMENT EXTRACTION SYSTEM
 * Maximum performance and accuracy improvements
 * Handles large documents efficiently with streaming and parallel processing
 */

import * as pdfjsLib from 'pdfjs-dist';
import { TextItem, TextContent } from 'pdfjs-dist/types/src/display/api';
import Tesseract from 'tesseract.js';
import { getAirGapConfig, isAirGapMode } from '../config/airgap-config';

// Configuration constants
const CONFIG = {
  CHUNK_SIZE: 10, // Pages per chunk
  MAX_WORKERS: 4, // Parallel workers
  CACHE_TTL: 3600000, // 1 hour cache
  MAX_CACHE_SIZE: 100 * 1024 * 1024, // 100MB cache limit
  OCR_CONFIDENCE_THRESHOLD: 60,
  TABLE_CONFIDENCE_THRESHOLD: 0.75,
  ENTITY_CONTEXT_WINDOW: 50, // Characters before/after entity
  MEMORY_CLEANUP_INTERVAL: 5000, // Cleanup every 5 seconds
  PROGRESSIVE_MODES: {
    PREVIEW: { pages: 10, ocr: false, tables: true, entities: true },
    STANDARD: { pages: 50, ocr: true, tables: true, entities: true },
    FULL: { pages: Infinity, ocr: true, tables: true, entities: true }
  }
};

// Enhanced interfaces
interface ExtractionMode {
  mode: 'preview' | 'standard' | 'full' | 'custom';
  maxPages?: number;
  enableOCR?: boolean;
  enableTables?: boolean;
  enableEntities?: boolean;
  enableStreaming?: boolean;
  parallel?: boolean;
  onProgress?: (progress: ProgressUpdate) => void;
  abortSignal?: AbortSignal;
}

interface ProgressUpdate {
  current: number;
  total: number;
  percentage: number;
  status: string;
  pageResults?: Partial<StreamingResult>;
}

interface StreamingResult {
  pageNumber: number;
  text: string;
  tables?: ExtractedTable[];
  entities?: ExtractedEntity[];
  sections?: ExtractedSection[];
  processing: boolean;
  error?: string;
}

interface ExtractedTable {
  pageNumber: number;
  headers: string[];
  rows: string[][];
  markdown: string;
  confidence: number;
  type?: 'financial' | 'schedule' | 'comparison' | 'general';
  continuedFrom?: number; // Page number if table continues
  continuedTo?: number; // Page number if table continues
  boundingBox?: { x: number; y: number; width: number; height: number };
}

interface ExtractedEntity {
  type: 'person' | 'organization' | 'date' | 'location' | 'legal_citation' | 
        'monetary_amount' | 'case_number' | 'statute' | 'regulation' | 
        'court' | 'judge' | 'solicitor' | 'barrister' | 'email' | 'phone';
  value: string;
  normalizedValue?: string;
  context: string;
  contextBefore?: string;
  contextAfter?: string;
  pageNumber: number;
  position?: { x: number; y: number };
  confidence: number;
  relationships?: { type: string; target: string; confidence: number }[];
}

interface ExtractedSection {
  title: string;
  content: string;
  level: number;
  pageStart: number;
  pageEnd: number;
  type?: 'heading' | 'paragraph' | 'list' | 'quote' | 'footnote';
  readingOrder?: number;
}

interface ExtractionQuality {
  overall: number;
  textQuality: number;
  structureQuality: number;
  ocrQuality?: number;
  tableAccuracy?: number;
  entityAccuracy?: number;
  warnings: string[];
  suggestions: string[];
  pagesProcessed: number;
  totalPages: number;
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
    readingOrder?: number[];
  };
  quality: ExtractionQuality;
  method: 'native' | 'ocr' | 'hybrid' | 'streaming';
  processingTime: number;
  memoryUsed?: number;
  // Legal document specific
  legalMetadata?: {
    caseNumber?: string;
    court?: string;
    parties?: string[];
    date?: string;
    documentType?: string;
    citations?: string[];
  };
}

// Memory management
class MemoryManager {
  private static instance: MemoryManager;
  private memoryUsage: number = 0;
  private cleanupTimer?: NodeJS.Timeout;

  static getInstance(): MemoryManager {
    if (!this.instance) {
      this.instance = new MemoryManager();
    }
    return this.instance;
  }

  startMonitoring(): void {
    if (this.cleanupTimer) return;
    
    this.cleanupTimer = setInterval(() => {
      if (global.gc) {
        global.gc();
      }
      this.logMemoryUsage();
    }, CONFIG.MEMORY_CLEANUP_INTERVAL);
  }

  stopMonitoring(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  logMemoryUsage(): void {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      this.memoryUsage = usage.heapUsed;
      if (usage.heapUsed > 500 * 1024 * 1024) { // 500MB warning
        console.warn('⚠️ High memory usage:', Math.round(usage.heapUsed / 1024 / 1024), 'MB');
      }
    }
  }

  getMemoryUsage(): number {
    return this.memoryUsage;
  }
}

// Worker pool for parallel processing
class WorkerPool {
  private workers: Worker[] = [];
  private queue: Array<{ task: any; resolve: Function; reject: Function }> = [];
  private busyWorkers: Set<Worker> = new Set();

  constructor(private maxWorkers: number = CONFIG.MAX_WORKERS) {
    this.initializeWorkers();
  }

  private initializeWorkers(): void {
    // Note: In production, create actual Web Workers
    // This is a placeholder for the worker pool logic
    console.log(`Initializing worker pool with ${this.maxWorkers} workers`);
  }

  async process<T>(task: any): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.processQueue();
    });
  }

  private processQueue(): void {
    if (this.queue.length === 0) return;
    
    const availableWorker = this.getAvailableWorker();
    if (!availableWorker) return;

    const { task, resolve, reject } = this.queue.shift()!;
    this.busyWorkers.add(availableWorker);

    // Simulate worker processing
    // In production, post message to actual worker
    setTimeout(() => {
      this.busyWorkers.delete(availableWorker);
      resolve(task); // Process task
      this.processQueue(); // Process next in queue
    }, 0);
  }

  private getAvailableWorker(): Worker | null {
    for (const worker of this.workers) {
      if (!this.busyWorkers.has(worker)) {
        return worker;
      }
    }
    return null;
  }

  terminate(): void {
    this.workers.forEach(worker => {
      // Terminate actual workers in production
    });
    this.workers = [];
    this.queue = [];
    this.busyWorkers.clear();
  }
}

// Enhanced cache with size limits
class DocumentCache {
  private cache: Map<string, { data: any; size: number; timestamp: number }> = new Map();
  private totalSize: number = 0;

  set(key: string, data: any): void {
    const size = this.estimateSize(data);
    
    // Evict old entries if cache is too large
    while (this.totalSize + size > CONFIG.MAX_CACHE_SIZE && this.cache.size > 0) {
      const oldestKey = this.getOldestKey();
      if (oldestKey) {
        this.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      size,
      timestamp: Date.now()
    });
    this.totalSize += size;
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check TTL
    if (Date.now() - entry.timestamp > CONFIG.CACHE_TTL) {
      this.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      this.totalSize -= entry.size;
      this.cache.delete(key);
    }
  }

  private getOldestKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  private estimateSize(data: any): number {
    // Simple size estimation
    return JSON.stringify(data).length * 2; // 2 bytes per character
  }

  clear(): void {
    this.cache.clear();
    this.totalSize = 0;
  }

  getStats(): { entries: number; totalSize: number } {
    return {
      entries: this.cache.size,
      totalSize: this.totalSize
    };
  }
}

/**
 * Optimized Document Extractor with maximum performance and accuracy
 */
export class OptimizedDocumentExtractor {
  private static cache = new DocumentCache();
  private static workerPool = new WorkerPool();
  private static memoryManager = MemoryManager.getInstance();

  /**
   * Configure PDF.js worker with fallback strategies
   */
  private static configurePDFWorker(): void {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      console.log('✅ PDF.js worker configured for optimized extraction');
    } catch (error) {
      console.error('Failed to configure PDF.js worker:', error);
      // Fallback to main thread if worker fails
      pdfjsLib.GlobalWorkerOptions.workerSrc = '';
    }
  }

  /**
   * Main extraction method with mode selection
   */
  static async extract(
    file: File | Blob,
    options: ExtractionMode = { mode: 'standard' }
  ): Promise<ExtractionResult> {
    const startTime = Date.now();
    this.memoryManager.startMonitoring();

    try {
      // Check cache first
      const cacheKey = await this.getCacheKey(file, options);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        console.log('📦 Cache hit for document extraction');
        return cached;
      }

      // Determine extraction settings based on mode
      const settings = this.getExtractionSettings(options);

      let result: ExtractionResult;

      // Route to appropriate extraction method
      if (file.type === 'application/pdf') {
        if (settings.enableStreaming) {
          result = await this.extractPDFStreaming(file, settings);
        } else {
          result = await this.extractPDFOptimized(file, settings);
        }
      } else {
        // Fallback to existing extraction for other formats
        result = await this.extractOtherFormats(file, settings);
      }

      // Calculate final metrics
      result.processingTime = Date.now() - startTime;
      result.memoryUsed = this.memoryManager.getMemoryUsage();

      // Cache the result
      this.cache.set(cacheKey, result);

      return result;

    } finally {
      this.memoryManager.stopMonitoring();
    }
  }

  /**
   * Optimized PDF extraction with parallel processing
   */
  private static async extractPDFOptimized(
    file: File | Blob,
    settings: any
  ): Promise<ExtractionResult> {
    this.configurePDFWorker();

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const totalPages = pdf.numPages;
    const pagesToProcess = Math.min(settings.maxPages, totalPages);
    
    console.log(`📄 Processing ${pagesToProcess} of ${totalPages} pages with optimized extraction`);

    const results: {
      text: string[];
      tables: ExtractedTable[];
      entities: ExtractedEntity[];
      sections: ExtractedSection[];
    } = {
      text: [],
      tables: [],
      entities: [],
      sections: []
    };

    // Process pages in chunks for better memory management
    const chunkSize = CONFIG.CHUNK_SIZE;
    const chunks = Math.ceil(pagesToProcess / chunkSize);

    for (let chunkIndex = 0; chunkIndex < chunks; chunkIndex++) {
      const startPage = chunkIndex * chunkSize + 1;
      const endPage = Math.min(startPage + chunkSize - 1, pagesToProcess);
      
      console.log(`Processing chunk ${chunkIndex + 1}/${chunks} (pages ${startPage}-${endPage})`);

      // Process pages in parallel within chunk
      const pagePromises = [];
      for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
        pagePromises.push(this.processPage(pdf, pageNum, settings));
      }

      const chunkResults = await Promise.all(pagePromises);

      // Aggregate results
      for (const pageResult of chunkResults) {
        results.text.push(pageResult.text);
        results.tables.push(...pageResult.tables);
        results.entities.push(...pageResult.entities);
        results.sections.push(...pageResult.sections);
      }

      // Clean up memory after each chunk
      if (global.gc) global.gc();
    }

    // Post-process results
    const processedResults = await this.postProcessResults(results, totalPages, pagesToProcess);

    return {
      text: processedResults.text,
      sections: processedResults.sections,
      tables: processedResults.tables,
      entities: processedResults.entities,
      metadata: await this.extractMetadata(file, pdf),
      structure: processedResults.structure,
      quality: this.calculateQuality(processedResults, totalPages, pagesToProcess),
      method: settings.enableOCR ? 'hybrid' : 'native',
      processingTime: 0, // Set by caller
      legalMetadata: this.extractLegalMetadata(processedResults)
    };
  }

  /**
   * Streaming extraction for very large documents with progress callback
   */
  private static async extractPDFStreaming(
    file: File | Blob,
    settings: any
  ): Promise<ExtractionResult> {
    this.configurePDFWorker();

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const totalPages = pdf.numPages;
    const pagesToProcess = Math.min(settings.maxPages, totalPages);
    
    console.log(`📄 Streaming extraction of ${pagesToProcess} pages`);

    const aggregatedResults: {
      text: string[];
      tables: ExtractedTable[];
      entities: ExtractedEntity[];
      sections: ExtractedSection[];
    } = {
      text: [],
      tables: [],
      entities: [],
      sections: []
    };

    for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
      // Check for cancellation
      if (settings.abortSignal?.aborted) {
        throw new Error('Extraction cancelled');
      }

      try {
        // Report progress
        if (settings.onProgress) {
          settings.onProgress({
            current: pageNum,
            total: pagesToProcess,
            percentage: Math.round((pageNum / pagesToProcess) * 100),
            status: `Processing page ${pageNum} of ${pagesToProcess}`
          });
        }

        // Process single page
        const pageResult = await this.processPage(pdf, pageNum, settings);
        
        // Aggregate results
        aggregatedResults.text.push(pageResult.text);
        aggregatedResults.tables.push(...pageResult.tables);
        aggregatedResults.entities.push(...pageResult.entities);
        aggregatedResults.sections.push(...pageResult.sections);

        // Report page completion
        if (settings.onProgress) {
          settings.onProgress({
            current: pageNum,
            total: pagesToProcess,
            percentage: Math.round((pageNum / pagesToProcess) * 100),
            status: `Completed page ${pageNum}`,
            pageResults: {
              pageNumber: pageNum,
              text: pageResult.text,
              tables: pageResult.tables,
              entities: pageResult.entities,
              processing: false
            }
          });
        }

        // Clean up memory periodically
        if (pageNum % 10 === 0 && global.gc) {
          global.gc();
        }

      } catch (error) {
        console.error(`Error processing page ${pageNum}:`, error);
        // Continue processing other pages
        if (settings.onProgress) {
          settings.onProgress({
            current: pageNum,
            total: pagesToProcess,
            percentage: Math.round((pageNum / pagesToProcess) * 100),
            status: `Error on page ${pageNum}: ${(error as Error).message}`
          });
        }
      }
    }

    // Return final aggregated result
    const processedResults = await this.postProcessResults(aggregatedResults, totalPages, pagesToProcess);

    return {
      text: processedResults.text,
      sections: processedResults.sections,
      tables: processedResults.tables,
      entities: processedResults.entities,
      metadata: await this.extractMetadata(file, pdf),
      structure: processedResults.structure,
      quality: this.calculateQuality(processedResults, totalPages, pagesToProcess),
      method: 'streaming',
      processingTime: 0,
      legalMetadata: this.extractLegalMetadata(processedResults)
    };
  }

  /**
   * Process a single page with all extraction features
   */
  private static async processPage(
    pdf: any,
    pageNum: number,
    settings: any
  ): Promise<any> {
    const page = await pdf.getPage(pageNum);
    
    try {
      const textContent = await page.getTextContent();
      
      // Extract text and structure
      const { text, sections } = await this.extractStructuredText(textContent.items, pageNum);
      
      // Extract tables if enabled
      const tables = settings.enableTables ? 
        await this.extractTablesAdvanced(page, textContent, pageNum) : [];
      
      // Extract entities if enabled
      const entities = settings.enableEntities ?
        await this.extractEntitiesWithContext(text, pageNum) : [];

      // Check if OCR is needed and enabled
      let ocrText = '';
      if (settings.enableOCR && text.length < 100) {
        ocrText = await this.performOCR(page, pageNum);
      }

      return {
        text: ocrText || text,
        tables,
        entities,
        sections
      };

    } finally {
      // Critical: Clean up page resources
      page.cleanup();
    }
  }

  /**
   * Enhanced table extraction with multi-page support
   */
  private static async extractTablesAdvanced(
    page: any,
    textContent: any,
    pageNum: number
  ): Promise<ExtractedTable[]> {
    const tables: ExtractedTable[] = [];
    const items = textContent.items;
    
    if (!items || items.length === 0) return tables;

    // Group items by Y position for row detection
    const rows = new Map<number, any[]>();
    const tolerance = 2; // Y-position tolerance

    items.forEach((item: any) => {
      const y = Math.round(item.transform[5] / tolerance) * tolerance;
      if (!rows.has(y)) {
        rows.set(y, []);
      }
      rows.get(y)!.push(item);
    });

    // Sort rows by Y position
    const sortedRows = Array.from(rows.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([_, items]) => items);

    // Detect table boundaries using column alignment
    const tableRegions = this.detectTableRegions(sortedRows);

    for (const region of tableRegions) {
      const table = await this.buildTable(region, pageNum);
      if (table && table.confidence > CONFIG.TABLE_CONFIDENCE_THRESHOLD) {
        tables.push(table);
      }
    }

    return tables;
  }

  /**
   * Detect table regions using column alignment analysis
   */
  private static detectTableRegions(rows: any[][]): any[] {
    const regions = [];
    let currentRegion = [];
    let prevColumnCount = 0;

    for (const row of rows) {
      // Sort items in row by X position
      row.sort((a, b) => a.transform[4] - b.transform[4]);
      
      // Detect columns using gap analysis
      const columns = this.detectColumns(row);
      
      // Check if this row belongs to a table
      if (columns.length > 1) {
        // Check column alignment with previous row
        if (currentRegion.length === 0 || 
            Math.abs(columns.length - prevColumnCount) <= 1) {
          currentRegion.push({ row, columns });
          prevColumnCount = columns.length;
        } else {
          // Start new table region
          if (currentRegion.length > 1) {
            regions.push(currentRegion);
          }
          currentRegion = [{ row, columns }];
          prevColumnCount = columns.length;
        }
      } else {
        // End current table region
        if (currentRegion.length > 1) {
          regions.push(currentRegion);
        }
        currentRegion = [];
        prevColumnCount = 0;
      }
    }

    // Add final region if exists
    if (currentRegion.length > 1) {
      regions.push(currentRegion);
    }

    return regions;
  }

  /**
   * Detect columns in a row using gap analysis
   */
  private static detectColumns(row: any[]): any[] {
    if (row.length < 2) return [row];

    const columns = [];
    let currentColumn = [row[0]];
    const avgCharWidth = row[0].width || 10;
    const gapThreshold = avgCharWidth * 3; // 3 character widths

    for (let i = 1; i < row.length; i++) {
      const prevItem = row[i - 1];
      const currItem = row[i];
      const gap = currItem.transform[4] - (prevItem.transform[4] + prevItem.width);

      if (gap > gapThreshold) {
        // Large gap indicates new column
        columns.push(currentColumn);
        currentColumn = [currItem];
      } else {
        currentColumn.push(currItem);
      }
    }

    // Add last column
    if (currentColumn.length > 0) {
      columns.push(currentColumn);
    }

    return columns;
  }

  /**
   * Build table from detected region
   */
  private static async buildTable(region: any[], pageNum: number): Promise<ExtractedTable> {
    const headers = region[0].columns.map((col: any[]) => 
      col.map(item => item.str).join(' ').trim()
    );

    const rows = region.slice(1).map(r => 
      r.columns.map((col: any[]) => 
        col.map(item => item.str).join(' ').trim()
      )
    );

    // Calculate confidence based on alignment and consistency
    const confidence = this.calculateTableConfidence(region);

    // Generate markdown
    const markdown = this.generateTableMarkdown(headers, rows);

    // Determine table type
    const type = this.classifyTableType(headers, rows);

    return {
      pageNumber: pageNum,
      headers,
      rows,
      markdown,
      confidence,
      type
    };
  }

  /**
   * Calculate table confidence score
   */
  private static calculateTableConfidence(region: any[]): number {
    // Check column count consistency
    const columnCounts = region.map(r => r.columns.length);
    const avgColumns = columnCounts.reduce((a, b) => a + b, 0) / columnCounts.length;
    const columnVariance = columnCounts.reduce((acc, count) => 
      acc + Math.pow(count - avgColumns, 2), 0) / columnCounts.length;
    
    // Lower variance = higher confidence
    const consistencyScore = Math.max(0, 1 - (columnVariance / avgColumns));
    
    // Check alignment
    const alignmentScore = this.calculateAlignmentScore(region);
    
    // Combined confidence
    return (consistencyScore * 0.6 + alignmentScore * 0.4);
  }

  /**
   * Calculate alignment score for table columns
   */
  private static calculateAlignmentScore(region: any[]): number {
    if (region.length < 2) return 0;

    let alignedColumns = 0;
    let totalComparisons = 0;

    // Compare X positions across rows
    for (let col = 0; col < region[0].columns.length; col++) {
      const xPositions = region
        .filter(r => r.columns[col])
        .map(r => r.columns[col][0]?.transform[4] || 0);
      
      if (xPositions.length < 2) continue;

      // Calculate standard deviation of X positions
      const mean = xPositions.reduce((a, b) => a + b, 0) / xPositions.length;
      const variance = xPositions.reduce((acc, x) => 
        acc + Math.pow(x - mean, 2), 0) / xPositions.length;
      const stdDev = Math.sqrt(variance);

      // Consider aligned if standard deviation is low
      if (stdDev < 5) {
        alignedColumns++;
      }
      totalComparisons++;
    }

    return totalComparisons > 0 ? alignedColumns / totalComparisons : 0;
  }

  /**
   * Extract entities with context windows
   */
  private static async extractEntitiesWithContext(
    text: string,
    pageNum: number
  ): Promise<ExtractedEntity[]> {
    const entities: ExtractedEntity[] = [];

    // Legal citation patterns
    const patterns = {
      caseNumber: /\b\d{2,4}[-/]\w{2,10}[-/]\d{2,6}\b/g,
      statute: /\b(?:Section|Sec\.|§)\s*\d+[A-Za-z]?(?:\.\d+)?(?:\([a-z0-9]+\))?/gi,
      court: /\b(?:Supreme Court|Court of Appeals?|District Court|High Court|Crown Court|Magistrates['''] Court)\b/gi,
      date: /\b(?:\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})\b/gi,
      monetary: /(?:[$£€¥]\s*[\d,]+(?:\.\d{2})?|\b\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:dollars?|pounds?|euros?|yen|USD|GBP|EUR|JPY)\b)/gi,
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /\b(?:\+?[1-9]\d{0,2}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/g,
      person: /\b(?:[A-Z][a-z]+ ){1,3}[A-Z][a-z]+\b/g,
      organization: /\b(?:[A-Z][A-Za-z]+(?:\s+(?:&|and|of|for|the|in))?\s+){1,5}(?:Inc|LLC|Ltd|LLP|Corp|Company|Corporation|Group|Partners?|Associates?)\b/g
    };

    // Extract each entity type
    for (const [type, pattern] of Object.entries(patterns)) {
      const matches = text.matchAll(pattern);
      
      for (const match of matches) {
        const value = match[0];
        const index = match.index || 0;
        
        // Extract context windows
        const contextBefore = text.substring(
          Math.max(0, index - CONFIG.ENTITY_CONTEXT_WINDOW),
          index
        ).trim();
        
        const contextAfter = text.substring(
          index + value.length,
          Math.min(text.length, index + value.length + CONFIG.ENTITY_CONTEXT_WINDOW)
        ).trim();

        // Calculate confidence based on pattern match and context
        const confidence = this.calculateEntityConfidence(type, value, contextBefore, contextAfter);

        entities.push({
          type: type as any,
          value,
          normalizedValue: this.normalizeEntity(type, value),
          context: `${contextBefore} [${value}] ${contextAfter}`,
          contextBefore,
          contextAfter,
          pageNumber: pageNum,
          confidence,
          relationships: []
        });
      }
    }

    // Detect relationships between entities
    this.detectEntityRelationships(entities);

    return entities;
  }

  /**
   * Calculate entity confidence based on context
   */
  private static calculateEntityConfidence(
    type: string,
    value: string,
    contextBefore: string,
    contextAfter: string
  ): number {
    let confidence = 0.5; // Base confidence

    // Type-specific confidence boosters
    switch (type) {
      case 'person':
        if (contextBefore.match(/\b(?:Mr|Mrs|Ms|Dr|Prof|Judge|Attorney|Solicitor|Barrister)\b/i)) {
          confidence += 0.3;
        }
        if (contextAfter.match(/\b(?:Esq|Jr|Sr|PhD|MD|QC|KC)\b/i)) {
          confidence += 0.2;
        }
        break;
      
      case 'caseNumber':
        if (contextBefore.match(/\b(?:Case|Matter|Docket|File)\s*(?:No|Number|#)?:?\s*$/i)) {
          confidence += 0.4;
        }
        break;
      
      case 'court':
        if (contextBefore.match(/\b(?:before|at|in)\s+(?:the\s+)?$/i)) {
          confidence += 0.2;
        }
        break;
      
      case 'monetary':
        if (contextBefore.match(/\b(?:amount|sum|total|payment|damages|settlement|fee|cost)\s*(?:of)?:?\s*$/i)) {
          confidence += 0.3;
        }
        break;
    }

    return Math.min(1, confidence);
  }

  /**
   * Normalize entity values
   */
  private static normalizeEntity(type: string, value: string): string {
    switch (type) {
      case 'date':
        // Normalize dates to ISO format
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        } catch {}
        return value;
      
      case 'monetary':
        // Normalize monetary amounts
        return value.replace(/[,$£€¥]/g, '').trim();
      
      case 'email':
        return value.toLowerCase();
      
      case 'phone':
        return value.replace(/[-.\s()]/g, '');
      
      default:
        return value;
    }
  }

  /**
   * Detect relationships between entities
   */
  private static detectEntityRelationships(entities: ExtractedEntity[]): void {
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entity1 = entities[i];
        const entity2 = entities[j];

        // Skip if not on same page
        if (entity1.pageNumber !== entity2.pageNumber) continue;

        // Check proximity in context
        if (entity1.contextAfter?.includes(entity2.value) || 
            entity2.contextBefore?.includes(entity1.value)) {
          
          // Determine relationship type
          let relationType = 'related';
          
          if (entity1.type === 'person' && entity2.type === 'organization') {
            relationType = 'affiliated_with';
          } else if (entity1.type === 'person' && entity2.type === 'court') {
            relationType = 'appears_before';
          } else if (entity1.type === 'caseNumber' && entity2.type === 'court') {
            relationType = 'filed_in';
          }

          entity1.relationships = entity1.relationships || [];
          entity1.relationships.push({
            type: relationType,
            target: entity2.value,
            confidence: 0.7
          });
        }
      }
    }
  }

  /**
   * Post-process extracted results
   */
  private static async postProcessResults(
    results: any,
    totalPages: number,
    processedPages: number
  ): Promise<any> {
    // Merge continued tables
    const mergedTables = this.mergeContinuedTables(results.tables);

    // Build document structure
    const structure = this.buildDocumentStructure(results.sections);

    // Remove duplicates from entities
    const uniqueEntities = this.deduplicateEntities(results.entities);

    return {
      text: results.text.join('\n\n'),
      sections: results.sections,
      tables: mergedTables,
      entities: uniqueEntities,
      structure
    };
  }

  /**
   * Merge tables that continue across pages
   */
  private static mergeContinuedTables(tables: ExtractedTable[]): ExtractedTable[] {
    const merged: ExtractedTable[] = [];
    let currentTable: ExtractedTable | null = null;

    for (const table of tables) {
      // Check if this table continues from previous
      if (currentTable && 
          table.headers.length === currentTable.headers.length &&
          table.headers.every((h, i) => h === currentTable!.headers[i])) {
        
        // Merge rows
        currentTable.rows.push(...table.rows);
        currentTable.continuedTo = table.pageNumber;
        
      } else {
        // Start new table
        if (currentTable) {
          merged.push(currentTable);
        }
        currentTable = { ...table };
      }
    }

    // Add last table
    if (currentTable) {
      merged.push(currentTable);
    }

    return merged;
  }

  /**
   * Build document structure with reading order
   */
  private static buildDocumentStructure(sections: ExtractedSection[]): any {
    const headings = sections
      .filter(s => s.type === 'heading')
      .map(s => s.title);

    const paragraphs = sections
      .filter(s => s.type === 'paragraph')
      .length;

    const pageBreaks = [...new Set(sections.map(s => s.pageStart))].sort();

    // Determine reading order
    const readingOrder = sections
      .sort((a, b) => {
        if (a.pageStart !== b.pageStart) return a.pageStart - b.pageStart;
        return (a.readingOrder || 0) - (b.readingOrder || 0);
      })
      .map((_, index) => index);

    return {
      headings,
      paragraphs,
      pageBreaks,
      readingOrder
    };
  }

  /**
   * Deduplicate entities while preserving best quality
   */
  private static deduplicateEntities(entities: ExtractedEntity[]): ExtractedEntity[] {
    const unique = new Map<string, ExtractedEntity>();

    for (const entity of entities) {
      const key = `${entity.type}:${entity.normalizedValue || entity.value}`;
      const existing = unique.get(key);

      if (!existing || entity.confidence > existing.confidence) {
        unique.set(key, entity);
      } else if (existing && entity.relationships && entity.relationships.length > 0) {
        // Merge relationships
        existing.relationships = [
          ...(existing.relationships || []),
          ...entity.relationships
        ];
      }
    }

    return Array.from(unique.values());
  }

  /**
   * Calculate quality metrics
   */
  private static calculateQuality(
    results: any,
    totalPages: number,
    processedPages: number
  ): ExtractionQuality {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Calculate coverage
    const coverage = processedPages / totalPages;
    if (coverage < 1) {
      warnings.push(`Only ${processedPages} of ${totalPages} pages processed`);
      if (coverage < 0.5) {
        suggestions.push('Consider using full extraction mode for complete document analysis');
      }
    }

    // Calculate text quality
    const avgTextPerPage = results.text.length / processedPages;
    const textQuality = Math.min(1, avgTextPerPage / 1000); // Assume 1000 chars per page is good

    // Calculate structure quality
    const structureQuality = results.sections.length > 0 ? 0.8 : 0.4;

    // Calculate table accuracy
    const tableAccuracy = results.tables.reduce((acc: number, table: ExtractedTable) => 
      acc + table.confidence, 0) / Math.max(1, results.tables.length);

    // Calculate entity accuracy
    const entityAccuracy = results.entities.reduce((acc: number, entity: ExtractedEntity) => 
      acc + entity.confidence, 0) / Math.max(1, results.entities.length);

    // Overall quality score
    const overall = (
      textQuality * 0.3 +
      structureQuality * 0.2 +
      tableAccuracy * 0.25 +
      entityAccuracy * 0.25
    ) * coverage;

    return {
      overall,
      textQuality,
      structureQuality,
      tableAccuracy,
      entityAccuracy,
      warnings,
      suggestions,
      pagesProcessed: processedPages,
      totalPages
    };
  }

  /**
   * Extract legal metadata from results
   */
  private static extractLegalMetadata(results: any): any {
    const metadata: any = {};

    // Find case number
    const caseNumberEntity = results.entities.find((e: ExtractedEntity) => 
      e.type === 'caseNumber' && e.confidence > 0.7
    );
    if (caseNumberEntity) {
      metadata.caseNumber = caseNumberEntity.value;
    }

    // Find court
    const courtEntity = results.entities.find((e: ExtractedEntity) => 
      e.type === 'court' && e.confidence > 0.7
    );
    if (courtEntity) {
      metadata.court = courtEntity.value;
    }

    // Find parties (high confidence persons)
    const parties = results.entities
      .filter((e: ExtractedEntity) => e.type === 'person' && e.confidence > 0.6)
      .slice(0, 10)
      .map((e: ExtractedEntity) => e.value);
    if (parties.length > 0) {
      metadata.parties = parties;
    }

    // Find dates
    const dateEntities = results.entities
      .filter((e: ExtractedEntity) => e.type === 'date')
      .sort((a: ExtractedEntity, b: ExtractedEntity) => b.confidence - a.confidence);
    if (dateEntities.length > 0) {
      metadata.date = dateEntities[0].normalizedValue || dateEntities[0].value;
    }

    // Find citations
    const citations = results.entities
      .filter((e: ExtractedEntity) => e.type === 'legal_citation' || e.type === 'statute')
      .map((e: ExtractedEntity) => e.value);
    if (citations.length > 0) {
      metadata.citations = [...new Set(citations)];
    }

    // Determine document type from headings
    const headings = results.sections
      .filter((s: ExtractedSection) => s.type === 'heading')
      .map((s: ExtractedSection) => s.title.toLowerCase());
    
    if (headings.some((h: string) => h.includes('complaint'))) {
      metadata.documentType = 'Complaint';
    } else if (headings.some((h: string) => h.includes('motion'))) {
      metadata.documentType = 'Motion';
    } else if (headings.some((h: string) => h.includes('order'))) {
      metadata.documentType = 'Order';
    } else if (headings.some((h: string) => h.includes('brief'))) {
      metadata.documentType = 'Brief';
    }

    return metadata;
  }

  // Stub methods for other operations
  private static async getCacheKey(file: File | Blob, options: any): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hash = Array.from(new Uint8Array(buffer.slice(0, 1024)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return `${file.type}:${file.size}:${hash}:${JSON.stringify(options)}`;
  }

  private static getExtractionSettings(options: ExtractionMode): any {
    const presets = CONFIG.PROGRESSIVE_MODES[options.mode?.toUpperCase()] || 
                    CONFIG.PROGRESSIVE_MODES.STANDARD;
    
    return {
      maxPages: options.maxPages ?? presets.pages,
      enableOCR: options.enableOCR ?? presets.ocr,
      enableTables: options.enableTables ?? presets.tables,
      enableEntities: options.enableEntities ?? presets.entities,
      enableStreaming: options.enableStreaming ?? false,
      parallel: options.parallel ?? true
    };
  }

  private static async extractStructuredText(items: any[], pageNum: number): Promise<any> {
    // Implementation from existing code
    const sections: ExtractedSection[] = [];
    const lines: string[] = [];
    
    if (!items.length) {
      return { text: '', sections: [] };
    }
    
    // Sort items by position
    items.sort((a, b) => {
      const yDiff = b.transform[5] - a.transform[5];
      if (Math.abs(yDiff) > 2) return yDiff;
      return a.transform[4] - b.transform[4];
    });
    
    // Process items into text and sections
    let currentLine = '';
    let lastY = items[0].transform[5];
    
    items.forEach((item) => {
      const y = item.transform[5];
      const fontSize = item.height || 12;
      
      if (Math.abs(lastY - y) > fontSize * 0.5) {
        if (currentLine) {
          lines.push(currentLine);
          
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
      sections
    };
  }

  private static async performOCR(page: any, pageNum: number): Promise<string> {
    // Simplified OCR stub - would use Tesseract in production
    console.log(`Performing OCR on page ${pageNum}`);
    return '';
  }

  private static async extractMetadata(file: File | Blob, pdf: any): Promise<any> {
    const metadata = await pdf.getMetadata();
    return {
      ...metadata.info,
      pageCount: pdf.numPages,
      fileName: (file as File).name || 'document.pdf',
      fileSize: file.size,
      fileType: file.type
    };
  }

  private static async extractOtherFormats(file: File | Blob, settings: any): Promise<ExtractionResult> {
    // Fallback for non-PDF formats
    throw new Error('Non-PDF extraction not implemented in this example');
  }

  private static classifyTableType(headers: string[], rows: string[][]): string {
    const headerText = headers.join(' ').toLowerCase();
    
    if (headerText.includes('amount') || headerText.includes('total') || 
        headerText.includes('balance') || headerText.includes('$')) {
      return 'financial';
    } else if (headerText.includes('date') || headerText.includes('time') || 
               headerText.includes('schedule')) {
      return 'schedule';
    } else if (headers.length === 2) {
      return 'comparison';
    }
    
    return 'general';
  }

  private static generateTableMarkdown(headers: string[], rows: string[][]): string {
    let markdown = '| ' + headers.join(' | ') + ' |\n';
    markdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
    
    for (const row of rows) {
      markdown += '| ' + row.join(' | ') + ' |\n';
    }
    
    return markdown;
  }
}

// Export for use in application
export default OptimizedDocumentExtractor;
export type {
  ExtractionMode,
  ExtractionResult,
  ExtractedTable,
  ExtractedEntity,
  ExtractedSection,
  ExtractionQuality,
  StreamingResult
};