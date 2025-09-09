// Centralized API service layer with proper error handling, type safety, and security
import { supabaseClient } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { 
  AppError, 
  AuthenticationError, 
  NetworkError, 
  ValidationError,
  ErrorHandler 
} from '@/lib/errors';
import { measureApiCall } from '@/lib/performance';
import { CSRFProtection, InputSanitizer, SecurityAudit } from '@/lib/security';

// API configuration
const API_CONFIG = {
  baseURL: import.meta.env.VITE_SUPABASE_URL,
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
};

// Request interceptor
interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
  retryAttempts?: number;
  requireCSRF?: boolean;
}

// Response interface
interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

// Error response interface
interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    statusCode: number;
    context?: Record<string, unknown>;
  };
}

class ApiService {
  private baseURL: string;
  private timeout: number;
  private retryAttempts: number;
  private retryDelay: number;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.timeout = API_CONFIG.timeout;
    this.retryAttempts = API_CONFIG.retryAttempts;
    this.retryDelay = API_CONFIG.retryDelay;
  }

  // Generic request method with retry logic and security
  private async request<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    const { method, url, data, headers = {}, timeout = this.timeout, retryAttempts = this.retryAttempts, requireCSRF = true } = config;

    // Sanitize input data
    const sanitizedData = data ? this.sanitizeRequestData(data) : undefined;

    // Add CSRF token for state-changing operations
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (requireCSRF && method !== 'GET') {
      const session = await supabaseClient.getSession();
      if (session?.access_token) {
        const csrfToken = CSRFProtection.generateToken(session.access_token);
        requestHeaders['X-CSRF-Token'] = csrfToken;
      }
    }

    const requestConfig: RequestInit = {
      method,
      headers: requestHeaders,
      signal: AbortSignal.timeout(timeout),
    };

    if (sanitizedData && method !== 'GET') {
      requestConfig.body = JSON.stringify(sanitizedData);
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        const response = await measureApiCall(
          `${method} ${url}`,
          () => fetch(`${this.baseURL}${url}`, requestConfig),
          { attempt: attempt + 1, retryAttempts }
        );

        if (!response.ok) {
          const errorData = await this.parseErrorResponse(response);
          throw this.createApiError(errorData, response.status, response.statusText);
        }

        const responseData = await response.json();
        
        return {
          data: responseData,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        };
      } catch (error) {
        lastError = error as Error;
        
        // Log security events
        if (error instanceof ValidationError) {
          SecurityAudit.logSuspiciousActivity('validation_error', { 
            url, 
            method, 
            error: error.message 
          });
        }
        
        // Don't retry on client errors (4xx) or if it's the last attempt
        if (this.shouldNotRetry(error as Error) || attempt === retryAttempts) {
          break;
        }

        // Wait before retrying
        await this.delay(this.retryDelay * Math.pow(2, attempt));
      }
    }

    throw lastError || new Error('Request failed');
  }

    private sanitizeRequestData(data: unknown): unknown {
    if (typeof data === 'string') {
      return InputSanitizer.sanitizeString(data);
    }

    if (typeof data === 'object' && data !== null) {
      if (Array.isArray(data)) {
        return data.map(item => this.sanitizeRequestData(item));
      } else {
        const sanitized: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'string') {
            sanitized[key] = InputSanitizer.sanitizeString(value);
          } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = this.sanitizeRequestData(value);
          } else {
            sanitized[key] = value;
          }
        }

        return sanitized;
      }
    }

    return data;
  }

  private shouldNotRetry(error: Error): boolean {
    // Don't retry on client errors (4xx)
    if (error instanceof AppError) {
      return error.statusCode >= 400 && error.statusCode < 500;
    }
    return false;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async parseErrorResponse(response: Response): Promise<ApiErrorResponse> {
    try {
      return await response.json();
    } catch {
      return {
        error: {
          code: 'UNKNOWN_ERROR',
          message: response.statusText || 'Unknown error',
          statusCode: response.status,
        },
      };
    }
  }

  private createApiError(errorData: ApiErrorResponse, status: number, statusText: string): AppError {
    const { error } = errorData;
    
    switch (error.code) {
      case 'AUTHENTICATION_ERROR':
        return new AuthenticationError(error.message);
      case 'VALIDATION_ERROR':
        return new ValidationError(error.message);
      case 'NETWORK_ERROR':
        return new NetworkError('API', error.message);
      default:
        return new AppError(error.message, error.code, status, true, error.context);
    }
  }

  // HTTP method wrappers
  async get<T>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'GET', url, headers, requireCSRF: false });
  }

  async post<T>(url: string, data?: unknown, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'POST', url, data, headers });
  }

  async put<T>(url: string, data?: unknown, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PUT', url, data, headers });
  }

  async delete<T>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'DELETE', url, headers });
  }

  async patch<T>(url: string, data?: unknown, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PATCH', url, data, headers });
  }

  // Supabase-specific methods with enhanced security
  async supabaseRequest<T>(
    endpoint: string, 
    options: { 
      method?: string; 
      body?: unknown; 
      headers?: Record<string, string>; 
      requireCSRF?: boolean;
    } = {}
  ): Promise<T> {
    const { method = 'POST', body, headers = {}, requireCSRF = true } = options;

    try {
      // Get current session for authentication
      const session = await supabaseClient.getSession();
      if (!session) {
        throw new AuthenticationError('No active session');
      }

      const response = await this.request<T>({
        method: method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
        url: `/functions/v1/${endpoint}`,
        data: body,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          ...headers,
        },
        requireCSRF,
      });

      return response.data;
    } catch (error) {
      const appError = ErrorHandler.handle(error);
      logger.apiError(endpoint, appError.statusCode, appError.message, { method, body });
      throw appError;
    }
  }
}

