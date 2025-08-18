/**
 * Advanced Caching and Memory Management System
 * Comprehensive caching solution with intelligent memory management
 */

interface CacheItem<T> {
  key: string;
  value: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
  size: number; // in bytes
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface CacheConfig {
  maxSize: number; // in MB
  defaultTTL: number; // in seconds
  maxItems: number;
  evictionPolicy: 'lru' | 'lfu' | 'ttl' | 'priority';
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  persistToDisk: boolean;
  memoryThreshold: number; // percentage
}

interface CacheStats {
  totalSize: number;
  itemCount: number;
  hitRate: number;
  missRate: number;
  evictions: number;
  memoryUsage: number;
  lastOptimization: Date;
}

interface MemoryMetrics {
  used: number;
  available: number;
  total: number;
  percentage: number;
  threshold: number;
  status: 'healthy' | 'warning' | 'critical';
}

class AdvancedCacheManager<T = any> {
  private cache = new Map<string, CacheItem<T>>();
  private config: CacheConfig;
  private stats: CacheStats;
  private memoryMonitor: MemoryMonitor;
  private compressionWorker?: Worker;
  private persistenceManager?: PersistenceManager;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 100, // 100MB
      defaultTTL: 3600, // 1 hour
      maxItems: 10000,
      evictionPolicy: 'lru',
      compressionEnabled: true,
      encryptionEnabled: false,
      persistToDisk: false,
      memoryThreshold: 80,
      ...config
    };

    this.stats = {
      totalSize: 0,
      itemCount: 0,
      hitRate: 0,
      missRate: 0,
      evictions: 0,
      memoryUsage: 0,
      lastOptimization: new Date()
    };

