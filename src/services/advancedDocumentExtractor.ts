/**
 * ADVANCED DOCUMENT EXTRACTOR
 * Next-generation document processing with comprehensive format support
 */

import { UniversalDocumentExtractor } from './universalDocumentExtractor';
import { PDFTextExtractor } from './enhancedBrowserPdfExtractor';
import * as XLSX from 'xlsx';
import * as Papa from 'papaparse';
import JSZip from 'jszip';
// @ts-ignore
import { parse as parseEmail } from 'emailjs-mime-parser';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import TurndownService from 'turndown';
import { convert as htmlToText } from 'html-to-text';
// @ts-ignore
import { detect as detectLanguage } from 'langdetect-js';
import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, PDFDropdown } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Web Worker for parallel processing
let extractionWorker: Worker | null = null;

// Cache for extraction results
const extractionCache = new Map<string, CachedResult>();

interface CachedResult {
  result: AdvancedExtractionResult;
  timestamp: number;
  fileHash: string;
}

interface AdvancedExtractionResult {
  // Core extraction
  text: string;
  format: string;
  method: string;
  processingTime: number;
  
  // Metadata
  metadata: {
    fileName: string;
    fileSize: number;
    fileType: string;
    pages?: number;
    wordCount?: number;
    characterCount?: number;
    language?: string;
    encoding?: string;
    created?: Date;
    modified?: Date;
    author?: string;
    title?: string;
  };
  
  // Advanced features
  entities?: any[];
  tables?: any[];
  images?: any[];
  forms?: FormField[];
  annotations?: Annotation[];
  bookmarks?: Bookmark[];
  signatures?: DigitalSignature[];
  attachments?: Attachment[];
  
  // Spreadsheet specific
  sheets?: SheetData[];
  formulas?: Formula[];
  charts?: ChartData[];
  
  // Email specific
  emailHeaders?: EmailHeaders;
  emailAttachments?: EmailAttachment[];
  
  // Structure
  structure?: {
    headings: Heading[];
    paragraphs: number;
    sections: Section[];
    toc?: TableOfContents[];
    footnotes?: Footnote[];
    crossReferences?: CrossReference[];
  };
  
  // Quality and performance
  quality?: QualityMetrics;
  performance?: PerformanceMetrics;
  warnings?: string[];
  errors?: string[];
}

interface FormField {
  name: string;
  type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'signature';
  value: any;
  required: boolean;
  page?: number;
  bounds?: { x: number; y: number; width: number; height: number };
}

interface Annotation {
  type: 'highlight' | 'note' | 'underline' | 'strikeout' | 'ink' | 'stamp';
  content: string;
  author?: string;
  page: number;
  bounds?: { x: number; y: number; width: number; height: number };
  created?: Date;
  color?: string;
}

interface Bookmark {
  title: string;
  page: number;
  level: number;
  children?: Bookmark[];
}

interface DigitalSignature {
  signer: string;
  date: Date;
  valid: boolean;
  reason?: string;
  location?: string;
  contactInfo?: string;
  certificate?: any;
}

interface Attachment {
  name: string;
  size: number;
  type: string;
  data?: ArrayBuffer;
}

interface SheetData {
  name: string;
  rows: any[][];
  mergedCells?: string[];
  hiddenRows?: number[];
  hiddenColumns?: number[];
  frozen?: { rows: number; columns: number };
}

interface Formula {
  sheet: string;
  cell: string;
  formula: string;
  result: any;
}

interface ChartData {
  type: string;
  title?: string;
  sheet: string;
  range: string;
}

interface EmailHeaders {
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  date: Date;
  messageId?: string;
  inReplyTo?: string;
  references?: string[];
}

interface EmailAttachment {
  filename: string;
  contentType: string;
  size: number;
  content?: ArrayBuffer;
}

interface Heading {
  text: string;
  level: number;
  page?: number;
  id?: string;
}

interface Section {
  title: string;
  startPage: number;
  endPage: number;
  content?: string;
  subsections?: Section[];
}

interface TableOfContents {
  title: string;
  page: number;
  level: number;
  id?: string;
}

interface Footnote {
  id: string;
  text: string;
  reference: string;
  page: number;
}

interface CrossReference {
  source: string;
  target: string;
  type: 'citation' | 'footnote' | 'figure' | 'table' | 'section';
  page: number;
}

