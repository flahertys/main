# TradeHax Neural Engine - Secure Deployment Configuration
# For Private/Closed Network Environments

## 🔒 SECURITY FIRST APPROACH

This deployment is designed for private networks where:
- ✅ Network is completely isolated
- ✅ No external internet exposure
- ✅ All infrastructure is internal
- ✅ Team is trusted and vetted

## 📋 PRE-DEPLOYMENT CHECKLIST

### 1. Verify Git Configuration
```bash
# Check .gitignore is protecting secrets
git check-ignore .env.local
# Should output: .env.local (if protected)

# Verify no secrets in Git history
git log --all --full-history -S "sk-proj-" -- .env.local
# Should return: no commits found
```

### 2. Verify No Secrets in Code
```bash
# Search for API keys in source
grep -r "sk-proj-" --include="*.ts" --include="*.js" web/
grep -r "hf_" --include="*.ts" --include="*.js" web/
# Should return: no results (all keys only in .env.local)
```

### 3. Create .env.example (Safe Template)
We've created this for documentation:
```
HUGGINGFACE_API_KEY=hf_[CONFIGURE_IN_SECURE_ENV]
OPENAI_API_KEY=sk-proj-[CONFIGURE_IN_SECURE_ENV]
DATABASE_URL=postgresql://[CONFIGURE_IN_SECURE_ENV]
```

## 🚀 DEPLOYMENT PROCESS

### Step 1: Commit Code (NOT Secrets)
```bash
# Stage only code files
git add web/ NEURAL_ENGINE_*.md BACKUP_ENDPOINTS_CONFIGURED.md SECURITY_*.md

# Verify .env.local is NOT staged
git status | grep ".env.local"
# Should show: nothing

# Commit
git commit -m "Deploy: TradeHax Neural Engine v2.0 with multi-endpoint backup"
```

### Step 2: Push to Repository
```bash
git push origin main
# Deploys code to your private repository
```

### Step 3: Deploy to Server

#### Option A: Docker Container
```bash
# Build container
docker build -t tradehax-neural:v2 .

# Run with environment variables
docker run -d \
  -e HUGGINGFACE_API_KEY=$HF_KEY \
  -e OPENAI_API_KEY=$OAI_KEY \
  -e DATABASE_URL=$DB_URL \
  -p 3000:3000 \
  tradehax-neural:v2
```

#### Option B: Direct Deployment
```bash
# On server, set environment variables
export HUGGINGFACE_API_KEY="hf_..."
export OPENAI_API_KEY="sk-proj-..."
export DATABASE_URL="postgresql://..."

# Pull latest code
git pull origin main

# Install & start
npm install
npm run build
npm start
```

#### Option C: Vercel (Private Git Connection)
```bash
# Connect private repository to Vercel
# Environment variables set in Vercel dashboard
# Auto-deploys on git push

vercel env add HUGGINGFACE_API_KEY
vercel env add OPENAI_API_KEY
vercel env add DATABASE_URL
```

## 🔐 ENVIRONMENT VARIABLE MANAGEMENT

### For Private Network:

**Option 1: Secrets Manager**
```bash
# If using HashiCorp Vault, AWS Secrets Manager, etc.
# Store keys in secure vault
# Application reads at runtime
```

**Option 2: Environment File (Secure)**
```bash
# Create on secure server (never commit)
# Set restrictive permissions
chmod 600 .env.production

# Load in startup script
source .env.production
npm start
```

**Option 3: CI/CD Pipeline**
```bash
# If using Jenkins, GitHub Actions, GitLab CI:
# Store secrets in CI/CD protected variables
# Inject at build/deploy time
```

## ✅ VERIFICATION AFTER DEPLOYMENT

```bash
# Test API is running
curl http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "test"}]}'

# Check dashboard
curl http://localhost:3000/neural-console

# Verify endpoints are responding
curl http://localhost:3000/api/ai/chat \
  -X POST \
  -d '{"isConsoleCommand": true, "command": "ai-status"}'

# Should show: HuggingFace configured, OpenAI configured
```

## 🚨 WHAT NOT TO DO

❌ **DO NOT** commit `.env.local` to Git  
❌ **DO NOT** put API keys in source code  
❌ **DO NOT** push passwords to repository  
❌ **DO NOT** share credentials in chat/messages  
❌ **DO NOT** log API keys to console in production  

## ✅ WHAT TO DO

✅ Use `.env.local` (not committed)  
✅ Set environment variables at runtime  
✅ Use secure credential management  
✅ Rotate keys periodically  
✅ Monitor access logs  
✅ Audit who has access  

## 📦 WHAT'S BEING DEPLOYED

### Code Files (Safe - All Committed)
```
✅ web/api/ai/validators.ts
✅ web/api/ai/console.ts
✅ web/api/ai/prompt-engine.ts
✅ web/api/ai/chat.ts (updated)
✅ web/src/components/NeuralConsole.tsx
✅ web/src/components/AdminDashboard.tsx
✅ web/api/db/metrics-service.ts
✅ All documentation files
```

### Secrets (NOT Committed - Handled Separately)
```
❌ .env.local (ignored by .gitignore)
❌ API keys (set via environment)
❌ Database password (set via environment)
❌ Admin passwords (set via environment)
```

## 🎯 AFTER DEPLOYMENT

1. **Verify System Running**
   ```bash
   npm run dev
   # or your deployment command
   ```

2. **Check All Endpoints**
   - Visit: http://your-server:3000/neural-console
   - Visit: http://your-server:3000/admin/neural-hub
   - Password: admin123 (change in .env.production)

3. **Test AI Functions**
   - Send test request to chat endpoint
   - Verify HuggingFace working
   - Verify OpenAI fallback available
   - Check metrics dashboard

4. **Monitor Logs**
   ```bash
   pm2 logs tradehax-neural
   # or
   docker logs container-name
   ```

## 📞 TROUBLESHOOTING

### "API key not found"
```
Solution:
1. Verify environment variable is set
2. Check .env.local is in root directory
3. Ensure npm run dev loads .env.local
4. Restart application
```

### "Connection refused"
```
Solution:
1. Check port 3000 is available
2. Verify firewall allows connection
3. Check service is running: ps aux | grep node
4. Check logs for startup errors
```

### "Endpoints not responding"
```
Solution:
1. Verify API keys are correct
2. Check network connectivity to OpenAI/HuggingFace
3. Verify database connection
4. Check error logs
```

## ✨ FINAL CHECKLIST

- [ ] `.env.local` created with all keys
- [ ] `.gitignore` protecting secrets
- [ ] Code committed (no secrets)
- [ ] Code pushed to repository
- [ ] Environment variables configured on server
- [ ] Application deployed and running
- [ ] Dashboards accessible
- [ ] API endpoints responding
- [ ] Health check passing
- [ ] Logs showing no errors

## 🚀 DEPLOYMENT COMMAND SUMMARY

```bash
# 1. Verify secrets are protected
git status | grep -E ".env|secret"  # Should be empty

# 2. Commit code
git add .
git commit -m "Deploy: TradeHax Neural Engine v2.0"

# 3. Push
git push origin main

# 4. On server, set environment
export HUGGINGFACE_API_KEY="hf_..."
export OPENAI_API_KEY="sk-proj-..."
export DATABASE_URL="postgresql://..."

# 5. Deploy
git pull origin main
npm install
npm run build
npm start

# 6. Verify
curl http://localhost:3000/neural-console
```

---

**Security Level:** Enterprise Grade  
**Network:** Private/Closed  
**Keys:** Secured, Environment Variables  
**Status:** Ready to Deploy  

✅ **System is secure and ready for deployment!**

