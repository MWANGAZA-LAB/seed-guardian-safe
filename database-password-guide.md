# Database Password Guide - Fixing Connection Issues

## Current Problem
The Supabase CLI is failing to connect with the error:
```
failed SASL auth (FATAL: password authentication failed for user "postgres")
```

This happens because the CLI is trying to connect to the **pooler** connection instead of the **direct** database connection.

## 🔍 How to Find the Correct Password

### Method 1: Direct Connection String (Recommended)
1. Go to **Supabase Dashboard** → **Settings** → **Database**
2. Look for **"Connection string"** (NOT "Connection pooling")
3. You'll see something like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@aws-1-eu-north-1.supabase.com:5432/postgres
   ```
4. **Extract the password** between `postgres:` and `@aws-1-eu-north-1`

### Method 2: Connection Pooling String (Wrong Method)
1. Go to **Supabase Dashboard** → **Settings** → **Database**
2. Look for **"Connection pooling"** 
3. You'll see something like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@aws-1-eu-north-1.pooler.supabase.com:6543/postgres
   ```
4. **⚠️ DON'T use this password** - it's for the pooler connection

### Method 3: Reset Database Password
1. Go to **Supabase Dashboard** → **Settings** → **Database**
2. Look for **"Database Password"** section
3. Click **"Reset password"** if available
4. Copy the new password

## 🔧 Testing the Password

### Test Locally (Optional)
```bash
# Install Supabase CLI locally
npm install -g supabase

# Test the connection
supabase link --project-ref gwizmwhxbvayhebbyvql --password YOUR_PASSWORD
```

### Test in GitHub Actions
1. Update the GitHub Secret: `SUPABASE_DB_PASSWORD`
2. Use the password from the **direct connection string**
3. Commit and push to trigger the workflow

## 🚨 Common Mistakes

1. **Using pooler password**: The pooler connection uses different authentication
2. **Using full connection string**: Only use the password part
3. **Using API keys**: Database password is different from API keys
4. **Special characters**: Some passwords contain `@` or `#` that need proper handling

## 📋 Step-by-Step Fix

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/gwizmwhxbvayhebbyvql/settings/database

2. **Find Direct Connection String**
   - Look for "Connection string" (not "Connection pooling")
   - Copy the password part

3. **Update GitHub Secret**
   - Go to: https://github.com/MWANGAZA-LAB/seed-guardian-safe/settings/secrets/actions
   - Update `SUPABASE_DB_PASSWORD` with the correct password

4. **Test Deployment**
   - Commit and push any change to trigger the workflow
   - Check the GitHub Actions logs

## 🔍 Debug Information

The workflow will show:
- Password length (should be reasonable, not 0)
- First few characters (to verify it's not empty)
- Connection attempt details

## ✅ Success Indicators

When working correctly, you should see:
```
✅ SUCCESS: All secrets are set correctly!
  Project ref: 'gwizmwhxbvayhebbyvql' (21 chars)
  Access token: 'sbp_...' (XX chars)
  DB password: '****...' (XX chars)
```

And then:
```
Initialising cli_login_postgres role...
Connecting to remote database...
Finished supabase/db/push
```
