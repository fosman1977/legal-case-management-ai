import React, { useState, useEffect } from 'react';
import { KeyPoint } from '../types';
import { storage } from '../utils/storage';

interface KeyPointsManagerProps {
  caseId: string;
}

export const KeyPointsManager: React.FC<KeyPointsManagerProps> = ({ caseId }) => {
  const [keyPoints, setKeyPoints] = useState<KeyPoint[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingPoint, setEditingPoint] = useState<KeyPoint | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<KeyPoint['category']>('opening');
  const [formData, setFormData] = useState<Partial<KeyPoint>>({
    point: '',
    supportingDocs: [],
    order: 0
  });

  useEffect(() => {
    loadKeyPoints();
  }, [caseId]);

  const loadKeyPoints = () => {
    const points = storage.getKeyPoints(caseId);
    setKeyPoints(points.sort((a, b) => a.order - b.order));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const point: KeyPoint = {
      ...formData,
      id: editingPoint?.id || Date.now().toString(),
      caseId,
      category: selectedCategory,
      order: formData.order || keyPoints.filter(p => p.category === selectedCategory).length + 1
    } as KeyPoint;

    storage.saveKeyPoint(point);
    loadKeyPoints();
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      point: '',
      supportingDocs: [],
      order: 0
    });
    setIsAdding(false);
    setEditingPoint(null);
  };

  const handleEdit = (point: KeyPoint) => {
    setEditingPoint(point);
    setFormData(point);
    setSelectedCategory(point.category);
    setIsAdding(true);
  };

  const handleDelete = (pointId: string) => {
    if (window.confirm('Are you sure you want to delete this key point?')) {
      storage.deleteKeyPoint(pointId);
      loadKeyPoints();
    }
  };

  const getCategoryLabel = (category: KeyPoint['category']) => {
    const labels = {
      opening: 'Opening',
      examination: 'Examination in Chief',
      cross_examination: 'Cross-Examination',
      closing: 'Closing',
      legal_argument: 'Legal Argument'
    };
    return labels[category];
  };

  const filteredPoints = keyPoints.filter(p => p.category === selectedCategory);

  return (
    <div className="key-points-manager">
      <div className="manager-header">
        <h3>Key Points for Oral Presentation</h3>
        {!isAdding && (
          <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
            + Add Key Point
          </button>
        )}
      </div>

      <div className="category-tabs">
        {(['opening', 'examination', 'cross_examination', 'closing', 'legal_argument'] as const).map(cat => (
          <button
            key={cat}
            className={`tab ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {getCategoryLabel(cat)}
          </button>
        ))}
      </div>

      {isAdding && (
        <form className="key-point-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Key Point</label>
            <textarea
              value={formData.point}
              onChange={(e) => setFormData({ ...formData, point: e.target.value })}
              rows={3}
              required
              placeholder="Enter the key point you want to make..."
            />
          </div>

          <div className="form-group">
            <label>Supporting Documents (comma-separated)</label>
            <input
              type="text"
              value={formData.supportingDocs?.join(', ')}
              onChange={(e) => setFormData({ 
                ...formData, 
                supportingDocs: e.target.value.split(',').map(s => s.trim()).filter(s => s)
              })}
              placeholder="e.g., Exhibit A, Witness Statement p.5"
            />
          </div>

          <div className="form-group">
            <label>Order (within {getCategoryLabel(selectedCategory)})</label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              min="1"
              placeholder={`${filteredPoints.length + 1}`}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editingPoint ? 'Update' : 'Add'} Point
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="key-points-list">
        {filteredPoints.length === 0 ? (
          <p className="empty-state">No key points for {getCategoryLabel(selectedCategory)} yet.</p>
        ) : (
          filteredPoints.map((point, index) => (
            <div key={point.id} className="key-point-item">
              <div className="point-number">{index + 1}</div>
              <div className="point-content">
                <p className="point-text">{point.point}</p>
                {point.supportingDocs.length > 0 && (
                  <p className="supporting-docs">
                    Supporting: {point.supportingDocs.join(', ')}
                  </p>
                )}
              </div>
              <div className="point-actions">
                <button className="btn btn-sm" onClick={() => handleEdit(point)}>
                  Edit
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(point.id)}>
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