// Centralized error handling with custom error classes
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR', 400, true, { field });
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401, true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403, true);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND_ERROR', 404, true, { resource });
  }
}

export class ConflictError extends AppError {
  constructor(message: string, resource?: string) {
    super(message, 'CONFLICT_ERROR', 409, true, { resource });
  }
}

export class BitcoinRPCError extends AppError {
  constructor(method: string, message: string, originalError?: Error) {
    super(`Bitcoin RPC Error [${method}]: ${message}`, 'BITCOIN_RPC_ERROR', 500, true, {
      method,
      originalError: originalError?.message,
    });
  }
}

export class DatabaseError extends AppError {
  constructor(operation: string, message: string, originalError?: Error) {
    super(`Database Error [${operation}]: ${message}`, 'DATABASE_ERROR', 500, true, {
      operation,
      originalError: originalError?.message,
    });
  }
}

export class CryptoError extends AppError {
  constructor(operation: string, message: string, originalError?: Error) {
    super(`Cryptographic Error [${operation}]: ${message}`, 'CRYPTO_ERROR', 500, true, {
      operation,
      originalError: originalError?.message,
    });
  }
}

export class NetworkError extends AppError {
  constructor(endpoint: string, message: string, originalError?: Error) {
    super(`Network Error [${endpoint}]: ${message}`, 'NETWORK_ERROR', 503, true, {
      endpoint,
      originalError: originalError?.message,
    });
  }
}

// Error handler utility
export class ErrorHandler {
  static handle(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      return new AppError(
        error.message,
        'UNKNOWN_ERROR',
        500,
        false,
        { originalError: error.message }
      );
    }

    return new AppError(
      'An unexpected error occurred',
      'UNKNOWN_ERROR',
      500,
      false,
      { originalError: String(error) }
    );
  }

  static isOperational(error: AppError): boolean {
    return error.isOperational;
  }

  static shouldExit(error: AppError): boolean {
    return !error.isOperational;
  }
}

// Error boundary for React components
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: AppError;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: AppError; resetError: () => void }>;
  onError?: (error: AppError, errorInfo: React.ErrorInfo) => void;
}

// Utility functions for common error scenarios
export const createValidationError = (field: string, message: string): ValidationError => {
  return new ValidationError(message, field);
};

export const createAuthenticationError = (action: string): AuthenticationError => {
  return new AuthenticationError(`Authentication required for: ${action}`);
};

export const createBitcoinRPCError = (method: string, error: Error): BitcoinRPCError => {
  return new BitcoinRPCError(method, error.message, error);
};

export const createDatabaseError = (operation: string, error: Error): DatabaseError => {
  return new DatabaseError(operation, error.message, error);
};

// Error response formatter for API endpoints
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    statusCode: number;
    context?: Record<string, unknown>;
  };
}

export const formatErrorResponse = (error: AppError): ErrorResponse => {
  return {
    error: {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      context: error.context,
    },
  };
};
