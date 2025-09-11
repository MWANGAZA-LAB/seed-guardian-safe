# Seed Guardian Safe - Deployment & Operations Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Application Deployment](#application-deployment)
5. [Proof of Life System](#proof-of-life-system)
6. [Smart Contract Deployment](#smart-contract-deployment)
7. [Monitoring & Logging](#monitoring--logging)
8. [Security Configuration](#security-configuration)
9. [Backup & Recovery](#backup--recovery)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Node.js**: 18.x or higher
- **TypeScript**: 5.x or higher
- **Go**: 1.21 or higher (for CLI tools)
- **PostgreSQL**: 14.x or higher
- **Redis**: 6.x or higher (for caching)
- **Docker**: 20.x or higher (optional)

### Cloud Services

- **Supabase**: Database and authentication
- **Railway**: Application hosting
- **GitHub Pages**: Static site hosting
- **Bitcoin Network**: Bitcoin Script deployment

### Development Tools

- **Git**: Version control
- **npm/yarn**: Package management
- **Hardhat**: Smart contract development
- **Supabase CLI**: Database management

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/MWANGAZA-LAB/seed-guardian-safe.git
cd seed-guardian-safe
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Go dependencies (for CLI)
cd guardian-cli
go mod tidy
cd ..
```

### 3. Environment Configuration

```bash
# Copy environment template
cp env.example .env

# Edit environment variables
nano .env
```

**Environment Variables:**

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/seed_guardian_safe
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application Configuration
NODE_ENV=production
PORT=3000
API_BASE_URL=https://api.seedguardian.safe

# Proof of Life Configuration
POL_CHECK_INTERVAL=604800
POL_GRACE_PERIOD=86400
POL_ESCALATION_THRESHOLD=259200
POL_RECOVERY_THRESHOLD=2592000

# WebAuthn Configuration
WEBAUTHN_RP_ID=seedguardian.safe
WEBAUTHN_RP_NAME=Seed Guardian Safe
WEBAUTHN_TIMEOUT=60000

# Smart Contract Configuration
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/your-project-id
PRIVATE_KEY=your-deployment-private-key
CONTRACT_ADDRESS=0x...

# Security Configuration
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
```

## Database Configuration

### 1. Supabase Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link project
supabase link --project-ref your-project-ref

# Push database schema
supabase db push
```

### 2. Database Schema

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create tables
\i supabase/migrations/001_initial_schema.sql
\i supabase/migrations/002_guardian_system.sql
\i supabase/migrations/003_proof_of_life.sql
\i supabase/migrations/004_performance_indexes.sql

-- Enable Row Level Security
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE encrypted_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE proof_of_life ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
\i supabase/migrations/005_rls_policies.sql
```

### 3. Database Seeding

```bash
# Seed initial data
supabase db seed

# Or manually seed
psql $DATABASE_URL -f supabase/seed.sql
```

## Application Deployment

### 1. Build Application

```bash
# Build web application
npm run build

# Build CLI tools
cd guardian-cli
go build -o pol-cli main.go
cd ..

# Build smart contracts
npx hardhat compile
```

### 2. Railway Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy to Railway
railway up
```

**Railway Configuration (`railway.json`):**

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node server.js",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

### 3. GitHub Pages Deployment

```bash
# Build for GitHub Pages
npm run build:pages

# Deploy to GitHub Pages
npm run deploy:pages
```

**GitHub Actions Workflow (`.github/workflows/deploy-pages.yml`):**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v3
      - uses: actions/upload-pages-artifact@v2
        with:
          path: ./dist
      - uses: actions/deploy-pages@v2
```

### 4. Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "server.js"]
```

```bash
# Build Docker image
docker build -t seed-guardian-safe .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL=$DATABASE_URL \
  -e SUPABASE_URL=$SUPABASE_URL \
  seed-guardian-safe
```

## Proof of Life System

### 1. PoL Server Configuration

```typescript
// server/pol-server.ts
import express from 'express';
import { PoLServerAPI } from '@/protocol/pol';

const app = express();
const polServer = new PoLServerAPI({
  database: supabaseClient,
  redis: redisClient,
  config: {
    checkInInterval: process.env.POL_CHECK_INTERVAL,
    gracePeriod: process.env.POL_GRACE_PERIOD,
    escalationThreshold: process.env.POL_ESCALATION_THRESHOLD,
    recoveryThreshold: process.env.POL_RECOVERY_THRESHOLD
  }
});

// PoL API endpoints
app.post('/api/pol/submit-proof', polServer.submitProof);
app.get('/api/pol/status/:walletId', polServer.getStatus);
app.get('/api/pol/proofs/:walletId', polServer.getProofs);
app.post('/api/pol/enroll', polServer.enrollWallet);
app.post('/api/pol/trigger-recovery', polServer.triggerRecovery);
```

### 2. PoL Client Configuration

```typescript
// client/pol-client.ts
import { createPoLManager, DEFAULT_POL_CONFIG } from '@/protocol/pol';

const polManager = await createPoLManager({
  walletId: 'user-wallet-id',
  storage: createClientStorage({
    useIndexedDB: true,
    useLocalStorage: true
  }),
  serverAPI: {
    baseUrl: process.env.API_BASE_URL,
    apiKey: process.env.API_KEY
  },
  webAuthnConfig: {
    rpId: process.env.WEBAUTHN_RP_ID,
    rpName: process.env.WEBAUTHN_RP_NAME,
    timeout: parseInt(process.env.WEBAUTHN_TIMEOUT)
  },
  polConfig: DEFAULT_POL_CONFIG
});
```

### 3. Guardian CLI Deployment

```bash
# Build guardian CLI
cd guardian-cli
go build -o pol-cli main.go

# Create distribution packages
# Linux
GOOS=linux GOARCH=amd64 go build -o pol-cli-linux main.go

# Windows
GOOS=windows GOARCH=amd64 go build -o pol-cli.exe main.go

# macOS
GOOS=darwin GOARCH=amd64 go build -o pol-cli-macos main.go

# Create release packages
tar -czf pol-cli-linux.tar.gz pol-cli-linux
zip pol-cli-windows.zip pol-cli.exe
tar -czf pol-cli-macos.tar.gz pol-cli-macos
```

## Smart Contract Deployment

### 1. Hardhat Configuration

```javascript
// hardhat.config.js
require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-ethers');
require('dotenv').config();

module.exports = {
  solidity: {
    version: '0.8.19',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    mainnet: {
      url: process.env.ETHEREUM_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    },
    testnet: {
      url: process.env.TESTNET_RPC_URL,
      accounts: [process.env.TESTNET_PRIVATE_KEY]
    }
  }
};
```

### 2. Contract Deployment

```bash
# Deploy to testnet
npx hardhat run scripts/deploy.js --network testnet

# Deploy to mainnet
npx hardhat run scripts/deploy.js --network mainnet

# Verify contract
npx hardhat verify --network mainnet <CONTRACT_ADDRESS>
```

**Deployment Script (`scripts/deploy.js`):**

```javascript
async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log('Deploying contracts with account:', deployer.address);
  
  const ProofOfLifeRecovery = await ethers.getContractFactory('ProofOfLifeRecovery');
  const recovery = await ProofOfLifeRecovery.deploy();
  
  await recovery.deployed();
  
  console.log('ProofOfLifeRecovery deployed to:', recovery.address);
  
  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    contractAddress: recovery.address,
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync(
    `deployments/${network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

## Monitoring & Logging

### 1. Application Monitoring

```typescript
// monitoring/app-monitor.ts
import { Logger } from '@/lib/logger';
import { Metrics } from '@/lib/metrics';

class AppMonitor {
  private logger: Logger;
  private metrics: Metrics;
  
  constructor() {
    this.logger = new Logger({
      level: process.env.LOG_LEVEL,
      format: 'json'
    });
    
    this.metrics = new Metrics({
      endpoint: process.env.METRICS_ENDPOINT
    });
  }
  
  async startMonitoring() {
    // Health checks
    setInterval(async () => {
      const health = await this.checkHealth();
      this.metrics.recordHealthCheck(health);
    }, 30000);
    
    // Performance monitoring
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught exception', { error });
      this.metrics.recordError('uncaught_exception');
    });
    
    process.on('unhandledRejection', (reason) => {
      this.logger.error('Unhandled rejection', { reason });
      this.metrics.recordError('unhandled_rejection');
    });
  }
  
  private async checkHealth() {
    try {
      // Check database connection
      await this.checkDatabase();
      
      // Check Redis connection
      await this.checkRedis();
      
      // Check external services
      await this.checkExternalServices();
      
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
    }
  }
}
```

### 2. Logging Configuration

```typescript
// lib/logger.ts
import winston from 'winston';
import { Logtail } from '@logtail/node';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Add Logtail for cloud logging
if (process.env.LOGTAIL_TOKEN) {
  logger.add(new Logtail(process.env.LOGTAIL_TOKEN));
}

export { logger };
```

### 3. Metrics Collection

```typescript
// lib/metrics.ts
import { Counter, Histogram, Gauge, register } from 'prom-client';

class Metrics {
  private requestCounter: Counter;
  private requestDuration: Histogram;
  private activeConnections: Gauge;
  
  constructor() {
    this.requestCounter = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status']
    });
    
    this.requestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route']
    });
    
    this.activeConnections = new Gauge({
      name: 'active_connections',
      help: 'Number of active connections'
    });
  }
  
  recordRequest(method: string, route: string, status: number, duration: number) {
    this.requestCounter.inc({ method, route, status });
    this.requestDuration.observe({ method, route }, duration);
  }
  
  recordHealthCheck(health: any) {
    this.activeConnections.set(health.connections || 0);
  }
  
  async getMetrics() {
    return register.metrics();
  }
}
```

## Security Configuration

### 1. HTTPS Configuration

```typescript
// server/ssl-config.ts
import https from 'https';
import fs from 'fs';

