// Custom hook for wallet management with caching and real-time updates
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WalletApi, Wallet, Guardian, CreateWalletRequest } from '@/services/api';
import { logger } from '@/lib/logger';
import { AppError } from '@/lib/errors';
import { useErrorHandler } from '@/components/ErrorBoundary';
import { useAuth } from './useAuth';

// Query keys for caching
const WALLET_KEYS = {
  all: ['wallets'] as const,
  lists: () => [...WALLET_KEYS.all, 'list'] as const,
  list: (filters: string) => [...WALLET_KEYS.lists(), { filters }] as const,
  details: () => [...WALLET_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...WALLET_KEYS.details(), id] as const,
  guardians: (walletId: string) => [...WALLET_KEYS.detail(walletId), 'guardians'] as const,
};

export interface UseWalletsOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

export interface UseWalletsReturn {
  wallets: Wallet[];
  loading: boolean;
  error: AppError | null;
  refetch: () => Promise<void>;
  createWallet: (request: CreateWalletRequest) => Promise<Wallet>;
  deleteWallet: (walletId: string) => Promise<void>;
  clearError: () => void;
}

export function useWallets(options: UseWalletsOptions = {}): UseWalletsReturn {
  const { enabled = true, refetchInterval } = options;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();

  const {
    data: wallets = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: WALLET_KEYS.lists(),
    queryFn: async () => {
      if (!user) {
        throw new AppError('User not authenticated', 'AUTHENTICATION_ERROR', 401);
      }
      return WalletApi.getWallets();
    },
    enabled: enabled && !!user,
    refetchInterval,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const createWalletMutation = useMutation({
    mutationFn: async (request: CreateWalletRequest) => {
      const response = await WalletApi.createWallet(request);
      return WalletApi.getWallet(response.walletId);
    },
    onSuccess: (newWallet) => {
      // Update cache
      queryClient.setQueryData(WALLET_KEYS.lists(), (old: Wallet[] = []) => [
        newWallet,
        ...old,
      ]);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: WALLET_KEYS.lists() });
      
      logger.info('Wallet created successfully', { walletId: newWallet.id });
    },
    onError: (error) => {
      const appError = handleError(error, { context: 'create_wallet' });
      logger.error('Failed to create wallet', appError);
    },
  });

  const deleteWalletMutation = useMutation({
    mutationFn: WalletApi.deleteWallet,
    onSuccess: (_, walletId) => {
      // Remove from cache
      queryClient.setQueryData(WALLET_KEYS.lists(), (old: Wallet[] = []) =>
        old.filter(wallet => wallet.id !== walletId)
      );
      
      // Remove individual wallet cache
      queryClient.removeQueries({ queryKey: WALLET_KEYS.detail(walletId) });
      
      logger.info('Wallet deleted successfully', { walletId });
    },
    onError: (error) => {
      const appError = handleError(error, { context: 'delete_wallet' });
      logger.error('Failed to delete wallet', appError);
    },
  });

  const createWallet = useCallback(async (request: CreateWalletRequest): Promise<Wallet> => {
    return createWalletMutation.mutateAsync(request);
  }, [createWalletMutation]);

  const deleteWallet = useCallback(async (walletId: string): Promise<void> => {
    return deleteWalletMutation.mutateAsync(walletId);
  }, [deleteWalletMutation]);

  const clearError = useCallback(() => {
    queryClient.setQueryData(WALLET_KEYS.lists(), (old: any) => old);
  }, [queryClient]);

  return {
    wallets,
    loading: isLoading,
    error: error as AppError | null,
    refetch,
    createWallet,
    deleteWallet,
    clearError,
  };
}

export interface UseWalletOptions {
  walletId: string;
  enabled?: boolean;
}

export interface UseWalletReturn {
  wallet: Wallet | null;
  loading: boolean;
  error: AppError | null;
  refetch: () => Promise<void>;
}

export function useWallet(options: UseWalletOptions): UseWalletReturn {
  const { walletId, enabled = true } = options;
  const { user } = useAuth();
  const { handleError } = useErrorHandler();

  const {
    data: wallet = null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: WALLET_KEYS.detail(walletId),
    queryFn: async () => {
      if (!user) {
        throw new AppError('User not authenticated', 'AUTHENTICATION_ERROR', 401);
      }
      return WalletApi.getWallet(walletId);
    },
    enabled: enabled && !!user && !!walletId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    wallet,
    loading: isLoading,
    error: error as AppError | null,
    refetch,
  };
}

export interface UseGuardiansOptions {
  walletId: string;
  enabled?: boolean;
}

export interface UseGuardiansReturn {
  guardians: Guardian[];
  loading: boolean;
  error: AppError | null;
  refetch: () => Promise<void>;
}

export function useGuardians(options: UseGuardiansOptions): UseGuardiansReturn {
  const { walletId, enabled = true } = options;
  const { user } = useAuth();
  const { handleError } = useErrorHandler();

  const {
    data: guardians = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: WALLET_KEYS.guardians(walletId),
    queryFn: async () => {
      if (!user) {
        throw new AppError('User not authenticated', 'AUTHENTICATION_ERROR', 401);
      }
      return WalletApi.getGuardians(walletId);
    },
    enabled: enabled && !!user && !!walletId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    guardians,
    loading: isLoading,
    error: error as AppError | null,
    refetch,
  };
}

// Hook for wallet statistics
export function useWalletStats() {
  const { wallets } = useWallets();

  return useMemo(() => {
    const totalWallets = wallets.length;
    const totalGuardians = wallets.reduce((sum, wallet) => sum + wallet.total_guardians, 0);
    const averageGuardians = totalWallets > 0 ? totalGuardians / totalWallets : 0;
    
    const walletStatuses = wallets.reduce((acc, wallet) => {
      const key = wallet.total_guardians >= wallet.threshold_requirement ? 'secure' : 'incomplete';
      acc[key]++;
      return acc;
    }, { secure: 0, incomplete: 0 });

    return {
      totalWallets,
      totalGuardians,
      averageGuardians: Math.round(averageGuardians * 100) / 100,
      secureWallets: walletStatuses.secure,
      incompleteWallets: walletStatuses.incomplete,
      securityPercentage: totalWallets > 0 ? (walletStatuses.secure / totalWallets) * 100 : 0,
    };
  }, [wallets]);
}

// Hook for filtering and searching wallets
export function useWalletFilters(wallets: Wallet[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'secure' | 'incomplete'>('all');

  const filteredWallets = useMemo(() => {
    return wallets.filter(wallet => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        wallet.name.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const isSecure = wallet.total_guardians >= wallet.threshold_requirement;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'secure' && isSecure) ||
        (statusFilter === 'incomplete' && !isSecure);

      return matchesSearch && matchesStatus;
    });
  }, [wallets, searchTerm, statusFilter]);

  return {
    filteredWallets,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
  };
}
