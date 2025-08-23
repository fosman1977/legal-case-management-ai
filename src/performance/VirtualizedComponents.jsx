/**
 * Virtualized Components - Week 17 Day 1-2
 * Performance optimization for large datasets
 */

import React, { memo, useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../design/ThemeProvider.jsx';

// Virtual Scrolling Hook for Large Lists
export const useVirtualScroll = ({ itemCount, itemHeight, containerHeight }) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const endIndex = Math.min(startIndex + visibleCount + 2, itemCount); // Buffer
    
    return {
      startIndex: Math.max(0, startIndex - 1),
      endIndex,
      visibleCount: endIndex - startIndex
    };
  }, [scrollTop, itemHeight, containerHeight, itemCount]);

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return {
    visibleItems,
    handleScroll,
    totalHeight: itemCount * itemHeight
  };
};

// Debounced Search Hook
export const useDebouncedSearch = (searchTerm, delay = 300) => {
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, delay]);

  return debouncedTerm;
};

// Document Icon Component
const DocumentIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

// Status Badge Component
const StatusBadge = memo(({ status }) => {
  const { tokens } = useTheme();
  
  const statusConfig = {
    pending: { bg: tokens.colors.neutral[100], text: tokens.colors.neutral[700], label: 'Pending' },
    processing: { bg: tokens.colors.warning[100], text: tokens.colors.warning[700], label: 'Processing' },
    completed: { bg: tokens.colors.success[100], text: tokens.colors.success[700], label: 'Complete' },
    error: { bg: tokens.colors.error[100], text: tokens.colors.error[700], label: 'Error' }
  };
  
  const config = statusConfig[status] || statusConfig.pending;
  
  return (
    <span style={{
      padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
      backgroundColor: config.bg,
      color: config.text,
      borderRadius: tokens.borderRadius.full,
      fontSize: tokens.typography.fontSize.xs,
      fontWeight: tokens.typography.fontWeight.medium
    }}>
      {config.label}
    </span>
  );
});

// Memoized Document List Item
const DocumentListItem = memo(({ document, onClick, style }) => {
  const { tokens } = useTheme();
  
  const itemStyles = {
    ...style,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing[3],
    cursor: 'pointer',
    padding: tokens.spacing[3],
    borderBottom: `1px solid ${tokens.colors.neutral[200]}`,
    transition: tokens.transitions.colors
  };

  return (
    <div 
      style={itemStyles}
      onClick={() => onClick(document)}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = tokens.colors.neutral[50];
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = 'transparent';
      }}
    >
      <DocumentIcon style={{ 
        width: '32px', 
        height: '32px',
        color: tokens.colors.neutral[400],
        flexShrink: 0
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: tokens.typography.fontSize.sm,
          fontWeight: tokens.typography.fontWeight.medium,
          color: tokens.colors.neutral[900],
          margin: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {document.name}
        </p>
        <p style={{
          fontSize: tokens.typography.fontSize.xs,
          color: tokens.colors.neutral[500],
          margin: 0
        }}>
          {document.size} • {document.type} • {document.confidence || 85}% confidence
        </p>
      </div>
      <StatusBadge status={document.status} />
    </div>
  );
});

// Virtualized Document List Component
export const VirtualizedDocumentList = memo(({ documents = [], onDocumentSelect, height = 600 }) => {
  const { tokens } = useTheme();
  const containerRef = useRef();
  const itemHeight = 80;
  
  const { visibleItems, handleScroll, totalHeight } = useVirtualScroll({
    itemCount: documents.length,
    itemHeight,
    containerHeight: height
  });

  const visibleDocuments = useMemo(() => {
    return documents.slice(visibleItems.startIndex, visibleItems.endIndex);
  }, [documents, visibleItems.startIndex, visibleItems.endIndex]);

  if (documents.length === 0) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: tokens.colors.neutral[500]
      }}>
        No documents to display
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        height,
        overflowY: 'auto',
        border: `1px solid ${tokens.colors.neutral[200]}`,
        borderRadius: tokens.borderRadius.lg
      }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{
          position: 'absolute',
          top: visibleItems.startIndex * itemHeight,
          width: '100%'
        }}>
          {visibleDocuments.map((document, index) => (
            <DocumentListItem
              key={document.id || index}
              document={document}
              onClick={onDocumentSelect}
              style={{ height: itemHeight }}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

// Optimized Timeline Rendering
export const OptimizedTimeline = memo(({ events = [], viewport, width = 800, height = 400 }) => {
  const { tokens } = useTheme();
  const canvasRef = useRef();
  const svgRef = useRef();
  
  // Filter visible events based on viewport
  const visibleEvents = useMemo(() => {
    if (!viewport || !viewport.start || !viewport.end) return events;
    
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= viewport.start && eventDate <= viewport.end;
    });
  }, [events, viewport]);

  // Use canvas for large datasets (>500 events)
  const shouldUseCanvas = visibleEvents.length > 500;

  // Canvas rendering for performance
  const renderTimelineCanvas = useCallback((canvas, events) => {
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Calculate time range
    if (events.length === 0) return;
    
    const dates = events.map(e => new Date(e.date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const timeSpan = maxDate - minDate || 1;
    
    const padding = 50;
    const timelineY = height - 50;
    
    // Draw timeline axis
    ctx.strokeStyle = tokens.colors.neutral[300];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, timelineY);
    ctx.lineTo(width - padding, timelineY);
    ctx.stroke();
    
    // Draw events
    events.forEach((event, index) => {
      const x = padding + ((new Date(event.date).getTime() - minDate) / timeSpan) * (width - padding * 2);
      const y = timelineY - (event.significance || 1) * 30;
      
      // Event circle
      ctx.fillStyle = getEventColor(event.type);
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();
      
      // Event label
      ctx.fillStyle = tokens.colors.neutral[700];
      ctx.font = '10px Inter';
      ctx.textAlign = 'center';
      const label = event.title.length > 15 ? event.title.substring(0, 15) + '...' : event.title;
      ctx.fillText(label, x, y - 10);
    });
  }, [tokens]);

  // SVG rendering for smaller datasets
  const renderTimelineSVG = useCallback(() => {
    if (!svgRef.current || visibleEvents.length === 0) return;
    
    const svg = svgRef.current;
    svg.innerHTML = '';
    
    const dates = visibleEvents.map(e => new Date(e.date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const timeSpan = maxDate - minDate || 1;
    
    const padding = 50;
    const timelineY = height - 50;
    
    // Timeline axis
    const axis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    axis.setAttribute('x1', padding);
    axis.setAttribute('y1', timelineY);
    axis.setAttribute('x2', width - padding);
    axis.setAttribute('y2', timelineY);
    axis.setAttribute('stroke', tokens.colors.neutral[300]);
    axis.setAttribute('stroke-width', '2');
    svg.appendChild(axis);
    
    // Events
    visibleEvents.forEach(event => {
      const x = padding + ((new Date(event.date).getTime() - minDate) / timeSpan) * (width - padding * 2);
      const y = timelineY - (event.significance || 1) * 30;
      
      // Event group
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      
      // Event circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', '6');
      circle.setAttribute('fill', getEventColor(event.type));
      circle.setAttribute('stroke', 'white');
      circle.setAttribute('stroke-width', '2');
      g.appendChild(circle);
      
      // Event label
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x);
      text.setAttribute('y', y - 10);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '10');
      text.setAttribute('font-family', 'Inter');
      text.setAttribute('fill', tokens.colors.neutral[700]);
      const label = event.title.length > 15 ? event.title.substring(0, 15) + '...' : event.title;
      text.textContent = label;
      g.appendChild(text);
      
      svg.appendChild(g);
    });
  }, [visibleEvents, width, height, tokens]);

  // Get event color helper
  const getEventColor = (type) => {
    const colors = {
      legal: tokens.colors.primary[500],
      financial: tokens.colors.success[500],
      communication: tokens.colors.secondary[500],
      deadline: tokens.colors.error[500],
      default: tokens.colors.neutral[400]
    };
    return colors[type] || colors.default;
  };

  // Render effects
  useEffect(() => {
    if (shouldUseCanvas && canvasRef.current) {
      renderTimelineCanvas(canvasRef.current, visibleEvents);
    } else {
      renderTimelineSVG();
    }
  }, [shouldUseCanvas, visibleEvents, renderTimelineCanvas, renderTimelineSVG]);

  if (shouldUseCanvas) {
    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width: '100%',
          height: '100%',
          border: `1px solid ${tokens.colors.neutral[200]}`,
          borderRadius: tokens.borderRadius.lg
        }}
      />
    );
  }

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{
        width: '100%',
        height: '100%',
        border: `1px solid ${tokens.colors.neutral[200]}`,
        borderRadius: tokens.borderRadius.lg,
        backgroundColor: tokens.colors.neutral[25]
      }}
      viewBox={`0 0 ${width} ${height}`}
    />
  );
});

// Performance Monitor Hook
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    memoryUsage: 0,
    componentsRendered: 0
  });

  const startMeasure = useCallback((name) => {
    performance.mark(`${name}-start`);
  }, []);

  const endMeasure = useCallback((name) => {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name)[0];
    if (measure) {
      setMetrics(prev => ({
        ...prev,
        renderTime: measure.duration,
        componentsRendered: prev.componentsRendered + 1
      }));
    }
  }, []);

  const getMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = performance.memory;
      setMetrics(prev => ({
        ...prev,
        memoryUsage: memory.usedJSHeapSize
      }));
    }
  }, []);

  return {
    metrics,
    startMeasure,
    endMeasure,
    getMemoryUsage
  };
};

// Lazy Loading Hook
export const useLazyLoading = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
};

export default {
  VirtualizedDocumentList,
  OptimizedTimeline,
  useDebouncedSearch,
  usePerformanceMonitor,
  useLazyLoading
};