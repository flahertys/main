# 🖥️ IDE & Development Environment Setup

## Visual Studio Code Configuration

### Recommended Extensions

```json
{
  "recommendations": [
    // React & JavaScript
    "dsznajder.es7-react-js-snippets",      // React snippets
    "xabikos.JavaScriptSnippets",           // JS snippets
    "dbaeumer.vscode-eslint",               // ESLint
    "esbenp.prettier-vscode",               // Prettier formatter
    
    // TypeScript & Type Checking
    "ms-vscode.vscode-typescript-next",     // TypeScript support
    "vue.volar",                            // Vue/TypeScript
    
    // CSS & Styling
    "bradlc.vscode-tailwindcss",            // Tailwind CSS
    "ecmel.vscode-html-css",                // HTML CSS support
    "pranaygp.vscode-css-peek",             // CSS peek
    
    // Docker & DevOps
    "ms-azuretools.vscode-docker",          // Docker support
    "ms-kubernetes-tools.vscode-kubernetes-tools", // K8s
    
    // Version Control
    "donjayamanne.githistory",              // Git history
    "eamodio.gitlens",                      // Git lens
    "mhutchie.git-graph",                   // Git graph
    
    // API & Testing
    "rangav.vscode-thunder-client",         // Thunder Client (Postman)
    "humao.rest-client",                    // REST client
    "orta.vscode-jest",                     // Jest testing
    
    // Productivity
    "ms-vscode-remote.remote-ssh",          // Remote SSH
    "ms-vscode.remote-explorer",            // Remote explorer
    "naumovs.color-highlight",              // Color highlight
    "ms-vscode.makefile-tools",             // Makefile support
    
    // AI & Copilot
    "github.copilot",                       // GitHub Copilot
    "github.copilot-chat"                   // Copilot Chat
  ]
}
```

### Custom Tasks (`.vscode/tasks.json`)

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "🏗️ Build Production",
      "type": "shell",
      "command": "npm",
      "args": ["run", "build"],
      "group": { "kind": "build", "isDefault": true },
      "problemMatcher": ["$tsc"],
      "presentation": {
        "echo": true,
        "reveal": "always",
        "panel": "new"
      }
    },
    {
      "label": "🚀 Start Dev Server",
      "type": "shell",
      "command": "npm",
      "args": ["run", "dev"],
      "isBackground": true,
      "problemMatcher": {
        "pattern": {
          "regexp": "^.*$",
          "file": 1,
          "location": 2,
          "message": 3
        },
        "background": {
          "activeOnStart": true,
          "beginsPattern": "ready",
          "endsPattern": "compiled"
        }
      }
    },
    {
      "label": "✅ Lint Code",
      "type": "shell",
      "command": "npm",
      "args": ["run", "lint"],
      "group": { "kind": "test" }
    },
    {
      "label": "🔍 Type Check",
      "type": "shell",
      "command": "npm",
      "args": ["run", "type-check"],
      "group": { "kind": "test" }
    },
    {
      "label": "🎨 Format Code",
      "type": "shell",
      "command": "npm",
      "args": ["run", "format"],
      "group": { "kind": "test" }
    },
    {
      "label": "📦 Deploy to Namecheap",
      "type": "shell",
      "command": "node",
      "args": ["./scripts/deploy-namecheap.js"],
      "group": { "kind": "build" }
    },
    {
      "label": "🧪 Test Inference",
      "type": "shell",
      "command": "npm",
      "args": ["run", "hf:test-inference"],
      "group": { "kind": "test" }
    },
    {
      "label": "🔐 Health Check",
      "type": "shell",
      "command": "curl",
      "args": ["-s", "https://tradehax.net/__health"],
      "group": { "kind": "test" }
    }
  ]
}
```

### Launch Configuration (`.vscode/launch.json`)

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: Full Stack",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "runtimeArgs": ["dev"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "name": "Debug API Route",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "console": "integratedTerminal"
    }
  ]
}
```

---

## 🔧 Development Workflow

### Initial Setup

```bash
# Clone repository
git clone https://github.com/DarkModder33/main.git
cd main

# Install dependencies
npm install --legacy-peer-deps --ignore-scripts

# Setup environment
cp .env.example .env.local
# Edit .env.local with your values:
# - NEXT_PUBLIC_HF_API_TOKEN
# - NEXTAUTH_SECRET (generate: openssl rand -base64 32)
# - Other required variables
```

### Daily Workflow

