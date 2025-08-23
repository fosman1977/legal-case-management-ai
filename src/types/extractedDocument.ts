/**
 * Enhanced document types with PDF-Extract-Kit integration
 */

import { EntityExtractionResult } from '../utils/unifiedAIClient';

// Main document structure
export interface ExtractedDocument {
  // Core content
  text: string;
  entities: EntityExtractionResult;
  
  // Enhanced extraction from PDF-Extract-Kit
  layout: DocumentLayout;
  tables: ExtractedTable[];
  images: ExtractedImage[];
  formulas: ExtractedFormula[];
  metadata: DocumentMetadata;
}

// Layout and structure
export interface DocumentLayout {
  pages: PageLayout[];
  structure: DocumentNode[];
}

export interface PageLayout {
  pageNumber: number;
  width: number;
  height: number;
  elements: LayoutElement[];
}

export interface LayoutElement {
  type: 'text' | 'title' | 'header' | 'footer' | 'table' | 'image' | 'formula' | 'list' | 'paragraph';
  bbox: [number, number, number, number]; // x1, y1, x2, y2
  content: string;
  confidence: number;
}

export interface DocumentNode {
  type: 'page' | 'section' | 'subsection' | 'paragraph' | 'list';
  title?: string;
  pageNumber?: number;
  children: DocumentNode[];
  content?: string[];
}

// Table extraction
export interface ExtractedTable {
  id: string;
  pageNumber: number;
  bbox: [number, number, number, number];
  html: string;
  markdown: string;
  data: any[][];
  headers: string[];
  confidence: number;
  rows: number;
  columns: number;
}

// Image extraction
export interface ExtractedImage {
  id: string;
  pageNumber: number;
  bbox: [number, number, number, number];
  base64: string;
  caption?: string;
  type: 'photo' | 'diagram' | 'chart' | 'signature' | 'logo';
  confidence: number;
  width: number;
  height: number;
}

// Formula extraction
export interface ExtractedFormula {
  id: string;
  pageNumber: number;
  bbox: [number, number, number, number];
  type: 'inline' | 'block';
  latex: string;
  rendered?: string;
  context: string;
  confidence: number;
}

// Document metadata
export interface DocumentMetadata {
  totalPages: number;
  totalTables: number;
  totalImages: number;
  totalFormulas: number;
  textLength: number;
  extractionTime: string;
  fileSize?: number;
  fileName?: string;
  processingTime?: number;
}

// Extraction options
export interface ExtractionOptions {
  extractText?: boolean;
  extractTables?: boolean;
  extractImages?: boolean;
  extractFormulas?: boolean;
  outputFormat?: 'json' | 'html' | 'markdown';
  enhanceOCR?: boolean;
  preserveLayout?: boolean;
  detectHandwriting?: boolean;
}

// Processing status
export interface ExtractionStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  stage: string;
  error?: string;
  estimatedTimeRemaining?: number;
}

// Enhanced case document with extraction data
export interface EnhancedCaseDocument {
  // Base document properties
  id: string;
  caseId: string;
  name: string;
  type: string;
  uploadDate: string;
  size: number;
  
  // Extraction results
  extractedContent?: ExtractedDocument;
  extractionStatus: ExtractionStatus;
  
  // Processing flags
  needsReprocessing: boolean;
  lastProcessed?: string;
  processingVersion: string;
}

// Table analysis results
export interface TableAnalysis {
  tableId: string;
  type: 'financial' | 'chronology' | 'evidence' | 'contacts' | 'damages' | 'schedule' | 'other';
  entities: {
    dates: string[];
    amounts: string[];
    persons: string[];
    events: string[];
  };
  structure: {
    hasHeaders: boolean;
    hasSubtotals: boolean;
    hasTotals: boolean;
    isNumerical: boolean;
  };
  relevance: number; // 0-1 score
  suggested_actions: string[];
}

// Image analysis results
export interface ImageAnalysis {
  imageId: string;
  type: 'evidence' | 'signature' | 'diagram' | 'photo' | 'document_scan' | 'other';
  entities: {
    text?: string; // OCR text if applicable
    persons?: string[];
    objects?: string[];
    locations?: string[];
  };
  quality: {
    resolution: number;
    clarity: number;
    hasWatermark: boolean;
    isColor: boolean;
  };
  relevance: number; // 0-1 score
  suggested_actions: string[];
}

// Formula analysis results
export interface FormulaAnalysis {
  formulaId: string;
  type: 'calculation' | 'interest' | 'damages' | 'percentage' | 'statistics' | 'other';
  variables: string[];
  result?: number | string;
  context: string;
  relevance: number; // 0-1 score
  suggested_actions: string[];
}

// Extraction queue item
export interface ExtractionQueueItem {
  documentId: string;
  caseId: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  options: ExtractionOptions;
  addedAt: string;
  estimatedDuration: number;
}

// Service configuration
export interface PDFExtractKitConfig {
  apiUrl: string;
  timeout: number;
  retryAttempts: number;
  maxFileSize: number; // bytes
  supportedFormats: string[];
  enableCaching: boolean;
  cacheExpiry: number; // seconds
}

// Error types
export interface ExtractionError {
  code: 'TIMEOUT' | 'INVALID_FILE' | 'PROCESSING_ERROR' | 'SERVICE_UNAVAILABLE' | 'QUOTA_EXCEEDED';
  message: string;
  details?: any;
  recoverable: boolean;
  retryAfter?: number; // seconds
}

// Statistics and analytics
export interface ExtractionStats {
  totalDocuments: number;
  totalTables: number;
  totalImages: number;
  totalFormulas: number;
  averageProcessingTime: number;
  successRate: number;
  errorBreakdown: Record<string, number>;
  mostCommonTableTypes: Record<string, number>;
  mostCommonImageTypes: Record<string, number>;
}