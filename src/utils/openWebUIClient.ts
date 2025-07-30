/**
 * OpenWebUI API Client for Legal Case Management
 * Provides advanced AI capabilities with RAG, citations, and document processing
 */

interface OpenWebUIConfig {
  baseUrl: string;
  apiKey?: string;
  timeout: number;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  citations?: Citation[];
}

interface Citation {
  source: string;
  page?: number;
  content: string;
  confidence: number;
}

interface DocumentUpload {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  processed: boolean;
  extractedText?: string;
}

interface RAGQuery {
  query: string;
  documentIds?: string[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  includeCitations?: boolean;
  searchMode?: 'semantic' | 'hybrid' | 'keyword';
}

interface RAGResponse {
  response: string;
  citations: Citation[];
  sources: string[];
  confidence: number;
  processingTime: number;
}

interface ModelInfo {
  name: string;
  size: string;
  family: string;
  capabilities: string[];
  isEmbedding: boolean;
}

class OpenWebUIClient {
  private config: OpenWebUIConfig;
  private sessionToken?: string;

  constructor(config: Partial<OpenWebUIConfig> = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'http://localhost:3002',
      apiKey: config.apiKey,
      timeout: config.timeout || 30000
    };
  }

  /**
   * Initialize the client and authenticate if needed
   */
  async initialize(username?: string, password?: string): Promise<boolean> {
    try {
      // Check if OpenWebUI is running
      const healthCheck = await this.fetch('/api/v1/health');
      if (!healthCheck.ok) {
        throw new Error('OpenWebUI is not accessible');
      }

      // If credentials provided, authenticate
      if (username && password) {
        await this.authenticate(username, password);
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize OpenWebUI client:', error);
      return false;
    }
  }

  /**
   * Authenticate with OpenWebUI
   */
  async authenticate(username: string, password: string): Promise<boolean> {
    try {
      const response = await this.fetch('/api/v1/auths/signin', {
        method: 'POST',
        body: JSON.stringify({ email: username, password })
      });

      if (response.ok) {
        const data = await response.json();
        this.sessionToken = data.token;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  }

  /**
   * Get available AI models
   */
  async getModels(): Promise<ModelInfo[]> {
    try {
      const response = await this.fetch('/api/v1/models');
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }

      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Failed to get models:', error);
      return [];
    }
  }

  /**
   * Upload document for RAG processing
   */
  async uploadDocument(file: File): Promise<DocumentUpload | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await this.fetch('/api/v1/documents/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload document');
      }

      const data = await response.json();
      return {
        id: data.id,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        processed: data.processed || false,
        extractedText: data.extractedText
      };
    } catch (error) {
      console.error('Failed to upload document:', error);
      return null;
    }
  }

  /**
   * Upload multiple documents at once
   */
  async uploadDocuments(files: File[]): Promise<DocumentUpload[]> {
    const uploads = await Promise.all(
      files.map(file => this.uploadDocument(file))
    );
    return uploads.filter(upload => upload !== null) as DocumentUpload[];
  }

  /**
   * Query documents using RAG with citations
   */
  async queryDocuments(query: RAGQuery): Promise<RAGResponse> {
    try {
      const startTime = Date.now();
      
      const response = await this.fetch('/api/v1/chat/completions', {
        method: 'POST',
        body: JSON.stringify({
          model: query.model || 'llama3.2:3b',
          messages: [
            {
              role: 'system',
              content: `You are an expert legal assistant. Analyze the provided documents and answer questions with precise citations. 
              
IMPORTANT INSTRUCTIONS:
- Always provide specific citations for factual claims
- Use [Document: filename, Page: X] format for citations
- Be precise and only state what can be found in the documents  
- Distinguish between facts from documents vs. general legal knowledge
- For legal case management, focus on extracting actionable items, dates, parties, and key legal points`
            },
            {
              role: 'user',
              content: query.query
            }
          ],
          temperature: query.temperature || 0.3,
          max_tokens: query.maxTokens || 2000,
          stream: false,
          // OpenWebUI specific parameters
          documents: query.documentIds,
          use_rag: true,
          include_citations: query.includeCitations !== false,
          search_mode: query.searchMode || 'hybrid'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to query documents');
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      // Parse citations from response
      const citations = this.extractCitations(data.choices[0]?.message?.content || '');
      
      return {
        response: data.choices[0]?.message?.content || '',
        citations,
        sources: data.sources || [],
        confidence: data.confidence || 0.8,
        processingTime
      };
    } catch (error) {
      console.error('Failed to query documents:', error);
      throw error;
    }
  }

  /**
   * Enhanced chat with better conversation management
   */
  async chat(messages: ChatMessage[], model?: string): Promise<ChatMessage> {
    try {
      const response = await this.fetch('/api/v1/chat/completions', {
        method: 'POST',
        body: JSON.stringify({
          model: model || 'llama3.2:3b',
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          temperature: 0.3,
          max_tokens: 2000,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error('Chat request failed');
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      const citations = this.extractCitations(content);

      return {
        role: 'assistant',
        content,
        timestamp: new Date().toISOString(),
        citations
      };
    } catch (error) {
      console.error('Chat failed:', error);
      throw error;
    }
  }

  /**
   * Get document analysis summary
   */
  async analyzeDocument(documentId: string): Promise<any> {
    try {
      const response = await this.fetch(`/api/v1/documents/${documentId}/analyze`);
      if (!response.ok) {
        throw new Error('Failed to analyze document');
      }
      return await response.json();
    } catch (error) {
      console.error('Document analysis failed:', error);
      return null;
    }
  }

  /**
   * Delete document from RAG system
   */
  async deleteDocument(documentId: string): Promise<boolean> {
    try {
      const response = await this.fetch(`/api/v1/documents/${documentId}`, {
        method: 'DELETE'
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to delete document:', error);
      return false;
    }
  }

  /**
   * Get user information and permissions
   */
  async getUserInfo(): Promise<any> {
    try {
      const response = await this.fetch('/api/v1/users/me');
      if (!response.ok) {
        throw new Error('Failed to get user info');
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to get user info:', error);
      return null;
    }
  }

  /**
   * Create a new chat session/conversation
   */
  async createSession(title: string): Promise<string | null> {
    try {
      const response = await this.fetch('/api/v1/chats', {
        method: 'POST',
        body: JSON.stringify({ title })
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('Failed to create session:', error);
      return null;
    }
  }

  /**
   * Private helper methods
   */
  private async fetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {})
    };

    // Add authentication if available
    if (this.sessionToken) {
      headers.Authorization = `Bearer ${this.sessionToken}`;
    }

    // Remove Content-Type for FormData requests
    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    const fetchOptions: RequestInit = {
      ...options,
      headers,
      signal: AbortSignal.timeout(this.config.timeout)
    };

    return fetch(url, fetchOptions);
  }

  private extractCitations(content: string): Citation[] {
    const citations: Citation[] = [];
    const citationRegex = /\[Document:\s*([^,]+),?\s*(?:Page:\s*(\d+))?\]/g;
    
    let match;
    while ((match = citationRegex.exec(content)) !== null) {
      citations.push({
        source: match[1].trim(),
        page: match[2] ? parseInt(match[2]) : undefined,
        content: '', // Would need to be populated from document context
        confidence: 0.9
      });
    }
    
    return citations;
  }

  /**
   * Check if OpenWebUI is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.fetch('/api/v1/health');
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get embedding for text (useful for custom RAG implementations)
   */
  async getEmbedding(text: string, model = 'nomic-embed-text:latest'): Promise<number[] | null> {
    try {
      const response = await this.fetch('/api/v1/embeddings', {
        method: 'POST',
        body: JSON.stringify({
          model,
          input: text
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get embedding');
      }

      const data = await response.json();
      return data.data[0]?.embedding || null;
    } catch (error) {
      console.error('Failed to get embedding:', error);
      return null;
    }
  }
}

// Export singleton instance
export const openWebUIClient = new OpenWebUIClient();

// Export types for use in other files
export type {
  OpenWebUIConfig,
  ChatMessage,
  Citation,
  DocumentUpload,
  RAGQuery,
  RAGResponse,
  ModelInfo
};