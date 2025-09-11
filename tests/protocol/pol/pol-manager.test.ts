/**
 * PoL Manager Tests
 * 
 * Tests for the Proof of Life Manager functionality
 */

import { PoLManager, PoLManagerConfig, createPoLManager } from '@/protocol/pol/manager';
import { PoLKeyPair, PoLProof, PoLStatus } from '@/protocol/pol/types';
import { DEFAULT_POL_CONFIG, DEFAULT_HEARTBEAT_CONFIG, DEFAULT_VERIFICATION_CONFIG, DEFAULT_WEBAUTHN_CONFIG } from '@/protocol/pol/manager';

// Mock implementations
const mockWebAuthn = {
  isSupported: jest.fn(() => true),
  enrollCredential: jest.fn(),
  authenticate: jest.fn(),
  verifySignature: jest.fn(),
};

const mockKeyManager = {
  getKeyPair: jest.fn(),
  generateKeyPair: jest.fn(),
  encryptPrivateKey: jest.fn(),
  decryptPrivateKey: jest.fn(),
  signData: jest.fn(),
  verifySignature: jest.fn(),
};

const mockHeartbeat = {
  initialize: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  performCheckIn: jest.fn(),
  performEmergencyCheckIn: jest.fn(),
  isRunning: jest.fn(),
  getStatus: jest.fn(),
  updateConfig: jest.fn(),
  updateHeartbeatConfig: jest.fn(),
  destroy: jest.fn(),
};

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

const mockServerAPI = {
  submitProof: jest.fn(),
  getStatus: jest.fn(),
  getProofs: jest.fn(),
  enrollWallet: jest.fn(),
  revokeEnrollment: jest.fn(),
  triggerRecovery: jest.fn(),
  verifyProof: jest.fn(),
};

// Jest mocks
jest.mock('@/protocol/pol/webauthn', () => ({
  WebAuthnManager: jest.fn(() => mockWebAuthn),
  WebAuthnConfig: {},
}));

jest.mock('@/protocol/pol/storage', () => ({
  createClientStorage: jest.fn(() => mockStorage),
}));

jest.mock('@/protocol/pol/keygen', () => ({
  PoLKeyManager: jest.fn(() => mockKeyManager),
}));

jest.mock('@/protocol/pol/heartbeat', () => ({
  PoLHeartbeat: jest.fn(() => mockHeartbeat),
}));

jest.mock('@/protocol/pol/verifier', () => ({
  PoLVerifier: jest.fn(() => ({
    verifyProof: jest.fn(),
    addGuardian: jest.fn(),
    removeGuardian: jest.fn(),
    getGuardians: jest.fn(() => []),
    updateConfig: jest.fn(),
    getVerificationStats: jest.fn(() => ({
      totalVerifications: 0,
      successfulVerifications: 0,
      failedVerifications: 0,
      averageResponseTime: 0,
    })),
    createRecoveryTrigger: jest.fn(),
    destroy: jest.fn(),
  })),
}));

jest.mock('@/protocol/bitcoin/recovery-script', () => ({
  BitcoinRecoveryManager: jest.fn(() => ({
    createRecoveryScript: jest.fn(),
    createProofOfLifeTimeoutScript: jest.fn(),
    executeRecovery: jest.fn(),
  })),
}));

