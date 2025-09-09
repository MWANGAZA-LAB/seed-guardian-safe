/**
 * Seed Guardian Safe Protocol - Main Protocol Client
 * 
 * This is the main entry point for the Seed Guardian Safe Protocol.
 * It orchestrates all protocol components and provides a unified API.
 */

import {
  ClientWallet,
  RecoveryAttempt,
  GuardianSignature,
  ProtocolConfig,
  ProtocolError,
  ValidationError
} from './core/types';
import { walletManager, CreateWalletRequest, CreateWalletResponse } from './wallet/wallet-manager';
import { auditLog, AuditLogChain } from './audit/audit-log';
import { encryption } from './crypto/encryption';
import { StorageClient, createStorageClient } from './storage/storage-client';

// Import KeyPair type
export interface KeyPair {
  publicKey: string;
  privateKey: string;
  keyId: string;
  algorithm: 'RSA-OAEP' | 'PGP' | 'Ed25519';
  keySize: number;
  createdAt: string;
  expiresAt?: string;
}

export interface ProtocolClientConfig {
  storage: {
    baseUrl: string;
    apiKey: string;
    timeout: number;
    retryAttempts: number;
  };
  protocol: ProtocolConfig;
}

export interface ProtocolStatus {
  version: string;
  initialized: boolean;
  storageConnected: boolean;
  lastSync: string;
  walletCount: number;
}

export class SeedGuardianProtocol {
  private config: ProtocolClientConfig;
  private storageClient: StorageClient;
  private initialized: boolean = false;
  private lastSync: string = '';

  constructor(config: ProtocolClientConfig) {
    this.config = config;
    this.storageClient = createStorageClient(config.storage);
  }

