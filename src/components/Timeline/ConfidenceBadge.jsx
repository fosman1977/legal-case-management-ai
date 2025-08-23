/**
 * Confidence Badge Component - Week 6 Day 3-4
 * Shows confidence level for individual timeline events
 */

import React from 'react';

const ConfidenceBadge = ({ confidence }) => {
  const getConfidenceClass = (confidence) => {
    if (confidence >= 0.9) return 'high';
    if (confidence >= 0.7) return 'medium';
    return 'low';
  };

  const getConfidenceIcon = (confidence) => {
    if (confidence >= 0.9) return '✓';
    if (confidence >= 0.7) return '~';
    return '?';
  };

  const confidenceClass = getConfidenceClass(confidence);
  const confidenceIcon = getConfidenceIcon(confidence);

  return (
    <span className={`confidence-badge ${confidenceClass}`}>
      <span className="confidence-icon">{confidenceIcon}</span>
      <span className="confidence-percentage">{Math.round(confidence * 100)}%</span>
    </span>
  );
};

export default ConfidenceBadge;