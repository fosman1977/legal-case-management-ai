/**
 * Timeline Header Component - Week 6 Day 3-4
 * Header section for timeline with title and controls
 */

import React from 'react';

const TimelineHeader = ({ children }) => {
  return (
    <div className="timeline-header">
      {children}
    </div>
  );
};

export default TimelineHeader;