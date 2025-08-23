/**
 * Gap Analysis Component - Week 6 Day 3-4
 * Shows timeline gaps and missing information
 */

import React, { useState } from 'react';

const GapAnalysis = ({ gaps }) => {
  const [expanded, setExpanded] = useState(false);

  if (!gaps || gaps.length === 0) {
    return (
      <div className="gap-analysis no-gaps">
        <div className="gap-header">
          <span className="gap-icon">✓</span>
          <span className="gap-title">No Timeline Gaps Detected</span>
        </div>
        <p className="gap-description">
          Timeline appears complete with no significant gaps in the chronology.
        </p>
      </div>
    );
  }

  const criticalGaps = gaps.filter(gap => gap.severity === 'critical');
  const moderateGaps = gaps.filter(gap => gap.severity === 'moderate');
  const minorGaps = gaps.filter(gap => gap.severity === 'minor');

  return (
    <div className="gap-analysis has-gaps">
      <div 
        className="gap-header"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="gap-icon">⚠️</span>
        <span className="gap-title">
          Timeline Gaps Detected ({gaps.length})
        </span>
        <span className="expand-icon">
          {expanded ? '−' : '+'}
        </span>
      </div>

      <div className="gap-summary">
        {criticalGaps.length > 0 && (
          <span className="gap-count critical">
            {criticalGaps.length} Critical
          </span>
        )}
        {moderateGaps.length > 0 && (
          <span className="gap-count moderate">
            {moderateGaps.length} Moderate
          </span>
        )}
        {minorGaps.length > 0 && (
          <span className="gap-count minor">
            {minorGaps.length} Minor
          </span>
        )}
      </div>

      {expanded && (
        <div className="gap-details">
          {criticalGaps.length > 0 && (
            <div className="gap-category">
              <h4 className="gap-category-title critical">Critical Gaps</h4>
              {criticalGaps.map((gap, idx) => (
                <div key={idx} className="gap-item critical">
                  <div className="gap-period">
                    <span className="gap-start">
                      {new Date(gap.start_date).toLocaleDateString()}
                    </span>
                    <span className="gap-separator">→</span>
                    <span className="gap-end">
                      {new Date(gap.end_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="gap-description">
                    {gap.description}
                  </div>
                  <div className="gap-impact">
                    <strong>Impact:</strong> {gap.impact}
                  </div>
                  {gap.recommendations && (
                    <div className="gap-recommendations">
                      <strong>Recommendations:</strong>
                      <ul>
                        {gap.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {moderateGaps.length > 0 && (
            <div className="gap-category">
              <h4 className="gap-category-title moderate">Moderate Gaps</h4>
              {moderateGaps.map((gap, idx) => (
                <div key={idx} className="gap-item moderate">
                  <div className="gap-period">
                    <span className="gap-start">
                      {new Date(gap.start_date).toLocaleDateString()}
                    </span>
                    <span className="gap-separator">→</span>
                    <span className="gap-end">
                      {new Date(gap.end_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="gap-description">
                    {gap.description}
                  </div>
                  {gap.impact && (
                    <div className="gap-impact">
                      <strong>Impact:</strong> {gap.impact}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {minorGaps.length > 0 && (
            <div className="gap-category">
              <h4 className="gap-category-title minor">Minor Gaps</h4>
              {minorGaps.slice(0, 3).map((gap, idx) => (
                <div key={idx} className="gap-item minor">
                  <div className="gap-period">
                    <span className="gap-start">
                      {new Date(gap.start_date).toLocaleDateString()}
                    </span>
                    <span className="gap-separator">→</span>
                    <span className="gap-end">
                      {new Date(gap.end_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="gap-description">
                    {gap.description}
                  </div>
                </div>
              ))}
              {minorGaps.length > 3 && (
                <div className="gap-item-more">
                  And {minorGaps.length - 3} more minor gaps...
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="gap-actions">
        <button className="btn-primary">
          Generate Gap Analysis Report
        </button>
        <button className="btn-secondary">
          Suggest Evidence Collection
        </button>
      </div>
    </div>
  );
};

export default GapAnalysis;