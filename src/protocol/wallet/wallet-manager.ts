/**
 * Seed Guardian Safe Protocol - Client-Side Wallet Manager
 * 
 * This module implements the core wallet management functionality
 * with pure client-side cryptography and protocol compliance.
 */

import {
  ClientWallet,
  WalletPolicy,
  Guardian,
  GuardianShare,
  RecoveryAttempt,
  GuardianSignature,
  AuditLogEntry,
  WalletAddress,
  ProtocolError,
  CryptoError,
  ValidationError,
  GuardianError
} from '../core/types';
import { shamir } from '../crypto/shamir';
import { encryption } from '../crypto/encryption';
import { auditLog } from '../audit/audit-log';

export interface CreateWalletRequest {
  name: string;
  masterSeed: string;
  guardians: Array<{
    email: string;
    fullName: string;
    phoneNumber?: string;
  }>;
  threshold: number;
  userPassword: string;
}

export interface CreateWalletResponse {
  wallet: ClientWallet;
  guardianShares: GuardianShare[];
  auditEntries: AuditLogEntry[];
}

export class ClientWalletManager {
  private wallets: Map<string, ClientWallet> = new Map();

  /**
   * Create a new wallet with client-side cryptography
   */
  async createWallet(
    request: CreateWalletRequest,
    userPrivateKey: string
  ): Promise<CreateWalletResponse> {
    try {
      // Validate inputs
      this.validateCreateWalletRequest(request);

      // Generate wallet ID
      const walletId = await this.generateWalletId();

      // Create wallet policy
      const policy: WalletPolicy = {
        walletId,
        ownerId: await this.generateOwnerId(),
        threshold: request.threshold,
        totalGuardians: request.guardians.length,
        recoveryTimeout: 72, // 72 hours
        proofOfLifeInterval: 30, // 30 days
        allowedRecoveryReasons: [
          'owner_unavailable',
          'owner_deceased',
          'emergency_access',
          'wallet_lost'
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Split master seed using Shamir's Secret Sharing
      const secretShares = await shamir.splitSecret(request.masterSeed, {
        threshold: request.threshold,
        totalShares: request.guardians.length
      });

      // Generate guardian key pairs and encrypt shares
      const guardians: Guardian[] = [];
      const guardianShares: GuardianShare[] = [];

      for (let i = 0; i < request.guardians.length; i++) {
        const guardianInfo = request.guardians[i];
        const share = secretShares[i];

        // Generate key pair for guardian
        const keyPair = await encryption.generateKeyPair();

        // Encrypt share with guardian's public key
        const encryptedShare = await encryption.encryptWithRSA(
          share.shareValue,
          keyPair.publicKey,
          keyPair.keyId
        );

        // Create guardian record
        const guardian: Guardian = {
          id: await this.generateGuardianId(),
          walletId,
          email: guardianInfo.email,
          fullName: guardianInfo.fullName,
          phoneNumber: guardianInfo.phoneNumber,
          publicKey: keyPair.publicKey,
          keyId: keyPair.keyId,
          status: 'invited',
          shareIndex: share.shareIndex,
          verificationLevel: 'basic',
          createdAt: new Date().toISOString(),
          metadata: {}
        };

        // Create guardian share record
        const guardianShare: GuardianShare = {
          shareIndex: share.shareIndex,
          encryptedShare: encryptedShare.encryptedData,
          guardianPublicKey: keyPair.publicKey,
          guardianId: guardian.id,
          createdAt: new Date().toISOString(),
          metadata: {
            encryptionAlgorithm: encryptedShare.algorithm,
            keySize: 2048,
            shareHash: await this.hashString(encryptedShare.encryptedData)
          }
        };

        guardians.push(guardian);
        guardianShares.push(guardianShare);
      }

      // Create wallet addresses (empty initially)
      const addresses: WalletAddress[] = [];

      // Create client wallet
      const wallet: ClientWallet = {
        id: walletId,
        name: request.name,
        masterSeed: request.masterSeed, // Only exists client-side
        policy,
        guardians,
        addresses,
        recoveryAttempts: [],
        auditLog: [],
        createdAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        metadata: {
          derivationPath: "m/44'/0'/0'",
          network: 'mainnet',
          walletType: 'inheritance'
        }
      };

      // Create audit log entries
      const auditEntries: AuditLogEntry[] = [];

      // Log wallet creation
      const walletCreatedEntry = await auditLog.addEntry(
        'wallet_created',
        walletId,
        policy.ownerId,
        {
          walletName: request.name,
          threshold: request.threshold,
          totalGuardians: request.guardians.length,
          policy
        },
        userPrivateKey,
        'web'
      );
      auditEntries.push(walletCreatedEntry);

      // Log guardian additions
      for (const guardian of guardians) {
        const guardianAddedEntry = await auditLog.addEntry(
          'guardian_added',
          walletId,
          policy.ownerId,
          {
            guardianId: guardian.id,
            email: guardian.email,
            fullName: guardian.fullName,
            shareIndex: guardian.shareIndex
          },
          userPrivateKey,
          'web'
        );
        auditEntries.push(guardianAddedEntry);
      }

      // Store wallet locally
      this.wallets.set(walletId, wallet);

      return {
        wallet,
        guardianShares,
        auditEntries
      };
    } catch (error) {
      throw new ProtocolError('Failed to create wallet', 'WALLET_CREATION_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        walletName: request.name
      });
    }
  }

  /**
   * Initiate recovery process
   */
  async initiateRecovery(
    walletId: string,
    guardianId: string,
    reason: string,
    newOwnerEmail?: string,
    guardianPrivateKey?: string
  ): Promise<RecoveryAttempt> {
    try {
      const wallet = this.wallets.get(walletId);
      if (!wallet) {
        throw new ValidationError('Wallet not found', { walletId });
      }

      // Validate guardian
      const guardian = wallet.guardians.find(g => g.id === guardianId);
      if (!guardian) {
        throw new GuardianError('Guardian not found', { guardianId, walletId });
      }

      if (guardian.status !== 'active') {
        throw new GuardianError('Guardian not active', { guardianId, status: guardian.status });
      }

      // Create recovery attempt
      const recoveryAttempt: RecoveryAttempt = {
        id: await this.generateRecoveryId(),
        walletId,
        initiatedBy: guardianId,
        reason,
        newOwnerEmail,
        status: 'pending',
        requiredSignatures: wallet.policy.threshold,
        currentSignatures: 0,
        guardianSignatures: [],
        expiresAt: new Date(Date.now() + wallet.policy.recoveryTimeout * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        metadata: {
          ipAddress: 'client-ip', // Would be set by client
          userAgent: 'client-user-agent',
          location: undefined
        }
      };

      // Add to wallet
      wallet.recoveryAttempts.push(recoveryAttempt);

      // Log recovery initiation
      if (guardianPrivateKey) {
        const recoveryInitiatedEntry = await auditLog.addEntry(
          'recovery_initiated',
          walletId,
          guardianId,
          {
            recoveryId: recoveryAttempt.id,
            reason,
            newOwnerEmail,
            requiredSignatures: recoveryAttempt.requiredSignatures
          },
          guardianPrivateKey,
          'web'
        );
        wallet.auditLog.push(recoveryInitiatedEntry);
      }

      return recoveryAttempt;
    } catch (error) {
      throw new ProtocolError('Failed to initiate recovery', 'RECOVERY_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        walletId,
        guardianId
      });
    }
  }

  /**
   * Sign recovery attempt
   */
  async signRecovery(
    walletId: string,
    recoveryId: string,
    guardianId: string,
    guardianPrivateKey: string,
    verificationMethod: 'email' | 'sms' | 'hardware' | 'biometric' = 'email'
  ): Promise<GuardianSignature> {
    try {
      const wallet = this.wallets.get(walletId);
      if (!wallet) {
        throw new ValidationError('Wallet not found', { walletId });
      }

      // Find recovery attempt
      const recoveryAttempt = wallet.recoveryAttempts.find(r => r.id === recoveryId);
      if (!recoveryAttempt) {
        throw new ValidationError('Recovery attempt not found', { recoveryId });
      }

      if (recoveryAttempt.status !== 'pending' && recoveryAttempt.status !== 'collecting_signatures') {
        throw new ValidationError('Recovery attempt not in valid state', { 
          recoveryId, 
          status: recoveryAttempt.status 
        });
      }

      // Check if guardian already signed
      const existingSignature = recoveryAttempt.guardianSignatures.find(s => s.guardianId === guardianId);
      if (existingSignature) {
        throw new ValidationError('Guardian already signed this recovery attempt', { guardianId });
      }

      // Validate guardian
      const guardian = wallet.guardians.find(g => g.id === guardianId);
      if (!guardian) {
        throw new GuardianError('Guardian not found', { guardianId });
      }

      if (guardian.status !== 'active') {
        throw new GuardianError('Guardian not active', { guardianId, status: guardian.status });
      }

      // Create signature data
      const signatureData = {
        recoveryId,
        guardianId,
        walletId,
        timestamp: new Date().toISOString(),
        verificationMethod
      };

      // Sign the recovery
      const signature = await encryption.signData(
        JSON.stringify(signatureData),
        guardianPrivateKey
      );

      // Create guardian signature
      const guardianSignature: GuardianSignature = {
        guardianId,
        signature,
        signedAt: new Date().toISOString(),
        verificationMethod,
        proof: `Verified via ${verificationMethod}`,
        metadata: {
          ipAddress: 'client-ip',
          deviceFingerprint: undefined,
          location: undefined
        }
      };

      // Add signature to recovery attempt
      recoveryAttempt.guardianSignatures.push(guardianSignature);
      recoveryAttempt.currentSignatures = recoveryAttempt.guardianSignatures.length;

      // Update status
      if (recoveryAttempt.currentSignatures >= recoveryAttempt.requiredSignatures) {
        recoveryAttempt.status = 'completed';
        recoveryAttempt.completedAt = new Date().toISOString();
      } else {
        recoveryAttempt.status = 'collecting_signatures';
      }

      // Log recovery signature
      const recoverySignedEntry = await auditLog.addEntry(
        'recovery_signed',
        walletId,
        guardianId,
        {
          recoveryId,
          signature,
          verificationMethod,
          currentSignatures: recoveryAttempt.currentSignatures,
          requiredSignatures: recoveryAttempt.requiredSignatures
        },
        guardianPrivateKey,
        'web'
      );
      wallet.auditLog.push(recoverySignedEntry);

      return guardianSignature;
    } catch (error) {
      throw new ProtocolError('Failed to sign recovery', 'RECOVERY_SIGNATURE_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        walletId,
        recoveryId,
        guardianId
      });
    }
  }

