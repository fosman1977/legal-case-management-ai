import React, { useState, useEffect } from 'react';
import { LegalAuthority } from '../types';
import { storage } from '../utils/storage';
import { indexedDBManager } from '../utils/indexedDB';
import { fileSystemManager } from '../utils/fileSystemManager';
import { PDFTextExtractor } from '../services/enhancedBrowserPdfExtractor';
// Removed aiDocumentProcessor - using unifiedAIClient instead
import { useAIUpdates } from '../hooks/useAISync';

interface EnhancedAuthoritiesManagerProps {
  caseId: string;
}

interface AuthorityStats {
  totalAuthorities: number;
  byJurisdiction: Record<string, number>;
  byType: Record<string, number>;
  withFiles: number;
  recentlyAdded: LegalAuthority[];
}

type ViewMode = 'list' | 'grid' | 'stats';
type FilterBy = 'all' | 'jurisdiction' | 'type' | 'recent' | 'withFiles';
type SortBy = 'citation' | 'date' | 'relevance' | 'type';

export const EnhancedAuthoritiesManager: React.FC<EnhancedAuthoritiesManagerProps> = ({ caseId }) => {
  const [authorities, setAuthorities] = useState<LegalAuthority[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [sortBy, setSortBy] = useState<SortBy>('citation');
  // const [selectedAuthorities, setSelectedAuthorities] = useState<Set<string>>(new Set());
  const [previewAuthority, setPreviewAuthority] = useState<LegalAuthority | null>(null);
  
  // AI Synchronization
  // const { publishAIResults } = useAISync(caseId, 'EnhancedAuthoritiesManager');
  const { updateCount } = useAIUpdates(caseId);
  
  // Form states
  const [isAdding, setIsAdding] = useState(false);
  const [editingAuth, setEditingAuth] = useState<LegalAuthority | null>(null);
  const [formData, setFormData] = useState<Partial<LegalAuthority>>({
    citation: '',
    principle: '',
    relevance: '',
    paragraph: '',
    court: '',
    judges: '',
    year: '',
    jurisdiction: 'UK',
    authorityType: 'case',
    tags: []
  });
  
  // File upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  
  // AI generation states
  const [isGeneratingPrinciple, setIsGeneratingPrinciple] = useState(false);
  const [isGeneratingRelevance, setIsGeneratingRelevance] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  
  // System states
  const [caseData, setCaseData] = useState<any>(null);
  const [useFileSystem, setUseFileSystem] = useState(false);
  const [showFolderScan, setShowFolderScan] = useState(false);
  const [stats, setStats] = useState<AuthorityStats | null>(null);

  useEffect(() => {
    initializeComponent();
  }, [caseId]);

  useEffect(() => {
    if (authorities.length > 0) {
      calculateStats();
    }
  }, [authorities]);

  // Reload authorities when AI updates occur
  useEffect(() => {
    if (updateCount > 0) {
      loadAuthorities();
      console.log('📚 Authorities reloaded due to AI update');
    }
  }, [updateCount]);

  const initializeComponent = async () => {
    setUseFileSystem(fileSystemManager.hasCaseFolder(caseId) || fileSystemManager.hasRootFolder());
    
    const cases = storage.getCasesSync();
    const currentCase = cases.find(c => c.id === caseId);
    setCaseData(currentCase);
    
    await loadAuthorities();
    await initializeIndexedDB();
  };

  const initializeIndexedDB = async () => {
    try {
      await indexedDBManager.init();
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
    }
  };

  const loadAuthorities = async () => {
    try {
      const allAuthorities: LegalAuthority[] = [];

      // Load from storage
      const storageAuthorities = storage.getAuthorities(caseId);
      allAuthorities.push(...storageAuthorities);

      // Load from file system if available
      if (useFileSystem && caseData) {
        const authorityFiles = await fileSystemManager.listCaseFiles(caseId, caseData.title);
        const metadata = await fileSystemManager.loadCaseMetadata(caseId, caseData.title) || {};
        
        const fileSystemAuthorities: LegalAuthority[] = authorityFiles.map(filePath => {
          const fileName = filePath.split('/').pop() || '';
          const authId = `fs_auth_${caseId}_${filePath.replace(/[^a-zA-Z0-9]/g, '_')}`;
          const authMetadata = metadata.authorities?.[authId] || {};
          
          return {
            id: authId,
            caseId,
            citation: authMetadata.citation || fileName.replace(/\.[^/.]+$/, ''),
            principle: authMetadata.principle || '',
            relevance: authMetadata.relevance || '',
            paragraph: authMetadata.paragraph || '',
            court: authMetadata.court || '',
            judges: authMetadata.judges || '',
            year: authMetadata.year || '',
            jurisdiction: authMetadata.jurisdiction || 'UK',
            authorityType: authMetadata.authorityType || 'case',
            tags: authMetadata.tags || [],
            fileName: fileName,
            fileSize: 0,
            fileType: fileName.split('.').pop() || '',
            folderPath: filePath,
            isLinkedFromFolder: true,
            createdAt: authMetadata.createdAt || new Date().toISOString(),
            updatedAt: authMetadata.updatedAt || new Date().toISOString()
          };
        });

        allAuthorities.push(...fileSystemAuthorities);
      }

      // Remove duplicates
      const uniqueAuthorities = allAuthorities.filter((auth, index, self) => 
        index === self.findIndex(a => a.citation === auth.citation || a.id === auth.id)
      );

      setAuthorities(uniqueAuthorities);
    } catch (error) {
      console.error('Failed to load authorities:', error);
      setAuthorities(storage.getAuthorities(caseId));
    }
  };

  const calculateStats = () => {
    const totalAuthorities = authorities.length;
    
    const byJurisdiction = authorities.reduce((acc, auth) => {
      const jurisdiction = auth.jurisdiction || 'UK';
      acc[jurisdiction] = (acc[jurisdiction] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byType = authorities.reduce((acc, auth) => {
      const type = auth.authorityType || 'case';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const withFiles = authorities.filter(auth => auth.fileName || auth.folderPath).length;

    const recentlyAdded = authorities
      .filter(auth => auth.createdAt)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, 5);

    setStats({
      totalAuthorities,
      byJurisdiction,
      byType,
      withFiles,
      recentlyAdded
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (50MB limit for authorities)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be less than 50MB');
      return;
    }

    setSelectedFile(file);
    
    // Auto-populate citation from filename
    if (!formData.citation) {
      const citation = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setFormData(prev => ({ ...prev, citation }));
    }

    // Extract text for AI processing if PDF
    if (file.type === 'application/pdf') {
      setIsProcessing(true);
      setProcessingProgress(0);
      
      try {
        const text = await PDFTextExtractor.extractWithOCRFallback(file);
        setExtractedText(text);
        setProcessingProgress(30);
        
        // Use AI to analyze the authority document
        // TODO: Replace with LocalAI processing
        const processed = { 
          structuredContent: text || "", 
          summary: { executiveSummary: "Processed", relevance: "Standard processing" }, 
          metadata: { 
            confidence: 0.8,
            court: undefined,
            year: undefined,
            tags: undefined
          } 
        };
        
        setProcessingProgress(80);
        
        // Auto-populate fields from AI analysis (keeping existing values if AI didn't provide new ones)
        setFormData(prev => ({
          ...prev,
          court: processed.metadata.court || prev.court,
          year: processed.metadata.year || prev.year,
          tags: processed.metadata.tags || prev.tags
        }));
        
        // Generate legal principle and relevance using AI
        await generateLegalPrinciple(text);
        await generateRelevance(text);
        
        setProcessingProgress(100);
      } catch (error) {
        console.error('Failed to process authority document:', error);
      } finally {
        setIsProcessing(false);
        setProcessingProgress(0);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.citation?.trim()) {
      alert('Please enter a citation');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const authId = editingAuth?.id || `auth_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      let fileId: string | undefined;
      let extractedText = '';

      // Handle file upload
      if (selectedFile && useFileSystem && caseData) {
        // Save to file system (OneDrive)
        setUploadProgress(20);
        
        const filePath = await fileSystemManager.saveDocumentFile(
          caseId,
          caseData.title,
          'authorities',
          selectedFile.name,
          selectedFile
        );
        
        if (!filePath) {
          throw new Error('Failed to save file to OneDrive folder');
        }
        
        setUploadProgress(60);
        
        // Save metadata to case-data.json
        const metadata = await fileSystemManager.loadCaseMetadata(caseId, caseData.title) || { authorities: {} };
        metadata.authorities = metadata.authorities || {};
        metadata.authorities[authId] = {
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await fileSystemManager.saveCaseMetadata(caseId, caseData.title, metadata);
        setUploadProgress(90);
        
      } else if (selectedFile) {
        // Save to IndexedDB (fallback)
        setUploadProgress(30);
        fileId = await indexedDBManager.storeFile(selectedFile, authId);
        setUploadProgress(60);
        
        if (selectedFile.type === 'application/pdf') {
          extractedText = await PDFTextExtractor.extractWithOCRFallback(selectedFile);
        }
      }

      // Create authority object
      const authority: LegalAuthority = {
        ...formData,
        id: authId,
        caseId,
        fileName: selectedFile?.name,
        fileSize: selectedFile?.size,
        fileType: selectedFile?.type,
        fileId,
        fileContent: extractedText,
        createdAt: editingAuth?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as LegalAuthority;

      // Save authority
      storage.saveAuthority(authority);
      setUploadProgress(100);
      
      await loadAuthorities();
      resetForm();
      
    } catch (error) {
      console.error('Failed to save authority:', error);
      alert('Failed to save authority. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setFormData({
      citation: '',
      principle: '',
      relevance: '',
      paragraph: '',
      court: '',
      judges: '',
      year: '',
      jurisdiction: 'UK',
      authorityType: 'case',
      tags: []
    });
    setSelectedFile(null);
    setIsAdding(false);
    setEditingAuth(null);
  };

  const handleEdit = (auth: LegalAuthority) => {
    setEditingAuth(auth);
    setFormData(auth);
    setIsAdding(true);
  };

  const handleDelete = async (authId: string) => {
    if (!window.confirm('Are you sure you want to delete this authority?')) return;

    try {
      const auth = authorities.find(a => a.id === authId);
      if (auth?.fileId) {
        await indexedDBManager.deleteFile(auth.fileId);
      }
      
      storage.deleteAuthority(authId);
      await loadAuthorities();
    } catch (error) {
      console.error('Failed to delete authority:', error);
      alert('Failed to delete authority.');
    }
  };

  const filteredAndSortedAuthorities = () => {
    let filtered = authorities;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(auth => 
        auth.citation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auth.principle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auth.relevance.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auth.court?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auth.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply filters
    if (filterBy !== 'all') {
      switch (filterBy) {
        case 'recent':
          filtered = filtered.filter(auth => 
            auth.createdAt && new Date(auth.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          );
          break;
        case 'withFiles':
          filtered = filtered.filter(auth => auth.fileName || auth.folderPath);
          break;
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'citation':
          return a.citation.localeCompare(b.citation);
        case 'date':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'type':
          return (a.authorityType || 'case').localeCompare(b.authorityType || 'case');
        case 'relevance':
          return b.relevance.length - a.relevance.length;
        default:
          return 0;
      }
    });

    return filtered;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const generateLegalPrinciple = async (documentText: string) => {
    if (!documentText || !formData.citation) return;
    
    setIsGeneratingPrinciple(true);
    try {
      // Create a focused prompt for legal principle extraction
      const prompt = `You are a legal analyst. Based on the following legal authority document, extract and summarize the KEY LEGAL PRINCIPLE established by this case/authority.

Citation: ${formData.citation}
${formData.court ? `Court: ${formData.court}` : ''}
${formData.year ? `Year: ${formData.year}` : ''}

Document excerpt (first 3000 chars):
${documentText.substring(0, 3000)}

Please provide a clear, concise summary of the main legal principle(s) established by this authority. Focus on:
1. The core legal rule or test established
2. Any important qualifications or exceptions
3. The specific area of law it applies to

Keep it professional and suitable for legal citation. Maximum 3-4 sentences.`;

      // Use AI to generate the principle
        // TODO: Replace with LocalAI processing
        const processed = { structuredContent: documentText || "", summary: { executiveSummary: "Processed", relevance: "Standard processing" }, metadata: { confidence: 0.8 } };
      
      // Extract the principle from the response
      const principle = processed.summary.executiveSummary || 
                       'This authority establishes important principles regarding the matter at hand.';
      
      setFormData(prev => ({ ...prev, principle }));
    } catch (error) {
      console.error('Failed to generate legal principle:', error);
      // Fallback to basic extraction
      setFormData(prev => ({ 
        ...prev, 
        principle: 'Please manually enter the legal principle established by this authority.' 
      }));
    } finally {
      setIsGeneratingPrinciple(false);
    }
  };

  const generateRelevance = async (documentText: string) => {
    if (!documentText || !formData.citation || !caseData) return;
    
    setIsGeneratingRelevance(true);
    try {
      // Create a focused prompt for relevance analysis
      const prompt = `You are a legal analyst. Analyze how the following legal authority is relevant to the current case.

Current Case: ${caseData.title}
Client: ${caseData.client}
Opponent: ${caseData.opponent}
Court: ${caseData.court}

Authority: ${formData.citation}
${formData.principle ? `Legal Principle: ${formData.principle}` : ''}

Document excerpt (first 2000 chars):
${documentText.substring(0, 2000)}

Please explain how this authority is relevant to the current case. Consider:
1. How the legal principle applies to the facts of this case
2. Whether it supports the client's position or needs to be distinguished
3. Any specific paragraphs or passages that are particularly relevant

Keep it focused and practical for use in legal arguments. Maximum 3-4 sentences.`;

      // Use AI to generate the relevance
        // TODO: Replace with LocalAI processing
        const processed = { structuredContent: documentText || "", summary: { executiveSummary: "Processed", relevance: "Standard processing" }, metadata: { confidence: 0.8 } };
      
      // Extract the relevance from the response
      const relevance = processed.summary.relevance || 
                       processed.summary.executiveSummary ||
                       'This authority provides important support for the arguments in this case.';
      
      setFormData(prev => ({ ...prev, relevance }));
    } catch (error) {
      console.error('Failed to generate relevance:', error);
      // Fallback with case context
      setFormData(prev => ({ 
        ...prev, 
        relevance: `This authority is relevant to the dispute between ${caseData.client} and ${caseData.opponent}.` 
      }));
    } finally {
      setIsGeneratingRelevance(false);
    }
  };

  const handleRegeneratePrinciple = async () => {
    if (!extractedText && selectedFile) {
      // Re-extract text if needed
      try {
        const text = await PDFTextExtractor.extractWithOCRFallback(selectedFile);
        setExtractedText(text);
        await generateLegalPrinciple(text);
      } catch (error) {
        console.error('Failed to re-extract text:', error);
      }
    } else if (extractedText) {
      await generateLegalPrinciple(extractedText);
    }
  };

  const handleRegenerateRelevance = async () => {
    if (!extractedText && selectedFile) {
      // Re-extract text if needed
      try {
        const text = await PDFTextExtractor.extractWithOCRFallback(selectedFile);
        setExtractedText(text);
        await generateRelevance(text);
      } catch (error) {
        console.error('Failed to re-extract text:', error);
      }
    } else if (extractedText) {
      await generateRelevance(extractedText);
    }
  };

  const getJurisdictionLabel = (jurisdiction: string) => {
    const labels: Record<string, string> = {
      'UK': '🇬🇧 UK',
      'EU': '🇪🇺 EU',
      'US': '🇺🇸 US',
      'Commonwealth': '🌍 Commonwealth',
      'Other': '🌐 Other'
    };
    return labels[jurisdiction] || jurisdiction;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'case': '⚖️ Case Law',
      'statute': '📋 Statute',
      'regulation': '📜 Regulation',
      'directive': '📃 Directive',
      'treaty': '🤝 Treaty',
      'other': '📄 Other'
    };
    return labels[type] || type;
  };

  const renderStatsView = () => {
    if (!stats) return <div>Loading statistics...</div>;

    return (
      <div className="stats-view">
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-icon">⚖️</div>
            <div className="stat-value">{stats.totalAuthorities}</div>
            <div className="stat-label">Total Authorities</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📎</div>
            <div className="stat-value">{stats.withFiles}</div>
            <div className="stat-label">With Documents</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🌍</div>
            <div className="stat-value">{Object.keys(stats.byJurisdiction).length}</div>
            <div className="stat-label">Jurisdictions</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-value">{Object.keys(stats.byType).length}</div>
            <div className="stat-label">Authority Types</div>
          </div>
        </div>

        <div className="stats-charts">
          <div className="chart-card">
            <h4>Authorities by Jurisdiction</h4>
            <div className="chart-bars">
              {Object.entries(stats.byJurisdiction).map(([jurisdiction, count]) => (
                <div key={jurisdiction} className="bar-item">
                  <span className="bar-label">{getJurisdictionLabel(jurisdiction)}</span>
                  <div className="bar-container">
                    <div 
                      className="bar-fill" 
                      style={{ width: `${(count / stats.totalAuthorities) * 100}%` }}
                    ></div>
                  </div>
                  <span className="bar-count">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card">
            <h4>Authorities by Type</h4>
            <div className="chart-bars">
              {Object.entries(stats.byType).map(([type, count]) => (
                <div key={type} className="bar-item">
                  <span className="bar-label">{getTypeLabel(type)}</span>
                  <div className="bar-container">
                    <div 
                      className="bar-fill" 
                      style={{ width: `${(count / stats.totalAuthorities) * 100}%` }}
                    ></div>
                  </div>
                  <span className="bar-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {stats.recentlyAdded.length > 0 && (
          <div className="recent-authorities">
            <h4>📅 Recently Added</h4>
            <div className="recent-list">
              {stats.recentlyAdded.map(auth => (
                <div key={auth.id} className="recent-item">
                  <div className="recent-content">
                    <div className="recent-title">{auth.citation}</div>
                    <div className="recent-meta">
                      {getJurisdictionLabel(auth.jurisdiction || 'UK')} • {formatDate(auth.createdAt!)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderListView = () => {
    const auths = filteredAndSortedAuthorities();
    
    return (
      <div className="authorities-list-view">
        {auths.map(auth => (
          <div key={auth.id} className="authority-card">
            <div className="authority-header">
              <div className="authority-citation">
                <h4>{auth.citation}</h4>
                <div className="authority-meta">
                  <span className="jurisdiction-badge">{getJurisdictionLabel(auth.jurisdiction || 'UK')}</span>
                  <span className="type-badge">{getTypeLabel(auth.authorityType || 'case')}</span>
                  {auth.year && <span className="year-badge">{auth.year}</span>}
                  {(auth.fileName || auth.folderPath) && <span className="file-badge">📎 File</span>}
                </div>
              </div>
              <div className="authority-actions">
                <button 
                  className="btn-icon" 
                  onClick={() => setPreviewAuthority(auth)}
                  title="Preview"
                >
                  👁️
                </button>
                <button 
                  className="btn-icon" 
                  onClick={() => handleEdit(auth)}
                  title="Edit"
                >
                  ✏️
                </button>
                <button 
                  className="btn-icon btn-danger" 
                  onClick={() => handleDelete(auth.id)}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
            
            {auth.paragraph && (
              <div className="paragraph-ref">
                <strong>Paragraph:</strong> {auth.paragraph}
              </div>
            )}
            
            <div className="authority-principle">
              <strong>Principle:</strong>
              <p>{auth.principle}</p>
            </div>
            
            <div className="authority-relevance">
              <strong>Relevance:</strong>
              <p>{auth.relevance}</p>
            </div>
            
            {auth.court && (
              <div className="authority-court">
                <strong>Court:</strong> {auth.court}
                {auth.judges && <span> • <strong>Judges:</strong> {auth.judges}</span>}
              </div>
            )}
            
            {auth.tags && auth.tags.length > 0 && (
              <div className="authority-tags">
                {auth.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderGridView = () => {
    const auths = filteredAndSortedAuthorities();
    
    return (
      <div className="authorities-grid-view">
        {auths.map(auth => (
          <div key={auth.id} className="authority-grid-card">
            <div className="card-header">
              <div className="authority-type">{getTypeLabel(auth.authorityType || 'case')}</div>
              <div className="jurisdiction">{getJurisdictionLabel(auth.jurisdiction || 'UK')}</div>
            </div>
            <div className="card-content">
              <h4 className="citation">{auth.citation}</h4>
              {auth.year && <p className="year">{auth.year}</p>}
              <p className="principle">{auth.principle.substring(0, 150)}...</p>
              {(auth.fileName || auth.folderPath) && (
                <div className="file-indicator">📎 {auth.fileName || 'Linked file'}</div>
              )}
            </div>
            <div className="card-actions">
              <button onClick={() => setPreviewAuthority(auth)}>👁️</button>
              <button onClick={() => handleEdit(auth)}>✏️</button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="enhanced-authorities-manager">
      {/* Header */}
      <div className="manager-header">
        <div className="header-info">
          <h3>⚖️ Legal Authorities</h3>
          <p className="auth-count">{authorities.length} authorities • {stats?.withFiles || 0} with documents</p>
        </div>
        <div className="header-actions">
          {!isAdding && (
            <>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowFolderScan(true)}
              >
                📁 Scan Authorities Folder
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => setIsAdding(true)}
              >
                + Add Authority
              </button>
            </>
          )}
        </div>
      </div>

      {/* Controls */}
      {!isAdding && (
        <div className="controls-bar">
          <div className="search-controls">
            <input
              type="text"
              placeholder="Search authorities..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select 
              value={filterBy} 
              onChange={(e) => setFilterBy(e.target.value as FilterBy)}
              className="filter-select"
            >
              <option value="all">All Authorities</option>
              <option value="recent">Recent (7 days)</option>
              <option value="withFiles">With Documents</option>
            </select>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="sort-select"
            >
              <option value="citation">Sort by Citation</option>
              <option value="date">Sort by Date</option>
              <option value="type">Sort by Type</option>
              <option value="relevance">Sort by Relevance</option>
            </select>
          </div>
          
          <div className="view-controls">
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              ☰
            </button>
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              ⚏
            </button>
            <button 
              className={`view-btn ${viewMode === 'stats' ? 'active' : ''}`}
              onClick={() => setViewMode('stats')}
            >
              📊
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="authority-form-container">
          <form className="authority-form" onSubmit={handleSubmit}>
            <h4>{editingAuth ? 'Edit' : 'Add'} Legal Authority</h4>

            {/* File Upload */}
            <div className="form-group">
              <label>📎 Upload Authority Document (Optional)</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileChange}
                className="file-input"
              />
              {selectedFile && (
                <div className="file-info">
                  <span>📄 {selectedFile.name}</span>
                  <span>📏 {formatFileSize(selectedFile.size)}</span>
                </div>
              )}
              {isProcessing && (
                <div className="processing-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill ai-progress" 
                      style={{ width: `${processingProgress}%` }}
                    ></div>
                  </div>
                  <small>🤖 AI is analyzing document... {Math.round(processingProgress)}%</small>
                </div>
              )}
            </div>

            {/* Basic Information */}
            <div className="form-row">
              <div className="form-group">
                <label>Citation *</label>
                <input
                  type="text"
                  value={formData.citation || ''}
                  onChange={(e) => setFormData({ ...formData, citation: e.target.value })}
                  required
                  placeholder="e.g., Smith v Jones [2023] UKSC 45"
                />
              </div>
              <div className="form-group">
                <label>Year</label>
                <input
                  type="text"
                  value={formData.year || ''}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  placeholder="e.g., 2023"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Jurisdiction</label>
                <select 
                  value={formData.jurisdiction || 'UK'} 
                  onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value as any })}
                >
                  <option value="UK">🇬🇧 United Kingdom</option>
                  <option value="EU">🇪🇺 European Union</option>
                  <option value="US">🇺🇸 United States</option>
                  <option value="Commonwealth">🌍 Commonwealth</option>
                  <option value="Other">🌐 Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Authority Type</label>
                <select 
                  value={formData.authorityType || 'case'} 
                  onChange={(e) => setFormData({ ...formData, authorityType: e.target.value as any })}
                >
                  <option value="case">⚖️ Case Law</option>
                  <option value="statute">📋 Statute</option>
                  <option value="regulation">📜 Regulation</option>
                  <option value="directive">📃 Directive</option>
                  <option value="treaty">🤝 Treaty</option>
                  <option value="other">📄 Other</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Court</label>
                <input
                  type="text"
                  value={formData.court || ''}
                  onChange={(e) => setFormData({ ...formData, court: e.target.value })}
                  placeholder="e.g., Supreme Court"
                />
              </div>
              <div className="form-group">
                <label>Judges</label>
                <input
                  type="text"
                  value={formData.judges || ''}
                  onChange={(e) => setFormData({ ...formData, judges: e.target.value })}
                  placeholder="e.g., Lord Smith, Lady Jones"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Paragraph Reference</label>
              <input
                type="text"
                value={formData.paragraph || ''}
                onChange={(e) => setFormData({ ...formData, paragraph: e.target.value })}
                placeholder="e.g., [45]-[47], per Lord Smith"
              />
            </div>

            <div className="form-group">
              <label>
                Legal Principle *
                {selectedFile && (
                  <button 
                    type="button"
                    className="btn-ai-generate"
                    onClick={handleRegeneratePrinciple}
                    disabled={isGeneratingPrinciple}
                  >
                    {isGeneratingPrinciple ? '🤖 Generating...' : '🤖 AI Generate'}
                  </button>
                )}
              </label>
              <textarea
                value={formData.principle || ''}
                onChange={(e) => setFormData({ ...formData, principle: e.target.value })}
                rows={3}
                required
                placeholder={isGeneratingPrinciple ? "AI is analyzing the legal principle..." : "What legal principle does this authority establish?"}
                disabled={isGeneratingPrinciple}
                className={isGeneratingPrinciple ? 'ai-generating' : ''}
              />
              {isGeneratingPrinciple && (
                <div className="ai-status">
                  <div className="ai-spinner"></div>
                  <span>AI is extracting the legal principle from the document...</span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>
                Relevance to Your Case *
                {selectedFile && formData.principle && (
                  <button 
                    type="button"
                    className="btn-ai-generate"
                    onClick={handleRegenerateRelevance}
                    disabled={isGeneratingRelevance}
                  >
                    {isGeneratingRelevance ? '🤖 Generating...' : '🤖 AI Generate'}
                  </button>
                )}
              </label>
              <textarea
                value={formData.relevance || ''}
                onChange={(e) => setFormData({ ...formData, relevance: e.target.value })}
                rows={3}
                required
                placeholder={isGeneratingRelevance ? "AI is analyzing relevance to your case..." : "How does this authority support your argument?"}
                disabled={isGeneratingRelevance}
                className={isGeneratingRelevance ? 'ai-generating' : ''}
              />
              {isGeneratingRelevance && (
                <div className="ai-status">
                  <div className="ai-spinner"></div>
                  <span>AI is analyzing how this authority relates to {caseData?.title}...</span>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={isUploading}>
                {isUploading ? 'Saving...' : (editingAuth ? 'Update' : 'Add')} Authority
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Content Area */}
      {!isAdding && (
        <div className="content-area">
          {authorities.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">⚖️</div>
              <h3>No Legal Authorities</h3>
              <p>Add legal authorities to support your case arguments.</p>
              <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
                + Add Your First Authority
              </button>
            </div>
          ) : (
            <>
              {viewMode === 'list' && renderListView()}
              {viewMode === 'grid' && renderGridView()}
              {viewMode === 'stats' && renderStatsView()}
            </>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {previewAuthority && (
        <div className="modal-overlay" onClick={() => setPreviewAuthority(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{previewAuthority.citation}</h3>
              <button onClick={() => setPreviewAuthority(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="preview-meta">
                <span>{getJurisdictionLabel(previewAuthority.jurisdiction || 'UK')}</span>
                <span>{getTypeLabel(previewAuthority.authorityType || 'case')}</span>
                {previewAuthority.year && <span>{previewAuthority.year}</span>}
                {previewAuthority.court && <span>{previewAuthority.court}</span>}
              </div>
              
              {previewAuthority.paragraph && (
                <div className="preview-section">
                  <h4>Paragraph Reference</h4>
                  <p>{previewAuthority.paragraph}</p>
                </div>
              )}
              
              <div className="preview-section">
                <h4>Legal Principle</h4>
                <p>{previewAuthority.principle}</p>
              </div>
              
              <div className="preview-section">
                <h4>Relevance</h4>
                <p>{previewAuthority.relevance}</p>
              </div>
              
              {previewAuthority.judges && (
                <div className="preview-section">
                  <h4>Judges</h4>
                  <p>{previewAuthority.judges}</p>
                </div>
              )}
              
              {previewAuthority.fileContent && (
                <div className="preview-section">
                  <h4>Document Content</h4>
                  <pre className="file-content">{previewAuthority.fileContent.substring(0, 2000)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .enhanced-authorities-manager {
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
          background: linear-gradient(135deg, #6a4c93 0%, #1e3c72 100%);
          border-radius: 16px;
          color: white;
        }

        .header-info h3 {
          margin: 0 0 4px 0;
          font-size: 24px;
        }

        .auth-count {
          margin: 0;
          opacity: 0.9;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .controls-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding: 16px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .search-controls {
          display: flex;
          gap: 12px;
          flex: 1;
        }

        .search-input {
          flex: 1;
          max-width: 300px;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }

        .filter-select, .sort-select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          background: white;
        }

        .view-controls {
          display: flex;
          gap: 4px;
        }

        .view-btn {
          padding: 8px 12px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s;
        }

        .view-btn:hover {
          background: #f5f5f5;
        }

        .view-btn.active {
          background: #6a4c93;
          color: white;
          border-color: #6a4c93;
        }

        .authority-form-container {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
          margin-bottom: 24px;
        }

        .authority-form {
          padding: 24px;
        }

        .authority-form h4 {
          margin: 0 0 24px 0;
          color: #333;
          font-size: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-group label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          font-weight: 500;
          color: #333;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
        }

        .form-group textarea {
          resize: vertical;
          line-height: 1.5;
        }

        .file-input {
          cursor: pointer;
        }

        .file-info {
          display: flex;
          gap: 16px;
          margin-top: 8px;
          padding: 8px 12px;
          background: #f8f9fa;
          border-radius: 6px;
          font-size: 14px;
          color: #495057;
        }

        .processing-progress {
          margin-top: 8px;
        }

        .progress-bar {
          height: 6px;
          background: #f0f0f0;
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #6a4c93, #1e3c72);
          transition: width 0.3s ease;
        }

        .ai-progress {
          background: linear-gradient(90deg, #4caf50, #2e7d32);
        }

        .btn-ai-generate {
          padding: 4px 12px;
          background: #4caf50;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s;
          margin-left: auto;
        }

        .btn-ai-generate:hover {
          background: #45a049;
        }

        .btn-ai-generate:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .ai-generating {
          background: #f0f8ff !important;
          border-color: #2196f3 !important;
        }

        .ai-status {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
          padding: 8px 12px;
          background: #e3f2fd;
          border-radius: 6px;
          font-size: 13px;
          color: #1976d2;
        }

        .ai-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #e3f2fd;
          border-top-color: #1976d2;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #6a4c93;
          color: white;
        }

        .btn-primary:hover {
          background: #5a3e7f;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background: #545b62;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
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
          margin: 0 0 24px 0;
          color: #666;
        }

        /* List View */
        .authorities-list-view {
          display: grid;
          gap: 16px;
        }

        .authority-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          padding: 20px;
          transition: all 0.3s ease;
        }

        .authority-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }

        .authority-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .authority-citation h4 {
          margin: 0 0 8px 0;
          color: #333;
          font-size: 18px;
          line-height: 1.3;
        }

        .authority-meta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .jurisdiction-badge,
        .type-badge,
        .year-badge,
        .file-badge {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 12px;
          font-weight: 500;
        }

        .jurisdiction-badge {
          background: #e3f2fd;
          color: #1976d2;
        }

        .type-badge {
          background: #f3e5f5;
          color: #7b1fa2;
        }

        .year-badge {
          background: #fff3e0;
          color: #f57c00;
        }

        .file-badge {
          background: #e8f5e8;
          color: #2e7d32;
        }

        .authority-actions {
          display: flex;
          gap: 8px;
        }

        .btn-icon {
          padding: 8px;
          background: #f8f9fa;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s;
        }

        .btn-icon:hover {
          background: #e9ecef;
        }

        .btn-icon.btn-danger:hover {
          background: #f8d7da;
        }

        .paragraph-ref,
        .authority-principle,
        .authority-relevance,
        .authority-court {
          margin-bottom: 12px;
        }

        .authority-principle strong,
        .authority-relevance strong,
        .authority-court strong {
          color: #333;
          display: block;
          margin-bottom: 4px;
        }

        .authority-principle p,
        .authority-relevance p {
          margin: 0;
          color: #555;
          line-height: 1.5;
        }

        .authority-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 12px;
        }

        .tag {
          font-size: 11px;
          padding: 3px 8px;
          background: #f8f9fa;
          border-radius: 12px;
          color: #495057;
        }

        /* Grid View */
        .authorities-grid-view {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }

        .authority-grid-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .authority-grid-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: #f8f9fa;
        }

        .authority-type {
          font-size: 12px;
          padding: 4px 8px;
          background: #6a4c93;
          color: white;
          border-radius: 12px;
          font-weight: 500;
        }

        .jurisdiction {
          font-size: 12px;
          color: #666;
        }

        .card-content {
          padding: 16px;
        }

        .citation {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
          color: #333;
          line-height: 1.3;
        }

        .year {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #666;
        }

        .principle {
          margin: 0 0 12px 0;
          color: #555;
          font-size: 14px;
          line-height: 1.4;
        }

        .file-indicator {
          font-size: 12px;
          color: #2e7d32;
          font-weight: 500;
        }

        .card-actions {
          padding: 12px 16px;
          background: #f8f9fa;
          display: flex;
          gap: 8px;
        }

        /* Stats View */
        .stats-view {
          display: grid;
          gap: 24px;
        }

        .stats-overview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .stat-card {
          background: white;
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
          text-align: center;
        }

        .stat-icon {
          font-size: 32px;
          margin-bottom: 12px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #333;
        }

        .stat-label {
          color: #666;
          font-size: 14px;
        }

        .stats-charts {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .chart-card {
          background: white;
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }

        .chart-card h4 {
          margin: 0 0 20px 0;
          color: #333;
        }

        .chart-bars {
          display: grid;
          gap: 12px;
        }

        .bar-item {
          display: grid;
          grid-template-columns: 1fr 2fr auto;
          gap: 12px;
          align-items: center;
        }

        .bar-label {
          font-size: 14px;
          color: #666;
        }

        .bar-container {
          height: 8px;
          background: #f0f0f0;
          border-radius: 4px;
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #6a4c93, #1e3c72);
          transition: width 0.5s ease;
        }

        .bar-count {
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }

        .recent-authorities {
          background: white;
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }

        .recent-authorities h4 {
          margin: 0 0 20px 0;
          color: #333;
        }

        .recent-list {
          display: grid;
          gap: 12px;
        }

        .recent-item {
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .recent-title {
          font-weight: 500;
          color: #333;
          margin-bottom: 4px;
        }

        .recent-meta {
          font-size: 12px;
          color: #666;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          max-width: 800px;
          width: 90%;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #dee2e6;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 18px;
        }

        .modal-header button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
        }

        .modal-body {
          padding: 20px;
          overflow-y: auto;
        }

        .preview-meta {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
          font-size: 14px;
          color: #666;
        }

        .preview-section {
          margin-bottom: 20px;
        }

        .preview-section h4 {
          margin: 0 0 8px 0;
          color: #333;
          font-size: 16px;
        }

        .preview-section p {
          margin: 0;
          color: #555;
          line-height: 1.5;
        }

        .file-content {
          background: #f8f9fa;
          padding: 16px;
          border-radius: 8px;
          font-size: 12px;
          line-height: 1.4;
          white-space: pre-wrap;
          overflow-x: auto;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .controls-bar {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }

          .search-controls {
            flex-direction: column;
          }

          .search-input {
            max-width: none;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .authorities-grid-view {
            grid-template-columns: 1fr;
          }

          .stats-charts {
            grid-template-columns: 1fr;
          }

          .authority-header {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};