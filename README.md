# TradeHax Solana Programs

This directory contains the Solana smart contracts (programs) for the TradeHax DeFi gaming platform.

## 📁 Program Structure

```
programs/
├── Anchor.toml              # Anchor workspace configuration
├── deploy-mainnet.sh        # Mainnet deployment script
├── update-backend-config.js # Backend configuration updater
├── program-ids.json         # Deployed program IDs by network
├── clover-coins/           # CloverCoins token program
│   ├── src/lib.rs          # Main program logic
│   └── Cargo.toml          # Rust dependencies
├── staking-program/        # Staking and yield farming
│   ├── src/lib.rs          # Staking logic
│   └── Cargo.toml          # Rust dependencies
└── gaming-engine/          # Prediction markets and gaming
    ├── src/lib.rs          # Gaming logic
    └── Cargo.toml          # Rust dependencies
```

## 🚀 Programs Overview

### 1. CloverCoins Token Program
- **Purpose**: Native reward token for the platform
- **Features**:
  - SPL token standard compliance
  - Educational and gaming rewards
  - Deflationary burning mechanism
  - Cross-chain conversion support

### 2. Staking Program
- **Purpose**: Yield farming for CloverCoins holders
- **Features**:
  - Automated reward distribution
  - 12% APY staking rewards
  - Flexible staking/unstaking
  - Reward claiming system

### 3. Gaming Engine
- **Purpose**: Prediction markets and gaming mechanics
- **Features**:
  - Verifiable random outcomes
  - Prediction market creation
  - Automated payout distribution
  - Anti-cheat mechanisms

## 🛠️ Development Setup

### Prerequisites
- Rust 1.60+
- Solana CLI 1.14+
- Anchor Framework 0.25+
- Node.js 16+

### Installation
```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.14.0/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# Install dependencies
npm install
```

### Building Programs
```bash
# Build all programs
anchor build

# Or build individual programs
cd clover-coins && anchor build
cd ../staking-program && anchor build
cd ../gaming-engine && anchor build
```

### Testing
```bash
# Run tests
anchor test

# Run specific program tests
cd clover-coins && anchor test
```

## 🚀 Deployment to Mainnet

### Automated Deployment
```bash
# Make deployment script executable
chmod +x deploy-mainnet.sh

# Run deployment (requires SOL in wallet)
./deploy-mainnet.sh
```

### Manual Deployment Steps

1. **Configure Solana CLI**:
```bash
solana config set --url https://api.mainnet-beta.solana.com
solana config set --keypair ~/.config/solana/id.json
```

2. **Build programs**:
```bash
anchor build
```

3. **Deploy programs**:
```bash
# Deploy CloverCoins
solana program deploy target/deploy/clover_coins.so --final

# Deploy Staking Program
solana program deploy target/deploy/staking_program.so --final

# Deploy Gaming Engine
solana program deploy target/deploy/gaming_engine.so --final
```

4. **Update program IDs**:
```bash
# Update program-ids.json with actual deployed IDs
node update-backend-config.js
```

## ⚙️ Configuration

### Environment Variables
Update your `backend/.env` file with deployed program IDs:

```bash
# Solana Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_NETWORK=mainnet-beta

# Program IDs (update after deployment)
TRADEHAX_TOKEN_MINT=YourCloverCoinsMintAddress
CLOVER_COINS_TOKEN_MINT=YourCloverCoinsMintAddress
STAKING_PROGRAM_ID=YourStakingProgramId
GAMING_PROGRAM_ID=YourGamingEngineId

# Feature Flags
ENABLE_SOLANA_INTEGRATION=true
ENABLE_STAKING=true
ENABLE_GAMING=true
```

### Program IDs
Program IDs are stored in `program-ids.json` and automatically updated after deployment.

## 🔧 Program Management

### Initializing Programs

After deployment, initialize the programs:

```bash
# Initialize CloverCoins mint
# (Call initialize_mint instruction)

# Initialize staking pool
# (Call initialize_pool instruction with reward rate)

# Create initial gaming markets
# (Call initialize_game instructions)
```

### Upgrading Programs
```bash
# Build new version
anchor build

# Deploy upgrade
solana program deploy target/deploy/program.so --program-id <PROGRAM_ID>
```

## 📊 Monitoring & Analytics

### Program Metrics
- Transaction volume
- Active users
- TVL (Total Value Locked)
- Reward distribution

### Health Checks
```bash
# Check program status
solana program show <PROGRAM_ID>

# Monitor logs
solana logs <PROGRAM_ID>
```

## 🔐 Security

### Audit Status
- ✅ Code review completed
- ✅ Formal verification planned
- ✅ Bug bounty program active

### Security Features
- Access control with PDAs
- Rate limiting on instructions
- Input validation
- Event logging for transparency

## 📞 Support

### Documentation
- [Anchor Framework Docs](https://www.anchor-lang.com/)
- [Solana Program Library](https://spl.solana.com/)
- [TradeHax API Docs](../backend/README.md)

### Getting Help
- Create GitHub issues for bugs
- Join Discord for community support
- Check deployment logs for errors

---

## 🎯 Success Metrics

After mainnet deployment, track:

- **Program Usage**: Transactions per day
- **User Adoption**: Active wallets interacting
- **Economic Activity**: Tokens staked, rewards claimed
- **Gaming Volume**: Prediction markets created, bets placed

**Target**: 1,000+ active users and $100K+ TVL within 3 months of launch.