```bash
# 1. Start development server
npm run dev
# Opens http://localhost:3000

# 2. In another terminal, watch for changes
npm run lint --watch

# 3. When ready to commit
npm run lint
npm run type-check
npm run build    # Verify production build

# 4. Commit changes
git add .
git commit -m "feature: description"
git push origin main
```

### Before Deployment

```bash
# Full quality gate
npm run lint
npm run type-check
npm run build

# Test locally
npm start

# Then deploy
node ./scripts/deploy-namecheap.js
```

---

## 🚀 VS Code Command Palette (Cmd+Shift+P)

### Common Commands

```
> npm: run build
> npm: run dev
> npm: run lint
> npm: run type-check
> npm: run format
> npm: run hf:test-inference

> Git: Clone Repository
> Git: Create Branch
> Git: Push
> Git: Pull

> Remote-SSH: Connect to Host
> Remote-SSH: SSH Configuration

> Docker: Open in Container
> Kubernetes: Open Dashboard

> Thunder Client: New Request
> REST Client: Send Request
```

---

## 📊 Debugging

### Browser DevTools

**Access at:** http://localhost:3000

Press `F12` or `Cmd+Option+I` for DevTools:
- **Console:** Check for errors/logs
- **Network:** View API calls
- **React DevTools:** Inspect components
- **Performance:** Check load times

### VS Code Debugging

**Set breakpoint:** Click line number  
**Start debugger:** F5 or Run → Start Debugging  
**Continue:** F5  
**Step over:** F10  
**Step into:** F11  

### API Testing

**Thunder Client in VS Code:**
1. Open Thunder Client
2. New Request
3. Enter endpoint URL
4. Set method (GET, POST, etc.)
5. Add headers/body
6. Send

**Or use curl:**
```bash
curl -X POST http://localhost:3000/api/hf-server \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello"}'
```

---

## 🔌 Connecting to Services

### Hugging Face (LLM)
```bash
# Get token from https://huggingface.co/settings/tokens
# Add to .env.local:
NEXT_PUBLIC_HF_API_TOKEN=hf_your_token_here

# Test with:
npm run hf:test-inference
```

### Wallet Access (Extension + Fallback)
```bash
# Preferred: install an EVM extension wallet (MetaMask / Phantom EVM / Brave Wallet)
# In app: Wallet tab -> CONNECT EXTENSION (auto-requests Polygon mainnet)
# Fallback: paste Polygon address and click VERIFY

# Optional future path (Solana):
# Install Phantom or Solflare browser extension
# Use Solana devnet/mainnet config only when Solana adapter is enabled

# Dev config in .env.local:
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
VITE_ENABLE_EXTENSION_CONNECT=true
VITE_POLYGON_RPC_URL=https://polygon-rpc.com
VITE_POLYGON_CHAIN_ID_HEX=0x89
VITE_EXECUTION_PROFILE_ID=polygon-evm
EXECUTION_PROFILE_ID=polygon-evm
WALLET_CHALLENGE_TTL_MS=300000
WALLET_PROOF_TTL_MS=600000
TELEMETRY_DATABASE_URL=
SETTLEMENT_POLYGON_MODE=simulate
```

### Database (PostgreSQL)
```bash
# Local development with Docker:
docker run -d \
  --name tradehax-db \
  -e POSTGRES_PASSWORD=dev \
  -p 5432:5432 \
  postgres:16

# Add to .env.local:
DATABASE_URL=postgresql://postgres:dev@localhost:5432/tradehax

# Run trading gate migrations (durable auth + telemetry):
psql -U postgres -d tradehax -f web/api/db/schemas/04-trading-telemetry.sql
psql -U postgres -d tradehax -f web/api/db/schemas/05-trading-auth-store.sql
```

### Durable Auth Store (Serverless Cold-Start Resilience)

The trading gate uses durable Postgres-backed challenge/proof store when `DATABASE_URL` is configured.
Challenges and proofs survive serverless cold starts and are auto-cleaned via SQL triggers.

### Test Trading Gate Locally

```bash
npm run dev
# In another terminal:
npm run test:trading-gate
```

Expected: ✓ Challenge → Verify → Preflight → Execute → Telemetry.

### L2 Custom Settlement Adapter

See `/api/trading/settlement/adapters/l2-custom-adapter.ts` for sequencer/relayer/fee-policy interface stubs.

---

## 🐛 Troubleshooting

### Common Issues

