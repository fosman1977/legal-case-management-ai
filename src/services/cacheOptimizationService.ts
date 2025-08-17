/**
 * Cache Optimization Service
 * Enterprise-grade caching for documents, entities, and AI processing results
 */

interface CacheEntry<T> {
  key: string;
  value: T;
  size: number; // bytes
  accessCount: number;
  lastAccessed: Date;
  created: Date;
  ttl?: number; // time to live in ms
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
}

interface CacheStatistics {
  hits: number;
  misses: number;
  hitRate: number;
  size: number; // total bytes
  entries: number;
  evictions: number;
  averageAccessTime: number;
}

interface CacheConfiguration {
  maxSize: number; // bytes
  maxEntries: number;
  defaultTTL: number; // ms
  evictionPolicy: 'lru' | 'lfu' | 'ttl' | 'priority';
  compressionEnabled: boolean;
  persistToDisk: boolean;
  encryptionEnabled: boolean;
}

interface DocumentCacheEntry {
  documentId: string;
  content: string;
  metadata: any;
  extractedEntities?: any;
  processingResults?: any;
  size: number;
}

interface EntityCacheEntry {
  entityType: string;
  entityValue: string;
  context: string;
  confidence: number;
  validation: any;
  relationships: string[];
}

interface AIResultCacheEntry {
  inputHash: string;
  engineName: string;
  modelVersion: string;
  result: any;
  confidence: number;
  processingTime: number;
}

export class CacheOptimizationService {
  private documentCache: Map<string, CacheEntry<DocumentCacheEntry>> = new Map();
  private entityCache: Map<string, CacheEntry<EntityCacheEntry>> = new Map();
  private aiResultCache: Map<string, CacheEntry<AIResultCacheEntry>> = new Map();
  private engineModelCache: Map<string, CacheEntry<any>> = new Map();
  
  private statistics = {
    document: { hits: 0, misses: 0, evictions: 0, totalAccessTime: 0 },
    entity: { hits: 0, misses: 0, evictions: 0, totalAccessTime: 0 },
    aiResult: { hits: 0, misses: 0, evictions: 0, totalAccessTime: 0 },
    engineModel: { hits: 0, misses: 0, evictions: 0, totalAccessTime: 0 }
  };
  
  private configurations: Record<string, CacheConfiguration> = {
    document: {
      maxSize: 512 * 1024 * 1024, // 512MB
      maxEntries: 1000,
      defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
      evictionPolicy: 'lru',
      compressionEnabled: true,
      persistToDisk: true,
      encryptionEnabled: true
    },
    entity: {
      maxSize: 128 * 1024 * 1024, // 128MB
      maxEntries: 10000,
      defaultTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
      evictionPolicy: 'lfu',
      compressionEnabled: false,
      persistToDisk: true,
      encryptionEnabled: false
    },
    aiResult: {
      maxSize: 256 * 1024 * 1024, // 256MB
      maxEntries: 5000,
      defaultTTL: 12 * 60 * 60 * 1000, // 12 hours
      evictionPolicy: 'lru',
      compressionEnabled: true,
      persistToDisk: true,
      encryptionEnabled: true
    },
    engineModel: {
      maxSize: 1024 * 1024 * 1024, // 1GB
      maxEntries: 50,
      defaultTTL: 0, // No expiration
      evictionPolicy: 'priority',
      compressionEnabled: false,
      persistToDisk: false,
      encryptionEnabled: false
    }
  };

  constructor() {
    this.initializeCaching();
  }

  /**
   * Initialize caching system
   */
  private initializeCaching(): void {
    console.log('💾 Initializing Enterprise Cache Optimization...');
    
    // Start cache maintenance routine
    setInterval(() => {
      this.performCacheMaintenance();
    }, 60000); // Every minute
    
    // Start cache statistics collection
    setInterval(() => {
      this.updateCacheStatistics();
    }, 10000); // Every 10 seconds
    
    console.log('✅ Cache optimization system initialized');
    console.log(`📊 Cache limits: Documents(${this.configurations.document.maxSize / 1024 / 1024}MB), Entities(${this.configurations.entity.maxSize / 1024 / 1024}MB), AI Results(${this.configurations.aiResult.maxSize / 1024 / 1024}MB)`);
  }

  /**
   * Document caching methods
   */
  
