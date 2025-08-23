/**
 * Intelligent Full-Screen Document Viewer
 * Revolutionary document intelligence with AI tagging, highlighting, and analysis
 */

import React, { useState, useEffect, useRef } from 'react';

interface DocumentTag {
  id: string;
  text: string;
  type: 'fact' | 'issue' | 'evidence' | 'contradiction' | 'person' | 'date' | 'legal_principle' | 'custom';
  color: string;
  confidence?: number;
  aiGenerated: boolean;
  category?: string;
  relatedTags?: string[];
  position?: {
    startOffset: number;
    endOffset: number;
    pageNumber?: number;
  };
}

interface DocumentAnnotation {
  id: string;
  type: 'contradiction' | 'evidence' | 'credibility' | 'legal_issue' | 'timeline' | 'expert_opinion';
  text: string;
  position: {
    startOffset: number;
    endOffset: number;
    pageNumber?: number;
  };
  aiConfidence: number;
  relatedContent?: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface DocumentHighlight {
  id: string;
  text: string;
  color: 'red' | 'yellow' | 'blue' | 'green' | 'purple' | 'orange';
  type: 'user' | 'ai';
  position: {
    startOffset: number;
    endOffset: number;
    pageNumber?: number;
  };
  note?: string;
  tags?: string[];
}

interface DocumentAnalysis {
  credibilityScore: number;
  reliabilityScore: number;
  evidenceValue: 'low' | 'medium' | 'high' | 'critical';
  contradictions: number;
  timelineIssues: number;
  keyFacts: number;
  suggestedCrossExamination: string[];
  strategicImplications: string[];
}

interface IntelligentDocumentViewerProps {
  documentId: string;
  documentTitle: string;
  documentContent: string;
  documentType?: 'witness_statement' | 'expert_report' | 'contract' | 'pleading' | 'evidence' | 'correspondence';
  caseContext?: {
    caseId: string;
    practiceArea: 'criminal' | 'civil' | 'poca' | 'mixed';
    relatedDocuments?: string[];
  };
  onClose: () => void;
  onTagCreate?: (tag: Omit<DocumentTag, 'id'>) => void;
  onAnnotationCreate?: (annotation: Omit<DocumentAnnotation, 'id'>) => void;
}

export const IntelligentDocumentViewer: React.FC<IntelligentDocumentViewerProps> = ({
  documentId,
  documentTitle,
  documentContent,
  documentType = 'witness_statement',
  caseContext,
  onClose,
  onTagCreate,
  onAnnotationCreate
}) => {
  const [tags, setTags] = useState<DocumentTag[]>([]);
  const [annotations, setAnnotations] = useState<DocumentAnnotation[]>([]);
  const [highlights, setHighlights] = useState<DocumentHighlight[]>([]);
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [selectedText, setSelectedText] = useState<string>('');
  const [showTagCreator, setShowTagCreator] = useState(false);
  const [activeHighlightColor, setActiveHighlightColor] = useState<DocumentHighlight['color']>('yellow');
  const [sidebarTab, setSidebarTab] = useState<'tags' | 'analysis' | 'related' | 'notes'>('tags');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

  const documentRef = useRef<HTMLDivElement>(null);
  const textSelectionRef = useRef<Selection | null>(null);

  useEffect(() => {
    // Perform initial AI analysis of the document
    performDocumentAnalysis();
    generateSmartTags();
  }, [documentContent, documentType, caseContext]);

  useEffect(() => {
    // Handle text selection for highlighting and tagging
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        setSelectedText(selection.toString().trim());
        textSelectionRef.current = selection;
      }
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('keyup', handleSelection);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('keyup', handleSelection);
    };
  }, []);

  const performDocumentAnalysis = async (): Promise<void> => {
    setIsAnalyzing(true);
    
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const analysisResult = analyzeDocumentContent(documentContent, documentType, caseContext);
      setAnalysis(analysisResult.analysis);
      setAnnotations(analysisResult.annotations);
      
    } catch (error) {
      console.error('Document analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeDocumentContent = (content: string, type: string, context?: any) => {
    const contentLower = content.toLowerCase();
    
    // Analysis metrics
    let credibilityScore = 0.75; // Base score
    let reliabilityScore = 0.70;
    let contradictions = 0;
    let timelineIssues = 0;
    let keyFacts = 0;
    
    const annotations: DocumentAnnotation[] = [];
    
    // Detect contradictions
    const contradictionPatterns = [
      /i don't remember.*but.*i clearly recall/gi,
      /approximately.*exactly/gi,
      /never.*always/gi,
      /impossible.*possible/gi
    ];
    
    contradictionPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        contradictions += matches.length;
        credibilityScore -= 0.1 * matches.length;
        
        matches.forEach(match => {
          const index = content.indexOf(match);
          annotations.push({
            id: `contradiction_${Date.now()}_${Math.random()}`,
            type: 'contradiction',
            text: `Potential contradiction detected: "${match}"`,
            position: { startOffset: index, endOffset: index + match.length },
            aiConfidence: 0.85,
            severity: 'high'
          });
        });
      }
    });
    
    // Timeline analysis
    const timePatterns = /(\d{1,2}:\d{2}(?:\s*(?:am|pm))?|\d{1,2}(?:\.\d{2})?\s*(?:pm|am)|morning|afternoon|evening|night)/gi;
    const timeMatches = content.match(timePatterns) || [];
    
    if (timeMatches.length > 2) {
      // Check for timeline inconsistencies
      const timeWords = ['morning', 'afternoon', 'evening', 'night'];
      const hasMultipleTimeFrames = timeWords.filter(word => 
        contentLower.includes(word)
      ).length > 1;
      
      if (hasMultipleTimeFrames) {
        timelineIssues++;
        reliabilityScore -= 0.15;
        
        annotations.push({
          id: `timeline_${Date.now()}_${Math.random()}`,
          type: 'timeline',
          text: 'Multiple time references detected - verify chronological consistency',
          position: { startOffset: 0, endOffset: content.length },
          aiConfidence: 0.78,
          severity: 'medium'
        });
      }
    }
    
    // Key facts detection
    const factPatterns = [
      /i witnessed/gi,
      /i saw/gi,
      /i heard/gi,
      /the defendant/gi,
      /the claimant/gi,
      /at approximately/gi,
      /specifically/gi,
      /in particular/gi
    ];
    
    factPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        keyFacts += matches.length;
      }
    });
    
    // Evidence value assessment
    let evidenceValue: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    if (credibilityScore > 0.8 && reliabilityScore > 0.8) evidenceValue = 'critical';
    else if (credibilityScore > 0.7 && reliabilityScore > 0.7) evidenceValue = 'high';
    else if (credibilityScore < 0.5 || reliabilityScore < 0.5) evidenceValue = 'low';
    
    // Strategic implications
    const strategicImplications = [];
    if (contradictions > 0) {
      strategicImplications.push('Use contradictions in cross-examination');
      strategicImplications.push('Challenge witness reliability');
    }
    if (timelineIssues > 0) {
      strategicImplications.push('Focus on chronological inconsistencies');
    }
    if (credibilityScore > 0.8) {
      strategicImplications.push('Strong witness - prepare counter-narrative');
    }
    
    // Cross-examination suggestions
    const suggestedCrossExamination = [];
    if (contradictions > 0) {
      suggestedCrossExamination.push('Put specific contradictions to witness');
    }
    if (timelineIssues > 0) {
      suggestedCrossExamination.push('Challenge timing and sequence of events');
    }
    if (contentLower.includes('approximately') || contentLower.includes('about')) {
      suggestedCrossExamination.push('Press for specific details on approximate times/distances');
    }
    
    return {
      analysis: {
        credibilityScore: Math.max(0, Math.min(1, credibilityScore)),
        reliabilityScore: Math.max(0, Math.min(1, reliabilityScore)),
        evidenceValue,
        contradictions,
        timelineIssues,
        keyFacts,
        suggestedCrossExamination,
        strategicImplications
      },
      annotations
    };
  };

  const generateSmartTags = (): void => {
    const contentLower = documentContent.toLowerCase();
    const suggestions: string[] = [];
    
    // Legal-specific tag suggestions
    const legalPatterns = {
      'Key Evidence': /evidence|proof|demonstrates|shows that|proves/gi,
      'Witness Credibility': /i remember|i recall|i believe|i think|to the best of my knowledge/gi,
      'Timeline': /at approximately|around|before|after|during|meanwhile/gi,
      'Contradicts Other Evidence': /however|but|although|despite|contrary to/gi,
      'Expert Opinion': /in my professional opinion|based on my experience|my assessment/gi,
      'Factual Dispute': /dispute|disagree|deny|contest|challenge/gi,
      'Liability Issue': /negligent|breach|duty|reasonable|standard/gi,
      'Quantum': /damages|loss|compensation|costs|expenses/gi,
      'Criminal Elements': /intent|knowledge|reckless|deliberate|purpose/gi,
      'POCA Relevance': /benefit|proceeds|lifestyle|assets|property/gi
    };
    
    Object.entries(legalPatterns).forEach(([tag, pattern]) => {
      if (pattern.test(documentContent)) {
        suggestions.push(tag);
      }
    });
    
    // Practice area specific tags
    if (caseContext?.practiceArea === 'criminal') {
      if (contentLower.includes('defendant') || contentLower.includes('accused')) {
        suggestions.push('Defendant Evidence', 'Character Evidence');
      }
      if (contentLower.includes('confession') || contentLower.includes('admission')) {
        suggestions.push('Confession', 'Admissions');
      }
    }
    
    if (caseContext?.practiceArea === 'civil') {
      if (contentLower.includes('negligent') || contentLower.includes('breach')) {
        suggestions.push('Negligence', 'Breach of Duty');
      }
      if (contentLower.includes('damages') || contentLower.includes('loss')) {
        suggestions.push('Quantum', 'Financial Loss');
      }
    }
    
    if (caseContext?.practiceArea === 'poca') {
      if (contentLower.includes('assets') || contentLower.includes('property')) {
        suggestions.push('Asset Evidence', 'Property Interest');
      }
      if (contentLower.includes('lifestyle') || contentLower.includes('expenditure')) {
        suggestions.push('Criminal Lifestyle', 'Expenditure Evidence');
      }
    }
    
    setSuggestedTags(suggestions.slice(0, 8)); // Limit to 8 suggestions
  };

  const handleCreateTag = (tagText: string, type: DocumentTag['type'] = 'custom'): void => {
    const newTag: DocumentTag = {
      id: `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: tagText,
      type,
      color: getTagColor(type),
      aiGenerated: false,
      confidence: selectedText ? 0.95 : 0.8
    };
    
    setTags(prev => [...prev, newTag]);
    onTagCreate?.(newTag);
    setShowTagCreator(false);
    setSelectedText('');
  };

  const handleHighlightText = (color: DocumentHighlight['color']): void => {
    if (!selectedText || !textSelectionRef.current) return;
    
    const selection = textSelectionRef.current;
    const range = selection.getRangeAt(0);
    
    const highlight: DocumentHighlight = {
      id: `highlight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: selectedText,
      color,
      type: 'user',
      position: {
        startOffset: range.startOffset,
        endOffset: range.endOffset
      }
    };
    
    setHighlights(prev => [...prev, highlight]);
    setSelectedText('');
    selection.removeAllRanges();
  };

  const getTagColor = (type: DocumentTag['type']): string => {
    const colors = {
      fact: '#10b981',
      issue: '#f59e0b',
      evidence: '#3b82f6',
      contradiction: '#ef4444',
      person: '#8b5cf6',
      date: '#06b6d4',
      legal_principle: '#6366f1',
      custom: '#6b7280'
    };
    return colors[type];
  };

  const renderDocumentContent = (): JSX.Element => {
    let content = documentContent;
    
    // Apply highlights to content
    highlights.forEach(highlight => {
      const before = content.substring(0, highlight.position.startOffset);
      const highlighted = content.substring(highlight.position.startOffset, highlight.position.endOffset);
      const after = content.substring(highlight.position.endOffset);
      
      content = before + 
        `<span class="highlight highlight-${highlight.color}" data-highlight-id="${highlight.id}">${highlighted}</span>` + 
        after;
    });
    
    return (
      <div 
        ref={documentRef}
        className="document-text"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  };

  return (
    <div className="intelligent-document-viewer">
      <div className="document-header">
        <div className="document-title-section">
          <span className="document-icon">📄</span>
          <div className="title-info">
            <h2>{documentTitle}</h2>
            <span className="document-type">{documentType.replace('_', ' ')}</span>
          </div>
        </div>
        <div className="document-actions">
          <input
            type="text"
            placeholder="Search in document..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="document-search"
          />
          <button className="doc-action-btn" title="Print">📄</button>
          <button className="doc-action-btn" title="Download">💾</button>
          <button className="doc-action-btn" title="Share">📤</button>
          <button className="doc-action-btn close-btn" onClick={onClose} title="Close">✕</button>
        </div>
      </div>

      <div className="document-content-container">
        <div className="document-sidebar">
          <div className="sidebar-tabs">
            <button 
              className={`tab-btn ${sidebarTab === 'tags' ? 'active' : ''}`}
              onClick={() => setSidebarTab('tags')}
            >
              🏷️ Tags
            </button>
            <button 
              className={`tab-btn ${sidebarTab === 'analysis' ? 'active' : ''}`}
              onClick={() => setSidebarTab('analysis')}
            >
              🧠 Analysis
            </button>
            <button 
              className={`tab-btn ${sidebarTab === 'related' ? 'active' : ''}`}
              onClick={() => setSidebarTab('related')}
            >
              🔗 Related
            </button>
            <button 
              className={`tab-btn ${sidebarTab === 'notes' ? 'active' : ''}`}
              onClick={() => setSidebarTab('notes')}
            >
              📝 Notes
            </button>
          </div>

          <div className="sidebar-content">
            {sidebarTab === 'tags' && (
              <div className="tags-panel">
                <div className="tags-header">
                  <h3>Smart Tags</h3>
                  <button 
                    className="add-tag-btn"
                    onClick={() => setShowTagCreator(true)}
                    disabled={!selectedText}
                  >
                    + Tag
                  </button>
                </div>

                {suggestedTags.length > 0 && (
                  <div className="suggested-tags">
                    <h4>💡 AI Suggestions:</h4>
                    <div className="tag-suggestions">
                      {suggestedTags.map(suggestion => (
                        <button
                          key={suggestion}
                          className="suggested-tag"
                          onClick={() => handleCreateTag(suggestion, 'evidence')}
                        >
                          + {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="active-tags">
                  <h4>Active Tags ({tags.length}):</h4>
                  {tags.map(tag => (
                    <div key={tag.id} className="tag-item">
                      <span 
                        className="tag-badge"
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.text}
                      </span>
                      {tag.aiGenerated && <span className="ai-badge">AI</span>}
                      {tag.confidence && (
                        <span className="confidence">{Math.round(tag.confidence * 100)}%</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sidebarTab === 'analysis' && (
              <div className="analysis-panel">
                <h3>AI Analysis</h3>
                {isAnalyzing ? (
                  <div className="analyzing">
                    <div className="spinner">🧠</div>
                    <p>Analyzing document...</p>
                  </div>
                ) : analysis ? (
                  <div className="analysis-results">
                    <div className="analysis-metrics">
                      <div className="metric">
                        <label>Credibility:</label>
                        <div className="metric-bar">
                          <div 
                            className="metric-fill credibility" 
                            style={{ width: `${analysis.credibilityScore * 100}%` }}
                          />
                          <span>{Math.round(analysis.credibilityScore * 100)}%</span>
                        </div>
                      </div>
                      <div className="metric">
                        <label>Reliability:</label>
                        <div className="metric-bar">
                          <div 
                            className="metric-fill reliability" 
                            style={{ width: `${analysis.reliabilityScore * 100}%` }}
                          />
                          <span>{Math.round(analysis.reliabilityScore * 100)}%</span>
                        </div>
                      </div>
                      <div className="metric">
                        <label>Evidence Value:</label>
                        <span className={`evidence-value ${analysis.evidenceValue}`}>
                          {analysis.evidenceValue.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="analysis-findings">
                      <div className="finding">
                        <span className="finding-label">🔍 Contradictions:</span>
                        <span className="finding-value">{analysis.contradictions}</span>
                      </div>
                      <div className="finding">
                        <span className="finding-label">⏰ Timeline Issues:</span>
                        <span className="finding-value">{analysis.timelineIssues}</span>
                      </div>
                      <div className="finding">
                        <span className="finding-label">📋 Key Facts:</span>
                        <span className="finding-value">{analysis.keyFacts}</span>
                      </div>
                    </div>

                    {analysis.suggestedCrossExamination.length > 0 && (
                      <div className="cross-exam-suggestions">
                        <h4>⚔️ Cross-Examination:</h4>
                        <ul>
                          {analysis.suggestedCrossExamination.map((suggestion, index) => (
                            <li key={index}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysis.strategicImplications.length > 0 && (
                      <div className="strategic-implications">
                        <h4>🎯 Strategic Implications:</h4>
                        <ul>
                          {analysis.strategicImplications.map((implication, index) => (
                            <li key={index}>{implication}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p>Click "Analyze Document" to start AI analysis</p>
                )}
              </div>
            )}

            {sidebarTab === 'related' && (
              <div className="related-panel">
                <h3>Related Documents</h3>
                <div className="related-docs">
                  <div className="related-doc">📄 Smith_statement.pdf</div>
                  <div className="related-doc">📄 Expert_report.pdf</div>
                  <div className="related-doc">📹 CCTV_footage.mp4</div>
                </div>
              </div>
            )}

            {sidebarTab === 'notes' && (
              <div className="notes-panel">
                <h3>Document Notes</h3>
                <textarea 
                  className="notes-textarea"
                  placeholder="Add your notes about this document..."
                />
                <button className="save-notes-btn">Save Notes</button>
              </div>
            )}
          </div>
        </div>

        <div className="document-main">
          <div className="document-viewer">
            {renderDocumentContent()}
            
            {/* AI Annotations */}
            {annotations.map(annotation => (
              <div key={annotation.id} className={`ai-annotation ${annotation.type} ${annotation.severity}`}>
                <div className="annotation-icon">
                  {annotation.type === 'contradiction' && '🔴'}
                  {annotation.type === 'evidence' && '🟡'}
                  {annotation.type === 'credibility' && '🟠'}
                  {annotation.type === 'timeline' && '⏰'}
                  {annotation.type === 'legal_issue' && '⚖️'}
                </div>
                <div className="annotation-text">{annotation.text}</div>
                <div className="annotation-confidence">
                  {Math.round(annotation.aiConfidence * 100)}% confidence
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="document-toolbar">
        <div className="toolbar-section">
          <span className="toolbar-label">🎨 Highlighting:</span>
          <div className="highlight-colors">
            {(['red', 'yellow', 'blue', 'green', 'purple', 'orange'] as const).map(color => (
              <button
                key={color}
                className={`highlight-btn ${color} ${activeHighlightColor === color ? 'active' : ''}`}
                onClick={() => {
                  setActiveHighlightColor(color);
                  if (selectedText) handleHighlightText(color);
                }}
                title={`Highlight with ${color}`}
              >
                ●
              </button>
            ))}
          </div>
        </div>

        <div className="toolbar-section">
          <span className="toolbar-label">🔍 Selected:</span>
          <span className="selected-text">
            {selectedText ? `"${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"` : 'No text selected'}
          </span>
        </div>

        <div className="toolbar-section">
          <button 
            className="toolbar-btn"
            onClick={() => setShowTagCreator(true)}
            disabled={!selectedText}
          >
            🏷️ Tag Selection
          </button>
          <button 
            className="toolbar-btn"
            onClick={() => selectedText && handleHighlightText(activeHighlightColor)}
            disabled={!selectedText}
          >
            🎨 Highlight
          </button>
          <button className="toolbar-btn">📝 Add Note</button>
        </div>
      </div>

      {/* Tag Creator Modal */}
      {showTagCreator && (
        <div className="tag-creator-modal">
          <div className="tag-creator">
            <h3>Create New Tag</h3>
            <input
              type="text"
              placeholder="Enter tag name..."
              className="tag-input"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const input = e.target as HTMLInputElement;
                  if (input.value.trim()) {
                    handleCreateTag(input.value.trim());
                  }
                }
              }}
              autoFocus
            />
            <div className="tag-type-buttons">
              <button onClick={() => handleCreateTag('Fact', 'fact')}>📋 Fact</button>
              <button onClick={() => handleCreateTag('Evidence', 'evidence')}>🔍 Evidence</button>
              <button onClick={() => handleCreateTag('Issue', 'issue')}>⚠️ Issue</button>
              <button onClick={() => handleCreateTag('Contradiction', 'contradiction')}>🔴 Contradiction</button>
            </div>
            <div className="tag-creator-actions">
              <button onClick={() => setShowTagCreator(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntelligentDocumentViewer;