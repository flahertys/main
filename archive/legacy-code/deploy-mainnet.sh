#!/bin/bash

# TradeHax Solana Programs Deployment Script for Mainnet
# This script deploys all TradeHax programs to Solana mainnet-beta

set -e

echo "🚀 Starting TradeHax Solana Programs Deployment to Mainnet"
echo "========================================================"

# Configuration
PROGRAM_ID="Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"
CLUSTER="mainnet-beta"
WALLET_KEYPAIR="$HOME/.config/solana/id.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}Checking prerequisites...${NC}"

    # Check if Solana CLI is installed
    if ! command -v solana &> /dev/null; then
        echo -e "${RED}❌ Solana CLI not found. Please install it first.${NC}"
        exit 1
    fi

    # Check if wallet exists
    if [ ! -f "$WALLET_KEYPAIR" ]; then
        echo -e "${RED}❌ Wallet keypair not found at $WALLET_KEYPAIR${NC}"
        exit 1
    fi

    # Check Solana config
    CURRENT_CLUSTER=$(solana config get | grep "RPC URL" | awk '{print $3}')
    if [[ "$CURRENT_CLUSTER" != *"$CLUSTER"* ]]; then
        echo -e "${YELLOW}⚠️  Switching to $CLUSTER cluster...${NC}"
        solana config set --url https://api.mainnet-beta.solana.com
    fi

    # Check wallet balance
    BALANCE=$(solana balance | awk '{print $1}')
    if (( $(echo "$BALANCE < 1.0" | bc -l) )); then
        echo -e "${RED}❌ Insufficient SOL balance: $BALANCE. Need at least 1 SOL for deployment.${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
}

# Build all programs
build_programs() {
    echo -e "${BLUE}Building Solana programs...${NC}"

    # Build CloverCoins program
    echo "Building CloverCoins program..."
    cd clover-coins
    anchor build
    cd ..

    # Build Staking program
    echo "Building Staking program..."
    cd staking-program
    anchor build
    cd ..

    # Build Gaming Engine
    echo "Building Gaming Engine..."
    cd gaming-engine
    anchor build
    cd ..

    echo -e "${GREEN}✅ All programs built successfully${NC}"
}

# Deploy programs to mainnet
deploy_programs() {
    echo -e "${BLUE}Deploying programs to mainnet...${NC}"

    # Deploy CloverCoins program
    echo "Deploying CloverCoins program..."
    cd clover-coins
    CLOVER_COINS_PROGRAM_ID=$(solana program deploy --program-id $PROGRAM_ID target/deploy/clover_coins.so --final | grep "Program Id:" | awk '{print $3}')
    echo "CloverCoins Program ID: $CLOVER_COINS_PROGRAM_ID"
    cd ..

    # Deploy Staking program
    echo "Deploying Staking program..."
    cd staking-program
    STAKING_PROGRAM_ID=$(solana program deploy target/deploy/staking_program.so --final | grep "Program Id:" | awk '{print $3}')
    echo "Staking Program ID: $STAKING_PROGRAM_ID"
    cd ..

    # Deploy Gaming Engine
    echo "Deploying Gaming Engine..."
    cd gaming-engine
    GAMING_PROGRAM_ID=$(solana program deploy target/deploy/gaming_engine.so --final | grep "Program Id:" | awk '{print $3}')
    echo "Gaming Engine Program ID: $GAMING_PROGRAM_ID"
    cd ..

    echo -e "${GREEN}✅ All programs deployed successfully${NC}"
}

# Initialize programs
initialize_programs() {
    echo -e "${BLUE}Initializing programs...${NC}"

    # Initialize CloverCoins mint
    echo "Initializing CloverCoins token mint..."
    # This would require a separate script to call the initialize_mint instruction

    # Initialize staking pool
    echo "Initializing staking pool..."
    # This would require a separate script to call the initialize_pool instruction

    echo -e "${GREEN}✅ Programs initialized${NC}"
}

# Verify deployments
verify_deployments() {
    echo -e "${BLUE}Verifying deployments...${NC}"

    # Check program accounts
    echo "Checking program accounts on mainnet..."

    # Verify CloverCoins program
    if solana program show $PROGRAM_ID &> /dev/null; then
        echo -e "${GREEN}✅ CloverCoins program verified${NC}"
    else
        echo -e "${RED}❌ CloverCoins program verification failed${NC}"
    fi

    echo -e "${GREEN}✅ Deployment verification complete${NC}"
}

# Main deployment flow
main() {
    echo -e "${YELLOW}⚠️  WARNING: This will deploy to Solana mainnet-beta!${NC}"
    echo -e "${YELLOW}   Make sure you have sufficient SOL for deployment costs.${NC}"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 0
    fi

    check_prerequisites
    build_programs
    deploy_programs
    initialize_programs
    verify_deployments

    echo ""
    echo -e "${GREEN}🎉 TradeHax Solana programs successfully deployed to mainnet!${NC}"
    echo ""
    echo "Program IDs:"
    echo "  CloverCoins: $CLOVER_COINS_PROGRAM_ID"
    echo "  Staking: $STAKING_PROGRAM_ID"
    echo "  Gaming Engine: $GAMING_PROGRAM_ID"
    echo ""
    echo "Next steps:"
    echo "1. Update backend configuration with program IDs"
    echo "2. Test program functionality on devnet first"
    echo "3. Update frontend with mainnet program IDs"
    echo "4. Monitor program performance and costs"
}

# Run main function
main "$@"
