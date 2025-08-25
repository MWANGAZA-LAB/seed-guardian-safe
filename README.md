# 🌟 Seed Guardian Safe

**Secure Bitcoin Inheritance & Social Recovery Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)

## 🎯 Overview

Seed Guardian Safe is a revolutionary Bitcoin inheritance and social recovery platform that combines advanced cryptography with social consensus to ensure your Bitcoin wealth is never lost. Using Shamir's Secret Sharing and multi-guardian verification, we provide a secure, decentralized solution for Bitcoin inheritance planning.

### 🔐 Key Features

- **🔑 Shamir's Secret Sharing**: Your master seed is cryptographically split into shares
- **👥 Multi-Guardian System**: Appoint trusted guardians for recovery consensus
- **⚡ Social Recovery**: Recover access through guardian verification
- **🔒 Zero-Knowledge Architecture**: Guardians never see your actual seed
- **📱 Modern Web Interface**: Beautiful, responsive React application
- **🔐 Row-Level Security**: Database-level access control
- **📧 Automated Notifications**: Email and SMS alerts for critical events
- **💰 Bitcoin Integration**: Direct wallet management and transactions

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript for type safety
- **Vite** for fast development and building
- **Tailwind CSS** with custom Bitcoin-themed design system
- **shadcn/ui** components for consistent UI
- **React Router DOM** for navigation
- **Tanstack Query** for data fetching and caching

### Backend
- **Supabase** (PostgreSQL) for database and authentication
- **Edge Functions** (Deno) for serverless API endpoints
- **Row-Level Security (RLS)** for data protection
- **Cryptographic utilities** for secure key management
- **Bitcoin RPC integration** for blockchain operations

### Security
- **Shamir's Secret Sharing** with finite field arithmetic
- **RSA-OAEP** (2048-bit) for share encryption
- **AES-GCM** (256-bit) with PBKDF2 key derivation
- **Multi-factor guardian verification**
- **Audit logging** for all operations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Bitcoin Core node (for production)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MWANGAZA-LAB/seed-guardian-safe.git
   cd seed-guardian-safe
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   Edit `.env.local` with your configuration (see [Environment Setup](#environment-setup))

4. **Set up Supabase**
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Link to your Supabase project
   supabase link --project-ref YOUR_PROJECT_REF
   
   # Run database migrations
   supabase db push
   
   # Deploy Edge Functions
   supabase functions deploy
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:5173` to see the application.

## 🔧 Environment Setup

Create a `.env.local` file with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Bitcoin RPC Configuration
BITCOIN_RPC_URL=http://localhost:8332
BITCOIN_RPC_USERNAME=your_rpc_username
BITCOIN_RPC_PASSWORD=your_rpc_password

# Email Service (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# SMS Service (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Application Configuration
FRONTEND_URL=http://localhost:5173
ENCRYPTION_KEY=your_32_byte_encryption_key
```

## 📖 Usage Guide

### 1. Creating a Wallet
1. Navigate to the wallet creation page
2. Enter your master password (used to encrypt your seed)
3. Set the number of guardians and threshold requirement
4. Add guardian email addresses
5. Complete the setup process

### 2. Guardian Onboarding
1. Guardians receive invitation emails
2. They verify their email and set up accounts
3. Guardians download their encrypted share
4. System confirms guardian verification

### 3. Social Recovery Process
1. Guardian initiates recovery (if needed)
2. All guardians are notified via email/SMS
3. Guardians sign the recovery request
4. Once threshold is met, recovery is completed
5. New wallet access is provided to the user

## 🗄️ Database Schema

The application uses the following core tables:

- **`profiles`**: User profile information
- **`wallets`**: Wallet configurations and encrypted seeds
- **`guardians`**: Guardian information and verification status
- **`recovery_attempts`**: Recovery process tracking
- **`recovery_signatures`**: Guardian signatures for recovery
- **`proof_of_life`**: Guardian activity verification
- **`wallet_addresses`**: Generated Bitcoin addresses
- **`transactions`**: Transaction history
- **`audit_logs`**: Security audit trail

## 🔌 API Endpoints

### Edge Functions
- `POST /functions/v1/create-wallet` - Create new wallet
- `POST /functions/v1/verify-guardian` - Guardian verification
- `POST /functions/v1/initiate-recovery` - Start recovery process
- `POST /functions/v1/sign-recovery` - Guardian recovery signature
- `POST /functions/v1/bitcoin-service` - Bitcoin operations

## 🧪 Testing

```bash
# Run frontend tests
npm run test

# Run backend tests (Edge Functions)
supabase functions test
```

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy the dist/ folder to your hosting provider
```

### Backend (Supabase)
```bash
# Deploy database changes
supabase db push

# Deploy Edge Functions
supabase functions deploy
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔒 Security

- **Vulnerability Reports**: Please email security@yourdomain.com
- **Security Audit**: This project has not been audited. Use at your own risk.
- **Cryptographic Review**: The cryptographic implementation should be reviewed by experts before production use.

## 📞 Support

- **Documentation**: [Backend Implementation Guide](BACKEND_README.md)
- **Issues**: [GitHub Issues](https://github.com/MWANGAZA-LAB/seed-guardian-safe/issues)
- **Discussions**: [GitHub Discussions](https://github.com/MWANGAZA-LAB/seed-guardian-safe/discussions)

## 🙏 Acknowledgments

- **Bitcoin Core** for the Bitcoin protocol
- **Supabase** for the backend infrastructure
- **Shamir's Secret Sharing** for the cryptographic foundation
- **React & Vite** for the frontend framework
- **Tailwind CSS** for the styling system

---

**⚠️ Disclaimer**: This software is experimental and should not be used to secure significant amounts of Bitcoin without thorough testing and security review. Always test with small amounts first.

**Made with ❤️ for the Bitcoin community**
