/**
 * Seed Guardian Safe Protocol - Core Types
 * 
 * This file defines the core types for the trust-first, protocol-style architecture.
 * All cryptography happens client-side, server is just a dumb storage/relay layer.
 */

// Core Protocol Version
export const PROTOCOL_VERSION = '1.0.0';

// Event Types for Audit Log Protocol
export type AuditEventType = 
  | 'wallet_created'
  | 'guardian_added'
  | 'guardian_verified'
  | 'guardian_removed'
  | 'recovery_initiated'
  | 'recovery_signed'
  | 'recovery_completed'
  | 'recovery_cancelled'
  | 'proof_of_life'
  | 'wallet_accessed'
  | 'transaction_created'
  | 'policy_updated';

// Cryptographic Key Types
export interface KeyPair {
  publicKey: string;
  privateKey: string;
  keyId: string;
  algorithm: 'RSA-OAEP' | 'PGP' | 'Ed25519';
  keySize: number;
  createdAt: string;
  expiresAt?: string;
}

// Guardian Share Structure
export interface GuardianShare {
  shareIndex: number;
  encryptedShare: string; // Encrypted with guardian's public key
  guardianPublicKey: string;
  guardianId: string;
  createdAt: string;
  metadata: {
    encryptionAlgorithm: string;
    keySize: number;
    shareHash: string; // Hash of the encrypted share for verification
  };
}

// Wallet Policy Configuration
export interface WalletPolicy {
  walletId: string;
  ownerId: string;
  threshold: number; // Minimum guardians required for recovery
  totalGuardians: number;
  recoveryTimeout: number; // Hours before recovery expires
  proofOfLifeInterval: number; // Days between proof of life checks
  allowedRecoveryReasons: string[];
  createdAt: string;
  updatedAt: string;
}

// Guardian Information
export interface Guardian {
  id: string;
  walletId: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  publicKey: string;
  keyId: string;
  status: 'invited' | 'verified' | 'active' | 'revoked';
  shareIndex: number;
  verificationLevel: 'basic' | 'enhanced' | 'hardware';
  createdAt: string;
  verifiedAt?: string;
  lastProofOfLife?: string;
  metadata: {
    deviceFingerprint?: string;
    location?: string;
    ipAddress?: string;
  };
}

// Recovery Attempt
export interface RecoveryAttempt {
  id: string;
  walletId: string;
  initiatedBy: string; // Guardian ID who initiated
  reason: string;
  newOwnerEmail?: string;
  status: 'pending' | 'collecting_signatures' | 'completed' | 'expired' | 'cancelled';
  requiredSignatures: number;
  currentSignatures: number;
  guardianSignatures: GuardianSignature[];
  expiresAt: string;
  createdAt: string;
  completedAt?: string;
  metadata: {
    ipAddress: string;
    userAgent: string;
    location?: string;
  };
}

// Guardian Signature for Recovery
export interface GuardianSignature {
  guardianId: string;
  signature: string; // Cryptographic signature
  signedAt: string;
  verificationMethod: 'email' | 'sms' | 'hardware' | 'biometric';
  proof: string; // Additional proof of identity
  metadata: {
    ipAddress: string;
    deviceFingerprint?: string;
    location?: string;
  };
}

// Audit Log Entry (JSON-based Protocol)
export interface AuditLogEntry {
  id: string;
  eventType: AuditEventType;
  walletId: string;
  actorId: string; // User or Guardian ID
  timestamp: string;
  data: Record<string, unknown>;
  signature: string; // Signed by actor's private key
  previousHash: string; // Hash of previous entry (hash chain)
  merkleRoot?: string; // Merkle tree root for batch verification
  metadata: {
    version: string;
    clientType: 'web' | 'cli' | 'desktop';
    clientVersion: string;
    ipAddress?: string;
    userAgent?: string;
  };
}

// Client-Side Wallet State
export interface ClientWallet {
  id: string;
  name: string;
  masterSeed: string; // Only exists client-side, never sent to server
  policy: WalletPolicy;
  guardians: Guardian[];
  addresses: WalletAddress[];
  recoveryAttempts: RecoveryAttempt[];
  auditLog: AuditLogEntry[];
  createdAt: string;
  lastAccessed: string;
  metadata: {
    derivationPath: string;
    network: 'mainnet' | 'testnet' | 'regtest';
    walletType: 'inheritance' | 'recovery';
  };
}

// Bitcoin Address Information
export interface WalletAddress {
  address: string;
  derivationPath: string;
  addressType: 'p2pkh' | 'p2sh' | 'p2wpkh' | 'p2wsh' | 'p2tr';
  balance: number; // Satoshis
  lastUsed: string;
  label?: string;
}

// Protocol Configuration
export interface ProtocolConfig {
  version: string;
  supportedAlgorithms: {
    shamir: string[];
    encryption: string[];
    signing: string[];
    hashing: string[];
  };
  defaultSettings: {
    threshold: number;
    maxGuardians: number;
    recoveryTimeout: number;
    proofOfLifeInterval: number;
  };
  networkSettings: {
    mainnet: NetworkConfig;
    testnet: NetworkConfig;
    regtest: NetworkConfig;
  };
}

// Network Configuration
export interface NetworkConfig {
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  defaultFeeRate: number;
  minConfirmations: number;
}

// Error Types
export class ProtocolError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ProtocolError';
  }
}

export class CryptoError extends ProtocolError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CRYPTO_ERROR', context);
    this.name = 'CryptoError';
  }
}

export class ValidationError extends ProtocolError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', context);
    this.name = 'ValidationError';
  }
}

export class GuardianError extends ProtocolError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'GUARDIAN_ERROR', context);
    this.name = 'GuardianError';
  }
}

// Protocol Response Types
export interface ProtocolResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    context?: Record<string, unknown>;
  };
  metadata: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

// Storage Layer Types (Server-side)
export interface StorageEntry {
  id: string;
  type: 'encrypted_share' | 'guardian_info' | 'recovery_attempt' | 'audit_log';
  data: string; // Encrypted or signed data
  ownerId: string;
  guardianId?: string;
  walletId: string;
  createdAt: string;
  updatedAt: string;
  metadata: {
    encryptionKey?: string;
    signature?: string;
    hash?: string;
  };
}

// Guardian Verification Methods
export interface VerificationMethod {
  type: 'email' | 'sms' | 'hardware' | 'biometric' | 'social';
  value: string;
  verified: boolean;
  verifiedAt?: string;
  metadata: Record<string, unknown>;
}

// Proof of Life
export interface ProofOfLife {
  id: string;
  walletId: string;
  guardianId: string;
  proofType: 'biometric' | 'behavioral' | 'manual' | 'hardware';
  proofData: string; // Encrypted proof data
  timestamp: string;
  verified: boolean;
  metadata: {
    deviceFingerprint?: string;
    location?: string;
    ipAddress?: string;
  };
}
