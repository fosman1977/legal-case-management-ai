import React, { useState, useEffect } from 'react';
import { Issue, CaseDocument } from '../types';
import { storage } from '../utils/storage';
import { indexedDBManager } from '../utils/indexedDB';
import { aiAnalyzer } from '../utils/aiAnalysis';

interface IssuesBuilderProps {
  caseId: string;
}

export const IssuesBuilder: React.FC<IssuesBuilderProps> = ({ caseId }) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [formData, setFormData] = useState<Partial<Issue>>({
    title: '',
    description: '',
    category: 'factual',
    priority: 'medium',
    status: 'unresolved',
    claimantPosition: '',
    defendantPosition: '',
    documentRefs: [],
    relatedIssues: []
  });

  useEffect(() => {
    loadIssues();
    loadDocuments();
  }, [caseId]);

  const loadIssues = () => {
    const data = localStorage.getItem(`issues_${caseId}`);
    setIssues(data ? JSON.parse(data) : []);
  };

  const saveIssues = (newIssues: Issue[]) => {
    localStorage.setItem(`issues_${caseId}`, JSON.stringify(newIssues));
    setIssues(newIssues);
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
          console.log(`📦 IssuesBuilder: Loaded ${scannedDocuments.length} scanned documents`);
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

      console.log(`📄 IssuesBuilder: Total ${uniqueDocs.length} documents available`);
      setDocuments(uniqueDocs);
    } catch (error) {
      console.error('Failed to load documents for IssuesBuilder:', error);
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

      const newIssues: Issue[] = result.issues.map((issue: any) => ({
        ...issue,
        id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
        caseId
      }));

      const existingIssues = localStorage.getItem(`issues_${caseId}`);
      const current = existingIssues ? JSON.parse(existingIssues) : [];
      
      const merged = [...current, ...newIssues];
      
      saveIssues(merged);
      
      alert(`AI analysis complete! Found ${newIssues.length} issues with ${Math.round(result.confidence * 100)}% confidence.`);
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
    
    const issue: Issue = {
      ...formData,
      id: editingIssue?.id || Date.now().toString(),
      caseId,
    } as Issue;

    const updated = editingIssue 
      ? issues.map(i => i.id === issue.id ? issue : i)
      : [...issues, issue];
    
    saveIssues(updated);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'factual',
      priority: 'medium',
      status: 'unresolved',
      claimantPosition: '',
      defendantPosition: '',
      documentRefs: [],
      relatedIssues: []
    });
    setIsAdding(false);
    setEditingIssue(null);
  };

  const handleEdit = (issue: Issue) => {
    setEditingIssue(issue);
    setFormData(issue);
    setIsAdding(true);
  };

  const handleDelete = (issueId: string) => {
    if (window.confirm('Are you sure you want to delete this issue?')) {
      const updated = issues.filter(i => i.id !== issueId);
      saveIssues(updated);
    }
  };

  const getCategoryLabel = (category: Issue['category']) => {
    const labels = {
      factual: 'Factual',
      legal: 'Legal',
      quantum: 'Quantum',
      procedural: 'Procedural'
    };
    return labels[category];
  };

  const getPriorityLabel = (priority: Issue['priority']) => {
    const labels = {
      high: 'High',
      medium: 'Medium',
      low: 'Low'
    };
    return labels[priority];
  };

  const getStatusLabel = (status: Issue['status']) => {
    const labels = {
      unresolved: 'Unresolved',
      disputed: 'Disputed',
      agreed: 'Agreed',
      resolved: 'Resolved'
    };
    return labels[status];
  };

  const getCategoryColor = (category: Issue['category']) => {
    const colors = {
      factual: '#1976d2',
      legal: '#d32f2f',
      quantum: '#388e3c',
      procedural: '#f57c00'
    };
    return colors[category];
  };

  const getPriorityColor = (priority: Issue['priority']) => {
    const colors = {
      high: '#d32f2f',
      medium: '#f57c00',
      low: '#388e3c'
    };
    return colors[priority];
  };

  const getStatusColor = (status: Issue['status']) => {
    const colors = {
      unresolved: '#f57c00',
      disputed: '#d32f2f',
      agreed: '#388e3c',
      resolved: '#1976d2'
    };
    return colors[status];
  };

  const groupIssuesByCategory = (issues: Issue[]) => {
    return issues.reduce((groups, issue) => {
      const category = issue.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(issue);
      return groups;
    }, {} as Record<string, Issue[]>);
  };

  return (
    <div className="issues-builder">
      <div className="manager-header">
        <h3>Issues in the Case</h3>
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
              + Add Issue
            </button>
          )}
        </div>
      </div>

      {isAnalyzing && (
        <div className="ai-analysis-progress">
          <div className="progress-info">
            <span>AI is analyzing {documents.length} documents for issues...</span>
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
        <form className="issue-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Issue Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Brief title for this issue"
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as Issue['category'] })}
              >
                <option value="factual">Factual</option>
                <option value="legal">Legal</option>
                <option value="quantum">Quantum</option>
                <option value="procedural">Procedural</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Issue['priority'] })}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Issue['status'] })}
              >
                <option value="unresolved">Unresolved</option>
                <option value="disputed">Disputed</option>
                <option value="agreed">Agreed</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              required
              placeholder="Detailed description of the issue..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Claimant's Position</label>
              <textarea
                value={formData.claimantPosition}
                onChange={(e) => setFormData({ ...formData, claimantPosition: e.target.value })}
                rows={2}
                placeholder="What is the claimant's position on this issue?"
              />
            </div>
            <div className="form-group">
              <label>Defendant's Position</label>
              <textarea
                value={formData.defendantPosition}
                onChange={(e) => setFormData({ ...formData, defendantPosition: e.target.value })}
                rows={2}
                placeholder="What is the defendant's position on this issue?"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editingIssue ? 'Update' : 'Add'} Issue
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="issues-list">
        {issues.length === 0 ? (
          <div className="empty-state">
            <p>No issues identified yet.</p>
            <p>Use AI Analysis to extract issues from your documents, or add them manually.</p>
          </div>
        ) : (
          Object.entries(groupIssuesByCategory(issues)).map(([category, categoryIssues]) => (
            <div key={category} className="category-group">
              <h4 className="category-header" style={{ color: getCategoryColor(category as Issue['category']) }}>
                {getCategoryLabel(category as Issue['category'])} Issues ({categoryIssues.length})
              </h4>
              <div className="category-issues">
                {categoryIssues.map(issue => (
                  <div key={issue.id} className="issue-card">
                    <div className="issue-header">
                      <h5 className="issue-title">{issue.title}</h5>
                      <div className="issue-badges">
                        <span 
                          className="badge priority-badge" 
                          style={{ backgroundColor: getPriorityColor(issue.priority) }}
                        >
                          {getPriorityLabel(issue.priority)}
                        </span>
                        <span 
                          className="badge status-badge" 
                          style={{ backgroundColor: getStatusColor(issue.status) }}
                        >
                          {getStatusLabel(issue.status)}
                        </span>
                      </div>
                      <div className="issue-actions">
                        <button className="btn btn-sm" onClick={() => handleEdit(issue)}>
                          Edit
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(issue.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="issue-description">{issue.description}</p>
                    
                    {(issue.claimantPosition || issue.defendantPosition) && (
                      <div className="positions">
                        {issue.claimantPosition && (
                          <div className="position">
                            <strong>Claimant:</strong> {issue.claimantPosition}
                          </div>
                        )}
                        {issue.defendantPosition && (
                          <div className="position">
                            <strong>Defendant:</strong> {issue.defendantPosition}
                          </div>
                        )}
                      </div>
                    )}

                    {issue.documentRefs.length > 0 && (
                      <div className="issue-documents">
                        <strong>Referenced in:</strong>
                        <ul>
                          {issue.documentRefs.map(docRef => {
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