# Proof of Life (PoL) Protocol Documentation

## Overview

The Proof of Life (PoL) protocol is a security layer for the Seed Guardian Safe that ensures users can prove they are alive cryptographically without revealing their identity. This system maintains Bitcoin-aligned decentralization and self-sovereignty while providing automated safety nets for wallet recovery.

## Architecture

### Core Components

1. **Client-Side Identity Anchor**
   - WebAuthn integration for biometric/device authentication
   - Ed25519/secp256k1 keypair generation
   - Encrypted public key storage on backup server
   - Private keys never leave client device

2. **Proof of Life Submission (Heartbeat System)**
   - Automatic periodic check-ins (weekly default)
   - Manual check-in fallback
   - Cryptographic signature verification
   - Challenge-response mechanism

3. **Guardian Verification**
   - Multi-guardian signature verification
   - Dashboard for status monitoring
   - CLI tool for guardian operations
   - Web interface for recovery management

4. **Recovery Logic**
   - Time-based escalation triggers
   - Multi-guardian consensus requirements
   - Smart contract integration
   - Automated recovery execution

## Installation

### Prerequisites

- Node.js 18+ 
- TypeScript 5+
- Modern browser with WebAuthn support
- Go 1.21+ (for CLI tool)

### Installation Steps

1. **Install dependencies:**
```bash
npm install
```

2. **Build the project:**
```bash
npm run build
```

3. **Run tests:**
```bash
npm run test
```

4. **Build CLI tool:**
```bash
cd guardian-cli
go build -o pol-cli main.go
```

## Usage

### Basic Setup

```typescript
import { 
  createPoLManager, 
  DEFAULT_POL_CONFIG, 
  DEFAULT_HEARTBEAT_CONFIG,
  DEFAULT_VERIFICATION_CONFIG,
  DEFAULT_WEBAUTHN_CONFIG 
} from '@/protocol/pol';
import { createClientStorage } from '@/protocol/pol/storage';

// Create storage instance
const storage = createClientStorage({
  useIndexedDB: true,
  useLocalStorage: true,
});

// Create server API (implement your own)
const serverAPI = {
  submitProof: async (proof) => ({ success: true, message: 'Proof submitted' }),
  getStatus: async (walletId) => ({ /* status object */ }),
  // ... other methods
};

// Create PoL manager
const manager = await createPoLManager({
  walletId: 'your-wallet-id',
  storage,
  serverAPI,
  webAuthnConfig: DEFAULT_WEBAUTHN_CONFIG,
  polConfig: DEFAULT_POL_CONFIG,
  heartbeatConfig: DEFAULT_HEARTBEAT_CONFIG,
  verificationConfig: DEFAULT_VERIFICATION_CONFIG,
});
```

### Enrollment

```typescript
// Enroll in Proof of Life system
const enrollment = await manager.enroll(
  'user-name',
  'User Display Name',
  true // Enable WebAuthn
);

console.log('Enrolled successfully:', enrollment);
```

### Monitoring

```typescript
// Start automatic monitoring
await manager.startMonitoring();

// Perform manual check-in
const proof = await manager.performCheckIn('manual');

// Get current status
const status = await manager.getStatus();
console.log('Current status:', status);
```

### Guardian Operations

```typescript
// Add guardian
manager.addGuardian({
  guardianId: 'guardian-1',
  publicKey: 'guardian-public-key',
  verificationLevel: 'basic',
  notificationPreferences: {
    email: true,
    sms: false,
    push: true,
  },
});

// Get guardian notifications
const notifications = await manager.getGuardianNotifications();

// Acknowledge notification
await manager.acknowledgeNotification('notification-id');
```

### Recovery Management

```typescript
// Trigger recovery
const trigger = await manager.triggerRecovery('pol_timeout');

// Sign recovery as guardian
await manager.signRecovery('trigger-id', 'guardian-id', 'signature');

// Get recovery triggers
const triggers = await manager.getRecoveryTriggers();
```

## CLI Tool Usage

### Initialize Guardian

