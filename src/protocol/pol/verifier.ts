/**
 * Proof of Life Verification System
 * 
 * This module handles the verification of Proof of Life signatures
 * by guardians and the server.
 */

import { 
  PoLProof, 
  PoLVerificationResult, 
  PoLStatus, 
  GuardianNotification,
  RecoveryTrigger,
  GuardianSignature,
  PoLVerificationError 
} from './types';
import { PoLKeyManager } from './keygen';

export interface VerificationConfig {
  maxTimestampDrift: number; // Maximum allowed timestamp drift in seconds
  challengeValidityWindow: number; // Challenge validity window in seconds
  requireRecentProof: boolean; // Require proof within a certain timeframe
  recentProofThreshold: number; // Threshold for recent proof in seconds
}

export interface GuardianConfig {
  guardianId: string;
  publicKey: string;
  verificationLevel: 'basic' | 'enhanced' | 'hardware';
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

export class PoLVerifier {
  private keyManager: PoLKeyManager;
  private config: VerificationConfig;
  private guardianConfigs: Map<string, GuardianConfig> = new Map();

  constructor(keyManager: PoLKeyManager, config: VerificationConfig) {
    this.keyManager = keyManager;
    this.config = config;
  }

  /**
   * Add guardian configuration
   */
  addGuardian(config: GuardianConfig): void {
    this.guardianConfigs.set(config.guardianId, config);
  }

  /**
   * Remove guardian configuration
   */
  removeGuardian(guardianId: string): void {
    this.guardianConfigs.delete(guardianId);
  }

