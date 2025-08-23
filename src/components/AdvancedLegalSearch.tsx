/**
 * Advanced NLP-Based Legal Search
 * Revolutionary search with natural language understanding and legal intelligence
 */

import React, { useState, useEffect, useRef } from 'react';

interface SearchResult {
  id: string;
  type: 'document' | 'case' | 'precedent' | 'statute' | 'person' | 'issue' | 'timeline';
  title: string;
  content: string;
  relevanceScore: number;
  source: string;
  practiceArea?: 'criminal' | 'civil' | 'poca' | 'mixed';
  tags?: string[];
  lastModified?: Date;
  highlights?: {
    field: string;
    segments: string[];
  }[];
  metadata?: {
    documentType?: string;
    caseReference?: string;
    jurisdiction?: string;
    date?: string;
    author?: string;
    [key: string]: any;
  };
}

interface SearchFilter {
  practiceArea?: 'criminal' | 'civil' | 'poca' | 'mixed' | 'all';
  documentType?: string[];
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  relevanceThreshold?: number;
  includeArchived?: boolean;
  jurisdiction?: string[];
  tags?: string[];
}

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'popular' | 'smart' | 'template';
  category?: string;
  description?: string;
  confidence?: number;
}

interface AdvancedLegalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  caseContext?: {
    caseId: string;
    practiceArea: 'criminal' | 'civil' | 'poca' | 'mixed';
    currentTags?: string[];
  };
  onResultSelect?: (result: SearchResult) => void;
}