// Create singleton instance
export const apiService = new ApiService();

// Wallet API methods
export interface CreateWalletRequest {
  name: string;
  masterSeed: string;
  guardians: Array<{
    email: string;
    fullName: string;
    phoneNumber?: string;
  }>;
  thresholdRequirement: number;
  userPassword: string;
}

export interface CreateWalletResponse {
  success: boolean;
  walletId: string;
  message: string;
}

export interface Wallet {
  id: string;
  name: string;
  owner_id: string;
  threshold_requirement: number;
  total_guardians: number;
  created_at: string;
  updated_at: string;
}

export interface Guardian {
  id: string;
  wallet_id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  share_index: number;
  status: 'pending' | 'verified' | 'active';
  invitation_token?: string;
  invitation_expires_at?: string;
  created_at: string;
  updated_at: string;
}

export class WalletApi {
  static async createWallet(request: CreateWalletRequest): Promise<CreateWalletResponse> {
    return apiService.supabaseRequest<CreateWalletResponse>('create-wallet', {
      body: request,
    });
  }

  static async getWallets(): Promise<Wallet[]> {
    const { data, error } = await supabaseClient.getClient()
      .from('wallets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError(error.message, 'DATABASE_ERROR', 500, true);
    }

    return data || [];
  }

  static async getWallet(walletId: string): Promise<Wallet> {
    const { data, error } = await supabaseClient.getClient()
      .from('wallets')
      .select('*')
      .eq('id', walletId)
      .single();

    if (error) {
      throw new AppError(error.message, 'DATABASE_ERROR', 500, true);
    }

    return data;
  }

  static async getGuardians(walletId: string): Promise<Guardian[]> {
    const { data, error } = await supabaseClient.getClient()
      .from('guardians')
      .select('*')
      .eq('wallet_id', walletId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new AppError(error.message, 'DATABASE_ERROR', 500, true);
    }

    return data || [];
  }

  static async deleteWallet(walletId: string): Promise<void> {
    const { error } = await supabaseClient.getClient()
      .from('wallets')
      .delete()
      .eq('id', walletId);

    if (error) {
      throw new AppError(error.message, 'DATABASE_ERROR', 500, true);
    }
  }
}

// Recovery API methods
export interface InitiateRecoveryRequest {
  walletId: string;
  reason: string;
}

export interface InitiateRecoveryResponse {
  success: boolean;
  recoveryId: string;
  message: string;
}

