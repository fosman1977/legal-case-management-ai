import React, { useState, useEffect } from 'react';
import { CaseDocument } from '../types';
import { AdvancedPDFExtractor, ExtractionProgress } from '../utils/advancedPdfExtractor';
import { PDFTextExtractor } from '../utils/pdfExtractor'; // Fallback
import { PDFExtractionProgress } from './PDFExtractionProgress';
import { storage } from '../utils/storage';
import { indexedDBManager } from '../utils/indexedDB';

interface EnhancedDocumentManagerProps {
  caseId: string;
  onDocumentChange?: () => void;
}

export const EnhancedDocumentManager: React.FC<EnhancedDocumentManagerProps> = ({ 
  caseId, 
  onDocumentChange 
}) => {
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractionProgress, setExtractionProgress] = useState<ExtractionProgress | null>(null);
  const [extractionMethod, setExtractionMethod] = useState<'standard' | 'advanced' | 'ocr'>('advanced');
  const [formData, setFormData] = useState<Partial<CaseDocument>>({
    title: '',
    category: 'claimant',
    type: 'witness_statement',
    content: '',
    pageReferences: '',
    notes: ''
  });

  useEffect(() => {
    loadDocuments();
  }, [caseId]);

  const loadDocuments = async () => {
    try {
      const caseDocuments = await storage.getCaseDocuments(caseId);
      setDocuments(caseDocuments);
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = await AdvancedPDFExtractor.validateFile(file);
    if (!validation.valid) {
      alert(`File validation failed:\n${validation.issues.join('\n')}`);
      return;
    }

    setSelectedFile(file);
    setFormData(prev => ({
      ...prev,
      title: file.name.replace('.pdf', '')
    }));
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    switch (extractionMethod) {
      case 'advanced':
        return await AdvancedPDFExtractor.extractTextAdvanced(file, {
          chunkSize: 10, // Process 10 pages at a time for big docs
          preserveFormatting: true,
          onProgress: setExtractionProgress
        });
      
      case 'ocr':
        return await AdvancedPDFExtractor.extractWithOCR(file, {
          onProgress: setExtractionProgress
        });
      
      default:
        return await PDFTextExtractor.extractText(file);
    }
  };

  const handleDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title?.trim()) {
      alert('Please enter a document title');
      return;
    }

    try {
      let extractedText = '';
      let fileId: string | undefined;

      // Handle file upload and text extraction
      if (selectedFile) {
        setExtractionProgress({ 
          currentPage: 0, 
          totalPages: 0, 
          extractedText: '', 
          status: 'processing' 
        });

        try {
          // Extract text based on selected method
          extractedText = await extractTextFromFile(selectedFile);
          
          // Store file in IndexedDB
          fileId = await indexedDBManager.saveFile(selectedFile);
          
          console.log(`✅ Document processed: ${extractedText.length} characters extracted`);
          
        } catch (extractionError) {
          console.error('PDF extraction failed:', extractionError);
          
          // Try fallback extraction
          try {
            console.log('🔄 Trying fallback extraction...');
            extractedText = await PDFTextExtractor.extractText(selectedFile);
            fileId = await indexedDBManager.saveFile(selectedFile);
          } catch (fallbackError) {
            alert(`Failed to extract text from PDF: ${extractionError}`);
            setExtractionProgress(null);
            return;
          }
        }
      }

      // Create document object
      const newDocument: CaseDocument = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
        caseId,
        title: formData.title.trim(),
        category: formData.category as any,
        type: formData.type as any,
        content: formData.content || '',
        fileContent: extractedText,
        pageReferences: formData.pageReferences || '',
        notes: formData.notes || '',
        fileId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save document
      storage.saveDocument(newDocument);
      await loadDocuments();
      
      // Reset form
      setIsAdding(false);
      setSelectedFile(null);
      setExtractionProgress(null);
      setFormData({
        title: '',
        category: 'claimant',
        type: 'witness_statement',
        content: '',
        pageReferences: '',
        notes: ''
      });

      if (onDocumentChange) {
        onDocumentChange();
      }

    } catch (error) {
      console.error('Failed to save document:', error);
      alert('Failed to save document. Please try again.');
      setExtractionProgress(null);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const doc = documents.find(d => d.id === docId);
      if (doc?.fileId) {
        await indexedDBManager.deleteFile(doc.fileId);
      }
      
      storage.deleteDocument(docId);
      await loadDocuments();
      
      if (onDocumentChange) {
        onDocumentChange();
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Failed to delete document.');
    }
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="enhanced-document-manager">
      <div className="document-header">
        <h3>📁 Document Management</h3>
        <div className="document-stats">
          <span>📄 {documents.length} documents</span>
          <span>📊 {documents.reduce((acc, doc) => acc + (doc.fileContent?.length || 0), 0).toLocaleString()} characters</span>
        </div>
      </div>

      {!isAdding ? (
        <div className="document-list">
          <button 
            className="btn btn-primary add-document-btn"
            onClick={() => setIsAdding(true)}
          >
            ➕ Add Document
          </button>

          {documents.length === 0 ? (
            <div className="empty-state">
              <p>📄 No documents added yet</p>
              <p>Upload legal documents to begin AI analysis</p>
            </div>
          ) : (
            <div className="documents-grid">
              {documents.map(doc => (
                <div key={doc.id} className="document-card">
                  <div className="document-info">
                    <h4>{doc.title}</h4>
                    <div className="document-meta">
                      <span className="category">{doc.category}</span>
                      <span className="type">{doc.type}</span>
                    </div>
                    {doc.fileContent && (
                      <div className="extraction-info">
                        <span>📊 {doc.fileContent.length.toLocaleString()} characters extracted</span>
                      </div>
                    )}
                  </div>
                  <div className="document-actions">
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteDocument(doc.id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleDocumentSubmit} className="document-form">
          <h4>➕ Add New Document</h4>

          {/* PDF Extraction Method Selection */}
          <div className="form-group">
            <label>🔧 Extraction Method:</label>
            <select 
              value={extractionMethod} 
              onChange={(e) => setExtractionMethod(e.target.value as any)}
              className="form-control"
            >
              <option value="advanced">🚀 Advanced (Best for large legal docs)</option>
              <option value="standard">📄 Standard (Faster, basic extraction)</option>
              <option value="ocr">🔍 OCR (For scanned documents)</option>
            </select>
            <small className="form-help">
              {extractionMethod === 'advanced' && '• Chunks processing, preserves formatting, progress tracking'}
              {extractionMethod === 'standard' && '• Simple extraction, good for small documents'}
              {extractionMethod === 'ocr' && '• OCR fallback for scanned/image-based PDFs'}
            </small>
          </div>

          {/* File Upload */}
          <div className="form-group">
            <label>📎 Upload PDF File:</label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="form-control"
            />
            {selectedFile && (
              <div className="file-info">
                <span>📄 {selectedFile.name}</span>
                <span>📏 {formatFileSize(selectedFile.size)}</span>
              </div>
            )}
          </div>

          {/* Extraction Progress */}
          {extractionProgress && (
            <PDFExtractionProgress 
              progress={extractionProgress}
              fileName={selectedFile?.name || ''}
              onCancel={() => setExtractionProgress(null)}
            />
          )}

          {/* Document Details */}
          <div className="form-group">
            <label>Document Title:</label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="form-control"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category:</label>
              <select 
                value={formData.category || 'claimant'} 
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as CaseDocument['category'] }))}
                className="form-control"
              >
                <option value="claimant">Claimant</option>
                <option value="defendant">Defendant</option>
                <option value="court">Court</option>
                <option value="expert">Expert</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Type:</label>
              <select 
                value={formData.type || 'witness_statement'} 
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as CaseDocument['type'] }))}
                className="form-control"
              >
                <option value="witness_statement">Witness Statement</option>
                <option value="expert_report">Expert Report</option>
                <option value="contract">Contract</option>
                <option value="correspondence">Correspondence</option>
                <option value="court_order">Court Order</option>
                <option value="pleading">Pleading</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Additional Notes:</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="form-control"
              rows={3}
              placeholder="Any additional notes about this document..."
            />
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={extractionProgress?.status === 'processing'}
            >
              {extractionProgress?.status === 'processing' ? '⏳ Processing...' : '💾 Save Document'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => {
                setIsAdding(false);
                setSelectedFile(null);
                setExtractionProgress(null);
              }}
            >
              ❌ Cancel
            </button>
          </div>
        </form>
      )}

      <style>{`
        .enhanced-document-manager {
          padding: 20px;
        }

        .document-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #e9ecef;
        }

        .document-stats {
          display: flex;
          gap: 16px;
          font-size: 14px;
          color: #6c757d;
        }

        .add-document-btn {
          width: 100%;
          margin-bottom: 20px;
          padding: 12px;
          font-size: 16px;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #6c757d;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .documents-grid {
          display: grid;
          gap: 16px;
        }

        .document-card {
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .document-info h4 {
          margin: 0 0 8px 0;
          color: #495057;
        }

        .document-meta {
          display: flex;
          gap: 12px;
          margin-bottom: 8px;
        }

        .category, .type {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .category {
          background: #e3f2fd;
          color: #1976d2;
        }

        .type {
          background: #f3e5f5;
          color: #7b1fa2;
        }

        .extraction-info {
          font-size: 12px;
          color: #28a745;
          font-weight: 500;
        }

        .document-form {
          background: #f8f9fa;
          padding: 24px;
          border-radius: 8px;
          border: 1px solid #dee2e6;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: #495057;
        }

        .form-control {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-help {
          display: block;
          margin-top: 4px;
          font-size: 12px;
          color: #6c757d;
        }

        .file-info {
          display: flex;
          gap: 16px;
          margin-top: 8px;
          padding: 8px 12px;
          background: #e9ecef;
          border-radius: 4px;
          font-size: 14px;
          color: #495057;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          transition: background-color 0.2s;
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

        .btn-sm {
          padding: 6px 12px;
          font-size: 12px;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};