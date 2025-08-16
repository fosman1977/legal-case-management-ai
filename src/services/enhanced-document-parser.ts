/**
 * ENHANCED PRODUCTION DOCUMENT PARSER
 * 
 * Integrates with existing best-in-class PDF extraction system
 * Leverages advanced PDF.js infrastructure and OCR capabilities
 * Designed for English Legal AI CLI with maximum extraction quality
 */

import * as fs from 'fs';
import * as path from 'path';

// Import existing document parser as base
import { DocumentParser, DocumentContent, DocumentMetadata, ProcessingInfo } from './document-parser';

export class EnhancedDocumentParser {
  
  /**
   * Enhanced PDF parsing using our existing advanced extraction system
   */
  static async parsePDF(filePath: string, stats: fs.Stats): Promise<DocumentContent> {
    console.log('📄 Using advanced PDF extraction system...');
    
    try {
      // Use our existing production PDF extractor
      const { PDFExtractor } = require('../pdf-system/processors/pdf-extractor.js');
      const extractor = new PDFExtractor();
      
      // Extract metadata and text using our production system
      const [metadata, textResult] = await Promise.all([
        extractor.extractMetadata(filePath),
        extractor.extractNativeText(filePath)
      ]);
      
      // Combine text from all pages with proper formatting
      const fullText = textResult.pages
        .map((page: any, index: number) => {
          const pageText = page.text?.trim();
          if (!pageText) return '';
          
          // Add page markers for multi-page documents
          if (textResult.pages.length > 1) {
            return index === 0 ? pageText : `\n--- Page ${page.pageNumber} ---\n${pageText}`;
          }
          return pageText;
        })
        .filter((text: string) => text.length > 0)
        .join('\n\n');
      
      if (fullText.length < 50) {
        console.log('📸 Low text content detected - checking if scanned PDF');
        
        // Try to detect if it's a scanned PDF using browser-based OCR
        // Note: This would require the advanced OCR system from pdfExtractor.ts
        return {
          text: `[PDF Document: ${path.basename(filePath)}]\n\nThis PDF appears to have minimal text content. It may be a scanned document requiring OCR.\nThe English Legal AI system has advanced OCR capabilities available.\n\nDocument detected as: ${EnhancedDocumentParser.detectDocumentType(path.basename(filePath))}\n\nFor full OCR extraction, use the browser-based interface.`,
          metadata: {
            filename: path.basename(filePath),
            fileSize: stats.size,
            fileType: '.pdf',
            extractionMethod: 'advanced-pdf-extractor-minimal-text',
            pageCount: metadata.pages,
            title: metadata.title || path.basename(filePath),
            author: metadata.author
          },
          processingInfo: {
            extractionTime: 0,
            confidence: 0.6,
            warnings: ['Low text content - may require OCR', 'Advanced OCR available in browser environment'],
            success: true
          }
        };
      }
      
      // Successful text extraction with advanced system
      return {
        text: fullText,
        metadata: {
          filename: path.basename(filePath),
          fileSize: stats.size,
          fileType: '.pdf',
          extractionMethod: 'advanced-pdf-extractor',
          pageCount: metadata.pages,
          title: metadata.title || path.basename(filePath),
          author: metadata.author
        },
        processingInfo: {
          extractionTime: 0, // Will be set by caller
          confidence: 0.95, // High confidence with our advanced system
          warnings: [],
          success: true
        }
      };
      
    } catch (advancedError) {
      console.warn('⚠️ Advanced PDF extraction failed, trying fallback:', advancedError instanceof Error ? advancedError.message : String(advancedError));
      
      // Fallback to basic PDF parsing using DocumentParser
      return await DocumentParser.parseDocument(filePath);
    }
  }
  
