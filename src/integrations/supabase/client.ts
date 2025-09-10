// Supabase client with proper configuration and error handling
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { getSupabaseConfig } from '@/config/environment';
import { logger } from '@/lib/logger';
import { AuthenticationError, NetworkError } from '@/lib/errors';

// Get configuration from environment
const config = getSupabaseConfig();

// Create Supabase client with proper configuration
export const supabase = createClient<Database>(config.url, config.anonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'seed-guardian-safe@1.0.0',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Enhanced client with error handling and logging
export class SupabaseClient {
  private static instance: SupabaseClient;
  private client = supabase;

  private constructor() {
    this.setupAuthListener();
  }

  static getInstance(): SupabaseClient {
    if (!SupabaseClient.instance) {
      SupabaseClient.instance = new SupabaseClient();
    }
    return SupabaseClient.instance;
  }

  private setupAuthListener(): void {
    this.client.auth.onAuthStateChange((event, session) => {
      logger.info('Auth state changed', {
        event,
        userId: session?.user?.id,
        email: session?.user?.email,
      });

      if (event === 'SIGNED_OUT') {
        logger.info('User signed out');
      } else if (event === 'SIGNED_IN') {
        logger.info('User signed in', {
          userId: session?.user?.id,
          email: session?.user?.email,
        });
      }
    });
  }

  // Enhanced authentication methods
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logger.authError('signIn', error);
        throw new AuthenticationError(error.message);
      }

      logger.info('User signed in successfully', {
        userId: data.user?.id,
        email: data.user?.email,
      });

      return data;
    } catch (error) {
      logger.error('Sign in failed', error as Error);
      throw error;
    }
  }

  async signUp(email: string, password: string) {
    try {
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
      });

      if (error) {
        logger.authError('signUp', error);
        throw new AuthenticationError(error.message);
      }

      logger.info('User signed up successfully', {
        userId: data.user?.id,
        email: data.user?.email,
      });

      return data;
    } catch (error) {
      logger.error('Sign up failed', error as Error);
      throw error;
    }
  }

  async signOut() {
    try {
      const { error } = await this.client.auth.signOut();
      
      if (error) {
        logger.authError('signOut', error);
        throw new AuthenticationError(error.message);
      }

      logger.info('User signed out successfully');
    } catch (error) {
      logger.error('Sign out failed', error as Error);
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const { data: { user }, error } = await this.client.auth.getUser();
      
      if (error) {
        logger.authError('getCurrentUser', error);
        throw new AuthenticationError(error.message);
      }

      return user;
    } catch (error) {
      logger.error('Get current user failed', error as Error);
      throw error;
    }
  }

  async getSession() {
    try {
      const { data: { session }, error } = await this.client.auth.getSession();
      
      if (error) {
        logger.authError('getSession', error);
        throw new AuthenticationError(error.message);
      }

      return session;
    } catch (error) {
      logger.error('Get session failed', error as Error);
      throw error;
    }
  }

  // Enhanced database methods with error handling
  async query<T = unknown>(table: string, query: string) {
    try {
      const { data, error } = await this.client
        .from(table)
        .select(query);

      if (error) {
        logger.error(`Database query failed for table ${table}`, error);
        throw new NetworkError(table, error.message, error);
      }

      return data as T;
    } catch (error) {
      logger.error(`Query failed for table ${table}`, error as Error);
      throw error;
    }
  }

  async insert<T = unknown>(table: string, data: any) {
    try {
      const { data: result, error } = await this.client
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) {
        logger.error(`Database insert failed for table ${table}`, error);
        throw new NetworkError(table, error.message, error);
      }

      return result as T;
    } catch (error) {
      logger.error(`Insert failed for table ${table}`, error as Error);
      throw error;
    }
  }

  async update<T = unknown>(table: string, data: any, match: any) {
    try {
      const { data: result, error } = await (this.client as any)
        .from(table)
        .update(data)
        .match(match)
        .select()
        .single();

      if (error) {
        logger.error(`Database update failed for table ${table}`, error);
        throw new NetworkError(table, error.message, error);
      }

      return result as T;
    } catch (error) {
      logger.error(`Update failed for table ${table}`, error as Error);
      throw error;
    }
  }

  async delete(table: string, match: Record<string, unknown>) {
    try {
      const { error } = await this.client
        .from(table)
        .delete()
        .match(match);

      if (error) {
        logger.error(`Database delete failed for table ${table}`, error);
        throw new NetworkError(table, error.message, error);
      }
    } catch (error) {
      logger.error(`Delete failed for table ${table}`, error as Error);
      throw error;
    }
  }

  // Get the raw client for advanced operations
  getClient() {
    return this.client;
  }
}

// Export singleton instance
export const supabaseClient = SupabaseClient.getInstance();