  /**
   * Verify a Proof of Life signature
   */
  async verifyProof(proof: PoLProof, publicKey: string): Promise<PoLVerificationResult> {
    const errors: string[] = [];
    let signatureValid = false;
    let timestampValid = false;
    let challengeValid = false;
    let publicKeyValid = false;

    try {
      // Verify signature
      signatureValid = await this.verifySignature(proof, publicKey);
      if (!signatureValid) {
        errors.push('Invalid signature');
      }

      // Verify timestamp
      timestampValid = await this.verifyTimestamp(proof);
      if (!timestampValid) {
        errors.push('Invalid timestamp');
      }

      // Verify challenge
      challengeValid = await this.verifyChallenge(proof);
      if (!challengeValid) {
        errors.push('Invalid challenge');
      }

      // Verify public key
      publicKeyValid = await this.verifyPublicKey(proof, publicKey);
      if (!publicKeyValid) {
        errors.push('Invalid public key');
      }

      const isValid = signatureValid && timestampValid && challengeValid && publicKeyValid;

      return {
        isValid,
        errors,
        proof,
        verificationDetails: {
          signatureValid,
          timestampValid,
          challengeValid,
          publicKeyValid,
        },
      };
    } catch (error) {
      throw new PoLVerificationError(
        'Proof verification failed',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Verify the signature of a proof
   */
  private async verifySignature(proof: PoLProof, publicKey: string): Promise<boolean> {
    try {
      // Recreate the data that was signed
      const dataToVerify = `${proof.timestamp}:${proof.challenge}:${proof.walletId}`;
      
      // Determine algorithm from public key or proof metadata
      const algorithm = this.detectAlgorithm(publicKey);
      
      // Verify the signature
      return await this.keyManager.verifySignature(
        dataToVerify,
        proof.signature,
        publicKey,
        algorithm
      );
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Verify the timestamp of a proof
   */
  private async verifyTimestamp(proof: PoLProof): Promise<boolean> {
    const now = Math.floor(Date.now() / 1000);
    const timestamp = proof.timestamp;
    const drift = Math.abs(now - timestamp);
    
    return drift <= this.config.maxTimestampDrift;
  }

  /**
   * Verify the challenge of a proof
   */
  private async verifyChallenge(proof: PoLProof): Promise<boolean> {
    // In a real implementation, this would check against a challenge store
    // For now, we'll just validate the format
    return /^[a-f0-9]{64}$/.test(proof.challenge);
  }

  /**
   * Verify the public key matches
   */
  private async verifyPublicKey(proof: PoLProof, expectedPublicKey: string): Promise<boolean> {
    return proof.publicKey === expectedPublicKey;
  }

  /**
   * Detect the algorithm from a public key
   */
  private detectAlgorithm(publicKey: string): 'ed25519' | 'secp256k1' {
    // This is a simplified detection - in practice, you'd need more sophisticated logic
    const keyLength = atob(publicKey).length;
    
    if (keyLength === 32) {
      return 'ed25519';
    } else if (keyLength === 65) {
      return 'secp256k1';
    } else {
      // Default to ed25519
      return 'ed25519';
    }
  }

  /**
   * Get Proof of Life status for a wallet
   */
  async getWalletStatus(walletId: string, lastProof?: PoLProof): Promise<PoLStatus> {
    const now = Math.floor(Date.now() / 1000);
    
    if (!lastProof) {
      return {
        walletId,
        lastProofTimestamp: 0,
        status: 'recovery_triggered',
        nextCheckIn: now + (7 * 24 * 60 * 60), // 7 days from now
        missedCount: 999,
        escalationLevel: 3,
        guardianNotifications: [],
      };
    }

    const timeSinceLastProof = now - lastProof.timestamp;
    const checkInInterval = 7 * 24 * 60 * 60; // 7 days
    const gracePeriod = 24 * 60 * 60; // 1 day
    const escalationThreshold = 3 * 24 * 60 * 60; // 3 days
    const recoveryThreshold = 30 * 24 * 60 * 60; // 30 days

    let status: 'active' | 'missed' | 'escalated' | 'recovery_triggered';
    let escalationLevel = 0;
    let missedCount = 0;

    if (timeSinceLastProof <= checkInInterval + gracePeriod) {
      status = 'active';
      escalationLevel = 0;
    } else if (timeSinceLastProof <= escalationThreshold) {
      status = 'missed';
      escalationLevel = 1;
      missedCount = Math.floor((timeSinceLastProof - checkInInterval) / checkInInterval);
    } else if (timeSinceLastProof <= recoveryThreshold) {
      status = 'escalated';
      escalationLevel = 2;
      missedCount = Math.floor((timeSinceLastProof - checkInInterval) / checkInInterval);
    } else {
      status = 'recovery_triggered';
      escalationLevel = 3;
      missedCount = Math.floor((timeSinceLastProof - checkInInterval) / checkInInterval);
    }

    const nextCheckIn = lastProof.timestamp + checkInInterval;
    const guardianNotifications = await this.generateGuardianNotifications(
      walletId,
      status,
      escalationLevel,
      missedCount
    );

    return {
      walletId,
      lastProofTimestamp: lastProof.timestamp,
      status,
      nextCheckIn,
      missedCount,
      escalationLevel,
      guardianNotifications,
    };
  }

  /**
   * Generate guardian notifications based on status
   */
  private async generateGuardianNotifications(
    walletId: string,
    status: 'active' | 'missed' | 'escalated' | 'recovery_triggered',
    escalationLevel: number,
    missedCount: number
  ): Promise<GuardianNotification[]> {
    const notifications: GuardianNotification[] = [];
    const now = Math.floor(Date.now() / 1000);

    for (const [guardianId, _config] of this.guardianConfigs) {
      let notificationType: 'pol_missed' | 'pol_escalated' | 'recovery_triggered';
      let message: string;

      switch (status) {
        case 'missed':
          notificationType = 'pol_missed';
          message = `Proof of Life missed for wallet ${walletId}. Missed count: ${missedCount}`;
          break;
        case 'escalated':
          notificationType = 'pol_escalated';
          message = `Proof of Life escalated for wallet ${walletId}. Escalation level: ${escalationLevel}`;
          break;
        case 'recovery_triggered':
          notificationType = 'recovery_triggered';
          message = `Recovery triggered for wallet ${walletId}. Immediate action required.`;
          break;
        default:
          continue; // No notification for active status
      }

      notifications.push({
        id: `notification_${guardianId}_${now}`,
        guardianId,
        notificationType,
        timestamp: now,
        message,
        acknowledged: false,
      });
    }

    return notifications;
  }

  /**
   * Create a recovery trigger
   */
  async createRecoveryTrigger(
    walletId: string,
    reason: 'pol_timeout' | 'manual' | 'guardian_consensus',
    guardianSignatures: GuardianSignature[] = []
  ): Promise<RecoveryTrigger> {
    const now = Math.floor(Date.now() / 1000);
    const requiredSignatures = Math.ceil(this.guardianConfigs.size * 0.6); // 60% of guardians

    return {
      id: `recovery_trigger_${walletId}_${now}`,
      walletId,
      triggeredAt: now,
      reason,
      guardianSignatures,
      status: 'pending',
      requiredSignatures,
      receivedSignatures: guardianSignatures.length,
    };
  }

  /**
   * Verify guardian signature for recovery
   */
  async verifyGuardianSignature(
    signature: GuardianSignature,
    recoveryData: string
  ): Promise<boolean> {
    const guardianConfig = this.guardianConfigs.get(signature.guardianId);
    if (!guardianConfig) {
      return false;
    }

    try {
      // Verify the signature using the guardian's public key
      const algorithm = this.detectAlgorithm(guardianConfig.publicKey);
      return await this.keyManager.verifySignature(
        recoveryData,
        signature.signature,
        guardianConfig.publicKey,
        algorithm
      );
    } catch (error) {
      console.error('Guardian signature verification failed:', error);
      return false;
    }
  }

  /**
   * Check if recovery threshold is met
   */
  async checkRecoveryThreshold(trigger: RecoveryTrigger): Promise<boolean> {
    if (trigger.receivedSignatures < trigger.requiredSignatures) {
      return false;
    }

    // Verify all signatures
    const recoveryData = `${trigger.walletId}:${trigger.triggeredAt}:${trigger.reason}`;
    
    for (const signature of trigger.guardianSignatures) {
      const isValid = await this.verifyGuardianSignature(signature, recoveryData);
      if (!isValid) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get verification statistics
   */
  getVerificationStats(): {
    totalGuardians: number;
    activeGuardians: number;
    verificationLevels: Record<string, number>;
  } {
    const stats = {
      totalGuardians: this.guardianConfigs.size,
      activeGuardians: 0,
      verificationLevels: {
        basic: 0,
        enhanced: 0,
        hardware: 0,
      },
    };

    for (const config of this.guardianConfigs.values()) {
      stats.activeGuardians++;
      stats.verificationLevels[config.verificationLevel]++;
    }

    return stats;
  }

  /**
   * Update verification configuration
   */
  updateConfig(config: Partial<VerificationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get guardian configuration
   */
  getGuardianConfig(guardianId: string): GuardianConfig | undefined {
    return this.guardianConfigs.get(guardianId);
  }

  /**
   * Get all guardian configurations
   */
  getAllGuardianConfigs(): GuardianConfig[] {
    return Array.from(this.guardianConfigs.values());
  }

  /**
   * Validate guardian configuration
   */
  validateGuardianConfig(config: GuardianConfig): boolean {
    try {
      // Validate required fields
      if (!config.guardianId || !config.publicKey) {
        return false;
      }

      // Validate public key format
      try {
        atob(config.publicKey);
      } catch {
        return false;
      }

      // Validate verification level
      if (!['basic', 'enhanced', 'hardware'].includes(config.verificationLevel)) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.guardianConfigs.clear();
  }
}
