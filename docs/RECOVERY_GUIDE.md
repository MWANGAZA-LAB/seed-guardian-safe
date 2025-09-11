# Recovery Process Guide - Seed Guardian Safe

## Overview

The recovery process in Seed Guardian Safe is designed to be secure, verifiable, and user-friendly. This guide covers all aspects of the recovery workflow, including the newly implemented Proof of Life timeout recovery and smart contract integration.

## Recovery Types

### 1. Owner-Initiated Recovery

**When to Use**: When the wallet owner is available and can authenticate
**Requirements**: Owner's password and authentication
**Process**: Direct recovery with owner verification

```typescript
// Owner initiates recovery
const recovery = await protocol.initiateRecovery({
  walletId: 'wallet-id',
  reason: 'owner_initiated',
  ownerPassword: 'owner-password'
});

// Verify owner identity
const verification = await protocol.verifyOwnerIdentity({
  recoveryId: recovery.id,
  authentication: ownerAuth
});
```

### 2. Guardian-Initiated Recovery

**When to Use**: When the owner is unavailable but guardians can verify the need
**Requirements**: Guardian consensus and verification
**Process**: Multi-guardian verification and approval

```typescript
// Guardian initiates recovery
const recovery = await protocol.initiateRecovery({
  walletId: 'wallet-id',
  reason: 'guardian_initiated',
  guardianId: 'guardian-id',
  justification: 'Owner incapacitated'
});

// Other guardians verify and approve
await protocol.approveRecovery({
  recoveryId: recovery.id,
  guardianId: 'guardian-2',
  approval: true
});
```

### 3. Proof of Life Timeout Recovery

**When to Use**: When Proof of Life check-ins are missed for extended periods
**Requirements**: Automatic trigger after timeout period
**Process**: Time-based escalation with guardian notification

```typescript
// Check Proof of Life status
const polStatus = await polManager.getStatus();

// Trigger recovery if timeout exceeded
if (polStatus.escalationLevel >= 3) {
  const recovery = await protocol.initiateRecovery({
    walletId: 'wallet-id',
    reason: 'pol_timeout',
    triggerData: {
      lastCheckIn: polStatus.lastCheckIn,
      timeoutPeriod: polStatus.timeoutPeriod,
      escalationLevel: polStatus.escalationLevel
    }
  });
}
```

### 4. Emergency Recovery

**When to Use**: Critical situations requiring immediate access
**Requirements**: Emergency procedures and verification
**Process**: Expedited recovery with additional security measures

```typescript
// Emergency recovery
const recovery = await protocol.initiateRecovery({
  walletId: 'wallet-id',
  reason: 'emergency',
  emergencyCode: 'emergency-code',
  justification: 'Medical emergency'
});
```

## Recovery Workflow

### Step 1: Initiation

**Trigger**: Recovery request initiated by owner, guardian, or system
**Verification**: Initial identity verification
**Documentation**: Recovery request logged in audit trail

```typescript
// Create recovery request
const recoveryRequest = {
  id: generateId(),
  walletId: 'wallet-id',
  initiator: 'guardian-1',
  reason: 'pol_timeout',
  timestamp: Date.now(),
  status: 'pending',
  requiredApprovals: 2,
  currentApprovals: 0
};

// Log in audit trail
await auditLog.addEntry({
  eventType: 'recovery_initiated',
  data: recoveryRequest
});
```

### Step 2: Guardian Notification

**Notification**: All guardians notified of recovery request
**Information**: Recovery reason, initiator, and required actions
**Response**: Guardians can approve, deny, or request more information

```typescript
// Notify guardians
const notifications = await Promise.all(
  guardians.map(guardian => 
    notificationService.sendRecoveryNotification({
      guardianId: guardian.id,
      recoveryId: recoveryRequest.id,
      reason: recoveryRequest.reason,
      initiator: recoveryRequest.initiator
    })
  )
);
```

### Step 3: Guardian Verification

**Authentication**: Multi-factor authentication required
**Verification**: Guardians verify the legitimacy of the recovery
**Consensus**: Threshold number of guardians must approve

```typescript
// Guardian verification process
const verification = await guardianAPI.verifyGuardian({
  guardianId: 'guardian-1',
  recoveryId: recoveryRequest.id,
  authentication: {
    method: 'email',
    code: '123456'
  }
});

// Check consensus
const consensus = await protocol.checkRecoveryConsensus({
  recoveryId: recoveryRequest.id,
  requiredThreshold: 2
});
```

### Step 4: Multi-Signature Approval

**Signatures**: All approving guardians must cryptographically sign
**Verification**: All signatures verified against guardian public keys
**Consensus**: Threshold reached when enough valid signatures collected

