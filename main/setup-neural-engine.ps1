# TradeHax Neural Engine - Quick Start Setup Script (Windows PowerShell)
# Run this to set up the neural engine system quickly

Write-Host "🧠 TradeHax Neural Engine - Setup Script (Windows)" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "✓ Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
$nodeVersion = & node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js not found. Please install Node.js 16+" -ForegroundColor Red
    exit 1
}

# Check npm
$npmVersion = & npm --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm not found. Please install npm" -ForegroundColor Red
    exit 1
}

# Check PostgreSQL (optional)
$psqlFound = & psql --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ PostgreSQL client found" -ForegroundColor Green
} else {
    Write-Host "⚠️  PostgreSQL client not found (optional for local dev)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green
Write-Host "✓ npm: $npmVersion" -ForegroundColor Green
Write-Host ""

# Create environment file if doesn't exist
if (-not (Test-Path ".env.local")) {
    Write-Host "📝 Creating .env.local..." -ForegroundColor Yellow
    $envContent = @"
# API Keys (required)
HUGGINGFACE_API_KEY=
OPENAI_API_KEY=

# Database (required for metrics)
DATABASE_URL=postgresql://localhost:5432/tradehax

# Admin
ADMIN_PASSWORD=admin123

# Config
METRICS_SNAPSHOT_INTERVAL=300000
REACT_APP_ADMIN_PASSWORD=admin123
"@
    Set-Content -Path ".env.local" -Value $envContent
    Write-Host "✓ Created .env.local (please add your API keys)" -ForegroundColor Green
} else {
    Write-Host "✓ .env.local already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "🔧 Neural Engine Files Status" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check all required files exist
$files = @(
    "web/api/ai/validators.ts",
    "web/api/ai/console.ts",
    "web/api/ai/prompt-engine.ts",
    "web/api/ai/chat.ts",
    "web/src/components/NeuralConsole.tsx",
    "web/src/components/AdminDashboard.tsx",
    "web/src/lib/neural-console-api.ts",
    "web/api/db/metrics-service.ts",
    "web/api/db/metrics_schema.sql"
)

$missing = 0
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✓ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file" -ForegroundColor Red
        $missing++
    }
}

if ($missing -gt 0) {
    Write-Host ""
    Write-Host "❌ Missing $missing file(s). Please ensure all files are deployed." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✓ All required files present!" -ForegroundColor Green

# Database setup prompt
Write-Host ""
Write-Host "💾 Database Setup" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan
Write-Host ""
$response = Read-Host "Do you want to set up PostgreSQL now? (y/n)"
if ($response -eq "y" -or $response -eq "Y") {
    # Get database URL
    $dbUrl = Read-Host "Enter DATABASE_URL (or press Enter for default: postgresql://localhost:5432/tradehax)"
    if ([string]::IsNullOrWhiteSpace($dbUrl)) {
        $dbUrl = "postgresql://localhost:5432/tradehax"
    }

    # Test connection
    Write-Host "Testing database connection..." -ForegroundColor Yellow
    try {
        & psql "$dbUrl" -c "SELECT 1" *>$null
        Write-Host "✓ Database connection successful!" -ForegroundColor Green

        # Run schema
        Write-Host "Running database schema..." -ForegroundColor Yellow
        $schemaContent = Get-Content "web/api/db/metrics_schema.sql" -Raw
        & psql "$dbUrl" -c $schemaContent *>$null
        Write-Host "✓ Database tables created!" -ForegroundColor Green

        # Update .env
        (Get-Content ".env.local") -replace "DATABASE_URL=.*", "DATABASE_URL=$dbUrl" | Set-Content ".env.local"
        Write-Host "✓ Updated .env.local with DATABASE_URL" -ForegroundColor Green
    } catch {
        Write-Host "❌ Could not connect to database" -ForegroundColor Red
        Write-Host "Create database manually with: createdb tradehax" -ForegroundColor Yellow
        Write-Host "Then run: psql postgresql://localhost:5432/tradehax < web/api/db/metrics_schema.sql" -ForegroundColor Yellow
    }
} else {
    Write-Host "⏭️  Skipping database setup" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔑 API Keys Setup" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan
Write-Host ""

# Check for API keys
$envContent = Get-Content ".env.local"
if ($envContent -match "HUGGINGFACE_API_KEY=$") {
    Write-Host "⚠️  HUGGINGFACE_API_KEY not set" -ForegroundColor Yellow
    $hfKey = Read-Host "Enter your HuggingFace API key (leave blank to skip)"
    if (-not [string]::IsNullOrWhiteSpace($hfKey)) {
        $envContent = $envContent -replace "HUGGINGFACE_API_KEY=.*", "HUGGINGFACE_API_KEY=$hfKey"
        Set-Content ".env.local" -Value $envContent
        Write-Host "✓ HuggingFace API key saved" -ForegroundColor Green
    }
} else {
    Write-Host "✓ HUGGINGFACE_API_KEY already set" -ForegroundColor Green
}

$envContent = Get-Content ".env.local"
if ($envContent -match "OPENAI_API_KEY=$") {
    Write-Host "⚠️  OPENAI_API_KEY not set" -ForegroundColor Yellow
    $openaiKey = Read-Host "Enter your OpenAI API key (leave blank to skip)"
    if (-not [string]::IsNullOrWhiteSpace($openaiKey)) {
        $envContent = $envContent -replace "OPENAI_API_KEY=.*", "OPENAI_API_KEY=$openaiKey"
        Set-Content ".env.local" -Value $envContent
        Write-Host "✓ OpenAI API key saved" -ForegroundColor Green
    }
} else {
    Write-Host "✓ OPENAI_API_KEY already set" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "=================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Review .env.local and ensure all keys are set" -ForegroundColor White
Write-Host "2. Read NEURAL_ENGINE_INTEGRATION_GUIDE.md for deployment" -ForegroundColor White
Write-Host "3. Run: npm run dev (for development)" -ForegroundColor White
Write-Host "4. Navigate to /neural-console to monitor" -ForegroundColor White
Write-Host "5. Navigate to /admin/neural-hub for configuration" -ForegroundColor White
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "- NEURAL_ENGINE_FINAL_SUMMARY.md - Overview & features" -ForegroundColor White
Write-Host "- NEURAL_ENGINE_DEPLOYMENT.md - Deployment checklist" -ForegroundColor White
Write-Host "- NEURAL_ENGINE_INTEGRATION_GUIDE.md - Complete integration guide" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Ready to deploy!" -ForegroundColor Green

