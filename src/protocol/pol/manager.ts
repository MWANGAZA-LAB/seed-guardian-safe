/**
 * Proof of Life Manager
 * 
 * This is the main orchestrator for the Proof of Life system,
 * coordinating all components and providing a unified API.
 */

import { 
  PoLKeyPair, 
  PoLConfig, 
  PoLProof, 
  PoLStatus, 
  PoLEnrollment,
  PoLVerificationResult,
  RecoveryTrigger,
  GuardianNotification,
  PoLHeartbeatConfig,
  PoLStorage,
  PoLServerAPI,
  PoLGuardianAPI,
  PoLError,
  PoLStorageError,
  PoLNetworkError
} from './types';
import { WebAuthnManager, WebAuthnConfig } from './webauthn';
import { PoLKeyManager } from './keygen';
import { PoLHeartbeat } from './heartbeat';
import { PoLVerifier, VerificationConfig, GuardianConfig } from './verifier';
import { BitcoinRecoveryManager } from '../bitcoin/recovery-script';
import { TaprootRecoveryManager } from '../bitcoin/taproot';

export interface PoLManagerConfig {
  walletId: string;
  storage: PoLStorage;
  serverAPI: PoLServerAPI;
  guardianAPI?: PoLGuardianAPI;
  webAuthnConfig: WebAuthnConfig;
  polConfig: PoLConfig;
  heartbeatConfig: PoLHeartbeatConfig;
  verificationConfig: VerificationConfig;
  bitcoinRecoveryManager?: BitcoinRecoveryManager;
  taprootRecoveryManager?: TaprootRecoveryManager;
}

export interface PoLManagerCallbacks {
  onCheckIn?: (proof: PoLProof) => void;
  onMissed?: (walletId: string, missedCount: number) => void;
  onEscalated?: (walletId: string, escalationLevel: number) => void;
  onRecoveryTriggered?: (walletId: string, reason: string) => void;
  onError?: (error: PoLError) => void;
  onEnrollmentComplete?: (enrollment: PoLEnrollment) => void;
  onEnrollmentFailed?: (error: PoLError) => void;
  onStatusChange?: (status: PoLStatus) => void;
}

export class PoLManager {
  private config: PoLManagerConfig;
  private callbacks: PoLManagerCallbacks;
  private webAuthnManager: WebAuthnManager;
  private keyManager: PoLKeyManager;
  private heartbeat: PoLHeartbeat;
  private verifier: PoLVerifier;
  private bitcoinRecoveryManager: BitcoinRecoveryManager;
  private taprootRecoveryManager: TaprootRecoveryManager;
  private isInitialized: boolean = false;
  private currentKeyPair: PoLKeyPair | null = null;
  // @ts-ignore - Intentionally unused property for future implementation
  private _currentStatus: PoLStatus | null = null;

  constructor(config: PoLManagerConfig, callbacks: PoLManagerCallbacks = {}) {
    this.config = config;
    this.callbacks = callbacks;
    
    // Initialize components
    this.webAuthnManager = new WebAuthnManager(config.webAuthnConfig);
    this.keyManager = new PoLKeyManager(config.storage);
    this.heartbeat = new PoLHeartbeat(
      this.keyManager,
      config.polConfig,
      config.heartbeatConfig,
      callbacks
    );
    this.verifier = new PoLVerifier(this.keyManager, config.verificationConfig);
    
    // Initialize Bitcoin recovery managers
    this.bitcoinRecoveryManager = config.bitcoinRecoveryManager || new BitcoinRecoveryManager();
    this.taprootRecoveryManager = config.taprootRecoveryManager || new TaprootRecoveryManager();
  }

  /**
   * Initialize the Proof of Life system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Check if WebAuthn is supported
      if (!this.webAuthnManager.isSupported()) {
        throw new PoLError('WebAuthn not supported', 'WEBAUTHN_NOT_SUPPORTED');
      }

      // Load existing key pair or generate new one
      await this.loadOrGenerateKeyPair();

      // Initialize heartbeat system
      if (this.currentKeyPair) {
        await this.heartbeat.initialize(this.config.walletId, this.currentKeyPair);
      }

      this.isInitialized = true;
    } catch (error) {
      if (error instanceof PoLError) {
        throw error;
      }
      throw new PoLError(
        'PoL initialization failed',
        'INITIALIZATION_FAILED',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Enroll in Proof of Life system
   */
  async enroll(
    userName: string,
    userDisplayName: string,
    enableWebAuthn: boolean = true
  ): Promise<PoLEnrollment> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      let webauthnCredentialId: string | undefined;

