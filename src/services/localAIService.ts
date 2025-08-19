/**
 * LocalAI Service - One-click connection and management
 */

export interface LocalAIConfig {
  endpoint: string;
  apiKey?: string;
  models: string[];
  defaultModel: string;
  timeout?: number;
  retryAttempts?: number;
}

export interface LocalAIStatus {
  connected: boolean;
  endpoint: string;
  availableModels: string[];
  currentModel: string;
  error?: string;
  lastCheck?: Date;
  version?: string;
}

export interface ModelInfo {
  name: string;
  size?: string;
  parameters?: string;
  quantization?: string;
  loaded: boolean;
  downloadUrl?: string;
}

class LocalAIService {
  private config: LocalAIConfig = {
    endpoint: 'http://localhost:8080',
    models: ['gpt-4', 'gpt-3.5-turbo', 'text-embedding-ada-002', 'whisper-1'],
    defaultModel: 'gpt-4', // LocalAI typically provides gpt-4 model
    timeout: 30000,
    retryAttempts: 3
  };

  private status: LocalAIStatus = {
    connected: false,
    endpoint: 'http://localhost:8080',
    availableModels: [],
    currentModel: 'gpt-4'
  };

  private reconnectTimer: NodeJS.Timeout | null = null;
  private statusCallbacks: ((status: LocalAIStatus) => void)[] = [];

  /**
   * One-click connect to LocalAI
   */
  async connect(endpoint?: string): Promise<LocalAIStatus> {
    if (endpoint) {
      this.config.endpoint = endpoint;
      this.status.endpoint = endpoint;
    }

    try {
      // Check if LocalAI is running
      const healthCheck = await this.checkHealth();
      
      if (!healthCheck) {
        // Don't try to auto-start, just inform the user
        console.log('LocalAI is not available - using fallback processing mode');
        this.status.connected = false;
        this.status.error = 'LocalAI service not available';
        return this.status;
      }

      // Get available models
      const models = await this.getModels();
      this.status.availableModels = models;

      // Intelligently select the best available model
      if (models.length === 0) {
        console.warn('No models available. You may need to download models.');
        this.status.error = 'No models loaded in LocalAI';
      } else {
        // Prefer models in order: gpt-4, gpt-3.5-turbo, then any other
        const preferredModels = ['gpt-4', 'gpt-3.5-turbo', 'llama-2', 'mistral'];
        let selectedModel = models[0]; // fallback to first model
        
        for (const preferred of preferredModels) {
          const found = models.find(m => m.toLowerCase().includes(preferred.toLowerCase()));
          if (found) {
            selectedModel = found;
            break;
          }
        }
        
        this.config.defaultModel = selectedModel;
        this.status.currentModel = selectedModel;
        console.log(`Selected LocalAI model: ${selectedModel} from available: ${models.join(', ')}`);
      }

      this.status.connected = true;
      this.status.lastCheck = new Date();
      this.status.error = undefined;

      // Start auto-reconnect monitoring
      this.startMonitoring();

      this.notifyStatusChange();
      return this.status;

    } catch (error) {
      this.status.connected = false;
      this.status.error = error instanceof Error ? error.message : 'Connection failed';
      this.notifyStatusChange();
      throw error;
    }
  }

  /**
   * Disconnect from LocalAI
   */
  disconnect(): void {
    this.status.connected = false;
    this.stopMonitoring();
    this.notifyStatusChange();
  }

