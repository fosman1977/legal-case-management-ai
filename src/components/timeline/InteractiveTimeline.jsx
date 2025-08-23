/**
 * Interactive Timeline Component - Week 16 Day 1-3
 * Advanced timeline visualization with filtering and zoom capabilities
 */

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useTheme } from '../../design/ThemeProvider.jsx';
import Card, { CardHeader, CardContent } from '../../design/components/Card.jsx';
import Button from '../../design/components/Button.jsx';
import { OptimizedTimeline, usePerformanceMonitor } from '../../performance/VirtualizedComponents.jsx';

// Icon Components
const XMarkIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const PlusIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const MinusIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
  </svg>
);

const CalendarIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

// Utility functions
const formatDisplayDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });
};

const calculateSignificance = (event) => {
  let significance = 1;
  if (event.type === 'deadline') significance += 2;
  if (event.type === 'legal') significance += 1;
  if (event.confidence && event.confidence > 0.8) significance += 1;
  return Math.min(significance, 5);
};

const findConnectedEvents = (event, allEvents) => {
  // In a real implementation, this would analyze relationships
  return [];
};

const getEventColor = (type) => {
  const colors = {
    legal: '#3b82f6',
    financial: '#10b981',
    communication: '#8b5cf6',
    deadline: '#ef4444',
    default: '#6b7280'
  };
  return colors[type] || colors.default;
};

const getEventVariant = (type) => {
  const variants = {
    legal: 'primary',
    financial: 'success',
    communication: 'secondary',
    deadline: 'error',
    default: 'default'
  };
  return variants[type] || variants.default;
};

// Filter Chip Component
const FilterChip = ({ type, active, onClick }) => {
  const { tokens } = useTheme();
  
  const chipStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacing[2],
    padding: `${tokens.spacing[2]} ${tokens.spacing[3]}`,
    borderRadius: tokens.borderRadius.full,
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    cursor: 'pointer',
    transition: tokens.transitions.all,
    backgroundColor: active ? getEventColor(type.id) : tokens.colors.neutral[100],
    color: active ? 'white' : tokens.colors.neutral[700],
    border: `2px solid ${active ? getEventColor(type.id) : tokens.colors.neutral[300]}`
  };

  return (
    <button onClick={onClick} style={chipStyles}>
      <span>{type.label}</span>
      <span style={{
        padding: `0 ${tokens.spacing[1]}`,
        backgroundColor: active ? 'rgba(255,255,255,0.2)' : tokens.colors.neutral[200],
        borderRadius: tokens.borderRadius.full,
        fontSize: tokens.typography.fontSize.xs
      }}>
        {type.count}
      </span>
    </button>
  );
};

// Timeline Controls Component
const TimelineControls = ({ zoomLevel, onZoomChange, timeRange, onTimeRangeChange }) => {
  const { tokens } = useTheme();
  
  const controlStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing[2]
  };

  const buttonStyles = {
    padding: tokens.spacing[2],
    borderRadius: tokens.borderRadius.md,
    backgroundColor: tokens.colors.neutral[100],
    border: `1px solid ${tokens.colors.neutral[300]}`,
    cursor: 'pointer',
    transition: tokens.transitions.all
  };

  return (
    <div style={controlStyles}>
      <button 
        onClick={() => onZoomChange(Math.max(0.5, zoomLevel - 0.25))}
        style={buttonStyles}
      >
        <MinusIcon style={{ width: '16px', height: '16px' }} />
      </button>
      <span style={{ 
        fontSize: tokens.typography.fontSize.sm,
        color: tokens.colors.neutral[600],
        minWidth: '40px',
        textAlign: 'center'
      }}>
        {Math.round(zoomLevel * 100)}%
      </span>
      <button 
        onClick={() => onZoomChange(Math.min(3, zoomLevel + 0.25))}
        style={buttonStyles}
      >
        <PlusIcon style={{ width: '16px', height: '16px' }} />
      </button>
    </div>
  );
};

// Confidence Badge Component
const ConfidenceBadge = ({ confidence }) => {
  const { tokens } = useTheme();
  
  const getColor = () => {
    if (confidence >= 0.8) return tokens.colors.success[600];
    if (confidence >= 0.6) return tokens.colors.warning[600];
    return tokens.colors.error[600];
  };

  return (
    <span style={{
      fontSize: tokens.typography.fontSize.xs,
      color: getColor(),
      fontWeight: tokens.typography.fontWeight.medium
    }}>
      {Math.round(confidence * 100)}%
    </span>
  );
};

