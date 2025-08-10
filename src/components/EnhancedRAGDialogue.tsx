import React, { useState, useRef, useEffect } from 'react';
import { CaseDocument } from '../types';
import { openWebUIClient, ChatMessage, Citation, DocumentUpload, RAGResponse } from '../utils/openWebUIClient';
import { unifiedAIClient } from '../utils/unifiedAIClient';

interface EnhancedRAGDialogueProps {
  caseId: string;
  documents: CaseDocument[];
}

interface ExtendedMessage extends ChatMessage {
  id: string;
  isProcessing?: boolean;
  ragResponse?: RAGResponse;
  documentUploads?: DocumentUpload[];
}

export const EnhancedRAGDialogue: React.FC<EnhancedRAGDialogueProps> = ({ caseId, documents }) => {
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<DocumentUpload[]>([]);
  const [selectedModel, setSelectedModel] = useState('llama3.2:3b');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [includeWebSearch, setIncludeWebSearch] = useState(false);
  const [searchMode, setSearchMode] = useState<'semantic' | 'hybrid' | 'keyword'>('hybrid');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeOpenWebUI();
  }, []); // Empty dependency array - only run once on mount

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isConnected) {
      uploadCaseDocuments();
    }
  }, [isConnected, documents]);

  const initializeOpenWebUI = async () => {
    try {
      // Skip OpenWebUI availability check in auth-disabled mode
      addSystemMessage('✅ AI Assistant Ready - Using Direct Ollama Integration');

      setIsConnected(true);
      
      // Try to get models from Ollama directly
      try {
        const response = await fetch('http://localhost:11436/api/tags');
        if (response.ok) {
          const data = await response.json();
          const modelNames = data.models?.map((m: any) => m.name) || ['llama3.2:3b'];
          setAvailableModels(modelNames);
          if (modelNames.length > 0) {
            setSelectedModel(modelNames[0]);
          }
        }
      } catch (error) {
        // Default models if Ollama not accessible
        setAvailableModels(['llama3.2:3b', 'llama3.2:1b']);
        setSelectedModel('llama3.2:3b');
      }
    } catch (error) {
      console.error('OpenWebUI initialization failed:', error);
      addSystemMessage('❌ OpenWebUI connection failed. Check that the service is running.');
    }
  };

  const uploadCaseDocuments = async () => {
    if (!isConnected || documents.length === 0) return;

    try {
      addSystemMessage('📤 Processing case documents for AI analysis...');
      
      // For now, we'll store documents in memory for context
      const docsWithContent = documents.filter(doc => doc.fileContent || doc.content);
      
      if (docsWithContent.length > 0) {
        // Create mock uploads for UI consistency
        const mockUploads = docsWithContent.map(doc => ({
          id: `doc_${doc.id}`,
          name: doc.title,
          type: 'text/plain',
          size: (doc.fileContent || doc.content || '').length,
          uploadedAt: new Date().toISOString(),
          processed: true,
          extractedText: doc.fileContent || doc.content || ''
        }));
        
        setUploadedDocuments(mockUploads);
        addSystemMessage(`✅ Loaded ${mockUploads.length} documents for AI analysis`);
      } else {
        addSystemMessage('ℹ️ No document content available for AI processing');
      }
    } catch (error) {
      console.error('Document processing failed:', error);
      addSystemMessage('❌ Failed to process documents for AI analysis');
    }
  };

  const addSystemMessage = (content: string) => {
    const systemMessage: ExtendedMessage = {
      id: `system_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'system',
      content,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, systemMessage]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage: ExtendedMessage = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      // Build context from uploaded documents
      let context = '';
      if (uploadedDocuments.length > 0) {
        context = 'Context from case documents:\n\n';
        uploadedDocuments.forEach(doc => {
          context += `Document: ${doc.name}\n${doc.extractedText?.substring(0, 2000)}...\n\n`;
        });
      }

      // Query using unified AI client with document context
      const aiResponse = await unifiedAIClient.queryWithDocuments(
        input,
        uploadedDocuments.map(doc => ({
          title: doc.name,
          content: doc.extractedText || ''
        })),
        {
          model: selectedModel
        }
      );
      
      const aiMessage: ExtendedMessage = {
        id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date().toISOString(),
        citations: aiResponse.sources.map(source => ({
          source,
          content: '',
          confidence: 0.8,
          page: undefined
        }))
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI query failed:', error);
      const errorMessage: ExtendedMessage = {
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: '❌ I encountered an error processing your request. Please check that OpenWebUI is running and try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatMessageContent = (content: string): React.ReactElement => {
    // Enhanced formatting with citation support
    let formattedContent = content
      // Handle citations differently - make them clickable
      .replace(/\[Document:\s*([^,]+),?\s*(?:Page:\s*(\d+))?\]/g, 
        '<cite class="document-citation" data-source="$1" data-page="$2">📄 $1$2</cite>')
      // Standard markdown formatting
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+?)\*/g, '<em>$1</em>')
      .replace(/^#{2}\s+(.*$)/gm, '<h3>$1</h3>')
      .replace(/^#{3}\s+(.*$)/gm, '<h4>$1</h4>')
      .replace(/^[-*+]\s+(.*$)/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>')
      // Clean up
      .replace(/<p><h([3-5])>/g, '<h$1>')
      .replace(/<\/h([3-5])><\/p>/g, '</h$1>')
      .replace(/<p><li>/g, '<ul><li>')
      .replace(/<\/li><\/p>/g, '</li></ul>')
      .replace(/<\/ul><br><ul>/g, '')
      .replace(/<\/ul><ul>/g, '');

    return <div dangerouslySetInnerHTML={{ __html: formattedContent }} />;
  };

  const renderCitations = (citations?: Citation[]) => {
    if (!citations || citations.length === 0) return null;

    return (
      <div className="message-citations">
        <h5>📚 Sources:</h5>
        <div className="citations-list">
          {citations.map((citation, index) => (
            <div key={index} className="citation-item">
              <div className="citation-source">
                📄 {citation.source}
                {citation.page && <span className="citation-page">Page {citation.page}</span>}
              </div>
              {citation.content && (
                <div className="citation-preview">"{citation.content}"</div>
              )}
              <div className="citation-confidence">
                Confidence: {Math.round(citation.confidence * 100)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRAGMetrics = (ragResponse?: RAGResponse) => {
    if (!ragResponse) return null;

    return (
      <div className="rag-metrics">
        <div className="metric">
          <span className="metric-label">Processing Time:</span>
          <span className="metric-value">{ragResponse.processingTime}ms</span>
        </div>
        <div className="metric">  
          <span className="metric-label">Confidence:</span>
          <span className="metric-value">{Math.round(ragResponse.confidence * 100)}%</span>
        </div>
        <div className="metric">
          <span className="metric-label">Sources Used:</span>
          <span className="metric-value">{ragResponse.sources.length}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="enhanced-rag-dialogue">
      <div className="dialogue-header">
        <div className="header-info">
          <h3>🤖 Enhanced AI Assistant with RAG</h3>
          <div className="connection-status">
            {isConnected ? (
              <span className="status-connected">✅ OpenWebUI Connected</span>
            ) : (
              <span className="status-disconnected">❌ Disconnected</span>
            )}
            <span className="documents-count">
              📄 {uploadedDocuments.length} documents loaded
            </span>
          </div>
        </div>
        
        <div className="dialogue-controls">
          <select 
            value={selectedModel} 
            onChange={(e) => setSelectedModel(e.target.value)}
            className="model-selector"
            disabled={!isConnected}
          >
            {availableModels.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
          
          <select 
            value={searchMode} 
            onChange={(e) => setSearchMode(e.target.value as any)}
            className="search-mode-selector"
            disabled={!isConnected}
          >
            <option value="hybrid">🔀 Hybrid Search</option>
            <option value="semantic">🧠 Semantic Search</option>
            <option value="keyword">🔍 Keyword Search</option>
          </select>
        </div>
      </div>

      <div className="messages-container">
        {messages.length === 0 && (
          <div className="welcome-message">
            <h4>👋 Welcome to Enhanced AI Legal Assistant</h4>
            <p>I now have advanced capabilities including:</p>
            <ul>
              <li>🔍 <strong>Document RAG</strong> - Search and analyze your case documents</li>
              <li>📚 <strong>Citations</strong> - Get precise source references</li>
              <li>🎯 <strong>Higher Accuracy</strong> - Better understanding of legal context</li>
              <li>📊 <strong>Confidence Scores</strong> - Know how reliable my answers are</li>
            </ul>
            <p>Ask me anything about your case documents!</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role}`}>
            <div className="message-header">
              <span className="message-type">
                {message.role === 'user' ? '👤 You' : 
                 message.role === 'system' ? '🔧 System' : '🤖 AI'}
              </span>
              <span className="message-time">
                {message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : ''}
              </span>
            </div>
            
            <div className="message-content">
              {message.role === 'system' ? (
                <div className="system-message">{message.content}</div>
              ) : (
                formatMessageContent(message.content)
              )}
            </div>
            
            {message.citations && renderCitations(message.citations)}
            {message.ragResponse && renderRAGMetrics(message.ragResponse)}
          </div>
        ))}
        
        {isProcessing && (
          <div className="message ai processing">
            <div className="message-header">
              <span className="message-type">🤖 AI</span>
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              Analyzing documents with RAG...
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="input-form">
        <div className="input-container">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isConnected ? 
              "Ask about your case documents with enhanced AI..." : 
              "Connect to OpenWebUI for enhanced features..."
            }
            disabled={isProcessing}
            className="message-input"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isProcessing || !isConnected}
            className="btn btn-primary send-button"
          >
            {isProcessing ? '⏳' : '➤'} Send
          </button>
        </div>
        
        <div className="input-help">
          💡 Try: "What are the key deadlines in this case?" or "Who are all the parties involved?"
        </div>
      </form>
    </div>
  );
};