/**
 * AI Model Migration Utility
 * Helps migrate from hardcoded gpt-3.5-turbo to LocalAI's actual available models
 */

import { UnifiedAIClient } from './unifiedAIClient';

export class AIModelMigration {
  private static aiClient = new UnifiedAIClient();
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

    try {
      // Check if LocalAI is available
      const isAvailable = await AIModelMigration.aiClient.isAvailable();
      if (!isAvailable) {
        console.warn('LocalAI is not available, using fallback model');
        return 'gpt-4'; // Better fallback than gpt-3.5-turbo
      }

      // Get the best available model
      const bestModel = await AIModelMigration.aiClient.getBestAvailableModel();
      this.cachedBestModel = bestModel;
      this.lastModelCheck = now;
      
      console.log(`Selected best LocalAI model: ${bestModel}`);
      return bestModel;
    } catch (error) {
      console.error('Failed to get best model:', error);
      return 'gpt-4'; // Safe fallback
    }
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
    try {
      const models = await AIModelMigration.aiClient.getModels();
      if (models.length === 0) {
        return ['gpt-4', 'gpt-3.5-turbo']; // Reasonable fallbacks
      }
      return models;
    } catch (error) {
      console.error('Failed to get available models:', error);
      return ['gpt-4', 'gpt-3.5-turbo'];
    }
  }

  /**
   * Create a batch processor for document analysis to avoid 413 errors
   */
  static createDocumentBatchProcessor<T>(
    batchSize: number = 5,
    onProgress?: (completed: number, total: number) => void
  ) {
    const aiClient = AIModelMigration.aiClient;
    return {
      async processDocuments(
        documents: T[],
        processor: (doc: T) => Promise<any>
      ): Promise<any[]> {
        console.log(`Processing ${documents.length} documents in batches of ${batchSize}`);
        
        return await aiClient.processBatch(
          documents,
          async (batch: T[]) => {
            const results = [];
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
            return results;
          },
          {
            batchSize,
            maxConcurrent: 2, // Limit concurrent requests
            onProgress
          }
        );
      }
    };
  }

  /**
   * Check LocalAI connection status
   */
  static async checkConnection(): Promise<{
    connected: boolean;
    availableModels: string[];
    selectedModel: string;
    error?: string;
  }> {
    try {
      const connected = await AIModelMigration.aiClient.isAvailable();
      if (!connected) {
        return {
          connected: false,
          availableModels: [],
          selectedModel: 'gpt-4',
          error: 'LocalAI is not running or not accessible'
        };
      }

      const models = await this.getAvailableModels();
      const bestModel = await this.getBestModel();

      return {
        connected: true,
        availableModels: models,
        selectedModel: bestModel
      };
    } catch (error) {
      return {
        connected: false,
        availableModels: [],
        selectedModel: 'gpt-4',
        error: error instanceof Error ? error.message : 'Connection check failed'
      };
    }
  }

  /**
   * Clear model cache (useful after LocalAI restart)
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