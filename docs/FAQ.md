# Frequently Asked Questions - Seed Guardian Safe

## General Questions

### What is Seed Guardian Safe?

Seed Guardian Safe is a **trust-first, protocol-style architecture** that transforms Bitcoin inheritance from a SaaS application into a **Bitcoin-native, uncustodial standard**. It's the "PGP for Bitcoin inheritance" - a protocol, not a product.

### How does it work?

The protocol uses **Shamir's Secret Sharing** to split your Bitcoin master seed into multiple encrypted shares, which are distributed to trusted guardians. When recovery is needed, a threshold number of guardians must cooperate to reconstruct your seed.

### Is it secure?

Yes, the protocol uses **military-grade cryptography**:
- **Shamir's Secret Sharing** for seed splitting
- **RSA-OAEP encryption** for guardian shares
- **AES-GCM encryption** for local storage
- **Client-side cryptography only** - your private keys never leave your device

## Proof of Life System

### What is Proof of Life (PoL)?

Proof of Life is a cryptographic system that allows you to prove you are alive and active without revealing your identity. It uses biometric authentication and automatic monitoring to ensure your wallet remains secure.

### How does WebAuthn work?

WebAuthn is a web standard that enables secure authentication using biometrics (fingerprint, face recognition) or hardware security keys. It provides:
- **Platform authenticators** (Touch ID, Face ID, Windows Hello)
- **Cross-platform authenticators** (USB security keys)
- **User verification requirements**
- **Attestation verification**

### What happens if I miss a Proof of Life check-in?

The system has multiple escalation levels:
1. **Active** - Normal operation
2. **Missed** - 1 missed check-in (guardians notified)
3. **Escalated** - 3+ missed check-ins (increased monitoring)
4. **Recovery Triggered** - 30+ days of inactivity (automatic recovery)

### Can I perform manual check-ins?

Yes, you can perform manual check-ins at any time:
```typescript
const proof = await polManager.performCheckIn('manual');
```

## Guardian System

### Who can be a guardian?

Guardians should be:
- **Trustworthy** - Family members, close friends, or professionals
- **Reliable** - Available for verification requests
- **Technically capable** - Able to use the system
- **Willing to participate** - Understand their role in recovery

### How many guardians do I need?

We recommend **3-5 guardians** with a **threshold of 2-3**. This provides:
- **Redundancy** - Multiple guardians available
- **Security** - No single point of failure
- **Flexibility** - Can recover with partial guardian availability

### What are the different guardian types?

**Basic Guardian**
- Email verification only
- Suitable for non-technical users

**Enhanced Guardian**
- Email + SMS verification
- Additional security layer

**Hardware Guardian**
- Hardware token (YubiKey) required
- Maximum security

**Biometric Guardian**
- WebAuthn/biometric authentication
- Modern security standards

### How do guardians verify recovery requests?

Guardians receive notifications and must:
1. **Verify their identity** using multi-factor authentication
2. **Review the recovery request** and justification
3. **Cryptographically sign** their approval
4. **Provide their encrypted share** for reconstruction

## Recovery Process

### What types of recovery are supported?

1. **Owner-Initiated** - When you're available and can authenticate
2. **Guardian-Initiated** - When you're unavailable but guardians can verify
3. **Proof of Life Timeout** - Automatic recovery after extended inactivity
4. **Emergency Recovery** - Critical situations requiring immediate access

### How long does recovery take?

- **Owner-Initiated**: Immediate
- **Guardian-Initiated**: 24-48 hours
- **Proof of Life Timeout**: 30+ days
- **Emergency Recovery**: 2-4 hours

### What happens during recovery?

1. **Initiation** - Recovery request created
2. **Notification** - Guardians notified
3. **Verification** - Guardians verify and approve
4. **Consensus** - Threshold number of guardians must approve
5. **Reconstruction** - Seed reconstructed from shares
6. **Audit** - All actions logged and verified

### Can I test the recovery process?

Yes, we strongly recommend testing the recovery process regularly:
```typescript
// Test recovery with guardians
const testRecovery = await protocol.initiateRecovery({
  walletId: 'wallet-id',
  reason: 'test_recovery'
});
```

## Smart Contracts

### What smart contracts are used?

The protocol uses Bitcoin Script for:
- **Time-based recovery triggers**
- **Multi-guardian consensus**
- **Guardian management**
- **Recovery approval tracking**

### Which networks are supported?

- **Bitcoin Mainnet** - Production use
- **Bitcoin Testnet** - Testing and development
- **Bitcoin Regtest** - Local development
- **Bitcoin Signet** - Testing network

### How do I interact with Bitcoin Script?

You can interact with Bitcoin Script through:
- **Web interface** - User-friendly interface
- **CLI tools** - Command-line interface
- **API** - Programmatic access
- **Direct script calls** - Advanced users

## CLI Tools

### What CLI tools are available?

**Guardian CLI** - For guardians to manage their role:
```bash
# Check wallet status
./pol-cli status --wallet-id "wallet-id"

# Approve recovery
./pol-cli recovery approve --recovery-id "recovery-id"

# Verify proof of life
./pol-cli verify --proof-file "proof.json"
```

**Protocol CLI** - For protocol management:
```bash
# Create wallet
./protocol-cli create-wallet --name "My Wallet"

# List wallets
./protocol-cli list-wallets

# Initiate recovery
./protocol-cli recovery --wallet-id "wallet-id"
```

### How do I install CLI tools?

