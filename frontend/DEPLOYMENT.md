# TradeHax AI Deployment Guide

## Vercel Deployment (Recommended)

### Initial Setup
1. Push code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import `DarkModder33/main` repository
4. Set Root Directory to `frontend`
5. Framework Preset: Next.js
6. Click Deploy

### Environment Variables
Add these in Vercel Dashboard → Settings → Environment Variables:
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` (Google Analytics)
- `NEXT_PUBLIC_SOLANA_NETWORK=devnet`
- `NEXT_PUBLIC_APP_URL=https://tradehaxai.tech`

### Custom Domain Setup

#### For tradehaxai.tech:
1. In Vercel Dashboard → Settings → Domains
2. Add domain: `tradehaxai.tech`
3. Add domain: `www.tradehaxai.tech`
4. In your domain registrar (e.g., Namecheap, GoDaddy):
   - Add A record: `@` → `76.76.21.21`
   - Add CNAME record: `www` → `cname.vercel-dns.com`
5. Wait 24-48 hours for DNS propagation
6. Vercel will auto-provision SSL certificate

#### For tradehax.net redirect:
Option A - GitHub Pages redirect:
1. Keep current GitHub Pages setup
2. Update `index.html` in root:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Redirecting to TradeHax AI</title>
  <meta http-equiv="refresh" content="0; URL=https://tradehaxai.tech">
</head>
<body>
  <p>Redirecting to <a href="https://tradehaxai.tech">TradeHax AI</a>...</p>
</body>
</html>
```

Option B - DNS redirect in domain registrar

### Monitoring
- Enable Vercel Analytics in dashboard
- Monitor performance at: vercel.com/analytics
- Check error logs: vercel.com/logs

## Local Development
```bash
cd frontend
npm install
npm run dev
```
Visit http://localhost:3000

## Build & Type Check
```bash
# Build for production
npm run build

# Type check
npm run type-check

# Lint code
npm run lint
```

## Environment Setup
1. Copy `.env.example` to `.env.local`
2. Fill in your environment variables
3. Never commit `.env.local` to version control

## Troubleshooting

### Build Errors
- Ensure all dependencies are installed: `npm install`
- Clear Next.js cache: `rm -rf .next`
- Check TypeScript errors: `npm run type-check`

### Wallet Connection Issues
- Ensure you're on Solana devnet
- Check browser console for errors
- Verify wallet adapter is properly configured

### Performance Issues
- Enable Vercel Analytics for insights
- Check bundle size with `npm run analyze`
- Optimize images using Next.js Image component
