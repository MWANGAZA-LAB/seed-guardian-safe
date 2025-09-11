# Troubleshooting Guide - Seed Guardian Safe

## Common Issues and Solutions

This guide covers common issues users may encounter with the Seed Guardian Safe protocol and provides step-by-step solutions.

## Connection Problems

### Issue: Cannot Connect to Server

**Symptoms**:
- "Connection failed" error messages
- Timeout errors when loading the application
- Network request failures

**Solutions**:

1. **Check Internet Connection**
   ```bash
   # Test basic connectivity
   ping google.com
   
   # Test DNS resolution
   nslookup api.seedguardian.safe
   ```

2. **Check Server Status**
   ```bash
   # Check server health
   curl -I https://api.seedguardian.safe/health
   
   # Check GitHub Pages status
   curl -I https://mwangaza-lab.github.io/seed-guardian-safe/
   ```

3. **Clear Browser Cache**
   - Clear browser cache and cookies
   - Try incognito/private browsing mode
   - Disable browser extensions temporarily

4. **Check Firewall/Proxy Settings**
   - Ensure firewall allows HTTPS traffic
   - Check proxy settings if using corporate network
   - Try different network connection

### Issue: SSL Certificate Errors

**Symptoms**:
- "Certificate not trusted" warnings
- SSL/TLS connection errors
- Security warnings in browser

**Solutions**:

1. **Update Browser**
   - Ensure browser is up to date
   - Check for security updates

2. **Check System Date/Time**
   ```bash
   # Check system time
   date
   
   # Sync system time if needed
   sudo ntpdate -s time.nist.gov
   ```

3. **Clear SSL Cache**
   - Clear browser SSL cache
   - Restart browser
   - Try different browser

## Authentication Failures

### Issue: WebAuthn Not Working

**Symptoms**:
- "WebAuthn not supported" errors
- Biometric authentication fails
- "No authenticator found" messages

**Solutions**:

1. **Check Browser Support**
   ```javascript
   // Check WebAuthn support
   if (window.PublicKeyCredential) {
     console.log('WebAuthn supported');
   } else {
     console.log('WebAuthn not supported');
   }
   ```

2. **Enable WebAuthn**
   - Ensure browser has WebAuthn enabled
   - Check browser security settings
   - Enable biometric authentication in browser

3. **Alternative Authentication**
   ```typescript
   // Use enhanced verification instead
   await polManager.enroll('user-name', 'User Display Name', false);
   ```

### Issue: Guardian Authentication Failed

**Symptoms**:
- "Invalid guardian credentials" errors
- Guardian verification fails
- "Guardian not found" messages

**Solutions**:

1. **Check Guardian ID**
   ```bash
   # Verify guardian ID
   ./pol-cli status --guardian-id "guardian-id"
   ```

2. **Verify Guardian Registration**
   ```typescript
   // Check guardian status
   const guardian = await guardianAPI.getGuardian(guardianId);
   console.log('Guardian status:', guardian.status);
   ```

3. **Reset Guardian Credentials**
   ```bash
   # Re-initialize guardian
   ./pol-cli init --guardian-id "guardian-id" --force
   ```

## Proof of Life Issues

### Issue: Proof of Life Check-in Failed

**Symptoms**:
- "Check-in failed" error messages
- Proof of Life status shows "Failed"
- Guardian notifications not received

**Solutions**:

1. **Check Proof of Life Status**
   ```typescript
   // Get current status
   const status = await polManager.getStatus();
   console.log('PoL Status:', status);
   ```

2. **Manual Check-in**
   ```typescript
   // Perform manual check-in
   const proof = await polManager.performCheckIn('manual');
   console.log('Manual check-in result:', proof);
   ```

3. **Restart Monitoring**
   ```typescript
   // Restart automatic monitoring
   await polManager.stopMonitoring();
   await polManager.startMonitoring();
   ```

### Issue: Guardian Notifications Not Received

**Symptoms**:
- Guardians not receiving Proof of Life alerts
- Email notifications not delivered
- SMS notifications failed

**Solutions**:

1. **Check Notification Settings**
   ```typescript
   // Check notification preferences
   const settings = await notificationAPI.getSettings();
   console.log('Notification settings:', settings);
   ```

2. **Verify Guardian Contact Information**
   ```typescript
   // Check guardian contact info
   const guardian = await guardianAPI.getGuardian(guardianId);
   console.log('Guardian contact:', guardian.contact);
   ```