// Badge Component
const Badge = ({ variant, children }) => {
  const { tokens } = useTheme();
  
  const variantColors = {
    primary: { bg: tokens.colors.primary[100], text: tokens.colors.primary[700] },
    success: { bg: tokens.colors.success[100], text: tokens.colors.success[700] },
    secondary: { bg: tokens.colors.secondary[100], text: tokens.colors.secondary[700] },
    error: { bg: tokens.colors.error[100], text: tokens.colors.error[700] },
    default: { bg: tokens.colors.neutral[100], text: tokens.colors.neutral[700] }
  };

  const colors = variantColors[variant] || variantColors.default;

  return (
    <span style={{
      padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
      backgroundColor: colors.bg,
      color: colors.text,
      borderRadius: tokens.borderRadius.full,
      fontSize: tokens.typography.fontSize.xs,
      fontWeight: tokens.typography.fontWeight.medium
    }}>
      {children}
    </span>
  );
};

// Timeline Chart Component (Simplified D3-like visualization)
const TimelineChart = ({ events, selectedEvent, onEventSelect, zoomLevel, timeRange }) => {
  const { tokens } = useTheme();
  const svgRef = useRef();
  const [dimensions] = useState({ width: 800, height: 400 });

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear previous content
    svgRef.current.innerHTML = '';

    const svg = svgRef.current;
    const padding = 50;
    const width = dimensions.width - padding * 2;
    const height = dimensions.height - padding * 2;

    // Calculate time range
    const dates = events.map(e => e.date.getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const timeSpan = maxDate - minDate;

    // Draw timeline axis
    const axisY = height - 20;
    const axis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    axis.setAttribute('x1', padding);
    axis.setAttribute('y1', axisY);
    axis.setAttribute('x2', dimensions.width - padding);
    axis.setAttribute('y2', axisY);
    axis.setAttribute('stroke', tokens.colors.neutral[300]);
    axis.setAttribute('stroke-width', '2');
    svg.appendChild(axis);

    // Draw events
    events.forEach((event, index) => {
      const x = padding + ((event.date.getTime() - minDate) / timeSpan) * width;
      const y = axisY - (event.significance * 30);

      // Event circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', selectedEvent?.id === event.id ? 8 : 6);
      circle.setAttribute('fill', getEventColor(event.type));
      circle.setAttribute('stroke', selectedEvent?.id === event.id ? tokens.colors.primary[600] : 'white');
      circle.setAttribute('stroke-width', selectedEvent?.id === event.id ? '3' : '2');
      circle.style.cursor = 'pointer';
      circle.onclick = () => onEventSelect(event);
      svg.appendChild(circle);

      // Event label
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x);
      text.setAttribute('y', y - 10);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '12');
      text.setAttribute('fill', tokens.colors.neutral[700]);
      text.textContent = event.title.length > 20 ? event.title.substring(0, 20) + '...' : event.title;
      svg.appendChild(text);

      // Date label
      const dateText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      dateText.setAttribute('x', x);
      dateText.setAttribute('y', axisY + 15);
      dateText.setAttribute('text-anchor', 'middle');
      dateText.setAttribute('font-size', '10');
      dateText.setAttribute('fill', tokens.colors.neutral[500]);
      dateText.textContent = event.displayDate;
      svg.appendChild(dateText);
    });

  }, [events, selectedEvent, zoomLevel, dimensions]);

  return (
    <svg
      ref={svgRef}
      width={dimensions.width}
      height={dimensions.height}
      style={{ width: '100%', height: '400px' }}
    />
  );
};

