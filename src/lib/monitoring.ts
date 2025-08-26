// Comprehensive monitoring and alerting system
import { logger } from './logger';
import { dbOptimizer } from './database';

// Monitoring configuration
const MONITORING_CONFIG = {
  // Metrics collection
  metrics: {
    enabled: true,
    collectionInterval: 60000, // 1 minute
    retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  // Alerting thresholds
  thresholds: {
    apiResponseTime: 2000, // 2 seconds
    errorRate: 5, // 5%
    memoryUsage: 80, // 80%
    cpuUsage: 70, // 70%
    databaseConnections: 80, // 80%
    slowQueries: 1000, // 1 second
  },
  // Alert channels
  alertChannels: {
    email: {
      enabled: true,
      recipients: process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || [],
    },
    slack: {
      enabled: false,
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
    },
    pagerduty: {
      enabled: false,
      apiKey: process.env.PAGERDUTY_API_KEY,
    },
  },
};

// Metric types
interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  tags: Record<string, string>;
}

interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

// Performance metrics collector
class MetricsCollector {
  private metrics: Metric[] = [];
  private collectionInterval?: NodeJS.Timeout;

  start(): void {
    if (!MONITORING_CONFIG.metrics.enabled) return;

    this.collectionInterval = setInterval(() => {
      this.collectSystemMetrics();
      this.collectApplicationMetrics();
      this.collectDatabaseMetrics();
      this.cleanupOldMetrics();
    }, MONITORING_CONFIG.metrics.collectionInterval);

    logger.info('Metrics collection started');
  }

  stop(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = undefined;
      logger.info('Metrics collection stopped');
    }
  }

  private async collectSystemMetrics(): Promise<void> {
    try {
      // Memory usage
      if (typeof performance !== 'undefined' && performance.memory) {
        const memory = performance.memory;
        const memoryUsagePercent = (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100;

        this.addMetric('memory.usage.percent', memoryUsagePercent, {
          type: 'system',
          component: 'memory',
        });

        this.addMetric('memory.used.bytes', memory.usedJSHeapSize, {
          type: 'system',
          component: 'memory',
        });

        this.addMetric('memory.total.bytes', memory.totalJSHeapSize, {
          type: 'system',
          component: 'memory',
        });
      }

      // Navigation timing
      if (typeof performance !== 'undefined' && performance.getEntriesByType) {
        const navigationEntries = performance.getEntriesByType('navigation');
        if (navigationEntries.length > 0) {
          const nav = navigationEntries[0] as PerformanceNavigationTiming;
          
          this.addMetric('page.load.time', nav.loadEventEnd - nav.loadEventStart, {
            type: 'system',
            component: 'navigation',
          });

          this.addMetric('page.dom.content.loaded', nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart, {
            type: 'system',
            component: 'navigation',
          });
        }
      }
    } catch (error) {
      logger.error('Failed to collect system metrics', { error });
    }
  }

  private async collectApplicationMetrics(): Promise<void> {
    try {
      // API response times (would be collected from API service)
      this.addMetric('api.response.time.avg', 0, {
        type: 'application',
        component: 'api',
      });

      // Error rates
      this.addMetric('errors.rate', 0, {
        type: 'application',
        component: 'errors',
      });

      // Active users (simplified)
      this.addMetric('users.active', 1, {
        type: 'application',
        component: 'users',
      });
    } catch (error) {
      logger.error('Failed to collect application metrics', { error });
    }
  }

  private async collectDatabaseMetrics(): Promise<void> {
    try {
      const dbStats = dbOptimizer.getPerformanceStats();
      const cacheStats = dbOptimizer.getCacheStats();

      this.addMetric('database.queries.total', dbStats.totalQueries, {
        type: 'database',
        component: 'queries',
      });

      this.addMetric('database.queries.avg.duration', dbStats.averageDuration, {
        type: 'database',
        component: 'performance',
      });

      this.addMetric('database.queries.slow.count', dbStats.slowQueries, {
        type: 'database',
        component: 'performance',
      });

      this.addMetric('database.queries.error.rate', dbStats.errorRate, {
        type: 'database',
        component: 'errors',
      });

      this.addMetric('database.cache.size', cacheStats.size, {
        type: 'database',
        component: 'cache',
      });

      this.addMetric('database.cache.hit.rate', dbStats.cacheHitRate, {
        type: 'database',
        component: 'cache',
      });
    } catch (error) {
      logger.error('Failed to collect database metrics', { error });
    }
  }

  private addMetric(name: string, value: number, tags: Record<string, string>): void {
    this.metrics.push({
      name,
      value,
      timestamp: new Date(),
      tags,
    });
  }

  private cleanupOldMetrics(): void {
    const cutoff = new Date(Date.now() - MONITORING_CONFIG.metrics.retentionPeriod);
    this.metrics = this.metrics.filter(metric => metric.timestamp > cutoff);
  }

  getMetrics(filter?: { name?: string; tags?: Record<string, string> }): Metric[] {
    let filtered = this.metrics;

    if (filter?.name) {
      filtered = filtered.filter(m => m.name === filter.name);
    }

    if (filter?.tags) {
      filtered = filtered.filter(m => {
        return Object.entries(filter.tags!).every(([key, value]) => m.tags[key] === value);
      });
    }

    return filtered;
  }

  getMetricStats(name: string, timeRange: { start: Date; end: Date }): {
    min: number;
    max: number;
    avg: number;
    count: number;
  } {
    const metrics = this.metrics.filter(
      m => m.name === name && m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
    );

    if (metrics.length === 0) {
      return { min: 0, max: 0, avg: 0, count: 0 };
    }

    const values = metrics.map(m => m.value);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      count: values.length,
    };
  }
}

