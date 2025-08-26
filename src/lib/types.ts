// Comprehensive type definitions for the Seed Guardian Safe application

// ============================================================================
// CORE TYPES
// ============================================================================

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    statusCode: number;
    context?: Record<string, unknown>;
  };
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ErrorInfo {
  componentStack: string;
  timestamp?: string;
}

export interface AppErrorData {
  message: string;
  code: string;
  statusCode: number;
  isOperational: boolean;
  context?: Record<string, unknown>;
}

export interface ValidationErrorData {
  field: string;
  value: unknown;
  message: string;
  rule: string;
}

// ============================================================================
// SECURITY TYPES
// ============================================================================

export interface SecurityConfig {
  password: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    maxLength: number;
  };
  rateLimit: {
    maxAttempts: number;
    windowMs: number;
    blockDurationMs: number;
  };
  session: {
    maxAge: number;
    secure: boolean;
    httpOnly: boolean;
    sameSite: 'strict' | 'lax' | 'none';
  };
  sanitization: {
    maxLength: number;
    allowedTags: string[];
    allowedAttributes: Record<string, string[]>;
  };
  csrf: {
    tokenLength: number;
    expiryTime: number;
  };
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  score: number;
}

export interface SanitizationOptions {
  maxLength?: number;
  allowHtml?: boolean;
  trim?: boolean;
  allowedTags?: string[];
  allowedAttributes?: string[];
}

export interface RateLimitResult {
  blocked: boolean;
  remainingAttempts: number;
}

export interface CSRFToken {
  token: string;
  expires: number;
  sessionId: string;
}

// ============================================================================
// WALLET TYPES
// ============================================================================

export interface Wallet extends BaseEntity {
  name: string;
  owner_id: string;
  threshold_requirement: number;
  total_guardians: number;
  status: 'active' | 'inactive' | 'recovery';
}

export interface Guardian extends BaseEntity {
  wallet_id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  share_index: number;
  status: 'pending' | 'verified' | 'active';
  invitation_token?: string;
  invitation_expires_at?: string;
}

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

// ============================================================================
// RECOVERY TYPES
// ============================================================================

export interface RecoveryRequest extends BaseEntity {
  wallet_id: string;
  initiator_id: string;
  reason: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  required_approvals: number;
  current_approvals: number;
}

export interface InitiateRecoveryRequest {
  walletId: string;
  reason: string;
}

export interface InitiateRecoveryResponse {
  success: boolean;
  recoveryId: string;
  message: string;
}

// ============================================================================
// BITCOIN TYPES
// ============================================================================

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

// ============================================================================
// API SERVICE TYPES
// ============================================================================

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface RequestConfig {
  method: HttpMethod;
  url: string;
  data?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
  retryAttempts?: number;
  requireCSRF?: boolean;
}

export interface SupabaseRequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  requireCSRF?: boolean;
}

// ============================================================================
// PERFORMANCE TYPES
// ============================================================================

export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface PerformanceConfig {
  enableMetrics: boolean;
  enableProfiling: boolean;
  thresholdMs: number;
  sampleRate: number;
}

// ============================================================================
// MONITORING TYPES
// ============================================================================

export interface SystemMetrics {
  cpu: {
    usage: number;
    load: number[];
  };
  memory: {
    used: number;
    total: number;
    free: number;
  };
  disk: {
    used: number;
    total: number;
    free: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    connections: number;
  };
}

export interface ApplicationMetrics {
  requests: {
    total: number;
    success: number;
    error: number;
    averageResponseTime: number;
  };
  database: {
    queries: number;
    slowQueries: number;
    averageQueryTime: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
  };
}

export interface AlertConfig {
  type: 'email' | 'slack' | 'pagerduty';
  recipients: string[];
  conditions: {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    threshold: number;
    duration: number;
  }[];
}

// ============================================================================
// DATABASE TYPES
// ============================================================================

export interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: string;
  parameters?: unknown[];
  cached: boolean;
}

export interface DatabaseConfig {
  connectionPool: {
    min: number;
    max: number;
    idleTimeout: number;
  };
  queryTimeout: number;
  enableQueryLogging: boolean;
  enableSlowQueryLogging: boolean;
  slowQueryThreshold: number;
}

// ============================================================================
// LOGGING TYPES
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error;
  metadata?: Record<string, unknown>;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableRemote: boolean;
  format: 'json' | 'text';
  maxFileSize: number;
  maxFiles: number;
}

// ============================================================================
// ENVIRONMENT TYPES
// ============================================================================

export interface EnvironmentConfig {
  nodeEnv: 'development' | 'production' | 'test';
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
  port: number;
  host: string;
  baseUrl: string;
  apiUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceKey: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type NonNullableFields<T, K extends keyof T> = T & {
  [P in K]: NonNullable<T[P]>;
};

// ============================================================================
// REACT COMPONENT TYPES
// ============================================================================

export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
  id?: string;
  'data-testid'?: string;
}

export interface FormFieldProps {
  name: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
}

export interface ButtonProps extends ComponentProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationRule {
  type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: unknown;
  message: string;
  validator?: (value: unknown) => boolean | string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationErrorData[];
}

export interface ValidationSchema {
  [field: string]: ValidationRule[];
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export type {
  BaseEntity,
  ApiResponse,
  ApiErrorResponse,
  ErrorInfo,
  AppErrorData,
  ValidationErrorData,
  SecurityConfig,
  PasswordValidationResult,
  SanitizationOptions,
  RateLimitResult,
  CSRFToken,
  Wallet,
  Guardian,
  CreateWalletRequest,
  CreateWalletResponse,
  RecoveryRequest,
  InitiateRecoveryRequest,
  InitiateRecoveryResponse,
  BitcoinTransaction,
  CreateTransactionRequest,
  CreateTransactionResponse,
  HttpMethod,
  RequestConfig,
  SupabaseRequestOptions,
  PerformanceMetric,
  PerformanceConfig,
  SystemMetrics,
  ApplicationMetrics,
  AlertConfig,
  QueryMetrics,
  DatabaseConfig,
  LogLevel,
  LogEntry,
  LoggerConfig,
  EnvironmentConfig,
  ComponentProps,
  FormFieldProps,
  ButtonProps,
  ValidationRule,
  ValidationResult,
  ValidationSchema,
};
