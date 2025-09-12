# Seed Guardian Safe - API Reference

## Table of Contents

1. [Protocol Client API](#protocol-client-api)
2. [Proof of Life API](#proof-of-life-api)
3. [Cryptographic API](#cryptographic-api)
4. [Storage API](#storage-api)
5. [Guardian API](#guardian-api)
6. [Audit API](#audit-api)
7. [Smart Contract API](#smart-contract-api)
8. [CLI API](#cli-api)
9. [Error Handling](#error-handling)
10. [Rate Limits](#rate-limits)

## Protocol Client API

### Initialization

```typescript
import { createProtocolClient, defaultProtocolConfig } from '@/protocol';

const protocol = createProtocolClient({
  storage: {
    baseUrl: 'https://your-api-domain.com',
    apiKey: 'your-api-key',
    timeout: 30000,
    retryAttempts: 3
  },
  protocol: defaultProtocolConfig
});

await protocol.initialize();
```

### Wallet Operations

#### Create Wallet

```typescript
interface CreateWalletRequest {
  name: string;
  masterSeed: string;
  guardians: Guardian[];
  threshold: number;
  userPassword: string;
}

const wallet = await protocol.createWallet(request, privateKey);
```

**Response:**
```typescript
interface Wallet {
  id: string;
  name: string;
  ownerId: string;
  threshold: number;
  totalGuardians: number;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'recovery' | 'suspended';
}
```

#### Load Wallet

```typescript
const wallet = await protocol.loadWallet(walletId, ownerId);
```

#### Update Wallet

```typescript
const updatedWallet = await protocol.updateWallet(walletId, {
  name: 'New Wallet Name',
  threshold: 3
});
```

### Guardian Operations

#### Add Guardian

```typescript
interface Guardian {
  email: string;
  fullName: string;
  verificationLevel: 'basic' | 'enhanced' | 'hardware' | 'biometric';
  publicKey?: string;
}

await protocol.addGuardian(walletId, guardian);
```

#### Remove Guardian

```typescript
await protocol.removeGuardian(walletId, guardianId);
```

#### Update Guardian

```typescript
await protocol.updateGuardian(walletId, guardianId, {
  verificationLevel: 'enhanced',
  publicKey: 'new-public-key'
});
```

### Recovery Operations

#### Initiate Recovery

```typescript
interface RecoveryRequest {
  walletId: string;
  guardianId: string;
  reason: 'owner_unavailable' | 'emergency' | 'pol_timeout';
  newOwnerEmail?: string;
  guardianPrivateKey: string;
}

const recovery = await protocol.initiateRecovery(request);
```

**Response:**
```typescript
interface Recovery {
  id: string;
  walletId: string;
  guardianId: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  requiredSignatures: number;
  receivedSignatures: number;
  signatures: GuardianSignature[];
  createdAt: string;
  expiresAt: string;
}
```

#### Sign Recovery

```typescript
await protocol.signRecovery(recoveryId, guardianId, signature);
```

#### Reconstruct Seed

```typescript
interface GuardianShare {
  shareIndex: number;
  shareValue: string;
  guardianPrivateKey: string;
}

const seed = await protocol.reconstructSeed(walletId, guardianShares);
```

## Proof of Life API

### PoL Manager

```typescript
import { createPoLManager, DEFAULT_POL_CONFIG } from '@/protocol/pol';

const polManager = await createPoLManager({
  walletId: 'wallet-id',
  storage: createClientStorage(),
  serverAPI: yourServerAPI,
  webAuthnConfig: DEFAULT_WEBAUTHN_CONFIG,
  polConfig: DEFAULT_POL_CONFIG,
  heartbeatConfig: DEFAULT_HEARTBEAT_CONFIG,
  verificationConfig: DEFAULT_VERIFICATION_CONFIG,
});
```

### Enrollment

```typescript
const enrollment = await polManager.enroll(
  'user-name',
  'User Display Name',
  true // Enable WebAuthn
);
```

**Response:**
```typescript
interface PoLEnrollment {
  walletId: string;
  publicKey: string;
  keyId: string;
  webauthnCredentialId?: string;
  enrolledAt: string;
  status: 'pending' | 'active' | 'revoked';
}
```

### Monitoring

```typescript
// Start automatic monitoring
await polManager.startMonitoring();

// Stop monitoring
polManager.stopMonitoring();

// Perform manual check-in
const proof = await polManager.performCheckIn('manual');

// Emergency check-in
const emergencyProof = await polManager.performCheckIn('emergency');
```

### Status Management

```typescript
// Get current status
const status = await polManager.getStatus();

// Get proof history
const history = await polManager.getProofHistory(10);

// Verify proof
const result = await polManager.verifyProof(proof);
```

**Status Response:**
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

### Guardian Operations

```typescript
// Add guardian
polManager.addGuardian({
  guardianId: 'guardian-1',
  publicKey: 'guardian-public-key',
  verificationLevel: 'basic',
  notificationPreferences: {
    email: true,
    sms: false,
    push: true
  }
});

// Get notifications
const notifications = await polManager.getGuardianNotifications();

// Acknowledge notification
await polManager.acknowledgeNotification('notification-id');
```

### Recovery Management

```typescript
// Trigger recovery
const trigger = await polManager.triggerRecovery('pol_timeout');

// Sign recovery
await polManager.signRecovery('trigger-id', 'guardian-id', 'signature');

// Get recovery triggers
const triggers = await polManager.getRecoveryTriggers();
```

## Cryptographic API

### Key Generation

```typescript
import { encryption } from '@/protocol/crypto';

// Generate RSA key pair
const keyPair = await encryption.generateKeyPair({
  algorithm: 'RSA',
  keySize: 2048,
  hashAlgorithm: 'SHA-256'
});

// Generate Ed25519 key pair
const ed25519KeyPair = await encryption.generateKeyPair({
  algorithm: 'Ed25519'
});
```

### Encryption/Decryption

```typescript
// Encrypt with RSA
const encrypted = await encryption.encryptWithRSA(
  data,
  publicKey,
  keyId
);

// Decrypt with RSA
const decrypted = await encryption.decryptWithRSA(
  encryptedData,
  privateKey,
  keyId
);

// Encrypt with AES-GCM
const aesEncrypted = await encryption.encryptWithAES(
  data,
  key,
  iv
);

// Decrypt with AES-GCM
const aesDecrypted = await encryption.decryptWithAES(
  encryptedData,
  key,
  iv
);
```

### Digital Signatures

```typescript
// Sign data
const signature = await encryption.signData(
  data,
  privateKey,
  'RSA-PSS'
);

// Verify signature
const isValid = await encryption.verifySignature(
  data,
  signature,
  publicKey,
  'RSA-PSS'
);
```

### Shamir's Secret Sharing

```typescript
import { shamir } from '@/protocol/crypto';

// Split secret
const shares = await shamir.splitSecret(masterSeed, {
  threshold: 3,
  totalShares: 5,
  algorithm: 'GF256'
});

// Reconstruct secret
const reconstructed = await shamir.reconstructSecret([
  { index: 1, value: share1 },
  { index: 2, value: share2 },
  { index: 3, value: share3 }
]);

// Verify shares
const isValid = await shamir.verifyShares(shares);
```

## Storage API

### Client Storage

```typescript
import { createClientStorage } from '@/protocol/pol/storage';

const storage = createClientStorage({
  dbName: 'seed_guardian_pol',
  dbVersion: 1,
  useIndexedDB: true,
  useLocalStorage: true
});

await storage.initialize();
```

### Key Pair Storage

```typescript
// Store key pair
await storage.storeKeyPair(keyPair);

// Retrieve key pair
const keyPair = await storage.retrieveKeyPair(keyId);

// Clear storage
await storage.clearStorage(walletId);
```

### Proof Storage

```typescript
// Store proof
await storage.storeProof(proof);

// Retrieve proofs
const proofs = await storage.retrieveProofs(walletId);
```

### Configuration Storage

```typescript
// Store configuration
await storage.storeConfig(config);

// Retrieve configuration
const config = await storage.retrieveConfig(walletId);
```

## Guardian API

### Guardian Management

```typescript
// Create guardian
const guardian = await guardianAPI.createGuardian({
  email: 'guardian@seedguardiansafe.com',
  fullName: 'John Doe',
  verificationLevel: 'enhanced'
});

// Update guardian
await guardianAPI.updateGuardian(guardianId, {
  verificationLevel: 'hardware',
  publicKey: 'new-public-key'
});

// Delete guardian
await guardianAPI.deleteGuardian(guardianId);
```

### Guardian Verification

```typescript
// Verify guardian
const verification = await guardianAPI.verifyGuardian(guardianId, {
  method: 'email',
  code: '123456'
});

// Get verification status
const status = await guardianAPI.getVerificationStatus(guardianId);
```

### Guardian Notifications

```typescript
// Get notifications
const notifications = await guardianAPI.getNotifications(guardianId);

// Mark notification as read
await guardianAPI.markNotificationAsRead(notificationId);

// Send notification
await guardianAPI.sendNotification(guardianId, {
  type: 'recovery_initiated',
  message: 'Recovery has been initiated for wallet'
});
```

## Audit API

### Audit Log Management

```typescript
import { auditLog } from '@/protocol/audit';

// Add audit entry
await auditLog.addEntry({
  eventType: 'wallet_created',
  walletId: 'wallet-id',
  actorId: 'user-id',
  data: { name: 'My Wallet' },
  signature: 'signature'
});

// Get audit log
const logs = await auditLog.getLog(walletId, { limit: 100 });

// Verify audit chain
const verification = await auditLog.verifyChain(walletId);
```

### Merkle Tree Operations

```typescript
// Generate Merkle proof
const proof = await auditLog.generateMerkleProof(entryId);

// Verify Merkle proof
const isValid = await auditLog.verifyMerkleProof(proof);

// Get Merkle root
const root = await auditLog.getMerkleRoot(walletId);
```

## Smart Contract API

### Recovery Contract

```solidity
// Deploy contract
ProofOfLifeRecovery recovery = new ProofOfLifeRecovery();

// Setup guardians
recovery.setupGuardians(walletId, guardianAddresses, publicKeys);

// Update proof of life
recovery.updateProofOfLife(walletId, block.timestamp);

// Trigger recovery
recovery.triggerRecovery(walletId, "pol_timeout");

// Sign recovery
recovery.signRecovery(walletId);

// Execute recovery
recovery.executeRecovery(walletId);
```

### Contract Events

```solidity
event RecoveryTriggered(
  bytes32 indexed walletId,
  uint256 timestamp,
  string reason,
  uint256 requiredSignatures
);

event GuardianSigned(
  bytes32 indexed walletId,
  address indexed guardian,
  uint256 timestamp
);

event RecoveryExecuted(
  bytes32 indexed walletId,
  uint256 timestamp,
  address executor
);
```

## CLI API

### Guardian CLI Commands

```bash
# Initialize guardian
./pol-cli init --guardian-id "guardian-1" --verification-level "enhanced"

# Check status
./pol-cli status --wallet-id "wallet-id" --server-url "https://api.seedguardiansafe.com"

# Verify proof
./pol-cli verify --proof-file "proof.json" --public-key "public-key"

# List notifications
./pol-cli notifications --wallet-id "wallet-id"

# Acknowledge notification
./pol-cli acknowledge --notification-id "notification-id"

# Recovery operations
./pol-cli recovery list --wallet-id "wallet-id"
./pol-cli recovery sign --trigger-id "trigger-id"
```

### Protocol CLI Commands

```bash
# Create wallet
seed-guardian create --name "My Wallet" --threshold 3 --guardians 5

# Load wallet
seed-guardian load --wallet-id "wallet-id"

# Add guardian
seed-guardian add-guardian --wallet-id "wallet-id" --email "guardian@seedguardiansafe.com"

# Initiate recovery
seed-guardian recover --wallet-id "wallet-id" --reason "owner_unavailable"

# Sign recovery
seed-guardian sign --recovery-id "recovery-id" --verification "email"

# Audit log
seed-guardian audit --wallet-id "wallet-id" --limit 100
```

## Error Handling

### Error Types

```typescript
// Protocol Errors
class ProtocolError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'ProtocolError';
  }
}

// PoL Errors
class PoLError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'PoLError';
  }
}

// Storage Errors
class StorageError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'StorageError';
  }
}
```

### Error Codes

```typescript
const ERROR_CODES = {
  // General
  INITIALIZATION_FAILED: 'INITIALIZATION_FAILED',
  ENROLLMENT_FAILED: 'ENROLLMENT_FAILED',
  VERIFICATION_FAILED: 'VERIFICATION_FAILED',
  
  // WebAuthn
  WEBAUTHN_NOT_SUPPORTED: 'WEBAUTHN_NOT_SUPPORTED',
  CREDENTIAL_CREATION_FAILED: 'CREDENTIAL_CREATION_FAILED',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  
  // Key Management
  KEY_GENERATION_FAILED: 'KEY_GENERATION_FAILED',
  SIGNING_FAILED: 'SIGNING_FAILED',
  ENCRYPTION_FAILED: 'ENCRYPTION_FAILED',
  
  // Network
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
};
```

### Error Handling Example

```typescript
try {
  await protocol.createWallet(request, privateKey);
} catch (error) {
  if (error instanceof ProtocolError) {
    switch (error.code) {
      case 'INITIALIZATION_FAILED':
        console.error('Failed to initialize protocol:', error.message);
        break;
      case 'ENROLLMENT_FAILED':
        console.error('Enrollment failed:', error.message);
        break;
      default:
        console.error('Protocol error:', error.message);
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Rate Limits

### API Rate Limits

```typescript
const RATE_LIMITS = {
  // Proof of Life
  'pol/check-in': {
    limit: 10,
    window: '1m'
  },
  'pol/verify': {
    limit: 100,
    window: '1h'
  },
  
  // Guardian Operations
  'guardian/invite': {
    limit: 5,
    window: '1h'
  },
  'guardian/verify': {
    limit: 20,
    window: '1h'
  },
  
  // Recovery Operations
  'recovery/initiate': {
    limit: 3,
    window: '1h'
  },
  'recovery/sign': {
    limit: 10,
    window: '1h'
  }
};
```

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640995200
X-RateLimit-Retry-After: 60
```

### Rate Limit Handling

```typescript
// Check rate limit
const rateLimit = await api.checkRateLimit('pol/check-in');
if (rateLimit.remaining === 0) {
  const retryAfter = rateLimit.reset - Date.now();
  throw new RateLimitError('Rate limit exceeded', retryAfter);
}

// Retry with backoff
const retryWithBackoff = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof RateLimitError && i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, error.retryAfter));
        continue;
      }
      throw error;
    }
  }
};
```

This API reference provides comprehensive documentation for all the Seed Guardian Safe protocol APIs, including the newly implemented Proof of Life system. It covers all major endpoints, data structures, error handling, and rate limiting.
