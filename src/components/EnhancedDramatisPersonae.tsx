import React, { useState, useEffect, useRef } from 'react';
import { Person, PersonRelationship, CaseDocument } from '../types';
import { storage } from '../utils/storage';
import { indexedDBManager } from '../utils/indexedDB';
import { useAISync, useAIUpdates } from '../hooks/useAISync';

interface EnhancedDramatisPersonaeProps {
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

export const EnhancedDramatisPersonae: React.FC<EnhancedDramatisPersonaeProps> = ({ caseId }) => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'network' | 'table'>('grid');
  
  // AI Synchronization
  const { publishAIResults } = useAISync(caseId, 'EnhancedDramatisPersonae');
  const { updateCount } = useAIUpdates(caseId, 'ai-persons-updated');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isAddingRelationship, setIsAddingRelationship] = useState(false);
  const [filter, setFilter] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const networkRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState<Partial<Person>>({
    name: '',
    role: 'other',
    description: '',
    relevance: '',
    contactInfo: '',
    organization: '',
    email: '',
    phone: '',
    documentRefs: [],
    relationships: []
  });

  const [relationshipForm, setRelationshipForm] = useState<{
    targetPersonId: string;
    type: PersonRelationship['type'];
    description: string;
  }>({
    targetPersonId: '',
    type: 'other',
    description: ''
  });

  useEffect(() => {
    loadPersons();
    loadDocuments();
  }, [caseId]);

  // Reload persons when AI updates occur
  useEffect(() => {
    if (updateCount > 0) {
      loadPersons();
      console.log('👥 Persons reloaded due to AI update');
    }
  }, [updateCount]);

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
      
      // Mock AI analysis result for now - replace with actual implementation
      const result = {
        persons: [
          {
            name: 'Example Person',
            role: 'witness',
            description: 'Auto-detected from documents',
            relevance: 'Key witness mentioned in multiple documents',
            documentRefs: []
          }
        ]
      };
      
      // Simulate progress
      for (let i = 0; i <= 100; i += 10) {
        setAnalysisProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (result.persons && result.persons.length > 0) {
        const newPersons = result.persons.map((p: any) => ({
          ...p,
          id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
          caseId,
          relationships: []
        }));
        
        const existingNames = new Set(persons.map(p => p.name.toLowerCase()));
        const uniqueNewPersons = newPersons.filter(p => !existingNames.has(p.name.toLowerCase()));
        
        if (uniqueNewPersons.length > 0) {
          savePersons([...persons, ...uniqueNewPersons]);
          alert(`Successfully identified ${uniqueNewPersons.length} new persons!`);
        } else {
          alert('No new persons found in the documents.');
        }
      } else {
        alert('No persons could be identified from the documents.');
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
    
    const person: Person = {
      ...formData as Person,
      id: editingPerson?.id || Date.now().toString() + Math.random().toString(36).substring(2, 11),
      caseId,
      relationships: formData.relationships || []
    };

    if (editingPerson) {
      const updated = persons.map(p => p.id === person.id ? person : p);
      savePersons(updated);
    } else {
      savePersons([...persons, person]);
    }

    resetForm();
  };

  const handleAddRelationship = () => {
    if (!selectedPerson || !relationshipForm.targetPersonId) return;

    const newRelationship: PersonRelationship = {
      targetPersonId: relationshipForm.targetPersonId,
      type: relationshipForm.type,
      description: relationshipForm.description
    };

    const updated = persons.map(p => {
      if (p.id === selectedPerson.id) {
        return {
          ...p,
          relationships: [...(p.relationships || []), newRelationship]
        };
      }
      return p;
    });

    savePersons(updated);
    setSelectedPerson(updated.find(p => p.id === selectedPerson.id) || null);
    setRelationshipForm({ targetPersonId: '', type: 'other', description: '' });
    setIsAddingRelationship(false);
  };

  const handleDeleteRelationship = (personId: string, targetId: string) => {
    const updated = persons.map(p => {
      if (p.id === personId) {
        return {
          ...p,
          relationships: (p.relationships || []).filter(r => r.targetPersonId !== targetId)
        };
      }
      return p;
    });
    savePersons(updated);
    setSelectedPerson(updated.find(p => p.id === personId) || null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      role: 'other',
      description: '',
      relevance: '',
      contactInfo: '',
      organization: '',
      email: '',
      phone: '',
      documentRefs: [],
      relationships: []
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

  const getRelationshipTypeLabel = (type: PersonRelationship['type']) => {
    const labels = {
      represents: 'Represents',
      opposing_counsel: 'Opposing Counsel',
      witness_for: 'Witness For',
      expert_for: 'Expert For',
      employed_by: 'Employed By',
      related_to: 'Related To',
      reports_to: 'Reports To',
      colleague_of: 'Colleague Of',
      adverse_to: 'Adverse To',
      other: 'Other'
    };
    return labels[type];
  };

  const getRelationshipColor = (type: PersonRelationship['type']) => {
    const colors = {
      represents: '#1976d2',
      opposing_counsel: '#d32f2f',
      witness_for: '#388e3c',
      expert_for: '#f57c00',
      employed_by: '#7b1fa2',
      related_to: '#ff6f00',
      reports_to: '#5d4037',
      colleague_of: '#00897b',
      adverse_to: '#c62828',
      other: '#616161'
    };
    return colors[type];
  };

  const filteredPersons = persons.filter(person => {
    const matchesFilter = !filter || 
      person.name.toLowerCase().includes(filter.toLowerCase()) ||
      person.description.toLowerCase().includes(filter.toLowerCase()) ||
      person.organization?.toLowerCase().includes(filter.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || person.role === selectedRole;
    
    return matchesFilter && matchesRole;
  });

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

  const exportToCSV = () => {
    const headers = ['Name', 'Role', 'Organization', 'Description', 'Relevance', 'Email', 'Phone', 'Contact Info'];
    
    const rows = persons.map(person => {
      const escapeCSV = (field: string) => {
        if (field.includes(',') || field.includes('"') || field.includes('\n')) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      };
      
      return [
        escapeCSV(person.name),
        getRoleLabel(person.role),
        escapeCSV(person.organization || ''),
        escapeCSV(person.description),
        escapeCSV(person.relevance),
        person.email || '',
        person.phone || '',
        escapeCSV(person.contactInfo || '')
      ].join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `persons_${caseId}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const buildNetworkData = (): { nodes: NetworkNode[], edges: NetworkEdge[] } => {
    const nodes: NetworkNode[] = persons.map(person => ({
      id: person.id,
      label: person.name,
      group: person.role,
      title: `${getRoleLabel(person.role)}\n${person.organization || ''}\n${person.description}`,
    }));

    const edges: NetworkEdge[] = [];
    persons.forEach(person => {
      (person.relationships || []).forEach(rel => {
        edges.push({
          from: person.id,
          to: rel.targetPersonId,
          label: getRelationshipTypeLabel(rel.type),
          arrows: 'to',
          color: { color: getRelationshipColor(rel.type) },
          dashes: rel.type === 'adverse_to'
        });
      });
    });

    return { nodes, edges };
  };

  const NetworkView = () => {
    useEffect(() => {
      if (viewMode !== 'network' || !networkRef.current) return;

      // Simple D3-like network visualization
      const { nodes, edges } = buildNetworkData();
      
      // Clear previous content
      networkRef.current.innerHTML = '';
      
      // Create SVG
      const width = networkRef.current.clientWidth;
      const height = 600;
      
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', width.toString());
      svg.setAttribute('height', height.toString());
      svg.style.border = '1px solid #e9ecef';
      svg.style.borderRadius = '8px';
      svg.style.background = '#fafbfc';
      
      // Create groups for edges and nodes
      const edgeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      
      // Position nodes in a circle
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.35;
      
      nodes.forEach((node, i) => {
        const angle = (i / nodes.length) * 2 * Math.PI;
        node.x = centerX + radius * Math.cos(angle);
        node.y = centerY + radius * Math.sin(angle);
      });
      
      // Draw edges
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
          line.setAttribute('strokeWidth', '2');
          if (edge.dashes) {
            line.setAttribute('strokeDasharray', '5,5');
          }
          
          // Add label
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', ((fromNode.x! + toNode.x!) / 2).toString());
          text.setAttribute('y', ((fromNode.y! + toNode.y!) / 2).toString());
          text.setAttribute('textAnchor', 'middle');
          text.setAttribute('fontSize', '10');
          text.setAttribute('fill', '#666');
          text.textContent = edge.label;
          
          edgeGroup.appendChild(line);
          edgeGroup.appendChild(text);
        }
      });
      
      // Draw nodes
      nodes.forEach(node => {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.style.cursor = 'pointer';
        
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', node.x!.toString());
        circle.setAttribute('cy', node.y!.toString());
        circle.setAttribute('r', '30');
        circle.setAttribute('fill', getRoleColor(node.group as Person['role']));
        circle.setAttribute('stroke', '#fff');
        circle.setAttribute('strokeWidth', '3');
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', node.x!.toString());
        text.setAttribute('y', (node.y! + 5).toString());
        text.setAttribute('textAnchor', 'middle');
        text.setAttribute('fontSize', '12');
        text.setAttribute('fill', '#fff');
        text.setAttribute('fontWeight', 'bold');
        text.textContent = node.label.split(' ')[0];
        
        // Add tooltip
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = node.title;
        
        group.appendChild(circle);
        group.appendChild(text);
        group.appendChild(title);
        
        // Click handler
        group.addEventListener('click', () => {
          const person = persons.find(p => p.id === node.id);
          if (person) setSelectedPerson(person);
        });
        
        nodeGroup.appendChild(group);
      });
      
      svg.appendChild(edgeGroup);
      svg.appendChild(nodeGroup);
      networkRef.current.appendChild(svg);
      
    }, [viewMode, persons]);

    return (
      <div className="network-container">
        <div ref={networkRef} className="network-view" />
        {selectedPerson && (
          <div className="person-details-panel">
            <h3>{selectedPerson.name}</h3>
            <span className="role-badge" style={{ background: getRoleColor(selectedPerson.role) }}>
              {getRoleLabel(selectedPerson.role)}
            </span>
            {selectedPerson.organization && <p><strong>Organization:</strong> {selectedPerson.organization}</p>}
            <p><strong>Description:</strong> {selectedPerson.description}</p>
            <p><strong>Relevance:</strong> {selectedPerson.relevance}</p>
            
            <div className="relationships-section">
              <h4>Relationships</h4>
              {(selectedPerson.relationships || []).map(rel => {
                const target = persons.find(p => p.id === rel.targetPersonId);
                return target ? (
                  <div key={rel.targetPersonId} className="relationship-item">
                    <span className="relationship-type">{getRelationshipTypeLabel(rel.type)}</span>
                    <span className="relationship-target">{target.name}</span>
                    {rel.description && <p className="relationship-desc">{rel.description}</p>}
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteRelationship(selectedPerson.id, rel.targetPersonId)}
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
                    value={relationshipForm.targetPersonId}
                    onChange={(e) => setRelationshipForm({ ...relationshipForm, targetPersonId: e.target.value })}
                  >
                    <option value="">Select Person</option>
                    {persons.filter(p => p.id !== selectedPerson.id).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <select
                    value={relationshipForm.type}
                    onChange={(e) => setRelationshipForm({ ...relationshipForm, type: e.target.value as PersonRelationship['type'] })}
                  >
                    <option value="represents">Represents</option>
                    <option value="opposing_counsel">Opposing Counsel</option>
                    <option value="witness_for">Witness For</option>
                    <option value="expert_for">Expert For</option>
                    <option value="employed_by">Employed By</option>
                    <option value="related_to">Related To</option>
                    <option value="reports_to">Reports To</option>
                    <option value="colleague_of">Colleague Of</option>
                    <option value="adverse_to">Adverse To</option>
                    <option value="other">Other</option>
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
              onClick={() => setSelectedPerson(null)}
            >
              Close
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="enhanced-dramatis-personae">
      <div className="header">
        <div className="header-left">
          <h3>👥 Dramatis Personae</h3>
          <div className="view-modes">
            <button 
              className={`view-mode ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              📋 Grid
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
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-secondary"
            onClick={exportToCSV}
            disabled={persons.length === 0}
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
              + Add Person
            </button>
          )}
        </div>
      </div>

      <div className="controls">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search persons..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <select 
          className="role-filter"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="claimant">Claimants</option>
          <option value="defendant">Defendants</option>
          <option value="witness">Witnesses</option>
          <option value="expert">Experts</option>
          <option value="lawyer">Lawyers</option>
          <option value="judge">Judges</option>
          <option value="other">Others</option>
        </select>
      </div>

      {isAnalyzing && (
        <div className="ai-analysis-progress">
          <div className="progress-info">
            <span>🤖 AI is analyzing {documents.length} documents for persons...</span>
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
        <form className="person-form modern" onSubmit={handleSubmit}>
          <h4>{editingPerson ? '✏️ Edit Person' : '➕ Add New Person'}</h4>
          
          <div className="form-row">
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Full name"
              />
            </div>
            <div className="form-group">
              <label>Role *</label>
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
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Organization</label>
              <input
                type="text"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                placeholder="Company, firm, or institution"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+44 20 1234 5678"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              required
              placeholder="Role in the case, background, etc."
            />
          </div>

          <div className="form-group">
            <label>Relevance to Case *</label>
            <textarea
              value={formData.relevance}
              onChange={(e) => setFormData({ ...formData, relevance: e.target.value })}
              rows={2}
              required
              placeholder="Why is this person important to the case?"
            />
          </div>

          <div className="form-group">
            <label>Additional Contact Info</label>
            <textarea
              value={formData.contactInfo}
              onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
              rows={2}
              placeholder="Address, assistant contact, notes, etc."
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
              {editingPerson ? 'Update Person' : 'Add Person'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="content">
        {filteredPersons.length === 0 ? (
          <div className="empty-state">
            <h4>👥 No persons found</h4>
            <p>{filter ? 'Try adjusting your search criteria.' : 'Use AI Analysis to identify persons from documents, or add them manually.'}</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="persons-grid">
            {Object.entries(groupPersonsByRole(filteredPersons)).map(([role, rolePersons]) => (
              <div key={role} className="role-section">
                <h3 className="role-header" style={{ color: getRoleColor(role as Person['role']) }}>
                  {getRoleLabel(role as Person['role'])} ({rolePersons.length})
                </h3>
                <div className="persons-cards">
                  {rolePersons.map(person => (
                    <div key={person.id} className="person-card">
                      <div className="person-header">
                        <h4>{person.name}</h4>
                        <span className="role-badge" style={{ background: getRoleColor(person.role) }}>
                          {getRoleLabel(person.role)}
                        </span>
                      </div>
                      {person.organization && (
                        <p className="organization">🏢 {person.organization}</p>
                      )}
                      <p className="description">{person.description}</p>
                      <p className="relevance"><strong>Relevance:</strong> {person.relevance}</p>
                      
                      {(person.email || person.phone) && (
                        <div className="contact-info">
                          {person.email && <p>📧 {person.email}</p>}
                          {person.phone && <p>📱 {person.phone}</p>}
                        </div>
                      )}
                      
                      {person.relationships && person.relationships.length > 0 && (
                        <div className="relationships-summary">
                          <strong>Relationships:</strong> {person.relationships.length}
                        </div>
                      )}
                      
                      <div className="card-actions">
                        <button className="btn btn-sm" onClick={() => handleEdit(person)}>
                          ✏️ Edit
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(person.id)}>
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === 'network' ? (
          <NetworkView />
        ) : (
          <div className="table-view">
            <table className="persons-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Organization</th>
                  <th>Description</th>
                  <th>Contact</th>
                  <th>Relations</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPersons.map(person => (
                  <tr key={person.id}>
                    <td className="name-cell">{person.name}</td>
                    <td>
                      <span className="role-badge" style={{ background: getRoleColor(person.role) }}>
                        {getRoleLabel(person.role)}
                      </span>
                    </td>
                    <td>{person.organization || '-'}</td>
                    <td className="description-cell">{person.description}</td>
                    <td className="contact-cell">
                      {person.email && <div>📧 {person.email}</div>}
                      {person.phone && <div>📱 {person.phone}</div>}
                    </td>
                    <td>{person.relationships?.length || 0}</td>
                    <td className="actions-cell">
                      <button className="btn btn-sm" onClick={() => handleEdit(person)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(person.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .enhanced-dramatis-personae {
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
        }

        .search-input {
          flex: 1;
          padding: 10px 16px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
        }

        .role-filter {
          padding: 10px 16px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          min-width: 150px;
        }

        .person-form.modern {
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

        .persons-grid {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .role-section {
          margin-bottom: 32px;
        }

        .role-header {
          font-size: 20px;
          margin-bottom: 16px;
        }

        .persons-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .person-card {
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          transition: all 0.3s ease;
        }

        .person-card:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }

        .person-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .person-header h4 {
          margin: 0;
          font-size: 18px;
          color: #212529;
        }

        .role-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          color: white;
          font-weight: 500;
        }

        .organization {
          color: #6c757d;
          font-size: 14px;
          margin: 8px 0;
        }

        .description {
          margin: 12px 0;
          color: #495057;
          line-height: 1.5;
        }

        .relevance {
          margin: 12px 0;
          font-size: 14px;
          color: #6c757d;
        }

        .contact-info {
          margin: 12px 0;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
          font-size: 14px;
        }

        .contact-info p {
          margin: 4px 0;
        }

        .relationships-summary {
          margin: 12px 0;
          padding: 8px 12px;
          background: #e3f2fd;
          border-radius: 6px;
          font-size: 14px;
          color: #1976d2;
        }

        .card-actions {
          display: flex;
          gap: 8px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e9ecef;
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

        .person-details-panel {
          position: absolute;
          top: 20px;
          right: 20px;
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          width: 300px;
          max-height: 560px;
          overflow-y: auto;
        }

        .person-details-panel h3 {
          margin: 0 0 12px 0;
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

        .persons-table {
          width: 100%;
          border-collapse: collapse;
        }

        .persons-table th {
          background: #f8f9fa;
          padding: 16px;
          text-align: left;
          font-weight: 600;
          color: #495057;
          border-bottom: 2px solid #e9ecef;
        }

        .persons-table td {
          padding: 16px;
          border-bottom: 1px solid #e9ecef;
        }

        .persons-table tr:hover {
          background: #f8f9fa;
        }

        .name-cell {
          font-weight: 500;
        }

        .description-cell {
          max-width: 300px;
        }

        .contact-cell {
          font-size: 13px;
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
          
          .persons-cards {
            grid-template-columns: 1fr;
          }
          
          .person-details-panel {
            position: static;
            width: 100%;
            margin-top: 20px;
          }
        }
      `}</style>
    </div>
  );
};