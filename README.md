# TradeHax AI - Automated Web3 Trading Platform

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black)](https://vercel.com)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.12-black)](https://nextjs.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **📘 Start here:** Use [`DOCS_INDEX.md`](./DOCS_INDEX.md) as the canonical navigation for setup, deployment, DNS, and operations docs.

A sophisticated automated Web3 trading platform built with Next.js, React, and powered by Solana blockchain technology. Trade smarter with AI-driven insights and decentralized technology.

## 🌐 Live Deployments

- **Primary Domain**: [https://tradehax.net](https://tradehax.net)
- **Mirror Domain**: [https://tradehaxai.tech](https://tradehaxai.tech)

## ✨ Features

- 🚀 **Modern Stack**: Built with Next.js 15.5.12, React 19, TypeScript
- 🔗 **Solana Integration**: Native Web3 wallet support with Solana blockchain
- 🎨 **Beautiful UI**: Tailwind CSS 4 with custom design system
- 📱 **Responsive Design**: Mobile-first, works perfectly on all devices
- ⚡ **Performance Optimized**: Code splitting, lazy loading, and optimized bundle size
- 🔒 **Security First**: CSP headers, XSS protection, and secure authentication
- 📊 **Analytics Ready**: Vercel Analytics and Google Analytics integration
- 🎮 **Interactive Gaming**: Built-in game features with NFT integration
- 💼 **Portfolio Management**: Track and manage your investments
- 📝 **Task Management**: Built-in todo system
- 🎵 **Music Section**: Music lessons, scholarships, and showcase

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm, yarn, pnpm, or bun package manager
- Git

### Local Development

1. **Clone the repository**

```bash
git clone https://github.com/DarkModder33/main.git
cd main
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. **Set up environment variables**

```bash
# Copy the canonical environment template
cp .env.example .env.local

# Edit .env.local with your configuration
# See .env.example for all available options
```

Minimum required variables:
```env
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SOLANA_RPC=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. **Start the development server**

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

5. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 📦 Build & Production

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `.next` directory.

### Start Production Server

```bash
npm run start
```

### Lint Code

```bash
npm run lint
```

## 🌍 Deployment (Precision Paths)

TradeHax currently supports two deployment paths. Pick one and keep it as the source of truth for production:

- **Path A: Vercel** (managed hosting + domain wiring)
- **Path B: Namecheap VPS** (custom VPS workflow via deploy scripts)

For precise setup and troubleshooting, use:

- **`DEPLOYMENT_QUICKSTART.md`** (current decision tree + minimum required setup)
- **`GITHUB_SECRETS_SETUP.md`** (GitHub Actions secrets)
- **`VERCEL_DOMAIN_SETUP.md`** and **`VERCEL_DEPLOYMENT_TROUBLESHOOTING.md`** (Vercel path)
- **`NAMECHEAP_CPANEL_DEPLOYMENT.md`** and **`NAMECHEAP_MIGRATION_CHECKLIST.md`** (Namecheap path)

> Operational rule: a commit being in `main` does **not** mean production is updated until the selected deploy path completes successfully.

### One-Button Deploy (Local Ops)

Run a full local deploy pipeline with one command (or one VS Code task button):

```bash
# Production deploy (preflight + social check + quality + build + deploy)
npm run deploy:one-click

# Preview deploy
npm run deploy:one-click:preview

# Validate full pipeline without sending a deployment
node ./scripts/one-button-deploy.js --prod --dry-run
```

The script uses `npx vercel@latest` so a global Vercel install is not required.

### Aggressive Website + LLM Development Loop

Run a high-intensity local loop that continuously hardens website quality, internal links, and LLM readiness checks with a report artifact:

```bash
# Full aggressive loop
npm run dev:aggressive

# Faster pass for frequent iteration
npm run dev:aggressive:quick

# Keep running remaining steps even if one fails
npm run dev:aggressive:continue

# Include deploy launcher dry-run audit
npm run dev:aggressive:deploy-ready

# Strict mode (fail fast)
npm run dev:aggressive:strict

# Verify latest report integrity + consistency
npm run dev:aggressive:verify

# Run + verify in one command
npm run dev:aggressive:prove

# Elite threshold proof (95+)
npm run dev:aggressive:prove:elite
```

Each run outputs:

- `.artifacts/aggressive-dev-report.json` (execution proof)
- `.artifacts/aggressive-dev-report.sha256` (integrity checksum)
- `.artifacts/aggressive-dev-plan.json` (planned objectives and step map)

An autonomous CI workflow (`.github/workflows/aggressive-proof-gate.yml`) also runs this proof gate on schedule and key automation changes.

### Troubleshooting

If your site is not live after deployment:

1. **Check GitHub Actions** - Go to Actions tab and verify workflow succeeded
2. **Check Vercel Dashboard** - Verify deployment shows "Ready" status
3. **Check DNS Propagation** - Use https://dnschecker.org to verify DNS records
4. **Review Logs** - Check GitHub Actions logs and Vercel deployment logs
5. **Consult Guide** - See [VERCEL_DEPLOYMENT_TROUBLESHOOTING.md](./VERCEL_DEPLOYMENT_TROUBLESHOOTING.md) for detailed solutions

## 🔧 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SOLANA_NETWORK` | Solana network to use | `mainnet-beta` or `devnet` |
| `NEXT_PUBLIC_SOLANA_RPC` | Solana RPC endpoint | `https://api.mainnet-beta.solana.com` |
| `NEXT_PUBLIC_SITE_URL` | Your website URL | `https://tradehaxai.tech` |

### Optional Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_HELIUS_API_KEY` | Helius RPC API key (recommended) | `your-helius-key` |
| `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` | Google Analytics tracking ID | `G-XXXXXXXXXX` |
| `NEXT_PUBLIC_CLAIM_API_BASE` | Claim API endpoint | `https://tradehaxai.tech/api/claim` |

See `.env.example` for complete list of all available environment variables.

### Social Media API Setup (X, Instagram, TikTok, YouTube, Facebook, LinkedIn, Reddit, Discord)

```bash
# Generate social API templates and scaffold missing placeholders into .env.local
npm run social:setup

# Check which provider credentials are still missing
npm run social:check
```

Templates are written to `.env.social.example`, and provider toggles are controlled via `TRADEHAX_SOCIAL_PROVIDERS`.

## 📚 Project Structure

```
.
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   │   ├── claim/           # Claim reward API
│   │   └── subscribe/       # Newsletter subscription API
│   ├── blog/                # Blog pages
│   ├── dashboard/           # Dashboard page
│   ├── game/                # Game page
│   ├── music/               # Music section
│   ├── portfolio/           # Portfolio page
│   ├── services/            # Services page
│   ├── todos/               # Todo app
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── counter/            # Solana counter
│   ├── landing/            # Landing page sections
│   ├── monetization/       # Ads and affiliate
│   ├── shamrock/           # Header and footer
│   └── ui/                 # UI components
├── lib/                    # Utility libraries
├── public/                 # Static assets
├── styles.css             # Additional styles
├── next.config.ts         # Next.js configuration
├── tailwind.config.ts     # Tailwind configuration
├── vercel.json            # Vercel configuration
├── .env.example           # Example environment variables
└── package.json           # Dependencies and scripts
```

## 🔐 Security

### Security Features

- ✅ Content Security Policy (CSP) headers
- ✅ XSS protection
- ✅ CSRF protection
- ✅ Secure headers (X-Frame-Options, X-Content-Type-Options)
- ✅ HTTPS enforced in production
- ✅ Rate limiting on API routes
- ✅ Input validation and sanitization

### Security Best Practices

1. **Never commit sensitive data**
   - `.env` and `.env.local` are gitignored
   - Use Vercel environment variables for secrets

2. **Keep dependencies updated**
   ```bash
   npm audit
   npm update
   ```

3. **Use dedicated RPC providers**
   - Don't rely on public RPCs in production
   - Use Helius, QuickNode, or Triton

## 🎯 Performance Optimization

The application includes several optimizations:

- ⚡ Next.js 15 with Turbopack for faster builds
- 🎨 Tailwind CSS 4 for optimized styles
- 📦 Code splitting and lazy loading
- 🖼️ Image optimization with Next.js Image
- 💾 Static generation where possible
- 🗜️ Compression enabled
- 📊 Bundle size optimization

### Bundle Analysis

To analyze bundle size:

```bash
npm run build
```

The build output shows the size of each page and shared chunks.

## 🧪 Testing

### Manual Testing Checklist

- [ ] Homepage loads correctly
- [ ] Wallet connection works
- [ ] Navigation between pages
- [ ] API endpoints respond
- [ ] Forms submit properly
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility

### Automated Testing

```bash
# Coming soon
npm run test
```

## 📈 Monitoring & Analytics

### Vercel Analytics

Vercel Analytics is enabled by default. View analytics in your Vercel Dashboard.

### Google Analytics

To enable Google Analytics:

1. Get your tracking ID from Google Analytics
2. Add to environment variables:
   ```
   NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
   ```
3. Deploy

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Additional Documentation

- [IDE_AUTOMATION_WORKFLOW.md](./IDE_AUTOMATION_WORKFLOW.md) - Local IDE + pipeline contract for AI-assisted development
- [LOCAL_REPO_WORKFLOW.md](./LOCAL_REPO_WORKFLOW.md) - Canonical and mirror clone workflow for local development
- [HARD_LAUNCH_RUNBOOK.md](./HARD_LAUNCH_RUNBOOK.md) - Production launch checklist and rollback process
- [CUSTOM_LLM_MODEL_PLAN.md](./CUSTOM_LLM_MODEL_PLAN.md) - Custom LLM model roadmap and dataset prep flow
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Complete deployment guide
- [DOMAIN_SETUP_GUIDE.md](./DOMAIN_SETUP_GUIDE.md) - DNS and domain setup
- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - API integration guide
- [VERCEL_API_SETUP.md](./VERCEL_API_SETUP.md) - API keys and configuration
- [AI_LLM_INTEGRATION.md](./AI_LLM_INTEGRATION.md) - AI integration architecture

## 🐛 Troubleshooting

### Build Errors

**Issue**: Build fails with module not found
```bash
# Solution: Clear cache and reinstall
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

**Issue**: TypeScript errors
```bash
# Solution: Clear Next.js cache
rm -rf .next
npm run build
```

### Runtime Errors

**Issue**: Wallet connection fails
- Ensure you have a Solana wallet installed (Phantom, Solflare)
- Check that RPC endpoint is accessible
- Verify network configuration (mainnet vs devnet)

**Issue**: API routes return 404
- Verify API routes exist in `app/api/`
- Check Vercel function logs
- Ensure environment variables are set

### DNS Issues

**Issue**: Domain not resolving
- Wait 24-48 hours for full DNS propagation
- Check DNS records in Namecheap
- Use [dnschecker.org](https://dnschecker.org) to verify

**Issue**: SSL certificate not issued
- Ensure DNS is fully propagated
- Check Vercel domain status
- Wait up to 24 hours for certificate issuance

## 📞 Support

- **Documentation**: Check the docs in the repository
- **Issues**: Open an issue on GitHub
- **Email**: support@tradehaxai.tech

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org)
- Styled with [Tailwind CSS](https://tailwindcss.com)
- Blockchain powered by [Solana](https://solana.com)
- Deployed on [Vercel](https://vercel.com)

---

**Built with ❤️ by the TradeHax AI Team**