```typescript
// Guardian signs recovery approval
const signature = await guardianAPI.signRecoveryApproval({
  recoveryId: recoveryRequest.id,
  guardianId: 'guardian-1',
  privateKey: guardianPrivateKey
});

// Verify signature
const isValid = await protocol.verifyGuardianSignature({
  signature,
  recoveryId: recoveryRequest.id,
  guardianId: 'guardian-1',
  publicKey: guardianPublicKey
});
```

### Step 5: Seed Reconstruction

**Shares**: Encrypted shares collected from approving guardians
**Decryption**: Shares decrypted with guardian private keys
**Reconstruction**: Master seed reconstructed using Shamir's Secret Sharing

```typescript
// Collect guardian shares
const shares = await Promise.all(
  approvingGuardians.map(async guardian => {
    const encryptedShare = await guardianAPI.getShare({
      guardianId: guardian.id,
      walletId: recoveryRequest.walletId
    });
    
    const decryptedShare = await encryption.decryptWithRSA(
      encryptedShare,
      guardian.privateKey
    );
    
    return {
      index: guardian.shareIndex,
      value: decryptedShare
    };
  })
);

// Reconstruct master seed
const masterSeed = await shamir.reconstructSecret(shares);
```

### Step 6: Audit and Verification

**Audit**: Complete recovery process logged
**Verification**: All steps verified and documented
**Transparency**: Public audit trail maintained

```typescript
// Log successful recovery
await auditLog.addEntry({
  eventType: 'recovery_completed',
  data: {
    recoveryId: recoveryRequest.id,
    walletId: recoveryRequest.walletId,
    guardians: approvingGuardians,
    timestamp: Date.now(),
    signature: await signData(recoveryData, systemPrivateKey)
  }
});
```

## Smart Contract Integration

### Recovery Contract

**Purpose**: Time-based recovery with multi-guardian consensus
**Network**: Ethereum mainnet and testnets
**Features**: Automated triggers and guardian management

```solidity
// Recovery contract
contract ProofOfLifeRecovery {
    struct RecoveryTrigger {
        address walletOwner;
        uint256 lastCheckIn;
        uint256 timeoutPeriod;
        uint256 escalationLevel;
        bool isActive;
    }
    
    mapping(bytes32 => RecoveryTrigger) public recoveryTriggers;
    mapping(bytes32 => mapping(address => bool)) public guardianApprovals;
    
    function triggerRecovery(bytes32 walletId) external {
        RecoveryTrigger storage trigger = recoveryTriggers[walletId];
        require(trigger.isActive, "Recovery not active");
        require(block.timestamp > trigger.lastCheckIn + trigger.timeoutPeriod, "Timeout not reached");
        
        // Emit recovery event
        emit RecoveryTriggered(walletId, trigger.escalationLevel);
    }
    
    function approveRecovery(bytes32 walletId, address guardian) external {
        require(guardianApprovals[walletId][guardian], "Guardian not authorized");
        require(!guardianApprovals[walletId][guardian], "Already approved");
        
        guardianApprovals[walletId][guardian] = true;
        
        // Check if threshold reached
        if (checkRecoveryThreshold(walletId)) {
            emit RecoveryApproved(walletId);
        }
    }
}
```

### Guardian Management

**Registration**: Guardians register their public keys
**Verification**: Guardian identity verified on-chain
**Consensus**: Threshold-based approval system

```typescript
// Register guardian on contract
const tx = await recoveryContract.registerGuardian({
  walletId: 'wallet-id',
  guardianAddress: guardianAddress,
  publicKey: guardianPublicKey,
  verificationLevel: 'enhanced'
});

// Wait for confirmation
await tx.wait();
```

## Guardian CLI Tools

### Installation

```bash
# Download guardian CLI
wget https://github.com/MWANGAZA-LAB/seed-guardian-safe/releases/latest/download/pol-cli-linux
chmod +x pol-cli-linux
```

### Basic Operations

```bash
# Check wallet status
./pol-cli status --wallet-id "wallet-id"

# List recovery requests
./pol-cli recovery list --wallet-id "wallet-id"

# Approve recovery
./pol-cli recovery approve --recovery-id "recovery-id" --guardian-id "guardian-id"

# Sign recovery
./pol-cli recovery sign --recovery-id "recovery-id" --private-key "private-key"
```

### Advanced Operations

```bash
# Verify proof of life
./pol-cli verify --proof-file "proof.json" --public-key "public-key"

# Check consensus status
./pol-cli consensus --recovery-id "recovery-id"

# Export guardian data
./pol-cli export --guardian-id "guardian-id" --output "backup.json"
```

## Recovery Scenarios

### Scenario 1: Normal Recovery