3. **Test Notifications**
   ```bash
   # Test notification delivery
   ./pol-cli test-notification --guardian-id "guardian-id"
   ```

## Guardian Verification Problems

### Issue: Guardian Cannot Verify Recovery

**Symptoms**:
- "Guardian verification failed" errors
- Recovery process stuck at verification step
- "Insufficient guardian approvals" messages

**Solutions**:

1. **Check Guardian Availability**
   ```bash
   # Check guardian status
   ./pol-cli status --guardian-id "guardian-id"
   ```

2. **Verify Guardian Credentials**
   ```bash
   # Verify guardian identity
   ./pol-cli verify --guardian-id "guardian-id" --code "verification-code"
   ```

3. **Check Recovery Threshold**
   ```typescript
   // Check recovery consensus
   const consensus = await protocol.checkRecoveryConsensus({
     recoveryId: recoveryId,
     requiredThreshold: 2
   });
   console.log('Consensus status:', consensus);
   ```

### Issue: Guardian Share Decryption Failed

**Symptoms**:
- "Share decryption failed" errors
- "Invalid guardian private key" messages
- Recovery process fails at share collection

**Solutions**:

1. **Verify Guardian Private Key**
   ```bash
   # Check guardian key status
   ./pol-cli key-status --guardian-id "guardian-id"
   ```

2. **Regenerate Guardian Keys**
   ```bash
   # Generate new guardian keys
   ./pol-cli generate-keys --guardian-id "guardian-id" --force
   ```

3. **Check Share Integrity**
   ```typescript
   // Verify share integrity
   const share = await guardianAPI.getShare(guardianId, walletId);
   const isValid = await verifyShareIntegrity(share);
   console.log('Share valid:', isValid);
   ```

## Recovery Process Errors

### Issue: Recovery Process Stuck

**Symptoms**:
- Recovery process doesn't progress
- "Waiting for guardian approval" indefinitely
- Recovery timeout errors

**Solutions**:

1. **Check Recovery Status**
   ```typescript
   // Get recovery status
   const recovery = await protocol.getRecovery(recoveryId);
   console.log('Recovery status:', recovery.status);
   ```

2. **Check Guardian Approvals**
   ```typescript
   // Check approval status
   const approvals = await protocol.getRecoveryApprovals(recoveryId);
   console.log('Approvals:', approvals);
   ```

3. **Force Recovery Timeout**
   ```typescript
   // Force recovery timeout if needed
   await protocol.forceRecoveryTimeout(recoveryId);
   ```

### Issue: Seed Reconstruction Failed

**Symptoms**:
- "Seed reconstruction failed" errors
- "Insufficient shares" messages
- "Invalid share data" errors

**Solutions**:

1. **Check Share Count**
   ```typescript
   // Verify share count
   const shares = await protocol.getRecoveryShares(recoveryId);
   console.log('Share count:', shares.length);
   ```

2. **Verify Share Validity**
   ```typescript
   // Check each share
   for (const share of shares) {
     const isValid = await verifyShare(share);
     console.log('Share valid:', isValid);
   }
   ```

3. **Regenerate Shares**
   ```typescript
   // Regenerate shares if needed
   await protocol.regenerateShares(walletId);
   ```

## CLI Tool Issues

### Issue: Guardian CLI Not Working

**Symptoms**:
- "Command not found" errors
- CLI tool crashes
- "Permission denied" errors

**Solutions**:

1. **Check CLI Installation**
   ```bash
   # Verify CLI installation
   ./pol-cli --version
   
   # Check file permissions
   ls -la pol-cli
   ```

2. **Fix Permissions**
   ```bash
   # Make CLI executable
   chmod +x pol-cli
   
   # Check ownership
   ls -la pol-cli
   ```

3. **Reinstall CLI**
   ```bash
   # Download latest version
   wget https://github.com/MWANGAZA-LAB/seed-guardian-safe/releases/latest/download/pol-cli-linux
   chmod +x pol-cli-linux
   ```

### Issue: CLI Configuration Errors

**Symptoms**:
- "Configuration not found" errors
- "Invalid configuration" messages
- CLI cannot connect to server

**Solutions**:

1. **Check Configuration File**
   ```bash
   # Check config file
   cat ~/.pol-cli/config.json
   ```

2. **Reinitialize Configuration**
   ```bash
   # Reinitialize CLI
   ./pol-cli init --guardian-id "guardian-id" --force
   ```

3. **Check Environment Variables**
   ```bash
   # Check environment variables
   echo $POL_CLI_CONFIG
   echo $POL_CLI_SERVER
   ```