  /**
   * Check if LocalAI is healthy
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.endpoint}/readyz`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get available models
   */
  async getModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.endpoint}/v1/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(this.config.timeout || 30000)
      });

      if (!response.ok) {
        throw new Error(`Failed to get models: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data?.map((model: any) => model.id) || [];
    } catch (error) {
      console.error('Failed to get models:', error);
      return [];
    }
  }

  /**
   * Download a model
   */
  async downloadModel(modelName: string): Promise<void> {
    const modelConfigs: Record<string, any> = {
      'gpt-3.5-turbo': {
        url: 'https://gpt4all.io/models/gguf/gpt4all-13b-snoozy-q4_0.gguf',
        name: 'gpt-3.5-turbo',
        parameters: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2048
        }
      },
      'tinyllama': {
        url: 'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf',
        name: 'tinyllama',
        parameters: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2048
        }
      },
      'mistral-7b-instruct': {
        url: 'https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf',
        name: 'mistral-7b-instruct',
        parameters: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 4096
        }
      }
    };

    const modelConfig = modelConfigs[modelName];
    if (!modelConfig) {
      throw new Error(`Model configuration not found for ${modelName}`);
    }

    try {
      // Apply model configuration
      const applyResponse = await fetch(`${this.config.endpoint}/models/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: modelName,
          url: modelConfig.url,
          name: modelConfig.name,
          overrides: modelConfig.parameters
        })
      });

      if (!applyResponse.ok) {
        throw new Error(`Failed to download model: ${applyResponse.statusText}`);
      }

      // Wait for model to be ready
      await this.waitForModel(modelName);

    } catch (error) {
      console.error(`Failed to download model ${modelName}:`, error);
      throw error;
    }
  }

  /**
   * Wait for model to be ready
   */
  private async waitForModel(modelName: string, maxAttempts = 30): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      const models = await this.getModels();
      if (models.includes(modelName)) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    throw new Error(`Model ${modelName} failed to load after ${maxAttempts} attempts`);
  }

  /**
   * Start LocalAI server
   */
  private async startLocalAI(): Promise<void> {
    try {
      // Try to start LocalAI using docker-compose
      const response = await fetch('/api/start-localai', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to start LocalAI');
      }

      // Wait for LocalAI to be ready
      await this.waitForLocalAI();
    } catch (error) {
      console.error('Failed to start LocalAI:', error);
      console.log('LocalAI auto-start failed - continuing with fallback processing');
    }
  }

  /**
   * Wait for LocalAI to be ready
   */
  private async waitForLocalAI(maxAttempts = 30): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      if (await this.checkHealth()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    throw new Error('LocalAI failed to start');
  }

  /**
   * Send a completion request
   */
  async completion(prompt: string, options: any = {}): Promise<string> {
    if (!this.status.connected) {
      throw new Error('Not connected to LocalAI');
    }

    const response = await fetch(`${this.config.endpoint}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: options.model || this.status.currentModel,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2048,
        ...options
      }),
      signal: AbortSignal.timeout(this.config.timeout || 30000)
    });

    if (!response.ok) {
      throw new Error(`Completion failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  /**
   * Start monitoring connection
   */
  private startMonitoring(): void {
    this.stopMonitoring();
    this.reconnectTimer = setInterval(async () => {
      const isHealthy = await this.checkHealth();
      if (this.status.connected !== isHealthy) {
        this.status.connected = isHealthy;
        this.status.lastCheck = new Date();
        if (!isHealthy) {
          this.status.error = 'Connection lost';
        } else {
          this.status.error = undefined;
        }
        this.notifyStatusChange();
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Stop monitoring connection
   */
  private stopMonitoring(): void {
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(callback: (status: LocalAIStatus) => void): () => void {
    this.statusCallbacks.push(callback);
    return () => {
      this.statusCallbacks = this.statusCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify status change
   */
  private notifyStatusChange(): void {
    this.statusCallbacks.forEach(callback => callback(this.status));
  }

  /**
   * Get current status
   */
  getStatus(): LocalAIStatus {
    return { ...this.status };
  }

  /**
   * Set current model
   */
  setModel(modelName: string): void {
    if (this.status.availableModels.includes(modelName)) {
      this.status.currentModel = modelName;
      this.config.defaultModel = modelName;
      this.notifyStatusChange();
    } else {
      throw new Error(`Model ${modelName} is not available`);
    }
  }

  /**
   * Test connection with a simple prompt
   */
  async test(): Promise<boolean> {
    try {
      const response = await this.completion('Hello, respond with "OK" if you can hear me.');
      return response.toLowerCase().includes('ok');
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const localAIService = new LocalAIService();
export default localAIService;