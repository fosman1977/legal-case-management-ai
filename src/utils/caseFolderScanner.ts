// Case folder scanner for existing OneDrive files
import { CaseDocument } from '../types';
import { PDFTextExtractor } from './pdfExtractor';

export interface ScannedFile {
  name: string;
  handle: FileSystemFileHandle;
  size: number;
  lastModified: Date;
  type: string;
  suggestedCategory: string;
  suggestedType: string;
  confidence: 'high' | 'medium' | 'low';
  extractedText?: string;
}

export interface FileTags {
  [fileName: string]: {
    category: CaseDocument['category'];
    type: CaseDocument['type'];
    title?: string;
    notes?: string;
    pageReferences?: string;
    manuallyTagged?: boolean;
  };
}

export class CaseFolderScanner {
  private tagFileName = 'document-tags.json';

  /**
   * Scan a case folder and categorize all files
   */
  async scanCaseFolder(folderHandle: FileSystemDirectoryHandle): Promise<ScannedFile[]> {
    const files: ScannedFile[] = [];

    try {
      for await (const [name, handle] of (folderHandle as any).entries()) {
        if (handle.kind === 'file' && this.isDocumentFile(name)) {
          const file = await handle.getFile();
          const suggestion = this.categorizeFile(name, file);
          
          const scannedFile: ScannedFile = {
            name,
            handle,
            size: file.size,
            lastModified: new Date(file.lastModified),
            type: file.type,
            ...suggestion
          };

          // Extract text preview for better AI analysis
          try {
            if (PDFTextExtractor.isPDF(file)) {
              const text = await PDFTextExtractor.extractText(file);
              scannedFile.extractedText = text.substring(0, 500); // Preview only
            } else if (this.isTextFile(file)) {
              const text = await this.readTextFile(file);
              scannedFile.extractedText = text.substring(0, 500);
            }
          } catch (error) {
            console.warn(`Failed to extract text from ${name}:`, error);
          }

          files.push(scannedFile);
        }
      }

      console.log(`📁 Scanned folder: found ${files.length} documents`);
      return files.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Failed to scan case folder:', error);
      throw error;
    }
  }

  /**
   * Smart categorization based on filename patterns
   */
  private categorizeFile(fileName: string, _file: File): {
    suggestedCategory: string;
    suggestedType: string;
    confidence: 'high' | 'medium' | 'low';
  } {
    const name = fileName.toLowerCase();
    
    // High confidence patterns
    if (this.matchesPattern(name, /witness\s*statement|statement\s*of\s*\w+/)) {
      return { suggestedCategory: 'claimant', suggestedType: 'witness_statement', confidence: 'high' };
    }
    
    if (this.matchesPattern(name, /particulars?\s*of\s*claim|claim/)) {
      return { suggestedCategory: 'pleadings', suggestedType: 'particulars', confidence: 'high' };
    }
    
    if (this.matchesPattern(name, /defence|defense/)) {
      return { suggestedCategory: 'pleadings', suggestedType: 'defence', confidence: 'high' };
    }
    
    if (this.matchesPattern(name, /skeleton\s*argument|skeleton/)) {
      return { suggestedCategory: 'pleadings', suggestedType: 'skeleton_argument', confidence: 'high' };
    }
    
    if (this.matchesPattern(name, /\[20\d{2}\]|\(20\d{2}\)|v\s+\w+|judgment|appeal/)) {
      return { suggestedCategory: 'authorities', suggestedType: 'authorities', confidence: 'high' };
    }
    
    if (this.matchesPattern(name, /order|injunction|direction/)) {
      return { suggestedCategory: 'orders_judgments', suggestedType: 'order', confidence: 'high' };
    }
    
    if (this.matchesPattern(name, /ruling|decision/)) {
      return { suggestedCategory: 'orders_judgments', suggestedType: 'ruling', confidence: 'high' };
    }
    
    if (this.matchesPattern(name, /bundle|hearing\s*bundle/)) {
      return { suggestedCategory: 'hearing_bundle', suggestedType: 'hearing_bundle', confidence: 'high' };
    }
    
    if (this.matchesPattern(name, /letter|correspondence/)) {
      return { suggestedCategory: 'claimant', suggestedType: 'letter', confidence: 'high' };
    }
    
    if (this.matchesPattern(name, /memo|memorandum|note/)) {
      return { suggestedCategory: 'claimant', suggestedType: 'memo', confidence: 'high' };
    }

    // Medium confidence patterns
    if (this.matchesPattern(name, /exhibit|evidence|contract|agreement|invoice|receipt/)) {
      return { suggestedCategory: 'claimant', suggestedType: 'exhibit', confidence: 'medium' };
    }
    
    if (this.matchesPattern(name, /expert|report/)) {
      return { suggestedCategory: 'claimant', suggestedType: 'exhibit', confidence: 'medium' };
    }
    
    if (this.matchesPattern(name, /email/)) {
      return { suggestedCategory: 'claimant', suggestedType: 'letter', confidence: 'medium' };
    }

    // File extension patterns
    if (fileName.endsWith('.pdf')) {
      return { suggestedCategory: 'claimant', suggestedType: 'exhibit', confidence: 'low' };
    }
    
    if (fileName.match(/\.(docx?|txt)$/i)) {
      return { suggestedCategory: 'pleadings', suggestedType: 'particulars', confidence: 'low' };
    }

    // Default fallback
    return { suggestedCategory: 'claimant', suggestedType: 'exhibit', confidence: 'low' };
  }

