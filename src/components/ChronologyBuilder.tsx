import React, { useState, useEffect } from 'react';
import { ChronologyEvent, CaseDocument } from '../types';
import { storage } from '../utils/storage';
import { indexedDBManager } from '../utils/indexedDB';
import { aiAnalyzer } from '../utils/aiAnalysis';

interface ChronologyBuilderProps {
  caseId: string;
}

export const ChronologyBuilder: React.FC<ChronologyBuilderProps> = ({ caseId }) => {
  const [events, setEvents] = useState<ChronologyEvent[]>([]);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ChronologyEvent | null>(null);
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

  const loadEvents = () => {
    setEvents(storage.getChronology(caseId));
  };

  const loadDocuments = async () => {
    try {
      // Merge all document sources like DocumentManager and AutoGenerator
      const allDocs: CaseDocument[] = [];

      // 1. Load scanned documents from localStorage
      const storageKey = `scanned_documents_${caseId}`;
      const savedScannedDocs = localStorage.getItem(storageKey);
      if (savedScannedDocs) {
        try {
          const scannedDocuments = JSON.parse(savedScannedDocs);
          allDocs.push(...scannedDocuments);
          console.log(`📦 ChronologyBuilder: Loaded ${scannedDocuments.length} scanned documents`);
        } catch (error) {
          console.error('Failed to parse saved scanned documents:', error);
        }
      }

      // 2. Load IndexedDB documents
      const indexedDBDocs = await indexedDBManager.getDocuments(caseId);
      allDocs.push(...indexedDBDocs);

      // 3. Fallback to localStorage documents
      if (allDocs.length === 0) {
        const localStorageDocs = storage.getDocuments(caseId);
        allDocs.push(...localStorageDocs);
      }

      // Remove duplicates (prioritize scanned documents)
      const uniqueDocs = allDocs.filter((doc, index, self) => 
        index === self.findIndex(d => d.fileName === doc.fileName || d.id === doc.id)
      );

      console.log(`📄 ChronologyBuilder: Total ${uniqueDocs.length} documents available`);
      setDocuments(uniqueDocs);
    } catch (error) {
      console.error('Failed to load documents for ChronologyBuilder:', error);
      setDocuments(storage.getDocuments(caseId));
    }
  };

  const runAIAnalysis = async () => {
    if (documents.length === 0) {
      alert('No documents available for analysis. Please upload documents first.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    // Calculate estimated time based on document count and content
    const estimateTimeSeconds = documents.length * 8; // ~8 seconds per document average
    const formatTime = (seconds: number) => {
      if (seconds < 60) return `${seconds}s`;
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    };
    setEstimatedTime(formatTime(estimateTimeSeconds));

    try {
      const startTime = Date.now();
      
      // Configure progress callback with time estimation
      const progressCallback = (_stage: string, progress: number) => {
        setAnalysisProgress(Math.min(progress, 95));
        
        // Update estimated time based on actual progress
        if (progress > 10) {
          const elapsed = (Date.now() - startTime) / 1000;
          const estimatedTotal = (elapsed / progress) * 100;
          const remaining = Math.max(0, estimatedTotal - elapsed);
          setEstimatedTime(formatTime(Math.round(remaining)));
        }
      };

      // Add timeout to prevent infinite waiting
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AI analysis timeout')), 60000) // 60 second timeout
      );

      const result = await Promise.race([
        aiAnalyzer.analyzeDocuments(documents, false, progressCallback),
        timeoutPromise
      ]) as any;
      
      setAnalysisProgress(100);

      // Process chronology events
      const newEvents: ChronologyEvent[] = result.chronologyEvents.map((event: any) => ({
        ...event,
        id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
        caseId
      }));

      // Merge with existing events
      const existingEvents = storage.getChronology(caseId);
      const allEvents = [...existingEvents, ...newEvents];
      
      // Sort by date
      allEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Save all events
      allEvents.forEach(event => storage.saveChronologyEvent(event));
      
      setEvents(allEvents);
      
      alert(`AI analysis complete! Found ${newEvents.length} chronology events with ${Math.round(result.confidence * 100)}% confidence.`);
    } catch (error) {
      console.error('AI analysis failed:', error);
      
      // If it's a timeout or Ollama failure, try pattern matching fallback
      if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('Failed'))) {
        try {
          console.log('🔄 Falling back to pattern matching...');
          setAnalysisProgress(50);
          
          // Disable Ollama and use pattern matching
          aiAnalyzer.setOllamaSettings(false, 'llama3.2:1b', true);
          const fallbackResult = await aiAnalyzer.analyzeDocuments(documents, false);
          
          // Re-enable Ollama for future attempts
          aiAnalyzer.setOllamaSettings(true, 'llama3.2:1b', true);
          
          setAnalysisProgress(100);
          
          // Process the fallback results
          const newEvents: ChronologyEvent[] = fallbackResult.chronologyEvents.map(event => ({
            ...event,
            id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
            caseId
          }));

          const existingEvents = storage.getChronology(caseId);
          const allEvents = [...existingEvents, ...newEvents];
          allEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          allEvents.forEach(event => storage.saveChronologyEvent(event));
          setEvents(allEvents);
          
          alert(`AI analysis complete using pattern matching! Found ${newEvents.length} chronology events.`);
          return;
        } catch (fallbackError) {
          console.error('Fallback analysis also failed:', fallbackError);
        }
      }
      
      alert('AI analysis failed. Please check that Ollama is running and try again, or check the console for details.');
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      setEstimatedTime('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const event: ChronologyEvent = {
      ...formData,
      id: editingEvent?.id || Date.now().toString(),
      caseId,
    } as ChronologyEvent;

    storage.saveChronologyEvent(event);
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

  return (
    <div className="chronology-builder">
      <div className="manager-header">
        <h3>Chronology of Events</h3>
        <div className="header-actions">
          <button 
            className="btn btn-ai" 
            onClick={runAIAnalysis}
            disabled={isAnalyzing || documents.length === 0}
          >
            {isAnalyzing ? 'Analyzing...' : '🤖 AI Analysis'}
          </button>
          {!isAdding && (
            <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
              + Add Event
            </button>
          )}
        </div>
      </div>

      {isAnalyzing && (
        <div className="ai-analysis-progress">
          <div className="progress-info">
            <span>AI is analyzing {documents.length} documents for chronology events...</span>
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
        <form className="chronology-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Event Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              required
              placeholder="Describe what happened on this date..."
            />
          </div>

          <div className="form-group">
            <label>Significance</label>
            <textarea
              value={formData.significance}
              onChange={(e) => setFormData({ ...formData, significance: e.target.value })}
              rows={2}
              placeholder="Why is this event important to the case?"
            />
          </div>

          <div className="form-group">
            <label>Document Reference</label>
            <select
              value={formData.documentRef}
              onChange={(e) => setFormData({ ...formData, documentRef: e.target.value })}
            >
              <option value="">Select document (optional)</option>
              {documents.map(doc => (
                <option key={doc.id} value={doc.id}>{doc.title}</option>
              ))}
            </select>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editingEvent ? 'Update' : 'Add'} Event
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="chronology-timeline">
        {events.length === 0 ? (
          <div className="empty-state">
            <p>No chronology events yet.</p>
            <p>Use AI Analysis to extract events from your documents, or add them manually.</p>
          </div>
        ) : (
          <div className="timeline">
            {events.map((event) => (
              <div key={event.id} className="timeline-item">
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <div className="event-header">
                    <h4 className="event-date">{formatDate(event.date)}</h4>
                    <div className="event-actions">
                      <button className="btn btn-sm" onClick={() => handleEdit(event)}>
                        Edit
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(event.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="event-description">{event.description}</p>
                  {event.significance && (
                    <p className="event-significance">
                      <strong>Significance:</strong> {event.significance}
                    </p>
                  )}
                  {event.documentRef && (
                    <p className="event-document">
                      <strong>Source:</strong> {
                        documents.find(d => d.id === event.documentRef)?.title || 'Unknown document'
                      }
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};