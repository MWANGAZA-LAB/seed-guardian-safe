# Railway Deployment Script for Seed Guardian Safe
# This script automates the deployment process to Railway

param(
    [switch]$SkipBuild,
    [switch]$SkipHealthCheck
)

Write-Host "🚀 Starting Railway deployment for Seed Guardian Safe..." -ForegroundColor Green

# Check if Railway CLI is installed
try {
    railway --version | Out-Null
} catch {
    Write-Host "❌ Railway CLI is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g @railway/cli" -ForegroundColor Yellow
    exit 1
}

# Check if user is logged in
try {
    railway whoami | Out-Null
} catch {
    Write-Host "🔐 Please log in to Railway:" -ForegroundColor Yellow
    railway login
}

# Build the application
if (-not $SkipBuild) {
    Write-Host "📦 Building application..." -ForegroundColor Blue
    npm run build
    
    # Check if build was successful
    if (-not (Test-Path "dist")) {
        Write-Host "❌ Build failed - dist directory not found" -ForegroundColor Red
        exit 1
    }
}

# Deploy to Railway
Write-Host "🚀 Deploying to Railway..." -ForegroundColor Blue
railway up

# Get deployment URL
Write-Host "🌐 Getting deployment URL..." -ForegroundColor Blue
$deploymentUrl = railway domain

Write-Host "✅ Deployment successful!" -ForegroundColor Green
Write-Host "🔗 Your app is available at: $deploymentUrl" -ForegroundColor Cyan
Write-Host "📊 Monitor your deployment at: https://railway.app/dashboard" -ForegroundColor Cyan

# Optional: Run health check
if (-not $SkipHealthCheck) {
    Write-Host "🔍 Running health check..." -ForegroundColor Blue
    try {
        $response = Invoke-WebRequest -Uri $deploymentUrl -UseBasicParsing -TimeoutSec 30
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Health check passed!" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Health check failed - Status Code: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  Health check failed - please check your deployment" -ForegroundColor Yellow
    }
}

Write-Host "🎉 Railway deployment completed!" -ForegroundColor Green
