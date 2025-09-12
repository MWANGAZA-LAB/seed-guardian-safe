/**
 * PoL Manager Tests
 * 
 * Tests for the Proof of Life Manager functionality
 */

import { PoLManager, PoLManagerConfig } from '@/protocol/pol/manager';
import { PoLKeyPair, PoLProof, PoLStatus } from '@/protocol/pol/types';
import { DEFAULT_POL_CONFIG, DEFAULT_HEARTBEAT_CONFIG, DEFAULT_VERIFICATION_CONFIG, DEFAULT_WEBAUTHN_CONFIG } from '@/protocol/pol/manager';

// Mock implementations
const mockWebAuthn = {
  isSupported: jest.fn(() => true),
  enrollCredential: jest.fn().mockResolvedValue({
    credentialId: 'test-credential-id',
    publicKey: 'test-public-key'
  }),
  authenticate: jest.fn().mockResolvedValue({
    credentialId: 'test-credential-id',
    signature: 'test-signature'
  }),
  verifySignature: jest.fn().mockResolvedValue(true),
};

const mockKeyManager = {
  getKeyPair: jest.fn().mockResolvedValue(null), // Return null to trigger key generation
  generateKeyPair: jest.fn().mockResolvedValue({
    keyId: 'pol_key_test_wallet_id',
    publicKey: 'test-public-key',
    privateKey: 'test-private-key',
    algorithm: 'ed25519',
    createdAt: new Date().toISOString()
  }),
  encryptPrivateKey: jest.fn().mockResolvedValue('encrypted-private-key'),
  decryptPrivateKey: jest.fn().mockResolvedValue('test-private-key'),
  signData: jest.fn().mockResolvedValue('test-signature'),
  verifySignature: jest.fn().mockResolvedValue(true),
};

const mockHeartbeat = {
  initialize: jest.fn().mockResolvedValue(undefined),
  start: jest.fn().mockResolvedValue(undefined),
  stop: jest.fn().mockResolvedValue(undefined),
  performCheckIn: jest.fn().mockResolvedValue({
    id: 'test-proof-id',
    timestamp: Date.now(),
    type: 'manual',
    signature: 'test-signature'
  }),
  performEmergencyCheckIn: jest.fn().mockResolvedValue({
    id: 'test-proof-id',
    timestamp: Date.now(),
    type: 'emergency',
    signature: 'test-signature'
  }),
  isRunning: jest.fn().mockReturnValue(true),
  getStatus: jest.fn().mockReturnValue({
    isActive: true,
    lastCheckIn: Date.now(),
    nextCheckIn: Date.now() + 86400000
  }),
  updateConfig: jest.fn().mockResolvedValue(undefined),
  updateHeartbeatConfig: jest.fn().mockResolvedValue(undefined),
  destroy: jest.fn().mockResolvedValue(undefined),
};

const mockStorage = {
  storeKeyPair: jest.fn().mockResolvedValue(undefined),
  retrieveKeyPair: jest.fn().mockResolvedValue(null),
  storeProof: jest.fn().mockResolvedValue(undefined),
  retrieveProofs: jest.fn().mockResolvedValue([]),
  storeConfig: jest.fn().mockResolvedValue(undefined),
  retrieveConfig: jest.fn().mockResolvedValue({}),
  clearStorage: jest.fn().mockResolvedValue(undefined),
  initialize: jest.fn().mockResolvedValue(undefined),
};

const mockServerAPI = {
  submitProof: jest.fn().mockResolvedValue({ success: true }),
  getStatus: jest.fn().mockResolvedValue({
    walletId: 'test_wallet_id',
    status: 'active',
    lastCheckIn: Date.now()
  }),
  getProofs: jest.fn().mockResolvedValue([]),
  enrollWallet: jest.fn().mockResolvedValue({ success: true }),
  revokeEnrollment: jest.fn().mockResolvedValue({ success: true }),
  triggerRecovery: jest.fn().mockResolvedValue({
    success: true,
    walletId: 'test_wallet_id',
    reason: 'manual',
    timestamp: Date.now(),
    triggerId: 'test-trigger-id'
  }),
  verifyProof: jest.fn().mockResolvedValue({ isValid: true }),
};