export const AdvancedLegalSearch: React.FC<AdvancedLegalSearchProps> = ({
  isOpen,
  onClose,
  caseContext,
  onResultSelect
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [filters, setFilters] = useState<SearchFilter>({
    practiceArea: caseContext?.practiceArea || 'all',
    relevanceThreshold: 0.5,
    includeArchived: false
  });
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'documents' | 'cases' | 'precedents' | 'people'>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'title'>('relevance');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'timeline'>('list');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
      generateSmartSuggestions();
    }
  }, [isOpen]);

  useEffect(() => {
    // Debounced search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    if (query.trim()) {
      debounceRef.current = setTimeout(() => {
        performAdvancedSearch(query);
      }, 300);
    } else {
      setResults([]);
    }
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, filters, sortBy]);

  const generateSmartSuggestions = (): void => {
    const suggestions: SearchSuggestion[] = [];
    
    // Recent searches
    const recentSearches = getRecentSearches();
    recentSearches.forEach(search => {
      suggestions.push({
        id: `recent_${search}`,
        text: search,
        type: 'recent',
        category: 'Recent'
      });
    });
    
    // Context-aware suggestions
    if (caseContext) {
      const contextSuggestions = generateContextualSuggestions(caseContext);
      suggestions.push(...contextSuggestions);
    }
    
    // Legal research templates
    const templates = getLegalSearchTemplates();
    suggestions.push(...templates);
    
    // Smart suggestions based on practice area
    if (filters.practiceArea && filters.practiceArea !== 'all') {
      const smartSuggestions = generatePracticeAreaSuggestions(filters.practiceArea);
      suggestions.push(...smartSuggestions);
    }
    
    setSuggestions(suggestions.slice(0, 8));
  };

  const generateContextualSuggestions = (context: any): SearchSuggestion[] => {
    const suggestions: SearchSuggestion[] = [];
    
    if (context.practiceArea === 'criminal') {
      suggestions.push(
        {
          id: 'criminal_1',
          text: 'Find similar fraud cases with successful defences',
          type: 'smart',
          category: 'Criminal',
          description: 'Search for comparable fraud cases with defence victories',
          confidence: 0.92
        },
        {
          id: 'criminal_2', 
          text: 'Sentencing guidelines for financial crime',
          type: 'smart',
          category: 'Criminal',
          description: 'Current guidelines and precedents for financial offences',
          confidence: 0.89
        },
        {
          id: 'criminal_3',
          text: 'Character witnesses in fraud trials',
          type: 'smart',
          category: 'Criminal',
          description: 'Effective use of character evidence in fraud cases',
          confidence: 0.85
        }
      );
    }
    
    if (context.practiceArea === 'civil') {
      suggestions.push(
        {
          id: 'civil_1',
          text: 'Part 36 offers in commercial disputes',
          type: 'smart',
          category: 'Civil',
          description: 'Strategic use of Part 36 offers in commercial litigation',
          confidence: 0.91
        },
        {
          id: 'civil_2',
          text: 'Expert evidence requirements',
          type: 'smart',
          category: 'Civil',
          description: 'CPR Part 35 compliance and expert witness duties',
          confidence: 0.88
        }
      );
    }
    
    if (context.practiceArea === 'poca') {
      suggestions.push(
        {
          id: 'poca_1',
          text: 'Criminal lifestyle assumptions challenges',
          type: 'smart',
          category: 'POCA',
          description: 'Successful challenges to criminal lifestyle assumptions',
          confidence: 0.94
        },
        {
          id: 'poca_2',
          text: 'Third party asset protection strategies',
          type: 'smart',
          category: 'POCA',
          description: 'Protecting family and business assets from confiscation',
          confidence: 0.90
        }
      );
    }
    
    return suggestions;
  };

  const getLegalSearchTemplates = (): SearchSuggestion[] => {
    return [
      {
        id: 'template_1',
        text: 'Find documents mentioning [person/concept]',
        type: 'template',
        category: 'Templates',
        description: 'Search for any references to specific people or concepts'
      },
      {
        id: 'template_2',
        text: 'Show timeline of events between [date] and [date]',
        type: 'template',
        category: 'Templates',
        description: 'Chronological search for specific time periods'
      },
      {
        id: 'template_3',
        text: 'Compare evidence on [issue] from different sources',
        type: 'template',
        category: 'Templates',
        description: 'Cross-reference evidence across multiple documents'
      },
      {
        id: 'template_4',
        text: 'Find contradictions in witness statements',
        type: 'template',
        category: 'Templates',
        description: 'Identify inconsistencies across witness testimony'
      }
    ];
  };

  const generatePracticeAreaSuggestions = (practiceArea: string): SearchSuggestion[] => {
    const suggestions: SearchSuggestion[] = [];
    
    const practiceAreaQueries = {
      criminal: [
        'Evidence admissibility challenges',
        'Bad character evidence applications',
        'Plea bargaining strategies',
        'Sentencing mitigation factors'
      ],
      civil: [
        'Costs budgeting and management',
        'Summary judgment applications',
        'Disclosure obligations and sanctions',
        'Settlement negotiation tactics'
      ],
      poca: [
        'Available amount calculations',
        'Restraint order variations',
        'Hidden asset investigations',
        'Enforcement receiver powers'
      ]
    };
    
    const queries = practiceAreaQueries[practiceArea as keyof typeof practiceAreaQueries] || [];
    
    queries.forEach((queryText, index) => {
      suggestions.push({
        id: `practice_${practiceArea}_${index}`,
        text: queryText,
        type: 'smart',
        category: practiceArea.toUpperCase(),
        confidence: 0.85
      });
    });
    
    return suggestions;
  };

  const performAdvancedSearch = async (searchQuery: string): Promise<void> => {
    setIsSearching(true);
    
    try {
      // Simulate search delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const searchResults = await executeIntelligentSearch(searchQuery, filters);
      
      // Sort results
      const sortedResults = sortSearchResults(searchResults, sortBy);
      
      // Filter by active tab
      const filteredResults = filterResultsByTab(sortedResults, activeTab);
      
      setResults(filteredResults);
      
      // Add to search history
      if (searchQuery.trim() && !searchHistory.includes(searchQuery)) {
        setSearchHistory(prev => [searchQuery, ...prev.slice(0, 9)]);
      }
      
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const executeIntelligentSearch = async (query: string, searchFilters: SearchFilter): Promise<SearchResult[]> => {
    // This would integrate with your search backend
    // For now, we'll simulate intelligent search results
    
    const mockResults: SearchResult[] = [];
    const queryLower = query.toLowerCase();
    
    // Document search simulation
    if (queryLower.includes('witness') || queryLower.includes('statement')) {
      mockResults.push({
        id: 'doc_1',
        type: 'document',
        title: 'Witness Statement - Michael Jones',
        content: 'I witnessed the defendant enter the building at approximately 3:30pm on 15th March 2023. The defendant appeared nervous and was carrying a large bag...',
        relevanceScore: 0.95,
        source: 'witness_statement_jones.pdf',
        practiceArea: 'criminal',
        tags: ['Key Evidence', 'Timeline', 'Witness Credibility'],
        highlights: [{
          field: 'content',
          segments: ['witnessed the defendant', 'appeared nervous', 'carrying a large bag']
        }],
        metadata: {
          documentType: 'Witness Statement',
          date: '2023-03-15',
          author: 'Michael Jones'
        }
      });
    }
    
    if (queryLower.includes('fraud') || queryLower.includes('financial')) {
      mockResults.push({
        id: 'case_1',
        type: 'case',
        title: 'R v Smith [2023] EWCA Crim 1234',
        content: 'The Court of Appeal considered the approach to sentencing in cases of sophisticated financial fraud where the defendant had cooperated with authorities...',
        relevanceScore: 0.88,
        source: 'Legal Database',
        practiceArea: 'criminal',
        tags: ['Sentencing', 'Financial Crime', 'Cooperation'],
        highlights: [{
          field: 'content',
          segments: ['financial fraud', 'cooperated with authorities', 'sentencing']
        }],
        metadata: {
          caseReference: 'R v Smith [2023] EWCA Crim 1234',
          jurisdiction: 'England & Wales',
          date: '2023-06-15'
        }
      });
    }
    
    if (queryLower.includes('timeline') || queryLower.includes('chronology')) {
      mockResults.push({
        id: 'timeline_1',
        type: 'timeline',
        title: 'Case Timeline - Key Events',
        content: 'March 15, 2023: Alleged incident occurred. March 16, 2023: Police investigation commenced. March 20, 2023: Defendant arrested...',
        relevanceScore: 0.82,
        source: 'Case Management System',
        tags: ['Timeline', 'Key Events', 'Investigation'],
        highlights: [{
          field: 'content',
          segments: ['March 15, 2023', 'investigation commenced', 'Defendant arrested']
        }]
      });
    }
    
    if (queryLower.includes('contradiction') || queryLower.includes('inconsist')) {
      mockResults.push({
        id: 'analysis_1',
        type: 'document',
        title: 'AI Analysis - Evidence Contradictions',
        content: 'Analysis identified 3 potential contradictions: 1) Time discrepancy between Jones (3:30pm) and Smith (2:30pm). 2) Location inconsistency in CCTV vs testimony...',
        relevanceScore: 0.91,
        source: 'AI Analysis Engine',
        practiceArea: caseContext?.practiceArea,
        tags: ['Contradictions', 'AI Analysis', 'Evidence Issues'],
        highlights: [{
          field: 'content',
          segments: ['Time discrepancy', 'Location inconsistency', '3 potential contradictions']
        }]
      });
    }
    
    // Apply filters
    let filteredResults = mockResults;
    
    if (searchFilters.practiceArea && searchFilters.practiceArea !== 'all') {
      filteredResults = filteredResults.filter(result => 
        result.practiceArea === searchFilters.practiceArea
      );
    }
    
    if (searchFilters.relevanceThreshold) {
      filteredResults = filteredResults.filter(result => 
        result.relevanceScore >= searchFilters.relevanceThreshold!
      );
    }
    
    return filteredResults;
  };

  const sortSearchResults = (results: SearchResult[], sortBy: string): SearchResult[] => {
    return [...results].sort((a, b) => {
      switch (sortBy) {
        case 'relevance':
          return b.relevanceScore - a.relevanceScore;
        case 'date':
          const dateA = a.lastModified || new Date(a.metadata?.date || '2023-01-01');
          const dateB = b.lastModified || new Date(b.metadata?.date || '2023-01-01');
          return dateB.getTime() - dateA.getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  };

  const filterResultsByTab = (results: SearchResult[], tab: string): SearchResult[] => {
    if (tab === 'all') return results;
    
    const tabFilters = {
      documents: ['document'],
      cases: ['case', 'precedent'],
      precedents: ['precedent', 'statute'],
      people: ['person']
    };
    
    const allowedTypes = tabFilters[tab as keyof typeof tabFilters] || [];
    return results.filter(result => allowedTypes.includes(result.type));
  };

  const getRecentSearches = (): string[] => {
    // This would load from localStorage or user preferences
    return [
      'witness credibility issues',
      'Part 36 offer strategies',
      'criminal lifestyle challenges'
    ];
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion): void => {
    setQuery(suggestion.text);
    performAdvancedSearch(suggestion.text);
  };

  const handleResultClick = (result: SearchResult): void => {
    onResultSelect?.(result);
  };

  const renderSearchResult = (result: SearchResult): JSX.Element => {
    const getTypeIcon = (type: string) => {
      const icons = {
        document: '📄',
        case: '⚖️',
        precedent: '📚',
        statute: '📜',
        person: '👤',
        issue: '❗',
        timeline: '📅'
      };
      return icons[type as keyof typeof icons] || '📄';
    };

    const getRelevanceColor = (score: number) => {
      if (score >= 0.9) return '#10b981';
      if (score >= 0.7) return '#f59e0b';
      if (score >= 0.5) return '#ef4444';
      return '#6b7280';
    };

    return (
      <div key={result.id} className="search-result" onClick={() => handleResultClick(result)}>
        <div className="result-header">
          <div className="result-title-section">
            <span className="result-icon">{getTypeIcon(result.type)}</span>
            <div className="result-title-info">
              <h3 className="result-title">{result.title}</h3>
              <div className="result-metadata">
                <span className="result-source">{result.source}</span>
                {result.metadata?.date && (
                  <span className="result-date">{new Date(result.metadata.date).toLocaleDateString()}</span>
                )}
                {result.practiceArea && (
                  <span className={`practice-badge ${result.practiceArea}`}>
                    {result.practiceArea.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="result-relevance">
            <div 
              className="relevance-score"
              style={{ color: getRelevanceColor(result.relevanceScore) }}
            >
              {Math.round(result.relevanceScore * 100)}%
            </div>
          </div>
        </div>
        
        <div className="result-content">
          <p className="result-excerpt">
            {result.highlights?.length ? (
              <span dangerouslySetInnerHTML={{
                __html: highlightText(result.content, result.highlights[0].segments)
              }} />
            ) : (
              result.content.substring(0, 200) + (result.content.length > 200 ? '...' : '')
            )}
          </p>
        </div>
        
        {result.tags && result.tags.length > 0 && (
          <div className="result-tags">
            {result.tags.slice(0, 3).map(tag => (
              <span key={tag} className="result-tag">{tag}</span>
            ))}
            {result.tags.length > 3 && (
              <span className="result-tag-more">+{result.tags.length - 3} more</span>
            )}
          </div>
        )}
      </div>
    );
  };

  const highlightText = (text: string, segments: string[]): string => {
    let highlightedText = text;
    segments.forEach(segment => {
      const regex = new RegExp(`(${segment})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });
    return highlightedText;
  };

  if (!isOpen) return null;

  return (
    <div className="advanced-legal-search">
      <div className="search-overlay" onClick={onClose}>
        <div className="search-modal" onClick={(e) => e.stopPropagation()}>
          <div className="search-header">
            <div className="search-title-section">
              <h2>🔍 Advanced Legal Search</h2>
              <span className="search-subtitle">Natural language search with legal intelligence</span>
            </div>
            <button className="search-close-btn" onClick={onClose}>✕</button>
          </div>

          <div className="search-input-section">
            <div className="search-input-wrapper">
              <span className="search-input-icon">🔍</span>
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask anything... 'Find contradictions in witness statements' or 'Show me similar fraud cases'"
                className="search-input"
              />
              {isSearching && <span className="search-loading">⚡</span>}
            </div>
            
            {caseContext && (
              <div className="search-context">
                <span className="context-label">Context:</span>
                <span className="context-value">{caseContext.practiceArea.toUpperCase()} case</span>
              </div>
            )}
          </div>

          {!query.trim() && suggestions.length > 0 && (
            <div className="search-suggestions">
              <h3>💡 Smart Suggestions:</h3>
              <div className="suggestions-grid">
                {suggestions.map(suggestion => (
                  <div
                    key={suggestion.id}
                    className={`suggestion-item ${suggestion.type}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="suggestion-text">{suggestion.text}</div>
                    {suggestion.description && (
                      <div className="suggestion-description">{suggestion.description}</div>
                    )}
                    {suggestion.confidence && (
                      <div className="suggestion-confidence">{Math.round(suggestion.confidence * 100)}%</div>
                    )}
                    <div className="suggestion-category">{suggestion.category}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {query.trim() && (
            <div className="search-results-section">
              <div className="search-controls">
                <div className="search-tabs">
                  {(['all', 'documents', 'cases', 'precedents', 'people'] as const).map(tab => (
                    <button
                      key={tab}
                      className={`search-tab ${activeTab === tab ? 'active' : ''}`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      {tab === 'all' && results.length > 0 && (
                        <span className="tab-count">({results.length})</span>
                      )}
                    </button>
                  ))}
                </div>
                
                <div className="search-sort">
                  <label>Sort by:</label>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                    <option value="relevance">Relevance</option>
                    <option value="date">Date</option>
                    <option value="title">Title</option>
                  </select>
                </div>
              </div>

              <div className="search-results">
                {isSearching ? (
                  <div className="search-loading-state">
                    <div className="search-spinner">🧠</div>
                    <p>Analyzing your query with legal intelligence...</p>
                  </div>
                ) : results.length > 0 ? (
                  <div className="results-list">
                    {results.map(renderSearchResult)}
                  </div>
                ) : query.trim() ? (
                  <div className="no-results">
                    <p>No results found for "{query}"</p>
                    <p>Try adjusting your search terms or filters</p>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedLegalSearch;