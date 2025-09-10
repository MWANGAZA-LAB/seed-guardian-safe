# 🏗️ Seed Guardian Safe Protocol

**Trust-First, Protocol-Style Bitcoin Inheritance & Social Recovery**

<!-- Deployment trigger: Fix GitHub Pages deployment - v1.0.3 -->

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Protocol](https://img.shields.io/badge/Protocol-v1.0.0-blue.svg)](https://github.com/MWANGAZA-LAB/seed-guardian-safe)

## 🎯 **Protocol Vision**

Seed Guardian Safe Protocol is a **trust-first, protocol-style architecture** that transforms Bitcoin inheritance from a SaaS application into a **Bitcoin-native, uncustodial standard**. This is the **"PGP for Bitcoin inheritance"** - a protocol, not a product.

## 🔑 **Core Principles**

### 1. **Client-Side Cryptography Only**
- All cryptographic operations (seed generation, splitting, encryption, recovery) happen **client-side**
- Server never sees plaintext seeds or shares
- Zero cryptographic trust in server infrastructure

### 2. **Shamir's Secret Sharing**
- Military-grade cryptographic protocol splits master seed
- Uses audited libraries for production security
- Threshold-based recovery (e.g., 3 of 5 guardians)

### 3. **Guardian-Based Recovery**
- Guardians receive encrypted shares (public key only)
- Store shares offline (local vault, USB, HSM)
- Verify recovery requests via MFA + cryptographic signatures
- Never see seed, only their encrypted fragment

### 4. **Signed Audit Log Protocol**
- JSON-based audit trail for all events
- Signed with user's and guardian's private keys
- Tamper-proof using Merkle trees and hash chains
- Public transparency for community verification

### 5. **Multi-Client Architecture**
- **Web App** (React/TypeScript) - onboarding & UX
- **CLI Client** (Node.js/Go) - hardcore Bitcoiners
- **Desktop App** (Tauri/Electron) - offline-first inheritance

## 🏛️ **Architecture Overview**

```
┌─────────────────────────────────────────────────────────────┐
│                  CLIENT (User's Device)                    │
│─────────────────────────────────────────────────────────────│
│  ✅ Generates master seed locally                          │
│  ✅ Splits seed via Shamir's Secret Sharing                │
│  ✅ Encrypts each share with Guardian's public key        │
│  ✅ Builds recovery policies (threshold, guardians, etc.)  │
│  ✅ Maintains local proof logs & verifiable audit trails   │
│                                                             │
│  🔑 CRYPTO LIVES HERE ONLY (browser, CLI, desktop app)     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ (encrypted blobs + signed proofs only)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  STORAGE & RELAY LAYER                     │
│        (Supabase/Postgres, IPFS/Arweave optional)          │
│─────────────────────────────────────────────────────────────│
│  ✅ Stores only encrypted guardian shares                  │
│  ✅ Stores metadata: guardians, recovery attempts, logs    │
│  ✅ No access to seeds or plaintext shares                 │
│  ✅ Row-level security enforces ownership boundaries       │
│                                                             │
│  📦 Dumb storage + message relay, no cryptographic trust   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ (recovery initiated with signed guardian actions)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  GUARDIANS (Distributed)                   │
│─────────────────────────────────────────────────────────────│
│  ✅ Receive encrypted share (public key only)              │
│  ✅ Store their share offline (local vault, USB, HSM)     │
│  ✅ Verify recovery requests via MFA + cryptographic sig  │
│  ✅ Never see seed, only their encrypted fragment         │
│                                                             │
│  👥 Guardians = trust anchors, not trusted custodians      │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ (threshold signatures reached)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  RECOVERY ENGINE (Client)                  │
│─────────────────────────────────────────────────────────────│
│  ✅ Pulls encrypted guardian shares                        │
│  ✅ Decrypts locally with guardian private keys           │
│  ✅ Reconstructs seed entirely client-side                 │
│  ✅ Provides restored wallet access                        │
│                                                             │
│  🔄 All recombination happens OFFLINE on user device       │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ (auditable signed logs)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  PUBLIC AUDIT TRAIL                        │
│─────────────────────────────────────────────────────────────│
│  ✅ Immutable logs of guardian verification, recovery      │
│  ✅ Verifiable proofs (signed JSON / Merkle trees)        │
│  ✅ Community can confirm legitimacy of recovery actions   │
│                                                             │
│  📜 Transparency layer → eliminates hidden operations      │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 **Quick Start**

### 1. **Install Protocol**

```bash
git clone https://github.com/MWANGAZA-LAB/seed-guardian-safe.git
cd seed-guardian-safe
npm install
```

### 2. **Initialize Protocol**

```typescript
import { createProtocolClient, defaultProtocolConfig } from '@/protocol';

const protocol = createProtocolClient({
  storage: {
    baseUrl: 'https://api.seedguardian.safe',
    apiKey: 'your-api-key',
    timeout: 30000,
    retryAttempts: 3
  },
  protocol: defaultProtocolConfig
});

await protocol.initialize();
```

### 3. **Create Wallet**

```typescript
import { encryption } from '@/protocol';

// Generate user key pair
const userKeyPair = await encryption.generateKeyPair();

// Create wallet
const wallet = await protocol.createWallet({
  name: 'My Inheritance Wallet',
  masterSeed: 'your-24-word-mnemonic-seed-phrase',
  guardians: [
    { email: 'guardian1@example.com', fullName: 'John Doe' },
    { email: 'guardian2@example.com', fullName: 'Jane Smith' },
    { email: 'guardian3@example.com', fullName: 'Bob Johnson' }
  ],
  threshold: 2, // Require 2 of 3 guardians
  userPassword: 'your-secure-password'
}, userKeyPair.privateKey);
```

### 4. **Initiate Recovery**

```typescript
// Guardian initiates recovery
const recovery = await protocol.initiateRecovery(
  wallet.id,
  guardianId,
  'owner_unavailable',
  'newowner@example.com',
  guardianPrivateKey
);

// Other guardians sign recovery
const signature = await protocol.signRecovery(
  wallet.id,
  recovery.id,
  guardianId,
  guardianPrivateKey,
  'email'
);
```

### 5. **Reconstruct Seed**

```typescript
// When threshold is reached, reconstruct seed
const reconstructedSeed = await protocol.reconstructSeed(
  wallet.id,
  [
    { shareIndex: 1, shareValue: 'encrypted-share-1', guardianPrivateKey: 'key1' },
    { shareIndex: 2, shareValue: 'encrypted-share-2', guardianPrivateKey: 'key2' }
  ]
);
```

## 🔧 **Protocol Components**

### **Core Types** (`src/protocol/core/types.ts`)
- Defines all protocol data structures
- Event types for audit logging
- Cryptographic key types
- Wallet and guardian interfaces

### **Client-Side Cryptography** (`src/protocol/crypto/`)
- **Shamir's Secret Sharing** (`shamir.ts`)
- **RSA-OAEP Encryption** (`encryption.ts`)
- **Digital Signatures** (RSA-PSS)
- **AES-GCM** for local storage

### **Audit Log Protocol** (`src/protocol/audit/audit-log.ts`)
- JSON-based event logging
- Signed entries with private keys
- Merkle tree verification
- Hash chain integrity

### **Wallet Manager** (`src/protocol/wallet/wallet-manager.ts`)
- Client-side wallet operations
- Guardian management
- Recovery process orchestration
- Seed reconstruction

### **Storage Client** (`src/protocol/storage/storage-client.ts`)
- Interface to dumb storage layer
- Encrypted blob storage only
- No plaintext data transmission
- Row-level security

## 🛡️ **Security Features**

### **Cryptographic Security**
- **Shamir's Secret Sharing**: Military-grade secret splitting
- **RSA-OAEP**: 2048-bit encryption for guardian shares
- **AES-GCM**: Authenticated encryption for local storage
- **RSA-PSS**: Digital signatures for audit logs
- **PBKDF2**: Password-based key derivation

### **Zero-Knowledge Architecture**
- Server never sees plaintext seeds
- All cryptographic operations client-side
- Encrypted blobs only in storage
- No cryptographic trust in server

### **Tamper-Proof Audit Trail**
- Signed JSON audit logs
- Merkle tree verification
- Hash chain integrity
- Public transparency

### **Guardian Verification**
- Multi-factor authentication
- Cryptographic signatures
- Proof of life monitoring
- Offline share storage

## 📱 **Multi-Client Support**

### **Web Client** (React/TypeScript)
```typescript
import { useProtocol } from '@/hooks/useProtocol';

function WalletManager() {
  const { createWallet, loadWallet, initiateRecovery } = useProtocol({
    storage: {
      baseUrl: process.env.REACT_APP_STORAGE_URL,
      apiKey: process.env.REACT_APP_STORAGE_KEY
    }
  });

  // Use protocol methods...
}
```

### **CLI Client** (Node.js)
```bash
# Install CLI
npm install -g @seed-guardian/cli

# Create wallet
seed-guardian create --name "My Wallet" --threshold 3 --guardians 5

# Initiate recovery
seed-guardian recover --wallet-id abc123 --reason "owner_unavailable"

# Sign recovery
seed-guardian sign --recovery-id def456 --verification email
```

### **Desktop Client** (Tauri/Electron)
- Offline-first operation
- Local key storage
- Hardware security module support
- Air-gapped recovery

## 🔍 **Audit & Verification**

### **Audit Log Structure**
```json
{
  "id": "audit-entry-id",
  "eventType": "recovery_initiated",
  "walletId": "wallet-uuid",
  "actorId": "guardian-uuid",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": {
    "recoveryId": "recovery-uuid",
    "reason": "owner_unavailable",
    "requiredSignatures": 2
  },
  "signature": "cryptographic-signature",
  "previousHash": "hash-of-previous-entry",
  "merkleRoot": "merkle-tree-root"
}
```

### **Verification Process**
```typescript
// Verify audit log chain
const verification = await protocol.verifyAuditLogChain(walletId);
console.log('Chain valid:', verification.isValid);
console.log('Merkle root valid:', verification.merkleRootValid);
console.log('Signatures valid:', verification.signaturesValid);

