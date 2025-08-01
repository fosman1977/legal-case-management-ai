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
   * Scan a case folder and categorize all files (including subfolders)
   */
  async scanCaseFolder(
    folderHandle: FileSystemDirectoryHandle,
    onProgress?: (current: number, total: number, currentFile: string) => void
  ): Promise<ScannedFile[]> {
    const files: ScannedFile[] = [];
    let processedCount = 0;

    try {
      // First pass: count total files for progress tracking
      const totalFiles = await this.countFilesRecursive(folderHandle);
      
      await this.scanFolderRecursive(folderHandle, files, '', (fileName) => {
        processedCount++;
        onProgress?.(processedCount, totalFiles, fileName);
      });
      
      console.log(`📁 Scanned folder recursively: found ${files.length} documents in ${totalFiles} total files`);
      return files.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Failed to scan case folder:', error);
      throw error;
    }
  }

  /**
   * Count total files recursively for progress tracking
   */
  private async countFilesRecursive(folderHandle: FileSystemDirectoryHandle): Promise<number> {
    let count = 0;
    try {
      for await (const [name, handle] of (folderHandle as any).entries()) {
        if (handle.kind === 'file' && this.isDocumentFile(name)) {
          count++;
        } else if (handle.kind === 'directory') {
          count += await this.countFilesRecursive(handle);
        }
      }
    } catch (error) {
      console.warn('Error counting files:', error);
    }
    return count;
  }

  /**
   * Recursively scan folder and subfolders
   */
  private async scanFolderRecursive(
    folderHandle: FileSystemDirectoryHandle, 
    files: ScannedFile[], 
    path: string,
    onProgress?: (fileName: string) => void
  ): Promise<void> {
    try {
      for await (const [name, handle] of (folderHandle as any).entries()) {
        const currentPath = path ? `${path}/${name}` : name;
        
        if (handle.kind === 'file' && this.isDocumentFile(name)) {
          onProgress?.(currentPath);
          
          const file = await handle.getFile();
          const suggestion = this.categorizeFile(name, file, currentPath);
          
          const scannedFile: ScannedFile = {
            name: currentPath, // Include full path for uniqueness
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
            console.warn(`Failed to extract text from ${currentPath}:`, error);
          }

          files.push(scannedFile);
          
        } else if (handle.kind === 'directory') {
          // Recursively scan subdirectory
          console.log(`📂 Scanning subdirectory: ${currentPath}`);
          await this.scanFolderRecursive(handle, files, currentPath, onProgress);
        }
      }
    } catch (error) {
      console.warn(`Failed to scan directory ${path}:`, error);
      // Continue scanning other directories
    }
  }

  /**
   * Smart categorization based on filename patterns and folder structure
   */
  private categorizeFile(fileName: string, _file: File, fullPath?: string): {
    suggestedCategory: string;
    suggestedType: string;
    confidence: 'high' | 'medium' | 'low';
  } {
    const name = fileName.toLowerCase();
    const path = (fullPath || fileName).toLowerCase();
    
    // Enhanced categorization based on folder structure
    if (this.matchesFolderPattern(path, /witness/)) {
      return { suggestedCategory: 'claimant', suggestedType: 'witness_statement', confidence: 'high' };
    }
    
    if (this.matchesFolderPattern(path, /pleading|claim|defence|defense/)) {
      return { suggestedCategory: 'pleadings', suggestedType: 'particulars', confidence: 'high' };
    }
    
    if (this.matchesFolderPattern(path, /skeleton|argument/)) {
      return { suggestedCategory: 'authorities', suggestedType: 'skeleton_argument', confidence: 'high' };
    }
    
    if (this.matchesFolderPattern(path, /correspondence|letter|email/)) {
      return { suggestedCategory: 'correspondence', suggestedType: 'letter', confidence: 'high' };
    }
    
    if (this.matchesFolderPattern(path, /evidence|exhibit/)) {
      return { suggestedCategory: 'evidence', suggestedType: 'exhibit', confidence: 'high' };
    }
    
    if (this.matchesFolderPattern(path, /expert|report/)) {
      return { suggestedCategory: 'expert', suggestedType: 'expert_report', confidence: 'high' };
    }
    
    if (this.matchesFolderPattern(path, /court|order|judgment/)) {
      return { suggestedCategory: 'court', suggestedType: 'order', confidence: 'high' };
    }
    
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

  private matchesFolderPattern(path: string, pattern: RegExp): boolean {
    return pattern.test(path);
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
      // Check if we're in Electron context
      if (window.electronAPI) {
        // In Electron, we can't use createWritable() due to security restrictions
        // Tags will be stored in the app's local storage instead
        console.log('📝 Running in Electron - tags stored in app storage');
        return;
      }
      
      const tagFileHandle = await folderHandle.getFileHandle(this.tagFileName, { create: true });
      const writable = await tagFileHandle.createWritable();
      await writable.write(JSON.stringify(tags, null, 2));
      await writable.close();
      console.log(`💾 Saved document tags to ${this.tagFileName}`);
    } catch (error) {
      console.error('Failed to save tags:', error);
      // Don't throw the error, just log it - this allows document processing to continue
      console.log('⚠️ Tag saving failed, but document processing will continue');
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