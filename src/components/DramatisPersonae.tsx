import React, { useState, useEffect } from 'react';
import { Person, CaseDocument } from '../types';
import { storage } from '../utils/storage';
import { indexedDBManager } from '../utils/indexedDB';
import { aiAnalyzer } from '../utils/aiAnalysis';

interface DramatisPersonaeProps {
  caseId: string;
}

export const DramatisPersonae: React.FC<DramatisPersonaeProps> = ({ caseId }) => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [formData, setFormData] = useState<Partial<Person>>({
    name: '',
    role: 'other',
    description: '',
    relevance: '',
    contactInfo: '',
    documentRefs: []
  });

  useEffect(() => {
    loadPersons();
    loadDocuments();
  }, [caseId]);

  const loadPersons = () => {
    const data = localStorage.getItem(`dramatis_personae_${caseId}`);
    setPersons(data ? JSON.parse(data) : []);
  };

  const savePersons = (newPersons: Person[]) => {
    localStorage.setItem(`dramatis_personae_${caseId}`, JSON.stringify(newPersons));
    setPersons(newPersons);
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
          console.log(`📦 DramatisPersonae: Loaded ${scannedDocuments.length} scanned documents`);
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

      console.log(`📄 DramatisPersonae: Total ${uniqueDocs.length} documents available`);
      setDocuments(uniqueDocs);
    } catch (error) {
      console.error('Failed to load documents for DramatisPersonae:', error);
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
        aiAnalyzer.analyzeDocuments(documents, progressCallback),
        timeoutPromise
      ]) as any;
      
      setAnalysisProgress(100);

      const newPersons: Person[] = result.persons.map((person: any) => ({
        ...person,
        id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
        caseId
      }));

      const existingPersons = localStorage.getItem(`dramatis_personae_${caseId}`);
      const current = existingPersons ? JSON.parse(existingPersons) : [];
      
      // Merge persons, avoiding duplicates by name
      const merged = [...current];
      for (const newPerson of newPersons) {
        const existing = merged.find(p => p.name.toLowerCase() === newPerson.name.toLowerCase());
        if (existing) {
          // Merge document references
          existing.documentRefs = [...new Set([...existing.documentRefs, ...newPerson.documentRefs])];
        } else {
          merged.push(newPerson);
        }
      }
      
      savePersons(merged);
      
      alert(`AI analysis complete! Found ${newPersons.length} persons with ${Math.round(result.confidence * 100)}% confidence.`);
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
    
    const person: Person = {
      ...formData,
      id: editingPerson?.id || Date.now().toString(),
      caseId,
    } as Person;

    const updated = editingPerson 
      ? persons.map(p => p.id === person.id ? person : p)
      : [...persons, person];
    
    savePersons(updated);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      role: 'other',
      description: '',
      relevance: '',
      contactInfo: '',
      documentRefs: []
    });
    setIsAdding(false);
    setEditingPerson(null);
  };

  const handleEdit = (person: Person) => {
    setEditingPerson(person);
    setFormData(person);
    setIsAdding(true);
  };

  const handleDelete = (personId: string) => {
    if (window.confirm('Are you sure you want to delete this person?')) {
      const updated = persons.filter(p => p.id !== personId);
      savePersons(updated);
    }
  };

  const getRoleLabel = (role: Person['role']) => {
    const labels = {
      claimant: 'Claimant',
      defendant: 'Defendant',
      witness: 'Witness',
      expert: 'Expert',
      lawyer: 'Lawyer',
      judge: 'Judge',
      other: 'Other'
    };
    return labels[role];
  };

  const getRoleColor = (role: Person['role']) => {
    const colors = {
      claimant: '#1976d2',
      defendant: '#d32f2f',
      witness: '#388e3c',
      expert: '#f57c00',
      lawyer: '#7b1fa2',
      judge: '#5d4037',
      other: '#616161'
    };
    return colors[role];
  };

  const groupPersonsByRole = (persons: Person[]) => {
    return persons.reduce((groups, person) => {
      const role = person.role;
      if (!groups[role]) {
        groups[role] = [];
      }
      groups[role].push(person);
      return groups;
    }, {} as Record<string, Person[]>);
  };

  return (
    <div className="dramatis-personae">
      <div className="manager-header">
        <h3>Dramatis Personae</h3>
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
              + Add Person
            </button>
          )}
        </div>
      </div>

      {isAnalyzing && (
        <div className="ai-analysis-progress">
          <div className="progress-info">
            <span>AI is analyzing {documents.length} documents for persons...</span>
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
        <form className="person-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Full name"
            />
          </div>

          <div className="form-group">
            <label>Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as Person['role'] })}
            >
              <option value="claimant">Claimant</option>
              <option value="defendant">Defendant</option>
              <option value="witness">Witness</option>
              <option value="expert">Expert</option>
              <option value="lawyer">Lawyer</option>
              <option value="judge">Judge</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Brief description of this person's involvement..."
              required
            />
          </div>

          <div className="form-group">
            <label>Relevance to Case</label>
            <textarea
              value={formData.relevance}
              onChange={(e) => setFormData({ ...formData, relevance: e.target.value })}
              rows={2}
              placeholder="Why is this person important to the case?"
            />
          </div>

          <div className="form-group">
            <label>Contact Information</label>
            <input
              type="text"
              value={formData.contactInfo}
              onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
              placeholder="Phone, email, address (optional)"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editingPerson ? 'Update' : 'Add'} Person
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="persons-list">
        {persons.length === 0 ? (
          <div className="empty-state">
            <p>No persons added yet.</p>
            <p>Use AI Analysis to extract persons from your documents, or add them manually.</p>
          </div>
        ) : (
          Object.entries(groupPersonsByRole(persons)).map(([role, rolePersons]) => (
            <div key={role} className="role-group">
              <h4 className="role-header" style={{ color: getRoleColor(role as Person['role']) }}>
                {getRoleLabel(role as Person['role'])} ({rolePersons.length})
              </h4>
              <div className="role-persons">
                {rolePersons.map(person => (
                  <div key={person.id} className="person-card">
                    <div className="person-header">
                      <h5 className="person-name">{person.name}</h5>
                      <div className="person-actions">
                        <button className="btn btn-sm" onClick={() => handleEdit(person)}>
                          Edit
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(person.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="person-description">{person.description}</p>
                    {person.relevance && (
                      <p className="person-relevance">
                        <strong>Relevance:</strong> {person.relevance}
                      </p>
                    )}
                    {person.contactInfo && (
                      <p className="person-contact">
                        <strong>Contact:</strong> {person.contactInfo}
                      </p>
                    )}
                    {person.documentRefs.length > 0 && (
                      <div className="person-documents">
                        <strong>Referenced in:</strong>
                        <ul>
                          {person.documentRefs.map(docRef => {
                            const doc = documents.find(d => d.id === docRef);
                            return (
                              <li key={docRef}>
                                {doc ? doc.title : 'Unknown document'}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};