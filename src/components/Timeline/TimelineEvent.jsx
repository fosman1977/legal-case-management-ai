/**
 * Timeline Event Component - Week 6 Day 3-4 Implementation
 * Individual event display within timeline
 */

import React from 'react';
import ConfidenceBadge from './ConfidenceBadge';

const TimelineEvent = ({ event }) => (
  <div className="timeline-event">
    <div className="event-header">
      <h4>{event.title}</h4>
      <ConfidenceBadge confidence={event.confidence} />
    </div>
    <div className="event-description">{event.description}</div>
    <div className="event-metadata">
      <span className="source">Source: {event.source}</span>
      <span className="significance">Significance: {event.significance}</span>
    </div>
  </div>
);

export default TimelineEvent;