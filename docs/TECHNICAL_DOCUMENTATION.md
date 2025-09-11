# Seed Guardian Safe - Complete Technical Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Protocol Components](#core-protocol-components)
3. [Proof of Life System](#proof-of-life-system)
4. [Cryptographic Implementation](#cryptographic-implementation)
5. [Storage Layer](#storage-layer)
6. [Guardian System](#guardian-system)
7. [Recovery Process](#recovery-process)
8. [Security Model](#security-model)
9. [API Reference](#api-reference)
10. [Deployment Guide](#deployment-guide)

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  CLIENT LAYER                              │
│─────────────────────────────────────────────────────────────│
│  • Web Application (React/TypeScript)                      │
│  • CLI Client (Node.js/Go)                                 │
│  • Desktop Application (Tauri/Electron)                    │
│  • Mobile Application (React Native)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/WSS
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  PROTOCOL LAYER                            │
│─────────────────────────────────────────────────────────────│
│  • Proof of Life Manager                                   │
│  • Wallet Manager                                          │
│  • Guardian Manager                                        │
│  • Audit Log Manager                                       │
│  • Cryptographic Engine                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Encrypted Data Only
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  STORAGE LAYER                             │
│─────────────────────────────────────────────────────────────│
│  • Supabase (PostgreSQL)                                   │
│  • IPFS (Decentralized)                                    │
│  • Local Storage (IndexedDB)                               │
│  • Bitcoin Script (Taproot)                                │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Wallet Creation**: User generates seed → Splits via Shamir's → Encrypts shares → Stores encrypted data
2. **Proof of Life**: User signs timestamp+challenge → Submits proof → Guardians verify → Status updated
3. **Recovery**: Guardian initiates → Others sign → Threshold reached → Seed reconstructed
4. **Audit**: All operations logged → Signed entries → Merkle tree → Public verification

## Core Protocol Components

### 1. Protocol Client (`src/protocol/protocol-client.ts`)

Main orchestrator for all protocol operations.

```typescript
interface ProtocolClient {
  // Initialization
  initialize(): Promise<void>;
  
  // Wallet Management
  createWallet(request: CreateWalletRequest, privateKey: string): Promise<Wallet>;
  loadWallet(walletId: string, ownerId: string): Promise<Wallet>;
  updateWallet(walletId: string, updates: Partial<Wallet>): Promise<Wallet>;
  
  // Guardian Management
  addGuardian(walletId: string, guardian: Guardian): Promise<void>;
  removeGuardian(walletId: string, guardianId: string): Promise<void>;
  updateGuardian(walletId: string, guardianId: string, updates: Partial<Guardian>): Promise<void>;
  
  // Recovery Operations
  initiateRecovery(request: RecoveryRequest): Promise<Recovery>;
  signRecovery(recoveryId: string, guardianId: string, signature: string): Promise<void>;
  reconstructSeed(walletId: string, shares: GuardianShare[]): Promise<string>;
  
  // Audit Operations
  getAuditLog(walletId: string, limit?: number): Promise<AuditEntry[]>;
  verifyAuditChain(walletId: string): Promise<VerificationResult>;
}
```

### 2. Wallet Manager (`src/protocol/wallet/wallet-manager.ts`)

Handles wallet lifecycle and operations.

```typescript
class WalletManager {
  // Wallet Creation
  async createWallet(request: CreateWalletRequest): Promise<Wallet> {
    // 1. Generate master seed
    // 2. Split via Shamir's Secret Sharing
    // 3. Encrypt shares with guardian public keys
    // 4. Store encrypted data
    // 5. Create audit entries
  }
  
  // Seed Reconstruction
  async reconstructSeed(shares: GuardianShare[]): Promise<string> {
    // 1. Decrypt shares with guardian private keys
    // 2. Reconstruct via Shamir's Secret Sharing
    // 3. Verify integrity
    // 4. Return master seed
  }
}
```

### 3. Audit Log Manager (`src/protocol/audit/audit-log.ts`)

Manages tamper-proof audit trails.

```typescript
class AuditLogManager {
  // Add Entry
  async addEntry(entry: AuditEntry): Promise<void> {
    // 1. Sign entry with private key
    // 2. Calculate hash
    // 3. Update Merkle tree
    // 4. Store in database
  }
  
  // Verify Chain
  async verifyChain(walletId: string): Promise<VerificationResult> {
    // 1. Retrieve all entries
    // 2. Verify signatures
    // 3. Verify hash chain
    // 4. Verify Merkle tree
  }
}
```

## Proof of Life System

### Architecture

The Proof of Life (PoL) system ensures users can prove they are alive cryptographically without revealing identity.

```
┌─────────────────────────────────────────────────────────────┐
│                  CLIENT DEVICE                             │
│─────────────────────────────────────────────────────────────│
│  • WebAuthn Integration                                    │
│  • Ed25519/secp256k1 Keypairs                             │
│  • Heartbeat System                                        │
│  • Local Storage (IndexedDB)                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Signed Proofs
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  SERVER LAYER                              │
│─────────────────────────────────────────────────────────────│
│  • Proof Verification                                      │
│  • Status Monitoring                                       │
│  • Guardian Notifications                                  │
│  • Recovery Triggers                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Guardian Actions
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  GUARDIAN NETWORK                          │
│─────────────────────────────────────────────────────────────│
│  • CLI Tools (Go)                                          │
│  • Web Dashboard (React)                                   │
│  • Multi-signature Recovery                                │
│  • Smart Contract Integration                               │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

#### 1. PoL Manager (`src/protocol/pol/manager.ts`)

Main orchestrator for Proof of Life operations.

```typescript
class PoLManager {
  // Initialization
  async initialize(): Promise<void>;
  
  // Enrollment
  async enroll(userName: string, userDisplayName: string, enableWebAuthn: boolean): Promise<PoLEnrollment>;
  
  // Monitoring
  async startMonitoring(): Promise<void>;
  async stopMonitoring(): Promise<void>;
  async performCheckIn(proofType: 'manual' | 'emergency'): Promise<PoLProof>;
  
  // Status Management
  async getStatus(): Promise<PoLStatus>;
  async getProofHistory(limit?: number): Promise<PoLProof[]>;
  async verifyProof(proof: PoLProof): Promise<PoLVerificationResult>;
  
  // Guardian Operations
  addGuardian(config: GuardianConfig): void;
  removeGuardian(guardianId: string): void;
  async getGuardianNotifications(): Promise<GuardianNotification[]>;
  async acknowledgeNotification(notificationId: string): Promise<void>;
  
  // Recovery Management
  async triggerRecovery(reason: 'pol_timeout' | 'manual' | 'guardian_consensus'): Promise<RecoveryTrigger>;
  async signRecovery(triggerId: string, guardianId: string, signature: string): Promise<void>;
  async getRecoveryTriggers(): Promise<RecoveryTrigger[]>;
}
```

#### 2. WebAuthn Integration (`src/protocol/pol/webauthn.ts`)

Biometric authentication support.

```typescript
class WebAuthnManager {
  // Credential Management
  async enrollCredential(userId: string, userName: string, userDisplayName: string): Promise<WebAuthnCredential>;
  async authenticate(credentialId: string, challenge: string): Promise<AuthenticationResult>;
  
  // Verification
  async verifySignature(signature: string, authenticatorData: string, clientDataJSON: string, publicKey: string, challenge: string): Promise<boolean>;
  
  // Utility
  isSupported(): boolean;
  async getAvailableAuthenticators(): Promise<AuthenticatorInfo>;
}
```

#### 3. Key Generation (`src/protocol/pol/keygen.ts`)

Cryptographic key management.

```typescript
class PoLKeyManager {
  // Key Generation
  async generateKeyPair(config: KeyGenConfig): Promise<PoLKeyPair>;
  
  // Signing & Verification
  async signData(data: string, privateKey: string, algorithm: 'ed25519' | 'secp256k1'): Promise<string>;
  async verifySignature(data: string, signature: string, publicKey: string, algorithm: 'ed25519' | 'secp256k1'): Promise<boolean>;
  
  // Key Management
  async encryptPrivateKey(privateKey: string, password: string, salt: string): Promise<EncryptedKey>;
  async decryptPrivateKey(encryptedKey: string, password: string, salt: string, iv: string): Promise<string>;
  async validateKeyPair(keyPair: PoLKeyPair): Promise<boolean>;
}
```

#### 4. Heartbeat System (`src/protocol/pol/heartbeat.ts`)

Automatic check-in system.

```typescript
class PoLHeartbeat {
  // Lifecycle
  async initialize(walletId: string, keyPair: PoLKeyPair): Promise<void>;
  async start(): Promise<void>;
  stop(): void;
  
  // Check-ins
  async performCheckIn(proofType: 'automatic' | 'manual' | 'emergency'): Promise<PoLProof>;
  async forceCheckIn(): Promise<PoLProof>;
  async emergencyCheckIn(): Promise<PoLProof>;
  
  // Status
  getStatus(): HeartbeatStatus;
  isOverdue(): boolean;
  getTimeUntilNextCheckIn(): number;
  getMissedCount(): number;
  getEscalationLevel(): number;
}
```

#### 5. Guardian Verification (`src/protocol/pol/verifier.ts`)

Multi-guardian verification system.

```typescript
class PoLVerifier {
  // Guardian Management
  addGuardian(config: GuardianConfig): void;
  removeGuardian(guardianId: string): void;
  
  // Proof Verification
  async verifyProof(proof: PoLProof, publicKey: string): Promise<PoLVerificationResult>;
  async getWalletStatus(walletId: string, lastProof?: PoLProof): Promise<PoLStatus>;
  
  // Recovery Management
  async createRecoveryTrigger(walletId: string, reason: string, guardianSignatures: GuardianSignature[]): Promise<RecoveryTrigger>;
  async verifyGuardianSignature(signature: GuardianSignature, recoveryData: string): Promise<boolean>;
  async checkRecoveryThreshold(trigger: RecoveryTrigger): Promise<boolean>;
}
```

### Data Structures

#### PoL Proof
```typescript
interface PoLProof {
  id: string;
  walletId: string;
  timestamp: number;
  challenge: string;
  signature: string;
  publicKey: string;
  proofType: 'automatic' | 'manual' | 'emergency';
  metadata: {
    deviceFingerprint?: string;
    userAgent?: string;
    ipAddress?: string;
    location?: string;
  };
}
```

#### PoL Status
```typescript
interface PoLStatus {
  walletId: string;
  lastProofTimestamp: number;
  status: 'active' | 'missed' | 'escalated' | 'recovery_triggered';
  nextCheckIn: number;
  missedCount: number;
  escalationLevel: number;
  guardianNotifications: GuardianNotification[];
}
```

#### Recovery Trigger
```typescript
interface RecoveryTrigger {
  id: string;
  walletId: string;
  triggeredAt: number;
  reason: 'pol_timeout' | 'manual' | 'guardian_consensus';
  guardianSignatures: GuardianSignature[];
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  requiredSignatures: number;
  receivedSignatures: number;
}
```

## Cryptographic Implementation

### Algorithms Used

1. **Shamir's Secret Sharing**: Splitting master seeds
2. **RSA-OAEP**: Guardian share encryption
3. **AES-GCM**: Local storage encryption
4. **RSA-PSS**: Digital signatures
5. **Ed25519/secp256k1**: Proof of Life signatures
6. **PBKDF2**: Password-based key derivation
7. **SHA-256**: Hashing and integrity
8. **WebAuthn**: Biometric authentication

### Key Management

```typescript
// Key Generation
const keyPair = await encryption.generateKeyPair({
  algorithm: 'RSA',
  keySize: 2048,
  hashAlgorithm: 'SHA-256'
});

// Encryption
const encrypted = await encryption.encryptWithRSA(
  data,
  publicKey,
  keyId
);

// Decryption
const decrypted = await encryption.decryptWithRSA(
  encryptedData,
  privateKey,
  keyId
);

// Signing
const signature = await encryption.signData(
  data,
  privateKey,
  'RSA-PSS'
);

// Verification
const isValid = await encryption.verifySignature(
  data,
  signature,
  publicKey,
  'RSA-PSS'
);
```

### Shamir's Secret Sharing

```typescript
// Split Secret
const shares = await shamir.splitSecret(masterSeed, {
  threshold: 3,
  totalShares: 5,
  algorithm: 'GF256'
});

// Reconstruct Secret
const reconstructed = await shamir.reconstructSecret([
  { index: 1, value: share1 },
  { index: 2, value: share2 },
  { index: 3, value: share3 }
]);
```

## Storage Layer

### Database Schema

#### Wallets Table
```sql
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  owner_id UUID NOT NULL,
  threshold INTEGER NOT NULL,
  total_guardians INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Guardians Table
```sql
CREATE TABLE guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  public_key TEXT NOT NULL,
  verification_level VARCHAR(50) DEFAULT 'basic',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Encrypted Shares Table
```sql
CREATE TABLE encrypted_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
  guardian_id UUID REFERENCES guardians(id) ON DELETE CASCADE,
  share_index INTEGER NOT NULL,
  encrypted_data TEXT NOT NULL,
  key_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Proof of Life Table
```sql
CREATE TABLE proof_of_life (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
  proof_type VARCHAR(50) NOT NULL,
  proof_data JSONB,
  ip_address INET,
  user_agent TEXT,
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Audit Logs Table
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  actor_id UUID,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data JSONB,
  signature TEXT NOT NULL,
  previous_hash TEXT,
  merkle_root TEXT
);
```

### Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE encrypted_shares ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY wallet_owner_policy ON wallets
  FOR ALL TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY guardian_access_policy ON guardians
  FOR ALL TO authenticated
  USING (
    wallet_id IN (
      SELECT id FROM wallets WHERE owner_id = auth.uid()
    ) OR
    id IN (
      SELECT guardian_id FROM guardian_invitations 
      WHERE email = auth.email()
    )
  );
```

## Guardian System

### Guardian Types

1. **Basic Guardian**: Email verification only
2. **Enhanced Guardian**: Email + SMS verification
3. **Hardware Guardian**: Hardware token (YubiKey) required
4. **Biometric Guardian**: WebAuthn/biometric authentication

### Guardian Workflow

```typescript
// 1. Invite Guardian
const invitation = await protocol.inviteGuardian(walletId, {
  email: 'guardian@example.com',
  fullName: 'John Doe',
  verificationLevel: 'enhanced'
});

// 2. Guardian Accepts
const guardian = await protocol.acceptInvitation(invitation.token, {
  publicKey: guardianPublicKey,
  verificationMethod: 'email'
});

// 3. Guardian Verification
const verification = await protocol.verifyGuardian(guardianId, {
  method: 'email',
  code: '123456'
});

// 4. Guardian Operations
await protocol.signRecovery(recoveryId, guardianId, signature);
```

### Guardian CLI Tool

```bash
# Initialize Guardian
./pol-cli init --guardian-id "guardian-1" --verification-level "enhanced"

# Check Status
./pol-cli status --wallet-id "wallet-id"

# Verify Proof
./pol-cli verify --proof-file "proof.json" --public-key "public-key"

# Manage Recovery
./pol-cli recovery list --wallet-id "wallet-id"
./pol-cli recovery sign --trigger-id "trigger-id"
```

## Recovery Process

### Recovery Types

1. **Owner-Initiated**: User initiates recovery
2. **Guardian-Initiated**: Guardian initiates due to owner unavailability
3. **Proof of Life Timeout**: Automatic recovery after PoL timeout
4. **Emergency Recovery**: Immediate recovery for critical situations

### Recovery Workflow

```typescript
// 1. Initiate Recovery
const recovery = await protocol.initiateRecovery({
  walletId: 'wallet-id',
  guardianId: 'guardian-id',
  reason: 'owner_unavailable',
  newOwnerEmail: 'newowner@example.com',
  guardianPrivateKey: 'private-key'
});

// 2. Guardian Verification
const verification = await protocol.verifyGuardian(guardianId, {
  method: 'email',
  code: '123456'
});

// 3. Other Guardians Sign
const signature = await protocol.signRecovery(
  recovery.id,
  guardianId,
  guardianPrivateKey,
  'email'
);

// 4. Threshold Reached
if (recovery.signatures.length >= recovery.threshold) {
  const seed = await protocol.reconstructSeed(walletId, guardianShares);
}
```

### Smart Contract Integration

```solidity
// Recovery Contract
contract ProofOfLifeRecovery {
  function triggerRecovery(bytes32 walletId, string memory reason) external;
  function signRecovery(bytes32 walletId) external;
  function executeRecovery(bytes32 walletId) external;
  function getRecoveryStatus(bytes32 walletId) external view returns (RecoveryStatus);
}
```

## Security Model

### Threat Model

1. **Server Compromise**: Server cannot access plaintext data
2. **Guardian Compromise**: Single guardian cannot access seed
3. **Network Attacks**: All communications encrypted
4. **Client Compromise**: Private keys encrypted locally
5. **Social Engineering**: Multi-factor verification required

### Security Controls

1. **Cryptographic**: Military-grade algorithms
2. **Access Control**: Row-level security
3. **Audit Trail**: Tamper-proof logging
4. **Rate Limiting**: Brute force protection
5. **Input Validation**: XSS/injection prevention

### Security Best Practices

1. **Key Management**: Hardware security modules
2. **Backup Strategy**: Multiple backup locations
3. **Recovery Testing**: Regular recovery drills
4. **Guardian Selection**: Trusted individuals only
5. **Monitoring**: Continuous security monitoring

## API Reference

### Protocol Client API

```typescript
// Initialization
const protocol = createProtocolClient(config);
await protocol.initialize();

// Wallet Operations
const wallet = await protocol.createWallet(request, privateKey);
const loadedWallet = await protocol.loadWallet(walletId, ownerId);

// Guardian Operations
await protocol.addGuardian(walletId, guardian);
await protocol.removeGuardian(walletId, guardianId);

// Recovery Operations
const recovery = await protocol.initiateRecovery(request);
await protocol.signRecovery(recoveryId, guardianId, signature);
const seed = await protocol.reconstructSeed(walletId, shares);

// Audit Operations
const logs = await protocol.getAuditLog(walletId);
const verification = await protocol.verifyAuditChain(walletId);
```

### Proof of Life API

```typescript
// PoL Manager
const polManager = await createPoLManager(config);

// Enrollment
await polManager.enroll(userName, userDisplayName, enableWebAuthn);

// Monitoring
await polManager.startMonitoring();
const proof = await polManager.performCheckIn('manual');

// Status
const status = await polManager.getStatus();
const history = await polManager.getProofHistory();

// Guardian Operations
polManager.addGuardian(guardianConfig);
const notifications = await polManager.getGuardianNotifications();

// Recovery
const trigger = await polManager.triggerRecovery('pol_timeout');
await polManager.signRecovery(triggerId, guardianId, signature);
```

### Storage API

```typescript
// Client Storage
const storage = createClientStorage({
  useIndexedDB: true,
  useLocalStorage: true
});

await storage.initialize();
await storage.storeKeyPair(keyPair);
const keyPair = await storage.retrieveKeyPair(keyId);
await storage.storeProof(proof);
const proofs = await storage.retrieveProofs(walletId);
```

## Deployment Guide

### Environment Setup

```bash
# Install Dependencies
npm install

# Environment Variables
cp env.example .env
# Edit .env with your configuration

# Database Setup
npx supabase db push
npx supabase db seed

# Build Application
npm run build
```

### Production Deployment

```bash
# Web Application
npm run build
npm run deploy:pages

# CLI Tool
cd guardian-cli
go build -o pol-cli main.go

# Smart Contracts
npx hardhat compile
npx hardhat deploy --network mainnet
```

### Configuration

```typescript
// Protocol Configuration
const config = {
  storage: {
    baseUrl: process.env.STORAGE_URL,
    apiKey: process.env.STORAGE_KEY,
    timeout: 30000,
    retryAttempts: 3
  },
  protocol: {
    defaultThreshold: 3,
    maxGuardians: 10,
    auditLogRetention: 365
  },
  pol: {
    checkInInterval: 7 * 24 * 60 * 60, // 7 days
    gracePeriod: 24 * 60 * 60, // 1 day
    escalationThreshold: 3 * 24 * 60 * 60, // 3 days
    recoveryThreshold: 30 * 24 * 60 * 60 // 30 days
  }
};
```

### Monitoring

```typescript
// Health Checks
const health = await protocol.getHealthStatus();
console.log('Protocol Health:', health);

// Metrics
const metrics = await protocol.getMetrics();
console.log('Protocol Metrics:', metrics);

// Alerts
protocol.on('error', (error) => {
  console.error('Protocol Error:', error);
  // Send alert to monitoring system
});
```

This technical documentation provides a comprehensive overview of the Seed Guardian Safe protocol implementation, including the newly integrated Proof of Life system. It covers all major components, security considerations, and deployment procedures.
