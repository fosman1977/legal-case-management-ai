// Extend Window interface for Electron API
declare global {
  interface Window {
    electronAPI?: any;
  }
}

interface OllamaResponse {
  response: string;
  done: boolean;
  model: string;
  created_at: string;
  context?: number[];
}

interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
  modified_at: string;
}

export class OllamaClient {
  // Use direct connection with mode: 'no-cors' for development
  private baseUrl: string = 'http://127.0.0.1:11434';
  
  private requestCache = new Map<string, { response: string; timestamp: number }>();
  private cacheTimeout = 10 * 60 * 1000; // 10 minutes cache
  private connectionPoolSize = 3; // Limit concurrent requests
  private activeRequests = 0;

  constructor(baseUrl?: string) {
    if (baseUrl) {
      this.baseUrl = baseUrl;
    }
    console.log(`🔧 OllamaClient initialized with baseUrl: ${this.baseUrl}`);
    console.log(`🔧 Environment: ${typeof window !== 'undefined' && !window.electronAPI ? 'Browser' : 'Electron'}`);
    
    // Proactively check available models
    this.checkAvailableModels().catch((err: any) => 
      console.warn('Initial model check failed:', err)
    );
  }

  /**
   * Check if Ollama is running and accessible
   */
  private availableModels: Set<string> = new Set();
  private lastModelCheck: number = 0;
  private modelCheckInterval = 30000; // Check models every 30 seconds

  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout for health check
      
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: controller.signal
      }).finally(() => clearTimeout(timeout));
      
      return response.ok;
    } catch (error) {
      console.warn('Ollama availability check failed:', error);
      return false;
    }
  }

  /**
   * Check and cache available models
   */
  async checkAvailableModels(): Promise<void> {
    const now = Date.now();
    if (now - this.lastModelCheck < this.modelCheckInterval) {
      return; // Skip if checked recently
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const models = data.models || [];
      
      this.availableModels.clear();
      models.forEach((model: OllamaModel) => {
        this.availableModels.add(model.name);
      });
      
      this.lastModelCheck = now;
      console.log(`🔄 Updated available models: ${Array.from(this.availableModels).join(', ')}`);
    } catch (error) {
      console.warn('Failed to check available models:', error);
    }
  }

  /**
   * Get list of available models
   */
  async getModels(): Promise<OllamaModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Failed to fetch Ollama models:', error);
      return [];
    }
  }

  /**
   * Find the best available model from a list of preferences
   */
  async getBestAvailableModel(preferredModels: string[]): Promise<string | null> {
    await this.checkAvailableModels();
    
    for (const model of preferredModels) {
      if (this.availableModels.has(model)) {
        return model;
      }
    }
    
    // If no preferred models are available, return the first available model
    const firstAvailable = Array.from(this.availableModels)[0];
    if (firstAvailable) {
      console.warn(`⚠️ No preferred models available. Using: ${firstAvailable}`);
      return firstAvailable;
    }
    
    return null;
  }

  /**
   * Generate a completion using Ollama
   */
  async generate(
    model: string, 
    prompt: string, 
    options?: {
      temperature?: number;
      max_tokens?: number;
      system?: string;
    }
  ): Promise<string> {
    try {
      // Check cache first
      const cacheKey = `${model}_${prompt.length}_${JSON.stringify(options)}`;
      const cached = this.requestCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        console.log('📦 Using cached Ollama response');
        return cached.response;
      }

      // Wait for connection pool availability
      while (this.activeRequests >= this.connectionPoolSize) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      this.activeRequests++;

      try {
        const requestBody = {
          model,
          prompt,
          stream: false,
          keep_alive: '10m', // Keep model loaded longer for better performance
          options: {
            // Core performance parameters
            temperature: options?.temperature || 0.1,
            num_predict: options?.max_tokens || 800,
            num_ctx: 2048, // Smaller context window for speed
            
            // Advanced Ollama-specific optimizations
            top_k: 10, // More aggressive filtering for speed
            top_p: 0.7, // More focused responses
            min_p: 0.05, // Filter low-probability tokens
            
            // Repetition control
            repeat_last_n: 32, // Reduced from default 64
            repeat_penalty: 1.05, // Slightly reduced for speed
            
            // Consistency and caching
            seed: 42,
            
            // Performance hints
            tfs_z: 1.0, // Tail free sampling disabled for speed
            mirostat: 0, // Disable mirostat for faster generation
          },
          system: options?.system || ''
        };

        console.log(`🤖 Ollama request ${this.activeRequests}/${this.connectionPoolSize} to model "${model}":`, {
          prompt: prompt.substring(0, 100) + '...',
          promptLength: prompt.length,
          options: requestBody.options
        });
        
        // Verify model is available and use fallback if needed
        let availableModel = await this.getBestAvailableModel([
          model, // Requested model first
          'magistral:latest', // Legal-optimized model
          'llama3.2:1b', // Small fallback
          'llama3.2', // Alternative name format
        ]);
        
        if (!availableModel) {
          throw new Error('No Ollama models are available. Please ensure Ollama is running with at least one model.');
        }
        
        if (availableModel !== model) {
          console.warn(`⚠️ Requested model "${model}" not available. Using "${availableModel}" instead`);
        }
        
        requestBody.model = availableModel;

        // Retry logic for robustness
        let lastError: Error | null = null;
        const maxRetries = 3;
        const retryDelay = 1000; // 1 second

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            console.log(`🔄 Attempt ${attempt}/${maxRetries} - Calling Ollama API with model: ${availableModel}`);
            
            // Shorter timeout for faster failure detection
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 120000); // 2 minute timeout for AI analysis

            const startTime = Date.now();
            const response = await fetch(`${this.baseUrl}/api/generate`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody),
              signal: controller.signal,
              mode: 'cors'
            }).finally(() => clearTimeout(timeout));

            if (!response.ok) {
              const errorText = await response.text().catch(() => 'No error details available');
              const error = new Error(`HTTP error! status: ${response.status} - ${errorText}`);
              
              console.error(`❌ Ollama API Error (Attempt ${attempt}): ${response.status} ${response.statusText}`);
              console.error(`📄 Error details:`, errorText);
              console.error(`🔧 Request URL:`, `${this.baseUrl}/api/generate`);
              console.error(`📋 Request body:`, JSON.stringify(requestBody, null, 2));
              
              // If it's a 404 (model not found), try to refresh models and use a different one
              if (response.status === 404 && attempt < maxRetries) {
                console.warn(`🔄 Model not found, refreshing available models...`);
                this.lastModelCheck = 0; // Force refresh
                const retryModel = await this.getBestAvailableModel([
                  'magistral:latest',
                  'llama3.2:1b',
                  'llama3.2'
                ]);
                if (retryModel && retryModel !== availableModel) {
                  console.log(`🔄 Retrying with different model: ${retryModel}`);
                  requestBody.model = retryModel;
                  availableModel = retryModel; // Update the variable for subsequent attempts
                }
              }
              
              lastError = error;
              if (attempt === maxRetries) {
                throw error;
              }
              
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
              continue;
            }

            // Success - break out of retry loop
            const data: OllamaResponse = await response.json();
            const responseTime = Date.now() - startTime;
            
            console.log(`✅ Ollama response received: ${data.response.length} characters in ${responseTime}ms`);
            
            // Cache the response
            this.requestCache.set(cacheKey, {
              response: data.response,
              timestamp: Date.now()
            });
            
            // Clean old cache entries periodically
            if (this.requestCache.size > 50) {
              this.cleanCache();
            }
            
            return data.response;
            
          } catch (error) {
            lastError = error as Error;
            console.error(`❌ Attempt ${attempt} failed:`, error);
            
            if (attempt === maxRetries) {
              break;
            }
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          }
        }

        // If we get here, all retries failed
        throw lastError || new Error('All retry attempts failed');
      } finally {
        this.activeRequests--;
      }
    } catch (error) {
      console.error('Ollama generation failed:', error);
      throw new Error(`Ollama generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of this.requestCache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.requestCache.delete(key);
      }
    }
  }

  /**
   * Preload a model to improve response times
   */
  async preloadModel(model: string): Promise<boolean> {
    try {
      console.log(`🔄 Preloading model: ${model}`);
      
      // Send a minimal request to load the model into memory
      await this.generate(model, 'Hello', {
        temperature: 0.1,
        max_tokens: 1
      });
      
      console.log(`✅ Model preloaded: ${model}`);
      return true;
    } catch (error) {
      console.warn(`Failed to preload model ${model}:`, error);
      return false;
    }
  }

  /**
   * Get optimal settings for fast generation
   */
  getSpeedOptimizedOptions() {
    return {
      temperature: 0.05, // Very low for maximum speed
      max_tokens: 500,   // Shorter responses
      system: 'Respond concisely and directly.'
    };
  }

  /**
   * Pull a model from Ollama registry
   */
  async pullModel(modelName: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: modelName }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to pull model:', error);
      return false;
    }
  }

  /**
   * Extract chronology events using Ollama
   */
  async extractChronologyEvents(content: string, model: string = 'ALIENTELLIGENCE/attorney2'): Promise<any[]> {
    const prompt = `Analyze the following legal document and extract chronological events. For each event, provide:
1. Date (in YYYY-MM-DD format if possible)
2. Description (what happened)
3. Significance (why it's important to the case)

Document content:
${content}

Please respond with a JSON array of events in this format:
[
  {
    "date": "2024-01-15",
    "description": "Contract signed between parties",
    "significance": "Establishes the contractual relationship"
  }
]

Only include actual events with specific dates mentioned in the document. If no dates are found, return an empty array.`;

    try {
      const response = await this.generate(model, prompt, {
        temperature: 0.1,
        system: "You are a legal assistant specializing in extracting chronological information from legal documents. Respond only with valid JSON."
      });

      // Try to parse JSON response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      console.warn('No valid JSON found in chronology response');
      return [];
    } catch (error) {
      console.error('Failed to extract chronology events:', error);
      return [];
    }
  }

  /**
   * Extract persons using Ollama
   */
  async extractPersons(content: string, model: string = 'ALIENTELLIGENCE/attorney2'): Promise<any[]> {
    const prompt = `Analyze the following legal document and extract all persons mentioned. For each person, provide:
1. Name (full name as mentioned)
2. Role (claimant, defendant, witness, expert, lawyer, judge, or other)
3. Description (brief description of their involvement)
4. Relevance (why they're important to the case)

Document content:
${content}

Please respond with a JSON array of persons in this format:
[
  {
    "name": "John Smith",
    "role": "claimant",
    "description": "Property developer bringing the claim",
    "relevance": "Main party to the dispute"
  }
]

Only include actual persons mentioned in the document. If no persons are found, return an empty array.`;

    try {
      const response = await this.generate(model, prompt, {
        temperature: 0.1,
        system: "You are a legal assistant specializing in identifying persons in legal documents. Respond only with valid JSON."
      });

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      console.warn('No valid JSON found in persons response');
      return [];
    } catch (error) {
      console.error('Failed to extract persons:', error);
      return [];
    }
  }

  /**
   * Extract legal issues using Ollama
   */
  async extractIssues(content: string, model: string = 'ALIENTELLIGENCE/attorney2'): Promise<any[]> {
    const prompt = `Analyze the following legal document and extract the key legal and factual issues. For each issue, provide:
1. Title (brief title of the issue)
2. Description (detailed description)
3. Category (factual, legal, quantum, or procedural)
4. Priority (high, medium, or low)
5. Status (unresolved, disputed, agreed, or resolved)

Document content:
${content}

Please respond with a JSON array of issues in this format:
[
  {
    "title": "Breach of contract",
    "description": "Whether defendant breached the construction contract by failing to complete work on time",
    "category": "legal",
    "priority": "high",
    "status": "disputed"
  }
]

Focus on genuine legal disputes and issues. If no clear issues are found, return an empty array.`;

    try {
      const response = await this.generate(model, prompt, {
        temperature: 0.1,
        system: "You are a legal assistant specializing in identifying legal issues in court documents. Respond only with valid JSON."
      });

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      console.warn('No valid JSON found in issues response');
      return [];
    } catch (error) {
      console.error('Failed to extract issues:', error);
      return [];
    }
  }

  /**
   * Extract key points using Ollama
   */
  async extractKeyPoints(content: string, model: string = 'ALIENTELLIGENCE/attorney2'): Promise<any[]> {
    const prompt = `Analyze the following legal document and extract key points for oral presentation. For each key point, provide:
1. Point (the key argument or evidence)
2. Category (opening, examination, cross_examination, closing, or legal_argument)
3. Order (suggested order for presentation)

Document content:
${content}

Please respond with a JSON array of key points in this format:
[
  {
    "point": "Defendant admitted in writing that delivery was late",
    "category": "examination",
    "order": 1
  }
]

Focus on points that would be useful for oral advocacy. If no clear key points are found, return an empty array.`;

    try {
      const response = await this.generate(model, prompt, {
        temperature: 0.1,
        system: "You are a barrister's assistant specializing in preparing key points for oral advocacy. Respond only with valid JSON."
      });

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      console.warn('No valid JSON found in key points response');
      return [];
    } catch (error) {
      console.error('Failed to extract key points:', error);
      return [];
    }
  }

  /**
   * Extract legal authorities using Ollama
   */
  async extractAuthorities(content: string, model: string = 'ALIENTELLIGENCE/attorney2'): Promise<any[]> {
    const prompt = `Analyze the following legal document and extract legal authorities (cases, statutes, regulations). For each authority, provide:
1. Citation (proper legal citation)
2. Principle (the legal principle it establishes)
3. Relevance (how it relates to this case)
4. Paragraph (specific paragraph reference if mentioned)

Document content:
${content}

Please respond with a JSON array of authorities in this format:
[
  {
    "citation": "Smith v Jones [2024] EWHC 123",
    "principle": "Damages for breach of contract must be foreseeable",
    "relevance": "Directly applicable to quantum of damages",
    "paragraph": "15"
  }
]

Only include actual legal authorities mentioned in the document. If no authorities are found, return an empty array.`;

    try {
      const response = await this.generate(model, prompt, {
        temperature: 0.1,
        system: "You are a legal researcher specializing in identifying case law and statutory authorities. Respond only with valid JSON."
      });

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      console.warn('No valid JSON found in authorities response');
      return [];
    } catch (error) {
      console.error('Failed to extract authorities:', error);
      return [];
    }
  }

  /**
   * Extract all legal information in a single call for better performance
   */
  async extractAllLegalInfo(
    content: string, 
    model: string = 'llama3.2:1b',
    options?: {
      temperature?: number;
      max_tokens?: number;
      system?: string;
    }
  ): Promise<{
    chronologyEvents: any[];
    persons: any[];
    issues: any[];
    keyPoints: any[];
    authorities: any[];
  }> {
    const prompt = `You are analyzing a legal document. Extract the following information and respond with ONLY valid JSON:

DOCUMENT CONTENT:
${content}

TASK: Extract these 5 categories of information:

1. CHRONOLOGY EVENTS: Key dates and events (format: YYYY-MM-DD or as stated)
2. PERSONS: All people mentioned with their roles
3. LEGAL ISSUES: Disputed points, legal questions, matters in contention
4. KEY POINTS: Important facts, admissions, evidence for court presentation
5. AUTHORITIES: Legal cases, statutes, regulations cited

IMPORTANT RULES:
- Respond with ONLY the JSON object below
- If a category has no information, use an empty array []
- Use exact dates when available, approximate when necessary
- Include paragraph/page references when mentioned
- Be thorough but concise

JSON FORMAT:
{
  "chronologyEvents": [
    {"date": "2024-01-15", "description": "Contract executed between parties", "significance": "Establishes contractual obligations"}
  ],
  "persons": [
    {"name": "John Smith", "role": "claimant", "description": "Company director", "relevance": "Key decision maker"}
  ],
  "issues": [
    {"title": "Breach of contract", "description": "Failure to deliver goods on time", "category": "legal", "priority": "high", "status": "disputed"}
  ],
  "keyPoints": [
    {"point": "Defendant admitted delay in email", "category": "examination", "order": 1}
  ],
  "authorities": [
    {"citation": "Hadley v Baxendale (1854)", "principle": "Remoteness of damages", "relevance": "Limits recoverable damages", "paragraph": "12"}
  ]
}`;

    try {
      const response = await this.generate(model, prompt, {
        temperature: options?.temperature || 0.3,
        max_tokens: options?.max_tokens || 3000,
        system: options?.system || "You are an expert legal assistant with deep knowledge of legal procedures and case analysis. Extract information from legal documents accurately and respond ONLY with valid JSON. If information is not present, use empty arrays."
      });

      // Improved JSON parsing with better error handling
      console.log('Raw AI response:', response.substring(0, 500) + '...');
      
      // Try multiple strategies to extract JSON
      let parsedResult = null;
      
      // Strategy 1: Look for complete JSON object with balanced braces
      const braceMatch = this.extractBalancedJson(response);
      if (braceMatch) {
        try {
          parsedResult = JSON.parse(braceMatch);
        } catch (error) {
          console.warn('Failed to parse balanced JSON:', error);
        }
      }
      
      // Strategy 2: Simple regex fallback
      if (!parsedResult) {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsedResult = JSON.parse(jsonMatch[0]);
          } catch (error) {
            console.warn('Failed to parse regex JSON:', error);
          }
        }
      }
      
      if (parsedResult) {
        return {
          chronologyEvents: Array.isArray(parsedResult.chronologyEvents) ? parsedResult.chronologyEvents : [],
          persons: Array.isArray(parsedResult.persons) ? parsedResult.persons : [],
          issues: Array.isArray(parsedResult.issues) ? parsedResult.issues : [],
          keyPoints: Array.isArray(parsedResult.keyPoints) ? parsedResult.keyPoints : [],
          authorities: Array.isArray(parsedResult.authorities) ? parsedResult.authorities : []
        };
      }
      
      console.warn('No valid JSON found in AI response. Raw response:', response);
      return {
        chronologyEvents: [],
        persons: [],
        issues: [],
        keyPoints: [],
        authorities: []
      };
    } catch (error) {
      console.error('Failed to extract all legal info:', error);
      return {
        chronologyEvents: [],
        persons: [],
        issues: [],
        keyPoints: [],
        authorities: []
      };
    }
  }

  /**
   * Extract JSON with balanced braces to handle incomplete responses
   */
  private extractBalancedJson(text: string): string | null {
    const startIndex = text.indexOf('{');
    if (startIndex === -1) return null;
    
    let braceCount = 0;
    let endIndex = startIndex;
    
    for (let i = startIndex; i < text.length; i++) {
      if (text[i] === '{') {
        braceCount++;
      } else if (text[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          endIndex = i;
          break;
        }
      }
    }
    
    if (braceCount === 0) {
      return text.substring(startIndex, endIndex + 1);
    }
    
    return null;
  }
}

export const ollamaClient = new OllamaClient();