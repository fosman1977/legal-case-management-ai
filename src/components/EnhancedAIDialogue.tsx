import React, { useState, useRef, useEffect } from 'react';
import { CaseDocument, ChronologyEvent, Person, Issue, KeyPoint, LegalAuthority } from '../types';
import { storage } from '../utils/storage';
import { unifiedAIClient } from '../utils/unifiedAIClient';
import { useAISync } from '../hooks/useAISync';

interface EnhancedAIDialogueProps {
  caseId: string;
  documents: CaseDocument[];
}

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  extractedData?: {
    chronologyEvents?: Partial<ChronologyEvent>[];
    persons?: Partial<Person>[];
    issues?: Partial<Issue>[];
    keyPoints?: Partial<KeyPoint>[];
    authorities?: Partial<LegalAuthority>[];
  };
  insights?: {
    type: 'suggestion' | 'insight' | 'warning' | 'tip';
    message: string;
    action?: string;
  }[];
}

interface QuickAction {
  icon: string;
  label: string;
  prompt: string;
  category: string;
}

interface ConversationHistory {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  lastUpdated: Date;
}

export const EnhancedAIDialogue: React.FC<EnhancedAIDialogueProps> = ({ caseId, documents }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [contextDocuments, setContextDocuments] = useState<CaseDocument[]>([]);
  const [conversations, setConversations] = useState<ConversationHistory[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // AI Synchronization
  const { publishAIResults } = useAISync(caseId, 'EnhancedAIDialogue');

  const quickActions: QuickAction[] = [
    { icon: '📋', label: 'Summarize case', prompt: 'Please provide a comprehensive summary of this case, including key facts, main legal issues, and current status.', category: 'analysis' },
    { icon: '🔍', label: 'Key issues', prompt: 'What are the main legal issues in this case that need to be addressed?', category: 'analysis' },
    { icon: '💪', label: 'Strengths & weaknesses', prompt: 'Analyze the strengths and weaknesses of our client\'s position in this case.', category: 'strategy' },
    { icon: '📅', label: 'Important dates', prompt: 'Extract and organize all important dates and deadlines from the case documents.', category: 'chronology' },
    { icon: '👥', label: 'Key people', prompt: 'Who are the key people involved in this case and what are their roles?', category: 'persons' },
    { icon: '📚', label: 'Legal authorities', prompt: 'What legal authorities, cases, and statutes are relevant to this matter?', category: 'authorities' },
    { icon: '🎯', label: 'Next steps', prompt: 'Based on the current state of the case, what should be our next steps and priorities?', category: 'strategy' },
    { icon: '⚠️', label: 'Risks & concerns', prompt: 'What are the main risks and concerns we should be aware of in this case?', category: 'strategy' }
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversation history on component mount
  useEffect(() => {
    loadConversationHistory();
  }, [caseId]);

  useEffect(() => {
    if (documents.length > 0) {
      setContextDocuments(documents);
      
      // Add welcome message when documents are available and no current conversation
      if (messages.length === 0 && !currentConversationId) {
        const welcomeMessage: Message = {
          id: `msg_${Date.now()}`,
          type: 'system',
          content: `👋 **Welcome to your AI Legal Assistant**\n\nI have access to **${documents.length} documents** in this case and can help you with:\n\n• **Case analysis** and summaries\n• **Legal research** and authorities\n• **Strategic insights** and recommendations\n• **Document review** and key point extraction\n• **Timeline** and chronology building\n\nWhat would you like to explore first?`,
          timestamp: new Date(),
          insights: [
            {
              type: 'tip',
              message: `I can analyze ${documents.length} documents to provide comprehensive insights`,
              action: 'Ask me anything about your case'
            }
          ]
        };
        setMessages([welcomeMessage]);
      }
    }
  }, [documents, currentConversationId]);

  const loadConversationHistory = () => {
    const storageKey = `ai_conversations_${caseId}`;
    const savedConversations = localStorage.getItem(storageKey);
    
    if (savedConversations) {
      try {
        const parsed = JSON.parse(savedConversations).map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          lastUpdated: new Date(conv.lastUpdated),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setConversations(parsed);
      } catch (error) {
        console.error('Failed to load conversation history:', error);
      }
    }
  };

  const saveConversationHistory = (updatedConversations: ConversationHistory[]) => {
    const storageKey = `ai_conversations_${caseId}`;
    localStorage.setItem(storageKey, JSON.stringify(updatedConversations));
    setConversations(updatedConversations);
  };

  const createNewConversation = () => {
    // Save current conversation if it has messages
    if (messages.length > 0 && currentConversationId) {
      saveCurrentConversation();
    }
    
    // Start new conversation
    const newConversationId = `conv_${Date.now()}`;
    setCurrentConversationId(newConversationId);
    setMessages([]);
    setShowSuggestions(true);
  };

  const saveCurrentConversation = () => {
    if (!currentConversationId || messages.length === 0) return;

    const title = generateConversationTitle(messages);
    const now = new Date();
    
    const existingIndex = conversations.findIndex(c => c.id === currentConversationId);
    const conversationData: ConversationHistory = {
      id: currentConversationId,
      title,
      messages: [...messages],
      createdAt: existingIndex >= 0 ? conversations[existingIndex].createdAt : now,
      lastUpdated: now
    };

    const updatedConversations = existingIndex >= 0 
      ? conversations.map(c => c.id === currentConversationId ? conversationData : c)
      : [conversationData, ...conversations];

    saveConversationHistory(updatedConversations);
  };

  const loadConversation = (conversationId: string) => {
    // Save current conversation first
    if (currentConversationId && messages.length > 0) {
      saveCurrentConversation();
    }

    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setCurrentConversationId(conversationId);
      setMessages(conversation.messages);
      setShowHistory(false);
    }
  };

  const deleteConversation = (conversationId: string) => {
    const updatedConversations = conversations.filter(c => c.id !== conversationId);
    saveConversationHistory(updatedConversations);
    
    if (currentConversationId === conversationId) {
      setCurrentConversationId(null);
      setMessages([]);
    }
  };

  const generateConversationTitle = (messages: Message[]): string => {
    const userMessages = messages.filter(m => m.type === 'user');
    if (userMessages.length === 0) return 'New Conversation';
    
    const firstUserMessage = userMessages[0].content;
    return firstUserMessage.length > 50 
      ? firstUserMessage.substring(0, 47) + '...'
      : firstUserMessage;
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.messages.some(msg => msg.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = async (promptText?: string) => {
    const messageText = promptText || input.trim();
    if (!messageText || isProcessing) return;

    // Create new conversation if none exists
    if (!currentConversationId) {
      const newConversationId = `conv_${Date.now()}`;
      setCurrentConversationId(newConversationId);
    }

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      type: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);
    setShowSuggestions(false);

    // Add typing indicator
    const typingMessage: Message = {
      id: `typing_${Date.now()}`,
      type: 'ai',
      content: 'Analyzing your request...',
      timestamp: new Date(),
      isTyping: true
    };
    setMessages(prev => [...prev, typingMessage]);

    try {
      const response = await analyzeWithAI(messageText);
      
      // Remove typing indicator and add real response
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.isTyping);
        const aiMessage: Message = {
          id: `msg_${Date.now()}`,
          type: 'ai',
          content: response.answer,
          timestamp: new Date(),
          extractedData: response.extractedData,
          insights: response.insights
        };
        return [...filtered, aiMessage];
      });

      // Publish any extracted data to AI sync system
      if (response.extractedData) {
        await publishAIResults(`AI Dialogue - ${messageText.substring(0, 50)}`, response.extractedData, 0.8);
      }

    } catch (error) {
      console.error('AI analysis failed:', error);
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.isTyping);
        const errorMessage: Message = {
          id: `msg_${Date.now()}`,
          type: 'ai',
          content: '❌ I apologize, but I encountered an issue processing your request. This might be because the AI service is not available in the browser environment. Please try again or consider using the desktop version.',
          timestamp: new Date(),
          insights: [
            {
              type: 'warning',
              message: 'AI service requires local Ollama installation',
              action: 'Switch to desktop version for full AI capabilities'
            }
          ]
        };
        return [...filtered, errorMessage];
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const analyzeWithAI = async (question: string) => {
    // Prepare context from documents
    const documentContext = contextDocuments.map(doc => ({
      title: doc.title,
      type: doc.type,
      category: doc.category,
      content: (doc.fileContent || doc.content || '').substring(0, 2000)
    }));

    const contextSummary = documentContext.length > 0 
      ? `\n\nAVAILABLE DOCUMENTS:\n${documentContext.map(doc => 
          `- ${doc.title} (${doc.type}): ${doc.content.substring(0, 200)}...`
        ).join('\n')}`
      : '\n\nNo documents currently available for analysis.';

    const prompt = `You are an expert legal AI assistant helping with case analysis. 

USER QUESTION: ${question}

CASE CONTEXT: ${contextSummary}

Please provide a comprehensive, professional response that:

1. **Directly answers the user's question** in clear, accessible language
2. **References specific documents** when relevant
3. **Provides actionable insights** and recommendations
4. **Highlights important legal considerations**

If you identify specific structured data (dates, people, issues, authorities), format them clearly but keep the response conversational and professional.

Focus on being helpful, accurate, and strategic in your response.`;

    try {
      const aiResponse = await unifiedAIClient.query(prompt, {
        model: 'llama3.2:1b',
        temperature: 0.3,
        maxTokens: 1500,
        context: "You are a professional legal assistant. Provide clear, structured, and actionable advice. Keep responses conversational but comprehensive."
      });
      const response = aiResponse.content;

      // Parse response for structured data but don't expose it prominently
      const extractedData = parseExtractedData(response);
      const insights = generateInsights(question, response, extractedData);

      return {
        answer: cleanupResponse(response),
        extractedData,
        insights
      };

    } catch (error) {
      console.error('AI request failed:', error);
      return {
        answer: '❌ I apologize, but I encountered an issue processing your request. This might be because the AI service is not available in the browser environment.',
        extractedData: undefined,
        insights: [
          {
            type: 'warning' as const,
            message: 'AI service requires local Ollama installation',
            action: 'Switch to desktop version for full AI capabilities'
          }
        ]
      };
    }
  };

  const parseExtractedData = (response: string) => {
    // Look for structured patterns in the response but don't make them prominent
    const data: any = {};
    
    // Simple extraction patterns - keep minimal
    const datePattern = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g;
    const dates = response.match(datePattern);
    
    if (dates && dates.length > 0) {
      data.chronologyEvents = dates.slice(0, 3).map(date => ({
        date,
        description: `Event mentioned on ${date}`,
        significance: 'Date identified from AI analysis'
      }));
    }

    return Object.keys(data).length > 0 ? data : undefined;
  };

  const generateInsights = (question: string, response: string, extractedData: any) => {
    const insights: Message['insights'] = [];

    // Generate contextual insights based on the question
    if (question.toLowerCase().includes('strength') || question.toLowerCase().includes('weakness')) {
      insights.push({
        type: 'suggestion',
        message: 'Consider reviewing the Issues tab for detailed strength analysis',
        action: 'View strategic analysis'
      });
    }

    if (question.toLowerCase().includes('date') || question.toLowerCase().includes('timeline')) {
      insights.push({
        type: 'tip',
        message: 'Chronology tab provides visual timeline management',
        action: 'Build comprehensive timeline'
      });
    }

    if (question.toLowerCase().includes('people') || question.toLowerCase().includes('person')) {
      insights.push({
        type: 'suggestion',
        message: 'Persons tab offers relationship mapping and detailed profiles',
        action: 'Explore relationships'
      });
    }

    if (extractedData) {
      insights.push({
        type: 'insight',
        message: 'I found structured data that can be saved to other tabs',
        action: 'Click below to save insights'
      });
    }

    return insights.length > 0 ? insights : undefined;
  };

  const cleanupResponse = (response: string) => {
    // Clean up the AI response to be more conversational
    return response
      .replace(/EXTRACTED_DATA:[\s\S]*$/, '') // Remove any raw data
      .replace(/\*\*(.*?)\*\*/g, '**$1**') // Keep markdown formatting
      .replace(/^\s*-\s*/gm, '• ') // Convert dashes to bullets
      .trim();
  };

  const saveExtractedInsights = async (message: Message) => {
    if (!message.extractedData) return;

    try {
      // Save to appropriate storage locations
      if (message.extractedData.chronologyEvents) {
        message.extractedData.chronologyEvents.forEach(event => {
          if (event.date && event.description) {
            const chronologyEvent: ChronologyEvent = {
              id: `ai_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
              caseId,
              date: event.date,
              description: event.description,
              significance: event.significance || 'Identified by AI assistant'
            };
            storage.saveChronologyEvent(chronologyEvent);
          }
        });
      }

      // Update message to show saved status
      setMessages(prev => prev.map(msg => 
        msg.id === message.id 
          ? { ...msg, insights: [{ type: 'insight', message: '✅ Insights saved successfully', action: 'View in respective tabs' }] }
          : msg
      ));

    } catch (error) {
      console.error('Failed to save insights:', error);
    }
  };

  const formatMessage = (content: string) => {
    // Enhanced message formatting
    return content.split('\n').map((line, index) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <div key={index} className="message-heading">{line.replace(/\*\*/g, '')}</div>;
      }
      if (line.startsWith('•')) {
        return <div key={index} className="message-bullet">{line}</div>;
      }
      if (line.trim() === '') {
        return <div key={index} className="message-space"></div>;
      }
      return <div key={index} className="message-line">{line}</div>;
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-save current conversation periodically
  useEffect(() => {
    if (currentConversationId && messages.length > 1) {
      const timeoutId = setTimeout(() => {
        saveCurrentConversation();
      }, 2000); // Auto-save after 2 seconds of inactivity
      
      return () => clearTimeout(timeoutId);
    }
  }, [messages, currentConversationId]);

  return (
    <div className="enhanced-ai-dialogue">
      {showHistory && (
        <div className="conversation-history-sidebar">
          <div className="history-header">
            <h4>📚 Conversation History</h4>
            <button className="btn btn-sm" onClick={() => setShowHistory(false)}>✕</button>
          </div>
          
          <div className="history-search">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="conversation-list">
            {filteredConversations.map((conv) => (
              <div 
                key={conv.id}
                className={`conversation-item ${currentConversationId === conv.id ? 'active' : ''}`}
                onClick={() => loadConversation(conv.id)}
              >
                <div className="conversation-title">{conv.title}</div>
                <div className="conversation-meta">
                  {conv.lastUpdated.toLocaleDateString()} • {conv.messages.length} messages
                </div>
                <button 
                  className="delete-conversation"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                >
                  🗑️
                </button>
              </div>
            ))}
            
            {filteredConversations.length === 0 && (
              <div className="no-conversations">
                {searchTerm ? 'No matching conversations' : 'No conversations yet'}
              </div>
            )}
          </div>
        </div>
      )}

      <div className={`dialogue-main ${showHistory ? 'with-sidebar' : ''}`}>
        <div className="dialogue-header">
          <div className="header-info">
            <h3>💬 AI Legal Assistant</h3>
            <p className="status">
              {currentConversationId && (
                <span className="conversation-indicator">
                  📝 {conversations.find(c => c.id === currentConversationId)?.title || 'Current conversation'} • 
                </span>
              )}
              {contextDocuments.length > 0 
                ? ` Ready • ${contextDocuments.length} documents loaded`
                : ' No documents loaded'
              }
            </p>
          </div>
          <div className="header-actions">
            <button 
              className="btn btn-outline"
              onClick={() => setShowHistory(!showHistory)}
              title="Toggle conversation history"
            >
              📚 History ({conversations.length})
            </button>
            <button 
              className="btn btn-outline"
              onClick={createNewConversation}
              title="Start new conversation"
            >
              ➕ New
            </button>
            <button 
              className="btn btn-outline"
              onClick={() => setShowSuggestions(!showSuggestions)}
            >
              {showSuggestions ? 'Hide' : 'Show'} Suggestions
            </button>
          </div>
        </div>

      {showSuggestions && (
        <div className="quick-actions">
          <h4>💡 Quick Actions</h4>
          <div className="actions-grid">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="quick-action-btn"
                onClick={() => handleSubmit(action.prompt)}
                disabled={isProcessing}
              >
                <span className="action-icon">{action.icon}</span>
                <span className="action-label">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="messages-container">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-avatar">
              {message.type === 'user' ? '👤' : message.type === 'system' ? '💼' : '🤖'}
            </div>
            
            <div className="message-bubble">
              <div className="message-header">
                <span className="message-sender">
                  {message.type === 'user' ? 'You' : message.type === 'system' ? 'System' : 'AI Assistant'}
                </span>
                <span className="message-time">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              
              <div className="message-content">
                {message.isTyping ? (
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                ) : (
                  formatMessage(message.content)
                )}
              </div>

              {message.insights && (
                <div className="message-insights">
                  {message.insights.map((insight, index) => (
                    <div key={index} className={`insight ${insight.type}`}>
                      <div className="insight-content">
                        <span className="insight-icon">
                          {insight.type === 'suggestion' ? '💡' : 
                           insight.type === 'warning' ? '⚠️' : 
                           insight.type === 'tip' ? '💭' : '✨'}
                        </span>
                        <span className="insight-message">{insight.message}</span>
                      </div>
                      {insight.action && (
                        <button className="insight-action" onClick={() => saveExtractedInsights(message)}>
                          {insight.action}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {message.extractedData && (
                <div className="extracted-insights">
                  <button 
                    className="insights-toggle"
                    onClick={() => saveExtractedInsights(message)}
                  >
                    💾 Save insights to case tabs
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-section">
        <div className="input-container">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your case... (Press Enter to send, Shift+Enter for new line)"
            disabled={isProcessing}
            rows={3}
          />
          <button
            onClick={() => handleSubmit()}
            disabled={!input.trim() || isProcessing}
            className="send-button"
          >
            {isProcessing ? '⏳' : '📤'}
          </button>
        </div>
      </div>
      </div>

      <style>{`
        .enhanced-ai-dialogue {
          display: flex;
          height: calc(100vh - 200px);
          width: 100%;
          padding: 24px;
          gap: 20px;
        }

        .conversation-history-sidebar {
          width: 300px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .history-header h4 {
          margin: 0;
          font-size: 16px;
        }

        .history-header .btn {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          border-radius: 4px;
          padding: 4px 8px;
          cursor: pointer;
          font-size: 14px;
        }

        .history-search {
          padding: 16px 20px;
          border-bottom: 1px solid #e0e0e0;
        }

        .search-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          box-sizing: border-box;
        }

        .search-input:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
        }

        .conversation-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }

        .conversation-item {
          position: relative;
          padding: 12px 16px;
          margin-bottom: 8px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid #e0e0e0;
        }

        .conversation-item:hover {
          background: #f8f9fa;
          transform: translateY(-1px);
        }

        .conversation-item.active {
          background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
          border-color: #007bff;
        }

        .conversation-title {
          font-weight: 500;
          font-size: 14px;
          color: #333;
          margin-bottom: 4px;
          line-height: 1.3;
        }

        .conversation-meta {
          font-size: 12px;
          color: #666;
        }

        .delete-conversation {
          position: absolute;
          top: 8px;
          right: 8px;
          background: none;
          border: none;
          font-size: 12px;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s;
          padding: 4px;
        }

        .conversation-item:hover .delete-conversation {
          opacity: 1;
        }

        .delete-conversation:hover {
          transform: scale(1.2);
        }

        .no-conversations {
          text-align: center;
          padding: 40px 20px;
          color: #666;
          font-style: italic;
        }

        .dialogue-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .dialogue-main.with-sidebar {
          flex: 1;
        }

        .dialogue-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          flex-shrink: 0;
        }

        .header-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .conversation-indicator {
          font-size: 12px;
          opacity: 0.8;
        }

        .header-info h3 {
          margin: 0 0 4px 0;
          font-size: 24px;
        }

        .status {
          margin: 0;
          opacity: 0.9;
          font-size: 14px;
        }

        .btn-outline {
          padding: 8px 16px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .btn-outline:hover {
          background: rgba(255,255,255,0.2);
        }

        .quick-actions {
          padding: 20px;
          background: #f8f9fa;
          border-bottom: 1px solid #e0e0e0;
          flex-shrink: 0;
        }

        .quick-actions h4 {
          margin: 0 0 16px 0;
          color: #333;
          font-size: 16px;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .quick-action-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
          text-align: left;
        }

        .quick-action-btn:hover {
          background: #e9ecef;
          transform: translateY(-1px);
        }

        .quick-action-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .action-icon {
          font-size: 16px;
          flex-shrink: 0;
        }

        .action-label {
          font-weight: 500;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          background: #f8f9fa;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .message {
          display: flex;
          gap: 12px;
          max-width: 85%;
        }

        .message.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .message.ai,
        .message.system {
          align-self: flex-start;
        }

        .message-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
          background: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .message-bubble {
          background: white;
          border-radius: 18px;
          padding: 16px 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          position: relative;
          max-width: 100%;
        }

        .message.user .message-bubble {
          background: #007bff;
          color: white;
        }

        .message.system .message-bubble {
          background: #28a745;
          color: white;
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 12px;
          opacity: 0.8;
        }

        .message-sender {
          font-weight: 600;
        }

        .message-time {
          font-size: 11px;
        }

        .message-content {
          line-height: 1.5;
        }

        .message-heading {
          font-weight: 600;
          font-size: 16px;
          margin: 12px 0 8px 0;
          color: #333;
        }

        .message.user .message-heading,
        .message.system .message-heading {
          color: white;
        }

        .message-bullet {
          margin: 4px 0;
          padding-left: 16px;
        }

        .message-line {
          margin: 4px 0;
        }

        .message-space {
          height: 8px;
        }

        .typing-indicator {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .typing-indicator span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #999;
          animation: typing 1.4s infinite ease-in-out;
        }

        .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
        .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

        @keyframes typing {
          0%, 80%, 100% { opacity: 0.3; }
          40% { opacity: 1; }
        }

        .message-insights {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .insight {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 13px;
        }

        .insight.suggestion {
          background: #e3f2fd;
          color: #1976d2;
        }

        .insight.warning {
          background: #fff3e0;
          color: #f57c00;
        }

        .insight.tip {
          background: #f3e5f5;
          color: #7b1fa2;
        }

        .insight.insight {
          background: #e8f5e8;
          color: #2e7d32;
        }

        .insight-content {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .insight-icon {
          font-size: 14px;
        }

        .insight-action {
          padding: 4px 8px;
          background: rgba(255,255,255,0.8);
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 500;
        }

        .extracted-insights {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #eee;
        }

        .insights-toggle {
          padding: 8px 12px;
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: #495057;
          transition: all 0.2s;
        }

        .insights-toggle:hover {
          background: #e9ecef;
        }

        .input-section {
          background: white;
          border-top: 1px solid #e0e0e0;
          padding: 20px;
          flex-shrink: 0;
        }

        .input-container {
          display: flex;
          gap: 12px;
          align-items: flex-end;
        }

        .input-container textarea {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          resize: none;
          min-height: 48px;
          max-height: 150px;
        }

        .input-container textarea:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
        }

        .send-button {
          padding: 12px 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          min-width: 50px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .send-button:hover:not(:disabled) {
          background: #0056b3;
        }

        .send-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .enhanced-ai-dialogue {
            flex-direction: column;
            padding: 16px;
            height: calc(100vh - 120px);
            gap: 16px;
          }

          .conversation-history-sidebar {
            width: 100%;
            max-height: 300px;
            order: -1;
          }

          .dialogue-main {
            flex: 1;
          }

          .actions-grid {
            grid-template-columns: 1fr;
          }

          .message {
            max-width: 95%;
          }

          .input-container {
            flex-direction: column;
            gap: 8px;
          }

          .send-button {
            align-self: flex-end;
            width: 100px;
          }

          .header-actions {
            flex-wrap: wrap;
            gap: 4px;
          }

          .btn-outline {
            padding: 6px 12px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
};