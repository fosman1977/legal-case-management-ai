/**
 * Timeline Visualization Component - Updated for Week 6 Day 3-4
 * Uses enhanced Timeline components with react-timeline-scaleio
 */

import React from 'react';
import EnhancedTimeline from '../Timeline/TimelineVisualization';

const ResultsTimelineVisualization = ({ events = [] }) => {
  // Transform events from Results format to Timeline format
  const transformedEvents = events.map((event, index) => ({
    id: event.id || `event_${index}`,
    date: event.date,
    title: event.title || `Event ${index + 1}`,
    description: event.description || 'No description available',
    source_document: event.source || 'Unknown source',
    confidence: event.confidence || 0.85,
    event_type: event.type || 'general',
    legal_significance: event.significance || 'moderate'
  }));

  // Create mock analysis data for the enhanced timeline
  const analysisData = {
    timeline_confidence: calculateTimelineConfidence(transformedEvents),
    timeline_gaps: identifyTimelineGaps(transformedEvents)
  };

  return <EnhancedTimeline events={transformedEvents} analysis={analysisData} />;
};

function calculateTimelineConfidence(events) {
  if (events.length === 0) return 0.5;
  
  const avgConfidence = events.reduce((sum, event) => sum + (event.confidence || 0.8), 0) / events.length;
  return Math.min(0.99, avgConfidence);
}

function identifyTimelineGaps(events) {
  if (events.length < 2) return [];
  
  const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
  const gaps = [];
  
  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const current = new Date(sortedEvents[i].date);
    const next = new Date(sortedEvents[i + 1].date);
    const daysDiff = (next - current) / (1000 * 60 * 60 * 24);
    
    if (daysDiff > 90) { // More than 3 months gap
      gaps.push({
        start_date: current.toISOString(),
        end_date: next.toISOString(),
        severity: daysDiff > 365 ? 'critical' : daysDiff > 180 ? 'moderate' : 'minor',
        description: `${Math.round(daysDiff)} day gap in timeline between events`,
        impact: daysDiff > 365 ? 'Significant gap may indicate missing evidence' : 'Notable gap in event sequence',
        recommendations: daysDiff > 365 ? [
          'Review case files for missing documentation',
          'Interview participants about this period',
          'Check for relevant third-party records'
        ] : []
      });
    }
  }
  
  return gaps;
}

export default ResultsTimelineVisualization;