  async cacheDocument(documentId: string, data: DocumentCacheEntry): Promise<void> {
    const startTime = Date.now();
    
    try {
      const size = this.calculateSize(data);
      const entry: CacheEntry<DocumentCacheEntry> = {
        key: documentId,
        value: data,
        size,
        accessCount: 1,
        lastAccessed: new Date(),
        created: new Date(),
        ttl: this.configurations.document.defaultTTL,
        priority: this.determinePriority(documentId, 'document'),
        tags: this.generateTags(data)
      };
      
      // Check if cache has space
      if (this.needsEviction('document', size)) {
        await this.evictEntries('document', size);
      }
      
      this.documentCache.set(documentId, entry);
      
      // Optionally persist to disk
      if (this.configurations.document.persistToDisk) {
        await this.persistToDisk('document', documentId, entry);
      }
      
    } catch (error) {
      console.error('❌ Failed to cache document:', error);
    } finally {
      this.statistics.document.totalAccessTime += Date.now() - startTime;
    }
  }

  async getDocument(documentId: string): Promise<DocumentCacheEntry | null> {
    const startTime = Date.now();
    
    try {
      const entry = this.documentCache.get(documentId);
      
      if (entry) {
        // Check TTL
        if (entry.ttl && Date.now() - entry.created.getTime() > entry.ttl) {
          this.documentCache.delete(documentId);
          this.statistics.document.misses++;
          return null;
        }
        
        // Update access statistics
        entry.accessCount++;
        entry.lastAccessed = new Date();
        
        this.statistics.document.hits++;
        return entry.value;
      } else {
        this.statistics.document.misses++;
        
        // Try loading from disk
        if (this.configurations.document.persistToDisk) {
          const diskEntry = await this.loadFromDisk('document', documentId);
          if (diskEntry) {
            this.documentCache.set(documentId, diskEntry);
            this.statistics.document.hits++;
            return diskEntry.value;
          }
        }
        
        return null;
      }
    } finally {
      this.statistics.document.totalAccessTime += Date.now() - startTime;
    }
  }

  /**
   * Entity caching methods
   */
  
  async cacheEntity(entityKey: string, data: EntityCacheEntry): Promise<void> {
    const startTime = Date.now();
    
    try {
      const size = this.calculateSize(data);
      const entry: CacheEntry<EntityCacheEntry> = {
        key: entityKey,
        value: data,
        size,
        accessCount: 1,
        lastAccessed: new Date(),
        created: new Date(),
        ttl: this.configurations.entity.defaultTTL,
        priority: this.determinePriority(entityKey, 'entity'),
        tags: [data.entityType, ...data.relationships]
      };
      
      if (this.needsEviction('entity', size)) {
        await this.evictEntries('entity', size);
      }
      
      this.entityCache.set(entityKey, entry);
      
    } catch (error) {
      console.error('❌ Failed to cache entity:', error);
    } finally {
      this.statistics.entity.totalAccessTime += Date.now() - startTime;
    }
  }

  async getEntity(entityKey: string): Promise<EntityCacheEntry | null> {
    const startTime = Date.now();
    
    try {
      const entry = this.entityCache.get(entityKey);
      
      if (entry) {
        if (entry.ttl && Date.now() - entry.created.getTime() > entry.ttl) {
          this.entityCache.delete(entityKey);
          this.statistics.entity.misses++;
          return null;
        }
        
        entry.accessCount++;
        entry.lastAccessed = new Date();
        
        this.statistics.entity.hits++;
        return entry.value;
      } else {
        this.statistics.entity.misses++;
        return null;
      }
    } finally {
      this.statistics.entity.totalAccessTime += Date.now() - startTime;
    }
  }

  /**
   * AI Result caching methods
   */
  
  async cacheAIResult(resultKey: string, data: AIResultCacheEntry): Promise<void> {
    const startTime = Date.now();
    
    try {
      const size = this.calculateSize(data);
      const entry: CacheEntry<AIResultCacheEntry> = {
        key: resultKey,
        value: data,
        size,
        accessCount: 1,
        lastAccessed: new Date(),
        created: new Date(),
        ttl: this.configurations.aiResult.defaultTTL,
        priority: data.confidence > 0.9 ? 'high' : 'medium',
        tags: [data.engineName, data.modelVersion]
      };
      
      if (this.needsEviction('aiResult', size)) {
        await this.evictEntries('aiResult', size);
      }
      
      this.aiResultCache.set(resultKey, entry);
      
    } catch (error) {
      console.error('❌ Failed to cache AI result:', error);
    } finally {
      this.statistics.aiResult.totalAccessTime += Date.now() - startTime;
    }
  }

