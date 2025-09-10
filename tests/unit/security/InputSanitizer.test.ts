/* eslint-disable @typescript-eslint/no-explicit-any */
import { InputSanitizer } from '@/lib/security';

describe('InputSanitizer', () => {
  describe('sanitizeString', () => {
    it('should sanitize basic XSS attempts', () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(\'xss\')">',
        'javascript:alert("xss")',
        'onclick="alert(\'xss\')"',
        '<iframe src="javascript:alert(\'xss\')"></iframe>'
      ];

      xssPayloads.forEach(payload => {
        const sanitized = InputSanitizer.sanitizeString(payload);
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('onerror=');
        expect(sanitized).not.toContain('onclick=');
      });
    });

    it('should trim whitespace by default', () => {
      const input = '  test input  ';
      const sanitized = InputSanitizer.sanitizeString(input);
      expect(sanitized).toBe('test input');
    });

    it('should not trim when trim is false', () => {
      const input = '  test input  ';
      const sanitized = InputSanitizer.sanitizeString(input, { trim: false });
      expect(sanitized).toBe('  test input  ');
    });

    it('should limit string length', () => {
      const longInput = 'a'.repeat(2000);
      const sanitized = InputSanitizer.sanitizeString(longInput, { maxLength: 100 });
      expect(sanitized.length).toBe(100);
    });

    it('should remove HTML tags by default', () => {
      const input = '<p>Hello <strong>World</strong></p>';
      const sanitized = InputSanitizer.sanitizeString(input);
      expect(sanitized).toBe('Hello World');
    });

    it('should allow specific HTML tags when configured', () => {
      const input = '<p>Hello <strong>World</strong> <script>alert("xss")</script></p>';
      const sanitized = InputSanitizer.sanitizeString(input, {
        allowHtml: true,
        allowedTags: ['p', 'strong']
      });
      expect(sanitized).toContain('<p>');
      expect(sanitized).toContain('<strong>');
      expect(sanitized).not.toContain('<script>');
    });

    it('should remove control characters', () => {
      const input = 'Hello\x00World\x1F\x7F';
      const sanitized = InputSanitizer.sanitizeString(input);
      expect(sanitized).toBe('HelloWorld');
    });

    it('should normalize unicode', () => {
      const input = 'café\u0301'; // é with combining acute accent
      const sanitized = InputSanitizer.sanitizeString(input);
      expect(sanitized).toBe('café́'); // NFC normalization preserves the combining accent
    });
  });

  describe('sanitizeEmail', () => {
    it('should sanitize and normalize email addresses', () => {
      const testCases = [
        { input: 'TEST@EXAMPLE.COM', expected: 'test@example.com' },
        { input: '  test@example.com  ', expected: 'test@example.com' },
        { input: 'test+tag@example.com', expected: 'test+tag@example.com' }
      ];

      testCases.forEach(({ input, expected }) => {
        const sanitized = InputSanitizer.sanitizeEmail(input);
        expect(sanitized).toBe(expected);
      });
    });

    it('should limit email length', () => {
      const longEmail = 'a'.repeat(300) + '@example.com';
      const sanitized = InputSanitizer.sanitizeEmail(longEmail);
      expect(sanitized.length).toBeLessThanOrEqual(254);
    });
  });

  describe('sanitizePhoneNumber', () => {
    it('should sanitize phone numbers', () => {
      const testCases = [
        { input: '+1 (555) 123-4567', expected: '+1 (555) 123-4567' },
        { input: '555.123.4567', expected: '5551234567' }, // Dots are removed
        { input: '555-123-4567', expected: '555-123-4567' },
        { input: '555 123 4567', expected: '555 123 4567' },
        { input: '5551234567', expected: '5551234567' },
        { input: '+1-555-123-4567 ext 123', expected: '+1-555-123-4567  123' } // "ext" becomes spaces
      ];

      testCases.forEach(({ input, expected }) => {
        const sanitized = InputSanitizer.sanitizePhoneNumber(input);
        expect(sanitized).toBe(expected);
      });
    });

    it('should remove non-phone characters', () => {
      const input = 'Phone: +1 (555) 123-4567 <script>alert("xss")</script>';
      const sanitized = InputSanitizer.sanitizePhoneNumber(input);
      expect(sanitized).toBe('+1 (555) 123-4567 ()'); // Only phone-valid characters remain
      expect(sanitized).not.toContain('<script>');
    });
  });

  describe('sanitizeUrl', () => {
    it('should validate and sanitize URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://example.com/path',
        'https://example.com/path?param=value',
        'https://example.com/path#fragment'
      ];

      validUrls.forEach(url => {
        const sanitized = InputSanitizer.sanitizeUrl(url);
        expect(sanitized).toBe(url);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'http://',
        '://invalid'
      ];

      invalidUrls.forEach(url => {
        expect(() => InputSanitizer.sanitizeUrl(url)).toThrow('Invalid URL format');
      });
    });

    it('should limit URL length', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(3000);
      const sanitized = InputSanitizer.sanitizeUrl(longUrl);
      expect(sanitized.length).toBeLessThanOrEqual(2048);
      expect(sanitized).toContain('https://example.com/');
    });
  });

  describe('sanitizeJson', () => {
    it('should sanitize and parse valid JSON', () => {
      const input = '{"name": "John", "email": "john@example.com"}';
      const sanitized = InputSanitizer.sanitizeJson(input);
      expect(sanitized).toEqual({ name: 'John', email: 'john@example.com' });
    });

    it('should reject invalid JSON', () => {
      const invalidJson = '{"name": "John", "email": "john@example.com"';
      expect(() => InputSanitizer.sanitizeJson(invalidJson)).toThrow('Invalid JSON format');
    });

    it('should sanitize JSON with XSS attempts', () => {
      const maliciousJson = '{"name": "<script>alert(\'xss\')</script>", "email": "john@example.com"}';
      const sanitized = InputSanitizer.sanitizeJson(maliciousJson);
      expect((sanitized as any).name).not.toContain('<script>');
    });
  });

  describe('sanitizeHtml', () => {
    it('should sanitize HTML with DOMPurify on client side', async () => {
      const input = '<p>Hello <strong>World</strong> <script>alert("xss")</script></p>';
      const sanitized = await InputSanitizer.sanitizeHtml(input, {
        allowedTags: ['p', 'strong']
      });
      
      expect(sanitized).toContain('<p>');
      expect(sanitized).toContain('<strong>');
      expect(sanitized).not.toContain('<script>');
    });

    it('should fallback to string sanitization on server side', async () => {
      // Mock window as undefined to simulate server-side environment
      const originalWindow = global.window;
      delete (global as Record<string, unknown>).window;

      const input = '<p>Hello <script>alert("xss")</script></p>';
      const sanitized = await InputSanitizer.sanitizeHtml(input);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Hello');

      // Restore window
      global.window = originalWindow;
    });
  });

  describe('edge cases', () => {
    it('should handle null input', () => {
      expect(() => InputSanitizer.sanitizeString(null as any)).toThrow();
    });

    it('should handle undefined input', () => {
      expect(() => InputSanitizer.sanitizeString(undefined as any)).toThrow();
    });

    it('should handle empty string', () => {
      const sanitized = InputSanitizer.sanitizeString('');
      expect(sanitized).toBe('');
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000);
      const sanitized = InputSanitizer.sanitizeString(longString, { maxLength: 1000 });
      expect(sanitized.length).toBe(1000);
    });
  });
});
