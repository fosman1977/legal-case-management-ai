import React, { useState, useEffect } from 'react';
import { ChronologyEvent } from '../types';
import { storage } from '../utils/storage';

interface ChronologyManagerProps {
  caseId: string;
}

export const ChronologyManager: React.FC<ChronologyManagerProps> = ({ caseId }) => {
  const [events, setEvents] = useState<ChronologyEvent[]>([]);
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
  }, [caseId]);

  const loadEvents = () => {
    const chronEvents = storage.getChronology(caseId);
    setEvents(chronEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
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
    if (window.confirm('Are you sure you want to delete this event?')) {
      storage.deleteChronologyEvent(eventId);
      loadEvents();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="chronology-manager">
      <div className="manager-header">
        <h3>Case Chronology</h3>
        {!isAdding && (
          <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
            + Add Event
          </button>
        )}
      </div>

      {isAdding && (
        <form className="chronology-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="form-group flex-grow">
              <label>Document Reference</label>
              <input
                type="text"
                value={formData.documentRef}
                onChange={(e) => setFormData({ ...formData, documentRef: e.target.value })}
                placeholder="e.g., Contract p.3, Email dated 1/1/24"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Event Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              placeholder="What happened on this date?"
            />
          </div>

          <div className="form-group">
            <label>Legal Significance</label>
            <textarea
              value={formData.significance}
              onChange={(e) => setFormData({ ...formData, significance: e.target.value })}
              rows={2}
              required
              placeholder="Why is this event important to your case?"
            />
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
          <p className="empty-state">No events in chronology yet.</p>
        ) : (
          events.map(event => (
            <div key={event.id} className="chronology-event">
              <div className="event-date">{formatDate(event.date)}</div>
              <div className="event-content">
                <h4>{event.description}</h4>
                <p className="event-significance">{event.significance}</p>
                {event.documentRef && (
                  <p className="event-doc-ref">📄 {event.documentRef}</p>
                )}
              </div>
              <div className="event-actions">
                <button className="btn btn-sm" onClick={() => handleEdit(event)}>
                  Edit
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(event.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};