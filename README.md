# TradeHax AI - Web3 Trading Platform

Advanced automated trading platform powered by Solana blockchain and AI.

## 🌐 Live Deployments

- **Production**: [https://tradehaxai.tech](https://tradehaxai.tech) ⭐ Main Domain
- **Vercel URL**: [https://shamrockstocks-github-io.vercel.app](https://shamrockstocks-github-io.vercel.app)

> Note: Both URLs point to the same deployment. tradehaxai.tech is the primary custom domain.

## 🚀 Features
- **Solana Integration**: Lightning-fast blockchain transactions
- **Wallet Connection**: Seamless Phantom, Solflare, and more
- **Real-time Trading**: Execute trades on Solana devnet
- **Professional UI**: Built with Next.js 15, React 19, TailwindCSS
- **SEO Optimized**: Full meta tags, Open Graph, Twitter Cards
- **Analytics Ready**: Google Analytics & Vercel Analytics support

## 📁 Project Structure
```
├── app/
│   ├── layout.tsx          # Root layout with SEO metadata
│   ├── page.tsx             # Landing page
│   └── dashboard/
│       └── page.tsx         # Trading dashboard
├── components/
│   ├── counter/             # Solana counter demo components
│   ├── dashboard/           # Dashboard components
│   ├── landing/             # Landing page components
│   └── ui/                  # Reusable UI components
├── lib/
│   ├── analytics.ts         # Analytics helpers
│   └── utils.ts             # Utility functions
├── types/
│   └── index.ts             # TypeScript type definitions
├── anchor-idl/
│   └── idl.json             # Solana program IDL
├── program/                 # Solana Smart Contract (Anchor)
│   ├── programs/            # Rust source code
│   ├── tests/               # Program tests
│   └── Anchor.toml          # Anchor configuration
└── portfolio/               # Legacy portfolio site (HTML)
```

## 🛠️ Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS 4
- **Blockchain**: Solana Web3.js, Anchor
- **UI Components**: Radix UI, shadcn/ui
- **Wallet**: Solana Wallet Adapter

## 📦 Installation
```bash
npm install
```

## 🏃 Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

## 🌐 Deployment

See [DOMAIN_SETUP_GUIDE.md](./DOMAIN_SETUP_GUIDE.md) for connecting to tradehaxai.tech domain.
See [MONETIZATION_GUIDE.md](./MONETIZATION_GUIDE.md) for revenue generation setup.

**Quick Deploy to Vercel:**
1. Push to GitHub
2. Import to Vercel
3. Deploy! (Root directory is already set correctly)

## 💰 Monetization Features

This platform includes multiple revenue streams:

1. **Google Analytics** - Track user behavior and optimize conversions
2. **Google AdSense** - Display advertising revenue
3. **Email Marketing** - Collect leads via EmailCapture component
4. **Affiliate Marketing** - Earn commissions from crypto exchange referrals
5. **Solana Fees** - Transaction fees from dApp usage

See [MONETIZATION_GUIDE.md](./MONETIZATION_GUIDE.md) for complete setup instructions.

## 🧪 Testing
```bash
# Type check
npm run type-check

# Lint
npm run lint

# Build
npm run build
```

## 🎓 For Students
This project demonstrates:
- Modern Web3 development practices
- Next.js 15 App Router
- Solana blockchain integration
- Production-ready architecture
- SEO best practices
- Professional UI/UX design

Perfect for college portfolios and real-world business applications.

## 🙏 Credits
The Solana counter dApp components are based on the [solana-developers/anchor-web3js-nextjs](https://github.com/solana-developers/anchor-web3js-nextjs) educational template created by the Solana Foundation.

## 📝 License
MIT

## 🤝 Support
Email: support@tradehaxai.tech
GitHub: [DarkModder33/main](https://github.com/DarkModder33/main)
