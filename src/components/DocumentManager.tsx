import React, { useState, useEffect } from 'react';
import { CaseDocument } from '../types';
import { storage } from '../utils/storage';

interface DocumentManagerProps {
  caseId: string;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({ caseId }) => {
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingDoc, setEditingDoc] = useState<CaseDocument | null>(null);
  const [formData, setFormData] = useState<Partial<CaseDocument>>({
    title: '',
    type: 'other',
    content: '',
    pageReferences: '',
    notes: ''
  });

  useEffect(() => {
    loadDocuments();
  }, [caseId]);

  const loadDocuments = () => {
    setDocuments(storage.getDocuments(caseId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const doc: CaseDocument = {
      ...formData,
      id: editingDoc?.id || Date.now().toString(),
      caseId,
    } as CaseDocument;

    storage.saveDocument(doc);
    loadDocuments();
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'other',
      content: '',
      pageReferences: '',
      notes: ''
    });
    setIsAdding(false);
    setEditingDoc(null);
  };

  const handleEdit = (doc: CaseDocument) => {
    setEditingDoc(doc);
    setFormData(doc);
    setIsAdding(true);
  };

  const handleDelete = (docId: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      storage.deleteDocument(docId);
      loadDocuments();
    }
  };

  const getDocTypeLabel = (type: CaseDocument['type']) => {
    const labels = {
      witness_statement: 'Witness Statement',
      expert_report: 'Expert Report',
      exhibit: 'Exhibit',
      authority: 'Authority',
      skeleton_argument: 'Skeleton Argument',
      other: 'Other'
    };
    return labels[type];
  };

  return (
    <div className="document-manager">
      <div className="manager-header">
        <h3>Case Documents</h3>
        {!isAdding && (
          <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
            + Add Document
          </button>
        )}
      </div>

      {isAdding && (
        <form className="document-form" onSubmit={handleSubmit}>
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
            <label>Document Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as CaseDocument['type'] })}
            >
              <option value="witness_statement">Witness Statement</option>
              <option value="expert_report">Expert Report</option>
              <option value="exhibit">Exhibit</option>
              <option value="authority">Authority</option>
              <option value="skeleton_argument">Skeleton Argument</option>
              <option value="other">Other</option>
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
            <button type="submit" className="btn btn-primary">
              {editingDoc ? 'Update' : 'Add'} Document
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="document-list">
        {documents.length === 0 ? (
          <p className="empty-state">No documents added yet.</p>
        ) : (
          documents.map(doc => (
            <div key={doc.id} className="document-item">
              <div className="document-header">
                <h4>{doc.title}</h4>
                <span className="doc-type">{getDocTypeLabel(doc.type)}</span>
              </div>
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
          ))
        )}
      </div>
    </div>
  );
};