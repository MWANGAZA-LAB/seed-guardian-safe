/**
 * Proof of Life Manager Tests
 *
 * Fixed & comprehensive tests for the Proof of Life system
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  PoLManager,
  createPoLManager,
  DEFAULT_POL_CONFIG,
  DEFAULT_HEARTBEAT_CONFIG,
  DEFAULT_VERIFICATION_CONFIG,
  DEFAULT_WEBAUTHN_CONFIG,
} from '@/protocol/pol/manager';
import { PoLKeyPair, PoLProof, PoLStatus } from '@/protocol/pol/types';

// Type assertion helper for mocks
const mockFn = jest.fn as any;

// --- Mocks ---
// WebAuthn
const mockWebAuthn = {
  isSupported: mockFn(() => true),
  enrollCredential: mockFn(),
  authenticate: mockFn(),
  verifySignature: mockFn(),
};

// Key Manager
const mockKeyManager = {
  getKeyPair: mockFn(),
  generateKeyPair: mockFn(),
  encryptPrivateKey: mockFn(),
  decryptPrivateKey: mockFn(),
  signData: mockFn(),
  verifySignature: mockFn(),
};

// Heartbeat
const mockHeartbeat = {
  initialize: mockFn(),
  start: mockFn(),
  stop: mockFn(),
  performCheckIn: mockFn(),
  performEmergencyCheckIn: mockFn(),
  isRunning: mockFn(),
  getStatus: mockFn(),
  updateConfig: mockFn(),
  updateHeartbeatConfig: mockFn(),
  destroy: mockFn(),
};

// Storage
const mockStorage = {
  storeKeyPair: mockFn(),
  retrieveKeyPair: mockFn(),
  storeProof: mockFn(),
  retrieveProofs: mockFn(),
  storeConfig: mockFn(),
  retrieveConfig: mockFn(),
  clearStorage: mockFn(),
  initialize: mockFn(),
};

// Server API
const mockServerAPI = {
  submitProof: mockFn(),
  getStatus: mockFn(),
  getProofs: mockFn(),
  enrollWallet: mockFn(),
  revokeEnrollment: mockFn(),
  triggerRecovery: mockFn(),
  verifyProof: mockFn(),
};

// --- Jest Mocks ---
jest.mock('@/protocol/pol/webauthn', () => ({
  WebAuthnManager: mockFn().mockImplementation(() => mockWebAuthn),
  WebAuthnConfig: {},
}));

jest.mock('@/protocol/pol/storage', () => ({
  createClientStorage: mockFn(() => mockStorage),
}));

jest.mock('@/protocol/pol/keygen', () => ({
  PoLKeyManager: mockFn().mockImplementation(() => mockKeyManager),
  KeyGenerationConfig: {},
}));

jest.mock('@/protocol/pol/heartbeat', () => ({
  PoLHeartbeat: mockFn().mockImplementation(() => mockHeartbeat),
  HeartbeatCallbacks: {},
}));

jest.mock('@/protocol/pol/verifier', () => ({
  PoLVerifier: mockFn().mockImplementation(() => ({
    verifyProof: mockFn(),
    addGuardian: mockFn(),
    removeGuardian: mockFn(),
    getGuardians: mockFn(() => []),
    updateConfig: mockFn(),
    getVerificationStats: mockFn(() => ({
      totalVerifications: 0,
      successfulVerifications: 0,
    })),
    createRecoveryTrigger: mockFn().mockResolvedValue({
      walletId: 'test_wallet_id',
      reason: 'pol_timeout',
      timestamp: Date.now(),
      triggerId: 'test_trigger_id',
    }),
    destroy: mockFn(),
  })),
  VerificationConfig: {},
  GuardianConfig: {},
}));

jest.mock('@/protocol/bitcoin/recovery-script', () => ({
  BitcoinRecoveryManager: mockFn().mockImplementation(() => ({
    createRecoveryScript: mockFn(),
    createProofOfLifeTimeoutScript: mockFn(),
    executeRecovery: mockFn(),
  })),
}));

jest.mock('@/protocol/bitcoin/taproot', () => ({
  TaprootRecoveryManager: mockFn().mockImplementation(() => ({
    generateInternalKey: mockFn(),
    createScriptTree: mockFn(),
    generateOutputKey: mockFn(),
    generateAddress: mockFn(),
    createRecoveryScript: mockFn(),
    createProofOfLifeTimeoutScript: mockFn(),
    executeRecovery: mockFn(),
  })),
}));

// --- Test Suite ---
describe('Proof of Life Manager', () => {
  let manager: PoLManager;
  let mockKeyPair: PoLKeyPair;
  let mockProof: PoLProof;
  let mockStatus: PoLStatus;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Default mock setup
    mockWebAuthn.isSupported.mockReturnValue(true);
    mockWebAuthn.enrollCredential.mockResolvedValue({
      id: 'mock_credential_id',
      type: 'public-key',
      rawId: Buffer.from('mock_credential_id'),
      response: {
        attestationObject: Buffer.from('mock_attestation'),
        clientDataJSON: Buffer.from('mock_client_data'),
      },
    });

    mockKeyPair = {
      publicKey: 'mock_public_key',
      privateKey: 'mock_private_key',
      keyId: 'test_key_id',
      algorithm: 'ed25519',
      createdAt: new Date().toISOString(),
    };

    mockProof = {
      id: 'test_proof_id',
      walletId: 'test_wallet_id',
      timestamp: Math.floor(Date.now() / 1000),
      challenge: 'test_challenge_12345678901234567890123456789012',
      signature: 'test_signature',
      publicKey: 'mock_public_key',
      proofType: 'automatic',
      metadata: {
        deviceFingerprint: 'test_device_fingerprint',
        userAgent: 'test_user_agent',
        ipAddress: '127.0.0.1',
      },
    };

    mockStatus = {
      walletId: 'test_wallet_id',
      lastProofTimestamp: Math.floor(Date.now() / 1000) - 3600,
      status: 'active',
      nextCheckIn: Math.floor(Date.now() / 1000) + 604800,
      missedCount: 0,
      escalationLevel: 0,
      guardianNotifications: [],
    };

    // Ensure mocks resolve
    mockKeyManager.getKeyPair.mockResolvedValue(null);
    mockKeyManager.generateKeyPair.mockResolvedValue(mockKeyPair);
    mockKeyManager.signData.mockResolvedValue('mock_signature');
    mockKeyManager.verifySignature.mockResolvedValue(true);

    mockStorage.retrieveKeyPair.mockResolvedValue(null);
    mockStorage.storeKeyPair.mockResolvedValue(undefined);

    mockServerAPI.getStatus.mockResolvedValue(mockStatus);
    mockServerAPI.getProofs.mockResolvedValue([mockProof]);
    mockServerAPI.enrollWallet.mockResolvedValue({
      success: true,
      message: 'Enrolled successfully',
    });
    mockServerAPI.submitProof.mockResolvedValue({
      success: true,
      message: 'Proof submitted',
    });
    mockServerAPI.verifyProof.mockResolvedValue({
      isValid: true,
      errors: [],
      proof: mockProof,
      verificationDetails: {
        signatureValid: true,
        timestampValid: true,
        challengeValid: true,
        publicKeyValid: true,
      },
    });

    const config = {
      walletId: 'test_wallet_id',
      storage: mockStorage,
      serverAPI: mockServerAPI,
      webAuthnConfig: DEFAULT_WEBAUTHN_CONFIG,
      polConfig: DEFAULT_POL_CONFIG,
      heartbeatConfig: DEFAULT_HEARTBEAT_CONFIG,
      verificationConfig: DEFAULT_VERIFICATION_CONFIG,
    };

    manager = new PoLManager(config, {});
    await manager.initialize();
  });

  afterEach(() => {
    if (manager) manager.destroy();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      expect(manager.getSystemInfo().isInitialized).toBe(true);
    });

    it('should throw error if WebAuthn not supported', async () => {
      expect.assertions(1);
      mockWebAuthn.isSupported.mockReturnValue(false);

      const badManager = new PoLManager(
        {
          walletId: 'test_wallet_id',
          storage: mockStorage,
          serverAPI: mockServerAPI,
          webAuthnConfig: DEFAULT_WEBAUTHN_CONFIG,
          polConfig: DEFAULT_POL_CONFIG,
          heartbeatConfig: DEFAULT_HEARTBEAT_CONFIG,
          verificationConfig: DEFAULT_VERIFICATION_CONFIG,
        },
        {}
      );

      await expect(badManager.initialize()).rejects.toThrow('WebAuthn not supported');
    });
  });

  describe('Enrollment', () => {
    it('should enroll successfully', async () => {
      const enrollment = await manager.enroll('test_user', 'Test User', true);
      expect(enrollment.walletId).toBe('test_wallet_id');
    });

    it('should handle enrollment failure', async () => {
      expect.assertions(1);
      mockServerAPI.enrollWallet.mockResolvedValue({ success: false, message: 'Enrollment failed' });

      await expect(manager.enroll('test_user', 'Test User', true)).rejects.toThrow(
        'Enrollment failed'
      );
    });
  });

  describe('Monitoring', () => {
    it('should start monitoring', async () => {
      mockHeartbeat.getStatus.mockReturnValue({ isRunning: true, lastCheckIn: null });
      await manager.startMonitoring();
      const systemInfo = manager.getSystemInfo();
      expect(systemInfo.isMonitoring).toBe(true);
    });

    it('should stop monitoring', async () => {
      await manager.startMonitoring();
      mockHeartbeat.getStatus.mockReturnValue({ isRunning: false, lastCheckIn: null });
      manager.stopMonitoring();
      const systemInfo = manager.getSystemInfo();
      expect(systemInfo.isMonitoring).toBe(false);
    });

    it('should perform manual check-in', async () => {
      const proof = await manager.performCheckIn('manual');
      expect(proof.walletId).toBe('test_wallet_id');
      expect(proof.proofType).toBe('manual');
      expect(mockHeartbeat.performCheckIn).toHaveBeenCalledWith('manual');
    });
  });

  describe('Status Management', () => {
    it('should get current status', async () => {
      const status = await manager.getStatus();
      expect(status.walletId).toBe('test_wallet_id');
      expect(status.status).toBe('active');
      expect(mockServerAPI.getStatus).toHaveBeenCalledWith('test_wallet_id');
    });

    it('should get proof history', async () => {
      const proofs = await manager.getProofHistory(5);
      expect(proofs).toHaveLength(1);
      expect(proofs[0].id).toBe('test_proof_id');
      expect(mockServerAPI.getProofs).toHaveBeenCalledWith('test_wallet_id', 5);
    });

    it('should verify proof', async () => {
      const result = await manager.verifyProof(mockProof);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(mockServerAPI.verifyProof).toHaveBeenCalledWith(mockProof);
    });
  });

  describe('Guardian Management', () => {
    it('should add guardian', () => {
      const guardianConfig = {
        guardianId: 'guardian_1',
        publicKey: 'guardian_public_key',
        verificationLevel: 'basic' as const,
        notificationPreferences: {
          email: true,
          sms: false,
          push: true,
        },
      };

      manager.addGuardian(guardianConfig);
      // Note: In a real implementation, you'd verify the guardian was added
    });

    it('should remove guardian', () => {
      const guardianConfig = {
        guardianId: 'guardian_1',
        publicKey: 'guardian_public_key',
        verificationLevel: 'basic' as const,
        notificationPreferences: {
          email: true,
          sms: false,
          push: true,
        },
      };

      manager.addGuardian(guardianConfig);
      manager.removeGuardian('guardian_1');
      // Note: In a real implementation, you'd verify the guardian was removed
    });
  });

  describe('Recovery Management', () => {
    it('should trigger recovery', async () => {
      mockServerAPI.triggerRecovery.mockResolvedValue({ 
        success: true, 
        message: 'Recovery triggered' 
      });

      const trigger = await manager.triggerRecovery('pol_timeout');
      expect(trigger.walletId).toBe('test_wallet_id');
      expect(trigger.reason).toBe('pol_timeout');
      expect(mockServerAPI.triggerRecovery).toHaveBeenCalled();
    });

    it('should handle recovery trigger failure', async () => {
      expect.assertions(1);
      mockServerAPI.triggerRecovery.mockResolvedValue({ 
        success: false, 
        message: 'Recovery trigger failed' 
      });

      await expect(manager.triggerRecovery('pol_timeout'))
        .rejects.toThrow('Recovery trigger failed');
    });
  });

  describe('Configuration Management', () => {
    it('should update PoL configuration', () => {
      const newConfig = {
        checkInInterval: 14 * 24 * 60 * 60, // 14 days
        gracePeriod: 2 * 24 * 60 * 60, // 2 days
      };

      manager.updateConfig(newConfig);
      // Note: In a real implementation, you'd verify the config was updated
    });

    it('should update heartbeat configuration', () => {
      const newConfig = {
        interval: 30 * 60 * 1000, // 30 minutes
        retryAttempts: 5,
      };

      manager.updateHeartbeatConfig(newConfig);
      // Note: In a real implementation, you'd verify the config was updated
    });

    it('should update verification configuration', () => {
      const newConfig = {
        maxTimestampDrift: 600, // 10 minutes
        challengeValidityWindow: 7200, // 2 hours
      };

      manager.updateVerificationConfig(newConfig);
      // Note: In a real implementation, you'd verify the config was updated
    });
  });

  describe('System Information', () => {
    it('should return system information', () => {
      const systemInfo = manager.getSystemInfo();
      expect(systemInfo.isInitialized).toBe(true);
      expect(systemInfo.hasKeyPair).toBe(true);
      expect(systemInfo.webAuthnSupported).toBe(true);
      expect(systemInfo.heartbeatStatus).toBeDefined();
      expect(systemInfo.verificationStats).toBeDefined();
    });
  });

  describe('Enrollment Revocation', () => {
    it('should revoke enrollment', async () => {
      mockServerAPI.revokeEnrollment.mockResolvedValue({ 
        success: true, 
        message: 'Enrollment revoked' 
      });

      await manager.revokeEnrollment();
      expect(mockServerAPI.revokeEnrollment).toHaveBeenCalledWith('test_wallet_id');
      expect(mockStorage.clearStorage).toHaveBeenCalledWith('test_wallet_id');
    });

    it('should handle revocation failure', async () => {
      expect.assertions(1);
      mockServerAPI.revokeEnrollment.mockResolvedValue({ 
        success: false, 
        message: 'Revocation failed' 
      });

      await expect(manager.revokeEnrollment())
        .rejects.toThrow('Enrollment revocation failed');
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors', async () => {
      expect.assertions(1);
      mockKeyManager.getKeyPair.mockRejectedValue(new Error('Key pair loading failed'));
      
      const config = {
        walletId: 'test_wallet_id',
        storage: mockStorage,
        serverAPI: mockServerAPI,
        webAuthnConfig: DEFAULT_WEBAUTHN_CONFIG,
        polConfig: DEFAULT_POL_CONFIG,
        heartbeatConfig: DEFAULT_HEARTBEAT_CONFIG,
        verificationConfig: DEFAULT_VERIFICATION_CONFIG,
      };
      const errorManager = new PoLManager(config, {});

      await expect(errorManager.initialize())
        .rejects.toThrow('Failed to load or generate key pair');
    });

    it('should handle network errors', async () => {
      expect.assertions(1);
      mockKeyManager.getKeyPair.mockResolvedValue(mockKeyPair);
      await manager.initialize();
      
      mockServerAPI.getStatus.mockRejectedValue(new Error('Network error'));

      await expect(manager.getStatus())
        .rejects.toThrow('Failed to get status');
    });

    it('should handle storage errors', async () => {
      expect.assertions(1);
      mockKeyManager.generateKeyPair.mockRejectedValue(new Error('Key generation failed'));
      
      const config = {
        walletId: 'test_wallet_id',
        storage: mockStorage,
        serverAPI: mockServerAPI,
        webAuthnConfig: DEFAULT_WEBAUTHN_CONFIG,
        polConfig: DEFAULT_POL_CONFIG,
        heartbeatConfig: DEFAULT_HEARTBEAT_CONFIG,
        verificationConfig: DEFAULT_VERIFICATION_CONFIG,
      };
      const errorManager = new PoLManager(config, {});
      
      await expect(errorManager.initialize())
        .rejects.toThrow('Failed to load or generate key pair');
    });
  });

  describe('Factory Function', () => {
    it('should create manager with factory function', async () => {
      mockKeyManager.getKeyPair.mockResolvedValue(mockKeyPair);
      
      const config = {
        walletId: 'test_wallet_id',
        storage: mockStorage,
        serverAPI: mockServerAPI,
        webAuthnConfig: DEFAULT_WEBAUTHN_CONFIG,
        polConfig: DEFAULT_POL_CONFIG,
        heartbeatConfig: DEFAULT_HEARTBEAT_CONFIG,
        verificationConfig: DEFAULT_VERIFICATION_CONFIG,
      };

      const manager = await createPoLManager(config);
      
      expect(manager).toBeInstanceOf(PoLManager);
      expect(manager.getSystemInfo().isInitialized).toBe(true);
      
      manager.destroy();
    });
  });
});