// Comprehensive security utilities for handling sensitive data and security best practices
import { logger } from './logger';

// Security configuration
const SECURITY_CONFIG = {
  // Password requirements
  password: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxLength: 128,
  },
  // Rate limiting
  rateLimit: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 30 * 60 * 1000, // 30 minutes
  },
  // Session security
  session: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: true,
    httpOnly: true,
    sameSite: 'strict' as const,
  },
  // Input sanitization
  sanitization: {
    maxLength: 1000,
    allowedTags: [], // No HTML tags allowed by default
    allowedAttributes: {},
  },
  // CSRF protection
  csrf: {
    tokenLength: 32,
    expiryTime: 24 * 60 * 60 * 1000, // 24 hours
  },
};

// Password strength validator
export class PasswordValidator {
  static validate(password: string): { isValid: boolean; errors: string[]; score: number } {
    const errors: string[] = [];
    let score = 0;

    // Length check
    if (password.length < SECURITY_CONFIG.password.minLength) {
      errors.push(`Password must be at least ${SECURITY_CONFIG.password.minLength} characters long`);
    } else {
      score += Math.min(password.length * 2, 20);
    }

    // Character type checks
    if (SECURITY_CONFIG.password.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else if (/[A-Z]/.test(password)) {
      score += 10;
    }

    if (SECURITY_CONFIG.password.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else if (/[a-z]/.test(password)) {
      score += 10;
    }

    if (SECURITY_CONFIG.password.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    } else if (/\d/.test(password)) {
      score += 10;
    }

    if (SECURITY_CONFIG.password.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 15;
    }

    // Common password check
    if (this.isCommonPassword(password)) {
      errors.push('Password is too common. Please choose a more unique password');
      score -= 20;
    }

    // Sequential character check
    if (this.hasSequentialChars(password)) {
      errors.push('Password contains sequential characters');
      score -= 10;
    }

    // Repeated character check
    if (this.hasRepeatedChars(password)) {
      errors.push('Password contains too many repeated characters');
      score -= 10;
    }

    const isValid = errors.length === 0 && score >= 50;

    return { isValid, errors, score };
  }

  private static isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
      'admin', 'letmein', 'welcome', 'monkey', 'dragon', 'master', 'sunshine',
      'princess', 'qwerty123', 'admin123', 'password1', '12345678', 'baseball',
      'football', 'superman', 'trustno1', 'butterfly', 'dragon123', 'master123'
    ];
    
    return commonPasswords.includes(password.toLowerCase());
  }

  private static hasSequentialChars(password: string): boolean {
    const sequences = ['123', '234', '345', '456', '567', '678', '789', '890',
                      'abc', 'bcd', 'cde', 'def', 'efg', 'fgh', 'ghi', 'hij',
                      'ijk', 'jkl', 'klm', 'lmn', 'mno', 'nop', 'opq', 'pqr',
                      'qrs', 'rst', 'stu', 'tuv', 'uvw', 'vwx', 'wxy', 'xyz'];
    
    const lowerPassword = password.toLowerCase();
    return sequences.some(seq => lowerPassword.includes(seq));
  }

  private static hasRepeatedChars(password: string): boolean {
    const repeatedPattern = /(.)\1{2,}/;
    return repeatedPattern.test(password);
  }
}

// Enhanced input sanitizer with XSS protection
export class InputSanitizer {
  static sanitizeString(input: string, options: {
    maxLength?: number;
    allowHtml?: boolean;
    trim?: boolean;
    allowedTags?: string[];
    allowedAttributes?: string[];
  } = {}): string {
    const { 
      maxLength = SECURITY_CONFIG.sanitization.maxLength, 
      allowHtml = false, 
      trim = true,
      allowedTags = [],
      allowedAttributes = []
    } = options;
    
    let sanitized = input;

    // Trim whitespace
    if (trim) {
      sanitized = sanitized.trim();
    }

    // Limit length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    // Remove HTML tags if not allowed
    if (!allowHtml) {
      sanitized = sanitized.replace(/<[^>]*>/g, '');
    } else if (allowedTags.length > 0) {
      // Allow only specific tags
      const allowedTagsRegex = new RegExp(`<(?!\/?(?:${allowedTags.join('|')})\b)[^>]+>`, 'gi');
      sanitized = sanitized.replace(allowedTagsRegex, '');
    }

    // Remove null bytes and control characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

    // Normalize unicode
    sanitized = sanitized.normalize('NFC');

    // Additional XSS protection
    sanitized = sanitized
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    return sanitized;
  }

