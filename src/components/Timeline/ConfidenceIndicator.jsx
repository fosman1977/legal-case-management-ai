/**
 * Confidence Indicator Component - Week 6 Day 3-4
 * Shows timeline confidence level
 */

import React from 'react';

const ConfidenceIndicator = ({ confidence }) => {
  const getConfidenceLevel = (confidence) => {
    if (confidence >= 0.9) return 'high';
    if (confidence >= 0.7) return 'medium';
    return 'low';
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 0.9) return 'High Confidence';
    if (confidence >= 0.7) return 'Medium Confidence';
    return 'Low Confidence';
  };

  const confidenceLevel = getConfidenceLevel(confidence);
  const confidenceLabel = getConfidenceLabel(confidence);

  return (
    <div className={`confidence-indicator ${confidenceLevel}`}>
      <div className="confidence-header">
        <span className="confidence-label">Timeline Confidence</span>
        <span className="confidence-value">{Math.round(confidence * 100)}%</span>
      </div>
      <div className="confidence-bar">
        <div 
          className={`confidence-fill ${confidenceLevel}`}
          style={{ width: `${confidence * 100}%` }}
        ></div>
      </div>
      <div className="confidence-description">
        {confidenceLabel} - Based on document analysis and event extraction
      </div>
    </div>
  );
};

export default ConfidenceIndicator;