interface QualityMetrics {
  textQuality: number;
  structureQuality: number;
  extractionCompleteness: number;
  confidence: number;
}

interface PerformanceMetrics {
  extractionTime: number;
  cacheHit: boolean;
  memoryUsed: number;
  chunksProcessed?: number;
  parallelTasks?: number;
}

export class AdvancedDocumentExtractor {
  private static readonly CACHE_TTL = 3600000; // 1 hour
  private static readonly CHUNK_SIZE = 1048576; // 1MB for streaming
  
  /**
   * Initialize Web Worker for parallel processing
   */
  private static initializeWorker(): void {
    if (!extractionWorker && typeof Worker !== 'undefined') {
      // Create inline worker for extraction tasks
      const workerCode = `
        self.onmessage = function(e) {
          const { task, data } = e.data;
          try {
            let result;
            switch(task) {
              case 'detectLanguage':
                // Simple language detection
                result = detectLanguageSimple(data.text);
                break;
              case 'extractEntities':
                // Entity extraction
                result = extractEntitiesSimple(data.text);
                break;
              case 'analyzeStructure':
                // Structure analysis
                result = analyzeStructureSimple(data.text);
                break;
              default:
                result = null;
            }
            self.postMessage({ success: true, result });
          } catch (error) {
            self.postMessage({ success: false, error: error.message });
          }
        };
        
        function detectLanguageSimple(text) {
          // Simple language detection based on character patterns
          const patterns = {
            en: /\\b(the|and|of|to|in|is|was|were)\\b/gi,
            es: /\\b(el|la|de|que|y|en|es|por)\\b/gi,
            fr: /\\b(le|de|la|et|un|une|est|dans)\\b/gi,
            de: /\\b(der|die|das|und|in|von|ist|mit)\\b/gi,
          };
          
          let maxCount = 0;
          let detectedLang = 'en';
          
          for (const [lang, pattern] of Object.entries(patterns)) {
            const matches = text.match(pattern);
            if (matches && matches.length > maxCount) {
              maxCount = matches.length;
              detectedLang = lang;
            }
          }
          
          return detectedLang;
        }
        
        function extractEntitiesSimple(text) {
          const entities = [];
          
          // Extract emails
          const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g;
          const emails = text.match(emailPattern) || [];
          emails.forEach(email => {
            entities.push({ type: 'email', value: email });
          });
          
          // Extract phone numbers
          const phonePattern = /\\+?[1-9]\\d{1,14}|\\(\\d{3}\\)\\s?\\d{3}-\\d{4}/g;
          const phones = text.match(phonePattern) || [];
          phones.forEach(phone => {
            entities.push({ type: 'phone', value: phone });
          });
          
          // Extract URLs
          const urlPattern = /https?:\\/\\/[^\\s]+/g;
          const urls = text.match(urlPattern) || [];
          urls.forEach(url => {
            entities.push({ type: 'url', value: url });
          });
          
          return entities;
        }
        
        function analyzeStructureSimple(text) {
          const lines = text.split('\\n');
          const headings = [];
          let paragraphCount = 0;
          
          lines.forEach((line, index) => {
            // Detect headings (all caps or numbered)
            if (line.length > 0 && line.length < 100) {
              if (line === line.toUpperCase() && line.match(/[A-Z]/)) {
                headings.push({ text: line, level: 1, line: index });
              } else if (line.match(/^\\d+\\.\\s+/)) {
                headings.push({ text: line, level: 2, line: index });
              }
            }
            
            // Count paragraphs
            if (line.length > 50) {
              paragraphCount++;
            }
          });
          
          return { headings, paragraphCount };
        }
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      extractionWorker = new Worker(workerUrl);
    }
  }
  
  /**
   * Main extraction method with advanced features
   */
  static async extract(
    file: File,
    options: {
      useCache?: boolean;
      streaming?: boolean;
      parallel?: boolean;
      extractAll?: boolean;
      // Feature flags
      extractTables?: boolean;
      extractForms?: boolean;
      extractAnnotations?: boolean;
      extractBookmarks?: boolean;
      extractSignatures?: boolean;
      extractAttachments?: boolean;
      extractImages?: boolean;
      extractFormulas?: boolean;
      extractCharts?: boolean;
      // Advanced options
      detectLanguage?: boolean;
      semanticChunking?: boolean;
      crossReferences?: boolean;
      maxPages?: number;
      timeout?: number;
    } = {}
  ): Promise<AdvancedExtractionResult> {
    const startTime = Date.now();
    
    // Check cache first
    if (options.useCache !== false) {
      const cached = await this.checkCache(file);
      if (cached) {
        console.log('📦 Cache hit for:', file.name);
        return cached;
      }
    }
    
    // Initialize worker if parallel processing is enabled
    if (options.parallel !== false) {
      this.initializeWorker();
    }
    
    console.log(`🚀 Advanced extraction starting: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    
    try {
      // Detect format
      const format = await this.detectFormat(file);
      let result: AdvancedExtractionResult;
      
      // Route to appropriate extractor
      switch (format) {
        case 'pdf':
          result = await this.extractFromPDF(file, options);
          break;
        case 'xlsx':
        case 'xls':
          result = await this.extractFromSpreadsheet(file, options);
          break;
        case 'csv':
          result = await this.extractFromCSV(file, options);
          break;
        case 'docx':
          result = await this.extractFromWord(file, options);
          break;
        case 'pptx':
        case 'ppt':
          result = await this.extractFromPowerPoint(file, options);
          break;
        case 'eml':
        case 'msg':
          result = await this.extractFromEmail(file, options);
          break;
        case 'html':
        case 'htm':
          result = await this.extractFromHTML(file, options);
          break;
        case 'md':
          result = await this.extractFromMarkdown(file, options);
          break;
        default:
          // Fallback to universal extractor
          const universalResult = await UniversalDocumentExtractor.extract(file, options);
          result = this.convertToAdvancedResult(universalResult);
      }
      
      // Post-processing
      if (options.detectLanguage) {
        result.metadata.language = await this.detectLanguage(result.text);
      }
      
      if (options.semanticChunking) {
        result.structure = {
          ...result.structure,
          sections: await this.performSemanticChunking(result.text)
        };
      }
      
      if (options.crossReferences) {
        result.structure = {
          ...result.structure,
          crossReferences: await this.extractCrossReferences(result.text)
        };
      }
      
      // Calculate metrics
      result.processingTime = Date.now() - startTime;
      result.performance = {
        extractionTime: result.processingTime,
        cacheHit: false,
        memoryUsed: this.estimateMemoryUsage(result),
        parallelTasks: options.parallel ? 1 : 0
      };
      
      result.quality = this.assessQuality(result);
      
      // Cache the result
      if (options.useCache !== false) {
        await this.cacheResult(file, result);
      }
      
      console.log(`✅ Advanced extraction complete in ${result.processingTime}ms`);
      return result;
      
    } catch (error) {
      console.error('Advanced extraction failed:', error);
      return this.createErrorResult(file, error, Date.now() - startTime);
    }
  }
  
  /**
   * Extract from PDF with advanced features
   */
  private static async extractFromPDF(
    file: File,
    options: any
  ): Promise<AdvancedExtractionResult> {
    console.log('📄 Extracting from PDF with advanced features...');
    
    // Get basic extraction from existing extractor
    const basicResult = await PDFTextExtractor.extract(file, {
      extractTables: options.extractTables,
      extractEntities: true,
      maxPages: options.maxPages
    });
    
    // Load PDF for advanced features
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    
    const result: AdvancedExtractionResult = {
      text: basicResult.text,
      format: 'pdf',
      method: basicResult.method,
      processingTime: basicResult.processingTime,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        pages: pdfDoc.getPageCount(),
        wordCount: this.countWords(basicResult.text),
        characterCount: basicResult.text.length,
        author: pdfDoc.getAuthor(),
        title: pdfDoc.getTitle(),
        created: pdfDoc.getCreationDate(),
        modified: pdfDoc.getModificationDate()
      },
      entities: basicResult.entities,
      tables: basicResult.tables,
      quality: basicResult.quality
    };
    
    // Extract forms
    if (options.extractForms !== false) {
      result.forms = await this.extractPDFForms(pdfDoc);
    }
    
    // Extract annotations
    if (options.extractAnnotations) {
      result.annotations = await this.extractPDFAnnotations(arrayBuffer);
    }
    
    // Extract bookmarks
    if (options.extractBookmarks) {
      result.bookmarks = await this.extractPDFBookmarks(arrayBuffer);
    }
    
    // Extract digital signatures
    if (options.extractSignatures) {
      result.signatures = await this.extractPDFSignatures(pdfDoc);
    }
    
    // Extract attachments
    if (options.extractAttachments) {
      result.attachments = await this.extractPDFAttachments(pdfDoc);
    }
    
    return result;
  }
  
