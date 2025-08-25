# Bitcoin Social Recovery Inheritance Wallet - Backend Implementation

## 🏗️ Overview

This is the complete backend implementation for the Bitcoin Social Recovery Inheritance Wallet (BSRI), providing secure, scalable infrastructure for Bitcoin inheritance through cryptographic social recovery.

## 🚀 Features

- **Shamir's Secret Sharing**: Cryptographic key splitting among guardians
- **Social Recovery**: Multi-guardian consensus for wallet recovery
- **Bitcoin Integration**: Full RPC client for blockchain operations
- **Zero-Knowledge Architecture**: No custodial access to private keys
- **Audit Trail**: Comprehensive logging of all operations
- **Email Notifications**: Automated guardian communications
- **Row-Level Security**: Database-level access control

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Bitcoin Core node (for mainnet) or Bitcoin testnet node
- SendGrid account (for email notifications)
- Domain with SSL certificate

## 🛠️ Installation & Setup

### 1. Database Setup

Run the migrations in order:

```bash
# Apply database schema
supabase db push

# Or manually run migrations:
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/001_initial_schema.sql
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/002_rls_policies.sql
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/003_database_functions.sql
```

### 2. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp env.example .env
```

Update the `.env` file with your actual values:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Bitcoin Node Configuration
BITCOIN_RPC_HOST=your.bitcoin.node.host
BITCOIN_RPC_PORT=8332
BITCOIN_RPC_USER=bitcoinrpc
BITCOIN_RPC_PASSWORD=your_secure_password

# Email Service
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@yourdomain.com

# Frontend URL
FRONTEND_URL=https://your-app-domain.com
```

### 3. Deploy Edge Functions

Deploy all Edge Functions to Supabase:

```bash
supabase functions deploy create-wallet
supabase functions deploy verify-guardian
supabase functions deploy initiate-recovery
supabase functions deploy sign-recovery
supabase functions deploy bitcoin-service
```

### 4. Configure Environment Variables

Set environment variables for each Edge Function:

```bash
supabase secrets set SENDGRID_API_KEY=your_sendgrid_api_key
supabase secrets set BITCOIN_RPC_HOST=your.bitcoin.node.host
supabase secrets set BITCOIN_RPC_USER=bitcoinrpc
supabase secrets set BITCOIN_RPC_PASSWORD=your_secure_password
supabase secrets set FRONTEND_URL=https://your-app-domain.com
```

## 🔐 Security Features

### Cryptographic Implementation

- **Shamir's Secret Sharing**: Uses finite field arithmetic with large prime numbers
- **RSA Encryption**: 2048-bit keys for guardian share encryption
- **AES-GCM**: For additional data encryption with user passwords
- **PBKDF2**: Key derivation with 100,000 iterations

### Access Control

- **Row-Level Security (RLS)**: Database-level access control
- **JWT Authentication**: Secure token-based authentication
- **Guardian Verification**: Multi-factor verification for guardians
- **Audit Logging**: Complete trail of all operations

### Bitcoin Security

- **Zero-Knowledge**: No server access to private keys
- **HD Wallet Support**: BIP44 hierarchical deterministic wallets
- **UTXO Management**: Secure coin selection algorithms
- **Transaction Signing**: Client-side signing only

## 📡 API Endpoints

### Wallet Management

#### Create Wallet
```http
POST /functions/v1/create-wallet
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "My Inheritance Wallet",
  "masterSeed": "encrypted_master_seed",
  "guardians": [
    {
      "email": "guardian1@example.com",
      "fullName": "John Doe",
      "phoneNumber": "+1234567890"
    }
  ],
  "thresholdRequirement": 3,
  "userPassword": "user_password"
}
```

#### Get Wallet Balance
```http
POST /functions/v1/bitcoin-service/get-balance
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "walletId": "wallet_uuid",
  "userPassword": "user_password"
}
```

### Guardian Management

#### Verify Guardian
```http
POST /functions/v1/verify-guardian
Content-Type: application/json

{
  "invitationToken": "invitation_token",
  "verificationCode": "verification_code",
  "guardianInfo": {
    "fullName": "John Doe",
    "phoneNumber": "+1234567890"
  }
}
```

### Recovery Management

#### Initiate Recovery
```http
POST /functions/v1/initiate-recovery
Content-Type: application/json

{
  "walletId": "wallet_uuid",
  "recoveryReason": "Owner is unavailable",
  "newOwnerEmail": "newowner@example.com",
  "guardianEmail": "guardian@example.com"
}
```

