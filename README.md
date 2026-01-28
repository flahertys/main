# TradeHax AI - Automated Web3 Trading Platform

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black)](https://vercel.com)
[![Next.js](https://img.shields.io/badge/Next.js-15.4-black)](https://nextjs.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A sophisticated automated Web3 trading platform built with Next.js, React, and powered by Solana blockchain technology. Trade smarter with AI-driven insights and decentralized technology.

## 🌐 Live Deployments

- **Primary Domain**: [https://tradehaxai.tech](https://tradehaxai.tech)

## ✨ Features

- 🚀 **Modern Stack**: Built with Next.js 15.4, React 19, TypeScript
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
# Copy the sample environment file
cp sample.env .env.local

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

## 🌍 Deployment to Vercel

This project is configured for automatic deployment to https://tradehaxai.tech via Vercel and GitHub Actions.

### Automatic Deployment (Recommended)

**The project automatically deploys when you push to the `main` branch.**

Every push to `main` triggers:
1. GitHub Actions workflow runs
2. Code is built and tested
3. Deployed to Vercel production
4. Available at https://tradehaxai.tech

**Required Setup:**
- GitHub Secrets must be configured (see [GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md))
- DNS must be configured for custom domain (see [VERCEL_DOMAIN_SETUP.md](./VERCEL_DOMAIN_SETUP.md))

**Note:** This project uses GitHub Actions for deployment control. If you also have Vercel's automatic Git deployments enabled, you may want to disable them in Vercel Dashboard → Settings → Git to avoid duplicate deployments.

### 📚 Deployment Documentation

Comprehensive guides are available for setting up and troubleshooting deployments:

- **[DEPLOYMENT_QUICKSTART.md](./DEPLOYMENT_QUICKSTART.md)** - ⚡ Quick 5-step setup guide for immediate deployment
  - Fast setup in 15 minutes
  - Essential steps only
  - Quick verification checklist

- **[VERCEL_DOMAIN_SETUP.md](./VERCEL_DOMAIN_SETUP.md)** - Complete guide for configuring the custom domain `tradehaxai.tech`
  - Domain verification TXT record instructions
  - DNS configuration (A and CNAME records)
  - SSL certificate setup
  - Step-by-step Vercel dashboard configuration

- **[GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md)** - Guide for configuring GitHub Secrets for automated deployments
  - How to get VERCEL_TOKEN
  - How to get VERCEL_ORG_ID and VERCEL_PROJECT_ID
  - Testing the workflow
  - Security best practices

- **[VERCEL_DEPLOYMENT_TROUBLESHOOTING.md](./VERCEL_DEPLOYMENT_TROUBLESHOOTING.md)** - Comprehensive troubleshooting guide
  - Common deployment issues and solutions
  - Vercel dashboard health checks
  - DNS and SSL certificate problems
  - Emergency rollback procedures

### Quick Setup Checklist

To deploy this project to production:

- [ ] **Configure GitHub Secrets** (see [GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md))
  - Add `VERCEL_TOKEN`
  - Add `VERCEL_ORG_ID`
  - Add `VERCEL_PROJECT_ID`

- [ ] **Configure DNS** (see [VERCEL_DOMAIN_SETUP.md](./VERCEL_DOMAIN_SETUP.md))
  - Add domain verification TXT record: `_vercel` → `vc-domain-verify=tradehaxai.tech,9b1517380c738599577c`
  - Add A record: `@` → `76.76.21.21`
  - Add CNAME record: `www` → `cname.vercel-dns.com.`

- [ ] **Add Domain in Vercel Dashboard**
  - Add `tradehaxai.tech` in Settings → Domains
  - Wait for DNS propagation (5-60 minutes)
  - Verify SSL certificate is issued

- [ ] **Configure Environment Variables** (in Vercel Dashboard)
  - Set required production environment variables
  - See `.env.example` for all available variables

- [ ] **Push to Main Branch**
  - Commits to `main` automatically trigger deployment
  - Monitor deployment in GitHub Actions tab

### Manual Deployment via Vercel CLI (Alternative)

If you prefer manual deployment:

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Link Project** (first time only)
```bash
vercel link
```

4. **Deploy**
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

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
