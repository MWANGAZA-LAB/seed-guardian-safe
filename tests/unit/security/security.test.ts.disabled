/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { 
  PasswordValidator, 
  InputSanitizer, 
  RateLimiter, 
  CSRFProtection,
  SensitiveDataHandler,
  SecurityAudit 
} from '@/lib/security';

describe('Security Utilities', () => {
  describe('PasswordValidator', () => {
    it('should validate strong passwords', () => {
      const strongPassword = 'MySecure123!Password';
      const result = PasswordValidator.validate(strongPassword);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.score).toBeGreaterThan(50);
    });

    it('should reject weak passwords', () => {
      const weakPassword = '123';
      const result = PasswordValidator.validate(weakPassword);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(50);
    });

    it('should reject common passwords', () => {
      const commonPassword = 'password123';
      const result = PasswordValidator.validate(commonPassword);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password is too common. Please choose a more unique password');
    });

    it('should reject passwords with sequential characters', () => {
      const sequentialPassword = 'abc123DEF';
      const result = PasswordValidator.validate(sequentialPassword);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password contains sequential characters');
    });

    it('should reject passwords with repeated characters', () => {
      const repeatedPassword = 'aaaBBB111';
      const result = PasswordValidator.validate(repeatedPassword);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password contains too many repeated characters');
    });
  });

  describe('InputSanitizer', () => {
    it('should sanitize malicious HTML', () => {
      const maliciousInput = '<script>alert("xss")</script>Hello World';
      const sanitized = InputSanitizer.sanitizeString(maliciousInput);
      
      expect(sanitized).toBe('Hello World');
      expect(sanitized).not.toContain('<script>');
    });

    it('should sanitize email addresses', () => {
      const email = '  TEST@EXAMPLE.COM  ';
      const sanitized = InputSanitizer.sanitizeEmail(email);
      
      expect(sanitized).toBe('test@example.com');
    });

    it('should sanitize phone numbers', () => {
      const phone = '+1 (555) 123-4567 ext. 890';
      const sanitized = InputSanitizer.sanitizePhoneNumber(phone);
      
      expect(sanitized).toBe('+1 (555) 123-4567 ext. 890');
    });

    it('should sanitize URLs', () => {
      const validUrl = 'https://example.com';
      const sanitized = InputSanitizer.sanitizeUrl(validUrl);
      
      expect(sanitized).toBe(validUrl);
    });

    it('should reject invalid URLs', () => {
      const invalidUrl = 'not-a-url';
      
      expect(() => InputSanitizer.sanitizeUrl(invalidUrl)).toThrow('Invalid URL format');
    });

    it('should sanitize JSON', () => {
      const validJson = '{"name": "John", "age": 30}';
      const sanitized = InputSanitizer.sanitizeJson(validJson);
      
      expect(sanitized).toEqual({ name: 'John', age: 30 });
    });

    it('should reject invalid JSON', () => {
      const invalidJson = '{"name": "John", "age": 30';
      
      expect(() => InputSanitizer.sanitizeJson(invalidJson)).toThrow('Invalid JSON format');
    });
  });

  describe('RateLimiter', () => {
    let rateLimiter: RateLimiter;

    beforeEach(() => {
      rateLimiter = new RateLimiter();
    });

    afterEach(() => {
      rateLimiter.destroy();
    });

    it('should allow requests within limit', () => {
      const identifier = 'test-user';
      
      for (let i = 0; i < 4; i++) {
        const result = rateLimiter.recordAttempt(identifier);
        expect(result.blocked).toBe(false);
        expect(result.remainingAttempts).toBe(4 - i);
      }
    });

    it('should block after exceeding limit', () => {
      const identifier = 'test-user';
      
      // Exceed the limit
      for (let i = 0; i < 6; i++) {
        rateLimiter.recordAttempt(identifier);
      }
      
      expect(rateLimiter.isBlocked(identifier)).toBe(true);
    });

    it('should reset after time window', () => {
      const identifier = 'test-user';
      
      // Exceed the limit
      for (let i = 0; i < 6; i++) {
        rateLimiter.recordAttempt(identifier);
      }
      
      expect(rateLimiter.isBlocked(identifier)).toBe(true);
      
      // Clear attempts
      rateLimiter.clearAttempts(identifier);
      expect(rateLimiter.isBlocked(identifier)).toBe(false);
    });

    it('should provide statistics', () => {
      const identifier = 'test-user';
      rateLimiter.recordAttempt(identifier);
      
      const stats = rateLimiter.getStats();
      expect(stats.totalEntries).toBe(1);
      expect(stats.blockedEntries).toBe(0);
    });
  });

  describe('CSRFProtection', () => {
    it('should generate and validate tokens', () => {
      const sessionId = 'test-session';
      const token = CSRFProtection.generateToken(sessionId);
      
      expect(token).toBeDefined();
      expect(token.length).toBe(64); // 32 bytes = 64 hex chars
      
      expect(CSRFProtection.validateToken(sessionId, token)).toBe(true);
    });

    it('should reject invalid tokens', () => {
      const sessionId = 'test-session';
      const invalidToken = 'invalid-token';
      
      expect(CSRFProtection.validateToken(sessionId, invalidToken)).toBe(false);
    });

    it('should reject tokens for different sessions', () => {
      const sessionId1 = 'session-1';
      const sessionId2 = 'session-2';
      const token = CSRFProtection.generateToken(sessionId1);
      
      expect(CSRFProtection.validateToken(sessionId2, token)).toBe(false);
    });

    it('should clear tokens', () => {
      const sessionId = 'test-session';
      const token = CSRFProtection.generateToken(sessionId);
      
      expect(CSRFProtection.validateToken(sessionId, token)).toBe(true);
      
      CSRFProtection.clearToken(token);
      expect(CSRFProtection.validateToken(sessionId, token)).toBe(false);
    });
  });

  describe('SensitiveDataHandler', () => {
    it('should mask sensitive fields', () => {
      const data = {
        name: 'John Doe',
        password: 'secret123',
        email: 'john@example.com',
        token: 'abc123def456'
      };
      
      const masked = SensitiveDataHandler.maskSensitiveData(data);
      
      expect((masked as any).name).toBe('John Doe');
      expect((masked as any).email).toBe('john@example.com');
      expect((masked as any).password).toMatch(/^\*+$/);
      expect((masked as any).token).toMatch(/^\*+$/);
    });

    it('should identify sensitive fields', () => {
      expect(SensitiveDataHandler.isSensitiveField('password')).toBe(true);
      expect(SensitiveDataHandler.isSensitiveField('secret')).toBe(true);
      expect(SensitiveDataHandler.isSensitiveField('name')).toBe(false);
    });

    it('should handle nested objects', () => {
      const data = {
        user: {
          name: 'John',
          password: 'secret',
          profile: {
            email: 'john@example.com',
            token: 'abc123'
          }
        }
      };
      
      const masked = SensitiveDataHandler.maskSensitiveData(data);
      
      expect((masked as any).user.name).toBe('John');
      expect((masked as any).user.password).toMatch(/^\*+$/);
      expect((masked as any).user.profile.email).toBe('john@example.com');
      expect((masked as any).user.profile.token).toMatch(/^\*+$/);
    });
  });

  describe('SecurityAudit', () => {
    it('should log security events', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      
      SecurityAudit.logSecurityEvent('test_event', { userId: '123' });
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log failed login attempts', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      
      SecurityAudit.logFailedLogin('user@example.com', 'invalid_password');
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log successful logins', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      
      SecurityAudit.logSuccessfulLogin('user@example.com');
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log suspicious activity', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      
      SecurityAudit.logSuspiciousActivity('multiple_failed_attempts', { 
        attempts: 5, 
        ip: '192.168.1.1' 
      });
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
