// Comprehensive validation schemas and utilities
import { z } from 'zod';
import { InputSanitizer } from './security';

// Base validation schemas
export const emailSchema = z.string()
  .email('Invalid email format')
  .min(5, 'Email must be at least 5 characters')
  .max(254, 'Email must be less than 254 characters')
  .transform(email => InputSanitizer.sanitizeEmail(email));

export const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, 'Password must contain at least one special character');

export const phoneNumberSchema = z.string()
  .regex(/^[+]?[1-9][\d]{0,15}$/, 'Invalid phone number format')
  .transform(phone => InputSanitizer.sanitizePhoneNumber(phone))
  .optional();

export const nameSchema = z.string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z\s\-'.]+$/, 'Name can only contain letters, spaces, hyphens, apostrophes, and periods')
  .transform(name => InputSanitizer.sanitizeString(name));

export const walletNameSchema = z.string()
  .min(3, 'Wallet name must be at least 3 characters')
  .max(50, 'Wallet name must be less than 50 characters')
  .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Wallet name can only contain letters, numbers, spaces, hyphens, and underscores')
  .transform(name => InputSanitizer.sanitizeString(name));

export const bitcoinAddressSchema = z.string()
  .regex(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/, 'Invalid Bitcoin address format');

export const satoshiAmountSchema = z.number()
  .int('Amount must be an integer')
  .min(1, 'Amount must be at least 1 satoshi')
  .max(2100000000000000, 'Amount exceeds maximum Bitcoin supply');