// Generate Merkle proof
const proof = await protocol.generateMerkleProof(entryId);
const isValid = await protocol.verifyMerkleProof(proof);
```

## 🌐 **Network Support**

### **Bitcoin Networks**
- **Mainnet**: Production Bitcoin network
- **Testnet**: Bitcoin test network
- **Regtest**: Local development network

### **Storage Options**
- **Supabase**: PostgreSQL with RLS
- **IPFS**: Decentralized storage
- **Arweave**: Permanent storage
- **Local**: File system storage

## 🔄 **Recovery Process**

### **1. Recovery Initiation**
```typescript
const recovery = await protocol.initiateRecovery(
  walletId,
  guardianId,
  'owner_unavailable',
  'newowner@example.com',
  guardianPrivateKey
);
```

### **2. Guardian Verification**
- Email/SMS verification
- Hardware token (YubiKey)
- Biometric authentication
- Social verification

### **3. Threshold Signatures**
```typescript
// Each guardian signs
const signature = await protocol.signRecovery(
  walletId,
  recoveryId,
  guardianId,
  guardianPrivateKey,
  'email'
);
```

### **4. Seed Reconstruction**
```typescript
// When threshold reached
const seed = await protocol.reconstructSeed(walletId, guardianShares);
```

## 🧪 **Testing & Development**

### **Unit Tests**
```bash
npm test
```

### **Integration Tests**
```bash
npm run test:integration
```

### **Protocol Tests**
```bash
npm run test:protocol
```

### **Security Tests**
```bash
npm run test:security
```

## 📚 **API Reference**

### **Protocol Client**
- `createProtocolClient(config)` - Create protocol instance
- `protocol.initialize()` - Initialize protocol
- `protocol.createWallet(request, privateKey)` - Create wallet
- `protocol.loadWallet(walletId, ownerId)` - Load wallet
- `protocol.initiateRecovery(...)` - Initiate recovery
- `protocol.signRecovery(...)` - Sign recovery
- `protocol.reconstructSeed(...)` - Reconstruct seed

### **Cryptography**
- `encryption.generateKeyPair()` - Generate RSA key pair
- `encryption.encryptWithRSA(data, publicKey, keyId)` - Encrypt data
- `encryption.decryptWithRSA(encryptedData, privateKey, keyId)` - Decrypt data
- `encryption.signData(data, privateKey)` - Sign data
- `encryption.verifySignature(data, signature, publicKey)` - Verify signature

### **Shamir's Secret Sharing**
- `shamir.splitSecret(secret, config)` - Split secret
- `shamir.reconstructSecret(shares)` - Reconstruct secret
- `shamir.verifyShares(shares)` - Verify shares

### **Audit Log**
- `auditLog.addEntry(...)` - Add audit entry
- `auditLog.verifyChain()` - Verify chain integrity
- `auditLog.generateMerkleProof(entryId)` - Generate proof
- `auditLog.verifyMerkleProof(proof)` - Verify proof

## 🚀 **Deployment**

### **Web Client**
```bash
npm run build
npm run deploy
```

### **CLI Client**
```bash
npm run build:cli
npm run package:cli
```

### **Desktop Client**
```bash
npm run build:desktop
npm run package:desktop
```

## 🔒 **Security Considerations**

### **Production Deployment**
- Use audited cryptographic libraries
- Implement hardware security modules
- Regular security audits
- Bug bounty program

### **Key Management**
- Store private keys securely
- Use hardware wallets when possible
- Implement key rotation
- Backup key material

### **Network Security**
- Use HTTPS/TLS for all communications
- Implement certificate pinning
- Rate limiting and DDoS protection
- Input validation and sanitization

## 📄 **License**

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 **Support**

- **Documentation**: [Protocol Guide](PROTOCOL_README.md)
- **Issues**: [GitHub Issues](https://github.com/MWANGAZA-LAB/seed-guardian-safe/issues)
- **Discord**: [Seed Guardian Safe Discord](https://discord.gg/seedguardian)
- **Email**: support@seedguardian.safe

## 🎯 **Roadmap**

### **Phase 1: Core Protocol** ✅
- [x] Client-side cryptography
- [x] Shamir's Secret Sharing
- [x] Audit log protocol
- [x] Storage layer

### **Phase 2: Multi-Client** 🚧
- [ ] CLI client (Node.js/Go)
- [ ] Desktop client (Tauri/Electron)
- [ ] Mobile client (React Native)

### **Phase 3: Ecosystem** 📋
- [ ] Wallet integrations (Sparrow, Electrum, Specter)
- [ ] Hardware wallet support
- [ ] Estate planning partnerships
- [ ] Community audits

### **Phase 4: Standardization** 🔮
- [ ] BIP proposal for Bitcoin inheritance
- [ ] Industry partnerships
- [ ] Regulatory compliance
- [ ] Global adoption

---

**Seed Guardian Safe Protocol** - Building the future of Bitcoin inheritance, one protocol at a time. 🚀

*Empowering Bitcoin holders with secure, decentralized inheritance solutions.*
