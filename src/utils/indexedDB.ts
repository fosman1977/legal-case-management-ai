interface DBSchema {
  cases: {
    key: string;
    value: any;
  };
  documents: {
    key: string;
    value: any;
  };
  files: {
    key: string;
    value: {
      id: string;
      fileName: string;
      fileType: string;
      fileSize: number;
      content: ArrayBuffer;
      documentId: string;
    };
  };
}

class IndexedDBManager {
  private dbName = 'CaseManagerDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('cases')) {
          db.createObjectStore('cases', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('documents')) {
          const docStore = db.createObjectStore('documents', { keyPath: 'id' });
          docStore.createIndex('caseId', 'caseId', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('files')) {
          const fileStore = db.createObjectStore('files', { keyPath: 'id' });
          fileStore.createIndex('documentId', 'documentId', { unique: false });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  async storeFile(file: File, documentId: string): Promise<string> {
    const db = await this.ensureDB();
    const fileId = `file_${documentId}_${Date.now()}`;
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const transaction = db.transaction(['files'], 'readwrite');
        const store = transaction.objectStore('files');
        
        const fileData = {
          id: fileId,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          content: reader.result as ArrayBuffer,
          documentId
        };
        
        const request = store.add(fileData);
        request.onsuccess = () => resolve(fileId);
        request.onerror = () => reject(request.error);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  // Alias for compatibility with EnhancedDocumentManager
  async saveFile(file: File): Promise<string> {
    const documentId = `doc_${Date.now()}`;
    return this.storeFile(file, documentId);
  }

  async getFile(fileId: string): Promise<File | null> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['files'], 'readonly');
      const store = transaction.objectStore('files');
      const request = store.get(fileId);
      
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          const file = new File([result.content], result.fileName, {
            type: result.fileType
          });
          resolve(file);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteFile(fileId: string): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['files'], 'readwrite');
      const store = transaction.objectStore('files');
      const request = store.delete(fileId);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async storeDocument(document: any): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['documents'], 'readwrite');
      const store = transaction.objectStore('documents');
      const request = store.put(document);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getDocuments(caseId: string): Promise<any[]> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['documents'], 'readonly');
      const store = transaction.objectStore('documents');
      const index = store.index('caseId');
      const request = index.getAll(caseId);
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteDocument(documentId: string): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['documents', 'files'], 'readwrite');
      
      // Delete document
      const docStore = transaction.objectStore('documents');
      docStore.delete(documentId);
      
      // Delete associated files
      const fileStore = transaction.objectStore('files');
      const fileIndex = fileStore.index('documentId');
      const fileRequest = fileIndex.getAll(documentId);
      
      fileRequest.onsuccess = () => {
        const files = fileRequest.result;
        files.forEach(file => {
          fileStore.delete(file.id);
        });
      };
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async storeCase(caseData: any): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cases'], 'readwrite');
      const store = transaction.objectStore('cases');
      const request = store.put(caseData);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCases(): Promise<any[]> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cases'], 'readonly');
      const store = transaction.objectStore('cases');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteCase(caseId: string): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cases', 'documents', 'files'], 'readwrite');
      
      // Delete case
      const caseStore = transaction.objectStore('cases');
      caseStore.delete(caseId);
      
      // Delete documents and files for this case
      const docStore = transaction.objectStore('documents');
      const docIndex = docStore.index('caseId');
      const docRequest = docIndex.getAll(caseId);
      
      docRequest.onsuccess = () => {
        const documents = docRequest.result;
        documents.forEach(doc => {
          // Delete document
          docStore.delete(doc.id);
          
          // Delete associated files
          const fileStore = transaction.objectStore('files');
          const fileIndex = fileStore.index('documentId');
          const fileRequest = fileIndex.getAll(doc.id);
          
          fileRequest.onsuccess = () => {
            const files = fileRequest.result;
            files.forEach(file => {
              fileStore.delete(file.id);
            });
          };
        });
      };
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getStorageUsage(): Promise<{ used: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    }
    return { used: 0, quota: 0 };
  }
}

export const indexedDBManager = new IndexedDBManager();