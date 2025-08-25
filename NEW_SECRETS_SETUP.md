# New GitHub Secrets Setup Guide

## 🎯 **Overview**

The workflow has been simplified to use direct connection strings instead of complex URL encoding. This approach is more reliable and easier to maintain.

## 🔧 **Required GitHub Secrets**

Navigate to: `https://github.com/MWANGAZA-LAB/seed-guardian-safe/settings/secrets/actions`

### **1. SUPABASE_ACCESS_TOKEN**
- **Purpose**: Access token for Supabase CLI authentication
- **Value**: `sbp_your_token_here` (from https://supabase.com/dashboard/account/tokens)
- **Used by**: Both staging and production deployments

### **2. SUPABASE_DB_URL_STAGING**
- **Purpose**: Direct database connection string for staging environment
- **Value**: `postgresql://postgres:Kryshevin%402025@aws-1-eu-north-1.supabase.com:5432/postgres`
- **Notes**: 
  - Use URL-encoded password (`@` becomes `%40`)
  - Use direct connection (port 5432, not pooler)
  - Replace with your actual staging project host

### **3. SUPABASE_DB_URL_PROD**
- **Purpose**: Direct database connection string for production environment
- **Value**: `postgresql://postgres:Kryshevin%402025@aws-1-eu-north-1.supabase.com:5432/postgres`
- **Notes**: 
  - Use URL-encoded password (`@` becomes `%40`)
  - Use direct connection (port 5432, not pooler)
  - Replace with your actual production project host

### **4. SUPABASE_PROJECT_REF_STAGING**
- **Purpose**: Project reference ID for staging environment
- **Value**: `your_staging_project_ref` (24 characters)
- **Notes**: Get from staging Supabase project dashboard

### **5. SUPABASE_PROJECT_REF_PROD**
- **Purpose**: Project reference ID for production environment
- **Value**: `gwizmwhxbvayhebbyvql` (your current project)
- **Notes**: Get from production Supabase project dashboard

## 📋 **Step-by-Step Setup**

### **Step 1: Get Connection Strings**
1. Go to your **staging** Supabase project dashboard
2. Navigate to **Settings** → **Database**
3. Copy the **Connection string** (NOT Connection pooling)
4. URL-encode the password: replace `@` with `%40`
5. Repeat for **production** project

### **Step 2: Get Project References**
1. Go to each Supabase project dashboard
2. Navigate to **Settings** → **General**
3. Copy the **Reference ID** (24 characters)

### **Step 3: Set GitHub Secrets**
1. Go to: `https://github.com/MWANGAZA-LAB/seed-guardian-safe/settings/secrets/actions`
2. Click **"New repository secret"** for each secret
3. Use the exact names and values above

## 🔍 **Example Values**

### **For Current Setup (Single Environment)**
```
SUPABASE_ACCESS_TOKEN=sbp_your_token_here
SUPABASE_DB_URL_STAGING=postgresql://postgres:Kryshevin%402025@aws-1-eu-north-1.supabase.com:5432/postgres
SUPABASE_DB_URL_PROD=postgresql://postgres:Kryshevin%402025@aws-1-eu-north-1.supabase.com:5432/postgres
SUPABASE_PROJECT_REF_STAGING=gwizmwhxbvayhebbyvql
SUPABASE_PROJECT_REF_PROD=gwizmwhxbvayhebbyvql
```

### **For Multi-Environment Setup**
```
SUPABASE_ACCESS_TOKEN=sbp_your_token_here
SUPABASE_DB_URL_STAGING=postgresql://postgres:staging_password@staging_host.supabase.com:5432/postgres
SUPABASE_DB_URL_PROD=postgresql://postgres:prod_password@prod_host.supabase.com:5432/postgres
SUPABASE_PROJECT_REF_STAGING=staging_project_ref_24_chars
SUPABASE_PROJECT_REF_PROD=prod_project_ref_24_chars
```

## ✅ **Benefits of New Approach**

1. **Simpler**: No complex URL encoding logic in workflow
2. **More Reliable**: Direct connection strings are more stable
3. **Better Separation**: Staging and production environments are isolated
4. **Easier Debugging**: Clear connection strings in secrets
5. **Concurrency Control**: Prevents deployment conflicts

## 🚀 **Testing**

After setting up the secrets:
1. Make a change to any file in `supabase/` directory
2. Push to `main` branch to trigger production deployment
3. Push to `develop` branch to trigger staging deployment
4. Check GitHub Actions logs for successful deployment

## 🔧 **Troubleshooting**

### **Connection String Issues**
- Ensure you're using **direct connection** (port 5432)
- Verify password is URL-encoded (`@` → `%40`)
- Check that the host matches your Supabase project

### **Project Reference Issues**
- Project references should be exactly 24 characters
- Get from Supabase Dashboard → Settings → General
- Ensure you're using the correct project for each environment
