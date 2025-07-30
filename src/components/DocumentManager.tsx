import React, { useState, useEffect } from 'react';
import { CaseDocument } from '../types';
import { PDFTextExtractor } from '../utils/pdfExtractor';
import { storage } from '../utils/storage';
import { indexedDBManager } from '../utils/indexedDB';
import { fileSystemManager } from '../utils/fileSystemManager';
import { CaseFolderScanner } from './CaseFolderScanner';
import { CaseFolderSetup } from './CaseFolderSetup';
import { aiDocumentProcessor } from '../utils/aiDocumentProcessor';
import { useAISync } from '../hooks/useAISync';

interface DocumentManagerProps {
  caseId: string;
  onDocumentChange?: () => void;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({ caseId, onDocumentChange }) => {
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingDoc, setEditingDoc] = useState<CaseDocument | null>(null);
  
  // AI Synchronization
  const { publishAIResults } = useAISync(caseId, 'DocumentManager');
  const [formData, setFormData] = useState<Partial<CaseDocument>>({
    title: '',
    category: 'claimant',
    type: 'witness_statement',
    content: '',
    pageReferences: '',
    notes: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  
  // State persistence key
  const FORM_STATE_KEY = `doc_form_state_${caseId}`;
  const FILE_STATE_KEY = `doc_file_state_${caseId}`;
  const [caseData, setCaseData] = useState<any>(null);
  const [useFileSystem, setUseFileSystem] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedDocuments, setScannedDocuments] = useState<CaseDocument[]>([]);
  const [stateRestored, setStateRestored] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, currentDoc: '' });

  // Save form state to localStorage
  const saveFormState = () => {
    if (isAdding && (formData.title || selectedFile)) {
      const stateToSave = {
        formData,
        hasFile: !!selectedFile,
        fileName: selectedFile?.name,
        fileSize: selectedFile?.size,
        fileType: selectedFile?.type,
        isAdding,
        editingDocId: editingDoc?.id
      };
      localStorage.setItem(FORM_STATE_KEY, JSON.stringify(stateToSave));
      
      // Store file separately if it exists
      if (selectedFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
          localStorage.setItem(FILE_STATE_KEY, e.target?.result as string);
        };
        reader.readAsDataURL(selectedFile);
      }
    }
  };

  // Restore form state from localStorage
  const restoreFormState = () => {
    const savedState = localStorage.getItem(FORM_STATE_KEY);
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        setFormData(parsedState.formData);
        setIsAdding(parsedState.isAdding);
        setStateRestored(true);
        
        if (parsedState.editingDocId) {
          // Find and set editing document
          const editDoc = documents.find(d => d.id === parsedState.editingDocId);
          if (editDoc) {
            setEditingDoc(editDoc);
          }
        }
        
        // Restore file if it was saved
        if (parsedState.hasFile) {
          const savedFileData = localStorage.getItem(FILE_STATE_KEY);
          if (savedFileData) {
            // Convert base64 back to File object
            fetch(savedFileData)
              .then(res => res.blob())
              .then(blob => {
                const file = new File([blob], parsedState.fileName, { 
                  type: parsedState.fileType 
                });
                setSelectedFile(file);
              });
          }
        }
        
        // Hide restoration notice after 3 seconds
        setTimeout(() => setStateRestored(false), 3000);
      } catch (error) {
        console.error('Failed to restore form state:', error);
        clearFormState();
      }
    }
  };

  // Clear saved form state
  const clearFormState = () => {
    localStorage.removeItem(FORM_STATE_KEY);
    localStorage.removeItem(FILE_STATE_KEY);
  };

  // Check if we can use file system and load scanned documents
  useEffect(() => {
    setUseFileSystem(fileSystemManager.hasCaseFolder(caseId) || fileSystemManager.hasRootFolder());
    // Load case data for folder naming
    const cases = storage.getCasesSync();
    const currentCase = cases.find(c => c.id === caseId);
    setCaseData(currentCase);
    
    // Load scanned documents from localStorage
    const storageKey = `scanned_documents_${caseId}`;
    const savedScannedDocs = localStorage.getItem(storageKey);
    if (savedScannedDocs) {
      try {
        const documents = JSON.parse(savedScannedDocs);
        console.log(`📦 Restored ${documents.length} scanned documents from localStorage`);
        setScannedDocuments(documents);
      } catch (error) {
        console.error('Failed to parse saved scanned documents:', error);
      }
    }
  }, [caseId]);

  useEffect(() => {
    loadDocuments();
    initializeIndexedDB();
  }, [caseId]);

  // Restore form state after documents are loaded
  useEffect(() => {
    if (documents.length >= 0) { // Even if no documents, try to restore
      restoreFormState();
    }
  }, [documents]);

  // Save form state whenever it changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveFormState();
    }, 500); // Debounce saves
    
    return () => clearTimeout(timeoutId);
  }, [formData, selectedFile, isAdding, editingDoc]);

  // Save state when component unmounts or tab changes
  useEffect(() => {
    return () => {
      saveFormState();
    };
  }, []);

  // Reload documents when scanned documents change
  useEffect(() => {
    if (scannedDocuments.length > 0) {
      loadDocuments();
    }
  }, [scannedDocuments]);

  const initializeIndexedDB = async () => {
    try {
      await indexedDBManager.init();
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
    }
  };

  const loadDocuments = async () => {
    try {
      console.log(`🔄 loadDocuments called - scannedDocuments.length: ${scannedDocuments.length}`);
      
      // Merge all document sources
      const allDocs: CaseDocument[] = [];

      // 1. Add scanned documents from folder scanner
      if (scannedDocuments.length > 0) {
        console.log(`📥 Adding ${scannedDocuments.length} scanned documents`);
        allDocs.push(...scannedDocuments);
      }

      // 2. Add file system documents (if using file system)
      if (useFileSystem && caseData) {
        console.log(`🗂️ Checking file system for case: ${caseData.title}`);
        const fileSystemFiles = await fileSystemManager.listCaseFiles(caseId, caseData.title);
        const metadata = await fileSystemManager.loadCaseMetadata(caseId, caseData.title) || {};
        
        const fileSystemDocs: CaseDocument[] = fileSystemFiles.map(filePath => {
          const [category, fileName] = filePath.split('/');
          const docId = `fs_${caseId}_${filePath.replace(/[^a-zA-Z0-9]/g, '_')}`;
          
          const docMetadata = metadata.documents?.[docId] || {};
          
          return {
            id: docId,
            caseId,
            title: docMetadata.title || fileName,
            category: docMetadata.category || category as any,
            type: docMetadata.type || 'exhibit' as any,
            content: docMetadata.content || '',
            pageReferences: docMetadata.pageReferences || '',
            notes: docMetadata.notes || '',
            fileId: undefined,
            fileName: fileName,
            fileSize: 0,
            fileType: fileName.split('.').pop() || '',
            fileContent: `File stored in OneDrive: ${filePath}`,
            filePath: filePath
          } as CaseDocument & { filePath: string };
        });

        if (fileSystemDocs.length > 0) {
          console.log(`🗂️ Adding ${fileSystemDocs.length} file system documents`);
          allDocs.push(...fileSystemDocs);
        }
      }

      // 3. Add IndexedDB documents (for backwards compatibility)
      const indexedDBDocs = await indexedDBManager.getDocuments(caseId);
      if (indexedDBDocs.length > 0) {
        console.log(`💾 Adding ${indexedDBDocs.length} IndexedDB documents`);
        allDocs.push(...indexedDBDocs);
      }
      
      // Remove duplicates (prioritize scanned documents)
      const uniqueDocs = allDocs.filter((doc, index, self) => 
        index === self.findIndex(d => d.fileName === doc.fileName)
      );

      console.log(`📋 Final document count: ${uniqueDocs.length} (${scannedDocuments.length} scanned + ${uniqueDocs.length - scannedDocuments.length} other)`);
      console.log(`📋 Document titles:`, uniqueDocs.map(d => d.title));
      
      setDocuments(uniqueDocs);
    } catch (error) {
      console.error('Failed to load documents:', error);
      setDocuments(storage.getDocuments(caseId));
    }
  };

  const handleDocumentsScanned = (documents: CaseDocument[]) => {
    console.log(`📥 Received ${documents.length} scanned documents:`, documents.map(d => d.title));
    
    // Store scanned documents in localStorage for persistence across tab switches
    const storageKey = `scanned_documents_${caseId}`;
    localStorage.setItem(storageKey, JSON.stringify(documents));
    
    setScannedDocuments(documents);
    setShowScanner(false);
    
    // Force reload documents after setting scanned documents
    setTimeout(() => {
      loadDocuments();
    }, 100);
    
    onDocumentChange?.();
    console.log(`✅ Imported ${documents.length} documents from case folder`);
  };

  const clearScannedDocuments = () => {
    const storageKey = `scanned_documents_${caseId}`;
    localStorage.removeItem(storageKey);
    setScannedDocuments([]);
    loadDocuments();
    console.log('🗑️ Cleared scanned documents');
  };

  const processBulkAIExtraction = async () => {
    if (isBulkProcessing) return;
    
    setIsBulkProcessing(true);
    setBulkProgress({ current: 0, total: 0, currentDoc: '' });
    
    try {
      // Get all documents with content
      const documentsWithContent = documents.filter(doc => 
        doc.fileContent && doc.fileContent.length > 100
      );
      
      setBulkProgress({ current: 0, total: documentsWithContent.length, currentDoc: '' });
      
      let processedCount = 0;
      let totalExtracted = { persons: 0, issues: 0, chronology: 0, authorities: 0 };
      
      for (const doc of documentsWithContent) {
        setBulkProgress({ 
          current: processedCount, 
          total: documentsWithContent.length, 
          currentDoc: doc.title 
        });
        
        console.log(`🔄 Processing document ${processedCount + 1}/${documentsWithContent.length}: ${doc.title}`);
        
        try {
          const entities = await aiDocumentProcessor.extractEntitiesForSync(
            doc.fileContent || '',
            doc.fileName || doc.title,
            aiDocumentProcessor.detectDocumentType(doc.fileContent || '', doc.fileName || doc.title)
          );
          
          // Only publish if we found entities
          if (entities.persons.length > 0 || entities.issues.length > 0 || 
              entities.chronologyEvents.length > 0 || entities.authorities.length > 0) {
            
            await publishAIResults(doc.fileName || doc.title, entities, 0.7);
            
            totalExtracted.persons += entities.persons.length;
            totalExtracted.issues += entities.issues.length;
            totalExtracted.chronology += entities.chronologyEvents.length;
            totalExtracted.authorities += entities.authorities.length;
            
            console.log(`✅ Extracted from ${doc.title}:`, {
              persons: entities.persons.length,
              issues: entities.issues.length,
              chronology: entities.chronologyEvents.length,
              authorities: entities.authorities.length
            });
          } else {
            console.log(`⚠️ No entities found in ${doc.title}`);
          }
          
        } catch (error) {
          console.error(`❌ Failed to process ${doc.title}:`, error);
        }
        
        processedCount++;
        
        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setBulkProgress({ 
        current: documentsWithContent.length, 
        total: documentsWithContent.length, 
        currentDoc: 'Complete!' 
      });
      
      console.log(`🎉 Bulk AI extraction complete! Total extracted:`, totalExtracted);
      
      // Show completion message
      alert(`Bulk AI extraction complete!\n\nExtracted:\n- ${totalExtracted.persons} persons\n- ${totalExtracted.issues} issues\n- ${totalExtracted.chronology} chronology events\n- ${totalExtracted.authorities} authorities\n\nCheck the Persons, Issues, Timeline, and Authorities tabs to see the results.`);
      
    } catch (error) {
      console.error('Bulk AI extraction failed:', error);
      alert('Bulk AI extraction failed. Please try again.');
    } finally {
      setIsBulkProcessing(false);
      setBulkProgress({ current: 0, total: 0, currentDoc: '' });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (100MB limit)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        alert('File size must be less than 100MB');
        return;
      }

      setSelectedFile(file);
      
      if (!formData.title) {
        setFormData(prev => ({ ...prev, title: file.name }));
      }

      // Extract content based on file type
      if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
        // For text files, read content for preview
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          setFormData(prev => ({
            ...prev,
            fileContent: content.substring(0, 1000), // Preview first 1000 chars
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
          }));
        };
        reader.readAsText(file);
      } else if (PDFTextExtractor.isPDF(file)) {
        // For PDF files, extract and process with AI
        setIsProcessing(true);
        setProcessingProgress(0);
        
        PDFTextExtractor.extractWithOCRFallback(file)
          .then(async extractedText => {
            setProcessingProgress(30);
            
            // Process with AI to get structured summary
            try {
              const processed = await aiDocumentProcessor.processDocument(
                extractedText,
                file.name,
                aiDocumentProcessor.detectDocumentType(extractedText, file.name),
                (progress) => setProcessingProgress(30 + (progress * 0.5)) // 30-80%
              );
              
              setFormData(prev => ({
                ...prev,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                fileContent: processed.structuredContent,
                // Auto-populate fields from AI analysis
                content: processed.summary.executiveSummary,
                notes: processed.summary.relevance
              }));
              
              setProcessingProgress(85);
              
              // Extract entities for AI sync system
              try {
                const entities = await aiDocumentProcessor.extractEntitiesForSync(
                  extractedText,
                  file.name,
                  aiDocumentProcessor.detectDocumentType(extractedText, file.name)
                );
                
                // Publish AI results to sync system
                await publishAIResults(file.name, entities, processed.metadata.confidence);
                
                console.log('🤖 AI entities published for new document:', {
                  fileName: file.name,
                  persons: entities.persons.length,
                  issues: entities.issues.length,
                  chronology: entities.chronologyEvents.length,
                  authorities: entities.authorities.length
                });
              } catch (syncError) {
                console.error('AI sync publishing failed:', syncError);
                // Don't fail the upload if AI sync fails
              }
              
              setProcessingProgress(100);
            } catch (error) {
              console.error('AI processing failed, using raw text:', error);
              setFormData(prev => ({
                ...prev,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                fileContent: extractedText.substring(0, 1000) + '...'
              }));
            }
          })
          .catch(error => {
            console.error('PDF extraction failed:', error);
            setFormData(prev => ({
              ...prev,
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              fileContent: `PDF File: ${file.name} (${Math.round(file.size / 1024)}KB) - Text extraction failed`
            }));
          })
          .finally(() => {
            setIsProcessing(false);
            setProcessingProgress(0);
          });
      } else {
        // For other binary files, just store metadata
        setFormData(prev => ({
          ...prev,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          fileContent: `File: ${file.name} (${Math.round(file.size / 1024)}KB)`
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const docId = editingDoc?.id || Date.now().toString();
      
      if (useFileSystem && caseData && selectedFile) {
        // Save to file system (OneDrive)
        setUploadProgress(20);
        
        const categoryFolder = getCategoryFolder(formData.category || 'documents');
        const filePath = await fileSystemManager.saveDocumentFile(
          caseId,
          caseData.title,
          categoryFolder,
          selectedFile.name,
          selectedFile
        );
        
        if (!filePath) {
          throw new Error('Failed to save file to OneDrive folder');
        }
        
        setUploadProgress(60);
        
        // Save metadata to case-data.json
        const metadata = await fileSystemManager.loadCaseMetadata(caseId, caseData.title) || { documents: {} };
        const fsDocId = `fs_${caseId}_${filePath.replace(/[^a-zA-Z0-9]/g, '_')}`;
        
        metadata.documents = metadata.documents || {};
        metadata.documents[fsDocId] = {
          title: formData.title,
          category: formData.category,
          type: formData.type,
          content: formData.content,
          pageReferences: formData.pageReferences,
          notes: formData.notes,
          createdAt: new Date().toISOString()
        };
        
        await fileSystemManager.saveCaseMetadata(caseId, caseData.title, metadata);
        setUploadProgress(90);
        
        console.log(`💾 Saved document to OneDrive: ${filePath}`);
      } else {
        // Save to IndexedDB (fallback)
        let fileId = '';
        
        if (selectedFile) {
          setUploadProgress(30);
          fileId = await indexedDBManager.storeFile(selectedFile, docId);
          setUploadProgress(60);
        }
        
        const doc: CaseDocument = {
          ...formData,
          id: docId,
          caseId,
          fileId: fileId || undefined,
        } as CaseDocument;

        setUploadProgress(80);
        await indexedDBManager.storeDocument(doc);
        console.log(`💾 Saved document to browser storage`);
      }
      
      setUploadProgress(100);
      await loadDocuments();
      onDocumentChange?.(); // Notify parent to refresh documents
      clearFormState(); // Clear saved state on successful submission
      resetForm();
    } catch (error) {
      console.error('Failed to save document:', error);
      alert('Failed to save document. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Helper function to map categories to folder names
  const getCategoryFolder = (category: string): string => {
    const folderMap: Record<string, string> = {
      'claimant': 'pleadings',
      'defendant': 'pleadings', 
      'pleadings': 'pleadings',
      'hearing_bundle': 'documents',
      'authorities': 'authorities',
      'orders_judgments': 'documents'
    };
    return folderMap[category] || 'documents';
  };

  const resetForm = () => {
    setFormData({
      title: '',
      category: 'claimant',
      type: 'witness_statement',
      content: '',
      pageReferences: '',
      notes: ''
    });
    setSelectedFile(null);
    setIsAdding(false);
    setEditingDoc(null);
    clearFormState(); // Clear saved state when form is reset
  };

  const handleEdit = (doc: CaseDocument) => {
    setEditingDoc(doc);
    setFormData(doc);
    setIsAdding(true);
  };

  const handleDelete = async (docId: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await indexedDBManager.deleteDocument(docId);
        await loadDocuments();
      } catch (error) {
        console.error('Failed to delete document:', error);
        alert('Failed to delete document. Please try again.');
      }
    }
  };

  const getCategoryLabel = (category: CaseDocument['category']) => {
    const labels = {
      claimant: 'Claimant',
      defendant: 'Defendant',
      pleadings: 'Pleadings',
      hearing_bundle: 'Hearing Bundle',
      authorities: 'Authorities',
      orders_judgments: 'Orders & Judgments'
    };
    return labels[category];
  };

  const getDocTypeLabel = (type: CaseDocument['type']) => {
    const labels = {
      witness_statement: 'Witness Statement',
      exhibit: 'Exhibit',
      skeleton_argument: 'Skeleton Argument',
      particulars: 'Particulars',
      defence: 'Defence',
      reply: 'Reply',
      hearing_bundle: 'Hearing Bundle',
      authorities: 'Legal Authorities',
      order: 'Court Order',
      judgment: 'Judgment',
      letter: 'Letter',
      ruling: 'Ruling',
      memo: 'Memo'
    };
    return labels[type] || type;
  };

  const getAvailableTypes = (category: CaseDocument['category']) => {
    switch (category) {
      case 'claimant':
      case 'defendant':
        return [
          { value: 'witness_statement', label: 'Witness Statement' },
          { value: 'exhibit', label: 'Exhibit' },
          { value: 'skeleton_argument', label: 'Skeleton Argument' },
          { value: 'letter', label: 'Letter' },
          { value: 'memo', label: 'Memo' }
        ];
      case 'pleadings':
        return [
          { value: 'particulars', label: 'Particulars' },
          { value: 'defence', label: 'Defence' },
          { value: 'reply', label: 'Reply' },
          { value: 'letter', label: 'Letter' }
        ];
      case 'hearing_bundle':
        return [
          { value: 'hearing_bundle', label: 'Hearing Bundle' },
          { value: 'memo', label: 'Memo' }
        ];
      case 'authorities':
        return [{ value: 'authorities', label: 'Legal Authorities' }];
      case 'orders_judgments':
        return [
          { value: 'order', label: 'Court Order' },
          { value: 'judgment', label: 'Judgment' },
          { value: 'ruling', label: 'Ruling' }
        ];
      default:
        return [];
    }
  };

  const groupDocumentsByCategory = (docs: CaseDocument[]) => {
    return docs.reduce((groups, doc) => {
      const category = doc.category || 'claimant';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(doc);
      return groups;
    }, {} as Record<string, CaseDocument[]>);
  };

  return (
    <div className="document-manager">
      <div className="manager-header">
        <div>
          <h3>📄 Case Documents</h3>
          {scannedDocuments.length > 0 ? (
            <div>
              <p className="storage-status">
                ✅ <strong>Case Folder:</strong> {scannedDocuments.length} documents imported from OneDrive folder
              </p>
              <button 
                className="btn btn-sm btn-secondary"
                onClick={clearScannedDocuments}
                style={{ marginTop: '0.5rem' }}
              >
                🗑️ Clear Scanned Documents
              </button>
            </div>
          ) : useFileSystem ? (
            <p className="storage-status">
              💾 <strong>OneDrive Storage:</strong> Files automatically sync across all your machines
            </p>
          ) : (
            <p className="storage-status">
              🌐 <strong>Browser Storage:</strong> Go to Settings → Folder Setup to enable OneDrive sync
            </p>
          )}
          
          {/* Debug info */}
          <p className="debug-info" style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.25rem' }}>
            Debug: {documents.length} displayed, {scannedDocuments.length} scanned
          </p>
        </div>
        <div className="header-actions">
          {!showScanner && (
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowScanner(true)}
            >
              📁 Scan Case Folder
            </button>
          )}
          {documents.length > 0 && !isBulkProcessing && !isAdding && !showScanner && (
            <button 
              className="btn btn-secondary" 
              onClick={processBulkAIExtraction}
              title="Extract persons, issues, dates, and authorities from all documents"
            >
              🤖 AI Extract All
            </button>
          )}
          {!isAdding && !showScanner && (
            <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
              + Add Document
            </button>
          )}
        </div>
      </div>

      {isBulkProcessing && (
        <div className="bulk-processing">
          <div className="processing-header">
            <h4>🤖 AI Processing Documents</h4>
            <p>Extracting entities from all documents...</p>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill ai-progress"
              style={{ width: `${bulkProgress.total > 0 ? (bulkProgress.current / bulkProgress.total) * 100 : 0}%` }}
            />
          </div>
          <div className="progress-details">
            <span className="progress-text">
              {bulkProgress.current} of {bulkProgress.total} documents processed
            </span>
            {bulkProgress.currentDoc && (
              <span className="current-file">
                📄 {bulkProgress.currentDoc.length > 50 
                  ? '...' + bulkProgress.currentDoc.slice(-47)
                  : bulkProgress.currentDoc
                }
              </span>
            )}
          </div>
        </div>
      )}

      {!showScanner && !isAdding && !isBulkProcessing && (
        <CaseFolderSetup 
          caseId={caseId}
          caseTitle={caseData?.title || 'Unknown Case'}
          onFolderSelected={() => {
            // Refresh the file system status
            setUseFileSystem(fileSystemManager.hasCaseFolder(caseId) || fileSystemManager.hasRootFolder());
          }}
        />
      )}

      {showScanner && (
        <div className="scanner-section">
          <div className="scanner-controls">
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowScanner(false)}
            >
              ← Back to Documents
            </button>
          </div>
          <CaseFolderScanner
            caseId={caseId}
            caseTitle={caseData?.title || 'Unknown Case'}
            onDocumentsScanned={handleDocumentsScanned}
          />
        </div>
      )}

      {isAdding && !showScanner && (
        <form className="document-form" onSubmit={handleSubmit}>
          {stateRestored && (
            <div className="restoration-notice">
              <div className="notice-content">
                <span className="notice-icon">💾</span>
                <span className="notice-text">Form state restored from previous session</span>
              </div>
            </div>
          )}
          
          <div className="form-group">
            <label>Document Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="e.g., Witness Statement of John Smith"
            />
          </div>

          <div className="form-group">
            <label>Upload File</label>
            <input
              type="file"
              accept=".txt,.pdf,.doc,.docx,.rtf"
              onChange={handleFileChange}
              className="file-input"
            />
            {selectedFile && (
              <div className="file-info">
                <small>Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)}KB)</small>
              </div>
            )}
            {isUploading && (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <small>Uploading... {uploadProgress}%</small>
              </div>
            )}
            {isProcessing && (
              <div className="processing-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill ai-progress" 
                    style={{ width: `${processingProgress}%` }}
                  ></div>
                </div>
                <small>🤖 AI is analyzing document... {Math.round(processingProgress)}%</small>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Document Category</label>
            <select
              value={formData.category}
              onChange={(e) => {
                const category = e.target.value as CaseDocument['category'];
                const availableTypes = getAvailableTypes(category);
                setFormData({ 
                  ...formData, 
                  category,
                  type: availableTypes[0]?.value as CaseDocument['type'] || 'witness_statement'
                });
              }}
            >
              <option value="claimant">Claimant Documents</option>
              <option value="defendant">Defendant Documents</option>
              <option value="pleadings">Pleadings</option>
              <option value="hearing_bundle">Hearing Bundle</option>
              <option value="authorities">Authorities</option>
              <option value="orders_judgments">Orders & Judgments</option>
            </select>
          </div>

          <div className="form-group">
            <label>Document Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as CaseDocument['type'] })}
            >
              {getAvailableTypes(formData.category || 'claimant').map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Summary/Key Points</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={4}
              required
              placeholder="Summarize the key points of this document..."
            />
          </div>

          <div className="form-group">
            <label>Page References</label>
            <input
              type="text"
              value={formData.pageReferences}
              onChange={(e) => setFormData({ ...formData, pageReferences: e.target.value })}
              placeholder="e.g., p.12-15, p.23"
            />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Additional notes or reminders..."
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={isUploading}>
              {isUploading ? 'Uploading...' : (editingDoc ? 'Update' : 'Add')} Document
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetForm} disabled={isUploading}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="document-list">
        {documents.length === 0 ? (
          <p className="empty-state">
            No documents added yet. 
            {scannedDocuments.length > 0 && ` (${scannedDocuments.length} scanned documents pending reload)`}
          </p>
        ) : (
          Object.entries(groupDocumentsByCategory(documents)).map(([category, docs]) => (
            <div key={category} className="document-category">
              <h3 className="category-header">{getCategoryLabel(category as CaseDocument['category'])}</h3>
              <div className="category-documents">
                {docs.map(doc => (
                  <div key={doc.id} className="document-item">
                    <div className="document-header">
                      <h4>{doc.title}</h4>
                      <span className="doc-type">{getDocTypeLabel(doc.type)}</span>
                    </div>
                    {doc.fileName && (
                      <p className="file-info">
                        📄 {doc.fileName} ({doc.fileSize ? Math.round(doc.fileSize / 1024) + 'KB' : 'Unknown size'})
                      </p>
                    )}
                    <p className="document-content">{doc.content}</p>
                    {doc.pageReferences && (
                      <p className="page-refs">Pages: {doc.pageReferences}</p>
                    )}
                    {doc.notes && (
                      <p className="document-notes">{doc.notes}</p>
                    )}
                    <div className="document-actions">
                      <button className="btn btn-sm" onClick={() => handleEdit(doc)}>
                        Edit
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(doc.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};