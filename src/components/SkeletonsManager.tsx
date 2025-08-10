import React, { useState, useEffect } from 'react';
import { CaseDocument, LegalAuthority } from '../types';
import { storage } from '../utils/storage';
import { PDFTextExtractor } from '../utils/pdfExtractor';
// Removed aiDocumentProcessor - using unifiedAIClient instead
import { useAISync } from '../hooks/useAISync';

interface SkeletonsManagerProps {
  caseId: string;
  caseData: any;
}

interface SkeletonArgument {
  id: string;
  title: string;
  description: string;
  category: 'factual' | 'legal' | 'procedural' | 'quantum';
  proposition: string;
  legalBasis: string[];
  supportingAuthorities: string[];
  paragraphRefs: string[];
  sourceDocument: string;
  party: string;
  partyType: 'claimant' | 'defendant';
  confidence: number;
}

interface SkeletonAnalysis {
  argument: SkeletonArgument;
  strengths: string[];
  weaknesses: string[];
  counterArguments: string[];
  strategicRecommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
  winProbability: number;
}

interface ComparativeIssue {
  issue: string;
  category: string;
  claimantArguments: SkeletonAnalysis[];
  defendantArguments: SkeletonAnalysis[];
  overallAssessment: {
    claimantStrength: number; // 1-10
    defendantStrength: number; // 1-10
    keyFactors: string[];
    recommendations: string[];
  };
}

