import React, { useState, useEffect } from 'react';
import { LegalAuthority } from '../types';
import { storage } from '../utils/storage';

interface AuthoritiesManagerProps {
  caseId: string;
}

export const AuthoritiesManager: React.FC<AuthoritiesManagerProps> = ({ caseId }) => {
  const [authorities, setAuthorities] = useState<LegalAuthority[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingAuth, setEditingAuth] = useState<LegalAuthority | null>(null);
  const [formData, setFormData] = useState<Partial<LegalAuthority>>({
    citation: '',
    principle: '',
    relevance: '',
    paragraph: ''
  });

  useEffect(() => {
    loadAuthorities();
  }, [caseId]);

  const loadAuthorities = () => {
    setAuthorities(storage.getAuthorities(caseId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const authority: LegalAuthority = {
      ...formData,
      id: editingAuth?.id || Date.now().toString(),
      caseId,
    } as LegalAuthority;

    storage.saveAuthority(authority);
    loadAuthorities();
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      citation: '',
      principle: '',
      relevance: '',
      paragraph: ''
    });
    setIsAdding(false);
    setEditingAuth(null);
  };

  const handleEdit = (auth: LegalAuthority) => {
    setEditingAuth(auth);
    setFormData(auth);
    setIsAdding(true);
  };

  const handleDelete = (authId: string) => {
    if (window.confirm('Are you sure you want to delete this authority?')) {
      storage.deleteAuthority(authId);
      loadAuthorities();
    }
  };

  return (
    <div className="authorities-manager">
      <div className="manager-header">
        <h3>Legal Authorities</h3>
        {!isAdding && (
          <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
            + Add Authority
          </button>
        )}
      </div>

      {isAdding && (
        <form className="authority-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Citation</label>
            <input
              type="text"
              value={formData.citation}
              onChange={(e) => setFormData({ ...formData, citation: e.target.value })}
              required
              placeholder="e.g., Smith v Jones [2023] UKSC 45"
            />
          </div>

          <div className="form-group">
            <label>Paragraph Reference</label>
            <input
              type="text"
              value={formData.paragraph}
              onChange={(e) => setFormData({ ...formData, paragraph: e.target.value })}
              placeholder="e.g., [45]-[47], per Lord Smith"
            />
          </div>

          <div className="form-group">
            <label>Legal Principle</label>
            <textarea
              value={formData.principle}
              onChange={(e) => setFormData({ ...formData, principle: e.target.value })}
              rows={3}
              required
              placeholder="What legal principle does this case establish?"
            />
          </div>

          <div className="form-group">
            <label>Relevance to Your Case</label>
            <textarea
              value={formData.relevance}
              onChange={(e) => setFormData({ ...formData, relevance: e.target.value })}
              rows={3}
              required
              placeholder="How does this authority support your argument?"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editingAuth ? 'Update' : 'Add'} Authority
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="authorities-list">
        {authorities.length === 0 ? (
          <p className="empty-state">No authorities added yet.</p>
        ) : (
          authorities.map(auth => (
            <div key={auth.id} className="authority-item">
              <div className="authority-header">
                <h4>{auth.citation}</h4>
                {auth.paragraph && <span className="paragraph-ref">{auth.paragraph}</span>}
              </div>
              <div className="authority-principle">
                <label>Principle:</label>
                <p>{auth.principle}</p>
              </div>
              <div className="authority-relevance">
                <label>Relevance:</label>
                <p>{auth.relevance}</p>
              </div>
              <div className="authority-actions">
                <button className="btn btn-sm" onClick={() => handleEdit(auth)}>
                  Edit
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(auth.id)}>
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