  /**
   * Reconstruct master seed from guardian shares
   */
  async reconstructSeed(
    walletId: string,
    guardianShares: Array<{
      shareIndex: number;
      shareValue: string;
      guardianPrivateKey: string;
    }>
  ): Promise<string> {
    try {
      const wallet = this.wallets.get(walletId);
      if (!wallet) {
        throw new ValidationError('Wallet not found', { walletId });
      }

      // Validate we have enough shares
      if (guardianShares.length < wallet.policy.threshold) {
        throw new ValidationError('Insufficient shares for reconstruction', {
          provided: guardianShares.length,
          required: wallet.policy.threshold
        });
      }

      // Decrypt shares
      const decryptedShares = [];
      for (const guardianShare of guardianShares) {
        const guardian = wallet.guardians.find(g => g.shareIndex === guardianShare.shareIndex);
        if (!guardian) {
          throw new GuardianError('Guardian not found for share', { shareIndex: guardianShare.shareIndex });
        }

        // Decrypt the share
        const decryptedShare = await encryption.decryptWithRSA(
          guardianShare.shareValue,
          guardianShare.guardianPrivateKey,
          guardian.keyId
        );

        decryptedShares.push({
          shareIndex: guardianShare.shareIndex,
          shareValue: decryptedShare.decryptedData,
          x: guardianShare.shareIndex
        });
      }

      // Reconstruct the secret
      const reconstructedSeed = await shamir.reconstructSecret(decryptedShares);

      // Verify the reconstruction
      if (reconstructedSeed !== wallet.masterSeed) {
        throw new CryptoError('Seed reconstruction verification failed');
      }

      return reconstructedSeed;
    } catch (error) {
      throw new ProtocolError('Failed to reconstruct seed', 'SEED_RECONSTRUCTION_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        walletId
      });
    }
  }

  /**
   * Get wallet by ID
   */
  getWallet(walletId: string): ClientWallet | null {
    return this.wallets.get(walletId) || null;
  }

  /**
   * Get all wallets
   */
  getAllWallets(): ClientWallet[] {
    return Array.from(this.wallets.values());
  }

  /**
   * Update wallet last accessed time
   */
  updateLastAccessed(walletId: string): void {
    const wallet = this.wallets.get(walletId);
    if (wallet) {
      wallet.lastAccessed = new Date().toISOString();
    }
  }

  /**
   * Validate create wallet request
   */
  private validateCreateWalletRequest(request: CreateWalletRequest): void {
    if (!request.name || request.name.length < 3) {
      throw new ValidationError('Wallet name must be at least 3 characters');
    }

    if (!request.masterSeed || request.masterSeed.length < 32) {
      throw new ValidationError('Master seed must be at least 32 characters');
    }

    if (!request.guardians || request.guardians.length < 2) {
      throw new ValidationError('At least 2 guardians required');
    }

    if (request.guardians.length > 10) {
      throw new ValidationError('Maximum 10 guardians allowed');
    }

    if (request.threshold < 2) {
      throw new ValidationError('Threshold must be at least 2');
    }

    if (request.threshold > request.guardians.length) {
      throw new ValidationError('Threshold cannot exceed number of guardians');
    }

    if (!request.userPassword || request.userPassword.length < 12) {
      throw new ValidationError('User password must be at least 12 characters');
    }

    // Validate guardian emails
    const emails = request.guardians.map(g => g.email);
    const uniqueEmails = new Set(emails);
    if (uniqueEmails.size !== emails.length) {
      throw new ValidationError('Duplicate guardian emails not allowed');
    }
  }

  /**
   * Generate unique wallet ID
   */
  private async generateWalletId(): Promise<string> {
    const timestamp = Date.now().toString();
    const random = crypto.getRandomValues(new Uint8Array(16));
    const randomHex = Array.from(random, byte => byte.toString(16).padStart(2, '0')).join('');
    return await this.hashString(timestamp + randomHex);
  }

  /**
   * Generate unique owner ID
   */
  private async generateOwnerId(): Promise<string> {
    const timestamp = Date.now().toString();
    const random = crypto.getRandomValues(new Uint8Array(16));
    const randomHex = Array.from(random, byte => byte.toString(16).padStart(2, '0')).join('');
    return await this.hashString('owner-' + timestamp + randomHex);
  }

  /**
   * Generate unique guardian ID
   */
  private async generateGuardianId(): Promise<string> {
    const timestamp = Date.now().toString();
    const random = crypto.getRandomValues(new Uint8Array(16));
    const randomHex = Array.from(random, byte => byte.toString(16).padStart(2, '0')).join('');
    return await this.hashString('guardian-' + timestamp + randomHex);
  }

  /**
   * Generate unique recovery ID
   */
  private async generateRecoveryId(): Promise<string> {
    const timestamp = Date.now().toString();
    const random = crypto.getRandomValues(new Uint8Array(16));
    const randomHex = Array.from(random, byte => byte.toString(16).padStart(2, '0')).join('');
    return await this.hashString('recovery-' + timestamp + randomHex);
  }

  /**
   * Hash a string using SHA-256
   */
  private async hashString(data: string): Promise<string> {
    const dataBuffer = new TextEncoder().encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = new Uint8Array(hashBuffer);
    return Array.from(hashArray, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}

// Export singleton instance
export const walletManager = new ClientWalletManager();
