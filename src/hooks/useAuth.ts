// Custom authentication hook with proper state management and security
import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabaseClient } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { AuthenticationError, AppError } from '@/lib/errors';
import { useErrorHandler } from '@/components/ErrorBoundary';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: AppError | null;
}

export interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

export function useAuth(): AuthState & AuthActions {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  const { handleError } = useErrorHandler();

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const session = await supabaseClient.getSession();
        
        if (mounted) {
          setState(prev => ({
            ...prev,
            user: session?.user || null,
            session,
            loading: false,
          }));
        }

        logger.info('Auth initialized', {
          hasUser: !!session?.user,
          userId: session?.user?.id,
        });
      } catch (error) {
        if (mounted) {
          const appError = handleError(error, { context: 'auth_initialization' });
          setState(prev => ({
            ...prev,
            loading: false,
            error: appError,
          }));
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [handleError]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabaseClient.getClient().auth.onAuthStateChange(
      async (event, session) => {
        logger.info('Auth state changed', {
          event,
          userId: session?.user?.id,
          email: session?.user?.email,
        });

        setState(prev => ({
          ...prev,
          user: session?.user || null,
          session,
          loading: false,
          error: null, // Clear errors on successful auth state change
        }));
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      await supabaseClient.signIn(email, password);
      
      logger.info('User signed in successfully', { email });
    } catch (error) {
      const appError = handleError(error, { 
        context: 'sign_in',
        email: email.replace(/./g, '*'), // Mask email for security
      });
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: appError,
      }));
      
      throw appError;
    }
  }, [handleError]);

  const signUp = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      await supabaseClient.signUp(email, password);
      
      logger.info('User signed up successfully', { email: email.replace(/./g, '*') });
    } catch (error) {
      const appError = handleError(error, { 
        context: 'sign_up',
        email: email.replace(/./g, '*'),
      });
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: appError,
      }));
      
      throw appError;
    }
  }, [handleError]);

  const signOut = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      await supabaseClient.signOut();
      
      logger.info('User signed out successfully');
    } catch (error) {
      const appError = handleError(error, { context: 'sign_out' });
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: appError,
      }));
      
      throw appError;
    }
  }, [handleError]);

  const resetPassword = useCallback(async (email: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { error } = await supabaseClient.getClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw new AuthenticationError(error.message);
      }

      logger.info('Password reset email sent', { email: email.replace(/./g, '*') });
    } catch (error) {
      const appError = handleError(error, { 
        context: 'reset_password',
        email: email.replace(/./g, '*'),
      });
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: appError,
      }));
      
      throw appError;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [handleError]);

  const updatePassword = useCallback(async (password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { error } = await supabaseClient.getClient().auth.updateUser({
        password,
      });

      if (error) {
        throw new AuthenticationError(error.message);
      }

      logger.info('Password updated successfully');
    } catch (error) {
      const appError = handleError(error, { context: 'update_password' });
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: appError,
      }));
      
      throw appError;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [handleError]);

  const refreshSession = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const session = await supabaseClient.getSession();
      
      setState(prev => ({
        ...prev,
        session,
        user: session?.user || null,
        loading: false,
      }));

      logger.info('Session refreshed successfully');
    } catch (error) {
      const appError = handleError(error, { context: 'refresh_session' });
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: appError,
      }));
      
      throw appError;
    }
  }, [handleError]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshSession,
    clearError,
  };
}

// Hook for checking if user is authenticated
export function useIsAuthenticated(): boolean {
  const { user, loading } = useAuth();
  return !loading && !!user;
}

// Hook for getting current user
export function useCurrentUser(): User | null {
  const { user } = useAuth();
  return user;
}

// Hook for getting current session
export function useCurrentSession(): Session | null {
  const { session } = useAuth();
  return session;
}

// Hook for checking if auth is loading
export function useAuthLoading(): boolean {
  const { loading } = useAuth();
  return loading;
}
