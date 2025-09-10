import { useState, useEffect } from 'react';
import { useProtocol } from './useProtocol';
import { logger } from '@/lib/logger';

export interface Wallet {
  id: string;
  name: string;
  balance: number; // in satoshis
  address: string;
  createdAt: string;
  lastActivity: string;
  status: 'active' | 'inactive' | 'recovery' | 'locked';
  guardians: Guardian[];
  threshold: number;
  totalGuardians: number;
  recoveryRequests: RecoveryRequest[];
  transactions: Transaction[];
}

export interface Guardian {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'pending' | 'inactive';
  addedAt: string;
  lastActivity: string;
  verificationMethod: 'email' | 'sms' | 'both';
}

export interface RecoveryRequest {
  id: string;
  initiatedBy: string;
  reason: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
  guardiansApproved: number;
  guardiansRequired: number;
  estimatedCompletion: string;
}

export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'recovery';
  amount: number; // in satoshis
  address: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
  fee: number; // in satoshis
  confirmations: number;
  txHash?: string;
}

const mockWallets: Wallet[] = [
  {
    id: 'demo-wallet-1',
    name: 'Main Bitcoin Wallet',
    balance: 125000000, // 1.25 BTC in satoshis
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    createdAt: '2024-01-15T10:30:00Z',
    lastActivity: '2024-01-20T14:22:00Z',
    status: 'active',
    guardians: [
      {
        id: 'guardian-1',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        phone: '+1-555-0123',
        status: 'active',
        addedAt: '2024-01-15T11:00:00Z',
        lastActivity: '2024-01-20T14:22:00Z',
        verificationMethod: 'both'
      },
      {
        id: 'guardian-2',
        name: 'Bob Smith',
        email: 'bob@example.com',
        phone: '+1-555-0124',
        status: 'active',
        addedAt: '2024-01-15T11:30:00Z',
        lastActivity: '2024-01-19T09:15:00Z',
        verificationMethod: 'email'
      },
      {
        id: 'guardian-3',
        name: 'Carol Davis',
        email: 'carol@example.com',
        phone: '+1-555-0125',
        status: 'pending',
        addedAt: '2024-01-18T16:45:00Z',
        lastActivity: '2024-01-18T16:45:00Z',
        verificationMethod: 'sms'
      }
    ],
    threshold: 2,
    totalGuardians: 3,
    recoveryRequests: [
      {
        id: 'recovery-1',
        initiatedBy: 'Alice Johnson',
        reason: 'Password recovery needed',
        urgency: 'medium',
        status: 'pending',
        createdAt: '2024-01-20T10:00:00Z',
        guardiansApproved: 1,
        guardiansRequired: 2,
        estimatedCompletion: '2024-01-22T10:00:00Z'
      }
    ],
    transactions: [
      {
        id: 'tx-1',
        type: 'receive',
        amount: 50000000, // 0.5 BTC
        address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        status: 'confirmed',
        timestamp: '2024-01-20T14:22:00Z',
        fee: 1000,
        confirmations: 6,
        txHash: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456'
      },
      {
        id: 'tx-2',
        type: 'receive',
        amount: 75000000, // 0.75 BTC
        address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        status: 'confirmed',
        timestamp: '2024-01-18T09:15:00Z',
        fee: 1200,
        confirmations: 12,
        txHash: 'b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567'
      }
    ]
  },
  {
    id: 'demo-wallet-2',
    name: 'Savings Wallet',
    balance: 50000000, // 0.5 BTC in satoshis
    address: 'bc1qdef4567890123456789012345678901234567890abcdef1234567890ab',
    createdAt: '2024-01-10T08:15:00Z',
    lastActivity: '2024-01-15T16:30:00Z',
    status: 'active',
    guardians: [
      {
        id: 'guardian-4',
        name: 'David Wilson',
        email: 'david@example.com',
        phone: '+1-555-0126',
        status: 'active',
        addedAt: '2024-01-10T09:00:00Z',
        lastActivity: '2024-01-15T16:30:00Z',
        verificationMethod: 'both'
      },
      {
        id: 'guardian-5',
        name: 'Eve Brown',
        email: 'eve@example.com',
        phone: '+1-555-0127',
        status: 'active',
        addedAt: '2024-01-10T09:30:00Z',
        lastActivity: '2024-01-14T11:20:00Z',
        verificationMethod: 'email'
      }
    ],
    threshold: 2,
    totalGuardians: 2,
    recoveryRequests: [],
    transactions: [
      {
        id: 'tx-3',
        type: 'receive',
        amount: 50000000, // 0.5 BTC
        address: 'bc1qdef4567890123456789012345678901234567890abcdef1234567890ab',
        status: 'confirmed',
        timestamp: '2024-01-15T16:30:00Z',
        fee: 800,
        confirmations: 8,
        txHash: 'c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678'
      }
    ]
  }
];