```bash
./pol-cli init --guardian-id "guardian-1" --verification-level "enhanced"
```

### Check Status

```bash
./pol-cli status --wallet-id "wallet-id" --server-url "https://api.seedguardiansafe.com"
```

### Verify Proof

```bash
./pol-cli verify --proof-file "proof.json" --public-key "public-key"
```

### Manage Notifications

```bash
# List notifications
./pol-cli notifications --wallet-id "wallet-id"

# Acknowledge notification
./pol-cli acknowledge --notification-id "notification-id"
```

### Recovery Operations

```bash
# List recovery triggers
./pol-cli recovery list --wallet-id "wallet-id"

# Sign recovery
./pol-cli recovery sign --trigger-id "trigger-id"
```

## Smart Contract Integration

### Deployment

```solidity
// Deploy the recovery contract
ProofOfLifeRecovery recovery = new ProofOfLifeRecovery();
```

### Setup Guardians

```solidity
// Set up guardians for a wallet
address[] memory guardians = [guardian1, guardian2, guardian3];
string[] memory publicKeys = ["key1", "key2", "key3"];
recovery.setupGuardians(walletId, guardians, publicKeys);
```

### Update Proof of Life

```solidity
// Update PoL timestamp
recovery.updateProofOfLife(walletId, block.timestamp);
```

### Trigger Recovery

```solidity
// Trigger recovery process
recovery.triggerRecovery(walletId, "pol_timeout");
```

### Sign Recovery

```solidity
// Guardian signs recovery
recovery.signRecovery(walletId);
```

## Configuration

### PoL Configuration

```typescript
const polConfig = {
  checkInInterval: 7 * 24 * 60 * 60, // 7 days
  gracePeriod: 24 * 60 * 60, // 1 day
  escalationThreshold: 3 * 24 * 60 * 60, // 3 days
  recoveryThreshold: 30 * 24 * 60 * 60, // 30 days
  maxMissedCount: 3,
  requireManualVerification: true,
};
```

### Heartbeat Configuration

```typescript
const heartbeatConfig = {
  enabled: true,
  interval: 60 * 60 * 1000, // 1 hour
  retryAttempts: 3,
  retryDelay: 30 * 1000, // 30 seconds
  offlineMode: true,
};
```

### Verification Configuration

```typescript
const verificationConfig = {
  maxTimestampDrift: 300, // 5 minutes
  challengeValidityWindow: 3600, // 1 hour
  requireRecentProof: true,
  recentProofThreshold: 7 * 24 * 60 * 60, // 7 days
};
```

### WebAuthn Configuration

```typescript
const webAuthnConfig = {
  rpId: window.location.hostname,
  rpName: 'Seed Guardian Safe',
  timeout: 60000, // 1 minute
  userVerification: 'required',
  authenticatorSelection: {
    authenticatorAttachment: 'platform',
    userVerification: 'required',
    requireResidentKey: false,
  },
};
```

## Security Considerations

### Key Management

- Private keys never leave the client device
- Public keys are encrypted before storage
- Key derivation uses PBKDF2 with high iteration count
- Ed25519 for signature verification

### Proof Verification

- Challenge-response mechanism prevents replay attacks
- Timestamp validation with configurable drift tolerance
- Signature verification using stored public keys
- Device fingerprinting for additional security

### Guardian Security

- Multi-signature requirements for recovery
- Configurable threshold (default 60% of guardians)
- Guardian verification levels (basic, enhanced, hardware)
- Notification system for security events

### Network Security

- All communications encrypted (HTTPS/WSS)
- API rate limiting and authentication
- CORS configuration for web clients
- Input validation and sanitization

## Testing

### Unit Tests

```bash
# Run all tests
npm run test

# Run specific test suite
npm run test tests/protocol/pol/

# Run with coverage
npm run test:coverage
```

### Integration Tests

```bash
# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

### CLI Tests

```bash
cd guardian-cli
go test ./...
```

## Deployment

### Frontend Deployment

```bash
# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy:pages

# Deploy to Railway
npm run deploy:railway
```

### Smart Contract Deployment

```bash
# Compile contracts
npx hardhat compile