  static sanitizeEmail(email: string): string {
    return this.sanitizeString(email.toLowerCase().trim(), { maxLength: 254 });
  }

  static sanitizePhoneNumber(phone: string): string {
    return this.sanitizeString(phone.replace(/[^\d+\-\(\)\s]/g, ''), { maxLength: 20 });
  }

  static sanitizeUrl(url: string): string {
    const sanitized = this.sanitizeString(url, { maxLength: 2048 });
    
    // Basic URL validation
    try {
      new URL(sanitized);
      return sanitized;
    } catch {
      throw new Error('Invalid URL format');
    }
  }

  static sanitizeJson(input: string): any {
    try {
      const sanitized = this.sanitizeString(input, { maxLength: 10000 });
      return JSON.parse(sanitized);
    } catch (error) {
      throw new Error('Invalid JSON format');
    }
  }

  // Enhanced HTML sanitization using DOMPurify
  static sanitizeHtml(html: string, options?: {
    allowedTags?: string[];
    allowedAttributes?: string[];
  }): string {
    if (typeof window !== 'undefined') {
      // Client-side DOMPurify
      const DOMPurify = require('dompurify');
      return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: options?.allowedTags || ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: options?.allowedAttributes || []
      });
    } else {
      // Server-side fallback
      return this.sanitizeString(html, { allowHtml: false });
    }
  }
}

// Rate limiter for security
export class RateLimiter {
  private attempts: Map<string, { count: number; firstAttempt: number; blockedUntil?: number }> = new Map();

  isBlocked(identifier: string): boolean {
    const record = this.attempts.get(identifier);
    if (!record) return false;

    if (record.blockedUntil && Date.now() < record.blockedUntil) {
      return true;
    }

    // Reset if block period has expired
    if (record.blockedUntil && Date.now() >= record.blockedUntil) {
      this.attempts.delete(identifier);
      return false;
    }

    return false;
  }

  recordAttempt(identifier: string): { blocked: boolean; remainingAttempts: number } {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (this.isBlocked(identifier)) {
      return { blocked: true, remainingAttempts: 0 };
    }

    if (!record) {
      this.attempts.set(identifier, { count: 1, firstAttempt: now });
      return { blocked: false, remainingAttempts: SECURITY_CONFIG.rateLimit.maxAttempts - 1 };
    }

    // Check if we're still in the time window
    if (now - record.firstAttempt > SECURITY_CONFIG.rateLimit.windowMs) {
      // Reset if window has expired
      this.attempts.set(identifier, { count: 1, firstAttempt: now });
      return { blocked: false, remainingAttempts: SECURITY_CONFIG.rateLimit.maxAttempts - 1 };
    }

    record.count++;

    if (record.count >= SECURITY_CONFIG.rateLimit.maxAttempts) {
      record.blockedUntil = now + SECURITY_CONFIG.rateLimit.blockDurationMs;
      logger.warn('Rate limit exceeded', { identifier, attempts: record.count });
      return { blocked: true, remainingAttempts: 0 };
    }

    return { blocked: false, remainingAttempts: SECURITY_CONFIG.rateLimit.maxAttempts - record.count };
  }

  clearAttempts(identifier: string): void {
    this.attempts.delete(identifier);
  }

  getAttempts(identifier: string): number {
    const record = this.attempts.get(identifier);
    return record ? record.count : 0;
  }
}

// Enhanced CSRF protection
export class CSRFProtection {
  private static tokens: Map<string, { token: string; expires: number; sessionId: string }> = new Map();

  static generateToken(sessionId: string): string {
    const token = this.generateRandomToken(SECURITY_CONFIG.csrf.tokenLength);
    const expires = Date.now() + SECURITY_CONFIG.csrf.expiryTime;
    
    this.tokens.set(token, { token, expires, sessionId });
    
    // Cleanup expired tokens
    this.cleanup();
    
    return token;
  }