jest.mock('@/protocol/bitcoin/taproot', () => ({
  TaprootRecoveryManager: jest.fn(() => ({
    generateInternalKey: jest.fn(),
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
      await expect(manager.initialize()).resolves.not.toThrow();
    });

    it('should handle WebAuthn not supported', async () => {
      (mockWebAuthn.isSupported as jest.Mock).mockReturnValue(false);
      
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
      await expect(manager.initialize()).resolves.not.toThrow();
    });
  });

  describe('Enrollment', () => {
    it('should enroll wallet successfully', async () => {
      await manager.initialize();
      const result = await manager.enroll('testuser', 'Test User', true);
      expect(result).toBeDefined();
      expect(result.walletId).toBe('test_wallet_id');
    });

    it('should handle enrollment failure', async () => {
      (mockWebAuthn.enrollCredential as jest.Mock).mockRejectedValue(new Error('Enrollment failed'));
      
      await manager.initialize();
      await expect(manager.enroll('testuser', 'Test User', true)).rejects.toThrow();
    });
  });

  describe('Status Management', () => {
    it('should get status successfully', async () => {
      await manager.initialize();
      const status = await manager.getStatus();
      expect(status).toBeDefined();
      expect(mockServerAPI.getStatus).toHaveBeenCalledWith('test_wallet_id');
    });

    it('should get proof history successfully', async () => {
      await manager.initialize();
      const proofs = await manager.getProofHistory(5);
      expect(Array.isArray(proofs)).toBe(true);
      expect(mockServerAPI.getProofs).toHaveBeenCalledWith('test_wallet_id', 5);
    });

    it('should verify proof successfully', async () => {
      await manager.initialize();
      const result = await manager.verifyProof(mockProof);
      expect(result.isValid).toBe(true);
      expect(mockServerAPI.verifyProof).toHaveBeenCalledWith(mockProof);
    });
  });

  describe('Recovery', () => {
    it('should trigger recovery successfully', async () => {
      await manager.initialize();
      
      const result = await manager.triggerRecovery('manual');
      expect(result).toBeDefined();
      expect(result.walletId).toBe('test_wallet_id');
      expect(result.reason).toBe('manual');
    });

    it('should handle recovery trigger failure', async () => {
      await manager.initialize();
      
      (mockServerAPI.triggerRecovery as jest.Mock).mockRejectedValue(new Error('Recovery trigger failed'));
      
      await expect(manager.triggerRecovery('manual')).rejects.toThrow();
    });
  });

  describe('Revocation', () => {
    it('should revoke enrollment successfully', async () => {
      await manager.initialize();
      
      await expect(manager.revokeEnrollment()).resolves.not.toThrow();
      expect(mockServerAPI.revokeEnrollment).toHaveBeenCalledWith('test_wallet_id');
      expect(mockStorage.clearStorage).toHaveBeenCalledWith('test_wallet_id');
    });

    it('should handle revocation failure', async () => {
      await manager.initialize();
      
      (mockServerAPI.revokeEnrollment as jest.Mock).mockRejectedValue(new Error('Revocation failed'));
      
      await expect(manager.revokeEnrollment()).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle key pair loading errors', async () => {
      (mockKeyManager.getKeyPair as jest.Mock).mockRejectedValue(new Error('Key pair loading failed'));
      
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
      await expect(errorManager.initialize()).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      (mockKeyManager.getKeyPair as jest.Mock).mockResolvedValue(mockKeyPair);
      
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
      (mockServerAPI.getStatus as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      await expect(errorManager.getStatus()).rejects.toThrow();
    });

    it('should handle key generation errors', async () => {
      (mockKeyManager.generateKeyPair as jest.Mock).mockRejectedValue(new Error('Key generation failed'));
      
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
      await expect(errorManager.initialize()).rejects.toThrow();
    });

    it('should handle createPoLManager factory function', async () => {
      (mockKeyManager.getKeyPair as jest.Mock).mockResolvedValue(mockKeyPair);
      
      const config: PoLManagerConfig = {
        walletId: 'test_wallet_id',
        storage: mockStorage as any,
        serverAPI: mockServerAPI as any,
        webAuthnConfig: DEFAULT_WEBAUTHN_CONFIG,
        polConfig: DEFAULT_POL_CONFIG,
        heartbeatConfig: DEFAULT_HEARTBEAT_CONFIG,
        verificationConfig: DEFAULT_VERIFICATION_CONFIG,
      };

      const manager = await createPoLManager(config);
      expect(manager).toBeInstanceOf(PoLManager);
    });
  });
});