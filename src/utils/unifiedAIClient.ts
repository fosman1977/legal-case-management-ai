/**
 * Unified AI Client for Legal Case Management
 * Provides a single interface for all AI operations, replacing direct Ollama calls
 */

import { optimizedOpenWebUIClient, ModelInfo } from './optimizedOpenWebUIClient';
import { ragClient, RAGResponse } from './openWebUIRAGClient';

interface UnifiedAIConfig {
  ollamaUrl: string;
  openWebUIUrl: string;
  defaultModel: string;
  timeout: number;
  useOpenWebUI: boolean;
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
      ollamaUrl: config.ollamaUrl || 'http://localhost:11436',
      openWebUIUrl: config.openWebUIUrl || 'http://localhost:3002',
      defaultModel: config.defaultModel || (import.meta.env?.VITE_AI_MODEL as string) || 'llama3.2:3b', // Better quality for legal analysis
      timeout: config.timeout || 300000, // Increased to 5 minutes for initial model load and large documents
      useOpenWebUI: config.useOpenWebUI !== undefined ? config.useOpenWebUI : false // Disabled by default for now
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
   * Check if AI service is available (OpenWebUI preferred)
   */
  async isAvailable(): Promise<boolean> {
    if (this.config.useOpenWebUI) {
      const isOpenWebUIAvailable = await optimizedOpenWebUIClient.isAvailable();
      if (isOpenWebUIAvailable) return true;
    }

    // Fallback to direct Ollama
    try {
      this.connectionStatus = 'connecting';
      const response = await fetch(`${this.config.ollamaUrl}/api/version`, {
        signal: AbortSignal.timeout(5000)
      });
      if (response.ok) {
        this.connectionStatus = 'connected';
        this.lastError = null;
        return true;
      }
      this.connectionStatus = 'disconnected';
      this.lastError = 'Ollama service not responding';
      return false;
    } catch (error) {
      this.connectionStatus = 'disconnected';
      this.lastError = error instanceof Error ? error.message : 'Connection failed';
      return false;
    }
  }

  /**
   * Get available models (OpenWebUI preferred)
   */
  async getModels(): Promise<string[]> {
    if (this.config.useOpenWebUI) {
      try {
        const models = await optimizedOpenWebUIClient.getModels();
        if (models.length > 0) {
          return models.map(m => m.id || m.name);
        }
      } catch (error) {
        console.warn('OpenWebUI models fetch failed, falling back to Ollama');
      }
    }

    // Fallback to direct Ollama
    try {
      const response = await fetch(`${this.config.ollamaUrl}/api/tags`);
      if (!response.ok) return [this.config.defaultModel];
      
      const data = await response.json();
      return data.models?.map((m: any) => m.name) || [this.config.defaultModel];
    } catch {
      return [this.config.defaultModel];
    }
  }

