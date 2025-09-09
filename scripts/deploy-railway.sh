#!/bin/bash

# Railway Deployment Script for Seed Guardian Safe
# This script automates the deployment process to Railway

set -e

echo "🚀 Starting Railway deployment for Seed Guardian Safe..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed. Please install it first:"
    echo "   npm install -g @railway/cli"
    exit 1
fi

# Check if user is logged in
if ! railway whoami &> /dev/null; then
    echo "🔐 Please log in to Railway:"
    railway login
fi

# Build the application
echo "📦 Building application..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

# Get deployment URL
echo "🌐 Getting deployment URL..."
DEPLOYMENT_URL=$(railway domain)

echo "✅ Deployment successful!"
echo "🔗 Your app is available at: $DEPLOYMENT_URL"
echo "📊 Monitor your deployment at: https://railway.app/dashboard"

# Optional: Run health check
echo "🔍 Running health check..."
if curl -f -s "$DEPLOYMENT_URL" > /dev/null; then
    echo "✅ Health check passed!"
else
    echo "⚠️  Health check failed - please check your deployment"
fi

echo "🎉 Railway deployment completed!"
