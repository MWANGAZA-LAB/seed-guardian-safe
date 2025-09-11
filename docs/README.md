# Seed Guardian Safe - Documentation

Welcome to the comprehensive documentation for the Seed Guardian Safe protocol. This documentation covers all aspects of the protocol, from basic usage to advanced deployment and operations.

## 📚 Documentation Overview

### Core Documentation

- **[Technical Documentation](TECHNICAL_DOCUMENTATION.md)** - Complete technical architecture and implementation details
- **[Proof of Life System](PROOF_OF_LIFE.md)** - Comprehensive guide to the Proof of Life security layer
- **[API Reference](API_REFERENCE.md)** - Complete API documentation for all protocol components
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Production deployment and operations guide

### Quick Start Guides

- **[Getting Started](GETTING_STARTED.md)** - Quick start guide for new users
- **[Security Guide](SECURITY_GUIDE.md)** - Security best practices and considerations
- **[Recovery Guide](RECOVERY_GUIDE.md)** - Complete guide to the recovery process
- **[Troubleshooting Guide](TROUBLESHOOTING.md)** - Common issues and solutions
- **[FAQ](FAQ.md)** - Frequently asked questions

## 🚀 Quick Start

### For Users

1. **Install the Protocol**
   ```bash
   git clone https://github.com/MWANGAZA-LAB/seed-guardian-safe.git
   cd seed-guardian-safe
   npm install
   ```

2. **Create Your First Wallet**
   ```typescript
   import { createProtocolClient } from '@/protocol';
   
   const protocol = createProtocolClient({
     storage: { baseUrl: 'https://api.seedguardian.safe' }
   });
   
   const wallet = await protocol.createWallet({
     name: 'My Inheritance Wallet',
     masterSeed: 'your-24-word-mnemonic',
     guardians: [
       { email: 'guardian1@example.com', fullName: 'John Doe' },
       { email: 'guardian2@example.com', fullName: 'Jane Smith' }
     ],
     threshold: 2
   });
   ```

3. **Set Up Proof of Life**
   ```typescript
   import { createPoLManager } from '@/protocol/pol';
   
   const polManager = await createPoLManager({
     walletId: wallet.id,
     storage: createClientStorage(),
     serverAPI: yourServerAPI
   });
   
   await polManager.enroll('user-name', 'User Display Name', true);
   await polManager.startMonitoring();
   ```

### For Developers

1. **Set Up Development Environment**
   ```bash
   npm install
   npm run dev
   ```

2. **Run Tests**
   ```bash
   npm test
   npm run test:integration
   npm run test:security
   ```

3. **Build for Production**
   ```bash
   npm run build
   npm run deploy
   ```

### For Guardians

1. **Install Guardian CLI**
   ```bash
   # Download from releases
   wget https://github.com/MWANGAZA-LAB/seed-guardian-safe/releases/latest/download/pol-cli-linux
   chmod +x pol-cli-linux
   ```

2. **Initialize Guardian**
   ```bash
   ./pol-cli init --guardian-id "guardian-1" --verification-level "enhanced"
   ```

3. **Monitor Wallets**
   ```bash
   ./pol-cli status --wallet-id "wallet-id"
   ./pol-cli notifications --wallet-id "wallet-id"
   ```

## 🔧 Protocol Components

### Core Protocol

- **Protocol Client** - Main orchestrator for all operations
- **Wallet Manager** - Wallet lifecycle and operations
- **Guardian Manager** - Guardian management and verification
- **Audit Log Manager** - Tamper-proof audit trails
- **Storage Client** - Encrypted data storage

### Proof of Life System

- **PoL Manager** - Main orchestrator for Proof of Life operations
- **WebAuthn Integration** - Biometric authentication support
- **Key Generation** - Ed25519/secp256k1 keypair management
- **Heartbeat System** - Automatic check-in system
- **Guardian Verification** - Multi-guardian verification
- **Client Storage** - Secure local storage

### Cryptographic Engine

- **Shamir's Secret Sharing** - Secret splitting and reconstruction
- **RSA-OAEP Encryption** - Guardian share encryption
- **AES-GCM Encryption** - Local storage encryption
- **Digital Signatures** - RSA-PSS and Ed25519 signatures
- **Key Derivation** - PBKDF2 password-based key derivation

## 🛡️ Security Features

### Cryptographic Security

- **Military-grade algorithms** - Shamir's Secret Sharing, RSA-OAEP, AES-GCM
- **Client-side cryptography** - All operations happen on user device
- **Zero-knowledge architecture** - Server never sees plaintext data
- **Tamper-proof audit trails** - Signed entries with Merkle tree verification

### Proof of Life Security

- **WebAuthn integration** - Biometric authentication standards
- **Ed25519/secp256k1 signatures** - Modern cryptographic signatures
- **Challenge-response mechanism** - Prevents replay attacks
- **Device fingerprinting** - Additional security layer
- **Multi-guardian consensus** - 60% threshold for recovery