```bash
# Download guardian CLI
wget https://github.com/MWANGAZA-LAB/seed-guardian-safe/releases/latest/download/pol-cli-linux
chmod +x pol-cli-linux

# Initialize guardian
./pol-cli init --guardian-id "guardian-1"
```

## Security Questions

### Is my data encrypted?

Yes, all sensitive data is encrypted:
- **Guardian shares** - Encrypted with RSA-OAEP
- **Local storage** - Encrypted with AES-GCM
- **Audit logs** - Signed with digital signatures
- **Proof of Life data** - Encrypted with Ed25519/secp256k1

### Can the server see my private keys?

**No, absolutely not.** The protocol is designed with **zero-knowledge architecture**:
- All cryptographic operations happen **client-side**
- Server never sees plaintext seeds or shares
- Only encrypted data is stored on the server
- Your private keys never leave your device

### What if the server is compromised?

The protocol is designed to be **server-agnostic**:
- Server compromise cannot access your private keys
- Only encrypted data is stored on the server
- Guardians can verify proofs independently
- Recovery can happen without server access

### How do I know my guardians are trustworthy?

Guardian selection is critical:
- Choose **family members** or **close friends**
- Consider **professional relationships** (lawyers, accountants)
- Ensure **technical capability** for CLI tools
- **Test the recovery process** regularly
- **Keep contact information updated**

## Technical Questions

### What programming languages are used?

- **TypeScript/JavaScript** - Web application and protocol
- **Go** - Guardian CLI tools
- **Solidity** - Smart contracts
- **SQL** - Database queries
- **Shell/Bash** - Deployment scripts

### What databases are supported?

- **Supabase** - PostgreSQL with Row Level Security
- **IPFS** - Decentralized storage
- **Arweave** - Permanent storage
- **Local** - File system storage

### What Bitcoin networks are supported?

- **Mainnet** - Production Bitcoin network
- **Testnet** - Bitcoin test network
- **Regtest** - Local development network

### How do I contribute to the project?

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Add tests**
5. **Submit a pull request**

## Deployment Questions

### How do I deploy the protocol?

See the [Deployment Guide](DEPLOYMENT_GUIDE.md) for detailed instructions:
- **Railway** - Application hosting
- **GitHub Pages** - Static site hosting
- **Supabase** - Database and authentication
- **Bitcoin Script** - Bitcoin-native recovery scripts

### What are the system requirements?

**Minimum Requirements**:
- **Node.js** 18+ for development
- **Modern browser** with WebAuthn support
- **2GB RAM** for development
- **10GB storage** for development

**Production Requirements**:
- **4GB RAM** minimum
- **20GB storage** minimum
- **SSL certificate** for HTTPS
- **Domain name** for production

### How do I monitor the system?

The protocol includes comprehensive monitoring:
- **Health checks** - Continuous service monitoring
- **Performance metrics** - Response times and throughput
- **Error tracking** - Exception and error monitoring
- **Audit logging** - Comprehensive activity logging

## Support Questions

### How do I get help?

**Documentation**:
- [Technical Documentation](TECHNICAL_DOCUMENTATION.md)
- [API Reference](API_REFERENCE.md)
- [Security Guide](SECURITY_GUIDE.md)
- [Troubleshooting Guide](TROUBLESHOOTING.md)

**Community Support**:
- [GitHub Issues](https://github.com/MWANGAZA-LAB/seed-guardian-safe/issues)
- [GitHub Discussions](https://github.com/MWANGAZA-LAB/seed-guardian-safe/discussions)
- [GitHub Discussions](https://github.com/MWANGAZA-LAB/seed-guardian-safe/discussions)

**Direct Support**:
- GitHub Issues: [Report Issues](https://github.com/MWANGAZA-LAB/seed-guardian-safe/issues)
- Security: [Security Issues](https://github.com/MWANGAZA-LAB/seed-guardian-safe/security)
- Emergency: [GitHub Discussions](https://github.com/MWANGAZA-LAB/seed-guardian-safe/discussions)

### How do I report bugs?

When reporting bugs, please include:
1. **System information** (OS, browser, version)
2. **Error details** (complete error messages)
3. **Steps to reproduce**
4. **Expected vs actual behavior**
5. **Logs** (browser console, network requests)

### How do I request features?

Feature requests can be submitted through:
- [GitHub Issues](https://github.com/MWANGAZA-LAB/seed-guardian-safe/issues)
- [GitHub Discussions](https://github.com/MWANGAZA-LAB/seed-guardian-safe/discussions)
- [GitHub Discussions](https://github.com/MWANGAZA-LAB/seed-guardian-safe/discussions)

## Legal and Compliance

### What license is used?

The project is licensed under the **MIT License** - see the [LICENSE](../LICENSE) file for details.

### Is it compliant with regulations?

The protocol is designed to be **regulation-agnostic**:
- **No custodial services** - Users maintain full control
- **No financial services** - Protocol only, not a product
- **Open source** - Transparent and auditable
- **User responsibility** - Users comply with local regulations

### What about privacy?

The protocol is designed with **privacy-first principles**:
- **No PII collection** - Only necessary data
- **Encrypted storage** - All sensitive data encrypted
- **Audit transparency** - Public audit trails
- **User control** - Users control their data

---

**Still have questions?** Check out our [Support Resources](#support-questions) or join our [GitHub Discussions](https://github.com/MWANGAZA-LAB/seed-guardian-safe/discussions) for help.
