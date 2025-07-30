import React, { useState, useEffect, useRef } from 'react';
import { Issue, IssueRelationship, CaseDocument } from '../types';
import { storage } from '../utils/storage';
import { indexedDBManager } from '../utils/indexedDB';
import { useAISync, useAIUpdates } from '../hooks/useAISync';

interface EnhancedIssuesBuilderProps {
  caseId: string;
}

interface NetworkNode {
  id: string;
  label: string;
  group: string;
  title: string;
  x?: number;
  y?: number;
}

interface NetworkEdge {
  from: string;
  to: string;
  label: string;
  arrows?: string;
  color?: { color: string };
  dashes?: boolean;
}

export const EnhancedIssuesBuilder: React.FC<EnhancedIssuesBuilderProps> = ({ caseId }) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [viewMode, setViewMode] = useState<'kanban' | 'network' | 'table' | 'matrix'>('kanban');
  
  // AI Synchronization
  const { publishAIResults } = useAISync(caseId, 'EnhancedIssuesBuilder');
  const { updateCount } = useAIUpdates(caseId, ['ai-issues-updated']);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isAddingRelationship, setIsAddingRelationship] = useState(false);
  const [filter, setFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [tags, setTags] = useState<string[]>([]);
  const networkRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState<Partial<Issue>>({
    title: '',
    description: '',
    category: 'factual',
    priority: 'medium',
    status: 'unresolved',
    claimantPosition: '',
    defendantPosition: '',
    documentRefs: [],
    relatedIssues: [],
    relationships: [],
    tags: [],
    assignedTo: '',
    dueDate: '',
    notes: '',
    evidenceNeeded: [],
    legalAuthorities: []
  });

  const [relationshipForm, setRelationshipForm] = useState<{
    targetIssueId: string;
    type: IssueRelationship['type'];
    description: string;
  }>({
    targetIssueId: '',
    type: 'related_to',
    description: ''
  });

  useEffect(() => {
    loadIssues();
    loadDocuments();
  }, [caseId]);

  // Reload issues when AI updates occur
  useEffect(() => {
    if (updateCount > 0) {
      loadIssues();
      console.log('📋 Issues reloaded due to AI update');
    }
  }, [updateCount]);

  useEffect(() => {
    // Extract unique tags from all issues
    const allTags = issues.flatMap(issue => issue.tags || []);
    setTags([...new Set(allTags)]);
  }, [issues]);

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

      if (allDocs.length === 0) {
        const localStorageDocs = storage.getDocuments(caseId);
        allDocs.push(...localStorageDocs);
      }

      const uniqueDocs = allDocs.filter((doc, index, self) => 
        index === self.findIndex(d => d.fileName === doc.fileName || d.id === doc.id)
      );

      setDocuments(uniqueDocs);
    } catch (error) {
      console.error('Failed to load documents:', error);
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
    
    const estimateTimeSeconds = documents.length * 8;
    const formatTime = (seconds: number) => {
      if (seconds < 60) return `${seconds}s`;
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    };

    try {
      setEstimatedTime(formatTime(estimateTimeSeconds));
      
      // Mock AI analysis result
      const result = {
        issues: [
          {
            title: 'Breach of Contract',
            description: 'Analysis indicates potential breach of contract terms',
            category: 'legal',
            priority: 'high',
            status: 'unresolved',
            claimantPosition: 'Defendant failed to deliver goods as agreed',
            defendantPosition: '',
            documentRefs: [],
            tags: ['contract', 'breach']
          },
          {
            title: 'Quantum of Damages',
            description: 'Calculation of financial losses',
            category: 'quantum',
            priority: 'medium',
            status: 'disputed',
            claimantPosition: 'Losses amount to £50,000',
            defendantPosition: 'Losses are minimal',
            documentRefs: [],
            tags: ['damages', 'financial']
          }
        ]
      };
      
      // Simulate progress
      for (let i = 0; i <= 100; i += 10) {
        setAnalysisProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (result.issues && result.issues.length > 0) {
        const newIssues = result.issues.map((i: any) => ({
          ...i,
          id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
          caseId,
          relationships: [],
          createdAt: new Date().toISOString()
        }));
        
        const existingTitles = new Set(issues.map(i => i.title.toLowerCase()));
        const uniqueNewIssues = newIssues.filter(i => !existingTitles.has(i.title.toLowerCase()));
        
        if (uniqueNewIssues.length > 0) {
          saveIssues([...issues, ...uniqueNewIssues]);
          alert(`Successfully identified ${uniqueNewIssues.length} new issues!`);
        } else {
          alert('No new issues found in the documents.');
        }
      } else {
        alert('No issues could be identified from the documents.');
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
    
    const now = new Date().toISOString();
    const issue: Issue = {
      ...formData as Issue,
      id: editingIssue?.id || Date.now().toString() + Math.random().toString(36).substring(2, 11),
      caseId,
      relationships: formData.relationships || [],
      createdAt: editingIssue?.createdAt || now,
      updatedAt: now
    };

    if (editingIssue) {
      const updated = issues.map(i => i.id === issue.id ? issue : i);
      saveIssues(updated);
    } else {
      saveIssues([...issues, issue]);
    }

    resetForm();
  };

  const handleAddRelationship = () => {
    if (!selectedIssue || !relationshipForm.targetIssueId) return;

    const newRelationship: IssueRelationship = {
      targetIssueId: relationshipForm.targetIssueId,
      type: relationshipForm.type,
      description: relationshipForm.description
    };

    const updated = issues.map(i => {
      if (i.id === selectedIssue.id) {
        return {
          ...i,
          relationships: [...(i.relationships || []), newRelationship],
          updatedAt: new Date().toISOString()
        };
      }
      return i;
    });

    saveIssues(updated);
    setSelectedIssue(updated.find(i => i.id === selectedIssue.id) || null);
    setRelationshipForm({ targetIssueId: '', type: 'related_to', description: '' });
    setIsAddingRelationship(false);
  };

  const handleDeleteRelationship = (issueId: string, targetId: string) => {
    const updated = issues.map(i => {
      if (i.id === issueId) {
        return {
          ...i,
          relationships: (i.relationships || []).filter(r => r.targetIssueId !== targetId),
          updatedAt: new Date().toISOString()
        };
      }
      return i;
    });
    saveIssues(updated);
    setSelectedIssue(updated.find(i => i.id === issueId) || null);
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
      relatedIssues: [],
      relationships: [],
      tags: [],
      assignedTo: '',
      dueDate: '',
      notes: '',
      evidenceNeeded: [],
      legalAuthorities: []
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
      // Also remove this issue from relationships of other issues
      const cleanedUp = updated.map(i => ({
        ...i,
        relationships: (i.relationships || []).filter(r => r.targetIssueId !== issueId)
      }));
      saveIssues(cleanedUp);
    }
  };

  const handleStatusChange = (issueId: string, newStatus: Issue['status']) => {
    const updated = issues.map(i => 
      i.id === issueId 
        ? { ...i, status: newStatus, updatedAt: new Date().toISOString() }
        : i
    );
    saveIssues(updated);
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

  const getRelationshipTypeLabel = (type: IssueRelationship['type']) => {
    const labels = {
      depends_on: 'Depends On',
      blocks: 'Blocks',
      related_to: 'Related To',
      contradicts: 'Contradicts',
      supports: 'Supports',
      sub_issue_of: 'Sub-issue Of',
      parent_of: 'Parent Of'
    };
    return labels[type];
  };

  const getRelationshipColor = (type: IssueRelationship['type']) => {
    const colors = {
      depends_on: '#f57c00',
      blocks: '#d32f2f',
      related_to: '#1976d2',
      contradicts: '#c62828',
      supports: '#388e3c',
      sub_issue_of: '#7b1fa2',
      parent_of: '#00695c'
    };
    return colors[type];
  };

  const filteredIssues = issues.filter(issue => {
    const matchesFilter = !filter || 
      issue.title.toLowerCase().includes(filter.toLowerCase()) ||
      issue.description.toLowerCase().includes(filter.toLowerCase()) ||
      (issue.tags || []).some(tag => tag.toLowerCase().includes(filter.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || issue.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || issue.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || issue.priority === selectedPriority;
    
    return matchesFilter && matchesCategory && matchesStatus && matchesPriority;
  });

  const groupIssuesByStatus = (issues: Issue[]) => {
    return issues.reduce((groups, issue) => {
      const status = issue.status;
      if (!groups[status]) {
        groups[status] = [];
      }
      groups[status].push(issue);
      return groups;
    }, {} as Record<string, Issue[]>);
  };

  const exportToCSV = () => {
    const headers = [
      'Title', 'Category', 'Priority', 'Status', 'Description', 
      'Claimant Position', 'Defendant Position', 'Tags', 'Assigned To', 
      'Due Date', 'Created', 'Updated'
    ];
    
    const rows = issues.map(issue => {
      const escapeCSV = (field: string) => {
        if (field.includes(',') || field.includes('"') || field.includes('\n')) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      };
      
      return [
        escapeCSV(issue.title),
        getCategoryLabel(issue.category),
        getPriorityLabel(issue.priority),
        getStatusLabel(issue.status),
        escapeCSV(issue.description),
        escapeCSV(issue.claimantPosition || ''),
        escapeCSV(issue.defendantPosition || ''),
        escapeCSV((issue.tags || []).join(', ')),
        issue.assignedTo || '',
        issue.dueDate || '',
        issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : '',
        issue.updatedAt ? new Date(issue.updatedAt).toLocaleDateString() : ''
      ].join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `issues_${caseId}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const buildNetworkData = (): { nodes: NetworkNode[], edges: NetworkEdge[] } => {
    const nodes: NetworkNode[] = issues.map(issue => ({
      id: issue.id,
      label: issue.title.length > 30 ? issue.title.substring(0, 30) + '...' : issue.title,
      group: issue.category,
      title: `${issue.title}\nCategory: ${getCategoryLabel(issue.category)}\nStatus: ${getStatusLabel(issue.status)}\nPriority: ${getPriorityLabel(issue.priority)}`,
    }));

    const edges: NetworkEdge[] = [];
    issues.forEach(issue => {
      (issue.relationships || []).forEach(rel => {
        edges.push({
          from: issue.id,
          to: rel.targetIssueId,
          label: getRelationshipTypeLabel(rel.type),
          arrows: 'to',
          color: { color: getRelationshipColor(rel.type) },
          dashes: rel.type === 'contradicts'
        });
      });
    });

    return { nodes, edges };
  };

  const NetworkView = () => {
    useEffect(() => {
      if (viewMode !== 'network' || !networkRef.current) return;

      const { nodes, edges } = buildNetworkData();
      
      networkRef.current.innerHTML = '';
      
      const width = networkRef.current.clientWidth;
      const height = 600;
      
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', width.toString());
      svg.setAttribute('height', height.toString());
      svg.style.border = '1px solid #e9ecef';
      svg.style.borderRadius = '8px';
      svg.style.background = '#fafbfc';
      
      const edgeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.35;
      
      nodes.forEach((node, i) => {
        const angle = (i / nodes.length) * 2 * Math.PI;
        node.x = centerX + radius * Math.cos(angle);
        node.y = centerY + radius * Math.sin(angle);
      });
      
      edges.forEach(edge => {
        const fromNode = nodes.find(n => n.id === edge.from);
        const toNode = nodes.find(n => n.id === edge.to);
        
        if (fromNode && toNode) {
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', fromNode.x!.toString());
          line.setAttribute('y1', fromNode.y!.toString());
          line.setAttribute('x2', toNode.x!.toString());
          line.setAttribute('y2', toNode.y!.toString());
          line.setAttribute('stroke', edge.color?.color || '#999');
          line.setAttribute('stroke-width', '2');
          if (edge.dashes) {
            line.setAttribute('stroke-dasharray', '5,5');
          }
          
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', ((fromNode.x! + toNode.x!) / 2).toString());
          text.setAttribute('y', ((fromNode.y! + toNode.y!) / 2).toString());
          text.setAttribute('text-anchor', 'middle');
          text.setAttribute('font-size', '10');
          text.setAttribute('fill', '#666');
          text.textContent = edge.label;
          
          edgeGroup.appendChild(line);
          edgeGroup.appendChild(text);
        }
      });
      
      nodes.forEach(node => {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.style.cursor = 'pointer';
        
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', (node.x! - 40).toString());
        rect.setAttribute('y', (node.y! - 15).toString());
        rect.setAttribute('width', '80');
        rect.setAttribute('height', '30');
        rect.setAttribute('fill', getCategoryColor(node.group as Issue['category']));
        rect.setAttribute('stroke', '#fff');
        rect.setAttribute('stroke-width', '2');
        rect.setAttribute('rx', '5');
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', node.x!.toString());
        text.setAttribute('y', (node.y! + 5).toString());
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '11');
        text.setAttribute('fill', '#fff');
        text.setAttribute('font-weight', 'bold');
        text.textContent = node.label;
        
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = node.title;
        
        group.appendChild(rect);
        group.appendChild(text);
        group.appendChild(title);
        
        group.addEventListener('click', () => {
          const issue = issues.find(i => i.id === node.id);
          if (issue) setSelectedIssue(issue);
        });
        
        nodeGroup.appendChild(group);
      });
      
      svg.appendChild(edgeGroup);
      svg.appendChild(nodeGroup);
      networkRef.current.appendChild(svg);
      
    }, [viewMode, issues]);

    return (
      <div className="network-container">
        <div ref={networkRef} className="network-view" />
        {selectedIssue && (
          <div className="issue-details-panel">
            <h3>{selectedIssue.title}</h3>
            <div className="issue-badges">
              <span className="category-badge" style={{ background: getCategoryColor(selectedIssue.category) }}>
                {getCategoryLabel(selectedIssue.category)}
              </span>
              <span className="priority-badge" style={{ background: getPriorityColor(selectedIssue.priority) }}>
                {getPriorityLabel(selectedIssue.priority)}
              </span>
              <span className="status-badge" style={{ background: getStatusColor(selectedIssue.status) }}>
                {getStatusLabel(selectedIssue.status)}  
              </span>
            </div>
            
            <p><strong>Description:</strong> {selectedIssue.description}</p>
            
            {selectedIssue.claimantPosition && (
              <p><strong>Claimant Position:</strong> {selectedIssue.claimantPosition}</p>
            )}
            
            {selectedIssue.defendantPosition && (
              <p><strong>Defendant Position:</strong> {selectedIssue.defendantPosition}</p>
            )}

            {selectedIssue.tags && selectedIssue.tags.length > 0 && (
              <div className="tags-section">
                <strong>Tags:</strong>
                {selectedIssue.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            )}
            
            <div className="relationships-section">
              <h4>Relationships</h4>
              {(selectedIssue.relationships || []).map(rel => {
                const target = issues.find(i => i.id === rel.targetIssueId);
                return target ? (
                  <div key={rel.targetIssueId} className="relationship-item">
                    <span className="relationship-type">{getRelationshipTypeLabel(rel.type)}</span>
                    <span className="relationship-target">{target.title}</span>
                    {rel.description && <p className="relationship-desc">{rel.description}</p>}
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteRelationship(selectedIssue.id, rel.targetIssueId)}
                    >
                      Remove
                    </button>
                  </div>
                ) : null;
              })}
              
              {!isAddingRelationship ? (
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={() => setIsAddingRelationship(true)}
                >
                  + Add Relationship
                </button>
              ) : (
                <div className="add-relationship-form">
                  <select
                    value={relationshipForm.targetIssueId}
                    onChange={(e) => setRelationshipForm({ ...relationshipForm, targetIssueId: e.target.value })}
                  >
                    <option value="">Select Issue</option>
                    {issues.filter(i => i.id !== selectedIssue.id).map(i => (
                      <option key={i.id} value={i.id}>{i.title}</option>
                    ))}
                  </select>
                  <select
                    value={relationshipForm.type}
                    onChange={(e) => setRelationshipForm({ ...relationshipForm, type: e.target.value as IssueRelationship['type'] })}
                  >
                    <option value="depends_on">Depends On</option>
                    <option value="blocks">Blocks</option>
                    <option value="related_to">Related To</option>
                    <option value="contradicts">Contradicts</option>
                    <option value="supports">Supports</option>
                    <option value="sub_issue_of">Sub-issue Of</option>
                    <option value="parent_of">Parent Of</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={relationshipForm.description}
                    onChange={(e) => setRelationshipForm({ ...relationshipForm, description: e.target.value })}
                  />
                  <div className="form-actions">
                    <button className="btn btn-sm btn-primary" onClick={handleAddRelationship}>Add</button>
                    <button className="btn btn-sm btn-secondary" onClick={() => setIsAddingRelationship(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
            
            <button 
              className="btn btn-sm btn-secondary close-btn"
              onClick={() => setSelectedIssue(null)}
            >
              Close
            </button>
          </div>
        )}
      </div>
    );
  };

  const KanbanView = () => {
    const statusGroups = groupIssuesByStatus(filteredIssues);
    const statusOrder: Issue['status'][] = ['unresolved', 'disputed', 'agreed', 'resolved'];

    return (
      <div className="kanban-board">
        {statusOrder.map(status => (
          <div key={status} className="kanban-column">
            <div className="column-header" style={{ borderTop: `4px solid ${getStatusColor(status)}` }}>
              <h3>{getStatusLabel(status)}</h3>
              <span className="issue-count">{statusGroups[status]?.length || 0}</span>
            </div>
            <div className="column-content">
              {(statusGroups[status] || []).map(issue => (
                <div key={issue.id} className="issue-card" draggable>
                  <div className="card-header">
                    <h4>{issue.title}</h4>
                    <div className="card-badges">
                      <span className="priority-badge" style={{ background: getPriorityColor(issue.priority) }}>
                        {getPriorityLabel(issue.priority)}
                      </span>
                      <span className="category-badge" style={{ background: getCategoryColor(issue.category) }}>
                        {getCategoryLabel(issue.category)}
                      </span>
                    </div>
                  </div>
                  <p className="issue-description">{issue.description}</p>
                  
                  {issue.tags && issue.tags.length > 0 && (
                    <div className="issue-tags">
                      {issue.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                      {issue.tags.length > 3 && <span className="tag-more">+{issue.tags.length - 3}</span>}
                    </div>
                  )}
                  
                  {issue.dueDate && (
                    <div className="due-date">
                      📅 {new Date(issue.dueDate).toLocaleDateString()}
                    </div>
                  )}
                  
                  <div className="card-actions">
                    <select
                      value={issue.status}
                      onChange={(e) => handleStatusChange(issue.id, e.target.value as Issue['status'])}
                      className="status-select"
                    >
                      <option value="unresolved">Unresolved</option>
                      <option value="disputed">Disputed</option>
                      <option value="agreed">Agreed</option>
                      <option value="resolved">Resolved</option>
                    </select>
                    <button className="btn btn-sm" onClick={() => handleEdit(issue)}>
                      ✏️ Edit
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(issue.id)}>
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="enhanced-issues-builder">
      <div className="header">
        <div className="header-left">
          <h3>⚖️ Issues in the Case</h3>
          <div className="view-modes">
            <button 
              className={`view-mode ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
            >
              📋 Kanban
            </button>
            <button 
              className={`view-mode ${viewMode === 'network' ? 'active' : ''}`}
              onClick={() => setViewMode('network')}
            >
              🕸️ Network
            </button>
            <button 
              className={`view-mode ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              📊 Table
            </button>
            <button 
              className={`view-mode ${viewMode === 'matrix' ? 'active' : ''}`}
              onClick={() => setViewMode('matrix')}
            >
              🔲 Matrix
            </button>
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-secondary"
            onClick={exportToCSV}
            disabled={issues.length === 0}
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
              + Add Issue
            </button>
          )}
        </div>
      </div>

      <div className="controls">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search issues..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <select 
          className="filter-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="factual">Factual</option>
          <option value="legal">Legal</option>
          <option value="quantum">Quantum</option>
          <option value="procedural">Procedural</option>
        </select>
        <select 
          className="filter-select"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="unresolved">Unresolved</option>
          <option value="disputed">Disputed</option>
          <option value="agreed">Agreed</option>
          <option value="resolved">Resolved</option>
        </select>
        <select 
          className="filter-select"
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
        >
          <option value="all">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>
      </div>

      {isAnalyzing && (
        <div className="ai-analysis-progress">
          <div className="progress-info">
            <span>🤖 AI is analyzing {documents.length} documents for issues...</span>
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
        <form className="issue-form modern" onSubmit={handleSubmit}>
          <h4>{editingIssue ? '✏️ Edit Issue' : '➕ Add New Issue'}</h4>
          
          <div className="form-row">
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Brief title of the issue"
              />
            </div>
            <div className="form-group">
              <label>Category *</label>
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
            <div className="form-group">
              <label>Assigned To</label>
              <input
                type="text"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                placeholder="Person responsible"
              />
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              required
              placeholder="Detailed description of the issue"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Claimant Position</label>
              <textarea
                value={formData.claimantPosition}
                onChange={(e) => setFormData({ ...formData, claimantPosition: e.target.value })}
                rows={3}
                placeholder="What is the claimant's position on this issue?"
              />
            </div>
            <div className="form-group">
              <label>Defendant Position</label>
              <textarea
                value={formData.defendantPosition}
                onChange={(e) => setFormData({ ...formData, defendantPosition: e.target.value })}
                rows={3}
                placeholder="What is the defendant's position on this issue?"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Tags (comma-separated)</label>
            <input
              type="text"
              value={(formData.tags || []).join(', ')}
              onChange={(e) => setFormData({ 
                ...formData, 
                tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
              })}
              placeholder="contract, breach, damages"
            />
          </div>

          <div className="form-group">
            <label>Evidence Needed (comma-separated)</label>
            <input
              type="text"
              value={(formData.evidenceNeeded || []).join(', ')}
              onChange={(e) => setFormData({ 
                ...formData, 
                evidenceNeeded: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
              })}
              placeholder="witness statements, expert reports, contracts"
            />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Additional notes or thoughts about this issue"
            />
          </div>

          <div className="form-group">
            <label>Related Documents</label>
            <select
              multiple
              value={formData.documentRefs}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setFormData({ ...formData, documentRefs: selected });
              }}
              style={{ height: '100px' }}
            >
              {documents.map(doc => (
                <option key={doc.id} value={doc.id}>{doc.title}</option>
              ))}
            </select>
            <small>Hold Ctrl/Cmd to select multiple documents</small>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editingIssue ? 'Update Issue' : 'Add Issue'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="content">
        {filteredIssues.length === 0 ? (
          <div className="empty-state">
            <h4>⚖️ No issues found</h4>
            <p>{filter ? 'Try adjusting your search criteria.' : 'Use AI Analysis to identify issues from documents, or add them manually.'}</p>
          </div>
        ) : viewMode === 'kanban' ? (
          <KanbanView />
        ) : viewMode === 'network' ? (
          <NetworkView />
        ) : viewMode === 'table' ? (
          <div className="table-view">
            <table className="issues-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.map(issue => (
                  <tr key={issue.id}>
                    <td className="title-cell">
                      <strong>{issue.title}</strong>
                      <p className="description-preview">{issue.description.substring(0, 100)}...</p>
                    </td>
                    <td>
                      <span className="category-badge" style={{ background: getCategoryColor(issue.category) }}>
                        {getCategoryLabel(issue.category)}
                      </span>
                    </td>
                    <td>
                      <span className="priority-badge" style={{ background: getPriorityColor(issue.priority) }}>
                        {getPriorityLabel(issue.priority)}
                      </span>
                    </td>
                    <td>
                      <span className="status-badge" style={{ background: getStatusColor(issue.status) }}>
                        {getStatusLabel(issue.status)}
                      </span>
                    </td>
                    <td>{issue.assignedTo || '-'}</td>
                    <td>{issue.dueDate ? new Date(issue.dueDate).toLocaleDateString() : '-'}</td>
                    <td className="actions-cell">
                      <button className="btn btn-sm" onClick={() => handleEdit(issue)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(issue.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="matrix-view">
            <div className="matrix-grid">
              <div className="matrix-header"></div>
              <div className="matrix-header">Factual</div>
              <div className="matrix-header">Legal</div>
              <div className="matrix-header">Quantum</div>
              <div className="matrix-header">Procedural</div>
              
              {(['high', 'medium', 'low'] as Issue['priority'][]).map(priority => (
                <React.Fragment key={priority}>
                  <div className="matrix-row-header" style={{ background: getPriorityColor(priority) }}>
                    {getPriorityLabel(priority)}
                  </div>
                  {(['factual', 'legal', 'quantum', 'procedural'] as Issue['category'][]).map(category => (
                    <div key={`${priority}-${category}`} className="matrix-cell">
                      {filteredIssues
                        .filter(i => i.priority === priority && i.category === category)
                        .map(issue => (
                          <div 
                            key={issue.id} 
                            className="matrix-issue"
                            style={{ background: getStatusColor(issue.status) }}
                            title={issue.title}
                            onClick={() => handleEdit(issue)}
                          >
                            {issue.title.substring(0, 20)}...
                          </div>
                        ))
                      }
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .enhanced-issues-builder {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .header {
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

        .controls {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .search-input {
          flex: 1;
          min-width: 200px;
          padding: 10px 16px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
        }

        .filter-select {
          padding: 10px 16px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          min-width: 150px;
        }

        .issue-form.modern {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
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
        }

        .form-group small {
          display: block;
          margin-top: 4px;
          color: #6c757d;
          font-size: 12px;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .kanban-board {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-top: 20px;
        }

        .kanban-column {
          background: #f8f9fa;
          border-radius: 12px;
          overflow: hidden;
          min-height: 500px;
        }

        .column-header {
          padding: 16px;
          background: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .column-header h3 {
          margin: 0;
          font-size: 16px;
          color: #495057;
        }

        .issue-count {
          background: #6c757d;
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
        }

        .column-content {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .issue-card {
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 16px;
          cursor: grab;
          transition: all 0.3s ease;
        }

        .issue-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .card-header h4 {
          margin: 0;
          font-size: 14px;
          color: #212529;
          flex: 1;
        }

        .card-badges {
          display: flex;
          gap: 4px;
          flex-direction: column;
        }

        .priority-badge,
        .category-badge,
        .status-badge {
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 10px;
          color: white;
          font-weight: 500;
          text-align: center;
        }

        .issue-description {
          font-size: 13px;
          color: #6c757d;
          margin: 8px 0;
          line-height: 1.4;
        }

        .issue-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin: 8px 0;
        }

        .tag {
          background: #e9ecef;
          color: #495057;
          padding: 2px 6px;
          border-radius: 8px;
          font-size: 10px;
        }

        .tag-more {
          background: #6c757d;
          color: white;
          padding: 2px 6px;
          border-radius: 8px;
          font-size: 10px;
        }

        .due-date {
          font-size: 12px;
          color: #f57c00;
          margin: 8px 0;
        }

        .card-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e9ecef;
          align-items: center;
        }

        .status-select {
          flex: 1;
          padding: 4px 8px;
          font-size: 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
        }

        .network-container {
          position: relative;
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .network-view {
          width: 100%;
          height: 600px;
          position: relative;
        }

        .issue-details-panel {
          position: absolute;
          top: 20px;
          right: 20px;
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          width: 320px;
          max-height: 560px;
          overflow-y: auto;
        }

        .issue-details-panel h3 {
          margin: 0 0 12px 0;
        }

        .issue-badges {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .tags-section {
          margin: 12px 0;
        }

        .tags-section .tag {
          margin-right: 4px;
          margin-bottom: 4px;
        }

        .relationships-section {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
        }

        .relationships-section h4 {
          margin: 0 0 12px 0;
          font-size: 16px;
        }

        .relationship-item {
          margin-bottom: 12px;
          padding: 8px;
          background: #f8f9fa;
          border-radius: 6px;
        }

        .relationship-type {
          font-weight: 500;
          color: #495057;
          margin-right: 8px;
        }

        .relationship-target {
          color: #1976d2;
        }

        .relationship-desc {
          margin: 4px 0 8px 0;
          font-size: 12px;
          color: #6c757d;
        }

        .add-relationship-form {
          margin-top: 12px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
        }

        .add-relationship-form select,
        .add-relationship-form input {
          width: 100%;
          margin-bottom: 8px;
          padding: 8px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 14px;
        }

        .close-btn {
          position: absolute;
          top: 20px;
          right: 20px;
        }

        .table-view {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .issues-table {
          width: 100%;
          border-collapse: collapse;
        }

        .issues-table th {
          background: #f8f9fa;
          padding: 16px;
          text-align: left;
          font-weight: 600;
          color: #495057;
          border-bottom: 2px solid #e9ecef;
        }

        .issues-table td {
          padding: 16px;
          border-bottom: 1px solid #e9ecef;
        }

        .issues-table tr:hover {
          background: #f8f9fa;
        }

        .title-cell {
          max-width: 300px;
        }

        .title-cell strong {
          display: block;
          margin-bottom: 4px;
        }

        .description-preview {
          font-size: 13px;
          color: #6c757d;
          margin: 0;
        }

        .actions-cell {
          white-space: nowrap;
        }

        .actions-cell .btn {
          margin-right: 4px;
        }

        .matrix-view {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .matrix-grid {
          display: grid;
          grid-template-columns: 100px repeat(4, 1fr);
          gap: 8px;
        }

        .matrix-header {
          background: #f8f9fa;
          padding: 12px;
          font-weight: 600;
          text-align: center;
          border-radius: 6px;
          color: #495057;
        }

        .matrix-row-header {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
          color: white;
          font-weight: 600;
          border-radius: 6px;
        }

        .matrix-cell {
          border: 1px solid #e9ecef;
          border-radius: 6px;
          padding: 8px;
          min-height: 80px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .matrix-issue {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .matrix-issue:hover {
          transform: scale(1.05);
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

        @media (max-width: 1200px) {
          .kanban-board {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .header {
            flex-direction: column;
            align-items: stretch;
          }
          
          .header-left {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .controls {
            flex-direction: column;
          }
          
          .kanban-board {
            grid-template-columns: 1fr;
          }
          
          .issue-details-panel {
            position: static;
            width: 100%;
            margin-top: 20px;
          }
          
          .matrix-grid {
            grid-template-columns: 80px repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};