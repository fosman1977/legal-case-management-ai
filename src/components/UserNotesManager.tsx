import React, { useState, useEffect } from 'react';
import { useAISync } from '../hooks/useAISync';
import { aiDocumentProcessor } from '../utils/aiDocumentProcessor';

interface UserNote {
  id: string;
  caseId: string;
  title: string;
  type: 'note' | 'memo' | 'meeting' | 'audio' | 'video' | 'working-paper';
  content: string;
  transcript?: string; // For audio/video files
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  tags: string[];
  isConfidential: boolean;
  createdAt: string;
  updatedAt: string;
  duration?: number; // For audio/video in seconds
}

interface UserNotesManagerProps {
  caseId: string;
}

export const UserNotesManager: React.FC<UserNotesManagerProps> = ({ caseId }) => {
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingNote, setEditingNote] = useState<UserNote | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  const [filter, setFilter] = useState<'all' | 'notes' | 'meetings' | 'media'>('all');
  
  // AI Synchronization
  const { publishAIResults } = useAISync(caseId, 'UserNotesManager');
  
  const [formData, setFormData] = useState<Partial<UserNote>>({
    title: '',
    type: 'note',
    content: '',
    tags: [],
    isConfidential: false
  });

  useEffect(() => {
    loadNotes();
  }, [caseId]);

  const loadNotes = () => {
    const storageKey = `user_notes_${caseId}`;
    const data = localStorage.getItem(storageKey);
    setNotes(data ? JSON.parse(data) : []);
  };

  const saveNotes = (newNotes: UserNote[]) => {
    const storageKey = `user_notes_${caseId}`;
    localStorage.setItem(storageKey, JSON.stringify(newNotes));
    setNotes(newNotes);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    
    // Auto-populate title and type based on file
    const fileType = file.type;
    let noteType: UserNote['type'] = 'working-paper';
    
    if (fileType.startsWith('audio/')) {
      noteType = 'audio';
    } else if (fileType.startsWith('video/')) {
      noteType = 'video';
    }
    
    setFormData(prev => ({
      ...prev,
      title: prev.title || file.name.replace(/\.[^.]+$/, ''),
      type: noteType,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    }));

    // For audio/video files, attempt transcription
    if (fileType.startsWith('audio/') || fileType.startsWith('video/')) {
      await handleTranscription(file);
    }
  };

  const handleTranscription = async (file: File) => {
    setIsTranscribing(true);
    setTranscriptionProgress(0);
    
    try {
      // Simulate transcription progress (in real implementation, would use Web Speech API or external service)
      for (let i = 0; i <= 100; i += 10) {
        setTranscriptionProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Mock transcription result
      const mockTranscript = `[TRANSCRIPTION PLACEHOLDER]

This is a placeholder for audio/video transcription.

File: ${file.name}
Duration: ${Math.round(file.size / 1000 / 60)} minutes (estimated)
Type: ${file.type}

To implement real transcription, integrate with:
- Web Speech API (for live recording)
- AssemblyAI or Rev.ai (for file transcription)
- OpenAI Whisper (local transcription)

The transcribed content would appear here and be processed by AI for entity extraction.`;
      
      setFormData(prev => ({
        ...prev,
        transcript: mockTranscript,
        content: prev.content || `Meeting recording: ${file.name}\n\nTranscript available below.`,
        duration: Math.round(file.size / 1000) // Rough estimate
      }));
      
    } catch (error) {
      console.error('Transcription failed:', error);
      setFormData(prev => ({
        ...prev,
        transcript: `[TRANSCRIPTION FAILED]\n\nUnable to transcribe ${file.name}. Please add manual notes about this recording.`
      }));
    } finally {
      setIsTranscribing(false);
      setTranscriptionProgress(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const noteId = editingNote?.id || `note_${Date.now()}`;
    const now = new Date().toISOString();
    
    const note: UserNote = {
      ...formData,
      id: noteId,
      caseId,
      createdAt: editingNote?.createdAt || now,
      updatedAt: now
    } as UserNote;

    const updatedNotes = editingNote
      ? notes.map(n => n.id === editingNote.id ? note : n)
      : [...notes, note];
    
    saveNotes(updatedNotes);
    
    // Extract entities for AI sync if there's meaningful content
    const contentForAI = note.transcript || note.content;
    if (contentForAI && contentForAI.length > 100) {
      try {
        const entities = await aiDocumentProcessor.extractEntitiesForSync(
          contentForAI,
          note.title,
          'User Note'
        );
        
        // Mark as user-generated content
        const userGeneratedEntities = {
          persons: entities.persons.map(p => ({ ...p, source: 'user-generated', isUserContent: true })),
          issues: entities.issues.map(i => ({ ...i, source: 'user-generated', isUserContent: true })),
          chronologyEvents: entities.chronologyEvents.map(c => ({ ...c, source: 'user-generated', isUserContent: true })),
          authorities: entities.authorities.map(a => ({ ...a, source: 'user-generated', isUserContent: true }))
        };
        
        await publishAIResults(note.title, userGeneratedEntities, 0.6);
        
        console.log('🤖 AI entities extracted from user note:', {
          title: note.title,
          persons: entities.persons.length,
          issues: entities.issues.length,
          chronology: entities.chronologyEvents.length,
          authorities: entities.authorities.length,
          markedAsUserGenerated: true
        });
        
      } catch (error) {
        console.error('Failed to extract entities from user note:', error);
      }
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'note',
      content: '',
      tags: [],
      isConfidential: false
    });
    setSelectedFile(null);
    setIsAdding(false);
    setEditingNote(null);
  };

  const handleEdit = (note: UserNote) => {
    setEditingNote(note);
    setFormData(note);
    setIsAdding(true);
  };

  const handleDelete = (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      const updatedNotes = notes.filter(n => n.id !== noteId);
      saveNotes(updatedNotes);
    }
  };

  const addTag = (tag: string) => {
    if (tag && !formData.tags?.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag]
      }));
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag) || []
    }));
  };

  const getFilteredNotes = () => {
    switch (filter) {
      case 'notes':
        return notes.filter(n => ['note', 'memo', 'working-paper'].includes(n.type));
      case 'meetings':
        return notes.filter(n => n.type === 'meeting');
      case 'media':
        return notes.filter(n => ['audio', 'video'].includes(n.type));
      default:
        return notes;
    }
  };

  const getTypeIcon = (type: UserNote['type']) => {
    switch (type) {
      case 'note': return '📝';
      case 'memo': return '📋';
      case 'meeting': return '🤝';
      case 'audio': return '🎵';
      case 'video': return '🎥';
      case 'working-paper': return '📄';
      default: return '📝';
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="user-notes-manager">
      <div className="manager-header">
        <div>
          <h3>📝 User Notes & Working Papers</h3>
          <p>Personal notes, memos, client meetings, and working papers. Content is marked as user-generated for AI processing.</p>
        </div>
        <div className="header-actions">
          {!isAdding && (
            <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
              + Add Note
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      {!isAdding && (
        <div className="filter-bar">
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({notes.length})
            </button>
            <button 
              className={`filter-btn ${filter === 'notes' ? 'active' : ''}`}
              onClick={() => setFilter('notes')}
            >
              📝 Notes & Memos ({notes.filter(n => ['note', 'memo', 'working-paper'].includes(n.type)).length})
            </button>
            <button 
              className={`filter-btn ${filter === 'meetings' ? 'active' : ''}`}
              onClick={() => setFilter('meetings')}
            >
              🤝 Meetings ({notes.filter(n => n.type === 'meeting').length})
            </button>
            <button 
              className={`filter-btn ${filter === 'media' ? 'active' : ''}`}
              onClick={() => setFilter('media')}
            >
              🎵 Audio/Video ({notes.filter(n => ['audio', 'video'].includes(n.type)).length})
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {isAdding && (
        <form className="note-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Note title..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as UserNote['type'] })}
              >
                <option value="note">📝 Note</option>
                <option value="memo">📋 Memo</option>
                <option value="meeting">🤝 Client Meeting</option>
                <option value="working-paper">📄 Working Paper</option>
                <option value="audio">🎵 Audio Recording</option>
                <option value="video">🎥 Video Recording</option>
              </select>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.isConfidential}
                  onChange={(e) => setFormData({ ...formData, isConfidential: e.target.checked })}
                />
                Confidential
              </label>
            </div>
          </div>

          {/* File Upload */}
          <div className="form-group">
            <label>Upload File (Optional)</label>
            <input
              type="file"
              accept=".txt,.pdf,.doc,.docx,.mp3,.wav,.mp4,.mov,.avi"
              onChange={handleFileChange}
              className="file-input"
            />
            {selectedFile && (
              <div className="file-info">
                <small>Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)}KB)</small>
              </div>
            )}
          </div>

          {/* Transcription Progress */}
          {isTranscribing && (
            <div className="transcription-progress">
              <div className="progress-header">
                <h4>🎵 Transcribing Audio/Video</h4>
                <p>Converting speech to text...</p>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill ai-progress"
                  style={{ width: `${transcriptionProgress}%` }}
                />
              </div>
              <small>Progress: {transcriptionProgress}%</small>
            </div>
          )}

          {/* Main Content */}
          <div className="form-group">
            <label>Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={8}
              required
              placeholder="Enter your notes, observations, or meeting summary..."
            />
          </div>

          {/* Transcript (for audio/video) */}
          {formData.transcript && (
            <div className="form-group">
              <label>Transcript</label>
              <textarea
                value={formData.transcript}
                onChange={(e) => setFormData({ ...formData, transcript: e.target.value })}
                rows={10}
                placeholder="Transcript will appear here..."
              />
            </div>
          )}

          {/* Tags */}
          <div className="form-group">
            <label>Tags</label>
            <div className="tags-input">
              <div className="tags-list">
                {formData.tags?.map(tag => (
                  <span key={tag} className="tag">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)}>×</button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add tag and press Enter"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editingNote ? 'Update' : 'Save'} Note
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Notes List */}
      {!isAdding && (
        <div className="notes-list">
          {getFilteredNotes().length === 0 ? (
            <div className="empty-state">
              <p>No {filter === 'all' ? '' : filter} notes yet. Click "Add Note" to get started.</p>
            </div>
          ) : (
            getFilteredNotes().map(note => (
              <div key={note.id} className={`note-card ${note.isConfidential ? 'confidential' : ''}`}>
                <div className="note-header">
                  <div className="note-info">
                    <h4>
                      {getTypeIcon(note.type)} {note.title}
                      {note.isConfidential && <span className="confidential-badge">🔒 Confidential</span>}
                    </h4>
                    <div className="note-meta">
                      <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                      {note.duration && <span>• {formatDuration(note.duration)}</span>}
                      {note.fileName && <span>• {note.fileName}</span>}
                    </div>
                  </div>
                  <div className="note-actions">
                    <button className="btn btn-sm" onClick={() => handleEdit(note)}>
                      Edit
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(note.id)}>
                      Delete
                    </button>
                  </div>
                </div>

                <div className="note-content">
                  <p>{note.content}</p>
                  {note.transcript && (
                    <details className="transcript-section">
                      <summary>📄 View Transcript</summary>
                      <pre className="transcript-content">{note.transcript}</pre>
                    </details>
                  )}
                </div>

                {note.tags.length > 0 && (
                  <div className="note-tags">
                    {note.tags.map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};