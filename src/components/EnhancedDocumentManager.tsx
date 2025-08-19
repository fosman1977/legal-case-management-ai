import React, { useState, useEffect } from 'react';
import { CaseDocument } from '../types';
import { PDFTextExtractor } from '../services/enhancedBrowserPdfExtractor';
import { storage } from '../utils/storage';
import { indexedDBManager } from '../utils/indexedDB';
import { fileSystemManager } from '../utils/fileSystemManager';
import { CaseFolderScanner } from './CaseFolderScanner';
import { CaseFolderSetup } from './CaseFolderSetup';
// Removed aiDocumentProcessor - using enhanced multi-engine system
import { useAISync } from '../hooks/useAISync';
import { unifiedAIClient } from '../utils/unifiedAIClient';
import { enhancedAIClient } from '../utils/enhancedAIClient';

// Modal Components
const TagEditModal: React.FC<{
  document: CaseDocument;
  onSave: (doc: CaseDocument, tags: string[], category?: CaseDocument['category'], type?: CaseDocument['type']) => void;
  onClose: () => void;
  suggestedTags: string[];
}> = ({ document, onSave, onClose, suggestedTags }) => {
  const [tags, setTags] = useState<string[]>(document.tags || []);
  const [category, setCategory] = useState(document.category);
  const [type, setType] = useState(document.type);
  const [newTag, setNewTag] = useState('');

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSave = () => {
    onSave(document, tags, category, type);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content tag-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🏷️ Edit Document Tags</h3>
          <button onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="document-info">
            <h4>{document.title}</h4>
            <p>{document.fileName}</p>
          </div>

          <div className="form-section">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as any)}>
              <option value="claimant">Claimant Documents</option>
              <option value="defendant">Defendant Documents</option>
              <option value="pleadings">Pleadings</option>
              <option value="hearing_bundle">Hearing Bundle</option>
              <option value="authorities">Authorities</option>
              <option value="orders_judgments">Orders & Judgments</option>
            </select>
          </div>

          <div className="form-section">
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as any)}>
              <option value="witness_statement">Witness Statement</option>
              <option value="exhibit">Exhibit</option>
              <option value="skeleton_argument">Skeleton Argument</option>
              <option value="particulars">Particulars</option>
              <option value="defence">Defence</option>
              <option value="reply">Reply</option>
              <option value="hearing_bundle">Hearing Bundle</option>
              <option value="authorities">Legal Authorities</option>
              <option value="order">Court Order</option>
              <option value="judgment">Judgment</option>
              <option value="letter">Letter</option>
              <option value="ruling">Ruling</option>
              <option value="memo">Memo</option>
            </select>
          </div>

          <div className="form-section">
            <label>Tags</label>
            <div className="tag-input-container">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add new tag..."
                onKeyPress={(e) => e.key === 'Enter' && addTag(newTag)}
              />
              <button onClick={() => addTag(newTag)} disabled={!newTag}>Add</button>
            </div>
            
            <div className="current-tags">
              <h5>Current Tags:</h5>
              <div className="tags-list">
                {tags.map(tag => (
                  <span key={tag} className="tag-item">
                    {tag}
                    <button onClick={() => removeTag(tag)}>×</button>
                  </span>
                ))}
                {tags.length === 0 && <span className="no-tags">No tags</span>}
              </div>
            </div>

            {suggestedTags.length > 0 && (
              <div className="suggested-tags">
                <h5>Suggested Tags:</h5>
                <div className="tags-list">
                  {suggestedTags.filter(tag => !tags.includes(tag)).map(tag => (
                    <button key={tag} className="suggested-tag" onClick={() => addTag(tag)}>
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const BulkTagModal: React.FC<{
  selectedCount: number;
  onSave: (tagsToAdd: string[], tagsToRemove: string[], category?: CaseDocument['category'], type?: CaseDocument['type']) => void;
  onClose: () => void;
}> = ({ selectedCount, onSave, onClose }) => {
  const [tagsToAdd, setTagsToAdd] = useState<string[]>([]);
  const [tagsToRemove, setTagsToRemove] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState<CaseDocument['category'] | undefined>();
  const [newType, setNewType] = useState<CaseDocument['type'] | undefined>();
  const [newTag, setNewTag] = useState('');
  const [removeTag, setRemoveTag] = useState('');

  const addToAddList = (tag: string) => {
    if (tag && !tagsToAdd.includes(tag)) {
      setTagsToAdd([...tagsToAdd, tag]);
      setNewTag('');
    }
  };

  const addToRemoveList = (tag: string) => {
    if (tag && !tagsToRemove.includes(tag)) {
      setTagsToRemove([...tagsToRemove, tag]);
      setRemoveTag('');
    }
  };

  const handleSave = () => {
    onSave(tagsToAdd, tagsToRemove, newCategory, newType);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content bulk-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🏷️ Bulk Tag Documents</h3>
          <button onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p className="bulk-info">Updating {selectedCount} selected documents</p>

          <div className="form-section">
            <label>Change Category (Optional)</label>
            <select value={newCategory || ''} onChange={(e) => setNewCategory(e.target.value as any || undefined)}>
              <option value="">-- Keep Current --</option>
              <option value="claimant">Claimant Documents</option>
              <option value="defendant">Defendant Documents</option>
              <option value="pleadings">Pleadings</option>
              <option value="hearing_bundle">Hearing Bundle</option>
              <option value="authorities">Authorities</option>
              <option value="orders_judgments">Orders & Judgments</option>
            </select>
          </div>

          <div className="form-section">
            <label>Change Type (Optional)</label>
            <select value={newType || ''} onChange={(e) => setNewType(e.target.value as any || undefined)}>
              <option value="">-- Keep Current --</option>
              <option value="witness_statement">Witness Statement</option>
              <option value="exhibit">Exhibit</option>
              <option value="skeleton_argument">Skeleton Argument</option>
              <option value="particulars">Particulars</option>
              <option value="defence">Defence</option>
              <option value="reply">Reply</option>
              <option value="hearing_bundle">Hearing Bundle</option>
              <option value="authorities">Legal Authorities</option>
              <option value="order">Court Order</option>
              <option value="judgment">Judgment</option>
              <option value="letter">Letter</option>
              <option value="ruling">Ruling</option>
              <option value="memo">Memo</option>
            </select>
          </div>

          <div className="form-section">
            <label>Add Tags</label>
            <div className="tag-input-container">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Tag to add to all documents..."
                onKeyPress={(e) => e.key === 'Enter' && addToAddList(newTag)}
              />
              <button onClick={() => addToAddList(newTag)} disabled={!newTag}>Add</button>
            </div>
            <div className="tags-list">
              {tagsToAdd.map(tag => (
                <span key={tag} className="tag-item add-tag">
                  + {tag}
                  <button onClick={() => setTagsToAdd(tagsToAdd.filter(t => t !== tag))}>×</button>
                </span>
              ))}
            </div>
          </div>

          <div className="form-section">
            <label>Remove Tags</label>
            <div className="tag-input-container">
              <input
                type="text"
                value={removeTag}
                onChange={(e) => setRemoveTag(e.target.value)}
                placeholder="Tag to remove from all documents..."
                onKeyPress={(e) => e.key === 'Enter' && addToRemoveList(removeTag)}
              />
              <button onClick={() => addToRemoveList(removeTag)} disabled={!removeTag}>Remove</button>
            </div>
            <div className="tags-list">
              {tagsToRemove.map(tag => (
                <span key={tag} className="tag-item remove-tag">
                  - {tag}
                  <button onClick={() => setTagsToRemove(tagsToRemove.filter(t => t !== tag))}>×</button>
                </span>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button className="btn btn-primary" onClick={handleSave}>Apply to All</button>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface EnhancedDocumentManagerProps {
  caseId: string;
  onDocumentChange?: () => void;
}

interface DocumentStats {
  totalDocuments: number;
  documentsByCategory: Record<string, number>;
  documentsByType: Record<string, number>;
  recentDocuments: CaseDocument[];
  averageSize: number;
  totalSize: number;
}

type ViewMode = 'grid' | 'list' | 'timeline' | 'stats';
type FilterBy = 'all' | 'category' | 'type' | 'recent';
type SortBy = 'title' | 'date' | 'size' | 'category';

export const EnhancedDocumentManager: React.FC<EnhancedDocumentManagerProps> = ({ 
  caseId, 
  onDocumentChange 
}) => {
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<CaseDocument | null>(null);
  const [editingTags, setEditingTags] = useState<CaseDocument | null>(null);
  const [showBulkTagging, setShowBulkTagging] = useState(false);

  // AI Synchronization
  const { publishAIResults, isProcessing: aiProcessing } = useAISync(caseId, 'EnhancedDocumentManager');
  
  // Form states
  const [isAdding, setIsAdding] = useState(false);
  const [editingDoc, setEditingDoc] = useState<CaseDocument | null>(null);
  const [formData, setFormData] = useState<Partial<CaseDocument>>({
    title: '',
    category: 'claimant',
    type: 'witness_statement',
    content: '',
    pageReferences: '',
    notes: '',
    tags: []
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  
  // System states
  const [caseData, setCaseData] = useState<any>(null);
  const [useFileSystem, setUseFileSystem] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedDocuments, setScannedDocuments] = useState<CaseDocument[]>([]);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, currentDoc: '' });

  useEffect(() => {
    initializeComponent();
  }, [caseId]);

  useEffect(() => {
    if (scannedDocuments.length > 0) {
      loadDocuments();
    }
  }, [scannedDocuments]);

  useEffect(() => {
    if (documents.length > 0) {
      calculateStats();
    }
  }, [documents]);

  const initializeComponent = async () => {
    setUseFileSystem(fileSystemManager.hasCaseFolder(caseId) || fileSystemManager.hasRootFolder());
    
    const cases = storage.getCasesSync();
    const currentCase = cases.find(c => c.id === caseId);
    setCaseData(currentCase);
    
    // Load scanned documents from localStorage
    const storageKey = `scanned_documents_${caseId}`;
    const savedScannedDocs = localStorage.getItem(storageKey);
    if (savedScannedDocs) {
      try {
        const documents = JSON.parse(savedScannedDocs);
        setScannedDocuments(documents);
      } catch (error) {
        console.error('Failed to parse saved scanned documents:', error);
      }
    }
    
    await loadDocuments();
    await initializeIndexedDB();
  };

  const initializeIndexedDB = async () => {
    try {
      await indexedDBManager.init();
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
    }
  };

  const loadDocuments = async () => {
    try {
      const allDocs: CaseDocument[] = [];

      // Add scanned documents
      if (scannedDocuments.length > 0) {
        allDocs.push(...scannedDocuments);
      }

      // Add file system documents
      if (useFileSystem && caseData) {
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
            tags: docMetadata.tags || [],
            fileName: fileName,
            fileSize: 0,
            fileType: fileName.split('.').pop() || '',
            fileContent: `File stored in OneDrive: ${filePath}`,
            createdAt: docMetadata.createdAt || new Date().toISOString(),
            filePath: filePath
          } as CaseDocument & { filePath: string };
        });

        allDocs.push(...fileSystemDocs);
      }

      // Add IndexedDB documents
      const indexedDBDocs = await indexedDBManager.getDocuments(caseId);
      allDocs.push(...indexedDBDocs);
      
      // Remove duplicates
      const uniqueDocs = allDocs.filter((doc, index, self) => 
        index === self.findIndex(d => d.fileName === doc.fileName || d.id === doc.id)
      );

      setDocuments(uniqueDocs);
    } catch (error) {
      console.error('Failed to load documents:', error);
      setDocuments(storage.getDocuments(caseId));
    }
  };

  const calculateStats = () => {
    const totalDocuments = documents.length;
    const documentsByCategory = documents.reduce((acc, doc) => {
      acc[doc.category] = (acc[doc.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const documentsByType = documents.reduce((acc, doc) => {
      acc[doc.type] = (acc[doc.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentDocuments = documents
      .filter(doc => doc.createdAt)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, 5);

    const totalSize = documents.reduce((acc, doc) => acc + (doc.fileSize || 0), 0);
    const averageSize = totalDocuments > 0 ? totalSize / totalDocuments : 0;

    setStats({
      totalDocuments,
      documentsByCategory,
      documentsByType,
      recentDocuments,
      averageSize,
      totalSize
    });
  };

  const handleDocumentsScanned = (documents: CaseDocument[]) => {
    const storageKey = `scanned_documents_${caseId}`;
    localStorage.setItem(storageKey, JSON.stringify(documents));
    setScannedDocuments(documents);
    setShowScanner(false);
    onDocumentChange?.();
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
          // Use unifiedAIClient for actual AI extraction
          console.log(`🤖 Extracting entities from ${doc.title} using AI...`);
          
          // Check if AI service is available first
          const aiStatus = unifiedAIClient.getConnectionStatus();
          if (aiStatus.status === 'disconnected') {
            console.warn(`⚠️ AI service not available: ${aiStatus.lastError}`);
            console.log('🔄 Attempting to connect to LocalAI...');
            const isAvailable = await unifiedAIClient.isAvailable();
            if (!isAvailable) {
              throw new Error(`LocalAI service unavailable: ${aiStatus.lastError}`);
            }
          }
          
          // Use enhanced multi-engine processing for better accuracy
          const entities = await enhancedAIClient.extractEntitiesIntelligent(
            doc.fileContent || doc.content, 
            'legal',
            'balanced' // Use balanced approach for bulk processing
          );
          
          console.log(`✅ Enhanced AI extraction results for ${doc.title}:`, {
            persons: entities.persons.length,
            issues: entities.issues.length,
            chronology: entities.chronologyEvents.length,
            authorities: entities.authorities.length,
            processingMode: entities.processingMode,
            consensusConfidence: entities.consensusConfidence,
            enginesUsed: entities.enginesUsed
          });
          
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
          // Check if this is a LocalAI connection error
          if ((error as Error).message?.includes('LocalAI service unavailable')) {
            console.error('🚫 LocalAI Connection Problem:', (error as Error).message);
            // Continue processing other documents but note the issue
          }
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
      
      // Show completion message with diagnostic info
      const totalEntities = totalExtracted.persons + totalExtracted.issues + totalExtracted.chronology + totalExtracted.authorities;
      const diagnosticMessage = totalEntities === 0 ? 
        '\n\n🔍 No entities were extracted. This might indicate:\n- LocalAI service is not running (check System Health tab)\n- Documents contain no recognizable legal entities\n- AI model needs configuration\n\nCheck the browser console for detailed error messages.' : 
        '\n\nCheck the Persons, Issues, Timeline, and Authorities tabs to see the results.';
      
      alert(`Bulk AI extraction complete!\n\nExtracted:\n- ${totalExtracted.persons} persons\n- ${totalExtracted.issues} issues\n- ${totalExtracted.chronology} chronology events\n- ${totalExtracted.authorities} authorities${diagnosticMessage}`);
      
    } catch (error) {
      console.error('Bulk AI extraction failed:', error);
      alert('Bulk AI extraction failed. Please try again.');
    } finally {
      setIsBulkProcessing(false);
      setBulkProgress({ current: 0, total: 0, currentDoc: '' });
    }
  };

  const filteredAndSortedDocuments = () => {
    let filtered = documents;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply category/type filter
    if (filterBy !== 'all') {
      if (filterBy === 'recent') {
        filtered = filtered.filter(doc => 
          doc.createdAt && new Date(doc.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        );
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'date':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'size':
          return (b.fileSize || 0) - (a.fileSize || 0);
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const handleSelectDocument = (docId: string) => {
    const newSelected = new Set(selectedDocs);
    if (newSelected.has(docId)) {
      newSelected.delete(docId);
    } else {
      newSelected.add(docId);
    }
    setSelectedDocs(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = () => {
    const allVisible = filteredAndSortedDocuments().map(doc => doc.id);
    setSelectedDocs(new Set(allVisible));
    setShowBulkActions(true);
  };

  const handleClearSelection = () => {
    setSelectedDocs(new Set());
    setShowBulkActions(false);
  };

  const handleSaveDocumentTags = async (doc: CaseDocument, newTags: string[], newCategory?: CaseDocument['category'], newType?: CaseDocument['type']) => {
    try {
      const updatedDoc = {
        ...doc,
        tags: newTags,
        category: newCategory || doc.category,
        type: newType || doc.type,
        updatedAt: new Date()
      };

      // Save to storage
      storage.saveDocument(updatedDoc);
      
      // Update file system metadata if applicable
      if (useFileSystem && caseData && doc.id.startsWith('fs_')) {
        const metadata = await fileSystemManager.loadCaseMetadata(caseId, caseData.title) || { documents: {} };
        metadata.documents = metadata.documents || {};
        metadata.documents[doc.id] = {
          ...metadata.documents[doc.id],
          tags: newTags,
          category: newCategory || doc.category,
          type: newType || doc.type,
          updatedAt: new Date().toISOString()
        };
        await fileSystemManager.saveCaseMetadata(caseId, caseData.title, metadata);
      }

      await loadDocuments();
      setEditingTags(null);
    } catch (error) {
      console.error('Failed to save document tags:', error);
      alert('Failed to update document. Please try again.');
    }
  };

  const handleBulkTagging = async (tagsToAdd: string[], tagsToRemove: string[], newCategory?: CaseDocument['category'], newType?: CaseDocument['type']) => {
    try {
      const selectedDocsList = documents.filter(doc => selectedDocs.has(doc.id));
      
      for (const doc of selectedDocsList) {
        const currentTags = doc.tags || [];
        const newTags = [...new Set([...currentTags.filter(tag => !tagsToRemove.includes(tag)), ...tagsToAdd])];
        
        await handleSaveDocumentTags(doc, newTags, newCategory, newType);
      }

      setShowBulkTagging(false);
      handleClearSelection();
    } catch (error) {
      console.error('Failed to bulk update tags:', error);
      alert('Failed to update documents. Please try again.');
    }
  };

  const getSuggestedTags = (doc: CaseDocument): string[] => {
    const suggestions = new Set<string>();
    const content = (doc.content + ' ' + doc.title + ' ' + (doc.fileContent || '')).toLowerCase();

    // Legal document type suggestions
    if (content.includes('witness statement')) suggestions.add('witness-statement');
    if (content.includes('expert report')) suggestions.add('expert-report');
    if (content.includes('contract')) suggestions.add('contract');
    if (content.includes('correspondence')) suggestions.add('correspondence');
    if (content.includes('pleading')) suggestions.add('pleading');
    if (content.includes('particulars of claim')) suggestions.add('particulars');
    if (content.includes('defence')) suggestions.add('defence');
    if (content.includes('reply')) suggestions.add('reply');
    
    // Party suggestions
    if (content.includes('claimant')) suggestions.add('claimant-document');
    if (content.includes('defendant')) suggestions.add('defendant-document');
    
    // Issue type suggestions
    if (content.includes('liability')) suggestions.add('liability');
    if (content.includes('quantum') || content.includes('damages')) suggestions.add('quantum');
    if (content.includes('breach')) suggestions.add('breach');
    
    // Importance suggestions
    if (content.includes('key') || content.includes('crucial')) suggestions.add('key-document');
    if (content.includes('confidential')) suggestions.add('confidential');
    
    return Array.from(suggestions);
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderStatsView = () => {
    if (!stats) return <div>Loading statistics...</div>;

    return (
      <div className="stats-view">
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-icon">📄</div>
            <div className="stat-value">{stats.totalDocuments}</div>
            <div className="stat-label">Total Documents</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💾</div>
            <div className="stat-value">{formatFileSize(stats.totalSize)}</div>
            <div className="stat-label">Total Size</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-value">{formatFileSize(stats.averageSize)}</div>
            <div className="stat-label">Average Size</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🕒</div>
            <div className="stat-value">{stats.recentDocuments.length}</div>
            <div className="stat-label">Recent (7 days)</div>
          </div>
        </div>

        <div className="stats-charts">
          <div className="chart-card">
            <h4>Documents by Category</h4>
            <div className="chart-bars">
              {Object.entries(stats.documentsByCategory).map(([category, count]) => (
                <div key={category} className="bar-item">
                  <span className="bar-label">{getCategoryLabel(category as any)}</span>
                  <div className="bar-container">
                    <div 
                      className="bar-fill" 
                      style={{ width: `${(count / stats.totalDocuments) * 100}%` }}
                    ></div>
                  </div>
                  <span className="bar-count">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card">
            <h4>Documents by Type</h4>
            <div className="chart-bars">
              {Object.entries(stats.documentsByType).slice(0, 6).map(([type, count]) => (
                <div key={type} className="bar-item">
                  <span className="bar-label">{getDocTypeLabel(type as any)}</span>
                  <div className="bar-container">
                    <div 
                      className="bar-fill" 
                      style={{ width: `${(count / stats.totalDocuments) * 100}%` }}
                    ></div>
                  </div>
                  <span className="bar-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {stats.recentDocuments.length > 0 && (
          <div className="recent-documents">
            <h4>📅 Recent Documents</h4>
            <div className="recent-list">
              {stats.recentDocuments.map(doc => (
                <div key={doc.id} className="recent-item">
                  <div className="recent-icon">📄</div>
                  <div className="recent-content">
                    <div className="recent-title">{doc.title}</div>
                    <div className="recent-meta">
                      {getCategoryLabel(doc.category)} • {formatDate(typeof doc.createdAt === 'string' ? doc.createdAt : doc.createdAt?.toISOString() || new Date().toISOString())}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderGridView = () => {
    const docs = filteredAndSortedDocuments();
    
    return (
      <div className="grid-view">
        {docs.map(doc => (
          <div 
            key={doc.id} 
            className={`document-card ${selectedDocs.has(doc.id) ? 'selected' : ''}`}
            onClick={() => handleSelectDocument(doc.id)}
          >
            <div className="card-header">
              <div className="doc-icon">
                {doc.fileType === 'pdf' ? '📄' : 
                 doc.fileType === 'doc' || doc.fileType === 'docx' ? '📝' : 
                 '📋'}
              </div>
              <div className="doc-category">{getCategoryLabel(doc.category)}</div>
            </div>
            <div className="card-content">
              <h4 className="doc-title">{doc.title}</h4>
              <p className="doc-type">{getDocTypeLabel(doc.type)}</p>
              <p className="doc-summary">{doc.content.substring(0, 100)}...</p>
              {doc.tags && doc.tags.length > 0 && (
                <div className="doc-tags">
                  {doc.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="card-footer">
              <span className="doc-date">{formatDate(typeof doc.createdAt === 'string' ? doc.createdAt : doc.createdAt?.toISOString() || new Date().toISOString())}</span>
              {doc.fileSize && <span className="doc-size">{formatFileSize(doc.fileSize)}</span>}
            </div>
            <div className="card-actions">
              <button 
                className="btn-icon" 
                onClick={(e) => { e.stopPropagation(); setEditingTags(doc); }}
                title="Edit Tags"
              >
                🏷️
              </button>
              <button 
                className="btn-icon" 
                onClick={(e) => { e.stopPropagation(); setPreviewDoc(doc); }}
                title="Preview"
              >
                👁️
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderListView = () => {
    const docs = filteredAndSortedDocuments();
    
    return (
      <div className="list-view">
        <div className="list-header">
          <div className="list-col">Document</div>
          <div className="list-col">Category</div>
          <div className="list-col">Type</div>
          <div className="list-col">Date</div>
          <div className="list-col">Size</div>
          <div className="list-col">Actions</div>
        </div>
        {docs.map(doc => (
          <div 
            key={doc.id}
            className={`list-row ${selectedDocs.has(doc.id) ? 'selected' : ''}`}
            onClick={() => handleSelectDocument(doc.id)}
          >
            <div className="list-col">
              <div className="doc-info">
                <div className="doc-icon">📄</div>
                <div>
                  <div className="doc-title">{doc.title}</div>
                  <div className="doc-filename">{doc.fileName}</div>
                </div>
              </div>
            </div>
            <div className="list-col">
              <span className="category-badge">{getCategoryLabel(doc.category)}</span>
            </div>
            <div className="list-col">{getDocTypeLabel(doc.type)}</div>
            <div className="list-col">{formatDate(typeof doc.createdAt === 'string' ? doc.createdAt : doc.createdAt?.toISOString() || new Date().toISOString())}</div>
            <div className="list-col">{doc.fileSize ? formatFileSize(doc.fileSize) : '-'}</div>
            <div className="list-col">
              <button 
                className="btn-icon" 
                onClick={(e) => { e.stopPropagation(); setEditingTags(doc); }}
                title="Edit Tags"
              >
                🏷️
              </button>
              <button 
                className="btn-icon" 
                onClick={(e) => { e.stopPropagation(); setPreviewDoc(doc); }}
                title="Preview"
              >
                👁️
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTimelineView = () => {
    const docs = filteredAndSortedDocuments();
    const groupedByDate = docs.reduce((acc, doc) => {
      const date = new Date(doc.createdAt || Date.now()).toLocaleDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(doc);
      return acc;
    }, {} as Record<string, CaseDocument[]>);

    return (
      <div className="timeline-view">
        {Object.entries(groupedByDate).map(([date, docs]) => (
          <div key={date} className="timeline-group">
            <div className="timeline-date">
              <div className="date-marker"></div>
              <h4>{date}</h4>
            </div>
            <div className="timeline-items">
              {docs.map(doc => (
                <div key={doc.id} className="timeline-item">
                  <div className="timeline-content">
                    <h5>{doc.title}</h5>
                    <p>{getCategoryLabel(doc.category)} • {getDocTypeLabel(doc.type)}</p>
                    <p className="timeline-summary">{doc.content.substring(0, 150)}...</p>
                  </div>
                  <div className="timeline-actions">
                    <button onClick={() => setPreviewDoc(doc)}>👁️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="enhanced-document-manager">
      {/* Header */}
      <div className="manager-header">
        <div className="header-info">
          <h3>📄 Enhanced Documents</h3>
          <p className="doc-count">{documents.length} documents • {stats && formatFileSize(stats.totalSize)}</p>
        </div>
        <div className="header-actions">
          {!showScanner && !isAdding && !isBulkProcessing && (
            <>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowScanner(true)}
              >
                📁 Scan Folder
              </button>
              {documents.length > 0 && (
                <button 
                  className="btn btn-secondary" 
                  onClick={processBulkAIExtraction}
                  title="Extract persons, issues, dates, and authorities from all documents"
                >
                  🤖 AI Extract All
                </button>
              )}
              <button 
                className="btn btn-primary" 
                onClick={() => setIsAdding(true)}
              >
                + Add Document
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bulk Processing Progress */}
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

      {/* Controls */}
      {!showScanner && !isAdding && !isBulkProcessing && (
        <div className="controls-bar">
          <div className="search-controls">
            <input
              type="text"
              placeholder="Search documents..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select 
              value={filterBy} 
              onChange={(e) => setFilterBy(e.target.value as FilterBy)}
              className="filter-select"
            >
              <option value="all">All Documents</option>
              <option value="recent">Recent (7 days)</option>
            </select>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="sort-select"
            >
              <option value="date">Sort by Date</option>
              <option value="title">Sort by Title</option>
              <option value="category">Sort by Category</option>
              <option value="size">Sort by Size</option>
            </select>
          </div>
          
          <div className="view-controls">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              ⚏
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              ☰
            </button>
            <button 
              className={`view-btn ${viewMode === 'timeline' ? 'active' : ''}`}
              onClick={() => setViewMode('timeline')}
            >
              📅
            </button>
            <button 
              className={`view-btn ${viewMode === 'stats' ? 'active' : ''}`}
              onClick={() => setViewMode('stats')}
            >
              📊
            </button>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {showBulkActions && (
        <div className="bulk-actions">
          <span>{selectedDocs.size} documents selected</span>
          <button onClick={handleSelectAll}>Select All</button>
          <button onClick={handleClearSelection}>Clear Selection</button>
          <button onClick={() => setShowBulkTagging(true)}>🏷️ Bulk Tag</button>
          <button className="btn-danger">Delete Selected</button>
        </div>
      )}

      {/* Case Folder Setup */}
      {!showScanner && !isAdding && (
        <CaseFolderSetup 
          caseId={caseId}
          caseTitle={caseData?.title || 'Unknown Case'}
          onFolderSelected={() => {
            setUseFileSystem(fileSystemManager.hasCaseFolder(caseId) || fileSystemManager.hasRootFolder());
          }}
        />
      )}

      {/* Scanner */}
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

      {/* Content Area */}
      {!showScanner && !isAdding && (
        <div className="content-area">
          {viewMode === 'grid' && renderGridView()}
          {viewMode === 'list' && renderListView()}
          {viewMode === 'timeline' && renderTimelineView()}
          {viewMode === 'stats' && renderStatsView()}
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="modal-overlay" onClick={() => setPreviewDoc(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{previewDoc.title}</h3>
              <button onClick={() => setPreviewDoc(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="preview-meta">
                <span>Category: {getCategoryLabel(previewDoc.category)}</span>
                <span>Type: {getDocTypeLabel(previewDoc.type)}</span>
                {previewDoc.fileSize && <span>Size: {formatFileSize(previewDoc.fileSize)}</span>}
              </div>
              <div className="preview-content">
                <h4>Summary</h4>
                <p>{previewDoc.content}</p>
                {previewDoc.notes && (
                  <>
                    <h4>Notes</h4>
                    <p>{previewDoc.notes}</p>
                  </>
                )}
                {previewDoc.fileContent && (
                  <>
                    <h4>Document Content</h4>
                    <pre className="file-content">{previewDoc.fileContent.substring(0, 2000)}</pre>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tags Modal */}
      {editingTags && (
        <TagEditModal 
          document={editingTags}
          onSave={handleSaveDocumentTags}
          onClose={() => setEditingTags(null)}
          suggestedTags={getSuggestedTags(editingTags)}
        />
      )}

      {/* Bulk Tagging Modal */}
      {showBulkTagging && (
        <BulkTagModal 
          selectedCount={selectedDocs.size}
          onSave={handleBulkTagging}
          onClose={() => setShowBulkTagging(false)}
        />
      )}

      <style>{`
        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
        }

        .modal-header h3 {
          margin: 0;
          color: #333;
        }

        .modal-header button {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #666;
          padding: 4px;
          border-radius: 4px;
        }

        .modal-header button:hover {
          background: #f0f0f0;
        }

        .modal-body {
          padding: 20px;
        }

        .document-info {
          margin-bottom: 20px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .document-info h4 {
          margin: 0 0 4px 0;
          color: #333;
        }

        .document-info p {
          margin: 0;
          color: #666;
          font-size: 14px;
        }

        .form-section {
          margin-bottom: 20px;
        }

        .form-section label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
        }

        .form-section select,
        .form-section input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }

        .tag-input-container {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }

        .tag-input-container input {
          flex: 1;
        }

        .tag-input-container button {
          padding: 8px 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .tag-input-container button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .current-tags,
        .suggested-tags {
          margin-top: 12px;
        }

        .current-tags h5,
        .suggested-tags h5 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #333;
        }

        .tags-list {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .tag-item {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: #e9ecef;
          border-radius: 4px;
          font-size: 12px;
          color: #495057;
        }

        .tag-item button {
          background: none;
          border: none;
          cursor: pointer;
          color: #666;
          font-size: 14px;
          padding: 0;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .tag-item button:hover {
          background: rgba(0,0,0,0.1);
        }

        .add-tag {
          background: #d4edda;
          color: #155724;
        }

        .remove-tag {
          background: #f8d7da;
          color: #721c24;
        }

        .suggested-tag {
          padding: 4px 8px;
          background: #e3f2fd;
          color: #1976d2;
          border: 1px solid #bbdefb;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .suggested-tag:hover {
          background: #bbdefb;
        }

        .no-tags {
          color: #999;
          font-style: italic;
          font-size: 12px;
        }

        .bulk-info {
          margin-bottom: 20px;
          padding: 12px;
          background: #e3f2fd;
          border-radius: 6px;
          color: #1976d2;
          font-weight: 500;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover {
          background: #0056b3;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background: #545b62;
        }

        .enhanced-document-manager {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .manager-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          color: white;
        }

        .header-info h3 {
          margin: 0 0 4px 0;
          font-size: 24px;
        }

        .doc-count {
          margin: 0;
          opacity: 0.9;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .controls-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding: 16px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .search-controls {
          display: flex;
          gap: 12px;
          flex: 1;
        }

        .search-input {
          flex: 1;
          max-width: 300px;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }

        .filter-select, .sort-select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          background: white;
        }

        .view-controls {
          display: flex;
          gap: 4px;
        }

        .view-btn {
          padding: 8px 12px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s;
        }

        .view-btn:hover {
          background: #f5f5f5;
        }

        .view-btn.active {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        .bulk-actions {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 16px;
          padding: 12px 16px;
          background: #e3f2fd;
          border-radius: 8px;
          border-left: 4px solid #2196f3;
        }

        .content-area {
          min-height: 400px;
        }

        /* Grid View */
        .grid-view {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        .document-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }

        .document-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }

        .document-card.selected {
          border: 2px solid #007bff;
          box-shadow: 0 4px 16px rgba(0,123,255,0.3);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: #f8f9fa;
        }

        .doc-icon {
          font-size: 24px;
        }

        .doc-category {
          font-size: 12px;
          padding: 4px 8px;
          background: #007bff;
          color: white;
          border-radius: 12px;
        }

        .card-content {
          padding: 16px;
        }

        .doc-title {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
          color: #333;
          line-height: 1.3;
        }

        .doc-type {
          margin: 0 0 12px 0;
          color: #666;
          font-size: 14px;
        }

        .doc-summary {
          margin: 0 0 12px 0;
          color: #777;
          font-size: 14px;
          line-height: 1.4;
        }

        .doc-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .tag {
          font-size: 11px;
          padding: 2px 6px;
          background: #e9ecef;
          border-radius: 4px;
          color: #495057;
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #f8f9fa;
          font-size: 12px;
          color: #666;
        }

        .card-actions {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .document-card:hover .card-actions {
          opacity: 1;
        }

        .btn-icon {
          padding: 6px;
          background: rgba(255,255,255,0.9);
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        /* List View */
        .list-view {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .list-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
          gap: 16px;
          padding: 16px;
          background: #f8f9fa;
          font-weight: 600;
          color: #333;
          border-bottom: 1px solid #dee2e6;
        }

        .list-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
          gap: 16px;
          padding: 16px;
          border-bottom: 1px solid #f0f0f0;
          cursor: pointer;
          transition: background 0.2s;
        }

        .list-row:hover {
          background: #f8f9fa;
        }

        .list-row.selected {
          background: #e3f2fd;
        }

        .doc-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .doc-filename {
          font-size: 12px;
          color: #666;
        }

        .category-badge {
          font-size: 12px;
          padding: 4px 8px;
          background: #e9ecef;
          border-radius: 12px;
        }

        /* Timeline View */
        .timeline-view {
          position: relative;
        }

        .timeline-group {
          position: relative;
          margin-bottom: 32px;
        }

        .timeline-date {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .date-marker {
          width: 16px;
          height: 16px;
          background: #007bff;
          border-radius: 50%;
          position: relative;
        }

        .date-marker::after {
          content: '';
          position: absolute;
          left: 50%;
          top: 100%;
          width: 2px;
          height: 100px;
          background: #ddd;
          transform: translateX(-50%);
        }

        .timeline-items {
          margin-left: 20px;
          padding-left: 20px;
          border-left: 2px solid #ddd;
        }

        .timeline-item {
          background: white;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          position: relative;
        }

        .timeline-item::before {
          content: '';
          position: absolute;
          left: -28px;
          top: 20px;
          width: 8px;
          height: 8px;
          background: #007bff;
          border-radius: 50%;
        }

        .timeline-summary {
          color: #666;
          margin: 8px 0 0 0;
        }

        /* Stats View */
        .stats-view {
          display: grid;
          gap: 24px;
        }

        .stats-overview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .stat-card {
          background: white;
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
          text-align: center;
        }

        .stat-icon {
          font-size: 32px;
          margin-bottom: 12px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #333;
        }

        .stat-label {
          color: #666;
          font-size: 14px;
        }

        .stats-charts {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .chart-card {
          background: white;
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }

        .chart-card h4 {
          margin: 0 0 20px 0;
          color: #333;
        }

        .chart-bars {
          display: grid;
          gap: 12px;
        }

        .bar-item {
          display: grid;
          grid-template-columns: 1fr 2fr auto;
          gap: 12px;
          align-items: center;
        }

        .bar-label {
          font-size: 14px;
          color: #666;
        }

        .bar-container {
          height: 8px;
          background: #f0f0f0;
          border-radius: 4px;
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #007bff, #0056b3);
          transition: width 0.5s ease;
        }

        .bar-count {
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }

        .recent-documents {
          background: white;
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }

        .recent-documents h4 {
          margin: 0 0 20px 0;
          color: #333;
        }

        .recent-list {
          display: grid;
          gap: 12px;
        }

        .recent-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .recent-icon {
          font-size: 20px;
        }

        .recent-title {
          font-weight: 500;
          color: #333;
        }

        .recent-meta {
          font-size: 12px;
          color: #666;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          max-width: 800px;
          width: 90%;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #dee2e6;
        }

        .modal-header h3 {
          margin: 0;
        }

        .modal-header button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
        }

        .modal-body {
          padding: 20px;
          overflow-y: auto;
        }

        .preview-meta {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
          font-size: 14px;
          color: #666;
        }

        .preview-content h4 {
          margin: 20px 0 8px 0;
          color: #333;
        }

        .file-content {
          background: #f8f9fa;
          padding: 16px;
          border-radius: 8px;
          font-size: 12px;
          line-height: 1.4;
          white-space: pre-wrap;
          overflow-x: auto;
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover {
          background: #0056b3;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background: #545b62;
        }

        .btn-danger {
          background: #dc3545;
          color: white;
        }

        .btn-danger:hover {
          background: #c82333;
        }

        /* Tag Modal Styles */
        .tag-modal,
        .bulk-modal {
          max-width: 600px;
          width: 90%;
        }

        .document-info {
          margin-bottom: 20px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .document-info h4 {
          margin: 0 0 4px 0;
          color: #333;
        }

        .document-info p {
          margin: 0;
          color: #666;
          font-size: 14px;
        }

        .form-section {
          margin-bottom: 20px;
        }

        .form-section label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: #333;
        }

        .form-section select,
        .form-section input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }

        .tag-input-container {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }

        .tag-input-container input {
          flex: 1;
        }

        .tag-input-container button {
          padding: 8px 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        .tag-input-container button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .current-tags,
        .suggested-tags {
          margin-top: 12px;
        }

        .current-tags h5,
        .suggested-tags h5 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #333;
        }

        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .tag-item {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: #e9ecef;
          border-radius: 12px;
          font-size: 12px;
          color: #495057;
        }

        .tag-item.add-tag {
          background: #d4edda;
          color: #155724;
        }

        .tag-item.remove-tag {
          background: #f8d7da;
          color: #721c24;
        }

        .tag-item button {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          color: #6c757d;
          padding: 0;
          margin-left: 4px;
        }

        .tag-item button:hover {
          color: #495057;
        }

        .suggested-tag {
          padding: 4px 8px;
          background: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
          border-radius: 12px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .suggested-tag:hover {
          background: #ffeaa7;
        }

        .no-tags {
          color: #999;
          font-style: italic;
          font-size: 12px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
          justify-content: flex-end;
        }

        .bulk-info {
          background: #e3f2fd;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 20px;
          font-weight: 500;
          color: #1976d2;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .controls-bar {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }

          .search-controls {
            flex-direction: column;
          }

          .search-input {
            max-width: none;
          }

          .grid-view {
            grid-template-columns: 1fr;
          }

          .list-header, .list-row {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .stats-charts {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};