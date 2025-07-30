import React, { useState, useRef, useEffect } from 'react';
import { CaseDocument } from '../types';
import { openWebUIClient, ChatMessage, Citation, DocumentUpload, RAGResponse } from '../utils/openWebUIClient';

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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isConnected) {
      uploadCaseDocuments();
    }
  }, [isConnected, documents]);

  const initializeOpenWebUI = async () => {
    try {
      const isAvailable = await openWebUIClient.isAvailable();
      if (!isAvailable) {
        addSystemMessage('⚠️ OpenWebUI is not available. Please ensure it\'s running on http://localhost:3001');
        return;
      }

      const initialized = await openWebUIClient.initialize();
      if (initialized) {
        setIsConnected(true);
        addSystemMessage('✅ Connected to OpenWebUI - Enhanced AI with RAG capabilities enabled');
        
        const models = await openWebUIClient.getModels();
        setAvailableModels(models.map(m => m.name));
        
        // Set default model if available
        if (models.length > 0) {
          const preferredModel = models.find(m => m.name.includes('llama3.2:3b')) || models[0];
          setSelectedModel(preferredModel.name);
        }
      } else {
        addSystemMessage('❌ Failed to initialize OpenWebUI. Using fallback mode.');
      }
    } catch (error) {
      console.error('OpenWebUI initialization failed:', error);
      addSystemMessage('❌ OpenWebUI connection failed. Check that the service is running.');
    }
  };

  const uploadCaseDocuments = async () => {
    if (!isConnected || documents.length === 0) return;

    try {
      addSystemMessage('📤 Uploading case documents to OpenWebUI for RAG processing...');
      
      const documentFiles: File[] = [];
      
      // Convert case documents to files for upload
      for (const doc of documents) {
        if (doc.fileContent || doc.content) {
          const content = doc.fileContent || doc.content || '';
          const blob = new Blob([content], { type: 'text/plain' });
          const file = new File([blob], `${doc.title}.txt`, { type: 'text/plain' });
          documentFiles.push(file);
        }
      }

      if (documentFiles.length > 0) {
        const uploads = await openWebUIClient.uploadDocuments(documentFiles);
        setUploadedDocuments(uploads);
        
        const successCount = uploads.length;
        const totalCount = documentFiles.length;
        
        if (successCount === totalCount) {
          addSystemMessage(`✅ Successfully uploaded ${successCount} documents for RAG analysis`);
        } else {
          addSystemMessage(`⚠️ Uploaded ${successCount}/${totalCount} documents. Some uploads may have failed.`);
        }
      } else {
        addSystemMessage('ℹ️ No document content available for RAG processing');
      }
    } catch (error) {
      console.error('Document upload failed:', error);
      addSystemMessage('❌ Failed to upload documents for RAG processing');
    }
  };

  const addSystemMessage = (content: string) => {
    const systemMessage: ExtendedMessage = {
      id: `system_${Date.now()}`,
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
      id: `user_${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      if (isConnected && uploadedDocuments.length > 0) {
        // Use RAG with document context
        const ragResponse = await openWebUIClient.queryDocuments({
          query: input,
          documentIds: uploadedDocuments.map(doc => doc.id),
          model: selectedModel,
          temperature: 0.3,
          maxTokens: 2500,
          includeCitations: true,
          searchMode
        });

        const aiMessage: ExtendedMessage = {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: ragResponse.response,
          timestamp: new Date().toISOString(),
          citations: ragResponse.citations,
          ragResponse
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        // Fallback to regular chat
        const response = await openWebUIClient.chat([userMessage], selectedModel);
        const aiMessage: ExtendedMessage = {
          ...response,
          id: `ai_${Date.now()}`
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('AI query failed:', error);
      const errorMessage: ExtendedMessage = {
        id: `error_${Date.now()}`,
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