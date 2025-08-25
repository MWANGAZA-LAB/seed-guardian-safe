#!/bin/bash

echo "=== Testing Supabase Project Reference ==="
echo "Project Reference: gwizmwhxbvayhebbyvql"
echo "Length: ${#PROJECT_REF}"

# Test the link command with the actual project ref
echo "Testing: supabase link --project-ref gwizmwhxbvayhebbyvql"
echo "Note: This will fail without access token, but should show the correct project ref format"

# Show what the command should look like
echo ""
echo "✅ Correct command format:"
echo "supabase link --project-ref gwizmwhxbvayhebbyvql"
echo ""
echo "❌ Current failing command:"
echo "supabase link --project-ref (empty)"
echo ""
echo "🔧 Solution: Set GitHub Secret SUPABASE_PROJECT_REF = gwizmwhxbvayhebbyvql"