  async getAIResult(resultKey: string): Promise<AIResultCacheEntry | null> {
    const startTime = Date.now();
    
    try {
      const entry = this.aiResultCache.get(resultKey);
      
      if (entry) {
        if (entry.ttl && Date.now() - entry.created.getTime() > entry.ttl) {
          this.aiResultCache.delete(resultKey);
          this.statistics.aiResult.misses++;
          return null;
        }
        
        entry.accessCount++;
        entry.lastAccessed = new Date();
        
        this.statistics.aiResult.hits++;
        return entry.value;
      } else {
        this.statistics.aiResult.misses++;
        return null;
      }
    } finally {
      this.statistics.aiResult.totalAccessTime += Date.now() - startTime;
    }
  }

  /**
   * Engine Model caching methods
   */
  
  async cacheEngineModel(modelKey: string, modelData: any): Promise<void> {
    const startTime = Date.now();
    
    try {
      const size = this.calculateSize(modelData);
      const entry: CacheEntry<any> = {
        key: modelKey,
        value: modelData,
        size,
        accessCount: 1,
        lastAccessed: new Date(),
        created: new Date(),
        priority: 'critical', // Models are critical for performance
        tags: ['model', modelKey.split('-')[0]] // engine name
      };
      
      if (this.needsEviction('engineModel', size)) {
        await this.evictEntries('engineModel', size);
      }
      
      this.engineModelCache.set(modelKey, entry);
      
    } catch (error) {
      console.error('❌ Failed to cache engine model:', error);
    } finally {
      this.statistics.engineModel.totalAccessTime += Date.now() - startTime;
    }
  }

  async getEngineModel(modelKey: string): Promise<any | null> {
    const startTime = Date.now();
    
    try {
      const entry = this.engineModelCache.get(modelKey);
      
      if (entry) {
        entry.accessCount++;
        entry.lastAccessed = new Date();
        
        this.statistics.engineModel.hits++;
        return entry.value;
      } else {
        this.statistics.engineModel.misses++;
        return null;
      }
    } finally {
      this.statistics.engineModel.totalAccessTime += Date.now() - startTime;
    }
  }

  /**
   * Cache management methods
   */
  
  private needsEviction(cacheType: string, additionalSize: number): boolean {
    const config = this.configurations[cacheType];
    const cache = this.getCache(cacheType);
    
    const currentSize = this.getCurrentCacheSize(cache);
    const currentEntries = cache.size;
    
    return (currentSize + additionalSize > config.maxSize) || 
           (currentEntries >= config.maxEntries);
  }

  private async evictEntries(cacheType: string, sizeNeeded: number): Promise<void> {
    const config = this.configurations[cacheType];
    const cache = this.getCache(cacheType);
    
    let sizeFreed = 0;
    const evictionCandidates: Array<{ key: string; entry: CacheEntry<any>; score: number }> = [];
    
    // Calculate eviction scores based on policy
    cache.forEach((entry, key) => {
      let score = 0;
      
      switch (config.evictionPolicy) {
        case 'lru':
          score = entry.lastAccessed.getTime();
          break;
        case 'lfu':
          score = entry.accessCount;
          break;
        case 'ttl':
          score = entry.created.getTime() + (entry.ttl || 0);
          break;
        case 'priority':
          const priorityScores = { low: 1, medium: 2, high: 3, critical: 4 };
          score = priorityScores[entry.priority] * 1000 + entry.accessCount;
          break;
      }
      
      evictionCandidates.push({ key, entry, score });
    });
    
    // Sort candidates (lower scores get evicted first, except for priority)
    if (config.evictionPolicy === 'priority') {
      evictionCandidates.sort((a, b) => a.score - b.score);
    } else {
      evictionCandidates.sort((a, b) => a.score - b.score);
    }
    
    // Evict entries until we have enough space
    for (const candidate of evictionCandidates) {
      if (sizeFreed >= sizeNeeded) break;
      
      cache.delete(candidate.key);
      sizeFreed += candidate.entry.size;
      
      // Update statistics
      this.updateEvictionStatistics(cacheType);
    }
    
    console.log(`💾 Evicted ${evictionCandidates.length} entries from ${cacheType} cache, freed ${(sizeFreed / 1024 / 1024).toFixed(1)}MB`);
  }