export interface RecoveryRequest {
  id: string;
  wallet_id: string;
  initiator_id: string;
  reason: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  required_approvals: number;
  current_approvals: number;
  created_at: string;
  updated_at: string;
}

export class RecoveryApi {
  static async initiateRecovery(request: InitiateRecoveryRequest): Promise<InitiateRecoveryResponse> {
    return apiService.supabaseRequest<InitiateRecoveryResponse>('initiate-recovery', {
      body: request,
    });
  }

  static async getRecoveryRequests(walletId?: string): Promise<RecoveryRequest[]> {
    let query = supabaseClient.getClient()
      .from('recovery_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (walletId) {
      query = query.eq('wallet_id', walletId);
    }

    const { data, error } = await query;

    if (error) {
      throw new AppError(error.message, 'DATABASE_ERROR', 500, true);
    }

    return data || [];
  }

  static async approveRecovery(recoveryId: string, guardianId: string): Promise<void> {
    return apiService.supabaseRequest('approve-recovery', {
      body: { recoveryId, guardianId },
    });
  }

  static async signRecovery(recoveryId: string, guardianId: string, signature: string): Promise<void> {
    return apiService.supabaseRequest('sign-recovery', {
      body: { recoveryId, guardianId, signature },
    });
  }
}

// Bitcoin API methods
export interface BitcoinTransaction {
  txid: string;
  amount: number;
  fee: number;
  confirmations: number;
  blockheight?: number;
  time: number;
  details: Array<{
    address: string;
    category: 'send' | 'receive' | 'generate' | 'immature' | 'orphan';
    amount: number;
    fee?: number;
  }>;
}

export interface CreateTransactionRequest {
  walletId: string;
  toAddress: string;
  amountSatoshis: number;
  feeRate?: number;
  userPassword: string;
}

export interface CreateTransactionResponse {
  success: boolean;
  transactionId: string;
  unsignedTransaction: string;
  fee: number;
}

export class BitcoinApi {
  static async getBalance(walletId: string, userPassword: string): Promise<number> {
    return apiService.supabaseRequest<number>('bitcoin-service', {
      body: { 
        action: 'getBalance',
        walletId, 
        userPassword 
      },
    });
  }

  static async getAddresses(walletId: string, userPassword: string, count: number = 5): Promise<string[]> {
    return apiService.supabaseRequest<string[]>('bitcoin-service', {
      body: { 
        action: 'getAddresses',
        walletId, 
        userPassword, 
        count 
      },
    });
  }

  static async createTransaction(request: CreateTransactionRequest): Promise<CreateTransactionResponse> {
    return apiService.supabaseRequest<CreateTransactionResponse>('bitcoin-service', {
      body: { 
        action: 'createTransaction',
        ...request 
      },
    });
  }

  static async sendTransaction(transactionId: string, signedTransaction: string): Promise<string> {
    return apiService.supabaseRequest<string>('bitcoin-service', {
      body: { 
        action: 'sendTransaction',
        transactionId, 
        signedTransaction 
      },
    });
  }

  static async getTransactions(walletId: string, userPassword: string): Promise<BitcoinTransaction[]> {
    return apiService.supabaseRequest<BitcoinTransaction[]>('bitcoin-service', {
      body: { 
        action: 'getTransactions',
        walletId, 
        userPassword 
      },
    });
  }
}

// Guardian API methods
export interface VerifyGuardianRequest {
  token: string;
  fullName: string;
  phoneNumber?: string;
}

export interface VerifyGuardianResponse {
  success: boolean;
  guardianId: string;
  message: string;
}

export class GuardianApi {
  static async verifyGuardian(request: VerifyGuardianRequest): Promise<VerifyGuardianResponse> {
    return apiService.supabaseRequest<VerifyGuardianResponse>('verify-guardian', {
      body: request,
    });
  }

  static async getGuardianByToken(token: string): Promise<Guardian> {
    const { data, error } = await supabaseClient.getClient()
      .from('guardians')
      .select('*')
      .eq('invitation_token', token)
      .single();

    if (error) {
      throw new AppError(error.message, 'DATABASE_ERROR', 500, true);
    }

    return data;
  }
}
