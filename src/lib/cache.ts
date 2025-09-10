// Comprehensive caching system for performance optimization
import { logger } from './logger';

// Cache configuration
const CACHE_CONFIG = {
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000, // Maximum number of cache entries
  cleanupInterval: 10 * 60 * 1000, // 10 minutes
  enableMetrics: true,
};

// Cache entry interface
interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

// Cache metrics interface
interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  size: number;
}

// Cache statistics
class CacheStats {
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    size: 0,
  };

  hit(): void {
    this.metrics.hits++;
  }

  miss(): void {
    this.metrics.misses++;
  }

  set(): void {
    this.metrics.sets++;
  }

  delete(): void {
    this.metrics.deletes++;
  }

  evict(): void {
    this.metrics.evictions++;
  }

  updateSize(size: number): void {
    this.metrics.size = size;
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  getHitRate(): number {
    const total = this.metrics.hits + this.metrics.misses;
    return total > 0 ? this.metrics.hits / total : 0;
  }

  reset(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      size: 0,
    };
  }
}

// Main cache manager
export class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private stats = new CacheStats();
  private cleanupTimer?: NodeJS.Timeout;

  constructor() {
    this.startCleanupTimer();
  }

  /**
   * Set a value in the cache
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttl - Time to live in milliseconds
   */
  set<T>(key: string, data: T, ttl: number = CACHE_CONFIG.defaultTTL): void {
    try {
      // Check cache size limit
      if (this.cache.size >= CACHE_CONFIG.maxSize) {
        this.evictLRU();
      }

      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        accessCount: 0,
        lastAccessed: Date.now(),
      };

      this.cache.set(key, entry);
      this.stats.set();
      this.stats.updateSize(this.cache.size);

      if (CACHE_CONFIG.enableMetrics) {
        logger.debug('Cache set', { key, ttl, cacheSize: this.cache.size });
      }
    } catch (error) {
      logger.error('Cache set failed', error as Error, { key });
    }
  }

  /**
   * Get a value from the cache
   * @param key - Cache key
   * @returns Cached data or null if not found/expired
   */
  get<T>(key: string): T | null {
    try {
      const entry = this.cache.get(key) as CacheEntry<T> | undefined;
      
      if (!entry) {
        this.stats.miss();
        return null;
      }

      // Check if entry has expired
      if (Date.now() > entry.timestamp + entry.ttl) {
        this.cache.delete(key);
        this.stats.miss();
        this.stats.updateSize(this.cache.size);
        return null;
      }

      // Update access statistics
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      this.stats.hit();

      if (CACHE_CONFIG.enableMetrics) {
        logger.debug('Cache hit', { key, accessCount: entry.accessCount });
      }

      return entry.data;
    } catch (error) {
      logger.error('Cache get failed', error as Error, { key });
      this.stats.miss();
      return null;
    }
  }

  /**
   * Get a value from cache or set it if not found
   * @param key - Cache key
   * @param factory - Function to generate data if not cached
   * @param ttl - Time to live in milliseconds
   * @returns Cached or newly generated data
   */
  async getOrSet<T>(
    key: string, 
    factory: () => Promise<T>, 
    ttl: number = CACHE_CONFIG.defaultTTL
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await factory();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Delete a value from the cache
   * @param key - Cache key
   */
  delete(key: string): boolean {
    try {
      const deleted = this.cache.delete(key);
      if (deleted) {
        this.stats.delete();
        this.stats.updateSize(this.cache.size);
      }
      return deleted;
    } catch (error) {
      logger.error('Cache delete failed', error as Error, { key });
      return false;
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    try {
      const size = this.cache.size;
      this.cache.clear();
      this.stats.updateSize(0);
      logger.info('Cache cleared', { clearedEntries: size });
    } catch (error) {
      logger.error('Cache clear failed', error as Error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheMetrics {
    return this.stats.getMetrics();
  }

  /**
   * Get cache hit rate
   */
  getHitRate(): number {
    return this.stats.getHitRate();
  }

  /**
   * Get cache size
   */
  getSize(): number {
    return this.cache.size;
  }

  /**
   * Check if cache has a key (without updating access stats)
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    return Date.now() <= entry.timestamp + entry.ttl;
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evict();
      logger.debug('Cache LRU eviction', { key: oldestKey });
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    try {
      const now = Date.now();
      let cleanedCount = 0;

      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.timestamp + entry.ttl) {
          this.cache.delete(key);
          cleanedCount++;
        }
      }

      this.stats.updateSize(this.cache.size);

      if (cleanedCount > 0) {
        logger.debug('Cache cleanup completed', { 
          cleanedCount, 
          remainingSize: this.cache.size 
        });
      }
    } catch (error) {
      logger.error('Cache cleanup failed', error as Error);
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, CACHE_CONFIG.cleanupInterval);
  }

  /**
   * Stop cleanup timer
   */
  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /**
   * Destroy cache instance
   */
  destroy(): void {
    this.stopCleanupTimer();
    this.clear();
    this.stats.reset();
  }
}

// API response cache
export class ApiCache {
  private cache = new CacheManager();

  /**
   * Cache API response
   * @param key - Cache key (usually URL + params hash)
   * @param data - Response data
   * @param ttl - Time to live in milliseconds
   */
  setResponse<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, data, ttl);
  }

  /**
   * Get cached API response
   * @param key - Cache key
   * @returns Cached response or null
   */
  getResponse<T>(key: string): T | null {
    return this.cache.get<T>(key);
  }

  /**
   * Get or set API response
   * @param key - Cache key
   * @param factory - Function to fetch data if not cached
   * @param ttl - Time to live in milliseconds
   * @returns Cached or newly fetched response
   */
  async getOrSetResponse<T>(
    key: string, 
    factory: () => Promise<T>, 
    ttl: number = 5 * 60 * 1000
  ): Promise<T> {
    return this.cache.getOrSet(key, factory, ttl);
  }

  /**
   * Invalidate cache entries matching pattern
   * @param pattern - Pattern to match keys
   */
  invalidate(pattern: string | RegExp): void {
    const keys = this.cache.keys();
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    
    for (const key of keys) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return this.cache.getStats();
  }
}

// Database query cache
export class QueryCache {
  private cache = new CacheManager();

  /**
   * Generate cache key for query
   * @param query - SQL query
   * @param params - Query parameters
   * @returns Cache key
   */
  private generateKey(query: string, params: unknown[] = []): string {
    const hash = JSON.stringify({ query, params });
    return `query:${Buffer.from(hash).toString('base64').slice(0, 16)}`;
  }

  /**
   * Cache query result
   * @param query - SQL query
   * @param params - Query parameters
   * @param data - Query result
   * @param ttl - Time to live in milliseconds
   */
  setQuery<T>(query: string, params: unknown[], data: T, ttl: number = 10 * 60 * 1000): void {
    const key = this.generateKey(query, params);
    this.cache.set(key, data, ttl);
  }

  /**
   * Get cached query result
   * @param query - SQL query
   * @param params - Query parameters
   * @returns Cached result or null
   */
  getQuery<T>(query: string, params: unknown[] = []): T | null {
    const key = this.generateKey(query, params);
    return this.cache.get<T>(key);
  }

  /**
   * Get or set query result
   * @param query - SQL query
   * @param params - Query parameters
   * @param factory - Function to execute query if not cached
   * @param ttl - Time to live in milliseconds
   * @returns Cached or newly executed query result
   */
  async getOrSetQuery<T>(
    query: string, 
    params: unknown[], 
    factory: () => Promise<T>, 
    ttl: number = 10 * 60 * 1000
  ): Promise<T> {
    const key = this.generateKey(query, params);
    return this.cache.getOrSet(key, factory, ttl);
  }

  /**
   * Invalidate cache for specific table
   * @param table - Table name
   */
  invalidateTable(table: string): void {
    this.cache.keys().forEach(key => {
      if (key.includes(table)) {
        this.cache.delete(key);
      }
    });
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return this.cache.getStats();
  }
}

// Create singleton instances
export const apiCache = new ApiCache();
export const queryCache = new QueryCache();

// Export cache manager for custom use
// export { CacheManager };
