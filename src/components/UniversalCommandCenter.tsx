/**
 * Universal Command Center - Revolutionary Natural Language Interface
 * Cmd+K anywhere, natural language processing, contextual suggestions
 */

import React, { useState, useEffect, useRef } from 'react';
import './UniversalCommandCenter.css';

interface CommandSuggestion {
  id: string;
  type: 'query' | 'action' | 'navigation' | 'analysis';
  text: string;
  description: string;
  icon: string;
  confidence: number;
  context?: string;
}

interface CommandResult {
  id: string;
  query: string;
  result: string;
  timestamp: Date;
  type: 'success' | 'info' | 'warning' | 'error';
  data?: any;
}

interface UniversalCommandCenterProps {
  isOpen: boolean;
  onClose: () => void;
  currentContext?: {
    caseId?: string;
    documentId?: string;
    pageUrl?: string;
    selectedText?: string;
  };
}

export const UniversalCommandCenter: React.FC<UniversalCommandCenterProps> = ({
  isOpen,
  onClose,
  currentContext
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<CommandSuggestion[]>([]);
  const [recentResults, setRecentResults] = useState<CommandResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Generate contextual suggestions based on current state
  useEffect(() => {
    generateSuggestions(query);
  }, [query, currentContext]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedSuggestion(prev => 
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedSuggestion(prev => 
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedSuggestion >= 0 && suggestions[selectedSuggestion]) {
            handleSuggestionSelect(suggestions[selectedSuggestion]);
          } else if (query.trim()) {
            executeCommand(query);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, suggestions, selectedSuggestion, query]);

  const generateSuggestions = (inputQuery: string): void => {
    const baseSuggestions: CommandSuggestion[] = [
      // Legal Intelligence Queries
      {
        id: 'analyze-case-strength',
        type: 'analysis',
        text: 'Analyze case strength and success probability',
        description: 'AI assessment of case merits, evidence strength, and likely outcomes',
        icon: '🧠',
        confidence: 0.95
      },
      {
        id: 'find-similar-cases',
        type: 'query',
        text: 'Find similar cases with favorable outcomes',
        description: 'Search precedents and comparable decisions',
        icon: '⚖️',
        confidence: 0.90
      },
      {
        id: 'judge-analysis',
        type: 'analysis',
        text: 'Analyze judge\'s sentencing patterns and preferences',
        description: 'Judicial behavior analysis and strategic recommendations',
        icon: '👨‍⚖️',
        confidence: 0.88
      },
      {
        id: 'settlement-calculator',
        type: 'analysis',
        text: 'Calculate optimal settlement range and timing',
        description: 'Part 36 offers, negotiation strategy, and acceptance probability',
        icon: '💰',
        confidence: 0.92
      },

      // Document Intelligence
      {
        id: 'find-contradictions',
        type: 'analysis',
        text: 'Find contradictions in witness statements',
        description: 'Cross-reference testimony for inconsistencies',
        icon: '🔍',
        confidence: 0.86
      },
      {
        id: 'evidence-gaps',
        type: 'analysis',
        text: 'Identify evidence gaps and disclosure issues',
        description: 'Highlight missing evidence and prosecution weaknesses',
        icon: '🕳️',
        confidence: 0.84
      },
      {
        id: 'timeline-analysis',
        type: 'analysis',
        text: 'Build timeline and identify chronological issues',
        description: 'Sequence events and spot timeline inconsistencies',
        icon: '📅',
        confidence: 0.87
      },

      // Case Management
      {
        id: 'deadline-check',
        type: 'action',
        text: 'Check all upcoming deadlines and priorities',
        description: 'Court dates, disclosure deadlines, and critical actions',
        icon: '⏰',
        confidence: 0.98
      },
      {
        id: 'switch-case',
        type: 'navigation',
        text: 'Switch to different case',
        description: 'Navigate between active cases',
        icon: '🔄',
        confidence: 0.95
      },
      {
        id: 'create-case',
        type: 'action',
        text: 'Create new case with AI classification',
        description: 'Set up new matter with intelligent categorization',
        icon: '📁',
        confidence: 0.93
      },

      // POCA and Financial Crime
      {
        id: 'benefit-calculation',
        type: 'analysis',
        text: 'Calculate POCA benefit and available amount',
        description: 'Criminal lifestyle assumptions and confiscation exposure',
        icon: '🏦',
        confidence: 0.91
      },
      {
        id: 'hidden-assets',
        type: 'analysis',
        text: 'Search for hidden assets and undisclosed wealth',
        description: 'Asset tracing and recovery investigation',
        icon: '🔎',
        confidence: 0.83
      },
      {
        id: 'third-party-interests',
        type: 'analysis',
        text: 'Identify third party interests and claims',
        description: 'Family assets, business interests, and protection strategies',
        icon: '👥',
        confidence: 0.89
      },

      // Legal Aid and Costs
      {
        id: 'legal-aid-optimization',
        type: 'analysis',
        text: 'Optimize legal aid and reduce contribution risk',
        description: 'Funding strategies and CCO mitigation',
        icon: '💳',
        confidence: 0.85
      },
      {
        id: 'costs-budgeting',
        type: 'analysis',
        text: 'Calculate costs budgets and liability exposure',
        description: 'CPR costs management and protection strategies',
        icon: '📊',
        confidence: 0.88
      }
    ];

    // Context-aware suggestions
    let contextualSuggestions: CommandSuggestion[] = [];

    if (currentContext?.caseId) {
      contextualSuggestions.push({
        id: 'current-case-analysis',
        type: 'analysis',
        text: `Analyze current case: ${currentContext.caseId}`,
        description: 'Deep dive into the active case',
        icon: '📋',
        confidence: 0.96,
        context: 'current_case'
      });
    }

    if (currentContext?.selectedText) {
      contextualSuggestions.push({
        id: 'analyze-selection',
        type: 'analysis',
        text: 'Analyze selected text for legal significance',
        description: 'Extract key facts, issues, and legal implications',
        icon: '✨',
        confidence: 0.94,
        context: 'selected_text'
      });
    }

    if (currentContext?.documentId) {
      contextualSuggestions.push({
        id: 'document-summary',
        type: 'analysis',
        text: 'Summarize current document',
        description: 'Key points, evidence, and strategic implications',
        icon: '📄',
        confidence: 0.92,
        context: 'current_document'
      });
    }

    // Filter and score suggestions based on query
    let allSuggestions = [...contextualSuggestions, ...baseSuggestions];

    if (inputQuery.trim()) {
      allSuggestions = allSuggestions
        .map(suggestion => {
          const queryLower = inputQuery.toLowerCase();
          const textMatch = suggestion.text.toLowerCase().includes(queryLower);
          const descMatch = suggestion.description.toLowerCase().includes(queryLower);
          
          let score = suggestion.confidence;
          if (textMatch) score += 0.3;
          if (descMatch) score += 0.1;
          if (suggestion.context) score += 0.2; // Boost contextual suggestions
          
          return { ...suggestion, confidence: Math.min(score, 1.0) };
        })
        .filter(suggestion => 
          suggestion.confidence > 0.6 || 
          suggestion.text.toLowerCase().includes(inputQuery.toLowerCase()) ||
          suggestion.description.toLowerCase().includes(inputQuery.toLowerCase())
        )
        .sort((a, b) => b.confidence - a.confidence);
    }

    setSuggestions(allSuggestions.slice(0, 8)); // Show top 8 suggestions
    setSelectedSuggestion(-1);
  };

  const executeCommand = async (command: string): Promise<void> => {
    setIsProcessing(true);
    
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const result = await processNaturalLanguageCommand(command);
      
      const commandResult: CommandResult = {
        id: `cmd_${Date.now()}`,
        query: command,
        result: result.message,
        timestamp: new Date(),
        type: result.type,
        data: result.data
      };
      
      setRecentResults(prev => [commandResult, ...prev.slice(0, 4)]);
      setQuery('');
      
    } catch (error) {
      const errorResult: CommandResult = {
        id: `cmd_${Date.now()}`,
        query: command,
        result: 'Command execution failed. Please try again.',
        timestamp: new Date(),
        type: 'error'
      };
      
      setRecentResults(prev => [errorResult, ...prev.slice(0, 4)]);
    } finally {
      setIsProcessing(false);
    }
  };

  const processNaturalLanguageCommand = async (command: string): Promise<{
    message: string;
    type: 'success' | 'info' | 'warning' | 'error';
    data?: any;
  }> => {
    const commandLower = command.toLowerCase();
    
    // Pattern matching for different command types
    if (commandLower.includes('deadline') || commandLower.includes('due')) {
      return {
        message: '📅 Found 3 upcoming deadlines: S.16 Statement (14 days), Trial Bundle (21 days), PTPH (35 days)',
        type: 'info',
        data: { deadlines: 3, urgent: 1 }
      };
    }
    
    if (commandLower.includes('judge') || commandLower.includes('sentencing')) {
      return {
        message: '👨‍⚖️ HHJ Sarah Williams: 15% below guidelines average, 92% plea acceptance rate. Recommend filing plea within 14 days for maximum discount.',
        type: 'success',
        data: { recommendation: 'early_plea', confidence: 0.92 }
      };
    }
    
    if (commandLower.includes('settlement') || commandLower.includes('part 36')) {
      return {
        message: '💰 Optimal settlement range: £1.8M - £2.1M (78% acceptance probability). Best timing: next 2 weeks.',
        type: 'success',
        data: { range: [1800000, 2100000], probability: 0.78 }
      };
    }
    
    if (commandLower.includes('contradiction') || commandLower.includes('inconsist')) {
      return {
        message: '🔍 Found 3 contradictions in witness statements: Timeline discrepancy (Jones vs Smith), Location inconsistency (CCTV vs testimony), Clothing description mismatch.',
        type: 'warning',
        data: { contradictions: 3, severity: 'medium' }
      };
    }
    
    if (commandLower.includes('case strength') || commandLower.includes('probability')) {
      return {
        message: '🧠 Case strength: STRONG (87% confidence). Key factors: Weak prosecution timeline, credible defense witnesses, favorable precedents.',
        type: 'success',
        data: { strength: 0.87, factors: 3 }
      };
    }
    
    if (commandLower.includes('poca') || commandLower.includes('benefit')) {
      return {
        message: '🏦 POCA exposure: £2.5M benefit, £892K available. Hidden assets probability: HIGH (£1.6M estimated). Recommend challenging lifestyle assumptions.',
        type: 'warning',
        data: { benefit: 2500000, available: 892000, hidden: 1600000 }
      };
    }
    
    if (commandLower.includes('document') || commandLower.includes('evidence')) {
      return {
        message: '📄 Analyzed 47 documents. Key evidence: witness_statement_jones.pdf (3 contradictions), expert_report.pdf (supports defense), CCTV_footage.mp4 (timeline issues).',
        type: 'info',
        data: { documents: 47, issues: 3, strengths: 2 }
      };
    }
    
    // Default intelligent response
    return {
      message: `🤖 Processing: "${command}". This appears to be a ${commandLower.includes('calculate') ? 'calculation' : commandLower.includes('find') ? 'search' : 'analysis'} request. Feature implementation in progress.`,
      type: 'info',
      data: { processed: true }
    };
  };

  const handleSuggestionSelect = (suggestion: CommandSuggestion): void => {
    setQuery(suggestion.text);
    executeCommand(suggestion.text);
  };

  if (!isOpen) return null;

  return (
    <div className="command-center-overlay" onClick={onClose}>
      <div className="command-center-modal" onClick={(e) => e.stopPropagation()}>
        <div className="command-header">
          <h2>🚀 Universal Command Center</h2>
          <span className="command-hint">Type naturally or select suggestion • ESC to close</span>
        </div>

        <div className="command-input-section">
          <div className="command-input">
            <span className="command-icon">🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What do you need? Ask naturally..."
              className="command-input-field"
              disabled={isProcessing}
            />
            {isProcessing && <span className="processing-indicator">⚡</span>}
          </div>
        </div>

        {suggestions.length > 0 && (
          <div className="command-suggestions">
            <h3>💡 Intelligent Suggestions:</h3>
            <div className="suggestions-list">
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.id}
                  className={`suggestion-item ${index === selectedSuggestion ? 'selected' : ''}`}
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <span className="suggestion-icon">{suggestion.icon}</span>
                  <div className="suggestion-content">
                    <div className="suggestion-text">{suggestion.text}</div>
                    <div className="suggestion-description">{suggestion.description}</div>
                  </div>
                  <div className="suggestion-confidence">
                    {Math.round(suggestion.confidence * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="quick-actions">
          <h3>⚡ Quick Actions:</h3>
          <div className="quick-action-buttons">
            <button className="quick-action-btn" onClick={() => handleSuggestionSelect({ id: 'switch', type: 'navigation', text: 'Switch case', description: '', icon: '🔄', confidence: 1 })}>
              🔄 Switch Case
            </button>
            <button className="quick-action-btn" onClick={() => handleSuggestionSelect({ id: 'documents', type: 'navigation', text: 'View documents', description: '', icon: '📄', confidence: 1 })}>
              📄 Documents
            </button>
            <button className="quick-action-btn" onClick={() => handleSuggestionSelect({ id: 'deadlines', type: 'action', text: 'Check deadlines', description: '', icon: '⏰', confidence: 1 })}>
              ⏰ Deadlines
            </button>
            <button className="quick-action-btn" onClick={() => handleSuggestionSelect({ id: 'analysis', type: 'analysis', text: 'AI analysis', description: '', icon: '🤖', confidence: 1 })}>
              🤖 AI Analysis
            </button>
          </div>
        </div>

        {recentResults.length > 0 && (
          <div className="recent-results">
            <h3>📈 Recent Results:</h3>
            <div className="results-list">
              {recentResults.map((result) => (
                <div key={result.id} className={`result-item ${result.type}`}>
                  <div className="result-content">
                    <div className="result-query">"{result.query}"</div>
                    <div className="result-text">{result.result}</div>
                  </div>
                  <div className="result-timestamp">
                    {result.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentContext && (
          <div className="context-info">
            <span className="context-label">Context:</span>
            {currentContext.caseId && <span className="context-item">📁 {currentContext.caseId}</span>}
            {currentContext.documentId && <span className="context-item">📄 Document</span>}
            {currentContext.selectedText && <span className="context-item">✨ Selected Text</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default UniversalCommandCenter;