// Database optimization utilities and query performance monitoring
import { supabaseClient } from '@/integrations/supabase/client';
import { logger } from './logger';
import { measureApiCall } from './performance';

// Database configuration
const DB_CONFIG = {
  // Query timeout in milliseconds
  queryTimeout: 30000,
  // Maximum number of rows to fetch in a single query
  maxRowsPerQuery: 1000,
  // Connection pool settings
  pool: {
    min: 2,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  // Cache settings
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 1000,
  },
};

// Query performance metrics
interface QueryMetrics {
  query: string;
  duration: number;
  rowCount: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

// Database query cache
class QueryCache {
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();

  set(key: string, data: unknown, ttl: number = DB_CONFIG.cache.ttl): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    // Cleanup expired entries
    this.cleanup();
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  get size(): number {
    return this.cache.size;
  }
}

// Database query optimizer
class QueryOptimizer {
  private static instance: QueryOptimizer;
  private cache = new QueryCache();
  private metrics: QueryMetrics[] = [];

  static getInstance(): QueryOptimizer {
    if (!QueryOptimizer.instance) {
      QueryOptimizer.instance = new QueryOptimizer();
    }
    return QueryOptimizer.instance;
  }

  // Optimized query execution with caching and metrics
  async executeQuery<T>(
    query: string,
    params?: unknown[],
    options: {
      cache?: boolean;
      cacheKey?: string;
      cacheTtl?: number;
      timeout?: number;
    } = {}
  ): Promise<T> {
    const {
      cache = DB_CONFIG.cache.enabled,
      cacheKey,
      cacheTtl = DB_CONFIG.cache.ttl,
      timeout = DB_CONFIG.queryTimeout,
    } = options;

    const queryKey = cacheKey || this.generateCacheKey(query, params);
    const startTime = Date.now();

    try {
      // Check cache first
      if (cache) {
        const cachedResult = this.cache.get(queryKey);
        if (cachedResult) {
          logger.debug('Cache hit', { query, cacheKey: queryKey });
          return cachedResult as T;
        }
      }

      // Execute query with timeout
      const result = await measureApiCall(
        `DB Query: ${query.substring(0, 50)}...`,
        () => this.executeWithTimeout(query, params, timeout),
        { query, params }
      );

      // Cache result if enabled
      if (cache && result) {
        this.cache.set(queryKey, result, cacheTtl);
      }

      // Record metrics
      this.recordMetrics({
        query,
        duration: Date.now() - startTime,
        rowCount: Array.isArray(result) ? result.length : 1,
        timestamp: new Date(),
        success: true,
      });

      return result as T;
    } catch (error) {
      // Record error metrics
      this.recordMetrics({
        query,
        duration: Date.now() - startTime,
        rowCount: 0,
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  // Execute query with timeout
  private async executeWithTimeout<T>(
    query: string,
    params?: unknown[],
    timeout: number = DB_CONFIG.queryTimeout
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Query timeout after ${timeout}ms`));
      }, timeout);

      // Execute the actual query
      this.executeRawQuery(query, params)
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result as T);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  // Execute raw query using Supabase
  private async executeRawQuery<T>(query: string, params?: unknown[]): Promise<T> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabaseClient.getClient().rpc('execute_sql', {
      sql_query: query,
      sql_params: params || [],
    } as any);

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    return data;
  }

  // Generate cache key from query and parameters
  private generateCacheKey(query: string, params?: unknown[]): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${query}:${paramString}`;
  }

  // Record query metrics
  private recordMetrics(metrics: QueryMetrics): void {
    this.metrics.push(metrics);

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Log slow queries
    if (metrics.duration > 1000) {
      logger.warn('Slow query detected', {
        query: metrics.query,
        duration: metrics.duration,
        rowCount: metrics.rowCount,
      });
    }
  }

  // Get query performance statistics
  getPerformanceStats(): {
    totalQueries: number;
    averageDuration: number;
    slowQueries: number;
    cacheHitRate: number;
    errorRate: number;
  } {
    const totalQueries = this.metrics.length;
    if (totalQueries === 0) {
      return {
        totalQueries: 0,
        averageDuration: 0,
        slowQueries: 0,
        cacheHitRate: 0,
        errorRate: 0,
      };
    }

    const successfulQueries = this.metrics.filter(m => m.success);
    const slowQueries = this.metrics.filter(m => m.duration > 1000).length;
    const errors = this.metrics.filter(m => !m.success).length;

    const averageDuration = successfulQueries.reduce((sum, m) => sum + m.duration, 0) / successfulQueries.length;
    const errorRate = (errors / totalQueries) * 100;

    return {
      totalQueries,
      averageDuration,
      slowQueries,
      cacheHitRate: 0, // Would need to track cache hits separately
      errorRate,
    };
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: DB_CONFIG.cache.maxSize,
    };
  }
}

// Database schema optimization recommendations
export class DatabaseOptimizer {
  // Recommended indexes for common queries
  static getRecommendedIndexes(): Array<{
    table: string;
    columns: string[];
    type: 'btree' | 'hash' | 'gin' | 'gist';
    description: string;
  }> {
    return [
      // Wallets table
      {
        table: 'wallets',
        columns: ['owner_id'],
        type: 'btree',
        description: 'Index for wallet ownership queries',
      },
      {
        table: 'wallets',
        columns: ['created_at'],
        type: 'btree',
        description: 'Index for wallet creation date queries',
      },
      {
        table: 'wallets',
        columns: ['owner_id', 'created_at'],
        type: 'btree',
        description: 'Composite index for user wallet queries',
      },

      // Guardians table
      {
        table: 'guardians',
        columns: ['wallet_id'],
        type: 'btree',
        description: 'Index for guardian wallet queries',
      },
      {
        table: 'guardians',
        columns: ['email'],
        type: 'btree',
        description: 'Index for guardian email lookups',
      },
      {
        table: 'guardians',
        columns: ['invitation_token'],
        type: 'btree',
        description: 'Index for guardian invitation verification',
      },
      {
        table: 'guardians',
        columns: ['wallet_id', 'status'],
        type: 'btree',
        description: 'Composite index for guardian status queries',
      },

      // Recovery requests table
      {
        table: 'recovery_requests',
        columns: ['wallet_id'],
        type: 'btree',
        description: 'Index for recovery request queries',
      },
      {
        table: 'recovery_requests',
        columns: ['status'],
        type: 'btree',
        description: 'Index for recovery status queries',
      },
      {
        table: 'recovery_requests',
        columns: ['created_at'],
        type: 'btree',
        description: 'Index for recovery request date queries',
      },
      {
        table: 'recovery_requests',
        columns: ['wallet_id', 'status', 'created_at'],
        type: 'btree',
        description: 'Composite index for recovery request filtering',
      },

      // Bitcoin transactions table
      {
        table: 'bitcoin_transactions',
        columns: ['wallet_id'],
        type: 'btree',
        description: 'Index for wallet transaction queries',
      },
      {
        table: 'bitcoin_transactions',
        columns: ['txid'],
        type: 'btree',
        description: 'Index for transaction ID lookups',
      },
      {
        table: 'bitcoin_transactions',
        columns: ['created_at'],
        type: 'btree',
        description: 'Index for transaction date queries',
      },
      {
        table: 'bitcoin_transactions',
        columns: ['wallet_id', 'created_at'],
        type: 'btree',
        description: 'Composite index for wallet transaction history',
      },

      // Audit logs table
      {
        table: 'audit_logs',
        columns: ['user_id'],
        type: 'btree',
        description: 'Index for user audit log queries',
      },
      {
        table: 'audit_logs',
        columns: ['action'],
        type: 'btree',
        description: 'Index for action-based audit queries',
      },
      {
        table: 'audit_logs',
        columns: ['created_at'],
        type: 'btree',
        description: 'Index for audit log date queries',
      },
      {
        table: 'audit_logs',
        columns: ['user_id', 'action', 'created_at'],
        type: 'btree',
        description: 'Composite index for comprehensive audit queries',
      },
    ];
  }

  // Optimized queries for common operations
  static getOptimizedQueries(): Record<string, string> {
    return {
      // Get user wallets with guardian count
      getUserWallets: `
        SELECT 
          w.*,
          COUNT(g.id) as guardian_count,
          COUNT(CASE WHEN g.status = 'active' THEN 1 END) as active_guardians
        FROM wallets w
        LEFT JOIN guardians g ON w.id = g.wallet_id
        WHERE w.owner_id = $1
        GROUP BY w.id
        ORDER BY w.created_at DESC
      `,

      // Get wallet with all guardians
      getWalletWithGuardians: `
        SELECT 
          w.*,
          json_agg(
            json_build_object(
              'id', g.id,
              'email', g.email,
              'full_name', g.full_name,
              'phone_number', g.phone_number,
              'status', g.status,
              'share_index', g.share_index,
              'created_at', g.created_at
            ) ORDER BY g.created_at
          ) as guardians
        FROM wallets w
        LEFT JOIN guardians g ON w.id = g.wallet_id
        WHERE w.id = $1
        GROUP BY w.id
      `,

      // Get pending recovery requests
      getPendingRecoveries: `
        SELECT 
          rr.*,
          w.name as wallet_name,
          u.email as initiator_email
        FROM recovery_requests rr
        JOIN wallets w ON rr.wallet_id = w.id
        JOIN auth.users u ON rr.initiator_id = u.id
        WHERE rr.status = 'pending'
        ORDER BY rr.created_at DESC
      `,

      // Get wallet transaction history with pagination
      getWalletTransactions: `
        SELECT 
          bt.*,
          COUNT(*) OVER() as total_count
        FROM bitcoin_transactions bt
        WHERE bt.wallet_id = $1
        ORDER BY bt.created_at DESC
        LIMIT $2 OFFSET $3
      `,

      // Get guardian recovery participation
      getGuardianRecoveries: `
        SELECT 
          rr.*,
          w.name as wallet_name,
          COUNT(ra.id) as approvals_count,
          COUNT(rs.id) as signatures_count
        FROM recovery_requests rr
        JOIN wallets w ON rr.wallet_id = w.id
        LEFT JOIN recovery_approvals ra ON rr.id = ra.recovery_request_id
        LEFT JOIN recovery_signatures rs ON rr.id = rs.recovery_request_id
        WHERE EXISTS (
          SELECT 1 FROM guardians g 
          WHERE g.wallet_id = rr.wallet_id 
          AND g.id = $1
        )
        GROUP BY rr.id, w.name
        ORDER BY rr.created_at DESC
      `,

      // Get audit logs with user info
      getAuditLogs: `
        SELECT 
          al.*,
          u.email as user_email
        FROM audit_logs al
        LEFT JOIN auth.users u ON al.user_id = u.id
        WHERE ($1::uuid IS NULL OR al.user_id = $1)
        AND ($2::text IS NULL OR al.action = $2)
        AND ($3::timestamp IS NULL OR al.created_at >= $3)
        ORDER BY al.created_at DESC
        LIMIT $4 OFFSET $5
      `,
    };
  }

  // Query performance analysis
  static analyzeQueryPerformance(query: string): {
    complexity: 'low' | 'medium' | 'high';
    recommendations: string[];
    estimatedCost: number;
  } {
    const recommendations: string[] = [];
    let complexity: 'low' | 'medium' | 'high' = 'low';
    let estimatedCost = 1;

    // Check for common performance issues
    if (query.toLowerCase().includes('select *')) {
      recommendations.push('Use specific column names instead of SELECT *');
      complexity = 'medium';
      estimatedCost *= 1.5;
    }

    if (query.toLowerCase().includes('order by') && !query.toLowerCase().includes('limit')) {
      recommendations.push('Add LIMIT clause to ORDER BY queries');
      complexity = 'medium';
      estimatedCost *= 2;
    }

    if (query.toLowerCase().includes('like') && query.toLowerCase().includes('%')) {
      recommendations.push('Consider using full-text search for LIKE queries with wildcards');
      complexity = 'high';
      estimatedCost *= 3;
    }

    if (query.toLowerCase().includes('subquery') || query.toLowerCase().includes('exists')) {
      recommendations.push('Consider using JOINs instead of subqueries');
      complexity = 'medium';
      estimatedCost *= 2;
    }

    if (query.toLowerCase().includes('distinct')) {
      recommendations.push('Ensure DISTINCT is necessary; consider using GROUP BY');
      complexity = 'medium';
      estimatedCost *= 1.5;
    }

    if (query.toLowerCase().includes('union')) {
      recommendations.push('Consider if UNION ALL would be sufficient');
      complexity = 'high';
      estimatedCost *= 2.5;
    }

    return {
      complexity,
      recommendations,
      estimatedCost,
    };
  }

  // Generate database maintenance queries
  static getMaintenanceQueries(): Array<{
    name: string;
    query: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    description: string;
  }> {
    return [
      {
        name: 'Update table statistics',
        query: 'ANALYZE;',
        frequency: 'daily',
        description: 'Update table statistics for query planner',
      },
      {
        name: 'Vacuum tables',
        query: 'VACUUM ANALYZE;',
        frequency: 'weekly',
        description: 'Clean up dead tuples and update statistics',
      },
      {
        name: 'Check for long-running transactions',
        query: `
          SELECT 
            pid,
            now() - pg_stat_activity.query_start AS duration,
            query
          FROM pg_stat_activity
          WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
        `,
        frequency: 'daily',
        description: 'Monitor for long-running queries',
      },
      {
        name: 'Check index usage',
        query: `
          SELECT 
            schemaname,
            tablename,
            indexname,
            idx_scan,
            idx_tup_read,
            idx_tup_fetch
          FROM pg_stat_user_indexes
          ORDER BY idx_scan DESC
        `,
        frequency: 'weekly',
        description: 'Monitor index usage patterns',
      },
    ];
  }
}

// Export database utilities
export const dbOptimizer = QueryOptimizer.getInstance();
export const databaseOptimizer = DatabaseOptimizer;
