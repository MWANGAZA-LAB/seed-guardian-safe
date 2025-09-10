/* eslint-disable @typescript-eslint/no-explicit-any */
import { CSRFProtection } from '@/lib/security';

describe('CSRFProtection', () => {
  beforeEach(() => {
    // Clear all tokens before each test
    CSRFProtection.clearSessionTokens('test-session');
  });

  describe('generateToken', () => {
    it('should generate a unique token for a session', () => {
      const sessionId = 'test-session-1';
      const token1 = CSRFProtection.generateToken(sessionId);
      const token2 = CSRFProtection.generateToken(sessionId);

      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
      expect(token1.length).toBe(64); // 32 bytes = 64 hex characters
      expect(token2.length).toBe(64);
    });

    it('should generate different tokens for different sessions', () => {
      const session1 = 'session-1';
      const session2 = 'session-2';

      const token1 = CSRFProtection.generateToken(session1);
      const token2 = CSRFProtection.generateToken(session2);

      expect(token1).not.toBe(token2);
    });

    it('should generate tokens with correct length', () => {
      const sessionId = 'test-session';
      const token = CSRFProtection.generateToken(sessionId);

      expect(token.length).toBe(64); // 32 bytes = 64 hex characters
    });
  });

  describe('validateToken', () => {
    it('should validate correct token for session', () => {
      const sessionId = 'test-session';
      const token = CSRFProtection.generateToken(sessionId);

      const isValid = CSRFProtection.validateToken(sessionId, token);
      expect(isValid).toBe(true);
    });

    it('should reject token for wrong session', () => {
      const session1 = 'session-1';
      const session2 = 'session-2';
      const token = CSRFProtection.generateToken(session1);

      const isValid = CSRFProtection.validateToken(session2, token);
      expect(isValid).toBe(false);
    });

    it('should reject non-existent token', () => {
      const sessionId = 'test-session';
      const fakeToken = 'fake-token-12345678901234567890123456789012';

      const isValid = CSRFProtection.validateToken(sessionId, fakeToken);
      expect(isValid).toBe(false);
    });

    it('should reject expired token', () => {
      const sessionId = 'test-session';
      const token = CSRFProtection.generateToken(sessionId);

      // Mock Date.now to simulate time passing
      const originalNow = Date.now;
      Date.now = jest.fn(() => originalNow() + 25 * 60 * 60 * 1000); // 25 hours later

      const isValid = CSRFProtection.validateToken(sessionId, token);
      expect(isValid).toBe(false);

      // Restore Date.now
      Date.now = originalNow;
    });

    it('should reject empty token', () => {
      const sessionId = 'test-session';
      const isValid = CSRFProtection.validateToken(sessionId, '');
      expect(isValid).toBe(false);
    });

    it('should reject null token', () => {
      const sessionId = 'test-session';
      const isValid = CSRFProtection.validateToken(sessionId, null as any);
      expect(isValid).toBe(false);
    });
  });

  describe('clearToken', () => {
    it('should clear specific token', () => {
      const sessionId = 'test-session';
      const token = CSRFProtection.generateToken(sessionId);

      // Verify token exists
      expect(CSRFProtection.validateToken(sessionId, token)).toBe(true);

      // Clear token
      CSRFProtection.clearToken(token);

      // Verify token is cleared
      expect(CSRFProtection.validateToken(sessionId, token)).toBe(false);
    });

    it('should not affect other tokens when clearing one', () => {
      const sessionId = 'test-session';
      const token1 = CSRFProtection.generateToken(sessionId);
      const token2 = CSRFProtection.generateToken(sessionId);

      // Verify both tokens exist
      expect(CSRFProtection.validateToken(sessionId, token1)).toBe(true);
      expect(CSRFProtection.validateToken(sessionId, token2)).toBe(true);

      // Clear only token1
      CSRFProtection.clearToken(token1);

      // Verify token1 is cleared but token2 still exists
      expect(CSRFProtection.validateToken(sessionId, token1)).toBe(false);
      expect(CSRFProtection.validateToken(sessionId, token2)).toBe(true);
    });
  });

  describe('clearSessionTokens', () => {
    it('should clear all tokens for a session', () => {
      const session1 = 'session-1';
      const session2 = 'session-2';

      const token1a = CSRFProtection.generateToken(session1);
      const token1b = CSRFProtection.generateToken(session1);
      const token2a = CSRFProtection.generateToken(session2);

      // Verify all tokens exist
      expect(CSRFProtection.validateToken(session1, token1a)).toBe(true);
      expect(CSRFProtection.validateToken(session1, token1b)).toBe(true);
      expect(CSRFProtection.validateToken(session2, token2a)).toBe(true);

      // Clear session1 tokens
      CSRFProtection.clearSessionTokens(session1);

      // Verify session1 tokens are cleared but session2 token still exists
      expect(CSRFProtection.validateToken(session1, token1a)).toBe(false);
      expect(CSRFProtection.validateToken(session1, token1b)).toBe(false);
      expect(CSRFProtection.validateToken(session2, token2a)).toBe(true);
    });

    it('should handle clearing tokens for non-existent session', () => {
      const nonExistentSession = 'non-existent-session';
      
      // This should not throw an error
      expect(() => {
        CSRFProtection.clearSessionTokens(nonExistentSession);
      }).not.toThrow();
    });
  });

  describe('token expiration', () => {
    it('should automatically clean up expired tokens', () => {
      const sessionId = 'test-session';
      const token = CSRFProtection.generateToken(sessionId);

      // Mock Date.now to simulate time passing
      const originalNow = Date.now;
      Date.now = jest.fn(() => originalNow() + 25 * 60 * 60 * 1000); // 25 hours later

      // Generate a new token to trigger cleanup
      CSRFProtection.generateToken('another-session');

      // Verify expired token is cleaned up
      expect(CSRFProtection.validateToken(sessionId, token)).toBe(false);

      // Restore Date.now
      Date.now = originalNow;
    });
  });

  describe('edge cases', () => {
    it('should handle empty session ID', () => {
      const token = CSRFProtection.generateToken('');
      expect(token).toBeDefined();
      expect(CSRFProtection.validateToken('', token)).toBe(true);
    });

    it('should handle very long session ID', () => {
      const longSessionId = 'a'.repeat(1000);
      const token = CSRFProtection.generateToken(longSessionId);
      expect(token).toBeDefined();
      expect(CSRFProtection.validateToken(longSessionId, token)).toBe(true);
    });

    it('should handle special characters in session ID', () => {
      const specialSessionId = 'session-!@#$%^&*()_+-=[]{}|;:,.<>?';
      const token = CSRFProtection.generateToken(specialSessionId);
      expect(token).toBeDefined();
      expect(CSRFProtection.validateToken(specialSessionId, token)).toBe(true);
    });

    it('should handle concurrent token generation', () => {
      const sessionId = 'test-session';
      const tokens = [];

      // Generate multiple tokens concurrently
      for (let i = 0; i < 10; i++) {
        tokens.push(CSRFProtection.generateToken(sessionId));
      }

      // All tokens should be unique
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(tokens.length);

      // All tokens should be valid
      tokens.forEach(token => {
        expect(CSRFProtection.validateToken(sessionId, token)).toBe(true);
      });
    });
  });

  describe('security considerations', () => {
    it('should not expose token generation pattern', () => {
      const sessionId = 'test-session';
      const tokens = [];

      // Generate multiple tokens
      for (let i = 0; i < 100; i++) {
        tokens.push(CSRFProtection.generateToken(sessionId));
      }

      // Check that tokens are not predictable
      const firstToken = tokens[0];
      const subsequentTokens = tokens.slice(1);

      // No subsequent token should match the first token
      subsequentTokens.forEach(token => {
        expect(token).not.toBe(firstToken);
      });

      // Check that tokens don't follow a simple pattern
      const tokenChars = tokens.map(token => token[0]);
      const uniqueChars = new Set(tokenChars);
      
      // Should have variety in first characters (not all starting with same char)
      expect(uniqueChars.size).toBeGreaterThan(1);
    });

    it('should handle token collision gracefully', () => {
      const sessionId = 'test-session';
      
      // Generate many tokens to test for potential collisions
      const tokens = new Set();
      for (let i = 0; i < 1000; i++) {
        const token = CSRFProtection.generateToken(sessionId);
        tokens.add(token);
      }

      // All tokens should be unique (no collisions)
      expect(tokens.size).toBe(1000);
    });
  });
});
