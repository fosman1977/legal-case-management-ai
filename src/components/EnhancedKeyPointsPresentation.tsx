import React, { useState, useEffect } from 'react';
import { Case, KeyPoint, ChronologyEvent, LegalAuthority, CaseDocument } from '../types';
import { storage } from '../utils/storage';
import { useAISync } from '../hooks/useAISync';

interface EnhancedKeyPointsPresentationProps {
  caseId: string;
  caseData: Case;
}

type ViewMode = 'edit' | 'presentation';
type CategoryType = 'opening' | 'examination' | 'cross_examination' | 'closing' | 'legal_argument';

export const EnhancedKeyPointsPresentation: React.FC<EnhancedKeyPointsPresentationProps> = ({ 
  caseId, 
  caseData 
}) => {
  // State Management
  const [keyPoints, setKeyPoints] = useState<KeyPoint[]>([]);
  const [chronology, setChronology] = useState<ChronologyEvent[]>([]);
  const [authorities, setAuthorities] = useState<LegalAuthority[]>([]);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('opening');
  const [isAdding, setIsAdding] = useState(false);
  const [editingPoint, setEditingPoint] = useState<KeyPoint | null>(null);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  
  const [formData, setFormData] = useState<Partial<KeyPoint>>({
    point: '',
    supportingDocs: [],
    order: 0
  });

  // AI Synchronization
  const { publishAIResults } = useAISync(caseId, 'EnhancedKeyPointsPresentation');

  // Load all data
  useEffect(() => {
    loadAllData();
  }, [caseId]);

  const loadAllData = () => {
    setKeyPoints(storage.getKeyPoints(caseId).sort((a, b) => a.order - b.order));
    setChronology(storage.getChronology(caseId).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    ));
    setAuthorities(storage.getAuthorities(caseId));
    setDocuments(storage.getDocuments(caseId));
  };

  // Category configuration
  const categories = [
    { key: 'opening' as const, label: 'Opening Statement', icon: '🎯', color: 'blue' },
    { key: 'examination' as const, label: 'Examination in Chief', icon: '🔍', color: 'green' },
    { key: 'cross_examination' as const, label: 'Cross-Examination', icon: '⚡', color: 'orange' },
    { key: 'closing' as const, label: 'Closing Argument', icon: '🏛️', color: 'purple' },
    { key: 'legal_argument' as const, label: 'Legal Argument', icon: '⚖️', color: 'indigo' }
  ];

  const getCurrentCategory = () => categories.find(cat => cat.key === selectedCategory)!;
  const filteredPoints = keyPoints.filter(p => p.category === selectedCategory);

  // Form handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const point: KeyPoint = {
      ...formData,
      id: editingPoint?.id || `kp_${Date.now()}`,
      caseId,
      category: selectedCategory,
      order: formData.order || filteredPoints.length + 1
    } as KeyPoint;

    storage.saveKeyPoint(point);
    loadAllData();
    resetForm();
  };

  const resetForm = () => {
    setFormData({ point: '', supportingDocs: [], order: 0 });
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
      loadAllData();
    }
  };

  const movePoint = (pointId: string, direction: 'up' | 'down') => {
    const point = keyPoints.find(p => p.id === pointId);
    if (!point) return;

    const categoryPoints = filteredPoints.sort((a, b) => a.order - b.order);
    const currentIndex = categoryPoints.findIndex(p => p.id === pointId);
    
    if (direction === 'up' && currentIndex > 0) {
      const swapPoint = categoryPoints[currentIndex - 1];
      const tempOrder = point.order;
      point.order = swapPoint.order;
      swapPoint.order = tempOrder;
      storage.saveKeyPoint(point);
      storage.saveKeyPoint(swapPoint);
    } else if (direction === 'down' && currentIndex < categoryPoints.length - 1) {
      const swapPoint = categoryPoints[currentIndex + 1];
      const tempOrder = point.order;
      point.order = swapPoint.order;
      swapPoint.order = tempOrder;
      storage.saveKeyPoint(point);
      storage.saveKeyPoint(swapPoint);
    }
    
    loadAllData();
  };

  // AI Suggestions
  const generateAISuggestions = async () => {
    setShowAISuggestions(true);
    const category = getCurrentCategory();
    
    // Mock AI suggestions - in real implementation, this would call AI service
    const suggestions = [
      `Key argument for ${category.label.toLowerCase()} based on case facts`,
      `Strategic point considering opponent's likely position`,
      `Reference to relevant precedent or statute`
    ];

    // For now, just show suggestions in console
    console.log(`AI Suggestions for ${category.label}:`, suggestions);
  };

  // Export functionality
  const generateSpeakingNotes = () => {
    const notes = [];
    
    notes.push(`# Speaking Notes: ${caseData.title}`);
    notes.push(`## ${caseData.courtReference}`);
    notes.push(`### ${caseData.client} v ${caseData.opponent}`);
    notes.push(`Court: ${caseData.court}`);
    notes.push(`Judge: ${caseData.judge || 'TBC'}`);
    notes.push(`Date: ${caseData.hearingDate ? new Date(caseData.hearingDate as string).toLocaleDateString('en-GB') : 'TBC'}\n`);

    categories.forEach(category => {
      const categoryPoints = keyPoints.filter(p => p.category === category.key);
      if (categoryPoints.length > 0) {
        notes.push(`## ${category.icon} ${category.label}`);
        categoryPoints.forEach((point, index) => {
          notes.push(`${index + 1}. ${point.point}`);
          if (point.supportingDocs && point.supportingDocs.length > 0) {
            notes.push(`   📎 Supporting: ${point.supportingDocs.join(', ')}`);
          }
        });
        notes.push('');
      }
    });

    if (authorities.length > 0) {
      notes.push('## 📚 Key Authorities');
      authorities.forEach(auth => {
        notes.push(`- ${auth.citation}${auth.paragraph ? ` at ${auth.paragraph}` : ''}`);
        notes.push(`  ${auth.principle}`);
      });
      notes.push('');
    }

    if (chronology.length > 0) {
      notes.push('## 📅 Key Dates');
      chronology.slice(0, 10).forEach(event => {
        notes.push(`- ${new Date(event.date).toLocaleDateString('en-GB')}: ${event.description}`);
      });
    }

    return notes.join('\n');
  };

  const handleExport = (format: 'markdown' | 'txt') => {
    const notes = generateSpeakingNotes();
    const blob = new Blob([notes], { 
      type: format === 'markdown' ? 'text/markdown' : 'text/plain' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${caseData.title.replace(/\s+/g, '_')}_speaking_notes.${format === 'markdown' ? 'md' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const getCompletionStatus = () => {
    const totalCategories = categories.length;
    const completedCategories = categories.filter(cat => 
      keyPoints.some(p => p.category === cat.key)
    ).length;
    return { completed: completedCategories, total: totalCategories };
  };

  const completionStatus = getCompletionStatus();

  return (
    <div className="enhanced-keypoints-presentation">
      {/* Header */}
      <div className="component-header">
        <div className="header-info">
          <h3>🎯 Key Points & Presentation</h3>
          <div className="completion-status">
            <div className="progress-indicator">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${(completionStatus.completed / completionStatus.total) * 100}%` }}
                />
              </div>
              <span className="progress-text">
                {completionStatus.completed}/{completionStatus.total} sections prepared
              </span>
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          <div className="mode-toggle">
            <button 
              className={`btn ${viewMode === 'edit' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('edit')}
            >
              ✏️ Edit
            </button>
            <button 
              className={`btn ${viewMode === 'presentation' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('presentation')}
            >
              📄 Present
            </button>
          </div>
          
          {viewMode === 'presentation' && (
            <div className="export-actions">
              <button className="btn btn-outline" onClick={() => handleExport('markdown')}>
                📝 Export MD
              </button>
              <button className="btn btn-outline" onClick={() => handleExport('txt')}>
                📄 Export TXT
              </button>
              <button className="btn btn-success" onClick={handlePrint}>
                🖨️ Print
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Category Navigation */}
      <div className="category-navigation">
        {categories.map(category => {
          const categoryPoints = keyPoints.filter(p => p.category === category.key);
          const isActive = selectedCategory === category.key;
          
          return (
            <button
              key={category.key}
              className={`category-tab ${isActive ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.key)}
              data-color={category.color}
            >
              <span className="category-icon">{category.icon}</span>
              <div className="category-info">
                <span className="category-label">{category.label}</span>
                <span className="category-count">{categoryPoints.length} points</span>
              </div>
              {categoryPoints.length > 0 && <div className="completion-dot" />}
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="main-content">
        {viewMode === 'edit' ? (
          <div className="edit-mode">
            <div className="section-header">
              <div className="section-info">
                <h4>
                  {getCurrentCategory().icon} {getCurrentCategory().label}
                </h4>
                <p className="section-description">
                  {selectedCategory === 'opening' && 'Set the stage and outline your case theory'}
                  {selectedCategory === 'examination' && 'Key points for examining your witnesses'}
                  {selectedCategory === 'cross_examination' && 'Strategic points for cross-examining opponents'}
                  {selectedCategory === 'closing' && 'Summarize and persuade with final arguments'}
                  {selectedCategory === 'legal_argument' && 'Pure legal points and statutory arguments'}
                </p>
              </div>
              
              <div className="section-actions">
                <button 
                  className="btn btn-outline"
                  onClick={generateAISuggestions}
                >
                  🤖 AI Suggest
                </button>
                {!isAdding && (
                  <button 
                    className="btn btn-primary" 
                    onClick={() => setIsAdding(true)}
                  >
                    ➕ Add Point
                  </button>
                )}
              </div>
            </div>

            {/* Add/Edit Form */}
            {isAdding && (
              <div className="add-point-form card">
                <div className="card-header">
                  <h5>{editingPoint ? 'Edit' : 'Add'} Key Point</h5>
                </div>
                <form onSubmit={handleSubmit} className="card-body">
                  <div className="form-group">
                    <label className="form-label">Key Point *</label>
                    <textarea
                      className="form-input form-textarea"
                      value={formData.point}
                      onChange={(e) => setFormData({ ...formData, point: e.target.value })}
                      rows={4}
                      required
                      placeholder={`Enter your key argument for ${getCurrentCategory().label.toLowerCase()}...`}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Supporting Documents</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.supportingDocs?.join(', ') || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        supportingDocs: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                      })}
                      placeholder="e.g., Exhibit A, Witness Statement p.5, Contract clause 3.2"
                    />
                    <small className="form-help">Comma-separated references to supporting evidence</small>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Order</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.order || ''}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                      min="1"
                      placeholder={`${filteredPoints.length + 1}`}
                    />
                    <small className="form-help">Position within this section (leave blank for end)</small>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary">
                      {editingPoint ? '💾 Update' : '➕ Add'} Point
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={resetForm}>
                      ❌ Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Points List */}
            <div className="points-list">
              {filteredPoints.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">{getCurrentCategory().icon}</div>
                  <h5>No points prepared yet</h5>
                  <p>Add your first key point for {getCurrentCategory().label.toLowerCase()}</p>
                  <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
                    ➕ Add First Point
                  </button>
                </div>
              ) : (
                filteredPoints.map((point, index) => (
                  <div key={point.id} className="point-card card">
                    <div className="card-body">
                      <div className="point-header">
                        <div className="point-number">{index + 1}</div>
                        <div className="point-actions">
                          <button 
                            className="btn-ghost btn-sm"
                            onClick={() => movePoint(point.id, 'up')}
                            disabled={index === 0}
                            title="Move up"
                          >
                            ⬆️
                          </button>
                          <button 
                            className="btn-ghost btn-sm"
                            onClick={() => movePoint(point.id, 'down')}
                            disabled={index === filteredPoints.length - 1}
                            title="Move down"
                          >
                            ⬇️
                          </button>
                          <button 
                            className="btn-ghost btn-sm"
                            onClick={() => handleEdit(point)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button 
                            className="btn-ghost btn-sm"
                            onClick={() => handleDelete(point.id)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      
                      <div className="point-content">
                        <p className="point-text">{point.point}</p>
                        {point.supportingDocs && point.supportingDocs.length > 0 && (
                          <div className="supporting-docs">
                            <span className="docs-label">📎 Supporting:</span>
                            <span className="docs-list">{point.supportingDocs.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="presentation-mode">
            <div className="presentation-header">
              <div className="case-title-block">
                <h2>{caseData.title}</h2>
                <div className="case-meta">
                  <span className="court-ref">{caseData.courtReference}</span>
                  <span className="parties">{caseData.client} v {caseData.opponent}</span>
                  <span className="court-details">{caseData.court}</span>
                  {caseData.judge && <span className="judge">Before: {caseData.judge}</span>}
                  <span className="hearing-date">
                    {caseData.hearingDate ? new Date(caseData.hearingDate as string).toLocaleDateString('en-GB', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Date TBC'}
                  </span>
                </div>
              </div>
            </div>

            <div className="presentation-content">
              {categories.map(category => {
                const categoryPoints = keyPoints.filter(p => p.category === category.key);
                if (categoryPoints.length === 0) return null;

                return (
                  <div key={category.key} className="presentation-section">
                    <h3 className="section-title">
                      {category.icon} {category.label}
                    </h3>
                    
                    <div className="speaking-points">
                      {categoryPoints.map((point, index) => (
                        <div key={point.id} className="speaking-point">
                          <div className="point-marker">{index + 1}</div>
                          <div className="point-details">
                            <p className="point-text">{point.point}</p>
                            {point.supportingDocs && point.supportingDocs.length > 0 && (
                              <div className="supporting-refs">
                                <strong>Supporting:</strong> {point.supportingDocs.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Additional Reference Materials */}
              {authorities.length > 0 && (
                <div className="presentation-section">
                  <h3 className="section-title">📚 Key Authorities</h3>
                  <div className="authorities-list">
                    {authorities.slice(0, 10).map(auth => (
                      <div key={auth.id} className="authority-item">
                        <div className="authority-citation">
                          {auth.citation}{auth.paragraph ? ` at ${auth.paragraph}` : ''}
                        </div>
                        <div className="authority-principle">{auth.principle}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {chronology.length > 0 && (
                <div className="presentation-section">
                  <h3 className="section-title">📅 Key Dates</h3>
                  <div className="chronology-list">
                    {chronology.slice(0, 15).map(event => (
                      <div key={event.id} className="chronology-item">
                        <div className="event-date">
                          {new Date(event.date).toLocaleDateString('en-GB')}
                        </div>
                        <div className="event-description">{event.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .enhanced-keypoints-presentation {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--neutral-50);
        }

        .component-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: var(--space-6);
          background: white;
          border-bottom: 1px solid var(--neutral-200);
          gap: var(--space-4);
        }

        .header-info h3 {
          margin: 0 0 var(--space-2) 0;
          font-size: var(--text-xl);
          font-weight: var(--font-semibold);
          color: var(--neutral-900);
        }

        .completion-status {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .progress-indicator {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .progress-bar {
          width: 150px;
          height: 8px;
          background: var(--neutral-200);
          border-radius: var(--radius-sm);
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-green) 100%);
          transition: width var(--transition-normal);
        }

        .progress-text {
          font-size: var(--text-sm);
          color: var(--neutral-600);
          font-weight: var(--font-medium);
        }

        .header-actions {
          display: flex;
          gap: var(--space-4);
          align-items: center;
        }

        .mode-toggle {
          display: flex;
          gap: var(--space-1);
          background: var(--neutral-100);
          border-radius: var(--radius-md);
          padding: var(--space-1);
        }

        .export-actions {
          display: flex;
          gap: var(--space-2);
        }

        .category-navigation {
          display: flex;
          background: white;
          border-bottom: 1px solid var(--neutral-200);
          overflow-x: auto;
          padding: 0 var(--space-6);
        }

        .category-tab {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-4) var(--space-5);
          background: transparent;
          border: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
          position: relative;
        }

        .category-tab:hover {
          background: var(--neutral-50);
        }

        .category-tab.active {
          background: var(--primary-50);
          border-bottom-color: var(--primary-500);
        }

        .category-tab[data-color="blue"].active { border-bottom-color: var(--accent-blue); }
        .category-tab[data-color="green"].active { border-bottom-color: var(--accent-green); }
        .category-tab[data-color="orange"].active { border-bottom-color: var(--accent-amber); }
        .category-tab[data-color="purple"].active { border-bottom-color: var(--accent-purple); }
        .category-tab[data-color="indigo"].active { border-bottom-color: var(--accent-indigo); }

        .category-icon {
          font-size: var(--text-lg);
        }

        .category-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .category-label {
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--neutral-700);
        }

        .category-count {
          font-size: var(--text-xs);
          color: var(--neutral-500);
        }

        .completion-dot {
          width: 8px;
          height: 8px;
          background: var(--accent-green);
          border-radius: 50%;
          position: absolute;
          top: var(--space-2);
          right: var(--space-2);
        }

        .main-content {
          flex: 1;
          overflow-y: auto;
          padding: var(--space-6);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-6);
          padding: var(--space-6);
          background: white;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
        }

        .section-info h4 {
          margin: 0 0 var(--space-2) 0;
          font-size: var(--text-lg);
          font-weight: var(--font-semibold);
          color: var(--neutral-900);
        }

        .section-description {
          margin: 0;
          color: var(--neutral-600);
          font-size: var(--text-sm);
        }

        .section-actions {
          display: flex;
          gap: var(--space-3);
        }

        .add-point-form {
          margin-bottom: var(--space-6);
        }

        .form-help {
          display: block;
          margin-top: var(--space-1);
          font-size: var(--text-xs);
          color: var(--neutral-500);
        }

        .form-actions {
          display: flex;
          gap: var(--space-3);
          justify-content: flex-end;
          margin-top: var(--space-4);
        }

        .points-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .empty-state {
          text-align: center;
          padding: var(--space-16) var(--space-8);
          background: white;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: var(--space-4);
        }

        .empty-state h5 {
          margin: 0 0 var(--space-2) 0;
          font-size: var(--text-lg);
          color: var(--neutral-700);
        }

        .empty-state p {
          margin: 0 0 var(--space-6) 0;
          color: var(--neutral-500);
        }

        .point-card {
          transition: all var(--transition-fast);
        }

        .point-card:hover {
          transform: translateY(-2px);
        }

        .point-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-3);
        }

        .point-number {
          width: 32px;
          height: 32px;
          background: var(--primary-500);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: var(--font-semibold);
          font-size: var(--text-sm);
        }

        .point-actions {
          display: flex;
          gap: var(--space-1);
        }

        .point-content {
          margin-left: var(--space-10);
        }

        .point-text {
          margin: 0 0 var(--space-3) 0;
          font-size: var(--text-base);
          line-height: 1.6;
          color: var(--neutral-800);
        }

        .supporting-docs {
          display: flex;
          gap: var(--space-2);
          align-items: flex-start;
          font-size: var(--text-sm);
        }

        .docs-label {
          color: var(--neutral-600);
          font-weight: var(--font-medium);
          flex-shrink: 0;
        }

        .docs-list {
          color: var(--neutral-700);
        }

        /* Presentation Mode Styles */
        .presentation-mode {
          background: white;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
        }

        .presentation-header {
          padding: var(--space-8);
          background: linear-gradient(135deg, var(--primary-600) 0%, var(--accent-indigo) 100%);
          color: white;
        }

        .case-title-block h2 {
          margin: 0 0 var(--space-4) 0;
          font-size: var(--text-3xl);
          font-weight: var(--font-bold);
        }

        .case-meta {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-2);
          font-size: var(--text-sm);
          opacity: 0.9;
        }

        .case-meta span {
          display: block;
        }

        .court-ref {
          font-family: var(--font-family-mono);
          font-weight: var(--font-semibold);
        }

        .presentation-content {
          padding: var(--space-8);
        }

        .presentation-section {
          margin-bottom: var(--space-8);
        }

        .section-title {
          margin: 0 0 var(--space-6) 0;
          font-size: var(--text-xl);
          font-weight: var(--font-semibold);
          color: var(--neutral-900);
          padding-bottom: var(--space-2);
          border-bottom: 2px solid var(--primary-200);
        }

        .speaking-points {
          display: flex;
          flex-direction: column;
          gap: var(--space-5);
        }

        .speaking-point {
          display: flex;
          gap: var(--space-4);
          align-items: flex-start;
        }

        .point-marker {
          width: 28px;
          height: 28px;
          background: var(--primary-100);
          color: var(--primary-700);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: var(--font-semibold);
          font-size: var(--text-sm);
          flex-shrink: 0;
          margin-top: var(--space-1);
        }

        .point-details {
          flex: 1;
        }

        .speaking-point .point-text {
          margin: 0 0 var(--space-2) 0;
          font-size: var(--text-base);
          line-height: 1.7;
          color: var(--neutral-800);
        }

        .supporting-refs {
          font-size: var(--text-sm);
          color: var(--neutral-600);
          font-style: italic;
        }

        .authorities-list,
        .chronology-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .authority-item,
        .chronology-item {
          display: flex;
          gap: var(--space-4);
          padding: var(--space-3);
          background: var(--neutral-50);
          border-radius: var(--radius-md);
        }

        .authority-citation,
        .event-date {
          font-family: var(--font-family-mono);
          font-size: var(--text-sm);
          font-weight: var(--font-semibold);
          color: var(--primary-700);
          flex-shrink: 0;
          min-width: 120px;
        }

        .authority-principle,
        .event-description {
          font-size: var(--text-sm);
          color: var(--neutral-700);
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .component-header {
            flex-direction: column;
            gap: var(--space-4);
          }

          .header-actions {
            flex-direction: column;
            width: 100%;
          }

          .category-navigation {
            padding: 0 var(--space-4);
          }

          .category-tab {
            padding: var(--space-3) var(--space-4);
          }

          .section-header {
            flex-direction: column;
            gap: var(--space-4);
          }

          .case-meta {
            grid-template-columns: 1fr;
          }

          .speaking-point {
            flex-direction: column;
            gap: var(--space-2);
          }

          .point-marker {
            align-self: flex-start;
          }
        }

        @media print {
          .component-header,
          .category-navigation {
            display: none;
          }

          .enhanced-keypoints-presentation {
            background: white;
          }

          .presentation-mode {
            box-shadow: none;
          }

          .presentation-header {
            background: white !important;
            color: black !important;
          }

          .section-title {
            color: black !important;
            border-bottom-color: #ccc !important;
          }

          .point-marker {
            background: #f0f0f0 !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
};