/**
 * Timeline Controls Component - Week 6 Day 3-4
 * Control buttons and filters for timeline
 */

import React from 'react';

const TimelineControls = ({ children }) => {
  return (
    <div className="timeline-controls">
      {children}
    </div>
  );
};

export default TimelineControls;