# Deploy to testnet
npx hardhat run scripts/deploy.js --network testnet

# Deploy to mainnet
npx hardhat run scripts/deploy.js --network mainnet
```

### CLI Tool Distribution

```bash
# Build for multiple platforms
cd guardian-cli
go build -o pol-cli-linux main.go
GOOS=windows go build -o pol-cli.exe main.go
GOOS=darwin go build -o pol-cli-macos main.go
```

## API Reference

### PoLManager

#### Methods

- `initialize()`: Initialize the PoL system
- `enroll(userName, userDisplayName, enableWebAuthn)`: Enroll in PoL
- `startMonitoring()`: Start automatic monitoring
- `stopMonitoring()`: Stop automatic monitoring
- `performCheckIn(proofType)`: Perform manual check-in
- `getStatus()`: Get current PoL status
- `getProofHistory(limit)`: Get proof history
- `verifyProof(proof)`: Verify a proof
- `addGuardian(config)`: Add guardian
- `removeGuardian(guardianId)`: Remove guardian
- `triggerRecovery(reason)`: Trigger recovery
- `getGuardianNotifications()`: Get notifications
- `acknowledgeNotification(notificationId)`: Acknowledge notification
- `signRecovery(triggerId, guardianId, signature)`: Sign recovery
- `getRecoveryTriggers()`: Get recovery triggers
- `updateConfig(config)`: Update PoL configuration
- `updateHeartbeatConfig(config)`: Update heartbeat configuration
- `updateVerificationConfig(config)`: Update verification configuration
- `getSystemInfo()`: Get system information
- `revokeEnrollment()`: Revoke enrollment
- `destroy()`: Cleanup resources

### Smart Contract

#### Functions

- `setupGuardians(walletId, guardianAddresses, publicKeys)`: Set up guardians
- `updateProofOfLife(walletId, timestamp)`: Update PoL timestamp
- `triggerRecovery(walletId, reason)`: Trigger recovery
- `signRecovery(walletId)`: Sign recovery as guardian
- `cancelRecovery(walletId)`: Cancel recovery
- `getRecoveryRequest(walletId)`: Get recovery details
- `getGuardians(walletId)`: Get guardians
- `isGuardian(walletId, guardianAddress)`: Check if guardian
- `canTriggerRecovery(walletId)`: Check if recovery can be triggered
- `getWalletStatus(walletId)`: Get wallet status

## Troubleshooting

### Common Issues

1. **WebAuthn not supported**
   - Ensure browser supports WebAuthn
   - Check HTTPS requirement
   - Verify authenticator availability

2. **Proof verification fails**
   - Check timestamp drift
   - Verify public key format
   - Ensure challenge is valid

3. **Heartbeat not working**
   - Check network connectivity
   - Verify server API endpoints
   - Review error logs

4. **Guardian operations fail**
   - Verify guardian configuration
   - Check signature format
   - Ensure proper permissions

### Debug Mode

```typescript
// Enable debug logging
const manager = new PoLManager(config, {
  onError: (error) => {
    console.error('PoL Error:', error);
  },
  onCheckIn: (proof) => {
    console.log('Check-in successful:', proof);
  },
  // ... other callbacks
});
```

### Logging

```typescript
// Enable detailed logging
import { Logger } from '@/lib/logger';

Logger.setLevel('debug');
Logger.debug('PoL Manager initialized');
```

## Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Style

- Use TypeScript strict mode
- Follow ESLint configuration
- Write comprehensive tests
- Document public APIs
- Use conventional commits

### Testing Requirements

- Unit tests for all functions
- Integration tests for workflows
- E2E tests for user journeys
- Security tests for vulnerabilities
- Performance tests for scalability

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:

- Create an issue on GitHub
- Join our Discord community
- Check the documentation
- Review the FAQ

## Changelog

### v1.0.0 (2025-01-10)

- Initial release
- Core PoL functionality
- WebAuthn integration
- Guardian management
- Smart contract integration
- CLI tool
- Comprehensive testing
- Documentation