const sslOptions = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH),
  ca: fs.readFileSync(process.env.SSL_CA_PATH)
};

const server = https.createServer(sslOptions, app);
```

### 2. Rate Limiting

```typescript
// middleware/rate-limit.ts
import rateLimit from 'express-rate-limit';

const createRateLimit = (windowMs: number, max: number) => {
  return rateLimit({
    windowMs,
    max,
    message: 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false
  });
};

// Apply rate limits
app.use('/api/pol/', createRateLimit(15 * 60 * 1000, 100)); // 100 requests per 15 minutes
app.use('/api/guardian/', createRateLimit(15 * 60 * 1000, 50)); // 50 requests per 15 minutes
app.use('/api/recovery/', createRateLimit(60 * 60 * 1000, 10)); // 10 requests per hour
```

### 3. CORS Configuration

```typescript
// middleware/cors.ts
import cors from 'cors';

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://seedguardian.safe'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
```

### 4. Input Validation

```typescript
// middleware/validation.ts
import { body, validationResult } from 'express-validator';

const validateProofSubmission = [
  body('walletId').isUUID(),
  body('timestamp').isNumeric(),
  body('challenge').isLength({ min: 64, max: 64 }),
  body('signature').isBase64(),
  body('publicKey').isBase64(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
```

## Backup & Recovery

### 1. Database Backup

```bash
#!/bin/bash
# scripts/backup-database.sh

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/seed_guardian_safe_$DATE.sql"

# Create backup
pg_dump $DATABASE_URL > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Upload to cloud storage
aws s3 cp "$BACKUP_FILE.gz" s3://seed-guardian-backups/database/

# Clean up old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Database backup completed: $BACKUP_FILE.gz"
```

### 2. Application Backup

```bash
#!/bin/bash
# scripts/backup-application.sh

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/application_$DATE.tar.gz"

# Create application backup
tar -czf $BACKUP_FILE \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=logs \
  /app

# Upload to cloud storage
aws s3 cp $BACKUP_FILE s3://seed-guardian-backups/application/

# Clean up old backups
find $BACKUP_DIR -name "application_*.tar.gz" -mtime +7 -delete

echo "Application backup completed: $BACKUP_FILE"
```

### 3. Disaster Recovery

```bash
#!/bin/bash
# scripts/disaster-recovery.sh

# Restore database
LATEST_BACKUP=$(aws s3 ls s3://seed-guardian-backups/database/ | sort | tail -n 1 | awk '{print $4}')
aws s3 cp "s3://seed-guardian-backups/database/$LATEST_BACKUP" /tmp/
gunzip /tmp/$LATEST_BACKUP
psql $DATABASE_URL < /tmp/${LATEST_BACKUP%.gz}

# Restore application
LATEST_APP_BACKUP=$(aws s3 ls s3://seed-guardian-backups/application/ | sort | tail -n 1 | awk '{print $4}')
aws s3 cp "s3://seed-guardian-backups/application/$LATEST_APP_BACKUP" /tmp/
tar -xzf /tmp/$LATEST_APP_BACKUP -C /

# Restart services
systemctl restart seed-guardian-safe
systemctl restart nginx

echo "Disaster recovery completed"
```

## Troubleshooting

### 1. Common Issues

#### Database Connection Issues

```bash
# Check database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check database status
supabase status

# Restart database
supabase stop
supabase start
```

#### Application Startup Issues

```bash
# Check application logs
tail -f logs/combined.log

# Check environment variables
env | grep -E "(DATABASE|SUPABASE|API)"

# Test application health
curl http://localhost:3000/health
```

#### Proof of Life Issues

```bash
# Check PoL service status
curl http://localhost:3000/api/pol/status/test-wallet-id

# Check WebAuthn support
curl http://localhost:3000/api/pol/webauthn/support

# Test proof submission
curl -X POST http://localhost:3000/api/pol/submit-proof \
  -H "Content-Type: application/json" \
  -d '{"walletId":"test","timestamp":1234567890,"challenge":"test","signature":"test","publicKey":"test"}'
```

### 2. Performance Issues

#### Database Performance

```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats 
WHERE tablename IN ('wallets', 'guardians', 'proof_of_life');

-- Analyze tables
ANALYZE wallets;
ANALYZE guardians;
ANALYZE proof_of_life;
```

#### Application Performance

```bash
# Check memory usage
ps aux | grep node

# Check CPU usage
top -p $(pgrep node)

# Check disk usage
df -h

# Check network connections
netstat -tulpn | grep :3000
```

### 3. Security Issues

#### SSL Certificate Issues

```bash
# Check SSL certificate
openssl s_client -connect seedguardian.safe:443 -servername seedguardian.safe

# Renew SSL certificate
certbot renew --nginx

# Check certificate expiration
openssl x509 -in /etc/ssl/certs/seedguardian.safe.crt -text -noout | grep "Not After"
```

#### Rate Limiting Issues

```bash
# Check rate limit logs
grep "rate limit" logs/combined.log

# Check Redis rate limit data
redis-cli keys "rate_limit:*"

# Clear rate limit data
redis-cli flushdb
```

This deployment and operations guide provides comprehensive instructions for deploying and maintaining the Seed Guardian Safe protocol in production environments, including the Proof of Life system.
