// File System Access API manager for OneDrive synced folders
export interface FileSystemConfig {
  rootDirectoryHandle?: FileSystemDirectoryHandle; // Legacy - for backward compatibility
  selectedPath?: string; // Legacy - for backward compatibility
  caseFolders?: Record<string, {
    directoryHandle: FileSystemDirectoryHandle;
    folderPath: string;
    folderName: string;
  }>;
}

export class FileSystemManager {
  private config: FileSystemConfig = {};
  private readonly STORAGE_KEY = 'file_system_config';

  constructor() {
    this.loadConfig();
  }

  /**
   * Check if File System Access API is supported
   */
  isSupported(): boolean {
    return 'showDirectoryPicker' in window;
  }

  /**
   * Request user to select OneDrive folder for a specific case
   */
  async selectCaseFolder(caseId: string, caseTitle: string): Promise<boolean> {
    try {
      if (!this.isSupported()) {
        alert('File System Access API is not supported in this browser. Please use Chrome, Edge, or another Chromium-based browser.');
        return false;
      }

      const directoryHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents'
      });

      // Initialize caseFolders if it doesn't exist
      if (!this.config.caseFolders) {
        this.config.caseFolders = {};
      }

      // Store case-specific folder
      this.config.caseFolders[caseId] = {
        directoryHandle: directoryHandle,
        folderPath: directoryHandle.name,
        folderName: directoryHandle.name
      };
      
      await this.saveConfig();
      