**Situation**: Owner wants to recover wallet
**Process**: Owner-initiated recovery
**Timeline**: Immediate

```typescript
// Owner recovery
const recovery = await protocol.initiateRecovery({
  walletId: 'wallet-id',
  reason: 'owner_initiated'
});

// Immediate recovery
const masterSeed = await protocol.completeRecovery({
  recoveryId: recovery.id,
  ownerPassword: 'owner-password'
});
```

### Scenario 2: Guardian Recovery

**Situation**: Owner is unavailable, guardians need to recover
**Process**: Guardian-initiated recovery
**Timeline**: 24-48 hours

```typescript
// Guardian initiates recovery
const recovery = await protocol.initiateRecovery({
  walletId: 'wallet-id',
  reason: 'guardian_initiated',
  guardianId: 'guardian-1',
  justification: 'Owner incapacitated'
});

// Wait for consensus
const consensus = await protocol.waitForConsensus({
  recoveryId: recovery.id,
  timeout: 48 * 60 * 60 * 1000 // 48 hours
});
```

### Scenario 3: Proof of Life Timeout

**Situation**: Owner hasn't checked in for extended period
**Process**: Automatic recovery trigger
**Timeline**: 30+ days

```typescript
// Check Proof of Life status
const polStatus = await polManager.getStatus();

// Automatic recovery trigger
if (polStatus.escalationLevel >= 3) {
  const recovery = await protocol.initiateRecovery({
    walletId: 'wallet-id',
    reason: 'pol_timeout',
    triggerData: polStatus
  });
}
```

### Scenario 4: Emergency Recovery

**Situation**: Critical emergency requiring immediate access
**Process**: Emergency recovery with expedited procedures
**Timeline**: 2-4 hours

```typescript
// Emergency recovery
const recovery = await protocol.initiateRecovery({
  walletId: 'wallet-id',
  reason: 'emergency',
  emergencyCode: 'emergency-code',
  justification: 'Medical emergency'
});

// Expedited recovery
const masterSeed = await protocol.completeEmergencyRecovery({
  recoveryId: recovery.id,
  emergencyVerification: emergencyAuth
});
```

## Security Considerations

### Guardian Security

**Verification**: All guardians must verify their identity
**Authentication**: Multi-factor authentication required
**Signatures**: All actions cryptographically signed
**Audit**: Complete audit trail maintained

### Recovery Security

**Threshold**: Minimum number of guardians required
**Consensus**: All approvals must be valid
**Verification**: All signatures verified
**Transparency**: Public audit trail

### Smart Contract Security

**Verification**: All contract interactions verified
**Consensus**: On-chain consensus required
**Audit**: Contract code audited
**Testing**: Comprehensive test coverage

## Best Practices

### For Users

1. **Test Recovery**: Regularly test recovery process
2. **Guardian Training**: Ensure guardians understand their role
3. **Contact Information**: Keep guardian contact info updated
4. **Emergency Procedures**: Document emergency procedures
5. **Backup Strategy**: Multiple backup locations

### For Guardians

1. **Verification**: Always verify recovery requests
2. **Communication**: Coordinate with other guardians
3. **Security**: Keep private keys secure
4. **Training**: Understand recovery process
5. **Backup**: Keep backup copies of shares

### For Developers

1. **Testing**: Comprehensive recovery testing
2. **Security**: Regular security audits
3. **Documentation**: Keep recovery docs updated
4. **Monitoring**: Monitor recovery processes
5. **Support**: Provide guardian support

## Troubleshooting

### Common Issues

**Guardian Unavailable**
- Contact alternative guardians
- Use emergency procedures
- Check guardian contact information

**Verification Failed**
- Check verification codes
- Verify guardian identity
- Try alternative verification methods

**Consensus Not Reached**
- Ensure enough guardians available
- Check guardian approval status
- Verify guardian signatures

**Recovery Timeout**
- Check network connectivity
- Verify guardian availability
- Use emergency procedures

### Support Resources

- **Documentation**: [Complete Technical Documentation](TECHNICAL_DOCUMENTATION.md)
- **API Reference**: [API Documentation](API_REFERENCE.md)
- **Security Guide**: [Security Best Practices](SECURITY_GUIDE.md)
- **Community Forum**: [Join the Discussion](https://forum.seedguardian.safe)
- **GitHub Issues**: [Report Problems](https://github.com/MWANGAZA-LAB/seed-guardian-safe/issues)

---

**Recovery is a critical security feature.** This guide provides comprehensive information about the recovery process, including the newly implemented Proof of Life timeout recovery and smart contract integration. For additional information, see the [Technical Documentation](TECHNICAL_DOCUMENTATION.md) and [Security Guide](SECURITY_GUIDE.md).
