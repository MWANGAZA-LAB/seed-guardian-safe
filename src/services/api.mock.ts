// Mock API service for Jest tests
export const apiService = {
  baseURL: process.env.VITE_SUPABASE_URL || 'https://test.supabase.co',
  headers: {
    'Content-Type': 'application/json',
    'apikey': process.env.VITE_SUPABASE_ANON_KEY || 'test-anon-key'
  }
};

export class WalletApi {
  async createWallet(data: Record<string, unknown>) {
    return { success: true, data };
  }
  
  async getWallets() {
    return { success: true, data: [] };
  }
  
  async getWallet(id: string) {
    return { success: true, data: { id } };
  }
  
  async deleteWallet(id: string) {
    return { success: true };
  }
}

export class RecoveryApi {
  async initiateRecovery(data: Record<string, unknown>) {
    return { success: true, data };
  }
  
  async getRecoveryRequests(walletId: string) {
    return { success: true, data: [] };
  }
  
  async approveRecoveryRequest(id: string) {
    return { success: true };
  }
  
  async signRecoveryRequest(id: string, signature: string) {
    return { success: true };
  }
}

export class BitcoinApi {
  async getBalance(address: string) {
    return { success: true, data: { balance: 0 } };
  }
  
  async sendTransaction(data: Record<string, unknown>) {
    return { success: true, data };
  }
}

export class GuardianApi {
  async verifyGuardian(token: string) {
    return { success: true, data: { token } };
  }
  
  async getGuardianByToken(token: string) {
    return { success: true, data: { token } };
  }
  
  async getGuardians(walletId: string) {
    return { success: true, data: [] };
  }
}