  static validateToken(sessionId: string, token: string): boolean {
    const record = this.tokens.get(token);
    
    if (!record) {
      return false;
    }

    if (Date.now() > record.expires) {
      this.tokens.delete(token);
      return false;
    }

    if (record.sessionId !== sessionId) {
      return false;
    }

    return record.token === token;
  }

  static clearToken(token: string): void {
    this.tokens.delete(token);
  }

  static clearSessionTokens(sessionId: string): void {
    for (const [token, record] of this.tokens.entries()) {
      if (record.sessionId === sessionId) {
        this.tokens.delete(token);
      }
    }
  }

  private static generateRandomToken(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private static cleanup(): void {
    const now = Date.now();
    for (const [token, record] of this.tokens.entries()) {
      if (now > record.expires) {
        this.tokens.delete(token);
      }
    }
  }
}

// Sensitive data handler
export class SensitiveDataHandler {
  private static sensitiveFields = [
    'password', 'token', 'secret', 'key', 'private', 'master', 'seed',
    'mnemonic', 'passphrase', 'credential', 'auth', 'login'
  ];

  static maskSensitiveData(data: any, fieldsToMask: string[] = []): any {
    const fields = [...this.sensitiveFields, ...fieldsToMask];
    
    if (typeof data === 'string') {
      return this.maskString(data);
    }

    if (typeof data === 'object' && data !== null) {
      const masked = Array.isArray(data) ? [] : {};
      
      for (const [key, value] of Object.entries(data)) {
        const isSensitive = fields.some(field => 
          key.toLowerCase().includes(field.toLowerCase())
        );
        
        if (isSensitive && typeof value === 'string') {
          (masked as any)[key] = this.maskString(value);
        } else if (typeof value === 'object' && value !== null) {
          (masked as any)[key] = this.maskSensitiveData(value, fields);
        } else {
          (masked as any)[key] = value;
        }
      }
      
      return masked;
    }

    return data;
  }

  private static maskString(str: string): string {
    if (str.length <= 4) {
      return '*'.repeat(str.length);
    }
    
    const visibleChars = Math.max(2, Math.floor(str.length * 0.2));
    const maskedLength = str.length - visibleChars;
    
    return str.substring(0, visibleChars) + '*'.repeat(maskedLength);
  }

  static isSensitiveField(fieldName: string): boolean {
    return this.sensitiveFields.some(field => 
      fieldName.toLowerCase().includes(field.toLowerCase())
    );
  }

  static secureLog(message: string, data?: any): void {
    const maskedData = data ? this.maskSensitiveData(data) : undefined;
    logger.info(message, maskedData);
  }
}

// Enhanced security headers utility
export class SecurityHeaders {
  static getDefaultHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': this.getCSP(),
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'same-origin'
    };
  }

  private static getCSP(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https: wss:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests"
    ].join('; ');
  }
}

// Security audit logger
export class SecurityAudit {
  static logSecurityEvent(event: string, details: Record<string, any> = {}): void {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      event,
      details: SensitiveDataHandler.maskSensitiveData(details),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      ip: 'client-ip', // Would be set by server middleware
    };

    logger.info('Security audit event', auditEntry);
  }

  static logFailedLogin(identifier: string, reason: string): void {
    this.logSecurityEvent('failed_login', { identifier, reason });
  }

  static logSuccessfulLogin(identifier: string): void {
    this.logSecurityEvent('successful_login', { identifier });
  }

  static logPasswordChange(userId: string): void {
    this.logSecurityEvent('password_changed', { userId });
  }

  static logSuspiciousActivity(activity: string, details: Record<string, any>): void {
    this.logSecurityEvent('suspicious_activity', { activity, ...details });
  }

  static logXSSAttempt(payload: string, source: string): void {
    this.logSecurityEvent('xss_attempt', { payload, source });
  }

  static logCSRFAttempt(token: string, sessionId: string): void {
    this.logSecurityEvent('csrf_attempt', { token: '***', sessionId: '***' });
  }
}

// Export security utilities
export const security = {
  password: PasswordValidator,
  sanitizer: InputSanitizer,
  rateLimiter: RateLimiter,
  sensitiveData: SensitiveDataHandler,
  csrf: CSRFProtection,
  headers: SecurityHeaders,
  audit: SecurityAudit,
};