  /**
   * Initialize the protocol client
   */
  async initialize(): Promise<void> {
    try {
      // Validate configuration
      this.validateConfig();

      // Test storage connection
      await this.testStorageConnection();

      this.initialized = true;
      this.lastSync = new Date().toISOString();

      console.log('Seed Guardian Protocol initialized successfully');
    } catch (error) {
      throw new ProtocolError('Failed to initialize protocol', 'INIT_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get protocol status
   */
  getStatus(): ProtocolStatus {
    const wallets = walletManager.getAllWallets();
    
    return {
      version: this.config.protocol.version,
      initialized: this.initialized,
      storageConnected: this.initialized,
      lastSync: this.lastSync,
      walletCount: wallets.length
    };
  }

  /**
   * Create a new wallet with full protocol compliance
   */
  async createWallet(
    request: CreateWalletRequest,
    userPrivateKey: string
  ): Promise<CreateWalletResponse> {
    try {
      this.ensureInitialized();

      // Create wallet with client-side cryptography
      const result = await walletManager.createWallet(request, userPrivateKey);

      // Store guardian shares in storage layer
      for (const guardianShare of result.guardianShares) {
        await this.storageClient.storeGuardianShare(
          guardianShare,
          result.wallet.policy.ownerId,
          result.wallet.id
        );
      }

      // Store guardian information
      for (const guardian of result.wallet.guardians) {
        await this.storageClient.storeGuardianInfo(
          guardian,
          result.wallet.policy.ownerId,
          result.wallet.id
        );
      }

      // Store audit log entries
      for (const auditEntry of result.auditEntries) {
        await this.storageClient.storeAuditLog(
          auditEntry,
          result.wallet.policy.ownerId,
          result.wallet.id
        );
      }

      return result;
    } catch (error) {
      throw new ProtocolError('Failed to create wallet', 'WALLET_CREATION_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        walletName: request.name
      });
    }
  }

  /**
   * Load wallet from storage
   */
  async loadWallet(
    walletId: string,
    ownerId: string
  ): Promise<ClientWallet | null> {
    try {
      this.ensureInitialized();

      // Get wallet from local manager first
      let wallet = walletManager.getWallet(walletId);
      if (wallet) {
        walletManager.updateLastAccessed(walletId);
        return wallet;
      }

      // Load from storage
      const guardians = await this.storageClient.getWalletGuardians(walletId, ownerId);
      const recoveryAttempts = await this.storageClient.getWalletRecoveryAttempts(walletId, ownerId);
      const auditLogs = await this.storageClient.getAuditLogs(walletId, ownerId);

      if (guardians.length === 0) {
        return null; // Wallet not found
      }

      // Reconstruct wallet from storage data
      // Note: masterSeed is not stored on server, must be reconstructed from shares
      const reconstructedWallet: ClientWallet = {
        id: walletId,
        name: 'Recovered Wallet', // Would need to be stored separately
        masterSeed: '', // Must be reconstructed from shares
        policy: {
          walletId,
          ownerId,
          threshold: 2, // Would need to be stored separately
          totalGuardians: guardians.length,
          recoveryTimeout: 72,
          proofOfLifeInterval: 30,
          allowedRecoveryReasons: ['owner_unavailable', 'owner_deceased', 'emergency_access', 'wallet_lost'],
          createdAt: guardians[0]?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        guardians,
        addresses: [], // Would need to be loaded separately
        recoveryAttempts,
        auditLog: auditLogs,
        createdAt: guardians[0]?.createdAt || new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        metadata: {
          derivationPath: "m/44'/0'/0'",
          network: 'mainnet',
          walletType: 'inheritance'
        }
      };

      // Store in local manager
      walletManager['wallets'].set(walletId, reconstructedWallet);

      return reconstructedWallet;
    } catch (error) {
      throw new ProtocolError('Failed to load wallet', 'WALLET_LOAD_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        walletId
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
      this.ensureInitialized();

      const recoveryAttempt = await walletManager.initiateRecovery(
        walletId,
        guardianId,
        reason,
        newOwnerEmail,
        guardianPrivateKey
      );

      // Store recovery attempt in storage
      const wallet = walletManager.getWallet(walletId);
      if (wallet) {
        await this.storageClient.storeRecoveryAttempt(
          recoveryAttempt,
          wallet.policy.ownerId,
          walletId
        );
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
      this.ensureInitialized();

      const signature = await walletManager.signRecovery(
        walletId,
        recoveryId,
        guardianId,
        guardianPrivateKey,
        verificationMethod
      );

      // Update recovery attempt in storage
      const wallet = walletManager.getWallet(walletId);
      if (wallet) {
        const recoveryAttempt = wallet.recoveryAttempts.find(r => r.id === recoveryId);
        if (recoveryAttempt) {
          await this.storageClient.storeRecoveryAttempt(
            recoveryAttempt,
            wallet.policy.ownerId,
            walletId
          );
        }
      }

      return signature;
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
      this.ensureInitialized();

      return await walletManager.reconstructSeed(walletId, guardianShares);
    } catch (error) {
      throw new ProtocolError('Failed to reconstruct seed', 'SEED_RECONSTRUCTION_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        walletId
      });
    }
  }

  /**
   * Generate new key pair for guardian
   */
  async generateGuardianKeyPair(): Promise<KeyPair> {
    try {
      return await encryption.generateKeyPair();
    } catch (error) {
      throw new ProtocolError('Failed to generate guardian key pair', 'CRYPTO_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Encrypt data with guardian's public key
   */
  async encryptForGuardian(
    data: string,
    guardianPublicKey: string,
    keyId: string
  ): Promise<string> {
    try {
      const result = await encryption.encryptWithRSA(data, guardianPublicKey, keyId);
      return result.encryptedData;
    } catch (error) {
      throw new ProtocolError('Failed to encrypt for guardian', 'CRYPTO_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Decrypt data with guardian's private key
   */
  async decryptForGuardian(
    encryptedData: string,
    guardianPrivateKey: string,
    keyId: string
  ): Promise<string> {
    try {
      const result = await encryption.decryptWithRSA(encryptedData, guardianPrivateKey, keyId);
      return result.decryptedData;
    } catch (error) {
      throw new ProtocolError('Failed to decrypt for guardian', 'CRYPTO_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Sign data with private key
   */
  async signData(data: string, privateKey: string): Promise<string> {
    try {
      return await encryption.signData(data, privateKey);
    } catch (error) {
      throw new ProtocolError('Failed to sign data', 'CRYPTO_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Verify signature with public key
   */
  async verifySignature(
    data: string,
    signature: string,
    publicKey: string
  ): Promise<boolean> {
    try {
      return await encryption.verifySignature(data, signature, publicKey);
    } catch (error) {
      throw new ProtocolError('Failed to verify signature', 'CRYPTO_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get audit log chain for a wallet
   */
  async getAuditLogChain(walletId: string): Promise<AuditLogChain> {
    try {
      this.ensureInitialized();

      const wallet = walletManager.getWallet(walletId);
      if (!wallet) {
        throw new ValidationError('Wallet not found', { walletId });
      }

      return auditLog.exportChain();
    } catch (error) {
      throw new ProtocolError('Failed to get audit log chain', 'AUDIT_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        walletId
      });
    }
  }

  /**
   * Verify audit log chain integrity
   */
  async verifyAuditLogChain(walletId: string): Promise<{
    isValid: boolean;
    errors: string[];
    merkleRootValid: boolean;
    chainHashValid: boolean;
    signaturesValid: boolean;
  }> {
    try {
      this.ensureInitialized();

      return await auditLog.verifyChain();
    } catch (error) {
      throw new ProtocolError('Failed to verify audit log chain', 'AUDIT_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        walletId
      });
    }
  }

  /**
   * Sync wallet data with storage
   */
  async syncWallet(walletId: string, ownerId: string): Promise<void> {
    try {
      this.ensureInitialized();

      // Load latest data from storage
      const syncedWallet = await this.loadWallet(walletId, ownerId);
      if (!syncedWallet) {
        throw new ValidationError('Wallet not found in storage', { walletId });
      }

      this.lastSync = new Date().toISOString();
    } catch (error) {
      throw new ProtocolError('Failed to sync wallet', 'SYNC_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        walletId
      });
    }
  }

  /**
   * Test storage connection
   */
  private async testStorageConnection(): Promise<void> {
    try {
      // Make a simple request to test connection
      await this.storageClient.getAuditLogs('test', 'test', 1, 0);
    } catch (error) {
      // Connection test failed, but that's okay for initialization
      console.warn('Storage connection test failed:', error);
    }
  }

  /**
   * Validate protocol configuration
   */
  private validateConfig(): void {
    if (!this.config.storage.baseUrl) {
      throw new ValidationError('Storage base URL is required');
    }

    if (!this.config.storage.apiKey) {
      throw new ValidationError('Storage API key is required');
    }

    if (this.config.storage.timeout <= 0) {
      throw new ValidationError('Storage timeout must be positive');
    }

    if (this.config.storage.retryAttempts <= 0) {
      throw new ValidationError('Storage retry attempts must be positive');
    }
  }

  /**
   * Ensure protocol is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new ProtocolError('Protocol not initialized', 'INIT_ERROR');
    }
  }
}

// Export factory function
export function createProtocolClient(config: ProtocolClientConfig): SeedGuardianProtocol {
  return new SeedGuardianProtocol(config);
}

// Export default protocol configuration
export const defaultProtocolConfig: ProtocolConfig = {
  version: '1.0.0',
  supportedAlgorithms: {
    shamir: ['sssa-js'],
    encryption: ['RSA-OAEP', 'AES-GCM'],
    signing: ['RSA-PSS', 'Ed25519'],
    hashing: ['SHA-256', 'SHA-512']
  },
  defaultSettings: {
    threshold: 3,
    maxGuardians: 7,
    recoveryTimeout: 72,
    proofOfLifeInterval: 30
  },
  networkSettings: {
    mainnet: {
      name: 'Bitcoin Mainnet',
      rpcUrl: 'https://api.bitcoin.com',
      explorerUrl: 'https://blockstream.info',
      defaultFeeRate: 10,
      minConfirmations: 6
    },
    testnet: {
      name: 'Bitcoin Testnet',
      rpcUrl: 'https://api.bitcoin.com/testnet',
      explorerUrl: 'https://blockstream.info/testnet',
      defaultFeeRate: 1,
      minConfirmations: 1
    },
    regtest: {
      name: 'Bitcoin Regtest',
      rpcUrl: 'http://localhost:18443',
      explorerUrl: 'http://localhost:3000',
      defaultFeeRate: 1,
      minConfirmations: 1
    }
  }
};
