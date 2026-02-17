---
description: Repository Information Overview
alwaysApply: true
---

# TradeHax Information

## Summary
TradeHax is a Web3-focused project aimed at providing AI insights, portfolio tools, and NFT gaming. It leverages Solana RPC integration and is designed for crypto-native users. The project draws inspiration from Tesla and xAI's minimalist, tech-forward aesthetics, prioritizing dark themes, immersive visuals, and AI-driven interactive elements.

## Structure
- **lib/**: Contains core utilities and logic, such as security and rate limiting.
- **.zencoder/ / .zenflow/**: Configuration and workflow definitions for AI-assisted development.
- **Root**: Contains project reports, deployment readiness checklists, and strategy documents.

## Language & Runtime
**Language**: TypeScript  
**Version**: ESNext (implied by Next.js usage)  
**Build System**: Next.js (planned/targeted)  
**Package Manager**: npm/pnpm (implied by Node.js environment)

## Dependencies
**Main Dependencies**:
- `next`: Web framework (referenced in `lib/security.ts` and docs)
- `solana/web3.js`: Blockchain integration (planned)
- `three.js`: WebGL visuals for immersive elements (planned)
- `tailwind-merge` / `clsx`: Aesthetic styling (referenced in docs)

**Development Dependencies**:
- `typescript`: Type safety
- `tailwindcss`: Utility-first CSS framework

## Build & Installation
```bash
# Typical installation for this project type
npm install
# Typical development command
npm run dev
# Typical build command
npm run build
```

## Usage & Operations
**Key Strategies**:
- **Monetization**: Freemium models with AI insights, affiliate partnerships, and in-app sales for NFT gaming.
- **Deployment**: Targeted for Vercel with Namecheap DNS configuration (A record to 76.76.21.21).

## Testing
**Framework**: Jest or Vitest (typical for Next.js projects)
**Test Location**: Likely `__tests__` or `*.test.ts` files within components/lib.
**Run Command**:
```bash
npm test
```

## Security
**Features**:
- **Rate Limiting**: Implemented in `lib/security.ts` using a memory-based store with support for custom limits and trusted origin verification.
- **Validation**: Sanitization of plain text and validation of ISO date strings and numbers.
