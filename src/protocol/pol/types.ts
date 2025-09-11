/**
 * Proof of Life (PoL) Protocol Types
 * 
 * This module defines the core types and interfaces for the Proof of Life
 * security layer in the Seed Guardian Safe protocol.
 */

export interface PoLKeyPair {
  publicKey: string; // Base64 encoded public key
  privateKey: string; // Base64 encoded private key (never leaves client)
  keyId: string; // Unique identifier for the key pair
  algorithm: 'ed25519' | 'secp256k1';
  createdAt: string;
}

export interface PoLProof {
  id: string;
  walletId: string;
  timestamp: number; // Unix timestamp
  challenge: string; // Random nonce to prevent replay attacks
  signature: string; // Base64 encoded signature
  publicKey: string; // User's PoL public key
  proofType: 'automatic' | 'manual' | 'emergency';
  metadata: {
    deviceFingerprint?: string;
    userAgent?: string;
    ipAddress?: string;
    location?: string;
  };
}

export interface PoLStatus {
  walletId: string;
  lastProofTimestamp: number;
  status: 'active' | 'missed' | 'escalated' | 'recovery_triggered';
  nextCheckIn: number; // Unix timestamp of next expected check-in
  missedCount: number;
  escalationLevel: number;
  guardianNotifications: GuardianNotification[];
}

export interface GuardianNotification {
  id: string;
  guardianId: string;
  notificationType: 'pol_missed' | 'pol_escalated' | 'recovery_triggered';
  timestamp: number;
  message: string;
  acknowledged: boolean;
  acknowledgedAt?: number;
}

export interface PoLConfig {
  checkInInterval: number; // Seconds between check-ins (default: 7 days)
  gracePeriod: number; // Seconds before marking as missed (default: 1 day)
  escalationThreshold: number; // Days before escalation (default: 3 days)
  recoveryThreshold: number; // Days before recovery trigger (default: 30 days)
  maxMissedCount: number; // Maximum missed check-ins before escalation
  requireManualVerification: boolean; // Require manual verification for recovery
}

export interface WebAuthnCredential {
  id: string;
  publicKey: string;
  algorithm: string;
  counter: number;
  createdAt: string;
  lastUsed?: string;
}

export interface PoLEnrollment {
  walletId: string;
  publicKey: string;
  keyId: string;
  webauthnCredentialId?: string;
  enrolledAt: string;
  status: 'pending' | 'active' | 'revoked';
}

export interface RecoveryTrigger {
  id: string;
  walletId: string;
  triggeredAt: number;
  reason: 'pol_timeout' | 'manual' | 'guardian_consensus';
  guardianSignatures: GuardianSignature[];
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  requiredSignatures: number;
  receivedSignatures: number;
}

export interface GuardianSignature {
  guardianId: string;
  signature: string;
  signedAt: number;
  verificationMethod: 'email' | 'sms' | 'hardware' | 'biometric';
  proof: string;
}

export interface PoLVerificationResult {
  isValid: boolean;
  errors: string[];
  proof: PoLProof;
  verificationDetails: {
    signatureValid: boolean;
    timestampValid: boolean;
    challengeValid: boolean;
    publicKeyValid: boolean;
  };
}

export interface PoLHeartbeatConfig {
  enabled: boolean;
  interval: number; // Milliseconds
  retryAttempts: number;
  retryDelay: number; // Milliseconds
  offlineMode: boolean; // Continue when offline
}

export interface PoLStorage {
  // Client-side storage interface
  storeKeyPair(keyPair: PoLKeyPair): Promise<void>;
  retrieveKeyPair(keyId: string): Promise<PoLKeyPair | null>;
  storeProof(proof: PoLProof): Promise<void>;
  retrieveProofs(walletId: string): Promise<PoLProof[]>;
  storeConfig(config: PoLConfig): Promise<void>;
  retrieveConfig(walletId: string): Promise<PoLConfig | null>;
  clearStorage(walletId: string): Promise<void>;
}

export interface PoLServerAPI {
  // Server-side API interface
  submitProof(proof: PoLProof): Promise<{ success: boolean; message: string }>;
  getStatus(walletId: string): Promise<PoLStatus>;
  getProofs(walletId: string, limit?: number): Promise<PoLProof[]>;
  enrollWallet(enrollment: PoLEnrollment): Promise<{ success: boolean; message: string }>;
  revokeEnrollment(walletId: string): Promise<{ success: boolean; message: string }>;
  triggerRecovery(trigger: RecoveryTrigger): Promise<{ success: boolean; message: string }>;
  verifyProof(proof: PoLProof): Promise<PoLVerificationResult>;
}

export interface PoLGuardianAPI {
  // Guardian verification interface
  verifyProof(proof: PoLProof, publicKey: string): Promise<boolean>;
  getWalletStatus(walletId: string): Promise<PoLStatus>;
  acknowledgeNotification(notificationId: string): Promise<void>;
  signRecovery(triggerId: string, guardianId: string, signature: string): Promise<void>;
  getRecoveryTriggers(walletId: string): Promise<RecoveryTrigger[]>;
}

// Error types
export class PoLError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PoLError';
  }
}

export class PoLVerificationError extends PoLError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VERIFICATION_ERROR', details);
    this.name = 'PoLVerificationError';
  }
}

export class PoLStorageError extends PoLError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'STORAGE_ERROR', details);
    this.name = 'PoLStorageError';
  }
}

export class PoLNetworkError extends PoLError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', details);
    this.name = 'PoLNetworkError';
  }
}