export const derivationPathSchema = z.string()
  .regex(/^m(\/[0-9]+')*(\/[0-9]+)*$/, 'Invalid derivation path format')
  .default("m/44'/0'/0'");

// Guardian validation schemas
export const guardianSchema = z.object({
  email: emailSchema,
  fullName: nameSchema,
  phoneNumber: phoneNumberSchema,
});

export const guardianInvitationSchema = z.object({
  token: z.string().uuid('Invalid invitation token'),
  fullName: nameSchema,
  phoneNumber: phoneNumberSchema,
});

// Wallet validation schemas
export const createWalletSchema = z.object({
  name: walletNameSchema,
  masterSeed: z.string()
    .min(128, 'Master seed must be at least 128 characters')
    .max(512, 'Master seed must be less than 512 characters')
    .regex(/^[a-fA-F0-9]+$/, 'Master seed must be hexadecimal'),
  guardians: z.array(guardianSchema)
    .min(2, 'At least 2 guardians are required')
    .max(10, 'Maximum 10 guardians allowed'),
  thresholdRequirement: z.number()
    .int('Threshold must be an integer')
    .min(2, 'Threshold must be at least 2')
    .max(10, 'Threshold must be at most 10'),
  userPassword: passwordSchema,
}).refine(
  (data) => data.thresholdRequirement <= data.guardians.length,
  {
    message: 'Threshold requirement cannot exceed number of guardians',
    path: ['thresholdRequirement'],
  }
);

export const updateWalletSchema = z.object({
  name: walletNameSchema.optional(),
  status: z.enum(['active', 'locked', 'recovering', 'recovered']).optional(),
});

// Recovery validation schemas
export const initiateRecoverySchema = z.object({
  walletId: z.string().uuid('Invalid wallet ID'),
  reason: z.string()
    .min(10, 'Recovery reason must be at least 10 characters')
    .max(500, 'Recovery reason must be less than 500 characters')
    .transform(reason => InputSanitizer.sanitizeString(reason)),
});

export const approveRecoverySchema = z.object({
  recoveryId: z.string().uuid('Invalid recovery ID'),
  guardianId: z.string().uuid('Invalid guardian ID'),
});

export const signRecoverySchema = z.object({
  recoveryId: z.string().uuid('Invalid recovery ID'),
  guardianId: z.string().uuid('Invalid guardian ID'),
  signature: z.string()
    .min(64, 'Signature must be at least 64 characters')
    .max(512, 'Signature must be less than 512 characters')
    .regex(/^[a-fA-F0-9]+$/, 'Signature must be hexadecimal'),
});

// Bitcoin transaction validation schemas
export const createTransactionSchema = z.object({
  walletId: z.string().uuid('Invalid wallet ID'),
  toAddress: bitcoinAddressSchema,
  amountSatoshis: satoshiAmountSchema,
  feeRate: z.number()
    .min(1, 'Fee rate must be at least 1 sat/byte')
    .max(1000, 'Fee rate must be less than 1000 sat/byte')
    .optional(),
  userPassword: passwordSchema,
});

export const sendTransactionSchema = z.object({
  transactionId: z.string().uuid('Invalid transaction ID'),
  signedTransaction: z.string()
    .min(100, 'Signed transaction must be at least 100 characters')
    .max(10000, 'Signed transaction must be less than 10000 characters')
    .regex(/^[a-fA-F0-9]+$/, 'Signed transaction must be hexadecimal'),
});

// Proof of life validation schemas
export const proofOfLifeSchema = z.object({
  walletId: z.string().uuid('Invalid wallet ID'),
  proofType: z.enum(['manual', 'biometric', 'transaction', 'login']),
  proofData: z.record(z.any()).optional(),
});

// User profile validation schemas
export const userProfileSchema = z.object({
  fullName: nameSchema.optional(),
  phoneNumber: phoneNumberSchema,
  emergencyContactEmail: emailSchema.optional(),
});

export const updatePasswordSchema = z.object({
  currentPassword: passwordSchema,
  newPassword: passwordSchema,
}).refine(
  (data) => data.currentPassword !== data.newPassword,
  {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  }
);

// API request validation schemas
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const searchSchema = z.object({
  query: z.string()
    .min(1, 'Search query cannot be empty')
    .max(100, 'Search query must be less than 100 characters')
    .transform(query => InputSanitizer.sanitizeString(query)),
  filters: z.record(z.any()).optional(),
});

// Validation utility functions
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class Validator {
  constructor(private schema: z.ZodSchema) {}

  validate<T>(data: unknown): T {
    try {
      return this.schema.parse(data) as T;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        throw new ValidationError(
          firstError.message,
          firstError.path.join('.'),
          firstError.code
        );
      }
      throw new ValidationError('Validation failed');
    }
  }

  validateAsync<T>(data: unknown): Promise<T> {
    return this.schema.parseAsync(data) as Promise<T>;
  }

  safeValidate<T>(data: unknown): { success: boolean; data?: T; error?: ValidationError } {
    try {
      const result = this.schema.parse(data) as T;
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        return {
          success: false,
          error: new ValidationError(
            firstError.message,
            firstError.path.join('.'),
            firstError.code
          )
        };
      }
      return {
        success: false,
        error: new ValidationError('Validation failed')
      };
    }
  }
}

// Pre-configured validators
export const validators = {
  email: new Validator(emailSchema),
  password: new Validator(passwordSchema),
  guardian: new Validator(guardianSchema),
  guardianInvitation: new Validator(guardianInvitationSchema),
  createWallet: new Validator(createWalletSchema),
  updateWallet: new Validator(updateWalletSchema),
  initiateRecovery: new Validator(initiateRecoverySchema),
  approveRecovery: new Validator(approveRecoverySchema),
  signRecovery: new Validator(signRecoverySchema),
  createTransaction: new Validator(createTransactionSchema),
  sendTransaction: new Validator(sendTransactionSchema),
  proofOfLife: new Validator(proofOfLifeSchema),
  userProfile: new Validator(userProfileSchema),
  updatePassword: new Validator(updatePasswordSchema),
  pagination: new Validator(paginationSchema),
  search: new Validator(searchSchema),
};

// Utility function for validating request bodies
export function validateRequestBody<T>(schema: z.ZodSchema, body: unknown): T {
  const validator = new Validator(schema);
  return validator.validate<T>(body);
}

// Utility function for validating query parameters
export function validateQueryParams<T>(schema: z.ZodSchema, params: unknown): T {
  const validator = new Validator(schema);
  return validator.validate<T>(params);
}

// Utility function for validating path parameters
export function validatePathParams<T>(schema: z.ZodSchema, params: unknown): T {
  const validator = new Validator(schema);
  return validator.validate<T>(params);
}
