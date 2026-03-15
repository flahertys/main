# TradeHax Neural Hub - Quick Deploy Script
# Execute this after implementation is complete

Write-Host "🚀 TradeHax Neural Hub - Deployment Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to project
cd C:\tradez\main\web

# Step 1: Install dependencies
Write-Host "Step 1: Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 2: Check for HuggingFace API key
Write-Host "Step 2: Checking environment variables..." -ForegroundColor Yellow

$hfKeyExists = vercel env ls 2>&1 | Select-String "HUGGINGFACE_API_KEY"

if (-not $hfKeyExists) {
    Write-Host "⚠️ HUGGINGFACE_API_KEY not found in Vercel" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To add it:" -ForegroundColor Cyan
    Write-Host "1. Get free token from: https://huggingface.co/settings/tokens" -ForegroundColor White
    Write-Host "2. Run: vercel env add HUGGINGFACE_API_KEY" -ForegroundColor White
    Write-Host "3. Paste your hf_ token" -ForegroundColor White
    Write-Host ""

    $continue = Read-Host "Do you want to add it now? (y/n)"

    if ($continue -eq "y") {
        vercel env add HUGGINGFACE_API_KEY
    } else {
        Write-Host "⚠️ Continuing without HuggingFace key (will use demo mode)" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ HUGGINGFACE_API_KEY found" -ForegroundColor Green
}

Write-Host ""

# Step 3: Test build locally
Write-Host "Step 3: Testing build..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful" -ForegroundColor Green
Write-Host ""

# Step 4: Offer local test
Write-Host "Step 4: Local testing (optional)" -ForegroundColor Yellow
$testLocal = Read-Host "Do you want to test locally first? (y/n)"

if ($testLocal -eq "y") {
    Write-Host ""
    Write-Host "Starting local dev server..." -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop and continue deployment" -ForegroundColor Yellow
    Write-Host ""
    vercel dev
}

Write-Host ""

# Step 5: Deploy to production
Write-Host "Step 5: Deploying to production..." -ForegroundColor Yellow
$deploy = Read-Host "Ready to deploy to production? (y/n)"

if ($deploy -ne "y") {
    Write-Host "❌ Deployment cancelled" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "Deploying to Vercel production..." -ForegroundColor Cyan
vercel --prod

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Deployment successful!" -ForegroundColor Green
Write-Host ""

# Step 6: Test production endpoints
Write-Host "Step 6: Testing production endpoints..." -ForegroundColor Yellow
Write-Host ""

Write-Host "Testing crypto data endpoint..." -ForegroundColor Cyan
curl -s https://tradehax.net/api/data/crypto?symbol=BTC | ConvertFrom-Json | Format-List

Write-Host ""
Write-Host "Testing AI chat endpoint..." -ForegroundColor Cyan
$chatBody = @{
    messages = @(
        @{
            role = "user"
            content = "Give me a quick BTC analysis"
        }
    )
} | ConvertTo-Json -Compress

$response = curl -s -X POST https://tradehax.net/api/ai/chat `
    -H "Content-Type: application/json" `
    -d $chatBody | ConvertFrom-Json

Write-Host "Provider: $($response.provider)" -ForegroundColor Green
Write-Host "Model: $($response.model)" -ForegroundColor Green
Write-Host ""
Write-Host "Response:" -ForegroundColor Green
Write-Host $response.response
Write-Host ""

# Step 7: Final verification
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Live Site: https://tradehax.net" -ForegroundColor Cyan
Write-Host "📊 API Endpoints:" -ForegroundColor Cyan
Write-Host "   - https://tradehax.net/api/ai/chat" -ForegroundColor White
Write-Host "   - https://tradehax.net/api/data/crypto?symbol=BTC" -ForegroundColor White
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Visit https://tradehax.net" -ForegroundColor White
Write-Host "   2. Click 'Live AI' toggle" -ForegroundColor White
Write-Host "   3. Ask: 'What's your BTC analysis?'" -ForegroundColor White
Write-Host "   4. Verify AI responds with HuggingFace" -ForegroundColor White
Write-Host ""
Write-Host "📖 Full Documentation: C:\tradez\main\PHASE_1_COMPLETE_SUMMARY.md" -ForegroundColor Cyan
Write-Host ""