export function useWalletData() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const protocol = useProtocol();

  // Load wallets
  const loadWallets = async () => {
    try {
      setIsLoading(true);
      // In a real app, this would fetch from the backend
      // For now, we'll use localStorage to persist wallet data
      const savedWallets = localStorage.getItem('wallets');
      if (savedWallets) {
        const parsed = JSON.parse(savedWallets);
        setWallets(parsed);
      } else {
        setWallets(mockWallets);
        localStorage.setItem('wallets', JSON.stringify(mockWallets));
      }
      
      logger.info('Wallets loaded successfully');
    } catch (error) {
      logger.error('Failed to load wallets:', error instanceof Error ? error : new Error(String(error)));
      setWallets(mockWallets);
    } finally {
      setIsLoading(false);
    }
  };

  // Get wallet by ID
  const getWallet = (walletId: string): Wallet | null => {
    return wallets.find(wallet => wallet.id === walletId) || null;
  };

  // Create new wallet
  const createWallet = async (walletData: Partial<Wallet>): Promise<Wallet> => {
    try {
      const newWallet: Wallet = {
        id: `wallet-${Date.now()}`,
        name: walletData.name || 'New Wallet',
        balance: 0,
        address: walletData.address || '',
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        status: 'active',
        guardians: walletData.guardians || [],
        threshold: walletData.threshold || 2,
        totalGuardians: walletData.totalGuardians || 0,
        recoveryRequests: [],
        transactions: [],
        ...walletData
      };

      const updatedWallets = [...wallets, newWallet];
      setWallets(updatedWallets);
      localStorage.setItem('wallets', JSON.stringify(updatedWallets));

      // Log wallet creation
      if (protocol.protocolClient && typeof protocol.protocolClient.createAuditLog === 'function') {
        await protocol.protocolClient.createAuditLog({
          action: 'wallet_created',
          details: {
            walletId: newWallet.id,
            walletName: newWallet.name,
            timestamp: new Date().toISOString(),
          },
        });
      }

      logger.info('Wallet created successfully:', { walletId: newWallet.id });
      return newWallet;
    } catch (error) {
      logger.error('Failed to create wallet:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  };

  // Update wallet
  const updateWallet = async (walletId: string, updates: Partial<Wallet>): Promise<boolean> => {
    try {
      const updatedWallets = wallets.map(wallet => 
        wallet.id === walletId ? { ...wallet, ...updates } : wallet
      );
      setWallets(updatedWallets);
      localStorage.setItem('wallets', JSON.stringify(updatedWallets));

      // Log wallet update
      if (protocol.protocolClient && typeof protocol.protocolClient.createAuditLog === 'function') {
        await protocol.protocolClient.createAuditLog({
          action: 'wallet_updated',
          details: {
            walletId,
            updatedFields: Object.keys(updates),
            timestamp: new Date().toISOString(),
          },
        });
      }

      logger.info('Wallet updated successfully:', { walletId });
      return true;
    } catch (error) {
      logger.error('Failed to update wallet:', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  };

  // Add transaction
  const addTransaction = async (walletId: string, transaction: Transaction): Promise<boolean> => {
    try {
      const wallet = getWallet(walletId);
      if (!wallet) return false;

      const updatedWallet = {
        ...wallet,
        transactions: [transaction, ...wallet.transactions],
        lastActivity: transaction.timestamp,
        balance: transaction.type === 'receive' 
          ? wallet.balance + transaction.amount 
          : wallet.balance - transaction.amount - transaction.fee
      };

      return await updateWallet(walletId, updatedWallet);
    } catch (error) {
      logger.error('Failed to add transaction:', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  };

  // Get wallet statistics
  const getWalletStats = () => {
    const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
    const activeWallets = wallets.filter(wallet => wallet.status === 'active').length;
    const totalGuardians = wallets.reduce((sum, wallet) => sum + wallet.totalGuardians, 0);
    const pendingRecoveries = wallets.reduce((sum, wallet) => 
      sum + wallet.recoveryRequests.filter(req => req.status === 'pending').length, 0
    );

    return {
      totalBalance,
      activeWallets,
      totalGuardians,
      pendingRecoveries,
      totalWallets: wallets.length
    };
  };

  useEffect(() => {
    loadWallets();
  }, []);

  return {
    wallets,
    isLoading,
    selectedWallet,
    setSelectedWallet,
    loadWallets,
    getWallet,
    createWallet,
    updateWallet,
    addTransaction,
    getWalletStats,
  };
}
