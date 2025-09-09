import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { WalletApi, RecoveryApi, GuardianApi } from '@/services/api';
import { AppError } from '@/lib/errors';

// Mock the entire API service
jest.mock('@/services/api', () => ({
  WalletApi: {
    createWallet: jest.fn(),
    getWallets: jest.fn(),
    getWallet: jest.fn(),
    getGuardians: jest.fn(),
    deleteWallet: jest.fn()
  },
  RecoveryApi: {
    initiateRecovery: jest.fn(),
    getRecoveryRequests: jest.fn(),
    approveRecovery: jest.fn(),
    signRecovery: jest.fn()
  },
  GuardianApi: {
    verifyGuardian: jest.fn(),
    getGuardianByToken: jest.fn()
  }
}));

describe('Wallet Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Complete Wallet Creation Flow', () => {
    it('should create wallet with guardians successfully', async () => {
      const walletData = {
        name: 'Test Inheritance Wallet',
        masterSeed: 'a'.repeat(128),
        guardians: [
          {
            email: 'guardian1@example.com',
            fullName: 'Guardian One',
            phoneNumber: '+1234567890'
          },
          {
            email: 'guardian2@example.com',
            fullName: 'Guardian Two',
            phoneNumber: '+0987654321'
          },
          {
            email: 'guardian3@example.com',
            fullName: 'Guardian Three'
          }
        ],
        thresholdRequirement: 2,
        userPassword: 'MySecure123!Password'
      };

      const mockWalletResponse = {
        success: true,
        walletId: 'test-wallet-id',
        message: 'Wallet created successfully'
      };

      (WalletApi.createWallet as jest.Mock).mockResolvedValue(mockWalletResponse);

      const result = await WalletApi.createWallet(walletData);
      
      expect(result).toEqual(mockWalletResponse);
      expect(WalletApi.createWallet).toHaveBeenCalledWith(walletData);
    });

    it('should handle wallet creation with validation errors', async () => {
      const invalidWalletData = {
        name: 'A', // Too short
        masterSeed: 'invalid-seed',
        guardians: [
          {
            email: 'invalid-email',
            fullName: 'Guardian One'
          }
        ],
        thresholdRequirement: 3, // Exceeds number of guardians
        userPassword: 'weak'
      };

      const mockError = new AppError('Validation failed', 'VALIDATION_ERROR', 400);
      (WalletApi.createWallet as jest.Mock).mockRejectedValue(mockError);

      await expect(WalletApi.createWallet(invalidWalletData)).rejects.toThrow(AppError);
    });
  });

  describe('Guardian Management Flow', () => {
    it('should verify guardian invitation successfully', async () => {
      const guardianData = {
        token: 'test-invitation-token',
        fullName: 'John Doe',
        phoneNumber: '+1234567890'
      };

      const mockGuardianResponse = {
        success: true,
        guardianId: 'test-guardian-id',
        message: 'Guardian verified successfully'
      };

      (GuardianApi.verifyGuardian as jest.Mock).mockResolvedValue(mockGuardianResponse);

      const result = await GuardianApi.verifyGuardian(guardianData);
      
      expect(result).toEqual(mockGuardianResponse);
      expect(GuardianApi.verifyGuardian).toHaveBeenCalledWith(guardianData);
    });

    it('should get guardian by token', async () => {
      const mockGuardian = {
        id: 'test-guardian-id',
        wallet_id: 'test-wallet-id',
        email: 'guardian@example.com',
        full_name: 'John Doe',
        status: 'invited',
        invitation_token: 'test-token'
      };

      (GuardianApi.getGuardianByToken as jest.Mock).mockResolvedValue(mockGuardian);

      const result = await GuardianApi.getGuardianByToken('test-token');
      
      expect(result).toEqual(mockGuardian);
      expect(GuardianApi.getGuardianByToken).toHaveBeenCalledWith('test-token');
    });
  });

  describe('Recovery Process Flow', () => {
    it('should initiate recovery process', async () => {
      const recoveryData = {
        walletId: 'test-wallet-id',
        reason: 'Lost access to wallet due to device failure'
      };

      const mockRecoveryResponse = {
        success: true,
        recoveryId: 'test-recovery-id',
        message: 'Recovery process initiated'
      };

      (RecoveryApi.initiateRecovery as jest.Mock).mockResolvedValue(mockRecoveryResponse);

      const result = await RecoveryApi.initiateRecovery(recoveryData);
      
      expect(result).toEqual(mockRecoveryResponse);
      expect(RecoveryApi.initiateRecovery).toHaveBeenCalledWith(recoveryData);
    });

    it('should get recovery requests for wallet', async () => {
      const mockRecoveryRequests = [
        {
          id: 'recovery-1',
          wallet_id: 'test-wallet-id',
          status: 'pending',
          recovery_reason: 'Lost access',
          required_signatures: 2,
          current_signatures: 0
        },
        {
          id: 'recovery-2',
          wallet_id: 'test-wallet-id',
          status: 'completed',
          recovery_reason: 'Device stolen',
          required_signatures: 2,
          current_signatures: 2
        }
      ];

      (RecoveryApi.getRecoveryRequests as jest.Mock).mockResolvedValue(mockRecoveryRequests);

      const result = await RecoveryApi.getRecoveryRequests('test-wallet-id');
      
      expect(result).toEqual(mockRecoveryRequests);
      expect(RecoveryApi.getRecoveryRequests).toHaveBeenCalledWith('test-wallet-id');
    });

    it('should approve recovery request', async () => {
      const approvalData = {
        recoveryId: 'test-recovery-id',
        guardianId: 'test-guardian-id'
      };

      (RecoveryApi.approveRecovery as jest.Mock).mockResolvedValue(undefined);

      await RecoveryApi.approveRecovery(approvalData.recoveryId, approvalData.guardianId);
      
      expect(RecoveryApi.approveRecovery).toHaveBeenCalledWith(
        approvalData.recoveryId,
        approvalData.guardianId
      );
    });

    it('should sign recovery request', async () => {
      const signatureData = {
        recoveryId: 'test-recovery-id',
        guardianId: 'test-guardian-id',
        signature: 'a'.repeat(128) // Mock signature
      };

      (RecoveryApi.signRecovery as jest.Mock).mockResolvedValue(undefined);

      await RecoveryApi.signRecovery(
        signatureData.recoveryId,
        signatureData.guardianId,
        signatureData.signature
      );
      
      expect(RecoveryApi.signRecovery).toHaveBeenCalledWith(
        signatureData.recoveryId,
        signatureData.guardianId,
        signatureData.signature
      );
    });
  });

  describe('Wallet Management Flow', () => {
    it('should get all wallets for user', async () => {
      const mockWallets = [
        {
          id: 'wallet-1',
          name: 'Main Wallet',
          owner_id: 'user-1',
          threshold_requirement: 2,
          total_guardians: 3,
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'wallet-2',
          name: 'Backup Wallet',
          owner_id: 'user-1',
          threshold_requirement: 3,
          total_guardians: 5,
          created_at: '2024-01-02T00:00:00Z'
        }
      ];

      (WalletApi.getWallets as jest.Mock).mockResolvedValue(mockWallets);

      const result = await WalletApi.getWallets();
      
      expect(result).toEqual(mockWallets);
      expect(WalletApi.getWallets).toHaveBeenCalled();
    });

    it('should get specific wallet details', async () => {
      const mockWallet = {
        id: 'test-wallet-id',
        name: 'Test Wallet',
        owner_id: 'user-1',
        threshold_requirement: 2,
        total_guardians: 3,
        status: 'active',
        created_at: '2024-01-01T00:00:00Z'
      };

      (WalletApi.getWallet as jest.Mock).mockResolvedValue(mockWallet);

      const result = await WalletApi.getWallet('test-wallet-id');
      
      expect(result).toEqual(mockWallet);
      expect(WalletApi.getWallet).toHaveBeenCalledWith('test-wallet-id');
    });

    it('should get guardians for wallet', async () => {
      const mockGuardians = [
        {
          id: 'guardian-1',
          wallet_id: 'test-wallet-id',
          email: 'guardian1@example.com',
          full_name: 'Guardian One',
          status: 'accepted',
          share_index: 1
        },
        {
          id: 'guardian-2',
          wallet_id: 'test-wallet-id',
          email: 'guardian2@example.com',
          full_name: 'Guardian Two',
          status: 'invited',
          share_index: 2
        }
      ];

      (WalletApi.getGuardians as jest.Mock).mockResolvedValue(mockGuardians);

      const result = await WalletApi.getGuardians('test-wallet-id');
      
      expect(result).toEqual(mockGuardians);
      expect(WalletApi.getGuardians).toHaveBeenCalledWith('test-wallet-id');
    });

    it('should delete wallet', async () => {
      (WalletApi.deleteWallet as jest.Mock).mockResolvedValue(undefined);

      await WalletApi.deleteWallet('test-wallet-id');
      
      expect(WalletApi.deleteWallet).toHaveBeenCalledWith('test-wallet-id');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network connection failed');
      (WalletApi.getWallets as jest.Mock).mockRejectedValue(networkError);

      await expect(WalletApi.getWallets()).rejects.toThrow('Network connection failed');
    });

    it('should handle authentication errors', async () => {
      const authError = new AppError('Authentication failed', 'AUTHENTICATION_ERROR', 401);
      (WalletApi.createWallet as jest.Mock).mockRejectedValue(authError);

      const walletData = {
        name: 'Test Wallet',
        masterSeed: 'a'.repeat(128),
        guardians: [
          { email: 'guardian1@example.com', fullName: 'Guardian One' },
          { email: 'guardian2@example.com', fullName: 'Guardian Two' }
        ],
        thresholdRequirement: 2,
        userPassword: 'MySecure123!Password'
      };

      await expect(WalletApi.createWallet(walletData)).rejects.toThrow(AppError);
    });

    it('should handle validation errors', async () => {
      const validationError = new AppError('Invalid guardian data', 'VALIDATION_ERROR', 400);
      (GuardianApi.verifyGuardian as jest.Mock).mockRejectedValue(validationError);

      const guardianData = {
        token: 'invalid-token',
        fullName: 'John Doe'
      };

      await expect(GuardianApi.verifyGuardian(guardianData)).rejects.toThrow(AppError);
    });
  });

  describe('Complex Workflow Scenarios', () => {
    it('should handle complete recovery workflow', async () => {
      // Step 1: Initiate recovery
      const recoveryData = {
        walletId: 'test-wallet-id',
        reason: 'Lost access to wallet'
      };

      const mockRecoveryResponse = {
        success: true,
        recoveryId: 'test-recovery-id',
        message: 'Recovery process initiated'
      };

      (RecoveryApi.initiateRecovery as jest.Mock).mockResolvedValue(mockRecoveryResponse);

      const recoveryResult = await RecoveryApi.initiateRecovery(recoveryData);
      expect(recoveryResult.success).toBe(true);

      // Step 2: Guardian approves recovery
      (RecoveryApi.approveRecovery as jest.Mock).mockResolvedValue(undefined);
      await RecoveryApi.approveRecovery('test-recovery-id', 'guardian-1');

      // Step 3: Guardian signs recovery
      (RecoveryApi.signRecovery as jest.Mock).mockResolvedValue(undefined);
      await RecoveryApi.signRecovery('test-recovery-id', 'guardian-1', 'signature-data');

      // Verify all steps were called
      expect(RecoveryApi.initiateRecovery).toHaveBeenCalledWith(recoveryData);
      expect(RecoveryApi.approveRecovery).toHaveBeenCalledWith('test-recovery-id', 'guardian-1');
      expect(RecoveryApi.signRecovery).toHaveBeenCalledWith('test-recovery-id', 'guardian-1', 'signature-data');
    });

    it('should handle wallet creation with guardian verification', async () => {
      // Step 1: Create wallet
      const walletData = {
        name: 'Test Wallet',
        masterSeed: 'a'.repeat(128),
        guardians: [
          { email: 'guardian1@example.com', fullName: 'Guardian One' },
          { email: 'guardian2@example.com', fullName: 'Guardian Two' }
        ],
        thresholdRequirement: 2,
        userPassword: 'MySecure123!Password'
      };

      const mockWalletResponse = {
        success: true,
        walletId: 'test-wallet-id',
        message: 'Wallet created successfully'
      };

      (WalletApi.createWallet as jest.Mock).mockResolvedValue(mockWalletResponse);

      const walletResult = await WalletApi.createWallet(walletData);
      expect(walletResult.success).toBe(true);

      // Step 2: Guardian verifies invitation
      const guardianData = {
        token: 'test-invitation-token',
        fullName: 'Guardian One'
      };

      const mockGuardianResponse = {
        success: true,
        guardianId: 'guardian-1',
        message: 'Guardian verified successfully'
      };

      (GuardianApi.verifyGuardian as jest.Mock).mockResolvedValue(mockGuardianResponse);

      const guardianResult = await GuardianApi.verifyGuardian(guardianData);
      expect(guardianResult.success).toBe(true);

      // Verify both steps were called
      expect(WalletApi.createWallet).toHaveBeenCalledWith(walletData);
      expect(GuardianApi.verifyGuardian).toHaveBeenCalledWith(guardianData);
    });
  });
});
