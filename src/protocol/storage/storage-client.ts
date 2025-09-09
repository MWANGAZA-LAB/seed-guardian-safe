/**
 * Seed Guardian Safe Protocol - Storage & Relay Client
 * 
 * This module implements the client-side interface to the storage and relay layer.
 * The server is now just a dumb storage system - no cryptographic trust required.
 */

import {
  GuardianShare,
  Guardian,
  RecoveryAttempt,
  AuditLogEntry,
  ProtocolResponse,
  ProtocolError
} from '../core/types';

export interface StorageConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  retryAttempts: number;
}

export interface StorageRequest {
  type: 'encrypted_share' | 'guardian_info' | 'recovery_attempt' | 'audit_log';
  data: string; // Encrypted or signed data
  ownerId: string;
  guardianId?: string;
  walletId: string;
  metadata?: Record<string, unknown>;
}

export interface StorageResponse {
  id: string;
  success: boolean;
  error?: string;
}

export class StorageClient {
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
  }

  /**
   * Store encrypted guardian share
   * Server never sees plaintext - only encrypted blob
   */
  async storeGuardianShare(
    share: GuardianShare,
    ownerId: string,
    walletId: string
  ): Promise<StorageResponse> {
    try {
      const request: StorageRequest = {
        type: 'encrypted_share',
        data: JSON.stringify(share), // Already encrypted share
        ownerId,
        guardianId: share.guardianId,
        walletId,
        metadata: {
          shareIndex: share.shareIndex,
          encryptionAlgorithm: share.metadata.encryptionAlgorithm,
          keySize: share.metadata.keySize,
          shareHash: share.metadata.shareHash
        }
      };

      return await this.makeStorageRequest(request);
    } catch (error) {
      throw new ProtocolError('Failed to store guardian share', 'STORAGE_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        guardianId: share.guardianId,
        walletId
      });
    }
  }

  /**
   * Store guardian information
   * Only metadata, no sensitive data
   */
  async storeGuardianInfo(
    guardian: Guardian,
    ownerId: string,
    walletId: string
  ): Promise<StorageResponse> {
    try {
      // Only store non-sensitive metadata
      const safeGuardianData = {
        id: guardian.id,
        walletId: guardian.walletId,
        email: guardian.email,
        fullName: guardian.fullName,
        phoneNumber: guardian.phoneNumber,
        publicKey: guardian.publicKey,
        keyId: guardian.keyId,
        status: guardian.status,
        shareIndex: guardian.shareIndex,
        verificationLevel: guardian.verificationLevel,
        createdAt: guardian.createdAt,
        verifiedAt: guardian.verifiedAt,
        lastProofOfLife: guardian.lastProofOfLife
        // Note: metadata is excluded as it may contain sensitive info
      };

      const request: StorageRequest = {
        type: 'guardian_info',
        data: JSON.stringify(safeGuardianData),
        ownerId,
        guardianId: guardian.id,
        walletId,
        metadata: {
          status: guardian.status,
          verificationLevel: guardian.verificationLevel,
          shareIndex: guardian.shareIndex
        }
      };

      return await this.makeStorageRequest(request);
    } catch (error) {
      throw new ProtocolError('Failed to store guardian info', 'STORAGE_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        guardianId: guardian.id,
        walletId
      });
    }
  }

  /**
   * Store recovery attempt
   * Only metadata and status, no sensitive recovery data
   */
  async storeRecoveryAttempt(
    recovery: RecoveryAttempt,
    ownerId: string,
    walletId: string
  ): Promise<StorageResponse> {
    try {
      // Only store non-sensitive metadata
      const safeRecoveryData = {
        id: recovery.id,
        walletId: recovery.walletId,
        initiatedBy: recovery.initiatedBy,
        reason: recovery.reason,
        newOwnerEmail: recovery.newOwnerEmail,
        status: recovery.status,
        requiredSignatures: recovery.requiredSignatures,
        currentSignatures: recovery.currentSignatures,
        expiresAt: recovery.expiresAt,
        createdAt: recovery.createdAt,
        completedAt: recovery.completedAt
        // Note: guardianSignatures and metadata excluded for security
      };

      const request: StorageRequest = {
        type: 'recovery_attempt',
        data: JSON.stringify(safeRecoveryData),
        ownerId,
        walletId,
        metadata: {
          status: recovery.status,
          requiredSignatures: recovery.requiredSignatures,
          currentSignatures: recovery.currentSignatures
        }
      };

      return await this.makeStorageRequest(request);
    } catch (error) {
      throw new ProtocolError('Failed to store recovery attempt', 'STORAGE_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        recoveryId: recovery.id,
        walletId
      });
    }
  }

  /**
   * Store audit log entry
   * Signed and tamper-proof
   */
  async storeAuditLog(
    auditEntry: AuditLogEntry,
    ownerId: string,
    walletId: string
  ): Promise<StorageResponse> {
    try {
      const request: StorageRequest = {
        type: 'audit_log',
        data: JSON.stringify(auditEntry), // Already signed
        ownerId,
        walletId,
        metadata: {
          eventType: auditEntry.eventType,
          actorId: auditEntry.actorId,
          timestamp: auditEntry.timestamp,
          signature: auditEntry.signature
        }
      };

      return await this.makeStorageRequest(request);
    } catch (error) {
      throw new ProtocolError('Failed to store audit log', 'STORAGE_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        auditId: auditEntry.id,
        walletId
      });
    }
  }

  /**
   * Retrieve guardian share
   * Returns encrypted blob only
   */
  async getGuardianShare(
    guardianId: string,
    walletId: string,
    ownerId: string
  ): Promise<GuardianShare | null> {
    try {
      const response = await this.makeGetRequest(
        `guardian-shares/${guardianId}`,
        { walletId, ownerId }
      );

      if (!response.success || !response.data) {
        return null;
      }

      return JSON.parse(response.data) as GuardianShare;
    } catch (error) {
      throw new ProtocolError('Failed to retrieve guardian share', 'STORAGE_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        guardianId,
        walletId
      });
    }
  }

  /**
   * Retrieve guardian information
   */
  async getGuardianInfo(
    guardianId: string,
    walletId: string,
    ownerId: string
  ): Promise<Guardian | null> {
    try {
      const response = await this.makeGetRequest(
        `guardian-info/${guardianId}`,
        { walletId, ownerId }
      );

      if (!response.success || !response.data) {
        return null;
      }

      return JSON.parse(response.data) as Guardian;
    } catch (error) {
      throw new ProtocolError('Failed to retrieve guardian info', 'STORAGE_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        guardianId,
        walletId
      });
    }
  }

  /**
   * Retrieve recovery attempt
   */
  async getRecoveryAttempt(
    recoveryId: string,
    walletId: string,
    ownerId: string
  ): Promise<RecoveryAttempt | null> {
    try {
      const response = await this.makeGetRequest(
        `recovery-attempts/${recoveryId}`,
        { walletId, ownerId }
      );

      if (!response.success || !response.data) {
        return null;
      }

      return JSON.parse(response.data) as RecoveryAttempt;
    } catch (error) {
      throw new ProtocolError('Failed to retrieve recovery attempt', 'STORAGE_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        recoveryId,
        walletId
      });
    }
  }

  /**
   * Retrieve audit log entries for a wallet
   */
  async getAuditLogs(
    walletId: string,
    ownerId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLogEntry[]> {
    try {
      const response = await this.makeGetRequest(
        `audit-logs`,
        { walletId, ownerId, limit: limit.toString(), offset: offset.toString() }
      );

      if (!response.success || !response.data) {
        return [];
      }

      return JSON.parse(response.data) as AuditLogEntry[];
    } catch (error) {
      throw new ProtocolError('Failed to retrieve audit logs', 'STORAGE_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        walletId
      });
    }
  }

  /**
   * Get all guardians for a wallet
   */
  async getWalletGuardians(
    walletId: string,
    ownerId: string
  ): Promise<Guardian[]> {
    try {
      const response = await this.makeGetRequest(
        `wallet-guardians`,
        { walletId, ownerId }
      );

      if (!response.success || !response.data) {
        return [];
      }

      return JSON.parse(response.data) as Guardian[];
    } catch (error) {
      throw new ProtocolError('Failed to retrieve wallet guardians', 'STORAGE_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        walletId
      });
    }
  }

  /**
   * Get all recovery attempts for a wallet
   */
  async getWalletRecoveryAttempts(
    walletId: string,
    ownerId: string
  ): Promise<RecoveryAttempt[]> {
    try {
      const response = await this.makeGetRequest(
        `wallet-recovery-attempts`,
        { walletId, ownerId }
      );

      if (!response.success || !response.data) {
        return [];
      }

      return JSON.parse(response.data) as RecoveryAttempt[];
    } catch (error) {
      throw new ProtocolError('Failed to retrieve wallet recovery attempts', 'STORAGE_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        walletId
      });
    }
  }

  /**
   * Delete guardian share
   */
  async deleteGuardianShare(
    guardianId: string,
    walletId: string,
    ownerId: string
  ): Promise<boolean> {
    try {
      const response = await this.makeDeleteRequest(
        `guardian-shares/${guardianId}`,
        { walletId, ownerId }
      );

      return response.success;
    } catch (error) {
      throw new ProtocolError('Failed to delete guardian share', 'STORAGE_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        guardianId,
        walletId
      });
    }
  }

  /**
   * Make storage request to server
   */
  private async makeStorageRequest(request: StorageRequest): Promise<StorageResponse> {
    try {
      const response = await this.makeRequest('POST', 'storage', request);
      
      return {
        id: (response.data as { id?: string })?.id || '',
        success: response.success,
        error: response.error?.message
      };
    } catch (error) {
      return {
        id: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Make GET request
   */
  private async makeGetRequest(
    endpoint: string,
    params: Record<string, string>
  ): Promise<ProtocolResponse> {
    const queryString = new URLSearchParams(params).toString();

    const url = `${this.config.baseUrl}/${endpoint}?${queryString}`;
    return await this.makeRequest('GET', url);
  }

  /**
   * Make DELETE request
   */
  private async makeDeleteRequest(
    endpoint: string,
    params: Record<string, string>
  ): Promise<ProtocolResponse> {
    const queryString = new URLSearchParams(params).toString();

    const url = `${this.config.baseUrl}/${endpoint}?${queryString}`;
    return await this.makeRequest('DELETE', url);
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest(
    method: string,
    url: string,
    body?: unknown
  ): Promise<ProtocolResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const requestOptions: RequestInit = {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
            'X-Protocol-Version': '1.0.0',
            'X-Client-Type': 'web'
          },
          signal: controller.signal
        };

        if (body && method !== 'GET') {
          requestOptions.body = JSON.stringify(body);
        }

        const response = await fetch(url, requestOptions);
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data as ProtocolResponse;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < this.config.retryAttempts - 1) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new ProtocolError('Storage request failed after retries', 'STORAGE_ERROR', {
      error: lastError?.message || 'Unknown error',
      method,
      url,
      attempts: this.config.retryAttempts
    });
  }
}

// Export factory function
export function createStorageClient(config: StorageConfig): StorageClient {
  return new StorageClient(config);
}