  /**
   * Extract PDF form fields
   */
  private static async extractPDFForms(pdfDoc: PDFDocument): Promise<FormField[]> {
    const forms: FormField[] = [];
    
    try {
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      
      fields.forEach(field => {
        const fieldName = field.getName();
        let fieldType: FormField['type'] = 'text';
        let fieldValue: any = '';
        
        if (field instanceof PDFTextField) {
          fieldType = 'text';
          fieldValue = field.getText();
        } else if (field instanceof PDFCheckBox) {
          fieldType = 'checkbox';
          fieldValue = field.isChecked();
        } else if (field instanceof PDFDropdown) {
          fieldType = 'dropdown';
          fieldValue = field.getSelected();
        }
        
        forms.push({
          name: fieldName,
          type: fieldType,
          value: fieldValue,
          required: false // PDF-lib doesn't expose this
        });
      });
      
      console.log(`📝 Extracted ${forms.length} form fields`);
    } catch (error) {
      console.warn('Form extraction not available:', error);
    }
    
    return forms;
  }
  
  /**
   * Extract PDF annotations using PDF.js
   */
  private static async extractPDFAnnotations(arrayBuffer: ArrayBuffer): Promise<Annotation[]> {
    const annotations: Annotation[] = [];
    
    try {
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const pageAnnotations = await page.getAnnotations();
        
        pageAnnotations.forEach((annot: any) => {
          if (annot.subtype && annot.contents) {
            annotations.push({
              type: annot.subtype.toLowerCase() as Annotation['type'],
              content: annot.contents,
              author: annot.author,
              page: pageNum,
              bounds: annot.rect ? {
                x: annot.rect[0],
                y: annot.rect[1],
                width: annot.rect[2] - annot.rect[0],
                height: annot.rect[3] - annot.rect[1]
              } : undefined,
              created: annot.creationDate ? new Date(annot.creationDate) : undefined,
              color: annot.color
            });
          }
        });
      }
      
      console.log(`💬 Extracted ${annotations.length} annotations`);
    } catch (error) {
      console.warn('Annotation extraction failed:', error);
    }
    
    return annotations;
  }
  
  /**
   * Extract PDF bookmarks/outline
   */
  private static async extractPDFBookmarks(arrayBuffer: ArrayBuffer): Promise<Bookmark[]> {
    const bookmarks: Bookmark[] = [];
    
    try {
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const outline = await pdf.getOutline();
      
      if (outline) {
        const processOutline = (items: any[], level: number = 0): Bookmark[] => {
          return items.map(item => ({
            title: item.title,
            page: item.dest ? 1 : 1, // Simplified - would need dest resolution
            level,
            children: item.items ? processOutline(item.items, level + 1) : undefined
          }));
        };
        
        bookmarks.push(...processOutline(outline));
      }
      
      console.log(`🔖 Extracted ${bookmarks.length} bookmarks`);
    } catch (error) {
      console.warn('Bookmark extraction failed:', error);
    }
    
    return bookmarks;
  }
  
  /**
   * Extract PDF digital signatures
   */
  private static async extractPDFSignatures(pdfDoc: PDFDocument): Promise<DigitalSignature[]> {
    const signatures: DigitalSignature[] = [];
    
    try {
      // Note: pdf-lib has limited signature support
      // This is a simplified implementation
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      
      fields.forEach(field => {
        if (field.getName().toLowerCase().includes('signature')) {
          signatures.push({
            signer: 'Unknown',
            date: new Date(),
            valid: false, // Would need crypto verification
            reason: 'Document signed'
          });
        }
      });
      
      console.log(`✍️ Found ${signatures.length} signature fields`);
    } catch (error) {
      console.warn('Signature extraction failed:', error);
    }
    
    return signatures;
  }
  
  /**
   * Extract PDF attachments
   */
  private static async extractPDFAttachments(pdfDoc: PDFDocument): Promise<Attachment[]> {
    const attachments: Attachment[] = [];
    
    try {
      // Note: pdf-lib has limited attachment support
      // This would need enhancement with a library that supports attachments
      console.log('📎 Attachment extraction not yet implemented for PDFs');
    } catch (error) {
      console.warn('Attachment extraction failed:', error);
    }
    
    return attachments;
  }
  
  /**
   * Extract from Excel/spreadsheet files
   */
  private static async extractFromSpreadsheet(
    file: File,
    options: any
  ): Promise<AdvancedExtractionResult> {
    console.log('📊 Extracting from spreadsheet...');
    
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { 
      type: 'array',
      cellFormula: true,
      cellHTML: true,
      cellDates: true
    });
    
    const sheets: SheetData[] = [];
    const formulas: Formula[] = [];
    const allText: string[] = [];
    const tables: any[] = [];
    
    // Process each sheet
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON for easy processing
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',
        raw: false
      });
      
      sheets.push({
        name: sheetName,
        rows: jsonData as any[][],
        mergedCells: worksheet['!merges']?.map((merge: any) => 
          XLSX.utils.encode_range(merge)
        ),
        frozen: worksheet['!freeze'] ? {
          rows: worksheet['!freeze'].rows || 0,
          columns: worksheet['!freeze'].cols || 0
        } : undefined
      });
      
      // Extract text for search
      const sheetText = XLSX.utils.sheet_to_txt(worksheet);
      allText.push(`Sheet: ${sheetName}\n${sheetText}`);
      
      // Extract formulas if requested
      if (options.extractFormulas) {
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        for (let row = range.s.r; row <= range.e.r; row++) {
          for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddr = XLSX.utils.encode_cell({ r: row, c: col });
            const cell = worksheet[cellAddr];
            if (cell && cell.f) {
              formulas.push({
                sheet: sheetName,
                cell: cellAddr,
                formula: cell.f,
                result: cell.v
              });
            }
          }
        }
      }
      
      // Convert to HTML table for better structure
      const htmlTable = XLSX.utils.sheet_to_html(worksheet);
      tables.push({
        sheetName,
        html: htmlTable,
        rows: jsonData
      });
    });
    
    const fullText = allText.join('\n\n');
    
    return {
      text: fullText,
      format: file.name.endsWith('.xlsx') ? 'xlsx' : 'xls',
      method: 'spreadsheet',
      processingTime: 0,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        wordCount: this.countWords(fullText),
        characterCount: fullText.length,
        author: workbook.Props?.Author,
        title: workbook.Props?.Title,
        created: workbook.Props?.CreatedDate,
        modified: workbook.Props?.ModifiedDate
      },
      sheets,
      formulas,
      tables,
      warnings: []
    };
  }
  
  /**
   * Extract from CSV files
   */
  private static async extractFromCSV(
    file: File,
    options: any
  ): Promise<AdvancedExtractionResult> {
    console.log('📊 Extracting from CSV...');
    
    const text = await file.text();
    
    // Parse CSV
    const parseResult = Papa.parse(text, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => results,
      error: (error) => console.error('CSV parse error:', error)
    });
    
    // Convert to sheet format
    const rows: any[][] = [
      parseResult.meta.fields || [], // Headers
      ...parseResult.data.map((row: any) => 
        (parseResult.meta.fields || []).map(field => row[field])
      )
    ];
    
    const sheets: SheetData[] = [{
      name: 'Sheet1',
      rows
    }];
    
    return {
      text,
      format: 'csv',
      method: 'csv',
      processingTime: 0,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        wordCount: this.countWords(text),
        characterCount: text.length
      },
      sheets,
      tables: [{
        headers: parseResult.meta.fields || [],
        rows: parseResult.data,
        markdown: this.csvToMarkdown(parseResult.data, parseResult.meta.fields || [])
      }],
      warnings: parseResult.errors?.map((e: any) => e.message) || []
    };
  }
  
  /**
   * Extract from PowerPoint files
   */
  private static async extractFromPowerPoint(
    file: File,
    options: any
  ): Promise<AdvancedExtractionResult> {
    console.log('📊 Extracting from PowerPoint...');
    
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    const slideTexts: string[] = [];
    const slideNotes: string[] = [];
    let slideCount = 0;
    
    // Extract slide content
    const slideFiles = Object.keys(zip.files).filter(name => 
      name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
    );
    
    for (const slideFile of slideFiles) {
      slideCount++;
      const content = await zip.file(slideFile)?.async('string');
      if (content) {
        // Extract text from XML (simplified)
        const textMatches = content.match(/<a:t[^>]*>([^<]+)<\/a:t>/g) || [];
        const slideText = textMatches
          .map(match => match.replace(/<[^>]+>/g, ''))
          .join(' ');
        slideTexts.push(`Slide ${slideCount}: ${slideText}`);
      }
    }
    
    // Extract notes
    const noteFiles = Object.keys(zip.files).filter(name => 
      name.startsWith('ppt/notesSlides/') && name.endsWith('.xml')
    );
    
    for (const noteFile of noteFiles) {
      const content = await zip.file(noteFile)?.async('string');
      if (content) {
        const textMatches = content.match(/<a:t[^>]*>([^<]+)<\/a:t>/g) || [];
        const noteText = textMatches
          .map(match => match.replace(/<[^>]+>/g, ''))
          .join(' ');
        slideNotes.push(noteText);
      }
    }
    
    const fullText = [...slideTexts, ...slideNotes].join('\n\n');
    
    return {
      text: fullText,
      format: file.name.endsWith('.pptx') ? 'pptx' : 'ppt',
      method: 'powerpoint',
      processingTime: 0,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        pages: slideCount,
        wordCount: this.countWords(fullText),
        characterCount: fullText.length
      },
      structure: {
        headings: slideTexts.map((text, i) => ({
          text: `Slide ${i + 1}`,
          level: 1,
          page: i + 1
        })),
        paragraphs: slideTexts.length,
        sections: []
      },
      warnings: []
    };
  }
  
  /**
   * Extract from email files
   */
  private static async extractFromEmail(
    file: File,
    options: any
  ): Promise<AdvancedExtractionResult> {
    console.log('📧 Extracting from email...');
    
    const text = await file.text();
    
    // Parse email (simplified - would need proper MIME parsing)
    const lines = text.split('\n');
    const headers: EmailHeaders = {
      from: '',
      to: [],
      subject: '',
      date: new Date()
    };
    
    let bodyStart = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('From:')) headers.from = line.substring(5).trim();
      if (line.startsWith('To:')) headers.to = [line.substring(3).trim()];
      if (line.startsWith('Subject:')) headers.subject = line.substring(8).trim();
      if (line.startsWith('Date:')) headers.date = new Date(line.substring(5).trim());
      if (line === '') {
        bodyStart = i + 1;
        break;
      }
    }
    
    const body = lines.slice(bodyStart).join('\n');
    
    return {
      text: body,
      format: file.name.endsWith('.eml') ? 'eml' : 'msg',
      method: 'email',
      processingTime: 0,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        wordCount: this.countWords(body),
        characterCount: body.length,
        title: headers.subject
      },
      emailHeaders: headers,
      emailAttachments: [],
      warnings: []
    };
  }
  
  /**
   * Extract from HTML files
   */
  private static async extractFromHTML(
    file: File,
    options: any
  ): Promise<AdvancedExtractionResult> {
    console.log('🌐 Extracting from HTML...');
    
    const html = await file.text();
    
    // Sanitize HTML
    const clean = DOMPurify.sanitize(html);
    
    // Convert to text
    const text = htmlToText(clean, {
      wordwrap: false,
      preserveNewlines: true
    });
    
    // Extract structure
    const headings = this.extractHTMLHeadings(clean);
    
    return {
      text,
      format: 'html',
      method: 'html',
      processingTime: 0,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        wordCount: this.countWords(text),
        characterCount: text.length
      },
      structure: {
        headings,
        paragraphs: (clean.match(/<p[^>]*>/g) || []).length,
        sections: []
      },
      warnings: []
    };
  }
  
  /**
   * Extract from Markdown files
   */
  private static async extractFromMarkdown(
    file: File,
    options: any
  ): Promise<AdvancedExtractionResult> {
    console.log('📝 Extracting from Markdown...');
    
    const markdown = await file.text();
    
    // Convert to HTML then to text for structure
    const html = marked(markdown);
    const text = htmlToText(html, {
      wordwrap: false,
      preserveNewlines: true
    });
    
    // Extract headings from markdown
    const headings = this.extractMarkdownHeadings(markdown);
    
    return {
      text,
      format: 'md',
      method: 'markdown',
      processingTime: 0,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        wordCount: this.countWords(text),
        characterCount: text.length
      },
      structure: {
        headings,
        paragraphs: markdown.split('\n\n').length,
        sections: []
      },
      warnings: []
    };
  }
  
  /**
   * Detect document format
   */
  private static async detectFormat(file: File): Promise<string> {
    const extension = file.name.toLowerCase().split('.').pop() || '';
    
    // Map extensions to formats
    const formatMap: { [key: string]: string } = {
      'pdf': 'pdf',
      'xlsx': 'xlsx',
      'xls': 'xls',
      'csv': 'csv',
      'docx': 'docx',
      'doc': 'doc',
      'pptx': 'pptx',
      'ppt': 'ppt',
      'eml': 'eml',
      'msg': 'msg',
      'html': 'html',
      'htm': 'html',
      'md': 'md',
      'txt': 'txt',
      'rtf': 'rtf'
    };
    
    return formatMap[extension] || 'unknown';
  }
  
  /**
   * Detect language using worker
   */
  private static async detectLanguage(text: string): Promise<string> {
    if (extractionWorker) {
      return new Promise((resolve) => {
        extractionWorker!.onmessage = (e) => {
          resolve(e.data.result || 'en');
        };
        extractionWorker!.postMessage({ task: 'detectLanguage', data: { text } });
      });
    }
    
    // Fallback to simple detection
    return 'en';
  }
  
  /**
   * Perform semantic chunking
   */
  private static async performSemanticChunking(text: string): Promise<Section[]> {
    const sections: Section[] = [];
    
    // Simple paragraph-based chunking
    const paragraphs = text.split('\n\n');
    let currentSection: Section | null = null;
    let sectionNum = 0;
    
    paragraphs.forEach((para, index) => {
      // Detect section headers (simplified)
      if (para.length < 100 && para.match(/^[A-Z0-9]/)) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: para,
          startPage: Math.floor(index / 10),
          endPage: Math.floor(index / 10),
          content: ''
        };
        sectionNum++;
      } else if (currentSection) {
        currentSection.content += para + '\n\n';
        currentSection.endPage = Math.floor(index / 10);
      }
    });
    
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return sections;
  }
  
  /**
   * Extract cross-references
   */
  private static async extractCrossReferences(text: string): Promise<CrossReference[]> {
    const references: CrossReference[] = [];
    
    // Extract citations
    const citationPattern = /\[(\d+)\]|\\cite\{([^}]+)\}/g;
    let match;
    while ((match = citationPattern.exec(text)) !== null) {
      references.push({
        source: match[0],
        target: match[1] || match[2],
        type: 'citation',
        page: 1 // Simplified
      });
    }
    
    // Extract footnotes
    const footnotePattern = /\[\^(\d+)\]/g;
    while ((match = footnotePattern.exec(text)) !== null) {
      references.push({
        source: match[0],
        target: match[1],
        type: 'footnote',
        page: 1
      });
    }
    
    return references;
  }
  
  /**
   * Extract HTML headings
   */
  private static extractHTMLHeadings(html: string): Heading[] {
    const headings: Heading[] = [];
    const headingPattern = /<h([1-6])[^>]*>([^<]+)<\/h[1-6]>/gi;
    let match;
    
    while ((match = headingPattern.exec(html)) !== null) {
      headings.push({
        text: match[2],
        level: parseInt(match[1])
      });
    }
    
    return headings;
  }
  
  /**
   * Extract Markdown headings
   */
  private static extractMarkdownHeadings(markdown: string): Heading[] {
    const headings: Heading[] = [];
    const lines = markdown.split('\n');
    
    lines.forEach(line => {
      const match = line.match(/^(#{1,6})\s+(.+)/);
      if (match) {
        headings.push({
          text: match[2],
          level: match[1].length
        });
      }
    });
    
    return headings;
  }
  
  /**
   * Convert CSV to Markdown table
   */
  private static csvToMarkdown(data: any[], headers: string[]): string {
    let markdown = '| ' + headers.join(' | ') + ' |\n';
    markdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
    
    data.forEach(row => {
      const values = headers.map(h => String(row[h] || ''));
      markdown += '| ' + values.join(' | ') + ' |\n';
    });
    
    return markdown;
  }
  
  /**
   * Check cache for existing extraction
   */
  private static async checkCache(file: File): Promise<AdvancedExtractionResult | null> {
    const key = `${file.name}-${file.size}-${file.lastModified}`;
    const cached = extractionCache.get(key);
    
    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < this.CACHE_TTL) {
        return cached.result;
      }
      extractionCache.delete(key);
    }
    
    return null;
  }
  
  /**
   * Cache extraction result
   */
  private static async cacheResult(file: File, result: AdvancedExtractionResult): Promise<void> {
    const key = `${file.name}-${file.size}-${file.lastModified}`;
    extractionCache.set(key, {
      result,
      timestamp: Date.now(),
      fileHash: key
    });
    
    // Clean old cache entries
    if (extractionCache.size > 100) {
      const entries = Array.from(extractionCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      entries.slice(0, 50).forEach(([key]) => extractionCache.delete(key));
    }
  }
  
  /**
   * Convert universal result to advanced result
   */
  private static convertToAdvancedResult(universal: any): AdvancedExtractionResult {
    return {
      text: universal.text,
      format: universal.format,
      method: universal.method,
      processingTime: universal.processingTime,
      metadata: universal.metadata,
      entities: universal.entities,
      tables: universal.tables,
      images: universal.images,
      warnings: universal.warnings
    };
  }
  
  /**
   * Assess extraction quality
   */
  private static assessQuality(result: AdvancedExtractionResult): QualityMetrics {
    let textQuality = 0.5;
    let structureQuality = 0.5;
    let completeness = 0.5;
    
    // Text quality based on content
    if (result.text.length > 100) textQuality += 0.2;
    if (result.metadata.wordCount && result.metadata.wordCount > 50) textQuality += 0.2;
    if (!result.warnings || result.warnings.length === 0) textQuality += 0.1;
    
    // Structure quality
    if (result.structure?.headings && result.structure.headings.length > 0) structureQuality += 0.2;
    if (result.tables && result.tables.length > 0) structureQuality += 0.2;
    if (result.entities && result.entities.length > 0) structureQuality += 0.1;
    
    // Completeness
    if (result.metadata.pages) completeness += 0.2;
    if (result.metadata.author) completeness += 0.1;
    if (result.metadata.language) completeness += 0.2;
    
    return {
      textQuality: Math.min(textQuality, 1),
      structureQuality: Math.min(structureQuality, 1),
      extractionCompleteness: Math.min(completeness, 1),
      confidence: Math.min((textQuality + structureQuality + completeness) / 3, 1)
    };
  }
  
  /**
   * Estimate memory usage
   */
  private static estimateMemoryUsage(result: AdvancedExtractionResult): number {
    // Rough estimate in bytes
    let size = 0;
    size += result.text.length * 2; // UTF-16
    size += JSON.stringify(result.metadata).length * 2;
    if (result.tables) size += JSON.stringify(result.tables).length * 2;
    if (result.entities) size += JSON.stringify(result.entities).length * 2;
    return size;
  }
  
  /**
   * Count words in text
   */
  private static countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }
  
  /**
   * Create error result
   */
  private static createErrorResult(
    file: File,
    error: any,
    processingTime: number
  ): AdvancedExtractionResult {
    return {
      text: '',
      format: 'unknown',
      method: 'error',
      processingTime,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      },
      errors: [error.message || 'Unknown error'],
      warnings: ['Extraction failed']
    };
  }
  
  /**
   * Get supported formats
   */
  static getSupportedFormats(): string[] {
    return [
      'PDF (.pdf)',
      'Word (.docx, .doc)',
      'Excel (.xlsx, .xls)',
      'CSV (.csv)',
      'PowerPoint (.pptx, .ppt)',
      'Email (.eml, .msg)',
      'HTML (.html, .htm)',
      'Markdown (.md)',
      'Text (.txt)',
      'Rich Text (.rtf)'
    ];
  }
  
  /**
   * Check if file is supported
   */
  static isSupported(file: File): boolean {
    const extension = file.name.toLowerCase().split('.').pop() || '';
    const supported = [
      'pdf', 'docx', 'doc', 'xlsx', 'xls', 'csv',
      'pptx', 'ppt', 'eml', 'msg', 'html', 'htm',
      'md', 'txt', 'rtf'
    ];
    return supported.includes(extension);
  }
}

// Export for backward compatibility
export const DocumentExtractor = AdvancedDocumentExtractor;