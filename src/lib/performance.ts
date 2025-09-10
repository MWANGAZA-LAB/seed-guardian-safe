// Performance monitoring and optimization utilities
import React from 'react';
import { isDevelopment } from './env';

export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  totalDuration: number;
  averageDuration: number;
  slowestOperation: PerformanceMetric | null;
  fastestOperation: PerformanceMetric | null;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = isDevelopment() || (typeof localStorage !== 'undefined' && localStorage.getItem('performance_monitoring') === 'true');
  }

  startTimer(name: string, metadata?: Record<string, unknown>): void {
    if (!this.isEnabled) return;

    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata,
    });
  }

  endTimer(name: string): number | null {
    if (!this.isEnabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Timer '${name}' was not started`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    // Log slow operations
    if (metric.duration > 1000) {
      console.warn(`Slow operation detected: ${name} took ${metric.duration.toFixed(2)}ms`, metric.metadata);
    }

    return metric.duration;
  }

  measureAsync<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, unknown>): Promise<T> {
    if (!this.isEnabled) return fn();

    this.startTimer(name, metadata);
    
    return fn().finally(() => {
      this.endTimer(name);
    });
  }

  measureSync<T>(name: string, fn: () => T, metadata?: Record<string, unknown>): T {
    if (!this.isEnabled) return fn();

    this.startTimer(name, metadata);
    const result = fn();
    this.endTimer(name);
    
    return result;
  }

  getReport(): PerformanceReport {
    const completedMetrics = Array.from(this.metrics.values())
      .filter(m => m.duration !== undefined)
      .sort((a, b) => (a.duration || 0) - (b.duration || 0));

    const totalDuration = completedMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    const averageDuration = completedMetrics.length > 0 ? totalDuration / completedMetrics.length : 0;

    return {
      metrics: completedMetrics,
      totalDuration,
      averageDuration,
      slowestOperation: completedMetrics[completedMetrics.length - 1] || null,
      fastestOperation: completedMetrics[0] || null,
    };
  }

  clear(): void {
    this.metrics.clear();
  }

  enable(): void {
    this.isEnabled = true;
    localStorage.setItem('performance_monitoring', 'true');
  }

  disable(): void {
    this.isEnabled = false;
    localStorage.removeItem('performance_monitoring');
  }

  isMonitoringEnabled(): boolean {
    return this.isEnabled;
  }
}

export const performanceMonitor = new PerformanceMonitor();

// React performance hooks
export function usePerformanceTimer(name: string) {
  const startTimer = () => performanceMonitor.startTimer(name);
  const endTimer = () => performanceMonitor.endTimer(name);
  
  return { startTimer, endTimer };
}

// Higher-order component for measuring component render time
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
): React.ComponentType<P> {
  const WrappedComponent: React.FC<P> = (props) => {
    const name = componentName || Component.displayName || Component.name;
    
    React.useEffect(() => {
      performanceMonitor.startTimer(`${name}-render`);
      
      return () => {
        performanceMonitor.endTimer(`${name}-render`);
      };
    });

    return React.createElement(Component, props);
  };

  WrappedComponent.displayName = `withPerformanceMonitoring(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Utility for measuring API calls
export async function measureApiCall<T>(
  name: string,
  apiCall: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  return performanceMonitor.measureAsync(name, apiCall, metadata);
}

// Utility for measuring expensive operations
export function measureOperation<T>(
  name: string,
  operation: () => T,
  metadata?: Record<string, unknown>
): T {
  return performanceMonitor.measureSync(name, operation, metadata);
}

// Debounce utility for performance optimization
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility for performance optimization
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Memoization utility for expensive calculations
export function memoize<T extends (...args: unknown[]) => unknown>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = func(...args);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cache.set(key, result as any);
    return result;
  }) as T;
}

// Lazy loading utility
export function lazyLoad<T>(
  importFn: () => Promise<{ default: T }>,
  _fallback?: T
): () => Promise<T> {
  let cached: T | null = null;
  let loading: Promise<T> | null = null;
  
  return async () => {
    if (cached) return cached;
    if (loading) return loading;
    
    loading = importFn().then(module => {
      cached = module.default;
      loading = null;
      return cached;
    });
    
    return loading;
  };
}

// Intersection Observer utility for lazy loading
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [ref, options]);

  return isIntersecting;
}
