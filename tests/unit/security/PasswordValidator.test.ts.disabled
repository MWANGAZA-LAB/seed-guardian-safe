/* eslint-disable @typescript-eslint/no-explicit-any */
import { PasswordValidator } from '@/lib/security';

describe('PasswordValidator', () => {
  describe('validate', () => {
    const testCases = [
      {
        name: 'should reject passwords shorter than 12 characters',
        password: 'short',
        expected: { 
          isValid: false, 
          errors: ['Password must be at least 12 characters long'],
          score: 0
        }
      },
      {
        name: 'should reject passwords without uppercase letters',
        password: 'password123!',
        expected: { 
          isValid: false, 
          errors: ['Password must contain at least one uppercase letter'],
          score: 0
        }
      },
      {
        name: 'should reject passwords without lowercase letters',
        password: 'PASSWORD123!',
        expected: { 
          isValid: false, 
          errors: ['Password must contain at least one lowercase letter'],
          score: 0
        }
      },
      {
        name: 'should reject passwords without numbers',
        password: 'MySecurePass!',
        expected: { 
          isValid: false, 
          errors: ['Password must contain at least one number'],
          score: 0
        }
      },
      {
        name: 'should reject passwords without special characters',
        password: 'MySecurePass123',
        expected: { 
          isValid: false, 
          errors: ['Password must contain at least one special character'],
          score: 0
        }
      },
      {
        name: 'should reject common passwords',
        password: 'password123',
        expected: { 
          isValid: false, 
          errors: ['Password is too common. Please choose a more unique password'],
          score: 0
        }
      },
      {
        name: 'should reject passwords with sequential characters',
        password: 'MySecurePass123abc',
        expected: { 
          isValid: false, 
          errors: ['Password contains sequential characters'],
          score: 0
        }
      },
      {
        name: 'should reject passwords with repeated characters',
        password: 'MySecurePass123!!!',
        expected: { 
          isValid: false, 
          errors: ['Password contains too many repeated characters'],
          score: 0
        }
      },
      {
        name: 'should accept strong passwords',
        password: 'MySecurePass123!',
        expected: { 
          isValid: true, 
          errors: [],
          score: expect.any(Number)
        }
      },
      {
        name: 'should accept very long strong passwords',
        password: 'MyVeryLongSecurePassword123!@#$%^&*()',
        expected: { 
          isValid: true, 
          errors: [],
          score: expect.any(Number)
        }
      }
    ];

    testCases.forEach(({ name, password, expected }) => {
      it(name, () => {
        const result = PasswordValidator.validate(password);
        
        expect(result.isValid).toBe(expected.isValid);
        expect(result.errors).toEqual(expected.errors);
        
        if (expected.isValid) {
          expect(result.score).toBeGreaterThan(50);
        } else {
          expect(result.score).toBeLessThan(50);
        }
      });
    });

    it('should calculate score correctly for valid passwords', () => {
      const result = PasswordValidator.validate('MySecurePass123!');
      
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(50);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should handle multiple validation errors', () => {
      const result = PasswordValidator.validate('weak');
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('Password must be at least 12 characters long');
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      const result = PasswordValidator.validate('');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 12 characters long');
    });

    it('should handle null input', () => {
      expect(() => PasswordValidator.validate(null as any)).toThrow();
    });

    it('should handle undefined input', () => {
      expect(() => PasswordValidator.validate(undefined as any)).toThrow();
    });

    it('should handle very long passwords', () => {
      const longPassword = 'A'.repeat(200) + 'a'.repeat(200) + '1'.repeat(200) + '!'.repeat(200);
      const result = PasswordValidator.validate(longPassword);
      
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(50);
    });
  });

  describe('score calculation', () => {
    it('should give higher scores for longer passwords', () => {
      const shortResult = PasswordValidator.validate('MySecurePass123!');
      const longResult = PasswordValidator.validate('MyVeryLongSecurePassword123!@#$%^&*()');
      
      expect(longResult.score).toBeGreaterThan(shortResult.score);
    });

    it('should penalize common passwords', () => {
      const commonResult = PasswordValidator.validate('password123');
      const uniqueResult = PasswordValidator.validate('MySecurePass123!');
      
      expect(commonResult.score).toBeLessThan(uniqueResult.score);
    });

    it('should penalize sequential characters', () => {
      const sequentialResult = PasswordValidator.validate('MySecurePass123abc');
      const nonSequentialResult = PasswordValidator.validate('MySecurePass123!');
      
      expect(sequentialResult.score).toBeLessThan(nonSequentialResult.score);
    });
  });
});
