/**
 * Parallel AI Research Results Cache
 * Implements intelligent caching with TTL, compression, and search capabilities
 */

import { ResearchResult, ResearchTask } from './parallelAIService';

export interface CacheEntry {
  id: string;
  taskId: string;
  queryHash: string;
  result: ResearchResult;
  cachedAt: Date;
  lastAccessed: Date;
  accessCount: number;
  ttl: number; // Time to live in milliseconds
  tags: string[];
  size: number; // Size in bytes for cache management
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  oldestEntry?: Date;
  newestEntry?: Date;
  mostAccessedEntry?: string;
}

export interface CacheSearchResult {
  entries: CacheEntry[];
  totalMatches: number;
  searchTime: number;
}

class ParallelAICacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private accessLog: Array<{ id: string; timestamp: Date; hit: boolean }> = [];
  private maxCacheSize = 100 * 1024 * 1024; // 100MB
  private defaultTTL = 7 * 24 * 60 * 60 * 1000; // 7 days
  private maxEntries = 1000;
  
  constructor() {
    this.loadCacheFromStorage();
    this.startCleanupTimer();
  }

  /**
   * Generate cache key from research parameters
   */
  private generateCacheKey(params: {
    title: string;
    description: string;
    researchType: string;
    tags?: string[];
  }): string {
    const content = `${params.title}_${params.description}_${params.researchType}_${(params.tags || []).sort().join(',')}`;
    return this.hashString(content);
  }

  /**
   * Simple hash function for cache keys
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Calculate cache entry size
   */
  private calculateSize(entry: Omit<CacheEntry, 'size'>): number {
    return JSON.stringify(entry).length * 2; // Rough estimation (UTF-16)
  }

  /**
   * Check if there's a cached result for a research query
   */
  async getCachedResult(params: {
    title: string;
    description: string;
    researchType: string;
    tags?: string[];
  }): Promise<ResearchResult | null> {
    const key = this.generateCacheKey(params);
    const entry = this.cache.get(key);

    if (!entry) {
      this.logAccess(key, false);
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.cachedAt.getTime() > entry.ttl) {
      console.log(`🗑️ Cache entry expired: ${entry.id}`);
      this.cache.delete(key);
      this.saveCacheToStorage();
      this.logAccess(key, false);
      return null;
    }

    // Update access information
    entry.lastAccessed = new Date();
    entry.accessCount++;
    this.cache.set(key, entry);
    this.logAccess(key, true);
    this.saveCacheToStorage();

    console.log(`🎯 Cache hit for research query: ${params.title.substring(0, 50)}...`);
    return entry.result;
  }

  /**
   * Store research result in cache
   */
  async setCachedResult(
    task: ResearchTask,
    result: ResearchResult,
    customTTL?: number
  ): Promise<void> {
    const key = this.generateCacheKey({
      title: task.title,
      description: task.description,
      researchType: task.metadata.researchType,
      tags: task.metadata.tags
    });

    const entry: CacheEntry = {
      id: this.generateEntryId(),
      taskId: task.id,
      queryHash: key,
      result,
      cachedAt: new Date(),
      lastAccessed: new Date(),
      accessCount: 0,
      ttl: customTTL || this.defaultTTL,
      tags: task.metadata.tags,
      size: 0 // Will be calculated below
    };

    entry.size = this.calculateSize(entry);

    // Check cache limits and evict if necessary
    await this.ensureCacheSpace(entry.size);

    this.cache.set(key, entry);
    this.saveCacheToStorage();

    console.log(`💾 Cached research result: ${task.title.substring(0, 50)}... (${(entry.size / 1024).toFixed(1)}KB)`);
  }

  /**
   * Search cached results by keywords, tags, or content
   */
  async searchCache(query: {
    keywords?: string[];
    tags?: string[];
    researchType?: string;
    dateRange?: { from: Date; to: Date };
    limit?: number;
  }): Promise<CacheSearchResult> {
    const startTime = Date.now();
    const allEntries = Array.from(this.cache.values());
    let matches: CacheEntry[] = [];

    // Filter by research type
    if (query.researchType) {
      const typeMatches = allEntries.filter(entry => {
        // Extract research type from task metadata or result content
        return entry.tags.includes(query.researchType!) ||
               JSON.stringify(entry.result).toLowerCase().includes(query.researchType!.toLowerCase());
      });
      matches = matches.length > 0 ? matches.filter(e => typeMatches.includes(e)) : typeMatches;
    }

    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      const tagMatches = allEntries.filter(entry => 
        query.tags!.some(tag => entry.tags.includes(tag))
      );
      matches = matches.length > 0 ? matches.filter(e => tagMatches.includes(e)) : tagMatches;
    }

    // Filter by keywords (search in result content)
    if (query.keywords && query.keywords.length > 0) {
      const keywordMatches = allEntries.filter(entry => {
        const content = JSON.stringify(entry.result).toLowerCase();
        return query.keywords!.some(keyword => content.includes(keyword.toLowerCase()));
      });
      matches = matches.length > 0 ? matches.filter(e => keywordMatches.includes(e)) : keywordMatches;
    }

    // Filter by date range
    if (query.dateRange) {
      const dateMatches = allEntries.filter(entry => 
        entry.cachedAt >= query.dateRange!.from && entry.cachedAt <= query.dateRange!.to
      );
      matches = matches.length > 0 ? matches.filter(e => dateMatches.includes(e)) : dateMatches;
    }

    // If no specific filters, return all entries
    if (!query.researchType && !query.tags && !query.keywords && !query.dateRange) {
      matches = allEntries;
    }

    // Sort by relevance (access count and recency)
    matches.sort((a, b) => {
      const scoreA = a.accessCount * 0.7 + (Date.now() - a.lastAccessed.getTime()) / (1000 * 60 * 60 * 24) * -0.3;
      const scoreB = b.accessCount * 0.7 + (Date.now() - b.lastAccessed.getTime()) / (1000 * 60 * 60 * 24) * -0.3;
      return scoreB - scoreA;
    });

    // Apply limit
    const limit = query.limit || 50;
    const limitedMatches = matches.slice(0, limit);

    const searchTime = Date.now() - startTime;

    return {
      entries: limitedMatches,
      totalMatches: matches.length,
      searchTime
    };
  }

  /**
   * Get similar cached results based on content similarity
   */
  async findSimilarResults(
    task: ResearchTask,
    similarityThreshold = 0.7,
    limit = 5
  ): Promise<CacheEntry[]> {
    const allEntries = Array.from(this.cache.values());
    const currentContent = `${task.title} ${task.description}`.toLowerCase();
    
    const similarities = allEntries.map(entry => {
      // Extract comparable content from cached result
      const cachedContent = `${entry.result.summary} ${entry.result.keyFindings.map(f => f.title).join(' ')}`.toLowerCase();
      const similarity = this.calculateTextSimilarity(currentContent, cachedContent);
      
      return { entry, similarity };
    });

    return similarities
      .filter(s => s.similarity >= similarityThreshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(s => s.entry);
  }

  /**
   * Calculate text similarity using basic word overlap
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(/\s+/).filter(w => w.length > 3));
    const words2 = new Set(text2.split(/\s+/).filter(w => w.length > 3));
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Ensure cache has enough space for new entry
   */
  private async ensureCacheSpace(requiredSize: number): Promise<void> {
    const currentSize = this.getCurrentCacheSize();
    
    if (this.cache.size >= this.maxEntries || currentSize + requiredSize > this.maxCacheSize) {
      await this.evictLeastUsedEntries(requiredSize);
    }
  }

  /**
   * Evict least recently used entries to make space
   */
  private async evictLeastUsedEntries(requiredSize: number): Promise<void> {
    const entries = Array.from(this.cache.entries());
    
    // Sort by usage score (access count + recency)
    entries.sort(([, a], [, b]) => {
      const scoreA = a.accessCount + (Date.now() - a.lastAccessed.getTime()) / (1000 * 60 * 60 * 24) * -0.1;
      const scoreB = b.accessCount + (Date.now() - b.lastAccessed.getTime()) / (1000 * 60 * 60 * 24) * -0.1;
      return scoreA - scoreB; // Ascending order (lowest scores first)
    });

    let freedSpace = 0;
    let evicted = 0;

    while ((freedSpace < requiredSize || this.cache.size >= this.maxEntries) && entries.length > 0) {
      const [key, entry] = entries.shift()!;
      freedSpace += entry.size;
      evicted++;
      this.cache.delete(key);
    }

    if (evicted > 0) {
      console.log(`🗑️ Evicted ${evicted} cache entries to free ${(freedSpace / 1024).toFixed(1)}KB`);
      this.saveCacheToStorage();
    }
  }

  /**
   * Get current cache size in bytes
   */
  private getCurrentCacheSize(): number {
    return Array.from(this.cache.values()).reduce((total, entry) => total + entry.size, 0);
  }

  /**
   * Generate unique entry ID
   */
  private generateEntryId(): string {
    return `cache_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Log cache access for hit rate calculation
   */
  private logAccess(id: string, hit: boolean): void {
    this.accessLog.push({ id, timestamp: new Date(), hit });
    
    // Keep only last 1000 access logs
    if (this.accessLog.length > 1000) {
      this.accessLog = this.accessLog.slice(-1000);
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.cachedAt.getTime() > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} expired cache entries`);
      this.saveCacheToStorage();
    }
  }

  /**
   * Start periodic cleanup timer
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000); // Run every hour
  }

  /**
   * Save cache to localStorage
   */
  private saveCacheToStorage(): void {
    try {
      const cacheData = Array.from(this.cache.entries()).map(([key, entry]) => [
        key,
        {
          ...entry,
          cachedAt: entry.cachedAt.toISOString(),
          lastAccessed: entry.lastAccessed.toISOString()
        }
      ]);
      
      localStorage.setItem('parallelai_cache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadCacheFromStorage(): void {
    try {
      const stored = localStorage.getItem('parallelai_cache');
      if (stored) {
        const cacheData = JSON.parse(stored);
        
        for (const [key, storedEntry] of cacheData) {
          const entry: CacheEntry = {
            ...storedEntry,
            cachedAt: new Date(storedEntry.cachedAt),
            lastAccessed: new Date(storedEntry.lastAccessed)
          };
          
          // Only load non-expired entries
          if (Date.now() - entry.cachedAt.getTime() < entry.ttl) {
            this.cache.set(key, entry);
          }
        }
        
        console.log(`📦 Loaded ${this.cache.size} cache entries from storage`);
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  /**
   * Public API methods
   */
  
  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const totalSize = this.getCurrentCacheSize();
    
    // Calculate hit rate from recent access log
    const recentAccesses = this.accessLog.slice(-100);
    const hits = recentAccesses.filter(log => log.hit).length;
    const hitRate = recentAccesses.length > 0 ? hits / recentAccesses.length : 0;

    const dates = entries.map(e => e.cachedAt);
    const accessCounts = entries.map(e => e.accessCount);

    return {
      totalEntries: entries.length,
      totalSize,
      hitRate,
      oldestEntry: dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : undefined,
      newestEntry: dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : undefined,
      mostAccessedEntry: accessCounts.length > 0 ? 
        entries[accessCounts.indexOf(Math.max(...accessCounts))]?.id : undefined
    };
  }

  /**
   * Clear all cache entries
   */
  clearCache(): void {
    this.cache.clear();
    this.accessLog = [];
    localStorage.removeItem('parallelai_cache');
    console.log('🗑️ Cache cleared');
  }

  /**
   * Clear expired entries manually
   */
  clearExpired(): number {
    const sizeBefore = this.cache.size;
    this.cleanup();
    return sizeBefore - this.cache.size;
  }

  /**
   * Get all cache entries for debugging
   */
  getAllEntries(): CacheEntry[] {
    return Array.from(this.cache.values());
  }

  /**
   * Update cache settings
   */
  updateSettings(settings: {
    maxCacheSize?: number;
    defaultTTL?: number;
    maxEntries?: number;
  }): void {
    if (settings.maxCacheSize) this.maxCacheSize = settings.maxCacheSize;
    if (settings.defaultTTL) this.defaultTTL = settings.defaultTTL;
    if (settings.maxEntries) this.maxEntries = settings.maxEntries;
    
    console.log('⚙️ Cache settings updated');
  }

  /**
   * Preload similar results for a task
   */
  async preloadSimilarResults(task: ResearchTask): Promise<ResearchResult[]> {
    const similarEntries = await this.findSimilarResults(task, 0.6, 3);
    return similarEntries.map(entry => entry.result);
  }

  /**
   * Export cache data for backup
   */
  exportCache(): string {
    const cacheData = Array.from(this.cache.entries());
    return JSON.stringify(cacheData, null, 2);
  }

  /**
   * Import cache data from backup
   */
  importCache(data: string): boolean {
    try {
      const cacheData = JSON.parse(data);
      this.cache.clear();
      
      for (const [key, storedEntry] of cacheData) {
        const entry: CacheEntry = {
          ...storedEntry,
          cachedAt: new Date(storedEntry.cachedAt),
          lastAccessed: new Date(storedEntry.lastAccessed)
        };
        this.cache.set(key, entry);
      }
      
      this.saveCacheToStorage();
      console.log(`📥 Imported ${this.cache.size} cache entries`);
      return true;
    } catch (error) {
      console.error('Failed to import cache data:', error);
      return false;
    }
  }
}

// Export singleton instance
export const parallelAICache = new ParallelAICacheService();
export default parallelAICache;