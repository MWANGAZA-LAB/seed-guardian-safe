# 🚀 Deployment Guide

This guide explains how to set up automated deployment for the Seed Guardian Safe project using GitHub Actions.

## 📋 Prerequisites

Before setting up deployment, ensure you have:

- [GitHub repository](https://github.com/MWANGAZA-LAB/seed-guardian-safe) with the project code
- [Supabase account](https://supabase.com/) with projects for staging and production
- [Railway account](https://railway.app/) for frontend hosting
- [SendGrid account](https://sendgrid.com/) for email services
- [Twilio account](https://twilio.com/) for SMS services (optional)

## 🔧 GitHub Secrets Setup

Navigate to your GitHub repository → Settings → Secrets and variables → Actions, then add the following secrets:

### Supabase Configuration
```
SUPABASE_ACCESS_TOKEN=your_supabase_access_token
SUPABASE_PROJECT_REF_STAGING=your_staging_project_ref
SUPABASE_PROJECT_REF_PROD=your_production_project_ref
```

### Frontend Configuration
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Railway Configuration
```
RAILWAY_TOKEN=your_railway_token
RAILWAY_PROJECT_ID=your_railway_project_id
RAILWAY_SERVICE_ID=your_railway_service_id
```

### Email & SMS Services
```
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

### Bitcoin RPC Configuration
```
BITCOIN_RPC_URL=http://localhost:8332
BITCOIN_RPC_USERNAME=your_rpc_username
BITCOIN_RPC_PASSWORD=your_rpc_password
```

### Application Configuration
```
FRONTEND_URL=https://your-domain.com
ENCRYPTION_KEY=your_32_byte_encryption_key
```

## 🏗️ Workflow Overview

The project includes three main GitHub Actions workflows:

### 1. Frontend CI/CD (`frontend-deploy.yml`)
- **Triggers**: Changes to frontend files, pull requests
- **Actions**: Testing, building, deployment to Railway
- **Environments**: Preview (PR), Production (main branch)

### 2. Backend CI/CD (`backend-deploy.yml`)
- **Triggers**: Changes to Supabase files
- **Actions**: Database migrations, Edge Function deployment
- **Environments**: Staging (develop), Production (main)

### 3. Full Stack Deployment (`full-deploy.yml`)
- **Triggers**: Changes to both frontend and backend, manual dispatch
- **Actions**: Orchestrated deployment of entire stack
- **Environments**: Staging and Production

### 4. Security Scanning (`security-scan.yml`)
- **Triggers**: All pushes, pull requests, weekly schedule
- **Actions**: Dependency checks, code scanning, secrets detection
- **Output**: Security reports and vulnerability alerts

## 🚀 Deployment Process

### Automatic Deployment

1. **Push to `main` branch**: Triggers full production deployment
2. **Push to `develop` branch**: Triggers staging deployment
3. **Pull Request**: Creates preview deployment

### Manual Deployment

1. Go to Actions tab in GitHub
2. Select "Full Stack Deployment" workflow
3. Click "Run workflow"
4. Choose environment (staging/production)
5. Click "Run workflow"

## 📊 Deployment Stages

### 1. Validation
- Code linting and type checking
- Supabase configuration validation
- Security checks

### 2. Backend Deployment
- Database migrations
- Edge Function deployment
- Environment configuration

### 3. Frontend Build
- Dependency installation
- Application building
- Environment variable injection

### 4. Frontend Deployment
- Railway deployment
- URL generation
- Status reporting

### 5. Notification
- Deployment summary
- Success/failure notifications
- URL sharing

## 🔍 Monitoring & Troubleshooting

### Deployment Status
- Check GitHub Actions tab for workflow status
- Review deployment logs for errors
- Monitor deployment notifications

### Common Issues

#### Frontend Build Failures
```bash
# Check for missing environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Verify build locally
npm run build
```

#### Backend Deployment Failures
```bash
# Check Supabase CLI installation
supabase --version

# Verify project linking
supabase projects list

# Test migrations locally
supabase db reset
```

#### Environment Variable Issues
- Ensure all required secrets are set in GitHub
- Verify environment variable names match workflow files
- Check for typos in secret values

## 🔒 Security Considerations

### Secrets Management
- Never commit secrets to the repository
- Use GitHub Secrets for all sensitive data
- Rotate secrets regularly
- Use different secrets for staging and production

### Access Control
- Limit repository access to authorized users
- Use branch protection rules
- Require pull request reviews
- Enable security scanning

### Monitoring
- Monitor deployment logs for suspicious activity
- Review security scan results
- Check for exposed secrets
- Audit access permissions regularly

## 📈 Performance Optimization

### Build Optimization
- Use dependency caching in workflows
- Optimize build artifacts
- Minimize bundle size
- Use production builds only

### Deployment Optimization
- Parallel job execution where possible
- Conditional job execution
- Efficient artifact handling
- Quick rollback procedures

## 🔄 Rollback Procedures

### Frontend Rollback
1. Navigate to Railway dashboard
2. Select project
3. Go to Deployments tab
4. Find previous deployment
5. Click "Promote to Production"

### Backend Rollback
1. Navigate to Supabase dashboard
2. Go to Database → Migrations
3. Revert to previous migration
4. Redeploy Edge Functions if needed

### Emergency Rollback
1. Create hotfix branch
2. Revert problematic changes
3. Deploy immediately
4. Investigate root cause

## 📞 Support

### Getting Help
- Check GitHub Actions logs for detailed error messages
- Review deployment documentation
- Contact team members for assistance
- Create GitHub issues for persistent problems

### Useful Commands
```bash
# Check workflow status
gh run list

# View workflow logs
gh run view <run-id>

# Rerun failed workflow
gh run rerun <run-id>

# Download workflow artifacts
gh run download <run-id>
```

---

**⚠️ Important**: Always test deployments in staging before production. Monitor deployments closely and have rollback procedures ready.
