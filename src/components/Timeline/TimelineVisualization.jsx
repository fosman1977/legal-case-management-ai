/**
 * Timeline Visualization - Week 6 Day 3-4 Implementation
 * Uses react-timeline-scaleio for professional timeline display
 */

import React, { useState } from 'react';
import { Timeline, TimelineItem } from 'react-timeline-scaleio';
import TimelineHeader from './TimelineHeader';
import TimelineControls from './TimelineControls';
import FilterButton from './FilterButton';
import TimelineEvent from './TimelineEvent';
import TimelineFooter from './TimelineFooter';
import ConfidenceIndicator from './ConfidenceIndicator';
import GapAnalysis from './GapAnalysis';
import './Timeline.css';

const TimelineVisualization = ({ events, analysis }) => {
  const [activeFilter, setActiveFilter] = useState('all');

  const timelineData = events.map(event => ({
    id: event.id,
    start: new Date(event.date),
    title: event.title,
    description: event.description,
    source: event.source_document,
    confidence: event.confidence,
    type: event.event_type,
    significance: event.legal_significance
  }));

  const filteredData = filterTimelineData(timelineData, activeFilter);

  return (
    <div className="timeline-container">
      <TimelineHeader>
        <h3>Case Chronology</h3>
        <TimelineControls>
          <FilterButton 
            filter="all" 
            active={activeFilter === 'all'}
            onClick={() => setActiveFilter('all')}
          >
            All Events
          </FilterButton>
          <FilterButton 
            filter="legal" 
            active={activeFilter === 'legal'}
            onClick={() => setActiveFilter('legal')}
          >
            Legal Events
          </FilterButton>
          <FilterButton 
            filter="financial" 
            active={activeFilter === 'financial'}
            onClick={() => setActiveFilter('financial')}
          >
            Financial Events
          </FilterButton>
          <FilterButton 
            filter="communication" 
            active={activeFilter === 'communication'}
            onClick={() => setActiveFilter('communication')}
          >
            Communications
          </FilterButton>
        </TimelineControls>
      </TimelineHeader>

      <Timeline>
        {filteredData.map(event => (
          <TimelineItem
            key={event.id}
            start={event.start}
            className={`timeline-item ${event.type}`}
          >
            <TimelineEvent event={event} />
          </TimelineItem>
        ))}
      </Timeline>

      <TimelineFooter>
        <ConfidenceIndicator confidence={analysis.timeline_confidence} />
        <GapAnalysis gaps={analysis.timeline_gaps} />
      </TimelineFooter>
    </div>
  );
};

const filterTimelineData = (data, filter) => {
  if (filter === 'all') return data;
  
  const filterMap = {
    legal: ['court', 'legal', 'judgment', 'ruling'],
    financial: ['financial', 'payment', 'invoice', 'contract'],
    communication: ['communication', 'correspondence', 'meeting', 'call']
  };

  return data.filter(event => 
    filterMap[filter]?.some(keyword => 
      event.type?.toLowerCase().includes(keyword) ||
      event.title?.toLowerCase().includes(keyword)
    )
  );
};

export default TimelineVisualization;