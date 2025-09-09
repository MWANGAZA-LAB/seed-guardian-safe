// Centralized error handling for Edge Functions
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

// HTTP response helper
export const createErrorResponse = (error: AppError): Response => {
  const errorResponse = formatErrorResponse(error);
  
  return new Response(JSON.stringify(errorResponse), {
    status: error.statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};

// Success response helper
export const createSuccessResponse = (data: unknown, statusCode: number = 200): Response => {
  return new Response(JSON.stringify(data), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};

// CORS response helper
export const createCORSResponse = (): Response => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};
