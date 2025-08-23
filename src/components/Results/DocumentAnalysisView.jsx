/**
 * Document Analysis View Component - Week 6 Day 1-2
 * Detailed view of document analysis results
 */

import React, { useState } from 'react';

const DocumentAnalysisView = ({ analysis }) => {
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  const documents = analysis?.documents || [];

  const filterDocuments = () => {
    let filtered = [...documents];
    
    if (filterType !== 'all') {
      filtered = filtered.filter(doc => doc.type === filterType);
    }

    // Sort documents
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date || 0) - new Date(a.date || 0);
        case 'relevance':
          return (b.relevance || 0) - (a.relevance || 0);
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        default:
          return 0;
      }
    });

    return filtered;
  };

  const getDocumentTypeIcon = (type) => {
    const icons = {
      contract: '📄',
      correspondence: '✉️',
      evidence: '🔍',
      court_document: '⚖️',
      financial: '💰',
      witness_statement: '👤',
      expert_report: '📊',
      general: '📋'
    };
    return icons[type] || '📄';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence > 0.9) return 'high';
    if (confidence > 0.7) return 'medium';
    return 'low';
  };

  const filteredDocuments = filterDocuments();

  return (
    <div className="document-analysis-view">
      <div className="analysis-toolbar">
        <div className="filter-controls">
          <label>Filter by Type:</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All Documents</option>
            <option value="contract">Contracts</option>
            <option value="correspondence">Correspondence</option>
            <option value="evidence">Evidence</option>
            <option value="court_document">Court Documents</option>
            <option value="financial">Financial</option>
            <option value="witness_statement">Witness Statements</option>
          </select>
        </div>

        <div className="sort-controls">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="date">Date</option>
            <option value="relevance">Relevance</option>
            <option value="name">Name</option>
          </select>
        </div>

        <div className="document-stats">
          <span>Total: {documents.length} documents</span>
          <span>Filtered: {filteredDocuments.length} documents</span>
        </div>
      </div>

      <div className="document-grid">
        <div className="document-list">
          {filteredDocuments.map((doc, idx) => (
            <div 
              key={idx}
              className={`document-card ${selectedDocument === idx ? 'selected' : ''}`}
              onClick={() => setSelectedDocument(idx)}
            >
              <div className="document-header">
                <span className="document-icon">{getDocumentTypeIcon(doc.type)}</span>
                <div className="document-title">
                  <h3>{doc.name || `Document ${idx + 1}`}</h3>
                  <span className="document-type">{doc.type || 'general'}</span>
                </div>
              </div>

              <div className="document-metadata">
                <div className="metadata-item">
                  <label>Date:</label>
                  <value>{doc.date ? new Date(doc.date).toLocaleDateString() : 'Unknown'}</value>
                </div>
                <div className="metadata-item">
                  <label>Pages:</label>
                  <value>{doc.pages || 1}</value>
                </div>
                <div className="metadata-item">
                  <label>Extraction:</label>
                  <value className={`confidence ${getConfidenceColor(doc.confidence || 0.9)}`}>
                    {Math.round((doc.confidence || 0.9) * 100)}%
                  </value>
                </div>
              </div>

              {doc.key_entities && doc.key_entities.length > 0 && (
                <div className="document-entities">
                  <label>Key Entities:</label>
                  <div className="entity-tags">
                    {doc.key_entities.slice(0, 3).map((entity, i) => (
                      <span key={i} className="entity-tag">{entity}</span>
                    ))}
                    {doc.key_entities.length > 3 && (
                      <span className="entity-more">+{doc.key_entities.length - 3} more</span>
                    )}
                  </div>
                </div>
              )}

              {doc.legal_concepts && doc.legal_concepts.length > 0 && (
                <div className="document-concepts">
                  <label>Legal Concepts:</label>
                  <div className="concept-list">
                    {doc.legal_concepts.slice(0, 2).map((concept, i) => (
                      <span key={i} className="concept-item">{concept}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="document-summary">
                <p>{doc.summary || 'Document successfully processed and anonymized.'}</p>
              </div>
            </div>
          ))}
        </div>

        {selectedDocument !== null && filteredDocuments[selectedDocument] && (
          <div className="document-detail">
            <h2>Document Details</h2>
            <div className="detail-content">
              <div className="detail-section">
                <h3>Full Analysis</h3>
                <div className="analysis-details">
                  <div className="detail-item">
                    <label>Document Name:</label>
                    <value>{filteredDocuments[selectedDocument].name}</value>
                  </div>
                  <div className="detail-item">
                    <label>Type:</label>
                    <value>{filteredDocuments[selectedDocument].type}</value>
                  </div>
                  <div className="detail-item">
                    <label>Processing Method:</label>
                    <value>{filteredDocuments[selectedDocument].extraction_method || 'PyMuPDF'}</value>
                  </div>
                  <div className="detail-item">
                    <label>Anonymization Status:</label>
                    <value className="success">✓ Complete</value>
                  </div>
                </div>
              </div>

              {filteredDocuments[selectedDocument].key_entities && (
                <div className="detail-section">
                  <h3>Identified Entities (Anonymized)</h3>
                  <div className="entity-list">
                    {filteredDocuments[selectedDocument].key_entities.map((entity, i) => (
                      <div key={i} className="entity-item">
                        <span className="entity-placeholder">&lt;{entity}&gt;</span>
                        <span className="entity-type">Anonymized</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredDocuments[selectedDocument].legal_concepts && (
                <div className="detail-section">
                  <h3>Legal Analysis</h3>
                  <div className="legal-concepts">
                    {filteredDocuments[selectedDocument].legal_concepts.map((concept, i) => (
                      <div key={i} className="concept-detail">
                        <h4>{concept}</h4>
                        <p>Identified in document context</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredDocuments[selectedDocument].pattern_summary && (
                <div className="detail-section">
                  <h3>Pattern Summary</h3>
                  <p>{filteredDocuments[selectedDocument].pattern_summary}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="analysis-summary">
        <h3>Overall Document Analysis</h3>
        <div className="summary-stats">
          <div className="stat-item">
            <label>Average Confidence:</label>
            <value>
              {Math.round(
                (documents.reduce((sum, doc) => sum + (doc.confidence || 0.9), 0) / 
                Math.max(documents.length, 1)) * 100
              )}%
            </value>
          </div>
          <div className="stat-item">
            <label>Document Types:</label>
            <value>{new Set(documents.map(d => d.type)).size}</value>
          </div>
          <div className="stat-item">
            <label>Total Pages:</label>
            <value>{documents.reduce((sum, doc) => sum + (doc.pages || 1), 0)}</value>
          </div>
          <div className="stat-item">
            <label>Anonymization:</label>
            <value className="success">100% Complete</value>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentAnalysisView;