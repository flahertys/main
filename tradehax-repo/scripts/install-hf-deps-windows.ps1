# Windows-specific HF dependency installer (avoids Rust compilation)
# Usage: .\scripts\install-hf-deps-windows.ps1

Write-Host "🚀 Installing TradeHax HF Fine-Tuning Dependencies (Windows)" -ForegroundColor Cyan
Write-Host ""

# Step 1: Upgrade pip
Write-Host "📦 Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip --quiet

# Step 2: Install pre-built wheels (no compilation needed)
Write-Host "📦 Installing HF packages (pre-built wheels)..." -ForegroundColor Yellow
$packages = @(
    "transformers==4.38.2",
    "huggingface-hub==0.21.3",
    "datasets==2.17.1",
    "peft==0.9.0",
    "accelerate==0.27.2",
    "evaluate==0.4.1"
)

foreach ($pkg in $packages) {
    Write-Host "  → Installing $pkg" -ForegroundColor Cyan
    python -m pip install "$pkg" --only-binary :all: --quiet
}

Write-Host ""
Write-Host "✅ Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. npm run llm:finetune:workflow" -ForegroundColor Cyan
Write-Host "  2. Ensure data/custom-llm/tradehax-training-expanded.jsonl exists" -ForegroundColor Cyan
Write-Host ""
