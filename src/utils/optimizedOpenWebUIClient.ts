/**
 * Optimized OpenWebUI Client for Legal Case Management
 * Based on official OpenWebUI GitHub implementation
 * Supports OpenAI-compatible APIs and native OpenWebUI features
 */

interface OptimizedConfig {
  baseUrl: string;
  apiKey?: string;
  timeout: number;
  retries: number;
  batchSize: number;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

interface ModelInfo {
  id: string;
  name: string;
  owned_by: string;
  permission: any[];
}

interface DocumentUpload {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  processed: boolean;
  content?: string;
}

interface RAGQuery {
  query: string;
  files?: string[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_k?: number;
}

interface RAGResponse {
  content: string;
  sources: string[];
  context: string;
  model: string;
  timestamp: string;
}

class OptimizedOpenWebUIClient {
  private config: OptimizedConfig;
  private requestQueue: Map<string, Promise<any>> = new Map();
  private modelCache: ModelInfo[] = [];
  private lastModelFetch = 0;

  constructor(config: Partial<OptimizedConfig> = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'http://localhost:3002',
      apiKey: config.apiKey,
      timeout: config.timeout || 60000,
      retries: config.retries || 3,
      batchSize: config.batchSize || 5
    };
  }

  /**
   * Make authenticated request with retry logic
   */
  private async makeRequest(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<Response> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok && retryCount < this.config.retries) {
        console.warn(`Request failed (${response.status}), retrying... (${retryCount + 1}/${this.config.retries})`);
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return this.makeRequest(endpoint, options, retryCount + 1);
      }

      return response;
    } catch (error) {
      if (retryCount < this.config.retries) {
        console.warn(`Request error, retrying... (${retryCount + 1}/${this.config.retries})`, error);
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return this.makeRequest(endpoint, options, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Check if OpenWebUI is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/api/v1/models');
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get available models with caching
   */
  async getModels(): Promise<ModelInfo[]> {
    const now = Date.now();
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    if (this.modelCache.length > 0 && (now - this.lastModelFetch) < CACHE_DURATION) {
      return this.modelCache;
    }

    try {
      const response = await this.makeRequest('/api/v1/models');
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const data = await response.json();
      this.modelCache = data.data || [];
      this.lastModelFetch = now;
      
      return this.modelCache;
    } catch (error) {
      console.error('Failed to get models:', error);
      return this.modelCache; // Return cached models if available
    }
  }

  /**
   * Upload document with progress tracking
   */
  async uploadDocument(file: File, onProgress?: (progress: number) => void): Promise<DocumentUpload | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Create XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve({
                id: data.id || `file_${Date.now()}`,
                name: file.name,
                type: file.type,
                size: file.size,
                uploadedAt: new Date().toISOString(),
                processed: true,
                content: data.content || ''
              });
            } catch (parseError) {
              resolve({
                id: `file_${Date.now()}`,
                name: file.name,
                type: file.type,
                size: file.size,
                uploadedAt: new Date().toISOString(),
                processed: true
              });
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Upload failed'));

        xhr.open('POST', `${this.config.baseUrl}/api/v1/files`);
        if (this.config.apiKey) {
          xhr.setRequestHeader('Authorization', `Bearer ${this.config.apiKey}`);
        }
        xhr.send(formData);
      });
    } catch (error) {
      console.error('Failed to upload document:', error);
      return null;
    }
  }

  /**
   * Batch upload documents
   */
  async uploadDocuments(files: File[], onProgress?: (overall: number, current: string) => void): Promise<DocumentUpload[]> {
    const results: DocumentUpload[] = [];
    const batches = [];
    
    // Split files into batches
    for (let i = 0; i < files.length; i += this.config.batchSize) {
      batches.push(files.slice(i, i + this.config.batchSize));
    }

    let completedFiles = 0;

    for (const batch of batches) {
      const batchPromises = batch.map(async (file) => {
        const result = await this.uploadDocument(file, (fileProgress) => {
          const overallProgress = ((completedFiles + fileProgress / 100) / files.length) * 100;
          onProgress?.(overallProgress, file.name);
        });
        
        completedFiles++;
        return result;
      });

      const batchResults = await Promise.allSettled(batchPromises);
      batchResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          results.push(result.value);
        }
      });
    }

    return results;
  }

  /**
   * Enhanced chat with OpenAI-compatible API
   */
  async chat(messages: ChatMessage[], options: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
  } = {}): Promise<ChatMessage> {
    const requestKey = JSON.stringify({ messages, options });
    
    // Deduplicate identical requests
    if (this.requestQueue.has(requestKey)) {
      return this.requestQueue.get(requestKey);
    }

    const requestPromise = this.performChat(messages, options);
    this.requestQueue.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      this.requestQueue.delete(requestKey);
      return result;
    } catch (error) {
      this.requestQueue.delete(requestKey);
      throw error;
    }
  }

  private async performChat(messages: ChatMessage[], options: any): Promise<ChatMessage> {
    const response = await this.makeRequest('/api/v1/chat/completions', {
      method: 'POST',
      body: JSON.stringify({
        model: options.model || 'llama3.2:3b',
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2048,
        stream: options.stream || false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Chat request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return {
      role: 'assistant',
      content: data.choices[0]?.message?.content || 'No response received',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * RAG query with document context
   */
  async queryWithRAG(query: RAGQuery): Promise<RAGResponse> {
    try {
      // Use OpenWebUI's native RAG format
      const chatMessages: ChatMessage[] = [
        {
          role: 'system',
          content: 'You are a legal assistant. Use the provided documents to answer questions accurately and cite your sources.'
        },
        {
          role: 'user',
          content: query.files && query.files.length > 0 
            ? `#file:${query.files.join(' #file:')} ${query.query}`
            : query.query
        }
      ];

      const response = await this.chat(chatMessages, {
        model: query.model,
        temperature: query.temperature || 0.3,
        max_tokens: query.max_tokens || 2500
      });

      return {
        content: response.content,
        sources: query.files || [],
        context: 'RAG query with document context',
        model: query.model || 'llama3.2:3b',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('RAG query failed:', error);
      throw error;
    }
  }

  /**
   * Health check with detailed status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    models: number;
    version?: string;
    uptime?: number;
  }> {
    try {
      const [modelsResponse, healthResponse] = await Promise.allSettled([
        this.getModels(),
        this.makeRequest('/api/health')
      ]);

      const modelCount = modelsResponse.status === 'fulfilled' ? modelsResponse.value.length : 0;
      const isHealthy = healthResponse.status === 'fulfilled' && healthResponse.value.ok;

      return {
        status: isHealthy && modelCount > 0 ? 'healthy' : modelCount > 0 ? 'degraded' : 'unhealthy',
        models: modelCount
      };
    } catch {
      return {
        status: 'unhealthy',
        models: 0
      };
    }
  }

  /**
   * Clear caches and reset client state
   */
  reset(): void {
    this.modelCache = [];
    this.lastModelFetch = 0;
    this.requestQueue.clear();
  }
}

// Create optimized singleton instance
const optimizedOpenWebUIClient = new OptimizedOpenWebUIClient();

export { OptimizedOpenWebUIClient, optimizedOpenWebUIClient };
export type { ChatMessage, ModelInfo, DocumentUpload, RAGQuery, RAGResponse };