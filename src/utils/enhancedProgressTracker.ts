/**
 * Enhanced Progress Tracker
 * Converts basic extraction progress to detailed OCR progress with beautiful metrics
 */

import { ProgressUpdate, EnhancedProgressUpdate } from '../services/productionDocumentExtractor';

interface ProgressMetrics {
  startTime: number;
  pagesProcessed: number;
  totalPages: number;
  ocrPagesProcessed: number;
  ocrPagesNeeded: number;
  textExtracted: number;
  ocrTextExtracted: number;
  tablesFound: number;
  entitiesFound: number;
  processingTimes: number[];
  fileName?: string;
  fileSize?: number;
  ocrWorkersActive: number;
  ocrWorkersTotal: number;
}

export class EnhancedProgressTracker {
  private metrics: ProgressMetrics;
  private onProgressCallback?: (progress: EnhancedProgressUpdate) => void;

  constructor(fileName?: string, fileSize?: number, ocrWorkersTotal = 2) {
    this.metrics = {
      startTime: Date.now(),
      pagesProcessed: 0,
      totalPages: 0,
      ocrPagesProcessed: 0,
      ocrPagesNeeded: 0,
      textExtracted: 0,
      ocrTextExtracted: 0,
      tablesFound: 0,
      entitiesFound: 0,
      processingTimes: [],
      fileName,
      fileSize,
      ocrWorkersActive: 0,
      ocrWorkersTotal
    };
  }

  setProgressCallback(callback: (progress: EnhancedProgressUpdate) => void) {
    this.onProgressCallback = callback;
  }

  /**
   * Update progress based on basic progress update
   */
  updateProgress(basicProgress: ProgressUpdate) {
    // Update basic metrics
    this.metrics.totalPages = basicProgress.total;
    this.metrics.pagesProcessed = basicProgress.current;

    // Update detailed metrics based on page results
    if (basicProgress.pageResults) {
      const pageResult = basicProgress.pageResults;
      
      // Track text extraction
      this.metrics.textExtracted += pageResult.text.length;
      
      // Track tables found
      if (pageResult.tables) {
        this.metrics.tablesFound += pageResult.tables.length;
      }
      
      // Track entities found
      if (pageResult.entities) {
        this.metrics.entitiesFound += pageResult.entities.length;
      }
      
      // Track processing time for speed calculation
      const now = Date.now();
      this.metrics.processingTimes.push(now);
      
      // Keep only recent times for accurate speed calculation
      if (this.metrics.processingTimes.length > 10) {
        this.metrics.processingTimes.shift();
      }
    }

    // Update OCR metrics based on stage
    if (basicProgress.stage === 'ocr') {
      this.metrics.ocrWorkersActive = Math.min(this.metrics.ocrWorkersTotal, 
        Math.max(1, this.metrics.ocrWorkersTotal));
      
      // Estimate OCR pages needed (pages with low text content)
      if (this.metrics.ocrPagesNeeded === 0 && this.metrics.totalPages > 0) {
        // Estimate that 30% of pages might need OCR
        this.metrics.ocrPagesNeeded = Math.ceil(this.metrics.totalPages * 0.3);
      }
      
      if (basicProgress.pageResults?.text) {
        const textFromOCR = basicProgress.pageResults.text.length;
        if (textFromOCR > 0) {
          this.metrics.ocrPagesProcessed++;
          this.metrics.ocrTextExtracted += textFromOCR;
        }
      }
    } else {
      this.metrics.ocrWorkersActive = 0;
    }

    // Convert to enhanced progress and notify
    const enhancedProgress = this.convertToEnhanced(basicProgress);
    this.onProgressCallback?.(enhancedProgress);
  }

  /**
   * Manually update OCR progress
   */
  updateOCRProgress(ocrPagesProcessed: number, ocrPagesTotal: number, workersActive: number) {
    this.metrics.ocrPagesProcessed = ocrPagesProcessed;
    this.metrics.ocrPagesNeeded = ocrPagesTotal;
    this.metrics.ocrWorkersActive = workersActive;
  }