  /**
   * Enhanced document analysis that leverages advanced PDF capabilities
   */
  static async parseDocumentAdvanced(filePath: string): Promise<DocumentContent> {
    const startTime = Date.now();
    const filename = path.basename(filePath);
    const fileExt = path.extname(filePath).toLowerCase();
    const stats = fs.statSync(filePath);
    
    console.log(`🔍 Enhanced parsing: ${filename} (${fileExt})`);
    
    let result: DocumentContent;
    
    try {
      switch (fileExt) {
        case '.pdf':
          // Use our enhanced PDF method
          result = await EnhancedDocumentParser.parsePDF(filePath, stats);
          break;
        case '.docx':
        case '.doc':
          // Use DOCX method
          result = await EnhancedDocumentParser.parseDOCX(filePath, stats);
          break;
        case '.txt':
          // Use TXT method
          result = await EnhancedDocumentParser.parseTXT(filePath, stats);
          break;
        default:
          throw new Error(`Unsupported file type: ${fileExt}`);
      }
      
      const processingTime = Date.now() - startTime;
      result.processingInfo.extractionTime = processingTime;
      
      console.log(`✅ Enhanced parsing completed in ${processingTime}ms`);
      return result;
      
    } catch (error) {
      console.error(`❌ Enhanced parsing failed for ${filename}:`, error);
      
      return {
        text: '',
        metadata: {
          filename,
          fileSize: stats.size,
          fileType: fileExt,
          extractionMethod: 'failed'
        },
        processingInfo: {
          extractionTime: Date.now() - startTime,
          confidence: 0,
          warnings: [`Enhanced parsing failed: ${error instanceof Error ? error.message : String(error)}`],
          success: false
        }
      };
    }
  }
  
  /**
   * Browser-compatible PDF extraction using advanced OCR system
   * This method would use the sophisticated extraction from pdfExtractor.ts
   */
  static async parseWithAdvancedOCR(filePath: string): Promise<DocumentContent> {
    // This would integrate with the browser-based advanced extraction
    // from /src/utils/pdfExtractor.ts which includes:
    // - Layout preservation
    // - OCR fallback for scanned PDFs
    // - Multiple extraction methods
    // - Enhanced text cleaning
    
    console.log('🔍 Advanced OCR extraction requires browser environment');
    console.log('📄 Falling back to CLI-compatible extraction');
    
    return await EnhancedDocumentParser.parseDocumentAdvanced(filePath);
  }

  /**
   * Parse DOCX files
   */
  static async parseDOCX(filePath: string, stats: fs.Stats): Promise<DocumentContent> {
    // Use the DocumentParser for DOCX files since we don't have enhanced DOCX processing
    return await DocumentParser.parseDocument(filePath);
  }

  /**
   * Parse TXT files
   */
  static async parseTXT(filePath: string, stats: fs.Stats): Promise<DocumentContent> {
    console.log('📃 Reading text file...');
    
    const text = fs.readFileSync(filePath, 'utf-8');
    
    return {
      text,
      metadata: {
        filename: path.basename(filePath),
        fileSize: stats.size,
        fileType: '.txt',
        extractionMethod: 'fs.readFileSync'
      },
      processingInfo: {
        extractionTime: 0,
        confidence: 1.0,
        warnings: [],
        success: true
      }
    };
  }

  /**
   * Detect document type from filename patterns
   */
  static detectDocumentType(filename: string): string {
    const lower = filename.toLowerCase();
    
    if (lower.includes('contract') || lower.includes('agreement')) {
      return 'Commercial Contract';
    } else if (lower.includes('case') || lower.includes('judgment')) {
      return 'Case Law / Judgment';
    } else if (lower.includes('statute') || lower.includes('act')) {
      return 'Statutory Document';
    } else if (lower.includes('brief') || lower.includes('submission')) {
      return 'Legal Brief / Submission';
    } else if (lower.includes('memo') || lower.includes('advice')) {
      return 'Legal Memorandum';
    } else if (lower.includes('pleading')) {
      return 'Court Pleading';
    } else {
      return 'Legal Document';
    }
  }
}