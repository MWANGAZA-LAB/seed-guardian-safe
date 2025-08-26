// Centralized logging system with proper error handling
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: Error;
}

class Logger {
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp;
    const level = LogLevel[entry.level];
    const context = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    const error = entry.error ? `\nError: ${entry.error.stack || entry.error.message}` : '';
    
    return `[${timestamp}] ${level}: ${entry.message}${context}${error}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
    };

    const formattedMessage = this.formatMessage(entry);

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formattedMessage);
        break;
    }

    // In production, you might want to send errors to a logging service
    if (level >= LogLevel.ERROR && !this.isDevelopment) {
      this.sendToLoggingService(entry);
    }
  }

  private sendToLoggingService(entry: LogEntry): void {
    // TODO: Implement logging service integration (e.g., Sentry, LogRocket)
    // For now, we'll just store in localStorage for debugging
    try {
      const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
      logs.push(entry);
      if (logs.length > 100) logs.shift(); // Keep only last 100 logs
      localStorage.setItem('app_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to store log entry:', error);
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  fatal(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log(LogLevel.FATAL, message, context, error);
  }

  // Utility method for API errors
  apiError(endpoint: string, status: number, message: string, context?: Record<string, unknown>): void {
    this.error(`API Error [${endpoint}] ${status}: ${message}`, undefined, {
      endpoint,
      status,
      ...context,
    });
  }

  // Utility method for authentication errors
  authError(action: string, error?: Error, context?: Record<string, unknown>): void {
    this.error(`Authentication Error [${action}]`, error, {
      action,
      ...context,
    });
  }

  // Utility method for Bitcoin RPC errors
  bitcoinError(method: string, error?: Error, context?: Record<string, unknown>): void {
    this.error(`Bitcoin RPC Error [${method}]`, error, {
      method,
      ...context,
    });
  }

  // Get stored logs for debugging
  getStoredLogs(): LogEntry[] {
    try {
      return JSON.parse(localStorage.getItem('app_logs') || '[]');
    } catch {
      return [];
    }
  }

  // Clear stored logs
  clearStoredLogs(): void {
    localStorage.removeItem('app_logs');
  }
}

export const logger = new Logger();
