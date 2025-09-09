/**
 * Seed Guardian Safe Protocol - React Hook
 * 
 * This hook provides React integration for the Seed Guardian Safe Protocol.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  SeedGuardianProtocol,
  createProtocolClient,
  defaultProtocolConfig,
  ClientWallet,
  CreateWalletRequest,
  CreateWalletResponse,
  RecoveryAttempt,
  GuardianSignature,
  KeyPair,
  AuditLogChain
} from '@/protocol';

// Define ProtocolStatus interface locally
export interface ProtocolStatus {
  version: string;
  initialized: boolean;
  storageConnected: boolean;
  lastSync: string;
  walletCount: number;
}

export interface UseProtocolConfig {
  storage: {
    baseUrl: string;
    apiKey: string;
    timeout?: number;
    retryAttempts?: number;
  };
}

export interface UseProtocolReturn {
  // Protocol state
  protocol: SeedGuardianProtocol | null;
  status: ProtocolStatus | null;
  loading: boolean;
  error: string | null;

  // Protocol methods
  initialize: () => Promise<void>;
  createWallet: (request: CreateWalletRequest, userPrivateKey: string) => Promise<CreateWalletResponse>;
  loadWallet: (walletId: string, ownerId: string) => Promise<ClientWallet | null>;
  initiateRecovery: (walletId: string, guardianId: string, reason: string, newOwnerEmail?: string, guardianPrivateKey?: string) => Promise<RecoveryAttempt>;
  signRecovery: (walletId: string, recoveryId: string, guardianId: string, guardianPrivateKey: string, verificationMethod?: 'email' | 'sms' | 'hardware' | 'biometric') => Promise<GuardianSignature>;
  reconstructSeed: (walletId: string, guardianShares: Array<{ shareIndex: number; shareValue: string; guardianPrivateKey: string; }>) => Promise<string>;
  generateGuardianKeyPair: () => Promise<KeyPair>;
  encryptForGuardian: (data: string, guardianPublicKey: string, keyId: string) => Promise<string>;
  decryptForGuardian: (encryptedData: string, guardianPrivateKey: string, keyId: string) => Promise<string>;
  signData: (data: string, privateKey: string) => Promise<string>;
  verifySignature: (data: string, signature: string, publicKey: string) => Promise<boolean>;
  getAuditLogChain: (walletId: string) => Promise<AuditLogChain>;
  verifyAuditLogChain: (walletId: string) => Promise<{ isValid: boolean; errors: string[]; merkleRootValid: boolean; chainHashValid: boolean; signaturesValid: boolean; }>;
  syncWallet: (walletId: string, ownerId: string) => Promise<void>;

  // Utility methods
  clearError: () => void;
  isInitialized: boolean;
}

export function useProtocol(config: UseProtocolConfig): UseProtocolReturn {
  const [protocol, setProtocol] = useState<SeedGuardianProtocol | null>(null);
  const [status, setStatus] = useState<ProtocolStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const protocolRef = useRef<SeedGuardianProtocol | null>(null);

  // Initialize protocol
  const initialize = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const protocolConfig = {
        storage: {
          baseUrl: config.storage.baseUrl,
          apiKey: config.storage.apiKey,
          timeout: config.storage.timeout || 30000,
          retryAttempts: config.storage.retryAttempts || 3
        },
        protocol: defaultProtocolConfig
      };

      const protocolClient = createProtocolClient(protocolConfig);
      await protocolClient.initialize();

      setProtocol(protocolClient);
      protocolRef.current = protocolClient;
      setIsInitialized(true);

      // Get initial status
      const protocolStatus = protocolClient.getStatus();
      setStatus(protocolStatus);

      console.log('Protocol initialized successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize protocol';
      setError(errorMessage);
      console.error('Protocol initialization failed:', err);
    } finally {
      setLoading(false);
    }
  }, [config]);

  // Create wallet
  const createWallet = useCallback(async (request: CreateWalletRequest, userPrivateKey: string): Promise<CreateWalletResponse> => {
    if (!protocolRef.current) {
      throw new Error('Protocol not initialized');
    }

    try {
      setError(null);
      const result = await protocolRef.current.createWallet(request, userPrivateKey);
      
      // Update status
      const newStatus = protocolRef.current.getStatus();
      setStatus(newStatus);

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create wallet';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Load wallet
  const loadWallet = useCallback(async (walletId: string, ownerId: string): Promise<ClientWallet | null> => {
    if (!protocolRef.current) {
      throw new Error('Protocol not initialized');
    }

    try {
      setError(null);
      return await protocolRef.current.loadWallet(walletId, ownerId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load wallet';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Initiate recovery
  const initiateRecovery = useCallback(async (
    walletId: string,
    guardianId: string,
    reason: string,
    newOwnerEmail?: string,
    guardianPrivateKey?: string
  ): Promise<RecoveryAttempt> => {
    if (!protocolRef.current) {
      throw new Error('Protocol not initialized');
    }

    try {
      setError(null);
      return await protocolRef.current.initiateRecovery(walletId, guardianId, reason, newOwnerEmail, guardianPrivateKey);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initiate recovery';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Sign recovery
  const signRecovery = useCallback(async (
    walletId: string,
    recoveryId: string,
    guardianId: string,
    guardianPrivateKey: string,
    verificationMethod: 'email' | 'sms' | 'hardware' | 'biometric' = 'email'
  ): Promise<GuardianSignature> => {
    if (!protocolRef.current) {
      throw new Error('Protocol not initialized');
    }

    try {
      setError(null);
      return await protocolRef.current.signRecovery(walletId, recoveryId, guardianId, guardianPrivateKey, verificationMethod);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign recovery';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Reconstruct seed
  const reconstructSeed = useCallback(async (
    walletId: string,
    guardianShares: Array<{ shareIndex: number; shareValue: string; guardianPrivateKey: string; }>
  ): Promise<string> => {
    if (!protocolRef.current) {
      throw new Error('Protocol not initialized');
    }

    try {
      setError(null);
      return await protocolRef.current.reconstructSeed(walletId, guardianShares);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reconstruct seed';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Generate guardian key pair
  const generateGuardianKeyPair = useCallback(async (): Promise<KeyPair> => {
    if (!protocolRef.current) {
      throw new Error('Protocol not initialized');
    }

    try {
      setError(null);
      return await protocolRef.current.generateGuardianKeyPair();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate guardian key pair';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Encrypt for guardian
  const encryptForGuardian = useCallback(async (
    data: string,
    guardianPublicKey: string,
    keyId: string
  ): Promise<string> => {
    if (!protocolRef.current) {
      throw new Error('Protocol not initialized');
    }

    try {
      setError(null);
      return await protocolRef.current.encryptForGuardian(data, guardianPublicKey, keyId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to encrypt for guardian';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Decrypt for guardian
  const decryptForGuardian = useCallback(async (
    encryptedData: string,
    guardianPrivateKey: string,
    keyId: string
  ): Promise<string> => {
    if (!protocolRef.current) {
      throw new Error('Protocol not initialized');
    }

    try {
      setError(null);
      return await protocolRef.current.decryptForGuardian(encryptedData, guardianPrivateKey, keyId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to decrypt for guardian';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Sign data
  const signData = useCallback(async (data: string, privateKey: string): Promise<string> => {
    if (!protocolRef.current) {
      throw new Error('Protocol not initialized');
    }

    try {
      setError(null);
      return await protocolRef.current.signData(data, privateKey);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign data';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Verify signature
  const verifySignature = useCallback(async (
    data: string,
    signature: string,
    publicKey: string
  ): Promise<boolean> => {
    if (!protocolRef.current) {
      throw new Error('Protocol not initialized');
    }

    try {
      setError(null);
      return await protocolRef.current.verifySignature(data, signature, publicKey);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify signature';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Get audit log chain
  const getAuditLogChain = useCallback(async (walletId: string): Promise<AuditLogChain> => {
    if (!protocolRef.current) {
      throw new Error('Protocol not initialized');
    }

    try {
      setError(null);
      return await protocolRef.current.getAuditLogChain(walletId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get audit log chain';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Verify audit log chain
  const verifyAuditLogChain = useCallback(async (walletId: string): Promise<{
    isValid: boolean;
    errors: string[];
    merkleRootValid: boolean;
    chainHashValid: boolean;
    signaturesValid: boolean;
  }> => {
    if (!protocolRef.current) {
      throw new Error('Protocol not initialized');
    }

    try {
      setError(null);
      return await protocolRef.current.verifyAuditLogChain(walletId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify audit log chain';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Sync wallet
  const syncWallet = useCallback(async (walletId: string, ownerId: string): Promise<void> => {
    if (!protocolRef.current) {
      throw new Error('Protocol not initialized');
    }

    try {
      setError(null);
      await protocolRef.current.syncWallet(walletId, ownerId);
      
      // Update status
      const newStatus = protocolRef.current.getStatus();
      setStatus(newStatus);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync wallet';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-initialize on mount
  useEffect(() => {
    if (!isInitialized && !loading) {
      initialize();
    }
  }, [initialize, isInitialized, loading]);

  // Update status periodically
  useEffect(() => {
    if (!protocolRef.current) return;

    const interval = setInterval(() => {
      const newStatus = protocolRef.current?.getStatus();
      if (newStatus) {
        setStatus(newStatus);
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [protocol]);

  return {
    // Protocol state
    protocol,
    status,
    loading,
    error,

    // Protocol methods
    initialize,
    createWallet,
    loadWallet,
    initiateRecovery,
    signRecovery,
    reconstructSeed,
    generateGuardianKeyPair,
    encryptForGuardian,
    decryptForGuardian,
    signData,
    verifySignature,
    getAuditLogChain,
    verifyAuditLogChain,
    syncWallet,

    // Utility methods
    clearError,
    isInitialized
  };
}