// Alert manager
class AlertManager {
  private alerts: Alert[] = [];
  private alertHandlers: Map<string, (alert: Alert) => Promise<void>> = new Map();

  constructor() {
    this.setupAlertHandlers();
  }

  private setupAlertHandlers(): void {
    if (MONITORING_CONFIG.alertChannels.email.enabled) {
      this.alertHandlers.set('email', this.sendEmailAlert.bind(this));
    }

    if (MONITORING_CONFIG.alertChannels.slack.enabled) {
      this.alertHandlers.set('slack', this.sendSlackAlert.bind(this));
    }

    if (MONITORING_CONFIG.alertChannels.pagerduty.enabled) {
      this.alertHandlers.set('pagerduty', this.sendPagerDutyAlert.bind(this));
    }
  }

  createAlert(
    severity: Alert['severity'],
    title: string,
    message: string,
    tags: Record<string, string> = {}
  ): Alert {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      severity,
      title,
      message,
      timestamp: new Date(),
      acknowledged: false,
    };

    this.alerts.push(alert);
    this.processAlert(alert);

    logger.warn('Alert created', { alert, tags });
    return alert;
  }

  private async processAlert(alert: Alert): Promise<void> {
    // Send to all configured channels
    const promises = Array.from(this.alertHandlers.values()).map(handler => handler(alert));
    
    try {
      await Promise.allSettled(promises);
    } catch (error) {
      logger.error('Failed to send alert', { alert, error });
    }
  }

  private async sendEmailAlert(alert: Alert): Promise<void> {
    if (!MONITORING_CONFIG.alertChannels.email.recipients.length) return;

    // This would integrate with your email service (SendGrid, etc.)
    logger.info('Email alert would be sent', {
      recipients: MONITORING_CONFIG.alertChannels.email.recipients,
      alert,
    });
  }

  private async sendSlackAlert(alert: Alert): Promise<void> {
    if (!MONITORING_CONFIG.alertChannels.slack.webhookUrl) return;

    const payload = {
      text: `🚨 *${alert.severity.toUpperCase()} Alert*`,
      attachments: [
        {
          title: alert.title,
          text: alert.message,
          color: this.getSeverityColor(alert.severity),
          fields: [
            {
              title: 'Severity',
              value: alert.severity,
              short: true,
            },
            {
              title: 'Time',
              value: alert.timestamp.toISOString(),
              short: true,
            },
          ],
        },
      ],
    };

    try {
      await fetch(MONITORING_CONFIG.alertChannels.slack.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      logger.error('Failed to send Slack alert', { alert, error });
    }
  }

  private async sendPagerDutyAlert(alert: Alert): Promise<void> {
    if (!MONITORING_CONFIG.alertChannels.pagerduty.apiKey) return;

    const payload = {
      routing_key: MONITORING_CONFIG.alertChannels.pagerduty.apiKey,
      event_action: 'trigger',
      payload: {
        summary: alert.title,
        severity: alert.severity,
        source: 'seed-guardian-safe',
        custom_details: alert.message,
      },
    };

    try {
      await fetch('https://events.pagerduty.com/v2/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      logger.error('Failed to send PagerDuty alert', { alert, error });
    }
  }

  private getSeverityColor(severity: Alert['severity']): string {
    switch (severity) {
      case 'low': return '#36a64f';
      case 'medium': return '#ffa500';
      case 'high': return '#ff8c00';
      case 'critical': return '#ff0000';
      default: return '#808080';
    }
  }

  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();

    logger.info('Alert acknowledged', { alertId, acknowledgedBy });
    return true;
  }

  getAlerts(filter?: {
    severity?: Alert['severity'];
    acknowledged?: boolean;
    timeRange?: { start: Date; end: Date };
  }): Alert[] {
    let filtered = this.alerts;

    if (filter?.severity) {
      filtered = filtered.filter(a => a.severity === filter.severity);
    }

    if (filter?.acknowledged !== undefined) {
      filtered = filtered.filter(a => a.acknowledged === filter.acknowledged);
    }

    if (filter?.timeRange) {
      filtered = filtered.filter(
        a => a.timestamp >= filter.timeRange!.start && a.timestamp <= filter.timeRange!.end
      );
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getActiveAlerts(): Alert[] {
    return this.getAlerts({ acknowledged: false });
  }
}

// Health check system
class HealthChecker {
  private checks: Map<string, () => Promise<boolean>> = new Map();

  registerCheck(name: string, check: () => Promise<boolean>): void {
    this.checks.set(name, check);
  }

  async runHealthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, { status: 'pass' | 'fail'; duration: number; error?: string }>;
  }> {
    const results: Record<string, { status: 'pass' | 'fail'; duration: number; error?: string }> = {};
    let failedChecks = 0;

    for (const [name, check] of this.checks) {
      const startTime = Date.now();
      let status: 'pass' | 'fail' = 'pass';
      let error: string | undefined;

      try {
        const result = await check();
        if (!result) {
          status = 'fail';
          error = 'Check returned false';
          failedChecks++;
        }
      } catch (err) {
        status = 'fail';
        error = err instanceof Error ? err.message : String(err);
        failedChecks++;
      }

      const duration = Date.now() - startTime;
      results[name] = { status, duration, error };
    }

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (failedChecks > 0) {
      overallStatus = failedChecks === this.checks.size ? 'unhealthy' : 'degraded';
    }

    return { status: overallStatus, checks: results };
  }
}

// Monitoring dashboard data
class DashboardData {
  private metricsCollector: MetricsCollector;
  private alertManager: AlertManager;

  constructor(metricsCollector: MetricsCollector, alertManager: AlertManager) {
    this.metricsCollector = metricsCollector;
    this.alertManager = alertManager;
  }

  getSystemOverview(): {
    uptime: number;
    memoryUsage: number;
    activeAlerts: number;
    errorRate: number;
    responseTime: number;
  } {
    const now = Date.now();
    const startTime = performance.timing?.navigationStart || now;
    const uptime = now - startTime;

    const memoryMetrics = this.metricsCollector.getMetrics({ name: 'memory.usage.percent' });
    const memoryUsage = memoryMetrics.length > 0 ? memoryMetrics[memoryMetrics.length - 1].value : 0;

    const activeAlerts = this.alertManager.getActiveAlerts().length;

    const errorMetrics = this.metricsCollector.getMetrics({ name: 'errors.rate' });
    const errorRate = errorMetrics.length > 0 ? errorMetrics[errorMetrics.length - 1].value : 0;

    const responseMetrics = this.metricsCollector.getMetrics({ name: 'api.response.time.avg' });
    const responseTime = responseMetrics.length > 0 ? responseMetrics[responseMetrics.length - 1].value : 0;

    return {
      uptime,
      memoryUsage,
      activeAlerts,
      errorRate,
      responseTime,
    };
  }

  getPerformanceMetrics(timeRange: { start: Date; end: Date }): {
    responseTimes: Array<{ timestamp: Date; value: number }>;
    errorRates: Array<{ timestamp: Date; value: number }>;
    memoryUsage: Array<{ timestamp: Date; value: number }>;
  } {
    const responseMetrics = this.metricsCollector.getMetrics({ name: 'api.response.time.avg' });
    const errorMetrics = this.metricsCollector.getMetrics({ name: 'errors.rate' });
    const memoryMetrics = this.metricsCollector.getMetrics({ name: 'memory.usage.percent' });

    const filterByTimeRange = (metrics: Metric[]) =>
      metrics.filter(m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end);

    return {
      responseTimes: filterByTimeRange(responseMetrics).map(m => ({
        timestamp: m.timestamp,
        value: m.value,
      })),
      errorRates: filterByTimeRange(errorMetrics).map(m => ({
        timestamp: m.timestamp,
        value: m.value,
      })),
      memoryUsage: filterByTimeRange(memoryMetrics).map(m => ({
        timestamp: m.timestamp,
        value: m.value,
      })),
    };
  }

  getDatabaseMetrics(): {
    totalQueries: number;
    averageDuration: number;
    slowQueries: number;
    errorRate: number;
    cacheHitRate: number;
  } {
    const dbStats = dbOptimizer.getPerformanceStats();
    const cacheStats = dbOptimizer.getCacheStats();

    return {
      totalQueries: dbStats.totalQueries,
      averageDuration: dbStats.averageDuration,
      slowQueries: dbStats.slowQueries,
      errorRate: dbStats.errorRate,
      cacheHitRate: dbStats.cacheHitRate,
    };
  }
}

// Create monitoring instances
const metricsCollector = new MetricsCollector();
const alertManager = new AlertManager();
const healthChecker = new HealthChecker();
const dashboardData = new DashboardData(metricsCollector, alertManager);

// Register default health checks
healthChecker.registerCheck('database', async () => {
  try {
    const stats = dbOptimizer.getPerformanceStats();
    return stats.errorRate < MONITORING_CONFIG.thresholds.errorRate;
  } catch {
    return false;
  }
});

healthChecker.registerCheck('memory', async () => {
  if (typeof performance !== 'undefined' && performance.memory) {
    const memory = performance.memory;
    const usagePercent = (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100;
    return usagePercent < MONITORING_CONFIG.thresholds.memoryUsage;
  }
  return true;
});

// Export monitoring utilities
export const monitoring = {
  metrics: metricsCollector,
  alerts: alertManager,
  health: healthChecker,
  dashboard: dashboardData,
  config: MONITORING_CONFIG,
};
