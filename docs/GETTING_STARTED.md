# Getting Started with Seed Guardian Safe

## What is Bitcoin Inheritance?

Bitcoin inheritance is the process of securely transferring Bitcoin assets to beneficiaries after the original owner's death or incapacitation. Unlike traditional assets, Bitcoin requires special handling due to its cryptographic nature and the need to protect private keys.

### Key Challenges:
- **Private Key Security** - Keys must be protected from loss and theft
- **Access Control** - Only authorized beneficiaries should gain access
- **Timing** - Recovery should only happen when appropriate
- **Verification** - Proof of death or incapacitation is required

## Understanding Social Recovery

Social recovery is a cryptographic method that distributes trust among multiple parties (guardians) rather than relying on a single point of failure. It uses Shamir's Secret Sharing to split a master seed into multiple encrypted shares.

### How It Works:
1. **Seed Splitting** - Master seed is split into multiple shares
2. **Guardian Distribution** - Each guardian receives one encrypted share
3. **Threshold Recovery** - A minimum number of guardians must cooperate to reconstruct the seed
4. **Verification** - Guardians verify the legitimacy of recovery requests

## Setting Up Your First Wallet

### Prerequisites
- 24-word Bitcoin seed phrase
- 3-5 trusted guardians
- Secure device with internet connection

### Step 1: Install the Protocol

```bash
git clone https://github.com/MWANGAZA-LAB/seed-guardian-safe.git
cd seed-guardian-safe
npm install
```

### Step 2: Create Your Wallet

```typescript
import { createProtocolClient } from '@/protocol';

const protocol = createProtocolClient({
  storage: {
    baseUrl: 'https://your-api-domain.com',
    apiKey: 'your-api-key'
  }
});

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
});
```

### Step 3: Set Up Proof of Life

```typescript
import { createPoLManager } from '@/protocol/pol';

const polManager = await createPoLManager({
  walletId: wallet.id,
  storage: createClientStorage(),
  serverAPI: yourServerAPI
});

// Enroll in Proof of Life system
await polManager.enroll('user-name', 'User Display Name', true);

// Start automatic monitoring
await polManager.startMonitoring();
```

## Choosing Your Guardians

### Guardian Selection Criteria

**Trustworthiness**
- Family members or close friends
- Professional relationships (lawyers, accountants)
- Technical expertise (for CLI tools)

**Reliability**
- Available for verification requests
- Technically capable of using the system
- Willing to participate in recovery process

**Diversity**
- Different geographic locations
- Different age groups
- Different technical skill levels

### Guardian Types

**Basic Guardian**
- Email verification only
- Suitable for non-technical users
- Simple setup process

**Enhanced Guardian**
- Email + SMS verification
- Additional security layer
- Recommended for most users

**Hardware Guardian**
- Hardware token (YubiKey) required
- Maximum security
- For technical users

**Biometric Guardian**
- WebAuthn/biometric authentication
- Modern security standards
- For users with compatible devices

## Proof of Life (PoL) Setup

### What is Proof of Life?

Proof of Life is a cryptographic system that allows you to prove you are alive and active without revealing your identity. It uses biometric authentication and automatic monitoring to ensure your wallet remains secure.

### Key Features:
- **WebAuthn Integration** - Biometric authentication
- **Automatic Monitoring** - Weekly check-ins
- **Guardian Notifications** - Alerts when check-ins are missed
- **Time-Based Recovery** - Automatic recovery after extended inactivity

### Setup Process:

1. **Enable WebAuthn**
   ```typescript
   // WebAuthn will prompt for biometric authentication
   await polManager.enroll('user-name', 'User Display Name', true);
   ```

2. **Configure Monitoring**
   ```typescript
   // Start automatic weekly check-ins
   await polManager.startMonitoring();
   ```

3. **Test Manual Check-in**
   ```typescript
   // Perform a manual check-in to verify setup
   const proof = await polManager.performCheckIn('manual');
   ```

## Guardian CLI Tools

### Installation

```bash
# Download guardian CLI tool
wget https://github.com/MWANGAZA-LAB/seed-guardian-safe/releases/latest/download/pol-cli-linux
chmod +x pol-cli-linux
```

### Initialization

```bash
# Initialize guardian
./pol-cli init --guardian-id "guardian-1" --verification-level "enhanced"
```

### Basic Operations

```bash
# Check wallet status
./pol-cli status --wallet-id "wallet-id"

# List notifications
./pol-cli notifications --wallet-id "wallet-id"

# Verify proof
./pol-cli verify --proof-file "proof.json" --public-key "public-key"

# Sign recovery
./pol-cli recovery sign --trigger-id "trigger-id"
```

## Security Best Practices

### Wallet Security
- Use a strong, unique password
- Store your seed phrase securely offline
- Enable all available security features
- Regularly test your recovery process

### Guardian Security
- Choose guardians carefully
- Provide them with proper training
- Test the recovery process regularly
- Keep guardian contact information updated

### Proof of Life Security
- Enable WebAuthn if available
- Set up automatic monitoring
- Respond to guardian notifications promptly
- Test manual check-ins regularly

## Common Issues and Solutions

### Setup Issues
- **WebAuthn not supported** - Use enhanced verification instead
- **Guardian invitation failed** - Check email addresses and try again
- **Proof of Life enrollment failed** - Ensure browser supports WebAuthn

### Recovery Issues
- **Guardian unavailable** - Contact alternative guardians
- **Verification failed** - Check verification codes and try again
- **Threshold not met** - Ensure enough guardians are available

### Technical Issues
- **Connection problems** - Check internet connection and try again
- **Authentication failures** - Verify credentials and permissions
- **CLI tool errors** - Check configuration and try again

## Next Steps

1. **Test Your Setup** - Perform a test recovery with your guardians
2. **Train Your Guardians** - Ensure they understand their role
3. **Document Your Process** - Keep records of your setup
4. **Regular Maintenance** - Update guardian information as needed
5. **Stay Informed** - Follow updates and security advisories

## Support Resources

- **Documentation** - [Complete Technical Documentation](TECHNICAL_DOCUMENTATION.md)
- **API Reference** - [API Documentation](API_REFERENCE.md)
- **Security Guide** - [Security Best Practices](SECURITY_GUIDE.md)
- **GitHub Discussions** - [Join the Discussion](https://github.com/MWANGAZA-LAB/seed-guardian-safe/discussions)
- **GitHub Issues** - [Report Problems](https://github.com/MWANGAZA-LAB/seed-guardian-safe/issues)

---

**Ready to secure your Bitcoin inheritance?** Start with the [Quick Start Guide](#setting-up-your-first-wallet) and join our community for support and updates.