  /**
   * Convert basic progress to enhanced progress with detailed metrics
   */
  private convertToEnhanced(basicProgress: ProgressUpdate): EnhancedProgressUpdate {
    const now = Date.now();
    const elapsedTime = (now - this.metrics.startTime) / 1000; // seconds
    
    // Calculate processing speed
    const processingSpeed = this.metrics.pagesProcessed > 0 ? 
      this.metrics.pagesProcessed / elapsedTime : 0;
    
    // Estimate remaining time
    const remainingPages = this.metrics.totalPages - this.metrics.pagesProcessed;
    const estimatedTimeRemaining = processingSpeed > 0 ? 
      Math.round(remainingPages / processingSpeed) : 0;

    // Map basic stage to enhanced stage
    const stageMapping: { [key: string]: EnhancedProgressUpdate['stage'] } = {
      'initializing': 'initializing',
      'processing': 'extracting',
      'ocr': 'ocr_processing',
      'postprocess': 'finalizing',
      'complete': 'completed'
    };

    // Determine current operation
    let currentOperation = basicProgress.status;
    if (basicProgress.stage === 'ocr' && this.metrics.ocrWorkersActive > 0) {
      currentOperation = `OCR processing with ${this.metrics.ocrWorkersActive} workers`;
    } else if (basicProgress.stage === 'processing') {
      currentOperation = 'Extracting text and detecting document structure';
    } else if (basicProgress.stage === 'postprocess') {
      currentOperation = 'Analyzing entities and finalizing extraction';
    }

    // Calculate quality metrics
    const textQuality = this.calculateTextQuality();
    const structureQuality = this.calculateStructureQuality();
    const overallConfidence = (textQuality + structureQuality) / 2;

    const enhanced: EnhancedProgressUpdate = {
      stage: stageMapping[basicProgress.stage] || 'extracting',
      progress: basicProgress.percentage,
      currentPage: this.metrics.pagesProcessed,
      totalPages: this.metrics.totalPages,
      currentOperation,
      textExtracted: this.metrics.textExtracted,
      tablesFound: this.metrics.tablesFound,
      entitiesFound: this.metrics.entitiesFound,
      processingSpeed: processingSpeed > 0 ? processingSpeed : undefined,
      estimatedTimeRemaining: estimatedTimeRemaining > 0 ? estimatedTimeRemaining : undefined,
      fileName: this.metrics.fileName,
      fileSize: this.metrics.fileSize,
      startTime: this.metrics.startTime,
      quality: {
        textQuality,
        structureQuality,
        confidence: overallConfidence
      }
    };

    // Add OCR-specific metrics
    if (basicProgress.stage === 'ocr' || this.metrics.ocrPagesProcessed > 0) {
      enhanced.ocrPagesProcessed = this.metrics.ocrPagesProcessed;
      enhanced.ocrPagesTotal = Math.max(this.metrics.ocrPagesNeeded, this.metrics.ocrPagesProcessed);
      enhanced.ocrWorkersActive = this.metrics.ocrWorkersActive;
      enhanced.ocrWorkersTotal = this.metrics.ocrWorkersTotal;
      enhanced.ocrTextExtracted = this.metrics.ocrTextExtracted;
    }

    return enhanced;
  }

  /**
   * Calculate text quality based on extraction results
   */
  private calculateTextQuality(): number {
    if (this.metrics.pagesProcessed === 0) return 0;
    
    // Base quality on average text per page
    const avgTextPerPage = this.metrics.textExtracted / this.metrics.pagesProcessed;
    
    // Typical legal document has 500-2000 characters per page
    const minExpected = 200;  // Very sparse text
    const maxExpected = 3000; // Very dense text
    
    const normalized = Math.min(1, Math.max(0, 
      (avgTextPerPage - minExpected) / (maxExpected - minExpected)
    ));
    
    return Math.round(normalized * 100) / 100;
  }

  /**
   * Calculate structure quality based on tables and entities found
   */
  private calculateStructureQuality(): number {
    if (this.metrics.pagesProcessed === 0) return 0;
    
    // Quality based on structural elements found
    const tablesPerPage = this.metrics.tablesFound / this.metrics.pagesProcessed;
    const entitiesPerPage = this.metrics.entitiesFound / this.metrics.pagesProcessed;
    
    // Normalize based on typical legal document expectations
    const tableScore = Math.min(1, tablesPerPage / 0.5); // 0.5 tables per page is good
    const entityScore = Math.min(1, entitiesPerPage / 5);   // 5 entities per page is good
    
    const structureQuality = (tableScore + entityScore) / 2;
    return Math.round(structureQuality * 100) / 100;
  }

  /**
   * Reset metrics for new document
   */
  reset(fileName?: string, fileSize?: number) {
    this.metrics = {
      startTime: Date.now(),
      pagesProcessed: 0,
      totalPages: 0,
      ocrPagesProcessed: 0,
      ocrPagesNeeded: 0,
      textExtracted: 0,
      ocrTextExtracted: 0,
      tablesFound: 0,
      entitiesFound: 0,
      processingTimes: [],
      fileName,
      fileSize,
      ocrWorkersActive: 0,
      ocrWorkersTotal: this.metrics.ocrWorkersTotal
    };
  }

  /**
   * Get current metrics summary
   */
  getMetrics(): ProgressMetrics {
    return { ...this.metrics };
  }
}

// Singleton instance for global use
export const globalProgressTracker = new EnhancedProgressTracker();

export default EnhancedProgressTracker;