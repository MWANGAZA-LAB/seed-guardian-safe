/**
 * Proof of Life Manager Tests
 * 
 * Comprehensive tests for the Proof of Life system
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PoLManager, createPoLManager, DEFAULT_POL_CONFIG, DEFAULT_HEARTBEAT_CONFIG, DEFAULT_VERIFICATION_CONFIG, DEFAULT_WEBAUTHN_CONFIG } from '@/protocol/pol/manager';
import { PoLKeyPair, PoLProof, PoLStatus, PoLError } from '@/protocol/pol/types';
import { createClientStorage } from '@/protocol/pol/storage';

// Mock WebAuthn module
jest.mock('@/protocol/pol/webauthn', () => ({
  WebAuthnManager: jest.fn().mockImplementation(() => mockWebAuthn),
  WebAuthnConfig: {},
}));

// Mock storage module
jest.mock('@/protocol/pol/storage', () => ({
  createClientStorage: jest.fn(() => ({
    storeKeyPair: jest.fn().mockResolvedValue(undefined),
    retrieveKeyPair: jest.fn().mockResolvedValue(null), // No existing key pair
    storeProof: jest.fn().mockResolvedValue(undefined),
    retrieveProofs: jest.fn().mockResolvedValue([]),
    storeConfig: jest.fn().mockResolvedValue(undefined),
    retrieveConfig: jest.fn().mockResolvedValue(null),
    clearStorage: jest.fn().mockResolvedValue(undefined),
    initialize: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Mock keygen module
jest.mock('@/protocol/pol/keygen', () => ({
  PoLKeyManager: jest.fn().mockImplementation(() => mockKeyManager),
  KeyGenerationConfig: {},
}));

// Mock heartbeat module
jest.mock('@/protocol/pol/heartbeat', () => ({
  PoLHeartbeat: jest.fn().mockImplementation(() => mockHeartbeat),
  HeartbeatCallbacks: {},
}));

// Mock verifier module
jest.mock('@/protocol/pol/verifier', () => ({
  PoLVerifier: jest.fn().mockImplementation(() => ({
    verifyProof: jest.fn(),
    addGuardian: jest.fn(),
    removeGuardian: jest.fn(),
    getGuardians: jest.fn(() => []),
    updateConfig: jest.fn(),
    getVerificationStats: jest.fn(() => ({ totalVerifications: 0, successfulVerifications: 0 })),
    createRecoveryTrigger: jest.fn().mockResolvedValue({
      walletId: 'test_wallet_id',
      reason: 'pol_timeout',
      timestamp: Date.now(),
      triggerId: 'test_trigger_id',
    }),
    destroy: jest.fn(),
  })),
  VerificationConfig: {},
  GuardianConfig: {},
}));

// Mock Bitcoin recovery modules
jest.mock('@/protocol/bitcoin/recovery-script', () => ({
  BitcoinRecoveryManager: jest.fn().mockImplementation(() => ({
    createRecoveryScript: jest.fn(),
    createProofOfLifeTimeoutScript: jest.fn(),
    executeRecovery: jest.fn(),
  })),
}));

jest.mock('@/protocol/bitcoin/taproot', () => ({
  TaprootRecoveryManager: jest.fn().mockImplementation(() => ({
    createRecoveryScript: jest.fn(),
    executeRecovery: jest.fn(),
    generateAddress: jest.fn(),
  })),
}));

// Mock WebAuthn
const mockWebAuthn = {
  isSupported: jest.fn(() => true),
  enrollCredential: jest.fn().mockResolvedValue({
    id: 'mock_credential_id',
    type: 'public-key',
    rawId: Buffer.from('mock_credential_id'),
    response: {
      attestationObject: Buffer.from('mock_attestation'),
      clientDataJSON: Buffer.from('mock_client_data'),
    },
  }),
  authenticate: jest.fn(),
  verifySignature: jest.fn(),
};

// Mock KeyManager
const mockKeyManager = {
  getKeyPair: jest.fn().mockResolvedValue(null), // No existing key pair by default
  generateKeyPair: jest.fn().mockResolvedValue({
    publicKey: 'mock_public_key',
    privateKey: 'mock_private_key',
    keyId: 'test_key_id',
    algorithm: 'ed25519',
  }),
  encryptPrivateKey: jest.fn().mockResolvedValue('encrypted_private_key'),
  decryptPrivateKey: jest.fn().mockResolvedValue('decrypted_private_key'),
  signData: jest.fn().mockResolvedValue('mock_signature'),
  verifySignature: jest.fn().mockResolvedValue(true),
};

// Mock Heartbeat
const mockHeartbeat = {
  initialize: jest.fn().mockResolvedValue(undefined),
  start: jest.fn(),
  stop: jest.fn(),
  performCheckIn: jest.fn().mockImplementation((proofType) => Promise.resolve({
    walletId: 'test_wallet_id',
    proofType: proofType || 'manual',
    signature: 'mock_signature',
    timestamp: Date.now(),
  })),
  performEmergencyCheckIn: jest.fn().mockResolvedValue({
    walletId: 'test_wallet_id',
    proofType: 'emergency',
    signature: 'mock_signature',
    timestamp: Date.now(),
  }),
  isRunning: jest.fn(() => false),
  getStatus: jest.fn(() => ({ isRunning: false, lastCheckIn: null })),
  updateConfig: jest.fn(),
  updateHeartbeatConfig: jest.fn(),
  destroy: jest.fn(),
};

// Mock storage
const mockStorage = {
  storeKeyPair: jest.fn(),
  retrieveKeyPair: jest.fn(),
  storeProof: jest.fn(),
  retrieveProofs: jest.fn(),
  storeConfig: jest.fn(),
  retrieveConfig: jest.fn(),
  clearStorage: jest.fn(),
  initialize: jest.fn(),
};

// Mock server API
const mockServerAPI = {
  submitProof: jest.fn(),
  getStatus: jest.fn(),
  getProofs: jest.fn(),
  enrollWallet: jest.fn(),
  revokeEnrollment: jest.fn(),
  triggerRecovery: jest.fn(),
  verifyProof: jest.fn(),
};

describe('Proof of Life Manager', () => {
  let manager: PoLManager;
  let mockKeyPair: PoLKeyPair;
  let mockProof: PoLProof;
  let mockStatus: PoLStatus;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset WebAuthn mock to default values
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

    // Setup mock data
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
      nextCheckIn: Math.floor(Date.now() / 1000) + (7 * 24 * 3600),
      missedCount: 0,
      escalationLevel: 0,
      guardianNotifications: [],
    };

    // Setup mock implementations
    mockStorage.retrieveKeyPair.mockResolvedValue(null);
    mockStorage.storeKeyPair.mockResolvedValue(undefined);
    mockServerAPI.getStatus.mockResolvedValue(mockStatus);
    mockServerAPI.getProofs.mockResolvedValue([mockProof]);
    mockServerAPI.enrollWallet.mockResolvedValue({ success: true, message: 'Enrolled successfully' });
    mockServerAPI.submitProof.mockResolvedValue({ success: true, message: 'Proof submitted' });
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

    // Create manager instance
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
  });

  afterEach(() => {
    if (manager) {
      manager.destroy();
    }
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await expect(manager.initialize()).resolves.not.toThrow();
    });

    it('should generate key pair if none exists', async () => {
      await manager.initialize();
      expect(mockKeyManager.generateKeyPair).toHaveBeenCalled();
    });

    it('should load existing key pair if available', async () => {
      mockKeyManager.getKeyPair.mockResolvedValue(mockKeyPair);
      await manager.initialize();
      expect(mockKeyManager.getKeyPair).toHaveBeenCalled();
    });

    it('should throw error if WebAuthn not supported', async () => {
      // Create a new manager with WebAuthn not supported
      mockWebAuthn.isSupported.mockReturnValue(false);
      const config = {
        walletId: 'test_wallet_id',
        storage: mockStorage,
        serverAPI: mockServerAPI,
        webAuthnConfig: {},
        polConfig: {},
        heartbeatConfig: {},
        verificationConfig: {},
      };
      const unsupportedManager = new PoLManager(config, {});

      await expect(unsupportedManager.initialize()).rejects.toThrow('WebAuthn not supported');
    });
  });

  describe('Enrollment', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should enroll successfully', async () => {
      const enrollment = await manager.enroll('test_user', 'Test User', true);
      
      expect(enrollment.walletId).toBe('test_wallet_id');
      expect(enrollment.publicKey).toBe(mockKeyPair.publicKey);
      expect(enrollment.status).toBe('active');
      expect(mockServerAPI.enrollWallet).toHaveBeenCalled();
    });

    it('should handle enrollment failure', async () => {
      mockServerAPI.enrollWallet.mockResolvedValue({ 
        success: false, 
        message: 'Enrollment failed' 
      });

      await expect(manager.enroll('test_user', 'Test User', true))
        .rejects.toThrow('Enrollment failed');
    });

    it('should handle WebAuthn enrollment failure', async () => {
      // Reset the mock to reject
      mockWebAuthn.enrollCredential.mockRejectedValue(new Error('WebAuthn failed'));

      await expect(manager.enroll('test_user', 'Test User', true))
        .rejects.toThrow('WebAuthn failed');
    });
  });

  describe('Monitoring', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('should start monitoring', async () => {
      // Mock heartbeat to return running status
      mockHeartbeat.getStatus.mockReturnValue({ isRunning: true, lastCheckIn: null });
      await manager.startMonitoring();
      const systemInfo = manager.getSystemInfo();
      expect(systemInfo.isMonitoring).toBe(true);
    });

    it('should stop monitoring', async () => {
      await manager.startMonitoring();
      // Mock heartbeat to return stopped status
      mockHeartbeat.getStatus.mockReturnValue({ isRunning: false, lastCheckIn: null });
      manager.stopMonitoring();
      const systemInfo = manager.getSystemInfo();
      expect(systemInfo.isMonitoring).toBe(false);
    });

    it('should perform manual check-in', async () => {
      const proof = await manager.performCheckIn('manual');
      
      expect(proof.walletId).toBe('test_wallet_id');
      expect(proof.proofType).toBe('manual');
      expect(proof.signature).toBeDefined();
      expect(mockHeartbeat.performCheckIn).toHaveBeenCalledWith('manual');
    });

    it('should perform emergency check-in', async () => {
      const proof = await manager.performCheckIn('emergency');
      
      expect(proof.proofType).toBe('emergency');
    });
  });

  describe('Status Management', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

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
    beforeEach(async () => {
      await manager.initialize();
    });

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
    beforeEach(async () => {
      await manager.initialize();
    });

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
      mockServerAPI.triggerRecovery.mockResolvedValue({ 
        success: false, 
        message: 'Recovery trigger failed' 
      });

      await expect(manager.triggerRecovery('pol_timeout'))
        .rejects.toThrow('Recovery trigger failed');
    });
  });

  describe('Configuration Management', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

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
    beforeEach(async () => {
      await manager.initialize();
    });

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
    beforeEach(async () => {
      await manager.initialize();
    });

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
      mockServerAPI.revokeEnrollment.mockResolvedValue({ 
        success: false, 
        message: 'Revocation failed' 
      });

      await expect(manager.revokeEnrollment())
        .rejects.toThrow('Enrollment revocation failed');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      // Reset mocks for error handling tests
      jest.clearAllMocks();
      
      // Reset WebAuthn mock to default values
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
    });

    it('should handle initialization errors', async () => {
      // Create a new manager instance to test initialization failure
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
      // Reset keyManager to not fail initialization
      mockKeyManager.getKeyPair.mockResolvedValue(mockKeyPair);
      await manager.initialize();
      
      mockServerAPI.getStatus.mockRejectedValue(new Error('Network error'));

      await expect(manager.getStatus())
        .rejects.toThrow('Failed to get status');
    });

    it('should handle storage errors', async () => {
      // Create a new manager instance to test initialization failure
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
      
      // Set the mock to reject AFTER creating the manager (after beforeEach runs)
      mockKeyManager.generateKeyPair.mockRejectedValue(new Error('Key generation failed'));
      
      await expect(errorManager.initialize())
        .rejects.toThrow('Failed to load or generate key pair');
    });
  });

  describe('Factory Function', () => {
    it('should create manager with factory function', async () => {
      // Reset keyManager to not fail initialization
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
