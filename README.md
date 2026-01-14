# DarkModder33 Portfolio & Solana dApp

This repository contains both a professional portfolio website and a Solana Counter dApp demonstrating blockchain development with Anchor, Web3.js, and Next.js.

## 🌐 Live Deployments

- **Solana dApp**: [https://anchor-web3js-nextjs-a9sl.vercel.app/](https://anchor-web3js-nextjs-a9sl.vercel.app/)
- **Portfolio Site**: [https://tradehaxai.tech](https://tradehaxai.tech)

## 📁 Repository Structure

```
├── frontend/           # Next.js Solana dApp Frontend
│   ├── app/           # App router pages and layouts
│   ├── components/    # React components for counter dApp
│   └── anchor-idl/    # Program IDL files
├── program/           # Solana Smart Contract (Anchor)
│   ├── programs/      # Rust source code
│   ├── tests/         # Program tests
│   └── Anchor.toml    # Anchor configuration
├── index.html         # Portfolio homepage (resume viewer)
├── about.html         # About page
├── projects.html      # Projects showcase
└── blog/             # Blog section
```

## 🎯 Solana Counter dApp

A beginner-friendly template demonstrating essential Solana development concepts:

### Features

- **Counter Program**: Increment/decrement operations with SOL transfers
- **PDAs (Program Derived Addresses)**: Global counter and user-specific vaults
- **CPIs (Cross-Program Invocations)**: SOL transfers using system program
- **Wallet Integration**: Phantom and Solflare wallet support
- **Real-time Updates**: Live counter updates on blockchain state changes

### Getting Started

#### Prerequisites

- Node.js 18+ and pnpm
- Rust and Solana CLI tools
- Anchor Framework

#### Install & Build Program

```bash
cd program
pnpm install
anchor build
anchor keys sync
anchor build
anchor deploy
```

If deployment times out, use a custom RPC endpoint:
```bash
anchor deploy --provider.cluster <your-custom-rpc>
```

#### Run Frontend

```bash
cd frontend
pnpm install
# Copy IDL files from program
cp ../program/target/idl/counter.json anchor-idl/idl.json
cp ../program/target/types/counter.ts anchor-idl/idl.ts
pnpm dev
```

Visit `http://localhost:3000` to interact with the dApp.

#### Test Program

```bash
cd program
anchor test
```

### Key Concepts

1. **PDAs**: Counter state and user vaults derived from seeds
2. **CPIs**: SOL transfers between user and vault
3. **Wallet Integration**: Transaction signing and account management
4. **State Management**: Real-time blockchain data updates

## 💼 Portfolio Website

Professional portfolio site featuring an interactive resume viewer.

### Local Development

```bash
# Start a local web server
python3 -m http.server 8080

# Visit http://localhost:8080
```

### Structure

- **Homepage** (`index.html`) - Interactive resume viewer with PDF download
- **About** (`about.html`) - About page
- **Projects** (`projects.html`) - Project showcase
- **Blog** (`blog/index.html`) - Blog section

### Assets

- `/assets/` - CSS styles and logo
- `/resume-images/` - Optimized responsive resume images
- `MichaelSFlahertyResume.pdf` - Resume PDF file

## 🔧 Developer Setup

### Git Hooks

This repository includes `.githooks` for automated tasks:

**Windows / PowerShell:**
```powershell
pwsh .\scripts\install-hooks.ps1
```

**POSIX (macOS / Linux / WSL):**
```bash
sh ./scripts/install-hooks.sh
```

**Manual setup:**
```bash
git config core.hooksPath .githooks
git add .githooks/pre-commit
git update-index --chmod=+x .githooks/pre-commit
```

## 📚 Learning Resources

### Solana Program Development
- `program/programs/counter/src/lib.rs` - Core program logic with PDAs and CPIs
- [Anchor Framework Documentation](https://www.anchor-lang.com/)
- [Solana Cookbook](https://solanacookbook.com/)

### Frontend Development
- `frontend/components/counter/` - dApp UI components
- `frontend/components/counter/hooks/` - Custom hooks for program interaction
- [Solana Web3.js Documentation](https://solana-labs.github.io/solana-web3.js/)

## 📜 License

This project is for educational purposes and set up for Solana devnet use only.

## 🚀 Deployment

- **Solana dApp**: Deployed to Vercel from `/frontend` directory
- **Portfolio**: Deployed to GitHub Pages from root directory

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.
