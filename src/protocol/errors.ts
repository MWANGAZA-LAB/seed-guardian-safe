/**
 * Standardized Error Handling for SeedGuardianSafe Protocol
 * 
 * This module provides a comprehensive, secure error handling system
 * for all protocol modules with consistent error types, codes, and context.
 */

// Base protocol error class
export abstract class ProtocolError extends Error {
  public readonly code: string;
  public readonly module: string;
  public readonly severity: 'low' | 'medium' | 'high' | 'critical';
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string,
    module: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    context?: Record<string, unknown>,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.module = module;
    this.severity = severity;
    this.context = this.sanitizeContext(context);
    this.timestamp = Date.now();
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Sanitize error context to prevent information leakage
   */
  private sanitizeContext(context?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!context) return undefined;

    const sanitized: Record<string, unknown> = {};
    const sensitiveKeys = ['privateKey', 'secret', 'password', 'seed', 'mnemonic', 'signature'];

    for (const [key, value] of Object.entries(context)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string' && value.length > 100) {
        sanitized[key] = value.substring(0, 100) + '...';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Convert error to JSON for logging/transmission
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      module: this.module,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp,
      isOperational: this.isOperational,
      stack: this.stack
    };
  }
}

// Proof of Life specific errors
export class PoLError extends ProtocolError {
  constructor(
    message: string,
    code: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    context?: Record<string, unknown>
  ) {
    super(message, code, 'PoL', severity, context);
  }
}

export class PoLVerificationError extends PoLError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VERIFICATION_ERROR', 'high', context);
  }
}

export class PoLStorageError extends PoLError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'STORAGE_ERROR', 'medium', context);
  }
}

export class PoLNetworkError extends PoLError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', 'high', context);
  }
}

export class PoLCryptoError extends PoLError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CRYPTO_ERROR', 'critical', context);
  }
}

// Bitcoin protocol specific errors
export class BitcoinError extends ProtocolError {
  constructor(
    message: string,
    code: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    context?: Record<string, unknown>
  ) {
    super(message, code, 'Bitcoin', severity, context);
  }
}

export class BitcoinRecoveryError extends BitcoinError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'RECOVERY_ERROR', 'critical', context);
  }
}

export class BitcoinTransactionError extends BitcoinError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'TRANSACTION_ERROR', 'high', context);
  }
}

export class BitcoinAddressError extends BitcoinError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'ADDRESS_ERROR', 'medium', context);
  }
}

export class BitcoinScriptError extends BitcoinError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'SCRIPT_ERROR', 'high', context);
  }
}

// Cryptographic errors
export class CryptoError extends ProtocolError {
  constructor(
    message: string,
    code: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'critical',
    context?: Record<string, unknown>
  ) {
    super(message, code, 'Crypto', severity, context);
  }
}

export class ShamirError extends CryptoError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'SHAMIR_ERROR', 'critical', context);
  }
}

export class EncryptionError extends CryptoError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'ENCRYPTION_ERROR', 'critical', context);
  }
}

export class KeyGenerationError extends CryptoError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'KEY_GENERATION_ERROR', 'critical', context);
  }
}

// Validation errors
export class ValidationError extends ProtocolError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 'Validation', 'medium', context);
  }
}

// Standardized error codes
export const ErrorCodes = {
  // General errors
  INITIALIZATION_FAILED: 'INITIALIZATION_FAILED',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  
  // PoL errors
  ENROLLMENT_FAILED: 'ENROLLMENT_FAILED',
  VERIFICATION_FAILED: 'VERIFICATION_FAILED',
  STORAGE_ERROR: 'STORAGE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  CRYPTO_ERROR: 'CRYPTO_ERROR',
  WEBAUTHN_NOT_SUPPORTED: 'WEBAUTHN_NOT_SUPPORTED',
  CREDENTIAL_CREATION_FAILED: 'CREDENTIAL_CREATION_FAILED',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  KEY_GENERATION_FAILED: 'KEY_GENERATION_FAILED',
  SIGNING_FAILED: 'SIGNING_FAILED',
  ENCRYPTION_FAILED: 'ENCRYPTION_FAILED',
  DECRYPTION_FAILED: 'DECRYPTION_FAILED',
  CHECK_IN_FAILED: 'CHECK_IN_FAILED',
  HEARTBEAT_ERROR: 'HEARTBEAT_ERROR',
  
  // Bitcoin errors
  RECOVERY_ERROR: 'RECOVERY_ERROR',
  TRANSACTION_ERROR: 'TRANSACTION_ERROR',
  ADDRESS_ERROR: 'ADDRESS_ERROR',
  SCRIPT_ERROR: 'SCRIPT_ERROR',
  TAPROOT_ERROR: 'TAPROOT_ERROR',
  MINISCRIPT_ERROR: 'MINISCRIPT_ERROR',
  
  // Crypto errors
  SHAMIR_ERROR: 'SHAMIR_ERROR',
  KEY_DERIVATION_ERROR: 'KEY_DERIVATION_ERROR',
  HASH_ERROR: 'HASH_ERROR',
  SIGNATURE_ERROR: 'SIGNATURE_ERROR',
} as const;

// Error handler utility
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: ProtocolError[] = [];
  private maxLogSize = 1000;

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle and log protocol errors
   */
  handleError(error: unknown, context?: Record<string, unknown>): ProtocolError {
    let protocolError: ProtocolError;

    if (error instanceof ProtocolError) {
      protocolError = error;
    } else if (error instanceof Error) {
      // Convert generic error to protocol error
      protocolError = new CryptoError(
        error.message,
        'UNKNOWN_ERROR',
        'medium',
        { ...context, originalError: error.name }
      );
    } else {
      // Handle unknown error types
      protocolError = new CryptoError(
        'Unknown error occurred',
        'UNKNOWN_ERROR',
        'medium',
        { ...context, originalError: String(error) }
      );
    }

    // Log the error
    this.logError(protocolError);

    // Handle critical errors
    if (protocolError.severity === 'critical') {
      this.handleCriticalError(protocolError);
    }

    return protocolError;
  }

  /**
   * Log error to internal store
   */
  private logError(error: ProtocolError): void {
    this.errorLog.push(error);
    
    // Maintain log size limit
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${error.module}] ${error.code}: ${error.message}`, error.context);
    }
  }

  /**
   * Handle critical errors that require immediate attention
   */
  private handleCriticalError(error: ProtocolError): void {
    // In a production environment, this would:
    // 1. Send alerts to monitoring systems
    // 2. Log to external error tracking services
    // 3. Potentially trigger recovery procedures
    
    console.error('CRITICAL ERROR:', error.toJSON());
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    byModule: Record<string, number>;
    bySeverity: Record<string, number>;
    recent: ProtocolError[];
  } {
    const byModule: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    for (const error of this.errorLog) {
      byModule[error.module] = (byModule[error.module] || 0) + 1;
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
    }

    return {
      total: this.errorLog.length,
      byModule,
      bySeverity,
      recent: this.errorLog.slice(-10) // Last 10 errors
    };
  }

  /**
   * Clear error log
   */
  clearLog(): void {
    this.errorLog = [];
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Utility function for consistent error handling
export function handleProtocolError(error: unknown, context?: Record<string, unknown>): ProtocolError {
  return errorHandler.handleError(error, context);
}

// Type guard for protocol errors
export function isProtocolError(error: unknown): error is ProtocolError {
  return error instanceof ProtocolError;
}

// Type guard for critical errors
export function isCriticalError(error: unknown): boolean {
  return isProtocolError(error) && error.severity === 'critical';
}