    this.memoryMonitor = new MemoryMonitor(this.config.memoryThreshold);
    this.initializeWorkers();
    this.startPeriodicOptimization();
  }

  private initializeWorkers(): void {
    if (this.config.compressionEnabled && typeof Worker !== 'undefined') {
      // Initialize compression worker for large data items
      this.compressionWorker = new Worker('/workers/compression.js');
    }

    if (this.config.persistToDisk) {
      this.persistenceManager = new PersistenceManager();
    }
  }

  private startPeriodicOptimization(): void {
    setInterval(() => {
      this.optimizeCache();
    }, 30000); // Optimize every 30 seconds
  }

  /**
   * Store an item in the cache with intelligent sizing and optimization
   */
  async set(
    key: string, 
    value: T, 
    options: {
      ttl?: number;
      tags?: string[];
      priority?: 'low' | 'medium' | 'high' | 'critical';
      compress?: boolean;
    } = {}
  ): Promise<boolean> {
    try {
      const now = Date.now();
      const ttl = options.ttl || this.config.defaultTTL;
      const expiresAt = now + (ttl * 1000);
      
      // Calculate item size
      const serializedValue = JSON.stringify(value);
      let itemSize = new Blob([serializedValue]).size;
      
      // Apply compression if enabled and beneficial
      let finalValue = value;
      if (this.config.compressionEnabled && (options.compress !== false) && itemSize > 1024) {
        try {
          finalValue = await this.compressValue(value);
          itemSize = new Blob([JSON.stringify(finalValue)]).size;
        } catch (error) {
          console.warn('Compression failed, storing uncompressed:', error);
        }
      }

      // Check memory constraints before storing
      if (!this.canStoreItem(itemSize)) {
        await this.makeSpace(itemSize);
      }

      const cacheItem: CacheItem<T> = {
        key,
        value: finalValue,
        timestamp: now,
        expiresAt,
        accessCount: 0,
        lastAccessed: now,
        size: itemSize,
        tags: options.tags || [],
        priority: options.priority || 'medium'
      };

      this.cache.set(key, cacheItem);
      this.updateStats('set', itemSize);
      
      // Persist to disk if enabled
      if (this.config.persistToDisk && this.persistenceManager) {
        await this.persistenceManager.save(key, cacheItem);
      }

      return true;
    } catch (error) {
      console.error('Cache set operation failed:', error);
      return false;
    }
  }

  /**
   * Retrieve an item from the cache with intelligent prefetching
   */
  async get(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    
    if (!item) {
      this.updateStats('miss');
      
      // Try to load from persistent storage
      if (this.config.persistToDisk && this.persistenceManager) {
        const persistedItem = await this.persistenceManager.load(key);
        if (persistedItem && !this.isExpired(persistedItem)) {
          const typedItem = persistedItem as CacheItem<T>;
          this.cache.set(key, typedItem);
          return this.processRetrievedValue(typedItem);
        }
      }
      
      return null;
    }

    // Check if item has expired
    if (this.isExpired(item)) {
      this.cache.delete(key);
      this.updateStats('miss');
      return null;
    }

    // Update access patterns
    item.accessCount++;
    item.lastAccessed = Date.now();
    this.updateStats('hit');

    return this.processRetrievedValue(item);
  }

  private async processRetrievedValue(item: CacheItem<T>): Promise<T> {
    // Decompress if needed
    if (this.isCompressed(item.value)) {
      try {
        return await this.decompressValue(item.value);
      } catch (error) {
        console.error('Decompression failed:', error);
        return item.value;
      }
    }
    
    return item.value;
  }

  /**
   * Intelligent cache optimization based on usage patterns and memory pressure
   */
  private async optimizeCache(): Promise<void> {
    const memoryMetrics = this.memoryMonitor.getMetrics();
    
    // If memory usage is high, be more aggressive with eviction
    if (memoryMetrics.status === 'critical') {
      await this.evictItems(0.3); // Evict 30% of items
    } else if (memoryMetrics.status === 'warning') {
      await this.evictItems(0.15); // Evict 15% of items
    }

    // Remove expired items
    this.removeExpiredItems();
    
    // Optimize frequently accessed items
    await this.optimizeHotData();
    
    this.stats.lastOptimization = new Date();
  }

  private async evictItems(percentage: number): Promise<void> {
    const itemsToEvict = Math.floor(this.cache.size * percentage);
    const sortedItems = this.getSortedItemsForEviction();
    
    for (let i = 0; i < Math.min(itemsToEvict, sortedItems.length); i++) {
      const item = sortedItems[i];
      this.cache.delete(item.key);
      this.stats.evictions++;
      this.stats.totalSize -= item.size;
    }
  }

  private getSortedItemsForEviction(): CacheItem<T>[] {
    const items = Array.from(this.cache.values());
    
    switch (this.config.evictionPolicy) {
      case 'lru':
        return items.sort((a, b) => a.lastAccessed - b.lastAccessed);
      
      case 'lfu':
        return items.sort((a, b) => a.accessCount - b.accessCount);
      
      case 'ttl':
        return items.sort((a, b) => a.expiresAt - b.expiresAt);
      
      case 'priority':
        const priorityOrder = { 'low': 0, 'medium': 1, 'high': 2, 'critical': 3 };
        return items.sort((a, b) => {
          const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return a.lastAccessed - b.lastAccessed; // LRU as tiebreaker
        });
      
      default:
        return items.sort((a, b) => a.lastAccessed - b.lastAccessed);
    }
  }

  private removeExpiredItems(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, item] of Array.from(this.cache.entries())) {
      if (this.isExpired(item)) {
        expiredKeys.push(key);
      }
    }
    
    for (const key of expiredKeys) {
      const item = this.cache.get(key);
      if (item) {
        this.cache.delete(key);
        this.stats.totalSize -= item.size;
      }
    }
  }

  private async optimizeHotData(): Promise<void> {
    // Identify frequently accessed items and optimize their storage
    const hotItems = Array.from(this.cache.values())
      .filter(item => item.accessCount > 10)
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 100); // Top 100 hot items

    for (const item of hotItems) {
      // Pre-decompress hot items for faster access
      if (this.isCompressed(item.value)) {
        try {
          const decompressed = await this.decompressValue(item.value);
          item.value = decompressed;
        } catch (error) {
          console.warn('Failed to optimize hot item:', error);
        }
      }
    }
  }

  private canStoreItem(size: number): boolean {
    const currentSizeMB = this.stats.totalSize / (1024 * 1024);
    const itemSizeMB = size / (1024 * 1024);
    
    return (currentSizeMB + itemSizeMB) <= this.config.maxSize && 
           this.cache.size < this.config.maxItems;
  }

  private async makeSpace(requiredSize: number): Promise<void> {
    const requiredSizeMB = requiredSize / (1024 * 1024);
    let freedSpace = 0;
    
    // First, remove expired items
    this.removeExpiredItems();
    
    // If still need space, evict based on policy
    if (freedSpace < requiredSizeMB) {
      const sortedItems = this.getSortedItemsForEviction();
      
      for (const item of sortedItems) {
        if (freedSpace >= requiredSizeMB) break;
        
        this.cache.delete(item.key);
        freedSpace += item.size / (1024 * 1024);
        this.stats.evictions++;
        this.stats.totalSize -= item.size;
      }
    }
  }

  private isExpired(item: CacheItem<T>): boolean {
    return Date.now() > item.expiresAt;
  }

  private isCompressed(value: any): boolean {
    return value && typeof value === 'object' && value.__compressed === true;
  }

  private async compressValue(value: T): Promise<any> {
    if (this.compressionWorker) {
      return new Promise((resolve, reject) => {
        const messageId = Math.random().toString(36);
        
        const handleMessage = (event: MessageEvent) => {
          if (event.data.id === messageId) {
            this.compressionWorker!.removeEventListener('message', handleMessage);
            if (event.data.error) {
              reject(new Error(event.data.error));
            } else {
              resolve(event.data.result);
            }
          }
        };
        
        this.compressionWorker?.addEventListener('message', handleMessage);
        this.compressionWorker?.postMessage({
          id: messageId,
          action: 'compress',
          data: value
        });
        
        // Timeout after 5 seconds
        setTimeout(() => {
          this.compressionWorker?.removeEventListener('message', handleMessage);
          reject(new Error('Compression timeout'));
        }, 5000);
      });
    }
    
    // Fallback to basic compression
    return {
      __compressed: true,
      data: JSON.stringify(value)
    };
  }

  private async decompressValue(compressedValue: any): Promise<T> {
    if (this.compressionWorker && compressedValue.__compressed) {
      return new Promise((resolve, reject) => {
        const messageId = Math.random().toString(36);
        
        const handleMessage = (event: MessageEvent) => {
          if (event.data.id === messageId) {
            this.compressionWorker!.removeEventListener('message', handleMessage);
            if (event.data.error) {
              reject(new Error(event.data.error));
            } else {
              resolve(event.data.result);
            }
          }
        };
        
        this.compressionWorker?.addEventListener('message', handleMessage);
        this.compressionWorker?.postMessage({
          id: messageId,
          action: 'decompress',
          data: compressedValue
        });
        
        // Timeout after 5 seconds
        setTimeout(() => {
          this.compressionWorker?.removeEventListener('message', handleMessage);
          reject(new Error('Decompression timeout'));
        }, 5000);
      });
    }
    
    // Fallback decompression
    if (compressedValue.__compressed && compressedValue.data) {
      return JSON.parse(compressedValue.data);
    }
    
    return compressedValue;
  }

  private updateStats(operation: 'hit' | 'miss' | 'set', size?: number): void {
    if (operation === 'hit') {
      this.stats.hitRate = (this.stats.hitRate * 0.9) + 0.1;
      this.stats.missRate = 1 - this.stats.hitRate;
    } else if (operation === 'miss') {
      this.stats.missRate = (this.stats.missRate * 0.9) + 0.1;
      this.stats.hitRate = 1 - this.stats.missRate;
    } else if (operation === 'set' && size) {
      this.stats.totalSize += size;
      this.stats.itemCount = this.cache.size;
    }
  }

  /**
   * Public API methods
   */
  async invalidateTag(tag: string): Promise<void> {
    const keysToDelete: string[] = [];
    
    for (const [key, item] of Array.from(this.cache.entries())) {
      if (item.tags.includes(tag)) {
        keysToDelete.push(key);
      }
    }
    
    for (const key of keysToDelete) {
      await this.delete(key);
    }
  }

  async delete(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (item) {
      this.cache.delete(key);
      this.stats.totalSize -= item.size;
      this.stats.itemCount = this.cache.size;
      
      if (this.config.persistToDisk && this.persistenceManager) {
        await this.persistenceManager.delete(key);
      }
      
      return true;
    }
    return false;
  }

  clear(): void {
    this.cache.clear();
    this.stats.totalSize = 0;
    this.stats.itemCount = 0;
    this.stats.evictions = 0;
    
    if (this.config.persistToDisk && this.persistenceManager) {
      this.persistenceManager.clear();
    }
  }

  getStats(): CacheStats {
    this.stats.memoryUsage = this.memoryMonitor.getMetrics().percentage;
    return { ...this.stats };
  }

  getMemoryMetrics(): MemoryMetrics {
    return this.memoryMonitor.getMetrics();
  }

  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.memoryMonitor.updateThreshold(this.config.memoryThreshold);
  }
}

