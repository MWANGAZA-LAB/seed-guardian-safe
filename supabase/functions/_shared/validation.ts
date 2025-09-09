// Centralized validation system for Edge Functions
import { ValidationError } from './errors.ts';

export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: string[];
  custom?: (value: unknown) => boolean | string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export class Validator {
  private schema: ValidationSchema;

  constructor(schema: ValidationSchema) {
    this.schema = schema;
  }

  validate(data: unknown): unknown {
    const result: Record<string, unknown> = {};
    const errors: string[] = [];

    for (const [field, rules] of Object.entries(this.schema)) {
      const value = data[field];
      const validationResult = this.validateField(field, value, rules);
      
      if (validationResult.error) {
        errors.push(validationResult.error);
      } else if (validationResult.value !== undefined) {
        result[field] = validationResult.value;
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join('; '));
    }

    return result;
  }

  private validateField(field: string, value: unknown, rules: ValidationRule): { value?: unknown; error?: string } {
    // Check if required
    if (rules.required && (value === undefined || value === null || value === '')) {
      return { error: `${field} is required` };
    }

    // Skip validation if value is not provided and not required
    if (value === undefined || value === null) {
      return {};
    }

    // Type validation
    if (rules.type && !this.validateType(value, rules.type)) {
      return { error: `${field} must be of type ${rules.type}` };
    }

    // String validations
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        return { error: `${field} must be at least ${rules.minLength} characters long` };
      }
      
      if (rules.maxLength && value.length > rules.maxLength) {
        return { error: `${field} must be no more than ${rules.maxLength} characters long` };
      }
      
      if (rules.pattern && !rules.pattern.test(value)) {
        return { error: `${field} format is invalid` };
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        return { error: `${field} must be at least ${rules.min}` };
      }
      
      if (rules.max !== undefined && value > rules.max) {
        return { error: `${field} must be no more than ${rules.max}` };
      }
    }

    // Array validations
    if (Array.isArray(value)) {
      if (rules.minLength && value.length < rules.minLength) {
        return { error: `${field} must have at least ${rules.minLength} items` };
      }
      
      if (rules.maxLength && value.length > rules.maxLength) {
        return { error: `${field} must have no more than ${rules.maxLength} items` };
      }
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      return { error: `${field} must be one of: ${rules.enum.join(', ')}` };
    }

    // Custom validation
    if (rules.custom) {
      const customResult = rules.custom(value);
      if (customResult !== true) {
        return { error: typeof customResult === 'string' ? customResult : `${field} validation failed` };
      }
    }

    return { value };
  }

  private validateType(value: unknown, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return true;
    }
  }
}

// Enhanced validation schemas
export const createWalletSchema: ValidationSchema = {
  name: {
    required: true,
    type: 'string',
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9\s\-_]+$/,
  },
  masterSeed: {
    required: true,
    type: 'string',
    minLength: 128,
    maxLength: 512,
    pattern: /^[a-fA-F0-9]+$/,
  },
  guardians: {
    required: true,
    type: 'array',
    minLength: 2,
    maxLength: 10,
  },
  thresholdRequirement: {
    required: true,
    type: 'number',
    min: 2,
    max: 10,
  },
  userPassword: {
    required: true,
    type: 'string',
    minLength: 12,
    maxLength: 128,
    custom: (password: string) => {
      const hasUpper = /[A-Z]/.test(password);
      const hasLower = /[a-z]/.test(password);
      const hasNumber = /\d/.test(password);
      const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
      
      if (!hasUpper) return 'Password must contain at least one uppercase letter';
      if (!hasLower) return 'Password must contain at least one lowercase letter';
      if (!hasNumber) return 'Password must contain at least one number';
      if (!hasSpecial) return 'Password must contain at least one special character';
      
      return true;
    },
  },
};

export const guardianSchema: ValidationSchema = {
  email: {
    required: true,
    type: 'string',
    minLength: 5,
    maxLength: 254,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  fullName: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s\-'.]+$/,
  },
  phoneNumber: {
    required: false,
    type: 'string',
    pattern: /^[+]?[1-9][\d]{0,15}$/,
  },
};

export const recoveryRequestSchema: ValidationSchema = {
  walletId: {
    required: true,
    type: 'string',
    pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  },
  reason: {
    required: true,
    type: 'string',
    minLength: 10,
    maxLength: 500,
  },
};

export const transactionSchema: ValidationSchema = {
  walletId: {
    required: true,
    type: 'string',
    pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  },
  toAddress: {
    required: true,
    type: 'string',
    pattern: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/,
  },
  amountSatoshis: {
    required: true,
    type: 'number',
    min: 546, // Dust limit
    max: 2100000000000000, // Max Bitcoin supply
  },
  feeRate: {
    required: false,
    type: 'number',
    min: 1,
    max: 1000,
  },
  userPassword: {
    required: true,
    type: 'string',
    minLength: 12,
    maxLength: 128,
  },
};

// Utility functions for common validations
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateBitcoinAddress = (address: string): boolean => {
  const addressRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  return addressRegex.test(address);
};

export const validateUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const validatePassword = (password: string): boolean => {
  // At least 12 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const hasMinLength = password.length >= 12;
  
  return hasUpper && hasLower && hasNumber && hasSpecial && hasMinLength;
};

// Sanitization functions
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

export const sanitizePhoneNumber = (phone: string): string => {
  return phone.replace(/[^\d+\-()\s]/g, '');
};
