# Finding the Correct Supabase Project Reference

## Current Issue
- We have: `gwizmwhxbvayhebbyvql` (21 characters)
- We need: 24-character project reference

## How to Find the Correct Reference

### Method 1: From Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project "seed-guardian-safe"
3. Go to Settings → General
4. Look for "Reference ID" or "Project ID"
5. It should be exactly 24 characters

### Method 2: From URL
1. When in your Supabase project, check the URL
2. It should look like: `https://app.supabase.com/project/[24-CHAR-REF]/settings/general`
3. The 24-character string is your project reference

### Method 3: From API Settings
1. Go to Settings → API
2. Look for "Project Reference" or "Project ID"
3. Should be 24 characters

## Common Project Reference Format
- 24 characters long
- Contains letters and numbers
- No special characters
- Example: `abcdefghijklmnopqrstuvwx`

## Next Steps
1. Find the correct 24-character reference
2. Update the GitHub Secret: `SUPABASE_PROJECT_REF`
3. Test the deployment again