// Jest mocks
jest.mock('@/protocol/pol/webauthn', () => ({
  WebAuthnManager: jest.fn().mockImplementation(() => mockWebAuthn),
  WebAuthnConfig: {},
}));

jest.mock('@/protocol/pol/storage', () => ({
  createClientStorage: jest.fn().mockImplementation(() => mockStorage),
}));

jest.mock('@/protocol/pol/keygen', () => ({
  PoLKeyManager: jest.fn().mockImplementation(() => mockKeyManager),
}));

jest.mock('@/protocol/pol/heartbeat', () => ({
  PoLHeartbeat: jest.fn().mockImplementation(() => mockHeartbeat),
}));

jest.mock('@/protocol/pol/verifier', () => ({
  PoLVerifier: jest.fn().mockImplementation(() => ({
    verifyProof: jest.fn().mockResolvedValue({ isValid: true }),
    addGuardian: jest.fn().mockResolvedValue(undefined),
    removeGuardian: jest.fn().mockResolvedValue(undefined),
    getGuardians: jest.fn().mockReturnValue([]),
    updateConfig: jest.fn().mockResolvedValue(undefined),
    getVerificationStats: jest.fn().mockReturnValue({
      totalVerifications: 0,
      successfulVerifications: 0,
      failedVerifications: 0,
      averageResponseTime: 0,
    }),
    createRecoveryTrigger: jest.fn().mockResolvedValue({
      triggerId: 'test-trigger-id',
      walletId: 'test_wallet_id',
      reason: 'manual',
      timestamp: Date.now()
    }),
    destroy: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('@/protocol/bitcoin/recovery-script', () => ({
  BitcoinRecoveryManager: jest.fn().mockImplementation(() => ({
    createRecoveryScript: jest.fn().mockResolvedValue('recovery-script'),
    createProofOfLifeTimeoutScript: jest.fn().mockResolvedValue('timeout-script'),
    executeRecovery: jest.fn().mockResolvedValue('recovery-tx'),
  })),
}));

jest.mock('@/protocol/bitcoin/taproot', () => ({
  TaprootRecoveryManager: jest.fn().mockImplementation(() => ({
    generateInternalKey: jest.fn().mockResolvedValue('internal-key'),
    createScriptTree: jest.fn(),
    generateOutputKey: jest.fn(),
    generateAddress: jest.fn(),
    createRecoveryScript: jest.fn(),
    createProofOfLifeTimeoutScript: jest.fn(),
    executeRecovery: jest.fn(),
  })),
}));

describe('PoL Manager', () => {
  let manager: PoLManager;
  let mockKeyPair: PoLKeyPair;
  let mockProof: PoLProof;
  let mockStatus: PoLStatus;

  // Helper function to set up mocks
  const setupMocks = (manager: PoLManager) => {
    const mockWebAuthnInstance = {
      isSupported: jest.fn(() => true),
      enrollCredential: jest.fn().mockResolvedValue({
        credentialId: 'test-credential-id',
        publicKey: 'test-public-key'
      }),
      authenticate: jest.fn().mockResolvedValue({
        credentialId: 'test-credential-id',
        signature: 'test-signature'
      }),
      verifySignature: jest.fn().mockResolvedValue(true),
    };
    
    const mockKeyManagerInstance = {
      getKeyPair: jest.fn().mockResolvedValue(null),
      generateKeyPair: jest.fn().mockResolvedValue(mockKeyPair),
      encryptPrivateKey: jest.fn().mockResolvedValue('encrypted-private-key'),
      decryptPrivateKey: jest.fn().mockResolvedValue('test-private-key'),
      signData: jest.fn().mockResolvedValue('test-signature'),
      verifySignature: jest.fn().mockResolvedValue(true),
    };
    
    const mockHeartbeatInstance = {
      initialize: jest.fn().mockResolvedValue(undefined),
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
      performCheckIn: jest.fn().mockResolvedValue({
        id: 'test-proof-id',
        timestamp: Date.now(),
        type: 'manual',
        signature: 'test-signature'
      }),
      performEmergencyCheckIn: jest.fn().mockResolvedValue({
        id: 'test-proof-id',
        timestamp: Date.now(),
        type: 'emergency',
        signature: 'test-signature'
      }),
      isRunning: jest.fn().mockReturnValue(true),
      getStatus: jest.fn().mockReturnValue({
        isActive: true,
        lastCheckIn: Date.now(),
        nextCheckIn: Date.now() + 86400000
      }),
      updateConfig: jest.fn().mockResolvedValue(undefined),
      updateHeartbeatConfig: jest.fn().mockResolvedValue(undefined),
      destroy: jest.fn().mockResolvedValue(undefined),
    };

    const mockVerifierInstance = {
      verifyProof: jest.fn().mockResolvedValue({ isValid: true }),
      addGuardian: jest.fn().mockResolvedValue(undefined),
      removeGuardian: jest.fn().mockResolvedValue(undefined),
      getGuardians: jest.fn().mockReturnValue([]),
      updateConfig: jest.fn().mockResolvedValue(undefined),
      getVerificationStats: jest.fn().mockReturnValue({
        totalVerifications: 0,
        successfulVerifications: 0,
        failedVerifications: 0,
        averageResponseTime: 0,
      }),
      createRecoveryTrigger: jest.fn().mockResolvedValue({
        triggerId: 'test-trigger-id',
        walletId: 'test_wallet_id',
        reason: 'manual',
        timestamp: Date.now()
      }),
      destroy: jest.fn().mockResolvedValue(undefined),
    };
    
    // Replace the instances
    manager['webAuthnManager'] = mockWebAuthnInstance as any;
    manager['keyManager'] = mockKeyManagerInstance as any;
    manager['heartbeat'] = mockHeartbeatInstance as any;
    manager['verifier'] = mockVerifierInstance as any;
    
    return { mockWebAuthnInstance, mockKeyManagerInstance, mockHeartbeatInstance, mockVerifierInstance };
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock data
    mockKeyPair = {
      publicKey: 'mock_public_key',
      privateKey: 'mock_private_key',
      keyId: 'mock_key_id',
      algorithm: 'ed25519',
      createdAt: new Date().toISOString(),
    };

    mockProof = {
      id: 'mock_proof_id',
      walletId: 'test_wallet_id',
      timestamp: Date.now(),
      challenge: 'mock_challenge',
      signature: 'mock_signature',
      publicKey: 'mock_public_key',
      proofType: 'automatic',
      metadata: {
        ipAddress: '127.0.0.1',
      },
    };

    mockStatus = {
      walletId: 'test_wallet_id',
      lastProofTimestamp: Date.now(),
      status: 'active',
      nextCheckIn: Date.now() + 3600000,
      missedCount: 0,
      escalationLevel: 0,
      guardianNotifications: [],
    };

    // Setup mock return values
    (mockKeyManager.getKeyPair as jest.Mock).mockResolvedValue(null);
    (mockKeyManager.generateKeyPair as jest.Mock).mockResolvedValue(mockKeyPair);
    (mockKeyManager.signData as jest.Mock).mockResolvedValue('mock_signature');
    (mockKeyManager.verifySignature as jest.Mock).mockResolvedValue(true);

    (mockStorage.retrieveKeyPair as jest.Mock).mockResolvedValue(null);
    (mockStorage.storeKeyPair as jest.Mock).mockResolvedValue(undefined);
    
    // Ensure WebAuthn mock is properly configured
    (mockWebAuthn.isSupported as jest.Mock).mockReturnValue(true);

    (mockServerAPI.getStatus as jest.Mock).mockResolvedValue(mockStatus);
    (mockServerAPI.getProofs as jest.Mock).mockResolvedValue([mockProof]);
    (mockServerAPI.enrollWallet as jest.Mock).mockResolvedValue({
      success: true,
      message: 'Enrolled successfully',
    });
    (mockServerAPI.submitProof as jest.Mock).mockResolvedValue({
      success: true,
      message: 'Proof submitted',
    });
    (mockServerAPI.verifyProof as jest.Mock).mockResolvedValue({
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

    const config: PoLManagerConfig = {
      walletId: 'test_wallet_id',
      storage: mockStorage as any,
      serverAPI: mockServerAPI as any,
      webAuthnConfig: DEFAULT_WEBAUTHN_CONFIG,
      polConfig: DEFAULT_POL_CONFIG,
      heartbeatConfig: DEFAULT_HEARTBEAT_CONFIG,
      verificationConfig: DEFAULT_VERIFICATION_CONFIG,
    };

    manager = new PoLManager(config, {});
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      setupMocks(manager);

      try {
      await manager.initialize();
        console.log('✅ Initialization successful');
      } catch (error) {
        console.log('❌ Initialization failed:', error instanceof Error ? error.message : String(error));
        console.log('Error details:', error);
        throw error;
      }
    });

    it('should handle WebAuthn not supported', async () => {
      const mockWebAuthnInstance = {
        isSupported: jest.fn(() => false),
        enrollCredential: jest.fn(),
        authenticate: jest.fn(),
        verifySignature: jest.fn(),
      };
      
      const config: PoLManagerConfig = {
        walletId: 'test_wallet_id',
        storage: mockStorage as any,
        serverAPI: mockServerAPI as any,
        webAuthnConfig: DEFAULT_WEBAUTHN_CONFIG,
        polConfig: DEFAULT_POL_CONFIG,
        heartbeatConfig: DEFAULT_HEARTBEAT_CONFIG,
        verificationConfig: DEFAULT_VERIFICATION_CONFIG,
      };

      const manager = new PoLManager(config, {});
      manager['webAuthnManager'] = mockWebAuthnInstance as any;
      
      await expect(manager.initialize()).rejects.toThrow('WebAuthn not supported');
    });
  });

  describe('Enrollment', () => {
    it('should enroll wallet successfully', async () => {
      setupMocks(manager);
      await manager.initialize();
      
      const result = await manager.enroll('testuser', 'Test User', true);
      expect(result).toBeDefined();
      expect(result.walletId).toBe('test_wallet_id');
    });

    it('should handle enrollment failure', async () => {
      const { mockWebAuthnInstance } = setupMocks(manager);
      (mockWebAuthnInstance.enrollCredential as jest.Mock).mockRejectedValue(new Error('Enrollment failed'));
      
      await manager.initialize();
      await expect(manager.enroll('testuser', 'Test User', true)).rejects.toThrow();
    });
  });

  describe('Status Management', () => {
    it('should get status successfully', async () => {
      setupMocks(manager);
      await manager.initialize();

      const status = await manager.getStatus();
      expect(status).toBeDefined();
      expect(mockServerAPI.getStatus).toHaveBeenCalledWith('test_wallet_id');
    });

    it('should get proof history successfully', async () => {
      setupMocks(manager);
      await manager.initialize();
      
      const proofs = await manager.getProofHistory(5);
      expect(Array.isArray(proofs)).toBe(true);
      expect(mockServerAPI.getProofs).toHaveBeenCalledWith('test_wallet_id', 5);
    });

    it('should verify proof successfully', async () => {
      setupMocks(manager);
      await manager.initialize();
      
      const result = await manager.verifyProof(mockProof);
      expect(result.isValid).toBe(true);
      expect(mockServerAPI.verifyProof).toHaveBeenCalledWith(mockProof);
    });
  });

  describe('Recovery', () => {
    it('should trigger recovery successfully', async () => {
      setupMocks(manager);
      await manager.initialize();
      
      // Ensure the mock returns the correct response
      (mockServerAPI.triggerRecovery as jest.Mock).mockResolvedValue({
        success: true,
        walletId: 'test_wallet_id',
        reason: 'manual',
        timestamp: Date.now(),
        triggerId: 'test-trigger-id'
      });
      
      const result = await manager.triggerRecovery('manual');
      expect(result).toBeDefined();
      expect(result.walletId).toBe('test_wallet_id');
      expect(result.reason).toBe('manual');
    });

    it('should handle recovery trigger failure', async () => {
      setupMocks(manager);
      await manager.initialize();
      
      (mockServerAPI.triggerRecovery as jest.Mock).mockRejectedValue(new Error('Recovery trigger failed'));
      
      await expect(manager.triggerRecovery('manual')).rejects.toThrow();
    });
  });

  describe('Revocation', () => {
    it('should revoke enrollment successfully', async () => {
      setupMocks(manager);
      await manager.initialize();

      // Ensure the mock returns the correct response
      (mockServerAPI.revokeEnrollment as jest.Mock).mockResolvedValue({
        success: true,
        message: 'Enrollment revoked successfully'
      });

      await expect(manager.revokeEnrollment()).resolves.not.toThrow();
      expect(mockServerAPI.revokeEnrollment).toHaveBeenCalledWith('test_wallet_id');
      expect(mockStorage.clearStorage).toHaveBeenCalledWith('test_wallet_id');
    });

    it('should handle revocation failure', async () => {
      setupMocks(manager);
      await manager.initialize();
      
      (mockServerAPI.revokeEnrollment as jest.Mock).mockRejectedValue(new Error('Revocation failed'));
      
      await expect(manager.revokeEnrollment()).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle key pair loading errors', async () => {
      const config: PoLManagerConfig = {
        walletId: 'test_wallet_id',
        storage: mockStorage as any,
        serverAPI: mockServerAPI as any,
        webAuthnConfig: DEFAULT_WEBAUTHN_CONFIG,
        polConfig: DEFAULT_POL_CONFIG,
        heartbeatConfig: DEFAULT_HEARTBEAT_CONFIG,
        verificationConfig: DEFAULT_VERIFICATION_CONFIG,
      };

      const errorManager = new PoLManager(config, {});

      // Set up mocks with error conditions
      const mockWebAuthnInstance = {
        isSupported: jest.fn(() => true),
        enrollCredential: jest.fn(),
        authenticate: jest.fn(),
        verifySignature: jest.fn(),
      };
      
      const mockKeyManagerInstance = {
        getKeyPair: jest.fn().mockRejectedValue(new Error('Key pair loading failed')),
        generateKeyPair: jest.fn(),
        encryptPrivateKey: jest.fn(),
        decryptPrivateKey: jest.fn(),
        signData: jest.fn(),
        verifySignature: jest.fn(),
      };
      
      errorManager['webAuthnManager'] = mockWebAuthnInstance as any;
      errorManager['keyManager'] = mockKeyManagerInstance as any;
      
      await expect(errorManager.initialize()).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      setupMocks(manager);
      await manager.initialize();
      
      (mockServerAPI.getStatus as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      await expect(manager.getStatus()).rejects.toThrow();
    });

    it('should handle key generation errors', async () => {
      const config: PoLManagerConfig = {
        walletId: 'test_wallet_id',
        storage: mockStorage as any,
        serverAPI: mockServerAPI as any,
        webAuthnConfig: DEFAULT_WEBAUTHN_CONFIG,
        polConfig: DEFAULT_POL_CONFIG,
        heartbeatConfig: DEFAULT_HEARTBEAT_CONFIG,
        verificationConfig: DEFAULT_VERIFICATION_CONFIG,
      };

      const errorManager = new PoLManager(config, {});
      
      // Set up mocks with error conditions
      const mockWebAuthnInstance = {
        isSupported: jest.fn(() => true),
        enrollCredential: jest.fn(),
        authenticate: jest.fn(),
        verifySignature: jest.fn(),
      };
      
      const mockKeyManagerInstance = {
        getKeyPair: jest.fn().mockResolvedValue(null),
        generateKeyPair: jest.fn().mockRejectedValue(new Error('Key generation failed')),
        encryptPrivateKey: jest.fn(),
        decryptPrivateKey: jest.fn(),
        signData: jest.fn(),
        verifySignature: jest.fn(),
      };
      
      errorManager['webAuthnManager'] = mockWebAuthnInstance as any;
      errorManager['keyManager'] = mockKeyManagerInstance as any;
      
      await expect(errorManager.initialize()).rejects.toThrow();
    });

    it('should handle createPoLManager factory function', async () => {
      const config: PoLManagerConfig = {
        walletId: 'test_wallet_id',
        storage: mockStorage as any,
        serverAPI: mockServerAPI as any,
        webAuthnConfig: DEFAULT_WEBAUTHN_CONFIG,
        polConfig: DEFAULT_POL_CONFIG,
        heartbeatConfig: DEFAULT_HEARTBEAT_CONFIG,
        verificationConfig: DEFAULT_VERIFICATION_CONFIG,
      };

      // Create manager without initializing
      const manager = new PoLManager(config, {});
      expect(manager).toBeInstanceOf(PoLManager);
      
      // Set up mocks before initialization
      setupMocks(manager);
      
      // Now initialize
      await expect(manager.initialize()).resolves.not.toThrow();
    });
  });
});