## Smart Contract Issues

### Issue: Smart Contract Connection Failed

**Symptoms**:
- "Contract not found" errors
- "Network connection failed" messages
- "Invalid contract address" errors

**Solutions**:

1. **Check Network Connection**
   ```bash
   # Test Bitcoin network
   curl -X POST -H "Content-Type: application/json" \
     --data '{"jsonrpc":"2.0","method":"getblockcount","params":[],"id":1}' \
     https://api.blockcypher.com/v1/btc/main
   ```

2. **Verify Script Address**
   ```typescript
   // Check script address
   const scriptAddress = 'bc1p...';
   const isValid = await validateBitcoinAddress(scriptAddress);
   console.log('Script address valid:', isValid);
   ```

3. **Check Script Hash**
   ```typescript
   // Verify script hash
   const scriptHash = await calculateScriptHash(recoveryScript);
   console.log('Script hash:', scriptHash);
   ```

### Issue: Guardian Registration Failed

**Symptoms**:
- "Guardian registration failed" errors
- "Script creation failed" messages
- "Insufficient funds" errors

**Solutions**:

1. **Check Script Creation**
   ```typescript
   // Create recovery script
   const script = await bitcoinRecoveryManager.createRecoveryScript(
     walletId, 2, 144
   );
   console.log('Script created:', script.toString('hex'));
   ```

2. **Verify Guardian Keys**
   ```typescript
   // Check guardian public keys
   const guardianKeys = await getGuardianPublicKeys();
   console.log('Guardian keys:', guardianKeys.length);
   ```

3. **Check Bitcoin Balance**
   ```typescript
   // Check Bitcoin balance
   const balance = await getBitcoinBalance(address);
   console.log('Bitcoin balance:', balance);
   ```

## Performance Issues

### Issue: Slow Application Performance

**Symptoms**:
- Application loads slowly
- UI freezes during operations
- High memory usage

**Solutions**:

1. **Check System Resources**
   ```bash
   # Check memory usage
   free -h
   
   # Check CPU usage
   top
   ```

2. **Clear Browser Cache**
   - Clear browser cache and cookies
   - Disable unnecessary browser extensions
   - Close other browser tabs

3. **Check Network Latency**
   ```bash
   # Test network latency
   ping api.seedguardian.safe
   ```

### Issue: High Memory Usage

**Symptoms**:
- Browser becomes unresponsive
- High memory consumption
- Application crashes

**Solutions**:

1. **Check Memory Usage**
   ```javascript
   // Check memory usage
   console.log('Memory usage:', performance.memory);
   ```

2. **Optimize Data Loading**
   ```typescript
   // Use pagination for large datasets
   const data = await api.getData({
     page: 1,
     limit: 100
   });
   ```

3. **Clear Unused Data**
   ```typescript
   // Clear unused data
   await storage.clearUnusedData();
   ```

## Getting Help

### Support Resources

1. **Documentation**
   - [Technical Documentation](TECHNICAL_DOCUMENTATION.md)
   - [API Reference](API_REFERENCE.md)
   - [Security Guide](SECURITY_GUIDE.md)

2. **Community Support**
   - [GitHub Issues](https://github.com/MWANGAZA-LAB/seed-guardian-safe/issues)
   - [Discord Community](https://discord.gg/seedguardian)
   - [Community Forum](https://forum.seedguardian.safe)

3. **Direct Support**
   - Email: support@seedguardian.safe
   - Security: security@seedguardian.safe
   - Emergency: emergency@seedguardian.safe

### Reporting Issues

When reporting issues, please include:

1. **System Information**
   - Operating system and version
   - Browser and version
   - Node.js version (if applicable)

2. **Error Details**
   - Complete error messages
   - Steps to reproduce
   - Expected vs actual behavior

3. **Logs**
   - Browser console logs
   - Network request logs
   - CLI tool logs

4. **Configuration**
   - Relevant configuration files
   - Environment variables
   - Network settings

### Emergency Procedures

For critical security issues:

1. **Immediate Actions**
   - Disconnect from network
   - Change all passwords
   - Contact security team

2. **Contact Information**
   - Emergency: emergency@seedguardian.safe
   - Security: security@seedguardian.safe
   - Phone: +1-XXX-XXX-XXXX

3. **Documentation**
   - Document all actions taken
   - Preserve evidence
   - Follow incident response procedures

---

**Need more help?** This troubleshooting guide covers the most common issues. For additional support, see the [Support Resources](#getting-help) section or contact our support team directly.
