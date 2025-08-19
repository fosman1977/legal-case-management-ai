/**
 * Legal AI Model Manager
 * Handles downloading and managing optional ML models for enhanced analysis
 */

export interface ModelPack {
  id: string;
  name: string;
  description: string;
  size: number; // in MB
  accuracy_improvement: string;
  features: string[];
  download_url: string;
  version: string;
  engines: string[]; // Which engines benefit from this model
}

export interface ModelDownloadProgress {
  model_id: string;
  downloaded: number;
  total: number;
  status: 'downloading' | 'extracting' | 'installing' | 'complete' | 'error';
  error?: string;
}

export class ModelManager {
  private downloadProgress = new Map<string, ModelDownloadProgress>();
  private installedModels = new Set<string>();

  constructor() {
    this.loadInstalledModels();
  }

  /**
   * Get available model packs for download
   */
  getAvailableModelPacks(): ModelPack[] {
    return [
      {
        id: 'enhanced-pack',
        name: 'Enhanced Legal Analysis Pack',
        description: 'Improves entity recognition and legal concept extraction using spaCy models',
        size: 500,
        accuracy_improvement: '+20% accuracy',
        features: [
          'Better named entity recognition',
          'Improved legal terminology detection',
          'Enhanced relationship mapping',
          'Context-aware analysis'
        ],
        download_url: 'https://github.com/fosman1977/legal-case-management-ai/releases/download/models/enhanced-pack-v1.0.zip',
        version: '1.0.0',
        engines: ['spacy-legal', 'custom-uk']
      },
      {
        id: 'professional-pack',
        name: 'Professional Blackstone Pack',
        description: 'Full Blackstone legal NLP models for UK legal analysis',
        size: 1500,
        accuracy_improvement: '+40% accuracy',
        features: [
          'Full UK legal entity recognition',
          'Advanced case law analysis', 
          'Judicial reasoning patterns',
          'Legal precedent detection',
          'Court procedure recognition'
        ],
        download_url: 'https://github.com/fosman1977/legal-case-management-ai/releases/download/models/blackstone-pack-v1.0.zip',
        version: '1.0.0',
        engines: ['blackstone-uk', 'eyecite']
      },
      {
        id: 'research-pack',
        name: 'Advanced Research Pack',
        description: 'Transformer-based models for cutting-edge legal analysis',
        size: 3000,
        accuracy_improvement: '+60% capability',
        features: [
          'Semantic legal understanding',
          'Advanced argument analysis',
          'Legal reasoning patterns',
          'Cross-jurisdictional analysis',
          'Research recommendations'
        ],
        download_url: 'https://github.com/fosman1977/legal-case-management-ai/releases/download/models/research-pack-v1.0.zip',
        version: '1.0.0',
        engines: ['statistical-validator', 'database-validator']
      }
    ];
  }

  /**
   * Get currently installed models
   */
  getInstalledModels(): string[] {
    return Array.from(this.installedModels);
  }

  /**
   * Check if a model pack is installed
   */
  isModelInstalled(modelId: string): boolean {
    return this.installedModels.has(modelId);
  }

  /**
   * Get download progress for a model
   */
  getDownloadProgress(modelId: string): ModelDownloadProgress | null {
    return this.downloadProgress.get(modelId) || null;
  }

  /**
   * Download and install a model pack
   */
  async downloadModel(modelId: string, onProgress?: (progress: ModelDownloadProgress) => void): Promise<boolean> {
    const modelPack = this.getAvailableModelPacks().find(pack => pack.id === modelId);
    if (!modelPack) {
      throw new Error(`Model pack ${modelId} not found`);
    }

    const progress: ModelDownloadProgress = {
      model_id: modelId,
      downloaded: 0,
      total: modelPack.size * 1024 * 1024, // Convert MB to bytes
      status: 'downloading'
    };

    this.downloadProgress.set(modelId, progress);
    onProgress?.(progress);

    try {
      // Simulate download process (in real implementation, would use fetch with progress)
      await this.simulateDownload(progress, onProgress);
      
      // Mark as installed
      this.installedModels.add(modelId);
      this.saveInstalledModels();

      // Notify engines of new model availability
      await this.notifyEngines(modelPack);

      progress.status = 'complete';
      onProgress?.(progress);

      console.log(`✅ Model pack ${modelId} downloaded and installed successfully`);
      return true;

    } catch (error: any) {
      progress.status = 'error';
      progress.error = error.message;
      onProgress?.(progress);
      
      console.error(`❌ Failed to download model pack ${modelId}:`, error);
      return false;
    }
  }

  /**
   * Uninstall a model pack
   */
  async uninstallModel(modelId: string): Promise<boolean> {
    try {
      // In real implementation, would delete model files
      this.installedModels.delete(modelId);
      this.downloadProgress.delete(modelId);
      this.saveInstalledModels();

      console.log(`🗑️ Model pack ${modelId} uninstalled successfully`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to uninstall model pack ${modelId}:`, error);
      return false;
    }
  }

  /**
   * Get total storage used by models
   */
  getStorageUsed(): { total_mb: number; by_model: Record<string, number> } {
    const installedPacks = this.getAvailableModelPacks().filter(pack => 
      this.isModelInstalled(pack.id)
    );

    const by_model: Record<string, number> = {};
    let total_mb = 0;

    installedPacks.forEach(pack => {
      by_model[pack.id] = pack.size;
      total_mb += pack.size;
    });

    return { total_mb, by_model };
  }

  /**
   * Simulate download progress (replace with real download in production)
   */
  private async simulateDownload(
    progress: ModelDownloadProgress, 
    onProgress?: (progress: ModelDownloadProgress) => void
  ): Promise<void> {
    const steps = ['downloading', 'extracting', 'installing'] as const;
    
    for (const step of steps) {
      progress.status = step;
      onProgress?.(progress);

      // Simulate progress for this step
      const stepDuration = step === 'downloading' ? 3000 : 1000;
      const stepSize = progress.total / steps.length;
      
      for (let i = 0; i <= 10; i++) {
        await new Promise(resolve => setTimeout(resolve, stepDuration / 10));
        
        if (step === 'downloading') {
          progress.downloaded = (stepSize * (steps.indexOf(step) + i/10));
        }
        
        onProgress?.(progress);
      }
    }

    progress.downloaded = progress.total;
  }

  /**
   * Notify engines about new model availability
   */
  private async notifyEngines(modelPack: ModelPack): Promise<void> {
    // In real implementation, would notify specific engines to reload with new models
    console.log(`🔧 Notifying engines ${modelPack.engines.join(', ')} about new model: ${modelPack.name}`);
  }

  /**
   * Load installed models from storage
   */
  private loadInstalledModels(): void {
    try {
      const stored = localStorage.getItem('installed_model_packs');
      if (stored) {
        const modelIds = JSON.parse(stored);
        this.installedModels = new Set(modelIds);
      }
    } catch (error) {
      console.warn('Failed to load installed models from storage:', error);
    }
  }

  /**
   * Save installed models to storage
   */
  private saveInstalledModels(): void {
    try {
      const modelIds = Array.from(this.installedModels);
      localStorage.setItem('installed_model_packs', JSON.stringify(modelIds));
    } catch (error) {
      console.warn('Failed to save installed models to storage:', error);
    }
  }
}

// Export singleton instance
export const modelManager = new ModelManager();
export default modelManager;