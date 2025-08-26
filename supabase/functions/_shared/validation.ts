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
  custom?: (value: any) => boolean | string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export class Validator {
  private schema: ValidationSchema;

  constructor(schema: ValidationSchema) {
    this.schema = schema;
  }

  validate(data: any): any {
    const result: any = {};
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

  private validateField(field: string, value: any, rules: ValidationRule): { value?: any; error?: string } {
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

  private validateType(value: any, type: string): boolean {
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

// Common validation schemas
export const createWalletSchema: ValidationSchema = {
  name: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 100,
  },
  masterSeed: {
    required: true,
    type: 'string',
    minLength: 64,
    maxLength: 512,
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
    minLength: 8,
    maxLength: 128,
  },
};

export const guardianSchema: ValidationSchema = {
  email: {
    required: true,
    type: 'string',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  fullName: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 100,
  },
  phoneNumber: {
    required: false,
    type: 'string',
    pattern: /^\+?[\d\s\-\(\)]+$/,
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
    pattern: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
  },
  amountSatoshis: {
    required: true,
    type: 'number',
    min: 546, // Dust limit
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
    minLength: 1,
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
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Sanitization functions
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

export const sanitizePhoneNumber = (phone: string): string => {
  return phone.replace(/[^\d+\-\(\)\s]/g, '');
};