/**
 * Memory Monitor for tracking system memory usage
 */
class MemoryMonitor {
  private threshold: number;
  private lastCheck: number = 0;
  private cachedMetrics?: MemoryMetrics;

  constructor(threshold: number) {
    this.threshold = threshold;
  }

  getMetrics(): MemoryMetrics {
    const now = Date.now();
    
    // Cache metrics for 1 second to avoid excessive calculations
    if (this.cachedMetrics && (now - this.lastCheck) < 1000) {
      return this.cachedMetrics;
    }

    const metrics = this.calculateMemoryMetrics();
    this.cachedMetrics = metrics;
    this.lastCheck = now;
    
    return metrics;
  }

  private calculateMemoryMetrics(): MemoryMetrics {
    // Get memory information from performance API or estimate
    let used = 0;
    let total = 0;
    
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      used = memory.usedJSHeapSize || 0;
      total = memory.totalJSHeapSize || memory.jsHeapSizeLimit || 1024 * 1024 * 1024;
    } else {
      // Fallback estimation
      total = 1024 * 1024 * 1024; // Assume 1GB available
      used = total * 0.5; // Estimate 50% usage
    }
    
    const available = total - used;
    const percentage = (used / total) * 100;
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (percentage > this.threshold) {
      status = 'critical';
    } else if (percentage > this.threshold * 0.8) {
      status = 'warning';
    }