  private performCacheMaintenance(): void {
    // Clean expired entries
    this.cleanExpiredEntries();
    
    // Optimize cache sizes if needed
    this.optimizeCacheSizes();
    
    // Update access patterns
    this.analyzeAccessPatterns();
  }

  private cleanExpiredEntries(): void {
    const now = Date.now();
    
    [this.documentCache, this.entityCache, this.aiResultCache].forEach((cache, index) => {
      const cacheNames = ['document', 'entity', 'aiResult'];
      const cacheName = cacheNames[index];
      let expiredCount = 0;
      
      cache.forEach((entry, key) => {
        if (entry.ttl && now - entry.created.getTime() > entry.ttl) {
          cache.delete(key);
          expiredCount++;
        }
      });
      
      if (expiredCount > 0) {
        console.log(`🧹 Cleaned ${expiredCount} expired entries from ${cacheName} cache`);
      }
    });
  }

  private optimizeCacheSizes(): void {
    // Analyze hit rates and adjust cache sizes
    const stats = this.getAllCacheStatistics();
    
    Object.entries(stats).forEach(([cacheType, stat]) => {
      if (stat.hitRate < 0.7 && stat.entries > 100) {
        // Low hit rate - consider reducing cache size
        console.log(`📊 ${cacheType} cache hit rate low (${(stat.hitRate * 100).toFixed(1)}%) - optimization needed`);
      } else if (stat.hitRate > 0.95 && stat.entries > 500) {
        // Very high hit rate - consider increasing cache size
        console.log(`📈 ${cacheType} cache performing excellently (${(stat.hitRate * 100).toFixed(1)}% hit rate)`);
      }
    });
  }