#### Sign Recovery
```http
POST /functions/v1/sign-recovery
Content-Type: application/json

{
  "recoveryAttemptId": "recovery_uuid",
  "guardianEmail": "guardian@example.com",
  "signatureData": "cryptographic_signature",
  "signedMessageHash": "message_hash"
}
```

### Bitcoin Operations

#### Create Transaction
```http
POST /functions/v1/bitcoin-service/create-transaction
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "walletId": "wallet_uuid",
  "toAddress": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  "amountSatoshis": 1000000,
  "feeRate": 10,
  "userPassword": "user_password"
}
```

#### Send Transaction
```http
POST /functions/v1/bitcoin-service/send-transaction
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "transactionId": "transaction_uuid",
  "signedTransaction": "signed_transaction_hex"
}
```

## 🗄️ Database Schema

### Core Tables

- **wallets**: Wallet information and configuration
- **guardians**: Guardian assignments and encrypted shares
- **recovery_attempts**: Recovery process tracking
- **recovery_signatures**: Guardian signatures for recovery
- **proof_of_life**: Activity monitoring
- **wallet_addresses**: Bitcoin addresses for wallets
- **transactions**: Bitcoin transaction history
- **audit_logs**: Complete audit trail

### Key Relationships

- Each wallet has multiple guardians (1:N)
- Each recovery attempt has multiple signatures (1:N)
- Each wallet has multiple addresses (1:N)
- Each wallet has multiple transactions (1:N)

## 🔄 Recovery Process

### 1. Recovery Initiation
- Guardian detects owner is unavailable
- Initiates recovery with reason and new owner email
- System validates guardian permissions
- All guardians receive notification

### 2. Guardian Consensus
- Guardians review recovery request
- Each guardian provides cryptographic signature
- System tracks signature count
- Threshold must be met for completion

### 3. Recovery Execution
- Shamir's Secret Sharing reconstructs master key
- New wallet instance created for new owner
- Original wallet marked as recovered
- New owner receives access credentials

## 📧 Email Notifications

### Guardian Invitation
- Sent when wallet is created
- Contains invitation link and expiration
- Explains guardian responsibilities

### Recovery Notifications
- Sent to all guardians when recovery initiated
- Contains recovery details and action required
- Time-sensitive (72-hour expiration)

### Recovery Completion
- Sent to new owner when recovery successful
- Contains wallet access instructions
- Security recommendations included

## 🧪 Testing

### Unit Tests
```bash
# Run cryptographic tests
npm test crypto

# Run database function tests
npm test database

# Run API endpoint tests
npm test api
```

### Integration Tests
```bash
# Test complete recovery flow
npm test recovery

# Test Bitcoin integration
npm test bitcoin

# Test email notifications
npm test email
```

### Security Tests
```bash
# Test RLS policies
npm test security

# Test cryptographic functions
npm test crypto-security

# Test audit logging
npm test audit
```

## 🚀 Deployment

### Production Checklist

- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Edge Functions deployed
- [ ] SSL certificates installed
- [ ] Bitcoin node configured
- [ ] Email service configured
- [ ] Security audit completed
- [ ] Load testing performed
- [ ] Monitoring configured
- [ ] Backup strategy implemented

### Monitoring

- **Database Performance**: Monitor query performance and connection pools
- **Edge Function Metrics**: Track execution times and error rates
- **Bitcoin Node Health**: Monitor RPC response times and sync status
- **Email Delivery**: Track email delivery rates and bounces
- **Security Events**: Monitor audit logs for suspicious activity

## 🔧 Troubleshooting

### Common Issues

1. **Guardian Invitation Failures**
   - Check email service configuration
   - Verify invitation token expiration
   - Review guardian email validation

2. **Recovery Process Issues**
   - Verify guardian threshold configuration
   - Check signature validation logic
   - Review recovery expiration times

3. **Bitcoin Integration Problems**
   - Verify Bitcoin node connectivity
   - Check RPC credentials
   - Review transaction fee calculations

4. **Database Connection Issues**
   - Check connection pool configuration
   - Verify RLS policy setup
   - Review database performance

### Debug Mode

Enable debug logging:

```bash
export LOG_LEVEL=debug
supabase functions serve --debug
```

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Bitcoin Core RPC API](https://developer.bitcoin.org/reference/rpc/)
- [Shamir's Secret Sharing](https://en.wikipedia.org/wiki/Shamir%27s_Secret_Sharing)
- [BIP39 Mnemonic Generation](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the troubleshooting section above

---

**⚠️ Security Notice**: This is a production-ready implementation. Ensure proper security audits and testing before deploying to production environments.
