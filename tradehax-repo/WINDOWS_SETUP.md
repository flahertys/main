# TradeHax HF Fine-Tuning: Windows Setup Guide

## ⚠️ Windows-Specific Notes

Windows requires pre-built Python packages to avoid Rust compilation. This guide handles that automatically.

---

## Quick Setup (Windows)

### 1. Clone Repository
```bash
git clone https://github.com/DarkModder33/main.git
cd main
```

### 2. Setup Environment
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Hugging Face API token:
```bash
HF_API_TOKEN=hf_YOUR_TOKEN_HERE
```

Get token from: https://huggingface.co/settings/tokens

### 3. Install Node Dependencies
```bash
npm install
```

### 4. Install Python Dependencies (Windows-Optimized)

**Option A: Using PowerShell Script (Recommended)**
```powershell
.\scripts\install-hf-deps-windows.ps1
```

**Option B: Using pip directly**
```bash
pip install -r scripts/fine-tune-requirements-windows.txt --only-binary :all:
```

**Option C: Manual installation**
```bash
pip install --upgrade pip
pip install transformers huggingface-hub datasets peft accelerate evaluate --only-binary :all:
```

### 5. Verify Installation
```bash
node scripts/setup-hf-finetuning.js
```

Expected output:
```
✅ FILES OK, but environment needs setup
Setup .env.local first...
```

### 6. Test API Locally
```bash
npm run dev
```

In another terminal:
```bash
curl -X POST http://localhost:3000/api/hf-server `
  -H "Content-Type: application/json" `
  -d '{\"prompt\": \"Trading strategy\", \"task\": \"text-generation\"}'
```

---

## Troubleshooting

### ❌ Error: `pip install` fails with Rust/tokenizers error
**Solution:** Use the Windows-optimized requirements:
```bash
pip install -r scripts/fine-tune-requirements-windows.txt --only-binary :all:
```

### ❌ Error: `ModuleNotFoundError: No module named 'transformers'`
**Solution:** Verify installation:
```bash
pip list | findstr transformers
# If not found, run:
pip install transformers --only-binary :all:
```

### ❌ Error: Permission denied when running scripts
**Solution:** Run PowerShell as Administrator or use direct pip commands:
```bash
pip install -r scripts/fine-tune-requirements-windows.txt --only-binary :all:
```

### ❌ Error: `npm run llm:finetune:workflow` fails
**Reasons:**
1. Python dependencies not installed (see Step 4)
2. HF_API_TOKEN not set in .env.local
3. Training data file missing

**Solution:**
```bash
# Check Python packages
python -c "import transformers; print('OK')"

# Check HF token
echo %HF_API_TOKEN%  (should not be empty)

# Check dataset
ls data/custom-llm/tradehax-training-expanded.jsonl
```

---

## GPU Support (Optional)

If you want to use GPU for fine-tuning (recommended for faster training):

### NVIDIA GPU (CUDA)
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
pip install bitsandbytes  # For 4-bit quantization
```

### AMD GPU (ROCm)
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/rocm5.7
```

### No GPU (CPU only)
```bash
pip install torch torchvision torchaudio
# Fine-tuning will be slower but works
```

---

## Full Setup Script (Copy & Run)

Save as `setup-windows.bat` and run:
```batch
@echo off
echo Setting up TradeHax HF Fine-Tuning (Windows)
echo.

echo 1. Installing npm dependencies...
call npm install
echo.

echo 2. Installing Python dependencies...
call pip install -r scripts/fine-tune-requirements-windows.txt --only-binary :all:
echo.

echo 3. Verifying setup...
call node scripts/setup-hf-finetuning.js
echo.

echo ✅ Setup complete!
echo.
echo Next: Edit .env.local and add HF_API_TOKEN
echo Then: npm run dev
pause
```

---

## PowerShell Alternative

Save as `setup-windows.ps1` and run in PowerShell:
```powershell
Write-Host "Setting up TradeHax HF Fine-Tuning (Windows)" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Installing npm dependencies..." -ForegroundColor Yellow
npm install

Write-Host "2. Installing Python dependencies..." -ForegroundColor Yellow
pip install -r scripts/fine-tune-requirements-windows.txt --only-binary :all:

Write-Host "3. Verifying setup..." -ForegroundColor Yellow
node scripts/setup-hf-finetuning.js

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next: Edit .env.local and add HF_API_TOKEN" -ForegroundColor Cyan
Write-Host "Then: npm run dev" -ForegroundColor Cyan
```

---

## CPU vs GPU Performance

| Environment | Speed | Memory | Cost |
|---|---|---|---|
| CPU (local) | ~5 min/epoch | 4-8 GB | Free |
| GPU NVIDIA | ~30 sec/epoch | 8-16 GB | Local |
| GPU AMD | ~1 min/epoch | 8-16 GB | Local |
| Colab GPU | ~30 sec/epoch | Free | Free |

---

## Running on Google Colab (Free GPU)

If you don't have a local GPU:

1. Go to: https://colab.research.google.com
2. Create new notebook
3. Run:
```python
!git clone https://github.com/DarkModder33/main.git
%cd main
!pip install -r scripts/fine-tune-requirements.txt
!python scripts/fine-tune-mistral-lora.py
```

---

## Next Steps

1. ✅ Complete setup using this guide
2. ⏳ Create training data: `data/custom-llm/tradehax-training-expanded.jsonl`
3. ⏳ Run fine-tuning: `npm run llm:finetune:workflow:push`
4. ⏳ Deploy to Vercel: `git push origin main`
5. ⏳ Test live API

---

## Support

**For issues specific to Windows setup:**
- Email: irishmikeflaherty@gmail.com
- GitHub: https://github.com/DarkModder33/main

**Common Windows Python issues:**
- https://docs.python.org/3/using/windows.html
- https://huggingface.co/docs/transformers/installation

---

**Status:** ✅ Windows-ready  
**Last Updated:** 2026-02-25  
**Python Version:** 3.10+ recommended
