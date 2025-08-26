// Environment configuration with proper validation
export interface EnvironmentConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  bitcoin: {
    rpcHost: string;
    rpcPort: number;
    rpcUsername: string;
    rpcPassword: string;
  };
  email: {
    sendGridApiKey: string;
    fromEmail: string;
  };
  app: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
  };
}

function validateEnvironment(): EnvironmentConfig {
  const requiredEnvVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_BITCOIN_RPC_HOST: import.meta.env.VITE_BITCOIN_RPC_HOST,
    VITE_BITCOIN_RPC_PORT: import.meta.env.VITE_BITCOIN_RPC_PORT,
    VITE_BITCOIN_RPC_USERNAME: import.meta.env.VITE_BITCOIN_RPC_USERNAME,
    VITE_SENDGRID_API_KEY: import.meta.env.VITE_SENDGRID_API_KEY,
    VITE_FROM_EMAIL: import.meta.env.VITE_FROM_EMAIL,
  };

  // Validate required environment variables
  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  return {
    supabase: {
      url: requiredEnvVars.VITE_SUPABASE_URL!,
      anonKey: requiredEnvVars.VITE_SUPABASE_ANON_KEY!,
    },
    bitcoin: {
      rpcHost: requiredEnvVars.VITE_BITCOIN_RPC_HOST!,
      rpcPort: parseInt(requiredEnvVars.VITE_BITCOIN_RPC_PORT!, 10),
      rpcUsername: requiredEnvVars.VITE_BITCOIN_RPC_USERNAME!,
      rpcPassword: import.meta.env.VITE_BITCOIN_RPC_PASSWORD || '',
    },
    email: {
      sendGridApiKey: requiredEnvVars.VITE_SENDGRID_API_KEY!,
      fromEmail: requiredEnvVars.VITE_FROM_EMAIL!,
    },
    app: {
      name: 'Seed Guardian Safe',
      version: '1.0.0',
      environment: (import.meta.env.MODE as EnvironmentConfig['app']['environment']) || 'development',
    },
  };
}

export const config = validateEnvironment();

// Type-safe environment getters
export const getSupabaseConfig = () => config.supabase;
export const getBitcoinConfig = () => config.bitcoin;
export const getEmailConfig = () => config.email;
export const getAppConfig = () => config.app;
