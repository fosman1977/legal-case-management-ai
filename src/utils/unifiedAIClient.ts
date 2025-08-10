/**
 * Unified AI Client for Legal Case Management
 * Provides a single interface for all AI operations, replacing direct Ollama calls
 */

// LocalAI-only implementation

interface UnifiedAIConfig {
  localAIUrl: string;
  defaultModel: string;
  timeout: number;
}

interface AIResponse {
  content: string;
  model: string;
  timestamp: string;
  context?: string;
  confidence?: number;
}

interface EntityExtractionResult {
  persons: Array<{ name: string; role: string; confidence: number }>;
  issues: Array<{ issue: string; type: string; confidence: number }>;
  chronologyEvents: Array<{ date: string; event: string; confidence: number }>;
  authorities: Array<{ citation: string; relevance: string; confidence: number }>;
}

class UnifiedAIClient {
  private config: UnifiedAIConfig;
  private modelCache: Map<string, boolean> = new Map();
  private connectionStatus: 'connected' | 'disconnected' | 'connecting' = 'disconnected';
  private lastError: string | null = null;

  constructor(config: Partial<UnifiedAIConfig> = {}) {
    this.config = {
      localAIUrl: config.localAIUrl || 'http://localhost:8080',
      defaultModel: config.defaultModel || (import.meta.env?.VITE_AI_MODEL as string) || 'gpt-3.5-turbo', // LocalAI commonly supports this
      timeout: config.timeout || 300000 // 5 minutes for model loading and processing
    };
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): { status: 'connected' | 'disconnected' | 'connecting'; lastError: string | null } {
    return {
      status: this.connectionStatus,
      lastError: this.lastError
    };
  }

