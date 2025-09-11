/**
 * Proof of Life Protocol - Main Export
 * 
 * This is the main entry point for the Proof of Life system.
 * It exports all the core components and utilities.
 */

// Core types and interfaces
export * from './types';

// Core components
export { WebAuthnManager, type WebAuthnConfig } from './webauthn';
export { PoLKeyManager, type KeyGenConfig } from './keygen';
export { PoLHeartbeat, type HeartbeatEvent, type HeartbeatCallbacks } from './heartbeat';
export { PoLVerifier, type VerificationConfig, type GuardianConfig } from './verifier';
export { PoLManager, createPoLManager, type PoLManagerConfig, type PoLManagerCallbacks } from './manager';

// Storage
export { ClientPoLStorage, createClientStorage, type StorageConfig } from './storage';

// Default configurations
export {
  DEFAULT_POL_CONFIG,
  DEFAULT_HEARTBEAT_CONFIG,
  DEFAULT_VERIFICATION_CONFIG,
  DEFAULT_WEBAUTHN_CONFIG,
} from './manager';

// Utility functions
export const PoLUtils = {
  /**
   * Generate a random challenge
   */
  generateChallenge(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Generate a unique ID
   */
  generateId(prefix: string = 'pol'): string {
    const timestamp = Date.now().toString();
    const random = crypto.getRandomValues(new Uint8Array(16));
    const randomHex = Array.from(random, byte => byte.toString(16).padStart(2, '0')).join('');
    return `${prefix}_${timestamp}_${randomHex}`;
  },

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString();
  },

  /**
   * Calculate time until next check-in
   */
  getTimeUntilNextCheckIn(lastCheckIn: number, interval: number): number {
    const now = Math.floor(Date.now() / 1000);
    const nextCheckIn = lastCheckIn + interval;
    return Math.max(0, nextCheckIn - now);
  },

  /**
   * Check if WebAuthn is supported
   */
  isWebAuthnSupported(): boolean {
    return !!(
      window.PublicKeyCredential &&
      window.navigator.credentials &&
      window.navigator.credentials.create &&
      window.navigator.credentials.get
    );
  },

  /**
   * Validate wallet ID format
   */
  validateWalletId(walletId: string): boolean {
    // UUID v4 format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(walletId);
  },

  /**
   * Validate public key format
   */
  validatePublicKey(publicKey: string): boolean {
    try {
      // Try to decode as base64
      atob(publicKey);
      return publicKey.length > 0;
    } catch {
      return false;
    }
  },

  /**
   * Calculate escalation level based on missed time
   */
  calculateEscalationLevel(
    lastCheckIn: number,
    checkInInterval: number,
    escalationThreshold: number,
    recoveryThreshold: number
  ): number {
    const now = Math.floor(Date.now() / 1000);
    const timeSinceLastCheckIn = now - lastCheckIn;
    
    if (timeSinceLastCheckIn >= recoveryThreshold) {
      return 3; // Recovery triggered
    } else if (timeSinceLastCheckIn >= escalationThreshold) {
      return 2; // Escalated
    } else if (timeSinceLastCheckIn > checkInInterval) {
      return 1; // Missed
    } else {
      return 0; // Active
    }
  },

  /**
   * Get status from escalation level
   */
  getStatusFromEscalationLevel(escalationLevel: number): 'active' | 'missed' | 'escalated' | 'recovery_triggered' {
    switch (escalationLevel) {
      case 0:
        return 'active';
      case 1:
        return 'missed';
      case 2:
        return 'escalated';
      case 3:
        return 'recovery_triggered';
      default:
        return 'active';
    }
  },

  /**
   * Calculate missed count
   */
  calculateMissedCount(
    lastCheckIn: number,
    checkInInterval: number
  ): number {
    const now = Math.floor(Date.now() / 1000);
    const timeSinceLastCheckIn = now - lastCheckIn;
    
    if (timeSinceLastCheckIn <= checkInInterval) {
      return 0;
    }
    
    return Math.floor((timeSinceLastCheckIn - checkInInterval) / checkInInterval);
  },

  /**
   * Generate device fingerprint
   */
  async generateDeviceFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint', 2, 2);
      }
      
      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        canvas.toDataURL(),
      ].join('|');
      
      const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fingerprint));
      return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      return 'unknown_device';
    }
  },

  /**
   * Convert seconds to human readable format
   */
  formatDuration(seconds: number): string {
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  },

  /**
   * Check if a timestamp is recent
   */
  isRecentTimestamp(timestamp: number, threshold: number = 300): boolean {
    const now = Math.floor(Date.now() / 1000);
    return Math.abs(now - timestamp) <= threshold;
  },

  /**
   * Generate recovery trigger ID
   */
  generateRecoveryTriggerId(walletId: string): string {
    const timestamp = Date.now().toString();
    const random = crypto.getRandomValues(new Uint8Array(16));
    const randomHex = Array.from(random, byte => byte.toString(16).padStart(2, '0')).join('');
    return `recovery_trigger_${walletId}_${timestamp}_${randomHex}`;
  },

  /**
   * Validate challenge format
   */
  validateChallenge(challenge: string): boolean {
    // Challenge should be 64 character hex string
    return /^[a-f0-9]{64}$/.test(challenge);
  },

  /**
   * Validate signature format
   */
  validateSignature(signature: string): boolean {
    try {
      // Try to decode as base64
      atob(signature);
      return signature.length > 0;
    } catch {
      return false;
    }
  },
};

