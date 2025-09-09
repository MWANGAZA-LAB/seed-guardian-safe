import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { apiService, WalletApi, RecoveryApi, BitcoinApi, GuardianApi } from '@/services/api';
import { AppError, AuthenticationError, ValidationError } from '@/lib/errors';

// Mock fetch
global.fetch = jest.fn();

// Mock Supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabaseClient: {
    getClient: jest.fn(() => ({
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            data: [],
            error: null
          }))
        })),
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: null,
            error: null
          }))
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(() => ({
            error: null
          }))
        }))
      }))
    })),
    getSession: jest.fn(() => Promise.resolve({
      access_token: 'mock-token'
    }))
  }
}));

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('ApiService', () => {
    it('should make GET requests', async () => {
      const mockResponse = { data: 'test' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: () => Promise.resolve(mockResponse)
      });

      const result = await apiService.get('/test');
      expect(result.data).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should make POST requests with data', async () => {
      const mockResponse = { success: true };
      const requestData = { test: 'data' };
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: () => Promise.resolve(mockResponse)
      });

      const result = await apiService.post('/test', requestData);
      expect(result.data).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData)
        })
      );
    });

    it('should handle authentication errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers(),
        json: () => Promise.resolve({
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Invalid token'
          }
        })
      });

      await expect(apiService.get('/test')).rejects.toThrow(AuthenticationError);
    });

    it('should handle validation errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers(),
        json: () => Promise.resolve({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid data'
          }
        })
      });

      await expect(apiService.post('/test', {})).rejects.toThrow(ValidationError);
    });

    it('should retry failed requests', async () => {
      (fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers(),
          json: () => Promise.resolve({ success: true })
        });

      const result = await apiService.get('/test');
      expect(result.data).toEqual({ success: true });
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should not retry client errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers(),
        json: () => Promise.resolve({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid data'
          }
        })
      });

      await expect(apiService.post('/test', {})).rejects.toThrow();
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('WalletApi', () => {
    it('should create wallet', async () => {
      const mockResponse = { success: true, walletId: 'test-id' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: () => Promise.resolve(mockResponse)
      });

      const request = {
        name: 'Test Wallet',
        masterSeed: 'a'.repeat(128),
        guardians: [
          { email: 'guardian1@example.com', fullName: 'Guardian One' },
          { email: 'guardian2@example.com', fullName: 'Guardian Two' }
        ],
        thresholdRequirement: 2,
        userPassword: 'MySecure123!Password'
      };

      const result = await WalletApi.createWallet(request);
      expect(result).toEqual(mockResponse);
    });

    it('should get wallets', async () => {
      const mockWallets = [
        { id: '1', name: 'Wallet 1' },
        { id: '2', name: 'Wallet 2' }
      ];

      const mockSupabaseClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => ({
              data: mockWallets,
              error: null
            }))
          }))
        }))
      };

      const { supabaseClient } = await import('@/integrations/supabase/client');
      supabaseClient.getClient.mockReturnValue(mockSupabaseClient);

      const result = await WalletApi.getWallets();
      expect(result).toEqual(mockWallets);
    });

    it('should handle database errors', async () => {
      const mockSupabaseClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => ({
              data: null,
              error: { message: 'Database error' }
            }))
          }))
        }))
      };

      const { supabaseClient } = await import('@/integrations/supabase/client');
      supabaseClient.getClient.mockReturnValue(mockSupabaseClient);

      await expect(WalletApi.getWallets()).rejects.toThrow(AppError);
    });
  });

  describe('RecoveryApi', () => {
    it('should initiate recovery', async () => {
      const mockResponse = { success: true, recoveryId: 'test-id' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: () => Promise.resolve(mockResponse)
      });

      const request = {
        walletId: 'test-wallet-id',
        reason: 'Lost access to wallet'
      };

      const result = await RecoveryApi.initiateRecovery(request);
      expect(result).toEqual(mockResponse);
    });

    it('should get recovery requests', async () => {
      const mockRecoveryRequests = [
        { id: '1', wallet_id: 'wallet-1', status: 'pending' },
        { id: '2', wallet_id: 'wallet-2', status: 'completed' }
      ];

      const mockSupabaseClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => ({
              eq: jest.fn(() => ({
                data: mockRecoveryRequests,
                error: null
              }))
            }))
          }))
        }))
      };

      const { supabaseClient } = await import('@/integrations/supabase/client');
      supabaseClient.getClient.mockReturnValue(mockSupabaseClient);

      const result = await RecoveryApi.getRecoveryRequests('test-wallet-id');
      expect(result).toEqual(mockRecoveryRequests);
    });
  });

  describe('BitcoinApi', () => {
    it('should get balance', async () => {
      const mockBalance = 1000000; // 0.01 BTC in satoshis
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: () => Promise.resolve(mockBalance)
      });

      const result = await BitcoinApi.getBalance('test-wallet-id', 'password');
      expect(result).toBe(mockBalance);
    });

    it('should get addresses', async () => {
      const mockAddresses = [
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy'
      ];
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: () => Promise.resolve(mockAddresses)
      });

      const result = await BitcoinApi.getAddresses('test-wallet-id', 'password', 5);
      expect(result).toEqual(mockAddresses);
    });

    it('should create transaction', async () => {
      const mockResponse = {
        success: true,
        transactionId: 'test-tx-id',
        unsignedTransaction: 'unsigned-tx-data',
        fee: 1000
      };
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: () => Promise.resolve(mockResponse)
      });

      const request = {
        walletId: 'test-wallet-id',
        toAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        amountSatoshis: 100000,
        userPassword: 'password'
      };

      const result = await BitcoinApi.createTransaction(request);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('GuardianApi', () => {
    it('should verify guardian', async () => {
      const mockResponse = {
        success: true,
        guardianId: 'test-guardian-id',
        message: 'Guardian verified successfully'
      };
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: () => Promise.resolve(mockResponse)
      });

      const request = {
        token: 'test-token',
        fullName: 'John Doe',
        phoneNumber: '+1234567890'
      };

      const result = await GuardianApi.verifyGuardian(request);
      expect(result).toEqual(mockResponse);
    });

    it('should get guardian by token', async () => {
      const mockGuardian = {
        id: 'test-guardian-id',
        email: 'guardian@example.com',
        full_name: 'John Doe',
        status: 'invited'
      };

      const mockSupabaseClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: mockGuardian,
                error: null
              }))
            }))
          }))
        }))
      };

      const { supabaseClient } = await import('@/integrations/supabase/client');
      supabaseClient.getClient.mockReturnValue(mockSupabaseClient);

      const result = await GuardianApi.getGuardianByToken('test-token');
      expect(result).toEqual(mockGuardian);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(apiService.get('/test')).rejects.toThrow('Network error');
    });

    it('should handle timeout errors', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Request timeout'));

      await expect(apiService.get('/test')).rejects.toThrow('Request timeout');
    });

    it('should handle JSON parsing errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      await expect(apiService.get('/test')).rejects.toThrow();
    });
  });
});
