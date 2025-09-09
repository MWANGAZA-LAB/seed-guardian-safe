/**
 * Seed Guardian Safe Protocol - Main Export
 * 
 * This is the main export file for the Seed Guardian Safe Protocol.
 * It provides a unified interface for all protocol functionality.
 */

// Core Types
export type * from './core/types';

// Protocol Client
export { 
  SeedGuardianProtocol, 
  createProtocolClient, 
  defaultProtocolConfig 
} from './protocol-client';

// Wallet Management
export { 
  ClientWalletManager, 
  walletManager,
  type CreateWalletRequest,
  type CreateWalletResponse 
} from './wallet/wallet-manager';

// Cryptography
export { 
  ClientSideShamir, 
  shamir,
  type SecretShare,
  type ShamirConfig 
} from './crypto/shamir';

export { 
  ClientSideEncryption, 
  encryption,
  type EncryptionResult,
  type DecryptionResult 
} from './crypto/encryption';

// Audit Log Protocol
export { 
  AuditLogProtocol, 
  auditLog,
  type AuditLogChain,
  type MerkleProof 
} from './audit/audit-log';

// Storage Client
export { 
  StorageClient, 
  createStorageClient,
  type StorageConfig,
  type StorageRequest,
  type StorageResponse 
} from './storage/storage-client';

// Protocol Version
export const PROTOCOL_VERSION = '1.0.0';

// Protocol Information
export const PROTOCOL_INFO = {
  name: 'Seed Guardian Safe Protocol',
  version: PROTOCOL_VERSION,
  description: 'Trust-first, protocol-style Bitcoin inheritance and social recovery',
  author: 'Seed Guardian Safe Team',
  license: 'MIT',
  repository: 'https://github.com/MWANGAZA-LAB/seed-guardian-safe',
  documentation: 'https://docs.seedguardian.safe',
  features: [
    'Client-side cryptography',
    'Shamir\'s Secret Sharing',
    'RSA-OAEP encryption',
    'Signed audit logs',
    'Merkle tree verification',
    'Multi-client support',
    'Zero-knowledge architecture',
    'Tamper-proof logging'
  ],
  supportedClients: [
    'Web (React/TypeScript)',
    'CLI (Node.js/Go)',
    'Desktop (Tauri/Electron)'
  ],
  security: {
    cryptography: 'Client-side only',
    storage: 'Encrypted blobs only',
    audit: 'Signed and tamper-proof',
    verification: 'Merkle tree proofs',
    trust: 'Zero server trust required'
  }
};

// Quick Start Helper
export function createQuickStartProtocol(storageConfig: {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
  retryAttempts?: number;
}) {
  const config = {
    storage: {
      baseUrl: storageConfig.baseUrl,
      apiKey: storageConfig.apiKey,
      timeout: storageConfig.timeout || 30000,
      retryAttempts: storageConfig.retryAttempts || 3
    },
    protocol: defaultProtocolConfig
  };

  return createProtocolClient(config);
}

// Protocol Validation
export function validateProtocolVersion(version: string): boolean {
  return version === PROTOCOL_VERSION;
}

// Protocol Capabilities
export function getProtocolCapabilities() {
  return {
    shamirSecretSharing: true,
    rsaEncryption: true,
    aesEncryption: true,
    digitalSignatures: true,
    merkleTrees: true,
    hashChains: true,
    auditLogging: true,
    multiClientSupport: true,
    zeroKnowledge: true,
    tamperProof: true
  };
}