// Constants
export const PoLConstants = {
  // Time constants (in seconds)
  SECONDS_PER_MINUTE: 60,
  SECONDS_PER_HOUR: 3600,
  SECONDS_PER_DAY: 86400,
  SECONDS_PER_WEEK: 604800,
  SECONDS_PER_MONTH: 2592000,
  SECONDS_PER_YEAR: 31536000,

  // Default intervals
  DEFAULT_CHECK_IN_INTERVAL: 7 * 24 * 3600, // 7 days
  DEFAULT_GRACE_PERIOD: 24 * 3600, // 1 day
  DEFAULT_ESCALATION_THRESHOLD: 3 * 24 * 3600, // 3 days
  DEFAULT_RECOVERY_THRESHOLD: 30 * 24 * 3600, // 30 days

  // Verification constants
  DEFAULT_MAX_TIMESTAMP_DRIFT: 300, // 5 minutes
  DEFAULT_CHALLENGE_VALIDITY_WINDOW: 3600, // 1 hour
  DEFAULT_RECENT_PROOF_THRESHOLD: 7 * 24 * 3600, // 7 days

  // Heartbeat constants
  DEFAULT_HEARTBEAT_INTERVAL: 60 * 60 * 1000, // 1 hour
  DEFAULT_RETRY_ATTEMPTS: 3,
  DEFAULT_RETRY_DELAY: 30 * 1000, // 30 seconds

  // WebAuthn constants
  DEFAULT_WEBAUTHN_TIMEOUT: 60000, // 1 minute
  DEFAULT_CHALLENGE_LENGTH: 32,
  DEFAULT_SIGNATURE_LENGTH: 64,

  // Status levels
  STATUS_ACTIVE: 0,
  STATUS_MISSED: 1,
  STATUS_ESCALATED: 2,
  STATUS_RECOVERY_TRIGGERED: 3,

  // Proof types
  PROOF_TYPE_AUTOMATIC: 'automatic',
  PROOF_TYPE_MANUAL: 'manual',
  PROOF_TYPE_EMERGENCY: 'emergency',

  // Notification types
  NOTIFICATION_TYPE_POL_MISSED: 'pol_missed',
  NOTIFICATION_TYPE_POL_ESCALATED: 'pol_escalated',
  NOTIFICATION_TYPE_RECOVERY_TRIGGERED: 'recovery_triggered',

  // Recovery reasons
  RECOVERY_REASON_POL_TIMEOUT: 'pol_timeout',
  RECOVERY_REASON_MANUAL: 'manual',
  RECOVERY_REASON_GUARDIAN_CONSENSUS: 'guardian_consensus',

  // Verification levels
  VERIFICATION_LEVEL_BASIC: 'basic',
  VERIFICATION_LEVEL_ENHANCED: 'enhanced',
  VERIFICATION_LEVEL_HARDWARE: 'hardware',

  // Algorithms
  ALGORITHM_ED25519: 'ed25519',
  ALGORITHM_SECP256K1: 'secp256k1',
} as const;

// Error codes
export const PoLErrorCodes = {
  // General errors
  INITIALIZATION_FAILED: 'INITIALIZATION_FAILED',
  ENROLLMENT_FAILED: 'ENROLLMENT_FAILED',
  VERIFICATION_FAILED: 'VERIFICATION_FAILED',
  STORAGE_ERROR: 'STORAGE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',

  // WebAuthn errors
  WEBAUTHN_NOT_SUPPORTED: 'WEBAUTHN_NOT_SUPPORTED',
  CREDENTIAL_CREATION_FAILED: 'CREDENTIAL_CREATION_FAILED',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',

  // Key management errors
  KEY_GENERATION_FAILED: 'KEY_GENERATION_FAILED',
  ED25519_GENERATION_FAILED: 'ED25519_GENERATION_FAILED',
  SECP256K1_GENERATION_FAILED: 'SECP256K1_GENERATION_FAILED',
  SIGNING_FAILED: 'SIGNING_FAILED',
  KEY_DERIVATION_FAILED: 'KEY_DERIVATION_FAILED',
  ENCRYPTION_FAILED: 'ENCRYPTION_FAILED',
  DECRYPTION_FAILED: 'DECRYPTION_FAILED',

  // Heartbeat errors
  CHECK_IN_FAILED: 'CHECK_IN_FAILED',
  HEARTBEAT_ERROR: 'HEARTBEAT_ERROR',

  // Verification errors
  VERIFICATION_ERROR: 'VERIFICATION_ERROR',
  UNSUPPORTED_ALGORITHM: 'UNSUPPORTED_ALGORITHM',

  // Guardian API errors
  GUARDIAN_API_NOT_AVAILABLE: 'GUARDIAN_API_NOT_AVAILABLE',
} as const;