  /**
   * Ensure a model is available and loaded
   */
  async ensureModel(model: string): Promise<boolean> {
    if (this.modelCache.has(model)) return this.modelCache.get(model)!;

    try {
      const models = await this.getModels();
      const exists = models.includes(model);
      this.modelCache.set(model, exists);
      
      if (!exists) {
        console.log(`Model ${model} not found. Pulling...`);
        await this.pullModel(model);
        this.modelCache.set(model, true);
      }
      
      // Preload the model to avoid timeout on first use
      console.log(`Preloading model ${model}...`);
      try {
        await fetch(`${this.config.ollamaUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            prompt: 'test',
            stream: false
          }),
          signal: AbortSignal.timeout(60000) // 1 minute for preload
        });
        console.log(`Model ${model} preloaded successfully`);
      } catch (error) {
        console.warn(`Model preload warning:`, error);
      }
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Pull a model
   */
  async pullModel(model: string): Promise<void> {
    try {
      await fetch(`${this.config.ollamaUrl}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: model })
      });
    } catch (error) {
      console.error('Failed to pull model:', error);
    }
  }

  /**
   * General purpose AI query
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
    await this.ensureModel(model);

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
          console.log(`Retry attempt ${attempt + 1}/${maxRetries} for AI query`);
        }

        const response = await fetch(`${this.config.ollamaUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            prompt: fullPrompt,
            stream: false,
            options: {
              temperature: options.temperature ?? 0.7,
              num_predict: options.maxTokens ?? 2048,
              top_k: 40,
              top_p: 0.9,
              repeat_penalty: 1.1
            }
          }),
          signal: AbortSignal.timeout(this.config.timeout)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`AI query failed (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        
        this.connectionStatus = 'connected';
        this.lastError = null;
        
        return {
          content: data.response,
          model,
          timestamp: new Date().toISOString(),
          context: options.context,
          confidence: 0.85 // Base confidence, can be refined
        };
      } catch (error) {
        lastError = error as Error;
        this.connectionStatus = 'disconnected';
        this.lastError = lastError.message;
        console.error(`AI query error (attempt ${attempt + 1}/${maxRetries}):`, error);
      }
    }

    throw new Error(`AI query failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Chat with conversation history
   */
  async chat(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    model?: string
  ): Promise<AIResponse> {
    const selectedModel = model || this.config.defaultModel;
    await this.ensureModel(selectedModel);

    // Convert messages to prompt format
    let prompt = '';
    for (const msg of messages) {
      if (msg.role === 'system') {
        prompt += `System: ${msg.content}\n\n`;
      } else if (msg.role === 'user') {
        prompt += `User: ${msg.content}\n\n`;
      } else {
        prompt += `Assistant: ${msg.content}\n\n`;
      }
    }
    prompt += 'Assistant: ';

    return this.query(prompt, { model: selectedModel });
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
   * RAG-style query with document context (OpenWebUI preferred)
   */
  async queryWithDocuments(
    query: string,
    documents: Array<{ title: string; content: string }>,
    options: {
      model?: string;
      maxContextLength?: number;
    } = {}
  ): Promise<AIResponse & { sources: string[] }> {
    if (this.config.useOpenWebUI) {
      try {
        // Use OpenWebUI's native RAG if available
        const ragResponse = await optimizedOpenWebUIClient.queryWithRAG({
          query,
          model: options.model || this.config.defaultModel,
          temperature: 0.3,
          max_tokens: 2500
        });

        return {
          content: ragResponse.content,
          model: ragResponse.model,
          timestamp: ragResponse.timestamp,
          sources: documents.map(d => d.title)
        };
      } catch (error) {
        console.warn('OpenWebUI RAG failed, falling back to context injection');
      }
    }

    // Fallback: Build context from documents manually
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
   * Upload document to RAG system for indexing
   */
  async uploadDocumentToRAG(
    file: File,
    metadata?: { caseId?: string; category?: string }
  ): Promise<{ success: boolean; documentId?: string; error?: string }> {
    try {
      const ragDoc = await ragClient.uploadDocument(file, metadata);
      console.log('✅ Document uploaded to RAG:', ragDoc.name);
      
      return {
        success: true,
        documentId: ragDoc.id
      };
    } catch (error) {
      console.error('Failed to upload to RAG:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Query using RAG - automatically finds relevant document chunks
   */
  async queryWithRAG(
    prompt: string,
    options: {
      caseId?: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
      retries?: number;
    } = {}
  ): Promise<AIResponse & { citations: RAGResponse['citations'] }> {
    try {
      // Check if RAG is available
      const ragAvailable = await ragClient.isAvailable();
      if (!ragAvailable) {
        console.warn('RAG not available, falling back to direct query');
        const response = await this.query(prompt, options);
        return { ...response, citations: [] };
      }

      const ragResponse = await ragClient.query(prompt, {
        model: options.model || this.config.defaultModel,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        caseId: options.caseId,
        documents: true
      });

      return {
        content: ragResponse.answer,
        model: options.model || this.config.defaultModel,
        timestamp: new Date().toISOString(),
        confidence: ragResponse.confidence,
        citations: ragResponse.citations
      };
    } catch (error) {
      console.error('RAG query failed:', error);
      // Fallback to direct query
      const response = await this.query(prompt, options);
      return { ...response, citations: [] };
    }
  }

  /**
   * Extract entities from documents using RAG
   */
  async extractEntitiesWithRAG(
    caseId: string,
    documentIds?: string[]
  ): Promise<EntityExtractionResult> {
    // Use documentIds if provided for filtering
    const docFilter = documentIds ? ` Focus on documents: ${documentIds.join(', ')}` : '';
    
    const prompt = `Analyze the legal documents${docFilter} and extract:

1. PERSONS: Names and roles (plaintiff, defendant, witness, judge, lawyer, etc.)
2. ISSUES: Legal issues, claims, defenses, disputes
3. CHRONOLOGY EVENTS: Important dates and what happened
4. AUTHORITIES: Case citations, statutes, legal references

IMPORTANT: Return ONLY valid JSON, no additional text.

JSON structure:
{
  "persons": [{"name": "string", "role": "string", "confidence": number}],
  "issues": [{"issue": "string", "type": "legal|factual|procedural", "confidence": number}],
  "chronologyEvents": [{"date": "YYYY-MM-DD or descriptive", "event": "string", "confidence": number}],
  "authorities": [{"citation": "string", "relevance": "string", "confidence": number}]
}`;

    try {
      const response = await this.queryWithRAG(prompt, {
        caseId,
        temperature: 0.1, // Low temperature for structured extraction
        maxTokens: 4000,
        retries: 3
      });

      // Improved JSON parsing with validation
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      let extracted: any;
      try {
        extracted = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('JSON parsing failed:', parseError);
        throw new Error('Invalid JSON in AI response');
      }

      // Validate and normalize the extracted data
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

      console.log('🔍 RAG entity extraction completed:', {
        persons: result.persons.length,
        issues: result.issues.length,
        events: result.chronologyEvents.length,
        authorities: result.authorities.length
      });

      return result;
    } catch (error) {
      console.error('RAG entity extraction failed:', error);
      // Never return mock data - throw error instead
      throw new Error(`Entity extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Create singleton instance
const unifiedAIClient = new UnifiedAIClient();

// Export both the class and instance
export { UnifiedAIClient, unifiedAIClient };
export type { AIResponse, EntityExtractionResult };