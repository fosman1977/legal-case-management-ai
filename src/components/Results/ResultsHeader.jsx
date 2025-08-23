/**
 * Results Header Component - Week 6 Day 1-2
 * Professional header for results display
 */

import React from 'react';

const ResultsHeader = ({ case: caseContext }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="results-header">
      <div className="case-identifier">
        <h1>{caseContext.name || 'Case Analysis Results'}</h1>
        <div className="case-metadata">
          <span className="case-reference">{caseContext.reference || 'REF-001'}</span>
          <span className="case-date">{formatDate(caseContext.date || new Date())}</span>
          <span className="case-jurisdiction">{caseContext.jurisdiction || 'England and Wales'}</span>
        </div>
      </div>
      
      <div className="analysis-status">
        <div className="status-indicator success">
          <span className="status-icon">✓</span>
          <span className="status-text">Analysis Complete</span>
        </div>
        <div className="privacy-badge">
          <span className="badge-icon">🔒</span>
          <span className="badge-text">Privacy Protected</span>
        </div>
      </div>
    </div>
  );
};

export default ResultsHeader;