/**
 * Extracted Content Viewer
 * Displays tables, images, formulas, and layout from PDF-Extract-Kit
 */

import React, { useState, useEffect } from 'react';
import { ExtractedTable, ExtractedImage, ExtractedFormula, DocumentLayout } from '../types/extractedDocument';
import { storage } from '../utils/storage';

interface ExtractedContentViewerProps {
  documentId: string;
  caseId: string;
}

export const ExtractedContentViewer: React.FC<ExtractedContentViewerProps> = ({
  documentId,
  caseId
}) => {
  const [activeTab, setActiveTab] = useState<'tables' | 'images' | 'formulas' | 'layout'>('tables');
  const [tables, setTables] = useState<ExtractedTable[]>([]);
  const [images, setImages] = useState<ExtractedImage[]>([]);
  const [formulas, setFormulas] = useState<ExtractedFormula[]>([]);
  const [layout, setLayout] = useState<DocumentLayout | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExtractedContent();
  }, [documentId]);

  const loadExtractedContent = async () => {
    setLoading(true);
    try {
      // Load tables
      const tablesData = localStorage.getItem(`doc_tables_${documentId}`);
      if (tablesData) {
        setTables(JSON.parse(tablesData));
      }

      // Load images
      try {
        const imagesData = await storage.getImages?.(documentId);
        setImages(imagesData || []);
      } catch (error) {
        console.warn('Failed to load images:', error);
      }

      // Load formulas
      const formulasData = localStorage.getItem(`doc_formulas_${documentId}`);
      if (formulasData) {
        setFormulas(JSON.parse(formulasData));
      }

      // Load layout
      const layoutData = localStorage.getItem(`doc_layout_${documentId}`);
      if (layoutData) {
        setLayout(JSON.parse(layoutData));
      }
    } catch (error) {
      console.error('Failed to load extracted content:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportTableAsCSV = (table: ExtractedTable) => {
    const csv: string[] = [];
    
    // Add headers
    if (table.headers.length > 0) {
      csv.push(table.headers.join(','));
    }

    // Add data rows
    for (const row of table.data) {
      csv.push(row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(','));
    }

    const csvContent = csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `table_${table.id}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const addTableToChronology = (table: ExtractedTable) => {
    // Find date column and create chronology events
    const dateColumnIndex = table.headers.findIndex(h => 
      /date|time|when/i.test(h)
    );

    if (dateColumnIndex >= 0) {
      const events = table.data
        .filter(row => row[dateColumnIndex])
        .map(row => ({
          id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          caseId,
          date: row[dateColumnIndex],
          event: row.join(' - '),
          category: 'From Table',
          notes: `Extracted from table in ${documentId}`
        }));

      // Save chronology events
      const existingEvents = storage.getChronology(caseId);
      events.forEach(event => {
        existingEvents.push(event);
        storage.saveChronologyEvent(event);
      });

      alert(`Added ${events.length} events to chronology`);
    } else {
      alert('No date column found in this table');
    }
  };

  const saveImageAsEvidence = (image: ExtractedImage) => {
    // Create evidence entry
    const evidence = {
      id: `evidence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      caseId,
      name: `Image from page ${image.pageNumber}`,
      type: image.type,
      description: image.caption || `${image.type} extracted from document`,
      source: documentId,
      data: image.base64,
      dateAdded: new Date().toISOString()
    };

    // Save to evidence storage
    const existingEvidence = JSON.parse(localStorage.getItem(`evidence_${caseId}`) || '[]');
    existingEvidence.push(evidence);
    localStorage.setItem(`evidence_${caseId}`, JSON.stringify(existingEvidence));

    alert('Image saved as evidence');
  };

  const getTabCounts = () => ({
    tables: tables.length,
    images: images.length,
    formulas: formulas.length,
    layout: layout?.pages.length || 0
  });

  if (loading) {
    return (
      <div className="extracted-content-loading">
        <div className="loading-spinner"></div>
        <p>Loading extracted content...</p>
      </div>
    );
  }

  const counts = getTabCounts();
  const hasContent = counts.tables + counts.images + counts.formulas + counts.layout > 0;

  if (!hasContent) {
    return (
      <div className="no-extracted-content">
        <div className="no-content-icon">📄</div>
        <h3>No Enhanced Content</h3>
        <p>This document was processed with basic extraction.</p>
        <p>Upload a new document to use advanced PDF extraction features.</p>
      </div>
    );
  }

  return (
    <div className="extracted-content-viewer">
      <div className="content-tabs">
        <button
          className={`tab ${activeTab === 'tables' ? 'active' : ''}`}
          onClick={() => setActiveTab('tables')}
          disabled={counts.tables === 0}
        >
          📊 Tables ({counts.tables})
        </button>
        <button
          className={`tab ${activeTab === 'images' ? 'active' : ''}`}
          onClick={() => setActiveTab('images')}
          disabled={counts.images === 0}
        >
          🖼️ Images ({counts.images})
        </button>
        <button
          className={`tab ${activeTab === 'formulas' ? 'active' : ''}`}
          onClick={() => setActiveTab('formulas')}
          disabled={counts.formulas === 0}
        >
          🧮 Formulas ({counts.formulas})
        </button>
        <button
          className={`tab ${activeTab === 'layout' ? 'active' : ''}`}
          onClick={() => setActiveTab('layout')}
          disabled={counts.layout === 0}
        >
          📋 Layout ({counts.layout} pages)
        </button>
      </div>

      <div className="content-panel">
        {activeTab === 'tables' && (
          <div className="tables-panel">
            {tables.length === 0 ? (
              <div className="empty-state">
                <p>No tables found in this document</p>
              </div>
            ) : (
              <div className="tables-grid">
                {tables.map((table, index) => (
                  <div key={table.id} className="table-card">
                    <div className="table-header">
                      <h4>Table {index + 1} - Page {table.pageNumber}</h4>
                      <div className="table-stats">
                        {table.rows} rows × {table.columns} columns
                      </div>
                      <div className="table-actions">
                        <button 
                          onClick={() => exportTableAsCSV(table)}
                          className="action-btn export"
                        >
                          📊 Export CSV
                        </button>
                        <button 
                          onClick={() => addTableToChronology(table)}
                          className="action-btn chronology"
                        >
                          📅 Add to Timeline
                        </button>
                      </div>
                    </div>
                    <div className="table-preview">
                      {table.html ? (
                        <div 
                          className="table-html"
                          dangerouslySetInnerHTML={{ __html: table.html }}
                        />
                      ) : (
                        <div className="table-data">
                          {table.headers.length > 0 && (
                            <div className="table-row header">
                              {table.headers.map((header, i) => (
                                <div key={i} className="table-cell">{header}</div>
                              ))}
                            </div>
                          )}
                          {table.data.slice(0, 5).map((row, i) => (
                            <div key={i} className="table-row">
                              {row.map((cell, j) => (
                                <div key={j} className="table-cell">{cell}</div>
                              ))}
                            </div>
                          ))}
                          {table.data.length > 5 && (
                            <div className="table-more">
                              ... and {table.data.length - 5} more rows
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'images' && (
          <div className="images-panel">
            {images.length === 0 ? (
              <div className="empty-state">
                <p>No images found in this document</p>
              </div>
            ) : (
              <div className="images-grid">
                {images.map((image, index) => (
                  <div key={image.id} className="image-card">
                    <div className="image-header">
                      <h4>Image {index + 1} - Page {image.pageNumber}</h4>
                      <div className="image-type">{image.type}</div>
                    </div>
                    <div className="image-preview">
                      <img 
                        src={`data:image/png;base64,${image.base64}`}
                        alt={image.caption || `Image ${index + 1}`}
                        className="extracted-image"
                      />
                    </div>
                    {image.caption && (
                      <div className="image-caption">{image.caption}</div>
                    )}
                    <div className="image-actions">
                      <button 
                        onClick={() => saveImageAsEvidence(image)}
                        className="action-btn evidence"
                      >
                        💼 Save as Evidence
                      </button>
                      <div className="image-stats">
                        {image.width} × {image.height}px
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'formulas' && (
          <div className="formulas-panel">
            {formulas.length === 0 ? (
              <div className="empty-state">
                <p>No formulas found in this document</p>
              </div>
            ) : (
              <div className="formulas-list">
                {formulas.map((formula, index) => (
                  <div key={formula.id} className="formula-card">
                    <div className="formula-header">
                      <h4>Formula {index + 1} - Page {formula.pageNumber}</h4>
                      <div className="formula-type">{formula.type}</div>
                    </div>
                    <div className="formula-content">
                      <div className="formula-latex">
                        <code>{formula.latex}</code>
                      </div>
                      {formula.rendered && (
                        <div className="formula-rendered">
                          <img src={formula.rendered} alt="Rendered formula" />
                        </div>
                      )}
                    </div>
                    {formula.context && (
                      <div className="formula-context">
                        <strong>Context:</strong> {formula.context}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'layout' && layout && (
          <div className="layout-panel">
            <div className="layout-overview">
              <h4>Document Structure</h4>
              <p>{layout.pages.length} pages analyzed</p>
            </div>
            <div className="pages-list">
              {layout.pages.map((page, index) => (
                <div key={index} className="page-card">
                  <div className="page-header">
                    <h5>Page {page.pageNumber}</h5>
                    <div className="page-dimensions">
                      {Math.round(page.width)} × {Math.round(page.height)}px
                    </div>
                  </div>
                  <div className="page-elements">
                    <div className="element-counts">
                      {Object.entries(
                        page.elements.reduce((acc, el) => {
                          acc[el.type] = (acc[el.type] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([type, count]) => (
                        <span key={type} className="element-count">
                          {type}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .extracted-content-viewer {
          width: 100%;
        }

        .content-tabs {
          display: flex;
          border-bottom: 2px solid #e5e7eb;
          margin-bottom: 20px;
        }

        .tab {
          padding: 12px 20px;
          border: none;
          background: none;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
          font-weight: 500;
        }

        .tab:hover:not(:disabled) {
          background: #f3f4f6;
        }

        .tab.active {
          border-bottom-color: #3b82f6;
          color: #3b82f6;
        }

        .tab:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .content-panel {
          min-height: 400px;
        }

        .tables-grid, .images-grid {
          display: grid;
          gap: 20px;
        }

        .table-card, .image-card, .formula-card, .page-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          background: white;
        }

        .table-header, .image-header, .formula-header, .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #f3f4f6;
        }

        .table-header h4, .image-header h4, .formula-header h4, .page-header h5 {
          margin: 0;
          color: #1f2937;
        }

        .table-stats, .image-type, .formula-type, .page-dimensions {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }

        .table-actions, .image-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }

        .action-btn {
          padding: 6px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .action-btn.export {
          color: #059669;
          border-color: #d1fae5;
        }

        .action-btn.chronology {
          color: #3b82f6;
          border-color: #dbeafe;
        }

        .action-btn.evidence {
          color: #7c3aed;
          border-color: #e9d5ff;
        }

        .table-preview {
          max-height: 300px;
          overflow: auto;
          border: 1px solid #f3f4f6;
          border-radius: 4px;
        }

        .table-html {
          padding: 8px;
        }

        .table-html table {
          width: 100%;
          border-collapse: collapse;
        }

        .table-html th,
        .table-html td {
          border: 1px solid #e5e7eb;
          padding: 8px;
          text-align: left;
          font-size: 12px;
        }

        .table-html th {
          background: #f9fafb;
          font-weight: 600;
        }

        .table-data {
          font-size: 12px;
        }

        .table-row {
          display: flex;
          border-bottom: 1px solid #f3f4f6;
        }

        .table-row.header {
          background: #f9fafb;
          font-weight: 600;
        }

        .table-cell {
          flex: 1;
          padding: 8px;
          border-right: 1px solid #f3f4f6;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .table-more {
          padding: 8px;
          text-align: center;
          color: #6b7280;
          font-style: italic;
        }

        .images-grid {
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        }

        .image-preview {
          text-align: center;
          margin: 12px 0;
        }

        .extracted-image {
          max-width: 100%;
          max-height: 200px;
          border-radius: 4px;
          border: 1px solid #e5e7eb;
        }

        .image-caption {
          font-size: 12px;
          color: #6b7280;
          font-style: italic;
          margin-bottom: 8px;
        }

        .image-stats {
          font-size: 11px;
          color: #9ca3af;
        }

        .formulas-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .formula-content {
          background: #f8fafc;
          padding: 12px;
          border-radius: 4px;
          margin: 8px 0;
        }

        .formula-latex code {
          font-family: 'Courier New', monospace;
          background: #e2e8f0;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .formula-rendered {
          margin-top: 8px;
        }

        .formula-context {
          font-size: 12px;
          color: #6b7280;
          margin-top: 8px;
        }

        .pages-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .element-counts {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .element-count {
          background: #f3f4f6;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          color: #4b5563;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
        }

        .no-extracted-content {
          text-align: center;
          padding: 60px 20px;
        }

        .no-content-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .no-extracted-content h3 {
          color: #1f2937;
          margin-bottom: 8px;
        }

        .no-extracted-content p {
          color: #6b7280;
          margin: 4px 0;
        }

        .extracted-content-loading {
          text-align: center;
          padding: 60px 20px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f4f6;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};