export const SkeletonsManager: React.FC<SkeletonsManagerProps> = ({ caseId, caseData }) => {
  const [skeletonDocs, setSkeletonDocs] = useState<CaseDocument[]>([]);
  const [skeletonArguments, setSkeletonArguments] = useState<SkeletonArgument[]>([]);
  const [analyses, setAnalyses] = useState<SkeletonAnalysis[]>([]);
  const [comparativeIssues, setComparativeIssues] = useState<ComparativeIssue[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingDoc, setAnalyzingDoc] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'documents' | 'arguments' | 'comparative' | 'strategic'>('documents');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filter, setFilter] = useState<'all' | 'claimant' | 'defendant'>('all');

  // AI Synchronization
  const { publishAIResults } = useAISync(caseId, 'SkeletonsManager');

  useEffect(() => {
    loadSkeletonDocuments();
  }, [caseId]);

  useEffect(() => {
    if (skeletonArguments.length > 0) {
      generateComparativeAnalysis();
    }
  }, [skeletonArguments, analyses]);

  const loadSkeletonDocuments = async () => {
    try {
      const allDocs = await storage.getDocumentsAsync(caseId);
      
      // Filter for skeleton arguments
      const skeletons = allDocs.filter(doc => 
        doc.type === 'skeleton_argument' ||
        doc.title.toLowerCase().includes('skeleton') ||
        doc.tags?.includes('skeleton') ||
        doc.category === 'pleadings'
      );

      setSkeletonDocs(skeletons);
      
      // Load existing arguments
      const savedArgs = localStorage.getItem(`skeleton_arguments_${caseId}`);
      if (savedArgs) {
        setSkeletonArguments(JSON.parse(savedArgs));
      }
      
      const savedAnalyses = localStorage.getItem(`skeleton_analyses_${caseId}`);
      if (savedAnalyses) {
        setAnalyses(JSON.parse(savedAnalyses));
      }
    } catch (error) {
      console.error('Failed to load skeleton documents:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setUploadProgress(0);

    try {
      // Extract text from PDF
      const extractedText = await PDFTextExtractor.extractWithOCRFallback(file);
      setUploadProgress(30);

      // Create document record
      const newDoc: CaseDocument = {
        id: `skeleton_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        caseId,
        title: file.name.replace('.pdf', ''),
        category: 'pleadings',
        type: 'skeleton_argument',
        content: extractedText.substring(0, 1000) + '...',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileContent: extractedText,
        tags: ['skeleton', 'uploaded'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save document
      storage.saveDocument(newDoc);
      setUploadProgress(50);

      // Analyze skeleton argument
      await analyzeSkeletonDocument(newDoc);
      setUploadProgress(100);

      // Refresh documents
      await loadSkeletonDocuments();
      setSelectedFile(null);
      
    } catch (error) {
      console.error('File upload failed:', error);
      alert('Failed to upload and analyze skeleton argument');
    }
  };

  const analyzeSkeletonDocument = async (doc: CaseDocument) => {
    if (!doc.fileContent && !doc.content) {
      alert('No content available for analysis');
      return;
    }

    setIsAnalyzing(true);
    setAnalyzingDoc(doc.id);

    try {
      const content = doc.fileContent || doc.content || '';
      
      // Determine party from document title/content
      const party = determineParty(doc.title, content);
      
      // Enhanced prompt for skeleton argument analysis
      const analysisPrompt = `You are an expert barrister analyzing a skeleton argument. Extract and analyze all arguments, propositions, and legal authorities.

Document: ${doc.title}
Party: ${party.name} (${party.type})
Case: ${caseData.title}

Content (first 8000 chars):
${content.substring(0, 8000)}

Analyze this skeleton argument and provide a detailed JSON response:

{
  "arguments": [
    {
      "title": "Brief argument title",
      "description": "Detailed description of the argument being made",
      "category": "factual|legal|procedural|quantum",
      "proposition": "The core proposition or claim being advanced",
      "legalBasis": ["Legal principles or rules relied upon"],
      "supportingAuthorities": ["Case law, statutes, or other authorities cited"],
      "paragraphRefs": ["Paragraph numbers where this argument appears"],
      "confidence": 0.85
    }
  ],
  "overallStrategy": "Summary of the party's overall legal strategy",
  "keyWeaknesses": ["Potential weaknesses in the party's position"],
  "strongestPoints": ["The party's strongest arguments"],
  "missingElements": ["What this party might be missing or should address"]
}

Focus on:
1. Extracting distinct legal arguments and propositions
2. Identifying supporting authorities and legal basis
3. Assessing the strength and quality of each argument
4. Identifying strategic approach and tactics`;

      // TODO: Replace with LocalAI processing
      const response = {
        arguments: [],
        authorities: [],
        structuredContent: 'Document processed',
        structure: 'Document processed',
        metadata: { confidence: 0.8 },
        confidence: 0.8
      };

      // Parse the analysis
      const parsedArgs = parseSkeletonAnalysis(response.structuredContent, doc, party);
      
      // Update arguments state
      const updatedArgs = [...skeletonArguments, ...parsedArgs];
      setSkeletonArguments(updatedArgs);
      localStorage.setItem(`skeleton_arguments_${caseId}`, JSON.stringify(updatedArgs));

      // Generate detailed analysis for each argument
      const newAnalyses = await generateArgumentAnalyses(parsedArgs);
      const updatedAnalyses = [...analyses, ...newAnalyses];
      setAnalyses(updatedAnalyses);
      localStorage.setItem(`skeleton_analyses_${caseId}`, JSON.stringify(updatedAnalyses));

      // Publish to AI sync system
      await publishAIResults(doc.fileName!, {
        issues: parsedArgs.map(arg => ({
          title: arg.title,
          description: arg.description,
          category: arg.category,
          priority: 'high',
          status: 'disputed',
          claimantPosition: party.type === 'claimant' ? arg.proposition : '',
          defendantPosition: party.type === 'defendant' ? arg.proposition : '',
          documentRefs: [doc.fileName!],
          relatedIssues: [],
          tags: ['skeleton-argument', party.type]
        })),
        authorities: parsedArgs.reduce((acc, arg) => {
          const auths = arg.supportingAuthorities.map(auth => ({
            citation: auth,
            principle: arg.legalBasis.join('; '),
            relevance: `Supporting ${arg.title}`,
            tags: ['skeleton-argument']
          }));
          return acc.concat(auths);
        }, [] as any[])
      }, response.metadata.confidence);

    } catch (error) {
      console.error('Failed to analyze skeleton argument:', error);
      alert('Failed to analyze skeleton argument. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setAnalyzingDoc(null);
    }
  };

  const parseSkeletonAnalysis = (analysisText: string, doc: CaseDocument, party: { name: string; type: 'claimant' | 'defendant' }): SkeletonArgument[] => {
    try {
      // Try to extract JSON from the analysis
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        if (parsed.arguments && Array.isArray(parsed.arguments)) {
          return parsed.arguments.map((arg: any, index: number) => ({
            id: `arg_${Date.now()}_${index}`,
            title: arg.title || `Argument ${index + 1}`,
            description: arg.description || '',
            category: arg.category || 'legal',
            proposition: arg.proposition || '',
            legalBasis: Array.isArray(arg.legalBasis) ? arg.legalBasis : [],
            supportingAuthorities: Array.isArray(arg.supportingAuthorities) ? arg.supportingAuthorities : [],
            paragraphRefs: Array.isArray(arg.paragraphRefs) ? arg.paragraphRefs : [],
            sourceDocument: doc.title,
            party: party.name,
            partyType: party.type,
            confidence: arg.confidence || 0.7
          }));
        }
      }
    } catch (error) {
      console.error('Failed to parse skeleton analysis:', error);
    }

    // Fallback: create basic arguments from content analysis
    return [{
      id: `arg_${Date.now()}_fallback`,
      title: `Main Argument - ${party.name}`,
      description: `Arguments extracted from ${doc.title}`,
      category: 'legal',
      proposition: 'Position to be determined from document analysis',
      legalBasis: [],
      supportingAuthorities: [],
      paragraphRefs: [],
      sourceDocument: doc.title,
      party: party.name,
      partyType: party.type,
      confidence: 0.5
    }];
  };

  const determineParty = (title: string, content: string): { name: string; type: 'claimant' | 'defendant' } => {
    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();
    
    // Check for explicit party indicators
    if (titleLower.includes('claimant') || contentLower.includes('on behalf of the claimant')) {
      return { name: caseData.client || 'Claimant', type: 'claimant' };
    }
    
    if (titleLower.includes('defendant') || contentLower.includes('on behalf of the defendant')) {
      return { name: caseData.opponent || 'Defendant', type: 'defendant' };
    }
    
    // Default to claimant if unclear
    return { name: caseData.client || 'Claimant', type: 'claimant' };
  };

  const generateArgumentAnalyses = async (args: SkeletonArgument[]): Promise<SkeletonAnalysis[]> => {
    const analyses: SkeletonAnalysis[] = [];
    
    for (const arg of args) {
      try {
        const analysisPrompt = `Analyze this legal argument for strengths, weaknesses, and strategic recommendations:

Argument: ${arg.title}
Description: ${arg.description}
Proposition: ${arg.proposition}
Legal Basis: ${arg.legalBasis.join(', ')}
Supporting Authorities: ${arg.supportingAuthorities.join(', ')}

Provide analysis in JSON format:
{
  "strengths": ["Strong points about this argument"],
  "weaknesses": ["Vulnerabilities or weak points"],
  "counterArguments": ["Likely opposing arguments"],
  "strategicRecommendations": ["How to strengthen this argument"],
  "riskLevel": "low|medium|high",
  "winProbability": 75
}`;

        // TODO: Replace with LocalAI processing
        const response = {
          structuredContent: 'Argument analyzed',
          analysis: 'Document processed',
          confidence: 0.8
        };

        const analysis = parseArgumentAnalysis(response.structuredContent, arg);
        analyses.push(analysis);
        
      } catch (error) {
        console.error(`Failed to analyze argument ${arg.title}:`, error);
        // Create fallback analysis
        analyses.push({
          argument: arg,
          strengths: ['Argument requires detailed analysis'],
          weaknesses: ['Analysis pending'],
          counterArguments: ['To be determined'],
          strategicRecommendations: ['Review and strengthen legal basis'],
          riskLevel: 'medium',
          winProbability: 50
        });
      }
    }
    
    return analyses;
  };

  const parseArgumentAnalysis = (analysisText: string, arg: SkeletonArgument): SkeletonAnalysis => {
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        return {
          argument: arg,
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
          weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
          counterArguments: Array.isArray(parsed.counterArguments) ? parsed.counterArguments : [],
          strategicRecommendations: Array.isArray(parsed.strategicRecommendations) ? parsed.strategicRecommendations : [],
          riskLevel: ['low', 'medium', 'high'].includes(parsed.riskLevel) ? parsed.riskLevel : 'medium',
          winProbability: typeof parsed.winProbability === 'number' ? parsed.winProbability : 50
        };
      }
    } catch (error) {
      console.error('Failed to parse argument analysis:', error);
    }

    return {
      argument: arg,
      strengths: ['Analysis pending'],
      weaknesses: ['Analysis pending'],
      counterArguments: ['Analysis pending'],
      strategicRecommendations: ['Analysis pending'],
      riskLevel: 'medium',
      winProbability: 50
    };
  };

  const generateComparativeAnalysis = () => {
    // Group arguments by similar issues/topics
    const issueGroups: Record<string, SkeletonAnalysis[]> = {};
    
    analyses.forEach(analysis => {
      const category = analysis.argument.category;
      const key = `${category}_${analysis.argument.title.substring(0, 30)}`;
      
      if (!issueGroups[key]) {
        issueGroups[key] = [];
      }
      issueGroups[key].push(analysis);
    });

    // Create comparative issues
    const comparative: ComparativeIssue[] = Object.entries(issueGroups).map(([key, groupAnalyses]) => {
      const claimantArgs = groupAnalyses.filter(a => a.argument.partyType === 'claimant');
      const defendantArgs = groupAnalyses.filter(a => a.argument.partyType === 'defendant');
      
      // Calculate overall strengths
      const claimantStrength = claimantArgs.length > 0 
        ? claimantArgs.reduce((sum, a) => sum + a.winProbability, 0) / claimantArgs.length / 10
        : 0;
      const defendantStrength = defendantArgs.length > 0 
        ? defendantArgs.reduce((sum, a) => sum + a.winProbability, 0) / defendantArgs.length / 10
        : 0;

      return {
        issue: groupAnalyses[0].argument.title,
        category: groupAnalyses[0].argument.category,
        claimantArguments: claimantArgs,
        defendantArguments: defendantArgs,
        overallAssessment: {
          claimantStrength: Math.round(claimantStrength * 10) / 10,
          defendantStrength: Math.round(defendantStrength * 10) / 10,
          keyFactors: [...new Set(groupAnalyses.flatMap(a => a.strengths.slice(0, 2)))],
          recommendations: [...new Set(groupAnalyses.flatMap(a => a.strategicRecommendations.slice(0, 2)))]
        }
      };
    });

    setComparativeIssues(comparative);
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 7) return '#4caf50';
    if (strength >= 5) return '#ff9800';
    return '#f44336';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return '#4caf50';
      case 'medium': return '#ff9800';
      case 'high': return '#f44336';
      default: return '#666';
    }
  };

  const filteredArguments = skeletonArguments.filter(arg => 
    filter === 'all' || arg.partyType === filter
  );

  return (
    <div className="skeletons-manager">
      <div className="manager-header">
        <div className="header-info">
          <h3>⚖️ Skeleton Arguments Analysis</h3>
          <p className="doc-count">
            {skeletonDocs.length} skeleton documents • {skeletonArguments.length} arguments analyzed
          </p>
        </div>
        <div className="header-actions">
          <label className="upload-btn">
            📄 Upload Skeleton
            <input 
              type="file" 
              accept=".pdf" 
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <span>Processing skeleton argument... {uploadProgress}%</span>
        </div>
      )}

      <div className="view-controls">
        <button 
          className={`view-btn ${viewMode === 'documents' ? 'active' : ''}`}
          onClick={() => setViewMode('documents')}
        >
          📄 Documents
        </button>
        <button 
          className={`view-btn ${viewMode === 'arguments' ? 'active' : ''}`}
          onClick={() => setViewMode('arguments')}
        >
          📝 Arguments
        </button>
        <button 
          className={`view-btn ${viewMode === 'comparative' ? 'active' : ''}`}
          onClick={() => setViewMode('comparative')}
        >
          ⚖️ Comparative
        </button>
        <button 
          className={`view-btn ${viewMode === 'strategic' ? 'active' : ''}`}
          onClick={() => setViewMode('strategic')}
        >
          🎯 Strategic
        </button>
      </div>

      <div className="content-area">
        {viewMode === 'documents' && (
          <div className="documents-view">
            <h4>📄 Skeleton Documents</h4>
            {skeletonDocs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📄</div>
                <h3>No Skeleton Arguments</h3>
                <p>Upload skeleton argument documents to begin comparative analysis.</p>
              </div>
            ) : (
              <div className="documents-grid">
                {skeletonDocs.map(doc => (
                  <div key={doc.id} className="document-card">
                    <div className="doc-header">
                      <h5>{doc.title}</h5>
                      <div className="doc-party">
                        {determineParty(doc.title, doc.content || '').name}
                      </div>
                    </div>
                    <div className="doc-meta">
                      <span>{doc.fileName}</span>
                      <span>{doc.fileSize && Math.round(doc.fileSize / 1024)}KB</span>
                    </div>
                    <div className="doc-actions">
                      <button
                        className="btn btn-analyze"
                        onClick={() => analyzeSkeletonDocument(doc)}
                        disabled={isAnalyzing}
                      >
                        {analyzingDoc === doc.id ? '🤖 Analyzing...' : '🤖 Analyze'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {viewMode === 'arguments' && (
          <div className="arguments-view">
            <div className="arguments-header">
              <h4>📝 Extracted Arguments</h4>
              <div className="filter-controls">
                <select value={filter} onChange={(e) => setFilter(e.target.value as any)}>
                  <option value="all">All Parties</option>
                  <option value="claimant">Claimant</option>
                  <option value="defendant">Defendant</option>
                </select>
              </div>
            </div>
            
            {filteredArguments.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h3>No Arguments Analyzed</h3>
                <p>Upload and analyze skeleton documents to see extracted arguments.</p>
              </div>
            ) : (
              <div className="arguments-list">
                {filteredArguments.map(arg => {
                  const analysis = analyses.find(a => a.argument.id === arg.id);
                  
                  return (
                    <div key={arg.id} className="argument-card">
                      <div className="argument-header">
                        <div className="argument-info">
                          <h5>{arg.title}</h5>
                          <div className="argument-meta">
                            <span className={`party-badge ${arg.partyType}`}>
                              {arg.party}
                            </span>
                            <span className={`category-badge ${arg.category}`}>
                              {arg.category}
                            </span>
                          </div>
                        </div>
                        {analysis && (
                          <div className="analysis-indicators">
                            <div 
                              className="win-probability"
                              style={{ backgroundColor: getStrengthColor(analysis.winProbability / 10) }}
                            >
                              {analysis.winProbability}%
                            </div>
                            <div 
                              className="risk-level"
                              style={{ backgroundColor: getRiskColor(analysis.riskLevel) }}
                            >
                              {analysis.riskLevel}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="argument-content">
                        <div className="proposition">
                          <strong>Proposition:</strong> {arg.proposition}
                        </div>
                        <div className="description">
                          {arg.description}
                        </div>
                        
                        {arg.supportingAuthorities.length > 0 && (
                          <div className="authorities">
                            <strong>Supporting Authorities:</strong>
                            <ul>
                              {arg.supportingAuthorities.map((auth, i) => (
                                <li key={i}>{auth}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {analysis && (
                          <div className="analysis-summary">
                            <div className="strengths">
                              <strong>Strengths:</strong>
                              <ul>
                                {analysis.strengths.slice(0, 2).map((strength, i) => (
                                  <li key={i}>{strength}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="weaknesses">
                              <strong>Weaknesses:</strong>
                              <ul>
                                {analysis.weaknesses.slice(0, 2).map((weakness, i) => (
                                  <li key={i}>{weakness}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {viewMode === 'comparative' && (
          <div className="comparative-view">
            <h4>⚖️ Comparative Analysis</h4>
            
            {comparativeIssues.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">⚖️</div>
                <h3>No Comparative Analysis</h3>
                <p>Analyze skeleton arguments from both parties to see comparative analysis.</p>
              </div>
            ) : (
              <div className="comparative-table">
                <div className="table-header">
                  <div className="col-issue">Issue</div>
                  <div className="col-claimant">Claimant Position</div>
                  <div className="col-defendant">Defendant Position</div>
                  <div className="col-assessment">Overall Assessment</div>
                </div>
                
                {comparativeIssues.map((issue, index) => (
                  <div key={index} className="table-row">
                    <div className="col-issue">
                      <h5>{issue.issue}</h5>
                      <span className={`category-badge ${issue.category}`}>
                        {issue.category}
                      </span>
                    </div>
                    
                    <div className="col-claimant">
                      {issue.claimantArguments.length > 0 ? (
                        issue.claimantArguments.map((arg, i) => (
                          <div key={i} className="position-entry">
                            <div className="position-strength">
                              <span 
                                className="strength-indicator"
                                style={{ backgroundColor: getStrengthColor(arg.winProbability / 10) }}
                              >
                                {arg.winProbability}%
                              </span>
                            </div>
                            <div className="position-content">
                              <strong>{arg.argument.title}</strong>
                              <p>{arg.argument.proposition}</p>
                              <div className="position-analysis">
                                <div className="strengths">
                                  ✅ {arg.strengths.slice(0, 1).join(', ')}
                                </div>
                                <div className="weaknesses">
                                  ❌ {arg.weaknesses.slice(0, 1).join(', ')}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="no-position">No position identified</div>
                      )}
                    </div>
                    
                    <div className="col-defendant">
                      {issue.defendantArguments.length > 0 ? (
                        issue.defendantArguments.map((arg, i) => (
                          <div key={i} className="position-entry">
                            <div className="position-strength">
                              <span 
                                className="strength-indicator"
                                style={{ backgroundColor: getStrengthColor(arg.winProbability / 10) }}
                              >
                                {arg.winProbability}%
                              </span>
                            </div>
                            <div className="position-content">
                              <strong>{arg.argument.title}</strong>
                              <p>{arg.argument.proposition}</p>
                              <div className="position-analysis">
                                <div className="strengths">
                                  ✅ {arg.strengths.slice(0, 1).join(', ')}
                                </div>
                                <div className="weaknesses">
                                  ❌ {arg.weaknesses.slice(0, 1).join(', ')}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="no-position">No position identified</div>
                      )}
                    </div>
                    
                    <div className="col-assessment">
                      <div className="strength-comparison">
                        <div className="strength-bar">
                          <div className="claimant-strength">
                            <span>Claimant</span>
                            <div 
                              className="strength-fill claimant"
                              style={{ 
                                width: `${issue.overallAssessment.claimantStrength * 10}%`,
                                backgroundColor: getStrengthColor(issue.overallAssessment.claimantStrength)
                              }}
                            />
                            <span>{issue.overallAssessment.claimantStrength}</span>
                          </div>
                          <div className="defendant-strength">
                            <span>Defendant</span>
                            <div 
                              className="strength-fill defendant"
                              style={{ 
                                width: `${issue.overallAssessment.defendantStrength * 10}%`,
                                backgroundColor: getStrengthColor(issue.overallAssessment.defendantStrength)
                              }}
                            />
                            <span>{issue.overallAssessment.defendantStrength}</span>
                          </div>
                        </div>
                        
                        <div className="key-factors">
                          <strong>Key Factors:</strong>
                          <ul>
                            {issue.overallAssessment.keyFactors.slice(0, 2).map((factor, i) => (
                              <li key={i}>{factor}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {viewMode === 'strategic' && (
          <div className="strategic-view">
            <h4>🎯 Strategic Analysis & Recommendations</h4>
            
            {analyses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎯</div>
                <h3>No Strategic Analysis</h3>
                <p>Analyze skeleton arguments to receive strategic recommendations.</p>
              </div>
            ) : (
              <div className="strategic-sections">
                <div className="client-strengths section">
                  <h5>💪 Client's Strongest Arguments</h5>
                  {analyses
                    .filter(a => a.argument.partyType === 'claimant' && a.winProbability >= 70)
                    .map((analysis, i) => (
                      <div key={i} className="strategic-item strength">
                        <div className="item-header">
                          <strong>{analysis.argument.title}</strong>
                          <span className="probability">{analysis.winProbability}%</span>
                        </div>
                        <div className="item-content">
                          <p>{analysis.argument.proposition}</p>
                          <div className="strengths-list">
                            {analysis.strengths.map((strength, j) => (
                              <div key={j} className="strength-point">✅ {strength}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
                
                <div className="vulnerabilities section">
                  <h5>⚠️ Areas of Concern</h5>
                  {analyses
                    .filter(a => a.argument.partyType === 'claimant' && (a.winProbability < 60 || a.riskLevel === 'high'))
                    .map((analysis, i) => (
                      <div key={i} className="strategic-item weakness">
                        <div className="item-header">
                          <strong>{analysis.argument.title}</strong>
                          <span className={`risk-badge ${analysis.riskLevel}`}>
                            {analysis.riskLevel} risk
                          </span>
                        </div>
                        <div className="item-content">
                          <div className="weaknesses-list">
                            {analysis.weaknesses.map((weakness, j) => (
                              <div key={j} className="weakness-point">❌ {weakness}</div>
                            ))}
                          </div>
                          <div className="recommendations">
                            <strong>Recommendations:</strong>
                            {analysis.strategicRecommendations.map((rec, j) => (
                              <div key={j} className="recommendation">💡 {rec}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
                
                <div className="opponent-analysis section">
                  <h5>🔍 Opponent's Position Analysis</h5>
                  {analyses
                    .filter(a => a.argument.partyType === 'defendant')
                    .map((analysis, i) => (
                      <div key={i} className="strategic-item opponent">
                        <div className="item-header">
                          <strong>{analysis.argument.title}</strong>
                          <span className="probability">{analysis.winProbability}%</span>
                        </div>
                        <div className="item-content">
                          <p>{analysis.argument.proposition}</p>
                          <div className="counter-strategy">
                            <strong>Counter-Arguments:</strong>
                            {analysis.counterArguments.map((counter, j) => (
                              <div key={j} className="counter-point">🎯 {counter}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
                
                <div className="overall-strategy section">
                  <h5>📈 Overall Case Strategy</h5>
                  <div className="strategy-summary">
                    <div className="strength-overview">
                      <h6>Case Strength Overview</h6>
                      <div className="strength-metrics">
                        <div className="metric">
                          <span className="metric-label">Average Win Probability:</span>
                          <span className="metric-value">
                            {Math.round(analyses
                              .filter(a => a.argument.partyType === 'claimant')
                              .reduce((sum, a) => sum + a.winProbability, 0) / 
                              analyses.filter(a => a.argument.partyType === 'claimant').length
                            )}%
                          </span>
                        </div>
                        <div className="metric">
                          <span className="metric-label">High Risk Arguments:</span>
                          <span className="metric-value">
                            {analyses.filter(a => a.argument.partyType === 'claimant' && a.riskLevel === 'high').length}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="strategic-priorities">
                      <h6>Strategic Priorities</h6>
                      <div className="priorities-list">
                        <div className="priority">🔴 Address high-risk arguments first</div>
                        <div className="priority">🟡 Strengthen evidence for medium-probability arguments</div>
                        <div className="priority">🟢 Leverage strongest arguments in opening/closing</div>
                        <div className="priority">🎯 Prepare counter-arguments for opponent's strong points</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .skeletons-manager {
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
          background: linear-gradient(135deg, #6b46c1 0%, #3730a3 100%);
          border-radius: 16px;
          color: white;
        }

        .header-info h3 {
          margin: 0 0 4px 0;
          font-size: 24px;
        }

        .doc-count {
          margin: 0;
          opacity: 0.9;
        }

        .upload-btn {
          padding: 12px 20px;
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 8px;
          color: white;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .upload-btn:hover {
          background: rgba(255,255,255,0.3);
        }

        .upload-progress {
          margin-bottom: 20px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid #6b46c1;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background: #6b46c1;
          transition: width 0.3s ease;
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
          background: #6b46c1;
          color: white;
          border-color: #6b46c1;
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

        /* Documents View */
        .documents-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .document-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          padding: 20px;
        }

        .doc-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .doc-header h5 {
          margin: 0;
          font-size: 16px;
          color: #333;
        }

        .doc-party {
          font-size: 12px;
          padding: 4px 8px;
          background: #6b46c1;
          color: white;
          border-radius: 12px;
        }

        .doc-meta {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          font-size: 12px;
          color: #666;
        }

        .btn-analyze {
          padding: 8px 16px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-analyze:hover {
          background: #059669;
        }

        .btn-analyze:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        /* Arguments View */
        .arguments-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .filter-controls select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }

        .arguments-list {
          display: grid;
          gap: 20px;
        }

        .argument-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .argument-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: #f8f9fa;
          border-bottom: 1px solid #e0e0e0;
        }

        .argument-info h5 {
          margin: 0 0 8px 0;
          color: #333;
        }

        .argument-meta {
          display: flex;
          gap: 8px;
        }

        .party-badge {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 12px;
          font-weight: 600;
        }

        .party-badge.claimant {
          background: #e3f2fd;
          color: #1976d2;
        }

        .party-badge.defendant {
          background: #fce4ec;
          color: #c2185b;
        }

        .category-badge {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 12px;
          font-weight: 600;
        }

        .category-badge.legal {
          background: #f3e5f5;
          color: #7b1fa2;
        }

        .category-badge.factual {
          background: #e8f5e8;
          color: #2e7d32;
        }

        .category-badge.procedural {
          background: #fff3e0;
          color: #f57c00;
        }

        .category-badge.quantum {
          background: #ffebee;
          color: #c62828;
        }

        .analysis-indicators {
          display: flex;
          gap: 8px;
        }

        .win-probability,
        .risk-level {
          padding: 4px 8px;
          border-radius: 4px;
          color: white;
          font-size: 12px;
          font-weight: 600;
        }

        .argument-content {
          padding: 20px;
        }

        .proposition {
          margin-bottom: 12px;
          font-size: 14px;
        }

        .description {
          margin-bottom: 16px;
          color: #555;
          line-height: 1.5;
        }

        .authorities {
          margin-bottom: 16px;
        }

        .authorities ul,
        .analysis-summary ul {
          margin: 8px 0;
          padding-left: 20px;
        }

        .analysis-summary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e0e0e0;
        }

        .strengths,
        .weaknesses {
          font-size: 14px;
        }

        /* Comparative View */
        .comparative-table {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .table-header {
          display: grid;
          grid-template-columns: 1.5fr 2fr 2fr 1.5fr;
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
          grid-template-columns: 1.5fr 2fr 2fr 1.5fr;
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

        .position-entry {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .position-entry:last-child {
          margin-bottom: 0;
        }

        .position-strength {
          flex-shrink: 0;
        }

        .strength-indicator {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          color: white;
          font-size: 12px;
          font-weight: 600;
        }

        .position-content {
          flex: 1;
        }

        .position-content strong {
          display: block;
          margin-bottom: 4px;
          color: #333;
        }

        .position-content p {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #555;
        }

        .position-analysis {
          font-size: 12px;
        }

        .position-analysis .strengths {
          color: #2e7d32;
          margin-bottom: 4px;
        }

        .position-analysis .weaknesses {
          color: #d32f2f;
        }

        .no-position {
          padding: 20px;
          text-align: center;
          color: #999;
          font-style: italic;
        }

        .strength-comparison {
          padding: 12px;
        }

        .strength-bar {
          margin-bottom: 16px;
        }

        .claimant-strength,
        .defendant-strength {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .claimant-strength span:first-child,
        .defendant-strength span:first-child {
          width: 80px;
          font-size: 12px;
          font-weight: 500;
        }

        .strength-fill {
          height: 8px;
          border-radius: 4px;
          flex: 1;
        }

        .claimant-strength span:last-child,
        .defendant-strength span:last-child {
          width: 30px;
          text-align: right;
          font-size: 12px;
          font-weight: 600;
        }

        .key-factors ul {
          margin: 8px 0;
          padding-left: 16px;
          font-size: 12px;
        }

        /* Strategic View */
        .strategic-sections {
          display: grid;
          gap: 24px;
        }

        .section {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          padding: 24px;
        }

        .section h5 {
          margin: 0 0 20px 0;
          font-size: 18px;
          color: #333;
        }

        .strategic-item {
          margin-bottom: 20px;
          padding: 16px;
          border-radius: 8px;
          border-left: 4px solid;
        }

        .strategic-item.strength {
          background: #f1f8e9;
          border-left-color: #4caf50;
        }

        .strategic-item.weakness {
          background: #ffebee;
          border-left-color: #f44336;
        }

        .strategic-item.opponent {
          background: #f3e5f5;
          border-left-color: #9c27b0;
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .item-header strong {
          color: #333;
        }

        .probability {
          font-weight: 600;
          color: #666;
        }

        .risk-badge {
          padding: 4px 8px;
          border-radius: 4px;
          color: white;
          font-size: 12px;
          font-weight: 600;
        }

        .risk-badge.high {
          background: #f44336;
        }

        .risk-badge.medium {
          background: #ff9800;
        }

        .risk-badge.low {
          background: #4caf50;
        }

        .item-content p {
          margin: 0 0 12px 0;
          color: #555;
        }

        .strengths-list,
        .weaknesses-list,
        .counter-strategy,
        .recommendations {
          margin-bottom: 12px;
        }

        .strength-point {
          margin-bottom: 4px;
          font-size: 14px;
          color: #2e7d32;
        }

        .weakness-point {
          margin-bottom: 4px;
          font-size: 14px;
          color: #d32f2f;
        }

        .counter-point {
          margin-bottom: 4px;
          font-size: 14px;
          color: #7b1fa2;
        }

        .recommendation {
          margin-bottom: 4px;
          font-size: 14px;
          color: #1976d2;
        }

        .strategy-summary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .strength-overview,
        .strategic-priorities {
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .strength-overview h6,
        .strategic-priorities h6 {
          margin: 0 0 12px 0;
          color: #333;
        }

        .strength-metrics {
          display: grid;
          gap: 8px;
        }

        .metric {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
        }

        .metric-label {
          color: #666;
        }

        .metric-value {
          font-weight: 600;
          color: #333;
        }

        .priorities-list {
          display: grid;
          gap: 8px;
        }

        .priority {
          padding: 8px;
          background: white;
          border-radius: 4px;
          font-size: 14px;
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

          .strategy-summary {
            grid-template-columns: 1fr;
          }

          .analysis-summary {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};