  /**
   * Helper to match filename patterns
   */
  private matchesPattern(text: string, pattern: RegExp): boolean {
    return pattern.test(text);
  }

  /**
   * Check if file is a document we should process
   */
  private isDocumentFile(fileName: string): boolean {
    // Skip system files and our tag file
    if (fileName.startsWith('.') || fileName === this.tagFileName) {
      return false;
    }

    const ext = fileName.toLowerCase().split('.').pop();
    const supportedExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'];
    return supportedExtensions.includes(ext || '');
  }

  /**
   * Check if file is text-based
   */
  private isTextFile(file: File): boolean {
    return file.type.startsWith('text/') || 
           file.name.match(/\.(txt|docx?|rtf|odt)$/i) !== null;
  }

  /**
   * Read text content from file
   */
  private async readTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  /**
   * Load existing tags from folder
   */
  async loadTags(folderHandle: FileSystemDirectoryHandle): Promise<FileTags> {
    try {
      const tagFileHandle = await folderHandle.getFileHandle(this.tagFileName);
      const file = await tagFileHandle.getFile();
      const text = await file.text();
      return JSON.parse(text);
    } catch (error) {
      // File doesn't exist yet
      return {};
    }
  }

  /**
   * Save tags to folder
   */
  async saveTags(folderHandle: FileSystemDirectoryHandle, tags: FileTags): Promise<void> {
    try {
      const tagFileHandle = await folderHandle.getFileHandle(this.tagFileName, { create: true });
      const writable = await tagFileHandle.createWritable();
      await writable.write(JSON.stringify(tags, null, 2));
      await writable.close();
      console.log(`💾 Saved document tags to ${this.tagFileName}`);
    } catch (error) {
      console.error('Failed to save tags:', error);
      throw error;
    }
  }

  /**
   * Convert scanned files + tags to CaseDocument format
   */
  async convertToDocuments(
    scannedFiles: ScannedFile[], 
    tags: FileTags, 
    caseId: string
  ): Promise<CaseDocument[]> {
    const documents: CaseDocument[] = [];

    for (const file of scannedFiles) {
      const tag = tags[file.name];
      const category = tag?.category || file.suggestedCategory as CaseDocument['category'];
      const type = tag?.type || file.suggestedType as CaseDocument['type'];

      // Read full file content for AI analysis
      let fullContent = '';
      try {
        const fileObj = await file.handle.getFile();
        if (PDFTextExtractor.isPDF(fileObj)) {
          fullContent = await PDFTextExtractor.extractText(fileObj);
        } else if (this.isTextFile(fileObj)) {
          fullContent = await this.readTextFile(fileObj);
        }
      } catch (error) {
        console.warn(`Failed to read full content of ${file.name}:`, error);
        fullContent = file.extractedText || '';
      }

      const doc: CaseDocument = {
        id: `scan_${caseId}_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`,
        caseId,
        title: tag?.title || this.generateTitle(file.name),
        category,
        type,
        content: tag?.notes || '',
        pageReferences: tag?.pageReferences || '',
        notes: tag?.notes || '',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileContent: fullContent,
        // Custom properties for folder scanning
        lastModified: file.lastModified.toISOString(),
        isScanned: true,
        confidence: file.confidence,
        manuallyTagged: tag?.manuallyTagged || false
      } as CaseDocument & {
        lastModified: string;
        isScanned: boolean;
        confidence: string;
        manuallyTagged: boolean;
      };

      documents.push(doc);
    }

    return documents;
  }

  /**
   * Generate human-readable title from filename
   */
  private generateTitle(fileName: string): string {
    return fileName
      .replace(/\.[^.]+$/, '') // Remove extension
      .replace(/[-_]/g, ' ') // Replace dashes/underscores with spaces
      .replace(/\b\w/g, l => l.toUpperCase()) // Title case
      .trim();
  }

  /**
   * Get confidence color for UI
   */
  getConfidenceColor(confidence: string): string {
    switch (confidence) {
      case 'high': return '#4caf50';
      case 'medium': return '#ff9800';
      case 'low': return '#f44336';
      default: return '#666';
    }
  }

  /**
   * Get confidence description
   */
  getConfidenceDescription(confidence: string): string {
    switch (confidence) {
      case 'high': return 'Very confident about this categorization';
      case 'medium': return 'Fairly confident, but please verify';
      case 'low': return 'Best guess - please check and adjust';
      default: return 'Unknown confidence';
    }
  }
}

export const caseFolderScanner = new CaseFolderScanner();