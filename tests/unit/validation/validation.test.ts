import { describe, it, expect } from '@jest/globals';
import { 
  validators, 
  ValidationError, 
  Validator,
  validateRequestBody,
  validateQueryParams,
  validatePathParams 
} from '@/lib/validation';
import { 
  emailSchema, 
  passwordSchema, 
  guardianSchema, 
  createWalletSchema,
  bitcoinAddressSchema,
  satoshiAmountSchema 
} from '@/lib/validation';

describe('Validation System', () => {
  describe('Email Validation', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ];

      validEmails.forEach(email => {
        const result = validators.email.safeValidate(email);
        expect(result.success).toBe(true);
        expect(result.data).toBe(email.toLowerCase().trim());
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test..test@example.com',
        ''
      ];

      invalidEmails.forEach(email => {
        const result = validators.email.safeValidate(email);
        expect(result.success).toBe(false);
        expect(result.error).toBeInstanceOf(ValidationError);
      });
    });
  });

  describe('Password Validation', () => {
    it('should validate strong passwords', () => {
      const strongPasswords = [
        'MySecure123!Password',
        'ComplexP@ssw0rd2024',
        'Str0ng!P@ssw0rd'
      ];

      strongPasswords.forEach(password => {
        const result = validators.password.safeValidate(password);
        expect(result.success).toBe(true);
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        '123456', // Too short, no uppercase, no special chars
        'password', // No uppercase, no numbers, no special chars
        'PASSWORD123', // No lowercase, no special chars
        'Password123', // No special chars
        'Password!', // No numbers
        'Pass1!', // Too short
        'a'.repeat(129) // Too long
      ];

      weakPasswords.forEach(password => {
        const result = validators.password.safeValidate(password);
        expect(result.success).toBe(false);
        expect(result.error).toBeInstanceOf(ValidationError);
      });
    });
  });

  describe('Guardian Validation', () => {
    it('should validate correct guardian data', () => {
      const validGuardian = {
        email: 'guardian@example.com',
        fullName: 'John Doe',
        phoneNumber: '+1234567890'
      };

      const result = validators.guardian.safeValidate(validGuardian);
      expect(result.success).toBe(true);
      expect(result.data?.email).toBe('guardian@example.com');
      expect(result.data?.fullName).toBe('John Doe');
    });

    it('should reject invalid guardian data', () => {
      const invalidGuardians = [
        {
          email: 'invalid-email',
          fullName: 'John Doe'
        },
        {
          email: 'guardian@example.com',
          fullName: 'J' // Too short
        },
        {
          email: 'guardian@example.com',
          fullName: 'John123' // Contains numbers
        }
      ];

      invalidGuardians.forEach(guardian => {
        const result = validators.guardian.safeValidate(guardian);
        expect(result.success).toBe(false);
        expect(result.error).toBeInstanceOf(ValidationError);
      });
    });
  });

  describe('Wallet Creation Validation', () => {
    it('should validate correct wallet creation data', () => {
      const validWalletData = {
        name: 'My Bitcoin Wallet',
        masterSeed: 'a'.repeat(128), // Valid hex seed
        guardians: [
          {
            email: 'guardian1@example.com',
            fullName: 'Guardian One'
          },
          {
            email: 'guardian2@example.com',
            fullName: 'Guardian Two'
          }
        ],
        thresholdRequirement: 2,
        userPassword: 'MySecure123!Password'
      };

      const result = validators.createWallet.safeValidate(validWalletData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid wallet creation data', () => {
      const invalidWalletData = {
        name: 'My Bitcoin Wallet',
        masterSeed: 'invalid-seed', // Not hex
        guardians: [
          {
            email: 'guardian1@example.com',
            fullName: 'Guardian One'
          }
          // Only one guardian (minimum is 2)
        ],
        thresholdRequirement: 3, // Exceeds number of guardians
        userPassword: 'weak'
      };

      const result = validators.createWallet.safeValidate(invalidWalletData);
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(ValidationError);
    });

    it('should reject too many guardians', () => {
      const tooManyGuardians = Array.from({ length: 11 }, (_, i) => ({
        email: `guardian${i}@example.com`,
        fullName: `Guardian ${i}`
      }));

      const walletData = {
        name: 'My Bitcoin Wallet',
        masterSeed: 'a'.repeat(128),
        guardians: tooManyGuardians,
        thresholdRequirement: 2,
        userPassword: 'MySecure123!Password'
      };

      const result = validators.createWallet.safeValidate(walletData);
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Maximum 10 guardians allowed');
    });
  });

  describe('Bitcoin Address Validation', () => {
    it('should validate correct Bitcoin addresses', () => {
      const validAddresses = [
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Legacy
        '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy', // P2SH
        'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4' // Bech32
      ];

      validAddresses.forEach(address => {
        const result = bitcoinAddressSchema.safeParse(address);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid Bitcoin addresses', () => {
      const invalidAddresses = [
        'invalid-address',
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfN', // Too short
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa1', // Too long
        ''
      ];

      invalidAddresses.forEach(address => {
        const result = bitcoinAddressSchema.safeParse(address);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Satoshi Amount Validation', () => {
    it('should validate correct satoshi amounts', () => {
      const validAmounts = [
        1,
        546, // Dust limit
        1000000, // 0.01 BTC
        2100000000000000 // Max Bitcoin supply
      ];

      validAmounts.forEach(amount => {
        const result = satoshiAmountSchema.safeParse(amount);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid satoshi amounts', () => {
      const invalidAmounts = [
        0, // Too small
        -1, // Negative
        2100000000000001, // Exceeds max supply
        1.5, // Not integer
        NaN,
        Infinity
      ];

      invalidAmounts.forEach(amount => {
        const result = satoshiAmountSchema.safeParse(amount);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Validator Class', () => {
    it('should validate data correctly', () => {
      const validator = new Validator(emailSchema);
      const result = validator.validate('test@example.com');
      expect(result).toBe('test@example.com');
    });

    it('should throw ValidationError for invalid data', () => {
      const validator = new Validator(emailSchema);
      expect(() => validator.validate('invalid-email')).toThrow(ValidationError);
    });

    it('should handle async validation', async () => {
      const validator = new Validator(emailSchema);
      const result = await validator.validateAsync('test@example.com');
      expect(result).toBe('test@example.com');
    });
  });

  describe('Utility Functions', () => {
    it('should validate request body', () => {
      const body = { email: 'test@example.com' };
      const result = validateRequestBody(emailSchema, body);
      expect(result).toBe('test@example.com');
    });

    it('should validate query parameters', () => {
      const params = { page: 1, limit: 20 };
      const result = validateQueryParams(validators.pagination.schema, params);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should validate path parameters', () => {
      const params = { id: '123e4567-e89b-12d3-a456-426614174000' };
      const uuidSchema = validators.createWallet.schema.shape.walletId;
      const result = validatePathParams(uuidSchema, params);
      expect(result).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings', () => {
      const result = validators.email.safeValidate('');
      expect(result.success).toBe(false);
    });

    it('should handle null values', () => {
      const result = validators.email.safeValidate(null);
      expect(result.success).toBe(false);
    });

    it('should handle undefined values', () => {
      const result = validators.email.safeValidate(undefined);
      expect(result.success).toBe(false);
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(1000);
      const result = validators.email.safeValidate(longString);
      expect(result.success).toBe(false);
    });

    it('should handle special characters in names', () => {
      const validNames = [
        "O'Connor",
        'Jean-Pierre',
        'Mary Jane',
        'Dr. Smith'
      ];

      validNames.forEach(name => {
        const result = validators.guardian.safeValidate({
          email: 'test@example.com',
          fullName: name
        });
        expect(result.success).toBe(true);
      });
    });
  });
});
