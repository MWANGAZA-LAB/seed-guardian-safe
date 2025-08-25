# Database Connection Test Guide

## Current Issue
The Supabase CLI is failing to authenticate with the database password.

## How to Find the Correct Password

### Method 1: From Connection String
1. Go to Supabase Dashboard → Settings → Database
2. Look for "Connection string" or "Connection pooling"
3. The connection string looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@aws-1-eu-north-1.pooler.supabase.com:6543/postgres
   ```
4. Extract the password between `postgres:` and `@aws-1-eu-north-1`

### Method 2: Reset Database Password
1. Go to Settings → Database
2. Look for "Database Password" or "Reset password"
3. Click "Reset password" if available
4. Copy the new password

### Method 3: Check Connection Pooling
1. Go to Settings → Database
2. Look for "Connection pooling" section
3. Find the password in the pooling connection string

## Common Issues
- Using API key instead of database password
- Using connection string instead of just the password
- Password contains special characters that need escaping
- Password is too long or too short

## Test Command
Once you have the password, test it with:
```bash
supabase link --project-ref gwizmwhxbvayhebbyvql --password YOUR_PASSWORD
```

## Next Steps
1. Find the correct database password
2. Update the GitHub Secret: SUPABASE_DB_PASSWORD
3. Test the deployment again
