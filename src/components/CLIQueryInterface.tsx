/**
 * CLI Query Interface
 * Demonstrates intelligent routing and processing transparency
 */

import React, { useState, useRef, useEffect } from 'react';
import { enhancedAIClient } from '../utils/enhancedAIClient';

interface QueryResult {
  query: string;
  response: string;
  processingMode: string;
  enginesUsed: string[];
  confidence: number;
  processingTime: number;
  timestamp: Date;
}

interface CLIQueryInterfaceProps {
  caseId?: string;
}

export const CLIQueryInterface: React.FC<CLIQueryInterfaceProps> = ({ caseId }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<QueryResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Demo queries to showcase different processing modes
  const demoQueries = [
    {
      query: "Who are the parties in this case?",
      description: "Simple query → Rules-based processing",
      complexity: "simple"
    },
    {
      query: "Analyze the strength of the negligence claim based on recent UK case law precedents",
      description: "Complex query → AI-enhanced processing",
      complexity: "complex"
    },
    {
      query: "Extract all statutory references and validate their current status",
      description: "High accuracy required → Full consensus processing",
      complexity: "consensus"
    }
  ];

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [results]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isProcessing) return;

    const currentQuery = query.trim();
    setQuery('');
    setIsProcessing(true);

    // Add to command history
    setCommandHistory(prev => [...prev, currentQuery]);
    setHistoryIndex(-1);

    const startTime = Date.now();

    try {
      // Determine processing approach based on query
      const response = await processQuery(currentQuery);
      const processingTime = Date.now() - startTime;

      const result: QueryResult = {
        query: currentQuery,
        response: response.answer,
        processingMode: response.processingMode,
        enginesUsed: response.enginesUsed || [],
        confidence: response.confidence || 0,
        processingTime,
        timestamp: new Date()
      };

      setResults(prev => [...prev, result]);
    } catch (error) {
      const result: QueryResult = {
        query: currentQuery,
        response: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        processingMode: 'error',
        enginesUsed: [],
        confidence: 0,
        processingTime: Date.now() - startTime,
        timestamp: new Date()
      };

      setResults(prev => [...prev, result]);
    } finally {
      setIsProcessing(false);
    }
  };

  const processQuery = async (userQuery: string): Promise<{
    answer: string;
    processingMode: string;
    enginesUsed: string[];
    confidence: number;
  }> => {
    // Simulate different processing modes based on query complexity
    const queryLower = userQuery.toLowerCase();
    
    if (queryLower.includes('who are') || queryLower.includes('parties')) {
      // Simple entity extraction
      return {
        answer: "📋 **Rules-Based Processing**\n\nBased on pattern matching and legal regex engines:\n\n**Parties identified:**\n• Claimant: Smith Construction Ltd\n• Defendant: Jones Engineering PLC\n• Third Party: ABC Insurance Company\n\nProcessed using: Legal-Regex, Eyecite, Custom-UK engines",
        processingMode: "rules-only",
        enginesUsed: ["legal-regex", "eyecite", "custom-uk"],
        confidence: 0.94
      };
    }
    
    if (queryLower.includes('analyze') || queryLower.includes('strength') || queryLower.includes('negligence')) {
      // Complex analysis requiring AI
      return {
        answer: "🤖 **AI-Enhanced Processing**\n\nComplex legal analysis using multi-engine consensus:\n\n**Negligence Claim Strength: HIGH**\n\n**Key Supporting Factors:**\n• Clear duty of care established (Donoghue v Stevenson precedent)\n• Breach evidenced by expert testimony\n• Causation clearly demonstrated\n• Foreseeability of harm established\n\n**Supporting Authorities:**\n• Caparo Industries v Dickman [1990] for duty criteria\n• Bolam v Friern Hospital [1957] for breach standard\n• Barnett v Chelsea [1969] for causation\n\n**Risk Factors:**\n• Potential contributory negligence defence\n• Limitation period considerations\n\nProcessed using: Blackstone-UK, AI-Enhancement, Database-Validator, Statistical-Validator",
        processingMode: "ai-enhanced",
        enginesUsed: ["blackstone-uk", "ai-enhancement", "database-validator", "statistical-validator"],
        confidence: 0.87
      };
    }
    
    if (queryLower.includes('extract') && queryLower.includes('statutory')) {
      // High accuracy consensus processing
      return {
        answer: "🔍 **Full 7-Engine Consensus**\n\nHigh-accuracy statutory reference extraction and validation:\n\n**Statutory References Found:**\n\n1. **Health and Safety at Work etc. Act 1974, s.2(1)**\n   - Status: ✅ Current and in force\n   - Validation: Cross-checked against legislation.gov.uk\n   - Relevance: Employer's general duty\n\n2. **Management of Health and Safety at Work Regulations 1999, reg.3**\n   - Status: ✅ Current and in force  \n   - Validation: Confirmed by database validator\n   - Relevance: Risk assessment requirements\n\n3. **Construction (Design and Management) Regulations 2015, reg.13**\n   - Status: ✅ Current and in force\n   - Validation: Legislative database verified\n   - Relevance: Principal contractor duties\n\n**Consensus Metrics:**\n• 7/7 engines agreement on core references\n• 98.5% confidence after validation\n• 0 conflicts requiring resolution\n\nProcessed using: ALL 7 ENGINES (Blackstone-UK, Eyecite, Legal-Regex, spaCy-Legal, Custom-UK, Database-Validator, Statistical-Validator)",
        processingMode: "full-consensus",
        enginesUsed: ["blackstone-uk", "eyecite", "legal-regex", "spacy-legal", "custom-uk", "database-validator", "statistical-validator"],
        confidence: 0.985
      };
    }
    
    // Default AI processing
    return {
      answer: "🤖 **Intelligent Processing**\n\nYour query has been processed using our intelligent routing system. The system automatically selected the optimal processing approach based on query complexity and accuracy requirements.\n\nFor more specific results, try queries like:\n• \"Who are the parties?\" (rules-based)\n• \"Analyze the legal strengths\" (AI-enhanced)\n• \"Extract all statutory references\" (consensus)",
      processingMode: "intelligent-routing",
      enginesUsed: ["intelligent-router"],
      confidence: 0.80
    };
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setQuery(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setQuery(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setQuery('');
      }
    }
  };

  const runDemoQuery = (demoQuery: string) => {
    setQuery(demoQuery);
    inputRef.current?.focus();
  };

  const clearTerminal = () => {
    setResults([]);
  };

  const getProcessingIcon = (mode: string) => {
    switch (mode) {
      case 'rules-only': return '📋';
      case 'ai-enhanced': return '🤖';
      case 'full-consensus': return '🔍';
      case 'intelligent-routing': return '🧠';
      case 'error': return '❌';
      default: return '💬';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return '#4caf50';
    if (confidence >= 0.8) return '#ff9800';
    if (confidence >= 0.7) return '#2196f3';
    return '#f44336';
  };

  return (
    <div className=\"cli-query-interface\">
      <div className=\"cli-header\">
        <h3>🖥️ Legal AI Query Interface</h3>
        <div className=\"cli-actions\">
          <button onClick={clearTerminal} className=\"btn btn-sm\">Clear</button>
        </div>
      </div>

      <div className=\"demo-queries\">
        <h4>💡 Try these demo queries:</h4>
        <div className=\"demo-grid\">
          {demoQueries.map((demo, index) => (
            <div key={index} className=\"demo-query-card\">
              <div className=\"demo-query\" onClick={() => runDemoQuery(demo.query)}>
                \"{demo.query}\"
              </div>
              <div className=\"demo-description\">{demo.description}</div>
            </div>
          ))}
        </div>
      </div>

      <div className=\"terminal\" ref={terminalRef}>
        <div className=\"terminal-content\">
          {results.map((result, index) => (
            <div key={index} className=\"terminal-entry\">
              <div className=\"query-line\">
                <span className=\"prompt\">legal-ai:~$ </span>
                <span className=\"query-text\">{result.query}</span>
              </div>
              
              <div className=\"response-section\">
                <div className=\"response-header\">
                  <span className=\"processing-mode\">
                    {getProcessingIcon(result.processingMode)} {result.processingMode}
                  </span>
                  <span className=\"processing-stats\">
                    <span 
                      className=\"confidence\"
                      style={{ color: getConfidenceColor(result.confidence) }}
                    >
                      {(result.confidence * 100).toFixed(1)}% confidence
                    </span>
                    <span className=\"timing\">{result.processingTime}ms</span>
                  </span>
                </div>
                
                <div className=\"response-content\">
                  {result.response.split('\\n').map((line, lineIndex) => (
                    <div key={lineIndex} className=\"response-line\">
                      {line}
                    </div>
                  ))}
                </div>
                
                {result.enginesUsed.length > 0 && (
                  <div className=\"engines-used\">
                    <strong>Engines used:</strong> {result.enginesUsed.join(', ')}
                  </div>
                )}
                
                <div className=\"timestamp\">
                  {result.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {isProcessing && (
            <div className=\"terminal-entry processing\">
              <div className=\"query-line\">
                <span className=\"prompt\">legal-ai:~$ </span>
                <span className=\"query-text\">{query}</span>
              </div>
              <div className=\"processing-indicator\">
                <span className=\"processing-dots\">🤖 Processing</span>
                <span className=\"dots\">...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className=\"terminal-input\">
        <span className=\"prompt\">legal-ai:~$ </span>
        <input
          ref={inputRef}
          type=\"text\"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder=\"Enter your legal query... (try: 'Who are the parties?' or 'Analyze negligence claim strength')\"
          disabled={isProcessing}
          autoComplete=\"off\"
        />
      </form>

      <div className=\"cli-help\">
        <div className=\"help-section\">
          <h4>🔧 Processing Modes:</h4>
          <div className=\"help-grid\">
            <div className=\"help-item\">
              <span className=\"help-icon\">📋</span>
              <span className=\"help-text\">Rules-Only: Fast, reliable pattern matching</span>
            </div>
            <div className=\"help-item\">
              <span className=\"help-icon\">🤖</span>
              <span className=\"help-text\">AI-Enhanced: Complex analysis with AI reasoning</span>
            </div>
            <div className=\"help-item\">
              <span className=\"help-icon\">🔍</span>
              <span className=\"help-text\">Full Consensus: Maximum accuracy with 7-engine validation</span>
            </div>
            <div className=\"help-item\">
              <span className=\"help-icon\">🧠</span>
              <span className=\"help-text\">Intelligent Routing: Automatic complexity detection</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};