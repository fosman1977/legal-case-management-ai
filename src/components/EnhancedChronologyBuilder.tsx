import React, { useState, useEffect } from 'react';
import { ChronologyEvent, CaseDocument } from '../types';
import { storage } from '../utils/storage';
import { indexedDBManager } from '../utils/indexedDB';
import { aiAnalyzer } from '../utils/aiAnalysis';

interface EnhancedChronologyBuilderProps {
  caseId: string;
}

export const EnhancedChronologyBuilder: React.FC<EnhancedChronologyBuilderProps> = ({ caseId }) => {
  const [events, setEvents] = useState<ChronologyEvent[]>([]);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ChronologyEvent | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'list' | 'calendar'>('timeline');
  const [filter, setFilter] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<Partial<ChronologyEvent>>({
    date: '',
    description: '',
    significance: '',
    documentRef: ''
  });

  useEffect(() => {
    loadEvents();
    loadDocuments();
  }, [caseId]);

  // Auto-expand current year on load
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    if (events.some(e => new Date(e.date).getFullYear() === currentYear)) {
      setExpandedYears(new Set([currentYear]));
    } else if (events.length > 0) {
      // If no current year events, expand the most recent year
      const years = events.map(e => new Date(e.date).getFullYear());
      const mostRecentYear = Math.max(...years);
      setExpandedYears(new Set([mostRecentYear]));
    }
  }, [events]);

  const loadEvents = () => {
    const chronEvents = storage.getChronology(caseId);
    setEvents(chronEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
  };

  const loadDocuments = async () => {
    try {
      const allDocs: CaseDocument[] = [];
      const storageKey = `scanned_documents_${caseId}`;
      const savedScannedDocs = localStorage.getItem(storageKey);
      if (savedScannedDocs) {
        try {
          const scannedDocuments = JSON.parse(savedScannedDocs);
          allDocs.push(...scannedDocuments);
        } catch (error) {
          console.error('Failed to parse saved scanned documents:', error);
        }
      }

      const indexedDBDocs = await indexedDBManager.getDocuments(caseId);
      allDocs.push(...indexedDBDocs);
      
      const uniqueDocs = allDocs.filter((doc, index, self) => 
        index === self.findIndex(d => d.fileName === doc.fileName)
      );

      setDocuments(uniqueDocs);
    } catch (error) {
      console.error('Failed to load documents:', error);
      setDocuments(storage.getDocuments(caseId));
    }
  };

  const runAIAnalysis = async () => {
    if (documents.length === 0) {
      alert('No documents to analyze. Please add documents first.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      const result = await aiAnalyzer.analyzeChronology(
        documents,
        (progress: number, timeEstimate?: string) => {
          setAnalysisProgress(Math.round(progress));
          if (timeEstimate) {
            setEstimatedTime(timeEstimate);
          }
        }
      );

      if (result.events && result.events.length > 0) {
        result.events.forEach(event => {
          storage.addChronologyEvent({
            ...event,
            caseId
          });
        });
        
        loadEvents();
        alert(`Successfully extracted ${result.events.length} chronology events!`);
      } else {
        alert('No chronology events could be extracted from the documents.');
      }
    } catch (error) {
      console.error('AI analysis failed:', error);
      alert('AI analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      setEstimatedTime('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const event: ChronologyEvent = {
      ...formData as ChronologyEvent,
      id: editingEvent?.id || Date.now().toString(),
      caseId
    };

    if (editingEvent) {
      storage.updateChronologyEvent(event);
    } else {
      storage.addChronologyEvent(event);
    }

    loadEvents();
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      date: '',
      description: '',
      significance: '',
      documentRef: ''
    });
    setIsAdding(false);
    setEditingEvent(null);
  };

  const handleEdit = (event: ChronologyEvent) => {
    setEditingEvent(event);
    setFormData(event);
    setIsAdding(true);
  };

  const handleDelete = (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this chronology event?')) {
      storage.deleteChronologyEvent(eventId);
      loadEvents();
    }
  };

  const toggleEventExpanded = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const toggleYearExpanded = (year: number) => {
    const newExpanded = new Set(expandedYears);
    if (newExpanded.has(year)) {
      newExpanded.delete(year);
      // Also collapse all months in this year
      const yearMonths = Array.from(expandedMonths).filter(m => m.startsWith(`${year}-`));
      yearMonths.forEach(m => expandedMonths.delete(m));
      setExpandedMonths(new Set(expandedMonths));
    } else {
      newExpanded.add(year);
    }
    setExpandedYears(newExpanded);
  };

  const toggleMonthExpanded = (yearMonth: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(yearMonth)) {
      newExpanded.delete(yearMonth);
    } else {
      newExpanded.add(yearMonth);
    }
    setExpandedMonths(newExpanded);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getEventIcon = (description: string): string => {
    const lower = description.toLowerCase();
    if (lower.includes('court') || lower.includes('hearing')) return '⚖️';
    if (lower.includes('file') || lower.includes('submit')) return '📄';
    if (lower.includes('meet') || lower.includes('conference')) return '🤝';
    if (lower.includes('deadline') || lower.includes('due')) return '⏰';
    if (lower.includes('pay') || lower.includes('fee')) return '💰';
    if (lower.includes('sign') || lower.includes('contract')) return '✍️';
    return '📌';
  };

  const getEventsByYearAndMonth = () => {
    const yearMap = new Map<number, Map<string, ChronologyEvent[]>>();
    
    filteredEvents.forEach(event => {
      const date = new Date(event.date);
      const year = date.getFullYear();
      const month = date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      const monthKey = `${year}-${date.getMonth()}`;
      
      if (!yearMap.has(year)) {
        yearMap.set(year, new Map());
      }
      
      const monthMap = yearMap.get(year)!;
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, []);
      }
      
      monthMap.get(monthKey)!.push(event);
    });
    
    // Sort years descending, months within each year ascending
    return Array.from(yearMap.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([year, monthMap]) => ({
        year,
        months: Array.from(monthMap.entries())
          .sort((a, b) => {
            const monthA = parseInt(a[0].split('-')[1]);
            const monthB = parseInt(b[0].split('-')[1]);
            return monthA - monthB;
          })
          .map(([monthKey, events]) => ({
            monthKey,
            monthName: new Date(events[0].date).toLocaleDateString('en-GB', { month: 'long' }),
            events: events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          }))
      }));
  };

  const getMonthName = (monthKey: string): string => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month));
    return date.toLocaleDateString('en-GB', { month: 'long' });
  };

  const filteredEvents = events.filter(event => {
    if (!filter) return true;
    const searchLower = filter.toLowerCase();
    return event.description.toLowerCase().includes(searchLower) ||
           event.significance?.toLowerCase().includes(searchLower) ||
           formatDate(event.date).toLowerCase().includes(searchLower);
  });

  const years = Array.from(new Set(events.map(e => new Date(e.date).getFullYear()))).sort((a, b) => b - a);

  const exportToCSV = () => {
    // CSV headers
    const headers = ['Date', 'Event Description', 'Significance', 'Document Source'];
    
    // CSV rows
    const rows = events.map(event => {
      const source = event.documentRef 
        ? documents.find(d => d.id === event.documentRef)?.title || 'Unknown document'
        : '';
      
      // Escape quotes and wrap fields containing commas, quotes, or newlines
      const escapeCSV = (field: string) => {
        if (field.includes(',') || field.includes('"') || field.includes('\n')) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      };
      
      return [
        formatDate(event.date),
        escapeCSV(event.description),
        escapeCSV(event.significance || ''),
        escapeCSV(source)
      ].join(',');
    });
    
    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows].join('\n');
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chronology_${caseId}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="enhanced-chronology-builder">
      <div className="chronology-header">
        <div className="header-left">
          <h3>📅 Chronology of Events</h3>
          <div className="view-modes">
            <button 
              className={`view-mode ${viewMode === 'timeline' ? 'active' : ''}`}
              onClick={() => setViewMode('timeline')}
            >
              📈 Timeline
            </button>
            <button 
              className={`view-mode ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              📋 List
            </button>
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-secondary"
            onClick={exportToCSV}
            disabled={events.length === 0}
            title="Export chronology as CSV file"
          >
            📥 Export CSV
          </button>
          <button 
            className="btn btn-ai" 
            onClick={runAIAnalysis}
            disabled={isAnalyzing || documents.length === 0}
          >
            {isAnalyzing ? '⏳ Analyzing...' : '🤖 AI Analysis'}
          </button>
          {!isAdding && (
            <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
              + Add Event
            </button>
          )}
        </div>
      </div>

      <div className="chronology-controls">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search events..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        {years.length > 1 && (
          <select 
            className="year-filter"
            value={selectedYear || ''}
            onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">All Years</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        )}
      </div>

      {isAnalyzing && (
        <div className="ai-analysis-progress">
          <div className="progress-info">
            <span>🤖 AI is analyzing {documents.length} documents...</span>
            <div className="progress-stats">
              <span>{analysisProgress}%</span>
              {estimatedTime && <span className="estimated-time">• ~{estimatedTime} remaining</span>}
            </div>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${analysisProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {isAdding && (
        <form className="chronology-form modern" onSubmit={handleSubmit}>
          <h4>{editingEvent ? '✏️ Edit Event' : '➕ Add New Event'}</h4>
          <div className="form-row">
            <div className="form-group">
              <label>📅 Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>📄 Related Document</label>
              <select
                value={formData.documentRef}
                onChange={(e) => setFormData({ ...formData, documentRef: e.target.value })}
              >
                <option value="">None</option>
                {documents.map(doc => (
                  <option key={doc.id} value={doc.id}>{doc.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>📝 Event Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              required
              placeholder="What happened on this date?"
            />
          </div>

          <div className="form-group">
            <label>⭐ Significance (Optional)</label>
            <textarea
              value={formData.significance}
              onChange={(e) => setFormData({ ...formData, significance: e.target.value })}
              rows={2}
              placeholder="Why is this event important to the case?"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editingEvent ? 'Update Event' : 'Add Event'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="chronology-content">
        {filteredEvents.length === 0 ? (
          <div className="empty-state">
            <h4>📅 No events found</h4>
            <p>
              {filter ? 'Try adjusting your search criteria.' : 'Use AI Analysis to extract events from documents, or add them manually.'}
            </p>
          </div>
        ) : viewMode === 'timeline' ? (
          <div className="timeline-view">
            {getEventsByYearAndMonth().map(({ year, months }) => (
              (!selectedYear || selectedYear === year) && (
                <div key={year} className="year-section">
                  <div className="year-header" onClick={() => toggleYearExpanded(year)}>
                    <h3>
                      <span className="toggle-icon">{expandedYears.has(year) ? '▼' : '▶'}</span>
                      {year}
                    </h3>
                    <span className="event-count">{months.reduce((sum, m) => sum + m.events.length, 0)} events</span>
                  </div>
                  
                  {expandedYears.has(year) && (
                    <div className="year-content">
                      {months.map(({ monthKey, monthName, events }) => (
                        <div key={monthKey} className="month-section">
                          <div className="month-header" onClick={() => toggleMonthExpanded(monthKey)}>
                            <h4>
                              <span className="toggle-icon">{expandedMonths.has(monthKey) ? '▼' : '▶'}</span>
                              {monthName}
                            </h4>
                            <span className="event-count">{events.length} event{events.length !== 1 ? 's' : ''}</span>
                          </div>
                          
                          {expandedMonths.has(monthKey) && (
                            <div className="timeline">
                              {events.map((event, index) => (
                                <div key={event.id} className={`timeline-item ${expandedEvents.has(event.id) ? 'expanded' : ''}`}>
                                  <div className="timeline-marker">
                                    <span className="event-icon">{getEventIcon(event.description)}</span>
                                  </div>
                                  <div className="timeline-content">
                                    <div className="event-header" onClick={() => toggleEventExpanded(event.id)}>
                                      <div className="event-title">
                                        <h4 className="event-date">{formatDate(event.date)}</h4>
                                        <p className="event-preview">
                                          {event.description.length > 100 && !expandedEvents.has(event.id)
                                            ? event.description.substring(0, 100) + '...'
                                            : event.description}
                                        </p>
                                      </div>
                                      <button className="expand-toggle">
                                        {expandedEvents.has(event.id) ? '▼' : '▶'}
                                      </button>
                                    </div>
                                    
                                    {expandedEvents.has(event.id) && (
                                      <div className="event-details">
                                        {event.significance && (
                                          <div className="significance">
                                            <strong>⭐ Significance:</strong>
                                            <p>{event.significance}</p>
                                          </div>
                                        )}
                                        {event.documentRef && (
                                          <div className="document-ref">
                                            <strong>📄 Source:</strong>
                                            <p>{documents.find(d => d.id === event.documentRef)?.title || 'Unknown document'}</p>
                                          </div>
                                        )}
                                        <div className="event-actions">
                                          <button className="btn btn-sm" onClick={() => handleEdit(event)}>
                                            ✏️ Edit
                                          </button>
                                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(event.id)}>
                                            🗑️ Delete
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            ))}
          </div>
        ) : (
          <div className="list-view">
            <table className="events-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Event</th>
                  <th>Significance</th>
                  <th>Source</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map(event => (
                  <tr key={event.id}>
                    <td className="date-cell">{formatDate(event.date)}</td>
                    <td className="description-cell">{event.description}</td>
                    <td className="significance-cell">{event.significance || '-'}</td>
                    <td className="source-cell">
                      {event.documentRef 
                        ? documents.find(d => d.id === event.documentRef)?.title || 'Unknown'
                        : '-'}
                    </td>
                    <td className="actions-cell">
                      <button className="btn btn-sm" onClick={() => handleEdit(event)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(event.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .enhanced-chronology-builder {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .chronology-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .view-modes {
          display: flex;
          gap: 8px;
          background: #f0f0f0;
          border-radius: 8px;
          padding: 4px;
        }

        .view-mode {
          padding: 6px 12px;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;
          font-size: 14px;
        }

        .view-mode.active {
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .chronology-controls {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
        }

        .search-input {
          flex: 1;
          padding: 10px 16px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
        }

        .year-filter {
          padding: 10px 16px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          min-width: 150px;
        }

        .chronology-form.modern {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .timeline-view {
          position: relative;
        }

        .year-section {
          margin-bottom: 24px;
          border: 1px solid #e9ecef;
          border-radius: 12px;
          overflow: hidden;
          background: white;
        }

        .year-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          background: #f8f9fa;
          cursor: pointer;
          transition: background 0.2s;
        }

        .year-header:hover {
          background: #e9ecef;
        }

        .year-header h3 {
          margin: 0;
          font-size: 24px;
          color: #495057;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .month-section {
          border-top: 1px solid #e9ecef;
        }

        .month-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px 16px 48px;
          background: #fafbfc;
          cursor: pointer;
          transition: background 0.2s;
        }

        .month-header:hover {
          background: #f0f2f5;
        }

        .month-header h4 {
          margin: 0;
          font-size: 18px;
          color: #6c757d;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .toggle-icon {
          font-size: 14px;
          color: #6c757d;
          transition: transform 0.2s;
        }

        .event-count {
          font-size: 14px;
          color: #6c757d;
          font-weight: normal;
        }

        .year-content {
          animation: slideDown 0.3s ease;
        }

        .timeline {
          position: relative;
          padding: 20px 20px 20px 80px;
        }

        .timeline::before {
          content: '';
          position: absolute;
          left: 50px;
          top: 20px;
          bottom: 20px;
          width: 2px;
          background: #e9ecef;
        }

        .timeline-item {
          position: relative;
          margin-bottom: 32px;
          transition: all 0.3s ease;
        }

        .timeline-marker {
          position: absolute;
          left: -30px;
          top: 0;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .event-icon {
          width: 40px;
          height: 40px;
          background: white;
          border: 3px solid #007bff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          z-index: 1;
        }

        .timeline-content {
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          transition: all 0.3s ease;
        }

        .timeline-item:hover .timeline-content {
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }

        .event-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          cursor: pointer;
        }

        .event-title {
          flex: 1;
        }

        .event-date {
          margin: 0 0 8px 0;
          color: #007bff;
          font-size: 16px;
        }

        .event-preview {
          margin: 0;
          color: #495057;
          line-height: 1.5;
        }

        .expand-toggle {
          background: none;
          border: none;
          color: #6c757d;
          cursor: pointer;
          padding: 4px 8px;
          font-size: 12px;
        }

        .event-details {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e9ecef;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .significance, .document-ref {
          margin-bottom: 12px;
        }

        .significance strong, .document-ref strong {
          color: #495057;
          display: block;
          margin-bottom: 4px;
        }

        .significance p, .document-ref p {
          margin: 0;
          color: #6c757d;
        }

        .event-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }

        .list-view {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .events-table {
          width: 100%;
          border-collapse: collapse;
        }

        .events-table th {
          background: #f8f9fa;
          padding: 16px;
          text-align: left;
          font-weight: 600;
          color: #495057;
          border-bottom: 2px solid #e9ecef;
        }

        .events-table td {
          padding: 16px;
          border-bottom: 1px solid #e9ecef;
        }

        .events-table tr:hover {
          background: #f8f9fa;
        }

        .date-cell {
          white-space: nowrap;
          font-weight: 500;
          color: #007bff;
        }

        .actions-cell {
          white-space: nowrap;
        }

        .actions-cell .btn {
          margin-right: 4px;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #6c757d;
        }

        .empty-state h4 {
          font-size: 24px;
          margin-bottom: 12px;
        }

        .ai-analysis-progress {
          background: #e3f2fd;
          border: 1px solid #90caf9;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .progress-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .progress-stats {
          display: flex;
          gap: 12px;
          font-size: 14px;
          color: #1976d2;
        }

        .progress-bar {
          height: 8px;
          background: #bbdefb;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #1976d2;
          transition: width 0.3s ease;
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #0056b3;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #545b62;
        }

        .btn-ai {
          background: #4caf50;
          color: white;
        }

        .btn-ai:hover:not(:disabled) {
          background: #45a049;
        }

        .btn-danger {
          background: #dc3545;
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          background: #c82333;
        }

        .btn-sm {
          padding: 4px 12px;
          font-size: 12px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: #495057;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #ced4da;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #007bff;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        @media (max-width: 768px) {
          .chronology-header {
            flex-direction: column;
            align-items: stretch;
          }
          
          .header-left {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .header-actions {
            justify-content: stretch;
          }
          
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .timeline {
            padding-left: 40px;
          }
          
          .timeline::before {
            left: 15px;
          }
          
          .timeline-marker {
            left: -15px;
          }
          
          .event-icon {
            width: 30px;
            height: 30px;
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
};