**Port 3000 Already in Use**
```bash
# Kill process on port 3000
lsof -i :3000 | grep -v PID | awk '{print $2}' | xargs kill -9
# Or use different port
PORT=3001 npm run dev
```

**Dependency Issues**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps --ignore-scripts
```

**Build Fails**
```bash
# Check for errors
npm run lint
npm run type-check

# Try clean build
npm run clean
npm run build
```

**HF API Token Error**
```bash
# Verify token is set
echo $NEXT_PUBLIC_HF_API_TOKEN

# Test API call
npm run hf:test-inference
```

---

## 📱 Testing on Mobile

### Local Network Access
```bash
# Get your IP
ipconfig getifaddr en0  # macOS
hostname -I             # Linux

# Access from phone
http://YOUR_IP:3000
```

### Chrome DevTools Mobile Emulation
- F12 → Toggle device toolbar (Cmd+Shift+M)
- Select device type
- Test responsive design

---

## 🔒 Git Workflow

### Creating Feature Branch
```bash
git checkout -b feature/description
npm install --legacy-peer-deps
# Make changes
npm run lint
npm run build
git add .
git commit -m "feature: add description"
git push origin feature/description
# Create Pull Request on GitHub
```

### Syncing with Main
```bash
# Update local main
git fetch origin
git checkout main
git pull origin main

# Rebase feature branch
git checkout feature/your-branch
git rebase main
# Resolve conflicts if needed
git push origin feature/your-branch --force
```

### Before Merging
```bash
# Ensure all tests pass
npm run lint
npm run type-check
npm run build

# Verify git log
git log main..HEAD
```

---

## 🎯 Performance Optimization

### Code Quality
```bash
# ESLint
npm run lint --fix   # Auto-fix issues

# TypeScript
npm run type-check   # Check types

# Format Code
npm run format       # Prettier formatting
```

### Build Optimization
```bash
# Analyze bundle size
npm run build -- --analyze

# Check what's slow
npm run build -- --debug
```

### Development Tips
- Use React DevTools to identify re-renders
- Check Network tab for slow API calls
- Use Lighthouse for performance audit
- Monitor memory in Chrome DevTools

---

## 🚀 Remote Development

### SSH into VPS

```bash
# Connect
ssh tradehax@199.188.201.164

# Check PM2 status
pm2 status
pm2 logs tradehax

# View logs
tail -f /home/tradehax/logs/tradehax-server.log

# Restart app
pm2 restart tradehax
```

### VS Code Remote SSH
1. Install "Remote - SSH" extension
2. Cmd+Shift+P → "Remote-SSH: Open Remote Window"
3. Enter: `tradehax@199.188.201.164`
4. Enter password or use SSH key
5. Browse and edit files directly on VPS

---

## 💾 Useful Keybindings

| Action | macOS | Windows/Linux |
|--------|-------|---------------|
| Command Palette | Cmd+Shift+P | Ctrl+Shift+P |
| Format Document | Option+Shift+F | Alt+Shift+F |
| Quick Fix | Cmd+. | Ctrl+. |
| Find | Cmd+F | Ctrl+F |
| Find & Replace | Cmd+H | Ctrl+H |
| Go to Line | Cmd+G | Ctrl+G |
| Split Editor | Cmd+\ | Ctrl+\ |
| Debug | F5 | F5 |
| Start Terminal | Ctrl+` | Ctrl+` |
| Git Push | Cmd+Shift+P → "Git: Push" | Ctrl+Shift+P → "Git: Push" |

---

## 📚 Learning Resources

### Documentation
- Next.js: https://nextjs.org/docs
- React: https://react.dev
- TypeScript: https://www.typescriptlang.org/docs/
- Tailwind CSS: https://tailwindcss.com/docs
- Solana: https://docs.solana.com

### Tutorials
- YouTube: "Next.js 15 Full Tutorial"
- YouTube: "Solana Development Tutorial"
- YouTube: "Hugging Face API Guide"

### Communities
- Next.js Discord: https://discord.gg/bUG7V3H
- Solana Discord: https://discord.com/invite/solana
- React Community: https://react.dev/community

---

## 🎉 Summary

Your development environment is now configured with:
- ✅ VS Code extensions for productivity
- ✅ Custom build & deployment tasks
- ✅ Debugging capabilities
- ✅ Remote SSH access
- ✅ Git workflow integration
- ✅ API testing tools
- ✅ Performance monitoring

**Ready to develop:** Run `npm run dev` and start coding! 🚀
