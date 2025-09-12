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

// Removed mock data - wallets are now loaded from Supabase

export function useWalletData() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const protocol = useProtocol();

  // Load wallets
  const loadWallets = async () => {
    try {
      setIsLoading(true);
      // Load wallets from Supabase
      const { supabaseClient } = await import('@/integrations/supabase/client');
      const { data: wallets, error } = await supabaseClient
        .getClient()
        .from('wallets')
        .select(`
          *,
          guardians:guardians(*),
          recovery_requests:recovery_requests(*),
          transactions:transactions(*)
        `);
      
      if (error) {
        throw new Error(`Failed to load wallets: ${error.message}`);
      }
      
      const formattedWallets = (wallets || []).map((wallet: any) => ({
        id: wallet.id,
        name: wallet.name,
        balance: wallet.balance,
        address: wallet.address,
        createdAt: wallet.created_at,
        lastActivity: wallet.last_activity,
        status: wallet.status,
        guardians: wallet.guardians || [],
        threshold: wallet.threshold,
        totalGuardians: wallet.total_guardians,
        recoveryRequests: wallet.recovery_requests || [],
        transactions: wallet.transactions || []
      }));
      
      setWallets(formattedWallets);
      logger.info('Wallets loaded successfully');
    } catch (error) {
      logger.error('Failed to load wallets:', error instanceof Error ? error : new Error(String(error)));
      setWallets([]);
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