// Timeline Navigation Component
const TimelineNavigation = ({ events, currentRange, onRangeChange }) => {
  const { tokens } = useTheme();
  
  if (events.length === 0) return null;

  const firstDate = events[0].displayDate;
  const lastDate = events[events.length - 1].displayDate;

  return (
    <div style={{
      padding: tokens.spacing[3],
      backgroundColor: tokens.colors.neutral[50],
      borderTop: `1px solid ${tokens.colors.neutral[200]}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600] }}>
        {firstDate}
      </span>
      <span style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.neutral[500] }}>
        {events.length} events
      </span>
      <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.neutral[600] }}>
        {lastDate}
      </span>
    </div>
  );
};

// Timeline Stats Component
const TimelineStats = ({ events, analysis }) => {
  const { tokens } = useTheme();
  
  const stats = {
    total: events.length,
    legal: events.filter(e => e.type === 'legal').length,
    critical: events.filter(e => e.significance >= 4).length,
    upcoming: events.filter(e => e.date > new Date()).length
  };

  return (
    <div style={{
      display: 'flex',
      gap: tokens.spacing[6],
      fontSize: tokens.typography.fontSize.sm
    }}>
      <div>
        <span style={{ color: tokens.colors.neutral[500] }}>Total Events: </span>
        <span style={{ fontWeight: tokens.typography.fontWeight.medium }}>{stats.total}</span>
      </div>
      <div>
        <span style={{ color: tokens.colors.neutral[500] }}>Legal Events: </span>
        <span style={{ fontWeight: tokens.typography.fontWeight.medium }}>{stats.legal}</span>
      </div>
      <div>
        <span style={{ color: tokens.colors.neutral[500] }}>Critical: </span>
        <span style={{ fontWeight: tokens.typography.fontWeight.medium, color: tokens.colors.error[600] }}>
          {stats.critical}
        </span>
      </div>
      <div>
        <span style={{ color: tokens.colors.neutral[500] }}>Upcoming: </span>
        <span style={{ fontWeight: tokens.typography.fontWeight.medium, color: tokens.colors.warning[600] }}>
          {stats.upcoming}
        </span>
      </div>
    </div>
  );
};

// Event Details Panel Component
const EventDetailsPanel = ({ event, relatedEvents, onClose }) => {
  const { tokens } = useTheme();
  
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        padding: tokens.spacing[4],
        borderBottom: `1px solid ${tokens.colors.neutral[200]}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h4 style={{ 
            fontSize: tokens.typography.fontSize.lg,
            fontWeight: tokens.typography.fontWeight.medium,
            margin: 0
          }}>
            Event Details
          </h4>
          <button
            onClick={onClose}
            style={{
              padding: tokens.spacing[1],
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: tokens.colors.neutral[400]
            }}
          >
            <XMarkIcon style={{ width: '20px', height: '20px' }} />
          </button>
        </div>
      </div>

      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: tokens.spacing[4],
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacing[4]
      }}>
        {/* Event Information */}
        <div>
          <h5 style={{ 
            fontWeight: tokens.typography.fontWeight.medium,
            color: tokens.colors.neutral[900],
            marginBottom: tokens.spacing[2],
            margin: `0 0 ${tokens.spacing[2]} 0`
          }}>
            {event.title}
          </h5>
          <p style={{ 
            fontSize: tokens.typography.fontSize.sm,
            color: tokens.colors.neutral[600],
            marginBottom: tokens.spacing[3]
          }}>
            {event.description}
          </p>
          
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: tokens.spacing[2],
            fontSize: tokens.typography.fontSize.sm
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: tokens.colors.neutral[500] }}>Date:</span>
              <span style={{ fontWeight: tokens.typography.fontWeight.medium }}>
                {event.displayDate}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: tokens.colors.neutral[500] }}>Type:</span>
              <Badge variant={getEventVariant(event.type)}>
                {event.type}
              </Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: tokens.colors.neutral[500] }}>Source:</span>
              <span style={{ fontWeight: tokens.typography.fontWeight.medium }}>
                {event.source_document || 'Document analysis'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: tokens.colors.neutral[500] }}>Confidence:</span>
              <ConfidenceBadge confidence={event.confidence || 0.85} />
            </div>
          </div>
        </div>

        {/* Legal Significance */}
        {event.legal_significance && (
          <div>
            <h6 style={{ 
              fontWeight: tokens.typography.fontWeight.medium,
              color: tokens.colors.neutral[900],
              marginBottom: tokens.spacing[2],
              margin: `0 0 ${tokens.spacing[2]} 0`
            }}>
              Legal Significance
            </h6>
            <p style={{ 
              fontSize: tokens.typography.fontSize.sm,
              color: tokens.colors.neutral[600]
            }}>
              {event.legal_significance}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Interactive Timeline Component
export const InteractiveTimeline = ({ events = [], analysis = {} }) => {
  const { tokens } = useTheme();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeFilters, setActiveFilters] = useState(['all']);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [timeRange, setTimeRange] = useState(null);

  // Process timeline data
  const processedEvents = useMemo(() => {
    return events
      .filter(event => activeFilters.includes('all') || activeFilters.includes(event.type))
      .map(event => ({
        ...event,
        date: new Date(event.date),
        displayDate: formatDisplayDate(event.date),
        significance: calculateSignificance(event),
        connections: findConnectedEvents(event, events)
      }))
      .sort((a, b) => a.date - b.date);
  }, [events, activeFilters]);

  const eventTypes = [
    { id: 'all', label: 'All Events', color: 'gray', count: events.length },
    { id: 'legal', label: 'Legal Events', color: 'blue', count: events.filter(e => e.type === 'legal').length },
    { id: 'financial', label: 'Financial', color: 'green', count: events.filter(e => e.type === 'financial').length },
    { id: 'communication', label: 'Communications', color: 'purple', count: events.filter(e => e.type === 'communication').length },
    { id: 'deadline', label: 'Deadlines', color: 'red', count: events.filter(e => e.type === 'deadline').length }
  ];

  const toggleFilter = (typeId) => {
    if (typeId === 'all') {
      setActiveFilters(['all']);
    } else {
      const newFilters = activeFilters.filter(f => f !== 'all');
      if (activeFilters.includes(typeId)) {
        const filtered = newFilters.filter(f => f !== typeId);
        setActiveFilters(filtered.length === 0 ? ['all'] : filtered);
      } else {
        setActiveFilters([...newFilters, typeId]);
      }
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Timeline Header */}
      <div style={{ 
        backgroundColor: tokens.colors.neutral[50],
        borderBottom: `1px solid ${tokens.colors.neutral[200]}`,
        padding: tokens.spacing[4]
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ 
            fontSize: tokens.typography.fontSize.lg,
            fontWeight: tokens.typography.fontWeight.medium,
            color: tokens.colors.neutral[900],
            margin: 0
          }}>
            Case Timeline
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[4] }}>
            <TimelineControls
              zoomLevel={zoomLevel}
              onZoomChange={setZoomLevel}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
            <Button variant="secondary" size="sm">
              Export Timeline
            </Button>
          </div>
        </div>

        {/* Event Type Filters */}
        <div style={{ 
          marginTop: tokens.spacing[4],
          display: 'flex',
          flexWrap: 'wrap',
          gap: tokens.spacing[2]
        }}>
          {eventTypes.map(type => (
            <FilterChip
              key={type.id}
              type={type}
              active={activeFilters.includes(type.id)}
              onClick={() => toggleFilter(type.id)}
            />
          ))}
        </div>
      </div>

      {/* Timeline Visualization */}
      <div style={{ flex: 1, display: 'flex' }}>
        {/* Main Timeline */}
        <div style={{ flex: 1, position: 'relative' }}>
          <TimelineChart
            events={processedEvents}
            selectedEvent={selectedEvent}
            onEventSelect={setSelectedEvent}
            zoomLevel={zoomLevel}
            timeRange={timeRange}
          />
          
          {/* Timeline Navigation */}
          <TimelineNavigation
            events={processedEvents}
            currentRange={timeRange}
            onRangeChange={setTimeRange}
          />
        </div>

        {/* Event Details Panel */}
        {selectedEvent && (
          <div style={{ 
            width: '320px',
            borderLeft: `1px solid ${tokens.colors.neutral[200]}`,
            backgroundColor: tokens.colors.neutral[50]
          }}>
            <EventDetailsPanel
              event={selectedEvent}
              relatedEvents={selectedEvent.connections}
              onClose={() => setSelectedEvent(null)}
            />
          </div>
        )}
      </div>

      {/* Timeline Footer */}
      <div style={{ 
        backgroundColor: tokens.colors.neutral[100],
        borderTop: `1px solid ${tokens.colors.neutral[200]}`,
        padding: tokens.spacing[4]
      }}>
        <TimelineStats events={processedEvents} analysis={analysis} />
      </div>
    </div>
  );
};

export default InteractiveTimeline;