      // Enroll WebAuthn credential if requested
      if (enableWebAuthn) {
        const credential = await this.webAuthnManager.enrollCredential(
          this.config.walletId,
          userName,
          userDisplayName
        );
        webauthnCredentialId = credential.id;
      }

      // Create enrollment record
      const enrollment: PoLEnrollment = {
        walletId: this.config.walletId,
        publicKey: this.currentKeyPair!.publicKey,
        keyId: this.currentKeyPair!.keyId,
        webauthnCredentialId,
        enrolledAt: new Date().toISOString(),
        status: 'active',
      };

      // Submit enrollment to server
      const result = await this.config.serverAPI.enrollWallet(enrollment);
      if (!result.success) {
        throw new PoLNetworkError('Enrollment failed', { message: result.message });
      }

      // Notify callback
      if (this.callbacks.onEnrollmentComplete) {
        this.callbacks.onEnrollmentComplete(enrollment);
      }

      return enrollment;
    } catch (error) {
      if (this.callbacks.onEnrollmentFailed) {
        if (error instanceof PoLError) {
          this.callbacks.onEnrollmentFailed(error);
        } else {
          this.callbacks.onEnrollmentFailed(new PoLError(
            'Enrollment failed',
            'ENROLLMENT_FAILED',
            { originalError: error instanceof Error ? error.message : 'Unknown error' }
          ));
        }
      }
      throw error;
    }
  }

  /**
   * Start Proof of Life monitoring
   */
  async startMonitoring(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    await this.heartbeat.start();
  }

  /**
   * Stop Proof of Life monitoring
   */
  stopMonitoring(): void {
    this.heartbeat.stop();
  }

  /**
   * Perform manual check-in
   */
  async performCheckIn(proofType: 'manual' | 'emergency' = 'manual'): Promise<PoLProof> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return await this.heartbeat.performCheckIn(proofType);
  }

  /**
   * Get current Proof of Life status
   */
  async getStatus(): Promise<PoLStatus> {
    try {
      const status = await this.config.serverAPI.getStatus(this.config.walletId);
      this._currentStatus = status;
      return status;
    } catch (error) {
      throw new PoLNetworkError(
        'Failed to get status',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Get Proof of Life history
   */
  async getProofHistory(limit: number = 10): Promise<PoLProof[]> {
    try {
      return await this.config.serverAPI.getProofs(this.config.walletId, limit);
    } catch (error) {
      throw new PoLNetworkError(
        'Failed to get proof history',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Verify a Proof of Life signature
   */
  async verifyProof(proof: PoLProof): Promise<PoLVerificationResult> {
    try {
      return await this.config.serverAPI.verifyProof(proof);
    } catch (error) {
      throw new PoLNetworkError(
        'Proof verification failed',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Add guardian for verification
   */
  addGuardian(guardianConfig: GuardianConfig): void {
    this.verifier.addGuardian(guardianConfig);
  }

  /**
   * Remove guardian
   */
  removeGuardian(guardianId: string): void {
    this.verifier.removeGuardian(guardianId);
  }

  /**
   * Trigger recovery process
   */
  async triggerRecovery(reason: 'pol_timeout' | 'manual' | 'guardian_consensus'): Promise<RecoveryTrigger> {
    try {
      const trigger = await this.verifier.createRecoveryTrigger(
        this.config.walletId,
        reason
      );

      const result = await this.config.serverAPI.triggerRecovery(trigger);
      if (!result.success) {
        throw new PoLNetworkError('Recovery trigger failed', { message: result.message });
      }

      if (this.callbacks.onRecoveryTriggered) {
        this.callbacks.onRecoveryTriggered(this.config.walletId, trigger.reason);
      }

      return trigger;
    } catch (error) {
      throw new PoLNetworkError(
        'Recovery trigger failed',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Get guardian notifications
   */
  async getGuardianNotifications(): Promise<GuardianNotification[]> {
    if (!this.config.guardianAPI) {
      throw new PoLError('Guardian API not available', 'GUARDIAN_API_NOT_AVAILABLE');
    }

    try {
      const status = await this.getStatus();
      return status.guardianNotifications;
    } catch (error) {
      throw new PoLNetworkError(
        'Failed to get guardian notifications',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Acknowledge guardian notification
   */
  async acknowledgeNotification(notificationId: string): Promise<void> {
    if (!this.config.guardianAPI) {
      throw new PoLError('Guardian API not available', 'GUARDIAN_API_NOT_AVAILABLE');
    }

    try {
      await this.config.guardianAPI.acknowledgeNotification(notificationId);
    } catch (error) {
      throw new PoLNetworkError(
        'Failed to acknowledge notification',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Sign recovery as guardian
   */
  async signRecovery(triggerId: string, guardianId: string, signature: string): Promise<void> {
    if (!this.config.guardianAPI) {
      throw new PoLError('Guardian API not available', 'GUARDIAN_API_NOT_AVAILABLE');
    }

    try {
      await this.config.guardianAPI.signRecovery(triggerId, guardianId, signature);
    } catch (error) {
      throw new PoLNetworkError(
        'Failed to sign recovery',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Get recovery triggers
   */
  async getRecoveryTriggers(): Promise<RecoveryTrigger[]> {
    if (!this.config.guardianAPI) {
      throw new PoLError('Guardian API not available', 'GUARDIAN_API_NOT_AVAILABLE');
    }

    try {
      return await this.config.guardianAPI.getRecoveryTriggers(this.config.walletId);
    } catch (error) {
      throw new PoLNetworkError(
        'Failed to get recovery triggers',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PoLConfig>): void {
    this.config.polConfig = { ...this.config.polConfig, ...config };
    this.heartbeat.updateConfig(config);
  }

  /**
   * Update heartbeat configuration
   */
  updateHeartbeatConfig(config: Partial<PoLHeartbeatConfig>): void {
    this.config.heartbeatConfig = { ...this.config.heartbeatConfig, ...config };
    this.heartbeat.updateHeartbeatConfig(config);
  }

  /**
   * Update verification configuration
   */
  updateVerificationConfig(config: Partial<VerificationConfig>): void {
    this.config.verificationConfig = { ...this.config.verificationConfig, ...config };
    this.verifier.updateConfig(config);
  }

  /**
   * Get system information
   */
  getSystemInfo(): {
    isInitialized: boolean;
    isMonitoring: boolean;
    hasKeyPair: boolean;
    webAuthnSupported: boolean;
    heartbeatStatus: any;
    verificationStats: any;
  } {
    return {
      isInitialized: this.isInitialized,
      isMonitoring: this.heartbeat.getStatus().isRunning,
      hasKeyPair: !!this.currentKeyPair,
      webAuthnSupported: this.webAuthnManager.isSupported(),
      heartbeatStatus: this.heartbeat.getStatus(),
      verificationStats: this.verifier.getVerificationStats(),
    };
  }

  /**
   * Revoke enrollment
   */
  async revokeEnrollment(): Promise<void> {
    try {
      const result = await this.config.serverAPI.revokeEnrollment(this.config.walletId);
      if (!result.success) {
        throw new PoLNetworkError('Enrollment revocation failed', { message: result.message });
      }

      // Stop monitoring
      this.stopMonitoring();

      // Clear local data
      await this.config.storage.clearStorage(this.config.walletId);
      this.currentKeyPair = null;
      this.isInitialized = false;
    } catch (error) {
      throw new PoLNetworkError(
        'Enrollment revocation failed',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Load or generate key pair
   */
  private async loadOrGenerateKeyPair(): Promise<void> {
    try {
      // Try to load existing key pair
      const existingKeyPair = await this.keyManager.getKeyPair(`pol_key_${this.config.walletId}`);
      
      if (existingKeyPair) {
        this.currentKeyPair = existingKeyPair;
      } else {
        // Generate new key pair
        this.currentKeyPair = await this.keyManager.generateKeyPair({
          algorithm: 'ed25519',
          keyId: `pol_key_${this.config.walletId}`,
          exportable: true,
        });
      }
    } catch (error) {
      throw new PoLStorageError(
        'Failed to load or generate key pair',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Create Bitcoin recovery script for Proof of Life timeout
   */
  async createBitcoinRecoveryScript(
    _guardianPublicKeys: Buffer[],
    threshold: number,
    timelockBlocks: number
  ): Promise<Buffer> {
    return await this.bitcoinRecoveryManager.createRecoveryScript(
      this.config.walletId,
      threshold,
      timelockBlocks
    );
  }

  /**
   * Create Taproot recovery script for enhanced privacy
   */
  async createTaprootRecoveryScript(
    guardianPublicKeys: Buffer[],
    threshold: number,
    timelockBlocks: number
  ): Promise<Buffer> {
    return await this.taprootRecoveryManager.createRecoveryScript(
      this.config.walletId,
      guardianPublicKeys,
      threshold,
      timelockBlocks
    );
  }

  /**
   * Create Proof of Life timeout script using Bitcoin Script
   */
  async createProofOfLifeTimeoutScript(
    _guardianPublicKeys: Buffer[],
    threshold: number,
    polTimeoutBlocks: number
  ): Promise<Buffer> {
    return await this.bitcoinRecoveryManager.createProofOfLifeTimeoutScript(
      this.config.walletId,
      threshold,
      polTimeoutBlocks
    );
  }

  /**
   * Execute Bitcoin-based recovery
   */
  async executeBitcoinRecovery(
    guardianSignatures: Array<{
      guardianId: string;
      signature: Buffer;
    }>,
    recoveryAddress: string
  ): Promise<string> {
    return await this.bitcoinRecoveryManager.executeRecovery(
      this.config.walletId,
      guardianSignatures,
      recoveryAddress
    );
  }

  /**
   * Execute Taproot-based recovery
   */
  async executeTaprootRecovery(
    guardianSignatures: Array<{
      guardianId: string;
      signature: Buffer;
    }>,
    recoveryAddress: string
  ): Promise<string> {
    return await this.taprootRecoveryManager.executeRecovery(
      this.config.walletId,
      guardianSignatures,
      recoveryAddress
    );
  }

  /**
   * Generate Taproot address for recovery
   */
  async generateTaprootAddress(): Promise<string> {
    return await this.taprootRecoveryManager.generateAddress(this.config.walletId);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.heartbeat.destroy();
    this.verifier.destroy();
    this.currentKeyPair = null;
    this.isInitialized = false;
  }
}

// Factory function for creating PoL Manager
export async function createPoLManager(
  config: PoLManagerConfig,
  callbacks: PoLManagerCallbacks = {}
): Promise<PoLManager> {
  const manager = new PoLManager(config, callbacks);
  await manager.initialize();
  return manager;
}

// Default configurations
export const DEFAULT_POL_CONFIG: PoLConfig = {
  checkInInterval: 7 * 24 * 60 * 60, // 7 days
  gracePeriod: 24 * 60 * 60, // 1 day
  escalationThreshold: 3 * 24 * 60 * 60, // 3 days
  recoveryThreshold: 30 * 24 * 60 * 60, // 30 days
  maxMissedCount: 3,
  requireManualVerification: true,
};

export const DEFAULT_HEARTBEAT_CONFIG: PoLHeartbeatConfig = {
  enabled: true,
  interval: 60 * 60 * 1000, // 1 hour
  retryAttempts: 3,
  retryDelay: 30 * 1000, // 30 seconds
  offlineMode: true,
};

export const DEFAULT_VERIFICATION_CONFIG: VerificationConfig = {
  maxTimestampDrift: 300, // 5 minutes
  challengeValidityWindow: 3600, // 1 hour
  requireRecentProof: true,
  recentProofThreshold: 7 * 24 * 60 * 60, // 7 days
};

export const DEFAULT_WEBAUTHN_CONFIG: WebAuthnConfig = {
  rpId: window.location.hostname,
  rpName: 'Seed Guardian Safe',
  timeout: 60000, // 1 minute
  userVerification: 'required',
  authenticatorSelection: {
    authenticatorAttachment: 'platform',
    userVerification: 'required',
    requireResidentKey: false,
  },
};