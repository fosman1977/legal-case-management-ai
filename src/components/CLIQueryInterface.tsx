import React, { useState, useEffect, useRef } from 'react';

interface QueryResult {
  query: string;
  result: string;
  confidence: number;
  timestamp: Date;
  category: string;
}

interface CLIQueryInterfaceProps {
  onQueryExecute?: (query: string) => Promise<QueryResult>;
}

export const CLIQueryInterface: React.FC<CLIQueryInterfaceProps> = ({
  onQueryExecute
}) => {
  const [currentQuery, setCurrentQuery] = useState('');
  const [queryHistory, setQueryHistory] = useState<QueryResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const demoQueries = [
    "What are the key elements of a breach of contract claim?",
    "Analyze the statute of limitations for personal injury cases in California",
    "What is the difference between joint and several liability?",
    "Explain the doctrine of res ipsa loquitur"
  ];

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [queryHistory]);

  const executeQuery = async (query: string) => {
    if (!query.trim()) return;

    setIsProcessing(true);
    
    try {
      let result: QueryResult;
      
      if (onQueryExecute) {
        result = await onQueryExecute(query);
      } else {
        // Mock result for demo
        result = {
          query,
          result: `Mock analysis for: "${query}"\n\nThis would contain detailed legal analysis from the AI engine, including relevant statutes, case law, and practical guidance.`,
          confidence: Math.random() * 0.3 + 0.7, // 0.7 to 1.0
          timestamp: new Date(),
          category: 'general'
        };
      }

      setQueryHistory(prev => [...prev, result]);
      setCurrentQuery('');
      setHistoryIndex(-1);
    } catch (error) {
      console.error('Query execution failed:', error);
      const errorResult: QueryResult = {
        query,
        result: `Error executing query: ${error.message || 'Unknown error'}`,
        confidence: 0,
        timestamp: new Date(),
        category: 'error'
      };
      setQueryHistory(prev => [...prev, errorResult]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeQuery(currentQuery);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (queryHistory.length > 0) {
        const newIndex = Math.min(historyIndex + 1, queryHistory.length - 1);
        setHistoryIndex(newIndex);
        setCurrentQuery(queryHistory[queryHistory.length - 1 - newIndex].query);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentQuery(queryHistory[queryHistory.length - 1 - newIndex].query);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentQuery('');
      }
    }
  };

  const clearTerminal = () => {
    setQueryHistory([]);
    setCurrentQuery('');
    setHistoryIndex(-1);
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return '#4caf50';
    if (confidence >= 0.8) return '#ff9800';
    if (confidence >= 0.7) return '#2196f3';
    return '#f44336';
  };

  return (
    <div className="cli-query-interface">
      <div className="cli-header">
        <h3>🖥️ Legal AI Query Interface</h3>
        <div className="cli-actions">
          <button onClick={clearTerminal} className="btn btn-sm">Clear</button>
        </div>
      </div>

      <div className="demo-queries">
        <h4>Quick Start - Try these queries:</h4>
        {demoQueries.map((query, index) => (
          <button 
            key={index}
            className="demo-query-btn"
            onClick={() => setCurrentQuery(query)}
          >
            {query}
          </button>
        ))}
      </div>

      <div className="cli-terminal" ref={terminalRef}>
        {queryHistory.map((result, index) => (
          <div key={index} className="query-result">
            <div className="query-line">
              <span className="prompt">legal-ai@system:~$</span>
              <span className="query-text">{result.query}</span>
              <span className="timestamp">[{formatTimestamp(result.timestamp)}]</span>
            </div>
            <div className="result-container">
              <div className="result-meta">
                <span 
                  className="confidence-badge"
                  style={{ backgroundColor: getConfidenceColor(result.confidence) }}
                >
                  Confidence: {(result.confidence * 100).toFixed(1)}%
                </span>
                <span className="category-badge">{result.category}</span>
              </div>
              <pre className="result-text">{result.result}</pre>
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="processing-indicator">
            <span className="prompt">legal-ai@system:~$</span>
            <span className="processing-text">Processing query...</span>
            <span className="cursor-blink">▋</span>
          </div>
        )}
      </div>

      <div className="cli-input-container">
        <span className="input-prompt">legal-ai@system:~$</span>
        <input
          ref={inputRef}
          type="text"
          value={currentQuery}
          onChange={(e) => setCurrentQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter your legal query here..."
          className="cli-input"
          disabled={isProcessing}
        />
      </div>

      <div className="cli-help">
        <p>Use ↑/↓ arrows to navigate query history • Press Enter to execute • Type 'clear' to clear terminal</p>
      </div>
    </div>
  );
};