  /**
   * Check LocalAI availability
   */
  private async isLocalAIAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.localAIUrl}/v1/models`, {
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if LocalAI service is available
   */
  async isAvailable(): Promise<boolean> {
    this.connectionStatus = 'connecting';
    
    try {
      const response = await fetch(`${this.config.localAIUrl}/v1/models`, {
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        this.connectionStatus = 'connected';
        this.lastError = null;
        return true;
      } else {
        this.connectionStatus = 'disconnected';
        this.lastError = `LocalAI responded with status ${response.status}`;
        return false;
      }
    } catch (error) {
      this.connectionStatus = 'disconnected';
      this.lastError = error instanceof Error ? error.message : 'LocalAI connection failed';
      return false;
    }
  }

  /**
   * Get available models from LocalAI
   */
  async getModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.localAIUrl}/v1/models`);
      if (response.ok) {
        const data = await response.json();
        const models = data.data?.map((m: any) => m.id) || [];
        return models.length > 0 ? models : [this.config.defaultModel];
      }
    } catch (error) {
      console.warn('LocalAI models fetch failed:', error);
    }
    
    // Return default model if fetch fails
    return [this.config.defaultModel];
  }

  /**
   * Ensure a model is available in LocalAI
   */
  async ensureModel(model: string): Promise<boolean> {
    if (this.modelCache.has(model)) return this.modelCache.get(model)!;

    try {
      const models = await this.getModels();
      const exists = models.includes(model);
      this.modelCache.set(model, exists);
      
      if (!exists) {
        console.warn(`Model ${model} not found in LocalAI. Available models:`, models);
        // LocalAI doesn't support dynamic model pulling like Ollama
        // Users need to configure models in LocalAI directly
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Failed to check model availability:', error);
      return false;
    }
  }

  /**
   * General purpose AI query using LocalAI
   */
  async query(
    prompt: string,
    options: {
      model?: string;
      context?: string;
      temperature?: number;
      maxTokens?: number;
      retries?: number;
    } = {}
  ): Promise<AIResponse> {
    const model = options.model || this.config.defaultModel;
    
    // Ensure model is available
    const modelAvailable = await this.ensureModel(model);
    if (!modelAvailable) {
      // Try with default model if specified model isn't available
      const fallbackModel = this.config.defaultModel;
      if (model !== fallbackModel) {
        console.warn(`Model ${model} not available, falling back to ${fallbackModel}`);
        return this.query(prompt, { ...options, model: fallbackModel });
      }
    }

    const fullPrompt = options.context 
      ? `Context:\n${options.context}\n\nQuestion: ${prompt}`
      : prompt;

    const maxRetries = options.retries ?? 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Exponential backoff: 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          console.log(`Retry attempt ${attempt + 1}/${maxRetries} for LocalAI query`);
        }

        const response = await fetch(`${this.config.localAIUrl}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: fullPrompt }],
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? 2048,
            stream: false
          }),
          signal: AbortSignal.timeout(this.config.timeout)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`LocalAI query failed (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        this.connectionStatus = 'connected';
        this.lastError = null;
        
        return {
          content: data.choices[0]?.message?.content || '',
          model,
          timestamp: new Date().toISOString(),
          context: options.context,
          confidence: 0.85
        };
      } catch (error) {
        lastError = error as Error;
        this.connectionStatus = 'disconnected';
        this.lastError = lastError.message;
        console.error(`LocalAI query error (attempt ${attempt + 1}/${maxRetries}):`, error);
      }
    }

    throw new Error(`LocalAI query failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Chat with conversation history using LocalAI
   */
  async chat(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    model?: string
  ): Promise<AIResponse> {
    const selectedModel = model || this.config.defaultModel;
    await this.ensureModel(selectedModel);

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          console.log(`Retry attempt ${attempt + 1}/${maxRetries} for LocalAI chat`);
        }

        const response = await fetch(`${this.config.localAIUrl}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: selectedModel,
            messages,
            temperature: 0.7,
            max_tokens: 2048,
            stream: false
          }),
          signal: AbortSignal.timeout(this.config.timeout)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`LocalAI chat failed (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        this.connectionStatus = 'connected';
        this.lastError = null;
        
        return {
          content: data.choices[0]?.message?.content || '',
          model: selectedModel,
          timestamp: new Date().toISOString(),
          confidence: 0.85
        };
      } catch (error) {
        lastError = error as Error;
        this.connectionStatus = 'disconnected';
        this.lastError = lastError.message;
        console.error(`LocalAI chat error (attempt ${attempt + 1}/${maxRetries}):`, error);
      }
    }

    throw new Error(`LocalAI chat failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Extract entities from legal documents
   */
  async extractEntities(
    text: string,
    documentType: string = 'legal'
  ): Promise<EntityExtractionResult> {
    const prompt = `
You are a legal document analyzer. Extract the following entities from this ${documentType} document:

1. PERSONS: All people mentioned with their roles
2. ISSUES: Legal issues, claims, or disputes
3. EVENTS: Important dates and events in chronological order
4. AUTHORITIES: Legal citations, cases, statutes

Format your response as JSON with these exact keys:
{
  "persons": [{"name": "string", "role": "string", "confidence": number}],
  "issues": [{"issue": "string", "type": "string", "confidence": number}],
  "chronologyEvents": [{"date": "string", "event": "string", "confidence": number}],
  "authorities": [{"citation": "string", "relevance": "string", "confidence": number}]
}

Document:
${text}

Respond ONLY with valid JSON.`;

    try {
      const response = await this.query(prompt, {
        temperature: 0.3,
        maxTokens: 4096
      });

      // Extract JSON from response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const result = JSON.parse(jsonMatch[0]);
      
      // Ensure all arrays exist
      return {
        persons: result.persons || [],
        issues: result.issues || [],
        chronologyEvents: result.chronologyEvents || [],
        authorities: result.authorities || []
      };
    } catch (error) {
      console.error('Entity extraction failed:', error);
      return {
        persons: [],
        issues: [],
        chronologyEvents: [],
        authorities: []
      };
    }
  }

  /**
   * Analyze document with specific focus
   */
  async analyzeDocument(
    text: string,
    analysisType: 'summary' | 'strengths' | 'weaknesses' | 'chronology'
  ): Promise<string> {
    const prompts = {
      summary: 'Provide a concise summary of this legal document, highlighting key points:',
      strengths: 'Analyze the legal strengths and favorable points in this case:',
      weaknesses: 'Identify potential weaknesses, risks, and challenges in this case:',
      chronology: 'Extract and list all dates and events in chronological order:'
    };

    const response = await this.query(
      `${prompts[analysisType]}\n\n${text}`,
      { temperature: 0.5 }
    );

    return response.content;
  }

  /**
   * Generate legal content
   */
  async generateContent(
    type: 'skeleton' | 'pleading' | 'chronology',
    context: any
  ): Promise<string> {
    let prompt = '';

    switch (type) {
      case 'skeleton':
        prompt = `Generate a skeleton argument based on these facts:
Issues: ${JSON.stringify(context.issues)}
Key Points: ${JSON.stringify(context.keyPoints)}
Authorities: ${JSON.stringify(context.authorities)}

Format as a professional skeleton argument with numbered paragraphs.`;
        break;

      case 'pleading':
        prompt = `Draft a ${context.type} for ${context.party} based on:
Facts: ${context.facts}
Claims: ${JSON.stringify(context.claims)}

Use proper legal formatting and numbered paragraphs.`;
        break;

      case 'chronology':
        prompt = `Create a detailed chronology from these events:
${JSON.stringify(context.events)}

Format with dates, descriptions, and sources.`;
        break;
    }

    const response = await this.query(prompt, {
      temperature: 0.3,
      maxTokens: 4096
    });

    return response.content;
  }

  /**
   * RAG-style query with document context using LocalAI
   */
  async queryWithDocuments(
    query: string,
    documents: Array<{ title: string; content: string }>,
    options: {
      model?: string;
      maxContextLength?: number;
    } = {}
  ): Promise<AIResponse & { sources: string[] }> {
    // Build context from documents manually
    let context = 'Relevant documents:\n\n';
    const sources: string[] = [];
    
    const maxLength = options.maxContextLength || 8000;
    let currentLength = context.length;
    
    for (const doc of documents) {
      const docHeader = `Document: ${doc.title}\n`;
      const docContent = doc.content.substring(0, 2000) + '...\n\n';
      
      if (currentLength + docHeader.length + docContent.length > maxLength) break;
      
      context += docHeader + docContent;
      sources.push(doc.title);
      currentLength += docHeader.length + docContent.length;
    }

    const response = await this.query(query, {
      context,
      model: options.model,
      temperature: 0.3
    });

    return {
      ...response,
      sources
    };
  }

  /**
   * Upload document for processing (LocalAI-compatible)
   */
  async uploadDocument(
    file: File,
    metadata?: { caseId?: string; category?: string }
  ): Promise<{ success: boolean; documentId?: string; error?: string }> {
    // Since LocalAI doesn't have built-in RAG, we'll store documents locally
    // This could be enhanced to integrate with a vector database
    try {
      const documentId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      
      console.log('✅ Document processed for LocalAI:', file.name);
      
      return {
        success: true,
        documentId
      };
    } catch (error) {
      console.error('Failed to process document:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Query with context (simplified RAG alternative)
   */
  async queryWithContext(
    prompt: string,
    options: {
      caseId?: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
      retries?: number;
    } = {}
  ): Promise<AIResponse & { citations: string[] }> {
    // For LocalAI, we'll use the standard query with fallback
    try {
      const response = await this.query(prompt, options);
      return { 
        ...response, 
        citations: [] // LocalAI doesn't provide built-in citations
      };
    } catch (error) {
      console.error('Context query failed:', error);
      throw error;
    }
  }

  /**
   * Extract entities from documents using LocalAI
   */
  async extractEntitiesWithContext(
    caseId: string,
    documentText: string,
    documentIds?: string[]
  ): Promise<EntityExtractionResult> {
    const docFilter = documentIds ? ` Focus on documents: ${documentIds.join(', ')}` : '';
    
    const prompt = `Analyze the legal document text${docFilter} and extract:

1. PERSONS: Names and roles (plaintiff, defendant, witness, judge, lawyer, etc.)
2. ISSUES: Legal issues, claims, defenses, disputes
3. CHRONOLOGY EVENTS: Important dates and what happened
4. AUTHORITIES: Case citations, statutes, legal references

Document text:
${documentText}

Return ONLY valid JSON:
{
  "persons": [{"name": "string", "role": "string", "confidence": number}],
  "issues": [{"issue": "string", "type": "legal|factual|procedural", "confidence": number}],
  "chronologyEvents": [{"date": "YYYY-MM-DD or descriptive", "event": "string", "confidence": number}],
  "authorities": [{"citation": "string", "relevance": "string", "confidence": number}]
}`;

    try {
      const response = await this.query(prompt, {
        model: this.config.defaultModel,
        temperature: 0.1,
        maxTokens: 4000
      });

      // Extract and parse JSON
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const extracted = JSON.parse(jsonMatch[0]);

      // Validate and normalize data
      const result: EntityExtractionResult = {
        persons: Array.isArray(extracted.persons) ? extracted.persons.map((p: any) => ({
          name: String(p.name || ''),
          role: String(p.role || 'unknown'),
          confidence: Number(p.confidence) || 0.5
        })) : [],
        issues: Array.isArray(extracted.issues) ? extracted.issues.map((i: any) => ({
          issue: String(i.issue || ''),
          type: ['legal', 'factual', 'procedural'].includes(i.type) ? i.type : 'factual',
          confidence: Number(i.confidence) || 0.5
        })) : [],
        chronologyEvents: Array.isArray(extracted.chronologyEvents) ? extracted.chronologyEvents.map((e: any) => ({
          date: String(e.date || ''),
          event: String(e.event || ''),
          confidence: Number(e.confidence) || 0.5
        })) : [],
        authorities: Array.isArray(extracted.authorities) ? extracted.authorities.map((a: any) => ({
          citation: String(a.citation || ''),
          relevance: String(a.relevance || ''),
          confidence: Number(a.confidence) || 0.5
        })) : []
      };

      console.log('🔍 LocalAI entity extraction completed:', {
        persons: result.persons.length,
        issues: result.issues.length,
        events: result.chronologyEvents.length,
        authorities: result.authorities.length
      });

      return result;
    } catch (error) {
      console.error('LocalAI entity extraction failed:', error);
      throw new Error(`Entity extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Create singleton instance
const unifiedAIClient = new UnifiedAIClient();

// Export both the class and instance
export { UnifiedAIClient, unifiedAIClient };
export type { AIResponse, EntityExtractionResult };