### Guardian Security

- **Multi-factor authentication** - Email, SMS, hardware tokens
- **Offline share storage** - Guardians store shares locally
- **Cryptographic verification** - All actions cryptographically signed
- **Time-based recovery** - Automated safety nets

## 📱 Multi-Client Support

### Web Application

- **React/TypeScript** - Modern web interface
- **Responsive design** - Works on all devices
- **Progressive Web App** - Offline capabilities
- **WebAuthn support** - Biometric authentication

### CLI Tools

- **Node.js CLI** - Protocol management
- **Go CLI** - Guardian operations
- **Cross-platform** - Linux, Windows, macOS
- **Scriptable** - Automation support

### Desktop Application

- **Tauri/Electron** - Native desktop apps
- **Offline-first** - Works without internet
- **Hardware integration** - HSM support
- **Air-gapped recovery** - Secure recovery process

## 🔄 Recovery Process

### Recovery Types

1. **Owner-Initiated** - User initiates recovery
2. **Guardian-Initiated** - Guardian initiates due to owner unavailability
3. **Proof of Life Timeout** - Automatic recovery after PoL timeout
4. **Emergency Recovery** - Immediate recovery for critical situations

### Recovery Workflow

1. **Initiation** - Guardian or system initiates recovery
2. **Verification** - Multi-factor authentication required
3. **Consensus** - Threshold number of guardians must sign
4. **Reconstruction** - Seed reconstructed client-side
5. **Audit** - All actions logged and verified

## 🌐 Network Support

### Bitcoin Networks

- **Mainnet** - Production Bitcoin network
- **Testnet** - Bitcoin test network
- **Regtest** - Local development network

### Storage Options

- **Supabase** - PostgreSQL with Row Level Security
- **IPFS** - Decentralized storage
- **Arweave** - Permanent storage
- **Local** - File system storage

## 🧪 Testing & Development

### Test Suites

- **Unit Tests** - Individual component testing
- **Integration Tests** - End-to-end workflow testing
- **Security Tests** - Vulnerability and penetration testing
- **Performance Tests** - Load and stress testing

### Development Tools

- **TypeScript** - Type-safe development
- **ESLint** - Code quality and consistency
- **Prettier** - Code formatting
- **Jest** - Testing framework
- **Hardhat** - Smart contract development

## 📊 Monitoring & Operations

### Application Monitoring

- **Health Checks** - Continuous service monitoring
- **Performance Metrics** - Response times and throughput
- **Error Tracking** - Exception and error monitoring
- **Audit Logging** - Comprehensive activity logging

### Security Monitoring

- **Rate Limiting** - Brute force protection
- **Intrusion Detection** - Suspicious activity monitoring
- **Certificate Monitoring** - SSL/TLS certificate health
- **Backup Verification** - Data backup integrity

## 🚀 Deployment

### Production Deployment

- **Railway** - Application hosting
- **GitHub Pages** - Static site hosting
- **Supabase** - Database and authentication
- **Bitcoin Script** - Bitcoin-native recovery scripts

### CI/CD Pipeline

- **GitHub Actions** - Automated testing and deployment
- **Docker** - Containerized deployment
- **Environment Management** - Staging and production environments
- **Rollback Procedures** - Safe deployment rollbacks

## 📞 Support & Community

### Getting Help

- **Documentation** - Comprehensive guides and references
- **GitHub Issues** - Bug reports and feature requests
- **Discord Community** - Real-time support and discussion
- **Email Support** - Direct technical support

### Contributing

- **Code Contributions** - Pull requests and code reviews
- **Documentation** - Improving guides and references
- **Testing** - Bug reports and test cases
- **Community** - Helping other users and developers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🎯 Roadmap

### Phase 1: Core Protocol ✅
- [x] Client-side cryptography
- [x] Shamir's Secret Sharing
- [x] Audit log protocol
- [x] Storage layer
- [x] **Proof of Life (PoL) system**
- [x] **WebAuthn integration**
- [x] **Multi-guardian recovery**
- [x] **Smart contract integration**

### Phase 2: Multi-Client 🚧
- [ ] CLI client (Node.js/Go)
- [ ] Desktop client (Tauri/Electron)
- [ ] Mobile client (React Native)

### Phase 3: Ecosystem 📋
- [ ] Wallet integrations (Sparrow, Electrum, Specter)
- [ ] Hardware wallet support
- [ ] Estate planning partnerships
- [ ] Community audits

### Phase 4: Standardization 🔮
- [ ] BIP proposal for Bitcoin inheritance
- [ ] Industry partnerships
- [ ] Regulatory compliance
- [ ] Global adoption

---

**Seed Guardian Safe Protocol** - Building the future of Bitcoin inheritance, one protocol at a time. 🚀

*Empowering Bitcoin holders with secure, decentralized inheritance solutions.*