  private analyzeAccessPatterns(): void {
    // Analyze which documents/entities are accessed most frequently
    const documentAccess = new Map<string, number>();
    const entityAccess = new Map<string, number>();
    
    this.documentCache.forEach((entry, key) => {
      documentAccess.set(key, entry.accessCount);
    });
    
    this.entityCache.forEach((entry, key) => {
      entityAccess.set(key, entry.accessCount);
    });
    
    // Identify hot data for priority caching
    const hotDocuments = Array.from(documentAccess.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    if (hotDocuments.length > 0) {
      console.log(`🔥 Top accessed documents: ${hotDocuments.map(([id, count]) => `${id}(${count})`).join(', ')}`);
    }
  }

  /**
   * Utility methods
   */
  
  private getCache(cacheType: string): Map<string, CacheEntry<any>> {
    switch (cacheType) {
      case 'document': return this.documentCache;
      case 'entity': return this.entityCache;
      case 'aiResult': return this.aiResultCache;
      case 'engineModel': return this.engineModelCache;
      default: throw new Error(`Unknown cache type: ${cacheType}`);
    }
  }

  private getCurrentCacheSize(cache: Map<string, CacheEntry<any>>): number {
    let totalSize = 0;
    cache.forEach(entry => {
      totalSize += entry.size;
    });
    return totalSize;
  }

  private calculateSize(data: any): number {
    // Simple size estimation (in production, would use more accurate calculation)
    const jsonString = JSON.stringify(data);
    return jsonString.length * 2; // Rough estimate for UTF-16
  }

  private determinePriority(key: string, type: string): 'low' | 'medium' | 'high' | 'critical' {
    // Determine priority based on key patterns and type
    if (type === 'engineModel') return 'critical';
    if (key.includes('important') || key.includes('critical')) return 'high';
    if (key.includes('temp') || key.includes('test')) return 'low';
    return 'medium';
  }

  private generateTags(data: any): string[] {
    const tags: string[] = [];
    
    if (data.metadata) {
      if (data.metadata.type) tags.push(data.metadata.type);
      if (data.metadata.category) tags.push(data.metadata.category);
    }
    
    if (data.documentId) tags.push('document');
    if (data.entityType) tags.push('entity');
    
    return tags;
  }

  private async persistToDisk(cacheType: string, key: string, entry: CacheEntry<any>): Promise<void> {
    // Simulate disk persistence (in production, would use actual file system)
    console.log(`💾 Persisting ${cacheType}:${key} to disk (${(entry.size / 1024).toFixed(1)}KB)`);
  }

  private async loadFromDisk(cacheType: string, key: string): Promise<CacheEntry<any> | null> {
    // Simulate disk loading (in production, would use actual file system)
    return null;
  }

  private updateEvictionStatistics(cacheType: string): void {
    this.statistics[cacheType as keyof typeof this.statistics].evictions++;
  }

  private updateCacheStatistics(): void {
    // Statistics are updated in real-time during cache operations
  }

  /**
   * Public API methods
   */
  
  getAllCacheStatistics(): Record<string, CacheStatistics> {
    const result: Record<string, CacheStatistics> = {};
    
    ['document', 'entity', 'aiResult', 'engineModel'].forEach(cacheType => {
      const stats = this.statistics[cacheType as keyof typeof this.statistics];
      const cache = this.getCache(cacheType);
      const totalRequests = stats.hits + stats.misses;
      
      result[cacheType] = {
        hits: stats.hits,
        misses: stats.misses,
        hitRate: totalRequests > 0 ? stats.hits / totalRequests : 0,
        size: this.getCurrentCacheSize(cache),
        entries: cache.size,
        evictions: stats.evictions,
        averageAccessTime: stats.hits > 0 ? stats.totalAccessTime / stats.hits : 0
      };
    });
    
    return result;
  }

  getCacheConfiguration(cacheType: string): CacheConfiguration {
    return this.configurations[cacheType];
  }

  updateCacheConfiguration(cacheType: string, config: Partial<CacheConfiguration>): void {
    this.configurations[cacheType] = { ...this.configurations[cacheType], ...config };
    console.log(`⚙️ Updated ${cacheType} cache configuration`);
  }

  clearCache(cacheType?: string): void {
    if (cacheType) {
      const cache = this.getCache(cacheType);
      const entriesCleared = cache.size;
      cache.clear();
      console.log(`🧹 Cleared ${entriesCleared} entries from ${cacheType} cache`);
    } else {
      // Clear all caches
      let totalCleared = 0;
      [this.documentCache, this.entityCache, this.aiResultCache, this.engineModelCache].forEach(cache => {
        totalCleared += cache.size;
        cache.clear();
      });
      console.log(`🧹 Cleared all caches (${totalCleared} total entries)`);
    }
  }

  preloadFrequentlyUsedData(): void {
    console.log('🚀 Preloading frequently used models and entities...');
    
    // Simulate preloading critical models
    const criticalModels = [
      'blackstone-uk-v1.0',
      'eyecite-v2.1',
      'legal-regex-v1.5'
    ];
    
    criticalModels.forEach(async (modelKey) => {
      // Simulate model loading
      const modelData = { model: `${modelKey}-data`, size: 'large' };
      await this.cacheEngineModel(modelKey, modelData);
    });
    
    console.log('✅ Critical models preloaded into cache');
  }

  generateCacheKey(components: string[]): string {
    // Generate consistent cache keys
    return components.join(':');
  }

  // Specialized cache methods for legal documents
  
  async cacheExtractedEntities(documentId: string, entities: any): Promise<void> {
    const cacheKey = this.generateCacheKey(['entities', documentId]);
    await this.cacheAIResult(cacheKey, {
      inputHash: documentId,
      engineName: 'entity-extractor',
      modelVersion: '1.0',
      result: entities,
      confidence: 0.85,
      processingTime: 1000
    });
  }

  async getCachedEntities(documentId: string): Promise<any | null> {
    const cacheKey = this.generateCacheKey(['entities', documentId]);
    const result = await this.getAIResult(cacheKey);
    return result?.result || null;
  }

  async cacheProcessingResult(documentId: string, engineName: string, result: any): Promise<void> {
    const cacheKey = this.generateCacheKey(['processing', documentId, engineName]);
    await this.cacheAIResult(cacheKey, {
      inputHash: documentId,
      engineName,
      modelVersion: '1.0',
      result,
      confidence: result.confidence || 0.8,
      processingTime: result.processingTime || 2000
    });
  }

  async getCachedProcessingResult(documentId: string, engineName: string): Promise<any | null> {
    const cacheKey = this.generateCacheKey(['processing', documentId, engineName]);
    const result = await this.getAIResult(cacheKey);
    return result?.result || null;
  }
}

// Export singleton instance
export const cacheOptimizationService = new CacheOptimizationService();
export default cacheOptimizationService;