      console.log(`📁 Selected folder for case "${caseTitle}": ${directoryHandle.name}`);
      return true;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('User cancelled folder selection');
      } else {
        console.error('Failed to select folder:', error);
        alert('Failed to select folder. Please try again.');
      }
      return false;
    }
  }

  /**
   * Request user to select OneDrive folder (legacy method)
   */
  async selectRootFolder(): Promise<boolean> {
    try {
      if (!this.isSupported()) {
        alert('File System Access API is not supported in this browser. Please use Chrome, Edge, or another Chromium-based browser.');
        return false;
      }

      const directoryHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents'
      });

      this.config.rootDirectoryHandle = directoryHandle;
      this.config.selectedPath = directoryHandle.name;
      
      // Store the directory handle for future use
      await this.saveConfig();
      
      console.log(`📁 Selected folder: ${directoryHandle.name}`);
      return true;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('User cancelled folder selection');
      } else {
        console.error('Failed to select folder:', error);
        alert('Failed to select folder. Please try again.');
      }
      return false;
    }
  }

  /**
   * Check if a root folder has been selected
   */
  /**
   * Check if a specific case has a folder selected
   */
  hasCaseFolder(caseId: string): boolean {
    return !!(this.config.caseFolders && this.config.caseFolders[caseId]);
  }

  /**
   * Get the folder name for a specific case
   */
  getCaseFolderName(caseId: string): string {
    if (this.config.caseFolders && this.config.caseFolders[caseId]) {
      return this.config.caseFolders[caseId].folderName;
    }
    return '';
  }

  /**
   * Get case folder handle
   */
  getCaseFolderHandle(caseId: string): FileSystemDirectoryHandle | null {
    if (this.config.caseFolders && this.config.caseFolders[caseId]) {
      return this.config.caseFolders[caseId].directoryHandle;
    }
    return null;
  }

  /**
   * Remove case folder association
   */
  removeCaseFolder(caseId: string): void {
    if (this.config.caseFolders && this.config.caseFolders[caseId]) {
      delete this.config.caseFolders[caseId];
      this.saveConfig();
    }
  }

  hasRootFolder(): boolean {
    return !!this.config.rootDirectoryHandle;
  }

  /**
   * Get the selected folder name
   */
  getRootFolderName(): string {
    return this.config.selectedPath || 'No folder selected';
  }

  /**
   * Create case folder structure
   */
  async createCaseFolder(caseId: string, caseTitle: string): Promise<FileSystemDirectoryHandle | null> {
    try {
      if (!this.config.rootDirectoryHandle) {
        throw new Error('No root folder selected');
      }

      // Create safe folder name
      const safeName = this.sanitizeFolderName(`${caseId}-${caseTitle}`);
      
      // Create case folder
      const caseFolder = await this.config.rootDirectoryHandle.getDirectoryHandle(safeName, { 
        create: true 
      });

      // Create subfolders
      await caseFolder.getDirectoryHandle('documents', { create: true });
      await caseFolder.getDirectoryHandle('pleadings', { create: true });
      await caseFolder.getDirectoryHandle('evidence', { create: true });
      await caseFolder.getDirectoryHandle('authorities', { create: true });
      await caseFolder.getDirectoryHandle('generated', { create: true });

      console.log(`📁 Created case folder: ${safeName}`);
      return caseFolder;
    } catch (error) {
      console.error('Failed to create case folder:', error);
      return null;
    }
  }

  /**
   * Get case folder (new approach - uses case-specific folder)
   */
  async getCaseFolder(caseId: string, caseTitle: string): Promise<FileSystemDirectoryHandle | null> {
    // Try new case-specific folder approach first
    if (this.hasCaseFolder(caseId)) {
      return this.getCaseFolderHandle(caseId);
    }

    // Fallback to legacy approach for backward compatibility
    try {
      if (!this.config.rootDirectoryHandle) {
        return null;
      }

      const safeName = this.sanitizeFolderName(`${caseId}-${caseTitle}`);
      return await this.config.rootDirectoryHandle.getDirectoryHandle(safeName);
    } catch (error) {
      // Folder doesn't exist, create it using legacy approach
      return await this.createCaseFolder(caseId, caseTitle);
    }
  }

  /**
   * Save document file to case folder
   */
  async saveDocumentFile(
    caseId: string, 
    caseTitle: string, 
    category: string,
    fileName: string, 
    file: File
  ): Promise<string | null> {
    try {
      const caseFolder = await this.getCaseFolder(caseId, caseTitle);
      if (!caseFolder) return null;

      // Get appropriate subfolder
      const subfolder = await caseFolder.getDirectoryHandle(category, { create: true });
      
      // Create unique filename if file already exists
      const uniqueFileName = await this.getUniqueFileName(subfolder, fileName);
      
      // Create file
      const fileHandle = await subfolder.getFileHandle(uniqueFileName, { create: true });
      const writable = await fileHandle.createWritable();
      
      // Write file content
      await writable.write(file);
      await writable.close();

      console.log(`💾 Saved file: ${category}/${uniqueFileName}`);
      return `${category}/${uniqueFileName}`;
    } catch (error) {
      console.error('Failed to save document file:', error);
      return null;
    }
  }

  /**
   * Read document file from case folder
   */
  async readDocumentFile(
    caseId: string, 
    caseTitle: string, 
    filePath: string
  ): Promise<File | null> {
    try {
      const caseFolder = await this.getCaseFolder(caseId, caseTitle);
      if (!caseFolder) return null;

      const [category, fileName] = filePath.split('/');
      const subfolder = await caseFolder.getDirectoryHandle(category);
      const fileHandle = await subfolder.getFileHandle(fileName);
      
      return await fileHandle.getFile();
    } catch (error) {
      console.error(`Failed to read file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * List all files in case folder
   */
  async listCaseFiles(caseId: string, caseTitle: string): Promise<string[]> {
    try {
      const caseFolder = await this.getCaseFolder(caseId, caseTitle);
      if (!caseFolder) return [];

      const files: string[] = [];
      
      // Iterate through subfolders
      for await (const [name, handle] of (caseFolder as any).entries()) {
        if (handle.kind === 'directory') {
          // Iterate through files in subfolder
          for await (const [fileName, fileHandle] of (handle as any).entries()) {
            if (fileHandle.kind === 'file') {
              files.push(`${name}/${fileName}`);
            }
          }
        }
      }

      return files;
    } catch (error) {
      console.error('Failed to list case files:', error);
      return [];
    }
  }

  /**
   * Save case metadata as JSON
   */
  async saveCaseMetadata(caseId: string, caseTitle: string, data: any): Promise<boolean> {
    try {
      const caseFolder = await this.getCaseFolder(caseId, caseTitle);
      if (!caseFolder) return false;

      const fileHandle = await caseFolder.getFileHandle('case-data.json', { create: true });
      const writable = await fileHandle.createWritable();
      
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();

      console.log(`💾 Saved case metadata for ${caseTitle}`);
      return true;
    } catch (error) {
      console.error('Failed to save case metadata:', error);
      return false;
    }
  }

  /**
   * Load case metadata from JSON
   */
  async loadCaseMetadata(caseId: string, caseTitle: string): Promise<any | null> {
    try {
      const caseFolder = await this.getCaseFolder(caseId, caseTitle);
      if (!caseFolder) return null;

      const fileHandle = await caseFolder.getFileHandle('case-data.json');
      const file = await fileHandle.getFile();
      const text = await file.text();
      
      return JSON.parse(text);
    } catch (error) {
      // File doesn't exist yet
      return null;
    }
  }

  /**
   * Get unique filename to avoid conflicts
   */
  private async getUniqueFileName(
    folder: FileSystemDirectoryHandle, 
    fileName: string
  ): Promise<string> {
    let counter = 1;
    let uniqueName = fileName;
    
    while (true) {
      try {
        await folder.getFileHandle(uniqueName);
        // File exists, try next number
        const ext = fileName.substring(fileName.lastIndexOf('.'));
        const base = fileName.substring(0, fileName.lastIndexOf('.'));
        uniqueName = `${base}_${counter}${ext}`;
        counter++;
      } catch (error) {
        // File doesn't exist, use this name
        return uniqueName;
      }
    }
  }

  /**
   * Sanitize folder name for file system
   */
  private sanitizeFolderName(name: string): string {
    return name
      .replace(/[<>:"/\\|?*]/g, '-') // Replace invalid chars
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .replace(/-+/g, '-') // Replace multiple dashes with single
      .substring(0, 100); // Limit length
  }

  /**
   * Save configuration to localStorage
   */
  private async saveConfig(): Promise<void> {
    try {
      // We can't serialize FileSystemDirectoryHandle, so we'll need to ask user to reselect
      const configToSave = {
        selectedPath: this.config.selectedPath
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configToSave));
    } catch (error) {
      console.error('Failed to save file system config:', error);
    }
  }

  /**
   * Load configuration from localStorage
   */
  private loadConfig(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const config = JSON.parse(saved);
        this.config.selectedPath = config.selectedPath;
        // Note: rootDirectoryHandle needs to be reselected each session
      }
    } catch (error) {
      console.error('Failed to load file system config:', error);
    }
  }

  /**
   * Reset configuration
   */
  resetConfig(): void {
    this.config = {};
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

export const fileSystemManager = new FileSystemManager();