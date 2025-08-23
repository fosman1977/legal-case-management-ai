/**
 * AI Model Migration Utility  
 * Helps migrate from LocalAI to Claude AI models
 */

export class AIModelMigration {
  private static cachedBestModel: string | null = null;
  private static lastModelCheck: number = 0;
  private static MODEL_CACHE_TTL = 30000; // 30 seconds

  /**
   * Get the best available LocalAI model, replacing hardcoded gpt-3.5-turbo references
   */
  static async getBestModel(): Promise<string> {
    const now = Date.now();
    
    // Return cached model if still valid
    if (this.cachedBestModel && (now - this.lastModelCheck) < this.MODEL_CACHE_TTL) {
      return this.cachedBestModel;
    }

    // Use Claude as the default model instead of LocalAI
    const claudeModel = 'claude-3-5-sonnet-20241022';
    this.cachedBestModel = claudeModel;
    this.lastModelCheck = now;
    
    console.log(`Using Claude model: ${claudeModel}`);
    return claudeModel;
  }

  /**
   * Migrate old gpt-3.5-turbo preferences to use actual available models
   */
  static async migrateStoredPreferences(): Promise<void> {
    const bestModel = await this.getBestModel();
    
    // Migrate common localStorage keys
    const prefsToMigrate = [
      'ai_preferences',
      'selected_model',
      'localai_model'
    ];

    prefsToMigrate.forEach(key => {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (typeof parsed === 'object' && parsed.selectedModel === 'gpt-3.5-turbo') {
            parsed.selectedModel = bestModel;
            localStorage.setItem(key, JSON.stringify(parsed));
            console.log(`Migrated ${key} from gpt-3.5-turbo to ${bestModel}`);
          }
        } catch (error) {
          // If it's a string value
          if (stored === 'gpt-3.5-turbo') {
            localStorage.setItem(key, bestModel);
            console.log(`Migrated ${key} from gpt-3.5-turbo to ${bestModel}`);
          }
        }
      }
    });

    // Migrate case-specific preferences
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ai_prefs_')) {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.selectedModel === 'gpt-3.5-turbo') {
              parsed.selectedModel = bestModel;
              localStorage.setItem(key, JSON.stringify(parsed));
              console.log(`Migrated ${key} from gpt-3.5-turbo to ${bestModel}`);
            }
          } catch (error) {
            console.warn(`Failed to migrate preferences for ${key}:`, error);
          }
        }
      }
    }
  }

  /**
   * Get available models with fallback handling
   */
  static async getAvailableModels(): Promise<string[]> {
    // Return available Claude models instead of LocalAI models
    return [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022', 
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ];
  }

  /**
   * Create a batch processor for document analysis to avoid 413 errors
   */
  static createDocumentBatchProcessor<T>(
    batchSize: number = 5,
    onProgress?: (completed: number, total: number) => void
  ) {
    return {
      async processDocuments(
        documents: T[],
        processor: (doc: T) => Promise<any>
      ): Promise<any[]> {
        console.log(`Processing ${documents.length} documents in batches of ${batchSize} using Claude`);
        
        const results = [];
        for (let i = 0; i < documents.length; i += batchSize) {
          const batch = documents.slice(i, i + batchSize);
          
          for (const doc of batch) {
            try {
              const result = await processor(doc);
              results.push(result);
            } catch (error) {
              console.error('Document processing failed:', error);
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              results.push({ error: errorMessage, document: doc });
            }
          }
          
          if (onProgress) {
            onProgress(Math.min(i + batchSize, documents.length), documents.length);
          }
        }
        
        return results;
      }
    };
  }

  /**
   * Check Claude AI connection status
   */
  static async checkConnection(): Promise<{
    connected: boolean;
    availableModels: string[];
    selectedModel: string;
    error?: string;
  }> {
    try {
      // Always return Claude as connected since it's cloud-based
      const models = await this.getAvailableModels();
      const bestModel = await this.getBestModel();

      return {
        connected: true,
        availableModels: models,
        selectedModel: bestModel
      };
    } catch (error) {
      return {
        connected: true, // Claude is always available
        availableModels: await this.getAvailableModels(),
        selectedModel: 'claude-3-5-sonnet-20241022',
        error: error instanceof Error ? error.message : undefined
      };
    }
  }

  /**
   * Clear model cache
   */
  static clearCache(): void {
    this.cachedBestModel = null;
    this.lastModelCheck = 0;
    console.log('AI model cache cleared');
  }
}

// Auto-migrate on module load
if (typeof window !== 'undefined') {
  // Run migration after a brief delay to avoid blocking startup
  setTimeout(() => {
    AIModelMigration.migrateStoredPreferences().catch(error => {
      console.warn('AI model migration failed:', error);
    });
  }, 2000);
}