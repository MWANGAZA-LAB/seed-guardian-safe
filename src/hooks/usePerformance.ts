// Performance monitoring and optimization hooks
import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { performanceMonitor } from '@/lib/performance';

export interface PerformanceMetrics {
  renderTime: number;
  componentMountTime: number;
  memoryUsage?: number;
  isSlowRender: boolean;
}

export function usePerformanceMonitoring(componentName: string) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    componentMountTime: 0,
    isSlowRender: false,
  });

  const mountTimeRef = useRef<number>(0);
  const renderStartRef = useRef<number>(0);

  useEffect(() => {
    mountTimeRef.current = performance.now();
    performanceMonitor.startTimer(`${componentName}-mount`);
    
    return () => {
      const mountTime = performance.now() - mountTimeRef.current;
      performanceMonitor.endTimer(`${componentName}-mount`);
      
      setMetrics(prev => ({
        ...prev,
        componentMountTime: mountTime,
      }));
    };
  }, [componentName]);

  useEffect(() => {
    renderStartRef.current = performance.now();
    performanceMonitor.startTimer(`${componentName}-render`);
    
    return () => {
      const renderTime = performance.now() - renderStartRef.current;
      performanceMonitor.endTimer(`${componentName}-render`);
      
      setMetrics(prev => ({
        ...prev,
        renderTime,
        isSlowRender: renderTime > 16, // 16ms = 60fps threshold
      }));
    };
  });

  // Monitor memory usage if available
  useEffect(() => {
    if ('memory' in performance) {
      const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
      if (memory) {
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize,
        }));
      }
    }
  }, []);

  return metrics;
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef<number>(0);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = performance.now();
      if (now - lastRun.current >= delay) {
        lastRun.current = now;
        return callback(...args);
      }
    }) as T,
    [callback, delay]
  );
}

export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [ref, options]);

  return isIntersecting;
}

export function useVirtualization<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(visibleStart, visibleEnd);
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStart * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
  };
}

export function useLazyLoading<T>(
  loadFunction: () => Promise<T[]>,
  _dependencies: unknown[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const newData = await loadFunction();
      setData(prev => [...prev, ...newData]);
      setHasMore(newData.length > 0);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [loadFunction, loading, hasMore]);

  useEffect(() => {
    loadMore();
  }, [loadMore]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
  };
}

export function useOptimizedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: React.DependencyList
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(callback, deps);
}

export function useOptimizedMemo<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}

// Performance monitoring for API calls
export function useApiPerformance() {
  const [apiMetrics, setApiMetrics] = useState<{
    [endpoint: string]: {
      averageTime: number;
      callCount: number;
      lastCallTime: number;
    };
  }>({});

  const trackApiCall = useCallback(
    (endpoint: string, duration: number) => {
      setApiMetrics(prev => {
        const current = prev[endpoint] || {
          averageTime: 0,
          callCount: 0,
          lastCallTime: 0,
        };

        const newCallCount = current.callCount + 1;
        const newAverageTime =
          (current.averageTime * current.callCount + duration) / newCallCount;

        return {
          ...prev,
          [endpoint]: {
            averageTime: newAverageTime,
            callCount: newCallCount,
            lastCallTime: Date.now(),
          },
        };
      });
    },
    []
  );

  return { apiMetrics, trackApiCall };
}

// Bundle size optimization hook
export function useCodeSplitting<T>(
  importFunction: () => Promise<{ default: T }>,
  fallback?: T
) {
  const [Component, setComponent] = useState<T | null>(fallback || null);
  const [loading, setLoading] = useState(!fallback);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadComponent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const module = await importFunction();
        
        if (mounted) {
          setComponent(() => module.default);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          setLoading(false);
        }
      }
    };

    loadComponent();

    return () => {
      mounted = false;
    };
  }, [importFunction]);

  return { Component, loading, error };
}