    return {
      used,
      available,
      total,
      percentage,
      threshold: this.threshold,
      status
    };
  }

  updateThreshold(newThreshold: number): void {
    this.threshold = newThreshold;
    this.cachedMetrics = undefined; // Invalidate cache
  }
}

/**
 * Persistence Manager for disk-based caching
 */
class PersistenceManager {
  private dbName = 'legal_intelligence_cache';
  private version = 1;
  private db?: IDBDatabase;

  constructor() {
    this.initializeDB();
  }

  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('cache')) {
          const store = db.createObjectStore('cache', { keyPath: 'key' });
          store.createIndex('expiresAt', 'expiresAt');
          store.createIndex('tags', 'tags', { multiEntry: true });
        }
      };
    });
  }

  async save<T>(key: string, item: CacheItem<T>): Promise<void> {
    if (!this.db) await this.initializeDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      
      const request = store.put(item);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async load<T = any>(key: string): Promise<CacheItem<T> | null> {
    if (!this.db) await this.initializeDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async delete(key: string): Promise<void> {
    if (!this.db) await this.initializeDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      
      const request = store.delete(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    if (!this.db) await this.initializeDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// Global cache instances for different use cases
export const documentCache = new AdvancedCacheManager({
  maxSize: 200, // 200MB for documents
  defaultTTL: 7200, // 2 hours
  evictionPolicy: 'lru',
  compressionEnabled: true,
  persistToDisk: true
});

export const apiCache = new AdvancedCacheManager({
  maxSize: 50, // 50MB for API responses
  defaultTTL: 300, // 5 minutes
  evictionPolicy: 'ttl',
  compressionEnabled: false,
  persistToDisk: false
});

export const mlModelCache = new AdvancedCacheManager({
  maxSize: 500, // 500MB for ML models
  defaultTTL: 86400, // 24 hours
  evictionPolicy: 'priority',
  compressionEnabled: true,
  persistToDisk: true
});

export const componentStateCache = new AdvancedCacheManager({
  maxSize: 25, // 25MB for component state
  defaultTTL: 1800, // 30 minutes
  evictionPolicy: 'lru',
  compressionEnabled: false,
  persistToDisk: false
});

export { AdvancedCacheManager, MemoryMonitor, PersistenceManager };
export type { CacheConfig, CacheStats, MemoryMetrics, CacheItem };