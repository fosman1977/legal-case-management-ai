import React, { useState, useEffect } from 'react';
import { CaseDocument, Issue } from '../types';
import { storage } from '../utils/storage';
// Removed aiDocumentProcessor - using unifiedAIClient instead
import { unifiedAIClient } from '../utils/unifiedAIClient';

interface PleadingsManagerProps {
  caseId: string;
  caseData: any;
}

interface ExtractedIssue {
  title: string;
  description: string;
  category: 'factual' | 'legal' | 'quantum' | 'procedural';
  claimantPosition?: string;
  defendantPosition?: string;
  sourceDocument: string;
  party: string;
}

interface PartyPleadings {
  partyName: string;
  partyType: 'claimant' | 'defendant';
  partyNumber: number;
  documents: CaseDocument[];
  extractedIssues: ExtractedIssue[];
}

interface ComparativeIssue {
  issue: string;
  category: string;
  claimantPositions: { party: string; position: string; source: string }[];
  defendantPositions: { party: string; position: string; source: string }[];
}

export const PleadingsManager: React.FC<PleadingsManagerProps> = ({ caseId, caseData }) => {
  const [pleadings, setPleadings] = useState<CaseDocument[]>([]);
  const [partyPleadings, setPartyPleadings] = useState<PartyPleadings[]>([]);
  const [comparativeTable, setComparativeTable] = useState<ComparativeIssue[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingDoc, setAnalyzingDoc] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'parties' | 'comparative'>('parties');
  const [expandedParties, setExpandedParties] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPleadings();
  }, [caseId]);

  useEffect(() => {
    if (pleadings.length > 0) {
      organizePleadingsByParty();
    }
  }, [pleadings]);

  const loadPleadings = async () => {
    try {
      // Load all documents
      const allDocs = await storage.getDocumentsAsync(caseId);
      
      // Filter for pleadings (by category or type)
      const pleadingDocs = allDocs.filter(doc => 
        doc.category === 'pleadings' || 
        doc.type === 'particulars' || 
        doc.type === 'defence' || 
        doc.type === 'reply' ||
        doc.tags?.includes('pleading')
      );

      setPleadings(pleadingDocs);
    } catch (error) {
      console.error('Failed to load pleadings:', error);
    }
  };

  const organizePleadingsByParty = () => {
    const parties: PartyPleadings[] = [];
    const claimantDocs: CaseDocument[] = [];
    const defendantDocs: CaseDocument[] = [];
    const unknownDocs: CaseDocument[] = [];

    // Sort documents by party
    pleadings.forEach(doc => {
      const titleLower = doc.title.toLowerCase();
      const contentLower = (doc.content || '').toLowerCase();
      
      if (doc.category === 'claimant' || 
          titleLower.includes('claimant') || 
          titleLower.includes('particulars') ||
          contentLower.includes('the claimant')) {
        claimantDocs.push(doc);
      } else if (doc.category === 'defendant' || 
                 titleLower.includes('defendant') || 
                 titleLower.includes('defence') ||
                 contentLower.includes('the defendant')) {
        defendantDocs.push(doc);
      } else {
        unknownDocs.push(doc);
      }
    });

    // Create party groups
    if (claimantDocs.length > 0) {
      // Check for multiple claimants
      const claimantGroups = groupByPartyNumber(claimantDocs, 'claimant');
      claimantGroups.forEach((docs, index) => {
        parties.push({
          partyName: index === 0 ? caseData.client : `Claimant ${index + 1}`,
          partyType: 'claimant',
          partyNumber: index + 1,
          documents: docs,
          extractedIssues: []
        });
      });
    }

    if (defendantDocs.length > 0) {
      // Check for multiple defendants
      const defendantGroups = groupByPartyNumber(defendantDocs, 'defendant');
      defendantGroups.forEach((docs, index) => {
        parties.push({
          partyName: index === 0 ? caseData.opponent : `Defendant ${index + 1}`,
          partyType: 'defendant',
          partyNumber: index + 1,
          documents: docs,
          extractedIssues: []
        });
      });
    }

    // Add unknown documents to a separate group if any
    if (unknownDocs.length > 0) {
      parties.push({
        partyName: 'Unassigned Pleadings',
        partyType: 'claimant', // Default
        partyNumber: 99,
        documents: unknownDocs,
        extractedIssues: []
      });
    }

    setPartyPleadings(parties);
  };

  const groupByPartyNumber = (docs: CaseDocument[], partyType: string): CaseDocument[][] => {
    // Simple grouping - can be enhanced with more sophisticated party detection
    const groups: CaseDocument[][] = [[]];
    
    docs.forEach(doc => {
      const titleLower = doc.title.toLowerCase();
      // Check for "first", "second", "third" etc. in titles
      if (titleLower.includes('second') || titleLower.includes('2nd')) {
        if (!groups[1]) groups[1] = [];
        groups[1].push(doc);
      } else if (titleLower.includes('third') || titleLower.includes('3rd')) {
        if (!groups[2]) groups[2] = [];
        groups[2].push(doc);
      } else {
        groups[0].push(doc);
      }
    });

    return groups.filter(g => g.length > 0);
  };

  const analyzeDocument = async (doc: CaseDocument, party: PartyPleadings) => {
    if (!doc.fileContent && !doc.content) {
      alert('No content available for analysis');
      return;
    }

    setIsAnalyzing(true);
    setAnalyzingDoc(doc.id);

    try {
      const contentToAnalyze = doc.fileContent || doc.content || '';
      
      // Create a focused prompt for issue extraction
      const prompt = `You are a legal analyst. Extract all legal and factual issues from this pleading document.

Document: ${doc.title}
Party: ${party.partyName} (${party.partyType})
Case: ${caseData.title}

Content (first 5000 chars):
${contentToAnalyze.substring(0, 5000)}

Please identify and extract:
1. Each distinct legal issue raised
2. Each distinct factual issue raised
3. Any quantum (damages/compensation) issues
4. Any procedural issues

For each issue, provide:
- Title: Brief descriptive title
- Description: Clear explanation of the issue
- Category: factual/legal/quantum/procedural
- Party Position: What this party's position is on this issue

Format as a structured list of issues.`;

      // Use AI to extract issues and entities
      const entities = await unifiedAIClient.extractEntities(contentToAnalyze, 'pleading');
      const issueAnalysis = await unifiedAIClient.query(prompt, { temperature: 0.3 });
      
      const response = {
        issues: entities.issues || [],
        persons: entities.persons || [],
        authorities: entities.authorities || [],
        summary: {
          legalIssues: entities.issues.filter(i => i.type === 'legal') || [],
          factualDisputes: entities.issues.filter(i => i.type === 'factual') || [],
          mainPoints: issueAnalysis.content ? [issueAnalysis.content] : []
        },
        confidence: 0.85
      };

      // Parse extracted issues from response
      const extractedIssues: ExtractedIssue[] = [];
      
      // Extract from main points or issues section
      if (response.summary.legalIssues) {
        response.summary.legalIssues.forEach((issue: string) => {
          extractedIssues.push({
            title: issue.substring(0, 100),
            description: issue,
            category: 'legal',
            [party.partyType === 'claimant' ? 'claimantPosition' : 'defendantPosition']: issue,
            sourceDocument: doc.title,
            party: party.partyName
          });
        });
      }

      if (response.summary.factualDisputes) {
        response.summary.factualDisputes.forEach((issue: string) => {
          extractedIssues.push({
            title: issue.substring(0, 100),
            description: issue,
            category: 'factual',
            [party.partyType === 'claimant' ? 'claimantPosition' : 'defendantPosition']: issue,
            sourceDocument: doc.title,
            party: party.partyName
          });
        });
      }

      // Fallback to main points if specific categories not found
      if (extractedIssues.length === 0 && response.summary.mainPoints) {
        response.summary.mainPoints.forEach((point: string, index: number) => {
          const category = point.toLowerCase().includes('law') || point.toLowerCase().includes('legal') ? 'legal' : 'factual';
          extractedIssues.push({
            title: `Issue ${index + 1}: ${point.substring(0, 50)}...`,
            description: point,
            category,
            [party.partyType === 'claimant' ? 'claimantPosition' : 'defendantPosition']: point,
            sourceDocument: doc.title,
            party: party.partyName
          });
        });
      }

      // Update party with extracted issues
      setPartyPleadings(prev => prev.map(p => 
        p.partyName === party.partyName 
          ? { ...p, extractedIssues: [...p.extractedIssues, ...extractedIssues] }
          : p
      ));

      // Add issues to the Issues tab
      await addIssuesToCase(extractedIssues, party);

      // Update comparative table
      updateComparativeTable(extractedIssues);

    } catch (error) {
      console.error('Failed to analyze document:', error);
      alert('Failed to analyze document. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setAnalyzingDoc(null);
    }
  };

  const addIssuesToCase = async (extractedIssues: ExtractedIssue[], party: PartyPleadings) => {
    // Load existing issues
    const existingIssuesData = localStorage.getItem(`issues_${caseId}`);
    const existingIssues: Issue[] = existingIssuesData ? JSON.parse(existingIssuesData) : [];

    // Add new issues that don't already exist
    const newIssues: Issue[] = [];
    
    extractedIssues.forEach(extracted => {
      // Check if issue already exists (by similar title)
      const exists = existingIssues.some(existing => 
        existing.title.toLowerCase().includes(extracted.title.toLowerCase().substring(0, 30)) ||
        extracted.title.toLowerCase().includes(existing.title.toLowerCase().substring(0, 30))
      );

      if (!exists) {
        const newIssue: Issue = {
          id: `issue_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          caseId,
          title: extracted.title,
          description: extracted.description,
          category: extracted.category,
          priority: 'medium',
          status: 'disputed',
          claimantPosition: party.partyType === 'claimant' ? extracted.claimantPosition : '',
          defendantPosition: party.partyType === 'defendant' ? extracted.defendantPosition : '',
          documentRefs: [extracted.sourceDocument],
          relatedIssues: [],
          assignedTo: party.partyName,
          tags: ['from-pleading', party.partyType],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        newIssues.push(newIssue);
      } else {
        // Update existing issue with new position
        const existingIssue = existingIssues.find(i => 
          i.title.toLowerCase().includes(extracted.title.toLowerCase().substring(0, 30))
        );
        if (existingIssue) {
          if (party.partyType === 'claimant' && !existingIssue.claimantPosition) {
            existingIssue.claimantPosition = extracted.claimantPosition;
          } else if (party.partyType === 'defendant' && !existingIssue.defendantPosition) {
            existingIssue.defendantPosition = extracted.defendantPosition;
          }
          existingIssue.documentRefs = [...new Set([...existingIssue.documentRefs, extracted.sourceDocument])];
          existingIssue.updatedAt = new Date().toISOString();
        }
      }
    });

    // Save all issues
    const allIssues = [...existingIssues, ...newIssues];
    localStorage.setItem(`issues_${caseId}`, JSON.stringify(allIssues));
    
    console.log(`Added ${newIssues.length} new issues from pleading analysis`);
  };

  const updateComparativeTable = (newIssues: ExtractedIssue[]) => {
    setComparativeTable(prev => {
      const updated = [...prev];
      
      newIssues.forEach(issue => {
        // Find or create comparative issue
        let compIssue = updated.find(ci => 
          ci.issue.toLowerCase().includes(issue.title.toLowerCase().substring(0, 30)) ||
          issue.title.toLowerCase().includes(ci.issue.toLowerCase().substring(0, 30))
        );

        if (!compIssue) {
          compIssue = {
            issue: issue.title,
            category: issue.category,
            claimantPositions: [],
            defendantPositions: []
          };
          updated.push(compIssue);
        }

        // Add position
        const position = {
          party: issue.party,
          position: issue.description,
          source: issue.sourceDocument
        };

        if (issue.claimantPosition) {
          compIssue.claimantPositions.push(position);
        } else if (issue.defendantPosition) {
          compIssue.defendantPositions.push(position);
        }
      });

      return updated;
    });
  };

  const analyzeAllDocuments = async () => {
    for (const party of partyPleadings) {
      for (const doc of party.documents) {
        await analyzeDocument(doc, party);
        // Add delay to avoid overwhelming the AI
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };

  const togglePartyExpanded = (partyName: string) => {
    setExpandedParties(prev => {
      const newSet = new Set(prev);
      if (newSet.has(partyName)) {
        newSet.delete(partyName);
      } else {
        newSet.add(partyName);
      }
      return newSet;
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'factual': '#2196f3',
      'legal': '#9c27b0',
      'quantum': '#ff9800',
      'procedural': '#4caf50'
    };
    return colors[category] || '#666';
  };

  const renderPartiesView = () => {
    return (
      <div className="parties-view">
        {partyPleadings.map(party => (
          <div key={party.partyName} className="party-section">
            <div 
              className="party-header"
              onClick={() => togglePartyExpanded(party.partyName)}
            >
              <div className="party-info">
                <h3>
                  <span className={`party-type-badge ${party.partyType}`}>
                    {party.partyType.toUpperCase()}
                  </span>
                  {party.partyName}
                </h3>
                <span className="doc-count">{party.documents.length} pleading(s)</span>
              </div>
              <button className="expand-btn">
                {expandedParties.has(party.partyName) ? '▼' : '▶'}
              </button>
            </div>

            {expandedParties.has(party.partyName) && (
              <div className="party-content">
                <div className="documents-section">
                  <h4>📄 Pleading Documents</h4>
                  {party.documents.map(doc => (
                    <div key={doc.id} className="pleading-doc">
                      <div className="doc-header">
                        <div className="doc-info">
                          <h5>{doc.title}</h5>
                          <p className="doc-meta">
                            {doc.type} • {doc.createdAt && new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          className="btn btn-analyze"
                          onClick={() => analyzeDocument(doc, party)}
                          disabled={isAnalyzing}
                        >
                          {analyzingDoc === doc.id ? '🤖 Analyzing...' : '🤖 Analyze Issues'}
                        </button>
                      </div>
                      {doc.content && (
                        <p className="doc-preview">{doc.content.substring(0, 200)}...</p>
                      )}
                    </div>
                  ))}
                </div>

                {party.extractedIssues.length > 0 && (
                  <div className="issues-section">
                    <h4>⚖️ Extracted Issues</h4>
                    <div className="issues-list">
                      {party.extractedIssues.map((issue, index) => (
                        <div key={index} className="extracted-issue">
                          <div className="issue-header">
                            <span 
                              className="issue-category" 
                              style={{ backgroundColor: getCategoryColor(issue.category) }}
                            >
                              {issue.category}
                            </span>
                            <span className="issue-source">📄 {issue.sourceDocument}</span>
                          </div>
                          <h5>{issue.title}</h5>
                          <p>{issue.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderComparativeView = () => {
    return (
      <div className="comparative-view">
        <div className="comparative-header">
          <h3>📊 Comparative Issues Analysis</h3>
          <p>Side-by-side comparison of positions on key issues</p>
        </div>

        {comparativeTable.length === 0 ? (
          <div className="empty-state">
            <p>No issues analyzed yet. Click "Analyze Issues" on pleading documents to extract and compare positions.</p>
          </div>
        ) : (
          <div className="comparative-table">
            <div className="table-header">
              <div className="col-issue">Issue</div>
              <div className="col-claimant">Claimant Position(s)</div>
              <div className="col-defendant">Defendant Position(s)</div>
            </div>
            {comparativeTable.map((issue, index) => (
              <div key={index} className="table-row">
                <div className="col-issue">
                  <span 
                    className="issue-category-badge" 
                    style={{ backgroundColor: getCategoryColor(issue.category) }}
                  >
                    {issue.category}
                  </span>
                  <h5>{issue.issue}</h5>
                </div>
                <div className="col-claimant">
                  {issue.claimantPositions.map((pos, i) => (
                    <div key={i} className="position-entry">
                      <div className="position-party">{pos.party}</div>
                      <p>{pos.position}</p>
                      <span className="position-source">📄 {pos.source}</span>
                    </div>
                  ))}
                  {issue.claimantPositions.length === 0 && (
                    <p className="no-position">No position stated</p>
                  )}
                </div>
                <div className="col-defendant">
                  {issue.defendantPositions.map((pos, i) => (
                    <div key={i} className="position-entry">
                      <div className="position-party">{pos.party}</div>
                      <p>{pos.position}</p>
                      <span className="position-source">📄 {pos.source}</span>
                    </div>
                  ))}
                  {issue.defendantPositions.length === 0 && (
                    <p className="no-position">No position stated</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="pleadings-manager">
      <div className="manager-header">
        <div className="header-info">
          <h3>📋 Pleadings Analysis</h3>
          <p className="pleadings-count">
            {pleadings.length} pleading documents • {comparativeTable.length} issues identified
          </p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-secondary"
            onClick={analyzeAllDocuments}
            disabled={isAnalyzing}
          >
            🤖 Analyze All Pleadings
          </button>
        </div>
      </div>

      <div className="view-controls">
        <button 
          className={`view-btn ${viewMode === 'parties' ? 'active' : ''}`}
          onClick={() => setViewMode('parties')}
        >
          👥 By Party
        </button>
        <button 
          className={`view-btn ${viewMode === 'comparative' ? 'active' : ''}`}
          onClick={() => setViewMode('comparative')}
        >
          📊 Comparative Table
        </button>
      </div>

      <div className="content-area">
        {pleadings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No Pleadings Found</h3>
            <p>Upload documents and tag them as "pleadings" or use categories like "particulars", "defence", or "reply".</p>
          </div>
        ) : (
          <>
            {viewMode === 'parties' && renderPartiesView()}
            {viewMode === 'comparative' && renderComparativeView()}
          </>
        )}
      </div>

      <style>{`
        .pleadings-manager {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .manager-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding: 20px;
          background: linear-gradient(135deg, #3f51b5 0%, #1a237e 100%);
          border-radius: 16px;
          color: white;
        }

        .header-info h3 {
          margin: 0 0 4px 0;
          font-size: 24px;
        }

        .pleadings-count {
          margin: 0;
          opacity: 0.9;
        }

        .view-controls {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          padding: 12px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .view-btn {
          padding: 8px 16px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .view-btn:hover {
          background: #f5f5f5;
        }

        .view-btn.active {
          background: #3f51b5;
          color: white;
          border-color: #3f51b5;
        }

        .content-area {
          min-height: 400px;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }

        .empty-state h3 {
          margin: 0 0 8px 0;
          color: #333;
        }

        .empty-state p {
          margin: 0;
          color: #666;
        }

        /* Parties View */
        .parties-view {
          display: grid;
          gap: 20px;
        }

        .party-section {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .party-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: #f8f9fa;
          cursor: pointer;
          transition: background 0.2s;
        }

        .party-header:hover {
          background: #f0f0f0;
        }

        .party-info h3 {
          margin: 0 0 4px 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .party-type-badge {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 600;
        }

        .party-type-badge.claimant {
          background: #e3f2fd;
          color: #1976d2;
        }

        .party-type-badge.defendant {
          background: #fce4ec;
          color: #c2185b;
        }

        .doc-count {
          font-size: 14px;
          color: #666;
        }

        .expand-btn {
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          color: #666;
          transition: transform 0.2s;
        }

        .party-content {
          padding: 20px;
          border-top: 1px solid #e0e0e0;
        }

        .documents-section {
          margin-bottom: 24px;
        }

        .documents-section h4,
        .issues-section h4 {
          margin: 0 0 16px 0;
          color: #333;
          font-size: 16px;
        }

        .pleading-doc {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
        }

        .doc-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .doc-info h5 {
          margin: 0 0 4px 0;
          color: #333;
        }

        .doc-meta {
          font-size: 12px;
          color: #666;
          margin: 0;
        }

        .doc-preview {
          margin: 8px 0 0 0;
          color: #555;
          font-size: 14px;
          line-height: 1.5;
        }

        .btn-analyze {
          padding: 6px 12px;
          background: #4caf50;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-analyze:hover {
          background: #45a049;
        }

        .btn-analyze:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .issues-list {
          display: grid;
          gap: 12px;
        }

        .extracted-issue {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 12px;
        }

        .issue-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .issue-category {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 12px;
          color: white;
          font-weight: 500;
        }

        .issue-source {
          font-size: 12px;
          color: #666;
        }

        .extracted-issue h5 {
          margin: 0 0 4px 0;
          color: #333;
          font-size: 14px;
        }

        .extracted-issue p {
          margin: 0;
          color: #555;
          font-size: 13px;
          line-height: 1.4;
        }

        /* Comparative View */
        .comparative-view {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          padding: 24px;
        }

        .comparative-header {
          margin-bottom: 24px;
        }

        .comparative-header h3 {
          margin: 0 0 4px 0;
          color: #333;
        }

        .comparative-header p {
          margin: 0;
          color: #666;
        }

        .comparative-table {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          overflow: hidden;
        }

        .table-header {
          display: grid;
          grid-template-columns: 2fr 3fr 3fr;
          gap: 0;
          background: #f5f5f5;
          font-weight: 600;
          color: #333;
        }

        .table-header > div {
          padding: 16px;
          border-right: 1px solid #e0e0e0;
        }

        .table-header > div:last-child {
          border-right: none;
        }

        .table-row {
          display: grid;
          grid-template-columns: 2fr 3fr 3fr;
          gap: 0;
          border-bottom: 1px solid #e0e0e0;
        }

        .table-row:last-child {
          border-bottom: none;
        }

        .table-row > div {
          padding: 16px;
          border-right: 1px solid #e0e0e0;
        }

        .table-row > div:last-child {
          border-right: none;
        }

        .col-issue h5 {
          margin: 8px 0 0 0;
          color: #333;
          font-size: 14px;
          font-weight: 500;
        }

        .issue-category-badge {
          display: inline-block;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 10px;
          color: white;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .position-entry {
          background: #f8f9fa;
          border-radius: 6px;
          padding: 10px;
          margin-bottom: 8px;
        }

        .position-entry:last-child {
          margin-bottom: 0;
        }

        .position-party {
          font-size: 12px;
          font-weight: 600;
          color: #666;
          margin-bottom: 4px;
        }

        .position-entry p {
          margin: 0 0 4px 0;
          color: #333;
          font-size: 13px;
          line-height: 1.4;
        }

        .position-source {
          font-size: 11px;
          color: #666;
        }

        .no-position {
          color: #999;
          font-style: italic;
          font-size: 13px;
          margin: 0;
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

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background: #545b62;
        }

        .btn-secondary:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        @media (max-width: 1024px) {
          .table-header,
          .table-row {
            grid-template-columns: 1fr;
          }

          .table-header > div,
          .table-row > div {
            border-right: none;
            border-bottom: 1px solid #e0e0e0;
          }

          .table-header > div:last-child,
          .table-row > div:last-child {
            border-bottom: none;
          }

          .col-claimant,
          .col-defendant {
            padding-top: 8px !important;
          }

          .col-claimant::before {
            content: "Claimant Position(s):";
            display: block;
            font-weight: 600;
            margin-bottom: 8px;
            color: #1976d2;
          }

          .col-defendant::before {
            content: "Defendant Position(s):";
            display: block;
            font-weight: 600;
            margin-bottom: 8px;
            color: #c2185b;
          }
        }
      `}</style>
    </div>
  );
};